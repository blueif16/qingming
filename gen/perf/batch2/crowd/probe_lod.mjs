#!/usr/bin/env node
// The crowd's far bodies in a page (perf batch 2, crowd agent): per view, the people drawn full and far, which
// characters have a far body, the crowd's triangles in the colour pass, and the frame's calls and triangles.
//   tools/chrome_slot.sh node gen/perf/batch2/crowd/probe_lod.mjs "<url>" <out.json> [--views crown,...] [--viewport 390x844x3]
//     [--lod <m>] [--min <n>]   (set crowd.lodFar / crowd.lodMin after load; default the tier's)
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, out] = pos;
const views = opt('--views', 'crown,grain_wharf,storyteller').split(',');
const lod = opt('--lod', null), lodMin = opt('--min', null);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, D] = opt('--viewport', '390x844x3').split('x').map(Number);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: D, mobile: W < 800 });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 240000 });
await page.evaluate(() => window.__test.set('hour', 10));
if (lod !== null) await page.evaluate((v) => { window.__test.people.crowd.lodFar = Number(v); }, lod);
if (lodMin !== null) await page.evaluate((v) => { window.__test.people.crowd.lodMin = Number(v); }, lodMin);
const res = { url, lod, lodMin, views: {} };
for (const v of views) {
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(12000);
  const m = await page.evaluate((s) => window.__test.measure(s), 2);
  const c = await page.evaluate(() => {
    const cr = window.__test.people.crowd;
    let full = 0, far = 0, triFull = 0, triFar = 0, withLod = 0, batches = 0, drawsFull = 0, drawsFar = 0;
    const per = [];
    for (const b of cr.batches.values()) {
      batches++;
      if (b.far) withLod++;
      const n = b.mesh?.count || 0, nf = b.far?.mesh.count || 0;
      full += n; far += nf;
      if (n) drawsFull++;
      if (nf) drawsFar++;
      triFull += n * (b.mesh ? b.mesh.geometry.index.count / 3 : 0);
      triFar += nf * (b.far ? b.far.mesh.geometry.index.count / 3 : 0);
      if (n || nf) per.push(`${b.model.name}${b.part ? ':' + b.part : ''} ${n}+${nf}${b.far ? '' : ' (no far body)'}`);
    }
    return { lodFar: cr.lodFar, shadowFar: cr.shadowFar, batches, withLod, full, far, drawsFull, drawsFar, crowdTris: triFull + triFar, triFull, triFar, per };
  });
  res.views[v] = { ...c, fps: +m.fps.toFixed(1), cpuMs: +m.cpuMs.toFixed(2), gpuMs: m.gpuMs && +m.gpuMs.toFixed(2), calls: m.calls, tris: m.tris };
  console.log(`${v.padEnd(12)} lodFar ${c.lodFar}: people ${c.full} full + ${c.far} far, draws ${c.drawsFull}+${c.drawsFar}, crowd tris ${(c.crowdTris / 1000).toFixed(0)}k (far ${(c.triFar / 1000).toFixed(0)}k); frame calls ${m.calls} tris ${(m.tris / 1000).toFixed(0)}k; batches ${c.batches} (${c.withLod} with a far body)`);
}
res.logs = logs;
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(logs.length ? logs.slice(0, 15).join('\n') : 'no console errors or warnings');
await page.close();
process.exit(0);
