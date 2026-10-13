// The boats in the contact checks (details pass, fix-boats; gen/details/brief_contacts_rollout.md): each section's
// boats by node (gen/sections/<name>/boat_owners.{json,bin}, written by blender/boat_owners.py from build_boats.py), posed
// at an instant (the page's root and node matrices: tools/people_dump.mjs `boats`, or the rest pose), added to the
// sections' World (tools/lib/owners_index.mjs) as extra owners "<map id>|<node>", so every query of the checks (vertical
// rays, nearest surfaces, inside tests, rods) sees the boats where the page drew them at that instant.
// Also: verify() compares the owners with the shipped boats GLB, and crewSpot() is boats.js host() in node (where a
// crew member stands in its boat's frame), for the placement predictor.
// Frames: the page's (x = X, y = H, z = -D), matrices column-major (three.js Matrix4.elements); the World's map frame
// [X, D, H].
import fs from 'node:fs';
import path from 'node:path';
import { World, QM } from './owners_index.mjs';

const CELL = 0.5;

// ---------------------------------------------------------------- tiny matrix helpers (column-major 4x4)
export const mul4 = (a, b) => {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
};
export const apply4 = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
export const dir4 = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
export function inv4(m) {
  // rigid or scaled-rigid affine inverse (general 3x3 inverse + translation)
  const [a, b, c, , d, e, f, , g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const id = 1 / det;
  const r = [A * id, (c * h - b * i) * id, (b * f - c * e) * id, 0,
    B * id, (a * i - c * g) * id, (c * d - a * f) * id, 0,
    C * id, (b * g - a * h) * id, (a * e - b * d) * id, 0, 0, 0, 0, 1];
  const t = [m[12], m[13], m[14]];
  r[12] = -(r[0] * t[0] + r[4] * t[1] + r[8] * t[2]);
  r[13] = -(r[1] * t[0] + r[5] * t[1] + r[9] * t[2]);
  r[14] = -(r[2] * t[0] + r[6] * t[1] + r[10] * t[2]);
  return r;
}
// page point -> map [X, D, H]
export const toMapP = (p) => [p[0], -p[2], p[1]];
export const toPageP = (q) => [q[0], q[2], -q[1]];

// ---------------------------------------------------------------- the owners
export const BOAT_SECTIONS = ['outer_road_2', 'rainbow_bridge', 'canal', 'countryside'];
export function loadBoatOwners(sections = BOAT_SECTIONS) {
  const boats = new Map();
  for (const s of sections) {
    // QM_BOAT_OWNERS=<dir>: <dir>/<section>/boat_owners.* instead (a kit change measured in scratch before its export)
    const dir = process.env.QM_BOAT_OWNERS ? path.join(process.env.QM_BOAT_OWNERS, s) : path.join(QM, `gen/sections/${s}`);
    const jf = path.join(dir, 'boat_owners.json');
    if (!fs.existsSync(jf)) continue;
    const j = JSON.parse(fs.readFileSync(jf, 'utf8'));
    const bin = fs.readFileSync(path.join(dir, 'boat_owners.bin'));
    const F = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
    for (const [id, b] of Object.entries(j.boats)) {
      const nodes = {};
      for (const [name, nd] of Object.entries(b.nodes)) {
        const parts = nd.tris.map(([t0, n, m]) => ({ F: F.subarray(t0 * 9, (t0 + n) * 9), n, mat: m }));
        nodes[name] = { ...nd, parts, n: parts.reduce((a, p) => a + p.n, 0) };
      }
      boats.set(id, { id, section: s, rest: b.rest, info: b.info, points: b.points || {}, world_points: b.world_points || [], nodes, date: j.date });
    }
  }
  return boats;
}

// which nodes the checks leave out: the wet ring and bow wave lie flat on the water (not a surface anyone touches)
const SKIP_NODES = /^(wet__ring|bow_wave)$/;

// ---------------------------------------------------------------- the World with the boats in it
export class BoatWorld extends World {
  // world: a loaded World (the sections); boats: loadBoatOwners(). The boats' triangles are appended after the
  // sections' (ids >= base), with an overlay grid rebuilt at each pose().
  static extend(world, boats) {
    const w = Object.assign(Object.create(BoatWorld.prototype), world);
    w.base = world.n;
    w.boats = boats;
    const add = [];
    let nb = 0;
    w.owners = [...world.owners]; w.ownerId = new Map(world.ownerId); w.ownerSection = [...world.ownerSection];
    w.mats = [...world.mats]; w.matId = new Map(world.matId);
    w.ownerTris = new Map(world.ownerTris);
    for (const b of boats.values()) {
      for (const [name, nd] of Object.entries(b.nodes)) {
        if (SKIP_NODES.test(name)) continue;
        const key = `${b.id}|${name}`;
        if (!w.ownerId.has(key)) { w.ownerId.set(key, w.owners.length); w.owners.push(key); w.ownerSection.push(b.section); }
        const oid = w.ownerId.get(key);
        for (const p of nd.parts) {
          if (!w.matId.has(p.mat)) { w.matId.set(p.mat, w.mats.length); w.mats.push(p.mat); }
          add.push({ b, name, F: p.F, n: p.n, oid, mid: w.matId.get(p.mat), first: w.base + nb });
          nb += p.n;
        }
      }
    }
    const n = w.base + nb;
    const T = new Float32Array(n * 9); T.set(world.T.subarray(0, w.base * 9));
    const owner = new Int32Array(n); owner.set(world.owner.subarray(0, w.base));
    const mat = new Int32Array(n); mat.set(world.mat.subarray(0, w.base));
    for (const a of add) { owner.fill(a.oid, a.first, a.first + a.n); mat.fill(a.mid, a.first, a.first + a.n); }
    Object.assign(w, { T, owner, mat, n, boatParts: add, boatGrid: new Map(), rodCache: new Map(), posedBy: null });
    w.collideMat = w.mats.map((m) => m.endsWith('__col'));
    w.hiddenMat = w.mats.map((m) => /hidden/.test(m));
    for (const a of add) {
      const l = []; for (let t = a.first; t < a.first + a.n; t++) l.push(t);
      w.ownerTris.set(a.oid, [...(w.ownerTris.get(a.oid) || []), ...l]);
    }
    w.pose(null);
    return w;
  }

  // pose: { <boat id>: { root: [16], nodes: { <node>: [16] } } } (people_dump `boats`), or null for the rest pose. A boat
  // the pose leaves out keeps its rest pose; one marked hidden is moved far below the world.
  pose(poses, tag = null, only = null) {
    const T = this.T;
    this.mat4 = new Map();
    this.only = only;
    for (const a of this.boatParts) {
      if (only && !only.has(a.b.id)) continue;
      const ps = poses?.[a.b.id];
      const root = ps?.root || a.b.rest;
      const node = ps?.nodes?.[a.name] || a.b.nodes[a.name].rest;
      const M = mul4(root, node);
      this.mat4.set(`${a.b.id}|${a.name}`, M);
      const F = a.F;
      for (let i = 0; i < a.n * 3; i++) {
        const x = F[i * 3], y = F[i * 3 + 1], z = F[i * 3 + 2];
        const px = M[0] * x + M[4] * y + M[8] * z + M[12], py = M[1] * x + M[5] * y + M[9] * z + M[13], pz = M[2] * x + M[6] * y + M[10] * z + M[14];
        const o = (a.first * 3 + i) * 3;
        T[o] = px; T[o + 1] = -pz; T[o + 2] = py; // map frame [X, D, H]
      }
    }
    this.boatGrid = new Map();
    for (const a of this.boatParts) for (let t = a.first; t < a.first + a.n; t++) {
      if (only && !only.has(a.b.id)) break;
      const o = t * 9;
      const x0 = Math.min(T[o], T[o + 3], T[o + 6]), x1 = Math.max(T[o], T[o + 3], T[o + 6]);
      const d0 = Math.min(T[o + 1], T[o + 4], T[o + 7]), d1 = Math.max(T[o + 1], T[o + 4], T[o + 7]);
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(d0 / CELL); j <= Math.floor(d1 / CELL); j++) {
        const key = i * 100003 + j;
        let c = this.boatGrid.get(key);
        if (!c) this.boatGrid.set(key, (c = []));
        c.push(t);
      }
    }
    for (const k of [...this.rodCache.keys()]) if (+k.split(':')[0] >= 0 && this.isBoatOwner(+k.split(':')[0])) this.rodCache.delete(k);
    this.poses = poses;
    this.posedBy = tag;
    return this;
  }

  isBoatOwner(oid) { return /\|/.test(this.owners[oid]) && /^S\w+\.veh\.boat_/.test(this.owners[oid]); }
  isBoatTri(t) { return t >= this.base; }
  // the boat id and node of a triangle (or null)
  boatOf(t) { if (t < this.base) return null; const [id, node] = this.owners[this.owner[t]].split('|'); return { id, node }; }

  near(X, D, r) {
    const out = super.near(X, D, r);
    for (let i = Math.floor((X - r) / CELL); i <= Math.floor((X + r) / CELL); i++) for (let j = Math.floor((D - r) / CELL); j <= Math.floor((D + r) / CELL); j++) {
      const c = this.boatGrid.get(i * 100003 + j);
      if (c) for (const t of c) out.add(t);
    }
    return out;
  }

  vertical(X, D, filter = null) {
    const out = super.vertical(X, D, filter);
    const c = this.boatGrid.get(Math.floor(X / CELL) * 100003 + Math.floor(D / CELL));
    if (!c) return out;
    const T = this.T;
    for (const t of c) {
      if (filter && !filter(t)) continue;
      const o = t * 9;
      const ax = T[o], ad = T[o + 1], bx = T[o + 3], bd = T[o + 4], cx = T[o + 6], cd = T[o + 7];
      const det = (bd - cd) * (ax - cx) + (cx - bx) * (ad - cd);
      if (Math.abs(det) < 1e-12) continue;
      const l1 = ((bd - cd) * (X - cx) + (cx - bx) * (D - cd)) / det;
      const l2 = ((cd - ad) * (X - cx) + (ax - cx) * (D - cd)) / det;
      const l3 = 1 - l1 - l2;
      const e = -1e-7;
      if (l1 < e || l2 < e || l3 < e) continue;
      out.push({ h: l1 * T[o + 2] + l2 * T[o + 5] + l3 * T[o + 8], t });
    }
    return out;
  }

  // a named point of a boat at the current pose, map frame (root points, node points)
  point(id, name) {
    const b = this.boats.get(id);
    if (!b) return null;
    const ps = this.poses?.[id];
    const root = ps?.root || b.rest;
    if (b.points[name]) return toMapP(apply4(root, ...b.points[name]));
    for (const [nn, nd] of Object.entries(b.nodes)) {
      if (nd.points?.[name]) return toMapP(apply4(mul4(root, ps?.nodes?.[nn] || nd.rest), ...nd.points[name]));
    }
    return null;
  }
  // a line (rope, plank, ladder) of a boat at the current pose: its two ends in the map frame, kind, radius
  lines(id) {
    const b = this.boats.get(id);
    if (!b) return [];
    const ps = this.poses?.[id];
    const root = ps?.root || b.rest;
    const out = [];
    for (const [nn, nd] of Object.entries(b.nodes)) {
      if (!nd.line) continue;
      const M = mul4(root, ps?.nodes?.[nn] || nd.rest);
      // the unit line runs along its node's +Z (glTF) from the origin; the page scales z to its length
      out.push({ name: nn, kind: nd.line.kind, r: nd.line.r, a: toMapP(apply4(M, 0, 0, 0)), b: toMapP(apply4(M, 0, 0, 1)) });
    }
    return out;
  }
  // the water's height under a boat now (its root's y less its bob: the root sits on the water at rest)
  waterH(id) { const b = this.boats.get(id); return b ? b.rest[13] : null; }
}

// ---------------------------------------------------------------- the owners against the shipped boats GLB
// per boat and node (lod 0): triangles and the node-frame bounds (dequantized). MATCH when every count agrees and every
// bound is within 1 cm.
export async function verify(section) {
  const { THREE, diskLoader } = await import('./three_node.mjs');
  const boats = loadBoatOwners([section]);
  const file = path.join(QM, `web/public/assets/${section}_boats.glb`);
  if (!fs.existsSync(file)) return { section, status: boats.size ? 'NO_GLB' : 'NO_BOATS' };
  const gltf = await diskLoader.loadAsync(`assets/${section}_boats.glb`);
  const nameOf = (o) => { const a = gltf.parser.associations.get(o); return a?.nodes !== undefined ? gltf.parser.json.nodes[a.nodes].name : null; };
  gltf.scene.updateMatrixWorld(true);
  const shipped = new Map();
  for (const root of gltf.scene.children) {
    const m = /^boat:(.+?)(@lod1)?$/.exec(nameOf(root) || '');
    if (!m || m[2]) continue;
    const nodes = { __root: { rest: root.matrixWorld.elements.slice() } };
    for (const h of root.children) {
      const nm = (nameOf(h) || '').split(':')[0];
      const inv = new THREE.Matrix4().copy(h.matrixWorld).invert();
      let n = 0;
      const box = new THREE.Box3();
      const v = new THREE.Vector3();
      h.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry, pos = g.attributes.position;
        n += (g.index ? g.index.count : pos.count) / 3;
        const M = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
        for (let i = 0; i < pos.count; i++) box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(M));
      });
      nodes[nm] = { n, box };
    }
    shipped.set(m[1], nodes);
  }
  const rows = [];
  let worst = 0;
  for (const [id, b] of boats) {
    const sh = shipped.get(id);
    if (!sh) { rows.push({ id, problem: 'not in the shipped GLB' }); continue; }
    // the root's rest pose (its painted place): translation and turn
    const R = sh.__root.rest, dr = Math.max(...[12, 13, 14].map((k) => Math.abs(R[k] - b.rest[k])), ...[0, 2, 8, 10].map((k) => Math.abs(R[k] - b.rest[k])));
    if (dr > 0.01) rows.push({ id, node: '(root rest)', owners: b.rest.filter((_, k) => [12, 13, 14].includes(k)).map((x) => +x.toFixed(3)), shipped: [12, 13, 14].map((k) => +R[k].toFixed(3)), max_diff: +dr.toFixed(4) });
    for (const [nn, nd] of Object.entries(b.nodes)) {
      const s = sh[nn];
      if (!s) { rows.push({ id, node: nn, problem: 'node not shipped' }); continue; }
      let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (const p of nd.parts) for (let i = 0; i < p.F.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p.F[i + k]); hi[k] = Math.max(hi[k], p.F[i + k]); }
      const d = nd.n ? Math.max(...[0, 1, 2].map((k) => Math.max(Math.abs(lo[k] - s.box.min.getComponent(k)), Math.abs(hi[k] - s.box.max.getComponent(k))))) : 0;
      worst = Math.max(worst, d);
      if (s.n !== nd.n || d > 0.01) rows.push({ id, node: nn, owners_tris: nd.n, shipped_tris: s.n, bounds_m: +d.toFixed(4) });
    }
    for (const nn of Object.keys(sh)) if (nn !== '__root' && !b.nodes[nn]) rows.push({ id, node: nn, problem: 'shipped node not in the owners' });
  }
  for (const id of shipped.keys()) if (!boats.has(id)) rows.push({ id, problem: 'shipped boat not in the owners' });
  return { section, status: rows.length ? 'DRIFT' : 'MATCH', boats: boats.size, shipped: shipped.size, worst_bounds_m: +worst.toFixed(4), owners_date: [...boats.values()][0]?.date, differences: rows };
}

// ---------------------------------------------------------------- boats.js host() in node
// Where the page stands a crew member in its boat's frame (web/src/boats.js host / standLocal / floorLocal / surfaces),
// at rest: { local: [x, y, z] (page frame, relative to the node), node: <node name> | null, yaw (radians, relative to the
// root (+ the node's turn)), level, moved }. f: the layout figure; spec: its people.json entry; crewOf: the boat's
// people.json boats.<slug>.crew. A copy of the engine's rule for the checks (3d-director-04 owns boats.js): verified
// against the page dump by tools/place_predict.mjs.
export function crewSpot(b, f, spec, crewOf = {}) {
  const job = crewOf[f.id] || {};
  const m = /^boat ((?:[a-z]+ )*?)(deck|roof|ladder): (.+)$/.exec(f.support || '');
  const level = m?.[2] === 'deck' && /stern/.test(m[1]) ? 'stern' : m?.[2] || 'deck';
  const rest = b.rest, restInv = inv4(rest);
  const col = colliderOf(b);
  let node = null, yaw = 0, local = null;
  const deg = (d) => (d * Math.PI) / 180;
  if (job.work === 'sweep' || job.work === 'oar') {
    const partNodes = Object.entries(b.nodes).filter(([, nd]) => nd.anim?.anim === job.work).map(([nn]) => nn);
    const crew = Object.entries(crewOf).filter(([, j]) => j.work === job.work).map(([id]) => id);
    const k = crew.indexOf(f.id);
    // the points by name in the page's order: the root's, then each node's in GLB order (boats.js lod.points)
    const pts = [];
    for (const [n, p] of Object.entries(b.points)) pts.push([n, null, p]);
    for (const [nn, nd] of Object.entries(b.nodes)) for (const [n, p] of Object.entries(nd.points || {})) pts.push([n, nn, p]);
    const byName = new Map(pts.map((x) => [x[0], x]));
    let pt = job.at && byName.get(job.at);
    if (!pt) {
      const names = [...byName.keys()].filter((n) => n.startsWith(job.work === 'sweep' ? 'pt_sweep_bar' : 'pt_oar_'));
      pt = byName.get(names[job.work === 'sweep' ? 0 : k % Math.max(1, names.length)]);
    }
    if (pt) {
      node = pt[1] || partNodes[0] || null;
      const p = pt[2];
      const L = Math.hypot(p[0], p[2]) || 1, d = [p[0] / L, 0, p[2] / L];
      const s = job.work === 'sweep' ? 0.55 : 0.5;
      local = [p[0] + d[0] * s, p[1], p[2] + d[2] * s];
      if (job.work === 'sweep') { const bar = [-d[2], 0, d[0]], o = crew.length > 1 ? -0.6 + (1.2 * k) / (crew.length - 1) : 0; local = [local[0] + bar[0] * o, local[1], local[2] + bar[2] * o]; }
      yaw = Math.atan2(-d[0], -d[2]);
    }
  }
  if (!node) {
    const w = [f.X + (spec.nudge?.[0] || 0), f.H || 0, -(f.D + (spec.nudge?.[1] || 0))];
    local = apply4(restInv, ...w);
    yaw = deg(spec.facing_deg ?? f.facing_deg ?? 0) + Math.PI / 2 - yawOfM(rest);
  }
  const at = node ? apply4(b.nodes[node].rest, ...local) : [...local];
  const tall = /seated|crouch|lying|kneel|squat/.test(f.pose || '') ? 0.9 : 1.5;
  const y = node ? floorLocal(b, col, at, level === 'roof' ? 'roof' : 'deck') : standLocal(b, col, at, level, tall);
  let moved = null;
  if (y && y.moved) { at[0] = y.moved[0]; at[1] = y.moved[1]; at[2] = y.moved[2]; moved = y.moved; }
  const fy = y?.y ?? at[1];
  if (node) local = [local[0], local[1] + fy - at[1], local[2]]; else local = [at[0], fy, at[2]];
  return { local, node, yaw, level, moved: !!moved, missing: y === null, nodeYaw: node ? nodeYawM(b.nodes[node].rest) : 0 };
}
export const yawOfM = (m) => Math.atan2(m[8], m[10]); // the +Z axis turned: atan2(z.x, z.z)
const nodeYawM = (m) => Math.atan2(m[8], m[10]);

// the boat's colliders in its root frame at rest, by category (boats.js local(): deck, roof, rim): [{ cat, a, b, c }]
const colCache = new WeakMap();
function colliderOf(b) {
  if (colCache.has(b)) return colCache.get(b);
  const tris = [];
  for (const [nn, cat] of [['deck__col', 'deck'], ['roof__col', 'roof']]) {
    const nd = b.nodes[nn];
    if (!nd) continue;
    for (const p of nd.parts) for (let i = 0; i < p.n; i++) {
      const v = (k) => apply4(nd.rest, p.F[i * 9 + k * 3], p.F[i * 9 + k * 3 + 1], p.F[i * 9 + k * 3 + 2]);
      tris.push({ cat, a: v(0), b: v(1), c: v(2) });
    }
  }
  colCache.set(b, tris);
  return tris;
}
// a vertical ray down from y 8 at (x, z) of the root frame: hits [{ y, cat, ny (the face normal's y, by its winding) }]
function rayDown(col, x, z) {
  const out = [];
  for (const t of col) {
    const { a, b, c } = t;
    const det = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(det) < 1e-12) continue;
    const l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / det;
    const l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / det;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
    const y = l1 * a[1] + l2 * b[1] + l3 * c[1];
    if (y > 8) continue;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const ny = n[1] / (Math.hypot(...n) || 1); // signed by the winding, as three-mesh-bvh's face.normal (boats.js tests > 0.3)
    out.push({ y, cat: t.cat, ny });
  }
  return out.sort((p, q) => q.y - p.y);
}
function surfaces(col, x, z) {
  const out = { deck: [], roof: [], all: [] };
  for (const h of rayDown(col, x, z)) {
    out.all.push(h.y);
    if (h.ny <= 0.3) continue;
    (h.cat === 'deck' ? out.deck : out.roof).push(h.y);
  }
  return out;
}
function floorLocal(b, col, at, level) {
  const L = b.info.lw || 20;
  const tries = [at.slice()];
  const goal = [Math.max(-L / 2 + 2, Math.min(L / 2 - 2, at[0])), at[1], 0];
  for (let k = 1; k <= 8; k++) tries.push([at[0] + (goal[0] - at[0]) * k / 8, at[1], at[2] + (goal[2] - at[2]) * k / 8]);
  for (const [i, p] of tries.entries()) {
    const hits = rayDown(col, p[0], p[2]).filter((h) => h.ny > 0.3);
    if (!hits.length) continue;
    const roof = hits.filter((h) => h.cat === 'roof'), deck = hits.filter((h) => h.cat === 'deck');
    const pick = level === 'roof' ? (roof[0] || deck[0]) : (deck[0] || null);
    if (!pick) continue;
    return { y: pick.y, moved: i ? p : null };
  }
  return null;
}
function standLocal(b, col, at, level, tall) {
  const deck = floorLocal(b, col, at, 'deck');
  const near = (test, c = at, R = 3) => {
    for (let r = 0.3; r <= R + 0.01; r += 0.3) {
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8, x = c[0] + r * Math.cos(a), z = c[2] + r * Math.sin(a), y = test(x, z, r);
        if (y !== null && y !== undefined) return { y, moved: [x, at[1], z] };
      }
    }
    return null;
  };
  if (level === 'roof') {
    const here = surfaces(col, at[0], at[2]).roof[0];
    if (here !== undefined) return { y: here, moved: null };
    return near((x, z) => surfaces(col, x, z).roof[0] ?? null) || deck;
  }
  if (!deck) return null;
  const p0 = deck.moved || at;
  if (level === 'ladder') {
    const top = surfaces(col, p0[0], p0[2]).roof[0] ?? near((x, z) => surfaces(col, x, z).roof[0] ?? null, p0)?.y;
    return { y: Math.max(deck.y, Math.min(top ?? deck.y, at[1])), moved: null };
  }
  if (level === 'stern') {
    const raised = near((x, z, r) => { const d = surfaces(col, x, z).deck[0]; return r <= 2.5 && d !== undefined && d > deck.y + 0.3 ? d : null; }, p0);
    if (raised) return raised;
  }
  const open = (x, z, y) => !surfaces(col, x, z).all.some((h) => h > y + 0.05 && h < y + tall);
  if (open(p0[0], p0[2], deck.y)) return deck;
  const here = surfaces(col, p0[0], p0[2]).deck.find((d) => d <= deck.y + 0.6 && open(p0[0], p0[2], d));
  if (here !== undefined) return { y: here, moved: deck.moved };
  const room = near((x, z) => surfaces(col, x, z).deck.find((d) => Math.abs(d - deck.y) < 0.6 && open(x, z, d)) ?? null, p0, 4.5);
  if (room) return room;
  const top = surfaces(col, p0[0], p0[2]);
  return { y: Math.max(top.deck[0] ?? deck.y, top.roof[0] ?? -Infinity), moved: deck.moved };
}
