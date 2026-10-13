#!/usr/bin/env node
// In-page A/B (perf batch 2, frame-rate agent): one page, one view, a runtime switch flipped between short measures,
// A B A B ..., so whatever else the machine does lands on both sides alike (the shared machine made two-page benches
// swing by 2x). Each view is warmed unthrottled (its bakes done), then measured under the CPU throttle.
//   tools/chrome_slot.sh node gen/perf/batch2/framerate/inpage_ab.mjs "<url>" <out.json> --a "<js>" --b "<js>"
//     [--views crown,grain_wharf,storyteller] [--viewport 390x844x3] [--throttle 4] [--rounds 8] [--secs 1.5] [--wait 12]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, out] = pos;
const A = opt('--a'), B = opt('--b');
const views = opt('--views', 'crown,grain_wharf,storyteller').split(',');
const rounds = +opt('--rounds', 8), secs = +opt('--secs', 1.5), throttle = +opt('--throttle', 4), waitS = +opt('--wait', 12);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, D] = opt('--viewport', '390x844x3').split('x').map(Number);
if (D !== 1 || W < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: D, mobile: W < 800 });
else await page.setViewportSize({ width: W, height: H });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (['error'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 180000 });
await page.evaluate(() => window.__test.set('hour', 10));
const med = (xs) => { const s = [...xs].sort((p, q) => p - q); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const res = { url, A, B, rounds, secs, throttle, views: {} };
for (const v of views) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(waitS * 1000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.waitForTimeout(1500);
  const rows = { A: [], B: [] };
  for (let r = 0; r < rounds; r++) {
    for (const [side, expr] of r % 2 ? [['B', B], ['A', A]] : [['A', A], ['B', B]]) { // ABBA order: no drift between sides
      await page.evaluate(expr);
      await page.waitForTimeout(300);
      rows[side].push(await page.evaluate((s) => window.__test.measure(s), secs));
    }
  }
  const sum = (side) => ({ fps: +med(rows[side].map((x) => x.fps)).toFixed(1), cpuMs: +med(rows[side].map((x) => x.cpuMs)).toFixed(2),
    gpuMs: rows[side][0].gpuMs == null ? null : +med(rows[side].map((x) => x.gpuMs)).toFixed(2), calls: med(rows[side].map((x) => x.calls)) });
  res.views[v] = { A: sum('A'), B: sum('B'), raw: rows };
  const a = res.views[v].A, b = res.views[v].B;
  console.log(`${v.padEnd(12)} A ${a.fps} fps cpu ${a.cpuMs} gpu ${a.gpuMs} calls ${a.calls} | B ${b.fps} fps cpu ${b.cpuMs} gpu ${b.gpuMs} calls ${b.calls} | cpu ${(100 * (b.cpuMs / a.cpuMs - 1)).toFixed(1)}%`);
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
res.logs = logs;
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(logs.length ? logs.slice(0, 10).join('\n') : 'no console errors');
await page.close();
process.exit(0);
