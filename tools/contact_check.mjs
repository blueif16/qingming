#!/usr/bin/env node
// Contact check: does every figure touch what its action needs, and nothing it shouldn't? Numbers only, no GPU, no
// Blender: placements (gen/details/placements.json, tools/people_dump.mjs) x joint tracks (gen/details/joints/,
// tools/joint_tracks.mjs) x the built geometry by owner (gen/sections/<name>/owners.*, blender/owners_dump.py) x the
// rules (characters/contacts.json). gen/details/brief_contacts.md, plan.md "The method".
//   node tools/contact_check.mjs <section|all> [--json out] [--quiet] [--predict [--source sections|web] [--engine proposed]] [--out-dir d]
//   import { setup, checkPerson } from './contact_check.mjs'   (the solver, tools/contact_solve.mjs)
//     -> gen/details/contacts/<section>.json per section, gen/details/contacts/summary.json + summary.md
// Per contact: max, mean and hold-quantile of the signed gap over the cycle (penetration negative), deepest
// penetration, PASS/FAIL. Per figure, the universal checks: stance soles, standing on furniture, load-order ground,
// body cylinder in a collider, head inside geometry, body sites inside closed collide pieces.
// Animals are their posed meshes (joint_tracks animals), not capsules. Boats are not in the owners: boat crews are
// counted as not covered.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { World, QM, segDist, closestOnTri } from './lib/owners_index.mjs';
import { Predictor, SECTIONS, driftExclusions, predictDump, predictCrewDump } from './place_predict.mjs';
// boat crews (fix-boats): the boats posed at each instant of the dump, the boat rules, the crew-only checks
import { boatWorldOf, crewInstants, boatRuleVals, crewChecks, poleThrough, towCheck, poleSites, BOAT_TARGETS } from './lib/boat_contacts.mjs';

const OUT = path.join(QM, 'gen/details/contacts');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(QM, p), 'utf8'));
const r3 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? x : Math.round(x * 1000) / 1000);
// module state, set by setup(): the placements, the rules, the world's geometry by owner and the ground predictor.
// The solver (tools/contact_solve.mjs) imports setup() and checkPerson() and calls checkPerson on trial placements.
let dump, RULES, U, world, pred, verify;
let boatWorld = null; // fix-boats: the sections' World with every boat appended (tools/lib/boat_world.mjs), posed per instant
const animalMeshCache = new Map(), soupCache = new Map(), tracks = new Map();
let ENGINE = 'page';
export function setup({ placements = null, rules = null, sections = SECTIONS, worldIn = null, engine = null } = {}) {
  if (engine) { ENGINE = engine; tracks.clear(); }
  dump = placements || rd('gen/details/placements.json');
  RULES = rules || rd('characters/contacts.json');
  U = RULES.universal;
  world = worldIn || World.load(sections, { exclude: driftExclusions() });
  pred = new Predictor(world, SECTIONS, { engine: ENGINE });
  verify = fs.existsSync(path.join(OUT, 'owners_verify.json')) ? rd('gen/details/contacts/owners_verify.json') : [];
  // boat crews are checked when the dump carries the boats' matrices (tools/people_dump.mjs since fix-boats) and the
  // boats' owners exist (gen/sections/<name>/boat_owners.*, blender/build_boats.py)
  boatWorld = dump.boats ? (boatWorld && boatWorld.base === world.n ? boatWorld : boatWorldOf(world)) : null;
  animalMeshCache.clear();
  soupCache.clear();
  return { dump, RULES, world, pred, boatWorld };
}
// the rule of a clip: its own, else (a clip variant "<base>~<what>", tools/ik_clip.mjs) its base clip's
export function ruleOf(asked, drawn) {
  return RULES.clips[asked] || RULES.clips[asked.split('~')[0]] || RULES.clips[drawn] || RULES.clips[drawn.split('~')[0]] || { posture: 'stand', contacts: [] };
}

// ---------------------------------------------------------------- owner classes
const bare = (o) => World.bare(o);
const oName = (t) => world.owners[world.owner[t]];
const isGroundOwner = (o) => o.endsWith('|ground');
const isEdge = (o) => o.includes('|edge:');
const isWater = (o) => o.endsWith('|water') || /\.water\./.test(o);
const visible = (t) => !world.hiddenMat[world.mat[t]];
const ownerIsSolidThing = (o) => !isGroundOwner(o) && !isEdge(o) && !isWater(o);
// filters
const fVisibleAny = (t) => visible(t) && !isEdge(oName(t)) && !isWater(oName(t));
const fVisibleNonGround = (t) => visible(t) && ownerIsSolidThing(oName(t));
const fCollideVisibleThing = (t) => visible(t) && world.isCollide(t) && ownerIsSolidThing(oName(t));
const fGround = (t) => isGroundOwner(oName(t));

// ---------------------------------------------------------------- map groups (map/world/<S>.json)
const groupMembers = new Map();
for (const f of fs.readdirSync(path.join(QM, 'map/world'))) {
  if (!f.endsWith('.json')) continue;
  const w = JSON.parse(fs.readFileSync(path.join(QM, 'map/world', f), 'utf8'));
  const ents = Array.isArray(w.entities) ? w.entities : Object.values(w.entities || {});
  for (const e of ents) if (e.kind === 'group') groupMembers.set(e.id, e.members || []);
}

// ---------------------------------------------------------------- joint tracks and animal meshes
function track(model) {
  if (!tracks.has(model)) {
    const f = path.join(QM, `gen/details/${ENGINE === 'proposed' ? 'joints_proposed' : 'joints'}/${model}.json`);
    tracks.set(model, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  }
  return tracks.get(model);
}
const beasts = new Map();
function beast(type) {
  if (!beasts.has(type)) {
    const f = path.join(QM, `gen/details/joints/animal_${type}.json`);
    if (!fs.existsSync(f)) { beasts.set(type, null); return null; }
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const b = fs.readFileSync(path.join(QM, `gen/details/joints/animal_${type}.bin`));
    j.F = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
    beasts.set(type, j);
  }
  return beasts.get(type);
}

// page frame (root position P, yaw, scale factor k over the model's own) -> map frame [X, D, H]
function toMapFn(rec) {
  const [px, py, pz] = rec.root, c = Math.cos(rec.yaw), s = Math.sin(rec.yaw);
  const k = rec.model_scale ? rec.scale / rec.model_scale : 1;
  return (x, y, z) => [px + k * (x * c + z * s), -(pz + k * (-x * s + z * c)), py + k * y];
}

// an animal's posed mesh in the map frame: triangles [a, b, c] (frame 0 of its current clip, body + its loads)
function animalMesh(arec) {
  if (animalMeshCache.has(arec.id)) return animalMeshCache.get(arec.id);
  const j = beast(arec.model);
  let tris = null;
  if (j) {
    const clip = j.clips[arec.clip] || j.clips.idle || Object.values(j.clips)[0];
    const fr = clip.frames[0];
    const toMap = toMapFn(arec);
    const loads = new Set((arec.loads || []).map((l) => `tack_${l}`));
    tris = [];
    for (const [part, offsets] of Object.entries(fr.parts)) {
      if (part !== 'body' && !loads.has(part)) continue;
      offsets.forEach((off, mi) => {
        const pm = j.part_meshes[part][mi];
        const V = (i) => toMap(j.F[off + i * 3], j.F[off + i * 3 + 1], j.F[off + i * 3 + 2]);
        const idx = pm.index;
        for (let i = 0; i < idx.length; i += 3) tris.push([V(idx[i]), V(idx[i + 1]), V(idx[i + 2])]);
      });
    }
  }
  animalMeshCache.set(arec.id, tris);
  return tris;
}
// signed distance from p to a triangle soup: d (negative inside); inside by vertical parity. The soup carries each
// triangle's bounding box (soupOf), so only triangles whose box is nearer than the best so far are measured exactly
function soupOf(tris) {
  const box = new Float32Array(tris.length * 6);
  tris.forEach(([a, b, c], i) => {
    for (let k = 0; k < 3; k++) { box[i * 6 + k] = Math.min(a[k], b[k], c[k]); box[i * 6 + 3 + k] = Math.max(a[k], b[k], c[k]); }
  });
  return { tris, box };
}
function soupSigned(p, soup) {
  const { tris, box } = soup.box ? soup : soupOf(soup);
  const n = tris.length, lb = new Float32Array(n);
  // inside: the parity of crossings on three half-rays from p (up, down, east), inside when two of the three are odd
  // (an animal's mesh is not closed everywhere, so one ray alone misjudged points beside a flank: fix-S4)
  let up = 0, down = 0, east = 0, first = -1, fl = Infinity;
  for (let i = 0; i < n; i++) {
    const o = i * 6;
    const dx = Math.max(box[o] - p[0], 0, p[0] - box[o + 3]), dy = Math.max(box[o + 1] - p[1], 0, p[1] - box[o + 4]), dz = Math.max(box[o + 2] - p[2], 0, p[2] - box[o + 5]);
    lb[i] = dx * dx + dy * dy + dz * dz;
    if (lb[i] < fl) { fl = lb[i]; first = i; }
    if (dx === 0 && dy === 0) { // the vertical line through p crosses this box: parity
      const [a, b, c] = tris[i];
      const h = vertHit(p[0], p[1], a, b, c);
      if (h !== null) { if (h > p[2]) up++; else down++; }
    }
    if (dy === 0 && dz === 0 && box[o + 3] >= p[0]) { // the east half-ray
      const [a, b, c] = tris[i];
      const x = eastHit(p[1], p[2], a, b, c);
      if (x !== null && x > p[0]) east++;
    }
  }
  if (first < 0) return Infinity;
  let best = closestOnTri(p, ...tris[first]).d;
  for (let i = 0; i < n; i++) {
    if (i === first || lb[i] >= best * best) continue;
    const r = closestOnTri(p, ...tris[i]);
    if (r.d < best) best = r.d;
  }
  return (up % 2) + (down % 2) + (east % 2) >= 2 ? -best : best;
}
// where the line {D = d, H = h} (along X) crosses triangle a, b, c: its X, or null
function eastHit(d, h, a, b, c) {
  const det = (b[1] - c[1]) * (a[2] - c[2]) + (c[2] - b[2]) * (a[1] - c[1]);
  if (Math.abs(det) < 1e-12) return null;
  const l1 = ((b[1] - c[1]) * (h - c[2]) + (c[2] - b[2]) * (d - c[1])) / det;
  const l2 = ((c[1] - a[1]) * (h - c[2]) + (a[2] - c[2]) * (d - c[1])) / det;
  const l3 = 1 - l1 - l2;
  if (l1 < 0 || l2 < 0 || l3 < 0) return null;
  return l1 * a[0] + l2 * b[0] + l3 * c[0];
}
function vertHit(X, D, a, b, c) {
  const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(det) < 1e-12) return null;
  const l1 = ((b[1] - c[1]) * (X - c[0]) + (c[0] - b[0]) * (D - c[1])) / det;
  const l2 = ((c[1] - a[1]) * (X - c[0]) + (a[0] - c[0]) * (D - c[1])) / det;
  const l3 = 1 - l1 - l2;
  if (l1 < 0 || l2 < 0 || l3 < 0) return null;
  return l1 * a[2] + l2 * b[2] + l3 * c[2];
}

// ---------------------------------------------------------------- geometry queries on the world
// owners whose visible pieces (filter) enclose p: odd crossings of the vertical line above and below p
function insideOwners(p, filter) {
  const cnt = new Map();
  for (const v of world.vertical(p[0], p[1], filter)) {
    const o = world.owner[v.t];
    const c = cnt.get(o) || [0, 0];
    if (v.h > p[2]) c[0]++; else c[1]++;
    cnt.set(o, c);
  }
  const out = [];
  for (const [o, [up, down]] of cnt) if (up % 2 && down % 2) out.push(o);
  return out;
}
// depth of p inside owner o: distance to its nearest triangle (of those the filter keeps)
function depthIn(p, o, filter) {
  let best = Infinity;
  for (const t of world.near(p[0], p[1], 0.6)) {
    if (world.owner[t] !== o || !filter(t)) continue;
    const r = world.closest(t, p);
    if (r.d < best) best = r.d;
  }
  return best;
}
// the highest surface under p (from p.H + up), among triangles the filter keeps: { h, owner } or null
function surfaceUnder(p, up, filter) {
  let best = null;
  for (const v of world.vertical(p[0], p[1], filter)) if (v.h <= p[2] + up && (!best || v.h > best.h)) best = v;
  return best && { h: best.h, owner: oName(best.t) };
}
// the surface under a foot (or a seat): the highest of five points 5 cm round the site, so plank gaps don't drop it
function surfaceUnderFoot(p, up, filter) {
  let best = null;
  for (const [dx, dd] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) {
    const s = surfaceUnder([p[0] + dx, p[1] + dd, p[2]], up, filter);
    if (s && (!best || s.h > best.h)) best = s;
  }
  return best;
}
// the nearest visible non-ground surface within r: signed distance (negative inside its owner) and its owner
function nearestThing(p, r, filter = fVisibleNonGround, ownerSet = null) {
  const f = ownerSet ? (t) => ownerSet.has(world.owner[t]) && filter(t) : filter;
  const n = world.nearest(p, r, f);
  if (!n || n.d > r) return null;
  const o = world.owner[n.t];
  const inside = insideOwners(p, (t) => world.owner[t] === o && filter(t)).includes(o);
  return { d: inside ? -n.d : n.d, owner: world.owners[o] };
}
// clip triangle t to the height band [lo, hi]; plan distance from (X, D) to what is left (0 if over it)
function bandPlanDist(t, X, D, lo, hi) {
  const T = world.T, o = t * 9;
  let poly = [[T[o], T[o + 1], T[o + 2]], [T[o + 3], T[o + 4], T[o + 5]], [T[o + 6], T[o + 7], T[o + 8]]];
  const clip = (pts, keep, h) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ka = keep(a[2]), kb = keep(b[2]);
      if (ka) out.push(a);
      if (ka !== kb) { const f = (h - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, h]); }
    }
    return out;
  };
  poly = clip(poly, (h) => h >= lo, lo);
  if (!poly.length) return Infinity;
  poly = clip(poly, (h) => h <= hi, hi);
  if (!poly.length) return Infinity;
  // inside the convex plan polygon?
  if (poly.length >= 3) {
    let sgn = 0, inside = true;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const cr = (b[0] - a[0]) * (D - a[1]) - (b[1] - a[1]) * (X - a[0]);
      if (Math.abs(cr) < 1e-12) continue;
      if (!sgn) sgn = Math.sign(cr); else if (Math.sign(cr) !== sgn) { inside = false; break; }
    }
    if (inside && sgn) return 0;
  }
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    best = Math.min(best, segDist([X, D, 0], [a[0], a[1], 0], [b[0], b[1], 0]));
  }
  return best;
}

// ---------------------------------------------------------------- per person
const animalsOf = (section) => dump.people.filter((q) => q.section === section && q.kind === 'animal');
const quant = (vals, f) => { const s = [...vals].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.floor(f * (s.length - 1))))]; };
const median = (vals) => quant(vals, 0.5);

function stepsOf(rec) {
  if (rec.kind === 'walker') return [[rec.clip, 1]];
  return rec.do || (rec.ride ? [['ride', 8]] : [['idle', 6]]);
}

function resolveTargets(rec, kind, posSamples) {
  const grp = rec.map?.group ? groupMembers.get(rec.map.group) || [] : [];
  const sectionKey = rec.map?.map_id?.split('.')[0];
  const root = [rec.root[0], -rec.root[2], rec.root[1]];
  if (kind === 'vehicle' && rec.boat && rec._instant) { // a crew member's vehicle is its own boat (fix-boats)
    const oids = world.owners.map((o, i) => [o, i]).filter(([o]) => o.startsWith(`${rec.boat.id}|`) && !/__(col|edge)$/.test(o)).map(([, i]) => i);
    return { oids, how: 'own boat', names: oids.map((o) => world.owners[o]) };
  }
  if (kind === 'vehicle') {
    let oids = grp.filter((m) => /\.veh\./.test(m) && world.ownerId.has(m)).map((m) => world.ownerId.get(m));
    let how = 'group';
    if (!oids.length) {
      const n = world.nearest(root, 4, (t) => /\.veh\./.test(oName(t)));
      if (n) { oids = [world.owner[n.t]]; how = 'nearest'; }
    }
    return { oids, how, names: oids.map((o) => world.owners[o]) };
  }
  if (kind === 'animal' || kind === 'ridden') {
    let list = [];
    let how = 'group';
    if (kind === 'ridden') { list = animalsOf(rec.section).filter((a) => a.id === (rec.rider_of || rec.ride)); how = 'ridden'; }
    else {
      const slugs = new Set(grp.filter((m) => /\.ani\./.test(m)).map((m) => m.split('.').slice(2).join('.')));
      list = animalsOf(rec.section).filter((a) => slugs.has(a.id));
      if (!list.length) {
        const near = animalsOf(rec.section).map((a) => [a, Math.hypot(a.root[0] - rec.root[0], a.root[2] - rec.root[2])]).filter(([, d]) => d <= 4).sort((a, b) => a[1] - b[1]);
        if (near.length) { list = [near[0][0]]; how = 'nearest'; }
      }
    }
    return { animals: list, how, names: list.map((a) => `${sectionKey}.ani.${a.id}`) };
  }
  return null;
}

export function checkPerson(rec) {
  // boat crews (fix-boats): at the dump's instant and at each frozen clock time, with the boats posed there
  if (boatWorld && !rec._instant && (rec.kind === 'crew' ? rec.boat : usesBoatRule(rec))) return checkCrew(rec);
  const res = { id: rec.id, section: rec.section, kind: rec.kind, model: rec.model, character: rec.character, map_id: rec.map?.map_id || null,
    support: rec.map?.support || null, root: rec.root, checks: [], fails: [], notes: [] };
  const tr = track(rec.model);
  if (!tr) { res.notes.push(`no joint tracks for ${rec.model}`); return res; }
  const toMap = toMapFn(rec);
  const steps = stepsOf(rec);
  const root = [rec.root[0], -rec.root[2], rec.root[1]];
  const exempt = new Set(); // owner ids the body checks leave alone: contact targets, the seat, what it stands on
  const standOn = pred.ground(root[0], root[1], (rec.map?.H || 0) + 1.2);
  if (standOn.owner && world.ownerId.has(standOn.owner)) exempt.add(world.ownerId.get(standOn.owner));
  // the clips the cycle plays (a clip the model lacks plays idle: people.js play())
  const clips = [];
  for (const [c] of steps) {
    const drawn = tr.clips[c] ? c : (tr.clips.idle ? 'idle' : Object.keys(tr.clips)[0]);
    if (drawn !== c) { res.fails.push({ class: 'clip_missing', clip: c, value: null, note: `${rec.model} has no ${c}: plays ${drawn}` }); }
    if (!clips.some((x) => x.asked === c)) clips.push({ asked: c, drawn, rule: ruleOf(c, drawn) });
  }
  // world positions of every site, per clip
  const W = {};
  for (const c of clips) {
    const cl = tr.clips[c.drawn];
    const out = {};
    for (const s of tr.sites) {
      const a = cl.sites[s], pts = [];
      for (let i = 0; i < a.length; i += 3) pts.push(toMap(a[i], a[i + 1], a[i + 2]));
      out[s] = pts;
    }
    const ps = poleSites(rec, c.drawn, toMap, out.palm_R); // a carried pole's ends (fix-boats; tools/prop_tracks.mjs)
    if (ps) Object.assign(out, ps);
    W[c.drawn] = out;
  }
  const crew = rec.kind === 'crew', rider = rec.kind === 'rider', walker = rec.kind === 'walker';
  // ---- contacts
  for (const c of clips) {
    for (const rule of c.rule.contacts || []) {
      const pts = W[c.drawn][rule.site] || (rule.site.startsWith('pole') ? W[c.drawn].palm_R : null); // no pole carried: judged at the hand
      if (!pts) { res.notes.push(`no site ${rule.site}`); continue; }
      const ck = { class: 'contact', clip: c.asked, site: rule.site, target: rule.target, feature: rule.feature || null, gap_m: rule.gap_m, pen_m: rule.pen_m, hold: rule.hold };
      let vals = [];
      if (crew && !rec._instant) { ck.status = 'NOT_COVERED'; ck.note = 'on a boat: boats are not in the owners'; res.checks.push(ck); continue; }
      if (BOAT_TARGETS.has(rule.target)) { // fix-boats: the own boat by feature, the carried pole, the water
        const r = boatRuleVals(world, rec, rule, pts, W[c.drawn]);
        vals = r.vals; ck.with = r.with; if (r.note) ck.note = r.note;
      } else if (rule.target === 'vehicle') {
        const tg = resolveTargets(rec, 'vehicle');
        ck.with = tg.names; ck.how = tg.how;
        if (!tg.oids.length) { ck.status = 'FAIL'; ck.note = 'no vehicle in its map group or within 4 m'; ck.max = null; res.checks.push(ck); res.fails.push({ class: `contact:${rule.target}`, clip: c.asked, site: rule.site, value: null, note: ck.note }); continue; }
        tg.oids.forEach((o) => exempt.add(o));
        const minLen = rule.feature === 'pole' ? 1.5 : 0.5;
        const rods = rule.feature ? tg.oids.flatMap((o) => world.rods(o, { minLen }).map((r) => ({ ...r, owner: world.owners[o] }))) : [];
        if (rule.feature && !rods.length) ck.note = `no ${rule.feature} found on the vehicle: distance to its surface`;
        const set = new Set(tg.oids);
        const which = new Map();
        for (const p of pts) {
          if (rods.length) {
            let best = Infinity, bi = -1;
            rods.forEach((r, i) => { const d = segDist(p, r.a, r.b) - r.r; if (d < best) { best = d; bi = i; } });
            vals.push(best);
            which.set(bi, (which.get(bi) || 0) + 1);
          } else {
            const n = nearestThing(p, 3, fVisibleAny, set);
            vals.push(n ? n.d : 3);
          }
        }
        if (rods.length) {
          const top = [...which.entries()].sort((a, b) => b[1] - a[1])[0][0];
          const r = rods[top];
          ck.rod = { owner: r.owner, a: r.a.map(r3), b: r.b.map(r3), r: r3(r.r), len: r3(r.len), key: `${r.owner}@${r3(r.a[0])},${r3(r.a[1])}` };
          // where the site is relative to that rod, at the median sample: above it and to its side
          const p = pts[Math.floor(pts.length / 2)];
          const ab = [r.b[0] - r.a[0], r.b[1] - r.a[1]], L = Math.hypot(...ab) || 1;
          const tt = Math.max(0, Math.min(1, ((p[0] - r.a[0]) * ab[0] + (p[1] - r.a[1]) * ab[1]) / (L * L)));
          const q = [r.a[0] + (r.b[0] - r.a[0]) * tt, r.a[1] + (r.b[1] - r.a[1]) * tt, r.a[2] + (r.b[2] - r.a[2]) * tt];
          ck.rel = { above_m: r3(p[2] - q[2]), side_m: r3(Math.abs((p[0] - r.a[0]) * ab[1] - (p[1] - r.a[1]) * ab[0]) / L) };
        }
      } else if (rule.target === 'animal' || rule.target === 'ridden') {
        const tg = resolveTargets(rec, rule.target);
        ck.with = tg.names; ck.how = tg.how;
        const meshes = tg.animals.map(animalMesh).filter(Boolean);
        if (!meshes.length) { ck.status = 'FAIL'; ck.note = `no ${rule.target === 'ridden' ? 'ridden animal' : 'animal in its group or within 4 m'}`; res.checks.push(ck); res.fails.push({ class: `contact:${rule.target}`, clip: c.asked, site: rule.site, value: null, note: ck.note }); continue; }
        const sk = tg.animals.map((a) => `${a.section}/${a.id}`).join('|');
        if (!soupCache.has(sk)) soupCache.set(sk, soupOf(meshes.flat()));
        const soup = soupCache.get(sk);
        for (const p of pts) vals.push(soupSigned(p, soup));
      } else if (rule.target === 'seat' || rule.target === 'floor') {
        const owners = new Map();
        let air = 0;
        const floorH = rec.root[1] + 0.12;
        const fSeat = (t) => fVisibleNonGround(t);
        for (const p of pts) {
          let s = (rule.site.startsWith('sole') ? surfaceUnderFoot : surfaceUnder)(p, 0.15, rule.target === 'seat' ? fSeat : fVisibleAny);
          if (s && rule.target === 'seat' && s.h < floorH) s = null; // the floor it stands on is not a seat
          if (s) { vals.push(p[2] - s.h); owners.set(s.owner, (owners.get(s.owner) || 0) + 1); }
          else {
            const g = surfaceUnder(p, 0.15, fVisibleAny);
            vals.push(g ? p[2] - g.h : p[2]);
            air++;
          }
        }
        const top = [...owners.entries()].sort((a, b) => b[1] - a[1])[0];
        ck.with = top ? [bare(top[0])] : [];
        for (const o of owners.keys()) if (world.ownerId.has(o)) exempt.add(world.ownerId.get(o));
        if (rule.target === 'seat' && air > pts.length / 2) {
          ck.note = `no seat under the seat point (${air}/${pts.length} samples): only the ground`;
          // the nearest thing it could sit on: a non-ground piece within 1 m whose top is near the seat point's height
          const sp = pts[Math.floor(pts.length / 2)];
          const tops = new Map();
          for (const t of world.near(sp[0], sp[1], 1.0)) {
            if (!fVisibleNonGround(t)) continue;
            const T = world.T, o = t * 9, top = Math.max(T[o + 2], T[o + 5], T[o + 8]);
            if (top < rec.root[1] + 0.2 || top > sp[2] + 0.1) continue;
            const c = world.closest(t, [sp[0], sp[1], top]);
            const d = Math.hypot(c.q[0] - sp[0], c.q[1] - sp[1]);
            const on = oName(t), e = tops.get(on);
            if (!e || d < e.d) tops.set(on, { d, top: Math.max(top, e?.top || 0) });
          }
          const cand = [...tops.entries()].sort((a, b) => a[1].d - b[1].d)[0];
          if (cand) { ck.nearest_seat = { owner: bare(cand[0]), plan_m: r3(cand[1].d), top: r3(cand[1].top) }; ck.note += `; nearest seat-high piece ${bare(cand[0])} ${r3(cand[1].d)} m away in plan (top ${r3(cand[1].top)})`; }
        }
      } else if (['rail', 'wall', 'table', 'structure'].includes(rule.target)) {
        const owners = new Map();
        for (const p of pts) {
          const n = nearestThing(p, 0.6);
          vals.push(n ? n.d : 0.6);
          if (n) owners.set(n.owner, (owners.get(n.owner) || 0) + 1);
        }
        const top = [...owners.entries()].sort((a, b) => b[1] - a[1])[0];
        ck.with = top ? [bare(top[0])] : [];
        if (!top) ck.note = 'nothing within 0.6 m';
        for (const o of owners.keys()) if (world.ownerId.has(o)) exempt.add(world.ownerId.get(o));
      } else { ck.status = 'SKIP'; res.checks.push(ck); continue; }
      ck.max = r3(Math.max(...vals));
      ck.mean = r3(vals.reduce((a, b) => a + b, 0) / vals.length);
      ck.gap_q = r3(quant(vals, rule.hold));
      ck.pen_q = r3(quant(vals, 1 - rule.hold));
      ck.deepest_pen = r3(Math.max(0, -Math.min(...vals)));
      const pass = ck.gap_q <= rule.gap_m && ck.pen_q >= -rule.pen_m;
      ck.status = pass ? 'PASS' : 'FAIL';
      res.checks.push(ck);
      if (!pass) {
        const over = ck.gap_q > rule.gap_m ? ck.gap_q : ck.pen_q;
        res.fails.push({ class: `contact:${rule.target}`, clip: c.asked, site: rule.site, value: r3(over), kind: ck.gap_q > rule.gap_m ? 'gap' : 'penetration', with: ck.with, note: ck.note || null, rel: ck.rel || null, soft: !!rule.soft });
      }
    }
  }
  // the same pole: every rod contact of one clip should hold the same pole (sedan_carry: shoulder and both palms)
  for (const c of clips) {
    const rc = res.checks.filter((k) => k.class === 'contact' && k.clip === c.asked && k.rod);
    const keys = new Set(rc.map((k) => k.rod.key));
    if (rc.length > 1 && keys.size > 1) res.notes.push(`${c.asked}: the ${rc.map((k) => k.site).join(', ')} are nearest to ${keys.size} different poles (${[...keys].join('; ')})`);
  }
  if (crew && !rec._instant) { res.notes.push('boat crew: placed by boats.js host() on a boat, which is not in the owners (not covered)'); return res; }
  // ---- universal: stance soles. The clip's own sole height (median over its samples of the lower sole, root frame,
  // on flat ground) says whether a gap is the clip's (people.js grounds by the lowest foot bone, not the mesh sole: a
  // fix per character clip) or the placement's (the terrain under this figure)
  const clipSole = (drawn) => {
    const L = tr.clips[drawn].sites.sole_L, R = tr.clips[drawn].sites.sole_R, k = rec.model_scale ? rec.scale / rec.model_scale : 1, v = [];
    for (let i = 1; i < L.length; i += 3) v.push(Math.min(L[i], R[i]) * k);
    return median(v);
  };
  const standClips = clips.filter((c) => (U.stance_soles.postures || []).includes(c.rule.posture));
  const wading = /^water/.test(rec.map?.support || '');
  if (!rider && !walker && !wading && standClips.length) {
    const gaps = [], offs = [], belowOwners = new Map();
    let squat = false;
    for (const c of standClips) {
      if (c.rule.posture === 'squat') squat = true;
      const L = W[c.drawn].sole_L, R = W[c.drawn].sole_R;
      for (let i = 0; i < L.length; i++) {
        const s = L[i][2] <= R[i][2] ? L[i] : R[i];
        const u = surfaceUnderFoot(s, 0.25, fVisibleAny);
        gaps.push(u ? s[2] - u.h : null);
        if (u && u.h - s[2] > U.stance_soles.pen_m) belowOwners.set(u.owner, (belowOwners.get(u.owner) || 0) + 1);
      }
      offs.push(clipSole(c.drawn));
    }
    const got = gaps.filter((g) => g !== null);
    if (!got.length) res.notes.push('stance soles: no visible surface within 0.25 m under the soles');
    else {
      const m = median(got), gt = squat ? U.stance_soles.squat_gap_m : U.stance_soles.gap_m, off = median(offs);
      const ck = { class: 'stance_soles', median: r3(m), max: r3(Math.max(...got)), min: r3(Math.min(...got)), clip_offset: r3(off), no_surface: gaps.length - got.length, gap_m: gt, pen_m: U.stance_soles.pen_m };
      ck.status = m <= gt && m >= -U.stance_soles.pen_m ? 'PASS' : 'FAIL';
      ck.cause = Math.abs(m - off) <= 0.02 ? 'clip' : 'placement';
      res.checks.push(ck);
      // a sole far under a surface that is not the ground is a foot inside a wall, plinth or step
      const inside = [...belowOwners.entries()].sort((a, b) => b[1] - a[1])[0];
      if (m < -U.stance_soles.pen_m && inside && !isGroundOwner(inside[0])) { ck.inside = bare(inside[0]); ck.cause = 'placement'; }
      if (ck.status === 'FAIL') res.fails.push({ class: 'stance_soles', value: ck.median, kind: ck.inside ? 'foot inside' : m > gt ? 'floating' : 'sunk', cause: ck.cause, with: ck.inside ? [ck.inside] : undefined,
        note: ck.inside ? `the stance foot is inside ${ck.inside} (a surface ${r3(-m)} m above the sole)` : `clip sole height ${r3(off)} m (${ck.cause})` });
    }
  }
  // seated soles and floor sits, the same split: a sole gap the clip itself has on flat ground is the clip's
  for (const ck of res.checks) {
    if (ck.class !== 'contact' || ck.target !== 'floor' || !ck.site?.startsWith('sole') || !Number.isFinite(ck.gap_q)) continue;
    const c = clips.find((x) => x.asked === ck.clip);
    const a = tr.clips[c.drawn].sites[ck.site], k = rec.model_scale ? rec.scale / rec.model_scale : 1, v = [];
    for (let i = 1; i < a.length; i += 3) v.push(a[i] * k);
    ck.clip_offset = r3(median(v));
    ck.cause = Math.abs(ck.mean - ck.clip_offset) <= 0.02 ? 'clip' : 'placement';
    const f = res.fails.find((x) => x.class === 'contact:floor' && x.clip === ck.clip && x.site === ck.site);
    if (f) { f.cause = ck.cause; f.note = `${f.note ? f.note + '; ' : ''}the clip's own ${ck.site} height ${ck.clip_offset} m (${ck.cause})`; }
  }
  // ---- universal: the root on its support. people.js stands a figure on the first hit of a ray from H + 1.2 (and
  // 0.12 m either side) on the page's collider: a table, a counter, a cask, a hidden collider or a wall top under that
  // ray lifts it. What the root stands on decides:
  //   the ground                          fine, unless the map puts it on a floor or deck above (below_support)
  //   a hidden collider or an edge wall   FAIL hidden_collider (it stands on something invisible)
  //   a prop, vehicle, seat or animal     FAIL furniture
  //   a building or structure             a floor or deck if the same surface continues round the root (6 of 8 points
  //                                       0.3 m out, within 8 cm): fine (WARN raised_floor when the map says ground and
  //                                       it is > 5 cm over the ground); else a ledge, curb, rail base or wall top:
  //                                       FAIL furniture (ledge)
  if (rec.kind === 'figure' || (crew && rec.boat?.haul)) { // a boat's haulers stand on the bank like figures (fix-boats)
    const sup = rec.map?.support || 'ground';
    const on = standOn.owner ? bare(standOn.owner) : 'nothing';
    const groundH = world.vertical(root[0], root[1], fGround).map((v) => v.h).sort((a, b) => Math.abs(a - root[2]) - Math.abs(b - root[2]))[0];
    const visUnder = (excludeOwner) => {
      // the visible surface under the root, up to 3 cm above it (a nocol deck drawn 1 mm over its hidden collider)
      const u = surfaceUnderFoot([root[0], root[1], root[2]], 0.03, (t) => fVisibleAny(t) && world.owners[world.owner[t]] !== excludeOwner);
      return u ? u.h : groundH ?? 0;
    };
    const ck = { class: 'support', support: sup, on, root_H: r3(root[2]), map_H: rec.map?.H ?? 0, raise_m: U.furniture.raise_m };
    const hidden = standOn.t !== null && (world.hiddenMat[world.mat[standOn.t]] || isEdge(standOn.owner || ''));
    const kindOf = (o) => (/^S\w+\.(\w+)\./.exec(o) || [])[1] || o;
    const k = standOn.owner ? kindOf(on) : 'none';
    let fail = null;
    if (Number.isFinite(rec.root_h)) {
      // placed by its own height (people.json root_h, people.js P2): it rests on its seat and its soles' support, which its contacts judge
      ck.kind = 'root_h';
    } else if (!standOn.owner || isGroundOwner(standOn.owner)) {
      ck.kind = 'ground';
      if (!/^(ground|bank|water)/.test(sup) && !/^(cart bed|sedan|vehicle)/.test(sup) && (rec.map?.H || 0) - root[2] > 0.1) {
        const u = surfaceUnderFoot([root[0], root[1], rec.map.H], 0.15, fVisibleNonGround);
        if (u && u.h - root[2] > U.furniture.raise_m) { ck.raise = r3(root[2] - u.h); fail = { class: 'below_support', value: ck.raise, with: [bare(u.owner)], note: `support "${sup}" at ${r3(u.h)} (${bare(u.owner)}); root on the ground at ${r3(root[2])}` }; }
      }
    } else if (hidden) {
      ck.kind = 'hidden';
      ck.raise = r3(root[2] - visUnder(null));
      if (ck.raise > U.furniture.raise_m) fail = { class: 'hidden_collider', value: ck.raise, with: [on], note: `stands on an invisible collider of ${on} ${ck.raise} m over the visible surface (support "${sup}", map H ${rec.map?.H ?? 0})` };
    } else if (['prop', 'veh', 'fig', 'ani'].includes(k)) {
      ck.kind = 'furniture';
      ck.raise = r3(root[2] - visUnder(standOn.owner));
      if (ck.raise > U.furniture.raise_m) fail = { class: 'furniture', value: ck.raise, with: [on], note: `stands on ${on} ${ck.raise} m over the surface under it (support "${sup}")` };
    } else {
      // a building or structure: a floor or deck, or a ledge
      let same = 0;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4, x = root[0] + 0.3 * Math.cos(a), d = root[1] + 0.3 * Math.sin(a);
        const h = pred.ground(x, d, root[2] + 0.3);
        if (h.owner === standOn.owner && Math.abs(h.y - root[2]) <= 0.08) same++;
      }
      ck.ring_same = same;
      if (same >= 6) {
        ck.kind = 'floor';
        if (/^(ground|bank)/.test(sup) && groundH !== undefined && root[2] - groundH > U.furniture.raise_m) { ck.raise = r3(root[2] - groundH); ck.status = 'WARN'; ck.note = `on the floor of ${on}, ${ck.raise} m over the ground (map support ${sup})`; }
      } else {
        ck.kind = 'ledge';
        const low = [];
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          low.push(pred.ground(root[0] + 0.3 * Math.cos(a), root[1] + 0.3 * Math.sin(a), root[2] + 0.3).y);
        }
        ck.raise = r3(root[2] - median(low));
        if (ck.raise > U.furniture.raise_m) fail = { class: 'furniture', value: ck.raise, with: [on], note: `stands on a ledge, step or rail base of ${on}: ${ck.raise} m over the surface round it (only ${same} of 8 points 0.3 m out on the same level)` };
      }
    }
    ck.status = fail ? 'FAIL' : ck.status || 'PASS';
    res.checks.push(ck);
    if (fail) res.fails.push(fail);
    const now = standOn.y;
    const dy = rec.root[1] - now;
    if (Math.abs(dy) > U.order.diff_m && !Number.isFinite(rec.root_h)) {   // root_h: placed by its own height
      res.checks.push({ class: 'order', placed: r3(rec.root[1]), all_loaded: r3(now), on: standOn.owner ? bare(standOn.owner) : null, status: 'FAIL' });
      res.fails.push({ class: 'order', value: r3(now - rec.root[1]), with: [standOn.owner ? bare(standOn.owner) : 'ground'], note: `placed at H ${r3(rec.root[1])}; with every section loaded the ground hook gives ${r3(now)} (${standOn.owner ? bare(standOn.owner) : '-'})` });
    }
  }
  // ---- boat crews (fix-boats): on the visible deck, head not through a roof, nothing of the boat in the body, the pole
  // not through the boat, the tow line on its tracker's shoulder
  if (crew && rec._instant) for (const x of [crewChecks(world, rec, W, clips, U), poleThrough(world, rec, W, clips), towCheck(rec, W, clips, towOf)]) { res.checks.push(...x.checks); res.fails.push(...x.fails); }
  // ---- universal: body cylinder (not riders: no body of their own)
  if (!rider) {
    const R = U.body_cylinder.r_m, [lo, hi] = U.body_cylinder.band_m;
    const worst = new Map();
    for (const t of world.near(root[0], root[1], R + 0.05)) {
      if (!world.isCollide(t)) continue;
      const o = world.owner[t], on = world.owners[o];
      if (isEdge(on) || isGroundOwner(on) || isWater(on) || exempt.has(o) || world.isBoatTri?.(t)) continue; // boats: crewChecks boat_body
      const d = bandPlanDist(t, root[0], root[1], root[2] + lo, root[2] + hi);
      if (d < R) worst.set(o, Math.max(worst.get(o) || 0, R - d));
    }
    const list = [...worst.entries()].sort((a, b) => b[1] - a[1]);
    const ov = list.length ? list[0][1] : 0;
    const ck = { class: 'body_cylinder', overlap: r3(ov), with: list.slice(0, 3).map(([o, v]) => [bare(world.owners[o]), r3(v)]), fail_m: U.body_cylinder.fail_overlap_m };
    ck.status = ov > U.body_cylinder.fail_overlap_m ? 'FAIL' : ov > U.body_cylinder.warn_overlap_m ? 'WARN' : 'PASS';
    res.checks.push(ck);
    if (ck.status === 'FAIL') res.fails.push({ class: 'body_cylinder', value: ck.overlap, with: [ck.with[0][0]], note: `the ${R} m body overlaps ${ck.with[0][0]} by ${ck.overlap} m at body height` });
  }
  // ---- universal: head inside geometry; body sites inside closed collide pieces
  const headWorst = new Map(), siteWorst = new Map();
  const fHead = (t) => visible(t) && ownerIsSolidThing(oName(t)) && !world.isBoatTri?.(t); // boats (open shells): crewChecks head_through
  const step = (n) => Math.max(1, Math.floor(n / 40)); // at most ~40 samples a clip
  for (const c of clips) {
    const S = W[c.drawn];
    const n = S.head_top.length, st = step(n);
    for (let i = 0; i < n; i += st) {
      const p = S.head_top[i];
      for (const o of insideOwners(p, fHead)) {
        const d = depthIn(p, o, fHead);
        if (Number.isFinite(d) && d > (headWorst.get(o)?.d || 0)) headWorst.set(o, { d, clip: c.asked });
      }
      for (const site of U.site_inside.sites) {
        const q = S[site]?.[i];
        if (!q) continue;
        for (const o of insideOwners(q, fCollideVisibleThing)) {
          const d = depthIn(q, o, fCollideVisibleThing);
          const key = `${o}|${site}`;
          if (Number.isFinite(d) && d > (siteWorst.get(key)?.d || 0)) siteWorst.set(key, { d, o, site, clip: c.asked });
        }
      }
    }
  }
  const hw = [...headWorst.entries()].sort((a, b) => b[1].d - a[1].d)[0];
  const hck = { class: 'head_inside', depth: hw ? r3(hw[1].d) : 0, with: hw ? [bare(world.owners[hw[0]])] : [], clip: hw?.[1].clip || null, pen_m: U.head_inside.pen_m };
  hck.status = hw && hw[1].d > U.head_inside.pen_m ? 'FAIL' : 'PASS';
  res.checks.push(hck);
  if (hck.status === 'FAIL') res.fails.push({ class: 'head_inside', value: hck.depth, with: hck.with, clip: hck.clip });
  // a site inside its own contact target or seat is judged by that contact's pen_m, not here
  const sw = [...siteWorst.values()].filter((v) => !exempt.has(v.o) || v.d > 0.1).sort((a, b) => b.d - a.d);
  const sck = { class: 'site_inside', depth: sw.length ? r3(sw[0].d) : 0, worst: sw.slice(0, 4).map((v) => ({ site: v.site, with: bare(world.owners[v.o]), depth: r3(v.d), clip: v.clip })), pen_m: U.site_inside.pen_m };
  sck.status = sw.length && sw[0].d > U.site_inside.pen_m ? 'FAIL' : 'PASS';
  res.checks.push(sck);
  if (sck.status === 'FAIL') res.fails.push({ class: 'site_inside', value: sck.depth, with: [sck.worst[0].with], site: sck.worst[0].site, clip: sck.worst[0].clip });
  if (walker) res.notes.push('walker: checked at the dump instant, on its walk clip');
  if (rider) res.notes.push('rider: placed on its animal every frame; body cylinder and stance soles not judged');
  return res;
}

// ---------------------------------------------------------------- boat crews (fix-boats)
// a crew member at every instant of the dump (its own, then each frozen clock time of `boat_samples`), with the boats
// near it posed there (tools/lib/boat_world.mjs); one result: the dump instant's checks, every FAIL of any instant
// (the worst value, the instants it failed at), per instant the count of FAILs
const towCache = new Map();
function towOf(boatId) {
  if (!towCache.has(boatId)) {
    const b = boatWorld?.boats.get(boatId);
    let tow = null;
    try { tow = JSON.parse(fs.readFileSync(path.join(QM, `web/public/assets/${b.section}/people.json`), 'utf8')).boats?.[boatId.split('.').slice(2).join('.')]?.tow || null; } catch { /* none */ }
    towCache.set(boatId, tow);
  }
  return towCache.get(boatId);
}
// a figure off the boats whose clip needs one (haul_line on a bank, fend_pole's far end on a boat): checked with the
// boats posed at the dump instant
function usesBoatRule(rec) {
  return rec.kind !== 'animal' && stepsOf(rec).some(([c]) => (ruleOf(c, c).contacts || []).some((r) => r.target === 'boat' || r.target === 'reach'));
}
function checkCrew(rec) {
  const W0 = world;
  let main = null;
  const per = [];
  try {
    for (const it of crewInstants(dump, rec)) {
      // the boats within 40 m of the crew member at this instant (and its own), posed; the rest left out
      const near = [...boatWorld.boats.values()].filter((b) => {
        const R = it.poses?.[b.id]?.root || b.rest;
        return b.id === rec.boat?.id || Math.hypot(R[12] - it.root[0], R[14] - it.root[2]) < 40;
      }).map((b) => b.id).sort();
      const key = `${it.tag}|${near.join(',')}`;
      world = boatWorld.posedBy === key ? boatWorld : boatWorld.pose(it.poses, key, new Set(near));
      const r = checkPerson({ ...rec, root: it.root, yaw: it.yaw, ...(rec.boat?.haul && it.clip ? { do: [[it.clip, 1]] } : {}), _instant: it.tag });
      per.push({ instant: it.tag, t: it.t, fails: r.fails.length, classes: [...new Set(r.fails.map((f) => f.class))] });
      if (!main) { main = r; for (const f of main.fails) f.at = [it.tag]; continue; }
      for (const f of r.fails) {
        const m = main.fails.find((g) => g.class === f.class && g.clip === f.clip && g.site === f.site);
        if (!m) { main.fails.push({ ...f, at: [it.tag] }); continue; }
        m.at.push(it.tag);
        if (f.value !== null && (m.value === null || Math.abs(f.value) > Math.abs(m.value))) Object.assign(m, { value: f.value, with: f.with, note: f.note });
      }
    }
  } finally { world = W0; }
  if (!main) return { id: rec.id, section: rec.section, kind: rec.kind, checks: [], fails: [], notes: ['boat crew: no instant'] };
  main.covered = true;
  main.boat = rec.boat?.id || null;
  main.instants = per;
  main.root = rec.root;
  main.notes.push(rec.boat ? `boat crew on ${rec.boat.id}${rec.boat.haul ? ' (hauler on the bank)' : ''}: checked at ${per.length} instants (${per.map((x) => x.instant).join(', ')})` : 'its clip needs a boat: checked with the boats posed at the dump instant');
  return main;
}

// a boat crew member's geometry queries at the dump instant (fix-boats: tools/crew_ik_targets.mjs): fn() runs with the
// boats posed as the dump has them (its own boat and every boat within 40 m), the sections' world restored after
export function atCrewInstant(rec, fn) {
  if (!boatWorld || !rec.boat) return fn();
  const W0 = world;
  try {
    const near = [...boatWorld.boats.values()].filter((b) => { const R = dump.boats?.[b.id]?.root || b.rest; return b.id === rec.boat.id || Math.hypot(R[12] - rec.root[0], R[14] - rec.root[2]) < 40; }).map((b) => b.id).sort();
    const key = `dump|${near.join(',')}`;
    world = boatWorld.posedBy === key ? boatWorld : boatWorld.pose(dump.boats, key, new Set(near));
    return fn();
  } finally { world = W0; }
}

// ---------------------------------------------------------------- targets (tools/ik_targets.mjs)
// what a contact rule touches nearest to the map point p = [X, D, H], resolved as checkPerson resolves it:
// { q: nearest point, n: the unit normal from the surface towards p (out of an animal or a table, up off a seat), d,
//   owner, rod? } or null
export function nearestTarget(rec, rule, p, onlyOwner = null, level = null) {
  const T = world.T;
  // level: only geometry within +-level m of p's height (reach across to a heap's side, not down to its rim)
  const atLevel = (t) => { if (!level) return true; const o = t * 9; return Math.min(T[o + 2], T[o + 5], T[o + 8]) <= p[2] + level && Math.max(T[o + 2], T[o + 5], T[o + 8]) >= p[2] - level; };
  const triNormal = (t, toward) => {
    const o = t * 9, a = [T[o], T[o + 1], T[o + 2]], b = [T[o + 3], T[o + 4], T[o + 5]], c = [T[o + 6], T[o + 7], T[o + 8]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
    const s = (toward[0] - a[0]) * n[0] + (toward[1] - a[1]) * n[1] + (toward[2] - a[2]) * n[2];
    return s < 0 ? n.map((x) => -x) : n;
  };
  const fromTri = (t, owner) => { const r = world.closest(t, p); return { q: r.q, d: r.d, n: triNormal(t, p), owner }; };
  if (rule.target === 'vehicle') {
    const tg = resolveTargets(rec, 'vehicle');
    if (rule.feature) {
      const rods = tg.oids.flatMap((o) => world.rods(o, { minLen: rule.feature === 'pole' ? 1.5 : 0.5 }).map((r) => ({ ...r, owner: world.owners[o] })));
      let best = null;
      for (const r of rods) {
        const ab = [r.b[0] - r.a[0], r.b[1] - r.a[1], r.b[2] - r.a[2]], L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
        const t = Math.max(0, Math.min(1, ((p[0] - r.a[0]) * ab[0] + (p[1] - r.a[1]) * ab[1] + (p[2] - r.a[2]) * ab[2]) / L2));
        const q = [r.a[0] + ab[0] * t, r.a[1] + ab[1] * t, r.a[2] + ab[2] * t], d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
        if (!best || d < best.d) best = { q, d, n: [(p[0] - q[0]) / d, (p[1] - q[1]) / d, (p[2] - q[2]) / d], owner: r.owner, rod: { a: r.a, b: r.b, r: r.r } };
      }
      if (best) return best;
    }
    const set = new Set(tg.oids);
    const n = world.nearest(p, 3, (t) => set.has(world.owner[t]) && fVisibleAny(t) && atLevel(t));
    return n ? fromTri(n.t, world.owners[world.owner[n.t]]) : null;
  }
  if (rule.target === 'animal' || rule.target === 'ridden') {
    const tg = resolveTargets(rec, rule.target);
    let best = null;
    for (const a of tg.animals) {
      for (const [x, y, z] of animalMesh(a) || []) {
        if (level && (Math.min(x[2], y[2], z[2]) > p[2] + level || Math.max(x[2], y[2], z[2]) < p[2] - level)) continue;
        const r = closestOnTri(p, x, y, z);
        if (!best || r.d < best.d) {
          const u = [y[0] - x[0], y[1] - x[1], y[2] - x[2]], v = [z[0] - x[0], z[1] - x[1], z[2] - x[2]];
          let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          const l = Math.hypot(...n) || 1; n = n.map((c) => c / l);
          if ((p[0] - x[0]) * n[0] + (p[1] - x[1]) * n[1] + (p[2] - x[2]) * n[2] < 0) n = n.map((c) => -c);
          best = { q: r.q, d: r.d, n, owner: `${a.section}/${a.id}` };
        }
      }
    }
    // the normal was turned towards p: if p is inside the animal, outward is the other way
    if (best && soupSigned(p, soupOf(tg.animals.flatMap((a) => animalMesh(a) || []))) < 0) best.n = best.n.map((x) => -x);
    return best;
  }
  const f0 = rule.target === 'seat' || rule.target === 'floor' ? fVisibleAny : fVisibleNonGround;
  const filter = (t) => f0(t) && atLevel(t) && (!onlyOwner || bare(oName(t)) === onlyOwner);
  const n = world.nearest(p, 0.8, filter);
  return n ? fromTri(n.t, world.owners[world.owner[n.t]]) : null;
}
// the map-frame track of a site of a clip for a placement record, and the map -> root frame of that record
export function siteTrack(rec, clip, site) {
  const tr = track(rec.model);
  const c = tr?.clips[clip];
  if (!c) return null;
  const toMap = toMapFn(rec), a = c.sites[site], out = [];
  for (let i = 0; i < a.length; i += 3) out.push(toMap(a[i], a[i + 1], a[i + 2]));
  return out;
}
export function toRootFn(rec) {
  const [px, py, pz] = rec.root, c = Math.cos(rec.yaw), s = Math.sin(rec.yaw);
  const k = rec.model_scale ? rec.scale / rec.model_scale : 1;
  // inverse of toMapFn: map [X, D, H] -> page (X, H, -D) -> minus the root, turned back by the yaw, over the scale
  return ([X, D, H], dir = false) => {
    const dx = X - (dir ? 0 : px), dy = H - (dir ? 0 : py), dz = -D - (dir ? 0 : pz);
    const x = dx * c - dz * s, z = dx * s + dz * c;
    return dir ? [x, dy, z] : [x / k, dy / k, z / k];
  };
}

// ---------------------------------------------------------------- run
function main() {
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const quiet = args.includes('--quiet');
const which = !args[0] || args[0].startsWith('--') || args[0] === 'all' ? SECTIONS : [args[0]];
const t0 = Date.now();
// --engine proposed (with --predict): as the page would place and draw everyone with the details pass's engine patches
// (gen/details/contacts/fix_s4/engine_patches.md): clip ground offsets (gen/details/joints_proposed/), riders seated by
// their seat site, figures standing on visible colliders only, root_h for figures up on a vehicle's seat
const engine = opt('--engine', 'page');
if (engine === 'proposed' && !args.includes('--predict')) { console.error('--engine proposed needs --predict (the page dump is today\'s engine)'); process.exit(1); }
// --placements <file>: another dump than gen/details/placements.json (fix-boats: the boats' frozen-clock dump)
setup({ engine, placements: opt('--placements') ? JSON.parse(fs.readFileSync(path.resolve(QM, opt('--placements')), 'utf8')) : null });
// --predict: the static figures, animals and riders of the checked sections placed from the current people.json
// (tools/place_predict.mjs predictDump), not from the page dump: for iterating on fixes without a page load. Results
// go to --out-dir (default gen/details/contacts/predicted/), never over the measurement record.
const predict = args.includes('--predict');
if (predict) setup({ placements: predictCrewDump(predictDump(dump, pred, { sections: which, source: opt('--source', 'sections') }), boatWorld, { sections: which, source: opt('--source', 'sections') }), worldIn: world });
const OUTD = opt('--out-dir') ? path.resolve(QM, opt('--out-dir')) : predict ? path.join(OUT, engine === 'proposed' ? 'predicted_proposed' : 'predicted') : OUT;
fs.mkdirSync(OUTD, { recursive: true });
const tLoad = Date.now() - t0;
const all = [];
const perSection = {};
for (const s of which) {
  const ts = Date.now();
  const people = dump.people.filter((p) => p.section === s && p.kind !== 'animal');
  const results = people.map(checkPerson);
  const v = verify.find((x) => x.section === s);
  const sec = { section: s, owners: v ? v.status : 'unverified', excluded_owners: v?.exclude_owners || [], people: results.length,
    checked: results.filter((r) => r.kind !== 'crew' || r.covered).length, crew_not_covered: results.filter((r) => r.kind === 'crew' && !r.covered).length,
    fails: results.reduce((a, r) => a + r.fails.length, 0), figures_failing: results.filter((r) => r.fails.length).length, seconds: (Date.now() - ts) / 1000, results };
  perSection[s] = sec;
  all.push(...results);
  fs.writeFileSync(path.join(OUTD, `${s}.json`), JSON.stringify(sec, null, 1));
  if (!quiet) console.log(`${s.padEnd(15)} ${String(results.length).padStart(4)} people, ${String(sec.figures_failing).padStart(3)} failing, ${String(sec.fails).padStart(4)} fails  (${sec.seconds.toFixed(1)} s)`);
}

// ---------------------------------------------------------------- summary
const fails = all.flatMap((r) => r.fails.map((f) => ({ ...f, id: r.id, section: r.section, model: r.model, kind: r.kind })));
const by = (key) => { const m = {}; for (const f of fails) { const k = key(f); m[k] = (m[k] || 0) + 1; } return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1])); };
const classOf = (f) => (f.class === 'contact:seat' && f.note?.startsWith('no seat') ? 'contact:seat (no seat)' : f.cause ? `${f.class} (${f.cause})` : f.class);
const table = {};
for (const s of which) {
  table[s] = {};
  for (const f of fails.filter((x) => x.section === s)) {
    const k = classOf(f);
    const e = (table[s][k] ||= { n: 0, worst: null, worst_id: null });
    e.n++;
    if (f.value !== null && f.value !== undefined && (e.worst === null || Math.abs(f.value) > Math.abs(e.worst))) { e.worst = f.value; e.worst_id = f.id; }
  }
}
// clip-level causes: a character clip whose own soles stand off flat ground (people.js grounds by the lowest foot bone,
// not the mesh): one fix per (model, clip) clears every figure listed
const clipLevel = {};
for (const r of all) for (const c of r.checks) {
  if (c.cause !== 'clip' || c.status !== 'FAIL') continue;
  const clip = c.class === 'stance_soles' ? '(standing clips)' : c.clip;
  const key = `${r.model}:${clip}:${c.site || 'stance'}`;
  const e = (clipLevel[key] ||= { model: r.model, clip, site: c.site || 'lower sole', offset_m: c.clip_offset, figures: [] });
  e.figures.push(`${r.section}/${r.id}`);
}
const worst = fails.filter((f) => f.value !== null && f.class !== 'clip_missing').sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 30);
const summary = {
  about: 'tools/contact_check.mjs: FAIL counts per section and defect class (worst = the largest |value| in metres: a contact\'s gap or penetration at its hold-quantile, a raise, an overlap or a depth), per clip, and the worst 30.',
  date: new Date().toISOString(), sections: which, owners_load_ms: tLoad, seconds: (Date.now() - t0) / 1000,
  people: all.length, checked: all.filter((r) => r.kind !== 'crew' || r.covered).length, crew_not_covered: all.filter((r) => r.kind === 'crew' && !r.covered).length,
  figures_failing: all.filter((r) => r.fails.length).length, fails: fails.length,
  by_class: by(classOf), by_clip: by((f) => (f.clip ? `${f.clip}:${f.class}` : f.class)), table, worst,
  clip_level: Object.values(clipLevel).sort((a, b) => b.figures.length - a.figures.length),
  contacts_checked: all.reduce((a, r) => a + r.checks.filter((c) => c.class === 'contact' && (c.status === 'PASS' || c.status === 'FAIL')).length, 0),
  contacts_failing: all.reduce((a, r) => a + r.checks.filter((c) => c.class === 'contact' && c.status === 'FAIL').length, 0),
};
const sumPath = opt('--json') ? path.resolve(QM, opt('--json')) : path.join(OUTD, which.length === SECTIONS.length ? 'summary.json' : `summary_${which.join('_')}.json`);
fs.writeFileSync(sumPath, JSON.stringify(summary, null, 1));
// markdown table
const classes = [...new Set(Object.values(table).flatMap((t) => Object.keys(t)))].sort();
let md = `# Contact check (${summary.date.slice(0, 16)})\n\n${summary.people} people in ${which.length} sections; ${summary.checked} checked (${summary.crew_not_covered} boat crew not covered). ` +
  `${summary.figures_failing} people with at least one FAIL; ${summary.fails} FAILs. Contacts: ${summary.contacts_failing} of ${summary.contacts_checked} FAIL.\n\n` +
  `Cells: FAIL count / worst value in metres (the figure).\n\n| section | ${classes.join(' | ')} |\n|---|${classes.map(() => '---').join('|')}|\n`;
for (const s of which) md += `| ${s} | ${classes.map((k) => (table[s][k] ? `${table[s][k].n} / ${table[s][k].worst ?? '-'}${table[s][k].worst_id ? ` (${table[s][k].worst_id})` : ''}` : '')).join(' | ')} |\n`;
md += `\n## Worst 30\n\n| # | section | figure | model | class | clip | site | value m | with | note |\n|---|---|---|---|---|---|---|---|---|---|\n`;
worst.forEach((f, i) => { md += `| ${i + 1} | ${f.section} | ${f.id} | ${f.model} | ${classOf(f)} | ${f.clip || ''} | ${f.site || ''} | ${f.value} | ${(f.with || []).join(', ')} | ${(f.note || '').replace(/\|/g, '/')}${f.rel ? ` above ${f.rel.above_m}, side ${f.rel.side_m}` : ''} |\n`; });
md += `\n## Clip-level sole offsets (one fix per character clip)\n\n| model | clip | site | clip's own sole height m | figures |\n|---|---|---|---|---|\n`;
for (const e of summary.clip_level) md += `| ${e.model} | ${e.clip} | ${e.site} | ${e.offset_m} | ${e.figures.length} |\n`;
md += `\n## FAILs per clip\n\n${Object.entries(summary.by_clip).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`;
fs.writeFileSync(sumPath.replace(/\.json$/, '.md'), md);
console.log(`contact_check: ${summary.people} people, ${summary.figures_failing} failing, ${summary.fails} FAILs (${Object.entries(summary.by_class).map(([k, v]) => `${k} ${v}`).join(', ')}); ${summary.seconds} s -> ${path.relative(QM, sumPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
