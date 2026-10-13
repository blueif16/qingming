# Brief: the outer road, part 2, to the moorings (S4b, `sections/outer_road_2`)

You are one of the area agents in round 2 of the 清明上河图 web world, a first-person, walkable reconstruction of the
scroll (`/home/ran/3d_director/qingming`). Three sections are built and joined on `web/world.html`: S6 the inner city,
S5 the gate and S4 part 1 the outer road (u 9400–12600). You build the rest of S4, east of part 1, up to the river.
Other agents are mapping the rest of the scroll at the same time, and the lead joins everything. Everyone follows one
written standard, so the joined world reads as one.

Your area is also **the pilot for boats and water.** The river, the moorings and the boats are mapped and built here
first, and the user signs them off before the Rainbow Bridge (S3) and the canal (S2) are built the same way.

The user's words: "absolutely loyal to the original painting… replicate exactly what the painting has, even to the
amount of trees"; "I want high quality work"; and this round, a parallel subagent workflow "to get everything done
quickly". The quality bar is Messenger (messenger.abeto.co). The standard is `map/BUILDING.md`, and you follow it as
written. A change to it needs the user: report it, don't make it.

## Your area

- **S4 part 2, scan u 12600–15500, map key `S4b`** (IDs `S4b.<kind>.<slug>`; `map/sections.json`, decided in Phase 0).
  Look about 150 px past both ends, u 12450–15650. The silk runs v 0–1790.
- **What scholars say is painted here** (`reference/scroll/sections.md` §2, lines 323–328; the 名画记 pins,
  lines 157–159; 余辉's vignettes, line 62):
  - two big palm-covered family carts (豪车云集/大棕盖车, ≈ 12700–13550; pin 27 大棕盖车, u 13120);
  - a crowd around a seated man under an awning (≈ 13100–13450). Its identity has not been checked. Hansen's plates
    17–18 name "the wheelwright, storyteller and fortune-teller" (`sections.md:212`);
  - 张安治's first crossroads, the wheelwright repairing a wheel (车铺劳作, ≈ 13550–13750; pin 26 大车修理店,
    u 13620; crossroads ≈ 13100–13600, `sections.md:100–101`);
  - riverside moorings, with the river leaving the top of the frame (≈ 14400–15700; the river leaves the top at
    ≈ 14500–15000, `sections.md:49`). Pin 25 河边泊船 (纤夫) is at u 15690, just past your end: S3's;
  - 余辉's 2014 list runs 欢楼美禄, 客家登船, 小铺闲坐, 车铺劳作, 豪车云集. 小铺闲坐 (sitting in a small shop) and
    客家登船 (guests boarding a boat) should therefore lie between the wheelwright and the bridgehead tavern, probably
    the tea house and the moorings. Verify them; they are hints, not facts.
- **The lead's first look,** to orient you (the strokes decide):
  - **The road** comes in at the seam with its centre at about v 1206. It runs east between the two palm-covered carts,
    through open ground at u 13500–14000 (v 1000–1150), and then, it seems, along the south side of the tea house
    toward the big roofs.
  - **North side, west:**
    - under the official hall (part 1's building) and a long roof at u 12600–13350 (v 800–1050), open shops with
      tables, people seated and standing, and a signboard at u ≈ 13050;
    - the first palm-covered cart at u ≈ 12650–13050 (v 950–1200; wheel about (12850, 1150)). No team shows; read
      which way it faces;
    - a dark-roofed sedan chair with a lattice body beside it (u ≈ 12980–13100, v 960–1150).
  - **The crowd:** about 15–20 people at u ≈ 13100–13450 (v 350–700), round a man under the east end of a big sloping
    roof (u ≈ 12900–13300). A horse with a saddle, men and donkeys stand at u ≈ 13300–13550 (v 850–1000).
  - **The wheelwright** (u ≈ 13550–13750, v 650–800): men at a big wheel lying on the ground. Nearby are a pole frame
    with a hanging basket (u ≈ 13650–13700, v 450–650) and a shed with timber (u ≈ 13700–14000, v 650–950).
  - **The top of the silk** (u ≈ 13000–14700, v 0–450): a street with shops, a stall, mules or donkeys at
    u ≈ 13550–13750, and people.
  - **South side:**
    - the second palm-covered cart (u ≈ 12900–13300, v 1270–1600; wheel about (13200, 1640)), drawn east by oxen
      (u ≈ 13250–13550, v 1180–1500) with a driver;
    - people with bundles round its rear, and a horse at u ≈ 12750–12900 (v 1650–1800);
    - open shops at the bottom (u ≈ 12600–13000, v 1450–1800);
    - then a long row of big tiled roofs (u ≈ 13300–15600, v 1150–1800).
  - **East:**
    - big trees (u ≈ 13800–14350);
    - the tea house, an open hall with seated customers (u ≈ 14300–14900, v 850–1200);
    - the bank rising to the river, with a path and a few people on it (u ≈ 14500–14900, v 330–900);
    - the river at the top right (u ≈ 14400–15650, v 0–900), coming in from beyond the silk's top edge.
  - **The moorings:**
    - four boats rafted side by side, sterns to the bank at u ≈ 14850–14950, bows east to u ≈ 15250–15450, stacked
      up the silk (about v 120–270, 230–330, 330–450 and 450–850, the biggest at the bottom);
    - one more boat at the top (u ≈ 15180–15500, v 50–150);
    - lines running east from the rafted boats (u ≈ 15100–15450, v 350–450): where they end is yours to read;
    - a few crew on deck;
    - willows on the bank at u ≈ 15150–15550 (v 850–1300).
- **Seams:** S4 part 1 at u 12600 (west). S3, the Rainbow Bridge, at u 15500 (east), which may be mapped by another
  agent at the same time.
- **Build folder:** `sections/outer_road_2`. Builder: `blender/outer_road_2_scene.py`.

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`;
- `map/README.md`, the language of positions (read "Frames" → "One world across sections" closely, and the boat and
  water convention the lead adds from Phase 0), and `map/BUILDING.md`, the language of building;
- `map/index.md` (status, seams) and `map/text/S4.md`, your neighbour, especially its east end;
- the skills in `/home/ran/3d_director/.claude/skills/`: `scroll-section` (restyle, "Mapping a section" and the
  playbook "Expanding to a new section"), `web-scene` and `characters`. Work through their atomic scripts;
- last round's record:
  - `gen/expand/progress.md`;
  - `gen/expand/outer_road_lessons.md`;
  - `gen/map/S4/brief.md`, the filled-in tile brief you copy;
  - `gen/map/S4/merge_notes.md` and `gen/map/S4/merge_fixes.mjs`;
  - `sections/outer_road/notes.md`;
- this round: `gen/expand/round2_progress.md` and `gen/expand/round2/phase0_questions.md` (§4 boats and water, §5 the
  seam at 15500).

## What you own

| path | owner |
|---|---|
| `map/strokes/S4b.json`, `map/frames/S4b.json` (a seed is there: keep its origin, scales and seam knot), `map/world/S4b.json`, `map/text/S4b.md`, `gen/map/S4b/` | you |
| `sections/outer_road_2/` (section.json, notes.md, layout.json via the tool, build_choices.json, people.json, walks, shots, scene.json, backdrop.json, placed.json via the builder), `gen/sections/outer_road_2/` | you |
| `blender/outer_road_2_scene.py`, `blender/kit_outer_road_2.py` (new parts: generic functions that take positions from the caller) | you |
| `prompts/backdrop_outer_road_2_*.txt`, `gen/expand/outer_road_2_*.md` (needs, lessons, report) | you |
| S4 part 1: `map/*/S4.*`, `gen/map/S4/` (its `merge_fixes.mjs` too), `sections/outer_road/`, `blender/outer_road_scene.py`, `blender/kit_outer_road.py` (import it, don't edit it) | the lead (finished: what you learn about an S4 entity is a seam note) |
| `song_kit.py`, `street_b1.py`, `web/src/`, `tools/`, `map/README.md`, `map/BUILDING.md`, `map/index.md`, `map/sections.json`, the skills | the lead |
| the boat kit `blender/kit_boats.py` and `gen/boats/` | the boat factory (you build against its fixed signatures, or a stub of them) |
| `kit_vehicles.py` (the palm-covered carts), `characters/`, `animals/`, `trees/` (including `trees/assign/S4b.json`), panels | the factories: ask through your needs list |

If you need a change in a file you don't own, work around it and put the request in your report.

## Seams with S4 part 1 (u 12600)

Entities that straddle the seam stay S4's, and part 1's builder builds them. You map the rest of such a thing as a note
on the same ID, in your report. Don't build it again.

- **`S4.road.main`** continues east. Its centre line at u 12600 is scan (12600, 1206), est (interpolated between part
  1's (12500, 1200) and (12750, 1215)): that point is your datum. At u 12600 its `edge_n` is v 972.5 (the official
  hall's platform front) and its `edge_s` is v 1484 (est: the hidden north walls of the south halls). Part 1's line
  runs on to u 12750, but yours starts at 12600.
- **`S4.bld.official_hall_12530`** is part 1's, built whole to its est east end (u ≈ 12960–13000) with floor 0.45 m
  and eave 2.8 (`blender/outer_road_scene.py:675–688`). Don't record the hall. What is inside or in front of it east of
  12600 is yours:
  - the seated official at u 12700–12755 (v 853–916), on support `official hall floor` (H 0.45, from part 1's builder
    choice; it is in your frame seed);
  - the figure by the stair.

  Give the hall's true east end, posts and railing as a seam note on its ID. A lamp hanging from the hall is part of the
  hall (a seam note). A lamp on its own pole is your prop.
- **`S4.bld.south_hall_12350`** is part 1's (a placeholder footprint to u 12850; open-front columns at 12540 and
  12695). Yours:
  - the table the child reaches to (top u 12599–12683, v 1638–1642, legs to v ≈ 1705);
  - the barrel or drum at u 12650–12700 (v 1680–1790);
  - the next roof east of u 12700.
- **`S4.prop.parasol_12572`** is part 1's (its canopy reaches 12635). The small figure under it is yours if its foot is
  east of 12600.
- **`S4.tree.willow_12588`** is part 1's (crown to 12750). Its note says the whips at 12600–12750 may belong to further
  trees: record another tree only if its own trunk shows.
- **`S4.fig.child_at_table_12597`** and **`S4.prop.slatted_crate_12576`** are part 1's.
- **Yours, listed by part 1 as not yet mapped** (`map/index.md:28–31`): the seated official, a small boy, a big jar, a
  figure by the stair, a small figure under the parasol, the table and a drum at 12600–12700, a hanging lamp, roofs
  behind the pines, and the palm-covered cart's roof at 12690–12920.

## The seam with S3 (u 15500)

These are settled in Phase 0 (`phase0_questions.md` §5):
- the long riverside hall (roof from u ≈ 15530) is **S3's**;
- the biggest rafted boat (bow ≈ 15450) is **yours**;
- the willow whose trunk stands at u ≈ 15450–15500 is **yours**, with a seam note for S3;
- the boat under way at u ≈ 15550–15900 with its crew is **S3's**.

The river runs across the seam: map your reach of it, end its shore lines at u 15500, and give their points there in
your report. List everything else that crosses u 15500, with its points on both sides.

## The frame

Your frame continues S4's (`map/README.md`, Frames, "One world across sections"): origin [8248, 1565], 77 px/m across
the street and in height, 51.25 px of v per metre of depth, `covers [12450, 15650]`. Only the receding direction drifts.

- **Knots.** Your knot list **starts** with `[12600, 31.6]`, part 1's value at the seam (constant east of its last knot
  `[11420, 31.6]`, `map/frames/S4.json:24–37`). Measure your own knots on ground-level receding edges: the carts'
  shafts and bodies, tables and benches, the wheel lying on the ground, a step's side. Group them west, middle and east.
- **Report the nearest knot first.** Part 1 kept 31.6 east of u 11420 with no ground evidence there (its question:
  only high, shallow lines, −0.56 to −0.61; `map/frames/S4.json:43`, `:135`). Your edges at u 12600–13300 are the
  first ground evidence. If they read outside 31.6 ± 5 px/m, report them to the lead with the stroke points
  **before** you fit. The lead decides between a ramp inside your section and re-knotting part 1.
- **Datum.** `S4b.road.main:lines.centre.0`, exactly scan (12600, 1206), **station +67.95** (part 1's route station
  there). With the seed, your painted area's west corners come out at sw (58.32, −4.39) and nw (43.99, 30.54), which
  are part 1's se and ne. Check that after `map_layout`.
- **The water level.** The frame support `water` is the river's surface, **one H for the whole 汴河**. S3, S2 and S1
  will reuse yours, so measure it with care: two stroke points where the bank meets the water at a vertical face, a
  stair or the moorings' bank, each derivation written in the frame. 1 m of error moves every boat and shore point
  1.5 m north or south. Report it to the lead before you fit.
- **Each boat with crew** gets a `boat deck: <boat id>` support: H = water + the gunwale's height above the waterline
  below it (two stroke points).
- If your real-size checks say the depth rate or the across-street scale is wrong here, report it with the evidence
  before using anything else.

## Run 1 (now): restyle, map, layout, needs. Then report and stop.

1. **Restyle** (skill `scroll-section`, "Adding a section"). Write `sections/outer_road_2/section.json`, a copy of
   `sections/outer_road/section.json` with `rect [12448, 0, 3216, 1792]` and overview size `3216x1792` (4 × 2 tiles,
   9 images, about 8 minutes). Run `node tools/scroll_pipeline.mjs outer_road_2 all` **in the background while you
   write the tile brief**. Read the check sheets, and warn the tile agents where the restyle invents. Expect it in the
   crowd, on the boats, and where the rafted hulls overlap. Write `sections/outer_road_2/notes.md`.
2. **Map** (skill `scroll-section`, "Mapping a section"). Write `gen/map/S4b/brief.md` from `gen/map/S4/brief.md`,
   filled in for S4b, and give each agent the arguments below. Every agent and subagent keeps its scripts in
   `scratchpad/S4b_<agent>/`. Start the two structures agents and the river agent first: they are the critical path.

   | unit | owns u | looks at u | density (the lead's look) | hints to verify | seam entities, boundary notes |
   |---|---|---|---|---|---|
   | `t1` | 12600–13050 | 12450–13200 | very dense: about 30–35 figures (the shops under the long roof, the people round the second cart's rear, the bottom shops) | the first palm-covered cart (豪车云集); the seated official in the official hall; part 1's "not yet mapped" list | every S4 ID above. The first cart's front decides its owner: settle which way it faces on a zoom-3 crop |
   | `t2` | 13050–13500 | 12900–13650 | very dense: about 30–35 (the crowd, the second cart's oxen and driver, the saddled horse and donkeys, the top street) | the crowd round the seated man (≈ 13100–13450; a storyteller?); the second palm-covered cart (pin 27 at 13120) | count the crowd head by head at zoom 3; the cart and its team stay with the tile holding most of them |
   | `t3` | 13500–14100 | 13350–14250 | dense: about 20–25 (the wheelwright's men, the mules and people of the top street, the shed) | 车铺劳作, the wheelwright (≈ 13550–13750, pin 26 at 13620); the first crossroads | the loose wheel is a prop; the hanging basket on the pole frame is a prop if the frame stands on its own |
   | `t4` | 14100–14850 | 13950–15000 | medium: about 20–25 (the tea house's customers, the top shops, the people on the bank) | 小铺闲坐 (the tea house?); the path down to the water | nothing on the water (the river agent's) |
   | `t5` | 14850–15500 | 14700–15650 | open on land: about 10–15 (people on the bank, the willows) | 客家登船 (boarding?); mooring posts and stakes on the bank | the S3 seam (above); nothing on the water or on a boat |
   | `river` (the boat pilot) | everything on or in the water, u 14300–15650 | the same | about 5 boats with about 10–15 crew; the river reach; the banks | the moorings (≈ 14400–15700) | follows Phase 0 §4: boats are `veh` with `boat_` slugs; crew on `boat deck: <id>`; ropes and planks are part of the boat; the water level and the shore points at u 15500 go in its report |
   | `structures_w` | 12600–14000, plus `S4b.road.main` over the whole area | 12450–14150 | about 10–12 buildings (the long roof over the shops, the big roof by the crowd, the top street's shops, the wheelwright's shed, the south roofs) | the crossroads: a cross street north at about u 13300–13600? | the S4 seam IDs; the road's datum at (12600, 1206) |
   | `structures_e` | 14000–15500 | 13850–15650 | about 8–10 buildings (the tea house, the top shops, the long south row) | | the long hall at ≥ 15530 is S3's; the banks and anything touching the water are the river agent's |

   - **Who records the in-between kinds.** Awnings, canopies and parasols on their own poles, stalls, signboards on
     posts, loose wheels and timber piles are the tile agents' props. Writing, boards, lamps and pole frames fixed to a
     building are the building's. Anything touching the water (shore lines, banks, landing stairs, jetties, boats,
     what is on a boat) is the river agent's. "If unsure, record it as your prop: a duplicate is easy to drop, a miss
     is not." Every agent ends its report with what it saw and **left to** another agent.
   - **Supports to use:** `ground`, `official hall floor`, `cart bed: <vehicle id>` (a driver on a cart),
     `boat deck: <boat id>`, `boat roof: <boat id>`, `water` (boats), `animal S4b.ani.<id>` (riders), `carried in
     arms`, `shoulders`, `carried on back`.
   - **Validator for each unit:** `node tools/scroll_map.mjs S4b check --parts <file>`, then the overlay of its range
     at zoom 1 with grid 50, and zoom-2 windows over the dense parts. Every marker must sit on its thing.
   - **Merge:** `node tools/scroll_map.mjs S4b merge`, with cross-tile fixes in `gen/map/S4b/merge_fixes.mjs`. Then a
     **cross-key seam check** against part 1: in your scratchpad, compare `map/strokes/S4b.json` with
     `map/strokes/S4.json` for the same kind under 30 px apart within u 12450–12750. Every hit is either a seam note or
     a retired entity. Search every `what` and `note` for painted things without an entity of their own.
   - **Second pass:** two fresh agents, one per half (west 12600–14000, east 14000–15500), writing proposals to
     `gen/map/S4b/second_pass/<half>.json`. You accept or decline each one in `merge_fixes.mjs`, with the reason.
   - **Frame and generate:** set the knots, then run `node tools/scroll_map.mjs S4b all`. Read the full overlay, one
     dense window at zoom 1 (u 12900–13600), the moorings at zoom 1, and `gen/map/S4b/plan.jpg`.
3. **Layout:** `node tools/map_layout.mjs S4b` → `sections/outer_road_2/layout.json`. Check its `painted_area` against
   part 1's corners (above).
4. **Needs list** → `gen/expand/outer_road_2_needs.md`, in prose, one line per item, for the lead's catalogue agent.
   - **Casting:** from the 22 existing characters first (`characters/notes.md`). Ask for a new character only when
     none fits (boatmen, a wheelwright at work?), naming the model figure's map ID and a crop.
   - **Actions:** the ones the clips can't show (planing a wheel, poling, hauling a rope, telling a story to a crowd).
   - **Animals:** every one, with its tack.
   - **Vehicles:** the palm-covered carts as a kit variant (a palm thatch over the barrel roof of
     `kit_vehicles.covered_ox_cart`?), and the sedan chair.
   - **Boats** (one line each, for the boat factory): type, hull length and beam as mapped, cabin, mast, sweep, cargo,
     rafted to which boat, moored to what.
   - **Carried props.**
   - **Kit parts:** the wheelwright's shed and the pole frame, the tea house's benches, a landing stair, mooring posts.
5. **Report** (your final message):
   - the counts per kind, boats separately;
   - the frame: the knots, the nearest ground knot to the seam, the water level and its evidence;
   - what was hard to read;
   - the seam notes by S4 ID, and the S3 seam list;
   - the needs in brief;
   - anything that contradicts `sections.md`.

   Then stop. The lead sends Run 2.

## Run 2 (later, when the lead sends it): build, people, backdrop, check, and the boat pilot

So you know where this goes:
- **Build** `blender/outer_road_2_scene.py` the way `blender/outer_road_scene.py` is written: `derive()` from the
  layout; every piece inside `sb.entity(<map id>)`; `choice:` for every size the strokes can't give; nothing that isn't
  in the map; one invisible wall per side of the walkable area (`edge:south|east|north|west`).
  - Add `edge:shore` along the shores where the boat pilot says nobody walks.
  - Your ground stops 0.5 m past the part 1 seam and dips 0.12 m there; part 1's ground lies on top. At the east and
    north edges it runs 16 m out under the mist.
  - Build headless with `tools/build_scene.sh outer_road_2`. At most three headless Blender builds run at once across
    all agents: ask the lead for a slot.
  - `node tools/loyalty_check.mjs S4b` must PASS.
- **The boat pilot:**
  - the water plane at the frame's `water` H between your shores, and the banks between shore and bank top;
  - the boats from the boat factory's kit, or a stub with its fixed signatures until it delivers. Each deck is a
    collider, so the crew stand on it: the page drops people from H + 1.2 m onto the first surface below
    (`web/src/people.js:272`);
  - crew acting in place. Boats are static unless the user decides otherwise (`phase0_questions.md` §4);
  - shots from the bank, the tea house and the road for the user's sign-off: the hulls at real size beside their
    painted spots, the water, and which banks can be walked.
- **Never wait for the factories:** cast `stand_in`s, and build against stubs with fixed signatures. Swap when they
  deliver.
- **People** (`sections/outer_road_2/people.json`, generated by a script that knows the kit's real sizes, as
  `gen/sections/outer_road/make_people.py` does):
  - every painted figure at its spot, and the painted walkers and carriers on short paths;
  - `scale` for children, and `nudge` only with a reason;
  - no traffic;
  - the animals in `animals`, with riders' `ride`;
  - the crew on their decks.
- **Backdrop:**
  - east: S3's strip as a painted panel (`tools/backdrop.mjs`), beginning at u 15500. It drops by itself when S3 is
    built;
  - north: the river leaving the silk is mist;
  - south: mist;
  - part 1's east panel drops by itself when you are loaded.
- **Check alone** (`world.html?sections=outer_road_2`) **and joined** with part 1 (`walks_joined.json`,
  `shots_joined.json`, walks across u 12600). Use your own preview server (the lead gives you a port), never the
  shared dev page. The lead benches, and cuts part 1's east ground back to the seam when you join.
- **Lessons:** keep them in `gen/expand/outer_road_2_lessons.md`, with the exact text to add to the skills. The boat
  and water lessons go first: S3 and S2 will be briefed from them.

## How to work

- Images only through `tools/shyfai_image.py`; 3D only through the factories (hosted Meshy). Boats are built from a
  kit, like the carts.
- Never cheap geometry, never anything unpainted (`map/BUILDING.md`). Build at real size and place things where they
  are painted (rule 5).
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
- Use subagents, each with its own scratchpad folder, and keep records, not progress reports.
