// The boat crews in the contact checks (fix-boats, details pass; gen/details/brief_contacts_rollout.md): the crew records
// of a dump at its instant and at its frozen clock times (tools/people_dump.mjs `boats`, `boat_samples`), the boats posed
// at each (tools/lib/boat_world.mjs BoatWorld), and the boat rules (characters/contacts.json targets boat, pole, water,
// reach; sites pole_lo, pole_far from tools/prop_tracks.mjs). tools/contact_check.mjs calls these; the generic checks
// (soles, seats, rails, tables) run unchanged on the world with the boats in it.
import fs from 'node:fs';
import path from 'node:path';
import { QM, segDist, closestOnTri } from './owners_index.mjs';
import { BoatWorld, loadBoatOwners, crewSpot, mul4, apply4, inv4, yawOfM, toMapP } from './boat_world.mjs';

export const BOAT_TARGETS = new Set(['boat', 'pole', 'water', 'reach']);
const r3 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? x : Math.round(x * 1000) / 1000);

// ---------------------------------------------------------------- setup
// the World with every section's boats appended (posed per instant later); null when no boat owners exist
export function boatWorldOf(world) {
  const boats = loadBoatOwners();
  if (!boats.size) return null;
  return BoatWorld.extend(world, boats);
}

// the instants a crew record is checked at: the dump's (its own root), then each frozen sample's (the sample's crew
// root, or the record's boat-local spot carried by the sample's boat matrices when the record is predicted)
export function crewInstants(dump, rec) {
  const out = [];
  if (!rec.boat) return [{ tag: 'dump', t: null, poses: dump.boats || null, root: rec.root, yaw: rec.yaw, clip: rec.clip }];
  out.push({ tag: 'dump', t: null, poses: dump.boats || null, root: rec.root, yaw: rec.yaw, clip: rec.clip });
  for (const s of dump.boat_samples || []) {
    const key = `${rec.section}/${rec.id}`;
    let root = s.crew?.[key]?.root, yaw = s.crew?.[key]?.yaw, clip = s.crew?.[key]?.clip;
    if (rec.predicted_spot && !rec.boat.haul) ({ root, yaw } = placeSpot(rec.predicted_spot, s.boats?.[rec.boat.id], rec));
    if (!root) continue;
    out.push({ tag: `t${s.t}`, t: s.t, poses: s.boats, root, yaw, clip });
  }
  return rec._only_dump ? out.slice(0, 1) : out; // a solver's quick look: the dump instant only
}

// a boat-local spot (crewSpot / the dump's crewSpots) placed with a boat pose: the page's host place()
export function placeSpot(spot, pose, rec) {
  const R = pose?.root, N = spot.node ? pose?.nodes?.[spot.node] : null;
  if (!R) return { root: rec.root, yaw: rec.yaw };
  const p = spot.node && N ? apply4(mul4(R, N), ...spot.local) : apply4(R, ...spot.local);
  const yaw = yawOfM(R) + spot.yaw + (spot.node && N ? yawOfM(N) : 0);
  return { root: p.map((x) => Math.round(x * 1e4) / 1e4), yaw: Math.round(yaw * 1e4) / 1e4 };
}

// ---------------------------------------------------------------- prop sites (poles)
const propCache = new Map();
function propsOf(model) {
  if (!propCache.has(model)) {
    const f = path.join(QM, `gen/details/joints/props_${model}.json`);
    propCache.set(model, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  }
  return propCache.get(model);
}
const POLES = ['long_pole_low', 'long_pole_mid', 'long_pole', 'staff'];
// the pole the figure carries (people.json props), its ends per sample of a clip in the map frame: { pole_a, pole_b,
// pole_lo (the lower end), pole_far (the end ahead of the figure), r, prop } or null (no pole carried)
export function poleSites(rec, drawn, toMap, palmR) {
  const carried = [].concat(rec.props || []).find((p) => POLES.includes(p));
  if (!carried) return null;
  const pj = propsOf(rec.model);
  const tr = pj?.props?.[carried]?.clips?.[drawn];
  if (!tr) return null;
  const A = [], B = [], lo = [], far = [];
  for (let i = 0; i < tr.a.length; i += 3) {
    const a = toMap(tr.a[i], tr.a[i + 1], tr.a[i + 2]), b = toMap(tr.b[i], tr.b[i + 1], tr.b[i + 2]);
    A.push(a); B.push(b);
    lo.push(a[2] <= b[2] ? a : b);
    // the far end: the one ahead of the figure (root frame z), the end a fend pole pushes with
    far.push(tr.a[i + 2] >= tr.b[i + 2] ? a : b);
  }
  return { pole_a: A, pole_b: B, pole_lo: lo, pole_far: far, pole_r: pj.props[carried].r, pole_prop: carried };
}

// ---------------------------------------------------------------- boat rules
const ownBoatOids = (world, id, re = null) => world.owners.map((o, i) => [o, i]).filter(([o]) => o.startsWith(`${id}|`) && (!re || re.test(o.split('|')[1]))).map(([, i]) => i);
const isVisible = (world, t) => !world.hiddenMat[world.mat[t]];

// the water's height at (X, D): the sections' water strips under the point, else the boat's water (its rest root)
export function waterAt(world, X, D, boatId) {
  let best = null;
  for (const v of world.vertical(X, D, (t) => /\|water$/.test(world.owners[world.owner[t]]) || /\.water\./.test(world.owners[world.owner[t]]))) if (best === null || v.h > best) best = v.h;
  if (best !== null) return best;
  return boatId ? world.waterH(boatId) : 0;
}

// signed distances (gap > 0) of the sample points pts for a boat rule. W: the clip's sites (pole_a/pole_b for 'pole').
// Returns { vals, with, note }
export function boatRuleVals(world, rec, rule, pts, W) {
  const id = rec.boat?.id;
  const out = { vals: [], with: [], note: null };
  if (rule.target === 'pole') {
    if (!W.pole_a) { out.note = `carries no pole (people.json props: ${JSON.stringify(rec.props || null)})`; out.vals = pts.map(() => 1); return out; }
    out.with = [W.pole_prop];
    pts.forEach((p, i) => out.vals.push(segDist(p, W.pole_a[i], W.pole_b[i]) - W.pole_r));
    return out;
  }
  if (rule.target === 'water') {
    if (!W.pole_a) { out.note = 'carries no pole'; out.vals = pts.map(() => 1); return out; }
    const owners = new Map();
    for (const p of pts) {
      const w = waterAt(world, p[0], p[1], id);
      // the highest visible surface under the end (from 0.15 m above it), the water strips left out
      let s = null;
      for (const v of world.vertical(p[0], p[1], (t) => isVisible(world, t) && !/\|(water|edge:[a-z]+)$/.test(world.owners[world.owner[t]]) && !/\.water\./.test(world.owners[world.owner[t]]))) {
        if (v.h <= p[2] + 0.15 && (!s || v.h > s.h)) s = v;
      }
      if (s && s.h >= w) { out.vals.push(p[2] - s.h); const o = world.owners[world.owner[s.t]]; owners.set(o, (owners.get(o) || 0) + 1); }
      else { out.vals.push(Math.max(0, p[2] - w)); owners.set('water', (owners.get('water') || 0) + 1); }
    }
    out.with = [[...owners.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]].filter(Boolean);
    return out;
  }
  if (rule.target === 'reach') {
    if (!W.pole_a) { out.note = 'carries no pole'; out.vals = pts.map(() => 1); return out; }
    const owners = new Map();
    for (const p of pts) {
      const n = world.nearest(p, 1.0, (t) => isVisible(world, t) && !world.owners[world.owner[t]].startsWith(`${id}|`) && !/\|(water|edge:[a-z]+)$/.test(world.owners[world.owner[t]]) && !/\.water\./.test(world.owners[world.owner[t]]));
      const w = waterAt(world, p[0], p[1], id);
      const dw = Math.max(0, p[2] - w);
      const d = n ? Math.min(n.d, dw) : dw;
      out.vals.push(d);
      const o = n && n.d <= dw ? world.owners[world.owner[n.t]] : 'water';
      owners.set(o, (owners.get(o) || 0) + 1);
    }
    out.with = [[...owners.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]].filter(Boolean);
    return out;
  }
  // target boat: the own boat by feature (a figure off the boats: the boat nearest its root within 4 m)
  if (!id) {
    const root = [rec.root[0], -rec.root[2], rec.root[1]];
    const n = world.isBoatTri ? world.nearest(root, 4, (t) => world.isBoatTri(t) && isVisible(world, t)) : null;
    if (!n) { out.note = 'no boat within 4 m'; out.vals = pts.map(() => 1); return out; }
    return boatRuleVals(world, { ...rec, boat: { id: world.owners[world.owner[n.t]].split('|')[0] } }, rule, pts, W);
  }
  const f = rule.feature;
  if (f === 'tiller') {
    const tip = world.point(id, 'pt_tiller');
    const body = world.ownerId.get(`${id}|body`);
    const rods = body === undefined || !tip ? [] : world.rods(body, { minLen: 0.5, maxR: 0.08 }).filter((r) => segDist(tip, r.a, r.b) < 0.35);
    if (!rods.length) { out.note = 'no tiller bar at pt_tiller (unshipped, or the boat has none)'; out.vals = pts.map(() => 1); return out; }
    out.with = [`${id}|body (tiller)`];
    for (const p of pts) out.vals.push(Math.min(...rods.map((r) => segDist(p, r.a, r.b) - r.r)));
    return out;
  }
  if (f === 'line') {
    const lines = world.lines(id).filter((l) => l.kind === 'rope');
    const ropeOids = new Set(ownBoatOids(world, id));
    const ropeMat = world.matId.get('rope__nocol');
    for (const p of pts) {
      let best = Infinity, bw = null;
      for (const l of lines) { const d = segDist(p, l.a, l.b) - l.r; if (d < best) { best = d; bw = `${id}|${l.name}`; } }
      const n = world.nearest(p, 1.0, (t) => ropeOids.has(world.owner[t]) && world.mat[t] === ropeMat);
      if (n && n.d < best) { best = n.d; bw = world.owners[world.owner[n.t]] + ' (rope)'; }
      out.vals.push(Number.isFinite(best) ? best : 1);
      if (bw) out.with = [bw];
    }
    return out;
  }
  let oids;
  if (f === 'sweep') oids = ownBoatOids(world, id, /^sweep$/);
  else if (f === 'oar') {
    const mine = rec.boat?.spot?.node && /^oar_/.test(rec.boat.spot.node) ? new RegExp(`^${rec.boat.spot.node}$`) : /^oar_/;
    oids = ownBoatOids(world, id, mine);
  } else oids = ownBoatOids(world, id).filter((o) => !/__(col|edge)$/.test(world.owners[o]));
  if (!oids.length) { out.note = `no ${f || 'piece'} on ${id}`; out.vals = pts.map(() => 1); return out; }
  const set = new Set(oids);
  const counts = new Map();
  for (const p of pts) {
    const n = world.nearest(p, 1.5, (t) => set.has(world.owner[t]) && isVisible(world, t));
    if (!n) { out.vals.push(1.5); continue; }
    const inside = world.inside(p, world.owner[n.t]);
    out.vals.push(inside ? -n.d : n.d);
    const o = world.owners[world.owner[n.t]];
    counts.set(o, (counts.get(o) || 0) + 1);
  }
  out.with = [[...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]].filter(Boolean);
  return out;
}

// ---------------------------------------------------------------- crew-only universal checks
// deck_support: the root on the boat's visible deck or roof (the page stands crews on the hidden deck__col / roof__col
// colliders): the root's height over the highest visible surface of its boat within 0.3 m above / 0.6 m below it
// head_through: the line from the hips to the head top crossing a visible piece of a boat (a roof, an awning, a beam)
// boat_body: a visible piece of its own boat inside the body's core (0.15 m round the root's axis, 0.6-1.6 m over it):
// a cabin wall, a mast or the sweep through the torso
export function crewChecks(world, rec, W, clips, U) {
  const id = rec.boat?.id;
  const res = { checks: [], fails: [] };
  if (!id || rec.boat.haul) return res;
  const root = [rec.root[0], -rec.root[2], rec.root[1]];
  const own = new Set(ownBoatOids(world, id).filter((o) => !/__(col|edge)$/.test(world.owners[o])));
  // deck support
  let best = null;
  for (const [dx, dd] of [[0, 0], [0.06, 0], [-0.06, 0], [0, 0.06], [0, -0.06]]) {
    for (const v of world.vertical(root[0] + dx, root[1] + dd, (t) => own.has(world.owner[t]))) if (v.h <= root[2] + 0.3 && v.h >= root[2] - 0.6 && (!best || v.h > best.h)) best = v;
  }
  const raise = best ? root[2] - best.h : null;
  const ck = { class: 'deck_support', boat: id, level: rec.map?.support?.split(':')[0] || null, raise: r3(raise), on: best ? world.owners[world.owner[best.t]] : null, mat: best ? world.mats[world.mat[best.t]] : null, raise_m: U.furniture.raise_m };
  ck.status = raise === null ? 'FAIL' : Math.abs(raise) > U.furniture.raise_m ? 'FAIL' : 'PASS';
  res.checks.push(ck);
  if (ck.status === 'FAIL') res.fails.push({ class: 'deck_support', value: raise === null ? null : r3(raise), with: [id], note: raise === null ? 'no visible deck or roof of its boat within 0.3 m over / 0.6 m under the root' : `the root ${r3(raise)} m ${raise > 0 ? 'over' : 'under'} the visible ${ck.on} (${ck.mat})` });
  // head through / body core, sampled over each clip (at most ~40 samples)
  const anyBoatVisible = (t) => world.isBoatTri(t) && isVisible(world, t) && !/\|(wet__ring|bow_wave)$/.test(world.owners[world.owner[t]]);
  let headWorst = null, coreWorst = null;
  for (const c of clips) {
    const S = W[c.drawn], n = S.head_top.length, st = Math.max(1, Math.floor(n / 40));
    let hits = 0, tot = 0, hitWith = null;
    for (let i = 0; i < n; i += st) {
      tot++;
      const a = S.hips[i], b = S.head_top[i];
      const h = segHit(world, a, b, anyBoatVisible);
      if (h !== null) { hits++; hitWith = world.owners[world.owner[h]]; }
    }
    if (hits && (!headWorst || hits / tot > headWorst.frac)) headWorst = { frac: hits / tot, with: hitWith, clip: c.asked };
  }
  const hck = { class: 'head_through', frac: r3(headWorst?.frac || 0), with: headWorst ? [headWorst.with] : [], clip: headWorst?.clip || null };
  hck.status = headWorst && headWorst.frac > 0.1 ? 'FAIL' : 'PASS';
  res.checks.push(hck);
  if (hck.status === 'FAIL') res.fails.push({ class: 'head_through', value: hck.frac, with: hck.with, clip: hck.clip, note: `hips to head top crosses ${hck.with[0]} in ${Math.round(hck.frac * 100)}% of the samples` });
  // a figure that leans on, pushes or climbs part of its boat (rail, wall, table, structure, boat, vehicle rules) has its
  // torso against that part by design: its body core is not judged (its contacts are)
  const leans = clips.some((c) => (c.rule.contacts || []).some((r) => ['rail', 'wall', 'table', 'structure', 'boat', 'vehicle'].includes(r.target) && r.feature !== 'sweep'));
  // body core: the torso (hips to 0.25 m under the head top, radius 0.12 m) against the visible pieces of its boat, over
  // each clip (~10 samples): the distance from that segment to the nearest piece; overlap = 0.12 - distance
  const R0 = 0.12;
  for (const c of (leans ? [] : clips)) {
    const S = W[c.drawn], n = S.hips.length, st = Math.max(1, Math.floor(n / 10));
    for (let i = 0; i < n; i += st) {
      const a = S.hips[i], h = S.head_top[i];
      const v = [h[0] - a[0], h[1] - a[1], h[2] - a[2]], L = Math.hypot(...v);
      if (L < 0.3) continue;
      const b = [a[0] + (v[0] / L) * (L - 0.25), a[1] + (v[1] / L) * (L - 0.25), a[2] + (v[2] / L) * (L - 0.25)];
      for (const t of world.near((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.5)) {
        if (!own.has(world.owner[t]) || !isVisible(world, t)) continue;
        const d = segTriDist(world, t, a, b);
        if (d < R0 && (!coreWorst || R0 - d > coreWorst.ov)) coreWorst = { ov: R0 - d, with: world.owners[world.owner[t]], h: null, clip: c.asked };
      }
    }
  }
  const cck = { class: 'boat_body', overlap: r3(coreWorst?.ov || 0), with: coreWorst ? [coreWorst.with] : [], clip: coreWorst?.clip || null };
  cck.status = coreWorst && coreWorst.ov > 0.06 ? 'FAIL' : 'PASS';
  res.checks.push(cck);
  if (cck.status === 'FAIL') res.fails.push({ class: 'boat_body', value: cck.overlap, with: cck.with, clip: cck.clip, note: `${cck.with[0]} ${cck.overlap} m into the torso (hips to neck, 0.12 m round)` });
  return res;
}

// distance from segment a-b to triangle t (0 when they cross): the least of the segment's sampled points to the triangle
function segTriDist(world, t, a, b) {
  const T = world.T, o = t * 9;
  const A = [T[o], T[o + 1], T[o + 2]], B = [T[o + 3], T[o + 4], T[o + 5]], C = [T[o + 6], T[o + 7], T[o + 8]];
  let best = Infinity;
  for (let k = 0; k <= 8; k++) {
    const f = k / 8, p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    best = Math.min(best, closestOnTri(p, A, B, C).d);
  }
  return best;
}

// the first triangle (filter) the segment a-b crosses, or null (Moller-Trumbore on the triangles near the segment)
function segHit(world, a, b, filter) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(...d);
  if (L < 1e-6) return null;
  const T = world.T;
  const cand = world.near((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(d[0], d[1]) / 2 + 0.05);
  for (const t of cand) {
    if (!filter(t)) continue;
    const o = t * 9;
    const p0 = [T[o], T[o + 1], T[o + 2]], e1 = [T[o + 3] - p0[0], T[o + 4] - p0[1], T[o + 5] - p0[2]], e2 = [T[o + 6] - p0[0], T[o + 7] - p0[1], T[o + 8] - p0[2]];
    const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
    const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
    if (Math.abs(det) < 1e-12) continue;
    const f = 1 / det, s = [a[0] - p0[0], a[1] - p0[1], a[2] - p0[2]];
    const u = f * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]);
    if (u < 0 || u > 1) continue;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
    const v = f * (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]);
    if (v < 0 || u + v > 1) continue;
    const tt = f * (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]);
    if (tt > 1e-6 && tt < 1) return t;
  }
  return null;
}

// segHit, but crossings under the water surface (out of sight) don't count: the first crossing above the water, or null
function segHitAbove(world, a, b, filter, waterOf) {
  let from = a;
  for (let k = 0; k < 6; k++) {
    const t = segHit(world, from, b, filter);
    if (t === null) return null;
    // where the segment meets that triangle: step past it and go on if it is under the water there
    const T = world.T, o = t * 9;
    const P0 = [T[o], T[o + 1], T[o + 2]], n = (() => { const u = [T[o + 3] - P0[0], T[o + 4] - P0[1], T[o + 5] - P0[2]], v = [T[o + 6] - P0[0], T[o + 7] - P0[1], T[o + 8] - P0[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; })();
    const d = [b[0] - from[0], b[1] - from[1], b[2] - from[2]], den = n[0] * d[0] + n[1] * d[1] + n[2] * d[2];
    const s = Math.abs(den) < 1e-12 ? 0 : ((P0[0] - from[0]) * n[0] + (P0[1] - from[1]) * n[1] + (P0[2] - from[2]) * n[2]) / den;
    const q = [from[0] + d[0] * s, from[1] + d[1] * s, from[2] + d[2] * s];
    if (q[2] > waterOf(q) + 0.02) return t;
    const L = Math.hypot(...d) || 1;
    from = [q[0] + (d[0] / L) * 0.01, q[1] + (d[1] / L) * 0.01, q[2] + (d[2] / L) * 0.01];
  }
  return null;
}

// the pole through its boat: the pole's segment from the right palm to its lower end crossing the boat's visible deck,
// hull or roofs (more than 0.1 m from the hand), as a fraction of the samples
export function poleThrough(world, rec, W, clips) {
  const id = rec.boat?.id;
  const out = { checks: [], fails: [] };
  let worst = null;
  for (const c of clips) {
    const S = W[c.drawn];
    if (!S.pole_a || !['pole_boat', 'stand_pole', 'fend_pole'].includes(c.asked.split('~')[0])) continue;
    const n = S.pole_a.length, st = Math.max(1, Math.floor(n / 40));
    let hits = 0, tot = 0, w = null;
    const filt = (t) => isVisible(world, t) && !/\|(water|edge:[a-z]+|wet__ring|bow_wave)$/.test(world.owners[world.owner[t]]) && !/\.water\./.test(world.owners[world.owner[t]]);
    // a crossing under the water's surface is out of sight (the water is opaque): a pole's foot in the river bed
    for (let i = 0; i < n; i += st) {
      tot++;
      const a = S.pole_a[i], b = S.pole_b[i], pr = S.palm_R[i];
      // from 0.1 m past the right hand along the pole, toward each end
      for (const e of [a, b]) {
        const v = [e[0] - pr[0], e[1] - pr[1], e[2] - pr[2]], L = Math.hypot(...v);
        if (L < 0.2) continue;
        const s0 = [pr[0] + (v[0] / L) * 0.1, pr[1] + (v[1] / L) * 0.1, pr[2] + (v[2] / L) * 0.1];
        // the end itself may rest on a surface: stop 5 cm short of it
        const e0 = [e[0] - (v[0] / L) * 0.05, e[1] - (v[1] / L) * 0.05, e[2] - (v[2] / L) * 0.05];
        const h = segHitAbove(world, s0, e0, filt, (q) => waterAt(world, q[0], q[1], id));
        if (h !== null) { hits++; w = world.owners[world.owner[h]]; break; }
      }
    }
    if (hits && (!worst || hits / tot > worst.frac)) worst = { frac: hits / tot, with: w, clip: c.asked };
  }
  if (!worst && !clips.some((c) => W[c.drawn].pole_a)) return out;
  const ck = { class: 'pole_through', frac: r3(worst?.frac || 0), with: worst ? [worst.with] : [], clip: worst?.clip || null };
  ck.status = worst && worst.frac > 0.1 ? 'FAIL' : 'PASS';
  out.checks.push(ck);
  if (ck.status === 'FAIL') out.fails.push({ class: 'pole_through', value: ck.frac, with: ck.with, clip: ck.clip, note: `the pole passes through ${ck.with[0]} in ${Math.round(ck.frac * 100)}% of the samples` });
  return out;
}

// the tow line's tracker: the line ends at his root + 1.3 m (web/src/boats.js pointNow 'pt_tow_b'): its distance from
// the nearer shoulder top, over his clip at the instant
export function towCheck(rec, W, clips, towOf) {
  const out = { checks: [], fails: [] };
  if (!rec.boat?.haul || towOf?.(rec.boat.id) !== rec.id) return out;
  const end = [rec.root[0], -rec.root[2], rec.root[1] + 1.3];
  const vals = [];
  for (const c of clips) {
    const S = W[c.drawn];
    for (let i = 0; i < S.shoulder_L.length; i++) vals.push(Math.min(...['shoulder_L', 'shoulder_R'].map((k) => Math.hypot(S[k][i][0] - end[0], S[k][i][1] - end[1], S[k][i][2] - end[2]))));
  }
  const s = [...vals].sort((a, b) => a - b), q = s[Math.floor(0.8 * (s.length - 1))];
  const ck = { class: 'contact', clip: clips[0]?.asked, site: 'shoulder', target: 'boat', feature: 'tow', gap_q: r3(q), gap_m: 0.05, with: [`${rec.boat.id}|line_tow`] };
  ck.status = q <= 0.05 ? 'PASS' : 'FAIL';
  out.checks.push(ck);
  if (ck.status === 'FAIL') out.fails.push({ class: 'contact:boat', clip: ck.clip, site: 'shoulder', value: r3(q), kind: 'gap', with: ck.with, note: `the tow line ends at the root + 1.3 m (boats.js), ${r3(q)} m from his nearer shoulder top` });
  return out;
}

// ---------------------------------------------------------------- the predictor's crews
// a crew record placed from the current people.json (spec: nudge, facing, its boat's crew job) by crewSpot (boats.js host
// in node), at the dump instant's boat pose; haulers keep the dump's (they walk with the boat)
export function predictCrew(rec, world, spec, boatSpec) {
  if (!rec.boat || rec.boat.haul) return rec;
  const b = world.boats.get(rec.boat.id);
  if (!b || !rec.map) return rec;
  const f = { id: rec.id, X: rec.map.X, D: rec.map.D, H: rec.map.H, facing_deg: rec.map.facing_deg, support: rec.map.support, pose: rec.map.pose };
  const sp = crewSpot(b, f, spec || {}, boatSpec?.crew || {});
  const spot = { local: sp.local, node: sp.node, yaw: sp.yaw };
  return { ...rec, predicted_spot: spot, spot_moved: sp.moved, spot_missing: sp.missing };
}
export { placeSpot as crewPlace, crewSpot, inv4, toMapP };
