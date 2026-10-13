---
name: web-scene
description: Build, ship and measure a walkable qingming web scene (a scroll section or a test slice) - Blender builder from the kits (Song parts, carts, boats, set pieces such as the Rainbow Bridge) -> optimized GLB -> the three.js world page (a streaming window of sections, KTX2 textures, the Space scroll HUD that shows where you stand on the original painting) -> checks, a size budget and a real-GPU bench. Use when composing a section in three.js, building boats or a set piece, rebuilding a section's assets, working on the world page or the scroll HUD, or asked how fast or how big a scene is.
---

# Web scene workflow (qingming/)

The street B1 slice set this workflow; the gate section reused it unchanged. Each step is one small script
that does one thing. Compose them per scene, and don't merge or re-invent them.

**Loyalty comes first** (`qingming/map/BUILDING.md`, the user, 2026-10-11): a scene holds one model for each thing
the scroll map lists and nothing else. No filler props, extra walls, grass tufts or invented crowds. Where nothing is
painted, invisible edge walls close the walkable area and the page shows painting beyond it: mist, and painted
panels of the neighbouring sections. The builder is strict (every piece inside `sb.entity(<map id>)`), and
`tools/loyalty_check.mjs` must PASS before a scene is shown.

## The atomic scripts

| Step | Script | What it does |
|---|---|---|
| Kit | `blender/song_kit.py` | The Song construction kit every scene is composed from. Primitives: `beam` (chamfered member), `prism`, `board`, `rock`. Soft pieces (no straight edge): `soft_slab` / `soft_box` (hand-cut outline, rounded corners each with its own radius, wavy edges, eased top, slight tilt, its own patch of the swatch), `stone_run`, `masonry`, `paving`, `soft_plinth`, `plank_deck`; `FACE_ATLAS` maps soft stones onto whole painted cells. Timber: `column` (octagonal, on a stone base), `bracket` (斗拱), `balustrade`, `lattice_window`, `plank_door`, `stairs` (full-rise stones on a sawtooth fill, with a hidden ramp collider). Roofs: `hip_roof` and `gable_roof` (curved, with thickness, rafter ends, ridges and ornaments). Set pieces: `house`, `open_hall`, `far_shed`, `rammed_wall`, `yard_wall`, `bale`, `drum`, `frame_scale`, `table`, `cask`, `bucket`, `sack`, `pack_frame`, `stakes`, `bundle_pile`, `canopy` (a stall canopy on poles), `trestle` (a timber pier under a bridge end). Earth and rock: `boulder` (soft, lumpy, smooth-shaded; base tucked under the ground), `earth_mound` (boulders piled on an earth bank on a four-corner plan). Use set pieces only for things the map lists (`grass_tuft`, `yard_wall` and `rammed_wall` are kept for sections that paint them). `with placed(frame(x, y, z, yaw)):` builds in a local frame. Add new generic parts to a kit module (this one, the vehicle kit or a section kit), never in the scene builder. |
| Vehicles | `blender/kit_vehicles.py` (a kit module of its own beside `song_kit.py`) | The painted carts as kit models, real size, from kit primitives: `covered_ox_cart`, `barrow_screen` (串车), `sack_cart`, `mule_wagon` (太平车; `load="sacks"`, `"covered"` or `None`), `cask_cart`, `sedan_chair` (`carried`). Each takes the map's `front`, `rear`, `wheels` and its `team` [(X, D, facing, kind)], builds wheels, body, roof, load and the harness (yoke, swingletree, traces) reaching the team's collar or yoke points (`HARNESS`, measured on the rigged animals), adds one hidden collider, and returns its triangles; sizes the strokes can't give are `choice:` kwargs; wrap the call in `sb.entity(<vehicle id>)`. `covered_ox_cart`, `mule_wagon` and `cask_cart` (`driver_seat=True`) return `Built`, an int (the triangles) with `.seat` and `.feet` for a seated driver. Round 2 (signatures in `gen/expand/round2/kit_progress.md`): `barrow_load(load="hoops"\|"crates")`, `open_cart` (mules on rope traces; `.bed` for a loader), `sedan_chair(front_style="closed", roof="round"\|"concave", finial=)`, `barrow_screen(stakes=, poles=, panel=)`. Review: `tools/blender_slot.sh -b --factory-startup --python <abs path>/blender/kit_vehicles.py -- review <abs out_dir> [types]` renders each type with the real animals at the team spots. |
| Boats | `blender/kit_boats.py` (a kit module beside `kit_vehicles.py`; types `gen/boats/types.md`, water `gen/boats/water.md`, sheet `gen/boats/sheet.jpg`) | The painted boats as kit models, real size per type (`TYPES`, `choice:`): `passenger` (客船: long windowed house, bow platform and curled stem post, foredeck canopy, stern gallery; 24.6 m overall), `grain` (漕船 / 万石船: `hold='laden'` mat mound under a rope net, `'awning'` arched mat awnings, `'hatch'`; a crew house aft; 24.5 m), `small` (awning or open, thwarts; 9.3 m). Options as painted: `mast` `'up'`/`'lowering'`/`'down'` (the A-frame 人字桅 with rungs, stays, `tow_to`), `sweep` (大橹), `oars`, `gangplank`, `moor`, `cargo`, `cloths`, `stern_house`. `boat_from_layout(ent, map_id, sink='nodes'\|'world')` places one from its `layout.json` entity: `front`/`rear` at the waterline, centred on their midpoint, turned to their heading; the type from `kind_of()` (`what` first, then the name, then the slug; set `kind` in `build_choices.json` where it disagrees with the painting), the beam from `beam_n`/`beam_s`, the freeboard from `bow_top`/`stern_top`, the motion from `pose`. Sink `'nodes'`: one movable root per boat (`boat:<map id>`, "Boats and water" below); `export_boats()` writes them to one GLB. Sink `'world'`: baked static into the section's buckets inside `sb.entity(id)`. `lod=1` for far boats. The builder never calls it for a section's boats: `export_web_scene.mjs` builds them (`blender/build_boats.py`) from `build_choices.json` `boats.<id>.kit` ("Boats and water"). Round-2 options (`gen/boats/round2_options.json`, its `about`; reference `gen/boats/types.md`): `awnings` `[[from, to, 'arch'\|'flat', {...}]]` as fractions of the waterline from the stern (0) to the stem (1), bow hoods, the sweep at rest or shipped, a mast crutch, stern anchor lines, a pointed bow, tiller and stern cabin for small hulls. Review: `tools/blender_slot.sh -b --factory-startup --python <abs path>/blender/kit_boats.py -- review <abs out_dir> [names] [lods]` (`export` for GLBs). |
| Water | `kit_boats.water_strip(water, frame, map_id, layout=L, seams=(...))`, `water_mesh(bpy, strips, coll=)`, `water_quad(layout, H)`; `web/src/water.js` | One flat strip per reach at the frame's `supports.water.H` between its mapped `shore_s` and `shore_n` (or `centre` + `width_m` for a stream), run on 16 m under the mist past the silk's edges and cut exactly on the seams (`seams`: the sides that are seams; the scroll's start is `("west",)`), 150–330 triangles a section; invisible shore walls `edge:shore` in 0.5 m pieces along mapped shores inside the painted area. Call `water_strip` before the buckets become meshes (it adds the walls), `water_mesh` after, and record each strip's triangles under its water entity; never water in buckets of material `water` as well. The page shades it opaque, lit by the hour, with the painted current lines (one 512 px R8 tile for the world, 22 KB, `assets/water/`) drifting downstream at 0.25 m/s, fading at the shores and past 45–90 m, a pale shore band and the kit's wet ring round each hull; no reflection, refraction, waves or extra pass. |
| Boats (page) | `web/src/boats.js` (hooks in `world.js`, `people.js`, `player.js`, `scroll_hud.js`); test page `web/boats.html` (fixture `gen/boats/page_test/`: walks.json 12, shots.json; rides `gen/expand/round2/page_qa/ride_test.mjs`) | A section's boats load and unload with it, one `BatchedMesh` per material for all of them (+21–27 draw calls for seven). Moored boats ride (bob 2.2 cm, roll 0.6°); boats painted under way pause at their spot (8 s), go out along their heading (8 m rowed or towed, 6 poled, 12 sailing, 2 lowering a mast) and back astern, with sweep, oars, mast and ropes working; the bow wave shows only while going ahead. Decks carry the walker (`player.platforms`); rails stand except where a boat touches a bank, stair, jetty, gangplank foot or another walkable boat at rest (a bridge, end walls, and the section's shore walls opened inside the contact's footprint); lod 1 beyond 36 m. Crew stand on the level their support names (`host()`: `boat [<part> ]deck\|roof\|ladder: <id>`; a deck figure under a cabin, awning or cargo mound steps to the nearest open deck). `window.__test.boats` (`list`, `byId`, `report()`, `stats`). |
| Set pieces | `blender/kit_rainbow_bridge.py` (record `gen/set_pieces/rainbow_bridge/study.md`, sheet `sheet.jpg` there) | One mapped entity big enough for its own kit: the 虹桥 `S3.str.rainbow_bridge`. A **fit** in plain Python (the layout entity + `map/frames/S3.json` → one plan in world metres; a CLI too, `python3 blender/kit_rainbow_bridge.py table <layout.json> <frame.json>`: stations with X, D, H and the scan u of both deck edges) and a **build**, `build(layout_entity, frame)` → `Bridge`, every piece inside `sb.entity(<map id>)`. `Bridge.h_profile()` is the built deck as `[u, H]`, `check_profile(pairs)` compares the map's pairs with it, `on_deck(u, v)` puts a painted foot on the deck (H and depth solved together), `clearance()` the soffit over the water, `summary()["notes"]` every departure from the painting. 18.9k visible triangles + 532 collider, 0.34 MB, 6 draws. Lessons: "Set pieces" below. |
| Section kits | `blender/kit_inner_city.py`, `blender/kit_outer_road.py` | The parts a section needed that `song_kit` lacked, generic, positions from the caller. Inner city: two-storey parts (`lean_to` pent roof, `floor_slab`, `wall_bays` with windows, open bays and doors), `xieshan_roof`, `cailou` (彩楼欢门), `pole_scaffold`, `gourd_lamp`, `lamp_box`, signs from an atlas (`signboard`, `eave_plaque`, `banner_on_pole`, `a_frame_board`), `square_well`, `umbrella`, `mat_roof`, `slat_fence`, stall furniture (`tray_stand`, `counter`, `bench`, `stool`, `tub`, `round_basket`, `chopping_block`) and goods. Outer road: `earth_wall`, `stake_crest`, `gate_frame` + `studded_leaf`, `planked_bank`, `humped_bridge`, `thatch_roof` / `thatch_shed` / `thatch_hut`, `bamboo_blind`, `arched_canopy`, `guardian_statue`, banners, hanging signs and goods, `low_rail_fence`. Round 2: `kit_common.py` (the kit factory's shared parts: `thatch_gablet`, `thatch_lean_to`, `stilt_deck`, `swag_curtain`, `board_wall`, `mooring_stake`), `kit_outer_road_2.py` (`hall`, `south_row_hall`, `palm_cart`, `open_mat_shed`, `two_tier_stall`, `stump`, ...), `kit_rainbow_bridge_area.py` (十千脚店 whole, `cailou` with a `diamond_lattice`, `river_hall`, `world_to_scan` / `scan_to_world`), `kit_rainbow_bridge_props.py` (`place_props` and its parts), `kit_canal.py` (`fire_tower` 望火楼, `stilt_terrace`, `jetty`, `rough_steps`, `round_top_cart`, ...), `kit_countryside.py` (`thatch_house`, `tile_house`, `hedge_row`, `brush_fence`, `wattle_fence`, `haystack_dome`, `turf_bridge`, `stony_ground`, ...), `kit_city_end.py` (`lozenge_tablet`, `tall_signboard`, `medicine_rack`, `hooped_bucket`, `slatted_tub`, `patterned_front`, `cell_aspect`, ...). Read them before asking a factory for a part. **The kit modules stay separate files** (the lead, 2026-10-12): a builder imports the ones it needs (`outer_road_scene` uses `kit_inner_city` too), and a new section's agent adds its parts to its own `blender/kit_<name>.py`, never to a kit it doesn't own. Review renders per part in `gen/sections/<name>/kit_review/`. |
| Layout | `node tools/map_layout.mjs <S>` | The scene's positions from the scroll map (`map/`, skill `scroll-section`): `sections/<name>/layout.json` with every structure's footprint, heights and bays, the road (centre line and stations), trees and figures, by map ID, plus the moves recorded in `sections/<name>/build_choices.json` (each with a reason). Each entity keeps its `pose`, its `lines_H` (the heights of lines off the ground: a deck's edges, a road over a bridge) and, for a vehicle, its `what` (a boat's type, cabin, rig and cargo, which `kit_boats.kind_of` reads). A move shifts the whole entity, `pos`, every point (an animal's hooves, a cart's front and wheels), `footprint` and `bays`, so whatever is built from them follows (a yoke on moved oxen); `layout.moved` lists the moves. Builders take the points as they are and never shift them again. Never type a position into a builder, `scene.json` or `people.json`; `scene.json` holds only camera spots. |
| Build | `blender/<name>_scene.py` → `build(scene)` | Composes the scene from the kit in the live Blender session, into collection `<name>_scene`. `derive(layout)` turns the layout into the builder's places; sizes the strokes can't give are marked `choice:` in the code and listed in the section's notes. The bucket set is strict (`sb.Buckets(strict=True)`): all geometry is added inside `with sb.entity("<map id>"):` (or `"edge:<name>"` for an invisible wall, `"ground"`), and `build()` writes `sections/<name>/placed.json` (triangles per owner, the walkable area). Edge walls follow `layout.json` `painted_area` (the seams and the silk's edges), one per side (`edge:south\|east\|north\|west`, so the page can drop a seam's), moved only by a recorded choice. At a seam one ground lies on top: the gate's stops 1 m past its seams, and its neighbours' grounds stop 0.5 m past the seam and dip 0.12 m toward it, under the gate's; a new section's ground does the same under its built neighbour's. Reload order in the live session: `street_b1`, `song_kit`, the other kit modules, then the scene module (reloading `street_b1` after `song_kit` wipes the kit's materials). One mesh per (material, collide) bucket, named `g_<material>__col` / `__nocol`. The page collides with every `__col` mesh; `hidden__col` is collider-only (stair ramps, trunks, banks, the edge of the section). |
| Headless build | `tools/build_scene.sh <name>` (→ `blender/build_web_scene.py`) | Builds `blender/<name>_scene.py` in a background Windows Blender with factory settings (no GUI, so several sections build at once and the live session is untouched): a scene of its own, the raw GLB in `gen/sections/<name>/web_build/`, `placed.json` from `build()`, stats as `BUILD_STATS {...}` (log: `web_build/build.log`). Same triangles and owners as a live build (checked on the gate, 2026-10-11). Builders export through `street_b1.export_collection` (works with or without a window). It waits for one of the machine's **three Blender slots** (lock files `/tmp/qingming_blender_slot_<n>.lock`; `QINGMING_BLENDER_SLOTS` overrides the count; 16 cores, 23 GB). Every other headless Blender run (kit reviews, boat exports) goes through `tools/blender_slot.sh <blender args>`, which takes the same slots, so many agents never run more than three at once. Pass absolute paths: `scripts/blender_wsl.sh` converts only those. |
| Loyalty | `node tools/loyalty_check.mjs <S>` | The map vs what the build places, kind by kind (`placed.json`, the layout's trees, `people.json`, the boats manifest). FAIL on geometry with no map ID, a person who isn't a mapped figure, invented traffic, a mapped thing neither built nor listed under `unbuilt` in `build_choices.json`, a crew figure on a boat the boats GLB doesn't hold, or a `people.json` `boats` key, crew, haul or tow name that isn't mapped. Run after every build and every export. |
| Backdrop | `node tools/backdrop.mjs <name> [status\|cut\|gen\|ship\|sheet\|all] [--only east,north] [--force] [--review]`; `web/src/backdrop.js` | The painting beyond the edges (`sections/<name>/backdrop.json`): one panel per edge that has something painted beyond it, restyled from the scroll strip past that edge (`scan`: one rect, or several joined to leave out what is built in 3D or a seal) with `prompts/backdrop_panel.txt` + `prompts/backdrop_<name>_<side>.txt` (B1 as style). The panel prompt asks for an **eye-level** view (horizon a quarter up, no view down onto roofs); the content prompt names only what the strip paints, from `map/text/<S>.md`, in the viewer's frame (looking east, the strip's top edge is on the left; looking west, on the right), and ends with what is not there. `gen` draws `candidates` images per panel (cached by a key over prompt, model, size, candidates and refs; the model returns its own aspect whatever `size` asks). `ship` keys the paper out with an edge matte (no frosted crowns), bleeds colour under the transparent pixels (no mipmap halo), trims, measures the horizon and the ground's foot, and logs `ground strip` and `near-white`; `ship --review` does the same and writes the review sheets without touching the page's panels. Read `gen/sections/<name>/backdrop/review_<side>.jpg` (strip, every candidate, the keyed panel on night and day) and reject anything the strip doesn't paint: `pick`, with every pick and rejection and its reason in `picked`; `hold` (a reason) keeps a panel off the page, which shows mist. A north panel only where the silk's top band paints open ground that runs on (the gate); where the edge cuts roofs or crowns (S4, S6): mist. The page stands the panels on one ellipse round the whole world's painted area at their true aspect, horizon at the viewer's eye (lifted where the painted ground strip is too deep), foot in ground mist; a panel stands in for a neighbour that isn't loaded, so a seam whose neighbour is always in the window (an end section's: S7 with S6) gets none (`panels: []`, the reason in `backdrop.json`'s `about`). The ink pass (`post.js`) veils everything outside the walkable area in mist: the painted area, grown past the silk's top and bottom edges by boxes round what `build_choices` moved there and round the north and shore edge walls (`backdrop.js` `walkableBoxes`; below the bottom edge only moved things count; `?mistwalk=0` for A/B). South of the silk's bottom edge: mist only. After shipping: `node tools/ktx2.mjs encode`. Keying, picking and the horizon: "Backdrop panels" below; the method: `gen/expand/backdrop_lessons.md`. |
| Materials | prompt `prompts/material_sheet_<name>.txt` → `shyfai_image.py --ref gen/v1/target_street_B1.png --size 1536x1024` → `node tools/cut_material_sheet.mjs <sheet> <out_dir> <6 names>` | Six painted swatches in B1's style, cut to 512 px `tex_<name>.png`, with a `tile_check.jpg`. Register them in the kit's material table (full path, tile size in metres). `material_sheet_gate_surfaces.txt` asks for structure-free washes (joints come from geometry). |
| Seamless | `node tools/make_tileable.mjs <tex.png ...>` | Cross-fades a swatch with half-rolled copies (x, then y), in place: no wrap seam. For soft washes. |
| Face atlas | prompt `prompts/atlas_<what>.txt` → shyfai `--size 1024x1024` → `node tools/cut_atlas.mjs <sheet> <atlas.png> 4 4 256` | A grid of individually painted faces (e.g. stones with worn, inked edges) packed with no gutters. Register as the target of `song_kit.FACE_ATLAS`. |
| Pack / tone | `node tools/join_textures.mjs <out> <a> <b>`; `node tools/match_tone.mjs <ref> <target> [gain]` | Two swatches side by side for a two-half shader (ground \| road, bricks \| wash); match a swatch's mean tone to another's. |
| Export | same module → `export(scene, path)` | Writes `gen/sections/<name>/web_build/<name>_raw.glb`. It swaps `window.scene` and passes `use_active_scene=True`, so other scenes in the .blend (the Messenger study ones) never leak in. |
| Ship | `node tools/export_web_scene.mjs <name>` | Runs `gltf-transform optimize` with meshopt geometry, webp textures capped at **1024 px** (swatches are 512, atlases 1024), attribute pruning **off** (the ground's TEXCOORD_1) and join/instance/palette/flatten/simplify **off**, so the `__col` names survive. Moves the textures out to `web/public/assets/tex/<name>.<hash>.webp`, one file per swatch shared by every section (the GLB keeps only geometry and points at them by URI). Writes `web/public/assets/<name>.glb` and copies `sections/<name>/layout.json`, `scene.json` and `people.json` to `web/public/assets/<name>/`, then runs `tools/scroll_index.mjs` for the section's key (from `map/sections.json` by folder): the export fails if a figure projects more than 2 px off its stroke. Run it again after every `people.json` edit (the page reads the copy). When the layout lists boats (vehicles with a `boat_` slug) it also builds them through the boat kit (`blender/build_boats.py`, in a Blender slot, when the layout, `build_choices.json` or the kit is newer than the raw boats GLB), ships `web/public/assets/<name>_boats.glb` (both detail levels) and `assets/<name>/boats.json`, and checks that every boat's nodes, pivots and extras survived the optimize step. `--no-boats` (people or data only), `--boats-only`, `--rebuild-boats`; `--src`, `--raw`, `--out` (a set piece measured outside `web/`), `--data`. Tiled UVs ship as float32: the optimize step's quantize skips any UV set outside 0–1, and every swatch tiles (0.93 of `canal.glb`'s 1.93 MB); rounding tiled UVs to 1/1024 of a repeat in the builder (`UV_Q` in `blender/canal_scene.py`; sign and atlas UVs exact) took it to 1.74 MB with no visible change. |
| Scroll index | `node tools/scroll_index.mjs <S>\|all` (run by `export_web_scene.mjs`) | Where the section's painted figures are on the original painting, for the scroll HUD: `web/public/assets/<folder>/scroll_index.json` (per map ID of figures, animals, vehicles, buildings and structures: the painted box `b`, foot `f` and head `h` in scan px, a name `n` and a short what `w`; never a number in a label: `plain()` drops numbers and letter-digit tags such as S1's donkeys "D1"–"D5") and `web/public/assets/scroll/sections.json` (every exported section of `map/sections.json` with its painted range, frames and support heights). Boxes come from the measured points: a figure foot → head with a width by pose; an animal's hooves and head, its rump and back by its species (the `model` in people.json); a lying figure from the head to past its foot point; a cart's ends and wheels plus its load. Every run checks the projection: each figure's and animal's layout position projected onto the scan with `web/src/scroll_projection.js` must land within 2 px of its stroke (exit 1 otherwise: rerun `map_layout.mjs <S>` after a frame change). |
| Scroll tiles | `node tools/scroll_tiles.mjs [--quality 70]` | The scan as a webp tile pyramid for the HUD (`web/public/assets/scroll/`: 512 px tiles at 1/1–1/8, a 2731 × 128 whole-scroll strip, `tiles.json`; 410 files, 21.9 MB; nothing is fetched until the HUD opens). Once for the whole scroll; rerun only if the scan changes. It overwrites in place: never delete the folder under a running dev server. |
| Characters | `node tools/character.mjs <name\|all> <step>` (skill `characters`) | One GLB per character with its named clips in `web/public/assets/chars/`, listed in `characters.json`. |
| People | `sections/<name>/people.json`, run by `web/src/people.js` | Every painted figure at its painted spot with an action cycle (`scale` for children); figures painted mid-stride or carrying walk a short path along their painted direction and back; `animals` at their map spots. No invented traffic: `load_test_traffic` feeds only the load-test panel. A big section's is generated by a rerunnable script that knows the kit's real sizes (`gen/sections/inner_city/make_people.py`, `gen/sections/outer_road/make_people.py`). See the `characters` skill. |
| Tree cards | `node tools/tree_cards.mjs [status\|refs\|gen\|key\|ship\|sheet\|check\|all] [--form f] [--only card]` (forms and variants in `trees/cards.json`, prompts `prompts/tree_card.txt` + `prompts/tree_<form>.txt`) | One painted alpha card per tree form the scroll paints, 1–8 variants each (`trees/types.md`; 52 cards by round 2): shyfai on plain white with `background: opaque` (API cut-outs are set aside and drawn again), keyed to clean alpha with no halo, shipped to `web/public/assets/trees/<form>_<n>.webp` (768 px tall, `ship_h` 512 for saplings and the hedge row; ≤ 160 KB) and listed in `trees.json` (`file`, `base_uv` = the trunk foot, `height_m` × `width_m` = the card plane at scale 1, `tree_m` = the real tree). Every mapped tree has a card and a mirror flag in `trees/assign/<S>.json`, which `map_layout.mjs` copies into `layout.json`; a tree built as a solid kit model (S4b's stump) is `{"card": "kit"}`, and the page and `budget_check` plant no card on it. A section without an assignment draws every tree on the default willow card: assign before the first export. `check` must PASS: no two trees within 6 m share a card, and none within 15 m show the same card the same way round; both radii shrink for small trees by min(1, H / 8 m), H the taller of the pair as the page shows it (it reads the sections from `map/sections.json`: every key with a folder and a `map/world/<S>.json`). Read `gen/trees/check/form_<form>.jpg` (the scan reference beside the cards), the `gen/trees/check/<card>.jpg` images and `gen/trees/sheet.jpg` before shipping, and run `node tools/ktx2.mjs encode` after. The card is a tree's far level; near it the tree is 3D (the next row). |
| 3D trees | `node tools/trees3d.mjs [status\|bare\|clumps\|meshy --go\|convert\|proc\|atlas\|bark\|build\|look\|check] [--only a,b]` (config `trees/trees3d.json`; prompts `gen/details/trees/prompts/`; Blender `blender/trees3d_convert.py`; card-built wood `tools/lib/trees3d_proc.mjs`; page `web/src/trees3d.js`, wind `web/src/wind.js`; method `gen/details/trees/method.md`) | Every mapped tree near you is a real tree of its painted form: its wood and a crown of painted clumps swaying in the wind, its card the far level (a dithered hand-over over 6 m). `bare`: shyfai repaints each card bare (trunk, limbs, heads); `clumps`: a sheet of four painted clumps per kind; `meshy --go`: Meshy image-to-3D of the bare painting (15 credits, logged); `convert`: weld, decimate to 2000-2400 triangles, real height (the bare painting's scale fitted to its card on the trunk width), limb ends; `proc`: wood from the card's own strokes for thin forms; `atlas` / `bark`: the 2048 px crown atlas (32 cells) and bark atlas; `build`: per card a meshopt GLB in `web/public/assets/trees3d/` and `trees3d.json` (with each bole's radius for colliders); `look`: front and side sheets; `check`: every mapped tree has its card, its far level and its 3D tree, and the atlases' KTX2 copies are current. Run `node tools/ktx2.mjs encode --kind tree --only trees3d` after `atlas` or `bark`. **Opt-in until signed off: the page draws them only with `?trees=3d`** (without it trees3d.js is inert and the page draws exactly the cards, as before; `?trees=cards` drops the module altogether). |
| KTX2 | `node tools/ktx2.mjs [status\|encode\|check\|review\|adopt] [--kind kit\|tree\|panel] [--only <text>] [--force]` (KTX-Software v4.4.2 `ktx`, in `~/.local/opt/KTX-Software-4.4.2-Linux-x86_64`, or `$KTX`) | A GPU-compressed copy of every texture the page loads: a `.ktx2` next to each webp in `tex/`, `trees/` and `<section>/backdrop_*`, and the characters' and animals' body textures in `assets/ktx2/emb/` (the GLBs untouched; the page finds a copy by the image's byte length and FNV-1a hash; palettes stay webp, their nearest-filtered cells must stay exact). Modes: tree cards UASTC + zstd (alpha must stay exact), panels, kit swatches and bodies ETC1S, the sign and script atlases UASTC. The webps are never changed: they stay the source and the fallback. `assets/ktx2.json` lists each copy with its webp's sha1, flip and mean colour (computed by palette.js's own code in Chrome: a compressed texture can't be read back), so **after any new or redrawn card, panel, swatch or character, run `encode`** (only what changed is encoded; copies whose webp is gone are dropped) and `check` (FAIL while anything is stale). The page picks a copy by the webp's URL: a card or panel redrawn under the same name shows its old KTX2 until `encode` runs. A new kind is adopted only after `review` (19 spots in the page on the real GPU, webp and KTX2 side by side with 1:1 crops, `gen/expand/ktx2_review/`) and `adopt <kind> yes "why"`. All four kinds are adopted (2026-10-12). The page loads copies for adopted kinds only (`?ktx2=0` webps, `?ktx2=all` all); the transcoder ships in `web/public/basis/` (fetched only when a copy is used). With agents in parallel, encode only your own files (`--kind panel --only <name>`, `--kind tree`): a full encode also encodes other agents' pending files and a full `check` fails on them. A sign atlas redrawn between two exports leaves its first `tex/signs_<folder>.<hash>.webp` and its copy behind: after the last export find the hash the GLB names (`strings web/public/assets/<folder>.glb \| grep signs_`), delete the stale pair (files, never a folder) and run `encode` (it drops the orphan) and `check`. |
| Budget | `node tools/budget_check.mjs <folder\|all> [--no-load] [--cdp <port>]` (budgets and their reasons in `tools/budgets.json`) | Per section: download (own 9 MB, its boats GLB included; with the shared kit and its cast 28 MB, raised from 20 for the river sections' crews), triangles drawn (130k) and collider-only (5k), its panels' and cards' GPU MB (24), draw calls at its worst camera spot, all passes (330), and its GPU MB measured alone in a headless load (75, minus the fixed render targets); people reported, not budgeted (the painting sets them). For `all`, the most three neighbours hold together (200 MB GPU): it binds (S4b + S3 + S2: 198.2 MB), so anything added to those three needs room first (the casts, or distance LODs on S4b's buildings). A section's agreed exceptions go in `budgets.json` `exceptions.<folder>`, each with its `_why` (S3: GPU 82 MB for 233 people and animals); only the lead edits it. Must PASS before a section joins the world. Run `ktx2.mjs encode` first: cards shipped as webp alone fail the texture budget. `--cdp` takes another headless Chrome when the bench one is busy. |
| World page | `web/world.html?sections=inner_city,gate,outer_road` (`web/src/world.js`; `gate.html` is the same page with `data-sections="gate"`; with no `?sections=` the body's `data-sections` list, since v1 all eight in scroll order, `city_end,inner_city,gate,outer_road,outer_road_2,rainbow_bridge,canal,countryside`, starting at its `data-spawn`, `inner_city:spawn`; a `?sections=` URL starts at the first section's spawn) | The listed sections in their one shared frame (`map/README.md`, Frames). Every section is known from the start (its `layout.json` painted area and `scene.json` spots); only a **window** is loaded: your section and one either side (`?window=0` yours only, `?window=all` everything), plus any whose painted area is within 20 m of you. "Yours" changes only once you are 10 m inside another, or at a teleport. A section loads at least 27 m before a runner can reach its seam, one load or unload at a time, nearest first, and is fully disposed once it is over 32 m away and has stayed unwanted 2 s: geometry, its own materials, its collider (one BVH per section behind `player.bvh`, a `MultiBVH`) and walls, people and animals, trees, panels. Shared things (kit textures by URL, materials by name, tree cards, characters and animals) are counted by their users and go with the last one. Until a neighbour is in, its seam is an outer edge: its wall stands, and mist and its painted panel cover it; the page drops the walls on a seam between two loaded sections (matched by their `painted_area` corners). The backdrop ring stands round the whole world's painted area, loaded or not. The shadow map follows the player; its box, size and redraw rate are the device tier's ("Reach" below), and so are the render scale, the anti-aliasing and the colour target. `&spawn=<view>` picks a start from any section's `scene.json`. The tuning panel shows only in the scroll HUD. Test hooks: `__test.goto(X, D[, H])` loads the window round a spot and resolves when it is in (`view(name)` too); `__test.sections` lists every section (a loaded one is its record, the others `{ name, state }`), `__test.loaded` the loaded ones; `__test.stream.stats()` the loads and unloads with their stalls; `?gpumem=1` + `__test.gpuMem()` / `gpuTextures()` the GPU bytes (`web/src/gpumem.js`); `__test.boats` the boats; `__test.tiers` (`stats()`, `apply(name, why)`), `__test.post`, `__test.shadows()`. `?tier=low\|mid\|high`, `?adapt=0` (no adaptive resolution), `?mrt=0` (the old separate normal pass), `?window=ahead`, `?clipmeta=0`, `?corridors=0` for A/B. The tools (walks, people, shots, film, bench) wait for the window themselves; benches and look checks pass `?tier=` and `?adapt=0`. |
| Scroll HUD | `web/src/scroll_hud.js`, `web/src/scroll_projection.js` | Space (a scroll button top-right on touch screens) masks the street (a blur and a vignette over the frozen last frame; the page's `tick` returns at once while it is open) and shows the original painting centred on your scan point: you as a cinnabar ring with a wedge for where the camera looks, every painted person and animal within 15 m boxed on its painted figure by map ID, walkers' live dots with a dashed line back to their painted foot; hover or tap names one (name and a short what); wheel or pinch zooms, drag pans, the ring button snaps back; the whole-scroll strip below (click to look elsewhere); the settings panel (only here; H hides it). Tiles load only while it is open and are dropped on close; it uses no WebGL. Needs from a page: the live `sections` map (`{ layout.section, persons[] with .id = slug }`), `player`, the lil-gui panel, the canvas, `people.agentOf`. Test: `window.__test.hud` (`show()`, `hide()`, `stats()`, `you()`, `drawn`). "The scroll HUD" below. |
| Page | `web/<name>.html` + `web/src/<name>.js`; add it to `vite.config.js` | Reuses `daylight.js` (sun path, light and sky by hour round the clock, moon at its real phase, stars, sky dome; the hour is the viewer's local clock unless the panel "Time of day" or `?hour=&flow=` sets one; `?date=` picks the night's moon), `sundial.js` (the only time display: a Song sundial in the corner, from `tools/make_sundial.mjs`), `palette.js` (true colour per material name: a texture keeps its painting, its mean moves to the real colour), `surface.js` (by material name: `wash` texture bombing, `washU`, `blend` ground\|road by TEXCOORD_1, `patch` bricks\|wash, `tone`; `?surface=0` for A/B), `post.js` (ink pass), `player.js` (capsule walker with BVH collision; `pushOut` hook for bodies), `followcam.js` (Messenger's third-person follow camera), `people.js` (characters, routines, bodies) and `settings.js` (panel; give the page its own `key`). Third person with your own character is the default, V switches to first person (your body stays, head collapsed). It must expose `window.__test = { measure, view, views, set, renderer, gpuTimer, people, player }` for the tools (`world.js` adds `goto`, `sections`, `loaded`, `stream`, `hud`, `gpuMem`; a page without `goto` works with the tools as before). |
| Look | `node tools/shots_page.mjs <url> <out> sections/<name>/shots.json [--hour 10\|local]` | Screenshots from listed spots, `[name, X, D, H, facing, pitch, {settings}?]` (e.g. `{"view": "first"}` for close-ups without your character, `{"hour": 21}` for a night), on the real GPU, plus `sheet.jpg`. At 10:00 unless a spot sets its hour (pages follow the clock). Read the sheet before showing anything. |
| Walk | `node tools/walk_page.mjs <url> sections/<name>/walks.json` | Holds W along routes and checks where the walker ends. PASS/FAIL per route. A route's legs are `[facing, seconds]`, not metres (2.2 m/s); its start is raycast from 40 m up, so start on a bank, never on a deck under a canopy or roof. Every stair, ramp, door and boarding that should work goes in here, and every edge that should stop you. People have bodies, so a figure standing in a doorway fails a route: move them aside with a `nudge` in people.json; a painted walker crossing the only strip delays you 1–3 s, so end long routes in a wall or give the end a margin. |
| People | `node tools/people_check.mjs <url> [--into figure] [--road "X,D;X,D"]` | Routines over 20 s (stuck walkers, ground, how close walkers pass figures and each other), bodies (the player can't walk into anyone) and routing (you stand on the road at each spot for 12 s: walkers go round you, nobody stands stuck over 6 s; counts who turned back). PASS/FAIL. "sizes" FAILs on any adult drawn under 0.9 of its character's height without a people.json `scale` (people.js sizes a model from its body only, leaving out `prop_*` and `tack_*` meshes: anything else baked into a GLB shrinks the whole cast; skill `characters`, Carried props). Run it on `world.html?...&window=all`: which walker meets you in 12 s depends on how long they have been walking, and a section streamed in just before a spot has walkers only just leaving their painted places. It parks the player with `goto` and holds it there; `--into` is looked up across sections. On a dev server other agents are writing to, the page reloads and kills a long run: give 2–3 `--road` spots per run and rerun a run that dies. Road spots must lie on a painted walker's path (`people.json` `walkers[].path`); `--into` defaults to a gate figure. "Off the ground" is measured against the ground built under each walker (more than a 0.35 m curb for 1.2 s, probed from knee height), so a section's own dips (S1's road at −0.6) pass. |
| Film | `node tools/film_page.mjs <url> <out.jpg> X,D,H,facing,pitch [--frames 12] [--every 0.4] [--set '{...}']` | A strip of frames over time from one spot (you standing there), on the real GPU. For motion: how walkers get round you, how people move. Read it before saying people look right. `node tools/walk_film.mjs <url> <out_base> '<{start\|spot, legs, still, set, hour}>' [--every 4]` films a walk for the user: the walker stepped at 60 Hz as walk_page does (the boats step with it), an mp4 at walking speed (ffmpeg) and a contact strip. |
| Check | `node tools/check_page.mjs <url> <out>` | WSL Chrome with SwiftShader: console errors and screenshots only. **Its frame rate means nothing.** |
| Bench | `tools/win_chrome.sh start`, then `node tools/bench_page.mjs <url> <out> [--configs sections/<name>/bench.json] [--viewport 390x844x3]` | Headless Windows Chrome on the real GPU (RTX 4070 SUPER), uncapped. For each config and named view it records fps, CPU ms (with the animation part), GPU ms (timer query), draw calls, triangles, the drawing buffer, GPU MB (with `?gpumem=1`) and the heap. Writes `bench.md`, `bench.json` and screenshots. CPU throttle, pixel ratio and `wait` (seconds at a view before measuring: a streamed-in window bakes for a while) are per-config options; `--viewport` emulates a device from the first load (narrower than 800: a phone, touch on). The phone proxy: `--viewport 390x844x3`, `"throttle": 4`, `?tier=low&adapt=0`; warm each view unthrottled first, then measure throttled (`gen/perf/batch1/bench_phone.json`), and run before and after interleaved (`gen/perf/batch1/ab_bench.sh`). |
| People precompute | `tools/chrome_slot.sh node tools/people_precompute.mjs [section ...\|all]` (on the check server) | What a section load used to measure on the main thread, measured once: `web/public/assets/clip_meta.json` (each clip's drift and grounding correction, stride, speed and hips height, per model file) and `web/public/assets/<name>/corridors.json` (every walker path's corridor, measured with the default window in, keyed by the section's collider triangle count). The page applies them and measures whatever is missing or stale (`?clipmeta=0`, `?corridors=0`). Run it after `export_web_scene.mjs` and after `character.mjs`; a section without its `corridors.json` logs a 404. |

A run, from `qingming/`:
1. `node tools/map_layout.mjs <S>` (after any map or `build_choices.json` edit). If people.json is generated and
   `build_choices.json` records animal formations, run casting → `map_layout` → casting again: the walk paths read the
   moved animals from `layout.json`.
2. `tools/build_scene.sh <name>` (headless; area agents always build this way), or over MCP in the live GUI (the
   lead's): `import <name>_scene; <name>_scene.build(sc); <name>_scene.export(sc, raw_path)`.
3. `node tools/loyalty_check.mjs <S>`: must PASS.
4. `node tools/export_web_scene.mjs <name>` (and `node tools/backdrop.mjs <name> all` when the panels change). It
   prints the section's scroll index line: its entry count and the projection check's max (under 1 px when the layout
   is current). Then `tools/chrome_slot.sh node tools/people_precompute.mjs <name>` (its corridors and its cast's
   clips).
5. Open `http://127.0.0.1:5180/world.html?sections=<name>` alone, then with its built neighbours. If the dev server is
   down, start it with `npm run dev` in `web/`. Agents use the shared check server instead
   (`tools/check_server.sh start`, 5190, HMR off) and run page tools through `tools/chrome_slot.sh` (skill
   `scroll-section`, "Machine resources"). Press Space at a landmark of the section: the ring sits on the painted spot and the
   boxes on the painted people.
6. `shots_page`, `walk_page`, `people_check` alone (`sections/<name>/shots.json`, `walks.json`) and joined
   (`shots_joined.json`, `walks_joined.json`: across every seam; `people_check` at `?window=all`), then
   `node tools/ktx2.mjs encode` and `check`, then `node tools/budget_check.mjs <name>` (must PASS), then `bench_page`
   (the lead's). Record the numbers in `sections/<name>/notes.md`.

## What a scene must be before it's worth showing

The gate's first pass used the placement test's gray-box sizes with B1 textures, and it read as Minecraft.
Messenger's world (study, 2026-10-10: `reference/messenger_study/world_notes.md`) never shows a plain box:

- **Large faces stay flat, at 2 triangles.** The triangles go into edges and small things.
- **Every edge has thickness.** Roofs are slabs with fascia and overhang. Walls get corner trims, ledges and plinths.
- **Every opening is framed.** Window and door frames are separate inset pieces with sills, mullions and lintels.
- **The ground is never one plane:** curbs, steps, ruts, drains, slopes.
- **Building bases carry the props the scroll paints there,** and only those (loyalty): Messenger dresses every base,
  but our dressing must come from the map.
- **Surfaces are split where lines should be drawn.** The outline pass turns those splits into the ink.
- **Budget: about 38 triangles/m² at full detail.** That is about 130k triangles for a 74 × 46 m section, with
  lower detail levels switched by distance (Messenger: 6 / 12 / 20 m).

For Song architecture that means:
- battered rammed-earth walls with layer lines and a slumped top, where a wall is painted (the gate has none);
- framed openings with beam ends;
- columns on stone bases;
- simplified bracket sets under the eaves;
- balustrades;
- roofs with thickness and an eave sweep;
- plank decks with gaps.

All of it built from builder functions, never from bare boxes.

**Surfaces and edges (the user, 2026-10-10: "all the tiles"; `sections/gate/notes.md`).** Nothing may look
copy-pasted and no edge may be a ruled straight line:
- stone, slabs, steps and boards are separate soft pieces (`soft_slab` and friends); the joints draw the ink;
- small pieces take whole painted faces from an atlas, so the painting traces each piece's edges;
- big surfaces take structure-free or bombed washes (`surface.js`), never a busy swatch repeated;
- material changes on the ground blend along noisy curves, never along grid cells;
- smooth shading with sharp edges only above 35 deg (`gate_scene.build`).

**Colour and light (the user, 2026-10-10: "this is the actual true world").** The scroll is yellow because its silk
aged, not because the town was. Paint swatches in the scroll's style, but show them in true colours (`palette.js`):
grey brick, stone and tiles, white plaster, weathered timber, red-ochre paint, tan earth, green willows, a blue sky.
No warm grade, no paper stains, neutral ink. The light comes from the hour (`daylight.js`): check a scene at dawn,
morning, noon, golden hour and dusk (`sections/gate/shots_daylight.json`), and at night (`shots_clock.json`; with
`?date=2026-10-25` for a full moon), not only at 10:00. Pages follow the viewer's local clock, so many visitors
arrive at night: a night must stay walkable (blue sky fill, ink never lighter than the surface).
The time is never shown as numbers (the user, 2026-10-10: "I really hate how you're just putting up the time
numbers"): show it the way the scroll's people read it, the sundial (`sundial.js`); words and the clock time only on
hover. The bench, shots and film tools pin the hour to 10:00 (`--hour local` to keep the clock), so runs compare.

**Trees (the user, 2026-10-11: "replicate exactly what the painting has, even to the amount of trees").**
- **One card per tree, as painted:** every mapped tree stands on the card of the form the scroll paints there.
  - The forms: spring willow with fans of shoots, old burled pollard willow, pine-like needle fans, crab-claw elm,
    young bare shoot tree, low stem clump, slender trunk (and the pale grove's slender fan-headed pollards), bamboo,
    dotted-leaf evergreen, young sapling, knee-high hedge row, and one old willow with bare hanging whips.
  - The season is early spring: bare or budding, the willows pale green.
  - Never one card for every tree, and never one card twice side by side: trees within 6 m differ in card, and trees
    within 15 m in card or mirroring (`node tools/tree_cards.mjs check`).
  - Willows are painted as half-open fans of stiff rising shoots, never as weeping willows. The one exception is the
    old willow at the scroll's cut end (S7 855, `willow_weep_1`): its whips hang, bare, as painted.
  - Card prompts spell out the stroke, not the shape's name: "a small fan-shaped head of fine rising shoots" drew
    birch-like crowns; "many long, fine, straight, unbranched shoots radiate from a knobbly head like the ribs of a
    half-open folding fan" drew the grove. A grove needs as many cards as it has trees inside the close radius (S1's
    seven pale fan-heads within 4 m); add a cheap narrow card rather than put a slender trunk on a stout one.
- **3D near, card far** (the user, 2026-10-13: the cards alone looked "fake and just made with images"; record
  `gen/details/trees/`, method `method.md`; on by default since the user's sign-off, 2026-10-13; `?trees=cards` for the cards alone). Near you a tree is its wood (Meshy for the gnarled forms, the card's own
  strokes for thin ones) and a crown of painted clumps; the card stays as the far level, cross-faded by a dither.
  - The crown's clumps are placed by the form's way of growing: heads (pollard willows, young shoot trees), tips
    (saplings, slender trunks), along the limbs (elms), through the card's own crown (pines, bamboo, the shrub, the
    hedge), hanging (the weeping willow), from the foot (stem clumps).
  - Spherised normals make the crown shade as one volume.
  - Everything sways in `wind.js`'s one wind, on the GPU.
  - One BatchedMesh draws every 3D tree in the window (one draw a pass); the colour pass draws those within the
    tier's `meshNear` (25 / 45 / 70 m; by the rivers on low: cards).
  - The shadow pass draws every tree at rest into the cached static layer. A card casts only while a tree of it is
    not 3D under the tier.
  - A card whose trees are all 3D within 40 m or more stays at its 256 px copy.
  - Lessons:
    - bare paintings can come back at another scale than their card: fit it on the trunk's width;
    - Meshy invents a lean in depth: remove it;
    - swing many-limbed Meshy limbs in depth about their forks, never a massive bole;
    - a fan's shoots all meet at its root: stagger the roots and fade the knot, or heads read as blots from afar;
    - big flat needle fans read as palm leaves: pines are small tufts through the card's own needle masses;
    - vertex colours are too coarse for big boles: use the Meshy texture (bark atlas);
    - a slot's Chrome keeps other agents' saved settings (shadows off once): pin them in every bench.
- **The page (cards):**
  - one InstancedMesh per card, facing the camera about its trunk;
  - the plane `width_m × height_m`, moved so `base_uv` sits at the tree's map position;
  - scale `clamp(mapped height_m / card height_m, 0.7, 1.4)`, so far trees painted small still stand a real 4–8 m
    behind the roofs;
  - `flip` mirrors x.
- **Colour:** the cards are painted in true colours, so their materials (named by card) take no `palette.js` retint.
- **Alpha:**
  - `alpha: soft` cards are anti-aliased;
  - `alpha: hard` cards (the dense crowns, cut at 0.5 to fit 300 KB) suit alphaTest 0.5;
  - alpha-to-coverage with MSAA, or alphaTest about 0.4, keeps the fine shoots continuous at a distance.
- **Loading:** a card costs 33–160 KB as webp, so only the cards the loaded sections use are loaded, counted by tree.
  Wide cards cost the most GPU (`whip_clump_1` 1.19 MB as UASTC); S1's 34 cards take 16.5 of its 24 MB texture budget. On the GPU the cards were the biggest texture item (85 MB as RGBA with three sections; 21 MB
  as UASTC KTX2), so ship them through `ktx2.mjs`.

**Bench and dev-server hygiene.**
- A page left open in the bench Chrome keeps rendering (uncapped) and halves every later measurement; a crashed
  Playwright script leaves its `world.html` page running, and same-site tabs share one renderer process. Before
  benching, and after any crash: `curl -s http://127.0.0.1:9223/json/list` and close stray scene tabs
  (`/json/close/<id>`). Scripts close their pages in a `finally`. When the bench Chrome is busy with others' pages,
  measure in a private headless Chrome on another port (`budget_check.mjs --cdp <port>`).
- The dev page reloads whenever another agent saves a file in `web/src`: a test that dies with "Execution context was
  destroyed" or a sudden undefined `__test` just reruns. Agents check on the check server (5190, HMR off, no reloads)
  inside a Chrome slot (`tools/chrome_slot.sh`), never on their own dev server or Chrome (11 of them froze the PC).
- **Never `rm -rf` a folder under `web/public/` while a dev server runs:** Vite keeps its public-file list from the
  watcher, so a folder deleted and re-created is served as `index.html` for every file but the first. Tools overwrite
  in place and delete only stale files; never restart the user's server for it.

## Building a new section (what S4, S6 and round 2 taught, 2026-10-12)

`map/BUILDING.md` rule 5 holds throughout: real size, painted place. Records: `sections/<folder>/notes.md` and, for
round 2, `gen/expand/<folder>_lessons.md` and `gen/expand/round2/<folder>_run2_report.md`; the S6 QA spots, walks and
helpers are in `gen/sections/inner_city/qa/`, round 2's route and HUD tools in
`gen/sections/{canal,rainbow_bridge}/qa/run3/tools/`.

Before the first build:
- **Size painted things for real.** Painted props are drawn at the figures' 1.3×, so size them at painted px / 100
  (tables 84 px → 0.84 m, umbrellas 262 px → 2.6 m across). Buildings near the street are painted at about the
  street's scale, so their mapped eaves are roughly real (2.6–4.1 m). Far rows and squeezed storeys keep their
  footprints and get real heights as `choice:`.
- **Test every mapped point against every building footprint** (figures, props, animals, vehicles, trees; a 20-line
  point-in-polygon script). Interior items of open shop fronts are fine. Figures painted behind a roof ridge, or trees
  at the silk's edge inside a wall built to the estimated depth, mean the estimated front or back wall is wrong: move
  the wall (`choice:`), not the painted thing, or move a tree along its painted receding line (a recorded move).
- **Write the builder against fixed kit signatures.** When a kit agent makes the parts, put the exact signatures in
  its brief and build first against a stub of the kit (plain boxes, same signatures): the layout, edges, walks and
  people are checked before the parts exist (S4: a 60-line stub). Better (S7): write the stub yourself as
  `blender/kit_<folder>.py`, every signature and docstring with plain stand-in bodies, and brief the kit agent to
  replace the bodies in place, developing in its scratchpad copy and installing only whole, importable files
  (`python3 -m py_compile` plus a review run), so your headless builds never import a half-edited kit. For a
  factory's parts that haven't landed, probe (`has(module, fn, *kwargs)`) and call the stand-in until they do.
- **A kit body that contradicts the painting** (the kit's sack cart is a barrow with its deck over the wheel, which
  put S6's sacks on a 1.9 m stilt frame where the scroll hangs the load beside the wheel): use another kit body
  (`mule_wagon` with sacks), record it as a `choice:` and tell the kit's owner. Never edit a kit you don't own.
- **Signs come from one atlas per section** (`gen/sections/<name>/make_signs.mjs`), the characters as painted, in
  LXGW WenKai TC Bold (OFL, `gen/sections/inner_city/fonts/`): Ma Shan Zheng (`gen/fonts/`) lacks traditional forms
  the scroll paints (孫 劉 揀 員 楊 應 錦 鋪). Illegible characters (□) are drawn as faded, broken strokes, never guessed.
- **A placeholder footprint must fit what the map names and what is painted round it.** A hip or hip-gable roof needs
  its ridge longer than its depth (`song_kit.hip_roof` puts the ridge's ends at `x0 + d`, `x1 - d`; deeper, the ridge
  folds back: S7's 3.0 × 5.1 m placeholder was built 5.25 × 3.04, a choice). A painted eave at real height says where
  the wall goes (S3's wing: the eave painted on its placeholder lands 3 m further east at a real 3.1 m, so the wall
  stands 1.15 m in from there and bare ground lies under the eave as painted). A hidden depth is checked against the
  painted road behind it (S1's hall at 3.6 m stood 2.3 m into the road: built 3.0).
- **A perched animal sits at its mapped H** whatever is built under it (people.js; a move can't change H): move the
  placeholder wall so its roof meets the bird, not the bird (S7: the hall's east wall 1.7 m west put the slope at
  3.22 m under a crow mapped at 3.2; the builder prints `bird` in `BUILD_STATS`).
- **A building at a seam owns its overhang past the seam** (S7's 解 eave reaches 1 m into S6, as painted): build it
  whole in its own section; the neighbour's things that lean on it are a seam note, never a second model. Check the
  neighbour's as-built geometry at the seam, not its footprint (S4b's south hall runs past the seam as painted).
- **Far rows seen across a river get a lighter composition:** fronts painted at 0.22–0.35 of the street's scale and seen
  from 10–30 m take thin posts, `kit_inner_city.wall_bays`, two `kit_inner_city.lean_to` slopes with fascia and a
  ridge, no rafter ends and no plinth: 0.4–0.8k triangles a front against a full hall's ~3.2k (S3's buildings: 92k →
  69k). The budget goes where the walker passes.

Vehicles and their teams at real size:
- **Real-size carts move their teams.** The kit sizes carts and sedans for real and centres them on the painted
  wheel or cabin, so a cart's front can end 1.9 m from the painted front, and the animals in its shafts and a driver
  on its seat need recorded moves or nudges. The harness follows the moved hooves (`map_layout.mjs` moves them).
- **A painted team doesn't fit where it is painted:** a four-mule team needs about 5.5 m ahead of the wagon's front;
  the painter overlaps the mules within 2.5 m. Set it out along the vehicle's axis by the kit's shaft rule: the shaft
  tip at least 1.0 m past the box front, the rear rank's hind ends at least 0.3 m past the shaft tip. Turn the lead
  rank toward the painted heading only as far as the neighbours allow, then move whatever painted thing still
  clashes, recorded. Give every set-out animal `facing_deg` in people.json and build its harness from the same value.
- **Animals have bodies:** a painted pig herd shut the obvious walk up a side road. Walks route round them.

Building:
- **Budget.** S6's first build was 131k triangles on about 1600 m², double Messenger's 38 per m². A plank deck seen
  only from below costs 3–4k triangles: use a plain slab. A bracket set costs about 300: put them on every other
  column. Read `placed.json`'s owners after the first build and cut the biggest (S6: 131k → 114k).
- **Close every unpainted interior.** The dark back of an open shop front is a colliding board (a walker went through
  a non-colliding one into an empty box), and every door in an unpainted wall gets an invisible board in its opening
  (`kit_inner_city.wall_bays` does it). `walks.json` walks into every front and every door.
- **Seats under seated figures don't collide:** people.js grounds a figure by a ray down from H + 1.2 m, so a colliding
  seat lifts it and the sit clip floats.
- **Raised ground changes D:** things on a bank are mapped at H 0 and so read about 1.5 m of depth per metre of
  height too far north. They agree among themselves: build the bank where they are rather than correct the map.
- **Thin things are single faces.** A double-sided face made as two triangles sharing vertices is dropped by
  `mesh.validate()` and misaligns the bucket's explicit UVs; materials are double-sided on export anyway.
- **Roof winding:** `song_kit._roof_surface` winds a slope by the order of its eave points, so a north-facing slope
  needs its x ends swapped or it renders inside out (`kit_inner_city.lean_to` does it).
- **Mirrored text:** a quad seen from its back mirrors its sign. Build sign faces with the cell's left edge on the
  viewer's left (a, b, b_top, a_top, with the UVs in order).
- **Probe whose geometry is where:** in a headless build, wrap `street_b1.Buckets.add` and
  `song_kit.placed.__exit__` and report the owners of vertices inside a box (`placed` transforms at exit, so a probe
  on `add` alone sees local coordinates). It found a counter poking through the next shop's wall.
- **Write a solids map for the casting script** (S7): a `Buckets` subclass records `(owner, bucket, first face, last
  face)` on `add`; after the build, sample every colliding triangle at about 0.05 m and write the 0.1 m plan cells
  where colliders stand at body height (0.15–1.6 m), per owner, with the seats and any opening a figure stands in
  (`gen/sections/city_end/solids.json`). Footprints miss the low colliders that stand a figure on top of them (a sack,
  a block, a tub). Check an upper floor with people.js's own ray: cast down from H + 1.2 at each mapped thing on it
  and ±0.25 m round it; the first hit must be the floor (十千脚店's balcony: 3.83 for all 7 diners and 5 props).
- **Seats fit the clip and face where the sitter faces:** a bench painted 0.35 m high under a sit clip that seats the
  hips at 0.56 m makes the figure hover (S7 built it 0.55, a choice); a figure sitting along a bench's length puts its
  shins through the seat.
- **Props as data** (S3): a table (`gen/sections/<name>/props_table.json`: id, part, args, why) read by one dispatcher
  (`kit_rainbow_bridge_props.place_props(table, ents, z_at, rng, skip)`); the builder resolves each foot's support
  (`z_at(X, D, ent)`), so a stall stands on a 30° ramp with level tops and legs of different lengths. Carrying props
  record their built top (`TOPS`, `top_h`), so what stands on them sits on the real top, not the painted height (a
  far-bank table painted 0.36 m high, built 0.75). About 190 triangles a prop (S3: 103 props, 19.3k): far furniture's
  legs as 4-sided bars, buns and coils as 5–8-segment lathes, lattice slats as flat faces on the mat, a bowl stack as
  one body with a rim ring per bowl, parasols of 10–20 ribs (`umbrella` costs about 29 a rib).
- **Real-size furniture in a compressed far row gets spreads, not shrinking:** a table, its bench and the man behind it
  map within 0.3 m of depth up the silk; build them real and spread them inside the group in painted order, recorded
  (S3: 33 moves of 0.1–0.8 m). Move the table, never a seat from under its sitter, and test every figure against every
  prop body (a 30-line AABB script): a figure inside a table's hidden collider is lifted onto its top.
- **Roofs and windows first in the budget:** coarse tile grids (`ns` 10, `nt` 4) with rafter ends every 0.5 m only on
  the eaves people see; `song_kit.lattice_window` (~200 triangles) only on painted walls; a scaffold costs mostly its
  lashings (~10 each). `kit_inner_city.cailou`'s `lattice` always adds flowers: an unflowered scaffold needs its own.
- **Check a kit in the scroll's own projection** (S3): shear every vertex onto (u, v)
  (`kit_rainbow_bridge_area.world_to_scan`), render orthographic looking north with the sensor fit set to horizontal
  (Blender fits `ortho_scale` to the longer side, so a tall crop comes out zoomed 1.3×), and put it beside the scan
  crop: a ridge 1.2 m short and a roof 2.6 m too high showed at once, where eye-level renders hid them. A painted
  structure's custom points (`map/strokes/<S>.json`, scan px) can stand at any chosen depth D on their support: X and
  H follow from the frame and project back onto the stroke (十千脚店's 18 scaffold poles). Painted links between
  different depths can't all be level: keep a bar level at its more visible end and record the miss; hang a banner
  painted square to the viewer from its own yard.
- **Signs and small parts** (S7's kit): on a lozenge, map the cell's mid-edges to the diamond's corners and draw the
  character upright in the square cell; build every sign face with its bottom-left vertex on the viewer's left (the
  face's right vector `sd = (-f.y, f.x)`; `kit_inner_city.eave_plaque` starts at `+sd` and reads mirrored). Draw each
  board's cell at its built width / height with the ratio in the atlas JSON (`aspect`, `cell_aspect()`), and tile a
  pattern cell over a big face in a grid of quads (one stretched quad blew S7's motifs up 4.4×). A frame is one mitred
  ring prism (24 triangles for four sides) instead of four beams; a 16-sided hoop round a 21-stave body needs radius /
  cos(π/16). Painted shapes are measured in painted units (the tie over a doorway in door widths), so a doorway built
  taller than painted keeps the painted curve. Review per instance inside `sb.entity("review/<n>")` (the innermost
  entity wins) for `B.tris` per instance.
- **Ground at the seams:** where a river crosses a seam, the 0.5 m past the seam is river bed, not land. A `wet(p)`
  that tests only the water strips (they stop at the seam) builds bank-height ground across the river, 0.6 m over the
  neighbour's water, and boats open bridges onto it: test the point carried back onto the seam line, and probe the
  collider heights along both seams over the water. A ground cut by a slanted seam keeps every cell that reaches past
  the cut and moves its vertices onto the line (`city_end_scene.ground`); cells kept by their centres stair-step. Two
  grounds that both undulate ±5 cm don't stay one under the other: the older one is clipped at the seam once the
  neighbour is built (the join).

Before shipping:
- **Test every final spot** (figures after nudges, trees, animals, vehicles) against building footprints, vehicle
  bands (front to rear, ±0.9 m), animal bodies and ground props. A spot inside a counter or tub stands the figure on
  top of it; a spot in a cart puts a shaft through it. Know which side a counter's depth runs
  (`kit_inner_city.counter()`: to the left of p0 → p1).
- **Read every sign in a shot,** and every vehicle close up.
- **Camera spots inside people or animals make useless shots:** use `{"view": "first"}` and stand clear of the painted
  crowd, or the frozen-player helper for mid-air spots (`gen/sections/inner_city/qa/shots_fly.mjs`). Shot spots inside
  a building or a tree's crown, and walls in the face, are the spots' fault: move them.
- **Every `scene.json` view and spawn stands inside its own section's painted area:** on `?sections=<name>` a spawn
  0.3 m past a seam starts outside the edge wall and falls off (test a slanted seam at the view's own D). Walk 1 s from
  each view alone; a spawn facing a walker's lane leads W into it.
- **Walk into every painted prop nobody sits on** (benches, stands, sacks): kit benches and stands collide only by
  their legs or not at all, and a low sack is a step the walker climbs. Give each a hidden collider box.
- **An independent QA agent** (shots, walks, `people_check`, alone and joined) found what the builder missed in S6;
  recheck every fix the same way.

## Boats and water (the boat kit, the boats page and the river sections, 2026-10-12)

The rules are `map/BUILDING.md`, "Boats and water": real size centred on the painted waterline; boats painted under way
move a short way along their heading and back, moored boats ride; decks are walkable; one cheap flat water per reach;
rafted boats shortened to 0.6 of their type at most, then moved outward (recorded); LOD by distance. The kit's
studies: `gen/boats/types.md`, `gen/boats/water.md`.
- **A boat is one movable root**, `boat:<map id>` at the waterline centre, turned to the heading, extras `kind`,
  `pose`, `motion` (`under_way` or `moored`), `lw`, `loa`, `beam`, `deck_z`, `roof_z`. Children: `body` (every static
  visible part), `deck__col` (the hidden walkable deck, with the stern gallery and a laden boat's cargo mound),
  `roof__col` (cabin and awning blocks with cambered tops; their walls stop you), `rim__col` (1 m walls round the deck in
  2 m pieces: the page drops the pieces where the boat touches a bank, stair, jetty or another walkable boat),
  `board__edge` (the boarding edge), `wet__ring` (a ribbon on the water round the hull), the moving parts `sweep`,
  `oar_*`, `mast` (pivot at their origin), and `line_*`.
- **The web pipeline rewrites node trees.** `gltf-transform optimize` (in `export_web_scene.mjs`) prunes empty leaf
  nodes, so a point exported as an empty is gone: named points ride in their node's extras (`points: {name: [x, y,
  z]}`, that node's glTF frame, y up). Its quantization multiplies the dequantization matrix into the transform of any
  leaf node that holds a mesh: every movable part or re-aimed rope is an **empty that holds the transform and extras,
  with its mesh in a child** (`kit_boats.bake_boat` does it). Check a shipped GLB by rebuilding each line from its end
  points (`gen/boats/glb`: 0.000 m after the fix, hundreds of metres before).
- **Ropes between parts that move apart are unit lines:** `line_<name>` holds a 1 m mesh along its local +Z, extras
  `a` and `b` (point names); each frame: position = a, lookAt(b), scale.z = |b − a|. World-fixed ends (a tracker on the
  bank, a mooring post, the gangplank's foot) are listed in the root's `world_points`: the page keeps their scene
  position while the boat moves.
- **Real size against painted size.** Boats far up the silk are painted small: S4b's biggest rafted boat maps to an
  8.1 m waterline and S3's sweep boat to 7.4 m, both built at 19–20 m; a hull seen stern-on is foreshortened (S2's
  grain boat, 13 m). `boat_from_layout` builds the type's real length centred on the painted midpoint and returns
  `.note` when the map differs by over 30%. Measure hulls against figures painted on them (about 1.3× life), never
  against the frame's metres. Rafted boats at real size overlap their neighbours and the bank: `lw=` choices, then moves.
- **Decks for crew and walkers.** `people.js` drops a figure from H + 1.2 m onto the first collider below, and an empty
  BVH returns y 0: hence the hidden deck and roof blocks on every boat. `boat deck: <id>` (the gunwale's H) lands 0.2–0.4
  m lower on the deck; `boat roof: <id>` on the roof. The water itself never collides.
- **The water level decides what the bank sees:** at water H −1.5 with the eye 1.6 m above the bank, a deep-laden grain
  boat 25 m out shows only its mat mound over the bank edge (`gen/boats/review/grain_laden_lod0_eye.png`). The river's
  H is the frame's `supports.water`, measured once on S4b's moorings (skill `scroll-section`).
- **Plank seams draw only as laps.** The ink pass fires on normal changes, so a seam between coplanar strakes draws
  nothing: each strake's lower edge stands 2.5 cm proud with a 45° chamfer facing down and out, which faces the
  walker's eye and the scroll's view and draws one ink line per seam. Wales and the gunwale cap are swept bars with a
  top, an outer face and a bottom: two lines each.
- **Budgets:** a big boat 6.4–6.8k triangles at `lod=0` (hull and wales about 1.8k, the house 2.4k), 124–143 KB
  shipped; 1.7–2.4k and 58–74 KB at `lod=1`. A small boat 1.3–2.1k / 0.6–1.2k, 42–60 / 30–44 KB. Colliders add 200–250
  triangles, the boarding edge 90, the wet ring 70. S2's 16–20 boats cost 2–2.7 MB at full detail: far boats at `lod=1`
  or switched by distance (beyond 20 m). The cheapest cuts: coarser deck strips (2.4 m), every other post and two of
  three rails at `lod=1`, single-ring coils.
- **Review renders that show the ink:** Freestyle with crease 140°, silhouettes and borders (`kit_boats._review_scene`)
  roughly shows where the page inks. Subdivide big planes (the review water and bank): on two-triangle planes
  Freestyle's visibility test fails and draws hidden hull lines across the bank. `kit_boats._true_colour` applies
  palette.js's retint, so renders show true colours, not the swatches' aged yellow.
- **Line-art textures:** asked for a seamless tile, shyfai drew the water's current lines seamless already, and
  `make_tileable.mjs`'s cross-fade doubles line art into ghost strokes. Check the raw tile's seam before cross-fading
  a drawing.
- **Crews work on open deck, as painted** (the kit's fixes after the page round, `gen/expand/boats_lessons.md`): the page
  stands a sweep crew 0.55 m inboard of `pt_sweep_bar`, spread 0.6 m across the loom, and a rower 0.5 m inboard of an
  oar's grip, so the kit lists what covers the deck (roofs, awnings, hoods, the laden mound, bitts, a mast's feet, deck
  cargo, thwarts, the tiller) and puts crews only in the open stretches between (`_open_spans`). The sweep's pin sits on
  the stern frame at the quarter, its loom running forward and inboard, nearly level, to a crossbar at chest height
  (`SWEEP_AMP` 10°); a big boat with a sweep unships its tiller (the sweep steers); oars go on a big boat's foredeck,
  rowers abreast 0.6 m apart, and amidships between a small boat's thwarts; a deck too short for the oars asked for
  says so in the manifest's `.note`. Check crew spots headlessly before the page: a ray down to `deck__col` and five
  rays up through a 0.18 m column from 0.3 to 1.8 m, at both ends of the stroke (it found a tiller through a rower's
  hand). A boat under way carries a `bow_wave` node (34 triangles); `board__edge`'s vertices are the gunwale top.
- `scroll_map.mjs world` converts `beam_n`/`beam_s` and `bow_top`/`stern_top` but not `mast`/`mast_top` yet;
  `boat_from_layout` uses those when they come through.

The page side and the river sections (`gen/expand/boats_page_lessons.md`; S4b, S3 and S2 in
`gen/expand/<folder>_lessons.md`; the rows Water and Boats (page) above):
- **The schema.** The builder only lays the water. Each boat's kit options go in `build_choices.json`
  `boats.<map id>.kit`, with a `why`: `kind` (never trust the slug: `kind_of` read S4b's `small_cabin` as passenger),
  `lw` (never below 0.6 of the type), `beam`, `free`, `hold`, `cabin` (dict or false), `awnings`, `mast` with
  `mast_angle`/`mast_h`/`mast_at`, `tow_to`, `sweep` ('port' | 'starboard'), `oars` (per side), `gangplank`, `moor`,
  `cargo`, `stern_house`, `bow_canopy`. Names resolve from the layout: a figure (slug or map ID) → its foot at H + 1.25
  (a tracker's shoulder); a prop or structure → its position at H + 0.8 (a post's head), or at its own H for
  `gangplank`. Moves outward are ordinary `moves`. Crew are ordinary figures; people.json `boats.<slug>` only for a
  boat under way: `run_m`, `speed_mps`, `pause_s` [at its spot, at the far end], `mast_cycle_s`, `crew` {slug: {work:
  sweep | oar, at}}, `haul` {slug: {walk, stand}} (trackers walking with its travel), `tow` (the figure the line ends
  at).
- **Plan the moorings in 2D first, with the kit's own hull outlines** (`gen/sections/outer_road_2/boats/boat_plan.py`,
  `solve.py`: gunwale outlines with the stern gallery, the bow platform and the sweep's swing, against both sections'
  shores and the neighbours' hulls; seconds, no Blender). A crowded reach solves numerically: signed penetration
  against hulls, shores, abutments and the seam, then a coordinate search with a weak pull to each painted place (S3's
  11 boats in minutes). S4b at the kit's defaults: 10 overlapping pairs; after the plan none, gaps 0.10–0.39 m.
- **Shortening fixes boats end to end, not side by side:** a raft's width is the sum of its beams, and the painter draws
  moorings at the far-row scale (S4b's cove 13–15 m wide in the frame for a raft needing 20 m). Three levers, in order,
  each recorded: shorten (0.6 of the type at least), narrow the beam to a real proportion for the shortened hull
  (Song inland boats 3.5–4:1), then move the far bank. Never shrink a hull's heights.
- **A far bank moves as a builder choice:** `map_layout.mjs` moves `pos`, `pts`, `footprint` and `bays`, never `lines`,
  so the water's `shore_n` and a bank's `bank_top` don't follow `moves`. Record `how` on the water and the bank, apply
  it in the builder before `water_strip` (lines moved along the receding direction, dX = −dx/77 per m of dD, so the end
  stays on the seam), and record `moves` for everything on that bank. Move it with a step between buildings, not a
  taper (under a taper the shore shears beneath rigid buildings: S3's hall had a corner 1.9 m in the water), and pull
  the shore 0.3 m out from the moved bank tops so the trees and tables at the edge stay on land.
- **Boats against banks:** move a bow-in boat out until its bow's *top* clears the bank, not its stem (the raked bow
  reaches `oh_b`, 1.5 m on the big types, past the waterline stem; a passenger boat's platform 1.1 m more). Set `free`
  from the deck support the frame measured (the painted `bow_top`/`stern_top` are far-row estimates; a passed `free`
  also cancels a laden boat's low freeboard): the contact probe takes a bank from 1.2 m below to 0.7 m above the deck,
  and a bridge steeper than the walker's 34° can't be climbed (cargo boats with decks 1.0–1.2 m over the bank: 28–40°).
  Rafted decks within about 0.35 m of each other, or a bridge lands on a neighbour's roof block, one way only. A
  contact under a mat canopy (1.8–2.0 m over the deck at its edge) leads only to the rim; round-2 awnings and hoods
  collide as solid blocks, so nobody walks under them.
- **A gangplank** needs its foot at the bank's edge (within about 0.3 m, at the bank's height: inland, the straight plank
  runs under the bank top), a gap (moor the boat about its bow overhang plus 1 m off), its foot on the side with open
  water, and its painted porter off its foot line. Recheck planks after moves (S2's crossed a moved neighbour's hull).
- **Crew follow their boat:** record the same `moves` for every `boat deck:`/`boat roof:` figure as for its boat. A
  boat built 2–5 times its painted length keeps its crew at their painted metres, bunched amidships under a roof, so
  carry each crew figure's painted place along and across the waterline onto the built hull with a `nudge` (sweep and
  oar crews stand at their bars). A crew house aft hides a figure painted sitting at the stern: `cabin: false`.
  Trackers move with their towed boat. The casting script's clearance doesn't see hulls: cap a bank walker's path
  short of a bow (one climbed its bridges).
- **Arches, seams and boats under way.** Check the built geometry against an arch's soffit, the facing timber (0.46 m)
  counted at both faces: the passenger type's curled stem (free + 2.3 m) crosses a 3.7 m arch nowhere, so a big boat
  waits outside the near face, and one painted under it is built low (the small type's awning, 1.7–1.9 m; a roof about
  1 m over the water with a `boat roof:` figure needs it, where the grain type's awnings rise 3–3.8 m). Cut the run of
  a boat heading toward a neighbour's sterns (`run_m` 1). A boat under way that touches a bank closes its bridge and
  shore gate whenever its pause ends, and a walker who arrived meanwhile wades in under the reopened bridge (the bank
  slopes inside the contact before the wall; not fixed in `boats.js`): when its painted motion isn't travel, keep it
  at its spot (S3's mast-lowering boat: `pause_s` [3600, 3]; `mast_cycle_s` runs on its own clock). `boats.js` probes
  contacts once, at its own section's load, and opens only its own section's shore walls: a hull past a seam can't open
  the neighbour's bank, so carry your edge wall along the run-on shore and let its rails keep walkers dry. Edge walls
  stand only on land; across water the shore walls and the rails close the walk.
- **Walk every boarding** in `walks.json` (from the bank or stair onto each boat that touches it, across each rafted
  pair, against a rail, up and down each gangplank, back ashore) and ride: standing 10 s on a deck drifts 0.03–1.4 cm
  in the boat's frame. `player.js` has ground friction while standing still (nobody creeps down a slope or a rocking
  deck; `player.friction = false` for A/B). A contact's bridge is one flat quad, so the walker's legs pass through the
  bulwark for one step (not cheap to fix: a two-part bridge at each boat's gunwale height).
- **Page pitfalls** (for whoever edits `boats.js`): Blender's glTF export flips V, so a UV set that carries data arrives
  inverted (`water_mesh` writes 1 − v); GLTFLoader sanitizes node names (`boat:S4b.veh.x` → `boatS4bvehx`: find nodes
  by `parser.associations`); read a node's world matrix before removing it from its parent; MeshBVH reorders the index
  (keep per-triangle data by the original triangle), and a moving BVH hands the walker an `ExtendedTriangle`; three
  re-uploads a shared material's uniforms only when the material changes (the wet ring's ripples are the water's own
  world-space lines, no per-boat uniform); batched meshes need `batchingMatrix` in custom shaders; boats step inside
  `player.update`, so walk_page's synchronous stepping moves them in lockstep; a 0.56 m plank between rails jams the
  0.6 m capsule (the walkable plank is 0.84 m).
- **Costs:** one draw call per material per pass for all of a section's boats; their triangles are the budget item
  (S2: 16 boats, 61.6k at lod 0 and 24.2k at lod 1, 1.92 MB; S3: 11, 35.7k / 15.2k, 1.26 MB; S4b: 6, 25.1k / 9.8k,
  0.84 MB). Seven boats on the test page: +0.31–0.39 ms of GPU and of CPU a frame, 1,510 collider triangles.

## Set pieces (the Rainbow Bridge, 2026-10-12)

A set piece is one mapped entity big enough to need its own kit module (`blender/kit_<piece>.py`), built before its
section's map lands and fitted to it once it does. The bridge's record, with the walk-test recipe:
`gen/set_pieces/rainbow_bridge/study.md`; the headless walk test itself is `tools/walk_bridge.mjs` (`web/src/player.js`
driven in Node against the build's colliders, no browser).
- **Split the kit into a fit and a build.** The fit is plain Python (no bpy): mapped entity + `map/frames/<S>.json` →
  one plan in world metres. The build lays the pieces along that plan inside `sb.entity(<map id>)`. The fit then also
  runs as a CLI (`python3 blender/kit_rainbow_bridge.py table <layout.json> <frame.json>`), so the frame agent and the
  lead read the deck's heights without Blender.
- **Write the fit against a stub before the map exists, then against the first real part.** The stub (your own
  reading of the scan, in `layout.json` form) found the shape of the code; the bridge agent's part found what the stub
  hid: its hidden far edge and centre line sit at the same depth as the painted edge, so "near edge = lower D" failed.
  Classify edges by their side of the foot-to-foot axis, and anchor the build on the measured (painted) edge, not on
  footprint midpoints that include estimated corners.
- **A painted arch is not a walkable deck.** The 虹桥 is painted 5.4 m high over about 13.5 m of depth (45–70° at the
  feet). Keep the painted crown and feet as places, give the deck one smooth family (level at the crown and at the
  landings), and extend the ramps along their ends until it is within the walk limit (34°: the gate's flight). Steps
  (level treads) where it is steeper than 17°; the collider stays one smooth hidden surface. Record every extension.
- **Choose a deck shape under constraints; don't patch it pointwise.** Raising a fitted profile wherever the structure
  poked through left kinks at every node (and a 32° spike that drove an 8 m ramp extension). Search the family for the
  shape closest to the mapped heights that clears the structure everywhere and stays walkable. When a pointwise
  envelope is unavoidable, a morphological close (max over ±w, then mean over ±w) is smooth and never below the
  original.
- **Model the structure the way it carries load,** then match the painting's look on top. The woven arch: system A (3
  beams, a level middle beam) and system B (4 beams) one beam-and-cross-beam depth below it, B's cross beams carrying
  A's beams. Lifting each system's nodes over the other's in turn cascaded upward and made the arch 2.4 m deep. The
  scroll draws the arch's face as one smooth band, so a curved facing timber covers each outer face and the weave
  shows from below.
- **The map keeps the painted heights; the build reports its own.** `Bridge.h_profile()` and `table()` are the built
  deck, and `check_profile` and `on_deck(u, v)` check mapped figures against it. An `H_profile_X` from the table did
  not fit the painted deck (rms 2.9 m): S3's frame keys the deck by u in offset bands (skill `scroll-section`, "Heights
  point by point"), and the gap to the build (rms 1.76 m, 30 of 88 things off the built deck) is the fit's job
  (below).
- **Walk the collider headless with the page's own walker.** `web/src/player.js` runs in Node: stub
  `addEventListener` and `matchMedia`, give it the build's `__col` triangles as one BufferGeometry, hold W at 60 Hz.
  Foot to foot both ways, into both railings, at the ramp's side from the ground; no browser, no dev server. It caught
  the walker 6–15 cm off the deck's table height and the railings at ±3.7 m. Steer by the deck's centre line extended
  past the feet, or the walker circles at the end. It also showed that `player.js` has no ground friction: a walker
  standing still creeps downhill on any slope (0.1 m/s at 10°, 0.23 m/s at 33°), queued for the lead.
- **Budget the hidden parts first.** The abutments, hidden in the painting, cost 9.8k of the first 25.5k triangles;
  coursed stone with eased tops only on the top course, longer blocks and nothing below the water took them to 4.5k.
  The railings (5.3k), which every walker sees, kept theirs.
- **Look at the sheet at full-scroll scale before calling the kit done:** beside the painted bridge, polygonal outer
  ribs read wrong at once; at render scale they had looked fine.
- `clearance()`: the built soffit stands 2.86 m over the water across the middle 40%, so S3's big boat waits outside
  the near face ("Boats and water").

Fitting the painted crowd onto the built deck (S3 Run 2; `gen/expand/rainbow_bridge_lessons.md`):
- **Fit by height, not by place.** people.js grounds a figure by a ray from its layout H + 1.2, and a recorded move
  never changes H, so the deck under a moved point must be at most H + 1.0 (keep it within ±0.5). Rules that worked
  (`deck_fit.json`): STAY where the point is on the deck at its height; INWARD straight across where only the railing
  is in the way; ALONG to the nearest station in the height window for the railing crowd (its painted order holds with
  the stays), or to the same fraction of the crown's height on the painted flank, at its painted share of the deck's
  width. Riders, a sedan's bearers and an animal's hooves move as one.
- **Pack a deck crowd constructively, then open the lane.** A pairwise-push solver jammed against the fixed stays; a
  greedy packer converged in seconds with no overlaps (stays, then animals and vehicles, props with bodies, then people
  in painted order, each at the free spot nearest its target inside its height window and the railings). Then find the
  cheapest foot-to-foot path through the clearance field and keep bodies off it only where it is narrower than the
  player. A painted animal whose map point overlaps painted people is not a stay: it moves with its party.
- **The kit's near railing is not the painted near edge:** the arch's axis comes from the mapped rib line, and the built
  railing lies 1.1–1.5 m inside `deck_e`, so every leaner mapped at the railing stood outside it (leaners: skill
  `characters`).
- **A ramp extended for the walk limit lands on the painted bank:** move what it covers to the side it is painted on;
  narrow a building it lands on to the part it leaves (real heights, painted front and depth, its painted end kept,
  opened on all sides where the route passes through, its furniture moved inside, a `how`); give `edge:north` a detour
  round the foot 1 m past the collider's run-out (overlapping the far railing's wall), and lay ground under it.
- **Props on a skewed deck take the built axis,** not the map's corners (a stall's corners map as a 5.4 × 0.6 m
  sliver): a real rectangle centred on the fitted point, tables and benches across the deck so they stand level,
  awnings low at the downhill edge (`yaw: "deck"` in the props table).

## Backdrop panels: keying, picking, the horizon (2026-10-12)

- **The keyer is an edge matte,** as the tree cards' (`trees/notes.md`, Keying). Away from the paper the old rule
  holds (alpha from the blurred distance to the paper, colour unmixed toward it at 0.14). Where clear paper shows
  close by (a soft weight z over the share of paper pixels within about 2 px): a pixel at least 0.35 from the paper is
  solid; any other takes the colour of the confident ink near it (a fine twig's own branch, within 1.2, 3.5 or 10 px)
  and its alpha from where it lies on the line paper → that colour; a pale stroke off that line or with no ink near is
  a wash, unmixed toward 0.3. z blends the two, so a speck of paper inside a crown or a wall leaves no hole. In the
  ground strip a paper pixel among things goes (it had keyed to opaque halos round far figures). Near-white share of
  visible pixels: gate north 37.1 → 7.9%, gate east 15.1 → 5.6%, outer road east 10.3 → 2.4%: bare crowns no longer
  frost or glow at night. `ship` prints `near-white`; read it and the sheet's dark row.
- **Don't try again:** a hard zone (every pixel within 2 px of paper), or the open-crown wash without "no ink near",
  punched square holes in a willow's wash; blurring the paper field didn't help; keying at the painting's full width
  left more fringe (keying stays at 2048 px).
- **A painting that reaches the bottom edge keys whole** (the foot fade used to run backwards and zero the panel). A
  trim to a sliver (`raw rows 535-730 of 731`) means the keying failed: read that log line before the picture.
- **Picking.** Use `candidates: 2` and measure every candidate, not only the pick: set `pick` to each in turn and run
  `ship --review --only <side>`; the log's `ground strip` and raw rows sort them before any picture is read. `gen
  --force` overwrites `<side>_0..n-1.png`: copy earlier draws to `gen/sections/<name>/backdrop/draw<k>_<date>/` first and
  put the ones to keep back as `<side>_2.png`, `_3.png` (the sheet shows every `<side>_<i>.png`, `pick` can name any,
  the cache key ignores `pick`); delete them before a fresh `gen`. Write every pick and rejection, with its reason, in
  `picked`.
- **"Willow" paints a weeping willow,** every time. Say what the scroll's willows are and are not: "The old willows are
  pollard willows before their leaves open: from each knobbly head a half-open fan of long, straight, stiff shoots
  springs upward and outward. They are NOT weeping willows: no hanging curtains, no drooping strands, no foliage."
  (`prompts/backdrop_gate_east.txt`; both draws since came out right.)
- **The horizon.** Open ground comes out at eye level (gate north: ground strip 0.014 of the width). A street doesn't:
  looking down a road the model paints a deep wedge (0.055–0.106 over ten candidates). The page lifts a panel whose
  ground strip is deeper than about 4.2 m (eye 1.6 + sink 2.5; about 0.036 of the width on outer road east's 117 m
  arc, 0.043 on a 70 m circle), so street panels stand 2.6–7.8° over the eye (outer road east 4.1°). Tried: capping
  the strip in the tool (panel field `ground`) cut the street's carts and crowd off with it, rejected, the field stays
  unset; a prompt line saying everything stands some seventy paces away
  (`gen/sections/outer_road/backdrop/horizon_trial/line.txt`) gave strips of 0.043–0.057 and a horizon 0.4° over the
  eye, but neither candidate was loyal enough to ship. Adding that line to `backdrop_panel.txt` is the user's call
  (prompts are theirs); the next untried step is a layout guide (a third reference: white, one grey line a quarter
  up). Never crop.
- **Round 2's panels** (S3's backdrop agent, `gen/expand/rainbow_bridge_lessons.md`):
  - Looking along the scroll, a side panel's strip is depth: its length sets how far down the street or river the view
    reaches. End it where a painted thing closes the view or a painted link ends, judged from the neighbour's
    `layout.json` by each thing's angle and distance from the section's centre (the ring is 70 m): S3 east ends at
    u 24300, where the trackers' tow line meets its boat's masthead.
  - The "seventy paces" sentence works in a street's content prompt (S3 west: ground strips 0.033–0.059; the pick at
    0.033 is the first street panel the page doesn't lift), not a river's (0.063–0.109: the model paints the river as
    a channel open to the image's bottom edge, and runs it to the horizon as a straight canal in 4 of 4 candidates
    whatever the prompt says; boats along it don't close it). Record that as a departure; don't spend a third draw.
  - Say what each side of the strip has and what it doesn't ("on the left of the road ... no shop fronts and nobody
    sitting: only the plain plastered back walls ... of a row of large halls"). Things on the strip's top band at its
    far end swap near and far, and counts don't hold ("exactly five trackers" gave 7–15): read the sheet front to back
    against the strip. Prefer omissions to inventions when picking. The pollard sentence held in 6 of 8 candidates;
    `backdrop_panel.txt`'s "pale fresh-green willows" may push green tips (the user's call).
- Eye-level paintings key to 280–340 KB (webp q86). One shyfai image is one unit of its billing counter (`GET
  https://agent3.shyfai.cn/v1/dashboard/billing/usage?start_date=…&end_date=…`, `total_usage`); a spent balance answers
  403 INSUFFICIENT_BALANCE.

## The scroll HUD (2026-10-12; `gen/expand/hud_lessons.md`)

- **How it is exact.** Each section's frames are in its `assets/scroll/sections.json` entry, so
  `scroll_projection.js` maps ground metres (X east, D north, H up: the page's x, −z, y) to scan pixels with the map's
  own formula. `dx` drifts along u, so u is solved exactly, piece by piece over the knots; a fixed-point iteration (what
  `scroll_map.mjs toScan` does) diverges where the drift is steep (S5, u 7800–8250). A point belongs to the section
  whose painted range its projection falls in. Residuals over every mapped point of S4–S6: median 0.25 px, max 0.69
  (the world files' 0.01 m rounding). Pure JS: Node tools import it too.
- **Your height is the map's, not the build's.** Builders raise ground the map takes as level (`outer_road_scene.py`
  `FORECOURT = 0.6` put the ring 38 px north). The HUD takes the walker's floor height minus the offset the still
  painted figures within 8 m on the same level show between their built floor and their map H (median of the nearest
  five), then snaps to the nearest support height the frame lists within 0.25 m. Anything projected onto the painting
  uses the map's H.
- **Choices:** 15 m radius, boxes fading from 5 to 15 m (at 18 m the inner city boxed up to 152 people and the painting
  disappeared); a walker counts by the nearer of where he is and his painted spot, so one who wandered keeps his box; a
  child carried by someone (`carried_by`) is boxed with the carrier; every opening starts on you at a readable zoom
  (painted people 60–110 px tall); the HUD takes Space in the capture phase (ignoring text fields), and H and Esc only
  while open; opening releases the pointer lock, closing with Space retakes it.
- **A new section needs nothing extra:** the export writes its index; people carry their map slugs. Check it with HUD
  shots at its landmarks (`__test.goto(X, D)`, then `__test.hud.show()`), compared by an independent QA agent with its
  own scan crops: ring on the painted spot, boxes on the painted figures. Big animals and lying figures are where boxes
  went wrong (the rump by species is fitted on nine measured animals).
- **Boats and moved ground:** a boat painted under way shows a dot where it is now and a line back to its painted spot,
  no box. The ring follows the frame alone, so where a builder widened a bank the frame doesn't know (S2: up to 3.2 m
  south) it lands that far into the painted river; the figures' boxes stay right.
- **Pitfalls:** a bare canvas is 300 × 150 until drawn (in a flex column it squeezed the painting on the first
  opening): give canvases a CSS height from the start and the main panel `flex-shrink: 0`. In a crowd the smallest box
  under the pointer is usually a neighbour's: pick the box whose centre is nearest for its size. Wheel and touch events
  over an overlay must stop there (the page's wheel changed the camera distance behind it).

## Reach: device tiers, MRT ink, shadows, bakes, loading (the perf batch, 2026-10-13; `gen/perf/batch1/notes.md`)

The aim moved from this machine to everyone's (the user, 2026-10-12): phones, integrated graphics, older desktops,
keeping the look. The RTX 4070 SUPER is only the measuring instrument: CPU throttled 4×, a phone viewport
(390 × 844 at DPR 3), the low tier. The study behind it: `gen/perf/proposal.md`.
- **Tiers** (`web/src/tiers.js`): low (older phones, mid Android), mid (recent phones, laptops with integrated graphics),
  high (a desktop or a discrete GPU). Every tier draws every mapped thing; a tier changes how: the pixel-ratio cap and
  the adaptive scale's floor (1.0 / 0.6, 1.5 / 0.7, 2.0 / 0.8), the anti-aliasing and colour target, the shadow box and
  how often it is redrawn, how far people cast shadows, the waves cap of `?boatflow=waves`. Anything new that costs by
  device reads its setting from `tiers.cfg`, never its own touch or memory guess.
  - **Detail systems** (3D trees, ambient life, chatter; batch 2) tune only through the tier: numbers in
    `TIERS[t].detail.<system>`, registered with `web/src/detail.js` (`register(name, { applyTier(cfg), stats() })`,
    `applyTier` re-scales live from `cfg.detail[name]` times `cfg.detailScale`; `__test.details()`). Held at the
    render-scale floor and still under 30 fps for 8 s, an automatic tier first lowers `detailScale` 1 → 0.75 → 0.5,
    then steps down.
  - **The river's boats by device** (settings key `boats`: auto | moored | painted | waves; `world.js`
    `boatMode`/`boatCap`): auto gives low the painted boats sailing (`flowCap` 0), mid and high waves of copies (3, 6).
    `?boatflow=` and `?boatflowcap=` win. `map/BUILDING.md` "The river's flow, by device".
  - **Saved settings are versioned** (`s.v` in `world.js`): the page saves every key whenever one changes, so a new
    default reaches returning visitors only through a version step that puts it over the saved copy once.
  - Picked by a guess before loading (touch, `deviceMemory`, cores, iPhone, the GPU's name from
    `WEBGL_debug_renderer_info`), then a check of the first 3 s of real frames (median frame against the tick: slow and
    CPU-bound, one tier down; slow and GPU-bound, the scale to its floor), then Messenger's controller while playing
    (every 4 s: under 30 fps and GPU-bound −0.1, 55 or more +0.1; paused while a section streams in; stops after 4
    reversals; held at its floor and still slow for 8 s, an automatic tier steps down once). The automatic choice is
    remembered with the GPU's name (`localStorage` `qingming-tier-v1`); `?tier=` is never stored, so a test can't
    leave a slot's Chrome on another tier. By hand: settings key `quality` (auto | low | mid | high), "Quality" in the
    lil-gui panel; the settings screen can offer it through `setSetting('quality', ...)`. The pixel ratio is
    min(device, tier cap, the settings' sharpness `pixelRatioCap`) × scale.
  - **Benches and look checks pin the tier and the scale** (`?tier=high&adapt=0`): the controller otherwise trades
    pixels under a throttled CPU and the numbers stop comparing.
- **MRT ink** (`post.js`): every built-in mesh material writes its view normal into a second attachment while it draws
  its colour (a patch of `ShaderChunk.dithering_pars_fragment` / `dithering_fragment`, which every Basic, Lambert,
  Toon, Phong and Standard fragment shader ends with); lit materials write `normal`, unlit ones and materials with the
  define `QM_INK_NEUTRAL` (tree cards, the boats' wet rings) the empty normal the target is cleared to (alpha 0, so a
  transparent one leaves the normal under it). **A ShaderMaterial drawn in the scene must declare and write
  `qmNormalOut` itself** (`post.js` `NORMAL_OUT`; both skies in `daylight.js` do): a draw buffer a shader doesn't write
  is undefined. The target is cleared to the background colour by hand (three's background clear would fill both
  attachments) and attachment 1 with `clearBufferfv`. The second geometry pass and the crowd's normal draws are gone.
  High keeps 4× MSAA on a half-float target (now two attachments); low and mid draw without MSAA into an 8-bit sRGB
  target (`SRGB8_ALPHA8`: linear values on the sRGB curve, so the darks keep their precision) and run FXAA inside the
  ink pass (luma on a gamma-like curve; flat painted strokes are left alone). `?mrt=0` keeps the old pipeline for A/B.
  - One look difference, a fix: the old normal pass left tree cards out, so creases of whatever stood behind a crown
    inked through it; now a card writes the empty normal and its trunk is clean. Otherwise high matches the old
    pipeline to 0.14–0.58 of 255 a channel at six views (the same shot twice: 0.00), and mid and low are the same
    picture, softer (1.2–4.3).
- **Shadows** (`world.js` `placeSun`, `shadowPolicy`; `crowd.js`): high keeps the 96 m box round you, redrawn every
  frame. Mid: ±36 m pushed 12 m ahead of where you look, its centre snapped to 1 m; low: ±32 m, snapped to 2 m,
  1024². The map is redrawn only when the snapped centre or the sun moves, a section comes or goes, shadows are
  switched on, or the people's turn comes (20 Hz on mid, 15 on low; boats move at the same rate); between redraws the
  map keeps the matrix it was drawn with, so nothing slides. People past 30 m (mid) or 15 m (low) cast none: the
  crowd's instances are ordered near first and its `onBeforeShadow` draws only those. Batch 2 split the map into two
  layers (below, "Frame rate: what batch 2 learned").
- **Bakes** (`crowd.js` `BakeSet`): half floats, two texels a bone a frame (a quaternion; the translation and one
  scale), 16 bytes where it was 48. Every bone matrix of the cast is a rotation times a uniform scale (to 1e-4) with
  translations under 2.2 m, so half floats keep vertices within about 2 mm; a model with an unevenly scaled bone warns
  once in the console (`gen/perf/batch1/tools/bake_probe.mjs` checks a cast). The texture is laid out for every row
  asked for (baked and queued); a finished clip is copied into its rows and uploaded alone (`texture.addUpdateRange`,
  one texSubImage2D a row: an update range must never be added before the texture's first upload, or only those rows
  reach the GPU; `onUpdate` marks it uploaded). `Crowd.prune` lays a set out again without the clips nobody left may
  play. Routines ask for all their clips while their section loads (`CrowdPerson.expect`), queued behind the clip each
  person starts with; a clip someone on screen starts goes to the queue's front and is baked before the next frame,
  alone (before, an urgent set baked its whole queue in one frame: up to 322 ms).
- **Loading** (`world.js`, `tools/people_precompute.mjs`, `web/vercel.json`):
  - You walk once your section's ground, its kit and your character are in; its cast and trees are the first
    streaming operation after the loading screen (`stream.pending`), before any neighbour. The test hooks still wait
    for the window and your section's people (`settle()` always), so the tools see a settled world.
  - A section's tree cards load side by side, not one after another.
  - Each clip's grounding and stride, and each walker's corridor, come from `people_precompute.mjs` (the table above).
  - **Characters load as a body plus the clips a section plays** (per-clip files: `tools/clip_split.mjs`, manifest
    `assets/chars/clips.json`).
    - The body (`assets/chars/body/<name>.<hash>.glb`) holds the meshes, skin, props, textures and idle. Each other
      clip is its own file (`assets/chars/clips/<name>/<clip>.<hash>.glb`).
    - `world.js` fetches the clips a section's people.json names (`web/src/cast_clips.js` `castClips`) with that
      section's cast, before `populate`, so nobody starts a clip that isn't there. Walkers read their walk's stride
      when they are added.
    - A clip started anyway (`settlePending`) plays idle until it lands. Someone not drawn yet stays hidden until then.
      Each case is counted in `__test.stream.stats().lateClips`, which should stay empty.
    - The full GLB (`chars/<name>.glb`, every clip) stays the source for every tool and review page, and
      `clip_meta.json` stays keyed by it.
    - The page uses a split only while it covers every clip characters.json lists and its `src` equals the build's
      hash of the full GLB. Otherwise it loads the full GLB: a stale split costs bytes, never a clip.
    - `?clipfiles=0` loads the full GLBs, as `people_precompute.mjs` does.
    - The download per section with kit and cast dropped by about a quarter (rainbow_bridge 27.9 -> 21.8 MB). The first
      window comes in 4 s sooner on fast 4G (24 s on slow 4G).
  - A file an exporter names by its own content hash (`<name>.<8 hex sha256>.<ext>`, as `assets/tex/` and
    `clip_split.mjs` do) stays out of the page's inline map, and the CDN serves it immutable. Do that only when the
    exporter's own manifest lists the names and the exporter deletes the old ones. Hundreds of plain names would have
    grown world.html's map by 4.7 KB brotli (13.3 -> 18.0 KB).
  - Everything the pages fetch from `public/` has a content-hashed name in the build, cached a year, immutable, so a
    second visit asks the network only for the page itself. `web/vite_asset_hashes.js` (a Vite plugin, build only)
    gives each un-hashed GLB, JSON, KTX2, WebP, WebM, SVG and CSS under `assets/` (and `basis/`) a second name,
    `<name>.<8 hex sha256>.<ext>`: a hard link, with the plain name kept. Each built page carries the map inline and
    wraps `fetch`, which covers three's FileLoader and ImageBitmapLoader and the pages' own `fetch()` calls. A hashed
    name that 404s (a page loaded before a redeploy) is fetched again under its plain name. The pages' own `src`/`href`
    attributes are rewritten at build time. The dev and check servers have no map and use the plain names. So an
    exporter leaves names plain (the build hashes whatever is in `public/` when it runs), unless it keeps its own
    manifest of content-hashed names and deletes the old files (`assets/tex/`, `clip_split.mjs`; below). Code that
    needs the URL a built page will really fetch uses `window.__qmAsset(url)`. Don't map three's loaders with a
    LoadingManager URL modifier: it bypasses the wrapper's 404 fallback. `web/vercel.json`'s routes carry the header
    for `assets/*-<hash>.js|css|wasm` and for every `.<8 hex>.<ext>` name; `tools/deploy_web.sh` copies them into
    `config.json` and checks a hashed GLB's header live. What still revalidates: images three loads through an `<img>`
    (Safari's TextureLoader) and fonts.css's fonts.
  - Tree cards come first at 256 px (`tools/tree_cards.mjs small`, also run after every ship:
    `assets/trees/small/<card>.webp`, `trees.json` `small`). They are swapped for the full card when the stream has
    nothing else to load, nearest first, three at a time (`world.js` `sharpenCards`). At the first window the trees
    cost 0.77 MB instead of 7.4 MB, and the window was in 6 s sooner on fast 4G. `settle()` waits for the swaps, so
    the tools see full cards; the page's own first `settle(false)` doesn't. `?smallcards=0` turns it off;
    `?smallcards=only` shows what a slow link sees first.
- **Boats' batches** (`boats.js`, `world.js`): `perObjectFrustumCulled` and `sortObjects` off on every boat
  `BatchedMesh` (three redid each batch's per-instance cull and sort, and re-uploaded its indirect texture, in every
  pass: a third of the frame at the Rainbow Bridge); the batches keep their own copies of the kit materials (a batched
  and a plain mesh need different programs, and one material shared by both re-resolved its program at every switch).
  Batch 2 joined them across sections: one batch per material (below).
- **Checking a change for every device** (`gen/perf/batch1/`): other agents edit `web/` all the time, so build the
  step into the scratchpad (`vite build --outDir`) and serve the build statically (with `web/vercel.json`'s headers)
  for the regression (`regress.sh` with `WORLD_URL` and `BOATS_URL` carrying `?tier=`, at all three tiers), the look
  (`look_tiers.sh`: one page load, time frozen, the old pipeline beside high, mid and low) and the numbers. Freeze
  everything that moves for a pixel comparison: routines, boats (the walker steps them: `player.update` too), your own
  character's idle, and `performance.now` (the water lines and the sky's strokes read it).
  - `performance.getEntriesByType('resource')` stops at 250 entries by default, and a world load makes more than
    that. A probe that counts requests or bytes past the first window must call
    `performance.setResourceTimingBufferSize(...)` in an init script (`gen/perf/batch2/loading/load_detail.mjs` does).
  - A Chrome slot's profile keeps its HTTP cache between runs. Immutable hashed files cached by an earlier check are
    reused without a request. A "cold" measurement or a test that must see requests clears the cache first
    (`Network.clearBrowserCache`, as `probe.mjs load` does).
  - `pkill -f` / `pgrep -f` also match the shell whose command line holds the pattern: a `pkill -f` kills your own
    command, and an `until ! pgrep -f ...` loop never ends. Kill by PID, and wait on the background job itself.
  - **A same-build A/B isolates an item** when its page has an off switch (`?clipfiles=0`, `?smallcards=0`,
    `?shadowcache=0`): the same snapshot with and without, interleaved, beside the batch's baseline. Against 5195
    alone, other agents' work in the tree moves the numbers too. On the clips run, the second visit was slower in
    both modes of the new snapshot.
  - **When re-packing meshopt data, cut it out still filtered.** Decode a buffer view without its filter
    (`MeshoptDecoder.decodeGltfBuffer(out, count, stride, src, mode)`), take each accessor's stored elements, and
    compress them again with `encodeGltfBuffer(..., 'ATTRIBUTES', 0)`, declaring the same filter. That is lossless.
    Re-encoding decoded values through gltf-transform's FILTER method isn't (its QUATERNION filter moves keys by an
    LSB), and its lossless QUANTIZE fallback doubled the clip bytes. Check the result by reading every array back.
- `?window=ahead` (yours and the one you walk or look toward) failed two world walks (the S3 shore under the arch, an
  S2 boarding) where window 1 passes all 211; the low tier keeps window 1 until that is looked at.

- **What it bought** (before/after builds interleaved, at the binding window; `gen/perf/batch1/notes.md`):
  - Phone proxy (CPU 4×, 390 × 844 at DPR 3, low tier against the old page): crown 25 → 43 fps (CPU 38.6 → 22.1 ms),
    grain wharf 20 → 46 fps (48.3 → 20.9 ms), storyteller 41 → 51 fps; on a busier machine 14 → 31, 13 → 33, 30 → 65.
    GPU memory on a phone viewport 179 → 98 MB (the MSAA buffers 37 → 0, the bakes 57 → 19); JS ArrayBuffers 296 →
    196 MB.
  - Desktop 1080p, high: crown 138–198 → 201–233 fps (CPU 4.9–7.0 → 4.1–4.7 ms, 495 → 385 draws); GPU memory 289 →
    276 MB (the bakes −37, the MSAA buffers +24: the normals are multisampled now too).
  - First load (phone, CPU 4×, fast 4G, raw bytes): walking after 25.6 → 9.5 s (21.4 → 8.5 MB first), a second visit
    8.7 → 3.6 s.

### Frame rate: what batch 2 learned (`gen/perf/batch2/framerate.md`, `notes.md`)

- **Shadows come in two layers** (`world.js` `shadowLayers`). Every direct child of the scene is the world's layer
  by default: drawn into the shadow map only when the box's snapped centre or the sun steps, a section comes or goes,
  the camera moves 1 m (the tree cards turn to it), or a static direct child of the scene is added or removed; its depth
  is kept and copied back (blitFramebuffer) on the people's redraws, which draw only the movers over it. **A thing you
  add that moves and casts a shadow must set `userData.shadowMover = true` on the object it adds to the scene** (the
  crowd's group, a Person's root and the boats' batches do), or its shadow stays put until the world's layer is
  redrawn. Nested flags are not read. A shader-only sway (wind) is no move: cast from the rest pose. A static change
  inside an object already in the scene asks for a redraw with `shadowLayers.world = true`. `?shadowcache=0`: one
  layer, for A/B.
- **An empty instanced batch still costs a draw.** three runs its per-object work (render list, program, uniforms,
  onBeforeRender, a 0-instance draw) for a mesh with `count = 0`; cutting a count to 0 in onBeforeShadow keeps that
  cost. Hide such a mesh (`visible = false`, `castShadow = false`) instead: `crowd.js` does it per batch every frame
  (`crowd.skipEmpty`), -15...-37% CPU on the phone proxy, the same picture.
- **Boats share one batch per material across sections** (`boats.js` join/leave, `this.pool`): a section's pieces go
  in when it joins, out when it leaves (after its flow copies); never keep a batch id past its section (`set.joined`).
- **Measure small changes in one page.** On the shared machine the same view swings 2x between page loads, so a
  two-page A/B can't see 5-10%. Flip a runtime switch between short measures, A B B A for 10 rounds, medians
  (`gen/perf/batch2/framerate/inpage_ab.mjs --a '<js>' --b '<js>'`); time a pass itself when you can
  (`framerate/shadow_split.mjs`). Give every perf change a runtime or `?` switch so it can be measured this way.
- Full tier: people cast shadows to 40 m (`tiers.js` high `peopleFar`), the box's centre snapped to 1 m.

### The crowd's far bodies (`gen/perf/batch2/crowd.md`)

- **Every character and animal GLB carries a far body.** It is a simplified index over the body's own vertices
  (meshoptimizer, a quarter of the triangles, at most 2% of the extent), an accessor named by the body mesh's
  `extras.lod`, written by `tools/char_lod.mjs`.
  - `character.mjs build` (splitClips, before clip_split) and `animal.mjs build` run it. clip_split carries it into
    `chars/body/`.
  - Anything else that writes a shipped character or animal GLB must run `flock /tmp/qingming_charbuild.lock node
    tools/char_lod.mjs <glb>` after (for `chars/*.glb` it re-splits). Check with `node tools/char_lod.mjs all --check`.
  - A file rewritten without it (gltf-transform renumbers accessors) just draws the full body: the page checks the
    counts.
- **The page** (`people.js` farBodies, `crowd.js`): a character is drawn with its far body when all its people in view
  are past the tier's `peopleLod` (`tiers.js`: low 20 m, mid 30, high 50; each about 70 px tall on screen).
  - This never adds a draw.
  - `?peoplelod=<m>` overrides the distance (`Infinity`: off). `?lodsplit=1` (`crowd.lodSplit`) also draws the far people
    of a character with people near, in a draw of their own (3 or more).
- **The phone proxy can't see vertex savings.** The 4070 draws the whole crowd's colour pass (460k skinned triangles) in
  ~0.15 ms, and a 4x-throttled CPU sets the frame. A change that trades draws for triangles therefore can't win there:
  each instanced draw is ~0.05 ms of CPU at 4x.
  - To measure what a pass costs on the GPU, time that pass alone: `gen/perf/batch2/crowd/crowd_pass.mjs` draws the crowd
    group N times into the colour target between frames.
  - Count draws and triangles from the meshes (`crowd/probe_lod.mjs`) rather than from `renderer.info` of one frame,
    whose shadow passes come and go.
  - On a throttled CPU, the frame's GPU timer query includes the CPU's gaps between submissions, so "GPU ms" there
    follows the CPU.
- Instance buffers that change every frame: upload only the rows in use (`clearUpdateRanges()` +
  `addUpdateRange(0, count * itemSize)`), not the whole capacity.

## Ambient life (the details pass, 2026-10-13; `gen/details/ambient/`)

The one place the world adds what the scroll doesn't paint, and only motion and air (`map/BUILDING.md` "Ambient
life"). `web/src/ambient.js` + `web/src/ambient_sites.js`, made by one world.js line (`createAmbient({ scene, camera,
player, sections, people, hour, query })`), tuned only through the tier (`tiers.js` `detail.ambient`, via `detail.js`),
on by default since the user's sign-off, 2026-10-13 (`?ambient=0`: nothing is added and no material is touched), `globalThis.__qmAmbient` (stats(), groups, events) for checks.
- **Placed from the map, never by eye:** `sitesOf(layout, people)` is a pure function (node imports it:
  `node gen/details/ambient/tools/sites.mjs` writes every section's sites with the map ID each comes from). Crows wheel
  round the tallest trees (and S1's painted nests), pigeons over the roofs of a built-up section; swallows skim straight
  runs of the route and side roads, and the water entities' shores offset onto the water; an egret passes along a reach;
  sparrows peck a metre out from props named basket/sack/grain/heap/goods/table/tray/stall, kept 0.9 m from mapped
  figures and 1.2 m from walker paths, and flee to the nearest tree crown or eave; catkins from willow cards, seeds from
  elm cards, old leaves from bamboo; kitchen smoke over buildings named eating house/eatery/tea house/tavern/饭铺/正店
  (no stove is painted outright; S2's eatery rack gets steam); bats at the tallest trees and the biggest roof;
  butterflies at hedges and wattle fences. Where only eaves are measured, a ridge is eave + 0.36 × the narrower side.
- **Cheap by construction:** one draw for every bird (a 47-triangle procedural bird; species shape and colour from
  uniform tables; wheel, skim, pass and flit paths, flap and glide all in the vertex shader; flat toon, inked), one draw
  for every particle (an instanced quad, procedural shapes, blended, no depth write so no ink edges, the neutral
  `qmNormalOut`, each path a function of time and the shared wind). No texture, no download, no shadow caster. Sparrows
  are the only CPU agents (10 Hz, only within 45 m): they write a segment (from, to, start, end, mode) when the last one
  ends and the GPU plays it. Per frame: one chained `scene.onBeforeRender` (uniforms, `WIND.sync`), a 4 Hz poll of the
  loaded sections (a section counts once `sec.persons` is set: its collider, trees and people are in).
- **Cloth in the wind:** pieces of `g_cloth_*__nocol` meshes (and sign-atlas pieces within 2.5 m of a painted banner)
  are found by welding positions (in world metres: shipped GLBs quantize positions and keep the scale in the node) and
  flood-filling triangles; a piece sways when it is a sheet (area-weighted normals agree > 0.85), not a box face (two
  flat pieces within 0.45 m turned across it) and hangs ≥ 0.3 m (or is by a banner); weight = metres below its top. The
  mesh draws with a patched clone of the material the page gave it (never the shared variant; re-dressed if the page
  re-assigns; compiled with `compileAsync` first); the displacement goes back to the mesh frame with
  `inverse(mat3(modelMatrix))`. Its shadow stays the rest pose (the depth material is the default).
- **The hour:** species have hours; a bird whose time is up flies off (spirals out, climbs away), it never blinks out.
  Sparrows go up to their perch at dusk and come down in the morning; bats 18.3–21.0 and 4.2–5.7; smoke follows the
  cooking hours.
- **Seeing it:** tiny things vanish in a strip film. `gen/details/ambient/tools/amb.mjs film … --first 1 --raw <dir>`
  saves full frames; `crop.mjs` enlarges the spot. A pale-grey puff at 20% alpha on a pale sky is invisible: smoke
  needs a blue-grey that darkens at its base and alpha near 0.9.
- **Caps and pitfalls:** a section's particle budget is spread over its trees, but no tree gets more than about 5 a
  metre of height at high: S3 has one willow tall enough, and it once got 540 catkins (a snowstorm). A two-layer
  banner (a plain back and a lettered face, facing opposite ways) must flutter along one side's normal, or the
  letters sink behind. A striped banner whose gaps hold another, non-cloth material (S4's 'bark' stripes) is left
  still: make every stripe cloth in the builder if it should sway. Catkins with rays read as snowflakes: use an
  irregular soft tuft.
- **Numbers (2026-10-13, phone proxy: 390 × 844 × 3, CPU 4×, low tier; `gen/details/ambient/notes.md`):**
  - **Low:** +2 draws, +1.1k triangles, +0.23 MB GPU (instance buffers, no texture). The module's own callback costs
    0.02–0.1 ms.
  - **The decisive measure** is a fast interleave: the root shown and hidden, 10 pairs × 2 s, `amb.mjs toggle`.
    Drawing the two meshes costs +0.4 ms CPU at 4× (about 0.1 ms unthrottled) and 0.6–2.7% fps.
  - **Amplified to 4.2k instances:** +0.3 ms GPU.
  - **High (1080p):** +2 draws, +14k triangles, within 2%.
  - **Slower measures:** the dispose-and-remake A/B and page loads (on against `?ambient=0`) swing ±15% between
    runs. Measure with the toggle.
  - **Lever:** low `birds: 0` leaves one draw.

## Memory (the engine round, 2026-10-12; `gen/expand/engine_lessons.md`)

The aim: a phone holds the world however long it gets (an iPhone Safari tab dies at about 1–1.5 GB). Measured in
headless Chrome on the real GPU at 1280×720.
- **Three sections loaded:** GPU 393 → 193 MB, JS ArrayBuffers 180 → 101 MB, download 21.3 → 29.3 MB (+8 MB, mostly
  UASTC tree cards for −64 MB of GPU: kept). About 92 MB of the GPU figure is fixed render targets (the post pass's
  4× MSAA half-float colour and depth, the normal target, the 2048² shadow map); about 60 MB on a phone (pixel-ratio
  cap 1.5, 1024² shadow). A section alone is 47–60 MB with KTX2 (122–131 with webp); the default window holds three,
  about 92 + 3 × 55 ≈ 260 MB at any length of world.
- **The biggest item was the crowd's Float32 bone bakes** (about 116 MB), not the textures. They now bake only new
  clips, appended, time-sliced (4 ms a frame for people not yet drawn; someone on screen who starts a new clip gets it
  before the next frame), in balanced columns (2100 rows as 2 × 1050, not 2048 + 52); every carried prop and animal
  tack shares its body's bake, each vertex moved once by its bone's correction `K = BM⁻¹·BI⁻¹·BI′·BM` (exact to 1e-7
  against three's own skinning).
- **On a desktop ETC1S copies become BC7** (8 bits a pixel: three's KTX2Loader prefers BPTC); a phone gets ETC1/ETC2
  (4) and ASTC 4×4 for UASTC (8). Desktop figures are the upper bound for a phone.
- **Load stalls:** 51–97 ms warm, 110–126 ms for the first neighbour in a fresh browser (before: long tasks of
  1.0–1.25 s). Where they went: card images decoded on the main thread (now `createImageBitmap`; Safari keeps
  TextureLoader), full rebakes, shader compiles at first draw (now `renderer.compileAsync` before a section is drawn),
  brute-force tree grounding (now through the section BVHs), characters prepared all at once (now one per frame).
- **A round trip returns to baseline** (`?window=0`, end to end and back at a run): geometries, programs, materials,
  textures, people and batches equal; the heap within 1 MB; GPU +6.6 MB for the clips played so far.
- **Pitfalls:** a block-compressed texture whose base level isn't a multiple of 4 renders black on desktops (ANGLE):
  `ktx2.mjs` resamples such images by at most 2 px. `THREE.Cache` keeps every GLB and image for the page's life (off;
  a GLTFLoader plugin shares kit textures instead). Setting animated bones back by hand while a mixer's action is live
  breaks the next sample (three's PropertyMixer skips values it already wrote): stop the action and let the mixer
  restore them. Removing `#stats` from the page stops its render loop: hide overlays, don't remove them. KTX2 copies
  re-transcode after a lost GL context (`restoreKtx()`); the bakes keep their CPU data (about 39 MB with three
  sections) for the same reason.

## Performance facts (round 2, v1: all eight sections, 2026-10-12)

Budget runs, headless on the real GPU (`budget_check.mjs`, alone; `gen/sections/<folder>/qa/run3/`):

| section | triangles drawn | GLB (+ boats) | own download | with kit and cast | draw calls | GPU alone |
|---|---|---|---|---|---|---|
| S7 `city_end` | 48.0k | 0.85 MB | 1.53 MB | 11.83 MB | 132 | 21.4 MB |
| S4b `outer_road_2` | 124.9k (95/m²) | + 0.84 MB, 6 boats | 4.85 MB | 18.33 MB | 210 | 41.9 MB |
| S3 `rainbow_bridge` | 107.4k | 1.86 + 1.26 MB, 11 boats | 7.92 MB | 26.13 MB | 316 | 79.6 MB |
| S2 `canal` | 115.2k | 1.74 + 1.92 MB, 16 boats | 8.88 MB | 25.15 MB | 301 | 73.4 MB |
| S1 `countryside` | 93.0k | + the sampan | 7.54 MB | 18.29 MB | 247 | 44.6 MB |

- **The window binds:** S4b + S3 + S2 hold 198.2 of 200 MB of GPU. The casts are the big items (S3 29 models, S2 27;
  the idler with 43 clips is 1.27 MB); `tools/clips_used.mjs` trims unplayed clips.
- **The whole scroll** (`?window=all`): 8 sections, 34 boats, 825 figures and 72 walkers; loyalty 8/8, world walks
  210/211, `people_check` PASS. Deployed: 762 files, 81.9 MB; the live check loads it in 242 requests, 60.8 MB, 58 s.
  The real-GPU bench of the whole scroll is still to take.

## Performance facts (the expansion, 2026-10-12)

- **The sections as shipped:** inner city 115.7k triangles, 44 draw calls, 2.0 MB; outer road 105.8k, 37 calls,
  1.77 MB (73 triangles/m²; the gate 60/m²). Geometry only: the kit's textures ship once in
  `web/public/assets/tex/` (the gate's GLB went from 2.0 to 1.5 MB).
- **Loading:** a window of sections streams in and out round you (World page row; "Memory" above for the numbers).
  Only the clips people actually play are baked (a character carries up to 23).
- **Joined gate + outer road:** 174 people and animals at 357 fps in the shot tool (not a bench; the three-section
  bench is the lead's).
- **Static LODs tried and not adopted:** meshopt simplify (ratio 0.3, error 0.004) takes the gate only from 106k to
  71k triangles (the kit's chamfered pieces don't reduce) for +1.48 MB of download, while the GPU spends about 1 ms on
  the scene. For phones, a builder-made LOD (no brackets, rafter ends or trims) is the better lever.

## Performance facts (the batched crowd, 2026-10-11, 1920×1080, Windows busy with three agents)

- **People are batched** (`web/src/crowd.js`): one InstancedMesh per character; every clip people play is baked into a
  bone texture (30 fps; since the perf batch two half-float texels per bone per frame, before that three RGBA32F;
  since the engine round only the clips played, incrementally and time-sliced, with props and tack sharing their body's
  bake: "Memory", "Reach"); per person the CPU keeps only clip times and writes a matrix and two rows a frame; the
  shader blends the four bones at both rows and the next frame. Their normals come with their colour (MRT, "Reach";
  before, a baked normal material drew them again for the ink pass); shadows use a baked depth material. The player's own character stays an ordinary skinned mesh. `?batch=0`
  restores one skinned mesh and mixer per person, for A/B.
- **Gate, 77 people:** batched 291–328 fps (CPU 2.8–3.2 ms, 188–193 draw calls) vs unbatched 114–142 fps (CPU
  6.8–8.5 ms, 344–361 calls).
- **Gate + 300 load-test walkers (377 people):** batched 232–292 fps (CPU 3.2–4.2 ms, 194 calls) vs unbatched 23–25 fps
  (CPU 40–43 ms, 1,145 calls). People no longer dominate; the routines (about 1.1 ms for 377) do.
- `people_check` at X 7 D 2.7 is timing-sensitive (which walkers reach you in 12 s): rerun once before reading a
  FAIL there as a regression.

## Performance facts (gate after the loyalty pass, 2026-10-11, 1920×1080)

- **The loyal gate:** 100k triangles, 32 draw calls, `gate.glb` 1.97 MB; 77 painted people (63 at their spots, 14
  walkers), backdrop and mist.
- **One gate, 77 people:** 207–303 fps (CPU 3.1–4.6 ms). **+40 load-test walkers (117):** 142–158 fps. **Four gates,
  308 people:** 34–66 fps. **CPU 4× slower:** one gate 37 fps, four gates 11 fps. People still dominate the cost.

## Performance facts (gate with its people, 2026-10-10, 1920×1080)

- **The rebuilt gate:** 83k triangles, 34 draw calls, `gate.glb` 1.9 MB; 8 characters of about 4.2k triangles,
  200–370 KB each.
- **One gate with its 43 people** (16 scroll figures with action cycles, the porter, 26 traffic), third person with
  bodies: 560–620 fps, CPU 1.5–1.7 ms.
- **One gate, 80 people:** 257–360 fps. **Four gates, 172 people:** 159–235 fps. **Four gates, 240 people:** 121–178 fps.
- **With the CPU throttled 4×:** one gate with 43 people 79 fps, four gates with 240 people 17 fps.
- **Evening re-bench** (122k-triangle gate after the tiles pass, true colours, daylight, routing; Windows about 28% busy):
  one gate 316–622 fps, 80 people 305–362, four gates 172 people 118–205, 240 people 89–135, 4× throttle 68 and 14.
  Routing, daylight and the palette each A/B at no measurable cost.
- **People dominate the cost:** each is a mixer plus 3 draws (colour, normal, shadow).
- Already in place: people are frustum-culled (a padded bind-pose sphere); walkers check the ground 10 times a second;
  the ink pass doesn't recompute world matrices. Those three took four gates with 240 people from about 90 to 100–150 fps.

Messenger techniques we haven't adopted yet, and what each removes (the scene pass with multiple render targets
and adaptive resolution came with the perf batch: "Reach"):
- **All characters batched into one skinned draw.**
- **Per-object detail levels and culling** for the static world (BatchedMesh).
- **Animation level-of-detail for distant people** (update far mixers less often).

GPU ms is inflated whenever the CPU is the bottleneck, because the timer counts idle gaps too.
