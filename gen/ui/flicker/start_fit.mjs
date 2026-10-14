// The start panel's fit (2026-10-13): where the credits and the 卷記 link end against the painting band, per viewport.
//   tools/chrome_slot.sh node gen/ui/flicker/start_fit.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const ctx = browser.contexts()[0];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const PUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const out = [];
for (const [w, h, mobile] of [[1280, 800, false], [1366, 768, false], [1440, 900, false], [1920, 1080, false], [390, 844, true], [375, 667, true], [844, 390, true]]) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: mobile ? PUA : UA });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await page.goto('http://127.0.0.1:5190/world.html');
  await page.waitForSelector('#loading .ld-more', { timeout: 60000 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return Math.round(b.bottom); };
    const band = Math.round(document.querySelector('.ld-band').getBoundingClientRect().top);
    const st = () => ({ go: r('.ld-go'), credit: r('.ld-credit'), more: r('.ld-more'), band, scroll: document.querySelector('#loading').scrollHeight > innerHeight + 2 });
    const now = st();
    const hope = document.querySelector('.ld-hope');
    hope.querySelector('.ld-gloss').style.cssText = '';
    const inline = st();
    hope.style.display = 'none';
    const without = st();
    return { now, inline, without };
  });
  out.push(`${w}x${h}${mobile ? ' phone' : ''}: band top ${m.now.band} | without line: credit ${m.without.credit} more ${m.without.more} | with: credit ${m.now.credit} more ${m.now.more} | inline gloss: credit ${m.inline.credit} more ${m.inline.more}`);
  await page.close();
}
console.log(out.join('\n'));
await browser.close();
