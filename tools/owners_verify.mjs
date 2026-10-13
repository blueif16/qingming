#!/usr/bin/env node
// Prove that a section's owners data (gen/sections/<name>/owners.json, blender/owners_dump.py) is what is live: the
// triangles per material from the owners must equal the shipped web/public/assets/<name>.glb's, summed per glTF
// material over the whole GLB (index accessor counts, which the meshopt buffers decode to; node names are not relied
// on, so a GLB re-cut into cells still compares), and per bucket node while the GLB still has one node per bucket
// (g_<mat>__col / __nocol). Each line says which form was compared. A section whose builder drifted from what shipped is reported DRIFT, with
// the materials that differ; the contact checks still measure it, flagged. gen/details/brief_contacts.md.
//   node tools/owners_verify.mjs <section|all> [--json out]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SECTIONS = ['city_end', 'inner_city', 'gate', 'outer_road', 'outer_road_2', 'rainbow_bridge', 'canal', 'countryside'];

// the shipped GLB's JSON chunk
export function readGlbJson(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}

// column-major 4x4 helpers for node world matrices
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let x = 0; for (let k = 0; k < 4; k++) x += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = x; } return o; };
function trs(n) {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], t = n.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, t[0], t[1], t[2], 1];
}
const xf = (m, v) => [0, 1, 2].map((i) => m[i] * v[0] + m[4 + i] * v[1] + m[8 + i] * v[2] + m[12 + i]);

// Triangles per material summed over the WHOLE GLB, whatever its node structure (the performance session re-cuts the
// sections into ~10 m cells drawn as BatchedMeshes, so node and mesh names are not relied on): every primitive of every
// mesh node counts its index accessor (the count the meshopt-decoded buffer holds) under its glTF material's name, and
// its POSITION bounds (dequantised, through the node's world matrix; page frame x = X, y = H, z = -D) widen that
// material's box. While the GLB still has one node per bucket (g_<mat>__col / __nocol), the bucket counts come too, and
// the bucket -> glTF material map is learned (gltf-transform dedup merges identical materials, e.g. every edge wall and
// 'hidden') and kept in gen/details/contacts/material_map.json for the re-cut form.
export async function shippedCounts(name) {
  const json = readGlbJson(path.join(QM, `web/public/assets/${name}.glb`));
  const byMat = {}, bounds = {}, byBucket = {}, matOfBucket = {};
  const world = new Map();
  const walk = (i, parent) => { const n = json.nodes[i], m = mul(parent, trs(n)); world.set(i, m); for (const c of n.children || []) walk(c, m); };
  for (const sc of json.scenes || []) for (const r of sc.nodes || []) walk(r, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  let meshNodes = 0, bucketNodes = 0;
  (json.nodes || []).forEach((node, ni) => {
    if (node.mesh === undefined) return;
    meshNodes++;
    const bucket = /^g_(.+__(?:no)?col)$/.exec(node.name || '')?.[1] || null;
    if (bucket) bucketNodes++;
    const M = world.get(ni) || trs(node);
    for (const prim of json.meshes[node.mesh].primitives) {
      const n = json.accessors[prim.indices ?? prim.attributes.POSITION].count / 3;
      const mat = json.materials?.[prim.material]?.name ?? '(none)';
      byMat[mat] = (byMat[mat] || 0) + n;
      if (bucket) { byBucket[bucket] = (byBucket[bucket] || 0) + n; matOfBucket[bucket] = mat; }
      const pa = json.accessors[prim.attributes.POSITION];
      if (pa.min && pa.max) {
        const q = pa.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[pa.componentType] || 1 : 1;
        const b = (bounds[mat] ||= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
        for (let c = 0; c < 8; c++) {
          const p = xf(M, [0, 1, 2].map((i) => ((c >> i) & 1 ? pa.max[i] : pa.min[i]) / q));
          for (let i = 0; i < 3; i++) { b.min[i] = Math.min(b.min[i], p[i]); b.max[i] = Math.max(b.max[i], p[i]); }
        }
      }
    }
  });
  const form = bucketNodes === meshNodes ? `one node per bucket (${meshNodes} nodes)` : `re-cut: ${meshNodes} mesh nodes, ${bucketNodes} named g_<mat>__col|nocol`;
  return { byMat, bounds, byBucket: bucketNodes === meshNodes ? byBucket : null, matOfBucket, form, mtime: fs.statSync(path.join(QM, `web/public/assets/${name}.glb`)).mtime.toISOString() };
}

const MAP_FILE = path.join(QM, 'gen/details/contacts/material_map.json');
function bucketMap(name, learned) {
  const all = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};
  if (learned && Object.keys(learned).length) { all[name] = learned; fs.writeFileSync(MAP_FILE, JSON.stringify(all, null, 1)); }
  return all[name] || {};
}

export async function verify(name) {
  const f = path.join(QM, `gen/sections/${name}/owners.json`);
  if (!fs.existsSync(f)) return { section: name, status: 'MISSING', note: 'no owners.json (tools/owners_build.sh)' };
  const own = JSON.parse(fs.readFileSync(f, 'utf8'));
  const ship = await shippedCounts(name);
  // owners' buckets -> the glTF material each was shipped under (learned from the per-bucket form; a bucket not in the
  // map keeps its own material name: the bucket key minus __col / __nocol)
  const map = bucketMap(name, ship.byBucket ? ship.matOfBucket : null);
  const glOf = (bucket) => map[bucket] || bucket.replace(/__(no)?col$/, '');
  const ownByMat = {};
  for (const [b, n] of Object.entries(own.materials)) ownByMat[glOf(b)] = (ownByMat[glOf(b)] || 0) + n;
  // positions: each material's box from owners.bin (map frame X, D, H -> page x = X, y = H, z = -D) against the GLB's
  const bin = fs.readFileSync(path.join(QM, `gen/sections/${name}/owners.bin`));
  const F = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
  const ownB = {};
  for (const rs of Object.values(own.owners)) for (const [t0, n, b0] of rs) {
    const b = (ownB[glOf(b0)] ||= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
    for (let i = t0 * 9; i < (t0 + n) * 9; i += 3) {
      const p = [F[i], F[i + 2], -F[i + 1]];
      for (let k = 0; k < 3; k++) { if (p[k] < b.min[k]) b.min[k] = p[k]; if (p[k] > b.max[k]) b.max[k] = p[k]; }
    }
  }
  let boundsErr = 0, boundsWorst = null;
  for (const [mat, b] of Object.entries(ownB)) {
    const g = ship.bounds[mat];
    if (!g) continue;
    for (let k = 0; k < 3; k++) for (const e of ['min', 'max']) {
      const d = Math.abs(b[e][k] - g[e][k]);
      if (d > boundsErr) { boundsErr = d; boundsWorst = `${mat} ${e}[${'xyz'[k]}]`; }
    }
  }
  // the comparison: per glTF material over the whole GLB (always); per bucket too while the GLB has one node per bucket
  const keys = [...new Set([...Object.keys(ownByMat), ...Object.keys(ship.byMat)])].sort();
  const diff = [];
  for (const k of keys) if ((ownByMat[k] || 0) !== (ship.byMat[k] || 0)) diff.push({ material: k, owners: ownByMat[k] || 0, shipped: ship.byMat[k] || 0 });
  const bucketDiff = [];
  if (ship.byBucket) for (const k of new Set([...Object.keys(own.materials), ...Object.keys(ship.byBucket)])) if ((own.materials[k] || 0) !== (ship.byBucket[k] || 0)) bucketDiff.push({ bucket: k, owners: own.materials[k] || 0, shipped: ship.byBucket[k] || 0 });
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  // per owner: sections/<name>/placed.json is the shipped build's triangles per owner (tools/owners_build.sh puts the
  // shipped one back after a rebuild); an owner the rebuild added or changed is drift, which the checks leave out
  const placed = JSON.parse(fs.readFileSync(path.join(QM, `sections/${name}/placed.json`), 'utf8')).owners || {};
  const per = Object.fromEntries(Object.entries(own.owners).map(([o, rs]) => [o, rs.reduce((a, r) => a + r[1], 0)]));
  const ownerDiff = [];
  for (const o of new Set([...Object.keys(per), ...Object.keys(placed)])) {
    // the ground and water meshes are baked outside the buckets: their parts (fields, floors, river strips) are all
    // 'ground' / 'water' in the owners; they are compared as one total below
    if (o.startsWith('mesh:') || o === 'water' || o === 'ground' || /\.(water|grd|road)\./.test(o)) continue;
    if ((per[o] || 0) !== (placed[o] || 0)) ownerDiff.push({ owner: o, owners: per[o] || 0, placed: placed[o] || 0 });
  }
  const gw = (m) => Object.entries(m).filter(([o]) => o === 'water' || o === 'ground' || /\.(water|grd|road)\./.test(o)).reduce((a, [, n]) => a + n, 0);
  if (gw(per) !== gw(placed)) ownerDiff.push({ owner: 'ground+water (all parts)', owners: gw(per), placed: gw(placed) });
  const added = ownerDiff.filter((d) => !d.placed).map((d) => d.owner);
  const addedTris = ownerDiff.filter((d) => !d.placed).reduce((a, d) => a + d.owners, 0);
  // drift explained: the material difference is exactly the owners the rebuild added
  const explained = diff.length > 0 && diff.reduce((a, d) => a + d.owners - d.shipped, 0) === addedTris && ownerDiff.every((d) => !d.placed);
  return { section: name, status: diff.length ? (explained ? 'DRIFT(explained)' : 'DRIFT') : 'MATCH', compared: `per glTF material over the whole GLB${ship.byBucket ? ' and per bucket node' : ''}`,
    glb_form: ship.form, glb_mtime: ship.mtime, owners_tris: sum(own.materials), shipped_tris: sum(ship.byMat),
    materials: keys.length, diff, bucket_diff: bucketDiff, bounds_err_m: +boundsErr.toFixed(4), bounds_worst: boundsWorst, owner_diff: ownerDiff, exclude_owners: added, built: own.date };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const which = !args[0] || args[0] === 'all' ? SECTIONS : [args[0]];
  const out = [];
  for (const s of which) {
    const r = await verify(s);
    out.push(r);
    console.log(`${s.padEnd(15)} ${r.status.padEnd(16)} [${r.glb_form}] owners ${r.owners_tris ?? '-'} tris, shipped ${r.shipped_tris ?? '-'}, bounds within ${r.bounds_err_m} m${r.diff?.length ? '; differ: ' + r.diff.map((d) => `${d.material} ${d.owners}/${d.shipped}`).join(', ') : ''}${r.bucket_diff?.length ? '; buckets differ: ' + r.bucket_diff.map((d) => `${d.bucket} ${d.owners}/${d.shipped}`).join(', ') : ''}${r.owner_diff?.length ? '; owners: ' + r.owner_diff.slice(0, 6).map((d) => `${d.owner} ${d.owners}/${d.placed}`).join(', ') + (r.owner_diff.length > 6 ? ` (+${r.owner_diff.length - 6})` : '') : ''}${r.note ? ' ' + r.note : ''}`);
  }
  const j = args.indexOf('--json');
  if (j >= 0) fs.writeFileSync(args[j + 1], JSON.stringify(out, null, 1));
}
