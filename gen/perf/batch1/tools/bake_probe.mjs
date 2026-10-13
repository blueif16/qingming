// what the crowd's bakes hold (gen/perf/batch1, step 4): per bake the largest translation and how far each bone
// matrix is from rotation x uniform scale (can two texels a bone hold it?)
//   tools/chrome_slot.sh node gen/perf/batch1/tools/bake_probe.mjs <url> [view]
import { chromium } from 'playwright-core';
const [url, view = 'crown'] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 120000 });
  await page.evaluate((v) => window.__test.view(v), view);
  await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 90000 }).catch(() => {});
  const r = await page.evaluate(() => {
    const out = [];
    for (const s of window.__test.people.crowd.sets.values()) for (const x of [s, ...(s.followers || [])]) {
      if (!x.data) continue;
      const a = x.arr, info = { name: x.model.name + (x === s ? '' : ':' + x.mesh.name), kb: x.data.kb, rows: x.rows, maxT: 0, maxScaleDev: 0, maxOrthoDev: 0, scale: [Infinity, 0], texels: x.texels, maxAbs: 0 };
      const W = x.W, H = x.H, stride = x.stride;
      const get = x.get ? (r, b) => x.get(r, b) : null;
      for (let i = 0; i < a.length; i++) info.maxAbs = Math.max(info.maxAbs, Math.abs(a[i]));
      if (!x.texels || x.texels === 3) {
        for (let t = 0; t + 12 <= a.length; t += 12) {
          const m = a.subarray(t, t + 12);
          if (!m[0] && !m[5] && !m[10]) continue;
          // rows: [r00 r01 r02 tx][r10 r11 r12 ty][r20 r21 r22 tz]
          const c = [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]];
          const L = c.map((v) => Math.hypot(...v));
          const sc = (L[0] + L[1] + L[2]) / 3;
          info.scale[0] = Math.min(info.scale[0], sc); info.scale[1] = Math.max(info.scale[1], sc);
          info.maxScaleDev = Math.max(info.maxScaleDev, ...L.map((l) => Math.abs(l - sc) / sc));
          const dot = (u, v) => (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (sc * sc);
          info.maxOrthoDev = Math.max(info.maxOrthoDev, Math.abs(dot(c[0], c[1])), Math.abs(dot(c[0], c[2])), Math.abs(dot(c[1], c[2])));
          info.maxT = Math.max(info.maxT, Math.abs(m[3]), Math.abs(m[7]), Math.abs(m[11]));
        }
      }
      out.push(info);
    }
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
} finally { await page.close(); await browser.close(); }
