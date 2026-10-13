// A/B of the ink sky in the whole page: alternating loads of world.html with and without ?sky=ink, at a phone viewport
// (390x844 at DPR 3, touch: the page caps DPR at 1.5 and uses a 1024 shadow map) and a 4x CPU throttle, measured with
// the page's own measure() (fps, CPU ms of the tick, GPU ms from the timer query). Emulation as gen/perf/probe.mjs.
// tools/chrome_slot.sh node gen/ui/look/tools_skyab.mjs <out.json> [--views crown,storyteller,threshing_floor] [--reps 2]
//   [--hour 13] [--throttle 4] [--viewport 390x844x3] [--secs 3]
import fs from 'node:fs';
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const outFile = args[0];
const views = opt('--views', 'crown,storyteller,threshing_floor').split(','), reps = +opt('--reps', 2), hour = +opt('--hour', 13);
const thr = +opt('--throttle', 4), secs = +opt('--secs', 3);
const [VW, VH, VDPR] = opt('--viewport', '390x844x3').split('x').map(Number);
const BASE = 'http://127.0.0.1:5190/world.html';
const b = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const res = { date: new Date().toISOString(), viewport: [VW, VH, VDPR], throttle: thr, hour, secs, runs: [] };
for (let r = 0; r < reps; r++) {
  for (const variant of r % 2 ? ['ink', 'default'] : ['default', 'ink']) {
    const p = await b.contexts()[0].newPage();
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: VDPR, mobile: VW < 800 });
    if (VW < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await p.goto(BASE + (variant === 'ink' ? '?sky=ink' : ''));
    await p.waitForFunction(() => window.__test, null, { timeout: 180000 });
    await p.evaluate((h) => window.__test.set('hour', h), hour);
    for (const v of views) {
      await p.evaluate((v) => window.__test.view(v), v);
      await p.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
      await p.waitForTimeout(4000);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
      const m = [];
      for (let k = 0; k < 3; k++) m.push(await p.evaluate((s) => window.__test.measure(s), secs));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const unthrottled = await p.evaluate((s) => window.__test.measure(s), 2);
      const med = (key) => m.map((x) => x[key]).filter((x) => x != null).sort((a, b) => a - b)[1] ?? null;
      const row = { rep: r, variant, view: v, fps: med('fps'), cpuMs: med('cpuMs'), gpuMs: med('gpuMs'), calls: m[0].calls, gpuMs_1x: unthrottled.gpuMs, cpuMs_1x: unthrottled.cpuMs, fps_1x: unthrottled.fps };
      res.runs.push(row);
      console.log(JSON.stringify(row));
    }
    await p.close();
  }
}
// summary: per view, the median over reps of ink minus default
const sum = {};
for (const v of views) {
  const pick = (variant, k) => res.runs.filter((x) => x.view === v && x.variant === variant).map((x) => x[k]);
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  sum[v] = Object.fromEntries(['fps', 'cpuMs', 'gpuMs', 'gpuMs_1x', 'cpuMs_1x'].map((k) => [k, { default: +avg(pick('default', k)).toFixed(3), ink: +avg(pick('ink', k)).toFixed(3) }]));
}
res.summary = sum;
fs.writeFileSync(outFile, JSON.stringify(res, null, 1));
console.log(JSON.stringify(sum, null, 1));
await b.close();
