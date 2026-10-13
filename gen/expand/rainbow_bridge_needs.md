# The Rainbow Bridge (S3, u 15500–20500): what the workshop needs to make

From the S3 needs agent, Run 1 of round 2 (2026-10-12), for the lead's catalogue agent. Every item comes from the
scroll map. `map/text/S3.md` says where each thing is and what it does, and `sections/rainbow_bridge/layout.json`
holds the positions: 467 entities after the merge, the second pass and the frame, of which 232 are figures and 11
boats. Figures are named by their slug (`S3.fig.<slug>`). Crops are scan px `[u0, v0, u1, v1]`. Read the scan with
`node tools/scroll_inspect.mjs rainbow_bridge <u> <v> <half>`, but use only its left (scan) panel east of u ≈ 17900:
the restyle recomposes the bridge, moves the big boat, and paints the moored boat as roofs
(`sections/rainbow_bridge/notes.md`). The crops this file names are in the scratchpad folder `S3_needs/`.

**Real size** (`map/BUILDING.md` rule 5): every person, animal, cart and boat is made at real size; only positions come
from the map. Painted heights here are not sizes. The street's figures are 152–208 px, and the men at the bridge's
south foot reach 230 px. The deck crowd is 95–146 px. The unloading boat's crew is 110–135 px (0.72 of the street), and
the mid-river crews 62–90 px (0.4). The open shop's interior at the bottom edge is 78–82 px (0.43), and the far bank
45–70 px (0.22–0.35). Children's scales below are measured against the adults painted beside them.

**Credits.** Meshy has about 151 credits left for the whole round (`gen/expand/round2_progress.md`). **S3 needs no new
character:** all 232 figures are cast from the 22 existing ones, and every clip they play now is either their own or a
free local retarget (`tools/retarget_local.mjs`, `from:` or `t2m:`). The paid items are optional:
- the new Text to Motion takes ranked below (10 credits each). Every figure that wants one has a stand-in clip now;
- one optional new character, the **boatman** (about 30 credits), below.

## Casting: 232 figures, all from the existing 22

| character | figures | | character | figures |
|---|---|---|---|---|
| idler | 51 (18 crew) | | camel_driver | 10 |
| porter | 40 (12 crew) | | hat_traveller | 10 (1 crew) |
| robed_man | 26 | | sightseer | 8 |
| townsman | 23 | | child | 4 (scaled 0.6–0.85) |
| carter | 18 (4 crew) | | bearer, fortune_teller | 3 each |
| scholar | 17 | | butcher, woman | 2 each (1 butcher crew) |
| inspector | 11 | | child_robed, elder, official, storyteller | 1 each |

Confidence: 36 high, 128 med and 68 low. Where a low figure has another reading (a jar, a post, a curtain, an animal),
that reading is in its line, and the figure is cast anyway: the lead decides whether it is built.

**Where they stand:** 102 on the ground, 73 on the bridge deck, 48 on boats, 7 on the upper floor of 十千脚店's
riverside hall and 2 riding. The 48 on boats are 36 crew, the 6 porters unloading at the south bank and 6 passengers.

**The dress decides the cast**, as on S4b:
- short jackets and trousers are the idler or the porter;
- long light robes with a dark cap are the scholar;
- a light robe without a cap is the robed man;
- dark long robes are the townsman, the inspector or the fortune-teller;
- wide hats are the hat traveller;
- an apron over a short jacket is the butcher.

The faint figures whose dress can't be read went to the carter and the camel driver, so that the idler doesn't play 68.
On the bridge's south ramp the restyle is unusable, so no colour reading was used anywhere east of u 17900.

**The one character worth making (optional, about 30 credits): the boatman.** He would play S3's 36 crew (marked
`[boatman]` below), S4b's five crew and S2's crews, about 40 figures across S3 and S4b alone. Today they are idlers,
porters and carters, which repeat visibly when 19 of them work one boat.
- **Model:** `man_waving_on_boat_roof_19952`, crop [19895, 925, 20010, 1110] (`S3_needs/crop_waver_19952.jpg`). He is
  the crews' only full-length figure painted at street size (155 px): a knotted dark head-cloth, a short jacket belted
  over a wrapped apron or kilt, trousers and bare shins. He is seen from behind, so ask the sheet for his front.
- **Front reference:** `boatman_capped_19800`, crop [19760, 465, 19850, 615] (`S3_needs/crop_boatman_19800.jpg`). He
  stands face on in a small cap with a long pleated apron.
- If he isn't made, the crews stay as cast: the idler and the porter are the same short-jacketed labourers, and the
  butcher's apron stands in for `boatman_capped_19800`'s.

**Clips to add, all free** (local retarget, no credits). Run `node tools/clips_used.mjs` after casting.
- **idler:** `bend_goods` (`from:inspector/bend_goods`), `sleep_side` (`from:soldier/sleep_side`), `steer`
  (`from:carter/steer`), `stand_pole` (`from:porter/stand_pole`), `lean_over` (`from:inspector/lean_over`),
  `arms_folded` (`from:inspector/arms_folded`), `reach` (`from:child/reach`).
- **porter:** `look` (`from:townsman/look`), `push` (`from:idler/push`), `point` (`from:idler/point`), `lean_over`,
  `crouch` (`from:idler/crouch`), `crane` (`from:idler/crane`), `back_load` (`from:townsman/back_load`), `bend_goods`,
  `sit_floor` (`from:idler/sit_floor`).
- **robed_man:** `sit_talk` (`from:official/sit_talk`), `drink` (`from:scholar/drink`), `hail` (`from:idler/hail`),
  `bend_goods`, `lean_chin` (`from:idler/lean_chin`), `sit` (trimmed earlier, back from `from:scholar/sit`), `look`,
  `point`, `back_load`, `carry_pole` (`from:porter/carry_pole`).
- **townsman:** `sit`, `lean_over`, `hail`.
- **carter:** `hold_rope` (`from:robed_man/hold_rope`), `stand_pole`, `tie_kerchief` (`from:idler/tie_kerchief`).
- **scholar:** `lean_chin`, `lean_over`, `ride` (`from:carter/ride`), `sit_talk`, `sit_listen` (`t2m:sit_listen`).
- **camel_driver:** `sit_floor`, `sit`, `bend_goods`.
- **hat_traveller:** `stand_pole`, `lean_over`, `point`, `talk` (trimmed earlier, back), `carry_pole`, `sit`.
- **child:** `crouch`. **child_robed:** `reach`. **fortune_teller:** `look`, `talk`. **butcher:** `hold_tray`
  (`from:porter/hold_tray`). **woman:** `look`. **elder:** `arms_folded`. **storyteller:** `sit`.

Each line below reads: the figure, the clip it plays now ("until" the take it waits for), its carried props, then its
dress and action. Non-ground supports carry their H in metres from `layout.json`. The bridge deck's supports are bands
measured west of the painted near edge (`map/frames/S3.json`).

### idler (51)

- `boatman_stern_bending_20365`: `bend_goods` [boatman]. Cap, bending forward over a box at the stern rail, reaching down east toward the rudder's lines (`boat roof: boat_mast_lowering_19518`, H 2.29).
- `boatman_stern_seated_20285`: `sit_one_knee` [boatman]. Dark hair, kneeling or seated behind a box or windlass frame on the poop, facing us, hands at the frame (`boat roof: boat_mast_lowering_19518`, H 2.29).
- `man_in_hatch_20172`: `look` [boatman]. A second dark head in the hatch, looking north; body hidden (`boat deck: boat_moored_south_bank_19745`, H 0.4).
- `man_reclining_waving_20060`: `sleep_side` until `lie_wave` [boatman]. Half lying on his back on the roof, head west, right arm raised high waving to the big boat (上下呼救) (`boat roof: boat_moored_south_bank_19745`, H 0.48).
- `boatman_crouching_20026`: `crouch` [boatman]. Crouching under the deckhouse roof's east end, hands together at a rope or pole (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `boatman_under_mat_roof_19955`: `look` [boatman]. Under the deckhouse's low mat roof, face turned out toward us (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `man_waving_on_boat_roof_19952`: `hail` until `wave_arms` [boatman]. Short belted jacket over a wrapped apron, trousers, knotted head-cloth, standing on the mat roof half turned from us, both arms raised high, waving and shouting to the big boat (上下呼救); the boatman's model figure (`boat roof: boat_moored_south_bank_19745`, H 0.48).
- `rail_watcher_19892`: `lean_chin`. Dark cap, leaning on the north ramp's near railing, face turned down to the big boat; the middle of three (`bridge deck`, H 1.6).
- `cart_puller_19870`: `steer`. Dark cap, short jacket and trousers, between the handcart's shaft tips leaning west with his arms back on the shafts, hauling it.
- `boatman_both_arms_pole_19840`: `stand_pole` until `fend_pole`, props `long_pole` [boatman]. Big, topknot, standing amidships with both arms raised gripping a pole that slants up north-west to the arch, head turned east to the mast (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `boatman_bending_pole_19746`: `push` until `pole_boat`, props `long_pole` [boatman]. Big, bare head, bending over the near gunwale with his face to us, both hands driving a pole down into the river (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `boatman_leaning_on_bundle_19650`: `lean_over` [boatman]. Lying forward over the long bundle on the forward deck, one arm stretched west (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `far_shopkeeper_19620`: `lean_chin`. Far, dark cap, leaning forward over the long counter `far_counter_19555` from behind it, face to us.
- `deck_rail_leaner_19578`: `lean_over` until `reach_over_rail`. Dark cap and short jacket, at the crown, bending over the railing with both arms reaching down to the rail, looking down at the crew (`bridge deck: 50 px west of the near edge`, H 4.45).
- `bowman_arm_out_19565`: `point` [boatman]. Short jacket, at the bow behind the windlass, leaning forward, right arm out west toward the bridge, shouting (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `man_lowering_rope_19295`: `lean_over` until `reach_over_rail`. Light jacket, bent far over the near railing at the crown, head down, both arms hanging over toward the boat as if lowering or throwing a rope (no rope is painted) (`bridge deck: 100 px west of the near edge`, H 5.42).
- `man_leaning_on_railing_19225`: `lean_chin`. Low: dark cap and light jacket, leaning forward over the near railing, face turned west and down (`bridge deck: 100 px west of the near edge`, H 5.44).
- `man_behind_rump_19165`: `idle`. Low: topknot and light jacket, on the far side of the horse's rump near the tall far post, face east (one of the horseman's party) (`bridge deck: 300 px west of the near edge`, H 5.26).
- `groom_holding_horse_19095`: `bridle` until `hold_horse_neck`. Light short jacket and trousers, leaning into the horse's chest with both arms round its lowered neck, holding it back, head pressed to its neck, face west to the sedan (`bridge deck: 350 px west of the near edge`, H 5.31).
- `man_head_bowed_18962`: `lean_chin`. Low: dark hair, at the south end of the railing, head bowed, looking down east (`bridge deck: 100 px west of the near edge`, H 4.38).
- `awning_worker_18815`: `browse`. Dark cap, bending under the east mat awning with both arms reaching east to the slatted rack `awning_rack_18797` (its keeper?) (`bridge deck: 100 px west of the near edge`, H 2.53).
- `light_jacket_man_18812`: `arms_folded`. Light short jacket, dark cap, trousers, standing in the ramp crowd facing us, arms folded at his chest (`bridge deck: 500 px west of the near edge`, H 5.44).
- `man_light_jacket_18760`: `walk`. Light jacket and dark hair, back to us; walker, north to the east mat awning (`bridge deck: 150 px west of the near edge`, H 2.44).
- `donkey_man_west_18728`: `bridle`. Dark short jacket and dark cap, bending over the dark donkey's neck with his hands down at its head (holding or calming it) (`bridge deck: 600 px west of the near edge`, H 5.44).
- `leaning_man_arms_out_18703`: `push`. Light short jacket and dark cap, at the ramp crowd's north side, leaning west with both arms out before him, reaching for or pushing at the bowing man (`bridge deck: 550 px west of the near edge`, H 5.4).
- `groom_at_donkey_18682`: `lead`. Dark hair, walking at the ridden donkey's head on its east side; walker, east with the donkey (`bridge deck: 200 px west of the near edge`, H 1.86).
- `donkey_walker_18481`: `walk`. Light short jacket and trousers, dark hair, striding east and toward us just west of the pack donkey seen from behind, driving it; walker, east with the donkey.
- `bending_dark_top_18345`: `bend_goods`. Dark short top, bending forward and down to the west, south of the round tray (`bridge deck: 550 px west of the near edge`, H 2.14).
- `bending_man_18305`: `bend_goods`. Dark short jacket, hair in a knot, bent forward west with his hands low (holding a stick or a pole's end), at the tray stall's north-west by the water (`bridge deck: 650 px west of the near edge`, H 3.18).
- `parasol_edge_crouching_18288`: `crouch`. Low: dark hair, crouching or seated at the big parasol's north-east rim, bending east (`bridge deck: 600 px west of the near edge`, H 2).
- `mat_leaner_white_18220`: `lean_over`. Low: white short jacket and dark hair, leaning west over the east end of the unloading boat's mat cover, both arms forward lifting or pulling at the cargo (he stands on the ramp's far edge) (`bridge deck: 700 px west of the near edge`, H 2.61).
- `reaching_man_18062`: `reach`. Low: light top and dark cap, between the seller and the bearded man, reaching east with one arm to the barrow's load.
- `man_behind_official_17982`: `look`. Light jacket, just east of and behind the black-robed man, looking down at the stall.
- `man_seen_from_behind_17865`: `sit`. Black hair (no cap) and light jacket, seated at the food stand's south-east side with his back to us, leaning in to the tray.
- `porter_standing_17860`: `look`. Topknot or cap, standing on the foredeck, head turned west to the bow (`boat deck: boat_unloading_17705`, H 0.21).
- `hooded_figure_17848`: `idle`. A pale hood or kerchief, behind the food stand between the seated man and the man in the dark cap (a woman is possible: the catalogue's call).
- `porter_hunched_17808`: `bend_goods`. Dark jacket, hunched forward behind the first, leaning toward the bow, hands low (`boat deck: boat_unloading_17705`, H 0.21).
- `squatting_man_17768`: `crouch`. Dark hair in a topknot, light short jacket, squatting under the canopy's front edge, leaning west, holding something small out in his right hand to the jar table.
- `far_bank_crouching_17696`: `squat_sleeves`. Far, dark cap, crouching or sitting hunched on a plank beside the basin at a far-bank shop front.
- `topknot_man_at_cart_17458`: `push_flank`. Topknot, light jacket with a dark apron or sash, at the 串车's west (handle) end looking down, gripping a big dark shaggy bundle on the load, right arm bent west.
- `parasol_stallkeeper_17445`: `idle`. Only his light trousers and feet show behind the stall table's east end under the parasol's canopy.
- `awning_boatman_17435`: `sit_floor` [boatman]. Low: a hunched shape with a bowed head under the awning boat's fore awning, among the poles and ropes (other reading: a heap of cargo or coiled rope, then no figure) (`boat deck: boat_awning_17442`, H -0.44).
- `tracker_16423`: `push` until `tow_walk`. 纤夫, the leading man of the file: short working clothes, bent far forward leaning east into the tow line, walking up the far-bank path east-north-east; walks with his boat.
- `tracker_16385`: `push` until `tow_walk`. 纤夫, the middle man of the file; walks with his boat.
- `tracker_16333`: `push` until `tow_walk`. 纤夫, the rear man: the tow line from the towed boat's masthead (16075, 45) is made fast to him at (16325, 112); walks with his boat.
- `boatman_poling_16198`: `push` until `pole_boat`, props `long_pole` [boatman]. At the towed boat's bow, a long pole down into the water ahead of the bow (its foot at about (16245, 308)), fending or punting while the trackers pull (`boat deck: boat_towed_mast_16228`, H -0.05).
- `boatman_on_cargo_16032`: `crouch` [boatman]. Low: faint: a small dark figure crouching on top of the cargo near the masthead's stays, at the high stern (other reading: a knot of rigging) (`boat deck: boat_towed_mast_16228`, H -0.05).
- `sweep_man_15915`: `push` until `work_sweep` [boatman]. Crouching at the stern rail by the sweep's pivot, both hands on the loom (摇橹向前) (`boat deck: boat_under_way_15595`, H -0.13).
- `sweep_man_15855`: `push` until `work_sweep` [boatman]. Low: faint, bent low in a pale jacket under the others at the loom (`boat deck: boat_under_way_15595`, H -0.13).
- `sweep_man_15810`: `push` until `work_sweep` [boatman]. Pale jacket, standing upright at the stern, hands on the sweep's rope or loom (`boat deck: boat_under_way_15595`, H -0.13).
- `boatman_bow_15664`: `look` [boatman]. Short jacket and cap, standing at the bow beside the first, facing ahead (west) (`boat bow deck: boat_under_way_15595`, H 1.12).

### porter (40)

- `porter_with_pole_20450`: `carry_pole`, props `pole_bundle`. Outline only, pale clothes and trousers, striding west by the dark trunk with a long pole on his shoulder, a long pale sack and a staff hanging from its far end (a `pole_bundle` variant: long sack plus staff); walker, west.
- `boatman_cabin_door_pole_20300`: `stand_pole` until `fend_pole`, props `long_pole` [boatman]. Standing in the after cabin's south door, holding a long pole straight out east past the stern toward the north-bank boat (S2's) (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `man_in_hatch_20148`: `look` [boatman]. Dark hair, looking out of the hatch turned west to the wavers and the big boat; body hidden (`boat deck: boat_moored_south_bank_19745`, H 0.4).
- `shop_figure_hat_19972`: `idle`. Low: faint upright outline at the slanted board's east end with a pale oval with a dark rim at chest height: a wide hat or a bowl held in the hands (other reading: hat_traveller).
- `boatman_under_mat_roof_19970`: `look` [boatman]. Under the deckhouse's mat roof, looking out south (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `boatman_standing_pole_19892`: `stand_pole` until `pole_boat`, props `long_pole` [boatman]. Short jacket, standing at the near gunwale amidships, a long pole slanting down into the river (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `walker_topedge_19878`: `walk`, props `back_bundle`. Dark short jacket, walking along the north bank's back road at the silk's top edge, head cut off by the edge, a dark mass at his back (a bundle, or a second person's torso); walker, east.
- `boatman_bent_pole_19830`: `push` until `pole_boat`, props `long_pole` [boatman]. Bent double over the near gunwale, back up, pushing a pole down into the river (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `far_water_carrier_19720`: `carry_pole`, props `pole_buckets`. Far, walking with a shoulder pole and two banded wooden buckets on ropes; walker, west.
- `boatman_reaching_19681`: `point` [boatman]. Far side of the forward deck, leaning far forward with his arm stretched west toward the cabin boat, fending it off (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `deck_pole_holder_19625`: `lean_over` until `fend_pole`, props `long_pole`. Stocky, dark cap, at the crown, bent over the railing gripping a long pole (or a taut rope) held level across his body, ready to fend off or lower it to the boat; its far end isn't painted (`bridge deck`, H 4.48).
- `far_squatting_man_19618`: `crouch`. Far, squatting in front of the long counter, arms forward, working at something on the ground or resting.
- `bowman_arm_out_19583`: `point` [boatman]. Short jacket, at the bow beside the other bowman, leaning forward with his arm stretched west: the two point the way under the bridge (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `man_behind_railing_19258`: `crane`. Low: light jacket and dark cap, bending forward behind the railing crowd, face west; head and shoulders show (`bridge deck: 100 px west of the near edge`, H 5.43).
- `man_bent_over_railing_19195`: `lean_over` until `reach_over_rail`. Dark cap and light jacket, bent double over the near railing's top rail beside the basket carrier, head down, arms reaching over to the boat below the arch (`bridge deck: 50 px west of the near edge`, H 5.37).
- `basket_carrier_19138`: `hold_tray`, props `flat_basket`. Dark cap and light jacket, behind the near railing below the horse's rump, holding a big flat round woven basket (a winnowing-tray shape) tilted in front of his waist, looking east to the boat (`bridge deck: 150 px west of the near edge`, H 5.44).
- `man_white_headcloth_19050`: `look`. Low: light jacket and a pale head-cloth (or a bare pale head), seen from behind on the far side of the horse's neck, facing east to the crown (`bridge deck: 400 px west of the near edge`, H 5.3).
- `man_under_awning_18775`: `idle`. Dark cap and light jacket, at the east mat awning's south edge, facing us (`bridge deck: 100 px west of the near edge`, H 1.7).
- `donkey_man_east_18768`: `lean_over`. Low: light jacket and dark cap, back rounded, bending over the light bundle on the dark donkey's back (lifting or tying the load) (`bridge deck: 550 px west of the near edge`, H 5.44).
- `dark_head_ramp_foot_18720`: `idle`. Low: a round dark head (cap or hair) from behind in the crowd at the ramp's foot (`bridge deck: 150 px west of the near edge`, H 1.59).
- `light_jacket_man_18670`: `look`. Light jacket and dark hair, under the big parasol's west rim, head turned east.
- `man_wide_hat_18615`: `idle`. A dark cap or hat with a knot or brim sticking out east, under the twin parasols facing west; head and shoulders over the wall's north end (the parasol stall's seller, the 饮子 stall of the pin?).
- `porter_jar_bundle_18483`: `carry_pole`, props `pole_jar_bundle`. Short jacket and trousers, walking east toward us with a shoulder pole: a dark round jar in a rope sling at its west end, a tall bundle in a rope net at its east end; walker, east (`bridge deck: 400 px west of the near edge`, H 1.88).
- `black_hat_man_18458`: `hold_tray`, props `tray`. A black hat, light jacket and trousers, standing looking west, holding a flat oblong tray or board out to his east side (S4b's dark-hat variant would fit his hat).
- `tray_bender_18356`: `crouch`. Low: dark clothes, dark hair, bent low over the round food tray's south-west rim (serving or eating), face hidden (`bridge deck: 550 px west of the near edge`, H 2.36).
- `porter_two_baskets_18340`: `carry_pole`, props `pole_baskets`. Light jacket, bent under a shoulder pole with a round basket at each end (the rear on a three-rope sling, the front a deep round one); walker, east.
- `porter_baskets_bottom_18175`: `carry_pole`, props `pole_baskets`. Light jacket, short hair, bent forward with his mouth open, a shoulder pole with two big round baskets (one heaped with round things: melons or loaves); walker, east along the bottom edge.
- `porter_carrying_17922`: `back_load`, props `back_sack`. Standing upright at the east of the group on the unloading boat's foredeck, a bundle or sack on his shoulder and back, facing west (`boat deck: boat_unloading_17705`, H 0.21).
- `porter_standing_17886`: `idle`. Low: a face in profile between the others on the foredeck, half hidden (`boat deck: boat_unloading_17705`, H 0.21).
- `walker_with_stick_17884`: `stride_stick`, props `stick`. Young, topknot, light short jacket and dark trousers, striding west across the open ground, head turned west, left arm swinging out, a long stick in his right hand trailing down behind him; walker, west.
- `porter_standing_17833`: `look`. Light jacket and cap, standing in the foredeck group looking west over the bow (`boat deck: boat_unloading_17705`, H 0.21).
- `porter_bending_17790`: `bend_goods`. Short jacket, bent far forward at the bow, reaching down to the jars and bundles at its tip, head west (`boat deck: boat_unloading_17705`, H 0.21).
- `man_north_of_chuanche_17690`: `idle`, props `stick`. Dark hair, standing just north of the 串车's load, his upper body above it, holding a stick across in front of him.
- `tracker_16405`: `push` until `tow_walk`. 纤夫, the fourth man, bent low into the line; walks with his boat.
- `tracker_16358`: `push` until `tow_walk`. 纤夫, the second man from the rear; walks with his boat.
- `boatman_on_cargo_15998`: `crouch` [boatman]. Low: faint: a second figure on the cargo at the stern's west edge (`boat deck: boat_towed_mast_16228`, H -0.05).
- `sweep_man_15888`: `push` until `work_sweep` [boatman]. Low: a head with a light face in profile between the capped man and the crouching man at the loom; the body hidden behind the others (`boat deck: boat_under_way_15595`, H -0.13).
- `sweep_man_15838`: `push` until `work_sweep` [boatman]. Behind the first at the sweep, half hidden, pushing the loom east (`boat deck: boat_under_way_15595`, H -0.13).
- `boatman_bow_15688`: `sit_floor` [boatman]. Crouching or seated at the mat roof's west edge behind the two standing bowmen, head bowed (`boat bow deck: boat_under_way_15595`, H 1.12).
- `boatman_bow_15636`: `look` [boatman]. Short jacket and cap, standing on the raised bow deck at the west end looking ahead (west), one leg of the bow's A-frame beside him (`boat bow deck: boat_under_way_15595`, H 1.12).

### robed_man (26)

- `parasol_stall_seller_20290`: `sit_talk`. Bareheaded, hair tied up, seated behind the parasol stall's table with both arms stretched out on it toward the customer.
- `seated_customer_20140`: `drink`. Topknot, no hat, long robe, seated on `stool_20126` at the parasol table's west end facing the seller, a jar each side of him.
- `far_robed_figure_19768`: `idle`. Far, a long robe on the north bank, head cut off by the silk's damaged top edge.
- `bank_waver_19612`: `hail` until `wave_arms`. Dark hair in a bun, seen from behind on the bank behind the shed under the arch, waving his raised right arm at the big boat.
- `under_parasol_bender_19385`: `bend_goods`. Low: light robe, under the big parasol's west side bending forward with both hands reaching east; lower body hidden behind the shed's mat roof.
- `man_at_cabin_rail_19366`: `lean_chin`. Light robe, leaning on the cabin boat's railing under the arch, looking south-east at the big boat (a passenger) (`boat deck: boat_cabin_under_arch_19225`, H 0.01).
- `stall_sitter_east_19297`: `sit`. Low: light robe, seated at the east end of the stall table under the arch, seen from behind (head hidden by the eave).
- `stall_sitter_west_19088`: `sit`. Low: light robe, seated at the west end of the stall under the mat awning, seen from behind, facing north into the stall.
- `tall_robed_man_18990`: `look`. Tall, long light robe, dark hair, seen from behind in the crowd west of the horse's head, facing north-east to the crown (`bridge deck: 400 px west of the near edge`, H 5.41).
- `man_light_robe_reaching_18958`: `point`. Low: dark hair and light robe, face in profile east, stretching his right arm out east to the railing and the horse (`bridge deck: 200 px west of the near edge`, H 5.07).
- `sack_porter_18915`: `back_load`, props `back_sack`. Long light robe with a sash and a dark cap, walking west down the deck with a big dark sack slung on his back (its tied neck at the top), face in profile west; walker, west down the deck (`bridge deck: 550 px west of the near edge`, H 5.26).
- `robe_man_east_18893`: `look`. Long robe, dark hair, standing at the bridge's south foot, face in profile east to the arch and the river.
- `stall_man_parasol_18612`: `sit`. Long light robe and dark hair, seated on `bench_18630` at the west stall's north-east corner, leaning back west with both hands up at the stall parasol's east rim, steadying it (the hands-up action is optional; `sit` meanwhile) (`bridge deck: 500 px west of the near edge`, H 4.81).
- `robe_apron_man_18582`: `look`, props `hip_bag`. Tall, long light robe tied with a dark sash and an apron, west of the big parasol, face in profile looking up east at the rider and the ramp; a small bag hangs at his right hip (`bridge deck: 250 px west of the near edge`, H 0.7).
- `mat_stall_leaner_18375`: `crane`. Low: light robe, dark hair, under the mat awning's west part leaning west with one arm held out (`bridge deck: 600 px west of the near edge`, H 3.45).
- `seated_man_topknot_18352`: `drink`. Light robe and topknot, seated just west of the round food tray, face to us and a little west (`bridge deck: 600 px west of the near edge`, H 3.14).
- `pole_carrier_robe_18345`: `carry_pole`, props `pole_bundles`. Light robe, hair in a bun, a pole across his shoulders held out with both arms, a tall rope-slung load at its west end; walker, east behind the roof at the bottom edge.
- `back_view_dark_hair_18340`: `idle`. Low: dark hair and light robe, seen from behind just south of the pole carrier.
- `far_bank_seated_18318`: `sit`. Far, topknot, seated on `far_chair_18322` in the far-bank shed facing west to its table.
- `passenger_seated_18112`: `sit`. Pale robe, seated inside the dark mat cabin beside the other (a passenger) (`boat deck: boat_mat_cabin_18005`, H -0.23).
- `gate_post_figure_17332`: `idle`. Low: narrow, long robe, at the tavern gate's east post half hidden behind the lattice panel, his arm out east with a small thing in the hand (a flower, a whip or a bundle); perhaps the saddled horse's groom.
- `far_bank_seated_17277`: `sit`. Far, light robe, seated on the bench `far_bank_bench_17278` hunched forward facing west to the small table.
- `far_bank_standing_17174`: `idle`. Low: far, small, light robe, just west of the upright willow under the booth's eave beam.
- `behind_lampbox_17090`: `idle`. Low: faint, inside 十千脚店's gate east of the lamp-box behind the bar fence: a small pointed cap or topknot and a robe (other reading: a gathered curtain at the gate's west post, then no figure).
- `diner_east_16183`: `talk`. Dark hair (a bun or small cap) and light robe, at the back of the dining table's east end, face bent down west to the table and the diners (the host, or a waiter serving) (`upper floor: tavern_river_hall_15540`, H 3.83).
- `head_at_partition_15848`: `talk`. Low: faint: a small head with a topknot or cap turned west and a raised hand reaching to the doorway figure; nothing of a body below the shoulders (a plain panel fills the opening) (`upper floor: tavern_river_hall_15540`, H 3.83).

### townsman (23)

- `dark_hat_figure_20070`: `idle`. Low: a black brimmed cap with a knob over a dark upright shape (a man in a dark robe) at the north-bank tavern's west end, by the low table.
- `shop_seated_on_bench_19905`: `sit`. Low: faint outline seated on the shop's lattice-sided bench, turned north-east, one arm reaching east to the counter.
- `rail_watcher_19862`: `lean_over` until `reach_over_rail`. Dark cap, leaning far over the north ramp's near railing, looking down at the big boat; the westmost of three (`bridge deck`, H 2.03).
- `deck_rail_watcher_19670`: `idle`, props `rope_coil`. Dark cap, standing at the railing east of the crown, head turned a little west, holding a coil of rope or a cloth at his chest (`bridge deck`, H 4.12).
- `far_vendor_dark_19578`: `idle`. Far, dark clothes, standing behind the flat basket on its splayed stand, facing us (a pedlar).
- `deck_capped_shouter_19492`: `hail`. Big, dark cap and a robe, leaning far out over the railing toward the boat, left arm raised beside his head (shouting or signalling), right hand down at the rail (`bridge deck: 100 px west of the near edge`, H 4.7).
- `man_dark_cap_back_row_19325`: `look`. Low: dark cap, in the back row of the crowd at the crown, face turned east (`bridge deck: 150 px west of the near edge`, H 5.23).
- `man_bent_over_railing_19065`: `lean_over` until `reach_over_rail`. Dark cap, bent over the near railing, head down, arms reaching over toward the water (`bridge deck: 50 px west of the near edge`, H 4.74).
- `bank_watcher_dark_robe_18968`: `look`. Low: long dark robe and a dark head-covering (a hood or bound hair), back to us on the bank, facing up to the bridge.
- `man_behind_awning_18898`: `look`. Dark cap, head and shoulders over the east mat awning's top edge, face east (`bridge deck: 100 px west of the near edge`, H 3.71).
- `white_sack_porter_18882`: `back_load`, props `shoulder_sack`. White head-cloth and dark robe, walking west down the ramp with a big white sack slung over his shoulder; walker, west down the deck (`bridge deck: 550 px west of the near edge`, H 5.34).
- `man_behind_18822`: `look`. Dark cap, at the back (north edge) of the ramp crowd, head and shoulders behind the man in the light jacket (`bridge deck: 600 px west of the near edge`, H 5.36).
- `man_dark_cap_18812`: `idle`. Low: a head in a dark cap behind the men in long robes, below the big parasol's east rim.
- `stout_man_18750`: `idle`. Stout, dark clothes, standing in the middle of the crowd below the big parasol.
- `calling_man_18690`: `hail`. Dark robe and dark cap, bending forward with his mouth open, face to us, both arms out west toward the loaded donkeys (calling to them or pulling at a load).
- `dark_cap_man_18622`: `look`. Dark cap and dark robe, at the big parasol's west edge, face east.
- `far_bank_man_doorway_18008`: `idle`. Far, small and dark-clad, standing in a far-bank shop's open doorway facing the river.
- `man_dark_cap_17888`: `idle`. Dark cap, behind the food stand facing the street (the stand's keeper?).
- `figure_behind_pole_17650`: `idle`. Low: partly hidden behind the 新酒 pole at the back of the stalls, a pale face or kerchief over a dark body (other reading: two or three tall jars on a shelf, then no figure).
- `passenger_seated_17632`: `sit`. Dark clothes, seated in the awning boat's cabin, seen through a window (a passenger) (`boat deck: boat_awning_17442`, H -0.44).
- `robed_man_gesturing_17567`: `hand_over`. Long grey robe and round dark cap, at the bottom edge facing east, his right hand held out palm up to the porter's hanging frame; the child holds his robe (the townsman's slate robe and futou are his look).
- `far_bank_figure_17213`: `idle`. Low: far, a faint dark upright shape at the west end of the far-bank eating table.
- `passenger_door_16553`: `idle`. Low: a dark rounded shape filling the long boat's west cabin door: a person in a dark robe (other reading: only the dark doorway); the restyle's diners in this cabin are not painted (`boat deck: boat_passenger_long_16398`, H -0.36).

### carter (18)

- `boatman_hauling_rope_20205`: `hold_rope` until `haul_line` [boatman]. On the poop facing east, both hands forward hauling one of the lowering mast's lines (`boat roof: boat_mast_lowering_19518`, H 2.29).
- `stallkeeper_20030`: `idle`. Low: a faint head and shoulders behind the long low table's east half (the stall's keeper).
- `figure_topedge_19925`: `walk`. Low: thin bent strokes cut by the silk's top edge just east of the walker: a second figure's legs (other reading: a small animal's legs); walker, east.
- `cart_pusher_19922`: `push`. Dark cap, at the handcart's near side by its wheel, bent over the top rail pushing or steadying it as it is hauled west.
- `boatman_pole_raised_19775`: `stand_pole` until `fend_pole`, props `long_pole` [boatman]. Dark cap, far side, arm raised north-west pushing a pole up at the arch and the cabin boat's roof to fend off (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `boatman_poling_bow_19632`: `push` until `pole_boat`, props `long_pole` [boatman]. Topknot, behind the bow men, a long pole slanting down past the near gunwale into the water at about (19730, 806) (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `far_stall_vendor_19436`: `sit`. Far, seated behind the stall table under the far-bank parasol, round face to us.
- `head_by_shed_post_19334`: `idle`. Low: a dark rounded head seen from behind at the mat stall's south-east corner post, the body hidden behind the big hall's north gable (other reading: a dark-lidded jar, then no figure).
- `bank_watcher_crouching_18960`: `crouch`. Low: dark hair, crouching or bending forward in front of the standing watchers under the arch's south foot, facing east to the stall.
- `head_behind_porter_18893`: `idle`. Low: a face in a dark cap just north-east of the white-sack porter; only the head is painted (`bridge deck: 550 px west of the near edge`, H 5.31).
- `head_under_parasol_hub_18780`: `idle`. Low: a round dark-haired head (bare or a small cap) under the big parasol's hub between the stout man and the long-robed man (a customer, or the goods stand's keeper).
- `hand_to_head_18752`: `tie_kerchief`. Light jacket and brownish trousers, at the east mat awning's west end, one hand raised to his head (shading his eyes or holding his cap), looking east (`bridge deck: 200 px west of the near edge`, H 3.14).
- `second_head_ramp_foot_18740`: `idle`. Low: a second round dark head seen from behind at the ramp's foot, body lost in the crowd above the big parasol (`bridge deck: 100 px west of the near edge`, H 0.96).
- `barrow_pusher_18295`: `push`. Cap and light jacket, leaning far forward west against the barrow's load, pushing it by its handles, legs striding out behind.
- `bearded_barrow_man_18098`: `bridle` until `haul_line`. Bearded, a head-band and a short jacket with a sash, standing astride at the barrow's front facing us, leaning back and hauling on the rope tied to the balking black donkey's head (the rope is a scene line from (18117, 1440) to the donkey's head).
- `parasol_seated_17322`: `sit`. Low: faint, possibly the stall's keeper seated behind the stall table's west end.
- `far_bank_figure_16722`: `crouch`. Low: a tiny tinted mark at the foot of the far-bank shop's platform, standing or crouching (other reading: a stone or a post).
- `sweep_man_15862`: `push` until `work_sweep` [boatman]. Dark cap, leaning forward over the sweep's loom, pushing it (`boat deck: boat_under_way_15595`, H -0.13).

### scholar (17)

- `shop_standing_man_19872`: `talk`. Slim, pale long robe and soft cap, standing at the east end of the south-bank shop's long table, turned west to it.
- `shop_seated_man_19772`: `drink`. Light robe, seated on the slatted chair `shop_chair_19725`, his arm on the table beside the bowl.
- `deck_rail_leaner_19538`: `lean_chin`. Dark cap and light robe, leaning forward with both hands on the railing, face to us, looking down at the boat (`bridge deck: 50 px west of the near edge`, H 4.72).
- `man_leaning_over_rail_19432`: `lean_over`. White robe, leaning out over the cabin's railing with his right hand reaching down over it, watching the big boat (a passenger) (`boat deck: boat_cabin_under_arch_19225`, H 0.01).
- `stall_man_with_dish_19173`: `drink`. Cap, seated behind the table under the mat awning, looking down west at the dish before him.
- `rider_white_robe_19110`: `ride`. White round-collared robe and dark cap, upright on the brown horse `horse_19055`, left arm forward at the reins; lower body hidden by the groom: the horseman of 车轿相争 (the scholar's long white robe and futou are the nearest look; an official's round-collared robe would be closer) (`animal horse_19055`, H 5.38).
- `long_robe_pole_18852`: `idle`. Long robe and dark cap at the bridge's foot; a long pole runs level east from him at chest height (held by him or by the man east of him: a `long_pole` held level if it is his, the builder's choice).
- `long_robe_back_18806`: `look`. Long robe, back to us, facing the bridge's foot.
- `donkey_rider_18650`: `ride`, props `stick`. Long light robe and dark cap, riding the dark donkey `donkey_ridden_18690` east toward the bridge, back to us, a stick or whip held out west (`animal donkey_ridden_18690`, H 2.24).
- `seated_man_cap_18282`: `sit`. Dark cap and light robe, seated or squatting, face turned east to the tray and the people eating there (`bridge deck: 650 px west of the near edge`, H 2.81).
- `passenger_seated_18147`: `sit`. Low: pale robe, seated inside the dark mat cabin, seen through its open side (a passenger) (`boat deck: boat_mat_cabin_18005`, H -0.23).
- `far_bank_seated_17333`: `sit`. Far, black cap and light robe, seated behind the long counter of the far-bank eating place facing the river.
- `far_bank_standing_17132`: `idle`. Far, small, light robe, between the leaning willow's trunk and the booth to the west.
- `balcony_figure_16383`: `idle`. Low: faint, a second customer seen from behind in the side gallery's bay, his shoulder turned to the first (other reading: a curtain or hanging cloth) (`upper floor: tavern_river_hall_15540`, H 3.83).
- `diner_cap_16077`: `sit_talk`. Bearded, dark cap, light cross-collared robe, seated behind the table's west end half turned to us, right hand out over the table, talking or reaching for a dish (欢楼美禄) (`upper floor: tavern_river_hall_15540`, H 3.83).
- `diner_hunched_16050`: `sit_listen`. Dark cap and light robe, seated at the front of the balcony west of the table, hunched forward with his forearms on the inner rail and his head bowed east: dozing, tipsy or listening (`upper floor: tavern_river_hall_15540`, H 3.83).
- `doorway_figure_15818`: `idle`. A long plain light robe and a cap with a squarish top, standing in the open doorway in the balcony's back wall facing us, arms hanging (a waiter; other reading: a serving woman, woman); the restyle paints a woman in red here (`upper floor: tavern_river_hall_15540`, H 3.83).

### inspector (11)

- `man_at_railing_face_west_19318`: `look`. Low: dark cap, at the near railing at the crown, round face turned down and west to the men bent over the rail (`bridge deck: 100 px west of the near edge`, H 5.38).
- `man_over_railing_19025`: `lean_over`. Dark cap, leaning out over the near railing with both arms stretched east and down toward the river (`bridge deck: 100 px west of the near edge`, H 4.85).
- `man_arms_flung_wide_18990`: `argue` until `lunge_arms_wide`. Low: dark cap, short jacket, dark trousers, crouched and lunging west of the horse's lowered head with both arms flung wide, face up to the east: clearing the way or shouting at the sedan's party (`bridge deck: 400 px west of the near edge`, H 5.41).
- `man_reaching_with_stick_18930`: `point`, props `stick`. Low: dark cap, leaning east at the deck's south end, right arm out toward the railing with a short stick (or pointing) (`bridge deck: 100 px west of the near edge`, H 4.07).
- `man_dark_cap_south_end_18930`: `look`. Low: dark cap and dark jacket at the deck's south end, face in profile east toward the railing and the river (`bridge deck: 100 px west of the near edge`, H 4.01).
- `man_dark_jacket_pointing_18915`: `point`. Dark cap and dark short jacket, bent forward stretching his right arm east toward the horse and the crowd (pointing, or reaching with something dark in his hand) (`bridge deck: 300 px west of the near edge`, H 5.33).
- `pointer_east_18830`: `point`. Dark cap, bending forward beside the sedan's front, right arm stretched east up the bridge at the horseman's party (车轿相争) (`bridge deck: 200 px west of the near edge`, H 4.07).
- `mat_stall_keeper_18435`: `lean_over`. Dark cap and dark jacket under the west mat awning's west end, leaning east over the table of trays (the stall's keeper) (`bridge deck: 550 px west of the near edge`, H 3.56).
- `pointing_man_18318`: `point`. Dark cap, dark short jacket, light trousers, leaning a little forward, smiling, pointing west with his right arm at the goods table under the big parasol: bargaining.
- `seated_man_at_stand_17795`: `sit`. Dark jacket, seated on a stool at the food stand's west side, hunched over the round tray with both hands on it (the keeper or a customer).
- `cap_man_at_cart_17545`: `lean_over`. A dark cap knotted at the top, behind the 串车's load at its west end, leaning over it with his right hand reaching west to the topknot man's bundle; body hidden by the load.

### camel_driver (10)

- `shop_low_head_19940`: `sit_floor`. Low: a dark-haired head just above the shop's slanted front board: seated or lying low, looking east.
- `bank_watcher_19672`: `look`. Dark hair, on the bank behind the shed's mat roof beside the waving man, head tipped back to the big boat; head and shoulders show.
- `dark_head_behind_horse_19018`: `idle`. Low: dark hair, the back of the head and shoulders only, between the tall robed man and the pale head-cloth, north of the horse's head, facing north-east (`bridge deck: 400 px west of the near edge`, H 5.37).
- `bank_watcher_dark_vest_18945`: `look`. Dark hair, a dark vest over light sleeves, trousers, back to us under the arch's south foot looking up at the bridge and the boat.
- `gable_figure_18836`: `idle`. Low: a small dark figure under the big hall's open south gable at the silk's bottom edge, back to us (possibly two heads side by side).
- `heads_under_parasol_18755`: `idle`. Low: a dark-haired head under the big parasol's middle among the goods on the slatted stand (a customer or the keeper).
- `man_under_parasol_18710`: `idle`. Dark hair, standing under the big parasol's west rim (dress unreadable).
- `far_bank_seated_17922`: `sit`. Low: far, seated behind the west end of the far-bank shop's long table; a dark head between the shop's slats.
- `figure_bent_at_table_17658`: `bend_goods`. Low: a grey hood or kerchief, bending low over the jar table's west end, back to the street.
- `far_bank_figure_16823`: `idle`. Low: a tiny tinted upright mark under the far-bank shop's front (other reading: a post of the platform, then no figure).

### hat_traveller (10)

- `boatman_hat_pole_19915`: `stand_pole` until `pole_boat`, props `long_pole` [boatman]. In a hat, by the mast's foot, holding a pole across his body to the west (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `deck_stooping_hat_19765`: `lean_over` until `reach_over_rail`. Low: broad hat and dark garment, stooping low over the north ramp's railing, bent almost double, arms reaching east and down to the boat (`bridge deck`, H 3.19).
- `deck_wide_hat_19405`: `lean_over` until `reach_over_rail`. Low: a large round wide-brimmed hat with a dark crown, bending far over the railing looking straight down at the boat, arms hanging over the rail (`bridge deck: 150 px west of the near edge`, H 4.91).
- `deck_hat_stick_19353`: `idle`, props `stick`. Low: a hat, in the second row behind the railing crowd, a short stick rising at a slant over his right shoulder; head and shoulders show (`bridge deck: 200 px west of the near edge`, H 4.92).
- `wide_hat_pointer_18890`: `point`, props `back_reeds`. A wide dark hat and dark clothes, east of the sedan's front, arm out west pointing at the sedan; a tall bundle of sticks or reeds stands upright on his back (车轿相争) (`bridge deck: 200 px west of the near edge`, H 4.65).
- `wide_hat_pointer_18855`: `point`. A wide flat dark hat and a dark jacket, in the crowd north-east of the sedan, his arm thrust out west at it, telling it to stop or make way (车轿相争) (`bridge deck: 300 px west of the near edge`, H 5.07).
- `man_dark_hat_18035`: `talk`. Low: a dark hat, behind the round basket facing us, a big moustache and an open mouth.
- `porter_straw_hat_17762`: `carry_pole`, props `pole_fringe_frame`. Broad straw hat, short belted jacket and knee trousers, a shoulder pole over his right shoulder: a bow-shaped frame with a fringe of long strips hangs from its west end, a round bag or basket at his east side; stopped, his head turned west to the robed man (play `carry_pole` held still, or `idle` with the pole placed).
- `far_bank_figure_hat_17666`: `idle`. Low: far, a pale conical hat and a dark robe at the back of a far-bank shop's open front (other reading: a tall dark jar with a pale conical lid, then no figure).
- `far_bank_seated_17366`: `sit`. Far, a brimmed hat, seated behind the east end of the long counter facing south to the river.

### sightseer (8)

- `rail_watcher_19923`: `lean_chin`. Dark cap, leaning on the north ramp's near railing, face showing, looking down at the big boat; the eastmost of three (`bridge deck`, H 1.18).
- `deck_rail_leaner_19715`: `lean_chin`. Dark cap, leaning on the railing where the deck starts down the north ramp, face to us, watching the boat (`bridge deck`, H 3.7).
- `parasol_capped_man_19652`: `look`. Dark cap or dark hair under the tilted parasol's west rim on the south bank, face turned up east to the boats (perhaps holding the parasol).
- `deck_rail_face_19350`: `lean_chin`. Dark cap, at the front of the railing crowd over the arch, round face to us, leaning on the near railing looking down at the big boat (`bridge deck: 150 px west of the near edge`, H 5.14).
- `man_pointing_west_at_railing_19090`: `point`. Dark cap and light jacket, behind the near railing, his left arm stretched west along the deck, face west (`bridge deck: 50 px west of the near edge`, H 4.99).
- `man_arms_on_railing_18982`: `lean_chin`. Dark cap, his arms on the near railing near its south end, leaning east and looking out over the river (`bridge deck: 100 px west of the near edge`, H 4.56).
- `bowing_man_18688`: `bow`. Dark cap, light jacket over a darker lower robe, bent double toward the west just west of the dark donkey (bowing, or stooping to pick something up) (`bridge deck: 500 px west of the near edge`, H 5.24).
- `balcony_drinker_16358`: `lean_chin`. Cap and light robe, in the side gallery's first bay, face to us, arms forward on a cross-bar at chest height, perhaps holding a cup (`upper floor: tavern_river_hall_15540`, H 3.83).

### child (4)

- `deck_youth_rope_19445`: `reach` until `throw_rope`. `scale` about 0.85 (his head lower than the men beside him): a youth in a small dark cap leaning over the railing with his right arm stretched east along the rope he has thrown down to the boat (the rope is a scene line from his hands at (19471, 244) to its loop at (19600, 420)) (`bridge deck: 100 px west of the near edge`, H 4.95).
- `small_figure_pole_18840`: `crouch`. Low: `scale` about 0.7: a small figure (a child?) squatting at the foot of the goods pole, only a round head and shoulders above the roof ridge.
- `youth_round_face_18643`: `look`. `scale` about 0.85: a youth with a round face and a small topknot, light short jacket and trousers, facing us between the bowing man and the west stall's parasol (`bridge deck: 550 px west of the near edge`, H 5.26).
- `child_red_18592`: `look`. Low: `scale` about 0.6: a small figure in a red garment with a dark hair-knot or cap beside the first loaded donkey's head (the child's jacket is teal: a red tone variant if cheap).

### bearer (3)

- `sedan_bearer_front_18838`: `sedan_carry`. Light short jacket, the poles' front ends on his shoulder, walking north-east up the ramp ahead of the box (车轿相争); held in place by the standoff (`bridge deck: 300 px west of the near edge`, H 4.97).
- `sedan_bearer_rear_18688`: `sedan_carry`. Light short jacket, dark cap, bare lower legs, the poles' rear ends on his right shoulder, striding north-east up the ramp behind the box (车轿相争) (`bridge deck: 350 px west of the near edge`, H 4.18).
- `walker_with_bundle_17396`: `walk`, props `bundle_small`. Short jacket over a wrapped skirt, knee breeches and leg wraps (the bearer's short jacket and leg wraps), walking toward us and west, head turned west, a dark shaggy bundle low in his right hand (straw or hemp, or a hat by its strings); walker, west-south-west.

### fortune_teller (3)

- `bank_watcher_at_end_post_18998`: `look`. Low: dark hair and dark robe, back to us beside the end post's foot, facing east to the stall under the arch.
- `dark_robe_man_18400`: `talk`. Tall, a long dark robe to his feet and a dark head-cloth, turned west to the pointing man, hands raised before him.
- `display_seller_18058`: `sit`. Dark cap, seated at the small-goods display's west end facing east over his goods.

### butcher (2)

- `boatman_capped_19800`: `idle` [boatman]. Small cap, short jacket, long pleated apron (the butcher's pale jacket and brown apron), standing on the far side amidships, hands at his chest, watching the bow; the boatman's second reference (front view) (`boat deck: boat_mast_lowering_19518`, H 0.08).
- `waiter_calling_17451`: `hold_tray`, props `bun_plate`. Short white jacket, apron and trousers, small dark cap or bun, walking east out of the gate with his mouth open calling out, his right hand holding out a plate of two or three buns, the left arm swinging back (the butcher's pale jacket and apron are his look); walker, east out of the gate.

### woman (2)

- `bank_watcher_dark_hair_18905`: `look`. Low: dark hair, smaller than the men beside it, standing under the arch's south foot in front of the tall man, looking up at the bridge (other reading: a youth, child at `scale` about 0.85).
- `robed_back_view_18425`: `idle`. Low: back to us, a dark jacket over a long light robe or skirt with many folds, between the jar porter and the pointing man; a long staff stands at its west side (other reading: a man in a jacket over a pleated robe, camel_driver) (`bridge deck: 400 px west of the near edge`, H 0.52).

### child_robed (1)

- `child_holding_robe_17520`: `reach`. `scale` about 0.6: a small child in a dark long jacket, hair in a tuft, holding the robe of the man beside it (east).

### elder (1)

- `man_folded_arms_tall_cap_19270`: `arms_folded`. Tall dark cap (幞头-like) and light robe, standing with his arms folded behind the railing crowd at the crown, facing us and looking west at the horse (if `second_horse_19230` is a horse, perhaps its rider standing beside it) (`bridge deck: 250 px west of the near edge`, H 5.04).

### official (1)

- `official_black_robe_17940`: `idle`. Tall, bearded, black 幞头 and a long black robe, at the canopy's east post with his hands together at his waist, face east (a scholar or official; the official's robe is warm grey: a dark tone if cheap).

### storyteller (1)

- `stall_bearded_man_19235`: `sit`. Bearded, dark cap, seated behind the stall table under the arch, leaning forward on it with his head propped on his hand, looking west.

## Actions the existing clips can't show (ranked; 10 credits a take, then free for anyone)

S3 is the scroll's action scene (大船抢险, 上下呼救, 车轿相争, 摇橹向前). Each take below serves S2's and S4b's crews too.
Every figure already plays the stand-in named in its line.

1. **`pole_boat`**: standing at a gunwale, both hands on a long pole planted at a slant into the water, leaning his
   weight down along it, bent forward from the waist; a short shove, then he walks the hands back up the pole. Six
   figures: `boatman_bending_pole_19746`, `boatman_bent_pole_19830`, `boatman_standing_pole_19892`,
   `boatman_poling_bow_19632`, `boatman_hat_pole_19915` and the towed boat's `boatman_poling_16198`. Stand-in: `push`
   or `stand_pole` with `long_pole`.
2. **`work_sweep`** (摇橹): standing in a row at a long sweep's loom, both hands on it at chest height, pushing it across
   and pulling it back with the whole body, the feet braced. Six figures, the boat under way's sweep crew
   (`sweep_man_15810`, `_15838`, `_15855`, `_15862`, `_15888`, `_15915`), and S2's six at its great sweep. The boat kit
   swings the `sweep` node and places the crew at its bar (`people.json` `boats.<slug>.crew.<id>.work = "sweep"`), so
   the take needs only the arms and body. Stand-in: `push`.
3. **`haul_line`**: hauling a rope hand over hand, leaning back with one foot forward. Two figures:
   `boatman_hauling_rope_20205` (the lowering mast's lines from the poop) and `bearded_barrow_man_18098` (the balking
   donkey's rope). Stand-ins: `hold_rope`, `bridle`.
4. **`reach_over_rail`**: bent far over a waist-high railing, the head down, both arms hanging over it and reaching
   down (lowering a rope or calling to a boat below). Seven figures at the bridge's railing (上下呼救):
   `rail_watcher_19862`, `deck_stooping_hat_19765`, `deck_rail_leaner_19578`, `deck_wide_hat_19405`,
   `man_lowering_rope_19295`, `man_bent_over_railing_19195`, `man_bent_over_railing_19065`. Stand-in: `lean_over`, which
   bends over a load at about the right height. The calm railing watchers play `lean_chin` (on the bridge railing it
   "reads right", `characters/notes.md`).
5. **`tow_walk`** (纤夫): walking slowly up a bank bent far forward, leaning into a tow line over the shoulder, the arms
   swinging low. Five trackers here (`tracker_16333` … `_16423`), five on S2's bank. The boats page walks them with
   their boat and plays `boats.<slug>.haul.<id>.walk`. Stand-in: `push`, a forward-leaning walk.
6. **`wave_arms`**: standing, both arms raised high and waving, shouting. `man_waving_on_boat_roof_19952` (both
   arms) and `bank_waver_19612` (his right arm). Stand-in: `hail`.
7. *(optional)* **`fend_pole`**: holding a long pole overhead or level and pushing it away from the body against
   something above or beside (the arch, a boat's side). `boatman_both_arms_pole_19840`, `boatman_pole_raised_19775`,
   `boatman_cabin_door_pole_20300`, and `deck_pole_holder_19625` on the bridge. Stand-in: `stand_pole` (later
   `pole_boat`).
8. *(optional)* **`throw_rope`**: leaning over a railing with the right arm swung out and down after a throw, a rope
   running from the hand. `deck_youth_rope_19445`. Stand-in: `reach`.
9. *(optional)* **`lie_wave`**: half lying on the back on a roof, one arm raised high waving. `man_reclining_waving_20060`.
   Stand-in: `sleep_side`.
10. *(optional)* **`hold_horse_neck`**: leaning into a horse's chest with both arms round its lowered neck, holding it
    back. `groom_holding_horse_19095`. Stand-in: `bridle`.
11. *(optional)* **`lunge_arms_wide`**: a crouched lunge with both arms flung wide, the face up, shouting.
    `man_arms_flung_wide_18990`. Stand-in: `argue`.

**Painted walkers** (short walks along the painted direction and back, `people.json`):
- west: `porter_with_pole_20450`, `far_water_carrier_19720`, `walker_with_stick_17884`, `walker_with_bundle_17396`
  (west-south-west);
- west down the bridge deck: `sack_porter_18915`, `white_sack_porter_18882`;
- east: `figure_topedge_19925` and `walker_topedge_19878` (at the silk's top edge), `porter_jar_bundle_18483`,
  `pole_carrier_robe_18345`, `porter_two_baskets_18340`, `porter_baskets_bottom_18175`, `waiter_calling_17451` (out of
  the gate);
- north: `man_light_jacket_18760`, to the east mat awning;
- with their animal: `groom_at_donkey_18682` and the rider `donkey_rider_18650` (east, up to the ramp's foot),
  `donkey_walker_18481` behind the pack donkey;
- with their boat: the five trackers.

The handcart's puller and pusher walk only if the cart is made to move. The sedan's bearers stand where they are: the
standoff (车轿相争) holds them.

## Animals: 9 (map IDs; built at real size)

The map's hoof-to-hoof lengths are painted and foreshortened, so they give orientation only.

- `S3.ani.horse_17222` (high): a **pale horse, saddled and bridled, with no rider**, standing at 十千脚店's gate
  (余辉's 欢楼美禄). Its head is lowered to the ground at the west and its rump faces us (facing 150). One hind hoof is
  lifted. Clip `graze` (or `head_low`).
  - **Tack:** a saddle with a long dark saddle flap down its near side, a crupper with two hanging tassels, and the
    tail tied up in a knot. The registry's `saddle` is a red cloth: a dark-flap saddle with a tasselled crupper is a
    tack variant, and the knotted tail an optional mesh detail.
  - Its coat is the registry horse's own (pale grey-white). The inside of its near hind leg is painted dark. Nobody
    holds it; `gate_post_figure_17332` may be its groom.
- `S3.ani.horse_19055` (med): the **horseman's brown horse** of 车轿相争, on the bridge deck (H 5.39), coming down west
  from the crown. It has a dark mane and tail. Its head is pulled low and west by the groom hugging its neck, and the
  rider in white sits on it. Clip `head_low`.
  - **Tack:** not readable; a bridle is implied by the groom's grip. Give it a saddle.
  - **Coat:** brown. The registry horse is pale, and a brown `tone` is free (S4b asked for a dark coat the same way).
- `S3.ani.second_horse_19230` (low): **only a head** is painted: a dark-maned horse (or donkey or mule) head with a
  forelock, lowered and facing west, just east of the first horse's tail. Its body would be hidden by the railing
  crowd. The other reading is a man in a dark head-cloth bent forward. If it is built: a brown or dark horse, clip
  `head_low`, its body behind the crowd, perhaps ridden by `man_folded_arms_tall_cap_19270`. The lead's call.
- `S3.ani.donkey_18048` (med): a **black donkey balking** at the barrow's front. Its rump is to us at the south-west,
  its head away to the north-east (facing 40), and its hind legs are braced far back. A halter rope runs taut from its
  head to the bearded man hauling at the barrow's front.
  - **Tack:** a halter, and a light strap over the rump (a breeching or crupper). No saddle or load. This is a small
    new tack: halter, rope and breeching.
  - **Coat:** a dark `tone` (free; S4b asks the same for its donkey).
  - **Clip:** `idle`. A braced "balk" pose is optional.
- `S3.ani.donkey_sack_18535` (med): a **dark donkey seen from behind**, heading north-west into the crowd at the
  bridge's foot (facing 120). Its ears are up and its tail hangs between its hind legs. A **huge pale sack (a bale) is
  slung across its back, hanging far out on both sides** (painted 165 px across). Clip `idle`. Its driver,
  `donkey_walker_18481`, walks behind it.
- `S3.ani.donkey_sack_18690` (med): a **dark donkey walking east** under a huge pale sack that covers its back from
  rump to shoulders. Its head is low at the east end, one hind leg is lifted, and a thin tufted tail hangs at the west.
  Clip `walk`. `child_red_18592` stands at the first donkey's head.
  - Both sack donkeys need a new tack, **`pack_bale`**: one huge pale sack lashed across a pack saddle. The registry's
    `pack_saddle` carries two small white side bundles, and its `pannier_charcoal` two baskets.
- `S3.ani.donkey_ridden_18690` (med): a **dark donkey walking east** up the foot of the south ramp (on the deck, H 2.04).
  It has long upright ears and its head up, no load, and a man in a light robe rides it. Tack `saddle_cloth`
  (existing), dark tone, clip `walk`. The groom walks at its head.
- `S3.ani.donkey_dark_18745` (med): a **small dark donkey on the ramp** (deck, H 5.39) with its head lowered to the
  west. A light bundle is on its back, and two men bend over it, one at its neck and one over its load. Tack
  `pack_saddle` (existing: light bundles), dark tone, clip `graze` (head low). The other reading, a crouching man in dark
  clothes, is in its note.
- `S3.ani.dog_or_donkey_19825` (low): a **small dark animal** trotting east toward the handcart's puller on the north
  bank, with no tack or load. It is about 1.1 m long and 0.8 m high: donkey-sized, but faint enough to be a big dog. Cast
  a dark donkey with no tack (clip `walk`), or the registry dog (`walk`). The map leans to the donkey; the lead's call.

**What the registry lacks for these** (all free: `tone`, tack, `body_from`; none needs Meshy):
- a brown horse coat;
- a dark donkey coat (four donkeys);
- `pack_bale`, the huge pale sack across a donkey's back (two donkeys);
- a halter-and-breeching tack with a lead rope (the balking donkey);
- a dark-flap saddle with a tasselled crupper and a knotted tail (the gate horse; optional).

## Vehicles: 4 (plus 11 boats below)

- `S3.veh.chuanche_17775` (med): the **串车 of pin 24** (余辉's 书屏遭废: its load a cursive-script screen used as a
  tarp, the second such cart after S5's). It stands **set down** in the open ground in front of the canopy, facing
  east (front east), with nothing drawing it. Two men work at its west (handle) end.
  - **Load:** a huge domed load bound with ropes: a mass of looping, scribbled strokes (cursive writing, or a tangle of
    ropes and sticks) under big arched hoops. Vertical stakes stand at its west end and a ribbed woven panel at its
    north-east.
  - **Poles and handles:** two long poles stick out east from the load's top, with rope loops hanging from them (one
    ends in a hook, down to v ≈ 1495). Two long handles run down west-south-west almost to the ground.
  - **Wheel and legs:** one big wheel about 240 px across (hub ≈ (17640, 1430)), half hidden by the load. Two rest legs
    stand under the body.
  - **Size:** mapped 4.54 m front to rear (est). The load is 320 × 245 px.
  - **Kit:** `kit_vehicles.barrow_screen(held=False)`, the same type as S5's `cart_screen_8510`, resting on its legs.
    Add the east poles with their rope loops and hook, the west stakes and the woven panel.
- `S3.veh.barrow_hooped_load_18100` (med): a **big single-wheeled barrow** (串车 type) heading west and a little toward
  us (facing 210).
  - **Wheel:** one big spoked wheel under its front half (rim 96 × 72 px, hub (18177, 1420)).
  - **Load:** bundled goods and a rolled mat under arched hoops (a cover frame without its cover).
  - **People and animal:** a man pushes from the handles at the east end. A bearded man at the front hauls on a rope
    to the balking black donkey, which is not in shafts.
  - **Size:** mapped 2.34 m (est).
  - **Kit:** the `barrow_screen`/`sack_cart` barrow (`kit_vehicles._barrow`) with a new hooped load: the
    `barrel_cover` hoops left bare over bundles. The rope to the donkey's head is a scene line.
- `S3.veh.sedan_18842` (high): the **closed sedan chair of 车轿相争**, carried north-east up the bridge's south ramp
  (facing 30, on the deck at H 4.99), a bearer at each end. No passenger shows.
  - **Body:** a tall dark box with a rounded roof and a lattice window in its front. The box is 85 px long and 155 px
    from the roof to its base.
  - **Poles:** two long carrying poles, (18663, 545) → (18840, 445).
  - **Size:** mapped 2.27 m between the poles' ends.
  - **Kit:** `kit_vehicles.sedan_chair(carried=True)`. The painted roof is rounded, where the kit's has four concave
    slopes: a rounded-roof variant if cheap.
- `S3.veh.handcart_19862` (med): a **two-wheeled handcart** on the north bank, hauled west by one man at its shafts
  while a second leans on it at the wheel. No animal and no load are drawn.
  - **Body:** a slatted box (95 px long, its side 40 px high). Its two long top rails run on as shafts at the west end.
  - **Wheels:** one big spoked wheel shows, about 1 m (78 px), under the box's east half.
  - **Pole:** a thin pole runs north-east from the rails' east end to (20021, 115): a third shaft or a prop stick.
  - **Size:** mapped 1.59 m (foreshortened, est).
  - **Kit: new** `handcart` (no kit has one): a light slatted box (`kit_inner_city.lattice_frame`) on an axle with two
    `kit_vehicles.spoked_wheel`s, the top rails running on as shafts.
  - **Other reading:** `S3.tree.shrub_or_heap_20025` may be its covered load; then its rear moves to about 20055.

## Boats: 11 (for the boat factory, `blender/kit_boats.py`; real size by type, painted order and gaps)

Orientation follows the lead's rule (the sweep and the rudder mark the stern), applied at the merge. Mapped lengths are
the frame's distance between the painted waterline ends. They come out short, because the river is painted small up
the silk: the long passenger boat is 945 px painted and 11.89 m mapped. Build each boat at its type's real size.

**The boat factory's inventory** (`gen/boats/types.md` #6–#13) **differs from the map in five places:**
- #9–10 (two hulls at 17380–18320) are **three** boats: the awning boat, the lowered-mast boat (low) and the
  mat-cabin boat.
- The **cabin boat under the arch** and the **skiff** (low) are not in the inventory.
- **#12, the boat lowering its mast,** is read by the map as a cargo boat. It has a windlass at its squared bow, a mat
  deckhouse amidships, and a planked after cabin under a high poop. It does not have a full-length passenger house.
  Its rudder blade lies at 20400–20470, v 560–600, and it carries 19 crew.
- **#6, the boat under way,** has a big arched mat roof over most of its length, and its bow (with the horn beam) is the
  **west** end. Its crew is six at the sweep and three on the raised bow deck.
- **#13's ends are unread** (conf low). Its front is put at the west end, where the coiled ropes lie.

**The water:** two reaches of the 汴河 at H −0.7, copied from S4b (a bound, conf low). S3 has no reading of its own:
no bank face, stair or abutment foot meets the water. river_e's bounds under the far-bank hall on stilts are −0.86 to
−1.0. The river is 16.54 m wide at u 15500 (as S4b) and 8.21 m at u 18300, where the far bank is painted small. **No
landing stair, jetty or revetment is painted in S3**, so none is built. The far shores map 0.15–0.86 m north of the
bank tops, so the builder takes the water plane to the `bank_top` lines (the frame's question).

- `S3.veh.boat_under_way_15595` (med; inventory #6): **under way west, worked by a stern sweep** (摇橹向前; facing 162).
  Preset **`grain_awning_sweep`** with the sweep working.
  - **Size:** mapped 4.47 m (painted ≈ 370 px), beam 2.59 m (`beam_n` est).
  - **Bow:** a high rounded bow at the west end, a curved horn beam projecting west, and an A-frame of two poles. A
    raised bow deck (`boat bow deck`, H 1.12) carries three men.
  - **Roof and cargo:** a big arched mat roof over most of its length, cargo under it, no figures inside.
  - **Sweep:** over the low stern at the east end. Its loom runs past a pivot at (15965, 503) to a blade in the water
    at 16070–16135, v 555–570. Six men work it on the stern deck (H −0.13).
  - No mast up. Crew 9.
- `S3.veh.boat_towed_mast_16228` (high; #7): **towed upstream east by five trackers** (pin 25's 纤夫; facing 355).
  Preset **`grain_mast_towed`**.
  - **Size:** mapped 2.5 m. It is seen almost end-on, so that number is foreshortened and not usable (painted waterline
    ≈ 255 px).
  - **Mast:** a tall A-frame mast (a ladder-like pole with cross cleats) with stays fanning from the masthead to both
    ends. A **tow line** runs from the masthead (16075, 45) to the rear tracker at (16325, 112).
  - **Cargo:** big mat-covered cargo heaped high over the bulging stern half (west).
  - **Bow:** a projecting bow beam at the east end, where a man poles into the water (deck H −0.05). Two faint figures
    sit on the cargo (low). Crew 3.
- `S3.veh.boat_passenger_long_16398` (high; #8): a **very long passenger boat moored at the far bank**, bow west
  (facing 176). Preset **`passenger`**.
  - **Size:** mapped 11.89 m (painted 945 px).
  - **Cabin:** a continuous cabin. A deckhouse with open windows sits at the bow, then a long cabin with lattice
    windows, with a raised roof section and skylight at 16640–16760. A short slanted pole stands at 17060 (a stub or a
    lowered mast). A raised upper deckhouse sits over the stern cabin at 17150–17330.
  - **Stern:** a plank platform and a slanted rudder post.
  - **Crew:** 1, low (a dark shape in the west cabin door; deck H −0.36). The restyle's diners in the cabin are not
    painted.
- `S3.veh.boat_awning_17442` (med; #9): **moored at the far bank**, bow west (facing 173). Preset **`passenger`**, short
  cabin under a mat roof.
  - **Size:** mapped 4.21 m (painted 265 px).
  - **Bow:** a pointed bow under a mat awning on a light frame, with poles or oars lying across the foredeck and
    projecting west.
  - **Cabin:** a large cabin with a high dark mat roof, a crossed pole frame at its east end, and bundles of cargo
    under it. Two posts with small box lamps or plaques stand at the cabin's ends.
  - **Crew:** a passenger seated at a window, and a boatman crouching under the fore awning (low). Deck H −0.44.
- `S3.veh.boat_lowered_mast_17708` (low; part of #9–10): **moored at the far bank**, bow west by its neighbours (facing
  178; unread). Preset **`grain_mast_towed`** with the mast laid down.
  - **Size:** mapped 4.41 m (painted 290 px).
  - **Hull:** heavy dark wales or fenders along its side in log-like sections.
  - **Deck:** a low roof with round objects on its ridge, a lattice rail, and bundles of cargo (or potted shrubs).
  - **Mast:** lowered. A crossed A-frame crutch at the west end holds a long spar that runs east-north-east over the
    roof to (18100, 208), with rigging and a festooned line (lashings or a furled sail) running on over the next boat.
  - **Other reading:** a timber raft or a wharf platform.
  - **Crew:** none.
- `S3.veh.boat_mat_cabin_18005` (low; #10): **moored at the far bank**, bow west (facing 180; the other reading is bow
  east). Preset **`small_awning`** with a stern hood.
  - **Size:** mapped 4.73 m (painted 315 px).
  - **Cabin:** a long dark arched mat cabin with two passengers seated in its open side (deck H −0.23).
  - **Stern:** a mat hood overhanging to a point over a long low pointed hull end, and a vertical post (a raised
    rudder?).
- `S3.veh.boat_unloading_17705` (med; #11): **moored along the south bank, unloading**, bow west toward the 新酒 pole
  (facing 165). Preset **`grain_awning_sweep`**, riding high, without its sweep.
  - **Size:** mapped 8.25 m (waterline ≈ 505 px).
  - **Bow:** a short bow beam with a small hanging box. **A multi-pronged grapnel anchor** (4–5 hooked prongs) hangs
    under it: a new part. A long pole or sweep runs from the bow west-south-west over the water to (17480, 885).
  - **Foredeck:** six porters stand and bend over jars and bundles (deck H 0.21). Dark sacks or baskets are heaped
    amidships.
  - **Stern half:** an arched mat hood (18095–18200) and flat lattice mat awnings on poles (17960–18330). Their east
    part may be the tray stall's awning at the ramp's far edge.
- `S3.veh.boat_cabin_under_arch_19225` (high; **not in the inventory**): a **cabin boat drifting under the bridge's
  arch**, behind (north of) the big boat. Its heading isn't painted; front west by convention (facing 180). Preset
  **`passenger`** with an open railed cabin.
  - **Size:** mapped 10.35 m (at least 725 px painted).
  - **Hull:** planked, with a row of 工-shaped iron cramps.
  - **Cabin:** a railed open side, its posts every 50–70 px, under a planked roof that disappears behind the arch's
    rib.
  - **Crew:** two passengers leaning on the railing (deck H 0.01). No mast, oars or poles.
  - **Check:** its roof must clear the arch's underside (the bridge kit's `clearance()`; the kit's soffit is 2.86 m
    above the water over the middle 40%).
- `S3.veh.boat_skiff_19255` (low; **not in the inventory**): a **narrow empty skiff** lying under the arch's south foot
  parallel to the bank (facing 0). Preset **`small_open`**, shortened (a choice).
  - **Size:** mapped 4.76 m (painted ≈ 340 px).
  - **Hull:** a slim hull with an upturned stem at its east end carrying a small knob, and four frames or thwarts over
    its east half.
  - **Crew:** none, and no oar, pole or mooring line is painted.
  - **Other readings:** a floating timber, or a footing timber of the abutment.
- `S3.veh.boat_mast_lowering_19518` (med; #12): **大船抢险**. A big cargo boat lying crosswise under the arch with its
  squared bow to the west-south-west (facing 200), poled and fended off, its A-frame mast being lowered aft. Preset
  **`passenger_mast_lowering`**, with its house cut down to what is painted.
  - **Size:** mapped 11.02 m (painted 880 px), beam 4.03 m.
  - **Bow:** a windlass and rope drum, and a long striated bundle (the lowered mat sail or coiled cables) over the
    forward deck.
  - **Deckhouse and after cabin:** a low mat-roofed deckhouse amidships. A planked after cabin with an open door on its
    south side sits under a high poop deck (`boat roof`, H 2.29).
  - **Stern:** the rudder.
  - **Mast:** lowering aft. Its legs run from a hidden foot amidships to the head at (20295, 175), with its lines hanging
    onto the after deck.
  - **Poles and ropes:** 4–5 poles from the near-side crew into the water, two pushed up at the arch, and a long pole
    from the cabin door east past the stern to (20600, 548), over the S2 seam. A rope thrown from the bridge hangs in a
    loop to (19600, 420).
  - **Crew:** 19 (deck H 0.08). Not rafted; under way across the current.
- `S3.veh.boat_moored_south_bank_19745` (med; #13): **moored along the south bank past the arch**, its hull hidden
  below the gunwale by the shops' roofs (facing 180, ends unread). Preset **`grain_awning_sweep`** without its sweep.
  - **Size:** mapped 11.65 m (painted ≈ 895 px).
  - **West part:** a low dark arched mat roof with three round coils (coiled ropes or lids) and a round ribbed reel
    (`S3.prop.round_ribbed_object_19765`) on it, and a small cabin door at its east end.
  - **Middle and east:** a hatch with an arched frame amidships, where two men look out (deck H 0.40). A long low
    planked roof runs over its east part, with a small arched door on its south side.
  - **Crew:** two men on the roof waving and shouting to the big boat (`boat roof`, H 0.48; 上下呼救). No mast or sweep.
  - **Seam:** its east end (≈ 20637) lies past the S2 seam. The whole boat is S3's.

Also from the map for the boat kit:
- `S3.prop.mooring_post_17702` (low): a tall thin post at the far bank's water edge, with a small box (a lamp or a
  plaque) at v 285–310, between the awning boat and the lowered-mast boat. Use S4b's `mooring_post` with a box lamp.
- **The scene lines** are the kit's rope nodes or the builder's lines:
  - the tow line, from the towed boat's masthead to the rear tracker;
  - the thrown rope, from `deck_youth_rope_19445`'s hands at (19471, 244) to its loop at (19600, 420);
  - the big boat's mast lines;
  - the barrow's rope to the balking donkey.
- Three U-shaped rope loops or hooks hang under the arch's rib at (19772, 392), (19855, 390) and (19973–20000,
  397–417) (low): the bridge's iron hooks, or the big boat's lines round the rib.
- **The north-bank boat** (hull ≈ 20350–21030) is S2's (`S2.veh.boat_mat_cargo_21055`). S3 doesn't build it.

## Props carried by figures

Existing props, new bindings only:
- `pole_baskets`: `porter_two_baskets_18340`, `porter_baskets_bottom_18175` (one basket heaped with round things).
- `pole_bundle`: `porter_with_pole_20450`. His load is a long pale sack and a staff hanging from the pole's far end (a
  variant if cheap).
- `pole_bundles`: `pole_carrier_robe_18345` (one tall rope-slung load at the west end), a new binding on the robed man.
- `stick`: `walker_with_stick_17884` (`stick_stride`); `man_reaching_with_stick_18930`; `deck_hat_stick_19353`, on the
  shoulder; `man_north_of_chuanche_17690`, held across; and `donkey_rider_18650` (a riding stick or whip).
- `tray`: `black_hat_man_18458` (porter `hold_tray`).
- `back_bundle`: `walker_topedge_19878` (low: a bundle, or a second person).

New:
- **`long_pole`**: a boat pole of bamboo, 4–6 m. Ten figures:
  - the six polers;
  - the three fenders (held overhead or level);
  - `deck_pole_holder_19625` on the bridge, held level across the railing.

  The pole's hand placement follows the take. Until then it is placed for `stand_pole`.
- **`pole_buckets`**: a shoulder pole with two banded wooden buckets on ropes (`far_water_carrier_19720`).
  `kit_city_end.hooped_bucket` and `song_kit.bucket` give the geometry.
- **`pole_jar_bundle`**: a shoulder pole with a dark round jar in a rope sling at one end and a tall bundle in a rope net
  at the other (`porter_jar_bundle_18483`).
- **`pole_fringe_frame`**: a shoulder pole with a bow-shaped frame hung with a fringe of long strips at its back end
  (a pedlar's rack of hanging goods), and a round bag at the front (`porter_straw_hat_17762`).
- **`back_sack`**: a big sack slung on the back, its tied neck at the top, in a dark and a pale tone
  (`sack_porter_18915`, dark; `porter_carrying_17922` on the unloading boat). It is played on `back_load`.
- **`shoulder_sack`**: a big white sack over one shoulder, held at its neck (`white_sack_porter_18882`, on
  `back_load`).
- **`back_reeds`**: a tall bundle of sticks or reeds upright on the back, rising above the hat
  (`wide_hat_pointer_18890`). S4b's `back_tall_bundle` may serve.
- **`flat_basket`**: a big flat round woven basket (a winnowing-tray shape) held tilted at the waist
  (`basket_carrier_19138`, on `hold_tray`).
- **`rope_coil`**: a coil of rope (or a folded cloth) held at the chest (`deck_rail_watcher_19670`).
- **`bun_plate`**: a small plate with two or three round buns, held out in the right hand (`waiter_calling_17451`, on
  `hold_tray`).
- **`hip_bag`** (S7's) on `robe_apron_man_18582`, and **`bundle_small`** (S7's) on `walker_with_bundle_17396` (a dark
  shaggy bundle held low in the hand).

## Kit parts the area needs (what exists, what is new)

S3's new parts go in its own area kit. By `build_rules.md` that is `blender/kit_<folder>.py`, but for S3 that name is
`kit_rainbow_bridge.py`, the factory's set-piece module, which areas import and never edit: **the lead names S3's area
kit** (for example `blender/kit_rainbow_bridge_area.py`). Shared kits are imported, never edited. Existing pieces are
named with their module. S4b's area kit (`blender/kit_outer_road_2.py`, being built now) has several of S3's needs:
import it read-only once it lands. **new** marks what no kit has.

**十千脚店 (the tavern complex, u 15510–17330):**
- `S3.bld.tavern_river_hall_15540`: the **two-storey riverside hall** (its upper floor at 3.83 m).
  - **Roof:** a big 歇山 roof (`kit_inner_city.xieshan_roof`) with a ridge ornament and a barge-boarded gable over its
    east end. Under the eave run a band of slanted slats and a beam.
  - **Upper storey:** a front of narrow bays: lattice windows (`song_kit.lattice_window`), an open panel with a table, a
    doorway with a plain partition panel, and an open middle bay with a hanging light curtain and an open shelf rack.
  - **new: the balcony.** A platform band (平坐) under a baluster railing (`song_kit.balustrade`) runs along the front
    and turns at the south-east corner into a **side gallery** running back north-east under its own slatted roof.
    `gate_scene.py`'s bracketed balcony is the nearest model, lifted into the area kit.
  - **Pent roof:** under the balcony's east part (15955–16300), a tiled pent roof (腰檐) with drip tiles
    (`kit_inner_city.lean_to`).
  - The lower storey's walls are not painted: placeholders hidden behind the bottom-edge roofs and trees.
- On its upper floor:
  - `table_16145` with `dishes_16120`;
  - **new** `basin_16180` with `food_heap_16170`: a big round bowl-shaped vessel with a hatched belly, heaped with
    round things touched with pink and red (fruit, buns or flowers). Use `kit_outer_road.heaped_basket` with a fruit
    heap in place of its straw;
  - **new** `pot_on_rack_16140`: a small dark pot on the lowest shelf of an open rack, with red touches on the rack;
  - `table_15745`: a table or a low couch with splayed legs;
  - `leaning_pole_15912`: a pole leaning across a window.
- `S3.bld.tavern_wing_16300` and `S3.bld.tavern_rear_hall_16560`: roofs seen from above (a ridge running back north
  with ornaments; an east-west ridge with a knob ornament). No walls are painted: placeholders behind the roofs.
- `S3.bld.tavern_gate_16870`, the **gate (门楼)**:
  - a tiled roof whose eave has a **red-painted fascia**;
  - under the front eave a **valance of fine vertical hatching** (S4b's `kit_outer_road_2.valance`);
  - **new: a 垂柱**, a short hanging post ending in a carved knob in mid-air at the west front corner. The other
    reading is a column on a drum-shaped base;
  - posts to the ground;
  - **new: a long striped curtain gathered and tied** at the east front post;
  - three narrow vertical boards with characters, all illegible (□□□□, □□, □□): `kit_outer_road.hanging_sign` with
    an illegible atlas cell;
  - on its roof, the 彩楼欢门 (set pieces).
- `S3.str.gate_fence_16955`: a fence of close red-brown vertical bars with a top rail (`kit_inner_city.slat_fence`,
  red-brown).
- `S3.prop.lamp_box_jiaodian_17035`: the **十千脚店 lamp-box** with an ornamented crest
  (`kit_inner_city.lamp_box`). Its front face reads **腳店** (the full form of 脚) and its east side **十千**: two new
  atlas cells, copied from the scan, not the restyle (which rewrites them).
- **new** `S3.str.chazi_barrier_16800`: a **杈子 of crossed bars (X) between two long rails**, about 1.2 m, with a small
  capped post box near its north end. S6's `slat_fence` 杈子 is vertical slats; this one is crossed bars
  (`kit_city_end.capped_rail_fence` with X braces).

**The open ground (u 17300–18300):**
- **Canopies:**
  - `mat_canopy_17600`: a flat dark woven-mat canopy on posts with a slanted west end (`kit_inner_city.mat_roof`).
  - **new** `lattice_mat_awning_17840` (low): a woven-mat awning stiffened with a **diagonal lattice of bamboo slats**,
    sloping from the bank's edge down to the south. It is a `mat_roof` with a slat lattice.
- **Stalls under the canopy:**
  - **new** `bottle_stand_17600` with `bottles_on_stand_17600`: a box stand with a dark cloth-hung front, carrying four
    or five round-topped bottles or narrow-necked jars (a wine bottle form).
  - `goods_table_17708` with `jars_on_table_17700`: about six small round-topped jars.
  - `food_stand_17815` with `round_tray_17815`: a tall stand (1.01 m) with a round tray (`kit_inner_city.tray_stand`,
    round).
- **new** `small_goods_display_18060`: a **sloping display board laid with rows of small dark goods** (rods, rings,
  scissors- and knife-like things, combs), with a dark box at its corner. It is a hardware pedlar's board: an atlas cell
  of wares on a slanted board (`kit_city_end.lattice_stand` gives the slant).
- `goods_table_18232`: a table with **stacks of bowls** (`kit_inner_city.dishes`, stacked).
- `basket_on_stand_18005`: a wide shallow wicker basket on a stand (S4b's `sieve_basket` on a stand).
- `stick_on_ground_17615`: a long stick or plank lying on the ground.
- **Parasols** (`kit_inner_city.umbrella`):
  - `parasol_17408` (a dark canopy tilted toward us, with a knob) over `stall_table_17380` (dark top, splayed legs,
    dark things stowed under);
  - `big_parasol_18160` (about 30 ribs, very large).
- `S3.prop.xinjiu_flagpole_17630`: see Set pieces.

**The bridge's south foot and its ramp (u 18300–19000; the ramp's things stand on the deck collider):**
- **Stalls on the deck:**
  - `mat_awning_stall_18330`: a sloping woven-mat awning on poles (`song_kit.canopy`), high at its north edge, over
    `stall_table_18540` (shallow bowls, dishes and round trays: `kit_inner_city.dishes`, `tray_stand`).
  - **new** `coiled_goods_18600`: a heap of flat coils (twisted dough or coiled baskets).
  - `dark_basket_18500` (`round_basket`), `bench_18630` (`kit_inner_city.bench`), `slatted_panel_18615` (low: a rack,
    a ladder set down or a bench back; `kit_city_end.lattice_stand`), and `parasol_stall_18585` (tilted).
  - `mat_awning_stall_18783`: a flat woven-mat awning whose east side **rests on the bridge's near railing**
    (`mat_roof`, tied to the set piece's railing), over the upright slatted rack `awning_rack_18797`
    (`kit_outer_road.slatted_box`, tall, horizontal slats).
  - `round_tray_stand_18403`: a big round tray of cakes or bowls on a splayed-leg stand (`kit_inner_city.tray_stand`,
    round).
- **On the ground at the foot:**
  - `parasol_big_18748` over `goods_stand_18800` (a slatted goods stand and a light box);
  - **new** `goods_pole_18785`: an upright pole in a dark box-like stand, hung from man height to above the head with
    **clusters of curly, twisted goods** (dough twists, toys or sweets): a pedlar's display pole;
  - `round_basket_18865` (low).
- **The twin parasols (the 饮子 stall of pin 22?):** `parasol_upper_18606` and `parasol_lower_18538` are big flat
  parasols side by side. The lower one's ribs gather under the canopy into a **turned, vase-shaped runner** on the
  pole: a new detail on `umbrella`. With them:
  - `hanging_signboard_18463`: a small framed signboard hanging from the lower parasol's west rim
    (`kit_outer_road.hanging_sign`, illegible □□);
  - `lamp_box_18676` (low): a small lidded box or lamp-box sign;
  - `hooked_stick_on_wall_18474` (low): a small hooked post.
- `S3.str.tiled_wall_18450` (low): a wall with a coping of round tiles, turning east at its north end
  (`song_kit.yard_wall`). The other reading is a lower roof's tiled edge.

**Under the arch and the south bank's shops (u 19000–20500):**
- `S3.bld.mat_shed_19160`: a gabled roof of diagonally plaited mat at the water's edge, with a mat flap closing its west
  gable end. Over `stall_table_19228` (a flat dish, bowls and a lidded box). Use S4b's `open_mat_shed` or
  `kit_outer_road.thatch_shed` with mat.
- `S3.bld.mat_shed_19530`: a single-pitch cross-hatched mat roof sloping to the front over a front of vertical boards
  and door-like panels (`kit_inner_city.lean_to` in mat, a board wall).
- **Parasols:** `big_parasol_19565` (very large, tilted back, its pole slanting over the shed's roof) and
  `tilted_parasol_19790` (tilted steeply west) (`umbrella` with `tilt`).
- `S3.bld.bridge_foot_hall_19000`: the **biggest roof on the south bank**, an overhanging-gable (悬山) roof of round
  tiles seen from above, its ridge running back north. Its open south gable has a log tie beam on four columns and a
  king post with a hanging fish and two star-shaped ornaments. This is **S4b's south-row hall type**
  (`kit_outer_road_2.south_row_hall`, `kingpost_gable`, `kit_outer_road.hanging_fish`); the star ornaments are new.
- `S3.bld.open_shop_20000` and `S3.bld.front_roof_19800`: a long single-storey tiled building with a hipped west end and
  an open front, and a hipped roof in front of it at the silk's edge.
- **Furniture in the open shop:**
  - `shop_table_19776` with `bowl_on_table_19816`, and `shop_low_table_19797` (`song_kit.table`, `dishes`);
  - `shop_chair_19725`, a chair with a slatted back (`kit_city_end.armchair`);
  - `shop_bench_19902`, a bench with a lattice side (`bench` with a `lattice_frame` side);
  - `shop_long_board_19601` (low: a long bench set end-on, or a ladder) and `shop_wall_bench_19582` (low);
  - `shop_table_tray_20140` (low): a long table with a big oval tray and a small pot (S4b's `tray`);
  - `signboard_19982`: a signboard leaning back at the shop front, its writing illegible
    (`kit_inner_city.signboard`, tilted, □□□);
  - **new** `slanted_board_19912` (low): a large plain board propped at a slant across the shop's front (a counter top,
    a couch, or a shutter taken down).
- **The parasol stall at the seam:** `parasol_20288` over `parasol_stall_table_20245`, with `stool_20126`, `jar_20109`
  (`kit_inner_city.pot`) and `small_box_20345` (`slatted_box`).

**The north bank (u 19000–20500), painted at 0.5–0.7 of the street's size:**
- `S3.bld.tavern_20230`, **the north-bank tavern (pin 21)**: a large roof with a lattice-filled east gable, a lower roof
  skirt with tile ends over a band of lattice windows, and open bays on slender posts at the water's edge. Its storeys
  are unsettled (one or two; the note gives both).
- **Its furniture, all empty** (no customers are painted): `tavern_table_20168` and `_20340`, `tavern_bench_20124`,
  `tavern_chair_20325` and `_20390` (high-backed: `kit_city_end.armchair`), `small_table_20460` (dark top), and
  `low_table_wares_20013` (a long low table set obliquely with small wares; it stands on the route).
- **The stalls:**
  - `far_counter_19555` (`kit_inner_city.counter`);
  - `far_tray_stand_19563` (low): a flat basket on a splayed stand, a pedlar's display (`tray_stand`, round);
  - `parasol_far_stall_19440` over `far_stall_table_19410`;
  - `far_bank_tables_19210` (low): **one entity for a row of about seven small square tables with benches** at
    u 19075–19395, their spans listed in its `what`. The builder places seven tables and their benches along them.
- **Buildings:** `S3.bld.north_bank_shop_19290` and `S3.bld.north_bank_shed_19620` (low) show only a front band or posts
  and beams under the silk's top edge. Their roofs are off the silk: build them as placeholders behind the strip.

**The far bank west of the bridge (u 16550–18600), painted at 0.22–0.35 of the street's size:**
- **new** `S3.bld.far_bank_hall_18520`: a **long open hall whose raised plank deck stands on short stilts over the
  sloping bank** (deck H 0.39). It has a railing along the deck's front and a wall of vertical boards at its east end.
  It is `song_kit.open_hall` on a stilted deck: a new part, a plank deck on stilts over a slope.
  - Inside: `hall_table_18508`, `far_hall_table_18478`, `far_hall_long_table_18410`, `hall_bench_18550`,
    `far_hall_bench_18447` and `far_hall_chairs_18393` (curved back rails: `armchair`).
  - `far_parasol_18400` (a parasol, or a round awning fixed to the hall).
- **The long far-bank roof's shop fronts:**
  - `far_hall_17875`: a long counter and a low lattice balustrade;
  - `far_shop_17725`: two rows of diagonal lattice between posts;
  - `far_shop_17575`: a short slatted canopy, a basin at its door;
  - `far_shop_17290`: a mat canopy on posts over two tables;
  - `far_shop_17170` (low): a canopy edge on posts under the willow;
  - `far_bank_shed_18280`: a small open shed on 3–4 posts.

  Build them from `song_kit.open_hall`, `kit_inner_city.lattice_frame` and `song_kit.canopy`.
- **Their furniture:**
  - empty square tables with stretchers: `far_bank_table_17435`, `_17533`;
  - long benches: `far_bank_bench_17416`, `_17470`, `_17515`;
  - `far_bank_counter_table_17347`, a long table with a board apron;
  - `far_bank_bench_17278` (splayed legs), `far_bank_table_17245`, `far_bank_table_17105` (low);
  - `far_bank_long_table_17945` with `far_bank_thing_on_table_17968` (a small pot or basket with a handle);
  - `far_shop_long_table_18120`, `far_shop_table_18168`, `far_shop_bench_18060`;
  - `far_shed_table_18265`, `far_shed_bench_18288`, `far_chair_18322`;
  - `far_bank_low_table_17652`, and `far_bank_basin_17662` (a large dark shallow basin: `kit_inner_city.tub`);
  - `far_bank_slatted_stand_17080` (low): a small stand with horizontally slatted sides on legs (`slatted_box` 'h' or
    `kit_city_end.box_shed`).
- `S3.bld.far_house_16560`: a tiled house with an open front of thin posts and a board panel. A plank terrace edge
  with a low rail on short legs runs along the bank (`song_kit.open_hall`, `kit_outer_road.low_rail_fence`).
- `S3.str.far_wall_16895` (low): a faint low wall with a coping (`song_kit.yard_wall`).
- `S3.bld.far_bank_house_18850` (low): a tiled roof running off the top edge.

**Roads and ground:** `S3.road.main` is bare earth. No kerb or paving is drawn anywhere. At the frame's one scale the
north bank east of the bridge runs 5.8 m from the water to the silk's top edge, but the land between the water and the
tavern's front is only 1.6–2.3 m, and the route's edges there are 1.0–1.3 m apart. Room to walk there is a recorded
build choice.

## Set pieces

- **The Rainbow Bridge** (`S3.str.rainbow_bridge`): the factory's kit is done (`kit_rainbow_bridge.build()`). The map
  adds:
  - **The deck's heights:** 17 supports, one per 50-px band west of the painted near edge (`map/frames/S3.json`; the
    `H_profile_X` the lead asked for can't fit this deck). The kit builds the deck square and walkable: 8.25 × 25.5 m,
    crown 5.29 m, ramps extended 2.5 and 3.0 m. Against the map: its fit has rms 2.51 m, its `on_deck` H differs from the
    world's by rms 1.76 m, and **30 of the 88 deck entities' world positions fall off the built deck**. Place them with
    `on_deck`, and record each move in `build_choices.json`.
  - **Three 表木, not two:** `bridge_end_post_19026` (south-east) and `bridge_end_post_20050` (north-east), both high,
    and **`bridge_end_post_far_19176`** (low), a smaller X-topped pole behind the crown's crowd, the far-side twin or a
    pole on the far bank. The kit builds two.
  - **Things on the deck:** two mat-awning stalls (one resting on the near railing), their tables, rack, bench, coiled
    goods and basket; two parasols on the deck (`parasol_stall_18585`, `parasol_19150`); the frame awning
    `frame_awning_19070` (low); and the bundle hanging over the railing `bundle_over_rail_19392` (low; **new**: a soft
    pale bundle on a rope against the rail's outside). All of these need the deck collider under them.
  - **Railing:** 0.65 m above the deck edge as mapped, against the kit's real-size choice.
  - **Hooks:** three U-shaped hooks or rope loops under the arch's rib (low; above).
  - **Clearance:** the kit warns that its soffit is 2.86 m above the water over the middle 40%, under the 3.5 m it
    wants for the big boat (the frame's question). The big boat's poop stands at H 2.29 and its mast is half lowered;
    the cabin boat lies right under the arch. Check both with the kit's `clearance()` before the deck shape is settled.
- **十千脚店's 彩楼欢门** (`S3.str.cailou_huanmen_16880`, new set piece), recorded pole by pole (structures_w's report
  and the entity's custom `pts`):
  - **Where it stands:** **on the gate's roof**, on a diamond-lattice parapet at 16880–17113, about 6.2–7.0 m above
    the ground.
  - **Structure:** four tiers of cross-bars, the widest with outward fans springing from its ends, and eighteen poles:
    plain tall poles, A-frames, fans splaying out west and east like a crown, and **three tapering spires of bound
    poles with many cross-ties**. The tallest top is 16.8 m above the ground, at (17230, 499).
  - **Hung on it:** nothing but lashings. No flowers, streamers or lamp-boxes.
  - **The 新酒 bar's** west end is tied into its east side.
  - **Kit:** built as part of 十千脚店 in S3's own kit (`build_rules.md` §4), from `kit_inner_city.cailou(flowers=(),
    streamers=(), lanterns=(), lattice=…)` with a new spire form (bound pole bundles with ties, in place of the flower
    spire). It stands on the gate's roof, so the roof carries it.
- **The 新酒 pole and banner** (`S3.prop.xinjiu_flagpole_17630`, 9.0 m mapped; pin 23), **new**:
  - **Pole:** a tall free-standing pole topped by a small crossbar and a **bird-shaped wind vane** (its head west). An
    X-frame of two slats crosses it lower down, like the 表木's.
  - **Bar:** a long horizontal bar runs west at v ≈ 905 to the scaffold, with a stay from (17500, 880) up to the pole.
  - **Banner:** from the bar's east half hangs a long pale cloth with three dark vertical bands. **新酒** is written
    faintly in the middle band's light panel, top to bottom (an atlas cell).
  - **Kit:** the cloth from `kit_inner_city.banner_on_pole`, and the X-top from the bridge kit's 表木. The vane and the
    bar are new.
- Not in S3: the 望火楼, a thatched farmhouse, the threshing floor.

## Trees: 20, by form (`trees/types.md`; all bare, early spring: the restyle leafs every willow, the scan doesn't)

Heights are the mapped painted heights. Eight trees are `conf: low`.

- **`willow_fan`, 8:**
  - `far_willow_16582` (2.7 m) and `far_willow_16662` (2.5 m): far-bank willows whose trunks lean west from the bank
    to knobby pollard heads, their whips fanning up to the silk's top; their feet hidden behind the moored boat. Cards
    `_1` and `_3`.
  - `willow_far_17205` (2.3 m): upright, straight and slender, with a knobby head and whips spreading east over the
    eating place. Card `_2`.
  - `bare_tree_16520` (6.3 m): a straight trunk dividing at a dark knot into long thin upright twigs, with long fine
    strands hanging down in front of the tavern's west roof (the other reading is its own twigs). Card `_2`.
  - `willow_head_16010` (2.1 m) and `willow_head_16130` (2.0 m, low): fans of long straight shoots rising from behind
    the riverside hall's ridge, the trunks unseen. Any card, the lower trunk hidden.
  - `willow_hidden_trunk_18893` (2.7 m, low): a crown of long thin whips fanning up and west from behind the deck
    crowd. Any card.
  - `willow_crown_top_15520` (0.9 m, low): only the lower whips of a far-bank willow whose head and trunk are beyond the
    silk's top edge, by the S4b seam. A crown only: card `_1` cut by the edge, or a panel painting.
- **`willow_burl`, 1:** `willow_far_17185` (2.7 m): an old pollarded willow, its thick trunk leaning north-west from
  the bank top to a knobby head with a wide fan of whips. Card `_3` (the bole leans left, a broad fan).
- **`shoot_tree`, 6** (the bottom-edge trees, nearest the viewer):
  - `bare_15728` (4.3 m): a leaning trunk forking into a broad crown of fine upward twigs. Card `_1`.
  - `bare_15805` (4.2 m) and `bare_tree_16342` (3.5 m): short trunks splitting into two stems in a V. Card `_3`.
  - `low_shoots_15995` (1.4 m, low) and `low_shoots_16145` (1.2 m, low): low fans of long bare shoots from below the
    silk's edge. Cards `_4` and `_2`.
  - `bare_twiggy_18972` (2.4 m): long thin straight twigs fanning up from a short hidden trunk behind the deck's south
    end. Card `_2`.
- **`whip_clump`, 2:** `stem_thicket_16410` (1.5 m, low) and `small_bare_15715` (1.5 m, low; short forked shoots over
  the hall's west ridge). Cards `_2` and `_1`.
- **`elm_claw`, 1:** `bare_tree_16460` (5.0 m): stiff, crooked, forking branches, the trunk leaning east toward its
  foot and the crown spreading west over the water and the hall's roof. Card `_3` (wide level west limbs).
- **`bamboo`, 1:** `shrub_16917` (0.4 m): a low clump of long pointed leaves or stiff stems at the far-bank wall's foot.
  Card `_5` (the low young clump). The other reading is `whip_clump`.
- **`leafy`, 1:** `shrub_or_heap_20025` (0.7 m, low): a dark, mottled, lumpy mass east of the handcart. Card `_1`. The
  other readings are a heap under a cover, or the handcart's load (then no tree).

**Not S3's:** the dark-trunked tree at the S2 seam (`S2.tree.dark_trunk_willow_20530`) and the big willow at the top
(`S2.tree.willow_top_20552`), both S2's by their main points. S4b's seam willow (`S4b.tree.willow_15468`) spreads its
crown over the riverside hall to about u 15810.

## Also (not the workshop's list, for the lead)

- **Seated figures** take their seat from the furniture's real height: the stools and benches at the stalls, the
  slatted chair in the shop, the far-bank benches. The diners on the upper floor sit at 3.83 m. The sweep crew stand on
  the stern deck (−0.13) and the bowmen on the raised bow deck (1.12).
- **The crews are painted, so no crew is added:** the long passenger boat holds one faint figure in its door, the
  lowered-mast boat none, and the skiff none. The north-bank tavern's tables are empty (pin 21: no customers painted).
- **A stale `what`:** `S3.bld.open_shop_20000` still says "a pole from that end carries a hanging sack". That sack and
  staff are `porter_with_pole_20450`'s load (`hanging_sack_and_staff_20412` was retired at the second pass). Rewrite
  the `what` in `merge_fixes.mjs` at the next merge, so no builder hangs a sack on the shop.
- **Two low animals and a horse head** need the lead's call before they are built: `second_horse_19230` (a horse
  behind the crowd, or a bent man) and `dog_or_donkey_19825`.
- **The rope from the bridge** is the one painted line between a figure and a boat. It is a scene line, re-aimed if the
  boat moves; the boats page re-aims the boats' own ropes.
