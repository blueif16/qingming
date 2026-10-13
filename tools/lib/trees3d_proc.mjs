// Wood built from a painted card's own strokes (tools/trees3d.mjs, trunk: 'proc'; gen/details/trees/method.md): for the
// thin forms Meshy can't hold (slender trunks, saplings, young shoot trees, bamboo culms, a shrub's stems).
//   1. the card's solid pixels, opened by `open` px (thin shoots and twigs go, trunk and limbs stay);
//   2. the part joined to the foot, thinned to a one-pixel skeleton (Zhang-Suen), walked from the foot as a tree;
//      short spurs pruned;
//   3. each branch a tube along its skeleton, its radius the stroke's half width (distance transform), its colour the
//      card's paint along the stroke's middle; branches swing in depth about their forks (alternately forward and
//      back), so the front view stays the card's;
//   4. its ends are the tips where the crown's clumps go.
// Output in the Blender convention of blender/trees3d_convert.py (x right, y depth with the front at -y, z up, metres,
// the foot at the origin): positions, normals, colors (sRGB 0-1), indices, tips [{ i, p, c, dir, r, g }], geo, height.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');

function erode(m, W, H, r) {
  const t = new Uint8Array(m.length), o = new Uint8Array(m.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 1; for (let i = x - r; i <= x + r && v; i++) v = i >= 0 && i < W ? m[y * W + i] : 0; t[y * W + x] = v; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 1; for (let i = y - r; i <= y + r && v; i++) v = i >= 0 && i < H ? t[i * W + x] : 0; o[y * W + x] = v; }
  return o;
}
function dilate(m, W, H, r) {
  const t = new Uint8Array(m.length), o = new Uint8Array(m.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let i = Math.max(0, x - r); i <= Math.min(W - 1, x + r) && !v; i++) v = m[y * W + i]; t[y * W + x] = v; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let i = Math.max(0, y - r); i <= Math.min(H - 1, y + r) && !v; i++) v = t[i * W + x]; o[y * W + x] = v; }
  return o;
}
// chamfer distance to the nearest empty pixel (3-4 weights, /3 = px)
function distance(m, W, H) {
  const d = new Float32Array(m.length);
  for (let i = 0; i < m.length; i++) d[i] = m[i] ? 1e9 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!d[i]) continue; d[i] = Math.min(d[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4); }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!d[i]) continue; d[i] = Math.min(d[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4); }
  for (let i = 0; i < d.length; i++) d[i] /= 3;
  return d;
}
function thin(m, W, H) { // Zhang-Suen
  const s = Uint8Array.from(m);
  const nb = (x, y) => [s[(y - 1) * W + x], s[(y - 1) * W + x + 1], s[y * W + x + 1], s[(y + 1) * W + x + 1], s[(y + 1) * W + x], s[(y + 1) * W + x - 1], s[y * W + x - 1], s[(y - 1) * W + x - 1]];
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (!s[y * W + x]) continue;
        const p = nb(x, y), b = p.reduce((a, v) => a + v, 0);
        if (b < 2 || b > 6) continue;
        let a = 0;
        for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++;
        if (a !== 1) continue;
        if (step === 0 ? (p[0] * p[2] * p[4] || p[2] * p[4] * p[6]) : (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
        del.push(y * W + x);
      }
      for (const i of del) s[i] = 0;
      if (del.length) changed = true;
    }
  }
  return s;
}

export async function woodFromCard(file, { foot, mPerPx, open = 2, minSpur = 10, seed = 1, sides = 6, step = 0.18 } = {}) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const solid = new Uint8Array(N);
  for (let i = 0; i < N; i++) solid[i] = data[i * 4 + 3] >= 150 ? 1 : 0;
  const wood0 = open > 0 ? dilate(erode(solid, W, H, open), W, H, open) : solid;
  // the part joined to the foot
  const wood = new Uint8Array(N);
  let fx = Math.round(foot[0]), fy = Math.min(H - 1, Math.round(foot[1]));
  let start = -1;
  for (let r = 0; r < 40 && start < 0; r++) for (let dy = -r; dy <= 0 && start < 0; dy++) for (let dx = -r; dx <= r && start < 0; dx++) { const x = fx + dx, y = fy + dy; if (x >= 0 && y >= 0 && x < W && y < H && wood0[y * W + x]) start = y * W + x; }
  if (start < 0) throw new Error('no wood at the foot');
  const stack = [start];
  wood[start] = 1;
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (wood0[j] && !wood[j]) { wood[j] = 1; stack.push(j); } }
  }
  const dt = distance(wood, W, H);
  const sk = thin(wood, W, H);
  // the skeleton walked from the pixel nearest the foot (BFS: a tree, loops broken)
  let root = -1, best = Infinity;
  for (let i = 0; i < N; i++) if (sk[i]) { const x = i % W, y = (i / W) | 0, d = (x - fx) ** 2 + (y - fy) ** 2; if (d < best) { best = d; root = i; } }
  const parent = new Int32Array(N).fill(-2), order = [root], kids = new Map();
  parent[root] = -1;
  for (let q = 0; q < order.length; q++) {
    const i = order[q], x = i % W, y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy; if (!dx && !dy || xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = yy * W + xx;
      if (sk[j] && parent[j] === -2) { parent[j] = i; order.push(j); if (!kids.has(i)) kids.set(i, []); kids.get(i).push(j); }
    }
  }
  // prune spurs: a leaf whose run back to a fork is shorter than minSpur px (or than the stroke's width there)
  let pruned = true;
  const alive = new Uint8Array(N);
  for (const i of order) alive[i] = 1;
  const kidsOf = (i) => (kids.get(i) || []).filter((j) => alive[j]);
  while (pruned) {
    pruned = false;
    for (const i of order) {
      if (!alive[i] || kidsOf(i).length || i === root) continue;
      const run = [i];
      let j = parent[i];
      while (j >= 0 && kidsOf(j).length === 1 && j !== root) { run.push(j); j = parent[j]; }
      if (j >= 0 && run.length < Math.max(minSpur, 1.5 * dt[j])) { for (const k of run) alive[k] = 0; pruned = true; }
    }
  }
  const rand = (() => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  // how much wood grows on from each pixel (the main stem at a fork is the child carrying the most)
  const size = new Float64Array(N);
  for (let q = order.length - 1; q >= 0; q--) { const i = order[q]; if (!alive[i]) continue; size[i] += 1; if (parent[i] >= 0) size[parent[i]] += size[i]; }
  // branches: runs between forks; each a polyline of pixels from its fork outward. At a fork the main stem goes on at
  // its parent's depth rate (`rate`, m of depth per m along); each side branch swings out, alternately forward and back
  const branches = [];
  let flip = 1;
  const walk = (from, first, depth, rate) => {
    const pts = [from, first];
    let i = first;
    while (kidsOf(i).length === 1) { i = kidsOf(i)[0]; pts.push(i); }
    const b = { pts, depth, rate, kids: [] };
    branches.push(b);
    const ks = kidsOf(i).sort((a, c) => size[c] - size[a]);
    ks.forEach((k, n) => {
      if (n === 0) b.kids.push(walk(i, k, depth, rate));
      else { flip = -flip; b.kids.push(walk(i, k, depth + 1, rate + flip * (0.35 + 0.25 * rand()))); }
    });
    return b;
  };
  const rk = kidsOf(root).sort((a, c) => size[c] - size[a]);
  if (!rk.length) throw new Error('skeleton has no branch');
  rk.forEach((k, n) => walk(root, k, n ? 1 : 0, n ? (n % 2 ? 0.4 : -0.4) : 0));
  // to metres (x right, z up, y depth; front -y), the foot at the origin
  const toM = (i) => [((i % W) - fx) * mPerPx, (fy - ((i / W) | 0)) * mPerPx];
  const pos = [], nrm = [], col = [], idx = [], geo = [], tips = [];
  const colAt = (i) => {
    const x = i % W, y = (i / W) | 0, rad = Math.max(1, Math.round(dt[i] * 0.5));
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = (yy * W + xx) * 4; if (data[j + 3] < 200) continue;
      r += data[j]; g += data[j + 1]; b += data[j + 2]; n++;
    }
    return n ? [r / n / 255, g / n / 255, b / n / 255] : [0.35, 0.3, 0.25];
  };
  const Hm = (fy - Math.min(...order.filter((i) => alive[i]).map((i) => (i / W) | 0))) * mPerPx;
  const zOf = new Map(); // pixel -> depth (m) where a branch's fork sits
  zOf.set(root, 0);
  const arc = new Map([[root, 0]]);
  for (const b of branches) {
    // resample the polyline every `step` m (at least 3 samples), smoothing the pixel steps
    const raw = b.pts.map((i) => ({ i, m: toM(i), r: Math.max(0.6, dt[i]) * mPerPx }));
    const z0 = zOf.get(b.pts[0]) ?? 0, a0 = arc.get(b.pts[0]) ?? 0;
    const L = [0];
    for (let k = 1; k < raw.length; k++) L.push(L[k - 1] + Math.hypot(raw[k].m[0] - raw[k - 1].m[0], raw[k].m[1] - raw[k - 1].m[1]));
    const total = L[L.length - 1];
    const n = Math.max(2, Math.ceil(total / step));
    const swing = b.rate; // m of depth per m along
    const samples = [];
    for (let s = 0; s <= n; s++) {
      const t = (s / n) * total;
      let k = 1; while (k < L.length - 1 && L[k] < t) k++;
      const f = L[k] > L[k - 1] ? (t - L[k - 1]) / (L[k] - L[k - 1]) : 0;
      const A = raw[k - 1], B = raw[k];
      // a little smoothing of x, y over +-2 px
      const sm = (c) => { let a = 0, w = 0; for (let d = -2; d <= 2; d++) { const q = raw[Math.max(0, Math.min(raw.length - 1, k - 1 + d))]; a += q.m[c]; w++; } return a / w; };
      const x = s === 0 ? A.m[0] : (A.m[0] + (B.m[0] - A.m[0]) * f) * 0.5 + sm(0) * 0.5;
      const z = s === 0 ? A.m[1] : (A.m[1] + (B.m[1] - A.m[1]) * f) * 0.5 + sm(1) * 0.5;
      const r = (A.r + (B.r - A.r) * f) * (s === n ? 0.85 : 1);
      samples.push({ p: [x, z0 + swing * t, z], r, c: colAt(f < 0.5 ? A.i : B.i), a: a0 + t });
    }
    // the next branches start where this one ends
    const end = b.pts[b.pts.length - 1];
    zOf.set(end, samples[samples.length - 1].p[1]);
    arc.set(end, a0 + total);
    // tube: rings of `sides` round the path (thin branches fewer)
    const base = pos.length / 3;
    const ns = samples[0].r > 0.06 ? sides : samples[0].r > 0.025 ? 5 : 4;
    for (let s = 0; s < samples.length; s++) {
      const P = samples[s].p, Q = samples[Math.min(samples.length - 1, s + 1)].p, O = samples[Math.max(0, s - 1)].p;
      let T = [Q[0] - O[0], Q[1] - O[1], Q[2] - O[2]]; const tl = Math.hypot(...T) || 1; T = T.map((v) => v / tl);
      let U = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let Bv = [T[1] * U[2] - T[2] * U[1], T[2] * U[0] - T[0] * U[2], T[0] * U[1] - T[1] * U[0]]; const bl = Math.hypot(...Bv); Bv = Bv.map((v) => v / bl);
      const Nv = [Bv[1] * T[2] - Bv[2] * T[1], Bv[2] * T[0] - Bv[0] * T[2], Bv[0] * T[1] - Bv[1] * T[0]];
      // a little roughness so the wood never reads as a pipe
      const wob = 1 + 0.12 * Math.sin(samples[s].a * 7.3 + seed) * (b.depth ? 0.5 : 1);
      for (let k = 0; k < ns; k++) {
        const th = (k / ns) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        const d = [Nv[0] * c + Bv[0] * sn, Nv[1] * c + Bv[1] * sn, Nv[2] * c + Bv[2] * sn];
        const r = samples[s].r * wob * (1 + 0.08 * Math.sin(th * 3 + s));
        pos.push(P[0] + d[0] * r, P[1] + d[1] * r, P[2] + d[2] * r);
        nrm.push(...d);
        col.push(...samples[s].c.map((v) => v * (0.92 + 0.08 * c)));
        geo.push(samples[s].a);
      }
    }
    for (let s = 0; s < samples.length - 1; s++) for (let k = 0; k < ns; k++) {
      const a = base + s * ns + k, b2 = base + s * ns + ((k + 1) % ns), c = a + ns, d = b2 + ns;
      idx.push(a, c, b2, b2, c, d);
    }
    // the end: a cap point; a tip if nothing grows on from here
    const last = samples[samples.length - 1], prev = samples[Math.max(0, samples.length - 3)];
    const ci = pos.length / 3;
    const Tn = [last.p[0] - prev.p[0], last.p[1] - prev.p[1], last.p[2] - prev.p[2]]; const tn = Math.hypot(...Tn) || 1;
    pos.push(last.p[0] + (Tn[0] / tn) * last.r, last.p[1] + (Tn[1] / tn) * last.r, last.p[2] + (Tn[2] / tn) * last.r);
    nrm.push(Tn[0] / tn, Tn[1] / tn, Tn[2] / tn); col.push(...last.c); geo.push(last.a + last.r);
    const lb = base + (samples.length - 1) * ns;
    for (let k = 0; k < ns; k++) idx.push(lb + k, ci, lb + ((k + 1) % ns));
    if (!b.kids.length && last.p[2] > 0.25 * Hm) tips.push({ i: ci, p: last.p.map((v) => +v.toFixed(4)), c: last.p.map((v) => +v.toFixed(4)), dir: Tn.map((v) => +(v / tn).toFixed(4)), r: +last.r.toFixed(4), g: +(last.a).toFixed(3) });
    b.samples = samples;
  }
  return { positions: pos, normals: nrm, colors: col, indices: idx, geo, tips, height: Hm, tris: idx.length / 3, verts: pos.length / 3, branches: branches.length, swung: true,
    // the branch paths (for clumps along the limbs): [{ depth, pts: [[x, y, z]], r }]
    paths: branches.map((b) => ({ depth: b.depth, pts: b.samples.map((s) => s.p.map((v) => +v.toFixed(3))), r: +b.samples[0].r.toFixed(3) })) };
}
