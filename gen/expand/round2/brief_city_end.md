# Brief: the scroll's end (S7, `sections/city_end`)

You are one of the area agents in round 2 of the 清明上河图 web world, a first-person, walkable reconstruction of the
scroll (`/home/ran/3d_director/qingming`). Three sections are built and joined on `web/world.html`: S6 the inner city,
S5 the gate and S4 part 1 the outer road. You build the last piece at the city end, west of S6. Other agents are
mapping the rest of the scroll at the same time, and the lead joins everything. Everyone follows one written standard,
so the joined world reads as one.

The user's words: "absolutely loyal to the original painting… replicate exactly what the painting has, even to the
amount of trees"; "I want high quality work"; and this round, a parallel subagent workflow "to get everything done
quickly". The quality bar is Messenger (messenger.abeto.co). The standard is `map/BUILDING.md`, and you follow it as
written. A change to it needs the user: report it, don't make it.

## Your area

- **S7, scan u 815–2000.** Look about 150 px past the east end, to u 2150. The west end is the silk's cut edge at
  u ≈ 815. Left of it are the mounting and collectors' seals, which are never recorded (the restyle may paint them).
  The silk runs v 0–1790.
- **What scholars say is painted here** (`reference/scroll/sections.md` §2, lines 353–360; 余辉's vignettes, lines 62–64; the 名画记 pins,
  lines 177–181):
  - 赵太丞家, the doctor's shop, with the sign "治酒所伤真方集香丸", where two women bring children (太丞医铺,
    ≈ 1480–1780; pin 48 国医赵太丞家, u 1630);
  - the broad-hatted official riding out with his retinue (≈ 1560–1780; Hansen's last plate, `sections.md:219`: "the Zhao pharmacy and the
    rider in a broad hat", after which the scroll "suddenly ends");
  - the official's gatehouse, where the gatekeeper gives directions to a visitor with a food box (门房指路/官宦人家,
    ≈ 1000–1350; pin 49 官宦人家, u 1240);
  - the willows and the cut edge at 815.

  余辉 frames the ending as three questions (`sections.md:82`): 问病 at 赵太丞家, 问命 at the 解 sign, 问道 at the
  gatehouse. The scroll is thought to be cut short at this end (`sections.md:104`). Record what is painted up to the
  edge, and nothing more.
- **Already settled by the S6 map** (`map/index.md:48–56`): the 解 sign and its ring of young men are in S6
  (u 2030–2340), not in S7 as sections.md says, and so is the square well (curb 2000–2205). S7 has the building the
  解 board leans against.
- **The lead's first look,** to orient you (the strokes decide):
  - The street (S6's main street, continuing) runs west through the middle of the silk, at about v 900–1300. In it are
    the official with his broad hat (head about u 1500–1600, v 1000–1050; his horse mostly hidden behind a small roof
    in front) and his retinue: a man carrying a long folded object on his shoulder at u ≈ 1400–1550 (v 1050–1200), and
    two attendants at u ≈ 1680–1760. Further on are a porter with shoulder-pole baskets (u ≈ 1150–1250, v 1100–1250)
    and men walking at u ≈ 1850–2000.
  - North of the street:
    - 赵太丞家 at u ≈ 1440–1800, v 600–950: the horizontal board 赵太丞家 (v 620–680), tall vertical boards at both
      ends (u ≈ 1440–1500 and ≈ 1720–1760), and inside seated women with children, the doctor, and a man at the
      door.
    - East of it (u ≈ 1800–2000, v 750–1000): a man with buckets on a pole, and the well's buckets at its west end.
    - The gatehouse at u ≈ 1000–1430, v 580–950: a gatekeeper seated by the door, a visitor with a food box and
      others in front, and faces at the windows. A low fence stands at u ≈ 900–1050 (v 820–900).
    - The compound's big tiled roofs fill the top of the silk (u ≈ 1000–1900, v 0–600), with a lattice window panel
      at u ≈ 1080–1250 (v 260–320) and a dark blot on a roof at u ≈ 1700–1730 (v 120–150): a bird? Check it.
    - Needle trees at u ≈ 1850–2050 (v 100–300).
  - South of the street: the big roof of the 解 building (u ≈ 1380–1950, v 1250–1800), with a 解 character at
    u ≈ 1955–1990 (v 1530–1580), and a smaller roof in front of it at u ≈ 1330–1600 (v 1150–1350).
  - West: willows at the cut edge (u 815–1000, the whole height); a bare tree with knobbed twig ends at u ≈ 850–1200
    (v 1000–1300); big willows along the bottom (u ≈ 815–1350, v 1250–1800).
- **Seams:** S6 at u 2000 (east). The west edge is the end of the scroll: nothing is painted beyond it, so there is no
  panel, only mist (`map/BUILDING.md` rule 4).
- **Build folder:** `sections/city_end`. Builder: `blender/city_end_scene.py`. Map key: `S7` (IDs `S7.<kind>.<slug>`).

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`;
- `map/README.md`, the language of positions (read "Frames" → "One world across sections" closely), and
  `map/BUILDING.md`, the language of building;
- `map/index.md` (status, seams) and `map/text/S6.md`, your neighbour, especially its west end;
- the skills in `/home/ran/3d_director/.claude/skills/`: `scroll-section` (restyle, "Mapping a section" and the
  playbook "Expanding to a new section"), `web-scene` and `characters`. Work through their atomic scripts, and don't
  re-invent a workflow that exists;
- last round's record: `gen/expand/progress.md`, `gen/expand/inner_city_lessons.md`, `gen/map/S6/brief.md` (the
  filled-in tile brief you copy), `gen/map/S6/merge_notes.md` and `gen/map/S6/merge_fixes.mjs`;
- this round: `gen/expand/round2_progress.md` and `gen/expand/round2/phase0_questions.md`.

## What you own

| path | owner |
|---|---|
| `map/strokes/S7.json`, `map/frames/S7.json` (a seed is there: keep its origin, scales and seam knot), `map/world/S7.json`, `map/text/S7.md`, `gen/map/S7/` | you |
| `sections/city_end/` (section.json, notes.md, layout.json via the tool, build_choices.json, people.json, walks, shots, scene.json, backdrop.json, placed.json via the builder), `gen/sections/city_end/` | you |
| `blender/city_end_scene.py`, `blender/kit_city_end.py` (new parts: generic functions that take positions from the caller) | you |
| `prompts/backdrop_city_end_*.txt`, `gen/expand/city_end_*.md` (needs, lessons, report) | you |
| S6's map files, `gen/map/S6/merge_fixes.mjs`, `sections/inner_city/`, `blender/inner_city_scene.py`, `blender/kit_inner_city.py` | the lead (finished section: what you learn about an S6 entity is a seam note) |
| `song_kit.py`, `street_b1.py`, `web/src/`, `tools/`, `map/README.md`, `map/BUILDING.md`, `map/index.md`, `map/sections.json`, the skills | the lead |
| `characters/`, `animals/`, `kit_vehicles.py`, `trees/` (including `trees/assign/S7.json`), set-piece kits, panels | the factories (`round2_progress.md`): ask through your needs list |

If you need a change in a file you don't own, work around it and put the request in your report.

## Seams with S6 (u 2000)

Entities that straddle the seam stay S6's, and S6's builder builds them. You map the rest of such a thing as a note on
the same ID, in your report, for the lead to apply. Don't build it again.

- **`S6.road.main`** continues west. Its centre line's point 0 is scan (2000, 1180), est: that point is your datum.
  Its `edge_n` at u 2000 is v 800 (the wall foot of the house behind the well) and its `edge_s` is v 1300 (your 解
  building's north side; S6 ran that edge down its slanted east board from (2045, 1310) to (2165, 1775)).
- **`S6.str.square_well_2000`** is S6's. Only its platform's west end (u ≈ 1955–2000) lies on your side.
- **`S6.prop.mat_awning_2000`** is S6's. Its west end is tied into your corner building, with posts at u ≈ 1918–1936.
  Say in a seam note whether those posts are the awning's or the building's.
- **`S6.prop.jie_signboard_2085`**, the tall triangular board, is S6's. It leans against the eave of your corner
  building. Settle on a zoom-3 crop whether the 解 character at u ≈ 1955–1990 belongs to that board or is painted on
  your building.
- **`S6.bld.far_house_1859`** (top of the silk, west end at u ≈ 1825) and **`S6.str.fence_far_2000`** are S6's.
- **`S6.tree.willow_2330`** is S6's. Its crown reaches west to u 1822. **`S6.tree.needle_tree_2025`** is S6's
  (foliage 1985–2055); your needle tree at ≈ 1910 is a separate tree only if its own trunk or crown top shows.
- S6's figures nearest the seam are `S6.fig.well_bucket_lifter_2032`, `S6.fig.crouching_dark_2028` and
  `S6.fig.jie_listener_west_2062`. They are not yours.
- **Yours, listed by S6 as not yet mapped** (`map/index.md:54–56`): three buckets at the well, (1990, 928),
  (1950, 920) and (1922, 995); a tub under the 解 sign (1973, 1741); a man with a bundle (foot 1972, 1257); the 解
  building (small roof 1880–1960, big roof 1500–1830); a needle tree at about 1910; figures at u 1850–1900.

## The frame

Your frame continues S6's (`map/README.md`, Frames, "One world across sections"): origin [8248, 1565], 77 px/m across
the street and in height, 51.25 px of v per metre of depth, `covers [800, 2150]`. Only the receding direction drifts.
Your knot list **ends** with `[2000, 50.4]`, S6's value at the seam (S6 is constant at 50.4 west of u 2950,
`map/frames/S6.json:24–37`). Measure your own knots on ground-level receding edges: the doctor's counter and benches,
the gatehouse's threshold and step sides, the fence, a wall's foot. Eaves and ridges flatten with height, so use them
only if nothing at ground level recedes, and say so. List the knots before the seam knot, in increasing u.

The datum is `S7.road.main`'s last centre-line point, at exactly scan (2000, 1180), **station −73.63** (S6's route
station there). With the seed, your painted area's east corners come out at se (−78.27, −4.39) and ne (−101.13,
30.54), which are S6's sw and nw. Check that after `map_layout`. If your real-size checks say the depth rate or the
across-street scale is wrong here, report it with the evidence before using anything else.

## Run 1 (now): restyle, map, layout, needs. Then report and stop.

1. **Restyle** (skill `scroll-section`, "Adding a section"). Write `sections/city_end/section.json`, a copy of
   `sections/outer_road/section.json` with `rect [816, 0, 1344, 1792]` and overview size `1344x1792` (2 × 2 tiles,
   5 images). Run `node tools/scroll_pipeline.mjs city_end all` **in the background while you write the tile brief**.
   Read the check sheets, and warn the tile agents where the restyle invents. Expect it at the seals and the cut edge,
   and behind the retinue. Write `sections/city_end/notes.md`.
2. **Map** (skill `scroll-section`, "Mapping a section"). Write `gen/map/S7/brief.md` from `gen/map/S6/brief.md`,
   filled in for S7, and give each agent the arguments below. Every agent and subagent keeps its scripts in
   `scratchpad/S7_<agent>/` (the scratchpad is shared between areas). Start the structures agent first: it is the
   critical path.

   | unit | owns u | looks at u | density (the lead's look) | hints to verify | seam entities |
   |---|---|---|---|---|---|
   | `t1` | 815–1450 | 815–1600 | medium: about 12–18 figures, mostly in the middle band (v 700–1300); many trees (willows at the edge and the bottom, the bare tree) | the gatehouse: 门房指路, the gatekeeper and the visitor with a food box (≈ 1000–1350, pin 49 at 1240); the willows to the cut edge; the porter | none on the west (the silk's edge: no seals, no mounting); the boundary with t2 runs between the gatehouse and the doctor's west board |
   | `t2` | 1450–2000 | 1300–2150 | dense: about 20–25 figures (the shop's interior, the retinue, the men at the well's end) | 赵太丞家, the women and children, the doctor (≈ 1480–1780, pin 48 at 1630); the official riding out with his retinue (≈ 1560–1780); the well-end buckets, the tub, the bundle man | every S6 ID above; the 解 character |
   | `structures` | 815–2000 (looks to 2150) | | about 8–12 buildings: the compound's stacked roofs, the gatehouse, 赵太丞家 with its back halls, the 解 building, the small roof in front of it; the fence; the street | 官宦人家 (the official's compound), 赵太丞家's signboards and writing (part of the building: copy every character as painted, □ for the unreadable) | `S6.road.main`, the awning's posts, the 解 board's eave |

   - **Who records the in-between kinds.** Signboards on their own posts, lamps, benches, buckets and tubs are the
     tile agents' props. Boards, writing and lamps fixed to a building are the building's (structures agent, in its
     `what`). "If unsure, record it as your prop: a duplicate is easy to drop, a miss is not." Every agent ends its
     report with what it saw and **left to** another agent.
   - **The rider.** `t2` records the official as a figure (`pose: riding`, `support: animal S7.ani.<id>`) and his
     horse as its own animal, however little of it shows (`vis: part: …`, est hooves). Say what hides it.
   - **Validator for each unit:** `node tools/scroll_map.mjs S7 check --parts <file>`, then the overlay of its range
     at zoom 1 with grid 50, and zoom-2 windows over the dense parts. Every marker must sit on its thing.
   - **Merge:** `node tools/scroll_map.mjs S7 merge`, with cross-tile fixes in `gen/map/S7/merge_fixes.mjs`. Then a
     **cross-key seam check** against S6: in your scratchpad, compare `map/strokes/S7.json` with
     `map/strokes/S6.json` for the same kind under 30 px apart within u 1850–2150. Every hit is either a seam note or
     a retired entity. Search every `what` and `note` for painted things without an entity of their own.
   - **Second pass:** one fresh agent over the whole area, writing proposals to `gen/map/S7/second_pass/all.json`.
     You accept or decline each one in `merge_fixes.mjs`, with the reason.
   - **Frame and generate:** set the knots, then run `node tools/scroll_map.mjs S7 all`. Read the full overlay, one
     dense window at zoom 1, and `gen/map/S7/plan.jpg`.
3. **Layout:** `node tools/map_layout.mjs S7` → `sections/city_end/layout.json`. Check its `painted_area` against S6's
   corners (above).
4. **Needs list** → `gen/expand/city_end_needs.md`, in prose, one line per item, for the lead's catalogue agent (it
   merges every area's list). Cast from the 22 existing characters first (`characters/notes.md`); likely: woman,
   child, official, hat_traveller, bearer, porter, elder, idler. Ask for a new character only when none fits, and
   then name the model figure's map ID and a crop. Also list:
   - the actions the clips can't show (a doctor feeling a pulse, a gatekeeper pointing the way);
   - every animal, with its tack;
   - every carried prop (the food box 食盒, the retinue's folded object);
   - the kit parts `song_kit.py` lacks: a shop counter with medicine drawers, tall shop boards with characters, a
     gatehouse door, the 解 building's slanted board.
5. **Report** (your final message): the counts per kind; the frame (knots, any deviation); what was hard to read; the
   seam notes, by S6 ID; the needs in brief; and anything that contradicts `sections.md`. Then stop. The lead sends
   Run 2.

## Run 2 (later, when the lead sends it): build, people, backdrop, check

So you know where this goes:
- **Build** `blender/city_end_scene.py` the way `blender/inner_city_scene.py` is written: `derive()` from the layout;
  every piece inside `sb.entity(<map id>)`; `choice:` for every size the strokes can't give; nothing that isn't in the
  map; one invisible wall per side of the walkable area (`edge:south|east|north|west`).
  - Your ground stops 0.5 m past the S6 seam and dips 0.12 m there. At the west edge it runs 16 m out under the mist.
  - Build headless with `tools/build_scene.sh city_end`, never in the live GUI (that is the lead's). At most three
    headless Blender builds run at once across all agents: ask the lead for a slot.
  - `node tools/loyalty_check.mjs S7` must PASS.
- **Never wait for the factories:** cast `stand_in`s, and build against stubs with the factories' fixed signatures.
  Swap when they deliver.
- **People** (`sections/city_end/people.json`, generated by a script that knows the kit's real sizes, as
  `gen/sections/outer_road/make_people.py` does):
  - every painted figure at its spot, and the painted walkers and carriers on short paths;
  - `scale` for children, and `nudge` only with a reason;
  - no traffic;
  - the horse in `animals`, with the official's `ride`.
- **Backdrop:** no west panel (the scroll's end). North and south are mist. The panel that stood for S7 in
  `sections/inner_city/backdrop.json` drops by itself once you are loaded.
- **Check alone** (`world.html?sections=city_end`) **and joined** with the inner city (`walks_joined.json`,
  `shots_joined.json`). Use your own preview server (the lead gives you a port), never the shared dev page. The lead
  benches, and cuts S6's west ground back to the seam when you join.
- **Lessons:** keep them in `gen/expand/city_end_lessons.md`, with the exact text to add to the skills.

## How to work

- Images only through `tools/shyfai_image.py`; 3D only through the factories (hosted Meshy).
- Never cheap geometry, never anything unpainted (`map/BUILDING.md`). Build at real size and place things where they
  are painted (rule 5).
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
- Use subagents, each with its own scratchpad folder, and keep records, not progress reports.
