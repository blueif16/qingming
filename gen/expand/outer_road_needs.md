# Outer road (S4 part 1, u 9400–12600): what the workshop needs to make

From the east area agent, Run 1 (2026-10-11), for the workshop agent. Every item comes from the scroll map:
`map/text/S4.md` says where each thing is and what it does, `sections/outer_road/layout.json` holds the positions.
Figure crops are in scan px `[u0, v0, u1, v1]`, cut from this section's registered restyle
(`gen/sections/outer_road/mosaic.jpg`, section `outer_road`, as `characters/<name>.json` `crop` expects); read the scan
beside it (`node tools/scroll_inspect.mjs outer_road <u> <v> <half>`), since the restyle redraws.

**Real size** (`map/BUILDING.md` rule 5, settled 2026-10-11): every person, animal, cart and building part is made at
real size; only positions come from the map. The painter draws far things smaller (here the monk at the top of the
silk is 55 px against 150–195 px on the road, about 0.3 of the street's scale; 0.5 at v ~320, 0.8 at v ~630), so the
map's painted heights and animal lengths are not sizes: judge a figure's age from its proportions and from the
adults painted next to it. The scales given for children below are against those neighbours.

## Casting: 65 figures, 37 from the existing 8, 28 for 7 new characters

### New characters (one scroll figure each)

- **soldier** (new): model `S4.fig.soldier_knee_up_11792`, crop [11740, 535, 11870, 725]: stocky man in a dark cap, a belted knee-length jacket over trousers with leg wraps, seen from the front. Plays the 7 courier-post soldiers (`soldier_lying_11430`, `soldier_hugging_knees_11488`, `soldier_behind_box_11580`, `soldier_on_stool_11630`, `soldier_knee_up_11792`, `soldier_slumped_11885`, `soldier_asleep_on_box_12022`); `soldier_slumped_11885` wears a broad dark hat or hood over his bowed head (a hat variant if cheap).
- **robed_man** (new): model `S4.fig.ox_leader_11017`, crop [10960, 855, 11060, 1070]: bearded man with a topknot in a long loose white robe tied with a sash, walking. Plays the long-white-robed men none of the 8 fits (the townsman's robe is slate grey): `ox_leader_11017`, `man_with_staff_9852` (holds a tall staff), `walker_in_willows_9712`, `ox_walker_9902` (dark cap), `man_long_robe_10605` (dark cap), `man_behind_roof_10068`, `man_behind_roof_11165`, `doorway_figure_11738`, `client_seated_12185`, `onlooker_east_12368`, `figure_under_eave_11382` (low confidence: a robe at the back of the eating house, head hidden). The gate's men "in white" could use it too.
- **child** (new): model `S4.fig.child_at_table_12597`, crop [12560, 1600, 12630, 1705]: small child with a top-knot in a short jacket and trousers. Plays `child_at_table_12597` (scale about 0.55), `child_bottom_9885` (reddish-brown robe, about 0.45), `child_by_basket_9915` (light clothes, about 0.6), `child_in_arms_10430` (a small child held at the woman's shoulder, about 0.4; support `carried in arms`); the gate's two beggar boys and its small figure (S5) could use it too.
- **woman** (new): model `S4.fig.person_with_child_10430`, crop [10395, 335, 10465, 480]: a woman in a long robe reaching to the feet, a small child held up at her left shoulder (the child is its own map figure, `child_in_arms_10430`, played by the child). Plays that one figure here; S6's women could share it.
- **monk** (new): model `S4.fig.monk_side_door_10208`, crop [10185, 158, 10232, 226] (only 55 px tall on the silk: read the restyle): a monk in a long plain robe walking in at the temple's side door. Plays that figure; S6's itinerant monk (行脚僧, 名画记 pin 46) could share it.
- **fortune_teller** (new): model `S4.fig.fortune_teller_12232`, crop [12195, 695, 12300, 835]: the fortune-teller (临街神算) in a dark robe and a black cap, seated behind his table with his arms spread over his papers. Plays that figure; if a new character is too much for one figure, the official (seated, futou) is the fallback.
- **hat_traveller** (new): model `S4.fig.rider_fan_10285`, crop [10205, 880, 10320, 1010] (upper body; he rides, so ask the sheet for a standing man): a traveller in a wide conical straw hat and a light robe holding a dark round fan. Plays `rider_fan_10285` (riding, fan before his face) and, with a dark brimmed hat if a variant is cheap, `onlooker_hat_12084` and `man_behind_roof_12164` (white robe, a pole on his shoulder); the gate's man in a broad cloth-covered hat and its veiled rider could use it too.

### From the existing 8

- `awning_stall_man_9495`: idler (head and shoulders over the cart, under the mat awning, facing the wares).
- `awning_stall_man_arm_raised_9625`: idler (dark cap, light jacket, right arm raised to the stack of round goods, calling out).
- `parasol_man_9875`: idler (under the light parasol, facing the basket).
- `dark_robed_man_9885`: townsman (long dark robe, seen from behind, a child at his side).
- `basket_leaner_10078`: idler (leans far over the big basket, both arms in the load).
- `bearded_man_10142`: idler (bends forward reaching low to the goods).
- `waving_man_10155`: idler (dark sash, right arm raised high, hailing).
- `crouching_man_10135`: idler (squats by the small bench, back to us).
- `striding_man_10148`: porter (light short jacket, strides west with arms flung out and a long stick).
- `seated_man_bottom_9680`: townsman (dark jacket, hands in his sleeves, seated at the bottom edge).
- `young_man_bottom_9937`: carter (long dark-brown robe, talking to the man with the staff).
- `far_figure_9563`: porter (tiny far figure, maybe with a pole; low confidence).
- `shopkeeper_10425`: idler (cap, light jacket, behind his tray stand, one hand raised).
- `porter_baskets_10347`: porter (shoulder pole with two shallow round baskets, walking north).
- `drover_10578`: porter (head only, among the pack donkeys; low confidence).
- `ox_driver_seated_9815`: carter (seated on the front of S5's covered cart, back to us, long goad).
- `ox_leader_10050`: carter (light head-cloth, leans over the two oxen's heads holding their nose ropes).
- `carter_whip_10380`: carter (beyond the second cart, raised whip, shouting).
- `carter_front_10525`: carter (head over the second cart's front).
- `ox_driver_10635`: idler (white jacket, dark belt and cap, bends against the shaft ox's flank).
- `man_cart_tail_10405`: idler (in white, bent double at the second cart's tail).
- `groom_rider_10255`: idler (young man in a cap and light jacket walking at the fan rider's horse's head).
- `groom_10420`: idler (cap, short jacket, holds the dark horse's reins, facing us).
- `bearer_bending_10440`: porter (front bearer of the west sedan chair, bending to lift the pole ends).
- `young_man_canopy_10558`: idler (beardless, cap and short jacket, under the arched canopy).
- `bearer_straining_10728`: porter (under the poles between the two chairs, pole on his shoulder, straining).
- `man_behind_bearer_10755`: idler (cap and jacket, looks down at the straining bearer).
- `walker_behind_sedan_10822`: porter (only his legs show below the east chair).
- `bearer_east_10982`: porter (rear bearer of the east chair, pole on his right shoulder, walking west).
- `porter_two_bundles_11085`: porter (black cap, pale belted jacket, shoulder pole with two tall hatched bundles).
- `man_beside_porter_11066`: porter, scale about 0.85 (a smaller face beside the porter, possibly a youth).
- `youth_bending_11138`: porter (short jacket, dark apron, bends to lift a tied bundle with his pole).
- `onlooker_cap_12040`: idler (dark cap, light belted jacket, arms folded, watching the fortune-teller).
- `onlooker_back_12089`: inspector (seen from behind: short dark jacket, trousers, leg wraps).
- `onlooker_gesturing_12112`: idler (dark cap, right arm raised toward the signs).
- `figure_in_shed_back_12382`: townsman (dark robe, deep in the shed; low confidence).
- `man_seated_by_tree_12512`: idler (loose white clothes, dark cap, sitting on the ground at the big willow's foot, knees up).
- The robed_man, child, soldier, woman, monk, fortune_teller and hat_traveller figures are listed above.

## Actions the existing clips can't show (one line each)

- Lying asleep on the ground on one side, head propped on a box (`soldier_lying_11430`).
- Sitting on the ground with the knees drawn up, arms folded on them and the head bowed onto the arms, dozing (`soldier_hugging_knees_11488`; `soldier_slumped_11885` the same, hunched forward).
- Sitting on the ground with one knee drawn up and hugged, the other leg stretched out, looking about (`soldier_knee_up_11792`, `man_seated_by_tree_12512`).
- Squatting with the hands together in the sleeves at the chest, looking out (`soldier_behind_box_11580`, `crouching_man_10135`).
- Seated on a low stool, one arm stretched out with the hand resting on a stand (`soldier_on_stool_11630`).
- Kneeling and curled forward asleep with the head down on a box (`soldier_asleep_on_box_12022`).
- Seated behind a table talking and gesturing over papers, arms spread on the table (`fortune_teller_12232`).
- Seated on a stool leaning forward with both forearms on a table, listening (`client_seated_12185`).
- Carrying a sedan chair's pole on the shoulder: the front bearer bending to lift the pole ends, the middle bearer straining under the poles, the rear bearer walking with the pole on his shoulder (`bearer_bending_10440`, `bearer_straining_10728`, `bearer_east_10982`). The chairs are vehicles and stand still, so the bearers hold the carry in place, unless the chair is made to move with them (the lead's call).
- Walking with a shoulder pole and two hanging loads (`porter_baskets_10347`, `porter_two_bundles_11085`): needs the pole and loads as props and a walk that matches them (the 2026-10-10 audit dropped carry walks without loads).
- Bending to lift a tall bundle with a carrying pole (`youth_bending_11138`).
- Leaning far over a big basket with both arms reaching into it (`basket_leaner_10078`); bending forward reaching low to goods (`bearded_man_10142`).
- Hailing or calling with one arm raised high (`waving_man_10155`, `awning_stall_man_arm_raised_9625`, `onlooker_gesturing_12112`).
- Standing holding a small child at the shoulder (`person_with_child_10430`).
- Riding with a round fan held up before the face (`rider_fan_10285`: the ride clip plus a fan).
- Leading an ox by its nose rope at a walk (`ox_leader_11017`: the camel driver's lead clip may retarget), and leaning over two oxen's heads holding their nose ropes (`ox_leader_10050`).
- Bending against an ox's flank, both arms along its body, pushing it on (`ox_driver_10635`).
- Seated on a cart's shafts holding a long goad across the body (`ox_driver_seated_9815`).
- Walking with a whip raised overhead, shouting (`carter_whip_10380`).
- Bent double at a cart's tail, pushing (`man_cart_tail_10405`; the carter's library push may do).
- Standing with a tall staff held upright, talking (`man_with_staff_9852`).
- Standing in a doorway with both hands raised to the head, tying a kerchief (`doorway_figure_11738`).
- A child reaching both arms onto a table (`child_at_table_12597`).
- A small child held at a carrier's shoulder, clinging (`child_in_arms_10430`, with `person_with_child_10430`).
- Standing at a horse's head holding the reins (`groom_10420`; walking with it: `groom_rider_10255`).
- Striding with both arms flung out, a stick in one hand (`striding_man_10148`).

## Animals: 17 (map IDs; built at real size: the map's `length_m` is the painted hoof-to-hoof span, foreshortened for animals seen end-on and small far up the silk, so use it for orientation only)

- `S4.ani.ox_shaft_9972`: ox, dark brown, walking east between the shafts of S5's covered cart; shafts along its back, rope traces from the cart's front to its hindquarters, a yoke or collar at the neck, head low beside the far ox; driven by the seated driver and the walking driver.
- `S4.ani.ox_far_10045`: ox, dark, walking east beside the shaft ox on its far side, drawing S5's cart; halter and nose rope held by the leader, tassels on its harness.
- `S4.ani.ox_lead_10235`: ox, big, light brown, walking east at the head of S5's cart's team on long rope traces, tail swishing, a strap with a ring round its body, head raised.
- `S4.ani.ox_shaft_10712`: ox, light-coloured, in the shafts of the second covered cart, pulling north-east, head up, collar or yoke at the withers; the driver bends against its flank.
- `S4.ani.ox_lead_10872`: ox, big, walking east on traces ahead of the shaft ox, one hind leg lifted; girth band and breast strap holding the traces; led by the nose rope (`ox_leader_11017`).
- `S4.ani.horse_rider_10205`: horse, dark shaggy mane, walking west with its head hanging low, ridden by `rider_fan_10285` (saddle hidden), a groom at its head.
- `S4.ani.horse_dark_10372`: horse (or mule), dark mane and forequarters, long dark tail, standing with its head hanging low, no saddle drawn, held by `groom_10420`.
- `S4.ani.white_horse_lying_11840`: horse, white (outline only on the silk), lying in the courier post's yard with its legs folded under it and its head up, looking west; no saddle or bridle (a white coat on the horse, `lie`).
- `S4.ani.donkey_10190`: donkey, grey, standing under the second mat awning facing us, head lowered, long ears spread; no load or rider.
- `S4.ani.pack_donkey_10487`: donkey, dark, walking north-west with its head raised, a wicker pannier frame heaped with a dark lumpy load (charcoal?).
- `S4.ani.pack_donkey_10571`: donkey seen from behind walking north under a tall wicker frame of the same dark load; head hidden.
- `S4.ani.pack_donkey_10632`: donkey facing east with its head lowered, a load frame on its back.
- `S4.ani.pig_10185`: pig, dark grey, bristly back, head down rooting (`graze`).
- `S4.ani.pig_10236`: pig, grey-brown, walking east in the herd.
- `S4.ani.pig_10262`: pig, black, bristly, walking east, snout forward (only its back and head show).
- `S4.ani.pig_dark_10282`: pig, dark, round-bodied, walking east with its snout raised, at the front of the herd. No herder is painted.
- `S4.ani.bird_12433`: a small black bird (a crow?) perched in the big willow's whips high above the fortune-teller's awning, tail to the west (low confidence; support `perched`, 9.5 m up): a new animal type, a perched idle is enough.

What the registry lacks for these: a perched bird; the ox's draught tack (yoke or collar, girth band, breast strap, rope traces, nose rope, harness tassels); a wicker pannier frame with a heaped dark load for the donkey (beyond `pack_saddle`); a white coat for the lying horse; a horse standing with its head hanging low (graze may do).

## Vehicles: 2 types here (plus S5's cart, whose front is in S4)

- `S4.veh.covered_ox_cart_10550`: big covered ox cart, the same type as S5's (`kit_vehicles.covered_ox_cart`), seen from behind heading north-east: woven-mat barrel roof on hoops, the body closed at the rear by a lattice door with a carved rail (150 × 140 px), two big spoked wheels (the south wheel's rim u 10475–10534, top v 1103, bottom hidden below v 1285: at least 182 px tall on the silk, as big as S5's cart's 174 px wheel; real size is the kit's; a second rim arc at u 10293–10338 may be the north wheel); shafts hidden by the shaft ox; team: a shaft ox and a lead ox on traces (a third ox is possible but not legible). Map: front (26.53, 7.41), rear (25.19, 5.17), wheel0 (26.87, 5.37), length 2.61 m between the ground points (all est).
- `S4.veh.sedan_chair_10623` and `S4.veh.sedan_chair_10810`: two tall sedan chairs (轿, `kit_vehicles.sedan_chair`, carried=True) carried west along the far side of the road: dark panelled cabins with a lattice window in the side and a curtained end, under a domed roof with upturned eaves (the kit's four concave slopes with a finial reads close); body 87 × 190 px on the silk (about twice as tall as wide; real size is the kit's), lifted about 25 px above the bearers' feet; the poles run east-west at shoulder height (v 700–723), the west chair's from u ≈ 10460 (front bearer) to 10715, the east chair's from the middle bearer (≈ 10735) to the rear bearer (≈ 11005). Map: front/rear are the cabin's ends (10623–10705 and 10810–10892).
- For the lead (seam note on `S5.veh.covered_ox_cart_9800`): its front is in S4: the body's front panel at u ≈ 9688, a footboard to 9750 with the seated driver's feet on it, the shafts' front ends est at (9960, 1325) over the shaft ox's fore hooves (ground est (9960, 1455)), a rolled blind or round hamper (u 9690–9760, v 1195–1310) behind the driver; one wheel only (no second wheel visible).

## Props carried by figures

- Shoulder pole with two shallow round baskets on cords (`porter_baskets_10347`).
- Shoulder pole with two tall, densely hatched bundles (rolled straw mats or straw) hanging at its ends (`porter_two_bundles_11085`).
- Long carrying pole on the shoulder, its end on a tied bundle (`youth_bending_11138`; the bundle is the map prop `S4.prop.tied_bundle_11205`).
- Long goad (`ox_driver_seated_9815`); long stick (`striding_man_10148`); tall staff (`man_with_staff_9852`); a pole or stick end on the shoulder (`man_behind_roof_12164`).
- Whip with a tasselled tip (`carter_whip_10380`).
- Dark round fan (`rider_fan_10285`), and his wide conical straw hat (part of the character).
- Halter or nose ropes in the hand (`ox_leader_11017`, `ox_leader_10050`, `groom_10420`, `groom_rider_10255`).
- The small child held at the shoulder (`person_with_child_10430`, part of the woman).
- A long thin wedge from a seated man's knee to the ground: a staff or a rolled mat, unresolved (`man_seated_by_tree_12512`; part of his figure, not a map prop).

## Kit parts the buildings and props need that `song_kit.py` lacks

- A big parasol on a pole, open, with many radiating ribs, dark or light cover, tilted (`parasol_dark_9715`, `parasol_light_9970`, `parasol_12572`).
- A woven-mat awning: a flat or sloping mat shade on battens and poles, a hipped end, a bamboo blind of vertical slats closing one end (`mat_awning_9475`, `mat_awning_10030`, `mat_awning_12066`); and a low arched mat canopy over shelves (`mat_canopy_10555`). The kit's `canopy` gives the poles; the mat surface and the blind are new.
- A thatched roof: an open stall shed of thatch or mat on four slender posts (`stall_shed_10470`) and a rounded thatched hut roof (`S4.bld.thatched_hut_10780`).
- A studded double-leaf gate with one leaf open inward, rows of round studs, a ring pull and a pasted paper notice of tiny writing (`S4.bld.post_gatehouse_11730`), and a shut studded double door with four rows of studs (`S4.bld.temple_gate_hall_9960`).
- An earthen wall whose top carries a row of crossed (X-shaped) stakes (`S4.str.post_wall_w_11470`, `S4.str.post_wall_e_11950`).
- A ditch bank faced with horizontal planks held by small capped stakes (`S4.grd.ditch_11570`), and the humped little bridge over it: a mound-like deck roughened with brushwood or turf, planks and a diagonal brace on its face (`S4.str.small_bridge_11800`).
- Vertical hanging signboards with painted characters: 看命, 神課 and 決□ (`sign_kanming_12266`, `sign_shenke_12335`, `sign_left_12207`).
- A striped cloth banner hung from a slanting crossbar braced on a tall capped pole (`banner_frame_11895`); a furled dark banner on a bamboo pole with node rings (`furled_dark_banner_11870`); a red shaft with a spear (`red_pole_and_spear_11935`); a small dark furled flag or hat hung on a post (`dark_cone_on_gate_post_11821`).
- Spears: a long shaft with a narrow blade, some with a tassel or loop, leaning against the stake crest (`spear_11342`, `spear_11400`, `spear_11505`, `spear_11541`).
- Document boxes: a dark lidded chest with hatched sides (`document_box_11581`, `document_box_12041`), and a small square pillow box (`pillow_box_11348`).
- Slatted furniture: stands, stools, boxes and a crate with lattice sides (`slatted_stand_11243`, `slatted_stool_11302`, `slatted_box_11355`, `slatted_box_11075`, `slatted_crate_12576`); small plank stands and stools (`stool_11662`, `stand_10497`, `small_stand_10900`, `tray_stand_10408` with its stack of round trays).
- Benches: plank benches on short splayed legs (`bench_10180`, `bench_10945`, `bench_11215`, `bench_11435`); the kit has `table` but no bench; a long plank table (`long_table_10525`) and the fortune-teller's table with a cloth apron (`table_12183`).
- Market goods: a huge round basket heaped with a shaggy brown load (`big_basket_10000`), a round basket (`basket_10379`), a stack of about ten round roll-like goods with spiral centres (`round_goods_stack_9790`), round spotted things hanging from a stall frame (`hanging_goods_9890`), a heap of bundles with a big pale roll (`goods_heap_10345`), a lidded box and round white loaves (`awning_goods_9565`), a tall rope-bound bundle (`tied_bundle_11205`).
- Two seated guardian statues behind lattice railings in the temple gate's side bays (`guardian_statue_9942`, `guardian_statue_10102`): solid figures, better from Meshy than from the kit.
- A domed straw-hatched object on a low stand (a saddle, or a basket and bowl) under the courier post's inner hall (`saddle_on_stand_11760`).
- Roof details the halls show: the hanging-fish gable ornament (悬鱼) and diamond-patterned tiles (`S4.bld.south_hall_12350`, `south_hall_10330`), a king-post front gable (`S4.bld.house_9590`), a gourd-shaped finial (`S4.bld.small_pavilion_10920`), raised ridges with upturned ridge ornaments (`S4.bld.south_pavilion_11760`).
- Low rail fences and plank frames (`S4.str.rail_fence_10190`, `S4.str.yard_frame_12025`, `S4.str.railing_9760`), a short capped post (`post_11410`).

## Also (not the workshop's list, for the lead)

- Trees: the 22 trees here include pine-like trees with fan-shaped needle sprays (`gnarled_9445`, `pollard_9650`, `leaning_9776`, `big_9840`), huge burled pollard willows (`gnarled_willow_12390`, `willow_11300`, `willow_leaning_11185`), bare whip clumps and a bamboo-like leafy clump at the bottom edge. Only `willow_card.webp` exists: a pine-like card, a bare whip-clump card and a leafy-shrub card would let the page show them as painted.
- The page needs a way to show a sedan chair carried (bearers and chair together), and a rider on a horse with its head down.
