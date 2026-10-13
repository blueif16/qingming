#!/usr/bin/env node
// What lies over and under a crew member's root on its boat at the dump instant (fix-boats triage): every surface of its
// boat (visible by material, colliders) on a vertical line through the root, heights relative to the root.
//   node gen/details/contacts/fix_boats/tools/stack.mjs <placements.json> <figure id> [dx,dd]
import fs from 'node:fs';
import { World } from '../../../../../tools/lib/owners_index.mjs';
import { BoatWorld, loadBoatOwners } from '../../../../../tools/lib/boat_world.mjs';
import { SECTIONS, driftExclusions } from '../../../../../tools/place_predict.mjs';
const [file, ...rest] = process.argv.slice(2);
// --pred <dir>: the root from a contact_check --predict result (<dir>/<section>.json) instead of the dump's
const pi = rest.indexOf('--pred'), predDir = pi >= 0 ? rest[pi + 1] : null;
const ids = rest.filter((a, i) => a !== '--pred' && rest[i - 1] !== '--pred');
const dump = JSON.parse(fs.readFileSync(file, 'utf8'));
const world = World.load(SECTIONS, { exclude: driftExclusions() });
const bw = BoatWorld.extend(world, loadBoatOwners());
bw.pose(dump.boats, 'dump');
for (const id of ids) {
  const p = { ...dump.people.find((q) => q.id === id) };
  if (predDir) { const r = JSON.parse(fs.readFileSync(`${predDir}/${p.section}.json`, 'utf8')).results.find((x) => x.id === id); if (r?.root) p.root = r.root; }
  const root = [p.root[0], -p.root[2], p.root[1]];
  console.log(`${id} (${p.map?.support}; ${p.map?.pose}; painted H ${p.map?.H}) root H ${root[2].toFixed(3)} on ${p.boat?.id} spot ${JSON.stringify(p.boat?.spot)}`);
  for (const [dx, dd] of [[0, 0], [0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15]]) {
    const v = bw.vertical(root[0] + dx, root[1] + dd, (t) => bw.isBoatTri(t)).map((h) => `${(h.h - root[2]).toFixed(3)} ${bw.owners[bw.owner[h.t]].split('|')[1]}:${bw.mats[bw.mat[h.t]]}`);
    console.log(`   ${dx},${dd}: ${v.sort((a, b) => parseFloat(b) - parseFloat(a)).join(' | ')}`);
  }
}
