// One walk (walks.json format) on the page with the player's push-out logged: which person moved the player, when and
// how far (fix-bridge: the S3 shore walk near the S4b seam). --nopush runs it with player.pushOut off.
//   tools/chrome_slot.sh node walk_debug.mjs <url> <walks.json> [index] [--nopush]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/ran/3d_director/qingming/tools/package.json')('playwright-core');
const [url, walksFile, idx = '0'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const nopush = process.argv.includes('--nopush');
const w = JSON.parse(fs.readFileSync(walksFile, 'utf8'))[+idx];
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 60000 });
const r = await page.evaluate(async ({ w, nopush }) => {
  const t = window.__test, p = t.player, T = t.THREE, d = Math.PI / 180, P = t.people;
  const [X, D] = w.start;
  if (t.goto) await t.goto(X, D);
  const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), T.DoubleSide);
  p.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D); p.vel.set(0, 0, 0); p.onGround = true;
  const orig = p.pushOut, log = [];
  let frame = 0;
  p.pushOut = nopush ? null : (pos, rad) => {
    const before = pos.clone();
    const moved = orig(pos, rad);
    if (moved) {
      let best = null;
      for (const q of P.all) { const dd = Math.hypot(q.root.position.x - before.x, q.root.position.z - before.z); if (!best || dd < best.dd) best = { dd, q }; }
      const id = best && (best.q.id || best.q.slug || best.q.name || '?');
      log.push([frame, +before.x.toFixed(2), +(-before.z).toFixed(2), +(pos.x - before.x).toFixed(3), +(-(pos.z - before.z)).toFixed(3), id, best ? +best.dd.toFixed(2) : null, best ? [+best.q.root.position.x.toFixed(2), +(-best.q.root.position.z).toFixed(2)] : null]);
    }
    return moved;
  };
  for (let i = 0; i < 30; i++) { frame++; p.update(1 / 60); }
  const trace = [];
  for (const [face, secs] of w.legs) {
    p.yaw = face * d - Math.PI / 2; p.keys.add('KeyW');
    for (let i = 0; i < secs * 60; i++) {
      frame++; p.update(1 / 60);
      if (i % 20 === 19) trace.push([+p.pos.x.toFixed(2), +(-p.pos.z).toFixed(2), +p.pos.y.toFixed(2)]);
      if (i % 10 === 9 && i < 150) {   // what collider surfaces lie within 0.5 m of the capsule's middle
        const c = new T.Vector3(p.pos.x, p.pos.y + 0.6, p.pos.z), near = [];
        for (const s of t.loaded.values()) {
          if (!s.bvh) continue;
          const h = s.bvh.closestPointToPoint(c, {}, 0, 0.6);
          if (h && h.distance < 0.6) {
            const fa = h.faceIndex * 3, r = s.floorVerts.find(([i0, i1]) => fa >= i0 && fa < i1);
            near.push([s.name, r ? r[2] : 'hidden', +h.distance.toFixed(2), +h.point.x.toFixed(2), +(-h.point.z).toFixed(2), +h.point.y.toFixed(2)]);
          }
        }
        log.push(['near', frame, +p.pos.x.toFixed(2), +(-p.pos.z).toFixed(2), near]);
      }
    }
    p.keys.delete('KeyW');
  }
  p.pushOut = orig;
  return { end: { X: p.pos.x, D: -p.pos.z, H: p.pos.y }, trace, log: log.slice(0, 60), pushes: log.length };
}, { w, nopush });
console.log(w.label, nopush ? '(push-out OFF)' : '');
console.log('end', JSON.stringify(r.end), 'pushes', r.pushes);
console.log('trace', JSON.stringify(r.trace));
for (const l of r.log) console.log('  push', JSON.stringify(l));
await page.close(); await browser.close();
