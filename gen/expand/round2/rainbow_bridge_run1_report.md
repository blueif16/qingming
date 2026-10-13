# S3 (`rainbow_bridge`, u 15500–20500): Run 1 report

Round 2's mapping workflow, 2026-10-12. The steps were:
- **setup:** the area brief, the restyle (13 images and a rerun of the six weakest tiles) and the tile brief;
- **14 units:** bridge, river_w, river_e, structures_w, structures_e and t1–t9. Eight of them (river_w, river_e, both
  structures units, t1–t4) were relaunched by hand after the `/login` killed them at start;
- the **merge** (462 entities);
- **three second-pass agents** (west, middle, east: 45 proposals, all accepted);
- the **frame and layout** (467 entities);
- the **needs** step.

The brief is `gen/expand/round2/brief_rainbow_bridge.md`. The run is recorded in:
- `gen/map/S3/merge_notes.md` (the merge, the second pass and the frame's decisions);
- `gen/map/S3/reports/*.md` (every unit, and `frame.md`);
- `sections/rainbow_bridge/notes.md`.

The needs list is `gen/expand/rainbow_bridge_needs.md`, and the lessons are in `gen/expand/rainbow_bridge_lessons.md`.

## For the lead first

1. **The bridge deck's heights don't use your `H_profile_X`.** With S3's knots the bridge's axis runs 50.6° from east
   and its width lies east-west in the picture, so world X doesn't fix a point's place along the deck. An X profile
   from the kit's table missed the painted heights by rms 2.9 m, and the tool's solve diverged on the flanks (many
   south-ramp figures at H 0).
   - **The frame uses instead** 17 u-keyed supports, one per 50-px band west of the painted near edge (the bridge
     agent's rule u* = max(u, u_s(v))). The deck lines and the route's three lines are exact, and the 88 deck entities
     are within rms 0.17 m.
   - **Tool request:** a deck support that `world()` reads at u* = max(u, u_s(v)), or an `H_profile` keyed by depth
     with a damped solve. Either lets the 17 bands collapse into one `bridge deck`.
   - **Map against build:** the kit's square, walkable deck fits the mapped heights at rms 2.51 m, and 30 of the 88
     deck entities fall off the built deck. They are placed with `on_deck` and recorded moves.
   - **Clearance:** the kit's soffit is 2.86 m above the water over the middle 40%, under the 3.5 m it wants for the big
     boat. The cabin boat under the arch must clear it too.
2. **S3's area kit has no name.** `build_rules.md` puts each area's new parts in `blender/kit_<folder>.py`, which for
   S3 is `kit_rainbow_bridge.py`, the factory's shared set-piece module. Name S3's area kit (for example
   `kit_rainbow_bridge_area.py`). It holds the 彩楼欢门 (`build_rules.md` §4) and the parts in the needs list.
3. **The route at the S4b seam jogs 5.8 m north within 1.2 m of X.** Point 0 is S4b's road point (15500, 1530, est).
   Your reading (c) runs the road behind the riverside hall at v ≈ 1235. The hidden stretch is all est, under roofs;
   the builder lays only what the walkable area needs.
4. **The far shores map 0.15–0.86 m north of the bank tops** (est waterlines only 10–46 px below the tops, where the
   water at −0.7 needs at least 54 px). At S2's seam the route runs along the water's edge, and its `edge_s` lies 0.5 m
   out over the water. The builder takes the water plane to the `bank_top` lines (S4b's convention).
5. **The receding direction drifts:** dx 31.6 at the seam (S4b's), 47.9 at 十千脚店's 杈子, 39.2 at the bridge's south
   foot, 30.4 at its north end. The north-bank tavern's tables read 41 and are not a knot (it would compress the silk's
   top rows 6:1). The bridge's own axis reads about 90 and is not a knot either (it folds the plan).
6. **The boat factory's inventory** (`gen/boats/types.md` #6–#13) differs from the map in five places:
   - #9–10 are three boats;
   - the cabin boat under the arch and the skiff are missing;
   - #12 is a cargo boat with a deckhouse and an after cabin, not a full passenger house;
   - #6's bow is west;
   - #13's ends are unread.
7. **A stale `what` to fix at the next merge:** `S3.bld.open_shop_20000` still names "a hanging sack" on a pole. The
   second pass retired `hanging_sack_and_staff_20412` as `porter_with_pole_20450`'s load.
8. **Your calls on low things:**
   - `S3.ani.second_horse_19230`, a horse head behind the crowd or a bent man;
   - `S3.ani.dog_or_donkey_19825`;
   - `S3.tree.willow_crown_top_15520`, S3's by main point (20 px east of the seam); you may give it to S4b;
   - the two posts and the box at u 20445–20503 (v 160–252), S2's building or a small S3 shed.

## Counts (467 entities after the merge, the second pass and the frame; `check` PASS, no warnings)

| kind | n | of which |
|---|---|---|
| figures | 232 | 102 on the ground, 73 on the bridge deck, **48 on boats** (36 crew, 6 porters unloading, 6 passengers), 7 on the riverside hall's upper floor, 2 riding; 36 high, 128 med, 68 low |
| animals | 9 | 2 horses (the gate's saddled horse, the horseman's), 1 horse head (low), 5 donkeys (2 under huge sacks, 1 ridden, 1 with a bundle on the ramp, 1 balking at the barrow), 1 dog or donkey (low) |
| vehicles, land | 4 | the 串车 (set down), the hooped-load barrow, the closed sedan, the north-bank handcart |
| **boats** | **11** | under way with a sweep, towed with its mast up, long passenger, awning, lowered-mast (low), mat cabin (low), unloading, cabin boat under the arch, skiff (low), the big boat lowering its mast, moored along the south bank |
| trees | 20 | 8 willow fans, 1 old pollard, 6 shoot trees, 2 whip clumps, 1 elm, 1 bamboo clump, 1 dark shrub (or heap); 8 low |
| props | 108 | 13 on the deck, 11 on raised floors, 7 on table tops; 32 low |
| buildings | 21 | 十千脚店's riverside hall (two storeys), wing, rear hall and gate; the far-bank shops and the hall on stilts; the big hall at the bridge's foot; two mat sheds; the open shop; the north-bank tavern |
| structures | 6 | the Rainbow Bridge, the 彩楼欢门, the 杈子 barrier, the gate's fence, a tiled wall, a far-bank wall |
| roads | 3 | `S3.road.main` (the route), the tavern's forecourt, the ground in front of the open shop |
| water / grd | 2 / 7 | two reaches of the 汴河; banks |
| groups | 44 | among them 上下呼救's railing crowd (24) and 车轿相争 (13) |

**Land figures by tile** (main points, after the merge), against the plan's guess: t1 5 (about 15), t2 9 (15–20), t3 15
(25–30), t4 18 (35–40), t5 24 (30–35), t6 40 (about 40), t7 35 (35–40), t8 22 (25–30), t9 16 (20–25). The crews: 23 west
of u 18300 (river_w) and 25 east (river_e, planned 25–30). The guesses ran high west of the bridge and close over it.

`sections/rainbow_bridge/layout.json` has 232 figures, 20 trees and 171 other entities; the route runs from station
+110.35 to +179.21.

## The frame (`map/frames/S3.json`)

- **F1:** S5's origin [8248, 1565], x 77, d [31.6, −51.25], h 77, covers u 15350–20650.
- **dx_knots:** [[15500, 31.6], [16880, 47.9], [18290, 39.2], [19830, 30.4]], constant 30.4 east of 19830.
  - The seam knot is S4b's.
  - **West, 47.9:** 十千脚店's 杈子 barrier. Its foot reads −1.12 (45.8), t2's near rail foot −1.10 (46.6) and its top
    rail −1.00 (51.3).
  - **Middle, 39.2:** the tiled wall's coping −1.56 (32.8) and t5's display board −1.12 (45.6).
  - **East, 30.4:** the open shop's floor board, −1.52 (33.7) and −1.90 (27.0).
  - **Wall check:** the big hall's ridge comes out at 87.9° and the gate's east eave at 88.1°. The ramps are
    +1.19, −0.62 and −0.57 px/m per 100 px, and nothing folds.
- **Datum:** `S3.road.main:lines.centre.0` = S4b's road point (15500, 1530, est), station +110.35. The painted area's west
  corners equal S4b's east corners: sw (95.98, −4.39) and nw (81.65, 30.54).
- **The deck:** the 17 band supports (above). `deck_e`'s painted heights rise from 0 at its south foot (18810, 1090) to
  5.44 m at the crown (u ≈ 19290–19330) and fall to 0 at its north foot (20025, 396). The kit's X profile is kept in the
  frame's first question if wanted.
- **The water:** −0.7, copied from S4b with its derivation (a bound, conf low). **S3's check reading:** none possible.
  No bank face, stair, revetment or abutment foot meets the water in u 15500–20650. river_e's bounds under the far-bank
  hall on stilts are −0.86 to −1.0, which fit S4b's value.
- **Supports** from two stroke points each:
  - the riverside hall's upper floor, 3.83 m;
  - the far-bank hall's deck, 0.39 m;
  - seven table tops (0.36–4.28 m);
  - twelve boat decks and roofs: the big boat's deck 0.08 and poop 2.29, the boat under way's stern deck −0.13 and
    raised bow deck 1.12, the others −0.44 to 0.48.
- **Real-size checks:** the gate's eave 5.5 m and the hall's upper eave 7.3 m (both from est base corners); the 新酒
  pole 9.0 m; the gate horse 1.27 m and the 串车 4.5 m; the bridge 17.5 m foot to foot, 10.6 m wide, its railing 0.65 m;
  the boats 4.5–12 m (painted small); the river 16.54 m wide at u 15500 (S4b's check) and 8.2 m at u 18300.
- **Diminution and strips** (the one-scale frame is kept, rule 5):
  - painted heights: the street 152–208 px (1.0), the men at the bridge's south foot up to 230 px (1.2), the deck crowd
    95–146 px, the unloading crew 110–135 px (0.72), the open shop's interior 78–82 px (0.43), the mid-river crews
    62–90 px (0.4), the far bank west of the bridge 45–70 px (0.22–0.35) and the north bank by the bridge's north end
    81–105 px (0.5–0.7);
  - strips: the north bank east of the bridge is 5.8 m deep to the silk's top edge, and the land in front of its tavern
    1.6–2.3 m. The far bank west of the bridge is 3.9–4.7 m, and at the S4b seam 1.5 m.
- **The west seam for S2:** route point (20500, 258, est), world (149.05, 25.50), station +179.21, dx 30.4. Painted
  area east corners se (160.85, −4.39), ne (147.06, 30.54). Shores at 20500: north (20500, 310, est), south (20500, 1235,
  est); bank tops (20500, 300) and (20500, 1255).

## What was hard to read

- **The scan's resolution over the bridge.** About 1800 px of silk height: above zoom 3 the strokes become weave. Every
  unit read crowds at zoom 1.6–2.6 on contrast-stretched crops and placed points at zoom 3. Most deck feet are `est`:
  - the leaners' feet sit a step behind the railing;
  - the railing itself reads 0.65 m (bridge agent) or 1.4 m (t7's top handrail) above `deck_e`.
- **The restyle is unusable east of u ≈ 17900.** Its tiles over the bridge register at 0.07–0.16 in both runs. They draw
  a second arch, move the big boat and drop its crew, and paint the moored boat as roofs. Nothing east of the
  open ground was named from it.
- **The deck's far edge isn't painted.** It is where the south ramp's crowd meets the upstream water, 696–776 px west of
  the near edge at the same v. So 35 entities that look like the bank's stand on the ramp at H 1–5 m.
- **The 彩楼欢门:** about 18 overlapping poles and three bound spires. The tops are good to ±5 px; the feet are lost in
  the tiers.
- **Bows and sterns:** fixed on the towed boat (tow line to the trackers) and the big boat (windlass at the bow, rudder
  and poop at the stern). The far-bank boats follow by their gear. The mat-cabin boat and the moored boat stay `low`.
- **One boat or two:** the setup's two far-bank boats are one 945 px passenger boat, and the "floating timber" under the
  arch is a skiff (second pass). The cabin boat under the arch is a boat, not the bridge's underside: it has iron
  cramps, its own waterline and passengers at a railing.
- **Faint figures with two readings, kept `low` with both:**
  - the figure behind the lamp-box (or a curtain);
  - the head by the shed post (or a lidded jar);
  - the far-bank figure in a conical hat (or a lidded jar);
  - the figure behind the 新酒 pole (or tall jars);
  - the awning boat's crouching boatman (or cargo);
  - the robed back view at the ramp's foot (a woman, or a man in a pleated robe);
  - the shop's faint seated and standing figures.
- **Readings the second pass settled:**
  - the "diner seen from behind" is a basin heaped with fruit;
  - the third "donkey" is the calling man's sleeves;
  - the "head in the rigging" is a hook under the arch's rib;
  - the "light-robed man at the moored boat's bow" is a parasol's far rim.
- **The tavern's plan:** its roofs aren't projectively consistent, and no wall of the wing is painted, so every
  tavern footprint is a placeholder. The riverside hall reads as two storeys (a balcony over a pent roof), and so as
  十千脚店's 楼 (conf med).
- **Tool friction:** `overlay` writes into `gen/map/<S>/` on unknown flags; `plan.jpg` labels the datum "station 0".

## Seam notes, by the neighbours' IDs (S4b's and S2's files were not edited)

**S4b (u 15500).**
- `S4b.road.main`: S3's point 0 is S4b's point (15500, 1530), and the road matches at 0 px. S3's own reading behind the
  hall was (15500, 1240): the 5.8 m jog above.
- **S4b's biggest rafted boat** (`S4b.veh.boat_big_cabin_14928`) runs on to a bow at about (15775–15800, 670–755), with
  its waterline under the stem at about (15740, 835, est). Its sweep blade lies along its south side to the tip
  (15856, 893), and a long pole with a broom-like end runs east from its roof to about (15870, 640). A possible figure
  stands on its foredeck at (15655, foot ~720). Its sweep is at its east end, so by your rule that end is its stern
  (S4b swapped it at its merge). None of it is in S3's map.
- **S4b's lines on S3's side:**
  - a knotted pole or tasselled rope ends at (15505, 513) in open water;
  - a line from the third rafted boat's bow ends at (15592, 586) by a small grapnel-like object;
  - a small stake stands at (15465, 600–628);
  - S4b's top boat's prow is at about (15485, 88).
- **`S4b.tree.willow_15468`**'s crown spreads over S3's hall to about u 15810 (not 15600). It is not an S3 tree.
- **The river at the seam:** S3's near shore and bank start exactly at S4b's points (shore_s (15500, 896), bank top
  (15500, 915)). S3's own readings were 19 and 15 px south. `S3.grd.far_bank_seam_15500` (low) joins S4b's far-bank
  strip to the silk's top edge, and `S3.tree.willow_crown_top_15520` stands on it.
- The cross-key check (u 15200–15800) finds no same-kind duplicate under 30 px.

**S2 (u 20500).**
- **`S2.tree.dark_trunk_willow_20530`** is S2's; S3's copy was retired. t9's reading: the trunk spans 20485–20575 at the
  silk's edge, base est (20525, 1782). Its lower trunk is dark and mottled. It forks at about v 1300 into a pale
  straight limb, which crosses S3's open shop roof and moored boat to a broken end at (20383, 1085), and the main stems
  (fork at about (20560, 900–1000)). t9 reads it bare; S2 reads a willow.
- **`S2.veh.boat_mat_cargo_21055`** (the north-bank boat) is S2's with all its crew, two of them west of 20500. S3 doesn't
  record it.
- **`S3.veh.boat_moored_south_bank_19745`** is S3's whole, its east end at about (20637, 1085–1190) past the seam. S2
  must not record it. The long pole of `S3.fig.boatman_cabin_door_pole_20300` reaches over the seam to (20600, 548).
- **`S2.tree.willow_top_20552`**'s whips hang over S3's tavern and `S3.prop.small_table_20460`.
  `S2.fig.figure_by_top_willow_20590` is S2's.
- **Two posts and a box** at u 20445–20503 (v 160–252): structures_e reads them as the west bay of S2's building behind
  the willow. If S2 reads a separate small shed, its main point (about 20475) is S3's.
- **Lines:** `S3.road.main` ends at (20500, 258), its edges at (20500, 215) and (20500, 280). `S3.road.south_street_20250`
  reaches the seam at (20500, 1705, est) and may run on under S2's bottom roofs. `S3.bld.open_shop_20000`'s placeholder
  back corner (20575, 1400, est) reaches past the seam.
- The cross-key check (u 20200–20800) finds the road, the water and both banks at 0 px, with no duplicate.

## The needs in brief (`gen/expand/rainbow_bridge_needs.md`)

- **Cast:** all 232 figures from the existing 22, with **no new character required**:
  - idler 51, porter 40, robed man 26, townsman 23, carter 18, scholar 17, inspector 11, camel driver 10, hat traveller
    10, sightseer 8;
  - child 4 (scaled 0.6–0.85), bearer 3, fortune-teller 3, butcher 2, woman 2;
  - one each of child_robed, elder, official and storyteller.
- **Clips:** 54 retargets onto 15 characters, all free (`from:`/`t2m:`).
- **Optional new character:** the **boatman** (about 30 credits), modelled on the waver on the moored boat's roof
  (`man_waving_on_boat_roof_19952`, 155 px, full length), with `boatman_capped_19800` as the front reference. He would
  play S3's 36 crew, S4b's 5 and S2's.
- **New takes,** ranked (10 credits each; every figure has a stand-in that plays now):
  1. `pole_boat` (6);
  2. `work_sweep` (6, and S2's six);
  3. `haul_line` (2);
  4. `reach_over_rail` (7);
  5. `tow_walk` (5, and S2's five trackers);
  6. `wave_arms` (2);
  7. five optional: `fend_pole`, `throw_rope`, `lie_wave`, `hold_horse_neck`, `lunge_arms_wide`.
- **Animals:** 9. All the registry's gaps are free: a brown horse coat, four dark donkeys, a new `pack_bale` tack (a
  huge pale sack across a donkey), a halter-and-breeching tack, and optionally a dark-flap saddle with a tasselled
  crupper and a knotted tail.
- **Vehicles:** the 串车 (`barrow_screen(held=False)` with its own load details), the hooped-load barrow (a new hooped
  load on the barrow), the closed sedan (`sedan_chair(carried=True)`, a rounded roof if cheap) and **a new `handcart`**.
- **Boats:** 11 against the kit's presets. `grain_awning_sweep` ×3 (the boat under way with its sweep working, the
  unloading boat with a new grapnel, the moored boat); `grain_mast_towed` ×2 (towed, and lowered on a crutch);
  `passenger` ×3 (the long boat, the awning boat, the cabin boat under the arch); `passenger_mast_lowering` (the big
  boat, its house cut down); `small_awning` (the mat cabin); `small_open` (the skiff, shortened). Also a mooring post
  with a lamp box, four scene lines, and three hooks under the arch. No stair, jetty or revetment is painted.
- **Carried props, new:** `long_pole` (10 figures), `pole_buckets`, `pole_jar_bundle`, `pole_fringe_frame`, `back_sack`,
  `shoulder_sack`, `back_reeds`, `flat_basket`, `rope_coil`, `bun_plate`. Existing: `pole_baskets`, `pole_bundle`,
  `pole_bundles`, `stick`, `tray`, `back_bundle`, and S7's `hip_bag` and `bundle_small`.
- **Kit parts, new** (beyond what `song_kit`, `kit_inner_city`, `kit_outer_road`, `kit_city_end` and S4b's kit have):
  - for the riverside hall: its 平坐 balcony and side gallery under a slatted roof;
  - for the gate: a 垂柱 hanging post and a gathered striped curtain;
  - a 杈子 of crossed bars;
  - a lattice-stiffened mat awning;
  - a bottle stand;
  - a hardware pedlar's display board;
  - a goods pole hung with dough twists;
  - a vase-shaped parasol runner;
  - a heap of coiled goods;
  - a fruit-heaped basin and a shelf rack with a pot;
  - a propped board;
  - a pale bundle hung over the railing;
  - the far-bank hall's plank deck on stilts over a slope;
  - the atlas cells 腳店, 十千 and 新酒.
- **Set pieces:** the Rainbow Bridge (kit done; the map adds a third 表木, the deck's stalls, hooks under the rib, the
  clearance warning and 30 deck entities to place with `on_deck`); 十千脚店's 彩楼欢门 (new: on the gate's roof,
  18 poles, three bound spires, no flowers); the 新酒 pole with its bird vane, X-frame, bar and banner (new).
- **Trees:** 8 `willow_fan`, 6 `shoot_tree`, 2 `whip_clump`, and one each of `willow_burl`, `elm_claw`, `bamboo` and
  `leafy`.

## Against `reference/scroll/sections.md`

- **Where 十千脚店 spans:** sections.md reads it at ≈ 15500–16800. The complex is 15510–17330: the two-storey riverside
  hall (its 楼, conf med) from 15510, the wing and rear hall at 16300–16890, and the gate under the 彩楼欢门 at
  16800–17330.
- **The scaffold's tallest pole** tops out at (17230, 499), not v 300. It stands on the gate's roof, hung only with
  lashings (no flowers or lamps).
- **The lamp-box** at ≈ 17000 is confirmed (17003–17068): 腳店 on its front, 十千 on its east side.
- **"A rider on a horse at the gate":** the horse is saddled and **riderless**, its head down at the west; nobody holds
  it.
- **The 串车 (pin 24, ≈ 17550)** spans 17440–17790 in the open ground, its front east, set down with no animal. 余辉's
  cursive-screen load can't be confirmed: the strokes are dense loops (writing, or ropes and sticks).
- **新酒 (pin 23)** is on the banner (17428–17562); its pole stands at 17605–17630, and its bar is tied into the
  scaffold.
- **饮子 (pin 22, ≈ 18500):** the twin parasols at 18538/18606 with a small hanging signboard, illegible □□. The west
  stall's bowls are the other candidate.
- **Pin 25 (河边泊船 (纤夫), 15690)** falls on the boat under way. The five trackers are at 16333–16423, and their towed
  boat at about 15960–16230.
- **The big boat's bow is west** (19518): the windlass, the poling crew and the squared bow are there, and the rudder
  and poop at the east end. The setup's "bow ≈ 20450" was the stern.
- **The "boats" unloading at the south bank are one boat,** with a mat-covered stern half. The far bank's
  "16380–16700" and "16600–17300" boats are one long passenger boat. A fourth boat in river_e's range, the cabin boat
  under the arch, is new, and so is the skiff.
- **Pin 21 (虹桥边的小酒馆, 19990):** the tavern's west corner is at ≈ 20055, and **its tables are empty.**
- **The bridge** fits (south foot ≈ 18810, arch 18815–20025), and so does 车轿相争 (the sedan at 18713–18798, the
  horse at 19015–19195, facing west). The sedan holds no passenger. The deck's width lies across the picture, which
  sections.md doesn't say.
- **The dark-trunked tree** stands at ≈ 20525, past the seam (S2's), not 20330–20420.

## Questions for the lead (the frame's `questions` and the units' flags)

The frame carries nine questions, the deck first. The others are the receding direction, the S4b route jog, the far
bank at the S4b seam, the water, the far bank's face, the diminution and strips, and the `plan.jpg` quirk. Beyond them:
- the area kit's name (above);
- the restyle over the bridge (u 18700–20656) is not usable even for reference images or character crops. Smaller
  tiles or the overview as a colour reference only is a config or prompt change, so it is your call and the user's;
- the stale `what` on `S3.bld.open_shop_20000`.
