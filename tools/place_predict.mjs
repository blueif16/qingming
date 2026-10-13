#!/usr/bin/env node
// Predict where people.js stands a static figure or animal, without the page: from layout.json + people.json + the
// built geometry by owner (gen/sections/<name>/owners.*). The fixers' solver uses it to try a nudge without reloading.
// people.js addFigure: root = (X + nudge[0], ground(x, z, H + 1.2), -(D + nudge[1])), yaw = facing_deg + 90 deg;
// world.js hooks.ground = the highest of three raycastFirst hits straight down from H + 1.2 at x, x + 0.12, x - 0.12
// (page x = map X) on the whole collider: every loaded section's __col meshes, hidden ones included, plus the edge walls
// that are not on a seam between two loaded sections; no hit = 0. people.json root_h overrides it (a figure seated up on
// a vehicle, P2). Animals the same (addAnimal), unless perched.
//   node tools/place_predict.mjs [--placements gen/details/placements.json] [--json out]   (compares with the dump)
//   import { Predictor } from './place_predict.mjs'; new Predictor(world).ground(X, D, H)   (for a solver)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { World, QM } from './lib/owners_index.mjs';
import { crewSpot } from './lib/boat_world.mjs';
import { crewPlace } from './lib/boat_contacts.mjs';

export const SECTIONS = ['city_end', 'inner_city', 'gate', 'outer_road', 'outer_road_2', 'rainbow_bridge', 'canal', 'countryside'];

// the edge walls the page keeps with these sections loaded (world.js seams()): a side on a seam between two loaded
// sections is dropped
export function keptEdges(sections) {
  const lay = Object.fromEntries(sections.map((s) => [s, JSON.parse(fs.readFileSync(path.join(QM, `web/public/assets/${s}/layout.json`), 'utf8'))]));
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05;
  const seam = new Set();
  for (const a of sections) for (const b of sections) {
    if (a === b) continue;
    const [, ase, ane] = lay[a].painted_area.corners, [bsw, , , bnw] = lay[b].painted_area.corners;
    if (near(ase, bsw) && near(ane, bnw)) { seam.add(`${a}|edge:east`); seam.add(`${b}|edge:west`); }
  }
  return seam;
}

// owners to leave out because the rebuild added them and they are not live (tools/owners_verify.mjs)
export function driftExclusions() {
  const f = path.join(QM, 'gen/details/contacts/owners_verify.json');
  if (!fs.existsSync(f)) return {};
  return Object.fromEntries(JSON.parse(fs.readFileSync(f, 'utf8')).map((r) => [r.section, r.exclude_owners || []]));
}

export class Predictor {
  // Static figures and animals stand where world.js hooks.ground puts them: the highest of three raycastFirst hits on
  // the whole collider (hidden meshes included, the edge walls not on a seam); a figure with people.json root_h stands
  // at that height (P2, landed 2026-10-13). engine 'visible': P3's rule (floorUnder: visible collide meshes only),
  // landed and withdrawn the same day: the Rainbow Bridge's visible steps are nocol and its walkable surface is the
  // hidden ramp, so 73 deck figures fell to the ground under the bridge (gen/details/contacts/fix_s4/engine_patches.md).
  constructor(world, sections = SECTIONS, { engine = 'page' } = {}) {
    this.w = world;
    this.engine = engine;
    const dropped = keptEdges(sections);
    this.filter = engine === 'visible'
      ? (t) => world.isCollide(t) && !world.hiddenMat[world.mat[t]]
      : (t) => world.isCollide(t) && !dropped.has(world.owners[world.owner[t]]);
  }

  // hooks.ground(x, z, fromY) at map (X, D) from height H0: [height, hit owner]
  ground(X, D, H0) {
    let best = null;
    for (const dx of [0, 0.12, -0.12]) {
      const h = this.w.firstDown(X + dx, D, H0, this.filter);
      const y = h ? h.h : 0;
      if (!best || y > best.y) best = { y, owner: h ? this.w.owners[this.w.owner[h.t]] : null, t: h ? h.t : null, dx };
    }
    return best;
  }

  // a figure or animal's root as people.js places it: { X, D, H, yaw, owner }
  figure(f, spec) {
    const [nx, nd] = spec.nudge || [0, 0];
    const X = f.X + nx, D = f.D + nd;
    const g = this.ground(X, D, (f.H || 0) + 1.2);
    // a figure seated up on a vehicle's seat with its feet hanging takes its root height from people.json root_h (the
    // seat's top less the clip's seat height), not from the ground under it (people.js addFigure, P2)
    if (Number.isFinite(spec.root_h)) return { X, D, H: spec.root_h, owner: 'root_h', yaw: ((spec.facing_deg ?? f.facing_deg ?? 0) * Math.PI) / 180 + Math.PI / 2 };
    return { X, D, H: g.y, owner: g.owner, yaw: ((spec.facing_deg ?? f.facing_deg ?? 0) * Math.PI) / 180 + Math.PI / 2 };
  }
}

// The dump with the static figures, animals and riders of `sections` placed from the current people.json (source
// 'sections': sections/<s>/people.json, the casting's output; 'web': web/public/assets/<s>/people.json, what the page
// loads), as people.js would place them: for checking a fix before a page load (tools/contact_check.mjs --predict,
// tools/contact_solve.mjs). Walkers and boat crews keep the dump's (they move). A figure's model is its character when
// the registry has it, else its stand_in (world.js); its scale factor over the model's own is spec.scale.
export function predictDump(dump, pred, { sections = null, source = 'sections' } = {}) {
  const rd = (p) => JSON.parse(fs.readFileSync(path.join(QM, p), 'utf8'));
  const reg = rd('web/public/assets/chars/characters.json');
  const beasts = rd('web/public/assets/animals/animals.json');
  const proposed = pred.engine === 'proposed';
  const clipOf = (model, clip) => {
    const f = path.join(QM, `gen/details/${proposed ? 'joints_proposed' : 'joints'}/${model}.json`);
    if (!fs.existsSync(f)) return {};
    return JSON.parse(fs.readFileSync(f, 'utf8')).clips[clip] || {};
  };
  // people.js update: the clip's seat site on the saddle point (clip_meta seat_m, P1), else the hips 0.09 m over it
  const riderLift = (model, clip) => { const c = clipOf(model, clip); return Number.isFinite(c.seatY) ? -c.seatY : 0.09 - (c.hipsY ?? 0.9); };
  const specs = {};
  const people = dump.people.map((p) => ({ ...p }));
  const deg = (d) => (d * Math.PI) / 180;
  for (const p of people) {
    if (sections && !sections.includes(p.section)) continue;
    const pj = (specs[p.section] ||= rd(source === 'web' ? `web/public/assets/${p.section}/people.json` : `sections/${p.section}/people.json`));
    if (p.kind === 'figure' && p.map) {
      const spec = pj.figures?.[p.id];
      if (!spec) continue;
      const q = pred.figure(p.map, spec);
      const model = reg[spec.character] ? spec.character : spec.stand_in || spec.character;
      Object.assign(p, { root: [q.X, q.H, -q.D], yaw: q.yaw, scale: spec.scale || 1, model_scale: 1, model, character: spec.character, root_h: q.owner === 'root_h' ? spec.root_h : null,
        do: spec.do || null, nudge: spec.nudge || null, facing_deg: spec.facing_deg ?? null, props: spec.props || null, predicted: true });
    } else if (p.kind === 'animal' && !p.path && p.map) {
      const spec = pj.animals?.[p.id];
      if (!spec) continue;
      const [nx, nd] = spec.nudge || [0, 0];
      const X = p.map.X + nx, D = p.map.D + nd;
      const info = beasts[spec.model] || {};
      const H = info.perch ? (p.map.H || 0) + (info.perch.rest?.[1] || 0) : pred.ground(X, D, (p.map.H || 0) + 1.2).y;
      const f = p.map.fore, h = p.map.hind;
      const facing = spec.facing_deg ?? (f && h && Math.hypot(f[0] - h[0], f[1] - h[1]) > 0.05 ? (Math.atan2(f[1] - h[1], f[0] - h[0]) * 180) / Math.PI : p.map.facing_deg ?? 0);
      Object.assign(p, { root: [X, H, -D], yaw: deg(facing) + Math.PI / 2, predicted: true });
    }
  }
  // riders: the hips 0.09 m over the saddle point of the (predicted) animal, turned with it (people.js update)
  for (const p of people) {
    if (p.kind !== 'rider' || (sections && !sections.includes(p.section))) continue;
    const pj = specs[p.section];
    const spec = pj?.figures?.[p.id];
    const beast = people.find((q) => q.section === p.section && q.kind === 'animal' && q.id === (p.rider_of || spec?.ride));
    if (!spec || !beast) continue;
    const info = beasts[beast.model] || {};
    const s = (beast.loads || []).map((n) => info.tack?.[n]?.saddle_rest).find(Boolean) || info.saddle?.rest || [0, 1.0, 0];
    const k = beast.scale, c = Math.cos(beast.yaw), sn = Math.sin(beast.yaw);
    const lx = s[0] * k, ly = s[1] * k, lz = s[2] * k;
    const model = reg[spec.character] ? spec.character : spec.stand_in || spec.character;
    const clip = (spec.do || [['ride']])[0][0];
    const turn = deg(spec.ride_turn_deg ?? ((spec.do || []).some(([cl]) => cl === 'ride_side') ? 90 : 0));
    const sc = spec.scale || 1;
    Object.assign(p, { root: [beast.root[0] + lx * c + lz * sn, beast.root[1] + ly + riderLift(model, clip) * sc, beast.root[2] - lx * sn + lz * c],
      yaw: beast.yaw + turn, scale: sc, model_scale: 1, model, do: spec.do || null, predicted: true });
  }
  return { ...dump, people, predicted_from: source };
}

// Boat crews (fix-boats): each crew member on a boat placed from the current people.json (its nudge, facing and its
// boat's crew job) by boats.js host() in node (tools/lib/boat_world.mjs crewSpot: the spot in the boat's frame at rest),
// then carried by the dump instant's boat matrices (the page's place()); `predicted_spot` keeps the boat-local spot for
// the frozen clock times (tools/lib/boat_contacts.mjs crewInstants). Haulers on the bank keep the dump's (they walk with
// their boat). boatWorld: tools/lib/boat_world.mjs BoatWorld (its `boats`); null leaves the crews as dumped.
export function predictCrewDump(dump, boatWorld, { sections = null, source = 'sections', specs: given = null } = {}) {
  if (!boatWorld || !dump.boats) return dump;
  const rd = (p) => JSON.parse(fs.readFileSync(path.join(QM, p), 'utf8'));
  const specs = { ...(given || {}) }; // given: { <section>: people.json } (a solver's trial)
  const people = dump.people.map((p) => {
    if (p.kind !== 'crew' || !p.boat || p.boat.haul || !p.map || (sections && !sections.includes(p.section))) return p;
    const pj = (specs[p.section] ||= rd(source === 'web' ? `web/public/assets/${p.section}/people.json` : `sections/${p.section}/people.json`));
    const spec = pj.figures?.[p.id];
    const b = boatWorld.boats.get(p.boat.id);
    if (!spec || !b) return p;
    const f = { id: p.id, X: p.map.X, D: p.map.D, H: p.map.H, facing_deg: p.map.facing_deg, support: p.map.support, pose: p.map.pose };
    const sp = crewSpot(b, f, spec, pj.boats?.[p.boat.id.split('.').slice(2).join('.')]?.crew || pj.boats?.[p.boat.id]?.crew || {});
    const spot = { local: sp.local, node: sp.node, yaw: sp.yaw };
    const at = crewPlace(spot, dump.boats[p.boat.id], p);
    return { ...p, root: at.root, yaw: at.yaw, do: spec.do || null, props: spec.props || null, nudge: spec.nudge || null, facing_deg: spec.facing_deg ?? null,
      boat: { ...p.boat, spot: { local: spot.local.map((x) => Math.round(x * 1e4) / 1e4), node: spot.node, yaw: Math.round(spot.yaw * 1e4) / 1e4 } }, predicted_spot: spot, predicted: true };
  });
  return { ...dump, people };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const t0 = Date.now();
  const dump = JSON.parse(fs.readFileSync(path.resolve(QM, opt('--placements', 'gen/details/placements.json')), 'utf8'));
  const world = World.load(SECTIONS, { exclude: driftExclusions() });
  const tLoad = Date.now() - t0;
  const pr = new Predictor(world);
  const beasts = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/animals/animals.json'), 'utf8'));
  const rows = [], specs = {};
  for (const p of dump.people) {
    if (!(p.kind === 'figure' || (p.kind === 'animal' && !p.path)) || !p.map) continue;
    // root_h comes with the dump since 2026-10-13; an older dump: from the shipped people.json
    const pj = (specs[p.section] ||= JSON.parse(fs.readFileSync(path.join(QM, `web/public/assets/${p.section}/people.json`), 'utf8')));
    const q = pr.figure(p.map, { ...p, root_h: p.root_h ?? pj.figures?.[p.id]?.root_h });
    // a perched animal (animals.json perch: the bird) sits at its mapped H + the perch's rest height, not on the ground
    const perch = p.kind === 'animal' && beasts[p.model]?.perch;
    if (perch) { q.H = (p.map.H || 0) + (perch.rest?.[1] || 0); q.owner = 'perch'; }
    const dy = p.root[1] - q.H, dx = p.root[0] - q.X, dz = p.root[2] + q.D;
    // the hook asked again once every section is in: a figure placed before a neighbour streamed in may differ
    const dyNow = perch || q.owner === 'root_h' ? dy : p.ground_hook - q.H; // a perched animal or a root_h figure is not grounded: compare its dump
    rows.push({ id: p.id, section: p.section, kind: p.kind, dump_H: p.root[1], pred_H: +q.H.toFixed(4), dy: +dy.toFixed(4), dy_now: +dyNow.toFixed(4), dxz: +Math.hypot(dx, dz).toFixed(4), owner: q.owner });
  }
  const bad = rows.filter((r) => Math.abs(r.dy) > 0.01 || r.dxz > 0.01);
  const badNow = rows.filter((r) => Math.abs(r.dy_now) > 0.01 || r.dxz > 0.01);
  const maxAbs = (k, list) => list.reduce((m, r) => Math.max(m, Math.abs(r[k])), 0);
  const okRows = rows.filter((r) => !bad.includes(r));
  const out = { max_dy_agreeing_m: +maxAbs('dy', okRows).toFixed(4), max_dy_now_m: +maxAbs('dy_now', rows).toFixed(4), about: 'tools/place_predict.mjs vs the page dump: dy = dump root H - predicted (placement time); dy_now = the page\'s ground hook asked again with every section in - predicted', tolerance_m: 0.01,
    n: rows.length, disagree: bad.length, disagree_now: badNow.length, seconds: (Date.now() - t0) / 1000, load_ms: tLoad, worst: [...rows].sort((a, b) => Math.abs(b.dy) - Math.abs(a.dy)).slice(0, 15), disagreeing: bad, disagreeing_now: badNow };
  if (opt('--json')) fs.writeFileSync(path.resolve(QM, opt('--json')), JSON.stringify(out, null, 1));
  console.log(`place_predict: ${rows.length} static figures and animals; ${rows.length - bad.length} agree with the dump within 1 cm (${bad.length} differ); against the hook asked now: ${rows.length - badNow.length} agree (${badNow.length} differ, max ${out.max_dy_now_m} m); agreeing ones within ${out.max_dy_agreeing_m} m; ${out.seconds} s (owners load ${tLoad} ms)`);
  for (const r of bad.slice(0, 12)) console.log(`  ${r.section}/${r.id}: dump ${r.dump_H}, predicted ${r.pred_H} (${r.owner}), now ${(r.dy_now + r.pred_H).toFixed(4)}`);
  // boat crews (fix-boats): the spot boats.js host() gave each (the dump's crewSpots) against crewSpot in node, and the
  // root the page placed against that spot carried by the dump instant's boat matrices
  if (dump.boats) {
    const { BoatWorld, loadBoatOwners } = await import('./lib/boat_world.mjs');
    const bw = BoatWorld.extend(world, loadBoatOwners());
    const pd = predictCrewDump(dump, bw, { source: 'web' });
    const crow = [];
    for (const [i, p] of dump.people.entries()) {
      if (p.kind !== 'crew' || !p.boat || p.boat.haul || !p.boat.spot) continue;
      const q = pd.people[i];
      if (!q.predicted_spot) { crow.push({ id: p.id, section: p.section, missing: true }); continue; }
      const dl = Math.hypot(...p.boat.spot.local.map((x, k) => x - q.predicted_spot.local[k]));
      const dr = Math.hypot(...p.root.map((x, k) => x - q.root[k]));
      crow.push({ id: p.id, section: p.section, node: p.boat.spot.node, spot_m: +dl.toFixed(4), root_m: +dr.toFixed(4), yaw: +(Math.abs(p.boat.spot.yaw - q.predicted_spot.yaw) % (2 * Math.PI)).toFixed(4) });
    }
    const cbad = crow.filter((r) => r.missing || r.spot_m > 0.01 || r.root_m > 0.02 || r.yaw > 0.01);
    out.crew = { n: crow.length, disagree: cbad.length, worst_spot_m: Math.max(0, ...crow.map((r) => r.spot_m || 0)), worst_root_m: Math.max(0, ...crow.map((r) => r.root_m || 0)), disagreeing: cbad };
    if (opt('--json')) fs.writeFileSync(path.resolve(QM, opt('--json')), JSON.stringify(out, null, 1));
    console.log(`place_predict crews: ${crow.length} on boats; ${crow.length - cbad.length} agree with the page's host() spot within 1 cm (worst spot ${out.crew.worst_spot_m} m, root ${out.crew.worst_root_m} m)`);
    for (const r of cbad.slice(0, 12)) console.log(`  ${r.section}/${r.id}: ${JSON.stringify(r)}`);
  }
}
