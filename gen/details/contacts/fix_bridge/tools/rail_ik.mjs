#!/usr/bin/env node
// Rail IK targets (fix-bridge, details pass; fix_standard.md step 4): per-figure IK clip variants for the Rainbow
// Bridge's railing leaners, from the built railing at the figure's solved placement (the predicted placement from the
// current sections/<s>/people.json, root_h included). tools/ik_targets.mjs takes the nearest surface point to a site's
// median, which for a palm 0.2 m under the top rail is the rail's underside; here:
//   --mode palms_top   lean_over: each palm laid on the TOP of the top rail, where the rail passes the palm (its plan
//                      point on the rail's centre line: the bridge's hidden railing wall; its height the highest visible
//                      piece of the railing there within 1.0-1.2 m over the hidden ramp, the top rail's top face) + off
//                      (default 0.015) over it: on the ramps the rail slopes 22-32 deg, so each hand rests at its own
//                      height (two-bone arm IK, `via: arm`; elbow "down" when the hand travels more than 0.15 m)
//   --mode belly       reach_over_rail: the whole body moved (`via: hips`, y and z only, the feet kept by leg IK) so the
//                      belly touches the railing: the nearest visible railing point at or below the belly (+ off along
//                      the way back to the belly): the body can only go down and forward, the legs being near straight
//   node rail_ik.mjs <section> <figure> --clip <clip> --mode palms_top|belly [--off 0.015] [--name <variant>] [--write]
//   --write (run under flock /tmp/qingming_charbuild.lock): characters/ik_variants.json[<name>] (name: the figure's
//           slug), characters/<model>.json clip "<clip>~<name>": "ik:<clip>@<name>", and the figure's do (that clip ->
//           the variant) in sections/<s>/contact_fixes.json
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, siteTrack, toRootFn } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [section, id] = args;
const clip = opt('--clip'), mode = opt('--mode', 'palms_top'), off = +opt('--off', 0.015);
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const { world } = ctx;
const rec = ctx.dump.people.find((p) => p.section === section && p.id === id && p.kind === 'figure');
if (!rec || !clip) { console.log('usage: rail_ik.mjs <section> <figure> --clip <clip> --mode palms_top|belly [--write]'); process.exit(1); }
const BR = 'S3.str.rainbow_bridge';
const oName = (t) => world.owners[world.owner[t]];
const T = world.T;
const TT = (i) => T[i];
const normalZ = (t) => {
  const o = t * 9, ux = T[o + 3] - T[o], uy = T[o + 4] - T[o + 1], uz = T[o + 5] - T[o + 2], vx = T[o + 6] - T[o], vy = T[o + 7] - T[o + 1], vz = T[o + 8] - T[o + 2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], L = Math.hypot(...n) || 1;
  return n[2] / L;
};
const isHidden = (t) => world.hiddenMat[world.mat[t]];
const toRoot = toRootFn(rec);
const root = [rec.root[0], -rec.root[2], rec.root[1]];
const ops = [], lines = [];

function rampAt(X, D, near) {
  let best = null;
  for (const v of world.vertical(X, D, (t) => oName(t) === BR && isHidden(t) && Math.abs(normalZ(t)) > 0.5)) {
    if (Math.abs(v.h - near) < 1.0 && (!best || Math.abs(v.h - near) < Math.abs(best - near))) best = v.h;
  }
  return best;
}

// --feet (computed first: it sets the frame shift every other target takes): the soles on the stepped deck's treads.
// The root_h is the lower tread's top (deck_solve --leg). The variant's own ground offset (clip_ground: a standing
// clip's lower sole on the ground) will lower it by its lowest sole's height, so: the foot over the lower tread (F0) is
// left as the clip has it (a leg can't push a foot down past straight), the other (F1) is pinned onto its tread above,
// and every target is lifted by F0's clip height (the shift the page takes off again): after it F0 stands on root_h,
// F1 on its tread, the hands where they were aimed.
let SHIFT = 0;
const feetOps = [];
if (args.includes('--feet')) {
  const vis = (t) => !isHidden(t) && !oName(t).includes('|edge:') && !oName(t).endsWith('|water');
  const per = [];
  for (const site of ['sole_L', 'sole_R']) {
    const tr = siteTrack(rec, clip, site);
    const p = [0, 1, 2].map((k) => med(tr.map((q) => q[k])));
    let top = null;
    // the highest of 5 points 5 cm round the sole (as contact_check reads a foot: a sole over a riser rests on the higher tread), within 0.3 m down and 0.45 m up
    for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) for (const v of world.vertical(p[0] + dx, p[1] + dd, vis)) if (v.h <= p[2] + 0.45 && v.h >= p[2] - 0.3 && (top === null || v.h > top)) top = v.h;
    if (top === null) { lines.push(`${site}: no visible surface under it`); continue; }
    per.push({ site, ty: top - root[2], sy: toRoot(p)[1], top });
  }
  if (per.length === 2) {
    per.sort((x, y) => x.ty - y.ty);
    const [f0, f1] = per;
    SHIFT = f0.sy - f0.ty;
    lines.push(`${f0.site}: on the lower tread (top ${r3(f0.top)}, ${r3(f0.ty)} from the root), left as the clip has it (${r3(f0.sy)} up): every target lifted ${r3(SHIFT)}`);
    // a wide stance on a steep ramp puts the upper foot two risers up (0.33-0.36 m: a knee folded like a frog's): then
    // the foot is drawn in towards the body (its x towards 0) onto the first tread up, as a man stands on a stair
    let fx = null, ty1 = f1.ty;
    if (f1.ty - f0.ty > 0.24) {
      const [px, py, pz] = rec.root, cy = Math.cos(rec.yaw), sy_ = Math.sin(rec.yaw);
      const toMapXZ = (x, z) => { const dx = x * cy + z * sy_, dz = -x * sy_ + z * cy; return [px + dx, -(pz + dz)]; };
      const tr1 = siteTrack(rec, clip, f1.site).map((q) => toRoot(q));
      const x0 = med(tr1.map((q) => q[0])), z0 = med(tr1.map((q) => q[2]));
      for (const f of [0.85, 0.7, 0.55, 0.4]) {
        const [X, D] = toMapXZ(x0 * f, z0);
        let t = null;
        for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) for (const v of world.vertical(X + dx, D + dd, vis)) if (v.h <= root[2] + f1.ty + 0.1 && v.h >= root[2] - 0.05 && (t === null || v.h > t)) t = v.h;
        if (t !== null && t - root[2] - f0.ty <= 0.24 && t - root[2] - f0.ty > 0.02) { fx = r3(x0 * f); ty1 = t - root[2]; lines.push(`${f1.site}: two risers up at the clip's stance (${r3(f1.ty - f0.ty)}): drawn in to x ${fx} (from ${r3(x0)}), onto the tread ${r3(ty1 - f0.ty)} up`); break; }
      }
    }
    const want = ty1 + SHIFT;
    if (want - f1.sy > 0.005 || fx !== null) {
      feetOps.push({ site: f1.site, via: 'leg', to: { ...(fx !== null ? { x: fx } : {}), y: r3(want) } });
      lines.push(`${f1.site}: its tread ${r3(ty1 - f0.ty)} m above the lower: pinned onto it (leg op, y ${r3(want)}${fx !== null ? `, x ${fx}` : ''})`);
    } else lines.push(`${f1.site}: over its tread by ${r3(f1.sy - want)} (left as the clip has it)`);
  }
}
// --steady: the hips held at the clip's median place across and forward (x, z) all through the cycle, the feet kept
// (lean_over sways its body 0.29 m forward and back: a hand pinned on a rail 0.35 m ahead would be out of reach at the
// back of the sway)
if (args.includes('--steady')) {
  // the chest (top of the spine) held at the clip's median place across and forward, the whole body moved under it by
  // the hips, the feet kept: lean_over sways its upper body 0.26 m forward and back, and hands pinned on a rail 0.35 m
  // ahead would be out of reach at the back of the sway. A per-figure 0.1-0.9 mm in x keeps two variants' hips tracks
  // apart (gltf-transform's dedup would merge identical ones, and the page grounds a shared hips array only once)
  const tr = siteTrack(rec, clip, 'chest_front');
  const hr = tr.map((q) => toRoot(q));
  let hsh = 0;
  for (const ch of id) hsh = (hsh * 31 + ch.charCodeAt(0)) % 9973;
  const eps = ((hsh % 9) + 1) * 1e-4;
  const cx = med(hr.map((q) => q[0])), cz = med(hr.map((q) => q[2]));
  const fwd = +opt('--chest-forward', 0);   // leaning a little further over the rail: the low (downhill) hand's reach
  ops.push({ site: 'chest_front', via: 'hips', to: { x: Math.round((cx + eps) * 1e4) / 1e4, z: r3(cz + fwd) }, keep_soles: true });
  lines.push(`chest: held at x ${r3(cx)}, z ${r3(cz)} (the clip sways it ${r3(Math.max(...hr.map((q) => q[2])) - Math.min(...hr.map((q) => q[2])))} m forward and back)`);
}
if (mode === 'palms_top') {
  for (const site of ['palm_L', 'palm_R']) {
    const tr = siteTrack(rec, clip, site);
    if (!tr) { console.log(`${rec.model} has no ${clip}`); process.exit(1); }
    const p = [0, 1, 2].map((k) => med(tr.map((q) => q[k])));
    // the railing's centre line: the nearest hidden vertical wall of the bridge (Z - 0.3 .. Z + 1.25 along each railing)
    const n = world.nearest([p[0], p[1], root[2] + 0.8], 1.2, (t) => oName(t) === BR && isHidden(t) && Math.abs(normalZ(t)) < 0.2);
    if (!n) { console.log(`${site}: no railing within 1.2 m`); process.exit(1); }
    // along the rail: the point of its top nearest the palm in 3D (on a sloping rail the uphill hand reaches down the
    // rail a little, not straight up over it), searched 0.12 m either way along the railing wall
    const tn = (() => { const o = n.t * 9; const a = [TT(o), TT(o + 1)], b = [TT(o + 3), TT(o + 4)], c3 = [TT(o + 6), TT(o + 7)];
      const e = [[a, b], [b, c3], [c3, a]].map(([u, v]) => [v[0] - u[0], v[1] - u[1]]).sort((x, y) => Math.hypot(...y) - Math.hypot(...x))[0];
      const L = Math.hypot(...e) || 1; return [e[0] / L, e[1] / L]; })();
    let c = [n.q[0], n.q[1]], best = null;
    for (let u = -0.12; u <= 0.1201; u += 0.02) {   // the hand stays on its own side: at most 0.12 m along the rail from straight in front of it
      const cc = [n.q[0] + tn[0] * u, n.q[1] + tn[1] * u];
      const m = world.nearest([cc[0], cc[1], root[2] + 0.8], 0.3, (t) => oName(t) === BR && isHidden(t) && Math.abs(normalZ(t)) < 0.2);
      if (!m) continue;
      const cw = [m.q[0], m.q[1]];
      const dn = Math.hypot(root[0] - cw[0], root[1] - cw[1]) || 1;
      const ci2 = [cw[0] + ((root[0] - cw[0]) / dn) * 0.05, cw[1] + ((root[1] - cw[1]) / dn) * 0.05];
      const z2 = rampAt(ci2[0], ci2[1], root[2]);
      if (z2 === null) continue;
      const d3 = Math.hypot(cw[0] - p[0], cw[1] - p[1], z2 + 1.11 - p[2]);
      if (!best || d3 < best.d3) best = { cw, d3 };
    }
    if (best) c = best.cw;
    // the hand on the rail's near half (its top is 0.11 m wide): --inset metres in from the centre line, towards the root
    const ins = +opt('--inset', 0.035), dc = Math.hypot(root[0] - c[0], root[1] - c[1]) || 1;
    c = [c[0] + ((root[0] - c[0]) / dc) * ins, c[1] + ((root[1] - c[1]) / dc) * ins];
    // the hidden ramp beside the rail (5 cm in from it, towards the root) and the top rail's top face over it
    const din = Math.hypot(root[0] - c[0], root[1] - c[1]) || 1;
    const ci = [c[0] + ((root[0] - c[0]) / din) * 0.05, c[1] + ((root[1] - c[1]) / din) * 0.05];
    const zr = rampAt(ci[0], ci[1], root[2]);
    let top = null;
    for (const [dx, dd] of [[0, 0], [0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02]]) {
      for (const v of world.vertical(c[0] + dx, c[1] + dd, (t) => oName(t) === BR && !isHidden(t) && normalZ(t) > 0.5)) {
        if (zr !== null && v.h > zr + 1.0 && v.h < zr + 1.2 && (top === null || v.h > top)) top = v.h;
      }
    }
    if (top === null) { top = (zr ?? root[2]) + 1.094; lines.push(`${site}: no top face found over the ramp (${zr}): taken at ramp + 1.094`); }
    const tgt = [c[0], c[1], top + off + SHIFT];
    const q = toRoot(tgt).map(r3);
    const d = Math.hypot(tgt[0] - p[0], tgt[1] - p[1], tgt[2] - p[2]);
    const op = { site, via: 'arm', to: { point: q } };
    if (d > 0.15) op.elbow = 'down';
    ops.push(op);
    lines.push(`${site}: median ${p.map(r3).join(', ')} -> the top rail's top at ${tgt.map(r3).join(', ')} (ramp ${zr === null ? '?' : r3(zr)}, ${r3(d)} m away); root frame ${JSON.stringify(q)}`);
  }
} else if (mode === 'belly') {
  const tr = siteTrack(rec, clip, 'belly');
  const p = [0, 1, 2].map((k) => med(tr.map((q) => q[k])));
  const vis = (t) => oName(t) === BR && !isHidden(t);
  // candidates: the nearest railing point overall, and the nearest one at least `off` under the belly
  const cands = [];
  const n1 = world.nearest(p, 0.6, vis);
  if (n1) cands.push(n1);
  let n2 = null;
  for (const t of world.near(p[0], p[1], 0.6)) {
    if (!vis(t)) continue;
    const r = world.closest(t, p);
    if (r.q[2] > p[2] - off) continue;
    if (!n2 || r.d < n2.d) n2 = { ...r, t };
  }
  if (n2) cands.push(n2);
  let best = null;
  for (const c of cands) {
    const dir = [p[0] - c.q[0], p[1] - c.q[1], p[2] - c.q[2]], L = Math.hypot(...dir) || 1;
    const tgt = [c.q[0] + (dir[0] / L) * off, c.q[1] + (dir[1] / L) * off, c.q[2] + (dir[2] / L) * off];
    if (tgt[2] > p[2] + +opt('--max-rise', 0.01)) { lines.push(`belly: the railing point ${c.q.map(r3).join(', ')} is over the belly (${r3(tgt[2] - p[2])} m up): the legs can't lift him`); continue; }
    const move = Math.hypot(tgt[0] - p[0], tgt[1] - p[1], tgt[2] - p[2]);
    if (!best || move < best.move) best = { tgt, move, c };
  }
  if (!best) { console.log(lines.join('\n')); process.exit(1); }
  const q = toRoot(best.tgt).map(r3), pr = toRoot(p).map(r3);
  ops.push({ site: 'belly', via: 'hips', to: { y: r3(q[1] + SHIFT), z: q[2] }, keep_soles: true });
  lines.push(`belly: median ${p.map(r3).join(', ')} (root frame ${JSON.stringify(pr)}) -> ${best.tgt.map(r3).join(', ')} (root frame y ${q[1]}, z ${q[2]}: down ${r3(pr[1] - q[1])}, forward ${r3(q[2] - pr[2])})`);
} else if (mode === 'near') {
  // --owner <map id> [--sites palm_L,palm_R]: each site to the nearest visible point of that owner's geometry (a
  // handcart's 0.96 m shafts, which the rule's poles (rods >= 1.5 m) don't see; a cart's load), `off` out along the way
  // back to the site; arm sites by arm IK (elbow "down" when far), others by the hips (y, z, feet kept)
  const own = opt('--owner');
  const oid = world.ownerId.get(own);
  if (oid === undefined) { console.log(`no owner ${own}`); process.exit(1); }
  const sites = (opt('--sites') || 'palm_L,palm_R').split(',');
  for (const site of sites) {
    const tr = siteTrack(rec, clip, site);
    const p = [0, 1, 2].map((k) => med(tr.map((q) => q[k])));
    let n = null;
    for (const t of world.ownerTris.get(oid) || []) {
      if (isHidden(t)) continue;
      const r = world.closest(t, p);
      if (!n || r.d < n.d) n = r;
    }
    const dir = [p[0] - n.q[0], p[1] - n.q[1], p[2] - n.q[2]], L = Math.hypot(...dir) || 1;
    const tgt = [n.q[0] + (dir[0] / L) * off, n.q[1] + (dir[1] / L) * off, n.q[2] + (dir[2] / L) * off + SHIFT];
    const q = toRoot(tgt).map(r3);
    const arm = /^(palm|forearm)_/.test(site);
    const op = arm ? { site, via: 'arm', to: { point: q } } : { site, via: 'hips', to: { y: q[1], z: q[2] }, keep_soles: true };
    if (arm && n.d > 0.15) op.elbow = 'down';
    ops.push(op);
    lines.push(`${site}: median ${p.map(r3).join(', ')} -> ${own} at ${n.q.map(r3).join(', ')} (${r3(n.d)} m away); root frame ${JSON.stringify(op.to)}`);
  }
} else if (mode !== 'none') { console.log(`mode ${mode}?`); process.exit(1); }

// --feet: a sole over a tread higher than the root (the root_h on the lower tread: deck_solve --leg) is raised onto it
// by a leg-IK op (tools/ik_clip.mjs `via: leg`, fix-inner's): to {y: the tread's top in the root frame}
ops.push(...feetOps);
if (!ops.length) { console.log(`${id}: nothing to pin\n  ${lines.join('\n  ')}`); process.exit(0); }

const name = opt('--name', id);
const variant = `${clip}~${name}`;
console.log(`${section}/${id} (${rec.model}, ${clip}) at X ${r3(root[0])} D ${r3(root[1])} H ${r3(root[2])}${Number.isFinite(rec.root_h) ? ' (root_h)' : ''}:\n  ${lines.join('\n  ')}`);
if (args.includes('--write')) {
  const vf = path.join(QM, 'characters/ik_variants.json');
  const V = JSON.parse(fs.readFileSync(vf, 'utf8'));
  const what = [mode === 'palms_top' ? 'both palms laid on the top of the Rainbow Bridge\'s top rail where it passes each hand (the rail follows the ramp: each hand at its own height)'
    : mode === 'belly' ? 'the belly on the railing (the whole body moved down and forward, the feet kept)'
    : mode === 'near' ? `${(opt('--sites') || 'palm_L,palm_R').split(',').join(', ')} on ${opt('--owner')} where it is nearest to them${opt('--what') ? ' (' + opt('--what') + ')' : ''}` : (args.includes('--merge') && V[name] ? V[name].why.split(': ').slice(1).join(': ').split(' (')[0] : ''),
  ...(ops.some((o) => o.via === 'hips' && o.site === 'chest_front') ? ['the chest held steady (no forward sway: the hips move under it), the feet kept'] : []),
  ...(ops.some((o) => o.via === 'leg') ? [`its ${ops.filter((o) => o.via === 'leg').map((o) => o.site).join(', ')} pinned onto the visible treads of the stepped deck under them (leg IK)`] : [])].filter(Boolean).join('; ');
  // --merge: keep the ops an earlier writer (tools/ik_targets.mjs) gave this variant for other sites
  if (args.includes('--merge') && V[name]) { const mine = new Set(ops.map((o) => o.site)); ops.unshift(...V[name].ops.filter((o) => !mine.has(o.site))); }
  V[name] = { why: `${clip} for ${section}/${id} at its solved placement (X ${r3(root[0])}, D ${r3(root[1])}, H ${r3(root[2])}, facing ${Math.round((rec.yaw * 180) / Math.PI - 90)}): ${what} (gen/details/contacts/fix_bridge/tools/rail_ik.mjs)`, ops };
  fs.writeFileSync(vf, JSON.stringify(V, null, 1) + '\n');
  const cf = path.join(QM, `characters/${rec.model}.json`);
  const raw = fs.readFileSync(cf, 'utf8'), cj = JSON.parse(raw);
  cj.clips[variant] = `ik:${clip}@${name}`;
  fs.writeFileSync(cf, JSON.stringify(cj, null, raw.startsWith('{\n  "') ? 2 : 1) + '\n');
  const ff = path.join(QM, `sections/${section}/contact_fixes.json`);
  const fx = JSON.parse(fs.readFileSync(ff, 'utf8'));
  const e = (fx.figures[id] ||= {});
  const pj = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8')).figures[id];
  e.do = (e.do || pj.do).map(([c, s]) => [c === clip || c.split('~')[0] === clip ? variant : c, s]);
  e.class = e.class === 'recast' ? 'recast' : 'ik';
  const tag = `${clip} -> ${variant}`;
  e.why = `${(e.why || '').split('; ' + clip + ' -> ')[0]}${e.why && !e.why.startsWith(clip + ' -> ') ? '; ' : ''}${tag}: an IK clip variant (characters/ik_variants.json "${name}"): ${what}, from its solved placement`.replace(/^; /, '');
  fs.writeFileSync(ff, JSON.stringify(fx, null, 1) + '\n');
  console.log(`wrote ${variant} (characters/ik_variants.json, characters/${rec.model}.json, sections/${section}/contact_fixes.json)`);
}
