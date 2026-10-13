// clean screenshots of world.html (HUD hidden) from spots, for concept frames (look agent)
// tools/chrome_slot.sh node gen/ui/look/tools_capture.mjs <url> <out_dir> <spots.json> [WxH]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const [url, out, spotsFile, size = '1600x900'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const spots = JSON.parse(fs.readFileSync(spotsFile, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const b = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const p = await b.contexts()[0].newPage();
await p.setViewportSize({ width: W, height: H });
await p.goto(url);
await p.waitForFunction(() => window.__test, null, { timeout: 120000 });
await p.addStyleTag({ content: 'body > *:not(canvas) { display: none !important; } .lil-gui { display: none !important; }' });
for (const [name, X, D, Hh, f, pi, set] of spots) {
  await p.evaluate(([X, D, Hh, f, pi, set]) => {
    const t = window.__test; const d = Math.PI / 180;
    for (const [k, v] of Object.entries(set || {})) t.set(k, v);
    t.player.pos.set(X, Hh + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = pi * d;
    return t.goto?.(X, D, Hh);
  }, [X, D, Hh, f, pi, set]);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('shot', name);
}
await p.close(); await b.close();
