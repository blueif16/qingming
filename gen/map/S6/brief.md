# Brief: mapping section S6 (the inner city) from the strokes

You are one of several agents building **the scroll map** of 清明上河图 for a walkable web world. The map records
where every thing in the painting is, measured from the strokes, so that later sessions and builders never need
to look at the scroll again. Errors here become errors in the world, and anything you leave out will not exist in
it, so precision and completeness matter more than speed. The user: "absolutely loyal to the original painting…
replicate exactly what the painting has, even to the amount of trees"; "I want high quality work".

S6 is the densest part of the scroll: the inner city, with crowds, the storyteller's ring, sedans, mule wagons and
many shops. S5 (the gate, east of u 5600) was mapped the same way: `map/text/S5.md` shows what a finished section map
reads like (read its first 120 lines to see the level of detail expected in `what` and `note`).

**Read first:** `qingming/map/README.md` (the format: IDs, points, kinds, fields, axes; follow it exactly), then
`qingming/reference/scroll/sections.md` §2, the S6 paragraph (what scholars say is where, by scan x), and §1.4 (the
名画记 pins in S6: 37 正店门前 5590, 38 栀子灯 5060, 36 孙羊家正店 4530, 40 城里的商铺 3920, 39 闹市说书 3840,
42 久住王员外家 3310, 43 便面 3250, 44 赶考士人 3240, 41 香药铺 3200, 47 方井 2110, 46 行脚僧 2100, 45 "解"字招牌 2070).

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. Section S6 spans u 2000–5600, v 0–1790 (the silk's bottom edge is at about
  v 1770–1790; check it in your range).
- Axes: picture right = east (toward the gate, S5), up the silk = north (away from the viewer). `facing_deg`: 0 =
  east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
- Layout, roughly (read the strokes, not this): the main street runs east-west across the middle of the silk (S5's
  road arrives at u 5600 with its centre at v ≈ 1250, its north edge at the building fronts ≈ 885 and its south
  edge behind the south-side roofs ≈ 1440). 孙羊正店 fills the north side from about u 4300 to 5500, two storeys,
  with its 彩楼欢门 (flowered scaffold gateway) and lamp-boxes; its upper storey is full of drinkers. The crossroads
  is at about u 3200–3850: a cross street runs up the silk (north) with two mule wagons swinging round the corner at
  the top. The south (bottom) edge is roofs: the inn 久住王员外家 and other houses, cut by the silk's edge. West of the
  crossroads: the donkey cart with wine casks (lower edge), the paper-horse stall under big umbrellas (u ≈ 2250–2600,
  v ≈ 650–850), big willows, and the square well (u ≈ 1900–2200, v ≈ 830–960) at the west end. Below the well, at
  the lower edge, the 解 sign (u ≈ 2000–2050) and its ring of young men.

## Tools for looking

- `node tools/scroll_map.mjs S6 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out gen/map/S6/look/<tile>_<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg. Write crops only under
  `gen/map/S6/look/`, named after your tile.
- `node tools/scroll_inspect.mjs inner_city <u> <v> <half> gen/map/S6/look/<tile>_insp_<u>_<v>.jpg` shows the scroll
  beside our registered AI restyle (`gen/sections/inner_city/mosaic.jpg`) with a grid (half ≤ 300 → 3× zoom). It
  covers u 1856–5744. The restyle helps read faded silk, but it is a repaint: **positions come from the scroll's
  strokes**, and anything visible only in the restyle gets `"conf": "low"` and a note. (If the mosaic doesn't exist
  yet, skip this tool.)
- `node tools/scroll_map.mjs S6 overlay --parts <your file> --grid 50 --x U0-U1 --zoom 1 --out gen/map/S6/look/<tile>_self.jpg`
  draws your entities on the scan; `node tools/scroll_map.mjs S6 check --parts <your file>` validates the format
  (warnings about supports are fine; errors are not).

## How to measure

- Work systematically: walk your range in columns about 200 px wide, top to bottom (v 0 to the silk's edge), and list
  everything in each window before moving on. **Small, distant, half-hidden and indoor things count**: drinkers in the
  upper storey, people seen through a shop front, a head behind a roof, figures at the very top of the silk, a child
  on a shoulder, a dog. **Count the painted figures in every crowd one by one**: the storyteller's listeners, the
  sedan bearers, a ring of onlookers are individuals, each its own entity. Before finishing, re-walk your range once
  more looking only for figures you missed.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put
  the point where the feet must be from the body (e.g. under the hips for a figure behind a counter) and mark it
  `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what` (the seat is part of the
  figure if nothing else paints it; if a bench or stool is painted, it is a prop). A rider: a figure entity with
  `pose: "riding"`, `support: "animal S6.ani.<id>"`, `foot` = ground point straight under the seat (`est`), plus
  the animal as its own entity. A kneeling figure: `foot` at the knees. A child: say "child" in `name` and `what`
  (they will be scaled down), and note the painted height against an adult's.
- `head` = top of the head or hat. `painted height` = foot v − head v; say in `note` when it is far from the
  neighbours' (children, far figures).
- Animals: `fore` = ground under the front hooves (their midpoint), `hind` = ground under the hind hooves, `head` =
  the head. In `what`: species as painted (donkey, mule, horse, ox, dog, pig…), colour, pose (standing, walking,
  lying, head down), tack (bridle, saddle, saddle cloth, pack frame, collar, yoke, traces), load, and who rides, leads
  or drives it. A team animal in a cart's harness: say which cart and where it stands in the team (shaft, lead, left,
  right).
- Vehicles: `front` / `rear` = ground under the front end (shaft tips or the front of the body where the team is
  hitched) and the rear end; `wheels` = where each visible wheel touches the ground. In `what`: the type (four-mule
  wagon 太平车, two-wheeled cart, 串车 barrow, sedan chair 轿), body, roof or cover, load, team and harness, and who
  drives, pushes or carries it. **A sedan chair is a vehicle**: `front` / `rear` = ground straight below the front
  and rear ends of its carrying poles (`est`), no wheels; its bearers are figures in a group with it. In `note`,
  SCALE CUES in px: wheel diameter, body length and height, sedan box width and height.
- Trees: `base` = where the trunk enters the ground (`est` if hidden), `top` = highest point of the crown,
  `crown_w` / `crown_e` = the crown's west and east extremes. In `what`: species as painted (willow with hanging
  whips, bare elm-like with twisted branches, pine-like with needle clusters, other), size, lean, leafing.
- Props: anything that stands on the ground (or on a floor) and isn't a building: stalls and their tables, stands,
  benches, stools, baskets and loads set down, jars, casks, sacks, umbrellas and parasols over stalls, mat awnings and
  canopies on poles, racks, poles, **free-standing signboards and lamp-boxes** (a sign on its own post or frame, a
  lamp-box standing at a door), flags on their own poles, piles. `base` point (or footprint corners via `pts.base`
  {sw, se, ne, nw} for bigger ones, e.g. a stall). **Signboards: copy their characters into `what` exactly as
  painted** (traditional characters as written, top to bottom; □ for an illegible character, and say which are
  unclear). These are the scroll's shop names.
- What is NOT yours (the structures agent records them for the whole section): buildings (anything with a tiled or
  thatched roof or walls, including open shop fronts and sheds), structures (the square well and its cover, the
  彩楼欢门 scaffold gateways, walls, fences, stairs, platforms, railings), roads and ground features. A signboard or
  lamp-box **hung on a building** is part of that building (the structures agent writes it in the building's
  `what`); one **standing on its own** is your prop. If you are not sure which, record it as your prop and say so in
  your report: a duplicate is easy to drop, a miss is not.
- **Every painted thing is its own entity.** If your `what` or `note` mentions a painted thing ("a basket stands at
  his feet", "a dog sniffs at the cart"), that thing needs its own entity too. Before finishing, read through every
  `what` and `note` you wrote and check this.
- Groups: when several entities do one thing together (the storyteller and his listeners, a sedan and its bearers, a
  wagon and its team and driver, a stall and its seller and customers, men drawing water at the well), add a `group`
  entity with `members` and a `what` that says what the group is doing, and set `group` on each member.
- IDs: make the slug say what the thing is and end it with the u of its main point so IDs never collide between
  agents: `S6.fig.listener_3912`, `S6.tree.willow_2280`, `S6.ani.mule_3620`, `S6.veh.sedan_4380`,
  `S6.prop.lampbox_zhengdian_4520`, `S6.grp.storyteller_ring`.
- `what` is what someone who never sees the picture will read: dress (colour, robe or short jacket, hat or cap or
  kerchief), sex and age, action, what the hands hold, which way the head turns, the load. One or two sentences,
  concrete. It is also what the casting of characters will be decided from, so say what kind of person it is
  (official, scholar, servant, porter, carter, monk, woman, child, soldier, butcher, sedan bearer, storyteller…).
- Use `src` when sections.md or the 名画记 pins name the vignette. Use `vis` and `conf` honestly.

## Supports

`support` is what a thing stands on. Use these names (their heights go into the frame file afterwards):
- `ground`: the street, yards, open shop floors at street level;
- `zhengdian upper floor`: the upper storey of 孙羊正店 (drinkers, servers);
- `inn upper floor`: the upper storey of 久住王员外家 (the scholar studying, 士子苦读);
- `upper floor: <which building>`: any other upper storey;
- `animal S6.ani.<id>`: a rider; `sedan: S6.veh.<id>`: someone seated in a sedan (foot est on the ground under the seat);
- anything else (a roof, a platform, a cart bed): say it in words, e.g. `cart bed: S6.veh.<id>`, and report it.
For a figure on an upper floor, `foot` is where the feet are on that floor (est behind a railing); in `note` give
the v of the floor line under the figure, so the floor's height can be measured.

## Ownership

You own entities whose main point (figure foot, animal fore, vehicle front, tree base, prop base) has u inside
your range, [start, end). Look about 150 px past both ends for context, and don't record things owned by the next
tile. A group that crosses the boundary goes to the tile holding most of its members; list all members (name members
you don't own by their expected ID only if you're sure; otherwise list only your own and say so in the report).

## Finish

1. Write your file as `{"section": "S6", "entities": [...]}` to `gen/map/S6/parts/<tile>.json`.
2. Run the check, then the overlay over your whole range (zoom 1, grid 50) and zoom-2 windows over every dense part.
   Read every overlay image. Every marker must sit on its thing (feet on the ground contact, heads on heads); fix and
   repeat until it does.
3. Reply with a report: counts by kind (figures, animals, vehicles, trees, props, groups); the crowds and how many
   figures you counted in each; what was hard or ambiguous; faded areas; things at your range's edges that a
   neighbour may also record (with their points); props that may be parts of buildings; scale cues (wheels, doors,
   tables, sedans); receding edges you saw (a cart's shafts, a table's sides, a stall's side) as two stroke points
   each; and anything that contradicts sections.md.

## The structures pass (one agent, the whole section u 2000–5600)

The structures agent records, for the whole section: every **building** (`bld`), every **structure** (`str`: the
square well and its cover, the 彩楼欢门 scaffold gateways, walls, fences, stairs, platforms, railings), the **roads**
(`road`), any **water**, and **ground features** (`grd`). The tile agents record everything else, including stalls,
umbrellas and awnings on poles and free-standing signboards (mention any you see in your report, but don't make them
entities).

- **Buildings** (`S6.bld.<slug>_<u>`; the named ones by name: `S6.bld.sunyang_zhengdian`, `S6.bld.inn_wang_yuanwai`,
  `S6.bld.incense_shop_liu`, …): `base` corners `sw`, `se`, `ne`, `nw` by compass (front = the side the main
  entrance faces; a south-side house fronting the street faces north, `facing_deg` 90). Heights straight above base
  corners: `<corner>_eave`, `<corner>_ridge`, `<corner>_top`. `bays`: the column feet along the front. Hidden
  corners `est`, with how they were estimated in `note`. In `what`: storeys, roof type (hip, hip-gable 歇山, gable),
  open front or walls, doors and windows, what the shop sells, **every signboard, lamp-box, banner, curtain or awning
  hung on it, with the characters exactly as painted** (□ for illegible). Two storeys: say so, and in `note` give
  the upper floor's line ("UPPER FLOOR: floor line at v … over u …, straight above the street at v …") so the floor
  height can be measured. Big complexes (孙羊正店: the street front, the upper storey, the back halls and yard) may
  be several building entities: say which belong together.
- **The 彩楼欢门** (`S6.str.cailou_huanmen_<u>`): the feet of its poles as `base` corners, `<corner>_top`, and in
  `what` its form (posts, cross-bars, the flowers and streamers, the lamp-boxes hung on it with their characters).
- **The square well** (`S6.str.square_well_<u>`): its curb or cover's corners as `base`, its height, the 田-shaped
  cover. Check whether its centre is east or west of u 2000 (the seam with S7) and say so.
- **Roads.** `S6.road.main`, with `"route": true` and `lines: {centre, edge_n, edge_s}`. The centre line runs **west
  to east (increasing u)**, and **its last point must be exactly `[5600, 1250]`**, where S5's road ends (S5's
  edges end at `[5600, 888]` north and `[5600, 1440]` south: meet them unless the strokes say otherwise, and say so).
  Its west end is where the street leaves the section at u 2000. No road edge is drawn as a line: the edges are where
  the open ground stops (building fronts, roofs on the south side). The cross street at the crossroads is its own
  road, `S6.road.cross_<u>`, with `lines: {centre, edge_w, edge_e}` running south to north; say where it meets the
  main street, whether it continues south across it, and where it leaves the silk.
- **Ground features** (`grd`): yards, a raised step or platform along shop fronts, a drain, anything the ground
  shows that is not a road.
- **DEPTH DIRECTION** (needed for the frame): for every building, the well, the 彩楼欢门, a wall: the receding edges
  you can see (a side wall's foot, an eave's side, a gable verge, a railing running back), each as two stroke points
  `(u1,v1)->(u2,v2)`, in `note` and in your report. On S5 they slope about −0.9 at the gate and −1.6 at the bridge;
  the frame's receding direction drifts along the scroll and is fitted from these.
- **SCALE CUES** in px, in `note` and your report: door heights, column heights and spacing, steps, railings, the
  well's cover, window sizes.
- **Seams with S5** (do not create S6 entities for these; write what you see as seam notes in your report, by S5 ID):
  `S5.bld.wine_depot` (its west end, estimated at u 5400: where is it really? its posts, eave, floor);
  `S5.bld.house_5800` and `S5.bld.house_5720` (they continue west of 5600: where do they end?);
  `S5.bld.back_hall_5790` (is it part of 孙羊正店? its west end meets the 正店's upper storey at about u 5400–5640).
- Write `gen/map/S6/parts/structures.json`. Report as above, plus: the buildings in order along the street, the
  two-storey ones with their floor lines, every hung sign with its characters, the receding edges, and what is
  ambiguous.
