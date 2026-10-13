# Life on the street: vignettes and sound sources, S4 · S5 · S6

Inventory for two new layers, plot lines (speech, thought and intent bubbles; small conversations) and sound, over the
built sections: S5 the gate (u 5600–9400), S6 the inner city (u 2000–5600), S4 part 1 the outer road (u 9400–12600).
Written 2026-10-12 from `map/text/S4–S6.md` (via `map/world/*.json`), the three `people.json`, `characters/notes.md`,
`characters.json` and the readings below. Nothing here is built.

**How to read it**
- **IDs**: figures by their `people.json` slug (map ID minus `S<n>.fig.`); others `ani.`, `prop.`, `veh.`, `grp.` (=
  `S<n>.ani.` …); full IDs across sections. A group ID stands for all its members (`map/world/<S>.json`).
- **Readings**: **YH14** 余辉's 2014 vignette list (`reference/scroll/sections.md` §1.2); **YH15** 余辉 十大看点 (人民网
  2015); **YH23** 余辉 《深度游》 "第六段" (澎湃 2023-06-17); **MHJ n** 名画记 annotation n (annoList API, read 2026-10-12);
  **DJ** 《东京梦华录》 (zh.wikisource: 卷三 天晓诸人入市, 防火; 卷五 京瓦伎艺, 娶妇); **SWK** 事物考; **SQ** 邵琦;
  **H** Hansen; **map** the map's own reading. URLs: `sections.md` §4.
- **Lines**: every 「…」 is *our proposal* (plain Song-flavoured vernacular, English gloss) unless tagged with a source.
- **Mode**: **loop** = plays whether or not the player is there; **near** = fires when the player comes close.
- **Bubbles** name only painted things. **Clips**: "fit" = in `people.json` now and right; "missing" = needed (checked
  against `clips_why` and `characters.json`).

---

## S5 城门 · the gate

### Vignettes

**V5.1 货到税讫, the tax-office quarrel** · `grp.tax_quarrel` + `tower_watchman`, `tower_balcony_man_6600` · loop+near
- *Figures*: tax_official (seated, about to write), tax_declarer (inside), tax_clerk_seated_6340, tax_inspector
  (manifest at his chest), tax_carter_manifest, tax_carter_gaping_6300 (over the bale, mouth open), carter_6418,
  hidden_man_6452; prop.frame_scale_5930, bale_box_6203, bale_netted_6262/_6300.
- *Beat*: YH23/YH15: carters bring textile bales; one declares inside; the inspector points at the bales and names a
  big sum; the second carter hands over manifest and brush; the third gapes 「啊——？这么多！」 (YH23's words); the row
  makes the watchman (更夫) look down. MHJ 35 (hedged): the paper is an 引子 (permit; without one the rate is heavy);
  owner and official argue, "连城楼上值班的人也探出头来张望". H: a plain tax payment. Disputed: quarrel or routine;
  the tower man a watchman (YH, MHJ, Tian) or sightseer (H, Columbia). The balcony man also looks toward the office.
- *Lines*: inspector 「匹帛税重，照例该纳这个数。」 ("Silk pays heavy; by the rule, this much."); manifest carter
  「官人看货单，一包一包都写着。」 ("Every bale's on the manifest, sir."); gaper 「去年哪有这个数！」 ("Never this much last
  year!"); official 「引子拿来。没有引子，照重税算。」 ("Your permit. Without one, the heavy rate.") (after MHJ);
  watchman (thought) 「底下吵甚么？」 ("What's the row down there?"); near, inspector 「你的货也在这里？」 ("Yours too?").
- *Bubbles*: cash + frame scale, manifest, "!?", brush, eye. *Clips* fit: write, sit_talk, point, argue, hand_over,
  look. Missing: a gape leaning on the bale (he plays idle; library gape 333 was cut), `look_down` (watchman).

**V5.2 禁军运酒, archers readying in the wine depot** · `grp.wine_depot_archers` + `S6.fig.archer_waistguard_5465` · loop
- *Figures*: archer_drawing_bow_5635, archer_wrist_5728, S6 archer_waistguard_5465; prop.casks_5665, casks_west_5525.
- *Beat*: YH23/YH15: the fire post (军巡铺屋; DJ 卷三: one per 300 paces, five men on night watch) now holds eight
  casks; three archers sent to escort the troops' holiday wine test their gear, the drawer "probably just had a drink";
  the cart is coming. MHJ 37: three men preparing to set off. H/Columbia: an archery shop, not soldiers. Disputed.
- *Lines*: drawer 「好弓，拉得满！」 ("Good bow, draws full!"); archer_wrist 「车子怎地还不来？」 ("Where's the cart?");
  archer_waistguard 「押了这趟酒，节下也分几碗。」 ("Escort this, a few bowls for the holiday.").
- *Bubbles*: bow, cask. *Clips* fit: draw_bow (+bow), bind. *Link*: YH23's wagons (V6.7) come for these casks.

**V5.3 The second taxpayers: pack train and sack cart** · `grp.pack_train` + `S6.grp.sack_cart_5410` · loop
- *Figures*: pack_handler_5837, man_with_bag_5892 (a pouch), cart_pusher_5727, ani.donkey_pack_5660; S6's carters
  (bearded_carter_5428, tall_carter_5385, walking_carter_5537, donkey_leader_5088) and five donkeys.
- *Beat*: YH23: more taxpayers, the leader holding a manifest; the load looks like grain for the brewing 正店 next door.
  MHJ 37: "在孙羊店的门前，有辆驴车在装卸货物" (the sack cart, loading or unloading at the door).
- *Lines*: man_with_bag 「税钱都在这里，点清了再走。」 ("Tax money's here; count it, then go."); cart_pusher
  「再推一把，正店就在前头。」 ("One more push, the wine house is ahead."). *Clips* fit: push; missing `tie_pack`.

**V5.4 驼队出城, the camel caravan leaving** · `grp.camel_caravan` + camel_watcher_7600, roof_watcher_5712 · loop
- *Figures*: camel_driver, caravan_leader_7388, ani.camel_6060, camel_6335, camel_lead_7492.
- *Beat*: MHJ 34: walking out, the first camel half out, the last still inside; traders from the northwest. YH15,
  荣新江: a foreign (胡人) leader. Texts that have it entering contradict the painting.
- *Lines*: driver 「慢些，门洞窄。」 ("Easy, the passage is narrow."); camel_watcher 「胡商又出城了。」 ("The foreign
  traders are off again."). *Clips* fit: idle, look; missing camel walking (animal paths come later).

**V5.5 城下修面, the barber at the wall foot** · `grp.barber_7700` · loop+near
- *Figures*: barber_7805, wall_recliner. *Beat*: SWK: an old goateed barber holds the chin and shaves, little finger
  raised; the customer's eyes half shut; an awning on a pole lashed to a stool, a hair knot hung as the sign. Map:
  "probable"; no razor legible, awning and sign not visible. SQ: men resting against the wall.
- *Lines*: barber 「抬头，莫动，这刀快。」 ("Chin up, don't move, the razor's sharp."); customer (thought) 「舒坦……」
  ("Bliss…"); near 「客官，修个面？」 ("Shave, sir?").
- *Bubbles*: razor (decide: not legible here). *Clips*: plays sit_floor / lean_wall; missing `shave`,
  `recline_head_back`, a razor prop.

**V5.6 The idlers by the gate** · `grp.wall_idlers` (7) + tree_leaner_7952 · loop+near
- *Beat*: SQ: men resting by the wall; map: a knot chatting and watching the camel and the road; YH15 撤防: nobody
  guards the gate, these men stand where guards should.
- *Lines*: 「这城门也没个看守的。」 ("Not even a guard on this gate."); 「那戴帷帽的，是谁家的？」 ("Whose is the one in the
  veiled hat?"); near 「哪里来的？」 ("Where are you from?"). *Clips* fit: chat, talk, lean_wall.

**V5.7 杀羊祭道 or 跪乞, the kneeling man** · `grp.roadside_rite_7900` · loop
- *Beat*, disputed: A) YH14 杀羊祭道 / YH 2021 祭拜路神: a sheep offered to the road god; B) encyclopedic text: an old
  beggar kneels as a gentleman rides by. The map can't read prop.ground_object_7952. Choose before modelling it.
- *Lines*: A 「路神在上，保佑一路平安。」 ("God of the road, keep travellers safe."); B 「官人行行好，赏口饭吃。」 ("Kind
  sir, spare something to eat."). *Clips*: wall_squatter plays sit_floor; missing `kneel_reach`.

**V5.8 The veiled-hat rider and servants** · `grp.rider_party_8080` · loop
- rider_8080 on ani.donkey_8121, groom_8167, luggage_servant_8002. sections.md: a man in a broad hat; H: "a woman in a
  veiled hat on a donkey" (disputed). Groom 「坐稳了，前头过桥。」 ("Hold on, bridge ahead."); servant
  「行李都在，一件不少。」 ("All the luggage is here."). Fit: ride, bridle, carry_pole; missing the donkey's walk.

**V5.9 书屏遭废, the screen cart going out** · `grp.screen_cart_8510` · loop+near
- *Figures*: veh.cart_screen_8510, cart_pusher_8254, cart_shaftman_8498, trace_donkey_rider_8740 on
  ani.trace_donkey_8814, bending_man_8905.
- *Beat*: YH15: a banned 元祐 faction's cursive screen used as a tarp over its other writings, carted out of town to be
  destroyed (the 崇宁 burnings); its twin is at 十千脚店 (S3). wenxueart: two men and a donkey; H: a tarpaulined barrow.
- *Lines*: pusher 「使劲！上桥了！」 ("Heave! Onto the bridge!"); shaftman 「慢！轮子卡住了。」 ("Hold it, wheel's stuck.");
  pusher (thought, after YH) 「这一屏好字，可惜了。」 ("Fine writing, a pity."); near 「让让，车重！」 ("Make way, heavy!").
- *Clips* fit: push, ride; give bending_man_8905 the carter's `bridle`. Missing: cart motion.

**V5.10 桥头观水, the fish-watchers** · `grp.near_rail_watchers` (5) + `grp.far_rail_sightseers` (6) · loop+near
- *Beat*: SQ: many at the railings watching fish; YH15: Qingming crowds came to watch spring water and fish; H: "a
  tableau of different social groups". Map: rail_watcher_4 holds a small object over the water.
- *Lines*: 「看，那尾鲤鱼又上来了。」 ("Look, that carp's up again."); 「春水涨了。」 ("Spring water's up."); rail_watcher_4,
  if feeding (our guess), 「撒些饼屑，鱼都来了。」 ("Toss crumbs, they all come."); near 「这边看得清。」 ("Better view
  here."). *Bubbles*: a fish. *Clips* fit: lean_chin; missing `toss` (if feeding).

**V5.11 少年乞丐, the beggar boys** · `grp.beggar_boys` · loop+near
- *Figures*: beggar_boy_9138, _9205; givers far_rail_reaching_9010 (arm out to the boys), far_rail_turned_9100
  (turned down to boy 1); ignorers far_rail_long_robe_9200, far_rail_white_bent_9255 (who gives is our reading).
- *Beat*: MHJ 32: two beggar boys hold out their hands; two sightseers pretend not to hear, two give one cash so the
  boys won't spoil the view.
- *Lines*: boys 「官人，赏一文罢！」 ("Sir, spare a cash!"); givers 「拿去，快走罢。」 ("Here, now be off."); ignorers
  (thought) 「只当没听见。」 ("Pretend you didn't hear."); near, boy 1 to the player 「这位客官，赏一文！」.
- *Bubbles*: a square-holed coin; "…". *Clips* fit: reach; missing `give_coin` (sightseer/idler lack hand_over).

**V5.12 Smaller exchanges** (map only)
- `grp.greeting_8265`: 「多日不见，一向可好？」 / 「承蒙挂念，都好。」 ("Keeping well?" / "Kind of you; all well."). Give
  greeter_bowing_8285 the townsman's `bow`.
- `grp.awning_talkers_6200`: man_brown_awning_6245 (mouth open) at man_white_awning_6165, shop_seated_6290 watching:
  「这个价再公道不过！」 / 「再让些，不然不要。」 ("As fair as it gets!" / "Come down, or no deal."). Missing townsman `argue`.
- `grp.old_rider_party`: pole_servant_9318 turned back, mouth open, to old_rider_9168: 「老爷，过了桥就是大路。」 /
  「不急，慢慢走。」 ("Past the bridge it's the high road." / "No hurry."). Missing `call_back` while carrying.
- `grp.stick_pair_9035`: 「当心，人多。」 ("Careful, it's crowded."), weak. `grp.pair_by_board_6010`: unread, no lines.

### Solo figures
- **Porters** (pole_carrier_5840, porter_7786, porter_back_8050, bridge_porter, porter_bundle_9011,
  top_servant_pole_9000, top_porter_backbox_8911): load icons; bridge_porter, heading in, 「赶早进城，卖个好价。」 ("Into
  town early for a good price."); any 「这担子越挑越重。」 ("Heavier every step.").
- **Witnesses** (heads turn to the loudest nearby beat, no lines): roof_watcher_5712 (thought 「好高的骆驼。」 "What tall
  camels."), roof_man_white_6290, bridgehead_watcher_9172, shop_seated_6290, seated_corner_5953, hat_pole_man_5940.
- **Background, no bubbles**: top_rider_8958, distant_figure_6715/_6729, far_figure_8205, small_figure_8310.

### Sound
**(a) Zones** (stations on `S5.road.main`)
- **Inner street** (−40 to −12): the quarrel peaking each cycle, pack train, camel grumble, a bowstring; dusk and
  night a thin murmur, with the 正店's evening noise from S6.
- **Gate passage** (−11.5 to 0): brick vault: steps, hooves and camel pads echo; outside sounds muffled.
- **Terrace and tower** (H 10–14 m): the street heard from above; the drum.
- **Outside the gate** (0 to +12.7): idlers' chatter, the barber, the screen cart's wheel and grunts, creaking poles.
- **Moat bridge** (+12.7 to +25.1): hollow timber deck under feet and hooves (`str.moat_bridge`), faint lapping at the
  trestles (keep low: the water is blank silk, no ripples), murmurs, the beggar boys; at night only water and deck.

**(b) Point emitters**
- **Drum** `prop.tower_drum_6898`: faint on our scan, but MHJ 33 "楼内明显可见一个鼓架，上面装置了一个大鼓", YH14
  城上暮鼓: the dusk drum. Night watches on it (Tian's time-keeper) would be our extension: decide.
- **Animals**: donkeys ×6 (old_rider_donkey_9228, donkey_head_down_9062, top_rider_donkey_8940, trace_donkey_8814,
  donkey_8121, donkey_pack_5660); Bactrian camels ×3 (camel_6060, _6335, camel_lead_7492; no bells painted); three
  unclear small animals played as pigs (black_animal_7495, small_animal_6390, animal_lying_6320), only if kept.
- **Carts**: `veh.cart_screen_8510` (one wheel, louder on the deck); the rear of `veh.covered_ox_cart_9800`.
- **Trades and loads**: barber's razor (close range), bowstring, brush (and the frame scale if a weighing is staged),
  porters' poles ×8 (bamboo creak).
- **Water**: `water.moat_south_8700` at `str.bridge_trestle_w`/`_e`; `water.moat_north_8950` still.
- **Painted open mouths**: tax_carter_gaping_6300, man_brown_awning_6245, pole_servant_9318.
- **Trees** ×37 (≈ 10 willows): rustle with the wind bed.

**(c) Bed** (nothing painted): wind, birds, frogs and insects, distant crowd, dogs; DJ 卷三's dawn carts and donkeys
entering by the gates ("从城外守门入城货卖，至天明不绝"), attested, not painted.

**Counts S5**: 11 vignettes + 5 small exchanges; ≈ 40 speaking figures; ≈ 30 point emitters (drum, 12 animals,
2 carts, 8 poles, 2 waters, 3 painted voices, 3 trades) + 37 trees.

---

## S4 城门口外 · the outer road, part 1

### Vignettes

**V4.1 懒兵候主, the idle soldiers at the courier post** · `grp.courier_post_soldiers` + ani.white_horse_lying_11840 · loop+near
- *Figures*: soldier_lying_11430, soldier_hugging_knees_11488, soldier_behind_box_11580 (looks straight out at the
  viewer), soldier_on_stool_11630, soldier_knee_up_11792, soldier_slumped_11885, soldier_asleep_on_box_12022;
  prop.document_box_11581/_12041, four spears, a furled banner, prop.saddle_on_stand_11760.
- *Beat*: YH15: nine soldiers sit and lie by two document boxes, a courier detail kept waiting till worn out; a well-fed
  white horse lies in the yard, a groom with the reins waiting for its master; they should have left at dawn, it's
  nearly noon and the official still hasn't come out. MHJ 29: weapons, banners, umbrellas against the wall,
  "一个个都显得十分疲乏"; a 递铺 set outside the gate for couriers when the gate shuts at night. H: dozing guards of a
  barracks or yamen, "probably a jail". Function disputed.
- *Lines*: soldier_on_stool 「差官还不出来，日头都快晌午了。」 ("Still no official, and it's nearly noon.");
  soldier_knee_up 「等罢，急也没用。」 ("Just wait."); near, soldier_behind_box to the player 「看甚么？公文还没下来。」
  ("What are you staring at? The papers aren't out yet."). Sleepers snore.
- *Bubbles*: Zzz ×3, a noon sun (or the sundial glyph), the document box. *Clips* fit: sleep_side, doze_knees,
  squat_sleeves, sit, sit_one_knee, kneel_sleep; missing `wake_glance`.
- *Map check*: YH15's nine soldiers and groom vs our seven and none (the map keeps "a man asleep under a straw rain
  cape" as another reading of saddle_on_stand_11760). Check the strokes before adding anyone.

**V4.2 临街神算, the fortune-teller** · `grp.fortune_teller_stall` · loop+near
- *Figures*: fortune_teller_12232, client_seated_12185, onlooker_cap_12040, onlooker_hat_12084, onlooker_back_12089,
  onlooker_gesturing_12112 (arm up at the signs), onlooker_east_12368, figure_in_shed_back_12382; signs 決□/看命/神課.
- *Beat*: MHJ 28: divination was a huge trade (王安石: perhaps ten thousand at it), and a diviner boasted
  "士大夫的命运，在我可否之间", perhaps why this one sits by an official's hall (`bld.official_hall_12530`). YH14 临街神算.
- *Lines*: teller 「看你这气色，今年必有一番进益。」 ("By your colour, you'll get ahead this year."); client
  「先生，我这趟买卖做得成么？」 ("Will my deal come off?"); onlooker_gesturing 「神课，灵得很。」 ("'Divine lessons'; he's
  good."); near, from the painted signs, 「客官，看命？决疑？」 ("Read your fate? Settle a doubt?"); teller (thought,
  MHJ's diviner) 「士大夫的命运，在我可否之间。」.
- *Bubbles*: the 看命 sign. *Clips* fit: tell_fortune, listen, crane, hail.

**V4.3 牛拉大盖车, ox carts meet a rider** · `grp.cart_9800_team` + `grp.covered_ox_cart_10550` + `grp.rider_party_10205` · loop+near
- *Figures*: cart 1 (`S5.veh.covered_ox_cart_9800`): ox_driver_seated_9815, ox_walker_9902, ox_leader_10050,
  striding_man_10148, three oxen; cart 2 (`veh.covered_ox_cart_10550`): ox_driver_10635, carter_whip_10380 (mouth
  open), carter_front_10525, man_cart_tail_10405, ox_leader_11017, two oxen; rider_fan_10285 on ani.horse_rider_10205,
  groom_rider_10255.
- *Beat*: MHJ 31: two three-ox covered carts (the map paints three oxen and two) go fast, probably a rich family's;
  at the corner a horseman comes straight at them, "情景甚为紧张". (MHJ 27 calls part 2's palm carts family carriages,
  after DJ.)
- *Lines*: carter_whip 「让开！牛车来了！」 ("Out of the way, ox cart!"); groom_rider 「官人勒住，靠边！」 ("Rein in, sir!");
  rider (thought, behind the fan) 「好大的车。」 ("What a cart."); striding_man 「吁——」; near 「后生，让一让！」 ("Step
  aside, young man!"). *Clips* fit: drive_cart, stand_whip, push_flank, hold_rope, bridle, ride_fan; missing ox walks.

**V4.4 Two sedans lifted for the city** · `grp.sedan_chairs_10623` · loop
- bearer_bending_10440 (at the pole ends), man_long_robe_10605 (hand on the pole), bearer_straining_10728 (mouth open),
  man_behind_bearer_10755, bearer_east_10982; map only (YH14's 豪车云集 is part 2). 「起——！」 ("Up!"); 「嘿——稳住！」
  ("Steady!"); man_long_robe 「慢起，莫颠着里头。」 ("Gently; don't jolt the one inside."). Fit: sedan_carry; missing
  `lift_pole` for the bearer (the porter has it). No passenger is painted, so none shows.

**V4.5 The basket stall** · `grp.basket_stall_10000` · loop+near
- basket_leaner_10078, bearded_man_10142, waving_man_10155 (arm high), parasol_man_9875, dark_robed_man_9885 with
  child_by_basket_9915, crouching_man_10135; prop.big_basket_10000 (straw, hemp or brushwood). Map only. waving_man
  「这边！还有一筐！」 ("Over here, another basket!"); basket_leaner 「这一筐怎么卖？」 ("How much for this one?");
  bearded_man 「干不干？莫是湿的。」 ("Dry? Not damp?"); child 「那挂着的是甚么？」 ("What are those hanging things?").
  Fit: browse, hail, look.

**V4.6 The mat-awning stall** · `grp.awning_stall_9480` · near
- awning_stall_man_arm_raised_9625 (mouth open, reaching for prop.round_goods_stack_9790), awning_stall_man_9495; map
  only: 「新到的，要几个？」 ("Fresh in, how many?"). Fit: hail, chat.

**V4.7 Smaller groups** (map only)
- `grp.porters_11100`: youth_bending_11138 about to lift prop.tied_bundle_11205: 「搭把手。」 / 「一、二——起！」 ("Give us a
  hand." / "One, two, up!"). Fit: lift_pole, carry_pole.
- `grp.bottom_talkers_9890` (a child between two men): 「这孩子又长高了。」 / 「快叫人。」 ("He's grown." / "Say hello.");
  the kinship is ours.
- `grp.person_with_child_10430` (woman holding a child, facing porter_baskets_10347): 「乖，莫闹。」 ("There, be good.").
- `grp.horse_and_groom_10372`: groom_10420 (thought) 「这马乏了。」 ("Worn out, this horse."). `grp.shop_front_10425`,
  near: 「客官进来看看。」 ("Come in and look.").
- `grp.pack_donkeys_10487` (charcoal panniers; possible drover_10578) and `grp.pig_herd_10236` (four pigs, no herder
  painted): sound only. DJ 卷三 has pigs driven to market "动即百数".

### Solo figures
- **Temple**: monk_side_door_10208. MHJ 30: the main gate is shut, its 天王 statues (prop.guardian_statue_9942, _10102)
  plain to see; a monk in a 袈裟 goes in by the side door. Thought 「阿弥陀佛。」; icon the side door.
- **Resting**: man_seated_by_tree_12512, seated_man_bottom_9680: 「歇一歇脚。」 ("Rest the feet a bit.").
- **Icons only**: doorway_figure_11738 (ties a cloth over the hair), child_at_table_12597, walkers
  porter_baskets_10347, porter_two_bundles_11085, walker_in_willows_9712. **No bubbles**: the three
  man_behind_roof_*, figure_under_eave_11382, far_figure_9563.

### Sound
**(a) Zones** (stations on `S4.road.main`)
- **Bridgehead market** (+26 to +35, N): stall talk, hailing, the basket crowd, cart creak, oxen; silent stalls at night.
- **The road of carts and sedans** (+30 to +46): two-wheeled creak and rumble, shouts, whip cracks, bearers' calls.
- **Side ground and temple approach** (+30 to +43, N 10–25): pigs rooting, pannier creak; the temple quiet but its side
  door. Dawn: DJ 卷三 "每日交五更，诸寺院行者打铁牌子或木鱼循门报晓": attested for temples, nobody painted doing it: bed.
- **Courier post** (+46 to +56, N 7–17): snores, a cough, the white horse's snort; the quietest street zone, YH's
  deliberate contrast.
- **Eating house** (+50 to +58, S): tables painted, one half-hidden figure; a low clatter at most.
- **Fortune-teller and the big willow** (+57 to +64): his voice, the onlookers, the crow, the willow's whips.
- **No water in part 1**: the ditch `grd.ditch_11570` has none drawn; the river is part 2.

**(b) Point emitters**
- **Animals**: oxen ×5 (ox_shaft_9972, ox_far_10045, ox_lead_10235, ox_shaft_10712, ox_lead_10872); horses ×3
  (horse_rider_10205, horse_dark_10372, white_horse_lying_11840: breath only); donkeys ×4 (donkey_10190,
  pack_donkey_10487/_10571/_10632: bray, pannier creak); pigs ×4 (pig_10185, _10236, _10262, pig_dark_10282);
  `ani.bird_12433`, a crow: an occasional caw.
- **Vehicles**: veh.covered_ox_cart_10550 (and cart 9800 via its team); sedans veh.sedan_chair_10623/_10810.
- **People**: carter_whip_10380 (crack, shout), bearer_straining_10728 (grunt), awning_stall_man_arm_raised_9625
  (call): all painted open-mouthed; fortune_teller_12232; three snorers; poles ×3.
- **Doors**: `bld.temple_side_door_10210`, the courier gate's open leaf (`bld.post_gatehouse_11730`). **Trees** ×23.

**(c) Bed**: wind, birds bar the crow, insects, the river (part 2), the city heard from the gate, the temple's dawn call.

**Counts S4**: 6 vignettes + 6 small groups; ≈ 30 speaking figures; ≈ 30 point emitters (17 animals, 3 vehicles, 7 people, 3
poles, 2 doors) + 23 trees.

---

## S6 城内 · the inner city

### Vignettes

**V6.1 Two matchmakers arrive at 孙羊正店** · `grp.sedan_4575` + `grp.sedan_4965` · loop
- *Figures*: sedan_passenger_4362 (a woman at the window) in veh.sedan_4575 with sedan_bearer_far_4462, _near_4530,
  sedan_rear_bearer_4195, sedan_attendant_4590, _4255; veh.sedan_4965 and its four bearers.
- *Beat*: YH23: a girl seldom went out but a matchmaker could; the woman in a silk-flower 冠子 and the one in the front
  sedan are matchmakers, meeting at the 正店 to settle a match between well-off families. DJ 卷五 娶妇: middle-rank
  matchmakers wear a 冠子, "皆两人同行" ("always go in pairs").
- *Lines*: passenger 「到了么？男家的人可来了？」 ("Are we there? Has the groom's side come?"); (thought)
  「这门亲事，今日定要说成。」 ("This match gets settled today."); bearer 「落轿——」 ("Setting down!").
- *Bubbles*: the flower crown. *Clips* fit: sedan_carry, sit; missing `set_down`.

**V6.2 At the 正店 door: flower sprigs, a family, greens** · `grp.big_basket_4543` + `grp.child_on_shoulders_4975` + `grp.east_basket_4993` · loop+near
- *Figures*: basket_man_4590 (mouth open), old_man_tall_hat_4666, seated_man_stool_4441, boy_from_behind_4630,
  young_man_white_robe_4705, man_black_hat_4742, man_child_on_shoulders_4975 + child, youth_hair_bun_stick_4950.
- *Beat*: YH23: flower seedlings for sale; a woman of means asks the price, her maid holding an infant, a man with a
  child on his neck behind, "像是一家人"; beside them a 女伎 in red, in a man's 幞头, a hand on a man's shoulder at
  another greens seller's basket. MHJ 37: peddlers solicit at the door. Map: the asker is an old man in a tall hat; no
  maid; the bun figure "a youth or a young woman". Disputed: choose whose reading we stage.
- *Lines*: basket_man 「好花苗，栽下去开春就开。」 ("Good seedlings: plant them, they bloom this spring.") / 「三枝十文，
  不二价。」 ("Three for ten, fixed price."); asker 「几文一枝？」 ("How much a sprig?"); child on the shoulders
  「要那枝花！」 ("I want that flower!"); east basket 「新鲜菜蔬——」 ("Fresh greens!").
- *Bubbles*: a sprig, cash. *Clips* fit: talk, carry_child; missing townsman `argue` (clips_why: basket_man_4590).

**V6.3 The zongzi and sugarcane stall** · `grp.parasol_stall_4300` · near
- YH23: 粽子 and fruit, 馓子 hanging under the parasol (`prop.net_bag_4286`), sugarcane in a tub
  (`prop.sticks_in_tub_4325`; southern cane kept over winter, shipped up the canal). MHJ 37: snack sellers serve
  customers at the door. No seller painted (the map suggests seated_man_stool_4441). With a keeper:
  「粽子、馓子、甘蔗——」 ("Zongzi, fried twists, cane!"); else an icon.

**V6.4 Drinking upstairs at the 正店** · `grp.upper_table_5500` + drinker_upper_5140, upper_storey_figure_4810, doorman_5015 · loop
- YH23: pairs drinking upstairs; the lamp-boxes 香醪/孙记/正店 lit with candles at night, the red 栀子灯 a hint of women
  for hire (MHJ 38). MHJ 36: a full house. DJ 卷三: taverns lit before dawn. Drinker 「满饮此杯！」 ("Drain your cup!");
  standing man 「这香醪果然好。」 ("This 香醪 lives up to its name.") (the lamp-box's word); near, doorman 「客官楼上请。」
  ("Upstairs, sir."). Icon: the ewer (`prop.ewer_upper_5507`). Fit: drink, sit, talk. Louder after dark.

**V6.5 闹市说书, the storyteller** · `grp.storyteller_ring` (storyteller_3822 + 17 listeners) + child_ring_edge_3577 · loop+near
- *Beat*: YH23: a curly-bearded (虬髯) teller, 17–18 listeners rapt, monks, Taoists, scholars, women and children among
  them; the scroll's only public show. MHJ 39: 杂剧, 唱曲, 讲史, 小说. DJ 卷五 京瓦伎艺: 讲史 and 小说 tellers,
  "霍四究，说《三分》。尹常卖，《五代史》".
- *Lines*: teller 「列位看官，今日接着说三分——」 ("Gentlemen, on with the Three Kingdoms…"), closing 「明日再说。」
  ("More tomorrow."); ring 「好！」 ("Bravo!"); child_listener_3812 「后来呢？」 ("And then?").
- *Mode*: a minute's telling, a pause, a cheer, looped; near: a back-row listener shifts to let the player in.
  *Clips* fit: tell, crane, listen; missing `point` (teller), a cheer, `listen` for several (clips_why).
  *Map check*: YH23's monks, Taoists and women aren't typed among our listeners.

**V6.6 孙羊店, the meat counter** · `grp.butcher_shop` · loop+near
- *Beat*, the meat is disputed: YH23: the 孙羊店's mutton branch; lungs, intestines, liver and tripe hang under a price
  board "□斤六十足" (60 full cash a jin of offal, early 崇宁 prices). Map: a side of pork. MHJ 40: a hired hand wields
  the knife, a fat owner sits on a bench at the door ("镇关西"), whom our map lacks: check.
- *Lines*: butcher_3920 「羊肺羊肚，六十足一斤！」 ("Lungs and tripe, sixty full cash a jin!") (YH's reading of the painted
  price); near 「客官要几斤？」 ("How many jin, sir?"). *Bubbles*: cleaver, price board. *Clips* fit: chop (+cleaver).

**V6.7 The four-mule wagons take the corner** · `grp.taiping_wagon_3600` + `grp.wagon2_team_3400` (+ basket_porter_3370) · loop+near
- *Figures*: wagon_shaft_carter_3642 (shouting), wagon_top_rider_3740, wagon_side_man_3796, upper_team_driver_3450,
  eight mules (mule_lower_1_3427 painted braying), veh.taiping_wagon_3600, veh.hidden_wagon_3400.
- *Beat*: YH23: two 禁军 transport wagons race in, the step at the left rear showing the Song kept left; no slowing at
  the corner; a porter drops his load and jumps aside; they're off to fetch the wine casks (V5.2),
  "馋酒已经馋得不顾一切了". sections.md is neutral. The jumping porter is our guess (painted walking).
- *Lines*: shaft carter 「闪开！闪开！」 ("Clear the way!"); top rider 「当心那挑担的！」 ("Mind the porter!"); porter
  「哎哟，慢些！」 ("Whoa, slow down!"); near 「站开些！」 ("Stand back!"). *Clips* fit: steer, drive_team; missing
  `steer_wagon`, wagon motion, mule walks, a `dodge`.

**V6.8 The wine cart** · `grp.wine_cart_3090` · loop
- wine_cart_driver_2945, young_man_cart_rear_2675, two donkeys. YH23: an old carter drives two wine casks east; most
  carts in the scroll serve Qingming drinking. Driver 「驾！走稳些。」 ("Go on, steady."); young man 「桶晃了，慢些！」
  ("The casks are rocking!"). Fit: drive_cart (+whip), push_flank.

**V6.9 便面, the fan that hides a face** · `grp.fan_traveller_3225` (+ fan_man_3972) · near
- *Beat*: MHJ 43: meeting someone you'd rather not greet, you screened your face with a fan, and that was polite. YH23:
  a white-robed official with a cloth-wrapped fan; a shabby scholar with his book boy, coming the other way, hides
  behind his fan as the official turns to greet (or mock) him. Which figure is the official is open (fan_man_3972
  holds a fan too; rider_3375 rides in a pale robe).
- *Lines*: fan_man_3225 (thought) 「莫叫他认出我。」 ("Don't let him know me."); servant_boy_bundle_3270 「相公，那边
  是……」 ("Sir, over there…"). *Mode*: the player is the acquaintance: within ~4 m the fan goes up and the face turns;
  it drops when the player leaves. *Clips* fit: fan_walk (+fan_round); missing a quick `fan_raise`.

**V6.10 Exam candidates: the street, the 解 sign, upstairs** · `grp.exam_scholars_3240` + `grp.jie_ring` (12 figures) + `grp.scholar_studying` · loop
- *Beat*: MHJ 44: exam years filled the capital with candidates; MHJ 42: the inn's guest with calligraphy and writing
  things may be one (YH 士子苦读). The 解 ring is disputed: MHJ 45, an office for candidates' formalities, young
  scholars round an old man asking for news; YH14 考前求解, an old fortune-teller consulted; Hong Kong teaching
  material, a pawnshop.
- *Lines*: scholar_front_3240 「今科听说要考策论。」 ("Policy essays this year, they say."); scholar_back_3203
  「但愿一举登科。」 ("May we pass first time."); young_man_case_3340 「相公，书箱在此。」 ("Your book box, sir."); the ring
  「老先生，此番可有指望？」 ("Any hope this time?"); jie_old_man_2138 「文章好，自然中。」 ("Write well and you'll pass.");
  the two smiling (jie_young_seated_2100, jie_smiling_capped_2160) 「借你吉言！」 ("From your lips!");
  scholar_upstairs_3912 (thought) 「这一篇还背不熟……」 ("Still can't recite this one…").
- *Bubbles*: book box, the 解 sign, a lamp (prop.desk_things_4013). *Clips* fit: talk, hand_over, sit, knees_up,
  write; missing `sit_talk` (clips_why), `read` (the notes record a read_window take; characters.json lacks it).

**V6.11 The square well** · `grp.square_well_drawers` · loop
- *Beat*, details disputed: MHJ 47: one holds the rope and tips the bucket in, one swings the rope, both with poles
  hung in the willow's fork; the third just arrived, setting his bucket down; a shallow well, the 田 frame lets four
  draw. YH23: an official well in a rich quarter, framed so nobody falls in; two draw, a carrier shoulders his load to
  go: the map's well_bucket_lifter_2032 fits him.
- *Lines*: well_rope_drawer_2097 「你先打，我等着。」 ("You first; I'll wait."); well_bucket_hauler_2196 「这井水甜。」
  ("Sweet water."); lifter 「走了，家里等水做饭。」 ("Off; they need it for the rice."). *Clips*: give the lifter the
  idler's existing `bucket_shoulder` (+bucket); draw_water is weak. *Map check*: MHJ's poles in the willow.

**V6.12 Paper horses for the graves** · `grp.paper_stall` + `grp.stall_talkers` · near
- YH23: paper horses for Qingming under umbrellas (YH14 列售纸码), burnt at the graves. paper_stall_seller_2565
  「纸马、纸钱、纸楼，上坟用的都有。」 ("Paper horses, money, houses: all for the graves."); near 「清明了，客官带一副去？」
  ("It's Qingming; take a set?"); tall_hat_man_2285 (hand at chin, thought) 「他们说的甚么买卖？」 ("What deal is that?").
  Fit: browse, talk, chin; missing `hand_chin`.

**V6.13 Brokers greeting down the street** · `grp.greeting_4775`, `grp.greeting_3490`, `grp.robed_three_2420`, `grp.robed_pair_incense_corner`, `grp.top_street_talk` · loop
- YH23: brokers (牙人) in long sleeves greet each other everywhere: trade is brisk, and the middlemen push prices up.
  Map: man_dark_robe_greeting_4772 smiles as he bows; robed_pointing_2528 points east. 「幸会，幸会！今日可有好买卖？」
  ("Well met! Any good business?"); 「刚说成一桩。」 ("Just closed one."); robed_pointing 「货在东头，随我去看。」 ("Goods
  at the east end; come and see."). Fit: bow, talk, point.

**V6.14 Buying at the stalls** (map readings; YH23 for the snack shed)
- `grp.umbrella_crowd_2600`: dark_coat_2700 hands something to round_face_robe_2641; child_by_dark_robe_2880 clings to
  tall_dark_robe_2908. YH23: a snack shop under a square shed with a small price sign draws passers-by (matching it to
  `prop.mat_roof_2800` is our call). 「找你五文。」 ("Five cash change."); child 「我也要吃！」. Missing `cling`.
- `grp.tray_vendor_3050`: 「来看来看！」 ("Come and see!") (hold_tray). `grp.tray_stall_4110`: man_bending_tray_4190
  reaches in: 「这个几文？」 / 「挑好的拿。」 ("How much?" / "Take your pick."); missing bend_goods.
- `grp.low_umbrella_stall_3000`: a sign ending 子 (the map guesses 香飲子): 「香饮子，解渴——」, only if it reads so.
- `grp.garment_seller_monk_3060`: 「师父看这件，厚实。」 / monk_3060 (smiling) 「好是好，贫僧没这许多钱。」 ("Thick, this
  one, Master." / "Fine, but a poor monk hasn't the money."). YH23: monks out begging alms this season. Fit: show_garment.
- `grp.box_porter_3745`: 「站住，里头是甚么？」 ("Hold on, what's inside?"); YH23's maltose seller or food-box carrier:
  which is which is open. `grp.cloth_shop_3600` (MHJ 40: customers choosing cloth): 「这匹罗几钱？」 ("How much this
  gauze?").

**V6.15 Riders, grooms, barrows, carried children**
- `grp.donkey_rider_2308`: groom 「小官人坐稳。」 ("Sit tight, young master."); boy_dark_robe_2380 (hand at chin,
  thought) 「我几时也骑一骑？」 ("When's my turn?"). `grp.rider_3375` (YH23: a man of letters in white on horseback with
  attendants, "像是很得势"): groom_whip_3452 「官人，这边人少。」 ("Clearer this way, sir.").
- `grp.man_with_child_2790`, `grp.child_on_shoulders_4975`: child 「看那边！」 ("Look over there!"). `grp.barrow_3300`
  (perhaps YH23's barrow of pottery basins): 「借过，借过！」 ("Coming through!"). No lines yet: `grp.rider_5262`,
  `grp.umbrella_pair_4060`, `grp.barrow_top_3340`, `grp.lattice_frame_top_3120`, `grp.seated_pair_3900`.

### Solo figures
- **itinerant_monk_2078**: MHJ 46: claps boards with both hands (双手打板), a bamboo pack with a hat clipped on, like
  玄奘 in the Dunhuang murals; crouching_dark_2028 turns to watch. The clapper is a sound source. 「化些斋饭。」 ("Beg
  a little food.").
- window_face_4155: 「楼下好热闹。」 ("Lively down there."). pointing_man_3405 at the inn's sign: 「王员外家，就是这里。」
  ("Wang's inn, here."). boy_5050 (arms out, playing): a laugh.
- **Icons only**: pole_man_5578, man_hands_raised_5180, crouching_dark_5515; the 13 walkers' loads (box_carrier_3272
  may be YH23's food-box carrier). No bubbles: ridge_reclining_3530, ridge_dark_robe_3575, the top-edge figures.

### Sound
**(a) Zones** (stations on `S6.road.main`)
- **正店 front** (−47 to −26.5): crowd, bearers, the basket and cane sellers, the sack cart's donkeys, cups upstairs.
  At night the lamp-boxes and 栀子灯 burn (YH23; DJ 卷三): the one zone still loud after dark.
- **Meat counter and storyteller** (−56 to −47, N): the cleaver on the block, the teller's rise and fall, cheers.
- **Crossroads** (−62 to −56, and the cross street): wagons, mule brays and harness, shouts, the wine cart, horses.
- **Snack shed, paper stall, incense shop** (−72 to −62, N): chatter and coins, paper rustling; the incense shop quiet.
- **The 解 ring** (−69 to −62, S): a murmur of young men, two laughing; the donkey.
- **Square well and great willow** (−80 to −73): rope, buckets, splashes, the willow; the monk's clappers passing.
- **Upper floors, top street**: quiet; a page turned. **Night elsewhere**: a murmur; the gate's dusk drum from S5.

**(b) Point emitters**
- **Animals**: donkeys ×8 (donkey_team_near_5270, _dark_5300, _pale_5285, donkey_door_5150, donkey_head_down_5565,
  donkey_wine_cart_3105/_3191, donkey_2285); mules ×8 (mule_lower_1_3427 painted braying); horses ×2 (horse_3445,
  horse_5262); dog ×1 (dog_4335).
- **Vehicles ×8**: taiping_wagon_3600, hidden_wagon_3400 (heard, unseen), wine_cart_3090, sack_cart_5412,
  barrow_casks_3300, barrow_top_3340, sedan_4575, sedan_4965.
- **Trades**: the chop, the storyteller, the well (`str.square_well_2000`), the monk's clappers, paper, cups and ewer,
  the third archer (V5.2), tray vendors ×3, poles ×4.
- **Painted voices**: wagon_shaft_carter_3642 (shouting), basket_man_4590 (talking); laughter from monk_3060,
  jie_young_seated_2100, jie_smiling_capped_2160. **Trees** ×14 (the great willow 2330).

**(c) Bed**: walla beyond the painted crowd, birds, wind, temple bells (no temple in S6), DJ 卷三's dawn cries
("吟叫百端"), attested, not painted.

**Counts S6**: 14 vignettes + 6 small groups; ≈ 55 speaking figures (plus the storyteller's 17 cheering); ≈ 45 point
emitters (19 animals, 8 vehicles, 10 trades, 4 poles, 5 painted voices) + 14 trees.

---

## Patterns

The same shapes recur in all three sections; each is roles (filled by map IDs) plus beats.
1. **Dispute or haggle**: claimant, payer, chorus, distant witnesses reacting to the peak beat. V5.1, V5.12, V4.5, V6.2.
2. **Asker and givers**: askers cycle through targets who give, ignore or shoo; the player can be a target. V5.11, V5.7B.
3. **Ring round a focus**: one focus, N craning listeners who react together. V6.5, V4.2, V6.10, V5.4/V5.6, V5.10.
4. **Greeting**: two people, a bow, two lines. V5.12, V6.13 (five groups).
5. **Vendor and customers**: the vendor calls to the player; no painted vendor, an icon only. V4.5, V4.6, V6.2–3,
   V6.12, V6.14.
6. **Work in rhythm**: a repeated motion with a sound on the beat: chop, rope and splash, "一、二——起", bowstring,
   push. V6.6, V6.11, V4.7, V5.2, V5.9.
7. **Team on the move**: driver, helpers, team; a shout at whoever (often the player) blocks the way. V4.3, V4.4, V5.3,
   V5.9, V6.1, V6.7, V6.8.
8. **Travelling party**: rider, groom, servant; the servant calls back. V5.8, V5.12, V4.3, V6.15.
9. **Rest and doze**: Zzz and snores; the one awake answers the player. V4.1, V5.5, the resting solos.
10. **Avoidance**: someone who hides or turns from the player. V6.9.
11. **Carried child**: carrier plus a child who points and asks. V4.7, V6.2, V6.14, V6.15.
12. **Witness above or behind**: tower, window and ridge figures turn to the nearest loud beat. V5.1, window_face_4155.
13. **Background**: far figures, silent.

**One record needs**: type; roles → map IDs; reading (sources, A/B variants where disputed, the one chosen); mode (loop
period, near radius); beats (actor, line or icon, clip, seconds); triggers (beat → witnesses); sound per beat; missing
clips. Lines stay text, marked as proposals, apart from the numbers.

**Map checks** (named by sources, not on our map; `BUILDING.md` rule 2: into the map first, never straight into a
scene): S4: YH15's nine soldiers (we have seven) and the groom in the yard. S5: SWK's barber awning and hair-knot
sign. S6: MHJ 40's fat owner at the meat shop door; MHJ 47's poles in the willow; YH23's maid with an infant and the 女伎
at the 正店 door, the woman taking two girls to 杨家应症, the little wine-boy with a brazier, and the monks, Taoists and
women among the storyteller's listeners.
