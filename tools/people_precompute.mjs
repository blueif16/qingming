#!/usr/bin/env node
// What the page used to measure while a section streamed in, measured once here instead (the perf batch,
// gen/perf/batch1/notes.md; proposal rank 7): the slow parts of a section load on a phone were each walker's corridor
// (thousands of rays through the colliders: 0.13-1.6 s in one task at 4x CPU) and each clip's grounding and stride
// (sampling every clip of every character it casts: 0.8-4.4 s).
//   - web/public/assets/clip_meta.json: per model file and clip, its drift and grounding correction, stride, speed and
//     hips height (people.js prepareClip applies them; a clip whose key count or length changed is measured again).
//   - web/public/assets/<section>/corridors.json: per walker path (people.js corridorFor's key), how far the road is
//     free to each side every 0.5 m, measured with the section's neighbours in (the default window), and the collider
//     triangle count it was measured on (the page ignores the file once the section is rebuilt).
// The page measures them itself whatever is missing, so this is a speed-up, never a dependency. Run it after
// tools/export_web_scene.mjs (a section's colliders or people changed) and after tools/character.mjs (a clip changed):
//   tools/chrome_slot.sh node tools/people_precompute.mjs [section ...|all] [--url http://127.0.0.1:5190]
// (the check server, tools/check_server.sh start). With sections listed, clip_meta.json is merged, not replaced.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = opt('--url', 'http://127.0.0.1:5190');
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const ALL = fs.readFileSync(path.join(QM, 'web/world.html'), 'utf8').match(/data-sections="([^"]+)"/)[1].split(',');
const want = !pos.length || pos.includes('all') ? ALL : pos;
const PUB = path.join(QM, 'web/public/assets');
const r3 = (x) => Math.round(x * 1000) / 1000;
const sig = (x) => (typeof x === 'number' ? +x.toPrecision(7) : x);

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
try {
  // nothing precomputed is read, so the page measures everything itself; the low tier and no adaptive resolution keep
  // the GPU work small
  await page.goto(`${base}/world.html?clipmeta=0&corridors=0&tier=low&adapt=0&sound=0`);
  await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
  for (const name of want) {
    const t0 = Date.now();
    const r = await page.evaluate(async (name) => {
      const T = window.__test, sec0 = T.sections.get(name), spot = T.views.find((v) => v === `${name}:spawn`);
      if (spot) await T.view(spot); else return { error: `no spawn view for ${name}` };
      const sec = T.loaded.get(name);
      if (!sec || !sec.persons) return { error: `${name} did not load` };
      const P = T.people, paths = {};
      for (const p of sec.persons) {
        const a = P.agentOf.get(p);
        if (!a?.path || paths[a.path.key]) continue;
        P.corridors.delete(a.path.key);
        P.corridorFor(a.path); // measured now, with the whole window round the section in
        paths[a.path.key] = { lo: Array.from(a.path.lo), hi: Array.from(a.path.hi) };
      }
      return { collider_tris: sec.colliderTris, paths, loaded: [...T.loaded.keys()], was: sec0?.state };
    }, name);
    if (r.error) { console.log(`${name}: ${r.error}`); continue; }
    for (const c of Object.values(r.paths)) { c.lo = c.lo.map(r3); c.hi = c.hi.map(r3); }
    const out = { about: 'Walker corridors measured by tools/people_precompute.mjs (people.js corridorFor, keyed by path points), on the collider of collider_tris triangles; the page measures any path not here, and ignores the file after a rebuild.',
      date: new Date().toISOString(), window: r.loaded, collider_tris: r.collider_tris, paths: r.paths };
    const f = path.join(PUB, name, 'corridors.json');
    fs.writeFileSync(f, JSON.stringify(out));
    console.log(`${name}: ${Object.keys(r.paths).length} corridors, collider ${r.collider_tris} triangles, window ${r.loaded.join(' ')} -> ${path.relative(QM, f)} (${Math.round(fs.statSync(f).size / 1024)} KB, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  // every clip of every model the page loaded on the way (the casts of the sections visited, the pinned and your own)
  const meta = await page.evaluate(() => window.__test.clipMeta);
  const f = path.join(PUB, 'clip_meta.json');
  let merged = {};
  if (pos.length && !pos.includes('all')) { try { merged = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* none yet */ } }
  let files = 0, clips = 0;
  for (const [file, cs] of Object.entries(meta)) {
    const e = (merged[file] = {});
    for (const [clip, m] of Object.entries(cs)) { if (!m) continue; e[clip] = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, sig(v)])); clips++; }
    files++;
  }
  merged.about = 'Per model file and clip, what people.js prepareClip measures (n hips keys, duration, speed, locomotion, stride, hipsY, k = the hips lift applied, grounded), by tools/people_precompute.mjs';
  fs.writeFileSync(f, JSON.stringify(merged));
  console.log(`clip_meta.json: ${files} model files, ${clips} clips this run (${Math.round(fs.statSync(f).size / 1024)} KB)`);
} finally {
  if (logs.length) console.log(logs.slice(0, 10).join('\n'));
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
