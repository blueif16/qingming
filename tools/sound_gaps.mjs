#!/usr/bin/env node
// Silence while sound files load (skill `sounds`): the world page on a throttled network (CDP: like a home connection),
// sound unlocked at the first click, then a tour of every section's spawn and a walk. Every 250 ms it samples the bed
// gain the rules want vs. the gain actually playing; a gap is wanted > 0.15 with playing < 0.05.
//   tools/chrome_slot.sh node tools/sound_gaps.mjs [url] [--mbps 4] [--latency 60]  -> sections/world/sound_gaps.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const url = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:5190/world.html';
const mbps = +opt('--mbps', 4), latency = +opt('--latency', 60);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || (await browser.newContext());
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency, downloadThroughput: (mbps * 1e6) / 8, uploadThroughput: 1e6 / 8 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (/sound/i.test(m.text()) && m.type() !== 'log') errors.push(m.text()); });
const t0 = Date.now();
const fetched = []; // every sound file: when it was asked for and how long it took (the page's own clock)
page.on('requestfinished', (r) => { if (r.url().includes('/assets/sounds/')) { const tm = r.timing(); fetched.push({ file: r.url().split('/').pop(), at: +((Date.now() - t0) / 1000).toFixed(2), ms: Math.round(tm.responseEnd) }); } });
await page.goto(`${url}${url.includes('?') ? '&' : '?'}hour=10`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test?.sound, null, { timeout: 600000 });
const shown = (Date.now() - t0) / 1000;
await page.mouse.click(8, 300);
const samples = [];
const sample = async (label) => {
  const s = await page.evaluate(() => window.__test.sound.stats());
  const playing = s.bedPlaying ?? s.beds.reduce((a, b) => a + b.gain, 0);
  samples.push({ t: (Date.now() - t0) / 1000, label, want: +(s.bedWant ?? 1).toFixed(2), playing: +playing.toFixed(2), points: +(s.pointLevel || 0).toFixed(3), crowd: +(s.crowd || 0).toFixed(2), loading: s.loading || [], section: s.section, state: s.state });
};
const watch = async (label, ms) => { const end = Date.now() + ms; while (Date.now() < end) { await sample(label); await page.waitForTimeout(250); } };
await watch('first click', 8000);
const views = await page.evaluate(() => (window.__test.views || []).filter((v) => v.endsWith(':spawn')));
for (const v of views) {
  page.evaluate((v) => window.__test.view(v), v).catch(() => {}); // don't wait: the gap is what we measure while it streams in
  await watch(v, 7000);
  await page.keyboard.down('KeyW'); await watch(`${v} walk`, 4000); await page.keyboard.up('KeyW');
}
const gaps = [];
let cur = null;
for (const s of samples) {
  const gap = s.want > 0.15 && s.playing < 0.05;
  if (gap && !cur) cur = { from: s.t, label: s.label, loading: s.loading };
  if (!gap && cur) { gaps.push({ ...cur, seconds: +(s.t - cur.from).toFixed(2) }); cur = null; }
}
if (cur) gaps.push({ ...cur, seconds: +(samples.at(-1).t - cur.from).toFixed(2), open: true });
const loads = (await page.evaluate(() => window.__test.sound.stats().loads)) || fetched.map((f) => [f.file, f.ms]);
const out = { url, mbps, latency, shownAfter: shown, fetched, gaps, silentSeconds: +gaps.reduce((a, g) => a + g.seconds, 0).toFixed(2), loads, errors, samples };
fs.writeFileSync(path.join(ROOT, 'sections/world/sound_gaps.json'), JSON.stringify(out, null, 1));
const quiet = samples.filter((x) => x.playing < 0.1);
console.log(`samples ${samples.length}; bed level min ${Math.min(...samples.map((x) => x.playing)).toFixed(2)}, median ${samples.map((x) => x.playing).sort((a, b) => a - b)[samples.length >> 1].toFixed(2)}; below 0.1: ${quiet.length} (${quiet.slice(0, 6).map((x) => x.label).join(', ')})`);
console.log(`world shown after ${shown.toFixed(1)} s at ${mbps} Mb/s; silent ${out.silentSeconds} s in ${gaps.length} gaps`);
for (const g of gaps) console.log(`  ${g.label.padEnd(24)} ${g.seconds.toFixed(2)} s  (loading: ${g.loading.join(', ')})`);
console.log('slowest loads:', loads.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, ms]) => `${n} ${ms} ms`).join(', '));
if (errors.length) console.log('errors:', errors.slice(0, 5));
await page.close();
await browser.close().catch(() => {});
