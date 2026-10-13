#!/usr/bin/env node
// Film the hand-over from the loading screen to the world (gen/ui/r2_time.md, "The loading stall"): a CDP screencast
// (every frame the compositor makes, with its time) plus, from inside the page, every requestAnimationFrame time, the
// long tasks, the moment #loading loses its id (ui.loaded()), the first world frame, the banner, the help and the
// fonts. Writes <out>/<tag>_film.jpg (a contact sheet of the frames round ui.loaded(), each stamped with ms from it),
// <out>/<tag>_frames/ (the frames) and <out>/<tag>_timing.json.
//   tools/chrome_slot.sh node gen/ui/shots/load_film.mjs <url> <out_dir> <tag> [--phone] [--throttle 4] [--from -800] [--to 6000]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const req = createRequire(`${Q}/tools/package.json`);
const { chromium } = req('playwright-core');
const sharp = req('sharp');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [url, out, tag] = args;
const phone = args.includes('--phone'), thr = +opt('--throttle', 1), from = +opt('--from', -800), to = +opt('--to', 6000);
fs.mkdirSync(path.join(out, `${tag}_frames`), { recursive: true });

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const cdp = await ctx.newCDPSession(page);
if (phone) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
} else await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });

// in the page, from the first script on: frame times, long tasks, and what appears when
await page.addInitScript(() => {
  const L = (window.__film = { raf: [], long: [], marks: {}, text: [] });
  const mark = (k) => { if (!(k in L.marks)) L.marks[k] = performance.now(); };
  // where the main thread waits on the GPU process: shader compile/link status, texture and buffer uploads
  L.gl = [];
  for (const P of [globalThis.WebGL2RenderingContext?.prototype].filter(Boolean)) {
    for (const name of ['getProgramParameter', 'getShaderParameter', 'linkProgram', 'compileShader', 'texImage2D', 'texSubImage2D', 'compressedTexImage2D', 'compressedTexSubImage2D', 'texStorage2D', 'bufferData', 'generateMipmap', 'getProgramInfoLog']) {
      const f = P[name];
      if (!f) continue;
      P[name] = function (...a) { const t = performance.now(); const r = f.apply(this, a); const d = performance.now() - t; if (d > 0.5) L.gl.push([t, d, name]); return r; };
    }
  }
  const loop = (t) => { L.raf.push(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) L.long.push([e.startTime, e.duration, e.name]); }).observe({ type: 'longtask', buffered: true }); } catch { /* none */ }
  document.fonts?.addEventListener?.('loadingdone', (e) => L.text.push([performance.now(), 'fonts', e.fontfaces.map((f) => f.family).join(',')]));
  const seen = new WeakSet();
  const scan = () => {
    if (document.getElementById('loading')) mark('loadingSeen');
    else if ('loadingSeen' in L.marks) mark('loadedId');
    if (document.querySelector('.ld-out')) mark('wipeStart');
    if ('wipeStart' in L.marks && !document.querySelector('.ld-paper')) mark('paperGone');
    if (document.querySelector('.qm-banner')) mark('banner');
    if (window.__test) mark('test');
    // any big text that paints: elements whose computed font size is 40 px or more, with text, visible
    for (const el of document.querySelectorAll('body *')) {
      if (seen.has(el) || !el.childNodes.length) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (parseFloat(cs.fontSize) >= 40 && cs.visibility !== 'hidden' && cs.display !== 'none') {
        seen.add(el);
        L.text.push([performance.now(), 'big', `${el.tagName}.${el.className} ${cs.fontSize} ${el.textContent.trim().slice(0, 30)}`]);
      }
    }
  };
  new MutationObserver(scan).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['id', 'class'] });
  addEventListener('DOMContentLoaded', scan);
});

const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ ts: f.metadata.timestamp, data: f.data });
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: phone ? 390 : 960, maxHeight: phone ? 844 : 540, everyNthFrame: 1 });
const t0wall = Date.now();
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction(() => window.__film?.marks.loadedId, null, { timeout: 240000 });
const origin = await page.evaluate(() => performance.timeOrigin);
await page.waitForTimeout(Math.max(1000, to * thr / 2 + 2000));
await cdp.send('Page.stopScreencast');
const L = await page.evaluate(() => window.__film);
const at = L.marks.loadedId; // page ms of ui.loaded()
const rel = (pageMs) => Math.round(pageMs - at);
// screencast timestamps are wall seconds; page time = wall ms - timeOrigin
const shots = frames.map((f) => ({ ms: Math.round(f.ts * 1000 - origin - at), data: f.data })).filter((f) => f.ms >= from && f.ms <= to);
const raf = L.raf.filter((t) => t >= at + from && t <= at + to);
const gaps = [];
for (let i = 1; i < raf.length; i++) if (raf[i] - raf[i - 1] > 50) gaps.push([rel(raf[i - 1]), Math.round(raf[i] - raf[i - 1])]);
const long = L.long.filter(([s, d]) => s + d >= at + from && s <= at + to).map(([s, d]) => [rel(s), Math.round(d)]);
const timing = {
  url, phone, throttle: thr, loadedAtMs: Math.round(at), marks: Object.fromEntries(Object.entries(L.marks).map(([k, v]) => [k, rel(v)])),
  firstFrameAfterLoaded: raf.find((t) => t > at) != null ? rel(raf.find((t) => t > at)) : null,
  rafGapsOver50: gaps, longTasks: long, worstGap: gaps.reduce((a, g) => Math.max(a, g[1]), 0),
  // GPU waits inside each long task after ui.loaded(), summed by call
  glInLongTasks: long.filter(([s]) => s >= -50).map(([s, d]) => {
    const by = {};
    for (const [t, dd, n] of L.gl) if (t - at >= s && t - at <= s + d) by[n] = Math.round(((by[n] || 0) + dd) * 10) / 10;
    return { at: s, ms: d, gl: by };
  }),
  glBeforeLoaded: (() => { const by = {}; for (const [t, dd, n] of L.gl) if (t < at) by[n] = Math.round(((by[n] || 0) + dd) * 10) / 10; return by; })(),
  text: L.text.map(([t, k, v]) => [rel(t), k, v]), screencastFrames: shots.map((s) => s.ms), consoleLogs: logs, wallMs: Date.now() - t0wall,
};
fs.writeFileSync(path.join(out, `${tag}_timing.json`), JSON.stringify(timing, null, 1));

// the contact sheet: up to 24 frames, stamped with ms from ui.loaded()
const pick = shots.length <= 24 ? shots : Array.from({ length: 24 }, (_, i) => shots[Math.round((i * (shots.length - 1)) / 23)]);
const W = phone ? 195 : 320, H = phone ? 422 : 180, cols = phone ? 8 : 6;
const tiles = [];
for (const [i, s] of pick.entries()) {
  const buf = Buffer.from(s.data, 'base64');
  fs.writeFileSync(path.join(out, `${tag}_frames`, `${String(i).padStart(2, '0')}_${s.ms}ms.jpg`), buf);
  const label = Buffer.from(`<svg width="${W}" height="22"><rect width="${W}" height="22" fill="black" opacity="0.6"/><text x="6" y="16" font-size="15" font-family="monospace" fill="white">${s.ms} ms</text></svg>`);
  const img = await sharp(buf).resize(W, H, { fit: 'cover' }).composite([{ input: label, top: 0, left: 0 }]).toBuffer();
  tiles.push({ input: img, left: (i % cols) * W, top: Math.floor(i / cols) * H });
}
if (tiles.length) {
  await sharp({ create: { width: cols * W, height: Math.ceil(tiles.length / cols) * H, channels: 3, background: '#000' } })
    .composite(tiles).jpeg({ quality: 80 }).toFile(path.join(out, `${tag}_film.jpg`));
}
console.log(JSON.stringify({ ...timing, text: timing.text.slice(0, 20), screencastFrames: `${shots.length} frames` }, null, 1));
await page.close();
await browser.close();
