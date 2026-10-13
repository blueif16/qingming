// QA helper: sample one walker's position, height and state for N seconds (player parked far away).
// Usage: node probe_walker.mjs <url> <walker_id> [seconds]
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const [url, id, secs = 24] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
const page = await browser.contexts()[0].newPage();
try {
  await page.setViewportSize({ width: 800, height: 450 });
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 90000 });
  const out = await page.evaluate(async ([id, secs]) => {
    const t = window.__test; t.player.pos.set(-40, 0.2, 30);
    const a = t.people.walkers.find((w) => w.p.id === id);
    if (!a) return 'no walker ' + id;
    const rows = [];
    for (let k = 0; k < secs * 2; k++) {
      await new Promise((r) => setTimeout(r, 500));
      const q = a.p.root.position; rows.push(`${(k / 2).toFixed(1)}s X ${q.x.toFixed(2)} D ${(-q.z).toFixed(2)} y ${q.y.toFixed(2)} ${a.state}`);
    }
    return rows.join('\n');
  }, [id, +secs]);
  console.log(out);
} finally { await page.close(); await browser.close(); }
