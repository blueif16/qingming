#!/usr/bin/env node
// Seats fitted under seated figures (fix-inner, details pass; gen/details/contacts/fix_standard.md rules 3 and 5): for
// each listed figure, at its predicted placement (tools/place_predict.mjs, from the current sections/<s>/people.json),
// the seat site's median over its seated clip in the map frame, the visible surface under that point, and a seat
// top 0.007 m under the seat point. Written to gen/sections/<section>/fig_seats.json, which the section builder reads:
// a stool (kind "stool", owned by the figure's map ID: rule 5, "the seat is part of his figure") or a mapped seat's
// fitted height (kind "fit", owned by that prop: rule 3, the size is the builder's choice).
//   node fig_seats.mjs <section> <slug>:<clip>[:<kind>[:<owner>]] ... [--write]
// Without --write it prints only. Entries for other figures are kept.
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, siteTrack } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const section = args[0];
const items = args.slice(1).filter((a) => !a.startsWith('--'));
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const W = ctx.world;
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const visible = (t) => !W.hiddenMat[W.mat[t]] && !W.owners[W.owner[t]].includes('|edge:') && !/water/.test(W.owners[W.owner[t]]);
const out = path.join(QM, `gen/sections/${section}/fig_seats.json`);
const J = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : { about: '', seats: {} };
J.about = 'Seats fitted under seated figures (gen/details/contacts/fix_inner/tools/fig_seats.mjs; fix_standard.md rules 3, 5): per figure slug, the seat point (X, D, H) of its seated clip at its placement, the visible surface under it (base) and the seat top 0.007 m under the point; kind stool (owned by the figure) or fit (a mapped seat\'s height). Read by the section builder.';
for (const it of items) {
  const [slug, clip, kind = 'stool', owner = null] = it.split(':');
  const rec = ctx.dump.people.find((p) => p.section === section && p.id === slug);
  if (!rec) { console.log(`${slug}: not in the dump`); continue; }
  const trk = siteTrack(rec, clip, 'seat');
  if (!trk) { console.log(`${slug}: ${rec.model} has no ${clip}`); continue; }
  const p = [0, 1, 2].map((k) => med(trk.map((q) => q[k])));
  const spread = Math.max(...trk.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
  const hs = W.vertical(p[0], p[1], visible).filter((v) => v.h < p[2] - 0.15).sort((a, b) => b.h - a.h);
  const base = hs.length ? hs[0].h : 0;
  const top = p[2] - 0.007;
  const e = { clip, kind, owner: owner || `S${section === 'inner_city' ? 6 : '?'}.fig.${slug}`, X: r3(p[0]), D: r3(p[1]), seat_H: r3(p[2]), base: r3(base), base_owner: hs.length ? W.owners[W.owner[hs[0].t]] : null, top: r3(top), h: r3(top - base), spread_m: r3(spread), root: rec.root.map(r3), yaw_deg: Math.round((rec.yaw * 180) / Math.PI - 90) };
  console.log(`${slug} (${rec.model} ${clip}): seat point ${e.X}, ${e.D}, H ${e.seat_H} (moves ${e.spread_m} m in plan over the cycle); under it ${e.base_owner} at ${e.base}: ${kind} top ${e.top} (h ${e.h})`);
  J.seats[slug] = e;
}
if (args.includes('--write')) { fs.writeFileSync(out, JSON.stringify(J, null, 1) + '\n'); console.log(`wrote ${path.relative(QM, out)}`); }
