# S2 canal: the build (blender/canal_scene.py, Run 2, 2026-10-12)

For the area agent to paste into `sections/canal/notes.md`. Builder: `blender/canal_scene.py` (built headless with
`tools/build_scene.sh canal`; log `gen/sections/canal/web_build/build.log`). It builds on the merged
`build_choices.json` (87 moves: the boats agent's river.json, the casting agent's cast.json, my build.json) and the
boats agent's `gen/sections/canal/river_plan.json`.

## Numbers (final build, 14:03)

- **117,260 triangles in the section GLB, 115.6k drawn** (budget_check), 1.6k collider-only; 46 draw calls (buckets);
  194 owners. `web/public/assets/canal.glb` 1.98 MB (geometry only; 11 shared kit textures).
- `tools/loyalty_check.mjs S2`: **PASS** (every building 37, structure 12, prop 103, land vehicle 3, grd 11, road 2,
  water 4; the boats GLB holds 16 boats, `boat_small_bow_22158` unbuilt by the boats agent).
- `tools/budget_check.mjs canal --no-load`: triangles drawn PASS (115.6k / 130k), colliders PASS (1.6k / 5k), own
  textures PASS (14.4 MB / 24). **Download FAIL: 9.08 MB / 9** (my GLB 1.98 + boats GLB 1.97 + JSON 0.35 + panels 0.37
  + **tree cards 4.51**, the stand-ins until the tree factory delivers) and 22.2 / 20 with the shared kit and cast.
- By kind: buildings 59.8k, props 25.0k, ground 14.8k, structures 8.7k, land vehicles 5.8k, figures' parts (seats,
  the stick bundle, the footing) 1.1k, edge walls 0.9k (edge:shore 419 pieces), water 761 (W 197, W2 218, M 153,
  E 193), tree trunks 0.4k.

| owner (top 15) | triangles |
|---|---|
| ground | 14,793 |
| S2.bld.wang_paper_horse_shop_27100 (王家纸马铺, its goods) | 7,380 |
| S2.bld.scaffold_house_24975 (with its pole scaffold, banner, awning) | 5,152 |
| S2.bld.river_terrace_23250 (kc.stilt_terrace) | 4,846 |
| S2.bld.wanglou_shed_28660 (望楼饭铺, kc.thatch_shed_skirt) | 3,991 |
| S2.bld.yanhe_yazuo_hall_25690 (沿河雅座) | 3,762 |
| S2.bld.warehouse_26070 | 3,538 |
| S2.bld.fire_tower_28440 (望火楼 pavilion) | 3,254 |
| S2.bld.hall_behind_terrace_23380 | 2,804 |
| S2.str.fire_tower_platform_28450 (望火楼 platform and stair) | 2,554 |
| S2.veh.mule_cart_24305 (kit_vehicles.open_cart) | 2,396 |
| S2.veh.barrow_crates_25598 (kit_vehicles.barrow_load) | 2,284 |
| S2.bld.long_house_22780 | 2,214 |
| S2.bld.shop_row_21200 | 2,012 |
| S2.bld.thatched_shed_south_21600 | 1,783 |

Where the triangles went: the walker-facing fronts (the paper shop, the scaffold house, the terrace, the sheds,
沿河雅座, the 望火楼) carry them; roofs at the silk's top and across the river are coarse (`roof()` detail FAR: no
rafter ends, plain ridges), and only the hall behind the terrace and the paper shop, scaffold house and gateway use
the kit's 歇山 / rafter-end roofs. The ground is a restricted quadtree: 0.5 m cells within 1 m of a shore or bank top,
2 m cells more than 2 m outside the painted area, 1 m elsewhere, crack-free fans, clipped straight along both seams.

## What was built, by kind

- **Water (4 reaches):** `kit_boats.water_strip` per reach from the river plan's lines (walls off), one mesh. W and W2
  have their mapped south shores; M and E have none (the silk's bottom cuts the water): their south sides run on 16 m
  south of the silk's bottom edge at the water's H (D -19.34), E's stopping on the S1 seam's line run south; the reaches
  meet along straight lines (W2/M from W2's south shore's end on the silk edge to u 23300's north shore point, M/E
  straight south from u 26000's). The shore walls (`edge:shore`, 419 pieces) are my own `shore_walls()` (the kit's
  piece logic) along the real shores only, none along the run-on lines or the joins.
- **Ground and banks (grd 11, roads 2):** heightfield; the banks fall from the plan's bank tops (H 0) to its shores
  (H -0.7); where two banks' slopes overlap the lowest wins (continuous). The south-bank mound is a 0.5 m rounded bank
  behind its crest (in the ground; the river.json `how` says the slope is as mapped, which stays true: the hump is on
  its land side). `S2.grd.bank_lines_top_28900` is a 0.28 m raised bank between its two lines (build.json `how`). The
  roads and the two yards (wharf yard, pole-frame yard) are worn bare in the ground's blend channel.
- **Buildings 37 / structures 12:** every one from the kit parts (song_kit, kit_canal, kit_inner_city,
  kit_outer_road(_2), kit_city_end); composition helpers in the builder (`roof`, `shop`, `far_house`, `open_shed`) use
  kit primitives only.
- **Props 103:** each at its mapped point at real size (choices below); furniture squared to its building.
- **Land vehicles 3:** the mule cart from `kit_vehicles.open_cart` (bed top 0.91 = the frame's cart bed, where the
  loader stands; its front 0.96 m ahead of the painted wheel; rope traces to the casting agent's set-out mules), the
  crate barrow from `kit_vehicles.barrow_load(load="crates")`, the round-topped cart from `kit_canal.round_top_cart`.
  The builder keeps fallbacks (the vehicle kit's own bed/shaft/harness parts) for when a kit function is missing; the
  log line `WATER {... "cart", "barrow", "round"}` says which ran (all three kit functions in the final build).
- **Parts of figures:** 12 seats from `gen/sections/canal/seats.json` (10 stools, 2 folding seats at 沿河雅座's window;
  never colliding), the grain owner's seat is the mapped sack pile (its level top 0.425 m over the ground), the footing
  under `S2.fig.man_in_river_20970` (a hidden block, top H -1.65), the stick bundle beside
  `S2.fig.man_with_sticks_bank_24390` (`kc.stick_bundle`), and a hidden trunk collider for each tree except the shrubs,
  weeds, stems and the small post-tree (two legs for the split willow, from its custom points).

## Choices that matter

- **Real size, painted place.** The north bank is painted at 0.5-0.85 of life: every building keeps real heights
  (eaves 2.3-3.6 m; 沿河雅座's floor 1.3 with its room 2.7 m high; the warehouse platform 0.9) on its painted frontage;
  backs hidden past the silk's top are choice depths (1.5-6.5 m, most 2.6-3.6). Fronts stay on their painted lines
  (squared to the frame only where noted), so the river plan's 3 m walk holds. **Fronts I moved:** the long house's
  front 0.4 m north (the shrub row and weed clump painted at its wall foot stand outside it); the far shed at the top
  (28720) 0.25 m north (the three far trees painted at its foot); 沿河雅座's west end carried from 211.75 to 211.2 to meet
  the open shop's east wall (no gap a walker could squeeze into). No front moved south.
- **The 望火楼:** a 4.0 x 4.0 m platform centred on the painted front's middle (279.3), its front at D 24.95 (just
  behind the rear shed), run straight north (in this frame the painted back corners, 45 px left of the front, lie
  straight behind), the kit's 5.6 m; the stair at the platform's front depth on its west side, its foot 2.7 m west
  (the painted 1.4 m run x the platform's 2.0 enlargement), clear of the elm painted beside it and of the gable-loft
  house (built x 270.1-274.5 for it). Pavilion and platform under their own IDs (`part=`).
- **The terrace:** its back carried 0.45 m north of the furthest thing painted on its floor (the placeholder back left
  its tables, chair and bundle outside), its floor 6 cm over the bank top at its back, its stilts to the built ground
  under each (the layout moves it with the bank: river.json).
- **Squared or reshaped from placeholders:** the south-bank roofs' bodies stand south of their painted roofs (a roof
  outline mapped at H 0 reads 3-4 m too far north): the hall x 163.4-173.0 D -8..-1.6 (its west eave over the figure
  painted under it), the thatched shed x 169.4-177.3 D -6.6..-2.9, the gable house x 174-179.8 D -10.6..-7.6 (beyond the
  silk: roof only shows); the tall rear hall D 24.1-27.3 (clear of the far street's people and the barrow); the
  scaffold house 3.0 m deep (the head painted over its roof stands behind it); the hall behind the terrace x 178-183.9
  (west of the eatery's back furniture); the low shed D 21.95-23.45 (the porter walks behind it); 喝杯小酒's east end
  0.9 m short (the man behind the tub stands at the next shed's post).
- **Posts where painted, moved clear of furniture:** open sheds take their posts at the painted u's, each moved along
  its front (at most 0.45 m) clear of the people and furniture painted at it, or dropped (`clear_posts`).
- **One painted board, one model:** the open shop 25340's narrow signboard is the board `S2.prop.signboard_pole_25235`
  hangs on its pole (cell `pole_sign`); `shop_sign_3` is not used.
- **Signs:** `wang_paper_horse` on the paper shop's tall board (0.5 m wide, height from the cell's aspect, a foot
  frame with splayed feet), `pole_sign`, `far_panel_2` on the far lattice front (u 23477-23502).
- **Edges** (build.json `edges`): west on the S3 seam's land parts only (the north strip from the plan's bank-top seam
  point (149.37, 24.68) to the silk's top; the south bank from the silk's bottom to (156.16, 7.49)); east the whole S1
  seam; north the whole silk's top; south only on land (the south bank to the spit's end, 160.85-189.97, and the
  sliver between the east reach's end and the S1 seam's foot).
- **Seams:** the ground stops 0.5 m past the S3 seam dipping 0.12 m (S3's ground on top) and runs level 1 m past the S1
  seam (S1's dips under it), both edges clipped straight along the seam lines; 16 m under the mist north and south.
  The river meets the S3 seam at the plan's north point (149.37, 24.68) and W's mapped south point (156.16, 7.49); the
  lead plans the seam's water with S3.
- **Recorded moves (build.json):** `S2.prop.shop_bench_23955` (dX -0.45, dD +0.18, turned north-south: the casting
  agent's request, the black-capped man's feet under the small table).

## Checks

- `check_inside()`: no figure, animal or tree inside a closed room.
- Placement probe on the colliders (`scratchpad/S2_run2_build/probe_spots.py`): the rows for the casting agent are in
  `gen/sections/canal/build/inside.json` (7: three nudges needed, four optional); fixed in the builder: a stall table
  under a standing man (0.75 m long now), the south-bank timber frame's post under the crouching man (now at the painted
  post), the raised shop's counter (its depth now inside the shop), a needless invisible board in 沿河雅座's windows.
- Smoke walks (page, CDP 9244, `scratchpad/S2_run2_build/walks_final.json`, 8/8 PASS): the north strip from the S3
  seam, the trackers' bank, through the terrace floor, the halls' strip, the east wharf, edge east (S1 seam), edge
  north, the south bank hall's wall. The QA agent owns the full walks and shots.

## Waiting on others

- **Tree factory:** the cards (4.5 MB stand-ins) are what puts the section's download over 9 MB.
- **Boats agent / lead:** `S2.veh.boat_small_bow_22158` unbuilt (a bow-only boat at the silk's edge).
- **Casting agent:** the nudges in `inside.json`.
- **Kit agent:** nothing outstanding; every contract function is real (v4). kit_common is not imported by the builder.
- **The lead:** S3's seam water (S3 may move its own north bank: S2's ends on the mapped bank-top point (149.37,
  24.68)); `S2.grd.bank_lines_top_28900` vs `S1.grd.terraced_fields_29450` (the same two lines).
