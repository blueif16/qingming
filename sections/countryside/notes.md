# countryside: the countryside (S1, 郊野 · 古柳)

S1 is scan u 29050–37610 (map key `S1`, folder `countryside`): the scroll's start, read right to left. Mist, bare
trees, a stream with a small plank bridge and a boat beside it, the charcoal donkey train (赶驴入城, pin 1), the
threshing floor among thatched farmhouses (寂静的谷场, pin 2), the great pollarded willows (隋堤烟柳, pin 3), the
tomb-sweeping party with its willow-decked sedan (pin 6), the travellers on donkeys (pin 4), the runaway horse
(惊马闯市, its front half lost to damage), the vegetable field (菜地, pin 5) and the village tea and food stalls where
the canal's market begins. Its only neighbour is S2, the canal, at u 29050 (moved from 28700 in round 2's Phase 0 so the
望楼饭铺 shed and its customers stay whole in S2). The east end is the silk's own end; seals overlap the silk at about
u 37250–37560 and are never recorded. Area brief: `gen/expand/round2/brief_countryside.md`; tile brief:
`gen/map/S1/brief.md`. S1 is also the pilot for the countryside ground.

**Scan rect** (both halves together): u 28896–37616, v 0–1792 (the area, 150 px past the west end, and the silk's end).

## Restyle (setup, 2026-10-12)

**Two halves nested in this folder, not one section** (the same as S2's `canal/west` and `canal/east`).

**r1, the whole area as one section (failed, kept unused).** Rect [28896, 0, 8720, 1792], overview asked at
4096 × 848 (4.9:1). The image model does not draw an image that wide: it returned **4096 × 1695, letterboxed** (white
bands above and below, the painted band about 4096 × 990, its content squeezed). `tools/scroll_pipeline.mjs`
`cutOverviewCrops()` takes each tile's colour crop at the width ratio on both axes, so every row-0 tile got a crop that
was mostly white and every row-1 tile a crop of the wrong rows; the overview failed to register (0.006 → 0.061, scale
1.09) and the tiles registered at 0.01–0.54, most under 0.17. The run is kept with its config in
`gen/sections/countryside/runs/r1_full_rect_letterboxed/` (`raw/` holds its units). **Don't run the pipeline on
`countryside` alone.** S3's overview (asked about 3:1) came back nearly right; keep a restyle unit to about 2.6:1 or
less.

**r2, two halves** (prompts unchanged: `scroll_restyle`, `scroll_restyle_tile`, B1 as style image; gpt-image-2.5;
tiles 1024 px, overlap 128, out 2048; `--jobs 2`):

| name | rect | scan u | overview | tiles |
|---|---|---|---|---|
| `countryside/west` | [28896, 0, 4496, 1792] | 28896–33392 | 4096 × 1632 (came back 4096 × 1633, no bands) | 5 × 2 |
| `countryside/east` | [33120, 0, 4496, 1792] | 33120–37616 | 4096 × 1632 (came back 4096 × 1633) | 5 × 2 |

They overlap at u 33120–33392. Read with `node tools/scroll_inspect.mjs countryside/west …` for u < 33256 and
`countryside/east` for u ≥ 33256. The mosaics are `gen/sections/countryside/west|east/mosaic.jpg` (2× the scan;
scan u = rect u + px/2). Tile columns (scan u): c0 +0–1024, c1 +868–1892, c2 +1736–2760, c3 +2604–3628, c4 +3472–4496;
row 0 is v 0–1024, row 1 v 768–1792.

Registered alignment (before → after), every unit `ok`:
- west: overview 0.279 → 0.579; row 0 0.42–0.52 (t_r0c0 0.517, c1 0.484, c2 0.422, c3 see below, c4 0.467); row 1
  0.33–0.42 (c0 0.382, c1 0.414, c2 0.334, c3 0.419 on the second draw, c4 0.389);
- east: overview 0.155 → 0.236; row 0 0.40–0.58 (c0 0.478, c1 0.575, c2 0.491, c3 0.401, c4 0.507); row 1 0.21–0.39
  (c0 0.349, c1 0.232, c2 0.213, c3 0.315, c4 0.390).

The low bottom-row scores are the ink-wash ground (few strokes to correlate), not shifted layouts, but there the
registered restyle can sit 20–40 px off the strokes (the boat by the bridge is about 30 px south-east of its outline).

**Redraws** (`--only <unit> --force`; the first draws' check sheets are in
`gen/sections/countryside/west/runs/r2_first_draw/`):
- **west t_r1c3** (u 31500–32524, v 768–1792) first painted **a whole street** where the strokes have only the
  pollarded willows and bare ground: shop fronts with an awning and a bench, a seated man, a man in red at a door
  (u ≈ 31500–31810 and 32360–32460, v 1035–1330), a porter with a shoulder pole, a man leading a loaded donkey and a
  walker (u ≈ 32120–32300, v 1190–1540). The second draw is faithful (0.287 → 0.419). Kept.
- **west t_r0c3** (u 31500–32524, v 0–1024): three draws, all inventing in the faded silk above the willows. Draw 1
  (0.465): a house with a railing and figures (u ≈ 31500–31680, v 390–850), a crowd with horses (u ≈ 31680–31950,
  v 890–1024), people at u ≈ 32340–32520 (v 770–910). Draw 2 (0.063): a street of shops with a gateway and banners
  (kept for the record in `gen/sections/countryside/west/runs/takes/t_r0c3_take2_street.png`). Draw 3 (0.231, kept):
  a man leading a loaded donkey, a porter and three people at v 100–260 (u ≈ 31800–32480), a fenced building at the
  top right, a house at the bottom left (u ≈ 31620–31850, v 790–1000). The prompts are the user's call, so it stops
  here: the tile agents are told the restyle is useless above the willows in u 31500–32520.

## Where the restyle invents

The full list, by u range, is in the tile brief (`gen/map/S1/brief.md`, "What the restyle invents here"). In short:
- **Roofs:** almost every roof is drawn as blue tile; the strokes show thatch on the stalls, the hut and most of the
  east farmhouses.
- **People:** extra people round almost every group (a standing man under the stall, 4–5 people round the second
  traveller, 6–8 men walking the charcoal train where the strokes paint 1–2 drivers, crowds with oxen at the east
  farmhouses).
- **Animals:** one lying water buffalo drawn as two; the runaway horse drawn as a small beast with a pack.
- **Buildings:** a white-walled house at the stall's east end, another behind the shed on posts, and whole streets in
  the empty silk above the great willows.
- **Trees:** green weeping willows added behind the bare trees, ivy on the pollarded trunks.
- **Water and ground:** the wash bands (water, mist or ground) are all drawn as dry ground with grass tufts and
  stone banks; the mist at the start becomes fields and a horizon. The seals are painted out.
- **Right:** the travellers and the sedan party, the farmhouse with the veranda, the barrow lying by the stall, the
  great willows' trunks, the bridge and its posts, the boat by the bridge, the five donkeys (not their drivers), the
  pole leaning on a tree at u ≈ 37000.

## The map (Run 1, 2026-10-12)

Ten units (t1–t8, structures_w, structures_e), a merge, a second pass of four fresh agents (west, willows, farms,
start) and the frame step. **244 entities**, `check` PASS: 30 figures, 13 animals, 2 land vehicles and 1 boat, 87 trees,
27 props, 14 buildings, 8 structures, 5 roads, 2 water, 47 grd, 8 groups. Details: `gen/map/S1/merge_notes.md`; the
frame: `gen/map/S1/reports/frame.md`; the whole run: `gen/expand/round2/countryside_run1_report.md`.

- **Frame:** one knot, S2's seam value `[29050, −51.6]` held to the silk's end (no ground-level receding edge anywhere
  in S1). Datum `S1.road.main` point 0 = S2's last route point (29050, 730), station +314.87; the route runs to +442.58.
  `stream` H −0.7, measured at the bridge; `water` −0.7 copied from S4b (the 汴河 doesn't reach S1).
- **Layout:** `layout.json`'s `painted_area` west corners equal S2's east corners, (267.21, −4.39) and (290.62, 30.54).
- **Readings the build depends on, open:** the pale band (water or ground: the user's), the runaway horse built whole
  or not (the user's), the charcoal train's and the travellers' directions (painted east; the lead's), the route
  through nine trunk feet in front of the farmsteads (the lead's), the long farmhouse's roof (thatch or tile), the 菜地
  (14 young trees, or a crop: the user's).
- **What the area needs:** `gen/expand/countryside_needs.md` (no new character; two takes worth having; the buffalo,
  the sedan's willow spray, the barrow, the sampan; the thatched farmhouse, threshing floor, plank bridge and fences in
  `kit_countryside.py`; 87 trees by form; the ground pilot). Lessons: `gen/expand/countryside_lessons.md`.

## Open issues

- **For the lead (tools):** `cutOverviewCrops()` in `tools/scroll_pipeline.mjs` scales both axes by the width ratio,
  so any overview that comes back at another aspect than its rect gives every tile the wrong colour crop. A check that
  the returned size matches `overview.size` (or separate x and y ratios) would have caught it; S1 and S2 both lost a
  run to it.
- The restyle can't be trusted for water against ground in S1: the structures agents read the stream, the pale and
  dark wash bands and the mist from the strokes alone.

## Run 2: build — people and animals (the casting agent, 2026-10-12)

`gen/sections/countryside/make_people.py` writes `people.json` and `gen/sections/countryside/cast.json`. Rerun it after
a workshop delivery (`gen/expand/round2/workshop_progress.md`), a build (`ground_at.json`, `placed.json`, and
`solids.json` if the builder writes one) or a map move. It reads every registry: a target that lands, or a clip or
prop that lands, plays on the next run with no edit. Loyalty: figure 30/30 and animal 12/13 (the pale bird is
`unbuilt`).

**Casting.** `character` is the catalogue's target (§7: farmer 9, straw_hat 3, groom 3, and the rest from the 22).
`stand_in` is the needs list's interim cast by dress, which world.js plays until the target is built. A figure in a
pose (seated, riding or crouching) that neither cast can hold yet plays the nearest character that can, written as its
`character` (`POSE`).

| figure | target (wanted) | plays now | |
|---|---|---|---|
| man_with_stick_29205 | farmer: point + hoe | scholar: idle + staff (stands in for the hoe) | |
| traveller_standing_29996 | scholar: look + stick_bag | scholar: look | |
| child_29674 | child_robed: reach, look | the same | scale 0.62 (64/146 px of a 1.70 m man) |
| stall_customer_29280 | farmer: drink (seated) | hat_traveller: drink | nudge 0.30 m; stool in cast.json `seats` |
| stall_man_29328 | townsman: talk + back_bundle | townsman: talk | |
| man_at_post_29812 | robed_man: beckon_lean | robed_man: hail | |
| traveller_rider_30165 / _30495 | townsman / camel_driver: ride + wind_hood | ride (no hood yet) | ride their walking donkeys |
| traveller_staff_30357 | porter: carry_pole + staff + back_bundle | porter: walk + stick (stands in for the staff) | walker |
| groom_leading_donkey_30648 | robed_man: lead + lead_rope | robed_man: lead | walker |
| groom_chasing_30353 / _30518 / _30697 | groom: chase_run (+ hat_on_back on 30353) | idler / bearer / inspector: run | walkers |
| far_figure_29230 / _29257 | farmer: crouch | carter / idler: crouch | nudged apart |
| far_figure_29337 / _29466 | farmer: idle | townsman / idler: idle | 29466 beside the far ox |
| far_figure_29482 | straw_hat: idle | hat_traveller: idle | beside the far ox |
| sedan bearers (2) | bearer: sedan_carry | the same | under the kit's right-hand pole |
| porter_pole_31083, porter_boxes_30908 | porter (held) | porter: idle, look | 30908 off the horse's rump |
| porter_walking_31070 | idler (held) | idler: idle, look | |
| party_porter_staff_31131 | porter (held) | porter: stand_pole + staff | |
| rider_party_30988 | hat_traveller: ride | the same | on the standing horse |
| bending_farmer_34252 | farmer: bend_goods | idler: bend_goods | |
| farmer_by_hedge_34472 | farmer: stand_sleeves | soldier: idle | |
| figure_in_shed_35108 | farmer: crouch | camel_driver: crouch | |
| charcoal drivers (2) | straw_hat: drive_donkeys + stick | hat_traveller / carter: walk | walkers |

**Animals.**
- Water buffalo: the ox `lie` stands in. The script switches to the `buffalo` variant (with `horns_swept`) when it
  lands.
- The ox at the stall: ox `graze`/`idle`. The far ox: ox `idle`, H 0.51 on the built terrace.
- The party's horse: `saddle`, `idle`. The travellers' donkeys: `saddle_cloth`. The five charcoal donkeys:
  `pannier_charcoal`.
- The runaway horse: whole, no tack, walking west 7 m on `walk`. people.js plays `walk` on every animal path; the
  registry has no gallop.
- The pale bird: `unbuilt` (waits on a pale bird variant and the lead's reading).

**Walkers** (all paths clear of footprints, fences, the stream's shores, trunks of 3 m or more, standing figures and
standing animals, by the layout at the choice radii in `PROP_R`):
- **The charcoal train**: 5 donkeys and 2 drivers walk east-south-east along `S1.road.main` past the bridge's landing,
  6.0 m and 0.3 m back, at the donkey's 0.863 m/s.
  - It is set out at real size by 7 recorded moves (`build_choices.json` moves; cast.json `train`). The donkeys are
    1.9 m apart in their painted order, D5 leading, in alternate lanes −0.38/+0.31 m.
  - The east driver is 1.4 m ahead of D5. The west driver is 1.0 m behind D1, 0.7 m south of its lane, because the
    far_crown trunks stand on the road's north edge.
  - D5 and the east driver keep their painted places (moved 0.46 and 0.49 m). The file runs back west: D1 moves 2.8 m,
    the west driver 3.8 m.
  - Of the 276 layouts searched, this one walks furthest east clear of the elm on the road (elm_bare_37140), the shore and
    the rear trunks, with the least move.
- **The travellers**: both donkeys, the walker and the groom ride east along `S1.road.path_30300` and on along the
  road, 6.0 m and 0.8 m back. The walker walks 0.7 m north of the line. The standing traveller stays.
- **The runaway horse** walks 7 m west from its spot and back, never east of it. Its grooms run at 3.5 m/s on 5 m
  paths whose west ends stop 0.51 m short of its rump. 30518 keeps his painted 1.9 m behind 30353, who runs in his
  lane.
- **The sedan party holds** (S4's precedent). Its walk is listed for a procession routine (people.json `clips_why`
  `procession`).

**Page gaps** (people.js, not this script):
- people.js drops a figure from the layout's H + 1.2 m, and a walker from 1.5 m above its last ground. A people.json
  `H` is written where `ground_at.json` is more than 0.5 m above the map's H, but nothing reads it yet.
- An animal's path always plays `walk` with a random `['idle', 4]` pause. The train and the travellers start in step
  and loosen at the ends.

## Run 2: build — the set pieces and props (the kit agent, 2026-10-12)

All 14 buildings, 8 structures, 27 props and 2 land vehicles of S1 are built, each inside `sb.entity(<map id>)`, from
`blender/kit_countryside.py` (its SET PIECES section) and the shared kits, composed in the builder's block
`# ==== SET PIECES (kit agent) ====` of `blender/countryside_scene.py` (`buildings`, `structures`, `props`,
`vehicles`). Positions come from `layout.json` only (plus the hut's gate post, which the layout doesn't carry: its
painted points (30895, 1277) and (30900, 1290) through the frame, `_sp_scan`). Heights stand on the built ground
(`zg`, `zfoot`). Frontages come from the painted footprints; heights are real (rule 5); depths and moved walls are
choices. The restyle was not used (it tiles the thatch blue and adds people); every part was read from the scan
crops and the map's `what` and `note`.

**The kit** (`kit_countryside.py`, SET PIECES):
- **Thatch.** `thatch_loaf` is a thick straw roof of rounded-rectangle rings. Its slopes run nearly straight
  (z = ridge − rise·c^1.3) and its hips are steeper than its sides (hip_k 0.6). It has a rolled hem with a straw-mat
  underside, a ragged fringe (`ragged`, or `dashed`: bundles with gaps, the stall's painted row of hanging ends), a
  second course of short ends, and a rope-bound ridge roll with an optional knob. Gablets go on hipped ends.
  `thatch_house` builds the farmhouse in its own frame: plastered wattle walls on a rammed foot rising to meet the
  roof's underside, a framed plank door, open sides on posts with plates and knee braces, and lean-to wings.
  `lean_to_room` is the stall's annex. `slat_screen` is the stall's lattice fascia.
  The kit's first profile (the outer-road kit's c², round hips 0.75–0.85) made every roof a beehive; at S1's
  footprints the c^1.3 profile with hip_k 0.6 reads as the painted hip-and-gable thatch.
- **Tiles.** `tile_roof` and `tile_house` build the tiled farmstead. The roof has a timber fascia and underside (no
  red paint, no rafter ends: a farmhouse) and hip, hip-gable (歇山: a pale gable with a king post) or gable ends. The
  house has plaster or board walls and the hall's west veranda (plank floor on a rammed plinth, posts on stones,
  balusters, an arched bracket, the wall set back with a door).
- **Shared parts** (`kit_common`, factory (c)): `kc_thatch_gablet`, `kc_thatch_lean_to`, `kc_board_wall` and
  `kc_mooring_stake` call kit_common's part when it has it, and otherwise a stub with the same signature. All four
  had landed by the review, so the build uses the factory's parts. The stubs stay as the fallback.
- **Fences.** `wattle_fence`: stakes of their own leans, heights and spikes, stouter posts every ~1.1 m, slanting
  infill twigs, two twisted withies. `brush_fence`: stout stakes and dense brushwood crossing at 25–72° plus upright
  brush, a ragged top, two withies. `hedge_row`: lumpy olive clumps (`grass`) with dark twigs. Each has a hidden board.
  `gate_post` is the gate post and its loose hurdle. `post_frame` is posts_35075.
- **`turf_bridge`.** Posts at their painted feet, each set to the deck's north or south edge by the side it is
  painted on. A cap beam at each post station, two log stringers, a deck of round poles, a turf-and-brush top with
  ragged edges, brush twigs and straw. A hidden smooth deck solid runs 0.6 m onto each bank. Hidden side rails 1.1 m
  high run 0.8 m past each end (the ground agent's shore walls leave a 1.1 m gap at each landing).
- **The threshing floor and props:** `stone_roller`, `haystack_dome`, `block_bench`, `flat_basket`, `tied_jar`,
  `basin_on_stand`, `sawhorse`, `crossed_poles`, `crow_nest`, `post_crossbar`, `pale_board`, `hanging_bundle`,
  `thin_stake`, `leaning_pole`.
- **Vehicles:** `trough_barrow` and `willow_spray`. The sedan is `kit_vehicles.sedan_chair(carried=True,
  front_style="closed")`.

**Choices** (values):
- **The stall (`stall_shed_29600`):**
  - depth 2.8 m (a 62 px placeholder);
  - eave 2.15 m (painted 1.5; a walker passes under it), ridge 4.15 m, hips;
  - front open on its four painted bays; west side open to the annex (one post at its back corner); back and east
    walls of plastered wattle;
  - dashed fringe of 0.12–0.22 m bundles;
  - the lattice fascia between the posts at u 29486–29599, from 0.5 to 0.1 m under the eave;
  - slats from u 29437 down to the counter's top.
- **Its annex (`stall_annex_29350`):** the west wall 0.23 m in from the footprint, behind willow_stall_b's trunk (1.19 m
  wide); 2.8 m deep; kit_common's lean-to from 2.15 m at the front to 3.05 m at the back; walls west and back.
- **The back shed (`stall_back_shed_29860`):** its front 0.45 m behind willow_east_29845's foot (that trunk is painted
  across its front); its west wall 0.12 m clear of the stall's east wall; 1.2 × 2.0 m; eave 2.0 m, ridge 3.55 m; open
  front on two posts (no wall is drawn under its eave).
- **The hut (`hut_thatched_31000`):** front wall moved 0.54 m back to D 6.3, so the gate post and the trestle painted in
  the gateway stand in a yard; 3.3 m deep; eave 1.95 m, ridge 4.25 m; a door 0.55–1.4 m from its west corner, facing
  the gateway.
- **The shed on posts (`shed_posts_31370`):** 0.15 m past its painted east post, over the basin; 2.4 m deep; kit_common's
  lean-to, low eave 2.27 m (the painted 180 px post), high side 2.7 m; three posts in front, two behind; on the raised
  yard.
- **The back house (`farmhouse_back_33450`):** front moved 1.18 m south to D 13.65. The placeholder put its front foot
  0.36 m under the eave; at the neighbours' painted eave it stands just behind the fence. X 335.25–338.0: west under
  the willow, east clear of the gable house. 3.2 m deep; eave 1.9 m, ridge 4.05 m; a door at the painted pale patch
  (1.45–2.25 m along).
- **The gable house (`farmhouse_gable_33670`):** east wall at X 340.3, clear of the big house; 3.2 m deep; eave 1.95 m,
  ridge 4.25 m; gablet west, ridge knob east (as painted); a door in the front behind the fence.
- **The big house (`farmhouse_thatched_33955`):** 4.8 m deep (seen gable-on: its long axis runs north); eave 2.05 m,
  ridge 5.0 m, the ridge running north; gablet south; a door on the yard (east) side.
- **The house with the high rounded roof (`farmhouse_thatched_34600`):**
  - 4.0 m deep; eave 2.3 m, ridge 4.75 m, the ridge running north (round 0.6, hip_k 0.8);
  - its lower west wing is kit_common's lean-to, 1.0 m wide against the west wall, eave 1.85 → 2.3 m;
  - the wing's front is set back 0.4 m, so the farmer painted before the house's west end stands clear;
  - a door in the front.
- **The barn (`barn_open_34860`):** its east wall on the painted east post (3.82 m wide); 2.25 m deep, its back on the
  long house's front line; eave 2.0 m, ridge 4.5 m, the ridge running north; gablet south; open front on the two
  painted inner posts; fringe 0.12–0.26 m.
- **The long house (`farmhouse_long_34950`, tiled: how):** 2.1 m deep, between the barn and the far roof; eave 2.3 m,
  ridge 3.75 m; hip-and-gable west, hip east. Its front is the barn's back wall in the west and open on three posts east
  of the barn.
- **The far roof (`far_roof_34840`):** 3.4 m deep; eave 2.8 m, ridge 5.6 m; hip-and-gable both ends; plaster walls; a
  door at the back.
- **The hall (`farmhouse_hall_30200`):**
  - 3.6 m deep; eave 2.55 m, ridge 4.5 m; hip-and-gable west, hip east;
  - its west veranda is 1.9 m along the front and 1.05 m deep, with a plank floor 0.3 m up;
  - the veranda's posts stand at 0.06, 0.95 and 1.9 m (the painted bays are 0.5–0.6 m apart, under a person's width);
  - balusters between the first two posts, an arched bracket between the other two; the wall set back with a door.
- **The wing (`farmhouse_wing_30190`):** its two painted faces fit no rectangle. It is a rectangle from the near corner
  turned 28° (the least-squares fit of the faces), 2.8 × 0.9 m, so its back stays clear of the veranda. Board walls
  (kit_common), hip roof, eave 1.9 m, ridge 2.85 m.
- **Roof heights:** the ridges follow a 45–50° pitch on the built depth. The strokes' ridge-to-eave spans (70–120 px) can't be
  read through the frame (a ridge 2 m back and up would draw 250 px).
- **The bridge (`small_bridge_36365`):**
  - 1.5 m wide (painted 0.4–0.7 m: a farm bridge a laden walker crosses); hump 0.18 m (the painted west third
    ramping up);
  - the ten posts 13 cm round at their painted feet, set to the north or south edge by the side each is painted on;
  - poles 8–11 cm; log stringers 0.45 m onto each bank;
  - the hidden deck solid runs 0.6 m onto each bank; the hidden rails are 1.1 m high and run 0.8 m past each end
    (the shore walls leave a 1.1 m gap at each landing).
- **Fences:**
  - `wattle_fence_31100`: 1.8 → 2.2 m, rising to the east as painted; withies at 0.16 and 0.66 of the height; its
    gate post 1.05 m at the painted (30895, 1277), and a loose hurdle 0.9 × 0.55 m lying at (30900, 1290).
  - `wattle_fence_30760`: 1.8 m.
  - `fence_brush_33760`: reading (a), brushwood along the whole line; reading (b), a low thatched hip, would be a
    building the map doesn't list. Heights from its painted top points: 0.5 (west end) → 1.2 → 1.3 → 1.25 → 1.15 m.
  - `fence_brush_34660`: brushwood, 1.1 → 1.2 m; the bush reading of its west part stays open.
  - `hedge_yard_34265`: bushes (the second pass), 0.5 → 0.55 → 1.05 → 1.2 → 0.85 m.
  - `rail_34170`: one rail at 0.55 m.
  - `posts_35075`: a frame (the strokes show no roof): a post 2.05 m and a forked pole 2.45 m, a pole lashed between.
- **Props:**
  - the counter: a table on legs (no front board is painted), top 0.86 m, 0.46 m deep, between the stall's front
    posts;
  - the small table 0.6 × 0.42 × 0.52 m;
  - the basket 0.52 m with a short handle east;
  - the hanging bundle: four straw sandals on a peg at 1.6 m;
  - the pale board: 1.25–2.4 m on a planted pole, with a hooked top;
  - the post with a crossbar: 2.5 m, the bar 1.35 m at 1.1 m;
  - the sawhorse 0.72 m, end on;
  - the tied jar 0.66 × 0.78 m;
  - the basin 0.74 m on a 0.32 m stand;
  - the stake 0.75 m, leaning north-west;
  - the haystack 1.24 m across and 1.6 m high (it stands between the big house's east wall and the roller);
  - the roller: a 0.46 × 0.72 m stone, end on;
  - the yard objects: a flat basket with two sticks, and a low lidded basket;
  - the stack 0.9 × 0.55 m of timbers;
  - the crossed poles 0.75 m; the crate 0.6 × 0.45 × 0.42 m;
  - the long plank as a 2.0 m low bench; the jar under it 0.3 m; the bench 1.0 m;
  - the straw strip 1.4 × 0.3 m;
  - the nests 0.5 m at their trees' foot + H;
  - the leaning pole resting on the slender tree 1.33 m up (its painted crossing), its end running on past;
  - the mooring pole: kit_common's stake 1.05 m over the water, rope turns; its rope point is SP_PLANS["mooring_rope_point"].
- **Vehicles:**
  - the sedan: kit_vehicles' carried sedan, `front_style="closed"`;
  - its willow spray: 12 whips 1.0–1.6 m with side shoots and a haze of buds from the roof's front corners, 12 strands
    0.5–0.9 m down its front face, 4 twigs at the rear corners;
  - the barrow: 1.7 m long (painted 1.34), a 0.54 m wheel, rolled 35° onto its far side.

**Moves** (`build_choices.json` moves, each with its reason; `map_layout.mjs S1` rerun):
- the kit agent's own: `bench_35133` dD −0.25, `jar_shed_35058` dX +0.25, `slatted_box_34960` dX −0.38,
  `crossed_poles_34925` dD −0.35;
- **four trees, for the area agent to confirm:** `far_pale_33455` dD +2.23, `elm_tall_33552` +2.73, `elm_33592` +2.73,
  `far_pale_33720` +3.48. Their bases are estimated just behind the west farmstead's placeholder fronts ("the true
  foot is north of the house"), so they fell 0.4–0.9 m inside the houses built at real depth. Each now stands 0.6 m
  behind its house's back wall.

**Point test** (every figure, tree, animal, vehicle point and prop against every built plan,
`scratchpad/S1_run2_kit/pip_test.py`): after the moves, only the contents of open sheds are inside. Those are the
stall's counter and the barrow's handle end under its eave, the stall man, the customer and his table under the annex,
the jar and basin under the shed on posts, and the crate and stack under the barn. Nearest outside:
`farmer_by_hedge_34472` 0.10 m from 34600's plan line (the wing is set back 0.4 m, so 0.5 m from its wall), and
`far_willow_34995` 0.28 m behind the long house.

**Numbers** (`placed.json` after `tools/build_scene.sh countryside`, colliders included): the kit agent's pieces
63.2k triangles. Buildings 41.5k (the hall 4.7k, the big thatched house 4.5k, 34600 4.3k, the hut 4.1k, the stall
3.8k, the rest 0.5–3.1k). Structures 12.2k (the hedge 4.0k, the west brush fence 2.4k, the bridge 2.4k, the wattle
fences 1.5k and 0.4k). Props 6.3k. Vehicles 3.3k (the sedan with its spray 2.6k). The section is 94.2k
(the 130k budget). `node tools/loyalty_check.mjs S1`: PASS (buildings 14/14, structures 8/8, props 27/27,
vehicles 3/3 with the boat). If triangles must be cut, the hedge (4.0k, sub-2 clumps) is the first place.
Review sheets: `gen/sections/countryside/kit_review/*.jpg` (the scan crop over a walker's-eye and a three-quarter
render of each set piece in the built scene) and `review_tris.json`.

**Open:**
- `posts_35075`'s lean-to reading, `fence_brush_33760`'s hump (a low thatched hip), `fence_brush_34660`'s bushes, the
  yard objects as hens, and the straw strip as a rake. Each is built as recorded, and the other reading stays in the
  map.
- The barrow is rolled 35° (tipped on its side). The other reading, tipped onto its nose, would also draw its wheel
  round.
- The seated customer has no stool. A seat is the figure's part (rule 3); people.js stands him on the ground.

## Run 3: the finisher after the restart (2026-10-12 evening)

The S1 finisher picks up from the files (`gen/expand/round2/restart_brief.md`). The ground agent's last steps (its
transcript) were: builder edit 16:44 (the pale band kept 1.2 m wide, `BAND_MIN`; the shoal a bar 0.06 m under the
water), build 16:47, loyalty PASS, export 16:48, review renders (`kit_review/ground_eye_*`, done 17:51 under the load)
and a budget check whose result was lost. Nothing in it points to another change, so its build stands. Its ground work
is recorded in `build_choices.json` (`how`, `edges`) and the builder's `choice:` lines; it wrote no notes here.

**Stage 1, the build brought current (done):**
- `make_people.py` rerun on the 16:48 build. The grooms now play the workshop's new `chase_run` (it holds no
  `hat_on_back`, so 30353's hat is off until the groom lands). The charcoal train's layout is kept (shift +0.75 m,
  lanes −0.41/+0.28 m); its walk is now 2.5 m east and 0 back (the ground agent's stream shore lies closer: D3 and D1
  come 0.06–0.07 m from `edge:shore`). Its seven moves had been recorded from an earlier set-out (D5 dX 1.56 against
  the 1.99 it stands at by a nudge): **recorded again** in `build_choices.json` with the reason, `map_layout.mjs S1`
  rerun (17 moves), recast: no nudges for the train, `checks: none`.
- `tools/build_scene.sh countryside`: 96,575 triangles, 37 draw calls, 173 owners (unchanged). `loyalty_check S1` PASS
  (87/87 trees, 47/47 grd, 30/30 figures, 27/27 props, 14/14 buildings, 12/13 animals + the pale bird unbuilt,
  8/8 structures, 5/5 roads, 3/3 vehicles, 2/2 water).
- `export_web_scene.mjs countryside`: GLB 1350.6 KB, boats 58.7 KB, scroll index 68 entries, projection max 0.64 px.
- `ktx2.mjs encode` (nothing new) and `check` PASS.
- `budget_check.mjs countryside` (slot Chrome, 5190) **PASS**: download 7.54 / 9 MB, with kit and cast 18.54 / 20 MB,
  93.1k / 130k drawn, 3.4k / 5k colliders, textures 17.85 / 24 MB, draw calls 253 / 330 (at ground_stream_banks),
  GPU 46.15 / 75 MB, 42 people and animals. Logs in `gen/sections/countryside/qa/run3/`.

Next: `tools/chrome_slot.sh node tools/walk_page.mjs "http://127.0.0.1:5190/world.html?sections=countryside" sections/countryside/walks.json`

**Stage 2, walks alone (done): 50/50 PASS** (`gen/sections/countryside/qa/run3/walks_alone.log`). The first run gave
39/50. Plan views of the built colliders, water and walk traces showed what failed (a throwaway plotter from the raw
GLB, in the scratchpad). Two real causes:
- **The hall (`farmhouse_hall_30200`) stood in the road.** It was built 3.6 m deep from its painted front, but the
  painted road's south edge runs along its mapped back (D 10.34). Its back wall stood 2.3 m into the road and left
  0.18 m between it and the runaway horse's lane (D 13.8, body 0.35 m), so both road walks stopped at its corners.
  **Choice: 3.0 m deep** (ridge 4.2 m, kept at about 47°; a `choice:` in the builder). A 0.8 m lane is now open
  (D 12.4–13.15). Rebuilt: 96,463 triangles; loyalty PASS; recast (checks none).
- **The ground agent's last build** holds the shore land 0.7 m over the water 2.5 m in. It also lowered the willow
  dyke's crest (about H 0.07) and the bridge's east landing (H −0.33). The walks at the bridge, the pool and the dyke
  face had the old heights and lines; their routes and ranges were rewritten to the build. In every case the walker
  stays on land or deck and never goes below the water (−0.7); each `why` says what changed.
- **Not fixed, for the user's list:** at the bridge's west landing the ground behind the deck's end dips into a
  0.3 m hollow (H −0.37 at X 367.3, D 10.0). Its face toward the bank is about 35° (the walk limit is 34). So a
  walker leaving the deck west along its south half, on the painted path's line, stalls at X 367.2 and has to step
  north. The deck's north half leads off smoothly, and the walks take that way. The fix would be in the ground
  agent's landing pads (`landings()`, `T.pads`), not done.
- **The spawn** (`scene.json`, the ground agent's of 16:42, X 283.4 D 12.8) now faces 0, not 8: with 8, W led into
  the horse's lane. It now runs down the open lane between the hall and that lane.

Next: `tools/chrome_slot.sh node tools/shots_page.mjs …` with `sections/countryside/shots.json` (alone), then
`tools/chrome_slot.sh node tools/people_check.mjs "http://127.0.0.1:5190/world.html?sections=countryside&window=all"`.

**Stage 3, shots and people alone (done):**
- **Shots:** 50/50 taken, no console errors or warnings (`qa/run3/shots_alone/`, `sheet.jpg`; 163 draw calls,
  343k triangles over all passes, 42 people). Three spots predated the build and were moved in `shots.json`:
  `22_runaway_horse_grooms` stood inside the hall, now in the lane at (289.2, 12.75) facing 30; `25_road_willows_third`
  and `33_dusk_road_willows` had the third-person camera inside the great leaning willow's trunk (299.2, 1.4), now
  from (304.5, 1.2).
- **`people_check`** (`?sections=countryside&window=all`, `--into traveller_standing_29996`, three road spots;
  `qa/run3/people_check_alone.log`): 15 walkers, 27 figures, 0 stuck; walking into a figure stops at 0.56 m (bodies
  need 0.56); on the road at the travellers' path, the grooms' lane and the charcoal train: nobody walked through,
  8 went round, 0 turned back, the longest stand was 4.8 s (under 6). The tool prints **FAIL on one line only:
  "walkers left the ground (y −0.64, 0.08)"**. Its band is fixed at −0.5..0.6, but S1's built ground goes lower. Along
  every walker and animal path, the built ground (from the raw GLB's colliders) lies between −0.60 (the groom
  leading the donkey and the travellers' donkeys, on the road under the willow dyke) and +0.06. So the −0.64 is a
  walker on the ground, not off it: **passed by reason** (a request to the lead: make the band relative to the
  ground). `closestToFigure` 0.04 m is the two riders, counted as standing figures, sitting on their walking donkeys.

Next: the S2 seam (`walks_joined.json`, `shots_joined.json`) if S2's notes carry `FINAL BUILD`; HUD at 2–3 landmarks.

**Stage 4, recast for the workshop, HUD, joined (preliminary) (done):**
- The workshop marked **`chase_run` NOT TO USE** (18:36; its arms stay out sideways), stand-in `run`.
  `make_people.py` now reads `workshop_progress.md` in order: "NOT TO USE `x`" bars a clip, and a later
  "**PASS `x`**" lifts the bar, so a passed retake plays on the next run with no edit. The three grooms play
  `run`.
- **The workshop's new paid run landed characters in the registry at 18:53** (`farmer`, `groom`, `straw_hat`,
  `robed_man`'s `beckon_lean`). They have no "landed" line or take review yet. The script casts what the registry
  holds, so S1 now plays its targets: farmer ×10 (crouch, bend_goods, stand_sleeves, sit), straw_hat ×3 (the drivers
  on `drive_donkeys`), groom ×3 (`run`). Still to make: `drink` (the seated customer plays farmer `sit`).
  Groom 30353's `hat_on_back` is bound to `chase_run` on the groom, so his hat waits for the retake. **Rerun
  `python3 gen/sections/countryside/make_people.py` and `node tools/export_web_scene.mjs countryside --boats-only`
  after the workshop records its review of this run.**
- On this cast: `ktx2 check` PASS (127 encoded); **budget PASS**: section 7.54 / 9 MB, with kit and cast
  18.26 / 20 MB, 93.0k / 130k drawn, 3.4k / 5k colliders, textures 17.85 / 24 MB, draw calls 247 / 330, GPU
  44.61 / 75 MB; walks alone 50/50; `people_check` as stage 3 (only the fixed ground band, passed by reason); shots
  retaken (50, no console errors).
- **HUD** (`qa/run3/hud/`, `hud.json`, sheet): Space at three landmarks:
  - the stall and the runaway horse: 26 boxes;
  - the great willows: 9;
  - the bridge and the charcoal train: 15.
  The ring sits on the painted road behind the hall, on the dyke between the willows, and at the bridge's west end.
  The boxes sit on the painted buffalo, ox, stall people, horse with the grooms' dots, the man at the post with the
  child, and the five donkeys with their drivers. Projection max 0.64 px (under 2).
- **Joined with S2: not final yet** (no `FINAL BUILD` in `sections/canal/notes.md`); a preliminary run of
  `walks_joined.json` with S2's 18:33 build: 3/5. The two road crossings and the one behind the stall PASS. The
  two off-road crossings at D 6.4 FAIL because S2's river now reaches the seam there (the lead's call): the W->E
  start lies in S2's water (H −1.05). Both ways the walker is stopped by a wall at the seam, so S1's side holds. The
  route needs moving north of S2's river: the join agent's, at S2|S1 (`qa/run3/walks_joined_prelim.log`).

FINAL BUILD 2026-10-12 18:59 (countryside.glb and countryside_boats.glb won't change; people.json follows the workshop, above)

Report: `gen/expand/round2/countryside_run2_report.md`. Next (whoever runs after the workshop's review of its new
run): `python3 gen/sections/countryside/make_people.py && node tools/export_web_scene.mjs countryside --boats-only`;
the S2|S1 seam is the join agent's.

## Join agent (2026-10-12 evening)

Details are in `gen/expand/round2/joins_report.md`, Stage 4.
- **S2's river end:** S1's ground rises out of the water at the seam as a 2.2 m bank (`blender/countryside_scene.py`
  `s2_river_end()`).
- The two off-road joined crossings moved to D 10, north of the water's end. One walk was added: down the bank to the
  river's end, where you stop at the water's edge.
- Rebuilt and exported `--no-boats`; loyalty PASS.
- Walks: 50/50 alone, 6/6 joined. Shots: `R1`–`R5` in `shots_joined.json`.
