#!/usr/bin/env node
// The life layer's switch (gen/life/progress.md): with ?talk=0 the page must behave as before the life pass; without it
// (on by default since the user's sign-off, 2026-10-13) the life layer is on. Loads world.html both ways and reads __test.details().talk, the scenes after every section's
// talk is fetched (__test.ui.loadTalk), the settings rows and the plot lines.
//   tools/chrome_slot.sh node gen/life/off_check.mjs     -> gen/life/check/off_check.json
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const out = { date: new Date().toISOString(), runs: [], fails: [] };
const OFF = '&talk=0';
for (const flag of [OFF, '']) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0${flag}`);
  await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
  const r = await page.evaluate(async () => {
    const t = window.__test;
    await t.ui.ready();
    const loaded = await t.ui.loadTalk();
    await t.ui.settings.open('view');
    const viewRows = t.ui.settings.state().rows.map((x) => x.id);
    t.ui.settings.page('ui');
    const uiRows = t.ui.settings.state().rows.map((x) => x.id);
    t.ui.settings.close();
    await new Promise((res) => setTimeout(res, 1500));
    return { life: t.ui.life(), loaded, scenes: t.ui.scenes().map((s) => s.id), detail: t.details?.()?.talk ?? null, viewRows, uiRows,
      chatter: t.ui.chatterState()?.on ?? null, threads: null };
  });
  r.flag = flag || '(none)';
  r.errors = errs.slice(0, 5);
  out.runs.push(r);
  console.log(JSON.stringify({ flag: r.flag, life: r.life, scenes: r.scenes.length, detail: r.detail, viewRows: r.viewRows, uiRows: r.uiRows, chatterOn: r.chatter, errors: r.errors }));
  if (flag === OFF) {
    if (r.scenes.length !== 6) out.fails.push(`off: ${r.scenes.length} scenes, want 6`);
    if (r.detail?.chatter || r.detail?.barks) out.fails.push('off: chatter or barks loaded');
    if (r.viewRows.includes('avatar') || r.uiRows.includes('chatter')) out.fails.push('off: the life rows show');
  } else {
    if (r.scenes.length < 60) out.fails.push(`on: only ${r.scenes.length} scenes`);
    if (!r.detail?.chatter) out.fails.push('on: no chatter');
  }
  await page.close();
}
fs.writeFileSync(`${Q}/gen/life/check/off_check.json`, JSON.stringify(out, null, 1));
console.log(out.fails.length ? `FAIL ${out.fails.join('; ')}` : 'PASS');
await browser.close();
