#!/usr/bin/env node
// What the ink UI costs per frame (gen/ui/ui_progress.md "Cost"): world.html at a phone viewport (390 x 844, dpr 3,
// touch) under a 4x CPU throttle, at the tax office (V5.1's figures), A/B on one page:
//   A  the UI idle: no bubbles, no toast (plaques as they are)
//   B  the UI busy: a conversation with two bubbles open and their name tags, a landmark toast, the plaques
// Per window: fps and the page's CPU per frame (__test.measure), the UI's own script time per frame (__test.ui.cost),
// and Chrome's style + layout time per frame (CDP Performance metrics), which is where DOM overlays cost.
//   tools/chrome_slot.sh node gen/ui/shots/ui_cost.mjs [url] [--throttle 4] [--reps 3] [--secs 3] [--desktop]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const url = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:5190/world.html';
const thr = +opt('--throttle', 4), reps = +opt('--reps', 3), secs = +opt('--secs', 3), desktop = args.includes('--desktop');
const openToast = args.includes('--open'); // round 2 (r2_lore): the busy window's toast with its long text unfolded
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (desktop) await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
else {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
await page.evaluate(async () => {
  const t = window.__test;
  t.set('hour', 10);
  t.ui.help(false);
  await t.goto(-36.4, 7.3);
  t.player.yaw = (84 * Math.PI) / 180 - Math.PI / 2;
  t.player.pitch = -0.14;
});
await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });

async function windowOf(busy) {
  await page.evaluate(async ([busy, openToast]) => {
    const t = window.__test;
    t.ui.close();
    t.ui.untoast?.(); // round 2: a toast now stays 9-45 s, so the idle window clears the busy one's
    if (busy) {
      t.ui.talk('V5.1');
      await new Promise((r) => setTimeout(r, 300));
      t.ui.next(); t.ui.next(); t.ui.next(); // the second line, then the owner's: two bubbles with tags
      t.ui.toast('S5.bld.tax_office', openToast);
    }
    await new Promise((r) => setTimeout(r, 900));
    t.ui.cost(true);
  }, [busy, openToast]);
  const m0 = await metrics();
  const r = await page.evaluate((s) => window.__test.measure(s), secs);
  const m1 = await metrics();
  const st = await page.evaluate(() => ({ cost: window.__test.ui.cost(), state: window.__test.ui.state() }));
  const frames = Math.max(1, Math.round(r.fps * secs));
  return {
    busy, fps: +r.fps.toFixed(1), cpuMs: +r.cpuMs.toFixed(2), uiMs: +st.cost.msPerFrame.toFixed(3),
    styleLayoutMs: +(((m1.RecalcStyleDuration - m0.RecalcStyleDuration) + (m1.LayoutDuration - m0.LayoutDuration)) * 1000 / frames).toFixed(3),
    scriptMs: +(((m1.ScriptDuration - m0.ScriptDuration) * 1000) / frames).toFixed(2),
    open: st.state.talk?.conv?.open?.length ?? 0, toast: st.state.places?.toast ?? null, plaques: st.state.places?.plaques ?? [],
  };
}
const rows = [];
for (let i = 0; i < reps; i++) for (const busy of [false, true]) { const w = await windowOf(busy); rows.push(w); console.log(JSON.stringify(w)); }
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const avg = (busy, k) => { const xs = rows.filter((r) => r.busy === busy).map((r) => r[k]); return +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3); };
const sum = {};
for (const k of ['fps', 'cpuMs', 'uiMs', 'styleLayoutMs', 'scriptMs']) sum[k] = { idle: avg(false, k), busy: avg(true, k), delta: +(avg(true, k) - avg(false, k)).toFixed(3) };
const out = { date: new Date().toISOString(), url, viewport: desktop ? '1920x1080x1' : '390x844x3 touch', throttle: thr, secs, reps, rows, summary: sum };
const file = path.join(Q, `gen/ui/shots/cost_${desktop ? 'desktop' : 'phone'}_${thr}x${openToast ? '_open' : ''}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(JSON.stringify(sum, null, 1));
console.log('->', file);
await page.close();
await browser.close();
