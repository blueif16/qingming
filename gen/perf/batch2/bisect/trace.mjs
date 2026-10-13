#!/usr/bin/env node
// Trace the first teleport after load: view(<name>) without waiting, then every 100 ms the player's position, frozen,
// the current section and its state, the stream (lead, batch 2: the crown drop).
//   tools/chrome_slot.sh node gen/perf/batch2/bisect/trace.mjs "<url>" [view] [seconds]
import { chromium } from 'playwright-core';
const [url, name = 'crown', secs = '25'] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}] ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
const rows = await page.evaluate(async ([name, secs]) => {
  const T = window.__test, out = [], t0 = performance.now();
  let done = false;
  T.view(name).then(() => { done = true; });
  while (performance.now() - t0 < secs * 1000) {
    const st = T.stream.stats(), p = T.player;
    out.push([Math.round(performance.now() - t0), p.pos.toArray().map((v) => +v.toFixed(2)).join(','), p.frozen ? 'F' : '-', p.vel ? +p.vel.y.toFixed(2) : null,
      st.cur, st.loaded.join('+'), st.loading.join('+'), done ? 'done' : '', p.bvh ? 'bvh' : 'nobvh', p.ride ? 'ride' : '']);
    await new Promise((r) => setTimeout(r, 100));
  }
  return out;
}, [name, +secs]);
let last = '';
for (const r of rows) { const k = r.slice(1).join(' '); if (k !== last) console.log(r.join(' ')); last = k; }
await page.close();
