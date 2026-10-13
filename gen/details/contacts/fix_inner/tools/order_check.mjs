#!/usr/bin/env node
// Load-order check for the inner_city / gate seam figures (P4: people.js re-grounds the seam neighbours after a
// section joins): the page started in each of two places, so the sections stream in in opposite orders, then the
// listed figures' roots compared with the ground hook asked again with every section in, and with each other.
//   tools/chrome_slot.sh node gen/details/contacts/fix_inner/tools/order_check.mjs [--url http://127.0.0.1:5190]
//        [--ids a,b,c] [--out gen/details/contacts/fix_inner/order_check.json]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';

const QM = '/home/ran/3d_director/qingming';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = opt('--url', 'http://127.0.0.1:5190');
const ids = opt('--ids', 'archer_waistguard_5465,pole_man_5578,crouching_dark_5515,bearded_carter_5428').split(',');
const out = path.resolve(QM, opt('--out', 'gen/details/contacts/fix_inner/order_check.json'));
// inner_city's far west (gate streams in last) and the gate's tower (gate first, inner_city after)
const starts = [['inner_city first', 'well'], ['gate first', 'tower']];
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const res = { date: new Date().toISOString(), ids, runs: {} };
for (const [label, view] of starts) {
  const page = await ctx.newPage();
  try {
    await page.goto(`${base}/world.html?sound=0&tier=high&adapt=0&start=0&spawn=${view}`);
    await page.waitForFunction(() => window.__test?.goto, null, { timeout: 300000 });
    await page.evaluate(() => window.__test.stream.settle());
    // walk the window over to the seam so both sections are in, the later one joining
    await page.evaluate(() => window.__test.goto(-31.5, 3));
    await page.evaluate(() => window.__test.stream.settle());
    await page.waitForTimeout(1500);
    res.runs[label] = await page.evaluate((ids) => {
      const T = window.__test, P = T.people;
      const order = [...T.loaded.keys()];
      const rows = {};
      for (const s of T.loaded.values()) for (const p of s.persons) {
        if (!ids.includes(p.id)) continue;
        const q = p.root.position;
        const f = s.layout.figures.find((x) => x.id === p.id);
        rows[p.id] = { section: s.name, root: [q.x, q.y, q.z].map((v) => Math.round(v * 1e4) / 1e4), hook_now: Math.round(P.hooks.ground(q.x, q.z, (f?.H || 0) + 1.2) * 1e4) / 1e4 };
      }
      return { loaded_order: order, rows };
    }, ids);
  } finally { await page.close(); }
}
const a = res.runs['inner_city first'].rows, b = res.runs['gate first'].rows;
res.compare = ids.map((id) => ({ id, y_inner_first: a[id]?.root[1], y_gate_first: b[id]?.root[1], hook: a[id]?.hook_now, diff_m: a[id] && b[id] ? Math.round(Math.abs(a[id].root[1] - b[id].root[1]) * 1000) / 1000 : null, off_hook_m: a[id] ? Math.round(Math.max(Math.abs(a[id].root[1] - a[id].hook_now), Math.abs((b[id]?.root[1] ?? a[id].root[1]) - a[id].hook_now)) * 1000) / 1000 : null }));
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
for (const r of res.compare) console.log(`${r.id}: y ${r.y_inner_first} (inner_city first) / ${r.y_gate_first} (gate first), hook ${r.hook}: order diff ${r.diff_m} m, off the hook ${r.off_hook_m} m ${r.diff_m <= 0.05 && r.off_hook_m <= 0.05 ? 'PASS' : 'FAIL'}`);
await browser.close().catch(() => {});
