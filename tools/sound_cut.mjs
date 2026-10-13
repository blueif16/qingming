#!/usr/bin/env node
// Turns a generated sound set (tools/eleven.mjs) into the small files the world plays:
//   cut    one-shots: trim the silence round the sound; units with `slice: n` are cut into their n single hits
//          (steps, taps, brushes), each its own file, so code varies one short hit instead of shipping a long take;
//          loops (`loop: true`): the seam crossfaded (the tail laid over the head) so they repeat without a click
//                                                     -> gen/sounds/<set>/cut/<id>[_<k>].wav (48 kHz mono)
//   ship   loudness-matched (-20 LUFS, peaks under -1.5 dBTP), Opus in WebM, mono; one-shots 24 kb/s, loops 32 kb/s
//                                                     -> gen/sounds/<set>/ship/<name>.webm, sizes in ship.json
//   node tools/sound_cut.mjs <spec.json> [cut|ship|all] [--only a,b]
// The take used is the unit's `pick` (default 0). Mono: the world places every sound itself (equal-power panning).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [specPath, step = 'all', ...rest] = process.argv.slice(2);
const opt = (f, d) => (rest.includes(f) ? rest[rest.indexOf(f) + 1] : d);
const only = opt('--only') ? opt('--only').split(',') : null;
const SPEC = JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8'));
const DIR = path.join(ROOT, 'gen/sounds', path.basename(specPath, '.json'));
const CUT = path.join(DIR, 'cut'), SHIP = path.join(DIR, 'ship');
for (const d of [CUT, SHIP]) fs.mkdirSync(d, { recursive: true });
const SR = 48000;
const units = Object.entries(SPEC.units).filter(([id, u]) => u.kind === 'sfx' && (!only || only.includes(id)));

function decode(f) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}
function writeWav(f, a) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', f], { input: Buffer.from(a.buffer, a.byteOffset, a.byteLength) });
  if (r.status) throw new Error(r.stderr.toString());
}
const FR = 480; // 10 ms frames
function envelope(a) {
  const n = Math.floor(a.length / FR), e = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = i * FR; j < (i + 1) * FR; j++) s += a[j] * a[j]; e[i] = 10 * Math.log10(s / FR + 1e-12); }
  return e;
}
function fade(a, inS = 0.004, outS = 0.03) {
  const fi = Math.min(a.length, Math.round(inS * SR)), fo = Math.min(a.length, Math.round(outS * SR));
  for (let i = 0; i < fi; i++) a[i] *= i / fi;
  for (let i = 0; i < fo; i++) a[a.length - 1 - i] *= i / fo;
  return a;
}
// the span of a: from the first to the last frame within `below` dB of the loudest, padded
function trim(a, below = 40, padIn = 0.01, padOut = 0.08) {
  const e = envelope(a), max = Math.max(...e);
  let i0 = e.findIndex((v) => v > max - below), i1 = e.length - 1;
  while (i1 > i0 && e[i1] < max - below) i1--;
  const s0 = Math.max(0, i0 * FR - padIn * SR), s1 = Math.min(a.length, (i1 + 1) * FR + padOut * SR);
  return fade(a.slice(s0, s1));
}
// n single hits: the n strongest onsets (a rise of 6 dB within 30 ms, at least 120 ms apart), each up to the quietest
// point before the next one
function slice(a, n) {
  const e = envelope(a), max = Math.max(...e);
  const cand = [];
  for (let i = 3; i < e.length; i++) if (e[i] > max - 30 && e[i] - Math.min(e[i - 3], e[i - 2], e[i - 1]) > 6) cand.push(i);
  const onsets = [];
  for (const i of cand.sort((x, y) => e[y] - e[x])) if (onsets.every((o) => Math.abs(o - i) > 12)) onsets.push(i);
  const keep = onsets.slice(0, n).sort((x, y) => x - y);
  return keep.map((o, k) => {
    const next = keep[k + 1] ?? e.length;
    let cut = next - 1;
    for (let i = o + 3; i < next - 1; i++) if (e[i] < e[cut]) cut = i;
    const s0 = Math.max(0, (o - 2) * FR), s1 = Math.min(a.length, (k + 1 < keep.length ? cut : e.length) * FR);
    return trim(a.slice(s0, s1), 45, 0.005, 0.05);
  });
}
// a seamless loop: the last L samples crossfaded (equal power) over the first L; the result is L shorter
function loopify(a, L = Math.round(0.4 * SR)) {
  L = Math.min(L, Math.floor(a.length / 4));
  const out = a.slice(L);
  const n = out.length;
  for (let i = 0; i < L; i++) {
    const t = i / L;
    out[n - L + i] = a[a.length - L + i] * Math.cos((t * Math.PI) / 2) + a[i] * Math.sin((t * Math.PI) / 2);
  }
  return out;
}

if (step === 'cut' || step === 'all') {
  for (const [id, u] of units) {
    const src = path.join(DIR, `${id}_${u.pick ?? 0}.mp3`);
    if (!fs.existsSync(src)) { console.log(`! ${id}: no take`); continue; }
    for (const f of fs.readdirSync(CUT).filter((f) => f === `${id}.wav` || f.startsWith(`${id}_`) && /^\d+\.wav$/.test(f.slice(id.length + 1)))) fs.rmSync(path.join(CUT, f));
    const a = decode(src);
    if (u.loop) { writeWav(path.join(CUT, `${id}.wav`), loopify(a)); console.log(`~ ${id} loop`); }
    else if (u.slice) {
      const hits = slice(a, u.slice);
      hits.forEach((h, k) => writeWav(path.join(CUT, `${id}_${k}.wav`), h));
      console.log(`/ ${id}: ${hits.length} of ${u.slice} hits, ${hits.map((h) => (h.length / SR).toFixed(2)).join(' ')} s`);
    } else { const t = trim(a); writeWav(path.join(CUT, `${id}.wav`), t); console.log(`- ${id} ${(a.length / SR).toFixed(1)} -> ${(t.length / SR).toFixed(1)} s`); }
  }
}

if (step === 'ship' || step === 'all') {
  const sizes = {};
  const want = new Set(units.map(([id]) => id));
  for (const f of fs.readdirSync(CUT).filter((f) => f.endsWith('.wav'))) {
    const name = f.slice(0, -4), id = SPEC.units[name] ? name : name.replace(/_\d+$/, '');
    if (!want.has(id)) continue;
    const loop = !!SPEC.units[id]?.loop;
    const out = path.join(SHIP, `${name}.webm`);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(CUT, f), '-af', 'loudnorm=I=-20:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '1',
      '-c:a', 'libopus', '-b:a', loop ? '32k' : '24k', '-application', 'audio', out]);
    if (r.status) throw new Error(r.stderr.toString());
    sizes[name] = fs.statSync(out).size;
  }
  const prev = fs.existsSync(path.join(DIR, 'ship.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'ship.json'), 'utf8')) : {};
  const all = { ...prev, ...sizes };
  fs.writeFileSync(path.join(DIR, 'ship.json'), JSON.stringify(all, null, 1));
  const total = Object.values(all).reduce((s, v) => s + v, 0);
  console.log(`shipped ${Object.keys(sizes).length} files; set total ${Object.keys(all).length} files, ${(total / 1024).toFixed(0)} KB`);
}
