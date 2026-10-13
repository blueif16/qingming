# Brief: the countryside (S1, `sections/countryside`)

You are one of the area agents in round 2 of the 清明上河图 web world, a first-person, walkable reconstruction of the
scroll (`/home/ran/3d_director/qingming`). Three sections are built and joined on `web/world.html`: S6 the inner city,
S5 the gate and S4 part 1 the outer road (u 9400–12600). Round 2 maps the rest of the scroll at once: S4b (the outer
road east, to the moorings), S3 (the Rainbow Bridge), S2 (the canal), S1 (the countryside, yours) and S7 (the end).
The lead joins everything. Everyone follows one written standard, so the joined world reads as one.

S1 is where the scroll begins (it is read right to left): mist, bare trees, a stream and a small bridge, a charcoal
donkey train, a threshing floor among thatched farmhouses, the great old willows, a tomb-sweeping party coming home,
and the village tea stalls where the canal's market begins. It is the emptiest section in people and the fullest in
trees and ground. **It is also the pilot for the countryside ground:** the fields, banks, paths, mounds and the stream
are mapped here first as `grd`, `road` and `water` entities, and the user signs off the ground built from them before
the other open stretches are built the same way.

The user's words: "absolutely loyal to the original painting… replicate exactly what the painting has, even to the
amount of trees"; "I want high quality work"; and this round, a parallel subagent workflow "to get everything done
quickly". The quality bar is Messenger (messenger.abeto.co). The standard is `map/BUILDING.md`, and you follow it as
written. A change to it needs the user: report it, don't make it.

## Your area

- **S1, scan u 29050–37610, map key `S1`** (IDs `S1.<kind>.<slug>`; `map/sections.json`). The west seam moved from
  28700 to 29050 in Phase 0, so the 望楼饭铺 shed and its customers stay whole in S2. Look 150 px past the west end
  (u 28900). The east end is the silk's own end at u ≈ 37610 (the mounting and seals lie beyond): there is no east
  neighbour, and nothing past it is recorded. The silk runs v 0–1790.
- **What scholars say is painted here** (`reference/scroll/sections.md` §2, lines 283–294; the 名画记 pins,
  lines 133–138; listed from the scroll's start, east to west):
  - mist, sparse trees and water at the very start, ≈ 35000–37610;
  - a small wooden bridge, ≈ 36100–36500;
  - the charcoal donkey train, 5 donkeys and 2 drivers (赶驴入城), ≈ 36300–36850; pin 1 at u 36550;
  - the threshing floor and thatched farmhouses (寂静的谷场), ≈ 33400–35200; pin 2 at u 34100;
  - the great old willows (隋堤烟柳), ≈ 31000–32600; pin 3 at u 32190;
  - the returning tomb-sweeping party, with willow and flowers on the sedan roof, a rider and porters,
    ≈ 30600–31200; pin 6 杨柳杂花装簇轿顶 at u 30740;
  - travellers on donkeys bundled against the cold (迎寒策蹇/骑驴客商), ≈ 30000–30600, lower half; pin 4 at u 30010;
  - the runaway horse (惊马闯市), with grooms chasing and an old man calling a child away, ≈ 30000–30900, upper half.
    The horse's front half is lost to damage (`sections.md:292–293`);
  - a vegetable field (一片"青铜海", 菜地), pin 5 at u 29900;
  - the village tea and food stalls at the edge of the market, ≈ 28800–29800 (pin 10 城乡交界处 at u 28940 is S2's
    side of the seam).
- **The setup agent's first look** (gridded crops at zoom 0.4–1.2, 2026-10-12; to orient you, the strokes decide):
  - **The west end, u 29050–30300.** Two big willows at u ≈ 29100–29260 (trunks v ≈ 450–700) stand over a stall shed
    with a hatched (thatched?) roof at u ≈ 29250–29820 (front eave v ≈ 540–560), with people seated at a table under it
    (u ≈ 29300–29460, v 545–640). In front of it: a lying water buffalo at u ≈ 29340–29500 (v 650–780), a standing ox
    at u ≈ 29490–29600 (v 600–720), and a barrow lying on its side at u ≈ 29670–29810 (v 630–695), its wheel at the
    east end. Far up, at v 90–300 (u ≈ 29200–29900), long horizontal bank lines (terraced fields or banks) crossed by a diagonal track from about (29600, 100) to (29720, 310), with small figures or animals at u ≈ 29270–29330 and 29430–29500 (v 100–150). A figure walks at
    u ≈ 29175–29240 (v 950–1050). The 菜地 is rows of small plants or brush at u ≈ 29530–30000, v 1070–1380, with
    figures carrying a pole at u ≈ 29800–29880 (v 920–1100) and a small figure at u ≈ 29660 (v 1000–1065). A tiled
    farmhouse with a veranda stands at u ≈ 29980–30400 (v 920–1200). A big willow fills the bottom left, its trunk at
    u ≈ 29000–29210 (v 1490–1780), its base near the silk's bottom edge (est): see the seam below.
  - **The runaway horse**: a faint galloping animal at u ≈ 30075–30240, v 770–850, running west; men with arms out
    run after it at u ≈ 30280–30380 (v 680–780), ≈ 30460–30530 (v 690–760, half behind a willow) and ≈ 30610–30700
    (v 590–680).
  - **The travellers** cross the lower half at v ≈ 1270–1640: a rider on a donkey at u ≈ 30090–30280, a walker with a
    stick at ≈ 30280–30380, a second rider at ≈ 30430–30580, a walker at ≈ 30600–30700, and a figure at
    u ≈ 29980–30030 (v 1300–1470).
  - **The tomb-sweeping party**, high up the silk: the willow-decked sedan at u ≈ 30830–30930 (v 420–570) with its
    bearers, riders at u ≈ 30930–31020 (v 230–350), porters at u ≈ 31030–31150 (v 300–550).
  - **A thatched hut** with a wattle fence at u ≈ 30720–31300 (v 930–1330) and a shed on posts east of it
    (u ≈ 31230–31430, v 1000–1200) with a figure and a table or tub.
  - **The great willows**: huge pollarded trunks at u ≈ 31450–33200, v 900–1650, crowns to the top of the silk; more
    willows along the top at u ≈ 31000–31600 (v 0–300).
  - **The farmhouses**: a row of thatched and tiled roofs at u ≈ 33500–35200, v 600–900, behind and among bare trees
    (u ≈ 33300–35000, crowns from v ≈ 200); a threshing floor with something on it at about u 35000–35200,
    v 800–870 (a stone roller?). The lower half here (v 1000–1700) is ink-wash ground and water: banks, a broad pale
    band, rocks at the bottom (≈ 34600–34900, v 1600–1700).
  - **The start**: bare trees at u ≈ 35400–37500; the donkey train walking west at v ≈ 730–940 between
    u ≈ 36280 and 36820 (loaded donkeys, a donkey with its head turned at ≈ 36640–36690, a driver at ≈ 36780–36820);
    the small bridge just south of it, a flat deck on posts at u ≈ 36200–36650, v 1000–1080; under and west of the
    bridge, at u ≈ 36170–36450, v 1120–1210, the faint outline of **a small empty boat** (a sampan; the restyle reads
    it so too; on water or on the bank?); the stream running west from the bridge across the middle of the silk; broad water or mist below
    (v 1100–1600).
  - **Seals** overlap the silk at about u 37250–37560 (v 50–260, 800–980, 1120–1330, 1600–1740). They are never
    recorded, and nothing under them is guessed.
- **Seams:** S2 at u 29050 (west), mapped at the same time by another agent. No east neighbour.
- **Build folder:** `sections/countryside`. Builder: `blender/countryside_scene.py`.

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`;
- `map/README.md`, the language of positions (read "Frames" → "One world across sections" closely, and "Boats"), and
  `map/BUILDING.md`, the language of building;
- `map/index.md` (status, seams);
- the skills in `/home/ran/3d_director/.claude/skills/`: `scroll-section` (restyle, "Mapping a section" and the
  playbook "Expanding to a new section"), `web-scene` and `characters`. Work through their atomic scripts;
- `trees/types.md` (the tree forms mapped so far: S1 needs new ones, pollarded old willows and bare elms);
- last round's record: `gen/expand/progress.md`, `gen/expand/outer_road_lessons.md`, `gen/map/S4/brief.md` and
  `gen/map/S6/brief.md` (the filled-in tile briefs), `gen/map/S4/merge_notes.md`, `gen/map/S4/merge_fixes.mjs`;
- this round: `gen/expand/round2_progress.md`, `gen/expand/round2/mapping_rules.md`,
  `gen/expand/round2/phase0_questions.md` and `gen/expand/round2/tile_plan_S1_S2_S3.md` (the S1 table and risk 5).

## What you own

| path | owner |
|---|---|
| `map/strokes/S1.json`, `map/frames/S1.json`, `map/world/S1.json`, `map/text/S1.md`, `gen/map/S1/` | you |
| `sections/countryside/` (section.json, notes.md, layout.json via the tool, build_choices.json, people.json, walks, shots, scene.json, backdrop.json, placed.json via the builder), `gen/sections/countryside/` (the restyle halves `west/` and `east/` in both) | you |
| `blender/countryside_scene.py`, `blender/kit_countryside.py` (new parts: generic functions that take positions from the caller) | you |
| `prompts/backdrop_countryside_*.txt`, `gen/expand/countryside_*.md` (needs, lessons, report) | you |
| S2: `map/*/S2.*`, `gen/map/S2/`, `sections/canal/` | S2's area agents (what you learn about an S2 entity is a seam note) |
| `song_kit.py`, `street_b1.py`, `web/src/`, `tools/`, `map/README.md`, `map/BUILDING.md`, `map/index.md`, `map/sections.json`, the skills | the lead |
| `kit_vehicles.py` (the sedan), `characters/`, `animals/`, `trees/` (including `trees/assign/S1.json`), the set-piece kits (a thatched farmhouse, the threshing floor), `blender/kit_boats.py`, panels | the factories: ask through your needs list |

If you need a change in a file you don't own, work around it and put the request in your report.

## The seam with S2 (u 29050)

The main-point rule decides (`map/index.md`, "Seams"): an entity is S1's when its main point (figure foot, animal
fore, vehicle front, tree base, prop base) has u ≥ 29050. Settled in Phase 0:
- the 望楼饭铺 shed (≈ 28250–29000) and its customers are **S2's**, and so is the boat at the bottom
  (≈ 28300–28750). The shed with seated customers at u ≈ 28900–29050 (v 500–700) and the man with a dark animal at
  u ≈ 28930–29000 (v 600–700) are S2's by their main points;
- the village stalls from ≈ 29050 east are **S1's**;
- **the big willow at the bottom left** (trunk u ≈ 29000–29210, base near the silk's edge): its base decides. Read it
  at zoom 3; if the base is at u ≥ 29050 it is S1's (t1), else S2's. Either way, t1's report gives its base, top and
  crown extremes, so the S2 merge can check it;
- **the two willows over the second stall** (trunks u ≈ 29100–29260) are S1's unless a base reads west of 29050.

List everything else that crosses u 29050 (a roof, a path, a tree crown, a group), with its points on both sides.
The merge agent runs the cross-key seam check against S2's strokes within u 28750–29350 once S2 is merged (the seams
between two new areas are checked at the frame step at the latest).

## The frame

Your frame continues S2's (`map/README.md`, Frames, "One world across sections"), and it waits for S2's frame. Tile
mapping doesn't wait: it is in scan px.
- **Seed** (the frame agent, after S2's frame and route exist): S5's origin [8248, 1565], 77 px/m across and in
  height, 51.25 px of v per metre of depth, `covers [28900, 37610]`.
- **Knots.** The knot list **starts** with `[29050, <S2's dx at u 29050>]`. Measure S1's own knots on ground-level
  receding edges: the 菜地's rows, the farmhouses' wall feet and fences, the hut's wattle fence, the threshing floor's
  edges, the bridge's deck and posts, a table or bench at the stalls. Group them west, middle and east. Eaves only
  where nothing at ground level recedes, and say so.
- **Datum.** `S1.road.main:lines.centre.0`, exactly S2's route point at u 29050 (scan u, v from `map/strokes/S2.json`'s
  `S2.road.main`), with S2's station there (`sections/canal/layout.json`, the route stations). If S2's route doesn't
  reach u 29050, or meets S1's road at a different v, report it to the lead with the stroke points before you fit.
- **Supports.** `ground` 0; `water` copied from `map/frames/S4b.json` (the 汴河, if any of it shows in S1); **the
  stream is not the 汴河**: give it its own support (`stream`, H from the bank top and the waterline straight below it
  at the bridge, two stroke points); `small bridge deck` if anyone stands on the bridge; `sedan: <id>`; riders on
  `animal S1.ani.<id>`.
- **The diminution** (figure heights against their foot v) and the real-size checks (a donkey, the bridge's span, a
  farmhouse door) go in the frame's `checks`.

## Run 1 (now): restyle, map, layout, needs. Then report and stop.

1. **Restyle** (skill `scroll-section`, "Adding a section"), **in two halves nested in the folder** (as S2 does with
   `canal/west` and `canal/east`): the whole area (u 28896–37616, the area plus 150 px past the west end and the silk's
   end) is 8720 × 1792, 4.9:1, and the image model letterboxes an overview that wide (the first run, 2026-10-12, asked
   `4096x848` and got `4096x1695` with white bands, so every tile's colour crop was the wrong area: kept, unused, in
   `gen/sections/countryside/runs/r1_full_rect_letterboxed/` with its config). So:
   - `sections/countryside/west/section.json`: `rect [28896, 0, 4496, 1792]` (u 28896–33392), overview `4096x1632`
     (came back 4096 × 1633), 5 × 2 tiles, 11 images;
   - `sections/countryside/east/section.json`: `rect [33120, 0, 4496, 1792]` (u 33120–37616), overview `4096x1632`,
     5 × 2 tiles, 11 images. The halves overlap at u 33120–33392.

   Run `node tools/scroll_pipeline.mjs countryside/west all --jobs 2`, then `countryside/east`, in the background
   while you write the tile brief (never `countryside` alone: there is no whole-area config). Read the check sheets,
   and warn the tile agents where the restyle invents: expect it where the silk is faintest (the ground's wash, the far
   trees, the runaway horse's lost half, the mist and the seals at the start). Write `sections/countryside/notes.md`
   (it covers both halves).
2. **Map** (skill `scroll-section`, "Mapping a section"). Write `gen/map/S1/brief.md` from `gen/map/S4/brief.md` and
   `gen/map/S6/brief.md`, filled in for S1, and give each unit the arguments below. Every agent and subagent keeps its
   scripts and crops in `scratchpad/S1_<unit>/`. Start the two structures agents first: they are the critical path,
   and here the ground is the bulk of the work.

   | unit | owns u | looks at u | density (setup's look) | hints to verify | seam entities, boundary notes |
   |---|---|---|---|---|---|
   | `t1` | 29050–30300 | 28900–30450 | medium, about 20–25 | the village tea and food stalls; the cattle and a donkey at the top (≈ 29400–29800); the 菜地 (pin 5 at 29900) and its workers; the old man calling a child away (惊马闯市: near the farmhouse?); willows | the S2 seam (above); the runaway horse and the travellers on donkeys are t2's (below) |
   | `t2` | 30300–31100 | 29900–31250 | dense for S1, about 20–25 | the tomb-sweeping party (pin 6 at 30740); the travellers on donkeys (pin 4 at 30010); the runaway horse and its chasers | **t2 records two groups whole, wherever their u:** the runaway horse with its chasers (horse ≈ 30075–30240) and the travellers on donkeys (from ≈ 29980) |
   | `t3` | 31100–32100 | 30950–32250 | open, under 10 | 隋堤烟柳, the great old willows; the shed on posts and its figure (≈ 31230–31430) | count every tree, trunk by trunk |
   | `t4` | 32100–33200 | 31950–33350 | open, under 5 | willows; faded open ground (pin 3 at 32190) | |
   | `t5` | 33200–34300 | 33050–34450 | open, under 10 | people at the farmhouses; bare trees (pin 2 at 34100) | |
   | `t6` | 34300–35400 | 34150–35550 | open, under 10 | the farmhouses' people; the threshing floor's roller and tools (props); trees | |
   | `t7` | 35400–36300 | 35250–36450 | open, under 5 | trees; the stream's banks | the donkey train and the possible boat are t8's |
   | `t8` | 36300–37610 | 36150–37610 | open, about 7–10 | the charcoal donkey train (5 donkeys, 2 drivers, pin 1 at 36550); the possible boat by the bridge; the mist; trees | **t8 records the whole donkey train and the possible boat, wherever their u.** The seals are never recorded |
   | `structures_w` | 29050–33000, plus `S1.road.main` west of 33000 | 28900–33150 | the stalls' buildings, the farmhouse (≈ 29980–30400), the hut and its fence (≈ 30720–31300), the shed on posts; the bank lines and the diagonal track at the top (≈ 29200–29900, v 90–300); the 菜地's field; the banks, mounds and paths; any water at the bottom left | the countryside-ground pilot, west half | the S2 seam IDs; `S1.road.main`'s point 0 at the datum |
   | `structures_e` | 33000–37610, plus the road east of 33000 | 32850–37610 | the farmhouses and the threshing floor (≈ 33400–35200), fences, the stream, the small bridge (≈ 36200–36650), the broad water or mist below; banks, mounds, paths | the countryside-ground pilot, east half | the road's east piece is `S1.road.main_east` (below); the seals are never recorded |

   - **The road.** `S1.road.main` (`"route": true`, `lines: {centre, edge_n, edge_s}`, points in increasing u) is the
     country road walked through the section. `structures_w` records it from its point 0 at u 29050 to u 33150;
     `structures_e` records the rest from u 32850 to where it ends (the bridge, or the silk's edge) as a join piece,
     `S1.road.main_east`, which the merge agent splices into `S1.road.main` at u 33000 in `merge_fixes.mjs` (the piece
     never becomes a map entity). Point 0 is S2's route point at u 29050: read it from S2's part or strokes if they
     exist (`S2.road.main`, owned by S2's `structures_w`); if not yet, use your own reading and say so, and the frame
     agent sets it. Other paths and tracks (the sedan party's, the travellers', the donkey train's, a path to the
     farmhouses) are `S1.road.path_<u>`, recorded by the structures agent whose range holds most of each.
   - **The ground (the pilot).** Every bank, terrace edge, mound, field and rock outcrop the strokes show is a `grd`
     entity: a bank or terrace edge as `lines: {bank_top, bank_foot}` (which side is higher in `note`, and its height
     from a figure, tree or post beside it, as px); a field as a `line` of its edge or `base` corners, its rows'
     direction in `note` (the rows are receding edges for the frame); a mound or rock as `base` corners plus
     `<corner>_top`. Ink-wash bands that may be water, mist or bare ground get `conf: low` with both readings. Water
     (the stream, ponds, the broad water at the bottom, if it is water) is a `water` entity with `shore_n` and
     `shore_s` lines that stop where the silk's edge or the mist cuts them.
   - **Who records the in-between kinds.** Stalls, awnings and canopies on their own poles, tables and benches in the
     open, the threshing floor's roller, flails and baskets, carts and barrows, haystacks and straw piles standing
     free, hitching posts, the vegetable rows' frames: the tile agents' props. Buildings (thatched or tiled, sheds on
     posts with roofs), fences, wattle walls, the bridge, the threshing floor's surface, the field, banks and paths:
     the structures agents'. A boat, if there is one, is t8's vehicle with the boat convention (`map/README.md`,
     Boats; no river agent in S1). "If unsure, record it as your prop: a duplicate is easy to drop, a miss is not."
     Every agent ends its report with what it saw and **left to** another agent.
   - **Trees are the bulk of S1.** Every tree is its own entity, counted trunk by trunk: base, top, crown_w, crown_e,
     and in `what` the form (pollarded old willow with a knobbly head, willow with rising shoots, bare elm-like tree
     with twisted branches, sapling, other), the number of trunks, the lean, and whether it is a separate tree or a
     second stem. Far trees at the top of the silk count too.
   - **Supports to use:** `ground`, `sedan: S1.veh.<id>` (someone seated in a sedan), `animal S1.ani.<id>` (riders),
     `carried in arms`, `shoulders`, `carried on back`, `small bridge deck`, `boat deck: <boat id>`, `stream` (a boat
     on the stream), `water` (on the 汴河, if any).
   - **Validator for each unit:** `node tools/scroll_map.mjs S1 check --parts <file>` PASS, then the overlay of its
     range at zoom 1 with grid 50, and zoom-2/3 windows over the dense parts. Every marker must sit on its thing.
   - **Merge:** `node tools/scroll_map.mjs S1 merge`, with cross-tile fixes in `gen/map/S1/merge_fixes.mjs` (the road
     splice first). Then the cross-key seam check against S2 (`map/strokes/S2.json`, u 28750–29350) if S2 is merged,
     else at the frame step. Search every `what` and `note` for painted things without an entity of their own.
   - **Second pass:** two fresh agents, west 29050–32100 and east 32100–37610, writing proposals to
     `gen/map/S1/second_pass/<half>.json`. You accept or decline each one in `merge_fixes.mjs`, with the reason.
   - **Frame and generate:** after S2's frame, seed and knot S1's (above), then `node tools/scroll_map.mjs S1 all`.
     Read the full overlay, one dense window at zoom 1 (u 29900–31300), the farmhouses at zoom 1 and
     `gen/map/S1/plan.jpg`.
3. **Layout:** `node tools/map_layout.mjs S1` → `sections/countryside/layout.json`. Check that its `painted_area`
   meets S2's east corners at the seam (`sections/canal/layout.json`).
4. **Needs list** → `gen/expand/countryside_needs.md`, in prose, one line per item, for the lead's catalogue agent.
   - **Casting:** from the 22 existing characters first (`characters/notes.md`). Ask for a new character only when
     none fits (a charcoal driver, a farmer at the threshing floor, a woman in the sedan, a groom running), naming the
     model figure's map ID and a crop.
   - **Actions:** the ones the clips can't show (driving a donkey train, chasing a bolting horse, carrying a sedan,
     threshing, hoeing).
   - **Animals:** every one, with its tack and load (the charcoal panniers, the riders' saddles, the bolting horse
     painted only in its hind half: built whole or not is a `build_choices` question for the user).
   - **Vehicles:** the willow-decked sedan (a `kit_vehicles` variant?), any cart or barrow, the boat if there is one.
   - **Carried props.**
   - **Set pieces and kit parts:** a thatched farmhouse, the threshing floor and its roller, the small plank bridge,
     wattle fences, the stall awnings, the vegetable field.
   - **Tree forms** by count (`trees/types.md`): pollarded old willows, bare elms, saplings.
   - **The ground** (the pilot): what the builder needs to turn banks, terraces, fields, paths and the stream into
     terrain.
5. **Report** (your final message, and `gen/expand/round2/countryside_run1_report.md`):
   - the counts per kind;
   - the frame: the knots, the seam knot, the datum and its station;
   - what was hard to read;
   - the seam notes by S2 ID;
   - the needs in brief;
   - anything that contradicts `sections.md`.

   Then stop. The lead sends Run 2.

## Run 2 (later, when the lead sends it): build, people, backdrop, check, and the ground pilot

So you know where this goes:
- **Build** `blender/countryside_scene.py` the way `blender/outer_road_scene.py` is written: `derive()` from the
  layout; every piece inside `sb.entity(<map id>)`; `choice:` for every size the strokes can't give; nothing that isn't
  in the map; one invisible wall per side of the walkable area. Your ground stops 0.5 m past the S2 seam and dips
  0.12 m there; at the east, north and south edges it runs 16 m out under the mist. Build headless with
  `tools/build_scene.sh countryside` (at most three headless Blender builds at once across all agents: ask the lead
  for a slot). `node tools/loyalty_check.mjs S1` must PASS.
- **The ground pilot:** terrain from the mapped banks, terraces, fields and paths, broken and irregular as the painting
  draws it (never tiles or straight lines: the user's rule), at real size in its painted place; the stream and its
  banks; shots for the user's sign-off before the other open stretches are built the same way.
- **Never wait for the factories:** cast `stand_in`s, and build against stubs with fixed signatures. Swap when they
  deliver.
- **People** (`sections/countryside/people.json`, generated by a script that knows the kit's real sizes): every
  painted figure at its spot, the painted walkers and riders on short paths, the donkey train walking a short way and
  back, no traffic.
- **Backdrop:** west: S2's strip as a painted panel until S2 is built; east: the silk's start is mist (rule 4); north
  and south: mist.
- **Check alone and joined** with S2 when it is built, on your own preview server (the lead gives you a port).
- **Lessons:** keep them in `gen/expand/countryside_lessons.md`, with the exact text to add to the skills. The
  ground-pilot lessons go first.

## How to work

- Images only through `tools/shyfai_image.py`; 3D only through the factories (hosted Meshy).
- Never cheap geometry, never anything unpainted (`map/BUILDING.md`). Build at real size and place things where they
  are painted (rule 5).
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
- Use subagents, each with its own scratchpad folder, and keep records, not progress reports.
