#!/usr/bin/env node
// Prove that a section's owners data (gen/sections/<name>/owners.json, blender/owners_dump.py) is what is live: the
// triangles per material from the owners must equal the shipped web/public/assets/<name>.glb's per-mesh counts
// (g_<mat>__col / __nocol: the index accessors' counts, which the meshopt buffers decode to). A section whose builder drifted from what shipped is reported DRIFT, with
// the materials that differ; the contact checks still measure it, flagged. gen/details/brief_contacts.md.
//   node tools/owners_verify.mjs <section|all> [--json out]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SECTIONS = ['city_end', 'inner_city', 'gate', 'outer_road', 'outer_road_2', 'rainbow_bridge', 'canal', 'countryside'];

// the shipped GLB's JSON chunk: per mesh node, the triangles its primitives index (accessor counts, the same numbers
// the meshopt-decoded buffers hold) and the POSITION bounds glTF requires (page frame: x = X, y = H, z = -D)
export function readGlbJson(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}
export async function shippedCounts(name) {
  const json = readGlbJson(path.join(QM, `web/public/assets/${name}.glb`));
  const counts = {}, bounds = {};
  for (const node of json.nodes || []) {
    if (node.mesh === undefined) continue;
    const key = (node.name || '').replace(/^g_/, '');
    let n = 0;
    for (const prim of json.meshes[node.mesh].primitives) {
      const acc = json.accessors[prim.indices ?? prim.attributes.POSITION];
      n += acc.count / 3;
      const pa = json.accessors[prim.attributes.POSITION];
      if (pa.min && pa.max) {
        // KHR_mesh_quantization: normalized integers, dequantized by the node's scale and translation (as the page's
        // matrixWorld does)
        const q = pa.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[pa.componentType] || 1 : 1;
        const t = node.translation || [0, 0, 0], sc = node.scale || [1, 1, 1];
        const b = (bounds[key] ||= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
        for (let i = 0; i < 3; i++) {
          b.min[i] = Math.min(b.min[i], t[i] + sc[i] * pa.min[i] / q);
          b.max[i] = Math.max(b.max[i], t[i] + sc[i] * pa.max[i] / q);
        }
      }
    }
    counts[key] = (counts[key] || 0) + n;
  }
  return { counts, bounds };
}

export async function verify(name) {
  const f = path.join(QM, `gen/sections/${name}/owners.json`);
  if (!fs.existsSync(f)) return { section: name, status: 'MISSING', note: 'no owners.json (tools/owners_build.sh)' };
  const own = JSON.parse(fs.readFileSync(f, 'utf8'));
  const { counts: ship, bounds: shipB } = await shippedCounts(name);
  // positions too: each material's bounding box from owners.bin (map frame X, D, H -> page x = X, y = H, z = -D)
  // against the GLB's POSITION min/max, in metres
  const bin = fs.readFileSync(path.join(QM, `gen/sections/${name}/owners.bin`));
  const F = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
  const ownB = {};
  for (const rs of Object.values(own.owners)) for (const [t0, n, mat] of rs) {
    const b = (ownB[mat] ||= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
    for (let i = t0 * 9; i < (t0 + n) * 9; i += 3) {
      const p = [F[i], F[i + 2], -F[i + 1]];
      for (let k = 0; k < 3; k++) { if (p[k] < b.min[k]) b.min[k] = p[k]; if (p[k] > b.max[k]) b.max[k] = p[k]; }
    }
  }
  let boundsErr = 0, boundsWorst = null;
  for (const [mat, b] of Object.entries(ownB)) {
    const g = shipB[mat];
    if (!g) continue;
    for (let k = 0; k < 3; k++) for (const e of ['min', 'max']) {
      const d = Math.abs(b[e][k] - g[e][k]);
      if (d > boundsErr) { boundsErr = d; boundsWorst = `${mat} ${e}[${'xyz'[k]}]`; }
    }
  }
  const keys = [...new Set([...Object.keys(own.materials), ...Object.keys(ship)])].sort();
  const diff = [];
  for (const k of keys) if ((own.materials[k] || 0) !== (ship[k] || 0)) diff.push({ material: k, owners: own.materials[k] || 0, shipped: ship[k] || 0 });
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
  return { section: name, status: diff.length ? (explained ? 'DRIFT(explained)' : 'DRIFT') : 'MATCH', owners_tris: sum(own.materials), shipped_tris: sum(ship),
    materials: keys.length, diff, bounds_err_m: +boundsErr.toFixed(4), bounds_worst: boundsWorst, owner_diff: ownerDiff, exclude_owners: added, built: own.date };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const which = !args[0] || args[0] === 'all' ? SECTIONS : [args[0]];
  const out = [];
  for (const s of which) {
    const r = await verify(s);
    out.push(r);
    console.log(`${s.padEnd(15)} ${r.status.padEnd(16)} owners ${r.owners_tris ?? '-'} tris, shipped ${r.shipped_tris ?? '-'}, bounds within ${r.bounds_err_m} m${r.diff?.length ? '; differ: ' + r.diff.map((d) => `${d.material} ${d.owners}/${d.shipped}`).join(', ') : ''}${r.owner_diff?.length ? '; owners: ' + r.owner_diff.slice(0, 6).map((d) => `${d.owner} ${d.owners}/${d.placed}`).join(', ') + (r.owner_diff.length > 6 ? ` (+${r.owner_diff.length - 6})` : '') : ''}${r.note ? ' ' + r.note : ''}`);
  }
  const j = args.indexOf('--json');
  if (j >= 0) fs.writeFileSync(args[j + 1], JSON.stringify(out, null, 1));
}
