#!/usr/bin/env node
// (gen/interact copy of tools/clip_sheet.mjs with --props <list>: chars.html ?props=, the carried props shown)
// Frame sheets of character clips, rendered by web/chars.html on the real GPU (tools/win_chrome.sh start).
// One row per clip: N frames spread over the clip, seen from a 3/4 front view (and a side view with --side).
// Usage: node tools/clip_sheet.mjs <base_url> <name> [clip,clip,...] [--frames 6] [--side] [--out file.jpg]
//   e.g. node tools/clip_sheet.mjs http://127.0.0.1:5180 sightseer lean_rail,lean_rail_swift
// Writes gen/characters/<name>/clips.jpg unless --out is given.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const { chromium } = createRequire(path.join(ROOT, 'tools/package.json'))('playwright-core');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [base, name, clipArg] = args.filter((a, i) => !a.startsWith('--') && !['--frames', '--out', '--props'].includes(args[i - 1]));
const N = +opt('--frames', 6), side = args.includes('--side');
const out = opt('--out', path.join(ROOT, `gen/characters/${name}/clips.jpg`));

let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
const page = await browser.contexts()[0].newPage();
const FW = 300, FH = 420;
await page.setViewportSize({ width: FW * 2, height: FH * 2 });
const logs = [];
page.on('pageerror', (e) => logs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
await page.goto(`${base}/chars.html?only=${name}${opt("--props") ? `&props=${opt("--props")}` : ""}`);
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 60000 });
await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); document.querySelectorAll('body > div').forEach((d) => { if (!d.id) d.remove(); }); });
const clips = await page.evaluate((n) => window.__test.clips[n], name);
const want = clipArg ? clipArg.split(',') : clips.map((c) => c[0]);
const views = side ? [25, 90] : [25];
const rows = [];
for (const [clip, dur] of clips.filter((c) => want.includes(c[0]))) {
  for (const az of views) {
    const frames = [];
    for (let i = 0; i < N; i++) {
      const t = (dur * i) / N;
      await page.evaluate(([n, c, t, az]) => { window.__test.ui.paused = true; window.__test.pose(n, c, t); window.__test.focus(n, az, 4.4, 0.85); }, [name, clip, t, az]);
      await page.waitForTimeout(120);
      frames.push(await sharp(await page.screenshot()).resize(FW, FH).toBuffer());
    }
    rows.push({ label: `${clip} (${dur.toFixed(1)} s${side ? `, ${az}°` : ''})`, frames });
  }
}
await page.close(); await browser.close();
const LH = 26, W = FW * N, H = rows.length * (FH + LH);
const comp = [];
rows.forEach((row, ri) => {
  const y = ri * (FH + LH);
  comp.push({ input: Buffer.from(`<svg width="${W}" height="${LH}"><rect width="100%" height="100%" fill="#222"/><text x="8" y="18" font-size="16" font-family="monospace" fill="#fff">${name} · ${row.label}</text></svg>`), left: 0, top: y });
  row.frames.forEach((f, i) => comp.push({ input: f, left: i * FW, top: y + LH }));
});
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp({ create: { width: W, height: H, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 82 }).toFile(out);
console.log(logs.length ? logs.join('\n') : 'no page errors');
console.log(out);
