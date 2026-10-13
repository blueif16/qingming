// Ride a moving deck on the boats test page (web/boats.html), in the private bench Chrome (9227), stepping the walker
// at 60 Hz as tools/walk_page.mjs does (the boats step with it):
//  1. stand on B's foredeck while R (rafted outside B) waits at its painted spot; walk north onto R
//  2. stand still while R rows out 10 m and back: the walker must stay where it stood on R's deck (in R's frame)
//  3. while R is away, walk south toward B: R's closed rail must stop you on its deck (not in the river)
//  4. when R is back at its spot, walk south onto B again
//  5. stand 10 s on the moored A as it rides the water: no drift
// tools/chrome_slot.sh node gen/expand/round2/page_qa/ride_test.mjs http://127.0.0.1:5190/boats.html
// (recovered 2026-10-12 from the boats page agent's transcript; its scratchpad copy was wiped at the restart)
const { chromium } = await import('/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs');
const url = process.argv[2] || 'http://127.0.0.1:5180/boats.html';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9227'));
const page = await browser.contexts()[0].newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
let out;
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 90000 });
  out = await page.evaluate(async () => {
    const t = window.__test, p = t.player, T = t.THREE, B = t.boats, d = Math.PI / 180;
    const R = B.byId.get('SB.veh.boat_sweep_r'), A = B.byId.get('SB.veh.boat_passenger_a');
    const res = { steps: [] };
    const local = (b) => p.pos.clone().applyMatrix4(b.roots[0].matrixWorld.clone().invert());
    const where = () => ({ X: +p.pos.x.toFixed(2), D: +(-p.pos.z).toFixed(2), H: +p.pos.y.toFixed(2) });
    const run = (secs, key, face, every = 1, b = null) => {
      const tr = [];
      if (key) { p.yaw = face * d - Math.PI / 2; p.keys.add('KeyW'); }
      for (let i = 0; i < secs * 60; i++) {
        p.update(1 / 60);
        if (i % (60 * every) === 60 * every - 1) tr.push({ ...where(), R: R.state, Rs: +R.s.toFixed(2), ride: p.ride?.mover?.boat?.slug || null, ...(b ? { l: local(b).toArray().map((x) => +x.toFixed(2)) } : {}) });
      }
      p.keys.delete('KeyW');
      return tr;
    };
    // 1: R at its spot, its pause just begun
    await t.goto(1.6, 7.6, 0.0);
    Object.assign(R, { state: 'rest', clock: 0, s: 0, atRest: true });
    p.pos.set(1.6, 0.2, -7.6); p.vel.set(0, 0, 0);
    run(0.5);
    res.start = where();
    res.boardR = run(2.2, true, 90, 0.5);
    res.onR = { ...where(), ride: p.ride?.mover?.boat?.slug || null };
    // 2: stand while R goes out and back (its pause first)
    const l0 = local(R);
    const ride = run(30, false, 0, 1, R);
    const ls = ride.map((r) => r.l), drift = Math.max(...ls.map((l) => Math.hypot(l[0] - l0.x, l[2] - l0.z)));
    res.ride = { samples: ride.filter((_, i) => i % 3 === 0), maxDriftInR: +drift.toFixed(3), worldXspan: +(Math.max(...ride.map((r) => r.X)) - Math.min(...ride.map((r) => r.X))).toFixed(2), maxRs: Math.max(...ride.map((r) => r.Rs)) };
    // 3: away from its spot (it has come out by now): walk toward B
    let guard = 0;
    while ((R.state !== 'out' && R.state !== 'far') && guard++ < 3600) p.update(1 / 60);
    res.awayState = R.state + ' ' + R.s.toFixed(2);
    res.railTry = run(2.5, true, 270, 0.5);
    res.afterRail = { ...where(), ride: p.ride?.mover?.boat?.slug || null };
    // 4: wait for it to come back to its spot, then step onto B
    guard = 0;
    while (R.state !== 'rest' && guard++ < 60 * 60) p.update(1 / 60);
    run(0.5);
    res.backAtSpot = { ...where(), state: R.state };
    res.toB = run(2.5, true, 270, 0.5);
    res.onB = { ...where(), ride: p.ride?.mover?.boat?.slug || null };
    // 5: stand on the moored A as it rides
    await t.goto(0.0, 2.6, -0.1);
    run(0.5);
    const a0 = local(A), w0 = p.pos.clone();
    const tr = run(10, false, 0, 1, A);
    res.mooredA = { drift: +Math.max(...tr.map((r) => Math.hypot(r.l[0] - a0.x, r.l[2] - a0.z))).toFixed(3), worldMove: +Math.max(...tr.map((r) => Math.hypot(r.X - w0.x, r.D + w0.z, r.H - w0.y))).toFixed(3), ride: p.ride?.mover?.boat?.slug || null };
    return res;
  });
} finally {
  await page.close(); await browser.close();
}
const ok = {
  boardR: out.onR.ride === 'boat_sweep_r' && out.onR.D > 10.6 && out.onR.D < 14.2,
  carried: out.ride.maxDriftInR < 0.25 && out.ride.worldXspan > 8,
  rail: out.afterRail.ride === 'boat_sweep_r' && out.afterRail.H > -1.0,
  toB: out.onB.ride === 'boat_grain_b' && out.onB.D > 5.6 && out.onB.D < 10.4,
  moored: out.mooredA.ride === 'boat_passenger_a' && out.mooredA.drift < 0.05,
};
console.log(JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(ok)) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
console.log(errs.length ? errs.join('\n') : 'no page errors');
process.exit(Object.values(ok).every(Boolean) ? 0 : 1);
