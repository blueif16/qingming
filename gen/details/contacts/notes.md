# Contacts: measurement record (details pass, agent "contacts", 2026-10-13)

Brief: `gen/details/brief_contacts.md`. Check-only: nothing in the world is changed here.

## Log

- 2026-10-13: started. Read plan.md, brief, qingming/CLAUDE.md, skills characters / web-scene / scroll-section.

## Stage 1: per-owner geometry (done)

- `blender/street_b1.py` `Buckets.add`: one added line, `b["o"]`, the owner of each face parallel to `b["f"]` (geometry
  unchanged).
- `blender/owners_dump.py` (new), called from `blender/build_web_scene.py` after `build()` (in a try, never fails a
  build): every loop triangle of the collection's baked meshes with its owner (bucket faces' owners; `ground` for
  g_ground*, `water` for the water strips), map frame X, D, H → `gen/sections/<name>/owners.bin` (float32, 9 per tri,
  sorted by owner, material) + `owners.json` (owner → [[first_tri, count, "<mat>__col|nocol"]]).
- Every section builder fills `street_b1.B` (all eight bake from `sb.B.data`); boats are built by `kit_boats` into
  their own GLB and are NOT covered (boat crews' contacts with decks, poles, oars are not measured against geometry).
- `tools/owners_build.sh <name...>`: rebuilds through `tools/build_scene.sh`, then puts back the builder's outputs
  (placed.json, seats/solids/ground_at json, the raw GLB and build.log in web_build/) and reports DRIFT. Logs and
  backups in `gen/details/contacts/build/`. All eight built in 6-19 s each (three slots).
- `tools/owners_verify.mjs <section|all>` (0.1 s): per-material triangles from owners == shipped GLB accessor
  counts; per-material bounds (dequantized, page frame) within 1.5-3.8 mm (quantization); per-owner triangles ==
  the shipped `placed.json` (ground, water and road parts folded into the ground/water meshes).
  Result `gen/details/contacts/owners_verify.json`: 7 MATCH; **outer_road_2 DRIFT (explained)**: the builder now adds
  two 60-tri `timber__nocol` stools, owners `S4b.fig.seated_boatman_stern_15372` and `S4b.fig.seated_man_13240`,
  not in the shipped GLB. The checks leave those two owners out (`exclude_owners`), so they measure what is live.

## Stage 2: joint tracks (done)

- `tools/lib/three_node.mjs` (new): the page's own three build, GLTFLoader + meshopt decoder and **people.js
  `loadCharacters` / `prepareClip`** run in node (textures stripped from the GLB bytes before parsing), so sizing and
  clip corrections (clip_meta.json drift + grounding k) are the page's code, not a copy.
- `tools/joint_tracks.mjs <character|all>` → `gen/details/joints/<name>.json` (all 34 characters in 25 s; cached by
  GLB bytes + clip_meta entry + registry size + tool version). 10 Hz over every clip, root frame (x left, y up,
  z forward), metres at the page's size (every character ships at scale 1.0: the build normalises the GLB to height_m).
- Sites: palm_L/R (centre of the hand's cross-section at 45% of its length: 0.06-0.10 m from the wrist joint; the
  hand is 0.14-0.19 m long), shoulder_L/R (mesh top above lerp(neck, arm, 0.55), the pole rest of char_props
  'shoulder'; 0.02-0.09 m above that line), forearm_L/R (mid forearm), elbow_L/R, chest_front, back, belly, seat
  (lowest hips/thigh vertex within 0.2 m of the hips joint), sole_L/R (lowest foot/toe vertex), head_top, hips.
- Frame validated against `char_props.mjs --probe` (bearer raw GLB, sedan_carry t 2): Hips (0.092, 0.949, 0.108),
  RightHand (-0.139, 1.488, 0.167), LeftHand (0.128, 1.385, 0.394) — identical to 1 mm with the joint tracks' FK.
  Note: plan.md quoted the bearer's hands at 1.59/1.48 m; the shipped clip at t 2 has the joints at 1.49/1.39 m
  (palms 1.54/1.47 m).
- `node tools/joint_tracks.mjs animals` → `animal_<type>.json/.bin`: each animal's posed body and tack parts at 2 Hz
  over every clip (point-to-mesh distances for push_flank, bridle, ride). 13 types in 1.7 s.

## Stage 3: placements dump

- `tools/chrome_slot.sh node tools/people_dump.mjs` → `gen/details/placements.json` (one load of
  `world.html?window=all&sound=0&tier=high&adapt=0`, 7 s): 897 = 619 figures, 15 riders, 57 walkers, 116 boat crew,
  90 animals. No people.js hook was needed: `window.__test.people` (all, agentOf, attached, riders, hooks.ground)
  and `__test.loaded` (each section's bvh, floorVerts, persons, layout, people) already expose everything.
- 2026-10-13 01:24: the lead added a Start screen to world.html; `people_dump.mjs` now loads `...&start=0`. Dump
  rerun (16 s); same 897 people.

## Stage 3b: placement predictor

- `tools/place_predict.mjs` (module `Predictor` + CLI, 0.2-0.5 s): people.js addFigure/addAnimal + world.js
  hooks.ground (max of three raycastFirst hits from H + 1.2 at x, x ± 0.12) on the page collider rebuilt from the
  owners: every `__col` triangle (hidden ones included) of all eight sections, minus the edge walls on seams (world.js
  seams()), minus the drift owners. Perched animals: H + animals.json perch.rest.
- Result (`gen/details/contacts/place_predict.json`): **694 of 694** static figures and animals agree with the page's
  ground hook (asked again with every section in) **within 7.2 mm** (quantisation of the shipped GLB). Against the
  root as placed at load: 690 agree; 4 S6 figures at the S5 seam (`archer_waistguard_5465`, `pole_man_5578`,
  `crouching_dark_5515`, `bearded_carter_5428`) were grounded before the gate section streamed in, so their height
  depends on load order: `archer_waistguard_5465` stands on `S5.prop.casks_west_5525` (0.45 m) when the gate loads
  first. Captured: X, D (nudge), H (ground hook), yaw (facing + 90°). Not captured: riders (placed every frame on
  the animal), boat crews (boats.js host), walkers (they move).

## Stage 4: rules as data

- `characters/contacts.json`, written by `gen/details/contacts/tools/make_contacts_json.py` (fails unless every clip
  `node tools/clips_used.mjs` lists has a rule): 105 clips, 46 with contacts; postures (stand, squat, walk, chair,
  floor, lie, kneel, ride); targets (vehicle + feature rod/pole, seat, floor, rail/wall/table/structure, animal,
  ridden, self-prop); universal checks with tolerances. Hold-quantile judging: a contact PASSes when the signed gap
  stays within [−pen_m, gap_m] for `hold` of the cycle (0.6-0.9 by clip).
- Calibrated choices: `sedan_carry` needs the shoulder_R and both palms on a **pole** (rods ≥ 1.5 m: plain rods ≥ 0.5 m
  caught the cabin's frame rails); seats must stand ≥ 0.12 m over the floor the root is on (else the floor itself
  counted as a seat); soles and seats probe five points 5 cm round the site (plank gaps).

## Stage 5: contact_check

- `tools/contact_check.mjs <section|all>` (pure node, 7-23 s for all eight depending on load; 0.5-3.4 s a section) →
  `gen/details/contacts/<section>.json` (every check of every person) + `summary.json` / `summary.md` (table per
  section and class with the worst value, worst 30, FAILs per clip, clip-level sole offsets).
- Libraries: `tools/lib/owners_index.mjs` (plan grid, vertical rays, nearest triangle, vertical-parity inside test,
  rods by connectivity + PCA), `tools/place_predict.mjs` (ground hook).
- Animals: posed mesh (frame 0 of the animal's current clip, body + its people.json load's tack), exact
  point-to-mesh, signed by vertical parity.
- Classes: contact:<target> (gap or penetration), `contact:seat (no seat)` (only the ground under the seat point; the
  nearest seat-high piece is named), stance_soles and seated soles split into **(clip)** (the clip's own sole height
  on flat ground explains it: people.js grounds by the lowest foot *bone*, not the mesh sole; one fix per character
  clip, listed under "Clip-level sole offsets") and **(placement)** (terrain, a foot inside a wall or plinth);
  support: `furniture` (stands on a prop, vehicle, seat, or a ledge/step/rail base: the same surface does not
  continue round the root), `hidden_collider` (stands on an invisible collider over the visible surface),
  `below_support` (on the ground under its painted floor); `order`; `body_cylinder` (overlap > 0.10 m at body
  height, contact targets and seat exempt); `head_inside`; `site_inside` (> 2 cm in a visible collide piece);
  `clip_missing`.
- Instant-dependent: riders, walkers and the animals' current clips come from the dump instant, so two dumps differ by
  a few FAILs (693-695).

### Calibration (S4, all FAIL as required)

- `fortune_teller_12232` (fortune_teller; tell_fortune 12 s, sit 5 s): **support FAIL: stands on
  `S4.prop.table_12183` 0.789 m over the ground** (root 0.785; his foot point is on the table's north edge, D 14.38).
  Seat: no seat under the seat point (1.21 m over the ground in tell_fortune, 1.27 in sit). Forearms on the table:
  nothing within 0.6 m (he hovers over it). Note: the builder *does* build him a stool (owner
  `S4.fig.fortune_teller_12232`, top 0.45 m, X 45.66-46.02, D 14.60-14.96, shipped: verify MATCH), 0.22 m north of
  his foot point (a fix: step him off the table edge so the ground ray misses it, then fit the seat point onto that stool).
- `client_seated_12185` (robed_man; listen = sit_listen): no seat (seat point 0.455 m over the ground; the mapped
  stool `S4.prop.stool_12132` is 0.47 m west of his foot point); body cylinder overlaps the table by 0.13 m; palm_R
  and elbow_L 2.5 cm inside the table; soles 3.2/4.3 cm over the ground (clip).
- Bearers on `sedan_carry` (poles at 1.27-1.31 m, r 0.038): `bearer_bending_10440` shoulder_R 0.306 m (0.07 over
  the pole, 0.27 to its side), palm_L 0.313 (0.11 over, 0.29 side), palm_R 0.258 (0.21 over, 0.15 side);
  `bearer_straining_10728` 0.309 / 0.302 / 0.279; `man_behind_bearer_10755` 0.338 / 0.418 / 0.318 (his shoulder
  and hands are nearest to different poles of the two sedans); `bearer_east_10982` 0.301 / 0.315 / 0.268. (hold-0.9
  gaps; the plan's "0.3 m over and 0.45 m to the side" was against the centreline: the measured palms are 0.11-0.25 m
  over the nearest pole and 0.13-0.38 m beside it.)
- `ox_driver_10635` (idler; push_flank 9 s): palm_L 0.593 m and palm_R 1.085 m from the nearest ox surface
  (`S4.ani.ox_shaft_10712`, `S4.ani.ox_lead_10872`, his map group): palms in the air.

### Spot checks that must PASS (PASS)

- `outer_road/soldier_on_stool_11630` (soldier, sit; nudged onto `S4.prop.stool_11662` in round 2): seat −0.003 m
  (on the stool), soles 0.001 / 0.021 m. Every check PASS.
- `gate/rail_watcher_2` and `rail_watcher_4` (idler, lean_chin, the gate's reference lean): elbows 0.033 / 0.035 and
  0.033 / 0.028 m from the moat bridge rail (tolerance 0.04). Every check PASS.

## Stage 6: regress

- `gen/expand/round2/page_qa/regress.sh` has a `contacts` check (in the default list): `people_dump.mjs` then
  `contact_check.mjs all`, a `contacts: REPORT ...` line that never FAILs the suite. Tested:
  `tools/chrome_slot.sh gen/expand/round2/page_qa/regress.sh details_contacts contacts` (82 s with the Chrome start).

## Verification form (lead update 2026-10-13: section GLBs are being re-cut into ~10 m BatchedMesh cells)

- `owners_verify.mjs` now compares triangles **per glTF material summed over the whole GLB** (node names not relied
  on; node world matrices applied for the bounds), plus per bucket node only while the GLB still has one node per
  bucket. The bucket → glTF material map (gltf-transform dedup merges `deck` into `bamboo`, every edge wall and
  `hidden` into `edge_east_hidden`) is learned from the per-bucket form and kept in
  `gen/details/contacts/material_map.json` for the re-cut form. Each result line names the form compared.
- 2026-10-13 ~02:00 run: all eight GLBs were still in the per-bucket form (`one node per bucket`, 31-46 nodes;
  rainbow_bridge.glb dated 2026-10-12 19:13 local); 7 MATCH, outer_road_2 DRIFT(explained) (+120 timber tris).
- After a re-cut: rerun `node tools/owners_verify.mjs all --json gen/details/contacts/owners_verify.json`, and rerun
  `place_predict.mjs` against a fresh dump: the predictor rebuilds the page collider from `__col` buckets, so if the
  re-cut changes what the page collides with, its 694/694 agreement must be shown again.
- `tools/owners_build.sh` now deletes its backups after putting them back (the first run's `*.bak` copies, 109 MB,
  removed); logs and drift copies stay in `gen/details/contacts/build/`.

## Result (all eight sections, 2026-10-13)

807 people: 691 checked (619 figures, 15 riders, 57 walkers at the dump instant), 116 boat crew not covered.
343 people with at least one FAIL, 694 FAILs; contacts 606 checked. Cells: FAIL count / worst value (m). The 0.60 in
rail/wall/table is the search cap (nothing within 0.6 m).

| section | people (failing) | seat: no seat | seat gap | soles seated/floor-sit | vehicle (poles, bars) | animal | ridden | rail/wall/table | stance soles | on furniture/ledge | hidden collider | below support | load order | body cyl. | head in geom. | site in geom. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| city_end | 16 (6) | 1 / +0.43 | 1 / +0.13 | 2 / +0.04 |  | 2 / +0.88 |  | 1 / +0.42 | 2 / +0.04 |  |  |  |  |  |  | 1 / +0.10 |
| inner_city | 178 (78) | 40 / +0.90 | 5 / +0.66 | 54 / +0.69 | 27 / +0.70 | 6 / +3.80 |  | 11 / +0.60 | 26 / -0.17 | 6 / +0.35 | 2 / +0.05 |  | 3 / +0.49 | 4 / +0.26 | 1 / +0.03 | 2 / +0.07 |
| gate | 81 (42) | 4 / +0.96 |  | 11 / +0.56 | 8 / +1.50 | 2 / +0.79 | 2 / -0.08 | 28 / +0.60 | 13 / +0.42 | 5 / +0.95 |  |  |  | 8 / +0.21 | 2 / +0.04 | 1 / +0.06 |
| outer_road | 64 (28) | 5 / +1.27 |  | 6 / -0.07 | 16 / +2.69 | 8 / +1.08 | 1 / -0.13 | 8 / +0.60 | 6 / -0.08 | 3 / +0.85 |  |  |  | 2 / +0.17 |  | 1 / +0.03 |
| outer_road_2 | 66 (34) | 4 / +0.46 | 4 / +0.18 | 14 / +0.56 | 4 / +1.29 | 6 / +1.54 |  | 12 / +0.60 | 10 / -0.16 | 2 / +0.22 |  | 1 / -0.16 |  | 4 / +0.24 |  | 1 / +0.03 |
| rainbow_bridge | 232 (101) |  | 19 / +0.15 | 29 / +0.30 | 14 / +4.30 | 9 / +1.54 | 1 / -0.08 | 43 / +0.60 | 54 / +0.79 | 2 / +0.60 | 24 / +0.16 |  |  | 1 / +0.14 |  | 5 / +0.15 |
| canal | 140 (45) |  | 15 / +0.23 | 18 / +0.24 | 2 / +0.34 | 6 / +0.85 | 1 / -0.05 | 11 / +0.60 | 14 / -0.21 |  |  |  |  | 5 / +0.20 | 1 / +0.07 | 6 / +0.07 |
| countryside | 30 (9) | 1 / +0.35 |  | 1 / -0.04 | 6 / +0.46 | 2 / +1.68 | 1 / -0.07 | 3 / +0.60 | 1 / +0.05 |  |  |  |  |  |  |  |
| all | 807 (343) | 55 | 44 | 135 | 77 | 41 | 6 | 117 | 126 | 18 | 26 | 1 | 3 | 24 | 4 | 17 |

Of the sole classes, 82 seated-sole and 53 stance-sole FAILs are **clip-level** (the clip's own soles float or sink
on flat ground; e.g. scholar `sit` feet 0.12 m up, scholar standing clips +0.03, carter −0.04): one fix per character
clip (summary.md "Clip-level sole offsets"). By clip: sedan_carry 45 (every bearer in every section), lean_chin 42,
sit (seat) 47, push/steer/lift_pole, bridle, push_flank. Full list: `summary.md` (worst 30) and the per-section JSON.

## What blocks or limits the fix phase

1. **Boats are not in the owners.** 116 crew (pole_boat, work_sweep, steer and tiller on boats, climb_ladder, decks)
   are unmeasured. Needs `build_boats.py` to write owners the same way (kit_boats builds into per-node Buckets) plus
   the boats' world transforms in the dump.
2. **Clip-level sole offsets** (135 FAILs): people.js `prepareClip` grounds by the lowest foot *bone*; the mesh soles
   sit 3-13 cm off. Fixing it in the engine (ground by mesh soles) or in clip_meta `k` is the performance session's
   file; the alternative is per-clip re-grounding at character build time (the build lock).
3. **No anchors yet.** Rails, tables and walls are "the nearest visible non-ground surface"; poles and push bars are
   rods found by connectivity. Good enough to rank and to solve nudges, but plan step 3 (builders exporting anchor
   segments and seat tops) would make the lean and table rules exact.
4. **Load-order grounding** (3 S6 figures at the S5 seam) and the **Rainbow Bridge's hidden walk ramp** (24 deck
   figures stand 6-16 cm over the visible stepped deck) are engine or builder fixes, not nudges.
5. **outer_road_2 builder drift**: two seats (`seated_boatman_stern_15372`, `seated_man_13240`) are built but not
   shipped; its next export changes what the checks see.
6. **Re-cut GLBs** (performance session): rerun owners_verify and the predictor after it (see above).
7. Size: `gen/details/joints/` is 63 MB (animal meshes 55 MB of it) and is tracked in the new git repo; it is
   regenerable in ~27 s (`node tools/joint_tracks.mjs all && node tools/joint_tracks.mjs animals`), so it could be
   ignored.
