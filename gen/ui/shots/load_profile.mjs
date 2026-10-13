#!/usr/bin/env node
// Where the main thread goes in the first long task after ui.loaded() (gen/ui/r2_time.md, "The loading stall"): a CPU
// profile of world.html's load; the window starts at the first sample inside loading.js done() and runs `ms` on.
// Prints the top functions by self time and by inclusive time inside that window.
//   tools/chrome_slot.sh node gen/ui/shots/load_profile.mjs <url> [ms=700] [--phone] [--throttle 4] [--marker done]
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const url = args[0], win = +(args[1] && !args[1].startsWith('--') ? args[1] : 700) * 1000;
const phone = args.includes('--phone'), thr = +opt('--throttle', 1), marker = opt('--marker', 'done');
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (phone) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
} else await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
await cdp.send('Profiler.start');
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 240000, polling: 100 });
await page.waitForTimeout(3000 * thr);
const { profile } = await cdp.send('Profiler.stop');
const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
const fname = (n) => `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop().split('?')[0]}:${n.callFrame.lineNumber + 1}`;
const stack = (id) => { const s = []; while (id) { s.push(id); id = parent.get(id); } return s; };
let t = profile.startTime, start = null;
const self = new Map(), incl = new Map();
let total = 0;
for (let i = 0; i < profile.samples.length; i++) {
  t += profile.timeDeltas[i];
  const id = profile.samples[i], n = nodes.get(id);
  if (start == null) {
    if (stack(id).some((x) => nodes.get(x).callFrame.functionName === marker)) start = t;
    else continue;
  }
  if (t - start > win) break;
  const dt = (profile.timeDeltas[i + 1] ?? 250) / 1000;
  if (n.callFrame.functionName === '(idle)' || n.callFrame.functionName === '(program)') continue;
  total += dt;
  self.set(fname(n), (self.get(fname(n)) || 0) + dt);
  const seen = new Set();
  for (const x of stack(id)) { const f = fname(nodes.get(x)); if (seen.has(f)) continue; seen.add(f); incl.set(f, (incl.get(f) || 0) + dt); }
}
const top = (m, k) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([f, ms]) => `${ms.toFixed(1).padStart(7)} ms  ${f}`).join('\n');
console.log(`window ${win / 1000} ms from ${marker}(): start ${start == null ? 'not found' : ((start - profile.startTime) / 1000).toFixed(0) + ' ms into the profile'}, busy ${total.toFixed(0)} ms`);
if (start == null) console.log('loading.js functions sampled:', [...new Set(profile.nodes.filter((n) => /loading\.js/.test(n.callFrame.url)).map((n) => n.callFrame.functionName))]);
console.log('--- self\n' + top(self, 25));
console.log('--- inclusive\n' + top(incl, 45));
await page.close();
await browser.close();
