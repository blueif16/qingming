#!/usr/bin/env node
// Seat fit (fix-bridge, details pass; fix_standard.md rule 3 "Stools and benches"): for each figure whose seat is its
// own (gen/sections/<s>/seats.json `what: stool`, the seat of a figure painted seated, map/BUILDING.md rule 3), the
// stool's top at the clip's seat point less 0.0075 m and its centre under the seat point, its base on the visible
// surface under it (the ground, a floor, or the Rainbow Bridge's visible tread: the builder's z_at gives the smooth
// deck, which runs up to 0.16 m over or under the treads). Placements are predicted from the current
// sections/<s>/people.json (tools/place_predict.mjs, as the page places them), the seat point is the median over the
// seated clip (gen/details/joints, the page's frame) of the `seat` site.
//   node seat_fit.mjs <section> [figure ids] [--write]   -> gen/sections/<s>/seat_fit.json
// The casting script merges seat_fit.json into seats.json (X, D, base_H, top_H); the builder's seats() builds each
// stool from base_H to top_H.
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, ruleOf, siteTrack } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const section = args[0];
const only = args.slice(1).filter((a) => !a.startsWith('--'));
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const { world } = ctx;
const seats = JSON.parse(fs.readFileSync(path.join(QM, `gen/sections/${section}/seats.json`), 'utf8'));
const outF = path.join(QM, `gen/sections/${section}/seat_fit.json`);
const prev = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF, 'utf8')) : { seats: {} };
const oName = (t) => world.owners[world.owner[t]];
const out = { ...prev.seats };
for (const [mid, s] of Object.entries(seats)) {
  if (mid === 'about' || s.what !== 'stool') continue;
  const id = mid.split('.').slice(2).join('.');
  if (only.length && !only.includes(id)) continue;
  const rec = ctx.dump.people.find((p) => p.section === section && p.id === id && p.kind === 'figure');
  if (!rec) { console.log(`${id}: no static figure`); continue; }
  const steps = rec.do || [];
  const chair = steps.map(([c]) => c).find((c) => ruleOf(c, c).posture === 'chair');
  if (!chair) { console.log(`${id}: no chair clip in ${JSON.stringify(steps)}`); continue; }
  const tr = siteTrack(rec, chair, 'seat');
  if (!tr) { console.log(`${id}: ${rec.model} has no ${chair}`); continue; }
  const p = [0, 1, 2].map((k) => med(tr.map((q) => q[k])));
  const lo = Math.min(...tr.map((q) => q[2])), q10 = [...tr.map((q) => q[2])].sort((a, b) => a - b)[Math.floor(tr.length * 0.1)];
  // the visible surface under the stool's centre (not the figure's own stool, not hidden colliders, edge walls, water)
  const own = `${mid}`;
  const f = (t) => !world.hiddenMat[world.mat[t]] && oName(t) !== own && !oName(t).includes('|edge:') && !oName(t).endsWith('|water');
  let base = null;
  for (const [dx, dd] of [[0, 0], [0.1, 0.1], [-0.1, 0.1], [0.1, -0.1], [-0.1, -0.1]]) {
    for (const v of world.vertical(p[0] + dx, p[1] + dd, f)) if (v.h <= p[2] - 0.15 && (base === null || v.h > base.h)) base = { h: v.h, owner: oName(v.t), at: [dx, dd] };
  }
  if (!base) { console.log(`${id}: nothing under the seat point`); continue; }
  // the top: the seat point's median less 0.0075 m (fix_standard rule 3), but never over the seat point's 10% low (the
  // seat site dips through the cycle: the 0.9 hold must stay inside the 2 cm penetration)
  const top = Math.min(p[2] - 0.0075, q10 + 0.012);
  out[mid] = { X: r3(p[0]), D: r3(p[1]), base_H: r3(base.h), top_H: r3(top), seat_h: r3(top - base.h), clip: `${rec.model} ${chair}`,
    seat_point: p.map(r3), seat_low: r3(lo), on: World_bare(base.owner),
    why: `fit (fix_standard rule 3): the top ${r3(top)} m (the seat point of ${rec.model} ${chair} at its placement, median ${r3(p[2])}, less 0.0075), centred under it at (${r3(p[0])}, ${r3(p[1])}), its base on ${World_bare(base.owner)} at ${r3(base.h)}` };
  console.log(`${id.padEnd(30)} ${rec.model} ${chair}: seat point ${p.map(r3).join(', ')} (low ${r3(lo)}), base ${r3(base.h)} on ${World_bare(base.owner)} -> top ${r3(top)} (h ${r3(top - base.h)}); was ${JSON.stringify([s.X, s.D, s.H, s.seat_h])}`);
}
function World_bare(n) { const i = n.indexOf('|'); return i >= 0 ? n.slice(i + 1) : n; }
if (args.includes('--write')) {
  fs.writeFileSync(outF, JSON.stringify({ about: 'Seat fits for the stools figures painted seated own (seats.json what: stool), written by gen/details/contacts/fix_bridge/tools/seat_fit.mjs from the figures\' placements (sections/<s>/people.json, predicted as the page places them) and the seated clip\'s seat point (gen/details/joints): X, D the stool\'s centre under the seat point; base_H the visible surface under it; top_H the seat point less 0.0075 m. Merged into seats.json by the casting script; built by the builder\'s seats().', seats: out }, null, 1) + '\n');
  console.log(`wrote ${path.relative(QM, outF)}`);
}
