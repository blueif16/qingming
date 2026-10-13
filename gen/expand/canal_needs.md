# The canal wharves (S2, u 20500–29050): what the workshop needs to make

From the S2 needs agent, Run 1 of round 2 (2026-10-12), for the lead's catalogue agent. Every item comes from the
scroll map: `map/text/S2.md` says where each thing is and what it does, and `sections/canal/layout.json` holds the
positions. There are 398 entities after the merge, the second pass and the frame, of which 140 are figures and 17 are
boats. Figures are named by their slug (`S2.fig.<slug>`). Crops are scan px `[u0, v0, u1, v1]`.

To read the scan beside the restyle, use `node tools/scroll_inspect.mjs canal/west <u> <v> <half>` for u < 24768 and
`canal/east` above it. The restyle invents most on the canal: extra people in empty yards and on decks, figures in
willow knobs, and dry ground under the moored boats at u 25500–26400 (`sections/canal/notes.md`). The crops this file
names are in the scratchpad folder `S2_needs/`: gridless, contrast-stretched scan on the left, restyle on the right.

**Real size** (`map/BUILDING.md` rule 5): every person, animal, cart and boat is made at real size; only positions
come from the map. Painted heights here are not sizes, and S2's figures shrink up the silk (structures_w's table):
- the south bank at the bottom edge: 145–196 px;
- the grain wharf and the sweep boat: 120–155 px;
- the bank strip at v 300–600: 92–123 px;
- the far street at v 130–150: 54–73 px.

S2 is painted 1.5–3 times larger than S4 at the same v. Children's scales below are measured against the adults
painted beside them.

**Credits.** Meshy has about 151 credits left for the whole round (`gen/expand/round2_progress.md`). **S2 needs no new
character:** all 140 figures are cast from the existing 22. Every clip they play now is either their own or a free
local retarget (`tools/retarget_local.mjs`, `from:` or `t2m:`). The paid items are optional:
- the Text to Motion takes ranked below (10 credits each). Every figure that wants one plays a stand-in now. S2 adds
  one take of its own, `sack_carry`, which also serves S3's sack porters. Its other wants are S3's takes (`work_sweep`,
  `tow_walk`, `pole_boat`, `fend_pole`, `haul_line`), and S2 adds weight to them;
- the **boatman** (about 30 credits), which S3's needs list proposes. S2 has 43 more crew for him, and two better
  model figures (below).

## Casting: 140 figures, all from the existing 22

| character | figures | | character | figures |
|---|---|---|---|---|
| idler | 28 (19 on boats) | | child | 5 (scaled 0.55–0.85; 2 on boats) |
| porter | 24 (13 on boats) | | sightseer | 4 (1 on a boat) |
| carter | 13 (8 on boats) | | woman | 3 (1 on a boat) |
| robed_man | 12 (2 on boats) | | storyteller, fortune_teller | 2 each |
| scholar | 12 (1 on a boat) | | child_robed, official, butcher | 1 each |
| townsman | 10 (3 on boats) | | | |
| camel_driver | 9 (1 on a boat) | | | |
| hat_traveller | 7 | | | |
| inspector | 6 (2 on boats) | | | |

**Confidence:** 42 high, 56 med and 42 low. Where a low figure has another reading (a vase, a bitt, a rudder head, a
cloth, a ridge ornament), that reading is in its line. The figure is cast anyway; the lead decides whether it is built.

**Where they stand** (map supports, H from `layout.json`):
- 74 on the ground, one of them seated on his own sacks (`ground: on S2.prop.sack_pile_27996`);
- **53 on boats.** Of these, 43 are crew marked `[boatman]`. The other 10 are passengers, though two of them
  (`boatman_side_deck_23195`, `man_cabin_door_24728`) could be crew:
  - 39 on `boat deck`;
  - 8 on `boat roof`;
  - 3 on `boat stern deck`;
  - 1 each on `boat bow deck`, `boat after roof` and `boat ladder`;
- 5 on the riverside terrace's floor and 2 on 沿河雅座's upper floor (H 1.3);
- 3 on the bank slope (H −0.35), 1 on the mule cart's bed (H 0.91) and 1 riding;
- **1 man standing waist-deep in the open water** (`man_in_river_20970`, H −0.7). He is painted from the waist up
  with nothing under him, so he is built as painted and never given an invented boat.

**Crowds are small.** The briefs and the restyle expected 15–25 crew per river unit and dense sheds. The scan has 5
figures on the grain wharf's four boats, one certain figure in u 26900–27600, and empty tables at 喝杯小酒 and in
most sheds. People.json must not add any.

**The dress decides the cast**, as on S4b and S3:
- short jackets and trousers are the idler or the porter (the carter for some crew, so the idler doesn't play 40);
- long light robes with a dark cap are the scholar;
- a light robe without a cap is the robed man;
- dark long robes are the townsman, the inspector or the fortune-teller;
- wide hats are the hat traveller (four of S2's seven are labourers in brimmed or conical hats);
- an apron over a short jacket is the butcher (the grain owner's young servant);
- the bearded grain owner and the bearded shopkeeper are the storyteller (bearded, cap).

The faint figures whose dress can't be read went to the camel driver and the carter.

**The boatman (optional, about 30 credits).** S3's needs list proposes him for its 36 crew, S4b's 5 and S2's crews.
S2 has 43 crew marked `[boatman]`, plus `bank_man_with_stick_25370` on the bank, so he would play about 85 figures
across S4b, S3 and S2. S3's model figure (`S3.fig.man_waving_on_boat_roof_19952`) is seen from behind. S2's sweep
crew are painted at 128–155 px, face on, so they make better models:
- **Front:** `sweepman_upright_22168`, crop [22100, 805, 22205, 985] (`S2_needs/crop_boatman_upright_22168.jpg`). He
  is tall, round-faced, with a dark hair band or cap and a long light jacket, and he looks straight at us. His feet are
  hidden by the loom.
- **Dress and three-quarter view:** `sweepman_leaning_on_loom_22285`, crop [22215, 830, 22320, 985]
  (`S2_needs/crop_boatman_loom_22285.jpg`). He wears a cap and a short jacket belted at the waist, with rolled
  sleeves; the restyle gives him a dark wrap at the hips.
- **The whole crew:** crop [22040, 800, 22320, 1000] (`S2_needs/crop_sweep_crew.jpg`).

If he isn't made, the crews stay as cast.

**Optional variants (the catalogue's call):**
- **A dark broad-brimmed hat** on the hat traveller, which S4b also asked for: `big_hat_man_south_bank_22045` wears a
  broad dark round hat with a hanging tie. Crop [21990, 1560, 22100, 1720] (`S2_needs/crop_big_hat_22045.jpg`).
- **A straw rain cape (蓑衣),** as a prop, on `tracker_hatched_coat_21994` (crop [21955, 190, 22035, 290],
  `S2_needs/crop_straw_cape_21994.jpg`), and perhaps over `boatman_roof_26290`'s lower body.

**Clips to add, all free** (local retarget, no credits). Many are the same additions S3 and S4b asked for, so the
catalogue merges them. Run `node tools/clips_used.mjs` after casting.
- **porter:** `push` (`from:idler/push`), `look` (`from:townsman/look`), `lean_over` (`t2m:lean_over`), `crouch`
  (`from:idler/crouch`), `back_load` (`from:townsman/back_load`), `bend_goods` (`t2m:bend_goods`), `push_flank`
  (`t2m:push_flank`), `reach` (`from:child/reach`), `sit_floor` (`from:idler/sit_floor`).
- **robed_man:** `look`, `sit` (`from:scholar/sit`), `drink` (`from:scholar/drink`), `point` (`from:idler/point`),
  `chin` (`from:inspector/chin`), `sit_floor`, `sit_listen` (`t2m:sit_listen`), `stand_pole` (`from:porter/stand_pole`).
- **idler:** `back_load`, `reach`, `sit_talk` (`from:official/sit_talk`), `sleep_side` (`from:soldier/sleep_side`),
  `stand_pole`, `knees_up` (`t2m:sit_knees_up`).
- **scholar:** `bow` (trimmed earlier, back from `from:townsman/bow`), `bridle` (`t2m:hold_bridle`), `lean_over`,
  `sit_talk`, `sit_listen`.
- **hat_traveller:** `push`, `crouch`, `carry_pole` (`from:porter/carry_pole`).
- **woman:** `lean_chin` (`from:idler/lean_chin`), `tie_kerchief` (`from:idler/tie_kerchief`), `ride_side`
  (`from:elder/ride_side`).
- **townsman:** `sit`, `kneel_sleep` (`from:soldier/kneel_sleep`).
- **carter:** `arms_folded` (trimmed earlier, back from `from:inspector/arms_folded`).
- **inspector:** `push`.
- **sightseer:** `sit_listen`.
- **child, camel_driver, storyteller:** `sit`.
- **fortune_teller:** `talk` (`from:townsman/talk`).
- **butcher:** `hand_over` (`from:carter/hand_over`).

Each line below reads: the figure, the clip it plays now ("until" the take it waits for), its carried props, then its
dress and action. Non-ground supports carry their H in metres from `layout.json`. `[boatman]` marks the crew he would
replace.

### idler (28, 19 on boats)

- `boatman_pole_20495`: `stand_pole` until `fend_pole`, props `long_pole` [boatman]. Short jacket, topknot, at the north-bank cargo boat's west end holding a long pole slanting down west past the gunwale, fending off S3's big boat (`S3.veh.boat_mast_lowering_19518`) lying against it (`boat deck`, H -0.02).
- `boatman_standing_20615`: `reach` [boatman]. Pale short jacket, behind the lattice rail amidships, bending a little forward with his arms out west, watching S3's big boat (`boat deck`, H -0.02).
- `boatman_on_roof_20683`: `point` [boatman]. Short jacket, standing on the low mat cover over the cargo, bent forward with his right arm stretched far west toward S3's big boat, calling or signalling (`boat roof`, H 1.05).
- `man_cabin_door_20877`: `squat_sleeves` [boatman]. Round face, dark hair, seated or squatting in the east cabin's planked doorway facing us; only head and shoulders above the gunwale (`boat deck`, H -0.02).
- `bank_crouching_21155`: `crouch`. Low: a small figure crouching low in a dark rounded cap over a pale jacket, lower body cut by the roof ridge (other reading: a dark basket on a pale bundle).
- `man_cabin_window_21333`: `sit` [boatman]. Dark hair, seated inside the big cabin boat's low cabin, head and shoulders in its window, looking out at us (`boat deck`, H -0.12).
- `crouching_man_by_timber_21880`: `crouch`. Low: a dark round head and a hunched body under the west end of the slanting timber at the thatched roof's edge, crouching with the timber's end at his shoulder.
- `tracker_bent_21939`: `push` until `tow_walk`. 纤夫: light short clothes and a small hat, bent far forward with his back almost level, both hands low on the rope at his waist, the rear leg pushing off.
- `sweepman_leaning_back_22110`: `push` until `work_sweep` [boatman]. Light jacket, at the west end of the great sweep's loom, leaning far back with his face turned up, hauling on it (`boat deck`, H 0.73).
- `sweepman_leaning_on_loom_22285`: `push` until `work_sweep` [boatman]. The easternmost, in a cap and a short jacket with rolled sleeves, leaning his weight down on the loom where it runs to the stern frame, face west (the boatman model, above) (`boat deck`, H 0.73).
- `boatman_pouring_bucket_22665`: `bucket_lift` until `pour_bucket`, props `bucket` [boatman]. Dark hair, bent over the near gunwale under the mat roof's east end, tipping a wooden bucket so its water pours down the hull into the river (余辉's 船侧祭神? unconfirmed) (`boat deck`, H 0.53).
- `passenger_reclining_on_cargo_22848`: `sleep_side` until `lie_prop`. A passenger in a light jacket lying back on the bales on 豪华客船's cabin roof, propped on one arm over a round basket, head east against a rolled mat, looking at the bank (`boat roof`, H 2.03).
- `boatman_fending_off_23688`: `push_flank` until `fend_pole`, props `long_pole` [boatman]. Light short jacket, on the foredeck behind the bow hood, leaning forward north-west and pushing a long pole against 豪华客船's stern to keep the boats apart as his boat passes (`boat deck`, H 0.21).
- `man_bow_arm_out_23795`: `point` [boatman]. Light jacket, on the high cargo boat's bow deck behind its deck post, facing us with his right arm stretched out east, pointing or calling to the crew (`boat deck`, H 1.77).
- `boatman_roof_leaning_24030`: `crouch` [boatman]. Dark tied-up hair, crouching on the cabin roof and leaning forward over it with both arms out, working a line or a pole (`boat roof`, H 1.7).
- `crewman_crouching_white_24067`: `crouch` [boatman]. In white, crouching with his back to us beside the big round coils on the cargo boat's deck, working at something (`boat deck`, H 1.77).
- `boatman_hauling_mast_24140`: `squat_sleeves` until `haul_line` [boatman]. Short jacket, kneeling on 逆水行舟's cabin roof just west of the mast, leaning forward with both hands together on a line from the mast, hauling or belaying; face west (`boat roof`, H 1.7).
- `man_seated_deckhouse_24393`: `sit_talk` [boatman]. Light clothes, seated in the open-sided deckhouse amidships facing east to his companion: 名画记 pin 16 聊天的伙计 (`boat deck`, H 1.77).
- `boatman_roof_seated_24478`: `sit_floor` [boatman]. Dark hair, sitting hunched among coils of rope on 逆水行舟's cabin roof behind the mast, minding the lines (`boat roof`, H 1.7).
- `man_cabin_door_24728`: `look`. Dark hair, standing in 逆水行舟's after cabin door with one hand on the frame, looking out south at the water; crew or passenger (`boat deck`, H 0.21).
- `figure_under_canopy_25518`: `sit_floor` [boatman]. Low: seated under the moored boat's arched mat canopy beside a lidded jar and a bowl, a boatman at his meal (other reading: a potted plant and gear) (`boat deck`, H 2).
- `barrow_puller_25607`: `lead`. Low: standing between the crate barrow's shafts at its east end, pulling it east (his outline overlaps the stall awning's crossed poles).
- `stall_keeper_26174`: `sit`. Light clothes, behind the far-street stall table under the shed, only head and shoulders over the goods, head turned to us.
- `boatman_roof_26290`: `crouch`, props `straw_cape` [boatman]. Dark cap, crouching on the front edge of the mat-cabin boat's roof among coiled bundles, a hatched (straw or padded) garment over his lower body (`boat roof`, H 2.83).
- `man_behind_tub_27538`: `idle`. Low: a round head-like top behind the wooden tub at the east shed's west post, a keeper or servant facing us; 喝杯小酒's only possible person (other reading: the tub's load or a bracket, then no figure).
- `tub_vendor_27765`: `knees_up` until `serve_bowl`, props `bowl`. Jacket and cap, seated with knees up under the upper shed's eave beside the big tub on its low stand (`S2.prop.tub_27815`), holding a bowl out in his right hand as if serving from it: a food or drink seller.
- `youth_topknot_28222`: `tie_kerchief`. Young, topknot, short jacket, standing behind the sack pile's east end with his left forearm raised beside his face (wiping his brow, or holding up a small tally), his right side turned to the bent porter.
- `sack_porter_bent_28432`: `back_load` until `sack_carry`, props `back_sack`. Bent far forward, face down west, dark cap or hair, a big rounded sack over his back and shoulders sweeping east behind his head, his legs lost in the willow whips: coming up from the bank to the pile.

### porter (24, 13 on boats)

- `boatman_leaning_20558`: `lean_over` [boatman]. Dark hair, leaning far over the gunwale with both arms stretched west and down toward S3's big boat, pushing it off or catching a rope (`boat deck`, H -0.02).
- `boatman_far_deck_21505`: `look` [boatman]. Dark hair or cap, standing on the boat's far deck between the arched cabin and the deckhouse, head and shoulders above the roofs, turned south-west to the water (`boat deck`, H -0.12).
- `tracker_lead_21867`: `push` until `tow_walk`. 纤夫, the head of the file: light short jacket and trousers, small round cap or topknot, walking west leaning a little forward, his near arm bent up in front of his face at the rope's strap; the tow rope's end (`rope_end` (21832, 197)) is in his hands at the waist.
- `tracker_hatched_coat_21994`: `push` until `tow_walk`, props `straw_cape`. 纤夫 in a straw rain cape (蓑衣: his back and shoulders drawn with dense short hatching) over trousers, small cap, leaning west mid-stride with the rope across his body at the waist.
- `sweepman_head_back_22132`: `push` until `work_sweep` [boatman]. Bareheaded, head thrown back and face up, both hands on the loom, leaning back (`boat deck`, H 0.73).
- `sweepman_capped_22242`: `push` until `work_sweep` [boatman]. Dark cap, bending over the loom, face turned west (`boat deck`, H 0.73).
- `boatman_on_ladder_23275`: `reach` until `climb_ladder` [boatman]. Short jacket, on the ladder against 豪华客船's cabin side, his head at the roof's edge and both arms reaching onto the roof where the mooring rope is made fast (余辉's 客船启程? unconfirmed) (`boat ladder`, H 1.77).
- `boatman_at_windlass_23465`: `look` [boatman]. Dark hair or cap, standing on the after cabin's roof deck beside the windlass, behind its rail, looking east at the boats upstream (`boat after roof`, H 3.39).
- `crewman_crouching_24125`: `crouch` [boatman]. Low: a second light rounded shape west of the mast on the cargo boat's deck, a crewman crouching beside the first (`boat deck`, H 1.77).
- `sack_porter_24312`: `back_load` until `sack_carry`, props `back_sack`, `stick`. Short jacket, apron and trousers, bent forward under a big sack across his shoulders and back, walking west along the bank below the cart; his right hand holds a long stick slanting up across the sack to steady it.
- `sack_porter_24452`: `back_load` until `sack_carry`, props `back_sack`, `stick`. Dressed like the first porter, bent under a big sack and walking west along the bank, a short stick held behind him in his right hand.
- `sack_porter_bank_edge_24467`: `bend_goods` until `sack_carry`, props `back_sack`. Low: bent forward under a big sack on his back at the water's edge behind the cargo boat's deckhouse, face down toward the boat as if lowering the sack onto it (`bank slope`, H -0.35).
- `figure_roof_coils_24508`: `sit_floor` [boatman]. A second head beside the seated boatman among the coils (raised to med at the frame step: a face shows under its dark top) (`boat roof`, H 1.7).
- `sack_porter_24537`: `back_load` until `sack_carry`, props `back_sack`, `stick`. Short jacket and trousers, bent under a big sack whose tied neck hangs at his west side, a stick trailing in his right hand; seen from behind walking north-west up from the boats to the cart.
- `windlass_man_aft_24660`: `push_flank` [boatman]. Low: bent at the spoked wheel or windlass on its post east of the deckhouse, his head among its spokes (`boat deck`, H 1.77).
- `boatman_poling_24730`: `push` until `pole_boat`, props `long_pole` [boatman]. White jacket and cap, bent double at the cargo boat's south gunwale, head down west, both hands on a long pole thrust down past 逆水行舟: pushing the boats apart, or poling (`boat deck`, H 1.77).
- `man_leaning_casks_25650`: `lean_over` [boatman]. Light jacket and cap, standing on the moored boat's deck on the bank side of its mat cabin, leaning forward with his arms on the casks and bundles stacked there (`boat deck`, H 2).
- `crewman_head_cabin_east_25810`: `look` [boatman]. Low: a small capped head at the mat cabin roof's east end beside a ribbed basket (other reading: the top of another domed basket) (`boat deck`, H 2).
- `basket_porter_27666`: `carry_pole`, props `pole_baskets`. Short belted jacket, trousers, small cap, a carrying pole with a deep round basket hanging from each end on cords, walking toward us out of the yard between the pole frame and the upper sheds.
- `pole_bundle_carrier_27767`: `carry_pole`, props `pole_bundle`. Light short jacket, walking west behind the lower shed with a carrying pole on his shoulder and a bag or bundle hanging from its east end behind him; only head and shoulders over the shed's roof.
- `sack_porter_back_28271`: `push_flank`. Bare-headed, dark hair, seen from behind stooping with legs apart, his right arm reaching east to steady or take the big sack on the next porter's back; short jacket, apron or kilt over trousers.
- `sack_porter_28343`: `back_load` until `sack_carry`, props `back_sack`. Bent under a huge long sack on his back (its tied mouth at the top), striding with legs apart, seen from behind so the sack hides his head; a sash or kilt over trousers. Carrying it up from the boats north-west to the pile.
- `bank_porter_28355`: `back_load` until `sack_carry`, props `back_sack`. Climbing the bank from grain boat 2 bent forward under a big roped sack, his dark head bowed at its upper end; trousers below. Carrying grain ashore to the pile (`bank slope`, H -0.35).
- `boatman_coils_28543`: `idle` [boatman]. Low: a tall dark upright with a flat top among the coiled cables on grain boat 2's after deck, a man in a dark cap (other reading: one of a pair of bitts) (`boat deck`, H 0.01).

### carter (13, 8 on boats)

- `boatman_cap_20938`: `idle` [boatman]. Dark cap, standing behind the low railing at the cabin's east end facing us, beside the big water jar on the foredeck (`boat deck`, H -0.02).
- `steersman_stern_21678`: `steer` [boatman]. Dark cap, standing on the high stern behind the rudder house's roof, facing west along the boat: the steersman (`boat stern deck`, H 1.01).
- `sweepman_upright_22168`: `push` until `work_sweep` [boatman]. Tall, standing upright in the middle of the crew in a long light jacket, hands on the loom, looking at us (155 px: the boatman model, above) (`boat deck`, H 0.73).
- `tracker_rear_22172`: `push` until `tow_walk`. 纤夫, the last of the five: short jacket belted at the waist, trousers, round cloth cap, leaning west mid-stride with both hands gripping the rope at his waist; behind him it runs on down the bank to the water.
- `crouching_figure_open_boat_22175`: `crouch` [boatman]. Low: a crouching person in a dark garment with a light rounded hat or head-cloth, bent over something in the open boat's east end (other reading: a basket under a dark cloth) (`boat deck`, H -0.43).
- `shop_man_head_cloth_23990`: `sit`. Light face and a pale head-cloth, seated across the small table from the black-capped man, facing him; only his head and shoulders show.
- `figure_deckhouse_east_24590`: `idle` [boatman]. Low: a face-like shape under the deckhouse's east eave (other reading: a hanging object) (`boat deck`, H 1.77).
- `figure_in_windlass_24713`: `push` [boatman]. Low: a face-like shape inside the aft windlass's spokes, a second man turning it from behind (other reading: its frame) (`boat deck`, H 1.77).
- `bank_man_with_stick_25370`: `listen`, props `stick` [boatman?]. Belted knee-length robe over trousers, hair in a knot, seen from behind turned north-west to the man in the light robe, a stick or short pole under his right arm pointing east; a boatman or porter from the moored boats by his dress.
- `behind_ridge_26369`: `look`. A second dark-capped head over the big hall's ridge, below the far-street table, facing south.
- `man_stern_hood_26750`: `sit` [boatman]. A head and one arm looking out of the arched mat hood over the mat-cabin boat's after deck, seated or leaning on its floor (other reading: coiled rope or gear) (`boat stern deck`, H 3.17).
- `steersman_27890`: `steer` [boatman]. Low: a dark round head with a cap over the tiller bar under grain boat 1's stern gallery arch, a man at the rudder head (other reading: the rudder stock's round head, then no figure) (`boat stern deck`, H 1.96).
- `overseer_28092`: `arms_folded`. Bearded, a cap, a knee-length jacket with an apron or tucked-up skirt over trousers, standing feet apart on the bank north of the owner, hands folded together at his chest, face to us and eyes turned east to the men exchanging tallies: a steward or overseer.

### robed_man (12, 2 on boats)

- `figure_by_top_willow_20590`: `look`. Low: a small standing person in a light robe half hidden against the top willow's trunk, head turned west (other reading: pale bark, then no figure).
- `man_in_river_20970`: `chin`. Low: dark head-cloth, light robe or jacket, painted only from the waist up in the open water among the willow whips, facing east, his right hand raised to his face with a small dark round thing (a cup or bowl). Nothing is painted under him: built standing waist-deep as painted, never on an invented boat (both readings in the map) (`water`, H -0.7).
- `bank_man_seated_21140`: `sit_floor`, props `raised_cup`. Long light robe, dark hair, sitting on the ground at the water's edge seen from behind, legs to the east, holding a small round thing (a cup, a jar or a ring on a short stick) up above his head toward the covered boat; a long pole or board with cloth folds under it crosses in front of him. 余辉's 船侧祭神 may be this group (unconfirmed).
- `eatery_man_23642`: `drink`. Stout, light long robe, dark topknot or cap, seated on the bench's east end beside the table under the eatery's shelter, facing us with his arms in front (perhaps holding a bowl); a customer, or the keeper resting.
- `bowman_under_hood_23660`: `look` [boatman]. Long light robe, standing on 逆水行舟's low foredeck under the dark arched mat hood, head bent, looking down past the bow; the two crossed boat-hooks lie over the stem before him (`boat bow deck`, H -0.28).
- `eatery_man_standing_23918`: `idle`. Long light robe, standing at the eatery shelter's east post among the empty tables, half turned from us, facing west into the eatery: its keeper or a waiter.
- `robed_man_foredeck_23930`: `point`, props `fan_round`. Long pale robe, hair tied up, on 逆水行舟's foredeck among coiled ropes and baskets, reaching west with a short stick that holds a small round thing (a fan, a scoop or a little basket); a passenger or the boat's master (`boat deck`, H 0.21).
- `doorway_man_topknot_24088`: `sit`. Light robe, bareheaded with a topknot, seated in the next shop's doorway facing us with one arm forward; a shopkeeper or a waiting customer.
- `man_in_shop_door_24415`: `idle`. Low: light robe, standing in the shop's open front behind the cart, facing us; only the head and upper body show over the load.
- `walker_26697`: `idle`. Low: a slim A-shaped outline in a long robe on the far street east of the pollarded willow; its facing can't be read.
- `pennant_pole_holder_27810`: `stand_pole` until `raise_pole`. Long robe belted at the waist, his back to us, standing at the lower shed's east end holding up in both hands the lower end of the long pole that leans to the pennant frame's apex (`S2.prop.pennant_frame_27930`), raising or steadying it. The pole is the frame's, not a carried prop.
- `man_leaning_over_donkey_29000`: `sit_listen` until `lean_over_seated`. Bearded, light long robe, dark head-cloth, seated on the low bench (`S2.prop.bench_29030`) behind the dark donkey, bending far forward west over its back with both hands at its neck, face turned to us (other reading: riding it, rejected by t12 on the strokes).

### scholar (12, 1 on a boat)

- `bank_tall_man_21205`: `bow`. The biggest figure of S2 (196 px, at the bottom edge): long robe and dark cap, head bent down-west toward the seated man, hands together at his chest holding something small.
- `man_north_bank_21530`: `talk`. Light long robe, dark cap, on the narrow bank strip between the shops and the moored boat, seen three-quarters from behind, turned to the smaller figure as if talking.
- `terrace_diner_w_23083`: `sit_talk`. Light robe, dark cap or hair knot, seated at the terrace's west table, turned east to the man across it with his arms held forward; upper body over the balustrade (`terrace floor`, H 0).
- `terrace_diner_back_23116`: `drink`. Light robe, dark hair or cap, seated on the west table's near side with his back to us, facing the other diner; a light shape over his head is a raised cup or a hat (`terrace floor`, H 0).
- `boatman_side_deck_23195`: `look`. The crews' one full figure at 145 px: a long light robe and small cap, standing on 豪华客船's side walkway with one hand at the lattice, face turned to us and west; a boatman or passenger (`boat deck`, H 0.21).
- `terrace_diner_leaning_23216`: `lean_over`. Light robe, dark hair or cap, seen from behind leaning forward east over the balustrade or a table with one long sleeve stretched east (other reading: reclining on his side) (`terrace floor`, H 0).
- `carter_24218`: `bridle`. Low: light robe and dark cap, leaning forward on the far side of the cart's lead mule with his arms reaching down toward its neck: the carter driving or holding the team.
- `cart_loader_24345`: `lean_over`. Tall, long light robe and dark cap, standing on the front of the cart's bed facing east and leaning over the load with both hands on the tilted mat-covered bundle (`cart bed`, H 0.91).
- `man_at_horse_head_24506`: `bridle`. Low: long light robe and dark cap, standing just behind the cart's rear with the saddled horse's lowered head at his chest, holding its bridle.
- `bank_man_light_robe_25338`: `talk`. Long light robe open at the chest, small cap, on the bank in front of the open shop facing us and his companion, one arm bent toward him as he talks; a merchant or the shop's keeper.
- `shed_diner_seated_28772`: `sit_listen`. Light loose robe, a small dark topknot or cap, seated on the low bench (`S2.prop.shed_bench_28740`) hunched forward east with both forearms on the table, facing the man with the donkey.
- `donkey_owner_seated_28850`: `sit`. Stout, round-faced and smiling, light long robe and dark cap, seated on the stool at the shed's east end facing us, body turned east, his hands at chest height holding the dark donkey's lead rope (a line from his hands to its head; other reading: he stands); his robe fans over his knees (pin 10 城乡交界处).

### townsman (10, 3 on boats)

- `man_seated_canopy_21120`: `sit`. Dark wide-sleeved robe, hair in a knot, seated on the deck under the mat canopy beside its post, hunched forward and turned west to the small figure; a passenger (`boat deck`, H -0.14).
- `passenger_in_cabin_bay_23340`: `look`. A passenger in a long robe standing inside the open bay between the lattice cabin and the after cabin, half in shadow, facing out south (`boat deck`, H 0.21).
- `man_with_sticks_bank_24390`: `look`, props `stick_bundle`. Low: dark cap, at the bank's edge, seen only to the shoulders over the cargo boat's deckhouse roof, looking down at the boat; a small bundle of upright sticks (poles, or incense) stands beside him (`bank slope`, H -0.35).
- `man_leaning_deckhouse_24447`: `kneel_sleep` [boatman]. Black cap, lying forward on his chest over a bundle or a low table in the deckhouse, head west to the seated man, talking or dozing (pin 16's second fellow) (`boat deck`, H 1.77).
- `man_behind_cart_rear_24463`: `look`. Low: dark flat cap, standing just behind the cart's rear; only the capped head and shoulders show over the load. A helper.
- `stall_keeper_24650`: `browse`. Low: dark clothes, at the west end of the stall table under the scaffold house's sweeping west eave: the keeper or a customer.
- `far_street_man_25688`: `browse`. Long robe and cap, standing at the stall table under the cloth awning on the far street, facing it: keeper or customer.
- `stall_second_26194`: `talk`. Low: a dark upright at the stall table's east end against the shed's post, a second person in a dark robe facing the keeper.
- `bowing_man_28270`: `hand_over`. Long dark robe belted at the waist and a soft cap, leaning forward west with his head thrust out, his right arm stretched to clasp the young man's hands: a merchant or the owner's agent handing something over.
- `shed_customer_back_28690`: `sit`. A customer seated on a bench at a table against the back of 望楼饭铺's east bay, small and dark through the front posts, facing south.

### camel_driver (9, 1 on a boat)

- `figure_under_eave_20625`: `look`. Low: a pale head in profile facing east between the dark tree and the south-bank hall's west eave, at the silk's bottom edge (dress unreadable; other reading: the gap between trunk and eave).
- `shop_seated_21683`: `sit`. Low: a faint figure seated behind the open shop's counter at the top of the silk (other reading: goods or furniture only).
- `shop_standing_21726`: `idle`. Low: a faint upright at the open shop's east bay: a person standing inside, or a post or tall jar.
- `terrace_figure_unclear_23148`: `sit`. Low: a fan of robe-like folds with a small dark mark beside the west table: a third diner hunched with his back to us (other reading: a cloth draped on a bench, then no figure) (`terrace floor`, H 0).
- `figure_stern_roof_24622`: `idle` [boatman]. Low: a small upright with a rounded top on the roof at the stern awning's forward end, beside a chest (other reading: a post) (`boat roof`, H 1.7).
- `stall_figure_behind_table_24705`: `sit`. Low: a dark head and shoulders behind the stall table under the eave, seated or standing (the keeper?).
- `head_over_roof_e_24867`: `look`. Low: a head in a cap with a pointed crown-like top and a lighter face, dark shoulders, over the scaffold house's roof west of the scaffold (other reading: the ridge's east ornament; the west one was retired as the 鸱尾).
- `shed_server_27693`: `idle`. Small, in a long robe and a brimmed cap, standing at the back of the lower shed among its rail posts behind the long table, facing west: a server or customer.
- `shed_customer_28535`: `sit`. Low: a small dark round head and a hunched shape behind the table in 望楼饭铺's middle bay, a customer facing south (other reading: a jar on the table or a post bracket).

### hat_traveller (7)

- `big_hat_man_south_bank_22045`: `crouch`. A big figure (142 px) in a broad DARK round hat with a hanging tie and a light jacket, seated or squatting at the south bank's edge at a small boat's bow, leaning forward west with both arms reaching down to a rope, a plank or the stem. The hat traveller's hat is light straw: the dark-hat variant S4b asked for.
- `tracker_broad_hat_22057`: `push` until `tow_walk`. 纤夫 in a broad round hat, hunched forward west with a rounded back (a bundle on his back, or only the bent back), the rope at his waist, mid-stride.
- `hat_walker_24004`: `walk`, props `staff`. Short jacket and trousers under a broad conical bamboo hat (斗笠), walking east along the shop fronts, a long staff trailing to the ground from his left hand, his right hand raised to the brim; a traveller or a boatman ashore.
- `basket_porter_24804`: `carry_pole`, props `pole_shallow_baskets`. Round brimmed hat, short jacket and trousers, walking west with a carrying pole: a wide flat basket hangs low on ropes at the west end and a second flat basket higher at the east end.
- `barrow_pusher_25532`: `push`. Low: a broad round hat or hood, seen from behind bent forward over the crate barrow's west end, pushing it east along the far street.
- `man_standing_26362`: `idle`. Light clothes, at the west end of the far-street table beside the big wheel, facing east; a horizontal stroke at his head is a wide hat brim (other reading: a pole held across, then porter `stand_pole`).
- `pole_porter_27193`: `carry_pole`, props `pole_bundles` (scaled 0.6). Short jacket and a broad-brimmed hat, a long pole across his shoulders sticking out well to both sides with small loads or ropes hanging from both ends, crossing the yard west between 王家纸马铺's front and the sheds; his shins hidden by a shed's ridge.

### inspector (6, 2 on boats)

- `boatman_seated_open_boat_22060`: `sit` [boatman]. Dark coat and small dark cap, seen from behind, sitting on a thwart in the middle of the open boat facing north across the river (`boat deck`, H -0.43).
- `sweepman_capped_22208`: `push` until `work_sweep` [boatman]. Dark cap and dark coat, bending forward over the loom, face turned west laughing or shouting (`boat deck`, H 0.73).
- `man_by_pole_stack_24732`: `look`. Dark knee-length robe, hair in a topknot, standing on the street beside the stacked poles near the silk's top, turned to the porter with baskets coming past.
- `far_street_figure_25750`: `hand_over`. Dark robe, in front of the tiled shed's posts on the far street, something (a basket?) held out at its east side; upper body only, over the hall's ridge.
- `staff_man_28266`: `talk`, props `staff`. A narrow head under a small dark cap or pointed hat directly over the leaning man's back, a thin staff rising past it: a man standing behind him with an upright staff, his body hidden (a tally-keeper or overseer).
- `shed_keeper_28467`: `point`, props `stick`. Long robe and dark cap, standing just inside 望楼饭铺's front posts facing west to the sack crowd, holding a long thin stick low and level, pointing west; a bundle lies at his east side (`S2.prop.bundle_28520`): the shed keeper or an overseer.

### child (5, 2 on boats)

- `child_or_vase_21076`: `look`. Low: `scale` about 0.6 (57 px beside a seated man of 73): a small narrow upright with a flat brimmed top beside the seated man under the canopy, a child in a flat hat facing him (other reading: a tall vase on a stand, then a prop on the deck) (`boat deck`, H -0.14).
- `man_north_bank_small_21553`: `listen`. Low: `scale` about 0.65 (46 px beside 73): a smaller figure in a light robe facing us with the hands together in front (other reading: an adult standing further back, then robed_man `listen`).
- `second_passenger_window_24050`: `look`. Low: `scale` about 0.85 (53 px beside 63): a second, smaller person at the same window, a light round head without dark hair, turned to us (a light head-cloth, or a child; other reading: the first man's raised hand) (`boat deck`, H 0.21).
- `hall_small_figure_25628`: `sit`. Low: `scale` about 0.55 (26 px beside his 48): a smaller seated figure beside the man in the window, merged with his dark robe: a child or a servant (`upper floor`, H 1.3).
- `far_street_child_25728`: `look`. Low: `scale` about 0.6 (42 px beside 73): a small dark head just west of the dark-robed figure (a child, or a woman).

### sightseer (4, 1 on a boat)

- `pavilion_diner_23388`: `sit_listen`. Light robe, dark cap, seated alone in the terrace's gabled east pavilion facing west, his hands on a small table or the sill, seen from the chest up behind its lattice railing (`terrace floor`, H 0).
- `passenger_window_24025`: `lean_chin`. Dark hair, a passenger seated inside 逆水行舟's cabin with his forearms on the sill of a big open lattice window, looking out south (`boat deck`, H 0.21).
- `behind_ridge_26258`: `look`. Dark cap, head and shoulders over the big riverside hall's ridge, on the far street's near edge, facing south.
- `man_at_railing_27650`: `lean_chin`. Small brimmed cap, head and shoulders behind the slanted balustered railing that runs down from the pole frame, leaning his arms on the rail and looking west.

### woman (3, 1 on a boat)

- `bank_figure_raised_hands_21085`: `tie_kerchief`. Low: only a head-sized loop above the seated man's head: perhaps a woman kneeling behind him lifting both hands to her hair (other reading: the thing he holds up).
- `passenger_leaning_in_bay_23385`: `lean_chin`. Low: dark piled hair (perhaps a woman) leaning forward on the open bay's sill, face down toward the water; S2's only possible woman on a boat (other reading: a man, then scholar `lean_chin`) (`boat deck`, H 0.21).
- `rider_26832`: `ride_side`, props `veiled_hat`. Low: a rider on a donkey facing east toward 王家纸马铺's signboard, the head covered by a tall rounded hood or veiled hat (帷帽) rising well above it, the legs hanging at the animal's side: a woman riding, or a traveller in a hooded cape (then hat_traveller `ride`). Other readings: a man walking beside a pale animal, or a man with a tall back load (`animal`: on `S2.ani.donkey_26872`).

### storyteller (2)

- `shopkeeper_25360`: `idle`. Low: head and shoulders with a small cap and perhaps a beard, standing behind the open shop's stepped goods rack, facing us.
- `grain_owner_28045`: `sit` until `sit_point`. The grain owner (余辉's 私粮进京, pin 9 仓前成市): a heavy bearded man in a dark robe and cloth cap, seated on his sacks (`S2.prop.sack_pile_27996`), leaning forward with his right arm stretched out east, index finger pointing at the porters and the tally men, mouth open calling orders, his left arm on his knee.

### fortune_teller (2)

- `hall_seated_man_25600`: `sit`. Dark robe, seated hunched in 沿河雅座's open west window, turned east toward a smaller figure; a low table at his west side. A guest (pin 14) (`upper floor`, H 1.3).
- `man_dark_robe_26424`: `talk`. Long dark robe and black cap, standing at the far-street table's east end facing west: a shopkeeper or customer.

### child_robed (1)

- `bank_small_figure_21255`: `look`. `scale` about 0.75 (145 px against the tall man's 196): a youth or child with dark hair in a plain robe between the tall man and the great willow's trunk, facing him.

### official (1)

- `shop_man_dark_cap_23963`: `sit_talk`. Dark robe and small black cap, seated on a bench inside the open shop front, leaning east toward the man across the small table; a customer, talking.

### butcher (1)

- `handshake_youth_28163`: `hand_over`. Young, hair in a bun at the back, a short jacket belted over a knee-length apron and trousers, facing east with both arms stretched out to clasp the hands of the leaning man in the dark robe, greeting him or taking a tally or coins: the owner's servant or porter.
## Actions the existing clips can't show (ranked; 10 credits a take, then free for anyone)

The names follow S3's list (`gen/expand/rainbow_bridge_needs.md`), so one take serves S4b, S3 and S2. Every figure
plays the stand-in named in its line until its take lands.

1. **`sack_carry` (new, S2's):** walking slowly bent far forward under a big grain sack carried across the shoulders
   and the back. One hand is raised to hold the sack's tied neck over the shoulder; the other trails a short stick or
   steadies the load. The steps are short and heavy.
   - It is the action of 私粮进京, one of 余辉's named vignettes. Seven S2 figures do it: `sack_porter_24312`,
     `_24452`, `_24537`, `sack_porter_bank_edge_24467`, `sack_porter_28343`, `bank_porter_28355` (up the bank) and
     `sack_porter_bent_28432`.
   - S3's three sack porters would take it too: `sack_porter_18915`, `white_sack_porter_18882` and
     `porter_carrying_17922`.
   - Stand-in: `back_load` with `back_sack`. The monk's back-load walk is upright with both hands at the straps, and
     the painted porters are bent nearly level.
2. **`work_sweep` (S3's #2):** S2's six men at the great sweep of `S2.veh.boat_sweep_22000`.
   - Two of them lean far back with their faces up, hauling the loom: the pull phase. Three bend over it pushing, and
     one leans his weight down on it.
   - With S3's six, that makes twelve figures. Stand-in: `push`.
3. **`tow_walk` (S3's #5):** S2's five trackers, about 2000 px west of their boat. The boats page walks them with
   逆水行舟 (`boats.boat_towed_mast_23632.haul.<id>.walk`). Stand-in: `push`.
4. **`pole_boat` (S3's #1):** `boatman_poling_24730`, bent double at the cargo boat's gunwale, both hands driving a
   long pole down past 逆水行舟. Stand-in: `push` with `long_pole`.
5. **`fend_pole` (S3's optional #7; S2 makes it worth a take):** `boatman_pole_20495` holds a pole down and out at
   S3's big boat, and `boatman_fending_off_23688` pushes a pole level against 豪华客船's stern. With S3's four, that is
   six figures. Stand-ins: `stand_pole` and `push_flank`, with `long_pole`.
6. **`haul_line` (S3's #3):** `boatman_hauling_mast_24140` hauls the line at 逆水行舟's mast, but he kneels on the roof:
   a kneeling variant, or the standing take played low. Stand-in: `squat_sleeves` (both hands together in front).
7. *(optional)* **`sit_point`:** seated, leaning forward, the right arm stretched out level with the index finger
   pointing, the mouth open calling orders, the left forearm on the knee. This is the grain owner on his sacks
   (`grain_owner_28045`), the centre of 私粮进京. Stand-in: `sit`.
8. *(optional)* **`pour_bucket`:** bent over a waist-high gunwale, tipping a wooden bucket out with both hands so the
   water pours down the side. This is `boatman_pouring_bucket_22665`, perhaps 余辉's 船侧祭神. Stand-in: `bucket_lift`
   with `bucket`.
9. *(optional)* **`climb_ladder`:** climbing a steep ladder, the hands reaching over the top onto a roof.
   `boatman_on_ladder_23275` (perhaps 客船启程) does it, and the boats carry four more ladders that nobody is on.
   Stand-in: `reach`, placed on the ladder.
10. *(optional)* **`serve_bowl`:** seated with the knees up beside a big tub, holding a bowl out at arm's length
    (`tub_vendor_27765`). Stand-in: `knees_up` with `bowl`.
11. *(optional)* **`lie_prop`:** lying back on bales propped on one elbow, looking out (`passenger_reclining_on_cargo_22848`).
    Stand-in: `sleep_side`.
12. *(optional)* **`raise_pole`:** standing with both hands holding up the lower end of a long pole that leans away to
    a high apex (`pennant_pole_holder_27810`, raising the pennant frame). Stand-in: `stand_pole`.
13. *(optional)* **`lean_over_seated`:** seated on a low bench, bending far forward over an animal's back with both
    hands at its neck (`man_leaning_over_donkey_29000`). Stand-in: `sit_listen`.

The handshake of the grain scene (`handshake_youth_28163` and `bowing_man_28270`) plays `hand_over` on both: two men
stepping forward with both hands out reads as the clasp. No take is needed.

**Painted walkers** (short walks along the painted direction and back, `people.json`):
- **west:** `sack_porter_24312` and `_24452` along the bank; `basket_porter_24804`; `pole_porter_27193`;
  `pole_bundle_carrier_27767`;
- **north-west:** `sack_porter_24537` (up from the boats to the cart), `sack_porter_28343` and `sack_porter_bent_28432`
  (to the sack pile);
- **north:** `bank_porter_28355`, up the bank from grain boat 2 to the pile;
- **east:** `hat_walker_24004` along the shop fronts;
- **south:** `basket_porter_27666`, toward us out of the yard;
- **with their boat:** the five trackers.

The barrow's pusher and puller walk only if the barrow is made to move. The rider stands facing the paper shop's
sign. Everyone else acts in place.

## Animals: 9 (map IDs; built at real size)

The map's hoof-to-hoof lengths are painted and foreshortened, so they give orientation only.

- **The mule cart's team** (`S2.grp.mule_cart_24305`). The setup, t6 and the restyle read an ox; t5 and the merge
  settled two mules (no horns, slim bodies, long heads).
  - `S2.ani.cart_mule_lead_24192`: a dark-brown mule in side view, slim, long head held low, long tail, facing west
    (180). Long traces run from its hindquarters to the cart's front; the carter leans over its far side. Tack: the
    mule's `collar` with trace points. Clip `graze` (head low) or `idle`.
  - `S2.ani.cart_mule_near_24215`: a second, darker mule on the near side, turned toward us (facing 250) and
    foreshortened, its head lowered between its forelegs, harnessed with a dark band. Tack `collar`. Clip `graze`.
  - The registry mule has `collar` and `pack_saddle`. **Trace points on the collar** (`harness.trace_*`, as the ox's
    `girth` has) are the one tack change.
- `S2.ani.horse_24565`: a horse (or mule) standing behind the cart's rear, facing west (180), its head held low at the
  chest of the man holding it. A dark saddle-cloth or pack-saddle pad hangs at its withers; there is no rider. It may
  be tied to or led behind the cart.
  - Tack: a **plain dark cloth or pad without a seat**. S4b asked for the same girth-only or plain-cloth variant on the
    horse, which has only `saddle`.
  - Coat not painted (outline only): the registry horse as is. Clip `head_low`.
- `S2.ani.horse_feeding_26072`: a dark horse or mule at the round-topped cart's east end on the far street, facing
  east (0), head lowered to the ground or a trough. No tack can be read, and it is not in shafts (the second pass).
  - S4b asked for a **dark horse coat** (`body_from: horse` plus `tone`). Clip `graze`.
- `S2.ani.donkey_26098` (low): a donkey, with long ears, under the far-street stall shed, facing west (180) toward
  the feeding horse, partly behind the shed's post. No load or tack. The registry donkey; clip `idle`.
- `S2.ani.donkey_26872` (low): a pale-outlined donkey (or small horse) on the far street, facing east (0) toward
  王家纸马铺's sign, head raised, carrying the hooded rider. Saddle and bridle are not resolved. Tack `saddle_cloth`;
  the rider sits on it (`ride_side` or `ride`). Clip `idle`.
- `S2.ani.donkey_dark_28921` (med; pin 10 城乡交界处): a **dark** donkey (or small dark horse or mule) at 望楼饭铺's
  east end, facing west (180), head held high toward the round-faced man who holds its lead, one foreleg stepping
  forward. No saddle or load.
  - Its lead rope runs from `donkey_owner_seated_28850`'s hands to its head (a builder's line). The man in the light
    robe leans over its back from the bench behind it: nobody rides it.
  - S4b asked for a **dark donkey coat** (`tone`). Clip `idle`.
- **Two small dark birds** (low, kit bird, `idle`), perched in `S2.tree.willow_great_21345`'s whips over the water at
  H 10.47: `S2.ani.bird_in_willow_21135` and `S2.ani.bird_in_willow_21730`. The other reading is an ink knot where
  whips cross.

What the registry lacks for these, all free (tone, tack and `body_from`; no Meshy):
- trace points on the mule's collar;
- a plain dark cloth or pad on the horse (S4b's request too);
- a dark horse coat (S4b's);
- a dark donkey coat (S4b's).

## Vehicles: 3 on land (plus 17 boats below)

- `S2.veh.mule_cart_24305` (high): a **big two-wheeled cart being loaded** on the bank street, facing west.
  - **Bed and wheels:** a long open bed (u 24347–24480 on the scan) whose rails run on past its rear to u 24518.
    Two spoked wheels about chest height; the near rim is 73 px across.
  - **Load:** a big flat bundle under a woven lattice mat, tilted up at its west end, over a dark hatched heap of straw
    or sacks.
  - **Rear and team:** a prop stick stands under the rear. Two mules pull it on long traces from the bed's front.
  - **People:** a man stands on the bed's front handling the load (`cart bed`, H 0.91), and a saddled horse stands
    behind it.
  - **Size:** mapped 2.07 m between est ends, too short for the wheel.
  - **Kit:** no kit cart has this load. `kit_vehicles.cask_cart` (a flat bed with low side rails over two spoked
    wheels) without its casks is the nearest. Add the mat-covered tilted bundle over a straw heap (`barrel_cover`'s mat
    with `soft_sack`s under it), the rear prop stick, and traces in place of shafts. The front reads as short shafts or
    legs (est).
- `S2.veh.barrow_crates_25598` (low): a **small barrow or handcart** on the far street carrying two lattice crates. The
  west crate stands low; the east crate stands higher, further back along the bed. The shafts run up to the man at its
  east end, and no wheel shows.
  - **Kit:** `kit_vehicles.sack_cart`'s barrow (the 串车's) with two `kit_outer_road.slatted_box` crates in place of the
    sacks.
  - **Other reading:** a porter with two baskets on a shoulder pole. The second pass kept the barrow: the crates stand
    one behind the other along a receding bed, and the hooded man is behind both.
- `S2.veh.cart_round_top_26035` (low): a **round-topped thing on a low frame** on the far street. It is read as a cart
  parked under a round arched cover, or carrying a huge round load. Its bed (v 90–113) stands on legs at both ends, and
  no wheel can be read.
  - **Kit:** `kit_vehicles.barrel_cover` over a short bed on four legs, wheels hidden (a choice).
  - **Other reading:** a stall table under a big round parasol (then a prop, `kit_inner_city.umbrella`).
  - The horse at its east end is not in its shafts.

## Boats: 17 (for the boat factory, `blender/kit_boats.py`; real size by type, painted order and gaps)

Orientation follows the lead's rule (the rudder and the sweep mark the stern), and no swap was needed at the merge.
Fourteen boats lie bow west, upstream. The north-bank cargo boat reads bow east (med) and the small covered boat bow
east (low); the small boat's bow at the silk's bottom edge points north-east. The boats whose rudder is hidden carry both readings in their notes.

Mapped lengths are the frame's distance between the painted waterline ends; most ends are est, hidden by neighbours,
willow whips or the silk's edge. They are short against the crews: grain boat 1 is 8.6 m, 豪华客船 16.2 m and 逆水行舟
19.8 m (its mast 8.6 m). The kit's real sizes are the frame's recorded choice (`map/frames/S2.json`, checks).

**Gaps at kit sizes.** The kit's boats are 9.3 m (small) and 24.5–24.6 m (passenger and grain) overall. Four groups
of S2's boats lie end to end, or side by side closer than the kit's beams. There the pilot's "shorten to 0.6, then
move outward" rule (`map/BUILDING.md`) decides the spacing. In world X and the depth D of each boat's middle:
- **North bank, west:** the cargo boat (X 148.7–156.5, D 22.2), the mat-shelter boat (152.2–155.4, D 25.7) and the
  big cabin boat (155.5–162.0, D 24.9). The cargo boat and the big cabin boat overlap by 1 m of X at 2.6 m apart,
  where the kit's half-beams add up to 4.7 m.
- **The middle:** 豪华客船 (176.2–192.3) runs end to end into the cargo boat (191.9–210.5). 逆水行舟 (193.6–213.2,
  D 9.1) passes the cargo boat (D 14.6) 5.5 m apart, which leaves 0.6 m between the kit's beams.
- **The halls:** the moored boat (211.3–224.4) and the mat-cabin boat (222.9–235.8) lie end to end.
- **The grain wharf:** grain boat 1 ends at 256.2 and grain boat 2 starts at 259.7. The bottom boat lies 4.7 m south
  of grain boat 2.

**The boat factory's inventory** (`gen/boats/types.md` #14–#30) differs from the map in nine places and misses three boats. The map wins:
- **#14** (u 20330–21100, "passenger (short), about seven aboard") is `S2.veh.boat_mat_cargo_21055`: a long low cargo
  boat under mat roofs with six crew (the seventh head is S3's), bow east (med).
- **#15** ("a big cabin boat ≈ 20820–21800") is **two boats**: the small `boat_mat_shelter_20805` and the passenger-type
  `boat_big_cabin_21120`.
- **#16**, the sweep boat: its blade lies at 22780–22945, v 1057–1112 (the setup's "skiff"). Its bow is not painted.
- **#18**, the small awning boat: it runs on to a lashed stern frame and a rudder at 23060. Its man pours a bucket
  over the side under the roof's east end, not at the stern.
- **#19**, 豪华客船: its windlass stands on the **after** cabin's roof, not on a foredeck. The bow is west.
- **#20 and #21 are not one boat in two halves.** 逆水行舟 is the **southern** hull. Its mast is stepped in a
  tabernacle on its own cabin roof and drawn over the northern boat's planking, and it is **towed, not rowed**: no oar
  or sweep is in the water. The northern hull is a separate high-sided cargo boat moored along the bank with no mast
  (`boat_cargo_hooded_bow_23715`).
- **#22**, the "small canopied boat", is not a boat: it is the cargo boat's open midship deckhouse, whose two men are
  pin 16 聊天的伙计.
- **#23–27** (the north-bank row, 24300–26800) are **three** boats: the cargo boat's after half, the moored boat with
  the mat canopy, and the mat-cabin boat.
- **#30** (28150–29000) is a **smaller** planked boat at the bottom edge with a big rudder, rafted to grain boat 2 by a
  ladder. It is not laden.
- **Not in the inventory:** the open skiff under the south willow, the small covered boat off the south bank, and the
  small boat's bow at the silk's bottom edge.

West to east:

- `S2.veh.boat_mat_cargo_21055` (med; inventory #14): **a long low cargo boat moored along the north bank**, bow east
  (facing 356; other reading bow west, still S2's by the lead's note). Preset **`grain_awning_sweep`** without its
  sweep.
  - **Size:** mapped 7.75 m. Its west end is hidden behind the stern of S3's big boat, which lies against it. The near
    side shows 50–55 px of freeboard.
  - **Roofs and cargo:** a long dark arched mat roof over the west part, and a low mat cover over the cargo amidships,
    with two big round woven baskets or mat-wrapped bales and a coil of rope on deck. A lattice rail stands at
    u 20600–20680.
  - **East end:** a small cabin with a planked doorway and a sloping mat roof, and a big lidded water jar on the
    foredeck.
  - **Moored** by a double rope from the deck coil to the foot of `S2.tree.willow_top_20668`. No mast, sweep or oars.
  - **Crew:** 6. Three fend off S3's boat (a pole man and two leaning men), one stands on the roof stretching his arm
    to it (`boat roof`, H 1.05), and two are at the east cabin (deck H −0.02).
- `S2.veh.boat_mat_shelter_20805` (med; part of #15): **a low boat moored close in to the bank** north of the cargo
  boat, end to end with the big cabin boat's bow. Preset **`small_awning`**.
  - **Roofs:** a woven mat roof over its west half with a big rope coil on it; east of it a flat roof with a slatted
    eave and a higher mat roof, with jars or boxes under it.
  - **Hull:** only the west end's planking shows. Bow unknown: front put at the west end (low).
  - **Size:** mapped 3.26 m. No crew, mast or sweep.
  - **Other reading:** the fore cabins of the big cabin boat, making one long boat.
- `S2.veh.boat_skiff_21080` (med; **not in the inventory**): **an empty open skiff** lying diagonally under the great
  south willow's whips. It has a pointed west end, planked sides and thwarts with crossed sticks inside. Preset
  **`small_open`**. Mapped 4.49 m; its east end is hidden behind the willow's trunk. No rope is visible; it is probably
  tied to the willow.
- `S2.veh.boat_big_cabin_21120` (high; part of #15): **a big river boat moored along the north bank** before the shops,
  bow west-north-west (facing 168). Preset **`passenger`** with a short cabin under mat roofs and a stern house.
  - **Bow:** a curved stem head with a round windlass hub, and a long oar or pole slanting from the bow into the
    water.
  - **Amidships:** a flat mat awning on posts over a row of six coiled ropes along the far gunwale, a deck post
    (bitt), and a low cabin with a window where a man sits. Then a big round-arched cabin frame and a deckhouse with a
    sloping mat roof.
  - **Stern:** high, with a gabled rudder house and a big rudder.
  - **Hull and size:** planked, with nail rows. Mapped 6.78 m at the waterline. No mast or sail.
  - **Crew:** 3. The window man and a boatman on the far deck (deck H −0.12), and the steersman (`boat stern deck`,
    H 1.01).
- `S2.veh.boat_covered_21205` (med; **not in the inventory**): **a small covered boat off the south bank** under the
  great willow's whips, bow east (low). Preset **`small_awning`**, the canopy on four thin posts.
  - **Canopy and bow:** a mat canopy on four thin posts over most of its length, gabled at the east end, and a squared,
    raised bow board.
  - **Aboard:** a man sits under the canopy beside a small upright figure or tall vase; a round basket lies on deck at
    the west. Deck H −0.14.
  - **Size:** mapped 3.99 m. No mast, oars or sweep.
  - **Crew:** 2, both passengers. The bank group in front of it (`S2.grp.south_bank_people_21150`) reaches toward it
    and holds something up: perhaps 余辉's 船侧祭神 (unconfirmed).
- `S2.veh.boat_open_21968` (med; #17): **a small open boat** at the foot of the south bank's mound. Preset
  **`small_open`**.
  - **Hull:** thwarts and floor boards, and small knobs or bollards on the far gunwale.
  - **Moored:** its squared west end is tied by a twisted rope to the mound's face at about (21905, 1490).
  - **Size and crew:** mapped 4.43 m. Two crew: a seated man and a crouching shape (low); deck H −0.43.
- `S2.veh.boat_sweep_22000` (med; #16): **a boat under way west in midstream, worked by a great stern sweep (大橹)**.
  Preset **`grain_awning_sweep`** with the sweep working (`people.json` `boats.boat_sweep_22000.crew.<id>.work =
  "sweep"`).
  - **Hull:** lost under the great willow's whips west of u 22050; its bow is not painted. Mapped 2.89 m for the after
    part only, so the length is the builder's choice.
  - **Stern:** a planked after deck, and a stern frame of lashed crossbeams overhanging the stern east to about
    u 22420. The loom crosses it at a pivot. The stern's side carries a decorated oval panel with two eye-like marks.
  - **Sweep:** the shaft runs east-south-east into the water and ends in a broad flat blade with an upturned tip at
    about u 22945, about 700 px from the men's hands.
  - **Crew:** 6 at the loom (deck H 0.73). Pose `rowed`.
- `S2.veh.boat_small_bow_22158` (med; **not in the inventory**): **only the bow of a small boat**, coming in from below
  the silk's bottom edge beside the south bank: a pointed dark-hatched bow with a short post. Nobody is seen in it.
  Preset **`small_open`**. Mapped 1.77 m for the visible bow only, so the length is a choice. The big-hat man sits on
  the bank at its bow.
- `S2.veh.boat_mat_roof_22290` (med; #18): **a long boat moored along the low south spit**, bow west. Preset
  **`small_awning`** with cloths.
  - **Roof and bow:** a long arched mat roof on posts over its west two-thirds, with cloths or curtains hanging under
    its west end. A raked pole (a lowered mast or a stowed quant) leans west from the roof's west post with a cloth
    hanging from it.
  - **Stern:** an open after deck, an overhanging stern frame of lashed beams, and a rudder (stock at about u 22885,
    blade to 23050).
  - **On deck:** a flat woven thing (a straw sandal, a folded mat or a basket lid) and a small staved tub.
  - **Moored:** a rope runs from its side to the spit.
  - **Size and crew:** mapped 8.78 m. One crewman, the bucket pourer (deck H 0.53).
- `S2.veh.boat_passenger_22545` (med; #19; **豪华客船**, pin 17): **a very long passenger boat moored along the north
  bank** below the terrace, bow west, lying at a slant (facing 172). Preset **`passenger`** (the factory's model).
  - **Bow:** a curved post rising from the stem to a netted knob (a lantern cage or fender basket), a lashed beam
    projecting west, and an open fore canopy under a dark mat roof on four posts.
  - **Cabins:** a cabin with mat-curtained walls, then a long cabin with lattice windows, panelled sills and a door.
    Inside it a chair or bench back and a table with things on it show. Then an open bay with two passengers, and an
    after cabin with hanging mat blinds under a dark mat roof. On top of that is a deck with a **windlass** and a small
    arched mat shelter. A narrow side walkway runs outside the cabins.
  - **On the roof:** coiled ropes, a drum, round baskets, bales, a rolled mat and a big round basket.
  - **Ladder and mooring:** a ladder leans from the walkway to the roof. A mooring rope runs from
    `S2.prop.mooring_post_23126` (a post standing in the water) to the roof rail.
  - **Hidden:** the stern, behind 逆水行舟's bows; no rudder or sweep shows. No mast is up.
  - **Size:** mapped 16.21 m.
  - **Crew:** 6: 3 passengers and 3 boatmen. Walkway H 0.21, roof 2.03, after roof 3.39 (low), ladder 1.77. The ladder
    climber may be 余辉's 客船启程 (unconfirmed).
- `S2.veh.boat_towed_mast_23632` (high; #20–21; **逆水行舟**, pin 15): **a long, deep boat towed upstream west by five
  trackers**, mid-river south of the cargo boat, which it passes close alongside. Preset **`grain_mast_towed`** with a
  passenger-type cabin (`_cabin(pattern='passenger', roof='mat')`).
  - **Mast and rope:** a single mast stepped amidships in a braced tabernacle on the cabin roof, top at (24183, 302), with
    a fan of about fifteen stays to both ends. The **tow rope** is made fast to the mast at (24188, 375). It runs about
    2350 px west over the cargo boat's bow, the bank and the water to the trackers: `pts.rope` (26 points), with
    `rope_end` (21832, 197) in the lead tracker's hands. A short bar is lashed across it at (23945, 435–472).
  - **Cabin:** a long plank-walled cabin with lattice windows and a door the whole length, under a low mat roof.
  - **Bow:** a dark arched mat hood over a low foredeck, a carved stem post, and two crossed boat-hooks over the stem.
  - **Stern:** it rises over a big rudder. A mat awning shelters a big coil of bamboo rope and two light boards
    standing upright. A long dark mat-hatched blade projects east at deck level to (25285, 1010): a sweep shipped aft,
    or the awning's eave (low).
  - **Size:** mapped 19.77 m, beam 4.03 m.
  - **Crew:** 11 (one low): the bowman (`boat bow deck`, H −0.28), the fender with a pole, the robed passenger or
    master, two at the cabin window and the man at the after door (deck H 0.21), and five on the roof among the coils
    (H 1.7). One of the roof men kneels and hauls a line at the mast.
  - **Not "rowed by eight men"** (sections.md).
- `S2.veh.boat_cargo_hooded_bow_23715` (med; #20 and part of #23–27): **a very long high-sided cargo boat moored along
  the north bank**, bow west, riding high (unladen). Preset **`grain_awning_sweep`** riding high, without its sweep (the
  row type with the flat transom bow).
  - **Bow:** a curved arched beam over a dark mat hood, a deck post, and a spoked windlass (unmanned).
  - **Foredeck:** a flat board platform on legs, big round coils or baskets, and **a short ladder from the deck up to
    the bank** (top at (24045, 505)).
  - **Amidships:** an open-sided deckhouse under a flat mat roof, with a second arched beam and a dark mat hood at its
    east end (the inventory's "small canopied boat"). East of it a spoked wheel or windlass stands on a post.
  - **Aft:** a huge rounded mat cover over the cargo, topped with a woven round basket. The stern is high and curved,
    with a carved post and the rudder stock.
  - **Fenders:** a coil or round fender hangs on its south side, and a long rope-wrapped fender hangs at the bow.
  - **Size:** mapped 18.68 m; its beam (7.47 m between est points) is foreshortened. No mast.
  - **Crew:** 9 (deck H 1.77, from 190 px of side), including the two in the deckhouse (pin 16 聊天的伙计). It lies
    against the bank with no rope seen.
- `S2.veh.boat_moored_mat_canopy_25145` (high; part of #23–27): **a big plank-built boat moored along the bank before
  沿河雅座**, bow west. Preset **`grain_awning_sweep`** riding high, without its sweep.
  - **Bow:** a pair of scroll-ended bitt beams with coiled ropes. Its mooring rope runs up the bank to
    `S2.prop.mooring_post_25207` (a rope line with `rope_end`).
  - **Foredeck:** a dark plank hatch cover over the fore hold, and a broad dark arched mat canopy on posts sheltering a
    lidded jar, a bowl and gear.
  - **Amidships:** a long rounded mat cabin roof with casks and bundles on and behind it, a domed ribbed basket and a box
    at its east end, a raised hatch board on legs, and curved bamboo hoops (awning frames).
  - **Stern:** high, with a carved post and a big rudder.
  - **Size:** mapped 13.18 m. Deck H 2.0, from 208 px of side.
  - **Crew:** 3 (two low).
- `S2.veh.boat_mat_cabin_25980` (med; part of #23–27): **a big timber boat moored west of the great willow**, bow west
  and hidden behind the moored boat's stern, riding high. Preset **`passenger`** with board walls (S4b's `boards`
  variant) and mat hoods aft.
  - **Cabins:** a gable-roofed fore cabin and a long flat-roofed cabin with plank walls and doors. A ladder leans from
    the deck to the roof. A row of round coiled bundles lies along a woven-mat cover, and a long pole lies along the
    roof.
  - **Aft:** a barrel-vaulted mat hood with three big round bundles, then an open arched mat hood over the after deck,
    with a man in its mouth.
  - **Stern:** a raised gallery with a lattice rail and an overhanging stern. A big rudder hangs on a stock with a
    drum-shaped head, its lattice blade reaching down and aft.
  - **Deck:** a post with a round head stands on it.
  - **Size:** mapped 12.87 m. Deck H 1.31, roof 2.83, stern deck 3.17 (298 px over its waterline: the highest poop in
    S2). No mooring line or sweep.
  - **Crew:** 2.
- `S2.veh.boat_grain_27285` (med; #28; **万石船**, pin 8): **a big, broad, deep-laden grain boat** moored with its
  rounded bow north-west against the bank and its stern toward us (facing 160). Preset **`grain_laden`** (the factory's
  model).
  - **Bow:** two overlapping woven-mat roofs over a small deckhouse with windows. A long spar lies along the deck (the
    lowered mast or a windlass beam).
  - **Hold:** planked hatch covers, and the cargo under nets of crossing ropes.
  - **Stern:** a high transom with an arched gallery roof, a tiller bar and a big rudder.
  - **Gangplank:** cleated, about 245 px long with 7–8 cleats, from the north gunwale near the stern up the bank to
    (28023, 1050). Nobody is on it: it is the kit's walkable `line_gangplank`.
  - **Moored** by two lines to `S2.prop.coiled_rope_27873` and `S2.prop.mooring_stake_27902` on the bank top, and
    stern to bow with grain boat 2.
  - **Size:** mapped 8.6 m. Freeboard 53 px amidships.
  - **Crew:** 1 (low): the steersman, or the rudder head (`boat stern deck`, H 1.96).
- `S2.veh.boat_grain_28095` (low; #29; **万石船**): **a second laden grain boat** east of the first, half under the
  willows, bow west (by the raked stem; other reading stern west). Preset **`grain_laden`**.
  - **Bow:** a mat hood with a coiled mat on top, a cross beam and posts, and the dark raked stem.
  - **Hull:** it and its mat-covered cargo run east under the willow whips.
  - **After deck:** a pile of heavy coiled cables, a long bundle, two dark uprights (bitts, or a man: low) and a small
    windlass frame. The stern is hidden behind S1's massive willow.
  - **Ladder and mooring:** a ladder runs down from its after deck to the bottom boat, and its mooring line runs to
    `S2.prop.mooring_post_rope_28272`.
  - **Size:** mapped 7.88 m (rear est). Crew 1 (low; deck H 0.01).
- `S2.veh.boat_bottom_28395` (med; #30): **a smaller planked boat at the silk's bottom edge**, south of grain boat 2
  and rafted to it by the ladder. Bow west, under the willow whips.
  - **Hull and deck:** strakes, round bitts or cleats along the gunwale, and a small upright structure on deck.
  - **Stern:** an upswept stern over a planked transom gallery, and a big rudder: a stock with a drum-shaped head and
    ropes, and a battened blade to (28955, 1768), 95 px from the S1 seam.
  - **Size:** mapped 4.95 m, with 125 px of freeboard. No cargo or crew; the briefed "man at its east end" is the
    rudder head.
  - **Kit:** **`small_open`** with a transom gallery and a big rudder, or a shortened grain hull (a choice).

**The water:** four reaches of the 汴河 at H −0.7 (copied from S4b; a bound, conf low). S2's own bounds agree and are
no tighter: ≥ −0.99 at the landing steps, ≥ −1.0 at u 25250, |H| ≤ 3.2 in the east.
- **Width:** the river is 23.2 m wide at u 21000. East of u 22300 the silk's bottom edge cuts the water, with no south
  bank (mist, rule 4).
- **No quay or revetment is painted.** The banks are wash-drawn slopes. There is one rough landing stair of five or six
  stone or log steps (`S2.str.landing_steps_22950`), and one raised plank walkway on posts, the "jetty", which stands
  **on land** at the top of the bank (`S2.str.jetty_27260`; nobody is on it).
- **The banks against the water:** where the north shore is an est point hidden behind moored hulls, it maps 0.07–0.86 m
  north of its own bank top (frame question 3). The builder puts the bank face at the bank top and the water under the
  hulls.
- **The current:** 汴水悍激 (pin 7): the strongest current lines and eddies are at u 26100–27100. They belong in the
  water's painted line tile.

**The scene's lines** (rope nodes of the kit, or the builder's lines):
- **逆水行舟's tow rope:** `pts.rope`, 26 points, through the five trackers' grips to the lead tracker's hands. The
  boats page re-aims it as the trackers walk.
- **The mooring ropes:**
  - the cargo boat to `S2.tree.willow_top_20668`'s foot;
  - the open boat to the mound;
  - the mat-roofed boat to the spit;
  - 豪华客船 to `S2.prop.mooring_post_23126`;
  - the moored boat to `S2.prop.mooring_post_25207`;
  - grain boat 1 to the coil and stake (two lines);
  - grain boat 2 to `S2.prop.mooring_post_rope_28272`.
- **Two gangways:** the grain boat's gangplank, and the cargo boat's short ladder up to the bank.
- **Ladders inside the boats:** 豪华客船's walkway-to-roof ladder, the mat-cabin boat's deck-to-roof ladder, and the
  ladder between grain boat 2 and the bottom boat.
- **The donkey's lead rope**, from the round-faced man's hands to its head.
- **From S3, built by S3:** S3's big boat's long pole reaches over the seam to (20600, 548), against the cargo boat.

## Props carried by figures

Existing props, new bindings only:
- `pole_baskets`: `basket_porter_27666` (porter `carry_pole`).
- `pole_shallow_baskets`: `basket_porter_24804`, a new binding on the hat traveller's `carry_pole`.
- `pole_bundle`: `pole_bundle_carrier_27767`.
- `pole_bundles`, scaled about 0.6: `pole_porter_27193`, a long pole with small loads or ropes at both ends, on the hat
  traveller.
- `stick`:
  - trailing in the right hand under a sack: `sack_porter_24312`, `_24452`, `_24537`;
  - held low and level, pointing: `shed_keeper_28467`, on the inspector's `point`;
  - tucked under the right arm: `bank_man_with_stick_25370`, on the carter's `listen`.
- `staff`:
  - trailing from the left hand while walking: `hat_walker_24004`, a new binding on the hat traveller's `walk`;
  - upright: `staff_man_28266`, on the inspector's `talk` (its existing binding).
- `bucket`: `boatman_pouring_bucket_22665`, a new binding on the idler's `bucket_lift`, tipped out.
- `fan_round`: `robed_man_foredeck_23930`, on the robed man's `point`. He holds a small round thing on a short stick,
  so a round fan is the nearest prop; the other readings are a scoop or a little basket.

S3's new props, which S2 shares:
- **`long_pole`** (a 4–6 m bamboo boat pole): `boatman_pole_20495`, `boatman_fending_off_23688` and
  `boatman_poling_24730`.
- **`back_sack`** (a big sack slung on the back, its tied neck at the top): the seven sack porters. S2's are big pale
  grain sacks, roped on `bank_porter_28355`.

New for S2:
- **`straw_cape`** (蓑衣): a cape of layered straw over the shoulders and back to the hips, drawn as dense short
  hatching. It goes on `tracker_hatched_coat_21994`, and optionally on `boatman_roof_26290` (a hatched garment over his
  lower body).
- **`bowl`**: a small bowl held out in the right hand (`tub_vendor_27765`). It is optional on `eatery_man_23642`, who
  may hold one.
- **`raised_cup`** (low): a small round thing (a cup, a small jar, or a ring on a short stick) held up above the head
  in one hand (`bank_man_seated_21140`, toward the covered boat).
- **`veiled_hat`** (帷帽, low): a tall rounded hood or a wide hat with a veil hanging to the shoulders
  (`rider_26832`). If the rider is read as a man in a hooded cape, he takes the hat traveller with a hood.
- **`stick_bundle`** (low): a small bundle of upright sticks (poles, or incense) standing on the ground beside
  `man_with_sticks_bank_24390`. It is part of the figure's `what`, so it is built with him.

## Kit parts the area needs (what exists, what is new)

S2's new parts go in its own area kit, `blender/kit_canal.py`, as generic functions; shared kits are imported, never
edited. Existing pieces are named with their module. S4b's area kit (`kit_outer_road_2.py`) and S7's
(`kit_city_end.py`) already have several of S2's needs.

**The 望火楼 (the set piece; S2 builds it, `build_rules.md`):** see "Set pieces" below.

**The wharf sheds and eateries** (the scholars' "two rows of barracks-type sheds now serving as eateries"; 望楼饭铺,
喝杯小酒, 河边店铺):
- `S2.bld.wanglou_shed_28660`, **望楼饭铺**:
  - a big hipped **thatched** roof with a small gable vent, and a second, lower thatched **skirt roof** along its front.
    Behind its east half stands a second big thatched roof;
  - many plain posts; a slatted fringe hangs under the front eave and a short valance across the east bay;
  - a wall of vertical slats (a bamboo or reed fence) closes the back at the east end;
  - kit: `kit_outer_road.thatch_roof`/`thatch_shed` with a new skirt roof, `kit_outer_road_2.valance`, and
    `kit_outer_road.bamboo_blind` for the fringe.
- `S2.bld.tiled_shed_27985` (河边店铺): a long open tiled shed on posts with a west gable over two open bays, and a long
  hatched **mat curtain** hanging from its eave. `song_kit.open_hall` / `far_shed` with a hung mat (`bamboo_blind`).
- `S2.bld.lower_shed_27780`: an open eating shed with a front gable over its middle, a low front roof and a flat awning
  on posts.
  - At the back: a long counter beam with slatted blinds, and two dark cloths hung on the back rail.
  - Its capped east front post stands at u ≈ 27990.
- `S2.bld.eating_shed_west_27300` (喝杯小酒): a huge tiled roof whose eave runs down to the east, and under its front a
  flat woven-mat awning on posts with a diagonal stay. `kit_inner_city.mat_roof` on posts.
- `S2.bld.eatery_shelter_23750`: a broad shelter of mats or thatch on slender posts, open on every side, with a cloth
  hung under its back eave. `kit_outer_road_2.open_mat_shed`.
- `S2.bld.rear_shed_28380`: a long tiled roof (roof only) with a small dark knob on its ridge (an ornament or a bird).
- `S2.bld.far_shed_top_28720` (low), `S2.bld.far_shed_25785` and `S2.bld.far_long_shed_26260`: open tiled sheds on
  posts at the silk's top. `song_kit.far_shed`.

**On the water's edge:**
- **new** `S2.str.jetty_27260`, the raised plank walkway in front of the lower shed. A plank deck on four posts
  standing on the bank slope, with a river-facing railing or fascia of short vertical slats; nobody is on it. Its front
  edge runs 77–97 px above the posts' feet. `song_kit.plank_deck` and `post`, with a slat rail.
- **new** `S2.str.landing_steps_22950`: five or six rough steps of irregular stone slabs or logs down from the bank to
  the water, with weeds or stones beside them. `song_kit.boulder`/`stone_run` as treads.
- **new** `S2.bld.river_terrace_23250`, the riverside dining terrace. An open-sided hall at the bank's edge, its front
  floor carried on stilts over the bank slope:
  - a balustrade with a top rail, a decorated panel and a carved floor sill, between slender posts (`song_kit.balustrade`);
  - a lattice-screened room at its west end;
  - a **two-tier roof**: a plain light upper roof over a tiled lower eave;
  - at its east end, a pavilion with its own gable roof and a lattice balcony railing with knobbed corner posts, and a
    slatted blind on its east side.
- **Mooring posts and stakes:**
  - `S2.prop.mooring_post_25207` (on the bank slope) and `S2.prop.mooring_post_23126` (in the water, its foot hidden):
    `kit_outer_road_2.mooring_post`. On 23126 the rope is knotted round the top in loops, with a short loose tail.
  - **new** `S2.prop.mooring_stake_27902`, a thin tapering stake.
  - **new** `S2.prop.mooring_post_rope_28272` (low), a tall post with a rope coiled round its top and hanging down its
    sides.
- **new** `S2.prop.coiled_rope_27873`: a coil of heavy rope lying in stacked loops at the stake's foot, with a short
  frayed end. The boat kit's deck coils (`_cargo`) may serve as a free-standing function.
- `S2.prop.ladder_28538` (low): a ladder or two long poles with cross-bars lying aslant on the bank slope. **new**
  free-standing ladder (the boat kit draws ladders inside its cabins).
- `S2.prop.ribbed_object_28878` (low): a small light elongated thing with cross ribs at the water's edge, a rolled mat
  or basket. A rolled mat, as in the boat kit's `_cargo`.
- `S2.prop.stake_27708` (low): a thin upright stake on the bank. `song_kit.post`.

**The grain wharf** (私粮进京):
- **new** `S2.prop.sack_pile_27996` (2–3 sacks, the owner's seat) and `S2.prop.sack_heap_28144` (6 sacks: long sacks
  lying one on another with tied ends, and short ones standing on end with tied necks). `kit_vehicles.soft_sack` and
  `song_kit.sack`, standing and lying; the owner's seat height is a choice.
- `S2.prop.bundle_28520`: a low heaped bundle or basket on the ground. `song_kit.bundle_pile` or `soft_sack`.
- `S2.prop.long_board_rack_28365`: several parallel boards lying slanted on trestles, narrowing to the east.
  `song_kit.trestle` and `board`.
- `S2.prop.tall_jar_28396` (low): a tall round-shouldered vat. `kit_outer_road_2.big_jar`.

**The yards and frames east of 王家纸马铺:**
- **new** `S2.prop.pole_frame_27490`: a tall free-standing frame of long poles in the yard, about 200 px from its feet
  to its apexes.
  - At the west, a big A-frame of two railed ladders leaning together, apex about (27415, 105).
  - Several tall poles crossing near the eaves behind, with long beams laid across them at v 150–230.
  - At the east, a cross-braced A-frame, apex about (27598, 120).
  - No roof or cover. `kit_inner_city.lashed_pole`/`lashing` with the new ladder.
- **new** `S2.prop.pennant_frame_27930`: two long poles leaning together into a tall A, with a cord of about eight
  small pennants running down west to the lower shed's roof and a few more along the east pole. One pole's foot is held
  up by the man in the long robe. `kit_inner_city.lashed_pole` and `streamer`.
- **new** `S2.str.railed_stair_27630` (low): a railing with close balusters slanting down to the east between the pole
  frame and the tiled shed, with a lower rail on posts: the rail of a stair, ramp or raised gallery.
  `song_kit.balustrade` on a slope.
- `S2.prop.trestle_board_27310`: a small A-frame trestle of poles with a long curved slatted board lying across it.
  `song_kit.trestle` with a bent slat board.
- `S2.prop.low_stand_27500` (low): a low box-like stand on short legs. `kit_city_end.braced_stand`.
- `S2.prop.parasol_27430`: a large round parasol, tilted, about 200 px across, its underside dark and cross-hatched.
  `kit_inner_city.umbrella`.
- `S2.prop.tub_27815`: a big round wooden tub on a low four-legged stand, about 75 px across. `kit_inner_city.tub` on a
  stand.
- `S2.prop.tub_27532` (low): a tall staved tub or box at a shed post. `kit_city_end.slatted_tub`.

**The scaffold house and the bank shops (u 24500–25500):**
- `S2.bld.scaffold_house_24975`:
  - a plain plastered front wall under a **scalloped hanging-cloth valance** and a bracket frieze
    (`kit_outer_road_2.valance` with a scalloped hem);
  - a light triangular gable facing the river with a lattice board under it, and a small hip-gable west end;
  - a two-lobed ridge-end ornament (鸱尾) on the main ridge's west end (`song_kit.ridge_ornament`).
  - **The pole scaffold on its roof ridge:** uprights with two or three levels of cross-bars and braces, the pole tips
    sharpened and splayed like a crown. It covers u 24880–25240, up to the silk's top edge. Use
    `kit_inner_city.pole_scaffold` with sharpened, splayed tips.
  - **A long pole sticking out west from the scaffold's foot**, with a banner of three dark vertical stripes on light
    cloth with a wavy hem: `kit_outer_road.striped_banner`.
  - **new: a big curved mat awning** sweeping out and up from the wall's west end over the stall, held by a post at the
    wall's corner. A swept, upturned mat, like `kit_outer_road.arched_canopy` but cantilevered.
- **new** `S2.prop.pole_stack_24680`: a dense stack of long poles or stalks standing upright and leaning together,
  its top rounded.
- `S2.prop.signboard_pole_25235`: a tall thin pole with a knob at its top and a narrow vertical light signboard hanging
  beside it, with 2–3 illegible characters: □□(□). `kit_inner_city.signboard` on a `capped_pole`, with an illegible
  atlas cell.
- `S2.prop.goods_racks_25290`: two slatted display racks (tiered stands with diagonal slats) set at an angle, loaded
  with small upright goods. `kit_outer_road_2.two_tier_stall` or `kit_city_end.lattice_stand`.
- `S2.bld.open_shop_25340`: a dark curtain hung from the eave beam and drawn up into a swag at its east end (**new**
  swagged curtain), and a narrow signboard with □□□ at its west end.

**The halls (沿河雅座, pin 14) and the warehouse:**
- `S2.bld.yanhe_yazuo_hall_25690`: a long hall whose room is raised above the bank, with a row of big open windows
  (posts, open sashes).
  - Under the sill, a lattice skirt of patterned panels (`kit_city_end.patterned_front` or `lattice_frame`); posts
    below stand on the bank.
  - One huge tiled roof runs on east over the warehouse without a break.
  - Inside: a long table with **three crossed-leg folding seats** (`S2.prop.hall_tables_chairs_25775`; **new**:
    `kit_inner_city.folding_stand` is a stand, not a seat), a low table, and a ladder or steep stair to the upper floor
    (`S2.prop.hall_ladder_25535`).
- `S2.bld.warehouse_26070`: a closed front of three bays of full-height lattice doors between plain posts, under an
  eave with a row of round tile ends. It stands on a raised platform faced with horizontal planks, with capped posts
  along the platform's face (the bay posts carried down). **new**: the plank-faced platform with its capped posts.
- `S2.bld.tall_rear_hall_25330` (roof only): a round finial on a short pedestal at its peak, and a long paddle-shaped
  thing lying on its east hip (an oar on the roof, or an ornament).
- `S2.bld.white_wall_house_26330`: a plain white plastered wall under a hipped roof with round tile ends.

**王家纸马铺 (pin 13; Hansen plate 8):**
- `S2.bld.wang_paper_horse_shop_27100`: a long single-storey shop open along its whole front under a tiled roof with a
  heavy eave beam, with shelves and counters stacked with paper goods. At its west end the roof ends in a rounded hip,
  with a dark slanting strut above the sign's cap.
- `S2.prop.signboard_wang_paper_horse_26896`: a tall free-standing signboard in one column of 4–5 characters, too small
  to read: 王家紙馬… (□□□□(□)). Its board has dark side edges and a small cap, and it is set in a low foot frame with
  two splayed feet. `kit_city_end.tall_signboard` with a foot frame, and an atlas cell.
- `S2.prop.paper_goods_stack_27070`: a low box-stand on four legs piled up to the eave with stacked paper offerings
  (square and rounded packets and paper models, 纸马). `kit_inner_city.paper_tower` on a stand.
- `S2.prop.tall_paper_item_27112` (low): a tall narrow upright with a rounded top, about 20 × 90 px: a paper effigy or a
  board. `kit_inner_city.paper_figure`.

**The west bank (u 20500–23000):**
- `S2.bld.shop_row_21200`: five bays.
  - From the west: a lattice window band over a plain wall; an open bay with a table and a basket; an open bay under a
    **decorated valance or bracket band**; and a bay closed by **horizontal slatted shutters** (**new**).
  - A side wall with a lattice door recedes north at the east end.
- `S2.str.slat_fence_20740`: a tall fence of close vertical slats set at a slant, with a narrow gateway of two posts.
  `kit_inner_city.slat_fence` and `kit_outer_road.gate_frame`.
- `S2.str.gateway_22573`: a small roofed gateway (门楼) with a closed double door with **two ring knockers** and a sill.
  `kit_outer_road.gate_frame` and `kit_city_end.plain_leaf` (which has a ring knocker), under a small gabled roof.
- `S2.str.white_wall_22485` (white plaster, tiled coping sloping to the gateway) and `S2.str.tiled_wall_21810`:
  `song_kit.yard_wall`.
- `S2.str.slat_screen_22375` (low), a slatted screen with a capping rail: the hall behind the gate's west bay if
  `S2.bld.hall_behind_gate_22480` is built.
- `S2.str.panel_screen_23555`: a low panelled screen set at a slant, with shelving or stacked boards behind it.
  `kit_city_end.low_partition`.
- `S2.str.low_kerb_20920` (low): a low kerb or sill. `song_kit.stone_run`.
- `S2.bld.long_house_22780`: a plain plastered front with a band of lattice windows under a projecting plank **pent
  roof**, a big tiled hip roof with a **small chimney** (`kit_city_end.roof_vent`), and two doors at its east end.
- `S2.prop.timber_frame_21922` (low): a squared timber with a cross-piece slanting up from a short post: a trestle or
  prop. `song_kit.beam` and `post`.
- `S2.prop.wheel_20965`: a small spoked wheel standing on its edge against a low wall. `kit_vehicles.spoked_wheel`.
  `S2.prop.wheel_26343` (low) is a large upright wheel on the far street.
- `S2.bld.south_bank_hall_21050` and `S2.bld.thatched_shed_south_21600` (roofs only, at the bottom edge):
  - a broad hip roof of **fish-scale tiles** seen from above, with eave brackets (**new** tile texture);
  - a thatched or mat roof with grass tufts or small ornaments along its ridge;
  - `S2.bld.gable_house_south_21730`: an open gable truss with posts (`kit_outer_road_2.kingpost_gable`).
- `S2.bld.gable_loft_house_28060` (east, low): a big gable facing the river with a balustrade across an open loft on
  two posts. `song_kit.gable_roof` and `balustrade`.

**Furniture:**
- **Tables:** `song_kit.table`, 36 of them (8 at the eatery, 3 on the terrace, the rest at the shop fronts, the stalls,
  the far street and the sheds), plus two groups of far tables; `kit_city_end.braced_stand` where the legs have diagonal braces (`stall_table_24708`).
- **Benches:** `kit_inner_city.bench`, 21 of them, and one beside `table_awning_27205`.
- **Stools:** `stool_28665` and `shed_stool_28871`, `kit_inner_city.stool`; the first has crossed, splayed legs.
- **Chairs:** `terrace_chair_23250` (low), `kit_outer_road_2.chair`.
- **new: crossed-leg folding seats** (交杌, three in 沿河雅座).
- **Small things:**
  - `basket_on_table_21180`, `kit_inner_city.round_basket`;
  - `stall_goods_24672`, light bundles or baskets with sprigs, `kit_inner_city.goods_heap`;
  - `eatery_rack_23688` (low), a stack of steamers or jars on a rack, `kit_inner_city.tray_stand` or `pot`;
  - `doorway_jar_23885` (low), `kit_outer_road_2.big_jar`;
  - `tub_or_trough_28923` (low);
  - `terrace_bundle_23187` (low), `song_kit.bundle_pile`.
- **Far furniture:**
  - `far_shed_furniture_28728` (low): crossed trestle legs, `kit_inner_city.folding_stand`;
  - `shed_tables_25845` (low): three tables or benches and an A-frame trestle;
  - `shed_counter_26765` (low): a counter with dark goods or hanging cloths;
  - `baskets_26778` (low): two round baskets set down, with a line across them (their pole).
- **The far-street stalls:**
  - `stall_awning_25660`: a cloth or mat awning on crossed poles and a long slanting pole. `kit_inner_city.lean_to` and
    `lashed_pole`.
  - `stall_table_25650` and `stall_table_26173`, the latter covered with small goods or dishes.

**Textures and details:**
- fish-scale tiles seen from above, on the south-bank hall;
- the scalloped valance;
- the slatted shutters;
- the swagged curtain;
- **the illegible signboards:** three atlas cells of □ marks (□□(□), □□□ and the paper shop's □□□□(□)), plus a light
  panel with dark marks at the top edge (`S2.bld.far_lattice_front_23470`, □□).

## Set pieces

- **The 望火楼** (S2's own; `build_rules.md`: "S2 its 望火楼"). It is `S2.str.fire_tower_platform_28450` plus
  `S2.bld.fire_tower_28440`, in `kit_canal.py`, from the map's points and the frame's `fire tower platform` support
  (H 1.13, a lower bound). Nobody stands on it or on its stair (余辉: a fire tower with no watchman).
  - **Platform:** tall, of horizontal **brick courses**. Its face is clear at u 28393–28510 (v 203–283) and fainter to
    about 28548. The foot is hidden behind `S2.bld.rear_shed_28380`'s roof, so the platform is at least 80–85 px of
    painted face; its real height is a choice.
  - **Railing:** baluster rails run along the front edge of the top (v 180–197, u 28400–28513).
  - **Stair:** a straight wooden stair with two stringers, treads and a hand-rail climbs eastward against the
    platform's west side from about u 28285 and lands at its front-west corner.
  - **Pavilion:** four posts carrying a pyramidal tiled roof with wide flaring eaves and a round finial on a pedestal.
    Its eaves span 28313–28577.
  - **The back:** the back posts and the platform's back corners stand **45 px left** of the front ones. This is the
    up-left recession of S2's east wharf, and it confirms the frame's turn of the receding direction.
  - **Not painted:** the restyle draws a wide stepped stone terrace; the scan has one brick face and a wooden stair.
- **Not in S2:** the Rainbow Bridge, 十千脚店's 彩楼欢门, the thatched farmhouse and the threshing floor.
- **The scaffold house's pole scaffold** is near a set piece (`kit_inner_city.pole_scaffold`; under "Kit parts").

## Trees: 21, by form (`trees/types.md`; all bare or just budding, early spring; the restyle leafs every willow, the scan doesn't)

Mapped heights are the painted heights at the frame's one scale, and the far crowns at the silk's top come out
0.4–3.7 m. The tree count matters to the user: four of these trees are `conf: low`, and their lines say why they are
kept.

- **`willow_burl`, 4** (the landmarks):
  - `dark_trunk_willow_20530` (13.97 m, at the bottom edge by the S3 seam): the darkest thing at the bottom. A massive,
    gnarled, knotty trunk rises to a knobbed head; one **pale straight limb leans far up-west**, and a fan of long bare
    shoots rises into the middle of the silk. Card `_2` (an upright bole with knobbed heads), with the pale limb a
    choice. The other reading is a bare elm.
  - `willow_great_21345` (14.78 m, the south bank): a huge, knobbed, hollow-looking trunk 150–200 px wide, leaning
    north. It forks at mid-height into a tall upright stem and a heavy eastern limb whose whips sweep far out over the
    water to u 22090. Card `_1m` (bole leaning, whips sweeping east) or `_2`. **Two birds perch in it.**
  - `willow_great_27068` (9.22 m, by the jetty): a thick twisted trunk rises from the bank's foot and **leans about
    250 px up and north-west to a massive knobbed pollard head lying almost level** (u 26800–27050). Its whips spread
    west over the moored boat, up to the paper shop and east over the sheds. Card `_1m`; the near-level head is beyond
    every card.
  - `willow_split_22285` (3.69 m painted; crown 8.4 m wide, at the top of the bank over the trackers): a huge old
    pollard whose trunk is **split into two legs like an inverted V**, joined in one knobbed head (custom points
    `foot_w`, `foot_e`). No card shows this: **a new `willow_burl` card**, or `willow_fan_3` (twin trunks) turned
    upside down in spirit. The other reading is two willows with merged heads.
- **`willow_fan`, 6:**
  - `willow_top_20552` (single trunk, knobbed head 80 px below the top edge, whips in every direction) and
    `willow_top_20668` (a twisted trunk leaning north-east that **forks into two knobbed heads**; card `_3`): the pair
    at the top by the S3 seam.
  - `willow_top_26605`: a knobbed head on two short legs on the far street; card `_4`.
  - `willow_27925` (trunk behind the north shed, hanging whips), `willow_behind_shed_28612` (only its knobbed head and
    a dense fan of whips above 望楼饭铺's ridge) and `willow_behind_shed_28555` (low: a second fan, or the west half of
    28612): far crowns whose feet are hidden behind roofs, so their depth is a builder's choice.
- **`elm_claw`, 2:** `bare_28130` (a single twisted trunk, a wide crown of crooked branches tipped with small dark leaf
  tufts; card `_3`) and `elm_top_28292` (a straight dark trunk beside the 望火楼's stair, crooked branches; card `_2`).
  Both feet are hidden behind the sheds' roofs.
- **`slender`, 3:** `far_tree_28603` (a dark trunk from the top edge with a fork; card `_1`), `far_tree_28655` (a trunk
  with a rounded dark mass at its foot, a shrub or a swollen base; card `_1`) and `stems_behind_top_house_27790` (low:
  two straight parallel stems behind a roof; card `_3`, or the west whips of `willow_27925`).
- **`shoot_tree`, 2:**
  - `bare_south_bank_20705` (low; 7.25 m): a fan of long thin straight bare stems rising from a foot hidden behind the
    south-bank hall's roof. Card `_2` (a coppice fan). Added at the merge on S3's reading; the other reading is the
    dark tree's east shoots.
  - `small_tree_or_post_28880` (low; 0.65 m): a thick slanting stroke with a fork. Card `_3`, or a post or a well
    frame (then no tree).
- **`whip_clump`, 2:** `shrub_mound_21605` (a small branching shrub on the south mound's crest; card `_1`) and
  `weed_clump_22665` (tall weed stems arching east from a leafy mass at the house's corner; card `_2`).
- **`leafy`, 2:**
  - `shrub_row_22805`: a continuous knee-high row of small leafy shrubs along the long house's wall foot, 2.6 m long.
    It is **one entity for a strip**, so it needs one wide row card or `leafy_1` instanced along the line under one ID.
  - `shrub_or_screen_22416` (low): a dense dark shrub at the house's corner, or a lattice screen.

New cards worth asking for:
- **`willow_burl` with a split, inverted-V bole** (`willow_split_22285`);
- **a pollard whose trunk leans so far that its knobbed head lies nearly level** (`willow_great_27068`). It is the
  painter's most striking willow on the canal, and `_1m` only approximates it;
- **a `leafy` row card** for the shrub strip.

## Also (not the workshop's list, for the lead)

- **The tow rope crosses half the section.** It runs from 逆水行舟's mast (u 24188) to the lead tracker (u 21832) over
  the cargo boat, the bank and the trackers' towpath. The boats page must load it with the boat and keep it re-aimed as
  the trackers walk, and the streaming window must not cut it.
- **The man in the river** (`man_in_river_20970`) stands waist-deep in open water among the whips (low). He is built as
  painted, with no boat. If the lead reads a hidden craft, that is a map change, not a build choice.
- **Seated supports:** the grain owner sits on `S2.prop.sack_pile_27996` (seat height a choice); the cart loader
  stands on `cart bed` H 0.91; the terrace diners are on `terrace floor` H 0 (the floor is level with the bank top);
  沿河雅座's guests are on `upper floor` H 1.3. Seated clips take their seat from the furniture's real height.
- **High decks:** S2's boats seen from above give high decks (the cargo boat 1.77 m, the moored boat 2.0 m, the
  mat-cabin boat's poop 3.17 m, 豪华客船's after roof 3.39 m). The kit's own decks (0.25–0.95 m) differ. Crew stand on
  the kit's decks, with the map's H only as a check.
- **Thin strips:** in front of the scaffold house (u 24700–25100) the walkable strip is 0.20–0.29 m deep at the frame's
  rate (frame question 2). People there stand on the bank's slope or are moved as recorded choices
  (`build_choices.json`).
- **Two scholarly vignettes are candidates only:** 船侧祭神 (the bucket pourer, or the south-bank group holding a cup up
  toward the covered boat) and 客船启程 (the man on 豪华客船's ladder). Nothing in the build should assert either.
