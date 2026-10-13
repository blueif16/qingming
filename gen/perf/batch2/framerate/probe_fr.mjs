#!/usr/bin/env node
// The frame-rate agent's probe (perf batch 2): the boats' batches and the shadow layers while sections stream in and out.
//   tools/chrome_slot.sh node gen/perf/batch2/framerate/probe_fr.mjs "<url>/world.html?tier=low&adapt=0" <out.json> [view,view,...] [--viewport 390x844x3] [--wait 8]
// At each view (in order, so the window streams across the river): the loaded sections, every boat batch in the scene
// (name, active instances and geometries, capacity), the instances the boats (painted and flow copies) hold in each,
// whether the two agree, draw calls of one frame, the shadow state; console errors throughout.
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [url, out] = pos;
const viewList = (pos[2] || 'storyteller,crown,under_arch,grain_wharf,moorings_bank,farmsteads,crown,storyteller').split(',');
const waitS = +opt('--wait', 8);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, D] = opt('--viewport', '1280x720x1').split('x').map(Number);
if (D !== 1 || W < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: D, mobile: W < 800 });
else await page.setViewportSize({ width: W, height: H });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 180000 });
await page.evaluate(() => window.__test.set('hour', 11));
const rows = [];
for (const v of viewList) {
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(waitS * 1000);
  const r = await page.evaluate(async () => {
    const T = window.__test, bms = [];
    T.scene.traverse((o) => { if (o.isBatchedMesh && /^boats_/.test(o.name)) bms.push(o); });
    const held = new Map();
    for (const b of T.boats.list) for (const list of b.items || []) for (const it of list) held.set(it.bm, (held.get(it.bm) || 0) + 1);
    const batches = bms.map((bm) => {
      const active = bm._instanceInfo.filter((x) => x.active).length;
      return { name: bm.name, parent: bm.parent?.name || '', active, held: held.get(bm) || 0, geos: bm._geometryInfo.filter((g) => g.active).length,
        max: bm.maxInstanceCount, unusedV: bm.unusedVertexCount, visible: bm._instanceInfo.filter((x) => x.active && x.visible).length };
    });
    const orphan = [...held.keys()].filter((bm) => !bms.includes(bm)).length;
    // the scene's direct children: which are movers (userData.shadowMover) and how many shadow casters each holds
    const top = T.scene.children.map((o) => { let cast = 0; o.traverse((x) => { if ((x.isMesh || x.isLine || x.isPoints) && x.castShadow) cast++; });
      return { name: o.name || o.type, mover: !!o.userData.shadowMover, cast }; });
    const topSum = {}; for (const t of top) { const k = `${t.mover ? 'mover' : 'static'} ${t.name.replace(/_[^_]*$/, '_*')}`; topSum[k] = (topSum[k] || 0) + t.cast; }
    const m = await T.measure(1);
    return { sections: [...T.loaded.keys()], boats: T.boats.list.length, copies: T.boats.list.filter((b) => b.extra).length, shown: T.boats.list.filter((b) => b.extra && !b.hidden).length,
      batches, nBatches: bms.length, mismatch: batches.filter((x) => x.active !== x.held).map((x) => x.name), orphan,
      pool: T.boats.pool ? [...T.boats.pool.values()].map((e) => [e.bm.name, e.sets.size]) : null,
      top: topSum, fps: m.fps, cpuMs: m.cpuMs, calls: m.calls, tris: m.tris, shadows: T.shadows(),
      layers: T.shadowLayers ? { on: T.shadowLayers.on, worldDraws: T.shadowLayers.worldDraws, moverDraws: T.shadowLayers.moverDraws } : null };
  });
  r.view = v;
  rows.push(r);
  console.log(`${v.padEnd(14)} ${r.sections.join('+').padEnd(20)} boats ${r.boats} (copies ${r.copies}, shown ${r.shown}) batches ${r.nBatches} mismatch ${r.mismatch.length} orphan ${r.orphan}  ${r.fps.toFixed(0)} fps cpu ${r.cpuMs.toFixed(2)} ${r.calls} calls  shadow redraws ${r.shadows.redraws}/${r.shadows.frames}${r.layers ? ` world ${r.layers.worldDraws} movers ${r.layers.moverDraws}` : ''}`);
}
fs.writeFileSync(out, JSON.stringify({ url, rows, logs }, null, 1));
console.log(logs.length ? logs.join('\n') : 'no console errors');
await page.close();
process.exit(0);
