#!/usr/bin/env node
// The player's "join the pose" clips, checked by numbers (interactions round, 2026-10-13; brief
// gen/interact/brief_clips.md "Checks"): every playable character at every slot, posed by its clip as the page draws it
// (gen/details/joints/<name>.json, tools/joint_tracks.mjs) against the built geometry (tools/contact_check.mjs: the
// same contact rules, stance, body cylinder, head and site checks, run on a synthetic placement through checkPerson),
// plus what the brief asks on top:
//   rail      each contact site (lean_chin: both elbows; lean_over and the child's look variants: both palms) within
//             3 cm of the rail at the rule's hold quantile (80 % of the cycle): gap <= 0.03, penetration >= -0.03;
//             the worst sample is reported too
//   soles     each sole's median height over the visible surface under it (5 points 5 cm round it, as contact_check
//             reads a foot) within -0.04..0.03, both feet (on the crown's stepped deck each foot has its own tread)
//   through   nothing through the rail: no sampled body site (palms, forearms, elbows, chest, belly, head, hips) inside
//             a visible piece of the rail's owner (collide or not: the moat bridge's post caps are nocol) by more than
//             3 cm; contact_check's site_inside and head_inside PASS
//   clear     the slot's root at least 0.6 m (people.js BODY_R 0.26 + player RADIUS 0.3) from every painted person
//             within 1.5 m of its height, and from every walker's path
// Moat rails: each character's standing line from its own lean_chin~moat_rail elbows; the free X ranges (clear of the
// watchers, the feet on the deck, nothing in a post cap for any character); three points along each rail checked.
// Crown: the slots of gen/interact/crown_slots.json (gen/interact/tools/crown_ik.mjs). Storyteller: crane is built
// and stands on flat ground. Drum: gen/interact/drum_tip.json (gen/interact/tools/drum_tip.mjs): the stand spots
// where the stick tip meets the skin at hit_s, the tip there against the skin plane, nothing of the body in the drum.
//   node gen/interact/tools/clips_check.mjs [--no-moat-scan] [--moat-h -0.01]    -> gen/interact/clips_check.json (+ the moat lines,
//        crown and drum spots it measured, for gen/interact/tools/slots.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup, checkPerson, siteTrack } from '../../../tools/contact_check.mjs';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(QM, p), 'utf8'));
const r3 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? x : Math.round(x * 1000) / 1000);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const args = process.argv.slice(2);
const PLAY = ['official', 'scholar', 'monk', 'woman', 'child', 'soldier', 'porter', 'sightseer'];
const ADULTS = PLAY.filter((c) => c !== 'child');
const TOL = 0.03;
// the child's rail variants hold the rail with both palms: checked as a lean_over (palms on a rail, 3 cm)
const RULES = rd('characters/contacts.json');
// (on the crown's 30 deg ramp only its downhill hand reaches the rail: gen/interact/tools/crown_ik.mjs)
const palmsRule = (sites) => ({ posture: 'stand', contacts: sites.map((site) => ({ site, target: 'rail', gap_m: TOL, pen_m: TOL, hold: 0.8 })), why: `the child holds the rail top (${sites.join(', ')}) (gen/interact)` });
RULES.clips['look~moat_rail_child'] = palmsRule(['palm_L', 'palm_R']);
RULES.clips['look~player_crown_a_child'] = palmsRule(['palm_L']);
RULES.clips['look~player_crown_b_child'] = palmsRule(['palm_R']);
const ctx = setup({ rules: RULES });
const { world, pred, dump } = ctx;
const reg = rd('web/public/assets/chars/characters.json');
const tracks = Object.fromEntries(PLAY.map((c) => [c, rd(`gen/details/joints/${c}.json`)]));
const oName = (t) => world.owners[world.owner[t]];
const hidden = (t) => world.hiddenMat[world.mat[t]];

function rec(section, id, model, X, D, H, facing, clip, rootH = null) {
  return { id, section, kind: 'figure', model, character: model, stand_in: null, root: [X, H, -D], yaw: ((facing + 90) * Math.PI) / 180, scale: 1, model_scale: 1,
    clip, do: [[clip, 10]], props: null, load: null, ride: null, carried_by: null, root_h: rootH, map: { H, support: 'bridge deck', map_id: null, group: null } };
}
// the highest visible surface under a foot (5 points 5 cm round it), from 0.25 m over it
function underFoot(p) {
  let best = null;
  for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) {
    for (const v of world.vertical(p[0] + dx, p[1] + dd, (t) => !hidden(t) && !oName(t).includes('|edge:') && !oName(t).endsWith('|water'))) {
      if (v.h <= p[2] + 0.25 && (best === null || v.h > best)) best = v.h;
    }
  }
  return best;
}
// depth of p inside the visible pieces of owner oid (odd crossings of the vertical line above and below), else 0
function insideDepth(p, oid) {
  let up = 0, down = 0;
  for (const v of world.vertical(p[0], p[1], (t) => world.owner[t] === oid && !hidden(t))) { if (v.h > p[2]) up++; else down++; }
  if (!(up % 2 && down % 2)) return 0;
  const n = world.nearest(p, 0.5, (t) => world.owner[t] === oid && !hidden(t));
  return n ? n.d : 0.5;
}
const BODY = ['palm_L', 'palm_R', 'forearm_L', 'forearm_R', 'elbow_L', 'elbow_R', 'chest_front', 'belly', 'head_top', 'hips', 'sole_L', 'sole_R'];
function throughCheck(r, clip, ownerName, step = 2) {
  const oid = world.ownerId.get(ownerName);
  let worst = { depth: 0 };
  for (const site of BODY) {
    const tr = siteTrack(r, clip, site);
    if (!tr) continue;
    for (let i = 0; i < tr.length; i += step) { const d = insideDepth(tr[i], oid); if (d > worst.depth) worst = { depth: d, site, t: i / 10 }; }
  }
  return { owner: ownerName, depth: r3(worst.depth), site: worst.site || null, t: worst.t ?? null, status: worst.depth > TOL ? 'FAIL' : 'PASS' };
}
// each sole's median gap over the surface under it; a foot the clip itself holds up (its median height on flat ground,
// the root frame, over the lower sole's) passes at that height +-3.5 cm (the moat deck's planks lie -0.023..+0.025): a knee bent by the take, not a placement floating it
function solesCheck(r, clip, rootH) {
  const out = {};
  const cl = tracks[r.model].clips[clip];
  let ok = true;
  for (const site of ['sole_L', 'sole_R']) {
    const tr = siteTrack(r, clip, site);
    const g = tr.map((p) => { const u = underFoot(p); return u === null ? null : p[2] - u; }).filter((x) => x !== null);
    const own = cl ? med(cl.sites[site].filter((_, i) => i % 3 === 1)) : 0;
    const m = g.length ? med(g) : null;
    const pass = m !== null && ((m <= 0.03 && m >= -0.04) || (own > 0.03 && Math.abs(m - own) <= 0.035));
    out[site] = { gap: r3(m), clip_own: r3(own), status: pass ? 'PASS' : 'FAIL' };
    ok = ok && pass;
  }
  return { ...out, status: ok ? 'PASS' : 'FAIL' };
}
// people near a spot (plan distance, within 1.5 m of its height), and walkers' paths
const peopleOf = (section) => dump.people.filter((q) => q.kind !== 'animal' && q.kind !== 'rider');
const walkerPaths = {};
for (const s of ['gate', 'rainbow_bridge', 'inner_city']) {
  try { walkerPaths[s] = (rd(`web/public/assets/${s}/people.json`).walkers || []).map((w) => ({ id: w.figure || w.id || null, path: Array.isArray(w.path) && Array.isArray(w.path[0]) ? w.path : null })).filter((w) => w.path); } catch { walkerPaths[s] = []; }
}
const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
function clearance(section, X, D, H) {
  let near = null;
  for (const q of peopleOf(section)) {
    if (Math.abs(q.root[1] - H) > 1.5) continue;
    const d = Math.hypot(q.root[0] - X, -q.root[2] - D);
    if (!near || d < near.d) near = { d, id: q.id, section: q.section };
  }
  let wp = null;
  for (const w of walkerPaths[section] || []) { const d = Math.min(...w.path.slice(1).map((b, i) => segD([X, D], w.path[i], b))); if (!wp || d < wp.d) wp = { d, id: w.id }; }
  return { nearest: near ? { id: near.id, d: r3(near.d) } : null, walker_path: wp ? { id: wp.id, d: r3(wp.d) } : null, status: (!near || near.d >= 0.6) && (!wp || wp.d >= 0.6) ? 'PASS' : 'FAIL' };
}
// one character at one spot: everything above
function judge(section, slot, model, X, D, H, facing, clip, rootH, railOwner) {
  const r = rec(section, `player@${slot}`, model, X, D, H, facing, clip, rootH);
  const res = checkPerson(r);
  const contacts = res.checks.filter((c) => c.class === 'contact').map((c) => ({ site: c.site, gap_q: c.gap_q, pen_q: c.pen_q, max: c.max, deepest_pen: c.deepest_pen, with: c.with,
    status: c.gap_q !== null && c.gap_q <= TOL && c.pen_q >= -TOL ? 'PASS' : 'FAIL' }));
  const get = (k) => res.checks.find((c) => c.class === k);
  const stance = get('stance_soles'), body = get('body_cylinder'), head = get('head_inside'), site = get('site_inside');
  const soles = solesCheck(r, clip, rootH);
  const through = throughCheck(r, clip, railOwner);
  const clear = clearance(section, X, D, H);
  const missing = res.fails.filter((f) => f.class === 'clip_missing').map((f) => f.note);
  const parts = {
    clip: missing.length ? 'FAIL' : 'PASS',
    rail: contacts.length && contacts.every((c) => c.status === 'PASS') ? 'PASS' : contacts.length ? 'FAIL' : 'n/a',
    soles: soles.status === 'PASS' && (!stance || stance.status === 'PASS') ? 'PASS' : 'FAIL',
    through: through.status === 'PASS' && (!site || site.status === 'PASS') && (!head || head.status === 'PASS') ? 'PASS' : 'FAIL',
    body: !body || body.status !== 'FAIL' ? 'PASS' : 'FAIL',
    clear: clear.status,
  };
  const status = Object.values(parts).every((v) => v === 'PASS' || v === 'n/a') ? 'PASS' : 'FAIL';
  return { slot, character: model, clip, root: { X: r3(X), D: r3(D), H: r3(H), facing_deg: facing, root_h: rootH }, status, parts, contacts,
    stance: stance ? { median: stance.median, status: stance.status } : null, soles, through, site_inside: site ? { depth: site.depth, status: site.status } : null,
    head_inside: head ? { depth: head.depth, status: head.status } : null, body_cylinder: body ? { overlap: body.overlap, status: body.status } : null, clear, missing,
    other_fails: res.fails.filter((f) => !['contact:rail', 'stance_soles', 'site_inside', 'head_inside', 'body_cylinder', 'clip_missing'].includes(f.class)) };
}

const results = [];
const out = { about: 'gen/interact/tools/clips_check.mjs: the player\'s join-the-pose clips per playable character x slot, PASS/FAIL by numbers (see the tool\'s header for each part).', date: new Date().toISOString(), tolerance_m: TOL, summary: null, moat: {}, crown: {}, storyteller: {}, drum: {}, results };

// ---------------------------------------------------------------- moat bridge (gate)
const MOAT = { near: { D: 0.12, facing: 270, sign: 1 }, far: { D: 7.88, facing: 90, sign: -1 }, top: 1.075, X0: 0, X1: 12.43, H: args.includes('--moat-h') ? +args[args.indexOf('--moat-h') + 1] : -0.01, XREF: 6.2 };
const clipOf = (c, base) => (c === 'child' ? `look~${base}_child` : base === 'moat_rail' ? 'lean_chin~moat_rail' : `lean_over~${base}`);
// the root is held at a fixed height (as people.js holds a root_h figure), H -0.01 (--moat-h): the deck's planks lie at
// -0.023..+0.025 and grounding on them moved the elbows over the rail by as much; at -0.01 every character's soles stay
// within the stance rule over every plank (floating <= 3 cm, sinking <= 3.5 cm) and the elbows 1-2 cm over the rail
// each character's distance from the rail's centre line: searched (1 cm steps) at X 6.2 (mid-bay) for the contacts
// nearest the rail and nothing (feet included: the bottom rail is under the top one) through the railing
const dist = {}, distWhy = {};
for (const c of PLAY) {
  const clip = clipOf(c, 'moat_rail');
  const cl = tracks[c].clips[clip];
  if (!cl) { dist[c] = null; distWhy[c] = `no ${clip}`; continue; }
  const sites = c === 'child' ? ['palm_L', 'palm_R'] : ['elbow_L', 'elbow_R'];
  const z0 = med(sites.map((st) => med(cl.sites[st].filter((_, i) => i % 3 === 2))));
  let best = null;
  // the child no nearer than 0.24 m (its spec lays the palms 0.23 m forward: nearer, its chest meets the rail)
  for (let d = Math.max(c === 'child' ? 0.24 : 0, Math.round((z0 - 0.04) * 100) / 100); d <= z0 + 0.12 + 1e-9; d = Math.round((d + 0.01) * 100) / 100) {
    const r = rec('gate', 'dist', c, MOAT.XREF, MOAT.near.D + d, MOAT.H, MOAT.near.facing, clip, MOAT.H);
    const res = checkPerson(r);
    const cs = res.checks.filter((k) => k.class === 'contact');
    const err = cs.length ? Math.max(...cs.map((k) => Math.max(k.gap_q, -k.pen_q, 0))) : 0;
    const th = throughCheck(r, clip, 'S5.str.moat_bridge', 2);
    const so = solesCheck(r, clip, MOAT.H);
    const score = err + (th.status === 'PASS' ? 0 : 1 + th.depth) + (so.status === 'PASS' ? 0 : 1);
    if (!best || score < best.score - 1e-9) best = { d, score, err, th };
  }
  dist[c] = best.d;
  distWhy[c] = `contacts' worst ${r3(best.err)} m, through ${best.th.depth} (${best.th.site || '-'}); the contact sites' median z ${r3(z0)}`;
}
for (const [rail, R] of Object.entries({ near: MOAT.near, far: MOAT.far })) {
  // free X: the root clear of every painted watcher (0.6 m) for every character's line, the body on the deck (`free`);
  // per character also nothing of it in a post, a post cap or through the rail there (`free_by_character`); the three
  // check points come from where every character is free
  const step = 0.05;
  const xs = [];
  for (let X = 0.30; X <= 12.13 + 1e-9; X += step) xs.push(r3(X));
  const reasons = {};
  const badAll = new Set(), badOf = Object.fromEntries(PLAY.map((c) => [c, new Set()]));
  for (const X of xs) {
    for (const c of PLAY) {
      if (dist[c] === null) continue;
      const D = R.D + R.sign * dist[c];
      const cl = clearance('gate', X, D, 0);
      if (cl.status !== 'PASS') { badAll.add(X); reasons[X] = `${c}: ${cl.nearest?.id} ${cl.nearest?.d}`; break; }
    }
    if (badAll.has(X) || args.includes('--no-moat-scan')) continue;
    for (const c of PLAY) {
      if (dist[c] === null) continue;
      const D = R.D + R.sign * dist[c];
      const r = rec('gate', 'scan', c, X, D, MOAT.H, R.facing, clipOf(c, 'moat_rail'), MOAT.H);
      const th = throughCheck(r, clipOf(c, 'moat_rail'), 'S5.str.moat_bridge', 2);
      if (th.status !== 'PASS') { badOf[c].add(X); reasons[`${X} ${c}`] = `${th.site} ${th.depth} into the bridge at ${th.t} s`; }
    }
  }
  const rangesOf = (bad) => {
    const free = [];
    let cur = null;
    for (const X of xs) {
      if (!bad(X)) { if (!cur) cur = [X, X]; else cur[1] = X; } else if (cur) { free.push(cur); cur = null; }
    }
    if (cur) free.push(cur);
    return free.filter(([a, b]) => b - a >= 0.1 - 1e-9);
  };
  const freeWatchers = rangesOf((X) => badAll.has(X));
  const freeBy = Object.fromEntries(PLAY.map((c) => [c, rangesOf((X) => badAll.has(X) || badOf[c].has(X))]));
  const ranges = rangesOf((X) => badAll.has(X) || PLAY.some((c) => badOf[c].has(X)));
  // three points per character in its own free ranges: the start of the first, the middle of the longest, the end of
  // the last
  const pointsOf = (rs) => { if (!rs.length) return []; const lg = [...rs].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0]; return [...new Set([r3(rs[0][0] + 0.05), r3((lg[0] + lg[1]) / 2), r3(rs[rs.length - 1][1] - 0.05)])]; };
  const pts = Object.fromEntries(PLAY.map((c) => [c, pointsOf(freeBy[c])]));
  out.moat[rail] = { rail_centre_D: R.D, facing_deg: R.facing, top_H: MOAT.top, root_H: MOAT.H, dist_by_character: Object.fromEntries(PLAY.map((c) => [c, dist[c]])), dist_why: distWhy, free: freeWatchers, free_by_character: freeBy, free_all: ranges, blocked: reasons, points: pts };
  for (const c of PLAY) for (const X of pts[c]) {
    if (dist[c] === null) { results.push({ slot: `moat_${rail}@${X}`, character: c, status: 'FAIL', parts: { clip: 'FAIL' }, missing: [distWhy[c]] }); continue; }
    const D = R.D + R.sign * dist[c];
    results.push(judge('gate', `moat_${rail}@${X}`, c, X, D, MOAT.H, R.facing, clipOf(c, 'moat_rail'), MOAT.H, 'S5.str.moat_bridge'));
  }
}

// ---------------------------------------------------------------- crown (rainbow_bridge)
const slots = fs.existsSync(path.join(QM, 'gen/interact/crown_slots.json')) ? rd('gen/interact/crown_slots.json') : {};
for (const base of ['player_crown_a', 'player_crown_b']) {
  if (!slots[base]) continue;
  out.crown[base] = { adults: slots[base], child: slots[`${base}_child`] || null };
  for (const c of PLAY) {
    const s = c === 'child' ? slots[`${base}_child`] : slots[base];
    if (!s) continue;
    results.push(judge('rainbow_bridge', base, c, s.X, s.D, s.H, s.facing_deg, clipOf(c, base), s.H, 'S3.str.rainbow_bridge'));
  }
}

// ---------------------------------------------------------------- storyteller: crane, no contact
for (const c of PLAY) {
  const cl = tracks[c].clips.crane;
  const has = (reg[c]?.clips || []).includes('crane');
  let low = null;
  if (cl) { const L = cl.sites.sole_L, R = cl.sites.sole_R, v = []; for (let i = 1; i < L.length; i += 3) v.push(Math.min(L[i], R[i])); low = r3(med(v)); }
  const ok = has && low !== null && low <= 0.03 && low >= -0.04;
  out.storyteller[c] = { built: has, lower_sole_median: low, status: ok ? 'PASS' : 'FAIL' };
  results.push({ slot: 'storyteller', character: c, clip: 'crane', status: ok ? 'PASS' : 'FAIL', parts: { clip: has ? 'PASS' : 'FAIL', soles: ok ? 'PASS' : 'FAIL' }, lower_sole_median: low });
}

// ---------------------------------------------------------------- drum (gate tower)
const DRUM = { owner: 'S5.prop.tower_drum_6898', centre: [-18.77, 5.93, 13.36], r: 0.62, floor: 12.06, east: { face: -18.40, facing: 180 }, west: { face: -19.14, facing: 0 } };
if (fs.existsSync(path.join(QM, 'gen/interact/drum_tip.json'))) {
  const dt = rd('gen/interact/drum_tip.json').characters;
  out.drum = { skin: DRUM, about: 'per character the root spot where the stick tip meets the drum face at hit_s (the face: the visible outer disc, the rope rim\'s cap, 2 cm proud of the drum skin)', spots: {} };
  for (const [side, S] of [['east', DRUM.east], ['west', DRUM.west]]) {
    const spots = {};
    for (const c of PLAY) {
      const d = dt[c];
      if (!d || d.missing) { results.push({ slot: `drum_${side}`, character: c, clip: 'strike_drum', status: 'FAIL', parts: { clip: 'FAIL' }, missing: [d?.missing || 'no drum_tip'] }); continue; }
      const [tx, ty] = d.tip_hit, tz = (d.tip_hit[2] + d.tip_max_z) / 2;
      // the depth: the tip on the face at hit_s, unless the wrist flicks it on afterwards (monk, woman: 3 cm further at
      // 1.3 s): then halfway, short of the face at hit_s by half that and past it at most by half (the face is the rope
      // rim's cap, 2 cm proud of the skin); its place across from the tip at hit_s
      // facing 180 (west): forward -X, left -D; facing 0 (east): forward +X, left +D (tools/contact_check.mjs toMapFn)
      const X = side === 'east' ? S.face + tz : S.face - tz;
      const D = side === 'east' ? DRUM.centre[1] + tx : DRUM.centre[1] - tx;
      spots[c] = { X: r3(X), D: r3(D), H: DRUM.floor, facing_deg: S.facing, hit_s: d.hit_s, tip_H: r3(DRUM.floor + ty) };
    }
    // one shared spot when every character's lands within 5 cm of the mean
    const cs = Object.keys(spots);
    const mean = cs.length ? [0, 1].map((k) => cs.reduce((a, c) => a + [spots[c].X, spots[c].D][k], 0) / cs.length) : null;
    const spread = cs.length ? Math.max(...cs.map((c) => Math.hypot(spots[c].X - mean[0], spots[c].D - mean[1]))) : null;
    out.drum.spots[side] = { facing_deg: S.facing, face_X: S.face, shared: spread !== null && spread <= 0.05 ? { X: r3(mean[0]), D: r3(mean[1]), H: DRUM.floor } : null, spread_m: r3(spread), by_character: spots };
    for (const c of cs) {
      const sp = out.drum.spots[side].shared || spots[c];
      const d = dt[c];
      const [tx, ty, tz] = d.tip_hit;
      const tipX = side === 'east' ? sp.X - tz : sp.X + tz, tipD = side === 'east' ? sp.D - tx : sp.D + tx, tipH = DRUM.floor + ty;
      const plane = side === 'east' ? tipX - S.face : S.face - tipX;      // + outside the face, - through it
      const radial = Math.hypot(tipD - DRUM.centre[1], tipH - DRUM.centre[2]);
      const tipThrough = d.tip_max_z - (side === 'east' ? sp.X - S.face : S.face - sp.X); // the tip's farthest forward past the face
      const r = rec('gate', `drum_${side}`, c, sp.X, sp.D, DRUM.floor, S.facing, 'strike_drum');
      const res = checkPerson(r);
      const body = throughCheck(r, 'strike_drum', DRUM.owner, 1);
      const stance = res.checks.find((k) => k.class === 'stance_soles');
      const cyl = res.checks.find((k) => k.class === 'body_cylinder');
      const parts = {
        clip: res.fails.some((f) => f.class === 'clip_missing') ? 'FAIL' : 'PASS',
        tip_on_skin: plane >= -0.01 && plane <= TOL && radial <= DRUM.r - 0.03 ? 'PASS' : 'FAIL',
        tip_not_through: tipThrough <= 0.02 ? 'PASS' : 'FAIL',
        body_out_of_drum: body.status,
        soles: stance && stance.status === 'PASS' ? 'PASS' : 'FAIL',
        body: !cyl || cyl.status !== 'FAIL' ? 'PASS' : 'FAIL',
        clear: clearance('gate', sp.X, sp.D, DRUM.floor).status,
      };
      results.push({ slot: `drum_${side}`, character: c, clip: 'strike_drum', root: { X: sp.X, D: sp.D, H: DRUM.floor, facing_deg: S.facing }, status: Object.values(parts).every((v) => v === 'PASS') ? 'PASS' : 'FAIL', parts,
        hit_s: d.hit_s, tip_at_hit: { X: r3(tipX), D: r3(tipD), H: r3(tipH), plane_m: r3(plane), from_centre_m: r3(radial) }, tip_farthest_past_face_m: r3(tipThrough), tip_farthest_s: d.tip_max_z_s, body_in_drum: body, clear: clearance('gate', sp.X, sp.D, DRUM.floor), stance: stance ? { median: stance.median, status: stance.status } : null });
    }
  }
}

// ---------------------------------------------------------------- summary
const by = {};
for (const r of results) { const k = r.slot.replace(/@.*/, ''); (by[k] ||= { PASS: 0, FAIL: 0 })[r.status]++; }
out.summary = { checks: results.length, PASS: results.filter((r) => r.status === 'PASS').length, FAIL: results.filter((r) => r.status === 'FAIL').length, by_slot: by,
  fails: results.filter((r) => r.status === 'FAIL').map((r) => `${r.slot} ${r.character}: ${Object.entries(r.parts).filter(([, v]) => v === 'FAIL').map(([k]) => k).join(', ')}`) };
fs.writeFileSync(path.join(QM, 'gen/interact/clips_check.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`clips_check: ${out.summary.PASS} PASS, ${out.summary.FAIL} FAIL of ${out.summary.checks} -> gen/interact/clips_check.json`);
for (const [k, v] of Object.entries(by)) console.log(`  ${k.padEnd(18)} ${v.PASS} PASS ${v.FAIL} FAIL`);
for (const f of out.summary.fails) console.log(`  FAIL ${f}`);
