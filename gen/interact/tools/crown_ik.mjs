#!/usr/bin/env node
// Player slots on the Rainbow Bridge's downstream rail (interactions round, 2026-10-13; brief gen/interact/brief_clips.md):
// one SHARED IK spec per slot (characters/ik_variants.json "player_crown_a" / "player_crown_b"), solved as
// gen/details/contacts/fix_bridge/tools/rail_ik.mjs solved the painted lean_over watchers (--mode palms_top --feet
// --steady --chest-forward 0.06), but in a character-free form, so one spec serves every playable adult:
//   - the slot's root stands on the LOWER of the two treads its feet take (root_h), at a riser, so each foot is centred
//     on its own tread;
//   - both soles pinned by leg IK: x +-FOOT_X along the rail (each on its tread), y = its tread's top over the root
//     (the lower foot at 0, so the variant's own sole_m comes out as its base's: no shift to undo);
//   - the chest held at x CHEST_X (+ a per-slot 0.1-0.3 mm sign: two variants of one character must not share a hips
//     array), z CHEST_Z (lean_over's adult median chest z ~0.0 + rail_ik's --chest-forward 0.06), the hips moving under it;
//   - each palm laid on the TOP of the top rail where it passes the hand (x PALM_L / PALM_R along the rail), INSET in
//     from the rail's centre line (the bridge's hidden railing wall) towards the body, OFF over its top face; the
//     railing follows the ramp, so each hand rests at its own height; elbow "down".
// The child (1.15 m) gets its own spec "<slot>_child" on its base clip `look` (a calm stand, the head looking about):
// it stands on ONE tread (both soles at 0, x +-0.10), hands closer (+-0.12) on the rail top, no chest op.
//   node gen/interact/tools/crown_ik.mjs <spec name> --s <station> --n <metres from the wall> [--facing 319] [--child]
//        [--sign 0.0002] [--write]        (--write under flock /tmp/qingming_charbuild.lock)
// Rail frame (measured, gen/interact/clips_progress.md): origin O on the railing wall, U along it (NE, uphill to the
// crown at s 4.25), N across it towards the deck; the wall lies on n 0.002-0.004 from s -8 to s 14.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { World } from '../../../tools/lib/owners_index.mjs';
import { driftExclusions } from '../../../tools/place_predict.mjs';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const name = args[0];
const child = args.includes('--child');
const s0 = +opt('--s'), n0 = +opt('--n', 0.32), facing = +opt('--facing', 319), sign = +opt('--sign', 0.0002);
if (!name || !Number.isFinite(s0)) { console.log('usage: crown_ik.mjs <spec> --s <station> --n <m> [--facing 319] [--child] [--write]'); process.exit(1); }
export const RAIL = { O: [134.94, 14.01], U: [0.6603, 0.7510], N: [-0.7510, 0.6603] };
const FOOT_X = child ? 0.10 : 0.15, PALM_L = child ? 0.10 : 0.24, PALM_R = child ? -0.10 : -0.21;
// --chest-y / --chest-z: a character whose own lean_over can't take the shared spec (--for <character>: the spec is
// then that character's own, e.g. "player_crown_a_official", under the same clip name lean_over~player_crown_a)
const CHEST_X = 0.02, CHEST_Z = +opt('--chest-z', 0.06), CHEST_Y = opt('--chest-y') === undefined ? null : +opt('--chest-y'), INSET = 0.035, OFF = 0.015;
const FOR = opt('--for');
const r3 = (x) => Math.round(x * 1000) / 1000;
const BR = 'S3.str.rainbow_bridge';
const w = World.load(['rainbow_bridge'], { exclude: driftExclusions() });
const oName = (t) => w.owners[w.owner[t]];
const hid = (t) => w.hiddenMat[w.mat[t]];
const T = w.T;
const normalZ = (t) => { const o = t * 9, ux = T[o + 3] - T[o], uy = T[o + 4] - T[o + 1], uz = T[o + 5] - T[o + 2], vx = T[o + 6] - T[o], vy = T[o + 7] - T[o + 1], vz = T[o + 8] - T[o + 2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], L = Math.hypot(...n) || 1; return n[2] / L; };
const { O, U, N } = RAIL;
const at = (s, n) => [O[0] + U[0] * s + N[0] * n, O[1] + U[1] * s + N[1] * n];
const ramp = (X, D) => w.vertical(X, D, (t) => hid(t) && oName(t) === BR && Math.abs(normalZ(t)) > 0.5).map((v) => v.h).sort((a, b) => b - a)[0];
// a sole's support, as contact_check reads a foot: the highest visible level surface of 5 points 5 cm round it, near the ramp
function tread(X, D) {
  const rh = ramp(X, D);
  let top = null;
  for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) {
    for (const v of w.vertical(X + dx, D + dd, (t) => !hid(t) && normalZ(t) > 0.95)) if (Math.abs(v.h - rh) < 0.25 && (top === null || v.h > top)) top = v.h;
  }
  return top;
}
// the top rail's top face at a plan point INSET in from the wall (as rail_ik: the highest visible bridge face with
// normal up, 1.0-1.2 m over the hidden ramp 5 cm further in)
function railTop(sp) {
  const [X, D] = at(sp, INSET), [Xi, Di] = at(sp, INSET + 0.05);
  const zr = ramp(Xi, Di);
  let top = null;
  for (const [dx, dd] of [[0, 0], [0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02]]) {
    for (const v of w.vertical(X + dx, D + dd, (t) => oName(t) === BR && !hid(t) && normalZ(t) > 0.5)) if (v.h > zr + 1.0 && v.h < zr + 1.2 && (top === null || v.h > top)) top = v.h;
  }
  return { X, D, top, ramp: zr };
}
const yaw = ((facing + 90) * Math.PI) / 180, c = Math.cos(yaw), sn = Math.sin(yaw);
const left = [c, sn], fwd = [sn, -c];           // the figure's left and forward in the map (tools/contact_check.mjs toMapFn)
const along = left[0] * U[0] + left[1] * U[1];   // +1: its left is up the station
const [X0, D0] = at(s0, n0);
// the feet: their treads; the root on the lower one
const feet = [['sole_L', FOOT_X], ['sole_R', -FOOT_X]].map(([site, x]) => { const P = [X0 + left[0] * x, D0 + left[1] * x]; return { site, x, P, top: tread(...P) }; });
if (feet.some((f) => f.top === null)) { console.log('no tread under a foot', feet); process.exit(1); }
const H0 = Math.min(...feet.map((f) => f.top));
const toRoot = ([X, D, H]) => { const dx = X - X0, dz = -D + D0, dy = H - H0; return [dx * c - dz * sn, dy, dx * sn + dz * c]; };
const ops = [];
const lines = [];
if (!child) {
  ops.push({ site: 'chest_front', via: 'hips', to: { x: Math.round((CHEST_X + sign) * 1e4) / 1e4, ...(CHEST_Y !== null ? { y: CHEST_Y } : {}), z: CHEST_Z }, keep_soles: true });
  lines.push(`chest held at x ${CHEST_X + sign}${CHEST_Y !== null ? ', y ' + CHEST_Y : ''}, z ${CHEST_Z}`);
}
for (const [site, x] of [['palm_L', PALM_L], ['palm_R', PALM_R]]) {
  const sp = s0 + x * along;
  const r = railTop(sp);
  if (r.top === null) { console.log(`${site}: no rail top at s ${sp}`); process.exit(1); }
  const q = toRoot([r.X, r.D, r.top + OFF]).map(r3);
  // the child's hands reach UP to the rail: a hand kept turned as the clip hangs it ("keep_world") puts the palm under
  // the wrist and out of reach; "follow" carries it on along the forearm
  ops.push({ site, via: 'arm', to: { point: q }, elbow: 'down', ...(child ? { hand: 'follow' } : {}) });
  lines.push(`${site}: s ${r3(sp)}, the top rail's top ${r3(r.top)} (ramp ${r3(r.ramp)}, ${r3(r.top - r.ramp)} over it) -> root frame ${JSON.stringify(q)}`);
}
// the child reaches the rail only on its downhill side: the rail rises 0.11 m over its two hands on the 30 deg ramp, and
// the uphill hand fell 9 cm short at full stretch (build 3); it holds on with the lower hand, the other as the clip has it
let oneHand = null;
if (child) {
  const pa = ops.filter((o) => o.via === 'arm');
  const hi = pa.sort((a, b) => b.to.point[1] - a.to.point[1])[0];
  ops.splice(ops.indexOf(hi), 1);
  oneHand = pa.find((o) => o !== hi).site;
  lines.push(`${hi.site}: left as the clip has it (the rail there ${hi.to.point[1]} over the root: out of the child's reach)`);
}
for (const f of feet) {
  const y = r3(f.top - H0);
  ops.push({ site: f.site, via: 'leg', to: { x: f.x, y } });
  lines.push(`${f.site}: x ${f.x} on the tread ${r3(f.top)} (${y} over the root)`);
}
const out = { spec: name, ...(oneHand ? { hand: oneHand } : {}), X: r3(X0), D: r3(D0), H: r3(H0), ramp_H: r3(ramp(X0, D0)), facing_deg: facing, s: s0, n: n0, ops };
console.log(`${name}: root X ${out.X} D ${out.D} H ${out.H} (the hidden ramp under it ${out.ramp_H}), facing ${facing}, s ${s0} n ${n0}\n  ${lines.join('\n  ')}`);
if (args.includes('--write')) {
  const vf = path.join(QM, 'characters/ik_variants.json');
  const V = JSON.parse(fs.readFileSync(vf, 'utf8'));
  const why = child
    ? `look for the player's child avatar at the Rainbow Bridge crown slot ${name.replace(/_child$/, '')} (interactions round, 2026-10-13; gen/interact/slots.json): the child (1.15 m) can't lean its elbows or palms down on a rail 1.10 m over the ramp, so it holds the top rail with its downhill hand (${oneHand}) up, looking about: root X ${out.X}, D ${out.D}, H ${out.H} (on one tread), facing ${facing}; that palm laid on the top of the top rail (${INSET} m in from its centre line, ${OFF} m over it) where it passes the hand (x ${oneHand === 'palm_L' ? PALM_L : PALM_R}), elbow down, the hand carried on along its forearm (hand "follow": reaching up, a hanging hand can't land); the uphill hand as the clip has it (the rail rises 0.11 m between the hands on the 30 deg ramp: out of reach); both soles pinned on the tread at x +-${FOOT_X} (leg IK) (gen/interact/tools/crown_ik.mjs)`
    : `lean_over for the player at the Rainbow Bridge's downstream rail, slot ${name.replace(/_[a-z]+$/, (m) => (FOR ? '' : m))} (interactions round, 2026-10-13; gen/interact/slots.json): ${FOR ? `the ${FOR}'s own spec (its lean_over can't take the shared one: ${opt('--why', '')})` : 'one spec for every playable adult'}, solved as fix_bridge/tools/rail_ik.mjs solved the painted watchers but free of any one body: root X ${out.X}, D ${out.D}, H ${out.H} (the lower tread, at a riser), facing ${facing}; the chest held at x ${CHEST_X}${CHEST_Y !== null ? ', y ' + CHEST_Y : ''}, z ${CHEST_Z} (no forward sway: the hips move under it); both palms laid on the top of the top rail (${INSET} m in from its centre line, ${OFF} m over it) where it passes each hand (x ${PALM_L} / ${PALM_R}: the rail follows the ramp, each hand at its own height), elbows down; both soles pinned by leg IK, each centred on its own tread (x +-${FOOT_X}; the lower at 0, the upper ${r3(Math.max(...feet.map((f) => f.top)) - H0)} up) (gen/interact/tools/crown_ik.mjs)`;
  V[name] = { why, ops };
  fs.writeFileSync(vf, JSON.stringify(V, null, 1) + '\n');
  const sf = path.join(QM, 'gen/interact/crown_slots.json');
  const S = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : {};
  if (!FOR) S[name] = out; else { (S[name.replace(`_${FOR}`, '')].by_character ||= {})[FOR] = name; }
  fs.writeFileSync(sf, JSON.stringify(S, null, 1) + '\n');
  console.log(`wrote characters/ik_variants.json "${name}" and gen/interact/crown_slots.json`);
}
