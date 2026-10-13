// fix-river: scan a beside-walker's place across (x) and along (z) its animal on the real ground and check his contact on the
// current dump: node beside_gapscan.mjs <section> <walker> <animal>
// for a walker beside a walking animal: move him across the animal (its frame) on the real ground and check his contact
import { setup, checkPerson } from '/home/ran/3d_director/qingming/tools/contact_check.mjs';
const [section, dr, an] = process.argv.slice(2);
const ctx = setup({});
const a = ctx.dump.people.find((p) => p.section === section && p.id === dr);
const b = ctx.dump.people.find((p) => p.section === section && p.id === an);
const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
for (let x = -0.38; x >= -0.45; x -= 0.01) {
  for (const z of [-0.15, -0.1, -0.05, 0, 0.05, 0.1]) {
    // animal frame -> page: X = bx + x c + z s, Z = bz - x s + z c
    const X = b.root[0] + x * c + z * s, Z = b.root[2] - x * s + z * c;
    const H = ctx.pred.ground(X, -Z, (a.map?.H || 0) + 1.2).y ?? ctx.pred.ground(X, -Z, 1.2);
    const res = checkPerson({ ...a, root: [X, typeof H === 'number' ? H : a.root[1], Z] });
    const k = res.checks.find((q) => q.class === 'contact');
    console.log(x.toFixed(2), z.toFixed(2), 'dH', ((typeof H === 'number' ? H : a.root[1]) - b.root[1]).toFixed(3), 'gap_q', k.gap_q, 'pen_q', k.pen_q, k.status);
  }
}
