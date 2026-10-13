#!/usr/bin/env node
// Character pipeline: one figure from the scroll -> a rigged, animated, web-ready character.
//
//   node tools/character.mjs <name|all> [status|ref|sheet|views|mesh|clips|build|review|all] [--force] [--dry-run]
//
// A character is characters/<name>.json (the scroll figure and its crop, the prompt, height, clips).
// Each step composes one of the existing atomic scripts and is cached by a key over its inputs, so editing a
// prompt or a crop redoes exactly what depends on it:
//   ref     crop the figure out of the section's registered restyle (gen/sections/<s>/mosaic.jpg, 2x the scan)
//   sheet   tools/shyfai_image.py: [style_B1.png, ref.png] + prompts/char_turnaround.txt (with {character} =
//           prompts/<prompt>.txt) -> a front | side | back turnaround sheet
//   views   split the sheet into front.png, side.png, back.png (same scale), plus views.jpg for review
//   mesh    tools/char_pipeline.py: Meshy Smart Topology (front) -> 3-view retexture -> rig  (about 30 credits)
//   motions tools/meshy_task.py text-to-motion: each custom action in characters/motions.json, from its prompt
//           prompts/motion_<name>.txt -> gen/motions/<name>/  (prime 10 credits, swift 3); shared by all characters
//   clips   tools/char_pipeline.py --rig-task: one Meshy library action per numeric clip  (3 credits each);
//           tools/meshy_task.py animations: each "motion:<name>" clip retargeted onto this rig (motion_task_id)
//   build   tools/build_character.mjs (rig + named clips in one GLB) -> gltf-transform optimize (meshopt, webp
//           512) -> web/public/assets/chars/<name>.glb, and rewrites web/public/assets/chars/characters.json
//   review  gen/characters/review.jpg: ref | front | side | back for every character
// Clips: "rig:walking" / "rig:running" are the rig task's own walk and run; a number is a Meshy animation
// library action_id (catalog: reference/meshy/animation_library.json); "motion:<name>" is a custom action from
// characters/motions.json. Meshy keeps a motion task for 3 days: retarget within that window. After that the
// motion step regenerates it (a new take), while every clip already retargeted stays in gen/.
// Legacy characters (porter, townsman) name their old rig_dir / anim_dir and skip ref, sheet, views and mesh.
// Outputs go to gen/characters/<name>/.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const r = (p) => path.join(ROOT, p);
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const [target, step = 'status'] = args.filter((a) => !a.startsWith('--'));
if (!target) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 29).join('\n')); process.exit(1); }

const STYLE = 'prompts/style_B1.png', MODEL = 'gpt-image-2.5', SHEET_SIZE = '1536x1024';
const names = target === 'all' ? fs.readdirSync(r('characters')).filter((f) => f.endsWith('.json') && !['motions.json', 'props.json'].includes(f)).map((f) => f.slice(0, -5)).sort() : target.split(',');
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
// Meshy accounts: a task belongs to the account that made it, so a character's whole chain (mesh, retexture, rig,
// clips, the custom motions retargeted onto it) runs with one key. characters/<name>.json "account" names it by the
// key's first characters (as tools/meshy_key.sh masks it), looked up in ~/.meshy_keys; without one, MESHY_API_KEY.
const KEYS_FILE = process.env.MESHY_KEYS_FILE || path.join(os.homedir(), '.meshy_keys');
const KEYS = fs.existsSync(KEYS_FILE) ? fs.readFileSync(KEYS_FILE, 'utf8').split('\n').map((k) => k.trim()).filter(Boolean) : [];
function keyFor(acct) {
  if (!acct) return process.env.MESHY_API_KEY;
  const k = KEYS.find((x) => x.startsWith(acct));
  if (!k) throw new Error(`no Meshy key starting ${acct} in ${KEYS_FILE}`);
  return k;
}
const envFor = (acct) => ({ ...process.env, MESHY_API_KEY: keyFor(acct) });
const acctOf = (c) => c.cfg.account || '';
const fileSha = (p) => sha(fs.readFileSync(r(p)));
const exists = (p) => fs.existsSync(r(p));
const readKey = (p) => (exists(p) ? fs.readFileSync(r(p), 'utf8') : null);

function prompt(pname, vars, seen = new Set()) {
  if (seen.has(pname)) throw new Error(`prompt loop at ${pname}`);
  const text = fs.readFileSync(r(`prompts/${pname}.txt`), 'utf8').trim();
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ? prompt(vars[k], vars, new Set([...seen, pname]))
    : exists(`prompts/${k}.txt`) ? prompt(k, vars, new Set([...seen, pname])) : m));
}

function character(name) {
  const cfg = JSON.parse(fs.readFileSync(r(`characters/${name}.json`), 'utf8'));
  const out = `gen/characters/${name}`;
  const meshy = `${out}/meshy`;
  const c = {
    name, cfg, out, legacy: !!cfg.legacy,
    ref: `${out}/ref.png`, sheet: `${out}/sheet_0.png`, views: ['front', 'side', 'back'].map((v) => `${out}/${v}.png`),
    rigDir: cfg.rig_dir || `${meshy}/3_rig`, animDir: cfg.anim_dir || meshy, meshyDir: meshy,
    raw: `${out}/${name}_raw.glb`, glb: `web/public/assets/chars/${name}.glb`,
  };
  c.rigged = `${c.rigDir}/result_rigged_character_glb_url.glb`;
  c.rigId = () => (exists(`${c.rigDir}/task.json`) ? JSON.parse(fs.readFileSync(r(`${c.rigDir}/task.json`), 'utf8')).id : null);
  return c;
}

// ---- cache keys ------------------------------------------------------------------------
const keys = {
  ref: (c) => sha(JSON.stringify(c.cfg.figure) + (c.cfg.figure.src !== 'scan' && exists(`gen/sections/${c.cfg.figure.section}/mosaic.jpg`) ? fileSha(`gen/sections/${c.cfg.figure.section}/mosaic.jpg`) : '')),
  sheet: (c) => (exists(c.ref) ? sha(JSON.stringify({ prompt: sheetPrompt(c), model: MODEL, size: SHEET_SIZE, refs: [fileSha(STYLE), fileSha(c.ref)] })) : null),
  views: (c) => (exists(c.sheet) ? fileSha(c.sheet) : null),
  mesh: (c) => (c.views.every(exists) ? sha(JSON.stringify({ views: c.views.map(fileSha), h: c.cfg.height_m, polys: c.cfg.polys || 4000 })) : null),
};
const sheetPrompt = (c) => prompt('char_turnaround', { character: c.cfg.prompt });
const keyFile = (c, s) => `${c.out}/${s}.key`;
function state(c, s) {
  if (c.legacy && ['ref', 'sheet', 'views', 'mesh'].includes(s)) return 'legacy';
  const outputs = { ref: [c.ref], sheet: [c.sheet], views: c.views, mesh: [c.rigged] }[s];
  if (!outputs.every(exists)) return 'missing';
  const k = keys[s](c);
  return k && readKey(keyFile(c, s)) === k ? 'ok' : 'stale';
}
const want = (c, s) => flag('--force') || state(c, s) === 'missing' || state(c, s) === 'stale';
const writeKey = (c, s) => fs.writeFileSync(r(keyFile(c, s)), keys[s](c));

// ---- custom motions (shared by every character) ------------------------------------------
const PROPS = exists('characters/props.json') ? JSON.parse(fs.readFileSync(r('characters/props.json'), 'utf8')) : {};
const MOTIONS = exists('characters/motions.json') ? JSON.parse(fs.readFileSync(r('characters/motions.json'), 'utf8')) : {};
// gen/motions/<m>/ holds the first account's takes (msy_czMs, retired 2026-10-12: the original 8 characters' rigs live
// there); every other account's take of the same motion lives in gen/motions/<m>/<account>/.
const FIRST_ACCT = 'msy_czMs';
const motionDir = (m, acct = '') => (acct && acct !== FIRST_ACCT ? `gen/motions/${m}/${acct}` : `gen/motions/${m}`);
const motionPrompt = (m) => fs.readFileSync(r(`prompts/${MOTIONS[m].prompt || `motion_${m}`}.txt`), 'utf8').trim();
const motionKey = (m) => sha(JSON.stringify({ prompt: motionPrompt(m), duration: MOTIONS[m].duration, mode: MOTIONS[m].mode || 'prime' }));
function motionTask(m, acct = '') {
  const f = `${motionDir(m, acct)}/task.json`;
  return exists(f) ? JSON.parse(fs.readFileSync(r(f), 'utf8')) : null;
}
function motionState(m, acct = '') {
  const t = motionTask(m, acct);
  if (!t || t.status !== 'SUCCEEDED') return 'missing';
  if (readKey(`${motionDir(m, acct)}/motion.key`) !== motionKey(m)) return 'stale';
  return t.expires_at && t.expires_at < Date.now() ? 'expired' : 'ok';
}
// A motion is made once per account that has a character needing it, and only while some listed character still has
// to have it retargeted (a motion only lives 3 days at Meshy; an expired one whose retargets are all done is left alone).
function motions(list) {
  const need = new Map();
  for (const c of list) for (const st of clipStates(c)) {
    if (st.motion && (st.state !== 'ok' || flag('--force'))) need.set(`${st.motion}|${acctOf(c)}`, [st.motion, acctOf(c)]);
    // a t2m: clip needs the take (its FBX) in the account it names; it is then retargeted locally, for free
    if (typeof st.src === 'string' && st.src.startsWith('t2m:') && !st.fbx) { const [m, a = ''] = st.src.slice(4).split('@'); need.set(`${m}|${a}`, [m, a]); }
  }
  const todo = [...need.values()].filter(([m, acct]) => flag('--force') || motionState(m, acct) !== 'ok');
  if (!todo.length) return;
  const label = ([m, acct]) => `${m}${acct ? '@' + acct : ''}`;
  if (flag('--dry-run')) { console.log('would generate motions:', todo.map((x) => `${label(x)} (${motionState(...x)})`).join(' ')); return; }
  return Promise.all(todo.map(([m, acct]) => new Promise((res, rej) => {
    if (!MOTIONS[m]) return rej(new Error(`motion ${m} is not in characters/motions.json`));
    const dir = motionDir(m, acct);
    fs.mkdirSync(r(dir), { recursive: true });
    const body = `${dir}/body.json`;
    fs.writeFileSync(r(body), JSON.stringify({ prompt: motionPrompt(m), mode: MOTIONS[m].mode || 'prime', duration: MOTIONS[m].duration }));
    const log = fs.openSync(r(`${dir}/run.log`), 'a');
    const { spawn } = createRequire(import.meta.url)('node:child_process');
    spawn('python3', ['-I', 'tools/meshy_task.py', 'text-to-motion', dir, '@' + body], { cwd: ROOT, stdio: ['ignore', log, log], env: envFor(acct) }).on('exit', (code) => {
      if (code) return rej(new Error(`motion ${label([m, acct])} failed, see ${dir}/run.log`));
      fs.writeFileSync(r(`${dir}/motion.key`), motionKey(m));
      console.log(`motion ${label([m, acct])}: ${motionTask(m, acct).id}`);
      res();
    });
  })));
}

function clipStates(c) {
  return Object.entries(c.cfg.clips).map(([clip, src]) => clipState(c, clip, src));
}
function clipState(c, clip, src, depth = 0) {
  const rigId = c.rigId();
  {
    if (typeof src === 'string' && src.startsWith('t2m:')) {
      // "t2m:<motion>[@<account>]": a Text to Motion take (its FBX, on Meshy's SMPL-H skeleton, converted once by
      // tools/motion_fbx2glb.py) retargeted onto this rig locally: free, any account, and the FBX never expires
      const [m, acct = ''] = src.slice(4).split('@');
      const dir = motionDir(m, acct), fbx = `${dir}/result_motion_url.fbx`, smpl = `${dir}/motion_smpl.glb`;
      const file = `${c.out}/local/${clip}.glb`;
      if (!exists(fbx) || !exists(c.rigged)) return { clip, src, file, local: true, state: `missing (${exists(fbx) ? 'rig' : 'motion ' + m + (acct ? '@' + acct : '')} not made)` };
      const key = sha(fileSha(fbx) + fileSha(c.rigged) + fileSha('tools/retarget_local.mjs'));
      return { clip, src, file, local: true, fbx, srcFile: smpl, key, state: exists(file) && readKey(`${file}.key`) === key ? 'ok' : 'missing' };
    }
    if (typeof src === 'string' && src.startsWith('from:')) {
      // "from:<character>/<clip>": that character's clip retargeted onto this rig locally (tools/retarget_local.mjs),
      // free and across Meshy accounts
      const [sName, sClip] = src.slice(5).split('/');
      const sc = character(sName);
      if (depth > 4 || !(sClip in sc.cfg.clips)) return { clip, src, file: `${c.out}/local/${clip}.glb`, local: true, state: 'missing (no such source clip)' };
      const ss = clipState(sc, sClip, sc.cfg.clips[sClip], depth + 1);
      const file = `${c.out}/local/${clip}.glb`;
      if (!ss || ss.state !== 'ok' || !exists(c.rigged)) return { clip, src, file, local: true, state: 'missing (source or rig not ready)' };
      const key = sha(fileSha(ss.file) + fileSha(c.rigged) + fileSha('tools/retarget_local.mjs'));
      return { clip, src, file, local: true, srcFile: ss.file, key, state: exists(file) && readKey(`${file}.key`) === key ? 'ok' : 'missing' };
    }
    if (typeof src === 'string' && src.startsWith('motion:')) {
      const m = src.slice(7), dir = `${c.animDir}/4_motion_${m}`, file = `${dir}/result_animation_glb_url.glb`;
      if (!exists(file)) return { clip, src, file, motion: m, state: 'missing' };
      const t = JSON.parse(fs.readFileSync(r(`${dir}/task.json`), 'utf8'));
      return { clip, src, file, motion: m, state: t.body.rig_task_id !== rigId ? 'stale (other rig)' : motionState(m, acctOf(c)) === 'stale' ? 'stale (prompt changed)' : t.body.motion_task_id !== motionTask(m, acctOf(c))?.id ? 'stale (new motion)' : 'ok' };
    }
    if (typeof src === 'string') {
      const file = `${c.rigDir}/result_basic_animations_${src.split(':')[1]}_glb_url.glb`;
      return { clip, src, file, state: exists(file) ? 'ok' : 'missing (comes with the rig)' };
    }
    const dir = `${c.animDir}/4_anim_${src}`, file = `${dir}/result_animation_glb_url.glb`;
    if (!exists(file)) return { clip, src, file, state: 'missing' };
    const t = JSON.parse(fs.readFileSync(r(`${dir}/task.json`), 'utf8'));
    return { clip, src, file, state: t.body.rig_task_id === rigId ? 'ok' : 'stale (other rig)' };
  }
}

// ---- steps ---------------------------------------------------------------------------
async function ref(c) {
  if (!want(c, 'ref')) return;
  const { section, crop: [x0, y0, x1, y1], src } = c.cfg.figure;
  // figure.src "scan": crop the scan itself (a section with no registered restyle yet, e.g. S7)
  const scan = src === 'scan';
  const [SX, SY] = scan ? [0, 0] : JSON.parse(fs.readFileSync(r(`sections/${section}/section.json`), 'utf8')).rect, k = scan ? 1 : 2;
  const srcFile = scan ? 'reference/scroll/qingming_commons_38414x1800.jpg' : `gen/sections/${section}/mosaic.jpg`;
  fs.mkdirSync(r(c.out), { recursive: true });
  const w = (x1 - x0) * k, h = (y1 - y0) * k, up = Math.max(1, 1024 / Math.max(w, h));
  await sharp(r(srcFile), { limitInputPixels: false })
    .extract({ left: (x0 - SX) * k, top: (y0 - SY) * k, width: w, height: h })
    .resize(Math.round(w * up), Math.round(h * up), { kernel: 'lanczos3' }).png().toFile(r(c.ref));
  writeKey(c, 'ref');
  console.log(`${c.name}: ref ${c.ref} (scan ${x0},${y0}-${x1},${y1})`);
}

function sheets(list) {
  const jobs = list.filter((c) => want(c, 'sheet'));
  if (!jobs.length) return;
  if (flag('--dry-run')) { console.log('would generate sheets:', jobs.map((c) => c.name).join(' ')); return; }
  const file = 'gen/characters/jobs_sheet.jsonl';
  fs.writeFileSync(r(file), jobs.map((c) => JSON.stringify({ out: `${c.out}/sheet`, prompt: sheetPrompt(c), ref: [STYLE, c.ref], model: MODEL, size: SHEET_SIZE, format: 'png' })).join('\n') + '\n');
  const mtime = (c) => (exists(c.sheet) ? fs.statSync(r(c.sheet)).mtimeMs : 0);
  const before = jobs.map(mtime);
  const p = spawnSync('python3', ['-I', 'tools/shyfai_image.py', '--batch', file, '--jobs', '3', '--timeout', '900'], { cwd: ROOT, stdio: 'inherit' });
  jobs.forEach((c, i) => { if (mtime(c) > before[i]) writeKey(c, 'sheet'); });
  if (p.status) console.log('some sheets failed; rerun the sheet step to retry only those');
}

// Split the turnaround sheet into its three figures. Background = the median border colour; a figure is a run of
// columns with foreground pixels. All three views share one crop height so their scale matches.
async function views(c) {
  if (!want(c, 'views') || !exists(c.sheet)) return;
  const { data, info } = await sharp(r(c.sheet)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, px = (x, y) => (y * W + x) * 3;
  const border = [];
  for (let x = 0; x < W; x += 4) border.push(px(x, 2), px(x, H - 3));
  for (let y = 0; y < H; y += 4) border.push(px(2, y), px(W - 3, y));
  const med = [0, 1, 2].map((ch) => border.map((i) => data[i + ch]).sort((a, b) => a - b)[border.length >> 1]);
  const fg = (x, y) => { const i = px(x, y); return Math.abs(data[i] - med[0]) + Math.abs(data[i + 1] - med[1]) + Math.abs(data[i + 2] - med[2]) > 40; };
  const col = new Array(W).fill(0);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (fg(x, y)) col[x]++;
  const runs = [];
  for (let x = 0, start = -1, gap = 0; x <= W; x++) {
    const on = x < W && col[x] > 2;
    if (on) { if (start < 0) start = x; gap = 0; } else if (start >= 0 && (++gap > 10 || x === W)) { runs.push([start, x - gap]); start = -1; gap = 0; }
  }
  const figs = runs.filter(([a, b]) => b - a > 40).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0])).slice(0, 3).sort((p, q) => p[0] - q[0]);
  if (figs.length !== 3) throw new Error(`${c.name}: found ${figs.length} figures in the sheet, expected 3 (check ${c.sheet})`);
  let top = H, bottom = 0;
  for (const [a, b] of figs) for (let x = a; x <= b; x++) for (let y = 0; y < H; y++) if (fg(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  const m = 24, fw = Math.max(...figs.map(([a, b]) => b - a + 1)) + 2 * m, fh = bottom - top + 1 + 2 * m;
  const bg = { r: med[0], g: med[1], b: med[2] };
  const bufs = [];
  for (let i = 0; i < 3; i++) {
    const [a, b] = figs[i], w = b - a + 1;
    const img = await sharp(r(c.sheet)).removeAlpha().extract({ left: a, top, width: w, height: bottom - top + 1 })
      .extend({ left: Math.floor((fw - w) / 2), right: Math.ceil((fw - w) / 2), top: m, bottom: m, background: bg }).png().toBuffer();
    fs.writeFileSync(r(c.views[i]), img);
    bufs.push(img);
  }
  writeKey(c, 'views');
  await reviewRow(c, `${c.out}/views.jpg`);
  console.log(`${c.name}: views ${fw}x${fh} (sheet bg ${med.join(',')}), figures at x ${figs.map((f) => f.join('-')).join(', ')}`);
}

function mesh(c) {
  if (!want(c, 'mesh')) return;
  if (!c.views.every(exists)) { console.log(`${c.name}: no views yet; run sheet and views first`); return; }
  if (flag('--dry-run')) { console.log(`${c.name}: would run Meshy mesh -> retexture -> rig (about 30 credits)`); return; }
  const p = spawnSync('python3', ['-I', 'tools/char_pipeline.py', c.meshyDir, ...c.views, '--height', String(c.cfg.height_m), '--polys', String(c.cfg.polys || 4000), '--actions', ''],
    { cwd: ROOT, env: envFor(acctOf(c)), stdio: ['ignore', fs.openSync(r(`${c.out}/meshy.log`), 'a'), fs.openSync(r(`${c.out}/meshy.log`), 'a')] });
  if (p.status) throw new Error(`${c.name}: Meshy pipeline failed, see ${c.out}/meshy.log`);
  writeKey(c, 'mesh');
  console.log(`${c.name}: rigged (${c.rigId()})`);
}

const fetchable = (s) => typeof s.src === 'number' || !!s.motion;
// local retargets (free): made by the clips and build steps
function makeLocal(c) {
  for (const s of clipStates(c).filter((q) => q.local && q.state === 'missing')) {
    fs.mkdirSync(r(path.dirname(s.file)), { recursive: true });
    if (s.fbx && !exists(s.srcFile)) {
      execFileSync(r('tools/blender_slot.sh'), ['-b', '--factory-startup', '--python', r('tools/motion_fbx2glb.py'), '--',
        execFileSync('wslpath', ['-w', r(s.fbx)]).toString().trim(), execFileSync('wslpath', ['-w', r(s.srcFile)]).toString().trim()], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
    }
    execFileSync('node', ['tools/retarget_local.mjs', c.rigged, s.srcFile, s.file, '--clip', s.clip], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
    fs.writeFileSync(r(`${s.file}.key`), s.key);
    console.log(`${c.name}: ${s.clip} retargeted locally from ${s.src.replace(/^(t2m|from):/, "")}`);
  }
}
function clips(c) {
  if (!flag('--dry-run')) makeLocal(c);
  const todo = clipStates(c).filter((s) => fetchable(s) && (s.state !== 'ok' || flag('--force')));
  if (!todo.length) return;
  if (flag('--dry-run')) { console.log(`${c.name}: would fetch clips ${todo.map((s) => `${s.clip}=${s.src}`).join(' ')} (${todo.length * 3} credits)`); return; }
  const rigId = c.rigId();
  if (!rigId) throw new Error(`${c.name}: no rig yet; run the mesh step first`);
  fs.mkdirSync(r(c.out), { recursive: true });
  const log = fs.openSync(r(`${c.out}/meshy.log`), 'a');
  const actions = todo.filter((s) => typeof s.src === 'number').map((s) => s.src);
  if (actions.length) {
    const p = spawnSync('python3', ['-I', 'tools/char_pipeline.py', c.animDir, '--rig-task', rigId, '--actions', actions.join(',')], { cwd: ROOT, env: envFor(acctOf(c)), stdio: ['ignore', log, log] });
    if (p.status) throw new Error(`${c.name}: clip fetch failed, see ${c.out}/meshy.log`);
  }
  for (const s of todo.filter((q) => q.motion)) {
    const mt = motionTask(s.motion, acctOf(c));
    if (motionState(s.motion, acctOf(c)) !== 'ok') throw new Error(`${c.name}: motion ${s.motion} is ${motionState(s.motion, acctOf(c))}${acctOf(c) ? ' in account ' + acctOf(c) : ''}; run the motions step first`);
    const p = spawnSync('python3', ['-I', 'tools/meshy_task.py', 'animations', `${c.animDir}/4_motion_${s.motion}`, JSON.stringify({ rig_task_id: rigId, motion_task_id: mt.id })], { cwd: ROOT, env: envFor(acctOf(c)), stdio: ['ignore', log, log] });
    if (p.status) throw new Error(`${c.name}: retarget of ${s.motion} failed, see ${c.out}/meshy.log`);
  }
  console.log(`${c.name}: clips ${todo.map((s) => s.clip).join(' ')}`);
}

function build(c) {
  makeLocal(c);
  const cs = clipStates(c);
  if (!exists(c.rigged) || cs.some((s) => s.state !== 'ok')) { console.log(`${c.name}: not built (rig or clips missing)`); return; }
  fs.mkdirSync(r(c.out), { recursive: true });
  fs.mkdirSync(r('web/public/assets/chars'), { recursive: true });
  execFileSync('node', ['tools/build_character.mjs', c.raw, c.rigged, ...cs.map((s) => `${s.clip}=${s.file}`)], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  // carried props (characters/props.json): prop_<name> parts skinned rigidly to a bone (tools/char_props.mjs)
  if (PROPS[c.name]) execFileSync('node', ['tools/char_props.mjs', c.raw, c.raw, c.name], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  execFileSync(r('tools/node_modules/.bin/gltf-transform'), ['optimize', r(c.raw), r(c.glb), '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '512', '--simplify', 'false'],
    { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${c.name}: ${c.glb} ${(fs.statSync(r(c.glb)).size / 1024).toFixed(0)} KB, clips ${cs.map((s) => s.clip).join(' ')}`);
}

function registry() {
  const all = fs.readdirSync(r('characters')).filter((f) => f.endsWith('.json') && !['motions.json', 'props.json'].includes(f)).map((f) => character(f.slice(0, -5)));
  const reg = {};
  for (const c of all) {
    if (!exists(c.glb)) continue;
    const motion = Object.entries(c.cfg.clips).filter(([, v]) => typeof v === 'string' && v.startsWith('motion:')).map(([k]) => k);
    // local retargets (t2m:, from:) of Text to Motion takes don't loop cleanly either: the page cross-fades them
    const local = Object.entries(c.cfg.clips).filter(([, v]) => typeof v === 'string' && (v.startsWith('t2m:') || (v.startsWith('from:') && /motion:|t2m:/.test(JSON.stringify(character(v.slice(5).split('/')[0]).cfg.clips[v.slice(5).split('/')[1]] || ''))))).map(([k]) => k);
    const props = Object.fromEntries(Object.entries(PROPS[c.name] || {}).map(([p, d]) => [p, d.clip]));
    reg[c.name] = { file: `assets/chars/${c.name}.glb`, height_m: c.cfg.height_m, clips: Object.keys(c.cfg.clips), motion: [...motion, ...local], props, title: c.cfg.title };
  }
  fs.writeFileSync(r('web/public/assets/chars/characters.json'), JSON.stringify(reg, null, 1) + '\n');
  console.log(`web/public/assets/chars/characters.json: ${Object.keys(reg).join(' ')}`);
}

async function reviewRow(c, file) {
  const H = 560, imgs = [c.ref, ...c.views].filter(exists);
  const parts = await Promise.all(imgs.map((p) => sharp(r(p)).removeAlpha().resize({ height: H }).toBuffer({ resolveWithObject: true })));
  let x = 0; const comp = [];
  for (const p of parts) { comp.push({ input: p.data, left: x, top: 0 }); x += p.info.width + 6; }
  const label = Buffer.from(`<svg width="${Math.max(x, 10)}" height="28"><text x="6" y="20" font-size="18" font-family="monospace" fill="#fff" stroke="#000" stroke-width="0.6">${c.name}</text></svg>`);
  comp.push({ input: label, left: 0, top: 0 });
  await sharp({ create: { width: Math.max(x, 10), height: H, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 86 }).toFile(r(file));
  return r(file);
}

async function review(list) {
  const rows = [];
  for (const c of list.filter((q) => !q.legacy && exists(q.ref))) rows.push(await sharp(await reviewRow(c, `${c.out}/views.jpg`)).toBuffer({ resolveWithObject: true }));
  if (!rows.length) return;
  const W = Math.max(...rows.map((q) => q.info.width)); let y = 0; const comp = [];
  for (const q of rows) { comp.push({ input: q.data, left: 0, top: y }); y += q.info.height + 6; }
  await sharp({ create: { width: W, height: y, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 84 }).toFile(r('gen/characters/review.jpg'));
  console.log('gen/characters/review.jpg');
}

function status(list) {
  const ms = Object.keys(MOTIONS).filter((m) => m !== 'about');
  const accts = (m) => [''].concat(exists(motionDir(m)) ? fs.readdirSync(r(motionDir(m))).filter((d) => d.startsWith('msy_')) : []);
  if (ms.length) console.log(`motions: ${ms.map((m) => accts(m).map((a) => `${m}${a ? '@' + a : ''} ${motionState(m, a)}`).join(' · ')).join(' · ')}`);
  for (const c of list) {
    const cs = clipStates(c);
    console.log(`${c.name.padEnd(13)}${acctOf(c) ? ' [' + acctOf(c) + ']' : ''} ${['ref', 'sheet', 'views', 'mesh'].map((s) => `${s} ${state(c, s)}`).join(' · ')} · clips ${cs.filter((s) => s.state === 'ok').length}/${cs.length}`
      + `${cs.some((s) => s.state !== 'ok') ? ` (todo: ${cs.filter((s) => s.state !== 'ok').map((s) => `${s.clip}=${s.src}`).join(' ')})` : ''} · web ${exists(c.glb) ? 'built' : 'no'}`);
  }
}

// ---- run -----------------------------------------------------------------------------
fs.mkdirSync(r('gen/characters'), { recursive: true });
const list = names.map(character);
const each = (fn) => async () => { for (const c of list) await fn(c); };
const real = list.filter((c) => !c.legacy);
const steps = {
  status: () => status(list),
  ref: () => Promise.all(real.map(ref)),
  sheet: () => sheets(real),
  views: each((c) => !c.legacy && views(c)),
  mesh: () => runParallel(real, 'mesh'),
  motions: () => motions(list),
  clips: () => runParallel(list, 'clips'),
  build: async () => { for (const c of list) build(c); registry(); },
  review: () => review(list),
  all: async () => {
    await Promise.all(real.map(ref)); sheets(real); for (const c of real) await views(c);
    await runParallel(real, 'mesh'); await motions(list); await runParallel(list, 'clips'); for (const c of list) build(c); registry(); await review(list);
  },
};

// Meshy steps wait minutes per task, so each character's chain runs in its own child process.
async function runParallel(cs, s) {
  const fn = { mesh, clips }[s];
  if (cs.length === 1 || flag('--dry-run')) { for (const c of cs) if (!(s === 'mesh' && c.legacy)) fn(c); return; }
  const todo = cs.filter((c) => !(s === 'mesh' && c.legacy) && (s === 'mesh' ? want(c, 'mesh') : clipStates(c).some((q) => fetchable(q) && (q.state !== 'ok' || flag('--force')))));
  await Promise.all(todo.map((c) => new Promise((res) => {
    const { spawn } = createRequire(import.meta.url)('node:child_process');
    const p = spawn('node', [fileURLToPath(import.meta.url), c.name, s, ...args.filter((a) => a.startsWith('--'))], { cwd: ROOT, stdio: 'inherit' });
    p.on('exit', res);
  })));
}

if (!steps[step]) { console.log(`unknown step ${step}`); process.exit(1); }
await steps[step]();
