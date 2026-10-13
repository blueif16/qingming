# Round 2 joins (restart run, 2026-10-12 evening): every seam, S4b's boats, the whole scroll

The join agent's record and report (`restart_brief.md`, role "Join agent"). Each stage ends with what landed and the
exact next command. Check results are in `gen/sections/<folder>/qa/run3/` (seams) and `gen/sections/world/qa/run3/`
(the whole scroll); throwaway scripts in the scratchpad's `join_run3/`.

## Stage 0: picked up from the files (18:30)

The previous join agent (before the restart, transcript `5a5a3bca…/subagents/agent-adf1938d5dc151329.jsonl`) wrote no
record. What it landed, read back from its transcript and checked against the files:
- **S7 | S6:** S7's knots `[1250, 59.9]`, `[2000, 50.4]` copied into `map/frames/S6.json` (with a derivation line);
  S6's ground cut to 0.5 m past u 2000 (`blender/inner_city_scene.py`); the square well's planks run west to S7's
  buckets (`kit_inner_city.square_well(west_ext=, z_bottom=)`); the 解 board's apex moved under S7's eave, its bar
  carried on from S7's bar end, the plaque hung from it (`kit_inner_city.hung_plaque`); the servant boy's walk stops
  short of the crowd (`gen/sections/inner_city/make_people.py`, `STOP_AT_CROWD`).
- **S4 | S4b:** S4's ground cut to 0.5 m past u 12600 (`blender/outer_road_scene.py`); the plinths of the S4 halls
  that cross the seam reach deeper (`song_kit.soft_plinth(z_foot=)`); the soldier sits on his stool by the sit clip's
  measured hip offset (`gen/sections/outer_road/make_people.py`).
- Rebuilt and exported S6 and S4 (13:21); loyalty PASS for S6, S4, S7, S4b; KTX2 PASS; budgets PASS for S6 and S4.
- Walks joined: S7|S6 8/8 (`sections/city_end/walks_joined.json`), S4|S4b 4/4 (`sections/outer_road_2/walks_joined.json`).
- `people_check` joined at `?window=all`: S7+S6 PASS (17 walkers, 198 figures); S4+S4b PASS (12 walkers, 145
  figures; spots 18.9,17.3; 31.4,10.3; 60.5,17.1).
- **Open when it died:** the world's walks were 41/42 (the S6 incense-shop walk ended at X −78.4, stopped by a
  scaffold pole at D 18.6; the colliders there are unchanged from before the rebuild); the default-world
  `people_check` failed at the gate spots (7, 3.9) and (−8, 4.1) under a load average of about 40; the seam shots and
  the HUD shots were not taken (its scratchpad is gone).
- No `FINAL BUILD` line yet in S3, S2 or S1's `notes.md`.

**Order change from the lead (18:35):** a "Workshop paid run" agent is making the missing characters and recasting the
areas. Step 4, the whole-scroll pass, starts only after `ALL CAST <time>` appears in
`gen/expand/round2/workshop_progress.md`. Seams go ahead; a seam's `people_check` may need one rerun after an area is
recast (its `people.json` changes, its geometry doesn't).

## Stage 1: S4b's boats with the round-2 kit options (18:40)

- **Merged** each S4b entry of `gen/boats/round2_options.json` into `sections/outer_road_2/build_choices.json`
  `boats.<id>.kit` (the `why` of each boat says so): the big boat's sweep at rest and its mast in a crutch; the arched
  boat's stern anchor line; the mat-cargo boat's dark barrel hood over its bow, its sweep shipped, its anchor line and
  the gangplank landing square; the long boat's dark hood over its bow; the small boat's pointed bow, tiller, canopy and
  stern cabin.
- **Rebuilt:** `node tools/export_web_scene.mjs outer_road_2 --boats-only --rebuild-boats`: 6 boats, 25.1k triangles
  near (was 23.3k), 9.8k far, 836 KB (was 790 KB), none lost; scroll index 112 entries, max 0.56 px.
  Log: `gen/sections/outer_road_2/qa/run3/export_boats.log`.
- **Loyalty S4b:** PASS. **Budget `outer_road_2`:** PASS (4.85 MB; 17.68 MB with kit and cast; 124.9k of 130k
  triangles; 210 draw calls; 41.9 MB GPU), `qa/run3/budget.log`.
- **Deck walks alone** (`sections/outer_road_2/walks.json`): **26/26 PASS, twice** (`qa/run3/walks_alone.log`,
  `walks_alone_rerun.log`). First run 20/28 (with two new gangplank walks). Six deck walks were re-aimed, each with a
  note in its `why`:
  - The mat-cargo boat's bow is now under its painted hood, and the plank's rails cross the old bow approach. You board
    it across the raft from the arched-awning boat, aft of the hood; its north rail is tested at X 81.5. You go back
    ashore over the arched boat's bow.
  - The crossing to the long boat moved from X 85 to X 83.9: its cabin side stands at D 27.4 at X 85.
  - The long boat's painted bow hood (1 m over its deck) now stops you on its foredeck. You board it over the bow tip
    (unchanged, PASS) or across the raft.
- **The gangplank still can't be walked,** but it is no longer the kit's fault: the plank lands square (0.35 m over
  the deck). Two of the page's invisible end walls (`boats.js` caps) stand across its corridor. Requested in
  `page_queue.md`. The two plank walks wait in `qa/run3/walks_gangplank_pending.json`; they join `walks.json` once the
  fix lands. If it doesn't land, it goes on the user list.
- Next: `tools/chrome_slot.sh node tools/walk_page.mjs "http://127.0.0.1:5190/world.html?sections=outer_road_2" gen/sections/outer_road_2/qa/run3/walks_gangplank_pending.json`
  after the page agent marks the request done.

## Stage 2: S7 | S6 and S4 | S4b finished (18:55)

Results in `gen/sections/city_end/qa/run3/` (S7|S6) and `gen/sections/outer_road_2/qa/run3/` (S4|S4b).
- **Walks joined:**
  - S7|S6: 8/8 PASS (`walks_joined.log`).
  - S4|S4b: 4/4 PASS, with the new boats.
- **Shots across the seams:** the previous agent's seam spots (recovered from its transcript) are now kept in the repo,
  appended to the joined shot files with `hour: 10`. An earlier spot, `J16_night_seam`, sets hour 21, and that setting
  carries over to the spots after it.
  - S7|S6: `sections/city_end/shots_joined.json`, 28 spots (K1–K12 new), sheet `shots_joined/sheet.jpg`.
    - The grounds meet with no step, hole or overlap at the street, the courtyard and the top.
    - The well's planks run west under S7's buckets.
    - The 解 plaque hangs from the bar carried on from S7's bar; the board's apex sits under S7's eave.
  - S4|S4b: `sections/outer_road_2/shots_joined.json`, 13 spots (L1–L8, M1–M2 new).
    - The road and the top street run on across u 12600 without a seam line.
    - The halls' plinths stand on S4b's ground.
    - The soldier sits on his stool.
  - No console errors. (K2, K5 and L6 look into a wall: the spots, not the scene.)
- **HUD shots** (my `hud_shots.mjs`: `goto`, stand on the ground, `hud.show()`, screenshot and `hud.json` with
  `you()` and the boxed people):
  - S7: 赵太丞家, the retinue, the gate passage, and the 解 corner at the seam (in S6's index). Rings on the painted
    street spots; 21–90 people boxed per spot; no unindexed people.
  - S4b: the official hall at the seam, the palm cart's onlookers (`hud_b/`; the first spot stood on a roof), the
    tea house and the moorings. Rings on the painted spots; 22–63 boxed; no unindexed people.
- **`people_check`, S6 + S5 + S4 at `?window=all`:** PASS on the second run, at the world's spots
  (`gen/expand/engine_lessons.md`: −52,9.33; −60.8,5.37; −73,4.49; 18.9,17.3; 31.4,10.3; 16.0,4.7), with 31 walkers,
  340 figures and none stuck. The first run failed only at 18.9,17.3: one walker came and turned back. Log:
  `gen/sections/world/qa/run3/people_s6_s5_s4_spots*.log`.
  - The previous agent's failing spots (7, 3.9) and (−8, 4.1) are the gate's own defaults. They were made for the gate
    alone with load-test traffic and fail on the original page too (engine lessons).
  - S7+S6 (PASS) and S4+S4b (PASS) stand from the previous agent. Rerun them if the workshop recasts these areas.
- **The world's walks on the new default (all eight sections):** 41/42 in the full run, and the one fail (a walker in
  the way) passed 3 of 3 runs alone. This is after these edits to `sections/world/walks.json`:
  - Five walks into the S6 west edge and the S4 east edge no longer meet an edge, because those seams are now open.
    The two round-the-well walks now cross into S7. The S6 west-edge walks and the S4 east-edge walk are replaced by
    S7|S6's and S4|S4b's joined walks, as `sections/world/README.json` describes.
  - The incense-shop walk's first leg is 0.55 s (was 0.4). The 0.4 s leg stopped the walker on the signboard's post
    at D 18.6; the gap is D 17.9–18.6, and the colliders are unchanged since before the rebuild.
  - The square's south-edge walk lasts 5 s (was 4). A walker crossing the square can slow you; it passed 3 of 3 runs.

  Logs: `gen/sections/world/qa/run3/walks_world_default.log` (41/42 before the last edit; the one fail was that
  walker).
- Next: wait for `FINAL BUILD` in `sections/rainbow_bridge/notes.md` (S3), then the S4b|S3 seam.

## Stage 3: S4b | S3 (19:10)

S3's `FINAL BUILD 18:58`. Results are in `gen/sections/rainbow_bridge/qa/run3/join_*` (S3's own run3 files are the
finisher's).
- **Seam notes:** all already applied by S3's merge (`gen/map/S3/merge_fixes.mjs` §4, §9):
  - S3's road starts on S4b's road point at u 15500.
  - S3's near shore and bank top start on S4b's points.
  - S3's far shore starts on S4b's moved far shore (79.86, 34.90), so the two water strips meet edge to edge on the
    seam line.
  - The willow crown at the seam is S3's by its main point.
  - S3's boat under way at the seam runs 1 m (S4b's sterns lie 0.3 m off its bow).
- **The older side cut back** (`blender/outer_road_2_scene.py`, comments dated):
  - S4b's ground stops 0.5 m past u 15500 on a clean line, as part 1 did at the S4b seam. Vertices past the cut move
    onto it; faces that collapse are dropped. S3's ground dips 0.12 m under it there.
  - S4b's water strip stops on the seam (the quad's east run-on is 0).
  - The shore lines keep their run-on, so the banks within the 0.5 m overlap have the same shape as S3's.
  - `edge:east`'s run-on along S3's shore drops with the seam walls when S3 is loaded, as before.
  - Rebuilt: 122.4k triangles, exported `--no-boats`, loyalty S4b PASS, scroll index 0.56 px.
  - S4b walks alone: 26/26, twice. One walk was re-aimed: the arched boat's bow descent (`why` dated).
- **Walks across the seam** (`sections/rainbow_bridge/walks_joined.json`): **7/7 PASS** (`join_walks_s4b_s3.log`),
  covering the road both ways, between the road and the shore both ways, and S3's south foot to S4b's tea house.
  - One walk changed meaning. "Onto S4b's big cabin boat's stern from S3's bank" had passed by standing on a bridge
    onto S4b's 16 m run-on bank. That bank lay under S3's, and the walk never got past S3's shore wall.
  - With the run-on cut, S3's bank is too low for the stern gallery (deck 1.1 m), so the stern keeps its rail. The walk
    now checks that S3's shore wall stops you there, so nobody reaches the water. You board that boat along its side,
    west of the seam.
- **`people_check` joined at `?window=all`:** PASS on the rerun: 12 walkers, 305 figures, none stuck, 0 m off the
  ground. Spots: S3's 131,−3.32; 132,5.05; 123.5,3.28; and S4b's 75.47,16.8 on a walker's line (no walker crosses near
  the seam itself). Logs: `join_people_s4b_s3*.log`.
  - The first run, with `people_check.mjs` updated at 19:04, said S3's `porter_baskets_bottom_18175` was 1.5 m off the
    ground.
  - S3 alone with the new tool: 0 m off, PASS. The ground under his path is at 0 ± 0.03 except for a low prop at its
    east end.
  - It didn't repeat.
- **Shots across** (`sections/rainbow_bridge/shots_joined.json`, 10 spots): `join_shots_s4b_s3/sheet.jpg`, no console
  errors. Ground, banks and water run on across u 15500, and S4b's sterns lie clear of S3's boats.
- **HUD shots** (`join_hud/`, `join_hud_b/`):
  - The riverside hall at the seam (S3, 18 boxed), the crown (on the deck at H 5.4; 135 boxed), 十千脚店's gate (45) and
    the big boat under the arch (147).
  - The rings sit on the painted spots, and no one is unindexed.
- **S4b's gangplank after the page fix:**
  - The plank can now be walked to its top: (76.77, 23.48), H 0.5.
  - Its deck end lands at the fore end of the painted bow hood (round-2 option 0.82–1.06), whose collider closes the
    way onto the deck.
  - The porter's path ends on the plank's foot, so he stands in the way up and down. The plank walks failed 3 of 3,
    with the walker pushed aside onto the bank slope.
  - No cheap fix: the hood is painted, and the kit's awnings are solid. The walks stay out of `walks.json`; they are in
    `qa/run3/walks_gangplank_pending.json` (S4b). For the user list.
- Next: the S3 | S2 seam (S2 `FINAL BUILD 18:56`).

## Stage 4: S3 | S2 and S2 | S1 (19:35)

S2's `FINAL BUILD` was 18:56 and S1's 18:59. The S2 finisher had already run both seams joined (8/8) and left two
notes for me: S2's river ends against S1's ground, and there are pale patches at the S3 seam. Results are in
`gen/sections/canal/qa/run3/join_*` and `gen/sections/countryside/qa/run3/join_*`.
- **Seam notes:** applied by the areas' merges and frames.
  - S3|S2: the big boat under the arch is S3's, and the south-bank boat whose stem crosses u 20500 is S3's too.
    S2's big willow is S2's. S3's route runs on along S2's north bank.
  - S1|S2 at u 29050: the 望楼饭铺 shed is whole in S2, and the stalls east of it are S1's. The corners matched at
    16:49.
  - There was nothing to cut: S3, S2 and S1 were all built to the round-2 rule (each stops 0.5 m past a seam and dips
    0.12 m), except S2, which runs level 1 m past the S1 seam while S1 dips under it.
- **The S2|S1 river end, fixed** (S2 finisher's note, shot `j08`):
  - The problem: S2's east reach runs on to the seam (S2's recorded choice, so that grain boat 2 floats east of grain
    1) and stops on it from D −19.3 to 7.2. Against S1's land it ended as a box: S2's bed rose as a vertical face at
    the seam, and S1's ground edge hung over the water with sky showing through the gap.
  - Fix in S2, `blender/canal_scene.py` `ground()`: the bed rises to just under the water at the seam, and the ground
    stops on the seam where the water meets it. North of the water's end it runs 1 m past the seam as before, but for
    3 m it dips 0.15 m so that it passes under S1's bank (`hz`, `at_end`).
  - Fix in S1, `blender/countryside_scene.py` `s2_river_end()`: S1's ground rises out of the water as a 2.2 m bank
    (water level on the seam, the land 2.2 m in), blending out round the water's north end.
  - In both builders the change is marked join 2026-10-12.
  - Rebuilt both (S2 116.7k, S1 96.6k triangles) and exported `--no-boats`. Loyalty S2 and S1 PASS; scroll index
    0.73 and 0.64 px.
  - The rule I followed: the lower ground must reach past the upper ground's edge. Sampled heights along the seam
    (`seamprofile.mjs`, D 5–11) have S1 above S2 wherever the river touches the seam.
  - Shots `R1`–`R5` in `sections/countryside/shots_joined.json` (→ `join_shots_s2_s1/`): the water now meets a sandy
    bank. Left: a dark 0–3 cm lip at the north corner, and the seam line is straight in plan along 10 m of water
    end (most of it under the mist).
- **S3 seam's pale patches** (`j03`, `j05`): gone since the page agent's change, which starts the mist at the
  walkable edge (`join_shots_joined/`).
- **Walks:**
  - Alone after the edits: S2 26/26 and S1 50/50 (`join_walks_alone_after_seam.log`).
  - Joined (`?sections=rainbow_bridge,canal,countryside`): S2's `walks_joined.json` 8/8 and S1's 6/6
    (`join_walks_joined.log`).
  - S1's two off-road crossings at D 6.4 started in S2's water. They now run at D 10, north of the river's end.
  - A new walk goes down S1's bank to the river's end, where the walls on the seam stop you at the water's edge
    (H −0.65).
- **`people_check` S3 + S2 + S1 at `?window=all`:** PASS (34 walkers, 398 figures, none stuck, 0 m off the ground),
  `join_people_s3_s2_s1_final.log`.
  - Spots used: 131,−3.32 (S3); 194.5,22.3 (S2's unloading yard); 268.78,11.96 (S2's bank porter, by the S1 seam);
    289.5,0.2 (S1's travellers).
  - Dropped spots, where walkers turn back because there is no room to pass (logs `_b`, `_c`):
    - 158,−3.51: the only walker near the S3|S2 seam walks 0.9 m from the silk's bottom edge.
    - 272–275.5,12.74: the end of S2's sack porter's 7 m path, in the wharf's corner.
  - 131,−3.32 turned walkers back once out of three runs (timing).
- **Reruns after the recasts:**
  - S4b's and S2's at 19:19, and S7's at 18:56.
  - S4b + S3: PASS. S4 + S4b: PASS. S7 + S6: PASS on the second run (the first had no walker crossing the line at
    −84.5,7 in 12 s).
  - Logs `join_people_*_recast*.log` in each section's `qa/run3/`.
- **Shots across:** S2's `shots_joined.json` (9) → `join_shots_joined/`, no console errors.
- **HUD** (`canal/qa/run3/join_hud/`): the north strip at the S3|S2 seam (S2, 61 boxed), S3's south bank by the seam
  (22), the road at the S1 seam (27) and the river's end (27). The rings sit on the painted spots.
- **For the lead (not a seam):** S1's scroll index has 5 labels with digits: the charcoal donkeys "D1"–"D5", from
  their map names. It needs one rename in `gen/map/S1/merge_fixes.mjs`, or `scroll_index.mjs` `plain()` dropping
  letter-digit tags.
- Next: the whole scroll (`ALL CAST 19:18` is in).

## Stage 5: the whole scroll (19:45), after `ALL CAST 19:18` and the 19:19 recast of S4b and S2

Results are in `gen/sections/world/qa/run3/`. The page's default world is all 8 sections, S7 to S1.
- **`loyalty_check`:** PASS for all 8 (S7, S6, S5, S4, S4b, S3, S2, S1), `loyalty_all.log`. S7 was rerun after its
  bucket fix.
- **`ktx2.mjs check`:** PASS (127 encoded, none to encode, none orphaned), `ktx2_check.log`.
- **`budget_check all`:** PASS on all 74 lines (`budget_all.log`, `budget_all.json`), with the new 28 MB cast line
  and S3's 82 MB GPU exception.
  - **The window, which binds: 198.2 of 200 MB GPU for S4b + S3 + S2.** Only 1.8 MB of headroom.
  - Download with kit and cast: S3 26.13 and S2 25.15 of 28 MB, the largest.
- **`people_check` on the whole scroll at `?window=all`:** PASS. 72 walkers and 825 figures, none stuck, 0 m off the
  ground, and walking into a figure stops at 0.56 m. At every road spot someone went round you and nobody stood
  stuck for more than 6 s (`people_world_all.log`).
  - Spots (S7 → S1): −96.2,3.6; −52,9.33; −73,4.49; 16.0,4.7 (S5|S4); 18.9,17.3; 60.5,17.1; 131,−3.32; 194.5,22.3;
    268.78,11.96; 289.5,0.2.
  - Not used: the gate's own defaults (7,3.9 and −8,4.1). They predate the loyalty pass and its removal of the
    traffic walkers, and nobody can go round there.
- **The world's walks** (`sections/world/walks.json`, default URL, `goto` per walk): the 42 earlier walks, 5 of them
  changed for the open seams (Stage 2), plus 169 from the sections' own and joined walk files, sorted west to east
  (`from` names each one's source file).
  - Left out (`walks_world_all_candidate.json` → the final file):
    - every walk marked alone or relying on a seam wall;
    - S4b's two east-edge walks;
    - S4b's "board the arched boat from the bank south-west of its bow": S4b's bank walker paces across that
      boarding line and, in the world, often stands on it. It passes alone.
    - S2's "carried at the sweep boat's bow rail": its end depends on the boat's phase, which differs in the world.
      It passes alone.
  - The world copies of a few walks start where a walker or the open seams no longer decide the end; each has a
    dated `why`:
    - S4b's raft walks start on the arched boat's foredeck, and the round-boat ones take a 1.2 s west leg.
    - S4b's road walk continues into S4.
    - S3's shore walk at the S4b seam allows a 0.5 m slide.
    - S7's bucket walk: S6's boards lie under the bucket.
    - S2's bank walk: a tracker holds you up about 1 s.
  - **Final full run: 210/211** (`walks_world_all_final3.log`). The one fail was that S2 bank walk, ending at X 169.5
    against 170.5. Its world range now starts at 169.0, as it observably ends there in the full run (171.6 alone, PASS
    2/2). Earlier full runs: 207/215, 208/213, 208/212 (`walks_world_all*.log`). Every fail was a seam-wall walk or
    a walker in the way, and each was handled as above.
- **The world's shots:** not retaken. Every seam has its own shots in `qa/run3`.

## For the lead

- **Budget window:** S4b + S3 + S2 hold 198.2 of 200 MB of GPU. The next thing added to any of these three needs
  room first. The cheap levers are the casts (S3 29 models, S2 27) or distance LODs on S4b's buildings.
- **S1's scroll index** has 5 labels with digits: the charcoal donkeys "D1"–"D5". Fix with one rename in
  `gen/map/S1/merge_fixes.mjs`, or have `scroll_index.mjs` `plain()` drop letter-digit tags.
- **A page limit at the seams** (the page queue is closed): `boats.js` probes a boat's contacts once, when its
  section loads, and opens only its own section's shore walls. So a boat whose hull runs past a seam (S4b's big
  cabin boat) can't open a bridge onto, or a gate in, the neighbour's bank. Nothing fails because of it: rails and
  walls keep you dry.
- **Shared kit:** the round-2 awnings and hoods collide as solid blocks, so you can't walk under a hood. That is what
  closes S4b's gangplank.
- **Builders I changed** (each change commented and dated):
  - `outer_road_2_scene.py`: the seam cut at S3.
  - `canal_scene.py` and `countryside_scene.py`: the river's end at the S1 seam.
  - `city_end_scene.py`: the buckets collide.
- **Data I changed:**
  - `sections/outer_road_2/build_choices.json`: the boat options.
  - Walk and shot files in `sections/{city_end,outer_road_2,rainbow_bridge,countryside,world}/`.
  - Records in each section's `notes.md`.
- Nothing of mine is running.

## For the user

1. **S4b's mat-cargo boat's gangplank:** you can walk up it now, but at the top its painted dark bow hood closes the
   way onto the deck. The porter also stands at its foot. Board that boat across the raft from the arched boat.
2. **S4b's biggest boat, past the S3 seam:** its stern can't be boarded from S3's bank. Its high stern gallery stands
   1.1 m above that low bank, so its rail stays shut. Board it along its side in S4b.
3. **Where the river ends at the S1 seam:** S2 ran the river's estimated end on to the seam so that the second grain
   boat floats. It now ends against a sandy bank rising out of the water, no longer against a wall with a gap. The
   water's end is a straight 10 m line along the seam, mostly under the mist. Look at it from S1's road (shots
   `R2`, `R5` in `gen/sections/countryside/qa/run3/join_shots_s2_s1/`).
4. **S4b's round-2 boat options:** the mat-cargo boat and the long boat now carry their painted dark bow hoods, so you
   board both across the raft. The small boat has its canopy, stern cabin and tiller, and the big boat's sweep is at
   rest with its mast in a crutch.
5. **S7's buckets** at the well now stop you; before, you could walk through them. The bail bucket stands on S6's
   well boards, which were run west under it at the join.
