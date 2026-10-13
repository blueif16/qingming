#!/usr/bin/env node
// Deck solve (fix-bridge, details pass): tools/contact_solve.mjs for figures standing on the Rainbow Bridge's stepped
// deck, where the walkable surface is a smooth hidden ramp and the visible treads are nocol (fix_standard.md rule 6).
// contact_solve searches nudge and facing with the root on the ground hook (the hidden ramp); --root-h then drops the
// root onto the tread under it, which moves every contact the solve had just made (a rail 6-16 cm higher against the
// body). Here every trial placement is judged with its root already on the visible tread under its feet:
//   root_h = the trial's ramp height + max over the two soles (median over the stance clip) of
//            (the visible surface under the sole, 5 points 5 cm round it as contact_check reads it - the sole's height)
// so neither sole sinks into a tread; a stance across two treads (the soles' treads differ by more than 2 cm) costs
// 20 x the difference squared. The cost is contact_solve's (contacts' squared excess with a 5 mm margin, furniture /
// hidden collider x20, body / site / foot x10, other figures and animals' bodies x10, move 2e-4, turn 1e-7).
//   node deck_solve.mjs <section> <ids...> [--max 0.6] [--yaw 30] [--no-yaw] [--at dX,dD,facing] [--clip <stance clip>]
//        [--do clip:s,clip:s] [--write] [--note "<text>"] [--flat]
//   --flat   the root stays on the ground hook (no root_h), as contact_solve: for figures off the deck
//   --do     judge (and with --write record) this cycle instead of people.json's: a recast solved in one go
//   --write  records nudge, facing_deg, root_h (and do) in sections/<section>/contact_fixes.json with base_nudge /
//            base_facing (the casting's, so reruns start from the same spot) and the reason in nudge_why
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, checkPerson, siteTrack } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
const section = args[0];
const MAX = +opt('--max', 0.6), YAW = flag('--no-yaw') ? 0 : +opt('--yaw', 30), MARGIN = 0.005;
const FLAT = flag('--flat');
// --skip seat,sole_L: contacts left out of the cost (a stool the seat fit moves under the seat point afterwards)
const SKIP = new Set((opt('--skip') || '').split(',').filter(Boolean));
const r3 = (x) => Math.round(x * 1000) / 1000;
const r2 = (x) => Math.round(x * 100) / 100;

let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const { pred, world } = ctx;
const people = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
const fixesFile = path.join(QM, `sections/${section}/contact_fixes.json`);
const fixes = fs.existsSync(fixesFile) ? JSON.parse(fs.readFileSync(fixesFile, 'utf8')) : { figures: {} };
const valued = new Set(['--max', '--yaw', '--at', '--clip', '--do', '--note', '--skip', '--rail-dist', '--seat-over']);
const ids = args.slice(1).filter((a, i) => !a.startsWith('--') && !valued.has(args[i]));
const recs = new Map(ctx.dump.people.filter((p) => p.section === section).map((p) => [p.id, p]));

// the visible surfaces (contact_check fVisibleAny): not hidden, not an edge wall, not water
const oName = (t) => world.owners[world.owner[t]];
const fVis = (t) => !world.hiddenMat[world.mat[t]] && !oName(t).includes('|edge:') && !oName(t).endsWith('|water') && !/\.water\./.test(oName(t));
function under(X, D, H, up) {
  let best = null;
  for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) {
    for (const v of world.vertical(X + dx, D + dd, fVis)) if (v.h <= H + up && (!best || v.h > best.h)) best = v;
  }
  return best ? best.h : null;
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

function cost(res, move, turn) {
  let c = 0;
  for (const k of res.checks) {
    if (k.class !== 'contact' || !(k.status === 'PASS' || k.status === 'FAIL') || SKIP.has(k.site)) continue;
    const w = k.soft ? 0.5 : 1;
    const ex = Math.max(0, k.gap_q - (k.gap_m - MARGIN)) + Math.max(0, -(k.pen_m - MARGIN) - k.pen_q);
    const worst = ex > 0 ? Math.max(0, k.max - k.gap_m - 0.05) : 0;
    c += w * (ex * ex + 0.1 * worst * worst);
  }
  for (const f of res.fails) {
    if (/^(furniture|hidden_collider|below_support)$/.test(f.class)) c += 20 * f.value * f.value + 1;
    else if (f.class === 'body_cylinder') c += 10 * f.value * f.value;
    else if (/^(site_inside|head_inside)$/.test(f.class)) c += 10 * f.value * f.value;
    else if (f.class === 'stance_soles' && f.cause === 'placement') c += 10 * f.value * f.value;
  }
  const bc = res.checks.find((k) => k.class === 'body_cylinder');
  if (bc && bc.overlap > 0.03) c += 10 * (bc.overlap - 0.03) ** 2;
  return c + 2e-4 * move * move + 1e-7 * turn * turn;
}
const ANI = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/animals/animals.json'), 'utf8'));
function crowdCost(rec, X, D, H) {
  let c = 0;
  const sc = people.figures[rec.id]?.scale || 1;
  for (const o of ctx.dump.people) {
    if (o.section !== section || o.id === rec.id) continue;
    if (Math.abs(o.root[1] - H) > 1.2) continue;
    const ox = o.root[0], od = -o.root[2];
    if (o.kind === 'figure') {
      const os = people.figures[o.id]?.scale || 1;
      if (people.figures[o.id]?.carried_by === rec.id || people.figures[rec.id]?.carried_by === o.id) continue;
      const need = 0.23 * (sc + os), d = Math.hypot(X - ox, D - od);
      if (d < need) c += 10 * (need - d) ** 2;
    } else if (o.kind === 'animal') {
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

// --leg: the root on the LOWER of the two soles' treads; the other foot, a riser higher (the ramps' treads are 0.30-0.38
// m deep and up to 0.33 m apart in height, a standing stance 0.2-0.3 m wide along the deck), is raised onto its tread by
// a leg-IK op in the figure's variant afterwards (fix_bridge/tools/rail_ik.mjs --feet): its sinking is not costed, the
// split a little (2 x split^2). Without --leg the root is on the higher tread (no sole sinks; the other hangs).
const LEG = flag('--leg');
// --rail-dist lo,hi: the root kept lo..hi m from the bridge's nearest railing line (its hidden railing wall), 50 x the
// excess squared: a figure with its hands on the rail stands where its arms reach it (the casting's 0.36 m)
const RAIL = opt('--rail-dist') ? opt('--rail-dist').split(',').map(Number) : null;
const TT = world.T;
const nzOf = (t) => {
  const o = t * 9, ux = TT[o + 3] - TT[o], uy = TT[o + 4] - TT[o + 1], uz = TT[o + 5] - TT[o + 2], vx = TT[o + 6] - TT[o], vy = TT[o + 7] - TT[o + 1], vz = TT[o + 8] - TT[o + 2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  return n[2] / (Math.hypot(...n) || 1);
};
const railWall = (t) => oName(t) === 'S3.str.rainbow_bridge' && world.hiddenMat[world.mat[t]] && Math.abs(nzOf(t)) < 0.2;
function railDist(X, D, H) { const n = world.nearest([X, D, H + 0.5], 1.5, railWall); return n ? Math.hypot(n.q[0] - X, n.q[1] - D) : 9; }
function place(rec, spec, nudge, facing, doSteps, stanceClip) {
  const q = pred.figure(rec.map, { ...spec, root_h: undefined, nudge, facing_deg: facing });
  let r = { ...rec, root: [q.X, q.H, -q.D], yaw: q.yaw, do: doSteps, root_h: null };
  let split = 0, raised = null;
  if (!FLAT) {
    const per = [];
    for (const s of ['sole_L', 'sole_R']) {
      const tr = siteTrack(r, stanceClip, s);
      if (!tr) continue;
      const p = [med(tr.map((x) => x[0])), med(tr.map((x) => x[1])), med(tr.map((x) => x[2]))];
      // within 0.45 m up: on a 30 deg ramp a sole 0.35 m along the deck from the root lies up to a riser and a half off
      // the smooth ramp the root was grounded on
      let h = null;
      // the highest of 5 points 5 cm round the sole (as contact_check reads a foot: a sole over a riser rests on the higher tread), within 0.3 m down and 0.45 m up
      for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) for (const v of world.vertical(p[0] + dx, p[1] + dd, fVis)) if (v.h <= p[2] + 0.45 && v.h >= p[2] - 0.3 && (h === null || v.h > h)) h = v.h;
      if (h === null) h = under(p[0], p[1], p[2], 0.25);
      if (h === null) continue;
      per.push({ s, dz: h - p[2], top: h });
    }
    if (per.length) {
      const dzs = per.map((x) => x.dz);
      // --leg: the root on the lower tread's top itself (both soles are then pinned onto their treads by leg ops: the
      // lower at y 0, so the variant's own sole_m (clip_ground: a standing clip's lower sole on the ground) stays its
      // base's)
      const H = r3(LEG ? Math.min(...per.map((x) => x.top)) : q.H + Math.max(...dzs));
      r = { ...r, root: [q.X, H, -q.D], root_h: H };
      if (per.length === 2) {
        split = Math.abs(per[0].top - per[1].top);
        if (LEG && split > 0.02) raised = (per[0].top > per[1].top ? per[0] : per[1]).s;
      }
    }
  }
  return { r, split, raised };
}

function trial(rec, spec, base, nudge, facing, doSteps, stanceClip) {
  const { r, split, raised } = place(rec, spec, nudge, facing, doSteps, stanceClip);
  let res = checkPerson(r);
  if (raised) {   // what the leg op will fix: the raised sole's floor contact and the stance (judged on the variant later)
    res = { ...res, checks: res.checks.filter((k) => !(k.class === 'contact' && k.site === raised) && k.class !== 'stance_soles'),
      fails: res.fails.filter((f) => !(f.class === 'contact:floor' && f.site === raised) && f.class !== 'stance_soles') };
  }
  const move = Math.hypot(nudge[0] - base.nudge[0], nudge[1] - base.nudge[1]);
  const crowd = crowdCost(rec, r.root[0], -r.root[2], r.root[1]);
  const sp = split > 0.02 ? (LEG ? (split > 0.4 ? 20 : 2) : 20) * split * split : 0;
  // --seat-over <owner>: a mapped seat whose height the builder fits afterwards (props_table): only the seat point's
  // being over it in plan is costed (its height is free)
  let so = 0;
  if (opt('--seat-over')) {
    const oid = world.ownerId.get(opt('--seat-over'));
    const sc = (doSteps || [['idle']]).map(([c]) => c)[0];
    const tr = siteTrack(r, sc, 'seat');
    if (tr && oid !== undefined) {
      const p = [med(tr.map((x) => x[0])), med(tr.map((x) => x[1])), med(tr.map((x) => x[2]))];
      const over = world.vertical(p[0], p[1], (t) => world.owner[t] === oid).length > 0;
      if (!over) { const n = world.nearest([p[0], p[1], p[2] - 0.3], 1.0, (t) => world.owner[t] === oid); so = 1 + 50 * ((n ? n.d : 1) ** 2); }
    }
  }
  let rc = 0, rd = null;
  if (RAIL) { rd = railDist(r.root[0], -r.root[2], r.root[1]); rc = 50 * (Math.max(0, RAIL[0] - rd) + Math.max(0, rd - RAIL[1])) ** 2; }
  return { nudge, facing, res, r, split, raised, move, crowd, rd, turn: facing - base.facing, c: cost(res, move, facing - base.facing) + crowd + sp + rc + so };
}
const summary = (res) => res.fails.map((f) => `${f.class}${f.cause ? `(${f.cause})` : ''}${f.site ? ' ' + f.site : ''} ${f.value}`).join('; ') || 'PASS';
const contactLine = (res) => res.checks.filter((k) => k.class === 'contact' && k.max !== undefined).map((k) => `${k.clip}:${k.site}->${(k.with || []).join('+') || '-'} q${r3(k.gap_q)}/${r3(k.pen_q)} ${k.status}`).join('; ');

for (const id of ids) {
  const rec = recs.get(id);
  if (!rec || rec.kind !== 'figure') { console.log(`${id}: not a static figure of ${section}`); continue; }
  const spec = people.figures[id];
  const prev = fixes.figures[id];
  const base = { nudge: prev?.base_nudge || spec.nudge || [0, 0], facing: prev?.base_facing ?? spec.facing_deg ?? rec.map.facing_deg ?? 0 };
  const doSteps = opt('--do') ? opt('--do').split(',').map((x) => { const [c, s] = x.split(':'); return [c, +s]; }) : spec.do;
  const stanceClip = opt('--clip') || (doSteps || [['idle']])[0][0];
  const t0 = Date.now();
  const before = trial(rec, spec, base, spec.nudge || [0, 0], spec.facing_deg ?? rec.map.facing_deg ?? 0, doSteps, stanceClip);
  let best = before;
  const consider = (n, f) => {
    if (Math.hypot(n[0] - base.nudge[0], n[1] - base.nudge[1]) > MAX + 1e-9 || Math.abs(f - base.facing) > YAW + 1e-9) return;
    const t = trial(rec, spec, base, n, f, doSteps, stanceClip);
    if (t.c < best.c - 1e-12) best = t;
  };
  const at = opt('--at') ? opt('--at').split(',').map(Number) : null;
  if (at) best = trial(rec, spec, base, [at[0], at[1]], at[2], doSteps, stanceClip);
  else {
    const g = MAX > 0.3 ? 0.1 : 0.05;
    for (let i = -MAX; i <= MAX + 1e-9; i += g) for (let j = -MAX; j <= MAX + 1e-9; j += g)
      for (let a = -YAW; a <= YAW + 1e-9; a += YAW ? 10 : 1) consider([base.nudge[0] + i, base.nudge[1] + j], base.facing + a);
    for (const [st, sa] of [[0.05, 5], [0.02, 2], [0.01, 1]]) {
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
  }
  const after = best;
  const nudge = after.nudge.map(r2), facing = Math.round(after.facing * 10) / 10;
  const solvable = (f) => /^(contact:|furniture|hidden_collider|below_support|body_cylinder|site_inside|head_inside|stance_soles)/.test(f.class) && f.cause !== 'clip';
  const ok = !after.res.fails.some((f) => solvable(f) && !SKIP.has(f.site)) && after.crowd < 1e-6 && (after.split <= 0.02 || !!after.raised);
  console.log(`\n${id} (${rec.model}: ${(doSteps || []).map((d) => d[0]).join(', ')})  ${ok ? 'PASS' : 'still FAILs'}  moved ${r2(after.move)} m, turned ${Math.round(after.turn)} deg  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  console.log(`  before  nudge ${JSON.stringify(spec.nudge || [0, 0])} facing ${spec.facing_deg ?? rec.map.facing_deg} root_h ${spec.root_h ?? '-'}: ${summary(before.res)}\n          ${contactLine(before.res)}`);
  console.log(`  after   nudge ${JSON.stringify(nudge)} facing ${facing} root_h ${after.r.root_h ?? '-'} (tread split ${r3(after.split)}${after.raised ? `: ${after.raised} to be raised by a leg op` : ''}, crowd ${r3(after.crowd)}${after.rd !== null && after.rd !== undefined ? `, rail ${r3(after.rd)} m` : ''}): ${summary(after.res)}\n          ${contactLine(after.res)}`);
  // later figures of this run see this one where it now stands (the crowd cost)
  Object.assign(rec, { root: after.r.root, yaw: after.r.yaw, root_h: after.r.root_h });
  if (flag('--write')) {
    const gapTxt = (res) => res.checks.filter((k) => k.class === 'contact' && k.max !== undefined).map((k) => `${k.site} ${r2(k.gap_q)}`).join(', ');
    const why = `solved${FLAT ? '' : ' on the stepped deck'} (fix_bridge/tools/deck_solve.mjs): ${gapTxt(after.res) ? `contacts ${gapTxt(after.res)} (before ${gapTxt(before.res) || '-'})` : 'placement checks'}`
      + `; moved ${r2(after.move)} m${Math.round(after.turn) ? `, turned ${Math.round(after.turn)} deg` : ''} from the casting's spot (limit ${MAX} m)`
      + (after.r.root_h !== null && after.r.root_h !== undefined ? (after.raised ? `; root_h ${after.r.root_h}: on the lower of the visible treads under its feet, not on the bridge's smooth hidden walk ramp (people.js root_h); its ${after.raised} raised ${r3(after.split)} m onto the tread above by a leg-IK op in its variant` : `; root_h ${after.r.root_h}: both soles on the visible tread under them, not on the bridge's smooth hidden walk ramp (people.js root_h)`) : '')
      + (opt('--note') ? `; ${opt('--note')}` : '');
    const e = { ...(prev || {}), class: prev?.class || 'solve', base_nudge: base.nudge, base_facing: base.facing, nudge, facing_deg: facing, nudge_why: why,
      solved: { date: new Date().toISOString().slice(0, 16), tool: 'deck_solve', cost_before: r3(before.c), cost_after: r3(after.c), pass: ok } };
    if (after.r.root_h !== null && after.r.root_h !== undefined) e.root_h = after.r.root_h; else delete e.root_h;
    if (opt('--do')) e.do = doSteps;
    fixes.figures[id] = e;
  }
}
if (flag('--write')) {
  fs.writeFileSync(fixesFile, JSON.stringify(fixes, null, 1) + '\n');
  console.log(`\nwrote ${path.relative(QM, fixesFile)}`);
}
