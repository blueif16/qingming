// trace getProgramParameter calls on deleted programs while touring the sky spots (look agent check)
// tools/chrome_slot.sh node gen/ui/look/tools_gltrace.mjs <url> <spots.json>
import fs from 'node:fs';
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const [url, spotsFile] = process.argv.slice(2);
const spots = JSON.parse(fs.readFileSync(spotsFile, 'utf8'));
const b = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const p = await b.contexts()[0].newPage();
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 200)); });
await p.setViewportSize({ width: 1600, height: 900 });
await p.addInitScript(() => {
  window.__glBad = [];
  for (const fn of ['getProgramParameter', 'getProgramInfoLog', 'useProgram', 'getUniformLocation', 'getAttribLocation', 'getActiveUniform', 'getActiveAttrib', 'deleteProgram', 'linkProgram', 'attachShader']) {
    const orig = WebGL2RenderingContext.prototype[fn];
    WebGL2RenderingContext.prototype[fn] = function (prog, ...a) {
      if (prog && !this.isProgram(prog)) window.__glBad.push(fn + ': ' + (new Error().stack || '').split('\n').slice(1, 6).join(' | '));
      return orig.call(this, prog, ...a);
    };
  }
});
await p.goto(url);
await p.waitForFunction(() => window.__test, null, { timeout: 90000 });
for (const [name, X, D, H, f, pi, set] of spots) {
  await p.evaluate(([X, D, H, f, pi, set]) => {
    const t = window.__test; const d = Math.PI / 180;
    for (const [k, v] of Object.entries(set || {})) t.set(k, v);
    t.player.pos.set(X, H + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = pi * d;
    return t.goto?.(X, D, H);
  }, [X, D, H, f, pi, set]);
  await p.waitForTimeout(500);
}
const bad = await p.evaluate(() => window.__glBad);
console.log(url, 'bad calls:', bad.length);
console.log([...new Set(bad)].slice(0, 4).join('\n\n'));
console.log('console warnings:', logs.length, [...new Set(logs)].slice(0, 3).join(' || '));
await p.close(); await b.close();
