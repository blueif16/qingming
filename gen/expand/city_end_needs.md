# The scroll's end (S7, u 815–2000): what the workshop needs to make

From the S7 needs agent, round 2 Run 1 (2026-10-12), for the lead's catalogue agent. Every item comes from the scroll
map: `map/text/S7.md` says where each thing is and what it does, `sections/city_end/layout.json` holds the positions,
`map/strokes/S7.json` the strokes (70 entities). IDs drop the `S7.fig.` / `S7.ani.` / `S7.prop.` prefix where the kind
is clear. Crops are scan px `[u0, v0, u1, v1]`; the registered restyle `gen/sections/city_end/mosaic.jpg` covers
u 816–2160 (section `city_end`), but read the scan beside it (`node tools/scroll_inspect.mjs city_end <u> <v> <half>`):
the restyle redraws here (a bucket made a child, the pointing man given a bun, the horse given a head and a rope).

**Real size** (`map/BUILDING.md` rule 5): everything is made at real size; only positions come from the map. Adults
here are 143–208 px (mean 167 on the north margin, 175 in the street, no diminution across the street), so painted
figures are about 1.3× life, as at the gate and in S6. No vehicles and no boats are painted in S7.

## Casting: 17 figures, all from the existing 22 characters; no new character is required

Counts: idler 3, inspector 2, townsman 2, woman 2, child 2, robed_man 1, scholar 1, camel_driver 1, porter 1,
fortune_teller 1, hat_traveller 1. Cast by dress against each figure's `what`; look-alike neighbours (the gatekeeper and
the man at the post: light robes, top-knots) go to different characters.

### The one character worth making if the catalogue has credits for S7 (optional)

- **official_rider** (optional): model `official_rider_1610`, crop `[1550, 975, 1680, 1215]` (upper body only: the
  horse, the small gate roof and the groom hide the rest; ask the sheet for a standing man): a bearded official in a
  black, very broad flat-brimmed hat with a tall flat-topped crown, its ties hanging, and a pale round-collared long
  robe (圆领袍). He is Hansen's last plate ("the rider in a broad hat", `sections.md:219`) and the scroll's closing
  figure. `hat_traveller` plays him meanwhile (below), but its hat is a woven straw cone and its robe a buff
  cross-collared one with a sash. He would play only this figure.

### From the existing characters (figure: character, clip, props; the stand-in clip where a new action is wanted)

- `gatekeeper_seated_1082`: **robed_man** (the bearded man with a top-knot in a plain light robe is the model's own
  look); seated on the box seat `seat_box_gatekeeper_1070`, head back, hands raised before his chest, talking up to the
  man at the post: `sit_talk` (free: `from:official/sit_talk`).
- `man_at_post_1118`: **idler** (light clothes, small top-knot; a servant or second doorman); leaning back on the gate's
  west post beside the block, looking down at the gatekeeper: `lean_wall` (his own clip) until `lean_post_talk` lands.
- `pointing_man_1370`: **scholar** (light robe with a sash, black futou); in the gate's east bay, half-turned to the
  visitor, right arm out pointing west: `point_way` (new), stand-in `point` (free: `from:sightseer/point`).
- `visitor_food_box_1308`: **camel_driver** (a traveller: long dark-grey belted jacket over light trousers, dark hair);
  stands seen from behind, turned to the pointing man, a big cloth bundle on his back and the food box hanging from his
  right hand: `look` (its own) or `idle`; props `back_bundle` (big) and `food_box`.
- `face_at_gate_door_1251` (conf low): **child**, only the head showing at the open door leaf's edge, `look`. Scale is
  open: by the head (about half an adult's head) about 0.8, by the est foot (122 px, 0.74 of the gate's adults) about
  1.1. Under the map's other reading it is a small lamp hung in the gate (a kit part, below), and nobody stands there:
  the lead's call; build it once, one way.
- `porter_baskets_1255`: **porter** (dark short belted jacket, light trousers; his wide dark hat with an upturned brim
  is not the porter's), strides west toward the viewer: `carry_pole` with `pole_baskets` (two round baskets on three
  cords each, the west one straw-filled, the east one with crossed strokes: crop `[1150, 1085, 1370, 1215]`); a
  walker on a short path along his facing (260°).
- `folded_object_bearer_1490`: **townsman** (dark short robe, futou with two upturned flaps), behind the horse, mouth
  open, one hand forward on the shaft: `carry_pole` (free: `from:porter/carry_pole`) with the new `folded_parasol`.
- `official_rider_1610`: **hat_traveller** (see above), `ride` on `S7.ani.horse_official_1625`, hands at the reins;
  optional prop `riding_stick`.
- `groom_1698`: **inspector** (dark short jacket, pale trousers, dark round cap), at the horse's head, hands together at
  his waist on the lead, face turned up to the rider: `bridle` (free: `from:carter/bridle`).
- `attendant_pale_1750`: **idler** (pale short jacket and trousers; a dark cap with an upturned flap, not the idler's
  head-wrap), at the front, a staff or pole on his shoulder: `carry_pole` (free: `from:porter/carry_pole`) with `staff`
  on the shoulder (new placement).
- `doctor_dark_robe_1615`: **fortune_teller** (long dark robe over pale trousers, dark cap; the townsman's slate robe is
  the fallback); in the shop, facing the women, both hands out to the child: `examine_child` (new), stand-in `hand_over`
  (free: `from:carter/hand_over`).
- `seated_woman_child_1535`: **woman**, seated on `bench_shop_west_1507`, holding the child up on her lap toward the
  doctor: `sit_hold_child` (new), stand-in `sit` (her own); prop `child_on_lap`.
- `child_on_lap_1546`: **child**, `carried_by` `seated_woman_child_1535`: drawn as her `child_on_lap` prop, as S4's
  `child_in_arms_10430` is (no body of its own); a small child in a reddish jacket (the existing `child_in_arms` has a
  red jacket), about 75–80 px from head to lap.
- `standing_woman_1567`: **woman** (high dark bun, pale long robe under a short over-jacket), behind the seated woman,
  looking at the doctor: `look` (free: `from:townsman/look`) or `idle`.
- `bucket_man_1872`: **idler** (short jacket, short trousers), seen from behind, bent over the bucket at his feet
  (`bucket_at_carrier_1890`, a map prop) with one hand on its handle, the pole slanting over his shoulder down to the
  buckets: `bucket_lift` (his own) with the new `pole_hooks`.
- `walker_bag_1885`: **townsman** (dark short robe, futou with a looped tie), at the mat awning's north edge, right hand
  at his chest, face turned east: `walk` on a short path east, or `idle` (his feet are hidden by the awning); prop
  `hip_bag`.
- `bundle_man_1976`: **inspector** (dark short jacket, pale trousers; his dark flat-topped brimmed hat is not the
  inspector's), walking toward us and a little west, both hands holding a small bundle at his chest: `walk_hold_chest`
  (new, optional), stand-in `walk`; prop `bundle_small`.

### For the workshop's record

- **`characters/woman.json`'s model is not a woman.** Its `figure` crop `[1575, 725, 1655, 905]` (`gen/characters/woman/
  ref.png`) is `S7.fig.doctor_dark_robe_1615`, a man in a dark knee-length robe over pale trousers in the map's reading
  (t2 and the second pass). The character reads as a Song woman (slate 褙子 over a pale skirt, high bun) and plays S7's
  two women well; only the record should name a woman: `standing_woman_1567`, crop `[1545, 712, 1595, 895]`. The seated
  woman wears a pale long robe; a paler tone of the woman would be closer if characters ever get a `tone` like the
  animals', otherwise cast as is.

## Actions the existing clips can't show (one line each; each new take is 10 credits once, then free on any rig)

- **`sit_hold_child`** (woman): seated on a low bench, holding a small child upright on her lap with both hands round
  its waist, lifting it a little toward someone standing in front of her, her head turned to him. `seated_woman_child_
  1535`. Bind `child_on_lap` to it.
- **`examine_child`** (fortune_teller): standing, leaning a little forward from the waist, both hands reaching out
  together at chest height to a small child held in front of him, feeling its wrist, then drawing back a little and
  nodding. `doctor_dark_robe_1615` (the brief's "a doctor feeling a pulse").
- **`point_way`** (scholar): standing half-turned to a listener, raising the right arm level and pointing far along the
  street, holding it there while turning the head back to the listener and nodding, then lowering it. `pointing_man_
  1370`. The existing `point` points down at goods and shakes a palm in argument. Note: on the scroll it is the man in
  the dark cap in the gate's east bay who points the way, not the seated gatekeeper (the brief's "gatekeeper pointing the
  way").
- **`lean_post_talk`** (idler; optional): leaning back against a post, head turned down to a seated man at his side, one
  arm reaching down toward him, talking. `man_at_post_1118`; `lean_wall` stands in.
- **`walk_hold_chest`** (inspector; optional): walking with both hands holding a small bundle against the chest, elbows
  bent, forearms still. `bundle_man_1976`; `walk` stands in.

Free retargets wanted (`from:`): `sit_talk` official → robed_man; `bridle` carter → inspector; `carry_pole` porter →
townsman and idler; `hand_over` carter → fortune_teller; `point` sightseer → scholar; `look` townsman → woman. `ride`
is already on hat_traveller; robed_man's trimmed `sit` comes back free from `gen/` if wanted.

## Animals: 3 (map IDs; built at real size, the map's `length_m` is the painted hoof span and only orients)

- `horse_official_1625`: **horse_white** (the horse is painted pale and uncoloured; the restyle paints it white),
  facing east, standing under its rider (`idle`) with the groom at its head; ridden by `official_rider_1610`. Only its
  back and rump show over the small gate roof: crop `[1500, 1105, 1665, 1270]`. **New tack variant** (`saddle_fringe`,
  kit tack, 0 credits): the existing saddle plus a crupper strap from the saddle over the rump to the tail, a long
  fringed saddle-cloth or skirt of tassels hanging from the saddle almost to the hooves (hatching from v 1128 to ~1260
  at u 1570–1610), and a bridle with reins to the rider's hands (the groom holds the lead).
- `bird_roof_1735`: **bird** (the crow, kit-built), perched on the tiled east slope of `S7.bld.hall_ns_1620`
  (support H 3.2 m; facing 150°, head up to the north-west, tail down to the east): `idle`. Its perch is a roof slope
  of about 30°, not a branch: check the feet's grip there. Crop `[1700, 115, 1770, 160]`.
- `pale_shape_1905` (conf low): **make nothing until the lead settles it.** Reading (a), a pale animal with its head
  down behind the water carrier, pig, sheep or calf size (body about 110–125 px, back about 80–90 px above est hooves:
  a back of about 0.8 m real); reading (b), a mat, cloth or straw hung over something, or the wall's foot (its top line
  runs on east as S6's wall foot). Crop `[1880, 780, 2015, 880]`. If (a): no calf or sheep body exists; the ox body
  scaled to a calf, or the pig, each with a pale `tone` and `graze`, costs nothing. If (b): it is retired and becomes
  a prop or part of `S6.bld.house_well_2020`.

## Props carried by figures (new geometry in `blender/char_props.py`, or new placements in `characters/props.json`)

- **`folded_parasol`** (new): the retinue's long folded object carried for the official, a closed parasol or
  long-handled fan (掌扇): two long rods joined in a rounded loop at the back end (the furled canopy), the shaft running
  forward past the bearer's head to his hand; about 2.2 m real (u 1353 to ~1580 painted). On the right shoulder in
  `carry_pole`, like the porter's poles. Crop `[1345, 1050, 1590, 1120]`. `folded_object_bearer_1490`.
- **`food_box`** (new): the 食盒, a small square lidded wooden box with a tall bail handle, about 0.27 × 0.38 m with
  the handle, hanging from the right hand at the side (`hand` placement, clip-independent). Crop `[1305, 895, 1350, 950]`.
  `visitor_food_box_1308`.
- **`back_bundle`, big** (placement): the visitor's big pale cloth bundle tied at the neck, hanging down his back and
  left side, about 0.5 × 0.8 m real: the existing `back_bundle` at about 1.6× on the camel_driver's `look`/`idle`, in a
  pale cloth if the palette allows. Crop `[1240, 830, 1300, 925]`.
- **`pole_hooks`** (new): the water carrier's bare shoulder pole (水担), a bamboo pole about 1.7 m with a short rope and
  hook at each end and no load (the buckets are map props on the ground), slanting across his right shoulder down to
  the buckets at his feet, in `bucket_lift`. Crop `[1835, 790, 1930, 1000]`. `bucket_man_1872`.
- **`staff` on the shoulder** (placement): the attendant's staff or pole carried over his right shoulder in
  `carry_pole`, the existing 1.98 m `staff`. Crop `[1735, 1090, 1775, 1170]`. `attendant_pale_1750`.
- **`hip_bag`** (new): a dark cloth bag hanging at the hip from a cord, about 0.2 × 0.45 m. `walker_bag_1885`, crop
  `[1850, 1195, 1880, 1252]`. S6 asked for the same for five figures (listener_bag_3893, bearded_pouch_2949,
  young_man_walking_2570, doorway_man_4026, boy_short_jacket_2229): one prop serves both areas.
- **`bundle_small`** (new, or `back_bundle` at about 0.4 in a two-hand placement): a small tied cloth bundle held at the
  chest with both hands. `bundle_man_1976`, crop `[1955, 1100, 2010, 1260]`.
- **`child_on_lap`** (placement): the existing `child_in_arms` child (red jacket) sitting upright on the woman's thighs,
  facing forward, her hands at its waist, on `sit_hold_child` (until then on `sit`). `seated_woman_child_1535` and
  `child_on_lap_1546`, crop `[1515, 740, 1575, 880]`.
- **`riding_stick`** (optional, the existing `stick`): a thin stick rising behind the official's west shoulder, about
  1 m real, held upright in `ride`. Crop `[1550, 985, 1580, 1105]`.
- The groom's lead and the official's reins are the horse's tack (above).

## Kit parts `song_kit.py` lacks (for `blender/kit_city_end.py`; the finished areas' kits are imported read-only, as `outer_road_scene.py` imports `kit_inner_city`)

Nothing new is needed for: the leaning poles (`kit_inner_city.leaning_poles`), benches and stools (`kit_inner_city.
bench`, `stool`), the counter itself (`kit_inner_city.counter`), the hip-gable roofs (`kit_inner_city.xieshan_roof`; the
hip-gable building's 山花 ornament: `kit_outer_road.hanging_fish`), the small gate roof on posts (`song_kit.hip_roof`
on posts), the rolled blind (`kit_outer_road.bamboo_blind`), the sack (`song_kit.sack`), the box seat, the blocks and
the stones (`song_kit.soft_box`, `rock`). The rest:

- **赵太丞家's name tablets:** four lozenge-shaped tablets, each about 0.4 × 0.3 m, hung slanting under the eave
  between ornamented bracket clusters, reading east to west 趙 · 太 · 丞 · 家 (one character each). Crop
  `[1450, 600, 1750, 660]`. `kit_inner_city.eave_plaque` is square and flat.
- **The sign atlas `signs_city_end`** (a copy of `gen/sections/inner_city/make_signs.mjs`, its LXGW WenKai TC font has
  the traditional forms): the four tablets; the board fixed to the shop's west column, 五勞七傷□□□ top to bottom
  (about 0.28 × 1.45 m, its foot off the ground on the column; crop `[1455, 670, 1490, 825]`); the three free-standing
  boards, about 9, 8 and 8–9 illegible characters (□, drawn as faded smudges, never guessed). The scholars' readings
  治酒所伤真方集香丸 and 大理中丸医肠胃冷 are not legible on the scan: painting them is the lead's call.
- **Tall free-standing signboards on one centre post:** a narrow board (about 0.25–0.3 m wide) on a single post, about
  4 m overall at real size, standing on a splayed two-footed base (`board_zhao_west_a_1392`, `board_zhao_east_1775`) or
  a carved curled foot (`board_zhao_west_b_1433`). Crops `[1365, 600, 1420, 1025]`, `[1415, 570, 1450, 990]`,
  `[1750, 600, 1800, 995]`. `kit_inner_city.signboard` has two posts or a box foot only.
- **Medicine rack:** a rack of small boxes or drawers with small jars on it, standing on the back counter
  (`counter_back_1675`: counter about 0.65 m high with a box on a post at its east end; rack u 1597–1735, v 693–723).
  Crop `[1595, 690, 1750, 800]`.
- **The doctor's armchair:** a Song armchair with a curved top rail turned up at both ends, a slatted back and a cloth
  or cushion on the seat (`armchair_1657`), and a low footrest (脚踏) with thick edges in front of it (`footrest_1662`,
  a low stool may do). Crop `[1630, 745, 1695, 830]`.
- **Tilted lattice stand:** a small lattice panel of about 5 × 4 cells, about 0.55 m across, set slanting on the ground
  at the inner board's foot, its top edge raised (`lattice_stand_1452`). Crop `[1430, 900, 1500, 955]`.
- **The gate hall (门屋) of 官宦人家** (`S7.bld.gatehouse_1240`): a light plain door leaf with a ring knocker, standing
  open against the west jamb (`kit_outer_road.studded_leaf` is studded; a plain-leaf option); a low railed partition at
  the back of the passage under a post from the lintel (the lower half of a back door or a screen, about 0.65 m); a
  low dark-hatched panel standing on the west block against the pier; two small objects hung in the passage at the
  lintel's height (the east one a small lamp or hung cloth; the west one the conf-low head or lamp). The bracket sets,
  the slatted blind under the west bay's eave and the knee-high squared blocks (上马石 or pier plinths, about
  0.8 × 0.6 m front, the side face hatched) come from the kits. Crop `[1050, 580, 1420, 905]`.
- **The main hall's patterned front:** a panel of about 6 × 14 small dark repeated motifs between posts, a dark upright
  rectangle in its lower middle with a thin curved outline running out to both sides: a patterned curtain or screen
  gathered by a dark tie, or a patterned wall with a dark doorway (two readings in `S7.bld.main_hall_1300`). Crop
  `[1110, 240, 1380, 340]`.
- **A roof vent or chimney:** a tall narrow pale box with a small cap on the north-south hall's east slope
  (`S7.bld.hall_ns_1620`, u 1760–1791, v 186–268). Crop `[1755, 180, 1795, 272]`.
- **The 解 building's east end:** an eave post with a horizontal bar arm fixed to it, running east past S6's leaning
  board to carry S6's 解 plaque (the bar's west 58 px are S7's; S6 builds the plaque), a corner ornament on the
  north-east eave corner, a rail or shelf under the east eave (u 1855–1923, v 1604–1630), and, under the tub's
  reading (b), a screen of fine vertical slats hung from the bar between the post and the board. Crop
  `[1740, 1500, 2010, 1775]`.
- **The tall slatted tub** (`tub_slatted_1973`): vertical staves bound with hoops, a lattice-topped lid and an iron
  ring fitting on its face; `kit_inner_city.tub` lacks the lattice lid and the ring. Its height is a recorded choice:
  about 1.35 m (reading b) or up to the bar, about 2.1 m real (reading a). Crop `[1935, 1515, 2015, 1745]`.
- **Tall hooped buckets:** four, taller than wide, three or four hoops, a bail handle (`bucket_bail_1950`,
  `bucket_at_carrier_1890`), a lid with a knob (`bucket_lidded_1988`), a bail and a lid (`bucket_small_1930`).
  `song_kit.bucket` is a small open bucket with two hoops. Crop `[1875, 845, 2012, 1000]`.
- **A braced stand:** a bench or low table with diagonal braces between its legs (`bench_jie_eave_1885`). Crop
  `[1845, 1600, 1925, 1745]`.
- **A leaning reed panel:** a narrow, densely hatched mat or reed screen about 1.5 m long, leaning at a slant on a small
  foot block (`leaning_panel_1812`, conf low). Crop `[1795, 795, 1860, 950]`.
- **The box shed** (`S7.str.box_shed_1855`, conf low): a small box-like booth with a flat slanted top and a slatted
  front near its foot, or a set-down chest; soft boxes and slats. Crop `[1790, 720, 1925, 830]`.
- **The railing west of the gate** (`S7.str.fence_960`): square posts with flat caps and three rails, about 0.9 m
  (`kit_outer_road.low_rail_fence` has round-topped posts; `song_kit.balustrade` without balusters fits). Crop
  `[900, 790, 1105, 890]`.

## Set pieces

None of the round's set pieces (the Rainbow Bridge, 十千脚店's 彩楼欢门, the 望火楼, the farmhouse, the threshing floor)
is in S7. The gate hall of 官宦人家 and 赵太丞家 with its boards, tablets, counter and chair are built in the area's own
kit from the parts above.

## Trees: 9, by form (`trees/types.md`)

- **A new form, `willow_weep`, 1 tree:** `willow_edge_855`, the old willow at the cut edge, 11.5 m: a gnarled, lumpy,
  knotted trunk (its foot under the collectors' seal), a tall stem running off the top of the silk, and long whips
  **hanging in curtains** (bare, early spring), with a long limb arching about 4 m east over the gatehouse roofs and
  whips hanging from it to the railing. `trees/types.md` says the painter's willows never hang; this one does, so
  neither `willow_fan` nor `willow_burl` fits. One card, crop `[805, 0, 1260, 920]` (scan; the restyle paints a second
  trunk at the seal's border, and the scan has one trunk).
- **`elm_claw`, 2 trees:** `bare_knobbed_905` (5.3 m: a dark speckled trunk leaning west, crooked limbs ending in
  knobbed crab-claw tips over the street's west end, a spray of fine shoots sweeping east from its lower trunk; card
  `_1` or `_3`, crop `[805, 900, 1270, 1340]`); `gnarled_low_edge_875` (conf low: a low knotted mossy trunk with dotted
  limbs along the cut edge, or a rock at 905's foot; `_4` if it stays a tree, crop `[815, 1150, 935, 1615]`).
- **`shoot_tree`, 2 trees:** `bare_bottom_1117` (6.3 m tall and 7.5 m wide: one straight trunk from below the silk's
  edge forking at once into many limbs whose fine twig tips make a broad dome; bigger than the 3.5–5.5 m cards, so
  a larger card or `_1` scaled, crop `[860, 1280, 1445, 1770]`); `shoots_bottom_west_960` (2.5 m tall, 3.6 m wide: a
  dome of fine upright shoots, no trunk drawn; `_2`, the coppice fan, crop `[820, 1570, 1100, 1770]`).
- **`whip_clump`, 2 trees:** `twig_bush_bottom_1468` (1.6 m, a fan of long thin shoots rising from below the bottom
  edge) and `twig_bush_bottom_1648` (0.9 m); `_1`, crop `[1375, 1650, 1715, 1775]`.
- **`bamboo`, 2 trees:** `needle_tree_1910` (2.3 m) and `needle_tree_1955` (2.6 m, one straight culm with 个 sprays),
  the west end of S6's courtyard grove (S6's `needle_tree_2025` is `bamboo_1`); `_3` and `_1`, crop
  `[1820, 0, 2070, 300]`.

## For the lead (not the workshop's list)

- **The retinue moves east, toward S6,** and is painted walking with the ridden horse: as in S4 and S6, the horse
  stands under its rider and the three men stay with it, unless the page gets a group walk for a procession.
- **The horse's head:** at zoom 3.5 a pale rounded mass at u ≈ 1695–1760, v ≈ 1105–1160, just east of the groom's head
  and behind the pale attendant's shoulder, reads as the horse's head and neck (the restyle paints the horse there
  too), with the groom's two hands on the reins. The map's head point is est at (1685, 1110). The horse is built at
  real size, so this moves nothing; the map could take the point.
- The conf-low items that decide a model: `pale_shape_1905` (animal or mat), `face_at_gate_door_1251` (a head or a
  lamp), `gnarled_low_edge_875` (a tree or a rock), `box_shed_1855` (a shed or a chest), the tub's height.
