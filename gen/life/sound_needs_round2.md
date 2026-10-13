# Sound needs, round 2: S7 · S4b · S3 · S2 · S1

Every sound the five round-2 areas need, for ElevenLabs sound effects (user-approved; voices wait for another
provider). Written 2026-10-12 while round 2 was still mapping. Sources:
- the briefs `gen/expand/round2/brief_*.md`;
- the unit parts that existed when this was written: S7 `structures`, `t1`, `t2`; S4b `t1`–`t5`, `structures_w/e`,
  `river`; S3 `t2`. The rest are brief descriptions;
- `reference/scroll/sections.md` §1–2, `gen/life/design.md` and `gen/life/sound_research.md` §4;
- the existing sets `sounds/samples.json` and `sounds/core.json` (S4–S6, the player, the HUD).

Nothing here is generated.

**How to read it**
- **IDs** are the parts' IDs before merge, and a merge may rename a few. Where an area has no part yet, the thing is
  given as the brief describes it, with its scan u.
- `unit` (plain) is an existing unit in `core`/`samples`, reused. **`unit`** (bold) is new and listed in the
  generation list at the end.
- Point sounds come only from painted things. Beds (wind, birds, insects, far murmur, water) are low backgrounds.
- A figure's sounds play only while that figure is present: the people system decides who stays out at night.

## Across all five areas

- **The gate tower drum** (`drum_dusk`, `drum_hit` + `watch_clapper` for the night watches) is the S5 tower's. By the
  design's 150 m range it carries faint and low-passed into S7 (≈ 70–85 m), S4b (≈ 65–105 m) and the west half of S3
  (to about u 19000). S2 and S1 don't hear it. No other drum is painted in these areas.
- **Season:** Qingming is April. The travellers bundled against the cold (迎寒策蹇) and the charcoal donkeys point to a
  cool spring. So: frogs, swallows, tree sparrows and magpies; sparse insects; no cicadas, no summer cricket chorus.
  Outside the walls, **`bed_open_night`** replaces `core`'s `bed_night`, whose prompt says "late summer".
- **The river (汴河)** runs under S4b's moorings, S3 and S2. **`bed_river_flow`** plays day and night. By day,
  **`bed_wharf_day`** goes over it where people work the bank. At night, `frogs_pond` (sparse) and occasional hull
  creaks go over it.
- **Reverb zone:** under the Rainbow Bridge's arch (south bank, u ≈ 19550–19800). Use the gate passage's trick (one
  short impulse ≤ 0.6 s) with the water close and the beds low-passed. No new unit is needed.
- **Mist edges** (S7's cut end, S1's start, S2 south of the water east of u 22300): **`bed_mist_edge`**, very low.
  Nothing is painted there, so nothing points there.
- **Dedupe:** `core` already covers footsteps on earth, stone, timber, brick and grass, running on earth, cloth bumps,
  willow brushing, donkey, horse, ox, pig, dog, crow and sparrow sounds, bird take-off, hooves walking on earth,
  harness jingle, the 串车 wheelbarrow, carts on timber, sedan creak, sack drop, basket set-down, coins, writing,
  bowls and cups, wine pouring, frying, steamers, banners, shutters, crowd laughs and gasps, drum hits, the 柝, the
  temple bell, the dawn round, roosters, lapping at posts, frogs, crickets, wind gusts and the evening street. None of
  these is generated again.

---

## S7 卷尾 · the scroll's end (u 815–2000)

**(a) Zones**
- **The street from 赵太丞家 to the well's west end** (u 1450–2000):
  - day: `bed_inner_street` about 6 dB down, as the town's last block, carrying on from S6;
  - night: `bed_night` (inside the city) and the S5 drum, faint.
- **The gatehouse of 官宦人家** (u 1000–1450): by day the street bed thins to a hush round the gate group; at night,
  `bed_night` only.
- **The cut edge** (u 815–1000), willows and bare trees: **`bed_bare_trees_wind`** with `wind_gust` in the edge willow.
  At the silk's edge **`bed_mist_edge`** takes over. There is no panel there, only mist.

**(b) Point emitters**
- **问病** `S7.grp.zhao_taicheng_patients`: seated_woman_child_1535, child_on_lap_1546, child_at_knee_1547,
  standing_woman_1567 and doctor_dark_robe_1615. The doctor reaches to the child, and no medicine-making is painted (no
  grinder, no scale). It is voices only.
- **The official riding out** `S7.grp.official_retinue`:
  - S7.ani.horse_official_1625: `hooves_horse_walk`, `horse_snort_stamp`, `harness_jingle`;
  - official_rider_1610, folded_object_bearer_1490, groom_1698 and attendant_pale_1750: their steps (`steps_earth`).
    The folded object is silent.
- **The well's west end** `S7.grp.well_west_end`:
  - S7.fig.bucket_man_1872 bends over S7.prop.bucket_at_carrier_1890: **`bucket_slosh`**, then `pole_creak` when he
    shoulders the pole;
  - bucket_bail_1950, bucket_lidded_1988 and bucket_small_1930 are silent.
  - The well itself is S6's.
- `S7.ani.pale_shape_1905` (conf low) has a sound only if the merge keeps it as an animal (then `donkey_snort`).
- **Porter and walkers:** S7.fig.porter_baskets_1255 gets `pole_creak`; walker_bag_1885 and bundle_man_1976 get steps.
- **The gatehouse** `S7.grp.gatehouse_1240` is voices. The tied sack (S7.prop.tied_sack_1365) and the peaked box
  (S7.prop.peaked_box_1346) are set down: `basket_set_down`, once per loop.
- **The crow** S7.ani.bird_roof_1735, on the roof: `crow_caw` (sparse), and `bird_takeoff` pitched down when you come
  near.
- **Trees:**
  - willow_edge_855: `wind_gust`;
  - the bare trees bare_knobbed_905, bare_bottom_1117, gnarled_low_edge_875, shoots_bottom_west_960 and
    twig_bush_bottom_1468/_1648, and the needle trees needle_tree_1910/_1955: **`bed_bare_trees_wind`**, weighted
    toward them.

**(c) Interaction**
- `steps_earth`, and `bump_cloth` in the retinue.
- `willow_brush` at the edge willow.
- **`twig_brush`** in the bare shoots (shoots_bottom_west_960) and the knobbed tree's low limbs.
- **`wood_bump`** on 赵太丞家's free-standing boards (board_zhao_west_a_1392, _b_1433, board_zhao_east_1775) and
  the lattice stand 1452.
- The crow lifts off (`bird_takeoff`).

**(d) Voices:**
- 门房指路: the gatekeeper, the pointing man and the visitor with the food box;
- the doctor and the two mothers, and a small child's fretful whimper (child_on_lap_1546);
- the retinue's 喝道 call clearing the street (Song practice, our reading).

---

## S4b 城门口外 part 2 · the outer road east to the moorings (u 12600–15500)

**(a) Zones**
- **The palm carts and the open shops** (u 12600–13300):
  - day: `bed_outer_road`, plus `bowls_cups` from shop_table_13010, bottom_shop_12750 and open_shop_13205;
  - night: **`bed_open_night`** and the S5 drum, faint.
- **The crowd and the first crossroads** (13100–14100): the crowd's murmur (voices, later), the wheelwright's mallet and
  the mules.
- **The tea house, 小铺闲坐** (14100–15100):
  - `bowls_cups` and low talk;
  - at night, a low murmur only if figures stay. 东京梦华录 has tea sold at the third watch, and
    S4b.prop.white_box_14147 may be a lamp-box.
- **The bank and moorings** (14500–15500):
  - day: **`bed_river_flow`**, with **`bed_wharf_day`** at half level (five boats, few people);
  - night: **`bed_river_flow`**, **`bed_open_night`** and sparse `frogs_pond`.

**(b) Point emitters**
- **The second palm cart** `S4b.grp.palm_cart_13455`, heading north-east:
  - ox_shaft_13442 and ox_lead_13458: `ox_low`, `ox_breath`;
  - **`cart_two_wheel_earth`** while it moves, with no iron bell (see Period);
  - cart_driver_13303, carter_at_shaft_ox_13243 and porter_at_cart_rear_13090.
- **Parked and silent:**
  - the first palm cart, S4b.veh.palm_cart_13070 (unhitched, someone resting under the thatch);
  - the sedan, S4b.veh.sedan_chair_13140 (set down, with sedan_attendant_13160).
- **The crowd** `S4b.grp.crowd_seated_man`: seated_man_13240 bends over S4b.prop.goods_on_mat_13282 (bowls, lids,
  small baskets?) among 12 onlookers. `bowls_cups` as wares are handled, and `coins_cash` if a sale is staged.
- **The top-street stall** `S4b.grp.top_stall_13480`: stall_keeper_13415 sets down his round lidded basket
  (`basket_set_down`).
- **The saddled horse** `S4b.grp.saddled_horse_13378`:
  - horse_saddled_13378 (a man bowed at its girth): `horse_snort_stamp`, `harness_jingle`;
  - donkey_13474: `donkey_snort`, and `donkey_bray` rarely.
  - Also S4b.ani.horse_12862 with man_big_hat_12895: `horse_snort_stamp`.
- **The pack mules** `S4b.grp.pack_mules_top_street` (mule_pack_head_down_13612, _head_up_13645, _east_13752,
  _behind_13787, muleteer_13560): **`mule_call`**, `harness_jingle`, and `hooves_donkey_walk` if they move.
- **车铺劳作** `S4b.grp.wheelwright_yard`:
  - wheelwright_bending_13620 strikes S4b.prop.loose_wheel_13665: **`wheelwright_mallet`** on the clip's strike frame;
  - tool_on_ground_13632 lies unused, so there is no adze sound.
- **Porters:**
  - man_bending_sack_13607 sets down his sack: `sack_drop`;
  - porter_pole_bundle_13537 and porter_baskets_14778 (going up the bank): `pole_creak`.
- **The tea house** `S4b.grp.tea_house_customers`: customer_hat_14462 and customer_white_14560 across table_14518,
  customer_cap_14785, customer_bent_14420 and man_east_bay_14958. `bowls_cups`; the cooking units only if round_stand_14600 is read as a brazier.
- **The moorings** (river part):
  - **the boats:** S4b.veh.boat_big_cabin_14928 (its lowered mast along the cabin tops; tied by two ropes to
    S4b.prop.mooring_post_14737), boat_arched_awning_14945 (anchor line out east), boat_mat_cargo_14900 (a gangplank
    to the bank), boat_long_cabin_14850 and boat_round_mat_15025. All five are rafted side by side;
  - **the hull sounds:** **`hull_creak`** and **`hull_water_slap`**, **`hull_bump`** between rafted pairs, and
    **`mooring_rope_creak`** at the post and on the anchor line;
  - **the boat at the far bank:** boat_small_cabin_15182 (small flag: `banner_flap`, far);
  - **the crew:** seated_man_cabin_roof_15012, seated_boatman_stern_15372, boatman_dark_cap_15046,
    boatman_light_hat_15066 and head_in_cabin_door_15097. They get **`step_boat_deck`** when they shift.
- **The bank people** (man_on_bank_14928, pointing at the boats; `S4b.grp.bank_pair_14670`) are voices.
  客家登船 isn't mapped as a boarding.
- **Shades:** parasol_14872 and round_canopy_14905 get `banner_flap` (cloth). thatch_shade_13049 and thatched_canopy_13052
  are thatch, so they make a sound only when touched.
- **The small bird** S4b.ani.bird_12827: `sparrows_tree`, `bird_takeoff`.
- **Trees:**
  - the willows (willow_15468, willow_head_14470/_14300, the far bank's row): `wind_gust`;
  - the bare elms (elm_twin_12921/_12976, forked_elm_14045, gnarled_13085, gnarled_13318, young_tree_15275,
    far_bank_15230/_15308): **`bed_bare_trees_wind`**.

**(c) Interaction**
- **Footsteps:**
  - `steps_earth`;
  - **`step_mud`** on the bank's lip at the water (S4b.grd.near_bank_14850);
  - **`gangplank_flex`** on the mat-cargo boat's plank;
  - **`step_boat_deck`** if the boat pilot opens the decks.
- **Brushing:** **`straw_reed_brush`** at the reed fence S4b.str.reed_fence_15320, the reed mat S4b.prop.reed_mat_13870,
  the palm carts' fringes and the thatch shades.
- **Bumping:**
  - **`wood_bump`** on the wheelwright's leaning poles (leaning_poles_13775) and timber pile (timber_pile_13745);
  - **`jar_knock`** on S4b.prop.big_jar_12707 and barrel_12677;
  - `bump_cloth` in the crowd.
- **Animals as you pass:** the mules shift and call, the saddled horse stamps, the donkey snorts.
- `willow_brush` under the seam willow.

**(d) Voices:**
- the crowd haggling over the seated man's goods;
- the wheelwright and the man in the wide hat;
- tea-house talk;
- the man on the bank pointing out the boats, and his small companion tugging at him;
- the carters' calls to the oxen (吁);
- the boatmen at rest.

---

## S3 虹桥 · the Rainbow Bridge (u 15500–20500)

**(a) Zones**
- **The riverside hall and the west reach** (u 15500–16450):
  - **`bed_river_flow`**;
  - the diners in the hall's gallery (S3.fig.balcony_drinker_16358, balcony_figure_16383): `bowls_cups`;
  - across the water, the trackers and the masted boat.
- **十千脚店 and the 新酒 pole** (16400–17600):
  - day: `bed_inner_street` at the tavern door, with `bowls_cups`, `pour_wine`, and `fry_griddle`/`steamer_lid` if a
    kitchen shows;
  - `banner_flap` for 新酒 (pin 23);
  - night: the 十千脚店 lamp-box (≈ 17000) is lit, so `bed_street_evening` plays. It is the one loud place in S3 after
    dark (东京梦华录's night markets).
- **The south bank's open ground and the unloading boats** (17300–18400):
  - day: **`bed_wharf_day`**;
  - night: **`bed_river_flow`** and **`bed_open_night`**.
- **The bridge** (the south foot, the deck, the crown, the north ramp: 18300–20000):
  - day: **`bed_bridge_crowd`**, with **`bridge_arch_creak`** under it and **`river_swift`** at the abutments and the
    arch;
  - night: the deck empties. **`river_swift`**, a rare **`bridge_arch_creak`** and wind remain.
- **Under the arch** (u ≈ 19550–19800, v 1080–1250): the reverb zone. **`river_swift`** is close, with the big boat's
  crew above.
- **The north bank** (19700–20500): shops, the small tavern (pin 21) and the cart. **`bed_wharf_day`** low and
  `bowls_cups`.

**(b) Point emitters** (brief descriptions, except the trackers)
- **摇橹向前**, the boat under way (≈ 15550–15950, its sweep to (16120, 530)): **`sweep_scull`** on its stroke cycle,
  and **`hull_water_slap`**.
- **The masted boat** (≈ 15950–16220), hauled by five trackers on the far-bank path, `S3.grp.trackers_16380`
  (tracker_16333, _16358, _16385, _16405, _16423), on one line from the mast top:
  - **`tow_rope_strain`** at both ends;
  - **`tracker_strain`** in their walk rhythm;
  - `steps_earth` scraping.
- **The far-bank moored boats** (≈ 16380–16700, the long cabin boat 16600–17300, 17300–17700, 17700–18300):
  **`hull_creak`**, **`hull_water_slap`**, far and low.
- **The boats unloading at the south bank** (≈ 17650–18100, mat covers), with porters: `sack_drop`,
  **`sack_shoulder`**, **`gangplank_flex`** where a plank shows, and `pole_creak`.
- **串车** (pin 24, ≈ 17480–17720) with its men: `barrow_wheel_earth`. The screen-tarp load is silent.
- **Porters and a donkey** (≈ 17850–18000): `pole_creak`, `hooves_donkey_walk`, `donkey_bray`, and
  **`pannier_creak`** if the donkey carries panniers.
- **The rider at the tavern gate** (≈ 17000–17150): `hooves_horse_walk`, `horse_snort_stamp`.
- **Poles and scaffold:**
  - the 新酒 pole (≈ 17600), with a bird-shaped vane at its top: **`wind_vane_turn`**. Give the same to the bridge's
    end posts (≈ 19010, ≈ 20040) if their tops carry vanes;
  - the 彩楼欢门 scaffold (≈ 16800–17340): **`scaffold_creak`** in gusts.
- **饮子** (pin 22, ≈ 18500): `pour_wine` (a drink poured) and `bowls_cups`. The seller's cry is a voice (吟叫,
  attested).
- **The stalls** on the deck and at its foot (mat awnings, parasols): `banner_flap`, low.
- **车轿相争** (≈ 18700–19300):
  - the sedan (≈ 18700–18760): `sedan_creak`;
  - the horseman: **`hooves_timber`**, `horse_snort_stamp`, and `horse_whinny` at the peak;
  - the shouts are voices.
- **上下呼救** at the railings (pin 20): **`rope_throw`**, **`railing_creak`** where people lean, and `crowd_gasp` /
  **`crowd_alarm`** at the crisis peak.
- **大船抢险**, the big boat under the arch (≈ 19350–20450, ~20 crew, the mast coming down): the loudest point in S3.
  - **`mast_lower`**, once per cycle;
  - **`rope_haul`**;
  - **`pole_push`** as they fend off the arch;
  - **`hull_creak`**, **`hull_water_slap`**.
- **The boat moored along the south bank** (≈ 19750–20650), men waving from its mat roof: **`hull_creak`**. The men
  are voices.
- **The north-bank cart** pulled up the bank (≈ 19800–19920): **`cart_two_wheel_earth`**, and its team's sound
  (`ox_low` or `hooves_donkey_walk`).
- **Trees:**
  - bare trees S3.tree.bare_tree_16460, _16520, _16342 and stem_thicket_16410: **`bed_bare_trees_wind`**;
  - the far-bank willows S3.tree.far_willow_16582/_16662, the willow at ≈ 17100 and the dark-trunk tree at
    ≈ 20330–20420: `wind_gust`.

**(c) Interaction**
- **The deck and ramps:** `steps_timber` with a lower EQ (thicker planks, a void below). Now and then a
  **`bridge_arch_creak`** under the player's weight. No separate deck footstep unit.
- **Railings and bumps:** **`railing_creak`** at the railings; `bump_cloth` in the densest crowd of the scroll.
- **The bank and boats:** **`step_mud`** on the shores; **`step_boat_deck`** and **`gangplank_flex`** at the
  unloading boats, if the pilot allows.
- **Wood:** **`wood_bump`** on the scaffold's poles and the 新酒 pole; **`jar_knock`** on the tavern's jars, if mapped.

**(d) Voices** (the most voiced area):
- 车轿相争: the bearers against the groom;
- 上下呼救: the deck crowd shouting down, the crew shouting up;
- the boatmen's 号子 as the mast comes down;
- the waving men on the roof;
- the 饮子 seller's cry;
- the tavern's waiter;
- the trackers' haul chant;
- the sweep boatman's 欸乃.

---

## S2 汴河 · the canal wharves (u 20500–29050)

**(a) Zones**
- **The west reach** (u 20500–22300), both banks, the trackers on the north bank: **`bed_river_flow`**,
  **`bed_wharf_day`** low, and `wind_gust` in the willows.
- **The middle water** (21850–23750), with the boats under way and 豪华客船: **`bed_river_flow`**.
- **The terrace on posts and the open-air eatery** (22950–24000): `bowls_cups`, `fry_griddle`, **`bed_wharf_day`**.
- **逆水行舟 and the north-bank street** (23500–25250): the tow rope, the rowers, the street's cart and the sack
  porters.
- **The halls, 沿河雅座** (24600–26800): quieter. `bowls_cups` at the windows; **`scaffold_creak`** on the roof scaffold.
- **汴水悍激** (pin 7, ≈ 26670): **`river_swift`** as a point bed on the painted swirls.
- **The wide east bank** (26800–29050): 王家纸马铺, the jetty, the sheds of 喝杯小酒 and 望楼饭铺, the sack porters, the
  grain boats and the 望火楼. **`bed_wharf_day`** at full level, with `bowls_cups`, `fry_griddle` and `steamer_lid`.
- **South of the water, east of u 22300:** nothing is painted. **`bed_mist_edge`**, low.
- **Night:** **`bed_river_flow`**, **`bed_open_night`** and `frogs_pond`. The 望楼饭铺 sheds keep `bed_street_evening`
  low, only if their figures stay. The S5 drum doesn't reach here (≥ 170 m).

**(b) Point emitters** (brief descriptions)
- **The five trackers** (≈ 21780–22150) on 逆水行舟's tow rope, about 2300 px to the mast at ≈ 24140:
  **`tracker_strain`**, **`tow_rope_strain`** at their end and at the mast, and `steps_earth` scraping.
- **逆水行舟** (pin 15, ≈ 23500–25150, two hulls):
  - the eight men: **`oar_stroke`** or **`sweep_scull`**, by river_m's reading;
  - **`pole_push`** if they pole;
  - **`hull_water_slap`** against the bow, since it is going upstream.
- **The boat with six men** working poles or oars (≈ 21870–22450), with a long pole out to the skiff or sweep blade
  (≈ 22450–22950): **`pole_push`** or **`sweep_scull`**.
- **豪华客船** (pin 17, ≈ 22420–23720): **`hull_creak`**. The passengers behind the lattice windows are voices.
- **The moored boats along the north bank** (≈ 20380–21100 with ~7 aboard, the big cabin boat ≈ 20820–21800,
  ≈ 25150–25990, ≈ 26000–26800): **`hull_creak`**, **`hull_water_slap`**, **`mooring_rope_creak`**.
- **The cabin boats at the bottom** (≈ 21950–22500, 22400–23050) and the small covered boat (≈ 20900–21200): far and
  low.
- **万石船**, the deep-laden grain boats (pin 8, ≈ 27270–28100 and 27950–28700):
  - **`hull_creak`** pitched down;
  - the gangplank (≈ 27650–27850): **`gangplank_flex`** under the porter on it, and `sack_drop`.
- **私粮进京 / 仓前成市** (pin 9, ≈ 27850–28350):
  - the porters: **`sack_shoulder`**, `sack_drop`, `steps_earth`;
  - the owner seated on the sacks is a voice (tallying), with `coins_cash` if he pays.
- **The mooring post with a coiled rope** (≈ 27800): **`mooring_rope_creak`**.
- **The boat at the bottom** (≈ 28300–29000), with a ladder and a man: **`hull_creak`**, **`step_boat_deck`**.
- **The jetty** (≈ 26950–27350, a plank walkway with a railing): `steps_timber` for the people on it.
- **The north-bank street:**
  - the ox or mule cart (≈ 24250–24500): **`cart_two_wheel_earth`**, and `ox_low` or **`mule_call`**;
  - the porters with sacks (≈ 24100–24500): `pole_creak`, `sack_drop`.
- **王家纸马铺** (pin 13, ≈ 26850): **`paper_goods_rustle`**, only if a figure handles goods there.
- **The roof scaffold** (≈ 24800–25150): **`scaffold_creak`**.
- **The 望火楼** (≈ 28180–28450): no lookout in 余辉's reading, so wind only. Anyone on its stair gets `steps_timber`.
- **The man with a dark animal** (≈ 28930–29000): the animal's unit, by its reading.
- **The willows** (≈ 20450–20600, 21300–21450, 22150–22350, 26700–26850, 28750, 28950–29200), their crowns over the
  water: `wind_gust`.
- **船侧祭神 and 客船启程** (余辉's list; to verify) only if they are mapped:
  - a libation poured into the river (`pour_wine`, onto water) and a murmured prayer (voice);
  - the departing boat: **`pole_push`**, **`mooring_rope_creak`**.

**(c) Interaction**
- **Footsteps:**
  - `steps_earth` on the street;
  - **`step_mud`** on the bank;
  - `steps_timber` on the jetty and the terrace;
  - **`gangplank_flex`**, and **`step_boat_deck`** if the decks are open;
  - **`step_splash`** where the shore is open.
- **The tow rope:** up close, **`tow_rope_strain`** is loud. It should be an edge you can't walk through.
- **Other contact:** `willow_brush`, and `bump_cloth` at the sheds.

**(d) Voices:**
- the trackers' haul chant (a 邪许-style rhythm);
- the boat crews' calls, and the porters' 号子 under the sacks;
- the owner tallying the sacks;
- the eating-shed talk (喝杯小酒);
- the passengers on the 客船;
- 聊天的伙计 (pin 16).

---

## S1 郊野 · the countryside (u 29050–37610)

**(a) Zones**
- **The village stalls at the market's edge** (u 29050–29820): `bed_outer_road` and **`bed_country_day`**, with
  `bowls_cups` at the stall and the cattle.
- **The fields, the farmhouse and the 菜地** (29530–30400), **惊马闯市 and the travellers** (29980–30700):
  **`bed_country_day`**.
- **The tomb-sweeping party and the hut** (30600–31430): **`bed_country_day`** and wind.
- **隋堤烟柳** (31000–33200): `wind_gust` in the great willows over a low **`bed_country_day`**.
- **The farmhouses and 寂静的谷场** (33400–35200): quiet. A thin **`bed_country_day`** and
  **`bed_bare_trees_wind`**; nothing is worked on the threshing floor.
- **The start** (35400–37610): bare trees, the stream, the small bridge and the donkey train.
  - **`bed_bare_trees_wind`**;
  - **`stream_trickle`** at the stream and the bridge;
  - **`bed_mist_edge`** toward the start and over the pale wash below (v 1100–1600).
- **Night:** **`bed_open_night`**, `frogs_pond` (the stream, the wet fields) and **`stream_trickle`**. `crickets_close`
  sparse at most. No town sounds, no drum.
- **Dawn:** `rooster_far` in the bed. The charcoal donkeys are 东京梦华录's dawn traffic into the city.

**(b) Point emitters** (brief descriptions)
- **The stall shed** (≈ 29250–29820) and its seated customers: `bowls_cups`. Cooking only if a stove is mapped.
- **The lying water buffalo** (≈ 29340–29500) and **the standing ox** (≈ 29490–29600): `ox_breath`, and `ox_low`
  pitched down for the buffalo.
- **The barrow on its side** (≈ 29670–29810): silent.
- **The 菜地's workers and pole carriers** (≈ 29530–30000): `pole_creak`. **`hoe_soil`** only if a worker is mapped
  hoeing.
- **惊马闯市:**
  - the runaway horse (≈ 30075–30240; its front half is lost): **`horse_gallop_earth`**, `horse_whinny`;
  - the chasers (≈ 30280–30700): `steps_earth_run`;
  - the old man calling the child away is a voice.
- **迎寒策蹇**, the travellers on donkeys (≈ 29980–30700, v 1270–1640): `hooves_donkey_walk`, `harness_jingle`, and
  `donkey_bray` rarely.
- **The tomb-sweeping party** (pin 6, ≈ 30830–31150):
  - the willow-decked sedan: `sedan_creak`;
  - the riders: `hooves_horse_walk` or `hooves_donkey_walk`;
  - the porters: `pole_creak`.
- **The shed on posts** (≈ 31230–31430), with a figure and a table or tub: low.
- **The farmhouses' people** (≈ 33500–35200): steps and voices. The threshing floor's roller (a prop) is silent.
- **The charcoal donkey train** (pin 1, ≈ 36280–36820; 5 donkeys, 2 drivers):
  - **`pannier_creak`** (2 voices at most) and `hooves_donkey_walk`;
  - `donkey_bray`, from the donkey with its head turned (≈ 36640–36690);
  - **`whip_crack`** only if a driver is painted with a whip.
- **The small bridge** (≈ 36200–36650): `steps_timber` for anyone on it, and **`stream_trickle`** below.
- **The possible small empty boat** (≈ 36170–36450): a low **`hull_water_slap`**, if t8 maps it on the water.
- **Trees:** the great willows (31000–33200) get `wind_gust`; the bare trees (33300–37500) get
  **`bed_bare_trees_wind`**.

**(c) Interaction**
- **Footsteps:**
  - `steps_grass`, and `steps_earth` on the field soil and paths;
  - **`step_mud`** and **`step_splash`** at the stream;
  - `steps_timber` on the small bridge.
- **Brushing:**
  - **`twig_brush`** in the bare saplings and shoots;
  - **`straw_reed_brush`** on the hut's wattle fence, the thatched eaves and haystacks;
  - `willow_brush` under the great willows.
- **Animals as you pass:**
  - the buffalo snorts (`ox_breath`);
  - the charcoal donkeys shy (`donkey_snort` and **`pannier_creak`**);
  - the stall's ox lows.

**(d) Voices:**
- the grooms shouting after the runaway horse, and the old man calling the child away;
- the drivers' calls to the donkeys (驾, 吁);
- the stall keepers and their customers;
- the tomb-sweeping party's talk;
- the travellers.

---

## Period and anachronisms, for these areas

On top of the standing list (no 唤头, 醒木, 唢呐 or gong-and-梆子 "小心火烛" rounds):
- **The iron cart bell** (`ox_cart_bell`): 东京梦华录 ties it to the big 太平车. The palm-covered family carts (S4b),
  the 串车 (S3) and the north-bank carts (S3, S2) get wheels and animals only, unless a bell is painted. Hence
  **`cart_two_wheel_earth`**.
- **鸣锣开道** gongs for the official riding out (S7) are a Ming–Qing image. Song retinues cried 喝道 (a voice; our
  reading).
- **虎撑/串铃**, the itinerant doctor's shaker, is out. 赵太丞 keeps a shop, and the instrument is documented late.
- **Boats:**
  - no anchor chains, iron capstans, ship's bells or horns. Ropes are hemp; anchors are on rope (S4b's anchor line);
  - no sail sounds: no set sail is mapped (S4b's big boat has its mast lowered). Add one only if a mapped boat
    carries a set sail.
- **寂静的谷场** is the quiet threshing floor. No flails or roller unless a mapped figure works.
- **The tomb-sweeping party** is coming home. No funeral music, no suona.
- **The 望火楼** is unmanned in 余辉's reading. No alarm gong or drum from it.
- **Season:** no cicadas and no summer cricket chorus. The birds are East Asian (tree sparrow, swallow, magpie).
- **Prompts** avoid "Chinese" and "ancient" in beds (they invite erhu and gongs). Every bed ends "No music, no speech,
  no engines."

## Voice needs, for the later provider (brief)

- **Attested call types:**
  - hawkers' sung cries, 吟叫 (事物纪原): the 饮子 seller, the stalls;
  - boatmen's and trackers' haul calls, 邪许 (淮南子) and 号子;
  - the sweep boatman's 欸乃 (柳宗元, Tang);
  - the retinue's 喝道.
- **Scene lines:**
  - S7: 门房指路, 问病;
  - S4b: the crowd at the seated man's goods, the tea house, the bank;
  - S3: 车轿相争, 上下呼救 both ways, the tavern;
  - S2: the trackers, the crews, the sack tally, the eating sheds;
  - S1: 惊马闯市's shouts, the drivers' 驾/吁, the party.
- **Wordless, done here as sound effects:** the trackers' breathing (**`tracker_strain`**) and the bridge crowd's
  alarm (**`crowd_alarm`**), in the manner of `core`'s `crowd_gasp`. Reject any take with words.
- **For the voice provider:** a small child's whimper (S7).

---

## Generation list (new units only)

For a spec `sounds/round2.json` (skill `sounds`; the set name the skill already gives). How to read the columns:
- **group** follows the skill. `structure` is a new group, for the bridge, the scaffold and the vane.
- **slice n** means the take holds n separate hits, cut into single hits that code varies.
- **P** is the priority: 1 = needed for the area to feel alive, 2 = good detail, 3 = nice to have.
- **Loops** are seamless (`loop: true`). Generate beds at influence 0.4 and one-shots at 0.3–0.5.

| id | group | P | s | loop | slice | purpose | ElevenLabs prompt |
|---|---|---|---|---|---|---|---|
| bed_river_flow | bed | 1 | 15 | yes | | The 汴河 under S4b's moorings, S3 and S2, day and night | A broad, slow river flowing past an earthen bank and moored wooden boats: a steady soft current, small gurgles and swirls along the hulls, water moving against the bank, open air with a light breeze. No music, no speech, no engines. |
| bed_wharf_day | bed | 1 | 15 | yes | | Worked banks by day: S2's east bank and terrace, S3's south bank, S4b's moorings (half level) | A busy riverside wharf by day, heard from the bank: footsteps on wooden planks, heavy sacks thudding down, hemp ropes creaking, wooden hulls knocking softly, water lapping, a low indistinct murmur of workers far off. No music, no speech, no engines. |
| bed_bridge_crowd | bed | 1 | 15 | yes | | The Rainbow Bridge's deck and feet by day | A crowd crossing a large arched timber bridge by day: many hollow footsteps on thick wooden planks, shuffling and bustle, a low indistinct murmur all around, an occasional hoof knock on the boards, a river rushing far below. No music, no speech, no engines. |
| bed_country_day | bed | 1 | 15 | yes | | S1 by day: fields, willows, farmhouses | Open farmland in early spring by day: a light breeze over bare fields and leafless trees, swallows twittering, tree sparrows by a farmhouse, a magpie chattering far off, wide quiet open air. No music, no speech, no engines. |
| hull_creak | boat | 1 | 3 | | | Every moored or working boat; pitched down for the deep-laden grain boats | A large old wooden boat hull creaking slowly as it shifts against its mooring, one long deep groan of timber, close, dry. |
| hull_water_slap | boat | 1 | 3 | | 4 | Water against hulls: moored, under way, S1's possible skiff | Four separate small river waves slapping against the side of a moored wooden boat hull, hollow wet knocks with short gaps, close, dry. |
| mooring_rope_creak | boat | 1 | 2 | | 2 | S4b's mooring post and anchor line, S2's post with the coiled rope, moored boats | A thick hemp mooring rope tightening twice around a wooden post under load, creaking and squeaking stretch, close, dry. |
| sweep_scull | boat | 1 | 3 | | | 摇橹向前 (S3), the boats under way in S2: one stroke, sequenced | One stroke of a long wooden stern sweep oar sculling a heavy river boat: the wooden pivot creaking, the blade swishing through the water, close, dry. |
| mast_lower | boat | 1 | 4 | | | 大船抢险 under the arch (S3), once per cycle | A tall wooden boat mast being lowered: heavy timber creaking and groaning as it tilts, ropes straining, then a dull heavy wooden thud on the deck, close, dry. |
| rope_haul | boat | 1 | 3 | | 2 | The big boat's crew (S3), mooring work, boats setting off | Two strong hand-over-hand pulls on a thick hemp rope, the rope rasping and squeaking under tension, close, dry. |
| horse_gallop_earth | animal | 1 | 4 | yes | | 惊马闯市's runaway horse (S1), while it runs | A loose horse galloping fast on packed earth, heavy drumming hooves, a snort, outdoors, close, dry. |
| wheelwright_mallet | trade | 1 | 3 | | 3 | 车铺劳作 (S4b.fig.wheelwright_bending_13620), on the strike frame | Three separate strikes of a wooden mallet on the hub of a wooden cart wheel, solid resonant knocks on hard timber, outdoors, close, dry. |
| bed_open_night | bed | 2 | 15 | yes | | Night outside the walls (S4b, S3, S2, S1), replacing the summer `bed_night` there | Open land by water on a cool early-spring night: still air, a faint breeze, a few frogs croaking far off, very sparse insects, wide and quiet, no summer cricket chorus. No music, no speech, no engines. |
| bed_bare_trees_wind | bed | 2 | 12 | yes | | Leafless elms and shoots: S1, S7's cut edge, S4b's and S3's bare trees | Wind through tall leafless trees in early spring: dry twigs ticking and clattering softly, branches creaking, an airy whoosh rising and falling, no leaves, outdoors. No music, no speech, no engines. |
| stream_trickle | water | 2 | 12 | yes | | S1's stream and the small bridge (point bed) | A small shallow stream trickling over pebbles and around wooden bridge posts in open country: gentle bubbling and babbling, soft and close, calm air. No music, no speech, no engines. |
| river_swift | water | 2 | 12 | yes | | The current at the Rainbow Bridge's abutments and under the arch; 汴水悍激 (S2 pin 7) | A strong river current rushing past timber bridge abutments and wooden piles: fast swirling water, eddies gurgling and sucking, a deep steady rush, outdoors, mid distance. No music, no speech, no engines. |
| hull_bump | boat | 2 | 2 | | 2 | S4b's rafted boats knocking together | Two moored wooden boat hulls bumping together twice, heavy dull wooden knocks with a short grinding rub, close, dry. |
| pole_push | boat | 2 | 3 | | | Fending off the arch (S3), S2's poling boats, boats setting off | A long bamboo punting pole plunged into a river and pushed hard against the bottom from a wooden boat: a splash, bamboo creaking under strain, water dripping, close, dry. |
| rope_throw | boat | 2 | 2 | | | 上下呼救: ropes thrown from the railings (S3) | A coiled hemp rope thrown through the air with a soft whoosh, then slapping down onto a wooden boat deck, close, dry. |
| tow_rope_strain | boat | 2 | 4 | | | The tow lines: S3's masted boat, S2's 逆水行舟 (at the trackers and at the mast) | A very long taut hemp tow rope under heavy strain outdoors, slow creaking and stretching groans, a light twang as it tightens, close, dry. |
| tracker_strain | boat | 2 | 4 | | | The trackers (S3.grp.trackers_16380; S2's five): wordless effort, reject takes with words | Several men leaning into a heavy tow rope together: deep rhythmic effort breaths and low wordless grunts, feet scraping on earth, outdoors, close, dry. |
| step_boat_deck | player | 2 | 3 | | 4 | The player or crew on a boat deck (if the pilot opens decks) | Four footsteps in cloth shoes on the plank deck of a floating wooden boat, hollow boomy knocks with a slight creak and faint water slosh under the hull, close, dry. |
| gangplank_flex | player | 2 | 2 | | 2 | S4b's plank to the mat-cargo boat, S2's gangplank, S3's unloading boats | Two footsteps on a long wooden gangplank between a boat and a bank, the board bending with a springy creak and a hollow knock, close, dry. |
| step_mud | player | 2 | 3 | | 4 | Wet bank mud at every shore (S4b, S3, S2) and S1's stream | Four footsteps in cloth shoes on wet, sticky river-bank mud, a soft squelch and suck as each foot pulls free, close, dry. |
| bridge_arch_creak | structure | 2 | 4 | | | The Rainbow Bridge under its crowd and under the player | A huge timber arch bridge under the weight of a crowd: massive wooden beams creaking and groaning deeply, low knocks in the joints, outdoors, close, dry. |
| hooves_timber | animal | 2 | 3 | | 4 | 车轿相争's horseman on the deck; any animal on a bridge | A horse stamping and shifting on a thick timber bridge deck, four hollow hoof knocks on wooden planks, close, dry. |
| crowd_alarm | trade | 2 | 3 | | | 上下呼救's peak on the bridge (S3), wordless; reject takes with words | A crowd on a bridge crying out in alarm together, a sudden rising wordless clamour of many voices, outdoors, close, dry, no intelligible words. |
| cart_two_wheel_earth | cart | 2 | 5 | yes | | Moving two-wheeled carts without a bell: S4b's palm cart 13455, S3's and S2's north-bank carts | A large two-wheeled wooden cart rolling slowly on a dirt road: big wooden wheels crunching grit, the wooden axle creaking and knocking with each turn, no bell, close, dry. |
| pannier_creak | animal | 2 | 5 | yes | | S1's charcoal donkeys, S3's loaded donkey (while walking) | A donkey walking with two heavy wicker panniers of charcoal on a wooden pack saddle: wicker and wood creaking with each step, lumps of charcoal shifting, close, dry. |
| mule_call | animal | 2 | 3 | | | S4b's pack mules, S2's mule cart (if a mule) | A mule calling once, a whinny that breaks into a hoarse bray, outdoors, close, dry. |
| whip_crack | cart | 2 | 1 | | | Only figures painted with a whip: S1's drivers, the carters | A short leather whip cracked once over a draft animal, a sharp snap, outdoors, close, dry. |
| bucket_slosh | trade | 2 | 2 | | | S7.fig.bucket_man_1872 at the well's west end | A full wooden water bucket lifted and set down, water sloshing and the bail handle creaking, close, dry. |
| bed_mist_edge | bed | 3 | 12 | yes | | The mist at S7's cut end, S1's start, S2 south of the water | Near silence in open air at the misty edge of a plain: a very soft distant wind, a faint airy hush, nothing else, still and empty. No music, no speech, no engines. |
| oar_stroke | boat | 3 | 2 | | | 逆水行舟's eight rowers, if river_m reads oars | Several wooden oars pulled together in one stroke on a river boat, shafts knocking in wooden tholes, blades dipping and splashing, close, dry. |
| sack_shoulder | trade | 3 | 2 | | | 私粮进京's porters (S2), S3's unloading | A porter heaving a heavy grain sack onto his shoulder: coarse hemp cloth rubbing, grain shifting and settling inside, close, dry. |
| railing_creak | structure | 3 | 2 | | | The bridge railings: leaners and the player | Someone leaning on an old wooden bridge railing: the rail creaks and its post knocks softly, close, dry. |
| scaffold_creak | structure | 3 | 3 | | | 十千脚店's 彩楼欢门 scaffold (S3), S2's roof scaffold, in gusts | Tall wooden poles lashed together with rope, creaking and knocking softly as a gust pushes them, outdoors, close, dry. |
| wind_vane_turn | structure | 3 | 2 | | | The bird vane on the 新酒 pole (S3), and the bridge's end posts if vaned | A small wooden wind vane swinging on a squeaky wooden pivot atop a tall pole in a gust, outdoors, close, dry. |
| paper_goods_rustle | trade | 3 | 2 | | | 王家纸马铺 (S2), only if a figure handles goods | Stiff paper goods and paper cutouts handled at a shop stall: crisp rustling and a light flutter, close, dry. |
| hoe_soil | trade | 3 | 3 | | 3 | S1's 菜地, only if a hoeing worker is mapped | Three strokes of an iron hoe into soft tilled garden soil, a dull chop and crumbling earth, outdoors, close, dry. |
| twig_brush | player | 3 | 2 | | | Walking into bare shoots and saplings (S1, S7, S3) | Clothes brushing through dry leafless twigs and bare shoots: light scratching and small snapping ticks, close, dry. |
| straw_reed_brush | player | 3 | 2 | | | Thatch, reed fences and mats, wattle, palm-cart fringes (S4b, S1) | A sleeve brushing along dry straw thatch, a reed mat screen and a woven wattle fence: dry rustle, rattle and scrape, close, dry. |
| wood_bump | player | 3 | 2 | | 2 | Bumping signboards (S7's boards), leaning poles and timber (S4b), the scaffold (S3) | Two separate bumps against a free-standing wooden signboard and a stack of leaning poles: hollow wooden knocks and a short rattle, close, dry. |
| jar_knock | player | 3 | 2 | | 3 | Bumping big jars and barrels (S4b's big jar, taverns) | A shoulder bumping a big glazed earthenware storage jar, three separate hollow ceramic thunks, close, dry. |
| step_splash | player | 3 | 3 | | 3 | Ankle-deep water at open shores and S1's stream | Three footsteps splashing through ankle-deep water at a muddy stream edge, close, dry. |

**Totals: 45 new units, 224 s for one take of each.**

| Priority | Units | Seconds |
|---|---|---|
| 1 | 12 | 85 |
| 2 | 20 | 100 |
| 3 | 13 | 39 |

- **Cost:** at the skill's ≈ 10 credits per second, one take of everything is ≈ 2,240 credits and three takes
  ≈ 6,700. P1 alone is ≈ 850 credits a take.
- **Order:** generate P1 first and audition, then P2. Generate the P3 units whose condition says "only if mapped" after
  the merges.

**Not regenerated, on purpose:**
- a deck footstep for the arched bridge (`steps_timber` with EQ);
- an adze (S4b's tool lies unused);
- a sedan set-down;
- a crow-sized take-off (`bird_takeoff` pitched down);
- a 饮子 ladle (`pour_wine`);
- tack (`harness_jingle`, `horse_snort_stamp`);
- separate night beds per river and countryside: they are composed from `bed_river_flow`, `stream_trickle`,
  `bed_open_night` and `frogs_pond`.
