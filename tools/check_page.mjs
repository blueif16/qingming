// Headless check of the test page: load it, collect console errors, take screenshots of the normal view,
// a few walk positions and the reference view. Usage: node check_page.mjs <url> <out_dir>
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const [url, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 120000 });
const failed = await page.evaluate(() => document.getElementById('loading')?.textContent);
if (failed) { console.log('LOAD FAILED:', failed); }
await page.waitForTimeout(2500);

const shot = async (name) => { await page.screenshot({ path: `${outDir}/${name}.png` }); console.log('shot', name); };
const info = await page.evaluate(() => {
  const t = window.__test; if (!t) return null;
  const box = (o) => { const b = new (o.position.constructor.prototype.constructor)(); return null; };
  return {
    player: t.player.pos.toArray().map((v) => +v.toFixed(2)),
    porter: t.porter.root.position.toArray().map((v) => +v.toFixed(2)),
    porterScale: +t.porter.root.scale.x.toFixed(4),
    porterClips: Object.keys(t.porter.actions),
    townsmanClips: Object.keys(t.townsman.actions),
    stats: document.getElementById('stats').textContent,
  };
});
console.log(JSON.stringify(info));
await shot('01_start');
for (const mode of ['cross', 'meshy']) {
  await page.evaluate((m) => { const t = window.__test; t.player.pos.set(0.5, 0, -4.5); t.player.yaw = 0.55; t.set('willowMode', m); }, mode);
  await page.waitForTimeout(2500);
  await shot('08_willow_' + mode);
}
await page.evaluate(() => { const t = window.__test; t.player.pos.set(0.5, 0, -4.5); t.player.yaw = 0.55; t.set('willowMode', 'billboard'); });
await page.waitForTimeout(1500);
await shot('08_willow_billboard');
await page.evaluate(() => { const t = window.__test; t.player.pos.set(0, 0, 1); t.player.yaw = Math.PI; t.player.pitch = 0; });
await page.waitForTimeout(500);
await shot('09_look_back');
await page.evaluate(() => { const t = window.__test; t.player.pos.set(0, 0, 1); t.player.yaw = 0; });
// walk forward 4 s
await page.keyboard.down('KeyW'); await page.waitForTimeout(4000); await page.keyboard.up('KeyW');
await page.waitForTimeout(300);
console.log('after walk', JSON.stringify(await page.evaluate(() => window.__test?.player.pos.toArray().map((v) => +v.toFixed(2)))));
await shot('02_walked');
// look right toward the townsman's side
await page.evaluate(() => { window.__test.player.yaw = -1.1; });
await page.waitForTimeout(400);
await shot('03_look_right');
// walk into a shop wall to test collision
await page.evaluate(() => { window.__test.player.yaw = -Math.PI / 2; });
await page.keyboard.down('KeyW'); await page.waitForTimeout(3500); await page.keyboard.up('KeyW');
console.log('after wall push', JSON.stringify(await page.evaluate(() => window.__test?.player.pos.toArray().map((v) => +v.toFixed(2)))));
// character close-ups
await page.evaluate(() => { const t = window.__test; t.player.pos.set(1.3, 0, -7.5); t.player.yaw = -Math.PI / 2; t.player.pitch = -0.08; });
await page.waitForTimeout(500);
await shot('06_townsman');
await page.evaluate(() => { const t = window.__test; const p = t.porter.root.position; t.player.pos.set(p.x + 0.4, 0, p.z - 2.6); t.player.yaw = Math.PI; t.player.pitch = -0.1; });
await page.waitForTimeout(200);
await shot('07_porter');
// reference view
await page.evaluate(() => { window.__test.s.refOpacity = 0; window.__test.toggleRef(); document.getElementById('ref').style.opacity = 0; });
await page.waitForTimeout(600);
await shot('04_refview');
await page.evaluate(() => { document.getElementById('ref').style.opacity = 0.5; });
await page.waitForTimeout(300);
await shot('05_refview_overlay');
console.log('stats', await page.evaluate(() => document.getElementById('stats').textContent));
console.log(logs.length ? logs.slice(0, 30).join('\n') : 'no console errors/warnings');
await browser.close();
