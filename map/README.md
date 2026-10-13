# The scroll map

This is the one record of where everything in 清明上河图 is: every building, wall, road, bridge, tree, person, animal,
cart and prop, each with its position measured from the painted strokes. Scenes, people and section subagents
read positions from here and nowhere else. **Read the text map (`text/<S>.md`) instead of looking at the scroll.**
Look at the scroll only when adding to the map.

The map exists because positions read "at a glance" went wrong (2026-10-11): one scale fitted on one structure was
stretched over a whole section, the gate and trees were placed by eye, and nothing said which numbers were
measured and which were guessed.

## Layers

| Layer | File | Written by | What it holds |
|---|---|---|---|
| Strokes | `strokes/<S>.json` | people and agents, by measuring the scan | what the painting shows, in scan pixels; never reinterpreted |
| Frames | `frames/<S>.json` | `tools/scroll_map.mjs fit`, plus stated assumptions | how picture points become ground metres, with anchors, assumptions and residuals |
| World | `world/<S>.json` | `scroll_map.mjs world` only, never by hand | every entity in metres, with route station and side |
| Text | `text/<S>.md` | `scroll_map.mjs text` only, never by hand | the section in words: landmarks, a walk in scroll order, every entity with its neighbours |
| Index | `index.md` | by hand | sections, their scan ranges, datums, seams and map status |

Review images (overlays on the scan, the top-down plan) go to `gen/map/<S>/`. They are for checking only.

How a section's map becomes a scene, and how the scene is checked against it one for one, is `BUILDING.md`.

## Coordinates

**Scan pixels** `[u, v]`: `reference/scroll/qingming_commons_38414x1800.jpg`, u to the right, v down. Every stroke
point is in full-scan pixels.

**World axes** (the whole scroll uses them): the painting looks north. Picture right is **east** (+X, toward the
scroll's start, out of the city in S5). Depth, up the silk, is **north** (+D). Up is +H. The viewer stands south.
`facing_deg`: 0 = east (right), 90 = north (away from the viewer), 180 = west (left), 270 = south (toward the viewer).

**Route station.** Each section has a route (`road` or `water` entity with `"route": true`) and a datum entity. A
point's station is metres along the route from the datum, + toward the east. Its side is metres north (+) or south
(−) of the route's centre line. "Station +13.8, 1.9 m S" is how the text map says where something is.

## Strokes: entities

`strokes/<S>.json` = `{ "section": "S5", "entities": [ ... ] }`. One entity:

```json
{
  "id": "S5.fig.bridge_porter",
  "kind": "figure",
  "name": "porter with shoulder-pole baskets",
  "what": "Two round baskets on a pole over his right shoulder, trousers rolled; walking west onto the bridge.",
  "pts": { "foot": [8350, 1450], "head": [8320, 1285] },
  "support": "bridge deck",
  "pose": "walking",
  "facing_deg": 180,
  "group": "S5.grp.bridge_traffic",
  "vis": "full",
  "conf": "high",
  "src": "余辉: 桥头观水 (setting)",
  "note": ""
}
```

**IDs** are `<S>.<kind code>.<slug>`. Kind codes: `fig` figure, `ani` animal, `veh` vehicle, `tree`, `prop`,
`bld` building, `str` structure (wall, gate block, bridge, stair, ramp, platform, fence), `road`, `water`, `grd`
ground feature (bank, mound, field edge), `grp` group. Slugs are lowercase_snake and say what the thing is. IDs
never change once written. Other files refer to them. `<S>` is the section's key in `sections.json`: `S<n>`, or `S<n>` plus a letter for a later part
built under its own key (`S4b`, u 12600–15500, after S4 part 1).

**Points** are `[u, v]` when measured on visible strokes, `[u, v, "est"]` when estimated (a foot hidden behind a
rail, a corner behind a tree). Record **where things touch the ground**, not boxes: in this oblique view a point's
height on the silk mixes depth and height, so only ground contacts (and points straight above them) can be mapped.

| kind | required `pts` | optional |
|---|---|---|
| figure | `foot` (between the feet, on the support), `head` (top of head or hat) | |
| animal | `fore`, `hind` (ground under the front and hind hooves), `head` | |
| vehicle | `front`, `rear` (ground under the front and rear ends) | `wheels`: list of wheel ground contacts |
| tree | `base` (trunk foot) | `top` (crown top), `crown_w`, `crown_e` (crown's west and east extremes) |
| prop | `base` | |
| building, structure | `base`: named footprint corners `sw`, `se`, `ne`, `nw` (front = south, left = west), or a `line` | heights: `<corner>_eave`, `<corner>_ridge`, `<corner>_top` straight above a base corner; `bays`: base points along the front where columns stand |
| road, water, grd | `line`: a polyline of ground points, with `role` (`centre`, `edge_n`, `edge_s`, `shore`, `bank_top`) | several lines as `lines: {role: [...]}`; a solid ground feature (a mound of earth and rock) takes `base` corners and `<corner>_top` like a structure |
| group | none: `members` list of IDs | |

**Boats** (round 2, 2026-10-12) are vehicles (`veh`, slug `boat_…`). `front` and `rear` are the waterline under the
stem and the sternpost (`est` where a rafted neighbour or the bank hides them). Optional: `beam_n` and `beam_s` (the
waterline at the hull's widest), `bow_top` and `stern_top` (the gunwale straight above front and rear), `mast` and
`mast_top`. `support: water`; `pose`: moored, rowed, poled, towed, sailing, drifting, lowering mast; `facing_deg` is the
way the bow points. Mast, rig, cabin, oars and sweep, ropes, gangplank and cargo are part of the boat (a rope's or a
plank's far end names what it reaches, by ID); posts and stakes on the bank are props. People on a boat are figures
with `support: boat deck: <boat id>` (or `boat roof: <boat id>`); the frame gives each deck's H from the gunwale and the
waterline below it. Each boat and its crew form a group. A river reach is a `water` entity with `shore_n` and
`shore_s` lines (a line stops where the silk's edge cuts it); its banks are `grd` with `bank_top`; landing stairs and
jetties are structures. The river's surface is the frame support `water`: one H along the whole 汴河, measured once on
S4b's moorings and reused by S3, S2 and S1 unless one of them reports a different reading with its evidence. Whoever
maps the water (a river agent) also maps every boat and everything on it; tile agents map the land, trackers included.

Other fields:
- `support`: what the thing stands on: `ground`, `bridge deck`, `office floor`, `tower floor`, `wall top`, `bank
  slope`, `water`, `boat deck: <id>`, `boat roof: <id>`. Heights for supports live in the frame file: one `H`, or, for a
  surface that rises and falls along the scroll (the Rainbow Bridge's arched deck), an `H_profile` of `[u, H]` pairs in
  increasing u; `world` reads it at each point's own u, linear between the pairs and flat beyond the ends. For a
  surface that recedes across the picture (the same world X sits at different u on its near and far edges), give
  `H_profile_X`, `[X, H]` pairs in increasing world X, which `world` solves together with each point's depth. An entity
  whose parts stand on different supports names them: `support_by: {"<point name or line role>": "<support>"}` (the
  bridge's `deck_n` line on `bridge deck`, its abutment corners on the ground), and `support_ranges: [{"u": [a, b],
  "support": "<support>"}]` for the points whose u falls in a range (the route's centre line where it crosses the deck).
  The world file then gives each off-ground line's point heights as `lines_H`.
- `pose` (figures): standing, walking, running, seated, leaning, kneeling, squatting, crouching, riding, carrying,
  lying; (animals) also galloping.
- `facing_deg`: as above. For buildings, the side the front opens to.
- `vis`: `full`, `part: <what hides it>`, or `faded`. `conf`: how sure the identification is (`high`, `med`, `low`).
- `src`: the scholarship tag (`reference/scroll/sections.md`), e.g. `余辉: 城下修面`.
- `what`: one or two sentences of what the strokes show (dress, action, load, species, state). This is what the
  text map says about the entity, so make it worth reading without the picture.

## Frames

`frames/<S>.json` holds one or more local oblique mappings, `u = ou + ax·X + dx·D`, `v = ov + ay·X + dy·D − h·H`.
Each frame lists the scan range it covers, the anchors it was fitted on (entity points with assumed real sizes),
the assumptions in words, and the residuals of independent checks (real-size structures that weren't used in the
fit). A handscroll's viewpoint shifts along its length, so a frame is local: fit each on structures inside its
range and keep the residuals. Support heights (`tower floor` = 10 m, and so on) are listed with how they were
found.

**One world across sections (set 2026-10-11, when S4 and S6 joined S5).** Built sections share one coordinate
system, so a point on a seam is the same metres in both sections, the walls between sections can come down, and the
route's stations run on:
- Every section's frame keeps S5's origin (the moat bridge's south-west deck corner, scan 8248, 1565), its 77 px per
  metre across the street and in height, and its 51.25 px of v per metre of depth.
- Only the receding direction (`dx_knots`) drifts, and along the whole scroll it is **one knot list**. A section's
  frame holds the knots measured inside its range plus its neighbour's value at each seam: S4 starts with
  `[9400, 32.125]`, S6 ends with `[5600, 58.24]` (S5's values there). Knots are listed in increasing u.
- When a neighbour adds knots past a seam, the lead copies them into the frames of the sections whose entities
  reach across that seam (an S5 cart whose front is in S4 is placed with S4's drift).
- The datum carries a `station`: the station at the datum point, taken from the neighbouring section's route where
  the two routes meet (S4 +26.05, S6 −26.51). S5's datum is station 0.
- A mapping agent that finds that the depth rate or the across-street scale must change in its section reports it to
  the lead with the evidence (real-size checks) before using it. Nothing else about the frame changes per section.

## Rules

1. Nothing goes into a scene without an entity in the map. Builders, `scene.json` and `people.json` take positions
   from `world/<S>.json` by ID.
2. A number is measured (a stroke point), derived (by the tool), or assumed (written in the frame file, with a
   reason). There is no fourth kind.
3. Picture facts and world readings stay separate. Changing a frame changes the world and the text, never the strokes.
4. After any edit to the strokes, run `node tools/scroll_map.mjs <S> all` and read the overlay before using the result.
5. When the painting is ambiguous, say so in `note` and `conf`. Don't resolve it silently in a builder.
6. Every painted thing is its own entity. If a note mentions something painted ("a stall canopy leans against its west
   end"), that thing gets an entry too: the scene builds only what the map lists (`BUILDING.md`).
7. An entity that turns out to be misread is retired, not edited into something else: drop it in
   `gen/map/<S>/merge_fixes.mjs` with the reason, and add the right entity with a new ID (S5: the "south wing"
   `S5.str.wing_south` became the mound `S5.grd.rock_mound_7200`; the unpainted `S5.str.wing_north` was dropped).

## Workflow (skill: `scroll-section`, "Mapping a section")

1. Cut the section into tiles and have one agent per tile inventory it into `gen/map/<S>/parts/<tile>.json`
   (zooms: `tools/scroll_inspect.mjs`; self-check: `scroll_map.mjs <S> overlay --parts <file>`). One more agent
   records the structures, roads and water for the whole section.
2. `scroll_map.mjs <S> merge` joins the parts into `strokes/<S>.json` and flags near-duplicates in the overlaps.
3. `fit`, `world`, `text`, `plan`, `check` (or `all`). Read the overlay and the plan.
4. A second pass looks for anything missed.
