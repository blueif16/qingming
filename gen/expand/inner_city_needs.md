# Inner city (S6): what the workshop needs to make

From the S6 map (`map/text/S6.md`, `map/strokes/S6.json`), Run 1, 2026-10-11. Every figure, animal and vehicle below is a
map entity; IDs drop the `S6.fig.` / `S6.ani.` / `S6.veh.` prefix where the kind is clear. Crops are in scan px
`[u0, v0, u1, v1]`; the registered restyle `gen/sections/inner_city/mosaic.jpg` covers u 1856–5744 (as
`characters/<name>.json` crops use, figure section `inner_city`). Painted sizes: street adults 175–243 px, children
104–134 px, so painted figures are about 1.3× life as at the gate; things far up the silk are painted at about 0.6 of
that (see the frame's questions).

## Casting: 180 figures

All 180 painted figures are cast below: 130 with the existing eight characters and 50 with ten new ones (the archer
only if the lead agrees). The existing characters are cast by dress (`characters/notes.md`). The new ones are
requested where none of the eight fits the figure's dress, age or sex. Counts: child 11, child_robed 2, woman 1,
monk 2, bearer 7, storyteller 1, butcher 1, scholar 19, elder 5, archer 1; official 4, inspector 16, carter 12,
camel_driver 1, sightseer 20, townsman 32, idler 38, porter 7.

### New characters (requests)

- **child** (short jacket): model `boy_5050` (a boy in a short dark jacket and light trousers, arms stretched out, striding; full figure, 133 px), crop `[4989, 1163, 5103, 1318]`. It plays 11 children, each scaled to its painted height: boy_5050, child_on_shoulders_4977, boy_from_behind_4630 (pale knee-length jacket), child_3885, child_listener_3812, child_ring_edge_3577, servant_boy_bundle_3270, small_child_3035, child_by_dark_robe_2880, child_on_back_2795 and boy_short_jacket_2229.
- **child_robed** (a boy in a dark robe and dark cap): model `boy_dark_robe_2380` (watching with one hand at his chin; full figure, 129 px), crop `[2313, 1495, 2432, 1646]`. It plays boy_dark_robe_2380 and jie_child_2143. If one child character is preferred, `child` can play both.
- **woman** (the matchmaker): `sedan_passenger_4362` is the only woman painted in S6, and only her pale face and headdress show through the sedan's lattice window, crop `[4325, 1150, 4405, 1260]`. Take the full-figure dress from a woman in S7: 赵太丞家 (u ≈ 1480–1780) shows two women bringing children (S7 is not mapped yet, so the lead should pick the figure). She plays one figure here, seated in the sedan. `youth_hair_bun_stick_4950` may also be a young woman, but is cast as a youth (scholar) below.
- **monk**: model `itinerant_monk_2078` (行脚僧, pin 46: a shaven head, a belted robe and leggings, walking east under a tall wooden back-frame), crop `[2010, 985, 2160, 1258]` including the frame. It plays itinerant_monk_2078 and monk_3060 (a smiling monk in a long robe, standing). The back-frame is a carried prop (below).
- **bearer** (sedan bearer): model `sedan_bearer_far_4462` (a short belted jacket, trousers and a top-knot cap, striding east with the pole at his shoulder, in profile), crop `[4389, 1136, 4549, 1340]`. It plays all seven sedan bearers: sedan_bearer_far_4462, sedan_bearer_near_4530 and sedan_rear_bearer_4195 (west sedan); sedan_bearer_rear_near_4668, sedan_bearer_rear_far_4735, sedan_bearer_front_near_4907 and sedan_bearer_front_far_4943 (east sedan).
- **storyteller**: model `storyteller_3822` (闹市说书: bearded, dark headwear, the only figure facing out of the ring; hidden below the chest by the listeners), crop `[3744, 745, 3898, 958]`. He plays one figure. What he holds can't be read on this scan; the Palace Museum viewer may show it.
- **butcher**: model `butcher_3920` (bare-headed and pale, bent over his chopping block; only his head and shoulders are painted, faded), crop `[3864, 643, 3979, 800]`. He plays one figure. Below the counter the sheet has to be invented, so give him a plain jacket, an apron and trousers.
- **scholar** (a long white or pale robe and a soft black cap with ribbon ends): model `scholar_front_3240` (赶考士人, pin 44: a bearded scholar facing the viewer, hands in his sleeves; full figure, 222 px), crop `[3137, 926, 3329, 1170]`. It plays 19 figures: scholar_front_3240, scholar_back_3203, young_man_white_robe_4705, light_robe_2965, light_robe_behind_2650, ring_fan_cap_3688, cloth_shop_standing_3686, cloth_shop_seated_3640, seated_by_pole_2970, youth_hair_bun_stick_4950, the upper-storey drinkers (drinker_upper_5547, drinker_upper_5140, upper_storey_figure_4810, upper_standing_5452) and the pale-robed men in the 解 ring (jie_seated_back_2105, jie_young_seated_2100, jie_pale_cap_2175, jie_faded_pale_2245, jie_seated_tan_2283).
- **elder** (a white beard, a tall black hat and a light long robe): model `old_man_tall_hat_4666` (body partly behind others), crop `[4573, 855, 4763, 1110]`. He plays 5 figures: old_man_tall_hat_4666, the hooded old man at the back of the 解 ring (jie_old_man_2138, perhaps the fortune-teller), and the men in tall black hats (man_black_hat_4742, fan_man_3972 and tall_hat_robed_2441).
- **archer** (bare-backed soldier): `archer_waistguard_5465`, the third archer of the wine depot (seen from behind, behind the casks), plays one figure here. The better model is S5's `S5.fig.archer_drawing_bow_5635`. S5 cast its two archers as inspector and carter, so making this character means recasting them too: the lead's call. Without it, cast him as carter, like S5's archer_wrist_5728.

### Existing characters

- **official** (warm-grey robe, black futou; seated): shop_interior_seated_4752, scholar_upstairs_3912 (士子苦读, seated at the inn's window, hand to chin), seated_cap_man_3905, cloth_shop_seated_3752.
- **inspector** (indigo knee robe or dark jacket over white trousers): stooping_walker_4893, seated_man_highseat_4070, listener_purple_robe_3958, groom_whip_3452, young_man_case_3340, arms_folded_2993, dark_jacket_back_2848, cap_white_trousers_2765, dark_jacket_back_row_2737, dark_coat_2700, bending_man_2638, robed_back_2482, donkey_rider_2308 (rider), tall_hat_man_2285, leaning_over_awning_2168, jie_young_standing_2168.
- **carter** (ochre-brown robe, head-wrap: carters and drivers): crouching_dark_5515, dark_figure_5440, bearded_carter_5428, wagon_top_rider_3740, wagon_shaft_carter_3642, ring_bearded_robe_3630 (brown robe), upper_team_driver_3450, barrow_pusher_3390, handcart_man_3130, wine_cart_driver_2945, bearded_walker_2916, donkey_groom_jacket_2252.
- **camel_driver** (grey-blue tunic, indigo mantle): man_back_turned_4845, seen from behind in a dark cape over a long dark robe and a rounded banded hat.
- **sightseer** (blue robe, futou: robed gentlemen): rider_5335 (rider), young_man_4108, listener_hat_3932, listener_dark_robe_3926, listener_3905, ring_bending_hat_3748, ring_dark_robe_3692, ring_bending_3668, bearded_light_robe_3508, rider_3375 (rider), fan_man_3225 (便面), robed_hat_3002, tall_dark_robe_2908, bearded_light_robe_2730, robed_pointing_2528, robed_clasped_2420, robed_back_2405, jie_dark_robe_back_2242, jie_smiling_capped_2160, jie_listener_west_2062.
- **townsman** (slate-grey robe: the general townsman, and figures seen as a head only): head_behind_ridge_5103, capped_man_5090, doorman_5015, man_child_on_shoulders_4975, man_dark_robe_greeting_4772, basket_man_4590, sedan_attendant_4590, window_face_4155, man_by_boxes_4115, round_face_man_4092, shop_person_3991, listener_3878, robed_man_3808, ring_listener_3788, ring_standing_post_3745, ring_face_3735, ring_bun_3712, ridge_dark_robe_3575, dark_robe_reaching_3570, bowing_dark_robe_3470, top_edge_figure_3332, box_carrier_3272, garment_seller_3100, dark_robe_cap_3022, bearded_pouch_2949, stall_man_2890, top_edge_lower_body_2775, round_face_robe_2641, paper_stall_seller_2565, robed_man_2333, donkey_groom_pale_2200, crouching_dark_2028.
- **idler** (white or hemp short jacket and trousers, head-wrap: labourers, hands, water-drawers): walking_carter_5537, tall_carter_5385, groom_5290, man_hands_raised_5180, donkey_leader_5088, man_behind_stooping_4925, shop_interior_faint_4905, man_black_cap_from_behind_4878, seated_man_stool_4441, man_below_sedan_4343, sedan_attendant_4255, man_bending_tray_4190, youth_umbrella_4028, doorway_man_4026, man_red_jar_4005, listener_bag_3893, crouching_man_3890, light_jacket_man_3845, listener_3845, wagon_side_man_3796, ridge_reclining_3530, pointing_man_3405, lattice_frame_east_3180, lattice_frame_west_3092, white_jacket_stand_3072, man_behind_tree_3040, white_walker_2990, grey_back_2862, white_jacket_skirt_2795, man_carrying_child_2790, young_man_cart_rear_2675, kerchief_jacket_2606, young_man_walking_2570, pole_walker_2341, folded_arms_2338, well_bucket_hauler_2196, well_rope_drawer_2097, well_bucket_lifter_2032.
- **porter** (carriers with poles, trays and boxes): pole_man_5578, box_pole_porter_3745, box_shoulder_porter_3405, basket_porter_3370, tray_vendor_3050, porter_topknot_2605, porter_baskets_2588.

## Actions the existing clips can't show (one line each; who does it)

- **Carrying a sedan pole**: walking with the pole on one shoulder, both hands up on it and the body bent a little under the load. All seven bearers.
- **Shoulder-pole carry walk with hanging loads** (a real load, not 552's empty bend): porter_baskets_2588, porter_topknot_2605, basket_porter_3370, box_pole_porter_3745 (and S5's nine carriers).
- **Standing holding a carrying pole upright beside its set-down load**: pole_man_5578.
- **Walking bent under a back load**: the monk's back-frame (itinerant_monk_2078), box_carrier_3272 (a box stack on his back) and servant_boy_bundle_3270 (a bundle).
- **Telling a story**: standing (or seated) facing a crowd, leaning in, both hands gesturing, now and then pointing or slapping a palm. storyteller_3822.
- **Listening in a crowd, craning forward** (bent at the waist, looking at a point ahead): ring_bending_3668, ring_bending_hat_3748, and the ring's other listeners as a slower variant.
- **Walking with a round fan held up to screen the face** (便面): fan_man_3225.
- **Standing fanning oneself, fan beside the face**: fan_man_3972 and ring_fan_cap_3688.
- **Greeting bow with joined hands** (拱手, one bowing and one returning it): bowing_dark_robe_3470 and bearded_light_robe_3508, man_dark_robe_greeting_4772, robed_man_3808.
- **Drawing water with a rope**: bent over the well mouth, hand over hand. well_rope_drawer_2097.
- **Heaving a full bucket onto the shoulder**: well_bucket_lifter_2032.
- **Bent double lifting a bucket by its rope handle**: well_bucket_hauler_2196.
- **Chopping meat at a block with a cleaver**: butcher_3920.
- **Holding up a long garment to show it, turning it**: garment_seller_3100.
- **Seated drinking at a table**: leaning over the dishes, raising a cup. drinker_upper_5547, drinker_upper_5140, upper_storey_figure_4810.
- **Seated at a window, hand to chin, reading**: scholar_upstairs_3912.
- **Seated with the knees drawn up, hands round them**: seated_by_pole_2970, jie_smiling_capped_2160.
- **Seated on a bench listening, turned to a speaker**: the seated men of the 解 ring (jie_seated_back_2105, jie_young_seated_2100, jie_pale_cap_2175, jie_listener_west_2062, jie_seated_tan_2283), seated_man_stool_4441 and seated_cap_man_3905.
- **Seated in a sedan looking out**: sedan_passenger_4362.
- **Riding a horse or donkey**: rider_3375, rider_5335 and donkey_rider_2308. The workshop's `ride` should go to sightseer and inspector.
- **Seated on a cart, driving with reins and a raised whip**: wine_cart_driver_2945. **Seated on a wagon bed, looking about**: wagon_top_rider_3740.
- **Steering a wagon from between its shafts**: gripping a shaft in each hand, shouting, a whip forward over the team. wagon_shaft_carter_3642.
- **Driving a team from behind on long reins, leaning back**: upper_team_driver_3450.
- **Leading an animal by the bridle while walking** (the camel driver's lead_camel_walk on other rigs): donkey_leader_5088 and donkey_groom_pale_2200. **Standing at an animal's head holding the bridle**: groom_5290 and donkey_groom_jacket_2252.
- **Walking beside a horse with a long whip raised**: groom_whip_3452.
- **Pushing a barrow from between its handles**: handcart_man_3130 (check the carter's push 261 against the barrow). **Leaning over a barrow's bed**: barrow_pusher_3390. **Steadying a cart's rear with both hands**: young_man_cart_rear_2675.
- **Carrying a child on the shoulders**, hands holding its legs: man_child_on_shoulders_4975. **Walking with a child on the back**: man_carrying_child_2790. **A child sitting on shoulders with arms out, or riding on a back**: child_on_shoulders_4977 and child_on_back_2795.
- **A child running and playing with arms stretched out**: boy_5050.
- **A child clinging to an adult's waist**: child_by_dark_robe_2880.
- **Crouching or squatting**: crouching_man_3890, crouching_dark_2028 and crouching_dark_5515. **Reclining on the ground, propped on an elbow**: ridge_reclining_3530.
- **Bending over a tray, reaching into the goods**: man_bending_tray_4190. **Leaning over a low roof's edge with arms spread**: leaning_over_awning_2168.
- **Both hands raised to the head, adjusting a cap or a load**: man_hands_raised_5180.
- **Tying a waist guard or sash round the middle**: archer_waistguard_5465.
- **Standing with arms folded** (the idler's lean_wall_idle on other rigs): arms_folded_2993, tall_carter_5385 and folded_arms_2338.
- **Standing with one hand to the chin, watching**: tall_hat_man_2285 and boy_dark_robe_2380.
- **Handing money over, reaching to another's waist** (the carter's hand_over on other rigs): dark_coat_2700 and round_face_robe_2641.
- **Pointing ahead with an outstretched arm** (the inspector's point on other rigs): robed_pointing_2528 and pointing_man_3405.
- **Holding a long tray across the waist**: tray_vendor_3050.
- **Two men walking under one umbrella, a pole between them at shoulder height**: youth_umbrella_4028 and round_face_man_4092.
- **A stall keeper behind a table arranging goods**: paper_stall_seller_2565.
- **Two men lifting a long frame between them**: lattice_frame_west_3092 and lattice_frame_east_3180 (far, at the top of the silk).

## Animals (19)

Map lengths from fore and hind hooves come out short (0.5–1.3 m), because the animals are foreshortened and turned
and their hooves are partly estimated. Use real sizes, centred on the map position.

- **donkey** `donkey_team_near_5270`: brown-grey, standing with its head lowered almost to the ground, in the sack cart's team (wheel pair, near side); bridle, breast harness, slack traces to the cart. Faces W.
- **donkey** `donkey_team_dark_5300`: dark, in the sack cart's team (wheel pair, beside the near one); head up, bridle with a bit ring. Faces W.
- **donkey** `donkey_team_pale_5285`: light coat, far (north) side of the sack cart's team; harness with a tasselled strap. Faces W.
- **donkey** `donkey_door_5150`: dark with a pale muzzle, head lowered, standing at the 正店's door; led by donkey_leader_5088 on a rope (probably the team's lead; no harness clearly drawn). Faces W.
- **donkey** `donkey_head_down_5565`: grey-brown, standing with its back up and its head lowered, by the wine depot; no load. The second pack donkey of S5's pack train. Faces SW.
- **donkey** `donkey_wine_cart_3191`: lighter, near side of the wine cart's pair, slightly ahead, head stretched east with ears back, a foreleg stepping; traces and breast strap. Faces E.
- **donkey** `donkey_wine_cart_3105`: dark, far side of the wine cart's pair, ears up; collar and breeching (the shaft line runs to its shoulder). Faces E.
- **donkey** `donkey_2285`: dark (or a small horse), seen from behind-left, walking away NW into the crowd; ridden by donkey_rider_2308, with donkey_groom_pale_2200 holding its head and donkey_groom_jacket_2252 at its shoulder.
- **horse** `horse_3445`: dark, seen from behind, walking away NE, tail hanging; saddle with a crupper strap, the rider's boots in stirrups; ridden by rider_3375, with groom_whip_3452 beside it.
- **horse** `horse_5262`: dark, head lowered to the W, bridle (could be a mule); ridden by rider_5335, with groom_5290 at its head. Only the head, neck and back show over the south-side ridge.
- **mule** `mule_lower_1_3427`: grey-brown lead mule of the big wagon's team (front left), walking WSW, head up, ears pricked, mouth open (braying); collar and traces.
- **mule** `mule_lower_2_3462`: front right of the big wagon's team, walking W, head lowered; collar and traces.
- **mule** `mule_lower_3_3498`: in the rear pair of the big wagon's team, head low among the others, walking W.
- **mule** `mule_lower_shaft_3560`: big shaft mule between the wagon's shafts, head lowered and turned W; breeching strap, tail hanging. Faces WSW.
- **mule** `mule_upper_1_3585`: brown, at the rear of the second (hidden) wagon's team, nearest its driver, walking E with its head down; traces run back W to the hidden wagon.
- **mule** `mule_upper_2_3620`: second (hidden) wagon's team, walking E, head lowered.
- **mule** `mule_upper_3_3655`: second (hidden) wagon's team, walking E, head down.
- **mule** `mule_upper_lead_3690`: darker lead mule of the second team, head raised high, ears pricked, walking E; collar and harness.
- **dog** `dog_4335` (low confidence): a small dark animal walking W under the south-side parasol. The restyle paints a bending man here instead.

## Vehicles (8)

Each item gives the workshop kit function that fits, where one exists. Sizes in metres are the map's.

- **sack cart** `sack_cart_5412` (kit `sack_cart`):
  - big two-wheeled cart piled high with big round roped sacks;
  - one big spoked wheel shows on the near side: painted ~200 px across, hub (5608, 1048), ground contact (5598, 1147);
  - drawn W by donkeys on long slack traces: the wheel pair near_5270 and dark_5300, pale_5285 on the far side, and door_5150 as the lead;
  - pushed from behind by S5's `S5.fig.cart_pusher_5727`; carters tall_carter_5385, bearded_carter_5428, dark_figure_5440 and walking_carter_5537;
  - shafts not clearly drawn;
  - front (5412, 1110) est, rear (5705, 1138) est (in S5's range): 4.2 m;
  - prop sticks under its front, (5440, 1133) to (5480, 1062), and under its rear, at about u 5640–5660, are part of the cart.
- **sedan chair** `sedan_4575` (kit `sedan_chair`):
  - curved roof with its eaves turned up at both ends, over a tall box;
  - a lattice window on the south side (the woman looks out of it), a decorated panel east of it, and an open, ladder-like frame at the west end;
  - carried E on two long poles: bearers far_4462 and near_4530 at the front, rear_bearer_4195 behind, with attendants 4590 and 4255 and man_below_sedan_4343;
  - painted box 137 px wide and 242 px tall with its roof;
  - front (4575, 1358) est, rear (4152, 1350) est: 5.55 m of pole.
- **sedan chair** `sedan_4965` (kit `sedan_chair`):
  - dark rounded roof with upturned eave tips, a box seen corner-on with an X-braced rear (west) end, and a lattice-windowed south side;
  - no passenger shows;
  - four bearers, two at each end, carrying it E (facing 15°);
  - painted box 123 px across and 247 px tall;
  - front (4965, 1345) est, rear (4628, 1370) est: 4.0 m.
- **four-mule wagon** `taiping_wagon_3600` (太平车, kit `mule_wagon`):
  - box body with high plank sides and a rear rack of rails with a hanging rope; one big spoked wheel shows, a tall ellipse 170 px high, contact (3783, 506);
  - swinging SW out of the cross street onto the main street;
  - team of four mules: lead pair lower_1_3427 and lower_2_3462, then lower_3_3498 and shaft mule lower_shaft_3560 between the shafts;
  - wagon_shaft_carter_3642 steers between the shafts, wagon_top_rider_3740 sits on the front of the bed, wagon_side_man_3796 walks by the wheel;
  - front (3600, 555) est, rear (3855, 470) est: 2.56 m on the map. The wagon is turning and receding; its body is about 270 px of u, so build its true length (choice:).
- **hidden wagon** `hidden_wagon_3400`:
  - only its four-mule team (upper_1–3, upper_lead), its driver (upper_team_driver_3450) and the traces running back W under the incense shop's lean-to roof are painted; the body is hidden;
  - front (3400, 345) est, rear (3220, 335) est (guessed);
  - build the harness and traces to the roof's edge and leave the body behind the roof, or out: the lead's call.
- **barrow** `barrow_casks_3300` (串车 or a two-wheeled handcart; the barrow kit, without the script sheet):
  - one big spoked wheel under the middle, drawn round (76–85 px), hub (3215, 645);
  - lattice sides heaped with large round dark bundles (or casks) lashed with ropes, and a raised front rack with hooks at its E end;
  - pushed E by handcart_man_3130 between its handles at the W end;
  - front (3300, 685) est, rear (3150, 695) est: 1.7 m.
- **small wheelbarrow** `barrow_top_3340` (barrow kit):
  - one spoked wheel under its front half (52 px; painted small at the back of the silk);
  - slatted bed with a pointed front facing W, and two handles with a pair of rear legs at the E end;
  - empty, parked; barrow_pusher_3390 leans over it;
  - front (3275, 128) est, rear (3410, 122) est: 1.5 m.
- **wine-cask cart** `wine_cart_3090` (kit `cask_cart`):
  - heavy frame carrying two big lidded wine casks side by side (a knob on each lid, lids ~135 px across), with a wicker basket hung at the rear;
  - one big spoked wheel near the front: painted 230 px tall, hub (2890, 1547), contact (2892, 1690);
  - drawn E by a donkey pair (3105 far, 3191 near), with wine_cart_driver_2945 seated at the front with a whip and young_man_cart_rear_2675 steadying the rear;
  - a curved frame and a post reach the ground under the rear at (2748, 1685): a rear prop or a small rear wheel, unclear;
  - turning NE; front (3090, 1482) est, rear (2700, 1682) est: 4.6 m.

## Props carried by figures

- **Shoulder poles with loads**:
  - porter_baskets_2588: two big round woven baskets, the west one heaped with goods, about 75 px across;
  - porter_topknot_2605: a tall cylindrical woven basket at the west end;
  - basket_porter_3370: two deep round baskets, the east one heaped with a pale load;
  - box_pole_porter_3745: two tall square boxes or cages;
  - pole_man_5578: a bare pole. Its load (about five upright sticks and a round flat object) stands on the ground in S5's range and needs an S5 entity.
- **The monk's back-frame (笈)**: a tall wooden frame piled with bundles, topped by a small canopy hung with a lantern box, gourds and tassels, plus a staff with a hooked top (itinerant_monk_2078).
- **On the back**:
  - box_carrier_3272: a tall banded box (a stack of lidded food boxes) on a strap;
  - servant_boy_bundle_3270: a bundle.
- **On the shoulder or in the hand**:
  - box_shoulder_porter_3405: a long flat box on the shoulder;
  - young_man_case_3340: a long dark case held upright;
  - tray_vendor_3050: a long flat tray with a small lattice box at its east end.
- **Fans**:
  - fan_man_3225: a round dark fan held up to the face;
  - fan_man_3972: a round dark fan beside the face;
  - ring_fan_cap_3688: a dark folding fan, or a board.
- **Whips**: groom_whip_3452 (long and curved), wagon_shaft_carter_3642 and wine_cart_driver_2945 (long, with reins).
- **Poles and sticks**:
  - pole_walker_2341: a long thin pole held upright;
  - capped_man_5090: a long pole held slanting;
  - youth_hair_bun_stick_4950: a long upright stick.
- **Buckets and well gear**:
  - well_bucket_lifter_2032: a full round wooden bucket on the shoulder;
  - well_bucket_hauler_2196: a wooden bucket with a knotted rope handle;
  - well_rope_drawer_2097: the well rope.
- **Small things in the hand**:
  - garment_seller_3100: a long garment;
  - man_red_jar_4005: a small red-rimmed jar;
  - seated_man_stool_4441: a small round cup or fruit;
  - old_man_tall_hat_4666: a dark bristly bundle (greens, a bird or a brush);
  - bearded_walker_2916: a small fan or whisk, with a bag at his side.
- **Bags and pouches at the hip**: listener_bag_3893, bearded_pouch_2949, young_man_walking_2570, doorway_man_4026, and boy_short_jacket_2229 (a long dark cloth).
- **Umbrella**: youth_umbrella_4028 and round_face_man_4092 under one wide dark open umbrella, with a pole between them. It may instead be a broad hat with a carried pole.
- **Lead ropes and reins**: donkey_leader_5088, donkey_groom_pale_2200 and upper_team_driver_3450.
- **Waist guard or sash**: archer_waistguard_5465.

## Kit parts the buildings need that `song_kit.py` lacks

- **Two-storey hall**: an upper storey set back behind a balustrade over a pent roof (腰檐), lattice windows and open bays upstairs, and a big hip-gable roof with a rolled ridge and curled ornaments. For 孙羊正店 (upper floor 4.5 m, assumed) and the inn 久住王员外家 (3.4 m, with window bays and a small railed balcony).
- **彩楼欢门 (flowered scaffold gateway)**: lashed poles with flower-bunch and pointed, flagged tops, streamers, a lattice of cross-bars with V-braces, round lanterns on posts and a cube lantern. One across the 正店's whole front (S6.str.cailou_huanmen_4430, about 9.4 m tall) and a smaller pole scaffold on the incense shop's east front (S6.str.cailou_incense_2895, 4–6 m).
- **栀子灯**: a reddish gourd-shaped lamp on a low box stand (S6.prop.gardenia_lamp_4422, _5055, _5327; 125 px tall).
- **Lamp-boxes**: a box lamp under a small cap, with characters on its faces (正店, 孫□, 香□; 71 × 110 px).
- **Signboards with characters** (the characters as painted, from the map):
  - on their own posts or frames: 劉家上色沉檀揀(香); 久住 / 王員外家 (a small two-character cell on top); □錦疋帛 with 鋪 in a lower box; □□□香□□ on two posts under a mat sunshade; the tall stele-like board behind the south ridge (□□□); the 子 sign by the cart wheel; the red-lacquered board with no characters;
  - hung on buildings: 楊家應症 on the clinic's corner post; the corner shop's small eave sign; six one-character square plaques along the cloth shop's eave.
- **The 解 board**: a tall triangular A-frame board leaning against the corner building's eave, with a small framed plaque reading 解 hung on it from a bar.
- **A cloth banner on a slanting pole**: 孫羊店, white with a dark border.
- **The square well**: a low wooden curb with a 田-shaped plank cover on a wide plank platform (curb 2.3 × 1.6 m on the map), and the tall pole at its east end.
- **Big stall umbrellas and parasols**: the paper-horse stall's three, the butcher's tilted parasol, the south parasol and the two low umbrellas, 207–322 px across.
- **Awnings**:
  - a flat woven-mat awning on posts (over the 解 ring, tied into the S7 building at its west end);
  - a pale cloth awning on one post (S6.prop.mat_roof_2800);
  - a flat mat sunshade resting on a signboard;
  - the incense shop's dark matted lean-to roof (part of the building).
- **Slatted barrier fences**: close-set vertical slats under a top rail, about 1.5 m as painted (the 正店's three stretches).
- **Stall furniture**:
  - tables, counters and benches: long trestle tables (the paper stall's, the shed's two), counters (the cloth shop's two, the corner shop's meat counter), benches and a low bench, a low table;
  - stands and seats: oval trays on crossed-leg folding stands (three), a tall chair, a stool, three tripod stands with knobs, capped poles;
  - stores and frames: a lattice cabinet or rack, a long lattice frame, a folding stand, a slanted dotted board on a frame;
  - butcher's things: a thick chopping block, a side of pork on a hook, a pot;
  - containers: a tub with a bundle of upright sticks, a net bag, a domed basket, big round woven baskets (two at the 正店's door, one north of the inn), a stack of flat boxes.
- **Goods**:
  - paper offerings for burning: paper figures with arms out or with a hat, a tiered paper tower, a tray of small paper goods;
  - stall goods: trays of goods on the stands, pork pieces;
  - on the 正店's upper table: dishes and a wine ewer;
  - on the scholar's desk: a lamp, books and a slanted frame.
- **Fence**: a low board fence among the bamboo at the top-left (S6.str.fence_far_2000).
- **Roof details**: hanging-fish boards (懸魚) on hip-gable gables (the inn's west gable) and curled ridge-end ornaments. Check what `gable_roof` and `ridge_ornament` already do.

## Clips: what is still wanted (Run 2, after the workshop's delivery)

All ten new characters are delivered (`web/public/assets/chars/characters.json`), so people.json casts them with no
stand-ins. `make_people.py` maps each requested action to the nearest clip the character has (its ALIAS table) and
writes what is still wanted to `people.json` `clips_why`. Rerun it when clips land.

- **Covered by a near clip** (no work needed unless the workshop wants the exact action):
  - carry_pole → sedan_carry (bearer ×7);
  - steer_wagon → steer (carter);
  - tie_sash → bind (archer);
  - hand_chin → chin (child_robed, inspector);
  - heave_bucket, lift_bucket, lift → bucket_lift (idler);
  - hold_bridle → bridle (carter, idler) or lead (townsman);
  - tend_stall → browse (townsman);
  - cling → reach (child);
  - sit_floor → knees_up (scholar, sightseer);
  - listen_lean → crane (sightseer);
  - talk → chat (idler, sightseer);
  - point → tell (storyteller);
  - sit_talk → sit (scholar ×6, elder, carter);
  - adjust_cap → tie_kerchief (idler);
  - lie → crouch (idler, the man on the ridge).
- **Still playing idle** (wanted):
  - **sit** for idler and inspector: three seated figures were recast to the carter and the official until then
    (`cast_why`);
  - **look** for idler ×13, inspector ×8, scholar ×7, child ×3, elder ×2, carter ×2, child_robed (a standing glance
    round, like the townsman's look 336);
  - **listen** for carter and child (the scholar's and elder's listen);
  - **talk** for elder, monk and porter;
  - **bow** for the camel driver (the man with his back turned greeting, 4845);
  - **bend_goods** for the inspector (the man bent double with his hands at his knees, 2638);
  - **lean_over** for the inspector (hands on the mat awning's back edge, 2168);
  - **carry_child** for the townsman (child on his shoulders, 4975) and the idler (child on his back, 2790), with a
    carrier prop each (child_on_shoulders, child_on_back), as the woman's child_in_arms;
  - **hold_tray** for the porter (a long flat tray across his waist, 3050), with a tray prop;
  - **hold_whip** (inspector, groom 3452) and **stand_whip** (carter, the wine cart's driver 2945): a whip held up in
    a standing clip.
- **Props still wanted** (people.json `props_why.wanted`): a staff for the scholar (4950), the long flat box carried on
  the shoulder (porter 3405, with a carry walk that holds it), the tray above, the whips above.
- **Children** are scaled on the child models: painted fraction of an adult × 1.70 m / the model's height_m
  (`scale_why`).
- **dog**: delivered; dog_4335 walks its painted line under the parasol (people.json `animals.dog_4335.path`).

**Update, 2026-10-12 (the workshop's last batch):** everything under "Still playing idle" was delivered and is cast:
sit (idler, inspector), look, listen, talk, bow, bend_goods, lean_over, carry_child with the two carrier props,
hold_tray with the tray, shoulder_box with the box, hold_whip with whip_hold, the scholar's staff. The vehicle kit
seats the two drivers. `people.json` `clips_why` now lists only nearest-clip stand-ins (none play idle).
