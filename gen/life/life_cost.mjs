#!/usr/bin/env node
// What the life layer (chatter, barks, near talk; gen/life/progress.md) costs per frame on the phone proxy:
// world.html?tier=low&adapt=0 at a phone viewport (390 x 844, dpr 3, touch) under a 4x CPU throttle, at the views the
// perf round found worst for people (storyteller: S7+S6+S5; crown: S4b+S3+S2). Per window: fps, the page's CPU per
// frame (__test.measure), the UI's own script time per frame (__test.ui.cost: places + talk + chatter), Chrome's style
// + layout and script time per frame (CDP Performance metrics), and how many bubbles were open.
//   tools/chrome_slot.sh node gen/life/life_cost.mjs <tag> [--url U] [--views storyteller,crown] [--reps 3] [--secs 4]
//     [--throttle 4]
// Before the life layer the windows are all "base". With it, the windows alternate chatter off / on
// (__test.ui.chatter(false|true)) on the same page, so the machine's drift cancels out of the delta.
// Writes gen/life/perf/<tag>.json.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const tag = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'run';
const url = opt('--url', 'http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&talk=1');
const views = opt('--views', 'storyteller,crown').split(',');
const thr = +opt('--throttle', 4), reps = +opt('--reps', 3), secs = +opt('--secs', 4);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`.slice(0, 300)); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
const hasChatter = await page.evaluate(() => typeof window.__test.ui.chatter === 'function');
await page.evaluate(() => { const t = window.__test; t.set('hour', 10); t.ui.help(false); });
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

async function windowOf(view, on) {
  await page.evaluate(async (on) => {
    const t = window.__test;
    if (on != null) t.ui.chatter(on);
    await new Promise((r) => setTimeout(r, 600));
    t.ui.cost(true);
    t.ui.chatterStats?.(true);
  }, on);
  const m0 = await metrics();
  const r = await page.evaluate((s) => window.__test.measure(s), secs);
  const m1 = await metrics();
  const st = await page.evaluate(() => ({ cost: window.__test.ui.cost(), chat: window.__test.ui.chatterStats?.() ?? null }));
  const frames = Math.max(1, Math.round(r.fps * secs));
  return {
    view, chatter: on, fps: +r.fps.toFixed(1), cpuMs: +r.cpuMs.toFixed(2), uiMs: +st.cost.msPerFrame.toFixed(3),
    styleLayoutMs: +(((m1.RecalcStyleDuration - m0.RecalcStyleDuration) + (m1.LayoutDuration - m0.LayoutDuration)) * 1000 / frames).toFixed(3),
    scriptMs: +(((m1.ScriptDuration - m0.ScriptDuration) * 1000) / frames).toFixed(2),
    chat: st.chat,
  };
}

const rows = [];
for (const view of views) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.evaluate((v) => window.__test.view(v), view);
  await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(4000);
  if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  await page.waitForTimeout(1500);
  for (let i = 0; i < reps; i++) {
    for (const on of hasChatter ? [false, true] : [null, null]) {
      const w = await windowOf(view, on);
      rows.push(w);
      console.log(JSON.stringify(w));
    }
  }
  if (hasChatter) await page.evaluate(() => window.__test.ui.chatter(true));
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const avg = (xs) => +(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(3);
const spread = (xs) => +(Math.max(...xs) - Math.min(...xs)).toFixed(3);
const summary = {};
for (const view of views) {
  const v = rows.filter((r) => r.view === view);
  summary[view] = {};
  for (const k of ['fps', 'cpuMs', 'uiMs', 'styleLayoutMs', 'scriptMs']) {
    if (hasChatter) {
      const off = v.filter((r) => r.chatter === false).map((r) => r[k]), on = v.filter((r) => r.chatter === true).map((r) => r[k]);
      summary[view][k] = { off: avg(off), on: avg(on), delta: +(avg(on) - avg(off)).toFixed(3), spreadOff: spread(off), spreadOn: spread(on) };
    } else {
      const all = v.map((r) => r[k]);
      summary[view][k] = { base: avg(all), spread: spread(all) };
    }
  }
}
const out = { tag, date: new Date().toISOString(), url, viewport: '390x844x3 touch', throttle: thr, secs, reps, hasChatter, rows, summary, logs: logs.slice(0, 40) };
const file = path.join(Q, `gen/life/perf/${tag}.json`);
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.log('->', file);
await page.close();
await browser.close();
