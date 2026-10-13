#!/usr/bin/env node
// Reach hold (fix-river; fix_standard.md step 4): a fixed IK point target for a palm (or elbow) on a static owner (a
// barrow, a rail) that the limb can reach in EVERY frame of the take, not only from the shoulder's median place: the
// candidates are the owner's surface points (triangle vertices and centroids, 1.5 cm out along the normal) facing the
// figure; feasible where the farthest distance from the shoulder over the cycle is within the limb's length (the clip's
// own farthest palm-shoulder distance, or the upper arm's for an elbow, less --slack); among them the one nearest the
// site's median place. Prints the root-frame targets; --write sets them as the ops' points of an existing variant spec
// (characters/ik_variants.json, run under flock /tmp/qingming_charbuild.lock), keeping its other ops.
//   node reach_hold.mjs <section> <figure> --clip <clip> --owner <map id> --sites palm_R[,palm_L] [--slack 0.01]
//        [--variant <spec name>] [--write]
import fs from 'node:fs';
import path from 'node:path';
import { QM, World } from '../../../../../tools/lib/owners_index.mjs';
import { setup, siteTrack, toRootFn } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [section, id] = args;
const clip = opt('--clip'), owner = opt('--owner'), sites = (opt('--sites') || 'palm_R').split(','), slack = +opt('--slack', 0.01);
let ctx = setup({});
ctx = setup({ placements: predictDump(ctx.dump, ctx.pred, { sections: [section] }), worldIn: ctx.world });
const { world } = ctx;
const rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
const toRoot = toRootFn(rec);
const r3 = (x) => Math.round(x * 1000) / 1000;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const T = world.T;
const tris = [];
for (let t = 0; t < world.owner.length; t++) if (World.bare(world.ownerName(t)) === owner) tris.push(t);
const out = {};
for (const site of sites) {
  const trk = siteTrack(rec, clip, site);
  const joint = /^elbow/.test(site) ? null : null;
  let sh = siteTrack(rec, clip, `shoulder_${site.slice(-1)}`);
  // --steady: the variant holds the body still (a hips op on the chest), so only the shoulder's median place counts
  if (args.includes('--steady')) { const m = [0, 1, 2].map((k) => med(sh.map((q) => q[k]))); sh = sh.map(() => m); }
  const L = Math.max(...trk.map((q, i) => Math.hypot(q[0] - sh[i][0], q[1] - sh[i][1], q[2] - sh[i][2]))) - slack;
  const p = [0, 1, 2].map((k) => med(trk.map((q) => q[k])));
  const s0 = [0, 1, 2].map((k) => med(sh.map((q) => q[k])));
  let best = null, nFeas = 0;
  for (const t of tris) {
    const o = t * 9;
    const a = [T[o], T[o + 1], T[o + 2]], b = [T[o + 3], T[o + 4], T[o + 5]], c = [T[o + 6], T[o + 7], T[o + 8]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const ln = Math.hypot(...n); if (ln < 1e-9) continue; n = n.map((x) => x / ln);
    const cen = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    if ((s0[0] - cen[0]) * n[0] + (s0[1] - cen[1]) * n[1] + (s0[2] - cen[2]) * n[2] < 0) n = n.map((x) => -x);
    for (const q of [cen, a, b, c]) {
      const off = +opt('--off', /^elbow|^forearm/.test(site) ? 0.022 : 0.015);
      const tp = [q[0] + n[0] * off, q[1] + n[1] * off, q[2] + n[2] * off];
      // the surface faces the shoulder from this point
      if ((s0[0] - q[0]) * n[0] + (s0[1] - q[1]) * n[1] + (s0[2] - q[2]) * n[2] <= 0) continue;
      const far = Math.max(...sh.map((s) => Math.hypot(tp[0] - s[0], tp[1] - s[1], tp[2] - s[2])));
      if (far > L) continue;
      // an elbow sits exactly the upper arm's length from its shoulder: its target must lie on that sphere in every frame
      if (/^elbow/.test(site)) { const near = Math.min(...sh.map((s) => Math.hypot(tp[0] - s[0], tp[1] - s[1], tp[2] - s[2]))); if (near < L - +opt('--band', 0.02)) continue; }
      nFeas++;
      const d = Math.hypot(tp[0] - p[0], tp[1] - p[1], tp[2] - p[2]);
      if (!best || d < best.d) best = { tp, d, far };
    }
  }
  if (!best) { console.log(`${site}: no point of ${owner} within ${r3(L)} m of the shoulder in every frame`); continue; }
  out[site] = toRoot(best.tp).map(r3);
  console.log(`${site}: median ${p.map(r3).join(', ')} -> ${owner} at ${best.tp.map(r3).join(', ')} (${r3(best.d)} m from it; farthest from the shoulder ${r3(best.far)} of ${r3(L)}; ${nFeas} feasible) root frame ${JSON.stringify(out[site])}`);
}
if (args.includes('--write')) {
  const vf = path.join(QM, 'characters/ik_variants.json');
  const V = JSON.parse(fs.readFileSync(vf, 'utf8'));
  const name = opt('--variant', id);
  const v = V[name];
  for (const o of v.ops) if (out[o.site]) { o.to = { point: out[o.site] }; delete o.elbow; if (Math.hypot(...out[o.site]) && true) o.elbow = o.elbow; }
  v.why = `${v.why}; ${Object.keys(out).join(', ')} re-targeted to points reachable in every frame of the take (gen/details/contacts/fix_river/tools/reach_hold.mjs)`;
  fs.writeFileSync(vf, JSON.stringify(V, null, 1) + '\n');
  console.log(`wrote ${name}`);
}
