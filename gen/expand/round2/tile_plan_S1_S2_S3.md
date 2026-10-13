# Tile plan: S3 (the Rainbow Bridge), S2 (the canal), S1 (the countryside)

The prep agent's draft, 2026-10-12, from gridded scan crops at zoom 0.4–0.9. The densities are the lead's eye
estimates; the tile agents count. Tiles own `[start, end)` by main point and look 150 px past both ends. The rules are
last round's (skill `scroll-section`, "Mapping a section"), plus Phase 0's boat convention (`phase0_questions.md` §4):
anything on or in the water belongs to a river agent, and everything on land to the tiles.

**Agents per section:** S3 14 (9 tiles, a bridge agent, 2 river, 2 structures), S2 16 (11 tiles, 3 river,
2 structures), S1 11 (9 tiles, 2 structures). Start the bridge, river and structures agents first, because they are
the critical path (S4's structures agent took about 80 min). The S4/S6 tiles took 27–80 min and about 300k tokens each.

## S3 虹桥, the Rainbow Bridge, u 15500–20500

Restyle `rect [15344, 0, 5312, 1792]`, overview `4096x1376`, 6 × 2 tiles, 13 images.

| tile | owns u | density | what is there (to verify) |
|---|---|---|---|
| t1 | 15500–16300 | open, about 15 | the river with two boats under way (≈ 15550–15900, ≈ 15950–16200, masted; pin 25 河边泊船 (纤夫) at 15690); the long riverside hall (≈ 15530–16450), with diners at its windows and veranda; willows |
| t2 | 16300–17000 | medium, about 15–20 | the long boat moored at the far bank (≈ 16450–17300); the far-bank shops at the top; trees; the west part of 十千脚店 (≈ 15500–16800 by sections.md's reading) |
| t3 | 17000–17550 | dense, about 25–30 | the foot of the 彩楼欢门 scaffold (≈ 16800–17340) and the tavern door; the 十千脚店 lamp-box (≈ 17000); the 新酒 flag (≈ 17430); the street with a horse and riders |
| t4 | 17550–18050 | very dense, about 35–40 | the 串车 (≈ 17550, pin 24); boats unloading at the south bank (≈ 17500–18100, v 700–1000); stalls, carts, porters; far-bank shops |
| t5 | 18050–18500 | very dense, about 35–40 | the parasol stalls and the crowd at the bridge's south foot (≈ 18400–18900); the 饮子 stall (≈ 18500, pin 22) |
| t6 | 18500–18900 | very dense, about 35–40 | the south ramp and deck: stalls on the deck, the crowd |
| t7 | 18900–19350 | very dense, about 35–40 | the crown: the sedan-versus-horseman standoff (车轿相争, ≈ 18700–19300); people at the railings throwing ropes (上下呼救); pin 18 虹桥 (18920) and pin 20 拥挤的桥面 (19240) |
| t8 | 19350–19850 | dense, about 25–30 | the north ramp and the bridgehead at the top; the south bank under the arch, with men waving at the boat (≈ 19900–20200, v 900–1100) |
| t9 | 19850–20500 | medium, about 20–25 | the south bank's shops at the bottom (≈ 19700–21000); the north bank's shops at the top (≈ 19900–20500, v 0–200); pin 21 虹桥边的小酒馆 (19990) |

- **bridge** (the whole bridge): `S3.str.rainbow_bridge`, with its arch, ribs, deck, railings, abutments and both
  ramps, and the deck's height profile (see risk 1). The stalls on the deck are the tile agents' props.
- **river_w** (15500–18300) and **river_e** (18300–20500): the water, both shores, the banks, the landing stairs, every
  boat and everything on it. River_e has the big boat under the arch with its mast lowered and about 20 crew
  (大船抢险, ≈ 19500–20450; pin 19 at 19970). That alone is a tile's worth.
- **structures_w** (15500–18000) and **structures_e** (18000–20500): the buildings, including 十千脚店 with its
  scaffold (a set piece: part of the building, recorded pole by pole where they can be read), the far-bank and
  bank-side shops, and the roads. structures_w owns `S3.road.main` for the whole route: along the south bank, over the
  bridge (its deck stretch is copied from the bridge agent's part at merge), and along the north bank to u 20500,
  where S2's route continues.
- **Seams:**
  - u 15500: see `phase0_questions.md` §5. The hall and the boat under way are S3's; the biggest rafted boat and the
    willow are S4b's.
  - u 20500: the big boat (bow ≈ 20450) is S3's. The boat moored along the north bank from ≈ 20400 eastward goes by its
    main point (most likely S2's). The big willow at the top, ≈ 20500–20600, is S2's. The south bank's roofs straddle
    the seam (by main point).

## S2 汴河, the canal, u 20500–28700

Restyle `rect [20336, 0, 8512, 1792]`, overview `4096x864`, 10 × 2 tiles, 21 images. The overview is less than half
the scan's resolution here. If its colours prove too coarse, run the restyle as two pipeline sections (west and east
halves) with no change to the map.

The land is the north bank along the top of the silk (v 0–500). The near (south) bank shows only at the bottom of
u 20500–22300. Further east the water runs to the silk's bottom edge.

| tile | owns u | density | what is there (to verify) |
|---|---|---|---|
| t1 | 20500–21300 | medium, about 15 | the south bank's end (shops and people at the bottom); willows; north-bank people |
| t2 | 21300–22100 | medium, about 15 | the near bank's willows; trackers on the north bank pulling a rope to a boat (≈ 21700–22200, v 100–300) |
| t3 | 22100–22900 | medium, about 15 | the north-bank buildings; the rope's line |
| t4 | 22900–23700 | medium, about 15–20 | the north-bank terrace with diners (≈ 22900–23200); 豪华客船 (≈ 23000, pin 17) is the river agent's |
| t5 | 23700–24500 | medium, about 15–20 | the north-bank street with carts and porters (≈ 23800–24800, v 0–400); 逆水行舟 (≈ 24200, pin 15) is the river agent's, while its trackers are this tile's |
| t6 | 24500–25300 | medium, about 15 | a pole scaffold on a shop at the top (≈ 24700–25000); buildings; porters carrying goods to the boats |
| t7 | 25300–26100 | medium, about 15 | 沿河雅座 (≈ 25700, pin 14); the riverside buildings |
| t8 | 26100–26900 | medium, about 15–20 | 王家纸马铺 (≈ 26850, pin 13); 汴水悍激 (≈ 26670, pin 7: the water's painted lines, the river agent's); a willow; the top street |
| t9 | 26900–27600 | dense, about 20–25 | 喝杯小酒 (≈ 27320, pin 12); the west end of the sheds; the people on the jetty (≈ 27000–27500; the jetty itself is the river agent's); the two deep-laden grain boats 万石船 (≈ 27300–28800, pin 8 at 27460) are river_e's |
| t10 | 27600–28150 | very dense, about 30–35 | the 望楼饭铺 sheds (≈ 27700–28800); the porters carrying grain sacks ashore while the owner sits on the sacks (私粮进京/仓前成市, ≈ 27950–28350; pin 9 at 27950); pin 11 河边店铺 (28090) |
| t11 | 28150–28700 | dense, about 20–25 | the east end of the sack crowd; the 望火楼 at the top (≈ 28260–28580); the sheds' east end with their customers |

- **river_w** (20500–23300), **river_m** (23300–26000) and **river_e** (26000–28700): about 6–7 boats each, with
  crews; the water, both shores where painted, the banks, the jetty and the mooring posts. The tow ropes are part of
  their boats, and their land ends name the trackers.
- **structures_w** (20500–24600) and **structures_e** (24600–28700): the north-bank buildings (cut by the silk's top
  edge), the south bank's end, and `S2.road.main` (the north-bank street: the route) for the whole length, owned by
  structures_w. The 望火楼 (a pavilion on a high brick platform) is a set piece, recorded by structures_e.
- **Seams:**
  - u 20500: as for S3 above.
  - u 28700: the long 望楼饭铺 shed (≈ 28250–29000) has its sw corner in S2, but its customers at u ≈ 28700–28950
    would fall to S1 by the main-point rule. **Consider moving the S1|S2 seam to about u 29050**, east of the shed and
    its customers. sections.md puts the undisputed boundary in a zone, "x ≈ 28700–29000" (`sections.md:35–36`). That
    is a change to `map/sections.json` and `map/index.md` (the lead's call).
  - The boat at the bottom (≈ 28300–28750, v 1500–1800) goes by its main point.

## S1 郊野, the countryside, u 28700–37610

Restyle `rect [28544, 0, 9072, 1792]`, overview `4096x816`, 10 × 2 tiles, 21 images. The same caveat applies as for
S2's overview. The silk ends at u ≈ 37610, with seals beyond. Seals also overlap the silk at about u 37150–37450 (v 50–200, 650–850, 950–1250, 1650–1800): they are never recorded.

| tile | owns u | density | what is there (to verify) |
|---|---|---|---|
| t1 | 28700–29500 | medium, about 10–15 | the village tea and food stalls (≈ 28800–29800; pin 10 城乡交界处 at 28940); willows; the river at the bottom left |
| t2 | 29500–30300 | medium, about 10–15 | the stalls' east end; cattle and a donkey at the top (≈ 29400–29600); a thatched farmhouse (≈ 30000–30200); riders at the bottom; pin 5 菜地 (≈ 29900) |
| t3 | 30300–31100 | dense for S1, about 20 | the tomb-sweeping party with the willow-decked sedan, the riders and the porters (≈ 30600–31200, pin 6); travellers on donkeys (≈ 30000–30600, lower half, pin 4); the runaway horse (≈ 30000–30900, upper half; its front half is lost to damage); a thatched hut |
| t4 | 31100–32100 | open, under 10 | the great old willows (隋堤烟柳, ≈ 31000–32600, pin 3 at 32190) |
| t5 | 32100–33200 | open, under 5 | willows; faded open ground |
| t6 | 33200–34300 | open, under 10 | the threshing floor and thatched farmhouses (寂静的谷场, ≈ 33400–35200, pin 2 at 34100); bare trees |
| t7 | 34300–35400 | open, under 10 | farmhouses and trees |
| t8 | 35400–36300 | open, under 5 | trees; the stream; the small bridge's west end (≈ 36100–36500) |
| t9 | 36300–37610 | open, about 7–10 | the charcoal donkey train (5 donkeys and 2 drivers, ≈ 36300–36850; pin 1 at 36550); the small bridge; the mist at the start; the seals (not recorded) |

- **structures_w** (28700–33000) and **structures_e** (33000–37610): the farmhouses (thatched), fences, the threshing
  floor, the small bridge, and `S1.road.main` (the country road, the route; owned by structures_e from the bridge
  westward, with structures_w continuing it in its part, joined at merge). Also the stream, the river at the bottom
  left near u 28700–29300, and the ground features: fields, banks, mounds and paths, as `grd` lines. With so little
  else here, the ground is the bulk of the work. This is the lead's countryside-ground pilot.
- If there is a boat in S1's range (the one at the bottom left), t1 records it with the boat convention. A river agent
  isn't worth it here.

## Frames: in order along the scroll

Tile mapping doesn't wait for frames (it is in scan px). The frames do wait, each on its east neighbour:
- **S3** after S4b. Its knots start with S4b's dx at u 15500, and its datum is S4b's road centre at u 15500 with S4b's
  station there.
- **S2** after S3. Its knots start with S3's dx at u 20500, and its datum is S3's north-bank route point at u 20500.
- **S1** after S2, in the same way at u 28700 (or 29050 if the seam moves).

Every frame keeps S5's origin, 77 px/m and 51.25 px of v per metre (`map/README.md:101–114`). The water level is
S4b's (`phase0_questions.md` §4).

## Critical risks

1. **The Rainbow Bridge.**
   - *The deck heights.* The deck rises over the arch, but a support has one constant H (`tools/scroll_map.mjs:
     233–238`), and the page drops people from H + 1.2 m onto the first surface below (`web/src/people.js:272`). With
     one `bridge deck` H, figures on the crown fall through to the water and figures on the ramps float.
   - The options are support keys per deck zone (`bridge deck: crown`, `bridge deck: south ramp` …) or a small tool
     change: a support with an `H_profile` of `[u, H]` pairs, interpolated by the point's u. Decide before the bridge
     agent writes its supports.
   - *The bridge itself.* The bridge is a set piece for its factory (the woven-beam arch), with a walkable deck
     collider.
   - *The route over it.* The bridge's north end lands at v ≈ 100–250, close to the silk's top edge. Check that the
     route stays inside the painted area.
2. **Boats.** About 9 in S3 and 16–20 in S2. They need:
   - the Phase 0 convention signed off;
   - the boat kit from its factory;
   - the S4b pilot passed, before S3 and S2 build.

   Rafted and overlapping hulls hide their waterlines (`est`, with the gunwale above as evidence). The crews are large
   (about 20 on the boat under the bridge). Boats painted under way (rowed, towed, the mast being lowered) need the
   user's decision on static versus moving. Boats are painted smaller up the silk, so build them at real size with
   rule 5 (`phase0_questions.md` §4).
3. **The river and both banks.**
   - S3's route runs along the south bank, crosses the bridge and continues along the north bank.
   - S2's land is the north bank only, at v 0–500. That is D ≈ 21–30 m, inside the band the painter shrinks to about
     0.55–0.6 (`map/index.md` open question). The frame keeps one scale, so every S2 building will be narrowed under
     rule 5, and the street lies against the silk's top edge.
   - South of S2's water there is nothing painted from about u 22300 on, so it is mist (rule 4).
   - Which banks are walkable is the boat pilot's question (`round2_progress.md:25–26`). Have S2's structures agents
     measure the diminution (figure heights against foot v) early, so the user sees the evidence before S2 builds.
4. **One water level.** S4b measures it once, and S3, S2 and S1 reuse it. 1 m of error moves every boat, shore and
   crew member 1.5 m north or south (`scroll_map.mjs:217`). A section that reads it differently reports to the lead.
5. **The faded countryside (S1).**
   - The silk is dark and faded, the ground is ink wash, and the figures are small and faint. The restyle invents most
     where the silk is faintest: record nothing because the restyle shows it, and read faint things at zoom 3 with the
     restyle beside them.
   - The runaway horse's front half is lost to damage (`sections.md:292–293`): map what is painted, and nothing is built
     for the missing half.
   - Trees are the bulk of S1. Each tile counts them one by one, and the tree factory needs new forms (pollarded old
     willows, bare elms by the farmhouses).
   - The seals at the start overlap the silk.
6. **Seams mapped at the same time.** Name the straddlers before the agents start (above). Each area runs the cross-key
   seam check (`phase0_questions.md` §2), and groups list only their own section's IDs.
7. **Size.** S3 and S2 are the heaviest sections of the scroll in people and boats. The engine agent's streaming window
   and per-section budget (`round2_progress.md:38`) apply before they join the world.
