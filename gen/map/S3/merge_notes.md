# S3 merge notes (the Rainbow Bridge, u 15500–20500), round 2, 2026-10-12

Fourteen units, brief `gen/map/S3/brief.md`. Eight of them (river_w, river_e, structures_w, structures_e, t1–t4) were
rerun outside the workflow after a login interruption; their parts and reports are in the usual places and were merged
like the others. All 14 parts passed `check` on their own.

Cross-unit fixes are in `gen/map/S3/merge_fixes.mjs`, which edits the parts in place (idempotent: two runs give the
same `map/strokes/S3.json`) and writes the entities the merge adds to `parts/merge.json`. This file says why.
Originals of the 14 parts before the fixes: `scratchpad/S3_merge/parts_orig/`. Merge crops: `gen/map/S3/look/merge_*.jpg`.

```
node gen/map/S3/merge_fixes.mjs && node tools/scroll_map.mjs S3 merge && node tools/scroll_map.mjs S3 check
```

**Result:** `map/strokes/S3.json`, **462 entities, check PASS**: 231 figures, 10 animals, 14 vehicles (**10 boats**, plus
the 串车, the barrow, the sedan and the handcart), 19 trees, 106 props, 21 buildings, 6 structures, 3 roads, 2 water,
6 grd, 44 groups. Raw merge: 470. The fixes retired 4 entities and 6 groups and added 2.

Figures by support: 100 ground, 72 `bridge deck`, 49 crew on boats (`boat deck:` / `boat roof:`), 8 `upper floor:`,
2 riders. Confidence over all non-group entities: 60 high, 233 med, 125 low.

## The units, in brief

| unit | n | what stands out |
|---|---|---|
| bridge | 4 | `S3.str.rainbow_bridge` with deck lines `deck_e` (painted, traced by brightness profile), `deck_w`/`deck_c` (est, `deck_e` − 750 / − 375 px); the deck's width lies **across** the picture; `[u, H]` profile, crown 5.44 m at u ~19330; two end posts (表木) |
| river_w | 39 | 7 boats, 22 crew; the boat under way (pin 25, 摇橹向前), the towed boat with its masthead line to t2's trackers, one 950 px passenger boat (not two), the unloading boat with 6 porters; no water-level reading possible |
| river_e | 40 | the big boat's **bow is west** (19518; windlass at the west end, rudder and poop at the east end), 21 crew; a **new fourth boat**, the cabin boat under the arch; the boat moored along the south bank with 4 crew; the north-bank boat is S2's |
| structures_w | 19 | the riverside hall is two-storeyed (a balcony over a pent roof) and read as 十千脚店's 楼; the 彩楼欢门 pole by pole (18 poles, the tallest top (17230, 499)); `S3.road.main` for the whole route, reading (c) behind the tavern |
| structures_e | 13 | far-bank hall on stilts, north-bank tavern (pin 21), the big 悬山 hall at the bridge's south foot, two mat sheds under the arch, the long open shop; receding edges −1.5 to −1.9 near 19800 |
| t1 | 20 | 6 figures on the hall's upper floor (3 certain diners + 1 low; the restyle's woman in red and children are not on the scan), 7 trees |
| t2 | 18 | 5 trackers (pin 25 纤夫), the gallery drinker, far-bank willows, 2 big bare trees |
| t3 | 32 | the "rider at the gate" is a **saddled horse with no rider**; the street and the far-bank eating place |
| t4 | 39 | the 新酒 pole with bar and banner (its bar tied into the scaffold), the 串车 (front east), the flat mat canopy and its stalls, the black donkey |
| t5 | 46 | the crowd at the bridge's south foot, the big parasol stall, the barrow (串车 type); 12 entities on `bridge deck` by the bridge agent's geometry (its own first reading: the bank) |
| t6 | 70 | the south ramp: the sedan of 车轿相争 (no passenger), 2 mat-awning stalls, the twin parasols with the 饮子 signboard (pin 22, illegible □□), 5 donkeys |
| t7 | 46 | the horseman of 车轿相争 (rider in white, groom, a second horse's head, low), the railing crowd at the crown, the sitters under the mat shed, the far-side end post (left to the bridge) |
| t8 | 43 | 11 men in one row at the near railing (the youth's rope), the north-bank strip, the south bank under the arch, the open shop's west part |
| t9 | 41 | the handcart hauled west, 3 men at the north ramp's railing, the tavern's furniture (**no customers painted**, pin 21), the open shop's east part, the dark-trunked tree (S2's: retired) |

## Fixes (merge_fixes.mjs), and why

### Retired (duplicates in disguise)

- `S3.prop.shiqian_jiaodian_lampbox_17034` (structures_w) = t3's `S3.prop.lamp_box_jiaodian_17035`. The board stands on
  its own behind the fence (a tile prop by the brief); both read 腳店 on the front and 十千 on the east side (crop
  `merge_lampbox.jpg`). t3's is kept and joins the tavern group `S3.grp.shiqian_jiaodian_16800`; structures_w's foot
  reading (17034, 1792, est) is in its note.
- `S3.bld.mat_shed_17590` (structures_w) = t4's `S3.prop.mat_canopy_17600`. A flat mat roof on posts, open on all sides,
  over stalls is an awning on its own poles, a tile prop (as `S4.prop.mat_awning_12066`); structures_w's posts at 17838
  and 17880 are copied into the canopy's note. (By contrast `S3.bld.mat_shed_19160`, a gabled mat roof with people at
  a table under it, stays a building; t7 dropped its prop for it.)
- `S3.prop.far_bank_row_16770` (t2) = the terrace rail on short legs of `S3.bld.far_house_16560` (v 200–215, legs to
  ~224, the same strokes; t2's own instruction). The jars-and-stones reading is in the house's note.
- `S3.tree.dark_trunk_bare_20525` (t9): S2's by its main point (the lead's note); S2's t1 has it as
  `S2.tree.dark_trunk_willow_20530`, 8 px away. t9's reading is a seam note below.
- Groups retired by joining (below): `S3.grp.trackers_16380`, `S3.grp.sedan_party_18760`, `S3.grp.horseman_party`,
  `S3.grp.north_railing_watchers_19350`, `S3.grp.north_ramp_watchers_19890`, `S3.grp.shop_table_19776`.

### Edited, not retired

- `S3.str.far_wall_16895`: its "two-post frame like a small gate" at the east end is the same strokes as t3's
  `S3.prop.far_bank_slatted_stand_17080` (crop `merge_farwall_stand.jpg`). The stand stays as the prop; the wall's
  `what` ends against it and its custom points `gate_post_w`/`gate_post_e` are removed (values in the note).

### Kept: the tool's three near-duplicates, checked on crops

- `S3.fig.head_behind_porter_18893` (t6) ~ `S3.fig.sack_porter_18915` (t7), 23 px: two heads about 39 px apart
  (`merge_t6t7_heads.jpg`).
- `S3.fig.robe_man_east_18893` (t6) ~ `S3.fig.bank_watcher_dark_hair_18905` (t7), 12 px foot to foot: three heads, the
  tall man's, the dark-haired one between and below, the dark-vest man's (`merge_bank_watchers.jpg`).
- `S3.fig.man_dark_cap_back_row_19325` (t7) ~ `S3.fig.deck_rail_face_19350` (t8), 25 px: different men (one in the back
  row, one facing us at the rail). The open question is whether t7's back-row man and t8's
  `S3.fig.deck_hat_stick_19353` (25 px east, also back row) are one man: both units read two after seeing each other's
  parts, and at zoom 3–4 this is grain (`merge_crown_backrow*.jpg`). Both kept, noted, for the second pass.

### Supports, normalised to the frame's keys

- `upper floor: riverside hall` (t1, t2: 8 figures, 3 props) → `upper floor: S3.bld.tavern_river_hall_15540`. Its floor:
  v ~1475 over u 15750–16330, est ground v ~1770, so about 3.8 m (structures_w); the east side gallery's floor runs
  (16330, 1500) → (16520, 1350).
- t5's four `far_hall_*` props (ground) → `upper floor: S3.bld.far_bank_hall_18520`, as t6's two: the hall's raised plank
  deck on stilts, about 25–40 px above the stilts' feet.
- The bridge's `support_by`: `deck_e`, `deck_w`, `deck_c` → `bridge deck` (one support with the lead's `H_profile_X`;
  the bridge agent's u-keyed "bridge west edge" and "bridge centre line" are not needed); `rib_e` → `water`.
- Kept as written: `bridge deck` (89 entities), `water`, `boat deck: <id>`, `boat roof: <id>`, `table top: <id>`,
  `animal S3.ani.<id>`, `ground`. No `sedan:` or `cart bed:` support is used (no passenger, nobody on a cart).

### The bridge

- `arch_intrados_e` (a custom point list, which `world()` drops) → the line `rib_e` (lead's note;
  `gen/set_pieces/rainbow_bridge/study.md` asks for exactly `lines.rib_e` with `support_by rib_e: water`). Its ends are
  the ends of the traced intrados, (18897, 1021) and (19977, 424); the springings themselves are hidden.
- **Added** `S3.prop.bridge_end_post_far_19176` (in `parts/merge.json`, joined to `S3.grp.rainbow_bridge`): a tall pole
  with an X at its top (v 20–50), visible down to v ~165, drawn over t7's parasol canopy; t7 and structures_e both saw
  it and the bridge part did not record it (`merge_far_post*.jpg`). Base est (19176, 300) is a placeholder; readings:
  the far-side twin of the south-east post (med) or a pole on the far bank.
- **Added** custom points `rail_w_piece_s` (18600, 432) and `rail_w_piece_n` (18640, 384) on the bridge: a short
  balustered railing piece at the deck's west edge that t5 and t6 left to the bridge (`merge_west_rail.jpg`). It runs
  parallel to the near railing 60–100 px east of the estimated `deck_w`, which supports `deck_w` to within that.

### `S3.road.main`

1. **Point 0** of the centre and both edges is S4b's road at u 15500, read from `map/strokes/S4b.json` on every run:
   centre (15500, **1530**, est), edge_n (15500, 1470), edge_s (15500, 1605), against structures_w's reading
   (15500, **1240**), (15500, 1060), (15500, 1300). **The difference is 290 px of v, about 5.7 m of depth:** S4b's route
   reaches the seam along the front of `S4b.bld.house_behind_willow_15414`, while S3's (the lead's reading (c)) runs
   behind the riverside hall. The hidden stretch now turns north round the hall's north-west corner between u 15500 and
   15840 (all est; it stays outside the hall's placeholder footprint; `merge_seam_w.jpg`). **For the lead.**
2. **The deck stretch** is the bridge agent's lines: centre = `deck_c` (18435, 1090) → (19650, 396); edge_n = `deck_w`
   (18060–19275); edge_s = `deck_e` (18810–20025). structures_w's placeholder points 18200–20030 are gone; the
   centre's (18200, 1090) lay on the deck's foot line and was dropped. `support_ranges: [{u: [18435, 19650], support:
   "bridge deck"}]` covers the centre's whole deck stretch. **Tool limit, for the frame agent:** the edges' deck points
   outside that range (`deck_w` at u 18060–18435, `deck_e` at u 19650–20025) take the road's own support (ground), and
   widening the range would put edge_s's ground points (18420, 1480) and (18600, 1100) on the deck. Per-line ranges
   (or `support_by` per role plus the H_profile_X's flat ends) would settle it.
3. **The north bank**, after the bridge agent and the lead: from `deck_c`'s north foot the centre climbs north past the
   cart's south side to (19900, 262) est, then runs east at v 262–265 through the tavern's open front to **exactly
   (20500, 258) est, S2's datum**; edge_s follows the bank's edge at the tavern's front (20200, 288), (20350, 288),
   (20500, 280) (structures_w's 315–335 lay on the water); edge_n runs north of the cart, (19750, 160), (20030, 232),
   then structures_w's points into the tavern (`merge_north_bank.jpg`). Along the tavern the edges are 53–65 px of v
   apart (1.0–1.3 m); the land strip to the shop fronts is 1.6–2.3 m. The low table of wares (20013, 282) stands on the
   road.

### Groups joined across units (each asked for in the reports)

- `S3.grp.chuanche_17775` + t3's two men at the handles; `S3.grp.robed_man_and_porter_17680` + t3's child;
  `S3.grp.barrow_18100` + t4's black donkey; `S3.grp.parasol_stall_18160` + t4's lattice awning;
  `S3.grp.west_stall_18330` + t5's two keepers; `S3.grp.sack_donkeys_18600` + t5's donkey walker (the black-hat man is
  the other candidate driver); `S3.grp.stall_under_arch` + structures_e's `S3.bld.mat_shed_19160`;
  `S3.grp.bank_watchers_under_arch` + t6's tall man; `S3.grp.south_rail_watchers` + t6's man behind the awning;
  `S3.grp.handcart_19862` + t8's small animal (by place, no tack; the bridge agent's "man and dog" there are this
  animal and t9's puller, `merge_north_dog.jpg`); `S3.grp.shiqian_jiaodian_16800` + t3's lamp-box.
- `S3.grp.boat_towed_16228` absorbs t2's five trackers: one towing scene.
- **`S3.grp.sedan_vs_horseman`** (new, `src` 余辉: 车轿相争): t6's sedan side and t7's horseman side, 13 members; the
  sides and the uncertain members are listed in its note.
- `S3.grp.shouting_down_to_boat` (t7) absorbs t8's 11 railing men with the bundle and t9's 3 at the north ramp: one
  railing crowd u ~19020–19930 (余辉 上下呼救, pin 20), 24 members.
- `S3.grp.south_shop_19920` (t9) absorbs t8's shop group, t8's loose shop props and the building `S3.bld.open_shop_20000`.
- Not joined: t1's `S3.grp.hall_diners_16120` and t2's gallery figures (another bay, beyond the hall's east wall).

### References fixed

IDs that a unit dropped before the merge or named by a draft ID were rewritten (`S3.prop.xinjiu_flagpole` →
`_17630`; t6's `west_stall_18480` → `west_stall_18330`; t5's, t4's and river_e's first-draft IDs written without the
`S3.` prefix and marked dropped; t1's `S4b.tree.willow_15470` → `S4b.tree.willow_15468`, S4b's merged ID). Every
`S3.` ID left in a `what` or `note` exists, except the retired ones named as history ("retired at the merge").

## The "left to" lists compared

Every item each unit left to another was looked up in the receiver's part. Settled:

- Recorded by the receiver (most of them): e.g. the trackers (t2), the 新酒 pole (t4), the boats' crews (river_w,
  river_e), the far-bank furniture (t3–t5, t7–t9), the tavern furniture (t9), the shop interiors (t8, t9).
- Part of an entity already: t4's "long line (17520, 885) → (17700, 830)" is the unloading boat's long pole to
  ~(17480, 885) (river_w); the festoon along the far bank's edge at 18050–18340 (t5, structures_e) is the lowered-mast
  boat's spar lashings (river_w); the plaque under the crown's rib (river_e) is the bridge's `beam_end_crown`; t9's
  "head under the bridge" is river_e's `S3.fig.head_in_rigging_19990`; t8's two objects hung inside the open shop are
  the shop's (now in its note); t3's lattice panel at the gate's east side is the gate's (now in its note).
- **Not there:** structures_e's "figure walking at the bottom (20165–20185, v 1720–1790)" is the tiles of
  `S3.bld.front_roof_19800`'s hip (`merge_bottom_walker.jpg`); t1's bluish cluster at 15560–15595 is staining (t1).
- **Added at the merge:** the far-side end post and the west railing piece (above).
- **Two readings of the same strokes, both named in the entity's note:** the gate's west-front post (structures_w: a
  垂柱 ending in a knob in mid-air; t2, t3: a column on a drum-shaped base, foot (16916, 1543)); the 杈子 barrier
  (t2: a diagonal railed stair or ramp up to the gate); the floating timber (t7, the bridge agent: perhaps a narrow
  skiff with an upturned east end).

## For the second pass (three agents proposed; specific items)

The brief planned two (west 15500–18000, east 18000–20500), but two thirds of the entities and the densest crowds are
east of 18000 (278 entities, 167 figures, against 140 and 64). Proposed, each looking 150 px past both ends:

| id | owns u | entities / figures | items to settle |
|---|---|---|---|
| `west` | 15500–17800 | 122 / 52 | the figure structures_w saw behind the lamp-box (17076–17100, v 1560–1640; t3: nobody; `merge_lampbox.jpg` is ambiguous); t2's curved strokes at 16977–16997, v 1610–1667 (a door leaf?); t1's upright shoots behind the hall's east gable (16427–16520, v 860–1000: t2's `bare_tree_16520` or a tree of their own); t1's small object on the gallery railing (16358, 1400); t2's small roof-like form under the west far willow (16465–16540, v 115–135); t2's thin mark on the water (16478–16492, 470–500); the gate's west-front post and the barrier/stair (two readings); one far-bank willow with two stems or two (17185/17205) |
| `middle` | 17800–19100 | 166 / 100 | the 35 `bridge deck` entities west of u 18810 (t5's 12, t6's): ramp or bank (t5's own first reading is the bank; no ramp edge is inked); t5's `mat_leaner_white_18220`: the unloading boat's crew, the ramp or the bank; river_w's `figure_under_awning_18015` (or the awning's pole); t6's `dark_donkey_18625` and the second sack donkey's facing (t5 and t6 disagree); 1–2 more heads under the big parasol (18767–18784, 1050–1073; 18727–18747, 847–867); the sheaf of reeds above `wide_hat_pointer_18890` (carried or standing); the west stall's parasol hub; the floating timber `19090` (timber or skiff); the far-side end post's foot; the west railing piece |
| `east` | 19100–20500 | 130 / 79 | t7's back-row man vs t8's `deck_hat_stick_19353` (one or two); t7's second horse (a horse or a bent man) and the man with folded arms (its rider?); t8's `light_robed_at_bow_19745` and t9's head at (19690, 1125) (bank, bow crew or nothing); t8's plank or ladder lines at 19615–19685, v 1275–1441 (no entity); t8's wide hat or basket at 19378–19430 and the bundle over the rail; t9's `shrub_or_heap_20025` (shrub, heap or the cart's load); t9's faint shop figures (19905, 19940, 19972) and `hanging_sack_and_staff_20412` (carried or hung); river_e's low crew (`head_in_rigging_19990`, `boatman_stern_rail_20400`); the cabin boat under the arch (a boat or the bridge's underside framework) |

## Seam notes for the lead

**S4b (u 15500)**
- `S3.road.main` point 0 = S4b's (15500, 1530); S3's own reading (15500, 1240); the 290 px jog (above).
- S4b's biggest rafted boat runs on to a bow at ~(15775–15800, 670–755), waterline under the stem ~(15740, 835) est
  (t1, river_w), 340 px past Phase 0's "bow ≈ 15450"; its sweep blade lies along its south side to the tip
  (15856, 893); a long pole with a broom-like end runs east from its roof to ~(15870, 640); a possible figure on its
  foredeck at (15655, head ~683, foot ~720). Its sweep is at its **east** end, so by the lead's rule that end is the
  stern. None of it is recorded in S3.
- S4b's lines on S3's side: a knotted pole or tasselled rope ends at (15505, 513) in open water; a straight line from
  the third rafted boat's bow (15400, 538) ends at (15592, 586) by a small multi-pronged object (a grapnel?) in open water
  at 15580–15605, v 576–592. A small stake at (15465, 600–628). S4b's top boat's prow at ~(15485, 88).
- `S4b.tree.willow_15468`: its trunk leans east through (15505–15537, 1090–1125) and (15531–15600, 806–1087); its crown
  spreads over u 15540–15810, v 640–800 (not ~15600). Not an S3 tree.
- S4b's south building in front of the hall's west end (tiles over 15250–15580, v 1300–1790; ridge (15250, 1450) →
  (15500, 1310), north hip (15500, 1310) → (15580, 1440)) is S4b's.
- River at the seam (river_w): shore_s (15500, 915, est), south bank_top (15500, 930, est); no shore_n (the water runs
  to the silk's top edge; the far bank is off the silk from the seam to ~16150). A willow crown hangs from beyond the
  silk's top edge at 15200–15570, v 15–70, with no trunk on the silk: recorded by nobody.

**S2 (u 20500)**
- **The dark-trunked tree** is S2's `S2.tree.dark_trunk_willow_20530` (S3's copy retired). t9's reading for S2: the trunk
  spans 20485–20575 at the silk's bottom edge (v ~1782), base est (20525, 1782); at v 1450 it spans 20449–20582 with a
  hanging limb at 20404–20438, v 1383–1460 (structures_e); the lower trunk is dark and mottled and forks at about v 1300
  into a pale straight limb, which leans north-west across S3's open shop roof and moored boat and ends broken off at
  (20383, 1085), and the main stems, rising to a fork at ~(20560, 900–1000); t9 reads it bare (S2 reads a willow); its
  twigs mix with S2's second bare tree east of 20650. Beside it on S3's side: `S3.fig.porter_with_pole_20450` and
  `S3.prop.hanging_sack_and_staff_20412`.
- The north-bank boat is S2's (`S2.veh.boat_mat_cargo_21055`, with its crew, two of them west of 20500): S3 did not
  record it. `S3.veh.boat_moored_south_bank_19745` is S3's whole (river_e; the lead's note), its east end at
  ~(20637–20640, 1085–1190) past the seam: S2 must not record it. The big boat is wholly S3's; the long pole held by
  `S3.fig.boatman_cabin_door_pole_20300` reaches over the seam to ~(20600, 548).
- The big willow at the top is S2's (`S2.tree.willow_top_20552`; t9: trunk 20510–20563, v 82–282, base est (20540, 280));
  its whips hang over S3's tavern and `S3.prop.small_table_20460`. The figure at its trunk is S2's
  `S2.fig.figure_by_top_willow_20590`.
- Two posts at u 20461 and 20503 (v 160–252) and a lidded box (20445–20480, v 214–240) west of the willow's trunk:
  structures_e reads them as the west bay of S2's building behind the willow; if S2 reads a separate small shed, its main
  point (~20475) is S3's. The lead decides.
- `S3.road.main` ends at (20500, 258) est, edges (20500, 215) and (20500, 280). `S3.road.south_street_20250` reaches the
  seam at (20500, 1705, est) and may run on under S2's bottom roofs. `S3.bld.open_shop_20000`'s strokes end at 20456;
  its placeholder back corner ne (20575, 1400, est) reaches past the seam.
- Shore points at 20500 (river_e): north (20500, 310, est), south (20500, 1235, est); bank tops (20500, 300) and
  (20500, 1255).

## For the frame step and the lead

- **Deck heights.** 35 entities on `bridge deck` stand west of the deck edge's south foot (u 18810): 24 figures, 2
  animals, 9 props (t5, t6). A u-keyed profile gives them H 0; the lead's `H_profile_X` (from the bridge kit's table) or
  the bridge agent's rule u* = max(u, u_s(v)) gives 0.9–5.4 m. Check them in `map/world/S3.json` after `all`.
- **The painted deck is far too steep to walk** (5.4 m over ~6.8 m of depth each side, 45–70° at the feet): the kit's
  profile family and room past the feet are the builder's choice (bridge report; study.md).
- **Railing height vs `deck_e`:** the bridge agent's handrail is ~50 px above `deck_e` (0.65 m); t7 measured the top
  handrail at the posts' tops 100–120 px above `deck_e` (1.4 m if `deck_e` is the walking surface) and set the leaners'
  feet a step behind; t8's railing foot line matches `deck_e` within ~15 px over u 19500–19750 but runs 45–65 px above
  it at 19350–19400. A real-size check for the frame.
- **Knots (ground-level edges):** near the tavern −1.0 to −1.12 (dx 46–51; the 杈子's foot −1.12 → 45.8, structures_w,
  and t2's stair rail −1.10); at the bridge's south foot the wall coping −1.56 (dx ~33) and the open shop's low board
  −1.5 to −1.9 (dx ~30) (structures_e); the tavern's table tops −1.2 (dx ~43, low); far-bank tables −0.8 to −1.15
  (t3, structures_w). A square bridge would need dx ~90 at the bridge; at 31.6 the deck is a parallelogram skewed 37°.
- **Water:** no S3 reading. river_w found no face to measure; river_e's bounds under the far-bank hall are ≥ −0.86 to
  −1.0 m, which fit S4b's value. Use S4b's.
- **Boat decks and roofs** (river_e's freeboards, two stroke points each): the big boat's deck 0.78 m (bow 0.86), its
  poop ~2.5–3 m; the cabin boat's floor 0.71 m; the moored boat's roof ~1.18 m (est), hatch ~1.1 m. river_w gives hull
  axes and scale cues per boat in its report.
- **Diminution** (from the reports): the street 152–208 px; the men at the bridge's south foot painted very large (up
  to 230 px at v 1288); the deck crowd 95–146 px; the open shop's interior 78–82 px at v 1550 (about 0.43); the
  unloading boat's crew 110–135 px (0.72 at v ~810); crew in mid-river 0.4 at v ~305; the far bank 0.2–0.35 at
  v 105–165 (t3, t4) but 0.5–0.7 at v 120–220 by the bridge's north end (structures_e, t9). Size does not follow foot v
  alone.
- **Against sections.md:** the tavern complex spans 15510–17330 (not 15500–16800); the scaffold's tallest top is
  (17230, 499); the rider at the gate is a riderless saddled horse; the 串车 spans 17440–17790; the big boat's bow is
  west; the north-bank tavern's tables are empty; pin 25 falls on the boat under way while the trackers are at
  16325–16432; the "boats" unloading at the south bank are one boat.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 2)

- **Read every unit's dropped drafts out of the notes.** On S3 five units dropped their copies of a neighbour's entity
  before the merge but kept the dropped ID in a note (`mat_awning_stall_18443`, `lattice_mat_awning_18060`, a
  first-draft bank). Scan every `what` and `note` for `S<n>.` IDs that are not in the merged map and rewrite each: a
  dangling ID reads like a missing entity.
- **One thing in two kinds escapes the near-duplicate check.** It compares only the same kind: S3's lamp-box (a
  structures agent's prop and a tile's prop) was caught by it, but the mat canopy (a building and a prop), a far-bank
  rail (a building's part and a tile's prop) and a wall's "gate frame" (custom points and a prop) were found only by
  reading both units' `what` side by side. Decide the kind by the brief's who-records-what (a flat mat roof on posts,
  open on all sides, is an awning: a tile prop).
- **A road that crosses a raised structure takes the structure's own lines.** Copy the deck's centre and edges into
  the road and give `support_ranges` the centre's deck stretch; then check the edges' deck points that fall outside that
  u range, because `support_ranges` is by u for every line at once.
- **Read the neighbour's seam point from its strokes in `merge_fixes.mjs`, every run,** not as a copied number: the
  neighbouring areas merge and frame in parallel (S4b's strokes were rewritten while S3's merge ran), and S3's seam
  point must follow them.

## Second pass and frame (the frame agent, 2026-10-12)

`merge_fixes.mjs` sections 8 (second pass) and 9 (frame step). It is still idempotent: two runs give the same
`map/strokes/S3.json`. **Result: 467 entities, check PASS**. That is 232 figures, 9 animals, 15 vehicles (**11 boats**),
20 trees, 108 props, 21 buildings, 6 structures, 3 roads, 2 water, 7 grd and 44 groups. The second pass's new entities
are in `parts/second_pass.json`, and the frame step's far bank is in `parts/merge.json`.

### The second pass: 45 proposals, all accepted

The frame agent read the key crops again before deciding: `c_heap`, `c_sweep6`, `i_timber`, `f_dark_raw`,
`p2e_c_loops_col`, `p2e_c_bowfig_col` and `p2e_c_parasols_col`.

- **west** (`second_pass/west.json`, 15 proposals):
  - New, all low:
    - `S3.tree.willow_crown_top_15520`: S3's by main point. See the seam below.
    - `S3.fig.awning_boatman_17435`: it was named only in the awning boat's `what`.
    - `S3.fig.sweep_man_15888`: the sixth man at the sweep.
    - `S3.fig.behind_lampbox_17090`: three readings, joined to the tavern group.
    - `S3.prop.pot_on_rack_16140`.
    - `S3.prop.basin_16180`.
  - Retired: `S3.fig.diner_back_16180`, which is the basin under the heap. Its follow-on edits are accepted too: the
    heap now stands on the basin (`table top: S3.prop.basin_16180`), and the table's and the diners' `what` are updated.
  - Notes on the hall, the gate, `bare_tree_16520`, `far_willow_16582` and `willow_far_17205`.
- **middle** (`second_pass/middle.json`, 12 proposals):
  - New:
    - `S3.veh.boat_skiff_19255` (low), which replaces the retired `S3.prop.floating_timber_19090`.
    - `S3.fig.head_under_parasol_hub_18780` (low).
    - `S3.fig.second_head_ramp_foot_18740` (low).
    - `S3.prop.slatted_panel_18615` (low). It joins the west stall, and with it the bridge's custom points
      `rail_w_piece_s`/`_n` are removed.
  - Retired: `S3.ani.dark_donkey_18625` (the calling man's sleeves) and `S3.fig.figure_under_awning_18015` (the
    awning's pole).
  - Moved:
    - the two parasols' hubs and bases;
    - the unloading boat's rear, to (18210, 958, est);
    - the far-side end post's foot, to (19176, 240, est). Its conf is now low, and its `what` is neutral between the
      two readings.
  - The reviewed items are written as notes: the deck entities stay on the deck, the white-jacket man stays on the
    ramp, the second sack donkey faces east, and the sheaf is carried.
- **east** (`second_pass/east.json`, 18 proposals):
  - New, both low: `S3.fig.head_by_shed_post_19334` and `S3.prop.shop_table_tray_20140` (joined to the shop group).
  - `S3.prop.parasol_19150` is one tilted canopy, its base under the pole at u 19105.
    `S3.prop.frame_awning_19070` is **kept (low)**: its west post, ridge and rafters are its own, and only its "east
    post" is the parasol's pole. A note says so.
  - The far-bank tables now run to u 19395.
  - Retired: `S3.fig.light_robed_at_bow_19745` (the parasol's far rim), `S3.fig.head_in_rigging_19990` (a third rope
    hook), `S3.fig.boatman_stern_rail_20400` (the bending man's arms) and `S3.prop.hanging_sack_and_staff_20412` (the
    porter's load). The big boat's crew goes to 19.
  - The other notes are accepted as written.
- The near-duplicate flags that the new entities raise are known and noted in their proposals: the sixth sweep man
  between two others, the pot 22 px from the dishes (on the rack, not the table), and the second head 30 px from its
  neighbour.

### The frame step's fixes (section 9)

- **S4b seam, river:**
  - S3's near shore and near bank start exactly at S4b's points at u 15500, read from `map/strokes/S4b.json` on
    every run: shore_s (15500, 896) and bank top (15500, 915). S3's own readings were 19 and 15 px south.
  - S4b ends a far-bank strip at the seam, while S3's water had no north shore west of u 16150 and the scan there is
    plain silk. **Added `S3.grd.far_bank_seam_15500` (low)**, the shortest join: S4b's bank top and shore turn off the
    silk's top edge by u 15600–15650, and the willow crown's est foot stands on it.
  - Cross-key seam check against S4b's strokes (u 15200–15800): only the shared lines match (road 0 px, shores 15 and
    19 px, now joined). No duplicate.
- **S2 seam:** the cross-key check against S2's strokes (u 20200–20800) finds the road, the water and both banks at
    0 px. S2 took S3's points; there is no duplicate.
- **Banks:** every S3 `grd` with a `shore` line has `support_by: {shore: water}`, as S4b's banks do.
- **The boat under way's three bowmen** stand on its raised bow deck. Their support is now
  `boat bow deck: S3.veh.boat_under_way_15595` (1.12 m), while the sweep men stand on the stern deck (-0.13 m).
- **The bridge deck (section 9e).** The lead's `H_profile_X` (from the kit's table) cannot give this deck's heights.
  With S3's knots the bridge's axis runs 50.6° from east, and its width lies east-west in the picture, so world X does
  not fix the place along the deck. Measured: the tool's H against the kit's own `on_deck` was rms 2.1 m, and against
  the painted heights rms 2.9 m. Many south-ramp figures collapsed to H 0, because the tool's solve runs away on the
  painted flanks.
  - **Used instead:** u-keyed profiles of the painted near edge, one per offset west of it (17 supports, in 50-px
    steps). Each line or thing on the deck names its offset, measured on the strokes at its own v: `bridge deck`, or
    `bridge deck: <N> px west of the near edge` (the bridge agent's rule u* = max(u, u_s(v))).
  - The deck lines are exact: `deck_e` is on 0, `deck_c` on 375 and `deck_w` on 750.
  - `S3.road.main` uses `support_by` per line (centre 375, edge_n 750, edge_s 0), each 0 beyond the feet. **The
    merge's `support_ranges` is removed.** This settles the tool-limit note in "S3.road.main" above.
  - The 88 deck entities are within rms 0.17 m (max 0.52) of the rule. Vehicles and animals get `support_by` for a
    second ground point in another band.
  - The two riders' supports (`animal <id>`) get their animal's deck profile in the frame. Without it, `world()` took
    them as standing on the ground, 8 m north of their mounts.
  - **If deck entities are added or moved, rerun the merge and then the frame script**
    (`scratchpad/S3_frame/mkframe.mjs final`, which reads the bands in use), because the frame lists one support per
    band.

### The frame (`map/frames/S3.json`)

- **Seed and datum:** S5's origin and scales and the seam knot [15500, 31.6]. The datum is `S3.road.main:lines.centre.0`
  = S4b's route point (15500, 1530, est), station +110.35. The painted area's west corners equal S4b's east corners:
  (95.98, −4.39) and (81.65, 30.54).
- **Knots:** [15500, 31.6] (seam), [16880, 47.9] (the 杈子 barrier), [18290, 39.2] (the wall coping and the display
  board) and [19830, 30.4] (the open shop's floor board). The wall check gives the big hall's ridge 87.9° and the gate's
  east eave 88.1°. The north-bank tables read 41 and are not a knot.
- **Water:** −0.7, copied from S4b. S3 has no reading of its own; river_e's bounds of −0.86 to −1.0 fit it.
- **Supports:** each comes from two stroke points, with the derivation in `how`:
  - the riverside hall's upper floor, 3.83 m;
  - the far-bank hall's deck, 0.39 m (read by the frame agent on a crop);
  - seven table tops;
  - twelve boat decks and roofs. river_w's boats were read by the frame agent on zoom-2 to 2.5 crops (est).
- **Questions:** nine, the bridge first. They cover the deck heights, map against build, the receding direction, the
  route's jog at the S4b seam, the far bank at the seam, the water, the diminution and strip depths, and the far
  bank's face. The far shores map 0.15–0.86 m north of the bank tops, and at S2's seam the route runs along the water's
  edge. The last question is a tool quirk: plan.jpg labels the datum "station 0".
- `all` and `map_layout` have been run. The route runs from station +110.35 to **+179.21 at (20500, 258)**, which is
  S2's datum, with dx 30.4 there.
