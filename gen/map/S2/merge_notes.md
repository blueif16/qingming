# S2 merge notes (the canal wharves, u 20500–29050), round 2, 2026-10-12

Eighteen units, brief `gen/map/S2/brief.md`, area brief `gen/expand/round2/brief_canal.md`. All 18 parts passed `check`
on their own. Cross-unit fixes are in `gen/map/S2/merge_fixes.mjs`, which edits the parts in place (idempotent: two runs
give the same `map/strokes/S2.json`, and a run on the original parts gives the same parts) and writes the entities the
merge adds to `parts/merge.json`. This file says why. Originals of the 18 parts before the fixes:
`scratchpad/S2_merge/parts_orig/`. Merge crops: `gen/map/S2/look/merge_*.jpg`.

```
node gen/map/S2/merge_fixes.mjs && node tools/scroll_map.mjs S2 merge && node tools/scroll_map.mjs S2 check
```

**Result:** `map/strokes/S2.json`, **403 entities, check PASS, no warnings**: 147 figures, 9 animals, 20 vehicles
(**17 boats**, plus the mule cart, the crate barrow and the round-topped cart), 20 trees, 103 props, 36 buildings,
12 structures, 2 roads, 4 water, 11 grd, 39 groups. Raw merge: 414 entities in the parts, 412 after two same-ID copies;
the fixes retired 11 entities and 3 groups and added 4 entities and 1 group. The merge's own `near-duplicates` list is
empty after the fixes.

Figures by support: 78 on the ground (one `ground: on` the owner's sacks), **59 on the water** (48 `boat deck:`,
9 `boat roof:`, 1 `boat ladder:`, the man in the river on `water`), 5 `terrace floor:`, 2 `upper floor:`, 1 `bank slope`,
1 rider, 1 on a cart bed. Confidence over all non-group entities: 62 high, 171 med, 131 low.

## The units, in brief

| unit | n | what stands out |
|---|---|---|
| t1 | 13 | the south-bank group of 5 by the small covered boat (2 low); the two top willows; **one** dark-trunked tree at the bottom (S3's t9 copy retired at S3's merge) |
| t2 | 23 | **the five trackers** (the restyle draws seven); the great willow (base ~21345) and a bird in it; the north-bank pair and the shop; the big-hat man on the south bank |
| t3 | 5 | the bank strip 22200–22900 is empty (the restyle's walkers and stone stair are invented); the split willow; the rear tracker again |
| t4 | 18 | terrace diners: 4 heads + 1 unclear; the eatery's west end (1 man, 5 props) |
| t5 | 37 | the eatery's east half (all tables empty), the shop fronts (3 men), the cart with **two mules** (not an ox), 2 sack porters |
| t6 | 16 | the saddled horse behind the cart, the third sack porter, the stall under the scaffold house's eave, two heads over the roof (low) |
| t7 | 27 | the two men on the bank (at 25325–25385, not 25500), the hall window, the far street (barrow, round-topped cart, animals; many low) |
| t8 | 21 | the far street head by head; 王家纸马铺's sign (□□□□(□), illegible); the rider on a donkey (low) |
| t9 | 15 | **no customers at 喝杯小酒** (4 empty tables, a parasol); one certain figure in 26900–27600 |
| t10 | 35 | the grain owner on his sacks, the overseer, the sack heap counted sack by sack, the lower shed's tables |
| t11 | 32 | the porters' east end, the handshake/tally men, the 望楼饭铺 shed's customers, nobody on the 望火楼 |
| t12 | 13 | the donkey at the shed's east end (no rider), 2 seated customers; the massive willow is S1's |
| river_w | 25 | 5 boats (the setup's one big cabin boat is two), 13 figures; the man standing in the open water (low) |
| river_w2 | 31 | 豪华客船 (bow west), the sweep boat (the "skiff" is the sweep's blade), 5 boats, 15 crew, the landing steps |
| river_m | 35 | 逆水行舟 is the **southern** hull (mast stepped on it), towed, not rowed; the cargo boat beside it; the moored boat; 27 figures |
| river_e | 16 | 4 boats, all bow west; only 5 crew; the jetty stands on the bank slope, not over the water |
| structures_w | 24 | `S2.road.main` (50 stations, 20500–29050), the diminution table, the receding-edge knot ~45 ± 5 |
| structures_e | 28 | the 望火楼 and its platform (no lookout), the halls, the far street (side street), the receding direction flips east of 27050 |

## Fixes (merge_fixes.mjs), and why

### Retired (duplicates, some in disguise)

- `S2.fig.tracker_rear_22172`, **t3's copy** (same ID as t2's; the brief gives all five trackers to t2). t3's reading
  (foot (22173, 392), the rope's points east of him) is in the kept entity's note.
- `S2.ani.donkey_26098`, **t8's copy** (same ID as t7's; its fore is 2 px inside t7). Not joined to the round-topped
  cart's group: it faces that cart's horse head to head.
- `S2.fig.man_behind_boat_roof_21503` and `S2.fig.man_behind_boat_stern_21673` (t2, conf low, both readings) = river_w's
  crew `S2.fig.boatman_far_deck_21505` and `S2.fig.steersman_stern_21678`: on the bank strip they would be 30–45 px
  tall, far smaller than painted.
- `S2.prop.post_north_bank_21364` (t2, low) = the big cabin boat's deck post (`pts.deck_post` of
  `S2.veh.boat_big_cabin_21120`, river_w).
- `S2.tree.elm_top_28146` (t11, high) = t10's `S2.tree.bare_28130` (16 px apart; same trunk on
  `merge_tree_28140.jpg`). t10's kept (base in its range), raised to conf high; t11's trunk widths are in its note.
- `S2.tree.great_willow_27072` (t8) = t9's `S2.tree.willow_great_27068` (13 px; by its base t9's). t8's reading and
  river_e's shore (150 px lower than the roots) are in the note.
- `S2.prop.sack_pile_28155` (t11) = t10's `S2.prop.sack_heap_28144` (the same sacks, 28065–28236,
  `merge_sacks_28100.jpg`): t11's count (7 ± 1, including the sacks t10 left to it) is in the note; the heap is
  6–8 sacks.
- `S2.grd.south_bank_mound_21700` (river_w2) = river_w's `S2.grd.mound_south_bank_21420` (crests within 5 px; its main
  point is in river_w's range). structures_w agreed and recorded none.
- `S2.str.stone_steps_22950` (structures_w, low) = river_w2's `S2.str.landing_steps_22950` (med, treads read; landing
  stairs are the river agents').
- `S2.prop.shop_goods_rack_25325` (t7, low) = t6's `S2.prop.goods_racks_25290` (the same strokes 25250–25400,
  `merge_rack_25300.jpg`; t6's has its feet read and its main point in t6's range).
- `S2.prop.table_pavilion_28455` (t11, low) = the 望火楼 platform's front railing (structures_e's `rail_w`/`rail_e`,
  v 180–197, the same plank 28400–28508), which t11 gave as its other reading.
- `S2.prop.mooring_post_26018` (t7, med): on `merge_post_26018.jpg` and `merge_post_26128.jpg` it and its twin at
  u ~26128 are uprights on the warehouse plinth's plank face **directly under the bay posts** (26020–26025,
  26125–26135): the posts carried down through the platform (structures_e, river_e), and no rope is drawn to them.
  The free-standing-bollard reading is in `S2.bld.warehouse_26070`'s note.
- Groups: `S2.grp.trackers` (into 逆水行舟's group), `S2.grp.eatery_west_23650` and `S2.grp.eatery_east_23820` (into one
  eatery group).

### Edited, not retired

- **Supports:** t4's placeholder `terrace floor: S2.bld.terrace` → `terrace floor: S2.bld.river_terrace_23250`
  (10 entities); t7's `upper floor: S2.bld.yanhe_yazuo_hall` → `upper floor: S2.bld.yanhe_yazuo_hall_25690`
  (5 entities). `boat ladder: S2.veh.boat_passenger_22545` (river_w2's man on the ladder) is **kept as a new key** for the
  frame (below). river_e's `jetty deck` is used by nobody (nobody is on the jetty).
- **Groups:**
  - 逆水行舟: `S2.grp.trackers` absorbed into `S2.grp.boat_towed_mast_23632` (renamed "the towed boat, its crew and its
    five trackers"; 18 members), as S3's merge did with its trackers. The rope is `pts.rope` on
    `S2.veh.boat_towed_mast_23632`, 26 points from the mast (24188, 375) to `rope_end` (21832, 197) at the lead
    tracker's hands; t2's painted rope points are kept in the group's note.
  - the open-air eatery: t4's and t5's halves → `S2.grp.open_air_eatery_23760` (new; both asked), with the shelter
    `S2.bld.eatery_shelter_23750`.
  - the grain unloading: t11's five figures that carried the placeholder `S2.grp.grain_porters` joined t10's
    `S2.grp.grain_unloading` (the youth bending over the heap, three porters, the bank porter). The three tally/handshake
    men keep t11's `S2.grp.handshake_28220` (a vignette inside the scene; both groups name each other).
    `S2.fig.staff_man_28266` raised to conf med: t10 read him independently (a tally stick held upright).
  - the cart scene: t6's horse and the man at its head joined t5's `S2.grp.mule_cart_24305`; t6's third porter and
    river_m's porter at the bank's edge joined `S2.grp.sack_porters_24312` (`merge_bankedge_24450.jpg`: the bank-edge
    porter is a third figure, distinct from t5's at foot v 432).
  - river_w2's mooring post was a member of 豪华客船's group without the `group` field: set.
- **Text:** t6's and structures_w's "ox" → the two mules (t5: no horns, slim bodies); a typo ID
  (`S2.fig.sack_porter_24453`); t8's guessed `S2.bld.wang_paper_horse_shop_26850` → `..._27100`; the retired IDs in
  the units' notes → the kept ones (the merge's own notes keep the retired IDs on purpose).
- **Pin 16 聊天的伙计** is the pair in the cargo boat's deckhouse (`S2.fig.man_seated_deckhouse_24393`,
  `S2.fig.man_leaning_deckhouse_24447`): t5 and river_m agree on the pair; `src` set.
- **The water and the banks join** at each river-unit seam (the same point on both sides):
  - u 20500: north shore (20500, 310) est, S3's (river_w had 330). Bank tops and the south shore already matched.
  - u 21850 (river_w | river_w2): north shore (21850, 345) est on both sides (river_w2 had 425; on
    `merge_seam_21850.jpg` the ripple lines start at v ~345–350); bank top (21850, 274) est, the mean of 248 and 300
    (the level ground under the lead tracker ends at v ~270–280 where the bank's dark tufts begin); south shore
    (21850, 1432) on the mound's crest.
  - u 23300 (river_w2 | river_m): hidden under the terrace (`merge_seam_23300.jpg`): the means, shore (23300, 496) est
    and bank top (23300, 452) est.
  - u 26000 (river_m | river_e): river_e's, bank top (26000, 632) = the warehouse plinth's measured foot, shore
    (26000, 665) est.
- **`S2.road.main`:** edge_s at 21950, 22100, 22285 and 22450 now lies on river_w2's bank top (311 est, 380, 441, 430),
  as structures_w asked. **Not done over 22600–23300:** river_w2's bank top there (418, 418, 407, 420, 432) runs north
  of the road's centre (410, 445, 448, 422, 425); see the frame step.

### Added at the merge (each named only in notes; conf low, both readings in the note)

- `S2.ani.bird_in_willow_21135`: the dark blot on a willow twig at (21125, 640) that river_w left to t1 and t1 did not
  record (`merge_bird_21135.jpg`: 14 × 11 px, darker than the whips). `perched: S2.tree.willow_great_21345`.
- `S2.fig.crewman_beside_poler_23748`: river_w2 left "a second figure at about (23750, 780–830)" beside 逆水行舟's poler
  to river_m, which neither recorded nor mentioned it (`merge_second_figure_23748.jpg`: a round head and a body between
  the two bows' converging lines). On 逆水行舟's foredeck; other reading: the cargo boat's bow rigging.
- `S2.tree.bare_south_bank_20705`: **S3's t9** saw a second bare tree whose twigs fan over 20650–20950, trunk hidden
  behind the south-bank roof. On `merge_tree_20705.jpg` and `merge_tree_20705_foot.jpg` a separate fan of stems
  converges to a narrow foot at ~(20705, 1455), 60–100 px east of the dark tree's knobbed head, just above the hall
  roof's hip. Other reading (t1, river_w): the dark tree's east shoots. **The tree count matters to the user.**
- `S2.fig.figure_under_eave_20625`: **S3's t9 and S3's structures_e** read a figure (head ~(20625, 1645)) between the
  dark trunk and the south-bank hall's west eave; t1 named the same pale patch and judged it too big for a head
  (45 × 60 px). `merge_figure_20625.jpg` shows a profile-like contour and strokes below it. Both readings in the note.

### Looked at, not changed

- **Which end is the bow** (the lead's rule): all 17 boats have `front` at the end without the rudder or sweep; no swap
  was needed. Boats whose rudder is hidden carry both readings in their note: the north-bank cargo boat (bow east, med;
  if west, its stem is at ~20385 and it still stays S2's by the lead's note), the small covered boat (bow east, low),
  豪华客船 (bow west, med), the sweep boat (stern east by the sweep), grain boat 2 (bow west, by the raked stem).
- t1's dark mass at 21273–21303, v 1268–1300 (t2: a possible third figure at the willow's foot): knot hatching on
  `merge_darkmass_21290.jpg`, as t1 read it. Not added.
- t6's two heads over the scaffold house's roof (`merge_heads_24850.jpg`): two shapes with shoulders; structures_e reads
  the west one as a ridge ornament. Kept at conf low.
- The "tall figure" at river_m's moored boat's stern (t8, river_e): the rudder stock's ribbed head
  (`merge_stern_26010.jpg`); noted on the boat.
- t11's "shape between the rear shed's two tables" (28112–28140, v 436–484): shed posts and table legs
  (`merge_shape_28125.jpg`); noted on `S2.bld.tiled_shed_27985`.
- The rounded shape or small bare tree at the paper shop's west gable (26905–26990, v 20–110; t8, t9): unreadable
  (`merge_top_26930.jpg`). Left to the second pass.
- t4's shelving behind the panelled screen: in `S2.str.panel_screen_23555`'s `what` (its back); t4's dark object in it
  is a prop. The ridge knob on the rear shed (28428, 283), ornament or bird: in `S2.bld.rear_shed_28380`'s `what`.

## Cross-key seam check

`map/strokes/S3.json` within u 20200–20800 and `map/strokes/S1.json` within 28750–29350 (S1's strokes as of 09:22;
S1's merge may still be running): no figure, animal, vehicle, tree or prop of the same kind under 30 px. The road, the
water and both banks share their seam points exactly with S3 (0 px), and the road with S1. One near pair:
`S2.grd.bank_lines_top_28900` ~ `S1.grd.terraced_fields_29450` (2 px), below.

## Seam notes for the lead

**S3 (u 20500)**
- The dark-trunked tree is S2's `S2.tree.dark_trunk_willow_20530` (S3 retired its copy). The north-bank boat is S2's
  `S2.veh.boat_mat_cargo_21055` with six crew (one, `S2.fig.boatman_pole_20495`, stands west of 20500); S3 did not
  record it. S3's south-bank boat (`S3.veh.boat_moored_south_bank_19745`, roof and planking to ~20745) is not in S2.
  The big willow at the top is S2's `S2.tree.willow_top_20552`.
- **Nobody records the small hut or stand at u 20440–20530** (posts at 20461 and 20503, v 160–252; a lidded box at
  20445–20480, v 214–240). S2's structures_w and t1 leave it to S3 by its middle (~20485); S3's structures_e reads it as
  the west bay of a building behind the willow (its "board wall" at 20595–20656, v 110–222, is S2's
  `S2.str.slat_fence_20740`). `S3.prop.small_table_20460` stands under it. The lead decides.
- Two entities were added on S3's readings (the second bare tree and the figure under the eave, above).
- `S3.road.south_street_20250` reaches (20500, 1705, est); S2 has no south-bank street (the hall's roof covers the
  bottom, base below the silk).

**S1 (u 29050)**
- `S2.road.main`'s last point (29050, 730) is `S1.road.main`'s point 0.
- The massive willow is S1's (`S1.tree.willow_burl_29090`; t12: base (29070, 1785) est ± 20, its crown reaches west over
  S2's water to ~28585); the willow over the stalls is S1's (`S1.tree.willow_stall_a_29178`; t12 (29166, 630)); t12's
  figure at (29185, 1010) is `S1.fig.man_with_stick_29205`.
- `S2.prop.bench_29030` spans 29008–29052; no S1 prop within 30 px. 望楼饭铺's last post is at 29043–29053.
- **`S2.grd.bank_lines_top_28900`** (two level lines at the top, crossing 29050 at v 150 and 192; structures_e: a bank or
  a path's edges) is 2 px from `S1.grd.terraced_fields_29450`: the same lines read twice, as a bank/path and as terraced
  fields. One reading should go; the lead decides with S1's structures_w.
- The curved line (28999, 83)–(29079, 126) and the upright block at 28984–28999 (v 80–103) are left to S1's
  structures_w. River_e's water ends at (28968, 1780) before the seam.

## For the frame step

- **Support keys in use:** `ground`, `ground: on S2.prop.sack_pile_27996`, `water`, `boat deck: <17 boat ids>`,
  `boat roof: <id>` (逆水行舟 5, 豪华客船 2, the north-bank cargo boat 1, the mat-cabin boat 1),
  `terrace floor: S2.bld.river_terrace_23250`, `upper floor: S2.bld.yanhe_yazuo_hall_25690`, `bank slope`,
  `fire tower platform` (only the pavilion building; nobody on it), `table top: <prop id>`, `cart bed:
  S2.veh.mule_cart_24305`, `animal S2.ani.donkey_26872`, `perched: S2.tree.willow_great_21345` (two birds), and the new
  **`boat ladder: S2.veh.boat_passenger_22545`**: his feet are on a rung ~120 px above the ladder's foot on the
  walkway (23243, 835) (H = 豪华客船's deck + ~1.56 m at 77 px/m), or normalise him to `boat deck:` and accept the
  error.
- river_m's two men at the bank's edge (`S2.fig.man_with_sticks_bank_24390`, `S2.fig.sack_porter_bank_edge_24467`)
  are on `ground` with feet est at v 532–535, below river_m's bank top (~480–485 there): on the slope; the frame may
  give them `bank slope`.
- **Water level:** no S2 unit could measure one (no vertical face meets the water). Checks only, all consistent with
  S4b's −0.7 m: river_w2 H ≥ −0.99 (landing steps), river_m ≥ −1.0 (weak, slope), river_e |H| ≤ 3.2.
- **The road, still open:** (1) over 22600–23300 river_w2's bank top runs north of the road's centre (the strip in
  front of the long house is 5–15 px deep by river_w2, the centre runs on the wash slope); (2) through the terrace
  (22920–23500) structures_w takes reading (a) and suggests a `support_ranges` entry on `terrace floor:`;
  (3) structures_e's edge readings east of 24600 differ from structures_w's (its report, section 6: edge_s 600–640 at
  the shore in front of the scaffold house against the bank top 505–520; edge_n 503 at the open shop against 470 est;
  edge_n ~550 at the tiled shed's front against 690 at 28050–28250).
- **Receding direction:** structures_w's knot ~45 ± 5 px/m over 21400–24200 (continues S3's 46–51);
  structures_e: up-right (slope ~ −1, dx ~ +51) west of 26500, **up-left** (+0.87 to +1.25, dx −49 to −52) over
  27600–28650 (t11's tables agree), dx crossing 0 near 27050 where 王家纸马铺 is drawn frontal.
- **Diminution:** structures_w's table (its report): 0.66 of S4's road size at foot v 116–150 up to 1.42 at v ~905;
  S2 is painted 1.5–3 times larger than S4 at the same v; the north-bank strips are 0.2–1.3 m deep at the frame's rate.

## Second pass: four fresh agents proposed

As the area brief planned, each looking 150 px past both ends. Counts are of the merged map (non-group entities by
main point).

| id | owns u | entities / figures / low | items to settle |
|---|---|---|---|
| `west` | 20500–22900 | 84 / 40 / 25 | the added `S2.tree.bare_south_bank_20705` (own tree or the dark tree's shoots) and `S2.fig.figure_under_eave_20625`; the dark mass at 21273–21303 (`merge_darkmass_21290.jpg`); t1's low figures (raised hands, crouching, the figure at the top willow) and river_w's `figure_under_awning_21245` and `child_or_vase_21076`; what the man in the river stands on; the two birds; the reddish mark in the water at (20683, 645–675); the north-bank cargo boat's bow; t2's crouching man by the timber; the big-hat man (bank, t2 and river_w2; or a boat's bow, t3); the hut at 20440–20530 with the lead |
| `middle` | 22900–25300 | 112 / 55 / 42 | the added `S2.fig.crewman_beside_poler_23748`; 逆水行舟's and the cargo boat's low crew (4 and 6), and whether the deckhouse is a separate small boat; t4's unclear terrace figure (cloth?) and the leaning diner (one or two); t5's doorway jar (or a seated person), the carter's pose, the man in the shop door; t6's man at the horse's head (one or two), the two heads over the scaffold roof, the stall (bench or figure); the bank-edge men at 24390 and 24467 |
| `east_middle` | 25300–27600 | 76 / 25 / 32 | the far street's low figures, the barrow (or a porter with two baskets), the round-topped cart, the donkey at 26098; the hall window's small figure and the shopkeeper (or a picture); the warehouse's capped posts (posts or bollards); the moored boat's low crew under the canopy; t8's rider and donkey, the figure at 26697, the baskets (a porter?); the rounded shape at 26905–26990, v 20–110 (`merge_top_26930.jpg`); the great willow (one tree or two; the wattle fence or its knob foot); t9's man behind the tub and the tall paper item |
| `east` | 27600–29050 | 86 / 26 / 30 | t10's man at the railing, man by the mat and the stake at 27708; the tally men (one or two at the staff); the porters' estimated points; the ridge knob at (28428, 283) (ornament or bird); `S2.tree.willow_behind_shed_28555` (own tree or part of 28612) and the far trees; t12's far-shed furniture, the small tree or post, the tub; the donkey's rider reading; river_e's low crew (the steersman may be the rudder head, the two caps may be bitts), the ribbed object (a small boat?), grain boat 2's bow; t11's mooring post with its coiled rope (or a hooded person) and the ladder |

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 2)

- **Two units sometimes record one straddler under the same ID** (each told to keep it so it cannot be missed). `merge`
  keeps the first file's copy and prints it under "duplicate ids"; drop the other file's copy by file in
  `merge_fixes.mjs` and copy its reading into the kept entity's note.
- **Read the neighbour area's reports for your side of the seam.** Its tile agents look 150 px past the seam and note
  what they see there ("seen east of the seam, for S2"); S3's t9 and structures_e named a second bare tree and a figure
  under an eave that S2's tile had judged away. Treat those notes as part of the "left to" comparison.
- **Make the river units' reaches meet:** copy one shore point and one bank-top point onto both sides of every
  river-unit seam (S2's readings at u 21850 were 80 px apart), and say whose reading was taken.
- **A post on a plinth's face right under a bay post is the post carried down,** not a mooring bollard: check the
  alignment with the building's posts before keeping it as a prop.
- **In `merge_fixes.mjs`, keep ID swaps out of the merge's own notes** (swap only the text before the first "Merge:"),
  or a rerun rewrites the retired IDs those notes name on purpose.

## Second pass and frame (the frame agent, 2026-10-12)

`merge_fixes.mjs` section 6 (the second pass) and section 7 (the frame step); the frame is `map/frames/S2.json`, the
frame report `gen/map/S2/reports/frame.md`. Scripts: `scratchpad/S2_frame/` (`mkframe.mjs` writes the frame,
`knot_options.mjs` the knot options, `worldcheck.mjs` the banks, strips and crews, `seamcheck.mjs` the cross-key seam
check). Before deciding, the frame agent read the key crops again: west `ov_newhall`, `c_awning`; middle `g_post2`,
`c_poler`, `i_poler`, `c_bowwind`, `c_sternawn`, `n_window`, `c_eaterym`, `g_ridge`; east `z_stems`, `n_toptrees`,
`i_stems`, `n_mat2`, `z_bitts`, `n_framefig`. It also made its own crops of the receding edges (`S2_frame/k_*.jpg`).

**Result:** `map/strokes/S2.json` has **398 entities**, and check PASSes with no warnings:

| kind | count |
|---|---|
| figures | 140 |
| animals | 9 |
| vehicles | 20 (17 boats) |
| trees | 21 |
| props | 103 |
| buildings | 37 |
| structures | 12 |
| roads | 2 |
| water | 4 |
| grd | 11 |
| groups | 39 |

- `merge_fixes.mjs` is idempotent.
- Rebuilt from the merge's 18 original parts (`scratchpad/S2_merge/parts_orig/`), it gives the same 20 parts.
- The merge flags one near pair: `S2.fig.passenger_window_24025` and the new `S2.fig.second_passenger_window_24050`,
  20 px apart. It is kept on purpose: the two sit side by side at one window, and their feet are est on the same floor.

### Second pass: all 36 proposals accepted

**West (11).**
- New, `S2.bld.hall_behind_gate_22480` (low). The roof over 22320–22650 had no footprint (README rule 6). Its tiles
  cover the gateway's own small roof, and they stand 110–125 px of v behind the white wall.
- Retired, `figure_under_awning_21245`. It is a white silk fleck at the awning's tip. The big cabin boat now has 3 crew.
- Changes:
  - the face under the eave is kept low;
  - both bare trees are kept: the shoot at 20645 is the dark tree's, and the stems at 20700–20720 are the second tree's;
  - the big-hat man faces 135, seen from behind;
  - the notes on the slat screen and the long house name the new hall;
  - the mat-roofed boat's deck gear is in its `what`.
- Also done, as the pass offered: the second bare tree's `crown_w` moved from (20640, 940), on the dark tree's shoot,
  to (20690, 1000).

**Middle (14).**
- New, `S2.fig.second_passenger_window_24050` (low). The other reading, his raised hand, is in its note.
- Retired, four figures that are gear:
  - `crewman_beside_poler_23748`: a rope-wrapped fender, or a bitt with scroll ends. The merge had added it.
  - `windlass_man_w_23888` and `windlass_man_e_23952`: the bow windlass's end disc, crank and spoke ends.
  - `man_stern_awning_24870`: a second light board.
- Changes:
  - the eatery man is seated;
  - the cargo boat now has 9 crew, and its fender is in its `what`;
  - 逆水行舟's crew and boards are in its `what`;
  - the "ox" is now the two mules;
  - the notes on the hanging wares and the hung cloth.
- From the pass's checked items (left to the lead):
  - **retired `head_over_roof_w_24840`.** It is the ridge-end ornament (鸱尾): two lobes on a neck that runs into the
    ridge at `ridge_end_w`. structures_e read it the same way. It is now in the scaffold house's `what`. The east knob
    stays a low head.
  - `figure_roof_coils_24508` raised to med: a face shows under its dark top.
  - the two men at the bank's edge go to `bank slope` (section 7).

**East-middle (3).**
- The note on the capped head (a man in a straw cape, low).
- The note on the barrow (kept over the porter reading).
- The round-topped cart's `front` moved to (25998, 136, est), where its bed ends. Its group is kept, with a note that
  the horse is not in the shafts.

**East (8).**
- New, `S2.tree.stems_behind_top_house_27790` (low). Two straight stems, 2–3 times a whip's width, with no branch to the
  willow. The tree count matters to the user. The willow's note names it.
- Retired:
  - `man_by_mat_27935`: no head is painted, and the bench is drawn whole there;
  - `boatman_coils_28562`: a 14 × 17 px mark, which is the first coil figure's shoulder or a second bitt.
- Grain boat 2's `what` and its group's `what` follow these.
- Changes:
  - `man_at_railing_27650` raised to med;
  - `far_tree_28603` and `far_tree_28655` raised to med (their trunks cross the eave line);
  - notes on `boatman_coils_28543` and `steersman_27890`, both still low.
- The open points, settled:
  - **no third tree between the elms.** The leaf clusters hang in tiers and show no stem of their own. Its points are
    in `S2.tree.bare_28130`'s note in case the lead counts it.
  - `bench_27840` stays a bench, with a note.
  - **no figure in the pole frame.** The head-like shape is unreadable, and the east-middle pass read no people in the
    yard. The note is on `S2.prop.pole_frame_27490`.

Every ID retired at the second pass now reads "<slug> (retired at the second pass)" wherever another entity's text
names it.

### Frame step fixes (section 7)

- **(a) The datum.** `S2.road.main`'s point 0 and its edges at u 20500 are read from `map/strokes/S3.json` on every run.
  S3's edge_n point is est.
- **(b) Banks.** Every bank's `shore` line stands on `water` (`support_by`).
- **(c) Supports normalised.**
  - The two men at the bank's edge (24390, 24467) go to `bank slope`.
  - Three high sterns get `boat stern deck: <id>`:
    - the big cabin boat's steersman;
    - the mat-cabin boat's hood man;
    - grain boat 1's steersman reading.
  - 逆水行舟's bowman gets `boat bow deck: <id>`.
  - 豪华客船's windlass man gets `boat after roof: <id>`.
- **(d) The route through the terrace** gets `support_ranges` 22920–23500 on `terrace floor: S2.bld.river_terrace_23250`
  (H 0). This is structures_w's reading (a), recorded.
- **(e) The route's edge_n.** Where structures_w had an estimate and structures_e or the wharf yard read the front, the
  edge was set to the read front. These points are listed in `S2.road.main`'s note:
  - u 25350 → 503;
  - 26300 → 590;
  - 27650 and 27850 → 830;
  - 28050 and 28250 → 560;
  - a turn at the lower shed's east end (28000, 828).
  The warehouse plinth (u 26100) is left as a question.

### Frame

- **Seed:** taken from S3: origin (8248, 1565), 77 px/m, 51.25 px of v per metre of depth. The seam knot is
  [20500, 30.4]. The datum is S3's route point (20500, 258, est) at station +179.21. Water is −0.7, copied from S4b.
- **Knots:** [20500, 30.4], [22185, 43.1], [23989, 48.3], [25924, 46.6], [28121, −51.6].
- **The receding direction turns over** east of u ~26000. All ten furniture edges on the east wharf recede up-left, and
  the 望火楼's pavilion agrees. The frame uses the measured knots. Nothing folds, but over 25924–28121 the rows north of
  the river stretch:
  - ×1.75 at the route;
  - ×2.35 at the silk's top.
- The lead's first question has options B and C with their numbers.
- **Supports:** 34, each from two stroke points or a stated assumption. `bank slope` is −0.35, assumed.
- **Checks:** 23 real-size checks.
- **Questions:** 8.
- **map_layout:** the painted area's west corners are exactly S3's east corners: sw (160.85, −4.39) and nw (147.06, 30.54).
- **Route:** station +179.21 to +314.87. It ends at (29050, 730), world (281.07, 16.29), which is S1's datum.
- **Cross-key seam check:** S3 (20200–20800) and S1 (28750–29350) have no same-kind pair under 30 px. The road, the water
  and the banks match S3 at 0 px. The road matches S1 at 0 px. `S2.grd.bank_lines_top_28900` and
  `S1.grd.terraced_fields_29450` are 2 px apart: one reading should go.
