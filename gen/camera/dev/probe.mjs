// dev probe: load the world page and report __test, page errors (usage: node probe.mjs <url>)
import { chromium } from 'playwright-core';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const page = await browser.contexts()[0].newPage();
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') logs.push(`[error] ${m.text()}`); });
await page.goto(process.argv[2]);
const t0 = Date.now();
let ok = false;
for (let i = 0; i < 60 && !ok; i++) { await page.waitForTimeout(2000); ok = await page.evaluate(() => !!window.__test?.film); }
console.log(ok ? `__test.film up in ${((Date.now() - t0) / 1000).toFixed(0)} s` : 'NO __test.film', logs.join('\n') || 'no page errors');
await page.close(); await browser.close();
