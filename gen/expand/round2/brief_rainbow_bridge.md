# Brief: the Rainbow Bridge (S3, `sections/rainbow_bridge`)

You are one of the area agents in round 2 of the 清明上河图 web world, a first-person, walkable reconstruction of the
scroll (`/home/ran/3d_director/qingming`). Three sections are built and joined on `web/world.html`: S6 the inner city,
S5 the gate and S4 part 1 the outer road (u 9400–12600). S4 part 2 (S4b, u 12600–15500, the moorings) is being mapped
now as the pilot for boats and water. You map the Rainbow Bridge, east of S4b. Other agents are mapping the rest of the
scroll at the same time, and the lead joins everything. Everyone follows one written standard, so the joined world
reads as one.

S3 is, with S2, the heaviest section of the scroll in people and boats: the crowd on the bridge, the big boat lowering
its mast under the arch with about 20 crew, and 十千脚店 with its 彩楼欢门 scaffold. It is the first section where the
route leaves the ground: it climbs the bridge's arched deck and comes down on the far bank.

The user's words: "absolutely loyal to the original painting… replicate exactly what the painting has, even to the
amount of trees"; "I want high quality work"; and this round, a parallel subagent workflow "to get everything done
quickly". The quality bar is Messenger (messenger.abeto.co). The standard is `map/BUILDING.md`, and you follow it as
written. A change to it needs the user: report it, don't make it.

Written by S3's setup agent on 2026-10-12 from `gen/expand/round2/tile_plan_S1_S2_S3.md` (S3) and
`reference/scroll/sections.md` §2, in the form of `brief_outer_road_2.md`. Every agent reads
`gen/expand/round2/mapping_rules.md` ("Everyone" and its role) first; this brief is the area's facts.

## Your area

- **S3, scan u 15500–20500, map key `S3`** (IDs `S3.<kind>.<slug>`; `map/sections.json`, folder `rainbow_bridge`).
  Look about 150 px past both ends, u 15350–20650. The silk runs v 0–1790.
- **Directions.** Picture right is east (`map/README.md`, Coordinates): S4b is S3's **west** neighbour (u 15500) and
  S2 its **east** neighbour (u 20500). `mapping_rules.md` ("structures", "frame") calls the neighbour a new frame
  continues from "the east neighbour"; for S3 that neighbour is S4b, at u 15500. S3 hands S2 its route point at
  u 20500.
- **What scholars say is painted here** (`reference/scroll/sections.md` §2, lines 310–321; the 名画记 pins, lines
  150–157; 余辉's 2014 vignettes, lines 61–62):
  - 十千脚店: the tavern building "probably ≈ 15500–16800" (sections.md's own reading), its scaffolded 彩楼欢门
    ≈ 16800–17340, the "十千脚店" lamp-box ≈ 17000. 余辉 counts it as 欢楼美禄, the first vignette of 城门内外;
  - the 新酒 flag, ≈ 17430 (pin 23 新酒);
  - a 串车 at the tavern door, ≈ 17550 (pin 24 串车). 余辉 reads its load as a cursive-script screen used as a tarp,
    the second of two such carts (书屏遭废; the other is S5's, `sections.md:456–460`);
  - the 饮子 drink stall, ≈ 18500 (pin 22 饮子);
  - the bridge: south foot ≈ 18400–18900, arch ≈ 18850–20050 (pin 18 虹桥 at 18920, pin 20 拥挤的桥面 at 19240);
  - the sedan-versus-horseman standoff on the deck (车轿相争), ≈ 18700–19300;
  - the big boat lowering its mast under the arch while people on the bridge throw ropes (大船抢险, 上下呼救),
    ≈ 19500–20500 (pin 19 大船穿行虹桥 at 19970);
  - 余辉's bridge list starts with 摇橹向前 (a boat driven forward by its sweep): probably the boat under way at
    u ≈ 15550–15900, whose long sweep reaches ≈ 16120, but verify;
  - pin 21 虹桥边的小酒馆 at 19990 and pin 25 河边泊船 (纤夫) at 15690.

  These are hints to verify, not facts.
- **The setup agent's first look,** from gridded crops at zoom 0.6–1.6, to orient you (the strokes decide):
  - **The river** is a diagonal band. At the west it runs along the top of the silk (water ≈ v 230–950 at
    u 15500–17500, the far bank a strip along the top edge, v 0–250); toward the east it widens and drops (under the
    arch the water is ≈ v 300–1100). The far (north) bank is a strip of shops, tables, a willow and moored boats along
    the top edge. The near (south) bank holds the riverside hall, the tavern, the open ground and the bridge's south
    foot.
  - **West (u 15500–16500):**
    - the boat under way (≈ 15550–15950, v 270–560), its sweep running east to ≈ (16120, 530), crew on deck;
    - a masted boat (≈ 15950–16220, v 30–300);
    - figures on a far-bank path at ≈ 16250–16450, v 40–130: trackers? Read whether a line runs to them from the
      masted boat;
    - a boat moored at the far bank, ≈ 16380–16700, v 150–280;
    - the long riverside hall (≈ 15530–16450): its roof at v 950–1250, a railed veranda with diners at lattice
      windows at v 1300–1500;
    - roofs and bare trees along the bottom edge (v 1500–1790); big bare trees at ≈ 16100–16700, v 350–1000.
  - **十千脚店 (≈ 16400–17330):**
    - a big hip roof at ≈ 16400–16850, v 1200–1790, seen from above;
    - its gate under the 彩楼欢门 at ≈ 16800–17330. The scaffold's poles rise to v ≈ 300–500 (the tallest at
      ≈ 17220, v 300);
    - a vertical sign reading 脚店 at ≈ 16950–17010, v 1580–1720 (十千 above it may be hidden or faded);
    - a rider on a horse at the gate (≈ 17000–17150, v 1550–1790).

    The long riverside hall may be the tavern's riverside wing or a building of its own: structures_w decides from
    the strokes, and says so.
  - **The 新酒 banner** (≈ 17410–17560, v 900–1120, the characters at ≈ 17480, v 990–1050) hangs from a bar running
    west from a tall pole at u ≈ 17600. The pole has a crossed frame and a bird-shaped vane at its top (v ≈ 700–820),
    and its foot is hidden at about v 1350–1400.
  - **The far bank (u 16600–18600, v 0–330):**
    - shops with tables and a willow at ≈ 17100;
    - a long moored boat with cabin windows (≈ 16600–17300, v 140–400);
    - more boats at ≈ 17300–17700 (v 130–230) and ≈ 17700–18300 (v 150–330);
    - a long open hall on posts at ≈ 18300–18600, v 50–250.
  - **The south bank's open ground (u 17300–18400, v 1100–1790):**
    - the 串车 (≈ 17480–17720, v 1370–1560) with men at it;
    - porters and a donkey (≈ 17850–18000, v 1500–1650);
    - a mat-roofed shed with stalls at ≈ 17600–17900, v 960–1250;
    - parasol stalls at ≈ 18150–18300 (v 880–1000) and ≈ 18500–18650 (v 920–1000), and two big parasols at
      ≈ 18350–18550, v 1380–1500.
  - **The boats unloading at the south bank** (≈ 17650–18100, v 700–950, mat covers), with porters on and beside them.
  - **The bridge (≈ 18400–20100):**
    - the south foot is crowded with stalls and people (≈ 18300–18900, v 200–900): mat awnings at ≈ 18300–18600
      (v 450–600) and ≈ 18760–18960 (v 600–750), a parasol at ≈ 18350–18550 (v 450–530), and the sedan at
      ≈ 18700–18760, v 420–560;
    - the deck rises east to the crown at about u 19400–19600, where the arch's top edge is at v ≈ 180–200. It comes
      down onto the north bank at about (19950–20000, 280–330). The crowd on the deck runs along v 100–300 from
      u 19000 to 19900;
    - the arch's south foot is at ≈ 18850–19000, v 750–1050;
    - tall poles with a crossbar stand at ≈ 19010 (v ≈ 400–1100) and ≈ 20040 (v 20–400). They are the bridge's end
      posts (a third such pole is the one at 17600).
  - **The big boat under the arch** (≈ 19350–20450, v 300–800). Its mast is being lowered (lines from about
    (19900, 600) to (20300, 100)), with crew all over it. People at the railings above throw ropes.
  - **A boat moored along the south bank past the arch,** found at setup and not in the tile plan: hull
    ≈ 19750–20650, v 1080–1220, with a mat cabin roof. Men stand on its roof waving at the big boat (≈ 19900–20150,
    v 950–1100). These are the "men waving on the south bank" of the tile plan, and they stand **on a boat**, so they
    are river_e's (see the seams).
  - **The north bank (u 19700–20500, v 0–330):**
    - a two-wheeled cart pulled up the bank at ≈ 19800–19920, v 140–260;
    - shops;
    - a tavern with tables at ≈ 20050–20450, v 30–330 (pin 21 at 19990?);
    - the boat moored along it from ≈ 20330 eastward (v 280–430).
  - **The south bank's bottom edge (u 18500–20650, v 1000–1790):**
    - the big tiled roofs of the shops at the bridge's foot;
    - open shop fronts with tables and people at ≈ 19700–20500, v 1450–1790;
    - a mat-awning stall at ≈ 19000–19300, v 1000–1250, a parasol at ≈ 19300–19450, v 1150, and people under the
      arch at ≈ 19550–19800, v 1080–1250;
    - a big tree with a dark trunk at ≈ 20330–20420 (v 1250–1790, base est), its crown at ≈ 20150–20800,
      v 380–1100.
- **The road.** The route (`S3.road.main`) runs along the south bank, climbs the bridge, crosses the crown and comes
  down on the north bank, then runs east along it to u 20500. West of the tavern door (u 15500 to about 17000) the
  south-bank road is hidden under the roofs along the silk's bottom edge: its points there are `est`, with the
  evidence. It comes into view at the tavern door (≈ 17000–17300, v 1500–1790) and in the open ground at
  17300–18400. On the north bank it lands at about v 280–330 and has only a thin strip of land (v 0–330) to run along:
  check that it stays inside the painted area.
- **Seams:** S4b at u 15500 (west) and S2, the canal, at u 20500 (east). Both are being mapped at the same time.
- **Build folder:** `sections/rainbow_bridge`. Builder: `blender/rainbow_bridge_scene.py`.

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`;
- `gen/expand/round2/mapping_rules.md`: "Everyone" and your role;
- `map/README.md`, the language of positions. Read Boats, the supports (`H_profile`) and Frames → "One world across
  sections" closely. Then `map/BUILDING.md`, the language of building;
- `map/index.md` (status, seams), `gen/expand/round2/brief_outer_road_2.md` (S4b, your west neighbour, and the boat
  pilot) and, once it exists, `map/text/S4b.md`;
- the skills in `/home/ran/3d_director/.claude/skills/`: `scroll-section` (restyle, "Mapping a section" and the
  playbook "Expanding to a new section"), `web-scene` and `characters`. Work through their atomic scripts;
- last round's record: `gen/expand/progress.md`, `gen/expand/outer_road_lessons.md`, `gen/expand/inner_city_lessons.md`,
  `gen/map/S4/brief.md` and `gen/map/S6/brief.md` (the filled-in tile briefs), `gen/map/S4/merge_notes.md`,
  `gen/map/S4/merge_fixes.mjs`;
- this round: `gen/expand/round2_progress.md`, `gen/expand/round2/phase0_questions.md` (§4 boats and water, §5 the
  seam at 15500) and `gen/expand/round2/tile_plan_S1_S2_S3.md` (S3, and the critical risks);
- the tile brief `gen/map/S3/brief.md` and the restyle's warnings `sections/rainbow_bridge/notes.md`.

## What you own

| path | owner |
|---|---|
| `map/strokes/S3.json`, `map/frames/S3.json` (seeded at the frame step from S4b's), `map/world/S3.json`, `map/text/S3.md`, `gen/map/S3/` | the S3 area agents, each its own files (the unit agents write only their `parts/<unit>.json` and `reports/<unit>.md`) |
| `sections/rainbow_bridge/` (section.json, notes.md, layout.json via the tool, build_choices.json, people.json, walks, shots, scene.json, backdrop.json, placed.json via the builder), `gen/sections/rainbow_bridge/` | S3 |
| `blender/rainbow_bridge_scene.py`, `blender/kit_rainbow_bridge.py` (new parts: generic functions that take positions from the caller) | S3 (Run 2) |
| `prompts/backdrop_rainbow_bridge_*.txt`, `gen/expand/rainbow_bridge_*.md` (needs, lessons), `gen/expand/round2/rainbow_bridge_run1_report.md` | S3 |
| S4b's files (`map/*/S4b.*`, `gen/map/S4b/`, `sections/outer_road_2/`) and S2's (`map/*/S2.*`, `gen/map/S2/`, `sections/canal/`) | their area agents: what you learn about their entities is a seam note in your report |
| `song_kit.py`, `street_b1.py`, `web/src/`, `tools/`, `map/README.md`, `map/BUILDING.md`, `map/index.md`, `map/sections.json`, the skills | the lead |
| the boat kit `blender/kit_boats.py` and `gen/boats/`; the set pieces (the Rainbow Bridge, 十千脚店's 彩楼欢门 scaffold) in their own kit modules | the factories (you build against their fixed signatures, or a stub of them) |
| `kit_vehicles.py` (the 串车, the carts), `characters/`, `animals/`, `trees/` (including `trees/assign/S3.json`), panels | the factories: ask through your needs list |

If you need a change in a file you don't own, work around it and put the request in your report.

## The seam with S4b (u 15500, west)

Settled in Phase 0 (`phase0_questions.md` §5, `map/index.md` "Seams"):
- the long riverside hall (roof from u ≈ 15530 to ≈ 16450) is **S3's** (structures_w);
- the biggest rafted boat (stern ≈ 14880, bow ≈ 15450, v 450–850) is **S4b's**. Its lines running east (v ≈ 350–520)
  are S4b's to read; river_w says in its report where they end on S3's side, if they do;
- the willow with its trunk at u ≈ 15450–15500 (v 1000–1400) is **S4b's**. Its crown spreads over the hall to
  u ≈ 15600: a seam note, never an S3 tree. Record another tree only where its own trunk shows;
- the boat under way at u ≈ 15550–15900 with its crew is **S3's** (river_w; pin 25);
- the river runs across the seam. river_w maps S3's reach and starts its shore lines at u 15500, and gives its shore
  points there in its report. S4b's river agent gives its own for the lead;
- `S3.road.main` starts at S4b's road centre at u 15500 (see the frame). structures_w reads the road there itself
  (centre, `edge_n`, `edge_s`, most likely `est` under the roofs) and gives the reading in its report. At merge, the
  first centre point is set to exactly S4b's point at u 15500 (`gen/map/S4b/parts/structures_w.json` or
  `map/strokes/S4b.json`), and the difference is reported;
- everything else that crosses u 15500 (a roof, a crown, a figure on the line) is listed in the report of the unit
  that sees it, with its points on both sides.

## The seam with S2 (u 20500, east)

From `map/index.md` "Seams", plus what setup found:
- the big boat under the arch (bow ≈ 20450) and its whole crew are **S3's** (river_e);
- the boat moored along the north bank from ≈ 20330 eastward goes by its main point (`front`, the waterline under the
  stem), so it is most likely S2's. river_e reads which end is the bow, and gives both ends in its report;
- **the boat moored along the south bank (hull ≈ 19750–20650, v 1080–1220), new at setup:** S3's (river_e), with the
  men waving from its roof, because most of the hull and all of its crew are west of the seam and they belong to
  上下呼救. If its stem turns out to be east of u 20500, keep it S3's anyway and say so in the report: the lead tells
  S2, whose river_w is mapping the same water at the same time;
- the big willow at the top (trunk ≈ 20450–20550, v 0–250) is **S2's**, as `map/index.md` says, even if its trunk
  reads west of 20500. t9 leaves it and writes a seam note;
- the big tree with the dark trunk at ≈ 20330–20420 (base at the silk's bottom edge, crown to ≈ 20800) is **S3's**
  (t9) by its base;
- the south bank's roofs straddle the seam: each goes by its main point (structures_e), listed in the report with
  points on both sides;
- `S3.road.main` ends on the north bank at u 20500. Its last centre point there is S2's datum (`map/index.md`), so
  structures_w puts a point at exactly u 20500 and gives it in its report.

## The frame

S3's frame continues S4b's (`map/README.md`, Frames, "One world across sections"). It is written at the frame step,
after S4b's frame exists, never before:
- S5's origin `[8248, 1565]`, 77 px/m across the street and in height, 51.25 px of v per metre of depth,
  `covers [15350, 20650]`. Only the receding direction drifts.
- **Knots.** The list **starts** with S4b's dx at u 15500 (S4b's last knot, constant beyond). Measure S3's own knots
  on ground-level receding edges (the structures agents' receding-edge tables: the hall's veranda and steps, the
  tavern's gate, stalls and tables, the cart's shafts, the deck's cross-boards at the bridge's feet), grouped west,
  middle and east. Eaves, ridges and the bridge's rails flatten with height: use them only where nothing at ground
  level recedes, and say so.
- **Datum.** `S3.road.main:lines.centre.0`, exactly S4b's road centre at u 15500, with S4b's route station there
  (`map/world/S4b.json`, `sections/outer_road_2/layout.json`). With the seed, S3's painted area's west corners must be
  S4b's east corners: check that after `map_layout`.
- **Water.** `supports.water` is copied from `map/frames/S4b.json`, with its derivation. S3's river agents measure
  their own reading at two places (a bank's vertical face or a landing stair: the waterline and the ground straight
  above it) **only as a check**. A reading more than 0.5 m off S4b's goes to the lead with its stroke points; it is not
  used.
- **`bridge deck`** has an `H_profile` of `[u, H]` pairs from the bridge agent's table, about one pair per 100 px of u,
  in increasing u, with the derivation. `world` takes the H at an entity's main point, linear between pairs, flat
  beyond the ends.
- **Tool limit, for the lead** (found at setup, `tools/scroll_map.mjs` `world()`): an entity's support H is taken
  **once**, at its first ground point's u, and every point of its `lines` and base corners gets that one H. Figures
  and props on the deck come out right. But the bridge's own deck edges, and the route's stretch over the deck, would
  all sit at one height. The crown is several metres above the feet, and 1 m of H moves a point 1.5 m in depth. The
  map still records the strokes as they are; the frame agent reports this before `all`, and the lead decides on a
  per-point H for lines on an `H_profile` support (and for the route's deck stretch).
- **Each boat with crew** gets a `boat deck: <boat id>` support (or `boat roof: <boat id>`): H = water + the gunwale's
  (or the roof's) height above the waterline below it, from two stroke points.
- If the real-size checks say the depth rate or the across-street scale is wrong here, report it with the evidence
  before using anything else.

## Run 1 (now): restyle, map, layout, needs. Then report and stop.

1. **Restyle** (done at setup). `sections/rainbow_bridge/section.json` is a copy of `sections/outer_road/section.json`
   with `rect [15344, 0, 5312, 1792]` (u 15344–20656) and overview `4096x1376`, 6 × 2 tiles, 13 images, plus one
   rerun of the six weakest tiles. The west reach is usable; **over the bridge (u ≈ 17900–20656) the restyle
   recomposes the scene in every run** and is not usable for positions. The warnings (where it invents) are in
   `sections/rainbow_bridge/notes.md` and in the tile brief.
2. **Map** (skill `scroll-section`, "Mapping a section"; `mapping_rules.md`). The tile brief is `gen/map/S3/brief.md`.
   Every agent keeps its scripts in `scratchpad/S3_<unit>/`. The bridge, river and structures agents are the
   critical path.

   | unit | owns u | looks at u | density | what is there (to verify) |
   |---|---|---|---|---|
   | `bridge` | `S3.str.rainbow_bridge`, 18300–20200 | 18150–20350 | the bridge | the whole bridge, the deck's `[u, H]` profile, its end posts; the route over it stays in the painted area |
   | `river_w` | the water and everything on it, 15500–18300 | 15350–18450 | about 5–6 boats with crew | the boat under way (pin 25; 摇橹向前?), the masted boat, the far-bank moored boats, the boats unloading at the south bank; shores, banks, landing stairs |
   | `river_e` | the water and everything on it, 18300–20500 | 18150–20650 | 3 boats, about 25–30 crew | 大船抢险 (pin 19), the boat moored along the south bank with the waving men, the north-bank boat's west end; shores and banks under and beside the bridge |
   | `structures_w` | buildings, structures, ground 15500–18000; `S3.road.main` for the whole route | 15350–18150 | about 10–14 buildings and a set piece | the riverside hall; 十千脚店 and its 彩楼欢门 pole by pole; the far-bank shops; the route; receding-edge table; diminution |
   | `structures_e` | buildings, structures, ground 18000–20500 | 17850–20650 | about 10–14 buildings | the shops at both feet of the bridge; the north-bank shops and tavern; the south bank's shops at the bottom |
   | `t1` | 15500–16300 | 15350–16450 | open, about 15 | the diners at the hall's windows and veranda; willows and bare trees |
   | `t2` | 16300–17000 | 16150–17150 | medium, about 15–20 | the far-bank path and its people (trackers?); far-bank shops' people; trees; the tavern's west frontage |
   | `t3` | 17000–17550 | 16850–17700 | dense, about 25–30 | the tavern door under the scaffold; the rider at the gate; the street |
   | `t4` | 17550–18050 | 17400–18200 | very dense, about 35–40 | the 串车 (pin 24); the 新酒 pole and banner; the shed's stalls; porters; the people unloading on the bank |
   | `t5` | 18050–18500 | 17900–18650 | very dense, about 30–35 | the parasol stalls, the crowd at the bridge's south foot, the 饮子 stall (pin 22) |
   | `t6` | 18500–18900 | 18350–19050 | very dense, about 40 | the south ramp and deck: its stalls (props) and crowd; the sedan of 车轿相争 |
   | `t7` | 18900–19350 | 18750–19500 | very dense, about 35–40 | the crown; the horseman of 车轿相争; the people at the railings throwing ropes (上下呼救; pin 20) |
   | `t8` | 19350–19850 | 19200–20000 | dense, about 25–30 | the north ramp and its crowd; the south bank under the arch (the stall, the parasol, the people at 19550–19800) |
   | `t9` | 19850–20500 | 19700–20650 | medium, about 20–25 | the north bank's people and the cart; the north-bank tavern's customers (pin 21); the south bank's shop fronts and people; the big tree at ≈ 20380 |

   The final unit list (the setup agent's result, after counting) is in the tile brief, with each unit's arguments.
   - **Who records the in-between kinds:** the tile brief, "Who records what". In short: stalls, awnings and parasols
     on their own poles, signboards on posts, the 新酒 pole with its banner, loose things set down are the tiles'
     props. Writing, boards, lamps and pole frames fixed to a building, and the 彩楼欢门, are the building's. The
     bridge's end posts are the bridge's. Everything touching the water is the river agents'. "If unsure, record it
     as your prop: a duplicate is easy to drop, a miss is not." Every agent ends its report with what it saw and
     **left to** another agent.
   - **Supports to use:** `ground`, `bridge deck` (everyone standing or sitting on the deck or the ramps, and stalls
     on it), `water` (boats), `boat deck: <boat id>`, `boat roof: <boat id>`, `upper floor: <building id>` if a
     storey is painted, `cart bed: <vehicle id>`, `animal S3.ani.<id>` (riders), `sedan: S3.veh.<id>`, `carried in
     arms`, `shoulders`, `carried on back`, `bank slope` (a figure on a sloping bank above the waterline: give the
     bank's points in the note).
   - **Validator for each unit:** `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/<unit>.json` PASS, then
     the overlay of its range at zoom 1 with grid 50, and zoom-2/3 windows over the dense parts. Every marker must sit
     on its thing.
   - **Merge:** `node tools/scroll_map.mjs S3 merge`, with cross-tile fixes in `gen/map/S3/merge_fixes.mjs`: the deck
     stretch of `S3.road.main` copied from the bridge agent's part, the 车轿相争 group joined across t6 and t7, the
     "left to" lists compared, supports normalised, every `what` and `note` searched for painted things without an
     entity. Write `gen/map/S3/merge_notes.md`.
   - **Second pass:** two fresh agents, west 15500–18000 and east 18000–20500, writing proposals to
     `gen/map/S3/second_pass/<half>.json`.
   - **Frame and generate** (after S4b's frame): the frame above, the cross-key seam checks against
     `map/strokes/S4b.json` within u 15200–15800 and against `map/strokes/S2.json` within 20200–20800 (same kind
     under 30 px apart: a seam note or a retired entity), then `node tools/scroll_map.mjs S3 all`. Read the full
     overlay, one dense window at zoom 1 (u 18300–19300), the river under the arch at zoom 1, and
     `gen/map/S3/plan.jpg`.
3. **Layout:** `node tools/map_layout.mjs S3` → `sections/rainbow_bridge/layout.json`. Check that its
   `painted_area` meets S4b's at u 15500, and return S2 the route point at u 20500 (scan u, v), its station and the dx
   there.
4. **Needs list** → `gen/expand/rainbow_bridge_needs.md`, prose, one line per item, for the lead's catalogue agent:
   - **Casting:** from the 22 existing characters first (`characters/notes.md`). A new character only when none fits
     (boatmen and the crew hauling the mast, a sedan bearer, a 饮子 seller?), with its model figure's map ID and a crop.
   - **Actions** the clips can't show: lowering a mast, poling and fending off with poles, throwing and hauling a
     rope, waving from a roof, working a sweep, pushing a 串车.
   - **Animals:** every one, with its tack and load.
   - **Vehicles:** the 串车 with its screen-tarp load, the sedan, the north-bank cart, any others.
   - **Boats** (one line each, for the boat factory): type, hull length and beam as mapped, cabin, mast (up, being
     lowered, or down), sweep, cargo, crew, moored or rafted to what.
   - **Set pieces:** the Rainbow Bridge (the woven-beam arch, the deck as a walkable collider, railings, end posts),
     十千脚店's 彩楼欢门 scaffold (from structures_w's pole-by-pole record).
   - **Carried props**, kit parts `song_kit.py` lacks (landing stairs, the riverside hall's railed veranda, mat
     awnings and parasol stalls on the deck), and the tree forms by count (`trees/types.md`).
5. **Report** (`gen/expand/round2/rainbow_bridge_run1_report.md`):
   - the counts per kind, boats separately;
   - the frame: the knots, the deck's `H_profile`, the water level (S4b's) and S3's check reading;
   - what was hard to read;
   - the seam notes by S4b's and S2's IDs;
   - the needs in brief;
   - anything that contradicts `sections.md` (for instance, where 十千脚店 really spans).

   Then stop. The lead sends Run 2.

## Run 2 (later, when the lead sends it): build, people, backdrop, check

So you know where this goes:
- **Build** `blender/rainbow_bridge_scene.py` the way `blender/outer_road_scene.py` is written: `derive()` from the
  layout; every piece inside `sb.entity(<map id>)`; `choice:` for every size the strokes can't give; nothing that isn't
  in the map; one invisible wall per side of the walkable area, and `edge:shore` along the shores where nobody walks
  (the boat pilot's decision on S4b).
  - The bridge is a set piece from its factory, placed from the layout. Its deck is a walkable collider that follows
    the `H_profile`, so the page can drop people onto it (`web/src/people.js:272` drops people from H + 1.2 m onto the
    first surface below).
  - The water plane at the frame's `water` H between the shores; the boats from the boat kit, each deck a collider.
  - Build headless with `tools/build_scene.sh rainbow_bridge`; at most three headless Blender builds run at once
    across all agents: ask the lead for a slot. `node tools/loyalty_check.mjs S3` must PASS.
- **Never wait for the factories:** cast `stand_in`s, and build against stubs with fixed signatures.
- **People** (`sections/rainbow_bridge/people.json`, generated by a script that knows the kit's real sizes): every
  painted figure at its spot, the crews on their decks, the crowd on the bridge on the deck, no traffic.
- **Backdrop:** north, beyond the far bank's strip at the silk's top edge, mist; south, mist; west and east, the
  neighbours' painted strips as panels until they are built (they drop by themselves when the neighbour is loaded).
- **Check alone** (`world.html?sections=rainbow_bridge`) **and joined** with S4b and S2, on your own preview server.
- **Lessons** in `gen/expand/rainbow_bridge_lessons.md`, with the exact text to add to the skills.

## How to work

- Images only through `tools/shyfai_image.py`; 3D only through the factories (hosted Meshy). Boats are built from a
  kit, like the carts.
- Never cheap geometry, never anything unpainted (`map/BUILDING.md`). Build at real size and place things where they
  are painted (rule 5).
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
- Keep records, not progress reports. Scripts and scratch files in your own scratchpad folder, `scratchpad/S3_<unit>/`.
