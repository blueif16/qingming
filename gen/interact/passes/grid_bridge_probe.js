// Walkability grid round the Rainbow Bridge's south-west (left-hand) foot, S3 (2026-10-13, bridge pass helper).
// Run: tools/chrome_slot.sh node gen/interact/tools/probe.mjs "http://127.0.0.1:5190/world.html?start=0&sections=rainbow_bridge&window=0" gen/interact/passes/grid_bridge_probe.js
// Two maps, X east in 0.25 m columns, D north in 0.25 m rows:
//  ground: the walkable surface found at bank level (a hit with -0.45 <= y <= 0.6 under (X, D); several rays down
//          from 8 m, so roofs, canopies and the deck above don't hide the ground; a cell with no hit at all is blank,
//          never air as in grid_tower_probe.js);
//  deck:   inside the ramp's collider outline (bridge_plan.json), the highest up-facing surface the capsule fits on.
// Legend: . capsule (r 0.3, h 1.75) fits, nobody there | o fits the geometry but a standing figure's or animal's body
// (people.js circles, 0.26 m a person; the player's 0.3 on top) pushes it | w only a walker's body (walkers move:
// where they are at the probe) | + geometry pushes 2-10 cm | # geometry blocks | ^ only a surface above 0.6 m (a roof,
// a table, the deck) | ~ only a surface below -0.45 m (the river's bed) | blank: no surface.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const P = t.player, PE = t.people, THREE = t.THREE;
const A = typeof __args !== 'undefined' ? __args : {}; // optional: prepend `const __args = {...};` to the snippet
const X0 = A.X0 ?? 112, X1 = A.X1 ?? 142, D0 = A.D0 ?? -4.5, D1 = A.D1 ?? 18, step = 0.25;
await t.goto(A.gx ?? (X0 + X1) / 2, A.gd ?? 6); await wait(A.settle ?? 6000);
// the south ramp's walking surface, s -0.6 .. 10 (bridge_plan.json collider_outline: 0.6 m past the foot, railing to railing)
const POLY = A.poly || [[129.175, 7.456], [136.171, 15.417], [129.973, 20.863], [122.977, 12.902]];
const inPoly = (x, d) => {
  if (!POLY) return false;
  let c = false;
  for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
    const [xi, di] = POLY[i], [xj, dj] = POLY[j];
    if ((di > d) !== (dj > d) && x < ((xj - xi) * (d - di)) / (dj - di) + xi) c = !c;
  }
  return c;
};
const walkerSet = new Set(PE.walkers.map((a) => a.p));
const circles = (p) => {
  const q = p.root.position, b = p.body;
  if (!b) return [[q.x, q.z, 0.26]];
  const fx = Math.sin(p.root.rotation.y), fz = Math.cos(p.root.rotation.y);
  return b.along.map((s) => [q.x + fx * s, q.z + fz * s, b.r]);
};
const bodies = [];
for (const p of PE.all) {
  const q = p.root.position;
  if (q.x < X0 - 3 || q.x > X1 + 3 || -q.z < D0 - 3 || -q.z > D1 + 3) continue;
  for (const [x, z, r] of circles(p)) bodies.push({ x, z, r, y: q.y, walker: walkerSet.has(p), id: p.id });
}
const who = (x, y, z) => {
  let s = 0, w = 0;
  for (const b of bodies) {
    if (Math.abs(b.y - y) > 1.2) continue;
    if (Math.hypot(x - b.x, z - b.z) < 0.3 + b.r) { if (b.walker) w++; else s++; }
  }
  return s ? 'o' : w ? 'w' : '.';
};
const down = new THREE.Vector3(0, -1, 0);
const hitsAt = (X, D) => {
  const out = [];
  let y = 8;
  for (let k = 0; k < 8; k++) {
    const h = P.bvh.raycastFirst(new THREE.Ray(new THREE.Vector3(X, y, -D), down), THREE.DoubleSide);
    if (!h || h.point.y < -3) break;
    const n = h.face?.normal || new THREE.Vector3(0, 1, 0); // the collider is in world space
    out.push({ y: h.point.y, up: Math.abs(n.y) });
    y = h.point.y - 0.03;
  }
  return out;
};
const V = P.pos.constructor;
const fit = (X, D, y) => {
  const p = new V(X, y + 0.03, -D), r = P.resolve(p.clone());
  const moved = Math.hypot(r.x - p.x, r.z - p.z), up = r.y - p.y;
  return moved < 0.02 && up < 0.05 ? 0 : moved < 0.1 ? 1 : 2;
};
const ground = [], deck = [];
for (let D = D1; D >= D0 - 1e-6; D -= step) {
  let g = '', dk = '';
  for (let X = X0; X <= X1 + 1e-6; X += step) {
    const hs = hitsAt(X, D);
    const lv = hs.find((h) => h.y >= -0.45 && h.y <= 0.6 && h.up > 0.5);
    if (lv) {
      const f = fit(X, D, lv.y);
      g += f === 2 ? '#' : f === 1 ? '+' : who(X, lv.y, -D);
    } else g += hs.some((h) => h.y > 0.6) ? '^' : hs.length ? '~' : ' ';
    if (inPoly(X, D)) {
      let c = '#';
      for (const h of hs) {
        if (h.up < 0.5 || h.y < -0.2) continue;
        const f = fit(X, D, h.y);
        if (f === 2) continue;
        c = f === 1 ? '+' : who(X, h.y, -D);
        break;
      }
      dk += c;
    } else dk += ' ';
  }
  ground.push(D.toFixed(2).padStart(6) + ' ' + g);
  deck.push(D.toFixed(2).padStart(6) + ' ' + dk);
}
const near = PE.all.filter((p) => { const q = p.root.position; return q.x >= X0 && q.x <= X1 && -q.z >= D0 && -q.z <= D1; })
  .map((p) => ({ id: p.id, X: +p.root.position.x.toFixed(2), D: +(-p.root.position.z).toFixed(2), H: +p.root.position.y.toFixed(2), walker: walkerSet.has(p), body: p.body ? p.body.r : 0.26 }));
const circ = bodies.filter((b) => b.x >= X0 && b.x <= X1 && -b.z >= D0 && -b.z <= D1)
  .map((b) => ({ id: b.id, X: +b.x.toFixed(2), D: +(-b.z).toFixed(2), H: +b.y.toFixed(2), r: +b.r.toFixed(2), walker: b.walker }));
return { X0, X1, D0, D1, step, ground, deck, near, bodies: circ };
