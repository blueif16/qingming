# outer_road: the outer road, part 1 (城门口外)

The east area of the joined world (2026-10-11): the stretch of road just outside the city, from the moat bridge's
east end (the seam with the gate, S5, at scan u 9400) to between the fortune-teller and the palm-covered family carts
(u 12600). The rest of S4 (u 12600–15500: the family carts, the wheelwright, the crowd round a seated man, the
moorings) is a later area and stays painting (a backdrop panel) for now. Brief: `gen/expand/brief_outer_road.md`.

**Boundary.** S4 in `reference/scroll/sections.md` §2 is 余辉's segment 4, 城门口外 (u ≈ 9400–15500). This area is its
first part, u 9400–12600 (`map/sections.json` `area`).

**Scan rect:** x 9248–12752, y 0–1792 (the area plus about 150 px past both ends, on multiples of 16).

**What's in it**, from the gate outward (`sections.md` §2; the map, `map/text/S4.md`, says where each thing is):
- the two three-ox covered carts (名画记 pin 31, 牛拉大盖车), the first of them S5's `S5.veh.covered_ox_cart_9800`
  (rear on the bridgehead, its team in S4), and a rider coming the other way;
- the stall under a mat awning and two big parasols right at the bridgehead, and the crowd round it;
- the temple with its shut gate and a monk entering by the side door (pin 30, 清净的寺庙), at the top of the silk;
- a side road climbing north past shop houses, with pigs, pack donkeys and a porter;
- two tall lattice boxes carried on poles across the road (sedan chairs or cabinets: the map decides);
- the 递铺 courier post (pin 29; 余辉 懒兵候主): a gate with red studded doors and a posted notice, a small bridge in
  front, soldiers sitting and lying on document boxes, spears and banners propped against a fence, a white horse
  lying in the compound;
- the fortune-teller under a mat awning beside the official compound (pin 28; 余辉 临街神算; signs 神课 · 看命 · 决疑);
- a banner on a pole frame by the road;
- south of the road, a row of big tiled buildings with open fronts, tables and benches, and willows in front.

## Runs

**r1_base, 2026-10-11.** The gate's `section.json` with this rect; prompts unchanged (`scroll_restyle`,
`scroll_restyle_tile`, B1 as style image), model gpt-image-2.5. One overview (3504×1792) and 8 tiles (4 × 2, src 1024,
overlap 128, out 2048), one batch, all 9 first time (one tile took 128 s). Snapshot `gen/sections/outer_road/runs/r1_base/`.

| unit | align before → after | scale | shift (px) |
|---|---|---|---|
| overview | 0.647 → 0.673 | 1.005 / 0.995 | 5, 0 |
| t_r0c0 | 0.413 → 0.506 | 1.005 / 0.99 | 2, −6 |
| t_r0c1 | 0.291 → 0.518 | 1.015 / 1.005 | 10, −10 |
| t_r0c2 | 0.284 → 0.545 | 1.005 / 0.995 | 10, −10 |
| t_r0c3 | 0.217 → 0.452 | 1.015 / 1.005 | 14, −10 |
| t_r1c0 | 0.329 → 0.566 | 1.005 / 1.005 | 2, −14 |
| t_r1c1 | 0.331 → 0.550 | 1.015 / 1.01 | 10, −6 |
| t_r1c2 | 0.300 → 0.544 | 0.995 / 1.02 | 10, −6 |
| t_r1c3 | 0.236 → 0.460 | 1 / 1.02 | 14, −2 |

In the gate's range (overview 0.64; tiles 0.39–0.66). The two lowest, the c3 tiles (the fortune-teller, the big
tree and the south roofs), line up in their overlays; they are mostly bare branches and roof tiles, redrawn stroke by
stroke.

**Review (check sheets and `mosaic_view.jpg`).** Every tile keeps the scroll's layout: the carts, oxen, stall and
parasols, the two tall boxes on poles, the spears against the post's fence, the seated soldiers and their box, the
fortune-teller's awning and table, the banner frame, the south roofs and their tables and benches. The look matches
the gate's run (muted blue-grey tiles, early-spring willows, readable clothing colours), so the two sections read as
one. What to keep in mind when reading it:
- the registered bottom-row tiles show a smeared strip along their top edge (the rows registration clamps); the
  mosaic drops it, so read figures there from the mosaic or the row above;
- the restyle redraws, it doesn't measure: positions come from the scan (`map/`), the restyle helps read faded silk
  and is what new characters are cropped from;
- the dark parasol near the right edge (u ≈ 12500, v ≈ 1000) is painted blue; the restyle also invents and drops
  things (the map's review found a willow stem turned into a man in red, the lying white horse into a bush, the
  planked ditch into a rail fence, and people the strokes don't have: `gen/expand/outer_road_lessons.md`).

No unit needed a rerun.

## Mapped from the strokes, 2026-10-11/12 (Run 1)

**The map** (`map/strokes/S4.json` → `map/text/S4.md`; brief `gen/map/S4/brief.md`): 206 entities from five mapping
agents (four 800 px tiles and one for the structures, roads and water), merged with `gen/map/S4/merge_fixes.mjs`
(`merge_notes.md` says why), then a second pass by two fresh agents (`gen/map/S4/second_pass/`). 65 figures,
17 animals, 3 vehicles, 23 trees, 54 props, 17 buildings, 8 structures, 3 roads, 1 ditch, 15 groups.

**What is painted** (corrections to `sections.md` in brackets):
- the team of S5's covered ox cart (three oxen, a seated driver on its front, a walking driver, a leader at the oxen's
  heads); the second covered cart, seen from behind heading north-east, with two legible oxen [sections.md: three-ox
  carts; a third ox is possible but not legible] and four men; a rider in a conical straw hat with a fan, coming west
  on a horse with its head down, a groom at its head;
- two tall sedan chairs carried west on the far side of the road by bearers [not in sections.md];
- two stalls at the bridgehead under mat awnings with a dark and a light parasol, round goods, a huge heaped basket
  and a crowd; a pig herd of four and three pack donkeys at a thatched stall on the side ground [not in sections.md];
- the temple's gate hall with its shut studded door and two guardian statues behind lattice railings, the monk at
  its side door, a shop house, houses at the top of the silk;
- the courier post (递铺): a gate building whose open west leaf carries a posted notice (illegible; the leaf is dull
  brown on the scan, not clearly red), an earthen wall crested with crossed stakes, a planked ditch with a humped
  little bridge, 7 soldiers [sections.md: nine], 2 document boxes and a pillow box, 4 spears at the stakes and a
  furled banner, a red pole and a spear east of the gate, a white horse lying in the yard, a saddle on a stand;
- the fortune-teller under a mat awning with signboards 看命 (clear), 神課 and 決□ (疑 not legible), a client on a
  stool, six onlookers, at u ≈ 12040–12460;
- a row of tiled halls south of the road, one an eating house with tables and benches;
- a black bird perched in the big willow (low confidence).

**The frame** (`map/frames/S4.json`): S5's, with receding-direction knots [9400, 32.125], [10270, 36] (a hall's ridge
and eave) and [11420, 31.6] (table and bench edges, the ditch's end). Checks: the courier gate's eave 2.5 m, the
little bridge 2.3 × 2.3 m, the ditch 2.1 m wide; up the silk the shop's eave 1.4 m, the temple's 1.5 m, a house's
0.7 m. **Open:** the painter shrinks things up the silk (standing adults 0.9 of the road's size at v 850, 0.5 at
v 320, 0.3 at v 220): `map/BUILDING.md` rule 5 (real size, painted place) builds them at real size. East of u 11420
only high lines recede, and they are shallow (−0.56 to −0.61); the frame keeps 31.6.

**Layout** (`node tools/map_layout.mjs S4` → `layout.json`): 65 figures, 23 trees, 103 other entities, route
`S4.road.main` (stations +26.05 at the seam to +70.0 at u 12750). Its painted area meets the gate's along the seam
exactly: sw (16.79, −4.39) and nw (2.22, 30.54) are the gate's se and ne.

**Seams.** With S5: the cart's front, shafts and yoke, the willow clump's crown and `house_9300`'s east end go to the
lead as seam notes on S5's IDs. With the rest of S4 at u 12600: the road, `official_hall_12530` (most of it east),
`south_hall_12350`, the parasol at 12572, the willow at 12588 and the child reaching onto a table east of the seam.

**Needs** (`gen/expand/outer_road_needs.md`): 7 new characters (soldier, robed man, child, woman, monk,
fortune-teller, hatted traveller) for 28 figures, the other 37 cast from the existing 8; 17 animals (5 oxen, 3
horses, 4 donkeys, 4 pigs, a bird); 3 vehicles (the second covered cart, two sedan chairs); carried props; kit parts.
Lessons for the next area: `gen/expand/outer_road_lessons.md`.

## Built from the map, 2026-10-12 (Run 2)

**The scene** (`blender/outer_road_scene.py`, built headless with `tools/build_scene.sh outer_road`, shipped with
`tools/export_web_scene.mjs outer_road`): every building, structure, prop and vehicle of the map, each inside
`sb.entity(<map id>)`, at real size on its painted footprint (`map/BUILDING.md` rule 5). Parts: `blender/song_kit.py`,
`blender/kit_inner_city.py` (umbrellas, mat roofs, counters, stools, benches, baskets, tray stands, hip-gable roofs,
wall bays: reused, not copied), `blender/kit_vehicles.py` (the covered cart and the two sedan chairs) and this area's
24 new parts in `blender/kit_outer_road.py` (the kit agent; review sheet `gen/sections/outer_road/kit_review/sheet.jpg`;
the sign atlas 看命 · 神課 · 決□ and the gate's notice, `gen/sections/outer_road/make_signs.mjs`). People and animals:
`sections/outer_road/people.json` (generated by `gen/sections/outer_road/make_people.py`). Backdrop: one east panel
for the rest of S4 (`sections/outer_road/backdrop.json`); no north panel (the silk's top edge here cuts through
buildings and tree crowns, no open ground beyond), no west panel (the gate is built), mist south.

**Numbers:** 105.8k triangles (buildings 71k, props 17k, vehicles 6.6k, structures and the ditch 5.9k, ground 4.1k),
37 draw calls, `outer_road.glb` 1.77 MB of geometry (textures shared in `web/public/assets/tex/`). The painted area
is 1451 m², so 73 triangles/m² at full detail (the gate: 100k on 1672 m², 60/m²); the 17 buildings are the bulk
(roofs 1-2.5k each, plinths 0.7k, columns 150 each). Distance LODs on the page would be the lever.

**Loyalty:** `node tools/loyalty_check.mjs S4` PASS: 65/65 figures, 54/54 props, 23/23 trees (cards), 17/17
animals, 17/17 buildings, 8/8 structures, 3/3 vehicles, roads and the ditch. Nothing unbuilt.

**People** (61 at their spots, 4 walkers, 17 animals): the soldier, robed man, fortune-teller and hatted traveller
came from the workshop during the run, so nobody needs a stand-in. Still to come (the page warns and skips them):
the white horse (`horse_white`, lying), the bird and the donkeys' `pannier_charcoal` load. Clips still to make are in
`people.json` `clips_why` (stand_whip, hold_rope, push_flank, stride_stick; squat_sleeves and crane retargets).

**Choices** (marked `choice:` in the builder):
- the courier post's forecourt and yard stand 0.6 m above the road on their bank (its planked face is 70-78 px on the
  silk); the ditch's dry bed 0.15 m below the road; the planks only where painted (u 11140-11510 and 11895-11995), the
  weak middle stretch a plain earth bank;
- the little bridge squared to its painted west side and deck (the map's est north-east corner falls west of its
  south-east one); the kit builds its painted planked face 0.45 m high toward the road, with the way up an earth slope
  at its south-west foot, as painted;
- the post's earthen wall 2.4 m with a 0.38 m crest of crossed stakes; the gate's lintel 2.4 m, eave 3.0 m; its west
  leaf open 62° inward with the notice, the east leaf swung back out of sight; the furled banner and the red pole stand
  upright at their mapped feet (painted with their tops straight above their feet);
- real heights far up the silk, where the map reads eaves of 0.7-1.6 m: the gabled house 2.6, the temple's columns 2.9
  on a 0.35 m plinth (the hall 2.4 m deep, its painted 1.9 m leaving no room for the statues behind the railings), the
  side door 2.6 with a 1.0 × 2.1 m doorway, the shop 2.7, the roof behind it 3.4 (so that it shows over the shop's
  ridge, as painted), the yard's west wing 2.8 and north hall 2.9;
- the big south hall (10330) with its east wall at X 33.2, so that the willow and the leafy shrub painted at its east
  side stand outside it; eave 3.0, ridge 2.6 higher, gables south and north;
- the eating house (11450) from X 38.55 (its painted furniture under the eave reaches u 11215, west of the map's est
  end), no plinth, a mat pent roof over its open bays on two posts;
- south_hall_12100 and south_hall_12350 (est, overlapping footprints in the map) split at X 52.6; 12350 turned to the
  frame's axes with its ridge north-south (its painted ridge, −0.56, and eave, −0.26, aren't parallel), its east side
  open on posts;
- the official hall (12530) built whole although most of it lies east of the inner seam (it is this section's
  entity); floor 0.45 m, eave 2.8, its stair along the front rising west;
- the low construction at the bottom edge (forecourt_edge_11390, low confidence) as a long low bench; the dark block
  in front of the pavilion's doorway (stair_or_roof_end_11755, low confidence) as its two-step stair with a rail;
- the sedan chairs' poles centred on their painted cabins (the kit centres the cabin), the west chair's 2.9 m so they
  stop at the middle bearer, the east chair's 3.5 m;
- the fortune-teller's hidden seat is part of his figure (rule 3); the mat awnings' edges 2.2 m (front) and 2.7-2.9 m
  (back); the parasols' sizes from their painted canopies (/1.3).

**Moves** (`build_choices.json`): the two guardian statues 0.6 m inside the temple's front (behind the railings, as
painted); `ox_far_10045` 0.2 m north (at real size it overlapped the shaft ox: centre lines 0.56 m apart);
`ox_shaft_10712` 0.8 m forward along its heading (its rump ran into the real-size cart body, which the kit centres on
the painted wheel and which ends 0.44 m past the painted front). The builder applies the moves to the team's hooves,
so the harnesses follow.

**Checks:**
- **Walks** (`walks.json`, `world.html?sections=outer_road`): 11/11 PASS: up the road from the seam past the stalls,
  between the two ox carts and past the hut (the road's narrowest place, D 4.6-7); over the little bridge onto the
  forecourt (H 0.59); through the gate into the yard; the planked bank stops you west of the bridge; onto the temple's
  plinth; up the side ground round the pig herd to the shop; into the eating house; each edge (south, east, north,
  west alone). **Joined** (`walks_joined.json`, `?sections=gate,outer_road`): 2/2 PASS across the S5 seam both ways.
- **People** (`tools/people_check.mjs`, road spots on the walkers' lines 18.9,17.3; 31.4,10.3; 18.5,5.8): PASS alone,
  and joined at the seam (16.0, 4.7): PASS.
- **Shots:** `gen/sections/outer_road/shots/final/sheet.jpg` (16 spots, `shots.json`) and
  `gen/sections/outer_road/shots/r2_joined/sheet.jpg` (the seam from both sides, `shots_joined.json`).

**Open:**
- the seated driver of S5's cart sits on the cart's front (nudged 1.9 m back onto the real-size body the gate builder
  makes); with outer_road loaded alone the cart is absent and he sits in the air;
- the little bridge and the gate opening line up on the silk but stand about 2 m apart on the ground (the frame's
  receding direction there);
- the perched bird needs the page to place it at its H (9.5 m), and the child held by the woman stands at her side
  until people.js can carry a figure;
- 73 triangles/m²: LODs by distance, or simpler far halls, if the bench asks for it.

## The backdrop panel, 2026-10-12

The east panel (the rest of S4, u 12600–15500) is re-keyed and placed by the new backdrop tool
(`gen/expand/backdrop_lessons.md`): no stretch (the panel keeps the painting's aspect over its arc), no cream fringe
(edges unmixed from the paper, colour bled under transparent pixels), its painted ground standing in ground mist on
the misty floor, and the page's own light at dusk and night. It is still the first-round bird's-eye painting, so its
horizon sits about 4° above the eye; its content is loyal to the strip except the big gnarled tree, which the model
gave hanging willow strands. The redraw (eye-level, the content prompt rewritten in the viewer's frame,
`prompts/backdrop_outer_road_east.txt`, two candidates) waits for the image API: `node tools/backdrop.mjs outer_road
gen`, then `review_east.jpg`, `pick`, `ship`. No north panel (unchanged: the silk's top edge cuts roofs and crowns).

## Integration pass, 2026-10-12

- **People** (`make_people.py` regenerated, the lead's edits kept in it): the woman plays `hold_child` with her
  `child_in_arms` prop and her child is `carried_by` her; the pig herd walks its 3.2 m paths; the workshop's last batch
  is played (carter_whip `stand_whip` + `whip_stand`, ox_leader_11017 `hold_rope` + `lead_rope`, ox_driver_10635
  `push_flank`, striding_man `stride_stick` + `stick_stride`, seated_man_bottom `squat_sleeves`, the two onlookers
  `crane`); `horse_white`, `bird` and `pannier_charcoal` now exist. Nothing is left in `clips_why` to make.
- **S5's cart driver** sits on the seat the vehicle kit builds on S5's covered cart (X 17.823, D 2.965, 1.07 m); with
  outer_road loaded alone the cart is the gate's and absent, so he sits in the air: accepted.
- **Sedans:** poles from their painted ends with each cabin at its painted place on them (kit `cabin_at`); choice:
  the west chair's front end 0.5 m short (u 10500), so its front bearer stands clear of the dark horse.
- **Checks:** 110.4k triangles (the lead's ground now runs 16 m past the edges), loyalty PASS, walks 11/11 alone and
  2/2 joined, people_check PASS alone (3 road spots) and joined (2 spots).

## Joined with S4b (round 2 join, 2026-10-12)

The previous join agent made these changes; they are recorded here after the restart. Details are in
`gen/expand/round2/joins_report.md`.
- The ground stops 0.5 m past u 12600 on a clean line (`blender/outer_road_scene.py` `ground()`).
- The plinths of the halls crossing the seam reach deeper (`song_kit.soft_plinth(z_foot=)`).
- The soldier sits on his stool by the sit clip's measured hip offset (`gen/sections/outer_road/make_people.py`).
- Checks: S4|S4b walks 4/4; `people_check` joined PASS after the 19:19 recast. Shots:
  `gen/sections/outer_road_2/qa/run3/shots_joined/`.
