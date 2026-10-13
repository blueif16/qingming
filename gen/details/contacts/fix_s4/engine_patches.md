# Engine patches proposed by fix-S4 (details pass, contacts), 2026-10-13

For the performance session 3d-director-04, which owns `web/src/`. Each patch is an exact text replacement (file, old
text, new text). The data they read is already written; the page ignores it until a patch lands. Simulated numbers
come from `tools/lib/three_node.mjs` `applyProposed` and `tools/place_predict.mjs` (engine `proposed`), with
`node tools/contact_check.mjs <section> --predict --engine proposed`.

Status (2026-10-13, 03:30):
- P1 and P2 landed: S4 outer_road on the page dump, 1 of 64 figures failing (the child at S4b's table across the seam, an
  S4b builder item; see `notes.md`). Before P1, the same fixes predicted 20 failing.
- P3 landed and was withdrawn (see below).
- P4 is described, not landed.

The S4 fits (sedan poles, the fortune-teller's table and stools, the IK variants' targets) are made for the
proposed frame, where each clip's own soles touch the ground. Until P1 lands, those figures stand 3-5 cm off.

## P1. Clip ground offsets (`sole_m`) and the rider's seat (`seat_m`) from `clip_meta.json`

**Why.** `prepareClip` grounds a clip by its lowest foot bone, not by its mesh soles. 102 of 344 static clips stand
3 cm or more off flat ground (`gen/details/contacts/clip_ground.json`):
- the bearer's standing clips are 3-5 cm into the ground;
- the scholar's `sit` floats 12 cm;
- the soldier's floor sits put the seat 6-7 cm into the floor.

`tools/clip_ground.mjs` measures each clip on the mesh (from the joint tracks) and writes:
- `sole_m` (metres to add) by posture:
  - standing: the lower sole;
  - chair: the middle of the two soles;
  - floor and lying: the lowest of seat and soles;
- `seat_m` for ride clips: the seat site's height over the root.

Both are already in `web/public/assets/clip_meta.json` (357 clips), and `--add-missing` adds entries for clips the
last precompute hadn't seen. People.js ignores both fields today.

**A trap this patch also closes.** gltf-transform's dedup merges identical accessors, so two clips can share one hips
`values` array: an IK variant that leaves the hips alone shared its base clip's. `prepareClip` adds `k` to that array
in place, so a shared array was lifted twice: the base clip moved with its variant's grounding.
- `tools/ik_clip.mjs` now writes each variant its own hips track.
- The guard below makes the page safe anyway.

File `web/src/people.js`, near the top (after `const LOW_BONES = ...`):

old:
```js
const LOW_BONES = /(Foot|ToeBase|Leg|Hips)$/;
```
new:
```js
const LOW_BONES = /(Foot|ToeBase|Leg|Hips)$/;
// a hips values array two clips share (gltf-transform dedup) is grounded once
const GROUNDED = new WeakSet();
```

File `web/src/people.js`, `prepareClip`, the known branch:

old:
```js
    clip.userData = { speed: known.speed, locomotion: known.locomotion, stride: known.stride, hipsY: known.hipsY };
    if (known.locomotion) for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
    if (known.k) { for (let i = 1; i < v.length; i += 3) v[i] += known.k; clip.userData.grounded = known.grounded; }
    return known;
```
new:
```js
    clip.userData = { speed: known.speed, locomotion: known.locomotion, stride: known.stride, hipsY: known.hipsY, seatY: known.seat_m };
    if (known.locomotion) for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
    // sole_m (tools/clip_ground.mjs, measured on the mesh): metres more, so the clip's own soles (a floor sit's seat)
    // touch the ground, not just its lowest foot bone
    let k = known.k || 0;
    if (known.sole_m) { const ws = new THREE.Vector3(); root.getObjectByName(hipsTrack.name.split('.')[0]).parent.getWorldScale(ws); k += known.sole_m / ws.y; }
    if (k && !GROUNDED.has(v)) { for (let i = 1; i < v.length; i += 3) v[i] += k; GROUNDED.add(v); clip.userData.grounded = known.grounded; }
    return known;
```

File `web/src/people.js`, `update()`, riders:

old:
```js
      _q.set(s[0], s[1] + 0.09, s[2]).applyMatrix4(_m4.compose(beast.root.position, beast.root.quaternion, beast.root.scale));
      const hy = p.model.clips.find((c) => c.name === p.clip)?.userData?.hipsY ?? 0.9;
      p.root.position.set(_q.x, _q.y - hy * p.root.scale.y, _q.z);
```
new:
```js
      // the clip's seat site on the saddle point (clip_meta seat_m), else the hips 0.09 m over it
      const ud = p.model.clips.find((c) => c.name === p.clip)?.userData;
      const onSeat = Number.isFinite(ud?.seatY);
      _q.set(s[0], s[1] + (onSeat ? 0 : 0.09), s[2]).applyMatrix4(_m4.compose(beast.root.position, beast.root.quaternion, beast.root.scale));
      p.root.position.set(_q.x, _q.y - (onSeat ? ud.seatY : ud?.hipsY ?? 0.9) * p.root.scale.y, _q.z);
```

File `tools/people_precompute.mjs`: keep the mesh-measured fields when a clip is measured again.

old:
```js
  let merged = {};
  if (pos.length && !pos.includes('all')) { try { merged = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* none yet */ } }
  let files = 0, clips = 0;
  for (const [file, cs] of Object.entries(meta)) {
    const e = (merged[file] = {});
    for (const [clip, m] of Object.entries(cs)) { if (!m) continue; e[clip] = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, sig(v)])); clips++; }
```
new:
```js
  let merged = {}, old = {};
  try { old = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* none yet */ }
  if (pos.length && !pos.includes('all')) merged = old;
  let files = 0, clips = 0;
  for (const [file, cs] of Object.entries(meta)) {
    const prev = old[file] || {};
    const e = (merged[file] = {});
    for (const [clip, m] of Object.entries(cs)) {
      if (!m) continue;
      e[clip] = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, sig(v)]));
      // the mesh-measured ground and seat offsets (tools/clip_ground.mjs) survive a re-measure of the same clip
      const p = prev[clip];
      if (p && p.n === e[clip].n && Math.abs(p.duration - e[clip].duration) < 1e-4) for (const k of ['sole_m', 'seat_m']) if (p[k] !== undefined) e[clip][k] = p[k];
      clips++;
    }
```

After P1 lands:
- run `node tools/clip_ground.mjs --write-meta`: it measures the residual against the applied `sole_m` and writes old +
  residual;
- the joint tracks (`tools/joint_tracks.mjs all`) then read the page's own result. `PAGE_APPLIES_SOLE` in
  `three_node.mjs` stops the simulation, because people.js now contains `sole_m`.

## P2. A figure seated up on a vehicle: `root_h`

**Why.** A driver on a cart's seat has his feet hanging. people.js stands every figure on the ground under its root,
so S4's `ox_driver_seated_9815` sat 0.7 m low, under the seat of S5's covered cart. Inner_city's wagon-top riders and
the drivers of S1 and S3 are the same case.

people.json `root_h` is the root's height: the seat's top less the clip's seat height. The data is set for S4's
driver (`sections/outer_road/contact_fixes.json`).

File `web/src/people.js`, `addFigure`:

old:
```js
    p.root.position.set(x, this.hooks.ground(x, z, (f.H || 0) + 1.2), z);
```
new:
```js
    // root_h: a figure seated up on a vehicle, feet hanging (people.json; gen/details/contacts/fix_standard.md)
    p.root.position.set(x, Number.isFinite(spec.root_h) ? spec.root_h : (this.hooks.stand || this.hooks.ground)(x, z, (f.H || 0) + 1.2), z);
```
(`hooks.stand` is P3; with P2 alone, keep `this.hooks.ground`.)

## P3. Figures and animals stand on visible floors, not on hidden colliders: WITHDRAWN

**Withdrawn on 2026-10-13, after 3d-director-04 landed it.** The fresh dump showed 73 Rainbow Bridge deck figures on the ground under the bridge:
- rail_watcher_19862: support "bridge deck" at 2.164 m, root at -1.136 m;
- deck_rail_leaner_19715: deck at 3.843 m, root at 0.

The bridge's visible stepped deck is nocol, and its walkable surface is the hidden ramp, so `floorUnder` (visible
collide meshes only) finds nothing on the deck. The 24 figures 6-16 cm over the steps are a builder fix for S3, not an
engine one:
- give the steps a collider (hidden step blocks) where figures stand on them;
- or nudge each figure to stand on a landing.

I asked 04 to revert. The text below is kept as the record of what was proposed.

**Why.** Rainbow Bridge has 24 figures 6-16 cm over the visible stepped deck: they stand on the hidden walk ramp.
Trees' trunk capsules and edge walls can lift a figure the same way. The walker's collider should stay as it is: a
ramp makes walking smooth. Only static figures and animals should take the visible floor. `floorUnder` already finds
it, through `floorVerts`.

File `web/src/world.js`, after `function dropToSupport(...) {...}`:

old:
```js
// the visible floor under a point (ground, deck, wall top), never the hidden colliders: from above, a tree's probe
```
new:
```js
// the highest visible floor at or below fromY (floorVerts: a section's visible collide meshes), never a hidden collider
// (a walk ramp over steps, a trunk's capsule, an edge wall): where static figures and animals stand
function dropToVisible(x, z, fromY) {
  floorRay.set(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0));
  let top = null;
  for (const sec of sections.values()) {
    if (!sec.bvh) continue;
    for (const h of sec.bvh.raycast(floorRay, THREE.DoubleSide)) {
      if ((top === null || h.point.y > top) && sec.floorVerts.some(([i0, i1]) => h.face.a >= i0 && h.face.a < i1)) top = h.point.y;
    }
  }
  return top ?? 0;
}

// the visible floor under a point (ground, deck, wall top), never the hidden colliders: from above, a tree's probe
```
(`floorRay` is declared just below. Move its `const floorRay = new THREE.Ray();` line above `dropToVisible`.)

File `web/src/world.js`, hooks:

old:
```js
  ground: (x, z, fromY) => Math.max(dropToSupport(x, z, fromY), dropToSupport(x + 0.12, z, fromY), dropToSupport(x - 0.12, z, fromY)),
```
new:
```js
  ground: (x, z, fromY) => Math.max(dropToSupport(x, z, fromY), dropToSupport(x + 0.12, z, fromY), dropToSupport(x - 0.12, z, fromY)),
  // static figures and animals: the same three rays on the visible floors only
  stand: (x, z, fromY) => Math.max(dropToVisible(x, z, fromY), dropToVisible(x + 0.12, z, fromY), dropToVisible(x - 0.12, z, fromY)),
```

File `web/src/people.js`, `addAnimal`:

old:
```js
    if (!walker) p.root.position.set(x, info.perch ? (e.H || 0) + (info.perch.rest?.[1] || 0) : this.hooks.ground(x, z, (e.H || 0) + 1.2), z);
```
new:
```js
    if (!walker) p.root.position.set(x, info.perch ? (e.H || 0) + (info.perch.rest?.[1] || 0) : (this.hooks.stand || this.hooks.ground)(x, z, (e.H || 0) + 1.2), z);
```
(`addFigure`'s line is in P2.)

`tools/place_predict.mjs` `Predictor(world, sections, { engine: 'proposed' })` is this rule. Every section's
`people_dump` / `contact_check` needs rerunning after P3: a figure that stood on a hidden collider lands on the
visible surface.

## P4. Seam load order (described, no diff)

Three S6 figures at the S5 seam (`archer_waistguard_5465`, `pole_man_5578`, `crouching_dark_5515`, and
`bearded_carter_5428` in some loads) are grounded before the gate section streams in. They stand on whatever was
loaded at that moment:
- `archer_waistguard_5465` stands on `S5.prop.casks_west_5525` (0.45 m) when the gate loads first;
- he stands on the ground when it loads after.

The fix:
- when a section joins and `rebuildCollider()` has run, ground again the static figures and animals of the
  neighbouring loaded sections that stand within about 3 m of the shared seam;
- the same call people.js makes in `addFigure`/`addAnimal`: `stand`, or `ground` without P3;
- people.js keeps each static person's `f.H`, so it is a loop over those persons:
  `p.root.position.y = hooks.stand(p.root.position.x, p.root.position.z, (f.H || 0) + 1.2)`;
- skip anyone with `root_h`, riders and walkers.

The order check in `contact_check` (`order`) then reads 0 for them.

### P4 as an exact diff (sent 2026-10-13, for review)

File `web/src/world.js`, `loadSection` (the join path):

old:
```js
  await step('collider', () => rebuildCollider());
  for (const w of sec.people.walkers || []) w.path = routePath(sec.layout.route, w.path);
```
new:
```js
  await step('collider', () => rebuildCollider());
  regroundNear(sec); // neighbours' static people grounded before this section's colliders existed (P4)
  for (const w of sec.people.walkers || []) w.path = routePath(sec.layout.route, w.path);
```

File `web/src/world.js`, after `function rebuildCollider() {...}`:

old:
```js
function dropToSupport(x, z, fromY) {
```
new:
```js
// P4 (details pass, gen/details/contacts/fix_s4/engine_patches.md): a static figure or animal of a loaded neighbour
// standing within 3 m of a section that has just joined was grounded before that section's colliders existed (S6's
// archer_waistguard_5465 stands on S5's casks when the gate loads first, on the ground when it loads after): ground it
// again the way addFigure / addAnimal did. Walkers, riders, boat crews, root_h figures and perched animals keep theirs.
function regroundNear(sec) {
  const poly = sec.layout.painted_area.corners;
  const segD = (x, d, a, b) => {
    const ex = b[0] - a[0], ed = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (d - a[1]) * ed) / (ex * ex + ed * ed || 1)));
    return Math.hypot(x - a[0] - t * ex, d - a[1] - t * ed);
  };
  const near = (x, d) => poly.some((a, i) => segD(x, d, a, poly[(i + 1) % poly.length]) < 3);
  const moving = new Set([...people.riders.map((r) => r.p), ...people.attached.map((a) => a.p)]);
  for (const n of sections.values()) {
    if (n === sec || !n.persons) continue;
    const figs = n.people.figures || {}, anis = n.people.animals || {};
    const byId = Object.fromEntries(n.layout.figures.map((f) => [f.id, f]));
    for (const p of n.persons) {
      if (moving.has(p) || people.agentOf.get(p)?.path) continue;
      const q = p.root.position;
      if (!near(q.x, -q.z)) continue;
      const f = figs[p.id] ? byId[p.id] : null;
      const e = !f && anis[p.id] ? n.layout.entities[`${n.layout.section}.ani.${p.id}`] : null;
      if ((!f && !e) || Number.isFinite(figs[p.id]?.root_h) || (e && people.models[anis[p.id].model]?.info?.perch)) continue;
      q.y = hooks.ground(q.x, q.z, ((f || e).H || 0) + 1.2);
    }
  }
}

function dropToSupport(x, z, fromY) {
```
To check on review:
- whether `crowd.js` reads a static person's root matrix every frame, or only once when it is baked; if only once, the
  person needs a matrix refresh after `q.y` changes;
- that `people.agentOf`, `people.riders` and `people.attached` are the people.js fields `tools/people_dump.mjs` reads.

Expected: the 4 S5-seam figures (`archer_waistguard_5465`, `pole_man_5578`, `crouching_dark_5515`,
`bearded_carter_5428`) agree with `tools/place_predict.mjs` in every load order. `contact_check`'s `order` reads 0.
