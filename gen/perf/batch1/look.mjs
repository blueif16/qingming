#!/usr/bin/env node
// The batch's look check: screenshots of fixed views with time frozen (people, boats, water, sky held still), so pairs
// from one page load compare pixel for pixel. Each view: the base shot, then each variant (a JS expression run in the
// page, e.g. a tier switch), then the base again (the noise floor between two shots of the same thing).
//   tools/chrome_slot.sh node gen/perf/batch1/look.mjs <url> <out_dir> [--views a,b] [--viewport 1920x1080x1]
//     [--setup 'expr'] [--variant 'low=__test.tiers.apply("low")' ...] [--reset 'expr'] [--settle 1500]
// --setup runs before each view's base shot, --reset before its base_again shot (after the variants).
// Writes <out_dir>/<view>_<variant>.png, diff.json (mean difference and share of pixels changed by more than 30 a
// channel, against the view's first shot) and sheet_<view>.jpg (every shot of the view, stacked).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const all = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, outDir] = pos;
fs.mkdirSync(outDir, { recursive: true });
const views = opt('--views', 'storyteller,crown,under_arch,grain_wharf,moorings_bank,farmsteads').split(',');
const variants = all('--variant').map((v) => { const i = v.indexOf('='); return [v.slice(0, i), v.slice(i + 1)]; });
const settle = +opt('--settle', 1500);
const setup = opt('--setup', null), reset = opt('--reset', null);
const [VW, VH, VDPR] = opt('--viewport', '1920x1080x1').split('x').map(Number);

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const load = async (f) => (await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })).data;
const diff = (A, B) => { let s = 0, n = 0; for (let i = 0; i < A.length; i += 3) { const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); s += d; if (d > 90) n++; } return { mean: +(s / A.length).toFixed(3), changedPct: +((100 * n) / (A.length / 3)).toFixed(3) }; };
const out = { url, date: new Date().toISOString(), viewport: [VW, VH, VDPR], views: {} };
try {
  if (VDPR !== 1 || VW < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: VDPR, mobile: VW < 800 });
  else await page.setViewportSize({ width: VW, height: VH });
  if (VW < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 240000 });
  for (const v of views) {
    // live again (time, people, boats), go, let the window and its bakes come in, then hold everything still
    await page.evaluate(() => window.__thaw?.());
    await page.evaluate((v) => window.__test.view(v), v);
    await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const T = window.__test, now = performance.now(), pn = performance.now, pu = T.people.update, bu = T.boats.update;
      performance.now = () => now; // water lines and sky strokes read the clock
      T.people.update = function () { this.crowd?.update(this.camera); };
      T.boats.update = function (dt, cam) { return bu.call(this, 0, cam); };
      const plu = T.player.update; // the walker steps the boats too (player.platforms)
      T.player.update = () => {};
      const am = T.avatar?.mixer, amu = am?.update;
      if (am) am.update = () => am; // your own character's idle
      window.__thaw = () => { performance.now = pn; T.people.update = pu; T.boats.update = bu; if (am) am.update = amu; T.player.update = plu; window.__thaw = null; };
      // the page's DOM overlays (place names, help, the time scroll) are not the 3D picture
      if (!document.getElementById('look-hide')) { const st = document.createElement('style'); st.id = 'look-hide'; st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st); }
    });
    if (setup) await page.evaluate(setup);
    await page.waitForTimeout(settle);
    const shots = [['base', null], ...variants, ['base_again', reset]];
    const files = [];
    for (const [name, expr] of shots) {
      if (expr) { await page.evaluate(expr); await page.waitForTimeout(settle); }
      const f = path.join(outDir, `${v}_${name}.png`);
      await page.screenshot({ path: f });
      files.push([name, f]);
    }
    const A = await load(files[0][1]);
    out.views[v] = {};
    for (const [name, f] of files.slice(1)) { out.views[v][name] = diff(A, await load(f)); }
    console.log(v, JSON.stringify(out.views[v]));
    // a sheet: every shot of the view stacked, at half size
    const w = Math.round(VW * VDPR / 2), h = Math.round(VH * VDPR / 2);
    const imgs = await Promise.all(files.map(([, f]) => sharp(f).resize(w, h).png().toBuffer()));
    await sharp({ create: { width: w, height: h * imgs.length, channels: 3, background: '#fff' } })
      .composite(imgs.map((input, i) => ({ input, top: i * h, left: 0 }))).jpeg({ quality: 84 }).toFile(path.join(outDir, `sheet_${v}.jpg`));
    // and the middle of the frame at 1:1, side by side in pairs of rows (ink and edges show at full size)
    const cw = Math.round(VW * VDPR * 0.4), ch = Math.round(VH * VDPR * 0.4), cx = Math.round((VW * VDPR - cw) / 2), cy = Math.round((VH * VDPR - ch) / 2);
    const crops = await Promise.all(files.map(([, f]) => sharp(f).extract({ left: cx, top: cy, width: cw, height: ch }).png().toBuffer()));
    const cols = 2, rows = Math.ceil(crops.length / cols);
    await sharp({ create: { width: cw * cols, height: ch * rows, channels: 3, background: '#fff' } })
      .composite(crops.map((input, i) => ({ input, top: Math.floor(i / cols) * ch, left: (i % cols) * cw }))).jpeg({ quality: 88 }).toFile(path.join(outDir, `crop_${v}.jpg`));
  }
} finally {
  out.logs = logs;
  fs.writeFileSync(path.join(outDir, 'diff.json'), JSON.stringify(out, null, 1));
  console.log(logs.slice(0, 12).join('\n'));
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
