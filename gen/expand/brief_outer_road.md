# Brief: East: the outer road, part 1 (S4, `sections/outer_road`)

You are one of two area agents expanding the 清明上河图 web world, a first-person walkable reconstruction of the
scroll (`/home/ran/3d_director/qingming`). The gate scene (S5) is done and agreed. You build the area on one side of
it, the other agent builds the other side, and the lead joins the three. You follow one standard, written down, so
that the joined world reads as one.

The user's words: "we will expand and add 2 more areas by 2 parallel agents working together"; "we need to set up the
standards first and have this uniform language that all these parallel workers can just speak together"; about the
painting: "absolutely loyal to the original painting… replicate exactly what the painting has, even to the amount of
trees"; and today: "I want high quality work". The quality bar is Messenger (messenger.abeto.co). The standard is
`map/BUILDING.md`; you follow it as written. A change to it needs the user: report it, don't make it.

## Your area

- **S4, scan u 9400–12600** (look about 150 px past both ends: u 9250–12750). The silk runs v 0–1790.
- **What scholars say is painted here** (`reference/scroll/sections.md` §2): the two three-ox covered carts and the rider coming the other way (牛拉大盖车, ≈ 9300–10550); the temple with its shut gate and the monk entering by the side door (清净的寺庙, ≈ 9750–10300, top of the silk); the 递铺 courier post (懒兵候主, ≈ 11250–12100): a red studded gate with a posted notice and a small bridge in front, nine soldiers sitting or lying on document boxes, their spears and banners propped against the wall, a white horse lying in the courtyard; the fortune-teller beside the official compound (临街神算, signs 神课·看命·决疑, ≈ 12050–12400).
- **Seams:** S5 at u 9400 (west); the outer edge is the rest of S4 (u 12600–15500: the palm-covered family carts, the wheelwright, the crowd round the seated man, the moorings), which stays painting (a backdrop panel) for now.
- **Build folder:** `sections/outer_road`. Builder: `blender/outer_road_scene.py`.

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`;
- `map/README.md` (the language of positions; read "Frames" → "One world across sections" closely) and
  `map/BUILDING.md` (the language of building);
- `map/index.md` (seams) and `map/text/S5.md` (what a finished section map reads like);
- the skills in `/home/ran/3d_director/.claude/skills/`: `scroll-section` (restyle + "Mapping a section"),
  `web-scene`, `characters`. Work through their atomic scripts; don't re-invent a workflow that exists;
- `sections/gate/notes.md` from "Mapped from the strokes" on: what the gate taught, and what the user rejected;
- `gen/map/S5/brief.md` (the tile agents' brief: how to measure) and `gen/map/S5/merge_fixes.mjs` (how fixes are kept).

## What you own (edit only these)

- `map/strokes/S4.json`, `map/frames/S4.json` (a seed is there: keep its origin, scales and seam knot),
  `map/world/S4.json`, `map/text/S4.md`, and `gen/map/S4/` (brief, look crops, parts, merge fixes, overlays);
- `sections/outer_road/` (section.json, notes.md, layout.json via the tool, build_choices.json, people.json, walks.json,
  shots.json, scene.json, backdrop.json, placed.json via the builder) and `gen/sections/outer_road/`;
- `blender/outer_road_scene.py`, and `blender/kit_outer_road.py` for new kit parts (generic functions that take positions
  from the caller; the lead moves them into `song_kit.py` afterwards);
- `prompts/backdrop_outer_road_*.txt`;
- `gen/expand/outer_road_*.md` (your needs list and reports).

**Everything else is shared and belongs to the lead or the workshop agent:** `song_kit.py`, `street_b1.py`,
`gate_scene.py`, every page module in `web/`, `tools/`, S5's map files, `map/README.md`, `map/BUILDING.md`,
`map/index.md`, the skills, `characters/`, `animals/`, `blender/kit_vehicles.py` (the workshop's vehicle kit) and
the assets in `web/public/assets/` other than your own section's. If you need a change in one of them, work around
it and write the request in your report. Never edit S5's files: anything you learn about an S5 entity is a seam note
in your report.

## Seams with S5

The S5 entities that straddle a seam stay S5's and the gate builder builds them. You map the rest of such a thing as
a note on the same ID (in your report, for the lead to apply) and do not build it again. What `map/index.md` says
your section owns is yours.

- `S5.veh.covered_ox_cart_9800`: the big covered ox cart's rear stands on the bridgehead (S5) and its front, oxen
  and driver are in S4 (u 9775–9960). The cart stays S5's (the gate builder builds it, harness included). You map its
  oxen and driver as S4 entities (their main points are in S4) and say in their `what`/`note` that they draw
  `S5.veh.covered_ox_cart_9800`; give the cart's front, wheels and shafts as a seam note for the lead, on that ID.
- `S5.bld.house_9300` continues east past the seam; map the rest of it as a seam note on that ID (don't add an S4
  building for the same house). The bridge's north-east corner (est, u 9455) is hidden by the cart.
- S4 owns: the gnarled tree at u ≈ 9445, the tree whose trunk is near u 9600, the mat awning and parasol stall
  (u 9355–9600), the figures at u 9497, 9620, 9650, 9700 and beyond.

## The frame

Your frame continues S5's (`map/README.md`, Frames, "One world across sections"): same origin, 77 px/m across the
street and in height, 51.25 px of v per metre of depth. Only the receding direction drifts: measure it on your
section's receding edges (building sides, walls, carts' shafts) and add `dx_knots`; your list starts with [9400, 32.125] (S5's value at
the seam). The datum is where your main road crosses the S5 seam, at station +26.05; make your road's centre line
meet S5's road end there (S5: centre at scan (5600, 1250) west / (9400, 1370) east; edges in `map/strokes/S5.json`).
If your real-size checks (railings, doors, wheel diameters, a well's cover) say the depth rate or the across-street
scale is wrong here, report it with the evidence before using anything else.

## Run 1 (now): restyle, map, layout, needs. Then report and stop.

1. **Restyle** (skill `scroll-section`, "Adding a section"): write `sections/outer_road/section.json` (copy the gate's;
   rect over u 9250–12750 clipped to multiples of 16, height 1792), run `node tools/scroll_pipeline.mjs outer_road all`,
   read the check sheets, write `sections/outer_road/notes.md`. The registered mosaic is what `tools/scroll_inspect.mjs`
   reads faded silk with, and what new characters are cropped from. Positions still come from the strokes.
2. **Map** (skill `scroll-section`, "Mapping a section"). Write `gen/map/S4/brief.md` from S5's, filled in for
   your section. Tiles about 800 px of ownership, each looking 150 px past both ends, plus one pass for the
   structures, roads and water of the whole area. If your tools let you start subagents, give each tile its own
   (the method that worked on S5); otherwise map the tiles yourself, one after the other, with the same care.
   - Record every painted thing: figures, animals, vehicles, trees, props, buildings, structures, roads, water,
     ground features, groups. Small, far, half-hidden things count. Count the painted figures in every crowd; the
     storyteller's listeners, the soldiers and the bearers are individuals.
   - Things named only in another entity's note get missed (S5's canopy): when merging, search every `what` and
     `note` for painted things without an entity of their own, and add them.
   - Retire, don't rewrite (`merge_fixes.mjs`).
   - Signboards and their characters go in `what` exactly as painted (these are the scroll's shop names).
   - `node tools/scroll_map.mjs S4 all`. Read the full overlay, a dense window at zoom 1, and `plan.jpg`. A second
     pass looks for anything missed.
3. **Layout:** `node tools/map_layout.mjs S4` → `sections/outer_road/layout.json`. Check its `painted_area` meets S5's
   along the seam (S5's corners are in `sections/gate/layout.json`).
4. **Needs list** → `gen/expand/outer_road_needs.md`, in prose with one line per item. The workshop agent makes animals,
   vehicles and new characters for both areas and the gate, from your list:
   - **Casting:** for every figure, the existing character that fits (`characters/notes.md`: official, inspector,
     carter, camel_driver, sightseer, idler, porter, townsman), or a request for a new one. Request a new character
     when none of the 8 fits the figure's dress, age or sex (women, children, monks, soldiers, sedan bearers, the
     storyteller, a butcher…): name the scroll figure that should be its model (map ID and a crop in scan px around
     it, as `characters/<name>.json` has), what it wears, and which figures it would play. Group requests: one new
     character can play many figures of a type. The user does not mind the cost; make the cast right.
   - **Actions:** what each kind of figure is painted doing that the existing clips can't show (sitting on a box,
     lying, carrying a sedan, telling a story with a fan, drawing water…). One line each.
   - **Animals:** every painted animal: species, pose (standing, walking, lying, grazing), tack and load, who
     rides or leads it, map ID.
   - **Vehicles:** every painted vehicle: type, wheels, body, roof, load, team and harness, the size the map gives
     (length, wheel contacts), map ID.
   - **Props carried by figures** (poles, baskets, boxes, umbrellas, fans).
   - **Kit parts** your buildings will need that `song_kit.py` lacks (the 彩楼欢门, a well cover, signboards, lamp
     boxes, a studded gate…), as a list.
5. **Report** (your final message): the map's counts per kind; the frame (knots, any deviation); what was hard to
   read; the seam notes for S5 entities (by S5 ID); the inner seam (what crosses it); the needs list's summary
   (how many new characters, animals, vehicles); and anything that contradicts `sections.md`. Then stop: the lead
   reads both reports, starts the workshop on the needs, and sends you Run 2.

## Run 2 (later, when the lead sends it): build, people, backdrop, check

So you know where this goes:
- **Build** `blender/outer_road_scene.py` the way `gate_scene.py` is written: `derive()` from the layout, every piece
  inside `sb.entity(<map id>)`, `choice:` for every size the strokes can't give, nothing that isn't in the map,
  one wall per side of the walkable area (`edge:south|east|north|west`). Built headless with
  `tools/build_scene.sh outer_road` (never in the live GUI, which is the lead's). `node tools/loyalty_check.mjs S4`
  must PASS. Vehicles come from the workshop's kit; animals are `people.json` `animals`.
- **People** (`sections/outer_road/people.json`): every painted figure at its spot, the painted walkers and carriers on
  short paths, `scale` for children, `nudge` only with a reason, no traffic; animals at their spots; riders `ride`.
- **Backdrop:** a panel only beyond your outer edge; mist where the scroll paints nothing (`tools/backdrop.mjs`).
- **Check alone** on the world page (`world.html?sections=outer_road`) and next to the gate: shots, walks, people.
  The lead benches.

## How to work

- Images only through `tools/shyfai_image.py`; 3D only through hosted Meshy (the workshop does that).
- Never cheap geometry, never anything unpainted (`map/BUILDING.md`).
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
