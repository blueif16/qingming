#!/usr/bin/env node
// Eyes, measured: every character's eyes from the texture as it lies on the face, in millimetres.
//
//   node tools/eye_check.mjs <character|a,b|all> [--src] [--dump <dir>]
//
// (work in progress: probe of the face renderer)
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
    const c = { id, n: 0, sx: 0, sy: 0, sd: 0, imin: Infinity, imax: -Infinity, jmin: Infinity, jmax: -Infinity, px: [] };
    while (sp) {
      const p = stack[--sp], pi = p % w, pj = (p / w) | 0;
      c.n++; c.sx += pi; c.sy += pj; c.sd += D[p]; c.px.push(p);
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
      area: c.n * MM * MM, cx: xOf(c.sx / c.n + i0), cy: yOf(c.sy / c.n + j0), dark: c.sd / c.n,
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
    const eyeish = pairs.filter((p) => p.minArea >= 12 && p.fill >= 0.45 && p.elong <= 2.4 && p.gap >= 12 && p.sep >= 35
      && skinFrac(fr, skin, p.a.x1 + 2, p.b.x0 - 2, p.cy - 2, p.cy + 2) >= 0.5
      && [p.a, p.b].every((c) => skinFrac(fr, skin, c.x0, c.x1, c.y0 - 12, c.y0 - 4) >= 0.5));
    const browOf = (p, q) => p.cy - q.cy >= 6 && p.cy - q.cy <= 35 && overlapX(p.a, q.a) && overlapX(p.b, q.b);
    const cands = eyeish.filter((p) => !eyeish.some((q) => q !== p && browOf(p, q)));
    if (!cands.length) continue;
    const eyes = cands[0];
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
export function measureEye(fr, skin, det, core, brow) {
  const { ic } = det, { Wd, rgb, NF, TRI } = fr;
  // an eye joined to a fringe or a hat's shadow at the lowest threshold: only the ink threshold counts as lid, and the
  // big blob it sits in is not the eye
  const side = core === det.pair.a ? 0 : 1, merged = !!det.merged?.[side];
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
    if (l === core.id) inCore[q] = 1; else if (l) other[q] = 1;
    if (blob0 && !inCore[q]) {
      const bi = i + i0 - blob0.ic.i0, bj = j + j0 - blob0.ic.j0;
      if (bi >= 0 && bj >= 0 && bi < blob0.ic.w && bj < blob0.ic.h && blob0.ic.lab[bj * blob0.ic.w + bi] === blob0.id) other[q] = 1;
    }
  }
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

// the face's width at a height: the run of front-facing texels (n.fwd >= 0.3) through the midline
export function faceWidthAt(fr, y, mid = 0) {
  const j = pyOf(y), ok = (i) => fr.TRI[j * fr.Wd + i] >= 0 && fr.NF[j * fr.Wd + i] >= 0.3;
  let a = pxOf(mid), b = a;
  if (!ok(a)) return null;
  while (a > 0 && ok(a - 1)) a--;
  while (b < fr.Wd - 1 && ok(b + 1)) b++;
  return { x0: xOf(a) - MM / 2, x1: xOf(b) + MM / 2, w: (b - a + 1) * MM };
}

export function measureFace(fr) {
  const skin = skinTone(fr);
  const det = detectEyes(fr, skin);
  if (!det) return { skin, found: false };
  const eyes = [det.pair.a, det.pair.b].map((c, k) => measureEye(fr, skin, det, c, det.brows[k]));
  const cy = (eyes[0].cy + eyes[1].cy) / 2, mid = (eyes[0].cx + eyes[1].cx) / 2;
  const fw = faceWidthAt(fr, cy, mid);
  const lr = {
    width: Math.min(eyes[0].width, eyes[1].width) / Math.max(eyes[0].width, eyes[1].width),
    height: Math.min(eyes[0].height, eyes[1].height) / Math.max(eyes[0].height, eyes[1].height),
    dy: Math.abs(eyes[0].cy - eyes[1].cy),
    mirror: Math.abs((eyes[0].cx + eyes[1].cx) / 2 - mid),
  };
  for (const e of eyes) e.face_frac = fw ? e.width / fw.w : null;
  return { skin, found: true, T: det.T, eyes, mid, cy, sep: eyes[1].cx - eyes[0].cx, face_w: fw?.w ?? null, lr };
}

// ---------------------------------------------------------------- the verdict (thresholds: see gen/details/eyes/notes.md)
export const RULE = { width: 22, aspect: 1.8 };
export function verdict(m) {
  if (!m.found) return 'NO EYES';
  return m.eyes.every((e) => e.width >= RULE.width && e.aspect >= RULE.aspect) ? 'PASS' : 'FAIL';
}

// ---------------------------------------------------------------- one character, measured
export async function checkCharacter(name, { src = false } = {}) {
  const cf = charFiles(name);
  const file = src ? cf.rigged : cf.glb;
  const doc = await (await io()).read(r(file));
  const g = bodyGeom(doc);
  const t = await decodeTex(g.tex);
  const fr = faceRender(g, t);
  const m = measureFace(fr);
  return { name, file, tex: t.W, g, t, fr, m, verdict: verdict(m) };
}

export async function faceTile(fr, m, label, { w = 300, sub = '', overlay = false, zoom = false } = {}) {
  const cy = m.found ? m.cy : 110, mid = m.found ? m.mid : 0;
  const [x0, x1, y0, y1] = zoom ? [mid - 50, mid + 50, cy - 14, cy + 16] : [mid - 75, mid + 75, cy - 70, cy + 55];
  const img = await (await imageOf(fr, { x0, x1, y0, y1 })).png().toBuffer();
  const s = w / ((x1 - x0) / MM), H = Math.round(((y1 - y0) / MM) * s);
  const X = (x) => ((x - x0) / MM) * s, Y = (y) => ((y1 - y) / MM) * s;
  const rects = [];
  if (m.found) for (const e of m.eyes) {
    rects.push(`<rect x="${X(e.box.x0)}" y="${Y(e.box.y1)}" width="${X(e.box.x1) - X(e.box.x0)}" height="${Y(e.box.y0) - Y(e.box.y1)}" fill="none" stroke="#0f0" stroke-width="1.5"/>`);
    rects.push(`<rect x="${X(e.iris.x0)}" y="${Y(e.core.y1)}" width="${X(e.iris.x1) - X(e.iris.x0)}" height="${Y(e.core.y0) - Y(e.core.y1)}" fill="none" stroke="#f33" stroke-width="1"/>`);
    if (e.brow) rects.push(`<rect x="${X(e.brow.x0)}" y="${Y(e.brow.y1)}" width="${X(e.brow.x1) - X(e.brow.x0)}" height="${Y(e.brow.y0) - Y(e.brow.y1)}" fill="none" stroke="#39f" stroke-width="1"/>`);
  }
  // the measured texels: lid-dark red, sclera cyan
  const ov = Buffer.alloc(w * H * 4);
  if (m.found) for (const e of m.eyes) {
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
    skin: m.skin.rgb.map((x) => +x.toFixed(3)), face_w: +f1(m.face_w), sep: +f1(m.sep), mid: +f1(m.mid), eye_y: +f1(m.cy),
    lr: { width: +f2(m.lr.width), height: +f2(m.lr.height), dy: +f1(m.lr.dy) },
    eyes: e.map((q, k) => ({ side: k ? 'viewer_right' : 'viewer_left', width: +f1(q.width), height: +f1(q.height), aspect: +f2(q.aspect),
      iris_w: +f1(q.iris_w), iris_h: +f1(q.iris_h), reach: +f1(q.reach), sclera: +f2(q.sclera), sclera_mm2: +f1(q.sclera_mm2), face_frac: q.face_frac == null ? null : +f2(q.face_frac),
      cx: +f1(q.cx), cy: +f1(q.cy), box: Object.fromEntries(Object.entries(q.box).filter(([k2]) => k2 !== 'n').map(([k2, v]) => [k2, +f1(v)])),
      core: { x0: +f1(q.core.x0), x1: +f1(q.core.x1), y0: +f1(q.core.y0), y1: +f1(q.core.y1) }, brow: q.brow && Object.fromEntries(Object.entries(q.brow).map(([k2, v]) => [k2, +f1(v)])) })),
  };
}

// ---------------------------------------------------------------- CLI
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const out = opt('--out');
  const dump = opt('--dump');
  const src = args.includes('--src');
  const target = args.filter((a) => !a.startsWith('--'))[0] || 'all';
  const names = target === 'all' ? Object.keys(JSON.parse(fs.readFileSync(r('web/public/assets/chars/characters.json'), 'utf8'))).sort() : target.split(',');
  const rows = [], tiles = [];
  for (const name of names) {
    const c = await checkCharacter(name, { src });
    const s = summary(c);
    rows.push(s);
    if (dump) { fs.mkdirSync(dump, { recursive: true }); await (await imageOf(c.fr)).png().toFile(path.join(dump, `${name}${src ? '_src' : ''}.png`)); }
    const e = c.m.found ? c.m.eyes : null;
    const line = e ? `w ${f1(e[0].width)}/${f1(e[1].width)} asp ${f2(e[0].aspect)}/${f2(e[1].aspect)} reach ${f1(e[0].reach)}/${f1(e[1].reach)} scl ${f2(e[0].sclera)}/${f2(e[1].sclera)} iris ${f1(e[0].iris_w)}x${f1(e[0].iris_h)} T ${c.m.T}` : '';
    console.log(`${name.padEnd(19)} ${c.verdict.padEnd(7)} ${line}`);
    if (out) tiles.push(await faceTile(c.fr, c.m, `${name} ${c.verdict}`, { overlay: args.includes('--overlay'), zoom: args.includes('--zoom'), w: args.includes('--zoom') ? 600 : 300, sub: e ? `w ${f1(e[0].width)}/${f1(e[1].width)} a ${f2(e[0].aspect)}/${f2(e[1].aspect)} s ${f2(e[0].sclera)}/${f2(e[1].sclera)}` : '' }));
  }
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    const tag = src ? '_src' : '';
    fs.writeFileSync(path.join(out, `eyes${tag}.json`), JSON.stringify({ about: 'tools/eye_check.mjs: per character and eye, mm on the face plane (x to the viewer\'s right, y up from the Head joint)', rule: RULE, texture: src ? 'source (build input, full resolution)' : 'shipped GLB (webp 512)', characters: rows }, null, 1) + '\n');
    await sheet(tiles, path.join(out, `faces${tag}.jpg`), args.includes('--zoom') ? 3 : 6);
    console.log('wrote', path.join(out, `eyes${tag}.json`), path.join(out, `faces${tag}.jpg`));
  }
}
