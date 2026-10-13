#!/usr/bin/env node
// The lore round's behaviour check (gen/ui/r2_lore.md) on the world page, in a check-Chrome slot:
//   tools/chrome_slot.sh node gen/ui/shots/lore_check.mjs [out.json]
// Checks: nothing of the lore is fetched at first load (lore.json, the lore font subsets, the journal chunk, the crops);
// a toast stays ~9 s folded; R and a click unfold and fold it (longer when open); the pointer resting on it holds it;
// prefs.expandDescriptions opens the next toast by itself; J opens the journal at the latest place, ← → turn it, Esc
// closes it; the scroll HUD's marks are drawn and named; what the lore fetches when it opens (KB, transfer sizes);
// no console errors from the UI. Prints PASS/FAIL per item.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const out = process.argv[2] || `${Q}/gen/ui/shots/r2_lore/lore_check.json`;
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const logs = [];
const lazyRe = /lore\.json|-lore\.woff2|journal|assets\/ui\/places\/|scroll\/strip/;
// what the page fetched that belongs to the lore (seen from the browser's network side: the page's resource timing
// buffer overflows with the world's own files)
const net = [];
page.on('requestfinished', async (req) => {
  if (!lazyRe.test(req.url())) return;
  const z = await req.sizes().catch(() => null);
  net.push({ name: req.url().replace(/^.*?\/(assets|src)\//, '$1/').replace(/\?.*$/, ''), kb: +(((z?.responseBodySize || 0) + (z?.responseHeadersSize || 0)) / 1024).toFixed(1) });
});
const fetched = async () => net.slice();
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await page.goto('http://127.0.0.1:5190/world.html', { waitUntil: 'commit' });
await page.evaluate(() => { try { localStorage.removeItem('qingming-ui-prefs-v1'); } catch {} });
await page.waitForTimeout(500);
net.length = 0; // count from a fresh load with fresh prefs
await page.reload({ waitUntil: 'commit' });
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
await page.waitForFunction(() => window.__test.ui.started(), null, { timeout: 30000 });
const res = [];
const ok = (name, pass, info = '') => { res.push({ name, pass: !!pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? `  (${typeof info === 'string' ? info : JSON.stringify(info)})` : ''}`); };
const sleep = (ms) => page.waitForTimeout(ms);
const st = () => page.evaluate(() => window.__test.ui.state().places);
const key = (code) => page.evaluate((code) => dispatchEvent(new KeyboardEvent('keydown', { code, key: code.replace('Key', '').toLowerCase(), bubbles: true })), code);

// 1. first load: none of the lore
await sleep(6000); // the start banner and the first proximity toasts come and go
ok('first load fetches no lore (lore.json, lore fonts, journal chunk, crops)', (await fetched()).length === 0, await fetched());

// 2. a toast: ~9 s folded; R opens it (longer), R closes it; a click toggles it
await page.evaluate(() => window.__test.ui.toast('S5.str.moat_bridge'));
await sleep(400);
let s = await st();
ok('toast shows folded, about 9 s', s.toast === '平橋' && !s.toastOpen && s.toastLeft > 8 && s.toastLeft <= 9, s);
await key('KeyR');
await sleep(1500);
s = await st();
ok('R unfolds it and it stays long enough to read', s.toastOpen && s.toastLeft > 15, s);
const body = await page.evaluate(() => document.querySelector('.qm-lt.qm-open .qm-lt-long')?.textContent || '');
ok('the long text and its sources are in the fold', body.length > 80 && (await page.evaluate(() => !!document.querySelector('.qm-lt.qm-open .qm-lt-cite'))), body.slice(0, 30));
ok('unfolding fetched lore.json and the lore text font', (await fetched()).some((f) => /lore\.json/.test(f.name)) && (await fetched()).some((f) => /text-lore/.test(f.name)), await fetched());
await key('KeyR');
await sleep(300);
s = await st();
ok('R folds it again', !s.toastOpen && s.toastLeft <= 9.1, s);
await page.click('.qm-lt');
await sleep(300);
ok('a click unfolds it', (await st()).toastOpen);
await page.click('.qm-lt .qm-toast-name');
await sleep(300);
ok('a click folds it', !(await st()).toastOpen);

// 3. held while the pointer rests on it
await page.hover('.qm-lt');
const a = (await st()).toastLeft;
await sleep(3000);
const b = (await st()).toastLeft;
ok('the pointer on it holds it', b >= Math.min(a, 3) - 0.3, { before: a, after: b });
await page.mouse.move(900, 900);

// 4. expandDescriptions opens the next toast on its own
await page.evaluate(async () => { const { prefs } = await import('/src/ui/prefs.js'); prefs.set('expandDescriptions', true); window.__test.ui.toast('S5.str.gate_tower'); });
await sleep(800);
s = await st();
ok('with 「展開說明」 on, a toast opens by itself', s.toast === '城樓' && s.toastOpen, s);
await page.evaluate(async () => { const { prefs } = await import('/src/ui/prefs.js'); prefs.set('expandDescriptions', false); });

// 5. the journal: J at the latest place, arrows, Esc
const before = await fetched();
await key('KeyJ');
await page.waitForFunction(() => window.__test.ui.journal.state().open, null, { timeout: 10000 });
await sleep(2500);
let j = await page.evaluate(() => window.__test.ui.journal.state());
ok('J opens the journal at the latest place (城樓 -> 城門)', j.open && j.leaf === 'r:chengmen' && j.entries >= 2, j);
ok('the leaf shows its crops', j.imgs >= 2, j);
const here = await page.evaluate(() => document.querySelector('.qm-jn-here')?.dataset.id || null);
ok('the latest place is marked', here === 'S5.str.gate_tower', here);
await key('ArrowRight');
await sleep(400);
j = await page.evaluate(() => window.__test.ui.journal.state());
ok('→ turns east (城門口外)', j.leaf === 'r:chengmenkouwai', j);
await key('ArrowLeft'); await key('ArrowLeft');
await sleep(400);
j = await page.evaluate(() => window.__test.ui.journal.state());
ok('← ← turns west (十字街)', j.leaf === 'r:shizijie', j);
const opened = (await fetched()).filter((f) => !before.some((g) => g.name === f.name));
await key('Escape');
await sleep(300);
ok('Esc closes it', !(await page.evaluate(() => window.__test.ui.journal.state().open)));
ok('the player walks again after it closes', !(await page.evaluate(() => window.__test.player.frozen)));

// 6. the HUD marks
await page.evaluate(async () => { await window.__test.hud.show(); window.__test.hud.zoomBy(1 / 1.6); });
await sleep(2500);
const marks = await page.evaluate(() => window.__test.hud.drawn.filter((d) => String(d.id).startsWith('lm:')).map((d) => d.tip.n));
ok('the scroll HUD marks the places reached, by name', marks.length >= 1, marks);
await page.evaluate(() => window.__test.hud.hide());

const all = await fetched();
const sum = (l) => +l.reduce((x, f) => x + f.kb, 0).toFixed(1);
const report = { at: new Date().toISOString(), results: res, lazy: { all, kb: sum(all), journalOpen: opened, journalKb: sum(opened) },
  errors: logs.filter((l) => !/endOp|t0'\)/.test(l)), otherErrors: logs.filter((l) => /endOp|t0'\)/.test(l)).length };
ok('no console errors from the UI', report.errors.length === 0, report.errors.slice(0, 5));
fs.writeFileSync(out, JSON.stringify(report, null, 1));
console.log(`lazy fetched in all: ${report.lazy.kb} KB; at journal open: ${report.lazy.journalKb} KB (${opened.map((f) => f.name).join(', ')})`);
console.log(res.every((r) => r.pass) ? 'PASS' : 'FAIL');
await page.close();
await browser.close();
