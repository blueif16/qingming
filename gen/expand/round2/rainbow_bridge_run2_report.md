# S3 (`rainbow_bridge`, u 15500–20500): Run 2 report

The Rainbow Bridge: the arched timber bridge and its crowded deck, the big boat lowering its mast under the arch,
十千脚店 with its 彩楼欢门 scaffold, the boats of the west reach, the north-bank tavern, and the south bank's shops.

- **Run 2** (area agent `S3_run2_lead` and seven subagents: tavern kit, props, bridge fit, river, casting, backdrop,
  QA) built, cast and exported S3. Then the PC froze at about 18:00. The QA results were lost with `/tmp`, and the
  report was never written.
- **Run 3** (this finisher, 2026-10-12 evening, `restart_brief.md`) brought the build current, fixed what the checks
  found, ran every check again, and wrote this report.

The record is `sections/rainbow_bridge/notes.md` ("Run 2", "Run 3"); the lessons are in
`gen/expand/rainbow_bridge_lessons.md` ("From Run 2", "From Run 3"). Check results are in
`gen/sections/rainbow_bridge/qa/run3/`. **`FINAL BUILD 18:58`** is in the notes.

## Built, per kind (`node tools/loyalty_check.mjs S3` PASS, nothing unbuilt)

| kind | mapped | built | how |
|---|---|---|---|
| figure | 232 | 232 | people.json: 226 standing, sitting or at work, 6 walkers; 45 crew on 9 boats; 2 riders |
| prop | 108 | 108 | `kit_rainbow_bridge_props.py` from `props_table.json` (103), and parts of their hosts |
| building | 21 | 21 | 十千脚店 whole from `kit_rainbow_bridge_area.py`; the far bank as a lighter composition of kit parts |
| tree | 20 | 20 | cards from the tree factory (`trees/assign/S3.json`) |
| vehicle | 15 | 15 | 11 boats in `rainbow_bridge_boats.glb`; the 串车, the hooped-load barrow, the sedan, the handcart |
| animal | 9 | 9 | horse, horse_dark, donkey_dark, with their tack (saddle_dark, halter_breeching, pack_bale, saddle_cloth) |
| grd, road, water | 7, 3, 2 | all | the ground's banks, the worn roads, two water strips (326 triangles) |
| structure | 6 | 6 | the bridge from `kit_rainbow_bridge.build()` (17.0k), the 彩楼欢门, the tiled wall, the 新酒 pole |

- `build_choices.json` has 238 moves, 37 `how`, 4 `edges` and 11 `boats`, each with its reason. It is merged from
  `gen/sections/rainbow_bridge/choices/*.json` by `merge_choices.py`.
- **Geometry:** 109.7k triangles (107.4k drawn, 2.3k collider), 42 draw buckets. `rainbow_bridge.glb` is 1.86 MB of
  geometry. The boats GLB is 1.26 MB: 35.7k triangles at lod 0, 15.2k at lod 1.
- **The scroll index** projects within 0.55 px (limit 2).

## What Run 3 changed

1. **Rebuilt** (`tools/build_scene.sh rainbow_bridge`). The layout, the choices, the river plan and the seats
   (13:38–15:26) were newer than the 13:29 raw GLB. Exported with `--no-boats`: the boats GLB (15:40) was newer than
   the layout, and it is unchanged.
2. **Fixed: a strip of ground across the river at both seams.** The builder's `wet()` tested only the water strips,
   which stop at the seams. So the 0.5 m of ground past each seam was built as land at H −0.1, right across the river.
   It stood 0.6 m above the neighbour's water, and the moored south-bank boat's stern bridges opened onto it. `wet()`
   now tests the point carried back onto the seam: the ground lost 71 triangles, and the stern bridges are gone.
3. **The big boat under the arch now rests at its painted spot** (`people_boats.json` `pause_s` [3600, 3]). Its mast
   still goes down and up every 24 s. With the default pauses, each 0.2 m outing closed and reopened its bank bridge,
   and 2 of 14 walkers boarding there ended 0.4 m out in the water (`qa/run3/wade_before.log`; after the change
   `wade_after.log` 14/14). The `boats.js` side of this is in `page_queue.md`, for other sections' boats.
4. **Casting rerun** (`make_people.py`).
   - It now drops takes that `workshop_progress.md` marks **NOT TO USE**, unless a retake later passes. So S3's six
     `pole_boat` boatmen play `stand_pole` with `long_pole`.
   - It took up what had landed since 15:26:
     - the tack variants, horse_dark and donkey_dark;
     - grain_porter, and the paid run's straw_hat, dark_hat, youth, groom and tracker (in `characters.json` at
       18:53);
     - the clips tow_walk, haul_line, reach_over_rail, lie_wave, wave_arms, hold_horse_neck and lunge_arms_wide.
   - No figure still plays a stand-in.

## Checks (all through the check server 5190 and Chrome slots)

| check | result | file (`gen/sections/rainbow_bridge/qa/run3/`) |
|---|---|---|
| `loyalty_check S3` | PASS (after every export) | |
| `ktx2.mjs check` | PASS (127 encoded, nothing to encode) | |
| walks alone, `sections/rainbow_bridge/walks.json` | **42/42** | `walks_alone.log`, `walks_alone_final.log` |
| walks joined with S4b, `walks_joined.json` | **7/7** | `walks_joined_s4b.log`, `walks_joined_s4b_final.log` |
| `people_check` at `?window=all`, alone | PASS (8 walkers, 233 figures, 0 stuck) | `people_alone.log`, `people_alone_final.log` |
| `people_check` joined with S4b | PASS (12 walkers, 305 figures) | `people_joined_s4b.log` |
| shots alone, `shots.json` (27) | no console errors | `shots_alone/` (`grid_a/b/c.jpg`) |
| shots joined with S4b, `shots_joined.json` (10) | ground and water continuous at the seam | `shots_joined_s4b/grid.jpg` |
| HUD (Space) at the crown, 十千脚店's gate, the big boat | ring on the painted spot, boxes on the painted figures | `hud/grid.jpg`, `hud.json` |
| `budget_check rainbow_bridge` | **FAIL on 2, both from the cast** (below) | `budget_final.log` |

**The 42 walks alone:**
- **The bridge:** both ways through the deck crowd; up onto the crown (H 5.3); four railings stop you on the deck; the
  ramps' sides stop you from the ground.
- **The banks:** the road from the S4b seam to the south foot and back; under the arch past the open shop to the S2
  seam; the north bank to the S2 seam; the closed far bank (the north foot's walls).
- **The edges:** both seams on land, the silk's top and bottom edges, and the shore walls at five places.
- **The boats** (8 walks):
  - Onto the moored south-bank boat over its bow end and its stern end. Its middle is under its low mat awning.
  - Its stern rails keep you aboard past the S2 seam.
  - 20 s riding it against a rail, then back off onto the bank.
  - Onto the big boat under the arch from the bank, 20 s aboard while its mast moves, then back off.
  - No other boat touches the walkable bank: the far bank is closed, and the boats under way touch only each other.

**The 7 joined walks with S4b:**
- across the u 15500 seam on the road, both ways;
- between the road and the shore, both ways;
- S3's south foot to S4b's tea house;
- onto S4b's big cabin boat's stern from S3's bank (it runs past the seam);
- the shore wall just east of the seam.

No S4b boat and S3 boat touch across the seam.

The route tools, rebuilt from the dead QA agent's transcript, are in `qa/run3/tools/` (README.txt).

## Budget (`node tools/budget_check.mjs rainbow_bridge`, loaded alone)

| number | S3 | budget | |
|---|---|---|---|
| download, the section | 7.92 MB (GLB 3.02, JSON 0.45, panels 0.44, cards 4.01) | 9 | PASS |
| **download, with kit and cast** | **26.10 MB** (kit 1.22, cast 16.95 MB for 29 models) | 20 | **FAIL** |
| triangles drawn | 107.4k | 130k | PASS |
| triangles, colliders | 2.3k | 5k | PASS |
| textures, own | 13.27 MB | 24 | PASS |
| draw calls (most, at the east seam) | 316 | 330 | PASS |
| **GPU MB, section alone** | **80.17 MB** (241 people and animals loaded) | 75 | **FAIL** |

**Exception asked (for the lead): both misses come from the cast, not the section.**
- S3 paints 241 people and animals, three times S4b's 76. Every figure has to be cast, and the user asked for the new
  characters to replace the stand-ins.
- Before the restart the numbers were 23.78 MB and 75.08 MB, with 24 models. The paid run's five new characters and
  the two dark animals raised them to 26.10 MB and 80.17 MB, with 29 models.
- The section's own numbers all pass.
- The cheap fixes would undo the casting: fold single-figure characters (butcher, storyteller, elder, child_robed,
  child_red, 0.25–0.4 MB each) into others, or drop the new ones. So I didn't apply them.
- **Proposal:** raise `download_with_shared_mb` to about 27 and `gpu_mb` to about 82 for S3, with this reason. Or
  count the cast once per window: the characters are shared and come from cache after the first section.
- S2 has the same cast-driven miss on download.

## For the join agent

- **S4b|S3:** S4b's water, ground and `edge:east` still run 16 m past u 15500 into S3, so cut them back (S4b's report,
  item 2). Joined walks and shots pass with them present. S3's own ground now stops at the seam as river bed over the
  water.
- **S3|S2:** S3's ground stops 0.5 m past u 20500 and dips 0.12 m toward it. The moored south-bank boat's stern
  crosses the seam by about 3 m. The big boat's stern stays about 0.8 m on S3's side. S3's river agent checked S2's
  moved boats against S3's water in Run 2: no move was needed.

## For the user

1. **Look at:**
   - the crown's crowd and the sedan-versus-horseman standoff;
   - the big boat under the arch with its mast going down;
   - 十千脚店 under its 彩楼欢门 scaffold.

   From the south bank you can step aboard the big boat and the long boat moored past the arch.
2. **The big boat waits outside the arch's near face** and stays at its painted spot; only its mast moves.
   - Built at real size, its curled stem can't pass under the arch: the arch's underside is 2.86 m above the water
     over its middle 40%.
   - Its short run was dropped so its bank bridge stays safe to board.
3. **Six poling boatmen hold their poles upright** (`stand_pole`). The poling take failed review (the pole swung up into
   the sky). A retake is with the workshop's paid run, and they switch over by themselves when it passes.
4. **The moored south-bank boat can be boarded only at its two ends.** Its middle is under the painted low mat roof,
   1 m above the bank, with the two waving men standing on it.
5. **The far bank west of the bridge is closed and moved 5.5 m north**, as S4b's was, so the boats fit at real size. It
   is seen across the river, partly in mist past the silk's top edge.
6. **The north-bank tavern is narrowed and opened on all sides.** The bridge's north ramp, lengthened 3 m so it can be
   walked, lands on its painted west half.
7. **Calls on faint shapes:** `second_horse_19230` (only a head is painted) is built as a dark horse behind the
   crowd, and `dog_or_donkey_19825` as a small dark donkey.
8. **The restyle over the bridge** (u 18700–20656) still recomposes the arch. A better one is a prompt or config call,
   yours and the lead's. It affects only reference images, not positions.
