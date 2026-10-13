// Ride a flowing boat under the Rainbow Bridge with its mast lowered (?boatflow=waves: a copy of S3's small boat
// with the lowered mast, boat_lowered_mast_17708, sent down S3's lake lane eastward under the arch). The walker stands
// on its deck and is stepped at 60 Hz (the boats step with it). PASS when the walker rides it the whole way (on its
// deck, in its frame within 0.3 m), the boat passes under the arch (X 126-141) with its mast down (>= 80 degrees
// there), and nothing of the boat's top or the walker's head meets the soffit.
//   tools/chrome_slot.sh node gen/boats/flow/tools/bridge_ride.mjs [url]
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const url = process.argv[2] || 'http://127.0.0.1:5190/world.html?boatflow=waves';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
let out;
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test?.goto, null, { timeout: 90000 });
  out = await page.evaluate(async () => {
    const t = window.__test, p = t.player, T = t.THREE, B = t.boats;
    await t.goto(120, 3); // the south bank west of the bridge: S3 and its lake loaded
    await new Promise((r) => setTimeout(r, 1500));
    // the lake to itself: the painted boat drifting under the arch and any waves boats out of the way for the test
    const set = [...B.flow.sets.values()].find((x) => x.name === 'rainbow_bridge');
    for (const g of [...set.flows, ...set.pool]) if (g.st !== 'gone') B.flow.hide(g);
    for (const g of set.flows) g.t = 1e9;
    for (const w of set.waves) w.next = 1e9;
    const b = B.flow.spawnNow('S3.veh.boat_lowered_mast_17708', 'small2-down');
    if (!b) return { error: 'no copy' };
    const f = b.flow;
    for (let i = 0; i < 3; i++) p.update(1 / 60);
    // onto its deck amidships
    // onto its deck where it is open overhead (boats.js standLocal: off the awning)
    const deck = B.standLocal(b.template, new T.Vector3(0, 0, 0), 'deck', 1.8);
    const at = new T.Vector3(deck?.moved?.x ?? 0, (deck?.y ?? 0.2) + 0.05, deck?.moved?.z ?? 0).applyMatrix4(b.roots[0].matrixWorld);
    p.pos.copy(at); p.vel.set(0, 0, 0); p.onGround = true;
    for (let i = 0; i < 30; i++) p.update(1 / 60);
    const local = () => p.pos.clone().applyMatrix4(b.roots[0].matrixWorld.clone().invert());
    const l0 = local();
    const rows = [];
    const offAt = [];
    let rideAll = true, maxDrift = 0, underArch = [], minHeadroom = Infinity, minBoatHead = Infinity;
    const up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 60 * 90 && f.st !== 'wait' && f.st !== 'gone'; i++) {
      p.update(1 / 60);
      const ride = p.ride?.mover?.boat === b;
      if (!ride) { rideAll = false; offAt.push(i); }
      const l = local(), drift = Math.hypot(l.x - l0.x, l.z - l0.z);
      maxDrift = Math.max(maxDrift, drift);
      const X = b.roots[0].position.x;
      // what is over the walker's head (the soffit), from the feet up
      const sec = t.loaded.get('rainbow_bridge');
      const hit = sec?.bvh?.raycastFirst(new T.Ray(p.pos.clone().add(new T.Vector3(0, 0.3, 0)), up), T.DoubleSide); // the bridge, not the boat's own awning
      const head = hit ? hit.point.y - p.pos.y : Infinity;
      if (X > 126 && X < 141) { underArch.push(b.mastDeg ?? null); minHeadroom = Math.min(minHeadroom, head); }
      if (i % 60 === 0) rows.push({ og: p.onGround, rid: p.ride?.mover?.boat?.id || (p.ride ? 'other' : null), sup: B.supportOf(p.pos)?.boat?.id || null, t: i / 60, s: +f.s.toFixed(1), X: +X.toFixed(1), D: +(-b.roots[0].position.z).toFixed(1), mast: b.mastDeg == null ? null : +b.mastDeg.toFixed(0), ride, drift: +drift.toFixed(3), H: +p.pos.y.toFixed(2), head: head === Infinity ? null : +head.toFixed(2) });
    }
    return { id: b.id, lane: f.lane.id, rows: rows.filter((r, k) => k % 5 === 0), offAt: offAt.slice(0, 10), offCount: offAt.length, rideAll, maxDrift: +maxDrift.toFixed(3), underArch: underArch.length, mastUnderArch: underArch.length ? [Math.min(...underArch), Math.max(...underArch)] : null,
      minHeadroom: +minHeadroom.toFixed(2), endState: f.st, endX: +b.roots[0].position.x.toFixed(1) };
  });
} finally {
  await page.close(); await browser.close();
}
console.log(JSON.stringify(out, null, 1));
const ok = out && out.rideAll && out.maxDrift < 0.3 && out.underArch > 30 && out.mastUnderArch && out.mastUnderArch[0] >= 80 && out.minHeadroom > 1.75;
console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'no page errors');
console.log(`${ok ? 'PASS' : 'FAIL'}  ride under the Rainbow Bridge on ${out?.id}: carried the whole way ${out?.rideAll}, drift in its frame ${out?.maxDrift} m, ${out?.underArch} steps under the arch with the mast at ${JSON.stringify(out?.mastUnderArch)} deg, head room ${out?.minHeadroom} m`);
process.exit(ok ? 0 : 1);
