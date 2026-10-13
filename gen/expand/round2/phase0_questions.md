# Round 2, Phase 0: what the lead decides before the agents start

The prep agent's draft, 2026-10-12. Each item gives the question, a recommendation, and the evidence (paths from
`qingming/`, `file:line` as of today; `web/src/world.js` is being edited by the engine agent, so its lines are given
with the function's name). Nothing here has been changed in any shared file.

## The three decisions that matter most

1. **S4 part 2 gets its own map key, `S4b`** (folder `outer_road_2`, IDs `S4b.<kind>.<slug>`). It needs one regex
   in `tools/scroll_map.mjs` and one `sections.json` entry. Decide this before any part 2 ID is written, because IDs
   never change (§1).
2. **The boat and water convention**: boats are mapped as vehicles with a boat point vocabulary, their crews stand
   on `boat deck: <boat id>`, and the 汴河 has one water level for all river sections. Decide it before the moorings
   are mapped. The `BUILDING.md` rows for boats and water go to the user (§4).
3. **The seam knots stay at the neighbours' values**: `[12600, 31.6]` for S4b and `[2000, 50.4]` for S7, so part 1
   and S6 don't move. S4's receding direction east of u 11420 is an open question, and S4b's agent will measure ground
   edges right at the seam. If they disagree, the lead chooses between a ramp inside S4b and re-knotting part 1 (§3).

---

## 1. S4 part 2: how to map and build it without touching part 1

**Question.** Part 1 owns `map/*/S4.*` and `sections/outer_road`. How is u 12600–15500 mapped and built?

**How the tools use a section key** (all keyed on one `S`):
- `tools/scroll_map.mjs:25–29`: one `SEC` per key, `AREA = SEC.area || SEC.x`, `GEN = gen/map/${S}`. The files are
  `map/strokes/${S}.json` (:40), `map/frames/${S}.json` (:203), `map/world/${S}.json` (:403) and `map/text/${S}.md`
  (:523).
- `scroll_map.mjs:127–151` (`merge`) rewrites `map/strokes/${S}.json` from every file in `gen/map/${S}/parts/`. If
  part 2's tiles went under S4, every merge would rewrite part 1's lead-owned strokes, world and text.
- `scroll_map.mjs:163` (`check`): IDs must match `^S\d\.(fig|…)\.[a-z0-9_]+$`. A key like `S4b` fails it.
- `scroll_map.mjs:186–191`: people.json figures are checked as `${S}.fig.${id}`.
- `tools/map_layout.mjs:13–15, 106`: one `folder` per key, which receives `layout.json`. `section: S` is at :24, tree
  cards come from `trees/assign/${S}.json` (:50), and the painted area comes from `AREA` (:81–84).
- `tools/loyalty_check.mjs:21–28`: it compares the whole of `map/world/${S}.json` with one folder's `placed.json` and
  `people.json`. Two folders under one key would each FAIL on the other's entities.
- `web/src/world.js:327` (`populate`) looks animals up as `${sec.layout.section}.ani.${slug}`, so an entity's ID
  prefix must equal its map key.
- `web/src/world.js:237–249` (`seams`): two sections join where their painted-area corners agree within 5 cm.

**Options.**
- (a) Extend S4's `area` to 15500 and give it a second folder. This needs a parts schema in `sections.json` plus part
  filters in `map_layout`, `loyalty_check` and `scroll_map` (merge, check, text, plan). Every merge would still
  rewrite part 1's map files. It breaks the constraint and is the most work.
- (b) A new key whose IDs keep the prefix `S4.`. This breaks the animals in `world.js:327` and the people check in
  `scroll_map.mjs:190`, and it risks ID clashes with part 1 at the seam.
- (c) **A new key `S4b` with IDs `S4b.…`.** Every tool already keys on `S`. Only the ID regex needs a letter.

**Recommendation: (c).** The changes, all lead-owned:
- `map/sections.json`, a new line after S4:
  `"S4b": {"name": "城门口外 (part 2): the outer road east, to the moorings", "x": [12600, 15500], "folder": "outer_road_2"}`.
  In S4's `area_note` (:6), replace "is a later area" with "is S4b (`outer_road_2`)". S4 keeps `area` [9400, 12600]
  and its `x`. No tool iterates over all keys by `x`, so the overlap is harmless.
- `tools/scroll_map.mjs:163`: `^S\d\.` becomes `^S\d[a-z]?\.`.
- `tools/tree_cards.mjs:361`: the hardcoded `['S4', 'S5', 'S6']` gains `'S4b', 'S7'`. Better, it could read every
  key that has a `folder` from `sections.json`.
- `map/index.md`: an S4b row (build folder, status, datum, route `S4b.road.main`). In the S4 row, "part 1" stays.
- `map/README.md:61` (IDs): one clause, "`<S>` is the section key in `sections.json` (`S4b` = S4 part 2)".
- **S7** needs only `"folder": "city_end"` on its existing line (`map/sections.json:9`) and its index row.

Folder names follow the brief names: `sections/outer_road_2` (builder `blender/outer_road_2_scene.py`, kit
`blender/kit_outer_road_2.py`) and `sections/city_end` (`blender/city_end_scene.py`, `blender/kit_city_end.py`).
`tools/build_scene.sh` derives everything from the folder name.

## 2. Things the tools would trip on

- **Seam duplicates across keys go unseen.** `merge` flags near-duplicates only inside one key
  (`scroll_map.mjs:139–145`). Have each area agent run a cross-key check in its scratchpad: the same kind under 30 px
  apart, between its strokes and the neighbour's within 300 px of the seam (S4b against S4 at 12600, S7 against S6 at
  2000). It should come before the second pass.
- **The old sections' ground runs under the newcomers.** `blender/outer_road_scene.py:200` carries part 1's ground
  16 m past its east edge, and `blender/inner_city_scene.py:154` carries S6's 16 m past its west edge. When S4b and S7
  join, the lead cuts those back to the seam, the way the gate's ground was cut (progress.md:120–121). The new
  sections stop 0.5 m past their seam and dip 0.12 m under the older ground (`outer_road_scene.py:155`).
- **Panels.** The old outer panels (`sections/outer_road/backdrop.json`, east = S4b's strip; `sections/inner_city/
  backdrop.json`, west = S7's strip) drop by themselves when the neighbour is loaded (`web/src/backdrop.js:109`).
  S7's west edge is the scroll's cut end (`reference/scroll/sections.md:104`: the scroll is thought truncated). Nothing
  is painted beyond it, so the recommendation is mist only, with no panel (`map/BUILDING.md:24–26`, rule 4). S4b's east
  panel is S3's strip; the restyle starts at u 15500.
- **`world.html` default.** `web/world.html:26` lists `inner_city,gate,outer_road`. Add `city_end` and `outer_road_2`
  when they join.
- **A figure inside part 1's building.** The seated official at u 12700–12755 sits inside `S4.bld.official_hall_12530`,
  which part 1 built whole: its floor is 0.45 m, a choice (`blender/outer_road_scene.py:675–688`). He is S4b's figure.
  S4b's frame needs the support `official hall floor` with H 0.45, citing that choice.
- **Shore walls survive joins.** `world.js:199` matches edges by `g_edge_<name>_hidden__col` and drops only seam
  sides. A shore wall named `edge:shore` is never dropped, which is right.
- **People stand by raycast from H + 1.2 m** (`web/src/people.js:272`). A crew figure needs a deck collider within
  1.2 m below its frame H, or it drops to the water's floor. The same holds for figures on S3's arched deck (see
  `tile_plan_S1_S2_S3.md`).
- **The restyle config** is a copy of `sections/outer_road/section.json` with a new title and rect (multiples of 16,
  height 1792; skill `scroll-section`, "Adding a section"):
  - S7: `rect [816, 0, 1344, 1792]` (u 816–2160), overview `1344x1792`, 2 × 2 tiles, 5 images. The silk starts at
    u ≈ 815; left of it are the mounting and the seals.
  - S4b: `rect [12448, 0, 3216, 1792]` (u 12448–15664), overview `3216x1792`, 4 × 2 tiles, 9 images.
  - shyfai was out of balance on 2026-10-12 (progress.md:134). `round2_progress.md:9` puts the backlog first, so
    confirm that a call goes through before the restyles start.
- **Trees.** `trees/assign/<S>.json` comes from the tree factory (map_layout reads it, `map_layout.mjs:50`). Say in the
  briefs that the tree factory, not the area, writes `assign/S7.json` and `assign/S4b.json`.

## 3. Frames: the seeds and the datum stations

The rule (`map/README.md:101–114`): keep S5's origin and scales, carry the neighbour's knot at the seam, and take the
datum's station from the neighbour's route.

**S4b** (continues S4 east of 12600):
- `origin [8248, 1565]`, `x [77, 0]`, `d [31.6, -51.25]`, `h 77`, `covers [12450, 15650]`.
- `dx_knots` starts with `[12600, 31.6]`. S4's knots are `[9400, 32.125]`, `[10270, 36]` and `[11420, 31.6]`
  (`map/frames/S4.json:24–37`), constant beyond, so dx(12600) = 31.6.
- Datum: `S4b.road.main:lines.centre.0` at scan **(12600, 1206)**, **station +67.95**. That is S4's centre line
  interpolated between (12500, 1200) and (12750, 1215) (`map/strokes/S4.json`, `S4.road.main`). In S4's frame it is
  X 53.65, D 7.00, and the station is 66.60 + 0.400 × 3.37 along the route (`sections/outer_road/layout.json`, route
  stations 66.6 and 69.97).
- S4's road edges at u 12600: `edge_n` v 972.5 (the official hall's platform front), `edge_s` v 1484 (est).
- Check: the seed puts S4b's west corners at sw (58.32, −4.39) and nw (43.99, 30.54), which are exactly part 1's se
  and ne (`sections/outer_road/layout.json`, `painted_area`).
- **Open: the receding direction at the seam.** S4 keeps 31.6 east of 11420 although its only edges there are high
  and shallow (−0.56 to −0.61, which would mean dx 84–91; `map/frames/S4.json:43` and question :135). S4b's ground
  edges at u 12600–13300 (the palm carts' shafts and bodies, the tables, the wheel lying on the ground) are the first
  ground evidence east of 11420. Recommendation: keep the seam knot at 31.6 and have S4b report its nearest ground
  knot before fitting. If that knot is outside 31.6 ± 5, the lead chooses between:
  - (i) a ramp inside S4b, where part 1 is unchanged;
  - (ii) re-knotting part 1 east of 11420 and rerunning S4 `all`, which moves part 1's far-north things, possibly by
    several metres.
- Supports to seed: `ground` 0; `official hall floor` 0.45 (above); `water` (the river, measured: §4); one
  `boat deck: <id>` per boat with crew.

**S7** (continues S6 west of 2000):
- `origin [8248, 1565]`, `x [77, 0]`, `d [50.4, -51.25]`, `h 77`, `covers [800, 2150]`.
- `dx_knots` ends with `[2000, 50.4]`. S6's knots are `[2950, 50.4]`, `[4170, 54.4]` and `[5600, 58.24]`
  (`map/frames/S6.json:24–37`), constant west of 2950, so dx(2000) = 50.4. S7's measured knots go before it, in
  increasing u.
- Datum: the street's last centre-line point at scan **(2000, 1180)**, **station −73.63**. That is
  `S6.road.main:lines.centre.0`, the first of S6's route stations in `sections/inner_city/layout.json`.
- S6's street edges at u 2000: `edge_n` v 800 (the wall foot of the house behind the well), `edge_s` v 1300 (the 解
  building's north side, which is S7's).
- Check: S7's east corners come out at se (−78.27, −4.39) and ne (−101.13, 30.54), which are S6's sw and nw.
- After S7 lands, the lead copies S7's knots into `map/frames/S6.json`. Only S6 things west of 2000 move: the well
  platform's west end, `S6.bld.far_house_1859`, and the awning's west posts.

S3, S2 and S1 are seeded the same way, in order along the scroll, once their east neighbour's frame and route exist
(see `tile_plan_S1_S2_S3.md`). Tile mapping doesn't wait for frames.

## 4. Boats and water

**What exists.** The kinds are fig, ani, veh, tree, prop, bld, str, road, water, grd and grp (`map/README.md:61–63`;
`tools/scroll_map.mjs:32`). There is no boat kind. Water is a `water` entity with `lines` (`README.md:78`). S5's moat
is two water entities (`S5.water.moat_south_8700`, `S5.water.moat_north_8950`) with support `water`, H −1.5, assumed
(`map/frames/S5.json`, supports). The gate builder lays a flat quad at −1.65 between them (`blender/gate_scene.py:
246–251`) and closes the banks with `edge:moat`. Sizes: S4b has about 5 boats (4 rafted side by side at u
14850–15450, v 120–850, plus one at the top, u 15180–15500), S3 about 8 and S2 about 20; 余辉 counts 28 in all
(`reference/scroll/sections.md:256`).

**Recommendation: boats are vehicles, with a boat vocabulary. This needs no tool change.**
- `vehicle` already requires only `front` and `rear` (`scroll_map.mjs:36`). `world` gives `length_m` from them
  (:353), passes `pose` and `facing_deg` through (:333), and `loyalty_check` builds vehicles as models
  (`loyalty_check.mjs:32`). A boat goes through every tool as it is.
- **The ID** uses the `veh` code with a `boat_` slug: `S4b.veh.boat_grain_15420`.
- **Points:** `front` and `rear` are the waterline under the stem and the sternpost (`est` where a rafted neighbour or
  the bank hides them). Optional custom points: `beam_n` and `beam_s` (the waterline at the hull's widest, far and
  near side), `bow_top` and `stern_top` (the gunwale straight above front and rear: the freeboard), and `mast` (its
  foot on deck) with `mast_top`. Custom names pass `check`, and `world` ignores them (`gen/expand/
  outer_road_lessons.md:71–74`). If the boat kit needs them in metres, there is a small optional change: `world()` also
  converts `beam_n`, `beam_s` and `plank_end` at the entity's support H, beside the `foot`, `fore` and `front` loop at
  `scroll_map.mjs:335`.
- **Fields:**
  - `support: "water"`;
  - `pose` is one of `moored`, `rowed`, `poled`, `towed`, `sailing`, `drifting`, `lowering mast`;
  - `facing_deg` is the bow's heading;
  - `what` gives the type (grain boat, passenger boat with a cabin, small sampan), the hull, cabin, mast and rig,
    sweep (橹) and oars, the cargo, and which boat it is rafted to;
  - `note` gives the SCALE CUE (hull length, a cabin door) and the evidence for the waterline.
- **Parts and props:** mast, rig, cabin, sweep, ropes, gangplank and deck cargo are part of the boat. A rope's or a
  plank's far end names what it reaches by ID: a post, a stake or a tracker. Mooring posts and stakes on the bank are
  props.
- **Crew:** each is a figure with `support: "boat deck: <boat id>"`, or `boat roof: <boat id>` on a cabin roof,
  matched by prefix like `cart bed: <id>` (`scroll_map.mjs:235`). The frame gives each deck's H from two stroke points
  (the gunwale, and the waterline straight below it) added to the water's H. Trackers on a bank are ground figures.
  Each boat and its crew form a group.
- **Water:** each reach is a `water` entity with `lines` `shore_n` and `shore_s` (where water meets land; a line stops
  where the silk's edge cuts it). Banks are `grd` with `bank_top`. Landing stairs and jetties are structures.
- **One water level for the 汴河.** The frame support `water` must be measured once on S4b's moorings, where the bank
  meets the water at a vertical face or a stair (two stroke points), and reused by S3, S2 and S1 unless one of them
  reports a different reading with evidence. It matters: `toWorld` puts D = (v − ov + h·H)/dy (`scroll_map.mjs:217`),
  so 1 m of error in H moves every shore point, boat and crew 1.5 m north or south.
- **Who maps what:** one river agent per river area records the water, the shores, the banks, every boat and
  everything on a boat (crew included). The tile agents record everything on land, including trackers. This keeps a
  boat and its crew with one agent, and the crew can name their boat's ID.

**The smallest addition to `map/README.md`**, after the points table (:79):

> **Boats** are vehicles (`veh`, slug `boat_…`). `front` and `rear` are the waterline under the stem and the
> sternpost (`est` where a rafted neighbour or the bank hides them). Optional: `beam_n` and `beam_s` (the waterline at
> the hull's widest), `bow_top` and `stern_top` (the gunwale above front and rear), `mast` and `mast_top`.
> `support: water`; `pose`: moored, rowed, poled, towed, sailing, drifting, lowering mast; `facing_deg` is the way the
> bow points. Mast, rig, cabin, oars, ropes, gangplank and cargo are part of the boat (a rope's or a plank's far end
> names what it reaches, by ID); posts and stakes on the bank are props. People on a boat are figures with
> `support: boat deck: <boat id>` (or `boat roof: <boat id>`); the frame gives each deck's H from the gunwale and the
> waterline below it. A river reach is a `water` entity with `shore_n` and `shore_s` lines; its banks are `grd` with
> `bank_top`. The river's surface is the frame support `water`, one H along the whole 汴河.

Plus, in the supports list at `README.md:82–83`, the clause "`boat deck: <id>`, `boat roof: <id>`".

**What `map/BUILDING.md` would need (the user's call):**
- **A row in the kinds table** (`BUILDING.md:40–48`): *boat* (a `veh` with a `boat_` slug) is built as a model from
  the boat kit (`blender/kit_boats.py`, the boat factory, like `kit_vehicles.py`). That means the hull, a deck that is
  a collider so the crew stand on it (`people.js:272`), cabin, mast and rig as painted (lowered where it is painted
  lowered), the sweep and oars, ropes to their painted ends, and the cargo. The builder places it from `layout.json`.
- **The water row**: a water plane at the frame's `water` H between the mapped shores; the banks between `shore` and
  `bank_top`; the painted ripple lines as the water material's own pattern (`surface.js`), not geometry; invisible
  walls along every shore (`edge:shore`).
- **Boats painted under way.** Recommended: static, standing where painted with the crew acting in place, like the
  carts (`gen/expand/brief_workshop.md:54`, "Static: carts stand where they are painted"). The alternative is to let
  them drift a short way and back like painted walkers (BUILDING.md:59–61). That would need the page to move hull and
  crew together, through a `boats` block in people.json. The user picks.
- **Real size for boats** (rule 5, `BUILDING.md:27–33`). The moorings lie at v 120–850, where things are painted at
  about 0.55–0.9 of the road's scale. Proposed: real-size hulls of their type, centred on the painted waterline
  midpoint and turned to the painted heading; rafted boats keep their painted order and gaps; where a real hull would
  overlap its painted neighbour or the bank, it is shortened, never shrunk in height (as buildings are narrowed).
- **Walkable or not**: whether boat decks, jetties and the far bank can be walked on. This is the lead's pilot on
  S4b's moorings (`round2_progress.md:25–26`), signed off by the user before S3 and S2 build.
- **Beyond the silk**: the river leaving the top edge (S4b, `sections.md:49`) and S2's water running off the bottom
  edge are mist (rule 4), with only the 16 m mist apron of water plane.

## 5. Seams with neighbours mapped at the same time

S3 may be mapped in parallel with S4b (`round2_progress.md:19`). The main-point rule (`map/index.md:37–39`) decides
most things. The straddlers at u 15500 are named now, so neither side builds them twice:
- the long riverside hall with lattice windows and a railed veranda (roof from u ≈ 15530, to ≈ 16450): **S3's**;
- the biggest rafted boat (stern ≈ 14880, bow ≈ 15450, v 450–850): **S4b's**;
- the willow whose trunk is at u ≈ 15450–15500 (v 1000–1400), its crown over the hall: **S4b's**, with a seam note
  for S3;
- the boat under way at u ≈ 15550–15900 (v 300–550) with its crew: **S3's** (名画记 pin 25 河边泊船 (纤夫), 15690,
  `sections.md:157`);
- the river (one water level) runs across the seam. Each side maps its own reach and ends its shore lines at u 15500.
  The S4b river agent gives its shore points at u 15500 to the lead for S3.

## 6. Ownership for round 2 (for the briefs)

The ownership is last round's (skill `scroll-section`, "Who owns what"). Applied:
- **S7 area agent:** `map/strokes|frames|world|text/S7.*`, `gen/map/S7/`, `sections/city_end/`,
  `gen/sections/city_end/`, `blender/city_end_scene.py`, `blender/kit_city_end.py`, `prompts/backdrop_city_end_*.txt`
  and `gen/expand/city_end_*.md`.
- **S4b area agent:** the same with `S4b` / `outer_road_2`.
- **Factories** (`round2_progress.md:22–23`): the boats get `blender/kit_boats.py` and `gen/boats/`; vehicles stay in
  `kit_vehicles.py`; characters and animals go to the workshop; the trees get `trees/`, including the new assign files;
  the set pieces (the Rainbow Bridge, 十千脚店's scaffold, the 望火楼) get their own kit modules; the panels go to the
  backdrop factory.
- **Only the lead:** part 1's and S6's map files, `merge_fixes.mjs`, `sections/outer_road/`, `sections/inner_city/`,
  their builders and kits, `song_kit.py`, `street_b1.py`, the page, the tools, `map/README.md`, `BUILDING.md`,
  `index.md`, `sections.json` and the skills.
- **The needs** go to the one catalogue agent (`round2_progress.md:21`), not straight to a workshop.
