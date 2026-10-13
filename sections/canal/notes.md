# S2, the canal wharves (汴河 · 运河两岸): section notes

S2 is scan u 20500–29050 (map key `S2`, folder `canal`; the east end moved from 28700 to 29050 in round 2's Phase 0, so
the 望楼饭铺 shed and its customers stay whole here). Its neighbours are S3, the Rainbow Bridge, at u 20500 and S1, the
countryside, at u 29050. The area brief is `gen/expand/round2/brief_canal.md` and the tile brief `gen/map/S2/brief.md`.

## Restyle (setup, 2026-10-12)

**Two halves, not one section.** The first run used the whole area as one section (`sections/canal/section.json`,
rect [20336, 0, 8864, 1792], overview asked at 4096 × 832). The image API does not draw an image that wide: it
returned the overview at **4096 × 1658, letterboxed with white bands** (the painted band about 4096 × 950, its content
squeezed). `cutOverviewCrops()` takes each tile's colour crop at the width ratio on both axes, so every row-0 tile got a
crop that was mostly white and every row-1 tile a crop of the wrong rows. The run was stopped after 11 tiles and is
kept, unused, in `gen/sections/canal/runs/whole_letterboxed/`. **Don't run the pipeline on `canal`.** S1's
countryside overview (asked 4096 × 848) came back the same way, 4096 × 1695; S3's (asked 4096 × 1376, about 3:1) came back
4096 × 1415. Keep a restyle unit's aspect to about 2.6:1 or less.

The restyle runs as two pipeline sections nested in this folder:

| name | rect | scan u | overview | tiles |
|---|---|---|---|---|
| `canal/west` | [20336, 0, 4608, 1792] | 20336–24944 | 4096 × 1600 (came back at that size) | 5 × 2 of 1024 px, 128 px overlap |
| `canal/east` | [24592, 0, 4608, 1792] | 24592–29200 | 4096 × 1600 | 5 × 2 |

They overlap at u 24592–24944. Read with `node tools/scroll_inspect.mjs canal/west …` for u < 24768 and `canal/east`
for u ≥ 24768. The mosaics are `gen/sections/canal/west|east/mosaic.jpg` (2× the scan; scan u = rect u + px/2).

Registered alignment (before → after), every unit `ok`:
- west: overview 0.552 → 0.568; tiles 0.33–0.54 (lowest t_r1c0 0.332, t_r0c1 0.354, t_r0c4 0.385, t_r1c4 0.391);
- east: overview 0.513 → 0.589; tiles 0.38–0.64 (lowest t_r1c4 0.381, t_r0c4 0.422).
The gate's were 0.43–0.52. The low scores are open water (random ripple lines) and willow crowns, not shifted
layouts; the check sheets confirm the positions.

**Rerun:** the east tiles t_r1c1 and t_r1c2 (u ≈ 25490–27410, v 770–1790) first painted **the river as dry, grassy
ground** with tufts, and the bank under the great willow as flagstones. The overview has water there, but its water is
nearly the ground's colour. Both were redrawn with `--force`; see "Second and third draws" below.

## Where the restyle invents (read from the check sheets; positions in scan px)

Never record a thing because the restyle shows it. Most inventions are **extra people**: in crowds, on boats, and in
knobbed willow trunks.

West half:
- u ≈ 20440–20550, v 1270–1460 (S3's side and t1) and u ≈ 21490–21545, v 1160–1245 (t2): **figures climbing in the
  willow trunks**; the scan has the trunks' knobs. Two or three figures at the big willow's west foot
  (u ≈ 21236–21344, v 1275–1383) are partly real (the people by the shed at u ≈ 20900–21100 are painted): count on the
  scan.
- u ≈ 20955–21230, v 1060–1200 (river_w): the small covered boat's mat canopy is drawn as a tiled pavilion roof on posts.
- u ≈ 20970, v 610–650 (river_w): a small mark in the open water that the restyle makes a man with a child: read it on
  the scan.
- u ≈ 21000–21360, v 150–220 (river_w): a railing with a standing man on the big cabin boat's roof: check.
- u ≈ 21820–22160, v 150–390 (t2): **seven trackers**, two of them half-hidden behind others; **the scan shows five**
  (张安治's "five trackers").
- u ≈ 22290–22950, v 270–470 (t3): **about six walkers on the bank strip** in front of the houses, and a broad stone
  stair at u ≈ 22480–22590 (v 290–415); the scan has only the bank, the grass wash and the tow rope.
- u ≈ 21880–21960, v 1570–1680 (t2 / river_w2): a man shouldering a beam, made from a wooden object: read it.
- u ≈ 21970–22215, v 1440–1590 (river_w2): the cabin boat at the bottom **filled with about five people**; the scan shows
  one or two.
- u ≈ 22130–23065, v 1350–1720 (river_w2): on the bottom boat the scan has one man pouring a bucket over the side; the
  restyle adds a second man sitting on the gunwale.
- u ≈ 23320–23540, v 490–600 (river_w2): **豪华客船's foredeck: about five people round the windlass**; the scan shows one
  (≈ 23500, v 540–600) and the windlass. Its cabin windows (u ≈ 23200–23300, v 700–800) show three or four faces where
  the scan has two.
- u ≈ 23600–23720, v 300–420 (t4 / t5): a group of four or five (one in red) under the shelter east of the terrace; the
  scan shows one or two among the tables.
- u ≈ 23750–23980, v 500–580 and u ≈ 24600–24740, v 520–650 (river_m; both halves agree): **knots of four or five people
  in red and blue on 逆水行舟's northern hull**; the scan shows two or three and a winch.
- u ≈ 23600–23705, v 930–1060 (river_m): two men on the southern hull's bow where the scan has one.
- u ≈ 24180–24620, v 40–260 (t5): the cart's team drawn as an ox, with riders in red on horses at ≈ 24480–24600: read the
  team and any riders on the scan.
- u ≈ 24600–24900, v 0–200 (t5 / t6; both halves): **a willow where the scan has stacked poles** and the scaffold's
  pole tips; no tree is painted there.

East half:
- u ≈ 25500–26500, v 0–130 (t7 / t8): the far street drawn denser than the scan reads at low zoom: an ox cart with a
  round load at ≈ 25950–26015, oxen, about ten people. The strokes there are small and faint: count on the scan at
  zoom 3.
- u ≈ 25900, v 540–585 (t7): a small standing figure in blue on the bank, probably a post.
- u ≈ 26580–26720, v 50–150 (t8): two figures in red at the willow trunk at the top; the scan has one (≈ 26700).
- u ≈ 26876–26906, v 60–215 (t8): **王家纸马铺's signboard** drawn as a black pole with a lamp and no writing: copy the
  characters from the scan.
- u ≈ 26700–27050, v 690–1000 (t8 / t9 / river_e): the bank under the great willow paved with flagstones; the scan has
  bare ground and wash, then water.
- u ≈ 27140–27200, v 245–325 (t9): a man in red beside the porter with a pole; the scan has the porter only.
- **u ≈ 27300–27620, v 180–450 (t9 / t10): about twelve invented people** in the yard under the tall pole frame (a crowd
  of eight or nine at v 330–440, two by the frame, one in red, a rider). The scan (checked at zoom 3) has the empty yard
  and the frame; only the porter with baskets at ≈ 27640 (v 350–460) is painted.
- u ≈ 27715–27745, v 815–935 (t10): a child in red beside the walking porter: not on the scan.
- u ≈ 28180–28380, v 645–920 (t10 / t11): six or seven sack porters where the scan has about four or five: count on the
  scan.
- u ≈ 28210–28430, v 1030–1230 (t11 / river_e): a horse and two or three men round the porter carrying a sack up the
  bank (≈ 28230–28390, v 1100–1230): only the porter is painted.
- u ≈ 28420–28530, v 790–1130: small dark shapes (birds? a dog?); the restyle makes one a leaping dog: read them.
- u ≈ 28450–28850, v 1270–1630 (river_e): **about eight people crowded onto the bottom boat** under the willow; the scan
  shows one or two among the cargo and the willow's knotted trunk.
- u ≈ 28910–28990, v 570–680 (t12): **the rider on a dark horse or donkey** by the long shed is drawn as two standing men:
  the animal is painted.
- u ≈ 28600–29200, v 0–330 (t11 / t12 / structures_e): a hillside with terraced fields, a fenced path and houses; the
  scan has roofs at the top and willow crowns.
- u ≈ 28310–28560, v 60–290 (structures_e): the 望火楼's platform drawn as a wide stepped stone terrace: read its corners
  and stair on the scan.
- Throughout: the restyle adds red robes and fills sheds and decks; positions of the painted figures are mostly right.

## Second and third draws (east t_r1c1, t_r1c2)

- **t_r1c2** (u ≈ 26384–27408, v 768–1792), second draw: the river is water now (alignment 0.270 → 0.494). The bank
  under the great willow (u ≈ 26700–26900, v 780–1000) is still partly paved with flagstones. Kept.
- **t_r1c1** (u ≈ 25488–26512, v 768–1792): the second draw was dry ground again (0.522), and the third invented **a
  whole street of shops** with banners and jars where the scan has open water (registration failed: 0.006 → 0.067,
  scale 0.91/0.885, shift 110 px). The first draw is back in place (0.589; re-registered and restitched), so **the
  stitched east mosaic shows dry ground below the moored boats at u ≈ 25500–26400, v 1000–1790**, fading into water from
  about u 26400. It is the river: the scan has the ripple lines. All three draws are kept in
  `gen/sections/canal/east/runs/first_draw/` (`_USED` is the one in place).
- **Lesson:** where the overview paints water in nearly the ground's colour, the tiles below a row of moored hulls read
  the open water as a yard. More draws don't fix it; a tile prompt that names the river (or a water-tinted overview)
  would. That is a prompt change, so it is the user's call (skill `scroll-section`, "Changing the style or the
  prompts").

## Open issues

- The halves' overlap (u 24592–24944) holds the same things drawn twice; read each from the half that owns it (west
  below u 24768).
- `tools/scroll_pipeline.mjs` could detect a letterboxed overview (returned size ≠ asked size) and stop before the
  tiles: a request for the lead.

## Run 1: the map (2026-10-12)

S2 is mapped. The record is:
- the strokes: `map/strokes/S2.json` (398 entities, `check` PASS);
- the frame: `map/frames/S2.json`;
- the world and the text: `map/world/S2.json` and `map/text/S2.md`;
- the layout: `sections/canal/layout.json` (140 figures, 21 trees, 198 other entities);
- the merge, the second pass and the frame step: `gen/map/S2/merge_notes.md`;
- every unit's report: `gen/map/S2/reports/`.

The Run 1 report is `gen/expand/round2/canal_run1_report.md`, the needs list `gen/expand/canal_needs.md`, and the
lessons `gen/expand/canal_lessons.md`.

**What the strokes hold:**
- **People:** 140 figures, 53 of them on boats. The crowds the restyle paints are not there: 喝杯小酒's tables, the
  jetty, the yard under the pole frame and most sheds are empty.
- **Boats:** 17. 逆水行舟 is towed by five trackers, not rowed. The setup's "small canopied boat" is a cargo boat's
  deckhouse, and its "skiff" is a sweep's blade.
- **The 望火楼:** a brick platform, a wooden stair and a pavilion. Nobody is on it.

**The restyle's inventions, confirmed by the mapping** (the list above was the setup's warning):
- the twelve people under the pole frame;
- the crowds on the decks and round the windlasses;
- the two extra trackers (seven drawn, five painted);
- the figures in the willow knobs;
- the eight people round the bottom boat, and the man briefed at its east end (its rudder head);
- the stepped stone terrace under the 望火楼;
- the hillside of terraced fields at the top right;
- the dry ground and then the shop street under the moored boats at u 25500–26400.

Also invented:
- a willow at u 24600–24900, which is a pole stack and the scaffold's pole tips;
- a "leaping dog", which is a ladder's cross-bars;
- an ox for the cart's two mules;
- two standing men for the dark donkey at 望楼饭铺's east end.

Positions of the painted figures are mostly right, but the restyle's registration drifts 30–45 px inside some tiles.

**The frame:**
- **Knots:** [[20500, 30.4], [22185, 43.1], [23989, 48.3], [25924, 46.6], [28121, −51.6]]. The receding direction
  turns over east of u ≈ 26000; option A is used, and the lead decides.
- **Datum:** S3's route point (20500, 258, est), station +179.21.
- **Water:** −0.7, copied from S4b.
- **The east end:** the route ends at (29050, 730), station +314.87, which is S1's datum.

**Open for Run 2 (the lead's calls first; `map/frames/S2.json` questions):**
- the knot option (A, B or C);
- the thin strips: 0.20–0.29 m in front of the scaffold house;
- the bank faces where the est shores map north of their bank tops;
- the route's open points: the wash slope at u 22600–23300, and the warehouse plinth at 26100;
- the small frame at u 20440–20530 that nobody records;
- the bank lines at the S1 seam, read twice.

## Run 2 (2026-10-12): built; the records

The Run 2 build is recorded in `gen/sections/canal/build/notes_build.md` (the builder: numbers, what was built, the
choices), `gen/sections/canal/cast/notes_cast.md` (the casting, generated by `make_people.py`) and
`gen/sections/canal/boats/` (the boats agent's plan, moves and crew checks). The river plan is
`gen/sections/canal/river_plan.json`. The lead rebuilt and exported at 18:08 after the PC restart.

## Restart run (S2 finisher, 2026-10-12 evening)

- **18:35 stage 1, build current.** The workshop delivered (boatman, grain_porter, the takes `work_sweep`, `fend_pole`,
  `pole_boat`, `haul_line`, `sack_carry`; `horse_dark`, `donkey_dark`), so `python3 gen/sections/canal/make_people.py`
  was rerun: 40 of 129 figures changed (boat crews play the boatman and its takes, the sweepmen `work_sweep`, the sack
  porters `grain_porter` with `sack_carry`), the dark horse and donkey play their dark tones, and the footing under
  `man_in_river_20970` moved with his recorded move (out of the cargo boat's hull). Rebuilt (`tools/build_scene.sh
  canal`, 116.8k triangles) and exported (`node tools/export_web_scene.mjs canal --no-boats`; the boats GLB of 17:04 is
  current). `ktx2.mjs encode` (3 new: grain_porter, horse_dark, donkey_dark), `check` PASS. `loyalty_check S2` PASS.
  Scroll index max 0.73 px.
- **Budget, the cheap fix:** the builder rounds tiled UVs (box UVs and the ground's) to 1/1024 of a swatch repeat
  (`UV_Q` in `blender/canal_scene.py`, a `choice:`): the export's quantize skips UVs outside 0-1, so they shipped as
  float32 (0.93 of the GLB's 1.93 MB); rounded, meshopt packs `canal.glb` to 1.74 MB. The section's download is now
  **8.88 of 9 MB, PASS**. With kit and cast it is **24.62 of 20 MB, FAIL**: the cast is 26 models, 14.76 MB (idler
  alone 1.27 MB with 43 clips): an exception is requested in the report.
- Next: `walks.json` and `shots.json` in `sections/canal/`, then
  `tools/chrome_slot.sh node tools/walk_page.mjs "http://127.0.0.1:5190/world.html?sections=canal" sections/canal/walks.json`.
- **18:56 stage 2, checks alone** (world.html?sections=canal, the check server 5190, Chrome slots):
  - `sections/canal/walks.json` written (26 routes, planned over the page's own colliders probed at 0.25 m):
    **26/26 PASS** (`gen/sections/canal/qa/run3/walks_alone.log`): the four edges (west twice on land, north twice,
    east twice, south), the shore walls on both banks, the north bank W->E in five legs and back E->W in three, boarding
    the big cabin boat, the hooded-bow cargo boat (its 28 deg west bridge; its other two rise 37-40 deg, over the
    walker's 34 deg limit), the mat-roofed, open and mat-shelter boats, and carried on 逆水行舟 and the sweep boat
    (held at the rail 8 s while each pauses, then carried 4 m with it).
  - Not boardable, recorded for the user: the passenger boat (u 22545), the mat-cabin boat (u 25980) and the bottom
    boat touch nothing; the mat-canopy boat's (u 25145) bank bridges land under its mat canopy (1.83 m), and the
    mat-cargo boat's under its canopy's eave, so you stop at their rims.
  - The first grain boat's gangplank can't be walked: `boats.js` `contacts()` adds a plank's contact only when its
    nearest rim piece has none, and that piece touches the second grain boat, so the shore walls along the plank stay
    shut (you stop at the water's edge, 261.7, 9.3). Request in `gen/expand/round2/page_queue.md`; the pending walks
    are `gen/sections/canal/qa/run3/walks_gangplank_pending.json`. The plank also passes over the second grain boat's
    west end (it moved 2.5 m north after the plank was set): for the user.
  - `people_check` (`?window=all`, `--into bank_man_light_robe_25338 --road "194.5,22.3"`): **PASS** (11 walkers, 0
    stuck, ground -0.27..0.33; 2 went round the player in the unloading yard). The east bank's walkers are too sparse
    for a 12 s road spot (none crossed at 272, 12.74 or 259.5, 18.34).
  - `sections/canal/shots.json` (18 spots) -> `gen/sections/canal/qa/run3/shots_alone/sheet.jpg`: no console
    errors; the rounded UVs show no seams or swimming on walls and ground (shots 17, 18).
- FINAL BUILD 18:56 (canal.glb 18:33 with the rounded UVs and the moved footing; canal_boats.glb 17:04)
- Next: joined checks once S3 and S1 write their FINAL BUILD lines:
  `tools/chrome_slot.sh node tools/walk_page.mjs "http://127.0.0.1:5190/world.html?sections=rainbow_bridge,canal,countryside" sections/canal/walks_joined.json`.
- **19:05 stage 3, joined, HUD, budget, recast** (the GLBs unchanged since FINAL BUILD: canal.glb md5 db9f328a…):
  - **Recast** for the workshop's 18:36 take review: `make_people.py` drops takes marked NOT TO USE (`NOT_TO_USE`:
    pole_boat, chase_run), so `boatman_poling_24730` plays `stand_pole` with `long_pole`; the pennant holder (robed_man,
    no pole bound to `fend_pole`) plays `stand_pole` again. The paid run's tracker, straw_hat, dark_hat and youth had
    landed, so every figure now plays its own character (no stand-ins). Seats unchanged (no rebuild); data re-shipped
    (`export_web_scene.mjs canal --no-boats`, the GLB byte-identical). Walks alone 26/26 and `people_check` PASS again.
  - **Joined** (`world.html?sections=rainbow_bridge,canal,countryside`; S3 and S1 FINAL at 18:58 and 18:59):
    `sections/canal/walks_joined.json` **8/8 PASS** (`qa/run3/walks_joined.log`): both seams both ways, the S3 seam on
    the north strip and the south bank, the S1 seam on the road and north of 望楼饭铺. Shots `shots_joined.json` (9):
    `qa/run3/shots_joined_s3/`, `shots_joined_s1/`. For the join agent: at the S1 seam the east reach's water (run on
    to the seam, the lead's call) ends against S1's ground in a straight pale vertical face (about X 271-275, D -4..7,
    shot j08); and at the S3 seam pale flat patches show on the shore near the seam (j03, j05; the page's mist item?).
  - **HUD** (`qa/run3/hud/`, `hud.json`): the trackers, the unloading yard, the grain wharf: boxes on the painted
    figures (42, 72, 31). The ring sits on the painted spot at the grain wharf (u 28224, bank shift -0.1 m); on the
    middle north bank it reads up to 3.2 m (about 250 px) south of the painted bank, into the painted boats, because
    the river plan widened the bank there (`river_plan.json` `shift`, -2.75 m at u 22500, -3.2 m at u 24550) and the
    HUD maps the walker by the frame alone. For the user.
  - **Budget, loaded** (`--cdp` in a Chrome slot, `qa/run3/budget.log`): section download 8.88/9 PASS, draw calls 301/330
    PASS (at the terrace), GPU 73.4/75 MB PASS, triangles 115.2k/130k PASS; **download with kit and cast 25.12/20 FAIL**
    (cast 15.27 MB, 27 models): exception requested in the report.
  - **The boats' crew check** (the boats agent's, cut off by the restart; `gen/sections/canal/boats/crew_check.py`
    rerun, `qa/run3/crew_check.log`): 61 spots, 3 flagged as before: the two passengers in 逆水行舟's cabin window (the
    boat's body 0.8 m over their feet: the window's sill, which is where they are painted, showing over it) and
    `child_or_vase_21076` under the covered boat's mat (1.5 m: a child, under 1.5 m tall). Accepted, recorded.
- Next: the report `gen/expand/round2/canal_run2_report.md`; nothing of S2's left running.
- 19:06 report written: `gen/expand/round2/canal_run2_report.md`. Nothing of S2's running.

## Join agent (2026-10-12 evening)

Details are in `gen/expand/round2/joins_report.md`, Stage 4.
- **The S1 seam's river end:** the bed rises to just under the water at the seam, and the ground stops on the seam
  where the east reach's water meets it. North of the water's end the ground runs on 1 m past the seam, dipping
  0.15 m under S1's bank (`blender/canal_scene.py` `ground()`: `at_end`, `hz`, the clip's `lambda`).
- Rebuilt and exported `--no-boats`; loyalty PASS.
- Walks: 26/26 alone, 8/8 joined. `people_check` S3+S2+S1 PASS.
