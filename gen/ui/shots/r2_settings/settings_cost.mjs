#!/usr/bin/env node
// What the direct HUD and the settings screen cost per frame (gen/ui/r2_settings.md "Cost"), measured as round 1's
// ui_cost.mjs does: world.html at a phone viewport (390 x 844, dpr 3, touch) under a 4x CPU throttle, at the tax office,
// A/B/C on one page:
//   A  walking HUD only (help folded, the screen closed)
//   B  the settings screen open on 時辰 (the world keeps drawing behind it)
//   C  the screen open on 進階 (the longest page, scrolled to its end)
// Per window: fps and the page's CPU per frame (__test.measure), Chrome's style + layout and script time per frame
// (CDP Performance metrics). Writes gen/ui/shots/r2_settings/cost_<phone|desktop>_<n>x.json.
//   tools/chrome_slot.sh node gen/ui/shots/r2_settings/settings_cost.mjs [url] [--throttle 4] [--reps 3] [--secs 3] [--desktop]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const url = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:5190/world.html';
const thr = +opt('--throttle', 4), reps = +opt('--reps', 3), secs = +opt('--secs', 3), desktop = args.includes('--desktop');
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => logs.push(e.message));
if (desktop) await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
else {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
await page.evaluate(async () => {
  const t = window.__test;
  t.set('hour', 10);
  t.ui.help(false);
  await t.goto(-36.4, 7.3);
  t.player.yaw = (84 * Math.PI) / 180 - Math.PI / 2;
  t.player.pitch = -0.14;
});
await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });

async function windowOf(mode) {
  await page.evaluate(async (mode) => {
    const t = window.__test;
    if (mode === 'closed') t.ui.settings.close();
    else {
      await t.ui.settings.open(mode === 'adv' ? 'adv' : 'time');
      if (mode === 'adv') t.ui.settings.select('reset');
    }
    await new Promise((r) => setTimeout(r, 900));
  }, mode);
  const m0 = await metrics();
  const r = await page.evaluate((s) => window.__test.measure(s), secs);
  const m1 = await metrics();
  const frames = Math.max(1, Math.round(r.fps * secs));
  return {
    mode, fps: +r.fps.toFixed(1), cpuMs: +r.cpuMs.toFixed(2), gpuMs: r.gpuMs == null ? null : +r.gpuMs.toFixed(2),
    styleLayoutMs: +(((m1.RecalcStyleDuration - m0.RecalcStyleDuration) + (m1.LayoutDuration - m0.LayoutDuration)) * 1000 / frames).toFixed(3),
    scriptMs: +(((m1.ScriptDuration - m0.ScriptDuration) * 1000) / frames).toFixed(2),
  };
}
const modes = ['closed', 'time', 'adv'];
const rows = [];
for (let i = 0; i < reps; i++) for (const m of modes) { const w = await windowOf(m); rows.push(w); console.log(JSON.stringify(w)); }
await page.evaluate(() => window.__test.ui.settings.close());
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const avg = (mode, k) => { const xs = rows.filter((r) => r.mode === mode && r[k] != null).map((r) => r[k]); return xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3) : null; };
const sum = {};
for (const m of modes) sum[m] = Object.fromEntries(['fps', 'cpuMs', 'gpuMs', 'styleLayoutMs', 'scriptMs'].map((k) => [k, avg(m, k)]));
const out = { date: new Date().toISOString(), url, viewport: desktop ? '1920x1080x1' : '390x844x3 touch', throttle: thr, secs, reps, rows, summary: sum, errors: logs };
const file = path.join(Q, `gen/ui/shots/r2_settings/cost_${desktop ? 'desktop' : 'phone'}_${thr}x.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(JSON.stringify(sum, null, 1));
console.log(logs.length ? logs.slice(0, 10).join('\n') : 'no console errors');
console.log('->', file);
await page.close();
await browser.close();
