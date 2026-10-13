// Probe the boat flow on the world page: stand at a spot, fast-forward the walker (the boats step with it) and print
// the flow's state every few seconds, plus page errors.
//   tools/chrome_slot.sh node gen/boats/flow/tools/flow_probe.mjs "<url>" X D seconds [every] [face_deg]
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const [url, X, D, secs = '120', every = '10', face = '0'] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test?.goto, null, { timeout: 90000 });
  const out = await page.evaluate(async ([X, D, secs, every, face]) => {
    const t = window.__test, p = t.player, B = t.boats;
    await t.goto(X, D);
    p.yaw = face * Math.PI / 180 - Math.PI / 2;
    await new Promise((r) => setTimeout(r, 1500));
    const rows = [];
    for (let k = 0; k * every < secs; k++) {
      for (let i = 0; i < every * 60; i++) p.update(1 / 60);
      await new Promise((r) => requestAnimationFrame(() => r()));
      rows.push({ t: (k + 1) * every, flow: B.flow?.report(), stats: B.flow?.stats && { ...B.flow.stats } });
    }
    return { mode: B.flow?.mode, cap: B.flow?.cap, rows, list: B.list.length };
  }, [+X, +D, +secs, +every, +face]);
  console.log(`mode ${out.mode} cap ${out.cap} boats in list ${out.list}`);
  for (const r of out.rows) {
    console.log(`t ${r.t}s  spawned ${r.stats?.spawned} hidden ${r.stats?.hidden} waits ${r.stats?.waits?.toFixed(1)} stepMs/step ${(r.stats?.stepMs / Math.max(1, r.stats?.steps)).toFixed(3)}`);
    for (const set of r.flow || []) {
      console.log(`  ${set.section}: zones held ${set.zones.filter((z) => z.side).map((z) => z.side + '(' + z.users.length + ')').join(' ')}  waves ${set.waves.map((w) => w.lane + ':' + w.next + '/' + w.burst).join(' ')}`);
      for (const b of set.boats) console.log(`    ${b.id.split('.').pop().padEnd(36)} ${b.lane.padEnd(26)} ${b.st.padEnd(5)} s ${String(b.s).padStart(6)} / ${b.end} v ${b.v}${b.blocked ? ' blocked by ' + b.blocked.split('.').pop() : ''}${b.misted ? ' misted' : ''}${b.mast !== null ? ' mast ' + b.mast : ''}${b.tow !== undefined ? ' tow ' + b.tow : ''}${b.crew !== undefined ? ' crew ' + b.crew : ''}`);
    }
  }
} finally {
  console.log('errors:', JSON.stringify(errs.slice(0, 20), null, 1));
  await page.close(); await browser.close();
}
