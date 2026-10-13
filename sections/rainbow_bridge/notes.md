# rainbow_bridge: the Rainbow Bridge (虹桥, S3)

Round 2's S3 (2026-10-12): scan u 15500–20500, east of S4b (the moorings, `outer_road_2`) and west of S2 (the canal).
The arched timber bridge with its crowded deck, the big boat lowering its mast under the arch, 十千脚店 with its
彩楼欢门 scaffold, the riverside hall and the boats unloading at the south bank. Area brief:
`gen/expand/round2/brief_rainbow_bridge.md`; tile brief `gen/map/S3/brief.md`.

**Boundary.** S3 in `reference/scroll/sections.md` §2 is 余辉's segment 3, 虹桥 (u ≈ 15500–20500); `map/sections.json`
key `S3`. The seams with S4b at 15500 and S2 at 20500 are in `map/index.md` "Seams", plus one straddler found at setup
(the boat moored along the south bank, ≈ 19750–20650: S3's; see the area brief).

**Scan rect:** x 15344–20656, y 0–1792 (the area plus about 150 px past both ends, on multiples of 16).

**What's in it**, west to east (sections.md §2 and the setup agent's first look; the map will say where each thing
is):
- the river as a diagonal band: along the top of the silk in the west, widening and dropping under the arch; the far
  (north) bank a thin strip of shops, tables, a willow and moored boats along the top edge;
- the boat under way at the S4b seam (pin 25 河边泊船 (纤夫); 余辉 摇橹向前?) with its long sweep, a masted boat, and
  trackers on the far-bank path;
- the long riverside hall with lattice windows and a railed veranda with diners (possibly 十千脚店's upper storey:
  刘涤宇 counts the tavern as two-storey);
- 十千脚店: its big hip roof, its gate under the 彩楼欢门 scaffold, the 脚店 sign, a rider at the gate;
- the 新酒 banner on a bar from a tall pole with a bird-shaped vane (pin 23), the 串车 at the tavern door (pin 24), a
  mat-roofed shed with stalls, the boats unloading at the south bank and their porters;
- the parasol stalls and the crowd at the bridge's south foot, the 饮子 stall (pin 22);
- the bridge (pin 18), its crowded deck (pin 20) with stalls on the south ramp, the sedan-versus-horseman standoff
  (车轿相争), the people at the railings throwing ropes (上下呼救), and tall end posts;
- the big boat under the arch lowering its mast, about 20 crew (大船抢险, pin 19), and a boat moored along the south
  bank past the arch with men waving from its roof;
- the north bank's cart, shops and tavern (pin 21 虹桥边的小酒馆), and the south bank's shops along the bottom edge
  with a big bare tree with a dark trunk.

## Runs

**run1, 2026-10-12.** `sections/outer_road/section.json` with this rect; prompts unchanged (`scroll_restyle`,
`scroll_restyle_tile`, B1 as style image), model gpt-image-2.5. One overview (asked 4096×1376, returned 4096×1415) and
12 tiles (6 × 2, src 1024, overlap 128, out 2048), `--jobs 2`, all 13 first time (37–56 s each). Snapshot
`gen/sections/rainbow_bridge/runs/run1/` (the six weak tiles' full files in `runs/run1/units/`).

**run2, 2026-10-12.** The six weakest tiles rerun once with `--only … --force` (same prompts). Only `t_r1c2` came out
better (0.215 → 0.512). The bridge tiles failed the same way again, so for `t_r0c4`, `t_r1c3`, `t_r1c4` and `t_r1c5`
run1's slightly better outputs were restored (their cache keys are unchanged) and the mosaic was restitched. `t_r0c5`
keeps run2's (0.079 against 0.066). Snapshot `runs/run2/` (all six rerun tiles in `runs/run2/units/`).

| unit | u (scan) | v | align before → after (in use) | run1 after | run2 after | scale | shift (px) |
|---|---|---|---|---|---|---|---|
| overview | 15344–20656 | 0–1792 | 0.290 → 0.537 | 0.537 | | 1.055 / 1.03 | 154, 29 |
| t_r0c0 | 15344–16368 | 0–1024 | 0.410 → 0.529 | 0.529 | | 1.005 / 0.995 | 10, 2 |
| t_r0c1 | 16202–17226 | 0–1024 | 0.175 → 0.542 | 0.542 | | 1.055 / 1.03 | 66, 22 |
| t_r0c2 | 17059–18083 | 0–1024 | 0.279 → 0.361 | 0.361 | | 1.045 / 1.015 | 22, 6 |
| t_r0c3 | 17917–18941 | 0–1024 | 0.190 → 0.308 | 0.308 | | 0.955 / 0.975 | 110, −10 |
| t_r0c4 | 18774–19798 | 0–1024 | 0.095 → 0.120 | 0.120 | 0.108 | 0.92 / 0.925 | 110, 38 |
| t_r0c5 | 19632–20656 | 0–1024 | 0.059 → 0.079 | 0.066 | 0.079 | 0.92 / 0.94 | −54, 82 |
| t_r1c0 | 15344–16368 | 768–1792 | 0.165 → 0.315 | 0.315 | | 1 / 1.005 | 2, 26 |
| t_r1c1 | 16202–17226 | 768–1792 | 0.147 → 0.294 | 0.294 | | 0.995 / 0.965 | 22, −26 |
| t_r1c2 | 17059–18083 | 768–1792 | 0.091 → 0.512 | 0.215 | 0.512 | 1.015 / 0.985 | 58, −22 |
| t_r1c3 | 17917–18941 | 768–1792 | 0.027 → 0.083 | 0.083 | 0.070 | 1.065 / 1.04 | 34, 62 |
| t_r1c4 | 18774–19798 | 768–1792 | 0.074 → 0.094 | 0.094 | 0.078 | 1.07 / 1.09 | 38, 46 |
| t_r1c5 | 19632–20656 | 768–1792 | 0.105 → 0.161 | 0.161 | 0.090 | 1.06 / 1.05 | 10, −2 |

The gate, S4 and S6 had tiles at 0.45–0.70 and overviews at 0.60–0.67. Here only the west reach is in that range.
Several shifts sit at 110 px, which looks like the registration's search limit. The model zooms and recomposes the
bridge and the crowds at its feet in every run: the arch is the scroll's most famous motif, and the model draws its
own idea of it.

## Where the restyle invents (the warnings in the tile brief), by u range

- **15344–17200, usable** (the river's west reach, the hall, the scaffold):
  - the bare, stiff-twigged trees (≈ 16100–16700, v 350–1000, and along the bottom edge) become weeping willows;
  - the boats' cabins get tiled roofs;
  - the hall's figures are repainted: a standing woman in red at ≈ 15800, v 1300–1400, where the scan has a small
    figure, and more diners than the 3–4 painted at ≈ 16000–16200;
  - figures are added on the balcony at the hall's east end (≈ 16200–16400);
  - the 脚店 sign's characters are rewritten.
- **17060–18080, good below v 770** (run2's `t_r1c2`), **fair above:**
  - the mat roof of the shed (≈ 17600–17900) and the far-bank boats' cabins are tiled;
  - the banner's 新酒 and the 串车's load are garbled;
  - the far bank is widened;
  - run1 put a dark animal at the 串车's front, which run2 doesn't.
- **17900–18950, unreliable** (the bridge's south foot):
  - zoomed and shifted;
  - the mat-covered boats unloading at the south bank (≈ 17800–18100, v 750–1000) become mat stalls on a boardwalk;
  - the bridge's south ramp at the tile's east edge is dropped and painted as a beaten-earth road;
  - the sedan moves about 150 px east, the black donkey at ≈ 17900 becomes an ox, and the parasols move.
- **18770–20656, not usable for positions** (the arch, the crown, the big boat, the north bank, the south bank's
  shops):
  - the tiles paint the arch larger and shifted, and the east tile invents a second full arch east of the crown;
  - they redraw the big boat lower and further west and drop its crew from under the arch;
  - the north-bank tavern becomes a pavilion, and the mat-awning stalls under the arch a tiled shop with round
    basins;
  - **the boat moored along the south bank is painted as house roofs**, with the waving men standing on tiles;
  - the bare tree with the dark trunk at ≈ 20380 becomes a leaning willow.
- **The overview** keeps one arch and the boat's crew, so it is the better guide to what a faded mass is over the
  bridge. But it moves the arch's south foot west and the big boat down, paints the moored boat as roofs, drops the
  dark-trunk tree, and smears its last ≈ 250 px (u ≈ 20400–20656).
- The registered bottom-row tiles carry a smeared strip along their edges, as on S4.

**What to do about it.** The mapping reads S3 from the scan at zoom 3 and uses the restyle only to name things; the
map is unaffected. For the build's reference images and character crops, the bridge stretch needs a better restyle
before Run 2: smaller tiles over u 18700–20656 (src 768?), or the overview as the colour reference only. That is a
prompt or config change, so it is the user's and the lead's call.

## Lessons from setup (exact text for the skill `scroll-section`, "Review")

- **A rerun doesn't fix a restyle that recomposes.** On S3 the tiles over the Rainbow Bridge registered at 0.07–0.16
  in two runs, and both runs redrew the arch larger, added a second arch and moved the big boat. A tile far below its
  neighbours is worth one rerun; if the rerun fails the same way, keep the better output, mark the stretch "not for
  positions" in the tile brief, and read the scan at zoom 3 there.
- **Read the check sheets for what changes ownership, not only for what is invented.** The S3 restyle painted a boat
  moored at the bank as house roofs, with its crew standing on tiles. That moves the crew from the river agent to the
  tile agents. Name such things, with their owner, in the tile brief.
- **Registration shifts that stop at 110 px** (S3: four tiles across the two runs) mean the restyle drifted further than the search
  allows: treat those tiles as misregistered, whatever their score.

## Mapped (Run 1, 2026-10-12)

The map is `map/strokes/S3.json`: 467 entities after the merge, the second pass and the frame (`check` PASS). The
positions are in `layout.json`. The record is `gen/map/S3/merge_notes.md` and `gen/expand/round2/rainbow_bridge_run1_report.md`;
what the workshop must make is `gen/expand/rainbow_bridge_needs.md`.

| kind | n |
|---|---|
| figures | 232: 102 on the ground, 73 on the deck, 48 on boats, 7 on the upper floor, 2 riding |
| animals | 9 |
| land vehicles | 4: the 串车, the hooped-load barrow, the sedan, the handcart |
| boats | 11 |
| trees | 20 |
| props | 108 |
| buildings, structures | 21, 6 |
| roads, water, grd | 3, 2, 7 |
| groups | 44 |

**What the strokes settled** (against this file's first look above):
- **十千脚店** spans u 15510–17330. The riverside hall is its two-storey 楼 (a balcony over a pent roof, the upper floor
  at 3.83 m, conf med), then the wing and the rear hall, then the gate under the 彩楼欢门. The scaffold stands on the
  gate's roof, hung only with lashings; its tallest top is at (17230, 499).
- **The "rider at the gate" is a saddled horse with no rider.**
- **The bridge's deck width lies across the picture** (east-west). Its far edge isn't painted; it lies about 750 px west
  of the painted railing. Heights are level across it. The frame gives the deck 17 band supports (`map/frames/S3.json`).
- **The big boat's bow is west** (19518). A cabin boat lies under the arch, and a skiff under its south foot. The far
  bank's two boats at 16380–17300 are one; the boats unloading at the south bank are one boat.
- **The north-bank tavern's tables are empty** (pin 21).
- **The dark-trunked tree at the S2 seam is S2's.**

## Open issues

- **The deck's heights** use 17 u-keyed band supports, not the lead's `H_profile_X`, which doesn't fit this deck. The
  frame asks for a `world()` deck support read at u* = max(u, u_s(v)), or a depth-keyed profile. The kit's walkable
  deck leaves 30 of the 88 deck entities off the built deck (placed with `on_deck` and recorded moves). Its soffit
  (2.86 m above the water over the middle 40%) is under the 3.5 m it wants for the big boat.
- **The area kit's name:** `build_rules.md`'s `kit_<folder>.py` is `kit_rainbow_bridge.py`, the factory's set-piece
  module. The lead names S3's own kit.
- **The far shores** map 0.15–0.86 m north of the bank tops. The builder takes the water plane to `bank_top`.
- **The route at the S4b seam** jogs 5.8 m north (hidden, est). Along the north-bank tavern the land in front of it is
  1.6–2.3 m deep, so room to walk is a recorded build choice.
- **The restyle over the bridge** (u 18700–20656) is not usable for reference images or character crops. A better one
  is a config or prompt change: the user's and the lead's call.
- **Low things that need a call:** `S3.ani.second_horse_19230` (a horse behind the crowd, or a bent man),
  `S3.ani.dog_or_donkey_19825`, and `S3.prop.bridge_end_post_far_19176` (the kit builds two 表木; the map has a third,
  low).
- **A stale `what`:** `S3.bld.open_shop_20000` still names a hanging sack, which is `porter_with_pole_20450`'s load.

## Run 2: built, cast and checked (2026-10-12)

Area agent `S3_run2_lead`; subagents (each with its own scratchpad `S3_run2_<name>/`): tavern kit, props, bridge fit,
river, casting, backdrop, QA. The run report is `gen/expand/round2/rainbow_bridge_run2_report.md`; the lessons are in
`gen/expand/rainbow_bridge_lessons.md` ("Run 2").

**The pieces and who wrote them**
- `blender/rainbow_bridge_scene.py` (the builder): derive, the ground (banks from `river_plan.json`), the water strips,
  the bridge (`kit_rainbow_bridge.build` with `bridge_params.json`), the other buildings, the land vehicles, seats,
  edges. It probes the factories' new parts (`kit_common.stilt_deck`, `board_wall`; `kit_vehicles.barrow_load`,
  `sedan_chair(front_style, roof)`, `barrow_screen(stakes, poles, panel)`) and uses them once they exist.
- `blender/kit_rainbow_bridge_area.py` (S3's area kit; the catalogue's name): 十千脚店 whole, `shiqian_jiaodian(ents,
  z_at, rng, upper_floor)`; the sign atlas `gen/sections/rainbow_bridge/textures/signs_rainbow_bridge.png`.
- `blender/kit_rainbow_bridge_props.py` + `gen/sections/rainbow_bridge/props_table.json`: 103 props as data
  (`place_props`), the handcart.
- `gen/sections/rainbow_bridge/bridge_params.json`, `bridge_plan.json`, `deck_fit.json`: the bridge as built and
  every deck entity fitted onto it.
- `gen/sections/rainbow_bridge/river_plan.json`, `people_boats.json`: the shores, banks, far-bank move, seam walls;
  the boats' motion.
- `gen/sections/rainbow_bridge/cast.json`, `make_people.py` → `people.json`, `seats.json`.
- `build_choices.json` is merged from per-agent fragments `gen/sections/rainbow_bridge/choices/*.json` by
  `gen/sections/rainbow_bridge/merge_choices.py` (moves of one entity from several fragments add up). 238 moves, 37
  how, 4 edges, 11 boats.

**Numbers** (build 2026-10-12): 109.8k triangles in the scene's buckets (107.4k drawn, 2.3k collider), 42 draw
buckets; `rainbow_bridge.glb` 1.86 MB geometry; boats GLB 1.23 MB (11 boats, 35.7k triangles at lod 0, 15.2k at lod 1).
Biggest owners: the bridge 17.0k, the ground 13.5k, the riverside hall 6.8k, the open shop 6.4k, the 彩楼欢门 4.5k, the
bridge-foot hall 4.5k, the far-bank hall on stilts 4.3k, the north-bank tavern 4.1k. Props 19.3k for 103.

**The builder's choices** (each also in `choices/builder.json`):
- **The far bank's buildings** are a lighter composition of the same kit parts (thin posts, `wall_bays`, two
  `lean_to` slopes with fascia and a ridge, no rafter ends): 0.4–0.8k triangles a front instead of S4b's full hall's
  ~3.2k, real heights (eave 2.8–2.9), depth 4.2 m back past the silk's top edge. They are painted at 0.22–0.35 scale
  and seen across the river from 10–30 m.
- **The north-bank tavern (`S3.bld.tavern_20230`) narrowed** to X 146.4–148.8 (painted 143.7–147.9) and open on all
  sides: the bridge's north ramp, extended 3 m to walk at 34°, lands on its painted west half, and the S2 seam bounds its
  east end. Its tables went inside it and behind it (props agent), the low table with its keeper and the dark-hatted man
  into its west bay (bridge-fit agent).
- **The bridge-foot hall** squared to the frame's axes on its footprint's mean sides; open to the south (its gable
  figure stands in the open front).
- **The mat shed under the arch (19530)** keeps its painted depth (1.4 m): the men waving at the big boat stand on the
  bank right behind it.
- **Edges:** the seams' walls only on land (river_plan.json `edges`); edge:north detours round the north ramp's foot
  (bridge_plan.json `edge_north`); the far bank west of the bridge is closed (water, shore walls, the far railing).
- **The ground** stops 0.5 m past both seams and dips 0.12 m toward them; it runs 16 m past the silk's top and bottom.

**What stands in for what** (until the factories deliver): the hooped barrow uses `barrow_load(load="hoops")`, the
sedan `front_style="closed", roof="round"`, the 串车 its stakes, poles and panel (all landed 2026-10-12); the stilt deck
and board walls from `kit_common` (landed); the gate's striped curtain and the mooring post's lamp swap to `kit_common`
by themselves; boats wait on the kit's options B1–B11 (river report). The boatman landed with work_sweep,
reach_over_rail, pole_boat and fend_pole and plays the 35 crew; 20 figures still play stand-ins for dark_hat (6),
tracker (5), straw_hat (3), youth (2), groom (2) and grain_porter (2) (casting report).

## Run 3: the restart finisher (2026-10-12 evening, `S3_run3_finisher`)

Picked up from the files after the PC restart (`gen/expand/round2/restart_brief.md`). Check results in
`gen/sections/rainbow_bridge/qa/run3/`.

- **18:40 build current.** The layout, build_choices, river_plan and seats (13:38–15:26) were newer than the raw GLB
  (13:29), so `tools/build_scene.sh rainbow_bridge` rebuilt it: 109.8k triangles, 42 draws; only the ground (+42) and
  edge:shore (+2) changed. `loyalty_check S3` PASS. `make_people.py` rerun for the workshop's deliveries since 15:26
  (donkey_dark, horse_dark, the tack variants, grain_porter, the takes tow_walk, haul_line, pole_boat,
  reach_over_rail): 69 changed values. Exported `--no-boats` (boats GLB 15:40 is newer than the layout): 1.86 MB,
  scroll index max 0.55 px. KTX2 check PASS.
- **Budget (before the people rerun):** FAIL on two: download with kit and cast 23.78 of 20 MB (cast 24 models,
  14.63 MB) and GPU 75.08 of 75 MB (241 people). Everything else PASS (section 7.93 of 9 MB, 107.5k of 130k, draws 291
  of 330). `qa/run3/budget.log`.
- Next: walks alone (`qa/run3/walks_alone.log`) from the lost QA's route generator, rebuilt from its transcript
  (scratchpad `S3_run3_finisher/qa/`: probe hits and people, `gen_routes.py`, `calib_walk.mjs`); then
  `tools/chrome_slot.sh node tools/walk_page.mjs "http://127.0.0.1:5190/world.html?sections=rainbow_bridge&window=0" sections/rainbow_bridge/walks.json`.
- **18:42 seam ground fixed, walks alone 42/42.** The ground ran on 0.5 m past both seams *across the river* as a strip
  at H −0.1 (the builder's `wet()` stopped at the seams with the water strips): 0.6 m above the neighbour's water,
  and the moored south-bank boat's stern bridges opened onto it. `wet()` now tests the point carried back onto the
  seam; rebuilt (ground 13,505 → 13,434 triangles), exported, loyalty PASS. The big boat under the arch now rests at its
  painted spot (`people_boats.json` `pause_s` [3600, 3]; its mast still cycles): with 8 s pauses its 0.2 m outings
  closed its bank bridge and 2 of 14 walkers ended in the water (`qa/run3/wade_before.log`, `wade_after.log` 14/14;
  the boats.js side is in `round2/page_queue.md`). `sections/rainbow_bridge/walks.json`: 42 routes (the lost QA's 34,
  regenerated from its transcript, plus 8 boarding, riding and leaving the two boats that touch the walkable bank):
  `qa/run3/walks_alone.log` 42/42 with `walk_page.mjs` as it is.
- Next: shots alone (`sections/rainbow_bridge/shots.json` → `qa/run3/shots_alone/`), then
  `tools/chrome_slot.sh node tools/people_check.mjs "http://127.0.0.1:5190/world.html?sections=rainbow_bridge&window=all" ...`.
- **18:47 shots alone:** `sections/rainbow_bridge/shots.json` (the lost QA's 26 spots, less one that faced a wall,
  plus the two boarded decks: 27), `qa/run3/shots_alone/` (sheet.jpg, grid_a/b/c.jpg), no console errors.
- Next: `people_check` at `?window=all`, then joined with S4b (`walks_joined.json`, `shots_joined.json`).
- **18:52 checks alone and joined with S4b, all PASS.** `people_check` at `?window=all` alone (8 walkers, 233 figures;
  into `man_wide_hat_18615`; road spots (131, −3.32), (132, 5.05), (123.5, 3.28)) and joined with S4b (12 walkers,
  305 figures): `qa/run3/people_alone.log`, `people_joined_s4b.log`. `walks_joined.json` 7/7 across the u 15500
  seam (road both ways, between road and shore both ways, S3's south foot to S4b's tea house, onto S4b's big cabin
  boat's stern from S3's bank, the shore wall east of the seam): `qa/run3/walks_joined_s4b.log`. `shots_joined.json`
  (10) → `qa/run3/shots_joined_s4b/`: ground and water continuous at the seam. No S4b and S3 boats touch across the
  seam. HUD at the crown, 十千脚店's gate and the big boat under the arch: ring on the painted spot, boxes on the
  painted figures (`qa/run3/hud/grid.jpg`, `hud.json`).
- Next: read `round2/workshop_progress.md` for takes not to use (rerun `make_people.py` if one is ours), the final
  `budget_check`, then `FINAL BUILD`.
- **18:58 casting rerun for the take review, final checks.** `make_people.py` now drops the takes
  `workshop_progress.md` marks **NOT TO USE** (unless a later line passes a retake): S3's six `pole_boat` boatmen
  play `stand_pole` with `long_pole`. The rerun also took the paid run's characters that landed in
  `characters.json` at 18:53 (straw_hat, dark_hat, youth, groom, tracker; horse_dark, donkey_dark) and its new clips
  (lie_wave, wave_arms, hold_horse_neck, lunge_arms_wide). Exported `--no-boats`; loyalty PASS; KTX2 PASS; walks alone
  42/42, joined with S4b 7/7, `people_check` alone PASS (`qa/run3/*_final.log`).
- **Budget, final** (`qa/run3/budget_final.log`): section download 7.92 of 9 MB, 107.4k of 130k triangles, 2.3k
  colliders, own textures 13.27 of 24 MB, draws 316 of 330: PASS. **FAIL, from the cast only:** download with kit and
  cast 26.10 of 20 MB (29 models, 16.95 MB) and GPU 80.17 of 75 MB (241 people). Exception asked in the report.
- Scene GLB `rainbow_bridge.glb` (raw rebuilt at 18:39 with the seam river-bed fix) and boats GLB
  `rainbow_bridge_boats.glb` (15:40, unchanged) are final.

FINAL BUILD 18:58
- Report: `gen/expand/round2/rainbow_bridge_run2_report.md` (budget exception asked: download with cast 26.10 of 20 MB,
  GPU 80.17 of 75 MB, both from the cast). Lessons: `gen/expand/rainbow_bridge_lessons.md` "From Run 3". QA tools:
  `gen/sections/rainbow_bridge/qa/run3/tools/`. The S3 finisher is done. Next (others'): the join agent's S4b|S3 seam
  (cut S4b's ground, water and edge:east back), S3|S2 once S2's `FINAL BUILD` lands; the paid run's replacements
  (`make_people.py`, export `--no-boats`).

## Join agent (2026-10-12 evening)

Details are in `gen/expand/round2/joins_report.md`, Stage 3.
- S4b's ground and water are cut back to the S4b seam.
- One joined walk changed: from S3's bank, the shore wall stops you at S4b's big cabin boat's stern, which stays
  railed past the seam. Joined walks 7/7; `people_check` S4b+S3 PASS.
- Results: `gen/sections/rainbow_bridge/qa/run3/join_*`.

## Question 8: the groom inside the fence (2026-10-13, `gen/life/q8_figures.md`)

- 名画记 24 puts the horse's groom sitting on the ground inside 十千脚店's bar fence. The one figure painted there is
  `S3.fig.behind_lampbox_17090`, and it is re-read as **seated** with its knees drawn up, facing east. The edit is in
  `map/strokes/S3.json` and `gen/map/S3/merge_fixes.mjs` (the Q8 block). Its foot moved 1.4 m further inside the gate.
  No new entity.
- Cast: `sightseer` plays `knees_up` (`gen/sections/rainbow_bridge/cast.json`). robed_man's knees_up leaves the seat
  6 cm up.
- Talk: V3.5 swaps the roles. The groom is this figure; the keeper is the gate-post figure and stays the host. A new
  bark, b3.groom, was added.
- The data is copied to `web/public/assets/rainbow_bridge/` (layout.json, people.json) and the scroll index was
  rebuilt. The GLB is unchanged.
