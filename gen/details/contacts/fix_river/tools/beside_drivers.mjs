// fix-river: where the S1 charcoal drivers stand in their donkeys' frames on the current dump, and their palm contact
const d = (await import('/home/ran/3d_director/qingming/gen/details/placements.json', { with: { type: 'json' } })).default;
const r = (await import('/home/ran/3d_director/qingming/gen/details/contacts/countryside.json', { with: { type: 'json' } })).default;
const g = (id) => d.people.find((p) => p.section === 'countryside' && p.id === id);
for (const [dr, an] of [['charcoal_driver_36797', 'donkey_charcoal_36745'], ['charcoal_driver_36250', 'donkey_charcoal_36323']]) {
  const a = g(dr), b = g(an);
  const dx = a.root[0] - b.root[0], dz = a.root[2] - b.root[2], c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  const k = r.results.find((p) => p.id === dr).checks.find((c) => c.class === 'contact');
  console.log(dr, 'local x', (dx * c - dz * s).toFixed(3), 'z', (dx * s + dz * c).toFixed(3), 'dH', (a.root[1] - b.root[1]).toFixed(3), 'yawdiff', ((a.yaw - b.yaw) * 180 / Math.PI).toFixed(1), '| gap_q', k.gap_q, 'pen_q', k.pen_q, 'max', k.max, k.status);
}
