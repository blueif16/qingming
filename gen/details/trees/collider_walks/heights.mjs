#!/usr/bin/env node
// Ground heights (the section's collider, highest hit from above) on a grid, and the trunk boles over it, as a text map.
//   tools/chrome_slot.sh node gen/details/trees/collider_walks/heights.mjs <section> X0 X1 D0 D1 [step]
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const [sec, X0, X1, D0, D1, step = '0.25'] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.goto('http://127.0.0.1:5190/world.html?start=0');
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
const rows = await page.evaluate(async ([sec, b, st]) => {
  const t = window.__test, T = t.THREE;
  await t.goto((b[0] + b[1]) / 2, (b[2] + b[3]) / 2);
  for (let i = 0; i < 600 && !t.loaded.get(sec)?.trunks; i++) await new Promise((r) => setTimeout(r, 200));
  const s = t.loaded.get(sec), ray = new T.Ray(), out = [];
  for (let D = b[3]; D >= b[2] - 1e-6; D -= st) {
    let line = `${D.toFixed(2).padStart(6)} `;
    for (let X = b[0]; X <= b[1] + 1e-6; X += st) {
      ray.set(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0));
      const inTrunk = s.trunks && s.trunks.raycast(ray, T.DoubleSide).length > 0;
      const h = s.bvh.raycastFirst(ray, T.DoubleSide);
      line += inTrunk ? '  ## ' : h ? (h.point.y >= 0 ? ' ' : '') + h.point.y.toFixed(1).padStart(4) : '   . ';
    }
    out.push(line);
  }
  return out;
}, [sec, [+X0, +X1, +D0, +D1], +step]);
console.log(`X ${X0} .. ${X1} (step ${step}); rows D high -> low; ## = inside a bole`);
console.log(rows.join('\n'));
await page.close();
await browser.close();
