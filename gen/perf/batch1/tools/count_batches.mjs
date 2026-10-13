// boat batches and draws at a view: node count_batches.mjs <url> <view>
import { chromium } from 'playwright-core';
const [url, view] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const page = await browser.contexts()[0].newPage();
await page.goto(url); await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
const r = await page.evaluate(async (v) => {
  const T = window.__test; await T.view(v); await new Promise((r) => setTimeout(r, 3000));
  const bms = []; T.scene.traverse((o) => { if (o.isBatchedMesh && o.visible) bms.push([o.name, o.material.name, o._instanceInfo?.length, o.perObjectFrustumCulled]); });
  const m = await T.measure(2);
  return { batches: bms.length, perSection: Object.fromEntries([...new Set(bms.map((b) => b[0].split('_')[1]))].map((s) => [s, bms.filter((b) => b[0].split('_')[1] === s).length])), names: [...new Set(bms.map((b) => b[1]))].length, calls: m.calls, fps: Math.round(m.fps), loaded: [...T.loaded.keys()] };
}, view);
console.log(JSON.stringify(r)); await page.close(); await browser.close();
