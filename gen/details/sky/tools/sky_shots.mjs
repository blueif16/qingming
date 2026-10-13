#!/usr/bin/env node
// Sky hunt: shots looking up at the sky from named views, at chosen hours, in several directions, with the page's DOM
// overlays kept (what the viewer sees), plus one contact sheet per run.
//   tools/chrome_slot.sh node gen/details/sky/tools/sky_shots.mjs <url> <out_dir> [--views a,b] [--hours 6,11,17,20,23]
//     [--viewport 1600x900x1] [--mode first|third] [--dirs 0:0.9,90:0.9,180:0.9,270:0.9,0:1.4] [--hide 'expr']
//     [--domhide 1] [--settle 900]
// --dirs: yaw offset in degrees from the view's facing : pitch in radians (first person: up to 1.4; third: up to 0.45).
// --hide: a JS expression run once per view after it loads (e.g. hide one object to prove it is the culprit).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const req = createRequire(path.join(ROOT, 'tools/package.json'));
const sharp = req('sharp');
const { chromium } = req('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, outDir] = pos;
fs.mkdirSync(outDir, { recursive: true });
const views = opt('--views', '').split(',').filter(Boolean);
const hours = opt('--hours', '6,11,17,20,23').split(',').map(Number);
const mode = opt('--mode', 'first');
const dirs = opt('--dirs', mode === 'first' ? '0:0.9,90:0.9,180:0.9,270:0.9,0:1.4' : '0:0.45,90:0.45,180:0.45,270:0.45')
  .split(',').map((d) => d.split(':').map(Number));
const hide = opt('--hide', null), domhide = opt('--domhide', '0') === '1';
const settle = +opt('--settle', 900);
const [VW, VH, VDPR] = opt('--viewport', '1600x900x1').split('x').map(Number);

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const shots = [];
try {
  if (VDPR !== 1 || VW < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: VDPR, mobile: VW < 800 });
  else await page.setViewportSize({ width: VW, height: VH });
  if (VW < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 240000 });
  const info = await page.evaluate(() => ({ views: window.__test.views, tier: window.__test.tiers?.stats?.()?.tier ?? window.__test.tiers?.name }));
  console.log('tier', JSON.stringify(info.tier), 'views', info.views.length);
  const list = views.length ? views : [null];
  await page.evaluate((m) => { window.__test.set('timeFlow', 0); window.__test.set('view', m); }, mode);
  if (domhide) await page.evaluate(() => { const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st); });
  for (const v of list) {
    if (v) await page.evaluate((v) => window.__test.view(v), v);
    await page.waitForTimeout(1500);
    if (hide) console.log('hide ->', JSON.stringify(await page.evaluate(hide)));
    const base = await page.evaluate(() => window.__test.player.yaw);
    for (const h of hours) {
      await page.evaluate((h) => window.__test.set('hour', h), h);
      for (const [dy, p] of dirs) {
        await page.evaluate(([y, p]) => { const pl = window.__test.player; pl.yaw = y; pl.pitch = p; }, [base + (dy * Math.PI) / 180, p]);
        await page.waitForTimeout(settle);
        const name = `${v || 'spawn'}_h${h}_y${dy}_p${p}`;
        const f = path.join(outDir, `${name}.png`);
        await page.screenshot({ path: f });
        shots.push([name, f]);
      }
    }
  }
} finally {
  fs.writeFileSync(path.join(outDir, 'logs.txt'), logs.join('\n'));
  console.log(logs.slice(0, 12).join('\n'));
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
// contact sheets, one per view: dirs across, hours down, each shot at a quarter size with its name
const tw = Math.round((VW * VDPR) / (VW < 800 ? 3 : 4)), th = Math.round((tw * VH) / VW);
const cols = dirs.length;
const byView = new Map();
for (const s of shots) { const v = s[0].split('_h')[0]; if (!byView.has(v)) byView.set(v, []); byView.get(v).push(s); }
for (const [v, list] of byView) {
  const rows = Math.ceil(list.length / cols);
  const tiles = await Promise.all(list.map(async ([n, f]) => {
    const label = Buffer.from(`<svg width="${tw}" height="18"><rect width="${tw}" height="18" fill="#000" opacity="0.55"/><text x="4" y="13" font-size="12" fill="#fff" font-family="monospace">${n}</text></svg>`);
    return sharp(await sharp(f).resize(tw, th).png().toBuffer()).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer();
  }));
  const f = path.join(outDir, `sheet_${v}.jpg`);
  await sharp({ create: { width: tw * cols, height: th * rows, channels: 3, background: '#fff' } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tw, top: Math.floor(i / cols) * th }))).jpeg({ quality: 82 }).toFile(f);
  console.log('->', f);
}
