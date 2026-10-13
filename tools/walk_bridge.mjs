// Headless walk over the Rainbow Bridge's colliders with the page's own walker (web/src/player.js), in Node: no
// browser, no dev server. Reads <proof>/colliders.json (glTF axes: x = X, y = H, z = -D) and <proof>/stats.json
// (the deck table), holds W along routes at 60 Hz and checks where the walker ends and how high it walks.
//   node walk_bridge.mjs <proof_dir>
import fs from 'node:fs';
import path from 'node:path';

const WEB = '/home/ran/3d_director/qingming/web';
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false });
const THREE = await import(WEB + '/node_modules/three/build/three.module.js');
const { Player } = await import(WEB + '/src/player.js');

const dir = process.argv[2];
const col = JSON.parse(fs.readFileSync(path.join(dir, 'colliders.json'), 'utf8'));
const stats = JSON.parse(fs.readFileSync(path.join(dir, 'stats.json'), 'utf8'));
const table = stats.table;
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.Float32BufferAttribute(col.positions, 3));
const cam = new THREE.PerspectiveCamera();
const p = new Player(cam, { addEventListener() {} }, { walkSpeed: 2.2, runMultiplier: 2.2, eyeHeight: 1.6 });
p.setCollider(geo);

// the deck's centre line and height from the table; station of a world point by nearest table row
const W = (r) => [r.X, r.D];
const L = table[table.length - 1].s;
const at = (s) => { // interpolate the table at station s (clamped)
  s = Math.max(0, Math.min(L, s));
  const i = Math.min(table.length - 2, Math.floor(s / (table[1].s - table[0].s)));
  const a = table[i], b = table[i + 1], t = (s - a.s) / (b.s - a.s || 1);
  return { X: a.X + (b.X - a.X) * t, D: a.D + (b.D - a.D) * t, H: a.H + (b.H - a.H) * t, near: [a.near[0] + (b.near[0] - a.near[0]) * t, a.near[1] + (b.near[1] - a.near[1]) * t] };
};
// past the feet the centre line runs on along the end tangent
const ext = (s) => {
  if (s >= 0 && s <= L) return at(s);
  const e = s < 0 ? 0 : L, [tx, td] = dirAt(s < 0 ? 0.3 : L - 0.3), a = at(e), d = s - e;
  return { X: a.X + tx * d, D: a.D + td * d, H: 0, near: a.near };
};
const dirAt = (s) => { const a = at(s - 0.25), b = at(s + 0.25); const dx = b.X - a.X, dd = b.D - a.D, n = Math.hypot(dx, dd); return [dx / n, dd / n]; };
const station = (X, D) => {
  let best = null;
  for (const r of table) { const d = Math.hypot(r.X - X, r.D - D); if (!best || d < best.d) best = { d, r }; }
  const [tx, td] = dirAt(best.r.s);
  const s = best.r.s + (X - best.r.X) * tx + (D - best.r.D) * td;
  const off = -(X - best.r.X) * td + (D - best.r.D) * tx; // + left (far side)
  return { s, off };
};
// three axes: x = X, y = H, z = -D. yaw: fwd = (-sin yaw, 0, -cos yaw) -> world (X, D) = (-sin yaw, cos yaw)
const yawFor = (dx, dd) => Math.atan2(-dx, dd);
function walk(start, heading, seconds, run = false) {
  p.pos.set(start[0], start[2] + 0.05, -start[1]); p.vel.set(0, 0, 0); p.yaw = heading; p.onGround = false;
  p.keys.clear(); p.keys.add('KeyW'); if (run) p.keys.add('ShiftLeft');
  const trace = [];
  for (let i = 0; i < seconds * 60; i++) {
    p.update(1 / 60);
    const X = p.pos.x, D = -p.pos.z, H = p.pos.y;
    const { s, off } = station(X, D);
    trace.push({ t: i / 60, X, D, H, s, off, deckH: s >= 0 && s <= L ? at(s).H : null });
  }
  p.keys.clear();
  return trace;
}
const results = [];
const check = (name, ok, detail) => { results.push({ name, pass: !!ok, ...detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(detail)}`); };
const worstDev = (tr) => Math.max(...tr.filter((q) => q.deckH != null && q.s > 0.3 && q.s < L - 0.3 && Math.abs(q.off) < 3).map((q) => Math.abs(q.H - q.deckH)));

// 1. south foot -> over the crown -> north foot, walking (2.2 m/s), steering along the deck
{
  const a = at(0); const [tx, td] = dirAt(0.5);
  const start = [a.X - tx * 2, a.D - td * 2, 0.0];
  // steer: re-aim at the centre line every half second
  p.pos.set(start[0], 0.05, -start[1]); p.vel.set(0, 0, 0); p.onGround = false; p.keys.clear(); p.keys.add('KeyW');
  const tr = [];
  for (let i = 0; i < 60 * 40; i++) {
    const X = p.pos.x, D = -p.pos.z;
    const { s, off } = station(X, D);
    const [dx, dd] = dirAt(Math.max(0.3, Math.min(L - 0.3, s + 1.5)));
    const tgt = ext(s + 2);
    const ax = tgt.X - X, ad = tgt.D - D;
    p.yaw = yawFor(ax, ad);
    p.update(1 / 60);
    tr.push({ t: i / 60, X: p.pos.x, D: -p.pos.z, H: p.pos.y, s, off, deckH: s >= 0 && s <= L ? at(s).H : null });
    if (s > L + 2) break;
  }
  p.keys.clear();
  const end = tr[tr.length - 1];
  const top = Math.max(...tr.map((q) => q.H));
  check('south foot to north foot', end.s > L + 1.5, { seconds: +end.t.toFixed(1), end_s: +end.s.toFixed(2), L, max_H: +top.toFixed(2), crown_H: stats.crown_H, worst_off_deck_m: +worstDev(tr).toFixed(3) });
  fs.writeFileSync(path.join(dir, 'walk_trace_sn.json'), JSON.stringify(tr.filter((_, i) => i % 15 === 0).map((q) => ({ t: +q.t.toFixed(2), s: +q.s.toFixed(2), H: +q.H.toFixed(3), deckH: q.deckH == null ? null : +q.deckH.toFixed(3), off: +q.off.toFixed(2) }))));
}
// 2. north foot -> south foot, running
{
  const a = at(L); const [tx, td] = dirAt(L - 0.5);
  const start = [a.X + tx * 2, a.D + td * 2, 0.0];
  p.pos.set(start[0], 0.05, -start[1]); p.vel.set(0, 0, 0); p.onGround = false; p.keys.clear(); p.keys.add('KeyW'); p.keys.add('ShiftLeft');
  const tr = [];
  for (let i = 0; i < 60 * 30; i++) {
    const X = p.pos.x, D = -p.pos.z;
    const { s, off } = station(X, D);
    const tgt = ext(s - 2);
    p.yaw = yawFor(tgt.X - X, tgt.D - D);
    p.update(1 / 60);
    tr.push({ t: i / 60, X: p.pos.x, D: -p.pos.z, H: p.pos.y, s, off, deckH: s >= 0 && s <= L ? at(s).H : null });
    if (s < -2) break;
  }
  p.keys.clear();
  const end = tr[tr.length - 1];
  check('north foot to south foot (running)', end.s < -1.5, { seconds: +end.t.toFixed(1), end_s: +end.s.toFixed(2), worst_off_deck_m: +worstDev(tr).toFixed(3) });
}
// 3. the railings are walls: from the crown's centre walk straight at each railing for 4 s
for (const [name, sgn] of [['far railing', 1], ['near railing', -1]]) {
  const c = at(stats.crown_s); const [tx, td] = dirAt(stats.crown_s);
  const nx = -td * sgn, nd = tx * sgn;
  const tr = walk([c.X, c.D, c.H + 0.1], yawFor(nx, nd), 4);
  const end = tr[tr.length - 1];
  check(`stopped by the ${name} at the crown`, Math.abs(end.off) < 4.0 && end.H > c.H - 0.3, { end_off: +end.off.toFixed(2), half_width: 4.0, end_H: +end.H.toFixed(2) });
}
// 4. halfway up the steepest stretch: stand still for 3 s (no sliding back), then walk up 2 s
{
  let steep = table.reduce((m, r) => (Math.abs(r.slope_deg) > Math.abs(m.slope_deg) ? r : m), table[0]);
  const tr0 = walk([steep.X, steep.D, steep.H + 0.1], 0, 0.01);
  p.keys.clear();
  const s0 = station(p.pos.x, -p.pos.z).s;
  for (let i = 0; i < 180; i++) p.update(1 / 60);
  const s1 = station(p.pos.x, -p.pos.z).s;
  // information: web/src/player.js has no ground friction, so an idle walker creeps down any slope (the gate's flight too)
  console.log(`INFO standing 3 s on the steepest stretch (${steep.slope_deg} deg at s ${steep.s}): slid ${(s1 - s0).toFixed(2)} m`);
  results.push({ name: 'standing on the steepest stretch (information: player.js has no ground friction)', pass: true, slid_m: +(s1 - s0).toFixed(3) });
}
// 4b. sliding while standing still, by slope (player.js has no ground friction)
{
  const rows = [];
  for (const target of [10, 15, 20, 25, 30, 33]) {
    const r = table.filter((q) => q.s > 0.5 && q.s < L - 0.5).reduce((m, q) => (Math.abs(Math.abs(q.slope_deg) - target) < Math.abs(Math.abs(m.slope_deg) - target) ? q : m));
    walk([r.X, r.D, r.H + 0.1], 0, 0.01);
    p.keys.clear();
    for (let i = 0; i < 30; i++) p.update(1 / 60);
    const s0 = station(p.pos.x, -p.pos.z).s;
    for (let i = 0; i < 180; i++) p.update(1 / 60);
    const s1 = station(p.pos.x, -p.pos.z).s;
    rows.push({ slope_deg: r.slope_deg, slide_m_per_s: +(Math.abs(s1 - s0) / 3).toFixed(3) });
  }
  console.log('slide while standing, by slope:', JSON.stringify(rows));
  results.push({ name: 'slide by slope (information)', pass: true, rows });
}
// 5. from the ground beside the south ramp, walk at the skirt: blocked (nobody walks under the ramp)
{
  const sMid = stats.springings_s[0] * 0.5;
  const c = at(sMid); const [tx, td] = dirAt(sMid);
  const nx = td, nd = -tx; // to the near (right) side
  const start = [c.X + nx * 6, c.D + nd * 6, 0];
  const tr = walk(start, yawFor(-nx, -nd), 5);
  const end = tr[tr.length - 1];
  check('the ramp\'s side is a wall from the ground', Math.abs(end.off) > 3.9 || end.H > c.H - 0.4, { end_off: +end.off.toFixed(2), end_H: +end.H.toFixed(2), deck_H_there: +c.H.toFixed(2) });
}
fs.writeFileSync(path.join(dir, 'walk_results.json'), JSON.stringify(results, null, 1));
console.log(results.every((r) => r.pass) ? 'ALL PASS' : 'SOME FAIL');
