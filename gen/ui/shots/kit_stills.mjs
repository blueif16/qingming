#!/usr/bin/env node
// Stills of the world for the UI kit page (web/ui.html): the street at the tax office (V5.1's figures in view), with
// every UI element hidden, at desktop 1920 x 1080 and phone 390 x 844 (dpr 2), by day and by night; plus where each
// role's head is on the screen, so the kit anchors its bubbles over real heads.
//   tools/chrome_slot.sh node gen/ui/shots/kit_stills.mjs
// Writes web/src/ui/kit/still_<device>_<tod>.webp and web/src/ui/kit/stills.json (dev-only files: not in public/, so
// they never ship).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const req = createRequire(`${Q}/tools/package.json`);
const { chromium } = req('playwright-core');
const sharp = req('sharp');
const OUT = path.join(Q, 'web/src/ui/kit');
fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] || 'http://127.0.0.1:5190/world.html';
const SPOT = { X: -36.4, D: 7.3, facing: 84, pitch: -8 };
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const meta = fs.existsSync(path.join(OUT, 'stills.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'stills.json'), 'utf8')) : {};
for (const device of ['desktop', 'phone']) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const W = device === 'phone' ? 390 : 1920, H = device === 'phone' ? 844 : 1080, dpr = device === 'phone' ? 2 : 1;
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: dpr, mobile: device === 'phone' });
  if (device === 'phone') await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.goto(URL);
  await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
  await page.addStyleTag({ content: '.qm-ui, #help, #soundCtl, #dial, .sh-open, #stats, .lil-gui { display: none !important; }' });
  for (const [tod, hour] of [['day', 10], ['night', 21.5]]) {
    const heads = await page.evaluate(async ({ SPOT, hour }) => {
      const t = window.__test, d = Math.PI / 180;
      t.set('hour', hour);
      await t.goto(SPOT.X, SPOT.D);
      t.player.yaw = SPOT.facing * d - Math.PI / 2;
      t.player.pitch = SPOT.pitch * d;
      await new Promise((r) => setTimeout(r, 2500));
      return t.ui.heads('V5.1');
    }, { SPOT, hour });
    const png = await page.screenshot();
    const file = `still_${device}_${tod}.webp`;
    await sharp(png).webp({ quality: device === 'phone' ? 72 : 68 }).toFile(path.join(OUT, file));
    meta[`${device}_${tod}`] = { file, w: W, h: H, heads };
    console.log(file, JSON.stringify(heads));
  }
  await page.close();
}
fs.writeFileSync(path.join(OUT, 'stills.json'), JSON.stringify(meta, null, 1));
await browser.close();
