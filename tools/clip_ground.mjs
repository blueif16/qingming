#!/usr/bin/env node
// Clip ground contacts: how far each character clip's own body stands off flat ground as the page draws it, measured
// on the mesh (gen/details/joints/<name>.json, tools/joint_tracks.mjs), and the correction that puts it there
// (gen/details/contacts/fix_standard.md, "engine: clip-level soles"). people.js grounds a clip by its lowest foot
// BONE (prepareClip: bind pose vs the clip's lowest Foot/ToeBase/Leg/Hips bone), so the mesh soles of a clip end up
// 3-13 cm off the ground (scholar sit +0.12, carter standing -0.04, soldier doze_knees' seat -0.06).
//   sole_m: metres to add to the clip's height so its ground contact sits on the ground, by the clip's posture
//           (characters/contacts.json): stand, squat: the lower sole (median over the clip at 10 Hz); chair: the
//           middle of the two soles' medians, or the one sole when the rule rests only one on the floor;
//           floor, lie: the lower of the seat and the soles; kneel: the lower sole. Locomotion and ride clips get none.
//   seat_m: ride clips only: the seat site's height over the root (median): a rider is placed with that point on the
//           saddle (instead of the hips 0.09 m over it).
// Idempotent: the measured offset is relative to the sole_m the joint tracks were made with (joint_tracks v6 records it
// per clip), so running it twice, or on stale tracks, rewrites the same value. The measured offset is relative to what the page applies now: a clip whose clip_meta.json entry already carries a
// sole_m (and a page whose prepareClip applies it) is measured with it, so the new value is old + the residual.
//   node tools/clip_ground.mjs [--min 0.005] [--write-meta [--add-missing]]
//     -> gen/details/contacts/clip_ground.json; --write-meta merges sole_m / seat_m into web/public/assets/clip_meta.json
//        (only where the clip's n and duration match the entry, so a stale entry is never patched)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const MIN = +opt('--min', 0.005);
const rd = (p) => JSON.parse(fs.readFileSync(path.join(QM, p), 'utf8'));
const RULES = rd('characters/contacts.json');
const reg = rd('web/public/assets/chars/characters.json');
const metaFile = path.join(QM, 'web/public/assets/clip_meta.json');
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
const pageApplies = /sole_m/.test(fs.readFileSync(path.join(QM, 'web/src/people.js'), 'utf8'));
const r3 = (x) => Math.round(x * 1000) / 1000;
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const ruleOf = (c) => RULES.clips[c] || RULES.clips[c.split('~')[0]] || null;
// each shipped clip's hips key count (the GLB's JSON chunk): a clip_meta entry whose n differs is stale (the clip was
// rebuilt: an IK variant re-signed, re-resampled), and people.js ignores it, measuring the clip itself without sole_m;
// writing sole_m into it then diverged (old + residual each pass, never applied: official sit_talk~soles -0.035 ->
// -0.21, fix-inner 2026-10-13). Such an entry is measured again (--add-missing) and never patched (--write-meta).
const glbN = new Map();
const nOf = (file, clip) => {
  if (!glbN.has(file)) {
    const m = new Map();
    try {
      const b = fs.readFileSync(path.join(QM, 'web/public', file));
      const J = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'));
      for (const a of J.animations || []) {
        const ch = a.channels.find((c) => c.target.path === 'translation' && J.nodes[c.target.node]?.name === 'Hips');
        if (ch) m.set(a.name, J.accessors[a.samplers[ch.sampler].output].count);
      }
    } catch { /* no GLB */ }
    glbN.set(file, m);
  }
  return glbN.get(file).get(clip);
};
const isStale = (file, clip) => { const e = meta[file]?.[clip], n = nOf(file, clip); return !!e && n !== undefined && e.n !== n; };

const out = { about: 'tools/clip_ground.mjs: per character file and clip, sole_m (metres to add so the clip\'s ground contact sits on flat ground) and seat_m (ride clips: the seat site over the root); measured on gen/details/joints/.', page_applies_sole_m: pageApplies, date: new Date().toISOString(), files: {} };
let n = 0, big = 0, resid = 0, stale = 0;
const shared = [];
for (const [name, info] of Object.entries(reg)) {
  if (!info?.file) continue;
  const jf = path.join(QM, `gen/details/joints/${name}.json`);
  if (!fs.existsSync(jf)) continue;
  const j = JSON.parse(fs.readFileSync(jf, 'utf8'));
  const rows = {};
  for (const [clip, c] of Object.entries(j.clips)) {
    const rule = ruleOf(clip);
    const posture = rule?.posture || (/walk|run|quick|stroll/.test(clip) ? 'walk' : 'stand');
    const S = c.sites, N = c.n;
    const y = (s, i) => S[s][i * 3 + 1];
    // the sole_m these tracks were measured with (not meta's current value): a run on stale tracks then rewrites the
    // same value instead of adding the residual again (2026-10-13: repeated runs on stale tracks drove sole_m to -18 m)
    if (pageApplies && c.sole_m_tracked == null) { stale++; continue; } // null: the page ignored a stale clip_meta entry (joint_tracks v7 meta_stale)
    const applied = pageApplies ? c.sole_m_tracked : 0;
    if (c.hips_shared_with) { rows[clip] = { posture, shared_with: c.hips_shared_with }; shared.push(`${name} ${clip} (hips shared with ${c.hips_shared_with})`); continue; }
    if (posture === 'ride') {
      rows[clip] = { posture, seat_m: r3(median(Array.from({ length: N }, (_, i) => y('seat', i)))) };
      continue;
    }
    if (posture === 'walk' || c.locomotion) continue;
    // chair sits rest both feet: their mid-height goes on the ground (a clip whose feet sit 3 cm apart in height keeps
    // each within 1.5 cm); floor sits and lying: the lowest of seat and soles; standing: the lower (planted) sole
    const low = Array.from({ length: N }, (_, i) => (posture === 'floor' || posture === 'lie') ? Math.min(y('seat', i), y('sole_L', i), y('sole_R', i)) : Math.min(y('sole_L', i), y('sole_R', i)));
    // a chair clip whose rule rests only one sole on the floor (knee_on_stool: the other heel is up on the stool) is
    // grounded by that sole, as a standing clip is
    const floorSoles = (rule?.contacts || []).filter((k) => k.target === 'floor' && /^sole_/.test(k.site)).map((k) => k.site);
    const m = posture === 'chair' && floorSoles.length === 1
      ? median(Array.from({ length: N }, (_, i) => y(floorSoles[0], i)))
      : posture === 'chair'
        ? (median(Array.from({ length: N }, (_, i) => y('sole_L', i))) + median(Array.from({ length: N }, (_, i) => y('sole_R', i)))) / 2
        : median(low);
    const sole = r3(applied - m);
    rows[clip] = { posture, measured_m: r3(m), sole_m: Math.abs(sole) >= MIN ? sole : 0 };
    if (Math.abs(m) > 0.005) resid++;
    n++;
    if (Math.abs(sole) >= 0.03) big++;
  }
  out.files[info.file] = { character: name, clips: rows };
}
fs.writeFileSync(path.join(QM, 'gen/details/contacts/clip_ground.json'), JSON.stringify(out, null, 1) + '\n');
if (stale) console.log(`clip_ground: ${stale} clips skipped: their joint tracks predate tools/joint_tracks.mjs v6 (run joint_tracks first)`);
if (shared.length) console.log(`clip_ground: ${shared.length} clips left alone: their hips track is shared with another clip, so people.js can't lift them separately; build them with their own hips track:\n  ${shared.join('\n  ')}`);
console.log(`clip_ground: ${n} clips measured, ${big} of them corrected by 3 cm or more (sole_m), ${resid} still off by more than 5 mm as the page draws them now (page applies sole_m: ${pageApplies})`);
// --add-missing: a clip built after the last people_precompute run (an IK variant, a new retarget) gets its
// clip_meta.json entry measured by the page's own people.js prepareClip, run in node (tools/lib/three_node.mjs), so
// the page needn't measure it at load and its sole_m has an entry to ride on
if (args.includes('--add-missing')) {
  const { loadModels } = await import('./lib/three_node.mjs');
  const { CLIP_META } = await import(path.join(QM, 'web/src/people.js'));
  let added = 0;
  for (const [name, info] of Object.entries(reg)) {
    if (!info?.file || !out.files[info.file]) continue;
    const missing = (info.clips || []).filter((c) => !meta[info.file]?.[c] || isStale(info.file, c));
    for (const c of missing) if (meta[info.file]?.[c]) { console.log(`clip_meta.json: ${name} ${c} is stale (n ${meta[info.file][c].n}, the GLB's ${nOf(info.file, c)}): measured again`); delete meta[info.file][c]; }
    if (!missing.length) continue;
    await loadModels([name], reg, meta);
    const measured = CLIP_META[info.file] || {};
    for (const c of missing) if (measured[c]) { (meta[info.file] ||= {})[c] = Object.fromEntries(Object.entries(measured[c]).map(([k, v]) => [k, typeof v === 'number' ? +v.toPrecision(7) : v])); added++; }
  }
  console.log(`clip_meta.json: ${added} missing clips measured by people.js prepareClip (in node)`);
}
// an IK variant "<base>~<v>" of a walking clip walks as its base does: the page holds its forward travel by the
// base's locomotion, speed and stride (tools/ik_clip.mjs keeps the base's travel in the variant's hips track); a
// measure of the variant alone once read it as standing (its hips array shared with the base's, already held in
// place), and the page let carter push~cart_pusher_5727 walk 2.3 m into its cart (fix-gate, 2026-10-13)
let inherited = 0;
for (const [file, cs] of Object.entries(meta)) {
  for (const [c, e] of Object.entries(cs)) {
    const b = c.includes('~') ? cs[c.split('~')[0]] : null;
    if (!b || !e || !b.locomotion) continue;
    if (e.locomotion !== true || e.speed !== b.speed || e.stride !== b.stride) { Object.assign(e, { locomotion: true, speed: b.speed, stride: b.stride }); inherited++; }
  }
}
if (inherited) console.log(`clip_meta.json: ${inherited} IK variants of walking clips given their base's locomotion, speed and stride`);
if (args.includes('--write-meta')) {
  let w = 0, skipped = 0;
  for (const [file, f] of Object.entries(out.files)) {
    const jn = JSON.parse(fs.readFileSync(path.join(QM, `gen/details/joints/${f.character}.json`), 'utf8'));
    for (const [clip, r] of Object.entries(f.clips)) {
      const e = meta[file]?.[clip];
      const jc = jn.clips[clip];
      if (!e || Math.abs(e.duration - jc.duration) > 1e-3 || isStale(file, clip)) { skipped++; continue; }
      if (r.shared_with) { delete e.sole_m; w++; continue; } // not liftable on its own: a stale value would lift the clip it shares with
      if (r.sole_m !== undefined) { if (r.sole_m) e.sole_m = r.sole_m; else delete e.sole_m; }
      if (r.seat_m !== undefined) e.seat_m = r.seat_m;
      w++;
    }
  }
  fs.writeFileSync(metaFile, JSON.stringify(meta));
  console.log(`clip_meta.json: ${w} clips given sole_m/seat_m, ${skipped} without a matching entry (the page measures those itself)`);
}
