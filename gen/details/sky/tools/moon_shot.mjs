#!/usr/bin/env node
// The moon at dusk, head on: first person at a view, for each [hour, yaw, pitch] (absolute walker yaw/pitch, from
// daylight.js lightAt(hour).moonDir: yaw = atan2(-x, -z), pitch = asin(y)), a full frame and a 1:1 crop of the middle.
//   tools/chrome_slot.sh node gen/details/sky/tools/moon_shot.mjs <url> <out_dir> <view> '[[19,1.664,0.316],...]'
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const req = createRequire(path.join(ROOT, 'tools/package.json'));
const sharp = req('sharp');
const { chromium } = req('playwright-core');
const [url, outDir, view, list] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
await page.setViewportSize({ width: 1600, height: 900 });
const crops = [];
try {
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__test, null, { timeout: 300000 });
  await page.evaluate((v) => { const T = window.__test; T.set('timeFlow', 0); T.set('view', 'first'); return T.view(v); }, view);
  await page.waitForTimeout(1500);
  for (const [h, yaw, pitch] of JSON.parse(list)) {
    await page.evaluate(([h, y, p]) => { const T = window.__test; T.set('hour', h); T.player.yaw = y; T.player.pitch = p; }, [h, yaw, pitch]);
    await page.waitForTimeout(1200);
    const f = path.join(outDir, `moon_${view}_h${h}.png`);
    await page.screenshot({ path: f });
    const c = path.join(outDir, `moon_${view}_h${h}_crop.png`);
    await sharp(f).extract({ left: 650, top: 300, width: 300, height: 300 }).toFile(c);
    crops.push(c);
  }
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
const tiles = await Promise.all(crops.map((c) => sharp(c).png().toBuffer()));
await sharp({ create: { width: 300 * tiles.length, height: 300, channels: 3, background: '#fff' } })
  .composite(tiles.map((input, i) => ({ input, left: i * 300, top: 0 }))).png().toFile(path.join(outDir, `moon_${view}_crops.png`));
console.log('->', path.join(outDir, `moon_${view}_crops.png`));
