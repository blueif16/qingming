#!/usr/bin/env node
// Crew solve (fix-boats, details pass): move a boat crew member within its boat (people.json nudge in the map frame,
// which boats.js host() carries into the boat's frame from the painted spot, and facing_deg) so that its boat checks
// pass (tools/contact_check.mjs: the crew rules, deck_support, head_through, boat_body, pole_through), as
// tools/contact_solve.mjs does for figures on the ground. Each trial is placed by crewSpot (boats.js host in node) from
// the current sections/<s>/people.json and judged at the dump instant; the best is then judged at every frozen time.
//   node tools/crew_solve.mjs <section> <ids...> [--placements file] [--max 0.6] [--yaw 30] [--step 0.1]
//        [--at dX,dD,facing] [--write] [--why "<text>"] [--note "<text>"]
//   cost = sum over its FAILs of (value)^2 (head_through / pole_through fractions x 0.25; a FAIL without a value 1)
//        + 2e-4 x move^2 + 1e-7 x turn^2; sweep and oar crew stand at their bar (no nudge): judged only
//   --write: into sections/<section>/contact_fixes.json (class "solve", base_nudge / base_facing = the casting's),
//            under flock /tmp/qingming_contact_fixes.lock by the caller (tools/crew_fixes.sh)
import fs from 'node:fs';
import path from 'node:path';
import { QM } from './lib/owners_index.mjs';
import { setup, checkPerson } from './contact_check.mjs';
import { predictCrewDump } from './place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
const section = args[0];
const MAX = +opt('--max', 0.6), YAW = +opt('--yaw', 30), STEP = +opt('--step', 0.1);
const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
const optVals = new Set(['--placements', '--max', '--yaw', '--step', '--at', '--why', '--note'].map((k) => opt(k)).filter(Boolean));
const ids = args.slice(1).filter((a) => !a.startsWith('--') && !optVals.has(a));

const dump = JSON.parse(fs.readFileSync(path.resolve(QM, opt('--placements', 'gen/details/contacts/fix_boats/placements_boats.json')), 'utf8'));
let ctx = setup({ placements: dump });
const bw = ctx.world.boats ? ctx.world : null;
const people = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
const fixesFile = path.join(QM, `sections/${section}/contact_fixes.json`);

function judge(rec, spec, only) {
  const pj = { ...people, figures: { ...people.figures, [rec.id]: spec } };
  const one = predictCrewDump({ ...dump, people: [rec] }, ctxWorld(), { sections: [section], specs: { [section]: pj } }).people[0];
  return checkPerson({ ...one, _only_dump: only });
}
function ctxWorld() { return ctx.boatWorld; }
function cost(res, move, turn) {
  let c = 0;
  for (const f of res.fails) {
    if (f.cause === 'clip') continue;
    const v = f.value === null || f.value === undefined ? 1 : Math.abs(f.value) * (/through/.test(f.class) ? 0.5 : 1);
    c += v * v;
  }
  return c + 2e-4 * move * move + 1e-7 * turn * turn;
}
const out = [];
for (const id of ids) {
  const rec = dump.people.find((p) => p.section === section && p.id === id);
  if (!rec || rec.kind !== 'crew') { console.log(`${id}: not a crew record of ${section}`); continue; }
  const spec0 = people.figures[id] || {};
  const base = spec0.nudge || [0, 0], f0 = spec0.facing_deg ?? rec.map?.facing_deg ?? 0;
  const at = opt('--at') ? opt('--at').split(',').map(Number) : null;
  const trial = (dx, dd, df, only = true) => {
    const spec = { ...spec0, nudge: [r2(base[0] + dx), r2(base[1] + dd)], facing_deg: Math.round(f0 + df) };
    const res = judge(rec, spec, only);
    return { dx, dd, df, spec, res, c: cost(res, Math.hypot(dx, dd), df) };
  };
  const t0 = Date.now();
  const start = trial(0, 0, 0);
  let best = start;
  const seen = [start];
  if (at) best = trial(at[0] - base[0], at[1] - base[1], at[2] - f0);
  else if (start.res.fails.length) {
    const yaws = YAW ? [0, -YAW, -YAW / 2, YAW / 2, YAW] : [0];
    for (let dx = -MAX; dx <= MAX + 1e-9; dx += STEP) for (let dd = -MAX; dd <= MAX + 1e-9; dd += STEP) {
      if (Math.hypot(dx, dd) > MAX + 1e-9) continue;
      for (const df of yaws) { const t = trial(r2(dx), r2(dd), df); seen.push(t); if (t.c < best.c) best = t; }
    }
    // pattern search
    for (const s of [0.05, 0.02, 0.01]) {
      let moved = true;
      while (moved) {
        moved = false;
        for (const [a, b, d] of [[s, 0, 0], [-s, 0, 0], [0, s, 0], [0, -s, 0], [0, 0, 5], [0, 0, -5]]) {
          const dx = r2(best.dx + a), dd = r2(best.dd + b), df = best.df + d;
          if (Math.hypot(dx, dd) > MAX + 1e-9 || Math.abs(df) > YAW) continue;
          const t = trial(dx, dd, df);
          seen.push(t);
          if (t.c < best.c - 1e-9) { best = t; moved = true; }
        }
      }
    }
  }
  // the dump instant decided the search; every frozen time decides the pick: the cheapest of the 20 best trials whose
  // full judgement (all instants) is cheapest, so a spot on the edge of a FAIL at some instants is not taken
  let full = judge(rec, best.spec, false);
  if (!at && full.fails.length) {
    let pick = { t: best, full, c: cost(full, Math.hypot(best.dx, best.dd), best.df) };
    const cand = seen.sort((a, b) => a.c - b.c).filter((t, i, arr) => arr.findIndex((u) => u.dx === t.dx && u.dd === t.dd && u.df === t.df) === i).slice(0, 20);
    for (const t of cand) {
      const fj = judge(rec, t.spec, false), c = cost(fj, Math.hypot(t.dx, t.dd), t.df);
      if (c < pick.c - 1e-9) pick = { t, full: fj, c };
      if (!fj.fails.length) break;
    }
    best = pick.t; full = pick.full;
  }
  const before = judge(rec, spec0, false);
  const row = { id, before: before.fails.map((f) => `${f.class}${f.site ? ':' + f.site : ''}=${f.value}`), nudge: best.spec.nudge, facing_deg: best.spec.facing_deg,
    move_m: r3(Math.hypot(best.dx, best.dd)), turn_deg: best.df,
    stands_on: (() => { const k = full.checks.find((c) => c.class === 'deck_support'); return k ? `${k.mat} (${k.on?.split('|')[1]}) ${k.raise}` : null; })(), after: full.fails.map((f) => `${f.class}${f.site ? ':' + f.site : ''}=${f.value}@${(f.at || []).length}`), seconds: (Date.now() - t0) / 1000 };
  out.push(row);
  console.log(JSON.stringify(row));
  if (flag('--write') && (best.dx || best.dd || best.df || at)) {
    const fx = fs.existsSync(fixesFile) ? JSON.parse(fs.readFileSync(fixesFile, 'utf8')) : { figures: {} };
    const prev = fx.figures[id] || {};
    fx.figures[id] = { ...prev, class: prev.class && prev.class !== 'solve' ? prev.class : 'solve', nudge: best.spec.nudge, facing_deg: best.spec.facing_deg,
      base_nudge: prev.base_nudge || base, base_facing: prev.base_facing ?? f0,
      nudge_why: `${opt('--why') || 'solved on its boat (tools/crew_solve.mjs, fix-boats)'}: moved ${row.move_m} m, turned ${best.df} deg in the boat's frame; ${full.fails.length ? `still ${row.after.join(', ')}` : 'every boat check passes at every frozen time'}${opt('--note') ? ` (${opt('--note')})` : ''}` };
    fs.writeFileSync(fixesFile, JSON.stringify(fx, null, 1) + '\n');
    console.log(`  -> ${path.relative(QM, fixesFile)}`);
  }
}
