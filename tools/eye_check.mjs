#!/usr/bin/env node
// Eyes, measured: every character's eyes from the texture as it lies on the face, in millimetres.
//
//   node tools/eye_check.mjs <character|a,b|all> [--out <dir>] [--zoom] [--no-src] [--no-fix] [--calibrate] [--no-overlay]
//                            [--glb-dir <dir>]
// (--glb-dir measures <dir>/<name>.glb instead of the shipped one; the source is measured with the character's "eyes"
// fix applied, as the build makes it, unless --no-fix; --calibrate prints the calibration of RULE on CALIB)
//   tools/chrome_slot.sh node tools/eye_check.mjs <names> --shots <dir> [--base http://127.0.0.1:5190]
//   node tools/eye_check.mjs <names> --before-after <before_dir>,<after_dir>,<out.jpg> [--at name:x,y]
//   node tools/eye_check.mjs <name> --seam <after.glb>,<before.glb>,<x:y:w:h>   (the colour step round an eye island)
//   node tools/eye_check.mjs <name> --recolour-face <base.glb>,<out.glb>   (a recolour's texels on the face)
//
// For each character, the shipped GLB (web/public/assets/chars/<name>.glb, meshopt, webp 512) and the full-resolution
// source texture tools/build_character.mjs starts from (the rigged GLB's):
//   1. the body (no prop_/tack_ parts) in its rest pose, rendered orthographically along the head's forward axis
//      (origin the Head joint, forward to the headfront marker, up the world's up) at 0.25 mm a pixel, so every pixel
//      of the face knows its texel, its triangle and its depth (hat brims 25 mm in front of the face left out);
//   2. the skin tone (median of the face's warm mid-light texels);
//   3. the eyes: a pair of dark blobs mirrored about the midline, with skin between and below them, the brow pair
//      (the compact pair with another 6-35 mm under it) told apart;
//   4. each eye measured: iris, the lid outline (lid-dark and sclera texels joined to the iris), width, height,
//      aspect, the lid's reach past the iris, the sclera fraction, eye/face width, left/right agreement;
//   5. the verdict (RULE, calibrated on CALIB: see below) and the calibration's margins.
// --out writes eyes.json, faces.jpg (the projected faces, eye outlines green, iris red, brows blue, measured texels
// tinted: lid red, sclera cyan) and table.md. Exported functions are the measuring half of the eye fix
// (tools/eye_fix.mjs, run by build_character.mjs --eyes).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.resolve(ROOT, p);
let IO = null;
export async function getIO() { return io(); }
async function io() {
  if (IO) return IO;
  await MeshoptDecoder.ready;
  IO = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  return IO;
}

// ---------------------------------------------------------------- column-major mat4
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k]; o[c * 4 + rr] = s; }
  return o;
}
function compose(t, q, s) {
  const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0, (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1];
}
const xf = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };

// ---------------------------------------------------------------- which files a character is
export function charFiles(name) {
  const cfg = JSON.parse(fs.readFileSync(r(`characters/${name}.json`), 'utf8'));
  const base = cfg.body_from ? JSON.parse(fs.readFileSync(r(`characters/${cfg.body_from}.json`), 'utf8')) : cfg;
  const baseName = cfg.body_from || name;
  const rigDir = base.rig_dir || `gen/characters/${baseName}/meshy/3_rig`;
  return { name, cfg, base: cfg.body_from || null, rigged: `${rigDir}/result_rigged_character_glb_url.glb`, glb: `web/public/assets/chars/${name}.glb` };
}

// ---------------------------------------------------------------- the body in its rest pose, and the head's frame
// Every vertex goes to world space through the bind (W_head . IBM_head, the same for every joint at rest), so the
// shipped GLB (quantized, its IBMs rescaled) and the source give the same metres.
export function bodyGeom(doc) {
  const root = doc.getRoot();
  const node = root.listNodes().find((n) => n.getMesh() && n.getSkin() && !/^(prop_|tack_)/.test(n.getName()) && !/^(prop_|tack_)/.test(n.getMesh().getName()));
  const mesh = node.getMesh(), prim = mesh.listPrimitives()[0], skin = node.getSkin();
  const W = new Map();
  const walk = (n, parent) => { const m = mul(parent, compose(n.getTranslation(), n.getRotation(), n.getScale())); W.set(n, m); n.listChildren().forEach((c) => walk(c, m)); };
  for (const sc of root.listScenes()) sc.listChildren().forEach((c) => walk(c, I4()));
  const joints = skin.listJoints(), ibmA = skin.getInverseBindMatrices();
  const hi = joints.findIndex((j) => j.getName() === 'Head');
  const ibm = (i) => { const e = new Array(16); ibmA.getElement(i, e); return e; };
  const B = mul(W.get(joints[hi]), ibm(hi));
  const Pa = prim.getAttribute('POSITION'), Ta = prim.getAttribute('TEXCOORD_0');
  const n = Pa.getCount(), P = new Float64Array(n * 3), T = new Float64Array(n * 2), e3 = [0, 0, 0], e2 = [0, 0];
  for (let i = 0; i < n; i++) { Pa.getElement(i, e3); const w = xf(B, e3); P.set(w, i * 3); Ta.getElement(i, e2); T[i * 2] = e2[0]; T[i * 2 + 1] = e2[1]; }
  const idx = prim.getIndices() ? Array.from(prim.getIndices().getArray()) : Array.from({ length: n }, (_, i) => i);
  // the frame: origin the Head joint, forward towards the headfront marker (level), up the world's up. The Head bone's
  // own axes are the rigger's choice (scholar's and sightseer's point forward), the markers are not.
  const jpos = (nm) => { const m = W.get(joints.find((j) => j.getName() === nm)); return [m[12], m[13], m[14]]; };
  const o = jpos('Head');
  const up = [0, 1, 0];
  const fwd = norm(sub(jpos('headfront'), o).map((x, k) => (k === 1 ? 0 : x)));
  const right = cross(up, fwd);   // the character's left: the viewer's right, so the face image is as seen from the front
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 1; i < P.length; i += 3) { y0 = Math.min(y0, P[i]); y1 = Math.max(y1, P[i]); }
  const jw = Object.fromEntries(joints.map((j) => { const m = W.get(j); return [j.getName(), [m[12], m[13], m[14]]]; }));
  return { prim, P, T, idx, joints: jw, frame: { o, up, fwd, right }, height: y1 - y0, tex: prim.getMaterial().getBaseColorTexture() };
}

export async function decodeTex(tex) {
  const { data, info } = await sharp(Buffer.from(tex.getImage())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}
// bilinear, glTF uv (v down the image)
function sampleTex(t, u, v, out) {
  const x = u * t.W - 0.5, y = v * t.H - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const cx = (q) => Math.min(t.W - 1, Math.max(0, q)), cy = (q) => Math.min(t.H - 1, Math.max(0, q));
  const a = (cy(y0) * t.W + cx(x0)) * 3, b = (cy(y0) * t.W + cx(x0 + 1)) * 3, c = (cy(y0 + 1) * t.W + cx(x0)) * 3, d = (cy(y0 + 1) * t.W + cx(x0 + 1)) * 3;
  for (let k = 0; k < 3; k++) out[k] = ((t.data[a + k] * (1 - fx) + t.data[b + k] * fx) * (1 - fy) + (t.data[c + k] * (1 - fx) + t.data[d + k] * fx) * fy) / 255;
  return out;
}

// ---------------------------------------------------------------- the face, seen from the front, in mm
// An orthographic render of the body along the head's forward axis, nearest surface wins. Pixel (i, j) is at
// x = X0 + (i + 0.5) * MM, y = Y1 - (j + 0.5) * MM (mm from the Head joint, x to the viewer's right, y up).
export const MM = 0.25, X0 = -130, X1 = 130, Y0 = -60, Y1 = 320;
export function faceRender(g, t) {
  const Wd = Math.round((X1 - X0) / MM), Hd = Math.round((Y1 - Y0) / MM);
  const { o, up, fwd, right } = g.frame, P = g.P, T = g.T, idx = g.idx;
  const nv = P.length / 3, X = new Float64Array(nv), Y = new Float64Array(nv), Z = new Float64Array(nv);
  for (let i = 0; i < nv; i++) {
    const d = [P[i * 3] - o[0], P[i * 3 + 1] - o[1], P[i * 3 + 2] - o[2]];
    X[i] = dot(d, right) * 1000; Y[i] = dot(d, up) * 1000; Z[i] = dot(d, fwd) * 1000;
  }
  // a hat brim or a sleeve in front of the face is not the face: surfaces more than 25 mm in front of the nose-mouth
  // region's front are left out
  let zFace = -Infinity;
  for (let i = 0; i < nv; i++) if (Math.abs(X[i]) < 25 && Y[i] > 20 && Y[i] < 110) zFace = Math.max(zFace, Z[i]);
  const zCut = zFace + 25;
  const depth = new Float32Array(Wd * Hd).fill(-Infinity), U = new Float32Array(Wd * Hd), V = new Float32Array(Wd * Hd);
  const NF = new Float32Array(Wd * Hd), TRI = new Int32Array(Wd * Hd).fill(-1);
  for (let f = 0; f < idx.length; f += 3) {
    const a = idx[f], b = idx[f + 1], c = idx[f + 2];
    const n = norm(cross([X[b] - X[a], Y[b] - Y[a], Z[b] - Z[a]], [X[c] - X[a], Y[c] - Y[a], Z[c] - Z[a]]));
    if (n[2] <= 0.02) continue;   // faces away from the viewer
    if (Math.max(Z[a], Z[b], Z[c]) > zCut) continue;
    const px = [a, b, c].map((v) => (X[v] - X0) / MM - 0.5), py = [a, b, c].map((v) => (Y1 - Y[v]) / MM - 0.5);
    const i0 = Math.max(0, Math.floor(Math.min(...px))), i1 = Math.min(Wd - 1, Math.ceil(Math.max(...px)));
    const j0 = Math.max(0, Math.floor(Math.min(...py))), j1 = Math.min(Hd - 1, Math.ceil(Math.max(...py)));
    if (i0 > i1 || j0 > j1) continue;
    const den = (py[1] - py[2]) * (px[0] - px[2]) + (px[2] - px[1]) * (py[0] - py[2]);
    if (Math.abs(den) < 1e-12) continue;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const l1 = ((py[1] - py[2]) * (i - px[2]) + (px[2] - px[1]) * (j - py[2])) / den;
      const l2 = ((py[2] - py[0]) * (i - px[2]) + (px[0] - px[2]) * (j - py[2])) / den;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const z = l1 * Z[a] + l2 * Z[b] + l3 * Z[c], k = j * Wd + i;
      if (z <= depth[k]) continue;
      depth[k] = z; NF[k] = n[2]; TRI[k] = f;
      U[k] = l1 * T[a * 2] + l2 * T[b * 2] + l3 * T[c * 2]; V[k] = l1 * T[a * 2 + 1] + l2 * T[b * 2 + 1] + l3 * T[c * 2 + 1];
    }
  }
  const rgb = new Float32Array(Wd * Hd * 3), tmp = [0, 0, 0];
  for (let k = 0; k < Wd * Hd; k++) if (TRI[k] >= 0) { sampleTex(t, U[k], V[k], tmp); rgb[k * 3] = tmp[0]; rgb[k * 3 + 1] = tmp[1]; rgb[k * 3 + 2] = tmp[2]; }
  return { Wd, Hd, depth, U, V, NF, TRI, rgb, XV: X, YV: Y, ZV: Z, zFace, zCut };
}

export async function imageOf(fr, { x0 = X0, x1 = X1, y0 = Y0, y1 = Y1 } = {}) {
  const i0 = Math.round((x0 - X0) / MM), i1 = Math.round((x1 - X0) / MM), j0 = Math.round((Y1 - y1) / MM), j1 = Math.round((Y1 - y0) / MM);
  const w = i1 - i0, h = j1 - j0, out = Buffer.alloc(w * h * 3);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j + j0) * fr.Wd + (i + i0), q = (j * w + i) * 3;
    if (fr.TRI[k] < 0) { out[q] = 40; out[q + 1] = 40; out[q + 2] = 48; continue; }
    for (let c = 0; c < 3; c++) out[q + c] = Math.round(fr.rgb[k * 3 + c] * 255);
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } });
}


// ---------------------------------------------------------------- colour helpers
export const lumOf = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
export function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-6) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, mx > 0 ? d / mx : 0, mx];
}
const median = (a) => { const s = Float64Array.from(a).sort(); return s.length ? s[s.length >> 1] : NaN; };
export const pxOf = (x) => Math.round((x - X0) / MM - 0.5), pyOf = (y) => Math.round((Y1 - y) / MM - 0.5);
export const xOf = (i) => X0 + (i + 0.5) * MM, yOf = (j) => Y1 - (j + 0.5) * MM;

// ---------------------------------------------------------------- the face's skin tone
// The median colour of the warm, mid-light, front-facing texels of the face's middle, then again over the texels near
// that first median (hair, hats, beards and ink fall out).
export function skinTone(fr) {
  const { Wd, rgb, NF, TRI } = fr;
  const cand = [];
  for (let j = pyOf(200); j <= pyOf(0); j++) for (let i = pxOf(-60); i <= pxOf(60); i++) {
    const k = j * Wd + i;
    if (TRI[k] < 0 || NF[k] < 0.6) continue;
    const c = [rgb[k * 3], rgb[k * 3 + 1], rgb[k * 3 + 2]], [h, s, v] = hsv(...c);
    if ((h <= 55 || h >= 345) && s >= 0.06 && s <= 0.75 && v >= 0.35) cand.push(c);
  }
  let m = [0, 1, 2].map((ch) => median(cand.map((c) => c[ch])));
  const near = cand.filter((c) => Math.hypot(c[0] - m[0], c[1] - m[1], c[2] - m[2]) < 0.12);
  m = [0, 1, 2].map((ch) => median(near.map((c) => c[ch])));
  const [h, sat, val] = hsv(...m);
  return { rgb: m, lum: lumOf(m), hue: h, sat, val, n: near.length };
}

// ---------------------------------------------------------------- ink blobs
// Ink: texels darker than the skin by INK (as a fraction of the skin's luminance), on the front of the face.
export const INK = 0.38;
export function inkComponents(fr, skin, { x0 = -95, x1 = 95, y0 = 0, y1 = 240, ink = INK } = {}) {
  const { Wd, rgb, NF, TRI } = fr;
  const i0 = pxOf(x0), i1 = pxOf(x1), j0 = pyOf(y1), j1 = pyOf(y0), w = i1 - i0 + 1, h = j1 - j0 + 1;
  const D = new Float32Array(w * h), lab = new Int32Array(w * h).fill(0);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j + j0) * Wd + (i + i0);
    if (TRI[k] < 0 || NF[k] < 0.45) { D[j * w + i] = -1; continue; }
    D[j * w + i] = 1 - lumOf([rgb[k * 3], rgb[k * 3 + 1], rgb[k * 3 + 2]]) / skin.lum;
  }
  const comps = [];
  const stack = new Int32Array(w * h);
  for (let q = 0; q < w * h; q++) {
    if (lab[q] || D[q] < ink) continue;
    const id = comps.length + 1;
    let sp = 0; stack[sp++] = q; lab[q] = id;
    const c = { id, n: 0, sx: 0, sy: 0, sd: 0, snf: 0, imin: Infinity, imax: -Infinity, jmin: Infinity, jmax: -Infinity, px: [] };
    while (sp) {
      const p = stack[--sp], pi = p % w, pj = (p / w) | 0;
      c.n++; c.sx += pi; c.sy += pj; c.sd += D[p]; c.snf += NF[(pj + j0) * Wd + pi + i0]; c.px.push(p);
      c.imin = Math.min(c.imin, pi); c.imax = Math.max(c.imax, pi); c.jmin = Math.min(c.jmin, pj); c.jmax = Math.max(c.jmax, pj);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ni = pi + di, nj = pj + dj;
        if (ni < 0 || nj < 0 || ni >= w || nj >= h) continue;
        const nq = nj * w + ni;
        if (!lab[nq] && D[nq] >= ink) { lab[nq] = id; stack[sp++] = nq; }
      }
    }
    // in mm
    Object.assign(c, {
      area: c.n * MM * MM, cx: xOf(c.sx / c.n + i0), cy: yOf(c.sy / c.n + j0), dark: c.sd / c.n, nf: c.snf / c.n,
      x0: xOf(c.imin + i0) - MM / 2, x1: xOf(c.imax + i0) + MM / 2, y1: yOf(c.jmin + j0) + MM / 2, y0: yOf(c.jmax + j0) - MM / 2,
    });
    c.w = c.x1 - c.x0; c.h = c.y1 - c.y0;
    comps.push(c);
  }
  return { comps, D, lab, i0, j0, w, h };
}


// ---------------------------------------------------------------- the eyes: a pair of dark blobs mirrored about the midline
// Candidates are blobs of one threshold paired left/right: level (dy <= 7 mm), mirrored (midpoint within 20 mm of the
// Head joint's line), apart (centres 35-110 mm, inner ends >= 12 mm apart: a moustache's halves nearly touch) and
// alike (areas within 3.5x). An eye pair is compact (filled >= 0.45 of its box, at most 2.4 wide per high, >= 12 mm2
// each); a compact pair with another compact pair 6-35 mm below it is a brow pair, and the highest pair left is the
// eyes. The threshold rises (0.38, 0.5, 0.62 of the skin's luminance) until a pair is found: dark-browed or fringed
// faces merge eye and hair at the lowest one.
const overlapX = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0;
export function mirroredPairs(comps) {
  const big = comps.filter((c) => c.area >= 4 && c.w < 60 && c.h < 40);
  const out = [];
  for (const a of big) for (const b of big) {
    if (a.cx >= b.cx) continue;
    const sep = b.cx - a.cx, mid = (a.cx + b.cx) / 2;
    if (sep < 24 || sep > 110 || Math.abs(mid) > 20 || Math.abs(a.cy - b.cy) > 7 || a.x1 > mid || b.x0 < mid) continue;
    const ratio = Math.max(a.area, b.area) / Math.min(a.area, b.area);
    if (ratio > 3.5) continue;
    out.push({ a, b, sep, mid, gap: b.x0 - a.x1, cy: (a.cy + b.cy) / 2, ratio, minArea: Math.min(a.area, b.area),
      fill: Math.min(a.area / (a.w * a.h), b.area / (b.w * b.h)), elong: Math.max(a.w / a.h, b.w / b.h) });
  }
  return out.sort((p, q) => q.cy - p.cy);
}
// skin-like: within 0.25 of the skin's luminance and 30 degrees of its hue
export function skinLike(skin, c) {
  const D = 1 - lumOf(c) / skin.lum, [h, sat] = hsv(...c);
  const dh = Math.min(Math.abs(h - skin.hue), 360 - Math.abs(h - skin.hue));
  return Math.abs(D) <= 0.25 && (dh <= 30 || sat < 0.08);
}
// the fraction of skin-like texels in a box (mm)
export function skinFrac(fr, skin, x0, x1, y0, y1) {
  let n = 0, k = 0;
  for (let j = pyOf(y1); j <= pyOf(y0); j++) for (let i = pxOf(x0); i <= pxOf(x1); i++) {
    const q = j * fr.Wd + i;
    if (i < 0 || j < 0 || i >= fr.Wd || j >= fr.Hd) continue;
    n++;
    if (fr.TRI[q] >= 0 && skinLike(skin, [fr.rgb[q * 3], fr.rgb[q * 3 + 1], fr.rgb[q * 3 + 2]])) k++;
  }
  return n ? k / n : 0;
}
export function detectEyes(fr, skin) {
  for (const T of [0.38, 0.5, 0.62]) {
    const ic = inkComponents(fr, skin, { ink: T });
    const pairs = mirroredPairs(ic.comps);
    const eyeish = pairs.filter((p) => p.minArea >= 12 && p.fill >= 0.4 && p.elong <= 4.5 && p.gap >= 12 && p.sep >= 35 && Math.min(p.a.nf, p.b.nf) >= 0.6
      && skinFrac(fr, skin, p.a.x1 + 2, p.b.x0 - 2, p.cy - 2, p.cy + 2) >= 0.5
      && [p.a, p.b].every((c) => skinFrac(fr, skin, c.x0, c.x1, c.y0 - 12, c.y0 - 4) >= 0.5));
    const browOf = (p, q) => p.cy - q.cy >= 6 && p.cy - q.cy <= 35 && overlapX(p.a, q.a) && overlapX(p.b, q.b);
    const cands = eyeish.filter((p) => !eyeish.some((q) => q !== p && browOf(p, q)));
    if (!cands.length) continue;
    // among the highest candidate and those level with it (within 8 mm), the biggest pair (the irises, not the lid
    // strokes beside them), then the better mirrored
    const level = cands.filter((p) => cands[0].cy - p.cy < 8);
    const big = Math.max(...level.map((p) => p.minArea));
    const eyes = level.filter((p) => p.minArea >= 0.6 * big).sort((p, q) => Math.abs(p.mid) + 5 * (p.ratio - 1) - (Math.abs(q.mid) + 5 * (q.ratio - 1)))[0];
    // each eye's brow: the nearest blob above it (any shape) that overlaps it across, within 40 mm
    const browFor = (e) => ic.comps.filter((c) => c !== e && c.area >= 4 && c.y0 > e.y1 - 1 && c.y0 - e.y1 < 40 && overlapX(c, e))
      .sort((p, q) => p.y0 - q.y0)[0] || null;
    // an eye found above the lowest threshold may sit inside a big dark blob there (a fringe or a hat's shadow over it)
    let merged = [false, false], blob0 = [null, null];
    if (T > INK) {
      const ic0 = inkComponents(fr, skin, { ink: INK });
      [eyes.a, eyes.b].forEach((c, k) => {
        const li = pxOf(c.cx) - ic0.i0, lj = pyOf(c.cy) - ic0.j0, l = ic0.lab[lj * ic0.w + li];
        const b = l ? ic0.comps[l - 1] : null;
        merged[k] = !!b && (b.area > 4 * c.area || b.w > 45 || b.h > 35);
        if (merged[k]) blob0[k] = { ic: ic0, id: l };
      });
    }
    return { T, ic, pair: eyes, brows: [browFor(eyes.a), browFor(eyes.b)], pairs, merged, blob0 };
  }
  return null;
}

// ---------------------------------------------------------------- one eye, measured
// iris: the columns of the dark core at least half as tall as its tallest column.
// lid: the core grown through texels at least LID darker than the skin, along a band from 3 mm under the core to
//   3 mm over it (never into the brow's half of the gap, never into another blob).
// sclera: texels lighter than the skin and less saturated (val >= skin, sat <= 0.7 skin) joined to the lid region,
//   within the core's height +-2 mm.
// outline = lid + sclera: width, height, aspect; reach = how far the outline runs past the iris (both sides summed);
// sclera fraction = sclera texels in the outline's inscribed ellipse / that ellipse.
export const LID = 0.12;
export function measureEye(fr, skin, det, core0, brow) {
  const { ic } = det, { Wd, rgb, NF, TRI } = fr;
  // the eye's parts: the paired blob and the blobs beside it at the same threshold (an iris and its lid strokes split by
  // a gap of skin or sclera): within 4 mm across, centre within 8 mm, at most 3 mm higher (an iris hangs under its lid,
  // a brow sits over it), small (< 150 mm2), never the brow
  const parts = new Set([core0.id]);
  const ub = { x0: core0.x0, x1: core0.x1, y0: core0.y0, y1: core0.y1 };
  for (let round = 0; round < 3; round++) for (const b of ic.comps) {
    if (parts.has(b.id) || b === brow || b.area >= 150) continue;
    const gapX = Math.max(b.x0 - ub.x1, ub.x0 - b.x1, 0);
    if (gapX <= 4 && Math.abs(b.cy - (ub.y0 + ub.y1) / 2) <= 8 && b.y0 >= ub.y0 - 12 && b.y1 <= ub.y1 + 3) {
      parts.add(b.id);
      ub.x0 = Math.min(ub.x0, b.x0); ub.x1 = Math.max(ub.x1, b.x1); ub.y0 = Math.min(ub.y0, b.y0); ub.y1 = Math.max(ub.y1, b.y1);
    }
  }
  const core = { ...core0, ...ub, w: ub.x1 - ub.x0, h: ub.y1 - ub.y0, cx: core0.cx, cy: core0.cy, area: [...parts].reduce((t, id) => t + ic.comps[id - 1].area, 0) };
  // an eye joined to a fringe or a hat's shadow at the lowest threshold: only the ink threshold counts as lid, and the
  // big blob it sits in is not the eye
  const side = core0 === det.pair.a ? 0 : 1, merged = !!det.merged?.[side];
  const blob0 = merged ? det.blob0[side] : null;
  // the lid line lies on the dark core's top or at most 1.5 mm over it (a brow's or a fringe's halo never gets in)
  const upper = core.y1 + 1.5;
  const xw0 = core.cx - 25, xw1 = core.cx + 25, yw0 = core.y0 - 3, yw1 = upper;
  const i0 = pxOf(xw0), i1 = pxOf(xw1), j0 = pyOf(yw1), j1 = pyOf(yw0), w = i1 - i0 + 1, h = j1 - j0 + 1;
  const D = new Float32Array(w * h), scl = new Uint8Array(w * h), other = new Uint8Array(w * h), inCore = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j + j0) * Wd + (i + i0), q = j * w + i;
    if (TRI[k] < 0 || NF[k] < 0.45) { D[q] = -9; continue; }
    const c = [rgb[k * 3], rgb[k * 3 + 1], rgb[k * 3 + 2]], [, s, v] = hsv(...c);
    D[q] = 1 - lumOf(c) / skin.lum;
    scl[q] = lumOf(c) >= skin.lum * 0.97 && s <= skin.sat * 0.75 ? 1 : 0;
    const li = i + i0 - ic.i0, lj = j + j0 - ic.j0;
    const l = li >= 0 && lj >= 0 && li < ic.w && lj < ic.h ? ic.lab[lj * ic.w + li] : 0;
    if (parts.has(l)) inCore[q] = 1; else if (l) other[q] = 1;
    if (blob0 && !inCore[q]) {
      const bi = i + i0 - blob0.ic.i0, bj = j + j0 - blob0.ic.j0;
      if (bi >= 0 && bj >= 0 && bi < blob0.ic.w && bj < blob0.ic.h && blob0.ic.lab[bj * blob0.ic.w + bi] === blob0.id) other[q] = 1;
    }
  }
  // a big dark blob near the eye (hair, a fringe, a cap's shadow; >= 150 mm2) keeps a 1.5 mm halo the lid can't run along
  const bigIds = new Set(ic.comps.filter((cc) => !parts.has(cc.id) && cc.area >= 150).map((cc) => cc.id));
  const near = new Uint8Array(w * h), R = Math.round(1.5 / MM);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const li = i + i0 - ic.i0, lj = j + j0 - ic.j0;
    const l = li >= 0 && lj >= 0 && li < ic.w && lj < ic.h ? ic.lab[lj * ic.w + li] : 0;
    let big = bigIds.has(l);
    if (!big && blob0) { const bi = i + i0 - blob0.ic.i0, bj = j + j0 - blob0.ic.j0; big = bi >= 0 && bj >= 0 && bi < blob0.ic.w && bj < blob0.ic.h && blob0.ic.lab[bj * blob0.ic.w + bi] === blob0.id && !inCore[j * w + i]; }
    if (!big) continue;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const ni = i + di, nj = j + dj;
      if (ni >= 0 && nj >= 0 && ni < w && nj < h && di * di + dj * dj <= R * R) near[nj * w + ni] = 1;
    }
  }
  for (let q = 0; q < w * h; q++) if (near[q] && !inCore[q]) other[q] = 1;
  const lid = new Uint8Array(w * h), stack = [];
  for (let q = 0; q < w * h; q++) if (inCore[q]) { lid[q] = 1; stack.push(q); }
  const nb = (q, fn) => { const qi = q % w, qj = (q / w) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ni = qi + di, nj = qj + dj; if (ni >= 0 && nj >= 0 && ni < w && nj < h) fn(nj * w + ni); } };
  // one flood over lid-dark and sclera texels: a lid line beyond the white of the eye joins through it
  const sc = new Uint8Array(w * h), sy0 = pyOf(core.y1 + 2) - j0, sy1 = pyOf(core.y0 - 2) - j0;
  const lidT = merged ? INK : LID;
  while (stack.length) nb(stack.pop(), (n) => {
    if (lid[n] || sc[n] || other[n]) return;
    if (D[n] >= lidT) { lid[n] = 1; stack.push(n); return; }
    const nj = (n / w) | 0;
    if (scl[n] && nj >= sy0 && nj <= sy1) { sc[n] = 1; stack.push(n); }
  });
  const box = (m) => { let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity, n = 0; for (let q = 0; q < w * h; q++) if (m(q)) { const qi = q % w, qj = (q / w) | 0; a = Math.min(a, qi); b = Math.max(b, qi); c = Math.min(c, qj); d = Math.max(d, qj); n++; } return n ? { x0: xOf(a + i0) - MM / 2, x1: xOf(b + i0) + MM / 2, y1: yOf(c + j0) + MM / 2, y0: yOf(d + j0) - MM / 2, n } : null; };
  // iris: the core's columns at least half as tall as its tallest
  const colN = new Int32Array(w);
  for (let q = 0; q < w * h; q++) if (inCore[q]) colN[q % w]++;
  const mx = Math.max(...colN);
  let a = w, b = -1;
  for (let i = 0; i < w; i++) if (colN[i] >= 0.5 * mx) { a = Math.min(a, i); b = Math.max(b, i); }
  const iris = { x0: xOf(a + i0) - MM / 2, x1: xOf(b + i0) + MM / 2 };
  const ca = 0, cb = w - 1;
  const keep = () => true;
  const out = box((q) => (lid[q] || sc[q]) && keep(q));
  // sclera inside the outline's inscribed ellipse
  const ex = (out.x0 + out.x1) / 2, ey = (out.y0 + out.y1) / 2, rx = (out.x1 - out.x0) / 2, ry = (out.y1 - out.y0) / 2;
  let inE = 0, sclE = 0;
  for (let q = 0; q < w * h; q++) {
    const x = xOf((q % w) + i0), y = yOf(((q / w) | 0) + j0);
    if (((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 > 1) continue;
    inE++; if (sc[q] && keep(q)) sclE++;
  }
  const width = out.x1 - out.x0, height = out.y1 - out.y0;
  return {
    cx: (out.x0 + out.x1) / 2, cy: (out.y0 + out.y1) / 2, width, height, aspect: width / height,
    iris_w: iris.x1 - iris.x0, iris_h: core.h, reach: Math.max(0, out.x1 - iris.x1) + Math.max(0, iris.x0 - out.x0),
    sclera: inE ? sclE / inE : 0, sclera_mm2: sc.reduce((t, v, q) => t + (v && keep(q) ? 1 : 0), 0) * MM * MM,
    box: out, iris, core: { x0: core.x0, x1: core.x1, y0: core.y0, y1: core.y1, cx: core.cx, cy: core.cy, w: core.w, h: core.h, area: core.area },
    brow: brow ? { x0: brow.x0, x1: brow.x1, y0: brow.y0, y1: brow.y1 } : null, lid_top: upper, merged,
    reach_l: Math.max(0, iris.x0 - out.x0), reach_r: Math.max(0, out.x1 - iris.x1),
    masks: { i0, j0, w, h, lid, sc, keep: [ca, cb] },
  };
}

// the face's width at the eyes' height: the skin, from each eye's outer end outward until 3 mm of something else (hair,
// a cap, an ear turned away, the surface's edge); the median over the rows 2 mm either side of the eye line
export function faceWidthAt(fr, skin, y, el, er) {
  const ws = [];
  for (let yy = y - 2; yy <= y + 2; yy += 0.5) {
    const j = pyOf(yy);
    const good = (i) => { if (i < 0 || i >= fr.Wd) return false; const k = j * fr.Wd + i; return fr.TRI[k] >= 0 && fr.NF[k] >= 0.2 && skinLike(skin, [fr.rgb[k * 3], fr.rgb[k * 3 + 1], fr.rgb[k * 3 + 2]]); };
    const run = Math.round(3 / MM);
    const walk = (i, step) => { let last = i, miss = 0; for (let q = i; q >= 0 && q < fr.Wd; q += step) { if (good(q)) { last = q; miss = 0; } else if (++miss > run) break; } return last; };
    const a = walk(pxOf(el), -1), b = walk(pxOf(er), 1);
    ws.push((b - a + 1) * MM);
  }
  ws.sort((p, q) => p - q);
  return { w: ws[ws.length >> 1] };
}

export function measureFace(fr) {
  const skin = skinTone(fr);
  const det = detectEyes(fr, skin);
  if (!det) return { skin, found: false };
  const eyes = [det.pair.a, det.pair.b].map((c, k) => measureEye(fr, skin, det, c, det.brows[k]));
  const cy = (eyes[0].cy + eyes[1].cy) / 2, mid = (eyes[0].cx + eyes[1].cx) / 2;
  const fw = faceWidthAt(fr, skin, cy, eyes[0].box.x0, eyes[1].box.x1);
  const lr = {
    width: Math.min(eyes[0].width, eyes[1].width) / Math.max(eyes[0].width, eyes[1].width),
    height: Math.min(eyes[0].height, eyes[1].height) / Math.max(eyes[0].height, eyes[1].height),
    dy: Math.abs(eyes[0].cy - eyes[1].cy),
    mirror: Math.abs((eyes[0].cx + eyes[1].cx) / 2 - mid),
  };
  for (const e of eyes) e.face_frac = fw ? e.width / fw.w : null;
  return { skin, found: true, T: det.T, eyes, mid, cy, sep: eyes[1].cx - eyes[0].cx, face_w: fw?.w ?? null, lr };
}

// ---------------------------------------------------------------- the verdict
// Calibrated on the shipped textures (2026-10-13, gen/details/eyes/notes.md): the passing faces and the dots of the
// brief, each threshold the geometric mean of the lowest passing face and the highest dot, both eyes averaged.
// A face passes when its eyes' lid outline runs at least RULE.reach mm past the iris (both sides summed) and is at
// least RULE.width mm wide. Inside the calibration gap (between the dots' highest and the passing faces' lowest
// values) the verdict is marked "~".
export const CALIB = { pass: ['groom', 'archer', 'woman', 'youth', 'bearer', 'storyteller'], fail: ['boatman', 'butcher', 'monk', 'official'] };
export const RULE = { reach: 6.8, width: 17.2, gap: { reach: [4.4, 10.4], width: [14.6, 20.3] } };
export const meanOf = (m, k) => (m.eyes[0][k] + m.eyes[1][k]) / 2;
export function verdict(m) {
  if (!m.found) return 'NO EYES';
  const reach = meanOf(m, 'reach'), width = meanOf(m, 'width');
  const pass = reach >= RULE.reach && width >= RULE.width;
  const inGap = (v, [lo, hi]) => v > lo && v < hi;
  const near = pass ? reach < RULE.gap.reach[1] || width < RULE.gap.width[1] : inGap(reach, RULE.gap.reach) && inGap(width, RULE.gap.width);
  return (pass ? 'PASS' : 'FAIL') + (near ? '~' : '');
}
// the calibration: per metric, the lowest passing face, the highest dot, the threshold between them and the margin
export function calibrate(rows) {
  const get = (n) => rows.find((q) => q.name === n);
  const out = {};
  for (const k of ['reach', 'width', 'aspect', 'sclera']) {
    const pv = CALIB.pass.map((n) => [n, get(n).mean[k]]), fv = CALIB.fail.map((n) => [n, get(n).mean[k]]);
    const lo = pv.reduce((p, q) => (q[1] < p[1] ? q : p)), hi = fv.reduce((p, q) => (q[1] > p[1] ? q : p));
    const thr = lo[1] > 0 && hi[1] > 0 ? Math.sqrt(lo[1] * hi[1]) : (lo[1] + hi[1]) / 2;
    out[k] = { lowest_pass: lo, highest_dot: hi, threshold: +thr.toFixed(2), separates: lo[1] > hi[1], margin: hi[1] > 0 ? +(lo[1] / hi[1]).toFixed(2) : null };
  }
  return out;
}

// how much of the shipped texture the eye band gets: texels (at the texture's size) of the triangles seen in a band
// 100 x 30 mm round the eyes, and how many UV islands they fall into (a face cut into islands of a few texels smears
// when the texture is shrunk to 512)
export const SLIVER = 6;
export function eyeBandTexels(c) {
  const { idx, T } = c.g, fr = c.fr, cy = c.m.found ? c.m.cy : 110, mid = c.m.found ? c.m.mid : 0;
  const tris = new Set();
  for (let y = cy - 15; y <= cy + 15; y += 0.5) for (let x = mid - 50; x <= mid + 50; x += 0.5) { const k = pyOf(y) * fr.Wd + pxOf(x); if (fr.TRI[k] >= 0) tris.add(fr.TRI[k]); }
  const key = (v) => `${T[v * 2].toFixed(5)},${T[v * 2 + 1].toFixed(5)}`;
  const parent = new Map(), find = (q) => { while (parent.get(q) !== q) q = parent.get(q); return q; }, byKey = new Map();
  for (const f of tris) { parent.set(f, f); for (let k = 0; k < 3; k++) { const kk = key(idx[f + k]); if (!byKey.has(kk)) byKey.set(kk, []); byKey.get(kk).push(f); } }
  for (const fs of byKey.values()) for (const f of fs.slice(1)) { const p = find(fs[0]), q = find(f); if (p !== q) parent.set(p, q); }
  const isl = new Map(), S = c.tex * c.tex;
  for (const f of tris) {
    const [p, q, w] = [idx[f], idx[f + 1], idx[f + 2]];
    const area = Math.abs((T[q * 2] - T[p * 2]) * (T[w * 2 + 1] - T[p * 2 + 1]) - (T[w * 2] - T[p * 2]) * (T[q * 2 + 1] - T[p * 2 + 1])) / 2 * S;
    isl.set(find(f), (isl.get(find(f)) || 0) + area);
  }
  const sizes = [...isl.values()].sort((p, q) => p - q);
  // per eye: the share of the eye's surroundings (the dark core +-10 mm across, +-4 mm up and down) that lies on UV
  // islands under SLIVER texels: there the shrunk texture holds no drawing at all
  const sliver = c.m.found ? c.m.eyes.map((e) => {
    let n = 0, k = 0;
    for (let y = e.core.y0 - 4; y <= e.core.y1 + 4; y += 0.25) for (let x = e.core.x0 - 10; x <= e.core.x1 + 10; x += 0.25) {
      const q = pyOf(y) * fr.Wd + pxOf(x), f = fr.TRI[q];
      if (f < 0) continue;
      n++;
      if (isl.get(find(f)) < SLIVER) k++;
    }
    return n ? +(k / n).toFixed(2) : 0;
  }) : null;
  return { texels: Math.round(sizes.reduce((p, q) => p + q, 0)), islands: sizes.length, median_island: +(sizes[sizes.length >> 1] || 0).toFixed(1), sliver };
}

// ---------------------------------------------------------------- one character, measured
export async function checkCharacter(name, { src = false, glbDir = null } = {}) {
  const cf = charFiles(name);
  const file = src ? cf.rigged : glbDir ? path.join(glbDir, `${name}.glb`) : cf.glb;
  const doc = await (await io()).read(r(file));
  // the source as the build makes it: a character with an "eyes" spec (its own or its base's) gets the fix applied
  const eyes = src ? cf.cfg.eyes || (cf.base ? JSON.parse(fs.readFileSync(r(`characters/${cf.base}.json`), 'utf8')).eyes : null) : null;
  if (eyes && src !== 'plain') await (await import('./eye_fix.mjs')).applyEyes(doc, eyes, { log: () => {} });
  const g = bodyGeom(doc);
  const t = await decodeTex(g.tex);
  const fr = faceRender(g, t);
  const m = measureFace(fr);
  return { name, file, tex: t.W, g, t, fr, m, verdict: verdict(m) };
}

export async function faceTile(fr, m, label, { w = 300, sub = "", overlay = false, zoom = false, boxes = true } = {}) {
  const cy = m.found ? m.cy : 110, mid = m.found ? m.mid : 0;
  const [x0, x1, y0, y1] = zoom ? [mid - 50, mid + 50, cy - 14, cy + 16] : [mid - 75, mid + 75, cy - 70, cy + 55];
  const img = await (await imageOf(fr, { x0, x1, y0, y1 })).png().toBuffer();
  const s = w / ((x1 - x0) / MM), H = Math.round(((y1 - y0) / MM) * s);
  const X = (x) => ((x - x0) / MM) * s, Y = (y) => ((y1 - y) / MM) * s;
  const rects = [];
  if (m.found && boxes) for (const e of m.eyes) {
    rects.push(`<rect x="${X(e.box.x0)}" y="${Y(e.box.y1)}" width="${X(e.box.x1) - X(e.box.x0)}" height="${Y(e.box.y0) - Y(e.box.y1)}" fill="none" stroke="#0f0" stroke-width="1.5"/>`);
    rects.push(`<rect x="${X(e.iris.x0)}" y="${Y(e.core.y1)}" width="${X(e.iris.x1) - X(e.iris.x0)}" height="${Y(e.core.y0) - Y(e.core.y1)}" fill="none" stroke="#f33" stroke-width="1"/>`);
    if (e.brow) rects.push(`<rect x="${X(e.brow.x0)}" y="${Y(e.brow.y1)}" width="${X(e.brow.x1) - X(e.brow.x0)}" height="${Y(e.brow.y0) - Y(e.brow.y1)}" fill="none" stroke="#39f" stroke-width="1"/>`);
  }
  // the measured texels: lid-dark red, sclera cyan
  const ov = Buffer.alloc(w * H * 4);
  if (m.found && overlay) for (const e of m.eyes) {
    const k = e.masks;
    for (let q = 0; q < k.w * k.h; q++) {
      if (!k.lid[q] && !k.sc[q]) continue;
      const x = xOf((q % k.w) + k.i0), y = yOf(((q / k.w) | 0) + k.j0), px = Math.round(X(x)), py = Math.round(Y(y));
      if (px < 0 || py < 0 || px >= w || py >= H) continue;
      const o = (py * w + px) * 4;
      ov.set(k.sc[q] ? [0, 230, 255, 110] : [255, 40, 40, 90], o);
    }
  }
  const col = /PASS/.test(label) ? '#7f7' : '#f77';
  const svg = `<svg width="${w}" height="${H + 40}"><rect x="0" y="${H}" width="${w}" height="40" fill="#111"/>${rects.join('')}`
    + `<text x="4" y="${H + 16}" font-size="14" font-family="monospace" fill="${col}">${label}</text>`
    + `<text x="4" y="${H + 33}" font-size="12" font-family="monospace" fill="#ddd">${sub}</text></svg>`;
  return sharp({ create: { width: w, height: H + 40, channels: 3, background: '#000' } })
    .composite([{ input: await sharp(img).resize(w, H).png().toBuffer(), left: 0, top: 0 },
      ...(overlay ? [{ input: await sharp(ov, { raw: { width: w, height: H, channels: 4 } }).png().toBuffer(), left: 0, top: 0 }] : []),
      { input: Buffer.from(svg), left: 0, top: 0 }]).png().toBuffer();
}

export async function sheet(tiles, file, cols = 6) {
  const metas = await Promise.all(tiles.map((b) => sharp(b).metadata()));
  const cw = Math.max(...metas.map((q) => q.width)) + 4, ch = Math.max(...metas.map((q) => q.height)) + 4;
  const comp = tiles.map((b, i) => ({ input: b, left: (i % cols) * cw, top: Math.floor(i / cols) * ch }));
  await sharp({ create: { width: cols * cw, height: Math.ceil(tiles.length / cols) * ch, channels: 3, background: '#222' } }).composite(comp).jpeg({ quality: 86 }).toFile(file);
}

const f1 = (x) => (x == null ? '-' : x.toFixed(1)), f2 = (x) => (x == null ? '-' : x.toFixed(2));
export function summary(c) {
  const m = c.m;
  if (!m.found) return { name: c.name, verdict: c.verdict, tex: c.tex };
  const e = m.eyes;
  return {
    name: c.name, verdict: c.verdict, tex: c.tex, file: c.file, threshold: m.T,
    mean: { reach: +f1(meanOf(m, 'reach')), width: +f1(meanOf(m, 'width')), aspect: +f2(meanOf(m, 'aspect')), sclera: +f2(meanOf(m, 'sclera')) },
    skin: m.skin.rgb.map((x) => +x.toFixed(3)), face_w: +f1(m.face_w), sep: +f1(m.sep), mid: +f1(m.mid), eye_y: +f1(m.cy),
    lr: { width: +f2(m.lr.width), height: +f2(m.lr.height), dy: +f1(m.lr.dy) },
    eyes: e.map((q, k) => ({ side: k ? 'viewer_right' : 'viewer_left', width: +f1(q.width), height: +f1(q.height), aspect: +f2(q.aspect),
      iris_w: +f1(q.iris_w), iris_h: +f1(q.iris_h), reach: +f1(q.reach), sclera: +f2(q.sclera), sclera_mm2: +f1(q.sclera_mm2), face_frac: q.face_frac == null ? null : +f2(q.face_frac),
      merged: q.merged || undefined, reach_l: +f1(q.reach_l), reach_r: +f1(q.reach_r), cx: +f1(q.cx), cy: +f1(q.cy), box: Object.fromEntries(Object.entries(q.box).filter(([k2]) => k2 !== 'n').map(([k2, v]) => [k2, +f1(v)])),
      core: { x0: +f1(q.core.x0), x1: +f1(q.core.x1), y0: +f1(q.core.y0), y1: +f1(q.core.y1) }, brow: q.brow && Object.fromEntries(Object.entries(q.brow).map(([k2, v]) => [k2, +f1(v)])) })),
  };
}

// ---------------------------------------------------------------- face close-ups on the GPU (web/chars.html)
// One frame per character, from the front at about the eye's height, idle at 1 s, props off. The page is run through
// tools/chrome_slot.sh against tools/check_server.sh:
//   tools/chrome_slot.sh node tools/eye_check.mjs a,b --shots <dir> [--base http://127.0.0.1:5190]
export async function faceShots(names, dir, base, { level = false } = {}) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
  const reg = JSON.parse(fs.readFileSync(r('web/public/assets/chars/characters.json'), 'utf8'));
  fs.mkdirSync(dir, { recursive: true });
  for (const name of names) {
    const c = await checkCharacter(name);
    const k = reg[name].height_m / c.g.height, eyeH = (c.g.frame.o[1] + (c.m.found ? c.m.cy : 110) / 1000) * k;
    const page = await browser.contexts()[0].newPage();
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.goto(`${base}/chars.html?only=${name}&props=0`);
    await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 60000 });
    await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); document.querySelectorAll('body > div').forEach((d) => { if (!d.id) d.remove(); }); });
    // level: from 2 m at the eyes' height, under a wide brim (the camera sits 0.35 m over the point it looks at)
    const [dist, tgt] = level ? [2.0, eyeH - 0.3] : [0.95, eyeH - 0.05];
    await page.evaluate(([n, d, h]) => { const T = window.__test; T.ui.paused = true; const cl = T.clips[n].find((q) => q[0] === 'idle') ? 'idle' : T.clips[n][0][0]; T.pose(n, cl, 1); T.focus(n, 0, d, h); }, [name, dist, tgt]);
    await page.waitForTimeout(400);
    fs.writeFileSync(path.join(dir, `${name}.png`), await page.screenshot());
    await page.close();
    console.log('shot', name, 'eye height', eyeH.toFixed(3));
  }
  await browser.close();
}
// before | after pairs, one row per character, cropped round the pixels that changed (the eyes) with the face round them
export async function beforeAfter(names, beforeDir, afterDir, file, at = {}) {
  const rows = [];
  for (const n of names) {
    const files = [beforeDir, afterDir].map((d) => path.join(d, `${n}.png`));
    const [rb, ra] = await Promise.all(files.map((f) => sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
    const W = rb.info.width, H = rb.info.height, xs = [], ys = [];
    // where a dark dot became skin or the white of an eye: light now, and the luminance up by more than 70/255 (a whole
    // texture's re-encode moves texels by far less), else by 45 or 30
    const lum = (d, q) => 0.299 * d[q * 3] + 0.587 * d[q * 3 + 1] + 0.114 * d[q * 3 + 2];
    for (const t of [70, 45, 30]) {
      for (let q = 0; q < W * H; q++) if (lum(ra.data, q) - lum(rb.data, q) > t && lum(ra.data, q) > 110) { xs.push(q % W); ys.push((q / W) | 0); }
      if (xs.length > 10) break;
    }
    const med = (v) => v.slice().sort((p, q) => p - q)[v.length >> 1];
    // faces in these shots sit near (690, 540) (idle bows the head under a camera 0.35 m above the eyes); a find far
    // from there is something else
    let cx = 690, cy = 540;
    if (at[n]) [cx, cy] = at[n];
    else if (xs.length > 30 && Math.abs(med(xs) - cx) < 200 && Math.abs(med(ys) - cy) < 160) { cx = med(xs); cy = med(ys); }
    const cw = 380, chh = 285;
    const left = Math.max(0, Math.min(W - cw, Math.round(cx - cw / 2))), top = Math.max(0, Math.min(H - chh, Math.round(cy - chh * 0.42)));
    const [b, a] = await Promise.all(files.map((f) => sharp(f).extract({ left, top, width: cw, height: chh }).resize(400, 300).png().toBuffer()));
    const lab = (t) => Buffer.from(`<svg width="400" height="24"><rect width="400" height="24" fill="#000" fill-opacity="0.55"/><text x="6" y="17" font-size="15" font-family="monospace" fill="#fff">${t}</text></svg>`);
    rows.push(await sharp({ create: { width: 804, height: 300, channels: 3, background: '#000' } })
      .composite([{ input: b, left: 0, top: 0 }, { input: a, left: 404, top: 0 }, { input: lab(`${n} before`), left: 0, top: 0 }, { input: lab(`${n} after`), left: 404, top: 0 }]).png().toBuffer());
  }
  await sheet(rows, file, 2);
}

// ---------------------------------------------------------------- checks for the eye fix's islands and for a hat's recolour
// The colour step across an eye island's border on the face plane: for each border pixel, the mean colour of the
// island's pixels and of the other pixels within 1.5 mm, their difference (0-255, the largest channel), averaged;
// on the new GLB, on the old one at the same pixels, and on the source with the fix (the true step); and each side's
// error against the source. rects: the islands' texels of the 512 map, [x, y, w, h].
export async function seamCheck(name, afterGlb, beforeGlb, rects) {
  const render = async (file) => { const doc = await (await io()).read(r(file)); const g = bodyGeom(doc), t = await decodeTex(g.tex); return faceRender(g, t); };
  const frA = await render(afterGlb), frB = await render(beforeGlb), src = (await checkCharacter(name, { src: true })).fr;
  const Wd = frA.Wd, Hd = frA.Hd, inIsl = new Uint8Array(Wd * Hd);
  for (let k = 0; k < Wd * Hd; k++) { if (frA.TRI[k] < 0) continue; const u = frA.U[k] * 512, v = frA.V[k] * 512; if (rects.some(([x, y, w, h]) => u >= x && u < x + w && v >= y && v < y + h)) inIsl[k] = 1; }
  const R = Math.round(1.5 / MM), border = [];
  for (let j = 1; j < Hd - 1; j++) for (let i = 1; i < Wd - 1; i++) { const k = j * Wd + i; if (inIsl[k] && [-1, 1, -Wd, Wd].some((d) => frA.TRI[k + d] >= 0 && !inIsl[k + d])) border.push(k); }
  const disc = (k, fn) => { const i = k % Wd, j = (k / Wd) | 0; for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) if (di * di + dj * dj <= R * R) fn((j + dj) * Wd + i + di); };
  const step = (fr) => { let tot = 0, n = 0;
    for (const k of border) { const a = [0, 0, 0], b = [0, 0, 0]; let na = 0, nb = 0;
      disc(k, (q) => { if (fr.TRI[q] < 0) return; const tg = inIsl[q] ? a : b; for (let c = 0; c < 3; c++) tg[c] += fr.rgb[q * 3 + c]; if (inIsl[q]) na++; else nb++; });
      if (na && nb) { tot += Math.max(...[0, 1, 2].map((c) => Math.abs(a[c] / na - b[c] / nb))) * 255; n++; } }
    return +(tot / n).toFixed(1); };
  const err = (fr, side) => { let tot = 0, n = 0; const seen = new Uint8Array(Wd * Hd);
    for (const k of border) disc(k, (q) => { if (seen[q] || fr.TRI[q] < 0 || src.TRI[q] < 0 || inIsl[q] !== side) return; seen[q] = 1; tot += Math.max(...[0, 1, 2].map((c) => Math.abs(fr.rgb[q * 3 + c] - src.rgb[q * 3 + c]))) * 255; n++; });
    return +(tot / n).toFixed(1); };
  return { border_mm: +(border.length * MM).toFixed(0), step: { after: step(frA), before: step(frB), source: step(src) },
    error_inside: { after: err(frA, 1), before: err(frB, 1) }, error_outside: { after: err(frA, 0), before: err(frB, 0) } };
}
// A recolour's texels on the face: the texels a recolour changed (base texture -> recoloured texture, full resolution),
// counted on the face's triangles (seen in the face render from the chin to 150 mm over the Head joint, 45 mm either
// side) and on the rest of the body; the character gives the geometry (its source, plain).
export async function recolourFaceCheck(name, baseGlb, outGlbs) {
  const c = await checkCharacter(name, { src: 'plain' }), { idx, T } = c.g, W = c.t.W, fr = c.fr, face = new Set();
  for (let y = 0; y <= 150; y += 0.25) for (let x = -45; x <= 45; x += 0.25) { const k = pyOf(y) * fr.Wd + pxOf(x); if (fr.TRI[k] >= 0) face.add(fr.TRI[k]); }
  const cls = new Uint8Array(W * W);
  for (let f = 0; f < idx.length; f += 3) {
    const uv = [0, 1, 2].map((k) => [T[idx[f + k] * 2] * W, T[idx[f + k] * 2 + 1] * W]), xs = uv.map((p) => p[0]), ys = uv.map((p) => p[1]);
    const [ax, ay] = uv[0], [bx, by] = uv[1], [cx, cy] = uv[2], den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(den) < 1e-12) continue;
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(W - 1, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(W - 1, Math.ceil(Math.max(...xs))); x++) {
      const px = x + 0.5, py = y + 0.5, l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den;
      if (l1 < 0 || l2 < 0 || 1 - l1 - l2 < 0) continue;
      const k = y * W + x; if (face.has(f)) cls[k] = 1; else if (!cls[k]) cls[k] = 2;
    }
  }
  const read = async (f) => sharp(Buffer.from((await (await io()).read(r(f))).getRoot().listTextures()[0].getImage())).removeAlpha().raw().toBuffer();
  const b = await read(baseGlb), out = [];
  for (const o of outGlbs) {
    const a = await read(o), n = [0, 0, 0];
    for (let k = 0; k < W * W; k++) if (a[k * 3] !== b[k * 3] || a[k * 3 + 1] !== b[k * 3 + 1] || a[k * 3 + 2] !== b[k * 3 + 2]) n[cls[k] === 1 ? 0 : cls[k] === 2 ? 1 : 2]++;
    out.push({ file: o, face_texels: n[0], body_texels: n[1], gutter_texels: n[2] });
  }
  return out;
}

// ---------------------------------------------------------------- CLI
// (run after this module has finished loading, so the eye fix can import it for the sources with an "eyes" spec)
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) setTimeout(() => main().catch((e) => { console.error(e); process.exit(1); }), 0);
async function main() {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const out = opt('--out');
  const dump = opt('--dump');
  const target = args.filter((a) => !a.startsWith('--'))[0] || 'all';
  const names = target === 'all' ? Object.keys(JSON.parse(fs.readFileSync(r('web/public/assets/chars/characters.json'), 'utf8'))).sort() : target.split(',');
  const glbDir = opt('--glb-dir');
  // --seam <after.glb>,<before.glb>,<x:y:w:h>[;<x:y:w:h>]  |  --recolour-face <base.glb>,<out.glb>[,<out.glb>]
  const seam = opt('--seam'), rf = opt('--recolour-face');
  if (seam) { const [aG, bG, rs] = seam.split(','); console.log(JSON.stringify(await seamCheck(names[0], aG, bG, rs.split(';').map((q) => q.split(':').map(Number))))); process.exit(0); }
  if (rf) { const [bG, ...oG] = rf.split(','); for (const q of await recolourFaceCheck(names[0], bG, oG)) console.log(JSON.stringify(q)); process.exit(0); }
  const shotDir = opt('--shots'), base = opt('--base') || 'http://127.0.0.1:5190', ba = opt('--before-after');
  if (shotDir) { await faceShots(names, shotDir, base, { level: args.includes('--level') }); process.exit(0); }
  // --at name:x,y[;name:x,y]: where a face sits in the shots when it is not found
  const at = Object.fromEntries((opt('--at') || '').split(';').filter(Boolean).map((q) => { const [n, xy] = q.split(':'); return [n, xy.split(',').map(Number)]; }));
  if (ba) { const [bd, ad, file] = ba.split(','); await beforeAfter(names, bd, ad, file, at); console.log('wrote', file); process.exit(0); }
  const zoom = args.includes('--zoom'), overlay = !args.includes('--no-overlay');
  const rows = [], tiles = [];
  const line = (c) => {
    const e = c.m.found ? c.m.eyes : null;
    return e ? `reach ${f1(e[0].reach)}/${f1(e[1].reach)} w ${f1(e[0].width)}/${f1(e[1].width)} asp ${f2(e[0].aspect)}/${f2(e[1].aspect)} scl ${f2(e[0].sclera)}/${f2(e[1].sclera)}` : '';
  };
  for (const name of names) {
    const c = await checkCharacter(name, { glbDir });
    const s = summary(c);
    s.eye_band = eyeBandTexels(c);
    if (!args.includes('--no-src')) {
      const cs = await checkCharacter(name, { src: args.includes('--no-fix') ? 'plain' : true });
      s.source = summary(cs);
      const cf2 = charFiles(name), eyes = cf2.cfg.eyes || (cf2.base ? JSON.parse(fs.readFileSync(r(`characters/${cf2.base}.json`), 'utf8')).eyes : null);
      s.source.note = [cf2.base ? `the base's (${cf2.base}) source texture, before the variant's recolour` : '', eyes && !args.includes('--no-fix') ? `with the eye fix applied (from ${eyes.from})` : ''].filter(Boolean).join('; ') || undefined;
    }
    rows.push(s);
    if (dump) { fs.mkdirSync(dump, { recursive: true }); await (await imageOf(c.fr)).png().toFile(path.join(dump, `${name}.png`)); }
    console.log(`${name.padEnd(19)} ${c.verdict.padEnd(6)} ${line(c)}  | src ${s.source ? s.source.verdict : '-'}  | band ${s.eye_band.texels} tx, ${s.eye_band.islands} isl, sliver ${s.eye_band.sliver}`);
    if (out) {
      const e = c.m.found ? c.m.eyes : null;
      tiles.push(await faceTile(c.fr, c.m, `${name} ${c.verdict}`, { overlay, zoom, w: zoom ? 600 : 300,
        sub: e ? `reach ${f1(meanOf(c.m, 'reach'))} w ${f1(meanOf(c.m, 'width'))} a ${f2(meanOf(c.m, 'aspect'))} s ${f2(meanOf(c.m, 'sclera'))}` : '' }));
    }
  }
  let cal = null;
  if (args.includes('--calibrate') && CALIB.pass.concat(CALIB.fail).every((n) => rows.some((q) => q.name === n && q.mean))) {
    cal = calibrate(rows);
    for (const [k, v] of Object.entries(cal)) console.log(`calibration ${k.padEnd(6)} lowest pass ${v.lowest_pass[0]} ${v.lowest_pass[1]}, highest dot ${v.highest_dot[0]} ${v.highest_dot[1]}, threshold ${v.threshold}, separates ${v.separates}, margin x${v.margin}`);
  }
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'eyes.json'), JSON.stringify({
      about: 'tools/eye_check.mjs: eyes measured on the face plane in mm (x to the viewer\'s right, y up from the Head joint), from the shipped GLB (webp 512); "source" is the full-resolution texture build_character.mjs starts from',
      glb_dir: glbDir || 'web/public/assets/chars', rule: RULE, calibration_sets: CALIB, calibration: cal || 'see gen/details/eyes/before/eyes.json (run with --calibrate on the shipped state before the fix)', characters: rows }, null, 1) + '\n');
    await sheet(tiles, path.join(out, zoom ? 'faces_zoom.jpg' : 'faces.jpg'), zoom ? 3 : 6);
    // the table for notes.md
    const t = ['| character | verdict | reach L/R mm | width L/R mm | aspect L/R | sclera L/R | iris w x h mm | L/R width | source verdict (reach, width) | eye band texels / islands | sliver L/R |', '|---|---|---|---|---|---|---|---|---|---|---|'];
    for (const q of rows) {
      if (!q.eyes) { t.push(`| ${q.name} | ${q.verdict} | | | | | | | | | |`); continue; }
      const [l, rr] = q.eyes;
      t.push(`| ${q.name} | ${q.verdict} | ${l.reach} / ${rr.reach} | ${l.width} / ${rr.width} | ${l.aspect} / ${rr.aspect} | ${l.sclera} / ${rr.sclera} | ${l.iris_w}x${l.iris_h} | ${q.lr.width} | ${q.source ? `${q.source.verdict} (${q.source.mean?.reach}, ${q.source.mean?.width})` : ''} | ${q.eye_band.texels} / ${q.eye_band.islands} | ${q.eye_band.sliver ? q.eye_band.sliver.join(' / ') : ''} |`);
    }
    fs.writeFileSync(path.join(out, 'table.md'), t.join('\n') + '\n');
    console.log('wrote', path.join(out, 'eyes.json'), path.join(out, 'table.md'), path.join(out, zoom ? 'faces_zoom.jpg' : 'faces.jpg'));
  }
}
