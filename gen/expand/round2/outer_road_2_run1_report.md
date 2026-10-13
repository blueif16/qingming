# S4b (`outer_road_2`, u 12600–15500): Run 1 report

Round 2's mapping workflow, 2026-10-12. The steps were setup (restyle and tile brief), nine units (t1–t5,
structures_w, structures_e, river), merge, two second-pass agents, frame and layout, then needs. The brief is
`gen/expand/round2/brief_outer_road_2.md`. The run is recorded in:
- `gen/map/S4b/merge_notes.md`;
- `gen/map/S4b/reports/*.md` (every unit, and `frame.md`);
- `sections/outer_road_2/notes.md`.

The needs list is `gen/expand/outer_road_2_needs.md`, and the lessons are in `gen/expand/outer_road_2_lessons.md`.

## For the lead first

1. **The receding direction at the seam reads outside 31.6 ± 5 on both sides of the road, in opposite directions.**
   The frame keeps `dx_knots [[12600, 31.6]]`, constant across S4b, as a stated assumption. Your call: a ramp inside
   S4b, re-knotting part 1, or keeping it (details under "The frame").
2. **The water level is a bound, not a measurement:** H −0.7 (conf low; plausible −0.3 to −0.75). S4b's moorings have
   no vertical face, stair, revetment or jetty. S3, S2 and S1 copy it.
3. **Six boats, not four or five.** The biggest runs to u ≈ 15855, into S3's range; it is S4b's by Phase 0. All bows
   are at the bank.
4. **The boat factory's inventory** (`gen/boats/types.md` #1–#5) disagrees with the map:
   - #3 and #5 put the stern at the bank;
   - #1 reads "bow east";
   - #4 is two hulls (the mat-cargo boat and the arched-awning boat).
5. **The rafted boats' centre lines are 1.8–3.9 m apart** in the frame, under every kit beam. The pilot's "shorten,
   then move outward" rule will move them.

## Counts (222 entities after the merge, the second pass and the frame; `check` PASS, no warnings)

| kind | n | of which |
|---|---|---|
| figures | 66 | 61 on land; **5 crew on boats** (2 high, 1 med, 2 low); 21 high, 25 med, 20 low |
| animals | 10 | 2 oxen (the second cart's team), 2 horses (one saddled, one small), 1 donkey, 4 pack mules (1 low), 1 bird |
| vehicles, land | 3 | 2 palm-covered carts (大棕盖车), 1 sedan chair set down |
| **boats** | **6** | 5 rafted bows-to-the-bank (big cabin, arched awning, mat cargo, long cabin, round mat), 1 along the far bank |
| trees | 13 | 7 willow-like, 2 elm, 2 straight elm-like, 1 young tree, 1 stump; 7 low |
| props | 71 | 36 low |
| buildings | 24 | |
| structures | 3 | the tea house's platform, the bank shed, a reed fence |
| roads | 3 | `S4b.road.main` (route), the open square north (the first crossroads), the top street |
| water / grd | 1 / 2 | the 汴河's reach; the near and far banks |
| groups | 20 | |

The units' density guesses ran well above the strokes:
- t1 guessed 30–35 figures and found 14;
- t4 guessed 20–25 and found 10;
- t5 guessed 10–15 and found 4;
- the crowd was guessed at 15–20 and counts 13.

`sections/outer_road_2/layout.json` has 66 figures, 13 trees and 123 other entities.

## The frame (`map/frames/S4b.json`)

- **F1:** origin [8248, 1565], x 77, d [31.6, −51.25], h 77, covers u 12450–15900 (out to the big boat's stern), with
  **dx_knots [[12600, 31.6]]**: part 1's seam knot, unchanged.
- **Datum:** `S4b.road.main:lines.centre.0` = scan (12600, 1206), **station +67.95**. The route's second point comes
  out at station 69.98, against S4's 69.97. The `painted_area` corners sw (58.32, −4.39) and nw (43.99, 30.54) are
  exactly part 1's se and ne.

**The nearest ground knots to the seam** (dx = −51.25 / slope):

| group | u | edges | mean dx | stroke points |
|---|---|---|---|---|
| north side, receding up-left | ≈ 12940 | 6 | **−57** (−51 to −62) | the official hall's stair rails less the 0.45 m floor, (12605, 844)→(12677, 939) and (12564, 848)→(12650, 957); table_13010 (13036, 898)→(13074, 936) and (12952, 912)→(12976, 936); table_13205 (13145, 907)→(13173, 932); the counter (13217, 953)→(13253, 983) |
| south side (bottom shop), receding up-right | ≈ 12810 | 5 | **+97** (+77 to +119) | (12687, 1639)→(12663, 1652), (12790, 1550)→(12907, 1480), (12795, 1590)→(12870, 1540), (12820, 1482)→(12887, 1450), (12780, 1557)→(12890, 1510); part 1's high lines east of 11420 (+84 to +91) agree |
| tea house | ≈ 14500 | many | −68 (median; −36 to −122) | `reports/structures_e.md` |
| others | | | | the wheel on the ground −27 (low); the top-street tables +71/+75; the open square's edges −8 to 0 (est) |

**What each option does** (`scratchpad/S4b_frame/knot_options.mjs`; a constant dx gives 1.30 m per 100 px of u on
every row):

| option | road | silk top | effect |
|---|---|---|---|
| A: 31.6 constant (kept) | 1.30 | 1.30 | both seams hold |
| B1: ramp to −57 by u 12940 | ×2.8 | ×8.8 | stretches |
| B2: ramp to +97 by u 12810 | folds | folds | every row north of the road folds |
| B3: slow ramp to −57 at 15500 | ×1.2 | ×1.9 | S3 would start from −57 against its own +46 to +51 |
| C1: re-knot part 1 to −57 | | | part 1's built east end moves 8 m at the road, 35 m at the silk top |
| C2: re-knot part 1 to +97 | | | part 1's top rows fold |

With dx 31.6, the north side's furniture maps skewed 49–52° and the bottom shop's 40°. Builders square furniture to
its hall as a recorded choice. To change the frame, edit `dx_knots`, then run `node tools/scroll_map.mjs S4b all` and
`node tools/map_layout.mjs S4b`. Any change also moves the seam knot that S3 seeds from.

**The water level:** H **−0.7**, conf low. It is the river agent's bound, H = −Δv/77 where flat ground meets the first
water:
- M1, the bank path at the gangplank: (14778, 401) over (14778, 456), −0.71;
- M2a, the top-left building's wall foot: (14920, 166) over (14920, 224), −0.75;
- M2b, the same wall foot: (14990, 151) over (14990, 203), −0.68.

The spread is 0.07 m. A sloping landing puts the water higher than the bound: −0.3 if the landing is 1 m deep. S3's
river_e bounds (−0.86 to −1.0) fit. 1 m of error in H moves boats and shores 1.5 m north or south. This replaces the
seed's −1.5.

**Other supports**, each from two stroke points:

| support | H (m) | note |
|---|---|---|
| big boat's deck | 0.03 | freeboard 0.73 |
| big boat's roof | 1.39 | |
| arched-awning boat's deck | 0.14 | est |
| long boat's deck | −0.12 | est |
| tea house floor | 0.18 | |
| official hall floor | 0.45 | part 1's choice |
| bank top, far bank | 0 | assumed |
| the first cart's bed | 0.71 | |
| three table tops | 0.56, 0.82, 0.63 | |
| the bird's perch in `S4.tree.willow_12588` | 5.29 | |

**Checks:**
- eaves on the road 2.3–3.1 m;
- up the silk 1.45, then 0.9–1.0 m (the painter's diminution);
- the big boat's hull 12.3 m between its waterlines;
- the river 16.5 m wide at u 15500;
- figures 170 px on the road, 150 at v 640–690, 99 at v 490–550, 57–69 on the bank at v 400. They shrink faster up
  the silk than S4's.

**Open frame questions:**
- the far shore's est line maps 0.3 m north of the far bank's top;
- the road east of u 15215 is est, and its end is S3's datum.

## What was hard to read

- **The receding direction** (above): furniture groups drawn from opposite sides at the same u.
- **The water:** a wash-drawn bank, with no face to measure.
- **Boat ends and hulls:**
  - every rafted hull's waterlines are hidden by its neighbours, so most `front`/`rear` points are est;
  - the arched-awning boat's west half isn't painted;
  - the bow/stern reading rests on the stern gear, conf med (the lead's rule settled it).
- **The crowd's seated man:** the strokes give a seated man bending over goods on a mat, with no awning, table or
  sign of his own. Storyteller, fortune-teller or pedlar stays open.
- **Shapes over heads:**
  - `porter_tall_load_13402`: a tall back load with a T-stick, or a tall hat with a stick;
  - `man_frame_or_hat_15125`: a chair or rack on his back, or a very wide hat with a veil.
- **The restyle invented most where the brief warned:**
  - on the bank by the boats: sacks and a seated man on a stern, a kneeling figure, three extra people;
  - on the boats: a second roof sitter, a mast and a crewman on the top boat;
  - in the horse group: a donkey, and a horse's tail and head, painted as bending men;
  - at the wheelwright's: a second man and a saddled mule;
  - in the trees: every willow leafed.
- **Faint things kept `low` with both readings:**
  - the dark figure or hung robe at the official hall;
  - two dim heads on its lintel (retired at the second pass: a hung lamp or pot);
  - the stump on the bank;
  - the bundle heaps behind the long hall's ridge;
  - the far-bank trees;
  - the fourth pack mule.
- **Tool friction:** the fixed 3× grid view in `scroll_inspect.mjs`; zsh's word splitting; `overlay` writing into
  `gen/map/<S>/` on any unknown flag (lessons §9).

## Seam notes for the lead, by S4 ID (S4 is finished; nothing of S4's was edited)

- **`S4.bld.official_hall_12530`:**
  - **Roof:** its roof and dark valance band run on unbroken to a hipped east end at u ≈ 13385. S4b maps the bays east
    of part 1's est corner as `S4b.bld.shop_hall_13170`, which starts at the hall's est se/ne corners (12960, 975) and
    (13000, 800): **the builders must join the two roofs**. `S4b.bld.big_roof_hall_12990` behind it may be the hall's
    main roof.
  - **Floor, rail and posts:** the raised floor and railing end at about u 12930 (rail v ≈ 937–957, floor front
    ≈ 965). Front posts stand at 12795, 12836, 12852, 12895–12900 and 12978/12999, and the lintel is at v 840–845.
  - **Hanging things** (the hall's, low): a dark inverted-dome blob hung from the lintel at (12863–12882, 843–870),
    structures_w's lamp and t1's retired "head"; a small round thing at (12900–12917, 837–850); a light speck under
    the eave at (12637–12647, 780–790); a pale thing by the stair's east rail at (12597–12620, 920–960).
  - **People and props:** `S4b.fig.dark_figure_or_garment_12825` may be a robe hung on its post (low). Its people are
    `S4b.grp.hall_people_12800`, with the seated official `S4b.fig.official_seated_12728` on `official hall floor`.
    The funnel-shaped vessel at its railing is `S4b.prop.funnel_vessel_12884`.
  - **Its stair rails** gave the north side's knot evidence (dx −60/−61).
- **`S4.bld.south_hall_12350`:**
  - the "next roof east of u 12700" is this hall's own east slope. The north barge runs on to the north-east eave
    corner (12988, 1258), and the east eave runs (12988, 1260) → (12850, 1340) → (12700, 1440) with a lath band;
  - open-front columns stand at 12690–12700, 12760–12780 and 12936–12948;
  - the furniture under it is `S4b.grp.bottom_shop_12750`, including the child's table `S4b.prop.table_12645` and
    the barrel `S4b.prop.barrel_12677`;
  - a small cup or lamp hangs under the counter frame at (12647–12663, 1567–1580): the hall's, if the frame is its
    fitting.
- **`S4.tree.willow_12588`:** its crown reaches east to u ≈ 12950. No other trunk shows at 12600–12750.
  `S4b.ani.bird_12827` perches in it at H 5.29.
- **`S4.prop.parasol_12572`:** no figure stands under it east of 12600. Part 1's "small boy" is probably
  `S4b.fig.small_figure_cart_rear_12706` (low).
- **`S4.road.main`** continues as `S4b.road.main` from (12600, 1206), with edge_n 972.5 and edge_s 1484.
- **Part 1's "not yet mapped" list is all mapped:**
  - the seated official, the small boy (candidate), the big jar `S4b.prop.big_jar_12707` and the figure by the stair;
  - the table and the drum (`table_12645`, `barrel_12677`);
  - the hanging lamp (a seam note);
  - the roofs behind the pines (`big_roof_hall_12990`'s note);
  - the palm-covered cart's roof (`S4b.veh.palm_cart_13070`).
- **The cross-key seam check** against `map/strokes/S4.json` (u 12450–12750) found 0 same-kind pairs under 30 px.

## The S3 seam (u 15500)

- **Route point** for S3's datum: `S4b.road.main`'s last centre point, scan (15500, 1530) est (conf low). It is world
  (93.90, 0.68), **station +110.35**, with **dx 31.6** there. Reading b: the road bends south-east past the long hall's
  east gable. The lead's reading (c) for S3 sets S3's point 0 here.
- **Painted area:** S3's west corners must equal S4b's se (95.98, −4.39) and ne (81.65, 30.54).
- **Water:** H −0.7. Near shore (15500, 896) est → (88.39, 14.11); near bank top (15500, 915) est → (88.98, 12.68);
  far shore (15500, 112) est → (82.12, 29.40); far bank top (15500, 75) est.
- **S4b's things that cross the seam:**
  - `S4b.veh.boat_big_cabin_14928`: its after cabin u 15500–15805 (eave tip (15805, 685)), railings 15640–15760, stern
    (15745, 865) est, sweep blade to (15855, 897), spar to ≈ 15865. S3 must not record it; S3's t1 "bow at
    (15790, 670–755)" is this cabin's eave;
  - `S4b.tree.willow_15468`: its crown reaches over S3's riverside hall to about (15720, 790). S3's t1 calls it
    `S4b.tree.willow_15470`, which does not exist;
  - `S4b.bld.south_hall_diagonal_15242`: north peak (15500, 1304), north barge to (15589, 1422), est NE corner
    (15650, 1600);
  - `S4b.bld.house_behind_willow_15414`: it abuts S3's riverside hall at u 15511–15520;
  - the arched-awning boat's anchor line, to a splash at (15580–15607, 577–590);
  - the mat-cargo boat's looped line, to (15487–15507, 503–513).
- **S3's, not recorded by S4b:**
  - the boat under way at u 15560–15900 with its crew;
  - the far-bank willow whips past 15490 (trunk est (15520, 70));
  - the bare willows with trunks at about 15690 and 15800.

## The needs in brief (`gen/expand/outer_road_2_needs.md`)

- **Cast:** all 66 figures from the existing 22, with **no new character**. Idler 13, scholar 10, porter 9, robed man
  8, townsman 6, sightseer 4, child 3 (scaled 0.5–0.8), carter 3, inspector 3, hat traveller 3, and one each of the
  official, storyteller, child_robed and camel driver.
- **Clips:** 20 clips to add, all free local retargets. Optional new characters: a boatman for the whole river (model
  from S3 or S2) and a dark-hat variant of the hat traveller.
- **New takes,** ranked (10 credits each):
  - the wheelwright hammering a wheel lying on the ground;
  - a man seated on the ground showing goods to a crowd;
  - reaching up to a cart's load;
  - six optional ones with fallbacks.
- **Animals:** 10. The registry needs a dark horse coat with a dark-cloth saddle, a girth-only horse tack, a dark
  donkey, a dark heaped pack load for the mule, and optionally long horns on the lead ox. All of it is free (tone,
  tack and body_from).
- **Vehicles:**
  - a **palm-thatch variant of `covered_ox_cart`** for the two 大棕盖车, one unhitched and one with a shaft ox and a
    lead ox;
  - the existing `sedan_chair(carried=False)`.
- **Boats:** 6 against the kit's presets:
  - big cabin: `passenger` boards;
  - long cabin: `passenger`, short cabin;
  - arched awning, mat cargo and round mat: `grain_awning_sweep` variants;
  - small cabin: `small_awning`.

  Also the mooring post, the gangplank and two anchor lines. No stair, jetty or revetment is painted.
- **Carried props, new:** a mallet, an open sack, a lidded basket, a cloth bag, a tall back bundle with a T-stick, and
  a chair or rack carried on the back. Existing: `pole_baskets`, `pole_bundle`, `stick`.
- **Kit parts, new:**
  - chairs (none in any kit);
  - the pole frame with its hanging basket;
  - a timber pile;
  - a shallow round sieve-basket;
  - a two-tier stall;
  - a fan-shaped thatch shade on a post;
  - long low straw heaps;
  - a funnel-shaped vessel;
  - a big jar;
  - a mooring post;
  - the tea house's fringed mat front canopy and open king-post gable;
  - a roof hatch;
  - diamond and lattice-textured tiles;
  - the south-row hall type lifted into a shared function.
- **Set pieces:** none of the named ones.
- **Trees:** 7 `willow_fan`, 2 `elm_claw`, 2 `slender`, 1 `shoot_tree`, and 1 stump (a new form, better solid than a
  card).

## Against `reference/scroll/sections.md`

- §2 S4, "the river leaving the top of the frame ≈ 14500–15000": in S4b the water does not reach the silk's top edge
  (conf low). Land lines the top from u 14850 to 15560: a faint far bank with a shed and bare trees at v 15–90.
- "Riverside moorings ≈ 14400–15700": the moored boats run from the post (14737) to the big boat's stern (≈ 15855).
- "A crowd around a seated man under an awning (≈ 13100–13450)": 13 people. He has no awning of his own; the cover is
  the big roof's east end with a mat strip hung from it. Storyteller (Hansen pl. 17–18), fortune-teller or pedlar
  stays open: no table, sign or fan is drawn, and goods lie on a mat before him.
- 车铺劳作 (pin 26, 13620): confirmed. One wheelwright bends over a wheel lying flat at u 13560–13760, with a possible
  second man watching (low), timber, leaning shafts and a pole frame with a hanging basket.
- 豪车云集 / pin 27 大棕盖车 (13120): confirmed. There are two palm-covered carts (one unhitched at 12672–13073, one under
  way at 12911–13463 with two oxen) and a sedan chair set down beside them.
- 小铺闲坐 and 客家登船 (余辉's list, hints only): the tea house's open hall with seated customers (u 14147–14930) fits
  小铺闲坐. The porter stepping down the gangplank onto the mat-cargo boat (facing 330, loading or boarding) and the man
  pointing at the boats fit 客家登船 (unconfirmed).
- The lead's first look read four rafted boats, sterns to the bank. The map has five rafted, bows to the bank, plus
  one along the far bank.
