# Round 2 mapping: the rules every agent follows

**Workflow finished 2026-10-12 ~11:40** (run `wf_59c016e2-059`). Its general lessons were merged into the skill `scroll-section`; this file stays as the record of round 2's brief and the lead's notes.

The lead's brief for the mapping workflow (2026-10-12). One workflow maps five areas at once: S4b (u 12600–15500,
the outer road east and the moorings: the boats-and-water pilot), S3 (15500–20500, the Rainbow Bridge), S2
(20500–29050, the canal), S1 (29050–37610, the countryside) and S7 (815–2000, the scroll's end). Each agent has one
role on one area; the workflow passes it its area, its range and what the earlier steps returned. Read the section for
your role below, plus "Everyone".

## Everyone

- Project: `/home/ran/3d_director/qingming`. Read `qingming/CLAUDE.md`. How to map is the skill `scroll-section`,
  "Mapping a section" (`/home/ran/3d_director/.claude/skills/scroll-section/SKILL.md`): every lesson in it applies.
  The format is `map/README.md`; **new this round:** lettered keys (`S4b`), **Boats** (after the points table) and
  support `H_profile` (an arched deck).
- **Positions come from the strokes:** points on the scan in px, read at zoom 2–3 with the grid. The restyle helps read
  faded silk; never record a thing because the restyle shows it. Faint things that change the cast or the build are
  recorded with `conf: low` and both readings in the note.
- **Phase 0 decisions** (the lead's, final; `gen/expand/round2/phase0_questions.md` has the evidence): the key `S4b`
  for S4 part 2 (folder `outer_road_2`); boats are vehicles with the boat points; one water level for the 汴河,
  measured on S4b's moorings; every new frame starts from its neighbour's knot at the seam; the S1|S2 seam is u 29050;
  the Rainbow Bridge's deck takes an `H_profile`; the folders are in `map/sections.json`; the seams and who owns the
  straddlers are in `map/index.md`, "Seams".
- **The area brief** is `gen/expand/round2/brief_<folder>.md` (S7 `city_end`, S4b `outer_road_2`; the setup agent
  writes S3 `rainbow_bridge`, S2 `canal`, S1 `countryside` from `tile_plan_S1_S2_S3.md`). The tile brief is
  `gen/map/<S>/brief.md`.
- **Write only the files your role names.** Never edit the tools, `map/README.md`, `map/BUILDING.md`, `map/index.md`,
  `map/sections.json`, the skills, another area's files, or the finished sections S4, S5, S6 (their map files,
  `merge_fixes.mjs`, `sections/`, builders). A change you need there goes in your report, for the lead.
- **Scripts, crops and scratch files** go in your own folder,
  `/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/<S>_<role>/`. Up to 14
  agents run at once, and generic names collide.
- Don't start, stop or reload dev servers, and don't touch `web/`.
- **Lessons:** what you learned that the next round should know goes in your report file, as exact text for the
  skill. The needs agent merges them.
- Your final answer is the structured result the workflow asks for; long text goes in your report file.

## setup (one per area)

1. **S3, S2, S1 only:** write the area brief `gen/expand/round2/brief_<folder>.md` in the form of
   `brief_outer_road_2.md`, from `tile_plan_S1_S2_S3.md` and `reference/scroll/sections.md` §2 (the S2 and S1 ranges
   now meet at u 29050: S2 gains a tile `t12` 28700–29050 for the 望楼饭铺 shed's east end and its customers).
2. **Restyle** (skill, "Adding a section"): `sections/<folder>/section.json`, a copy of
   `sections/outer_road/section.json` with the title and the rect (the brief's rect; for S2 and S1 widen or move it so
   it covers the area plus 150 px each side, multiples of 16, overview at most 4096 on its long edge). Run
   `node tools/scroll_pipeline.mjs <folder> all` in the background (lower `--jobs` to 2 if the tool takes it: five
   areas restyle at once) and write the tile brief meanwhile.
3. **Tile brief** `gen/map/<S>/brief.md`, from `gen/map/S6/brief.md` and `gen/map/S4/brief.md` (the filled-in ones),
   for this area: the units, their ranges, the scholars' hints, the seam entities and their owners, the supports, who
   records the in-between kinds, the validator, the boat convention where there is water.
4. When the restyle is done, **read its check sheets** and list where it invents (moved, added or dropped things), by
   u range. Write `sections/<folder>/notes.md`.
5. **Units:** confirm the planned units the workflow gives you. Split a unit only where the density needs it (about
   600 px of ownership where dense, 800–1000 where open, at most about 40 figures per agent). Return the final list.
   If the image API fails, say so and go on without the restyle (the units read the scan at zoom 3).

## tile (land, by range)

Map everything on land whose main point is in your range: figures, animals, carts and sedans, trees, props (stalls,
awnings and parasols on their own poles, signboards on posts, loose wheels, buckets, benches). Look 150 px past both
ends. Nothing on the water or on a boat (the river agent's); buildings, structures, roads and ground features are the
structures agents' (plaques, writing, lamps and pole frames fixed to a building are part of it). Count crowds head by
head at zoom 3. Write `gen/map/<S>/parts/<unit>.json` only.

Validator: `node tools/scroll_map.mjs <S> check --parts gen/map/<S>/parts/<unit>.json` PASS; the overlay of your range
at zoom 1 with grid 50 and zoom-2/3 windows over the dense parts; every marker sits on its thing.

Report `gen/map/<S>/reports/<unit>.md`: counts per kind; what was hard to read; the seam notes by the neighbour's IDs;
the list of painted things you saw and **left to** another agent; lessons.

## structures (buildings, structures, roads, ground)

Every building (footprint corners, eave/ridge/top points, bays, the writing and boards on it, copied as painted with □
for the unreadable), structure (walls, fences, stairs, platforms, bridges other than the Rainbow Bridge), road
(`lines` with `centre`, `edge_n`, `edge_s`; the owner named in the brief records `<S>.road.main` for the whole area,
the others only side streets), and ground feature (banks, mounds, field edges, the threshing floor: `grd`). Footprints
seen only as roofs get placeholder corners, said in the note. Also: **a receding-edge table** of ground-level edges
(furniture, ditches, decks, a wall's foot; eaves only when nothing at ground level recedes, and say so) for the dx
knots, and **the diminution** (figure heights against their foot v) where the brief asks. The road's datum point must
be the exact point the frame names (`map/frames/<S>.json`, `datum`; for S3, S2 and S1 the seam point of the east
neighbour's road). Write `gen/map/<S>/parts/<unit>.json`; report as a tile does.

## river (everything on or in the water)

The water (`water` entities with `shore_n` and `shore_s` lines that stop where the silk's edge cuts them), the banks
(`grd` with `bank_top`), landing stairs and jetties (structures), every boat (`map/README.md`, Boats: `front` and
`rear` at the waterline, `beam_n`/`beam_s`, `bow_top`/`stern_top`, `mast`/`mast_top`, `pose`, `facing_deg`, the type,
cabin, rig, sweep, cargo and what it is rafted or moored to in `what`, the scale cue in `note`), and everything on a
boat: the crew are figures with `support: boat deck: <boat id>` (or `boat roof:`), each boat and its crew a group.
Ropes and planks are part of their boat; a far end names what it reaches by ID (a tracker on the bank is a tile's
figure: name the tile in your report). Mooring posts on the bank are props (yours if they stand in the water's edge).

**S4b's river agent measures the 汴河's water level:** two stroke points where the bank meets the water at a vertical
face or a stair (the waterline and a point straight above it on ground level), giving H of the surface below the
ground; write the derivation in the report. It sets every boat and crew position (1 m of H moves them 1.5 m), so
measure it at two or three places and give the spread. S3's and S2's river agents report their own reading only as a
check against S4b's. Also give the shore points at your area's seams. Write `gen/map/<S>/parts/<unit>.json`; report as
a tile does.

## bridge (S3 only: the Rainbow Bridge)

`S3.str.rainbow_bridge` whole: abutments, the arch and its ribs, the deck's two edges, the railings, both ramps and
their feet. **The deck's height profile:** pairs of points along the deck (the deck edge, and the ground or the
waterline straight below it at the abutments and under the arch where it can be read), enough to give H at about
every 100 px of u; put them in the report as a table `[u, H]` with the derivation, so the frame agent can write the
support `bridge deck` with an `H_profile`. Stalls on the deck are the tiles' props, the figures on it the tiles'
figures (`support: bridge deck`), the boat under it and its crew the river agent's. Write `gen/map/S3/parts/bridge.json`;
report as a tile does.

## merge (one per area)

Skill, "Mapping a section" step 2: `node tools/scroll_map.mjs <S> merge`; the cross-tile fixes in
`gen/map/<S>/merge_fixes.mjs` (seam duplicates in disguise, the "left to" lists compared, supports normalised to the
frame's keys, groups listing only their own section's IDs, every `what` and `note` searched for painted things without
an entity); `check` PASS. **Cross-key seam check** against a finished neighbour (S4b against `map/strokes/S4.json`
within u 12450–12750; S7 against `map/strokes/S6.json` within 1850–2150): the same kind under 30 px apart is either a
seam note or a retired entity. The seams between two new areas are checked at the frame step. Write
`gen/map/<S>/merge_notes.md`. Then propose the second-pass ranges: one fresh agent per about 2000–2500 px (S7: one over
the whole area; S4b: west 12600–14000 and east 14000–15500).

## second pass (fresh eyes, by range)

Read the merged map against the scroll: overlays of `map/strokes/<S>.json` over your range at zoom 1, then zoom 2–3
where it is dense or faint. Find what is missing, misread, duplicated, on the wrong stroke, or named only in another
entity's note (S4's second pass found a child named only in its carrier's `what`, a bird named only in a tree's note,
two ox heads one ox too far west and a gate column 25 px off). Write proposals only, to
`gen/map/<S>/second_pass/<id>.json` (the form of `gen/map/S4/second_pass/`), never to the parts or the map.

## frame (one per area, in order along the scroll)

1. Accept or decline each second-pass proposal in `merge_fixes.mjs` with its reason; merge; `check` PASS.
2. **The frame** `map/frames/<S>.json` (`map/README.md`, Frames, "One world across sections"):
   - S4b and S7 have a seed: fill the datum's point reference, and keep the seam knot.
   - **S4b:** write the river agent's measured water level into `supports.water` with its derivation. Report the nearest
     ground knot to the seam; if it is outside 31.6 ± 5, still finish, but say so first in your result: the lead
     decides between a ramp inside S4b and re-knotting S4 part 1 (never edit S4's files).
   - **S3, S2, S1:** seed it from the east neighbour the workflow names: S5's origin and scales, the neighbour's dx at
     the seam as the seam knot, the datum on the neighbour's route point at the seam with its station (its
     `map/world/<E>.json` route and `sections/<folder>/layout.json`), and `supports.water` copied from
     `map/frames/S4b.json`. Then the cross-key seam check against the neighbour's strokes within 300 px of the seam.
   - **S3's deck:** the support `bridge deck` gets the bridge agent's `H_profile`; on `S3.str.rainbow_bridge` name the
     deck lines with `support_by` (abutment and arch-foot corners stay on the ground or the water), and give
     `S3.road.main` a `support_ranges` entry for the u range where it runs on the deck (`map/README.md`, supports; added
     2026-10-12). Check in `map/world/S3.json` that the deck lines' `lines_H` rise and fall as painted.
   - Knots from ground-level receding edges (group by area, each group's mean a knot, about ±5 px/m scatter; check
     against mapped walls). Supports from two stroke points each (S3: `bridge deck` with the bridge agent's
     `H_profile`). Real-size `checks`, and `questions` for what the strokes can't settle.
3. `node tools/scroll_map.mjs <S> all`; read the full overlay, one dense window at zoom 1 and `gen/map/<S>/plan.jpg`.
4. `node tools/map_layout.mjs <S>`; check that its `painted_area` corners meet the east neighbour's at the seam.
5. Return the west seam for the next area: the route's point at the west seam (scan u, v), its station, and the dx
   there.

## needs (one per area)

1. `gen/expand/<folder>_needs.md`, prose, one line per item, for the lead's catalogue agent (the area brief's Run 1
   step 4): casting from the 22 existing characters first (`characters/notes.md`); a new character only when none fits,
   with its model figure's map ID and a crop path; the actions the clips can't show; every animal with its tack and
   load; every vehicle; every boat (type, hull length and beam as mapped, cabin, mast, sweep, cargo, crew, rafted to
   what); carried props; the kit parts `song_kit.py` lacks; the set pieces (the Rainbow Bridge, 十千脚店's 彩楼欢门
   scaffold, the 望火楼, a thatched farmhouse, the threshing floor); the tree forms by count (`trees/types.md`).
2. Merge every unit's lessons into `gen/expand/<folder>_lessons.md` (exact text for the skills).
3. The Run 1 report `gen/expand/round2/<folder>_run1_report.md`: counts per kind (boats separately); the frame (knots,
   any deviation, the water level); what was hard to read; the seam notes by the neighbours' IDs; the needs in brief;
   anything that contradicts `reference/scroll/sections.md`. Update `sections/<folder>/notes.md`.

## The lead's notes by area (added while the workflow runs; read yours before you start)

- **S4b, merge and frame:** S4b's biggest rafted boat (stern ≈ 14880) does not end at ≈ 15450. Its hull and cabin roof
  run on to a bow at about (15790, 670–755), and a long sweep blade reaches (15856, 893) (S3's t1 agent). By its main
  point it is S4b's. If the river agent's part stops short at 15650, extend the boat in `merge_fixes.mjs` from a zoom-3
  read of 15600–15900 (front at the true bow, the sweep as part of the boat), and say so in the merge notes. S3's
  river_w does not record it.
- **S3, merge:** eight of S3's units (river_w, river_e, structures_w, structures_e, t1–t4) were rerun outside the
  workflow after a login interruption; their part files and reports are in the usual places, and the workflow's
  result for them is empty. Merge them like the others. The support `upper floor: riverside hall` (t1, t2) must become
  structures_w's ID for the hall (or 十千脚店's if the hall is its upper storey).
- **All river areas, which end is the bow** (from S3's river_w): the scroll's boats carry the big sweep (大橹) and the
  rudder at the **stern**. The end with the rudder is `rear`, and the other end is `front`. Use the sweep where the
  rudder is hidden, unless the boat also shows side sweeps. Where a part file has it the other way round (S4b's
  biggest rafted boat: its sweep is at the east end its brief called the bow), the merge swaps `front` and `rear` and
  `facing_deg` in `merge_fixes.mjs`, and says so. A boat recorded with both readings in its note is settled the same
  way.
- **S3, the route west of the tavern door** (structures_w): no road is painted west of u ≈ 17300. **The lead's call:
  reading (c)**, the riverside road behind the tavern, which follows S4b's open ground at the seam and stays on the silk.
  Reading (b), the street the tavern faces, would run below the silk's edge with a hidden turn of about 12 m, outside the
  painted area. The hidden stretch is `est`. The merge sets point 0 to S4b's road point at u 15500. The deck stretch
  is the bridge agent's centre line. The last point is exactly (20500, 258) for S2's datum. Where the route is hidden,
  the builder lays only what the walkable area needs, as a recorded choice.
- **S3/S2, the receding direction:** S3's ground edges near the tavern slope −1.0 to −1.12 (dx ≈ 46–51 px/m) against
  S4b's seam knot of 31.6. Keep the seam knot and add S3's measured knots; the drift between them is the painter's,
  which is what knots are for.
- **S3/S2, the far bank and the north-bank strip** are painted small (figures at 0.72 of the road's size at v ≈ 810,
  0.4 at v ≈ 305, 0.22–0.35 at v ≈ 120–160), so at the frame's one depth rate the north-bank strip near u 20000–20500
  is only 1.6–2.3 m deep. **Keep the one-scale frame** (the user's rule 5, `map/BUILDING.md`); don't change the depth
  rate. Report each strip's depth and the diminution table in the frame result. Room to walk is settled at build time
  as recorded moves and choices (`build_choices.json`).
- **S2 | S3 at u 20500, the dark-trunked bare tree at the bottom** (base u ≈ 20488–20566, centre ≈ 20527): by its main
  point it is **S2's**. S3's merge retires `S3.tree.dark_trunk_bare_20525` (t9) as a seam note naming S2's tree, and
  S2's t1 keeps it. The big willow (trunk ≈ 20545–20590) and the buildings east of the dark tree are S2's too.
  `S3.bld.open_shop_20000` stays S3's. S3's route east of the bridge's north foot runs through the tavern's open front
  (20050–20400; the land there is only the tavern's front, and the water begins at v ≈ 290–300).
- **S2 | S3 at u 20500, boats** (S3's river_e): the north-bank boat (hull ≈ 20350–21030, bow read at the east end
  ≈ 21025, a big woven bundle of cargo) is **S2's** by its main point, with all six of its crew, even the two standing
  west of 20500. S2's river_w maps it whole; if S2 reads its bow at the west end, it stays S2's (main point ≈ 20690) and
  S2 says so in its report. The boat moored along the south bank (hull ≈ 19750–20637) is **S3's**, with its four crew.
  S2's merge checks that neither boat was recorded twice. Shore points at u 20500 from S3: north (20500, 310) est,
  south (20500, 1235) est.
- **S3, frame: the bridge deck** (from the Rainbow Bridge kit, `blender/kit_rainbow_bridge.py`,
  `gen/set_pieces/rainbow_bridge/study.md`). The deck recedes across the picture, so a u-keyed profile puts the whole
  south ramp, sedan included, at H 0. Give the support `bridge deck` an **`H_profile_X`** (`[X, H]` in world X; the
  tool solves it with each point's depth, `map/README.md`). Build it from the kit's own height table: `python3
  blender/kit_rainbow_bridge.py table <layout.json> <frame.json>` gives stations with X, D and H. Then check the deck
  figures' H in `map/world/S3.json`. In `merge_fixes.mjs`, turn the bridge agent's `arch_intrados_e` point list into a
  line role `rib_e` (its first and last points are the springings at the water), because `world` keeps lines and drops
  custom point lists. Keep the deck edges `deck_e`/`deck_w` as lines on `support_by: bridge deck`. The kit warns that
  with dx 31.6 the deck is a parallelogram skewed 37°: measure S3's knots at the bridge from ground-level edges (about
  30–33 there, per structures_e).
