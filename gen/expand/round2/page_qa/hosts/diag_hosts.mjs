// Which figures float or sink (page item 5): for every painted figure of a section, its feet against the surface
// under them (every collider: sections, boats' decks and roofs). Floating: the first surface below the feet is more
// than 0.12 m down. Sunk: a surface lies over the feet (a ray from 1 m above the feet stops more than 0.08 m above them).
//   tools/chrome_slot.sh node gen/expand/round2/page_qa/hosts/diag_hosts.mjs <base url> <folder> [<folder> ...]
const { chromium } = await import('/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs');
const [base, ...folders] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 640, height: 360 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
let bad = 0;
try {
  for (const folder of folders) {
    await page.goto(`${base}/world.html?sections=${folder}&window=0&hour=10`);
    await page.waitForFunction(() => window.__test, null, { timeout: 120000 });
    const out = await page.evaluate(async (folder) => {
      const t = window.__test, T = t.THREE, P = t.people, sec = t.loaded.get(folder);
      await new Promise((r) => setTimeout(r, 1500)); // a few frames: hosted crew placed, walkers on their paths
      const figs = new Map(sec.layout.figures.map((f) => [f.id, f]));
      const attached = new Set(P.attached.map((a) => a.p));
      const rows = [];
      const down = new T.Vector3(0, -1, 0);
      for (const p of P.all) {
        const f = figs.get(p.id);
        if (!f) continue;
        const q = p.root.position;
        const below = t.player.bvh.raycastFirst(new T.Ray(new T.Vector3(q.x, q.y + 0.05, q.z), down), T.DoubleSide);
        const above = t.player.bvh.raycastFirst(new T.Ray(new T.Vector3(q.x, q.y + 1.0, q.z), down), T.DoubleSide);
        const gap = below ? q.y - below.point.y : 99;
        const sunk = above ? above.point.y - q.y : -99;
        rows.push({ id: f.id, support: f.support || '', H: f.H ?? 0, y: +q.y.toFixed(3), gap: +gap.toFixed(3), sunk: +sunk.toFixed(3), hosted: attached.has(p), rider: !!P.riders.find((r) => r.p === p) });
      }
      return rows;
    }, folder);
    const flagged = out.filter((r) => !r.rider && (r.gap > 0.12 || r.sunk > 0.08));
    console.log(`== ${folder}: ${out.length} figures, ${flagged.length} float or sink`);
    for (const r of flagged) console.log(`  ${r.gap > 0.12 ? 'FLOAT' : 'SUNK '} ${r.id.padEnd(40)} ${r.support.padEnd(52)} H ${String(r.H).padEnd(6)} y ${r.y} gap ${r.gap} sunk ${r.sunk} ${r.hosted ? 'hosted' : ''}`);
    const off = out.filter((r) => /^boat|ladder|stern|roof|floor|bed|bank/.test(r.support));
    console.log(`  supports off the ground (${off.length}):`);
    for (const r of off) console.log(`    ${r.id.padEnd(40)} ${r.support.padEnd(52)} H ${String(r.H).padEnd(6)} y ${r.y} gap ${r.gap} sunk ${r.sunk} ${r.hosted ? 'hosted' : ''}`);
    bad += flagged.length;
  }
} finally { await page.close(); await browser.close(); }
console.log(errs.length ? 'page errors:\n' + errs.join('\n') : 'no page errors');
