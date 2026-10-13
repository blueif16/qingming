// Interaction checks for the scroll HUD on world.html (Windows Chrome on 9223, or CDP_PORT from tools/chrome_slot.sh):
// real key presses (Space, Esc, H), hover tooltip, wheel zoom, the snap-back button, walking after close; then a
// phone-sized touch page.
// The lil-gui tuning panel shows in the HUD only with ?tune=1 (ink UI round 2: the player's settings are the settings
// screen, O): with tune=1 in the url the panel checks run as before; without it, the HUD must show no panel and H
// must not bring it up (H is the help there).
// Usage: node hud_interact.mjs <url> <out_dir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const tune = /[?&]tune=1\b/.test(url);
// never leave a page running in the bench Chrome (it renders uncapped and slows every later run)
const opened = [];
browser.contexts()[0].on('page', (p) => opened.push(p));
const cleanup = async (err) => { if (err) console.error(err); for (const p of opened) await p.close().catch(() => {}); await browser.close().catch(() => {}); process.exit(err ? 1 : 0); };
process.on('unhandledRejection', cleanup);
process.on('uncaughtException', cleanup);
const ctx = browser.contexts()[0];
const results = [];
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const logs = [];
const ready = async (page) => { await page.waitForFunction(() => window.__test, null, { timeout: 120000 }); };

// ---------------------------------------------------------------- desktop
{
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`[desktop] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[desktop pageerror] ${e.message}`));
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(url);
  await ready(page);
  await page.evaluate(async () => { const t = window.__test; t.set('hour', 10); await t.goto(-65.8, 9.6); t.player.yaw = Math.PI / 2 - Math.PI / 2; });
  check('panel hidden while walking', await page.evaluate(() => window.__test.hud.gui._hidden === true));
  await page.keyboard.press('KeyH');
  check('H with the HUD shut leaves the panel hidden', await page.evaluate(() => window.__test.hud.gui._hidden === true));
  await page.mouse.click(800, 450); // focus the page (a click on the canvas asks for pointer lock: fine)
  await page.keyboard.press('Space');
  await page.waitForFunction(() => { const s = window.__test.hud.stats(); return s.open && s.tiles > 0 && s.pending === 0; }, null, { timeout: 30000 });
  check('Space opens the HUD', await page.evaluate(() => window.__test.hud.open));
  if (tune) check('panel shows in the HUD', await page.evaluate(() => window.__test.hud.gui._hidden === false));
  else check('no tuning panel in the HUD (no ?tune=1)', await page.evaluate(() => window.__test.hud.gui._hidden === true));
  check('pointer released in the HUD', await page.evaluate(() => !document.pointerLockElement));
  const ticks = await page.evaluate(async () => { const p = window.__test.player; const a = p.pos.clone(); p.keys.add('KeyW'); await new Promise((r) => setTimeout(r, 400)); p.keys.delete('KeyW'); return a.distanceTo(p.pos); });
  check('no walking while the HUD is open', ticks < 0.01, `moved ${ticks.toFixed(3)} m`);
  await page.keyboard.press('KeyH');
  check(tune ? 'H hides the panel in the HUD' : 'H in the HUD brings no panel', await page.evaluate(() => window.__test.hud.gui._hidden === true));
  await page.keyboard.press('KeyH');
  if (tune) check('H shows it again', await page.evaluate(() => window.__test.hud.gui._hidden === false));
  // hover the storyteller's box
  const box = await page.evaluate(() => {
    const h = window.__test.hud, d = h.drawn.find((q) => q.id === 'S6.fig.storyteller_3822'), r = h.viewEl.getBoundingClientRect();
    return d && { x: r.left + (d.x0 + d.x1) / 2, y: r.top + (d.y0 + d.y1) / 2 };
  });
  if (box) {
    await page.mouse.move(box.x, box.y);
    await page.waitForTimeout(250);
    const tip = await page.evaluate(() => { const t = document.querySelector('.sh-tip'); return t.style.display !== 'none' ? t.textContent : null; });
    check('hover names the storyteller', !!tip && /^storyteller/i.test(tip), JSON.stringify(tip));
    check('tooltip carries no digits', !!tip && !/\d/.test(tip));
    await page.screenshot({ path: path.join(out, 'hover_storyteller.png') });
  } else check('storyteller boxed', false);
  // wheel zoom in at the cursor
  const z0 = await page.evaluate(() => window.__test.hud.view.z);
  await page.mouse.move(800, 400);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(60); }
  await page.waitForFunction(() => window.__test.hud.stats().pending === 0, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
  const z1 = await page.evaluate(() => window.__test.hud.view.z);
  check('wheel zooms in', z1 > z0 * 1.5, `${z0.toFixed(2)} -> ${z1.toFixed(2)}`);
  await page.screenshot({ path: path.join(out, 'zoomed_in.png') });
  // drag pans, the ring button snaps back
  const u0 = await page.evaluate(() => window.__test.hud.view.u);
  await page.mouse.move(900, 400); await page.mouse.down(); await page.mouse.move(600, 380, { steps: 8 }); await page.mouse.up();
  const u1 = await page.evaluate(() => window.__test.hud.view.u);
  check('drag pans', u1 > u0 + 50, `${u0.toFixed(0)} -> ${u1.toFixed(0)}`);
  await page.click('.sh-btn[data-a="you"]', { timeout: 5000 }).catch(async (e) => {
    console.log('click failed:', e.message.split('\n')[0]);
    console.log(await page.evaluate(() => { const b = document.querySelector('.sh-btn[data-a="you"]').getBoundingClientRect(), f = document.querySelector('.sh-frame').getBoundingClientRect(), c = document.querySelector('.sh-view').getBoundingClientRect(); const e = document.elementFromPoint(b.left + 16, b.top + 16);
      return { btn: [b.left, b.top, b.width, b.height], frame: [f.left, f.top, f.width, f.height], canvas: [c.left, c.top, c.width, c.height], hit: e.tagName, vv: [visualViewport.offsetLeft, visualViewport.offsetTop, visualViewport.scale, innerWidth, innerHeight, scrollX, scrollY] }; }));
    await page.screenshot({ path: path.join(out, 'click_fail.png') });
    const b = await page.locator('.sh-btn[data-a="you"]').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  });
  const back = await page.evaluate(() => { const h = window.__test.hud, y = h.you(); return Math.hypot(h.view.u - y.u, h.view.v - y.v); });
  check('the ring button snaps back to you', back < 1, `${back.toFixed(2)} px off`);
  // zoom out far: coarser tiles; the page's camera distance must not change
  const cam0 = await page.evaluate(() => window.__test.s.camDistance);
  await page.mouse.move(800, 400);
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(40); }
  await page.waitForFunction(() => window.__test.hud.stats().pending === 0, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'zoomed_out.png') });
  const zo = await page.evaluate(() => ({ z: window.__test.hud.view.z, cam: window.__test.s.camDistance, level: Math.floor(Math.log2(1 / window.__test.hud.view.z)) }));
  check('wheel zooms out (coarser tiles)', zo.z < 0.2, JSON.stringify(zo));
  check('wheel in the HUD leaves the camera distance', zo.cam === cam0, `${cam0} -> ${zo.cam}`);
  // Esc closes; Space reopens; Space closes and walking resumes
  await page.keyboard.press('Escape');
  check('Esc closes', await page.evaluate(() => !window.__test.hud.open && window.__test.hud.stats().live === 0));
  check('panel hidden again after close', await page.evaluate(() => window.__test.hud.gui._hidden === true));
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  check('Space reopens', await page.evaluate(() => window.__test.hud.open));
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const lock = await page.evaluate(() => !!document.pointerLockElement);
  check('Space closes', await page.evaluate(() => !window.__test.hud.open));
  results.push(`INFO  pointer lock retaken on Space close (headless may refuse): ${lock}`);
  const walked = await page.evaluate(async () => { const p = window.__test.player; const a = p.pos.clone(); p.keys.add('KeyW'); await new Promise((r) => setTimeout(r, 600)); p.keys.delete('KeyW'); return a.distanceTo(p.pos); });
  check('walking resumes after close', walked > 0.3, `moved ${walked.toFixed(2)} m in 0.6 s`);
  await page.close();
}

// ---------------------------------------------------------------- phone (390 x 844, touch, dpr 3)
{
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`[phone] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[phone pageerror] ${e.message}`));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const tapEl = async (sel) => { const b = await page.locator(sel).boundingBox(); await tapAt(b.x + b.width / 2, b.y + b.height / 2); };
  await page.goto(url);
  await ready(page);
  check('phone: touch detected', await page.evaluate(() => matchMedia('(pointer: coarse)').matches));
  await page.evaluate(async () => { const t = window.__test; t.set('hour', 10); await t.goto(6.2, 3.9); t.player.yaw = -Math.PI / 2; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'phone_world.png') });
  check('phone: scroll button shown', await page.evaluate(() => { const b = document.querySelector('.sh-open'); return !!b && getComputedStyle(b).display !== 'none'; }));
  await tapEl('.sh-open');
  await page.waitForFunction(() => { const s = window.__test.hud.stats(); return s.open && s.tiles > 0 && s.pending === 0; }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, 'phone_hud.png') });
  const lay = await page.evaluate(() => {
    const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    return { frame: r('.sh-frame'), strip: r('.sh-strip'), foot: r('.sh-foot'), tools: r('.sh-tools'), gui: r('.lil-gui'), scrollW: document.documentElement.scrollWidth, w: innerWidth };
  });
  check('phone: HUD fits the width', lay.frame[0] >= 0 && lay.frame[2] <= lay.w && lay.strip[2] <= lay.w && lay.scrollW <= lay.w, JSON.stringify(lay));
  // tap a box
  const box = await page.evaluate(() => {
    const h = window.__test.hud, r = h.viewEl.getBoundingClientRect(), cx = r.width / 2, cy = r.height / 2;
    // the nearest box to the middle whose centre is in view and picks as itself
    const c = h.drawn.filter((q) => q.id !== 'you' && !q.tip.now && q.x1 - q.x0 > 12).map((q) => ({ q, x: (q.x0 + q.x1) / 2, y: (q.y0 + q.y1) / 2 }))
      .filter(({ x, y }) => x > 10 && x < r.width - 10 && y > 10 && y < r.height - 10).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))
      .find(({ q, x, y }) => h.pick(x, y)?.id === q.id);
    return c && { x: r.left + c.x, y: r.top + c.y, id: c.q.id };
  });
  if (box) {
    await tapAt(box.x, box.y);
    await page.waitForTimeout(300);
    const tip = await page.evaluate(() => { const t = document.querySelector('.sh-tip'); return t.style.display !== 'none' ? t.textContent : null; });
    check('phone: tap names a figure', !!tip, `${box.id}: ${JSON.stringify(tip)}`);
    await page.screenshot({ path: path.join(out, 'phone_tap.png') });
  }
  await tapEl('.sh-btn[data-a="close"]');
  await page.waitForTimeout(300);
  check('phone: close button closes', await page.evaluate(() => !window.__test.hud.open && window.__test.hud.stats().live === 0));
  await page.close();
}
await browser.close();
console.log(logs.length ? logs.join('\n') : 'no console errors');
