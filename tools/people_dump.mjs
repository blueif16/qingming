#!/usr/bin/env node
// Final placements, as the page makes them: one load of the whole world (world.html?window=all), then every figure,
// walker, rider, boat crew and animal of every section as people.js placed it: id, section, character or model, root
// world position, yaw, scale, its `do` cycle, its support, and the hits of a vertical ray through its root against
// each section's collider (name of the mesh hit: g_ground, g_timber ..., or hidden), so the checks know the ground
// under a figure with the furniture left out. The truth the contact checks use (gen/details/brief_contacts.md).
//   tools/chrome_slot.sh node tools/people_dump.mjs [--url http://127.0.0.1:5190] [--out gen/details/placements.json]
// What people.js does (and what this captures):
//   figure   root = (X + nudge[0], ground(x, z, H + 1.2), -(D + nudge[1])), yaw = facing_deg + 90 deg (the rig faces +Z),
//            ground = the highest of three downward rays at x, x +- 0.12 from H + 1.2 (raycastFirst on every loaded
//            collider, hidden colliders included): captured as root + `ground_hook` (the hook asked again now)
//   rider    hips on the animal's saddle point every frame (people.update): captured at the dump instant
//   crew     a boat's host() places it every frame in the boat's frame: captured at the dump instant (`boat`)
//   walker   moves along its path: captured at the dump instant with its path
//   animal   addAnimal: map pos + nudge, grounded the same way, yaw from hind to fore hooves (or facing_deg)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = opt('--url', 'http://127.0.0.1:5190');
const out = path.resolve(QM, opt('--out', 'gen/details/placements.json'));
// boats (fix-boats, details pass): --boatflow moored|painted|waves sets the page's boat mode (default: the page's own
// choice by tier); --boat-times 0,5,10 also writes the boats and their crews at those frozen clock times (seconds after
// every boat's start, the page's own boats.step from a reset), as `boat_samples`
const boatflow = opt('--boatflow', null);
const boatTimes = opt('--boat-times', null) ? opt('--boat-times').split(',').map(Number).filter(Number.isFinite) : [];
const ALL = fs.readFileSync(path.join(QM, 'web/world.html'), 'utf8').match(/data-sections="([^"]+)"/)[1].split(',');

const t0 = Date.now();
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
await page.setViewportSize({ width: 640, height: 360 });
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
let dump;
try {
  await page.goto(`${base}/world.html?window=all&sound=0&tier=high&adapt=0&start=0${boatflow ? `&boatflow=${boatflow}` : ''}`);
  await page.waitForFunction(() => window.__test, null, { timeout: 300000 });
  // every section in, with its people
  await page.waitForFunction((n) => {
    const T = window.__test;
    return T.loaded.size >= n && [...T.loaded.values()].every((s) => Array.isArray(s.persons));
  }, ALL.length, { timeout: 600000, polling: 1000 });
  await page.evaluate(() => window.__test.stream.settle());
  await page.waitForTimeout(1500); // a few frames: riders and crews are placed by people.update
  dump = await page.evaluate(() => {
    const T = window.__test, THREE = T.THREE, P = T.people;
    const r4 = (x) => Math.round(x * 1e4) / 1e4;
    const ray = new THREE.Ray();
    // every hit of a vertical ray at (x, z) on each loaded section's collider: [y, mesh name or 'hidden', section]
    const hitsAt = (x, z) => {
      ray.set(new THREE.Vector3(x, 60, z), new THREE.Vector3(0, -1, 0));
      const hits = [];
      for (const s of T.loaded.values()) {
        if (!s.bvh) continue;
        for (const h of s.bvh.raycast(ray, THREE.DoubleSide)) {
          const r = s.floorVerts.find(([i0, i1]) => h.face.a >= i0 && h.face.a < i1);
          hits.push([r4(h.point.y), r ? r[2] : 'hidden', s.name]);
        }
      }
      return hits.sort((a, b) => b[0] - a[0]);
    };
    const attached = new Set(P.attached.map((a) => a.p));
    const riders = new Map(P.riders.map((r) => [r.p, r]));
    const out = { sections: {}, people: [] };
    for (const [name, s] of T.loaded) {
      const spec = s.people || {}, figs = spec.figures || {}, walkers = spec.walkers || [], animals = spec.animals || {};
      const byId = Object.fromEntries(s.layout.figures.map((f) => [f.id, f]));
      out.sections[name] = { section: s.layout.section, persons: s.persons.length, collider_tris: s.colliderTris };
      for (const p of s.persons) {
        const q = p.root.position, a = P.agentOf.get(p);
        const isAnimal = Object.prototype.hasOwnProperty.call(animals, p.id) && !!p.body && !figs[p.id];
        const w = a?.path ? walkers.find((x) => x.id === p.id || x.figure === p.id) : null;
        const f = byId[p.id] || (w && byId[w.figure]) || null;
        const sp = isAnimal ? animals[p.id] : (figs[p.id] || w || {});
        const rider = riders.get(p);
        const e = isAnimal ? s.layout.entities[`${s.layout.section}.ani.${p.id}`] : null;
        const H = isAnimal ? (e?.H || 0) : (f?.H || 0);
        const rec = {
          id: p.id, section: name, kind: isAnimal ? 'animal' : rider ? 'rider' : attached.has(p) ? 'crew' : a?.path ? 'walker' : 'figure',
          model: p.model.name, character: sp.character || sp.model || null, stand_in: sp.stand_in || null,
          root: [r4(q.x), r4(q.y), r4(q.z)], yaw: r4(p.root.rotation.y), scale: r4(p.root.scale.x), model_scale: r4(p.model.scene.scale.x),
          clip: p.clip, do: sp.do || null, props: sp.props || null, load: sp.load || null, nudge: sp.nudge || null, facing_deg: sp.facing_deg ?? null,
          spec_scale: sp.scale ?? null, ride: sp.ride || null, carried_by: sp.carried_by || null, root_h: sp.root_h ?? null,
          map: f ? { X: f.X, D: f.D, H: f.H || 0, facing_deg: f.facing_deg, support: f.support || null, pose: f.pose || null, group: f.group || null, map_id: f.map_id }
            : e ? { X: e.pos[0], D: e.pos[1], H: e.H || 0, facing_deg: e.facing_deg, support: e.support || null, map_id: `${s.layout.section}.ani.${p.id}`, fore: e.pts?.fore, hind: e.pts?.hind } : null,
          body: p.body ? { r: p.body.r, along: p.body.along } : null,
          loads: p.loads || null,
          ground_hook: rec0(P.hooks.ground(q.x, q.z, H + 1.2)),
          hits: hitsAt(q.x, q.z).filter((h) => h[0] > q.y - 4 && h[0] < q.y + 6),
        };
        if (rider) rec.rider_of = rider.beast.id;
        if (a?.path) rec.path = a.path.p.map((v) => [r4(v.x), r4(-v.y)]);
        out.people.push(rec);
      }
    }
    // the boats at this instant (fix-boats): each painted boat's root matrix (page frame), its lod 0 nodes' matrices
    // relative to the root (holders: body, sweep, oar_*, mast, line_*; three's GLTFLoader drops [].:/ from node names),
    // its motion state; each crew member's boat and its spot as boats.js host() set it (crewSpots: local, node, yaw)
    const boatState = (b) => {
      const suf = (':' + b.id).replace(/[\[\].:/]/g, '');
      const nodes = {};
      for (const h of b.lods[0].root.children) {
        if (!h.name.endsWith(suf)) continue;
        h.updateMatrix();
        nodes[h.name.slice(0, -suf.length)] = Array.from(h.matrix.elements, (x) => Math.round(x * 1e6) / 1e6);
      }
      return { id: b.id, section: b.section, root: Array.from(b.roots[0].matrixWorld.elements, (x) => Math.round(x * 1e6) / 1e6), nodes,
        state: b.state, s: r4(b.s), effort: r4(b.effort), clock: r4(b.clock), flow: !!b.flow, hidden: !!b.hidden, under: !!b.under };
    };
    const B = T.boats;
    if (B) {
      out.boats = {};
      out.boats_t = r4(B.t);
      const crewBoat = new Map();
      for (const b of B.list) {
        if (b.extra) continue;
        out.boats[b.id] = boatState(b);
        const spots = new Map((b.crewSpots || []).map((c) => [c.id, c]));
        const suf = (':' + b.id).replace(/[\[\].:/]/g, '');
        for (const id of b.crew) {
          const c = spots.get(id);
          crewBoat.set(`${b.section}/${id}`, { id: b.id, haul: !!b.spec?.haul?.[id], work: b.spec?.crew?.[id]?.work || null,
            spot: c ? { local: [r4(c.local.x), r4(c.local.y), r4(c.local.z)], node: c.node ? c.node.name.slice(0, -suf.length) : null, yaw: r4(c.yaw) } : null });
        }
      }
      for (const rec of out.people) { const cb = rec.kind === 'crew' && crewBoat.get(`${rec.section}/${rec.id}`); if (cb) rec.boat = cb; }
    }
    function rec0(y) { return Math.round(y * 1e4) / 1e4; }
    out.clip_meta_n = Object.keys(T.clipMeta || {}).length;
    return out;
  });
  // the boats at frozen clock times (fix-boats): every painted boat back to its start (boats.js add(): clock = hash(id) * 4,
  // at rest), boats.t = 0, then the page's own boats.step at 20 Hz up to t, boats.update (moving parts, ropes) and every
  // attached person's place (crews, haulers); the boats, the crews' roots and clips at that instant
  if (boatTimes.length) {
    dump.boat_samples = [];
    for (const tt of boatTimes) {
      dump.boat_samples.push(await page.evaluate((tt) => {
        const T = window.__test, B = T.boats, P = T.people;
        const r4 = (x) => Math.round(x * 1e4) / 1e4;
        const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
        for (const b of B.list) { if (b.extra || b.flow) continue; b.clock = hash(b.id) * 4; b.state = 'rest'; b.s = 0; b.effort = 0; b.atRest = true; b.wave = 0; }
        B.t = 0;
        const dt = 0.05, n = Math.round(tt / dt);
        for (let i = 0; i < n; i++) B.step(dt);
        if (!n) B.step(0);
        B.update(0, T.camera);
        for (const a of P.attached) a.place(a.p, 0.2);
        const boats = {};
        for (const b of B.list) {
          if (b.extra) continue;
          const suf = (':' + b.id).replace(/[\[\].:/]/g, '');
          const nodes = {};
          for (const h of b.lods[0].root.children) { if (!h.name.endsWith(suf)) continue; h.updateMatrix(); nodes[h.name.slice(0, -suf.length)] = Array.from(h.matrix.elements, (x) => Math.round(x * 1e6) / 1e6); }
          boats[b.id] = { root: Array.from(b.roots[0].matrixWorld.elements, (x) => Math.round(x * 1e6) / 1e6), nodes, state: b.state, s: r4(b.s), effort: r4(b.effort), flow: !!b.flow };
        }
        const crew = {};
        for (const [name, s] of T.loaded) for (const p of s.persons || []) {
          if (!P.attached.some((a) => a.p === p)) continue;
          const q = p.root.position;
          crew[`${name}/${p.id}`] = { root: [r4(q.x), r4(q.y), r4(q.z)], yaw: r4(p.root.rotation.y), clip: p.clip };
        }
        return { t: tt, boats_t: r4(B.t), boats, crew };
      }, tt));
    }
  }
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
dump.about = 'tools/people_dump.mjs: every person and animal as the page placed them (world.html?window=all). root/yaw/scale = '
  + 'p.root; page frame x = X, y = H, z = -D. hits = a vertical ray through the root on each section\'s collider: [y, mesh, section] '
  + '(mesh "hidden" = a collider-only mesh). ground_hook = people.js hooks.ground(x, z, H + 1.2) asked again at dump time.';
dump.date = new Date().toISOString();
dump.url = `${base}/world.html?window=all&sound=0&tier=high&adapt=0&start=0${boatflow ? `&boatflow=${boatflow}` : ''}`;
dump.seconds = (Date.now() - t0) / 1000;
dump.page_log = logs.slice(0, 50);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(dump, null, 0));
const kinds = {};
for (const p of dump.people) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
console.log(`people_dump: ${dump.people.length} in ${Object.keys(dump.sections).length} sections ${JSON.stringify(kinds)} in ${dump.seconds} s -> ${path.relative(QM, out)}`);
