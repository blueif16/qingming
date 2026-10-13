#!/usr/bin/env node
// Screenshots of a scene page from chosen spots, on the real GPU (Windows Chrome: tools/win_chrome.sh start).
// spots.json: [[name, X, D, H, facing_deg, pitch_deg, {settings}?], ...] in the section frame (X along the street,
// D depth, H height of the floor stood on; facing 0 = +X, 90 = +D). The optional settings object is applied with
// __test.set before the shot (e.g. {"view": "first"}) and stays until another spot changes it. The panel and help
// are hidden. Writes <out>/<name>.png and <out>/sheet.jpg (all shots, 2 per row).
// Usage: node tools/shots_page.mjs <url> <out_dir> <spots.json> [--hour 10|local]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [url, out, spotsFile] = process.argv.slice(2);
const spots = JSON.parse(fs.readFileSync(spotsFile, 'utf8'));
fs.mkdirSync(out, { recursive: true });
let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1600, height: 900 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 60000 }).catch(() => {}); // a module that fails to compile never says Failed
if (!(await page.evaluate(() => !!window.__test))) {
  // don't leave a broken page running in the bench Chrome (it would slow every later measurement)
  console.error(await page.evaluate(() => document.getElementById('loading')?.textContent), '\n' + logs.join('\n'));
  await page.close(); await browser.close(); process.exit(1);
}
await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); });
// pages follow the viewer's clock: shots are at 10:00 unless a spot sets its own hour (or --hour local keeps the clock)
const hourArg = process.argv.includes('--hour') ? process.argv[process.argv.indexOf('--hour') + 1] : '10';
if (hourArg !== 'local') await page.evaluate((h) => window.__test.set('hour', h), +hourArg);
await page.waitForTimeout(800);
for (const [name, X, D, H, f, p, set] of spots) {
  await page.evaluate(([X, D, H, f, p, set]) => {
    const t = window.__test; const d = Math.PI / 180;
    for (const [k, v] of Object.entries(set || {})) t.set(k, v);
    t.player.pos.set(X, H + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
    return t.goto?.(X, D, H); // a streaming page: wait for the sections round the spot
  }, [X, D, H, f, p, set]);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}
console.log(await page.evaluate(() => document.getElementById('stats').textContent));
await page.close(); await browser.close();
const W = 1000, Hh = 563;
const tiles = await Promise.all(spots.map(([n]) => sharp(path.join(out, `${n}.png`)).resize(W, Hh).toBuffer()));
await sharp({ create: { width: W * 2, height: Hh * Math.ceil(tiles.length / 2), channels: 3, background: '#fff' } })
  .composite(tiles.map((b, i) => ({ input: b, left: (i % 2) * W, top: Math.floor(i / 2) * Hh }))).jpeg({ quality: 85 }).toFile(path.join(out, 'sheet.jpg'));
console.log(logs.length ? logs.join('\n') : 'no console errors/warnings');
console.log(`-> ${path.join(out, 'sheet.jpg')}`);
