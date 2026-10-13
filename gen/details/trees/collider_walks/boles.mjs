#!/usr/bin/env node
// The trunk colliders of one section as the page builds them (trees3d.js trunkColliders): each tree's bole centre,
// radius and the height range, against the ground under it, near a box. For re-routing walks around the boles.
//   tools/chrome_slot.sh node gen/details/trees/collider_walks/boles.mjs <section> X0 X1 D0 D1
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const [sec, X0, X1, D0, D1] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.goto('http://127.0.0.1:5190/world.html?start=0');
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
const r = await page.evaluate(async ([sec, box]) => {
  const t = window.__test, T = t.THREE;
  await t.goto((box[0] + box[1]) / 2, (box[2] + box[3]) / 2);
  for (let i = 0; i < 600 && !t.loaded.get(sec)?.trunks; i++) await new Promise((r) => setTimeout(r, 200)); // its trees come after
  const s = t.loaded.get(sec);
  const g = s?.trunks?.geometry;
  if (!g) return { err: 'no trunks', has: [...t.loaded.keys()] };
  const p = g.attributes.position.array, out = [];
  // 20 vertices a tree: 10 rings of two (an open tube); the centre from two opposite rings
  for (let i = 0; i < p.length / 3; i += 20) {
    const o = i + 10, cx = (p[i * 3] + p[o * 3]) / 2, cz = (p[i * 3 + 2] + p[o * 3 + 2]) / 2, lo = p[i * 3 + 1], hi = p[(i + 1) * 3 + 1];
    const r = Math.hypot(p[i * 3] - cx, p[i * 3 + 2] - cz), X = cx, D = -cz;
    if (X < box[0] - 3 || X > box[1] + 3 || D < box[2] - 3 || D > box[3] + 3) continue;
    out.push({ X: +X.toFixed(2), D: +D.toFixed(2), r: +r.toFixed(2), y0: +lo.toFixed(2), y1: +hi.toFixed(2) });
  }
  return out;
}, [sec, [+X0, +X1, +D0, +D1]]);
console.log(JSON.stringify(r, null, 0).replace(/\},\{/g, '},\n{'));
await page.close();
await browser.close();
