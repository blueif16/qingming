**Merged, 2026-10-12 (round-2 records agent):** into web-scene "The atomic scripts" (Ship, Loyalty, Water, Boats
(page)) and "Boats and water" (the schema, pitfalls, costs), deploy-web (the check loads every section; test pages),
characters "Routines" (crews) and scroll-section playbook step 4 (boarding walks), 2026-10-12. Left out: "Left, and
questions for the lead" (since done: the HUD's boat dot, the kit clashes, the bow wave, the boats GLB in the download
budget; still open and noted in web-scene: contacts across seams, the boarding step, `walk_page` start H).

# Boats and water on the page: lessons (the boats-page agent, 2026-10-12)

The user's rule (map/BUILDING.md, "Boats and water"): boats move as painted, decks are walkable, and the water gets the
most efficient treatment that isn't fake. The boat kit (`blender/kit_boats.py`, `gen/expand/boats_lessons.md`) made the
boats; this round put them on the page, built the water, and made both part of the pipeline before the river sections
(S4b, S3, S2, S1) are built.

## What was built

| Piece | File | What it does |
|---|---|---|
| Water strip | `blender/kit_boats.py` `water_strip(water, frame, map_id, layout=..., seams=...)`, `water_mesh(bpy, [strips], coll=...)`, `water_quad(layout, H)` | One flat surface per reach at the frame's `supports.water.H`, between the mapped `shore_s` and `shore_n` (or `centre` + `width_m` for a stream). The two shores are joined into one ring; where both ends of a closing lie within 3 m of the painted area's edge, the closing follows that edge, run on 16 m past the silk's top and bottom (under the mist) and cut exactly on the seams, at the water's own height (`water_quad`: a point at H −0.7 maps about 1 m south of one at H 0, so the ground-level painted area would leave a sliver or an overlap between two sections' water). Cut into trapezoids between columns across the flow (at every ring point, at most 8 m apart), four rows each: the shores and 2.5 m in. TEXCOORD_0 = (metres along the flow, metres across), absolute, so the drifting lines run on across seams; TEXCOORD_1 = (metres to the nearest mapped shore, clamped to 2.5; 1 = "this mesh has shore data"). Shore walls `edge:shore` (0.5 m pieces, 0.6 m under the water to 1.3 m above the bank) only along mapped shores inside the painted area. S4b's real river: 182 triangles, 71 wall pieces; the test river (90 m plus run-on): 132. |
| Boats GLB | `blender/build_boats.py <src_dir> <raw.glb>` | Every `boat_*` vehicle of a layout through `boat_from_layout(sink='nodes')` at lod 0 and lod 1, `export_boats` into one GLB (`boat:<id>`, `boat:<id>@lod1`), and a manifest beside it (kind, pose, motion, sizes, deck and roof heights, triangles per detail level, the kit options used, the kit's note). Kit options come from `build_choices.json` `boats` (below). Runs in a Blender slot. |
| Ship | `tools/export_web_scene.mjs` | Unchanged for `<name>` alone. New: when the layout lists boats, it builds the boats' raw GLB (when missing or older than the layout, `build_choices.json`, the kit or build_boats.py), ships it with the same optimize step to `web/public/assets/<name>_boats.glb` and copies the manifest to `assets/<name>/boats.json`; it then checks the shipped GLB against the raw one: every node that has extras or children is still there by name with the same extras, and no moving part's or rope's pivot moved (exit 1 otherwise). Options: `--src <dir>` (the section's data), `--raw <glb>`, `--out <glb>` (a set piece measured outside the page: its textures go to `<dir>/tex/`, no data copy, no scroll index; nothing is written into `web/` unless the path is under `web/public/assets/`), `--data <dir>`, `--no-boats`, `--boats-only`, `--rebuild-boats`. |
| Loyalty | `tools/loyalty_check.mjs` | A `boat_*` vehicle is built when the boats manifest holds it (`gen/sections/<f>/web_build/<f>_boats.json`, else the shipped `boats.json`). FAIL also on a crew figure standing on a boat the GLB doesn't hold, a `people.json` `boats` key that isn't a mapped boat, a crew/haul/tow name that isn't a mapped figure, and a boat in the GLB that isn't in the map. Prints a Boats line (built, triangles at both levels, crew). Tested on the test fixture, and with five planted faults (all five caught). |
| Deploy check | `tools/check_deploy.mjs` | Adds `?window=all` (unless the URL or `--window` says otherwise), so every section's files load; each section's own state comes from `__test.sections` (in, or failed); reports the boats loaded. PASS on the world (3 sections, 171 requests, 40.7 MB) and on `boats.html`. |
| Runtime | `web/src/boats.js` | Loading (with its section, in the streaming window), batching, colliders and contacts, motion, moving parts, ropes, crew, detail level (below). `window.__test.boats` (`list`, `byId`, `report()`, `stats`). |
| Water | `web/src/water.js` | The `current` shading (material `water`) and `ring` shading (material `water_ring`, the kit's wet ring): `surface.js` hands those two kinds to it (`SURFACE_KINDS` water → current, water_ring → ring). |
| Hooks | `web/src/world.js` (9 small edits), `people.js` (4), `player.js` (carry, friction), `scroll_hud.js` (2), `surface.js` (3 lines) | world.js: import; `new Boats(...)`, `player.platforms = boats`; the boats GLB fetched with the section (in parallel, from its layout) and its group added under the section's root; `boats.add` before the colliders are built; movers in `rebuildCollider`; `boats.remove` on unload; `boats.update` after `people.update`; the people hook `host`; `boats` in `__test`. people.js: a figure the page's `host` claims is placed by it every frame (`people.attached`), and registered in `agentOf` when its boat moves (the HUD shows its dot). scroll_hud.js: a boat painted under way shows a dot where it is now and a line back to its painted spot, no box. |
| Test page | `web/boats.html` (world.js with `data-sections="boats_test"`; in `vite.config.js`), fixture `gen/boats/page_test/` (layout, people, build_choices, scene, backdrop, walks.json, shots.json), assets `web/public/assets/boats_test*`, `assets/water/water_lines.webp` | A bank with a landing stair, the river (H −1.5), a narrow north bank; seven boats: a moored rafted pair A (passenger) and B (grain under awnings) with A's foredeck at the stair; R, a sweep boat rafted outside B at its painted spot, rowed east 10 m and back; T, towed upstream by three trackers on the north bank, mast up; L, a passenger boat lowering its mast; S, a small open boat rowed with oars; G, a deep-laden grain boat off the bank with a gangplank and a mooring line. 18 crew and trackers as stand-ins. Scripts (session scratchpad `boats_page/`): `make_fixture.py`, `boats_test_scene.py` (the test ground: kit pieces and the water strip), `ride_test.mjs`, `cost.mjs`, `creep.mjs`, `strip_test.py` (the strip in plain Python on real strokes), `s4b_scene.py`. |

### The runtime in detail (`boats.js`)

- **Batching.** Every visible mesh of a section's boats (bodies, moving parts, ropes, wet rings, both detail levels) is
  baked into its node's frame as plain floats and goes into one `THREE.BatchedMesh` per material, each piece an
  instance whose matrix is `root.matrixWorld × node.matrix`, set each frame for the shown level. Before batching a
  boat cost about 30 draw calls over the three passes (a body per material, each moving part, each rope, the ring):
  six boats +180 calls, S2's twenty would have been +600 against the 330 budget. After: one call per material per
  pass for all of a section's boats (+21–27 calls for seven).
- **Colliders.** Each boat's `deck__col`, `roof__col`, `rim__col` and gangplank (a 0.84 m walkable corridor with 1 m
  invisible rails) are one `MeshBVH` in the boat's frame, wrapped as a `MovingBVH` (shapecast, raycast,
  closestPointToPoint through its object's matrix; triangles can be switched off). The page's collider list takes it
  like a section's BVH, so the walker, the follow camera, the tools' raycasts and people's grounding all see decks.
- **Contacts.** At load each rim piece (the kit's 2 m pieces) looks outward at three points along it, 0.35–1.7 m
  out, for a walkable surface (normal y > 0.6) between 1.2 m below and 0.7 m above its deck: the bank, a stair or a
  jetty (the loaded sections' BVHs) or a neighbour's deck. A facing piece of the neighbour within 1.9 m opens too
  (rafted boats' 2 m pieces don't line up). Where a piece opens: its rim goes, a boarding bridge spans the gap (from
  the deck at each end's own height, which rises with the sheer, out to the surface), invisible end walls close each
  run of open pieces (so nobody walks along the bridges past the contact into the water), and the section's shore
  walls inside the contact's footprint move to a switchable set and open with it. A gangplank's foot is a contact too:
  the rim opens only across the plank's width.
- **Motion.** A moored boat rides: bob 2.2 cm (+0.6 cm faster), roll 0.6°, pitch 0.25°, each boat in its own phase,
  inside the kit's wet band. A boat under way (pose rowed, poled, towed, sailing, drifting, lowering mast) pauses at its
  painted spot (8 s), goes out along its heading (eased: 8 m at 0.6 m/s rowed, 6 m poled, 8 m towed, 12 m sailing, 4 m
  drifting, 2 m lowering its mast), pauses at the far end (3 s) and comes back astern; people.json overrides each. Its
  contacts open only while it waits at its painted spot, and it waits while you stand in one. The sweep sculls (±14°,
  2.8 s), oars stroke (±22° and a 9° feathering roll) while it moves; a mast being lowered goes between its kit range
  (40–60°) over 24 s. Boats step inside `player.update`, so tools that step the walker themselves (walk_page) move the
  boats in lockstep.
- **Ropes.** Every `line_*` of the shown level within 90 m: from point a to point b each frame (points on moving
  parts follow them; world-fixed ends stay; the tow line ends at its tracker's shoulder, people.json `tow`).
- **Carrying.** player.js: standing on a deck (a downward ray from the feet hits a boat within 1 m), the walker keeps
  its spot in the boat's frame; at the next step the boat's move and turn carry it, before its own move. A teleport
  ends the ride.
- **Detail.** The hull's line further than 36 m from the camera shows lod 1, nearer than 32 m lod 0 again.

## The schema the area builders use

### 1. The water (the section builder)

```python
import kit_boats as kb
FRAME = json.load(open(<map/frames/S?.json>))            # supports.water.H
strips = [kb.water_strip(L["entities"][wid], FRAME, wid, layout=L, seams=("west", "east"))
          for wid, e in L["entities"].items() if e["kind"] == "water"]
# ... the rest of the scene ...; then, with the bucket meshes:
kb.water_mesh(bpy, strips, coll=coll)                     # one mesh, material `water`, both UV sets
owners.update({s.map_id: s.tris for s in strips})         # placed.json: the strip belongs to its water entity
```
- Call `water_strip` before the buckets become meshes: it adds the shore walls (`edge:shore`) to them.
- `seams`: the sides that are seams to a neighbour (the strip stops there). S1 (the scroll's end): `("west",)`.
- `flow` defaults to east (+X, gen/boats/water.md). Shores are the mapped `shore_s` / `shore_n` lines at the water's H.
- Don't build water in buckets of material `water` as well: one strip per reach is the whole river.

### 2. The boats (build_choices.json `boats`, by map ID, each with its reason)

```json
"boats": {
  "S4b.veh.boat_mat_cargo_14900": {
    "kit": { "kind": "grain", "hold": "laden", "lw": 13.0, "gangplank": [X, D, H], "moor": ["S4b.prop.mooring_post_14737"] },
    "why": "rafted between ...: at 20 m it overlaps its neighbours, shortened to 13 m (0.65 of the type)"
  }
}
```
- Everything the map can't say: `kind` (when the slug misleads `kind_of`), `lw` (shortened, never below 0.6 of the
  type), `beam`, `free`, `hold`, `cabin` (dict, or false), `awning`, `cloths`, `mast` with `mast_angle`/`mast_h`/
  `mast_at`, `tow_to`, `sweep` ('port' | 'starboard'), `oars` (per side), `gangplank`, `moor`, `cargo`,
  `stern_house`, `bow_canopy`.
- Names resolve from the layout: a figure (slug or map ID) → its foot at H + 1.25 (a tracker's shoulder); a prop or
  structure map ID → its position at H + 0.8 (a post's head), or at its own H for `gangplank`.
- **A gangplank's foot must be at the bank's edge** (within about 0.3 m of it, at the bank's height): the plank is
  straight, so a foot further inland runs it under the bank top at the edge and the bank face blocks the way back up.
- Moves outward over open water are `moves` as for any entity (map_layout moves `front`, `rear` and every point).
- Nothing to do by hand for the GLB: `export_web_scene.mjs <folder>` builds and ships it whenever the layout lists
  boats.

### 3. The crew (people.json)

- **Crew are ordinary figures** in `figures` (character, do, props, scale, nudge, facing_deg): a figure whose layout
  support is `boat deck: <id>` or `boat roof: <id>` stands on that boat (its painted spot carried into the boat's
  frame, on the deck or roof below it, brought in toward the centre line when it lies off the built hull) and moves
  with it. Everything that reads figures (loyalty, budget, clips, the HUD, people_check) works unchanged.
- **`boats`**, by boat slug, only where a boat needs more than that:
```json
"boats": {
  "boat_cargo_sweep_15750": {
    "run_m": 8, "speed_mps": 0.6, "pause_s": [8, 3], "mast_cycle_s": 24,
    "crew": { "boatman_at_sweep_15800": { "work": "sweep" }, "rower_15900": { "work": "oar", "at": "pt_oar_p0" } },
    "haul": { "tracker_lead_16300": { "walk": "walk", "stand": "hold_rope" } },
    "tow": "tracker_lead_16300"
  }
}
```
  `work: sweep` stands the figure at the sweep's bar (spread along it, facing the pin), swinging with it; `work: oar`
  at an oar's grip (`at`: which), swinging with it. `haul`: trackers on the bank, who walk with the boat's travel
  (their `walk` clip while it moves, `stand` while it waits). `tow`: the figure the tow line ends at.

### 4. Shipping and checks

`node tools/export_web_scene.mjs <folder>` (prints the boats line: boats, roots, nodes kept, none lost),
`node tools/loyalty_check.mjs <S>` (boats and crews counted), walks with a deck in them (`walks.json`), and
`node tools/check_deploy.mjs <url>` (every section loads).

## Proof on the test page (`web/boats.html`, private bench Chrome on port 9227, dev server 5180)

- **Walks** (`tools/walk_page.mjs`, `gen/boats/page_test/walks.json`): 12/12 PASS. Down the stair onto A's foredeck;
  across A onto the rafted B; A's bow rail and the end wall of its boarding bridges stop you; B's bow rail; back up
  the stair ashore; the shore walls on both banks where no boat touches; onto A from the bank along its side (its
  whole side touches the bank); up the gangplank onto G; the gangplank's rails; G's far rail; back down the plank.
- **Riding** (`ride_test.mjs`, stepping the walker at 60 Hz as walk_page does): 5/5 PASS. Onto the sweep boat R from B
  while R waits at its painted spot; standing still while R rows 10 m out and back: 1 mm of drift in R's frame, 10 m
  of travel in the world; while R is away its closed rail stops you on its deck (not in the river); back at its spot,
  onto B again; on the moored A for 10 s: 1 mm of drift while the deck rides 7 cm.
- **Ground friction** (`creep.mjs`, standing 10 s): the gate's 34° flight 0.23 m/s → 0; the street 0.011 → 0; the
  boats' sheer decks (10–11°) 0.07–0.09 → 0.0035 m/s (the deck's own roll); the test stair ramp 0.077 → 0.
  **Walks unchanged:** world 42/42 (`sections/world/walks.json`, `?window=all`), gate 11/11, inner city 19/19, outer
  road 11/11, alone, with friction on and off (`player.friction = false` is the A/B).
- **Streaming** (`world.html?sections=inner_city,boats_test&window=0`): the boats section loads (the boats step 12–17
  ms of a 214–451 ms load, stall 78–135 ms) and unloads (boats, movers, colliders, crew to 0; geometries 119 → 100 and
  textures 111 → 88, the baseline) twice, no console errors.
- **Shots** (`tools/shots_page.mjs`, `gen/boats/page_test/shots.json`) at 08:30, 13:00, 18:24 and a night (21:30):
  scratchpad `boats_page/shots_hours/` (sheet.jpg and 20 pngs), water close-ups `shots_w/`.
- **Films** (`tools/film_page.mjs`): the sweep boat rowing out and pausing (`films/sweep_R.jpg`), the towed boat coming
  upstream behind its trackers with the tow line on the lead tracker's shoulder (`films/towed_T.jpg`), the small
  boat's oars (`films/oars_S.jpg`), the mast going down and up (`films/mast_L.jpg`).
- **check_deploy**: PASS on `world.html` (all three sections) and `boats.html`. **KTX2 check**: PASS (the boats use the
  kit's swatches; no new texture).

## Costs (1280×720, RTX 4070 SUPER, 10:00; seven boats, 18 crew)

| | added by the boats |
|---|---|
| draw calls, all passes (colour, normal, shadow) | +27 at the moorings, +21 from the far bank (one per material per pass for all boats; before batching about +180 for six) |
| triangles, all passes | +88–91k at full detail (38.8k visible at lod 0 for the seven), +65k from the far bank (four at lod 1) |
| GPU / CPU per frame | +0.31–0.39 ms / +0.33–0.39 ms (mostly three drawing 10 batches in 3 passes) |
| boats.js | 0.006 ms per walker step (all poses; two steps a frame), 0.017 ms per frame (parts, ropes, LOD, batch matrices) |
| moving platforms | 0.010 ms per walker update on a deck vs 0.006 on the bank: +0.01 ms a frame |
| download | 1.04 MB for the seven boats at both detail levels (lod 0 + lod 1, about 150 KB a boat), the water tile 22 KB once, the strip about 3 KB of geometry |
| GPU memory | 2.4 MB of batched geometry for six boats at both levels (floats), 13 KB of matrix textures; the water tile R8 0.35 MB once |
| colliders | 1,510 triangles for seven boats (deck, roof, rims, plank, bridges, end walls), 88 KB in JS |

A big section like S2 (16–20 boats) adds about 3 MB of download and some 250k triangles over all passes at full
detail, but only ~30 draw calls: the triangles, not the draws, are its budget item. Far boats at lod 1 cut a third.

## S4b's real map (landed 09:57)

- The pipeline runs on it untouched: `export_web_scene.mjs outer_road_2 --boats-only --raw/--out <scratch>` built and
  shipped its six boats (983 KB, every node kept); its river is a strip of 182 triangles at the measured H −0.7 with 71
  shore-wall pieces; on the page (a scratch section from its layout, removed afterwards) the five painted crew stand
  on their boats' decks and roof.
- **For the S4b area agent:** with no `build_choices.json` `boats` yet, the kit's real sizes overlap in 10 pairs (up
  to 4.5 m) in a basin about 15 m across, and one hull lies on the bank (scratchpad `shots_s4b/`). `kind_of` reads
  `boat_small_cabin_15182` as passenger ("cabin") and `boat_arched_awning_14945` as small ("awning"), where types.md
  reads small and grain; `boat_round_mat_15025` defaults to passenger. Each boat needs its `kind`, an `lw` (0.6 of the
  type at the least) and, beyond that, moves outward, as recorded choices.

## Lessons and pitfalls

- **Blender's glTF export flips V** (v → 1 − v). A second UV set that carries data (the strip's shore flag) arrives
  inverted; `water_mesh` writes 1 − v. The ground's blend weight is in u, which is why it never showed.
- **GLTFLoader sanitizes node names** (`boat:S4b.veh.x` → `boatS4bvehx`): find nodes by `parser.associations` and the
  raw `parser.json.nodes[i].name`.
- **Read a node's world matrix before removing it from its parent**: my first colliders, taken after removal, sat at
  the origin and every boat "touched" everything.
- **MeshBVH reorders the index**: keep per-triangle data by the original triangle (`index[3i] / 3` on a non-indexed
  build), and a `MovingBVH` must hand the walker's callback a three-mesh-bvh `ExtendedTriangle`
  (`closestPointToSegment`), not a THREE.Triangle.
- **A ray shared between two raycasting layers is a trap**: the wrapper transformed the caller's ray in place.
- **Boarding needs more than dropping rails**: the rafted boats' rim pieces don't line up (open the facing piece
  too), a bridge must start at each end's own deck height (the sheer gave a 0.22 m lip), a run of bridges needs end
  walls, and shore walls must open only inside the contact's footprint, in pieces narrower than a walker (0.5 m).
- **Corridors wider than the walker:** a 0.56 m plank between rails jams a 0.6 m capsule; the walkable plank is 0.84 m.
- **Ground friction must not touch walking.** Taking every ground-like push straight up stopped the creep but also
  (a) after the step retry it kept the move into the wall and climbed a 2.1 m plinth in 0.35 m steps, and (b) made
  walking up a flight full speed, which changed every timed walk (the gate's "up the lower flight" ended on the tower
  floor). Now it acts only when standing still, on ground under 40°, before the step logic.
- **Kit clashes found on the page** (for the boat kit's owner): the grain boat's sweep bar lies over its own crew house
  (its crew would stand inside the house; the test builds R with `cabin: false`); `_oars` places oars at 0.35–0.7 of the
  hull, under the awnings of a grain boat and the cabin of a passenger boat, so rowers are hidden there (the test rows a
  small open boat).
- **three only re-uploads a shared material's uniforms when the material changes**: a per-boat uniform on one shared
  material doesn't work. The wet ring's ripples are the water's own lines in world space instead, so a moving boat's
  ripples stream past it at its speed for free.
- **Batched meshes need the batching matrix for world positions** in custom shaders (`#ifdef USE_BATCHING`,
  `modelMatrix * batchingMatrix * ...`); surface.js's tone wash on boats now drifts with the boat's frame (harmless).
- **Boats must step with the walker**, not in the page's tick: walk_page drives `player.update` in a synchronous loop.
- **The water lines tile ships as R8** (0.35 MB on the GPU with mips, exact): as small as a KTX2 copy on a desktop
  (BC7, 8 bits a pixel) without block artifacts on thin lines. It lives in `assets/water/`, outside the KTX2 tool's
  folders.

## Proposed skill text

### `web-scene`, the atomic scripts table

Replace the **Ship** row's last sentence ("No boats GLB yet ...") with:

> When the section's layout lists boats (vehicles with a `boat_` slug), it also builds them through the boat kit
> (`blender/build_boats.py`, in a Blender slot, when the layout, `build_choices.json` or the kit changed) and ships
> `web/public/assets/<name>_boats.glb` (both detail levels) and `assets/<name>/boats.json`, checking that every
> boat's nodes, pivots and extras survived the optimize step. `--src`, `--raw`, `--out` (a set piece measured outside
> `web/`), `--data`, `--no-boats`, `--boats-only`.

Add rows:

> | Water | `kit_boats.water_strip(water, frame, map_id, layout=L, seams=(...))`, `water_mesh(bpy, strips, coll=)`; `web/src/water.js` | One flat strip per reach at the frame's water H between its mapped shores, run on under the mist, stopped on seams, 150–250 triangles; invisible shore walls `edge:shore` in 0.5 m pieces. The page shades it opaque and lit by the hour, with the painted current lines (one 512 px R8 tile for the world, 22 KB) drifting downstream at 0.25 m/s and darkening it by at most 0.3, fading at the shores and past 45–90 m, and a pale band along the shore; the kit's wet ring round each hull is a pale fading ribbon. No reflection, refraction, waves or extra pass. |
> | Boats (page) | `web/src/boats.js` (hooks in world.js, people.js, player.js, scroll_hud.js) | A section's boats load and unload with it, drawn in one BatchedMesh per material. Moored boats ride; boats painted under way go out along their heading and back with their sweep, oars, mast and ropes working; decks carry the walker; rails stand except where a boat touches a bank, stair, jetty, gangplank foot or another boat (bridges, end walls, shore walls opened there); crew on `boat deck/roof:` figures stand on their boat; lod 1 beyond 36 m. people.json `boats` for motion, crew work, trackers and the tow line. Test page `web/boats.html` (`gen/boats/page_test/`: walks.json, shots.json). |

### `web-scene`, "Boats and water"

Add:

> - **The page side** (the boats-page round, `gen/expand/boats_page_lessons.md`): see the Boats (page) and Water rows.
>   The section builder calls `water_strip` before its buckets become meshes and `water_mesh` after, and records the
>   strip's triangles under its water entity; boats need nothing in the builder: their kit options are
>   `build_choices.json` `boats` (`kind`, `lw` down to 0.6 of the type, `hold`, `sweep`, `oars`, `mast`, `tow_to`,
>   `gangplank` at the bank's edge, `moor`, ...), their crew are ordinary figures, and people.json `boats` says how
>   each boat moves and who works what.
> - **Walk every boarding** in walks.json: from the bank or stair onto each boat that touches it, across each rafted
>   pair, against a rail, up and down each gangplank, and back ashore. Start walks on a bank (walk_page raycasts the
>   start from 40 m up: on a deck it lands on a roof or canopy).
> - **Ground friction** (player.js): standing still, nobody creeps down a slope or a rocking deck; walking is as before
>   (`player.friction = false` for A/B).

### `scroll-section`, the playbook (area agents with water)

> Boats: write `build_choices.json` `boats` before the first export: every boat's `kind` (don't trust the slug), its
> `lw` where the real size overlaps its painted neighbours or the bank (0.6 of the type at the least, then moves
> outward), and what the map can't say (sweep side, oars, mast, gangplank foot at the bank's edge, mooring posts by
> ID). Crew: figures with `boat deck/roof:` support need nothing more; give `people.json` `boats.<slug>` for a boat
> under way (its run, its sweep or oar crew, its trackers and tow line).

### `deploy-web`

> `check_deploy.mjs` now loads every section (`?window=all`) and fails on any section that doesn't come in. The deploy
> includes the test pages (`boats.html` with `assets/boats_test*`, about 1.2 MB, like `creatures.html`).

## Left, and questions for the lead

1. **The HUD's boat dot is untested on real data**: it needs an exported, indexed section with a boat under way (S3's
   sweep boat, S2's towed boat). The code path is small (`scroll_hud.js` nearby(): a dot and a line, no box).
2. **The boat kit's clashes** (above: sweep bar over the crew house, oars under awnings and cabins) are the boat kit
   owner's; the page places crew where the kit puts the bar and grips.
3. **`tools/budget_check.mjs`** doesn't count `<name>_boats.glb` yet (download, triangles): a small additive change for
   its owner. S2's boats will be its largest triangle item.
4. **`tools/walk_page.mjs`** could take an optional start H (`start: [X, D, H]`, ray from H + 1.5) so walks can start on
   a deck under a canopy or roof.
5. **Bridges are flat quads through the bulwark**: a walker's legs pass through the bulwark for one step when boarding.
   A two-part bridge over the gunwale would need each boat's gunwale height on the page (the kit could export it).
6. **Contacts across a seam** (a boat in one section touching a bank or boat in the next) aren't looked for: none is
   painted so far.
7. **A boat under way touches only at its painted spot.** A ferry that touches at both ends of its run would need a
   contact at the far end too (none painted).
8. **The wet ring's bow wave** (wider at the bow of a boat under way) shows while the boat waits too; fading it needs a
   per-boat value the shared material can't carry (or a second ring material for boats under way).
