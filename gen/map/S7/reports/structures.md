# S7 structures: report (2026-10-12)

Unit `structures`, u 815–2000 (looked at 800–2150). File: `gen/map/S7/parts/structures.json`.
`node tools/scroll_map.mjs S7 check --parts gen/map/S7/parts/structures.json`: **PASS**. Overlays read:
`gen/map/S7/look/structures_self.jpg` (the whole area, zoom 0.6), `structures_self_front.jpg` (the gate and the shop
front, zoom 1.2) and `structures_self_south.jpg` (the south side, zoom 1.1). Every measured marker sits on its stroke;
the roofs-only footprints are placeholders by design, and their notes say so. My crops are under
`gen/map/S7/look/structures_*`. My scripts (a sharpened greyscale zoom of the scan and a mosaic crop with a grid) are in
`scratchpad/S7_structures/`.

## Counts

17 entities: 9 buildings, 5 structures, 1 road, 2 groups, 0 ground features. No raised step, platform, drain or yard
is painted at street level. The gate hall and the shop floors are at street level.

## The buildings in order along the street

North side, west to east:
1. `S7.str.fence_960`: a low railing, u 906–1060, foot v 883. Posts with caps at about 909 and 992, and a third at
   about 1060 behind the seated gatekeeper. Rails at v 813, 842 and 876–883.
2. `S7.bld.gatehouse_1240`: the gate hall 门屋 of 官宦人家 (pin 49).
   - The front is at v 897 and the eave at 587–597, from u 1067 to about 1417. The ridge is at v 466.
   - The open passage runs u 1205–1350, under a lintel at v 650.
   - The west column stands on `S7.str.gate_block_1160`. A matching block, `S7.str.gate_block_east_1345`, is only faint
     behind the man pointing the way (conf low).
   - Inside, two hanging lamps or hooks at (1248, 682) and (1337, 680), and a low railed partition at the back
     (u 1262–1326, v 707–759).
   - The west bay has a plain wall and a slatted blind high under the eave. No writing.
3. The compound's halls behind it, all roofs only:
   - `S7.bld.compound_hall_1420`, the middle hall: ridge v 322–345, u 1150–1700, with an ornament at its east end.
   - `S7.bld.main_hall_1300`, the main hall at the top: 歇山, ridge v 36, eave v 228, east gable at u 1535–1600. Its
     front shows the patterned panel.
   - `S7.bld.far_gable_1345`: a gable apex cut by the silk's top edge at u 1345 (conf low).
   - `S7.grp.guanhuan_compound` holds the gate hall, both blocks, the fence and these three halls.
4. `S7.bld.hall_ns_1620`: a long hall running back north.
   - Its ridge runs (1506, 320)→(1748, 18) in the receding direction.
   - The broad east slope carries a tall pale chimney or vent (u 1760–1791, v 186–268) and the black bird (t2's).
   - It could belong to the compound or to 赵太丞家, so it is in neither group.
5. `S7.bld.zhao_taicheng`: 赵太丞家 (pin 48).
   - Open front between columns at u 1488 and about 1760, feet at v 897. Eave at v 597, ridge at v 508.
   - The four name tablets hang under the eave, and the board 五勞七傷□□□ is fixed to the west column.
   - The back counter's foot is at v 797.
   - `S7.bld.zhao_back_hall_1630`: ridge v 375, u 1490–1775. `S7.grp.zhao_taicheng_house` holds both halls.
6. `S7.str.box_shed_1855`: a box-like structure east of the shop, behind the bucket man (conf low).
   - Its top is a slanted parallelogram at u 1813–1904, v 726–749, with a slatted front near its foot.
   - It is either a small shed or booth, or a set-down chest, tank or covered sedan.
   - This is the "small dark roof (1880–1960, v 735–805)" in S6's note.

South side, west to east:
7. `S7.bld.hip_gable_1360`: an east-west ridge at v 1290–1296 (u 1295–1430) and its east 山花 at u 1425–1530
   (tie beam at v 1425).
   - The south slope runs down into the bottom trees.
   - Placeholder north wall at v 1440.
8. `S7.str.gate_roof_1475`: the small roof on posts (u 1335–1625, ridge v 1178, south eave v 1290).
   - It stands just north of the hip-gable building and is probably that building's street gate.
   - Its posts are hidden behind that building's roof and gable.
   - The official's horse is behind it, in the street.
9. `S7.bld.jie_building_1800`: the 解 building.
   - Its gable end faces the street. The ridge runs from the north end (1796, 1264), under an ornament, down to (1454,
     1652) and beyond.
   - North-east eave corner at (2000, 1360), with a corner ornament. The east eave runs (1941, 1517)→(1815, 1598).
   - One east post at u 1922–1941, from the eave at v 1517 to its foot at about 1728 (est).
   - **The "corner building" S6 names is this building's north-east end, not a separate building.**

## Boards and writing (all copied from the strokes; □ = unreadable)

- **赵太丞家's name board** is four separate lozenge-shaped tablets, not one horizontal board. They hang under the eave
  between ornamented bracket clusters at v 612–650. Read east to west: **趙** (u 1700–1740), **太** (1625–1668),
  **丞** (1545–1585), **家** (1458–1498). Nothing else is written there: the marks between the tablets are bracket
  ornaments.
- **The board fixed to the front of the west column** (u 1458–1486, v 675–820) reads, top to bottom:
  **五勞七傷□□□**.
  - The first character is very probably 五. 勞, 七 and 傷 are clear.
  - The last three are unreadable at the scan's resolution: a 言-radical character (諸?), a 氵-radical character (湯?),
    and one with 言 or 氵.
  - Crops: `structures_board_front_z5.jpg` and `structures_board_front_z8.jpg`.
- **The gate hall**: no board or writing.
- **The main hall's patterned panel** (u 1130–1315, v 258–332) holds about 6 × 14 small repeated motifs. They are too
  uniform to be characters.
  - In its lower middle is a dark upright rectangle (u 1240–1257, v 300–332), with a thin curved outline running out on
    both sides.
  - Two readings, recorded in the entity: a patterned curtain or screen across an open front, tied or with a dark
    doorway behind it; or a patterned wall or lattice window.
  - No faces are painted at it.
- **The 解 plaque** is S6's (u 2005–2058, as the setup agent and S6 found). See the seam note on the bar.

## Receding-edge table (for the frame's dx_knots; slope = dv/du, dx = −51.25 / slope)

| group | edge | from → to | slope | dx px/m | weight |
|---|---|---|---|---|---|
| west | gate block, east face foot (`S7.str.gate_block_1160`) | (1191,899)→(1221,875) | −0.80 | 64 | ground, good |
| west | gate block, east face top (0.6 m) | (1191,852)→(1221,828) | −0.80 | 64 | same face |
| west | gate passage's west wall foot (to the partition's west post) | (1204,899)→(1258,800) | −1.83 | 28 | low: the partition may stand inside the back |
| middle | bench by 赵太丞家's east board, seat edge (~0.45 m; t2's prop) | (1734,831)→(1767,802) | −0.88 | 58 | near ground, good |
| east | S6's 解 board feet (`S6.prop.jie_signboard_2085`), if the board stands square to the street | (2050,1768)→(2120,1708) | −0.86 | 60 | ground, S6's points |
| east | S6's well platform plank joints | (1950,968)→(1970,924); (1980,966)→(1996,940) | −2.2; −1.6 | 23; 32 | low: drawn from above (S6 found the same) |
| high | north-south hall's ridge | (1506,320)→(1748,18) | −1.25 | 41 | high line |
| high | north-south hall's west eave | (1380,323)→(1615,97) | −0.96 | 53 | high line |
| high | north-south hall's east eave | (1771,345)→(1857,241) | −1.21 | 42 | high line |
| high | 解 building's ridge | (1796,1264)→(1454,1652) | −1.13 | 45 | high line |
| high | 解 building's east eave, straight part | (1941,1517)→(1815,1598) | −0.64 | 80 | eave ~2.7 m, corner upturn excluded |

- **Ground-level edges are scarce.** The street is lined with open fronts, and the south side is all roofs and trees.
  The three good ones (block, bench, board feet) agree: −0.80 to −0.88, mean −0.85, so **dx ≈ 60 px/m** against the
  seam knot's 50.4.
- **The high lines are steeper here** (−0.96 to −1.25, dx 41–53), the opposite of S4's pattern, where high lines were
  flatter.
- **For the frame agent:** the evidence is three small objects. Either add a west/middle knot near 60 (u ≈ 1200 and
  ≈ 1750) or keep S6's 50.4 constant and record the three edges as the residual. I lean to keeping 50.4 unless the tile
  agents' edges (benches, the stand, the gatekeeper's seat) also come out near −0.85.
- No wall foot recedes visibly anywhere in S7.

## Scale cues (px)

- **Gate hall:**
  - Passage 145 wide.
  - Lintel 249 above the floor; eave about 300 above the front; ridge about 130 above the eave.
  - West column 13 wide.
- **Gate block:** 60 wide, 47 tall (0.78 × 0.61 m), 30 deep in u.
- **Railing:** 89 tall; posts 83 apart.
- **赵太丞家:**
  - Columns 272 apart (3.5 m).
  - Beam underside 232 above the floor; eave about 300 above the front.
  - Tablets about 40 × 30; fixed board 28 × 145.
  - Back counter 64 tall, about 100 px of v behind the front.
- **解 building:** east post 211 tall (eave about 2.7 m at 77 px/m).
- **Small gate roof:** ridge about 220 long; ridge 112 above the south eave.

## The silk's edges

- **Cut edge** (where the painted silk starts, inside the white mounting):
  - u ≈ 808–810 at v 100;
  - u ≈ 812 at v 900 (under the seals);
  - u ≈ 820 at v 1700.
  - The edge leans about 10 px east toward the bottom.
- **Bottom edge:** v ≈ 1770 (1767–1772 measured at u 850, 1100, 1500–1800 and 1950). Below it a narrow strip of
  different silk runs to v ≈ 1780.
  - The layout tool's `SILK_BOTTOM = 1790` is about 20 px low for S7 (for the lead).

## Seam notes (by S6 ID, for the lead)

- **`S6.road.main`:**
  - `S7.road.main` ends exactly at centre (2000, 1180), with `edge_n` (2000, 800) and `edge_s` (2000, 1300), as asked.
  - edge_n v 800 stands. The line at v 787–793 from u 1904 to 2013 is the top of the pale mass in front of the house.
    The house's real wall foot is hidden behind it and is probably at about 800.
  - **edge_s:** v 1300 is the visible line where the street's figures stop, not the 解 building's north wall. That
    wall is hidden behind the building's own roof. From its north-east eave corner (2000, 1360) and the 211-px eave
    height of its east post, the wall foot is at about **v 1575**.
  - So the ground hidden behind the south roofs may make the street up to about 5 m deeper at u 1640–2000. S6's own
    note asks the same about its south houses.
  - I kept S6's convention and put the hidden-wall estimates in the building notes.
- **`S6.prop.mat_awning_2000`:** the posts at u 1918–1936 are **the 解 building's**, not the awning's.
  - One post (two outlines, u 1922–1941) stands under the building's east eave, from v about 1517 to its foot behind the
    tub (about 1728). That is about 350 px south of the mat's front edge (v 1365–1370).
  - The mat's west end shows at **u ≈ 1858** (a rounded edge, v 1252–1290) above the 解 roof's north verge.
  - Its south-west corner rests on the roof's north-east corner (2000, about 1360). No awning post stands west of
    u 2000.
- **`S6.prop.jie_signboard_2085`:**
  - The board's top edge leans on the 解 building's east eave at (1940, 1459)–(1996, 1400), just south of the corner
    ornament (2000, 1360).
  - Its long edges run to the feet (2060, 1768) and (2124, 1705). These agree with S6's (2050, 1768) and (2120, 1708).
  - **The bar at v ≈ 1520–1525 starts at the building's post** (u ≈ 1942) and runs east past both board edges (about
    1964 and 2046 at that height) to u ≈ 2062. It reads as an arm fixed to the building's post that carries the plaque
    in front of the leaning board.
  - So the plaque is the building's sign. Its bar's west 58 px lie in S7.
  - Proposal: keep the bar and plaque in S6's entity, since S6 builds them, and fix the bar's west end to
    `S7.bld.jie_building_1800`'s east post at about (1935, 1522).
- **`S6.bld.house_well_2020`:** its eave and its tile-end discs start at **u ≈ 1963–1967** (v 655–668), not 2020.
  - Plain silk follows to the west to u ≈ 1920 (v 670–790), which may be its wall running on.
  - Its wall foot is hidden behind the pale mass, whose top line is the v 787–793 line S6 read as the wall foot.
  - The "small dark sloping roof (1880–1960, v 735–805)" in its note is `S7.str.box_shed_1855` (u 1793–1919).
- **`S6.str.square_well_2000`:** the platform's front edge (v ≈ 998) reaches west to **u ≈ 1903**, under the low
  bucket at 1922, not 1955.
  - Its plank joints run up-right at −1.6 to −2.2 (drawn from above, as S6 found on its east side).
  - The back edge's west end is hidden behind the hooped buckets.
- **`S6.bld.far_house_1859`:** its west gable shows at u ≈ 1800–1880, v ≈ 10–90: apex at about (1825, 12), king post
  at u 1822–1828, tie beam at v about 85. It stands just east of the north-south hall's ridge end (1748, 18). Nothing
  of the far house shows west of u ≈ 1795.

## What was hard or ambiguous

- **The roof stack at the top** (u 1000–1900, v 0–620).
  - I sorted it by ridges: a double line with tiles on both sides, often with an end ornament. Six roofs in depth
    order: the gate hall and the shop; the shop's back hall; the middle hall; the north-south hall; the main hall; the
    far gable.
  - Every footprint there is a placeholder. One rule is applied to all of them and stated in each note: frontage from
    the visible ridge or eave ends, a depth band ordered by the ridges' v, corners shifted by dx 50.4.
- **The south side.**
  - The gate roof, the hip-gable building and the 解 building overlap as seen from above, and none of their walls or
    posts show except one 解 post.
  - Their order (gate roof north of the hip-gable building, the 解 building with its gable end to the street) comes from
    occlusion: the hip-gable roof hides the gate roof's posts, and the 解 roof hides the ground north of its wall.
- **`S7.str.box_shed_1855`** (conf low, two readings in the entity). The pale mass in front of it is t2's.
- **`S7.str.gate_block_east_1345`** (conf low): one stroke edge, plus the restyle's grey block.
- **The main hall's patterned panel** (two readings in the entity).
- **The gate passage's back partition** is barely shifted against the front. Either it stands inside the back, or the
  receding is steeper there.
- **The restyle** was used only to see the roofs' layering and the panel. Its versions agree with the strokes on all of
  these. It draws the box shed as a lean-to on posts and the gate roof on four posts with brackets. Neither is in the
  strokes, so both are in the notes as readings.

## Painted things I saw and left to another unit

- **t2:**
  - 赵太丞家's free-standing tall boards: u ≈ 1385–1445 (two, feet v ≈ 990–1000) and u ≈ 1755–1793 (round feet at
    (1757, 988) and (1789, 990)). Read their characters; 治酒所伤真方集香丸 should be on one of them.
  - The tilted lattice stand (u 1426–1494, v 903–951).
  - The shop's back counter or low platform (u ≈ 1634–1747, v 733–797) and the rack of boxes or drawers above it (u
    1597–1735, v 693–723).
  - The chair with a curved back (1634–1676, 748–827) and the low table or footrest in front of it (1638–1692, v
    806–818).
  - The bench by the east board (1730–1772, v 802–885); the women's bench (u ≈ 1488–1560, v ≈ 852–893).
  - The black bird on the north-south hall's east slope (≈ (1700–1765, 125–160); support
    `roof: S7.bld.hall_ns_1620`). Eave and ridge points are in that entity.
  - The pale rounded mass behind the bucket man (u 1890–2013, v 787–834; its top line runs on east as S6's
    "wall-foot" line).
  - Under the 解 building's east eave:
    - a rail or counter top (u 1855–1923, v 1604–1630);
    - a stand with legs (u 1863–1923, v 1661–1743);
    - two poles leaning from the eave to the ground: (1815, 1598)→(1888, 1771) and (1745, 1669)→(1784, 1747).
  - The tub under the 解 sign (u 1937–2013, v 1597–1750).
- **t1:**
  - The gatekeeper's seat or bench (u ≈ 1040–1110, v ≈ 880–937).
  - The dark low shape at the railing's foot (u 918–969, v 883–897: grass, a stone or a small animal).
  - The willows, the bare tree and the bottom trees (the bottom trees cover u 815–1350, v 1270–1770; the hip-gable
    building's west part is behind them).

## Supports used

Only `ground`. There are no raised floors: the gate passage and the shop floor are at street level, and no step is
drawn.

## Against `reference/scroll/sections.md`

- 赵太丞家's name is painted as four separate tablets, 趙 · 太 · 丞 · 家, not as one board.
- The board fixed to the shop front reads 五勞七傷□□□, not 治酒所伤真方集香丸. The scholars' sign must be on a
  free-standing board (t2).
- The "corner building" at the 解 sign is the 解 building's north-east end. The awning posts S6 places at 1918–1936
  are that building's post.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Sort a stack of roofs by their ridges.** A double line with tiles on both sides, often with an ornament at its end,
  is a ridge. The next ridge down marks where the roof in front stops. A ridge that runs up-right in the receding
  direction is a hall running back (north-south). S7's top half was six roofs in depth order, which first read as two.
- **Read writing with a sharpened greyscale zoom** (sharp: `greyscale().normalise().sharpen()`, zoom 5–8) beside the
  grid crop. A "horizontal board" under an eave may be several tablets hung between bracket sets (S7: 趙 · 太 · 丞 · 家),
  and the clusters between them are ornaments, not characters.
- **A building south of the street hides its own street wall behind its roof.** Estimate the wall foot from a measured
  eave height on the same building: a post under the eave, from the eave to its foot. S7's 解 building: eave corner
  (2000, 1360) + 211 px puts the wall foot at v ≈ 1575, 275 px below the visible roof line. Keep the road's edge at the
  neighbour's convention, and put both readings in the notes and a question for the lead.
- **Give roofs-only footprints one stated rule:** frontage from the visible ridge or eave ends, a depth band ordered by
  the ridges' v, corners shifted by the frame's dx. Write the rule in every note so the builder can redo them as
  `choice:`.
- **Check the neighbour's notes against the strokes at the seam before writing seam notes.** S6 put a house's west end
  57 px too far east, read a pale mass's top line as a wall foot, and called a building's eave post an awning post.
- **Ground-level receding edges can be scarce** where a street is lined with open fronts and roofs: blocks, bench seats
  and a board's feet were all S7 had. Say how few there are, and compare them with the high lines. In S7 the high lines
  are steeper than the ground ones, the opposite of S4.
