// dev: time the ways to get a supersampled frame out of the page (run in a slot from tools/: node ../gen/camera/dev/capture_bench.mjs)
//   png4k: CDP PNG of the 4K buffer + sharp Lanczos to 1080p (what film_shot does)
//   jpeg4k: CDP JPEG q95 of the 4K buffer + sharp Lanczos
//   page: the page draws the 4K canvas into a 1080p 2D canvas (high smoothing) and returns PNG bytes
import { chromium } from 'playwright-core';
import sharp from 'sharp';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&sound=0&hour=10&spawn=crown');
await page.waitForFunction(() => window.__test?.film, null, { timeout: 240000 });
await page.evaluate(async () => { const f = window.__test.film; await f.load({ seconds: 5, camera: { kind: 'orbit', around: 'crown', dist: 30, el_deg: 30, from_deg: 180, turn_deg: 20 } }); await f.prepare({ ss: 2 }); f.warm(1, 30); });
const cdp = await ctx.newCDPSession(page);
const N = 12;
const time = async (name, fn) => { const t0 = Date.now(); let mean = 0, last = null; for (let i = 0; i < N; i++) { await page.evaluate((t) => window.__test.film.step(t, 1 / 30), i / 30); last = await fn(); } for (let j = 0; j < last.length; j += 997) mean += last[j]; console.log(name, ((Date.now() - t0) / N).toFixed(0), 'ms/frame, mean', (mean / (last.length / 997)).toFixed(1)); return last; };
const png4k = async () => sharp(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64')).removeAlpha().resize(1920, 1080, { kernel: 'lanczos3' }).raw().toBuffer();
const jpeg4k = async () => sharp(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true })).data, 'base64')).resize(1920, 1080, { kernel: 'lanczos3' }).raw().toBuffer();
const inpage = async () => {
  const b64 = await page.evaluate(() => { const src = window.__test.renderer.domElement; const c = (window.__dc ||= Object.assign(document.createElement('canvas'), { width: 1920, height: 1080 })); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, 1920, 1080); return c.toDataURL('image/png').slice(22); });
  return sharp(Buffer.from(b64, 'base64')).removeAlpha().raw().toBuffer();
};
await time('png4k ', png4k); await time('jpeg4k', jpeg4k); await time('page  ', inpage);
await page.evaluate(() => window.__test.film.step(1, 1 / 30)); // one frame, three captures of it
const A = await png4k(), B = await jpeg4k(), C = await inpage();
const diff = (x, y) => { let d = 0; for (let j = 0; j < x.length; j += 13) d += Math.abs(x[j] - y[j]); return (d / (x.length / 13)).toFixed(2); };
console.log('same last frame? mean abs diff png-jpeg', diff(A, B), ' png-page', diff(A, C));
await sharp(A, { raw: { width: 1920, height: 1080, channels: 3 } }).png().toFile('/home/ran/3d_director/qingming/gen/camera/dev/cap_png4k.png');
await sharp(C, { raw: { width: 1920, height: 1080, channels: 3 } }).png().toFile('/home/ran/3d_director/qingming/gen/camera/dev/cap_page.png');
await ctx.close(); await browser.close();
