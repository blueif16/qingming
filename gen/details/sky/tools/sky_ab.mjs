#!/usr/bin/env node
// Proof for the sky symbol: one page load, time and movers frozen, the same frames shot three times:
//   a  = as shipped; b = the post pass's mist skipped where depth is 1 (the sky; patched into the live shader);
//   a2 = back as shipped (the noise floor). diff.json gives, per frame, the share of pixels that changed a -> b and
//   a -> a2, and where (sky rows vs the rest); <frame>_diff.png marks the changed pixels in red over a.
//   tools/chrome_slot.sh node gen/details/sky/tools/sky_ab.mjs <url> <out_dir> <frames.json> [--viewport 1600x900x1]
// frames.json: [[name, view, hour, mode ('first'|'third'), yaw offset deg, pitch rad], ...]
// With --after the page already carries the fix: then b patches the old line back in (b = as before) instead.
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
const [url, outDir, framesFile] = pos;
const frames = JSON.parse(fs.readFileSync(framesFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const [VW, VH, VDPR] = opt('--viewport', '1600x900x1').split('x').map(Number);

const OLD = 'float mist = mistOn > 0.5 ? mistAt(vUv, dc) : 0.0;';
const NEW = 'float mist = mistOn > 0.5 && texture2D(tDepth, vUv).x < 1.0 ? mistAt(vUv, dc) : 0.0;';

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const raw = async (f) => (await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true }));
const report = { url, viewport: [VW, VH, VDPR], frames: {} };
try {
  if (VDPR !== 1 || VW < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: VDPR, mobile: VW < 800 });
  else await page.setViewportSize({ width: VW, height: VH });
  if (VW < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 300000 });
  const has = await page.evaluate(([o, n]) => { const fs = window.__test.post.material.fragmentShader; return { old: fs.includes(o), fixed: fs.includes(n) }; }, [OLD, NEW]);
  console.log('shader as loaded:', JSON.stringify(has), 'tier', await page.evaluate(() => window.__test.tiers?.name ?? window.__test.tiers?.cfg?.name ?? ''));
  const swap = (from, to) => page.evaluate(([f, t]) => {
    const m = window.__test.post.material;
    if (!m.fragmentShader.includes(f)) return 'missing';
    m.fragmentShader = m.fragmentShader.replace(f, t); m.needsUpdate = true; return 'ok';
  }, [from, to]);
  const [toB, toA] = has.fixed ? [[NEW, OLD], [OLD, NEW]] : [[OLD, NEW], [NEW, OLD]];
  // the DOM overlays stay hidden here: the pixel diff is about the 3D picture
  await page.evaluate(() => { const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st); });
  for (const [name, view, hour, mode, dy, pitch] of frames) {
    await page.evaluate(() => window.__thaw?.());
    await page.evaluate(([v, m, h]) => { const T = window.__test; T.set('timeFlow', 0); T.set('view', m); T.set('hour', h); return T.view(v); }, [view, mode, hour]);
    await page.waitForTimeout(2500);
    await page.evaluate(([dy, p]) => {
      const T = window.__test;
      T.player.yaw += (dy * Math.PI) / 180; T.player.pitch = p;
    }, [dy, pitch]);
    await page.waitForTimeout(1000); // the walker applies the new yaw and pitch to the camera, then everything is held
    await page.evaluate(() => {
      const T = window.__test, now = performance.now(), pn = performance.now, pu = T.people.update, bu = T.boats.update, plu = T.player.update;
      performance.now = () => now; // sky strokes and water lines read the clock
      T.people.update = function () { this.crowd?.update(this.camera); };
      T.boats.update = function (dt, cam) { return bu.call(this, 0, cam); };
      T.player.update = () => {};
      const am = T.avatar?.mixer, amu = am?.update;
      if (am) am.update = () => am;
      window.__thaw = () => { performance.now = pn; T.people.update = pu; T.boats.update = bu; T.player.update = plu; if (am) am.update = amu; window.__thaw = null; };
    });
    await page.waitForTimeout(1200);
    const f = (k) => path.join(outDir, `${name}_${k}.png`);
    await page.screenshot({ path: f('a') });
    console.log(name, 'patch', await swap(...toB));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: f('b') });
    console.log(name, 'unpatch', await swap(...toA));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: f('a2') });
    // the diff: changed = any channel off by more than 6; the sky = the rows above the frame's horizon is not known
    // here, so the share is given for the whole frame and the diff image shows where
    const A = await raw(f('a')), B = await raw(f('b')), A2 = await raw(f('a2'));
    const { width: W, height: H } = A.info;
    const mask = Buffer.alloc(W * H * 3);
    let nAB = 0, nAA = 0;
    for (let i = 0, p = 0; i < A.data.length; i += 3, p++) {
      const dAB = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
      const dAA = Math.max(Math.abs(A.data[i] - A2.data[i]), Math.abs(A.data[i + 1] - A2.data[i + 1]), Math.abs(A.data[i + 2] - A2.data[i + 2]));
      if (dAB > 6) nAB++;
      if (dAA > 6) nAA++;
      const g = (A.data[i] + A.data[i + 1] + A.data[i + 2]) / 9;
      mask[i] = dAB > 6 ? 255 : g; mask[i + 1] = dAB > 6 ? 0 : g; mask[i + 2] = dAB > 6 ? 0 : g;
    }
    await sharp(mask, { raw: { width: W, height: H, channels: 3 } }).png().toFile(f('diff'));
    report.frames[name] = { view, hour, mode, dy, pitch, changedPct_a_b: +((100 * nAB) / (W * H)).toFixed(3), changedPct_a_a2: +((100 * nAA) / (W * H)).toFixed(3) };
    console.log(name, JSON.stringify(report.frames[name]));
  }
} finally {
  report.logs = logs;
  fs.writeFileSync(path.join(outDir, 'diff.json'), JSON.stringify(report, null, 1));
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
