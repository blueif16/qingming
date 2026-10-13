#!/usr/bin/env node
// Where the shadow pass's time goes (perf batch 2, frame-rate agent): per view, the shadow passes timed (CPU, from
// three's shadow render call to its return) and their draw calls, split into world-layer passes and movers-only passes,
// and the casters each layer holds by kind, under the CPU throttle.
//   tools/chrome_slot.sh node gen/perf/batch2/framerate/shadow_split.mjs "<url>" <out.json> [--views a,b] [--viewport 390x844x3] [--throttle 4]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, out] = pos;
const views = opt('--views', 'crown,grain_wharf,storyteller').split(',');
const throttle = +opt('--throttle', 4);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, D] = opt('--viewport', '390x844x3').split('x').map(Number);
if (D !== 1 || W < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: D, mobile: W < 800 });
else await page.setViewportSize({ width: W, height: H });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
await page.evaluate(() => {
  const T = window.__test, sm = T.renderer.shadowMap, inner = sm.render, info = T.renderer.info.render;
  window.__split = { rows: [] };
  sm.render = function (lights, sc, cam) {
    if (!this.needsUpdate || !lights.length) return inner.call(this, lights, sc, cam);
    const world = !!T.shadowLayers?.world, c0 = info.calls, t0 = performance.now();
    inner.call(this, lights, sc, cam);
    window.__split.rows.push({ world, ms: performance.now() - t0, calls: info.calls - c0 });
  };
  // the casters, by kind and layer
  window.__casters = () => {
    const out = {};
    for (const o of T.scene.children) {
      const k = `${o.userData.shadowMover ? 'mover' : 'world'}:${(o.name || o.type).replace(/_.*$/, '')}`;
      o.traverse((x) => { if (x.isMesh && x.castShadow && x.visible) out[k] = (out[k] || 0) + 1; });
    }
    return out;
  };
  T.set('hour', 10);
});
const res = { url, views: {} };
for (const v of views) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(12000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.waitForTimeout(1000);
  const r = {};
  for (const mode of ['one', 'two']) {
    await page.evaluate((m) => { const L = window.__test.shadowLayers; L.on = m === 'two'; L.world = true; window.__split.rows = []; }, mode);
    const m = await page.evaluate(() => window.__test.measure(3));
    const rows = await page.evaluate(() => window.__split.rows);
    const sum = (f) => { const x = rows.filter(f); return { n: x.length, ms: x.length ? +(x.reduce((a, q) => a + q.ms, 0) / x.length).toFixed(2) : 0, calls: x.length ? Math.round(x.reduce((a, q) => a + q.calls, 0) / x.length) : 0 }; };
    r[mode] = { fps: +m.fps.toFixed(1), cpuMs: +m.cpuMs.toFixed(2), frames: Math.round(m.fps * 3), passes: rows.length, world: sum((q) => q.world), movers: sum((q) => !q.world),
      shadowMsPerFrame: +(rows.reduce((a, q) => a + q.ms, 0) / Math.max(1, m.fps * 3)).toFixed(2) };
  }
  r.casters = await page.evaluate(() => window.__casters());
  res.views[v] = r;
  console.log(v, JSON.stringify({ one: r.one, two: r.two }));
  console.log('  casters', JSON.stringify(r.casters));
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
fs.writeFileSync(out, JSON.stringify(res, null, 1));
await page.close();
process.exit(0);
