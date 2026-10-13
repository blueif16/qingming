#!/usr/bin/env node
// The crowd's colour pass alone (perf batch 2, crowd agent): between frames, the crowd group (as the last frame left
// its instances) is drawn N times into the page's colour target with nothing else, timed on the GPU (timer query) and
// on the CPU (wall time to gl.finish), for A and B of a runtime switch, A B B A rounds, medians. The frame's own
// numbers (inpage_ab.mjs) carry the whole machine's noise; this isolates what the far bodies change.
//   tools/chrome_slot.sh node gen/perf/batch2/crowd/crowd_pass.mjs "<url>" <out.json> --a "<js>" --b "<js>"
//     [--views crown,grain_wharf,storyteller] [--viewport 390x844x3] [--throttle 1] [--rounds 10] [--n 20] [--wait 12]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, out] = pos;
const A = opt('--a'), B = opt('--b');
const views = opt('--views', 'crown,grain_wharf,storyteller').split(',');
const rounds = +opt('--rounds', 10), N = +opt('--n', 20), throttle = +opt('--throttle', 1), waitS = +opt('--wait', 12);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, D] = opt('--viewport', '390x844x3').split('x').map(Number);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: D, mobile: W < 800 });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(`[error] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 240000 });
await page.evaluate(() => window.__test.set('hour', 10));
const med = (xs) => { const s = [...xs].sort((p, q) => p - q); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
// draw the crowd group alone N times; resolves { gpuMs, cpuMs } per draw of the pass, and its draws and triangles
const pass = (n) => page.evaluate(async (n) => {
  const T = window.__test, r = T.renderer, gl = r.getContext(), cr = T.people.crowd;
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const sc = new T.THREE.Scene(), parent = cr.group.parent;
  sc.add(cr.group);
  const rt = T.post.rtColor, prevRT = r.getRenderTarget(), ac = r.autoClear;
  r.setRenderTarget(rt); r.autoClear = false;
  r.info.reset(); const ia = r.info.autoReset; r.info.autoReset = false;
  gl.finish();
  const q = ext ? gl.createQuery() : null;
  const t0 = performance.now();
  if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
  for (let i = 0; i < n; i++) r.render(sc, T.camera);
  if (q) gl.endQuery(ext.TIME_ELAPSED_EXT);
  gl.finish();
  const cpu = performance.now() - t0;
  const calls = r.info.render.calls / n, tris = r.info.render.triangles / n;
  r.info.autoReset = ia; r.autoClear = ac; r.setRenderTarget(prevRT);
  parent.add(cr.group);
  let gpu = null;
  if (q) {
    for (let k = 0; k < 100 && !gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE); k++) await new Promise((res) => setTimeout(res, 10));
    if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && !gl.getParameter(ext.GPU_DISJOINT_EXT)) gpu = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6 / n;
    gl.deleteQuery(q);
  }
  return { gpuMs: gpu, cpuMs: cpu / n, calls, tris };
}, n);
const res = { url, A, B, rounds, n: N, throttle, views: {} };
for (const v of views) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(waitS * 1000);
  await page.evaluate(() => { window.__test.set('timeFlow', 0); }); // the light holds still
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const rows = { A: [], B: [] };
  for (let r = 0; r < rounds; r++) {
    for (const [side, expr] of r % 2 ? [['B', B], ['A', A]] : [['A', A], ['B', B]]) {
      await page.evaluate(expr);
      await page.waitForTimeout(400);
      rows[side].push(await pass(N));
    }
  }
  const sum = (side) => ({ gpuMs: rows[side][0].gpuMs == null ? null : +med(rows[side].map((x) => x.gpuMs)).toFixed(3), cpuMs: +med(rows[side].map((x) => x.cpuMs)).toFixed(3),
    calls: med(rows[side].map((x) => x.calls)), tris: med(rows[side].map((x) => x.tris)) });
  res.views[v] = { A: sum('A'), B: sum('B'), raw: rows };
  const a = res.views[v].A, b = res.views[v].B;
  console.log(`${v.padEnd(12)} crowd pass A gpu ${a.gpuMs} cpu ${a.cpuMs} calls ${a.calls} tris ${(a.tris / 1000).toFixed(0)}k | B gpu ${b.gpuMs} cpu ${b.cpuMs} calls ${b.calls} tris ${(b.tris / 1000).toFixed(0)}k | gpu ${a.gpuMs ? (100 * (b.gpuMs / a.gpuMs - 1)).toFixed(1) : '-'}% cpu ${(100 * (b.cpuMs / a.cpuMs - 1)).toFixed(1)}%`);
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
res.logs = logs;
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(logs.length ? logs.slice(0, 10).join('\n') : 'no console errors');
await page.close();
process.exit(0);
