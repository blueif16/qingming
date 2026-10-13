#!/usr/bin/env node
// S3 QA: turn waypoint routes into walk_page legs. For each route { label, start: [X, D], via: [[X, D], ...],
// push?: [[heading, seconds], ...], expect, why }, stand on the start as walk_page does, then per waypoint turn to
// its bearing from where the walker is and hold W until it is within 0.2 m or stops getting closer; record
// [heading, frames / 60]. `push` legs are appended as they are (into a wall). Writes the routes with `legs` (no `via`)
// to <out.json> and prints each route's trace and end. Same physics as walk_page (player.update at 60 Hz).
// A route that ends in NaN or dies (the dev page reloads when the area agent re-exports) is rerun on a fresh page.
// Usage: CDP_PORT=9243 node calib_walk.mjs <url> <routes.json> <out.json>
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const [url, inF, outF] = process.argv.slice(2);
const routes = JSON.parse(fs.readFileSync(inF, 'utf8'));
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9243'));
const page = await browser.contexts()[0].newPage();
const out = [];
// QA_GUARD=1: work round the run_m 0 boat (boats.js divides by its travel 0 -> NaN hull, colliders and walker), QA only
const fresh = async () => {
  await page.goto(url, { timeout: 180000, waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
  if (process.env.QA_GUARD === '1') await page.evaluate(() => { for (const b of window.__test.boats?.list || []) if (!(b.travel > 0)) b.travel = 1e-3; });
};
const runOne = (w) => page.evaluate(async (w) => {
  const t = window.__test, p = t.player, T = t.THREE, d = Math.PI / 180;
  const [X, D] = w.start;
  if (t.goto) await t.goto(X, D);
  const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), T.DoubleSide);
  p.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D); p.vel.set(0, 0, 0); p.onGround = true;
  for (let i = 0; i < 30; i++) p.update(1 / 60);
  const legs = [], trace = [], notes = [];
  for (const [wx, wd] of w.via || []) {
    const cx = p.pos.x, cd = -p.pos.z;
    const face = Math.round(((Math.atan2(wd - cd, wx - cx) / d) + 360) % 360 * 10) / 10;
    p.yaw = face * d - Math.PI / 2; p.keys.add('KeyW');
    let n = 0, best = 1e9, since = 0;
    while (n < 60 * 40) {
      p.update(1 / 60); n++;
      if (n % 60 === 0) trace.push([+p.pos.x.toFixed(1), +(-p.pos.z).toFixed(1), +p.pos.y.toFixed(2)]);
      const dist = Math.hypot(p.pos.x - wx, -p.pos.z - wd);
      if (dist < 0.2) break;
      if (dist < best - 0.01) { best = dist; since = 0; } else if (++since > 45) { notes.push(`stalled ${best.toFixed(2)} m short of [${wx}, ${wd}] at [${p.pos.x.toFixed(2)}, ${(-p.pos.z).toFixed(2)}, ${p.pos.y.toFixed(2)}]`); break; }
    }
    p.keys.delete('KeyW');
    legs.push([face, Math.round(n / 60 * 1000) / 1000]);
  }
  for (const [face, secs] of w.push || []) {
    p.yaw = face * d - Math.PI / 2; p.keys.add('KeyW');
    for (let i = 0; i < secs * 60; i++) { p.update(1 / 60); if (i % 60 === 59) trace.push([+p.pos.x.toFixed(1), +(-p.pos.z).toFixed(1), +p.pos.y.toFixed(2)]); }
    p.keys.delete('KeyW'); legs.push([face, secs]);
  }
  return { legs, trace, notes, end: { X: p.pos.x, D: -p.pos.z, H: p.pos.y } };
}, w);
try {
  await fresh();
  for (const w of routes) {
    let r = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        r = await runOne(w);
        if (Number.isFinite(r.end.X) && Number.isFinite(r.end.D)) break;
        console.log(`  (NaN on "${w.label}": fresh page, retry)`); r = null;
      } catch (e) { console.log(`  (${e.message.split('\n')[0]} on "${w.label}": fresh page, retry)`); r = null; }
      await fresh();
    }
    if (!r) { console.log(`DEAD  ${w.label}`); continue; }
    const ok = Object.entries(w.expect || {}).every(([k, [lo, hi]]) => r.end[k] >= lo && r.end[k] <= hi);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${w.label}  end X ${r.end.X.toFixed(2)} D ${r.end.D.toFixed(2)} H ${r.end.H.toFixed(2)}${r.notes.length ? '  NOTES ' + r.notes.join('; ') : ''}`);
    console.log(`      legs ${JSON.stringify(r.legs)}  trace ${JSON.stringify(r.trace)}`);
    out.push({ label: w.label, start: w.start, legs: r.legs, expect: w.expect, ...(w.why ? { why: w.why } : {}) });
  }
} finally { await page.close(); await browser.close(); }
fs.writeFileSync(outF, JSON.stringify(out, null, 1) + '\n');
console.log('->', outF);
