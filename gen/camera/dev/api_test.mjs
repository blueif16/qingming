// dev: the film API beyond film_shot: a film then end() gives the live page back (the loop runs again, the real clock),
// play() drives the camera in real time, live follow resolves a walker. Run from tools/ (playwright-core resolves there).
import { chromium } from 'playwright-core';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&sound=0&hour=10&spawn=storyteller');
await page.waitForFunction(() => window.__test?.film, null, { timeout: 240000 });
const r = await page.evaluate(async () => {
  const t = window.__test, f = t.film, out = {};
  // a walker to follow: the first non-batched person who is walking somewhere near
  const walker = t.people.all.find((p) => p.id && !p.batch && p.root.position.distanceTo(t.player.pos) < 30) || t.people.all.find((p) => p.id);
  out.walker = walker?.id;
  await f.load({ seconds: 4, camera: { kind: 'move', keys: [
    { t: 0, pos: { at: walker.id, follow: true, offset: [0, -6, 2.5] }, look: { at: walker.id, follow: true, up: 1.4 }, fov: 40 },
    { t: 4, pos: { at: walker.id, follow: true, offset: [4, -6, 2.5] }, look: { at: walker.id, follow: true, up: 1.4 }, fov: 40 } ] } });
  out.prep = await f.prepare({ ss: 1 });
  f.warm(0.5, 30);
  const a = f.step(0, 1 / 30), b = (() => { let x; for (let i = 1; i <= 60; i++) x = f.step(i / 30, 1 / 30); return x; })();
  const wp = walker.root.position;
  out.follow = { cam0: a.pos, cam2s: b.pos, look2s: b.look, walkerNow: [wp.x, -wp.z, wp.y].map((v) => +v.toFixed(2)) };
  out.virtualClock = performance.now() === performance.now(); // frozen while held
  f.end();
  out.realClock = typeof Object.getOwnPropertyDescriptor(performance, 'now') === 'undefined';
  // the live loop runs again: a measure() resolves with frames
  const m = await Promise.race([t.measure(1), new Promise((res) => setTimeout(() => res(null), 4000))]);
  out.loopBack = m ? { fps: Math.round(m.fps) } : 'NO FRAMES';
  // play(): real-time preview moves the camera
  await f.play({ seconds: 3, camera: { kind: 'orbit', around: 'storyteller', dist: 20, el_deg: 30, from_deg: 0, turn_deg: 90 } });
  const c0 = t.camera.position.clone();
  await new Promise((res) => setTimeout(res, 1500));
  out.playMoved = +t.camera.position.distanceTo(c0).toFixed(2);
  f.stop();
  return out;
});
console.log(JSON.stringify(r, null, 1));
console.log(errors.length ? errors.join('\n') : 'no page errors');
await ctx.close(); await browser.close();
