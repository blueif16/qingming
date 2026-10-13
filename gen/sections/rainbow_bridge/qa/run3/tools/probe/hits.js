const t = window.__test, T = t.THREE, p = t.player;
await t.goto(args.cx, args.cd);
const sec = t.loaded.get(args.sec || 'rainbow_bridge');
const res = [];
const ray = new T.Ray(), dn = new T.Vector3(0, -1, 0), o = new T.Vector3();
for (let D = args.d1; D >= args.d0 - 1e-6; D -= args.step) {
  const row = [];
  for (let X = args.x0; X <= args.x1 + 1e-6; X += args.step) {
    ray.set(o.set(X, 40, -D), dn);
    const m = new Map();
    for (const h of sec.bvh.raycast(ray, T.DoubleSide)) {
      const y = Math.round(h.point.y * 20) / 20, down = h.face && h.face.normal.y < -0.2 ? 1 : 0;
      m.set(y, (m.get(y) || 0) | (down ? 2 : 1));
    }
    row.push([...m.entries()].sort((a, b) => a[0] - b[0]).map(([y, f]) => f === 2 ? -1000 - y : y).map(v => v)); // a face seen only from below (bottom of a solid) as -1000 - y
  }
  res.push(row);
}
return res;
