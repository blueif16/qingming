#!/usr/bin/env node
// QA helper (inner city review): tools/shots_page.mjs with the player frozen (player.frozen = true), so a spot can
// stand in mid-air (aerial views, a window seen from outside). Same spots format and output (<out>/<name>.png).
// Usage: node shots_fly.mjs <url> <out_dir> <spots.json> [--hour 10]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');

const [url, out, spotsFile] = process.argv.slice(2);
const spots = JSON.parse(fs.readFileSync(spotsFile, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
const page = await browser.contexts()[0].newPage();
try {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 90000 });
  await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); });
  const hour = process.argv.includes('--hour') ? +process.argv[process.argv.indexOf('--hour') + 1] : 10;
  await page.evaluate((h) => window.__test.set('hour', h), hour);
  await page.waitForTimeout(800);
  for (const [name, X, D, H, f, p, set] of spots) {
    await page.evaluate(([X, D, H, f, p, set]) => {
      const t = window.__test; const d = Math.PI / 180;
      for (const [k, v] of Object.entries(set || {})) t.set(k, v);
      t.player.frozen = true;
      t.player.pos.set(X, H + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
      // frozen: the player no longer moves the camera, so place it at the eyes here (first person)
      const cam = t.player.camera; cam.position.set(X, H + 0.2 + (t.player.s.eyeHeight || 1.6), -D); cam.rotation.set(t.player.pitch, t.player.yaw, 0, 'YXZ');
    }, [X, D, H, f, p, set]);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, `${name}.png`) });
  }
} finally {
  await page.close(); await browser.close();
}
console.log('done', spots.length);
