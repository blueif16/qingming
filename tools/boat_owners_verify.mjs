#!/usr/bin/env node
// The boats' owners (gen/sections/<name>/boat_owners.*, blender/boat_owners.py via build_boats.py) against the shipped
// boats GLB (web/public/assets/<name>_boats.glb): per boat and node (lod 0), triangles and node-frame bounds. MATCH, or
// DRIFT with the differences (the next export of the section rebuilds its boats from the current layout and kit).
//   node tools/boat_owners_verify.mjs <section|all> [--json gen/details/contacts/boat_owners_verify.json]
import fs from 'node:fs';
import path from 'node:path';
import { QM } from './lib/owners_index.mjs';
import { verify, BOAT_SECTIONS } from './lib/boat_world.mjs';

const args = process.argv.slice(2);
const which = !args[0] || args[0] === 'all' || args[0].startsWith('--') ? BOAT_SECTIONS : [args[0]];
const out = [];
for (const s of which) {
  const r = await verify(s);
  out.push(r);
  console.log(`${s.padEnd(15)} ${r.status}${r.boats !== undefined ? ` (${r.boats} boats in the owners, ${r.shipped} shipped; worst bound ${r.worst_bounds_m} m)` : ''}`);
  for (const d of (r.differences || []).slice(0, 12)) console.log('   ', JSON.stringify(d));
}
const i = args.indexOf('--json');
if (i >= 0) {
  const f = path.resolve(QM, args[i + 1]);
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* none */ }
  const merged = [...prev.filter((p) => !which.includes(p.section)), ...out];
  fs.writeFileSync(f, JSON.stringify(merged, null, 1));
}
