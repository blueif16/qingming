# S4b frame agent: report (2026-10-12)

Role: frame (rules `gen/expand/round2/mapping_rules.md`; brief `gen/expand/round2/brief_outer_road_2.md`). Files written:
`gen/map/S4b/merge_fixes.mjs` (section 7 and the frame's support fixes), `gen/map/S4b/merge_notes.md` (section
"Second pass and frame"), `map/frames/S4b.json`, and, through the tools, `map/strokes/S4b.json`, `map/world/S4b.json`,
`map/text/S4b.md`, `gen/map/S4b/plan.jpg`, `gen/map/S4b/overlay_12600_15500.jpg` and `sections/outer_road_2/layout.json`.
Scripts and crops are in `scratchpad/S4b_frame/` (`knot_options.mjs`, `south_furn.jpg`, `platform.jpg`, `ov_dense.jpg`,
`ov_moorings.jpg`).

## First, for the lead: the receding direction at the seam is outside 31.6 ± 5

The nearest ground evidence reads outside 31.6 ± 5 on **both** sides of the road, in **opposite** directions. dx is
−51.25 / slope.

- **North side, by the seam** (furniture and the stair, receding up to the LEFT). Mean **−57** at u ≈ 12940 (6 edges,
  −51 to −62):
  - `S4.bld.official_hall_12530`'s stair rails, less the 0.45 m floor: (12605, 844)→(12677, 939) and
    (12564, 848)→(12650, 957), ground slope +0.83/+0.86, dx −61/−60;
  - table A (`S4b.prop.table_13010`): (13036, 898)→(13074, 936) and (12952, 912)→(12976, 936), both +1.0, dx −51;
  - table B (`S4b.prop.table_13205`): (13145, 907)→(13173, 932), +0.89, dx −58;
  - the counter (`S4b.prop.table_bowls_13275`): (13217, 953)→(13253, 983), +0.83, dx −62.
- **South side, by the seam** (the bottom shop under `S4.bld.south_hall_12350`'s east eave, receding up to the RIGHT,
  shallow). Mean **+97** at u ≈ 12810 (5 edges, +77 to +119):
  - (12687, 1639)→(12663, 1652): −0.54, dx +95;
  - (12790, 1550)→(12907, 1480): −0.60, dx +85;
  - (12795, 1590)→(12870, 1540): −0.67, dx +77;
  - (12820, 1482)→(12887, 1450): −0.48, dx +107;
  - (12780, 1557)→(12890, 1510): −0.43, dx +119.

  Part 1's own high lines east of 11420 agree with this side: −0.56 to −0.61 (+84 to +91), and the hall's ridge gives
  +92. I re-read this group on a zoom-2.5 crop (`south_furn.jpg`).
- **Further east:**
  - the tea house's platform and furniture: median −68 at u ≈ 14500 (−36 to −122);
  - the wheel on the ground: −27 (low);
  - the top street's tables: +71/+75;
  - the open square's edges, the one north-running large line: almost upright, −8 to 0 (est).

Every option that puts a measured value into the knot list breaks the plan. `scratchpad/S4b_frame/knot_options.mjs`
computes world X along silk rows; a constant dx gives 1.30 m per 100 px of u on every row.

| option | knots | road (v 1206) | silk top (v 20) | S4 part 1 |
|---|---|---|---|---|
| A, kept | 31.6 constant | 1.30 m/100 px | 1.30 | unchanged |
| B1, ramp in S4b to the north side | 31.6 at 12600, −57 at 12940, −68 at 14500 | up to 3.67 (×2.8) | up to 11.5 (×8.8) | unchanged |
| B2, ramp in S4b to the south side | 31.6 at 12600, +97 at 12810 | **folds** (−1.5) | **folds** (−10.9) | unchanged |
| B3, slow ramp to the north side | 31.6 at 12600, −57 at 15500 | ×1.2 | ×1.9 | unchanged; hands S3 −57 against its own +46 to +51 |
| C1, re-knot part 1 to the north side | S4: 31.6 at 11420, −57 at 12600 | ×1.5 in S4 | ×3.3 in S4 | built east end moves 8 m (road) to 35 m (silk top) |
| C2, re-knot part 1 to the south side | S4: 31.6 at 11420, +97 at 12600 | ×0.6 | **folds** in S4's top rows | built east end moves |

So the frame keeps the constant 31.6. Both seams hold, nothing folds, and the furniture's orientation becomes a builder
choice: with dx 31.6 the north side's furniture maps skewed 49–52° west of north, and the bottom shop's 40° east of
north. Changing it is one edit of `dx_knots`, then `node tools/scroll_map.mjs S4b all` and `node tools/map_layout.mjs S4b`.
Any change also changes the seam knot that S3 seeds from (u 15500).

## The second pass: accepted and declined (`merge_fixes.mjs` section 7, reasons in its comments)

| proposal | decision | why |
|---|---|---|
| W1 `prop.slatted_crate_12819` (med) | accepted | Nothing recorded it. On `z2_crate.jpg` the slatted box is drawn over the horse's back, apart from the rack west of the post. |
| W2 `prop.funnel_vessel_12884` (low) | accepted | It was named only as "the table" in a figure's what (rule 6). On `z2_trough.jpg` and `z2_lintel.jpg` there is a rim and a narrowing body. Support `official hall floor`; the reading of it on its own stand is in its note. |
| W3 `prop.bench_13200` | accepted, **raised to med** | On `z2_benches.jpg` the slanted plank stands on its own legs, separate from the counter's top with the bowls. t2's reading is retired in the counter's note. |
| W4 `gnarled_13318` crown_w → (13090, 30) | accepted | The fan of whips is this tree's west crown; there is no further willow. `gnarled_13085`'s note is updated. |
| W5 retire `fig.head_deep_in_hall_12871` | accepted | It is the same blob as structures_w's hanging lamp: an inverted dome on the lintel with no body under it (`z2_lintel.jpg`). Seam note on S4's hall. |
| W6 retire `fig.head_deep_in_hall_12908` | accepted (low) | It lies across the lintel's lower edge with no body below; the restyle paints a hung pot. The other reading is in the seam note. The group's what is rewritten. |
| E1 `prop.small_box_or_stool_14384` (low) | accepted | t4 left it as a "ridge finial" and nobody recorded it. Its three readings are in the note. |
| E2–E4 `prop.stool_14595` (med); retire `round_stand_14600` and `chair_14556` | accepted | On `z_white.jpg` the man in white sits on a stool (legs 14579, 14609) with his knee drawn up. The "stand" was his knee; the "chair" was the table's leg and his shin. |
| E5 `prop.round_basket_or_drum_14795` (low) | accepted | The figure and the prop name each other; no new group. |
| E6 porter facing 180 → 330 (med) | accepted | On `z_porter_soft.jpg` his face and raised hand are on the east side, so he is boarding or loading, not coming off. |
| E7 front-rail figure crouching, foot (14775, 1232) est | accepted (low) | |
| E8 `bank_timber_15162`: base moved, top_w removed | accepted (low) | Its "post" is the mat shed's verge. |
| E9 `south_hall_edge_14945` eave_w, eave_e | accepted (med) | |
| E10 `head_in_cabin_door_15097` low → med | accepted | |
| optional `bundle_heap_14970` end_w (14795, 1262) | **declined** | The thin tail runs along the ridge's own double line. The heap is low either way. |

Also in `merge_fixes.mjs`:
- the banks' `shore` lines stand on `water` (`support_by`), like the river's own shores; without this, the same
  strokes mapped 1.05 m apart;
- `S4b.prop.mooring_post_14737` stands on `water`.

After the merge: **222 entities**. `check` PASSes with no warnings. Running the fixes twice leaves the parts' md5 sums
unchanged.

## The frame (`map/frames/S4b.json`)

- **F1:** origin [8248, 1565], x 77, d [31.6, −51.25], h 77, covers u 12450–15900 (out to the big boat's after end),
  dx_knots **[[12600, 31.6]]**.
- **Datum:** `S4b.road.main:lines.centre.0` = scan (12600, 1206), station +67.95. The route's second point,
  (55.66, 6.83), comes out at station 69.98; S4 has 69.97 at the same point.
- **Supports, each from two stroke points:**

  | support | H (m) | derivation |
  |---|---|---|
  | `water` | −0.7 | the river agent's bound |
  | `boat deck: …big_cabin_14928` | 0.03 | freeboard 57/55 px at u 15200/15300 |
  | `boat roof: …big_cabin_14928` | 1.39 | 2.09 m above the water (est) |
  | `boat deck: …arched_awning_14945` | 0.14 | 65 px (est) |
  | `boat deck: …long_cabin_14850` | −0.12 | 45 px (est) |
  | `tea house floor` | 0.18 | the platform's front face: (14340, 1153) over (14340, 1167), 14 px |
  | `bank top` | 0 | assumed; the top street runs onto the bank with no step |
  | `far bank` | 0 | assumed |
  | `cart bed: S4b.veh.palm_cart_13070` | 0.71 | |
  | `table top: S4b.prop.table_tray_12845` | 0.56 | |
  | `table top: S4b.prop.goods_table_13892` | 0.82 | |
  | `table top: S4b.prop.long_table_15050` | 0.63 | the floor's 0.18 plus the table's 0.45 |
  | `perched: S4.tree.willow_12588` | 5.29 | |
  | `official hall floor` | 0.45 | part 1's choice |

- **Checks (got):**
  - eaves: tea house 2.75 m, shop hall 3.12, mat shed 2.34; up the silk, the shop behind the crowd 1.45, the top open
    shop 0.91, the bank-top house 0.97 (the diminution);
  - animals and vehicles: saddled horse 1.67 m hoof to hoof (a little long), shaft ox 1.51, sedan box 1.04;
  - the biggest boat: hull 12.32 m between its waterlines, bow gunwale 1.25 m above the water;
  - the round boat's beam 3.00 m;
  - the river 16.54 m wide at u 15500.
- **Diminution** (standing figures against foot v):
  - about 170 px on the road;
  - 150 at v 640–690 (0.88);
  - 99 at v 490–550 (0.58);
  - 57–69 at v 400 on the bank (0.35–0.4).
  S4b's figures shrink faster up the silk than S4's.

## The water level

**H −0.7, conf low: a bound, not a reading.** There is no vertical face, stair, revetment or jetty on S4b's moorings.
Three two-point drops from flat ground to the first water:
- M1, (14778, 401) over (14778, 456): −0.71;
- M2a, (14920, 166) over (14920, 224): −0.75;
- M2b, (14990, 151) over (14990, 203): −0.68.

Spread 0.07 m. Plausible range −0.3 (a 1 m landing) to −0.75. S3's river_e bounds (−0.86 to −1.0) fit. 1 m of H moves
boats and shores 1.5 m north or south.

Open issue: the far shore's est line (v 112–122) maps 0.3 m north of the far bank's top. A 0.7 m face would need its
waterline at v ≥ 129 (frame questions).

## Layout and the seam with part 1

`sections/outer_road_2/layout.json`: 66 figures, 13 trees, 123 other entities. `painted_area` corners:
- sw (58.32, −4.39), se (95.98, −4.39), ne (81.65, 30.54), nw (43.99, 30.54);
- sw and nw are **exactly** part 1's se and ne.

## The seam for S3 (u 15500; "the west seam" in the workflow's terms)

- **Route point:** `S4b.road.main`'s last centre point, scan **(15500, 1530) est** (conf low; reading b, the road bends
  south-east past the long hall's east gable). World (93.90, 0.68), **station +110.35**.
- **dx there: 31.6.** S3 keeps it as its seam knot and adds its own measured knots. Keep any ramp under about
  1.5 px/m per 100 px of u (lessons).
- **Painted area:** S3's west corners must equal S4b's se (95.98, −4.39) and ne (81.65, 30.54).
- **Water:** H −0.7 (copy). Shores at u 15500:
  - near shore (15500, 896) est → world (88.39, 14.11);
  - near bank top (15500, 915) est → (88.98, 12.68);
  - far shore (15500, 112) est → (82.12, 29.40);
  - far bank top (15500, 75) est.
- **Crossing u 15500, S4b's:**
  - `S4b.veh.boat_big_cabin_14928`: rear (15745, 865) est, after cabin to 15805, sweep blade to (15855, 897);
  - `S4b.tree.willow_15468`: crown to about (15720, 790);
  - `S4b.bld.south_hall_diagonal_15242`: north barge to (15589, 1422), est NE corner (15650, 1600);
  - the arched-awning boat's anchor line to (15580–15607, 577–590);
  - the mat-cargo boat's line to (15507, 511);
  - `S4b.bld.house_behind_willow_15414`, which abuts S3's riverside hall at 15511–15520.
- **S3's, not recorded by S4b:** the boat under way at 15560–15900, the far-bank willows past 15490, and the bare
  willows at about 15690 and 15800.

## What was hard

- The receding direction (above).
- The water has no face to measure.
- The second pass's two "heads" on the lintel: at zoom 5 the scan cannot separate a head from a hung pot, so I decided
  on the absence of a body.
- The plan labels the datum "station 0" even when `datum.station` is set (S4b: 67.95). This is a tool quirk
  (`scroll_map.mjs` plan, line 586) for the lead.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 3)

> - **Before adding a measured knot, compute what it does to the plan.** With X = (u − ou − dx(u)·D)/77, a row at
>   depth D gets (1 − D·Δdx/Δu)/77 m per px of u: a knot change Δdx over Δu px stretches the rows north of the origin
>   (Δdx < 0) or folds them (Δdx > 0, X falling as u rises) once D·Δdx/Δu passes 1. At S4b's seam, a ramp to the
>   north side's −57 within 340 px stretched the silk's top ×8.8, and a ramp to the south side's +97 folded every row
>   north of the road. Keep any ramp under about 1.5 px/m per 100 px of u (the silk's top, D ≈ 30 m, then stays
>   within ×1.5), and tabulate X along silk rows for each option before choosing (`knot_options.mjs` in the S4b frame
>   agent's scratchpad).
> - **Furniture recedes per group, not per section.** On S4b the shops north of the road and the tea house (dx −51 to
>   −68) and the bottom shop south of it (+77 to +119) are drawn from opposite sides, at the same u. A frame with one
>   dx per u cannot hold both, and a group mean is not a knot. Keep the neighbour's knot as a stated assumption, give
>   the lead each group's stroke points and the computed options, and let builders orient furniture square to its
>   hall as a recorded choice.
> - **On the river, every line that touches the water stands on `water`:** a bank's `shore` line (`support_by:
>   {"shore": "water"}`) and a post in the water's edge. Otherwise the same strokes map 0.7 × 77 / 51.25 = 1.05 m
>   apart (S4b). Check each bank's top against its shore in the world file: the near bank's top must lie south of its
>   shore and the far bank's north of it (S4b's est far shore did not, by 0.3 m).
