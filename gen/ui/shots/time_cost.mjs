#!/usr/bin/env node
// What the time instrument costs per frame (gen/ui/r2_time.md "Cost"), as ui_cost.mjs measures the UI: world.html at a
// phone viewport (390 x 844, dpr 3, touch) under a 4x CPU throttle, at the spawn, A/B/C on one page:
//   A  idle: the hour held at 16.5 (靜; the instrument writes nothing; your own clock re-lights once every 10 s)
//   B  dragging: a finger scrubs the scroll back and forth over three hours the whole window (re-lit every frame)
//   C  flowing at 疾 (re-lit every frame, the strip moving)
// Per window: fps and the page's CPU per frame (__test.measure), re-lighting time per frame (__test.time.cost: applyLight
// with the instrument's set), and Chrome's script / style + layout time per frame (CDP Performance metrics).
//   tools/chrome_slot.sh node gen/ui/shots/time_cost.mjs [url] [--throttle 4] [--reps 2] [--secs 3] [--desktop] [--out file.json]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const url = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:5190/world.html';
const thr = +opt('--throttle', 4), reps = +opt('--reps', 2), secs = +opt('--secs', 3), desktop = args.includes('--desktop'), out = opt('--out', null);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (desktop) await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
else {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); window.__test.ui.help(false); window.__test.time.setHour(16.5); });
await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
const r = await page.evaluate(() => { const b = document.querySelector('.tm-scroll').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
const cx = r.x + r.w / 2, cy = r.y + r.h * 0.4, pph = r.w / 6;

async function windowOf(mode) {
  await page.evaluate((mode) => {
    const T = window.__test.time;
    if (mode === 'idle') T.setHour(16.5); // the same hour as the others (the night has no sun shadows: cheaper)
    if (mode === 'drag') T.setHour(16.5);
    if (mode === 'flow') { T.setHour(16.5); T.setFlow('疾'); }
    T.cost(true);
  }, mode);
  let dragging = null;
  if (mode === 'drag') {
    // a finger moving every ~16 ms (real time) back and forth over three hours
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    let k = 0, stop = false;
    dragging = (async () => { while (!stop) { const x = cx + Math.sin(k++ * 0.08) * pph * 1.5; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: cy, id: 1 }] }); await new Promise((res) => setTimeout(res, 16)); } })();
    dragging.stop = () => { stop = true; };
    await page.waitForTimeout(300);
  }
  const m0 = await metrics();
  const res = await page.evaluate((s) => window.__test.measure(s), secs);
  const m1 = await metrics();
  const tc = await page.evaluate(() => window.__test.time.cost());
  if (dragging) { dragging.stop(); await dragging; await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  if (mode === 'flow') await page.evaluate(() => window.__test.time.setFlow('靜'));
  const frames = Math.max(1, Math.round(res.fps * secs));
  const per = (k) => +(((m1[k] - m0[k]) * 1000) / frames).toFixed(3);
  return { mode, fps: +res.fps.toFixed(1), cpuMs: +res.cpuMs.toFixed(2), relightMsPerFrame: +((tc.msPerLight * tc.lights) / frames).toFixed(3), relightsPerFrame: +(tc.lights / frames).toFixed(2),
    msPerRelight: +tc.msPerLight.toFixed(3), scriptMs: per('ScriptDuration'), styleLayoutMs: +(per('RecalcStyleDuration') + per('LayoutDuration')).toFixed(3) };
}

const rows = [];
for (let i = 0; i < reps; i++) for (const m of ['idle', 'drag', 'flow']) rows.push(await windowOf(m));
const avg = (mode, k) => +(rows.filter((x) => x.mode === mode).reduce((a, x) => a + x[k], 0) / reps).toFixed(3);
const summary = Object.fromEntries(['idle', 'drag', 'flow'].map((m) => [m, Object.fromEntries(['fps', 'cpuMs', 'relightMsPerFrame', 'relightsPerFrame', 'msPerRelight', 'scriptMs', 'styleLayoutMs'].map((k) => [k, avg(m, k)]))]));
const report = { url, throttle: thr, device: desktop ? 'desktop 1920x1080' : 'phone 390x844 dpr3', secs, reps, summary, rows };
console.log(JSON.stringify(report, null, 1));
if (out) fs.writeFileSync(out, JSON.stringify(report, null, 1));
await page.close();
await browser.close();
