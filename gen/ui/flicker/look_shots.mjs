// The 2026-10-13 look check (kept beside its results): the start screen (desktop + phone, passing as a normal Chrome so ui/start.js shows it), its
// 卷記 maker card, and the 前路漸展 note while a far section streams in on a slow link.
//   tools/chrome_slot.sh node <this> <out_dir>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const URL = 'http://127.0.0.1:5190/world.html';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const DESK_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const log = [];

async function startScreen(name, { ua, w, h, dpr, mobile }) {
  const page = await ctx.newPage();
  await page.bringToFront();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: ua, platform: mobile ? 'Android' : 'Windows' });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  if (mobile) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.goto(URL);
  await page.waitForSelector('#loading .ld-start .ld-hope', { timeout: 60000 });
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/start_${name}.png` });
  const r = await page.evaluate(() => {
    const b = document.querySelector('.ld-go').getBoundingClientRect(), hope = document.querySelector('.ld-hope').getBoundingClientRect();
    const fam = getComputedStyle(document.querySelector('.ld-hope')).fontFamily;
    const ok = document.fonts.check('15px "QM Text"', '王軾然製作希望大家喜歡');
    return { button: [Math.round(b.top), Math.round(b.bottom)], hope: [Math.round(hope.top), Math.round(hope.bottom)], vh: innerHeight, fam, qmTextHasGlyphs: ok };
  });
  log.push({ name, ...r });
  // the 卷記 and its maker card
  await page.waitForSelector('.ld-maker', { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('.ld-maker')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/maker_${name}.png` });
  await page.close();
}

await startScreen('desktop', { ua: DESK_UA, w: 1280, h: 800, dpr: 1, mobile: false });
await startScreen('phone', { ua: PHONE_UA, w: 390, h: 844, dpr: 2, mobile: true });

// the note: in the world (start=0), a far teleport on a slow link; sample the note and shoot it once it shows
{
  const page = await ctx.newPage();
  await page.bringToFront();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${URL}?start=0&hour=11`);
  await page.waitForFunction(() => window.__test, null, { timeout: 120000 });
  await page.waitForFunction(() => window.__test.ui.started(), null, { timeout: 30000 });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 });
  const t0 = Date.now();
  await page.evaluate(() => { window.__trip = window.__test.view('grain_wharf'); });
  const seen = [];
  let shot = false;
  while (Date.now() - t0 < 90000) {
    const a = await page.evaluate(() => window.__test.ui.ahead());
    seen.push([Math.round((Date.now() - t0) / 100) / 10, a.loading, a.shown]);
    if (a.shown && !shot) { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/ahead_desktop.png` }); shot = true; }
    if (!a.loading && !a.shown && Date.now() - t0 > 3000) break;
    await page.waitForTimeout(250);
  }
  log.push({ name: 'ahead', firstShown: seen.find((s) => s[2])?.[0] ?? null, lastShown: [...seen].reverse().find((s) => s[2])?.[0] ?? null,
    loadingSecs: seen.filter((s) => s[1]).length * 0.25, samples: seen.length });
  await page.close();
}
console.log(JSON.stringify(log, null, 1));
await browser.close();
