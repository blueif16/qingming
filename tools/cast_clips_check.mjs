#!/usr/bin/env node
// Every clip a shipped people.json asks for exists in the shipped characters.json: a missing clip silently plays idle
// on the page (people.js), so a seated or reaching figure would stand up. Run before every deploy and after any
// character build or people.json change (details pass, 2026-10-13: a rebuild with a stale IK-variant key dropped
// `sedan_carry~pole` and four more from characters.json while S4's people.json used them).
//   node tools/cast_clips_check.mjs            the shipped files (web/public/assets/<section>/people.json)
//   node tools/cast_clips_check.mjs --source   also the sources (sections/<section>/people.json), not yet shipped
// Exit 1 on any missing clip (FAIL), 0 otherwise.
// Per-clip files (perf batch 2, tools/clip_split.mjs): world.html loads each character as its body plus the clips a
// section's routines play (web/src/cast_clips.js castClips). Also checked, on the shipped files: every character's split
// is current (cut from the full GLB as it is now, every clip characters.json lists in the body or a file, every file
// there), and every clip a shipped people.json asks for is one castClips fetches with its section (else it would come
// late: idle first). A stale split doesn't break the page (it loads that full GLB) but costs the bytes, so it FAILs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { castClips } from '../web/src/cast_clips.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const reg = JSON.parse(fs.readFileSync(r('web/public/assets/chars/characters.json'), 'utf8'));
const clipsOf = (ch) => {
  const c = reg[ch]?.clips || [];
  return new Set(Array.isArray(c) ? c : Object.keys(c));
};

function check(file, label) {
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  const miss = [];
  // what the page fetches with the section (world.js castAs: own character, else stand-in, else the townsman)
  const fetched = castClips(p, (f) => (reg[f.character]?.file ? f.character : reg[f.stand_in]?.file ? f.stand_in : 'townsman'));
  const want = (who, ch, clip) => {
    if (ch && clip && reg[ch] && !clipsOf(ch).has(clip)) miss.push(`${label} ${who}: ${ch} has no "${clip}"`);
    else if (ch && clip && reg[ch]?.file && !fetched.get(ch)?.has(clip)) miss.push(`${label} ${who}: ${ch} "${clip}" is not fetched with the section (web/src/cast_clips.js)`);
  };
  for (const [id, s] of Object.entries(p.figures || {})) {
    // world.js plays `character` when it exists, else the stand_in
    const ch = reg[s.character] ? s.character : s.stand_in;
    for (const [clip] of s.do || []) want(id, ch, clip);
  }
  for (const [i, w] of (p.walkers || []).entries()) {
    const ch = reg[w.character] ? w.character : w.stand_in;
    want(w.figure || `walker ${i}`, ch, w.clip || 'walk');
    want(w.figure || `walker ${i}`, ch, (w.pause || ['idle'])[0]);
    for (const c of w.stops || []) want(w.figure || `walker ${i}`, ch, Array.isArray(c) ? c[0] : c);
  }
  return miss;
}

const dirs = [['shipped', (d) => r(`web/public/assets/${d}/people.json`)]];
if (process.argv.includes('--source')) dirs.push(['source', (d) => r(`sections/${d}/people.json`)]);
const sections = fs.readdirSync(r('sections')).filter((d) => fs.existsSync(r(`sections/${d}/people.json`)));
let all = [];
for (const [kind, f] of dirs) for (const d of sections) if (fs.existsSync(f(d))) all = all.concat(check(f(d), `${kind} ${d}`));
// the split: current for every character (as tools/clip_split.mjs --check)
let man = null;
try { man = JSON.parse(fs.readFileSync(r('web/public/assets/chars/clips.json'), 'utf8')); } catch { /* none */ }
const stale = [];
for (const [n, c] of Object.entries(reg)) {
  if (!c?.file) continue;
  const e = man?.chars?.[n];
  const src = crypto.createHash('sha256').update(fs.readFileSync(r(`web/public/${c.file}`))).digest('hex').slice(0, 8);
  const why = !e ? 'not split' : e.src !== src ? 'split from an older GLB' : !fs.existsSync(r(`web/public/${e.body}`)) ? 'no body file'
    : (c.clips || []).filter((k) => !e.base.includes(k) && !e.clips[k]).map((k) => `no file for "${k}"`).concat(Object.values(e.clips).filter((f) => !fs.existsSync(r(`web/public/${f}`))).map((f) => `missing ${f}`)).join(', ');
  if (why) stale.push(`split ${n}: ${why}`);
}
all = all.concat(stale.length ? [...stale, 'run: flock /tmp/qingming_charbuild.lock node tools/clip_split.mjs'] : []);
for (const m of all) console.log(m);
console.log(all.length ? `cast clips: FAIL (${all.length - (stale.length ? 1 : 0)} problems)` : `cast clips: PASS (split current for ${Object.values(reg).filter((c) => c?.file).length} characters)`);
process.exit(all.length ? 1 : 0);
