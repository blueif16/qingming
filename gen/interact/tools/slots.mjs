#!/usr/bin/env node
// gen/interact/slots.json for the lead's web/src/interact.js (interactions round, 2026-10-13; brief
// gen/interact/brief_clips.md "Output"): where the player's root stands and which clip it plays at each spot, from what
// gen/interact/tools/clips_check.mjs measured (gen/interact/clips_check.json: the moat lines and free ranges, the
// drum spots), gen/interact/crown_slots.json (gen/interact/tools/crown_ik.mjs) and gen/interact/drum_tip.json.
//   node gen/interact/tools/slots.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(QM, p), 'utf8'));
const r3 = (x) => Math.round(x * 1000) / 1000;
const ck = rd('gen/interact/clips_check.json');
const crown = rd('gen/interact/crown_slots.json');
const drum = rd('gen/interact/drum_tip.json').characters;
const PLAY = ['official', 'scholar', 'monk', 'woman', 'child', 'soldier', 'porter', 'sightseer'];
const DEFAULT = 'official';
const status = (slot, c) => ck.results.filter((r) => r.slot.replace(/@.*/, '') === slot && r.character === c).every((r) => r.status === 'PASS') ? 'PASS' : 'FAIL';

const rails = Object.entries(ck.moat).map(([id, m]) => {
  const sign = id === 'near' ? 1 : -1;
  const lineOf = (c) => { const D = r3(m.rail_centre_D + sign * m.dist_by_character[c]); return [[0.3, D], [12.13, D]]; };
  return {
    id, facing_deg: m.facing_deg, clip: 'lean_chin~moat_rail', rail_centre_D: m.rail_centre_D, rail_top_H: m.top_H,
    line: lineOf(DEFAULT),
    dist_from_rail_centre: m.dist_by_character,
    lines: Object.fromEntries(PLAY.map((c) => [c, lineOf(c)])),
    free: m.free,
    free_by_character: m.free_by_character,
    checked_at_X: m.points,
  };
});
const slots = ['player_crown_a', 'player_crown_b'].filter((s) => crown[s]).map((s) => {
  const a = crown[s], ch = crown[`${s}_child`];
  return {
    id: s, X: a.X, D: a.D, H: a.H, ramp_H: a.ramp_H, facing_deg: a.facing_deg, clip: `lean_over~${s}`,
    spec_by_character: Object.fromEntries(PLAY.filter((c) => c !== 'child').map((c) => [c, a.by_character?.[c] || s])),
    child: ch ? { X: ch.X, D: ch.D, H: ch.H, ramp_H: ch.ramp_H, facing_deg: ch.facing_deg, clip: `look~${s}_child` } : null,
    rail_stations: { s: a.s, n: a.n },
  };
});
const d0 = drum[DEFAULT];
const sides = Object.fromEntries(Object.entries(ck.drum.spots || {}).map(([side, sp]) => [side, {
  facing_deg: sp.facing_deg, face_X: sp.face_X,
  spot: sp.shared || null,
  spots: Object.fromEntries(Object.entries(sp.by_character).map(([c, v]) => [c, { X: v.X, D: v.D, H: v.H }])),
  spread_m: sp.spread_m,
}]));
const out = {
  about: 'The player\'s join-the-pose spots (interactions round, 2026-10-13; gen/interact/brief_clips.md; written by gen/interact/tools/slots.mjs from gen/interact/clips_check.json, crown_slots.json and drum_tip.json; checks: gen/interact/clips_check.json). Map frame: X east, D north, H up (the page: x = X, y = H, z = -D); facing_deg as people.json (0 = +X, 90 = +D). A `line` / `lines` entry is where the ROOT stands (between the feet as people.js places a figure). Every clip name is the same on all 8 playable characters (official, scholar, monk, woman, child, soldier, porter, sightseer) except the child, which has its own (`child`). H is the root\'s own height, held as people.js holds a root_h figure, NOT the ground hook: the moat deck\'s planks lie at -0.023..+0.025, and the crown\'s visible treads sit under the smooth hidden ramp the player walks on (ramp_H).',
  default_avatar: DEFAULT,
  moat_bridge: {
    section: 'gate', map_id: 'S5.str.moat_bridge', H: ck.moat.near.root_H,
    H_note: `hold the root at H ${ck.moat.near.root_H} along both rails (the deck's nominal top; the rail's top is 1.075 over it): the clip puts the elbows on the rail there; grounded on a plank instead, they ride up to 2.5 cm off it or into it`,
    rails,
    note: 'The rails as BUILT are straight (blender/gate_scene.py: near centre D 0.12, far centre D 7.88), not the map\'s slanted far line (layout lines.rail_far 8.0 -> 7.77), so each character\'s standing D is one value along a rail. Each character stands at its own distance from the rail (its take\'s elbows reach forward by its own size; searched for the elbows nearest the rail with nothing through it, the feet clear of the bottom rail): `lines` per character, `line` for the default avatar. `free`: the X ranges where the root is at least 0.6 m from every painted watcher (for every character\'s line) and the body on the deck. `free_by_character`: within those, where that character also has nothing in a post, a post cap or through the rail (its hands come near the posts every 1.776 m): use these for the avatar in play.',
    child: 'look~moat_rail_child',
    child_note: 'The child (1.15 m) cannot rest its elbows on a 1.075 m rail: it holds the top rail with both hands up and looks about (look~moat_rail_child, characters/ik_variants.json moat_rail_child), standing on the child line (lines.child).',
  },
  crown: {
    section: 'rainbow_bridge', map_id: 'S3.str.rainbow_bridge',
    slots,
    child: slots.map((s) => s.child?.clip).filter(Boolean),
    note: 'The downstream rail is full near the crown (s 4.25 in the rail frame of gen/interact/tools/crown_ik.mjs): the painted rail figures stand 0.46-0.68 m apart from s -0.6 to s 8.23, so no spot within 0.6 m of none exists there. The nearest free spots: player_crown_a 4.75 m down the NE ramp (between deck_rail_leaner_19715 and deck_stooping_hat_19765), player_crown_b 5.6 m down the SW ramp (beyond man_reaching_with_stick_18930). H is the lower of the two treads the feet take (the root stands at a riser, one foot on each tread); the player walks on the smooth hidden ramp ramp_H, 0.1-0.13 m over it: set the root to H while the clip plays. The child stands on one tread (child.H), its hands up on the rail.',
  },
  storyteller: { section: 'inner_city', view: [-64, 7], clip: 'crane', note: 'No contact: the player stands in the ring and plays crane (every playable character has it).' },
  drum: {
    section: 'gate', map_id: 'S5.prop.tower_drum_6898', clip: 'strike_drum', length_s: d0.duration, hit_s: d0.hit_s,
    hit_s_by_character: Object.fromEntries(PLAY.map((c) => [c, drum[c]?.hit_s])), prop: 'drumstick',
    prop_note: 'prop_drumstick (characters/props.json, bound in strike_drum): show it while strike_drum plays (people.json "props": ["drumstick"]), hide it otherwise.',
    drum: { centre: [-18.77, 5.93, 13.36], radius: 0.62, axis: 'X', faces_X: { east: -18.40, west: -19.14 }, floor_H: 12.06 },
    sides,
    note: 'Each spot puts the stick\'s tip on the drum\'s face (the rope rim\'s cap, the outer visible disc) at hit_s; a spot per character where they differ by more than 5 cm (their reach differs), `spot` when one serves all. The swing comes down from beside the ear: let the clip play from its start.',
  },
};
fs.writeFileSync(path.join(QM, 'gen/interact/slots.json'), JSON.stringify(out, null, 1) + '\n');
console.log('gen/interact/slots.json', JSON.stringify({ moat: rails.map((r) => [r.id, r.free.length]), crown: slots.map((s) => s.id), drum: Object.keys(sides) }));
