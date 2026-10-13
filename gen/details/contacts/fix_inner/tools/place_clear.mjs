#!/usr/bin/env node
// The least move that clears a seated figure's feet and body before its seat is built (fix-inner): like
// tools/contact_solve.mjs's search (same predictor, same checks) but the seat contact is left out of the cost, since
// the seat is fitted under the seat point afterwards (fig_seats.mjs, the builder). Prints the nudge and facing to record
// with `contact_solve.mjs <section> <id> --at dX,dD,f --write --note ...` once the seat stands.
//   node place_clear.mjs <section> <id ...> [--max 0.6] [--yaw 0]
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, checkPerson } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const section = args[0];
const ids = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--')));
const MAX = +opt('--max', 0.6), YAW = +opt('--yaw', 0);
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const people = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
const r2 = (x) => Math.round(x * 100) / 100;
const bad = (f) => !(f.class === 'contact:seat' || f.class === 'contact:seat (no seat)') && !(f.cause === 'clip');
for (const id of ids) {
  const rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
  const spec = people.figures[id];
  const n0 = spec.nudge || [0, 0], f0 = spec.facing_deg ?? rec.map.facing_deg ?? 0;
  let best = null;
  for (let i = -MAX; i <= MAX + 1e-9; i += 0.05) for (let j = -MAX; j <= MAX + 1e-9; j += 0.05) {
    const m = Math.hypot(i, j);
    if (m > MAX + 1e-9 || (best && m >= best.m)) continue;
    for (let a = -YAW; a <= YAW + 1e-9; a += 5) {
      const n = [n0[0] + i, n0[1] + j];
      const q = ctx.pred.figure(rec.map, { ...spec, nudge: n, facing_deg: f0 + a });
      const res = checkPerson({ ...rec, root: [q.X, q.H, -q.D], yaw: q.yaw, on: q.owner });
      // other figures' bodies: 0.23 m x scales apart
      const sc = spec.scale || 1;
      const crowd = ctx.dump.people.some((o) => o.section === section && o.kind === 'figure' && o.id !== id && Math.hypot(q.X - o.root[0], q.D + o.root[2]) < 0.23 * (sc + (people.figures[o.id]?.scale || 1)));
      if (!res.fails.some(bad) && !crowd) { best = { m, n: n.map(r2), f: Math.round(f0 + a), fails: res.fails.map((f) => `${f.class} ${f.site || ''} ${f.value}`) }; break; }
    }
  }
  console.log(id, best ? `clear at nudge ${JSON.stringify(best.n)} facing ${best.f} (moved ${r2(best.m)} m); left: ${best.fails.join('; ') || 'none'}` : `nothing clear within ${MAX} m`);
}
