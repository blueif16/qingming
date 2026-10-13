#!/usr/bin/env node
// Animal pipeline: one painted animal from the scroll -> a rigged, animated, web-ready creature (mirrors character.mjs).
//
//   node tools/animal.mjs <type|all> [status|ref|sheet|views|test|mesh|rig|build|frames|review|all] [--force] [--dry-run]
//
// An animal type is animals/<type>.json (the painted animal and its crop, the prompt, the body plan, size, mesh choice).
// Each step composes one existing atomic script and is cached by a key over its inputs:
//   ref     crop the animal out of the section's registered restyle (gen/sections/<s>/mosaic.jpg, 2x the scan), or out
//           of the scan itself (figure.src "scan") where no restyle exists yet
//   sheet   tools/shyfai_image.py: [style_B1.png, ref.png] + prompts/animal_turnaround.txt (with {animal} =
//           prompts/<prompt>.txt) -> a 2x2 turnaround sheet: side | three-quarter / front | back  (2048x2048)
//   views   split the sheet into side.png, threequarter.png, front.png, back.png, plus views.jpg for review
//   test    tools/meshy_task.py image-to-3d, Smart Topology (meshy-t2), mesh only (5 credits each), once from each view
//           in mesh.test -> gen/animals/<type>/meshy/test_<view>/; the Blender review renders them side by side
//           (gen/animals/<type>/mesh_test.jpg) so the view Meshy builds best from can be chosen (mesh.from)
//   mesh    tools/meshy_task.py retexture of the chosen test mesh with the views (the chosen view first)  (10 credits)
//   rig     blender/rig_quadruped.py (headless): our quadruped skeleton fitted to the mesh, skinned, the tack and loads
//           built from the kit and bound to it, the clips keyed (idle, walk, graze, lie ...), Blender review frames
//           -> gen/animals/<type>/<type>_raw.glb + rig.json (measures: length, withers, stride, saddle, harness)
//   build   gltf-transform optimize (meshopt, webp 512) -> web/public/assets/animals/<type>.glb, and rewrites the
//           registry web/public/assets/animals/animals.json
//   frames  frame sheets of every clip, side and three-quarter, on the real GPU (web/creatures.html; run
//           tools/win_chrome.sh start first) -> gen/animals/<type>/clips.jpg. Options: --clips walk,idle --frames 8
//           --tack <variant> --rider <character> (seated, playing 'ride') --move (the walk advances over 0.25 m
//           stripes: a planted hoof must not slide) --out <file>
//   review  gen/animals/review.jpg: ref | side | three-quarter | front | back for every type
// Outputs go to gen/animals/<type>/. Meshy deletes task outputs after 3 days: every step downloads at once.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(path.join(ROOT, 'tools/package.json'));
const sharp = req('sharp');
const r = (p) => path.join(ROOT, p);
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [target, step = 'status'] = args.filter((a, i) => !a.startsWith('--') && !['--base', '--clips', '--frames', '--out', '--tack', '--rider'].includes(args[i - 1]));
if (!target) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 30).join('\n')); process.exit(1); }

const STYLE = 'prompts/style_B1.png', MODEL = 'gpt-image-2.5', SHEET_SIZE = '2048x2048';
const VIEWS = ['side', 'threequarter', 'front', 'back'];
const BLENDER = path.join(ROOT, 'tools/blender_slot.sh');
const names = target === 'all' ? fs.readdirSync(r('animals')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort() : target.split(',');
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
const fileSha = (p) => sha(fs.readFileSync(r(p)));
const exists = (p) => fs.existsSync(r(p));
const readKey = (p) => (exists(p) ? fs.readFileSync(r(p), 'utf8') : null);
const unc = (p) => execFileSync('wslpath', ['-w', r(p)]).toString().trim();

function prompt(pname, vars, seen = new Set()) {
  if (seen.has(pname)) throw new Error(`prompt loop at ${pname}`);
  const text = fs.readFileSync(r(`prompts/${pname}.txt`), 'utf8').trim();
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ? prompt(vars[k], vars, new Set([...seen, pname]))
    : exists(`prompts/${k}.txt`) ? prompt(k, vars, new Set([...seen, pname])) : m));
}

function animal(name) {
  const cfg = JSON.parse(fs.readFileSync(r(`animals/${name}.json`), 'utf8'));
  const out = `gen/animals/${name}`;
  const a = {
    name, cfg, out, meshy: `${out}/meshy`,
    ref: `${out}/ref.png`, sheet: cfg.sheet_file || `${out}/sheet_0.png`, views: Object.fromEntries(VIEWS.map((v) => [v, `${out}/${v}.png`])),
    raw: `${out}/${name}_raw.glb`, rigJson: `${out}/rig.json`, glb: `web/public/assets/animals/${name}.glb`,
  };
  a.from = cfg.mesh?.from || 'side';
  a.testDir = (v) => `${a.meshy}/test_${v}`;
  a.testGlb = (v) => `${a.testDir(v)}/model_urls_glb.glb`;
  a.retexDir = `${a.meshy}/retex_${a.from}`;
  a.textured = `${a.retexDir}/model_urls_glb.glb`;
  // "body_from": another type's Meshy body (a variant: the white horse is the horse's body, toned); the steps before
  // the rig are that type's. "build": "kit": no Meshy body at all, the rig script builds it (the bird).
  if (cfg.body_from) {
    const b = animal(cfg.body_from);
    Object.assign(a, { ref: b.ref, sheet: b.sheet, views: b.views, testDir: b.testDir, testGlb: b.testGlb, retexDir: b.retexDir, textured: b.textured, from: b.from });
    a.shared = cfg.body_from;
  }
  a.kit = cfg.build === 'kit';
  return a;
}
const task = (dir) => (exists(`${dir}/task.json`) ? JSON.parse(fs.readFileSync(r(`${dir}/task.json`), 'utf8')) : null);

// ---- cache keys ------------------------------------------------------------------------
const sheetPrompt = (a) => prompt('animal_turnaround', { animal: a.cfg.prompt });
const keys = {
  ref: (a) => sha(JSON.stringify(a.cfg.figure) + (a.cfg.figure.src === 'scan' ? '' : (exists(`gen/sections/${a.cfg.figure.section}/mosaic.jpg`) ? fileSha(`gen/sections/${a.cfg.figure.section}/mosaic.jpg`) : ''))),
  sheet: (a) => (exists(a.ref) ? sha(JSON.stringify({ prompt: sheetPrompt(a), model: MODEL, size: SHEET_SIZE, refs: [fileSha(STYLE), fileSha(a.ref)] })) : null),
  views: (a) => (exists(a.sheet) ? fileSha(a.sheet) : null),
  mesh: (a) => (exists(a.testGlb(a.from)) && VIEWS.every((v) => exists(a.views[v])) ? sha(JSON.stringify({ from: a.from, test: task(a.testDir(a.from))?.id, views: VIEWS.map((v) => fileSha(a.views[v])) })) : null),
  rig: (a) => (a.kit ? sha(JSON.stringify({ cfg: a.cfg, rig: fileSha('blender/rig_quadruped.py') }))
    : exists(a.textured) ? sha(JSON.stringify({ glb: fileSha(a.textured), cfg: a.cfg, rig: fileSha('blender/rig_quadruped.py') })) : null),
};
const outputs = (a, s) => ({ ref: [a.ref], sheet: [a.sheet], views: Object.values(a.views), mesh: [a.textured], rig: [a.raw, a.rigJson] }[s]);
const keyFile = (a, s) => `${a.out}/${s}.key`;
function state(a, s) {
  if (a.kit && s !== 'rig') return 'ok (kit)';
  if (a.shared && s !== 'rig') return `ok (${a.shared}'s)`;
  if (a.kit && s === 'rig') return [a.raw, a.rigJson].every(exists) && readKey(keyFile(a, 'rig')) === keys.rig(a) ? 'ok' : 'stale';
  if (s === 'sheet' && a.cfg.sheet_file) return exists(a.sheet) ? 'ok (given)' : 'missing';
  if (!outputs(a, s).every(exists)) return 'missing';
  const k = keys[s](a);
  return k && readKey(keyFile(a, s)) === k ? 'ok' : 'stale';
}
const want = (a, s) => flag('--force') || !state(a, s).startsWith('ok');
const writeKey = (a, s) => fs.writeFileSync(r(keyFile(a, s)), keys[s](a));
const dataUri = (p) => 'data:image/png;base64,' + fs.readFileSync(r(p)).toString('base64');

// ---- steps ---------------------------------------------------------------------------
async function ref(a) {
  if (a.kit || a.shared || !want(a, 'ref')) return;
  const f = a.cfg.figure, [x0, y0, x1, y1] = f.crop;
  fs.mkdirSync(r(a.out), { recursive: true });
  let file, k, SX = 0, SY = 0;
  if (f.src === 'scan') { file = 'reference/scroll/qingming_commons_38414x1800.jpg'; k = 1; }
  else { file = `gen/sections/${f.section}/mosaic.jpg`; k = 2; [SX, SY] = JSON.parse(fs.readFileSync(r(`sections/${f.section}/section.json`), 'utf8')).rect; }
  const w = (x1 - x0) * k, h = (y1 - y0) * k, up = Math.max(1, 1024 / Math.max(w, h));
  await sharp(r(file), { limitInputPixels: false }).extract({ left: (x0 - SX) * k, top: (y0 - SY) * k, width: w, height: h })
    .resize(Math.round(w * up), Math.round(h * up), { kernel: 'lanczos3' }).png().toFile(r(a.ref));
  writeKey(a, 'ref');
  console.log(`${a.name}: ref ${a.ref} (${f.src || 'mosaic'} ${x0},${y0}-${x1},${y1})`);
}

function sheets(list) {
  const jobs = list.filter((a) => !a.kit && !a.shared && !a.cfg.sheet_file && want(a, 'sheet'));
  if (!jobs.length) return;
  if (flag('--dry-run')) { console.log('would generate sheets:', jobs.map((a) => a.name).join(' ')); return; }
  const file = 'gen/animals/jobs_sheet.jsonl';
  fs.mkdirSync(r('gen/animals'), { recursive: true });
  fs.writeFileSync(r(file), jobs.map((a) => JSON.stringify({ out: `${a.out}/sheet`, prompt: sheetPrompt(a), ref: [STYLE, a.ref], model: MODEL, size: SHEET_SIZE, format: 'png' })).join('\n') + '\n');
  const mtime = (a) => (exists(a.sheet) ? fs.statSync(r(a.sheet)).mtimeMs : 0);
  const before = jobs.map(mtime);
  const p = spawnSync('python3', ['-I', 'tools/shyfai_image.py', '--batch', file, '--jobs', '3', '--timeout', '900'], { cwd: ROOT, stdio: 'inherit' });
  jobs.forEach((a, i) => { if (mtime(a) > before[i]) writeKey(a, 'sheet'); });
  if (p.status) console.log('some sheets failed; rerun the sheet step to retry only those');
}

// Split the 2x2 sheet: background = the median border colour; rows are bands of foreground rows, figures are runs of
// foreground columns inside a band. Every view is padded to a square around its figure (Meshy likes centred input).
async function views(a) {
  if (a.kit || a.shared) return;
  if (!want(a, 'views') || !exists(a.sheet)) return;
  const { data, info } = await sharp(r(a.sheet)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, px = (x, y) => (y * W + x) * 3;
  const border = [];
  for (let x = 0; x < W; x += 4) border.push(px(x, 2), px(x, H - 3));
  for (let y = 0; y < H; y += 4) border.push(px(2, y), px(W - 3, y));
  const med = [0, 1, 2].map((ch) => border.map((i) => data[i + ch]).sort((p, q) => p - q)[border.length >> 1]);
  const fg = (x, y) => { const i = px(x, y); return Math.abs(data[i] - med[0]) + Math.abs(data[i + 1] - med[1]) + Math.abs(data[i + 2] - med[2]) > 40; };
  const runs = (n, count) => {
    const out = [];
    for (let i = 0, start = -1, gap = 0; i <= n; i++) {
      const on = i < n && count(i) > 2;
      if (on) { if (start < 0) start = i; gap = 0; } else if (start >= 0 && (++gap > 12 || i === n)) { out.push([start, i - gap]); start = -1; gap = 0; }
    }
    return out.filter(([p, q]) => q - p > 40);
  };
  const rowCount = (y) => { let c = 0; for (let x = 0; x < W; x += 2) if (fg(x, y)) c++; return c; };
  const bands = runs(H, rowCount).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0])).slice(0, 2).sort((p, q) => p[0] - q[0]);
  if (bands.length !== 2) throw new Error(`${a.name}: found ${bands.length} rows in the sheet, expected 2 (check ${a.sheet})`);
  const boxes = [];
  for (const [y0, y1] of bands) {
    const colCount = (x) => { let c = 0; for (let y = y0; y <= y1; y += 2) if (fg(x, y)) c++; return c; };
    const figs = runs(W, colCount).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0])).slice(0, 2).sort((p, q) => p[0] - q[0]);
    if (figs.length !== 2) throw new Error(`${a.name}: found ${figs.length} figures in a row of the sheet, expected 2`);
    for (const [x0, x1] of figs) {
      let top = y1, bottom = y0;
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (fg(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
      boxes.push([x0, top, x1, bottom]);
    }
  }
  const bg = { r: med[0], g: med[1], b: med[2] };
  for (let i = 0; i < 4; i++) {
    const [x0, y0, x1, y1] = boxes[i], w = x1 - x0 + 1, h = y1 - y0 + 1, side = Math.round(Math.max(w, h) * 1.12);
    await sharp(r(a.sheet)).removeAlpha().extract({ left: x0, top: y0, width: w, height: h })
      .extend({ left: Math.floor((side - w) / 2), right: Math.ceil((side - w) / 2), top: Math.floor((side - h) / 2), bottom: Math.ceil((side - h) / 2), background: bg })
      .png().toFile(r(a.views[VIEWS[i]]));
  }
  writeKey(a, 'views');
  await reviewRow(a, `${a.out}/views.jpg`);
  console.log(`${a.name}: views (sheet bg ${med.join(',')}), boxes ${boxes.map((b) => b.join(',')).join(' | ')}`);
}

function meshy(endpoint, dir, body) {
  fs.mkdirSync(r(dir), { recursive: true });
  fs.writeFileSync(r(`${dir}/body.json`), JSON.stringify(body));
  const log = fs.openSync(r(`${dir}/run.log`), 'a');
  const p = spawnSync('python3', ['-I', 'tools/meshy_task.py', endpoint, dir, '@' + `${dir}/body.json`], { cwd: ROOT, stdio: ['ignore', log, log] });
  if (p.status) throw new Error(`${endpoint} failed, see ${dir}/run.log`);
  return task(dir);
}

// Smart Topology, mesh only, once per test view (in parallel: one child process each).
async function test(a) {
  if (a.kit || a.shared) return;
  const todo = (a.cfg.mesh?.test || [a.from]).filter((v) => flag('--force') || !exists(a.testGlb(v)));
  if (!todo.length) return blenderTest(a);
  if (flag('--dry-run')) { console.log(`${a.name}: would run Smart Topology mesh-only from ${todo.join(', ')} (${5 * todo.length} credits)`); return; }
  await Promise.all(todo.map((v) => new Promise((res, rej) => {
    const dir = a.testDir(v);
    fs.mkdirSync(r(dir), { recursive: true });
    fs.writeFileSync(r(`${dir}/body.json`), JSON.stringify({ image_url: dataUri(a.views[v]), model_type: 'smart-topology', ai_model: 'meshy-t2',
      target_polycount: a.cfg.mesh?.polys || 3500, should_texture: false, pose_mode: '', target_formats: ['glb'] }));
    const log = fs.openSync(r(`${dir}/run.log`), 'a');
    const { spawn } = createRequire(import.meta.url)('node:child_process');
    spawn('python3', ['-I', 'tools/meshy_task.py', 'image-to-3d', dir, '@' + `${dir}/body.json`], { cwd: ROOT, stdio: ['ignore', log, log] })
      .on('exit', (code) => (code ? rej(new Error(`${a.name}: test ${v} failed, see ${dir}/run.log`)) : (console.log(`${a.name}: test ${v} ${task(dir).id} (${task(dir).consumed_credits} credits)`), res())));
  })));
  return blenderTest(a);
}

function blender(script, scriptArgs, log) {
  const p = spawnSync(BLENDER, ['-b', '--factory-startup', '--python', r(script), '--', ...scriptArgs], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (log) fs.writeFileSync(r(log), (p.stdout || '') + (p.stderr || ''));
  if (p.status) throw new Error(`blender ${script} failed (${p.status}), see ${log}`);
  return p.stdout || '';
}

function blenderTest(a) {
  const glbs = (a.cfg.mesh?.test || [a.from]).filter((v) => exists(a.testGlb(v)));
  if (!glbs.length) return;
  const out = blender('blender/rig_quadruped.py', ['test', unc(`${a.out}/mesh_test.png`), ...glbs.map((v) => `${v}=${unc(a.testGlb(v))}`)], `${a.out}/mesh_test.log`);
  console.log(out.split('\n').filter((l) => l.startsWith('TEST')).join('\n'));
  console.log(`${a.out}/mesh_test.png`);
}

function mesh(a) {
  if (a.kit || a.shared) return;
  if (!want(a, 'mesh')) return;
  const t = task(a.testDir(a.from));
  if (!t || t.status !== 'SUCCEEDED') { console.log(`${a.name}: no test mesh from ${a.from}; run the test step first`); return; }
  if (flag('--dry-run')) { console.log(`${a.name}: would retexture the ${a.from} test mesh with the views (10 credits)`); return; }
  const order = [a.from, ...VIEWS.filter((v) => v !== a.from)].slice(0, 4);
  const done = meshy('retexture', a.retexDir, { input_task_id: t.id, ai_model: 'meshy-7', multiview_image_urls: order.map((v) => dataUri(a.views[v])),
    enable_original_uv: true, texture_resolution: '2k', target_formats: ['glb'] });
  writeKey(a, 'mesh');
  console.log(`${a.name}: retextured (${done.id}, ${done.consumed_credits} credits) -> ${a.textured}`);
}

function rig(a) {
  if (!a.kit && !exists(a.textured)) { console.log(`${a.name}: no textured mesh yet; run mesh first`); return; }
  if (!want(a, 'rig')) return;
  fs.mkdirSync(r(a.out), { recursive: true });
  const cfgPath = `${a.out}/rig_config.json`;
  fs.writeFileSync(r(cfgPath), JSON.stringify({ name: a.name, ...a.cfg }, null, 1));
  const out = a.kit
    ? blender('blender/rig_quadruped.py', ['bird', unc(cfgPath), unc(a.raw), unc(a.rigJson), unc(`${a.out}/frames`)], `${a.out}/rig.log`)
    : blender('blender/rig_quadruped.py', ['rig', unc(cfgPath), unc(a.textured), unc(a.raw), unc(a.rigJson), unc(`${a.out}/frames`)], `${a.out}/rig.log`);
  console.log(out.split('\n').filter((l) => l.startsWith('RIG')).join('\n'));
  writeKey(a, 'rig');
}

function build(a) {
  if (!exists(a.raw)) { console.log(`${a.name}: not rigged yet`); return; }
  fs.mkdirSync(r('web/public/assets/animals'), { recursive: true });
  execFileSync(r('tools/node_modules/.bin/gltf-transform'), ['optimize', r(a.raw), r(a.glb), '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '512',
    '--simplify', 'false', '--join', 'false', '--instance', 'false', '--palette', 'false', '--flatten', 'false', '--prune', 'false'], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${a.name}: ${a.glb} ${(fs.statSync(r(a.glb)).size / 1024).toFixed(0)} KB`);
}

function registry() {
  const all = fs.readdirSync(r('animals')).filter((f) => f.endsWith('.json')).map((f) => animal(f.slice(0, -5)));
  const reg = { about: [
    'Animals for the scene pages, written by tools/animal.mjs build from gen/animals/<type>/rig.json. Metres, seconds, model space of the GLB (three.js: x = the animal\'s left, y up, z forward); the origin is on the ground between the four hooves at rest and the animal faces +z. Models are real size: place them at the map position (between fore and hind hooves), facing from hind to fore.',
    'length_m: nose to rump; height_m: withers; back_m: the back at its lowest point (the seat); top_m: the highest point (ears, humps); width_m; hoof_span_m: fore toes to hind toes at rest (the map measures length_m the same way, on figures about 1.3x life size).',
    'clips: name -> seconds; all loop. walk is in place: move the root at walk.speed_mps (= stride_m per cycle_s) along the facing and the planted hooves stay put (walk.slip_mm is the measured slide, ~1 mm). Ground contact bones: hoof_bones (their tails are the toes).',
    'tack: variant -> {node, triangles, seat_m, saddle_rest}. Every tack_<variant> node ships visible: hide all of them at load and show the one people.json asks for ("load"/"tack").',
    'saddle: {bone, rest}: a rider sits on the back at rest (or at tack[variant].saddle_rest when that variant is shown). Seat a character playing its ungrounded ride clip with its Hips bone 0.09 m x its scale above that point, facing the same way, and attach it to the bone (three.js Object3D.attach at bind pose) so it rides the back (web/src/creatures.js loadRider).',
    'harness: {collar, trace_l, trace_r, yoke, bone}: where a vehicle\'s traces hook onto the collar variant\'s hames, and where an ox yoke rests on the neck (blender/kit_vehicles.py HARNESS holds the same numbers).',
  ] };
  for (const a of all) {
    if (!exists(a.glb) || !exists(a.rigJson)) continue;
    const m = JSON.parse(fs.readFileSync(r(a.rigJson), 'utf8'));
    if (m.saddle) delete m.saddle.offset; // Blender bone space: the page derives the offset at bind pose instead
    reg[a.name] = { file: `assets/animals/${a.name}.glb`, title: a.cfg.title, plan: a.cfg.plan, ...m };
  }
  fs.writeFileSync(r('web/public/assets/animals/animals.json'), JSON.stringify(reg, null, 1) + '\n');
  console.log(`web/public/assets/animals/animals.json: ${Object.keys(reg).filter((k) => k !== 'about').join(' ')}`);
}

// Frame sheets of every clip on the real GPU (web/creatures.html): side (90 deg) and three-quarter (35 deg) rows.
async function frames(a) {
  const { chromium } = req('playwright-core');
  let browser;
  try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
  const page = await browser.contexts()[0].newPage();
  const FW = 360, FH = 300, N = +opt('--frames', 8);
  await page.setViewportSize({ width: FW * 2, height: FH * 2 });
  const logs = [];
  page.on('pageerror', (e) => logs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  const extra = [opt('--tack') && `tack=${a.name}:${opt('--tack')}`, opt('--rider') && `rider=${a.name}:${opt('--rider')}`, flag('--move') && 'move=1'].filter(Boolean).join('&');
  await page.goto(`${opt('--base', 'http://127.0.0.1:5180')}/creatures.html?only=${a.name}&sheet=1${extra ? '&' + extra : ''}`);
  await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 60000 });
  const clips = await page.evaluate((n) => window.__test.clips[n], a.name);
  const want = opt('--clips') ? opt('--clips').split(',') : clips.map((c) => c[0]);
  const rows = [];
  for (const [clip, dur] of clips.filter((c) => want.includes(c[0]))) {
    for (const az of [90, 35]) {
      const fr = [];
      for (let i = 0; i < N; i++) {
        const t = (dur * i) / N;
        await page.evaluate(([n, c, t, az]) => { const T = window.__test; T.ui.paused = true; T.pose(n, c, t); T.focus(n, az); T.render(); }, [a.name, clip, t, az]);
        await page.waitForTimeout(150);
        fr.push(await sharp(await page.screenshot()).resize(FW, FH).toBuffer());
      }
      rows.push({ label: `${clip} (${dur.toFixed(2)} s, ${az} deg)`, frames: fr });
    }
  }
  await page.close(); await browser.close();
  const LH = 24, W = FW * N, H = rows.length * (FH + LH), comp = [];
  rows.forEach((row, ri) => {
    const y = ri * (FH + LH);
    comp.push({ input: Buffer.from(`<svg width="${W}" height="${LH}"><rect width="100%" height="100%" fill="#222"/><text x="8" y="17" font-size="15" font-family="monospace" fill="#fff">${a.name} · ${row.label}</text></svg>`), left: 0, top: y });
    row.frames.forEach((f, i) => comp.push({ input: f, left: i * FW, top: y + LH }));
  });
  const out = opt('--out', `${a.out}/clips.jpg`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 82 }).toFile(r(out));
  console.log(logs.length ? logs.join('\n') : 'no page errors');
  console.log(out);
}

async function reviewRow(a, file) {
  const H = 420, imgs = [a.ref, ...VIEWS.map((v) => a.views[v])].filter(exists);
  const parts = await Promise.all(imgs.map((p) => sharp(r(p)).removeAlpha().resize({ height: H }).toBuffer({ resolveWithObject: true })));
  let x = 0; const comp = [];
  for (const p of parts) { comp.push({ input: p.data, left: x, top: 0 }); x += p.info.width + 6; }
  comp.push({ input: Buffer.from(`<svg width="${Math.max(x, 10)}" height="28"><text x="6" y="20" font-size="18" font-family="monospace" fill="#fff" stroke="#000" stroke-width="0.6">${a.name}</text></svg>`), left: 0, top: 0 });
  await sharp({ create: { width: Math.max(x, 10), height: H, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 86 }).toFile(r(file));
  return r(file);
}

async function review(list) {
  const rows = [];
  for (const a of list.filter((q) => exists(q.ref))) rows.push(await sharp(await reviewRow(a, `${a.out}/views.jpg`)).toBuffer({ resolveWithObject: true }));
  if (!rows.length) return;
  const W = Math.max(...rows.map((q) => q.info.width)); let y = 0; const comp = [];
  for (const q of rows) { comp.push({ input: q.data, left: 0, top: y }); y += q.info.height + 6; }
  await sharp({ create: { width: W, height: y, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 84 }).toFile(r('gen/animals/review.jpg'));
  console.log('gen/animals/review.jpg');
}

function status(list) {
  for (const a of list) {
    const tests = (a.cfg.mesh?.test || [a.from]).map((v) => `${v}${exists(a.testGlb(v)) ? '' : '?'}`).join(',');
    console.log(`${a.name.padEnd(8)} ${['ref', 'sheet', 'views', 'mesh', 'rig'].map((s) => `${s} ${state(a, s)}`).join(' · ')} · tests ${tests} (from ${a.from}) · web ${exists(a.glb) ? 'built' : 'no'}`);
  }
}

// ---- run -----------------------------------------------------------------------------
fs.mkdirSync(r('gen/animals'), { recursive: true });
const list = names.map(animal);
const each = (fn) => async () => { for (const a of list) await fn(a); };
const steps = {
  status: () => status(list),
  ref: () => Promise.all(list.map(ref)),
  sheet: () => sheets(list),
  views: each(views),
  test: () => Promise.all(list.map(test)),
  mesh: each(mesh),
  rig: each(rig),
  build: async () => { for (const a of list) build(a); registry(); },
  frames: each(frames),
  review: () => review(list),
  all: async () => {
    await Promise.all(list.map(ref)); sheets(list); for (const a of list) await views(a);
    await Promise.all(list.map(test));
    for (const a of list) { mesh(a); rig(a); build(a); } registry(); await review(list);
  },
};
if (!steps[step]) { console.log(`unknown step ${step}`); process.exit(1); }
await steps[step]();
