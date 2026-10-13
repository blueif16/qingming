const t = window.__test;
await t.goto(args.cx, args.cd);
await new Promise(r => setTimeout(r, 1500));
const P = t.people;
const walk = new Set(P.walkers.map(a => a.p.id));
return P.all.map(p => {
  const q = p.root.position, b = p.body;
  let circ;
  if (!b) circ = [[+q.x.toFixed(2), +(-q.z).toFixed(2), 0.26]];
  else { const fx = Math.sin(p.root.rotation.y), fz = Math.cos(p.root.rotation.y); circ = b.along.map(s => [+(q.x + fx * s).toFixed(2), +(-(q.z + fz * s)).toFixed(2), +b.r.toFixed(2)]); }
  return { id: p.id, X: +q.x.toFixed(2), D: +(-q.z).toFixed(2), H: +q.y.toFixed(2), w: walk.has(p.id) ? 1 : 0, c: circ, vis: p.root.visible };
});
