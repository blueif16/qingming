#!/usr/bin/env node
// UI screenshots of world.html (or ui.html) at desktop and phone sizes, day and night, with UI states driven by small
// page-side snippets. Run inside a check-Chrome slot against the check server:
//   tools/chrome_slot.sh node gen/ui/shots/ui_shots.mjs <out_dir> <plan.json>
// plan.json: { "url": "http://127.0.0.1:5190/world.html", "pages": [ { "device": "desktop"|"phone", "url"?: ...,
//   "loading": "<name>"?   (a shot of the loading screen ~0.4 s after navigation, before the world is in)
//   "shots": [ { "name", "hour"?, "at"?: [X, D] | "<view>", "facing"?: deg, "pitch"?: deg, "js"?: "<async body>",
//                "wait"?: ms } ] } ] }
// "js" runs in the page as the body of an async function with t = window.__test (may return a value, logged).
// The tuning panel is removed; #help and #stats are left as the page shows them.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const [out, planFile] = process.argv.slice(2);
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const logs = [];
const opened = [];
const cleanup = async (err) => { if (err) console.error(err); for (const p of opened) await p.close().catch(() => {}); await browser.close().catch(() => {}); process.exit(err ? 1 : 0); };
process.on('unhandledRejection', cleanup);
process.on('uncaughtException', cleanup);

for (const pg of plan.pages) {
  const page = await ctx.newPage();
  opened.push(page);
  const tag = pg.device;
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${tag} ${m.type()}] ${m.text()}`); if (process.env.UI_VERBOSE || m.text().startsWith('[ui]')) console.log(m.type(), m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push(`[${tag} pageerror] ${e.message}`));
  const cdp = await ctx.newCDPSession(page);
  if (pg.device === 'phone') {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  } else {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: pg.width || 1920, height: pg.height || 1080, deviceScaleFactor: 1, mobile: false });
  }
  const url = pg.url || plan.url;
  await page.goto(url, { waitUntil: 'commit' });
  if (pg.loading) {
    await page.waitForSelector('#loading', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(pg.loadingWait ?? 500);
    await page.screenshot({ path: path.join(out, `${pg.loading}.png`) });
    console.log(`${pg.loading}.png`);
  }
  if (pg.kit) await page.waitForFunction(() => window.__kitReady, null, { timeout: 60000 });
  else await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 180000 });
  if (!pg.kit) {
    if (!(await page.evaluate(() => !!window.__test))) { console.error('page failed:', await page.evaluate(() => document.getElementById('loading')?.textContent)); await cleanup(new Error('load failed')); }
    await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); });
  }
  for (const s of pg.shots) {
    const r = await page.evaluate(async (s) => {
      const t = window.__test;
      if (t) {
        if (s.hour != null) t.set('hour', s.hour);
        if (s.at) {
          const d = Math.PI / 180;
          if (typeof s.at === 'string') await t.view(s.at);
          else { await t.goto(s.at[0], s.at[1], s.at[2]); }
          if (s.facing != null) t.player.yaw = s.facing * d - Math.PI / 2;
          if (s.pitch != null) t.player.pitch = s.pitch * d;
        }
      }
      if (s.js) return await (new Function('t', `return (async () => { ${s.js} })()`))(t);
      return null;
    }, s);
    if (r != null) console.log(s.name, JSON.stringify(r));
    await page.waitForTimeout(s.wait ?? 900);
    await page.screenshot({ path: path.join(out, `${s.name}.png`) });
    console.log(`${s.name}.png`);
  }
  await page.close();
  opened.pop();
}
await browser.close();
console.log(logs.length ? logs.slice(0, 40).join('\n') : 'no console errors/warnings');
