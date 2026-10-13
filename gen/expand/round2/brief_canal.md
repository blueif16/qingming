# Brief: the canal wharves (S2, `sections/canal`)

You are one of the area agents in round 2 of the 清明上河图 web world, a first-person, walkable reconstruction of the
scroll (`/home/ran/3d_director/qingming`). Three sections are built and joined on `web/world.html`: S6 the inner city,
S5 the gate and S4 part 1 the outer road. Round 2 maps the rest of the scroll at once (S7, S4b, S3, S2, S1), and the
lead joins everything. You map and build S2, the canal: the 汴河 with its boats, and the wharves along its north bank,
from the Rainbow Bridge's east side to the 望楼饭铺 sheds where the countryside begins. Everyone follows one written
standard, so the joined world reads as one.

S2 is, with S3, the heaviest section of the scroll in people and boats: about 15–20 boats with their crews, and the
densest wharf crowd at its east end. It is built the way S4b's boat pilot sets out, after the user signs that pilot
off.

The user's words: "absolutely loyal to the original painting… replicate exactly what the painting has, even to the
amount of trees"; "I want high quality work"; and this round, a parallel subagent workflow "to get everything done
quickly". The quality bar is Messenger (messenger.abeto.co). The standard is `map/BUILDING.md`, and you follow it as
written. A change to it needs the user: report it, don't make it.

This brief is `brief_outer_road_2.md` (S4b's) filled in for S2, from `tile_plan_S1_S2_S3.md` and
`reference/scroll/sections.md` §2, by the S2 setup agent (2026-10-12). The rules every agent follows are in
`gen/expand/round2/mapping_rules.md`; the tile brief is `gen/map/S2/brief.md`.

## Your area

- **S2, scan u 20500–29050, map key `S2`** (IDs `S2.<kind>.<slug>`; `map/sections.json`, folder `canal`). Look about
  150 px past both ends, u 20350–29200. The silk runs v 0–1790. The east end moved from 28700 to **29050** in Phase 0, so
  the 望楼饭铺 shed (≈ 28250–29000) and its customers stay whole in S2.
- **What scholars say is painted here** (`reference/scroll/sections.md` §2, lines 296–308; the 名画记 pins, lines
  140–149; 余辉's 2014 vignettes, line 60; Hansen's plates, lines 207–209; 张安治, line 93):
  - the 望火楼, a pavilion on a high brick platform, ≈ 28260–28580 at the top edge (余辉 reads it as a fire tower with
    no lookout, line 85); below it the two rows of barracks-type sheds now serving as eateries (望楼饭铺),
    ≈ 27700–28800 (none of the 49 pins names the 望火楼, line 127);
  - porters carrying grain sacks ashore while the owner sits on the sacks (私粮进京 / 仓前成市), ≈ 27950–28350
    (pin 9 仓前成市, u 27950); pin 11 河边店铺 at u 28090; pin 10 城乡交界处 at u 28940 is now S2's side of the seam;
  - two deep-laden grain boats moored at the bank (万石船), ≈ 27300–28800 (pin 8, u 27460);
  - 喝杯小酒, pin 12 at u 27320;
  - 王家纸马铺 (the Wang paper-goods shop, Hansen's plate 8), ≈ 26850 (pin 13);
  - 汴水悍激, the river's fierce current, pin 7 at u 26670: the water's painted lines;
  - the riverside eateries (沿河雅座), ≈ 25700 (pin 14, u 25680);
  - a boat rowed upstream by eight men, with trackers on the far bank (逆水行舟), ≈ 24200 (pin 15, u 24160); pin 16
    聊天的伙计 (fellows chatting) at u 24280;
  - a luxury passenger boat (豪华客船), ≈ 23000 (pin 17, u 22960);
  - 余辉's 2014 list runs …惊马闯市, 望楼饭铺, 私粮进京, 船侧祭神, 客船启程 (then the bridge). So **船侧祭神** (an
    offering at a boat's side) and **客船启程** (a passenger boat setting off) should lie between the grain boats and the
    bridge. Hansen's plates 10–12 are "the trackers"; 张安治 counts "the 汴河 unloading and the five trackers". Verify
    all of them; they are hints, not facts.
- **The setup agent's first look** (gridded crops at zoom 0.6–1.1, to orient you; the strokes decide):
  - **The water** fills most of the silk: v ≈ 300–1800 at the west end (with a south bank at the bottom of
    u 20350–22300), v ≈ 450–1800 through the middle, and v ≈ 900–1800 east of u 26800, where the north bank widens.
    East of u 22300 nothing is painted south of the water: the silk's bottom edge cuts it (mist, rule 4).
  - **The north bank, west (u 20500–22300):** shops at the top (u ≈ 20800–21600, v 0–120); boats moored along the
    bank (one ≈ 20380–21100, v 250–480, with about 7 people aboard; a big cabin boat ≈ 20820–21800, v 80–410); **five
    trackers** on the bank at u ≈ 21780–22150 (v 150–390), hauling a long rope; a big willow at the top
    (u ≈ 22150–22350, v 0–300).
  - **The tow rope** runs from the trackers east across the water (≈ (22150, 330), (22500, 440), (22950, 480),
    (23500, 490), (23830, 440)) to **the mast of the boat going upstream at u ≈ 24100–24180** (mast top v ≈ 300): it is
    逆水行舟's rope, about 2300 px long. The trackers are about 2000 px west of their boat.
  - **The south bank (u 20350–22300, bottom):** big tiled roofs (u ≈ 20500–21500, v 1300–1800); people by a shed at
    u ≈ 20900–21100 (v 1250–1420); two great willows whose crowns fill the middle of the silk (trunks at
    u ≈ 21300–21450, v 1050–1450, and u ≈ 20480–20600, v 1150–1790); a mound at u ≈ 21500–21800 (v 1380–1450); a big
    seated or leaning figure at u ≈ 21950–22050 (v 1580–1700) by a boat.
  - **The middle water (u 21850–23750):** a boat with six men working poles or oars (u ≈ 21870–22450, v 830–1060); a long
    pole from that boat to a skiff-like shape (≈ 22450–22950, v 1000–1100: a skiff, or a great sweep's blade?); two cabin boats at the bottom (≈ 21950–22500, v 1450–1660, with a pole or
    mast at ≈ 22100; ≈ 22400–23050, v 1450–1780); **豪华客船**, a long boat with a full-length cabin and lattice windows
    (u ≈ 22420–23720, v 480–920), passengers inside and crew on deck.
  - **The north bank, middle (u 22300–24600):** buildings at the top; **a terrace on posts over the water with diners**
    (u ≈ 22950–23450, v 180–420); an open-air eatery with tables and benches (u ≈ 23500–24000, v 200–330); the street
    with an ox or mule cart (u ≈ 24250–24500, v 80–250) and porters with sacks (u ≈ 24100–24500, v 200–330).
  - **逆水行舟 (u ≈ 23500–25250):** two big hulls side by side, a southern one (≈ 23550–25150, v 850–1250, a long cabin,
    about a dozen crew, the bow at the west end) and a northern one (≈ 23500–25100, v 480–900) with the mast at
    ≈ 24100–24180 and its stays; a small canopied boat at ≈ 24250–24500 (v 500–600). Which hull carries the mast and
    which crew row is the river agent's reading.
  - **The north bank, east-middle (u 24600–26800):** a building with **a pole scaffold on its roof** (u ≈ 24800–25150,
    v 0–200); big halls with long roofs (u ≈ 25050–26450, v 50–600); a far street at the very top (u ≈ 25600–26450,
    v 0–130) with people and tables; two people standing on the narrow bank in front of the halls (u ≈ 25500–25550,
    v 420–520); two boats moored along the bank (≈ 25150–25990 and ≈ 26000–26800, v 600–1000; rudders at their east
    ends, so probably bows west).
  - **The wide east bank (u 26800–29050, v 0–1000):** a great willow (trunk ≈ 26700–26850, v 550–750); 王家纸马铺 at
    the top (a tall signboard on a post at u ≈ 26850–26880, v 60–200); **a raised plank walkway with a railing**
    (u ≈ 26950–27350, v 720–900: a jetty, or the shed's deck); the sheds (a long shed ≈ 27050–27800, v 250–850; more
    sheds ≈ 27700–28350, v 150–550; the long 望楼饭铺 shed ≈ 28250–29000, v 280–650) with customers at tables; **the
    porters and the sacks** (u ≈ 27850–28350, v 600–950), a seated man among the sacks; a mooring post with a coiled
    rope (≈ 27800, v 950–1000); the **望火楼** (u ≈ 28180–28450, v 50–260, with a stair); trees at the top
    (u ≈ 27900–28200).
  - **The grain boats:** one at ≈ 27270–28100 (v 1000–1650) with **a gangplank** to the bank at ≈ 27650–27850
    (v 1030–1150); a second at ≈ 27950–28700 (v 1150–1750), half under willow crowns; a boat at the bottom
    ≈ 28300–29000 (v 1300–1780) with a ladder and a man at its east end (≈ 28790, v 1590–1680).
  - **Willows at the east end:** crowns over u ≈ 28400–29200, v 450–1800; trunks at ≈ 28750 (v 950–1200?) and a massive
    one at ≈ 28950–29200 (v 1250–1650), whose base decides its owner.
- **Seams:** S3 (the Rainbow Bridge) at u 20500 (west) and S1 (the countryside) at u 29050 (east). Both are mapped at
  the same time by other agents.
- **Build folder:** `sections/canal`. Builder: `blender/canal_scene.py`.

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`;
- `map/README.md`, the language of positions (read "Frames" → "One world across sections" closely, and **Boats**),
  and `map/BUILDING.md`, the language of building;
- `map/index.md` (status, seams);
- the skills in `/home/ran/3d_director/.claude/skills/`: `scroll-section` (restyle, "Mapping a section" and the
  playbook "Expanding to a new section"), `web-scene` and `characters`. Work through their atomic scripts;
- last round's record: `gen/expand/progress.md`, `gen/expand/outer_road_lessons.md`, `gen/expand/inner_city_lessons.md`,
  `gen/map/S4/merge_notes.md`, `gen/map/S6/merge_notes.md`;
- this round: `gen/expand/round2_progress.md`, `gen/expand/round2/phase0_questions.md` (§4 boats and water),
  `tile_plan_S1_S2_S3.md`, the neighbours' briefs `brief_rainbow_bridge.md` and `brief_countryside.md` (their seams
  with you), and **S4b's boat-pilot lessons** in `gen/expand/outer_road_2_lessons.md` once they exist.

## What you own

| path | owner |
|---|---|
| `map/strokes/S2.json`, `map/frames/S2.json` (seeded at the frame step, below), `map/world/S2.json`, `map/text/S2.md`, `gen/map/S2/` | you |
| `sections/canal/` (section.json and its two restyle halves `west/`, `east/`, notes.md, layout.json via the tool, build_choices.json, people.json, walks, shots, scene.json, backdrop.json, placed.json via the builder), `gen/sections/canal/` | you |
| `blender/canal_scene.py`, `blender/kit_canal.py` (new parts: generic functions that take positions from the caller) | you |
| `prompts/backdrop_canal_*.txt`, `gen/expand/canal_*.md` (needs, lessons, report) | you |
| S3's files (`map/*/S3.*`, `gen/map/S3/`, `sections/rainbow_bridge/`) and S1's (`map/*/S1.*`, `gen/map/S1/`, `sections/countryside/`) | their area agents: what you learn about their entities is a seam note in your report |
| `song_kit.py`, `street_b1.py`, `web/src/`, `tools/`, `map/README.md`, `map/BUILDING.md`, `map/index.md`, `map/sections.json`, the skills | the lead |
| the boat kit `blender/kit_boats.py` and `gen/boats/`; the 望火楼 set-piece kit | the boat factory; the set-piece factory (build against their fixed signatures, or stubs) |
| `kit_vehicles.py`, `characters/`, `animals/`, `trees/` (including `trees/assign/S2.json`), panels | the factories: ask through your needs list |

If you need a change in a file you don't own, work around it and put the request in your report.

## The seam with S3 (u 20500, west)

From `map/index.md` "Seams" and S3's brief (`brief_rainbow_bridge.md`, "The seam with S2"):
- the big boat under the arch (bow ≈ 20450) and its whole crew are **S3's**;
- the boat moored along the north bank from ≈ 20330–20380 eastward (v 250–480) goes by its main point (`front`, the
  waterline under the stem): most likely S2's. S3's river_e reads its ends too; if both record it, the merge settles it
  by the stem's u;
- **the boat moored along the south bank (hull ≈ 19750–20650, v 1080–1220) with men waving from its roof is S3's**
  even if its stem reads east of 20500 (S3's call: its crew belong to 上下呼救). Never record it; a seam note only;
- **the big willow at the top (trunk ≈ 20450–20600, v 0–250) is S2's** even if its trunk reads west of 20500 (S3's
  t9 leaves it);
- the big tree with the dark trunk at ≈ 20330–20420 (base at the silk's bottom edge, crown to ≈ 20800) is **S3's**; a
  second dark willow trunk at ≈ 20480–20600 (v 1150–1790) goes by its base;
- the south bank's roofs straddle the seam: each goes by the middle of its footprint corners;
- `S3.road.main` ends on the north bank at u 20500 at about v 280–330. Its last centre point is **S2's datum**:
  `S2.road.main`'s centre point 0 is S3's point there. If S3's part isn't written when S2's structures_w finishes, it
  uses its own reading at exactly u 20500 and says so; the frame step reconciles the two.

## The seam with S1 (u 29050, east)

From `map/index.md` "Seams" and S1's brief (`brief_countryside.md`, "The seam with S2"):
- the 望楼饭铺 shed (≈ 28250–29000) and its customers are **S2's**, and so is the boat at the bottom
  (≈ 28300–29000); the seated customers at u ≈ 28900–29050 (v 500–700) and the man with a dark animal at
  u ≈ 28930–29000 (v 600–700) are S2's by their main points;
- the village stalls from ≈ 29050 east are **S1's**;
- **the massive willow at the bottom right** (trunk u ≈ 28950–29210, base near the silk's edge): its base decides
  (u ≥ 29050 is S1's). S1's t1 gives its base, top and crown extremes either way; S2's t12 records it only if the base
  reads west of 29050, and says so;
- the two willows over S1's second stall (trunks u ≈ 29100–29260) are **S1's** unless a base reads west of 29050;
- `S2.road.main`'s last centre point is at **exactly u = 29050**: it is S1's datum.
- List everything else that crosses u 29050 (a roof, a path, a tree crown, a group) with its points on both sides.

## The frame

S2's frame continues S3's (`map/README.md`, Frames, "One world across sections"). It is written at the frame step,
after S3's frame and route exist; tile mapping doesn't wait for it (it is in scan px).
- **Seed:** S5's origin [8248, 1565], 77 px/m across and in height, 51.25 px of v per metre of depth,
  `covers [20350, 29200]`; the knot list **starts** with `[20500, <S3's dx at u 20500>]`.
- **Datum:** `S2.road.main:lines.centre.0`, exactly S3's north-bank route point at u 20500, with S3's station there
  (`map/world/S3.json` route and `sections/rainbow_bridge/layout.json`).
- **Water:** `supports.water` copied from `map/frames/S4b.json` (one H for the 汴河, measured on S4b's moorings).
  S2's river agents give their own reading only as a check; a different reading goes to the lead with its evidence.
- **Knots** from ground-level receding edges: tables and benches (the eatery at u 23500–24000, the sheds), the terrace's
  floor, cart shafts, a step's side, a shed's foot; grouped west, middle, east; each group's mean a knot.
- **The diminution.** S2's land is the north bank at v 0–500 for most of its length: D ≈ 21–30 m, the band the painter
  shrinks to about 0.55–0.6 (`map/index.md`, open questions). The frame keeps one scale, so every building there is
  built at real size and narrowed to its painted frontage (`BUILDING.md` rule 5). **structures_w measures the
  diminution first** (figure heights against foot v, west to east), so the user sees the evidence before S2 builds.
- **Supports:** `ground`; `water`; one `boat deck: <boat id>` per boat with crew (H = water + the freeboard under the
  gunwale); `boat roof: <boat id>` where crew stand on a cabin; `terrace floor: <building id>` (the diners over the
  water); `jetty deck: <id>`; `bank top` / `bank slope`; `fire tower platform` if anyone stands on the 望火楼;
  `upper floor: <building id>`. Each from two stroke points, with its derivation in the frame.
- The route: S3's lands on the north bank at v ≈ 280–330, and the land there is a thin strip against the silk's top
  edge. Check the route stays inside the painted area, and where the halls fill the bank (u ≈ 24600–26500) say which
  street it follows (the narrow bank in front of them, or the far street at the top), with the evidence.

## Run 1 (now): restyle, map, layout, needs. Then report and stop.

1. **Restyle** (skill `scroll-section`, "Adding a section"). **Done at setup, in two halves**
   (`sections/canal/notes.md`): the image API letterboxes an overview wider than about 3:1 (S2's whole rect,
   8864 × 1792, came back as 4096 × 1658 with white bands, and every tile's overview crop was wrong), so the area runs
   as `canal/west` (u 20336–24944) and `canal/east` (u 24592–29200), each 4608 × 1792 with a 4096 × 1600 overview
   and 5 × 2 tiles. Read with `node tools/scroll_inspect.mjs canal/west <u> <v> <half> <out>` for u < 24768 and
   `canal/east` for u ≥ 24768. Where it invents is in `notes.md` and the tile brief.
2. **Map** (skill `scroll-section`, "Mapping a section"; the units in `gen/map/S2/brief.md`, "The units"). Every agent
   keeps its scripts in `scratchpad/S2_<unit>/`. The river and structures agents are the critical path.
   - **Merge:** `node tools/scroll_map.mjs S2 merge`, with cross-unit fixes in `gen/map/S2/merge_fixes.mjs`: the boats
     named to one river unit but read by two, the tow rope's ends against t2's trackers, the "left to" lists compared,
     supports normalised, every `what` and `note` searched for painted things without an entity. The cross-key seam
     checks run at the frame step against S3 (`map/strokes/S3.json`, u 20200–20800) and S1 (`map/strokes/S1.json`,
     u 28750–29350): the same kind under 30 px apart is a seam note or a retired entity.
   - **Second pass:** fresh agents of about 2000–2500 px each (proposed: 20500–22900, 22900–25300, 25300–27600,
     27600–29050), writing proposals to `gen/map/S2/second_pass/<id>.json`.
   - **Frame and generate:** seed and knot the frame (above), then `node tools/scroll_map.mjs S2 all`. Read the full
     overlay, one dense window at zoom 1 (u 27600–28400), the boats at zoom 1, and `gen/map/S2/plan.jpg`.
3. **Layout:** `node tools/map_layout.mjs S2` → `sections/canal/layout.json`. Its `painted_area` must meet S3's at
   u 20500 and S1's at u 29050.
4. **Needs list** → `gen/expand/canal_needs.md`, prose, one line per item: casting from the 22 existing characters
   first (`characters/notes.md`; new ones likely: boatmen, trackers bent on a rope, grain porters with a sack on the
   shoulder, a man seated on sacks); the actions the clips can't show (hauling a tow rope, poling, rowing a sweep,
   carrying a sack up a gangplank); every animal with its tack; every vehicle; **every boat** (type, hull length and
   beam as mapped, cabin, mast, sweep, cargo, crew, rafted or moored to what); carried props (sacks, baskets); the kit
   parts `song_kit.py` lacks (the sheds, the terrace on posts, the jetty, mooring posts, the gangplank); the set piece
   (the 望火楼); the tree forms by count.
5. **Report** `gen/expand/round2/canal_run1_report.md`: counts per kind (boats separately); the frame (knots, any
   deviation, the water check); what was hard to read; the seam notes by S3's and S1's IDs; the needs in brief;
   anything that contradicts `sections.md`. Then stop. The lead sends Run 2.

## Run 2 (later, when the lead sends it): build, people, backdrop, check

So you know where this goes:
- **Build** `blender/canal_scene.py` the way `blender/outer_road_scene.py` is written: `derive()` from the layout;
  every piece inside `sb.entity(<map id>)`; `choice:` for every size the strokes can't give; nothing that isn't in the
  map; one invisible wall per side of the walkable area, and `edge:shore` along the shores where S4b's boat pilot says
  nobody walks. Boats from the boat kit as the pilot sets out (static where painted, crew acting in place, decks as
  colliders), the water plane at the frame's `water` H. Build headless with `tools/build_scene.sh canal` (at most
  three headless builds at once: ask the lead for a slot). `node tools/loyalty_check.mjs S2` must PASS.
- **People** (`sections/canal/people.json`, generated by a script): every painted figure at its spot, the crews on
  their decks, the trackers on their rope, no traffic.
- **Backdrop:** west, S3's strip until S3 is built; east, S1's strip until S1 is built; north, mist past the silk's
  top edge; south, the water runs into mist (rule 4).
- **Check alone** (`world.html?sections=canal`) **and joined** with S3 and S1, on your own preview server.
- **Lessons:** in `gen/expand/canal_lessons.md`, exact text for the skills.

## How to work

- Images only through `tools/shyfai_image.py`; 3D only through the factories (hosted Meshy). Boats are built from a
  kit, like the carts.
- Never cheap geometry, never anything unpainted (`map/BUILDING.md`). Build at real size and place things where they
  are painted (rule 5).
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
- Use subagents, each with its own scratchpad folder, and keep records, not progress reports.
