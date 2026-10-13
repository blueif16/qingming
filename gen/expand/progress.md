# Expansion progress: S4 (outer road, part 1) + S5 (gate) + S6 (inner city)

The lead's running record of the two-area expansion (plan: `NEXT_SESSION.md` of 2026-10-11). Newest last. Agent
briefs: `brief_outer_road.md`, `brief_inner_city.md`, `brief_workshop.md`; their needs lists, lessons and reports land
here too (`<name>_needs.md`, `<name>_lessons.md`).

## The user's calls this round (2026-10-11/12)

- "continue": the areas are S4 to u 12600 (east) and all of S6 (west).
- Animals, carts and new characters are built now, at high quality; Meshy credits are no object ("I want high quality
  work"). Several Meshy accounts: `~/.meshy_keys`, line 1 in use, `tools/meshy_key.sh retire` drops a spent one.
- "Mind the sizings and do optimizations for both quality and sizing" as the world grows (Messenger's lessons).
- **Real size, painted place:** everything is real size; only positions come from the map (`map/BUILDING.md` rule 5).
- No progress reports along the way: keep records (skills, md), use subagents to accelerate, report at the end.

## Phase 0 (lead), done 2026-10-11

- **Sections:** `map/sections.json` folders `outer_road` (S4, `area` u 9400–12600) and `inner_city` (S6); the tools use
  `area || x`.
- **One world:** S4/S6 frames continue S5's (`map/README.md` Frames); datum `station` makes stations run on (S4 +26.05,
  S6 −26.51).
- **Headless builds:** `tools/build_scene.sh <name>` → `blender/build_web_scene.py`; identical to a live build on the
  gate (same 100,054 triangles and owners, byte-identical GLB). `street_b1.export_collection` works with or without a
  window.
- **Edges per side:** `edge:south|east|north|west` → `g_edge_<side>_hidden__col`; the page drops the walls on a seam.
- **One page:** `web/world.html?sections=…` (`web/src/world.js`); `gate.html` = the same page with the gate only.
  Sections stream in after the first; the backdrop is one ellipse ring round the union; the shadow map follows you.
- **Sizing:** kit textures shipped once (`web/public/assets/tex/<name>.<hash>.webp`, the GLB keeps geometry: gate
  2.0 → 1.5 MB); materials shared by name; only the first section's cast loads before the world shows.
- **The batched crowd** (`web/src/crowd.js`): one InstancedMesh per character (and per animal load / carried prop),
  clips baked to a bone texture; 377 people: 23–25 fps → 232–292 fps, CPU 40 → 3–4 ms, 1,145 → 194 draw calls.
  `?batch=0` for A/B.
- **Animals on the page:** `people.json` `animals` (model, load, do, scale, nudge), bodies as circles along the
  length; riders `ride: <animal slug>` seated on the load's seat + 0.09 m; `stand_in` for characters not made yet;
  carried props `props: [...]` (`prop_<name>` parts).
- **The standard:** `map/BUILDING.md` rows for vehicles (kit) and animals (rigged, people.json), rule 5 (real size).
  `tools/loyalty_check.mjs` counts animals through people.json.

## Phase 1, running

- **Workshop Run 1** (done): `blender/kit_vehicles.py` (6 types), 6 animals (donkey, ox, camel, horse, mule, pig) on
  `blender/rig_quadruped.py`, `ride` on all 8 characters; 142 credits. Run 2: S6's 10 new characters, ~40 actions,
  carried props, the dog, a side-saddle ride; then S4's list.
- **S6 Run 1** (done): 373 entities (180 figures, 19 animals, 8 vehicles); the 解 ring is in S6; seam notes applied to
  S5 (`S5.prop.casks_west_5525`, `S5.prop.pole_load_5645`, the two south roofs run west). Run 2 building.
- **S4 Run 1**: mapping (tiles merged, second pass).
- **The gate:** its 12 animals and 4 riders are in (`sections/gate/people.json`), the 串车 is built
  (`gate_scene.vehicles`); only the covered ox cart waits for S4's oxen. Loyalty PASS.

## 2026-10-12, early hours

- **S4 Run 1** done: 206 entities (65 figures, 17 animals, 3 vehicles, 23 trees, 54 props, 17 buildings); frame knots
  [9400, 32.125], [10270, 36], [11420, 31.6]; 7 new characters asked (soldier, robed_man, fortune_teller,
  hat_traveller; child, woman, monk shared with S6). Run 2 sent (build, people, backdrop, checks). Its needs went to
  the workshop as an addition.
- **S4 seam notes applied to S5** (`gen/map/S5/merge_fixes.mjs`): the covered ox cart's front at the shaft ox
  (9960, 1455), its wheel, the willow clump's crown, house_9300's east end; the case-sensitive `/seam/` test that
  appended its sentence on every run is fixed.
- **The gate's carts are built** (`gate_scene.vehicles`): the 串车 with its trace donkey, and the covered ox cart with
  its yoke on S4's three oxen (read from `sections/outer_road/layout.json`: one world, one frame). Loyalty PASS: every
  kind built, nothing unbuilt.
- **Animals vs walkability at the gate:** the lead camel's painted spot put it 0.3 m into the passage jamb and, with
  the painted crowd, shut the passage; the caravan leader's walking path ran through it. Fixes (recorded): the camel
  0.31 m south, the black pig 1.5 m west against the south jamb, the caravan leader standing at the camel's head
  outside the mouth; the passage walk holds D 3.95, then threads the idlers' gap. house_5800's steps moved west with
  its painted west end (the plinth walk starts at X −36.4). Walks 11/11, people check PASS.
- **Tree cards:** a tree-card agent makes painted cards per form (willow, old willow, whip clump, bare elm, pine, …),
  2–3 variants each, and assigns all 74 trees (`trees/`, `web/public/assets/trees/`). The page will take a card per
  tree.
- **Agents told:** keep lessons as `gen/expand/<name>_lessons.md` with exact skill text; use subagents; per-agent
  scratchpad folders (an S4 tile agent ran a script S6's agent had overwritten in the shared scratchpad).

- **Workshop Run 2** done: 14 new characters (child, child_robed, woman, monk, bearer, storyteller, butcher, scholar,
  elder, archer; soldier, robed_man, fortune_teller, hat_traveller), ~40 actions, 17 carried props (`prop_<name>`), dog,
  bird, horse_white, ox `draught` and donkey `pannier_charcoal` tack, the camel's kush; a free local retarget
  (`tools/retarget_local.mjs`, clip sources `t2m:` / `from:`); account 1 spent and retired (account 2: 251 left).
- **Page:** lazy baking (only the clips people play are baked: a character carries up to 23 clips); side-saddle riders
  turned 90°; `scale` multiplies the character's size (it used to replace it); chars.html hides props unless
  `?props=`; trees are instanced per card (per-species cards when the tree agent lands; willow fallback).
- **The gate recast** with the new characters: archers, child beggars, the elder side-saddle, the hat traveller, the
  carriers with their painted loads on the shoulder-pole walk, the 串车's carters pushing and the groom at the bridle
  standing (the cart and donkey stand). Loyalty PASS.
- **To fix in Phase 2:** the covered ox cart's pole reads as a flat yellow beam close up (kit `bamboo` flat colour):
  give the kit's poles and shafts a timber swatch when `kit_vehicles` moves into `song_kit`.

- **S4 Run 2** done: `outer_road` built (105.8k triangles, 37 draw calls, 1.77 MB; 73 tris/m²), loyalty PASS, walks
  11/11 alone and 2/2 across the seam, people PASS. Lead follow-ups done: the gate's ground stops 1 m past its seams
  (the neighbours dip 0.12 m under it); recorded moves now move a whole entity's points (`map_layout.mjs`: hooves,
  footprint, bays), so yokes follow moved oxen; the page seats perched animals at their H (the bird), walks animals
  with a `path` (the pig herd), and leaves a child `carried_by` to its carrier's `child_in_arms` prop; the registries'
  `about` entry no longer breaks the second batch of animal loads (it silently dropped every animal not in the first
  section).
- **Joined gate + outer road** (`gen/expand/join_gate_outer/sheet.jpg`): 174 people and animals, 357 fps in the shot
  tool; the tree agent's species cards already show (pines, gnarled willows, bare trees).
- **Backdrop agent** started: true aspect, horizon at eye level, clean keying, panels loyal to their strips.
- **Static LODs tried and not adopted:** meshopt simplify (ratio 0.3, error 0.004) only takes the gate from 106k to
  71k triangles (the kit's chamfered pieces don't reduce) for +1.48 MB of download, while the GPU spends ~1 ms on the
  scene. For phones, a builder-made LOD (no brackets, rafter ends, trims) is the better lever.

- **Tree cards** (tree agent): 9 forms, 31 cards, all 74 trees assigned (`trees/`), no neighbour repeats; shipped
  smaller by the lead (768 px, 160 KB budget: 7.1 -> 4.0 MB). One card (`bamboo_5`) waits for the image API.
- **The image API (shyfai) is out of balance** (403 INSUFFICIENT_BALANCE): the user was asked to top up. The backdrop
  agent does the non-generation fixes meanwhile.
- **S6 Run 2** done: `inner_city` 115.7k triangles, 44 draw calls, 2.0 MB; loyalty PASS, walks 19/19 alone, 3/3 joined,
  people PASS. Lead follow-ups: house_5800's hidden street wall to D −0.3 and its west end to X −40.1 (it stood over
  S6's painted rider and porters), the wine depot 2.8 m deep (it took 孙羊正店's east upper room).
- **The joined world** (`world.html?sections=inner_city,gate,outer_road`, checks in `sections/world/`): walks 42/42
  (`sections/world/walks.json`: every section's walks minus its seam-edge tests, plus the seam crossings), people
  check PASS (342 figures and animals, 31 walkers; road spots in all three areas), shots `gen/expand/world_r1/`.
- **Records agent** merging the lessons into the three skills, with an expansion playbook.
- **Download sizes** (2026-10-12): areas 5.6 MB, characters 8.5 MB, trees 4.0 MB (was 7.1), animals 2.0 MB, shared
  textures 0.6 MB, panels and data ~0.9 MB. Next: trim the clips nobody plays from the characters (idler 860 KB with 23
  clips) once the workshop's last batch lands.

## Phase 2 done (2026-10-12)

- **Integration passes:** both areas cast the workshop's last batch (sit, whips, rope, trays, carried children,
  drivers on the kit's seats, the low sack cart, off-centre sedan cabins). S6's builder no longer applies its moves twice
  (the layout tool moves whole entities now). Loyalty PASS for S4, S5, S6.
- **Ground under the mist:** every outer edge's ground runs 16 m out (the mist is full 9 m out and thins within 14 m of
  the viewer), so it never ends in a hard line; seams: the gate's ground 1 m past, the neighbours dip under it.
- **Clips trimmed** to what the sections play (`tools/clips_used.mjs`): characters 8.6 -> 7.9 MB.
- **Checks on the joined world:** walks 42/42 (twice; one earlier 41/42 was a people-timing flake), people check PASS
  (the X −60.8 spot is timing-sensitive: one FAIL, then two PASS), shots `gen/expand/world_final/`.
- **Bench** (RTX 4070 SUPER, 1080p, machine idle, `sections/world/bench.json`): every painted figure and animal of the
  three sections 220–284 fps (CPU 3.3–4.5 ms, GPU ~3.2 ms, 289–477 draw calls); +200 walkers 176–215; CPU 4× slower
  29–48. Load 21 MB. `gen/expand/bench_world/bench.md`.
- **Records:** skills merged (records agent: the playbook in `scroll-section`, "Building a new section" in `web-scene`,
  accounts/props/animals/casting in `characters`); `map/BUILDING.md` kit modules; `map/index.md` status and seams;
  each section's notes; `NEXT_SESSION.md`.

## Open

- The image API (shyfai) is out of balance: the backdrop redraw (gate north/east, outer road east) and `bamboo_5` wait.
- The frame questions in `map/index.md`.
