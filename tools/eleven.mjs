#!/usr/bin/env node
// ElevenLabs sounds and voices for the world's life layer (gen/life/design.md). A set is a JSON spec of units:
//   voices  { <name>: { description, model?, text } }  a voice designed from words (free accounts can't use library
//           voices over the API); its previews speak `text` (100-1000 chars, our lines), so they are samples too
//   units   { <id>: { kind: 'sfx', prompt, seconds, loop?, influence? } | { kind: 'tts', voice, text, model?, stability? } }
//           tts voice = a designed voice saved with `save`, or a premade voice id
//   node tools/eleven.mjs <spec.json> [status|sfx|design|save|tts|all] [--only a,b] [--takes 2] [--force]
//   sfx     sound effects                   -> gen/sounds/<set>/<id>_<take>.mp3
//   design  three previews per voice         -> gen/sounds/<set>/voice_<name>_<k>.mp3 (+ generated ids in the manifest)
//   save    keep preview k of a voice: --only <name> --take <k>  (uses one of the account's voice slots)
//   tts     the lines                        -> gen/sounds/<set>/<id>_<take>.mp3
// Each unit is cached by a hash of its request (gen/sounds/<set>/manifest.json): a changed prompt redoes only that unit.
// The key is the first line of ~/.elevenlabs_key. Free tier: non-commercial, credit "elevenlabs.io".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [specPath, step = 'status', ...rest] = process.argv.slice(2);
if (!specPath) { console.error('usage: node tools/eleven.mjs <spec.json> [status|sfx|design|save|tts|all] [--only a,b] [--takes n] [--force]'); process.exit(1); }
const opt = (f, d) => (rest.includes(f) ? rest[rest.indexOf(f) + 1] : d);
const force = rest.includes('--force');
const only = opt('--only') ? opt('--only').split(',') : null;
const SPEC = JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8'));
const SET = path.basename(specPath, '.json');
const OUT = path.join(ROOT, 'gen/sounds', SET);
fs.mkdirSync(OUT, { recursive: true });
const MAN = path.join(OUT, 'manifest.json');
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { units: {}, voices: {} };
const saveMan = () => fs.writeFileSync(MAN, JSON.stringify(man, null, 1));
const KEY = fs.readFileSync(path.join(os.homedir(), '.elevenlabs_key'), 'utf8').split('\n')[0].trim();
const API = 'https://api.elevenlabs.io';
const FORMAT = 'mp3_44100_128';
const hash = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 12);
const pick = (o) => Object.entries(o || {}).filter(([k]) => !only || only.includes(k));

async function call(route, body, { binary = false } = {}) {
  const res = await fetch(`${API}${route}`, { method: body ? 'POST' : 'GET', headers: { 'xi-api-key': KEY, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!res.ok) throw new Error(`${route}: ${res.status} ${await res.text()}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
}
const credits = async () => { const s = await call('/v1/user/subscription'); return s.character_limit - s.character_count; };

async function sfx() {
  const takes = +opt('--takes', 1);
  for (const [id, u] of pick(SPEC.units).filter(([, u]) => u.kind === 'sfx')) {
    const req = { text: u.prompt, duration_seconds: u.seconds ?? null, prompt_influence: u.influence ?? 0.3, loop: !!u.loop, model_id: 'eleven_text_to_sound_v2' };
    const h = hash(req), have = man.units[id];
    if (!force && have?.hash === h && have.takes >= takes) { console.log(`= ${id}`); continue; }
    for (let t = have?.hash === h && !force ? have.takes : 0; t < takes; t++) {
      fs.writeFileSync(path.join(OUT, `${id}_${t}.mp3`), await call(`/v1/sound-generation?output_format=${FORMAT}`, req, { binary: true }));
      console.log(`+ ${id}_${t}`);
      man.units[id] = { kind: 'sfx', hash: h, takes: t + 1, req };
      saveMan();
    }
  }
}

async function design() {
  for (const [name, v] of pick(SPEC.voices)) {
    const req = { voice_description: v.description, model_id: v.model || 'eleven_ttv_v3', text: v.text, ...(v.guidance ? { guidance_scale: v.guidance } : {}) };
    const h = hash(req);
    if (!force && man.voices[name]?.hash === h) { console.log(`= voice ${name}`); continue; }
    const res = await call('/v1/text-to-voice/design?output_format=' + FORMAT, req);
    const previews = res.previews.map((p, k) => {
      fs.writeFileSync(path.join(OUT, `voice_${name}_${k}.mp3`), Buffer.from(p.audio_base_64, 'base64'));
      return p.generated_voice_id;
    });
    man.voices[name] = { hash: h, req, previews, saved: null };
    saveMan();
    console.log(`+ voice ${name}: ${previews.length} previews`);
  }
}

async function save() {
  const k = +opt('--take', 0);
  for (const [name, v] of pick(SPEC.voices)) {
    const m = man.voices[name];
    if (!m) { console.log(`! voice ${name} not designed`); continue; }
    const res = await call('/v1/text-to-voice', { voice_name: `qingming_${name}`, voice_description: v.description, generated_voice_id: m.previews[k] });
    m.saved = { take: k, voice_id: res.voice_id };
    saveMan();
    console.log(`+ saved ${name} take ${k}: ${res.voice_id}`);
  }
}

async function tts() {
  const takes = +opt('--takes', 1);
  for (const [id, u] of pick(SPEC.units).filter(([, u]) => u.kind === 'tts')) {
    const voiceId = man.voices[u.voice]?.saved?.voice_id || (SPEC.voices?.[u.voice] ? null : u.voice);
    if (!voiceId) { console.log(`! ${id}: voice ${u.voice} not saved yet`); continue; }
    const req = { text: u.text, model_id: u.model || 'eleven_v3', voice_settings: { stability: u.stability ?? 0.5 }, voice: voiceId };
    const h = hash(req), have = man.units[id];
    if (!force && have?.hash === h && have.takes >= takes) { console.log(`= ${id}`); continue; }
    const { voice, ...body } = req;
    for (let t = have?.hash === h && !force ? have.takes : 0; t < takes; t++) {
      fs.writeFileSync(path.join(OUT, `${id}_${t}.mp3`), await call(`/v1/text-to-speech/${voice}?output_format=${FORMAT}`, body, { binary: true }));
      console.log(`+ ${id}_${t}`);
      man.units[id] = { kind: 'tts', hash: h, takes: t + 1, req };
      saveMan();
    }
  }
}

const before = await credits();
if (step === 'sfx' || step === 'all') await sfx();
if (step === 'design' || step === 'all') await design();
if (step === 'save') await save();
if (step === 'tts' || step === 'all') await tts();
if (step === 'status') {
  for (const [id, u] of Object.entries(SPEC.units || {})) console.log(`${man.units[id] ? 'done' : '    '} ${u.kind} ${id}`);
  for (const name of Object.keys(SPEC.voices || {})) console.log(`${man.voices[name] ? (man.voices[name].saved ? 'saved' : 'design') : '     '} voice ${name}`);
}
const after = await credits();
console.log(`credits left: ${after}${after !== before ? ` (used ${before - after})` : ''}`);
