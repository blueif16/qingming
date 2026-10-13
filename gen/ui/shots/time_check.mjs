#!/usr/bin/env node
// Checks the time instrument in the world (gen/ui/r2_time.md "Checks"): drag with the mouse across dusk and back
// (the hour follows, the frames keep coming, no drum burst), a fling, the double-click back to your own clock, T and
// the arrow keys (the walker stays put), the pace word, time running at 疾 across dusk (the drum fires once), and a
// touch drag at phone size. Prints one JSON report; exits 1 on a failed check.
//   tools/chrome_slot.sh node gen/ui/shots/time_check.mjs [url] [--shots <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:5190/world.html';
const shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const report = { checks: [], logs: [] };
const ok = (name, pass, data) => { report.checks.push({ name, pass: !!pass, ...(data !== undefined ? { data } : {}) }); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(phone) {
  const page = await ctx.newPage();
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.logs.push(`[${phone ? 'phone' : 'desktop'} ${m.type()}] ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => report.logs.push(`[pageerror] ${e.message}`));
  const cdp = await ctx.newCDPSession(page);
  if (phone) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  } else await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
  await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); window.__test.ui.help(false); });
  return { page, cdp };
}
const rect = (page) => page.evaluate(() => { const r = document.querySelector('.tm-scroll').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const state = (page) => page.evaluate(() => {
  const t = window.__test, q = document.querySelector('.qm-time');
  return { ...t.time.get(), events: t.sound.stats()?.events?.length ?? null, eventList: t.sound.stats()?.events ?? null, local: t.s.localTime, flowValue: t.s.timeFlow,
    focus: q.classList.contains('is-focus'), backShown: getComputedStyle(document.querySelector('.tm-back')).display !== 'none', pace: document.querySelector('.tm-pace').textContent,
    name: document.querySelector('.tm-name').textContent, sub: document.querySelector('.tm-sub').textContent, pos: t.player.pos.toArray().map((v) => +v.toFixed(3)), yaw: +t.player.yaw.toFixed(4) };
});
// frame intervals in the page from now on
const recFrames = (page) => page.evaluate(() => { const L = (window.__frames = []); let last = performance.now(); const f = (t) => { L.push(t - last); last = t; if (window.__frames === L) requestAnimationFrame(f); }; requestAnimationFrame(f); });
const stopFrames = (page) => page.evaluate(() => { const L = window.__frames || []; window.__frames = null; const s = [...L].sort((a, b) => a - b); return { n: L.length, median: +(s[s.length >> 1] || 0).toFixed(1), worst: +(s[s.length - 1] || 0).toFixed(1) }; });

// ------------------------------------------------------------------ desktop
{
  const { page } = await open(false);
  await page.mouse.click(960, 700); // a gesture so the sound can start
  await page.evaluate(() => document.exitPointerLock?.()); // give the mouse back (a synthetic Esc doesn't)
  await sleep(300);
  await page.evaluate(() => window.__test.sound.unlock());
  await sleep(800);
  await page.evaluate(() => window.__test.time.setHour(17.6));
  await sleep(700);
  const r = await rect(page), cx = r.x + r.w / 2, cy = r.y + r.h * 0.35, pph = r.w / 6;
  const s0 = await state(page);
  // drag: two hours later (across the dusk drum at 18.3 and the first watch at 19), back, and forth again
  await recFrames(page);
  await page.mouse.move(cx - pph, cy);
  await page.mouse.down();
  for (const to of [cx + pph, cx - pph, cx + pph]) {
    const from = (await page.evaluate(() => window.__lastX)) ?? cx - pph;
    for (let i = 1; i <= 30; i++) { const x = from + ((to - from) * i) / 30; await page.mouse.move(x, cy); await page.evaluate((x) => { window.__lastX = x; }, x); await sleep(16); }
  }
  const mid = await state(page);
  await sleep(150);
  await page.mouse.up();
  await sleep(900);
  const fr = await stopFrames(page);
  const s1 = await state(page);
  ok('drag sets the hour (17.6 + 2 h)', Math.abs(s1.hour - 19.6) < 0.08, { before: s0.hour, during: mid.hour, after: s1.hour, scrubbingDuring: mid.scrubbing });
  ok('no hour sounds while scrubbing across dusk and the first watch, three times', s1.events === s0.events, { before: s0.eventList, after: s1.eventList });
  ok('frames keep coming while dragging', fr.worst < 120, fr);
  ok('left your clock: 歸今 shows, the hour holds (靜)', !s1.local && s1.backShown && s1.pace === '靜', { pace: s1.pace, name: s1.name, sub: s1.sub });
  if (shots) await page.screenshot({ path: path.join(shots, 'check_desktop_dragged.png'), clip: { x: 0, y: 0, width: 620, height: 340 } });
  // a fling runs on after the mouse lets go
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) { await page.mouse.move(cx + i * 12, cy); await sleep(12); }
  await page.mouse.up(); // at once: a release after a pause (> 90 ms) doesn't fling, as paper wouldn't
  const atRelease = (await state(page)).hour;
  await sleep(1200);
  const s2 = await state(page);
  ok('a fling runs on and settles', Math.abs(s2.hour - atRelease) > 0.05 && !s2.scrubbing, { atRelease, settled: s2.hour });
  // double-click: back to your own clock
  await page.mouse.click(cx, cy);
  await sleep(120);
  await page.mouse.click(cx, cy);
  await sleep(400);
  const s3 = await state(page);
  ok('double-click returns to your own clock (今)', s3.local && s3.pace === '今' && !s3.backShown, { hour: s3.hour, pace: s3.pace });
  // T and the arrows: the hour moves a 刻, the walker doesn't
  await page.evaluate(() => window.__test.time.setHour(10));
  await sleep(300);
  const k0 = await state(page);
  await page.keyboard.press('KeyT');
  await page.keyboard.down('ArrowRight'); await sleep(120); await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowRight'); await sleep(120); await page.keyboard.up('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await sleep(300);
  const k1 = await state(page);
  ok('T takes the keys; → twice is two 刻 later; ↑ quickens the pace; the walker stays', k1.focus && Math.abs(k1.hour - 10.5) < 0.02 && k1.pace === '緩' && JSON.stringify(k1.pos) === JSON.stringify(k0.pos), { focus: k1.focus, hour: k1.hour, pace: k1.pace, pos0: k0.pos, pos1: k1.pos });
  if (shots) await page.screenshot({ path: path.join(shots, 'check_desktop_focus.png'), clip: { x: 0, y: 0, width: 620, height: 340 } });
  await page.keyboard.press('Home');
  await page.keyboard.press('Escape');
  await sleep(200);
  const k2 = await state(page);
  ok('Home returns to your own clock; Esc gives the keys back', k2.local && !k2.focus, { local: k2.local, focus: k2.focus });
  // the pace word cycles 緩 → 常 → 疾 → 靜
  const paces = [];
  for (let i = 0; i < 4; i++) { await page.click('.tm-pace'); await sleep(80); paces.push((await state(page)).pace); }
  ok('the pace word cycles from 今: 緩 常 疾 靜', paces.join('') === '緩常疾靜', paces);
  // time at 疾 across dusk: the drum fires, once
  await page.evaluate(() => { window.__test.time.setHour(18.15); window.__test.time.setFlow('疾'); });
  const e0 = (await state(page)).events;
  await sleep(1800); // 18.15 + 15 min/s x 1.8 s = 18.6
  await page.evaluate(() => window.__test.time.setFlow('靜'));
  const e1 = await state(page);
  ok('at 疾 the dusk drum fires once as time passes it', e1.events - e0 === 1, { hour: e1.hour, events: e1.eventList?.slice(-3) });
  await page.close();
}

// ------------------------------------------------------------------ phone (touch)
{
  const { page, cdp } = await open(true);
  await page.evaluate(() => window.__test.time.setHour(12));
  await sleep(600);
  const r = await rect(page), cx = r.x + r.w / 2, cy = r.y + r.h * 0.4, pph = r.w / 6;
  const p0 = await state(page);
  const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: cy, id: 1 }] });
  await recFrames(page);
  await touch('touchStart', cx);
  for (let i = 1; i <= 30; i++) { await touch('touchMove', cx + (pph * 1.5 * i) / 30); await sleep(16); }
  await sleep(120);
  await touch('touchEnd', cx + pph * 1.5);
  await sleep(900);
  const fr = await stopFrames(page);
  const p1 = await state(page);
  ok('touch drag sets the hour (12 + 1.5 h) and does not turn the camera', Math.abs(p1.hour - 13.5) < 0.1 && p1.yaw === p0.yaw, { hour: p1.hour, yaw0: p0.yaw, yaw1: p1.yaw, frames: fr });
  if (shots) await page.screenshot({ path: path.join(shots, 'check_phone_dragged.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
  // double tap: back to your own clock
  for (let i = 0; i < 2; i++) { await touch('touchStart', cx); await sleep(40); await touch('touchEnd', cx); await sleep(110); }
  await sleep(300);
  const p2 = await state(page);
  ok('double tap returns to your own clock', p2.local, { local: p2.local, pace: p2.pace });
  await page.close();
}

await browser.close();
const failed = report.checks.filter((c) => !c.pass);
report.result = failed.length ? `FAIL (${failed.length}/${report.checks.length})` : `PASS (${report.checks.length}/${report.checks.length})`;
console.log(JSON.stringify(report, null, 1));
process.exit(failed.length ? 1 : 0);
