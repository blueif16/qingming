#!/usr/bin/env node
// What the walker touches at a point: the closest point on each collider the page hands the player (the section's
// own BVH, its trunk boles, the edge walls, movers), within a radius, at knee and chest height.
//   tools/chrome_slot.sh node gen/details/trees/collider_walks/near.mjs X D [radius]
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const [X, D, R = '0.8'] = process.argv.slice(2).map(Number);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.goto('http://127.0.0.1:5190/world.html?start=0');
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
const r = await page.evaluate(async ([X, D, R]) => {
  const t = window.__test, T = t.THREE;
  await t.goto(X, D);
  await new Promise((r) => setTimeout(r, 4000));
  const ray = new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), out = [];
  for (const [name, s] of t.loaded) {
    const g = s.bvh?.raycastFirst(ray, T.DoubleSide);
    const y = g ? g.point.y : 0;
    for (const [what, bvh] of [['section', s.bvh], ['trunks', s.trunks], ...(s.movers || []).map((m, i) => [`mover${i}`, m.bvh])]) {
      if (!bvh?.closestPointToPoint) continue;
      for (const h of [0.5, 1.2]) {
        const tgt = {}, p = new T.Vector3(X, y + h, -D);
        const hit = bvh.closestPointToPoint(p, tgt, 0, R);
        if (hit) out.push({ section: name, what, h, d: +tgt.distance.toFixed(2), at: [+tgt.point.x.toFixed(2), +(-tgt.point.z).toFixed(2), +tgt.point.y.toFixed(2)], face: tgt.faceIndex });
      }
    }
  }
  const people = (t.people?.list || t.people?.all || []).length;
  return { out, ground: null, people };
}, [X, D, R]);
console.log(JSON.stringify(r, null, 0).replace(/\},\{/g, '},\n{'));
await page.close();
await browser.close();
