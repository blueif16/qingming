// what parsing one clip file costs in the page (GLTFLoader, meshopt), at CPU 4x: the per-file price of the split
//   tools/chrome_slot.sh node gen/perf/batch2/clips/parse_cost.mjs http://127.0.0.1:5196
import { chromium } from 'playwright-core';
const base = process.argv[2];
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`${base}/world.html?tier=low&adapt=0&sound=0&sections=city_end&window=0`, { timeout: 300000 });
await page.waitForFunction(() => window.__test, null, { timeout: 300000 });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const r = await page.evaluate(async () => {
  const man = await (await fetch('assets/chars/clips.json')).json();
  const files = Object.values(man.chars).flatMap((e) => Object.values(e.clips)).slice(0, 80);
  const bufs = await Promise.all(files.map((f) => fetch(f).then((x) => x.arrayBuffer())));
  const L = window.__test.loader, t = [];
  for (const b of bufs) { const t0 = performance.now(); await L.parseAsync(b, ''); t.push(performance.now() - t0); }
  const s = [...t].sort((a, b) => a - b);
  return { n: t.length, mean: t.reduce((a, b) => a + b, 0) / t.length, median: s[s.length >> 1], max: s[s.length - 1], kb: bufs.reduce((a, b) => a + b.byteLength, 0) / 1024 };
});
console.log(JSON.stringify(r));
await browser.close().catch(() => {});
