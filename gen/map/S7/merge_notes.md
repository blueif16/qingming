# S7 merge notes (from the agents' reports, 2026-10-12)

`node gen/map/S7/merge_fixes.mjs && node tools/scroll_map.mjs S7 merge` → `map/strokes/S7.json`, **72 entities**:
18 figures, 3 animals, 9 trees, 21 props, 9 buildings, 5 structures, 1 road, 6 groups. `check` **PASS**. Its two
warnings are support keys the frame step adds (below). The merge flagged no near-duplicates within S7. The fixes are
idempotent (run twice, same files). The merge's crops are in `scratchpad/S7_merge/`, and the parts as they came from
the units are in `scratchpad/S7_merge/parts_before/`.

## The units

### structures (u 815–2000, looked to 2150): 17 entities (9 bld, 5 str, 1 road, 2 grp)
- North side, west to east:
  - the railing `fence_960`;
  - the gate hall `gatehouse_1240` with its west block (and a faint east block, low);
  - the compound's halls, all roofs only: `compound_hall_1420`, `main_hall_1300` (patterned front panel: curtain or
    patterned wall, not writing) and `far_gable_1345` (low). The group `S7.grp.guanhuan_compound` holds these;
  - the long north-south hall `hall_ns_1620` (in no group);
  - 赵太丞家 (`zhao_taicheng` + `zhao_back_hall_1630`, group `S7.grp.zhao_taicheng_house`);
  - the box shed `box_shed_1855` (low).
- South side: the small gate roof `gate_roof_1475`, the hip-gable building `hip_gable_1360` and the 解 building
  `jie_building_1800`. Their order is read from which hides which. Every south footprint is a placeholder.
- Writing:
  - the name board is four tablets, 趙 · 太 · 丞 · 家;
  - the board fixed to the west column reads 五勞七傷□□□;
  - the gate hall carries none.
- `S7.road.main`: datum at centre index 3 = (2000, 1180). `edge_n` ends at (2000, 800) and `edge_s` at (2000, 1300),
  S6's convention.
- Receding edges: three ground-level ones, slopes −0.80, −0.88 and −0.86 (dx ≈ 60 against the seam's 50.4). The
  high lines are steeper, −0.96 to −1.25.
- Silk: cut edge u 808–820, leaning east toward the bottom. Bottom edge v ≈ 1770.

### t1 (owns 815–1450): 16 entities (6 fig, 5 tree, 4 prop, 1 grp)
- The group 门房指路 `S7.grp.gatehouse_1240`:
  - figures: the seated gatekeeper, the man leaning at the post, the visitor with the bundle and the food box, the man
    in the dark cap pointing the way, and a small head at the door leaf (low);
  - props: the box seat, the tied sack and a peaked box (low).
- The porter with shoulder-pole baskets walks alone.
- Trees:
  - the edge willow: one trunk under the seal (read in the red channel); the restyle's second trunk is the seal's border;
  - the bare knobbed tree;
  - a low gnarled form (low; its own tree, or a rock plus the bare tree's limb);
  - the big bare tree at the bottom (the only trunk there);
  - the west shoot mass.
- No animals. Only five sure figures in its range.

### t2 (owns 1450–2000, looked 1300–2150): 38 entities (12 fig, 3 ani, 4 tree, 16 prop, 3 grp)
- 问病 `S7.grp.zhao_taicheng_patients`: two women, the doctor, a child on the lap, and a second child (low).
- The retinue `S7.grp.official_retinue`: the official riding, the folded-object bearer, the groom, the attendant in
  pale and the horse. The horse is a pale oval (its hindquarters), facing east. The procession moves **east**.
- The well's west end `S7.grp.well_west_end`: the water carrier and four hooped buckets.
- Walkers: the man with a bag (1885) and the bundle man (1976).
- Animals: the crow on the roof, and the pale shape behind the carrier (low: an animal, or a mat or the foot of a wall).
- Trees: needle trees 1910 and 1955, and two twiggy tops at the bottom edge.
- Props:
  - three free-standing boards (characters below the scan's resolution, copied as □) and the lattice stand;
  - the shop furniture;
  - the tub;
  - a bench under the 解 eave (low);
  - a leaning panel (low).
- 12 figures, against the lead's estimate of 20–25: the range was walked twice.

## Merge decisions (`gen/map/S7/merge_fixes.mjs`)

**Duplicates in disguise.** In both cases, one unit recorded a thing as its own entity and the other as part of a
building.
- **Retired `S7.prop.bench_in_gate_hall_1293`** (t1). It is the gate hall's back partition, which the structures pass
  already describes.
  - On a zoom-3 crop, a post runs from the lintel (v 652) straight into the piece's top rail. Loose furniture has no
    such post, and the restyle paints a fixed screen there.
  - Its outline and the reason are in `S7.bld.gatehouse_1240`'s note.
- **The gate's small dark-topped shape** at (1245–1257, 673–692) was recorded by t1 as `S7.fig.face_at_gate_door_1251`
  (conf low) and by the structures pass as a lamp (`lamp_w` on the gate hall).
  - It is one thing, to be built once. On a zoom-8 crop no cord or hook runs down from the lintel; the vertical line
    beside it is the door leaf's edge.
  - The figure stays, with both readings. The gate hall's point is renamed `head_or_lamp_w`, and its `what` now
    points to the figure.

**Things each side left to the other** (nobody had recorded them):
- **Added `S7.prop.leaning_poles_1888`** (to t2's part). These are two long poles leaning on the 解 building's east
  eave:
  - pole A runs (1815, 1598)→(1888, 1771); its foot is est at the silk's bottom edge;
  - pole B runs (1748, 1669)→(1782, 1750);
  - both were checked at zoom 3;
  - the structures pass left them to t2, and t2 left them to the structures pass;
  - they form one entity, as `S6.prop.leaning_poles_5045` does.
- **Added `S7.prop.stones_fence_foot_945`** (conf low, to t1's part). It is a low dark wash at the railing's foot,
  u 915–970, v 880–897:
  - at zoom 4 it shows no head and no legs;
  - readings: low stones (the restyle paints rocks), or the edge willow's root flare;
  - the structures pass left it to t1 ("grass, a stone or a small animal"), and t1 left it to the structures pass
    ("ground or root strokes");
  - S5 records such a lump as a prop (`S5.prop.stone_5894`).
- **The open door leaf** (u ≈ 1207–1260, knocker dot (1228, 727)), which t1 left to the structures pass, is now named
  in the gate hall's `what` and note.
- **The rail under the 解 eave** (u 1855–1923, v 1604–1630). The structures pass called it t2's; t2 called it the
  bench's back or the building's.
  - It sits up under the eave, above the bench's own top (v 1665–1673), so it is **part of the 解 building**.
  - Both entities' notes say so, and `jie_building_1800`'s note lists the things under the eave by ID.
- **The street's south edge** at the west. t1 left a drawn ledge there (a double line at v ≈ 1285–1290, u 1043–1095).
  - `S7.road.main`'s `edge_s` takes its two ends as measured points, (1043, 1287) and (1095, 1287).
  - The dashes east of the ledge to u ≈ 1204 are the bare tree's twig tips.

**Corrected:**
- **`S7.prop.counter_back_1675`'s base** moves from (1675, 740) est to **(1675, 797) est**, and its conf goes from low
  to med.
  - At v 740 the base stood on the line t2 took for the counter's foot. That puts the counter about 1.1 m behind the
    shop's back wall (structures: back est v 797).
  - The zoom-2 crop shows the counter's foot line at v ≈ 795–800 (u 1540–1745) and its east end post (u 1742–1747).
  - The rack of boxes or drawers above it (v 693–723) is part of the entity.
  - Both units gave it to t2 as furniture, so it stays a prop.
- **`S7.road.main` `edge_n` east of the shop.** The structures pass's own note says the edge runs "north round the
  box-like structure", but its points (1800, 860)→(1930, 800) cut through that structure's footprint.
  - It now follows the shed's est front and east side: (1793, 870), (1919, 870), (1958, 830), then (2000, 800).
  - All of these points are est, as before.

**Kept, with each naming the other:**
- `S7.prop.leaning_panel_1812` (t2) and `S7.str.box_shed_1855` (structures) are not the same strokes:
  - the shed's top is at v 726–749, and its west side runs (1813, 726)→(1793, 766);
  - the panel runs from (1838, 797) to its own foot block at v 922–945, in front of the shed's slatted front.
- 赵太丞家's name board: the structures pass's zoom 5–8 reading (four tablets with bracket clusters between them)
  stands against t2's zoom-2 count of 6–7 marks. t2's count is in the building's note.

**Supports normalised:**
- the crow: `roof: S7.bld.hall_ns_1620`. It sits on that hall's broad east slope; t2's "gable apex ≈ (1745, 35)" is
  that hall's ridge-end ornament;
- the rest is unchanged: `ground`; `carried in arms` (the child on the lap); `animal S7.ani.horse_official_1625` (the
  rider); `ground: on S6.str.square_well_2000` (two buckets on the platform's 6–8-px boards).

**Groups:** all six list only S7 IDs. Links to S6 (the well, its drawers) are in the groups' notes.

**Notes searched for painted things without an entity.** Besides the four items above, everything named in a note is
one of these:
- part of its entity: the chimney on `hall_ns_1620`, the hatched panel on the gate's west block, the ridge ornaments,
  the official's whip, the visitor's bundle and food box, the bucket man's pole;
- or another unit's entity, cross-referenced by ID.

No note names an ID that is not in S7 or S6.

## Cross-key seam check against S6 (`map/strokes/S6.json`, u 1850–2150)

Script: `scratchpad/S7_merge/seam_check.mjs`.
- **Same kind under 30 px:** only `S7.road.main` ~ `S6.road.main`, 0 px. That is the datum point (2000, 1180), which
  is meant to coincide.
- **Any kind under 30 px**, all as painted:
  - `S7.prop.bucket_lidded_1988` ~ `S6.str.square_well_2000`, 29 px: the bucket stands on the platform's west end;
  - `S7.bld.jie_building_1800`'s est NE corner (1995, 1575) ~ `S6.prop.mat_awning_2000`'s est SW corner (2000, 1565),
    11 px: the mat's south-west corner rests on the 解 roof's north-east corner;
  - `S7.road.main`'s `edge_n` end (2000, 800) ~ `S6.bld.house_well_2020`, 20 px: the shared edge.
- **Nearest pairs of the same kind that are not duplicates:**
  - `S7.fig.bundle_man_1976` (foot (1976, 1258)) is 61 px from `S6.fig.crouching_dark_2028`. It is a different man:
    standing, with a brimmed hat and light trousers;
  - `S7.tree.needle_tree_1955` is 70 px from `S6.tree.needle_tree_2025`. Each has its own crown top: (1955, 55) with
    a straight stem, and (1908, 79) for the 1910 tree.
- **S6's list of S7 things not yet mapped** (`map/index.md:54–56`) is all mapped now:
  - the three buckets: `bucket_lidded_1988`, `bucket_bail_1950`, `bucket_small_1930`, plus a fourth,
    `bucket_at_carrier_1890`;
  - the tub: `tub_slatted_1973`;
  - the man with a bundle: `bundle_man_1976`;
  - the 解 building: `jie_building_1800`. The "corner building" is its north-east end;
  - the needle tree: `needle_tree_1910`, plus `needle_tree_1955`;
  - the figures at u 1850–1900: `walker_bag_1885` and `bucket_man_1872`.

## Seam notes by S6 ID (for the lead: S6's files are not edited)

- **`S6.road.main`:**
  - `S7.road.main` meets it exactly: centre (2000, 1180), `edge_n` (2000, 800), `edge_s` (2000, 1300).
  - `edge_n` v 800 stands. The line at v 787–797 from u ≈ 1898 to 2013 is the top of the pale mass
    (`S7.ani.pale_shape_1905`); the house's real wall foot is hidden behind it, probably at about v 800.
  - `edge_s` v 1300 is where the street's figures stop, not a wall. The 解 building's north wall is hidden behind its
    own roof at about **v 1575** (NE eave corner (2000, 1360) plus its post's 211-px eave height).
  - So the ground hidden behind the south roofs may make the street up to about 5 m deeper at u 1640–2000. S6 asks the
    same about its south houses.
- **`S6.prop.mat_awning_2000`:**
  - The posts at u 1918–1936 are **the 解 building's** east eave post (u 1922–1941, from the eave at v ≈ 1517 to
    its foot behind the tub, est v ≈ 1728). They are not the awning's.
  - The mat's west end is at **u ≈ 1855–1860** (back edge v ≈ 1261, rounded west end v 1252–1290), above the 解
    roof's north verge. S6 has 1870.
  - Its south-west corner rests on the 解 roof's NE eave corner (2000, 1360). No awning post stands west of u 2000.
  - Its est ground corner sw (2000, 1565) meets the 解 building's est NE corner (1995, 1575), as painted.
- **`S6.prop.jie_signboard_2085`:**
  - The board's top edge leans on the 解 building's east eave at (1940, 1459)–(1996, 1400). Its feet agree with S6's.
  - The bar at v ≈ 1520–1525 starts at the 解 building's post (u ≈ 1942) and runs past both board edges to
    u ≈ 2062, so the plaque is the building's sign.
  - **Proposal:** keep the bar and plaque in S6's entity, since S6 builds them, with the bar's west end fixed to
    `S7.bld.jie_building_1800`'s east post at about (1935, 1522).
  - The 解 character is on the plaque (u 2005–2058). Nothing of it is S7's.
  - `S7.prop.tub_slatted_1973` stands just west of and behind the board's lower west edge.
- **`S6.bld.house_well_2020`:**
  - Its eave and tile-end discs start at **u ≈ 1963–1967** (v 655–668), not 2020. Plain silk runs west from there to
    u ≈ 1920 (v 670–790), which may be its wall running on.
  - The "small dark sloping roof (1880–1960, v 735–805)" in its note is `S7.str.box_shed_1855` (u 1793–1919).
- **`S6.str.square_well_2000`:**
  - The structures pass sees the platform's front edge (v ≈ 998) reaching west to **u ≈ 1903**, not ≈ 1955.
  - t2 sees planks only from u ≈ 2007; the spot under the 1950 bucket is covered.
  - The buckets at 1950 and 1988 stand on the platform's west end. The bucket at 1930 stands at its front-west corner,
    with its base (v 996) on the front edge's line.
  - The plank joints slope −1.6 to −2.2 (drawn from above, as S6 found).
- **`S6.bld.far_house_1859`:**
  - Its west gable shows at u ≈ 1800–1880, v ≈ 10–90: apex (1825, 12), king post u 1822–1828, tie beam v ≈ 85.
  - It stands just east of `S7.bld.hall_ns_1620`'s ridge end (1748, 18). Nothing of it shows west of u ≈ 1795.
  - This agrees with S6's "west end at u ≈ 1825".
- **`S6.tree.needle_tree_2025`:** S7's needle trees at 1910 and 1955 are separate trees: each has its own crown top.
- **`S6.tree.willow_2330`:** its bare crown covers u 1820–2000, v 230–740. No S7 trunk stands under it.
- **`S6.fig.crouching_dark_2028`, `S6.fig.well_bucket_lifter_2032`, `S6.fig.itinerant_monk_2078`:** no S7 entity
  duplicates them. Every S6 figure near the seam has its foot at u ≥ 2028.
- **`S6.str.fence_far_2000`:** nothing to add.

## For the frame step

- **Datum:** `S7.road.main:lines.centre.3` = (2000, 1180), station −73.63.
- **Support keys to add:**
  - `carried in arms`: H 0, as in S4's frame (the child on the lap; its foot is the seated woman's foot);
  - `roof: S7.bld.hall_ns_1620`: H from two stroke points. The crow is at about (1735, 151) on the east slope; the
    hall's east eave runs (1771, 345)→(1857, 241). The hall is painted at about 0.55 of the street's scale, so say how
    H was derived;
  - `ground: on S6.str.square_well_2000` already matches `ground`. The boards are 6–8 px (about 0.1 m), so H stays 0.
- **Receding edges** (from the structures table and the units):
  - west: the gate block's east face foot, (1191, 899)→(1221, 875), slope −0.80, dx 64. t1 read the same face as
    (1190, 899)→(1214, 873), slope −1.08, dx 47. The two readings of one edge average about −0.94 (dx ≈ 54.5);
    read it once more at zoom 4 before using it;
  - middle: the bench seat by the east board, −0.88, dx 58;
  - east: S6's 解 board feet, −0.86, dx 60;
  - t2's furniture edges (−2.8 and −0.6) are unreliable;
  - no wall foot recedes anywhere in S7, and the high lines run −0.96 to −1.25.
- **Diminution:** none measurable in the street band. t1: 164–171 px between foot v 914 and 1240. t2: 143–208 px at
  the same foot v (25 % spread).
- **South-side placeholders:**
  - north walls est: gate roof v ≈ 1350, hip-gable v ≈ 1440, 解 v ≈ 1575;
  - pole B's foot (1782, 1750) falls about 40 px inside the 解 building's placeholder east wall line, while its east
    eave post (1928, 1728) stands about 80 px outside it. The builder's footprint (`choice:`) should keep the poles'
    feet and the bench outside the wall.
- **Silk:** bottom edge v ≈ 1770 (1761 at u 815–1140), against the layout tool's `SILK_BOTTOM = 1790` (for the lead).
  Cut edge u 808–820.

## Left open (low conf, both readings in the entities): for the second pass

- `S7.fig.face_at_gate_door_1251`: a peeking head, or the lamp `head_or_lamp_w`.
- `S7.fig.child_at_knee_1547`: a second child, or the folds of the women's robes (zoom 3 shows no head outline).
- `S7.ani.pale_shape_1905`: an animal with its head down, or a mat, cloth, straw or the wall's foot. Its top line runs
  into S6 as S6's "wall foot". The restyle paints a striped animal.
- `S7.tree.gnarled_low_edge_875`: its own low tree, or a rock plus the bare tree's limb.
- `S7.prop.stones_fence_foot_945`: stones, or the willow's root flare.
- `S7.prop.peaked_box_1346`: on the ground, or held.
- `S7.prop.leaning_panel_1812`: a panel leaning in front of the shed, or the shed's lower west wall.
- `S7.prop.bench_jie_eave_1885`, `S7.str.box_shed_1855` (a shed, or a set-down chest or sedan),
  `S7.str.gate_block_east_1345` and `S7.bld.far_gable_1345` (its own building, or the main hall's cross-gable).
- `S7.tree.shoots_bottom_west_960`: one mass or two clumps (convergence at u ≈ 890 and ≈ 1070).
- Writing: 五勞七傷□□□ (last three unreadable). The free-standing boards' characters are all □.

## Against `reference/scroll/sections.md`

- 赵太丞家's name is four tablets (趙 · 太 · 丞 · 家), not one board.
- The board on the shop front reads 五勞七傷□□□. 治酒所伤真方集香丸 is not on the building; it would be on a
  free-standing board, which is unreadable at the scan's resolution.
- The official's retinue runs u ≈ 1440 (its folded object to 1353) to 1775, not 1560–1780. It moves **east**, toward
  S6, not "out".
- "Two women bring children": two women and one sure child; a second child is faint.
- There is no separate "man at the door".
- The "corner building" at the 解 sign is the 解 building's north-east end. The posts S6 called the awning's are that
  building's.

## Second pass

One fresh agent over the whole area, `all`: owns u 815–2000 and looks to 2150. It writes
`gen/map/S7/second_pass/all.json`, starting with the list above and the 72-entity overlay.

**Decisions (the frame agent, in `merge_fixes.mjs`, section "the second pass"):** every proposal accepted, each with
its reason in the `DECISIONS` table. After the merge, **70 entities**: 17 figures, 3 animals, 9 trees, 20 props,
9 buildings, 5 structures, 1 road, 6 groups. `check` **PASS**, no warnings. The fixes are idempotent (run twice, same
md5 sums). The parts as they were before the second pass are in `scratchpad/S7_frame/parts_before/`.
- **Retired `S7.prop.peaked_box_1346`** into `S7.str.gate_block_east_1345`: the same strokes, read as a box by t1 and
  as a block by the structures pass. At zoom 8 the "peak" is the top's west edge receding (−0.82), with no falling
  slope; the corner stands under the east jamb, as the west block stands under the west jamb. The block now has `sw`
  (1334, 902) and `sw_top` (1334, 859) measured and conf med; the box stays in its note as the other reading.
- **Retired `S7.fig.child_at_knee_1547`:** robe folds. At zoom 6 no closed head shows; the restyle paints one child.
  The group and the standing woman now say "a child".
- **Notes:** the slats above the 解 tub (two readings: a 2.7 m tub, or a screen hung from the building's bar; the
  builder's choice), on the tub and on `S7.bld.jie_building_1800`. `S7.prop.bench_jie_eave_1885` goes from low to med.
- Every other open item is kept with the pass's verdict (`second_pass/all.json`, `kept`).

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 2 Merge)

- **Compare the "left to" lists thing by thing, and look for the same thing recorded twice under different kinds.** On
  S7, each unit left two things to the other: the 解 eave's leaning poles and the stones at the railing's foot. Two
  more were recorded by both units in different forms: the gate passage's partition (a tile's prop and a building
  part), and a small shape at the gate's door leaf (a tile's figure and a building's lamp). Settle each on one zoom-3
  crop. Keep one entity, and let the other name it by ID.
- **Check a unit's road edges against its own footprints.** S7's `edge_n` cut through the shed the same unit had just
  mapped, which put half of the shed in the street.
- **A prop's base behind a building's back wall is a red flag.** Check which drawn line is the prop's foot. S7's back
  counter had its base on its top rail, 1.1 m behind the wall.
