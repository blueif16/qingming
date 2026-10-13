// Screenshot gen/ui/fonts/specimen.html in a check-Chrome slot (the slot sets CDP_PORT):
//   tools/chrome_slot.sh node gen/ui/fonts/specimen_shot.mjs
// The page is served to Chrome from a fake origin (http://specimen.local/) by request interception, so it can load
// its fonts and the SVGs under web/public without a dev server. Writes specimen.png (DPR 1, the worst case for
// legibility) and specimen_phone.png (the phone section at DPR 2).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(path.resolve('tools') + '/');
const { chromium } = require('playwright-core');
const QM = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const types = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.js': 'text/javascript' };
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${process.env.CDP_PORT}`);
const ctx = browser.contexts()[0] || await browser.newContext();
async function shot(dpr, out, selector) {
  const page = await ctx.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: dpr, mobile: false });
  await page.route('http://specimen.local/**', route => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//, '');
    const file = path.join(QM, rel);
    if (!file.startsWith(QM) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'missing' });
    route.fulfill({ status: 200, contentType: types[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
  await page.goto('http://specimen.local/gen/ui/fonts/specimen.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const el = selector ? await page.$(selector) : null;
  if (el) await el.screenshot({ path: out }); else await page.screenshot({ path: out, fullPage: true });
  const fams = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family));
  console.log(out, 'fonts loaded:', fams.length);
  await page.close();
}
await shot(1, path.join(QM, 'gen/ui/fonts/specimen.png'));
await shot(2, path.join(QM, 'gen/ui/fonts/specimen_phone.png'), '#phone');
await browser.close();
