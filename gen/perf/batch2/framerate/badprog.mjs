#!/usr/bin/env node
// Which call queries a deleted GL program (the "glGetProgramiv: Program object expected" warnings seen under look.mjs's
// frozen clock): getProgramParameter wrapped, the stack of every call on a program that is no longer one recorded.
//   tools/chrome_slot.sh node gen/perf/batch2/framerate/badprog.mjs "<url>" <out.json> [views]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const [url, out, viewArg] = process.argv.slice(2);
const views = (viewArg || 'crown,grain_wharf,storyteller').split(',');
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
await page.setViewportSize({ width: 1280, height: 720 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text()); });
await page.addInitScript(() => {
  window.__bad = [];
  const P = WebGL2RenderingContext.prototype, gp = P.getProgramParameter;
  P.getProgramParameter = function (p, k) {
    if (!this.isProgram(p) && window.__bad.length < 40) window.__bad.push({ k, t: performance.now(), stack: new Error().stack.split('\n').slice(2, 9).join(' | ') });
    return gp.call(this, p, k);
  };
});
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
for (const v of views) {
  await page.evaluate(() => window.__thaw?.());
  await page.evaluate((v) => window.__test.view(v), v);
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    const T = window.__test, now = performance.now(), pn = performance.now, pu = T.people.update, bu = T.boats.update;
    performance.now = () => now;
    T.people.update = function () { this.crowd?.update(this.camera); };
    T.boats.update = function (dt, cam) { return bu.call(this, 0, cam); };
    const plu = T.player.update; T.player.update = () => {};
    window.__thaw = () => { performance.now = pn; T.people.update = pu; T.boats.update = bu; T.player.update = plu; window.__thaw = null; };
  });
  await page.waitForTimeout(3000);
  console.log(v, 'bad so far', await page.evaluate(() => window.__bad.length), 'warnings', logs.filter((l) => l.includes('Program object')).length);
}
const bad = await page.evaluate(() => window.__bad);
fs.writeFileSync(out, JSON.stringify({ bad, logs: logs.slice(0, 20) }, null, 1));
console.log(JSON.stringify(bad.slice(0, 3), null, 1));
await page.close();
process.exit(0);
