#!/usr/bin/env node
// The loading agent's first-load detail (perf batch 2): like gen/perf/probe.mjs load (phone viewport, CPU 4x, an
// emulated link, a cold visit then a second visit with the cache), plus when the tree cards are all full size and,
// for each visit, which requests touched the network (transferSize > 0: a full download or a 304 revalidation) and
// which came from the browser cache alone.
//   tools/chrome_slot.sh node gen/perf/batch2/loading/load_detail.mjs <url> <out.json> [--net fast4g|slow4g] [--throttle 4]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [url, outFile] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const nets = { slow4g: { latency: 150, down: 1.6e6, up: 0.75e6 }, fast4g: { latency: 60, down: 9e6, up: 1.5e6 } };
const net = nets[opt('--net', 'fast4g')], thr = +opt('--throttle', 4);

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.addInitScript(() => performance.setResourceTimingBufferSize(5000)); // the default 250 entries cut the count short
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: net.down / 8, uploadThroughput: net.up / 8 });
if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
const out = { url, net: opt('--net', 'fast4g'), throttle: thr, date: new Date().toISOString(), runs: [] };
const res = () => page.evaluate(() => performance.getEntriesByType('resource').map((e) => ({ name: e.name.replace(location.origin, ''), t: Math.round(e.transferSize || 0), b: Math.round(e.encodedBodySize || 0) })));
const sum = (r) => ({ n: r.length, kb: Math.round(r.reduce((a, e) => a + e.t, 0) / 1024), body: Math.round(r.reduce((a, e) => a + e.b, 0) / 1024),
  network: r.filter((e) => e.t > 0).length, cacheOnly: r.filter((e) => e.t === 0 && e.b > 0).length,
  treesKB: Math.round(r.filter((e) => /\/trees\//.test(e.name)).reduce((a, e) => a + e.t, 0) / 1024) });
for (const visit of ['cold', 'warm']) {
  if (visit === 'cold') await cdp.send('Network.clearBrowserCache');
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'commit', timeout: 600000 });
  await page.waitForFunction(() => document.readyState !== 'loading' && !document.getElementById('loading'), null, { timeout: 900000, polling: 200 });
  const walk = { ms: Date.now() - t0, ...sum(await res()) };
  await page.waitForFunction(() => window.__test, null, { timeout: 900000, polling: 250 });
  const win = { ms: Date.now() - t0, ...sum(await res()) };
  // every tree card full size: no small card (assets/trees/small/) left in the texture cache
  await page.waitForFunction(() => ![...window.__test.stream.internals.texCache.entries.keys()].some((k) => k.includes('/trees/small/')), null, { timeout: 900000, polling: 250 });
  const r = await res();
  const sharp = { ms: Date.now() - t0, ...sum(r) };
  const run = { visit, walk, window: win, sharp, network: r.filter((e) => e.t > 0).map((e) => `${e.t} ${e.name}`) };
  out.runs.push(run);
  console.log(visit, 'walk', walk.ms, 'ms', JSON.stringify(walk), '| window', win.ms, 'ms', JSON.stringify(win), '| cards full', sharp.ms, 'ms', JSON.stringify(sharp));
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
await page.close().catch(() => {});
await browser.close().catch(() => {});
