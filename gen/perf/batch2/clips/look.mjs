// the clips agent's look check: the same fixed views on two snapshots, side by side (people move, so poses differ in
// time; what to see: the same people, in the same places, doing the same things)
//   tools/chrome_slot.sh node gen/perf/batch2/clips/look.mjs <out_dir> <url A> <url B> [views]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [out, A, B, views = 'crown,storyteller,grain_wharf'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
for (const [tag, url] of [['A', A], ['B', B]]) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(url, { timeout: 300000 });
  await page.waitForFunction(() => window.__test, null, { timeout: 600000 });
  for (const v of views.split(',')) {
    await page.evaluate((v) => window.__test.view(v), v);
    await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 120000, polling: 250 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(out, `${v}_${tag}.png`) });
  }
  await page.close();
}
await browser.close().catch(() => {});
for (const v of views.split(',')) {
  const [a, b] = await Promise.all(['A', 'B'].map((t) => sharp(path.join(out, `${v}_${t}.png`)).resize(960).toBuffer()));
  await sharp({ create: { width: 1930, height: 540, channels: 3, background: '#000' } }).composite([{ input: a, left: 0, top: 0 }, { input: b, left: 970, top: 0 }]).jpeg({ quality: 85 }).toFile(path.join(out, `${v}_AB.jpg`));
}
console.log('wrote', out);
