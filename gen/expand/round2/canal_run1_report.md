# S2 (`canal`, u 20500–29050): Run 1 report

Round 2's mapping workflow, 2026-10-12. The steps were:
- setup: the area brief, the restyle in two halves, and the tile brief;
- eighteen units: t1–t12, river_w, river_w2, river_m, river_e, structures_w and structures_e;
- the merge;
- four second-pass agents (west, middle, east-middle, east);
- the frame and layout;
- needs.

The brief is `gen/expand/round2/brief_canal.md`. The run is recorded in:
- `gen/map/S2/merge_notes.md` (the merge, the second pass and the frame step);
- `gen/map/S2/reports/*.md` (every unit, `setup.md` and `frame.md`);
- `sections/canal/notes.md`.

The needs list is `gen/expand/canal_needs.md`, and the lessons are in `gen/expand/canal_lessons.md`.

## For the lead first

1. **The receding direction turns over in S2's east half.** West of u ≈ 26200 every ground edge recedes up-right
   (dx +43 to +48). From u 27700 to 28650 all ten furniture edges, read by three agents, recede up-left (mean slope
   +0.99, dx −51.6). The 望火楼's back posts stand 45 px left of its front posts, and 王家纸马铺 is drawn frontal where
   the line between the two knots crosses 0 (u ≈ 26960).
   - **The frame uses the measured knots (option A):** dx ramps from +46.6 at u 25924 to −51.6 at 28121, then stays at
     −51.6 to the S1 seam. The ramp is −4.47 px/m per 100 px, three times S4b's suggested limit. Nothing folds, but
     over u 25924–28121 the rows north of the river stretch east–west: ×1.45 at mid-water, ×1.75 on the route, ×2.1 on
     the north strip and ×2.35 at the silk's top. The route from 25900 to 28250 is 53.9 m long.
   - **Option B** (hold +46.6) has no stretch and a 34.4 m route there, but every east-wharf edge, shed and the 望火楼
     maps 139–145° instead of 90°, and S1 would seed from +46.6.
   - **Option C** (the ramp held to 1.5) stretches the route ×1.25, and the edges still map at 125–140°.
   - **S1 seeds from −51.6** under A. To change, edit `dx_knots` in `scratchpad/S2_frame/mkframe.mjs`, rerun it, then
     run `scroll_map S2 all` and `map_layout S2`.
2. **The water level is S4b's −0.7, copied.** S2 has no reading of its own: no vertical face, quay or stair meets the
   water anywhere in u 20500–29050. Its three bounds agree and none is tighter: ≥ −0.99 at the landing steps, ≥ −1.0 at
   u 25250, |H| ≤ 3.2 in the east.
3. **The north bank's est shores map north of their own bank tops**, by 0.07–0.86 m, at u 20500–21720, 23300–26650.
   They are hidden behind moored boats and painted only 10–50 px below the tops. This is S3's and S4b's far-bank problem
   again. The builder should put the bank face at the bank top and the water under the hulls.
4. **The strips are thin, and the diminution is the user's evidence before S2 builds.** The frame keeps one scale. The
   route's strip is:
   - 0.56–1.56 m deep along the west bank;
   - **0.20–0.29 m** in front of the scaffold house (u 24700–25100);
   - 0.5–1.6 m along the halls;
   - 6–8 m only on the east wharf.

   Figures on the north bank are painted at about 0.5–0.85 of life (structures_w's table), so real-size buildings
   there need 1.2–2 times their painted frontage. Room to walk is a build-time choice (`build_choices.json`).
5. **Seventeen boats, and the boat factory's inventory differs from the map** (`gen/boats/types.md` #14–#30, in nine
   places, and three boats are missing). The headline: **逆水行舟 is towed, not rowed by eight men.** It is the southern
   hull, with its mast stepped on its own cabin roof and a 2350 px tow rope to the five trackers. The northern hull is a
   separate moored cargo boat, and the "small canopied boat" is that cargo boat's deckhouse. The needs list gives every
   mismatch by number, and the four groups of boats that will overlap at kit sizes.
6. **Seam things only the lead can settle:**
   - **Nobody records the small frame at u 20440–20530** (posts at 20461 and 20503, v 160–252, a lidded box at
     20445–20480). S2's second pass reads it as a separate small frame, S3's by its middle (≈ 20485). S3's
     structures_e reads it as the west bay of a building behind the willow, but S2 has no building there: the slat
     fence starts at 20593.
   - **`S2.grd.bank_lines_top_28900` and `S1.grd.terraced_fields_29450` are the same two lines read twice,** 2 px apart
     at the seam (a bank or path's edges; terraced fields). One reading should go.
   - **`S3.bld.open_shop_20000`'s placeholder back corner (20575, 1400, est) reaches past the seam** over the trunk of
     `S2.tree.dark_trunk_willow_20530` (u 20465–20600, v 1350–1776). The builders must keep the trunk outside S3's
     shop.
7. **The boatman (optional, about 30 credits).** If the catalogue makes S3's proposed boatman, S2's sweep crew give
   a better model: `S2.fig.sweepman_upright_22168`, 155 px and face on, where S3's is seen from behind. He would play
   about 85 crew across S4b, S3 and S2.

## Counts (398 entities after the merge, the second pass and the frame; `check` PASS, no warnings)

| kind | n | of which |
|---|---|---|
| figures | 140 | 74 on the ground, **53 on boats** (43 crew, 10 passengers), 5 on the terrace, 2 on 沿河雅座's upper floor, 3 on the bank slope, 1 on a cart bed, 1 riding, 1 standing in the river; 42 high, 56 med, 42 low |
| animals | 9 | 2 mules (the cart's team), 2 horses (one saddled, one feeding), 3 donkeys (one ridden, one dark), 2 birds (low) |
| vehicles, land | 3 | the mule cart, the crate barrow (low), the round-topped cart (low) |
| **boats** | **17** | 3 high, 13 med, 1 low; 2 under way (逆水行舟 towed, the sweep boat rowed), 15 moored |
| trees | 21 | 4 burl willows, 6 fan willows, 2 elms, 3 slender, 2 shoot trees, 2 weed clumps, 2 leafy shrubs; 6 low |
| props | 103 | 37 low; 36 tables, 21 benches |
| buildings | 37 | 18 low (most seen only as roofs) |
| structures | 12 | the 望火楼's platform, the jetty (on land), the landing steps, the gateway, walls, fences and screens, a railed stair |
| roads | 2 | `S2.road.main` (the route, 50 stations, 20500–29050) and the far street at the top |
| water / grd | 4 / 11 | four reaches of the 汴河; banks, the south mound and spit, the wharf yard, the yard under the pole frame |
| groups | 39 | |

**Crew per boat:**
- **逆水行舟** 11;
- **the cargo boat** 9 (two are pin 16's 聊天的伙计);
- **the six-man sweep boat** 6;
- **豪华客船** 6 (3 passengers);
- **the north-bank cargo boat** 6;
- **the big cabin boat** and **the moored boat** 3 each;
- **the covered boat, the open boat and the mat-cabin boat** 2 each;
- **the mat-roofed boat and the two grain boats** 1 each (the grain boats' both low);
- **the mat-shelter boat, the skiff, the small bow and the bottom boat:** none.

The briefs' guesses ran well above the strokes:
- t3 was briefed 10–15 figures and found 1;
- t9 was briefed 20–25 and found 1 certain;
- the river units were briefed 15–25 crew each and found 5–15;
- 喝杯小酒's tables, the jetty and most sheds are empty.

The merge had 403 entities with 147 figures. The second pass retired 8 (four of them crew that are a fender, a
windlass's disc and spokes, and a board) and added 3. `sections/canal/layout.json` has 140 figures, 21 trees and 198
other entities.

## The frame (`map/frames/S2.json`)

- **F1:** origin [8248, 1565], x 77, d [dx, −51.25], h 77, covers u 20350–29200.
- **Knots:** [[20500, 30.4], [22185, 43.1], [23989, 48.3], [25924, 46.6], [28121, −51.6]], constant beyond the last.
  - The seam knot is S3's last knot, 30.4.
  - Each other knot is 51.25 / |the group's mean slope| at the group's mean u.
  - The groups are: the west, 3 edges, weak; the middle, 9 furniture edges; the middle-east, 2 low; the east, 10
    furniture edges.
- **Wall checks** (90° expected):
  - the shop row's side 91.2°, the eatery table 92.0°, 沿河雅座's table 85.9°;
  - past 28121: 82.2° and 99.5°;
  - inside the turn: 124–131°;
  - 王家纸马铺's front −0.3° (drawn frontal).
- **Datum:** `S2.road.main:lines.centre.0` = S3's route point (20500, 258, est), **station +179.21**, world
  (149.05, 25.50). `merge_fixes.mjs` reads it from `map/strokes/S3.json` on every run. The route ends at (29050, 730),
  station **+314.87**.
- **Painted area:** sw (160.85, −4.39), se (267.21, −4.39), ne (290.62, 30.54), nw (147.06, 30.54). The west corners
  are exactly S3's east corners.
- **The deviation:** the turn of the receding direction (item 1 above).

**Supports:** 34, each from two stroke points or a stated assumption.

| support | H (m) |
|---|---|
| ground | 0 |
| water | −0.7 (copied from S4b; S2's checks above) |
| bank slope | −0.35 (assumed, half way down) |
| terrace floor: `S2.bld.river_terrace_23250` | 0 (the sill is level with the bank top) |
| upper floor: `S2.bld.yanhe_yazuo_hall_25690` | 1.30 |
| fire tower platform | 1.13 (a lower bound; nobody on it) |
| table tops | 0.40, 0.42 |
| cart bed: `S2.veh.mule_cart_24305` | 0.91 |
| perched: `S2.tree.willow_great_21345` | 10.47 |
| 23 boat keys | −0.43 to 3.39 (deck, roof, stern deck, bow deck, after roof, ladder; each the water plus the painted rise) |

**Checks (23):**
- the north-bank eaves come out 0.9–2.5 m (painted at 0.5–0.85 of life), and the warehouse's eave 3.3 m;
- 王家纸马铺's front is 10.7 m (in the stretch) and 望楼饭铺's 9.1 m;
- the boats are painted short against their crews: grain boat 1 8.6 m, 豪华客船 16.2 m, 逆水行舟 19.8 m (mast 8.6 m);
- the river is 23.2 m wide at u 21000.

**Questions (8):**
- the turn;
- the strips and the diminution;
- the banks against the water level;
- the route's open points: the wash slope at u 22600–23300, the warehouse plinth at 26100, and the stretch hidden
  behind the moored boats at 25450–26600;
- the boat decks;
- the water level;
- the seam notes;
- a tool quirk: `plan.jpg` labels the datum "station 0".

**The route:** structures_w's `S2.road.main` takes the narrow bank in front of the halls, not the far street at the top;
structures_w and structures_e agree. It runs through the terrace's floor at u 22920–23500 (`support_ranges` on the
terrace floor, H 0).

## What was hard to read

- **The receding direction:** the turn, above. Short furniture edges also disagree between agents (−0.5 to −1.5 on the
  same tables).
- **No water face anywhere:** the banks are wash slopes, and the shores are hidden behind moored hulls for most of the
  river.
- **Boat ends and hulls:**
  - boats moored end to end read as one at low zoom (the setup's "big cabin boat" is two);
  - a midship deckhouse read as a small boat;
  - a sweep's blade read as an empty skiff;
  - 逆水行舟's mast was read on the wrong hull, until it was followed down to its tabernacle;
  - four rudders hidden: bow readings from the visible end or a blade's slope, both readings kept.
- **Crew:** windlass discs, spoke ends, fenders, bitts and rudder heads all read as men. Four crewmen were retired at the
  second pass, and five crew stay low with the gear reading in their notes.
- **Faces and heads:**
  - a pale patch under an eave, judged too big against the wrong yardstick (kept low);
  - heads over roofs: one 鸱尾 retired, one kept low;
  - a white silk fleck read as a head (retired).
- **Trees:** the leaning willows' heads lie 200–300 px from their feet (the great willow at 27068); a split-trunk willow
  could be one tree or two; and the tree count was argued tree by tree:
  - the second bare tree on the south bank was added from S3's reading;
  - the two stems behind the top house were added (low);
  - no third tree between the elms.
- **The far street at the top** (v 30–160): figures 46–75 px, faint; the barrow or a porter, the cart or a stall, a
  rider or a walker.
- **The restyle invented most** where the setup warned (`sections/canal/notes.md`):
  - about twelve people under the pole frame;
  - crowds on decks;
  - seven trackers for five;
  - figures in willow knobs;
  - dry ground and then a shop street under the moored boats;
  - a stepped stone terrace under the 望火楼;
  - a hillside of terraced fields at the top right.
- **Tool friction:**
  - zsh's word splitting broke crop loops (three units);
  - no contrast-stretched overlay, so five units wrote their own;
  - the overlay draws no custom polylines (the tow rope).

## Seam notes, by the neighbours' IDs (S3's and S1's files were not edited)

**S3 (u 20500).**
- **Road, water and banks** match at 0 px. `S2.road.main`'s point 0 is `S3.road.main`'s last point (20500, 258, est).
  The north shore is (20500, 310, est) and the south shore (20500, 1235, est), both S3's.
- **`S2.tree.dark_trunk_willow_20530`** is S2's; S3 retired its copy (`S3.tree.dark_trunk_bare_20525`). S3's t9 reads
  it bare, and S2 reads a willow. Its pale limb crosses S3's open shop roof to (20383, 1085).
- **`S2.tree.bare_south_bank_20705`** (low) and **`S2.fig.figure_under_eave_20625`** (low) were added on S3's t9's and
  structures_e's readings.
- **`S2.veh.boat_mat_cargo_21055`**, the north-bank boat, is S2's with all six crew. One of them,
  `S2.fig.boatman_pole_20495`, stands west of 20500. It reads bow east (med); bow west would put its stem at ≈ 20385,
  and it still stays S2's by the lead's note. Its crew fend off `S3.veh.boat_mast_lowering_19518`, whose long pole
  (`S3.fig.boatman_cabin_door_pole_20300`) reaches over the seam to (20600, 548).
- **`S3.veh.boat_moored_south_bank_19745`** is S3's whole. Its roof and planking run on to about u 20745 (S3 records its
  rear at ≈ 20640). S2 does not record it.
- **`S2.tree.willow_top_20552`**'s whips hang over S3's tavern and `S3.prop.small_table_20460`.
  `S2.fig.figure_by_top_willow_20590` (low) is S2's.
- **The small frame at u 20440–20530** is recorded by nobody (item 6 above).
- **`S3.road.south_street_20250`** reaches (20500, 1705, est). S2 has no south-bank street: the hall's roof covers the
  bottom, and its base is below the silk.
- **`S3.bld.open_shop_20000`'s placeholder back corner** reaches over S2's dark tree's trunk (item 6).
- The cross-key check (u 20200–20800) found no same-kind pair under 30 px.

**S1 (u 29050).**
- **Route point:** (29050, 730), measured; `S1.road.main`'s point 0 (est there). Station +314.87, world
  (281.07, 16.29), **dx −51.6** (S1's seam knot [29050, −51.6]; +46.6 if the lead takes option B). The road's edges,
  (29050, 695) and (29050, 1000) est, match S1's at 0 px.
- **Painted area:** S1's west corners must equal S2's se (267.21, −4.39) and ne (290.62, 30.54).
- **Water:** none reaches the seam. River_e's north shore turns south under the massive willow and meets the silk's
  bottom edge at (28968, 1780, est).
- **The massive willow** is S1's, by its base: `S1.tree.willow_burl_29090` (t12: base (29070, 1785) est ± 20). Its
  crown reaches west over S2's water to about u 28585 and covers grain boat 2's stern and the bottom boat's rudder.
- **The willow over the stalls** is `S1.tree.willow_stall_a_29178`. t12's figure at (29185, 1010) is
  `S1.fig.man_with_stick_29205`.
- **`S2.prop.bench_29030`** spans u 29008–29052, under the man leaning over the donkey. No S1 prop is within 30 px.
  The S1 merge should check it against its first stall's furniture. 望楼饭铺's last post is at 29043–29053.
- **`S2.grd.bank_lines_top_28900`** and `S1.grd.terraced_fields_29450` are the same lines read twice (item 6).
- **Left to S1's structures_w:** a curved line (28999, 83)–(29079, 126), crossing u 29050 at v ≈ 108, and an upright
  block at 28984–28999 (v 80–103).
- The cross-key check (u 28750–29350) found no same-kind pair under 30 px.

## The needs in brief (`gen/expand/canal_needs.md`)

- **Cast:** all 140 figures from the existing 22, with **no new character**:
  - idler 28, porter 24, carter 13, robed man 12, scholar 12, townsman 10, camel driver 9, hat traveller 7, inspector 6;
  - child 5 (scaled 0.55–0.85), sightseer 4, woman 3;
  - storyteller and fortune-teller 2 each; child_robed, official and butcher 1 each.

  The bearded grain owner plays the storyteller, and his apron-clad servant the butcher.
- **Clips:** 44 additions, all free local retargets, most of them the same as S3's and S4b's.
- **Optional:**
  - the boatman, with S2's better model figure;
  - the hat traveller's dark broad hat (S4b's request too);
  - a straw rain cape.
- **New takes,** ranked (10 credits each):
  - S2's own **`sack_carry`** (私粮进京; 7 S2 porters plus S3's 3);
  - then S3's `work_sweep`, `tow_walk`, `pole_boat`, `fend_pole` and `haul_line`, which S2 adds 15 figures to;
  - seven optional ones with stand-ins, among them the grain owner pointing from his seat.
- **Animals:** 9. The registry needs trace points on the mule's collar, a plain cloth pad on the horse, a dark horse
  coat and a dark donkey coat (the last three are S4b's requests too). All free.
- **Vehicles:** the mule cart (a variant of `cask_cart`: open bed, a mat-covered load, traces), the crate barrow
  (`sack_cart`'s barrow with crates) and the round-topped cart (a `barrel_cover` on a legged bed, or a parasol stall).
- **Boats:** 17 against the kit's presets:
  - `passenger` ×3 (豪华客船, the big cabin boat, the mat-cabin boat with board walls);
  - `grain_mast_towed` ×1 (逆水行舟, with a passenger cabin);
  - `grain_awning_sweep` ×4 (one with the sweep working);
  - `grain_laden` ×2 (the 万石船, one with the gangplank);
  - `small_awning` ×3 and `small_open` ×4.

  Also the mooring posts and stakes, the rope coil, the ladders, eight mooring ropes and the tow rope. No quay or
  revetment is painted; one rough landing stair is.
- **Carried props:**
  - existing: `pole_baskets`, `pole_shallow_baskets`, `pole_bundle`, `pole_bundles`, `stick`, `staff`, `bucket` and
    `fan_round`;
  - S3's new `long_pole` and `back_sack`;
  - new for S2: `straw_cape`, `bowl`, `raised_cup`, `veiled_hat` and `stick_bundle`.
- **Kit parts, new** (in `blender/kit_canal.py`):
  - the jetty, the rough landing steps and the riverside terrace on stilts with its two-tier roof;
  - the thatched 望楼饭铺 with its skirt roof;
  - the pole frame of ladders and the pennant frame;
  - the railed stair, the pole stack and the swept mat awning;
  - the warehouse's plank-faced platform;
  - crossed-leg folding seats, slatted shutters, a swagged curtain and a scalloped valance;
  - fish-scale tiles and the sack piles;
  - a free-standing ladder and a rope coil.
- **Set piece:** the **望火楼** (S2 builds it): a brick-coursed platform, a wooden stair, a baluster railing and a
  pyramidal-roofed pavilion with nobody on it.
- **Trees:** 4 `willow_burl`, 6 `willow_fan`, 2 `elm_claw`, 3 `slender`, 2 `shoot_tree`, 2 `whip_clump` and 2 `leafy`.
  Three new cards would be worth having: a split-bole burl willow, a pollard whose head lies nearly level, and a leafy
  shrub row.

## Against `reference/scroll/sections.md`

- **"A boat rowed upstream by eight men" (逆水行舟, ≈ 24200):** it is **towed** by five trackers on the north bank
  about 2000 px west, and fended off with poles. No oar or sweep is in the water, and the fan of lines from its mast
  are stays. Unless "eight" counts all its crew (eleven are painted), it is wrong.
- **The 望火楼 (≈ 28260–28580):** confirmed. Its pavilion's eaves span 28313–28577, the brick face 28393–28548, and the
  stair runs from ≈ 28285. Nobody is on it, as 余辉 says.
- **The two rows of barracks-type sheds (≈ 27700–28800):** the upper row is the tiled shed (27692–28275) and the roof
  behind 望楼饭铺 (28220–28540). The lower row is the lower shed (27565–27995) and 望楼饭铺 itself (28297–29048).
- **The porters with grain sacks and the owner on his sacks (私粮进京, ≈ 27950–28350):** confirmed.
  - The owner sits at u 28045. Three tally or handshake men, an overseer, a youth and four porters reach u ≈ 28440.
  - The sacks number 6 in the heap and 2–3 under the owner.
- **The two deep-laden grain boats (万石船, ≈ 27300–28800):** confirmed at 27267–28010 and 28015–≈ 28700. A third,
  smaller boat lies at 28390–28810 at the bottom edge, unladen.
- **王家纸马铺 (≈ 26850, pin 13):** that u is its signboard (26880–26905). The shop itself spans 26915–27290.
- **沿河雅座 (≈ 25700, pin 14):** the open-windowed hall spans u ≈ 25450–25900, with one guest (and perhaps a child or
  servant) at its west window. The east windows show only furniture.
- **豪华客船 (≈ 23000, pin 17):** confirmed. Its stem is at 22545 and its stern est at 23725, bow west.
- **喝杯小酒 (pin 12, 27320):** the eating shed with its mat awning and parasol is there, but its tables are empty. The
  one uncertain figure stands behind a tub.
- **Pin 16 聊天的伙计 (24280):** the two men in the cargo boat's deckhouse, 100–200 px east of the pin.
- **汴水悍激 (pin 7, 26670):** the strongest current lines and eddies are at u 26100–27100, as pinned.
- **余辉's 船侧祭神 and 客船启程:** candidates only, neither confirmed:
  - for 船侧祭神, a boatman pouring a bucket over the mat-roofed boat's side (22665), or the south-bank group holding
    a cup up toward the covered boat (21140);
  - for 客船启程, a man on 豪华客船's ladder reaching for the roof, where the mooring rope is tied.
- **"The trackers" (Hansen plates 10–12; 张安治's "five trackers"):** five, on the north bank at u 21867–22172.
- **The S1|S2 seam at 29050** keeps 望楼饭铺's east end and the donkey scene (pin 10 城乡交界处, 28940) in S2, as
  Phase 0 intended. `sections.md` ends S2 at ≈ 28700.
