#!/usr/bin/env node
// Load a world page, stand at views and print what an expression returns there (the cells agent's debugging aid).
//   tools/chrome_slot.sh node gen/perf/batch2/cells/page_eval.mjs "<url>" "<expr>" [--views crown,under_arch] [--viewport 390x844x3]
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [url, expr] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const views = opt('--views', 'crown').split(',');
const [W, H, DPR] = opt('--viewport', '390x844x3').split('x').map(Number);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: W < 800 });
page.on('console', (m) => { if (m.type() !== 'debug') console.log(`[${m.type()}] ${m.text().slice(0, 400)}`); });
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
for (const v of views) {
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const r = await page.evaluate((e) => (0, eval)(e), expr);
  console.log(v, JSON.stringify(r, null, 1));
}
await page.close();
