#!/usr/bin/env node
// Crew IK targets (fix-boats, details pass): tools/ik_targets.mjs for a boat crew member: its placement predicted from
// the current sections/<s>/people.json on its boat at the dump instant (place_predict predictCrewDump: boats.js host in
// node), each contact site's median over the clip, the nearest point of what the clip's rule touches with the boats in
// the world (contact_check nearestTarget inside atCrewInstant), the target `off` out along the surface's normal, in the
// figure's root frame (rigid with its boat, so it holds at every instant). Palms, forearms, elbows: an arm op (elbow
// "down" for a reach over 0.35 m); belly, chest_front, back: a hips op with the feet kept.
//   node tools/crew_ik_targets.mjs <section> <figure> --clip <clip> [--sites palm_L,palm_R] [--off 0.012]
//        [--owner <owner>] [--placements file] [--write]
//   --write: characters/ik_variants.json[<figure>] and characters/<model>.json "<clip>~<figure>": "ik:<clip>@<figure>"
//            (run it under flock /tmp/qingming_charbuild.lock), and sections/<s>/contact_fixes.json do -> the variant
//            (under /tmp/qingming_contact_fixes.lock); then build the character, clip_ground, joint_tracks, ktx2
import fs from 'node:fs';
import path from 'node:path';
import { QM } from './lib/owners_index.mjs';
import { setup, ruleOf, nearestTarget, siteTrack, toRootFn, atCrewInstant } from './contact_check.mjs';
import { predictCrewDump } from './place_predict.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [section, id] = args;
const clip = opt('--clip');
const r3 = (x) => Math.round(x * 1000) / 1000;
const dump = JSON.parse(fs.readFileSync(path.resolve(QM, opt('--placements', 'gen/details/contacts/fix_boats/placements_after.json')), 'utf8'));
let ctx = setup({ placements: dump });
ctx = setup({ placements: predictCrewDump(dump, ctx.boatWorld, { sections: [section] }), worldIn: ctx.world });
const rec = ctx.dump.people.find((p) => p.section === section && p.id === id);
if (!rec || !clip) { console.log('usage: crew_ik_targets.mjs <section> <figure> --clip <clip> [...]'); process.exit(1); }
const rule = ruleOf(clip, clip);
const sites = opt('--sites') ? opt('--sites').split(',') : (rule.contacts || []).map((c) => c.site);
const off = +opt('--off', 0.012);
const toRoot = toRootFn(rec);
const ops = [], notes = [];
for (const site of sites) {
  const rl = (rule.contacts || []).find((c) => c.site === site) || rule.contacts?.[0];
  const tr = siteTrack(rec, clip, site);
  if (!tr) { console.log(`${id}: no track for ${site} in ${clip}`); process.exit(1); }
  const med = [0, 1, 2].map((k) => { const v = tr.map((p) => p[k]).sort((a, b) => a - b); return v[v.length >> 1]; });
  const nt = atCrewInstant(rec, () => nearestTarget({ ...rec, _instant: 'dump' }, rl, med, opt('--owner') || null));
  if (!nt) { console.log(`${id} ${site}: nothing to reach near ${med.map(r3)}`); process.exit(1); }
  const q = nt.q.map((x, k) => x + nt.n[k] * off);
  const local = toRoot(q).map(r3);
  const dist = Math.hypot(...med.map((x, k) => x - nt.q[k]));
  notes.push(`${site} ${r3(dist)} m from ${nt.owner}`);
  if (/^(palm|forearm|elbow)_/.test(site)) ops.push({ site, via: 'arm', to: { point: local }, ...(dist > 0.35 ? { elbow: 'down' } : {}) });
  else ops.push({ site, via: 'hips', to: { point: local }, keep_soles: true });
}
const spec = { why: `${clip} for ${section}/${id} on its boat (fix-boats, tools/crew_ik_targets.mjs): ${notes.join('; ')}: the sites laid onto what the clip's rule touches there (${off} m off its surface), in the root frame (the crew moves with its boat)`, ops };
console.log(JSON.stringify({ id, model: rec.model, clip, spec }));
if (args.includes('--write')) {
  const vp = path.join(QM, 'characters/ik_variants.json'), vraw = fs.readFileSync(vp, 'utf8'), v = JSON.parse(vraw);
  v[id] = spec;
  fs.writeFileSync(vp, JSON.stringify(v, null, vraw.startsWith('{\n "') ? 1 : 2) + (vraw.endsWith('\n') ? '\n' : ''));
  const cp = path.join(QM, `characters/${rec.model}.json`), craw = fs.readFileSync(cp, 'utf8'), c = JSON.parse(craw);
  c.clips[`${clip}~${id}`] = `ik:${clip}@${id}`;
  fs.writeFileSync(cp, JSON.stringify(c, null, craw.startsWith('{\n "') ? 1 : 2) + (craw.endsWith('\n') ? '\n' : ''));
  const fp = path.join(QM, `sections/${section}/contact_fixes.json`), fx = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const e = (fx.figures[id] ||= {});
  const spec0 = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8')).figures[id];
  e.do = (spec0.do || [[clip, 10]]).map(([c, t]) => [c === clip ? `${clip}~${id}` : c, t]);
  e.class = 'ik';
  e.why = `IK variant (fix-boats): ${spec.why}`;
  fs.writeFileSync(fp, JSON.stringify(fx, null, 1) + '\n');
  console.log(`  -> ik_variants.json[${id}], characters/${rec.model}.json, sections/${section}/contact_fixes.json`);
}
