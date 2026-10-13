# S7 `city_end` (u 815–2000): Run 1 report

Round 2 mapping, 2026-10-12. Restyle, map, frame, layout and needs are done; Run 2 (build) waits for the lead.

**Files:** `map/strokes/S7.json`, `map/frames/S7.json`, `map/world/S7.json`, `map/text/S7.md`; `gen/map/S7/` (brief,
parts, reports, `merge_fixes.mjs`, `merge_notes.md`, `second_pass/all.json`, `overlay_815_2000.jpg`, `plan.jpg`);
`sections/city_end/` (`section.json`, `notes.md`, `layout.json`); the restyle in `gen/sections/city_end/`;
`gen/expand/city_end_needs.md`, `gen/expand/city_end_lessons.md`.

## Counts

| kind | n | of which conf low |
|---|---|---|
| figures | 17 | 1 (`face_at_gate_door_1251`: a peeking head or a small lamp) |
| animals | 3 (the official's horse, a crow on a roof, a pale shape) | 1 (`pale_shape_1905`: an animal or a mat) |
| trees | 9 | 1 (`gnarled_low_edge_875`: a tree or a rock) |
| props | 20 | 2 (`leaning_panel_1812`, `stones_fence_foot_945`) |
| buildings | 9 | 1 (`far_gable_1345`) |
| structures | 5 | 1 (`box_shed_1855`) |
| roads | 1 (`S7.road.main`) | |
| groups | 6 | |
| vehicles | 0 | |
| **boats** | **0** (no water in S7) | |

70 entities. `check` PASS with no warnings. The units gave 71 (t1 16, t2 38, structures 17); the merge added two things
each unit had left to the other (the 解 eave's leaning poles, the stones at the railing's foot) and retired one
duplicate (the gate passage's partition, t1's prop = the gate hall's part): 72. The second pass retired two (t1's
"peaked box" = the east gate block's strokes; the "second child" = robe folds): 70. Figures came in well under the
lead's estimate (t1 expected 12–18 and has 6; t2 expected 20–25 and has 11): both tiles walked their range twice.

## The frame

- Seed kept: origin (8248, 1565), 77 px/m across and in height, 51.25 px of v per metre of depth, covers u 800–2150.
- **Knots `[[1250, 59.9], [2000, 50.4]]`.** The seam knot is S6's. The west knot is the one deviation from the seed:
  it rests on the only two ground-level receding edges in S7, both on the gate's blocks (the west block's foot, traced
  from the pixels, −0.870, dx 58.9, weight 2; the east block's top edge, −0.82, dx 62, weight 1). The west block's
  foot alone scatters about ±12 px/m. With the knot the block's face comes out at 86.9° (79.9° with 50.4 kept
  constant). Dropping it moves the gate area about 1.6 m east at the north edge (D 13 m). Between the knots dx is
  linear; west of 1250 it is constant. No ground-level edge in the middle or east holds up; S6's 解 board feet just
  east of the seam read 59.6 and agree with the west knot. High lines are steeper (dx 41–53), the opposite of S4.
- **Datum:** `S7.road.main:lines.centre.3` = scan (2000, 1180), station −73.63 (S6's first route station). West end:
  `lines.centre.0` = (815, 1100) est, world (−103.59, 9.07), station −91.25.
- **Painted area** (`layout.json`): se (−78.27, −4.39) and ne (−101.13, 30.54) are S6's sw and nw exactly; sw
  (−93.12, −4.39), nw (−120.29, 30.54).
- **Supports:** `ground`; `carried in arms` H 0 (the child on the lap); `roof: S7.bld.hall_ns_1620` H 3.2 m (the crow,
  at the mid-depth of the hall's placeholder footprint, between its eave ≈ 2.3 m and ridge ≈ 3.5–3.9 m);
  `animal S7.ani.horse_official_1625` (the rider). **Water:** none.
- **Real-size checks:** west block 0.79 × 0.61 m, east block 0.56 m tall, gate lintel 3.23 m, gate bay 3.16 m, 赵太丞家
  front 4.12 m and eave 3.90 m (S6's corner shop gave 4.1 on the same frame), 解 eave 2.74 m. **Diminution:** none
  across the street (adults 167 px on the north margin, 175 in the street, 25 % spread within each band): the
  one-scale frame holds.

## What was hard to read

- **The cut edge:** the collectors' seals cover u 815–905, v 600–960, including the old willow's foot and the
  railing's west end. Read in the red channel: one willow trunk only; the restyle's second trunk is the seal's border.
- **The official's horse:** only a pale, uncoloured, ink-outlined oval (its hindquarters), a crupper, a fringe under
  the saddle and one foreleg show; the small gate roof, the groom and the bearer hide the rest. Facing east from the
  rider's boot and the groom. Its head is est (and may be the pale mass just east of the groom, needs list).
- **The gate:** a small dark-topped shape at the open door leaf is either a peeking head or a small lamp (kept as one
  figure, conf low, both readings); the east block shows only its front-west corner between the food box and the sack.
- **The well's west end:** a pale rounded mass behind the water carrier is an animal with its head down or a mat, cloth
  or the wall's foot (conf low); the box-like structure behind it is a shed or a set-down chest (conf low).
- **Writing:** the board characters (about 15 px) don't resolve on the scan; the three free-standing boards are □. The
  name is four lozenge tablets (zoom 5–8, sharpened greyscale), and the fixed board reads 五勞七傷□□□.
- **The south side:** three overlapping roofs (the small gate roof, the hip-gable building, the 解 building) with no
  wall or post visible except one 解 eave post; their order comes from occlusion, and every south footprint is a
  placeholder. The street's south edge stays at S6's v 1300; the hidden walls may make it up to about 5 m deeper at
  u 1640–2000.
- **The roof stack at the top:** six roofs sorted by their ridges; all footprints are placeholders (one stated rule),
  and with the west knot their est back corners come out 2–6° off square: the builder squares them as `choice:`.
- **The bottom edge:** bare twiggy tree tops and shoot masses rising from below the silk's edge; one trunk only.
- **The tub under the 解 board:** 135 px with a lattice lid, or about 2.7 m painted up to the bar with a slatted screen
  reading: the strokes don't settle it (a builder's choice).

## Seam notes, by S6 ID (for the lead; S6's files are not edited; details in `gen/map/S7/merge_notes.md`)

- **`S6.road.main`:** `S7.road.main` meets it exactly: centre (2000, 1180), `edge_n` (2000, 800), `edge_s` (2000,
  1300). `edge_n` v 800 stands (the line at v 787–797 from u ≈ 1898 is the top of the pale mass). `edge_s` is where
  the figures stop, not a wall: the 解 building's north wall is hidden at about v 1575, so the street may be up to
  about 5 m deeper at u 1640–2000 (S6 asks the same about its south houses).
- **`S6.prop.mat_awning_2000`:** the posts at u 1918–1936 are the 解 building's east eave post (u 1922–1941, eave
  v ≈ 1517 to its foot est v ≈ 1728), not the awning's. The mat's west end is at u ≈ 1855–1860 (S6 has 1870), its
  south-west corner on the 解 roof's north-east corner (2000, 1360). No awning post stands west of u 2000.
- **`S6.prop.jie_signboard_2085`:** its top edge leans on the 解 building's east eave at (1940, 1459)–(1996, 1400). The
  bar carrying the 解 plaque starts at the 解 building's post (u ≈ 1942) and runs east to u ≈ 2062: the plaque is that
  building's sign. Proposal: keep bar and plaque in S6's entity (S6 builds them), with the bar's west end fixed to
  `S7.bld.jie_building_1800`'s post at about (1935, 1522). The 解 character is on the plaque (u 2005–2058): nothing of
  it is S7's.
- **`S6.bld.house_well_2020`:** its eave and tile-end discs start at u ≈ 1963–1967 (v 655–668), not 2020; plain silk
  runs west to u ≈ 1920, perhaps its wall. The "small dark sloping roof (1880–1960, v 735–805)" in its note is
  `S7.str.box_shed_1855`. Its "wall foot" line at v 795–800 is the top of `S7.ani.pale_shape_1905` west of the seam.
- **`S6.str.square_well_2000`:** the platform's front edge (v ≈ 998) reaches west to u ≈ 1903 (structures) or shows
  planks only from u ≈ 2007 (t2: the spot under the 1950 bucket is covered). Two S7 buckets stand on its west end
  (`ground: on S6.str.square_well_2000`), one at its front-west corner, a fourth at the carrier.
- **`S6.bld.far_house_1859`:** its west gable shows at u ≈ 1800–1880 (apex (1825, 12)); nothing of it west of
  u ≈ 1795. Agrees with S6.
- **`S6.tree.needle_tree_2025`:** S7's needle trees at 1910 and 1955 are separate trees (their own crown tops; 1955 its
  own culm), the west end of S6's bamboo grove.
- **`S6.tree.willow_2330`:** its bare crown covers u 1820–2000, v 230–740; no S7 trunk under it.
- **`S6.fig.crouching_dark_2028`, `well_bucket_lifter_2032`, `itinerant_monk_2078`, `S6.str.fence_far_2000`:** no S7
  entity duplicates them; every S6 figure near the seam has its foot at u ≥ 2028.
- **S6's list of S7 things not yet mapped** (`map/index.md:75`) is all mapped: the three buckets (plus a fourth), the
  tub, the man with a bundle, the 解 building (the "corner building" is its north-east end), the needle tree (plus a
  second), the figures at u 1850–1900 (`walker_bag_1885`, `bucket_man_1872`).
- **The frame at the seam:** S6's west value 50.4 was set mostly from high lines; its own ground edge at the seam (the
  解 board feet) reads 59.6. A re-read of S6's west end could raise the seam knot.

## The needs in brief (`gen/expand/city_end_needs.md`)

- **Cast:** all 17 figures from the existing characters (idler 3, inspector 2, townsman 2, woman 2, child 2, robed_man,
  scholar, camel_driver, porter, fortune_teller, hat_traveller). No new character is required; one is worth making if
  credits allow: the broad-hatted official (`official_rider_1610`), whom hat_traveller plays loosely meanwhile.
- **New takes (10 credits each):** `sit_hold_child` (woman), `examine_child` (fortune_teller), `point_way` (scholar);
  optional `lean_post_talk` (idler) and `walk_hold_chest` (inspector). Free retargets: sit_talk, bridle, carry_pole,
  hand_over, point, look.
- **Animals:** horse_white with a new tack variant (crupper, a long fringe under the saddle, bridle and reins; 0
  credits); the crow (bird) perched on a roof slope; the pale shape waits for the lead.
- **Carried props:** new `folded_parasol`, `food_box`, `pole_hooks`, `hip_bag` (shared with S6's five), `bundle_small`;
  placements: a big `back_bundle`, the `staff` on the shoulder, `child_on_lap`, an optional riding stick.
- **Kit parts:** the four lozenge tablets and a `signs_city_end` atlas (趙 · 太 · 丞 · 家, 五勞七傷□□□, three boards of
  □), single-post free-standing signboards with splayed or curled feet, a medicine rack, a Song armchair, a tilted
  lattice stand, the gate hall's plain open door leaf and low partition, the main hall's patterned curtain front, a
  roof vent, the 解 building's post-and-bar arm, the tub's lattice lid and ring, tall hooped buckets with bails and lids,
  a braced stand, a leaning reed panel. The rest comes from `song_kit` and the finished areas' kits.
- **Trees:** a new form `willow_weep` for the cut-edge willow (its whips hang), elm_claw 2, shoot_tree 2, whip_clump 2,
  bamboo 2. No set pieces, vehicles or boats.

## Against `reference/scroll/sections.md`

- **The 解 sign and its ring are in S6** (u 2030–2340), not in S7 (settled before Run 1; the plaque is at u 2005–2058).
- **赵太丞家's name is four lozenge tablets, 趙 · 太 · 丞 · 家,** not one board. The board fixed to the shop front reads
  五勞七傷□□□. 治酒所伤真方集香丸 is not legible anywhere on the scan; it would be on one of the three free-standing
  boards, whose characters don't resolve.
- **"Two women bring children": two women and one child.** The faint second child is robe folds (second pass).
- **There is no "man at the door"** of the shop; the doctor (or his assistant) is the only man in it, his armchair empty
  behind him. No faces at the gatehouse windows either.
- **The official does not ride "out":** he and his retinue move **east**, toward S6, and the group spans u ≈ 1440 (the
  folded object reaches 1353) to 1775, not 1560–1780.
- **门房指路:** the seated man by the fence (the map's gatekeeper) talks to a man leaning at the post; the visitor with
  the food box is pointed the way by a man in a dark cap standing in the gate's east bay.
- **The willows and the cut edge:** one old willow at the cut edge (one trunk; its whips hang). The bottom of the silk
  holds bare trees and shoot masses, not willows.
- **The "corner building"** at the 解 board is the 解 building's north-east end, and the posts S6 gave the awning are its
  eave post.

## Questions for the lead (the frame's `questions` and the units' flags)

1. Keep the west knot 59.9 (two short edges, ±12 px/m), or S6's 50.4 constant (the structures agent's lean)?
2. S6's west value: re-read from ground-level edges (its 解 board feet read 59.6)?
3. The street's south edge at v 1300 against hidden walls up to about 5 m further south: room to walk is a build-time
   choice.
4. `SILK_BOTTOM` 1790 in `tools/map_layout.mjs` against the silk's bottom edge at v ≈ 1770 (1761 at u 815–1140); the cut
   edge is at u 808–820, leaning east toward the bottom.
5. The seam notes above, to apply in `gen/map/S6/merge_fixes.mjs` (unchanged in `gen/map/S7/merge_notes.md`).
6. The conf-low readings that decide a model: the pale shape, the head or lamp at the gate door, the low gnarled form,
   the box shed, the tub's height; and whether the free-standing boards show the scholars' text or illegible marks.
7. `characters/woman.json`'s model crop is S7's doctor, not a woman (needs list, "For the workshop's record").
