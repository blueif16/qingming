#!/usr/bin/env node
// The world's draws and triangles by kind and pass at named views (the cells agent, perf batch 2): world sections
// (plain meshes or cell batches), boats, crowd, tree cards, the rest; colour pass and shadow pass apart.
//   tools/chrome_slot.sh node gen/perf/batch2/cells/probe_draws.mjs "<url>/world.html?tier=low&adapt=0" <out.json> [--views crown,under_arch] [--viewport 390x844x3]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [url, out] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const views = opt('--views', 'crown,under_arch').split(',');
const [W, H, DPR] = opt('--viewport', '390x844x3').split('x').map(Number);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: W < 800 });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
const res = { url, viewport: [W, H, DPR], views: {} };
for (const v of views) {
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  res.views[v] = await page.evaluate(async () => {
    const T = window.__test, r = T.renderer;
    // classify an object: which section root (or cell batch) it hangs under
    const kind = (o) => {
      if (o.name?.startsWith('cells_')) return 'world';
      for (let p = o; p; p = p.parent) {
        if (p.name?.startsWith('boat') || p.isBatchedMesh && !o.userData?.cells && o.parent?.name?.startsWith?.('boats')) return 'boats';
        if (p.name?.startsWith('section_')) return o.isBatchedMesh ? 'boats' : 'world';
      }
      if (o.name?.startsWith('trees_')) return 'cards';
      if (o.isInstancedMesh || o.isSkinnedMesh || o.userData?.crowd) return 'crowd';
      return 'other';
    };
    const stat = {};
    const orig = r.renderBufferDirect.bind(r);
    let pass = 'colour';
    r.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
      const p = camera.isOrthographicCamera && !scene ? 'shadow' : pass;
      const k = `${p}:${kind(object)}`;
      const s = stat[k] || (stat[k] = { draws: 0, tris: 0 });
      s.draws++;
      const before = r.info.render.triangles;
      orig(camera, scene, geometry, material, object, group);
      s.tris += r.info.render.triangles - before;
    };
    // three frames with the shadow map redrawn
    const frames = [];
    const raf = () => new Promise((res) => requestAnimationFrame(res));
    for (let i = 0; i < 3; i++) {
      await raf(); // after this frame's tick: the next frame redraws the shadow map
      r.shadowMap.needsUpdate = true;
      for (const k in stat) delete stat[k];
      await raf();
      frames.push(JSON.parse(JSON.stringify(stat)));
    }
    r.renderBufferDirect = orig;
    const info = { calls: r.info.render.calls, tris: r.info.render.triangles };
    return { frames, info, shadows: T.shadows(), cells: T.cells?.stats() };
  });
  console.log(v, JSON.stringify(res.views[v].frames[2]), JSON.stringify(res.views[v].cells || null));
}
res.logs = logs;
console.log(logs.slice(0, 20).join('\n'));
fs.writeFileSync(out, JSON.stringify(res, null, 1));
await page.close();
