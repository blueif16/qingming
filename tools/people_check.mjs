#!/usr/bin/env node
// Checks the people of a scene page on the real GPU (tools/win_chrome.sh start), as numbers:
//   routines  over 20 s: walkers that never moved, anyone leaving the ground, how close walkers pass standing
//             figures and each other (bodies are 0.26 m in radius), how many stops and talking pairs happened
//   sizes     no adult drawn under 0.9 of its character's height unless its people.json gives a scale
//   bodies    the player walking into a standing figure keeps its distance (0.30 + 0.26 m)
//   routing   the player stands on the road (each --road spot, 12 s): nobody walks through the player, walkers get
//             past by going round (counted as they cross the player's line), nobody stays stuck in front of the
//             player for more than 6 s (they go round or turn back), and the ones who turned back are counted
// On a streaming page (world.html: __test.goto) each spot waits for the sections round it to load, and the 20 s count
// covers the sections loaded round the parking spot.
// Usage: node tools/people_check.mjs <url> [--into figure_id] [--road X,D[;X,D...]]
//   e.g. node tools/people_check.mjs http://127.0.0.1:5180/gate.html --into wall_idler_stick --road "7,3.9;-8,4.1"
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const url = args[0];
const into = opt('--into', 'wall_idler_stick');
const roads = opt('--road', '7,3.9;-8,4.1').split(';').map((p) => p.split(',').map(Number));
let browser;
try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223')); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 800, height: 450 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url);
await page.waitForFunction(() => window.__test, null, { timeout: 60000 });
const fail = [];

// routines, with the player parked out of the way
const r = await page.evaluate(async () => {
  const t = window.__test, P = t.people;
  // a streaming page: the window settles round the parking spot, and the player is held there while counting (with
  // no floor under it, it would fall and be reset into the gate, and the window would move under the count)
  const hold = !!t.goto, was = t.player.frozen;
  if (hold) { await t.goto(-40, -30); t.player.frozen = true; }
  t.player.pos.set(-40, 0.2, 30);
  const walkers = P.walkers, start = walkers.map((a) => a.p.root.position.clone());
  const statics = P.agents.filter((a) => !a.path).map((a) => a.p);
  let minFig = 9, minPair = 9, low = 9, high = -9, highId = '', off = 0, offId = ''; const stops = new Set(), talks = new Set();
  const ground = P.hooks?.ground; // the same probe walkers follow: heights are judged against the ground built under them
  const offRun = walkers.map(() => 0); // consecutive samples a walker spent more than a curb off it (a step is one sample)
  const far = walkers.map(() => 0); // the furthest each walker got from its start (short loops come back to it)
  for (let k = 0; k < 50; k++) {
    await new Promise((res) => setTimeout(res, 400));
    for (const [i, a] of walkers.entries()) {
      const q = a.p.root.position;
      far[i] = Math.max(far[i], q.distanceTo(start[i]));
      low = Math.min(low, q.y); if (q.y > high) { high = q.y; highId = a.p.id; }
      if (ground) {
        // probe from knee height, so eaves, decks and loads overhead are not taken for the ground; count only a gap that
        // lasts three samples (1.2 s): a walker easing over a curb or a probe at a collider's edge is one
        const d = Math.abs(q.y - ground(q.x, q.z, q.y + 0.5));
        offRun[i] = d > 0.35 ? offRun[i] + 1 : 0;
        if (offRun[i] >= 3 && d > off) { off = d; offId = a.p.id; }
      }
      if (a.state === 'stop') (a.partner ? talks : stops).add(a.p.id);
      if (a.state !== 'walk') continue;
      for (const f of statics) if (Math.abs(f.root.position.y - q.y) < 1) minFig = Math.min(minFig, Math.hypot(f.root.position.x - q.x, f.root.position.z - q.z));
      for (const b of walkers) if (b !== a && b.state === 'walk' && b.partner !== a && a.partner !== b) minPair = Math.min(minPair, Math.hypot(b.p.root.position.x - q.x, b.p.root.position.z - q.z));
    }
  }
  if (hold) t.player.frozen = was;
  const stuckIds = walkers.filter((a, i) => far[i] < 0.5).map((a) => a.p.id);
  return { walkers: walkers.length, figures: statics.length, stuck: stuckIds.length, stuckIds,
    groundY: [+low.toFixed(2), +high.toFixed(2)], highest: highId, offGround: ground ? +off.toFixed(2) : null, offGroundId: offId, closestToFigure: +minFig.toFixed(2), closestWalkingPair: +minPair.toFixed(2), stopped: stops.size, talkingPairs: talks.size };
});
console.log('routines (20 s):', JSON.stringify(r));

// sizes: every adult stands at its character's height. Only figures with a people.json "scale" (painted children,
// small far figures) may be smaller. Props and tack baked into a character's GLB once inflated the load-time box and
// drew every porter, carter and boatman at about 0.6 (2026-10-12)
{
  const fsm = await import('node:fs'), pth = await import('node:path');
  const Q = pth.join(pth.dirname(new URL(import.meta.url).pathname), '..');
  const scaled = new Set();
  for (const d of fsm.readdirSync(pth.join(Q, 'sections'))) {
    const pf = pth.join(Q, 'sections', d, 'people.json');
    if (!fsm.existsSync(pf)) continue;
    const pj = JSON.parse(fsm.readFileSync(pf, 'utf8'));
    for (const k of ['figures', 'walkers', 'animals']) {
      const v = pj[k] || {};
      for (const [id, sp] of Array.isArray(v) ? v.map((w) => [w.id, w]) : Object.entries(v)) if (sp && sp.scale) scaled.add(id);
    }
  }
  const humans = new Set(Object.keys(JSON.parse(fsm.readFileSync(pth.join(Q, 'web/public/assets/chars/characters.json'), 'utf8'))));
  const small = await page.evaluate(() => window.__test.people.agents.map((a) => a.p)
    .filter((q) => q.root && q.root.scale.y < 0.9).map((q) => [q.id, q.model?.name, +q.root.scale.y.toFixed(2)]));
  const bad = small.filter(([id, m]) => humans.has(m) && !scaled.has(id));
  console.log(`sizes: ${small.length} drawn under 0.9 (${small.length - bad.length} with a people.json scale); adults shrunk without one: ${bad.length}`);
  if (bad.length) fail.push(`${bad.length} adults drawn small without a scale, e.g. ${bad.slice(0, 5).map((b) => `${b[0]} (${b[1]} x${b[2]})`).join(', ')}`);
}
if (r.stuck) fail.push(`${r.stuck} walkers never moved`);
// off the ground = more than a curb (0.35, the step walkers take) from the ground built under them for 1.2 s; sections whose
// ground runs below -0.5 (S1's riverbanks) made the old absolute band fail on walkers standing on it
if (r.offGround != null ? r.offGround > 0.35 : (r.groundY[0] < -0.5 || r.groundY[1] > 0.6)) fail.push(`walkers left the ground (${r.offGround != null ? `${r.offGround} m off at ${r.offGroundId}` : `y ${r.groundY}`})`);

// walk into a standing figure from 2.2 m away
const start = await page.evaluate(async (id) => {
  const t = window.__test;
  // a streaming page: the figure's section may not be loaded; look it up in every section's people.json and go there
  if (t.goto && !t.people.all.some((p) => p.id === id)) {
    for (const name of t.sections.keys()) {
      const l = await fetch(`assets/${name}/layout.json`).then((r) => r.json()).catch(() => null);
      const fig = l?.figures?.find((x) => x.id === id);
      if (fig) { await t.goto(fig.X - 2.2, fig.D); break; }
    }
  }
  const f = t.people.all.find((p) => p.id === id);
  if (!f) return null;
  t.player.pos.set(f.root.position.x - 2.2, f.root.position.y + 0.2, f.root.position.z); t.player.yaw = -Math.PI / 2; t.player.vel.set(0, 0, 0);
  return true;
}, into);
if (!start) fail.push(`no figure ${into}`);
else {
  await page.waitForTimeout(300);
  await page.keyboard.down('KeyW');
  let m = 9;
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(100);
    m = Math.min(m, await page.evaluate(() => { const t = window.__test; return Math.min(...t.people.all.filter((p) => Math.abs(p.root.position.y - t.player.pos.y) < 1).map((p) => Math.hypot(p.root.position.x - t.player.pos.x, p.root.position.z - t.player.pos.z))); }));
  }
  await page.keyboard.up('KeyW');
  console.log(`walking into ${into}: closest to anyone ${m.toFixed(2)} m (bodies need 0.56)`);
  if (m < 0.5) fail.push(`player got ${m.toFixed(2)} m from someone`);
}

// stand on the road and let the traffic come: walkers should go round, or turn back if the way is shut
for (const [roadX, roadD] of roads) {
  const y = await page.evaluate(async ([x, d]) => {
    const t = window.__test, P = t.people; t.player.pos.set(x, 0.2, -d); t.player.vel.set(0, 0, 0); t.player.yaw = -Math.PI / 2;
    if (t.goto) await t.goto(x, d); // a streaming page: the sections round the spot loaded first
    await new Promise((res) => setTimeout(res, 300));
    t.player.pos.x = x; t.player.pos.z = -d; // after the drop onto the floor
    const pl = t.player.pos;
    let minD = 9; const passed = new Set(), blocked = new Set(), turned = new Set(), stuckFor = new Map(), last = new Map();
    let longest = 0;
    for (let k = 0; k < 60; k++) {
      await new Promise((res) => setTimeout(res, 200));
      for (const a of P.walkers) {
        const q = a.p.root.position, id = a.p.id;
        if (Math.abs(q.y - pl.y) > 1) continue;
        const dist = Math.hypot(q.x - pl.x, q.z - pl.z);
        minD = Math.min(minD, dist);
        // crossing the player's line (perpendicular to the walker's way) within 1.6 m of the player = got past
        const fx = Math.sin(a.heading || 0), fz = Math.cos(a.heading || 0), along = (q.x - pl.x) * fx + (q.z - pl.z) * fz;
        const prev = last.get(id);
        if (prev && prev.dist < 1.6 && dist < 1.6 && Math.sign(prev.along) !== Math.sign(along) && prev.dir === a.dir && a.state === 'walk') passed.add(id);
        if (prev && prev.dir !== a.dir && prev.state === 'blocked') turned.add(id);
        last.set(id, { along, dist, dir: a.dir, state: a.state });
        if ((a.state === 'blocked' || a.state === 'queue') && dist < 2.5) {
          if (a.state === 'blocked') blocked.add(id);
          const n = (stuckFor.get(id) || 0) + 0.2; stuckFor.set(id, n); longest = Math.max(longest, n);
        } else stuckFor.set(id, 0);
      }
    }
    return { closestWalker: +minD.toFixed(2), wentRound: passed.size, stoppedFacing: blocked.size, turnedBack: turned.size, longestStandS: +longest.toFixed(1) };
  }, [roadX, roadD]);
  console.log(`standing on the road at X ${roadX} D ${roadD} for 12 s:`, JSON.stringify(y));
  if (y.closestWalker < 0.5) fail.push(`a walker came within ${y.closestWalker} m of the player at X ${roadX} D ${roadD}`);
  if (y.longestStandS > 6) fail.push(`a walker stood stuck in front of the player for ${y.longestStandS} s at X ${roadX} D ${roadD}`);
  if (!y.wentRound) fail.push(`nobody went round the player at X ${roadX} D ${roadD}`);
}

await page.close(); await browser.close();
if (errs.length) fail.push(...errs.map((e) => `page error: ${e}`));
console.log(fail.length ? `FAIL\n  ${fail.join('\n  ')}` : 'PASS');
process.exit(fail.length ? 1 : 0);
