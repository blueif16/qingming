#!/usr/bin/env node
// Contact solve: move a figure (root offset and yaw) so that what its action touches is touched, as numbers
// (gen/details/brief_contacts_fix.md, fix step 2; the standard: gen/details/contacts/fix_standard.md).
// For each figure, the placement (people.json nudge, facing_deg) that minimises its contact cost over the whole cycle:
//   cost = sum over its contacts (characters/contacts.json, judged as tools/contact_check.mjs judges them) of the
//          squared excess of the hold-quantile gap over gap_m and of the penetration under -pen_m (and, while it
//          fails, a little of the worst sample's excess, so the whole cycle is pulled in), soft rules at half weight
//        + 20 x (standing on furniture, a hidden collider or below its support)^2
//        + 10 x (body cylinder overlap past the warning, site or head inside geometry, a stance foot in a wall)^2
//        + 10 x (overlap with another figure's body, or a figure's root within 0.15 m of an animal's body)^2
//        + 2e-4 x move^2 + 1e-7 x turn_deg^2 (among placements that do it, the least move)
// searched on a disk round the casting's spot (painted spot + the casting's own nudge; radius --max, default 0.6 m)
// and turns of +-(--yaw, default 30) degrees: a 0.1 m / 10 deg grid, then a pattern search down to 1 cm / 1 deg. The
// placement is predicted exactly as people.js places it (tools/place_predict.mjs: the ground hook on the page's
// collider), so no page load is needed while solving; confirm with a dump afterwards.
//   node tools/contact_solve.mjs <section> <figure id ...|--failing> [--max 0.6] [--yaw 30] [--no-yaw] [--write]
//        [--only-contacts] [--why "<text>"] [--note "<text>"] [--at dX,dD,facing] [--json out] [--engine proposed]
//        [--base-clips] [--root-h]
//   --root-h    set people.json root_h for a figure a hidden collider holds above its visible floor (no x/y search)
//   --at        evaluate (and with --write record) that placement instead of searching
//   --failing   every figure of the section with a contact, furniture, body or placement FAIL (not the clip-level ones)
//   --write     record each solved figure in sections/<section>/contact_fixes.json (applied by the section's casting
//               script through tools/contact_fixes.py, which writes people.json nudge / facing_deg and nudge_why)
import fs from 'node:fs';
import path from 'node:path';
import { QM } from './lib/owners_index.mjs';
import { setup, checkPerson } from './contact_check.mjs';
import { predictDump } from './place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
const section = args[0];
const MAX = +opt('--max', 0.6), YAW = flag('--no-yaw') ? 0 : +opt('--yaw', 30), MARGIN = +opt('--margin', 0.005);
const deg = (d) => (d * Math.PI) / 180;
const r3 = (x) => Math.round(x * 1000) / 1000;
const r2 = (x) => Math.round(x * 100) / 100;

// --engine proposed: solve for the page as the details pass's engine patches would draw it (tools/contact_check.mjs)
let ctx = setup({ engine: opt('--engine', 'page') });
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const { pred } = ctx;
const people = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
const fixesFile = path.join(QM, `sections/${section}/contact_fixes.json`);
const fixes = fs.existsSync(fixesFile) ? JSON.parse(fs.readFileSync(fixesFile, 'utf8')) : { figures: {} };

const SOLVABLE = /^(contact:|furniture|hidden_collider|below_support|body_cylinder|site_inside|head_inside|stance_soles)/;
const solvable = (f) => SOLVABLE.test(f.class) && f.cause !== 'clip';
let ids = args.slice(1).filter((a) => !a.startsWith('--') && !Number.isFinite(+a) && ![opt('--why'), opt('--at'), opt('--note'), opt('--json'), opt('--engine'), opt('--margin')].includes(a));
const recs = new Map(ctx.dump.people.filter((p) => p.section === section).map((p) => [p.id, p]));
if (flag('--failing')) ids = [...recs.values()].filter((p) => p.kind === 'figure').filter((p) => checkPerson(p).fails.some(solvable)).map((p) => p.id);

// the cost of a check result (see the header)
function cost(res, move, turn, { onlyContacts = false } = {}) {
  let c = 0;
  const terms = [];
  for (const k of res.checks) {
    if (k.class !== 'contact' || !(k.status === 'PASS' || k.status === 'FAIL')) continue;
    const w = k.soft ? 0.5 : 1;
    // aimed MARGIN inside the tolerances, so a solution doesn't sit on the edge (the page's dump differs from the
    // prediction by a few mm of quantisation: a solve at 0.030 read 0.031 on the page)
    const ex = Math.max(0, k.gap_q - (k.gap_m - MARGIN)) + Math.max(0, -(k.pen_m - MARGIN) - k.pen_q);
    const worst = ex > 0 ? Math.max(0, k.max - k.gap_m - 0.05) : 0; // pulls a failing contact's whole cycle in
    c += w * (ex * ex + 0.1 * worst * worst);
    terms.push(`${k.clip}:${k.site} ${r3(k.gap_q)}/${r3(k.pen_q)}`);
  }
  if (!onlyContacts) {
    for (const f of res.fails) {
      if (/^(furniture|hidden_collider|below_support)$/.test(f.class)) c += 20 * f.value * f.value + 1;
      else if (f.class === 'body_cylinder') c += 10 * f.value * f.value;
      else if (/^(site_inside|head_inside)$/.test(f.class)) c += 10 * f.value * f.value;
      else if (f.class === 'stance_soles' && f.cause === 'placement') c += 10 * f.value * f.value;
    }
    const bc = res.checks.find((k) => k.class === 'body_cylinder');
    if (bc && bc.overlap > 0.03) c += 10 * (bc.overlap - 0.03) ** 2;
  }
  return c + 2e-4 * move * move + 1e-7 * turn * turn;
}

// the other people and the animals, as the casting checks them (gen/sections/<s>/make_people.py): another figure's
// body closer than 0.23 m x (the two scales) to this one's, a figure's root within 0.15 m of an animal's real-size body
const ANI = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/animals/animals.json'), 'utf8'));
function crowdCost(rec, X, D) {
  let c = 0;
  const sc = people.figures[rec.id]?.scale || 1;
  for (const o of ctx.dump.people) {
    if (o.section !== section || o.id === rec.id) continue;
    const ox = o.root[0], od = -o.root[2];
    if (o.kind === 'figure') {
      const os = people.figures[o.id]?.scale || 1;
      if (people.figures[o.id]?.carried_by === rec.id || people.figures[rec.id]?.carried_by === o.id) continue;
      const need = 0.23 * (sc + os), d = Math.hypot(X - ox, D - od);
      if (d < need) c += 10 * (need - d) ** 2;
    } else if (o.kind === 'animal' && (o.root[1] - rec.root[1]) < 1) {
      const info = ANI[o.model] || {};
      const k = o.scale || 1, hl = ((info.length_m || 0.3) * k) / 2, hw = ((o.loads || []).some((l) => /pannier/.test(l)) ? 0.4 : ((info.width_m || 0.12) * k) / 2);
      const a = o.yaw - Math.PI / 2, f = [Math.cos(a), Math.sin(a)];
      const u = (X - ox) * f[0] + (D - od) * f[1], v = -(X - ox) * f[1] + (D - od) * f[0];
      const du = Math.abs(u) - hl, dv = Math.abs(v) - hw;
      const dist = du > 0 || dv > 0 ? Math.hypot(Math.max(du, 0), Math.max(dv, 0)) : Math.max(du, dv);
      if (dist < 0.15) c += 10 * (0.15 - dist) ** 2;
    }
  }
  return c;
}

function trial(rec, spec, base, nudge, facing) {
  const q = pred.figure(rec.map, { ...spec, nudge, facing_deg: facing });
  const r = { ...rec, root: [q.X, q.H, -q.D], yaw: q.yaw, on: q.owner };
  const res = checkPerson(r);
  const move = Math.hypot(nudge[0] - base.nudge[0], nudge[1] - base.nudge[1]);
  const crowd = crowdCost(rec, q.X, q.D);
  return { nudge, facing, res, move, crowd, turn: facing - base.facing, c: cost(res, move, facing - base.facing, { onlyContacts: flag('--only-contacts') }) + crowd };
}

const summary = (res) => res.fails.map((f) => `${f.class}${f.cause ? `(${f.cause})` : ''}${f.site ? ' ' + f.site : ''} ${f.value}`).join('; ') || 'PASS';
const contactLine = (res) => res.checks.filter((k) => k.class === 'contact' && k.max !== undefined).map((k) => `${k.clip}:${k.site}->${(k.with || []).join('+') || '-'} q${r3(k.gap_q)}/${r3(k.pen_q)} ${k.status}`).join('; ');

const out = [];
for (const id of ids) {
  const rec = recs.get(id);
  if (!rec || rec.kind !== 'figure') { console.log(`${id}: not a static figure of ${section}`); continue; }
  const spec = people.figures[id];
  // --base-clips: solve with the base clip of any IK variant in the cycle ("<clip>~<variant>" -> "<clip>"): a variant's
  // targets hold only at the placement it was made for, so a new placement is solved on the clip itself, then the
  // variant is remade there (tools/ik_targets.mjs)
  if (flag('--base-clips')) { rec.do = (rec.do || spec.do).map(([c, t]) => [c.split('~')[0], t]); }
  const prev = fixes.figures[id];
  // the casting's own placement (before any contact fix): the solve is measured from it, so a rerun is idempotent
  const base = { nudge: prev?.base_nudge || spec.nudge || [0, 0], facing: prev?.base_facing ?? spec.facing_deg ?? rec.map.facing_deg ?? 0 };
  const t0 = Date.now();
  // --root-h: a figure held up by a hidden collider over what it is seen standing on (the Rainbow Bridge's smooth walk
  // ramp over its stepped deck) gets people.json root_h, the visible surface's height under it (people.js P2): first the
  // visible surface under the root, then (standing) moved by the median stance-sole gap so its feet are on the treads
  if (flag('--root-h')) {
    const cur = { nudge: spec.nudge || [0, 0], facing: spec.facing_deg ?? rec.map.facing_deg ?? 0 };
    const at = (h) => { const q = pred.figure(rec.map, { ...spec, root_h: h }); return checkPerson({ ...rec, root: [q.X, q.H, -q.D], yaw: q.yaw, root_h: h }); };
    const r0 = at(undefined);
    const sup = r0.checks.find((k) => k.class === 'support');
    const h0 = rec.root[1] - (sup?.raise ?? 0);
    const st = at(h0).checks.find((k) => k.class === 'stance_soles');
    // written only when it clears the hidden collider and leaves the figure's other checks no worse (a stance across two
    // treads, or a seat, can lose more than it gains: those need a placement solve or a builder fix); the feet's median
    // first, else the root on the visible surface under it
    const score = (r) => r.fails.filter((f) => f.class !== 'hidden_collider').reduce((a, f) => a + Math.abs(f.value || 0), 0);
    const worse = (r) => r.fails.some((f) => f.class !== 'hidden_collider' && Math.abs(f.value || 0) > 0.02 + Math.abs(r0.fails.find((g) => g.class === f.class && g.site === f.site && g.clip === f.clip)?.value || 0));
    const okOf = (r) => !r.fails.some((f) => /^(hidden_collider|furniture|below_support|order)$/.test(f.class)) && score(r) <= score(r0) + 0.01 && !worse(r);
    // a seated figure: its seat point onto its seat (1 cm over it), not its feet onto the steps
    const seat = at(h0).checks.find((k) => k.class === 'contact' && k.site === 'seat' && k.target === 'seat' && Number.isFinite(k.mean));
    let h = seat ? h0 - (seat.mean - 0.01) : st && Number.isFinite(st.median) ? h0 - st.median : h0;
    let r1 = at(h);
    if (!okOf(r1) && h !== h0) { const r2 = at(h0); if (okOf(r2)) { h = h0; r1 = r2; } }
    const ok = okOf(r1);
    console.log(`${id}: root_h ${r3(h)} (was ${r3(rec.root[1])} on ${sup?.on}); before: ${summary(r0)}; after: ${summary(r1)}`);
    if (flag('--write') && ok) {
      fixes.figures[id] = { ...(fixes.figures[id] || {}), class: fixes.figures[id]?.class || 'solve', root_h: r3(h),
        nudge_why: `solved: root_h ${r3(h)}: stood on ${sup?.on}'s hidden walk ramp ${r3(sup?.raise)} m over the visible steps; now on the visible surface under it${st ? ` (its stance soles' median gap ${r3(st.median)} taken up)` : ''} (people.js root_h)`,
        ...(spec.nudge ? { nudge: spec.nudge } : {}), ...(spec.facing_deg !== undefined ? { facing_deg: spec.facing_deg } : {}) };
    }
    out.push({ id, root_h: r3(h), pass: ok, before: summary(r0), after: summary(r1) });
    continue;
  }
  const before = trial(rec, spec, base, base.nudge, base.facing);
  let best = before;
  // --at dX,dD,facing: evaluate that placement only (no search)
  const at = opt('--at') ? opt('--at').split(',').map(Number) : null;
  if (at) best = trial(rec, spec, base, [at[0], at[1]], at[2]);
  const consider = (n, f) => {
    if (Math.hypot(n[0] - base.nudge[0], n[1] - base.nudge[1]) > MAX + 1e-9 || Math.abs(f - base.facing) > YAW + 1e-9) return;
    const t = trial(rec, spec, base, n, f);
    if (t.c < best.c - 1e-12) best = t;
  };
  // the grid
  if (!at) for (let i = -MAX; i <= MAX + 1e-9; i += 0.1) for (let j = -MAX; j <= MAX + 1e-9; j += 0.1)
    for (let a = -YAW; a <= YAW + 1e-9; a += YAW ? 10 : 1) consider([base.nudge[0] + i, base.nudge[1] + j], base.facing + a);
  // the pattern search round the best
  for (const [st, sa] of at ? [] : [[0.05, 5], [0.02, 2], [0.01, 1]]) {
    let improved = true;
    while (improved) {
      improved = false;
      const c0 = best.c, b = best;
      for (const [di, dj, da] of [[st, 0, 0], [-st, 0, 0], [0, st, 0], [0, -st, 0], [0, 0, sa], [0, 0, -sa], [st, st, 0], [st, -st, 0], [-st, st, 0], [-st, -st, 0]]) {
        if (da && !YAW) continue;
        consider([b.nudge[0] + di, b.nudge[1] + dj], b.facing + da);
      }
      if (best.c < c0 - 1e-12) improved = true;
    }
  }
  const after = best;
  const nudge = after.nudge.map(r2), facing = Math.round(after.facing);
  const ok = !after.res.fails.some(solvable) && after.crowd < 1e-6;
  const row = { id, model: rec.model, clips: (spec.do || []).map((d) => d[0]), base, nudge, facing_deg: facing, moved_m: r2(after.move), turned_deg: Math.round(after.turn),
    before: { cost: r3(before.c), fails: summary(before.res), contacts: contactLine(before.res) },
    after: { cost: r3(after.c), fails: summary(after.res) + (after.crowd > 1e-6 ? `; crowd ${r3(after.crowd)}` : ''), contacts: contactLine(after.res), on: after.res.checks.find((k) => k.class === 'support')?.on },
    pass: ok, seconds: (Date.now() - t0) / 1000 };
  out.push(row);
  console.log(`\n${id} (${rec.model}: ${row.clips.join(', ')})  ${ok ? 'PASS' : 'still FAILs'}  moved ${row.moved_m} m, turned ${row.turned_deg} deg  (${row.seconds.toFixed(1)} s)`);
  console.log(`  before  nudge ${JSON.stringify(base.nudge)} facing ${base.facing}: ${row.before.fails}\n          ${row.before.contacts}`);
  console.log(`  after   nudge ${JSON.stringify(nudge)} facing ${facing}: ${row.after.fails}\n          ${row.after.contacts}`);
  if (flag('--write')) {
    const changed = Math.hypot(nudge[0] - base.nudge[0], nudge[1] - base.nudge[1]) > 0.005 || facing !== Math.round(base.facing);
    const contacts = after.res.checks.filter((k) => k.class === 'contact' && k.max !== undefined);
    const gapTxt = (res) => res.checks.filter((k) => k.class === 'contact' && k.max !== undefined).map((k) => `${k.site} ${r2(k.gap_q)}`).join(', ');
    const why = opt('--why') || `solved: contact ${[...new Set(contacts.map((k) => `${k.site}->${(k.with || []).join('+') || k.target}`))].join(', ') || 'none (placement checks)'}; gap before ${gapTxt(before.res) || '-'}, after ${gapTxt(after.res) || '-'}`
      + `${before.res.fails.length ? `; fixed ${before.res.fails.filter((f) => !after.res.fails.some((g) => g.class === f.class && g.site === f.site)).map((f) => f.class).join(', ') || 'nothing'}` : ''}`
      + `; moved ${row.moved_m} m${row.turned_deg ? `, turned ${row.turned_deg} deg` : ''} from the casting's spot (limit ${MAX} m)`;
    if (changed) {
      fixes.figures[id] = { ...(prev || {}), class: prev?.class || 'solve', base_nudge: base.nudge, base_facing: base.facing, nudge, facing_deg: facing,
        nudge_why: (opt('--why') ? why : why) + (opt('--note') ? `; ${opt('--note')}` : ''),
        solved: { date: new Date().toISOString().slice(0, 16), cost_before: row.before.cost, cost_after: row.after.cost, pass: ok } };
    }
  }
}
if (flag('--write')) {
  fixes.about = fixes.about || 'Contact fixes for this section (gen/details/contacts/fix_standard.md): per figure, what tools/contact_solve.mjs solved '
    + '(nudge, facing_deg: the root offset and yaw that put its contacts on what it touches, measured from the casting\'s own base_nudge / '
    + 'base_facing), or a recast (do, character) or a fit, with the reason. Applied last by the casting script through tools/contact_fixes.py.';
  fixes.limits = { max_move_m: MAX, max_turn_deg: YAW };
  fs.writeFileSync(fixesFile, JSON.stringify(fixes, null, 1) + '\n');
  console.log(`\nwrote ${path.relative(QM, fixesFile)}`);
}
const jo = opt('--json');
if (jo) fs.writeFileSync(path.resolve(QM, jo), JSON.stringify(out, null, 1));
