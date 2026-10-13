// load world.html variants and print their console warnings/errors (look agent check)
// tools/chrome_slot.sh node gen/ui/look/tools_console.mjs "<url1>" "<url2>" ...
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const b = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
for (const url of process.argv.slice(2)) {
  const p = await b.contexts()[0].newPage();
  await p.setViewportSize({ width: 1200, height: 700 });
  const logs = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 600)}`); });
  p.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
  await p.goto(url);
  await p.waitForFunction(() => window.__test, null, { timeout: 90000 }).catch(() => logs.push('no __test'));
  await p.evaluate(() => window.__test.set('hour', 10));
  await p.waitForTimeout(3000);
  console.log('==', url, logs.length, 'messages');
  const uniq = [...new Set(logs)];
  console.log(uniq.slice(0, 8).join('\n'));
  await p.close();
}
await b.close();
