# The scroll's end (S7): notes

The last piece of the scroll at the city end, west of the inner city: 余辉's seventh segment (结尾三问), from the S6
seam at scan u 2000 to the silk's cut edge at u ≈ 815. It holds the official's compound 官宦人家 and its gatehouse
(门房指路: the gatekeeper and the visitor with a food box), the doctor's shop 赵太丞家 (太丞医铺), the broad-hatted
official riding out with his retinue, the street, the 解 building's roofs along the bottom edge and the willows at the
cut edge. The 解 sign, its ring and the square well are S6's (`map/index.md`, Seams). The area brief is
`gen/expand/round2/brief_city_end.md`, the tile brief `gen/map/S7/brief.md`. Positions come only from the scroll map
(`map/text/S7.md`, `layout.json`); the restyle is a look reference and a reader for faded silk.

## Restyle, run 1 (2026-10-12)

**Setup** (`section.json`): scan rect `[816, 0, 1344, 1792]` (u 816–2160: the area plus 160 px past the S6 seam; the
west edge is the silk's cut edge), the gate's prompts, model gpt-image-2.5 and style image B1 unchanged. Overview
1344×1792 (the rect's own size). Tiles: 1024 px with 128 px overlap, 2 × 2 = 4 tiles. All 5 units generated first
time (35–49 s each), run with `--jobs 2` while four other areas restyled.

**Alignment** (raw → registered): overview 0.656; t_r1c1 0.635 → 0.657, t_r0c1 0.560, t_r0c0 0.537, t_r1c0 0.518 →
0.533. Better than the gate (0.43–0.52) and in the range of the inner city (0.48–0.70). Shifts 2 px; the bottom
tiles took a 1.005 vertical scale. The mosaic (`gen/sections/city_end/mosaic.jpg`, 2688×3584, 2× the scan;
`mosaic_view.jpg`) shows no ghosting at the overlaps at review size.

**Review of the check sheets** (`gen/sections/city_end/check/`), by u range:
- **Faithful:** the gatehouse and its fence, the seated gatekeeper, the visitor with his bundle and food box, the
  porter with his baskets, the official in his broad hat and the two attendants behind him, 赵太丞家 with its board
  赵太丞家, its tall boards and its interior figures (about the right count), the bucket man and the hooped buckets at
  the well's west end, the walkers at u 1850–2000, the small roof on posts, the hip-gable building, the 解 building
  with the 解 plaque and the tall slatted tub. Figures keep their places and poses.
- **Invents or drops:**
  - u ≈ 815–910 (the cut edge): drops the collectors' seals (right) and paints willow trunks reaching the ground at
    u ≈ 835–930, v ≈ 870–880, where the seals cover the scan.
  - u ≈ 1715–1740, v ≈ 110–150: **drops the black bird** on the roof slope.
  - u ≈ 1800–2000, v ≈ 760–870: turns a faint pale rounded mass behind the bucket man into a long striped animal with
    its head down (the overview made it a mat roof). The strokes must settle it.
  - u ≈ 1400–1610, v ≈ 1080–1190: paints the official's horse as a white horse with its body above the small roof
    and the man in front holding a rope to it. The scan has a pale ink-outlined oval there (u ≈ 1450–1610,
    v ≈ 1115–1190) that may be the horse's body; the head, legs and rope are the model's.
  - u ≈ 1320–1390, v ≈ 740–960: gives the man pointing the way a woman's hair bun (the scan: a dark cap) and adds a
    white puff at ≈ (1330, 745) that is not painted.
  - u ≈ 1480–1640, v ≈ 700–890: the shop's interior figures' dress colours and the child's place are the model's.
  - u ≈ 1830–2160, v 0–300: the needle-cluster trees come out as soft leafy trees (as on S5 and S6).
  - u ≈ 815–1400, v ≈ 1250–1790: the bottom trees are merged into one big tree and willow masses.
  - u ≈ 2040–2160, v ≈ 1380–1630 (S6's 解 ring): adds seated figures under the awning.
- **Checked on the scan for the brief:** the 解 plaque hangs at u 2005–2058, v 1529–1576 (as S6's note on
  `S6.prop.jie_signboard_2085` says), not at u 1955–1990 as the area brief has it: it is S6's. 赵太丞家's tall boards
  include free-standing ones on their own feet at u ≈ 1385–1445 and ≈ 1755–1790 (tile props), besides the board fixed
  to the shop front at ≈ 1460–1490.
- **Colour:** true greys and blues on the roofs, varied robes, warm silk ground; the same look as the gate and the
  inner city.

**Use:** `tools/scroll_inspect.mjs city_end <u> <v> <half>` reads faded silk beside the scroll (covers u 816–2160);
new characters are cropped from the mosaic.

## Mapping (Run 1, 2026-10-12)

Units (`gen/map/S7/brief.md`): `structures` (u 815–2000, looks to 2150; the critical path), `t1` (815–1450, looks
815–1600: the gatehouse scene, the porter, the willows) and `t2` (1450–2000, looks 1300–2150: 赵太丞家 and its
free-standing boards, the whole retinue and the horse, the bird, the well's west end, the walkers). Exceptions to the
main-point rule: the retinue and 赵太丞家's free-standing boards and stand are t2's even west of u 1450.

**Result** (record: `gen/expand/round2/city_end_run1_report.md`; merge and second pass: `gen/map/S7/merge_notes.md`):
- **The map:** 70 entities, `check` PASS: 17 figures, 3 animals (the official's horse, a crow on the north-south
  hall's roof, a pale shape at the well's west end, conf low), 9 trees, 20 props, 9 buildings, 5 structures, the road
  and 6 groups (官宦人家's buildings, 赵太丞家's halls, 门房指路, 问病, the retinue, the well's west end). No vehicles,
  boats or water. Seven entities are conf low with both readings in their notes.
- **The frame** (`map/frames/S7.json`): knots `[[1250, 59.9], [2000, 50.4]]`, the west knot from the gate blocks'
  ground edges (the one deviation from the seed; the lead may drop it); datum `S7.road.main:lines.centre.3` =
  (2000, 1180), station −73.63; supports `carried in arms` (H 0) and `roof: S7.bld.hall_ns_1620` (H 3.2). No
  diminution across the street.
- **Layout** (`layout.json`, `node tools/map_layout.mjs S7`): 17 figures, 9 trees, 38 other entities, no moves. Its
  painted area meets S6's: se (−78.27, −4.39) and ne (−101.13, 30.54) are S6's sw and nw; sw (−93.12, −4.39), nw
  (−120.29, 30.54). The west edge is the scroll's cut end: mist, no panel.
- **What the painting shows here, against the brief and `sections.md`:** 赵太丞家's name is four lozenge tablets
  趙 · 太 · 丞 · 家 and its fixed board reads 五勞七傷□□□ (the free-standing boards don't resolve); two women and one
  child at the doctor's; no man at the door; the retinue moves east, toward S6; the man who points the visitor the way
  stands in the gate's east bay (the seated gatekeeper talks to the man at the post); one willow at the cut edge, its
  whips hanging; the 解 plaque, its board and ring are S6's, and the "corner building" is the 解 building's end.
- **Needs** (`gen/expand/city_end_needs.md`): all 17 figures cast from existing characters (an optional new one for
  the broad-hatted official); three new takes (`sit_hold_child`, `examine_child`, `point_way`) and two optional; a tack
  variant for the white horse; five new carried props; the kit parts for 赵太丞家 and the gate hall; a new tree form
  for the hanging willow. Lessons: `gen/expand/city_end_lessons.md`.
- **Open for Run 2:** the placeholder footprints (the roofs at the top and every south building) are built as
  `choice:` and squared; the street's south edge stays at v 1300 with hidden walls up to about 5 m further south; the
  tub's height; the conf-low readings the lead settles.

## Build, Run 2 (2026-10-12)

Brief: `gen/expand/round2/build_rules.md` and the area brief's "Run 2". Report: `gen/expand/round2/city_end_run2_report.md`.

**Files.** Builder `blender/city_end_scene.py` (`derive()` from `layout.json`; every piece inside `sb.entity(<map id>)`,
strict buckets; one edge wall per side); kit `blender/kit_city_end.py` (17 generic parts, reviews in
`gen/sections/city_end/kit_review/`); sign atlas `gen/sections/city_end/make_signs.mjs` → `textures/signs_city_end.*`
(趙 · 太 · 丞 · 家, 五勞七傷□□□, the three free-standing boards as smudges, the main hall's motif cell; LXGW WenKai TC
Bold); casting `gen/sections/city_end/make_people.py` → `people.json` (+ `cast.json`); `build_choices.json`,
`scene.json` (8 spots), `backdrop.json` (no panels). The builder also writes `gen/sections/city_end/solids.json`:
where the colliders stand at body height (0.1 m cells per owner), the seats and the gate passage, which the casting
script tests every spot against.

**Built.** 9 buildings, 5 structures, 20 props (all models), 9 trees (page cards: the default willow card until the
tree factory's `trees/assign/S7.json`; proposal in `gen/sections/city_end/trees_assign_proposal.json`), 17 figures
(14 at their spots, 3 walkers, 1 rider), 2 animals; `pale_shape_1905` unbuilt (conf low, the lead's call). 48.5k
triangles (buildings 32.8k, structures 4.8k, props 6.2k, ground 4.3k, trunks and edges 0.3k), 31 draw calls in the
GLB, `city_end.glb` 0.81 MB.

**Choices** (marked `choice:` in the builder; each building's docstring has them):
- The roofs-only placeholders are built square on their mapped extents, at real size: the halls at the top of the silk
  (painted at about 0.55) take real eaves and ridges (middle hall 3.8/6.4 m, main hall 4.2/7.3 m on a 0.25 m
  platform, far gable 5.4/8.0 so it shows over the main hall's ridge, north-south hall 2.85/4.8, 赵太丞家's back hall
  3.6/5.9); fronts and backs shifted a few decimetres where neighbours overlapped (back hall D 15.8-17.8, middle hall
  from 18.0, main hall's east end at the north-south hall's west wall).
- **The crow's roof.** The north-south hall's east wall stands at X -100.0 (the placeholder's -98.3): built real, its
  east slope is 3.22 m high at the crow's mapped spot (support H 3.2), so the crow sits on the tiles where it is
  painted; its north end at D 24.6, clear of the two needle trees.
- **The gate hall:** its east end at 赵太丞家's west wall (the boards hide where it ends); the passage square to the
  street; the door frame at mid-depth (the painted leaf's foot lies 100 px up the silk) with the one painted leaf
  open against the west side; the partition's rails as painted; the lamp in the passage's east part; ridge 5.75 m.
- **赵太丞家:** back wall at D 15.55 (the est 14.99 is the counter's foot line); the counter 2.8 m × 0.45 × 0.72 m, the
  rack on its east part; ridge 5.4 m; the woman's bench 0.55 m high (the sit clip's seat; painted 0.35).
- **The hip-gable building:** X -93.0..-87.75, D -0.6..2.44 (the placeholder, 3.0 m along its ridge by 5.1 deep,
  can't carry a hip-gable roof whose ridge runs east-west; its hidden west end carried 1.3 m west, its south wall
  2 m north); eave 3.0, ridge 4.6; a door under the gate roof.
- **The 解 building:** on its mapped footprint; eave 2.75 m (the post's 211 px), ridge 4.3 m; the east eave 1.17 m deep
  to the painted post, its purlin on tie beams from the end walls; the shelf under the eave; the bar from the post
  east to the seam (S6 continues it to its plaque).
- **The tub:** reading (a), one tall slatted vessel 2.1 m (px / 100) up to under the bar, its lattice as a band.
- **Moves** (`build_choices.json`): the two twig bushes at the bottom edge 0.9 m south (their estimated bases stood
  inside the 解 building).
- Props at painted px / 100: the free-standing boards 3.8-4.0 m overall, buckets r 0.2-0.22 × 0.6-0.68 m, the seat box
  0.65 × 0.48 m, the sack 1.25 × the kit's.
- No east panel: S6 is always in S7's streaming window; west is the cut end (mist), north and south mist.

**Checks** (final, after the QA fixes). `loyalty_check S7` PASS (one unbuilt, recorded); export: scroll index 34
entries, projection max 0.57 px; S7's texture (the sign atlas, UASTC) encoded and current (`ktx2.mjs check` fails at
the end only on S3's and S2's new files, theirs to encode); `budget_check city_end` PASS: 1.53 MB own download (8.47
with kit and cast), 48.0k triangles drawn, 0.5k collider-only, 1.33 MB own textures, 132 draw calls at the worst spot,
21.4 MB GPU alone. On S7's own dev server (5191) and Chrome (CDP 9241):
- walks `walks.json` alone 18/18 PASS (each edge stops you: the cut end, the seam, the silk's top and bottom; the
  shop to its counter, the gate passage to its partition, round the shed and the buckets, the 解 eave, the courtyards),
  `walks_joined.json` 8/8 PASS (across the seam on the street, by the well, the courtyard at the top both ways, past
  the 解 building's corner, from S6's 解 ring under the east eave), at the default window and `&window=all`;
- `people_check` PASS alone and joined (`&window=all`; joined 17 walkers and 198 figures, nobody stuck; walking into
  the doctor and the seated woman keeps the 0.56 m bodies); spots on painted walkers' lines (the porter's path
  -96.2, 3.6; the street at the seam -84.5, 7.0);
- shots `shots.json` (31) and `shots_joined.json` (16): `gen/sections/city_end/qa/alone/`, `qa/joined/`; HUD at
  赵太丞家, the gate and the retinue: ring and boxes on the painted spots (`qa/hud/`); films of the porter, the retinue
  and the seated woman (`qa/film/`).
- QA's defects fixed: the spawn and three views stood past the seam (moved inside); the bench by the east board, the
  braced stand under the 解 eave and the lattice stand were walk-through and the sack a 0.33 m step (hidden colliders;
  a new kit `sack`); the woman's shins went through her bench (the bench turned north-south, she sits across it); the
  ground's stair-stepped seam edge (clipped on the line); pale stones (dark stone), a plain hatched panel (battens), a
  blank far gable (plinth, posts, storey beam, door and window), a solid block for the 解 eave's shelf (a board on
  brackets). Left: the man at the post stands rather than leans (his `lean_post_talk` take waits); the main hall's
  motifs run the panel's full height (its lower part is hidden behind the middle hall's roof in the painting).

## Join agent, restart run (2026-10-12 evening)

Details are in `gen/expand/round2/joins_report.md`.
- The four hooped buckets at the well's west end now collide; before, they could be walked through
  (`blender/city_end_scene.py`, `collide=True`).
- The bail bucket stands on S6's boards, which now run west under it (`on_s6_platform`).
- The bucket walk's expectation is updated. Walks: 18/18 alone, 8/8 joined. Loyalty PASS.
- `shots_joined.json` has the seam spots K1–K12 (hour 10). HUD shots: `gen/sections/city_end/qa/run3/hud/`.
