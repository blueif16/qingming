# S4b merge notes (S4 part 2, u 12600–15500), 2026-10-12

Eight units (t1–t5, structures_w, structures_e, river), brief `gen/map/S4b/brief.md`, rules
`gen/expand/round2/mapping_rules.md`. The cross-unit fixes are applied by `gen/map/S4b/merge_fixes.mjs`, and this
file says why. That script is idempotent: run twice, the parts' md5 sums are unchanged.

Run it with `node gen/map/S4b/merge_fixes.mjs && node tools/scroll_map.mjs S4b merge && node tools/scroll_map.mjs S4b check`.
The result is `map/strokes/S4b.json`, 220 entities. `check` PASSes. Its only warnings are support keys not yet in
`map/frames/S4b.json`; the frame step adds those keys, listed below.

The merge agent's crops are in the scratchpad (`S4b_merge/c_*.jpg`, `ov_*.jpg`). Each crop shows the scan, the scan
contrast-stretched, and the restyle.

## Counts after the merge

| kind | n | |
|---|---|---|
| figure | 68 | 63 on land, 5 crew on boats (2 high, 3 low) |
| animal | 10 | small horse, bird, saddled horse, donkey, 2 oxen, 3 pack mules + 1 possible (low) |
| vehicle | 9 | 2 palm-covered carts, 1 sedan chair, **6 boats** |
| tree | 13 | +2 in the merge (a stump on the bank, a third willow head) |
| prop | 67 | −4 retired as duplicates, +2 added (the heaps behind the long hall's ridge) |
| building | 24 | |
| structure | 3 | |
| road / water / grd | 3 / 1 / 2 | |
| group | 20 | +1 (the sedan chair and its attendant) |

The parts arrived with 219 entities. The merge retired 4 and added 5, giving 220.

## For the lead first (from the units' reports; decided at the frame step, not here)

- **The receding direction near the seam is outside 31.6 ± 5 on both sides of the road** (structures_w, t2, t4,
  structures_e).
  - North of the road, the ground-level furniture recedes up-LEFT.
    - The shop tables at u 12950–13320 slope +0.8 to +1.3, so dx ≈ −50 to −62.
    - The tea house's platform and furniture at u 14140–14890 give dx ≈ −68 (median; scatter −36 to −122).
  - South of the road and far up the silk, edges recede up-RIGHT at a shallow slope.
    - The furniture under S4.bld.south_hall_12350's east eave gives dx +77 to +119.
    - The top street's tables give +71/+75.
  - The stroke points are in `reports/structures_w.md` (table W1–W7) and `reports/structures_e.md`.
  - The frame agent must report this before fitting. The lead chooses between a ramp inside S4b and re-knotting
    S4 part 1.
- **Water level** (river agent): S4b's bank has no vertical face, stair or jetty. The two-point drop is only an upper
  bound on the depth: 0.68–0.75 m at three places (0.07 m spread). The proposal is `water` H = −0.7, conf low, with a
  plausible range of −0.3 to −0.75, replacing the seed's −1.5. S3's revetments or bridge abutments are the place for a
  real reading. The derivation is in `reports/river.md`.

## Duplicates retired (the reading folded into the kept entity's note)

| retired | kept | why |
|---|---|---|
| `S4b.prop.thatched_canopy_13052` (t2) | `S4b.prop.thatch_shade_13049` (t1) | One thatched canopy on one post, 22 px apart. t1 owns u < 13050, and both readings of the pole put it there or on the line. |
| `S4b.prop.signboard_13060` (t2) | the board in `S4b.bld.shop_hall_13170` (structures_w) | The framed board hangs on the front right under the lintel, between the posts at 13040 and 13077 (structures_w, t1; crop `c_signboard.jpg`). A board on a building is the building's. t2's reading, a board on two legs, is in the hall's note. |
| `S4b.prop.parasol_14872` (structures_e) | `S4b.prop.round_canopy_14905` (t5) | One domed canopy. Its rim runs along the mat roof's top edge, so it is drawn behind that roof, and t5's base (behind the roof) fits that (crop `c_parasol.jpg`). The readings (parasol on the bank, parasol on the tea house's post, round roof) are in the kept entity's note. |
| `S4b.prop.white_box_14147` (structures_e) | `S4b.bld.tea_house_14531` | A pale doorway with a lattice transom and a cap, between the elm's trunk and a post, in the hall's west wall. That is t4's reading, and the restyle's (crop `c_whitebox.jpg`). |

## Things both sides left to each other (added in the merge)

| new entity | in part | left by | what |
|---|---|---|---|
| `S4b.tree.stump_14805` (low) | t4 | river ↔ t4 | A short stippled trunk hooking east at the bank's edge, foot on the river agent's bank_top line (crops `c_stump.jpg`, `c_stump_z4.jpg`). The other readings, a heap, a wrapped post or a boat's bank end, are in its note. |
| `S4b.prop.bundle_heap_14680` (low) | t4 | structures_e → t4 | A long hatched lens shape lying above the long south hall's ridge, u 14555–14800 (crop `c_ridge_w.jpg`). Read as a heap or bundle on the road behind the ridge; the other reading is a ridge capping. |
| `S4b.prop.bundle_heap_14970` (low) | t5 | structures_e → t5 | The same, u 14880–15060 (crop `c_ridge_e.jpg`). |
| `S4b.tree.willow_head_14090` (low) | t3 | t4 → t3 | A third willow head: fine whips radiating from a knob at about (14088, 388), distinct from the forked elm's twigs. The trunk is hidden and the base est (crop `c_fan.jpg`). |
| `S4b.grp.sedan_chair_13140` | t1 | t1 + t2 | The sedan (t1's by the brief) and the man between its poles (t2's `S4b.fig.sedan_attendant_13160`). |

## Other settlements

- **Groups across unit edges.**
  - `S4b.grp.saddled_horse_13378` gains t3's `man_behind_donkey_13512` and `man_bending_sack_13607`.
  - `S4b.grp.tea_house_customers` gains t5's `man_east_bay_14958`, `long_table_15050`, `slatted_box_15078` and
    `small_box_14915`.
  - t1's `S4b.grp.horse_12900` stays apart from the second cart's group: the horse is not harnessed, and the man
    holds its head. Both groups' notes say so.
  - Every group lists only S4b IDs, and every member's `group` matches its group.
- **Boats: which end is the bow.** The lead's rule, sent to all river areas, is that the end with the rudder or the
  sweep is the stern. The river agent had already read every boat that way: the bows are at the bank (west) ends, and
  the outer ends carry the rudder stock, the sweep or the tiller. Nothing is swapped. Each boat's note now says the
  "sterns to the bank" reading is retired.
- **The biggest boat's extent.** The lead's note asked to check this. `S4b.veh.boat_big_cabin_14928` already runs to
  its true stern: rear (15745, 865, est) under the raked end (15760, 777), the after cabin to u 15805, and the sweep
  blade to (15855, 897), all part of the boat (overlay `ov_bigboat_east.jpg`). Nothing is extended.
  - S3's t1 read a "bow at (15790, 670–755)". That is this boat's after-cabin eave over the stern.
  - S3's river_w does not record this boat.
- **Not added, with the reason in a note:**
  - structures_e's "stall with a slanted top" (15100–15180) is the frame on `S4b.fig.man_frame_or_hat_15125`'s
    back. Its hanging legs end about 40 px above the ground he stands on (crop `c_frame.jpg`).
  - The tea house's front rail (u 14720–14862, v 1195–1205, two capped end posts) is part of the hall (crop
    `c_rail.jpg`). t5 read it as a bench; that reading is in the note.
  - t3's pale shape between the elm's stems is not a figure.
  - t3's "vertical board at 14180–14220" is the doorway's post and the eave line.
- **Read by the merge agent, both kept low.** `S4b.prop.big_jar_12707` and `S4b.fig.man_dark_cap_by_stair_12700`:
  the pale shape has a straight rim and a closed bottom outline like a jar, with the man's torso above it (crop
  `c_jar.jpg`).
- **Same thing, two names: no change.**
  - structures_e's north gable peak of `S4b.bld.south_hall_13920`, (14146, 1115), is the finial's foot;
    structures_w's (14145, 1080) is its top.
  - t4's "small roofed gate" is structures_e's `S4b.str.bank_shed_14445` (note added).
  - t5's `man_on_bank_14928` is t4's "figure leaning at a table with one arm out" and the river agent's "man pointing
    at the river".
  - The young man by the top-street stall that t2 left to t3 is t3's `muleteer_13560`.
- **Supports normalised.** t4's `bank slope` (the two figures at the roofed gate) becomes `bank top`. The gate shed
  they stand at is on `bank top`, and the river agent's bank_top line lies east of them and takes the bank top at
  street level.
- **Support keys in use, for the frame.**
  - Without an ID suffix: `ground`, `official hall floor` (in the seed), `water` (in the seed), `tea house floor` (19;
    the platform's side face is 10–15 px, H ≈ 0.15–0.2), `bank top` (15), `far bank` (2).
  - Per entity, with `<key>: <id>`: `boat deck: <boat>` (4: big cabin, arched awning, long cabin ×2), `boat roof: <boat>`
    (1), `cart bed: S4b.veh.palm_cart_13070` (1), `table top: <prop>` (3: the tray table, the goods table, the long
    table), `perched: S4.tree.willow_12588` (1, like S4's bird).
  - The river agent's deck heights above the water are big boat 0.71–0.74, big boat's roof ≈ 2.1, arched-awning
    boat's stern ≈ 0.84 (est), long boat ≈ 0.6 (est).

## Cross-key seam check against S4 part 1 (`map/strokes/S4.json`, u 12450–12750)

Same kind under 30 px apart: **0 hits**. The nearest same-kind pairs are 150–190 px apart:
- `man_dark_cap_by_stair_12700` and S4's `man_seated_by_tree_12512`;
- `big_jar_12707` and S4's crate and parasol;
- `big_roof_hall_12990`'s placeholder sw and `S4.bld.official_hall_12530`'s nw. These two footprints meet along the
  hall's back at v 800 and don't overlap.

`S4b.bld.shop_hall_13170` deliberately starts at the official hall's est se/ne corners (12960, 975) and (13000, 800).
The datum `S4b.road.main:lines.centre.0` is exactly (12600, 1206).

## Seam notes for the lead, by S4 ID (S4 is finished, so these are not edited here)

- **`S4.bld.official_hall_12530`** (structures_w, t1):
  - The roof does not end at ~12960–13000. The tiles and the dark valance band run on unbroken to a hipped east end at
    u ≈ 13385 (band corner (13385, 832)). S4b maps the bays east of part 1's est corner as `S4b.bld.shop_hall_13170`,
    and **the builders must join the two roofs**. structures_w also notes that `S4b.bld.big_roof_hall_12990`, behind
    it, may be this hall's main roof.
  - The raised floor and its railing end at about u 12930 (rail v ~937–957, floor front ~965).
  - Front posts: 12795, 12836, 12852, 12895–12900, then 12978/12999. The lintel is at v 840–845.
  - Possible hanging lamps, part of the hall, all conf low:
    - a small dark object at (12872–12882, 843–858);
    - a light speck under the eave at (12637–12647, 780–790);
    - a pale thing by the stair's east rail at (12597–12620, 920–960).
  - `S4b.fig.dark_figure_or_garment_12825` may be a robe hung on its post (low; both readings kept).
  - Its people are S4b's `S4b.grp.hall_people_12800`. The seated official is `S4b.fig.official_seated_12728`, on
    `official hall floor`.
- **`S4.bld.south_hall_12350`** (structures_w, t1):
  - The "next roof east of u 12700" is this hall's own east slope. The north barge runs on to the north-east eave
    corner (12988, 1258), and the east eave runs (12988, 1260) → (12850, 1340) → (12700, 1440), with a lath band
    along it.
  - Its open front has columns at 12690–12700, 12760–12780 and 12936–12948.
  - The furniture under it is S4b's `S4b.grp.bottom_shop_12750`. The table the child reaches to is
    `S4b.prop.table_12645`, and the barrel is `S4b.prop.barrel_12677`.
  - A small cup or lamp hangs under the counter frame at (12647–12663, 1567–1580). It belongs to the hall if the frame
    is the hall's fitting.
- **`S4.tree.willow_12588`**: its crown reaches east to u ~12950 (branch (12620, 650) → (12850, 500) → (12950, 440)).
  No other trunk shows at 12600–12750. `S4b.ani.bird_12827` is perched in it.
- **`S4.prop.parasol_12572`**: no figure stands under it east of 12600. Part 1's "small boy" is probably
  `S4b.fig.small_figure_cart_rear_12706` (low).
- **`S4.road.main`** continues as `S4b.road.main` from (12600, 1206), keeping edge_n 972.5 and edge_s 1484.
- **Part 1's "not yet mapped" list** (`map/index.md`) is now all mapped:
  - the seated official, the small boy (candidate above), the big jar (`S4b.prop.big_jar_12707`), the figure by the
    stair, the table and the drum;
  - the hanging lamp (a seam note above);
  - the roofs behind the pines, which are in `S4b.bld.big_roof_hall_12990`'s note;
  - the palm-covered cart's roof (`S4b.veh.palm_cart_13070`).

## The S3 seam (u 15500), for S3's merge and the frame step

- **`S4b.veh.boat_big_cabin_14928`** is S4b's. S3 must not record it. Everything at u 15500–15870, v 600–900 belongs
  to it: the after cabin, the railings, the sweep blade to (15855, 897), and the spar to ~15865. S3's "riverside hall
  roof from 15530" at v 640–800 is this boat. S3's hall is the tiled roof lower down.
- **`S4b.tree.willow_15468`** is S4b's (trunk est u 15468). Its crown reaches over S3's riverside hall to about
  (15720, 790). **S3's t1 refers to it as `S4b.tree.willow_15470`, which does not exist.** S3's merge should cite
  `S4b.tree.willow_15468` (see S3's `S3.tree.small_bare_15715` note).
- **`S4b.bld.south_hall_diagonal_15242`** crosses the seam: north peak (15500, 1304), north barge to (15589, 1422),
  est north-east corner (15650, 1600). It is S4b's.
- **`S4b.bld.house_behind_willow_15414`** abuts S3's riverside hall at u 15511–15520.
- **`S4b.road.main`** at u 15500: centre (15500, 1530) est, edge_n 1470 est, edge_s 1605 est, all conf low. This is
  S3's datum point. Reading (b) is that the road bends south-east behind the diagonal hall and runs along the front of
  S3's hall. The lead's call for S3 (reading c, the riverside road) sets S3's point 0 to this point.
- **The water at u 15500:**
  - near shore (15500, 896, est);
  - near bank top (15500, 915, est);
  - far shore (15500, 112, est);
  - far bank top (15500, 75, est).
- **Lines from S4b's boats that cross into S3:**
  - the arched-awning boat's anchor line, to a splash at ~(15592, 584);
  - the mat-cargo boat's looped line, ending at (15507, 511).
- **S3's, not recorded here:**
  - the boat under way at u 15560–15900 and its crew;
  - the far-bank willow whips at u 15490–15567 (trunk est (15520, 70)) and the treeline to 15650;
  - the bare willows with trunks at about u 15690 and 15800 (their crowns reach west to ~15480).

## Against `reference/scroll/sections.md` (from the units)

- "The river leaving the top of the frame ≈ 14500–15000": in S4b the water does not reach the silk's top edge (river
  agent, conf low). Land lines the top from u 14850 to 15560, and a faint far bank with two trees and a shed lies at
  v 15–90.
- The crowd round the seated man is 13, not 15–20. He has no awning of his own: the cover is the big roof's east end,
  with a mat strip hung from it. Storyteller, fortune-teller or pedlar stays open.
- The wheelwright is one man at work, with a possible second watching (low).
- There are 6 boats, not 4: five moored side by side and one along the far bank.

## Proposed second pass (two fresh agents, proposals to `gen/map/S4b/second_pass/<half>.json`)

**West, u 12600–14000** (looks 12450–14150). Check especially:
- `S4b.fig.dark_figure_or_garment_12825` (a figure, or a robe hung on the hall's post);
- `big_jar_12707` against the stair man's lap;
- the two dim heads deep in the hall and the person in the first cart's front;
- t2's fan of fine whip strokes at u 13090–13260, v 20–135. It is named only in `S4b.tree.gnarled_13085`'s note;
  check whether another willow head belongs here;
- the signboard's two thin uprights (legs or a shelf);
- `far_roof_12930` against `big_roof_hall_12990` (one roof or two);
- the possible fourth pack mule;
- the man in the wide hat (a man, or a trestle) and the striped load;
- `south_hall_13920` (one hall or two);
- the crowd count (13).

**East, u 14000–15500** (looks 13850–15650, and to 15900 for the big boat). Check especially:
- the three willow heads (14090, 14300, 14470): how many trunks;
- `S4b.tree.stump_14805`, and a small light shape at (14832–14846, 331–347) by the long boat's bank end (t5 asked
  whether it is a head; the merge agent saw only the boat's outline);
- the two `bundle_heap`s;
- `round_canopy_14905`;
- the tea house's front rail against a bench;
- `man_east_bay_14958` (seated or standing);
- the restyle's "reclining man" on the arched-awning boat at u 15075–15120, v 523–547 (unreadable to the river
  agent);
- the faint crew: two boatmen on the long boat, the head in the big boat's cabin door;
- `bank_timber_15162` (the bank's lip, or a prop);
- `reed_fence_15320` (a fence, or willow whips);
- `young_tree_15275` (a tree, or a bough of the willow);
- the strip at u 15030–15180, v 85–150 (land, or the far bank's face with water up to it).

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 2)

> - **Read every "left to" list against the other unit's part, by place, not by name.** On S4b, four painted things
>   were named in a report and recorded in no part: a stippled stump that the river agent and t4 each left to the
>   other, two heaps behind a ridge that structures_e left to two tiles, and a willow head that t4 left to t3. A
>   front rail was also called a rail by one unit and a bench by another. For each item, find the entity whose points
>   fall on it; if there is none, crop it and add it in `merge_fixes.mjs`.
> - **Settle a duplicate whose two bases disagree by occlusion.** Two units recorded one domed canopy with bases 180 px
>   apart. Its rim runs along a roof's top edge, so it stands behind that roof, and the base behind the roof is the
>   one kept.
> - **Test `merge_fixes.mjs` for idempotency:** run it twice and compare the parts' md5 sums. A guard that tests for
>   text other than what the fix appends (S4b: "front rail" against "a low rail") appends again on every run.
> - **`scroll_map.mjs overlay --x` takes `u0-u1` with a dash;** two numbers separated by a space crash sharp with a
>   NaN width.

## Second pass and frame (the frame agent, 2026-10-12)

Two fresh agents proposed fixes in `second_pass/west.json` (6) and `second_pass/east.json` (11). Each is accepted or
declined in `merge_fixes.mjs` section 7, with the reason in its comment. The script stays idempotent (run twice: the
parts' md5 sums are unchanged). The merge now gives **222 entities**: figures 66, animals 10, vehicles 9 (6 boats),
trees 13, props 71, buildings 24, structures 3, roads 3, water 1, grd 2, groups 20. `check` PASSes with no warnings.

- **Accepted, new (6):**
  - `S4b.prop.slatted_crate_12819` (med), in the bottom shop's group;
  - `S4b.prop.funnel_vessel_12884` (low), on `official hall floor`, in the hall people's group;
  - `S4b.prop.bench_13200`, **raised to med**: on `z2_benches.jpg` the slanted plank on its own legs is drawn apart
    from the counter's top with the bowls. t2's reading (the counter's west side) is retired in the counter's note;
  - `S4b.prop.small_box_or_stool_14384` (low, three readings);
  - `S4b.prop.stool_14595` (med), in the tea house's group;
  - `S4b.prop.round_basket_or_drum_14795` (low). No new group: the crouching figure's what and the prop's note name
    each other.
- **Accepted, retired (4):**
  - `S4b.fig.head_deep_in_hall_12871` and `S4b.fig.head_deep_in_hall_12908`, both on the official hall's lintel with
    no body below. The hall people's group now has 6 members and a new what.
  - `S4b.prop.round_stand_14600` (the man in white's drawn-up knee over a stool) and `S4b.prop.chair_14556` (the
    table's east leg and his shin), replaced by the stool.
- **Accepted, changed:** `S4b.tree.gnarled_13318`'s crown_w (the fan of whips is its west crown, so no further willow);
  `gnarled_13085`'s note; `customer_white_14560` (what, foot measured (14561, 1177)); the tea house group's what;
  `porter_baskets_14778` facing 180 → 330 (east down the gangplank toward the mat-cargo boat: loading or boarding,
  余辉's 客家登船?); `figure_at_front_rail_14752` (crouching on the road, foot (14775, 1232) est);
  `bank_timber_15162` (its "post" is the mat shed's verge, so the rail reading goes; base to the band's middle);
  `south_hall_edge_14945` (eave_w, eave_e: the south eave at v ~1760); `head_in_cabin_door_15097` conf low → med.
- **Declined:** the optional end_w (14795, 1262) for `S4b.prop.bundle_heap_14970`: the thin tail runs along the
  ridge's own double line, and the heap stays low either way.
- **Frame supports (also in `merge_fixes.mjs`):** the two banks' `shore` lines stand on `water` (`support_by`), like
  the river's own shores; without it the same strokes mapped 1.05 m apart. `S4b.prop.mooring_post_14737` stands on
  `water` (its foot is on the shore point).

**Seam notes on `S4.bld.official_hall_12530`, for the lead (adds to the list above):**
- the dark inverted-dome blob hung from the lintel at (12863–12882, 843–870) is one thing: structures_w's "possible
  hanging lamp" and t1's retired "dark head" (a lamp, a bag or a cloth);
- a second small round thing across the lintel's lower edge at (12900–12917, 837–850), with the restyle's hung pot
  just east at (12913–12941, 836–860): t1's retired "head" of someone seated deep inside is the other reading (low);
- the funnel-shaped vessel at the railing is S4b's prop (on the floor, or on its own stand: both in its note).

**The frame** is in `map/frames/S4b.json`. The seam knot [12600, 31.6] is kept constant to u 15500, because the
ground edges near the seam read outside 31.6 ± 5 on both sides of the road, in opposite directions; the lead decides.
Water H −0.7 is the river agent's bound. Deck, floor, bank and table heights are there, each derived from two stroke
points. The report is `reports/frame.md`.
