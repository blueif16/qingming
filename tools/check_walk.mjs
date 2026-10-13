// Deterministic walker test: simulate holding W for N seconds at 60 Hz in a given direction.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(process.argv[2]);
await page.waitForFunction(() => window.__test, null, { timeout: 120000 });
const run = (start, yaw, seconds) => page.evaluate(([start, yaw, seconds]) => {
  const p = window.__test.player;
  p.pos.set(...start); p.vel.set(0, 0, 0); p.yaw = yaw; p.onGround = false;
  p.keys.add('KeyW');
  const trace = [];
  for (let i = 0; i < seconds * 60; i++) { p.update(1 / 60); if (i % 30 === 29) trace.push(p.pos.toArray().map((v) => +v.toFixed(2))); }
  p.keys.delete('KeyW');
  return trace;
}, [start, yaw, seconds]);
console.log('to right shops  :', JSON.stringify(await run([0, 0.2, -6], -Math.PI / 2, 4)));
console.log('right, z=-3    :', JSON.stringify(await run([0, 0.2, -3], -Math.PI / 2, 4)));
console.log('to left shops   :', JSON.stringify(await run([0, 0.2, -6], Math.PI / 2, 4)));
console.log('down the street :', JSON.stringify((await run([0, 0.2, 1], 0, 8)).filter((_, i) => i % 2 === 1)));
console.log('into willow     :', JSON.stringify(await run([-3.75, 0.3, -6.5], 0, 3)));
console.log('along left walk :', JSON.stringify(await run([-3.9, 0.3, 0], Math.PI, 3)));
console.log(errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
