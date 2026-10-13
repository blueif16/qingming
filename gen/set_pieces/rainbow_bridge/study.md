# The Rainbow Bridge (虹桥) set piece: study, kit and proof

Set-piece factory, round 2, 2026-10-12. Kit: `blender/kit_rainbow_bridge.py`. Sheet (painting beside the kit):
`sheet.jpg`. Proof builds: `proof/` (the stub from my reading) and `proof_part/` (the bridge agent's part,
`gen/map/S3/parts/bridge.json`, put into layout form with S4b's seed frame). The scripts are in the session scratchpad
(`scratchpad/rainbow_bridge/`: `make_stub.py`, `from_bridge_part.py`, `proof_build.py`, `walk_bridge.mjs`,
`ship_test.mjs`, `make_sheet.mjs`).

The scan was read at zoom 1.2–3 with the grid (`scroll_map.mjs S5 overlay --parts none --grid 20`). The restyle was
not used over the bridge (`sections/rainbow_bridge/notes.md`: it recomposes the arch). 唐寰澄's and 张临生's numbers are
hints only (below); the painting decides.

## Crops

| crop | what it shows |
|---|---|
| `crops/paint_bridge.jpg` (u 18250–20350, v 0–1300, plain) | the whole painted bridge |
| `crops/overview_z06.jpg` | the same with a 100 px grid |
| `crops/arch_s_half_z13.jpg`, `crops/arch_south_foot_z16.jpg`, `crops/rib_side_z3.jpg` | the south half of the arch face: the band, its two layers near the foot, the node blocks at (19010, 700) and (19105–19125, 571–614), the south pole and its crossed boards |
| `crops/arch_south_upper_z16.jpg`, `crops/nodes_mid_z3.jpg` | the band between the south foot and the crown (no node block there), the X-braced railing |
| `crops/crown_z16.jpg`, `crops/soffit_crown_z3.jpg`, `crops/rail_crown_z3.jpg` | the crown: deck on the arch, the node block at (19598–19645, 300–332), the railing's rails and posts; under the arch the big boat's striped cabin roof (not the bridge's underside) |
| `crops/arch_n_half_z13.jpg`, `crops/nodes_n_z3.jpg`, `crops/north_end_z16.jpg`, `crops/nfoot_z3.jpg` | the north half: the band going down behind the mast lines, a node block at (19865, 380), the railing's capped end post (望柱) at (20027, 325–396), the north pole |
| `crops/post_n_z25.jpg`, `crops/post_s_top_z3.jpg`, `crops/post_s_foot_z2.jpg` | the two tall poles (表木) and their crossed boards; the south pole's foot hidden under a roof |
| `crops/south_ramp_z12.jpg`, `crops/sramp_rail_z25.jpg`, `crops/sfoot_wide_z08.jpg`, `crops/sfoot_abut_z2.jpg` | the south ramp: the crowd, the sedan, the mat-awning stalls and parasols on it; the near railing with an X brace per panel; the arch's south foot hidden behind the people on the bank |
| `crops/far_post_search_z2.jpg`, `crops/nramp_deck_z3.jpg` | searches for a far-side pole (none) and for deck boards or steps (hidden by the crowd) |

## The structure as painted

- **One face, drawn in elevation.** The painter shows the bridge's near (east) face: the arch as one smooth, even band
  (16–20 px, about 20 px at u 19100) from the south bank, visible to (18815, 1072), over the crown (band top at v ~300,
  deck edge v 280) and down behind the big boat's mast lines to about (19960, 430). The deck edge and railing sit on the
  band; near the feet a gap opens between them, crossed by verticals (posts under the deck).
- **Two beam layers near the feet.** At u 19100 the band reads as a wide layer (~20 px) with a narrower one (~12 px)
  above it; at the crown they merge. That is what a woven arch shows from the side where its two systems part: the
  three-beam system (三节苗) and the four-beam system (四节苗) of the 贯木拱.
- **Cross beams.** Their ends show as blocks on the band: a round end at (19010, 700) where the south pole touches the
  arch, a carved block at (19105–19125, 571–614), one at the crown (19598–19645, 300–332) and one at (19865, 380). The
  stretch u 19180–19460 has none. Four visible nodes per face fit nodes at ±1/3 and ±1/2 of the arch's angle plus the
  crown.
- **Rib systems across the width: not painted.** The underside never shows. The striped curved surface under the arch
  (u 19150–19850, v 330–450) is the big boat's mat cabin roof, with its windowed cabin and railing below it, not the
  bridge's soffit. The kit's 11 rib lines (6 of system A, 5 of B) are a choice.
- **Lashings or iron bands: not painted** (the node blocks are plain or carved). The kit puts dark lashing bands where a
  cross beam presses the other system's beam, and iron bands where a system's own beams meet: small, dark, structurally
  needed (BUILDING.md rule 3).
- **Abutments: hidden.** At the south foot by the crowd standing on the bank (feet at v ~1290), at the north by the mast
  lines. Choice: stone abutments (coursed blocks) with a stone ledge and a timber sill under the arch's feet.
- **Deck boards and steps: hidden** under the crowd everywhere (the north ramp's surface lies behind the crown). Choice:
  boards laid across, two per row with a staggered joint and ragged ends; where the deck is steeper than 17 deg they are
  level treads (steps), each closing down to the tread below.
- **Railings.** Posts 55–65 px apart on the south flank with one X brace in each panel; at the crown several horizontal
  rails; the handrail 50–75 px above the deck edge; a capped end post (望柱) where the near railing ends at the north
  landing (20027, 325–396). The far (west) railing is not painted.
- **Tall poles (表木).** Two are painted, both on the near (east) side: the south-east one in front of the arch's south
  foot (foot hidden under a roof at about (19026, 1290); crossed boards at v 758–802; top about v 700), and the
  north-east one at the north landing (base about (20050, 395); crossed boards at v 27–52; a clamp at (20051, 312)). Each
  has two boards crossed in an X near its top. No far-side pair is painted (searched u 18620–18960, v 100–480). The map
  lists the two as `S3.prop.bridge_end_post_19026` and `_20050`.
- **Ramps.** The south ramp carries the crowd, the sedan of 车轿相争 (18720–18790, v 420–580), a mat-awning stall hanging
  over the near railing (18740–18960, v 620–760), a parasol stall and a mat-awning stall by the upstream water
  (18310–18560, v 440–700). Its foot is hidden. The north ramp ends at the near railing's capped post, right at the bank.
  **The painted deck is far too steep to walk**: the bridge agent measures 13.5 m of depth foot to foot under a 5.4 m
  crown (45–70 deg at the feet).
- **Stalls and awnings on the deck are the tiles' props, not the kit's** (t5–t7; the bridge agent's report lists them).

**Which way the width lies.** My first reading put the far railing up and to the left of the near one along the frame's
receding direction (about 8.5 m). The bridge agent reads the width east-west across the picture: the deck crowd on the
south ramp spreads about 750 px west of the near railing at the same v, to the upstream water (9.7 m at 77 px/m). With
S4b's seed dx (31.6) that maps the deck as a parallelogram skewed 37 deg; it is square only if the local dx is about
90 px/m. The kit builds the bridge square and warns (below). This is the frame agent's and the lead's call.

## Dimensions (real size, painted place)

Positions come from the map: the near (painted) deck edge sets the centre line and the feet, a rib line or the feet set
the springings, the H_profile sets the crown. Everything else is a `choice:` in `DEFAULTS`:

| size | default | evidence |
|---|---|---|
| deck width, railing to railing | 8.0 m (the map's width wins, clamped to 6.5–10 m) | 张临生: about 8 m (hint); painted: stalls on both sides of the south ramp with the sedan party between them, the crowd 3–4 deep at the crown; the bridge agent's 9.7 m and my 8.5 m readings |
| span, springing to springing | 15 m, or 0.5 m inside the mapped feet when no rib line is mapped | my near-face springings (18880, 1080) and (19960, 470) are 15.0 m apart in the seed frame; the painted feet 16.4 m; hint 20+ m |
| deck crown above the banks | the mapped crown (4.7 m when unmapped) | painted 5.4–5.6 m in the seed frame (both readings) |
| rib logs / cross beams | 0.40 m / 0.34 m, cross beams 0.45 m past the outer ribs | the painted band ~20 px at u 19100 (0.26 m at 77 px/m), drawn at about 0.6–0.85 of the frame's scale up there |
| water / springing | water −1.5 m (S4b seed); springings 0.3 m above it | frame |
| railing | 1.05 m high, posts every 1.6 m, X brace per bay | painted 50–75 px; posts 55–65 px apart |
| 望柱 (railing end posts) | 1.5 m, pointed cap | painted at the north landing |
| 表木 (tall poles) | 8.0 m, Ø 0.28 m, boards 1.7 m crossed in an X near the top | painted south-east pole ≥ 513–550 px (6.7–7.1 m in the frame, drawn small); the north-east one 4.6–4.9 m (drawn smaller still) |
| deck build-up | board layer 0.30 m (boards with step risers), floor beams 0.24 m | |
| walk limit | 34 deg; steps above 17 deg | the gate's 34 deg flight is walked |
| abutments | stone, 2.2 m behind each springing | hidden |

Results on the two test fits (seed frame):

| | stub (my reading, `proof/`) | the bridge agent's part (`proof_part/`) |
|---|---|---|
| length foot to foot | 27.3 m | 25.0 m |
| span / rise (beam centre line) | 15.0 / 5.8 m | 16.0 / 5.4 m |
| deck crown above the banks | 5.44 m | 5.29 m |
| width | 8.0 m | 7.8 m (the parallelogram's square width) |
| steepest deck | 33.3 deg | 33.7 deg |
| soffit above the water | 4.8 m at the crown, 3.7 m over the middle 40% | 4.45 / 3.45 m |
| ramps extended past the mapped feet | north 3.5 m | 2.5 m each end (and the feet moved 2 m out from the arch) |
| triangles (visible + hidden) | 18,906 + 532 | 17,262 + 468 |

## How the fit works (`fit()`, plain Python)

1. Feet: `footprint` (four corners; south end = the lower-D pair). Deck lines (`deck*`, else `rail*`) are sorted by
   their side of the foot-to-foot axis: right of travel south to north is the near (painted) edge, left the far edge; a
   line between them (`deck_c`) is ignored as an edge.
2. Width: the median perpendicular distance between the near and far lines, clamped to real size.
3. Centre line: W/2 to the left of the **mapped near edge**, foot to foot (the painted edge is measured, the far edge is
   estimated). Straight over the arch; a ramp may come in at up to 40 deg (the painted approach street), turned on an
   arc of radius ≥ W/2 + 1.5 m so the inner edge never folds. A foot mapped further off the axis, or closer than 2 m to
   its springing, is put on the axis (a recorded choice: the stub's north landing reads 77–88 deg off the axis in the
   seed frame).
4. Springings: a rib line (`rib*`/`arch*`, near face unless the role ends `_n`/`_w`, moved W/2 to the centre), else
   `pts.spring_s`/`spring_n`, else 0.5 m inside the mapped feet.
5. Deck heights: the deck lines' `lines_H`, else the frame's `bridge deck` H_profile read along the near edge (each u
   matched to the station whose near-edge point at that H has that u, in increasing u).
6. Shape: a family (1 − cos(pi t^q)) / 2 per side, level at the crown and at the feet. The arch is sized from the mapped
   crown (its crown region just under the deck); then, among the family's shapes, the one closest to the mapped heights
   that clears the arch everywhere and stays within 34 deg, with the crown held at the mapped height and the crown
   within 5% of the arch's middle (a real arch carries its crown in the middle; the painter foreshortens the far half).
   When no shape is walkable, the shorter ramp is extended 0.5 m along its end and the search repeats.
7. The woven arch: system A (3 beams, nodes at ±phi0/3 of a circular arc, a level middle beam) and system B (4 beams,
   nodes at ±phi0/2 and the crown, one beam-and-cross-beam depth below A). At B's nodes B's cross beams carry A's
   beams; at A's nodes A's cross beams press on B's (B's nodes are lowered until they do). The painted smooth band is a
   curved facing timber on each outer face.

Every departure lands in `Bridge.summary()["notes"]` (copy them into `sections/rainbow_bridge/build_choices.json`).

## The deck height, exposed

- `Bridge.deck_H(X, D)`: the deck top at a world point, or None off the deck.
- `Bridge.table(step)`: s, X, D, H, slope and both edges' (X, D) and scan (u, v), foot to foot.
- `Bridge.h_profile()`: [u, H] along the near edge every ~100 px of u: **the built deck as the frame's `bridge deck`
  H_profile.** Adopting it makes the map and the build agree exactly.
- `Bridge.check_profile(pairs)`: the map's pairs against the built deck. Stub: within 0.7 m from the south foot to the
  crown (u 18900–19400), built higher by 0.8–2.1 m on the north half (u 19500–19900). The bridge agent's part: within
  0.2 m over u 19400–19700, up to 1.0 m lower on the south flank and 1.2 m higher at the feet. The large differences are
  where the painted deck is steeper than any walkable deck (and, on the stub, where the painter foreshortens the far
  half).
- `Bridge.on_deck(u, v)`: a figure's painted foot → (X, D, H) on the built deck, solving H and depth together (1 m of H
  is 1.5 m of depth). It round-trips exactly anywhere on the deck. A u-keyed H_profile can't do this: across the deck,
  the far edge at a given u is several metres further along the bridge than the near edge, so a figure at the far
  railing gets the near edge's height (and, on the bridge agent's reading, the whole south ramp gets H 0).
- `Bridge.clearance()`: the soffit above the water along the span, for the river agent and the boat kit (the big boat's
  cabin roof must stay under it).
- CLI, no Blender: `python3 blender/kit_rainbow_bridge.py table sections/rainbow_bridge/layout.json map/frames/S3.json`.

## Proof

- **Headless build** (factory Blender, never the live GUI): 6.7 s. Strict buckets (every piece inside
  `sb.entity("S3.str.rainbow_bridge")`; a pole mapped as its own entity is built inside its own ID).
- **Triangles by part** (stub): boards 1,920; deck body 1,458; railings 5,320; arch 4,332; deck supports 1,092;
  abutments and skirts 4,460; tall poles 324; hidden colliders 532. Total **18,906 visible + 532 hidden**, 6 draw calls
  (deck, timber, timber collider, stone face atlas, lattice, hidden). About 70 triangles per m² of deck: the railings
  are what a walker sees most. A distance LOD would drop the X braces, lashings and node caps.
- **Test GLB**, optimized with `tools/export_web_scene.mjs`'s exact flags into `proof/rb_test.glb`: 4.43 MB raw →
  **0.34 MB geometry** (`proof/rb_test_geometry.glb`), textures (wood, timber, stone atlas: 0.195 MB) are the kit's
  shared swatches, already shipped. `proof/ship.json`.
- **Renders** (EEVEE, 1280×800): `proof/three_quarter.png`, `bank.png`, `under_arch.png`, `deck_ramp.png`,
  `deck_crown.png`; `proof_part/*.png`. Blue 1.7 m mannequins for scale (proof only, never shipped).
- **Walk test** with the page's own walker (`web/src/player.js` in Node with three-mesh-bvh on the build's `__col`
  triangles; no browser, no dev server), both builds, all PASS (`proof/walk_results.json`):
  - south foot → crown → north foot walking, 16 s (stub), never more than 7.5 cm off the deck's table height;
  - north → south running, 7 s;
  - the railings stop the walker at ±3.7 m (half width 4 m less the capsule);
  - from the ground beside the south ramp, the ramp's side is a wall (nobody walks under it).
  - **Information, for the lead:** standing still, the walker creeps downhill on any slope, 0.10 m/s at 10 deg to
    0.23 m/s at 33 deg (`player.js` has no ground friction). Every ramp and flight in the world does this.

## What the S3 map must provide for the fit

- `S3.str.rainbow_bridge` with `footprint` (the four feet, H in `pts`) and the deck edge `lines`: the near (painted)
  edge measured, the far edge where it can be read (the bridge agent's `deck_e`, `deck_w`; `deck_c` is fine too).
- **The springings**: a rib line on the near face whose first and last points are where the arch meets its abutments at
  the water (est where hidden), e.g. `lines.rib_e` with `support_by: {"rib_e": "water"}`. The bridge agent's
  `arch_intrados_e` is a custom point list, which `world()` drops; without it the kit puts the springings 0.5 m inside
  the feet.
- The tall poles as entities with a `base` (they are: `S3.prop.bridge_end_post_19026`, `_20050`); the builder passes
  them as `params["posts"]` with their IDs. Custom points (`post_*`, `rail_end_n`, `beam_end_*`, `rail_e_top`) don't
  survive `world()` today.
- `supports.water` in `map/frames/S3.json` (the springing height), and the `bridge deck` support.
- Room past the feet: the walkable deck runs 2.5–3.5 m beyond the painted feet at each end along the bridge's axis (and
  the feet 2 m out from the arch); at the north end that reaches toward the silk's top edge (`painted_area`).

## Requests for the lead (tools and frame, not edited here)

1. `tools/map_layout.mjs` doesn't copy `lines_H` into `layout.json` (its field list), so a deck line's per-point H is lost
   between `world/S3.json` and the builder.
2. `tools/scroll_map.mjs world()` keeps only foot/fore/hind/front/rear/base/wheels, corners and `<corner>_<eave|ridge|top>`;
   custom points (`spring_*`, `post_*`, the bridge agent's `arch_intrados_e`, `rail_e_top`) are dropped.
3. A u-keyed `bridge deck` H_profile can't place figures across a receding deck. Either adopt `Bridge.h_profile()` and
   give deck figures their H with `Bridge.on_deck(u, v)` (H and depth solved together), or the bridge agent's rule
   u* = max(u, u_s(v)) in `world()`.
4. The receding direction over the bridge: with dx 31.6 the mapped deck is a parallelogram skewed 37 deg; the kit builds
   it square and warns that things mapped at the far corners stand up to 2.9 m off the built deck's end.
5. `tools/export_web_scene.mjs` has no `--out` and copies a section's files: a set piece's test GLB needs its own target.
6. `web/src/player.js`: ground friction (cancel the downhill slide when on the ground with no input).
