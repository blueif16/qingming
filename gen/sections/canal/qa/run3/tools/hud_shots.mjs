// hud_shots.mjs <url> <out_dir> <spots.json>: for each [name, X, D, facing_deg]: goto, stand there, open the scroll HUD
// (window.__test.hud.show()), wait for its tiles, screenshot, record what it drew; close. CDP_PORT from chrome_slot.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const _pw = await import(createRequire('/home/ran/3d_director/qingming/tools/walk_page.mjs').resolve('playwright-core'));
const chromium = _pw.chromium || _pw.default.chromium;
const [url, out, spotsF] = process.argv.slice(2);
const spots = JSON.parse(fs.readFileSync(spotsF, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
const res = [];
try {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(url, { timeout: 180000 });
  await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
  for (const [name, X, D, face] of spots) {
    const r = await page.evaluate(async ([X, D, face]) => {
      const t = window.__test, p = t.player, T = t.THREE;
      await t.goto(X, D);
      const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), T.DoubleSide);
      p.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D); p.vel.set(0, 0, 0); p.yaw = face * Math.PI / 180 - Math.PI / 2;
      for (let i = 0; i < 30; i++) p.update(1 / 60);
      await new Promise((r) => setTimeout(r, 800));
      await t.hud.show();
      for (let i = 0; i < 40 && t.hud.stats().pending; i++) await new Promise((r) => setTimeout(r, 250));
      await new Promise((r) => setTimeout(r, 700));
      const drawn = t.hud.drawn.map((d) => d.id);
      return { stats: t.hud.stats(), you: t.hud.you(), boxes: drawn.filter((x) => x !== 'you').length, ids: drawn.slice(0, 60) };
    }, [X, D, face]);
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.evaluate(() => window.__test.hud.hide());
    console.log(name, JSON.stringify({ boxes: r.boxes, you: r.you, tiles: r.stats.tiles, pending: r.stats.pending }));
    res.push({ name, X, D, face, ...r });
  }
} finally { await page.close(); await browser.close(); }
fs.writeFileSync(`${out}/hud.json`, JSON.stringify(res, null, 1));
