#!/usr/bin/env node
// The hashed names' 404 fallback (web/vite_asset_hashes.js): load a built page from which some hashed copies were
// removed (as a page loaded before a redeploy would meet them) and check that it still comes up whole, fetching the
// plain names instead.   tools/chrome_slot.sh node gen/perf/batch2/loading/fallback_check.mjs <url>
import { chromium } from 'playwright-core';

const url = process.argv[2];
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
await (await ctx.newCDPSession(page)).send('Network.clearBrowserCache'); // a slot's profile keeps its cache between runs
const errors = [], missing = [], plain = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() === 404) missing.push(r.url()); else if (/\/assets\/(trees\/trees|gate\/people)\.json$/.test(r.url())) plain.push(r.url()); });
await page.goto(url, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 240000 });
const st = await page.evaluate(() => ({ ok: !!window.__test, loaded: window.__test?.stream.stats().loaded, cards: window.__test?.stream.stats().cards }));
console.log(JSON.stringify({ ...st, missing, plain, errors: errors.filter((e) => !/404|Failed to load resource/.test(e)) }, null, 1));
await page.close(); await browser.close();
