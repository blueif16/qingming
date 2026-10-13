# S1 `countryside` (u 29050–37610): Run 1 report

Round 2 mapping, 2026-10-12. Restyle, map, merge, second pass, frame, layout and needs are done; Run 2 (build) waits for
the lead.

**Files:** `map/strokes/S1.json`, `map/frames/S1.json`, `map/world/S1.json`, `map/text/S1.md`; `gen/map/S1/` (brief,
parts, reports, `merge_fixes.mjs`, `merge_notes.md`, `second_pass/{west,willows,farms,start}.json`,
`overlay_29050_37610.jpg`, `plan.jpg`, `look/`); `sections/countryside/` (`notes.md`, `layout.json`, and the two restyle
halves `west/section.json`, `east/section.json`); the restyle in `gen/sections/countryside/{west,east}/`;
`gen/expand/countryside_needs.md`, `gen/expand/countryside_lessons.md`. Scripts: scratchpad `S1_*` folders (the frame's
in `S1_frame/`, the needs crops in `S1_needs/`).

## For the lead first

1. **The receding direction.** S1 has no ground-level receding edge anywhere (every unit and the frame agent searched).
   The frame holds S2's seam value, `[29050, −51.6]`, to the silk's end. It rests on S2's option A. If you take S2's
   option B, rerun `scratchpad/S1_frame/mkframe.mjs` (it reads S2's frame), then `scroll_map S1 all` and
   `map_layout S1`: S1's knot becomes +46.6 and far things move 38.9 m west at the silk's top, 13.9–20.8 m on the route.
   A frontal dx 0 would move them 20.4 m and 7.3–10.9 m.
2. **Nine tree feet stand in the route's strip in front of the farmsteads** (u 33400–34750, a strip 0.84–1.1 m deep):
   the walkable line weaves between the trunks, or the centre moves onto the yard bank's top at v ~945–950. A
   `build_choices.json` call.
3. **The pale band** (`S1.water.wash_band_34400`, conf low): water or bare ground is the user's question for the ground
   pilot. It is recorded as water; if it is ground, `merge_fixes.mjs` section 9 (d) changes in a few lines.
4. **Directions as painted against the scholars' titles:** the charcoal train walks east-south-east (赶驴入城 says west;
   every readable head is at the east end and the rear driver drives from behind); the travellers ride east; the party's
   rider and the porter with the boxes face east while the sedan goes west. The routines in `people.json` are yours.
5. **The runaway horse's front half is lost** to damage: building it whole (with a `gallop` clip) or not is the user's
   question.
6. **Bank rises** are left to the ground pilot (every bank maps at H 0). The ones that matter for the walk: the willow
   dyke (`bank_31660`), the hut's bank (`bank_30750`), the yard bank (`yard_bank_34400`).
7. **Pose words:** `running` and `galloping` are not in `map/README.md`'s list.

## Counts (244 entities after the merge, the second pass and the frame; `check` PASS, no warnings)

| kind | n | conf low | notes |
|---|---|---|---|
| figures | 30 | 8 | 27 on the ground, 3 riding; the low ones are 5 tiny far figures, the stall customer, the bending farmer, the figure in the shed |
| animals | 13 | 2 | 5 charcoal donkeys, 2 travellers' donkeys, the party's horse, the runaway horse, a water buffalo, an ox, a far ox (low), a pale bird (low) |
| vehicles (land) | 2 | 0 | the willow-decked sedan, the tipped barrow |
| **boats** | **1** | 0 | the empty sampan by the small bridge (med; afloat on the stream) |
| trees | 87 | 16 | 21 elm_claw, 19 slender, 16 willow_fan, 15 sapling (the 菜地's 14 + one far), 13 willow_burl, 2 far bushes, 1 shoot_tree |
| props | 27 | 16 | 4 crow's nests; the roller, the haystack, the stall's furniture, the tied jar and basin |
| buildings | 14 | 2 | 10 thatched (11 if the long farmhouse is), 2 tiled (the hall and its wing), 1 far roof |
| structures | 8 | 4 | the plank bridge, 2 wattle fences, 2 brushwood fences, a hedge, a rail, posts |
| roads | 5 | 3 | `S1.road.main` (the walk) and 4 paths |
| water | 2 | 1 | the stream (med), the pale band (low) |
| grd | 47 | 25 | banks, far fields, the 菜地's plot, the threshing floor(s), a yard, rocks, land tongues, a shoal |
| groups | 8 | | the stall, the runaway horse, the travellers, the tomb-sweeping party, the charcoal train, the farmyard, two far field groups |

The ten units gave 239. The merge (237) spliced the road's join piece into `S1.road.main`, retired four duplicates in
disguise (a rock read as a prop, a dome read as a roof, a bush belt read as two "trees"), folded t1's old-man group into
the runaway-horse group, and added what each side left to the other (three crow's nests, the dark slope before the pale
grove; the forked pole became a post of `S1.str.posts_35075`). The second pass added 7 (the 菜地's fourteenth tree, a far
tree both tiles left, the banked far fields, a far slope, a far willow, the floor behind the yard, the mooring pole). The
restyle's crowds round the charcoal train, the second traveller and the farmyard are not in the strokes.

## The frame (`map/frames/S1.json`)

- **Seed:** S5's origin (8248, 1565), 77 px/m across and in height, 51.25 px of v per metre of depth; covers u
  28900–37610.
- **Knots `[[29050, −51.6]]`:** the seam knot is S2's dx at u 29050 (its last knot [28121, −51.6], constant beyond), held
  to the silk's end. **No measured knot.** Rejected candidates: the hall's west hip (−1.20, dx +43: a hip), the stall's
  east hip (+0.85), the farmhouse wing's two wall feet (+0.44 and −0.34: no single dx), the shed on posts' post pair
  (+0.51, dx −100), the bridge's post pairings (+0.76 or −0.41: pairing unreadable), the stream bank's waterline (−2.1,
  dx +24: it curves), the tipped barrow, the far raised path, the sedan's poles. The two post pairings that can be read
  lean up-left, the sign of S2's east knot. Checks: the bridge's deck runs at 3.4° and the hut's wattle fence at −0.9°
  (both expected about 0); no wall recedes, so nothing is checked at 90°.
- **Datum:** `S1.road.main:lines.centre.0` = scan (29050, 730), exactly `S2.road.main`'s last centre point (copied from
  S2's strokes by `merge_fixes.mjs` on every run), world (281.07, 16.29), **station +314.87** (S2's). The route runs to
  +442.58 (127.7 m), stations increasing; its est east end is the seal's west edge, (37390, 1005).
- **Painted area:** sw (267.21, −4.39), se (378.38, −4.39), ne (401.79, 30.54), nw (290.62, 30.54); the west corners equal
  S2's se and ne exactly.
- **Water level:** `water` −0.7 is copied from S4b's frame to keep one level in the joined world; the 汴河 does not reach
  S1 (S2's river turns south at about u 28968), and nothing in S1 stands on it. **The stream has its own support,
  `stream` H −0.7, measured** at the bridge: the deck's south edge over the post foot straight below at u 36540 (54 px,
  −0.70) and 36352 (52 px, −0.68), and the west bank's top over its waterline (58 px, −0.75). That it equals the
  汴河's value is a coincidence of two readings.
- **Other supports:** `ground` 0; `bank slope` (an `H_profile`, −0.38 and −0.59, where the two big elms' feet sit on the
  stream's west bank face); four `perched:` keys (the nests and the pale bird, H 6.90–8.96 at their trees' depth); the
  three riders on their animals (H 0). Nobody stands on the bridge and nobody is painted in the sedan, so there is no
  `small bridge deck` and no `sedan:` support.
- **Real-size checks:** the bridge's span 6.55 m, the stream 14.3 m wide at the bridge; D4's hoof span 0.95 m, the
  travellers' donkey 0.87, the ox 1.00, the sedan 3.77, the shed on posts' eave 2.27, the hut's eave 2.01, the great
  willow G1 12.2: real size fits. Painted small: the stall shed's eave 1.58 m and front 5.9 m, the hall's eave over its
  veranda 0.65, the big farmhouse's eave 1.34, the barn's eave 0.91 and front 4.1, the threshing floor 5.0 × 2.9, the
  sampan 2.97, the gate post 0.65 (built at real size, rule 5).
- **Diminution** (painted height over life): 0.29–0.35 at foot v 141–145 (the far field figures), 0.63–0.76 at v
  329–448 (the party's porters), 0.81–0.91 at v 541–683, 0.65–0.97 at v 766–925 (the charcoal drivers 0.65 and 0.74),
  1.10–1.15 at v 1095–1114, 1.35–1.49 at v 1476–1627 (the travellers). Not one curve.
- **The route's strip:** 6.0–9.5 m in the village, 1.8–4.4 at the hut, **0.88–1.07 under the great willows**, **0.84–1.1
  in front of the farmsteads** (nine tree feet inside it), 1.5–1.9 on the threshing floor and by the grove, 1.5–2.2 on
  the train's path, 0.86–1.27 at the east end. The bends at 30400–30720 and 32000–32800 turn across the depth.

## What was hard to read

- **The silk itself:** S1's silk is dark, faded and worn; above zoom 3 its weave breaks the strokes. The units read at
  zoom 1.3–2.5 with per-channel stretches, grey high-pass, red-channel and blur-then-stretch crops, and settled trunk
  feet, field lines and wash edges on darkness profiles (`countryside_lessons.md` §1).
- **No receding edge** anywhere (above).
- **Water against ground:** the stream is certain only round the bridge (posts and a boat stand in it); the pale band
  west of it is water or a low flat (the user's question); the restyle dries every band.
- **The runaway horse:** only its back, haunch, belly and hind legs survive; three grooms run after it, one hidden from
  the waist down by willow whips.
- **The charcoal train's direction and views:** D1 and D5 looked end-on; the second pass read D1 as a side view from its
  legs and D5's head between its panniers. Every readable head is at the east end.
- **The 菜地 (pin 5):** "rows of small plants" by eye are 13 young trees and a faint fourteenth on column profiles.
- **The farmsteads:** thatch against tile on the long farmhouse (open), brushwood fence against hedge (the yard's east
  clump is bushes), the hump at 33400–33540 (a fence or a low thatched hip), the dome (a haystack, no post), the roller
  (a roller in its frame, or a man with a wheel), and the figure under the shed, which was also recorded as a post.
- **The far fields and far figures** at the top of the silk: five tiny figures and a far ox (or a cart or a pile), all
  low; two field lines sat 8–17 px off their strokes and five were missing until the second pass.
- **The trees:** crossing bare elms at the bridge, the interlaced crowns of the great willows (whips assigned by the
  heads, extremes `est`), far groves whose feet are hidden (a foot line from the trunks that show), a pale far willow
  folded into a near one's note, and silk creases the restyle drew as trunks.
- **The seals** at the start: measured from their red pixels (u 37248–37584 in four boxes); lines that stopped "under a
  seal" were run on to the boxes they really meet.
- **The sampan's bow:** no rudder or sweep is painted, so the lead's bow rule can't be applied (front = the pointed east
  end, conf low). The line at its end is a mooring pole, not a rope to the bridge.

## Seam notes, by S2 ID (S2's files were not edited; details in `gen/map/S1/merge_notes.md` and the frame's questions)

- **`S2.road.main`:** its last centre point is S1's datum, (29050, 730), with its edges 695 / 1000; S1 copies all three
  on every run, so the route's three points are equal.
- **`S2.grd.bank_lines_top_28900`:** its `edge_n` ends at (29050, 150), and S1's `terraced_fields_29450` `edge_v155` now
  starts there exactly (it was 2 px off): one stroke split at the seam. Its `edge_s` ends at (29050, 192, est) with no
  S1 line east of the seam (its note says the stroke runs to 29073).
- **A far field line S2 did not record:** the curve (29000, 81) → (29050, 106), confirmed on a line profile; S1's
  `edge_v128w` continues it east from (29050, 110). S1's `edge_v57` runs west of the seam to about (28960, 58), where S2
  has no line.
- **`S1.tree.willow_burl_29090`** (base (29090, 1782) est, S1's by its base; S2's t12 read (29070, 1785) and did not
  record it): its crown runs west over S2 to u ~28585, and its knobbed limb (28720–28880, v 1283–1450) reaches over
  `S2.veh.boat_bottom_28395`.
- **`S1.tree.willow_stall_a_29178`:** its whips hang west over `S2.bld.wanglou_shed_28660`'s roof to u ~28800.
- **`S2.prop.bench_29030`** (29008–29052) is S2's and not part of S1's stall (S1's furniture starts at 29267).
- No building crosses the seam (望楼饭铺 ends at 29025–29040; S1's first roof starts at 29262), and the 汴河's shore turns
  south at 28935–28968, so no water crosses it. The cross-key check (u 28750–29350) found no same-kind pair under 30 px
  and no line overlapping in u.
- **East end:** the silk ends at u ~37610; no neighbour.

## The needs in brief (`gen/expand/countryside_needs.md`)

- **Casting:** 30 figures, all from the existing 22; **no new character.** idler 5, hat_traveller 4, porter 4, bearer 3,
  townsman 3, carter, camel_driver, robed_man and scholar 2 each, soldier, inspector and child_robed 1 each. Free
  retargets: `drink`, `hail`, `lead`, `ride`, `crouch`, `bend_goods`, `reach`, `point`.
- **Takes (10 credits each):** `chase_run` (the three grooms) and `drive_donkeys` (the two charcoal drivers) worth
  having; `beckon_lean` (the old man at the post) and `stand_sleeves` optional. Nobody is painted threshing or hoeing.
- **Animals, 13:** five donkeys with the existing `pannier_charcoal`, two with `saddle_cloth`, the party's horse with
  `saddle`, the runaway horse (whole or not: the user's), the ox with its tone, the water buffalo (new: the ox's body,
  a dark tone and a kit-built `horns_swept` piece; or a 15-credit body), a far ox and a pale bird (both low). New free
  clips: the donkey's `walk_low`, the horse's `gallop`.
- **Vehicles:** the willow-decked sedan (`kit_vehicles.sedan_chair`, closed, with a new `willow_spray`), the tipped
  front-wheel trough barrow (new). **Boat:** the sampan, `small_open` at `lw` 0.6 with a pointed east end if the kit can.
- **Carried props:** new `wind_hood` (the two hooded riders), `pole_basket_branches`, `stick_bag`, `hoe`; optional
  `hat_on_back`, `pole_hampers`; existing `stick`, `staff`, `back_bundle`, `pole_boxes`.
- **The area's kit:** the thatched farmhouse (a gablet with a king post, a thatched lean-to and skirt on top of
  `kit_outer_road`'s thatch), the tiled hall's baluster veranda and the wing's board wall, the turf-decked plank bridge,
  wattle and brushwood fences, the threshing floor with its stone roller and domed haystack, the tall post with a
  crossbar, the tied jar, crow's nests.
- **Trees, 87:** 21 elm_claw, 19 slender, 16 willow_fan, 15 sapling (a new form), 13 willow_burl, 2 far bushes, 1
  shoot_tree. New cards: `sapling` (2), two big `willow_burl` (10–17 m against cards of 8–10 m), two `elm_claw`, and the
  `leafy` row card S2 asked for.
- **The ground pilot:** a terrain builder from the bank lines with a rise per bank as a `choice:`, far fields, the
  菜地's raised bed, rocks, paths as worn bands, the stream from `water_strip`, the pale band after the user's answer,
  ground swatches with no grass tufts.

## Against `reference/scroll/sections.md`

- **The charcoal train walks east** as painted, not west into the city (赶驴入城); its count, 5 donkeys and 2 drivers, is
  confirmed. The small bridge runs u 36125–36608 (sections.md ≈ 36100–36500).
- **The travellers ride east**, away from the city; the party has **one** rider, and he and the porter beside him face
  east while the sedan goes west. The party runs to u 31131 (its rear porter).
- **The old man calling the child** (惊马闯市) stands at u 29674–29862, west of the range sections.md gives the scene
  (≈ 30000–30900), and about 300 px of v nearer the viewer than the horse.
- **The 菜地 (pin 5)** is a raised plot of 14 young bare trees, not rows of vegetables.
- **"Village tea and food stalls":** one thatched stall, with one clear figure and one doubtful one.
- **The great old willows** (≈ 31000–32600) begin with the hut willow (31240) and run to 32805; the last crown reaches
  33410. Pin 3 (32190) falls between the burled willow (32065) and the forked willow (32448). The brief's "faded open
  ground" at 32100–33200 holds three of the great willows and a far grove of ten bare trees.
- **The farmhouses** are thatched as sections.md says, except the farmstead at the field (29980–30400), which is tiled
  with a veranda. Pin 2 (寂静的谷场, 34100) falls on the small hedged yard with the roller; the open threshing floor is at
  35030–35420; both are recorded.
- **"A stone roller"** at the threshing floor (the brief, 35100–35170) is a bench; the roller in its frame is at 34158.
- **"Mist, sparse trees and water at the very start"** agrees: three big bare elms on the stream bank, a pale grove of
  seven slender fan-headed trees behind them, the water certain at 36000–36850 and plain silk (mist) east of it.
