# S1 structures_w: report (u 29050–33000, plus `S1.road.main` 29050–33150; looked at 28900–33150)

Part: `gen/map/S1/parts/structures_w.json`, 37 entities. `node tools/scroll_map.mjs S1 check --parts …` **PASS**
(no warnings). Overlay: `gen/map/S1/look/structures_w_overlay.jpg` (zoom 1, grid 50), plus zoom 1.1–3.5 windows over
the stall, the terraces, the farmhouse, the hut and the shed, the willows' ground and both seams (scratch crops in
`scratchpad/S1_structures_w/`). Every marker sits on its stroke, except the points marked `est`, which have no stroke
under them by nature (placeholder back corners, the road's unpainted stretches).

## Counts

| kind | n | entities |
|---|---|---|
| building | 7 | `S1.bld.stall_shed_29600` (thatch, hip), `S1.bld.stall_annex_29350` (lower thatched roof over the customers), `S1.bld.stall_back_shed_29860` (small thatched roof behind the stall's east end), `S1.bld.farmhouse_hall_30200` (tile, veranda), `S1.bld.farmhouse_wing_30190` (tile, board walls, painted turned ~45°), `S1.bld.hut_thatched_31000` (thatch), `S1.bld.shed_posts_31370` (brush or thatch on two posts) |
| structure | 2 | `S1.str.wattle_fence_30760`, `S1.str.wattle_fence_31100` (the hut's fences either side of its gateway) |
| road | 4 | `S1.road.main` (route), `S1.road.path_30950` (the tomb-sweeping party's track), `S1.road.path_30300` (the travellers' path), `S1.road.path_29640` (the raised diagonal path across the far fields) |
| water | 0 | none in my range (below) |
| grd | 24 | 1 banked-field set at the top (`S1.grd.terraced_fields_29450`, 13 bank lines), 2 fields (`S1.grd.field_vegetable_29790` the 菜地, `S1.grd.field_30430`), 1 rock-or-figure (`S1.grd.rock_29745`), 20 banks |

Groups: none (no figures in my part). Roofs read on the scan, roof by roof: **thatch** on the stall shed, its annex,
its back shed, the hut and the shed on posts; **tile** only on the farmhouse (hall and wing). The restyle's blue tile is
wrong everywhere except the farmhouse.

## The road (`S1.road.main`)

- **Point 0 = (29050, 730) est**, copied exactly from `S2.road.main`'s last centre point in
  `gen/map/S2/parts/structures_w.json`, with S2's edges there (edge_n 695, edge_s 1000). It lies on the open village
  ground in front of S2's 望楼饭铺 shed's east end and S1's stall (customers' feet v ≈ 690–700). S2's station there is
  for the frame agent (`sections/canal/layout.json` does not exist yet).
- **The east end** (32850, 33000, 33150) copies `structures_e`'s join piece `S1.road.main_east` point for point
  (centre 1000/985/965, edge_n 960/945/925, edge_s 1040/1025/1005), so the splice at 33000 is clean.
- **Which painted way is the route, and why.** No road is drawn in S1. I took the walkable open ground that joins the
  painted vignettes in order: the village ground in front of the stall (where the buffalo, ox and barrow lie) → the
  open field of the runaway horse (v 800–860) → **south through the 300 px gap under hanging willow branches between
  the farmhouse (east end ≈ 30400) and the hut's fence (west end 30712)**, which is not painted as a path (all est) →
  the band below the hut's fences (v 1470–1530) → **along the willow dyke** (隋堤, the bank the great willows stand on,
  v ≈ 1440–1480) → a climb north-east behind the massive willow at 32470–32780 (not painted, all est) to the
  farmhouses' road at v ≈ 920–1000 that structures_e reads from the fences' feet.
- **Other readings** (in the entity's note): (a) an upper way behind the hut and the great willows at v ≈ 850–1000,
  hidden by their crowns, which would skip the willows' feet; (b) the travellers' path reached through the 54 px gap
  between the 菜地 and the farmhouse wing — too narrow; (c) under the bottom-left willow past the walker at 29200 —
  nothing drawn. The sedan party's track runs off the silk's top and cannot carry the route. **For the lead:** the
  route bends twice through unpainted ground (30400–30720 south by ≈ 600 px of v, 32300–32850 north by ≈ 450 px), so
  `station_range` will be odd round both bends (skill: tool quirks).
- Side paths: `S1.road.path_30950` meets the route at ≈ (30650, 700) and runs off the silk's top at ≈ 30900–31070;
  `S1.road.path_30300` runs from ≈ 29960 (v 1485, the figure south of the farmhouse) to the route at ≈ (30780, 1540);
  `S1.road.path_29640` lies in the far fields and does not meet the route.

## Water

None in u 29050–33150. **The bottom left is not water:** `S2.water.bian_river_e`'s shore turns south at
(28935, 1560)–(28968, 1780) and does not reach 29050; east of it the bottom left is the great willow's roots and
ink-wash ground bands (recorded as banks). East of 32850 the dark band v ≈ 1450–1600 under the willows' east end is
structures_e's `S1.water.wash_band_34400` (water or a hollow); I stop my banks at 33000 next to it.

## The receding-edge table (dx knots) — almost nothing recedes at ground level here

I searched every built thing and table for a ground-level edge running straight back. **None is clean in
29050–33000.** Nearest the seam first:

| # | edge | stroke points | slope dv/du | use |
|---|---|---|---|---|
| W1 | stall shed: front eave and post line | (29374, 543)->(29825, 548); post foot (29486, 664), counter feet v 664–666 | ≈ 0 | along the scroll; no depth |
| W2 | stall shed: east hip line | (29675, 420)->(29825, 548) | +0.85 | a hip (runs NE at 45° in plan), **not** a receding edge |
| W3 | barrow lying tipped (t1's `S1.veh.barrow_tipped_29795`) | (29672, 646)->(29795, 694) | +0.39 | lying object; t1 says not a ruled edge |
| W4 | far raised path `S1.road.path_29640` and the parallel line `diag_ne` | (29515, 148)->(29720, 328); (29740, 30)->(29850, 130) | +0.88, +0.91 | runs NW–SE on the ground (down-right), not straight back |
| M1 | farmhouse hall west hip | (29976, 1050)->(30080, 925) | −1.20 | a hip at eave-to-ridge level: **eave-level only, conf low**; if used as a receding edge, dx ≈ 51.25/1.20 ≈ 43 px/m |
| M2 | farmhouse wing: west wall foot | (30056, 1166)->(30124, 1196) | +0.44 | the wing is painted turned ~45°: neither face is straight back |
| M3 | farmhouse wing: south-east wall foot | (30124, 1196)->(30200, 1170) | −0.34 | as M2 |
| M4 | sedan poles (t2's, at shoulder height) | (30805, 537)->(31010, 478) | −0.29 | the sedan heads WSW; not a knot |
| M5 | hut east hip | (31010, 965)->(31170, 1115) | +0.94 | a hip, not a receding edge |
| M6 | shed on posts: east post foot to west post foot | (31445, 1235)->(31357, 1190) | +0.51 (up-left) | if the west post is a back post this recedes up-LEFT, against the painter's habit; more likely it stands behind the tray: rejected |
| E1 | banks, fences, the willow dyke (all) | e.g. fence foot (30917, 1336)->(31287, 1340) | ≈ 0 | along the scroll |

**Recommendation for the frame agent:** take no knot from 29050–33000. Hold S2's seam knot from 29050 and the next
knot from structures_e's farmhouses (east of 33400). If one is wanted in the west, M1 (eave level, −1.20, dx ≈ 43)
is the only candidate, and it should be checked against S2's eastmost ground edges first.

## The diminution (painted height = foot v − head v, standing or walking adults on the ground, from t1–t3's parts)

| foot v | u | height px | who |
|---|---|---|---|
| 141–145 | 29337–29482 | 37–45 | far figures on the field bank at the top (t1) |
| 401 | 31070 | 88 | party porter walking (t3) |
| 448 | 31131 | 97 | porter with staff (t3) |
| 541–576 | 30990–31083 | 114–115 | porter, rear sedan bearer (t2/t3) |
| 643 | 30828 | 115 | front sedan bearer (t2) |
| 652 | 29325 | 103 | standing man at the stall (t1) |
| 783–800 | 30353–30518 | 98–105 | running grooms (bent, so short) (t2) |
| 1095–1114 | 29205–29812 | 140–146 | walker with a stick; man at the post (t1) |
| 1476–1627 | 29996–30648 | 171–189 | travellers' walkers (t2) |

Against the front band (≈ 180 px at v ≈ 1550): 0.79 at v 1100, 0.60 at v 650, 0.51 at v 420, 0.23 at v 143.
Against S4's road figure (≈ 100 px at v 1200) the front figures here are **1.8×**: the painter draws S1's foreground
travellers very large. The farmhouse is drawn small for its v (veranda eave-to-floor 50 px at v 1100 next to men
140 px tall): a building's own scale cue there gives a doll's house; place by its feet, size it real (rule 5).

## Scale cues (px)

- Stall shed: front eave ≈ 120 px above the ground (eave v 545, ground v 665); eave run 451 px (29374–29825); ridge
  128 px above the eave; fascia board 113 px long.
- Farmhouse veranda: posts ≈ 50 px eave to floor (v 1050–1100), post spacing 38–47 px (30003, 30050, 30088); wing's
  board wall ≈ 45 px tall.
- Hut: ridge to eave ≈ 165 px. Wattle fences: 145 px (west panel, foot v 1330) and 160–225 px (east, foot v 1338).
- Shed on posts: east post 180 px tall (v 1055–1235); posts ≈ 85 px apart.
- Banks: the willow dyke's front ≈ 45 px; the bank under the hut ≈ 40–90 px; the far field banks 5–10 px.

## What was hard or ambiguous

- **The silk is dark and the ground is ink wash**: every bank was read with raised contrast (sharp `normalise` +
  `linear`, script `crop.mjs` in my folder) at zoom 0.9–1.6. Wash bands may be slopes or only shading; the bottom-most
  bands are `conf: low`. "Which side is higher" is never drawn: I took north as higher everywhere (the painter steps
  the ground down toward the viewer), each bank's height from its band's depth in px.
- **The stall shed's roof.** At first I read the line at v 361–367 as its ridge; at zoom 2 the ridge is at v 420 with a
  hip at the east end, and the v 362 line is a far field bank. The thatch roof behind the east end
  (`S1.bld.stall_back_shed_29860`) is painted; the restyle's white walls under it are not.
- **The farmhouse wing** is painted turned about 45° to the scroll (corner to the viewer); its two faces do not fit
  one rectangle, so its footprint is the painter's shape with named corners in footprint order, not by compass.
- **The pale rounded mass at the 菜地's corner** (`S1.grd.rock_29745`): a rock or mound, or a hooded figure from behind
  (its dome-shaped top, widening shoulders and a belt-like line read like one at zoom 3). t1 recorded the same mass as
  `S1.prop.rock_or_heap_29745`. **The merge keeps one** (mine as a rock or mound; t1's as a heap; a new figure of t1's
  if a hooded man) and retires the other.
- **The 菜地's plants**: tiny bare twiggy plants in loose bands; t1 recorded 13 of them as young bare trees
  (`S1.tree.young_bare_29558 … _29948`). My field is the plot's ground only. Crop (pin 5 菜地) or a grove of saplings
  is open: both readings in the note; the user decides.
- **The restyle above the great willows (31500–32520, v 0–1030) is useless**, as warned; I read only the scan there:
  far trees and blank silk, no building and no path.
- Building depths are never painted: every back corner is a placeholder (said in each note).

## Seam notes

- **S2 (u 29050)**, from S2's parts: `S2.road.main`'s last point (29050, 730) is my point 0 (identical, edges too).
  `S2.bld.wanglou_shed_28660` ends at u ≈ 29025–29040 (east corners (29030, 625) est, (29025, 630) est, roof to
  (29040, 300)); my first roof (`S1.bld.stall_annex_29350`) starts at 29262 behind the stall willows, so no building
  crosses the seam. `S2.grd.wharf_yard_28100` ends at (29030, 640)–(29030, 980), meeting my road's edges (695 and
  1000) there. **Overlap to settle:** `S2.grd.bank_lines_top_28900` runs on east of the seam to (29200, 145) est and
  (29073, 192) est; those are the same strokes as my `S1.grd.terraced_fields_29450` edge_v155 (29050–29560,
  v 152–190, which I start at 29050). The cross-key seam check should trim S2's line at 29050 or drop my stretch
  29050–29200. My field lines edge_v57 and edge_v155 also continue west of the seam to ≈ 28950–28960 (v 58 and 148) on
  S2's side, unrecorded by me. The bottom-left willow is t1's (`S1.tree.willow_burl_29090`, base
  (29090, 1782) est). No water crosses the seam (above).
- **structures_e (u 33000)**: the road meets its join piece exactly (above). Its `S1.grd.bank_33650` (bank_top
  (32850, 1300) est, foot (32850, 1490)) is the same ground as my `S1.grd.bank_32445` (v 1280–1340) and
  `S1.grd.bank_32905` (v 1394–1486); its `S1.grd.bank_south_34400` (v 1605–1645 from 32850) lies next to my
  `S1.grd.bank_32700` (v 1580–1612); its `S1.grd.terrace_lines_33800` bank_top_c (33100, 1120) continues my
  `S1.grd.bank_32900`. I end all my ground lines at u 33000; the merge joins them or drops the overlap 32850–33000 of
  structures_e's lines.
- **Tile edges inside my range:** t2's `S1.prop.trestle_hut_gate_30841` stands in my fences' gap (30812–30917); t3's
  `S1.prop.jar_tied_31298` and `S1.prop.basin_31373` stand under my `S1.bld.shed_posts_31370`; t1's
  `S1.prop.stall_counter_29430` and `S1.prop.stall_table_small_29285` stand under my stall roofs; t1's
  `S1.prop.post_crossbar_29862` stands at the 菜地's north edge.

## Supports used

Only `ground` (every entity). The banks' heights above are for the frame if it gives `bank top` an H (the travellers
and the hut stand on lower and upper ground bands respectively: the hut's fence foot v 1335 is on
`S1.grd.bank_30750`'s top, ≈ 40–90 px above the travellers' band).

## Left to others (what, where, to whom)

- t1: the two willows over the stall (trunks ≈ 29100–29260) and the bottom-left willow (base ≈ 29090, 1782); the
  stall's seated customers, the standing man, the counter and tables; the buffalo, the ox, the tipped barrow; the far
  figures and the dark animal on the field bank (u ≈ 29230–29500, v 100–150); the walker at 29205; the child and the
  man at the post; the forked post (29862); the plants and young trees of the 菜地 (as t1 recorded them); the willows
  along the chase field's north bank (≈ 29900–30100 and the one at ≈ (30650, 520)); the hooded figure, if the mass at
  29745 is one.
- t2: the runaway horse and its chasers, the travellers on donkeys and their walkers, the sedan party west of 31100,
  the small seated figure in the hut's gateway (≈ 30840, v 1250–1300), the trestle there, the willows at 30650–30800
  and the big willow leaning over the hut (trunk ≈ 30880–31050, v 1000–1330).
- t3: the jar and basin under the shed on posts; the stumps or tree knees on `S1.grd.bank_31390` (≈ 31326 and
  31474–31526, v ≈ 400); the great willows from 31100 (trunks at 31548–31939, 31878–32250).
- t4: the massive willows (≈ 32255–32780) and the east willow (base ≈ 32760, 1395); the far bare trees at the top
  (≈ 32350–33150, v 150–650); the reed or stake at 32882.
- structures_e: the wash band (water or hollow) from 32850 east, v 1490–1605; the banks east of 33000.

## Contradictions with `reference/scroll/sections.md`

- None about order. The scholars' 菜地 (pin 5 at 29900) fits my field at 29560–30000; but its "plants" are painted as
  tiny bare shrubs, which t1 reads as a grove of young trees. Flagged above, not resolved.
- The farmhouse with a veranda is tiled (not thatched as "thatched farmhouses" suggests for the whole countryside);
  the thatched hut is at 30720–31210.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **In open countryside there may be no ground-level receding edge at all** (S1 west, 2026-10-12: fences, banks and
  sheds all run along the scroll; the only diagonals are hips, a road running NW–SE, a lying barrow and a farmhouse
  painted turned 45°). Say so in the receding-edge table with each rejected candidate and its slope, and let the frame
  hold the neighbour's knot rather than fit one on a hip or a roof.
- **A hip is not a receding edge.** A hip roof's corner line (eave corner to ridge end) runs at 45° in plan; reading it
  as a straight-back edge gives a wrong dx. Use only eaves or ground lines that run along the building's side.
- **Read a long horizontal line above a roof at zoom 2 before calling it the ridge.** On the S1 stall the line 60 px
  above the real ridge was a far field bank; the ridge showed only once the hip line was traced up from the eave
  corner.
- **Ink-wash banks: read them with raised contrast** (sharp `normalise({lower: 1, upper: 99})` then `linear(1.4–1.7)`,
  in colour, zoom 0.9–1.6, grid 10–25). A bank is a darker band with its sharper edge on top; record `bank_top` on
  that edge and `bank_foot` where the band fades. Take north as the higher side unless a figure or trunk says
  otherwise, and give its height as the band's depth in px.
- **Copy the neighbour's road points first, then read your own.** S2's structures agent had written `S2.road.main`'s
  last point before I wrote mine, and structures_e had written the join piece: copying both exactly made the seam and
  the splice clean. Check `gen/map/<neighbour>/parts/` for the road just before writing it, not only at the start.
- **Ground lines stop at your ownership boundary** when the next structures agent's look range overlaps yours (S1:
  structures_e started its banks at 32850): ending yours at the boundary leaves the merge one overlap to settle
  instead of a pair of duplicate lines.
- **Count the painter's diminution from the tile agents' parts** when the structures agent finishes after them
  (a short script over `pts.foot` and `pts.head`): S1's foreground figures are 1.8× S4's road figures, so the
  "road size" of one section is not another's.
