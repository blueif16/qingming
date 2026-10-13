#!/usr/bin/env node
// Interaction checks for the direct HUD and the settings screen (gen/ui/r2_settings.md): real key presses and clicks on
// a desktop page, real touches on a phone page. Run inside a check-Chrome slot against the check server:
//   tools/chrome_slot.sh node gen/ui/shots/r2_settings/settings_interact.mjs [url] [out_dir]
// The slot's Chrome profile persists between runs, so every localStorage value the checks change is put back at the end.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:5190/world.html';
const out = process.argv[3] || path.join(Q, 'gen/ui/shots/r2_settings/interact');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const opened = [];
const cleanup = async (err) => { if (err) console.error(err); for (const p of opened) await p.close().catch(() => {}); await browser.close().catch(() => {}); process.exit(err ? 1 : fails ? 1 : 0); };
process.on('unhandledRejection', cleanup);
process.on('uncaughtException', cleanup);
let fails = 0;
const results = [];
const check = (name, ok, extra = '') => { const l = `${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`; console.log(l); results.push(l); if (!ok) fails++; };
const logs = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const snapshot = (page) => page.evaluate(() => JSON.stringify({ ...localStorage }));
const restore = (page, snap) => page.evaluate((s) => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(s))) localStorage.setItem(k, v); }, snap);

// ---------------------------------------------------------------- desktop
{
  const page = await ctx.newPage();
  opened.push(page);
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[desktop ${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[desktop pageerror] ${e.message}`));
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
  const snap = await snapshot(page);
  const st = () => page.evaluate(() => ({ s: { view: __test.s.view, hour: __test.s.hour, localTime: __test.s.localTime, timeFlow: __test.s.timeFlow, shadows: __test.s.shadows },
    set: __test.ui.settings.state(), frozen: __test.player.frozen, lock: !!document.pointerLockElement, cls: document.documentElement.classList.contains('qm-set-open'), hud: __test.hud.open, help: __test.ui.state().help }));
  await page.evaluate(async () => { const t = window.__test; t.set('hour', 10); t.set('view', 'third'); await t.view('inner_city:spawn'); t.ui.help(false); });
  await sleep(1200);

  // the direct HUD: two tiles and the ›, clear of the time instrument
  const lay = await page.evaluate(() => {
    const r = (e) => { const b = e?.getBoundingClientRect(); return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };
    // the instrument's box: #dial and whatever it holds (the time agent's #dial is a zero-height host)
    const dl = [document.getElementById('dial'), ...document.querySelectorAll('#dial > *')].map(r).filter((b) => b && b[2] > b[0] && b[3] > b[1] && b[2] - b[0] < innerWidth);
    const dial = dl.length ? [Math.min(...dl.map((b) => b[0])), Math.min(...dl.map((b) => b[1])), Math.max(...dl.map((b) => b[2])), Math.max(...dl.map((b) => b[3]))] : null;
    return { dial, hud: r(document.querySelector('.qm-hud')), tiles: document.querySelectorAll('.qm-hud .qm-view-tile').length, more: r(document.querySelector('.qm-hud .qm-more')),
      bell: getComputedStyle(document.getElementById('soundCtl') || document.body).display };
  });
  const apart = (a, b) => !a || !b || a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1];
  check('direct HUD: two view tiles and the ›', lay.tiles === 2 && !!lay.more, JSON.stringify(lay));
  check('direct HUD clear of the time instrument', apart(lay.dial, lay.hud), `dial ${lay.dial} hud ${lay.hud}`);
  check('bell off the street', lay.bell === 'none' || !lay.bell, lay.bell);
  // tiles: one click switches
  await page.click('.qm-hud .qm-view-tile[data-view="first"]');
  check('eye tile: first person', (await st()).s.view === 'first');
  await page.click('.qm-hud .qm-view-tile[data-view="third"]');
  check('figure tile: third person', (await st()).s.view === 'third');
  // V still works, and the tiles follow it
  await page.mouse.click(800, 450); // focus the page (asks for the mouse: fine)
  await page.keyboard.press('KeyV');
  await sleep(700);
  const tv = await page.evaluate(() => ({ view: __test.s.view, first: document.querySelector('.qm-hud .qm-view-tile[data-view="first"]').getAttribute('aria-checked') }));
  check('V switches and the tiles follow', tv.view === 'first' && tv.first === 'true', JSON.stringify(tv));
  await page.keyboard.press('KeyV');
  await sleep(300);

  // O opens: the mouse is free, you stand still, the HUD steps back
  await page.keyboard.press('KeyO');
  await page.waitForFunction(() => window.__test.ui.settings.state().open, null, { timeout: 15000 }).catch(() => {});
  let s = await st();
  check('O opens the settings screen', s.set.open && s.cls, JSON.stringify(s.set.cat));
  check('mouse free and walking held while open', !s.lock && s.frozen);
  const moved = await page.evaluate(async () => { const p = __test.player, a = p.pos.clone(); p.keys.add('KeyW'); await new Promise((r) => setTimeout(r, 400)); p.keys.delete('KeyW'); return a.distanceTo(p.pos); });
  check('no walking while open', moved < 0.01, `${moved.toFixed(3)} m`);
  const sp0 = JSON.stringify((await st()).s);
  await page.keyboard.press('Space');
  await sleep(300);
  check('Space does not open the scroll HUD over it, and changes nothing', !(await st()).hud && JSON.stringify((await st()).s) === sp0);
  await page.screenshot({ path: path.join(out, 'desktop_open.png') });
  // ↓ → : the hour, one step (and it leaves your clock)
  const h0 = (await st()).s.hour;
  await page.keyboard.press('ArrowDown');
  s = await st();
  check('↓ moves to the hour row', s.set.sel === 'hour', s.set.sel);
  await page.keyboard.press('ArrowRight');
  s = await st();
  check('→ steps the hour', Math.floor(s.s.hour) === (Math.floor(h0) + 1) % 24 && !s.s.localTime, `${h0} -> ${s.s.hour}`);
  await page.keyboard.press('ArrowLeft');
  // ↓ → : the pace, 靜 -> 緩
  await page.keyboard.press('ArrowDown');
  const f0 = (await st()).s.timeFlow;
  await page.keyboard.press('ArrowRight');
  s = await st();
  check('→ steps the pace', s.set.sel === 'timeFlow' && s.s.timeFlow > f0, `${f0} -> ${s.s.timeFlow}`);
  await page.keyboard.press('ArrowLeft');
  // E: the next page; Enter on the view row switches the view
  await page.keyboard.press('KeyE');
  s = await st();
  check('E: next page (視角)', s.set.cat === 'view', s.set.cat);
  const v0 = s.s.view;
  await page.keyboard.press('Enter');
  check('Enter switches the view', (await st()).s.view !== v0);
  await page.keyboard.press('Enter');
  await page.screenshot({ path: path.join(out, 'desktop_view.png') });
  // Q twice: back past the first page to the last (wraps)
  await page.keyboard.press('KeyQ');
  await page.keyboard.press('KeyQ');
  check('Q wraps to the last page (進階)', (await st()).set.cat === 'adv');
  await page.keyboard.press('Tab');
  check('Tab goes on (時辰)', (await st()).set.cat === 'time');
  // a click on a seal, a click on a switch (shadows), and back
  await page.click('.qs-tab[data-cat="display"]');
  check('a seal opens its page', (await st()).set.cat === 'display');
  const sh0 = (await st()).s.shadows;
  await page.click('#qs-row-shadows .qs-toggle');
  check('a click on the switch flips it', (await st()).s.shadows !== sh0);
  await page.click('#qs-row-shadows .qs-toggle');
  check('and back', (await st()).s.shadows === sh0);
  // a slider dragged with the mouse (fov), then put back
  await page.click('.qs-tab[data-cat="view"]');
  const fov0 = await page.evaluate(() => __test.s.fov);
  const bx = await page.locator('#qs-row-fov .qs-slider').boundingBox();
  await page.mouse.move(bx.x + bx.width * 0.5, bx.y + bx.height / 2);
  await page.mouse.down();
  await page.mouse.move(bx.x + bx.width * 0.9, bx.y + bx.height / 2, { steps: 5 });
  await page.mouse.up();
  const fov1 = await page.evaluate(() => __test.s.fov);
  check('the brush slider drags', fov1 > fov0 + 5, `${fov0} -> ${fov1}`);
  await page.evaluate((v) => __test.set('fov', v), fov0);
  // M still mutes while open (the row repaints)
  // Esc closes: walking comes back
  await page.keyboard.press('Escape');
  await sleep(200);
  s = await st();
  check('Esc closes', !s.set.open && !s.cls && !s.frozen);
  const walked = await page.evaluate(async () => { const p = __test.player, a = p.pos.clone(); p.keys.add('KeyW'); await new Promise((r) => setTimeout(r, 600)); p.keys.delete('KeyW'); return a.distanceTo(p.pos); });
  check('walking resumes after close', walked > 0.3, `${walked.toFixed(2)} m`);
  // O, O: open and close by key (the mouse is asked back; headless may refuse)
  await page.keyboard.press('KeyO');
  await page.waitForFunction(() => window.__test.ui.settings.state().open, null, { timeout: 5000 }).catch(() => {});
  await page.keyboard.press('KeyO');
  await sleep(200);
  check('O closes it again', !(await st()).set.open);
  // the › button opens it, 返回 (Esc keycap) closes it
  await page.click('.qm-hud .qm-more');
  await page.waitForFunction(() => window.__test.ui.settings.state().open, null, { timeout: 5000 }).catch(() => {});
  check('› opens it', (await st()).set.open);
  await page.click('.qs-back');
  check('返回 closes it', !(await st()).set.open);
  // H: the help
  const hb = (await st()).help;
  await page.keyboard.press('KeyH');
  const ha = (await st()).help;
  check('H opens the help', ha === !hb, `${hb} -> ${ha}`);
  await page.screenshot({ path: path.join(out, 'desktop_help.png') });
  await page.keyboard.press('KeyH');
  check('H folds it', (await st()).help === hb);
  await restore(page, snap);
  await page.close();
  opened.pop();
}

// ---------------------------------------------------------------- phone (390 x 844, touch, dpr 3)
{
  const page = await ctx.newPage();
  opened.push(page);
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[phone ${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[phone pageerror] ${e.message}`));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(120); };
  const tapEl = async (sel) => { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('no ' + sel); await tapAt(b.x + b.width / 2, b.y + b.height / 2); };
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
  const snap = await snapshot(page);
  await page.evaluate(async () => { const t = window.__test; t.set('hour', 10); t.set('view', 'third'); await t.view('inner_city:spawn'); t.ui.help(false); });
  await sleep(1200);
  const lay = await page.evaluate(() => {
    const r = (e) => { const b = e?.getBoundingClientRect(); return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };
    const dl = [document.getElementById('dial'), ...document.querySelectorAll('#dial > *')].map(r).filter((b) => b && b[2] > b[0] && b[3] > b[1] && b[2] - b[0] < innerWidth);
    const dial = dl.length ? [Math.min(...dl.map((b) => b[0])), Math.min(...dl.map((b) => b[1])), Math.max(...dl.map((b) => b[2])), Math.max(...dl.map((b) => b[3]))] : null;
    return { dial, hud: r(document.querySelector('.qm-hud')), scroll: r(document.querySelector('.sh-open')), w: innerWidth };
  });
  const apart = (a, b) => !a || !b || a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1];
  check('phone: HUD clear of the instrument and the scroll button', apart(lay.dial, lay.hud) && apart(lay.hud, lay.scroll) && lay.hud[2] <= lay.w, JSON.stringify(lay));
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.qm-hud button')].map((b) => { const r = b.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }));
  check('phone: HUD tap targets at least 34 px', sizes.every((x) => x >= 34), JSON.stringify(sizes));
  await tapEl('.qm-hud .qm-view-tile[data-view="first"]');
  check('phone: a tap on the eye: first person', (await page.evaluate(() => __test.s.view)) === 'first');
  await tapEl('.qm-hud .qm-view-tile[data-view="third"]');
  await tapEl('.qm-hud .qm-more');
  await page.waitForFunction(() => window.__test.ui.settings.state().open, null, { timeout: 15000 }).catch(() => {});
  check('phone: › opens the settings', (await page.evaluate(() => __test.ui.settings.state().open)));
  await sleep(400);
  const fit = await page.evaluate(() => {
    const q = document.querySelector('.qs'), r = (s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    return { scrollW: q.scrollWidth, w: innerWidth, h: innerHeight, tabs: r('.qs-tabs'), list: r('.qs-list'), desc: r('.qs-desc'), close: r('.qs-close') };
  });
  check('phone: the screen fits the width', fit.scrollW <= fit.w && fit.tabs[2] <= fit.w && fit.list[2] <= fit.w && fit.desc[3] <= fit.h, JSON.stringify(fit));
  check('phone: description under the list', fit.desc[1] >= fit.list[3] - 1);
  await tapEl('#qs-row-hour .qs-label');
  check('phone: a tap on a row selects it', (await page.evaluate(() => __test.ui.settings.state().sel)) === 'hour');
  const dt = await page.evaluate(() => document.querySelector('.qs-d-title span').textContent);
  check('phone: the description follows', dt === '時辰', dt);
  const h0 = await page.evaluate(() => __test.s.hour);
  await tapEl('#qs-row-hour .qs-arrow:last-of-type');
  const h1 = await page.evaluate(() => __test.s.hour);
  check('phone: a tap on › steps the hour', Math.floor(h1) === (Math.floor(h0) + 1) % 24, `${h0} -> ${h1}`);
  await page.screenshot({ path: path.join(out, 'phone_open.png') });
  await tapEl('.qs-tab[data-cat="sound"]');
  check('phone: a tap on a seal changes the page', (await page.evaluate(() => __test.ui.settings.state().cat)) === 'sound');
  await tapEl('.qs-close');
  check('phone: 返回 closes it', !(await page.evaluate(() => __test.ui.settings.state().open)));
  await tapEl('#help .qm-help-seal');
  check('phone: the 說明 seal opens the help', await page.evaluate(() => __test.ui.state().help === true));
  await page.screenshot({ path: path.join(out, 'phone_help.png') });
  await tapEl('#help .qm-help');
  await restore(page, snap);
  await page.close();
  opened.pop();
}
fs.writeFileSync(path.join(out, 'results.txt'), results.join('\n') + '\n' + (logs.length ? logs.join('\n') : 'no console errors/warnings') + '\n');
console.log(logs.length ? logs.slice(0, 30).join('\n') : 'no console errors/warnings');
console.log(`${fails ? 'FAIL' : 'PASS'}  ${results.length - fails}/${results.length}`);
await cleanup();
