# Round 2 catalogue: what the factories make for S7, S4b, S3, S2 and S1

The catalogue agent, 2026-10-12. It merges the five needs lists (`gen/expand/city_end_needs.md`,
`outer_road_2_needs.md`, `rainbow_bridge_needs.md`, `canal_needs.md`, `countryside_needs.md`), deduplicated, against the
registries as they stand: 22 characters (`web/public/assets/chars/characters.json`), 61 takes (`characters/motions.json`),
23 carried props (`characters/props.json`, `gen/props/`), 9 animals (`web/public/assets/animals/animals.json`), 32 tree
cards (`trees/cards.json`), the vehicle kit (`blender/kit_vehicles.py`) and the boat kit (`blender/kit_boats.py`,
`gen/boats/types.md`). Figure counts come from the needs lists, checked by script against `map/strokes/<S>.json`.

## The two numbers

- **The account in use (`msy_B7y3`, 151 credits, checked with `tools/meshy_key.sh status`) buys paid items 1–9, 11
  and 12: 150 credits, 1 spare.** That is the boatman and the grain porter, eight takes, and one retake allowance.
  Item 10 (the straw-hat labourer, 30) doesn't fit in the 21 credits left after item 9, so it starts the next account.
- **The rest of the list needs 545 credits more** (a second account of at least 555 keeps about 10 spare).
  - **310** of the 545 buys everything the areas did not mark optional: 7 more characters, 8 takes and their retakes.
  - **235** is the optional tail: 16 single-figure takes the areas marked optional, their retakes, a pale-robed woman,
    and a buffalo body if the free one doesn't read.
- The whole list is 695 credits: 10 new characters (300), 32 takes (320), 3 retake allowances (60) and 1 conditional
  animal body (15).

**How the list is ordered:** by credits per painted figure served, as the lead asked.
- Free work comes first (section 2).
- Then every paid item, cheapest per figure first. On a tie, a take goes before a character, because one take serves
  every character.
- The prices are about 30 per character, 10 per take and 15 per animal body. About one take in six needs a second take
  (`characters` skill), so a retake allowance of about 10 per six takes follows each block of takes (items 8, 27,
  44).

Accounts:
- Every character is made whole in one account. Switch keys between characters, never inside one (skill `characters`,
  Accounts).
- A take can be made in either account. Every character gets it free through `t2m:<take>@<account>`.

## 1. The spend list

### 1a. The paid list, ranked

"Figures" counts the painted figures the item serves; "cr/fig" is credits per figure. The interim stand-in is what
plays those figures today. The details of each item are in 1b and 1c.

| # | item | kind | cr | cumulative | figures (S7 / S4b / S3 / S2 / S1) | cr/fig | model figure (scan crop) |
|---|---|---|---|---|---|---|---|
| 1 | **boatman** | character | 30 | 30 | 76 (– / 3 / 35 / 38 / –) | 0.4 | `S2.fig.sweepman_upright_22168` [22100, 805, 22205, 985] |
| 2 | `work_sweep` | take | 10 | 40 | 12 (– / – / 6 / 6 / –) | 0.8 | `S2.fig.sweepman_leaning_back_22110` [22055, 816, 22127, 995]; crew [22040, 800, 22320, 1000] |
| 3 | `reach_over_rail` | take | 10 | 50 | 11 (– / – / 10 / 1 / –) | 0.9 | `S3.fig.man_bent_over_railing_19195` [19164, 273, 19211, 439] |
| 4 | `tow_walk` | take | 10 | 60 | 10 (– / – / 5 / 5 / –) | 1.0 | `S2.fig.tracker_bent_21939` [21903, 163, 21954, 273] |
| 5 | `sack_carry` | take | 10 | 70 | 10 (– / – / 3 / 7 / –) | 1.0 | `S2.fig.bank_porter_28355` [28338, 1067, 28392, 1246] |
| 6 | `pole_boat` | take | 10 | 80 | 7 (– / – / 6 / 1 / –) | 1.4 | `S3.fig.boatman_bending_pole_19746` [19727, 633, 19761, 748] |
| 7 | `fend_pole` | take | 10 | 90 | 8 (– / 1 / 4 / 3 / –) | 1.3 | `S3.fig.boatman_both_arms_pole_19840` [19815, 450, 19855, 602] |
| 8 | retake allowance | – | 10 | 100 | – | – | spent on the first take whose frame sheet fails; if none fails, it buys item 13 |
| 9 | **grain_porter** | character | 30 | 130 | 15 (– / 5 / 2 / 8 / –) | 2.0 | `S4b.fig.porter_pole_bundle_13537` [13488, 517, 13581, 695] |
| 10 | **straw_hat** | character | 30 | *(next account)* | 13 (– / 1 / 3 / 6 / 3) | 2.3 | `S3.fig.porter_straw_hat_17762` [17689, 1511, 17803, 1729] |
| 11 | `haul_line` | take | 10 | 140 | 3 (– / – / 2 / 1 / –) | 3.3 | `S3.fig.bearded_barrow_man_18098` [18049, 1297, 18117, 1497] |
| 12 | `chase_run` | take | 10 | **150** | 3 (– / – / – / – / 3) | 3.3 | `S1.fig.groom_chasing_30697` [30647, 556, 30712, 699] |
| | **151 runs out here** | | | **150 + 1 spare** | | | |
| 10 | **straw_hat** (first on the new account) | character | 30 | 30 | 13 | 2.3 | as above |
| 13 | `drive_donkeys` | take | 10 | 40 | 3 (– / – / 1 / – / 2) | 3.3 | `S1.fig.charcoal_driver_36797` [36780, 816, 36812, 940]; train [36230, 680, 36870, 960] |
| 14 | **dark_hat** | character | 30 | 70 | 9 (2 / – / 6 / 1 / –) | 3.3 | `S7.fig.porter_baskets_1255` [1206, 1051, 1309, 1248] |
| 15 | **tracker** | character | 30 | 100 | 9 (– / – / 5 / 4 / –) | 3.3 | `S2.fig.tracker_rear_22172` [22134, 283, 22190, 390] |
| 16 | **farmer** | character | 30 | 130 | 9 (– / – / – / – / 9) | 3.3 | `S1.fig.man_with_stick_29205` [29162, 941, 29246, 1102] |
| 17 | **groom** | character | 30 | 160 | 7 (2 / – / 2 / – / 3) | 4.3 | `S7.fig.groom_1698` [1637, 1069, 1751, 1287] |
| 18 | `wave_arms` | take | 10 | 170 | 2 (– / – / 2 / – / –) | 5 | `S3.fig.man_waving_on_boat_roof_19952` [19895, 925, 20010, 1110] |
| 19 | `sit_offer` | take | 10 | 180 | 2 (– / 1 / – / 1 / –) | 5 | `S4b.fig.seated_man_13240` [13213, 499, 13255, 615] |
| 20 | `lie_wave` | take | 10 | 190 | 2 (– / – / 1 / 1 / –) | 5 | `S3.fig.man_reclining_waving_20060` [20025, 1041, 20075, 1103] |
| 21 | **youth** | character | 30 | 220 | 5 (– / 1 / 2 / 2 / –) | 6 | `S3.fig.youth_round_face_18643` [18610, 358, 18670, 473] |
| 22 | **official_rider** | character | 30 | 250 | 3 (1 / 2 / – / – / –) | 10 (the scroll's closing figure) | `S7.fig.official_rider_1610` [1550, 975, 1680, 1215] |
| 23 | `hammer_rim` | take | 10 | 260 | 1 (S4b, 车铺劳作) | 10 | `S4b.fig.wheelwright_bending_13620` [13570, 624, 13635, 772] |
| 24 | `examine_child` | take | 10 | 270 | 1 (S7, 赵太丞家) | 10 | `S7.fig.doctor_dark_robe_1615` [1587, 718, 1634, 921] |
| 25 | `sit_hold_child` | take | 10 | 280 | 1 (S7, 赵太丞家) | 10 | `S7.fig.seated_woman_child_1535` [1503, 723, 1553, 909] |
| 26 | `point_way` | take | 10 | 290 | 1 (S7) | 10 | `S7.fig.pointing_man_1370` [1343, 735, 1392, 966] |
| 27 | retake allowance | – | 20 | **310** | – | – | for items 13–26; any unspent part goes to the tail |
| | **end of the core; the optional tail follows** | | | | | | |
| 28 | `sit_point` | take | 10 | 320 | 1 (S2, 私粮进京's grain owner) | 10 | `S2.fig.grain_owner_28045` [28025, 770, 28060, 930] |
| 29 | `hold_horse_neck` | take | 10 | 330 | 1 (S3, 车轿相争) | 10 | `S3.fig.groom_holding_horse_19095` [19080, 223, 19110, 340] |
| 30 | `lunge_arms_wide` | take | 10 | 340 | 1 (S3, 车轿相争) | 10 | `S3.fig.man_arms_flung_wide_18990` [18957, 262, 19005, 365] |
| 31 | `pour_bucket` | take | 10 | 350 | 1 (S2) | 10 | `S2.fig.boatman_pouring_bucket_22665` [22600, 1535, 22680, 1620] |
| 32 | `climb_ladder` | take | 10 | 360 | 1 (S2) | 10 | `S2.fig.boatman_on_ladder_23275` [23257, 604, 23293, 727] |
| 33 | `stand_sleeves` | take | 10 | 370 | 1 (S1) | 10 | `S1.fig.farmer_by_hedge_34472` [34435, 749, 34508, 891] |
| 34 | `beckon_lean` | take | 10 | 380 | 1 (S1) | 10 | `S1.fig.man_at_post_29812` [29794, 947, 29836, 1135] |
| 35 | `lean_over_seated` | take | 10 | 390 | 1 (S2) | 10 | `S2.fig.man_leaning_over_donkey_29000` [28973, 511, 29015, 662] |
| 36 | `look_up` | take | 10 | 400 | 1 (S4b) | 10 | `S4b.fig.man_looking_up_13755` [13729, 1135, 13774, 1338] |
| 37 | `tighten_girth` | take | 10 | 410 | 1 (S4b) | 10 | `S4b.fig.man_bowed_at_horse_13410` [13382, 939, 13428, 1126] |
| 38 | `knee_on_stool` | take | 10 | 420 | 1 (S4b) | 10 | `S4b.fig.customer_white_14560` [14542, 1030, 14577, 1196] |
| 39 | `rest_load_stick` | take | 10 | 430 | 1 (S4b, conf low) | 10 | `S4b.fig.porter_tall_load_13402` [13369, 677, 13421, 874] |
| 40 | `seated_tiller` | take | 10 | 440 | 1 (S4b) | 10 | `S4b.fig.seated_boatman_stern_15372` [15356, 482, 15387, 550] |
| 41 | `floor_write` | take | 10 | 450 | 1 (S4b) | 10 | `S4b.fig.official_seated_12728` [12705, 837, 12743, 927] |
| 42 | `lean_post_talk` | take | 10 | 460 | 1 (S7) | 10 | `S7.fig.man_at_post_1118` [1098, 726, 1152, 938] |
| 43 | `walk_hold_chest` | take | 10 | 470 | 1 (S7) | 10 | `S7.fig.bundle_man_1976` [1935, 1094, 2024, 1265] |
| 44 | retake allowance | – | 30 | 500 | – | – | for items 28–43 |
| 45 | **woman_pale** | character | 30 | 530 | 2 (2 / – / – / – / –) | 15 | `S7.fig.standing_woman_1567` [1545, 712, 1595, 895] |
| 46 | buffalo body | animal body | 15 | **545** | 1 (S1) | 15 | `S1.ani.water_buffalo_lying_29462` [29350, 670, 29505, 795]; **only if** the free ox-body buffalo (2c) doesn't read |

Dropped as separate takes, because an item above already covers them:
- `throw_rope` (S3 `deck_youth_rope_19445`) and `serve_bowl` (S2 `tub_vendor_27765`) are counted in items 3 and 19;
- `raise_pole` (S2 `pennant_pole_holder_27810`) and S4b's `reach_up` (`porter_at_cart_rear_13090`, arms raised to a
  cart's load) both play `fend_pole`;
- `lie_prop` (S2 `passenger_reclining_on_cargo_22848`) is in `lie_wave`.

### 1b. The new characters

Every model is a figure on the scan.
- Crop with `"src": "scan"`: the S3, S2 and S1 restyles redraw these figures, and S7's restyle gave the pointing man a
  bun. Read the crop with `node tools/scroll_inspect.mjs <folder> <u> <v> <half>` before the sheet.
- Ask the sheet for a standing figure in the painted dress. Give `idle` free with `from:townsman/idle`, not a 3-credit
  library fetch, so each character costs only its mesh (about 30).
- Each gets the free clips listed with it, and every take whose figures it plays.
- Painted heights are in scan px; the street's adults are about 150–200 px.

**1. boatman** (76 figures; 30 credits). Model `S2.fig.sweepman_upright_22168` [22100, 805, 22205, 985]: 155 px, face on,
tall and round-faced, a dark hair band or cap, a long light jacket.
- Dress refs:
  - `S2.fig.sweepman_leaning_on_loom_22285` [22231, 834, 22308, 981]: a cap, a short jacket belted at the waist,
    rolled sleeves;
  - `S3.fig.man_waving_on_boat_roof_19952` [19895, 925, 20010, 1110]: the back view, 155 px; a knotted head-cloth, a
    short jacket belted over a wrapped apron or kilt, trousers, bare shins;
  - `S3.fig.boatman_capped_19800` [19760, 465, 19850, 615]: a small cap and a long pleated apron.
- **Why the stand-ins are wrong:** the crews are played by the idler (36), the porter (27), the carter (11), the
  butcher and the townsman.
  - Those are town labourers in hemp jackets and indigo trousers, and the carter wears an ochre robe. The crews wear the
    belted jacket over a wrapped kilt or apron, with a head-cloth.
  - With 19 crew on one boat (S3's 大船抢险) and 11 on 逆水行舟, three bodies repeat visibly.
- Plays every `[boatman]` crew of the needs lists, except six whose painted dress differs and keep their cast:
  - S2 `bowman_under_hood_23660`: a long robe (robed_man);
  - S2 `boatman_seated_open_boat_22060` and `sweepman_capped_22208`: dark coats (inspector);
  - S2 `crouching_figure_open_boat_22175` (carter) and `figure_stern_roof_24622` (camel_driver): both low;
  - S2 `bank_man_with_stick_25370`: a robe, on the bank (carter).
- S3's `boatman_hat_pole_19915` wears a hat and goes to the straw-hat labourer.
- The figures:
  - S3 (35): boatman_stern_bending_20365, boatman_stern_seated_20285, man_in_hatch_20172, man_reclining_waving_20060,
    boatman_crouching_20026, boatman_under_mat_roof_19955, man_waving_on_boat_roof_19952, boatman_both_arms_pole_19840,
    boatman_bending_pole_19746, boatman_leaning_on_bundle_19650, bowman_arm_out_19565, awning_boatman_17435,
    boatman_poling_16198, boatman_on_cargo_16032, sweep_man_15915, sweep_man_15855, sweep_man_15810, boatman_bow_15664,
    boatman_cabin_door_pole_20300, man_in_hatch_20148, boatman_under_mat_roof_19970, boatman_standing_pole_19892,
    boatman_bent_pole_19830, boatman_reaching_19681, bowman_arm_out_19583, boatman_on_cargo_15998, sweep_man_15888,
    sweep_man_15838, boatman_bow_15688, boatman_bow_15636, boatman_hauling_rope_20205, boatman_pole_raised_19775,
    boatman_poling_bow_19632, sweep_man_15862, boatman_capped_19800.
  - S2 (38): boatman_pole_20495, boatman_standing_20615, boatman_on_roof_20683, man_cabin_door_20877,
    man_cabin_window_21333, sweepman_leaning_back_22110, sweepman_leaning_on_loom_22285, boatman_pouring_bucket_22665,
    boatman_fending_off_23688, man_bow_arm_out_23795, boatman_roof_leaning_24030, crewman_crouching_white_24067,
    boatman_hauling_mast_24140, man_seated_deckhouse_24393, boatman_roof_seated_24478, figure_under_canopy_25518,
    boatman_roof_26290, boatman_leaning_20558, boatman_far_deck_21505, sweepman_head_back_22132, sweepman_capped_22242,
    boatman_on_ladder_23275, boatman_at_windlass_23465, crewman_crouching_24125, figure_roof_coils_24508,
    windlass_man_aft_24660, boatman_poling_24730, man_leaning_casks_25650, crewman_head_cabin_east_25810,
    boatman_coils_28543, boatman_cap_20938, steersman_stern_21678, sweepman_upright_22168, figure_deckhouse_east_24590,
    figure_in_windlass_24713, man_stern_hood_26750, steersman_27890, man_leaning_deckhouse_24447.
  - S4b (3): seated_boatman_stern_15372, boatman_dark_cap_15046, head_in_cabin_door_15097.
- Free clips:
  - `look` and `sit` (`from:townsman/look`, `from:scholar/sit`);
  - `sit_talk` (`from:official/sit_talk`), `crouch` (`from:carter/crouch`), `sit_floor` (`from:idler/sit_floor`);
  - `push` (`from:carter/push`), `point` (`t2m:point_and_argue`);
  - takes: `sit_one_knee`, `squat_sleeves`, `sleep_side`, `kneel_sleep`, `reach` (`child_reach`), `lean_over`,
    `bend_goods`, `push_flank`, `stand_pole`, `steer` (`steer_shafts`), `bucket_lift`, `hold_rope`, `hail`;
  - new takes as they land: `work_sweep`, `reach_over_rail`, `pole_boat`, `fend_pole`, `haul_line`, `wave_arms`,
    `lie_wave`.
- Props: `long_pole`, `bucket`, `straw_cape`.
- Once the takes land, drop the stand-in clips nobody plays (`node tools/clips_used.mjs`): he would carry about 28
  clips, so aim for 22 or fewer, under about 1 MB.

**9. grain_porter** (15; 30). Model `S4b.fig.porter_pole_bundle_13537` [13488, 517, 13581, 695]: 155 px, high conf; a
pointed cap or knotted kerchief, a short pale jacket with an apron-like wrap to the knees, bare lower legs.
- Dress refs: `S4b.fig.carter_at_shaft_ox_13243` [13179, 1454, 13285, 1656] (176 px: a white short jacket with a dark
  cloth round the hips) and `S2.fig.sack_porter_24312` [24276, 329, 24323, 417] (a short jacket, an apron, trousers).
- **Why:** the wharf and cart labourers wear a short jacket over an apron or hip wrap, with bare shins. They are played
  by the porter (10), the idler (4) and the carter (1), who have none.
- He differs from the boatman (a cap, not a head-cloth; a paler jacket), so 私粮进京's seven porters don't repeat the
  crews beside them.
- The figures:
  - S2 (8): sack_porter_24312, sack_porter_24452, sack_porter_24537, sack_porter_bank_edge_24467, sack_porter_28343,
    bank_porter_28355, sack_porter_bent_28432, sack_porter_back_28271;
  - S4b (5): carter_at_shaft_ox_13243, cart_driver_13303, porter_pole_bundle_13537, man_bending_sack_13607,
    porter_at_cart_rear_13090;
  - S3 (2): bearded_barrow_man_18098, topknot_man_at_cart_17458.
- Free clips: `look`, `push`, `push_flank`, `bend_goods`, `back_load` (`back_load_walk`), `carry_pole`, `steer`,
  `drive_team`; the takes `sack_carry`, `fend_pole`, `haul_line`.
- Props: `back_sack`, `pole_bundle`, `stick`, `open_sack`.

**10. straw_hat** (13; 30). Model `S3.fig.porter_straw_hat_17762` [17689, 1511, 17803, 1729]: 190 px, high; a broad
straw hat, a short belted jacket, knee trousers. Dress ref `S2.fig.hat_walker_24004` [23967, 253, 24033, 378]: a broad
conical bamboo hat (斗笠), a short jacket and trousers.
- **Why:** these labourers are played by the hat traveller, whose hat is right but whose long buff robe is a
  traveller's, not a labourer's jacket and trousers (12 figures). Two more are played by the idler and the carter.
- The figures:
  - S3 (3): porter_straw_hat_17762, boatman_hat_pole_19915, deck_hat_stick_19353;
  - S2 (6): hat_walker_24004, tracker_broad_hat_22057, basket_porter_24804, pole_porter_27193, barrow_pusher_25532,
    man_standing_26362;
  - S4b (1): boatman_light_hat_15066;
  - S1 (3): charcoal_driver_36797, charcoal_driver_36250, far_figure_29482.
- Free clips: `look`, `crouch`, `push`, `carry_pole`, `stand_pole`, `sit`; the takes `tow_walk`, `pole_boat`,
  `drive_donkeys`.
- Props: `pole_shallow_baskets`, `pole_bundles` (0.6), `pole_fringe_frame`, `staff` (trailing), `stick`, `long_pole`.

**14. dark_hat** (9; 30). Model `S7.fig.porter_baskets_1255` [1206, 1051, 1309, 1248]: 171 px, high; a wide dark hat with
an upturned brim, a dark short jacket belted at the waist, light trousers. Refs `S3.fig.wide_hat_pointer_18855`
[18805, 379, 18895, 511] and `S2.fig.big_hat_man_south_bank_22045` [21990, 1560, 22100, 1720] (142 px, a broad dark
round hat with a hanging tie).
- **Why:** a broad dark felt or lacquer hat over a short jacket. It is played by the hat traveller's light straw cone
  and robe (6), the porter (2, no hat) and the inspector (1, a round cap).
- Six of them stand in the bridge crowd: the pointers of 车轿相争 and the men bent over the railing.
- The figures: S7 (2) porter_baskets_1255, bundle_man_1976; S3 (6) wide_hat_pointer_18855, wide_hat_pointer_18890,
  deck_wide_hat_19405, deck_stooping_hat_19765, man_dark_hat_18035, black_hat_man_18458; S2 (1)
  big_hat_man_south_bank_22045.
- Free clips: `look`, `point`, `lean_over`, `talk`, `crouch`, `carry_pole`, `hold_tray`; the take `reach_over_rail`.
- Props: `pole_baskets`, `bundle_small`, `back_tall_bundle`, `tray`.

**15. tracker** (9; 30). Model `S2.fig.tracker_rear_22172` [22134, 283, 22190, 390]: 93 px, high; a short jacket belted at
the waist, trousers, a round cloth cap. Ref `S2.fig.tracker_lead_21867` [21835, 141, 21886, 239].
- **Why:** the two files of 纤夫 are played by the idler (4), the porter (4) and the carter. Their dress is close, but
  the round cloth cap and the belted jacket aren't theirs.
- Nine trackers in two files on three town characters read as the street crowd walking out of town. This is the
  weakest dress case of the ten; it buys variety.
- The figures: S3 (5) tracker_16333, tracker_16358, tracker_16385, tracker_16405, tracker_16423; S2 (4)
  tracker_lead_21867, tracker_bent_21939, tracker_hatched_coat_21994, tracker_rear_22172.
- Free clips: `look`, `push`; the take `tow_walk`.
- Prop: `straw_cape` (S2 21994).

**16. farmer** (9; 30). Model `S1.fig.man_with_stick_29205` [29162, 941, 29246, 1102]: 140 px, high; a pale belted robe or
long jacket, a small cap, a hoe over the shoulder. Ref `S1.fig.farmer_by_hedge_34472` [34435, 749, 34508, 891]: a small
hat or hooded cap, a plain long jacket, the hands in the sleeves against the cold.
- **Why:** S1's villagers are played by the soldier (a uniform jacket), the scholar (a white robe and futou, holding a
  hoe), and the idler, camel driver, townsman, carter and hat traveller.
- The figures, S1 (9): farmer_by_hedge_34472, bending_farmer_34252, man_with_stick_29205, figure_in_shed_35108,
  far_figure_29466, far_figure_29337, far_figure_29257, far_figure_29230, stall_customer_29280. Seven of them are
  conf low and painted far and tiny (37–67 px).
- Free clips: `look`, `bend_goods`, `crouch`, `point`; the take `stand_sleeves` (item 33).
- Prop: `hoe`.

**17. groom** (7; 30). Model `S7.fig.groom_1698` [1637, 1069, 1751, 1287]: 190 px, high; a dark short jacket, pale
trousers, a dark round cap. Ref `S7.fig.attendant_pale_1750` [1692, 1056, 1805, 1271] (187 px: a pale short jacket and
trousers, a dark cap with an upturned flap) and `S1.fig.groom_chasing_30697` [30635, 558, 30723, 689] (a short apron).
- **Why:** the servants who run with horses are played by the inspector (an official's indigo knee robe), the idler and
  the bearer.
- The figures: S7 (2) groom_1698, attendant_pale_1750; S1 (3) groom_chasing_30697, groom_chasing_30518,
  groom_chasing_30353; S3 (2) groom_holding_horse_19095, man_behind_rump_19165.
- Free clips: `bridle` (`hold_bridle`), `carry_pole`, `hold_rope`, `run`; the takes `chase_run` and `hold_horse_neck`.
- Props: `staff` on the shoulder, `hat_on_back` (30353).

**21. youth** (5; 30). Model `S3.fig.youth_round_face_18643` [18610, 358, 18670, 473]: 100 px on the deck, about 0.85 of
the men beside him; a round face, a small topknot, a light short jacket and trousers, face on. Ref
`S2.fig.bank_small_figure_21255` [21215, 1252, 21302, 1419]: 145 px, a plain robe.
- About 1.45 m tall.
- **Why:** youths painted at 0.75–0.85 of an adult are played by the child models (1.15–1.2 m) scaled up 1.25–1.4×,
  which gives a big-headed infant at a youth's height.
- The figures: S3 (2) deck_youth_rope_19445, youth_round_face_18643; S4b (1) youth_onlooker_13265; S2 (2)
  bank_small_figure_21255, second_passenger_window_24050.
- Free clips: `look`, `reach`, `chin`; the take `reach_over_rail` (as the rope thrower).

**22. official_rider** (3; 30). Model `S7.fig.official_rider_1610` [1550, 975, 1680, 1215]: 278 px, the biggest figure
of S7 and the scroll's last. A bearded official in a black, very broad, flat-brimmed hat with a tall flat-topped crown
and hanging ties, and a pale round-collared long robe (圆领袍).
- The crop shows the upper body only; ask the sheet for a standing man.
- **Why:** the hat traveller wears a light straw cone and a buff cross-collared robe with a sash.
- The figures: S7 (1) official_rider_1610; S4b (2) man_big_hat_12895 and man_wide_hat_13760, light robes under
  broad dark hats, both low.
- Free clips: `ride` (`t2m:ride`), `bridle`, `look`, `talk`.
- Prop: `stick` as the riding stick.

**45. woman_pale** (2; 30). Model `S7.fig.standing_woman_1567` [1545, 712, 1595, 895]: 170 px; a high dark bun, a pale
long robe under a short over-jacket. Ref `S7.fig.seated_woman_child_1535`.
- **Why:** the woman wears a slate 褙子 over a pale skirt. The cut is right and the tone is not.
- The free recolour in 2e is the cheaper route; make her only if that fails.
- The figures: S7 seated_woman_child_1535, standing_woman_1567.
- Free clips: `sit`, `look`, `hold_child`; the take `sit_hold_child`.
- Prop: `child_on_lap`.

**No new character is needed for these** (the lead's list, checked):
- **Monks:** none is painted in round 2.
- **Sedan bearers:** the bearer's short jacket, top-knot and leg wraps fit S3's and S1's bearers.
- **Hooded travellers:** S1's two riders take the `wind_hood` prop on the townsman and the camel driver.
- **Women:** S3's and S2's possible women are all conf low; the woman plays them.
- **Children:** the child and child_robed fit every child painted small. S3 `child_red_18592` asks for red; see 2e.
- **S3 `official_black_robe_17940`** (a black 幞头 and a long black robe): recast it to the fortune-teller (a dark
  ink-blue robe, a futou), free, for the area agent.

### 1c. The takes

These follow the skill's prompt rules:
- prime mode, 6–8 s, at most 400 characters;
- the body only: say where the hands and feet are, and how high;
- ask for big motions explicitly;
- read every frame sheet with `tools/clip_sheet.mjs`.

"→" lists the characters that get the take free with `t2m:`, interim casts included.

| # | take | what the body does | figures (map slugs) | → characters | stand-in now |
|---|---|---|---|---|---|
| 2 | `work_sweep` | standing, feet braced wide, both hands on a bar at chest height, pushing it across with the whole body, then hauling it back leaning far back with the face up; in place (the kit swings the `sweep` node and stands the crew at its bar) | S3 sweep_man_15810, _15838, _15855, _15862, _15888, _15915; S2 sweepman_leaning_back_22110, sweepman_head_back_22132, sweepman_upright_22168, sweepman_capped_22208, sweepman_capped_22242, sweepman_leaning_on_loom_22285 | boatman, inspector | `push` |
| 3 | `reach_over_rail` | bent double over a waist-high rail, head down, both arms hanging over it and reaching down and out (lowering a rope, calling to a boat below), then straightening a little | S3 rail_watcher_19862, deck_stooping_hat_19765, deck_rail_leaner_19578, deck_wide_hat_19405, man_lowering_rope_19295, man_bent_over_railing_19195, man_bent_over_railing_19065, man_over_railing_19025, man_leaning_over_rail_19432, deck_youth_rope_19445; S2 boatman_leaning_20558 | townsman, hat_traveller → dark_hat, idler, porter, inspector, scholar, child → youth, boatman | `lean_over` |
| 4 | `tow_walk` | walking slowly, bent far forward almost level, both hands low at the waist on a rope over the shoulder, short heavy steps, the rear leg pushing off | S3 tracker_16333, _16358, _16385, _16405, _16423; S2 tracker_lead_21867, tracker_bent_21939, tracker_hatched_coat_21994, tracker_broad_hat_22057, tracker_rear_22172 | idler, porter, carter, hat_traveller → tracker, straw_hat | `push` |
| 5 | `sack_carry` | walking slowly bent far forward under a big sack across the shoulders and back, one hand up at the shoulder holding its tied neck, the other trailing low, short heavy steps | S2 sack_porter_24312, _24452, _24537, sack_porter_bank_edge_24467, sack_porter_28343, bank_porter_28355, sack_porter_bent_28432; S3 sack_porter_18915, white_sack_porter_18882, porter_carrying_17922 | porter, idler → grain_porter, robed_man, townsman | `back_load` |
| 6 | `pole_boat` | standing at a waist-high gunwale, both hands high on a long pole slanting into the water, leaning the weight down along it bent from the waist, a short shove, then walking the hands back up | S3 boatman_bending_pole_19746, boatman_bent_pole_19830, boatman_standing_pole_19892, boatman_poling_bow_19632, boatman_poling_16198, boatman_hat_pole_19915; S2 boatman_poling_24730 | boatman, hat_traveller → straw_hat (interim idler, porter, carter) | `push`, `stand_pole` |
| 7 | `fend_pole` | feet apart, both arms raised holding a long pole overhead or level at the chest, pushing it away hard against something above or beside, then easing | S3 boatman_both_arms_pole_19840, boatman_pole_raised_19775, boatman_cabin_door_pole_20300, deck_pole_holder_19625; S2 boatman_pole_20495, boatman_fending_off_23688, pennant_pole_holder_27810 (raising); S4b porter_at_cart_rear_13090 (no pole: arms up to a cart's load) | boatman, porter, robed_man, grain_porter | `stand_pole`, `push_flank` |
| 11 | `haul_line` | leaning back, one foot forward, hauling a rope hand over hand at chest height | S3 boatman_hauling_rope_20205, bearded_barrow_man_18098; S2 boatman_hauling_mast_24140 (kneels: played low) | boatman, carter → grain_porter | `hold_rope`, `bridle` |
| 12 | `chase_run` | running flat out with long strides, one arm thrust straight forward at shoulder height with the hand open, the other swinging back, head forward, shouting | S1 groom_chasing_30353, _30518, _30697 | idler, bearer, inspector → groom | `run` |
| 13 | `drive_donkeys` | walking slowly a little behind a pack animal, the near arm stretched forward with the hand on top of its load, the other holding a thin switch out low behind, head turning | S1 charcoal_driver_36797, _36250; S3 donkey_walker_18481 | hat_traveller, carter → straw_hat, idler | `walk` + `stick` |
| 18 | `wave_arms` | standing, both arms raised high above the head waving wide, shouting | S3 man_waving_on_boat_roof_19952, bank_waver_19612 | boatman, robed_man | `hail` |
| 19 | `sit_offer` | sitting low on the ground or a stool, leaning forward, reaching down to pick something up and holding it out at arm's length to someone standing, talking up | S4b seated_man_13240 (the 13-man crowd's centre); S2 tub_vendor_27765 (a bowl) | storyteller, idler | `sit_floor`, `knees_up` |
| 20 | `lie_wave` | half lying on the back propped on one elbow, then raising the free arm high and waving, lowering it, looking out | S3 man_reclining_waving_20060; S2 passenger_reclining_on_cargo_22848 | boatman, idler | `sleep_side` |
| 23 | `hammer_rim` | bent from the waist over a wheel lying flat at the feet, left hand on its rim at knee height, right hand swinging a short mallet down in short strokes, then shifting along | S4b wheelwright_bending_13620 | idler | `bend_goods` |
| 24 | `examine_child` | standing, leaning a little forward, both hands reaching out together at chest height to a small child held before him, feeling its wrist, then drawing back and nodding | S7 doctor_dark_robe_1615 | fortune_teller | `hand_over` |
| 25 | `sit_hold_child` | seated on a low bench, holding a small child upright on the lap with both hands round its waist, lifting it a little toward someone standing, head turned to him | S7 seated_woman_child_1535 | woman (→ woman_pale) | `sit` |
| 26 | `point_way` | standing half turned, the right arm raised level pointing far along a street, held there while the head turns back to the listener and nods, then lowered | S7 pointing_man_1370 | scholar | `point` |
| 28–43 | the optional tail | as each needs list words it (`canal_needs.md` 7–13, `rainbow_bridge_needs.md` 10–11, `countryside_needs.md` 3–4, `outer_road_2_needs.md` 4–9, `city_end_needs.md`) | one figure each, listed in 1a | the figure's cast | as listed in the needs |

### 1d. Animal bodies

None is planned with credits. Every animal the five areas paint is one of the nine registry bodies, given a tone, tack or
clip for free (2c). The one conditional body is item 46: a water buffalo from S1's painted figure (15 credits), only if
the free buffalo (the ox's body, a dark slate tone and kit-built swept horns) doesn't read on `web/creatures.html`.

## 2. Free workshop work (0 credits; do it first)

### 2a. Local retargets onto the existing characters

These are the interim casts' clips, merged across the five lists under one name per action. The five lists call
`t2m:sit_listen` `sit_listen`; the existing characters call it `listen`, and so does everything here. Each source is a
take, given as `t2m:<take>` from the account its FBX lives in (`gen/motions/<take>/[<account>/]`), or a library clip
spread with `from:<character>/<clip>`.

| character | add | asked by |
|---|---|---|
| idler | `steer` (steer_shafts), `drive_team`, `arms_folded` (lean_wall_idle), `bend_goods`, `sleep_side`, `stand_pole`, `lean_over`, `reach` (child_reach), `back_load` (back_load_walk), `sit_talk` (from:official/sit_talk), `knees_up` (sit_knees_up), `carry_pole` | S4b, S3, S2, S7, S1 |
| scholar | `point` (point_and_argue), `crane` (crane_listen), `bridle` (hold_bridle), `lean_over`, `lean_chin` (lean_chin_on_hands), `ride`, `sit_talk`, `listen`, `bow` (bow_gongshou) | S7, S4b, S3, S2, S1 |
| porter | `push` (from:carter/push), `look` (from:townsman/look), `bend_goods`, `point`, `lean_over`, `crouch` (from:carter/crouch), `crane`, `back_load`, `sit_floor` (from:idler/sit_floor), `push_flank`, `reach` | S4b, S3, S2 |
| robed_man | `sit_talk`, `sit` (from:scholar/sit), `look`, `knees_up`, `drink` (from:scholar/drink), `hail`, `bend_goods`, `lean_chin`, `point`, `back_load`, `carry_pole`, `chin` (chin_watch), `sit_floor`, `stand_pole`, `lead` (lead_camel_walk) | S7, S4b, S3, S2, S1 |
| townsman | `carry_pole`, `sit`, `listen`, `lean_over`, `hail`, `kneel_sleep` | S7, S4b, S3, S2 |
| hat_traveller | `bridle`, `look`, `stand_pole`, `lean_over`, `point`, `talk` (from:townsman/talk), `carry_pole`, `sit`, `push`, `crouch`, `drink` | S4b, S3, S2, S1 |
| camel_driver | `sit_floor`, `sit`, `bend_goods`, `ride`, `crouch` | S3, S2, S1 |
| carter | `hold_rope`, `stand_pole`, `tie_kerchief`, `arms_folded` | S3, S2 |
| inspector | `bridle`, `push_flank`, `push` | S7, S4b, S2 |
| woman | `look`, `lean_chin`, `tie_kerchief`, `ride_side` | S7, S3, S2 |
| fortune_teller | `hand_over` (hand_over_paper), `look`, `talk` | S7, S3, S2 |
| storyteller | `sit_floor`, `sit` | S4b, S3, S2 |
| child | `crouch`, `sit` | S3, S2 |
| butcher | `hold_tray`, `hand_over` | S3, S2 |
| sightseer | `listen` | S4b, S2 |
| child_robed | `reach` | S3, S1 |
| elder | `arms_folded` | S3 |

That is 92 clips. Many go to figures a new character later takes over, so after every delivery and recast run
`node tools/clips_used.mjs` and drop what nobody plays. The idler would reach about 37 clips (about 1.2 MB): trim it
first.

### 2b. Records

- **`characters/woman.json` names the wrong model.** Its crop [1575, 725, 1655, 905] is `S7.fig.doctor_dark_robe_1615`,
  a man. Name the right model, `S7.fig.standing_woman_1567` [1545, 712, 1595, 895], in `characters/notes.md` only.
  **Never edit the JSON's `figure` or `crop`:** they are cache inputs (ref → sheet → views → mesh), and a later
  `character.mjs all` would pay 30 credits to re-mesh her.

### 2c. Animals: tones, tack, clips

All of it goes through `tools/animal.mjs` and `blender/rig_quadruped.py`.

**Variants:** `body_from` plus a `tone`, or a kit-built part.

| variant | how | plays |
|---|---|---|
| `donkey_dark` | `body_from: donkey`, near-black tone | S4b donkey_13474; S3 donkey_18048, donkey_sack_18535, donkey_sack_18690, donkey_ridden_18690, donkey_dark_18745 (and dog_or_donkey_19825 if the lead reads a donkey); S2 donkey_dark_28921 (7, or 8) |
| `horse_dark` | `body_from: horse`, dark bay with dark mane and tail | S4b horse_saddled_13378; S3 horse_19055 (and second_horse_19230 if built); S2 horse_feeding_26072 (3, or 4); S4's `horse_dark_10372` too, if the lead recasts the finished S4 |
| `buffalo` | `body_from: ox`, dark slate tone (saturation about 0.3, value 0.4), plus **`horns_swept`**, a kit-built part rigid on the head bone: two long flat crescent horns sweeping back and up. It must show always, not as a switchable `load`. | S1 water_buffalo_lying_29462, clip `lie` with the head raised and turned toward us (check that the lie pose holds the head up) |
| `ox_longhorn` (optional) | `body_from: ox`, long horns curving up, shown always | S4b ox_lead_13458 |
| `bird_pale` (optional, the lead's call) | the kit bird with a pale grey palette | S1 pale_bird_34250 |

**Tack:** each tack variant is exclusive, so a combination is its own variant.

| tack | on | plays |
|---|---|---|
| `saddle_fringe` | horse | S7 horse_official_1625 (on horse_white): the saddle, a crupper to the tail, a long fringed skirt of tassels almost to the hooves, a bridle with reins |
| `saddle_dark` | horse | S4b horse_saddled_13378 (a dark cloth hanging down the side under a high saddle); S3 horse_17222 (a long dark flap, a crupper with two tassels; the knotted tail optional) |
| `girth_cloth` | horse | S4b horse_12862 (a girth or short cloth, scale about 0.85); S2 horse_24565 (a plain dark pad at the withers) |
| `pack_heap_dark` | mule | S4b's four pack mules: mule_pack_head_down_13612, mule_pack_head_up_13645, mule_pack_east_13752, mule_pack_behind_13787 (a pack saddle heaped with a dark hatched load; `pannier_charcoal`'s colours) |
| `pack_bale` | donkey | S3 donkey_sack_18535 and donkey_sack_18690: one huge pale sack lashed across a pack saddle, hanging far out both sides |
| `halter` and `halter_breeching` | donkey | S2 donkey_dark_28921 (halter); S3 donkey_18048 (halter, and a light strap over the rump). The lead ropes are builders' lines to the head bone. |

The mule's collar trace points for S2's cart mules are already in `animals.json` (`harness.trace_l/r`): check them, and
make nothing.

**Clips (procedural):**
- donkey `walk_low` (head and neck hanging), as the horse's: S1's charcoal donkeys 36745, 36508, 36410, 36323, the
  traveller's donkey 30216, and S3 donkey_sack_18690 (6);
- horse `gallop`: only if the user has S1's `runaway_horse_30075` built whole (its front half is lost to damage);
- donkey `balk` (braced back, optional): S3 donkey_18048.

**What needs no work:**
- S1's charcoal train (5 × `pannier_charcoal`), S1's travellers' donkeys (`saddle_cloth`) and S1's party horse
  (`saddle`) use the registry as it is.
- The oxen of S4b (`draught`) and S1 (`graze`) use it as it is.
- The four birds (S4b 12827, S2 21135 and 21730, S7 1735) are the registry's kit crow. S7's crow sits on a roof slope at
  about 30°: check its feet.
- S7 `pale_shape_1905` waits for the lead. If it is an animal: the ox scaled to a calf, or the pig, with a pale tone
  and `graze` (free).

### 2d. Carried props

The geometry is built in `blender/char_props.py`; the bindings go in `characters/props.json`. Each prop rides on the
clip that holds it. Bind it to the interim cast now and to the new character when it lands.

New geometry, by figures served:

| prop | what | figures |
|---|---|---|
| `long_pole` | a 4–6 m bamboo boat pole | S3 10 (six polers, three fenders, deck_pole_holder_19625) and long_robe_pole_18852 if the builder gives it to him; S2 3 (20495, 23688, 24730) |
| `back_sack` | a big sack slung on the back, tied neck at the top, dark and pale; a `shoulder` placement for one shoulder | S2 the seven sack porters; S3 sack_porter_18915 (dark), porter_carrying_17922, white_sack_porter_18882 (shoulder) |
| `hip_bag` | a dark cloth bag on a cord at the hip; a `bag_hand` placement hangs it from the hand | S7 walker_bag_1885; S3 robe_apron_man_18582; S4b man_white_jacket_12773 (hand), man_on_bank_14686 (optional); S6's five (listener_bag_3893, bearded_pouch_2949, young_man_walking_2570, doorway_man_4026, boy_short_jacket_2229) if the lead recasts finished S6 |
| `hand_dish` | one prop, three forms: a plate of 2–3 buns, a small bowl, a cup held up | S3 waiter_calling_17451 (buns); S2 tub_vendor_27765 and eatery_man_23642 (bowl, optional), bank_man_seated_21140 (cup raised overhead, low) |
| `bundle_small` | a small tied cloth bundle, at the chest in two hands or low in one | S7 bundle_man_1976; S3 walker_with_bundle_17396 |
| `back_tall_bundle` | a tall bundle of reeds or a dark cylinder on a frame, rising above the head; with `t_stick` (打杵), a waist-high T-stick | S3 wide_hat_pointer_18890; S4b porter_tall_load_13402 (+ `t_stick`, low) |
| `wind_hood` | a padded hood (风帽) over head and neck, falling to the upper back as a short cape; on Head, the cape following Spine (`follow` < 1 on `ride`) | S1 traveller_rider_30165, traveller_rider_30495 |
| `straw_cape` | a layered straw cape (蓑衣) to the hips | S2 tracker_hatched_coat_21994, boatman_roof_26290 (optional) |
| `food_box` | a lidded 食盒 with a tall bail handle, in the hand; two on a pole as `pole_hampers` (optional) | S7 visitor_food_box_1308; S1 porter_boxes_30908 (optional; `pole_boxes` stands in) |
| `folded_parasol` | a closed 掌扇, about 2.2 m, on the shoulder in `carry_pole` | S7 folded_object_bearer_1490 |
| `pole_hooks` | a bare shoulder pole with a rope and hook at each end | S7 bucket_man_1872 |
| `pole_buckets` | a shoulder pole with two banded buckets (`kit_city_end.hooped_bucket` shape) | S3 far_water_carrier_19720 |
| `pole_jar_bundle` | a jar in a rope sling at one end, a tall netted bundle at the other | S3 porter_jar_bundle_18483 |
| `pole_fringe_frame` | a bow-shaped frame hung with long strips at the back, a round bag at the front | S3 porter_straw_hat_17762 |
| `pole_basket_branches` | a round basket at the front, a long bundle of branches at the back | S1 porter_pole_31083 |
| `flat_basket` | a big flat round winnowing basket held tilted at the waist | S3 basket_carrier_19138 |
| `rope_coil` | a coil of rope held at the chest | S3 deck_rail_watcher_19670 |
| `lidded_basket` | a round lidded basket with a loop handle, at the side | S4b stall_keeper_13415 |
| `mallet` | a short wooden mallet in the right hand | S4b wheelwright_bending_13620 |
| `open_sack` | a pale sack held open at knee height in both hands | S4b man_bending_sack_13607 |
| `stick_bag` | a short stick held upright at the chest with a long dark bag hanging from it | S1 traveller_standing_29996 |
| `hoe` | a 1.6 m hoe or rake with a small hooked head, over the right shoulder | S1 man_with_stick_29205 |
| `hat_on_back` (optional) | a broad straw hat hanging behind the shoulders on its strings | S1 groom_chasing_30353 |
| `back_chair_frame` (low) | a pedlar's frame or chair carried on the back (fallback: `back_frame`) | S4b man_frame_or_hat_15125 |
| `veiled_hat` (low) | a tall hood or wide hat with a veil to the shoulders (帷帽) | S2 rider_26832 |

New placements of existing props:
- `staff` on the shoulder, in `carry_pole`: S7 attendant_pale_1750; S1 party_porter_staff_31131, traveller_staff_30357.
- `staff` trailing in the hand while walking: S2 hat_walker_24004.
- `back_bundle`:
  - at 1.6×, pale: S7 visitor_food_box_1308 (on `look`/`idle`);
  - as it is: S3 walker_topedge_19878; S1 traveller_staff_30357, stall_man_29328.
- `child_in_arms` as **`child_on_lap`**, seated upright on the thighs, on `sit` and later `sit_hold_child`: S7
  seated_woman_child_1535 (and child_on_lap_1546).
- `stick`:
  - a switch: S1's two charcoal drivers;
  - the riding stick: S7 official_rider_1610 (optional); S3 donkey_rider_18650;
  - S4b cart_driver_13303 (on `drive_team`); S3 man_reaching_with_stick_18930, deck_hat_stick_19353 (shoulder),
    man_north_of_chuanche_17690 (held across);
  - S2 sack porters 24312, 24452, 24537 (trailing), shed_keeper_28467 (level, pointing), bank_man_with_stick_25370
    (under the arm).
- Pole loads on new carriers: `pole_bundles` on the robed man (S3 pole_carrier_robe_18345) and at 0.6 on the hat
  traveller or straw_hat (S2 pole_porter_27193); `pole_shallow_baskets` on the hat traveller or straw_hat (S2
  basket_porter_24804).
- `bucket` tipped out, on `bucket_lift` (later `pour_bucket`): S2 boatman_pouring_bucket_22665.
- `fan_round` on the robed man's `point`: S2 robed_man_foredeck_23930.
- `tray` on the porter's `hold_tray`: S3 black_hat_man_18458 (later dark_hat).

S2's `stick_bundle` stands on the ground beside its figure, so it is a kit part (`kit_canal`), not a carried prop.

### 2e. Recolour variants (optional, free)

Only if `tools/build_character.mjs` can take a variant cleanly; drop this if it can't.
- **How:** a character with `body_from` and its texture recoloured in a mask baked from the body's own faces (for
  example every face above the brow in the rest pose for a hat), shipped as its own GLB with the same rig and clips.
- **What it buys:** interim looks until the paid characters land.
  - `hat_traveller_dark`: the straw hat made black felt, for dark_hat's 9 figures and official_rider's 3.
  - `woman_pale`: the slate over-robe made pale, for S7's two women. If it reads, item 45 is not needed.
  - `child_red`: the jacket made red, for S3 child_red_18592.

## 3. Vehicles

`kit_vehicles.py` has `covered_ox_cart`, `barrow_screen` (串车), `sack_cart` (and `low`), `mule_wagon`, `cask_cart` and
`sedan_chair` (`carried`, `cabin_at`). What the five areas paint:

| vehicle (map ID) | painted reference (scan) | area | kit | owner |
|---|---|---|---|---|
| `S4b.veh.palm_cart_13070` (parked) and `S4b.veh.palm_cart_13455` (two oxen, under way) | about [12680, 950, 13100, 1250] and [12900, 1280, 13480, 1680] (roofs 290 and 390 px above the ground) | S4b | `kit_outer_road_2.palm_cart(hitched=, load=)`: **already built** by S4b; S4b only | S4b |
| `S4b.veh.sedan_chair_13140` (set down) | about [13030, 960, 13290, 1165] | S4b | `sedan_chair(carried=False, cabin_at=…)`: exists | – |
| `S3.veh.chuanche_17775` (串车, set down, 书屏遭废) | [17420, 1275, 17850, 1565] | S3 | `barrow_screen(held=False)` **+ new kwargs** `stakes`, `poles` (two long poles east from the load's top with rope loops and a hook), `panel` (a ribbed woven panel) | factory (c) |
| `S3.veh.barrow_hooped_load_18100` | [18080, 1355, 18315, 1482] | S3 | **new `barrow_load(load="hoops")`**: bare hoops over bundles and a rolled mat | factory (c) |
| `S2.veh.barrow_crates_25598` (low) | [25515, 46, 25618, 120] | S2 | **`barrow_load(load="crates")`**: two lattice crates, the rear one higher | factory (c) |
| `S3.veh.sedan_18842` (车轿相争, carried) | about [18640, 380, 18870, 670] | S3 | **`sedan_chair(front="closed", roof="round")`**: a boarded front with a lattice window, a rounded roof | factory (c) |
| `S1.veh.sedan_willow_30805` (carried) | [30820, 410, 30960, 600] | S1 | **`sedan_chair(front="closed")`**, low roof with a knob; the `willow_spray` decoration in S1's own kit | factory (c) for the kwarg; S1 for the spray |
| `S2.veh.mule_cart_24305` (being loaded) | about [24280, 150, 24520, 300] | S2 | **new `open_cart`**: an open bed with rails past the rear, a tilted mat-covered bundle over a straw heap, a prop stick under the rear, two mules on long traces (no shafts), `.bed` for the loader (cart bed H 0.91) | factory (c) |
| `S2.veh.cart_round_top_26035` (low) | about [25905, 60, 26018, 160] | S2 | `kit_vehicles.barrel_cover` over a short bed on legs, wheels hidden; or the parasol reading | S2 (`kit_canal`) |
| `S3.veh.handcart_19862` | [19842, 178, 19998, 238], its pole to (20021, 115) | S3 | new `handcart`: a slatted box on two `spoked_wheel`s, its top rails running on as shafts | S3 (its own kit) |
| `S1.veh.barrow_tipped_29795` (独轮车, lying tipped) | [29650, 620, 29820, 710] | S1 | new `trough_barrow(tipped=True)`: front wheel in a fork, a tapering trough | S1 (`kit_countryside`, already planned there) |

The rule used: a vehicle used by one area goes in its own kit, unless it extends a function of `kit_vehicles.py` (which
the areas may not edit), or needs that kit's private harness helpers. Those go to factory (c).

## 4. Boats

**Coverage.** The kit's three types and seven presets cover every one of the 35 mapped boats. Several need options the
kit lacks.

| area | boats → preset |
|---|---|
| S4b (6) | `boat_big_cabin_14928` passenger (`cabin pattern 'boards'`); `boat_long_cabin_14850` passenger (short cabin); `boat_arched_awning_14945`, `boat_mat_cargo_14900`, `boat_round_mat_15025` grain_awning_sweep (sweep at rest, shipped, none); `boat_small_cabin_15182` small_awning |
| S3 (11) | `boat_under_way_15595` grain_awning_sweep (working); `boat_towed_mast_16228` grain_mast_towed; `boat_passenger_long_16398`, `boat_awning_17442`, `boat_cabin_under_arch_19225` passenger; `boat_lowered_mast_17708` grain_mast_towed (`mast="down"`); `boat_mat_cabin_18005` small_awning; `boat_unloading_17705`, `boat_moored_south_bank_19745` grain_awning_sweep (no sweep); `boat_skiff_19255` small_open; `boat_mast_lowering_19518` passenger_mast_lowering (its house cut to what is painted, `kind` set by hand) |
| S2 (17) | grain_awning_sweep: `boat_mat_cargo_21055`, `boat_sweep_22000` (working), `boat_cargo_hooded_bow_23715`, `boat_moored_mat_canopy_25145`; passenger: `boat_big_cabin_21120`, `boat_passenger_22545` (豪华客船), `boat_mat_cabin_25980` (`'boards'`); grain_mast_towed: `boat_towed_mast_23632` (逆水行舟, a passenger cabin); grain_laden: `boat_grain_27285`, `boat_grain_28095`; small_awning: `boat_mat_shelter_20805`, `boat_covered_21205`, `boat_mat_roof_22290`; small_open: `boat_skiff_21080`, `boat_open_21968`, `boat_small_bow_22158`, `boat_bottom_28395` |
| S1 (1) | `boat_sampan_36440` small_open, `lw` 0.6 (4.8 m), `kind` set by hand (`kind_of` reads "sampan" as nothing) |

Totals: passenger 8, passenger_mast_lowering 1, grain_awning_sweep 10, grain_mast_towed 3, grain_laden 2,
small_awning 5, small_open 6.

**`gen/boats/types.md`'s inventory disagrees with the maps** (S4b in 3 places, S3 in 5, S2 in 9, plus 5 boats it
misses). The maps win; the factory corrects the inventory (order (c)).

**Options the kit lacks**, ranked by boats served:

| # | option | boats |
|---|---|---|
| B1 | **awnings anywhere**: `awnings=[(x0, x1, style)]`, style `arch` / `hood` / `flat` / `gable` / `canopy` (on posts), independent of `hold` | about 16: S4b 14900 (dark barrel roof over the bow), 14945 (after half), 15182 (low canopy and a higher stern cabin); S3 17442 (fore awning on a light frame), 18005 (stern hood overhanging to a point), 17705 (an arched hood and flat lattice awnings aft), 19745 (a low arched roof west, a planked roof east), 19518 (a low mat deckhouse); S2 21055, 20805 (flat roof with a slatted eave), 21120 (flat awning on posts), 21205 (canopy on four posts, gabled east), 23632 (bow hood), 23715 (bow hood, deckhouse hood, a huge rounded cover aft), 25145 (foredeck canopy on posts), 25980 (barrel hood and an open arched hood aft), 27285 (two overlapping mat roofs over a bow deckhouse) |
| B2 | **pointed bow** on the small hull: `bow="pointed"`, an upswept stem with a knob or post in place of the bow transom | 5: S1 36440; S2 21080, 22158; S3 19255; S4b 15182 |
| B3 | **windlass**: `windlass=[(x_frac, "bow"\|"deck"\|"roof"\|"post")]`, a spoked drum, with a work point for the crew | 4: S3 19518 (bow, and the frame on the poop); S2 22545 (after roof), 23715 (bow, and one on a post aft with two men), 21120 (a hub at the stem head) |
| B4 | **open cabin** `cabin={"pattern": "open"}`: posts and a waist rail, no walls | 3: S3 19225 (two passengers at its rail); S2 23715 (pin 16's deckhouse), 22545 (the open bay) |
| B5 | **sweep pose** `sweep_pose="work"\|"rest"\|"shipped"` (trailing in the water; or laid along the deck, blade raised) | 4: S4b 14928, 14945 (rest), 14900 (shipped); S2 23632 (shipped, low) |
| B6 | **small-hull stern**: `rudder=True` and `stern_frame=True` (lashed crossbeams overhanging the stern) | 3: S2 22290, 28395; S4b 15182 (a tiller) |
| B7 | **mast form**: `mast_form="pole"` and `mast_step="roof"` (one pole in a braced tabernacle on the cabin roof, about 15 stays); `crutch=True` for a mast laid down | 3: S2 23632 (逆水行舟: the pole); S3 17708 and S4b 14928 (crutch) |
| B8 | **ladder gangway**: `gangway="ladder"`, boat to bank or boat to boat, beside the existing `gangplank` | 2: S2 23715 (to the bank top), 28095 → 28395 (rafted) |
| B9 | **raised bow deck** on a grain hull: `bow_deck=<h>`, with crew standing on it, and an A-frame of two poles | 1: S3 15595 (H 1.12, three men) |
| B10 | **grapnel**: a 4–5-pronged anchor hanging under the bow | 1: S3 17705 |
| B11 | **fenders** (optional): a hanging coil and a rope-wrapped bow fender; log fenders along the side | 2: S2 23715; S3 17708 |

## 5. Tree forms

The 150 mapped trees of the five areas, by form, against the 32 cards. The "cards needed" column is the fewest cards
that pass `tools/tree_cards.mjs check`: no two trees within 6 m share a card; within 15 m, only mirrored. It was found by
a greedy solve over 300 orders on the layouts' X and D, with S4–S6's trees fixed on their assigned cards.

| form | S7 | S4b | S3 | S2 | S1 | trees | cards now | cards the check needs |
|---|---|---|---|---|---|---|---|---|
| `willow_fan` | – | 7 | 8 | 6 | 16 | 37 | 4 | 4 |
| `willow_burl` | – | – | 1 | 4 | 13 | 18 | 3 | 4 (plus the shapes below) |
| `elm_claw` | 2 | 2 | 1 | 2 | 21 | 28 | 4 | 6 |
| `slender` | – | 2 | – | 3 | 19 | 24 | 4 | 7 |
| `shoot_tree` | 2 | 1 | 6 | 2 | 1 | 12 | 4 | 4 |
| `whip_clump` | 2 | – | 2 | 2 | – | 6 | 2 | 2 |
| `bamboo` | 2 | – | 1 | – | – | 3 | 5 | 6 (S7's two join S6's grove of four) |
| `leafy` | – | – | 1 | 2 | – | 3 | 1 | 1 |
| **`willow_weep`** (new) | 1 | – | – | – | – | 1 | 0 | 1 |
| **`sapling`** (new) | – | – | – | – | 15 | 15 | 0 | **14** (7 if the radii scale with height, below) |
| far bushes | – | – | – | – | 2 | 2 | – | `whip_clump_1` and `leafy_1` (no new card) |
| stump (a solid prop) | – | 1 | – | – | – | 1 | – | built in S4b's kit, no card |

**New cards: 19**, or 26 if the saplings need 14. The refs are scan crops, sent as images 2 and 3 after the style
image.

| card | what | real height | ref (scan) | trees |
|---|---|---|---|---|
| `willow_burl_4` | a massive moss-dotted bole leaning west, knobbly roots running out like rocks, a broad fountain of whips | 16 m | `S1.tree.willow_burl_great_32620` [32210, 270, 32810, 1608]; `S1.tree.willow_great_burl_32065` [31680, 222, 32210, 1470] | S1 32620 (16.9 m), 32065 (15.7 m); by height also S2 willow_great_21345 (14.8) and dark_trunk_willow_20530 (14.0). The cards are 8–10 m and the page caps scale at 1.4. |
| `willow_burl_5` | a huge low hollow bole leaning hard north-west, whips fanning over a roof | 12 m | `S1.tree.willow_leaning_hut_31240` [30270, 540, 31350, 1512] | S1 31240; S2 21345 (leans north) |
| `willow_burl_6` | a bole split into two legs like an inverted V, one knobbed head | 9 m | `S2.tree.willow_split_22285` [21850, 0, 22540, 338] | S2 22285 |
| `willow_burl_7` | a trunk leaning far up and north-west to a pollard head lying almost level, whips spreading both ways | 10 m | `S2.tree.willow_great_27068` [26440, 175, 27260, 925] | S2 27068 |
| `elm_claw_5` | a twin-stemmed elm from one foot | 9 m | `S1.tree.bare_elm_twin_34552` [34300, 252, 34615, 956]; `S1.tree.bare_elm_twin_35920` [35780, 385, 36160, 1220] | S1 35920, 34640, 34552, 33936 |
| `elm_claw_6` | a tall slender trunk with a small high claw crown | 11 m | `S1.tree.bare_elm_tall_36070` [35975, 270, 36276, 1190]; `S1.tree.elm_slender_33906` [33860, 195, 34065, 955] | S1 36070, 33906, elm_tall_33865 |
| `slender_5`, `_6`, `_7` | young pale-trunked trees with small fan heads of rising shoots: one leaning, one twin-stemmed, one straight with a wider head | 6–8 m | `S1.tree.grove_fan_35632` [35580, 173, 35730, 788]; the grove [35242, 110, 35985, 795]; `S1.tree.pale_trunk_34474` [34446, 470, 34494, 913] | S1's grove of seven (35485–35823) and the two pale trunks |
| `bamboo_6` | a narrow clump: one straight culm with 个 sprays | 3 m | `S7.tree.needle_tree_1955` [1910, 35, 2005, 278] | S7 1910, 1955 |
| `willow_weep_1` (new form) | an old gnarled lumpy willow whose **bare** whips hang in curtains, a long limb arching east with whips hanging from it. This one willow is painted hanging; say bare, early spring, no leaves, and check it against the scan. | 11.5 m | `S7.tree.willow_edge_855` [795, 0, 1252, 908] (the scan: the restyle paints a second trunk) | S7 855 |
| `sapling_1` … `_7` (new form) | a young bare tree on a thin dark trunk with a small angular crown of crab-claw twigs: single stems, forks, leaning, a few budding | 2.2 m | `S1.tree.young_bare_29558` [29480, 1056, 29632, 1242]; the 菜地 grove [29520, 1150, 30010, 1430] | S1's 14 young trees of the 菜地 and sapling_far_31328 |
| `hedge_1` (new form) | a knee-high row of small leafy shrubs, wide (about 2.6 × 0.8 m) | 0.8 m | `S2.tree.shrub_row_22805` [22685, 330, 22925, 428] | S2 22805; S1's `hedge_yard_34265` only if the map makes it a tree (it is a `str` now, so S1 builds it otherwise) |

**Three things for the lead before the tree factory ships S1:**
1. **The saplings.** The 菜地's 14 young trees stand 0.2–2 m apart (median 2.1 m), so the current check needs 14
   different cards.
   - Scaling both radii by min(1, displayed height / 8 m), so the rule reads in tree heights rather than metres, needs 7.
   - Without a call, the factory draws 7, and 7 more if the rule stays.
2. **S1's texture budget.** S1 will load about 30 distinct cards (38 with 14 saplings); the gate loads about 20 for
   18.3 MB of panels and cards against the 24 MB budget.
   - Ship the sapling and hedge cards small (≤ 512 px tall), and run `budget_check.mjs countryside` as soon as the
     cards land.
   - A budget raise for the countryside, whose content is its trees, may be the lead's call.
3. **The stump.** `S4b.tree.stump_14805` is a solid stump with no crown. S4b builds it as kit geometry, and its
   assignment is `{"card": "kit"}`, which `check` must accept. That is a small change to `tree_cards.mjs` in order (b).

## 6. Kit parts and set pieces, by owner

### Each area's own kit (the area builds it)

| area | kit file | new parts (the needs lists give each with its map IDs and crops) |
|---|---|---|
| S7 | `blender/kit_city_end.py` (exists: `lozenge_tablet`, `wall_board`, `tall_signboard`, `medicine_rack`, `armchair`, `footrest`, `lattice_stand`, `plain_leaf`, `low_partition`, `patterned_front`, `roof_vent`, `slatted_tub`, `hooped_bucket`, `braced_stand`, `reed_panel`, `box_shed`, `capped_rail_fence`) | its sign atlas `signs_city_end`; the 解 building's post-and-bar arm; whatever its builder still lacks |
| S4b | `blender/kit_outer_road_2.py` (exists: `palm_cart`, `chair`, `pole_frame_basket`, `timber_pile`, `striped_load`, `tool_on_ground`, `sieve_basket`, `two_tier_stall`, `goods_on_mat`, `tray`, `counter_frame`, `big_jar`, `funnel_vessel`, `fan_shade`, `slatted_frame`, `straw_heap`, `mooring_post`, `fringed_canopy`, `kingpost_gable`, `roof_hatch`, `south_row_hall`, `open_mat_shed`, `hall`, `valance`) | `stump_14805` (a soft gnarled trunk with moss dots); the diamond and lattice tile swatches |
| S3 | **`blender/kit_rainbow_bridge_area.py`** (the name proposed here: `kit_rainbow_bridge.py` is the factory's bridge module, imported, never edited) | **the 彩楼欢门** (`S3.str.cailou_huanmen_16880`, set piece): `kit_inner_city.cailou(flowers=(), streamers=(), lanterns=())` with a new spire of bound poles and cross-ties, standing on the gate's roof. Also:<br>• the riverside hall's balcony and side gallery (平坐);<br>• the gate's 垂柱 and red fascia;<br>• the crossed-bar 杈子;<br>• **the 新酒 pole** (bird vane, bar, banded banner);<br>• the lattice-stiffened mat awning;<br>• the bottle stand, the hardware display board and the goods pole;<br>• the parasol's vase-shaped runner;<br>• the star ornaments;<br>• the slanted board;<br>• the far-bank hall (on `kit_common.stilt_deck`);<br>• the `handcart`;<br>• the mooring post's box lamp (on `kit_common.mooring_stake`);<br>• the hooks under the arch;<br>• its sign atlas (腳店, 十千, 新酒, □) |
| S2 | `blender/kit_canal.py` | **the 望火楼** (set piece: brick-coursed platform, wooden stair, baluster rail, pyramidal pavilion). Also:<br>• 望楼饭铺 (on `kit_common` thatch);<br>• the riverside terrace and the jetty (on `stilt_deck`);<br>• the landing steps;<br>• the pole frame of ladders and the pennant frame;<br>• the railed stair, the pole stack and the swept mat awning;<br>• the warehouse's plank-faced platform with capped posts;<br>• crossed-leg folding seats;<br>• slatted shutters and a scalloped valance;<br>• fish-scale tiles;<br>• sack piles, the free-standing rope coil and the free-standing ladder;<br>• the round-top cart;<br>• `stick_bundle`;<br>• its sign atlas |
| S1 | `blender/kit_countryside.py` (started: ground and set pieces) | **the thatched farmhouses and the threshing floor** (set pieces; the thatch gablet and the lean-to come from `kit_common`). Also:<br>• the tiled farmstead's veranda and board-walled wing (on `kit_common.board_wall`);<br>• the turf bridge;<br>• wattle and brush fences;<br>• the stone roller and the domed haystack;<br>• `post_crossbar`, the tied jar cover, the sawhorse and `nest`;<br>• the `trough_barrow` and the sedan's `willow_spray`;<br>• the ground and fields |

Already built in another area's kit: import it read-only. That is the practice since `outer_road_scene` imported
`kit_inner_city`.
- S3 and S2 import from `kit_city_end`: `armchair`, `lattice_stand`, `tall_signboard`, `plain_leaf`, `low_partition`,
  `patterned_front`, `roof_vent`, `slatted_tub`, `braced_stand`, `box_shed`, `capped_rail_fence`, and
  `hooped_bucket` (as a reference for the prop).
- S3, S2 and S1 import from `kit_outer_road_2`: `chair`, `big_jar`, `sieve_basket`, `straw_heap`, `timber_pile`,
  `open_mat_shed`, `kingpost_gable`, `south_row_hall`, `valance`, `mooring_post`, `two_tier_stall`, `tray`.

Ask the owning area for any change to these, never edit them.

### Shared parts (factory (c); a new shared module `blender/kit_common.py`)

These are parts several areas need that no kit has. The signatures in order (c) are fixed now, so the areas stub them.

| part | areas and entities |
|---|---|
| `thatch_gablet`: a small pale gable vent with a king post set into a thatch roof's hip end | S1 farmhouse_gable_33670, farmhouse_thatched_33955, barn_open_34860, farmhouse_long_34950 (if thatch); S2 wanglou_shed_28660 |
| `thatch_lean_to`: a single-slope thatched roof (a skirt along a front, or an open shed on posts) with a ragged fringe | S1 stall_annex_29350, shed_posts_31370, farmhouse_thatched_34600's west wing, posts_35075 (lean-to reading); S2 wanglou_shed_28660's skirt |
| `stilt_deck`: a plank deck on round posts over a sloping bank, with an optional rail or slat fascia | S3 far_bank_hall_18520; S2 river_terrace_23250, jetty_27260 |
| `swag_curtain`: a cloth hung from a beam and gathered into a tied swag at one end, optionally striped | S3 tavern_gate_16870 (striped, tied at the east post); S2 open_shop_25340 |
| `board_wall`: vertical boards with battens and ragged feet, optional door-like panels | S1 farmhouse_wing_30190; S3 mat_shed_19530, far_bank_hall_18520's east end |
| `mooring_stake`: a thin tapered post or pole, its top plain, knobbed, knotted with rope, coiled with rope, or carrying a box lamp; it returns the rope point for the boat kit's lines | S2 mooring_stake_27902, mooring_post_23126 (knot), mooring_post_rope_28272 (coil); S1 mooring_pole_36444; S3 mooring_post_17702 (lamp) |

**Set pieces:** none goes to a factory. The 彩楼欢门 stays in S3's kit, the 望火楼 in S2's, and the thatched farmhouse
and threshing floor in S1's. Only the thatch's gablet and lean-to are shared, because S2's 望楼饭铺 needs them too.

## 7. Casting overview

Counts as each needs list casts its figures today, then after the new characters land. The recast of S3
`official_black_robe_17940` to the fortune-teller is included.

| area | figures | cast now (needs list) | after the new characters |
|---|---|---|---|
| S7 | 17 | idler 3, inspector 2, townsman 2, woman 2, child 2, robed_man 1, scholar 1, camel_driver 1, porter 1, fortune_teller 1, hat_traveller 1 | idler 2, dark_hat 2, townsman 2, groom 2, woman_pale 2, child 2, robed_man, scholar, camel_driver, official_rider, fortune_teller 1 each |
| S4b | 66 | idler 13, scholar 10, porter 9, robed_man 8, townsman 6, sightseer 4, child 3, carter 3, inspector 3, hat_traveller 3, official, storyteller, child_robed, camel_driver 1 each | idler 10, scholar 10, robed_man 8, townsman 6, grain_porter 5, porter 4, sightseer 4, boatman 3, child 3, carter 3, inspector 3, official_rider 2, straw_hat, official, storyteller, youth, camel_driver 1 each |
| S3 | 232 | idler 51, porter 40, robed_man 26, townsman 23, carter 18, scholar 17, inspector 11, camel_driver 10, hat_traveller 10, sightseer 8, child 4, bearer 3, fortune_teller 3, butcher 2, woman 2, child_robed, elder, official, storyteller 1 each | boatman 35, idler 27, robed_man 26, porter 25, townsman 23, scholar 17, carter 13, inspector 11, camel_driver 10, sightseer 8, dark_hat 6, tracker 5, fortune_teller 4, straw_hat 3, bearer 3, and 2 or fewer of the rest |
| S2 | 140 | idler 28, porter 24, carter 13, robed_man 12, scholar 12, townsman 10, camel_driver 9, hat_traveller 7, inspector 6, child 5, sightseer 4, woman 3, storyteller 2, fortune_teller 2, child_robed, official, butcher 1 each | boatman 38, robed_man 12, scholar 12, idler 9, townsman 9, camel_driver 9, grain_porter 8, straw_hat 6, inspector 6, carter 5, tracker 4, child 4, sightseer 4, woman 3, and 2 or fewer of the rest |
| S1 | 30 | idler 5, hat_traveller 4, porter 4, bearer 3, townsman 3, carter 2, camel_driver 2, robed_man 2, scholar 2, soldier, inspector, child_robed 1 each | farmer 9, porter 4, straw_hat 3, groom 3, townsman 2, robed_man 2, bearer 2, camel_driver, scholar, child_robed, idler, hat_traveller 1 each |

**Over about a third:**
- Nothing today. The largest shares are S3's idler at 22%, S2's at 20% and S4b's at 20%.
- After the new characters: S1's farmer 9 of 30 (30%, seven of them far, tiny and conf low), and S2's boatman 38 of 140
  (27%, spread over 17 boats). The six S2 crew kept on other casts (1b) hold the boatman under a third.

**Dress that clearly disagrees with the stand-in, today:** every figure in the new characters' lists above, for the
reason given with each character. These are the strongest cases:
- S7 `official_rider_1610` on the hat traveller;
- S3's six dark-hatted men on the hat traveller;
- the 76 crews on town labourers;
- S1's farmer with a hoe on the scholar;
- the youths on the child scaled up;
- S3 `official_black_robe_17940` on the warm-grey official (recast free to the fortune-teller).

Smaller ones that stay on their cast:
- S7 `folded_object_bearer_1490` (a futou with upturned flaps, on the townsman);
- S4b `bearded_onlooker_13350` (a dark cap on the capless robed man);
- S2's four labourers in brimmed hats (straw_hat in time).

**For the area agents:**
- Cast as now. When a delivery lands, rerun `make_people.py`, swap the stand-ins by these lists, and run
  `clips_used.mjs`.
- A child in a carried pose, seated figures' seat heights, and walkers are as the needs lists say.

## 8. Factory orders

### (a) The workshop: characters, takes, retargets, animals, carried props

Work down this list in order, as far as the credits go. Free items need no credits.

1. **Retargets** (2a): the 92 clips onto the interim casts, then `build` (cached), `node tools/ktx2.mjs encode` and
   `check`, and `node tools/clips_used.mjs`.
2. **Animals** (2c):
   - `donkey_dark`, `horse_dark`, `buffalo` (with `horns_swept`);
   - the tack `saddle_fringe`, `saddle_dark`, `girth_cloth`, `pack_heap_dark`, `pack_bale`, `halter`,
     `halter_breeching`;
   - the donkey's `walk_low`;
   - the horse's `gallop` only if the lead says the runaway horse is built.
   - Optional: `ox_longhorn`, `bird_pale`, the donkey's `balk`.
3. **Props** (2d): the new geometry in the table's order, then the placements.
4. **Optional recolours** (2e), and the record fix (2b).
5. **Paid items 1–46** in the order of 1a. On the first account that is items 1–9, 11 and 12, 150 credits.
   - Before each character:
     - `tools/meshy_key.sh status` must show at least 30 on the key in use;
     - write `characters/<name>.json` (figure with `"src": "scan"`, `account`, `height_m`) and
       `prompts/char_<name>.txt`;
     - run `ref`, `sheet`, `views`, and **read `views.jpg` against the scan crop before `mesh`**.
   - Characters: boatman 1.70 m, grain_porter 1.68, straw_hat 1.70, dark_hat 1.70, tracker 1.68, farmer 1.66,
     groom 1.68, youth 1.45, official_rider 1.74, woman_pale 1.56.
   - Before each paid step, use `--dry-run`.
   - Takes: `prompts/motion_<take>.txt` from 1c, and the entry in `characters/motions.json`. Then `t2m:` onto every
     character in its "→" column, plus the new characters as they land.
   - Each retake allowance is spent on the first take whose frame sheet fails; an unspent allowance passes to the next
     item.
   - When the first key is spent, `tools/meshy_key.sh retire`. The user adds the next key to `~/.meshy_keys` (line 2
     becomes line 1); go on at item 10. Never switch keys inside a character.
   - The buffalo body (item 46) only after the free buffalo has been judged on `web/creatures.html`.

**Files it may write:**
- `characters/<new>.json` and `prompts/char_<new>.txt`.
- `characters/<existing>.json`: `clips` only; never `figure`, `prompt`, `account` or `height_m`.
- `characters/motions.json`, `prompts/motion_<take>.txt`, `characters/props.json`, `characters/notes.md`.
- `blender/char_props.py`.
- `animals/<new variant>.json`, `animals/<type>.json` (`tack` and `clips` entries), `animals/notes.md`.
- `blender/rig_quadruped.py`: tack kinds, procedural clips, rigid horns.
- `gen/characters/`, `gen/motions/`, `gen/props/`, `gen/animals/`, `gen/meshy_previews/`.
- Through the tools only: `web/public/assets/chars/`, `web/public/assets/animals/`, `web/public/assets/ktx2/`.
- For the optional recolour only: an additive variant step in `tools/build_character.mjs`.
- Never: `sections/`, any `people.json`, the kits, `web/src/`, other tools.

**Checks:**
- Every take's frame sheet (`node tools/clip_sheet.mjs <base> <name> <clips> --side`), read before the take is used.
  Take again when the motion is small, stiff or wrong.
- Every new character's `views.jpg` against its crop; `gen/characters/review.jpg` after each.
- Every new prop's `blender/char_props.py -- review` renders at several times.
- Animals: `node tools/animal.mjs <type> frames --move` and `web/creatures.html?tack=…`.
- `node tools/ktx2.mjs encode` then `check` PASS after every build.
- GLBs about 1 MB or less: trim with `clips_used.mjs`.
- Record in `characters/notes.md` what was made, every credit spent per account, and every retake and why.
- Tell the lead after each character and each block of takes. The areas recast from the lists in 1b.

### (b) Tree cards

**Items:**
- The 19 new cards of section 5, in this order:
  1. `willow_burl_4`–`_7`;
  2. `elm_claw_5`, `_6`;
  3. `slender_5`–`_7`;
  4. `sapling_1`–`_7` (and `_8`–`_14` if the lead keeps the check as it is);
  5. `bamboo_6`;
  6. `willow_weep_1`;
  7. `hedge_1`.
- New forms `willow_weep`, `sapling` and `hedge` in `trees/cards.json`, with `prompts/tree_<form>.txt`. New variants are
  `[n]` blocks in the existing forms' prompts; never edit a form body whose other cards are good.
- Then the assignments for all 150 trees: `trees/assign/S7.json`, `S4b.json`, `S3.json`, `S2.json`, `S1.json`.
  - Form, variant and flip come from each tree's `what`, the needs list's suggested card and its lean.
  - S1's two far bushes go on `whip_clump_1` and `leafy_1`; S4b's stump is `{"card": "kit"}`.

**Files:**
- `trees/cards.json`, `prompts/tree_<form>.txt`, `trees/assign/{S7,S4b,S3,S2,S1}.json`, `trees/types.md`,
  `trees/notes.md`.
- `gen/trees/`.
- Through the tool: `web/public/assets/trees/` and its KTX2 copies.
- `tools/tree_cards.mjs`, only to accept `"card": "kit"`, and the height-scaled radii if the lead approves them.
- Never: the layouts. The areas rerun `node tools/map_layout.mjs <S>` and `export_web_scene.mjs`; tell them when the
  assignments land.

**Checks:**
- Read `gen/trees/check/form_<form>.jpg` (the scan beside the cards) and each card's check image; then the sheet.
- Redraw any card that reads as another species, a weeping summer willow (except `willow_weep`, bare), a blob or a
  sticker.
- Willows: use the notes' wording ("NOT a weeping willow…") everywhere but `willow_weep`.
- Ship at ≤ 160 KB, and sapling and hedge cards ≤ 512 px tall.
- `node tools/tree_cards.mjs check` PASS over every section (S4–S6 included).
- `node tools/ktx2.mjs encode` and `check`.
- Run `node tools/budget_check.mjs countryside` (texture) as soon as S1's cards land.
- About two draws per card on shyfai: about 40 images for 19 cards.

### (c) Vehicles and shared kit parts

**Items:** first the vehicles, then the shared parts, then the boat options. Signatures are fixed here, so the areas
stub them now.

**c1. `blender/kit_vehicles.py`.** Add these; every existing call keeps its default behaviour.
```python
def barrow_load(front, rear, wheels=None, z_of=None, rng=None, load="hoops", held=True, R=0.6, spokes=14,
                frame_w=0.86, deck_len=1.9) -> int
    # the 串车's barrow (_barrow) with load "hoops" (bare barrel_cover hoops over bundles and a rolled mat:
    # S3.veh.barrow_hooped_load_18100) or "crates" (two lattice crates, the rear one higher: S2.veh.barrow_crates_25598)
def sedan_chair(..., front="curtain", roof="concave", finial=True)
    # new kwargs: front "closed" (boarded, a lattice window, no curtain: S3.veh.sedan_18842, S1.veh.sedan_willow_30805);
    # roof "round" (S3)
def barrow_screen(..., stakes=False, poles=False, panel=False)
    # S3.veh.chuanche_17775: stakes at the west end; two long poles east from the load's top with rope loops and a hook;
    # a ribbed woven panel at the north-east
def open_cart(front, rear, wheels=None, team=None, z_of=None, rng=None, load="mat_bundle", prop_stick=True, R=0.68,
              spokes=16, bed_len=2.4, bed_w=1.25, rails_past=0.4) -> Built   # .bed = (x, y, z) top of the bed
    # S2.veh.mule_cart_24305: open bed, rails past the rear, a tilted mat-covered bundle over a straw heap, a prop stick
    # under the rear, the team (mules) on long rope traces to the bed's front, no shafts
```

**c2. `blender/kit_common.py`** (new). Its conventions are `song_kit`'s:
- faces go into `sb.B`; it never opens an entity;
- positions come from the caller; sizes are `choice:` defaults;
- it returns the triangles added.

```python
def thatch_gablet(apex, foot_l, foot_r, depth, rng, kingpost=True, mat=STRAW) -> int
def thatch_lean_to(p0, p1, depth, z_low, z_high, rng, posts=0, fringe=True, side=1, thick=0.22, mat=STRAW) -> int
def stilt_deck(outline, deck_z, rng, z_of, post_every=1.8, rail=None, fascia=None, collide=True) -> int
    # rail / fascia: (edge indices, "balusters" | "slats")
def swag_curtain(top_a, top_b, z_top, z_hem, rng, gather="b", tie_z=None, stripes=0, mat="cloth_indigo") -> int
def board_wall(p0, p1, z0, z1, rng, battens=2, ragged=True, doors=(), mat="timber", collide=True) -> int
def mooring_stake(x, y, z_foot, z_top, rng, r=0.06, top="taper", rope=None, lamp=False) -> tuple  # the rope point
    # top "taper" | "knob"; rope None | "turns" | "knot" | "coil"
```
`STRAW` is `kit_outer_road.STRAW`, so the thatch matches `thatch_roof`.

**c3. `blender/kit_boats.py`.** Add options B1–B11 of section 4, in that order; existing presets build unchanged. Then
correct `gen/boats/types.md`'s inventory to the maps (the needs lists give every mismatch by number).

**Files:**
- `blender/kit_vehicles.py`, `blender/kit_common.py` (new), `blender/kit_boats.py`.
- `gen/vehicles/`, `gen/kit_common/` (reviews), `gen/boats/` (reviews, exports, `types.md`).
- Never: the area kits, the scene builders, `song_kit.py`, `web/src/`.

**Checks:**
- Kit vehicles: `tools/blender_slot.sh -b --factory-startup --python <abs>/blender/kit_vehicles.py -- review <abs out>
  [types]` with the real animals at the team spots, for each new type and kwarg. Read every render beside its scan crop.
  Print the triangles per type: carts about 2–6k, the barrows less.
- Kit common: a review render per part (`gen/kit_common/review/`), Freestyle ink on. No plain boxes, no ruled edges.
  Report triangles and colliders.
- Kit boats: `tools/blender_slot.sh … kit_boats.py -- review` and `-- export` for every preset with its new options,
  at `lod=0` and `lod=1`.
  - Keep the budgets: a big boat 6.4–6.8k at lod 0.
  - Rebuild each line from its end points in the shipped GLB (0.000 m).
  - Run `boat_from_layout` on every area's boat entity with the options it needs (a list of the 35 in section 4).
- Rebuild the finished S5, S6 and S4 headless (`tools/build_scene.sh gate|inner_city|outer_road`) and diff
  `placed.json` triangles per owner: no change outside the new options.
- Tell the lead and the five area agents when each of c1, c2 and c3 lands.
