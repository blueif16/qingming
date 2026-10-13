import { chromium } from 'playwright-core';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const page = await (browser.contexts()[0]).newPage();
const logs = []; page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text()); }); page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
await page.goto('http://127.0.0.1:5190/world.html?tier=low&adapt=0&sound=0');
await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
const r = await page.evaluate(async () => {
  const T = window.__test;
  const before = { loaded: [...T.loaded.keys()], persons: [...T.loaded.values()].map((s) => [s.name, s.persons?.length, s.corridorsSeeded]) };
  await T.view('city_end:spawn');
  const after = { loaded: [...T.loaded.keys()], persons: [...T.loaded.values()].map((s) => [s.name, s.persons?.length, s.corridorsSeeded]), stats: T.stream.stats().events.slice(-6).map((e) => [e.kind, e.name, e.ms, e.stallMs]) };
  return { before, after, tiers: T.tiers.stats().name, bake: T.people.crowd.bakeStats().kb, shadows: T.shadows() };
});
console.log(JSON.stringify(r, null, 1));
console.log(logs.slice(0, 20).join('\n'));
await page.close(); await browser.close();
