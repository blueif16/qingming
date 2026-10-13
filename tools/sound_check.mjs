#!/usr/bin/env node
// Checks a generated sound set (tools/eleven.mjs) before anyone listens:
//   every clip  loudness (LUFS, EBU R128), true peak, share of near-silence
//   loops       the seam: level and waveform jump between the last and first 20 ms
//   lines       ElevenLabs speech-to-text (scribe_v2) against the script: character error rate (tags and punctuation out)
//   beds        speech-to-text with audio-event tags: words or music in a bed are a fault
//   node tools/sound_check.mjs <spec.json> [--no-stt]   -> gen/sounds/<set>/check.json, check.md
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [specPath, ...rest] = process.argv.slice(2);
const SPEC = JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8'));
const SET = path.basename(specPath, '.json');
const DIR = path.join(ROOT, 'gen/sounds', SET);
const KEY = fs.readFileSync(path.join(os.homedir(), '.elevenlabs_key'), 'utf8').split('\n')[0].trim();
const stt = !rest.includes('--no-stt');

const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
function loudness(f) {
  const e = ff(['-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr;
  const sum = e.slice(e.lastIndexOf('Summary:'));
  const num = (re) => +(sum.match(re)?.[1] ?? NaN);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), peak_dbtp: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}
function pcm(f) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
const rms = (a, i0, i1) => { let s = 0; for (let i = i0; i < i1; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, i1 - i0)); };
const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);
function silence(a) { // share of 50 ms windows below -50 dBFS
  const w = 2400; let n = 0, q = 0;
  for (let i = 0; i + w <= a.length; i += w, n++) if (db(rms(a, i, i + w)) < -50) q++;
  return n ? q / n : 0;
}
function seam(a) { // a looped clip played end-to-start: level step and the sample jump at the join
  const w = 960; // 20 ms
  const end = db(rms(a, a.length - w, a.length)), start = db(rms(a, 0, w));
  const body = rms(a, 0, a.length);
  return { level_step_db: +(start - end).toFixed(1), jump_vs_rms: +(Math.abs(a[0] - a[a.length - 1]) / (body || 1)).toFixed(2) };
}

async function transcribe(f) {
  const fd = new FormData();
  fd.append('model_id', 'scribe_v2');
  fd.append('tag_audio_events', 'true');
  fd.append('file', new Blob([fs.readFileSync(f)]), path.basename(f));
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': KEY }, body: fd });
  if (!res.ok) throw new Error(`stt ${res.status} ${await res.text()}`);
  const d = await res.json();
  return { text: d.text, language: d.language_code, events: (d.words || []).filter((w) => w.type === 'audio_event').map((w) => w.text) };
}
const clean = (s) => s.replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/[\s\p{P}\p{S}]/gu, '');
function cer(ref, hyp) {
  const a = [...clean(ref)], b = [...clean(hyp)];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return a.length ? prev[b.length] / a.length : 0;
}

const out = {};
for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.mp3')).sort()) {
  const id = f.replace(/_\d+\.mp3$/, ''), u = SPEC.units[id] || {};
  const p = path.join(DIR, f), a = pcm(p);
  const r = { unit: id, kind: u.kind, ...loudness(p), silence: +silence(a).toFixed(2) };
  if (u.loop) r.seam = seam(a);
  if (stt && u.kind === 'tts') {
    const t = await transcribe(p);
    Object.assign(r, { heard: t.text, cer: +cer(u.text, t.text).toFixed(2), events: t.events });
  }
  if (stt && u.kind === 'sfx' && /^bed_/.test(id)) {
    const t = await transcribe(p);
    r.heard = t.text; r.events = t.events;
  }
  out[f] = r;
  console.log(f, JSON.stringify(r));
}
fs.writeFileSync(path.join(DIR, 'check.json'), JSON.stringify(out, null, 1));
const md = ['| clip | LUFS | peak dBTP | silence | seam | heard | CER |', '|---|---|---|---|---|---|---|'];
for (const [f, r] of Object.entries(out)) {
  md.push(`| ${f} | ${r.lufs} | ${r.peak_dbtp} | ${r.silence} | ${r.seam ? `${r.seam.level_step_db} dB, ${r.seam.jump_vs_rms}` : ''} | ${(r.heard || '').replace(/\|/g, '/')}${r.events?.length ? ` {${r.events.join(', ')}}` : ''} | ${r.cer ?? ''} |`);
}
fs.writeFileSync(path.join(DIR, 'check.md'), md.join('\n') + '\n');
