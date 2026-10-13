#!/usr/bin/env node
// Animal hold targets (details pass, fix-river; gen/details/contacts/fix_standard.md step 4, for a hand on an animal):
// contact_check judges a hand on an animal against frame 0 of whichever clip the animal plays at the dump instant, and
// the page moves the animal through all of its clips (a grazing head swings 0.5 m). So the hand goes on a point of the
// animal's body that stays put: for every body vertex, its spread over every frame of every clip in the animal's
// people.json `do` (gen/details/joints/animal_<type>.json, 2 Hz posed meshes); among the vertices whose spread is under
// --spread (default 0.025 m) and that the arm can reach from the figure's shoulder (the clip's farthest palm-shoulder
// distance less 3 cm), the one nearest the palm's median place in the clip (or nearest --near X,D,H). The target is
// that vertex, 0.016 m out along its normal, in the figure's root frame (the page's frame, P1 applied).
//   node animal_hold.mjs <section> <figure> --clip <clip> --animal <slug> [--sites palm_R,palm_L] [--spread 0.025]
//        [--near X,D,H] [--reach m] [--name <variant>] [--write]
// --reach: the palm's farthest from its shoulder (default: the clip's own farthest less 3 cm; an arm straightens to
//          about 0.55 m from shoulder top to palm on these 1.7 m men)
// --write adds the variant to characters/ik_variants.json and "<clip>~<name>" to characters/<model>.json (run it under
// flock /tmp/qingming_charbuild.lock), and the figure's do to sections/<section>/contact_fixes.json.
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, siteTrack, toRootFn } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [section, id] = args;
const clip = opt('--clip'), aslug = opt('--animal');
const sites = (opt('--sites') || 'palm_R,palm_L').split(',');
const SPREAD = +opt('--spread', 0.025);
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
let rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
// --at dX,dD,facing: the figure at that placement instead of its people.json one (to search placements)
if (rec && opt('--at')) {
  const [ax, ad, af] = opt('--at').split(',').map(Number);
  const spec0 = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8')).figures[id];
  const q = ctx.pred.figure(rec.map, { ...spec0, nudge: [ax, ad], facing_deg: af });
  rec = { ...rec, root: [q.X, q.H, -q.D], yaw: q.yaw };
}
const arec = ctx.dump.people.find((p) => p.section === section && p.id === aslug);
if (!rec || !arec || !clip) { console.log('usage: animal_hold.mjs <section> <figure> --clip <clip> --animal <slug>'); process.exit(1); }
const people = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
const aspec = people.animals[aslug];
const clips = [...new Set([...(aspec.do || [['idle', 8]]).map(([c]) => c), ...(aspec.path ? ['walk', 'idle'] : [])])];
const j = JSON.parse(fs.readFileSync(path.join(QM, `gen/details/joints/animal_${arec.model}.json`), 'utf8'));
const b = fs.readFileSync(path.join(QM, `gen/details/joints/animal_${arec.model}.bin`));
const F = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
const loads = new Set([].concat(aspec.load || []).map((l) => `tack_${l}`));
// page frame of the animal -> map [X, D, H]
const [px, py, pz] = arec.root, ca = Math.cos(arec.yaw), sa = Math.sin(arec.yaw), ka = arec.model_scale ? arec.scale / arec.model_scale : 1;
const toMap = (x, y, z) => [px + ka * (x * ca + z * sa), -(pz + ka * (-x * sa + z * ca)), py + ka * y];
// the parts checked: body + its loads; per part mesh, vertex positions per frame
const parts = Object.keys(j.part_meshes).filter((p) => p === 'body' || loads.has(p));
const frames = clips.flatMap((c) => (j.clips[c]?.frames || []).map((fr, i) => ({ c, i, fr })));
if (!frames.length) { console.log(`no frames for ${clips}`); process.exit(1); }
const ref = frames.find((f) => f.c === arec.clip && f.i === 0) || frames[0];
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const cand = [];
for (const part of parts) {
  j.part_meshes[part].forEach((pm, mi) => {
    const nV = pm.verts;
    const offRef = ref.fr.parts[part][mi];
    // vertex normals at the reference frame
    const nrm = new Float32Array(nV * 3);
    const P = (off, i) => [F[off + i * 3], F[off + i * 3 + 1], F[off + i * 3 + 2]];
    for (let t = 0; t < pm.index.length; t += 3) {
      const [ia, ib, ic] = [pm.index[t], pm.index[t + 1], pm.index[t + 2]];
      const a = P(offRef, ia), bb = P(offRef, ib), c = P(offRef, ic);
      const u = [bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      for (const ii of [ia, ib, ic]) for (let k = 0; k < 3; k++) nrm[ii * 3 + k] += n[k];
    }
    for (let i = 0; i < nV; i++) {
      const p0 = P(offRef, i);
      let spread = 0, spread0 = 0;
      for (const f of frames) {
        const q = P(f.fr.parts[part][mi], i);
        const d = Math.hypot(q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]);
        spread = Math.max(spread, d);
        if (f.i === 0) spread0 = Math.max(spread0, d);
      }
      if (spread > SPREAD) continue;
      const nl = Math.hypot(nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]) || 1;
      const n = [nrm[i * 3] / nl, nrm[i * 3 + 1] / nl, nrm[i * 3 + 2] / nl];
      // the normal in the map frame (rotation only)
      const m0 = toMap(0, 0, 0), m1 = toMap(n[0], n[1], n[2]);
      cand.push({ part, q: toMap(...p0), n: [m1[0] - m0[0], m1[1] - m0[1], m1[2] - m0[2]], spread, spread0, local: p0 });
    }
  });
}
const toRoot = toRootFn(rec);
const ops = [], lines = [];
for (const site of sites) {
  const trk = siteTrack(rec, clip, site), sh = siteTrack(rec, clip, `shoulder_${site.slice(-1)}`);
  const p = [0, 1, 2].map((k) => med(trk.map((q) => q[k])));
  const s0 = [0, 1, 2].map((k) => med(sh.map((q) => q[k])));
  const reach = opt('--reach') ? +opt('--reach') : Math.max(...trk.map((q, i) => Math.hypot(q[0] - sh[i][0], q[1] - sh[i][1], q[2] - sh[i][2]))) - 0.03;
  const near = opt('--near') ? opt('--near').split(',').map(Number) : p;
  let best = null;
  for (const c of cand) {
    const t = [c.q[0] + c.n[0] * 0.016, c.q[1] + c.n[1] * 0.016, c.q[2] + c.n[2] * 0.016];
    if (Math.hypot(t[0] - s0[0], t[1] - s0[1], t[2] - s0[2]) > reach) continue;
    // the normal faces the figure's shoulder (the hand on the near side, not through the animal)
    const toSh = [s0[0] - c.q[0], s0[1] - c.q[1], s0[2] - c.q[2]];
    if (toSh[0] * c.n[0] + toSh[1] * c.n[1] + toSh[2] * c.n[2] <= 0) continue;
    // another site's target is kept 0.12 m away (two hands, not one spot)
    if (ops.some((o) => o._map && Math.hypot(o._map[0] - t[0], o._map[1] - t[1], o._map[2] - t[2]) < 0.12)) continue;
    const d = Math.hypot(t[0] - near[0], t[1] - near[1], t[2] - near[2]);
    if (!best || d < best.d) best = { ...c, t, d };
  }
  if (!best) { lines.push(`${site}: no steady point within reach (${r3(reach)} m from the shoulder)`); continue; }
  const to = { point: toRoot(best.t).map(r3) };
  const op = { site, via: 'arm', to, _map: best.t };
  // a hand that has far to go from where the clip has it reaches with its elbow down and out (tools/ik_targets.mjs)
  const dp = Math.hypot(best.t[0] - p[0], best.t[1] - p[1], best.t[2] - p[2]);
  if (dp > 0.15) op.elbow = 'down';
  ops.push(op);
  lines.push(`${site}: median ${p.map(r3).join(', ')} -> ${arec.id} ${best.part} at ${best.q.map(r3).join(', ')} (${r3(dp)} m from the clip's palm; spread over ${clips.join('/')} ${r3(best.spread)} m, at their frame 0 ${r3(best.spread0)} m); root frame ${JSON.stringify(to)}`);
}
console.log(`${section}/${id} (${rec.model}, ${clip}) at X ${r3(rec.root[0])} D ${r3(-rec.root[2])} H ${r3(rec.root[1])}, facing ${Math.round((rec.yaw * 180) / Math.PI - 90)}; ${aslug} plays ${clips.join(', ')}; ${cand.length} steady vertices\n  ${lines.join('\n  ')}`);
for (const o of ops) delete o._map;
if (args.includes('--write') && ops.length) {
  const name = opt('--name', id);
  const variant = `${clip}~${name}`;
  const vf = path.join(QM, 'characters/ik_variants.json');
  const V = JSON.parse(fs.readFileSync(vf, 'utf8'));
  V[name] = { why: `${clip} for ${section}/${id} at its solved placement (X ${r3(rec.root[0])}, D ${r3(-rec.root[2])}, facing ${Math.round((rec.yaw * 180) / Math.PI - 90)}): ${ops.map((o) => o.site).join(', ')} laid on ${aslug}'s body where it stays within ${SPREAD} m over every frame of its clips (${clips.join(', ')}), within the arm's reach, nearest where the clip has the hand (gen/details/contacts/fix_river/tools/animal_hold.mjs)`, ops };
  fs.writeFileSync(vf, JSON.stringify(V, null, 1) + '\n');
  const cf = path.join(QM, `characters/${rec.model}.json`);
  const raw = fs.readFileSync(cf, 'utf8'), cj = JSON.parse(raw);
  cj.clips[variant] = `ik:${clip}@${name}`;
  fs.writeFileSync(cf, JSON.stringify(cj, null, raw.startsWith('{\n  "') ? 2 : 1) + '\n');
  const ff = path.join(QM, `sections/${section}/contact_fixes.json`);
  const fx = fs.existsSync(ff) ? JSON.parse(fs.readFileSync(ff, 'utf8')) : { figures: {} };
  const e = (fx.figures[id] ||= {});
  const pj = people.figures[id];
  e.do = (e.do || pj.do).map(([c, s]) => [c.split('~')[0] === clip ? variant : c, s]);
  e.class = e.class === 'recast' ? 'recast' : 'ik';
  e.why = `${clip} -> ${variant}: an IK clip variant (characters/ik_variants.json "${name}") lays ${ops.map((o) => o.site).join(', ')} on ${aslug} where its body stays put through its clips, from his solved placement`;
  fs.writeFileSync(ff, JSON.stringify(fx, null, 1) + '\n');
  console.log(`wrote ${variant}`);
}
