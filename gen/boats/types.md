# The painted boats, sorted into types (the boat factory, round 2, 2026-10-12)

Read from the scan (`node tools/scroll_map.mjs <S> overlay --parts none [--grid 20|50|100] --x U0-U1 --y V0-V1 --zoom Z`),
zoom 1-2.5. The scan is 1800 px tall, so above zoom 2 the strokes blur: the plain crops at zoom 1-2 are the legible
ones, the gridded ones are for reading positions. Every crop is in `gen/boats/crops/`. Positions here are scan u/v
ranges to find the boats again; the river agents' maps (`map/strokes/<S>.json`, `boat_` slugs) are the positions
anything is built from. Scholarship (`reference/scroll/sections.md`) was used only to know where to look.

## The inventory (about 30 hulls; the river agents' maps decide)

| # | where (u, v) | what is painted | type | crop |
|---|---|---|---|---|
| 1 | S4b 15180-15480, 60-160 | a mid-size hull at the far top, bow east, a low house with a mat roof, rudder at the stern | small (12 m) or grain with house | `S4b_moorings_plain.jpg`, `ov_S4b_moorings.jpg` |
| 2 | S4b 14990-15250, 170-330 | rafted, seen from the stern: the arched mat awnings stacked as rings, the rudder head and tiller on the centreline, two poles leaning | grain, awning | `S4b_moorings_plain.jpg` |
| 3 | S4b 14850-15400, 230-450 | rafted: a mat-roofed hold aft, a house with lattice windows and a hipped board roof forward, round coils on deck | passenger (short cabin) | `S4b_moorings_plain.jpg` |
| 4 | S4b 14880-15400, 400-650 | rafted: a dark mat cover aft, an arched mat awning amidships with a seated figure at its end; a knotted line runs east from it | grain, awning | `S4b_moorings_plain.jpg` |
| 5 | S4b 14880-15550, 550-900 | the biggest: a tall house of board walls between posts, a walkway rail, three round woven covers on deck, a gangplank from its stern to the bank, a pole down into the water at the bow | passenger (`boards`) | `S4b_big_boat_grid.jpg` |
| 6 | S3 15550-15950, 230-560 | under way (摇橹向前): mat-covered hold, a boarded deckhouse, a horizontal horn beam across the bow, six men at the stern pushing the great sweep, whose blade trails east to (16120, 540) and curls up | grain, awning, sweep | `S3_sweep_boat_plain.jpg` |
| 7 | S3 15950-16230, 20-340 | seen from the stern: an A-frame mast upright with rungs (ladder look), stays fanning to both sides, a tow line from the masthead east to the trackers on the far bank (16250-16450, 40-130); big round mat bundles, a man with a pole | grain, mast up, towed | `S3_mast_up_plain.jpg` |
| 8 | S3 16330-17370, 230-400 | moored at the far bank: a long house of windows the whole length, a continuous roof | passenger | `ov_S3_west.jpg`, `ov_S3_mid.jpg` |
| 9-10 | S3 17380-17750 and 17740-18320, 150-330 | moored at the far bank: houses with mat and board roofs, people inside | passenger (short) | `ov_S3_mid.jpg` |
| 11 | S3 17650-18150, 680-1000 | unloading at the near bank: bow west, men handing crates, a chain or ropes hanging at the bow, criss-cross mat covers | grain, hatch / awning | `S3_unloading_plain.jpg` |
| 12 | S3 19350-20450, 250-820 | 大船抢险: the biggest boat, under the arch; bow toward the viewer (19500, 700) with crew fending off with poles, a coiled rope on the bow; the A-frame mast being lowered aft, its legs running up to about (20250, 120), a mass of stays; a long house with board walls; the stern high with a raised stern house and gallery, the rudder at (20330, 640-700) | passenger, mast lowering, stern house | `S3_arch_boat_plain.jpg`, `S3_arch_stern_grid.jpg`, `ov_S3_arch.jpg` |
| 13 | S3 19750-20650, 1080-1220 | moored along the near bank past the arch: a long mat cabin roof, men standing on it waving at #12 | grain or small, mat roof (`boat roof`) | `ov_S3_arch.jpg` |
| 14 | S3/S2 20330-21100, 250-480 | moored at the north bank, about seven people aboard | passenger (short) | `ov_S2_west.jpg` |
| 15 | S2 20820-21800, 80-410 | a big cabin boat at the north bank: long arched roof, windows | passenger | `ov_S2_west.jpg` |
| 16 | S2 21850-22450, 830-1060 | six men at a great sweep lashed to a hull hidden by the willow; the sweep's blade lies on the water at 22650-22830, 1050-1100 | grain, sweep | `S2_poled_boat_plain.jpg` |
| 17 | S2 21950-22300, 1440-1660 | small, open: thwarts, floor boards, a man by it on the bank | small, open | `S2_small_awning_plain.jpg` |
| 18 | S2 22280-22720, 1440-1720 | small: an arched mat awning with cloths hung along it, a man at the stern scooping water | small, awning, cloths | `S2_small_awning_plain.jpg` |
| 19 | S2 22420-23720, 440-920 | 豪华客船: the model passenger boat (below) | passenger | `S2_passenger_plain.jpg`, `S2_passenger_bow_grid.jpg` |
| 20 | S2 23500-25100, 480-900 | 逆水行舟, the north hull: the A-frame mast up at 24100-24180 (top v 300), stays, the tow rope from its masthead west across the water to the five trackers at 21780-22150 | grain, mast up, towed | `ov_S2_mid.jpg` |
| 21 | S2 23550-25150, 850-1250 | 逆水行舟, the south hull: a long house, about a dozen crew, bow west | passenger or grain with house; crew rowing (oars) | `ov_S2_mid.jpg` |
| 22 | S2 24250-24500, 500-600 | a small canopied boat | small, awning | `ov_S2_mid.jpg` |
| 23-27 | S2 24300-26800, 500-1250 | the north-bank row: big high-riding cargo hulls with flat transom bows (a stem post and battens on the transom, the bow flaring out over the water at 25100-25300), strakes with dense nail rows, a heavy wale with round bolt heads, arched mat awnings and board houses, a man in a hat at a bow | grain, awning (riding high) | `S2_cargo_row_plain.jpg`, `ov_S2_east.jpg` |
| 28-29 | S2 27250-27950 and 27950-28500, 950-1650 | 万石船, deep-laden at the bank: seen from the stern, broad round-sided hulls, the water near the wale, the hold under a big woven mat mound lashed with a net of ropes, flat hatch boards at the bow end, a stern gallery with a roof, the rudder stock and its head on the centreline, a gangplank (with battens) from the deck to the bank at 27700-27950, 1050-1150 | grain, laden, gangplank | `S2_grain_plain.jpg`, `S2_grain_stern_grid.jpg`, `ov_S2_grain.jpg` |
| 30 | S2 28150-29000, 1350-1720 | a hull at the bank under the willows, partly hidden | grain (laden?) | `ov_S2_grain.jpg` |

Counts by type (as read here): **passenger** 9-10 (#3, 5, 8, 9, 10, 12, 14, 15, 19, maybe 21); **grain / cargo**
14-16 (#2, 4, 6, 7, 11, 13, 16, 20, 23-27, 28-30, maybe 21); **small** 4-5 (#1, 17, 18, 22, maybe 13). Masts: #7 and
#20 up and towed, #12 being lowered. Sweeps working: #6 and #16. About 31 hulls against 余辉's 28: some of the north-bank
row and the rafted boats may be one hull read twice.

## Type 1: the big passenger boat (客船), model S2 #19

- **Hull and sheer:** long and full, the sheer rising gently forward and more steeply aft; about seven strakes above
  the water, each seam drawn as a line with a row of nail dots; a heavy wale two strakes below the gunwale; a gunwale
  cap.
- **Bow:** a raked transom under an overhanging bow platform on two beams; the stem post rises from the transom and
  curls forward at its head (22410, 480-560); a small canopy roof on posts over the foredeck (22450-22560, 510-540);
  coiled ropes and bitts on the foredeck.
- **House:** almost the whole length (22550-23700). Framed bays between posts: a low board dado with small framed
  panels, then the window band, lattice windows (直棂) and open windows, some with rolled blinds and curtains, a frieze
  board above. The roof is cambered boards in segments of slightly different heights, with eaves overhanging the side
  walkway. Rolled mats, baskets and bundles on the roof. A ladder from the side deck to the roof amidships, where a man
  stands.
- **Side walkways:** the deck strip outside the house, along the gunwale, where the crew walk.
- **Stern:** a broad raked transom under a gallery on the continued gunwale beams, a rail round it; the rudder on the
  centreline. (#12 adds a raised house over the gallery.)
- **S4b #5 variant:** board walls (no windows), a walkway rail, round woven covers on deck, a gangplank to the bank.

## Type 2: the grain and cargo boat (漕船; deep-laden: 万石船), models S2 #28 and #23-27

- **Hull:** broad and deep, round-sided; many strakes with dense nail rows, a heavy wale with round bolt heads; a
  wide, flat transom bow, battens on it, a stem post, the capping beam's ends projecting as horns (S3 #6, 15550-15600).
- **Riding high (#23-27, #2, #4):** the hold under arched woven-mat awnings (篷) on hoops, in sections stepping up to
  the middle, like telescoping roofs; a board house aft.
- **Deep-laden (#28-29):** the water near the wale; the cargo heaped under a big woven mat mound lashed with a net of
  ropes; flat hatch boards at the bow end; a coiled rope.
- **Stern:** a gallery (a roofed one on #28), the rudder stock rising on the centreline with its head and tiller.
- **Sweep (大橹, #6, #16):** a long loom on a pin post at the stern quarter, a crossbar at its inboard end for four to six
  men to push, a long flat blade trailing aft in the water, its tip curling up; a lanyard from the loom to the deck.
- **Gangplank (#28):** a long plank with battens from the gunwale to the bank. Mooring lines to posts on the bank (the
  posts are props, not part of the boat).

## Type 3: the small boat (小船, 篷船), models S2 #18 and #17

- **Hull:** a small version of the same build: three or four strakes, transoms at both ends, a mooring post at the bow.
- **Awning:** an arched woven mat over the middle in two sections; cloths hung along it (#18); a sculling oar or pole.
- **Open (#17):** floor boards low in the hull, thwarts across at the gunwale, frames up the sides.

## Type 4: the boat lowering its A-frame mast (人字桅), #12 (and the masts up, #7 and #20)

- **The mast:** two legs stepped in tabernacles at the deck's sides, meeting at a masthead block, rungs between them
  (#7 at 16050-16120 shows the ladder look clearly); stays to the bow and both stern quarters, shrouds; on a towed boat
  a long tow line from the masthead to the trackers (#7 east to 16250-16450; #20 west to 21780-22150, about 2000 px).
- **Lowering (#12):** the legs lean aft (their tops toward (20250, 120)), the stays slack, crew hauling and fending off
  with long poles at the bow and from the house roof; people on the bridge throw ropes down. In the kit it is a
  passenger hull with `mast="lowering"` and a stern house; the poles are the crew's carried props (skill `characters`).

## What the kit builds for each (blender/kit_boats.py)

| painted part | kit |
|---|---|
| the water at the hull | `_wet_ring` (node `wet__ring`, 0.6 m all round) and, for a boat under way, `_bow_wave` (node `bow_wave`: the page shows it only while the boat goes ahead) |
| hull, sheer, strakes with nail-line seams | `Hull` + `_hull`: lofted stations, each strake a band lapped 2.5 cm proud with a 45-degree chamfer (the ink line); nail dots are not modelled (below the ink pass's scale) |
| transoms, bow horns | `_transoms`: boards, alternate ones proud; a capping beam projecting past the sides |
| wale, rubbing strake, gunwale cap | `_wales` |
| deck, side walkways | `_deck` (boards fore and aft with joints), `_bulwark` (inside face, stanchions) |
| bow platform, curled stem post, foredeck canopy, bitts | `_bow('platform', canopy=True)` / `'horns'` / `'post'` |
| stern gallery, rail, rudder, tiller, stern house | `_stern(gallery, house)` |
| long house: posts, dado, lattice / open / curtained windows, doors, frieze, cambered board roof in segments, ladder | `_cabin(pattern='passenger'|'boards'|'house', roof='board'|'mat')` |
| arched mat awnings | `_awnings` (kit_vehicles.barrel_cover) |
| laden mat mound with rope net, hatch boards | `_laden_hold`, `_hatches` |
| open boat: floor boards, thwarts, frames | `_thwarts` |
| A-frame mast, rungs, tabernacles, stays, shrouds, tow line | `_mast(angle)` (node `mast`, lines) |
| great sweep, oars | `_sweep` (node `sweep`): its pin on the stern frame (gallery) at the quarter, the loom over the open after deck to a crossbar at chest height, the crew aft of any house (the tiller unshipped: the sweep steers), the shaft bent down astern; `_oars` (nodes `oar_*`): on open deck only (`_open_spans`: nothing over the rower), the foredeck first on a big boat (rowers abreast), between the thwarts of a small one |
| gangplank, mooring lines | lines `line_gangplank`, `line_moor<i>` |
| deck cargo: coils, baskets, mat rolls, sacks, crates, jars; laundry | `_cargo`, `_cloths` |

## The kit's presets: sizes, triangles, files (2026-10-12)

Built headless (`kit_boats.py -- review` and `-- export`), shipped through the web pipeline's optimize step with `export_web_scene.mjs`'s flags (meshopt, webp, no join/flatten/simplify; textures moved out and shared). Visible triangles exclude the hidden colliders and boarding edge (they include the ropes and the bow wave); KB is the shipped geometry-only GLB (`gen/boats/glb/<preset>_lod<n>.glb`; raw GLBs `*_raw.glb`; `ship_stats.json`, `export_stats.json`). Renders: `gen/boats/review/<preset>_lod<n>_<view>.png`; the sheet beside the painted crops: `gen/boats/sheet.jpg`.

| preset | covers (inventory #) | waterline × beam, LOA | deck / roof above water | LOD0 tris, KB | LOD1 tris, KB | colliders |
|---|---|---|---|---|---|---|
| `passenger` | 3, 5, 8-10, 14, 15, 19, (21) | 19.0 × 4.5 m, 24.6 m | 0.9 / 3.736 m | 6634, 142 | 2158, 69 | 216 |
| `passenger_mast_lowering` | 12 | 19.0 × 4.5 m, 24.6 m | 0.9 / 3.637 m | 6444, 145 | 2220, 76 | 216 |
| `grain_laden` | 28-30 | 20.0 × 4.9 m, 24.5 m | 0.25 / 3.016 m | 5698, 124 | 1724, 58 | 200 |
| `grain_awning_sweep` | 2, 4, 6, 11, 13, 16, 23-27 (sweep on 6, 16) | 20.0 × 4.9 m, 24.5 m | 0.95 / 3.823 m | 6612, 133 | 2306, 70 | 248 |
| `grain_mast_towed` | 7, 20 | 20.0 × 4.9 m, 24.5 m | 0.95 / 3.823 m | 6808, 139 | 2394, 74 | 248 |
| `small_awning` | 1, 18, 22 | 8.0 × 2.3 m, 9.3 m | 0.12 / 1.66 m | 2122, 60 | 1164, 44 | 76 |
| `small_open` | 17 | 8.0 × 2.3 m, 9.3 m | 0.12 / None m | 1334, 42 | 640, 30 | 28 |

Shared textures: the song_kit swatches the boats use (timber, deck, reed) ship once with the sections; the water's line tile is 22 KB (`gen/boats/water/water_lines.webp`).

Layout test: `gen/boats/glb/stub_layout_test.json` (five stub entities read on the crops, converted with the S4b seed frame) built through `boat_from_layout` in both sinks: every hull centred on its painted midpoint (0.000 m), heading = `facing_deg`, strict entity tagging clean; the mapped lengths against real size are in its `note`s.
