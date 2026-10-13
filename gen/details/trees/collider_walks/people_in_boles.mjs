#!/usr/bin/env node
// Every person and animal (gen/details/placements.json, tools/people_dump.mjs) against every big bole the page gives a
// collider (web/src/trees3d.js trunkColliders, the same placement and radius): who stands inside one, or within its
// radius + 0.3 m (the walker's own radius). A figure inside a drawn bole is a defect whatever the colliders do.
//   node gen/details/trees/collider_walks/people_in_boles.mjs
import fs from 'node:fs';
const Q = '/home/ran/3d_director/qingming';
const reg = JSON.parse(fs.readFileSync(`${Q}/web/public/assets/trees3d/trees3d.json`));
const cards = JSON.parse(fs.readFileSync(`${Q}/web/public/assets/trees/trees.json`));
const dump = JSON.parse(fs.readFileSync(`${Q}/gen/details/placements.json`));
const SHRUBS = new Set(['leafy', 'whip_clump', 'hedge']), MIN_R = 0.45;
const boles = [];
for (const sec of [...new Set(dump.people.map((p) => p.section))]) {
  const name = typeof sec === 'string' ? sec : sec.name;
  const L = JSON.parse(fs.readFileSync(`${Q}/web/public/assets/${name}/layout.json`));
  for (const t of L.trees) {
    if (t.card === 'kit') continue;
    const c = cards[t.card] || { height_m: 8.5 }, v = reg.variants[t.card], k = v?.trunk;
    const s = t.card && t.height_m ? Math.min(1.4, Math.max(0.7, t.height_m / c.height_m)) : t.scale;
    if (!k || !(k.r * s > MIN_R) || SHRUBS.has(v.form)) continue;
    // treeMatrix: turn h about y, scale (flip ? -s : s, s, s); the bole centre (k.x, 0, k.z) in the tree's frame
    const x = t.X, z = -t.D, hh = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453, a = (hh - Math.floor(hh) - 0.5) * 0.5;
    const lx = (t.flip ? -s : s) * k.x, lz = s * k.z;
    const cx = x + Math.cos(a) * lx + Math.sin(a) * lz, cz = z - Math.sin(a) * lx + Math.cos(a) * lz;
    boles.push({ sec: name, id: t.map_id, X: cx, D: -cz, r: k.r * s });
  }
}
const rows = [];
for (const p of dump.people) {
  const [x, , z] = p.root, X = x, D = -z;
  for (const b of boles) {
    const d = Math.hypot(X - b.X, D - b.D);
    if (d < b.r + 0.3) rows.push({ who: p.id, kind: p.kind, sec: p.section, tree: b.id, d: +d.toFixed(2), r: +b.r.toFixed(2), inside: d < b.r });
  }
}
rows.sort((a, b) => (b.inside - a.inside) || (a.d - a.r) - (b.d - b.r));
console.log(`${boles.length} boles with colliders; ${rows.filter((r) => r.inside).length} figures inside one, ${rows.filter((r) => !r.inside).length} within 0.3 m of one`);
for (const r of rows) console.log(`${r.inside ? 'INSIDE' : 'near  '}  ${r.sec.padEnd(15)} ${r.who.padEnd(36)} ${r.kind.padEnd(7)} ${r.tree}  d ${r.d} r ${r.r}`);
