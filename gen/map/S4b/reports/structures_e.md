# S4b structures_e: report (2026-10-12)

Unit `structures_e`. It owns u 14000–15500 by main point and looks at u 13850–15650. Part file:
`gen/map/S4b/parts/structures_e.json` (17 entities, `check` PASS). Self-overlay:
`gen/map/S4b/look/structures_e_overlay.jpg`. My crops and scripts are in
`scratchpad/S4b_structures_e/`. The contrast-enhanced crops are `e_*.jpg` and the helper is `enh.mjs`.

## First, for the lead: the tea house recedes up-LEFT

Every ground-level receding edge I can read in my range belongs to the tea house group (u 14140–14890,
v 960–1185). All of them run **down to the right**, with slopes between +0.4 and +0.9. That puts the receding
direction up-left, so **dx is negative, about −68 px/m (median; mean −72; scatter −36 to −122)**. The seam
knot is +31.6, and part 1's ground slopes were −1.4 to −2.0.

On my side of the road, the south row behaves the other way. Its roofs only show high lines, and they recede
up-right: ridges at −0.58 and −0.90, the same type as part 1's `S4.bld.south_hall_12350` at −0.56. The house at
the top of the bank also recedes up-right, with its eave at −0.62.

The painter draws the tea house from a different side than the street and the south row. One dx per u cannot
fit both halves of my range. The stroke points are in the table below. I fitted nothing.

## Counts

| kind | n | ids |
|---|---|---|
| building | 12 | top_shop_14224, riverbank_house_14640, far_house_14615, top_house_tables_14876, far_shed_15098, tea_house_14531, mat_shed_15038, south_hall_long_14680, south_hall_gable_14340, south_hall_edge_14945, south_hall_diagonal_15242, house_behind_willow_15414 |
| structure | 3 | bank_shed_14445 (open shed), tea_house_platform_14520, reed_fence_15320 |
| prop | 2 | parasol_14872, white_box_14147. Both are in-between kinds I was unsure about, recorded so they are not missed. Both are likely duplicates of t5's and t4's |
| road, water, grd, group | 0 | `S4b.road.main` is structures_w's; the banks and the water are the river agent's |

That is more buildings than the 8–10 planned. The south row is six roofs, not one "long row", and the top of the
silk has four houses.

## What each entity is (short)

- **Tea house** (`S4b.bld.tea_house_14531`; src `余辉: 小铺闲坐 (probable)`).
  - A big open hall. Its tiled gable roof shows the south gable to the road: apex (14604,813), tie beam v 894
    from 14465 to 14742, and a king post.
  - A second, smaller tiled gable roof runs parallel on the east (u 14554–14859, v 653–840). It may be one hall
    with two roofs or a separate east wing; this is unclear.
  - A broad lean-to canopy of **mat or thatch** (cross-hatched strokes) covers the whole front, from u 14388 to
    14935, with its eave at v 1000–1014. It rests on posts at 14391, 14441, 14687, 14870 and 14930.
  - There is no front wall. A lattice screen closes the west end (14350–14390).
  - No signboard or writing is painted on it.
  - The back corners are estimates; the note gives the method.
- **Platform** (`S4b.str.tea_house_platform_14520`). This is a line, the platform's top edge. The west edge runs
  (14143,1050)→(14300,1150), slope +0.64, to a corner at (14317,1163). The front then runs along v 1163–1208,
  with a step down at u 14397–14420. The side face is about 10–15 px high, so H ≈ 0.15–0.2 m.
- **Mat shed** (`S4b.bld.mat_shed_15038`), east of the tea house. It has a mat or thatch roof (u 14893–15197,
  eave v ~1005) over a stall (t5's).
- **Parasol** (`S4b.prop.parasol_14872`, conf low). It is a big round ribbed dome (u 14787–15033, v 840–900).
  Its pole lines up with the tea house's post at 14870.
- **White box** (`S4b.prop.white_box_14147`, conf low). It stands at the tea house's estimated north-west
  corner. It is either a lamp-box or sign, or a doorway in the back wall.
- **Top of the silk / bank top** (support `bank top`):
  - small house with a gateway (u 14105–14345, v 18–88);
  - riverbank house, drawn askew (posts at 14520, 14597 and 14645 with feet at v ~300; east eave with round tile
    ends receding up-right);
  - far house behind it (light gable at 14512–14606, conf low);
  - house with an open shop front and tables (u 14720–15030; tables 14763–14870 are t4's);
  - faint long shed at the top edge (u 15015–15180, v 15–80, conf low). On the enhanced scan it is a roof band,
    posts and a base line. setup's notes call the restyle's house here an invention over faint strokes. The
    strokes are faint but they are there.
  - open mat-roofed shed on the bank top behind the tea house (u 14330–14560, eave v 600; two men stand at its
    east end).
- **South row** (roofs only; placeholder footprints, which the builder settles as `choice:`):
  - `south_hall_long_14680`: a long straight ridge from (14100,1240) to (15212,1255), one continuous ridge. The
    west end has a hip and the east end a gable with a hanging fish. A small hatch and a raised white box sit on
    its south slope.
  - `south_hall_gable_14340`: the part 1 type. A small south gable (apex (14165,1519)) has a hanging fish, a tie
    beam at v 1712 and posts at 14058 and 14281. The ridge rises up-right (−0.58) to a north gable peak with a
    finial at (14538,1304). The north barge runs to (14815,1504).
  - `south_hall_edge_14945`: ridge at v 1519–1535 from 14612 to past 15262, along the silk's edge.
  - `south_hall_diagonal_15242`: ridge (14985,1765)→(15500,1304), slope −0.90. North barge to (15589,1422),
    which crosses the seam (seam notes below).
  - `house_behind_willow_15414`: low ridge at v 1212–1220 (u 15330–15511), next to the S3 riverside hall.
  - `reed_fence_15320` (conf low): a screen of close vertical strokes, u 15217–15425, top v 1330–1350. The other
    reading is bare willow whips.

## Hard or ambiguous; what I read with the restyle

- **The south-row roofscape.** Six roofs overlap. By part 1's method their estimated footprints overlap too, as
  part 1 found with 12100 and 12350. Each note gives the visible roof lines as named points (ridge ends, gable
  apexes, barges, hip feet), so the builder can fit roofs to them. On the two diagonal ridges, no slope shows to
  the upper left of the double line, so the double line may be a verge rather than a ridge (part 1 found the
  same).
- **The tea house's two roofs.** The restyle helped here (conf med). It shows a main gable roof with a front
  canopy and a parallel east roof, and the strokes agree.
- **Roof materials.** The scan draws mat or thatch with cross-hatched, diamond strokes and tiles with scale arcs.
  The restyle repaints the bank shed, the mat shed and part of the canopy as tiles. I took the material from the
  scan.
- **The riverbank house** is drawn askew (conf low). Its posts' feet line is level (v 297–310) but its eave
  recedes up-right at −0.62. The other reading, the restyle's, is a long front wall facing south-east. Both are in
  its note.
- **The far top edge** (u 14950–15250, v 0–160) is very faint. I read it on contrast-enhanced crops.
- **The two dark lens-shaped masses** along the long hall's ridge (u 14555–14800, v 1215–1260; u 14880–15060,
  v 1225–1265). The restyle makes them straw bundles. They are either heaps on the road or the ridge drawn heavy.
  I left them to t4 and t5 (below).
- **The restyle invents** at the tea house's east end (the reclining man in red, the white animal-like shapes,
  the drum). I recorded none of them. The parasol is in both the scan and the restyle.

## Reading of the main road east of u 14000 (for structures_w)

The road's south half is hidden behind the south row's roofs everywhere east of 14000. Only a strip north of the
long hall's ridge shows.

- **edge_n (measured where marked):**
  1. (14000,1000) est: the wheelwright shed's front, your structure.
  2. (14040,1097): the foot of the big gnarled tree, t3's. The tree stands on the road's north margin.
  3. The tea house platform's edge: (14100,1022) est, (14143,1050), (14300,1150), (14317,1163), (14397,1165),
     (14420,1185), (14600,1200), (14800,1203), (14935,1208) est.
  4. The mat shed's front: (15195,1180) est.
- **edge_s:**
  - The hidden north walls of the south row. My placeholder for the long hall puts them at about
    (14145,1440)→(15300,1455) est. Part 1 had 1484 at u 12600.
  - The visible limit is the long hall's ridge, v 1240 at 14100 to 1255 at 15212.
  - West of 14100 the limit is the north barge of your hall with the north gable peak at (14146,1115).
- **centre (est):** (14000, ~1150), (14400, ~1310), (14935, ~1330), (15215, ~1345).
- **East of ~15215 the road cannot be seen.** Two readings:
  - **(a)** It runs on east among the willows. The visible ground at u 15200–15500 is v ~1100–1220. But at u
    ≥ 15530 the S3 riverside hall stands there: roof from v 955, veranda railing at v 1422–1467, facing south. So
    the road cannot continue at v ~1200 into S3.
  - **(b), more likely.** It bends south-east past the long hall's east gable (15262) and passes south of the low
    house and the reed fence, hidden behind the diagonal hall. Its last centre point would be about (15500, ~1550)
    est. S3's brief says the same: S3's road west of the tavern is "hidden under the roofs along the silk's bottom
    edge". The visible strip at 15200–15500, v 1100–1220, would then be the bank's willow ground north of the
    road.
  - Under (b), the long hall's estimated footprint (v 1440–1590) is too deep at its east end. Settle it at the
    frame step.

## Seam notes

- **S3 (u 15500):**
  - S3's long riverside hall. Its roof's west verge reaches (15520–15533, 1222–1228). A boarded west wall or
    railing stands at u 15503–15550 (v 1283–1417). The first lattice window is at 15611–15678 (v 1279–1400). The
    veranda railing is at v 1422–1467.
  - `S4b.bld.house_behind_willow_15414` abuts that hall at u ~15511–15520. Its ridge is at v 1212–1220, far below
    the hall's roof.
  - `S4b.bld.south_hall_diagonal_15242`:
    - Its north peak is at (15500,1304), on the seam.
    - The north barge runs to (15589,1422) and ends against the S3 hall's veranda.
    - The estimated north-east corner is (15650,1600).
    - Its main point is 15242. It is S4b's, and on S3's side it is a seam note.
  - Trees between 15511 and 16000, v 1433–1789 (bare willows), are S3's.
- **S4:** nothing. My look starts at 13850.
- **structures_w (edge things):**
  - The open shop with tables at the top, u ~13700/13895–14105, posts at 13915, 14018 and 14102, eave v 45–60.
    Its footprint's middle is about 13990. **Yours.** My small house with a gateway starts where its eave steps at
    14105. If your roof runs on east of 14105, merge the two.
  - **The hall with the north gable peak and finial at (14146,1115).** Its footprint's middle is about 13930, so
    it is **yours**, though its apex is at 14146. Its points:
    - south gable peak about (13715,1370), with a post or hanging fish at 13700–13725 (v 1325–1500);
    - south barges to (13550,1481) and (13862,1500);
    - ridge (13715,1370)→(14146,1115), slope −0.59, the part 1 type;
    - north barge (14146,1115)→(14342,1238).
    - I did not record it. If you did not either, it is a miss.
  - The woven-mat lean-to roof at u 13644–13956 (v 1200–1312), with a man standing behind it at u ~13740. Yours.
- **Groups across edges:** none of mine.

## Supports used

- `ground`: the tea house, the platform, the mat shed, the south row, the fence and the props.
- `bank top`: the six bank-top entities.
  - These are top_shop, riverbank_house, far_house, top_house_tables, far_shed and bank_shed.
  - It is a new name and not yet in the frame, so check warns. Its H comes from the river agent.
  - The bank's foot is hidden behind the tea house's roofs.
- Suggested for the frame: `tea house floor`, H ≈ 0.15–0.2 m from the platform's 10–15 px side face. The
  tile agents' customers and tables on the platform could use it, or `ground`.

## Receding edges (two stroke points each; dx = −51.25 / slope)

**Tea house group, at ground level or furniture height (u 14140–14890).** All recede up-left.

| # | what | from → to | slope | dx |
|---|---|---|---|---|
| 1 | platform's west edge (top) | (14143,1050) → (14300,1150) | +0.64 | −80 |
| 2 | table B1, top long edge | (14155,967) → (14240,1013) | +0.54 | −95 |
| 3 | table B1, leg feet | (14163,1032) → (14247,1067) | +0.42 | −122 (low) |
| 4 | table B2, top | (14270,1050) → (14327,1093) | +0.75 | −68 |
| 5 | table B2, leg feet | (14277,1107) → (14310,1135) | +0.85 | −60 |
| 6 | hall table H1, side | (14604,1030) → (14654,1066) | +0.72 | −71 |
| 7 | hall bench H2, top | (14637,1105) → (14685,1144) | +0.81 | −63 |
| 8 | hall bench H2, feet | (14637,1156) → (14666,1183) | +0.93 | −55 |
| 9 | bench in the east bay | (14837,1078) → (14881,1140) | +1.41 | −36 (low) |

- Median −68, mean −72.
- The tables' east-west edges are about level (+0.04 to +0.12), and so is the hall's front-post line,
  (14391,1183)→(14930,1206): +0.04.
- A knot candidate is about [14500, −68], with large scatter.

**High lines, for comparison only:**
- Tea house:
  - west eave (14127,871)→(14396,971): +0.37;
  - east eave (14742,894)→(14927,986): +0.50;
  - south wing's ridge (14424,601)→(14598,818): +1.25.
- Bank shed verge (14450,492)→(14560,600): +0.98 (up-left, like the tea house).
- South row (up-right):
  - gable hall's ridge (14165,1519)→(14538,1304): −0.58;
  - structures_w's hall's ridge (13715,1370)→(14146,1115): −0.59;
  - diagonal hall's ridge (14985,1765)→(15500,1304): −0.90.
- Top of the silk:
  - riverbank house's east eave (14615,274)→(14742,197): −0.62 (up-right);
  - one table at the house with tables: short edges +0.39 and +0.45, long edges −0.27 (ambiguous, v ~130–150).

## Scale cues (px, with foot v)

- Tea house front post 14441: 200 px from the canopy eave to its foot (v 987→1187).
- Tea house post spacing: 50 px (14391–14441) and 60 px (14870–14930).
- Tea house gable: 277 px wide at the tie beam, 81 px high (v 813–894).
- Table H3: top v 1120–1135, foot 1181 (≈50 px). Bench H2: 40–50 px (feet 1156–1183). Table B2: ≈55 px (feet
  1107).
- Platform's side face: 10–15 px (v ~1050–1160).
- White box: 125 × 38 px, foot v 1000.
- Parasol: diameter ≈ 246 px, canopy v 840–900.
- Small house's gateway: 45–50 px wide, ≈57 px from lintel to foot, foot v ~85.
- Riverbank house posts: 37–54 px, feet v 297–310.
- House with tables: post 60 px (v 127–187), wall ≈45 px (v 120–165).
- Rough figure heights (the tile agents measure them properly):
  - the man at the bank shed, ≈87 px at foot v ~690;
  - the figures on the path at the riverbank house, ≈70 px at foot v ~410;
  - the standing man behind the long hall's ridge, head v 1150, feet hidden behind the ridge (≥1245).

## Painted things I saw and LEFT to another agent

- **t3:** the big gnarled tree, trunk foot about (13985–14090, 1097), crown u 13850–14350, v 180–1100.
- **t4:**
  - Furniture on the platform and in the hall:
    - B1, u 14155–14247, v 967–1067;
    - the table behind it, 14200–14313, v 1000–1013;
    - B2, 14270–14327, v 1050–1135;
    - H1, 14604–14654, v 1030–1094;
    - H2, 14637–14685, v 1105–1183;
    - H3, 14697–14779, v 1120–1181;
    - the long table, 14745–14864, v 1029–1060;
    - a round tray stand at about 14560–14600, v 1100–1180.
  - The tea house's customers and the man in white at the table.
  - The figure crouching at the platform's front, u 14720–14760, v 1170–1260.
  - The dark lens-shaped mass on the long hall's ridge, u 14555–14800, v 1215–1260 (a heap or bundle?).
  - The tables at the house with tables, 14763–14870, v 127–205.
  - The two men at the bank shed, 14500–14600, v 600–700.
  - The three figures on the path, 14650–14800, v 340–410.
  - The big willow at the top, whips 14000–14450, v 100–480, base hidden.
  - The white box (my prop), a likely duplicate.
- **t5:**
  - The parasol (my prop), a likely duplicate.
  - The stall with a slanted top under the mat shed, 15100–15180, v 1080–1165.
  - The light standing figure, 14920–14970, v 1020–1100.
  - The man pointing toward the boats behind the parasol, 14913–14973, v 807–840.
  - The standing men at about (15040, 1150–1250) and 15110–15170, v 1110–1240.
  - The dark mass on the long hall's ridge, 14880–15060, v 1225–1265.
  - The willows (trunk 15420–15490, base hidden behind the diagonal hall's ridge, v > 1320).
  - Vertical trunk strokes at the top edge, 15217–15240, v 17–60 (the restyle's two willows: check them on the
    scan).
- **river:**
  - the bank and its path (u 14300–14900, v 300–900);
  - the shore below the house with tables and the faint shed (v ~80–160);
  - every boat.
- **structures_w:**
  - the open shop with tables, 13895–14105, v 0–145;
  - the hall with the north gable peak at (14146,1115);
  - the woven-mat lean-to at 13644–13956;
  - `S4b.road.main` (my reading is above).

## Against `reference/scroll/sections.md`

- No contradiction.
- The tea house fits 小铺闲坐: an open hall with seated customers at tables. I tagged it "probable".
- The moorings' land side (≈ 14400–15700) has four houses and a shed on the bank top that the scholars' list does
  not name.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

> - **Measure the receding direction per building group, not per section.** On S4b's east, the tea house north of
>   the road recedes up-LEFT: its platform edge and furniture slope +0.4 to +0.9, so dx ≈ −68 px/m. The south row's
>   ridges and a house at the top of the bank recede up-RIGHT, at −0.58 to −0.90. The painter draws neighbouring
>   groups from different sides. Report each group's ground edges separately, with its stroke points. One dx per u
>   cannot hold both, and the lead decides what the frame does.
> - **A recurring south-row type:** a hall whose ridge rises up-right (−0.56 to −0.6) from a small south gable
>   (hanging fish, tie beam, open-front posts) to a high north gable peak with a finial near the road, with one north
>   barge descending to the right. Examples: S4.bld.south_hall_12350, S4b.bld.south_hall_gable_14340, and the hall
>   at u 13715–14146. Record both peaks, the ridge, the barges and the tie beam as named points, so the builder can
>   fit the roof whatever footprint it chooses. The ownership point is the footprint's middle, not the north peak:
>   the hall whose peak is at u 14146 belongs to the unit west of 14000.
> - **Contrast-enhanced greyscale crops** (sharp: `greyscale().normalise({lower:1, upper:99}).linear(1.3,-30)`,
>   with a scan-px grid) read faint far-top buildings, and mat against tile, far better than the plain scan. A
>   "faint vertical strokes" spot turned out to be a roof band, three posts and a base line. Consider an `--enhance`
>   flag on `scroll_map.mjs overlay`.
> - **Roof material comes from the scan:** woven mat or thatch is drawn with cross-hatched, diamond strokes, and
>   tiles with scale arcs. The restyle repaints mat roofs as tiles.
> - **Tool quirk:** the Bash tool's shell is zsh, so `set -- $pair` does not split `"u v"` into words. Loop over
>   coordinate pairs in a small bash script (`#!/bin/bash`).
