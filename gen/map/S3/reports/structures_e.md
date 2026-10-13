# S3 structures_e: report (u 18000–20500, looked at 17850–20656)

Part file: `gen/map/S3/parts/structures_e.json`. `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/structures_e.json`: **PASS** (13 entities, no warnings). Overlays read: `gen/map/S3/look/structures_e_self_w.jpg`, `_self_e.jpg` (zoom 0.7, the whole range), `_self_fb.jpg` (far bank, zoom 1.3), `_self_tav.jpg` (tavern, zoom 2), `_self_sheds.jpg` (zoom 1.3), `_self_sb.jpg` (south bank, zoom 0.9). Every marker sits on its stroke. Footprints seen only as roofs are placeholders, and each note says so. Reading crops are `gen/map/S3/look/structures_e_*.jpg`; scripts are in `scratchpad/S3_structures_e/`.

The restyle was not used for positions. East of about 18800 the mosaic is unusable. I used the registered overview (`overview_reg.png`) only to name two masses at the north bank's top edge.

## Counts

| kind | n | IDs |
|---|---|---|
| building | 11 | `far_bank_shed_18280`, `far_bank_hall_18520`, `far_bank_house_18850`, `north_bank_shop_19290`, `north_bank_shed_19620`, `tavern_20230`, `bridge_foot_hall_19000`, `mat_shed_19160`, `mat_shed_19530`, `open_shop_20000`, `front_roof_19800` |
| structure | 1 | `tiled_wall_18450` |
| road (side street) | 1 | `south_street_20250` |
| grd | 0 | on land in my range I found no bank, mound or other ground feature apart from the river banks (see "Ground features") |

Support used: `ground` only.

## What each one is, in brief

- **Far (north) bank, west of the bridge:**
  - the shop with a railed front at the river's edge (17875–18212) is structures_w's `S3.bld.far_hall_17875`. I recorded it as `far_bank_shop_18040`, then dropped it as a duplicate (see the seam notes);
  - a small open shed (18215–18345);
  - **the long open hall on posts** (18355–18740). It has a raised plank deck on stilts over the sloping bank, a railing, and tables and benches inside. Its long front faces south-west, toward the water west of the bridge's south approach: it is turned relative to the shops along the top edge;
  - a tiled roof behind it (18686–19014) whose lower part is hidden by the hall's roof and the willow crowns.
- **North bank east of the crown:**
  - a shop at the silk's top edge (19180–19400). Only its lattice front shows, with tables set out in front;
  - an open shed frame (19535–19775), low confidence, recorded with both readings;
  - **the tavern** (pin 21; 20055–20395). It is open-fronted with tables at the water's edge. The bridge's crossed-top end post stands at its west corner.
- **South bank:**
  - **the big 悬山 building at the bridge's south foot** (`bridge_foot_hall_19000`). Its ridge runs back (north) from a south gable at the silk's edge (hanging fish, 惹草, an open truss on four columns) to a north gable with a ridge-end ornament at the bridge's foot;
  - a tile-capped wall (or a lower roof's edge; low confidence) along its west side;
  - two mat-roofed sheds on the bank under the arch (18986–19335 with people at tables; 19340–19720 with board walls);
  - a long tiled building with an open front (19545–20445) where people sit and stand at tables;
  - the roof of a building in front of it at the bottom edge (19490–20290);
  - the ground in front of the open shop east of 20000, where a parasol stall stands (`south_street_20250`, low confidence).

## Hard or ambiguous

- **The scan's resolution.** At zoom 3 the far bank's fine lines (v 0–330) blur. Posts and table edges there are ±5–8 px, and roof forms at the top edge are partly guessed. Each note says which.
- **The big building's roof (`bridge_foot_hall_19000`).**
  - The south gable's truss spans only 311 px between its end columns (18716–19027), but the eave span is about 880 px at the south and 1055 px at the north. The roof overhangs a great deal, or the truss is only the gable's middle bay.
  - The SW and SE eave corners lie just below the silk's edge.
  - The footprint is S4's placeholder method: the ridge's ground line ± about 450 px. The south corners are clamped to v 1795; their true estimate is about v 1890.
- **The band west of it (`tiled_wall_18450`).**
  - Reading (a): a tile-capped wall about 1.8 m high whose plain west face is the light strip east of the coping (142 px of v down to the big roof's eave).
  - Reading (b): the tiled edge of a lower roof or a walkway's kerb. The restyle paints a stone-edged ramp, but its tile has alignment 0.08.
  - Low confidence.
- **The mat shed at 19340–19720 is a shed on land, not a boat.** The long curve under it looked like a hull. Traced back, it is the big building's north-gable bargeboard: it passes (19294,1312) and (19550,1375) on the way from the apex (19128,1155) to the NE eave corner (19650,1400). The shed's board front stands just above that bargeboard.
- **Tavern storeys** (刘涤宇's two-storey building "opposite 十千脚店 at the bridge"?). Under the gable there is a lattice band (v 78–105), a skirt of tile ends at v 128–150, and a lattice window band below it.
  - Reading (a): one storey with a hip-and-gable roof.
  - Reading (b): two storeys, with the upper floor line at about v 150 over u 20085–20390, straight above the ground at v ~288.
  - Not settled at this resolution. Both readings are in the note, with conf low for the storey count.
  - The south bank's open shop is not the two-storey building. Its floor line (v 1615) is only 85 px above the ground in front (v ~1700, the parasol stall's feet), which makes it a raised floor or a separate front building, not an upper storey.
- **The far-bank house (`far_bank_house_18850`)** may be the upper part of the hall's own roof (a hip running up-right) rather than a second building. I read the line (18668,52)->(18855,105) as the boundary between two roofs. Conf low.
- **The interior of the open shop is painted at about half scale.** A standing man inside is 82 px tall at foot v 1552, against 160–190 px on the open ground at v 1300–1700. See "Diminution".

## Ground features

In u 18000–20500 I found no land-side bank, mound, ditch or field edge.
- The bank under the far-bank hall (the hall stands on stilts on it) is a river bank.
- The south bank under the arch is a river bank: the water's ripples reach v ≈ 1010 right behind the mat shed's ridge at v 1014.
- The north bank at the tavern is a river bank: the boats' hulls start at v ≈ 290–300 just below its front (v ≈ 288).

All three are the river agents' (`grd` with `bank_top`). Points are in "Left to".
- The north bank where the cart stands (19800–20000, v 100–300) is flat open ground; no slope is drawn.
- The light strip west of the big building is described under the wall. If it is ground, it is a lane 140 px of v wide, but it reads better as the wall's face.

## Route notes for structures_w (`S3.road.main` on the north bank)

- The deck's north end comes down at about (20000–20030, 330–360), where a short newel post with a knob stands at (20025, 330–370) (the bridge agent's).
- East of there, the only land between the bridge and the water is **the tavern's open front**:
  - tables at v 205–280;
  - front base est v ≈ 288 from u 20070 to 20395;
  - the boats' hulls start at v ≈ 290–300.
- So the route's stretch 20050–20400 runs through or along the tavern's front at v ≈ 250–290. North of the tavern the land runs off the silk's top edge.
- West of the tavern (19600–20000, v 100–300) is open ground with the cart, a dog and porters.
- Check that the painted area there doesn't need the route below v ≈ 290.

## Seam notes

**S2 at u 20500** (S2's units are `structures_w`, `t1` and `river_w`):

- **South bank roofs:**
  - `S3.bld.open_shop_20000` is S3's: main point ≈ 20060.
    - Its painted strokes end at about u 20456 (roof) and 20444 (east wall of boards, v 1493–1590), under the dark tree.
    - Its placeholder back corner `ne` (20575,1400,est) reaches past the seam.
  - **The building east of the dark tree is S2's** (S2 `structures_w`). Its roof's west edge runs (20570,1560)->(20656,1495) and the roof continues east; a figure stands at (20599–20656, 1628–1690) (S2 t1).
  - `S3.bld.front_roof_19800` ends at u 20290 and does not straddle.
- **North bank:**
  - **The building behind the big willow is S2's** by main point.
    - Its board wall shows at u 20595–20656 (v 110–222).
    - Two posts at u 20461 and 20503 (v 160–252) and a lidded box (20445–20480, v 214–240) stand west of the willow's trunk. I read them as that building's west bay.
    - If S2 reads them as a separate small shed, its main point (≈ 20475) would be S3's. The lead decides; I did not record it.
  - `S3.bld.tavern_20230` ends at u ≈ 20395 (east posts) to 20445 (placeholder back corner).
- **The big willow at the top (S2 t1).** Its trunk reads at u ≈ 20545–20590, v 98–260 in my crops, east of the seam, which agrees with it being S2's.
- **The big dark-trunked tree at the bottom: a contested straddler.**
  - The S3 brief puts its base at ≈ 20330–20420 (S3 t9); S2's brief at ≈ 20480–20600 "by its base" (S2 t1).
  - In my crop (`structures_e_trunk.jpg`) the trunk at the silk's edge spans u ≈ 20488–20566, centre ≈ 20527, v ≈ 1780.
  - At v 1450 it spans 20449–20582, plus a hanging limb at 20404–20438 (v 1383–1460).
  - Its base reads just **east** of 20500. t9 has recorded it as `S3.tree.dark_trunk_bare_20525`, base u 20525, east of the seam. S2's t1 may record it too, so the lead should settle t9 versus S2 t1.
- **`S3.road.south_street_20250`** reaches the seam at (20500,1705,est). It may be the south-bank street running on into S2, under the roofs at S2's bottom edge.

**structures_w at u 18000:**
- **A duplicate in disguise, already resolved.** The railed far-bank shop at u 17875–18212 is structures_w's `S3.bld.far_hall_17875`.
  - Its corner centroid is u ≈ 18088, so by the tool's main point it is mine. structures_w owns it "by its SW corner" and recorded it first.
  - I had recorded the same building as `S3.bld.far_bank_shop_18040` and **dropped it from my part** before the merge, because the merge's near-duplicate check skips buildings.
  - My reading of it, for the merge or second pass to compare: front base line at the lattice railing's foot v ≈ 205–210 (rails at v 179 and 204), u 17875–18212; west wall a double vertical at u 17876–17879 (v 108–175); east post 18200–18208 (v 83–208); eave (lowest roof line) at v 94–98, against structures_w's v 82; tiles up to the silk's edge (v ≈ 12).
  - West of it, under the same roof line, are structures_w's `far_shop_17725` and the shops further west.
- The lead may want one rule for which point owns a building at a unit boundary. The tool's main point (`world` pos) is the corner centroid; structures_w used the SW corner.
- **The dark mat-roofed shed** (roof u 17590–17923, v 940–1093) is structures_w's: main point ≈ 17760.
- **The pale diamond-lattice mat awning** (u 17843–18170, v 925–1110) overlaps that shed's east end. I read it as a mat awning on poles over a goods stall (rows of small elongated goods on a slanted board at 18080–18220, v 1013–1180), so it is a tile prop (t4 or t5 by its base, about 18000). If structures_w reads it as part of the shed, the merge keeps one.

## Things at my range's edges, and possible duplicates

- **`S3.bld.mat_shed_19160`.** t7's hint calls it "the stall under the arch's south foot". It has a gable roof of plaited mat on posts with people seated inside, so I recorded it as a building. If t7 also records it as a prop, drop one at merge: the near-duplicate check skips cross-kind pairs.
- **`S3.bld.far_bank_shed_18280`** may be the west wing of `S3.bld.far_bank_hall_18520` (the note says so). They have different IDs and no double counting.
- **`S3.bld.north_bank_shed_19620`** may be read by t8 or t9 as a stall frame (a prop). Same remark.

## Scale cues (px)

- Far-bank shop (`far_hall_17875`): front 337 wide; eave to railing foot about 112 tall.
- Far-bank hall: deck front 200 px along the diagonal plus 112 px on the east stretch; posts about 140 px from fascia to deck.
- Tavern: front about 325 wide; table top about 65 × 24; posts about 165 px from skirt to floor.
- Big building at the bridge's south foot: south gable column span 311; tie beam 295; north eave span 1055.
- Mat shed 19160: roof 290–345 wide; ridge to eave 125 px of v.
- Mat shed 19530: roof about 380 wide; board front about 85 tall.
- Open shop: eave to floor line about 165.
- Tile-capped wall: coping 20 wide.

## Receding-edge table (for the dx knots)

Ground level, or near it:

| # | edge | (u1,v1) -> (u2,v2) | slope dv/du | level | conf |
|---|---|---|---|---|---|
| 1 | low board or bench lying at the open shop's floor line, west side | (19792,1612) -> (19817,1574) | −1.52 | ground | med-low |
| 2 | same board, east side | (19840,1612) -> (19860,1574) | −1.90 | ground | med-low |
| 3 | tile-capped wall's coping, west of the big building | (18330,1775) -> (18490,1525) | −1.56 | wall top, about 1.5–2 m | med |
| 4 | tavern table top, west side | (20142,242) -> (20160,220) | −1.22 | table, about 0.8 m | low-med |
| 5 | tavern table top, east side | (20187,244) -> (20207,220) | −1.20 | table | low-med |
| 6 | parasol stall's table top in front of the open shop (t9's prop), its two sides | (20174,1634) -> (20197,1611); (20277,1646) -> (20311,1620) | −1.0; −0.76 | table | low: its leg feet give −0.41/−0.47, so the top's reading is unsure |
| 7 | far-bank hall's tables, short sides | about (18465,221) -> (18475,212) and (18520,240) -> (18530,234) | −0.6 to −0.9 | table | low: the hall is turned |

High lines, for comparison only:

| # | edge | (u1,v1) -> (u2,v2) | slope | level |
|---|---|---|---|---|
| 8 | big building's ridge | (18861,1507) -> (19128,1155) | −1.32 | ridge, about 5–6 m |
| 9 | big building's west eave | (18418,1771) -> (18580,1561) | −1.30 | eave |
| 10 | big building's east eave | (19362,1775) -> (19650,1400) | −1.30 | eave |
| 11 | open shop's west hip | (19650,1395) -> (19750,1293) | −1.02 | hip |
| 12 | tavern's west eave | (20055,120) -> (20195,35) | −0.61 | eave, at the top of the silk |

Suggested knots, as dx = 51.25 / |slope|:
- **middle** ≈ [18450, 33] (row 3, the wall top);
- **east** ≈ [19850, 30] (rows 1–2, mean −1.7);
- the far north bank at the top reads flatter, ≈ [20180, 43] (rows 4–5; low, table height).

These agree with S4b's seam knot of 31.6. The big building's low roof lines (−1.30) are not flattened much. The tavern's eave (−0.61) is flattened, like S4's high lines (−0.56 to −0.61). Wall check: the big building's ridge and both eaves are parallel (−1.30 to −1.32), so the building is drawn square to that direction.

## Diminution (my own sample, ±5 px; the tiles' parts will give the full curve)

| figure (owner) | foot (u,v) | head v | painted height px | / near |
|---|---|---|---|---|
| porter with shoulder-pole baskets, west of the wall (t5) | (18310,1705) est | 1513 | ~192 | 1.0 |
| man on the open ground at the bridge's south foot (t5) | (18461,1309) | 1149 | ~160 | 0.84 |
| standing man inside the open shop (t8) | (19868,1552) | 1470 | ~82 | 0.43 |
| man at the north-bank cart (t9) | (19860,218) | 118 | ~100 | 0.52 |
| porter with two baskets on the north bank (t8) | (19685,127) | 32 | ~95 | 0.50 |

- The far north bank (v 120–220) is painted at about 0.5 of the near size. That is larger than S4's far figures (0.3 at v 220).
- **The open shop's interior at the bottom edge is drawn at about 0.43 of the near size although its foot v is 1552.** Figure size is not a function of foot v alone. The rows of buildings at the bottom edge behind other roofs are painted as if further away than their v says. This matters for `map/BUILDING.md` rule 5 (real size, painted place) and for the frame's checks there.

## Left to other agents (painted things I saw and did not record)

Checked against the parts that landed while I worked (bridge, river_w, river_e, structures_w, t1–t6, t8, t9). Already recorded by others:
- t4's `S3.prop.lattice_mat_awning_17840` (the diamond-lattice awning);
- structures_w's `S3.bld.mat_shed_17590`;
- river_e's banks `S3.grd.far_bank_18450`, `south_bank_19300`, `south_bank_20120`, `north_bank_20250`;
- t5's `far_shed_table_18265` and `far_shed_bench_18288`;
- t8's `parasol_far_stall_19440`;
- t9's `parasol_stall_table_20245` and `tree.dark_trunk_bare_20525`.

t7's part had not landed: check the t7 items below at merge.

**t4 / t5:**
- the goods displayed under the lattice awning's east edge (18080–18220, v 1013–1180), if t4 or t5 did not record them;
- the seated man at (18010, 120–140) and the tables at 18050–18200 (v 120–165) in structures_w's `far_hall_17875`.

**t5:**
- the round parasol beside the far-bank shed (18340–18450, v 35–75) with its pole;
- the shed's two tables (18240–18303, v 120–167; 18290–18330, v 115–140) and the seated man at (18315, 85–125);
- the hall's tables and benches in its west half (18380–18500, v 190–260);
- the two big parasols at the south foot (18350–18550, v 1380–1500) with a lamp-box hanging under one (18450–18475, v 1455–1510);
- a small box on the wall's north end (18470–18490, v 1515–1530);
- the porters west of the wall (18290–18420, v 1500–1770).

**t6:**
- the hall's tables and benches in its east half (18500–18680, v 190–260);
- a lamp-box or chest at the wall's north end (18660–18690, v 1475–1510);
- the man behind the wall (head at 18615, v 1495–1545);
- the small figure standing inside the big building's south gable (18819–18850, v 1723–1775);
- the willow crowns behind the hall (18720–19000, v 70–250), whose trunks are hidden (t6 or t7).

**t7:**
- a small gabled stall canopy on the far bank: apex (19020,62), eaves (18961,93) and (19108,104), a post at 19022 (v 62–118), a horizontal at v 116;
- two parasols on the far bank (19047–19172, v 68–104; 19108–19244, v 104–150);
- a tall pole (19169–19179, v 21–157);
- the people seated at tables in `mat_shed_19160` (19080–19300, v 1140–1250) and its table top (19155–19218, v 1190–1200);
- the tables and benches in front of `north_bank_shop_19290` (19190–19383, v 60–97).

**t8:**
- the stall under a parasol at the north bank's top edge (19390–19480, v 20–125);
- the figures under `north_bank_shed_19620` (19560–19800, v 20–130);
- the parasols by `mat_shed_19530` (19400–19630, v 1070–1125, pole 19510–19535 to v ≈ 1205; 19650–19800, v 1180–1240);
- the heads at 19600–19700, v 1080–1260 (on the bank, or at the west end of the boat moored along the bank: river_e);
- inside `open_shop_20000`: the long table (19762–19850, v 1505–1565), the seated man (19753–19775, v 1440–1530), the standing man (19853–19880, v 1470–1552).

**t9:**
- the bench (19875–19920, v 1505–1545) and the low board (19792–19862, v 1572–1612) in the open shop;
- **a leaning framed signboard** standing on its own in the open shop (19962–20007, v 1543–1588), its writing unreadable (□□□□);
- the parasol stall in front of the shop: parasol 20164–20436, v 1450–1528; table legs at (20177,1689), (20214,1674), (20277,1714), (20320,1694); seated people;
- a figure walking at the bottom (20165–20185, v 1720–1790) and another at (20443–20471, v 1661–1778);
- the sack hanging from a pole at the open shop's east end (20380–20430, v 1590–1690). It is in the building's `what`; record it as a prop if it reads as a rack;
- the tavern's tables, benches and chairs (20142–20207, v 220–280; 20290–20380, v 190–280);
- a stall table west of the tavern (19970–20050, v 230–285) with a dark mass above it (20000–20050, v 140–210): a pile of goods, a stove or a small crown;
- the dark-trunked tree at the bottom (see the seam notes).

**bridge:**
- the north end post with its crossed top (u 20040–20055, v 20 to ≈ 400) at the tavern's west corner;
- the south end post (19015–19027, v 850–1250+) at the mat shed's west end;
- the deck's north newel post (20025, v 330–370).

**river_w:**
- a line of small knobs or stakes along the far bank's edge in front of `far_hall_17875` (17850–18320, v 225–235): a timber revetment or mooring stakes;
- the far bank's edge below the shed (18270–18400, v 300–330).

**river_e:**
- the bank under the far-bank hall: its stilts' feet stand at v 293–305 (18451–18663) on the slope;
- the south bank's edge under the arch (water to v ≈ 1010, 18950–19800);
- the north bank's edge under the tavern (boats' hulls from v ≈ 290–300, 20070–20395);
- a long pole or timber lying in the water at (18880–19260, v 940–990) with a knob at its east end (19250,945);
- the big boat's lowered mast and lines crossing the tavern (20100–20280, v 170–380), which I did not record as part of the tavern.

**S2:** the building east of the dark tree, the building behind the big willow, and the big willow (see the seam notes).

## Contradictions with `reference/scroll/sections.md`

None that change a vignette.
- Pin 21 (虹桥边的小酒馆, 19990): the tavern's west corner is at u ≈ 20055, 65 px east of the pin.
- The setup brief's range for the dark-trunked tree's base (≈ 20330–20420) is off. Its trunk meets the silk's edge at ≈ 20488–20566.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Trace a curve back to where it starts before calling a shed a boat.** On S3 a mat-roofed shed under the arch seemed to sit on a hull. The "hull" was a big roof's curved north-gable bargeboard: it runs from the gable's apex to its eave corner, and the shed's board front stands right above it.
- **On a roof seen from above at the bottom edge, find both gables' apexes and the eaves parallel to the ridge before you place the walls.** S3's big building at the bridge's south foot shows a gable truss only 311 px wide under an eave span of 880–1055 px, and its south eave corners lie below the silk. Record the apexes, eave corners, truss columns (as `bays`) and the ridge as custom points. Make the footprint S4's placeholder (the ridge's ground line ± half the eave span). Clamp corners below the silk to v 1795 and give the true estimate in the note.
- **Figure size does not follow foot v alone.** On S3 a man standing inside a building at the bottom edge (foot v 1552) is 82 px tall; men on the open ground at v 1300–1700 are 160–190 px. Rows of buildings behind other roofs are painted as if further away. Sample the diminution per area (the open ground, a building's interior, the far bank), not as one curve.
- **Buildings cut by the silk's top edge still count.** On S3's north bank only a lattice band, a beam or two and the tables set out in front show. Record them (conf low, a placeholder footprint at the edge, both readings). Otherwise the far bank is built from nothing.
- **Say which point owns a building at a unit boundary.** `world` takes a building's position as the centroid of its base corners. On S3, structures_w kept a far-bank shop "by its SW corner" while its centroid lay in structures_e's range, so both agents recorded it, and the merge's near-duplicate check skips buildings. Brief the structures agents: a building belongs to the unit holding its corner centroid. Before finishing, each lists any building within 300 px of its range's ends with its corners, so the pair can be compared.
- **Tool quirk:** `scroll_map.mjs <S> overlay` ignores unknown flags, so `overlay --help` writes `gen/map/<S>/overlay_<u0>_<u1>.jpg`. Pass `--out` under `look/` every time.
