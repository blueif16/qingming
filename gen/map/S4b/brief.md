# Brief: mapping S4b (the outer road east, to the moorings, u 12600–15500) from the strokes

You are one of nine agents building **the scroll map** of 清明上河图 for a walkable web world, on area S4b: the second
part of the outer road (S4), from the palm-covered family carts to the river and its moorings. The map records where
every thing in the painting is, measured from the strokes, so that later sessions and builders never need to look at
the scroll again. The user wants the world "absolutely loyal to the original painting… replicate exactly what the
painting has, even to the amount of trees", and "high quality work". Every painted thing you miss will be missing
from the world; every point you misplace puts a thing in the wrong place. Precision and completeness matter more
than speed.

S4b is also **the pilot for boats and water.** Its river, banks, moorings and boats are mapped and built here first.
The user signs them off before the Rainbow Bridge (S3) and the canal (S2) are built the same way, so the boat and water
records you make here become the pattern for 20-odd more boats.

This brief is S4 part 1's (`gen/map/S4/brief.md`) and S6's (`gen/map/S6/brief.md`), filled in for S4b, with the
round 2 rules (`gen/expand/round2/mapping_rules.md`: read "Everyone" and the section for your role).

**Read first:**
- `qingming/map/README.md`: the format (IDs, points, kinds, fields, axes; follow it exactly), and its new
  paragraph **Boats**;
- `qingming/reference/scroll/sections.md` §2, the paragraph "S4 城门口外: the outer road" (what scholars say is where,
  by scan x);
- for what a finished map reads like, the first 120 lines of `qingming/map/text/S5.md`, and the east end of
  `qingming/map/text/S4.md` (your west neighbour).

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. S4b spans u 12600–15500, v 0–1790 (the silk's bottom edge is at about v 1770–1790;
  check it in your range).
- Axes: picture right = east (away from the city, toward the Rainbow Bridge), up the silk = north (away from the
  viewer). `facing_deg`: 0 = east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
- **The lay of the land** (the lead's first look, to orient you; the strokes decide):
  - **The road** comes in at the seam with its centre at about v 1206. It runs east between the two palm-covered
    carts, through open ground at u 13500–14000 (v 1000–1150), and then, it seems, along the south side of the tea
    house toward the big roofs.
  - **North side, west:** under the official hall (part 1's building) and a long roof at u 12600–13350 (v 800–1050),
    open shops with tables, people seated and standing, and a signboard at u ≈ 13050. The first palm-covered cart at
    u ≈ 12650–13050 (v 950–1200; wheel about (12850, 1150)); no team shows. A dark-roofed sedan chair with a lattice
    body beside it (its box at about u 13040–13140, v 960–1150).
  - **The crowd:** about 15–20 people at u ≈ 13100–13450 (v 350–700), round a man under the east end of a big sloping
    roof (u ≈ 12900–13300). A horse with a saddle, men and donkeys at u ≈ 13300–13550 (v 850–1100).
  - **The wheelwright** (u ≈ 13550–13750, v 650–800): men at a big wheel lying on the ground. Nearby, a pole frame
    with a hanging basket (u ≈ 13560–13700, v 450–700) and a shed with timber (u ≈ 13700–14000, v 650–950).
  - **The top of the silk** (u ≈ 13000–14700, v 0–450): a street with shops, a stall, mules or donkeys at
    u ≈ 13550–13750, and people.
  - **South side:** the second palm-covered cart (u ≈ 12900–13250, v 1270–1650; wheel about (13150, 1640)), drawn
    east by two oxen (u ≈ 13230–13550, v 1180–1500) with a driver; people with bundles round its rear; a horse at
    u ≈ 12750–12900 (v 1650–1800); open shops at the bottom (u ≈ 12600–13000, v 1450–1800); then a long row of big
    tiled roofs (u ≈ 13300–15600, v 1150–1800).
  - **East:** big trees (u ≈ 13800–14350); the tea house, an open hall with seated customers (u ≈ 14150–14950,
    v 850–1200); the bank rising to the river, with a path and a few people on it (u ≈ 14300–14900, v 330–900); the
    river at the top right (u ≈ 14450–15650, v 0–900), coming in from beyond the silk's top edge.
  - **The moorings:** boats rafted side by side, sterns to the bank at u ≈ 14850–14950, bows east to
    u ≈ 15250–15450, stacked up the silk, the biggest at the bottom (the lead's look: four, at about v 120–270, 230–330,
    330–450 and 450–850; the setup agent's look and the restyle: five, with one more hull at about v 340–440: count);
    one more boat at the top (hull u ≈ 15190–15470, v 30–160); lines running east from the rafted boats
    (u ≈ 15100–15450, v 350–450); a few crew on deck; willows on the bank at u ≈ 15100–15550 (v 850–1300).
  - Just past the east end (S3's, never record them): a boat under way at u ≈ 15550–15900 (v 260–550) with its crew,
    and the long riverside hall whose roof starts at u ≈ 15530.

## Tools for looking

Keep every script, crop and scratch file in **your own folder**,
`/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/S4b_<unit>/` (for example
`S4b_t2/`, `S4b_river/`). Up to 14 agents of five areas run at once; generic names collide.

- `node tools/scroll_map.mjs S4b overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out <your folder>/<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg.
- `node tools/scroll_inspect.mjs outer_road_2 <u> <v> <half> <your folder>/inspect_<u>_<v>.jpg` shows the scroll
  beside our registered AI restyle (`gen/sections/outer_road_2/mosaic.jpg`, which covers u 12448–15664) with a grid
  (half ≤ 300 → 3× zoom). The restyle helps read faded silk, but it is a repaint: **positions come from the scroll's
  strokes**, and anything visible only in the restyle gets `"conf": "low"` and a note saying so. **The restyle also
  invents: never record a thing because the restyle shows it.** Where it invents in S4b is listed below, "What the
  restyle invents here".
- `node tools/scroll_map.mjs S4b overlay --parts gen/map/S4b/parts/<unit>.json --grid 50 --x U0-U1 --zoom 1 --out gen/map/S4b/look/<unit>_overlay.jpg`
  draws your entities on the scan (your final self-overlay goes in `gen/map/S4b/look/`; working crops stay in your
  folder); `node tools/scroll_map.mjs S4b check --parts gen/map/S4b/parts/<unit>.json` validates the format. Warnings
  about supports not in the frame are fine; list the support names you used in your report. Errors are not.

## How to measure

- Work systematically: walk your range in columns about 200 px wide, top to bottom (v 0 to the silk's edge), and list
  everything in each window before moving on. **Small, distant, half-hidden and indoor things count**: figures far up
  the silk, behind trees, in doorways, inside open shop fronts, at tables, on the far side of a cart, a head showing
  over a roof, a child at a shoulder, a dog, a bird. **Count the painted figures in every crowd one by one, head by
  head at zoom 3 with the grid**: the crowd round the seated man, the tea house's customers and the people at a stall
  are individuals, each with an entity. The silk is darkened under roofs and awnings. Before finishing, re-walk your
  range once more looking only for figures you missed.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put the
  point where the feet must be from the body (e.g. under the hips for a figure behind a cart or counter) and mark it
  `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what`. A lying figure: `foot` = the
  middle of the body on the ground; say which way the head lies. A kneeling figure: `foot` at the knees. A rider: a
  figure entity with `pose: "riding"`, `support: "animal S4b.ani.<id>"`, `foot` = ground point straight under the seat
  (`est`), plus the animal as its own entity. A child: say "child" in `name` and `what`, and give its painted height
  against the adults' in `note` (the build scales children).
- `head` = top of the head or hat. Painted height = foot v − head v; say in `note` when it is far from the neighbours'.
- **Animals:** `fore` = ground under the front hooves (their midpoint), `hind` = ground under the hind hooves, `head` =
  the head. In `what`: species as painted (ox / water buffalo / donkey / mule / horse / dog / pig), colour, pose
  (standing, walking, lying, head down), tack and load (yoke, collar, saddle, saddle cloth, panniers, bridle, pack
  frame), and who rides, leads or drives it. A cart's team: say which vehicle each animal draws and where it stands in
  the team (shaft animal, lead animal on traces, near or far side).
- **Vehicles** (carts and sedans; boats are below): `front` / `rear` = ground under the front end (where the shafts
  end, or the front of the body if the shafts are hidden) and the rear end; `wheels` = where each visible wheel touches
  the ground. **A sedan chair is a vehicle**: `front` / `rear` = ground straight below the front and rear ends of its
  carrying poles (`est`), no wheels; its bearers are figures in a group with it. In `what`: the type (palm-covered
  family cart 大棕盖车, covered ox cart, sedan chair 轿, handcart, 串车 barrow), body, roof (palm thatch, mat barrel
  roof), load, wheels, shafts, yoke and traces, and the team. In `note`: the wheel's rim extents and hub in px
  (**SCALE CUE**: a wheel's diameter is a real-size check), the body's length and height, and the shafts' or the
  body's receding edge as **DEPTH DIRECTION** with its two stroke points `(u1,v1) -> (u2,v2)` and slope dv/du.
- **Trees:** `base` = where the trunk enters the ground (`est` if hidden), `top` = highest point of the crown,
  `crown_w` / `crown_e` = the crown's west and east extremes. In `what`: species as painted (willow with long whips,
  bare elm-like with twisted branches, pine-like with needle clusters, other), size, lean, leafing, number of trunks.
  A clump of several trunks from one foot is one tree; separate trunks with separate feet are separate trees. Record
  another tree only where its own trunk shows (part 1's lesson on `S4.tree.willow_12588`).
- **Props:** anything that stands on the ground (or on a floor) and isn't a building: stalls and their tables,
  benches, stools, chests and boxes set down, baskets, jars, barrels and drums, sacks, piles, timber piles, **loose
  wheels**, umbrellas and parasols, mat awnings and canopies on their own poles, racks and pole frames standing on
  their own, free-standing signboards and lamp-boxes, flags on their own poles, hitching posts, **mooring posts and
  stakes on the bank**. `base` point (or footprint corners via `pts.base` {sw, se, ne, nw} for bigger ones). A row of
  identical things standing together can be one prop: give the **exact count** in `what`. Furniture inside an open
  shop front counts.
- **Carried and worn things** (a pole and its baskets on a shoulder, an umbrella held up, a fan, a bundle on the back)
  are part of their carrier: describe them in the figure's `what`. Anything set down, propped or hung on its own is a
  prop entity. A visible bench or stool a figure sits on is its own prop (the figure's `what` names it by ID); a seat
  hidden under a figure is not recorded.
- **Signboards and written characters** go in `what` exactly as painted, character by character, top to bottom
  (traditional characters as written; □ for an illegible one, and say which are unclear).
- **Every painted thing is its own entity.** If your `what` or `note` mentions a painted thing ("a basket stands at his
  feet", "a dog sniffs at the cart", "a bird on the branch"), that thing needs its own entity too, or a line in your
  "left to" list naming who owns it. Before finishing, read every `what` and `note` you wrote and check this.
- **Groups:** when several entities do one thing together (a cart and its team and driver, the crowd and the seated
  man, the wheelwright's men and their wheel, a stall and its seller and customers, a sedan and its bearers, a boat and
  its crew), add a `group` entity with `members` and a `what` that says what the group is doing, and set `group` on each
  member. A group lists only S4b IDs; a link to an S4 entity goes in the group's `note`.
- **IDs:** make the slug say what the thing is and end it with the u of its main point so IDs never collide between
  agents: `S4b.fig.listener_13312`, `S4b.ani.ox_shaft_13350`, `S4b.veh.palm_cart_13230`, `S4b.tree.willow_15470`,
  `S4b.prop.loose_wheel_13620`, `S4b.veh.boat_grain_15420`, `S4b.grp.crowd_seated_man`.
- `what` is what someone who never sees the picture will read: dress (colour, robe or short jacket, hat or cap or
  kerchief), sex and age, action, what the hands hold, which way the head turns, the load, the state of a tree. One or
  two sentences, concrete. It is also what the casting of characters is decided from, so say what kind of person it
  is (official, scholar, servant, porter, carter, sedan bearer, wheelwright, boatman, tea-house keeper, woman, child).
- Use `src` when sections.md or the 名画记 pins name the vignette (`余辉: 豪车云集`, `余辉: 车铺劳作`, `余辉: 小铺闲坐`,
  `余辉: 客家登船`, `名画记: 大棕盖车 (pin 27)`, `名画记: 大车修理店 (pin 26)`). Use `vis` and `conf` honestly.
- **When the painting is ambiguous, say so in `note` and lower `conf`. Never resolve it silently.** Faint things that
  change the cast or the build (a third ox, two people in one hunched mass, a robe or a hanging cloth) are recorded
  with `conf: low` and a note giving both readings, never dropped.

## Boats and water (the river agent; everyone should know the convention)

From `map/README.md`, Boats (Phase 0 §4):
- **A boat is a vehicle**: ID `S4b.veh.boat_<type>_<u>`, kind `vehicle`. `front` and `rear` are **the waterline under
  the stem and under the sternpost** (`est` where a rafted neighbour or the bank hides them). Optional points:
  `beam_n` and `beam_s` (the waterline at the hull's widest, far and near side), `bow_top` and `stern_top` (the gunwale
  straight above front and rear: the freeboard), `mast` (its foot on deck) and `mast_top`. `support: "water"`. `pose`:
  moored, rowed, poled, towed, sailing, drifting or lowering mast. `facing_deg`: the way the bow points.
- In `what`: the type (grain boat, passenger boat with a cabin, small sampan), the hull, the cabin (roof form, windows,
  doors), the mast and rig (up, lowered, absent), the sweep (橹) and oars, the cargo, and **which boat it is rafted to
  and what it is moored to** (by ID). In `note`: the **SCALE CUE** (hull length and beam in px, a cabin door's height)
  and the evidence for the waterline (where the hull meets the water strokes).
- **Parts of the boat:** mast, rig, cabin, sweep and oars, ropes, gangplank and deck cargo. A rope's or a plank's
  **far end names what it reaches, by ID** (a post on the bank, a stake, another boat, a tracker). Posts and stakes on
  the bank are props: the tile agent's if they stand on land, the river agent's if they stand in the water's edge.
- **The crew:** each person on a boat is a figure with `support: "boat deck: <boat id>"` (or `"boat roof: <boat id>"`
  on a cabin roof), `foot` where the feet are on the deck (est behind a gunwale), and in `note` the v of the gunwale
  and of the waterline straight below the figure. Each boat and its crew form a group.
- **The water:** each reach is a `water` entity (`S4b.water.bian_river`; it is not the route) with
  `pts.lines: {"shore_n": [[u, v], ...], "shore_s": [[u, v], ...]}` (where water meets land; a line stops where the
  silk's edge cuts it, and **ends at u 15500**). **Lines always go inside `pts`** (`pts.lines` keyed by role, or one
  `pts.line` with a top-level `role`), as in `map/strokes/S5.json`'s `S5.water.moat_south_8700`. Written outside
  `pts`, the check fails with "no ground points". The banks are `grd` with `pts.lines.bank_top` (and the shore as
  the bank's foot). Landing stairs and jetties are structures (`S4b.str.landing_stair_<u>`).
- **The water level** (the frame support `water`, one H for the whole 汴河, reused by S3, S2 and S1) is measured by
  the river agent: see "The river pass" below.

## Supports

`support` is what a thing stands on. Use these names (their heights go into the frame afterwards):
- `ground`: the road, yards, open shop floors at road level;
- `official hall floor`: the floor of `S4.bld.official_hall_12530` (part 1's building; H 0.45, already in the frame);
- `cart bed: S4b.veh.<id>`: a driver or passenger on a cart; `sedan: S4b.veh.<id>`: someone seated in a sedan (foot
  est on the ground under the seat);
- `animal S4b.ani.<id>`: a rider;
- `carried in arms`, `shoulders`, `carried on back`: a child carried (its own figure, foot at the carrier's foot);
- `ground: on <prop id>`: standing or sitting on a prop whose base is on the ground; `table top: <prop id>`;
- `water`: boats; `boat deck: <boat id>`, `boat roof: <boat id>`: their crew;
- `bank top`, `bank slope`: a figure or thing on the raised river bank (u ≈ 14300–15500), not on the road's level. In
  `note` give the v of the bank's foot and top under it, so the frame can give the bank its H (things on raised ground
  mapped at H 0 read about 1.5 m of depth per metre of height too far north: part 1's lesson);
- `upper floor: <building id>`: any upper storey (in `note`, the v of the floor line under the figure);
- anything else: say it in words and report it.

## Ownership

You own entities whose **main point** has u inside your range, [start, end): a figure's foot, an animal's fore, a
vehicle's front (a boat's: the waterline under the stem), a tree's base, a prop's base; for buildings and structures,
the middle of their footprint corners. Look about 150 px past both ends for context, and don't record things owned by
the next unit. A group that crosses the boundary goes to the unit holding most of its members; list your own members
and name the others in your report (by what and where), so the merge can join them.

**Who records what:**
- **Tile agents** (`t1`–`t5`, by range): everything on land: figures, animals, vehicles (carts, sedans), trees,
  props, groups. Nothing on the water or on a boat.
- **Structures agents** (`structures_w`, `structures_e`, by range): every building, structure (walls, fences, railings,
  gates, stairs on land, platforms, sheds), road and ground feature on land. `structures_w` records **`S4b.road.main`
  for the whole area**; the others record only side streets.
- **The river agent** (u 14300–15500): everything on or in the water: the water and its shore lines, **the banks**,
  landing stairs and jetties, every boat with its ropes, planks and cargo, and everyone on a boat.
- **The in-between kinds:** awnings, canopies and parasols on their own poles, stalls, signboards on posts, lamps by a
  door on their own pole, loose wheels, timber piles and pole frames standing on their own are the **tile agents'
  props**, even when they lean on a building. Writing, plaques, boards, curtains, lamps and pole frames **fixed to or
  hung from a building** are part of the building (the structures agent writes them in its `what`). Anything touching
  the water (shore lines, banks, landing stairs, jetties, boats, what is on a boat, posts standing in the water's edge)
  is the river agent's. A tracker or a person on the bank holding a boat's rope is a tile agent's figure (the rope is
  the boat's). **If unsure, record it as your prop: a duplicate is easy to drop, a miss is not.**
- **Every agent ends its report with the list of painted things it saw and left to another agent** (what, where, to
  whom). The merge compares these lists; the things everyone left are the most common misses.

## The units

| unit | owns u | looks at u | density | what to find (hints to verify, not facts) | seams and boundary notes |
|---|---|---|---|---|---|
| `t1` | 12600–13050 | 12450–13200 | very dense: about 30–35 figures | the shops under the long roof (tables, people seated and standing, a signboard at u ≈ 13050); **the first palm-covered cart** (豪车云集) with no team: settle which way it faces on a zoom-3 crop (the shafts or the closed end; a person at its front); **the sedan chair** beside it; the seated official inside `S4.bld.official_hall_12530` (support `official hall floor`) and the figure by the stair; the bottom shops (u 12600–13000, v 1450–1800); the people round the second cart's rear; the horse at u 12750–12900 (v 1650–1800); part 1's "not yet mapped" list (below) | **t1 owns the first palm-covered cart and the sedan chair whichever way they face** (their fronts may fall past 13050; t2 does not record them). Every S4 seam ID below is a seam note, not an entity |
| `t2` | 13050–13500 | 12900–13650 | very dense: about 30–38 figures | **the crowd round the seated man** (u 13100–13450, v 350–700; storyteller? fortune-teller? Hansen names "the wheelwright, storyteller and fortune-teller": say what the strokes show, the seated man's props and what the crowd does); **count it head by head at zoom 3**; **the second palm-covered cart** (名画记 pin 27 大棕盖车 at 13120) with its two oxen and driver; the saddled horse, the men and donkeys (u 13250–13550, v 850–1110); the child near the sedan; the people round the cart's rear wheel; the top street's people (v 0–450) | the second cart, its team and driver are t2's (the cart and its team stay with the tile holding most of them); the horse-and-donkeys group goes to the tile holding most of its members |
| `t3` | 13500–14100 | 13350–14250 | dense: about 20–25 | **the wheelwright** (余辉 车铺劳作, 名画记 pin 26 大车修理店 at 13620): the men at the big wheel lying on the ground (the wheel is a **prop**: `S4b.prop.loose_wheel_<u>`, with its rim extents as a SCALE CUE and its ellipse's axes as a DEPTH cue); **the pole frame with a hanging basket** (u ≈ 13560–13700, v 450–700: a prop if it stands on its own, with the basket in its `what`); timber piles at the shed; the mules or donkeys and the people of the top street (u ≈ 13550–13750, v 300–450); big trees (u ≈ 13800–14100) | the shed is `structures_w`'s; the first crossroads (张安治) may be a cross street north at about u 13450–13700: the structures agent maps it, you map who is on it |
| `t4` | 14100–14850 | 13950–15000 | medium: about 20–25 | **the tea house's customers** (余辉 小铺闲坐? seated at tables in the open hall, u ≈ 14250–14750, v 1000–1200) and its furniture; the top shops' people (u 14000–14600, v 0–300); **the people on the bank path** (u ≈ 14300–14700, v 300–700: support `bank top` or `bank slope`); trees (u ≈ 14100–14350) | **nothing on the water or on a boat** (the river agent's); the bank itself is the river agent's |
| `t5` | 14850–15500 | 14700–15650 | open on land: about 10–15 | the people on the bank and by the moorings' landing (余辉 客家登船? someone boarding: a figure on a plank or a boat is the river agent's, a figure on land at the plank's foot is yours); **the willows** (u ≈ 15100–15550, v 850–1300): the willow with its trunk at u ≈ 15450–15500 is S4b's and yours, with a seam note for S3 about its crown; **mooring posts and stakes on land** | the S3 seam (below); nothing on the water or on a boat |
| `structures_w` | 12600–14000, plus `S4b.road.main` over the whole area | 12450–14150 (the road: 12450–15650) | about 10–12 buildings | the long roof over the shops (u 12600–13350, v 800–1050); the big sloping roof by the crowd (u ≈ 12900–13300); the top street's shops; the wheelwright's shed; the south roofs (u 12600–14000, v 1150–1800); **the crossroads**: a cross street north at about u 13300–13700?; the road | the S4 seam IDs below; **the road's datum at exactly (12600, 1206)**; the receding-edge table, **nearest ground edges to the seam first** |
| `structures_e` | 14000–15500 | 13850–15650 | about 8–10 buildings | the tea house (the open hall, u ≈ 14150–14950, v 850–1200: posts, tables' platform, roof, any sign); the top shops (u ≈ 14000–14700, v 0–300) with any fence; the long south row (u ≈ 14000–15500, v 1150–1800) | the long riverside hall from u ≈ 15530 is **S3's** (a seam note if you see its west end); **the banks and anything touching the water are the river agent's**; the road east of 14000 is `structures_w`'s, but give it your reading of the road's edges east of 14000 in your report |
| `river` | everything on or in the water, u 14300–15500 | 14150–15650 | about 5–6 boats with about 10–15 crew | the river reach, its shores and banks; **the moorings**: four or five rafted boats (sterns to the bank at u ≈ 14850–14950, bows east to u ≈ 15250–15450, v ≈ 120–850, the biggest at the bottom; count stems and sterns at zoom 3) and one at the top (scan hull u ≈ 15190–15470, v 30–160); the lines running east from the rafted boats (u ≈ 15100–15450, v 350–450: what do they reach?); the crew; landing stairs, planks or jetties; **the water level**; the shore points at u 15500 | the biggest rafted boat (bow ≈ 15450) is **S4b's**; the top boat is S4b's if both its ends are west of 15500 (check, and say so); the boat under way at u ≈ 15550–15900 and its crew are **S3's** (a seam note only) |

## The seam with S4 part 1 (u 12600), for t1 and structures_w

Entities that straddle the seam stay S4's, and part 1's builder builds them. You map the rest of such a thing **as a
note on the same ID, in your report** (the lead applies it). Never make an S4b entity for an S4 thing. Part 1's map is
`map/strokes/S4.json` (read it; never edit it).

- **`S4.road.main`** continues east as `S4b.road.main` (structures_w): its centre at u 12600 is scan (12600, 1206)
  (interpolated between part 1's (12500, 1200) and (12750, 1215)). **That is your datum: `S4b.road.main`'s
  `pts.lines.centre` point 0 must be exactly `[12600, 1206]`** (the frame refers to it as
  `S4b.road.main:lines.centre.0`). The centre line runs west to east (increasing u). At u 12600
  part 1's `edge_n` is v 972.5 (the official hall's platform front) and its `edge_s` v 1484 (est: the hidden north
  walls of the south halls): start your edges there unless the strokes say otherwise, and say so. Part 1's line runs
  on to u 12750, but yours starts at 12600.
- **`S4.bld.official_hall_12530`** is part 1's, built whole to its est east end (u ≈ 12960–13000), floor 0.45 m, eave
  2.8 m (`blender/outer_road_scene.py:675–688`). Don't record the hall. Give its true east end, posts and railing as a
  seam note on its ID (structures_w). A lamp hanging from the hall is part of the hall (a seam note); a lamp on its own
  pole is a prop (t1). What is inside or in front of it east of 12600 is t1's:
  - the seated official at u 12700–12755 (v 853–916), support `official hall floor`;
  - the figure by the stair.
- **`S4.bld.south_hall_12350`** is part 1's (a placeholder footprint to u 12850; open-front columns at 12540 and
  12695). t1's: the table the child reaches to (top u 12599–12683, v 1638–1642, legs to v ≈ 1705); the barrel or drum
  at u 12650–12700 (v 1680–1790). structures_w's: the next roof east of u 12700; and a seam note on the hall's true
  east end.
- **`S4.prop.parasol_12572`** is part 1's (its canopy reaches 12635). The small figure under it is t1's if its foot is
  east of 12600.
- **`S4.tree.willow_12588`** is part 1's (crown to 12750). Its note says the whips at 12600–12750 may belong to further
  trees: record another tree only if its own trunk shows.
- **`S4.fig.child_at_table_12597`** and **`S4.prop.slatted_crate_12576`** are part 1's.
- **Part 1's "not yet mapped" list, t1's** (`map/index.md`, "S4 inner seam"): the seated official, a small boy, a big
  jar, a figure by the stair, a small figure under the parasol, the table and a drum at 12600–12700, a hanging lamp (a
  seam note if it hangs from the hall), roofs behind the pines (structures_w), and the palm-covered cart's roof at
  12690–12920 (t1: it is the first cart).
- Part 1's other entities near the seam (their points reach past 12450): `S4.fig.man_seated_by_tree_12512`,
  `S4.tree.gnarled_willow_12390`, `S4.tree.bare_whip_clump_12345`, `S4.prop.mat_awning_12066`,
  `S4.bld.south_hall_12100`. Don't record them again.

## The seam with S3 (u 15500), for t5, structures_e and the river agent

Settled in Phase 0 (`gen/expand/round2/phase0_questions.md` §5, `map/index.md`, Seams). S3 may be mapped at the same
time by another agent.
- the long riverside hall (roof from u ≈ 15530 to ≈ 16450, lattice windows, a railed veranda) is **S3's**;
- the biggest rafted boat (stern ≈ 14880, bow ≈ 15450, v 450–850) is **S4b's** (river);
- the willow whose trunk stands at u ≈ 15450–15500 (v 1000–1400) is **S4b's** (t5), with a seam note for S3 about
  its crown over the hall;
- the boat under way at u ≈ 15550–15900 (v 260–550) with its crew is **S3's** (名画记 pin 25 河边泊船 (纤夫), 15690);
- the river runs across the seam: the river agent maps S4b's reach, **ends its shore lines at u 15500**, and gives
  their points there in its report (for S3's agent and the lead);
- `S4b.road.main` ends at u 15500: **its last centre-line point is at exactly u = 15500** (S3's datum is S4b's road
  centre there), with its v as the strokes give it;
- list everything else that crosses u 15500 in your report, with its points on both sides.

## The structures pass (structures_w and structures_e)

- **Buildings** (`S4b.bld.<slug>_<u>`, the named ones by name: `S4b.bld.tea_house_14500`): `base` corners `sw`, `se`,
  `ne`, `nw` by compass (front = the side the main entrance faces: a house north of the road fronting it faces south,
  `facing_deg` 270; one south of the road facing it faces north, 90). Heights straight above base corners:
  `<corner>_eave`, `<corner>_ridge`, `<corner>_top`. `bays`: the column feet along the front. Hidden corners `est`,
  with how they were estimated in `note`. **Buildings seen only as roofs** (the long south row, bases behind the roofs
  or below the silk) get placeholder corners, said in the note (the builder settles them as `choice:`). In `what`:
  storeys, roof type (hip, hip-gable 歇山, gable, thatch), open front or walls, doors and windows, what the shop sells,
  **every signboard, banner, curtain, lamp or awning hung on it, with the characters exactly as painted** (□ for
  illegible). Two storeys: the upper floor's line in `note` ("UPPER FLOOR: floor line at v … over u …").
- **Structures** (`str`): walls, fences, railings, stairs and platforms on land, the wheelwright's shed if it is a
  frame without walls (or a `bld` if it has a roof and walls: say which), a well.
- **Roads.** `S4b.road.main` (structures_w): `"route": true` at the top level and
  `pts.lines: {centre, edge_n, edge_s}` (as `S4.road.main` in `map/strokes/S4.json`), each line west to east. Centre
  point 0 is exactly `[12600, 1206]` and the last centre point is at u 15500. No road edge is drawn as a line: the
  edges are where the open ground stops (building fronts, platform fronts, the roofs of the south row). A cross
  street is its own road, `S4b.road.cross_<u>`, with `pts.lines: {centre, edge_w, edge_e}` running south to north.
  Say where it meets the main road and where it leaves the silk. Paths (the bank path) are the river agent's if they run on the bank.
- **Ground features** (`grd`) on land: yards, a raised step or platform along shop fronts, a drain, open ground.
- **The receding-edge table** (for the frame's `dx_knots`): ground-level receding edges, each as two stroke points
  `(u1,v1)->(u2,v2)` with its slope dv/du and what it is: furniture (tables, benches), the carts' shafts and bodies
  and the sedan's poles (read them yourself; the tile agents record the vehicles), the wheel lying on the ground, a
  platform's or a step's side, a wall's foot, a ditch. Eaves and ridges only where nothing at ground level recedes,
  and say so (they flatten with height: part 1 measured ground −1.4 to −2.0, high lines −0.56 to −0.61). Group them
  west, middle and east. **structures_w: put the nearest ground edges to the seam first** (u 12600–13300): they are the
  first ground evidence east of u 11420, where part 1 kept dx 31.6 with no ground edge. If they read outside
  31.6 ± 5 px/m, say so at the top of your report with the stroke points.
- **SCALE CUES** in px, in `note` and your report: door heights, column heights and spacing, steps, railings, table
  heights, window sizes, each with its foot v (the frame step compares them with the painter's diminution up the silk).

## The river pass (the river agent)

Everything in "Boats and water" above, plus:
- **The water level, measured with care.** The frame support `water` is the river's surface, one H for the whole
  汴河; S3, S2 and S1 reuse it, and 1 m of error moves every boat and shore point 1.5 m north or south. Find two or
  three places where the bank meets the water at a **vertical face, a stair or the moorings' bank**, and at each take
  two stroke points: the waterline, and a point straight above it at ground level (the road's level where the bank is
  at street level, or the bank top with its own height said). In this frame height moves a point only in v, so
  "straight above" means the same u. H of the water = H_ground − (v_waterline − v_ground) / 77 m (77 px per metre in
  height; H_ground is 0 at the road's level). Write each derivation in your report (the
  points, what they are, the H), and the spread between them. Say which places you trust most and why.
- **Deck heights:** for each boat with crew, the gunwale and the waterline straight below it (two stroke points: the
  freeboard), so the frame can give `boat deck: <id>` its H.
- **Shore points at u 15500** (north and south shore, and the bank top), for S3.
- **Boat scale:** the painter shrinks things up the silk (part 1: 0.9 of the road's scale at v 850, 0.5 at v 320, 0.3
  at v 220). Give every hull's painted length and beam in px and the crew's painted heights with their foot v, so the
  build can set real-size hulls at their painted places (`map/BUILDING.md` rule 5).
- Rafted boats: say the order (which is outermost), the gaps, and which hull hides which point.
- Write `gen/map/S4b/parts/river.json`.

## What the restyle invents here

(Written from the restyle's check sheets, `gen/sections/outer_road_2/check/`, and side-by-side zooms; the full list is
in `sections/outer_road_2/notes.md`.) The restyle keeps the layout well: registration moved the tiles by at most 6 px,
and the buildings, carts, oxen, the wheel on the ground, the pole frame and the hulls are where the strokes put them.
It is the right tool for reading *what* a faded thing is, and **the wrong tool for counting**. On part 1 it turned a
willow's stem into a man and a lying horse into a bush. Here it invents in these places (scan px):

- **Everyone: trees.** It leafs the willows green with full weeping crowns where the scan has bare whips and twigs.
  Take species, leafing and trunk count from the scan only.
- **t1: the horse at the second cart's rear** (u 12790–12980, v 1520–1790). It seats a rider in a big black hat on
  the horse and adds a man in blue bending at its west end. On the scan, the broad hat (u 12860–12920, v 1520–1570)
  may be a rider's or a man's behind the horse, and the west end may be the horse's own head and neck. Read both at
  zoom 3; `conf: low` with both readings if it stays unclear.
- **t2: in front of the seated man** (u 13240–13320, v 560–650). It piles round baskets and bowls; the scan shows a
  dark patterned shape (a mat? a low table? goods on a cloth?). Record what the strokes show.
- **t2: the man with a stick below the crowd** (u ≈ 13340–13400, v 665–820). The restyle makes the tall dark shape
  over his head (u 13355–13385, v 669–710) a stacked load carried on the head. It may be a tall hat. It changes the
  cast: record both readings.
- **t2 and t3: the horse group** (u 13300–13590, v 870–1110). The restyle shows five people round one saddled horse,
  and the scan's small donkey at u ≈ 13470–13560 (legs at v 1060–1110) becomes a man in blue bending over. Count the
  animals by their legs on the scan.
- **t3: the wheelwright** (u 13560–13800, v 640–790). At the wheel's west end the restyle draws two men (one in blue
  added) where the scan shows one man bending. East of them it draws a saddled mule and a man in white where the scan
  has a blocky object (a workbench? a trestle?) and one or two figures. Count the men on the scan. East of the wheel
  (u 13800–13940, v 860–970) it draws sacks and bundles; the scan has a dark mass there.
- **t4, t5 and river: the bank by the boats' sterns** (u 14680–14880, v 200–490). This is the worst spot. The
  restyle invents:
  - a stack of sacks with a seated man in blue (u 14800–14880, v 210–330), where the scan has a rafted boat's dark
    stern;
  - a kneeling figure beside the porter (u 14760–14830, v 340–400);
  - 2–3 figures heaped with bundles round a bench (u 14680–14830, v 400–480).

  **The scan has three figures there:** two at u 14650–14700 (v 340–410), one of them small, and a porter with two
  baskets on a pole at u 14760–14800 (v 340–410).
- **t4 and t5: the tea house's east end** (u 14740–15050, v 1030–1250). It adds:
  - a dark-clad figure bending at u 14830–14880 (v 1060–1140), where the scan has posts and branches;
  - a man in red reclining at u 14920–14970 (v 1020–1100), where the scan has a light standing figure and a reddish
    patch;
  - white animal-like shapes in the branches at u 15000–15040 (v 1080–1150);
  - a drum with a painted face beside the figure at u 14740–14830 (v 1170–1240).
- **river: the moorings** (u 14840–15520, v 30–830).
  - *Hull count.* The lead's first look counted four rafted boats and one at the top. The restyle draws five rafted
    hulls, and the scan seems to agree: a hull at about v 340–440 lies between the long-cabin boat (v 190–330) and the
    boat with the round mat roof (v 410–520). Count stems and sterns at zoom 3; take neither number on trust.
  - *Crew.* It draws two seated figures on the biggest boat's cabin (u 15030–15080, v 460–520) where the scan has one
    (u 15000–15040, v 480–520). It moves the seated figure at the bow of the boat above the biggest about 50 px east
    (scan u 15355–15380, v 455–490).
  - *The top boat.* It lengthens the hull east to ≈ 15520 (the scan's hull runs u ≈ 15190–15470), adds a mast and a
    crewman bending (u 15330–15370, v 40–90).
  - *The top edge.* It paints a far shore there with a tiled house (u 15100–15190, v 10–80) and two willows
    (u 15200–15400, v 0–60); the scan shows only faint vertical strokes.
  - *The water.* It is painted as a pale sheet, so **take the shore lines from the strokes** (where the bank's wash
    and the ripple lines stop), never from the restyle's colour edge.

## Finish

1. Write your file as `{"section": "S4b", "entities": [...]}` to `gen/map/S4b/parts/<unit>.json` (nothing else in
   the repo: scratch in your own folder).
2. Run `node tools/scroll_map.mjs S4b check --parts gen/map/S4b/parts/<unit>.json` until it says PASS. Then the
   overlay over your whole range (zoom 1, grid 50) into `gen/map/S4b/look/<unit>_overlay.jpg`, and zoom-2/3 windows
   over every dense part. Read every overlay image. **Every marker must sit on its thing** (feet on the ground contact,
   heads on heads, a boat's front at the waterline); fix and repeat until it does. Then make one more pass over your
   range looking only for what you missed (heads in crowds, things in doorways, far figures, props at building bases,
   things behind carts and trees, crew behind a gunwale).
3. Write your report to `gen/map/S4b/reports/<unit>.md`:
   - counts by kind (figures, animals, vehicles, boats, trees, props, buildings, structures, roads, water, grd, groups);
     the crowds and how many figures you counted in each;
   - what was hard or ambiguous, faded areas, and what you read with the restyle (with `conf`);
   - the seam notes **by the neighbour's ID** (S4 or S3), and things at your range's edges that a neighbouring unit may
     also record (with their points); groups that cross your edges;
   - the support names you used (and how high they look);
   - scale cues (wheels, doors, tables, sedans, hulls) and receding edges you saw, as two stroke points each;
   - the list of painted things you saw and **left to** another agent (what, where, to whom);
   - anything that contradicts `reference/scroll/sections.md`;
   - **lessons**: what you learned that the next round should know, as exact text for the skill.
4. Your final answer is the short structured result the workflow asks for; the long text goes in the report.
