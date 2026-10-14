#!/usr/bin/env node
// The flicker check of the anchored labels (plaques, intent marks, the talk prompt, speech bubbles; the user,
// 2026-10-13: "if you are just walking, there might be flashing of these tags and dialogues"). Walk routes through the
// busy streets on the page's film clock (film.js: one whole frame every 1/30 s of page time, however slow headless
// Chrome is), look at every label in the anchored layer after every frame, and count how often the code hides one and
// shows it again within BLINK_S (a blink), or shows one for less than SHORT_S. A label sliding out past the frame's edge
// as the view swings is motion, not a blink, so only the code's own showing and hiding counts. Math.random is seeded, so
// two runs walk past the same chatter; people's timing still varies a little, so compare totals, not single labels.
//   tools/chrome_slot.sh node tools/label_flicker.mjs "http://127.0.0.1:5190/world.html?hour=11" [routes.json] [--json out.json]
// routes.json: [{ label, view | start: [X, D], facing (deg, 0 = +X, 90 = +D), legs: [[facing_deg, seconds, sweep_deg?]] }]
// (sweep: the view swings ± that many degrees round the heading every 4 s, as a mouse does while walking).
// Results: gen/ui/flicker/ (before.log, after.log). Exit 1 when any blink is counted.
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const jsonAt = args.indexOf('--json');
const jsonOut = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const [url, routesFile] = args;
const BLINK_S = 1.0, SHORT_S = 0.7;
const ROUTES = routesFile ? JSON.parse(fs.readFileSync(routesFile, 'utf8')) : [
  { label: 'inner city, gate to crossroads', view: 'from_gate', legs: [[180, 14, 25], [170, 10, 0]] },
  { label: 'outer road, seam to east end', view: 'seam', legs: [[0, 12, 30], [10, 10, 0]] },
  { label: 'rainbow bridge, south foot over the crown', view: 'south_foot', legs: [[48, 8, 20], [20, 10, 30]] },
  { label: 'canal, trackers to the wharf', view: 'trackers', legs: [[0, 12, 25], [350, 8, 0]] },
];

let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run inside tools/chrome_slot.sh.'); process.exit(1); }
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
// the same chatter every run: Math.random seeded before any page script
await page.addInitScript(() => {
  let a = 0x9e3779b9;
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
});
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 120000 });

const results = [];
for (const r of ROUTES) {
  const out = await page.evaluate(async (r) => {
    const t = window.__test, p = t.player, d = Math.PI / 180, { BLINK_S, SHORT_S } = r;
    if (r.view) await t.view(r.view);
    else { await t.goto(r.start[0], r.start[1]); p.yaw = (r.facing ?? 0) * d - Math.PI / 2; }
    await new Promise((res) => setTimeout(res, 1500)); // the labels of the start settle
    // a label's identity: its kind and its words (a plaque's name, a bubble's line, a mark's pictogram)
    const kindOf = (a) => a.querySelector('.qm-plaque') ? 'plaque' : a.classList.contains('qm-mark-a') ? 'mark'
      : a.querySelector('.qm-say') ? 'bubble' : a.querySelector('.qm-prompt, .qm-prompt-touch-wrap') ? 'prompt' : 'other';
    const keyOf = (a, k) => k + ':' + (k === 'mark' ? a.dataset.group || (a.querySelector('path')?.getAttribute('d') || '').slice(0, 24)
      : k === 'prompt' ? 'E' : (a.querySelector('.qm-plaque-slip, .qm-bubble')?.textContent || a.textContent).trim().slice(0, 24));
    const visible = (a) => {
      if (!a.isConnected || a.style.visibility === 'hidden') return false;
      if (a.classList.contains('qm-out') || a.classList.contains('qm-gone') || a.querySelector('.qm-out, .qm-gone')) return false;
      return !!a.style.transform; // placed (a label sliding out past the frame's edge as the view swings is motion, not a blink)
    };
    const layer = document.querySelector('.qm-anchors');
    const on = new Map(); // key -> t it became visible
    const offAt = new Map(); // key -> t it went
    const stats = {};
    const st = (k) => (stats[k] ??= { shows: 0, blinks: 0, short: 0, keys: {} });
    const sample = (now) => {
      const seen = new Set();
      for (const a of layer?.children || []) {
        const k = kindOf(a);
        if (k === 'other' || !visible(a)) continue;
        const key = keyOf(a, k);
        seen.add(key);
        if (!on.has(key)) {
          on.set(key, now);
          const s = st(k); s.shows++;
          const off = offAt.get(key);
          if (off != null && now - off < BLINK_S) { s.blinks++; (s.keys[key] ??= { blinks: 0, short: 0 }).blinks++; }
        }
      }
      for (const [key, since] of on) {
        if (seen.has(key)) continue;
        on.delete(key);
        offAt.set(key, now);
        if (now - since < SHORT_S) { const k = key.split(':')[0], s = st(k); s.short++; (s.keys[key] ??= { blinks: 0, short: 0 }).short++; }
      }
    };
    // the walk on the page's film clock (film.js): one whole frame every 1/FPS s of page time, however slow the
    // headless capture is, so every label decision is seen as a player at a steady frame rate would see it
    const FPS = 30, f = t.film;
    let frames = 0, tt = 0;
    const realT0 = Date.now();
    p.keys.add('KeyW');
    try {
      for (const [face, secs, sweep = 0] of r.legs) {
        for (let i = 0; i < secs * FPS; i++) {
          p.yaw = (face + sweep * Math.sin(((i / FPS) * 2 * Math.PI) / 4)) * d - Math.PI / 2;
          f.step(0, 1 / FPS, true);
          tt += 1 / FPS; frames++;
          sample(tt);
          if (i % 4 === 3) await new Promise((res) => setTimeout(res, 0)); // the stream's loads and the timers go on
        }
      }
      p.keys.delete('KeyW');
      for (let i = 0; i < 10; i++) { f.step(0, 1 / FPS, true); tt += 1 / FPS; sample(tt); }
    } finally { p.keys.delete('KeyW'); f.release(); }
    const secs = tt;
    for (const s of Object.values(stats)) s.keys = Object.fromEntries(Object.entries(s.keys).sort((a, b) => (b[1].blinks + b[1].short) - (a[1].blinks + a[1].short)).slice(0, 6));
    return { secs: +secs.toFixed(1), realSecs: Math.round((Date.now() - realT0) / 1000), frames, end: [+p.pos.x.toFixed(1), +(-p.pos.z).toFixed(1)], stats };
  }, { ...r, BLINK_S, SHORT_S });
  results.push({ label: r.label, ...out });
  const line = Object.entries(out.stats).map(([k, s]) => `${k} ${s.shows} shown, ${s.blinks} blinks, ${s.short} short`).join(' | ') || 'no labels';
  console.log(`${r.label}  (${out.secs} s at 30 fps on the film clock, ${out.realSecs} s real, end ${out.end})\n  ${line}`);
  for (const [k, s] of Object.entries(out.stats)) for (const [key, c] of Object.entries(s.keys)) console.log(`    ${key}  blinks ${c.blinks}, short ${c.short}`);
}
const tot = { shows: 0, blinks: 0, short: 0 };
for (const r of results) for (const s of Object.values(r.stats)) { tot.shows += s.shows; tot.blinks += s.blinks; tot.short += s.short; }
console.log(`label_flicker: ${tot.shows} shown, ${tot.blinks} blinks, ${tot.short} short`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ url, results, total: tot }, null, 1));
await page.close(); await browser.close();
process.exit(tot.blinks ? 1 : 0);
