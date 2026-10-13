// The S3 finisher's wade case (page queue, 19:25), in the page: S3's big boat under the arch with 8 s pauses (as before
// S3's workaround); a walker starts at (x, 9.3) on the bank and holds W north for 4 s from 11 moments of the cycle. The
// walker must not end in the water (H > -0.68). Run once with boats.js as it is and once with the old
// someoneBoarding (contact segment only) for comparison.
//   node <scratch>/eval_page.mjs "http://127.0.0.1:5190/world.html?sections=rainbow_bridge&window=0" gen/expand/round2/page_qa/wade_test.js
(async () => {
  const t = window.__test, T = t.THREE, B = t.boats, p = t.player, d = Math.PI / 180;
  const b = B.byId.get('S3.veh.boat_mast_lowering_19518');
  if (!b) return 'no boat';
  const nowFn = B.someoneBoarding.bind(B);
  const oldFn = function (bb) {
    const P = this.hooks.player?.pos; if (!P) return false;
    const seg = new T.Line3(), cp = new T.Vector3();
    const near = (x, ct) => { seg.set(ct.from, ct.to); seg.closestPointToPoint(P, true, cp); return Math.hypot(cp.x - P.x, cp.z - P.z) < ct.len / 2 + 0.5 && Math.abs(cp.y - P.y) < 1.5; };
    if (bb.contacts.some((ct) => near(bb, ct))) return true;
    return this.list.some((o) => o !== bb && o.contacts.some((ct) => ct.other === bb && near(o, ct)));
  };
  const out = {};
  for (const [name, fn] of [['old', oldFn], ['now', nowFn]]) {
    B.someoneBoarding = fn.bind(B);
    const res = [];
    for (const [x, hd] of [[138.0, 90], [138.3, 90], [138.6, 90], [138.9, 80], [138.4, 70], [137.6, 100], [139.3, 90]]) {
      for (const [state, clock] of [['rest', 7.7], ['rest', 7.2], ['rest', 6.7], ['rest', 6.2], ['rest', 5.2], ['out', 0.2], ['far', 0.5], ['far', 1.5], ['far', 2.5], ['back', 0.1], ['back', 0.4]]) {
        const lead = state + ' ' + clock;
        await t.goto(x, 9.3);
        b.pauses = [8, 3];
        // the boat at a moment of its cycle as the walk starts (8 s pauses: S3's before its workaround)
        const k = state === 'out' ? Math.min(1, clock / b.travel) : state === 'back' ? Math.min(1, clock / b.travel) : 0;
        const s0 = state === 'rest' ? 0 : state === 'far' ? b.run : (state === 'out' ? 0.5 - 0.5 * Math.cos(Math.PI * k) : 0.5 + 0.5 * Math.cos(Math.PI * k)) * b.run;
        Object.assign(b, { state, clock, s: s0, atRest: state === 'rest' });
        B.applyOpen(b);
        const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(x, 40, -9.3), new T.Vector3(0, -1, 0)), T.DoubleSide);
        p.pos.set(x, (hit ? hit.point.y : 0) + 0.05, -9.3); p.vel.set(0, 0, 0); p.onGround = true; p.ride = null;
        p.yaw = hd * d - Math.PI / 2; p.keys.add('KeyW');
        for (let i = 0; i < 240; i++) p.update(1 / 60);
        p.keys.delete('KeyW');
        // let the boat finish its outing and come back (so the next case starts the same)
        for (let i = 0; i < 60 * 20 && !(b.state === 'rest' && b.clock > 0.5); i++) p.update(1 / 60);
        res.push({ x, hd, lead, end: [+p.pos.x.toFixed(2), +(-p.pos.z).toFixed(2), +p.pos.y.toFixed(2)], wet: p.pos.y < -0.68 });
      }
    }
    out[name] = { wet: res.filter((r) => r.wet).length, of: res.length, wetCases: res.filter((r) => r.wet) };
  }
  B.someoneBoarding = nowFn;
  return out;
})()
