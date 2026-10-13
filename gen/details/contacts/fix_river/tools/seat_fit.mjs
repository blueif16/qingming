#!/usr/bin/env node
// Seat fit (fix_standard.md rule 3, "Stools and benches: the top at the clip's seat point less 0.005-0.01, centred under
// the seat point"): for seated figures at their predicted placement (tools/place_predict.mjs from the current
// sections/<s>/people.json, the page's own frame with P1), the seat site's median over each chair clip of the cycle,
// in map metres, and the surface under it (the ground or floor, the figure's own seat and props left out).
//   node gen/details/contacts/fix_river/tools/seat_fit.mjs <section> <figure ...> [--below 0.008] [--json out]
// Prints per figure and clip: seat point X, D, H (median; min-max H over the cycle), the support under it, and the
// fitted seat: centre X, D, top H = seat point H - below, seat_h = top - support.
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, siteTrack, ruleOf } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const section = args[0];
const ids = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--')));
const below = +opt('--below', 0.008);
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const { world } = ctx;
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const out = [];
for (const id of ids) {
  const rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
  if (!rec) { console.log(`${id}: not found`); continue; }
  const own = new Set([rec.map_id]);
  for (const [clip] of rec.do || []) {
    const rule = ruleOf(clip, clip);
    if (!['chair', 'floor'].includes(rule.posture)) continue;
    // --base: measure on the base clip of a variant not built yet (a ~soles variant keeps its base's seat)
    const tr = siteTrack(rec, args.includes('--base') ? clip.split('~')[0] : clip, 'seat');
    if (!tr) { console.log(`${id} ${clip}: no track`); continue; }
    const X = med(tr.map((p) => p[0])), D = med(tr.map((p) => p[1])), H = med(tr.map((p) => p[2]));
    const Hmin = Math.min(...tr.map((p) => p[2])), Hmax = Math.max(...tr.map((p) => p[2]));
    const filt = (t) => { const o = World_bare(world.ownerName(t)); return !own.has(o) && !/\.prop\./.test(o) && !/\.fig\./.test(o) && !/^edge:/.test(o); };
    const sup = world.firstDown(X, D, H, filt);
    const supH = sup ? sup.h : null;
    // the top: median - below when that keeps the hold share of the cycle inside the rule's window (5 mm margins);
    // else the top that keeps the most of the cycle inside it (a sit that sways), nearest to median - below
    const c = rule.contacts.find((k) => k.site === 'seat') || { gap_m: 0.03, pen_m: 0.02, hold: 0.9 };
    const hs = tr.map((p) => p[2]);
    const share = (t) => hs.filter((h) => h - t <= c.gap_m - 0.005 && h - t >= -(c.pen_m - 0.005)).length / hs.length;
    let top = H - below, best = share(top);
    if (best < c.hold) {
      for (let t = Hmin - 0.05; t <= Hmax + 0.02; t += 0.001) {
        const sh = share(t);
        if (sh > best + 1e-9 || (Math.abs(sh - best) < 1e-9 && Math.abs(t - (H - below)) < Math.abs(top - (H - below)))) { best = sh; top = t; }
      }
    }
    const row = { id, model: rec.model, clip, posture: rule.posture, root: rec.root.map(r3), seat_point: [r3(X), r3(D), r3(H)], H_range: [r3(Hmin), r3(Hmax)],
      support: sup ? world.ownerName(sup.t) : null, support_H: r3(supH), fit: { X: r3(X), D: r3(D), top_H: r3(top), base_H: r3(supH), seat_h: supH === null ? null : r3(top - supH), share: r3(best) } };
    out.push(row);
    console.log(`${id.padEnd(34)} ${rec.model}/${clip}: seat point ${row.seat_point.join(', ')} (H ${row.H_range.join('..')}), on ${row.support} at ${row.support_H}: seat top ${row.fit.top_H}, seat_h ${row.fit.seat_h} (in window ${row.fit.share})`);
  }
}
function World_bare(n) { const i = n.indexOf('|'); return i >= 0 ? n.slice(i + 1) : n; }
if (opt('--json')) fs.writeFileSync(path.resolve(QM, opt('--json')), JSON.stringify(out, null, 1));
