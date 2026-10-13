# Brief: mapping section S4, part 1 (the outer road, u 9400–12600) from the strokes

You are one of several agents building **the scroll map** of 清明上河图 for a walkable web world. The map records
where every thing in the painting is, measured from the strokes, so that later sessions and builders never need
to look at the scroll again. The user wants the world "absolutely loyal to the original painting… replicate exactly
what the painting has, even to the amount of trees", and "high quality work". Every painted thing you miss will be
missing from the world; every point you misplace puts a thing in the wrong place. Precision and completeness matter
more than speed.

This brief is S5's (`gen/map/S5/brief.md`, the gate, mapped and built on 2026-10-11) filled in for S4.

**Read first:** `qingming/map/README.md` (the format: IDs, points, kinds, fields, axes; follow it exactly), then
`qingming/reference/scroll/sections.md` §2, the paragraph "S4 城门口外: the outer road" (what scholars say is where,
by scan x). For what a finished map reads like, skim the first 120 lines of `qingming/map/text/S5.md`.

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. This part of S4 spans u 9400–12600, v 0–1790 (the silk's bottom edge is at about
  v 1770–1790; check it in your tile).
- Axes: picture right = east (away from the city, toward the Rainbow Bridge), up the silk = north (away from the
  viewer). `facing_deg`: 0 = east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
- **The lay of the land (the lead's first look, to orient you; the strokes decide):** the main road comes off the
  moat bridge's east end at the left edge (road centre about v 1370 at u 9400) and runs east, rising up the silk to
  about v 800–1100 by u 11000–12600. North of it: a row of houses along the top of the silk (u 9250–10300, the
  temple with the shut gate somewhere about u 9750–10300), a side road or open ground climbing north at about
  u 10000–10600 with pigs, donkeys and a porter; tall tree groves; the 递铺 courier post (u ≈ 11250–12100: a gate with
  red studded doors, soldiers sitting and lying in front, spears and banners propped against a fence, a small bridge
  in front, a white horse lying somewhere in the yard); the fortune-teller under a mat awning (u ≈ 12050–12400) beside
  an official compound. On the road: the big covered ox cart of S5 (rear on the bridgehead, oxen at u 9775–9960), a
  stall with a mat awning and two big parasols (u 9355–9600 and on), a crowd round the stalls, a second covered ox cart
  (u ≈ 10250–10560) with its oxen ahead of it, a rider coming the other way, two tall dark boxes on the far side of the
  road (u ≈ 10650–10900, v 600–800: sedan chairs set down? chests?), a banner on a pole frame (u ≈ 11870–12010).
  South of the road: big tiled roofs of a row of buildings (u 10050–12750, v 1050–1790) with open fronts, tables and
  benches; trees in front of them.

## Tools for looking

- `node tools/scroll_map.mjs S4 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out gen/map/S4/look/<tile>_<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg. Write crops under `gen/map/S4/look/`,
  named after your tile, never elsewhere.
- `node tools/scroll_inspect.mjs outer_road <u> <v> <half> gen/map/S4/look/<tile>_inspect_<u>_<v>.jpg` shows the
  scroll beside our registered AI restyle (`gen/sections/outer_road/mosaic.jpg`, covers u 9248–12752) with a grid
  (half ≤ 300 → 3× zoom). The restyle helps read faded silk, but it is a repaint: **positions come from the scroll's
  strokes**, and anything visible only in the restyle gets `"conf": "low"` and a note saying so. The restyle also
  invents: never record a thing because the restyle shows it.
- `node tools/scroll_map.mjs S4 overlay --parts <your file> --grid 50 --x U0-U1 --zoom 1 --out gen/map/S4/look/<tile>_overlay.jpg`
  draws your entities on the scan; `node tools/scroll_map.mjs S4 check --parts <your file>` validates the format.
  (Warnings about supports not in the frame are fine; list the support names you used in your report.)

## How to measure

- Work systematically: walk your range in columns about 200–250 px wide, top to bottom, and list everything in each
  window before moving on. Small, distant and half-hidden things count: figures far up the silk, behind trees, in
  doorways, inside open shop fronts, at tables, on the far side of a cart, a head showing over a wall. **Count the
  painted figures in every crowd one by one**; the soldiers, the bearers, the fortune-teller's clients and the
  people at a stall are individuals, each with an entity.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put
  the point where the feet must be from the body (e.g. under the hips for a figure behind a cart) and mark it
  `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what`. A lying figure: `foot` =
  the middle of the body on the ground, say which way the head lies. A rider: a figure entity with `pose: "riding"`,
  `support: "animal S4.ani.<id>"`, `foot` = ground point straight under the seat (`est`), plus the animal as its own
  entity. A kneeling figure: `foot` at the knees.
- Animals: `fore` = ground under the front hooves (their midpoint), `hind` = ground under the hind hooves, `head` =
  the head. In `what`: species as painted (ox / water buffalo / donkey / mule / horse / pig / dog), colour, pose
  (standing, walking, lying, grazing, head down), tack and load (yoke, collar, saddle, saddle cloth, panniers,
  bridle), and who rides, leads or drives it. A cart's team: say which vehicle each animal draws and where in the
  team it is (shaft animal, lead animal on traces).
- Vehicles: `front` / `rear` = ground under the front end (where the shafts end, or the front of the body if the
  shafts are hidden) and the rear end; `wheels` = where each visible wheel touches the ground. In `what`: the type
  (covered ox cart, 串车 barrow, sedan chair 轿, handcart), body, roof (mat barrel roof, palm cover), load, wheels,
  shafts, yoke and traces, and the team. In `note`: the wheel's rim extents and hub in px (**SCALE CUE**: a wheel's
  diameter is a real-size check), and the shafts' or the body's receding edge as **DEPTH DIRECTION** with its two
  stroke points `(u1,v1) -> (u2,v2)` and slope dv/du.
- Trees: `base` = where the trunk enters the ground (`est` if hidden), `top` = highest point of the crown,
  `crown_w` / `crown_e` = the crown's west and east extremes. In `what`: species as painted (bare elm-like with
  twisted branches, willow with long whips, pine-like with needle clusters, other), size, lean, leafing, number of
  trunks. A clump of several trunks from one foot is one tree; separate trunks with separate feet are separate trees.
- Props: anything that stands on the ground and isn't a building: stalls, awnings and canopies on poles, parasols,
  tables, benches, stools, boxes and chests set down, baskets, jars, sacks, piles, spears and banners leaning on a
  fence, a banner or signboard on a pole, a notice board, a trough, a hitching post, a well. `base` point (or
  footprint corners via `pts.base` {sw, se, ne, nw} for bigger ones). A row of identical things standing together
  (seven spears against one fence) can be one prop: give the **exact count** in `what`. Furniture inside an open shop
  front counts.
- **Carried and worn things** (a pole and its baskets on a shoulder, an umbrella held up, a fan, a box on the back)
  are part of their carrier: describe them in the figure's `what`. Anything set down, propped or hung on its own is a
  prop entity. A visible box, bench or stool a figure sits or lies on is its own prop (the figure's `what` names it
  by ID); a seat hidden under a figure is not recorded.
- **Signboards and written characters** go in `what` exactly as painted, character by character; unreadable
  characters as □. (The fortune-teller's signs are said to read 神课 · 看命 · 决疑; record what the strokes show.)
- Groups: when several entities do one thing together (a cart and its team and driver, the soldiers at the gate, a
  stall and its customers, the fortune-teller's clients), add a `group` entity with `members` and a `what` that says
  what the group is doing, and set `group` on each member.
- IDs: make the slug say what the thing is and end it with the u of its main point so IDs never collide between
  agents: `S4.fig.soldier_lying_11520`, `S4.ani.ox_lead_10850`, `S4.veh.covered_ox_cart_10400`,
  `S4.tree.willow_9445`, `S4.prop.parasol_9700`, `S4.grp.courier_post_soldiers`.
- `what` is what someone who never sees the picture will read: dress (colour, cut, headwear), action, what the hands
  hold, which way the head turns, the load, the state of a tree. One or two sentences, concrete. Children: say so
  and give their painted height against the adults' (the build scales them).
- Use `src` when sections.md names the vignette (`余辉: 懒兵候主`, `余辉: 临街神算`, `名画记: 牛拉大盖车 (pin 31)`,
  `名画记: 清净的寺庙 (pin 30)`, `名画记: 递铺 (pin 29)`, `名画记: 算命先生 (pin 28)`). Use `vis` and `conf` honestly.
- When the painting is ambiguous, say so in `note` and lower `conf`. Never resolve it silently.

## Ownership

You own entities whose main point (figure foot, animal fore, vehicle front, tree base, prop base) has u inside
your range, [start, end). Look about 150 px past both ends for context, and don't record things owned by the next
tile. A group that crosses the boundary goes to the tile holding most of its members; list your own members and name
the others in your report (by what and where), so the lead can join them.

Buildings, structures (walls, fences, railings, gates, bridges, stairs, platforms), roads, paths, water and ground
features (banks, mounds, ditches) belong to **the structures agent** for the whole area; tile agents don't record
them. Everything else (figures, animals, vehicles, trees, props, groups) belongs to the tile agents. An awning or
canopy on its own poles, a parasol, a stall, a signboard on a pole is a **prop** (tile agents), even when it leans
on a building. If you are unsure which side a thing falls on, record it and say so in your report.

## The seam with S5 (u 9400), for t1 and the structures agent

S5 is mapped (`map/strokes/S5.json`, `map/text/S5.md`); never re-record its entities. Near the seam S5 holds: the
servant with a luggage pole (foot 9318, 1428), the far-rail sightseers up to u 9308, the old rider and his donkey
(fore 9228), the bushy willow clump `S5.tree.willow_clump_9392` (base 9392, 1768 est; its note says the stems east of
u ~9450 may be a second clump: decide), the pine `S5.tree.pine_9285`, the moat bridge (its north-east corner est at
u 9455, hidden by the cart), `S5.bld.house_9300` (far up the silk, v 15–155, continues east), and:

- **`S5.veh.covered_ox_cart_9800`**: the big covered ox cart, rear on the bridgehead, front and team in S4. The cart
  stays S5's (its builder builds the cart and its harness). **t1 maps its oxen and its driver(s) as S4 entities**
  (their main points are in S4), and says in their `what` and `note` that they draw `S5.veh.covered_ox_cart_9800`.
  **t1 also measures the cart's front** (ground under the front end of its body and under the shafts' front ends),
  its second wheel if visible, the shafts' line and the yoke, and gives them **in the report only**, as a seam note on
  that ID (the lead applies it to S5).
- `S5.bld.house_9300` (structures agent): map the rest of it east of u 9400 as a seam note in the report on that ID;
  don't add an S4 building for the same house.
- **S4 owns** (even if a point of them lies just west of u 9400): the gnarled tree at u ≈ 9445, the tree whose trunk
  is near u 9600, the mat awning and parasol stall (u 9355–9600), and the figures at u 9497, 9620, 9650, 9700 and on.

## The seam with the rest of S4 (u 12600), for t4 and the structures agent

Part 1 ends at u 12600; the rest of S4 (12600–15500: the palm-covered family carts, the wheelwright, the crowd round a
seated man, the moorings) is mapped later. Record what is yours by the main-point rule, and list in your report
every thing that crosses u 12600 (a building, a road, a tree crown, a group) with its points on both sides.

## Finish

1. Write your file as `{"section": "S4", "entities": [...]}` (path given below).
2. Run the check, then the overlay over your whole range (zoom 1, grid 50) and zoom-2 windows over every dense part.
   Read every overlay image. Every marker must sit on its thing; fix and repeat until it does. Then make one more
   pass over your range looking only for what you missed (heads in crowds, things in doorways, far figures, props
   at building bases, things behind carts and trees).
3. Reply with a short report: counts by kind, what was hard or ambiguous, faded areas, things at your range's edges
   that a neighbour may also record, groups that cross your edges, new support names you used (and how high they
   look), real-size cues you measured (wheels, doors, railings, boxes: px), and anything that contradicts sections.md.
