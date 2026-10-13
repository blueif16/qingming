# Outer road, part 2 (S4b, `outer_road_2`): the section's record

**What it covers.** S4 part 2 under its own map key `S4b` (round 2 Phase 0): scan u 12600–15500, the outer road east
of part 1 (`sections/outer_road`, u 9400–12600) to the river. The two palm-covered family carts (豪车云集, 名画记 pin 27
大棕盖车 at 13120), the crowd round a seated man (u ≈ 13100–13450), the wheelwright (车铺劳作, pin 26 at 13620), the
tea house, the bank, and the moorings on the 汴河, where the river leaves the top of the silk. It is **the pilot for
boats and water**. Brief: `gen/expand/round2/brief_outer_road_2.md`; tile brief: `gen/map/S4b/brief.md`.

## Run 1, step 1: restyle (2026-10-12)

- `section.json`: a copy of `sections/outer_road/section.json` with `rect [12448, 0, 3216, 1792]` (u 12448–15664,
  the area plus 150 px past both ends, multiples of 16) and overview `3216x1792`. 4 × 2 tiles of 1024 px: columns
  u 12448–13472, 13179–14203, 13909–14933, 14640–15664; rows v 0–1024 and 768–1792.
- `node tools/scroll_pipeline.mjs outer_road_2 all --jobs 2`: 9 images, all first time (41–113 s each, about 8 minutes
  with registration). The image API worked.
- **Registered alignment:** overview 0.738; tiles 0.531 (t_r0c0, the crowd and the willows), 0.598, 0.610, 0.622,
  0.685, 0.651, 0.575, 0.561. All are above the gate's 0.43–0.52 and none sits far below its neighbours, so no unit
  was rerun. Registration moved the tiles by at most 6 px and scaled them by at most 0.5%.
- Outputs: `gen/sections/outer_road_2/mosaic.jpg` (6432 × 3584, 2× the scan: scan u = 12448 + px/2, v = py/2), the
  check sheets `gen/sections/outer_road_2/check/`, and side-by-side zooms through
  `node tools/scroll_inspect.mjs outer_road_2 <u> <v> <half>`.

## Where the restyle invents (read from the check sheets and zoomed side-by-sides, 2026-10-12)

It keeps the layout well: buildings, carts, the oxen, the wheel lying on the ground, the pole frame and the hulls
are where the strokes put them. It invents in these places (scan px). The setup agent's crops are in
`scratchpad/S4b_setup/insp_*.jpg`.

- **Trees, everywhere:** it leafs the willows green and draws full weeping crowns where the scan has bare whips and
  twigs (u 12450–12900 v 0–800; u 13900–14250 v 60–460; u 15100–15660 v 850–1300). Species, leafing and trunk count
  come from the scan only.
- **The horse at the second cart's rear** (u 12790–12980, v 1520–1790): it seats a rider in a big black hat and white
  robe on the horse and puts a man in blue bending at the horse's west end. On the scan, the broad hat
  (u 12860–12920, v 1520–1570) may belong to a rider or to a man behind the horse, and the west end may be the horse's
  own head and neck. Read both at zoom 3.
- **In front of the seated man in the crowd** (u 13240–13320, v 560–650): it piles round baskets and bowls on the
  ground. The scan shows a dark patterned shape there (a mat? a low table? goods on a cloth?). The crowd's head count
  is about right in the restyle (about 15), but count on the scan.
- **The man with a stick below the crowd** (u ≈ 13340–13400, v 665–820): the restyle reads the tall dark shape
  over his head (u 13355–13385, v 669–710) as a stacked load carried on the head. It may be a tall hat. Record both
  readings.
- **The horse group** (u 13300–13590, v 870–1110): the restyle shows five people round one saddled horse. The
  scan's small donkey at u ≈ 13470–13560 (legs at v 1060–1110) becomes a man in blue bending over. Count the animals
  by their legs on the scan.
- **The wheelwright** (u 13560–13800, v 640–790): at the wheel's west end the restyle draws two men (adding one in
  blue) where the scan shows one man bending. East of them it draws a saddled mule and a man in white where the scan
  has a blocky object (a workbench? a trestle?) and one or two figures. Count on the scan. The wheel (u 13560–13760,
  v 740–790), the timber pile below it and the hanging basket on its pole frame (basket u 13650–13740, v 570–600)
  match.
- **By the timber, east of the wheel** (u 13800–13940, v 860–970): it draws sacks and bundles. The scan shows a dark
  mass that may be a pile; read it on the scan.
- **The bank by the boats' sterns** (u 14680–14880, v 200–490). This is the worst spot. The restyle invents a stack
  of sacks with a seated man in blue (u 14800–14880, v 210–330), where the scan has the dark stern of a rafted boat.
  It adds a kneeling figure beside the porter (u 14760–14830, v 340–400), and 2–3 figures heaped with bundles round a
  bench (u 14680–14830, v 400–480), plus a long plank to the boats. The scan has three figures there: two at
  u 14650–14700 (v 340–410), one of them small, and a porter with two baskets on a pole at u 14760–14800 (v 340–410).
- **The tea house's east end** (u 14740–15050, v 1030–1250): it adds a dark-clad figure bending at
  u 14830–14880 (v 1060–1140), where the scan has posts and branches. It turns a light standing figure and a reddish
  patch at u 14920–14970 (v 1020–1100) into a man in red reclining. It adds white animal-like shapes in the branches
  at u 15000–15040 (v 1080–1150), and draws a drum with a painted face beside the figure at u 14740–14830
  (v 1170–1240).
- **The moorings** (u 14840–15520, v 30–830):
  - *Hull count.* The lead's first look counted four rafted boats and one at the top. The restyle draws five rafted
    hulls and the top boat, and the scan seems to agree with five: a hull at about v 340–440, between the long-cabin
    boat (v 190–330) and the boat with the round mat roof (v 410–520). Count the stems and sterns at zoom 3; take
    neither number on trust.
  - *Crew.* On the biggest boat's cabin the restyle draws two seated figures (u 15030–15080, v 460–520) where the
    scan shows one (u 15000–15040, v 480–520). It moves the seated figure at the bow of the boat above the biggest
    about 50 px east (scan u 15355–15380, v 455–490; restyle 15400–15440).
  - *The top boat.* The scan's hull runs from u ≈ 15190 (a pointed, up-swept west end, v 110–160) to about 15470.
    The restyle lengthens it east to ≈ 15520 (past the seam), gives it a mast, and puts a crewman bending on it
    (u 15330–15370, v 40–90). Check both ends against u 15500.
  - *The water.* The restyle paints the river as a pale grey-green sheet with a far shore at the top edge. It adds
    there a tiled house (u 15100–15190, v 10–80) and two willows (u 15200–15400, v 0–60); the scan shows only faint
    vertical strokes (a far bank? reeds?). The shore lines come from the strokes, where the bank's wash and the
    ripple lines stop, not from the restyle's colour edge.

## Units (Run 1, step 2: mapping)

Nine units, as planned (none split): five tiles (`t1` 12600–13050, `t2` 13050–13500, `t3` 13500–14100, `t4`
14100–14850, `t5` 14850–15500), two structures agents (`structures_w` 12600–14000 plus `S4b.road.main` over the whole
area, `structures_e` 14000–15500) and the river agent (everything on or in the water, u 14300–15500). Brief:
`gen/map/S4b/brief.md`. The setup agent's rough count for `t2` is about 35–38 figures (the crowd about 15–18, the men
with the horse and donkeys about 5, the cart's driver and the people at its rear about 5, the top street a few), under
the 40 a single agent can hold.

## Run 1, steps 2–4: merge, second pass, frame, layout, needs (2026-10-12)

- **Map:** 222 entities in `map/strokes/S4b.json` (`check` PASS, no warnings):
  - 66 figures (5 of them crew on boats), 10 animals, 3 land vehicles and **6 boats**;
  - 13 trees, 71 props, 24 buildings, 3 structures;
  - 3 roads (the route, the open square north, the top street), 1 water, 2 banks, 20 groups.

  The merge settled duplicates and things left between units (`gen/map/S4b/merge_notes.md`). The two second-pass
  agents proposed 17 fixes; 16 were accepted and 1 declined (`merge_fixes.mjs` section 7, idempotent).
- **Frame** (`map/frames/S4b.json`): part 1's seam knot `[12600, 31.6]` is kept constant. The ground edges near the
  seam read −57 north of the road and +97 south of it, both outside ±5 and in opposite directions, so the lead decides
  (`gen/map/S4b/reports/frame.md`).
  - Datum (12600, 1206) at station +67.95.
  - Water H −0.7 (a bound, conf low: the moorings have no vertical bank face).
  - Decks, the tea house floor (0.18), the cart bed, the table tops and the bird's perch, each from two stroke points.
- **Layout:** `sections/outer_road_2/layout.json` (66 figures, 13 trees, 123 others). Its `painted_area` west corners
  equal part 1's east corners exactly. The west seam handed to S3: route point (15500, 1530) est, station +110.35,
  dx 31.6.
- **Boats:** five moor side by side with their bows to the bank (west); their sterns carry the rudder, sweep or tiller.
  One small boat lies along the far bank. The biggest (`S4b.veh.boat_big_cabin_14928`) runs to u ≈ 15855, into S3's
  range, and is S4b's.
- **Needs:** `gen/expand/outer_road_2_needs.md`. All 66 figures are cast from the existing 22, with no new character
  and 20 free clip retargets. Three new takes are ranked (the wheelwright, the seated man showing goods, reaching up to
  a cart's load). The list also gives:
  - the palm-thatch cart variant;
  - the six boats against the kit's presets, with the boat factory's inventory corrected;
  - new carried props and kit parts;
  - the tree forms (7 `willow_fan`, 2 `elm_claw`, 2 `slender`, 1 `shoot_tree`, 1 stump).
- **Lessons:** `gen/expand/outer_road_2_lessons.md`, with the boats and water first. **Run 1 report:**
  `gen/expand/round2/outer_road_2_run1_report.md` (counts, frame, hard readings, seam notes by S4 ID, the S3 seam,
  contradictions with `sections.md`).
- **For Run 2:**
  - Figures stand on `tea house floor`, `cart bed`, `boat deck` and `boat roof` supports.
  - `S4b.ani.bird_12827` perches in part 1's `S4.tree.willow_12588`.
  - The mat-cargo boat's gangplank, (14760, 402) → (14895, 463), carries the porter `porter_baskets_14778` aboard.
  - No stair, jetty or revetment is painted, so none is built.

## Run 2: built, cast and checked (2026-10-12)

**The scene** (`blender/outer_road_2_scene.py`, headless `tools/build_scene.sh outer_road_2`, shipped with
`tools/export_web_scene.mjs outer_road_2`, which also builds the boats GLB): every building, structure, prop and land
vehicle of the map inside `sb.entity(<map id>)`, real size on its painted footprint. Parts: `song_kit.py`,
`kit_inner_city.py`, `kit_outer_road.py`, `kit_vehicles.py` (the sedan chair, the spoked wheel), and 24 new generic
parts in this area's `blender/kit_outer_road_2.py` (the kit agent: the palm-covered cart 大棕盖车, chairs, the pole
frame with its basket, the timber pile, the sieve basket, the two-tier stall, the goods on a mat, the tray, the counter
frame, the big jar, the funnel vessel, the fan-shaped thatch shade, the slatted frame, the straw heaps, the mooring
post, the striped load, the tool, the tea house's fringed canopy and open king-post gable, the roof hatch, the
south-row hall type, the open mat shed, a generic `hall()` and the valance; review sheets in the kit agent's scratchpad
`S4b_run2_kit/sheet_all_*.jpg`). The river: `kit_boats.water_strip` (how: below). The boats: `blender/build_boats.py`
from `build_choices.json` `boats`. People: `sections/outer_road_2/people.json` from
`gen/sections/outer_road_2/make_people.py` (the casting agent; rerun after any layout change). Backdrop: one east
panel of S3's strip (the backdrop agent; `backdrop.json`), mist north and south, none west (part 1 is built).

**Numbers:** 125.4k triangles drawn (buildings 84.6k, props 16.1k, the two carts and the sedan 11.7k, the ground
10.2k, structures 1.6k, seats, trunks and the water 0.3k), 37 draw calls in the GLB, `outer_road_2.glb` 2.1 MB; the
boats GLB 0.79 MB (6 boats, 23.3k triangles at full detail, 9.6k far, 0.8k collider triangles). `budget_check
outer_road_2` PASS (download 3.9 MB, 12.9 MB with kit and cast; 124.7k drawn of 130k; 188 draw calls at the carts;
38 MB GPU). 95 triangles/m² over the 1320 m² painted area: the 24 buildings are the bulk (roofs, plinths, column
bases); distance LODs on the page are the lever, as in part 1.

**The moorings (the pilot): shortened, narrowed, spread, and the far bank moved.** At the kit's real sizes the six
hulls overlapped in 10 pairs and ran onto the bank (`gen/sections/outer_road_2/boats/moorings_kit_default.png`): the
painter draws the moorings at the far-row scale, so the frame's single depth rate gives the cove 13-15 m across, and a
raft of five needs about 20 m even at 0.6 of the types' lengths. Planned in 2D with the kit's hull outlines
(`gen/sections/outer_road_2/boats/boat_plan.py`, `solve.py`; result `moorings_plan.png`: black lines are the painted
waterlines, filled shapes the built gunwales):
- kinds (the old `kind_of` misread two slugs): big cabin passenger, arched awning grain, mat cargo grain (laden),
  long cabin passenger, the arched boat without the kit's crew house aft (its painted boatman sits in the open), round mat **small** (its painted extent allows 5-6 m), small cabin small;
- lengths 0.6 of the type for the five rafted boats (11.4 / 12 m), 5.0 and 6.0 m for the small ones; beams 3.0-3.2 m
  (a real proportion for 11-12 m hulls), the small ones 2.3 and 1.9 m; freeboards set from the frame's deck supports;
- moves: each boat outward (east) until its stem is at the shore, then north as far as its south neighbour needs
  (gaps 0.10-0.39 m); after QA the arched and long boats 0.85 and 1.55 m further out, so their raked bows' tops (1.5 m
  past the stem) stop at the bank's edge instead of lying over it, keeping the painted order big - arched - mat cargo - long - round, the small boat along the far
  bank 4.5 m downstream; the mat-cargo boat 2.4 m further out so its gangplank spans to the bank; crews moved with
  their boats;
- **the far bank 5.5 m north** along the receding direction (`how` S4b.water.bian_river): the water's far shore, the
  far bank's lines (in the builder: `map_layout` doesn't move lines) and the shed and two willows on it (moves); the
  cove's north-west shore carried on to meet it. The round and small boats and the far bank now lie 0-4 m past the
  silk's top edge, in light mist.
- The river strip (298 triangles, 153 shore-wall pieces) runs on 16 m east past the S3 seam under the mist, its near
  shore along S3's mapped near shore (copied into the builder), so the sterns that cross the seam float; the lead cuts
  it back when S3 joins.
- What the kit can't build yet (waits on the boat factory): the anchor lines from the arched and mat-cargo boats'
  sterns, the mat-cargo boat's bow mat roof and raised sweep, the long boat's bow mat roof and emblem.

**Other choices** (marked `choice:` in the builder):
- the shop hall squared to the frame's axes like part 1's hall (front D 11.0, back 14.6, east wall X 61.0, where the
  painted east edge passes at mid-depth); its west end under part 1's hip (the two roofs meet: a seam note for the
  lead); the signboard plain (its writing is illegible: no sign cell);
- the big roof hall behind it X 51.6-58.0, D 15.6-17.9, so the seated man and his goods sit outside its walls under its
  mat awning, and the bird painted over the official hall perches above its eave;
- buildings on the top street and by the moorings on their painted fronts (turned with the street), real eaves
  2.5-2.6 m (the map reads 0.5-1.1 m far up the silk), depths 2.4-2.6 m where their backs run off the silk;
- the south row squared to the frame's axes on chosen rectangles inside the painted footprints so that neighbours
  don't overlap (the footprints are est and overlap): 13380 x 66.2-69.4, 13770 x 69.9-74.9, 13810 x 69.6-73.6 (facing
  the road), 13920 x 73.9-79.3 (balcony), 14340 x 79.5-85.3, 14680 x 79.6-89.6 (hip-gable, hatch on its south slope,
  fish on its east gable), 14945 x 85.6-91.0, 15242 x 91.3-96.2, the low house behind the willow x 90.9-93.6 north of
  the road with its reed screen in front;
- the tea house: its gable posts at u 14465 and 14742 (the west one 0.35 m east, clear of the hatted customer's chair),
  ridge north-south, a long west lean-to over the tables, the smaller east gable roof, the fringed canopy 2.3 / 2.75 m;
  the platform 0.18 m along its mapped edge;
- the wheelwright's shed along its painted axis, 2.2 m deep, the lean-to of mat on its two posts, the rail to the elm;
- seats the map lacks are the sitters' (rule 3): six stools from `seats.json`; the cart sitter on a hidden block at
  the palm cart's plank (the cart's);
- the tables squared to their halls; `table_14722` moved 0.9 m east to the customer painted leaning on it;
- the stump `S4b.tree.stump_14805` built as a model (`kit_outer_road_2.stump`, how: model), not a card, as the
  catalogue asks; until the tree factory assigns it `card: kit` the page also plants its fallback willow card there.

**Loyalty:** `node tools/loyalty_check.mjs S4b` PASS: 71/71 props, 66/66 figures, 24/24 buildings, 13/13 trees
(cards), 10/10 animals, 9/9 vehicles (6 boats in the boats GLB, 5 crew on 3 of them), 3/3 structures, roads, banks
and the water. Nothing unbuilt.

**Checks** (QA agent, then rerun by the area agent after its fixes; outputs in scratchpad `S4b_run2_qa/`, `S4b_run2_lead/`):
- walks alone `walks.json` 26/26 PASS: every edge (west on the seam, south, north west of the cove and at its corner,
  east on land both sides of the road), the shore walls where no boat touches, the road both ways, onto the tea
  house's floor; boarding from the bank onto the big cabin boat (its whole south side), the arched-awning boat (bow and
  bow quarter), the mat-cargo boat (over its bow), the long boat (over its bow from the north-west); across the raft
  arched -> mat cargo -> long -> round and back; a rail where a deck touches nothing; ashore again; the big boat's stern
  doesn't lead off past the seam. Joined `walks_joined.json` 4/4 PASS (across u 12600 on the road and at D 25, both
  ways). Riding: standing 10 s on the big, arched, mat-cargo and long decks you drift 0.03-1.4 cm in the boat's frame
  while the deck bobs 6-7 cm; on the round boat you stand at the bridge from the long boat (its awning covers its
  floor) and the two boats share you (6 cm).
- **The gangplank isn't walkable yet** (a page and kit fault, for the lead): the plank meets the mat-cargo boat's
  tapering bow rim at about 15°, the rail opening collapses to a 0.22 m slot and the end walls cross the plank's own
  corridor (QA's diagnosis in `S4b_run2_qa/diag/`). It stands as painted, the porter walks to its foot, and the boat
  is boarded over its bow. Not in `walks.json`.
- `people_check` at `?window=all`: PASS alone (76 people) and joined (157). The bank walker's path stops short of the
  arched boat's bow (it climbed onto its bridges); no walker leaves the ground (y -0.1..0.1).
- shots alone `shots.json` (16) and joined `shots_joined.json` (3), sheets in `gen/sections/outer_road_2/shots/`.
- `loyalty_check S4b`, `ktx2.mjs check`, `budget_check outer_road_2`: PASS.

**Seam notes and open points for the lead:**
- part 1's `S4.bld.official_hall_12530`: the shop hall's west end meets its hip (one painted roof); part 1's ground runs
  16 m past u 12600 (to cut back on the join).
- S3: S4b's sterns reach X 88-94 past u 15500, over S3's painted boats (`S3.veh.boat_under_way_15595`, rowed 8 m
  west and back; `S3.veh.boat_towed_mast_16228`; `S3.veh.boat_passenger_long_16398`) and its far shore (D 26.3-28.7 at
  X 88-94 against S4b's moved 34.9); S4b's water, ground and edge:east run on east 16 m and are cut back when S3 joins.
- Page/kit: the gangplank (above); a probe that lands a bridge on a neighbour's roof block; leftover 0.5 m shore-wall
  stubs on some bridges (cosmetic).

## Join agent, restart run (2026-10-12 evening)

Details are in `gen/expand/round2/joins_report.md`.
- **Round-2 boat options:** merged from `gen/boats/round2_options.json` into `build_choices.json` `boats.*.kit`.
  `outer_road_2_boats.glb` rebuilt: 25.1k / 9.8k triangles, 836 KB.
- **Deck walks:** six re-aimed for the new hoods (`why` dated). 26/26.
- **S3 seam:** the ground is cut to 0.5 m past u 15500, and the water strip stops on the seam
  (`blender/outer_road_2_scene.py`). S3's water starts there edge to edge.
- **The gangplank:** it can be walked to its top since the page fix, but the painted bow hood closes its deck end.
  Its walks are in `gen/sections/outer_road_2/qa/run3/walks_gangplank_pending.json`. For the user.
- Loyalty PASS; budget PASS (124.9k of 130k triangles).
