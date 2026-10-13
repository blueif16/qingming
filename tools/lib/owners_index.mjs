// The built sections' geometry by owner (gen/sections/<name>/owners.{json,bin}, blender/owners_dump.py), indexed for
// the contact checks and the placement predictor: a uniform plan grid (X, D) of triangle ids, vertical rays, nearest
// triangles, inside tests and rods (thin straight pieces: poles, shafts, rails) found by connectivity.
// Map frame throughout: X east, D north, H up (the page: x = X, y = H, z = -D).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CELL = 0.5;

export class World {
  constructor() {
    this.tris = []; // chunks: { F (Float32Array 9/tri), owner (Int32Array), mat (Int32Array) }
    this.T = null; // Float32Array, all triangles
    this.owner = null; // Int32Array owner id per triangle
    this.mat = null; // Int32Array material id per triangle
    this.owners = []; // id -> name
    this.ownerId = new Map();
    this.mats = []; // id -> "<mat>__col|nocol"
    this.matId = new Map();
    this.ownerSection = []; // id -> section
    this.grid = new Map();
    this.rodCache = new Map();
    this.ownerTris = new Map(); // owner id -> [tri ids]
    this.excluded = [];
  }

  static load(sections, { exclude = {} } = {}) {
    const w = new World();
    const parts = [];
    let n = 0;
    for (const s of sections) {
      const j = JSON.parse(fs.readFileSync(path.join(QM, `gen/sections/${s}/owners.json`), 'utf8'));
      const bin = fs.readFileSync(path.join(QM, `gen/sections/${s}/owners.bin`));
      const F = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
      const ex = new Set(exclude[s] || []);
      for (const [o, ranges] of Object.entries(j.owners)) {
        if (ex.has(o)) { w.excluded.push(`${s}:${o}`); continue; }
        // an owner may appear in two sections (ground, edge walls): keep them apart by section
        const key = o === 'ground' || o.startsWith('edge:') || o.startsWith('mesh:') || o === 'water' ? `${s}|${o}` : o;
        if (!w.ownerId.has(key)) { w.ownerId.set(key, w.owners.length); w.owners.push(key); w.ownerSection.push(s); }
        for (const [t0, cnt, m] of ranges) {
          if (!w.matId.has(m)) { w.matId.set(m, w.mats.length); w.mats.push(m); }
          parts.push({ F, t0, cnt, oid: w.ownerId.get(key), mid: w.matId.get(m) });
          n += cnt;
        }
      }
    }
    w.T = new Float32Array(n * 9);
    w.owner = new Int32Array(n);
    w.mat = new Int32Array(n);
    let k = 0;
    for (const p of parts) {
      w.T.set(p.F.subarray(p.t0 * 9, (p.t0 + p.cnt) * 9), k * 9);
      w.owner.fill(p.oid, k, k + p.cnt);
      w.mat.fill(p.mid, k, k + p.cnt);
      k += p.cnt;
    }
    w.n = n;
    w.collideMat = w.mats.map((m) => m.endsWith('__col'));
    w.hiddenMat = w.mats.map((m) => /hidden/.test(m));
    // the plan grid
    const T = w.T;
    for (let t = 0; t < n; t++) {
      const o = t * 9;
      const x0 = Math.min(T[o], T[o + 3], T[o + 6]), x1 = Math.max(T[o], T[o + 3], T[o + 6]);
      const d0 = Math.min(T[o + 1], T[o + 4], T[o + 7]), d1 = Math.max(T[o + 1], T[o + 4], T[o + 7]);
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(d0 / CELL); j <= Math.floor(d1 / CELL); j++) {
        const key = i * 100003 + j;
        let c = w.grid.get(key);
        if (!c) w.grid.set(key, (c = []));
        c.push(t);
      }
      let l = w.ownerTris.get(w.owner[t]);
      if (!l) w.ownerTris.set(w.owner[t], (l = []));
      l.push(t);
    }
    return w;
  }

  isCollide(t) { return this.collideMat[this.mat[t]]; }
  ownerName(t) { return this.owners[this.owner[t]]; }
  // the owner's map ID (section-local owners like "outer_road|ground" give "ground")
  static bare(name) { const i = name.indexOf('|'); return i >= 0 ? name.slice(i + 1) : name; }

  // triangle ids whose plan bounding box may lie within r of (X, D)
  near(X, D, r) {
    const out = new Set();
    for (let i = Math.floor((X - r) / CELL); i <= Math.floor((X + r) / CELL); i++) for (let j = Math.floor((D - r) / CELL); j <= Math.floor((D + r) / CELL); j++) {
      const c = this.grid.get(i * 100003 + j);
      if (c) for (const t of c) out.add(t);
    }
    return out;
  }

  // every hit of a vertical line through (X, D): [{ h, t }] (a triangle covering the point in plan, its height there)
  vertical(X, D, filter = null) {
    const c = this.grid.get(Math.floor(X / CELL) * 100003 + Math.floor(D / CELL));
    const out = [];
    if (!c) return out;
    const T = this.T;
    for (const t of c) {
      if (filter && !filter(t)) continue;
      const o = t * 9;
      const ax = T[o], ad = T[o + 1], bx = T[o + 3], bd = T[o + 4], cx = T[o + 6], cd = T[o + 7];
      const det = (bd - cd) * (ax - cx) + (cx - bx) * (ad - cd);
      if (Math.abs(det) < 1e-12) continue; // vertical triangle
      const l1 = ((bd - cd) * (X - cx) + (cx - bx) * (D - cd)) / det;
      const l2 = ((cd - ad) * (X - cx) + (ax - cx) * (D - cd)) / det;
      const l3 = 1 - l1 - l2;
      const e = -1e-7;
      if (l1 < e || l2 < e || l3 < e) continue;
      out.push({ h: l1 * T[o + 2] + l2 * T[o + 5] + l3 * T[o + 8], t });
    }
    return out;
  }

  // three.js raycastFirst downward from H0 at (X, D) on the given triangles: the highest hit at or below H0, else null
  firstDown(X, D, H0, filter) {
    let best = null;
    for (const v of this.vertical(X, D, filter)) if (v.h <= H0 + 1e-6 && (!best || v.h > best.h)) best = v;
    return best;
  }

  // closest point on triangle t to p = [X, D, H]: { d, q }
  closest(t, p) {
    const T = this.T, o = t * 9;
    return closestOnTri(p, [T[o], T[o + 1], T[o + 2]], [T[o + 3], T[o + 4], T[o + 5]], [T[o + 6], T[o + 7], T[o + 8]]);
  }

  // the nearest triangle to p among those the filter keeps, searching r metres round it in plan
  nearest(p, r, filter) {
    let best = null;
    for (const t of this.near(p[0], p[1], r)) {
      if (filter && !filter(t)) continue;
      const c = this.closest(t, p);
      if (!best || c.d < best.d) best = { ...c, t };
    }
    return best && best.d <= r + 2 ? best : null;
  }

  // is p inside the closed pieces of an owner? parity of crossings along three rays (up, down, +X), counted on that
  // owner's triangles; inside when at least two of the three are odd (an open plane or a seam can spoil one)
  inside(p, oid) {
    const tris = this.ownerTris.get(oid) || [];
    const dirs = [[0, 0, 1], [0, 0, -1], [1, 0.0137, 0.0071]];
    let odd = 0;
    for (const dir of dirs) {
      let n = 0;
      for (const t of tris) if (rayTri(p, dir, this.T, t * 9)) n++;
      if (n % 2) odd++;
    }
    return odd >= 2;
  }

  // rods of an owner: connected pieces (vertices welded at 1 mm) that are long and thin: [{ a, b, r, len, tris }]
  rods(oid, { minLen = 0.5, maxR = 0.08 } = {}) {
    const key = `${oid}:${minLen}:${maxR}`;
    if (this.rodCache.has(key)) return this.rodCache.get(key);
    const tris = this.ownerTris.get(oid) || [];
    const T = this.T;
    const vid = new Map(), parent = [];
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const vOf = (o) => {
      const k = `${Math.round(T[o] * 1000)},${Math.round(T[o + 1] * 1000)},${Math.round(T[o + 2] * 1000)}`;
      let id = vid.get(k);
      if (id === undefined) { id = parent.length; parent.push(id); vid.set(k, id); }
      return id;
    };
    const triV = tris.map((t) => [vOf(t * 9), vOf(t * 9 + 3), vOf(t * 9 + 6)]);
    for (const [a, b, c] of triV) { parent[find(b)] = find(a); parent[find(c)] = find(a); }
    const comps = new Map();
    tris.forEach((t, i) => { const r = find(triV[i][0]); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(t); });
    const out = [];
    for (const list of comps.values()) {
      const pts = [];
      for (const t of list) for (let k = 0; k < 9; k += 3) pts.push([T[t * 9 + k], T[t * 9 + k + 1], T[t * 9 + k + 2]]);
      const rod = rodOf(pts);
      if (rod && rod.len >= minLen && rod.r <= maxR) out.push({ ...rod, tris: list });
    }
    this.rodCache.set(key, out);
    return out;
  }
}

// ---------------------------------------------------------------- geometry helpers
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const addS = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Ericson, Real-Time Collision Detection 5.1.5
export function closestOnTri(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  let q;
  if (d1 <= 0 && d2 <= 0) q = a;
  else {
    const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) q = b;
    else {
      const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) q = addS(a, ab, d1 / (d1 - d3));
      else {
        const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
        if (d6 >= 0 && d5 <= d6) q = c;
        else {
          const vb = d5 * d2 - d1 * d6;
          if (vb <= 0 && d2 >= 0 && d6 <= 0) q = addS(a, ac, d2 / (d2 - d6));
          else {
            const va = d3 * d6 - d5 * d4;
            if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) q = addS(b, sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)));
            else {
              const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
              q = [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
            }
          }
        }
      }
    }
  }
  // a degenerate triangle (two vertices the same, or in line) gave NaN here, which made every later comparison false
  // and hid the true nearest triangle: the nearest point of its edges instead (fix-S4, 2026-10-13)
  if (!Number.isFinite(q[0] + q[1] + q[2])) q = [[a, b], [b, c], [c, a]].map(([u, x]) => segClosest(p, u, x)).sort((m, n) => dist(p, m) - dist(p, n))[0];
  return { d: dist(p, q), q };
}

// does the ray p + s dir (s > 0) cross triangle at T[o..o+8]? (Moller-Trumbore)
function rayTri(p, dir, T, o) {
  const a = [T[o], T[o + 1], T[o + 2]], e1 = [T[o + 3] - a[0], T[o + 4] - a[1], T[o + 5] - a[2]], e2 = [T[o + 6] - a[0], T[o + 7] - a[1], T[o + 8] - a[2]];
  const h = cross(dir, e2), det = dot(e1, h);
  if (Math.abs(det) < 1e-12) return false;
  const f = 1 / det, s = sub(p, a), u = f * dot(s, h);
  if (u < 0 || u > 1) return false;
  const q = cross(s, e1), v = f * dot(dir, q);
  if (v < 0 || u + v > 1) return false;
  return f * dot(e2, q) > 1e-6;
}

// a piece's principal axis (power iteration on its covariance): its ends, length and largest radius off the axis
function rodOf(pts) {
  const n = pts.length;
  if (n < 6) return null;
  const c = [0, 0, 0];
  for (const p of pts) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; }
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of pts) { const d = sub(p, c); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += d[i] * d[j]; }
  let v = [1, 0.3, 0.2];
  for (let it = 0; it < 30; it++) {
    const w = [dot(C[0], v), dot(C[1], v), dot(C[2], v)];
    const l = Math.hypot(...w) || 1;
    v = w.map((x) => x / l);
  }
  let lo = Infinity, hi = -Infinity, r = 0;
  for (const p of pts) {
    const d = sub(p, c), s = dot(d, v);
    lo = Math.min(lo, s); hi = Math.max(hi, s);
    r = Math.max(r, Math.hypot(...sub(d, v.map((x) => x * s))));
  }
  return { a: addS(c, v, lo), b: addS(c, v, hi), len: hi - lo, r };
}

function segClosest(p, a, b) {
  const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
  return addS(a, ab, t);
}
// distance from p to segment a-b
export function segDist(p, a, b) {
  const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
  return dist(p, addS(a, ab, t));
}
