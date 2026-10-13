#!/usr/bin/env node
// The start screen's press as a phone's Chrome sees it (no throttling): the page state every 2 s after 入畫, and its
// console. For when preload_check.mjs never reaches walking.
//   tools/chrome_slot.sh node gen/perf/start_preload/press_debug.mjs <url> [read s]
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const args = process.argv.slice(2), has = (k) => args.includes(k);
const [url, read = '3'] = args.filter((a) => !a.startsWith('--'));
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const b = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = b.contexts()[0];
const page = await ctx.newPage();
await page.bringToFront();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
if (has('--phone')) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}
if (has('--net')) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 }); }
if (has('--cold')) { await cdp.send('Network.enable'); await cdp.send('Network.clearBrowserCache'); }
if (has('--cpu')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const log = [];
page.on('pageerror', (e) => log.push('pageerror ' + e.message));
page.on('console', (m) => log.push(m.type() + ' ' + m.text().slice(0, 160)));
const state = () => page.evaluate(() => ({ cls: document.getElementById('loading')?.className ?? '(gone)', go: document.querySelector('.ld-go')?.disabled ?? '(no button)',
  ld: getComputedStyle(document.getElementById('loading') || document.body).getPropertyValue('--ld'), test: !!window.__test, vis: document.visibilityState }));
await page.goto(url);
await page.waitForSelector('.ld-start .ld-go', { state: 'attached', timeout: 120000 });
for (let i = 0; i < +read; i++) { await page.waitForTimeout(1000); console.log('wait', i + 1, JSON.stringify(await state())); }
await page.evaluate(() => document.querySelector('.ld-go').click());
console.log('pressed');
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(2000);
  const s = await state();
  console.log((i + 1) * 2, 's', JSON.stringify(s));
  if (s.cls === '(gone)' || !s.cls.includes('ld-')) break;
}
console.log(log.slice(0, 40).join('\n'));
await page.close();
process.exit(0);
