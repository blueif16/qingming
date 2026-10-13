#!/usr/bin/env node
// Measure a scene page on the real GPU: Windows Chrome (tools/win_chrome.sh start) driven over CDP.
// The page must expose window.__test = { measure(seconds), view(name), views, set(key, value), renderer }
// (web/src/gate.js does). For each crowd size and named view it records fps, CPU and GPU ms per frame,
// draw calls and triangles; then the cost of the ink pass and shadows, a 2x pixel-ratio run and a 4x CPU
// throttle; and a screenshot of every view at the section's own density.
// With --configs <file.json>, it runs that list instead: [{ "label", "set": {key: value, ...}, "views": [..] (default
// all), "throttle": 4 (CPU slowdown), "dpr": 2, "shots": true (screenshot each view), "wait": 6 (seconds at each view
// before measuring) }, ...]; settings carry over
// between entries, so later entries only list what changes.
// Writes <out_dir>/bench.json, bench.md and <view>.png.
// Usage: node tools/bench_page.mjs <url> <out_dir> [--crowds 0,60,150,300,600] [--secs 2] [--density 60] [--configs f.json] [--hour 10|local]
//   [--viewport 390x844x3]  emulate a device from the first load (narrower than 800: a phone, touch on, so the page
//                           picks what it picks for touch screens); default 1920x1080x1
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [url, outDir] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const crowds = opt('--crowds', '0,60,150,300,600').split(',').map(Number);
const secs = +opt('--secs', 2);
const density = +opt('--density', 60);
const configs = opt('--configs', null) ? JSON.parse(fs.readFileSync(opt('--configs'), 'utf8')) : null;
fs.mkdirSync(outDir, { recursive: true });

let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch {
  console.error('No Chrome on 127.0.0.1:9223. Run tools/win_chrome.sh start first.'); process.exit(1);
}
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, VDPR] = opt('--viewport', '1920x1080x1').split('x').map(Number);
if (VDPR !== 1 || W < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: VDPR, mobile: W < 800 });
else await page.setViewportSize({ width: W, height: H });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const t0 = Date.now();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 120000 });
const loadMs = Date.now() - t0;
const failed = await page.evaluate(() => document.getElementById('loading')?.textContent);
if (failed) { console.error('LOAD FAILED:', failed, logs.join('\n')); process.exit(1); }

const env = await page.evaluate(() => {
  const gl = window.__test.renderer.getContext();
  const d = gl.getExtension('WEBGL_debug_renderer_info');
  const assets = performance.getEntriesByType('resource').filter((e) => e.name.includes('/assets/'));
  return {
    gpu: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    gpuTimer: window.__test.gpuTimer, ua: navigator.userAgent,
    assetBytes: assets.reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0),
    assets: assets.map((e) => [e.name.split('/assets/')[1], e.encodedBodySize || e.transferSize || 0]),
    views: window.__test.views,
  };
});
console.log(`${env.gpu}\nload ${loadMs} ms, assets ${(env.assetBytes / 1024).toFixed(0)} KB, views ${env.views.join(', ')}`);

const set = (k, v) => page.evaluate(([k, v]) => window.__test.set(k, v), [k, v]);
// pages follow the viewer's clock; measure at one hour (sun shadows on) so runs compare: --hour 10 (default) or local
const hour = opt('--hour', '10');
if (hour !== 'local') await set('hour', +hour);
const rows = [];
async function run(label, crowd, viewName, extra = {}, waitS = 0) {
  if (crowd != null) await set('crowd', crowd);
  await page.evaluate((v) => window.__test.view(v), viewName);
  await page.waitForTimeout(600 + waitS * 1000); // a config's "wait": seconds for a streamed-in window's bakes to finish
  const r = await page.evaluate((s) => window.__test.measure(s), secs);
  const mem = await page.evaluate(() => ({ heapMB: performance.memory ? performance.memory.usedJSHeapSize / 2 ** 20 : null, ...window.__test.renderer.info.memory,
    gpuMB: window.__test.gpuMem?.()?.total ?? null, tier: window.__test.tiers?.name ?? null, scale: window.__test.tiers?.scale ?? null,
    buffer: window.__test.renderer.getDrawingBufferSize(new window.__test.THREE.Vector2()).toArray() }));
  const row = { label, crowd, view: viewName, ...extra, ...r, ...mem };
  rows.push(row);
  console.log(`${label.padEnd(22)} crowd ${String(crowd).padStart(3)} ${viewName.padEnd(7)} ${r.fps.toFixed(0).padStart(5)} fps  cpu ${r.cpuMs.toFixed(2)} (anim ${r.animMs.toFixed(2)})  gpu ${r.gpuMs?.toFixed(2) ?? '-'} ms  ${r.calls} calls  ${(r.tris / 1000).toFixed(0)}k tris`);
  return row;
}

async function runConfigs() {
  for (const c of configs) {
    for (const [k, v] of Object.entries(c.set || {})) await set(k, v);
    if (c.dpr) { await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: c.dpr, mobile: false }); await set('pixelRatioCap', c.dpr); }
    if (c.throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.throttle });
    for (const v of c.views || env.views) {
      await run(c.label, null, v, {}, c.wait || 0);
      if (c.shots) await page.screenshot({ path: path.join(outDir, `${c.label.replace(/\W+/g, '_')}_${v}.png`) });
    }
    if (c.throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    if (c.dpr) { await cdp.send('Emulation.clearDeviceMetricsOverride'); await page.setViewportSize({ width: W, height: H }); await set('pixelRatioCap', 1.5); }
  }
}
if (configs) await runConfigs();
else {
// 1. crowd sizes x views, full quality
for (const c of crowds) for (const v of env.views) await run('full quality', c, v);
// 2. screenshots at the section's own density
await set('crowd', density);
for (const v of env.views) {
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, `${v}.png`) });
}
// 3. what the ink pass and shadows cost, on the heaviest view at 150 people
const worst = rows.filter((r) => r.crowd === Math.max(...crowds)).sort((a, b) => b.cpuMs + (b.gpuMs || 0) - a.cpuMs - (a.gpuMs || 0))[0]?.view || env.views[0];
const mid = crowds.includes(150) ? 150 : density;
for (const [label, ink, shadows] of [['ink off', false, true], ['shadows off', true, false], ['ink + shadows off', false, false]]) {
  await set('ink', ink); await set('shadows', shadows);
  await run(label, mid, worst);
}
await set('ink', true); await set('shadows', true);
// 4. fill rate: 2x pixel ratio (3840x2160 drawing buffer)
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false });
await set('pixelRatioCap', 2);
for (const c of [density, mid]) await run('dpr 2', c, worst);
await cdp.send('Emulation.clearDeviceMetricsOverride');
await page.setViewportSize({ width: W, height: H });
await set('pixelRatioCap', 1.5);
// 5. a slower CPU: 4x throttle (DevTools' own estimate of a mid-range phone)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
for (const c of [density, mid, Math.max(...crowds)]) await run('cpu 4x slower', c, worst);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await set('crowd', 0);
}

const result = { url, date: new Date().toISOString(), viewport: [W, H], secs, loadMs, ...env, rows, logs };
fs.writeFileSync(path.join(outDir, 'bench.json'), JSON.stringify(result, null, 1));
const f = (x, d = 2) => (x == null ? '–' : x.toFixed(d));
const md = [
  `# Bench: ${url}`, '', `${result.date} · ${env.gpu} · ${W}×${H} · ${secs} s per row · load ${loadMs} ms · assets ${(env.assetBytes / 1024).toFixed(0)} KB`, '',
  '| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.label} | ${r.people} | ${r.view} | ${f(r.fps, 0)} | ${f(r.cpuMs)} | ${f(r.animMs)} | ${f(r.gpuMs)} | ${r.calls} | ${(r.tris / 1000).toFixed(0)}k | ${r.buffer?.join('×') ?? '–'} | ${f(r.gpuMB, 0)} | ${f(r.heapMB, 0)} |`),
  '', logs.length ? '## Console\n\n' + logs.slice(0, 30).map((l) => '- ' + l).join('\n') : 'No console errors or warnings.', '',
];
fs.writeFileSync(path.join(outDir, 'bench.md'), md.join('\n'));
console.log(logs.length ? logs.slice(0, 20).join('\n') : 'no console errors/warnings');
console.log(`-> ${path.join(outDir, 'bench.md')}`);
await page.close();
await browser.close();
