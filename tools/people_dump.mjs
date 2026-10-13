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
  await page.goto(`${base}/world.html?window=all&sound=0&tier=high&adapt=0`);
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
          spec_scale: sp.scale ?? null, ride: sp.ride || null, carried_by: sp.carried_by || null,
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
    function rec0(y) { return Math.round(y * 1e4) / 1e4; }
    out.clip_meta_n = Object.keys(T.clipMeta || {}).length;
    return out;
  });
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
dump.about = 'tools/people_dump.mjs: every person and animal as the page placed them (world.html?window=all). root/yaw/scale = '
  + 'p.root; page frame x = X, y = H, z = -D. hits = a vertical ray through the root on each section\'s collider: [y, mesh, section] '
  + '(mesh "hidden" = a collider-only mesh). ground_hook = people.js hooks.ground(x, z, H + 1.2) asked again at dump time.';
dump.date = new Date().toISOString();
dump.url = `${base}/world.html?window=all&sound=0&tier=high&adapt=0`;
dump.seconds = (Date.now() - t0) / 1000;
dump.page_log = logs.slice(0, 50);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(dump, null, 0));
const kinds = {};
for (const p of dump.people) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
console.log(`people_dump: ${dump.people.length} in ${Object.keys(dump.sections).length} sections ${JSON.stringify(kinds)} in ${dump.seconds} s -> ${path.relative(QM, out)}`);
