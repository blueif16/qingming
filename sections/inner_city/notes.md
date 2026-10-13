# Inner city (S6): notes

The west area of the joined world: 余辉's sixth segment (闹市繁华), from the S5 seam at scan u 5600 to the square well
at about u 2000. It holds 孙羊正店 with its 彩楼欢门, the two sedans at its door, the butcher's flag and the
storyteller's ring, the crossroads with the mule wagons, the cloth shops and the clinic at the top, the incense shop,
the inn 久住王员外家 along the lower edge, the donkey cart with wine casks, the paper-horse stall under umbrellas and
the square well. The brief is `gen/expand/brief_inner_city.md`. Positions come only from the scroll map
(`map/text/S6.md`, `layout.json`); the restyle here is a look reference and a reader for faded silk.

## Restyle, run 1 (2026-10-11)

**Setup** (`section.json`): scan rect `[1856, 0, 3888, 1792]` (u 1856–5744, the area u 2000–5600 plus about 150 px
past both ends, clipped to multiples of 16), the gate's prompts, model gpt-image-2.5 and style image B1 unchanged.
The overview is 3888×1792 (the rect's own size). Tiles: 1024 px with 128 px overlap, 5 × 2 = 10 tiles. All 11 units
generated first time (about 40–48 s each).

**Alignment** (raw → registered): overview 0.605; tiles 0.48–0.70 after registration (t_r0c1 0.70, t_r1c0 0.69,
t_r1c1 0.66, t_r0c2 0.65, t_r1c2 0.57, t_r1c4 0.55, t_r0c4 0.51, t_r0c0 0.50, t_r0c3 0.50, t_r1c3 0.48). That is
better than the gate's 0.43–0.52. Shifts are small (2–10 px) except t_r0c4, which the model had drawn 34 px low;
registration took it out. Scales stayed within 2.5%.

**Review of the check sheets:**
- **Faithful:** the street crowds, the storyteller's ring, the rider, the sedans and their bearers, the wagons and
  mule teams at the crossroads, the incense shop and its sign 刘家上色沉檀拣香, the 正店 and 香 lamp-boxes, the well with
  its 田 cover and the men at it, the paper-horse stall's umbrellas, the 解 sign and its ring, the cask cart and its
  two donkeys, the inn's upper storey with the scholar at his desk. Figures keep their places and poses; the
  restyle is a good reader for faded faces and dress.
- **Misread: the 彩楼欢门** (t_r0c3, t_r0c4; scan u ≈ 4400–5300, v ≈ 250–550). The model turned 孙羊正店's flowered
  scaffold gateway into a second tier of balconies with eaves and railings, packed with drinkers, and filled the
  upper storey with more people than the scroll paints. On the scroll that tier is posts, cross-bars, flower bunches
  and streamers. The mapping agents were warned: figures there come from the strokes only.
- **Trees:** the needle-cluster trees along the bottom edge and the big tree over the well are painted bare with
  willow-green buds, as on the gate (S5's tile agents noted the same). Species come from the strokes.
- **Colour:** true greys and blues on the roofs, varied robes, warm silk ground. Same look as the gate.
- The mosaic (`gen/sections/inner_city/mosaic.jpg`, 7776×3584, 2× the scan; `mosaic_view.jpg`) shows no visible
  ghosting at the tile overlaps at review size.

**Use:** `tools/scroll_inspect.mjs inner_city <u> <v> <half>` reads faded silk beside the scroll; new characters are
cropped from the mosaic (`characters/<name>.json` crops are in scan px of this registered restyle).

## Mapped from the strokes, 2026-10-11 (Run 1)

**How.** Seven subagents, as on S5:
- six tiles of 600 px ownership (u 2000–2600 … 5000–5600), each looking 150 px past both ends. The tiles are narrower
  than S5's ~800 px because this is the densest part of the scroll;
- one structures pass over the whole area.

All of them worked from `gen/map/S6/brief.md`. The lead then:
- merged the parts with `gen/map/S6/merge_fixes.mjs` (duplicates on the seams retired, groups joined across tiles,
  supports normalised);
- made a second pass over every window (`gen/map/S6/look/lead_*`), which found four painted things nobody had
  recorded;
- wrote the frame.

The parts are in `gen/map/S6/parts/` and the agents' reports in `gen/map/S6/merge_notes.md`.

**The map** (`map/text/S6.md`): 373 entities.

| Kind | Count | What |
|---|---|---|
| Figures | 180 | |
| Animals | 19 | 8 donkeys, 8 mules, 2 horses, 1 dog |
| Vehicles | 8 | 2 sedans, the sack cart, the cask cart, the 太平车, a hidden wagon, 2 barrows |
| Trees | 14 | |
| Props | 85 | |
| Buildings | 15 | |
| Structures | 7 | |
| Roads | 3 | |
| Groups | 42 | |

**What the strokes say against what we expected** (details in the text map):
- **The 解 sign and its ring are in S6.** The sign and the whole ring of 12 stand at u 2030–2340. sections.md files
  them under S7 (≈ 1980–2600). The square well (curb 2000–2205) is S6's too. What crosses u 2000 into S7 is listed in
  the lead's report.
- **One wagon body at the crossroads.** Only one wagon body is painted, the 太平车 swinging out of the cross street
  with its four mules. The second wagon is only its four-mule team, its driver and the traces, which vanish under
  the incense shop's lean-to roof (`S6.veh.hidden_wagon_3400`).
- **The cross street runs due north** between the incense shop and the corner shop. South of the main street there
  is an open square, not a street.
- **The sedans are moving.** Both are carried east by their bearers; neither is set down at the door. The woman
  (the matchmaker) looks out of the west sedan.
- **The storyteller's ring:** the storyteller and 17 listeners, as sections.md says (17–18). He stands in front of
  the corner shop's meat counter.
- **The meat is sold under the corner shop's eave.** The 孫羊店 flag hangs from a slanting pole before the building
  east of it.
- **Signs:**
  - 楊家應症 hangs on a corner post at the top of the silk (u ~4100). 杨大夫经诊 is not visible on this scan.
  - The cloth shop's sign reads □錦疋帛 / 鋪.
  - The lamp-boxes read 正店, 孫□ and 香□.
  - Three gourd-shaped 栀子灯 stand at the 正店's doors.
- **孙羊正店:** its street front is u 4441–5395, and its upper storey runs on to ~5700, into S5's range.
- **The 正店's upper storey** shows four figures on the strokes, not a storey full of drinkers. The restyle's crowds
  there are the 彩楼's flower bunches.

**The frame** (`map/frames/S6.json`). S5's origin, scales and seam knot are kept. Ten receding edges were measured in
three groups (west, middle and east). They give knots [2950, 50.4] and [4170, 54.4] before S5's [5600, 58.24]. The
edges scatter ±5 round 52, and the east group (51) is kept as a check.

The checks:
- the walls of the incense shop and the corner shop run 93° and 94.5° (north is 90°);
- the cross street is 11.2 m wide;
- the 正店's ground-floor eave is 2.6 m up, and the corner shop's 4.1 m;
- the 彩楼 is 9.4 m tall;
- the well's curb is 2.3 × 1.6 m (it is drawn almost from above, so it does not test the depth rate).

Assumed: the 正店's upper floor is at 4.5 m (3.4–6.0 m, depending on the hidden set-back), and the inn's at 3.4 m.

Open, for the lead:
- things far up the silk are painted at ~0.6 of the street's scale;
- the street's south edge may lie lower than v 1440;
- the east edges read ~51 where the seam knot is 58.24.

**Layout** (`layout.json`, `tools/map_layout.mjs S6`):
- 180 figures, 14 trees and 137 other entities, along the route S6.road.main;
- stations run from −26.51 at the S5 seam to −73.6 at u 2000;
- the painted area's east side, (−31.07, −4.39) to (−57.49, 30.54), is exactly S5's west side, so the two sections
  meet without a gap.

**Needs** (`gen/expand/inner_city_needs.md`):
- the casting of all 180 figures, with ten new characters requested (child, child_robed, woman, monk, bearer,
  storyteller, butcher, scholar, elder, and the archer if the lead agrees);
- the actions they need;
- the 19 animals and 8 vehicles;
- the carried props and the kit parts the buildings need.

## Built, 2026-10-12 (Run 2)

**What is built and how.**
- **Builder:** `blender/inner_city_scene.py` builds from `layout.json` only, in strict entities: every piece carries
  its map ID, and `edge:<side>` owns the four invisible walls. It is built headless with `tools/build_scene.sh
  inner_city`.
- **Section kit:** `blender/kit_inner_city.py` holds the parts song_kit lacks:
  - two-storey parts: `lean_to`, `floor_slab`, `wall_bays` (it now puts a post at each inner column, and shuts every
    door to the walker with an invisible board);
  - `xieshan_roof`;
  - the 彩楼欢门 (`cailou`, `rosette`, `flower_spire`, `lashing`) and `pole_scaffold`;
  - `gourd_lamp`, `lamp_box`, `signboard`, `eave_plaque` (8 variants of one cell), `banner_on_pole` (no longer
    mirrored);
  - `square_well`;
  - `umbrella`, `mat_roof`, `slat_fence`;
  - stall furniture and goods (`box_stack` now reads as lidded trays tied with cords on a dark plank).
- **Signs:** one atlas, `textures/signs_inner_city.png`, from `gen/sections/inner_city/make_signs.mjs` in LXGW WenKai
  TC. Illegible characters are drawn faded.
- **Vehicles:** `blender/kit_vehicles.py`, imported and never edited. Each harness reaches its team at the team's
  final spots; the builder's `team()` takes people.json's `facing_deg`.
- **Backdrop:** the west panel for S7 (`backdrop.json`, `prompts/backdrop_inner_city_west.txt`).
- **People:** `gen/sections/inner_city/make_people.py` writes `people.json` from `cast.json`. Run it twice, with
  `node tools/map_layout.mjs S6` between the runs, because the team moves go through `build_choices.json`.

**Numbers.**
- **Scene:** 115,721 triangles in 44 draw calls. `web/public/assets/inner_city.glb` is 2,077,084 bytes (2.0 MB) of
  geometry; the 10 textures are shared in `assets/tex/`.
- **Loyalty** (`node tools/loyalty_check.mjs S6`): PASS. Every mapped entity has its one model: 180 figures, 85
  props, 19 animals, 15 buildings, 14 tree cards, 8 vehicles, 7 structures and 3 roads, plus the four invisible edges.
- **People:**
  - 167 standing figures, 13 walkers and 19 animals (the dog walks);
  - 51 nudges and 4 recasts, each with its reason;
  - 13 figures carry their props.

**Choices (real size; positions from the map).**
- **Heights:**
  - 正店: floor 4.5 m, upper eave 7.2 m, ridge 10.4 m, pent-roof eave 0.55 m;
  - inn: floor 3.4 m, upper eave 6.2 m, ridge 9.0 m, upper storey jettied 0.4 m;
  - house at the well: eave 2.8 m, ridge 4.2 m;
  - far row: eaves 2.9 m (the far house 2.6 m), ridges 4.4–4.6 m.
- **Fronts set back** (figures and props are painted in front of them):
  - the inn's street wall at D 1.5;
  - the west wing's front at D 1.2, with its south wall at D −3.4;
  - house_south_4300's front at D 1.9, with its south wall at D −3.5;
  - house_south_4839's front at D −0.4;
  - the far house's front 0.9 m behind its estimate, behind the bamboo.
  - The trees painted at the silk's lower edge and the bamboo now stand outside the walls.
- **正店:**
  - it ends at the wine depot's west wall (X −47.1);
  - its upper storey's east room moves 0.9 m west with its table, ewer, dishes and two men (moves and nudges);
  - the front room's back is a colliding dark wall at D 16.48;
  - its west wall runs to the pent roof in front of the gallery and to the upper eave behind it (it was a free fin);
  - the 彩楼 stands 0.7 m in front of the columns, its V-band 0.3 m further out, with one back bar.
- **Inn south face:** a window (u 3690–3800), the scholar's open bay with his desk (3880–4060), a second open bay
  (4130–4210) and the balcony. Its unpainted upper street face has lattice windows.
- **Incense shop:** the dark back collides. The scaffold stands 0.75 m east of the wall line, in front of the eave.
- **Vehicles:**
  - **The sack cart is the kit's 太平车 body with sacks** (R 0.85, box 2.8 m, wheel 36% from the rear). The map paints
    a two-wheeled cart whose load reaches down beside the wheel, and the kit's barrow-type sack_cart stood the sacks
    on a 1.9 m stilt deck.
  - The door donkey is led, not harnessed.
  - The hidden wagon is the same 太平车 type, under a cover, behind the incense shop's lean-to (lead's decision).
  - Wheel radii come from the painted wheels.
- **Teams at real size** (`build_choices.json` moves):
  - **the big wagon's four mules:** the rear pair on the wagon's axis (220°), 2.0 m ahead of its front point; the
    lead pair 2.4 m further on, turned to 230°. Heading 195, as painted, would put their heads in the incense
    scaffold.
  - **the upper team:** two ranks on the hidden wagon's axis, the rear pair 2.35 m ahead of its front;
  - **the barrow with casks** moves 1.8 m south-east, out of the big wagon's team, and its pusher goes with it.
- **pine_4430** moves 1.9 m along its receding line, out of the corner shop, into the yard behind the butcher.
- **Clinic counter (counter_table_3940):** inside the clinic's open front, 1.06 m × 0.45 m. Its estimated west end
  ran through the cloth shop's wall. The clinic's unmapped built-in counter is removed.
- **The sunshade** sits on the street sign's post tops at 2.62 m, under the wing's eave brackets.
- **People:**
  - All ten new characters are cast without stand-ins.
  - Each requested action plays its nearest clip; what is still wanted is in `clips_why`.
  - The porters walk with `carry_pole` and their loads, the monk and the boy with `back_load`, and the fan man with
    `fan_walk`.
  - Children are scaled on the child models (`scale_why`).
  - The dog walks 2.2 m along its painted line under the parasol.
  - Walk paths now stop at ground props (by 0.3 m plus the prop), at every animal's real body and at vehicles
    (front to rear plus 0.6 m, ±1.0 m).
  - The seated man on the stool and the man on the high seat play the carter and the official, who can sit (the
    idler and the inspector have no sit clip yet). So does the seated listener at the 解 ring.

**Not built as painted** (kept beside it instead, each with its reason in people.json):
- the man seated on the big wagon's bed and the wine cart's driver stand beside their vehicles: the kit's hidden
  collider covers the bed and there is no seat;
- the child on the man's shoulders and the child on the man's back stand beside their carriers: there is no carrier
  prop for shoulders or back yet;
- painted actions without a clip play the nearest clip or idle (`clips_why`).

**Checks.**
- **Shots** (`node tools/shots_page.mjs`):
  - `gen/sections/inner_city/shots/r2/main/` (`shots.json`, 18 spots, sheet.jpg);
  - `r2/alone/` (the QA's 42 spots again, after the fixes);
  - `r2/joined/` and `r2/joined_air/` (the S5 seams, on `world.html?sections=inner_city,gate`).
  - The QA's defects are fixed. What is left is listed under Requests.
- **Walks:**
  - alone, `sections/inner_city/walks.json`: 19 of 19 PASS. They cover every shop front (正店, butcher, cloth shop,
    clinic, incense), the inn's door (shut), the well both ways, the main street both ways, the cross street past the
    big wagon, and every edge (west ×2, south ×2, north ×2, east ×2).
  - joined, `sections/inner_city/walks_joined.json`: 3 of 3 PASS, all across the S5 seam (street, square, north yard).
  - Logs are in `gen/sections/inner_city/checks/`.
- **people_check** (`--into tall_hat_man_2285`, 8 road spots on the walkers' lines): PASS at every spot.
  - Results: 14 walkers, none stuck; ground y −0.05…0.05 (nobody climbs a basket now); 1–3 walkers went round the
    player at each spot; the longest stand was 4.8 s; the body test held 0.56 m.
  - It ran in three batches because the page reloads every few minutes while other agents write into `web/`.
- **Not benched**, as briefed.

**Requests** (shared files, for the lead):
- **S5 house_5800:** its westward extension still covers S6's rider, horse, groom, pole man and crouching man, and
  overlaps house_south_4839. Its street wall must move to D ≤ −0.3, and its west end should stop at about X −40.1.
- **S5 wine depot:** 4 m deep, its roof takes the 正店's painted east upper room (u 5410–5650). A shallower depot lets
  that room come back.
- **Gate ground** reaches X ≈ −61.5 over S6. Clip each section's ground at its seams.
- **Vehicle kit:**
  - seats or driver places outside the hidden collider;
  - smoother sacks (soft_sack reads faceted);
  - for sack_cart, a low frame beside the wheel, as painted.
- **Workshop:**
  - the clips in `gen/expand/inner_city_needs.md` ("still playing idle"), first of all **sit** for the idler and the
    inspector;
  - carrier props for a child on the shoulders and on the back;
  - a staff for the scholar; a tray; a shoulder box; a whip held standing.
- **Kit helpers:** the lead moves `kit_inner_city` helpers into song_kit when ready.

## Integration pass, 2026-10-12 (the workshop's last batch)

- **Double move fixed.** `tools/map_layout.mjs` now moves an entity's pts, footprint and bays with it. The builder's own
  shift in `derive()` is deleted, and make_people's vehicle blocks no longer add the moves either. Each of the 16
  moves is applied once: for example the barrow's front is at (−74.50, 15.92), (+1.25, −1.25) from the map. The
  crossroads shots show the teams and the barrow where `build_choices.json` says.
- **Seated on vehicles.**
  - `mule_wagon` and `cask_cart` return `.seat` and `.feet`, and the builder writes them to
    `gen/sections/inner_city/seats.json`. The kit's seat and footboard planks don't collide, and people.js grounds a
    figure by a ray from H + 1.2 m. So `seat_support()` adds an invisible block under each footboard (top 5 cm above
    it).
  - make_people nudges the figure to the feet x/y and sets `facing_deg` to the seat's heading. Its sit clip puts the
    hips on the seat 0.4 m behind. No H change is needed: the map's H (1.45 and 0.75) only starts the ray above the
    block.
  - The man on the big wagon plays `sit`. The wine cart's driver plays `drive_cart` and `sit`, with the whip.
  - The hidden wagon has `driver_seat=False`, because its driver walks behind the team.
- **Sack cart:** the kit's low dray (`sack_cart(low=True, low_R=0.75, bed_len=2.4)`): round sacks heaped on a flat bed
  between two big wheels, as painted. It replaces the 太平车 body.
- **Carried children:** `child_on_shoulders_4977` and `child_on_back_2795` are now `carried_by` their carriers. The
  carriers play `carry_child` with the `child_on_shoulders` and `child_on_back` props.
- **Casting:**
  - Two recasts are undone: the man on the stool plays the idler and the man on the high seat the inspector, since
    both have `sit` now.
  - The seated listener at the 解 ring stays the official, because the sightseer has no sit.
- **New clips and props used:**
  - `bend_goods` and `lean_over` (inspector);
  - `hold_whip` with `whip_hold` (the groom);
  - `hold_tray` with `tray` (the tray vendor);
  - `shoulder_box` with `box_shoulder` (the box porter, a walker);
  - `push_flank` (the young man at the wine cart's rear);
  - `staff` (the scholar with the stick);
  - `look`, `listen`, `talk`, `bow` and `sit` wherever their characters now have them.
- **`clips_why`** keeps only nearest-clip stand-ins: the bearers' `sedan_carry`, `steer`, `bind`, `chin`,
  `bucket_lift`, `bridle`/`lead`, `browse`, `reach`, `knees_up`, `crane`, `chat`, `tell`, `sit` for `sit_talk`,
  `tie_kerchief` and `crouch`. Nothing plays idle for want of a clip.
- **Numbers:** 120,103 triangles in 44 draw calls; `inner_city.glb` is 2,094,432 bytes.
- **Checks:**
  - loyalty PASS;
  - walks 19 of 19 alone and 3 of 3 joined;
  - people_check PASS at all 8 road spots, run in 3 batches (14 walkers, none stuck, ground y ±0.05, closest walker to
    a figure 0.58 m);
  - close shots of every change in `gen/sections/inner_city/shots/r3/verify/`.

## Joined with S7 (round 2 join, 2026-10-12)

The previous join agent made these changes; they are recorded here after the restart. Details are in
`gen/expand/round2/joins_report.md`.
- The ground stops 0.5 m past u 2000 on a clean line (`blender/inner_city_scene.py` `ground()`). S7's ground dips
  under it.
- The well's boards from D 12.18 north run west to X −90.4, under S7's buckets (`kit_inner_city.square_well(west_ext,
  z_bottom)`).
- The 解 board's apex sits under S7's eave, its bar continues S7's, and the plaque hangs from the bar
  (`kit_inner_city.hung_plaque`).
- The servant boy's walk stops short of the crowd (`gen/sections/inner_city/make_people.py`, `STOP_AT_CROWD`).
- S7's knots are in `map/frames/S6.json`.
- Checks: S7|S6 walks 8/8; `people_check` joined PASS. Shots: `gen/sections/city_end/qa/run3/shots_joined/`.
