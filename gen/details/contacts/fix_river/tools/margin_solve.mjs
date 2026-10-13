#!/usr/bin/env node
// Margin solve (fix-river): re-place figures whose placement checks pass at their tolerance's edge (the page sits 3-5
// mm off the prediction: GLB quantization), so they hold with a margin. Around each figure's CURRENT placement (its
// people.json nudge / facing), a grid then pattern search (--max m, --yaw deg) minimising: every FAIL as contact_solve
// weighs it, plus the stance soles' median beyond (pen - margin) or (gap - margin), plus any site/head depth beyond
// (pen - margin), plus every contact's hold-quantile beyond its tolerance less the margin, plus 2e-4 x move^2.
// Prints the placement; record it with tools/contact_solve.mjs --at dX,dD,f --write.
//   node margin_solve.mjs <section> <ids...> [--margin 0.01] [--max 0.2] [--yaw 10]
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, checkPerson } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const section = args[0];
const ids = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] || '').startsWith('--'));
const M = +opt('--margin', 0.01), MAX = +opt('--max', 0.2), YAW = +opt('--yaw', 10);
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const people = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
function cost(res) {
  let c = 0;
  for (const k of res.checks) {
    if (k.class === 'contact' && (k.status === 'PASS' || k.status === 'FAIL') && Number.isFinite(k.gap_q)) {
      c += Math.max(0, k.gap_q - (k.gap_m - M)) ** 2 + Math.max(0, -(k.pen_m - M) - k.pen_q) ** 2;
    } else if (k.class === 'stance_soles' && Number.isFinite(k.median)) {
      c += 4 * (Math.max(0, -(k.pen_m - M) - k.median) ** 2 + Math.max(0, k.median - (k.gap_m - M)) ** 2);
    } else if ((k.class === 'site_inside' || k.class === 'head_inside') && Number.isFinite(k.depth)) {
      c += 4 * Math.max(0, k.depth - (k.pen_m - M)) ** 2;
    } else if (k.class === 'body_cylinder' && Number.isFinite(k.overlap)) {
      c += 4 * Math.max(0, k.overlap - 0.03) ** 2;
    }
  }
  for (const f of res.fails) c += 1 + (Number.isFinite(f.value) ? f.value * f.value : 0);
  return c;
}
for (const id of ids) {
  const rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
  const spec = people.figures[id];
  const n0 = spec.nudge || [0, 0], f0 = spec.facing_deg ?? rec.map.facing_deg ?? 0;
  const trial = (n, f) => {
    const q = ctx.pred.figure(rec.map, { ...spec, nudge: n, facing_deg: f });
    const res = checkPerson({ ...rec, root: [q.X, q.H, -q.D], yaw: q.yaw });
    const mv = Math.hypot(n[0] - n0[0], n[1] - n0[1]);
    // other figures' bodies (contact_solve's crowd term: 0.23 m x the two scales apart), with the same margin
    let crowd = 0;
    for (const o of ctx.dump.people) {
      if (o.section !== section || o.id === id || o.kind !== 'figure') continue;
      const need = 0.23 * ((spec.scale || 1) + (people.figures[o.id]?.scale || 1)) + M, d = Math.hypot(q.X - o.root[0], q.D + o.root[2]);
      if (d < need) crowd += 10 * (need - d) ** 2;
    }
    return { n, f, res, c: cost(res) + crowd + 2e-4 * mv * mv + 1e-7 * (f - f0) ** 2, mv, crowd };
  };
  const before = trial(n0, f0);
  let best = before;
  for (let i = -MAX; i <= MAX + 1e-9; i += 0.05) for (let j = -MAX; j <= MAX + 1e-9; j += 0.05) for (let a = -YAW; a <= YAW + 1e-9; a += 5) {
    if (Math.hypot(i, j) > MAX + 1e-9) continue;
    const t = trial([n0[0] + i, n0[1] + j], f0 + a);
    if (t.c < best.c) best = t;
  }
  for (const [st, sa] of [[0.02, 2], [0.01, 1]]) {
    let imp = true;
    while (imp) {
      imp = false;
      const b = best;
      for (const [di, dj, da] of [[st, 0, 0], [-st, 0, 0], [0, st, 0], [0, -st, 0], [0, 0, sa], [0, 0, -sa]]) {
        const n = [b.n[0] + di, b.n[1] + dj], f = b.f + da;
        if (Math.hypot(n[0] - n0[0], n[1] - n0[1]) > MAX + 1e-9 || Math.abs(f - f0) > YAW + 1e-9) continue;
        const t = trial(n, f);
        if (t.c < best.c - 1e-12) { best = t; imp = true; }
      }
    }
  }
  const brief = (res) => res.checks.map((k) => k.class === 'stance_soles' ? `stance ${k.median}` : (k.class === 'site_inside' || k.class === 'head_inside') ? `${k.class} ${k.depth}` : k.class === 'contact' ? `${k.site} ${k.gap_q}/${k.pen_q}` : null).filter(Boolean).join(', ') + (res.fails.length ? ` | FAILS ${res.fails.map((f) => f.class).join(',')}` : '');
  console.log(`${id}: now [${n0}] f${f0} cost ${r3(before.c)}: ${brief(before.res)}\n   -> --at ${r2(best.n[0])},${r2(best.n[1])},${Math.round(best.f)} (moved ${r2(best.mv)} m, crowd ${r3(best.crowd)}) cost ${r3(best.c)}: ${brief(best.res)}`);
}
