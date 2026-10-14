#!/usr/bin/env node
// A small page probe for the interactions round: open the world, run a JS snippet file in the page (an async function
// body that gets `t` = window.__test), print its JSON result.
//   tools/chrome_slot.sh node gen/interact/tools/probe.mjs "<url>" <snippet.js> [shot.png]
// (in the snippet, `await __shot(path)` takes a screenshot midway)
import fs from 'node:fs';
import { chromium } from '../../../tools/node_modules/playwright-core/index.mjs';
const [url, snippet, shot] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1280, height: 800 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
// the snippet may call `await __shot('name.png')` for a screenshot midway
await page.exposeFunction('__shot', (p) => page.screenshot({ path: p }).then(() => true));
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
const body = fs.readFileSync(snippet, 'utf8');
const out = await page.evaluate(`(async () => { const t = window.__test; ${body} })()`);
if (shot) await page.screenshot({ path: shot });
console.log(JSON.stringify({ out, logs: logs.slice(0, 30) }, null, 1));
await page.close();
await browser.close();
