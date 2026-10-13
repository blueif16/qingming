// The eye fix: a passing character's eye (or a drawn ink eye) stamped over a character's dot eyes, in the body texture
// at full resolution, before build_character.mjs writes the GLB (characters/<name>.json "eyes", run as
// build_character.mjs --eyes <spec.json>; variants get their base's spec from character.mjs, before their recolour).
//
//   spec: { "from": "<donor character>" | "ink", "eye": "viewer_left" | "viewer_right" (the donor eye to use; default
//           the wider), "scale": 1 (times the eye-separation ratio), "bold": 0.6 (mm the ink is thickened by),
//           "dy": 0 (mm the new eyes sit above (+) or below (-) the dots), "reuv": true | {mm, margin} (the eye areas
//           get their own islands of texture first: reuvEyes), "why": "..." }
//
// 1. Both faces are rendered on the face plane (tools/eye_check.mjs: rest pose, head frame, 0.25 mm a pixel) and
//    measured: the target's dots (centre, extent, brow), the donor's eye (iris centre, lid outline, corners, brow).
// 2. The donor's eye is scaled by the ratio of the face widths at eye height, its iris centred on the dot, its corners
//    turned level with the target's eye line, and mirrored for the other eye (both eyes are the same eye).
// 3. The old eye goes: the dark texels round the dot (the dot, its halo and any stub of lid, never the brow) are
//    filled from the skin round them (a membrane, Laplace).
// 4. The donor's eye is laid on that clean skin: its skin-like texels carry only their shading (target skin x donor
//    texel / donor skin), its ink, iris and sclera keep their colour, weighted by how far each texel is from the
//    donor's skin; the patch fades out over 2.5 mm.
// 5. The change is written back through the texel map: every texel of every front-facing triangle (with a texel's
//    margin, so seams get every chart they belong to) that lies on the visible face surface gets the change at its
//    face-plane point added.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import * as E from './eye_check.mjs';

const { MM, pxOf, pyOf, xOf, yOf, lumOf } = E;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// bilinear sample of a face render's colour at a face-plane point (mm); null off the surface
function sampleFace(fr, x, y) {
  const fi = (x - E.X0) / MM - 0.5, fj = (E.Y1 - y) / MM - 0.5, i0 = Math.floor(fi), j0 = Math.floor(fj), fx = fi - i0, fy = fj - j0;
  const out = [0, 0, 0];
  let wsum = 0;
  for (const [di, dj, w] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
    const i = i0 + di, j = j0 + dj;
    if (i < 0 || j < 0 || i >= fr.Wd || j >= fr.Hd) continue;
    const k = j * fr.Wd + i;
    if (fr.TRI[k] < 0) continue;
    for (let c = 0; c < 3; c++) out[c] += fr.rgb[k * 3 + c] * w;
    wsum += w;
  }
  return wsum > 0.5 ? out.map((v) => v / wsum) : null;
}

// ---------------------------------------------------------------- the donor's eye, as a little image in its own mm
// eye: { ax, ay } the iris centre, the box (mm) the patch covers, tilt (radians, the corners' line), skin, face_w,
// sample(dx, dy) -> rgb at an offset from the iris centre (null outside)
async function donorEye(spec) {
  if (spec.from === 'ink') return inkEye(spec);
  const c = await E.checkCharacter(spec.from, { src: 'plain' });   // the donor's own source, never a fix of its own
  if (!c.m.found) throw new Error(`eyes: no eyes found on the donor ${spec.from}`);
  const k = spec.eye === 'viewer_left' ? 0 : spec.eye === 'viewer_right' ? 1 : c.m.eyes[0].width >= c.m.eyes[1].width ? 0 : 1;
  const e = c.m.eyes[k];
  const ax = (e.iris.x0 + e.iris.x1) / 2, ay = e.core.cy;
  const top = Math.min(e.box.y1 + 4, e.brow ? e.brow.y0 - 1.5 : Infinity);
  const box = { x0: e.box.x0 - 3, x1: e.box.x1 + 3, y0: e.box.y0 - 3.5, y1: top };
  // the corners: the outline's outermost lid texels, left and right
  const mk = e.masks, cols = (i) => { const ys = []; for (let j = 0; j < mk.h; j++) { const q = j * mk.w + i; if (mk.lid[q] || mk.sc[q]) ys.push(yOf(j + mk.j0)); } return ys; };
  let li = 0, ri = mk.w - 1;
  while (li < mk.w && !cols(li).length) li++;
  while (ri >= 0 && !cols(ri).length) ri--;
  const mean = (a) => a.reduce((p, q) => p + q, 0) / a.length;
  const tilt = Math.atan2(mean(cols(ri)) - mean(cols(li)), xOf(ri) - xOf(li));
  // the donor patch on a 0.25 mm grid, its ink made bolder by `bold` mm (each texel takes the darkest colour within
  // that radius where it is darker than the skin), so a lid line of a texel or two still reads at 512
  const bold = spec.bold ?? 0.6;
  const gi0 = Math.floor((box.x0 - ax) / MM) - 1, gi1 = Math.ceil((box.x1 - ax) / MM) + 1, gj0 = Math.floor((ay - box.y1) / MM) - 1, gj1 = Math.ceil((ay - box.y0) / MM) + 1;
  const gw = gi1 - gi0 + 1, gh = gj1 - gj0 + 1, grid = new Float32Array(gw * gh * 3), ok = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const cc = sampleFace(c.fr, ax + (i + gi0) * MM, ay - (j + gj0) * MM);
    if (!cc) continue;
    ok[j * gw + i] = 1; grid.set(cc, (j * gw + i) * 3);
  }
  const rr = Math.round(bold / MM), Sd = c.m.skin.rgb, lumS = lumOf(Sd);
  const boldG = Float32Array.from(grid);
  if (rr > 0) for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    let best = -1, bl = lumOf([grid[(j * gw + i) * 3], grid[(j * gw + i) * 3 + 1], grid[(j * gw + i) * 3 + 2]]);
    for (let dj = -rr; dj <= rr; dj++) for (let di = -rr; di <= rr; di++) {
      if (di * di + dj * dj > rr * rr) continue;
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= gw || jj >= gh || !ok[jj * gw + ii]) continue;
      const q = jj * gw + ii, l = lumOf([grid[q * 3], grid[q * 3 + 1], grid[q * 3 + 2]]);
      if (l < bl && l < lumS * 0.7) { bl = l; best = q; }
    }
    if (best >= 0) boldG.set(grid.subarray(best * 3, best * 3 + 3), (j * gw + i) * 3);
  }
  const sample = (dx, dy) => {
    const fi = dx / MM - gi0, fj = -dy / MM - gj0, i0 = Math.floor(fi), j0 = Math.floor(fj), u = fi - i0, v = fj - j0;
    if (i0 < 0 || j0 < 0 || i0 + 1 >= gw || j0 + 1 >= gh) return null;
    const qs = [j0 * gw + i0, j0 * gw + i0 + 1, (j0 + 1) * gw + i0, (j0 + 1) * gw + i0 + 1], ws = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
    if (!qs.every((q) => ok[q])) return null;
    return [0, 1, 2].map((ch) => qs.reduce((acc, q, n) => acc + boldG[q * 3 + ch] * ws[n], 0));
  };
  const sep = Math.hypot(c.m.eyes[1].core.cx - c.m.eyes[0].core.cx, c.m.eyes[1].core.cy - c.m.eyes[0].core.cy);
  return { name: spec.from, side: k, ax, ay, box, tilt, skin: Sd, face_w: c.m.face_w, sep, width: e.width, height: e.height, sample };
}

// the drawn eye, when no donor fits: an almond outline, a dark iris, a hint of sclera, an upper lid stroke in ink, on a
// face 120 mm wide (the eye 26 mm), in a neutral skin that the compositing swaps for the target's
function inkEye(spec) {
  const skin = [0.85, 0.66, 0.48], ink = [0.1, 0.07, 0.06], iris = [0.16, 0.1, 0.07], white = [0.93, 0.9, 0.84];
  const W = 26, Hh = 9.5, R = 5.2;   // eye width, almond height, iris radius (mm)
  const upper = (x) => Hh * 0.55 * Math.pow(Math.max(0, 1 - (2 * x / W) ** 2), 0.75) + 0.8 * (x / W);   // a little lift at the outer corner
  const lower = (x) => -Hh * 0.4 * Math.pow(Math.max(0, 1 - (2 * x / W) ** 2), 0.9);
  const sample = (dx, dy) => {
    let c = skin;
    const inside = Math.abs(dx) < W / 2 && dy < upper(dx) && dy > lower(dx);
    if (inside) c = Math.hypot(dx, dy - 0.6) < R ? (Math.hypot(dx, dy - 0.6) < R * 0.45 ? ink : iris) : white;
    const du = Math.abs(dy - upper(dx)), dl = Math.abs(dy - lower(dx));
    if (Math.abs(dx) < W / 2 + 1.5 && du < 0.9 + 0.5 * (1 - Math.abs(2 * dx / W))) c = ink;           // the upper lid stroke, thick in the middle
    else if (Math.abs(dx) < W / 2 - 2 && dl < 0.35) c = c.map((v, i) => (v + skin[i] * 0.6 - 0.25) / 1.35);   // a faint lower lid
    return c;
  };
  return { name: 'ink', side: 1, ax: 0, ay: 0, box: { x0: -W / 2 - 4, x1: W / 2 + 4, y0: -9, y1: 10 }, tilt: 0, skin, face_w: 120, sep: 60, width: W, height: Hh, sample };
}


// ---------------------------------------------------------------- the eye areas' own texture space ("reuv")
// Where a face's eye area lies on UV slivers the 512 map can't hold (scholar, hat_traveller), the triangles of the eye
// area (every triangle the drawn eye or the cleaned dot touches) get one island of their own per eye, in texels of the
// body texture no triangle uses, mapped by their face-plane position at spec.reuv.mm (default 1) mm a texel of the
// 512 map (coarser, up to max_mm, only where the free space is too small). The island first gets the texels the
// triangles show now (baked from the face render, its margin filled outward), so nothing changes until the eye is
// drawn on it. Vertices an island shares with the triangles round it are copied (same position, normal, skin; new UV);
// no other triangle changes.
// spec.reuv: true | { mm: 1, max_mm: 2, margin: 3 (texels of the 512 map kept clear round each island), pad: 2 (mm
//   round the changed area), move: "all" | "slivers" (only the triangles whose UV island is under `sliver` texels of
//   the 512 map, 30; an eye with none keeps its UVs), face: false (true: every sliver triangle of the face's front
//   joins one island with them; "all": every triangle of the face's front) }
// An island is packed by its own outline (turned by quarter turns if that fits better) into the free texels.
export async function reuvEyes(doc, spec, donor, { log = console.log } = {}) {
  const opt = spec.reuv === true ? {} : spec.reuv;
  const g = E.bodyGeom(doc), t = await E.decodeTex(g.tex), fr = E.faceRender(g, t), m = E.measureFace(fr);
  if (!m.found) throw new Error('eyes reuv: no eyes found on the target face');
  const TW = t.W, TH = t.H, prim = g.prim, idx = g.idx, nTri = idx.length / 3, B = 512, bs = TW / B;
  const sepT = Math.hypot(m.eyes[1].core.cx - m.eyes[0].core.cx, m.eyes[1].core.cy - m.eyes[0].core.cy);
  const s = (sepT / donor.sep) * (spec.scale || 1);
  const pad = opt.pad ?? 2, margin = opt.margin ?? 3, move = opt.move || 'all', sliver = opt.sliver ?? 30;
  // each eye's changed area: the donor patch as it will be drawn (mirrored on the other side) and the dot's cleaning
  const regions = m.eyes.map((e, side) => {
    const ax = (e.iris.x0 + e.iris.x1) / 2, ay = e.core.cy + (spec.dy || 0), mirror = side !== donor.side;
    let x0 = (donor.box.x0 - donor.ax) * s, x1 = (donor.box.x1 - donor.ax) * s;
    if (mirror) [x0, x1] = [-x1, -x0];
    return { x0: Math.min(ax + x0, e.box.x0 - 3.25) - pad, x1: Math.max(ax + x1, e.box.x1 + 3.25) + pad,
      y0: Math.min(ay + (donor.box.y0 - donor.ay) * s, e.core.y0 - 3.25) - pad, y1: Math.max(ay + (donor.box.y1 - donor.ay) * s, e.core.y1 + 3.25) + pad };
  });
  const vis = new Float64Array(nTri);
  for (let k = 0; k < fr.TRI.length; k++) if (fr.TRI[k] >= 0) vis[fr.TRI[k] / 3]++;
  const { XV, YV, ZV } = fr;
  const frontness = (f) => {
    const [a, b, c] = [idx[f], idx[f + 1], idx[f + 2]];
    const u = [XV[b] - XV[a], YV[b] - YV[a], ZV[b] - ZV[a]], w = [XV[c] - XV[a], YV[c] - YV[a], ZV[c] - ZV[a]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    return n[2] / (Math.hypot(...n) || 1);
  };
  // the UV islands as they are (triangles joined through vertices with the same uv), their size in texels of the 512 map
  const uvOf = (f) => [0, 1, 2].map((k) => [g.T[idx[f + k] * 2] * B, g.T[idx[f + k] * 2 + 1] * B]);
  const parent = Int32Array.from({ length: nTri }, (_, i) => i), find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const byUV = new Map();
  for (let f = 0; f < idx.length; f += 3) for (let k = 0; k < 3; k++) {
    const v = idx[f + k], key = `${g.T[v * 2]},${g.T[v * 2 + 1]}`;
    if (byUV.has(key)) { const a = find(byUV.get(key)), b = find(f / 3); if (a !== b) parent[a] = b; } else byUV.set(key, f / 3);
  }
  const islArea = new Map();
  for (let f = 0; f < idx.length; f += 3) {
    const uv = uvOf(f), a = Math.abs((uv[1][0] - uv[0][0]) * (uv[2][1] - uv[0][1]) - (uv[2][0] - uv[0][0]) * (uv[1][1] - uv[0][1])) / 2;
    islArea.set(find(f / 3), (islArea.get(find(f / 3)) || 0) + a);
  }
  // the islands' triangles: the face's own triangles seen from the front (not a brim or a hair card seen past the face:
  // over 40 mm across, or turned more than 75 degrees away) that touch the changed area
  let islands = regions.map((rg, side) => {
    const tris = [];
    for (let f = 0; f < idx.length; f += 3) {
      if (!(vis[f / 3] > 0)) continue;
      const xs = [0, 1, 2].map((k) => XV[idx[f + k]]), ys = [0, 1, 2].map((k) => YV[idx[f + k]]);
      if (Math.max(...xs) < rg.x0 || Math.min(...xs) > rg.x1 || Math.max(...ys) < rg.y0 || Math.min(...ys) > rg.y1) continue;
      if (Math.max(...xs) - Math.min(...xs) > 40 || Math.max(...ys) - Math.min(...ys) > 40 || frontness(f) < 0.25) continue;
      if (move === 'slivers' && islArea.get(find(f / 3)) >= sliver) continue;
      tris.push(f);
    }
    return { side, tris };
  }).filter((il) => il.tris.length);
  // face: true: every sliver triangle of the face's front (brow to chin, cheek to cheek) joins too, so the islands'
  // border runs where the old texels hold their drawing (whole islands), not through smeared slivers
  if (opt.face) {
    const e0 = m.eyes[0], e1 = m.eyes[1], my = (e0.core.cy + e1.core.cy) / 2, mx = (e0.core.cx + e1.core.cx) / 2;
    const fx0 = mx - 0.95 * sepT, fx1 = mx + 0.95 * sepT, fy0 = my - 1.25 * sepT, fy1 = my + (opt.face_top ?? 0.5) * sepT;
    const extra = [];
    for (let f = 0; f < idx.length; f += 3) {
      if (!(vis[f / 3] > 0) || (opt.face !== 'all' && islArea.get(find(f / 3)) >= sliver) || frontness(f) < (opt.face === 'all' ? 0.1 : 0.25)) continue;
      const xs = [0, 1, 2].map((k) => XV[idx[f + k]]), ys = [0, 1, 2].map((k) => YV[idx[f + k]]);
      const cx = (xs[0] + xs[1] + xs[2]) / 3, cy = (ys[0] + ys[1] + ys[2]) / 3;
      if (cx < fx0 || cx > fx1 || cy < fy0 || cy > fy1) continue;
      if (Math.max(...xs) - Math.min(...xs) > 40 || Math.max(...ys) - Math.min(...ys) > 40) continue;
      extra.push(f);
    }
    islands = [{ side: 'face', tris: [...new Set([...islands.flatMap((il) => il.tris), ...extra])] }];
  }
  // two eye areas that share triangles (big eyes close together, large triangles over the nose) make one island
  if (islands.length === 2 && islands[0].tris.some((f) => islands[1].tris.includes(f))) islands = [{ side: 'both', tris: [...new Set([...islands[0].tris, ...islands[1].tris])] }];
  if (!islands.length) { log('eyes reuv: no triangle to move'); return { tris: new Set(), report: { islands: [] } }; }
  for (const il of islands) {
    const vs = il.tris.flatMap((f) => [idx[f], idx[f + 1], idx[f + 2]]);
    Object.assign(il, { x0: Math.min(...vs.map((v) => XV[v])), x1: Math.max(...vs.map((v) => XV[v])), y0: Math.min(...vs.map((v) => YV[v])), y1: Math.max(...vs.map((v) => YV[v])) });
  }

  // texels of the 512 map a triangle comes within a texel of
  const raster = (uvs, mark) => {
    const xs = uvs.map((q) => q[0]), ys = uvs.map((q) => q[1]), [ax, ay] = uvs[0], [bx, by] = uvs[1], [cx, cy] = uvs[2];
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy), tol = 1.5 / Math.sqrt(Math.abs(den) / 2 + 1);
    for (let y = Math.floor(Math.min(...ys)) - 1; y <= Math.ceil(Math.max(...ys)) + 1; y++) for (let x = Math.floor(Math.min(...xs)) - 1; x <= Math.ceil(Math.max(...xs)) + 1; x++) {
      const px = Math.min(Math.max(x + 0.5, Math.min(...xs)), Math.max(...xs)), py = Math.min(Math.max(y + 0.5, Math.min(...ys)), Math.max(...ys));
      if (Math.abs(den) < 1e-12) { mark(x, y); continue; }
      const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den;
      if (l1 >= -tol && l2 >= -tol && 1 - l1 - l2 >= -tol) mark(x, y);
    }
  };
  const used = new Uint8Array(B * B);
  for (let f = 0; f < idx.length; f += 3) raster(uvOf(f), (x, y) => { if (x >= 0 && y >= 0 && x < B && y < B) used[y * B + x] = 1; });
  // an island's outline in its own texels at mm a texel, turned by r quarter turns: local (a, b) -> placed (a', b')
  const turn = (a, b, w, h, r) => (r === 0 ? [a, b] : r === 1 ? [h - b, a] : r === 2 ? [w - a, h - b] : [b, w - a]);
  const local = (il, v, mm) => [(XV[v] - il.x0) / mm, (il.y1 - YV[v]) / mm];
  const outline = (il, mm, r) => {
    const w = (il.x1 - il.x0) / mm, h = (il.y1 - il.y0) / mm, [W2, H2] = r % 2 ? [h, w] : [w, h];
    const ow = Math.ceil(W2) + 2 * margin + 2, oh = Math.ceil(H2) + 2 * margin + 2, mask = new Uint8Array(ow * oh);
    for (const f of il.tris) raster([0, 1, 2].map((k) => { const [a, b] = turn(...local(il, idx[f + k], mm), w, h, r); return [a + margin + 1, b + margin + 1]; }), (x, y) => { if (x >= 0 && y >= 0 && x < ow && y < oh) mask[y * ow + x] = 1; });
    // the margin round it
    const grown = Uint8Array.from(mask);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) if (mask[y * ow + x]) for (let dy = -margin; dy <= margin; dy++) for (let dx = -margin; dx <= margin; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < ow && yy < oh) grown[yy * ow + xx] = 1; }
    return { ow, oh, w, h, mask, grown, cells: [...grown.keys()].filter((q) => grown[q]) };
  };
  const pack = (o) => {
    for (let y = 0; y + o.oh <= B; y++) for (let x = 0; x + o.ow <= B; x++) {
      let ok = true;
      for (const q of o.cells) if (used[(y + ((q / o.ow) | 0)) * B + x + (q % o.ow)]) { ok = false; break; }
      if (ok) return [x, y];
    }
    return null;
  };
  let mm = opt.mm ?? 1, placed = null;
  const maxMM = opt.max_mm ?? 2;
  while (mm <= maxMM + 1e-9 && !placed) {
    const saved = Uint8Array.from(used), res = [];
    for (const il of islands) {
      let best = null;
      for (let r = 0; r < 4 && !best; r++) { const o = outline(il, mm, r), at = pack(o); if (at) best = { o, at, r }; }
      if (!best) break;
      res.push(best);
      for (const q of best.o.cells) used[(best.at[1] + ((q / best.o.ow) | 0)) * B + best.at[0] + (q % best.o.ow)] = 1;
    }
    if (res.length === islands.length) placed = res; else { used.set(saved); mm = +(mm * 1.1).toFixed(3); }
  }
  if (!placed) throw new Error(`eyes reuv: no free texture space for the eye islands at up to ${maxMM} mm a texel`);
  const sT = (mm * B) / TW;   // mm a full-resolution texel

  // new UVs; vertices shared with triangles outside the island are copied
  const users = new Map();
  for (let f = 0; f < idx.length; f += 3) for (let k = 0; k < 3; k++) { const v = idx[f + k]; if (!users.has(v)) users.set(v, new Set()); users.get(v).add(f); }
  const sems = prim.listSemantics(), acc = Object.fromEntries(sems.map((q) => [q, prim.getAttribute(q)]));
  const nV = acc.POSITION.getCount(), copies = [], remap = new Map(), newUV = new Map(), islandOf = new Map();
  islands.forEach((il, i) => il.tris.forEach((f) => islandOf.set(f, i)));
  // a point of the island (face-plane mm) -> full-resolution texel coordinates
  const toTexel = (i, x, y) => {
    const { o, at, r } = placed[i], il = islands[i];
    const [a, b] = turn((x - il.x0) / mm, (il.y1 - y) / mm, o.w, o.h, r);
    return [(at[0] + margin + 1 + a) * bs, (at[1] + margin + 1 + b) * bs];
  };
  islands.forEach((il, i) => {
    for (const f of il.tris) for (let k = 0; k < 3; k++) {
      const v = idx[f + k], key = `${i}:${v}`;
      if (remap.has(key)) continue;
      const shared = [...users.get(v)].some((q) => islandOf.get(q) !== i);
      const nv = shared ? nV + copies.push(v) - 1 : v;
      remap.set(key, nv);
      const [tx, ty] = toTexel(i, XV[v], YV[v]);
      newUV.set(nv, [tx / TW, ty / TH]);
    }
  });
  for (const q of sems) {
    const a = acc[q], n = a.getElementSize(), old = a.getArray(), arr = new old.constructor(old.length + copies.length * n);
    arr.set(old);
    copies.forEach((v, c) => arr.set(old.subarray(v * n, v * n + n), (nV + c) * n));
    if (q === 'TEXCOORD_0') for (const [v, [u, w]] of newUV) { arr[v * 2] = u; arr[v * 2 + 1] = w; }
    a.setArray(arr);
  }
  const I = prim.getIndices(), oldI = I.getArray(), total = nV + copies.length;
  const ni = total > 65535 && oldI instanceof Uint16Array ? Uint32Array.from(oldI) : oldI.slice();
  islands.forEach((il, i) => il.tris.forEach((f) => { for (let k = 0; k < 3; k++) ni[f + k] = remap.get(`${i}:${idx[f + k]}`); }));
  I.setArray(ni);

  // bake: every full-resolution texel of each island's outline and margin gets what the face shows there now (off the
  // surface, the nearest of it); texels outside the outline are never touched
  const data = t.data;
  placed.forEach(({ o, at, r }, i) => {
    const il = islands[i], w = o.ow * bs, h = o.oh * bs, buf = new Float32Array(w * h * 3), ok = new Uint8Array(w * h), inside = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!o.grown[((y / bs) | 0) * o.ow + ((x / bs) | 0)]) continue;
      inside[y * w + x] = 1;
      // texel centre -> island-local (a, b) -> face plane
      const pt = unturn((x + 0.5) / bs - margin - 1, (y + 0.5) / bs - margin - 1, o.w, o.h, r);
      const c = sampleFace(fr, il.x0 + pt[0] * mm, il.y1 - pt[1] * mm);
      if (c) { buf.set(c, (y * w + x) * 3); ok[y * w + x] = 1; }
    }
    for (let pass = 0; pass < w + h; pass++) {
      let left = 0;
      const src = Uint8Array.from(ok);
      for (let q = 0; q < w * h; q++) if (inside[q] && !src[q]) {
        const x = q % w, y = (q / w) | 0, sum = [0, 0, 0]; let n = 0;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && src[yy * w + xx]) { for (let c = 0; c < 3; c++) sum[c] += buf[(yy * w + xx) * 3 + c]; n++; } }
        if (n) { for (let c = 0; c < 3; c++) buf[q * 3 + c] = sum[c] / n; ok[q] = 1; } else left++;
      }
      if (!left) break;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!inside[y * w + x] || !ok[y * w + x]) continue;
      const k = ((at[1] * bs + y) * TW + at[0] * bs + x) * 3;
      for (let c = 0; c < 3; c++) data[k + c] = Math.round(clamp(buf[(y * w + x) * 3 + c], 0, 1) * 255);
    }
  });
  g.tex.setImage(await sharp(data, { raw: { width: TW, height: TH, channels: 3 } }).png().toBuffer()).setMimeType('image/png');
  const report = {
    mm_per_texel_512: mm, move, face: !!opt.face, islands: islands.map((il, i) => ({ eye: typeof il.side === 'string' ? il.side : il.side ? 'viewer_right' : 'viewer_left', triangles: il.tris.length,
      mm: [+(il.x1 - il.x0).toFixed(1), +(il.y1 - il.y0).toFixed(1)], at_512: placed[i].at, size_512: [placed[i].o.ow, placed[i].o.oh], quarter_turns: placed[i].r })),
    vertices_copied: copies.length, vertices: total,
  };
  log(`eyes reuv: ${report.islands.map((q) => `${q.eye} ${q.triangles} triangles -> ${q.size_512.join('x')} texels at (${q.at_512.join(',')})`).join(', ')} of the 512 map, ${mm} mm a texel; ${copies.length} vertices copied`);
  return { tris: new Set(islands.flatMap((il) => il.tris)), report };
}
// inverse of turn(): placed (a', b') -> local (a, b)
function unturn(a, b, w, h, r) { return r === 0 ? [a, b] : r === 1 ? [b, h - a] : r === 2 ? [w - a, h - b] : [w - b, a]; }

// ---------------------------------------------------------------- Laplace fill of a mask from its surroundings
function membrane(rgb, mask, w, h, iters = 600) {
  const out = Float32Array.from(rgb);
  // start from the mean of the mask's border ring
  const ring = [0, 0, 0]; let n = 0;
  for (let q = 0; q < w * h; q++) if (!mask[q]) { const i = q % w, j = (q / w) | 0; if ((i > 0 && mask[q - 1]) || (i < w - 1 && mask[q + 1]) || (j > 0 && mask[q - w]) || (j < h - 1 && mask[q + w])) { for (let c = 0; c < 3; c++) ring[c] += rgb[q * 3 + c]; n++; } }
  for (let q = 0; q < w * h; q++) if (mask[q]) for (let c = 0; c < 3; c++) out[q * 3 + c] = ring[c] / (n || 1);
  const idx = []; for (let q = 0; q < w * h; q++) if (mask[q]) idx.push(q);
  for (let it = 0; it < iters; it++) for (const q of idx) {
    const i = q % w, j = (q / w) | 0;
    for (let c = 0; c < 3; c++) {
      let s = 0, k = 0;
      if (i > 0) { s += out[(q - 1) * 3 + c]; k++; } if (i < w - 1) { s += out[(q + 1) * 3 + c]; k++; }
      if (j > 0) { s += out[(q - w) * 3 + c]; k++; } if (j < h - 1) { s += out[(q + w) * 3 + c]; k++; }
      out[q * 3 + c] = s / k;
    }
  }
  return out;
}

// ---------------------------------------------------------------- the fix
export async function applyEyes(doc, spec, { log = console.log, debugDir = null } = {}) {
  const donor = await donorEye(spec);
  // "reuv": the eye areas get texture space of their own first (reuvEyes), and the eye is then drawn there
  const patch = spec.reuv ? await reuvEyes(doc, spec, donor, { log }) : null;
  const g = E.bodyGeom(doc);
  const t = await E.decodeTex(g.tex);
  const fr = E.faceRender(g, t);
  const m = E.measureFace(fr);
  if (!m.found) throw new Error('eyes: no eyes found on the target face');
  // the scale: the eyes' separation (centre to centre of the dots, and of the donor's irises) stands for the face's
  // width; the skin's own edge is cut by hair, caps and ears (0.38-0.85 of the separation across the cast)
  const sepT = Math.hypot(m.eyes[1].core.cx - m.eyes[0].core.cx, m.eyes[1].core.cy - m.eyes[0].core.cy);
  const s = (sepT / donor.sep) * (spec.scale || 1);
  const theta = Math.atan2(m.eyes[1].core.cy - m.eyes[0].core.cy, m.eyes[1].core.cx - m.eyes[0].core.cx);   // the target's eye line

  // the working window round both eyes, in face-plane pixels
  const X0w = Math.min(...m.eyes.map((e) => e.box.x0)) - 30, X1w = Math.max(...m.eyes.map((e) => e.box.x1)) + 30;
  const Y0w = Math.min(...m.eyes.map((e) => e.core.y0)) - 25, Y1w = Math.max(...m.eyes.map((e) => e.core.y1)) + 25;
  const i0 = pxOf(X0w), i1 = pxOf(X1w), j0 = pyOf(Y1w), j1 = pyOf(Y0w), w = i1 - i0 + 1, h = j1 - j0 + 1;
  const orig = new Float32Array(w * h * 3), on = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j + j0) * fr.Wd + (i + i0), q = j * w + i;
    if (fr.TRI[k] < 0) continue;
    on[q] = 1;
    for (let c = 0; c < 3; c++) orig[q * 3 + c] = fr.rgb[k * 3 + c];
  }

  // 3. the old eye: dark texels (>= 6% under the skin) within the old outline grown by 2.5 mm, under the brow
  const mask = new Uint8Array(w * h);
  for (const e of m.eyes) {
    const bx0 = Math.min(e.box.x0, e.core.x0) - 2.5, bx1 = Math.max(e.box.x1, e.core.x1) + 2.5, by0 = Math.min(e.box.y0, e.core.y0) - 2.5;
    let by1 = Math.max(e.box.y1, e.core.y1) + 2.5;
    if (e.brow) by1 = Math.min(by1, e.brow.y0 - 0.75);
    for (let j = pyOf(by1) - j0; j <= pyOf(by0) - j0; j++) for (let i = pxOf(bx0) - i0; i <= pxOf(bx1) - i0; i++) {
      const q = j * w + i;
      if (!on[q]) continue;
      const D = 1 - lumOf([orig[q * 3], orig[q * 3 + 1], orig[q * 3 + 2]]) / m.skin.lum;
      if (D >= 0.06) mask[q] = 1;
    }
  }
  // grow the mask by 0.75 mm so no rim of the dot stays
  const grown = Uint8Array.from(mask);
  for (let pass = 0; pass < 3; pass++) { const src = Uint8Array.from(grown); for (let q = 0; q < w * h; q++) if (!src[q] && on[q]) { const i = q % w, j = (q / w) | 0; if ((i > 0 && src[q - 1]) || (i < w - 1 && src[q + 1]) || (j > 0 && src[q - w]) || (j < h - 1 && src[q + w])) grown[q] = 1; } }
  const clean = membrane(orig, grown, w, h);

  // 4. the donor eye on each side
  const final = Float32Array.from(clean), alphaAll = new Float32Array(w * h);
  const Sd = donor.skin, dist = (c) => Math.hypot(c[0] - Sd[0], c[1] - Sd[1], c[2] - Sd[2]);
  for (let side = 0; side < 2; side++) {
    const e = m.eyes[side];
    const ax = (e.iris.x0 + e.iris.x1) / 2, ay = e.core.cy + (spec.dy || 0);     // the dot's centre (spec.dy: moved down or up, mm)
    const mirror = side !== donor.side;                         // the donor eye's own side is drawn as is
    // the donor's corners level with the target's eye line: rotate donor offsets by (theta - tilt_d) (mirrored: -tilt_d)
    const rot = theta - (mirror ? -donor.tilt : donor.tilt);
    const cr = Math.cos(-rot), sr = Math.sin(-rot);
    const bx = donor.box, fx = 2.5;   // feather (target mm)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = j * w + i;
      if (!on[q]) continue;
      let dx = xOf(i + i0) - ax, dy = yOf(j + j0) - ay;
      // target offset -> donor offset: unrotate, unscale, unmirror
      let ux = (dx * cr - dy * sr) / s, uy = (dx * sr + dy * cr) / s;
      if (mirror) ux = -ux;
      const px = donor.ax + ux, py = donor.ay + uy;
      if (px < bx.x0 || px > bx.x1 || py < bx.y0 || py > bx.y1) continue;
      const edge = Math.min(px - bx.x0, bx.x1 - px, py - bx.y0, bx.y1 - py) * s;   // mm to the patch's edge, on the target
      const alpha = smooth(0, fx, edge);
      const cd = donor.sample(ux, uy);
      if (!cd) continue;
      const wInk = smooth(0.07, 0.22, dist(cd));
      const base = [clean[q * 3], clean[q * 3 + 1], clean[q * 3 + 2]];
      for (let c = 0; c < 3; c++) {
        const shade = base[c] * clamp(cd[c] / Math.max(0.05, Sd[c]), 0.4, 1.5);
        const eyeC = shade * (1 - wInk) + cd[c] * wInk;
        final[q * 3 + c] = base[c] * (1 - alpha) + eyeC * alpha;
      }
      alphaAll[q] = Math.max(alphaAll[q], alpha);
    }
  }

  // the change, on the face plane
  const delta = new Float32Array(w * h * 3), changed = new Uint8Array(w * h);
  for (let q = 0; q < w * h; q++) for (let c = 0; c < 3; c++) {
    const d = final[q * 3 + c] - orig[q * 3 + c];
    delta[q * 3 + c] = d;
    if (Math.abs(d) > 1 / 512) changed[q] = 1;
  }
  const deltaAt = (x, y) => {
    const fi = (x - E.X0) / MM - 0.5 - i0, fj = (E.Y1 - y) / MM - 0.5 - j0, a = Math.floor(fi), b = Math.floor(fj), u = fi - a, v = fj - b;
    if (a < 0 || b < 0 || a + 1 >= w || b + 1 >= h) return null;
    const qs = [b * w + a, b * w + a + 1, (b + 1) * w + a, (b + 1) * w + a + 1];
    if (!qs.some((q) => changed[q])) return null;
    const ws = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
    return [0, 1, 2].map((c) => qs.reduce((acc, q, n) => acc + delta[q * 3 + c] * ws[n], 0));
  };

  // 5. back into the texture, through every front-facing triangle seen in the window
  const tris = new Set();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (changed[j * w + i]) {
    for (let dj = -8; dj <= 8; dj += 4) for (let di = -8; di <= 8; di += 4) {
      const ii = i + i0 + di, jj = j + j0 + dj;
      if (ii >= 0 && jj >= 0 && ii < fr.Wd && jj < fr.Hd && fr.TRI[jj * fr.Wd + ii] >= 0) tris.add(fr.TRI[jj * fr.Wd + ii]);
    }
  }
  const { idx, T } = g, { XV, YV, ZV } = fr, TW = t.W, TH = t.H, data = t.data;
  const done = new Uint8Array(TW * TH), writtenBy = new Set();
  let written = 0;
  // first every texel inside a triangle, then the texel's margin round each (seams: every chart gets the change)
  for (const margin of [false, true]) for (const f of tris) {
    const vs = [idx[f], idx[f + 1], idx[f + 2]];
    const uv = vs.map((v) => [T[v * 2] * TW, T[v * 2 + 1] * TH]);
    const [ax, ay] = uv[0], [bx, by] = uv[1], [cx, cy] = uv[2];
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(den) < 1e-9) continue;
    const xs = uv.map((p) => p[0]), ys = uv.map((p) => p[1]);
    for (let y = Math.max(0, Math.floor(Math.min(...ys)) - 1); y <= Math.min(TH - 1, Math.ceil(Math.max(...ys)) + 1); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(...xs)) - 1); x <= Math.min(TW - 1, Math.ceil(Math.max(...xs)) + 1); x++) {
        const px = x + 0.5, py = y + 0.5;
        const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den, l3 = 1 - l1 - l2;
        // inside, or within a texel of the edge (the seam's margin)
        const edgeTol = margin ? 1.5 / Math.sqrt(Math.abs(den) / 2) : 1e-6;
        if (l1 < -edgeTol || l2 < -edgeTol || l3 < -edgeTol) continue;
        const k = y * TW + x;
        if (done[k]) continue;
        const X = l1 * XV[vs[0]] + l2 * XV[vs[1]] + l3 * XV[vs[2]], Y = l1 * YV[vs[0]] + l2 * YV[vs[1]] + l3 * YV[vs[2]], Z = l1 * ZV[vs[0]] + l2 * ZV[vs[1]] + l3 * ZV[vs[2]];
        // only the visible surface: this point is the front-most one at its face-plane spot
        const fi = pxOf(X), fj = pyOf(Y);
        if (fi < 0 || fj < 0 || fi >= fr.Wd || fj >= fr.Hd) continue;
        const zf = fr.depth[fj * fr.Wd + fi];
        if (!(Math.abs(zf - Z) < 1.5)) continue;
        const d = deltaAt(X, Y);
        if (!d) continue;
        for (let c = 0; c < 3; c++) data[k * 3 + c] = Math.round(clamp(data[k * 3 + c] + d[c] * 255, 0, 255));
        done[k] = 1; written++; writtenBy.add(f);
      }
    }
  }
  g.tex.setImage(await sharp(data, { raw: { width: TW, height: TH, channels: 3 } }).png().toBuffer()).setMimeType('image/png');
  const report = {
    donor: donor.name, donor_eye: donor.side ? 'viewer_right' : 'viewer_left', scale: +s.toFixed(3), sep: +sepT.toFixed(1), donor_sep: +donor.sep.toFixed(1), face_w: m.face_w, donor_face_w: donor.face_w,
    eye_line_deg: +((theta * 180) / Math.PI).toFixed(2), donor_tilt_deg: +((donor.tilt * 180) / Math.PI).toFixed(2),
    dots: m.eyes.map((e) => ({ cx: +e.core.cx.toFixed(1), cy: +e.core.cy.toFixed(1), w: +e.core.w.toFixed(1), h: +e.core.h.toFixed(1) })),
    cleaned_mm2: +(grown.reduce((p, q) => p + q, 0) * MM * MM).toFixed(0), texels_written: written, triangles: tris.size,
    ...(patch ? { reuv: patch.report, written_outside_patch: [...tris].filter((f) => !patch.tris.has(f) && writtenBy.has(f)).length } : {}),
  };
  log(`eyes: ${donor.name} eye x${report.scale} over the dots at (${report.dots.map((d) => `${d.cx},${d.cy}`).join(') (')}) mm; ${written} texels in ${tris.size} triangles`);
  if (debugDir) {
    fs.mkdirSync(debugDir, { recursive: true });
    const img = (arr) => { const b = Buffer.alloc(w * h * 3); for (let q = 0; q < w * h * 3; q++) b[q] = Math.round(clamp(arr[q], 0, 1) * 255); return sharp(b, { raw: { width: w, height: h, channels: 3 } }); };
    await img(orig).png().toFile(path.join(debugDir, 'face_before.png'));
    await img(clean).png().toFile(path.join(debugDir, 'face_clean.png'));
    await img(final).png().toFile(path.join(debugDir, 'face_after.png'));
  }
  return report;
}

// ---------------------------------------------------------------- try it without a build
//   node tools/eye_fix.mjs <character> '<spec json>' [--out <dir>]
// applies the spec to the character's source texture in memory, writes the face before / cleaned / after, and measures
// the result at full resolution and shrunk to 512 webp as the build does
const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;
if (isMain) {
  const [name, specArg] = process.argv.slice(2);
  const oi = process.argv.indexOf('--out'), out = oi > 0 ? process.argv[oi + 1] : null;
  const cf = E.charFiles(name);
  const doc = await (await E.getIO()).read(path.resolve(E.ROOT, cf.rigged));
  const spec = JSON.parse(specArg);
  const rep = await applyEyes(doc, spec, { debugDir: out });
  console.log(JSON.stringify(rep));
  const g = E.bodyGeom(doc);
  for (const size of [null, 512]) {
    let img = Buffer.from(g.tex.getImage());
    if (size) img = await sharp(await sharp(img).resize(size, size).webp().toBuffer()).png().toBuffer();
    const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const t = { data, W: info.width, H: info.height };
    const fr = E.faceRender(g, t), m = E.measureFace(fr);
    const v = E.verdict(m);
    console.log(`${name} ${size || 'source'}: ${v} reach ${m.eyes.map((e) => e.reach.toFixed(1)).join('/')} width ${m.eyes.map((e) => e.width.toFixed(1)).join('/')} aspect ${m.eyes.map((e) => e.aspect.toFixed(2)).join('/')} sclera ${m.eyes.map((e) => e.sclera.toFixed(2)).join('/')}`);
    if (out) {
      fs.writeFileSync(path.join(out, `tile_${size || 'src'}.png`), await E.faceTile(fr, m, `${name} ${size || 'src'} ${v}`, { overlay: true, w: 500 }));
      fs.writeFileSync(path.join(out, `zoom_${size || 'src'}.png`), await E.faceTile(fr, m, `${name} ${size || 'src'} ${v}`, { overlay: false, zoom: true, w: 600, boxes: false }));
    }
  }
}
