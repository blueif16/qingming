const t = window.__test;
await t.goto(args.cx, args.cd);
await new Promise(r => setTimeout(r, 500));
const V = (v) => !v ? null : (v.isVector3 ? [+v.x.toFixed(2), +(-v.z).toFixed(2), +v.y.toFixed(2)] : (Array.isArray(v) ? v.map(x => typeof x === "number" ? +x.toFixed(2) : V(x)) : String(v)));
const B = t.boats;
return B.list.map(b => ({ id: b.id, kind: b.info?.kind, motion: b.info?.motion, under: b.under, run: b.run, heading: b.heading, deck_z: b.info?.deck_z, roof_z: b.info?.roof_z, loa: b.info?.loa, lw: b.info?.lw,
  pos: V(b.restPos), crew: b.crew.length,
  contacts: b.contacts.map(c => ({ piece: c.piece, other: c.other ? c.other.id : null, plank: !!c.plank, from: V(c.from), to: V(c.to), len: c.len })) }));
