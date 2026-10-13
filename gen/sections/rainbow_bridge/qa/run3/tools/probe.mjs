#!/usr/bin/env node
// S3 QA probe: open <url> in the S3 headless Chrome (CDP_PORT, default 9243), wait for __test, run the async
// function body in <js file> (it gets `args` and returns JSON), print the result, close the tab.
// Usage: node probe.mjs <url> <fn.js> [json args]
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const [url, fnFile, argJson] = process.argv.slice(2);
const body = fs.readFileSync(fnFile, 'utf8');
const args = argJson ? JSON.parse(argJson) : {};
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9243'));
const page = await browser.contexts()[0].newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
try {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(url, { timeout: 180000, waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
  const fn = new Function('args', `return (async () => { ${body} })();`);
  const r = await page.evaluate(`(${fn.toString()})(${JSON.stringify(args)})`);
  console.log(JSON.stringify(r, null, 1));
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
} finally {
  if (logs.length) console.error(logs.slice(0, 30).join('\n'));
  await page.close(); await browser.close();
}
