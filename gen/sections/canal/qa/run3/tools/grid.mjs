// Free-standing grid of a world page: at every cell, every collider surface under a ray from H 9, and which of
// them the walker's capsule (player.resolve: r 0.3, h 1.75) can stand on unmoved. Boats in, at their state then.
// node grid.mjs <url> <out.json> x0 x1 d0 d1 step [--wait ms]
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const a = process.argv.slice(2);
const [url, outF, x0, x1, d0, d1, st] = a;
const wait = a.includes('--wait') ? +a[a.indexOf('--wait') + 1] : 2500;
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9244'));
const page = await browser.contexts()[0].newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test && window.__test.boats, null, { timeout: 120000 });
  const out = await page.evaluate(async ([x0, x1, d0, d1, st, wait]) => {
    const t = window.__test, p = t.player, T = t.THREE;
    if (t.goto) await t.goto((x0 + x1) / 2, (d0 + d1) / 2);
    await new Promise((r) => setTimeout(r, wait));
    p.frozen = true;
    const rows = [];
    const ray = new T.Ray(), dn = new T.Vector3(0, -1, 0), v = new T.Vector3();
    for (let D = d1; D >= d0 - 1e-6; D -= st) {
      const row = [];
      for (let X = x0; X <= x1 + 1e-6; X += st) {
        ray.set(new T.Vector3(X, 9, -D), dn);
        const hs = p.bvh.raycast(ray, T.DoubleSide).map((h) => h.point.y).filter((y) => y < 8.9).sort((a, b) => b - a);
        const H = [];
        for (const y of hs) if (!H.length || H[H.length - 1] - y > 0.05) H.push(+y.toFixed(2));
        const F = [];
        for (const y of H) {
          if (y > 6) continue;
          const q = p.resolve(v.set(X, y + 0.03, -D));
          if (Math.hypot(q.x - X, q.z + D) < 0.04 && q.y - y < 0.25) F.push(y);
        }
        row.push([H.slice(0, 8), F]);
      }
      rows.push(row);
    }
    p.frozen = false;
    const people = t.people.all.map((q) => {
      const P = q.root.position, b = q.body, out = [];
      if (!b) out.push([P.x, -P.z, 0.26]);
      else { const fx = Math.sin(q.root.rotation.y), fz = Math.cos(q.root.rotation.y); for (const s of b.along) out.push([P.x + fx * s, -(P.z + fz * s), b.r]); }
      return { id: q.id, H: +P.y.toFixed(2), c: out.map((v) => v.map((x) => +x.toFixed(2))) };
    });
    const boats = t.boats.list.map((b) => ({ slug: b.slug, id: b.id, pos: [+b.roots[0].position.x.toFixed(2), +(-b.roots[0].position.z).toFixed(2)] }));
    return { x0, x1, d0, d1, st, rows, boats, people, loaded: [...t.loaded.keys?.() ?? []] };
  }, [+x0, +x1, +d0, +d1, +st, wait]);
  fs.writeFileSync(outF, JSON.stringify(out));
  console.log('wrote', outF, out.rows.length, 'x', out.rows[0].length, 'loaded', out.loaded);
} finally { await page.close(); await browser.close(); }
console.log(errs.length ? errs.join('\n') : 'no page errors');
