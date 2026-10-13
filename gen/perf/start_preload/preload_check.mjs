#!/usr/bin/env node
// The start-screen preload (2026-10-13; the user: "pre loading some of the assets at the start screen ... then we can
// continue with the progressive loadings"). The headless tools never see the start screen (ui/start.js skips it under
// HeadlessChrome), so this one passes as a phone's Chrome: a mobile user agent, phone viewport, CPU 4x, an emulated
// link, a cold cache. It waits `--read` seconds on the start screen, presses 入畫, and times the press -> walking
// (#loading gone), with the bytes that came before and after the press. --read 0 presses at once (the old order: all
// of it after the press).
//   python3 gen/perf/batch2/serve.py <built dir> 5201 web/vercel.json &
//   tools/chrome_slot.sh node gen/perf/start_preload/preload_check.mjs http://127.0.0.1:5201/world.html out.json --read 0,12 --reps 2
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [url, outFile] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const nets = { slow4g: { latency: 150, down: 1.6e6, up: 0.75e6 }, fast4g: { latency: 60, down: 9e6, up: 1.5e6 } };
const netName = opt('--net', 'fast4g'), net = nets[netName], thr = +opt('--throttle', 4);
const reads = opt('--read', '0,12').split(',').map(Number), reps = +opt('--reps', 2);
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const out = { url, net: netName, throttle: thr, date: new Date().toISOString(), runs: [] };
const kb = (page) => page.evaluate(() => Math.round(performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0) / 1024));
for (let rep = 0; rep < reps; rep++) for (const read of reads) {
  const page = await ctx.newPage();
  await page.bringToFront(); // a background tab gets no frames: the page's own loading and the waits below stall
  const cdp = await ctx.newCDPSession(page);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => performance.setResourceTimingBufferSize(5000));
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: net.down / 8, uploadThroughput: net.up / 8 });
  if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'commit', timeout: 600000 });
  await page.waitForSelector('.ld-start .ld-go', { state: 'attached', timeout: 300000 });
  const shown = Date.now() - t0;
  if (read) await page.waitForTimeout(read * 1000);
  // the press, as a person presses: again until it takes (the button is in the page's HTML before the script that
  // answers it has loaded: an early click does nothing), timed from the click that took (go() disables the button)
  let tries = 0;
  for (;;) {
    tries++;
    const took = await page.evaluate(() => { const b = document.querySelector('.ld-go'); if (!b) return true; b.click(); return b.disabled; });
    if (took) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  const tp = Date.now();
  const before = await kb(page);
  // polled from here (a page-side waitForFunction never returned under the emulation, 2026-10-13)
  let walk = null;
  for (let i = 0; i < 3000 && walk === null; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (await page.evaluate(() => !document.getElementById('loading')).catch(() => false)) walk = Date.now() - tp;
  }
  const after = await kb(page);
  const run = { rep, read, screenShownMs: shown, pressTries: tries, pressAtMs: tp - t0, pressToWalkMs: walk, kbBeforePress: before, kbAtWalk: after, errors: errors.slice(0, 5) };
  out.runs.push(run);
  console.log(JSON.stringify(run));
  await page.close().catch(() => {});
}
for (const read of reads) {
  const r = out.runs.filter((x) => x.read === read).map((x) => x.pressToWalkMs).sort((a, b) => a - b);
  console.log(`read ${read} s: press -> walk ${r.join(', ')} ms`);
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
await browser.close().catch(() => {});
