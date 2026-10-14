#!/usr/bin/env node
// Puts the sound sets into the world page and checks them there (skill `sounds`).
//   ship    every set's shipped files (gen/sounds/<set>/ship/*.webm, tools/sound_cut.mjs) -> web/public/assets/sounds/,
//           plus sounds.json: { files: {sound: [file, ...]}, loops: [...], rules (sounds/rules.json), credit }.
//           Fails when the rules name a sound no set ships.
//   check   (inside tools/chrome_slot.sh) the world page with sound on: at each section's spawn, which beds play, how
//           many voices, which files failed to load or decode, the night watches and the HUD sound fired by hand
//           -> sections/world/sound_check.json, PASS/FAIL
//   node tools/sound_web.mjs ship
//   tools/chrome_slot.sh node tools/sound_web.mjs check [http://127.0.0.1:5190/world.html]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const SETS = ['core', 'round2', 'interact']; // interact: the drum you beat and the birds it startles (web/src/interact.js)
const OUT = r('web/public/assets/sounds');
const [step = 'ship', url = 'http://127.0.0.1:5190/world.html'] = process.argv.slice(2);

// every sound name a rules file mentions
function named(rules) {
  const out = new Set();
  const add = (v) => [].concat(v || []).forEach((x) => typeof x === 'string' && out.add(x));
  for (const s of Object.values(rules.beds)) for (const k of ['day', 'night']) for (const [b] of s[k] || []) add(b);
  const p = rules.player;
  add(Object.values(p.surfaces)); add(Object.values(p.run)); add(p.bump); add([p.brush.willow, p.brush.other]);
  for (const a of Object.values(rules.animals)) { add(a.near); add(a.call); add(a.walk); add(a.run); }
  for (const c of [...Object.values(rules.clips), ...Object.values(rules.figures), ...Object.values(rules.places)]) { add(c.shot); add(c.loop); }
  for (const [s] of [...rules.boats.moored, ...rules.boats.underway]) add(s);
  add(rules.boats.tow); add(rules.boats.mast); add(rules.trees.loop);
  const h = rules.hours;
  add([h.drum.duskSound, h.drum.hit, h.drum.clapper, h.dawn.sound, h.rooster.sound, h.watch_round.sound, h.gust.sound]);
  add(Object.values(rules.ui)); add(rules.player.board); add([rules.boats.setOff, rules.boats.arrive, rules.animals_on_timber?.loop]);
  add(Object.values(rules.covered.beds || {})); add(Object.values(rules.places).map((x) => x.bellSound)); add(h.shutters?.sound);
  return out;
}

if (step === 'ship') {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f));
  const files = {}, loops = [], owner = {};
  let bytes = 0;
  for (const set of SETS) {
    const spec = JSON.parse(fs.readFileSync(r(`sounds/${set}.json`), 'utf8'));
    const ship = r(`gen/sounds/${set}/ship`);
    for (const f of fs.readdirSync(ship).filter((f) => f.endsWith('.webm')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))) {
      const name = f.slice(0, -5), id = spec.units[name] ? name : name.replace(/_\d+$/, '');
      if (!spec.units[id]) continue; // a file whose unit was dropped from the spec
      if (owner[id] && owner[id] !== set) throw new Error(`sound ${id} is in two sets`);
      owner[id] = set;
      fs.copyFileSync(path.join(ship, f), path.join(OUT, f));
      (files[id] ||= []).push(f);
      if (spec.units[id].loop && !loops.includes(id)) loops.push(id);
      bytes += fs.statSync(path.join(OUT, f)).size;
    }
  }
  const rules = JSON.parse(fs.readFileSync(r('sounds/rules.json'), 'utf8'));
  const missing = [...named(rules)].filter((n) => !files[n]);
  const manifest = { about: 'Built by tools/sound_web.mjs from sounds/*.json and sounds/rules.json; read by web/src/sound.js.', credit: 'Sound effects: ElevenLabs (elevenlabs.io)', files, loops, rules };
  fs.writeFileSync(path.join(OUT, 'sounds.json'), JSON.stringify(manifest));
  const unused = Object.keys(files).filter((n) => !named(rules).has(n));
  console.log(`shipped ${Object.values(files).flat().length} files for ${Object.keys(files).length} sounds, ${(bytes / 1024).toFixed(0)} KB -> web/public/assets/sounds`);
  if (unused.length) console.log(`not played by any rule yet: ${unused.join(', ')}`);
  if (missing.length) { console.error(`FAIL: the rules name sounds no set ships: ${missing.join(', ')}`); process.exit(1); }
}

if (step === 'check') {
  const { chromium } = await import(r('tools/node_modules/playwright-core/index.mjs')).catch(() => import('playwright-core'));
  const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
  const ctx = browser.contexts()[0] || (await browser.newContext());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}hour=10`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__test?.sound, null, { timeout: 180000 });
  await page.mouse.click(8, 300); // a real gesture: browsers start audio only after one
  await page.evaluate(() => window.__test.sound.unlock());
  const views = await page.evaluate(() => (window.__test.views || []).filter((v) => v.endsWith(':spawn')));
  const result = { url, at: {}, errors, failed: [] };
  for (const v of views) {
    await page.evaluate((v) => window.__test.view(v), v);
    await page.waitForTimeout(6000); // beds fade in, files load and decode, shots get their first turns
    result.at[v] = await page.evaluate(() => window.__test.sound.stats());
  }
  // the hours and the HUD, fired by hand at the gate (the drum is there)
  const gate = views.find((v) => v.startsWith('gate:'));
  if (gate) {
    await page.evaluate((v) => window.__test.view(v), gate);
    await page.waitForTimeout(3000);
    result.watch = await page.evaluate(() => window.__test.sound.fire('watch', 3));
    await page.waitForTimeout(9000);
    result.afterWatch = await page.evaluate(() => window.__test.sound.stats());
    // footsteps: walk east along the road for 4 s (W held), then run 3 s
    await page.evaluate(() => { window.__test.player.yaw = -Math.PI / 2; });
    await page.keyboard.down('KeyW'); await page.waitForTimeout(4000);
    await page.keyboard.down('ShiftLeft'); await page.waitForTimeout(3000);
    await page.keyboard.up('ShiftLeft'); await page.keyboard.up('KeyW');
    result.walk = await page.evaluate(() => window.__test.sound.stats().counts);
    // the volume bar: shown beside the bell while the painting (Space) is open; dragging it sets the master level
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);
    result.volume = await page.evaluate(() => {
      const c = document.getElementById('soundCtl'), s = c?.querySelector('input');
      const shown = !!s && getComputedStyle(c.querySelector('.bar')).display !== 'none';
      if (s) { s.value = '0.4'; s.dispatchEvent(new Event('input')); }
      return { shown, volume: window.__test.sound.stats().volume };
    });
    await page.screenshot({ path: r('gen/sounds/volume_bar.png') });
    await page.keyboard.press('Space');
    await page.evaluate(() => { const s = document.querySelector('#soundCtl input'); s.value = '0.8'; s.dispatchEvent(new Event('input')); });
  }
  const all = Object.values(result.at);
  result.failed = [...new Set(all.flatMap((s) => s.failed || []))];
  const silent = Object.entries(result.at).filter(([, s]) => !s.beds.some((b) => b.gain > 0.05)).map(([v]) => v);
  const over = Object.entries(result.at).filter(([, s]) => s.loops > s.budget.loops || s.shots > s.budget.shots).map(([v]) => v);
  const pass = !result.failed.length && !silent.length && !over.length && !errors.length && all.length > 0 && result.afterWatch?.events?.some((e) => e.startsWith('watch')) && result.walk?.steps >= 6 && result.volume?.shown && Math.abs(result.volume.volume - 0.4) < 0.01;
  result.verdict = { pass, silent, over, failed: result.failed, errors: errors.length, steps: result.walk, volume: result.volume, msMax: Math.max(...all.map((s) => s.ms)) };
  fs.writeFileSync(r('sections/world/sound_check.json'), JSON.stringify(result, null, 1));
  for (const [v, s] of Object.entries(result.at)) console.log(`${v.padEnd(28)} beds ${s.beds.filter((b) => b.gain > 0.05).map((b) => `${b.name} ${b.gain.toFixed(2)}`).join(', ')} · loops ${s.loops} · shots ${s.shots} · decoded ${s.decodedMB.toFixed(1)} MB · ${s.ms.toFixed(2)} ms/frame${s.covered ? ' · covered' : ''}`);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(result.verdict)}`);
  await page.close();
  await browser.close().catch(() => {});
  process.exit(pass ? 0 : 1);
}
