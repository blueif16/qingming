# S4b structures_w report: u 12600–14000 plus `S4b.road.main` (u 12600–15500)

Part: `gen/map/S4b/parts/structures_w.json`, with 15 entities. `check` PASSES on the part alone and with all the parts
present on 2026-10-12. Self-overlays: `gen/map/S4b/look/structures_w_overlay.jpg` (u 12450–14150, zoom 1, grid 50)
and `gen/map/S4b/look/structures_w_road_overlay.jpg` (the road over u 12450–15650, zoom 0.45).

## FIRST: the receding direction near the seam is outside 31.6 ± 5 on both sides of the road

No ground-level edge in u 12600–13300 reads within 31.6 ± 5 px/m. The required slope is dv/du −1.40 to −1.93. The
painter recedes the two sides of the road in opposite directions:

- **North of the road (the shop furniture and the official hall's stair):** edges recede up to the **LEFT**, slope
  +0.8 to +1.3, so dx is about **−50 to −62**.
- **South of the road (the furniture under S4.bld.south_hall_12350's east eave) and far up the silk (the top street's
  tables):** edges recede up to the **RIGHT** at a shallow slope, −0.5 to −0.7, so dx is about **+71 to +119**.

Neither group comes near part 1's 31.6, and averaging the two groups means nothing. The lead decides. I have not
fitted anything. The full table is under "Receding-edge table" below, and these are the nearest stroke points:

| # | edge (ground level) | from | to | slope | dx (px/m) | conf |
|---|---|---|---|---|---|---|
| W1 | child's table `S4b.prop.table_12645`, east end of its top (south side) | (12687, 1639) | (12663, 1652) | −0.54 | +95 | low (24 px) |
| W2 | `S4.bld.official_hall_12530`'s stair rails (part 1's points), less the 0.45 m floor drop (35 px) | (12605, 844) | (12677, 939) | +1.32 (ground +0.83) | −61 | low-med |
| W2b | the same, second rail | (12564, 848) | (12650, 957) | +1.27 (ground +0.86) | −60 | low-med |
| W3 | bottom shop table edges under the south hall's east eave (south side) | (12790, 1550) | (12907, 1480) | −0.60 | +85 | low-med |
| W3b | the same, second edge | (12795, 1590) | (12870, 1540) | −0.67 | +77 | low-med |
| W3c | the same, the counter top | (12820, 1482) | (12887, 1450) | −0.48 | +107 | low |
| W3d | t1's `S4b.prop.bench_12835`, front edge | (12780, 1557) | (12890, 1510) | −0.43 | +119 | low |
| W4 | shop table A (t1's `S4b.prop.table_13010`), east side; t1 reads (13022,882)->(13075,935) | (13036, 898) | (13074, 936) | +1.00 | −51 | med |
| W4b | table A, west side | (12952, 912) | (12976, 936) | +1.0 | −51 | med-low |
| W5 | shop table B, west side (t2: the rail under it (13146,907)->(13203,952) +0.79) | (13145, 907) | (13173, 932) | +0.89 | −58 | med-low |
| W6 | sedan chair box, west face bottom | (13062, 1130) | (13080, 1140) | +0.56 | −92 | low (18 px) |
| W7 | shop table C, the counter with bowls, west side (t2: (13203,955)->(13257,982) +0.50) | (13217, 953) | (13253, 983) | +0.83 | −62 | med-low |

The sedan chair also shows its **west** face (u 13060–13080), so things here are seen from the east.

## Counts

| kind | n | ids |
|---|---|---|
| road | 3 | `S4b.road.main` (route, 12600 → 15500), `S4b.road.cross_13530` (the square north to the top street, 张安治's crossroads), `S4b.road.top_street_13700` |
| building | 12 | north: `shop_hall_13170`, `big_roof_hall_12990`, `far_roof_12930`, `crowd_shop_13180`, `top_street_shops_13580`, `top_open_shop_13990`, `wheelwright_shed_13840`, `roof_behind_trees_13980`; south: `south_hall_13920`, `south_hip_roof_13810`, `south_gable_shed_13380`, `south_bottom_roof_13770` |
| structure, grd, prop, figure, group | 0 | none |

Every building footprint is a placeholder (`est`). Their bases are hidden behind roofs, carts, crowds and trees, or
lie below the silk's edge; each note says how it was estimated, and the builder settles them as `choice:`. The road's
points are all `est` except the datum and the measured edge points.

## What was hard or ambiguous

- **The datum:** `S4b.road.main:lines.centre.0` is exactly `[12600, 1206]` (no `est` flag, so the frame reference
  reads clean). The second point repeats S4's `(12750, 1215)`. `edge_n` starts at S4's 972.5 and `edge_s` at S4's
  1484.
- **The road's east end (u 15200–15500)** is hidden by the south row's roofs and the willows. I took structures_e's
  reading (b): the road bends south-east between the long hall's east gable (15262) and the low house behind the
  willow, passes behind the diagonal hall's north gable, and runs on along the front of S3's long riverside hall. On a
  zoom-0.55 view to u 16300, that hall's veranda is at v ~1420–1470 with an open strip in front of it at
  ~1480–1520. The last centre point is **(15500, 1530) est, conf low**, and S3's datum depends on it. The other
  reading, that the road continues among the willows at v ~1150–1220, would run into S3's hall, which fills v ~950–1470
  from u 15530.
- **The road's south edge** east of u 13240 is everywhere the hidden north walls of the south row, estimated as part 1
  did. West of there, from S4's south hall's east side to u ~13240, the open ground runs off the silk's bottom edge.
- **`S4b.bld.big_roof_hall_12990`.** Its form is unresolved: either a hip-gable roof with an E–W ridge and its east hip
  running down to the right, or a N–S roof seen from the west. It may also be the main roof of the long official
  hall/shop hall. The open framing under its lower west part (12930–13075, v 580–690) is described in its note.
- **`S4b.bld.far_roof_12930`** is a large diamond-tiled roof at u 12800–13080, v 100–315. The restyle paints only
  bare ground there, and I found it from t1's left-to list. It may be the upper part of the big roof (conf low).
- **The big south hall `S4b.bld.south_hall_13920`.** I first split it at u ~13960. I now record it as one N–S hall
  with a railed south gable (apex (13705,1385)) and a ridge rising to a north gable peak with a finial at
  (14145,1080), the same pattern as S4's 12350 and structures_e's 14340. The restyle and structures_e read it the
  same way. Alternative: two buildings. Its placeholder footprint overlaps structures_e's
  `S4b.bld.south_hall_long_14680` at u 14060–14395; their roofs overlap in the picture.
- **The cross street** is a wide open square (~300 px across) rather than a lane. Its identification with 张安治's
  crossroads is the scholars'. t2 independently reads the same band (u ~13280–13560, from the top street v ~430 to
  the main road).
- **The signboard** on the shop hall (u 13040–13080, v 840–890) has about three columns of marks and is illegible
  even at zoom 8 (□…). I record it as hung on the building's front between two posts. t2 recorded
  `S4b.prop.signboard_13060` (conf low) as possibly standing on legs. The merge keeps one: hung, in my reading.
- **Restyle use.** I used it only to read forms: the valance under the shop hall's eave, the gable truss, and the
  straw shade. It invents a willow crown over the far roof and a mule at the wheelwright's. Every point is from the
  scan.

## Seam notes (S4 part 1), by S4 ID

- **`S4.road.main`** → `S4b.road.main` continues from (12600, 1206) with S4's edges 972.5 / 1484 (see its note).
- **`S4.bld.official_hall_12530`**, its true east end:
  - **The roof does not end at ~12960–13000.** The same tiled roof (tiles from v ~700 to the eave at ~777–783) and
    the dark band under it (v ~783–837: a hung valance or a mat pent eave) run unbroken to a hipped east end at
    **u ≈ 13385**. The tile roof ends at (13313,780)–(13337,777) and the band's corner is at (13385, 832). There is no
    gable, break or step between 12560 and 13385. I mapped the bays east of part 1's est corner (sw (12960,975),
    nw (13000,800)) as **`S4b.bld.shop_hall_13170`**, an open shop at road level with tables. **The builders must
    join the two roofs without a seam,** or the lead may extend the hall.
  - The raised floor and railing end at about u 12930. The railing rail is at v ~937–957, seen at 12700–12930
    (part 1: 916–935), and the floor front at ~965.
  - Front posts seen east of 12600: 12667 (part 1), 12795, 12836, 12852, 12895–12900, then a pair at 12978/12999 at
    the hall/shop junction. The lintel is at v 840–845.
  - Hanging things, part 1's "hanging lamp", conf low:
    - a small dark object hangs from the lintel at (12872–12882, 843–858);
    - a light speck under the eave at (12637–12647, 780–790), drawn by the restyle as a white lantern;
    - t1 notes a pale thing by the stair's east rail at (12597–12620, 920–960).

    All three are part of the hall if they hang from it.
  - t1's `S4b.fig.dark_figure_or_garment_12825` may be a robe hung on the hall's post. That is for the merge.
- **`S4.bld.south_hall_12350`**, its true north-east end:
  - The "next roof east of u 12700" is not a separate roof. It is this hall's east slope: one tile surface from the
    north gable peak (12605, 1100) to the right.
  - The **north barge** runs on past part 1's (12750, 1170) in one straight line to the roof's north-east eave corner
    at **(12988, 1258)**, where there is a ridge-end curl at (12960–12985, 1245–1265).
  - The **east eave** runs from that corner down to the left, (12988,1260) → (12850,1340) → (12700,1440). This is
    slope −0.6, parallel to part 1's ridge (−0.56). Along it is a 30–40 px band of boards or laths (t1: "the lattice
    eave from (12700,1472) to (12940,1380)").
  - Under the east eave is an open front: columns at 12690–12700 (part 1) and 12760–12780 (v ~1460 down past 1700),
    a post at 12936–12948 (t1), and tables, benches and a counter at 12700–12910, v 1450–1600 (t1's props).
  - So the hall's east eave lies ~380 px east of its ridge, and part 1's placeholder (ne (12850,1495)) is about right
    in width. The lower roof at 12450–12700 (its top-right corner at (12650–12690, 1418–1455)) is part 1's
    "lower-right eave". t1 reports a small hanging cup or lamp at (12647–12663, 1567–1580).
- **`S4.tree.willow_12588`:** t1 traces its crown to u ~12950. No other trunk shows (t1).
- **Part 1's "roofs behind the pines"** (`map/index.md`): two rows of tile ends seen through the sprays at
  (12700–12790, 335–370) and (12750–12830, 465–545). They are recorded in `S4b.bld.big_roof_hall_12990`'s note, not
  as separate buildings. The far diamond-tiled roof above them is `S4b.bld.far_roof_12930`.

## Seam with S3 (u 15500)

- **`S4b.road.main` at u 15500:** centre **(15500, 1530) est**, edge_n (15500, 1470) est (the low house's south
  front), edge_s (15500, 1605) est (the diagonal hall's north end). All are conf low; see "What was hard". **S3's
  datum** is the centre point: S3's mapper should check it against the riverside hall's front and S3's own road.
- Nothing else of structures_w's crosses u 15500.

## Edges with structures_e (u 14000) and others

These need settling at the merge:
- **`S4b.road.top_street_13700`** is recorded whole by me, from u 13130 to its east end at the bank (~14450, 370),
  because its middle is in my range. structures_e and the river agent should not record it again. The bank path
  beyond is the river agent's.
- **`S4b.bld.top_open_shop_13990`** (u 13875–14105, v 20–150, main point est 13990). structures_e left it to me
  (their note on `S4b.bld.top_shop_14224`).
- **`S4b.bld.roof_behind_trees_13980`** (visible roof 13820–14140, v 230–490, main point est 13995). It sits on the
  boundary. If structures_e also records it, keep one.
- **`S4b.bld.south_hall_13920`**: its north gable peak (14145,1080) and north barge to (14336,1241) lie east of 14000.
  structures_e names this hall as mine. Its footprint overlaps their long hall's.
- **The tea house's terrace front:** my `edge_n` east of 14100 follows structures_e's
  `S4b.str.tea_house_platform_14520` line point for point.

## Supports used

Only `ground`. I recorded no figures. The official hall's floor (0.45 m) is part 1's, and no other raised floor was
found. If the frame wants one, the shop hall's bays are at road level and its tables stand on the ground.

## Scale cues (px, with foot v)

- Shop hall: lintel 842 to table C's leg feet 1060 ≈ 218. Table C: front edge 985 to its feet 1060 ≈ 75. Signboard
  40 × 50 (v 840–890).
- Sedan box: 13062–13145 (83 wide), roof top 955 to feet 1138–1141 (184–186). t1 and t2 agree.
- The wheel lying on the ground (t3's `S4b.prop.loose_wheel_13665`): rim u 13565–13752 (187 across), v ~755–797
  (42 deep). Its ellipse is far flatter than 51.25 px/m depth allows: a local depth compression of ~18 px/m.
- Second palm cart's wheel (t2's): u 13130–13213, v 1425–1642, about 217 px tall.
- Wheelwright shed: post 13965 from the lean-to eave 846 to its foot 1031 (185); post 13873 from 830 to 955 (125).
- Top street: post 14105 from eave 50 to foot 118 (68); post 13690 from eave ~140 to sill ~193 (~55). Both are far up
  the silk.
- Big south hall: south gable width at the tie beam 310 (13560–13870); apex to tie beam ~95.

## Receding-edge table (for the frame's dx_knots)

dx = −51.25 / slope.

**WEST (u 12600–13300).** The nearest edges to the seam are in the table at the top: W1–W7.

- North side group (W2, W4, W5, W7, ground): dx −51 to −62, mean ≈ **−58**. W6 (−92) is short.
- South side group (W1, W3): dx +77 to +119, mean ≈ **+97**.
- High lines that agree with each side:
  - `S4.bld.south_hall_12350`'s ridge (12090,1395)→(12600,1110), −0.56 (+92), and its east eave
    (12988,1260)→(12700,1440), −0.63 (+81): both agree with the south furniture.
  - `S4b.bld.big_roof_hall_12990`'s east edge (12990,380)→(13250,620), +0.92 (−56), matches the north furniture if it
    is a receding verge.
- Not receding (cart axes, which run east and slightly up the silk):
  - the first cart's front frame (12940,1192)→(13067,1160), −0.25 (t1: (13023,1153)→(13073,1180) +0.54);
  - the second cart's shafts (13247,1437)→(13455,1371), −0.32.

**MIDDLE (u 13300–13800).**

- M1, the wheel lying on the ground: the ellipse's long axis tilts down to the right (west end v ~765, east end
  ~783), which gives **dx ≈ −27**. Low confidence: a ±5 px reading moves it over 0 to −60.
- M2, a table on the top street (far up the silk, v ~240):
  - (13570,252)→(13595,235), −0.68 (**+75**);
  - (13635,250)→(13660,232), −0.72 (**+71**).
- High line: `S4b.bld.south_hall_13920`'s ridge (13705,1385)→(14145,1080), −0.69 (+74); the upper band, −0.58 (+88).
- Not receding:
  - the top street's shop front sill (13530,247)→(13790,160), −0.33 (a frontage);
  - `S4b.bld.south_gable_shed_13380`'s ridge, +0.27.

**EAST (u 13800–14150).**

- E1, the wheelwright shed's roofs (high, ~2–3 m), both down to the right:
  - upper (13715,469)→(13838,692), +1.81 (−28);
  - lean-to (13811,692)→(13950,862), +1.22 (−42).
- E2, `S4b.bld.roof_behind_trees_13980`'s west hip (13820,490)→(14020,275), −1.08 (+48): a hip, so it may not
  recede.
- E3, the tea house terrace's front (structures_e's, ground) (14143,1050)→(14300,1150), +0.64 (−80). This may be a
  diagonal frontage rather than a receding edge. structures_e also reads the mat shed's east verge as receding up to
  the left (+2.0).

Reading: by the road on its north side the painter recedes up to the left, and on the south side and far up the silk
up to the right. That looks like a local converging perspective centred near the carts (u ~12900–13300), not one
oblique. A knot list can't fit both sides. The lead decides between a ramp inside S4b, re-knotting part 1, or keeping
31.6 as a stated assumption with these edges as the evidence.

## Left to another agent (seen, not recorded)

- **t1:**
  - the straw shade on a post at 12900–13110 (v 1195–1285): recorded as `S4b.prop.thatch_shade_13049`;
  - the bird in the sprays at ~(12745–12830, 330–360): recorded as `S4b.ani.bird_12827`;
  - the tables, benches and counter under S4's south hall's east eave (12700–12910): recorded;
  - shop table A (`S4b.prop.table_13010`): recorded.
- **t2:**
  - tables B and C (13145–13320, v 905–1060) and the benches in the shop hall;
  - the stall with round goods (13400–13500, v 300–420) and the tables and benches on the top street (13300–13700);
  - the dark patterned shape before the seated man.
- **t2 or t1:** the signboard, if they keep it as a prop; it should be one entity (see above).
- **t2:** the mat awning over the seated man (13123,453)→(13337,727). I recorded it as part of
  `S4b.bld.big_roof_hall_12990` because no poles of its own are drawn. If t2 records it as a prop, keep one.
- **t3:**
  - the pole frame with the hanging basket, the timber pile, the stand with the big round basket, the leaning poles,
    the loose wheel and the goods table: all recorded;
  - the hatched mat at the top row's east end: `S4b.prop.reed_mat_13870`; my points `screen_top`/`screen_low` only
    locate it;
  - the man standing on the road behind the small hipped roof: `S4b.fig.man_looking_up_13755`.
- **t1, t2, t3:** the two straight bare trees (12913–12930, 12964–12989) and the gnarled tree (13000–13080) in front
  of the far roof; the big trees at the shed (13790–14050).
- **structures_e:** every building east of u ~14000 except the four listed under "Edges with structures_e", and the
  tea house and its terrace.
- **The river agent:** the bank path east of the top street's end (~14450, 370).

## Against `reference/scroll/sections.md`

No contradiction. The crowd "under an awning" (≈ 13100–13450) fits: a mat awning hangs along the big roof's east
edge over the seated man. "The wheelwright repairing a wheel (≈ 13550–13750)" fits: a shed opens west onto a yard
where the wheel lies on the ground. "Crossroads ≈ 13100–13600" fits: an open square runs north from the main road at
u ~13390–13700 to the top street.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

> - **Measure receding edges per side of the road, and report the groups apart.** On S4b at u 12600–13300 the shop
>   furniture north of the road recedes up to the LEFT (slope +0.8 to +1.3, dx about −50 to −62). The furniture
>   under the south hall's east eave and the tables far up the silk recede up to the RIGHT at a shallow slope (−0.5
>   to −0.7, dx +71 to +119). The painter converges between them, so a mean across both sides means nothing. Give the
>   lead each group with its stroke points. A sedan or box that shows its west face is a quick check for "up to the
>   left".
> - **Read the other structures agent's part and report before you finish.** Buildings on the split line are easy to
>   leave to each other: a hall whose north peak is east of the line but whose main point is west of it, or an open
>   shop centred on the boundary. On S4b, structures_e named two buildings as structures_w's that structures_w had
>   split or missed. Read the tile agents' "left to structures" lists too: t1's list found a large tiled roof that the
>   restyle had painted over as bare ground.
> - **A roof that runs on past the neighbour's estimated end:** record only the rest. Start its footprint at the
>   neighbour's est corner, and say in the seam note that the builders must join the roofs. S4b.bld.shop_hall_13170
>   continues S4.bld.official_hall_12530's roof to u 13385.
> - **A road's end hidden behind roofs at a seam:** test each reading against the neighbour's buildings. A reading in
>   which the road runs into the next section's hall is wrong. S4b's road bends south of the low house to pass in
>   front of S3's riverside hall.
> - **`scroll_map.mjs <S> overlay` has no `--help`.** Any unknown flag still renders the default overlay into
>   `gen/map/<S>/`, so always pass `--out <your scratch folder>/…`.
