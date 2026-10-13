# S2 structures_w: report (owns u 20500–24600 by main point, plus `S2.road.main` over 20500–29050)

Part: `gen/map/S2/parts/structures_w.json` (24 entities). `node tools/scroll_map.mjs S2 check --parts …` gives **PASS**
with no warnings. Overlays:
- `gen/map/S2/look/structures_w_overlay.jpg`: my whole look range (u 20350–24750), zoom 1, grid 50;
- `gen/map/S2/look/structures_w_road_east.jpg`: the road east of 24550 (zoom 0.5).

I read zoom-1 windows of every part (`ov_self_*`, `ov_road_*`) and a zoom-1.5 window of the eatery. The markers sit on
their strokes; placeholder corners are marked est. Crops and the generator script (`gen_part.py`) are in
`scratchpad/S2_structures_w/`.

## 1. The diminution (measured first; S2's land is at D ≈ 21–30 m)

Painted height = foot v − head v, for standing or walking adults. I left out children, seated figures and figures whose
feet are hidden by more than a gunwale. Most rows come from the tile and river parts (whose agents read each figure at
zoom 3). I checked eight of them on the scan: [24004], [28092], [27810], [28467], [21205], [20617], [23665] and the
hat walker, and I measured the rest myself. D is the frame's depth at the foot, (1565 − v) / 51.25 m, at H 0.

| foot v | D (m) | u | px | who (source, conf) |
|---|---|---|---|---|
| 116 | 28.3 | 24732 | 67 | man by the pole stack (t6, med) |
| 131–133 | 27.9 | 26362, 26424 | 54, 54 | far-street men (t8, med) |
| 146 | 27.7 | 21532 | 73 | robed man on the north-bank strip (t2, high) |
| 146 est | 27.7 | 25688 | 73 | far-street man (t7, med) |
| 147 | 27.7 | 26697 | 75 | walker at the top (t8, low) |
| 171 | 27.2 | 24506 | 95 | man at the horse's head (t6, low) |
| 235 | 26.0 | 21867 | 85 | lead tracker, slightly bent (t2, high) |
| 282 | 25.0 | 21994 | 83 | tracker (t2, high) |
| 301 | 24.7 | 23918 | 92 | man at the eatery's post (t5, med) |
| 373 | 23.3 | 24004 | 109 (117 to the hat's top, my read) | walker in a conical hat (t5, high) |
| 386 | 23.0 | 22172 | 93 bent (≈ 105 upright) | rear tracker (t2/t3, high) |
| 440 | 22.0 | 27666 | 95 | basket porter (t10, high) |
| 568 | 19.5 | 25338 | 108 | man on the bank (t7, high) |
| 590 | 19.0 | 25370 | 123 | man with a stick on the bank (t7, high) |
| 625 est | 18.3 | 27767 | 117 | pole-bundle carrier (t10, med) |
| 697 | 16.9 | 28467 | 133 | shed keeper (t11, high; my read ≈ 125) |
| 757 | 15.8 | 28092 | 144 | overseer at the sacks (t10, high; my read 144) |
| 779 | 15.3 | 28270 | 139 | bowing man (t11, high) |
| 905 | 12.9 | 27810 | 148 | pole holder (t10, med; my read 141) |
| 905 est | 12.9 | 28222 | 136 | youth (t11, med) |
| 1412 est | 3.0 | 21255 | 145 | smaller figure, south bank (t1, med) |
| 1428 est | 2.7 | 21205 | 196 | tall man, south bank (t1, high) |
| **boats** (foot = deck, est) | | | | |
| 210–212 | 26.4 | 21505, 21678 | 84, 80 | crew of the big cabin boat (river_w, med) |
| 338 | 23.9 | 20683 | 83 | boatman on a roof (river_w, high) |
| 420 | 22.3 | 20617 | 90 | boatman (river_w, med; my read ≈ 90) |
| 578–600 | 19.0 | 23800–23955 | 62–71 | crew on 逆水行舟's high cargo hull (river_m) |
| 893–1068 | 9.8–13.1 | 23665–23930 | 120–133 | foredeck crew of the towed boat (river_m, med; my read ≈ 110+ for the bowman) |

**Group means (land, standing, med/high).** The ratios use two yardsticks. S4's road figure is ≈ 100 px (1.3 × 77
px/m), the brief's yardstick for comparing with S4. "Life" is a 1.65 m adult at the frame's 77 px/m, ≈ 127 px.

| foot v | D (m) | mean px | ÷ 100 (S4's road figure) | ÷ 127 (life at the frame scale) |
|---|---|---|---|---|
| 116–150 (top and far street) | 27.5–28.5 | 66 | 0.66 | 0.52 |
| 170–260 | 26–27 | 87 | 0.87 | 0.68 |
| 280–400 (trackers, eatery, yard) | 23–25 | 94 | 0.94 | 0.74 |
| 440–600 (narrow bank) | 19–22 | 109 | 1.09 | 0.86 |
| 620–800 (porters' wharf) | 15–18.5 | 133 | 1.33 | 1.05 |
| ≈ 905 | 13 | 142 | 1.42 | 1.12 |
| ≈ 1420 (south bank) | 3 | 145–196 | 1.45–1.96 | 1.14–1.54 |

**What it says:**
- **S2 is painted much larger than S4 at the same v.**
  - S4 has 0.3 of its road figure at v 220, 0.5 at v 320 and 0.9 at v 850.
  - S2 has ≈ 0.87, ≈ 0.94 and ≈ 1.4 at the same heights.
  - S3's far bank is smaller too: 0.35 of 190 px at v 160, and trackers of ≈ 40 px at v 120. S2's north-bank
    strip is the same band of v painted about twice as large.
- **The fall-off inside S2 is gentle and steady.** From the wharf at v ≈ 900 (142 px) to the top street at v ≈ 130
  (66 px) the figures shrink to 0.46. From the south bank (≈ 170 px) to the top street they shrink to ≈ 0.4. Against
  life at the frame scale, the painted scale rises roughly linearly:
  - ≈ 0.5 at v 130;
  - ≈ 0.7 at v 300;
  - ≈ 0.85 at v 550;
  - ≈ 1.05–1.1 at v 750–900;
  - ≈ 1.3 on the south bank.
- **The boats agree.** Crew are 80–90 px at deck v 210–420 and 120–133 px at deck v 890–1070. The crew on 逆水行舟's
  high cargo hull (62–71 px at v ≈ 590) are small for their v: they stand on a deck far above its waterline.
- **For the frame:** at the one-scale frame, the north-bank strip (v 100–500, D ≈ 21–28 m) is painted at about 0.5–0.85
  of life. Buildings there built at real size are about 1.2–2 times their painted frontage. Rule 5 (real size, painted
  place) holds. The narrow strips are a separate problem:
  - west strip: 25–65 px of v, ≈ 0.5–1.3 m;
  - level strip in front of the scaffolded building: ≈ 10–20 px, ≈ 0.2–0.4 m;
  - in front of the halls: 40–60 px, ≈ 0.8–1.2 m.

  These are below walkable at the frame's depth rate. As the lead's note for S3 says, they are build-time choices.
  This is the evidence the user should see before S2 builds.

## 2. Counts

| kind | n | entities |
|---|---|---|
| building | 15 | north bank west: `shop_row_21200`, `open_shop_21640`; middle: `long_house_22780`, `river_terrace_23250`, `lattice_pavilion_top_22945`, `hall_behind_terrace_23380`, `far_lattice_front_23470`, `eatery_shelter_23750`, `house_behind_eatery_23855`, `open_shop_24020`, `open_shop_24300`, `shop_behind_cart_24525`; south bank (roofs only, placeholder footprints): `south_bank_hall_21050`, `thatched_shed_south_21600`, `gable_house_south_21730` |
| structure | 8 | `slat_fence_20740`, `low_kerb_20920` (low), `tiled_wall_21810`, `slat_screen_22375` (low), `white_wall_22485`, `gateway_22573`, `stone_steps_22950` (low), `panel_screen_23555` |
| road | 1 | `S2.road.main`: 50 stations, 20500 → 29050, centre, edge_n and edge_s |
| grd | 0 | the south-bank mound is river_w's `S2.grd.mound_south_bank_21420`; my reading of its crest agrees with river_w's within 5 px, so I did not record a second one. The open yard and banks are covered by the road's edges and the river agents' banks |
| figures, animals, trees, props, groups | 0 | (not mine) |

There are 15 buildings, slightly above the brief's estimate of 12–15. Of these, 6 have conf low (the three south-bank
roofs, the far lattice front, the house behind the eatery and the pavilion at the top). Footprints seen only as roofs,
or cut by the silk's top edge, have **placeholder** corners (est), and each note says so. The north-bank placeholders
put the back corners at the silk's top edge, carried along the local receding slope (−1.1 west, −1.27 middle). Hidden
backs use 110–150 px of v. The south-bank corners are clamped to v 1795.

## 3. `S2.road.main` (the route)

- **Point 0 is exactly (20500, 258) est.** It is S3's last centre point (`gen/map/S3/parts/structures_w.json`). Its edges
  (edge_n 215, edge_s 280) are copied too, so the frame needs no reconciliation there.
- **The last point is exactly (29050, 730).** This is S1's datum: the open ground in front of the 望楼饭铺 shed's east
  end, just south of the rider's animal (hooves at v ≈ 690, t12). Bare ground runs on east at v ≈ 650–860 in front of
  S1's stalls.
- **The edges:**
  - edge_n is where the open ground stops at fronts, walls, stalls and tables.
  - edge_s copies the river agents' bank_top: river_w over 20500–21850, river_m over 23300–26000, river_e over
    26000–28900.
  - **Over u 21850–23300, river_w2's part had not landed**, so edge_s there is my estimate (t3: shore v ≈ 470–500).
    The merge should replace it with river_w2's bank_top.

| stretch | where the route runs | v (centre) |
|---|---|---|
| 20500–21750 | the strip between the shop row, the open shop and the fences (fronts v 100–141) and the boats moored against the bank (bank_top v 162–232) | 140–258 |
| 21750–22300 | the trackers' towpath diagonal (their feet (21867,235) → (22172,386)), south of the split willow's feet | 195–380 |
| 22300–22920 | in front of the slat screen, the white wall, the gateway and the long house (fronts v 302–414) | 390–448 |
| **22920–23500** | **through the dining terrace's floor (est)** | ≈ 422–425 |
| 23500–24600 | in front of the panelled screen and the eatery shelter's front posts, then across the wide unloading yard (open ground v ≈ 180–490) | 410–448 |
| **24600–26600** | **the narrow bank in front of the scaffolded building, the halls and the warehouse** | 501–635 |
| 26600–29050 | north of the great willow's foot, along the jetty's deck and the lower shed's front, across the porters' wharf just north of the sacks, along the long shed's front | 656–870 |

**At the terrace (22920–23500).** No open ground is painted here: the terrace fills the bank, its front floor on posts
over the slope.
- (a, taken) The route goes through the terrace's floor, from its west end (beside the long house's east doors and the
  head of the stone steps) to its open east side by the pavilion. This follows S3's route through the tavern's open
  front.
- (b) The route goes behind the terrace (hidden). There is no room for it on the silk.
- The floor is about ground level at the back and on posts at the front. The frame may give this range a
  `support_ranges` entry `terrace floor: S2.bld.river_terrace_23250`. The builder records the choice.

**The halls (24600–26600): the route takes the narrow bank, not the far street.**
- It is continuous with the unloading yard. The porters walk from the yard toward the boats, and the strip opens in
  front of the scaffolded building's wall foot.
- People and mooring posts stand on it: t7's two men, and the posts at (25207, 548) and (26018, 630).
- It leads past the great willow onto the wide east bank: the jetty, the sheds, the sack porters, the 望楼饭铺 customers
  and S1's stalls, which is where the datum must be.
- The far street (v 15–150) is cut by the silk's top edge and shows only between and behind the halls' roofs. It ends
  in the top street at 王家纸马铺 and the 望火楼, and that street does not reach the ground at 29050, where roofs and
  willow crowns fill the top.
- The route stays inside the painted area. Its **widths are the problem** (section 1).
- At u 25450–26600 it is hidden behind the moored boats' mat roofs (est).
- The far street is a side street for structures_e (`S2.road.far_street_…`).

## 4. Receding-edge table (west and middle, for the dx knots)

dx = 51.25 / |dv/du|. "Ground" means a ground-level edge.

| group | edge | (u1,v1) → (u2,v2) | dv/du | dx | level, conf |
|---|---|---|---|---|---|
| west | shop row's east side wall, post foot to post foot | (21425,135) → (21457,99) | −1.13 | 45 | **ground**, med |
| west | gateway roof, west side | (22499,193) → (22521,167) | −1.18 | 43 | low roof (≈ 2.5–3 m), med |
| west | gateway roof, east side | (22593,210) → (22616,181) | −1.26 | 41 | low roof, med |
| west | shop row's roof, east end | (21420,67) → (21457,20) | −1.27 | (40) | eave/verge, high, short |
| west | south-bank hall's NW hip | (20570,1547) → (20887,1323) | −0.71 | – | a hip runs diagonal to the plan: **don't use** |
| west | slat fence's foot | (20793,160) → (20887,130) | −0.32 | – | a fence set at a slant: **don't use** |
| middle | eatery table, east end | (23902,349) → (23922,328) | −1.06 | 48 | **ground furniture**, short (±0.3) |
| middle | eatery bench, east end | (23860,365) → (23875,352) | −0.83 | 62 | ground furniture, short |
| middle | shop-front table, east end | (24010,220) → (24020,205) | −1.5 | 34 | ground furniture, short |
| middle | shop-front table, west end | (24060,225) → (24074,204) | −1.5 (−1.25 on a second read) | 34–41 | ground furniture, short |
| middle | shop-front table, east end | (24137,230) → (24151,212) | −1.29 | 40 | ground furniture, short |
| middle | t4's eatery table | (23714,368) → (23722,357) | −1.4 | 37 | ground furniture (t4) |
| middle | t5's shop table / bench ends | (24067,205) → (24085,192); (24060,227) → (24075,215); (24012,206) → (24050,186) | −0.7, −0.8, −0.5 | 73, 64, 102 | ground furniture (t5, rough) |
| middle | terrace's upper roof, west verge | (23004,244) → (23100,184) | −0.63 | – | high line (flattened, like S4's −0.56 to −0.61) |
| middle | hall behind the terrace, west hip | (23059,86) → (23141,32) | −0.66 | – | high line |
| middle | panelled screen, both rails | (23512,407) → (23595,375) | −0.31 to −0.39 | – | a screen set at a slant: **don't use** |

- **West:** one true ground edge (−1.13) and two low-roof lines (−1.18, −1.26), with mean **−1.19, dx ≈ 43**. This is weak
  (n = 3). It agrees with S3's tavern edges of −1.0 to −1.12 (dx 46–51).
- **Middle:** furniture only, all short and soft. My five reads give −0.83 to −1.5, with mean −1.24 (dx ≈ 41). t4's
  reads −1.4. t5's reads of the same tables give −0.5 to −0.8. All nine together give mean **−1.06, dx ≈ 48**, with a
  scatter of ±0.35.
- No long ground-level receding edge exists in u 20500–24600. There are no cart shafts (t5's cart bed runs along the
  street at −0.18), no receding wall foot except the shop's side, and no step side.
- I suggest **one knot of ≈ 45 ± 5 px/m** for the stretch 21400–24200, which continues S3's ≈ 46–51 without a jump.
  Check it against the mapped walls: the long house's and the gateway's fronts run along u, at slopes +0.04 and ≈ 0.

## 5. Hard or ambiguous (all in the notes, conf lowered)

- **The scan's resolution limits everything on the north bank.** Zoom 3 is the useful limit. I read shapes on
  contrast-stretched crops (zoom 1.5–3) and points on gridded overlays. Points are ±5–8 px, and short furniture edges
  are ±0.3 in slope.
- **Shop row (20950–21460):** one continuous eave and tile band over four bays. I recorded it as one building. t1 read
  two shops.
- **Open shop at 21540–21740:** a plinth under the open floor (the restyle draws one) is possible. Its roof band runs on
  east behind the tiled wall to ≈ 21880, either as the same building's east part or as a second roof.
- **Slat screen (22320–22435):** either a free-standing fence with a cap (t3's reading) or the lattice front of a
  building under the big roof (the restyle's). Conf low, both readings in the note.
- **White wall vs a house:** no door, window or eave of its own, so I recorded a compound wall joining the gateway.
- **Long house:** its east bays (22910–22977, doors) could be the terrace's west room instead. The roof over
  22320–22650 behind the screen and wall is either this house's or a second building's.
- **Terrace:** its floor line is measured (sill v 438–456; stilts to v 485–495). Its back is hidden, so its back corners
  are a placeholder. The two-tier roof (a plain light upper roof over a tiled eave) matches the restyle.
- **The hall behind the terrace, the far lattice front and the small lattice building at the top** are seen only as roofs
  or lattice strips. All three have conf low and placeholder footprints.
- **The south bank's three roofs.**
  - The big hall's ridge runs WNW–ESE (+0.36), askew to the picture like the bank.
  - Its NW hip is a high line.
  - All three footprints are below the silk: placeholders, clamped to v 1795.
- **The east route (26600–28900)** follows river_e's bank_top. The jetty's deck edge is the level ground's edge there.
  I first drew the route lower, on the bank slope, and moved it up after reading river_e's part.
- **The restyle** was useful for what the masses are: the fence's gate, the wall's coping, the gateway's roof, the
  terrace's roofs and the shops' layout. I took no positions from it. Its stair at the terrace's west end is a neat stone
  flight, but the scan has rough stones. Its walkers on the bank strip and its willow at 24600–24900 are not painted
  (the tiles confirmed both).

## 6. Seam notes

**S3 (u 20500):**
- `S2.road.main` point 0 = `S3.road.main`'s last point (20500, 258) est, with the same edges.
- **A small hut or stand at u 20440–20495** is not recorded by S3's structures_e: its tavern `S3.bld.tavern_20230` ends at
  20445. The hut has a little gabled roof at v 222–245 and posts to v ≈ 268, with a slatted frame or gateway behind it at
  u 20480–20530 (v 160–250). By its middle (≈ 20485) it is **S3's**. The lead or S3's merge should add it, or settle
  that it is part of the tavern. (t1 flagged it too.)
- `S3.bld.open_shop_20000`'s ne corner (20575, 1400) and se (20445, 1605) lie just west of my
  `S2.bld.south_bank_hall_21050`. Its roof's NW corner is at (20570, 1547); its placeholder sw is (20570, 1795) and nw is
  (20640, 1600). The big dark tree (t1's `S2.tree.dark_trunk_willow_20530`) stands between them.
- `S3.road.south_street_20250` ends at (20500, 1705) est. S2 has no south-bank road: the south bank east of 20500 is
  roofs, the people by the great willow and the mound.
- `S3.grd.north_bank_20250` (bank_top (20500, 300) est) agrees with my edge_s of 280 at the seam within 20 px.

**S1 (u 29050):** `S2.road.main`'s last point is (29050, 730) for S1's datum. Edges there:
- edge_n (29050, 695) est, the shed's east end and the rider;
- edge_s (29050, 1000) est: the ground runs on south under the willow crowns; river_e's shore turns south at ≈ 28968
  and does not reach 29050.

**Unit edges:**
- **structures_e (24600):**
  - My `shop_behind_cart_24525` (footprint middle 24554) reaches to 24667 at its back.
  - The scaffolded building's sweeping west eave over the stall comes west to (24572, 427). It is part of structures_e's
    building.
  - I own the road east of 24600. My edges there are my reading for them to check: edge_n is the fronts, edge_s is the
    river banks.
  - The far street is theirs as a side street. It starts at the yard's north-east corner (u ≈ 24500–24700, v ≈ 100–180,
    where t6's basket porter walks at (24804, 120)).
- **t4:** the support `terrace floor: S2.bld.terrace` (t4's placeholder, 11 entities) should become
  `terrace floor: S2.bld.river_terrace_23250`.
- **t5:** its eatery shelter, shop fronts and the building behind the eatery are recorded here. The tall post at
  u ≈ 23940–23945 (v 211–367) is in the shelter's note as its east post. If t5 recorded it as a free-standing pole, keep
  t5's.
- **river_w:** my road's edge_s copies its bank_top. Its mound is the only record of the mound.
- **river_w2:** its bank_top over 21850–23300 should replace my est edge_s there (the merge).
- **t7:** its placeholder `upper floor: S2.bld.yanhe_yazuo_hall` is structures_e's.

## 7. Supports

- All my entities are on `ground`. The terrace's diners use `terrace floor: S2.bld.river_terrace_23250`. I did not use
  that support myself, but the floor-line derivation is in the terrace's note: the front sill is at v 438–456, the shore
  straight below at v 485–495, and the back of the floor is at the bank's top (the long house's wall foot, v 406–414).
  The floor is about ground level, plus a small step.
- For the route: a possible `support_ranges` entry (u 22920–23500, terrace floor). The jetty stretch (27100–27400) is at
  street level by river_e's reading, so no entry is needed there.

## 8. Scale cues (px, with foot v)

- Shop row bays 105–120 wide; posts ≈ 70 from eave to foot at v ≈ 140.
- Open shop's posts ≈ 50 at v ≈ 115.
- Tiled wall ≈ 95 tall at v 152.
- Slat fence 75–110 tall at v 130–226; its gate ≈ 40 wide.
- Gateway: opening ≈ 113 tall (lintel v 205, sill v 318); leaves ≈ 60 wide; ≈ 75 between posts.
- White wall ≈ 120 tall at v ≈ 305.
- Long house: wall ≈ 120 tall (pent eave to foot) at v ≈ 410; front ≈ 252 long.
- Terrace: bays 110–140; balustrade ≈ 65 (top rail to sill) at v ≈ 440; stilts ≈ 45.
- Panelled screen ≈ 55 tall at v ≈ 390.
- Eatery shelter's posts 130–165 (eave to foot) at v 389–417; its tables ≈ 40 tall (t4, t5).
- Open shop at 24020: posts ≈ 95 (pent eave to foot) at v ≈ 193.
- t5's cart wheel ≈ 73 diameter at v 267.

## 9. Painted things I saw and left to another agent

| what | where (scan px) | to |
|---|---|---|
| the small hut or stand with a slatted frame behind it | u 20440–20530, v 160–270 | **S3** (structures_e; not in its part) |
| the loose wheel at the kerb; the table and basket in the shop row's open bay | (20957–20973, 132–147); u 21128–21192, v 85–140 | t1 (recorded) |
| the post on the strip in front of the shop row | (21364, 140–188) | t2 (recorded) |
| the figures in the open shops at the top (21680–21730; 23950–24420) and on the banks | | t2, t5 (recorded) |
| the shrub or lattice at the slat screen's east foot | u 22395–22437, v 195–290 | t3 (`S2.tree.shrub_or_screen_22416`); mine if a lattice panel |
| the plants along the long house's wall foot | u 22625–22905, v 330–414 | t3 (recorded) |
| the shelving or stacked boards behind the panelled screen (named in its note) | u 23505–23590, v 275–330 | t4 (props), if not part of the screen |
| the tables, benches, rack and furniture of the eatery and the shop fronts; the round object hung on a wall (in my shop's `what`) | u 23500–24300, v 190–420; (24053–24073, 107–137) | t4, t5 |
| the ox cart, mules or horse, porters | u 24170–24640, v 70–470 | t5, t6 |
| the stall under the scaffolded building's west eave | u 24635–24742, v 385–495 | t6 (recorded) |
| the scaffolded building with its sweeping west eave, scaffold and striped cloth; the halls; the warehouse; the wattle fence under the great willow's knob head | u 24572–26970 | structures_e |
| the far street (as a side street) | u ≈ 24500–26900, v 15–180 | structures_e |
| 逆水行舟's tow rope across the bank strip and the terrace's stilts | v ≈ 385–510, u 21830–24180 | river_m |
| the stone steps' water side, the shore and bank under the terrace | u 22870–23500, v 400–500 | river_w2 |
| the south bank's shore and the mound (recorded) | u 20500–21960 | river_w |
| the jetty (recorded as `S2.str.jetty_27260`) | u 27100–27420 | river_e |

## 10. Against `reference/scroll/sections.md` and the brief

- Nothing contradicts §2 in u 20500–24600; the scholarship names no building here.
- **The brief's "terrace on posts over the water"** stands at the bank's edge. Only its front floor is on posts, over the
  bank's slope; the stilts reach the shore. It does not stand out over open water.
- **The brief's "shops at the top u ≈ 20800–21600"** are one long shop row (20950–21460) plus a fence and a kerb west of
  it, and an open shop at 21540–21740.
- **"The eatery shelter"** is a mat-roofed shelter. A small house with a lit doorway stands behind it (t5's), and two
  open-fronted shops stand east of it at the top.

## 11. Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Measure the diminution from the tiles' parts, not from scratch.** When the structures agent runs late, the tile and
  river parts already hold dozens of figures with foot and head. A script that lists the standing adults by foot v gives
  the table in a minute; check a handful on the scan. S2 built its table from about 30 figures this way.
- **The road's edge_s is the river agents' bank_top.** Where a route runs along water, copy the river units' bank_top
  (the level ground's edge) at the road's stations instead of reading your own. On S2 my own reading put the route on
  the wash slope below the jetty and in front of the scaffolded building. The level strip there is only 10–20 px of v
  deep.
- **A route through a building is a valid, recorded reading.** Where a building fills the bank to the water (S2's dining
  terrace, S3's tavern front), run the route through its floor, `est`. Give the alternative in the note and the support
  range for the frame. Never drop the route below the silk or invent ground.
- **Placeholder back corners must contain the figures on the floor.** Shifting a hidden back along the receding slope
  can push a building's west side east of the people painted inside it (S2's terrace). Check every placeholder footprint
  against the tiles' feet on its floor support.
- **Short furniture edges disagree between agents** (S2: −0.5 to −1.5 on the same tables). Report every reading with its
  stroke points and use the group mean. A knot from furniture alone is weak, so say so.
