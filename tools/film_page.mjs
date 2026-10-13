#!/usr/bin/env node
// A strip of frames over time from one spot of a scene page, on the real GPU (tools/win_chrome.sh start): for
// judging motion (how walkers get round you, how people move), which single screenshots can't show.
// The spot is [X, D, H, facing_deg, pitch_deg] in the section frame, as in shots_page.mjs; the player stands there
// (third person by default, so you see yourself and whoever comes at you). Optional settings go through __test.set
// before filming (e.g. '{"camDistance": 6}' for a higher, wider view).
// Writes <out.jpg>: frames left to right, top to bottom, each stamped with its time.
// Usage: node tools/film_page.mjs <url> <out.jpg> X,D,H,facing,pitch [--frames 12] [--every 0.4] [--warm 1] [--set '{...}'] [--hour 10|local]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [url, out, spotArg] = args;
if (!url || !out || !spotArg) { console.error('usage: film_page.mjs <url> <out.jpg> X,D,H,facing,pitch [--frames N] [--every s] [--warm s] [--set json]'); process.exit(1); }
const [X, D, H, F, Pt] = spotArg.split(',').map(Number);
const N = +opt('--frames', 12), every = +opt('--every', 0.4), warm = +opt('--warm', 1), set = JSON.parse(opt('--set', '{}'));
let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1280, height: 720 });
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 60000 }).catch(() => {}); // a module that fails to compile never says Failed
if (!(await page.evaluate(() => !!window.__test))) {
  console.error(await page.evaluate(() => document.getElementById('loading')?.textContent), '\n' + logs.join('\n'));
  await page.close(); await browser.close(); process.exit(1);
}
await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); });
const place = ([X, D, H, f, p, set]) => {
  const t = window.__test, d = Math.PI / 180;
  for (const [k, v] of Object.entries(set)) t.set(k, v);
  t.player.pos.set(X, H + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
  return t.goto?.(X, D, H); // a streaming page: wait for the sections round the spot
};
// pages follow the viewer's clock: film at 10:00 unless --set gives an hour or --hour local keeps the clock
if (opt('--hour', '10') !== 'local' && !('hour' in set)) await page.evaluate((h) => window.__test.set('hour', h), +opt('--hour', '10'));
await page.evaluate(place, [X, D, H, F, Pt, set]);
await page.waitForTimeout(warm * 1000);
const frames = [];
for (let i = 0; i < N; i++) {
  const t0 = Date.now();
  frames.push(await page.screenshot());
  await page.waitForTimeout(Math.max(0, every * 1000 - (Date.now() - t0)));
}
await page.close(); await browser.close();
const W = 640, Hh = 360, cols = 4;
const tiles = await Promise.all(frames.map(async (b, i) => sharp(await sharp(b).resize(W, Hh).toBuffer())
  .composite([{ input: Buffer.from(`<svg width="90" height="26"><rect width="100%" height="100%" fill="#000" opacity="0.6"/><text x="8" y="19" font-size="16" font-family="monospace" fill="#fff">${(i * every).toFixed(1)} s</text></svg>`), left: 0, top: Hh - 26 }]).toBuffer()));
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp({ create: { width: W * cols, height: Hh * Math.ceil(N / cols), channels: 3, background: '#fff' } })
  .composite(tiles.map((b, i) => ({ input: b, left: (i % cols) * W, top: Math.floor(i / cols) * Hh }))).jpeg({ quality: 82 }).toFile(out);
console.log(logs.length ? logs.join('\n') : 'no page errors');
console.log(`-> ${out}`);
