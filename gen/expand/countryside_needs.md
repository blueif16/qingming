# The countryside (S1, u 29050–37610): what the workshop needs to make

From the S1 needs agent, Run 1 of round 2 (2026-10-12), for the lead's catalogue agent. Every item comes from the
scroll map: `map/text/S1.md` says where each thing is and what it does, `sections/countryside/layout.json` holds the
positions, and `map/strokes/S1.json` the strokes (244 entities after the merge, the second pass and the frame). IDs
drop the `S1.<kind>.` prefix where the kind is clear. Crops are scan px `[u0, v0, u1, v1]`.

To read the scan beside the restyle, use `node tools/scroll_inspect.mjs countryside/west <u> <v> <half>` for u < 33256
and `countryside/east` above it. The crops named `crop_*.jpg` below are in the scratchpad folder `S1_needs/`
(contrast-stretched scan on the left, the registered restyle on the right; `crop.mjs` makes more). **The restyle is
wrong here more than anywhere:** it tiles every thatched roof in blue, adds people round every group (6–8 men round the
charcoal train, 4–5 round the second traveller), draws the lying buffalo as two animals and the runaway horse as a small
pack beast, paints whole streets in the empty silk above the great willows, leafs every willow green, and dries every
wash band into grassy ground (`sections/countryside/notes.md`). Make every model from the scan's strokes and the
map's `what`.

**Real size** (`map/BUILDING.md` rule 5): every person, animal, cart, boat and building is made at real size; only
positions come from the map. S1 is painted on no single scale (the frame's checks): the foreground travellers are
1.35–1.5 × life, the party's porters 0.63–0.76, the charcoal drivers 0.65–0.74, the far figures on the field banks
0.3. The buildings are painted under life (the stall shed's front 5.9 m, the barn's 4.1 m, the threshing floor
5.0 × 2.9 m, the sampan 3.0 m). Children's scales are measured against the adults painted beside them.

**Credits.** Meshy has about 151 credits for the whole round (`gen/expand/round2_progress.md`). **S1 needs no new
character:** all 30 figures are cast from the existing 22, and every clip they play now is their own or a free local
retarget (`tools/retarget_local.mjs`, `from:`). The paid items are optional: two Text to Motion takes worth having
(`chase_run`, `drive_donkeys`, 10 credits each), two more that are optional, and a water-buffalo body if the free
route below doesn't read (15).

**S1 is the countryside pilot.** It is the emptiest section in people and the fullest in trees and ground: 87 trees,
47 ground entities, 14 buildings (10 of them thatched, 11 if the long farmhouse is), 8 fences and structures, a stream and a plank bridge. Most of
the work is the area's own kit (`blender/kit_countryside.py`: the thatched farmhouses, the threshing floor, the fences
and the fields, `build_rules.md` step 4), the tree cards and the ground.

## Casting: 30 figures, all from the existing 22

| character | figures | | character | figures |
|---|---|---|---|---|
| idler | 5 | | townsman | 3 |
| hat_traveller | 4 | | carter, camel_driver, robed_man, scholar | 2 each |
| porter | 4 | | soldier, inspector, child_robed | 1 each |
| bearer | 3 | | | |

**Confidence:** 17 high, 5 med, 8 low. The low ones are the five tiny far figures on the field banks at the top of the
silk, the doubtful stall customer, the bending farmer in the yard and the figure under the threshing-floor shed; each
line gives the other reading. They are cast anyway; the lead decides whether they are built.

**Where they stand:** 27 on the ground, 3 riding (`animal S1.ani.<id>`, H 0: the rider's foot is the ground under his
seat). Nobody stands on the bridge, and nobody is painted in the sedan (its box is closed).

**The dress decides the cast**, as in S4b, S3 and S2: short jackets are the idler or the porter (the porter when a pole
is carried); wide hats are the hat traveller; a dark cap with an apron or an indigo robe over white trousers is the
inspector; long light robes with a cap are the scholar, without a cap the robed man; slate robes the townsman; the
bearers play the bearers. Two new pairings: **the soldier** (a belted knee-length jacket and a cap) plays the farmer
by the hedge, and **the camel driver** (an indigo mantle) plays the hooded rider in a cloak and the figure in an
indigo-tinted cloak under the shed.

**Clips to add, all free** (local retarget): `hat_traveller` `drink` (`from:scholar/drink`); `robed_man` `hail`
(`from:idler/hail`) and `lead` (trimmed earlier, back from `gen/`); `camel_driver`
`ride` (trimmed earlier, back from `gen/`) and `crouch` (`from:idler/crouch`); `idler` `bend_goods`
(`from:inspector/bend_goods`); `child_robed` `reach` (`from:child/reach`); `scholar` `point` (`from:sightseer/point`).
Run `node tools/clips_used.mjs` after casting.

Each line reads: the figure, the clip it plays now ("until" the take it waits for), its carried props, then its dress
and action.

### The charcoal train (赶驴入城, pin 1; crop `crop_charcoal_train.jpg`, [36230, 680, 36870, 960])

- `charcoal_driver_36797` (high): **hat_traveller**, `walk` until `drive_donkeys`, prop `stick` (as a switch). A wide
  round-brimmed hat and a short jacket belted over trousers; he leans west to the leading donkey with his right hand on
  its load and holds a long switch out east in his left hand, its tip hanging, his face turned to the donkeys.
- `charcoal_driver_36250` (med): **carter**, `walk` until `drive_donkeys`, prop `stick` held out east over the last
  donkey's load. Faint, a short robe or jacket, at the train's west (rear) end behind the big tree's low branches: he
  drives from behind.

### The travellers on donkeys (迎寒策蹇 / 骑驴客商, pin 4; `crop_travellers.jpg`, [29960, 1260, 30700, 1650])

- `traveller_rider_30165` (high): **townsman**, `ride` on `donkey_traveller_30216`, prop `wind_hood`. A hood (风帽)
  wrapping the head and shoulders, a long robe, the hands hidden in the sleeves; the biggest figure in S1 (228 px).
  Crop `crop_hooded_rider.jpg`, [30080, 1260, 30310, 1520].
- `traveller_rider_30495` (high): **camel_driver**, `ride` on `donkey_traveller_30546`, prop `wind_hood`. A hood pulled
  over the head and a cloak round the shoulders (the camel driver's indigo mantle is that cloak).
- `traveller_staff_30357` (high): **porter**, `carry_pole` with `staff` on the right shoulder, prop `back_bundle` (dark,
  curved, at the back). A short padded jacket, trousers, a small topknot cap; walking east between the riders, stooping
  a little.
- `groom_leading_donkey_30648` (high): **robed_man**, `hold_rope`; `lead` if the travellers are made to walk. A stout man
  in a long robe and a topknot cap, painted from the front with his mouth open, holding the second donkey's lead rope in
  both hands at his waist. The rope runs from his hands to the donkey's halter (a builder's line).
- `traveller_standing_29996` (med): **scholar**, `look`, prop `stick_bag` (new). A long robe and a soft cap, at the west
  end facing east toward the riders, holding a short stick with a long dark bag hanging from it before his chest. The
  restyle's second man behind him is not painted.

### The runaway horse (惊马闯市; `crop_runaway_horse.jpg`, [30040, 560, 30760, 870]; `crop_post_child.jpg`)

- `groom_chasing_30353` (high): **idler**, `run` until `chase_run`, prop `hat_on_back` (new, optional; or `back_bundle`).
  A short jacket and trousers, running west at full stride with his right arm thrust straight out; a big round thing at
  his back and shoulders, a broad hat blown back on its strings or a cloth bundle with flying ends (both readings).
- `groom_chasing_30518` (high): **bearer**, `run` until `chase_run`. A dark cap and a short jacket, his arm thrust out
  west; hidden from the waist down by the great willow's whips.
- `groom_chasing_30697` (high): **inspector**, `run` until `chase_run`. A dark cap, a short jacket and a short apron,
  running west, his front knee high, his left arm thrust out.
- `man_at_post_29812` (high): **robed_man**, `hail` until `beckon_lean`. A topknot and a robe, leaning on the bar of the
  tall post (`post_crossbar_29862`), his forearm laid on it, the right arm stretched far out west to the child: the old
  man calling the child out of the horse's way (the scholars' reading; his age can't be read). No second figure (the
  second pass).
- `child_29674` (high): **child_robed**, `reach`, scale about 0.6 (painted 64 px against the man's 146 px). A small
  child in a short robe, facing us and a little east, a hand held out toward the man.

### The tomb-sweeping party (杨柳杂花装簇轿顶, pin 6; `crop_sedan_party.jpg`, [30790, 220, 31170, 660])

The two bearers carry the closed sedan; nobody is painted inside. S4's precedent (the lead, 2026-10-12): sedans are
built carried and do not move, and their bearers play `sedan_carry` in place.

- `sedan_bearer_front_30828` (high): **bearer**, `sedan_carry`. A dark cap; only his head and upper body show above the
  great willow's whips, the front (west) pole on his shoulder.
- `sedan_bearer_rear_30990` (high): **bearer**, `sedan_carry`. A dark cap, a short jacket and an apron, the rear pole on
  his right shoulder, his face turned west.
- `porter_pole_31083` (high): **porter**, `carry_pole`, prop `pole_basket_branches` (new). A dark cap and a short belted
  jacket, striding west down the track behind the sedan: a basket or round bundle hangs at the pole's west end, a long
  bundle of branches (or the paper offerings) at its east end.
- `porter_walking_31070` (high): **idler**, `walk`. A cap and a short jacket, long strides, arms at his sides, carrying
  nothing; painted from the front.
- `party_porter_staff_31131` (med): **porter**, `carry_pole` with `staff` on the shoulder. A short belted jacket and a
  small cap, walking west, his right arm swinging out; a plain staff with a small knob at its top (the second pass at
  zoom 8: no blade, tines or crossbar), so the existing knobbed `staff`.
- `rider_party_30988` (high): **hat_traveller**, `ride` on `horse_party_31023`. A tall peaked hat with a pointed crown
  and a wide brim, a robe, the reins in front of him; horse and rider face east, against the sedan's westward walk.
  The only rider in the party.
- `porter_boxes_30908` (high): **porter**, `carry_pole`, prop `pole_boxes` (or the new `pole_hampers`, optional). A cap
  and a short jacket, a pole across his shoulders with a tall dark box or basket at each end (food hampers for the
  offerings?), walking east beside the rider.

### The village stall (u 29150–29840; `crop_stall.jpg`, [29150, 390, 29840, 800])

- `stall_man_29328` (med): **townsman**, `talk`, prop `back_bundle` (a dark round bundle on his back or right
  shoulder). A long robe and a small cap or topknot, standing under the thatched stall's west eave, his face toward us
  and a little west. Other reading of the dark round shape: a third head behind him (not recorded).
- `stall_customer_29280` (low): **hat_traveller**, `drink`. A hood or broad cap, seated at the small table
  (`stall_table_small_29285`), facing east to the standing man. Other reading: a round thing (a hat, a gourd or a sieve)
  hung on the stall's post; then nobody sits there.
- `man_with_stick_29205` (high): **scholar**, `point`, prop `hoe` (new). A pale robe and a small cap, half hidden in the
  big willow's shoots, leaning forward to the west with his left arm stretched out, a long stick with a small hooked or
  forked head over his right shoulder.

### The farmsteads and the threshing floor (`crop_farmhouses_west.jpg`, `crop_farmhouses_east.jpg`, `crop_threshing_floor.jpg`)

- `farmer_by_hedge_34472` (med): **soldier**, `idle` until `stand_sleeves` (optional). A small hat or hooded cap and a
  plain long jacket, the hands held together in the sleeves at his chest, body toward us, head a little west; only his
  upper body shows above the bushes.
- `bending_farmer_34252` (low): **idler**, `bend_goods`. A rounded, hooded back bent forward, seen from behind at the
  east end of the yard's rail, working at the ground among the two low yard objects. Other reading: a bell-shaped thing
  (an upturned hen basket or a small straw stack).
- `figure_in_shed_35108` (low): **camel_driver**, `crouch`. A dark hood or cloak (indigo-tinted strokes, an inverted V),
  crouching or bending behind the long plank under the threshing-floor shed, seen from behind. Other reading: a straw
  raincoat hung on the post (then retire it).

### The far figures on the field banks (all low; 37–45 px at foot v 118–145, a third of life)

- `far_figure_29482`: **hat_traveller**, `idle` (a small hat). `far_figure_29466`: **idler**, `idle`. Together with
  `S1.ani.far_ox_29515` (two figures beside an ox, or a ploughman at his plough behind an ox; the strokes don't settle
  it).
- `far_figure_29337`: **townsman**, `idle` (a robe flaring at the hem).
- `far_figure_29257`: **idler**, `crouch`; `far_figure_29230`: **carter**, `crouch`. Two (perhaps three) small dark
  shapes crouching or bending together in the field, or one small animal lying with its head up.

## Actions the existing clips can't show (ranked; 10 credits a take, then free for anyone)

No one in S1 is painted threshing or hoeing: the threshing floor is idle (寂静的谷场), so the brief's guesses at
`threshing` and `hoeing` aren't needed.

1. **`chase_run`** (worth having): running flat out with long strides, one arm thrust straight forward at shoulder
   height with the hand open, the other arm swinging back, the head forward, shouting after something ahead. The three
   grooms after the bolting horse (`groom_chasing_30353`, `_30518`, `_30697`), the centre of 惊马闯市. Stand-in: `run`,
   whose arms pump at the sides.
2. **`drive_donkeys`** (worth having): walking slowly beside and a little behind a laden pack animal, the near arm
   stretched forward with the hand resting on the top of its load, the other hand holding a long thin switch out low
   behind, its tip trailing, the head turning to the animals. The two charcoal drivers. Stand-in: `walk` with `stick`.
   `walk_whip` is wrong here: it swings the whip in circles over the head, and the painted switches are held low.
3. *(optional)* **`beckon_lean`**: leaning sideways on a waist-high bar with one forearm laid along it, the other arm
   stretched far out level, the hand beckoning, calling to a child. `man_at_post_29812`. Stand-in: `hail` (the arm goes
   up, not out).
4. *(optional)* **`stand_sleeves`**: standing still with both hands tucked into the opposite sleeves at the chest
   against the cold, the shoulders a little hunched, the head turning. `farmer_by_hedge_34472`. Stand-in: `idle`. The
   soldier's `squat_sleeves` is the same hands squatting.

Everything else in S1 has a clip: `ride` (three riders), `sedan_carry` (the bearers), `carry_pole` (four porters),
`hold_rope`, `reach`, `bend_goods`, `crouch`, `drink`, `talk`, `point`, `look`, `idle`.

**Painted walkers** (short walks along the painted direction and back, `people.json`; the lead decides the two
directions below, which go against the scholars' titles):
- **the charcoal train, east-south-east** as painted (every readable donkey head is at the east end; the rear driver
  drives from behind), down toward the bridge's east end along `S1.road.main`'s path. 赶驴入城 ("into the city", west)
  is the scholars' title, not a stroke reading (map question 5);
- **the travellers, east** along `S1.road.path_30300`, as painted (both donkeys and the walker face east, away from the
  city), with the groom at the second donkey's head;
- **the runaway horse and its three grooms, west**, if the horse is built (below); otherwise the grooms hold their
  painted stride;
- the party's porters `porter_pole_31083` (200°), `porter_walking_31070` (250°) and `party_porter_staff_31131` (180°)
  only if the sedan is made to move; with S4's precedent they hold with it, and `porter_boxes_30908` and the rider
  stand facing east.

Everyone else acts in place.

## Animals: 13 (map IDs; built at real size)

The map's hoof spans are painted and foreshortened, so they give orientation only (the frame's checks: D4 0.95 m, the
travellers' donkey 0.87 m, the ox 1.00 m: real size fits).

**The charcoal train** (5 donkeys, `crop_charcoal_train.jpg`). All five are the registry **donkey** with its existing
**`pannier_charcoal`** tack (felt, pack saddle, two wicker panniers heaped with dark lumps). The painted panniers are
hatched like wickerwork with charcoal heaped at the top. Order from the front (east): D5, D4, D3, D2, D1.
- `donkey_charcoal_36745` (D5, med): the leader, coming toward us nearly end-on, its head lowered between the two big
  panniers (facing 290; other reading: its rump from behind); the east driver's hand rests on its load. Clip
  `walk_low` (new, below).
- `donkey_charcoal_36666` (D4, high): head raised, both long ears pricked, its muzzle against D5's west pannier; the big
  bare tree's trunk hides its middle. Facing 0. Clip `walk`.
- `donkey_charcoal_36508` (D3, med): a basket of charcoal on its back, its head and neck hanging low at its east end
  against the big tree's trunk. Facing 330. Clip `walk_low`.
- `donkey_charcoal_36410` (D2, med): two baskets heaped with charcoal on its pack saddle, its head hanging low. Facing
  330. Clip `walk_low`.
- `donkey_charcoal_36323` (D1, med): the last, in side view (the second pass), two bulging panniers, its head hanging
  low at its east end; the west driver holds his stick over its load. Facing 330. Clip `walk_low`.
- **New clip, free:** **`walk_low` on the donkey**, the head and neck hanging low while walking, as the horse's
  `walk_low` (procedural, no Meshy). Four of the five painted donkeys walk with their heads hanging.

**The travellers' donkeys** (crop `crop_travellers.jpg`):
- `donkey_traveller_30216` (high): the registry donkey, dark mane, pale muzzle, a white-ringed eye, walking east with
  its head held low, carrying `traveller_rider_30165` on a **`saddle_cloth`**; its tail hangs. Clip `walk_low` (or
  `walk`).
- `donkey_traveller_30546` (high): a donkey with a bristling mane walking east under `traveller_rider_30495`; its head is
  hidden behind the man leading it by a rope. Tack `saddle_cloth`, and a **lead rope** from its halter to
  `groom_leading_donkey_30648`'s hands (a builder's line, as S7's groom's). Clip `walk` (or `idle` if they stand).

**The party's horse:**
- `horse_party_31023` (med): a light-bodied **horse** drawn in dark outline, walking east, its head and bridle at the
  east end and its tail raised and flowing at the west end, a saddle cloth under `rider_party_30988`. Tack **`saddle`**
  (the registry's red cloth, girth, seat and stirrups), reins to the rider's hands. Clip `walk` or `idle`. Crop
  [30930, 260, 31040, 370].

**The runaway horse** (`runaway_horse_30075`, med; crop `crop_runaway_horse.jpg`, horse at [30070, 750, 30250, 870]):
a **horse** galloping west at full stretch, its hind legs flung out straight behind it. Only the back, the haunch, the
belly line and the hind legs survive; **the head, neck and forelegs are lost to damage** (a dark smudge where the
chest was). No saddle, bridle or load shows on what remains. Painted 95 px back to hoof, about its chasers' size.
- **Whether to build it whole is the user's question** (a `build_choices` item, as the brief says). Built whole, it is
  the registry horse at real size, no tack, with a new **`gallop`** clip (procedural on our rig, free; the rig has only
  `walk` as locomotion: `animals/notes.md`, "Open") or a held full-stretch pose. Not built, the three grooms chase
  nothing.
- The restyle's pack beast is invented.

**At the stall** (crop `crop_buffalo_ox.jpg`, [29340, 590, 29620, 800]):
- `water_buffalo_lying_29462` (high): **a big dark water buffalo lying** in front of the stall with its legs folded
  under it, its head at the east end raised and turned toward us, the horns curving back; no tack; 142 px long. One
  buffalo (the restyle's second is a willow trunk). **No buffalo in the registry.** The free route: a variant
  `buffalo` with `"body_from": "ox"`, a dark slate `tone` (about saturation 0.3, value 0.4) and a new kit-built
  **`horns_swept`** tack piece riding rigidly on the head bone (two long flat crescent horns sweeping back and up, as
  painted); clip `lie` (head up). If that doesn't read, a Meshy body from this figure (side view, 15 credits). Crop
  [29350, 670, 29505, 795].
- `ox_standing_29540` (high): a pale brown **ox** (yellow cattle), the registry ox with its yellow-dun `tone`, no tack or
  load, standing in front of the stall's east end facing us and a little west (250), its head lowered between its
  forelegs: clip `graze`. Outline only on the scan. Crop [29500, 595, 29610, 735].

**Far and doubtful:**
- `far_ox_29515` (low): a long low dark shape on the far field bank with two tiny figures beside it: an ox (standing,
  facing east, perhaps at the plough), or a small loaded cart, sledge or brushwood pile. If an ox, the registry ox at
  `idle`; tiny and far (v 110–145).
- `pale_bird_34250` (low): a small pale whitish-grey bird with a bluish top, upright in the crown of `elm_34110`
  (`perched`, H 7.25 m): a dove or an egret, or a pale abrasion of the silk. If a bird, the kit **bird** with a **pale
  palette variant** (free; the registry bird is the crow). Make nothing until the lead settles it.

What the registry lacks for S1, all free (no Meshy): the donkey's `walk_low`; the horse's `gallop` (if the runaway
horse is built whole); the `buffalo` variant (ox body, dark tone, the `horns_swept` tack); a pale bird.

## Vehicles: 2 on land (plus 1 boat below)

- **`sedan_willow_30805`** (high; `crop_sedan_party.jpg`, sedan at [30820, 410, 30960, 600]): **the willow-decked
  sedan** of the returning tomb-sweeping party, carried west-south-west (facing 205) by two bearers at shoulder height;
  no wheels; mapped 3.77 m between the poles' ends (real size fits).
  - **Kit:** `kit_vehicles.sedan_chair` with `carried=True`, as a **closed** box (no open door curtain: the box is
    closed and dark, its east side darker than its west face), a low roof with a knob finial.
  - **New decoration `willow_spray`** (the vignette's point, 杨柳杂花装簇轿顶): a big spray of about 6–8 long willow
    twigs fanning up and out to the west from the roof's west corner (30823–30873, v 415–487), more willow strands
    hanging down its west face (30840–30883, v 450–550), a few twigs standing at its east corner (30933–30950,
    v 433–467). Bare whips with a faint green haze, as the willows. The scholars add flowers (杂花); none can be told
    apart at this size, so none are built.
  - The restyle's jars, basket and the child under the poles are invented.
- **`barrow_tipped_29795`** (med; `crop_barrow.jpg`, [29650, 620, 29820, 710]): **a one-wheeled barrow (独轮车) lying
  tipped** on the open ground in front of the stall's east end, empty: a long tapering trough-like body lying slantwise,
  its pointed handle end to the west, a spoked wheel upright at the east (front) end under a curved frame. The wheel is
  drawn round (face on), so it may be tipped forward onto its nose rather than flat on its side (both readings).
  - **Kit:** new. `kit_vehicles`' barrows (the 串车) carry the wheel under the middle; this is a **front-wheel trough
    barrow**: a trough of boards tapering to the handles, two handles, a small spoked wheel (rim 36 px painted, about
    0.5–0.6 m real) at the front in a fork, a curved guard over it. Mapped 1.34 m (painted small); about 1.6–1.8 m real
    as a `choice:`. Built lying as painted, as a static prop. A generic `trough_barrow(front, rear, wheel, z_of, rng,
    tipped=...)` in the area kit.

## Boats: 1 (for the boat factory, `blender/kit_boats.py`)

- **`boat_sampan_36440`** (med; `crop_bridge_boat.jpg`, [36090, 970, 36660, 1240]): **a small open boat, empty**, afloat
  in the stream just south of the small bridge's west half (support `stream`, H −0.7; the second pass confirmed it
  floats). No crew, mast, cabin, awning, sweep, oars or cargo; one thwart near the east end.
  - **Ends:** a raised **square transom at the west end** and a raised **pointed east end**, tied to a thin upright pole
    in the stream bed at its pointed end (`S1.prop.mooring_pole_36444`). No rudder or sweep shows, so the bow rule can't
    be applied: `front` is the pointed east end (conf low).
  - **Kit:** preset **`small_open`** (`gen/boats/types.md` type 3, #17), `kind` set by hand in `build_choices.json`
    (`kind_of` would read "sampan" as nothing and fall to `passenger`). Mapped 2.97 m between its ends (painted small);
    the kit's small boat is 8.0 m on the waterline. Ask the factory for **`lw` 0.6** (4.8 m, the floor the lead set) and,
    if it can, a **pointed-bow option** for the small hull (the kit draws transoms at both ends). `moor` to the pole;
    it rides at its mooring. The stream is 14.3 m wide at the bridge and the bridge's span 6.55 m, so at 4.8 m it fits
    under the bridge's west half; check it clears the post feet (`S1.str.small_bridge_36365` `bays`).
  - The restyle draws it on dry grass 30 px off: not used.

## Props carried by figures

Existing props, new bindings only:
- **`stick`**: as the charcoal drivers' switches: `charcoal_driver_36797` (left hand, held out low behind, on `walk` and
  then `drive_donkeys`) and `charcoal_driver_36250` (right hand, held out forward over the last donkey's load).
- **`staff` on the shoulder** (the S7 attendant's placement on `carry_pole`): `party_porter_staff_31131` (the knobbed
  staff is right: a small knob at its top) and `traveller_staff_30357`.
- **`back_bundle`**: `traveller_staff_30357` (a dark curved bundle or cape at his back, about 0.25 × 0.8 m real), and
  `stall_man_29328` (a dark round bundle at the back of his right shoulder), on `carry_pole` and `talk`.
- **`pole_boxes`**: `porter_boxes_30908`, two tall dark boxes or baskets (or `pole_hampers` below).

New for S1 (geometry in `blender/char_props.py`, placements in `characters/props.json`):
- **`wind_hood`** (风帽): a padded hood that wraps the head and the neck and falls over the shoulders to the upper back
  like a short cape, the face open, in a dark or indigo cloth; bound to the Head bone with a cape skirt following the
  Spine (`follow` < 1 on `ride`). Both hooded riders: `traveller_rider_30165` (crop [30140, 1265, 30210, 1340]) and
  `traveller_rider_30495` (crop [30470, 1360, 30540, 1440]). It is the 迎寒策蹇 vignette's point (travellers bundled
  against the cold), and it saves a new character. S2's `veiled_hat` (帷帽, `canal_needs.md`) is a different hat.
- **`pole_basket_branches`**: a carrying pole with a round basket or round bundle at the front end and a long bundle of
  branches (or rolled paper offerings) hanging lengthwise at the back end, on `carry_pole`. `porter_pole_31083`; crop
  [31020, 410, 31130, 510].
- **`stick_bag`**: a short stick (about 0.6 m) held upright before the chest in both hands, a long dark bag or bundle
  (about 0.15 × 0.45 m) hanging from its top. `traveller_standing_29996`; crop [29975, 1285, 30070, 1405].
- **`hoe`** (锄): a long-handled hoe or rake, about 1.6 m, with a small hooked or forked iron head, over the right
  shoulder with the head behind, on `point`. `man_with_stick_29205`; crop [29160, 925, 29250, 1050].
- *(optional)* **`hat_on_back`**: a broad round straw hat hanging at the back of the shoulders on its strings, flying a
  little, on `run`. `groom_chasing_30353`; crop [30315, 665, 30390, 710]. Its other reading is `back_bundle`.
- *(optional)* **`pole_hampers`**: two tall dark lidded food boxes (食盒) on a pole across the shoulders.
  `porter_boxes_30908`; crop [30868, 245, 30940, 310]. `pole_boxes` (slatted cages) is close enough to stand in.

## Kit parts the area needs (what exists, what is new)

S1's parts go in its own area kit, `blender/kit_countryside.py`, as generic functions that take positions from the
caller; shared kits are imported, never edited. `build_rules.md` step 4 gives S1 its own set pieces: the thatched
farmhouses, the threshing floor, the fences and the fields.

**The thatched farmhouse (the set piece; 10 of S1's 14 buildings are thatched, 11 if the long farmhouse is).** One generic builder covers them all:
footprint and eave from the map's points, a thick rounded straw roof with a ragged fringe at the eave, long axis along
or across the scroll, optional **gablet** (歇山 in thatch: a small pale gable vent near the ridge with a king post),
plastered wattle walls (mostly hidden behind fences) and a door. `kit_outer_road.thatch_roof` (round, hip, fringe),
`thatch_hut` and `thatch_shed` are the base; the gablet with its king post is `kit_outer_road_2.kingpost_gable` scaled
down. New: the gablet on a thatch roof; a single-slope thatched lean-to; a thatched skirt. The houses:
- `stall_shed_29600`: the village stall, a long thatched hip roof on posts, open front, the front eave a dashed row of
  hanging thatch ends, a lattice fascia under the eave between the posts at 29486–29599 (the second pass: the slats over
  the counter are this lattice). Crop [29250, 400, 29830, 670]. `thatch_shed` + `kit_inner_city.lattice_frame`.
- `stall_annex_29350`: a lower roof at the stall's west end over the seated customer (a lean-to or a lower wing; the
  builder makes the step). New thatched lean-to.
- `stall_back_shed_29860`: a smaller thatched roof behind the stall's east end, its eave a row of hanging thatch ends,
  no wall drawn under it (open, or a pale wall). `thatch_shed`.
- `hut_thatched_31000`: a small thatched hip-roofed hut behind its tall wattle fences, the walls hidden. `thatch_hut`.
  Crop `crop_hut_shed.jpg`, [30700, 920, 31460, 1350].
- `shed_posts_31370`: an open shed of bare posts under a low flat or lean-to roof of brush or thatch, no walls, on a
  small raised yard; under it the tied jar and the basin (props). New thatched lean-to on posts.
- `farmhouse_back_33450`: a low thatched house, a rounded ridge, a pale patch under the eave that may be a doorway.
- `farmhouse_gable_33670`: thatched hip-and-gable, its small gable (a pale triangle with a king post) facing west, the
  ridge running east to a knob.
- `farmhouse_thatched_33955`: the biggest, a thatched hip-and-gable **seen gable-on** (its long axis runs north into the
  picture), the vent near the top, the thatch sweeping down both sides, a thin corner post under its east hip (the
  second pass: `post_se_top`); its east part may be a lean-to.
- `farmhouse_thatched_34600`: a thatched house with a high rounded roof and a ragged fringe, a lower west wing.
- `barn_open_34860`: the clearest building of the farmsteads, an **open-fronted thatched barn seen gable-on**: a small
  pale gable vent with a king post at the top, a long ragged thatch fringe at the eave, an open front on three posts.
  Crop `crop_farmhouses_east.jpg`, [34460, 480, 35320, 940].
- `farmhouse_long_34950`: a long low house behind the barn with a small hip-and-gable end to the west (a king post), its
  east part open on a few posts over the threshing floor. **Roof: thatch or tile, open** (the second pass leans to tile:
  a crisp double eave and rows of small scalloped marks, no ragged fringe). Build it one way after the lead decides.
- `far_roof_34840` (low): the top of a tall hip-and-gable roof in grey wash rising behind the long farmhouse; only its
  top shows (a far building, or the long house's upper storey).

**The tiled farmstead at the field** (`farmhouse_hall_30200` + `farmhouse_wing_30190`, crop `crop_hall_wing.jpg`,
[29950, 880, 30420, 1210]): **tiled**, the only tiled buildings in S1 (the scholars' "thatched farmhouses" don't hold
here).
- The hall: a long tiled roof with ridge tiles, its west end a hip-gable; under its west eave an **open veranda** with
  posts and a **railing of short balusters** between the corner post and the next, a curved bracket between the posts,
  the floor line about 1 m below the eave (the painted hall is tiny: veranda posts 50 px, under the 105–145 px figures
  near it). `kit_inner_city.xieshan_roof`, `song_kit.balustrade`, posts.
- The wing: a big tiled roof coming down low over **a wall of vertical boards**, painted turned about 45° to the scroll,
  its nearest corner toward us; its two faces fit no rectangle under any receding direction, so its plan is the
  builder's `choice:`. New: a vertical board wall (planks with battens and ragged feet).

**The small plank bridge (草桥)** (`small_bridge_36365`, high; crop `crop_bridge_boat.jpg`): a long low flat bridge, 6.55 m
span, on thin wooden posts (ten feet mapped in the water, their pairing unreadable), its deck **covered with brushwood or
turf** (rough dotted strokes along the top), no railing; the west third ramps up off the bank, both ends meet the bank
tops level (deck H 0), the deck about 0.5–0.7 m over the water. New `turf_bridge(deck_s, deck_n, posts, z_water, rng)`:
round posts, cross beams, a deck of poles under a turf-and-brush top with ragged edges. `kit_outer_road.humped_bridge`
(with `brush`) and `song_kit.trestle` are the nearest.

**The threshing floor and its things** (寂静的谷场, pin 2: idle, nobody threshing):
- `S1.grd.threshing_floor_35225`: smooth pale packed earth east of the barn, empty but for a bench and a forked pole
  (painted 5.0 × 2.9 m, built at real size as a `choice:`, about 10 m across); the route runs through its south part.
- `S1.grd.floor_behind_yard_34285` (low): a second smooth floor behind the yard's rail, where the roller stands (a second
  threshing floor, or plain open ground).
- `roller_frame_34158` (low): **a stone roller (碌碡) in its pale wooden drag frame**, a dark round stone held in a frame
  curving round its west side, a short peg at the top, a squared bar sticking out at the bottom east; idle. Other reading:
  a man carrying a wheel (no head or feet show). New `stone_roller`. Crop `crop_yard_roller.jpg`, [34120, 685, 34200, 770].
- `haystack_34080` (low): a domed haystack (草垛) with a smooth top and a straight west side at the floor's edge (the
  second pass found no post or eave). New round `haystack_dome`; `kit_outer_road_2.straw_heap` is a long low lens.
- `bench_35133`: a low plank bench on block legs (`kit_inner_city.bench`); `long_plank_shed_35060` (low): a long low
  plank (a bench or a trough) under the shed; `jar_shed_35058` (low): a small dark jar or basket under it
  (`kit_outer_road_2.big_jar`, small); `straw_strip_35206` (low): a long broom or rake laid down, or a strip of swept
  straw (a thin `straw_heap`, or a new `tool_on_ground` kind `rake`).
- `S1.str.posts_35075` (low): a thin post and a taller forked pole on the floor's north edge, a beam perhaps joining their
  tops: a frame, or an open thatched lean-to (t6's reading). Its east post is now the figure in the shed.

**Fences and hedges** (never ruled lines: every stake leans and stands differently):
- `wattle_fence_31100` and `wattle_fence_30760` (high): **tall woven wattle fences** round the hut, upright stakes with
  spiky tops bound by two horizontal withies, about 145–225 px tall (1.8–2.2 m real as a `choice:`); a gateway gap at
  30812–30917 with a thin gate post and a loose hurdle lying beside it (`gate_post_foot`, `gate_post_top`). New
  `wattle_fence(pts, h, rng, bindings)`; `kit_outer_road.stake_crest` is the nearest.
- `fence_brush_33760` (low), `fence_brush_34660` (med): **brushwood fences** of dense crossed hatching along the front of
  the farmsteads, 60–110 px tall, hiding the houses' walls. Readings: a brushwood fence or a hedge; west of u ~33780 the
  "hump" may be the west hip of a low thatched roof (second pass). New `brush_fence(pts, h, rng)`.
- `hedge_yard_34265` (low): a low hedge closing the yard, rising into a taller clump on its east; the second pass reads
  its east clump as **bushes** (rounded leaf-dab clusters, no stakes). A hedge of low bushes along a line: one wide
  **`leafy` row card** instanced along the foot line under one ID, the same card S2 asked for (`canal_needs.md`,
  `shrub_row_22805`).
- `rail_34170` (low): a long low bar at the back of the yard (a rail or low wall; or a log or trough lying down).
  `kit_outer_road.low_rail_fence` with one rail.

**Other props on the map** (built in the area kit; existing parts named):
- At the stall: `stall_counter_29430` (`kit_inner_city.counter`, 116 px long, its depth not drawn);
  `stall_table_small_29285` (`song_kit.table`, low); `round_basket_29430` (a wide shallow basket or feeding trough on
  the ground with a short handle or tether running east: `kit_outer_road_2.sieve_basket` without its stand);
  `hanging_bundle_29198` (low; a small bundle, a string of straw sandals or gourds hung on the willow trunk:
  `kit_outer_road.hanging_gourds` or a bundle); `pale_board_29172` (low; a narrow pale upright board with a hooked top
  between the two willows: a blank sign or banner, or a post of a lean-to; no writing is painted, so none is built).
- `post_crossbar_29862`: **a tall post with a cap-like crosspiece and a two-pronged fork at its top and a bar through it
  at waist height** (a hitching post, or a well's upright and windlass bar), 1.5 × the man beside it, about 2.5 m real.
  New `post_crossbar`. Crop `crop_post_child.jpg`, [29640, 900, 29920, 1150].
- Under the shed on posts: `jar_tied_31298`, **a large earthenware jar with a cloth tied over its mouth**
  (`kit_outer_road_2.big_jar` + a tied cloth cover, new); `basin_31373`, a wide shallow round basin or low tub with a
  rim (`kit_inner_city.tub`, low, or `sieve_basket` on its stand). Crop [31265, 1095, 31415, 1175].
- `trestle_hut_gate_30841` (low): an A-frame of two crossed sticks with a short crossbar, in the hut's fence gap (a
  sawhorse). New tiny part.
- At the farmhouse front (all low; each also has a fence reading): `slatted_box_34960` (a crate or hen coop with
  horizontal slats: `kit_outer_road.slatted_box`, `slats='h'`); `crossed_poles_34925` (a low frame of crossed poles: a
  trestle, drying rack or harrow; new); `stack_34858` (stacked baskets, boards or firewood: `song_kit.bundle_pile` or
  `kit_outer_road_2.timber_pile`).
- In the yard (low): `yard_object_34208` (a low trough or flat basket with two thin sticks above it, or a hen) and
  `yard_object_34170` (a low dark basket or heap, or a hen or a lying dog). Build them as baskets unless the lead reads
  hens.
- **Four crow's nests** (`nest_33900` low, `nest_34445`, `nest_34680`, `nest_34757` med): dark tangled twig clumps in the
  forks of the bare elms, `perched` at their tree's depth (H 8.96, 6.90, 7.73, 7.73). No bird is painted on them. New
  `nest` (a loose ball of dark twigs, about 0.5 m real), placed at the map point, not part of the tree card.
- `leaning_pole_37075`: a straight cut pole leaning across the slender tree's trunk, its foot against the big forked
  elm's trunk (`kit_inner_city.leaning_poles` with one pole).
- `mooring_pole_36444` (low): a thin upright pole in the stream bed at the sampan's east end (thinner than
  `kit_outer_road_2.mooring_post`: a plain tapered pole).
- `reed_or_stake_32882` (low): one tall reed stalk or a thin stake on the open ground. Build a thin stake, or nothing if
  the lead reads a reed (ground texture).

## Set pieces

- **The thatched farmhouse** and **the threshing floor** (with the roller and the haystack): S1's own, in
  `kit_countryside.py` (above). They are the round's two countryside set pieces; S2's 望楼饭铺 (`canal_needs.md`) and
  S4's thatched hut and shed (`kit_outer_road`) use the same thatch, so the gablet and the lean-to are worth making
  generic.
- **The small plank bridge** (草桥) and **the wattle fences**: S1's own.
- **The vegetable field (菜地, pin 5)**: on the strokes **a raised plot planted with young bare trees**, 13 trunk feet
  and a faint fourteenth, each its own tree entity (the second pass counted them on column profiles), not rows of
  vegetables. Crop `crop_vegetable_grove.jpg`, [29520, 1150, 30010, 1430]. Whether it is a grove of saplings or a crop is
  the user's call (the scholars' "青铜海" reads it as greens); the map builds 14 young trees on a raised bed.
- Not in S1: the Rainbow Bridge, 十千脚店's 彩楼欢门, the 望火楼.

## Trees: 87, by form (`trees/types.md`; all bare or budding, early spring; the restyle leafs every willow, the scan doesn't)

Mapped heights are the painted heights at the frame's one scale. The count matters to the user ("even to the amount of
trees"): 16 trees are `conf: low`, each kept with its reason in its note. The tree factory owns `trees/assign/S1.json`.

- **`willow_burl`, 13** (隋堤烟柳, the landmarks; crop `crop_great_willows.jpg`, [31350, 250, 33150, 1650]):
  - the great willows on the dyke: `willow_burl_great_32620` (**16.86 m**: the largest tree of the countryside, a
    massive moss-dotted bole 150–200 px wide leaning west, knobbly roots running east along the ground like rocks, a
    fountain of whips), `willow_great_burl_32065` (**15.69 m**: big swollen burls on its east side, roots spreading like
    rocks, a dome of fine twigs), `willow_burl_forked_32448` (12.75 m, forks into two clubbed heads),
    `willow_great_31620` (12.18 m, a big hollow "eye"), `willow_great_31910` (11.75 m), `willow_great_31715` (11.23 m, two
    knobbly stems), `willow_burl_leaning_east_32805` (9.94 m, leaning east, whips sweeping far east);
  - `willow_leaning_hut_31240` (12.1 m, crown 13.5 m: a huge low **hollow bole** leaning hard north-west across the hut's
    fence, whips fanning over the hut's roof) and `willow_burl_29090` (13.34 m, at the bottom-left corner by the S2 seam,
    buttress roots, its crown over S2);
  - four far pollards drawn small at the top: `willow_far_31505` (5.78), `_31443` (4.99), `_31245` (3.47), `_31190`
    (2.99, one long limb west along the top edge).
  - **The cards are 8–10 m and S1's great willows are 10–17 m.** New cards worth asking for: **a massive burled bole with
    rock-like root lobes and a dome of whips** (32620, 32065), and **a bole leaning hard north-west with a dark hollow**
    (31240). The rest take `_1`–`_3` scaled.
- **`elm_claw`, 21** (bare elms with crab-claw twigs; the farmhouse grove and the start): `elm_bare_37140` (7.34, forked
  low into three limbs), `elm_bare_36660` (9.39, leaning north-west at the bridge's east end, a long low limb over the
  train), `bare_elm_tall_36070` (11.43, slender, the highest crown), `bare_elm_twin_35920` (10.32, two stems),
  `bare_elm_35840` (8.64), `bare_elm_tall_34703` (8.86, two nests), `bare_elm_twin_34640` (6.7), `bare_elm_twin_34552`
  (8.62, a nest), `elm_34110` (7.83), `elm_spreading_34030` (6.19, two long level limbs east over the yard),
  `elm_twin_33936` (6.75, one stem leaning far north-east across the roof), `elm_slender_33906` (9.35, a nest),
  `elm_forked_33785` (8.66), `elm_33592` (5.52), `elm_tall_33552` (7.42), `elm_forked_33433` (6.75), and five far bare
  elms at the top behind the great willows: `far_bare_elm_33061` (3.69), `_33009` (3.68), `_32932` (3.82),
  `far_bare_leaning_32628` (5.88), `far_bare_elm_32510` (6.3). **Eleven of them stand within about 17 m in front of the
  farmhouses**, so four cards will repeat visibly; worth asking for **a twin-stemmed elm card** (four of S1's elms have
  two stems from one foot) and **a tall slender-trunked elm with a small high claw crown**.
- **`slender`, 19:** the **pale grove of seven slender fan-headed trees** behind the bare elms (`grove_fan_35485`,
  `_35535`, `_35593`, `_35632`, `_35678`, `_35785`, `_35823`; 5.8–8.2 m; card `_3`, a young willow with a small head of
  rising shoots); `slender_bare_37018` (7.92, its crown bent west: card `_2`); `elm_tall_33865` (9.75, a long straight
  trunk with a small claw crown: `_1`); the pale trunks `pale_trunk_34474` (5.23) and `pale_trunk_34412` (5.1, low); the
  far trees `far_slender_32866`, `_32786`, `_32753`, `far_slender_faint_32717` (low), `far_twin_stem_32838` (3.4–4.4 m),
  `far_pale_33455` (low), `far_pale_33720` (low, no height: its crown is a few claw twigs) and `far_tree_top_29428`
  (1.88, cut by the top edge).
- **`willow_fan`, 16:** the stall willows `willow_stall_a_29178` (6.26), `willow_stall_b_29262` (6.9; both have heavy
  dark boles, `willow_burl` would also do) and `willow_stall_c_29300` (6.45, leaning steeply across the stall's front);
  `willow_east_29845` (6.47); `willow_twin_29970` (6.08, twin stems: `_3`); the pair above the chasers
  `willow_fan_30632` (5.44) and `_30712` (5.06); `willow_pollard_35128` (4.78, a big knobbly pollard head over the
  threshing-floor shed, shoots arching over and hanging east); and eight far crowns: `far_willow_top_29290`,
  `willow_far_30500`, `far_willow_34995` (low), `far_crown_35150` (low), `far_crown_35990` (low), `far_crown_36070`
  (low), `far_fan_tree_36300`, `far_fan_tree_36465` (pale far trees: willow or pine-like, both readings).
- **A new form, `sapling`, 15:** the **14 young bare trees of the 菜地** (`young_bare_29558` … `young_bare_29968`,
  1.1–2.7 m, a thin dark trunk with a small, twiggy, angular crown of crab-claw twigs, 0.3–1.6 m across; a close grove on
  the raised plot) and `sapling_far_31328` (low, 0.79 m: a sapling, a post or a stump). `elm_claw_4` (a 4 m young elm
  with a low spreading crown) scaled to 2 m would read as a miniature tree; two small cards (a single stem, a stem that
  forks) keep the grove from repeating. The count of 14 is the second pass's (column profiles), against "25–35 plants"
  by eye.
- **`shoot_tree`, 1:** `far_tree_top_30297` (low, 0.75 m: a small far tree at the top edge, fans of fine twiggy branches,
  cut by the edge).
- **Far bushes, 2:** `far_shrubs_30860` and `far_tree_30985` (both low, 0.32 m: dark knotted blotches along the silk's
  top edge, far shrub crowns on a distant ridge). `whip_clump_1` or the `leafy` card scaled, or a small dark far-bush
  card.

New cards worth asking for: **`sapling`** (2 cards); **`willow_burl`**, the massive rock-rooted bole and the hollow bole
leaning hard north-west; **`elm_claw`**, twin-stemmed and tall-slender; the **`leafy` row card** for the hedge (shared
with S2).

## The ground (the pilot): what the builder needs

S1 maps the countryside ground first: 47 `grd` entities, 5 roads, 2 water. The user signs off the ground built from
them before the other open stretches are built the same way. Every band is a bank one step higher to the north; the
frame maps every bank line at H 0 (one level), because a band's face mixes depth and height and nothing beside a bank
gives its rise, except the stream's banks (0.7 m at the bridge). So:

- **A terrain builder in `kit_countryside.py`:** level terraces between banks, each bank a soft face lofted from its
  `bank_top` line down to its `bank_foot` line, its rise a recorded `choice:` per bank. The steps that matter for the
  walk: the willow dyke under the great willows (`S1.grd.bank_31660`, about 45 px over the route), the hut's bank
  (`bank_30750`), the yard bank in front of the farmsteads (`yard_bank_34400`) and the stream's banks (0.7 m, measured).
  Whatever stands on a bank top (the great willows, the hut and its fences, the shed on posts) goes up with it,
  together. Edges broken and irregular (the user's rule: no tiles, no straight lines). The ground stops 0.5 m past the
  S2 seam and dips 0.12 m there, and runs 16 m out under the mist at the east, north and south edges.
- **Fields:** the far banked fields at the top of the silk (`terraced_fields_29450`: level strips every 30–40 px of v,
  with the diagonal raised path `S1.road.path_29640` across them; `banked_fields_30400` behind the chase field) as low
  terraces with earth ridges, bare (early spring); `field_30430` a slightly raised plot with a ridge of clods along its
  north edge; the 菜地 (`field_vegetable_29790`) a raised bed with soft edges and soil, its 14 saplings on it.
- **Rocks:** `rocks_34620` (high: a pale outcrop with dark crack strokes, cun, rising in a dome from the near bank) and
  `rocks_34360` (lower broken stony ground): `song_kit.boulder` / `earth_mound`; `rock_29745` (a pale pointed upright rock
  about 90 px wide and 160–180 px tall at the 菜地's corner): a tall boulder.
- **Paths:** the trodden-earth walk `S1.road.main` and the paths (`path_30300` the travellers', `path_30950` the party's
  track, `path_36380` over the bridge) are painted as open ground, never with edges: a worn, paler band in the ground
  texture, not a ruled strip.
- **Room to walk:** the route's strip is 6–9.5 m deep in the village but only **0.88–1.07 m under the great willows**
  and **0.84–1.1 m in front of the farmsteads**, where **nine tree feet stand inside it** (`elm_forked_33433`,
  `elm_forked_33785`, `elm_tall_33865`, `elm_slender_33906`, `elm_twin_33936`, `elm_spreading_34030`,
  `bare_elm_twin_34552`, `bare_elm_twin_34640`, `bare_elm_tall_34703`). The walkable line weaving between the trunks,
  or moving onto the yard bank's top at v ~945–950, is the lead's call, recorded in `build_choices.json`.
- **Water:** the stream (`S1.water.stream_36500`, `stream` H −0.7) from `kb.water_strip(entity, frame, id, layout=L,
  seams=("west",))`, its shores from the map; the bridge's posts and the sampan stand in it; the four land tongues and
  the shoal sit at the water's level with their backs raised a little (a `choice:`); the bank feet on the shore stand on
  `stream` (`support_by bank_foot`). **The pale band (`S1.water.wash_band_34400`, conf low) is water or bare ground: the
  user's question.** The map records it as water; if the user takes ground, `merge_fixes.mjs` section 9 (d) changes in a
  few lines. Build it one way only after that answer.
- **Ground swatches** (palette atlas; KTX2 after): bare packed earth with clods; the ink-wash bank face (darker, streaked
  along the bank); the pale smooth threshing floor; trodden path; field soil with ridges; moss dots on old ground (the
  merge settled several blots as moss dots, which get no entity). **No grass tufts** (`map/BUILDING.md`: no filler).

## Also (not the workshop's list, for the lead)

- **The receding direction:** S1 has no ground-level receding edge; the frame holds S2's −51.6 to the silk's end. If you
  take S2's option B, one rerun of `scratchpad/S1_frame/mkframe.mjs` makes S1's knot +46.6 (far things move 38.9 m west
  at the silk's top). Nothing in this list changes with it.
- **Directions as painted against the titles:** the charcoal train walks east (赶驴入城 says west); the travellers ride
  east; the party's rider, his horse and the porter with the boxes face east while the sedan goes west. All recorded as
  painted; the routines are your call.
- **The runaway horse** (front half lost): built whole or not is the user's question (`build_choices`).
- **Open readings that change the build** (both readings in each entity's note): the long farmhouse's roof (thatch or
  tile); `fence_brush_33760`'s hump (fence or a low thatched hip); `posts_35075` (posts or a lean-to); the second floor
  behind the yard; the far figures and the far ox (figures beside an ox, or a ploughman); the yard objects (baskets or
  hens); the pale bird; the 菜地 (saplings or a crop); `sapling_far_31328`; `far_willow_34995`.
- **Pose words:** `running` (the three grooms) and `galloping` (the runaway horse) are not in `map/README.md`'s list; they
  are kept as painted.
