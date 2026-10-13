# Outer road part 2 (S4b, u 12600–15500): what the workshop needs to make

From the needs agent, Run 1 of round 2 (2026-10-12), for the lead's catalogue agent. Every item comes from the scroll
map: `map/text/S4b.md` says where each thing is and what it does, and `sections/outer_road_2/layout.json` holds the
positions (222 entities after the merge, the second pass and the frame). Figures are named by their slug
(`S4b.fig.<slug>`). Crops are in scan px `[u0, v0, u1, v1]` on this section's registered restyle
(`gen/sections/outer_road_2/mosaic.jpg`, section `outer_road_2`: scan u = 12448 + px/2, v = py/2). Read the scan
beside it with `node tools/scroll_inspect.mjs outer_road_2 <u> <v> <half>`, because the restyle redraws: it leafs every
willow, adds people on the bank and the boats, and turned a donkey and a horse's tail into bending men here
(`sections/outer_road_2/notes.md`).

**Real size** (`map/BUILDING.md` rule 5): every person, animal, cart and boat is made at real size; only positions
come from the map. S4b's figures shrink fast up the silk: about 170 px on the road, 150 px at v 640–690, 99 px at
v 490–550, 57–69 px on the bank at v 400, and the boat crews 38–54 px. Painted heights are therefore not sizes. The
children's scales below are measured against the adults painted next to them.

**Credits.** Meshy has about 151 credits left for the whole round (`gen/expand/round2_progress.md`). S4b needs **no
new character**: all 66 figures are cast from the 22 existing ones. Every missing clip below is a free local retarget
(`tools/retarget_local.mjs`, `t2m:` or `from:`). The only paid items are up to three new Text to Motion takes
(10 credits each), ranked below.

## Casting: 66 figures, all from the existing 22

| character | figures | | character | figures |
|---|---|---|---|---|
| idler | 13 | | child | 3 (scaled) |
| scholar | 10 | | carter | 3 |
| porter | 9 | | inspector | 3 |
| robed_man | 8 | | hat_traveller | 3 |
| townsman | 6 | | official, storyteller, child_robed, camel_driver | 1 each |
| sightseer | 4 | | | |

The dress decides the cast:
- short jackets and trousers are the idler or the porter;
- long light robes with a dark cap are the scholar;
- a light robe without a cap is the robed man;
- dark long robes are the townsman or the inspector;
- blue robes are the sightseer;
- wide hats are the hat traveller.

Twenty figures are `conf: low` (faint, half hidden or with two readings); 21 are high and 25 med. Where a low figure has another reading, the alternative cast is in its line.
The idler would play 19 if every short-jacketed figure went to him, so the faint figures whose dress can't be read
went to the porter, the carter and the townsman instead.

**Clips to add, all free** (local retarget, no credits):
- idler: `steer` (`t2m:steer_shafts`), `drive_team` (`t2m:drive_team`), `arms_folded` (`from:inspector/arms_folded`),
  `bend_goods` (`t2m:bend_goods`);
- scholar: `crane` (trimmed earlier, back from `t2m:crane_listen`), `bridle` (`t2m:hold_bridle`), `lean_over`
  (`t2m:lean_over`);
- porter: `push` (`from:carter/push`), `look` (`from:townsman/look`), `bend_goods` (`t2m:bend_goods`);
- robed_man: `sit` (trimmed earlier, back), `look` (`from:townsman/look`), `knees_up` (`t2m:sit_knees_up`);
- townsman: `sit` (`from:scholar/sit`), `sit_listen` (`t2m:sit_listen`);
- sightseer: `sit_listen` (`t2m:sit_listen`);
- hat_traveller: `bridle` (`t2m:hold_bridle`), `look` (`from:townsman/look`);
- inspector: `push_flank` (`t2m:push_flank`);
- storyteller: `sit_floor` (`from:idler/sit_floor`), until the seated action below exists.

Run `node tools/clips_used.mjs` after casting.

**Optional new characters (the catalogue's call; S4b doesn't need them):**
- **boatman**, for the whole river. S4b's five crew are 38–54 px and faint, so S4b offers no good model figure. Their
  best is `S4b.fig.seated_man_cabin_roof_15012`, crop [15000, 500, 15045, 558]
  (`scratchpad/S4b_needs/crop_roof_man_15012.jpg`). If S3 or S2 gives a boatman from a sweep crew painted at full
  size, recast S4b's five crew with him.
- **a dark broad-brimmed hat** on the hat traveller, as a texture variant if one is cheap: `man_big_hat_12895` (a
  big round black hat, crop [12855, 1515, 12975, 1700], `scratchpad/S4b_needs/insp_hats12895.jpg`) and
  `man_wide_hat_13760` (crop [13705, 630, 13780, 790], `scratchpad/S4b_needs/crop_wide_hat_13760.jpg`). The
  hat traveller's own hat is a light conical straw hat.

### idler (13)

- `man_dark_cap_by_stair_12700`: `sit_floor`. Low: dark cap, light clothes, sitting at the stair's foot facing west behind the big jar (other reading: standing behind it, `idle`).
- `seated_in_bottom_shop_12792`: `sit`. Low: a faint pale figure hunched at the tray table, facing east.
- `man_white_jacket_12773`: `look`. Light short jacket and trousers, standing at the bottom shop's front facing east toward the small horse; a cloth or bag hangs from his hand (prop below).
- `onlooker_grey_jacket_13152`: `look`. Young man, dark cap, light short jacket with a dark collar, at the crowd's west edge.
- `carter_at_shaft_ox_13243`: `steer`. White short jacket, dark cloth round the hips, light trousers, walking north-east beside the shaft ox's hindquarters with his right arm raised to the ox or the shaft.
- `cart_driver_13303`: `drive_team`. Bare-headed young driver, light short jacket, dark wrap at the hips, walking beyond the shaft ox toward the lead ox with a stick or the lead rope in his right hand (prop `stick`).
- `counter_man_leaning_13325`: `lean_chin`. Hair in a knot or a small cap, light jacket, leaning forward on the counter's east end under the small shed.
- `man_behind_donkey_13512`: `point`. Dark cap, pale jacket, behind the donkey with one arm reaching west toward the men at the horse.
- `muleteer_13560`: `arms_folded`. Pale short jacket, trousers, dark cap, at the front mule's head with his arms folded at his chest round something small, head turned west; painted walking.
- `wheelwright_bending_13620`: `bend_goods`. The wheelwright (车铺劳作, pin 26): short jacket and trousers, hair in a topknot, bending from the waist over the wheel lying on the ground, his west hand at its rim with a mallet or a block. Needs the wheelwright action and the mallet below.
- `figure_at_front_rail_14752`: `crouch`. Low: crouching on the road in front of the tea house's front rail, reaching east under it toward the small round basket or drum.
- `man_on_bank_14928`: `point`. Dark hair or cap, light robe, on the bank at the big boat's bow, right arm stretched east at shoulder height toward the boats.
- `seated_boatman_stern_15372`: `sit_floor`. Dark hair or cap, seated under the east end of the arched awning by the rudder stock (`boat deck`, H 0.14).

### scholar (10)

- `customer_light_12990`: `drink`. Low: light clothes, seated at the west end of the shop table facing the viewer.
- `onlooker_light_robe_13200`: `crane`. Dark cap, long light robe, head bent toward the seated man.
- `man_in_shed_13220`: `look`. Dark cap, long light robe, standing in the railed shed's open front behind the crowd, looking west away from it.
- `tall_onlooker_leaning_13290`: `crane`. Tall, dark cap, long light robe, leaning forward with his head bowed and his hands in his sleeves.
- `man_in_white_at_horse_13360`: `bridle`. Dark cap, long white robe, standing at the saddled horse's head facing us, holding it.
- `onlooker_profile_13382`: `look`. Dark cap, long light robe, in profile facing west.
- `stall_keeper_13415`: `idle`. Dark cap, long light robe, facing us at the top-street stall, holding a round lidded basket by its loop handle at his right side (prop below).
- `man_bending_to_donkey_13440`: `lean_over`. Dark cap, broad light robe, bending east with both arms reaching over the small donkey's back.
- `man_behind_tree_13850`: `look`. Pale robe, dark cap, behind the big tree's west stem looking down west at the mules.
- `man_east_bay_14958`: `knees_up`. Low: light robe, seated leaning back with his knees drawn up, a reddish oval at his lap (red trousers or a cloth). Other reading: a waiter standing with a round reddish tray (porter `hold_tray`).

### porter (9)

- `porter_at_cart_rear_13090`: `push`. Short jacket and trousers, a dark bundle tied round his waist, seen from behind with both arms raised to the underside of the second cart's rear: needs the reach-up action below (`push` until then).
- `onlooker_back_view_13332`: `look`. Dark cap, short jacket and trousers, back to us in the crowd's front row.
- `porter_tall_load_13402`: `idle`. Low: short jacket and trousers, seen from behind facing east, a tall dark cylindrical load with a pale band on his back and a waist-high T-shaped stick (打杵) under his hand: the back load and the stick are props below, and resting the load on the stick is an action below. Other reading: a tall dark hat and a walking stick (hat_traveller with `staff`).
- `porter_pole_bundle_13537`: `carry_pole`. Pointed cap or knotted kerchief, short pale jacket with an apron-like wrap, bare legs, a pole on his right shoulder with a dark bundle hanging at its back end (prop `pole_bundle`); walks east across the open square.
- `man_bending_sack_13607`: `bend_goods`. Short jacket over a long pleated wrap, bending forward holding a pale sack open with both hands (prop below).
- `figure_behind_roof_14583`: `walk`. Low: head (a knot or small cap) and shoulders over the tea house's back roof, back to us, walking north through the gate onto the riverside ground.
- `porter_baskets_14778`: `carry_pole`. Short jacket, dark cap, bent under a shoulder pole with a round basket on cords at each end (prop `pole_baskets`), one hand steadying the pole; stepping east down the gangplank onto the mat-cargo boat (余辉's 客家登船?): a short walk along the boat's `line_gangplank`.
- `boatman_dark_cap_15046`: `idle`. Low: dark cap, a robe or jacket, standing on the long boat's south deck (`boat deck`, H -0.12).
- `head_in_cabin_door_15097`: `idle`. A dark round head in the big boat's middle cabin door, the body hidden by the door's lower panel (`boat deck`, H 0.03).

### robed_man (8)

- `man_seated_front_of_hall_12866`: `sit`. Long light robe, dark hair, no cap: seated on a bench in front of the hall's railing, body turned east, right arm out toward the funnel-shaped vessel.
- `sedan_attendant_13160`: `idle`. Hair in a knot, long light robe, standing between the set-down sedan chair's poles facing us (painted at adult height: not a child).
- `bearded_onlooker_13350`: `listen`. Dark beard, long light robe tied with a sash (the robed man's sash), looking down at the seated man; he wears a dark cap, which the robed man lacks.
- `man_looking_up_13755`: `look`. Bearded, dark cap or topknot, pale robe, head tilted back looking up and east (the look-up action below is optional).
- `man_at_gate_post_14540`: `idle`. Long light robe, dark head-cloth, standing at the roofed gate's east post facing west.
- `customer_white_14560`: `knees_up`. Stout, white robe, dark hair, on a low stool at the table's east end with his right knee drawn up on the seat, facing the man in the hat (the knee-on-stool action below is optional).
- `seated_man_cabin_roof_15012`: `knees_up`. Light robe, bare head or close cap, seated on the big boat's west cabin roof (`boat roof`, H 1.39) leaning forward with his knees drawn up, looking down at the boats to the north.
- `man_frame_or_hat_15125`: `talk`. Light robe, a dark band of hair or headband, face turned west to the man in the cap; over his head a wide tilted roof-like shape with long strokes hanging from its east edge: reading (a) a frame, chair or pedlar's rack carried on his back (the merge's reading; prop below), reading (b) a very wide hat with a veil or straw cape (then hat_traveller).

### townsman (6)

- `customer_dark_hat_13027`: `sit`. Low: dark round hat, light clothes, seated at the table's south side with his back to the viewer.
- `onlooker_dark_robe_13222`: `crane`. Dark cap, dark long robe, looking down at the seated man.
- `onlooker_dark_robe_13425`: `look`. Dark cap, dark long robe, facing west at the crowd's east end.
- `figure_behind_rail_13995`: `idle`. Low (dress unreadable): a faint head and shoulders behind the rail west of the big elm's trunk.
- `customer_hat_14462`: `sit_listen`. Dark hat (small and round on the scan; the restyle gives him a dark cap), a robe, seated on a chair at the tea table's west end leaning toward the man in white.
- `man_on_bank_14686`: `talk`. Long robe, dark cap, turned south-west to the small figure; a bag or a fold of sleeve hangs at his west side.

### sightseer (4)

- `man_standing_by_hall_12942`: `idle`. Cap and long robe (the restyle paints it blue), standing at the hall's east end with his arms lowered toward the vessel.
- `young_onlooker_13387`: `look`. Young, beardless, dark cap, long robe (the restyle paints it blue), in the back row.
- `customer_cap_14785`: `sit_listen`. Dark cap, robe (grey in the restyle), seated on a stool leaning forward with both forearms on the table, head turned west.
- `man_dark_cap_15075`: `chat`. Dark rounded cap, plain robe (blue in the restyle), seen from behind on the road, talking with the man under the frame.

### child (3)

- `small_figure_cart_rear_12706`: `look`. Low, `scale` about 0.5 (head 13 px against the adults' 20; about 75-80 px tall where adults paint 150-170): light clothes, head turned south, at the first cart's west end. Part 1's "small boy".
- `small_onlooker_13180`: `look`. Low, `scale` about 0.7: a small head in a dark cap at the crowd's west edge (other reading: a man stooping, idler `crane`).
- `small_companion_14654`: `reach`. `scale` about 0.8 (57 px against the man's 69): short jacket and trousers, round dark-haired head, one arm out to the man's sleeve or bag.

### carter (3)

- `seated_in_cart_front_12995`: `sit`. Low: seated under the front of the first cart's thatch on `cart bed: S4b.veh.palm_cart_13070` (H 0.71); the restyle's orange-brown jacket and hair bun fit the carter's ochre robe.
- `figure_in_shop_13242`: `sit`. Low (dress unreadable): a dim seated shape at the back of the open shop (other reading: bundles or a hanging cloth, then no figure).
- `stall_keeper_seated_13940`: `sit`. Low (dress unreadable): faint, seated behind the goods table under the shed's east end.

### inspector (3)

- `dark_figure_or_garment_12825`: `idle`. Low: a narrow dark robe between the hall's posts, head bowed; if it is a robe hung on a post it is part of S4's hall and no figure.
- `man_bowed_at_horse_13410`: `push_flank`. Dark clothes, head bowed against the saddled horse's flank under the saddle, as if tightening the girth.
- `customer_bent_14420`: `lean_over`. Low: long dark robe, seen from behind, bent forward over the table end at the tea house's west post (a customer or the keeper serving).

### hat_traveller (3)

- `man_big_hat_12895`: `bridle`. Low: a big round black hat (56 px wide) and a light robe, on the far side of the small horse, holding its head; the hat_traveller's straw hat is light, so a dark hat is a variant if one is cheap.
- `man_wide_hat_13760`: `look`. Low: a wide flat dark hat and a long pale robe, behind the wheel's east end watching the wheelwright (other reading: a trestle with goods, then no figure).
- `boatman_light_hat_15066`: `idle`. Low: a light hat (or bare head) beside him on the long boat's deck.

### official (1)

- `official_seated_12728`: `write`. Seated on the hall's raised floor (`official hall floor`, H 0.45) behind its railing, his rounded back to the west, leaning east as if reading or writing; no desk or seat shows. `write` is a chair sit: the seat it needs is hidden behind the railing, so it is a recorded choice, and the desk is not built (not painted). The floor-sit action below is optional.

### storyteller (1)

- `seated_man_13240`: `sit_floor`. Bearded, dark cap, dark long robe: seated on the ground, bending forward with both arms reaching down to the goods spread before him; storyteller, fortune-teller or pedlar is open (Hansen pl. 17-18). Needs the seated showing action below (`sit_floor` until then).

### child_robed (1)

- `youth_onlooker_13265`: `chin`. `scale` about 0.8 (99 px against 127 beside him): a youth in a dark cap and a dark striped or patterned robe, bending a little toward the seated man.

### camel_driver (1)

- `onlooker_behind_13428`: `look`. Dark hair or a small cap, long robe, behind the man in the dark robe (the camel driver's grey-blue tunic and hair bun read as a plain townsman here).

## Actions the existing clips can't show (one line each, ranked; 10 credits a take, then free for anyone)

1. **The wheelwright at work** (`wheelwright_bending_13620`; 车铺劳作, pin 26, one of 余辉's named vignettes): bent from
   the waist over a big wheel lying flat on the ground, the left hand on its rim, the right swinging a short mallet down
   onto the rim or a spoke in short strokes, then shifting along the rim. Until then `bend_goods`. Prop `mallet` below.
2. **Seated on the ground showing goods** (`seated_man_13240`, at the centre of the 13-man crowd): sitting
   cross-legged, bending forward, both hands reaching down to small goods on a mat in front of him, lifting one up to
   show it, talking up at the men standing round him. The storyteller's `tell` is a standing clip. Until then
   `sit_floor`.
3. **Reaching up to a cart's load** (`porter_at_cart_rear_13090`): standing under the back of a cart bed with both arms
   raised above the head, steadying a load and easing it down. Until then `push`.
4. *(optional)* Standing still under a tall back load, resting it on a waist-high T-shaped stick (打杵) held behind
   him (`porter_tall_load_13402`, conf low). Until then `idle` with the props.
5. *(optional)* Seated on a low stool with one knee drawn up onto the seat, talking across a table
   (`customer_white_14560`). Until then `knees_up`.
6. *(optional)* Standing with the head tilted back, looking up and to one side (`man_looking_up_13755`). Until then
   `look`.
7. *(optional)* Tightening a saddle girth: the head bowed against the horse's flank, both hands under the saddle
   (`man_bowed_at_horse_13410`). Until then `push_flank`.
8. *(optional)* Seated on a stern deck with one hand on the tiller (`seated_boatman_stern_15372`). Until then
   `sit_floor`.
9. *(optional)* Seated on a raised floor, leaning forward to read or write (`official_seated_12728`). Until then
   `write` on a hidden seat.

**Painted walkers** (short walks along the painted direction and back, people.json):
- `porter_baskets_14778`: down the gangplank (the boat kit's `line_gangplank`) onto the mat-cargo boat;
- `porter_pole_bundle_13537`: east across the open square;
- `muleteer_13560`: along the mules;
- `figure_behind_roof_14583`: north through the roofed gate;
- `carter_at_shaft_ox_13243` and `cart_driver_13303`: beside the second cart's team, if the cart is made to move.
  Otherwise they act in place.

## Animals: 10 (map IDs; built at real size)

The map's hoof-to-hoof length is painted and foreshortened, so it gives orientation only.

- `S4b.ani.ox_shaft_13442`: ox, light-coloured (outline only, no wash), in the shafts of the second palm-covered cart.
  It pulls north-east (facing 40) with its head low at the yoke and the shafts along its back. Tack `draught` (girth
  band with trace points, breast strap, nose rope); the yoke is the cart's.
- `S4b.ani.ox_lead_13458`: ox, big and light, on traces ahead of the shaft ox. It is seen from behind, walking
  north-west (facing 135, conf med) with its head raised and turned west. Tack `draught`, traces from the yoke, a rope
  to the driver. It has **long curved horns pointing up**; the registry ox has short horns, so this is a horn variant
  if cheap.
- `S4b.ani.horse_saddled_13378`: horse, **dark**, side-on facing west (180), head lowered at the man in white's
  shoulder, tail hanging. No rider; its legs are hidden by the men and the donkey. It wears a saddle with a high pommel
  and cantle over a **dark saddle cloth hanging down its side**, which the restyle paints blue under a red saddle.
  Clip `head_low`.
  - The registry horse is pale grey-white. A dark coat is free (`"body_from": "horse"` plus `tone`), and so is a
    `saddle` variant with a dark cloth. S4's `S4.ani.horse_dark_10372` was cast as the pale horse for the same reason
    and would take the dark coat too.
- `S4b.ani.horse_12862`: horse, **small and light-coloured**, with a long dark tail and a dark forelock and mane. It
  stands facing east (0) at the second cart's rear, its head held low toward the cart's underside. It is not
  harnessed; the man in the big hat holds its head. A dark band across its middle is a girth or a short saddle cloth:
  a **girth-only (or plain cloth) tack variant** on the horse, which has only `saddle`. It is painted pony-sized (back
  110 px above the hooves beside a 170 px man), so a `scale` of about 0.85 is a choice. Clip `head_low`.
- `S4b.ani.donkey_13474`: donkey, **small and dark**, no load or saddle. It stands facing about 165 with its head
  lowered at its west end under the arms of the man bending over it. The registry donkey is grey-dun: a dark `tone`
  variant is free. Clip `graze` (head low).
- **Four pack mules on the top street**, all facing west (180). Each carries a pack saddle **heaped with a dark hatched
  load** (sacks or bundles under a dark cloth). The registry mule's `pack_saddle` carries white side bundles, so this
  needs a dark heaped-load variant; the donkey's `pannier_charcoal` palette already has the dark colours. They paint
  125 px nose to rump against the 99 px muleteer, so they are mules, not donkeys. The muleteer walks at the front.
  - `S4b.ani.mule_pack_head_down_13612`: the front mule, head lowered west, `graze`.
  - `S4b.ani.mule_pack_head_up_13645`: behind the first, head raised with the ears up, `idle`.
  - `S4b.ani.mule_pack_east_13752`: under the big tree's twigs, head and neck lowered west, `graze`.
  - `S4b.ani.mule_pack_behind_13787` (conf low): mostly hidden behind the third; one leg and part of a load show.
    `idle`.
- `S4b.ani.bird_12827`: a small dark bird perched among the sprays of part 1's tree `S4.tree.willow_12588`, above the
  official hall's roof, tail to the west. Support `perched: S4.tree.willow_12588`, H 5.29. The kit bird with `idle`.
  It is S4b's entity on S4's tree card. The restyle paints it flying; the map reads it as perched (conf med).

What the registry lacks for these:
- a dark horse coat and a dark-cloth saddle;
- a girth-only tack variant on the horse;
- a dark donkey coat;
- a dark heaped pack load on the mule;
- long upswept horns on the lead ox (optional).

None of these needs Meshy.

## Vehicles: 3 (plus 6 boats below)

- `S4b.veh.palm_cart_13070`: the **first palm-covered family cart (大棕盖车, 余辉's 豪车云集)**, parked unhitched on the
  north side of the road in front of the official hall, facing east (conf low-med).
  - **Roof:** a huge shaggy roof of palm fibre over a tall box body. A black cord runs along the ridge and loops down
    near each end, and the part east of the second loop is a hood like the second cart's front.
  - **Under-frame:** lattice-railed. One big spoked wheel shows (the near one, rim 152 px across, top at v 1128; the
    hub and the lower half are hidden).
  - **Shafts:** a short frame juts out at the east end and ends in a carved beam end, the roots of the shafts. No
    shafts, yoke or animals are drawn.
  - **Size and people:** mapped length 4.80 m (est); about 400 px long and 290 px from the ridge to the ground. A
    person sits under the thatch at its front (`cart bed` H 0.71), and a small figure stands at its west end.
  - **Kit:** a **palm-thatch variant of `kit_vehicles.covered_ox_cart`**: a thick, shaggy, fringed palm roof with a
    ridge cord and a front hood in place of the reed barrel. Its shafts are a choice: not painted, so lowered to the
    ground or left off as recorded.
- `S4b.veh.palm_cart_13455`: the **second palm-covered cart (名画记 pin 27 大棕盖车)**, heading north-east (facing 30) under
  way.
  - **Body:** the same palm roof, with a knob on its ridge and a front face at u 13228–13289.
  - **Wheel:** one big spoked wheel under its middle. The rim is 84 × 224 px, a narrow ellipse, so its plane recedes
    steeply. The hub is at about (13165, 1555), and it touches the ground at (13178, 1657).
  - **Load:** a dark sack or bundle slung under the rear half of the bed: a dark box and a dark round thing.
  - **Team:** shafts from the bed to the shaft ox's yoke, (13255, 1434) → (13463, 1376), and a lead ox on traces.
  - **Size and people:** mapped 6.40 m from the shaft tips to the bed's rear (est); about 380 px long and 390 px from
    the ground to the ridge. A driver walks beyond the shaft ox, a carter at its hindquarters and a porter at its rear.
  - **Kit:** the same palm variant, with shafts and `_ox_yoke`, and the slung load (`soft_sack` and a box).
- `S4b.veh.sedan_chair_13140`: a **sedan chair (轿) set down** on the road just east of the first cart, beside the
  shop's counter. No passenger shows.
  - **Body:** a panelled box with a lattice window high in its south side and a narrow door strip at its west end,
    under a dark domed roof with up-turned eaves.
  - **Feet and poles:** it stands on short corner legs. Its two poles run east at mid-height (v 1030–1053) to a
    crossbar at about u 13263–13283, across the attendant standing between them. The west pole ends are hidden.
  - **Size:** box 80 px long, 184 px from the roof to the feet; mapped 1.04 m between the box's ends. It faces east
    (conf low), toward its poles.
  - **Kit:** the existing `kit_vehicles.sedan_chair(carried=False)` (set down on four short feet, poles at
    mid-cabin), with `cabin_at` near the poles' west end.

## Boats: 6 (for the boat factory, `blender/kit_boats.py`; real size by type, painted order and gaps)

Orientation is settled (the lead's rule, applied at the merge). The five rafted boats moor **bows to the bank (the
west ends)**: the bitts, gangplank and mooring ropes are there. Their **sterns are the outer east ends**, which carry
the rudder stock, the sweep or the tiller. The top boat's bow is its up-swept west end.

**The boat factory's inventory of S4b (`gen/boats/types.md` #1–#5) disagrees with the map in three places:**
- its #3 (the long boat) and #5 (the big boat) put the stern at the bank;
- its #1 (the top boat) says "bow east";
- its #4 merges two hulls: the mat-cargo boat and the arched-awning boat.

Mapped lengths are the frame's distance between the painted waterline ends; most ends are est, hidden by the
neighbouring hulls.

**Rafted gaps.** The rafted boats' centre lines lie only 1.8–3.9 m apart in the frame (mid D 16.3, 20.2, 22.0, 23.8,
26.6 from south to north). That is less than any kit beam, so the pilot's "shorten to 0.6, then move outward" rule
(`map/BUILDING.md`) will move them apart.

- `S4b.veh.boat_big_cabin_14928`: the **biggest boat**, the southernmost of the row. Preset `passenger` (the factory's
  #5, its `boards` variant).
  - **Size:** mapped 12.32 m between the waterline ends, bow (79.42, 17.87) and stern (91.33, 14.71) est. The hull runs
    u 14903–15855 with the sweep, into S3's range; it is S4b's by Phase 0. Beam not mapped (only `beam_s`). Deck
    H 0.03, a freeboard of 0.73 m; the bow gunwale is 1.25 m above the water.
  - **Hull:** timber with planked strakes and nail rows.
  - **Cabins:** at the bow end, a raked end under a hip-roofed cabin; a man sits on its roof (`boat roof` H 1.39). A
    long middle cabin has planked walls and posts, and someone looks out of its door. At the stern, a mat-roofed after
    cabin with railings (u 15500–15805).
  - **Mast:** a long spar lies along the cabin tops to a brush-like end at u ≈ 15865, probably the mast lowered and
    stowed (a short post at u 15340 may be its tabernacle; conf low). Not raised.
  - **Sweep:** a long tapering sweep blade trails east in the water beyond the stern (u 15680–15855), at rest.
  - **Cargo:** round woven baskets or bales on deck (u 15190–15360).
  - **Lines and poles:** two ropes from the bow to `S4b.prop.mooring_post_14737`. A long pole lies from the post's foot
    along the hull's south side to about (15200, 765) (a gangplank or a pole; conf low). Another pole leans through a
    rope loop on the south side into the water.
  - **Rafted:** the arched-awning boat lies on its north side.
  - **Crew:** 2, `seated_man_cabin_roof_15012` and `head_in_cabin_door_15097`.
- `S4b.veh.boat_arched_awning_14945`: type grain, riding high under an awning: preset **`grain_awning_sweep`** with the sweep at rest
  (or `small_awning` if the factory prefers). It is half of the factory's #4.
  - **Size:** mapped 6.10 m, both ends est. Only the after half is painted; the west half is hidden behind the big
    boat's bow cabin. Deck H 0.14, a freeboard of 0.84 m at the stern.
  - **Awning and stern:** an arched mat awning on hoops over the after half (u 15105–15407). A dark upturned stern head,
    a vertical rudder stock, and a pole slanting into the water at the stern (a sweep at rest, or a punt pole).
  - **Lines:** an anchor line from the stern east-south-east into the water, ending at a splash at about (15592, 584),
    past the seam.
  - **Rafted:** between the mat-cargo boat (north) and the big boat (south).
  - **Crew:** 1, `seated_boatman_stern_15372`, seated under the awning's east end.
- `S4b.veh.boat_mat_cargo_14900`: type grain, riding high with mat cargo: preset **`grain_awning_sweep`**, its sweep shipped raised. It is
  the other half of the factory's #4.
  - **Size:** mapped 5.79 m, both ends est. Hull u 14882–15390, about 510 px.
  - **Cover and cargo:** a dark barrel-shaped mat roof over the bow end. Woven mats or matted bales are laden along the
    middle, with a row of round coils or flat baskets on deck (u 15040–15160).
  - **Sweep:** a long tapering hatched spar projects east at deck level to a point at (15390, 458), a sweep shipped
    raised.
  - **Gangplank:** from the bank path at (14760, 402) down to its bow at (14895, 463); the porter with two baskets walks
    it.
  - **Lines:** a looped anchor line from the stern east into the water, ending at (15507, 511).
  - **Rafted:** between the long boat (north) and the arched-awning boat (south).
  - **Crew:** none.
- `S4b.veh.boat_long_cabin_14850`: preset **`passenger`, short cabin** (the factory's #3, ends reversed).
  - **Size:** mapped 7.18 m, ends est. Hull u 14841–15391, about 550 px. Deck H −0.12, a freeboard of about 0.58 m
    (est).
  - **Bow:** a high bow end at the bank under a big dark mat roof.
  - **Cabins:** a planked deck cabin with a round emblem amidships, and a deckhouse with lattice windows and a hipped
    roof at the stern (85 px wide, its floor at v ≈ 410).
  - **Rafted:** between the round boat (north, whose stern rests over its middle) and the mat-cargo boat (south).
  - **Crew:** 2 standing on the south deck, both faint: `boatman_dark_cap_15046` and `boatman_light_hat_15066`.
- `S4b.veh.boat_round_mat_15025`: type grain under an arched mat awning: preset **`grain_awning_sweep`** without the sweep (the factory's
  #2).
  - **Position:** seen almost end-on, moored bow-in at an angle (heading 148) at the top of the row, its stern over
    the middle of the long boat. Its pointed bow, with a forked post (bitt), touches the landing at the top left.
  - **Stern:** broad, toward the viewer: a squared transom with an arched opening, a rudder stock on the centre line,
    and bulging hull sides.
  - **Awning and poles:** a big arched mat roof over the hull. Two poles lie over the bow.
  - **Size:** mapped beam 3.00 m across the bulging sides (est; 235 px). Its length is foreshortened (2.81 m mapped,
    not usable). The transom is 80 px wide.
  - **Crew:** none.
- `S4b.veh.boat_small_cabin_15182`: preset **`small_awning`** (the factory's #1, ends reversed). It lies east-west
  along the **far bank** at the top of the silk.
  - **Bow:** an up-swept pointed west end with a small post or flag on it. A low mat canopy covers the west half.
  - **Stern:** a higher mat-roofed cabin at the east end, with an opening in its end wall, and a short tiller-like
    stick projecting east at deck level.
  - **Size:** mapped 3.27 m (280 px painted), freeboard 0.86 m at the bow and about 0.7 amidships.
  - **Not painted:** no mast and no crew; the restyle's mast and crewman there are the far bank's willow trunks. No
    mooring lines are read.

**Water:** one reach of the 汴河, H −0.7 (the frame's `water`, a bound, conf low), between the near shore and the far
shore. It is 16.5 m wide at u 15500. The near bank is a low sandy slope washed with dark streaks, with a landing in
front of the top-left building. The far bank is faint, with a shed and bare willows. **No revetment, stair or jetty is
painted**, so none is built (the brief's "landing stair" is withdrawn). The page's `water_strip()` and the shore band
serve it.

## Props carried by figures

Existing props, new bindings only:
- `pole_baskets` (`porter_baskets_14778`, porter `carry_pole`);
- `pole_bundle` (`porter_pole_bundle_13537`, porter `carry_pole`);
- `stick` (`cart_driver_13303`, a new binding on the idler's `drive_team`).

New:
- **`mallet`**: a short-handled wooden mallet in the right hand (`wheelwright_bending_13620`).
- **`open_sack`**: a pale cloth sack held open by its mouth in both hands at knee height (`man_bending_sack_13607`).
- **`lidded_basket`**: a round lidded basket with a loop handle, held down at the right side (`stall_keeper_13415`;
  painted u 13370–13400, v 397–430).
- **`cloth_bag`**: a cloth or small bag hanging from the hand at his west side (`man_white_jacket_12773`; painted
  u 12720–12757, v 1670–1730). A smaller one at `man_on_bank_14686`'s side is optional.
- **`back_tall_bundle` + `t_stick`** (`porter_tall_load_13402`, conf low): a tall dark cylindrical bundle with a pale
  band, on a back frame, rising above his head (shape u 13346–13384, v 668–721). With it, a waist-high T-shaped stick
  (打杵): crossbar (13405, 765) → (13450, 778), shaft to the ground at (13418, 855).
- **`back_chair_frame`** (`man_frame_or_hat_15125`, reading a): a wooden frame, chair or pedlar's rack carried on the
  back. Its tilted top is about three face-widths wide over his head, peaked at the west, and its legs hang from the
  east edge to about his hips. Fallback: the monk's `back_frame` (笈). Reading b, a very wide hat with a veil or straw
  cape at one side, would use the hat traveller's hat instead.

## Kit parts the area needs (what exists, what is new)

The area kit `blender/kit_outer_road_2.py` imports the shared kits and never edits them. Existing pieces are named with
their module; **new** marks what no kit has.

**The wheelwright's yard (车铺劳作):**
- `loose_wheel_13665`: a big spoked cart wheel lying flat, its hub standing up. `kit_vehicles.spoked_wheel` laid flat.
- **new** `pole_frame_basket_13690`: a free-standing tall frame of bent poles tied together at the top like a hooped
  arch, with a big round woven basket hung inside on short cords at mid-height. It can be composed from
  `kit_inner_city.lashed_pole`/`lashing` and `round_basket`.
- **new** `timber_pile_13745`: a low pile of squared timbers and poles lying crosswise, some with notched or rounded
  ends (shafts, axles, felloe blanks).
- `leaning_poles_13775`: two or three long poles or shafts leaning on the shed's eave. `kit_inner_city.leaning_poles`.
- **new**, low: `striped_load_13684`, a rounded mass with close horizontal stripes (a woven basket, a bundle of spokes,
  a mat-wrapped load) on low legs or a trestle.
- **new**, low: `tool_on_ground_13632`, a chisel or a short adze lying on the ground.
- `S4b.bld.wheelwright_shed_13840`: a narrow tiled shed with a roll-tile ridge, continued by a **lean-to of lattice
  texture (mat or thin boards) on two posts**. Under the upper roof's west end is a small pent-roofed lattice box (a
  window or a cupboard); a rail runs from the south post to the big tree. Built from song_kit roofs,
  `kit_inner_city.lean_to`/`mat_roof` and `kit_outer_road.low_rail_fence`.

**The tea house (小铺闲坐?) and the shops:**
- `S4b.bld.tea_house_14531`: an open hall on a low platform (`tea house floor` H 0.18; `S4b.str.tea_house_platform_14520`
  with a small step down at the hall's west post).
  - **Main roof:** a big tiled gable roof whose **south gable, with its king post, tie beam and short posts, faces the
    road**.
  - **Second roof:** a smaller parallel gable roof on its east side.
  - **Front canopy (new):** across the whole front, **a broad lean-to canopy of mat or thatch with a fringed eave on
    posts**. `kit_inner_city.mat_roof` has no fringe, and no kit shows an open king-post gable.
  - **Walls and rail:** a lattice screen closes the west end. A pale doorway with a lattice transom and a cap opens in
    the west (back) wall. A low rail with capped end posts runs along the east bays' front
    (`kit_outer_road.low_rail_fence`).
  - **No writing.**
- **Tables and benches:**
  - `song_kit.table`: 14265, 14518, 14630, 14722, 14805, `long_table_15050`, 14830, 13970, 14067, 13615, 13315,
    `small_table_13368`, 13205, 13010, 12645, 12900, `table_tray_12845`;
  - `kit_inner_city.bench`: 14200, 14302, 14665, 14795, 14861, 13943, 13988, 13590, 13658, 13740, 13200, 12835;
  - `kit_inner_city.stool`: 14595, 14840, 14088, 13130.
- **new: chairs.** No kit has one. A wooden chair (`chair_14458`, the hat customer's seat), a chair with a slatted
  back (`chair_14788`), a round-backed chair (`chair_14028`) and a lattice-backed seat (`chair_13980`).
- Counters: `back_counter_13175` (with a cloth or goods) and `table_bowls_13275` (two bowls and a low stretcher).
  `kit_inner_city.counter` and `dishes`.
- `goods_table_13892` with `goods_heap_13925` (`kit_inner_city.goods_heap`) and `sacks_under_table_13890`
  (`song_kit.sack`).
- **new** `round_basket_13840`: a big round **shallow** basket, a sieve or winnowing tray about 80 px across, on a low
  stand. A flat variant of `round_basket`.
- **new** `stall_13480`: an open wooden two-tier stall stand on four legs, with a row of five or six round wares (pots,
  fruit or buns) on the upper tier and a big flat round tray heaped with goods below.
- **new** `goods_on_mat_13282`: the seated man's goods, a low dark mass of bowls, lids or small round baskets over a
  criss-cross face (a woven mat, a patterned cloth or a low slatted box). Compose it from `goods_heap`, `dishes` and a
  mat.
- **new**, small: `tray_12823`, a shallow oblong tray with raised ends on a table.
- `jug_12833`: `kit_inner_city.ewer`. `slatted_crate_12819`, `slatted_rack_12732`, `slatted_box_15078`:
  `kit_outer_road.slatted_box`. `small_box_14915`, `small_box_or_stool_14384`, `round_basket_or_drum_14795`: a box, a
  stool, a `round_basket`.
- **new** `counter_frame_12655`: a rectangular wooden frame or counter with a small cup or lamp hanging under its top
  bar.
- `barrel_12677`: a tall cylindrical container with hooped or woven lattice sides. `song_kit.cask`, or **new** as a
  tall woven basket.
- **new** `big_jar_12707`: a big earthenware jar (缸), a pale round belly with a straight rim. `kit_inner_city.pot` may
  scale up.
- **new** `funnel_vessel_12884`: a deep vessel wide at the rim and narrowing to a small bottom (a wash basin on a
  stand, a hopper or a deep sieve), on the official hall's floor at its front railing.
- `reed_mat_13870`: a tall reed mat screen leaning or hanging at a shop's west end. `kit_outer_road.bamboo_blind`.

**Shades and small structures:**
- **new** `thatch_shade_13049`: a long fan-shaped shade of palm thatch or ribbed matting, its ribs radiating from a
  narrow west end to a rounded east end, on a single post with a bracket.
- `round_canopy_14905`: a big round low-domed canopy with radiating ribs, its pole hidden by the roofs.
  `kit_inner_city.umbrella`.
- **new**, low: `slatted_frame_13320`, a small triangular frame of thin slats on an upright post between two roofs.
- **new** `bundle_heap_14680` and `bundle_heap_14970` (low): long, low, lens-shaped heaps of straw, reeds or firewood
  drawn with long parallel hatching, on the road behind the long hall's ridge. `song_kit.bundle_pile` stacks tiers,
  not a long heap.
- `S4b.str.reed_fence_15320` (low): a screen of close vertical poles or reeds. `kit_inner_city.slat_fence`.
- `S4b.str.bank_shed_14445` and `S4b.bld.mat_shed_15038`: open mat-roofed sheds on posts (the first with a
  post-and-brace frame under its east end). `kit_inner_city.mat_roof`.
- **new** `mooring_post_14737`: a short post with a rounded knob at the water's edge, with the big boat's two ropes
  tied to it. It is the fixed end of the boat kit's mooring lines (`world_points`).
- `bank_timber_15162` (low): a log along the bank's lip. A soft log from `song_kit.beam`.

**Buildings and roofs:**
- **The south-row hall type**, three here: `south_hall_gable_14340`, `south_hall_13920` and `south_hall_diagonal_15242`.
  Each ridge rises up to the right from a small south gable to a high north gable peak with a finial near the road, and
  the north barge descends to the right. The south gable has a hanging fish (`kit_outer_road.hanging_fish`), a tie beam
  and open-front posts. It is the same type as part 1's `S4.bld.south_hall_12350`: a request to lift that hall into a
  shared function if part 1's builder has it inline.
- `south_hall_13920` adds a **railed balcony or lattice screen across its south gable on two posts**.
- **new**, a roof detail: on `south_hall_long_14680`'s south slope, a small hatch with its own little ridge and a
  raised white box (a skylight). Its curled ridge-end ornaments are `song_kit.ridge_ornament`.
- Tile textures: **diamond-patterned tiles** (`far_roof_12930`, as part 1 asked), and **lattice-textured tiles or
  mat** (`south_hip_roof_13810`, `crowd_shop_13180`, the wheelwright's lean-to).
- `S4b.bld.shop_hall_13170`: the bays continuing `S4.bld.official_hall_12530`'s roof to a hipped east end at u 13385,
  with a dark valance band under the eave. **The builders join the two roofs.** Its signboard has about three short
  columns of illegible writing: `kit_inner_city.signboard` with an illegible atlas cell (□□□).
- `S4b.bld.top_shop_14224`: a narrow gateway frame with a lintel and a lattice transom. `kit_outer_road.gate_frame`.

## Set pieces

None of the named set pieces is in S4b (the Rainbow Bridge, 十千脚店's 彩楼欢门, the 望火楼, a thatched farmhouse, the
threshing floor). The palm-covered carts are a vehicle-kit variant. The tea house is the area's own building in
`kit_outer_road_2.py`.

## Trees: 13, by form (`trees/types.md`; all bare, early spring: the restyle leafs every willow, the scan doesn't)

- **`willow_fan`, 7:**
  - `willow_15468`: the seam willow by the moorings. Its massive knotted trunk forks into two leaders; a long, nearly
    level west limb runs over the road to the tea house; whips fan from the crown, and the crown reaches over S3's hall
    to about u 15720. Card `_1` (the great willow with a long west limb); `willow_burl` is the other reading of its
    bole.
  - `willow_head_14470`, `willow_head_14300`, `willow_head_14090`: whip fans from knobs whose trunks are hidden behind
    the tea house's roofs and the big elm. Any card; the lower trunk stays hidden.
  - `gnarled_13318`: a leaning knotted trunk rising from the crowd's back, forking into two limbs that each throw a fan
    of fine whips (the second pass). The west limb's dark twig clumps make `elm_claw` the other reading.
  - `far_bank_15308` (a thick trunk leaning north-east) and `far_bank_15230` (two short stems): faint, on the far bank
    at the top edge, cut by the silk. Far willow crowns, card `_3` for the twin stem.
- **`elm_claw`, 2:**
  - `forked_elm_14045`: a big two-stemmed elm at the tea house's west end. Its west stem leans far north-west over the
    wheelwright's shed to the top street, and its east stem rises. Card `_1` (a leaning west limb and an upright east
    limb).
  - `gnarled_13085`: a thick knotted dark trunk with crooked branches hung with dark twig clumps.
- **`slender`, 2:** `elm_twin_12921` and `elm_twin_12976`, a pair of tall straight bare trunks about 50 px apart,
  rising to the top of the silk with clusters of dark dotted buds on their upper branches. Card `_1` (dead straight).
- **`shoot_tree`, 1:** `young_tree_15275`, a young bare tree with upright budding twigs from the gap between two
  south-row roofs. Its slender stem arches north-east into the old willow's crown.
- **new form, 1:** `stump_14805` (conf low), a short, thick, gnarled trunk outlined in moss dots, hooking east to a dark
  knob, on the bank by the boats' bows. No crown, so it is a solid prop: better as a kit or Meshy stump than as a card.

## Also (not the workshop's list, for the lead)

- **The bird** perches in part 1's `S4.tree.willow_12588` (card `slender_3`, 9.97 m), at H 5.29. S4b's people.json
  places it, so it shows only when S4b is loaded. Alternatively the lead moves it to part 1's people.json as a seam
  note.
- **The gangplank** of the mat-cargo boat runs from the bank path at (14760, 402) to its bow at (14895, 463), and the
  porter walks it. It is the kit's walkable `line_gangplank`, with its bank end a `world_point` on the bank.
- **Lines across the seam:** two anchor lines end past u 15500 (at (15592, 584) and (15507, 511)), and the big boat's
  stern, sweep and after cabin reach u 15855. These are built by S4b, inside S3's painted range.
- **Seated on supports:** the cart's seated figure is on `cart bed` H 0.71, the roof man on `boat roof` H 1.39, and
  the tea house's customers on `tea house floor` H 0.18. Seated clips must take their seat from the furniture's real
  height.
- **Every boat in the row is crewless or has faint crew,** except the man on the big boat's roof and the stern
  boatman. People.json should not add crew.
