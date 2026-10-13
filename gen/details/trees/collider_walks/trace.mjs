#!/usr/bin/env node
// One walk, traced every 6 frames (0.1 s), as walk_page.mjs runs it: where it slows and what pushes it.
//   tools/chrome_slot.sh node gen/details/trees/collider_walks/trace.mjs '<walk json>'
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const w = JSON.parse(process.argv[2]);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.goto('http://127.0.0.1:5190/world.html?start=0');
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
const tr = await page.evaluate(async (w) => {
  const t = window.__test, p = t.player, T = t.THREE, d = Math.PI / 180;
  const [X, D] = w.start;
  await t.goto(X, D);
  const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), T.DoubleSide);
  p.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D); p.vel.set(0, 0, 0); p.onGround = true;
  for (let i = 0; i < 30; i++) p.update(1 / 60);
  const out = [];
  let pushed = 0;
  const po = p.pushOut;
  p.pushOut = (pos, r) => { const m = po?.(pos, r); if (m) pushed++; return m; };
  for (const [face, secs] of w.legs) {
    p.yaw = face * d - Math.PI / 2; p.keys.add('KeyW');
    for (let i = 0; i < secs * 60; i++) { p.update(1 / 60); if (i % 6 === 5) out.push(`${face}  ${p.pos.x.toFixed(2)} ${(-p.pos.z).toFixed(2)} ${p.pos.y.toFixed(2)}  push ${pushed}`); }
  }
  p.keys.delete('KeyW'); p.pushOut = po;
  return out;
}, w);
console.log(tr.join('\n'));
await page.close();
await browser.close();
