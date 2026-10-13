# S4b (`outer_road_2`, u 12600–15500): Run 2 report

S4b is built, cast, checked alone and joined with S4 part 1, and recorded (2026-10-12). It is the pilot for boats and
water: the world's first river, moorings and walkable moving decks.

Records:
- `sections/outer_road_2/notes.md` (Run 2);
- the choices: `sections/outer_road_2/build_choices.json` (`boats`, `moves`, `how`, `edges`);
- the lessons: `gen/expand/outer_road_2_lessons.md` §0 (boats and water first);
- the pilot for the user: `gen/sections/outer_road_2/pilot/` (README.md).

Subagents:
- kit: `blender/kit_outer_road_2.py`, 24 generic parts plus a stump;
- casting: `gen/sections/outer_road_2/make_people.py` → `people.json`, `seats.json`;
- backdrop: the east panel;
- QA: walks, shots, the people check, and the gangplank diagnosis.

Each kept its scripts in its own scratchpad, `S4b_run2_{lead,kit,cast,backdrop,qa}/`. The dev server (5192) and my
headless Chrome (CDP 9232) are stopped.

## Built, per kind (`node tools/loyalty_check.mjs S4b` PASS, nothing unbuilt)

| kind | mapped | built as |
|---|---|---|
| props | 71 | models (this area's kit, `song_kit`, `kit_inner_city`, `kit_outer_road`) |
| figures | 66 | people: 62 figures + 4 walkers, 5 of them crew on 3 boats |
| buildings | 24 | models |
| trees | 13 | 12 cards (the page's fallback until `trees/assign/S4b.json` lands); the stump is a model (catalogue §5) |
| animals | 10 | rigged animals: 2 oxen in the cart's harness, 2 horses, a donkey, 4 pack mules, a bird |
| land vehicles | 3 | 2 palm-covered carts (大棕盖车, this area's kit `palm_cart`, one hitched with two oxen); the sedan chair set down (`kit_vehicles.sedan_chair`) |
| structures | 3 | the tea house's platform, the bank shed, the reed screen |
| roads, banks, water | 3 / 2 / 1 | ground; the river as one water strip (298 triangles, 153 shore-wall pieces) |

**Boats, separately:** all 6 are in `web/public/assets/outer_road_2_boats.glb` (0.79 MB, 23.3k triangles near, 9.6k
far, 0.8k collider triangles). All six are painted moored, so they ride in place.

| boat | kind | build | move (dX, dD) |
|---|---|---|---|
| `boat_big_cabin_14928` | passenger | 11.4 × 3.2 m, cabin to the bow end with the roof sitter, the sweep at rest to port, the lowered mast, baskets on the roof, two ropes to the mooring post | none |
| `boat_arched_awning_14945` | grain | 12 × 3.1 m, awnings, no crew house (its boatman sits in the open) | +1.6, +0.15 |
| `boat_mat_cargo_14900` | grain, laden | 12 × 3.1 m, gangplank to the bank | +3.75, +2.1 |
| `boat_long_cabin_14850` | passenger | 11.4 × 3.0 m, windowed deckhouse aft | +5.6, +4.35 |
| `boat_round_mat_15025` | small | 5 × 2.3 m (its painted extent allows 5–6 m) | +0.9, +5.7 |
| `boat_small_cabin_15182` | small | 6 × 1.9 m, along the far bank | +4.5, +4.45 |

The five rafted boats lie side by side in painted order, 0.10–0.39 m apart, bows at the bank.

**The far bank moved 5.5 m north** (`how` on the water and the far bank, `moves` for the shed and two willows on it).
- **Why:** at real size (at least 0.6 of each type) the raft needs about 20 m of water across. The painter's far-row
  scale leaves the cove 13–15 m wide in the frame.
- **Consequence:** the round boat, the small boat and the far bank now stand 0–4 m past the silk's top edge, in light
  mist.
- **Plan:** `gen/sections/outer_road_2/boats/` (`boat_plan.py`, `solve.py`, `moorings_plan.png` against
  `moorings_kit_default.png`).

## Budget, loyalty, walks

- **Budget:** `budget_check outer_road_2` PASS:
  - download 3.9 MB (12.9 MB with kit and cast);
  - **124.7k triangles drawn of 130k** (buildings 84.6k: tight);
  - 0.8k collider triangles;
  - 188 draw calls at the worst spot;
  - 37.8 MB GPU;
  - 76 people and animals.
- **Textures:** `ktx2.mjs encode` and `check` PASS (87 files).
- **Scroll index:** projection max 0.56 px. The one label with digits ("the S3 riverside hall") was renamed through
  `gen/map/S4b/merge_fixes.mjs` (the only map edit; reason in the file).
- **Walks alone** (`sections/outer_road_2/walks.json`): **26/26 PASS.**
  - every edge, and the shore walls;
  - the road both ways, and onto the tea house's 0.18 m floor;
  - boarding from the bank onto the big cabin boat (its whole south side) and over the bows of the arched, mat-cargo
    and long boats;
  - across the raft, arched → mat cargo → long → round, and back;
  - a rail where a deck touches nothing;
  - ashore again;
  - the big boat's stern doesn't lead off past the S3 seam.
- **Walks joined** (`walks_joined.json`): **4/4 PASS**, across u 12600 on the road and at D 25, both ways.
- **Riding:** standing 10 s on the big, arched, mat-cargo and long decks you drift 0.03–1.4 cm in the boat's frame
  while the deck bobs 6–7 cm.
- **People check:** `people_check` at `?window=all` PASS alone (76) and joined (157).
- **Shots:** `shots.json` (16) and `shots_joined.json` (3), sheets in `gen/sections/outer_road_2/shots/`.
- **QA's first pass found 8 failing walks and a failing people check.** Every one is fixed and rechecked:
  - a way off the big boat's stern onto the run-on bank past the seam: `edge:east` now carries on along the run-on
    shore;
  - bows lying over the bank: the arched and long boats were moved further out, because a raked bow reaches 1.5 m past
    its stem;
  - a one-way bridge onto the round boat's roof: its freeboard is now 0.85;
  - a boatman hidden in a crew house: the house is gone;
  - a bank walker climbing a bow's bridges: his path now stops short of it;
  - six wall-in-the-face shots: re-aimed.

## The pilot's films and shots (`gen/sections/outer_road_2/pilot/`, README.md)

**Films** (mp4 at walking speed, with a 12-frame jpg strip each):
- `film_cross_the_raft.mp4`
- `film_board_big_boat.mp4`: boarding, walking the side deck to the stern gallery, then riding.
- `film_moorings_from_bank.mp4`
- `film_from_tea_house.mp4`

**Strips** (`tools/film_page.mjs`):
- `strip_moorings_from_bank.jpg`
- `strip_from_tea_house.jpg`
- `strip_from_road.jpg`

**Shots:** `shots_10h/`: from the bank, the mooring post, the channel, the tea house and the road; the cove; two
overviews.

**The water at three hours:** `water_0830/`, `water_1300/`, `water_1800/`.

**The hulls beside their painted spots:** `moorings_plan.png` and `moorings_kit_default.png`.

## What stands in for what

**Crew:** all five are cast as the `boatman` they should be, through stand-ins:
- `seated_boatman_stern_15372` → idler (`sit_floor`);
- `seated_man_cabin_roof_15012` → scholar (`knees_up`);
- `boatman_dark_cap_15046` and `head_in_cabin_door_15097` → porter;
- `boatman_light_hat_15066` → hat_traveller.

**Recast seated figures:** four, whose own character can't sit yet. They switch back by themselves when it can.
- `seated_man_13240`: storyteller → sightseer;
- `customer_dark_hat_13027`: townsman → scholar;
- `customer_hat_14462`: townsman → fortune_teller;
- `customer_cap_14785`: sightseer → official.

**Animals on fallbacks:**
- `horse_saddled_13378`: a pale horse with `saddle` (dark coat and dark saddle cloth wanted);
- `horse_12862`: no tack (`girth_cloth` wanted);
- `donkey_13474`: grey-dun (`donkey_dark` wanted);
- the four mules: `pack_saddle` (`pack_heap_dark` wanted).

**Kit stand-ins:**
- the signboard on the shop hall is a plain board (its writing is illegible: no sign cell);
- roofs use plain tiles where diamond or lattice tiles are painted (no swatch).

## What waits on the catalogue and the factories (catalogue §1b, §1c, §3, §4, §5, §7)

**The workshop:**
- the `boatman` (the 5 crew) and the `grain_porter` (5 figures);
- the hat_traveller dark-hat variant;
- the takes: `hammer_rim` (the wheelwright), `sit_offer` (the seated man), `reach_up`, `look_up`, `tighten_girth`,
  `knee_on_stool`, `rest_load_stick`, `seated_tiller`, `floor_write`;
- the free retargets;
- the animal tones and tack listed above;
- the carried props: `mallet`, `open_sack`, `lidded_basket`, `hip_bag`, `back_tall_bundle` + `t_stick`,
  `back_chair_frame`, and `stick` on the idler.

Rerun `gen/sections/outer_road_2/make_people.py` when `workshop_progress.md` names these figures.

**The boat factory** (catalogue §4):
- B1, awnings anywhere: the mat-cargo boat's barrel mat roof over its bow, the arched boat's after-half awning, the
  small boat's canopy and stern cabin;
- B2, a pointed bow (the small boat);
- B5, sweep poses: rest for the big and arched boats, shipped for the mat-cargo boat;
- B6, a small-hull rudder and tiller;
- B7, a mast crutch for the big boat's lowered mast;
- also: **stern anchor lines** (the arched and mat-cargo boats), and the long boat's bow mat roof and emblem.

**Vehicles:** the sedan chair's closed front and rounded roof (catalogue §3, `kit_vehicles`). Swap when they land. The
palm carts are already built in this area's kit.

**Trees:**
- 12 cards: rerun `map_layout S4b` when `trees/assign/S4b.json` lands;
- the stump's `card: "kit"` assignment. **Until it lands, a fallback willow card stands on the stump.**

**The page and kit owners** (from QA):
- **the gangplank can't be walked.** It meets the mat-cargo boat's tapering bow rim at about 15°. The rail opening
  collapses to a 0.22 m slot, and the end walls stand across the plank's own corridor (`boats.js`; the kit could land
  the plank's deck end inboard on the deck). Its porter walks to its foot, and you board over the bow. Evidence:
  scratchpad `S4b_run2_qa/diag/`.
- the contact probe can land a bridge on a neighbour's roof block;
- leftover 0.5 m shore-wall stubs on some boarding bridges (cosmetic).

## For the lead and the user

1. **The user should see the moorings' compromise:** each boat at 0.6 of its real length and narrowed, the raft spread
   to real width, and the far bank moved 5.5 m north into the mist. It keeps the painted order and the relations (bows
   at the bank, the round boat at the top of the raft, the small boat along the far bank). It doesn't keep the
   painted metres. The films show it from the bank, from on board, from the tea house and from the road.
2. **The S3 join needs one plan of the seam's water.**
   - S4b's sterns reach X 88–94, past u 15500, over S3's mapped boats: `S3.veh.boat_under_way_15595`, which is also
     rowed 8 m west and back toward them; `boat_towed_mast_16228`; and `boat_passenger_long_16398`.
   - S3's far shore (D 26.3–28.7 at X 88–94) is south of S4b's moved one (D 34.9). S3 will need to move its own north
     bank, as its build rules expect.
   - S4b's water, ground and `edge:east` run on 16 m past the seam (the near shore along S3's mapped one). Cut them back
     when S3 joins.
3. **Part 1 seam:**
   - S4b's shop hall continues part 1's official hall (one painted roof); its west end sits under part 1's hip.
   - Part 1's ground still runs 16 m past u 12600, to cut back.
4. **From the casting agent:** part 1's `soldier_on_stool_11630` sits on air 0.4 m in front of his stool. His sit is a
   local retarget, whose root is under the hips, not at the feet.
5. **From the backdrop agent:** the east panel's content prompt carries a "far off across mist, the river a flat
   sliver" line. It overlaps the user's pending "seventy paces" change to `backdrop_panel.txt`. Flag it to the user.
6. **Tools:** `walk_page`, `shots_page`, `film_page` and `people_check` hard-code CDP 9223. I used port-parameterised
   copies (`S4b_run2_lead/tools/`), plus `walk_film.mjs` for mp4 walks (mp4 via ffmpeg). Both are worth adopting.
7. **The triangle budget is tight:** 124.7k of 130k, with 95/m² on 1320 m², buildings the bulk. Distance LODs on the
   page would be the lever, as in part 1.
