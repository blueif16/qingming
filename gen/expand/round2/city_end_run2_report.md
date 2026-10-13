# S7 `city_end` (the scroll's end, u 815–2000): Run 2 report

Round 2 Run 2, 2026-10-12. The area is built, cast and checked, both alone and joined with S6. I used three
subagents: a kit agent, a casting agent and an independent QA agent. I fixed every S7 defect the QA agent found and
rechecked it the same way. My dev server (5191) and my Chrome (CDP 9241) are both stopped.

## Files

- **Builder:** `blender/city_end_scene.py`. It derives everything from the layout, puts every piece inside
  `sb.entity`, uses strict buckets and has one edge wall per side. Each build also writes
  `gen/sections/city_end/solids.json`: the collider cells by owner, plus the seats and the gate passage.
- **Kit:** `blender/kit_city_end.py`, 18 generic parts. Review renders are in `gen/sections/city_end/kit_review/`.
- **Sign atlas:** `gen/sections/city_end/make_signs.mjs`, which writes `textures/signs_city_end.*`.
- **Casting:** `gen/sections/city_end/make_people.py`, which writes `sections/city_end/people.json` and `cast.json`.
- **Section files** in `sections/city_end/`: `build_choices.json`, `scene.json` (a spawn and 8 views), `backdrop.json`
  (no panels), `shots.json`, `shots_joined.json`, `walks.json` and `walks_joined.json`.
- **Records:** `sections/city_end/notes.md` ("Build, Run 2") and `gen/expand/city_end_lessons.md` ("Run 2"), with
  exact text for `web-scene` and `characters`.
- **Tree proposal:** `gen/sections/city_end/trees_assign_proposal.json`, for the tree factory.
- **Shipped:** `web/public/assets/city_end.glb` (0.85 MB) and `assets/city_end/` (layout, scene, people, backdrop,
  scroll index).

## Counts built per kind

| kind | mapped | built | how |
|---|---|---|---|
| buildings | 9 | 9 | models: the gate hall, 赵太丞家 and its back hall, the middle, main and north-south halls, the far gable, the hip-gable building, the 解 building |
| structures | 5 | 5 | models: the two gate blocks, the railing, the box shed, the small gate roof |
| props | 20 | 20 | models: the boards, the lattice stand, the benches, counter, rack, armchair, footrest, seat box, sack, stones, leaning panel, 4 buckets, the stand, tub and poles |
| trees | 9 | 9 | page cards (see "Waiting") |
| figures | 17 | 17 | people: 14 at their spots (one of them rides), 3 walkers (the porter, the man with the bag, the man with the bundle) |
| animals | 3 | 2 | `horse_white` with its saddle, ridden by the official; the crow perched at H 3.2 on the north-south hall. `pale_shape_1905` is recorded as unbuilt (conf low, animal or mat: the lead's call; `PALE_SHAPE` in the casting script turns it on in one line) |
| road | 1 | 1 | ground |

**Triangles:** 48.5k in total: buildings 32.8k, structures 4.8k, props 6.2k, ground 4.3k. The GLB has 31 draw calls.

**Recorded moves:** the two twig bushes at the bottom edge moved 0.9 m south. Their estimated bases stood inside the
解 building's mapped footprint.

**Choices worth knowing** (all are in `notes.md` and the builder's docstrings):
- **North-south hall:** its east wall is at X −100.0 instead of the placeholder's −98.3. Built at real size, its east
  slope is 3.22 m high at the crow's mapped spot, so the crow sits on the tiles where it is painted, at its frame H of
  3.2.
- **Hip-gable building:** rebuilt as 5.25 × 3.04 m. The placeholder (3 m along the ridge, 5 m deep) can't carry a
  hip-gable roof whose ridge runs east-west.
- **The tub:** built to reading (a), one tall slatted vessel of 2.1 m.
- **The gate hall:** it runs east to 赵太丞家's west wall. Its door frame is at mid-depth, with the one painted leaf
  standing open.
- **The woman's bench:** 0.55 m high, to match her `sit` clip's seat height.
- **Halls at the top of the silk:** real eaves and ridges.

## Loyalty, budget, walks

- **`loyalty_check S7`:** PASS. 63 of the 64 mapped things (the 6 groups aside) are built; the one unbuilt is recorded.
- **Export:** the scroll index has 34 entries, with a projection max of 0.57 px.
- **KTX2:** S7's sign atlas is encoded (UASTC) and current. The global `ktx2.mjs check` now fails only on S3's and S2's
  new files (`signs_rainbow_bridge`, `canal/backdrop_*`), which are theirs to encode.
- **`budget_check city_end`:** PASS on every line.

  | budget line | result |
  |---|---|
  | own download | 1.53 MB |
  | download with kit and cast | 8.47 MB |
  | triangles drawn | 48.0k |
  | collider-only triangles | 0.5k |
  | own textures | 1.33 MB |
  | draw calls at the worst spot | 132 |
  | GPU, section alone | 21.4 MB |

- **Walks alone:** 18 of 18 PASS.
  - Every edge stops you: the cut end, the seam, and the silk's top and bottom.
  - Into the shop you stop at the counter, and in the gate passage at the partition.
  - The walks round the shed, the buckets, the 解 eave and the courtyards at the top all pass.
- **Walks joined with S6:** 8 of 8 PASS, at both the default window and `&window=all`. They cover the street both
  ways, the well, the courtyard at the top both ways, the 解 corner, and the walk from S6's 解 ring under my east eave.
- **`people_check`:** PASS alone and joined at `&window=all`. Joined, 17 walkers and 198 figures run with nobody
  stuck, and every body keeps 0.56 m.
- **Shots:** `gen/sections/city_end/qa/alone/` has 31 and `qa/joined/` has 16. HUD checks at 赵太丞家, the gate and the
  retinue put the ring and boxes on the painted spots. Film strips of the porter, the retinue and the seated woman are
  in `qa/film/`.
- **What reads right:**
  - The tablets 趙 太 丞 家 hang east to west as painted, and none is mirrored.
  - 五勞七傷 is followed by three faded □.
  - The child sits on the seated woman's lap.
  - A head peeks at the open leaf of the gate passage.
  - The crow sits by its vent.
  - The cut end shows mist and no panel.

## What stands in for what

All 17 figures are cast from the 22 existing characters. In the cast list, a character in brackets is the stand-in
that plays now, and "fallback" marks a pose fallback.

- **official_rider** (new character, catalogue item 22): played by the hat traveller, or by `hat_traveller_dark` if
  that recolour lands. He rides as painted.
- **dark_hat** (catalogue item 14): the porter is played by the porter, carrying `pole_baskets`; the bundle man is
  played by the inspector.
- **groom** (catalogue item 17): the groom is played by the inspector, the attendant in pale by the idler.
- **woman_pale** (catalogue item 45, or the free recolour): both women are played by the woman. The seated woman holds
  the child with `child_in_arms`, kept in her `sit` clip's calm opening.
- **Gatekeeper:** the elder plays him as a pose fallback. The robed man has no seated clip yet; he takes the part back
  by himself once `sit_talk` or `sit` lands.
- **Played as the needs list asks:** the idler (the man at the post, on `lean_wall`; the water carrier, on
  `bucket_lift`), the scholar (the pointing man, on `talk`/`look`), the camel driver (the visitor), the townsman (the
  folded-object bearer; the man with the bag), the fortune teller (the doctor, on `idle`), and the child (the head at
  the gate, scale 0.8; the child on the lap, `carried_by`).
- **The retinue:** it stands with the ridden horse, as in S4 and S6. Their painted walk waits for a procession routine
  on the page.

## What waits on the catalogue or the factories

A rerun of `python3 gen/sections/city_end/make_people.py`, then `node tools/export_web_scene.mjs city_end`, picks up
every item below by itself.

- **New characters:** official_rider, dark_hat, groom, woman_pale. The lead says to watch
  `gen/expand/round2/workshop_progress.md` for them.
- **New takes:** `examine_child` (the doctor), `sit_hold_child` (the seated woman) and `point_way` (the pointing man);
  optionally `lean_post_talk` and `walk_hold_chest`. When `examine_child` lands, the doctor must step about 1 m west
  (he stands 1.6 m from the child; recorded in `clips_why`).
- **Free retargets:**
  - `sit_talk` (or `sit`) onto the robed man
  - `bridle` onto the inspector or groom
  - `hand_over` onto the fortune teller
  - `point` onto the scholar
  - `look` onto the woman
  - `carry_pole` onto the townsman and the idler
- **Carried props:** `food_box` and the big `back_bundle` placement, `folded_parasol`, `staff` on the shoulder,
  `pole_hooks`, `hip_bag`, `bundle_small`, `child_on_lap`, and the riding stick.
- **Tack:** `saddle_fringe` for the white horse.
- **Trees:** `trees/assign/S7.json` from the tree factory, which the lead says is running.
  - Until it lands, the page draws all nine trees on the default willow card. This is the visible gap QA ranked high.
  - My proposal on existing cards is `gen/sections/city_end/trees_assign_proposal.json`.
  - The new cards `willow_weep_1` (the hanging willow) and `bamboo_6` (the two needle trees) have interim cards in the
    proposal.
  - When the assignment lands, rerun `node tools/map_layout.mjs S7`, then export, then `ktx2.mjs encode`.
- **Page:** a procession routine (a group walk) for the retinue.

## For the lead: seam notes with S6 (S6's files are not edited)

1. **S6's ground** still runs 16 m past u 2000. The two grounds both undulate about ±5 cm, so S6's pokes through mine
   in patches out to X −103 at D 11 and X −106 at D 27 (`qa/joined/J13`, `J14`). It needs your cut at the seam. My
   ground stops 0.5 m past the seam on a clean line and dips 0.12 m there.
2. **`S6.prop.jie_signboard_2085`:** S6's builder puts the board's apex at (−78.33, −3.03, 3.0), which is u ≈ 2064.
   In the painting its top edge leans on my 解 building's east eave, which is built at X ≈ −79.75, eave height 2.75 m,
   carried on the painted post at (−79.93, −3.18).
   - **The bar:** I built its west part, from the post (z 2.68) to the seam at X −79.06. S6 should carry it on to
     u ≈ 2062 and hang the 解 plaque on it, or the lead keeps the plaque on the board's face.
   - **The apex:** S6 should move the board's apex to about (−79.6, −3.0, 2.7).
3. **`S6.str.square_well_2000`:** S6 builds the platform in its own frame, and its planks end at X −89.6 at
   D 12.4.
   - `bucket_lidded_1988` stands on them, at z 0.08.
   - `bucket_bail_1950`, which the map puts "on" the platform, stands on the ground 0.4 m off it.
   - Either the platform or the map should change; it's minor.
4. **`S6.prop.mat_awning_2000`:** its south-west corner sits under my 解 roof's north-east eave corner, as painted.
   The awning is at 2.35 m and my eave at 2.79 m, and the two don't clash.
5. **S6 internal (QA):** `servant_boy_bundle_3270` walks within 0.01–0.12 m of `grey_back_2862` and
   `child_by_dark_robe_2880` near (−76.6, 10.4).
6. **Run 1's seam notes** are still open: `house_well_2020`'s eave starts at u ≈ 1963, not 2020, the awning's posts
   are my eave post, the seam knot (S6's own 解 board feet read dx 59.6), and the rest in
   `gen/map/S7/merge_notes.md`.

## For the lead: still open, and for the user

- **No east panel.** S6 is always in S7's streaming window, so the page never needs one. Alone, or at `?window=0`,
  the seam shows mist. West is the scroll's cut end, also mist only.
- **Conf-low readings I built one way:**
  - `face_at_gate_door_1251` is a peeking child, nudged 1.45 m east into the passage: the frame's weak west knot put
    it inside the west pier.
  - `stones_fence_foot_945` is low stones.
  - `gnarled_low_edge_875` is a tree.
  - `box_shed_1855` is a shed.
  - The tub is reading (a).
  - Each can be switched if the lead reads them otherwise.
- **Known small departures:**
  - The man at the post stands rather than leans; that waits for `lean_post_talk`.
  - The main hall's motifs fill its whole front. In the painting the panel's lower part is hidden behind the middle
    hall's roof.
- **For the lead's tools:**
  - The four page tools (`shots_page`, `walk_page`, `people_check`, `film_page`) hard-code CDP 9223. I ran copies on
    port 9241, built in `scratchpad/S7_run2_qa/tools/`. A `CDP_PORT` env var in the originals would save every area
    this.
  - `walk_page` legs are `[facing, seconds]`, not metres as the skill implies.
- **For the user:**
  - The scroll's last figure, the broad-hatted official, rides under a straw hat until his character is made
    (catalogue item 22, 30 credits).
  - The nine trees all show as the same willow until the tree factory's assignment lands.
