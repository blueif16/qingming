#!/usr/bin/env node
// IK targets from the built geometry: for a figure at its (solved) placement, where each contact site of one of its
// clips should be, as a target in the figure's root frame, written as an IK clip variant (tools/ik_clip.mjs,
// characters/ik_variants.json; the standard: gen/details/contacts/fix_standard.md step 4).
// Per site: its median place over the clip (map frame), the nearest point of what the clip's rule touches
// (tools/contact_check.mjs nearestTarget: the vehicle's pole or surface, the animal's posed mesh, the table top...)
// and the surface's normal there, turned into the root frame: a point target (that spot, `off` out along the normal:
// the hand rests there all through the clip), a plane target with --plane ({plane: {p, n}, off}: each frame the site
// is laid onto the plane, keeping its motion along it: a flat flank or a table top), or a line along a pole.
//   node tools/ik_targets.mjs <section> <figure> --clip <clip> [--sites palm_L,palm_R] [--off 0.012] [--name <variant>]
//        [--owner <map id>] [--engine proposed] [--write]
//   --level dz  only geometry within dz of the site's height (reach across into a heap, not down to its rim)
//   --owner  only that owner's geometry (a table, rail or wall the painting names, where something else is nearer)
//   --fade d0,d1 [--fade-sites a,b]  arm ops pinned only while the clip's own site is within d0 (fully) to d1 (not at
//            all) of the target: a hand the take lets go of keeps its gesture (tools/ik_clip.mjs fade, fix-inner)
//   --point-sites a,b  rod targets as their nearest surface point, not the axis line (a bent or tapered shaft)
//   --no-elbow-down  keep the clip's elbow side (carried onto the new line) even for a far reach
//   --up     soles (the leg op, fix-inner): how far over the sole a surface may be and still be the one it goes onto
//            (default 0.15); a sole site always takes the surface under it, height only ({y}), via leg
//   --write  adds the variant to characters/ik_variants.json, the clip "<clip>~<variant>": "ik:<clip>@<variant>" to
//            characters/<model>.json, and the figure's do (that clip -> the variant) to sections/<s>/contact_fixes.json;
//            then build the character (flock /tmp/qingming_charbuild.lock node tools/character.mjs <model> build),
//            rerun tools/joint_tracks.mjs (both engines) and check.
// The targets hold only for this placement: solve the placement first (tools/contact_solve.mjs --write), and redo
// the targets whenever it changes.
import fs from 'node:fs';
import path from 'node:path';
import { QM } from './lib/owners_index.mjs';
import { setup, ruleOf, nearestTarget, siteTrack, toRootFn } from './contact_check.mjs';
import { predictDump } from './place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [section, id] = args;
const clip = opt('--clip');
const engine = opt('--engine', 'proposed');
let ctx = setup({ engine });
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
if (!rec || !clip) { console.log('usage: ik_targets.mjs <section> <figure> --clip <clip> [...]'); process.exit(1); }
const rule = ruleOf(clip, clip);
const sites = opt('--sites') ? opt('--sites').split(',') : rule.contacts.map((c) => c.site);
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const toRoot = toRootFn(rec);
const ops = [];
const lines = [];
for (const site of sites) {
  const c = rule.contacts.find((x) => x.site === site) || rule.contacts[0];
  const trk = siteTrack(rec, clip, site);
  const via = /^(palm|forearm|elbow)_/.test(site) ? 'arm' : /^sole_/.test(site) ? 'leg' : 'hips';
  if (!trk) { console.log(`${rec.model} has no ${clip}`); process.exit(1); }
  const p = [0, 1, 2].map((k) => med(trk.map((q) => q[k])));
  // a sole (the leg op, tools/ik_clip.mjs via leg, fix-inner): onto the visible surface under it (the highest within
  // --up m over the sole, default 0.15: a footboard under a seated driver's hanging feet, a step), height only
  if (via === 'leg') {
    const W = ctx.world, up = +opt('--up', 0.15);
    const vis = (t) => !W.hiddenMat[W.mat[t]] && !/\|edge:|water/.test(W.owners[W.owner[t]]) && (!opt('--owner') || W.owners[W.owner[t]].endsWith(opt('--owner')));
    let best = null;
    for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) for (const v of W.vertical(p[0] + dx, p[1] + dd, vis)) if (v.h <= p[2] + up && (!best || v.h > best.h)) best = v;
    if (!best) { console.log(`${site}: no surface under it`); continue; }
    const y = r3(toRoot([p[0], p[1], best.h])[1] + +opt('--off', 0));
    ops.push({ site, via, to: { y } });
    lines.push(`${site}: median ${p.map(r3).join(', ')} -> ${W.owners[W.owner[best.t]].split('|').pop()} at H ${r3(best.h)} (the sole ${r3(p[2] - best.h)} m over it); root frame target {y: ${y}}`);
    continue;
  }
  let t = nearestTarget(rec, c, p, opt('--owner'), opt('--level') ? +opt('--level') : null);
  // within the arm's reach: the nearest point to the palm may lie beyond what the arm can reach from the shoulder (the
  // clip's farthest palm-shoulder distance, less 3 cm); then the nearest reachable point of the same target, searched
  // along the line from the shoulder to that point and round it
  if (t && via === 'arm' && !t.rod) {
    const sh = siteTrack(rec, clip, `shoulder_${site.slice(-1)}`);
    const reach = Math.max(...trk.map((q, i) => Math.hypot(q[0] - sh[i][0], q[1] - sh[i][1], q[2] - sh[i][2]))) - 0.03;
    const s0 = [0, 1, 2].map((k) => med(sh.map((q) => q[k])));
    const far = (q) => Math.hypot(q[0] - s0[0], q[1] - s0[1], q[2] - s0[2]);
    if (far(t.q) > reach) {
      let best = null;
      for (let f = 0; f <= 1.0001; f += 0.05) for (const [dx, dy, dz] of [[0, 0, 0], [0.08, 0, 0], [-0.08, 0, 0], [0, 0.08, 0], [0, -0.08, 0], [0, 0, 0.08], [0, 0, -0.08]]) {
        const probe = [s0[0] + (p[0] - s0[0]) * f + dx, s0[1] + (p[1] - s0[1]) * f + dy, s0[2] + (p[2] - s0[2]) * f + dz];
        const u = nearestTarget(rec, c, probe, opt('--owner'), null);
        if (u && far(u.q) <= reach && (!best || Math.hypot(u.q[0] - p[0], u.q[1] - p[1], u.q[2] - p[2]) < Math.hypot(best.q[0] - p[0], best.q[1] - p[1], best.q[2] - p[2]))) best = u;
      }
      if (best) { lines.push(`${site}: the nearest point ${r3(far(t.q))} m from the shoulder is beyond reach (${r3(reach)}): the nearest reachable one instead`); t = best; }
    }
  }
  if (!t) { console.log(`${site}: nothing to touch near it`); continue; }
  const off = +opt('--off', /^forearm|^elbow/.test(site) ? 0.035 : c.target === 'animal' ? 0.016 : 0.015);
  const q = toRoot(t.q).map(r3);
  let to;
  // --point-sites a,b: a rod (pole, shaft) target as the one point of its surface nearest the site, not its axis line:
  // a shaft that bends or tapers where the hand rests sits 2-4 cm off its fitted line (S6's wagon shaft, fix-inner)
  if (t.rod && opt('--point-sites')?.split(',').includes(site)) {
    // the true surface nearest the fitted one (the axis point out by the radius), then out along its normal
    const probe = t.q.map((v, i) => v + t.n[i] * t.rod.r);
    const u = nearestTarget(rec, { ...c, feature: null }, probe, opt('--owner'), null) || { q: probe, n: t.n };
    const sgn = (p[0] - u.q[0]) * u.n[0] + (p[1] - u.q[1]) * u.n[1] + (p[2] - u.q[2]) * u.n[2] < 0 ? -1 : 1;
    to = { point: toRoot(u.q.map((v, i) => v + sgn * u.n[i] * off)).map(r3) };
    lines.push(`${site}: the shaft's surface at ${u.q.map(r3).join(', ')} (${r3(Math.hypot(...u.q.map((v, i) => v - probe[i])))} m from the fitted one)`);
  } else if (t.rod) {
    const d = toRoot([t.rod.b[0] - t.rod.a[0], t.rod.b[1] - t.rod.a[1], t.rod.b[2] - t.rod.a[2]], true);
    const L = Math.hypot(...d);
    to = { line: { p: q, dir: d.map((x) => r3(x / L)) }, off: r3(t.rod.r + off) };
  } else if (args.includes('--plane')) {
    to = { plane: { p: q, n: toRoot(t.n, true).map(r3) }, off };
  } else {
    // the point itself, off the surface along its normal: the hand rests on that spot all through the clip (a plane
    // let a hand that moves along it end up far from a curved body: an ox's head)
    const nr = toRoot(t.n, true);
    to = { point: q.map((x, i) => r3(x + nr[i] * off)) };
  }
  // a hand that has far to go swings its elbow down and out, as an arm reaching does, not where the clip had it
  const op = { site, via, to };
  if (via === 'arm' && t.d > 0.15 && !args.includes('--no-elbow-down')) op.elbow = 'down';
  // --fade d0,d1 [--fade-sites palm_R]: the hand pinned only while the clip has it near (a hand the take lets go of)
  if (via === 'arm' && opt('--fade') && (!opt('--fade-sites') || opt('--fade-sites').split(',').includes(site))) { op.fade = opt('--fade').split(',').map(Number); op.fade_from = toRoot(p).map(r3); }
  ops.push(op);
  lines.push(`${site}: median ${p.map(r3).join(', ')} -> ${t.owner} at ${t.q.map(r3).join(', ')} (${r3(t.d)} m away); root frame target ${JSON.stringify(to)}`);
}
const name = opt('--name', id);
const variant = `${clip}~${name}`;
console.log(`${section}/${id} (${rec.model}, ${clip}) at X ${r3(rec.root[0])} D ${r3(-rec.root[2])} H ${r3(rec.root[1])}:\n  ${lines.join('\n  ')}`);
if (args.includes('--write')) {
  const vf = path.join(QM, 'characters/ik_variants.json');
  const V = JSON.parse(fs.readFileSync(vf, 'utf8'));
  V[name] = { why: `${clip} for ${section}/${id} at its solved placement (X ${r3(rec.root[0])}, D ${r3(-rec.root[2])}, facing ${Math.round((rec.yaw * 180) / Math.PI - 90)}): ${sites.join(', ')} laid onto ${[...new Set(lines.filter((l) => l.includes('-> ')).map((l) => l.split('-> ')[1].split(' at ')[0]))].join(', ')} where the clip has them nearest (or nearest within the arm's reach) (tools/ik_targets.mjs)`, ops };
  fs.writeFileSync(vf, JSON.stringify(V, null, 1) + '\n');
  const cf = path.join(QM, `characters/${rec.model}.json`);
  const raw = fs.readFileSync(cf, 'utf8'), cj = JSON.parse(raw);
  cj.clips[variant] = `ik:${clip}@${name}`;
  fs.writeFileSync(cf, JSON.stringify(cj, null, raw.startsWith('{\n  "') ? 2 : 1) + '\n');
  const ff = path.join(QM, `sections/${section}/contact_fixes.json`);
  const fx = fs.existsSync(ff) ? JSON.parse(fs.readFileSync(ff, 'utf8')) : { figures: {} };
  const e = (fx.figures[id] ||= {});
  const pj = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8')).figures[id];
  e.do = (e.do || pj.do).map(([c, s]) => [c === clip ? variant : c, s]);
  e.class = e.class === 'recast' ? 'recast' : 'ik';
  e.why = `${e.why ? e.why + '; ' : ''}${clip} -> ${variant}: an IK clip variant (characters/ik_variants.json "${name}") lays ${sites.join(', ')} on what the painting has it touch, from its solved placement`;
  fs.writeFileSync(ff, JSON.stringify(fx, null, 1) + '\n');
  console.log(`wrote ${variant} (characters/ik_variants.json, characters/${rec.model}.json, sections/${section}/contact_fixes.json)`);
}
