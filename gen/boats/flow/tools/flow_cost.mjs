// What the boat flow costs at a river view: for each variant (off, painted, waves) stand at the spot, let the river
// run (fast) `warm` seconds, then measure `secs` seconds of frames (__test.measure: fps, CPU and GPU ms, draw calls,
// triangles) and the boats' own CPU (boats.stats: step and update ms per frame, the flow's share), and count boats and
// people. Optionally CPU-throttled (a phone's CPU, roughly) and at a pixel ratio.
//   tools/chrome_slot.sh node gen/boats/flow/tools/flow_cost.mjs X,D,H,facing,pitch [--warm 150] [--secs 6] [--throttle 4] [--cam 5] [--cap N]
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [X, D, H, face, pitch] = args[0].split(',').map(Number);
const warm = +opt('--warm', 150), secs = +opt('--secs', 6), throttle = +opt('--throttle', 1), camd = +opt('--cam', 5), cap = opt('--cap', null);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const rows = [];
for (const mode of ['', 'painted', 'waves']) {
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  try {
    const q = mode ? `?boatflow=${mode}${cap !== null && mode === 'waves' ? `&boatflowcap=${cap}` : ''}` : '';
    await page.goto('http://127.0.0.1:5190/world.html' + q);
    await page.waitForFunction(() => window.__test?.goto, null, { timeout: 90000 });
    await page.evaluate(async ([X, D, H, face, pitch, camd]) => {
      const t = window.__test, p = t.player, d = Math.PI / 180;
      t.set('hour', 10); if (camd) t.set('camDistance', camd);
      await t.goto(X, D, H > 0 ? H : undefined);
      p.yaw = face * d - Math.PI / 2; p.pitch = pitch * d;
    }, [X, D, H, face, pitch, camd]);
    await page.waitForTimeout(2000);
    for (let k = 0; k < warm; k += 5) { await page.evaluate(() => { const p = window.__test.player; for (let i = 0; i < 300; i++) p.update(1 / 60); }); await page.waitForTimeout(30); }
    await page.waitForTimeout(1500);
    const cdp = await page.context().newCDPSession(page);
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    const r = await page.evaluate(async (secs) => {
      const t = window.__test, B = t.boats;
      const s0 = { ...B.stats }, f0 = B.flow ? { ...B.flow.stats } : null;
      const m = await t.measure(secs);
      const s1 = B.stats, f1 = B.flow?.stats;
      const frames = Math.max(1, s1.frames - s0.frames);
      return { ...m, boatsCpuMs: +((s1.stepMs - s0.stepMs + s1.updateMs - s0.updateMs) / frames).toFixed(3), flowMs: f1 ? +((f1.stepMs - f0.stepMs) / frames).toFixed(3) : 0,
        boats: B.list.filter((b) => !b.hidden).length, copies: B.list.filter((b) => b.extra).length, shown: B.list.filter((b) => b.extra && !b.hidden).length, people: t.people.all.length };
    }, secs);
    if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    rows.push({ mode: mode || 'off', ...r });
  } finally { await page.close(); }
}
await browser.close();
console.log(`spot ${args[0]}, warm ${warm} s, ${secs} s measured, CPU throttle ${throttle}x (a shared check Chrome: compare the rows, not the absolute fps)`);
console.log('| flow | fps | CPU ms | anim ms | GPU ms | draws | triangles | boats CPU ms/frame | flow ms/frame | boats shown | copies (shown) | people |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.mode} | ${r.fps.toFixed(0)} | ${r.cpuMs.toFixed(2)} | ${r.animMs.toFixed(2)} | ${r.gpuMs == null ? '-' : r.gpuMs.toFixed(2)} | ${r.calls} | ${(r.tris / 1000).toFixed(0)}k | ${r.boatsCpuMs} | ${r.flowMs} | ${r.boats} | ${r.copies} (${r.shown}) | ${r.people} |`);
