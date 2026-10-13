#!/usr/bin/env node
// A first-person still at a spot (X, D, facing deg, pitch deg) on world.html, for judging the trunks against the walks.
//   tools/chrome_slot.sh node gen/details/trees/collider_walks/shot.mjs <out.jpg> X D facing [pitch] [query]
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const [out, X, D, face, pitch = '0', q = ''] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto(`http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&hour=10${q}`);
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
await page.evaluate(async ([X, D, face, pitch]) => {
  const t = window.__test, p = t.player, d = Math.PI / 180;
  await t.goto(X, D);
  p.pos.set(X, p.pos.y, -D); p.vel.set(0, 0, 0);
  for (let i = 0; i < 30; i++) p.update(1 / 60);
  p.yaw = face * d - Math.PI / 2; p.pitch = pitch * d;
  t.s.view = 'first'; // first person, if the setting exists
  await new Promise((r) => setTimeout(r, 2500));
}, [+X, +D, +face, +pitch]);
await page.screenshot({ path: out, type: 'jpeg', quality: 85 });
await page.close();
await browser.close();
