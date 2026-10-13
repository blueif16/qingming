#!/usr/bin/env node
// Which clips each character actually plays, across every section's people.json, and which it ships for nothing.
// Clips are most of a character's file (the idler shipped 29 clips, 873 KB), so clips nobody plays are trimmed from
// characters/<name>.json (skill `characters`; the user, 2026-10-11: "mind the sizings"). Always kept: walk, run and
// idle (any character can be your avatar, and idle is every routine's fallback), every clip a carried prop is bound to
// in characters.json, and clips the load-test traffic uses.
//   node tools/clips_used.mjs            the table: character, clips shipped, used, unused
//   node tools/clips_used.mjs --json     the same as JSON {character: {used: [...], unused: [...]}}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const reg = JSON.parse(fs.readFileSync(r('web/public/assets/chars/characters.json'), 'utf8'));
const used = Object.fromEntries(Object.keys(reg).map((n) => [n, new Set(['walk', 'run', 'idle'])]));
const use = (ch, clip) => { if (ch && clip && used[ch]) used[ch].add(clip); };

for (const dir of fs.readdirSync(r('sections'))) {
  const f = r(`sections/${dir}/people.json`);
  if (!fs.existsSync(f)) continue;
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const s of Object.values(p.figures || {})) {
    for (const ch of [s.character, s.stand_in]) for (const [clip] of s.do || []) use(ch, clip);
    if (s.ride) use(s.character, 'ride');
  }
  for (const w of p.walkers || []) {
    for (const ch of [w.character, w.stand_in]) {
      use(ch, w.clip || 'walk');
      use(ch, (w.pause || ['idle'])[0]);
      for (const c of w.stops || []) use(ch, c);
    }
  }
  for (const k of p.load_test_traffic?.kinds || []) {
    use(k.character, k.clip || 'walk');
    for (const c of [...(k.stops || []), ...(k.talk || [])]) use(k.character, c);
  }
}
// a carried prop's own clip stays with it
for (const [n, c] of Object.entries(reg)) for (const clip of Object.values(c.props || {})) if (used[n]) used[n].add(clip);

const out = {};
for (const [n, c] of Object.entries(reg)) out[n] = { used: c.clips.filter((x) => used[n].has(x)), unused: c.clips.filter((x) => !used[n].has(x)) };
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
const kb = (n) => (fs.existsSync(r(`web/public/assets/chars/${n}.glb`)) ? Math.round(fs.statSync(r(`web/public/assets/chars/${n}.glb`)).size / 1024) : 0);
console.log('| character | KB | clips | used | unused |\n|---|---|---|---|---|');
for (const [n, o] of Object.entries(out)) console.log(`| ${n} | ${kb(n)} | ${reg[n].clips.length} | ${o.used.length} | ${o.unused.join(', ') || '-'} |`);
