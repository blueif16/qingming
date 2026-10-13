#!/usr/bin/env node
// The fix-boats IK specs (characters/ik_variants.json), their targets taken from the base clips' tracks
// (gen/details/joints/<character>.json, props_<character>.json: the page's root frame, P1 applied):
//   sweep_bar         work_sweep: the hips held 0.08 m behind the root (feet kept), both palms on the sweep's crossbar
//                     line across the figure 0.15 m ahead at 0.85 m (the kit's sweep_bar_h / sweep_crew_in)
//   pole_hold_<char>  pole_boat: the hips frozen as at T (the pole rides the hips), both palms on the pole's axis there
//   fend_up / fend_out  fend_pole: the right hand held in place and turn as at T (the pole rides it: still), the left
//                     palm on the pole's axis there; up T 0.0 (raised 46 deg), out T 4.2 (slanting down ahead, 12 deg)
// Prints the JSON to merge (gen/details/contacts/fix_boats/tools/merge_variants.py does it under the flock).
import fs from 'node:fs';
const QM = '/home/ran/3d_director/qingming';
const rd = (f) => JSON.parse(fs.readFileSync(`${QM}/${f}`, 'utf8'));
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const at = (arr, i) => [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]];
function poleAt(ch, prop, clip, T) {
  const P = rd(`gen/details/joints/props_${ch}.json`).props[prop];
  const c = P.clips[clip], i = Math.round(T * 10);
  const a = at(c.a, i), b = at(c.b, i), d = b.map((x, k) => x - a[k]), L = Math.hypot(...d);
  return { p: a.map(r4), dir: d.map((x) => r4(x / L)), s0: 0, s1: r4(L), r: P.r };
}
const out = {};
out.sweep_bar = { why: 'fix-boats (details pass, contacts): work_sweep with both hands on the sweep\'s crossbar. The kit stands the crew 0.15 m behind the bar (pt_sweep_crew, kit option sweep_crew_in) and puts the bar 0.85 m over their deck (sweep_bar_h): the take\'s palms are at 0.72-0.87 m (median), 0.1-0.5 m behind the bar line, and its hips rock 0.38 m fore and aft. Here the hips are held at z -0.08 (the feet kept where the take plants them) and both palms lie on the bar\'s line across the figure (y 0.85, z 0.15; bar radius 0.035 + the hand\'s half thickness 0.015). Shared by every sweep hand (boatman, inspector).',
  ops: [{ site: 'hips', via: 'hips', to: { z: -0.08 }, keep_soles: true },
    { site: 'palm_L', via: 'arm', to: { line: { p: [0, 0.85, 0.15], dir: [1, 0, 0] }, off: 0.05 } },
    { site: 'palm_R', via: 'arm', to: { line: { p: [0, 0.85, 0.15], dir: [1, 0, 0] }, off: 0.05 } }] };
for (const ch of ['boatman', 'straw_hat']) {
  const T = 0.9, L = poleAt(ch, 'long_pole_low', 'pole_boat', T);
  out[`pole_hold_${ch}`] = { why: `fix-boats: pole_boat with both hands on the pole and the pole still (${ch}). The pole (props.json long_pole_low) is skinned to the hips, which the take turns and bends, so the pole swung through the deck under the man's feet while his palms were 0.14-0.36 m off it. Here the hips are frozen as the take has them at ${T} s (turn and place; the feet kept), so the pole stays as it is then: slanting 65 deg, crossing the deck 0.58 m ahead of the root (the crew stand at the gunwale facing out: tools/crew_solve.mjs), its foot 2.5 m under the deck. Both palms lie on its axis (radius ${L.r} + 0.015), sliding along it as the take pushes down.`,
    ops: [{ freeze: 'Hips', t: T }, { site: 'hips', via: 'hips', to: { hold_t: T }, keep_soles: true },
      { site: 'palm_R', via: 'arm', to: { line: { p: L.p, dir: L.dir, s0: 0.3, s1: L.s1 - 0.3 }, off: r4(L.r + 0.015) } },
      { site: 'palm_L', via: 'arm', to: { line: { p: L.p, dir: L.dir, s0: 0.3, s1: L.s1 - 0.3 }, off: r4(L.r + 0.015) } }] };
}
for (const [name, T, how] of [['fend_up', 3.8, 'raised 47 deg up to his right and a little ahead (the raised end 3.1 m high): pushing a pole up at an arch or a high stern (the take holds a raised pole in both hands only so; the figure is turned so it points at what it fends)'], ['fend_out', 4.2, 'slanting 12 deg down ahead (the end in front 0.7 m over the deck, 2 m out): pushing off another boat\'s side or stern']]) {
  const L = poleAt('boatman', 'long_pole_mid', 'fend_pole', T);
  out[name] = { why: `fix-boats: fend_pole held still, ${how}. The pole (long_pole_mid) is skinned to the right hand, which the take swings from overhead to waist height (the pole swept through the deck and the man) while the left palm was 0.34 m off it. Here the right hand is held in place and turn as the take has it at ${T} s (frame Armature: still in the root frame), so the pole stays as it is then, and the left palm lies on its axis (radius ${L.r} + 0.015). The figure is turned and placed so the forward end meets what it fends (tools/crew_solve.mjs, rule reach).`,
    ops: [{ site: 'palm_R', via: 'arm', frame: 'Armature', to: { hold_t: T } },
      { site: 'palm_L', via: 'arm', to: { line: { p: L.p, dir: L.dir, s0: 0.3, s1: L.s1 - 0.3 }, off: r4(L.r + 0.015) } }] };
}
console.log(JSON.stringify(out, null, 1));
