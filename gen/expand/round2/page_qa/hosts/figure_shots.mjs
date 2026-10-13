// Close-ups of chosen figures (page item 5: who floats or sinks on roofs, ladders, sterns, cart beds), the camera
// frozen 3.5 m south of each (toward the scroll's viewer), 1.3 m above its feet, looking at its waist
// (CAM_UP, CAM_BACK override the 1.3 and 3.5).
//   tools/chrome_slot.sh node gen/expand/round2/page_qa/hosts/figure_shots.mjs <base url> <out dir> <folder>:<id>[,<id>] ...
// Writes <out>/<id>.png and <out>/sheet.jpg (3 a row, labelled by file order).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const req = createRequire('/home/ran/3d_director/qingming/tools/package.json');
const { chromium } = req('playwright-core');
const sharp = req('sharp');
const [base, out, ...groups] = process.argv.slice(2);
const UP = +(process.env.CAM_UP || 1.3), BACK = +(process.env.CAM_BACK || 3.5); // the camera over the feet and south of them
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
const files = [];
try {
  await page.setViewportSize({ width: 800, height: 450 });
  for (const g of groups) {
    const [folder, ids] = g.split(':');
    await page.goto(`${base}/world.html?sections=${folder}&window=0&hour=10`);
    await page.waitForFunction(() => window.__test, null, { timeout: 120000 });
    await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); window.__test.set('view', 'first'); });
    await page.waitForTimeout(1500);
    for (const id of ids.split(',')) {
      const ok = await page.evaluate(([id, UP, BACK]) => {
        const t = window.__test, p = t.people.all.find((q) => q.id === id);
        if (!p) return false;
        const q = p.root.position;
        t.player.frozen = true;
        t.player.pos.set(q.x, q.y - 10, q.z + 3.5); // out of the way (no body in the shot)
        const cam = t.player.camera;
        cam.position.set(q.x + 0.8, q.y + UP, q.z + BACK);
        cam.lookAt(q.x, q.y + 0.8, q.z);
        window.__shotCam = { pos: cam.position.clone(), quat: cam.quaternion.clone() };
        return true;
      }, [id, UP, BACK]);
      if (!ok) { console.log(`${id}: not found`); continue; }
      await page.waitForTimeout(500);
      await page.evaluate(() => { const c = window.__test.player.camera; c.position.copy(window.__shotCam.pos); c.quaternion.copy(window.__shotCam.quat); });
      await page.waitForTimeout(200);
      const f = path.join(out, `${id}.png`);
      await page.screenshot({ path: f });
      files.push(f);
      console.log(`${id}: ${f}`);
    }
  }
} finally { await page.close(); await browser.close(); }
const W = 800, H = 450, per = 3, rows = Math.ceil(files.length / per);
if (files.length) {
  const tiles = await Promise.all(files.map(async (f) => {
    const label = Buffer.from(`<svg width="${W}" height="28"><rect width="${W}" height="28" fill="black" opacity="0.6"/><text x="8" y="20" font-size="18" fill="white" font-family="monospace">${path.basename(f, '.png')}</text></svg>`);
    return sharp(f).resize(W, H).composite([{ input: label, top: H - 28, left: 0 }]).png().toBuffer();
  }));
  await sharp({ create: { width: W * per, height: H * rows, channels: 3, background: '#000' } })
    .composite(tiles.map((b, i) => ({ input: b, left: (i % per) * W, top: Math.floor(i / per) * H }))).jpeg({ quality: 80 }).toFile(path.join(out, 'sheet.jpg'));
  console.log(`-> ${path.join(out, 'sheet.jpg')}`);
}
