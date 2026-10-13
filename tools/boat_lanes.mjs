#!/usr/bin/env node
// The river's boat lanes for the page's boat flow (web/src/boatflow.js; record gen/boats/flow/notes.md).
//   node tools/boat_lanes.mjs [--plan] [--ship]   -> sections/world/boatflow.json; --ship: its copy for the page in
//                                                     web/public/assets/; --plan: gen/boats/flow/lanes_s3.png, _s2.png
//   dev aids: --debug, --probe <slug>:<lane> (a boat swept along a lane), --clrmap x0,x1,d0,d1, --dump <dir>
// Everything comes from what the river sections ship (never by eye): each section's GLB (its water strip, the shore,
// and every visible piece over the water: the Rainbow Bridge's soffit, halls on stilts), its boats GLB (each hull's
// outline and top heights in its own frame, the mast's pivot), boats.json (motion), people.json (who works a boat
// under way, its trackers) and layout.json (the painted areas: seams and the silk's edges, where the mist starts).
//  1. A 0.25 m grid over the river: water, the ceiling over it (the lowest built thing above the surface), the moored
//     hulls (and the one boat that keeps its painted behaviour), and the clearance to banks and hulls (an exact EDT).
//  2. Lanes, by least cost on that grid (clearance for the widest hull that uses it, under the arch the highest
//     soffit, a side of the river per direction), smoothed within their clearance, from one end of the river to the
//     other, run on into the mist at both ends:
//       - one per painted boat under way, through its painted pose (its stern and bow on the lane), in its painted
//         direction, kept near the waves lane of that direction away from its spot;
//       - 'up' (westward, against the current, along the north side where the trackers walk) and 'down' (eastward,
//         with it, the south side) for the waves variant.
//  3. Checks, every 0.5 m along each lane with the chord model the page uses (stern and bow on the lane): the hull's
//     outline against banks and moored hulls, and its top against the ceiling with the mast up and lowered. A boat
//     that can't pass under the bridge even with its mast down waits short of it (`hold`); a masted one that can lowers
//     its mast before the near face and raises it past the far one (`mast`).
//  4. Reaches: the river at real size is closed by rafts and moorings into basins; a lane never leaves the reach a
//     hull of its width can sail, nor its section. A painted boat whose reach is under 40 m keeps its painted run.
//     The waves keep off the spots where a painted boat goes no further. Turns (`<reach>-loop`): where the water is
//     wide enough, up the reach, round, and back down.
//  5. Zones: where two lanes meet head on closer than their hulls need, one direction at a time (the page holds the
//     zone for the first comer). Towpaths: how far a painted towed boat's trackers can walk with it on the bank.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(QM, 'web/public/assets');
const OUT = path.join(QM, 'sections/world/boatflow.json');
const OUT_WEB = path.join(ASSETS, 'boatflow.json');
const PLAN = path.join(QM, 'gen/boats/flow');
const args = process.argv.slice(2);
const RES = 0.25; // m per grid cell
const STEP = 0.5; // m between lane points
const DRAFT = 0.35; // what a hull draws: anything built higher than this under the surface is in the way (choice)
const MARGIN = 0.4; // m kept between a moving hull and a bank or a moored hull (choice: the painted moorings leave 0.1-0.4)
const HEAD = 0.25; // m kept between a hull's top and the soffit (choice)
const MAST_DOWN = 84; // degrees from upright a lowered mast lies at (S3's boat_lowered_mast_17708 is painted at 82)
const RUN_ON = 24; // m a lane runs on past the water's end, in the mist
const SPEED = { rowed: 0.75, sweep: 0.75, poled: 0.55, towed: 0.6, sailing: 1.0, drifting: 0.45, 'lowering mast': 0.5, moored: 0.6 };

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// ---------------------------------------------------------------- small math (column-major 4x4, as glTF)
const mmul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
const apply = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
function inv(m) { // affine inverse
  const [a, b, c, d, e, f, g, h, i] = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const r = [(e * i - f * h) / det, -(b * i - c * h) / det, (b * f - c * e) / det, -(d * i - f * g) / det, (a * i - c * g) / det, -(a * f - c * d) / det, (d * h - e * g) / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  const t = [m[12], m[13], m[14]];
  const o = [r[0], r[3], r[6], 0, r[1], r[4], r[7], 0, r[2], r[5], r[8], 0, 0, 0, 0, 1];
  o[12] = -(r[0] * t[0] + r[1] * t[1] + r[2] * t[2]); o[13] = -(r[3] * t[0] + r[4] * t[1] + r[5] * t[2]); o[14] = -(r[6] * t[0] + r[7] * t[1] + r[8] * t[2]);
  return o;
}
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qaxis = (ax, ang) => { const s = Math.sin(ang / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(ang / 2)]; };
const qrot = (q, v) => { const [x, y, z, w] = q, ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2]; return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; };
const hyp = Math.hypot;
function convexHull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// a convex outline cut down to at most n points (dropping the point whose removal loses least area), grown by g
function simplify(poly, n = 12, g = 0.08) {
  let p = poly.slice();
  const tri = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  while (p.length > n) {
    let bi = 0, bv = Infinity;
    for (let i = 0; i < p.length; i++) { const v = tri(p[(i + p.length - 1) % p.length], p[i], p[(i + 1) % p.length]); if (v < bv) { bv = v; bi = i; } }
    p.splice(bi, 1);
  }
  const cx0 = p.reduce((a, q) => a + q[0], 0) / p.length, cz0 = p.reduce((a, q) => a + q[1], 0) / p.length;
  return p.map(([x, z]) => { const L = Math.hypot(x - cx0, z - cz0) || 1; return [+(x + ((x - cx0) / L) * g).toFixed(2), +(z + ((z - cz0) / L) * g).toFixed(2)]; });
}
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

// every triangle of a node's mesh, in the frame m (glTF world unless given)
function trisOf(node, m = node.getWorldMatrix()) {
  const out = [], e = [0, 0, 0];
  for (const p of node.getMesh()?.listPrimitives() || []) {
    if (p.getMode() !== 4) continue;
    const pos = p.getAttribute('POSITION'), idx = p.getIndices();
    const n = idx ? idx.getCount() : pos.getCount();
    for (let i = 0; i + 2 < n; i += 3) {
      const t = [];
      for (let j = 0; j < 3; j++) { pos.getElement(idx ? idx.getScalar(i + j) : i + j, e); t.push(apply(m, e)); }
      out.push(t);
    }
  }
  return out;
}
const subtree = (n) => [n, ...n.listChildren().flatMap(subtree)];

// ---------------------------------------------------------------- the sections of the river
const sectionsJson = readJSON(path.join(QM, 'map/sections.json'));
const all = Object.entries(sectionsJson).filter(([k, v]) => /^S\d/.test(k) && v.folder).map(([key, v]) => ({ key, name: v.folder }));
const river = [];
for (const s of all) {
  const lp = path.join(QM, 'sections', s.name, 'layout.json');
  if (!fs.existsSync(lp) || !fs.existsSync(path.join(ASSETS, s.name + '.glb'))) continue;
  const layout = readJSON(lp);
  if (!Object.values(layout.entities || {}).some((e) => e.kind === 'water')) continue;
  if (!fs.existsSync(path.join(ASSETS, s.name + '_boats.glb'))) continue; // a moat without boats (the gate) is no river
  river.push({ ...s, layout, corners: layout.painted_area.corners, people: fs.existsSync(path.join(QM, 'sections', s.name, 'people.json')) ? readJSON(path.join(QM, 'sections', s.name, 'people.json')) : {} });
}
river.sort((a, b) => a.corners[0][0] - b.corners[0][0]);
console.log('river sections:', river.map((s) => `${s.key} ${s.name}`).join(', '));

let waterH = null;
const waterTris = [], ceilTris = [], shoreSegs = [], boats = [], colTris = []; // colTris: every collider, for the towpaths
for (const s of river) {
  const doc = await io.read(path.join(ASSETS, s.name + '.glb'));
  for (const n of doc.getRoot().listNodes()) {
    if (!n.getMesh()) continue;
    const nm = n.getName();
    if (/^g_water/.test(nm)) { for (const t of trisOf(n)) { waterH ??= +t[0][1].toFixed(3); waterTris.push({ t: t.map((p) => [p[0], -p[2]]), sec: s.name }); } continue; }
    if (nm === 'g_edge_shore_hidden__col') { for (const t of trisOf(n)) shoreSegs.push(t.map((p) => [p[0], -p[2]])); continue; }
    if (/__col$/.test(nm) && nm !== 'g_edge_shore_hidden__col') for (const t of trisOf(n)) colTris.push(t);
    if (/hidden/.test(nm)) continue;
    // a section's ground runs on a little past its seams under its neighbour's (skill web-scene, "Build"): over the
    // neighbour's river that skirt is no bank, so pieces past the section's own seams don't count
    const [sw, se, ne, nw] = s.corners;
    const within = (x, d) => (nw[0] - sw[0]) * (d - sw[1]) - (nw[1] - sw[1]) * (x - sw[0]) <= 0.05 && (ne[0] - se[0]) * (d - se[1]) - (ne[1] - se[1]) * (x - se[0]) >= -0.05;
    for (const t of trisOf(n)) { const gx = (t[0][0] + t[1][0] + t[2][0]) / 3, gd = -(t[0][2] + t[1][2] + t[2][2]) / 3; if (/^g_ground/.test(nm) && !within(gx, gd)) continue; ceilTris.push(t); }
  }
  const bp = path.join(ASSETS, s.name + '_boats.glb');
  if (!fs.existsSync(bp)) continue;
  const man = readJSON(path.join(ASSETS, s.name, 'boats.json'));
  const bd = await io.read(bp);
  for (const root of bd.getRoot().listScenes()[0].listChildren()) {
    const m = /^boat:(.+?)(@lod1)?$/.exec(root.getName());
    if (!m || m[2]) continue;
    const id = m[1], M = root.getWorldMatrix(), Mi = inv(M), ex = root.getExtras() || {}, entry = man.boats?.[id] || {};
    const b = { id, slug: id.split('.').slice(2).join('.'), sec: s.name, M, pose: ex.pose, motion: ex.motion, kind: ex.kind, lw: ex.lw, loa: ex.loa, beam: ex.beam, entry,
      pos: [M[12], -M[14]], heading: Math.atan2(-M[2], M[0]), tris: [], mast: null };
    for (const h of root.listChildren()) {
      const part = h.getName().split(':')[0];
      if (/__col$|__edge$|^line_|^wet__ring|^bow_wave/.test(part)) continue;
      if (part === 'mast') {
        const hx = h.getExtras() || {};
        const hm = h.getMatrix(); // the holder in the root's frame (a direct child)
        const local = []; // the mast's triangles in the holder's own frame
        for (const c of h.listChildren()) for (const n of subtree(c)) if (n.getMesh()) local.push(...trisOf(n, mmul(inv(h.getWorldMatrix()), n.getWorldMatrix())));
        const q0 = h.getRotation(), t0 = h.getTranslation(), axis = hx.axis_gltf || [0, 0, 1];
        const th = 2 * Math.atan2(q0[0] * axis[0] + q0[1] * axis[1] + q0[2] * axis[2], q0[3]);
        b.mast = { q0, t0, axis, rest: hx.angle_deg || 0, sign: Math.sign(th) || 1, range: hx.range_deg || null, local, hm };
        continue;
      }
      for (const n of subtree(h)) if (n.getMesh()) b.tris.push(...trisOf(n, mmul(Mi, n.getWorldMatrix())));
    }
    boats.push(b);
  }
}
console.log(`water at H ${waterH}: ${waterTris.length} triangles; ${ceilTris.length} built triangles; ${boats.length} boats`);

// ---------------------------------------------------------------- the grid
let x0 = Infinity, x1 = -Infinity, d0 = Infinity, d1 = -Infinity;
for (const { t } of waterTris) for (const [x, d] of t) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); d0 = Math.min(d0, d); d1 = Math.max(d1, d); }
x0 = Math.floor(x0 - 30); x1 = Math.ceil(x1 + 30); d0 = Math.floor(d0 - 30); d1 = Math.ceil(d1 + 30);
const NX = Math.round((x1 - x0) / RES), ND = Math.round((d1 - d0) / RES), N = NX * ND;
const cx = (i) => x0 + (i + 0.5) * RES, cd = (j) => d0 + (j + 0.5) * RES;
const ci = (x) => Math.floor((x - x0) / RES), cj = (d) => Math.floor((d - d0) / RES);
const at = (x, d) => { const i = ci(x), j = cj(d); return i < 0 || j < 0 || i >= NX || j >= ND ? -1 : j * NX + i; };
console.log(`grid ${NX} x ${ND} at ${RES} m: X ${x0}..${x1}, D ${d0}..${d1}`);

function fillTri(t, fn) { // every cell whose centre is inside the 2D triangle [[x, d] x3]
  const [a, b, c] = t;
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
  if (Math.abs(area) < 1e-9) return;
  const i0 = Math.max(0, ci(Math.min(a[0], b[0], c[0]))), i1 = Math.min(NX - 1, ci(Math.max(a[0], b[0], c[0])));
  const j0 = Math.max(0, cj(Math.min(a[1], b[1], c[1]))), j1 = Math.min(ND - 1, cj(Math.max(a[1], b[1], c[1])));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = cx(i), d = cd(j);
    const w0 = ((b[0] - x) * (c[1] - d) - (c[0] - x) * (b[1] - d)) / area, w1 = ((c[0] - x) * (a[1] - d) - (a[0] - x) * (c[1] - d)) / area, w2 = 1 - w0 - w1;
    if (w0 >= -1e-9 && w1 >= -1e-9 && w2 >= -1e-9) fn(j * NX + i, w0, w1, w2);
  }
}
// a 3D triangle sampled densely (vertical walls too): fn(cell, y) at every sample
function sampleTri(t, step, fn) {
  const [a, b, c] = t;
  const n = Math.max(1, Math.ceil(Math.max(hyp(b[0] - a[0], b[2] - a[2], b[1] - a[1]), hyp(c[0] - a[0], c[2] - a[2], c[1] - a[1]), hyp(c[0] - b[0], c[2] - b[2], c[1] - b[1])) / step));
  for (let u = 0; u <= n; u++) for (let v = 0; v <= n - u; v++) {
    const p = [0, 1, 2].map((k) => a[k] + ((b[k] - a[k]) * u) / n + ((c[k] - a[k]) * v) / n);
    fn(p);
  }
}

const water = new Uint8Array(N), secOf = new Int8Array(N).fill(-1);
for (const { t, sec } of waterTris) { const si = river.findIndex((s) => s.name === sec); fillTri(t, (k) => { water[k] = 1; secOf[k] = si; }); }
// the ceiling: the lowest built surface above the river bed (a hull's draft below the water and up)
const ceil = new Float32Array(N).fill(Infinity);
let nCeil = 0;
for (const t of ceilTris) {
  const ys = t.map((p) => p[1]);
  if (Math.max(...ys) < waterH - DRAFT || Math.min(...ys) > waterH + 14) continue;
  const xs = t.map((p) => p[0]), ds = t.map((p) => -p[2]);
  if (Math.max(...xs) < x0 || Math.min(...xs) > x1 || Math.max(...ds) < d0 || Math.min(...ds) > d1) continue;
  // only near water
  let wet = false;
  for (const p of t) { const k = at(p[0], -p[2]); if (k >= 0 && water[k]) { wet = true; break; } }
  if (!wet) { const k = at((xs[0] + xs[1] + xs[2]) / 3, (ds[0] + ds[1] + ds[2]) / 3); if (!(k >= 0 && water[k])) { let near = false; for (let dx = -2; dx <= 2 && !near; dx++) for (let dd = -2; dd <= 2 && !near; dd++) { const kk = at(xs[0] + dx, ds[0] + dd); near = kk >= 0 && water[kk] === 1; } if (!near) continue; } }
  nCeil++;
  sampleTri(t, 0.1, (p) => { if (p[1] < waterH - DRAFT) return; const k = at(p[0], -p[2]); if (k >= 0 && p[1] < ceil[k]) ceil[k] = p[1]; });
}
console.log(`ceiling from ${nCeil} triangles over the water`);
if (args.includes('--dump')) { const dir = args[args.indexOf('--dump') + 1]; fs.writeFileSync(path.join(dir, 'ceil.bin'), Buffer.from(ceil.buffer)); fs.writeFileSync(path.join(dir, 'water.bin'), Buffer.from(water.buffer)); fs.writeFileSync(path.join(dir, 'grid.json'), JSON.stringify({ x0, d0, NX, ND, RES, waterH })); }

// ---------------------------------------------------------------- the boats: outlines, tops, who flows
const flowSpec = {};
for (const s of river) for (const [slug, v] of Object.entries(s.people.boats || {})) flowSpec[`${s.key}.veh.${slug}`] = v;
const mastTris = (b, deg) => { // the mast's triangles in the root's frame at an angle (degrees from upright)
  const m = b.mast, dq = qaxis(m.axis, (m.sign * (deg - m.rest) * Math.PI) / 180), q = qmul(m.q0, dq);
  return m.local.map((t) => t.map((p) => { const r = qrot(q, p); return [r[0] + m.t0[0], r[1] + m.t0[1], r[2] + m.t0[2]]; }));
};
for (const b of boats) {
  b.under = b.motion === 'under_way';
  // the outline: the convex hull of every visible part in plan (the hull, its sweep and oars at rest), its own frame
  const pts = b.tris.flat().map((p) => [p[0], p[2]]);
  b.outline = convexHull(pts);
  b.len = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
  b.half = Math.max(...pts.map((p) => Math.abs(p[1])));
  // the top: highest point per 0.25 m cell of its frame, hull and mast (up, as built; lowered)
  b.top = new Map();
  const put = (map, p) => { const k = `${Math.round(p[0] / RES)},${Math.round(p[2] / RES)}`; if (!(map.get(k) >= p[1])) map.set(k, p[1]); };
  for (const t of b.tris) sampleTri(t, 0.15, (p) => put(b.top, p));
  if (b.mast) {
    // up: as built when the painting has it up; a mast painted lowered is raised to 6 degrees for open water (choice)
    b.mastUp = new Map(); b.mastDown = new Map();
    b.mastUpDeg = b.mast.rest < 30 ? b.mast.rest : 6;
    for (const t of mastTris(b, b.mastUpDeg)) sampleTri(t, 0.15, (p) => put(b.mastUp, p));
    for (const t of mastTris(b, MAST_DOWN)) sampleTri(t, 0.15, (p) => put(b.mastDown, p));
  }
  b.topMax = Math.max(...b.top.values());
  b.mastUpMax = b.mastUp ? Math.max(...b.mastUp.values()) : null;
  b.mastDownMax = b.mastDown ? Math.max(...b.mastDown.values()) : null;
  const spec = flowSpec[b.id];
  b.spec = spec || {};
  // flows: painted under way, except a boat whose painted motion isn't travel (it stays at its spot: the mast-lowering
  // boat at the bridge, run 0.2 m)
  b.flows = b.under && (b.spec.run_m ?? 8) >= 1;
}
if (args.includes('--debug')) for (const b of boats) console.log(`  ${b.slug.padEnd(36)} ${b.kind.padEnd(10)} half ${b.half.toFixed(2)} beam ${b.beam} lw ${b.lw} top ${b.topMax.toFixed(2)} mast ${b.mast ? 'yes' : '-'}`);
const stay = boats.filter((b) => !b.flows);
let flowing = boats.filter((b) => b.flows);
console.log('flowing (painted under way):', flowing.map((b) => `${b.slug} (${b.pose}, top ${b.topMax.toFixed(2)}${b.mast ? `, mast up ${b.mastUpMax.toFixed(2)} down ${b.mastDownMax.toFixed(2)}` : ''})`).join('; '));

// world outline of a boat at a pose (centre [X, D], heading in radians, + toward north)
const poseOutline = (b, X, D, hd, grow = 0) => b.outline.map(([lx, lz]) => {
  const L = hyp(lx, lz) || 1, gx = lx + (grow * lx) / L, gz = lz + (grow * lz) / L;
  // root frame: x forward, z to starboard (glTF); world X = x cos - ..., D = x sin + (-z) cos
  return [X + gx * Math.cos(hd) + gz * Math.sin(hd), D + gx * Math.sin(hd) - gz * Math.cos(hd)];
});
const fillPoly = (poly, fn) => { for (let i = 1; i + 1 < poly.length; i++) fillTri([poly[0], poly[i], poly[i + 1]], fn); };
// static hulls: moored boats and the boats that keep their painted motion
const hullMask = new Int16Array(N).fill(-1);
for (const [k, b] of boats.entries()) if (!b.flows) fillPoly(poseOutline(b, b.pos[0], b.pos[1], b.heading), (c) => { hullMask[c] = k; });

// ---------------------------------------------------------------- clearance (exact Euclidean distance transform)
function edt(blocked) { // metres from each cell to the nearest blocked cell centre
  const INF = 1e20, f = new Float64Array(Math.max(NX, ND)), dd = new Float64Array(N), v = new Int32Array(Math.max(NX, ND)), z = new Float64Array(Math.max(NX, ND) + 1);
  const pass = (get, set, n) => {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s;
      while (true) { s = (get(q) + q * q - (get(v[k]) + v[k] * v[k])) / (2 * q - 2 * v[k]); if (s <= z[k]) { k--; if (k < 0) { k = 0; break; } } else break; }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; set(q, (q - v[k]) * (q - v[k]) + get(v[k])); }
  };
  for (let j = 0; j < ND; j++) { for (let i = 0; i < NX; i++) f[i] = blocked(j * NX + i) ? 0 : INF; const g = Float64Array.from(f.subarray(0, NX)); pass((q) => g[q], (q, val) => { dd[j * NX + q] = val; }, NX); }
  for (let i = 0; i < NX; i++) { const g = new Float64Array(ND); for (let j = 0; j < ND; j++) g[j] = dd[j * NX + i]; pass((q) => g[q], (q, val) => { dd[q * NX + i] = val; }, ND); }
  const out = new Float32Array(N);
  for (let k = 0; k < N; k++) out[k] = Math.sqrt(dd[k]) * RES;
  return out;
}
const LOW = waterH + 1.0; // anything this low over the water is a wall (piers, abutments, a deck on stilts)
const bank = (k) => !water[k] || ceil[k] < LOW;
const clrBank = edt(bank);
let clrAll = edt((k) => bank(k) || hullMask[k] >= 0);
// the two banks: north and south of the river (the non-water cells reached from the top and the bottom rows)
const side = new Int8Array(N); // 1 north bank, -1 south bank
{
  const flood = (seed, val) => { const st = [seed]; while (st.length) { const k = st.pop(); if (side[k] || water[k]) continue; side[k] = val; const i = k % NX, j = (k / NX) | 0; if (i > 0) st.push(k - 1); if (i < NX - 1) st.push(k + 1); if (j > 0) st.push(k - NX); if (j < ND - 1) st.push(k + NX); } };
  for (let i = 0; i < NX; i++) { flood((ND - 1) * NX + i, 1); flood(i, -1); }
}
const dN = edt((k) => side[k] === 1), dS = edt((k) => side[k] === -1);
if (args.includes('--clrmap')) {
  const [xa, xb, da, db] = args[args.indexOf('--clrmap') + 1].split(',').map(Number);
  let hdr = '     '; for (let x = xa; x <= xb; x++) hdr += String(x % 100).padStart(3); console.log(hdr);
  for (let d = db; d >= da; d -= 0.5) { let r = d.toFixed(1).padStart(5); for (let x = xa; x <= xb; x++) { const k = at(x, d); r += !water[k] ? '  #' : hullMask[k] >= 0 ? '  B' : ceil[k] < LOW ? '  _' : String(Math.min(9, Math.floor(clrAll[k] * 2) / 2).toFixed(0)).padStart(3); } console.log(r); }
}

// ---------------------------------------------------------------- reaches: where a hull of a given width can go
const worldD = [Math.min(...river.flatMap((s) => s.corners.map((c) => c[1]))), Math.max(...river.flatMap((s) => s.corners.map((c) => c[1])))];
// metres past the river sections' painted area (the silk's edges, the river's end of the scroll): the page's mist is
// full 9 m out (backdrop.json mist.full)
const quad = [river[0].corners[0], river[river.length - 1].corners[1], river[river.length - 1].corners[2], river[0].corners[3]];
const outside = (x, d) => { let o = -Infinity; for (let i = 0; i < 4; i++) { const [ax, ad] = quad[i], [bx, bd] = quad[(i + 1) % 4], L = hyp(bx - ax, bd - ad); o = Math.max(o, ((bd - ad) * (x - ax) - (bx - ax) * (d - ad)) / L); } return o; };
const ptOf = (k) => [cx(k % NX), cd((k / NX) | 0)];
const outsideK = (k) => outside(...ptOf(k));
// metres from a seed through the cells ok(k) allows (8-connected)
function geodesic(seed, ok) {
  const dist = new Float32Array(N).fill(Infinity);
  const h = new Heap();
  dist[seed] = 0; h.push(seed, 0);
  while (h.size) {
    const k = h.pop(), i = k % NX, j = (k / NX) | 0, dk = dist[k];
    for (const [di, dj] of NB.slice(0, 8)) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= NX || jj >= ND) continue;
      const n = jj * NX + ii, nd = dk + hyp(di, dj) * RES;
      if (nd < dist[n] && ok(n)) { dist[n] = nd; h.push(n, nd); }
    }
  }
  return dist;
}
// the two ends of the reach round a seed: the farthest cell from it, then the farthest from that; mist counts extra,
// so an end that runs into the mist ends deep in it
function reachEnds(seed, ok) {
  const d0 = geodesic(seed, ok);
  // where the reach runs into the mist, that end lies where the river leaves the silk: the misted cell (12-16 m past
  // the edge) farthest along the water from the seed
  let mist = -1, mv = -1, maxO = 0;
  for (let k = 0; k < N; k++) if (d0[k] < Infinity) maxO = Math.max(maxO, outsideK(k));
  // (with room round it: not against the run-on's own edge)
  if (maxO >= 9.5) for (let k = 0; k < N; k++) if (d0[k] < Infinity) { const o = outsideK(k), v = d0[k] + 4 * Math.min(clrBank[k], 6); if (o >= Math.min(12, maxO - 1) && v > mv) { mv = v; mist = k; } }
  if (args.includes('--debug')) console.log(`  reachEnds: seed ${ptOf(seed).map((v) => v.toFixed(1))}, deepest mist reached ${maxO.toFixed(1)} m`);
  const far = (d) => { let best = -1, bv = -1; for (let k = 0; k < N; k++) if (d[k] < Infinity && outsideK(k) < 1) { if (d[k] > bv) { bv = d[k]; best = k; } } return best; };
  if (mist >= 0) { const dM = geodesic(mist, ok), A = far(dM); return { A, B: mist, length: dM[A] }; }
  const A = far(d0);
  const dA = geodesic(A, ok), B = far(dA);
  return { A, B, length: dA[B] };
}
const endType = (k) => (outsideK(k) > 8.5 ? 'mist' : 'closed');

// ---------------------------------------------------------------- routing
class Heap { constructor() { this.k = []; this.v = []; } push(k, v) { const a = this.k, b = this.v; a.push(k); b.push(v); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (b[p] <= b[i]) break; [a[p], a[i]] = [a[i], a[p]]; [b[p], b[i]] = [b[i], b[p]]; i = p; } } pop() { const a = this.k, b = this.v, top = a[0]; const lk = a.pop(), lv = b.pop(); if (a.length) { a[0] = lk; b[0] = lv; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && b[l] < b[m]) m = l; if (r < a.length && b[r] < b[m]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; [b[m], b[i]] = [b[i], b[m]]; i = m; } } return top; } get size() { return this.k.length; } }
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [1, 2], [-2, 1], [-1, 2], [2, -1], [1, -2], [-2, -1], [-1, -2]];
// cost of a cell for a hull needing `req` m of clearance: wide water preferred, under the arch the highest soffit, a
// side of the river (lat: -1 south .. 1 north), near a guide lane, away from other painted spots
function route(from, to, { req, lat = null, latW = 0, guide = null, guideW = 0, avoid = null, clr = clrAll, near = null, outW = 4 }) {
  const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
  const h = new Heap();
  dist[from] = 0; h.push(from, 0);
  const cellCost = (k) => {
    const x = cx(k % NX), d = cd((k / NX) | 0);
    let need = req;
    if (near) for (const [px, pd, r, relax] of near) if (hyp(x - px, d - pd) < r) need = Math.min(need, relax);
    const c = clr[k];
    if (!(c >= need) || !water[k]) return Infinity;
    let w = 1 + 2 * Math.max(0, need + 2.5 - c) ** 2 / 6;
    const ce = ceil[k] - waterH;
    if (ce < 8) w += 3 * Math.max(0, 6 - ce) ** 2 / 4 + 6 * Math.max(0, 4 - ce) ** 2; // under an arch: its highest part
    if (lat !== null) { const sd = (dS[k] - dN[k]) / Math.max(1e-3, dS[k] + dN[k]); w += latW * (sd - lat) ** 2; }
    if (guide) w += guideW * Math.min(guide[k], 8) ** 2 / 16;
    if (avoid) w += avoid[k];
    if (outW) w += outW * Math.min(12, Math.max(0, outside(x, d))) / 12; // stay on the painted river until its end
    return w;
  };
  const cc = new Float32Array(N).fill(-1);
  while (h.size) {
    const k = h.pop();
    if (k === to) break;
    const i = k % NX, j = (k / NX) | 0, dk = dist[k];
    for (const [di, dj] of NB) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= NX || jj >= ND) continue;
      const n = jj * NX + ii;
      if (cc[n] < 0) cc[n] = cellCost(n);
      if (cc[n] === Infinity) continue;
      if (Math.abs(di) + Math.abs(dj) === 3) { const m1 = j * NX + ii, m2 = jj * NX + i; if (cc[m1] === Infinity || cc[m2] === Infinity) continue; } // knight moves: no corner cutting
      const nd = dk + hyp(di, dj) * RES * (cc[n] + (cc[k] > 0 ? cc[k] : 1)) / 2;
      if (nd < dist[n]) { dist[n] = nd; prev[n] = k; h.push(n, nd); }
    }
  }
  if (prev[to] < 0 && to !== from) return null;
  const cells = [];
  for (let k = to; k >= 0; k = prev[k]) { cells.push(k); if (k === from) break; }
  return cells.reverse().map(ptOf);
}
const nearestFree = (x, d, req, r = 6) => { // the nearest cell round (x, d) with the clearance
  let best = -1, bd = Infinity;
  for (let dj = -r / RES; dj <= r / RES; dj++) for (let di = -r / RES; di <= r / RES; di++) { const k = at(x + di * RES, d + dj * RES); if (k < 0 || !water[k] || !(clrAll[k] >= req)) continue; const dd = hyp(di, dj); if (dd < bd) { bd = dd; best = k; } }
  return best;
};

// smoothing: a moving average over `win` m, repeated, each point kept where the smoothed one lacks clearance;
// fixed: indices that stay put (the painted pose)
function smooth(pts, { win = 6, iters = 6, req, fixed = new Set(), clr = clrAll } = {}) {
  let p = resample(pts, STEP);
  const fx = new Set([...fixed].map((i) => Math.round(i)));
  const n = Math.round(win / STEP / 2);
  for (let it = 0; it < iters; it++) {
    const q = p.map((v) => v.slice());
    for (let i = 1; i < p.length - 1; i++) {
      if (fx.has(i)) continue;
      let sx = 0, sd = 0, c = 0;
      for (let k = Math.max(0, i - n); k <= Math.min(p.length - 1, i + n); k++) { sx += p[k][0]; sd += p[k][1]; c++; }
      const nx = sx / c, nd = sd / c, kk = at(nx, nd);
      if (kk >= 0 && clr[kk] >= req && water[kk]) q[i] = [nx, nd];
    }
    p = q;
  }
  return p;
}
function resample(pts, step) {
  const out = [pts[0].slice()];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ad] = pts[i - 1], [bx, bd] = pts[i];
    const L = hyp(bx - ax, bd - ad);
    let t = step - acc;
    while (t <= L) { out.push([ax + ((bx - ax) * t) / L, ad + ((bd - ad) * t) / L]); t += step; }
    acc = L - (t - step);
  }
  const last = pts[pts.length - 1];
  if (hyp(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > step * 0.3) out.push(last.slice());
  return out;
}
const runOn = (pts, m, atStart) => { // straight on into the mist
  const [a, b] = atStart ? [pts[1], pts[0]] : [pts[pts.length - 2], pts[pts.length - 1]];
  const L = hyp(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, ud = (b[1] - a[1]) / L;
  const add = [];
  for (let s = STEP; s <= m + 1e-6; s += STEP) add.push([b[0] + ux * s, b[1] + ud * s]);
  return atStart ? [...add.reverse(), ...pts] : [...pts, ...add];
};

// ---------------------------------------------------------------- the lanes
const lanes = {};
const reqOf = (b) => b.half + MARGIN;
// a painted boat's pose on its lane: stern and bow ends of the waterline, run on 2 m either way along its heading;
// near it the clearance is what the painting gives (crowded moorings)
function poseOf(b) {
  const req = reqOf(b), ux = Math.cos(b.heading), ud = Math.sin(b.heading), a = b.lw / 2 + 2;
  const A = [b.pos[0] - ux * a, b.pos[1] - ud * a], B = [b.pos[0] + ux * a, b.pos[1] + ud * a];
  const relaxA = Math.max(0.5, Math.min(req, clrAll[at(...A)] - 0.05)), relaxB = Math.max(0.5, Math.min(req, clrAll[at(...B)] - 0.05)), relaxC = Math.max(0.5, Math.min(req, clrAll[at(...b.pos)] - 0.05));
  const near = [[...A, b.lw / 2 + 6, relaxA], [...B, b.lw / 2 + 6, relaxB], [...b.pos, b.lw / 2 + 4, Math.min(relaxA, relaxB, relaxC)]];
  const needAt = (k) => { const [x, d] = ptOf(k); let need = req; for (const [px, pd, r, relax] of near) if (hyp(x - px, d - pd) < r) need = Math.min(need, relax); return need; };
  const ok = (k) => water[k] === 1 && clrAll[k] >= needAt(k);
  return { req, ux, ud, a, A, B, near, ok, relax: Math.min(req, relaxA, relaxB, relaxC) };
}
// a painted boat whose reach at real size is short (a basin closed by rafts and moorings) keeps its painted run: a
// flow there would only shuttle it out of sight and back within sight
const SHORT = 40;
for (const b of flowing) {
  const { ok } = poseOf(b);
  const { length } = reachEnds(at(...b.pos), ok);
  b.reach = length;
  if (length >= SHORT) continue;
  b.flows = false;
  b.keeps = `its reach at real size is ${length.toFixed(0)} m (under ${SHORT}): it keeps its painted run`;
  console.log(`${b.slug}: ${b.keeps}`);
  const k = boats.indexOf(b), run = b.spec.run_m ?? 8;
  for (let t = 0; t <= run + 1e-6; t += Math.max(0.5, run / 8)) fillPoly(poseOutline(b, b.pos[0] + Math.cos(b.heading) * t, b.pos[1] + Math.sin(b.heading) * t, b.heading), (c) => { hullMask[c] = k; });
}
if (flowing.some((b) => !b.flows)) { flowing = flowing.filter((b) => b.flows); clrAll = edt((k) => bank(k) || hullMask[k] >= 0); }
// a lane between two cells: routed, smoothed within its clearance, run on into the mist at an end that lies in it
function laneBetween(from, to, opts, smoothReq) {
  const raw = route(from, to, opts);
  if (!raw) return null;
  return smooth(raw, { req: smoothReq ?? opts.req, win: 10, iters: 10, clr: opts.clr });
}
const finish = (pts, from, to) => { // run-ons; returns { pts, ends, off (points added at the start) }
  let off = 0;
  const ends = [endType(from), endType(to)];
  if (ends[0] === 'mist') { const n = pts.length; pts = runOn(pts, RUN_ON, true); off = pts.length - n; }
  if (ends[1] === 'mist') pts = runOn(pts, RUN_ON, false);
  return { pts, ends, off };
};
// painted spots: the lanes stay off the other painted boats' spots where they can (they pause there)
const spotCost = (except) => {
  const a = new Float32Array(N);
  for (const b of flowing) if (b !== except) fillPoly(poseOutline(b, b.pos[0], b.pos[1], b.heading, 1.0), (k) => { a[k] += 6; });
  return a;
};
for (const b of flowing) {
  const westward = Math.cos(b.heading) < 0;
  const { req, ux, ud, a, A, B, near, ok, relax } = poseOf(b);
  const { A: e1, B: e2, length } = reachEnds(at(...b.pos), ok);
  // the end behind it is where it comes in, the one ahead where it goes out
  const behind = (k) => (ptOf(k)[0] - b.pos[0]) * ux + (ptOf(k)[1] - b.pos[1]) * ud < 0;
  const [from, to] = behind(e1) ? [e1, e2] : [e2, e1];
  const opts = { req, avoid: spotCost(b), near, lat: westward ? 0.3 : -0.3, latW: 0.4 };
  const r1 = route(from, at(...A), opts), r2 = route(at(...B), to, opts);
  if (!r1 || !r2) { console.warn(`${b.slug}: no lane (${!r1 ? 'to its spot' : 'from its spot'}) at ${req.toFixed(2)} m`); b.noLane = true; continue; }
  const straight = resample([A, B], STEP);
  const p1 = smooth(r1, { req: relax, win: 8, iters: 8 }), p2 = smooth(r2, { req: relax, win: 8, iters: 8 });
  let pts = [...p1.slice(0, -1), ...straight, ...p2.slice(1)];
  const i0 = p1.length - 1, i1 = i0 + straight.length - 1;
  pts = smooth(pts, { req: relax, win: 6, iters: 6, fixed: new Set(Array.from({ length: i1 - i0 + 1 }, (_, k) => i0 + k)) });
  const f = finish(pts, from, to);
  lanes[b.slug] = { use: 'painted', boat: b.id, dir: westward ? 'west' : 'east', req, half: b.half, beamHalf: Math.min(b.half, b.beam / 2 + 0.4), pts: f.pts, ends: f.ends, spotIndex: i0 + f.off, spotAhead: a };
  b.lane = b.slug;
  console.log(`${b.slug}: reach ${length.toFixed(0)} m from (${ptOf(from).map((v) => v.toFixed(1))}, ${endType(from)}) to (${ptOf(to).map((v) => v.toFixed(1))}, ${endType(to)})`);
}

// ---------------------------------------------------------------- along a lane: sections, mist, checks
const secAt = (x, d) => { // the section whose seams hold (x, d) (past the silk's edges too)
  for (const [i, s] of river.entries()) {
    const [sw, se, ne, nw] = s.corners;
    const side = (a, b) => (b[0] - a[0]) * (d - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (side(sw, nw) <= 0 && side(se, ne) >= 0) return i; // between its west seam (sw->nw) and its east seam (se->ne)
  }
  return -1;
};
const cum = (pts) => { const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return s; };
const pAt = (pts, S, s) => { // a point at arc length s (clamped)
  if (s <= 0) return pts[0];
  if (s >= S[S.length - 1]) return pts[pts.length - 1];
  let lo = 0, hi = S.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
  const t = (s - S[lo]) / (S[hi] - S[lo] || 1);
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t];
};
const chord = (lane, s, a) => { const P = pAt(lane.pts, lane.S, s - a), Q = pAt(lane.pts, lane.S, s + a); return { X: (P[0] + Q[0]) / 2, D: (P[1] + Q[1]) / 2, hd: Math.atan2(Q[1] - P[1], Q[0] - P[0]) }; };
function setupLane(lane) {
  if (lane.S) return;
  lane.S = cum(lane.pts);
  lane.sec = [];
  let cur = null;
  for (const [i, [x, d]] of lane.pts.entries()) { const si = secAt(x, d); if (!cur || cur[0] !== si) { cur = [si, i, i]; lane.sec.push(cur); } cur[2] = i; }
  if (lane.spotIndex !== undefined) lane.spot = lane.S[lane.spotIndex] + lane.spotAhead; // its painted pose's chord centre
  // its section: the one that holds every point not in the mist (a lane never crosses a seam: its boats load and go
  // with that section)
  const held = new Map();
  for (const [i, p] of lane.pts.entries()) if (outside(...p) <= 7) { const si = secAt(...p); held.set(si, (held.get(si) || 0) + 1); }
  const [own] = [...held.entries()].sort((p, q) => q[1] - p[1])[0];
  lane.owner = river[own]?.name || null;
  lane.crosses = [...held.keys()].filter((k) => k !== own).map((k) => river[k]?.name || 'none');
  if (lane.crosses.length) console.warn(`lane ${lane.boat || ''}: crosses into ${lane.crosses.join(', ')}`);
}
for (const lane of Object.values(lanes)) setupLane(lane);

// a boat along a lane: per 0.5 m the hull against banks and moored hulls, and its top against the ceiling
function sweep(b, lane, { mast = 'up' } = {}) {
  const a = b.lw / 2, out = [];
  const tops = [...b.top.entries()].map(([k, y]) => { const [i, j] = k.split(',').map(Number); return [i * RES, j * RES, y]; });
  const mtop = mast === 'none' || !b.mast ? [] : [...(mast === 'down' ? b.mastDown : b.mastUp).entries()].map(([k, y]) => { const [i, j] = k.split(',').map(Number); return [i * RES, j * RES, y]; });
  for (let s = a; s <= lane.S[lane.S.length - 1] - a; s += STEP) {
    const { X, D, hd } = chord(lane, s, a);
    const c = Math.cos(hd), sn = Math.sin(hd);
    let hit = 0, wet = 0, low = Infinity, lowMast = Infinity, clr = Infinity;
    const world = poseOutline(b, X, D, hd);
    const misted = outside(X, D) > 8; // the hull in the mist: nobody sees it
    out.push({ s, X, D, hd, misted });
    if (misted) { Object.assign(out[out.length - 1], { hit: 0, wet: 0, low: Infinity, lowMast: Infinity, clr: Infinity }); continue; }
    out.pop();
    fillPoly(world, (k) => {
      wet++;
      if (!water[k] || ceil[k] < waterH + 0.3) hit++;
      else if (hullMask[k] >= 0 && boats[hullMask[k]] !== b) hit++;
    });
    const toW = ([lx, lz]) => [X + lx * c + lz * sn, D + lx * sn - lz * c];
    // overhead only (what lies at or under the surface is the hull's business: hit)
    for (const [lx, lz, y] of tops) { const [wx, wd] = toW([lx, lz]); const k = at(wx, wd); if (k >= 0 && ceil[k] < Infinity && ceil[k] > waterH + 0.3) low = Math.min(low, ceil[k] - (waterH + y)); }
    for (const [lx, lz, y] of mtop) { const [wx, wd] = toW([lx, lz]); const k = at(wx, wd); if (k >= 0 && ceil[k] < Infinity && ceil[k] > waterH + 0.3) lowMast = Math.min(lowMast, ceil[k] - (waterH + y)); }
    // clearance of the outline's corners to banks and hulls
    for (const p of b.outline) { const [wx, wd] = toW(p); const k = at(wx, wd); if (k >= 0) clr = Math.min(clr, clrAll[k]); }
    out.push({ s, X, D, hd, misted, hit, wet, low, lowMast, clr });
  }
  return out;
}
const runs = (arr, test) => { const r = []; let cur = null; for (const e of arr) { if (test(e)) { if (!cur) { cur = [e.s, e.s]; r.push(cur); } cur[1] = e.s; } else cur = null; } return r; };

const report = { lanes: {}, boats: {} };
const flowBoats = {};
for (const b of flowing) {
  if (b.noLane) continue;
  const lane = lanes[b.lane];
  const sw = sweep(b, lane, { mast: 'up' }), swd = b.mast ? sweep(b, lane, { mast: 'down' }) : sw;
  const blockedHull = runs(sw, (e) => e.hit > 0 && Math.abs(e.s - lane.spot) > b.lw / 2 + 3);
  if (args.includes('--debug')) for (const e of sw) if (e.hit > 0 || e.low < HEAD) console.log(`   ${b.slug} s ${e.s.toFixed(1)} at ${e.X.toFixed(1)},${e.D.toFixed(1)} hit ${e.hit}/${e.wet} low ${e.low.toFixed(2)} out ${outside(e.X, e.D).toFixed(1)}`);
  const blockedTop = runs(sw, (e) => e.low < HEAD);
  const blockedMast = b.mast ? runs(sw, (e) => e.lowMast < HEAD) : [];
  const blockedDown = b.mast ? runs(swd, (e) => e.lowMast < HEAD) : [];
  const S = lane.S[lane.S.length - 1];
  const dirSign = 1;
  // the first place along the way it can't pass (its hull or its top even with the mast down); it waits short of it
  const stops = [...blockedTop, ...blockedDown, ...blockedHull].sort((p, q) => p[0] - q[0]);
  const first = stops.find((r) => r[1] > lane.spot - 0) || null; // past its spot: it waits there (the painted direction)
  const before = stops.filter((r) => r[1] < lane.spot);
  const entry = before.length ? before[before.length - 1][1] + b.lw / 2 + 4 : null; // it can't come from beyond these: it starts after them
  const pass = !first;
  let hold = first ? Math.max(lane.spot + 1, first[0] - 6) : null;
  if (hold !== null && hold - lane.spot < 15) hold = lane.spot; // it can go no way past its spot: it waits there, as painted
  // the mast: down before the first place it needs to be down, up after the last (on the stretch it travels)
  let mast = null;
  if (b.mast && blockedMast.length) {
    const lo = blockedMast.filter((r) => (entry === null || r[1] > entry) && (hold === null || r[0] < hold + 6));
    if (lo.length) mast = { down_deg: MAST_DOWN, lower: [lo[0][0] - 22, lo[0][0] - 6], raise: [lo[lo.length - 1][1] + 6, lo[lo.length - 1][1] + 22] };
  }
  const stopAtSpot = (hold !== null && hold <= lane.spot + 0.01) || lane.spot >= lane.S[lane.S.length - 1] - b.lw / 2 - 0.6;
  flowBoats[b.id] = { lane: b.lane, spot: +lane.spot.toFixed(2), stop_at_spot: stopAtSpot, outline: simplify(b.outline), speed: b.spec.flow_speed_mps ?? SPEED[b.pose] ?? 0.6, pause_s: b.spec.pause_s?.[0] ?? 8,
    pass, hold: hold === null ? null : +hold.toFixed(1), entry: entry === null ? null : +entry.toFixed(1), mast,
    top: +b.topMax.toFixed(2), mast_up: b.mastUpMax === null ? null : +b.mastUpMax.toFixed(2), mast_down: b.mastDownMax === null ? null : +b.mastDownMax.toFixed(2),
    half: +b.half.toFixed(2), len: b.len.map((v) => +v.toFixed(2)) };
  report.boats[b.id] = { minClear: +Math.min(...sw.filter((e) => Math.abs(e.s - lane.spot) > b.lw / 2 + 3).map((e) => e.clr)).toFixed(2), blockedHull, blockedTop: blockedTop.map((r) => r.map((v) => +v.toFixed(1))),
    minHead: +Math.min(...sw.map((e) => e.low)).toFixed(2), minHeadMastDown: b.mast ? +Math.min(...swd.map((e) => e.lowMast)).toFixed(2) : null, blockedMast: blockedMast.map((r) => r.map((v) => +v.toFixed(1))) };
  console.log(`${b.slug}: lane ${lane.S[lane.S.length - 1].toFixed(0)} m, spot s ${lane.spot.toFixed(1)}, ${pass ? 'passes' : `holds at s ${hold?.toFixed(1)}`}${entry !== null ? `, enters after s ${entry.toFixed(1)}` : ''}, head ${report.boats[b.id].minHead}${mast ? `, mast down s ${mast.lower[1].toFixed(0)}..${mast.raise[0].toFixed(0)}` : ''}; hull blocked ${JSON.stringify(blockedHull.map((r) => r.map((v) => +v.toFixed(0))))}; top blocked ${JSON.stringify(report.boats[b.id].blockedTop)}`);
}

// ---------------------------------------------------------------- the waves lanes
// they keep off the spots where a painted boat goes no further (it waits there, as painted)
const spotMask = new Uint8Array(N);
for (const b of flowing) if (flowBoats[b.id] && flowBoats[b.id].stop_at_spot) fillPoly(poseOutline(b, b.pos[0], b.pos[1], b.heading, 0.3), (k) => { spotMask[k] = 1; });
const clrWaves = edt((k) => bank(k) || hullMask[k] >= 0 || spotMask[k] === 1);
// the waves lanes: per hull class, per reach it can sail (a reach long enough to be worth it), up (west, against the
// current, the north side) and down (east, with it, the south side)
// half widths and margins (choice): the small boats (skiffs, sampans, covered, open and awning boats, up to 2.4 m
// across, slipping 0.3 m past moored hulls as boatmen do) and the rest up to 3.8 m
const CLASSES = { small: [1.2, 0.3], big: [1.9, MARGIN] };
if (args.includes('--debug')) for (const req of [0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5]) {
  const ok = (k) => water[k] === 1 && clrAll[k] >= req;
  const pairs = [[[147, 19.5], [118, 20.5]], [[147, 19.5], [131, 20.5]], [[131, 20.5], [118, 20.5]], [[147, 19.5], [165, 12]]];
  const res = pairs.map(([p, q]) => { const a = nearestFree(...p, req, 3), b2 = nearestFree(...q, req, 3); if (a < 0 || b2 < 0) return 'none'; const d = geodesic(a, ok); return d[b2] < Infinity ? d[b2].toFixed(0) : 'no'; });
  console.log(`  req ${req}: lake ${res.join(' / ')}`);
}
const reaches = [];
for (const [cls, [half, margin]] of Object.entries(CLASSES)) {
  const req = half + margin;
  const ok = (k) => water[k] === 1 && clrWaves[k] >= req;
  const seen = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    if (seen[k] || !ok(k)) continue;
    const d = geodesic(k, ok);
    let n = 0; for (let q = 0; q < N; q++) if (d[q] < Infinity) { seen[q] = 1; n++; }
    if (n * RES * RES < 15) continue; // a pocket
    const { A, B, length } = reachEnds(k, ok);
    if (args.includes('--debug')) console.log(`  ${cls} component at ${ptOf(k).map((v) => v.toFixed(1))}: ${(n * RES * RES).toFixed(0)} m2, ${length.toFixed(0)} m from ${ptOf(A).map((v) => v.toFixed(1))} to ${ptOf(B).map((v) => v.toFixed(1))}`);
    if (length < 30) continue;
    const [W, E] = cx(A % NX) < cx(B % NX) ? [A, B] : [B, A];
    const id = `${cls}${reaches.filter((r) => r.cls === cls).length + 1}`;
    reaches.push({ id, cls, req, W, E, length });
    console.log(`reach ${id}: ${length.toFixed(0)} m from (${ptOf(W).map((v) => v.toFixed(1))}, ${endType(W)}) to (${ptOf(E).map((v) => v.toFixed(1))}, ${endType(E)})`);
    // its centre line (west to east), then the two lanes either side of it as far as the clearance allows: up (west,
    // against the current) on the north side, where the trackers walk; down (east) on the south side
    const raw = laneBetween(W, E, { req, clr: clrWaves });
    if (!raw) { console.warn(`  no centre line in ${id}`); continue; }
    const sep = half + 0.45; // half the gap between the two lanes' centres: hulls of the class pass 0.9 m apart
    // under anything overhead a lane keeps to the centre line (an arch's crown): the boats take turns there (zones)
    const headroom = (x, d) => { let m = Infinity; for (let dd = -half - 0.5; dd <= half + 0.5; dd += RES) for (let dx = -2; dx <= 2; dx += RES) { const k = at(x + dx, d + dd); if (k >= 0 && ceil[k] > waterH + 0.3) m = Math.min(m, ceil[k] - waterH); } return m; };
    for (const [dir, sign] of [['up', 1], ['down', -1]]) {
      const off = raw.map((p, i) => {
        const a = raw[Math.max(0, i - 4)], b = raw[Math.min(raw.length - 1, i + 4)];
        const L = hyp(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nd = (b[0] - a[0]) / L; // left of eastward: north
        const h0 = headroom(...p);
        for (let o = sep; o >= 0; o -= 0.25) { const q = [p[0] + sign * nx * o, p[1] + sign * nd * o], k = at(...q); if (k >= 0 && water[k] && clrWaves[k] >= req && (h0 === Infinity || headroom(...q) >= h0 - 0.05)) return q; }
        return p;
      });
      let pts = smooth(off, { req, win: 10, iters: 8, clr: clrWaves });
      if (dir === 'up') pts = pts.reverse();
      const [from, to] = dir === 'up' ? [E, W] : [W, E];
      const f = finish(pts, from, to);
      lanes[`${id}-${dir}`] = { use: 'waves', cls, reach: id, dir: dir === 'up' ? 'west' : 'east', req, half, pts: f.pts, ends: f.ends };
    }
  }
}
for (const lane of Object.values(lanes)) setupLane(lane);

// ---------------------------------------------------------------- turns: at a closed end the waves boats turn back
// A boat that comes up a reach to its closed end (the moorings) turns there and goes back the way it came, as boats
// do: a loop lane is the lane in, a turn, and the lane out (a lake closed at both ends: round it twice). The turn: two
// cubic curves through an apex ahead of the lane's end and to one side, searched over where it leaves the lane in,
// where it joins the lane out and the apex, for the shortest that keeps the class's clearance (off the painted
// boats' stops, inside the silk) and never turns tighter than the class's radius (choice: a hull turns on about its
// own length: 3.5 m small, 6 m big).
const TURN_R = { small: 3.5, big: 6 };
function tangentAt(L, s) { const a = pAt(L.pts, L.S, s - 1), b = pAt(L.pts, L.S, s + 1), l = hyp(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; }
const bez = (p0, p1, p2, p3, n) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]); });
function tightest(pts) { let r = Infinity; for (let i = 2; i + 2 < pts.length; i += 2) { const [a, b, c] = [pts[i - 2], pts[i], pts[i + 2]]; const ab = hyp(b[0] - a[0], b[1] - a[1]), bc = hyp(c[0] - b[0], c[1] - b[1]), ca = hyp(a[0] - c[0], a[1] - c[1]); const area2 = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])); if (area2 > 1e-9) r = Math.min(r, (ab * bc * ca) / (2 * area2)); } return r; }
const diag = { r: 0, n: 0 };
function makeTurn(In, Out, cls) {
  diag.r = 0; diag.n = 0;
  const req = In.req, Rmin = TURN_R[cls];
  const okPt = ([x, d]) => { const k = at(x, d); return k >= 0 && water[k] === 1 && clrWaves[k] >= req && outside(x, d) < 6; }; // out into the misty river a little
  let best = null;
  const SI = In.S[In.S.length - 1], SO = Out.S[Out.S.length - 1];
  for (let sA = SI - 4; sA > SI - 90 && sA > SI / 3; sA -= 3) {
    const Pin = pAt(In.pts, In.S, sA), tIn = tangentAt(In, sA), nIn = [-tIn[1], tIn[0]];
    for (let sB = 4; sB < 90 && sB < (2 * SO) / 3; sB += 3) {
      const Pout = pAt(Out.pts, Out.S, sB), tOut = tangentAt(Out, sB);
      const side = Math.sign((Pout[0] - Pin[0]) * nIn[0] + (Pout[1] - Pin[1]) * nIn[1]) || 1; // the lane out lies on this side of the lane in
      for (let u = 2; u <= 30; u += 2) for (let v = 0; v <= 22; v += 1) { // the apex ahead, on the lane out's side
        const A = [Pin[0] + tIn[0] * u + nIn[0] * side * v, Pin[1] + tIn[1] * u + nIn[1] * side * v];
        if (!okPt(A)) continue;
        const tA = [nIn[0] * side, nIn[1] * side]; // at the apex it runs across, toward the lane out
        const d1 = hyp(A[0] - Pin[0], A[1] - Pin[1]), d2 = hyp(Pout[0] - A[0], Pout[1] - A[1]);
        const c1 = bez(Pin, [Pin[0] + tIn[0] * d1 * 0.55, Pin[1] + tIn[1] * d1 * 0.55], [A[0] - tA[0] * d1 * 0.55, A[1] - tA[1] * d1 * 0.55], A, Math.max(4, Math.ceil(d1 * 2)));
        const c2 = bez(A, [A[0] + tA[0] * d2 * 0.55, A[1] + tA[1] * d2 * 0.55], [Pout[0] - tOut[0] * d2 * 0.55, Pout[1] - tOut[1] * d2 * 0.55], Pout, Math.max(4, Math.ceil(d2 * 2)));
        const path = [...c1, ...c2.slice(1)];
        let len = 0; for (let i = 1; i < path.length; i++) len += hyp(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
        const cost = len + (SI - sA) + sB;
        if (best && cost >= best.cost) continue;
        if (!path.every(okPt)) continue;
        const tr = tightest(resample(path, STEP));
        if (!(diag.r >= tr)) diag.r = Math.max(diag.r || 0, tr), diag.n++;
        if (tr < Rmin) continue;
        best = { cost, sA, sB, path };
      }
    }
  }
  return best;
}
const part = (L, s0, s1) => L.pts.filter((_, i) => L.S[i] > s0 && L.S[i] < s1);
for (const r of reaches) {
  const up = lanes[`${r.id}-up`], down = lanes[`${r.id}-down`];
  if (!up || !down) continue;
  const closedW = up.ends[1] === 'closed', closedE = down.ends[1] === 'closed';
  const tW = closedW ? makeTurn(up, down, r.cls) : null, tE = closedE ? makeTurn(down, up, r.cls) : null;
  console.log(`turns in ${r.id}: west ${tW ? `from s ${tW.sA} of the lane up to s ${tW.sB} of the lane down` : closedW ? 'no room' : '-'}, east ${tE ? `from s ${tE.sA} to s ${tE.sB}` : closedE ? 'no room' : '-'}`);
  const make = (name, pts, ends) => { lanes[`${r.id}-${name}`] = { use: 'waves', cls: r.cls, reach: r.id, dir: 'loop', req: r.req, half: up.half, pts: resample(pts, STEP), ends }; };
  // up the reach, turn at the west end, down again
  if (tW) make('loop', [...part(up, -1, tW.sA), ...tW.path, ...part(down, tW.sB, Infinity)], [up.ends[0], down.ends[1]]);
  // a lake: from its west end down, round the east turn, up, round the west turn, down, round the east turn, up home
  if (tW && tE) make('circuit', [...part(down, -1, tE.sA), ...tE.path, ...part(up, tE.sB, tW.sA), ...tW.path, ...part(down, tW.sB, tE.sA), ...tE.path, ...part(up, tE.sB, Infinity)], ['closed', 'closed']);
}
for (const lane of Object.values(lanes)) setupLane(lane);
// the waves: which boats can sail which waves lane: their hull fits (a graze away from the ends is a fail), their top
// passes under everything overhead, their mast (if any) down where the mast up wouldn't pass, 16 m either side
const templates = {};
function fit(b, lane) {
  const a = b.lw / 2, S = lane.S[lane.S.length - 1];
  const up = sweep(b, lane, { mast: 'up' });
  const top = runs(up, (e) => e.low < HEAD);
  const graze = runs(up, (e) => e.hit > 2 && e.s > a + 3 && e.s < S - a - 3);
  let mast = null, mastBlocked = [];
  if (b.mast) {
    const need = runs(up, (e) => e.lowMast < HEAD);
    if (need.length) {
      const lo = need[0][0] - 16, hi = need[need.length - 1][1] + 16;
      const down = sweep(b, lane, { mast: 'down' });
      mastBlocked = runs(down.filter((e) => e.s >= lo && e.s <= hi), (e) => e.lowMast < HEAD);
      mast = { up_deg: +b.mastUpDeg.toFixed(1), down_deg: MAST_DOWN, lower: [+(lo).toFixed(1), +(need[0][0] - 6).toFixed(1)], raise: [+(need[need.length - 1][1] + 6).toFixed(1), +hi.toFixed(1)] };
    } else mast = { up_deg: +b.mastUpDeg.toFixed(1), down_deg: MAST_DOWN, lower: null, raise: null };
  }
  const stops = [...top, ...graze, ...mastBlocked].sort((p, q) => p[0] - q[0]);
  return { pass: !stops.length, hold: stops.length ? +Math.max(a, stops[0][0] - 8).toFixed(1) : null, mast,
    minHead: +Math.min(...up.map((e) => e.low)).toFixed(2), maxGraze: Math.max(0, ...up.filter((e) => e.s > a + 3 && e.s < S - a - 3).map((e) => e.hit)), stops };
}
for (const b of boats) {
  if (b.pose === 'lowering mast' && !b.flows) continue; // the boat painted in trouble at the bridge stays itself
  for (const [name, lane] of Object.entries(lanes)) {
    if (lane.use !== 'waves' || b.half > CLASSES[lane.cls][0] + 0.05) continue; // a lane takes every hull up to its class's width
    const f = fit(b, lane);
    (templates[b.id] ||= { sec: b.sec, kind: b.kind, pose: b.pose, half: +b.half.toFixed(2), len: b.len.map((v) => +v.toFixed(2)), top: +b.topMax.toFixed(2), outline: simplify(b.outline), lanes: {} }).lanes[name] = {
      pass: f.pass, hold: f.hold, mast: f.mast, minHead: f.minHead, maxGraze: f.maxGraze };
  }
}

// ---------------------------------------------------------------- zones: lanes of opposite direction too close
const zones = [];
const ln = Object.entries(lanes);
for (let p = 0; p < ln.length; p++) for (let q = p + 1; q < ln.length; q++) {
  const [na, A] = ln[p], [nb, B] = ln[q];
  if (A.dir === B.dir && A.dir !== 'loop') continue;
  const tan = (L, i) => { const a = L.pts[Math.max(0, i - 2)], b = L.pts[Math.min(L.pts.length - 1, i + 2)], l = hyp(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const need = (A.beamHalf ?? A.half) + (B.beamHalf ?? B.half) + 0.5;
  const reach = (L) => { const fb = L.boat && flowBoats[L.boat]; if (!fb) return [-Infinity, Infinity]; const end = fb.stop_at_spot ? fb.spot : fb.hold ?? Infinity; return [-Infinity, end + fb.len[1] + 1]; };
  const [, aEnd] = reach(A), [, bEnd] = reach(B); // two hulls meeting: their half beams (a sweep swings over the other's water) and 0.5 m between
  const hits = [];
  for (const [i, pa] of A.pts.entries()) {
    if (outside(...pa) > 6 || A.S[i] > aEnd) continue; // in the mist nobody sees them pass through each other; a painted boat goes no further than its stop
    let best = Infinity, bj = -1;
    for (let j = 0; j < B.pts.length; j += 2) { if (B.S[j] > bEnd) break; const dd = hyp(pa[0] - B.pts[j][0], pa[1] - B.pts[j][1]); if (dd < best) { best = dd; bj = j; } }
    if (best < need) { const ta = tan(A, i), tb = tan(B, bj); if (ta[0] * tb[0] + ta[1] * tb[1] < -0.3) hits.push([i, bj]); } // only where they meet head on
  }
  if (!hits.length) continue;
  // contiguous runs on A, with the span they cover on B; widened by the longest hull either way
  let cur = null;
  for (const [i, j] of hits) {
    if (!cur || i > cur.a1 + 4) { cur = { a0: i, a1: i, b0: j, b1: j }; zones.push({ lanes: [na, nb], cur }); }
    cur.a1 = i; cur.b0 = Math.min(cur.b0, j); cur.b1 = Math.max(cur.b1, j);
  }
}
const zoneOut = zones.map(({ lanes: [na, nb], cur }) => ({ [na]: [+(lanes[na].S[cur.a0] - 4).toFixed(1), +(lanes[na].S[cur.a1] + 4).toFixed(1)], [nb]: [+(lanes[nb].S[cur.b0] - 4).toFixed(1), +(lanes[nb].S[cur.b1] + 4).toFixed(1)] }));
console.log(`zones: ${zoneOut.length}`, JSON.stringify(zoneOut));

// ---------------------------------------------------------------- the trackers' towpaths (painted towed boats)
// Each painted tracker walks beside its boat: its painted spot moved as the lane moves the boat (Δ m of lane from the
// boat's spot). The stretch it can walk: from its spot back along Δ (and on past it, if the boat goes past its spot)
// while every tracker of the boat stands on ground at about its painted height, with nothing built from 0.3 to 1.7 m
// above it within 0.35 m (walls, posts, stalls, the edge walls) and no painted figure within 0.7 m.
const tow = {};
const bucket = new Map(), BK = 2;
for (const t of colTris) {
  const xs = t.map((p) => p[0]), ds = t.map((p) => -p[2]);
  for (let i = Math.floor(Math.min(...xs) / BK); i <= Math.floor(Math.max(...xs) / BK); i++) for (let j = Math.floor(Math.min(...ds) / BK); j <= Math.floor(Math.max(...ds) / BK); j++) {
    const k = `${i},${j}`; if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(t);
  }
}
function groundAt(x, d, y0) { // the highest walkable surface under (x, d) from y0 + 1.2 down
  let best = -Infinity;
  for (const t of bucket.get(`${Math.floor(x / BK)},${Math.floor(d / BK)}`) || []) {
    const [a, b, c] = t, ax = a[0], ad = -a[2], bx = b[0], bd = -b[2], cx_ = c[0], cd_ = -c[2];
    const area = (bx - ax) * (cd_ - ad) - (cx_ - ax) * (bd - ad);
    if (Math.abs(area) < 1e-9) continue;
    const w0 = ((bx - x) * (cd_ - d) - (cx_ - x) * (bd - d)) / area, w1 = ((cx_ - x) * (ad - d) - (ax - x) * (cd_ - d)) / area, w2 = 1 - w0 - w1;
    if (w0 < 0 || w1 < 0 || w2 < 0) continue;
    const y = w0 * a[1] + w1 * b[1] + w2 * c[1];
    // a surface facing up
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const ny = uz * vx - ux * vz, nl = Math.hypot(uy * vz - uz * vy, ny, ux * vy - uy * vx);
    if (Math.abs(ny) / nl < 0.7 || y > y0 + 1.2) continue;
    best = Math.max(best, y);
  }
  return best;
}
function blockedAt(x, d, gy) { // anything built in the body's way
  for (let i = Math.floor((x - 0.4) / BK); i <= Math.floor((x + 0.4) / BK); i++) for (let j = Math.floor((d - 0.4) / BK); j <= Math.floor((d + 0.4) / BK); j++) {
    for (const t of bucket.get(`${i},${j}`) || []) {
      const ys = t.map((p) => p[1]);
      if (Math.max(...ys) < gy + 0.3 || Math.min(...ys) > gy + 1.7) continue;
      let hit = false;
      sampleTri(t, 0.12, (p) => { if (!hit && p[1] > gy + 0.3 && p[1] < gy + 1.7 && hyp(p[0] - x, -p[2] - d) < 0.35) hit = true; });
      if (hit) return true;
    }
  }
  return false;
}
for (const b of flowing) {
  if (!b.spec.haul || !lanes[b.lane]) continue;
  const lane = lanes[b.lane], s0 = lane.spot, sec = river.find((s) => s.name === b.sec);
  const figs = (sec.layout.figures || []);
  const haul = Object.keys(b.spec.haul).map((slug) => figs.find((f) => f.id === slug)).filter(Boolean);
  const others = figs.filter((f) => !haul.includes(f) && !/^boat /.test(f.support || ''));
  const nudge = (f) => sec.people.figures?.[f.id]?.nudge || [0, 0];
  const P0 = pAt(lane.pts, lane.S, s0);
  const ok = (dl) => {
    const P = pAt(lane.pts, lane.S, s0 + dl);
    for (const f of haul) {
      const [nx, nd] = nudge(f), x = f.X + nx + P[0] - P0[0], d = f.D + nd + P[1] - P0[1], y0 = f.H || 0;
      const gy = groundAt(x, d, y0);
      const why = !(gy > y0 - 0.8) ? `no ground (${gy.toFixed(2)})` : blockedAt(x, d, gy) ? 'built' : others.find((o) => hyp(o.X - x, o.D - d) < 0.7)?.id;
      if (why) { if (args.includes('--debug')) console.log(`   tow ${b.slug} Δ ${dl}: ${f.id} at ${x.toFixed(1)},${d.toFixed(1)}: ${why}`); return false; }
    }
    return true;
  };
  let lo = 0, hi = 0;
  while (lo > -60 && ok(lo - 0.5)) lo -= 0.5;
  const ahead = Math.max(0, (flowBoats[b.id]?.hold ?? lane.S[lane.S.length - 1]) - s0);
  while (hi < ahead && ok(hi + 0.5)) hi += 0.5;
  tow[b.id] = { haul: haul.map((f) => f.id), tow: b.spec.tow || null, range: [lo, hi] };
  console.log(`${b.slug}: its trackers walk ${(-lo).toFixed(1)} m back and ${hi.toFixed(1)} m on from their painted spots`);
}

// ---------------------------------------------------------------- write
const r2 = (v) => +v.toFixed(2);
const out = {
  about: 'The river\'s boat lanes for web/src/boatflow.js (?boatflow=painted|waves), made by tools/boat_lanes.mjs from the river sections as shipped (water strips, shores, the bridge\'s soffit, the boats GLBs). Lanes run in their direction of travel: pts [X, D] every 0.5 m, from one end of a reach (the water a hull of its width can sail) to the other; ends: each end "mist" (run on past the silk\'s edge, where the mist is full) or "closed" (a bank, a raft of moored hulls: boats wait there until nobody sees them); owner: the section the lane lies in (its boats load and go with it); a boat sits on a lane with its stern at s - lw/2 and its bow at s + lw/2. boats: the painted boats under way that flow (spot: s of their painted pose; hold: s where one that can\'t pass the bridge waits; entry: s before which it never is; mast: lowered over [lower] and raised over [raise], in s). templates: per boat, which waves lane it can sail and whether it passes the bridge. zones: s ranges where two lanes of opposite direction are too close to pass: one boat at a time.',
  made: new Date().toISOString().slice(0, 10), res: RES, step: STEP, water_H: waterH, margin: MARGIN, head: HEAD,
  sections: river.map((s) => s.name),
  lanes: Object.fromEntries(Object.entries(lanes).map(([k, l]) => [k, { use: l.use, cls: l.cls, reach: l.reach, boat: l.boat, owner: l.owner, dir: l.dir, req: r2(l.req), half: r2(l.half), ends: l.ends,
    spot: l.spot === undefined ? undefined : r2(l.spot), length: r2(l.S[l.S.length - 1]), pts: l.pts.map(([x, d]) => [r2(x), r2(d)]) }])),
  boats: flowBoats, tow, templates, zones: zoneOut, report,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
if (args.includes('--ship')) fs.writeFileSync(OUT_WEB, JSON.stringify(out));
console.log(`wrote ${path.relative(QM, OUT)}${args.includes('--ship') ? ` and ${path.relative(QM, OUT_WEB)}` : ''} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);

// ---------------------------------------------------------------- the plan (for review)
async function plan(file, [X0, X1, D0, D1], S) {
  const sharp = (await import('sharp')).default;
  fs.mkdirSync(PLAN, { recursive: true });
  const W = Math.round((X1 - X0) * S), H = Math.round((D1 - D0) * S);
  const P = (x, d) => `${((x - X0) * S).toFixed(1)},${((D1 - d) * S).toFixed(1)}`;
  const inView = (pts) => pts.some(([x, d]) => x > X0 - 5 && x < X1 + 5 && d > D0 - 5 && d < D1 + 5);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#e8e2d4"/>`;
  for (const { t } of waterTris) if (inView(t)) svg += `<polygon points="${t.map((p) => P(...p)).join(' ')}" fill="#9db8bb"/>`;
  const st = Math.max(1, Math.round(1 / (S * RES)));
  for (let j = Math.max(0, cj(D0)); j < Math.min(ND, cj(D1)); j += st) for (let i = Math.max(0, ci(X0)); i < Math.min(NX, ci(X1)); i += st) {
    const k = j * NX + i, c = ceil[k] - waterH;
    if (water[k] && c < 6) svg += `<rect x="${((cx(i) - RES / 2 - X0) * S).toFixed(1)}" y="${((D1 - cd(j) - RES / 2 - (st - 1) * RES) * S).toFixed(1)}" width="${st * RES * S}" height="${st * RES * S}" fill="${c < 1 ? '#555' : c < 3 ? '#a64' : '#db8'}" opacity="0.5"/>`;
  }
  for (const t of shoreSegs) if (inView(t)) svg += `<polyline points="${t.map((p) => P(...p)).join(' ')}" fill="none" stroke="#b33" stroke-width="1"/>`;
  for (const b of boats) { const o = poseOutline(b, b.pos[0], b.pos[1], b.heading); if (!inView(o)) continue; svg += `<polygon points="${o.map((p) => P(...p)).join(' ')}" fill="${b.flows ? '#e90' : b.under ? '#c33' : '#6b4f35'}" fill-opacity="0.6" stroke="#222" stroke-width="1"/><text x="${P(...b.pos).split(',')[0]}" y="${P(...b.pos).split(',')[1]}" font-size="${Math.max(9, S * 0.9)}" fill="#000">${b.slug.replace(/^boat_/, '').slice(0, 18)}</text>`; }
  const pal = ['#1a5fd0', '#0a8a3a', '#c0f', '#d02060', '#0aa', '#a60', '#606', '#060', '#00a', '#a00'];
  Object.entries(lanes).forEach(([name, l], i) => {
    if (!inView(l.pts)) return;
    const c = pal[i % pal.length];
    svg += `<polyline points="${l.pts.map((p) => P(...p)).join(' ')}" fill="none" stroke="${c}" stroke-width="${l.use === 'waves' ? 2.5 : 2}" stroke-dasharray="${l.use === 'waves' ? '' : '7,4'}"/>`;
    const m = l.pts[Math.floor(l.pts.length * (0.3 + 0.1 * (i % 4)))];
    svg += `<text x="${P(...m).split(',')[0]}" y="${+P(...m).split(',')[1] - 3}" font-size="12" fill="${c}">${name.replace(/^boat_/, '')} ${l.dir === 'west' ? '&lt;' : '&gt;'}</text>`;
    const e = l.pts[l.pts.length - 1];
    svg += `<circle cx="${P(...e).split(',')[0]}" cy="${P(...e).split(',')[1]}" r="4" fill="${c}"/>`;
  });
  for (const [id, fb] of Object.entries(flowBoats)) { const l = lanes[fb.lane]; for (const [s, c] of [[fb.hold, '#f00'], [fb.entry, '#08f']]) if (s !== null) { const p = pAt(l.pts, l.S, s); svg += `<circle cx="${P(...p).split(',')[0]}" cy="${P(...p).split(',')[1]}" r="6" fill="${c}" stroke="#000"/>`; } if (fb.mast) for (const s of [fb.mast.lower[1], fb.mast.raise[0]]) { const p = pAt(l.pts, l.S, s); svg += `<circle cx="${P(...p).split(',')[0]}" cy="${P(...p).split(',')[1]}" r="5" fill="#ff0" stroke="#000"/>`; } }
  for (let x = Math.ceil(X0 / 10) * 10; x <= X1; x += 10) svg += `<line x1="${(x - X0) * S}" y1="0" x2="${(x - X0) * S}" y2="${H}" stroke="#888" stroke-width="0.6"/><text x="${(x - X0) * S + 3}" y="14" font-size="13">${x}</text>`;
  for (let d = Math.ceil(D0 / 10) * 10; d <= D1; d += 10) svg += `<line x1="0" y1="${(D1 - d) * S}" x2="${W}" y2="${(D1 - d) * S}" stroke="#888" stroke-width="0.6"/><text x="3" y="${(D1 - d) * S - 3}" font-size="13">${d}</text>`;
  for (const s of river) svg += `<polygon points="${s.corners.map((c) => P(...c)).join(' ')}" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="10,6"/>`;
  svg += '</svg>';
  await sharp(Buffer.from(svg), { limitInputPixels: false }).png().toFile(path.join(PLAN, file));
  console.log(`plan: gen/boats/flow/${file}`);
}
if (args.includes('--plan')) {
  await plan('lanes_s3.png', [86, 160, 6, 34], 14);
  await plan('lanes_s2.png', [150, 280, -26, 28], 8);
}
if (args.includes('--probe')) {
  const [slug, ln] = args[args.indexOf('--probe') + 1].split(':');
  const b = boats.find((x) => x.slug === slug), lane = lanes[ln];
  for (const e of sweep(b, lane, { mast: 'down' })) if (e.low < 1 || e.lowMast < 1 || e.hit) console.log(`s ${e.s.toFixed(1)} at ${e.X.toFixed(1)},${e.D.toFixed(1)} hit ${e.hit} low ${e.low.toFixed(2)} lowMast(down) ${e.lowMast.toFixed(2)}`);
}
