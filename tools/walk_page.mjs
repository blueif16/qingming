#!/usr/bin/env node
// Walk tests on a scene page: for each route, stand the walker on whatever is under the start point, hold W
// along one or more headings at 60 Hz, and check where it ends. Runs in the bench Chrome (tools/win_chrome.sh).
// walks.json: [{ "label", "start": [X, D], "legs": [[facing_deg, seconds], ...], "expect": { "X"|"D"|"H": [min, max] } }]
// in the section frame (facing 0 = +X, 90 = +D). Prints the trace per second and PASS/FAIL per route; exit 1 on a fail.
// On a streaming page (world.html: __test.goto) each walk waits for the sections round its start to load.
// Usage: node tools/walk_page.mjs <url> <walks.json>
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const [url, walksFile] = process.argv.slice(2);
const walks = JSON.parse(fs.readFileSync(walksFile, 'utf8'));
let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
const page = await browser.contexts()[0].newPage();
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 60000 });
let failed = 0;
for (const w of walks) {
  const r = await page.evaluate(async (w) => {
    const t = window.__test, p = t.player, T = t.THREE, d = Math.PI / 180;
    const [X, D] = w.start;
    if (t.goto) await t.goto(X, D); // a streaming page (world.html): the sections round the start loaded first
    const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), T.DoubleSide);
    p.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D); p.vel.set(0, 0, 0); p.onGround = true;
    for (let i = 0; i < 30; i++) p.update(1 / 60);
    const trace = [];
    for (const [face, secs] of w.legs) {
      p.yaw = face * d - Math.PI / 2; p.keys.add('KeyW');
      for (let i = 0; i < secs * 60; i++) { p.update(1 / 60); if (i % 60 === 59) trace.push([+p.pos.x.toFixed(1), +(-p.pos.z).toFixed(1), +p.pos.y.toFixed(2)]); }
      p.keys.delete('KeyW');
    }
    return { end: { X: p.pos.x, D: -p.pos.z, H: p.pos.y }, trace };
  }, w);
  const ok = Object.entries(w.expect || {}).every(([k, [lo, hi]]) => r.end[k] >= lo && r.end[k] <= hi);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${w.label}  end X ${r.end.X.toFixed(1)} D ${r.end.D.toFixed(1)} H ${r.end.H.toFixed(2)}`);
  console.log(`      per second (X, D, H): ${JSON.stringify(r.trace)}`);
}
await page.close(); await browser.close();
process.exit(failed ? 1 : 0);
