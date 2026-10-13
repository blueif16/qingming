# S2 structures_e: report (owns u 24600–29050 by main point, looked at 24450–29200)

Part: `gen/map/S2/parts/structures_e.json` (28 entities). `node tools/scroll_map.mjs S2 check --parts …` gives
**PASS** with no warnings. Overlay of the whole range: `gen/map/S2/look/structures_e_overlay.jpg` (zoom 1, grid 50,
u 24450–29200, v 0–1350). I read zoom 0.6–1.5 overlay windows of every part, and zoom 2–4 greyscale and colour crops
with the east restyle stacked under them. The markers sit on their strokes; placeholder corners are `est`. The crops,
the crop script `g.mjs` and the generator `gen_part.py` are in `scratchpad/S2_structures_e/`.

## 1. Headline for the frame: the receding direction turns over in S2's east half

West of u ≈ 26500, things recede **up-right**, as in S3 and S4. From u ≈ 27600 to 28650 every ground-level furniture
edge I could read recedes **up-left**: the short sides of the tables slope **+0.9 to +1.25**. The 望火楼's pavilion
agrees. Its front posts stand on the two ends of the brick face, with the railing between them, and its back posts
sit 45 px to the **left**. 王家纸马铺 (u 26915–27290) between them is drawn frontal: its floor line is level, at
v 200–203.

So the dx knots must change sign between u ≈ 26500 and 27600:
- west group: dx ≈ +51 px/m;
- east group: dx ≈ −49 to −52 px/m;
- a straight interpolation crosses 0 near u 27050, at the frontal 纸马铺.

t11 found the same slopes on its tables (+0.72 to +1.06) and flagged them. The table is in section 5.

## 2. Counts

| kind | n | entities |
|---|---|---|
| building | 21 | the scaffold house `scaffold_house_24975`; `open_shop_25340`; `tall_rear_hall_25330` (roof only); 沿河雅座 `yanhe_yazuo_hall_25690`; `warehouse_26070`; `white_wall_house_26330`; on the far street `far_shed_25785`, `far_long_shed_26260`, `mat_hut_26515` and `open_shed_26755`; 王家纸马铺 `wang_paper_horse_shop_27100`; `top_long_house_27560` (roof only); `low_shed_27245` (roof only); 喝杯小酒 `eating_shed_west_27300`; `lower_shed_27780`; `tiled_shed_27985` (pin 11 河边店铺); `gable_loft_house_28060`; `rear_shed_28380` (roof only); the 望火楼 pavilion `fire_tower_28440`; 望楼饭铺 `wanglou_shed_28660`; `far_shed_top_28720` (faint) |
| structure | 3 | the 望火楼 platform `fire_tower_platform_28450`; `wattle_fence_26890` (low); `railed_stair_27630` (low) |
| road | 1 | `S2.road.far_street_26200`, the side street at the top, u 24620–27300 |
| grd | 3 | `yard_pole_frame_27500` (the empty yard); `wharf_yard_28100` (the porters' ground); `bank_lines_top_28900` (two long lines at the top, low) |
| figures, animals, vehicles, trees, props, water, groups | 0 | not a structures agent's |

That is 21 buildings plus the 望火楼 set piece, matching the brief's "18–22 and a set piece". By confidence:
- med: 15;
- low: 13 (roof-only buildings, the far street's faint sheds, and the in-between readings below).

## 3. What was hard or ambiguous (each is in its entity's `note` with both readings)

### The scaffold house and its neighbours
- **The scaffold** (u 24880–25240, v 20–245) is a crown of lashed poles that runs back along the scaffold house's roof
  ridge from its south gable. Its east part stands above the tall rear hall's west slope. Other reading: a free-standing
  building scaffold behind the house, with its feet hidden.
- The **banner on a pole** (pole (24745,178)–(24913,183), cloth with three stripes) and the **sweeping mat awning** over
  t6's stall (tip (24566,426)) are fixed to the house, so I recorded them in its `what` and points. The restyle's willow
  at u 24600–24900 is these poles, t6's pole stack and the banner.
- **Two knobs at the ridge's west end:**
  - (24838,255) has two lobes, so I read it as a ridge-end ornament;
  - (24867,245) has a squared cap over a light patch, and I can't decide whether it is an ornament or a head;
  - t6 recorded both as heads (conf low). The merge should settle them on one crop.
- **The tall rear hall** (finial (25410,73), with a paddle-like object lying on its east hip) may be the upper roof of
  the open shop, which would make the two one building.

### The halls and the far street
- **沿河雅座 is a raised room.**
  - The window sill / floor line is at v 457–476, and the posts' feet on the bank are at v ~565: about 100 px of
    raised floor.
  - The warehouse east of it shares the same long roof without a break. Its closed lattice doors stand on a
    plank-faced plinth (foot v ~625).
  - I recorded the hall and the warehouse as two buildings because their fronts differ.
- **The far street** (v 15–150) is faint and cut by the silk's top edge, so its sheds are low or med. t8 reads
  u 26075–26320 as a lean-to plus a lattice-fronted building. I read one long shed with a light back wall. The note gives
  both.

### 王家纸马铺
- **The building is u 26915–27290**: an open front with shelves, a floor line at v 200, and an east end wall at
  27287–27340.
- **Its west end:** a rounded light shape at 26905–26940 (v 35–110), which I read as the roof's west hip or gable end
  (t9: or a tree top, or the restyle's "lamp"). There is also a dark slanted bar (26873,47)–(26910,63) above the
  sign's cap, either an eave strut or the sign's hook.
- **The sign on its post is t8's prop.** I read the characters as 王家紙馬… at zoom 3; t9 reads 王家□□□. t8 should
  settle them.

### East of the 纸马铺
- **The yard east of the 纸马铺 is empty on the scan.** The restyle's twelve people there are invented.
- **The pole frame** is t9's prop `S2.prop.pole_frame_27490`. It stands free in the yard, so I agree with t9 and did
  not record it.
- **The slanted balustered railing** between the frame's east end and the tiled shed's gable post
  (`railed_stair_27630`, rail (27560,248)–(27690,298)) is a structure t10 left to me. It could be a stair, a ramp or a
  gallery rail.
- **The eating sheds.** I split the long building on the bank into:
  - the big tiled-roof shed with its mat awning (喝杯小酒, u 27040–27560);
  - the lower shed with a front gable, back blinds and four tables (u 27565–27995; t10's "lower shed").

  One long shed with a cross-gabled east part is the other reading.
- **The tiled shed (u 27692–28275):**
  - t10 reads its gabled west bays as a separate "upper shed";
  - t11 reads its roof as running on east to 28480, over my `rear_shed_28380`;
  - the notes give all three readings.
- **The house with the balustraded loft** (gable apex (28037,168)) is a two-storey or attic gallery. Nobody is on it.

### The 望火楼 (set piece)
- **Platform:**
  - The brick face is clear at u 28393–28548, from v 203 to at least 283. Below 283 its foot is hidden behind
    `rear_shed_28380`'s roof.
  - A balustered railing runs along the top edge (u 28400–28513, v 180–197).
  - A straight wooden stair with a hand-rail climbs from the lower left: from (28290,277) to the front-west corner
    (28388,198).
- **Pavilion:**
  - four posts, a pyramidal tiled roof with eaves at (28313,150) and (28577,148), and the finial at (28428,70);
  - post lines at u 28343, 28387, 28495 and 28540; I took 28387 and 28540 as the front posts (the up-left reading in
    section 1); the other reading is in the note.
- **No figure stands on the platform, on the stair or in the pavilion.** That agrees with 余辉: a fire tower with no
  watchman.
- **The restyle's wide stepped stone terrace (u 28315–28540) is invented.** The scan has one brick face and a wooden
  stair.
- **The platform's height:** at least 80–85 px of face is painted, and the rest is hidden. No figure stands at its
  foot to compare. Figures at v 200–300 are painted 70–95 px tall, so the visible face alone is about one figure high.

### 望楼饭铺 and the top right
- **望楼饭铺** has:
  - two big hipped thatched roofs and a lower front skirt of thatch on many posts;
  - a slat wall, a slatted fringe and a valance at the east end (t12's points).

  Its last post stands on the seam (u 29043–29053).
- **The restyle invents a hillside with terraced fields at the top right** (u 28600–29200). The scan has:
  - a faint long shed (`far_shed_top_28720`);
  - two long level lines (`bank_lines_top_28900`), recorded low with the readings "a bank or field edge" and "the
    two edges of a path".
- **The wattle fence under the great willow** (`wattle_fence_26890`, low; river_e, t8 and t9 left it to me) can also
  be read as t9's tree's knobbed foot (`knob_foot` (26890,676)) with a small post-and-rail frame beside it.

## 4. The diminution

structures_w measured it first and in full (its report, section 1). I checked one point: the overseer at the sacks
(t10, u 28092) is 139–144 px tall at foot v 757–767, against structures_w's 144. The east bank's figures at
v 700–900 are 133–148 px. That is larger than the bank strip's 108–123 px at v 570–590 and the far street's
54–75 px at v 130–150. The painter brings the east wharf close to the viewer.

## 5. Receding-edge table (east and middle, for the dx knots)

Slope is dv/du. The model for converting it: `u = ou + ax·X + dx·D`, with 51.25 px of v per metre of depth, so
dx = −51.25 / slope; up-right is positive. "Table" means the short side of a tabletop (about 25–45 px above its
feet) or a bench seat. All are furniture at ground level unless the row says otherwise.

| group | edge | (u1,v1) → (u2,v2) | dv/du | dx px/m | conf |
|---|---|---|---|---|---|
| middle | 沿河雅座's long interior table, west end (raised floor, seen through a window) | (25690,412) → (25702,400) | −1.0 | +51 | low |
| middle | far-street table under the long shed (t8's), west end | (26145,118) → (26160,100) | −1.2 | +43 | low |
| middle | white-wall house: its short ridge sits to the right of the wall's middle (roof level; direction only) | ridge (26386,214)–(26493,235) over wall 26232–26420 | (up-right) | + | low |
| middle | warehouse: its east gable end is visible (26470–26515, v 164–245; direction only) | | (up-right) | + | low |
| east | lower shed, table at u 27600–27740 (t10's), east end | (27705,752) → (27735,778) | +0.87 | −59 | med |
| east | lower shed, table at u 27855–27990 (t10's), west end | (27855,758) → (27880,782) | +0.96 | −53 | med |
| east | tiled shed, table at u 28030–28110, west end | (28030,455) → (28050,475) | +1.0 | −51 | med |
| east | the same table, east end | (28090,455) → (28110,475) | +1.0 | −51 | med |
| east | tiled shed, table at u 28150–28240, west end | (28150,455) → (28170,478) | +1.15 | −45 | med |
| east | 望楼饭铺, table at u 28565–28640, east end | (28620,565) → (28640,590) | +1.25 | −41 | med |
| east | t11's reading of `table_28205`, west side | (28152,454) → (28182,476) | +0.73 | −70 | med |
| east | t11's reading of its bench | (28160,470) → (28196,496) | +0.72 | −71 | med |
| east | t11's reading of `table_28598`, east end | (28615,574) → (28632,592) | +1.06 | −48 | med |
| east | t10's reading of `table_27672`, east side | (27710,752) → (27732,778) | +1.2 | −43 | low |
| east | 望火楼 pavilion: back posts 45 px left of the front posts (structure level) | 28387 → 28343, 28540 → 28495 | (up-left) | − | low |

**Means:**
- my six east edges: slope +1.04, dx ≈ −49;
- all ten east furniture edges: slope +0.99, dx ≈ −52, scatter −41 to −71;
- the middle group: dx ≈ +43 to +51 (two low edges), consistent with structures_w's west and middle and S3's −1.0 to
  −1.12.

**Not receding edges.** These run along the bank in the X direction:
- the sheds' fronts slope down to the east by +0.19 to +0.30:
  - the eating shed's eave (27045,546) → (27480,662), +0.25;
  - the tiled shed's foot line (27692,438) → (28275,549), +0.19;
  - 望楼饭铺's posts' feet (28300,575) → (28640,670), +0.28;
  - the jetty's railing, +0.30–0.35;
- the 纸马铺's floor line is level (26915–27290, v 200–203);
- the frame's X axis is horizontal, so east of the 纸马铺 these buildings stand turned (about 15°) to the picture, or
  follow the bank.

**Unusable edges:**
- the tiled shed's two door posts, (27692,438) → (27738,413), slope −0.54: the plane of the gable is unclear;
- the 望火楼's stair, −0.93: a rising stair.

## 6. The route and the road edges east of 24600 (for structures_w's `S2.road.main`)

**My reading:** the route runs along the narrow bank strip in front of the buildings, not along the far street. That
is what structures_w recorded, and I agree. The far street is my side street, `S2.road.far_street_26200`.

The evidence for the bank strip:
- it continues S3's route on the bank;
- people and mooring posts stand on it (t7's two men at v 568–590, t6's post at (25207,548));
- it opens east onto the jetty and the wharf yard, and it reaches 29050 at v ~690–730.

The far street is hidden at u 24850–25500 behind the scaffold and the tall rear hall's roof.

Points to check against structures_w's edges:

| u | edge_n (fronts) | edge_s (bank / shore) | note |
|---|---|---|---|
| 24745–25205 | scaffold house wall foot, v 500 → 505 | bank strip to the shore, ≈ 600–640 | |
| 25210–25475 | open shop floor line, v 503–505 | ≈ 600 | structures_w's edge_n there, v 470 est at u 25350, could be the shop's v 503 |
| 25475–25905 | 沿河雅座 post feet, v 565 | hidden under the moored boat's mat roof | |
| 25905–26240 | warehouse plinth foot, v 625 | river_e's bank_top 628–632, then the boat | under 1 m of strip |
| 26233–26425 | white-wall house foot, v 590 | ≈ 640 | |
| 27000–27560 | eating shed's posts, v 720–780 | the jetty's front (river_e) | the route runs on or along `S2.str.jetty_27260` |
| 27565–27995 | lower shed's front posts, v 828–840 | the bank top, ≈ 900–980 | |
| 28000–28275 | the tiled shed's front, v 530–549 | the bank top, ≈ 975–985 | the porters' yard is open from v ~550 to ~980 |
| 29050 | 望楼饭铺's east post, foot ≈ 630 | | structures_w's (29050,730) lies in the open ground just south of it |

structures_w's edge_n at u 28050–28250 (v 690) is narrower than the open ground, which reaches the tiled shed's
front at v ~550.

## 7. Seam notes

**S1 (u 29050):**
- `S2.bld.wanglou_shed_28660`: its east bay's post stands on the seam (u 29043–29053, v 497–630; t12). The rear
  thatched roof ends at ~29030–29050 against the willow over S1's stall. Nothing of the shed is east of the seam.
- `S2.grd.bank_lines_top_28900`: its lines cross the seam at (29050,150) and (29050,192). I stopped them there. They
  run on to (29200,145) and (29073,192), toward S1's "bank lines and diagonal track at the top (≈ 29200–29900,
  v 90–300)". Whether they are a bank or a path's edges should be settled together with S1's structures_w.
- At the top, a curved line (28999,83) → (29079,126) crosses the seam at v ~108, next to an upright block at
  u 28984–28999 (v 80–103) (t12). It is in `far_shed_top_28720`'s note, not recorded: S1's structures_w should look.
- `S2.bld.far_shed_top_28720` ends at u ~28950.

**structures_w (u 24600):**
- My `scaffold_house_24975` reaches west to 24566 with its awning tip (24566,426).
- structures_w's `shop_behind_cart_24525` reaches east to 24667 at its back.
- My `far_street_26200` starts at (24620,150) est. It comes out of structures_w's open yard north-east of the cart,
  where t6's porters walk (u 24730–24810, v 116–120).

**Duplicates I avoided:**
- river_e's `S2.str.jetty_27260` is the raised plank walkway, so I did not record mine. My reading of it, for the
  merge:
  - railing top (27135,764) → (27475,841);
  - deck edge (27135,791) → (27375,850);
  - posts at u ~27175, 27216, 27253, 27285, 27321, 27375, with feet at v ~890–900;
  - river_e reads the feet stepping down, 842 → 947.

  Both readings put the jetty on the bank slope above the water.
- t9's `S2.prop.pole_frame_27490` is the frame in the yard. I dropped my structure version.

**Possible duplicates for the merge to settle:**
- t11's `S2.prop.table_pavilion_28455` (a plank at 28400–28508, v 181–196) is the platform's front railing in my
  reading: points `rail_w` and `rail_e` of `S2.str.fire_tower_platform_28450`. Drop the prop if the merge agrees.
- t6's two heads at the ridge (`S2.fig.head_over_roof_w_24840`, `S2.fig.head_over_roof_e_24867`) are discussed in
  section 3.
- t6's `S2.prop.signboard_pole_25235` is the open shop's board and pole. I name it in the shop's `what` and did not
  record it again.
- My `wattle_fence_26890` against t9's `S2.tree.willow_great_27068` and its `knob_foot` (section 3).

**Groups:** none (structures).

## 8. Supports used, and supports for the tiles

- My entities stand on `ground`. The pavilion stands on `fire tower platform` (the platform's top edge is at
  v ~200–203, with the face's foot hidden at ≥ 283).
- **For t7's window figures:** `upper floor: S2.bld.yanhe_yazuo_hall_25690` (replacing t7's placeholder
  `upper floor: S2.bld.yanhe_yazuo_hall`). The floor line is at v 462–468; the ground straight below (the posts' feet)
  is at v ~565.
- **For anyone on the jetty:** `jetty deck: S2.str.jetty_27260` (river_e's ID).
- **Nobody needs `fire tower platform`.** No figure is painted on it.

## 9. Scale cues (px; foot v)

| thing | foot v | measurements |
|---|---|---|
| scaffold house | 500 | wall 95–100 tall; front 460 long |
| open shop | 503 | eave 185 above the floor; opening ~265 wide |
| 沿河雅座 | 565 | window openings 77 tall; raised floor ~100 above the bank; posts 100 apart |
| warehouse | 625 | door bays ~100 wide and 155 tall; plinth ~70 high |
| white-wall house | 592 | wall ~150 tall |
| 王家纸马铺 | 200 | eave ~100 above the floor line; front 375 long |
| eating shed | 720–740 | eave ~170 above the posts' feet; awning ~120 above them |
| lower shed | 830 | back beam ~170 above the front posts' feet; tables 100–130 long |
| tiled shed | 549 | eave ~165 above the east post's foot; tables ~90 long and ~35 high |
| 望火楼 | | face ≥ 80–85 visible; posts 50–60 from the platform top to the eave; roof ~80 from eave to finial; eave span 264; front posts 153 apart |
| 望楼饭铺 | 660–670 | front skirt ~120–130 above the posts' feet; posts 50–100 apart |
| far-street shed posts | ~133 | 55–60 tall |

## 10. Painted things I saw and left to another agent

| what | where (scan px) | to whom |
|---|---|---|
| the stall under the scaffold house's awning (table, goods, people), the pole stack, the horse and porters | u 24500–24810, v 20–500 | t6 (recorded) |
| the board and tall pole at the open shop's west end | u 25185–25240, v 244–500 | t6 (recorded, `signboard_pole_25235`) |
| the open shop's goods rack and shopkeeper; 沿河雅座's tables, seats, ladder and window figures; the far-street furniture, barrow, cart and animals | u 25250–26200 | t7 (recorded) |
| the capped posts on the warehouse's plinth face | u ~26010, 26120 (v 560–630) | t7, t8 (recorded as mooring posts) |
| an oar- or paddle-like object lying on the tall rear hall's east hip | u 25439–25487, v 83–119 | in the hall's points (`paddle`); a t7 prop if the merge reads it as a loose oar |
| 王家纸马铺's signboard on its post, with its characters | u 26878–26913, v 70–222 | t8 |
| the willow at the top (u ~26580–26720) and the man leading a donkey (26800–26860) | | t8 |
| the paper-offering stand in front of the 纸马铺 | u 27045–27120, v 100–242 | t9 |
| the pole frame, its trestle with a slatted board, the low stand under it | u 27262–27612, v 105–308 | t9 (recorded) |
| the eating shed's tables, benches and big round mat parasol | u 27150–27563, v 613–840 | t9 |
| the great willow (trunk to ≈ 27068, 905) and its knob head | | t9 (recorded) |
| the tub vendor and his tub; the lower shed's tables; the tall A-frame with the pennant cord; the basket porter; the man at the railing | u 27600–28000 | t10 (recorded) |
| the tiled shed's two tables; the long slatted bench / board rack at 望楼饭铺's west end; 望楼饭铺's tables and customers; the trees at the top (u 27900–28650) | | t10, t11, t12 |
| the faint low things under `far_shed_top_28720` (sticks, forked stem, tub) | u 28687–28940, v 80–125 | t12 (recorded, low) |
| the jetty; the north bank and shore; the boats and their crews | | river_m, river_e (recorded) |
| the curved line and upright block at the top, crossing 29050 | u 28984–29079, v 80–126 | S1's structures_w |
| `S2.road.main` | | structures_w (section 6) |

## 11. Against `reference/scroll/sections.md` and the brief

- **The 望火楼, "≈ 28260–28580":** its pavilion eaves span 28313–28577, the brick face 28393–28548, and the stair from
  ~28285. The scan agrees. The restyle's stepped terrace does not.
- **王家纸马铺, "≈ 26850":** that u is the sign on its post. The shop itself spans u 26915–27290 (main point 27100).
- **"Two rows of barracks-type sheds now serving as eateries, ≈ 27700–28800":**
  - upper row: the tiled shed (27692–28275) and the roof behind 望楼饭铺 (28220–28540);
  - lower row: the lower shed (27565–27995) and 望楼饭铺 (28297–29048).
- **The brief's "big halls ≈ 25050–26450":** three buildings under related roofs: the open shop with the tall rear
  hall, 沿河雅座 (25470–25905) and the warehouse (25905–26240). The white-wall house (26233–26425) closes the row.
- **The receding direction turns over** east of the 纸马铺 (section 1). sections.md says nothing about it, but the
  frame and the builder must know it.

## 12. Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **The painter's recession can turn over within one section. Measure both ends before knotting.** In S2 the tables
  west of u 26500 recede up-right (slope ≈ −1), as in S3 and S4. From u 27600 to 28650 every table's short side
  recedes up-left (+0.9 to +1.25). 王家纸马铺 between them is drawn frontal, with a level floor line. A set piece can
  confirm the direction: on the 望火楼, the front posts stand on the ends of the brick face, the railing runs between
  them, and the back posts sit 45 px to the left. Give the frame agent a knot for each group and say where the turn
  falls.
- **Read a tabletop as a parallelogram.** With the back edge and the front edge both level, the side that slants
  says which way depth goes: if the back edge is shifted left, depth recedes up-left. A colour crop at zoom 2–3 with
  the restyle underneath settles it; the restyle draws the furniture's lean correctly even where it invents people.
- **Don't take a building front or eave as a receding edge.** S2's east sheds stand turned to the picture: their fronts
  run down to the east at +0.2 to +0.3, while their tables recede at about +1. A front is the X direction (turned);
  only the short sides of things give depth.
- **Check the neighbours' parts before writing a seam entity.** Structures agents finish last. By then the river agent
  had recorded the jetty (on land) and a tile had recorded the free-standing pole frame. Both came with "if
  structures_e also records it, keep one". Read `gen/map/<S>/parts/*.json` and the tiles' "left to structures_e" lists
  before finishing: they also named a wattle fence, a balustered railing and a roof knob that a structures pass by
  range would have missed.
- **A set piece's restyle is a guess about its base.** The restyle turned the 望火楼's single brick face and wooden
  stair into a wide stepped stone terrace. Take the platform's corners from the brick courses' ends, and its back
  corners from the pavilion's post shift, as `est`.
