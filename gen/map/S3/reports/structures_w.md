# S3 structures_w: report

Unit `structures_w`, round 2, 2026-10-12. Owns buildings, structures, roads and ground with their main point in
u 15500–18000 (looked at 15350–18150), plus `S3.road.main` for the whole route. Part: `gen/map/S3/parts/structures_w.json`
(19 entities). `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/structures_w.json`: **PASS**. Crops:
`gen/map/S3/look/structures_w_*.jpg`; self-overlays `structures_w_self_*.jpg`. Script:
`scratchpad/S3_structures_w/make_part.py`. This replaces the first attempt, which failed at start.

## Counts

| kind | n | entities |
|---|---|---|
| building | 11 | `tavern_river_hall_15540`, `tavern_wing_16300`, `tavern_rear_hall_16560`, `tavern_gate_16870`, `far_house_16560`, `far_shop_17170`, `far_shop_17290`, `far_shop_17575`, `far_shop_17725`, `far_hall_17875`, `mat_shed_17590` |
| structure | 4 | `cailou_huanmen_16880` (the set piece), `chazi_barrier_16800`, `gate_fence_16955`, `far_wall_16895` (faint, conf low) |
| prop | 1 | `shiqian_jiaodian_lampbox_17034` (may duplicate t3's) |
| road | 2 | `S3.road.main` (route, whole area), `S3.road.tavern_front_16620` (side street, conf low) |
| group | 1 | `S3.grp.shiqian_jiaodian_16800` (the tavern: 8 members) |
| grd | 0 | the banks are the river agents'; no other ground feature is painted in my range |

Supports used: `ground` only. For the tiles: the riverside hall's upper floor is `upper floor: S3.bld.tavern_river_hall_15540`
(floor line below).

## The riverside hall: two storeys, and 十千脚店's 楼 (the test)

**Two storeys: yes (conf med).** Under the balcony railing there is no ground, step or column foot. Directly below it
(u 15955–16300 only) are a beam (v 1508–1512), a plain platform band (1512–1548) and a tiled roof slope (top 1550–1556,
tile ends 1645–1655, eave 1665–1670 with drip tiles). A roof below a floor makes the floor an upper floor: a balcony
platform (平坐) over the lower storey's pent eave (腰檐). The band and the pent roof begin and end together (15955–16300),
which a separate building in front would not do. The lower storey's walls are not painted (bare trees and plain silk
below the pent eave, and the silk's edge); west of 15955 nothing is painted under the railing but branches.

**Floor line** (for `upper floor: S3.bld.tavern_river_hall_15540`): the balcony's bottom rail and floor beam at
**v 1467–1487 over u 15750–16330** (≈1475), about 1455–1460 at 15600–15750 (behind branches). Railing top rail
v 1425–1430; window sills ≈1400. The ground straight below is hidden: est **v ≈ 1770**, so the floor is ≈ **3.8 m** up
((1770 − 1475)/77). It fits a pent eave ~1.5 m below the floor that projects ~1.5 m. That is a builder's choice, and it
is the H the frame should give this support. The east side gallery's floor runs (16330,1500)→(16520,1350).

**十千脚店's 楼: read so, conf med-low.** It is the only two-storey building near the gate (刘涤宇: the tavern is
two-storey, `sections.md:109`). Its east gallery abuts the tavern's wing (`S3.bld.tavern_wing_16300`). No wall, lane or
gap is painted between it and the wing and gate. Diners sit at its windows. A separate restaurant beside the tavern
cannot be excluded. The tavern complex is therefore u ≈ 15510–17330: the hall 15510–16440, the wing and the rear hall
16300–16890, the gate under the 彩楼欢门 16800–17330.

## 十千脚店: wing, rear hall, gate

- **The wing** (`tavern_wing_16300`): a roof seen from above whose ridge runs **back** (north): south ornament
  (16420,1470) to a finial at (16710,1160). Its east eave runs (16880,1508)→(16602,1787), with its SE corner at the silk's
  edge. No wall of it is painted: under its east eave is bare ground with the 杈子 barrier. I therefore put the
  placeholder's east wall where its foot is hidden behind the roof. Facing east (to the forecourt; a reading).
- **The rear hall** (`tavern_rear_hall_16560`, conf low): an E-W ridge v 1212–1228 (16462–16795) with a knob ornament
  at (16795,1190), seen above the wing's roof. It is either a separate hall behind or the wing's own north cross-wing
  (a T-plan).
- **The gate** (`tavern_gate_16870`, faces south): the roof's red fascia runs along the west hip (16800,1230)→(16870,1370),
  the front eave v 1372–1378 (16870–17150) and the east eave (17150,1372)→(17330,1185). Other parts:
  - a valance of fine hatching (v 1385–1450);
  - a **hanging post (垂柱)** at 16910–16925, ending in a knob at v 1545 in mid-air;
  - posts to the ground at 17072, 17100–17112 and 17136–17164;
  - a striped curtain, gathered (17180–17260, v 1380–1650);
  - three boards with characters, all **illegible**: □□□□ at 17145–17170, □□ at 17277–17307, □□ marks at 17010–17035.
    The scholarship's 天之/美禄 can't be confirmed at zoom 3, so I copied □.
- **The 脚店 sign** (`shiqian_jiaodian_lampbox_17034`): an upright board with a decorated crown, 17000–17068,
  v 1548–1690. It reads in two columns: large **脚店** (left) and small **十千** (right, top), "十千脚店". 十千 is faint
  (med conf). The restyle rewrites the characters, so I copied them from the scan. It stands at the west part of a
  **fence of vertical bars** across the gate's front (`gate_fence_16955`, 16955–17165, v 1680–1790). I record it as a
  prop because it may stand on its own: t3 may have it too.
- **The 杈子 barrier** (`chazi_barrier_16800`): a low barrier of crossed bars between two rails. It runs back from the
  silk's edge to the gate's west corner: top rail (16740,1775)→(16955,1560), foot (16820,1788)→(16956,1636), ≈1.2 m
  tall. It is the best ground-level receding edge in my range.

## 十千脚店's 彩楼欢门, pole by pole (`S3.str.cailou_huanmen_16880`, set piece)

It stands **on the gate's roof**, not on the ground. Its base corners are the gate's footprint (est). The custom `pts`
hold each pole's top, and its foot where it is lost in a tier or behind the lattice base.

- **Base:** a diamond-lattice parapet, 16880–17113, v 1255–1320 (≈6.2–7.0 m above the est ground at v 1795). The base's
  east part follows the gate's east eave up to ≈(17330,1185).
- **Tiers of cross-bars:**
  - v 984–990 (16880–17274);
  - v 1040–1046 (16851–17315): the widest; the outward fans spring from its ends;
  - v 1072–1078 (16880–17315);
  - v 1116–1125 (16880–17315).
- **Poles**, west to east (tops ±5 px; feet est):

| pole | top | foot (where lost) | form |
|---|---|---|---|
| 1 | (16877, 652) | (16893, 1255) est | tall single pole, slight west lean |
| 2 | (16820, 870) | (16895, 1040) | fans out west from tier 2 |
| 3 | (16808, 943) | (16870, 1045) | fans out west, lower |
| 4 | (16923, 809) | (16925, 984) | A-frame (legs 16910/16940), tie at v 920 |
| 5 | (16942, 759) | | leans west off the west spire |
| 6 | (16945, 856) | | short leaning pole |
| 7 | (16976, 659) | (17000, 956) | west spire: bound poles, many ties, base 16958–17045 |
| 8 | (17015, 532) | (17035, 1255) est | second-tallest plain pole |
| 9 | (17055, 711) | | A-frame leaning east, knob top |
| 10 | (17087, 622) | (17110, 980) | tall plain pole |
| 11 | (17120, 610) | | middle spire, paired ties |
| 12 | (17166, 606) | | east spire |
| 13 | (17200, 697) | | A-frame |
| 14 | (17221, 722) | | short spire |
| 15 | (17230, 499) | (17252, 860) | **tallest**, plain, wrapped joint v 805–850 |
| 16 | (17280, 795) | | fans out east |
| 17 | (17310, 742) | (17250, 930) | fans out east from the tiers' east end |
| 18 | (17334, 796) | | fans out east, lowest |

- **Hung on it:** no flowers, streamers or lamp-boxes, only lashings. The curtain and the boards hang on the gate below.
- **The 新酒 bar:** its west end **is tied into the scaffold's east side.** The bar runs at v 900–912 from inside the
  scaffold (u ≈ 17240–17300) east to a tip at ≈17585, just short of the pole at 17615. A stay runs from (17500,880) up to
  the pole.
- **Height:** the tallest top is 16.8 m above the est ground at the front (back poles stand further north). The brief's
  "tallest at ≈17220, v 300" is wrong: it is (17230, 499).

## The far bank (north), u 16550–18205

- `far_house_16560`: a tiled house among the willows (eave v 120–132, 16736–16888; posts 16752, 16778, 16848, 16870).
  Its front has a board panel, and there is a plank terrace rail at v 200–215 along the bank. Its west part is behind
  the willow crowns.
- `far_wall_16895` (conf low, faded): a coping line v 112–125 (16900–17060) ending at a two-post frame (17066/17090). It
  is either a low yard wall with a gate, or a shrub line plus a stand. The restyle paints a wall with a door; I recorded
  it so the merge decides.
- `far_shop_17170` (conf low): a canopy edge on posts (v 85–90) under the big willow, over tables. Its roof is hidden by
  the willow's crown, so it may be a free-standing canopy (then t3's).
- One long tiled roof (v 15–80) covers 17290–18205, split by its fronts:
  - `far_shop_17290`: tables under a mat canopy, v 88–118;
  - `far_shop_17575`: a short canopy, basins;
  - `far_shop_17725`: a front of two rows of diagonal lattice;
  - `far_hall_17875`: an open hall with a counter and a lattice balustrade along the bank, v 175–200. It runs to 18205,
    into structures_e's look range. I own it by its SW corner.

Back corners are est (~100 px of v north, +95 u, the top-of-silk convention from S4).

## The south bank's shed

`mat_shed_17590`: a flat woven-mat roof on posts. Front edge (17590,1090)→(17865,1085), back edge
(17640,945)→(17905,935). There is a stall with jars under it, and its west front corner meets the 新酒 pole. The brief
calls it a shed, so I recorded it as a building. It may be an awning on poles (then t4's prop), so the merge keeps one.

## `S3.road.main` (the whole route)

**West of u 17300 nothing of the road is painted.** I weighed two readings:

- **(c) used: a riverside road behind the tavern**, at v ≈ 1215–1240 between the bank and the backs of the hall, the
  wing, the rear hall and the gate (all hidden by roofs and the scaffold). For it:
  - S4b's visible open ground at the seam (u 15000–15450, v 1050–1250, with a figure at (14950,1240)) continues straight
    on;
  - it comes into view under the 新酒 banner (17300–17600, v 1100–1350);
  - it stays on the silk, inside the painted area, with no jog at the seam.
- **(b) a street in front of the tavern.** The gate, its lamp-box, the fence, the 杈子 and the rider all face south to
  the silk's edge. West of the gate, though, that street lies below the silk's edge (v ≈ 1850–1950, outside the painted
  area), and it would need a hidden ≈12 m southward turn at the seam. Its visible part is recorded as
  `S3.road.tavern_front_16620` (conf low).

**The lead decides.** The builder should not lay a road surface through the hidden stretch before that decision.

Centre points, west to east:

| # | point | note |
|---|---|---|
| 0 | (15500,1240) est | **S4b seam: my reading** |
| 1–5 | (15800,1235), (16200,1225), (16600,1215), (17000,1215), (17300,1240) | est, hidden |
| 6–7 | (17500,1300), (17700,1320) | between the shed's customers (v ≤ 1300) and the 串车 (v ≥ 1370) |
| 8–10 | (17950,1260), (18200,1090), (18450,870) | 10 is where the route leaves the ground, est |
| 11–16 | (18700,560) … (20010,315) | **deck placeholder** |
| 17–18 | (20200,290), (20350,270) | north bank |
| 19 | **(20500,258) est** | **S2 seam** |

- **Seam with S4b (u 15500):** centre (15500,1240), edge_n (15500,1060) (willow trunks, the bank), edge_s (15500,1300)
  (the ridge of S4b's south roof at 15330–15500, v 1220–1260). The merge sets point 0 to S4b's point. Report the
  difference.
- **The deck stretch** (points 11–16 and the matching edge points) is my placeholder from a low-zoom look. The route
  leaves the ground at ≈(18450,870) and lands at ≈(20010,315). The merge replaces it with the bridge agent's deck centre
  line and edges.
- **The north bank:** the route runs between the fronts of structures_e's north-bank shops and tavern (v ≈ 215–250) and
  the bank's edge over the boat moored along it (v ≈ 280–335). That strip is only 80–120 px of v (1.6–2.3 m at
  51.25 px/m): a real-size problem for the frame. The last point is **exactly u 20500: (20500,258) est, edge_n
  (20500,215), edge_s (20500,280)**. S2's willow trunk stands at 20505–20583 with its base at v ≈ 280, so the route ends
  just north-west of its foot.

## Receding-edge table (for the dx knots)

Only two kinds of ground-level edge exist in my range: the barrier and the far-bank tables. The 串车 lies oblique to the
receding direction, and the shed and awning edges are mats in the air.

| edge | (u1,v1) → (u2,v2) | dv/du | dx = 51.25/|slope| | level |
|---|---|---|---|---|
| 杈子 barrier, foot | (16820,1788) → (16956,1636) | −1.12 | 45.8 | **ground** |
| 杈子 barrier, top rail | (16740,1775) → (16955,1560) | −1.00 | 51.3 | 1.2 m |
| far-bank table 1, east edge | (17464,141) → (17482,125) | −0.89 | 57.7 | ground furniture, short (±0.3) |
| far-bank table 2, west edge | (17505,150) → (17520,135) | −1.00 | 51.3 | ground furniture, short |
| wing's east eave | (16880,1508) → (16602,1787) | −1.00 | 51.3 | eave, high |
| wing's ridge | (16420,1470) → (16710,1165) | −1.05 | 48.8 | ridge, high |
| gate's east eave | (17150,1372) → (17330,1185) | −1.04 | 49.3 | eave, ~5.6 m |
| hall's east gallery, top rail | (16310,1440) → (16500,1280) | −0.84 | (61) | upper floor, flattened |
| hall's east gallery, floor | (16330,1500) → (16520,1350) | −0.79 | (65) | upper floor, flattened |
| mat shed, west edge | (17590,1090) → (17640,945) | −2.9 | (17.7) | mat roof in the air; disagrees, don't use |

**What it says:** in the tavern area (u ≈ 16800–17500) the ground edges slope **−1.0 to −1.12**, so dx ≈ **46–51 px/m**.
The high lines here agree (−1.0 to −1.05), unlike S4, where high lines flattened to −0.6. That is far from S4b's seam
knot of 31.6 at 12600. **For the lead and the frame agent:** a knot of ≈48 near u 17000 means a large drift across S4b
or a ramp inside S3. Use the barrier's foot (−1.12) as the best single reading. The building placeholders in this part
use dx 49.

## The diminution (my sample; the tiles' parts had not landed)

| foot v | painted height (px) | figure | vs ~190 at the road |
|---|---|---|---|
| ~1785 | 190 | man with a child, 17545–17610 | 1.0 |
| 1727 | 177 | man in a hat with a sieve, 17710–17790 | 0.93 |
| 1400 | 195 | man in the open ground, 17853–17907 | 1.03 |
| ~1310 | ~205 | dark-robed man, 17907–17973 (foot est) | 1.08 |
| ~810 | ~136 | standing porter on the unloading boat, 17840–17880 (boat deck) | 0.72 |
| ~305 | ~75–80 | crew on the boat under way, 15630–15690 (boat deck) | 0.4 |
| ~160 | ~65–70 | standing man at the far-bank willow shop, 17165–17200 | 0.35 |
| ~115–130 | ~35 bent (≈40–45 upright) | trackers, 16320–16430 | ~0.22 |

- **Compared with S4** (0.9 at 850, 0.5 at 320, 0.3 at 220): S3's figures shrink faster in mid-river.
- **The upper-floor diners** (seated ~100 px head to seat) are painted ≈1.4× the frame's 77 px/m.
- **Figures on the road** do not shrink between v 1785 and 1300.

## Seam notes

- **S4b (u 15500):**
  - the willow with its trunk at u ≈ 15430–15480 (S4b's) runs down to v ≈ 1250, its base hidden behind S4b's south
    roof. Its crown covers the hall's roof west of ≈15650: the hall's ridge west end (15644) and west hip are read
    through it;
  - S4b's south building (tiles over 15250–15580, v 1300–1790; ridge (15250,1450)→(15500,1310), north hip
    (15500,1310)→(15580,1440)) stands in front of the hall's west end. Its main point is west of 15500, so it is S4b's;
  - a roof at 15320–15500, v 1220–1450, behind the willow, is S4b's;
  - the biggest rafted boat's cabin roof reaches ≈15560 (v 620–760): S4b's river;
  - the road at 15500: see above.
- **S4b's road at the seam:** if S4b's structures agent puts its road's east end at the bottom of the silk (reading b),
  the merge should tell S3's frame step. Point 0 is S4b's call either way.
- **structures_e:**
  - `S3.bld.far_hall_17875` runs to 18205 and is mine by its SW corner;
  - the curved-canopy structure at 18200–18350 (v 40–210) and the long open hall from ≈18350 are theirs;
  - the route's north-bank stretch passes in front of their north-bank tavern and shops (fronts at v ≈ 215–250):
    please check that my edge_n stays south of your fronts;
  - the bottom roofs from ≈18420 bound my edge_s at (18420,1480).
- **S2 (u 20500):** the route's last point is (20500,258) est, next to S2's willow (trunk 20505–20583, base ≈ v 280).
- **bridge:** I need the deck's centre line and edges, and where the deck leaves the ground at the south foot (my guess
  is ≈(18450,870)) and at the north landing (≈(20010,315)).

## Painted things I saw and LEFT TO another agent (with points)

- **t1 / t2: on the hall's upper floor** (support `upper floor: S3.bld.tavern_river_hall_15540`, floor v ≈ 1475):
  - a standing figure in the doorway, 15800–15855, v 1300–1385, holding a cup?;
  - a small figure or carving at 15570–15590, v 1400–1440;
  - two diners at 16030–16095 (heads v ≈ 1310–1320) and one at 16160–16200, v 1300–1430;
  - the table with dishes at 16100–16190, v 1380–1400, and the table in the open panel at 15700–15770, v 1360–1390
    (props on the upper floor);
  - the figure in the east gallery, 16340–16395, v 1265–1360.
  - The small hanging cloth at 16110–16125 is part of the hall.
- **t1 / t2: trees.**
  - the bare stiff-twigged trees behind and beside the hall (16100–16700, v 350–1000);
  - the bare trees at the bottom edge (15550–16000 and 16300–16600, v 1450–1790; a trunk at ≈15733–15783 to the silk's
    edge);
  - the willows over the far house (16450–16700, v 0–250).
- **t2:** the trackers on the far-bank shoal (16320–16430, v 50–130).
- **t3:**
  - the rider and horse at the gate (17170–17360, v 1550–1790);
  - the big parasol stall east of the gate (17320–17480, v 1170–1390);
  - the figure behind the lamp-box (17076–17100, v 1560–1640);
  - the far-bank willow (trunk 17140–17180, base v ≈ 240–290) and its people and tables (17170–17300, v 90–180);
  - the stand at 17060–17110 (v 104–160), if the merge reads `far_wall_16895`'s gate frame as a stand;
  - the 十千脚店 lamp-box, which I recorded too (the merge keeps one).
- **t4:**
  - the 新酒 pole (17610–17630; crossed frame v 784–844, vane v 700–736; foot hidden at ≈1290–1400) with its bar
    (v 900–912, west end tied into my scaffold) and banner (17425–17560, v 905–1120);
  - the stall with jars under the shed (17630–17710, v 1140–1240) and its customers;
  - the 串车 (17430–17790, v 1310–1560);
  - the black donkey (17850–17950, v 1480–1650);
  - **the lattice-mat awning on posts over a stall east of the shed** (17840–18150, v 920–1090; a post at ≈17874,
    v 1050–1150). I left it as an awning prop (t4/t5 by its main point). The goods stall under it is at 18030–18200,
    v 1000–1150.
- **t5:** the big ribbed parasol at 18000–18220, v 870–990 (centre ≈(18160,910)), unless it belongs to a boat (river_w).
- **t2 / t3 / t4: far-bank props.**
  - tables and benches at 17400–17465 and 17505–17570 (v 130–181);
  - a seated man at 17320–17340;
  - basins and a figure at 17660–17720 (v 100–160);
  - the seated man at ≈18010 (v 110–145) and the tables at 18050–18200 (v 120–165) in `far_hall_17875`. The counter is
    part of the hall.
- **river_w:**
  - the boats moored along the far bank in front of the shops (16600–18300, v 130–400);
  - the masted boat and its line toward the trackers;
  - the unloading boats at the south bank (17650–18100, v 700–950) with the porters on them;
  - the far-bank shoal or bank top under the trackers (16200–16500, v 100–250);
  - the south shore behind the tavern (hidden; its water reaches v ≈ 950 in front of the scaffold's lower poles at
    16850–17300).

## What was hard

- **The road west of u 17300.** It is entirely hidden, and the two readings disagree by ≈12 m. I chose by the
  painted-area rule (the route stays on the silk) and S4b's visible ground at the seam.
- **The tavern's plan.** The roofs aren't projectively consistent. The wing's ridge-to-eave offset at its north end
  (170 px of u, 343 of v) would mean a 2.2 m half-width under a 4.5 m rise. No wall of the wing is painted where its
  eave says it should stand, so every footprint here is a placeholder. The roofs, eaves, ridges and the barrier are
  measured.
- **The 彩楼欢门:** about 18 poles plus spires that overlap. Tops are good to ±5 px; feet are mostly lost in the tiers.
- **Writing:** the gate's boards are illegible at zoom 3. The lamp-box's 十千 is faint.
- **The far bank:** at the silk's top, buildings are 60–100 px tall and their fronts are cut by the moored boats' masts
  and cabins.

## Contradictions with `reference/scroll/sections.md` and the brief

- **Where the tavern is:** sections.md puts the tavern at "≈ 15500–16800". The complex reads as 15510–17330: the hall
  from 15510, the wing, rear hall and gate 16300–17330, the scaffold 16800–17340.
- **The scaffold's top:** the tallest pole tops out at (17230, **499**), not v 300 (the brief).
- **The lamp-box:** it reads 十千 / 脚店. "十千" is present, faintly, in a small right-hand column.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Test an upper storey by what is under the floor, not by the figures on it.** On S3 the riverside hall's railing
  has no ground under it: a platform band and a tiled pent roof with drip tiles (平坐 over 腰檐) sit directly below and
  share its ends, so the floor is an upper floor. Give the floor line, and the est ground under it, as two numbers.
- **When the route is hidden, choose the reading that keeps it on the silk.** A route below the silk's edge leaves the
  painted area. Record the other reading as its own side street, with conf low, so the lead can swap them.
- **Footprints must not cover painted bare ground.** If no wall is painted where a roof's eave says it should stand,
  put the placeholder wall where its foot would be hidden behind the roof, and say so.
- **Record a scaffold pole by pole as custom points** (`poleN_top`, `poleN`), with its tiers as `tierN_w`/`tierN_e`.
  Its base corners are the building it stands on, and the heights above the ground go in the note.
- **Compare the high lines with the ground edges before you discard them.** Around 十千脚店 the eaves and ridges slope
  like the ground barrier (−1.0 to −1.1), unlike S4's flattened high lines. Say so; it is evidence for the knot.
