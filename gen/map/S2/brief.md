# Brief: mapping S2 (the canal wharves, u 20500–29050) from the strokes

You are one of eighteen agents building **the scroll map** of 清明上河图 for a walkable web world, on area S2: the
汴河 with its boats and the wharves along its north bank, from the Rainbow Bridge's east side to the 望楼饭铺 sheds
where the countryside begins. The map records where every thing in the painting is, measured from the strokes, so
that later sessions and builders never need to look at the scroll again. The user wants the world "absolutely loyal to
the original painting… replicate exactly what the painting has, even to the amount of trees", and "high quality
work". Every painted thing you miss will be missing from the world; every point you misplace puts a thing in the wrong
place. Precision and completeness matter more than speed.

S2 is, with S3, the heaviest section of the scroll in people and boats: about 15–20 boats with their crews, the
trackers, the wharf crowd at the east end. Boats follow the convention S4b pilots (`map/README.md`, Boats).

This brief is S4b's (`gen/map/S4b/brief.md`), S4 part 1's and S6's, filled in for S2, with the round 2 rules
(`gen/expand/round2/mapping_rules.md`: read "Everyone" and the section for your role). The area brief is
`gen/expand/round2/brief_canal.md`.

**Read first:**
- `qingming/map/README.md`: the format (IDs, points, kinds, fields, axes; follow it exactly), and its paragraph
  **Boats**;
- `qingming/reference/scroll/sections.md` §2, the paragraph "S2 汴河 · 运河两岸: the canal wharves" (what scholars say
  is where, by scan x), and §1.4 (the 名画记 pins);
- for what a finished map reads like, the first 120 lines of `qingming/map/text/S5.md`.

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. S2 spans u 20500–29050, v 0–1790 (the silk's bottom edge is at about v 1770–1790;
  check it in your range).
- Axes: picture right = east (away from the city, toward the countryside), up the silk = north (away from the
  viewer). `facing_deg`: 0 = east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
- **The lay of the land** (the setup agent's first look, to orient you; the strokes decide):
  - **The water** fills most of the silk: v ≈ 300–1800 at the west end, v ≈ 450–1800 through the middle, v ≈ 900–1800
    east of u 26800, where the north bank widens. A **south bank** shows only at the bottom of u 20350–22300; east of
    it the silk's bottom edge cuts the water.
  - **North bank, west (u 20500–22300):** shops at the top (u ≈ 20800–21600, v 0–120); boats moored along the bank
    (≈ 20380–21100, v 250–480, about 7 people aboard; a big cabin boat ≈ 20820–21800, v 80–410); **five trackers** on
    the bank at u ≈ 21780–22150 (v 150–390) hauling a long rope; a big willow at the top (u ≈ 22150–22350, v 0–300).
  - **The tow rope** runs from the trackers east across the water (≈ (22150, 330), (22500, 440), (22950, 480),
    (23500, 490), (23830, 440)) to **the mast of the boat going upstream, at u ≈ 24100–24180** (mast top v ≈ 300):
    逆水行舟's rope, about 2300 px long. The trackers are 2000 px west of their boat.
  - **South bank (u 20350–22300, bottom):** big tiled roofs (u ≈ 20500–21500, v 1300–1800); people by a shed at
    u ≈ 20900–21100 (v 1250–1420); two great willows whose crowns fill the middle of the silk (trunks at
    u ≈ 21300–21450, v 1050–1450, and u ≈ 20480–20600, v 1150–1790); a small covered boat off the bank
    (≈ 20900–21200, v 1050–1200); a mound at u ≈ 21500–21800 (v 1380–1450); a big seated or leaning figure at
    u ≈ 21950–22050 (v 1580–1700) by a boat.
  - **Middle water (u 21850–23750):** a boat with six men working poles or oars (u ≈ 21870–22450, v 830–1060); a long
    pole running from that boat to a skiff-like shape (≈ 22450–22950, v 1000–1100); two cabin boats at the bottom (≈ 21950–22500, v 1450–1660, a pole or mast at
    ≈ 22100; ≈ 22400–23050, v 1450–1780); **豪华客船** (u ≈ 22420–23720, v 480–920), a long boat with a full-length
    cabin and lattice windows, passengers inside and crew on deck.
  - **North bank, middle (u 22300–24600):** buildings at the top; **a terrace on posts over the water with diners**
    (u ≈ 22950–23450, v 180–420); an open-air eatery with tables and benches (u ≈ 23500–24000, v 200–330); the street
    with an ox or mule cart (u ≈ 24250–24500, v 80–250) and porters with sacks (u ≈ 24100–24500, v 200–330).
  - **逆水行舟 (u ≈ 23500–25250):** two big hulls side by side: a southern one (≈ 23550–25150, v 850–1250; a long
    cabin; about a dozen crew; bow at the west end?) and a northern one (≈ 23500–25100, v 480–900) with the mast at
    ≈ 24100–24180 and its stays; a small canopied boat at ≈ 24250–24500 (v 500–600).
  - **North bank, east-middle (u 24600–26800):** a building with **a pole scaffold on its roof** (u ≈ 24800–25150,
    v 0–200); big halls with long roofs (u ≈ 25050–26450, v 50–600); a far street at the very top (u ≈ 25600–26450,
    v 0–130) with people and tables; two people standing on the narrow bank in front of the halls (u ≈ 25500–25550,
    v 420–520); two boats moored along the bank (≈ 25150–25990 and ≈ 26000–26800, v 600–1000; rudders at their east
    ends, so probably bows west).
  - **The wide east bank (u 26800–29050, v 0–1000):** a great willow (trunk ≈ 26700–26850, v 550–750); 王家纸马铺 at
    the top (a tall signboard on a post at u ≈ 26850–26880, v 60–200); **a raised plank walkway with a railing**
    (u ≈ 26950–27350, v 720–900); the sheds (a long shed ≈ 27050–27800, v 250–850; more ≈ 27700–28350, v 150–550; the
    long 望楼饭铺 shed ≈ 28250–29000, v 280–650) with customers at tables; **the porters and the sacks**
    (u ≈ 27850–28350, v 600–950) with a seated man among them; a mooring post with a coiled rope (≈ 27800,
    v 950–1000); the **望火楼** (u ≈ 28180–28450, v 50–260, with a stair); trees at the top (u ≈ 27900–28200).
  - **The grain boats:** one at ≈ 27270–28100 (v 1000–1650) with **a gangplank** to the bank at ≈ 27650–27850
    (v 1030–1150); a second at ≈ 27950–28700 (v 1150–1750), half under willow crowns; a boat at the bottom
    ≈ 28300–29000 (v 1300–1780) with a ladder and a man at its east end (≈ 28790, v 1590–1680).
  - **Willows at the east end:** crowns over u ≈ 28400–29200, v 450–1800; a trunk at ≈ 28750 (v 950–1200?) and a
    massive one at ≈ 28950–29200 (v 1250–1650), whose base decides its owner (the S1 seam, below).

## Tools for looking

Keep every script, crop and scratch file in **your own folder**,
`/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/S2_<unit>/` (for example
`S2_t10/`, `S2_river_m/`). Up to 14 agents of five areas run at once; generic names collide.

- `node tools/scroll_map.mjs S2 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out <your folder>/<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg.
- **The restyle runs in two halves** (the image API can't make an overview as wide as S2): for u < 24768 use
  `node tools/scroll_inspect.mjs canal/west <u> <v> <half> <your folder>/inspect_<u>_<v>.jpg`
  (`gen/sections/canal/west/mosaic.jpg`, u 20336–24944); for u ≥ 24768 use `canal/east` (u 24592–29200). It shows the
  scroll beside our registered AI restyle with a grid (half ≤ 300 → 3× zoom). The restyle helps read faded silk, but
  it is a repaint: **positions come from the scroll's strokes**, and anything visible only in the restyle gets
  `"conf": "low"` and a note saying so. **The restyle also invents: never record a thing because the restyle shows
  it.** Where it invents in S2 is listed below, "What the restyle invents here".
- `node tools/scroll_map.mjs S2 overlay --parts gen/map/S2/parts/<unit>.json --grid 50 --x U0-U1 --zoom 1 --out gen/map/S2/look/<unit>_overlay.jpg`
  draws your entities on the scan (your final self-overlay goes in `gen/map/S2/look/`; working crops stay in your
  folder); `node tools/scroll_map.mjs S2 check --parts gen/map/S2/parts/<unit>.json` validates the format. S2 has no
  frame yet, so there are no support warnings; list the support names you used in your report. Errors are not fine.

## How to measure

- Work systematically: walk your range in columns about 200 px wide, top to bottom (v 0 to the silk's edge), and list
  everything in each window before moving on. **Small, distant, half-hidden and indoor things count**: figures far up
  the silk against its top edge, behind trees, in doorways, inside open shop fronts and sheds, at tables, a head
  showing over a roof or a gunwale, a child at a shoulder, a dog, a bird. **Count the painted figures in every crowd
  one by one, head by head at zoom 3 with the grid**: the sheds' customers, the sack porters, the trackers, the diners
  on the terrace and the crews are individuals, each with an entity. The silk is darkened under roofs, awnings and
  willow crowns. Before finishing, re-walk your range once more looking only for figures you missed.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put the
  point where the feet must be from the body (e.g. under the hips for a figure behind a table or a gunwale) and mark it
  `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what`. A lying figure: `foot` = the
  middle of the body on the ground; say which way the head lies. A kneeling figure: `foot` at the knees. A rider: a
  figure entity with `pose: "riding"`, `support: "animal S2.ani.<id>"`, `foot` = ground point straight under the seat
  (`est`), plus the animal as its own entity. A child: say "child" in `name` and `what`, and give its painted height
  against the adults' in `note`.
- `head` = top of the head or hat. Painted height = foot v − head v; say in `note` when it is far from the neighbours'.
  **The painter shrinks things up the silk** (S4: 0.9 of the road's scale at v 850, 0.5 at v 320, 0.3 at v 220), and
  most of S2's land is at v 0–500: give painted heights honestly, never "correct" them.
- **Animals:** `fore` = ground under the front hooves (their midpoint), `hind` = ground under the hind hooves, `head` =
  the head. In `what`: species as painted (ox / water buffalo / donkey / mule / horse / dog / pig), colour, pose, tack
  and load (yoke, collar, saddle, panniers, bridle, pack frame), and who rides, leads or drives it.
- **Vehicles** (carts and sedans; boats are below): `front` / `rear` = ground under the front end (where the shafts
  end, or the front of the body if the shafts are hidden) and the rear end; `wheels` = where each visible wheel touches
  the ground. A sedan chair is a vehicle (`front` / `rear` = ground below the ends of its poles, `est`; its bearers in
  a group with it). In `what`: the type, body, roof, load, wheels, shafts, yoke and traces, and the team. In `note`:
  the wheel's rim extents and hub in px (**SCALE CUE**), and the shafts' or the body's receding edge as **DEPTH
  DIRECTION** with its two stroke points `(u1,v1) -> (u2,v2)` and slope dv/du.
- **Trees:** `base` = where the trunk enters the ground (`est` if hidden), `top` = highest point of the crown,
  `crown_w` / `crown_e` = the crown's west and east extremes. In `what`: species as painted (willow with long whips,
  pollarded old willow with a knobbed head, bare elm-like with twisted branches, other), size, lean, leafing, number of
  trunks. A clump of several trunks from one foot is one tree; separate trunks with separate feet are separate trees.
  Record another tree only where its own trunk shows. **S2's willows lean far out over the water:** a crown over the
  water belongs to the tree whose trunk stands on the bank (a tile's, by its base), never to the river agent.
- **Props:** anything that stands on the ground (or on a floor) and isn't a building: stalls and their tables,
  benches, stools, chests and boxes set down, baskets, jars, barrels, **sacks and sack piles** (give the exact count of
  sacks where they can be counted), timber, loose wheels, umbrellas and parasols, mat awnings and canopies on their own
  poles, racks, free-standing signboards and lamp-boxes, flags on their own poles, hitching posts, **mooring posts and
  stakes on the bank**, coiled ropes set down. `base` point (or footprint corners via `pts.base` {sw, se, ne, nw} for
  bigger ones). A row of identical things standing together can be one prop: give the **exact count** in `what`.
  Furniture inside an open shop front or shed counts.
- **Carried and worn things** (a pole and its baskets on a shoulder, a sack on the back, a rope over the shoulder, an
  umbrella held up) are part of their carrier: describe them in the figure's `what`. Anything set down, propped or hung
  on its own is a prop entity. A visible bench or stool a figure sits on is its own prop (the figure's `what` names it
  by ID); a seat hidden under a figure is not recorded.
- **Signboards and written characters** go in `what` exactly as painted, character by character, top to bottom
  (traditional characters as written; □ for an illegible one, and say which are unclear). 王家纸马铺's sign, any shed's
  flag or board, a boat's name: copy what the strokes show.
- **Every painted thing is its own entity.** If your `what` or `note` mentions a painted thing ("a basket stands at his
  feet", "a dog by the shed", "a bird on the branch"), that thing needs its own entity too, or a line in your "left to"
  list naming who owns it. Before finishing, read every `what` and `note` you wrote and check this.
- **Groups:** when several entities do one thing together (the trackers and their rope's boat, a boat and its crew,
  the porters and the seated owner with the sacks, the diners at one table, a cart and its team and driver), add a
  `group` entity with `members` and a `what` that says what the group is doing, and set `group` on each member. A group
  lists only S2 IDs; a link to an S3 or S1 entity goes in the group's `note`.
- **IDs:** make the slug say what the thing is and end it with the u of its main point so IDs never collide between
  agents: `S2.fig.tracker_lead_21800`, `S2.fig.sack_porter_28010`, `S2.ani.ox_24400`, `S2.tree.willow_21380`,
  `S2.prop.sack_pile_28100`, `S2.veh.boat_grain_27300`, `S2.bld.fire_tower_28300`, `S2.grp.trackers`.
- `what` is what someone who never sees the picture will read: dress (colour, robe or short jacket, hat or cap or
  kerchief, bare-backed), sex and age, action, what the hands hold, which way the head turns, the load, the state of a
  tree. One or two sentences, concrete. It is also what casting is decided from, so say what kind of person it is
  (boatman, tracker, grain porter, merchant, shed keeper, diner, passenger, servant, woman, child).
- Use `src` when sections.md or the 名画记 pins name the vignette (`余辉: 望楼饭铺`, `余辉: 私粮进京`,
  `余辉: 船侧祭神`, `余辉: 客船启程`, `名画记: 豪华客船 (pin 17)`, `名画记: 逆水行舟 (pin 15)`,
  `名画记: 聊天的伙计 (pin 16)`, `名画记: 沿河雅座 (pin 14)`, `名画记: 王家纸马铺 (pin 13)`, `名画记: 喝杯小酒 (pin 12)`,
  `名画记: 河边店铺 (pin 11)`, `名画记: 城乡交界处 (pin 10)`, `名画记: 仓前成市 (pin 9)`, `名画记: 万石船 (pin 8)`,
  `名画记: 汴水悍激 (pin 7)`). Use `vis` and `conf` honestly.
- **When the painting is ambiguous, say so in `note` and lower `conf`. Never resolve it silently.** Faint things that
  change the cast or the build (two people in one hunched mass, a robe or a hanging cloth, a sack or a crouching man)
  are recorded with `conf: low` and a note giving both readings, never dropped.

## Boats and water (the river agents; everyone should know the convention)

From `map/README.md`, Boats (Phase 0 §4):
- **A boat is a vehicle**: ID `S2.veh.boat_<type>_<u>` (u of its stem), kind `vehicle`. `front` and `rear` are **the
  waterline under the stem and under the sternpost** (`est` where a neighbour or the bank hides them). Optional points:
  `beam_n` and `beam_s` (the waterline at the hull's widest), `bow_top` and `stern_top` (the gunwale straight above
  front and rear), `mast` (its foot on deck) and `mast_top`, and any custom point a part needs (`rope`: a polyline of
  points along a tow rope; `rope_end`, `plank_end`, `rudder`). `support: "water"`. `pose`: moored, rowed, poled,
  towed, sailing, drifting or lowering mast. `facing_deg`: the way the bow points. **Read which end is the bow** on a
  zoom-3 crop: the stern carries the rudder and usually the high deck or the sweep (橹); say what decided it.
- In `what`: the type (grain boat 万石船, passenger boat with a cabin, small sampan, skiff), the hull, the cabin (roof
  form, windows, doors), the mast and rig, the sweep and oars, the cargo, and **which boat it is rafted to and what it is
  moored to** (by ID). In `note`: the **SCALE CUE** (hull length and beam in px, a cabin door's height) and the evidence
  for the waterline.
- **Parts of the boat:** mast, rig, cabin, sweep and oars, ropes, gangplank and deck cargo. A rope's or a plank's
  **far end names what it reaches** (a post on the bank, another boat, a tracker): by ID where the ID is yours, by
  "what and where (unit)" where it is another unit's, and the merge writes the ID.
- **The crew:** each person on a boat is a figure with `support: "boat deck: <boat id>"` (or `"boat roof: <boat id>"`
  on a cabin roof), `foot` where the feet are on the deck (est behind a gunwale), and in `note` the v of the gunwale and
  of the waterline straight below the figure. Passengers inside a cabin seen through its windows are crew too
  (`boat deck`, foot est). Someone on a gangplank is the river agent's (`support: "gangplank: <boat id>"`, with the
  plank's v under the feet in `note`); someone on land at the plank's foot is a tile's. Each boat and its crew form a
  group.
- **The water:** each river unit's reach is a `water` entity (`S2.water.bian_river_<unit>`, e.g.
  `S2.water.bian_river_w`; it is not the route) with `lines` `shore_n` and `shore_s` (where water meets land; a line
  stops where the silk's edge cuts it, and **ends at the unit's range ends**, so the merge can join them; give the end
  points in your report). The banks are `grd` with `lines.bank_top` (and the shore as the bank's foot). Landing stairs
  and jetties are structures (`S2.str.jetty_<u>`). **汴水悍激** (pin 7, ≈ 26670) is the water's own painted current:
  record where the strong current lines are in the water entity's `what` and `note` (u–v extents), not as entities.
- **The water level** is S4b's (one H for the whole 汴河). Each S2 river agent gives its own reading only as a check:
  one or two places where the bank meets the water at a vertical face or a stair, with the waterline and a point
  straight above it at ground level, and the H it gives (H = −(v_waterline − v_ground) / 77 m).

## Supports

`support` is what a thing stands on. Use these names (their heights go into the frame afterwards):
- `ground`: the street, yards, the sheds' floors, open shop floors at street level;
- `terrace floor: <building id>`: the diners on the terrace over the water (u ≈ 22950–23450); in `note`, the v of the
  floor line under the figure and of the ground or waterline straight below it;
- `upper floor: <building id>`: any upper storey (in `note`, the v of the floor line under the figure);
- `bank top`, `bank slope`: a figure or thing on a raised bank, not on the street's level (in `note`, the v of the
  bank's foot and top under it);
- `jetty deck: <structure id>`: someone on the jetty (u ≈ 26950–27350; the jetty's ID is river_e's: if you don't know
  it yet, write `jetty deck: S2.str.jetty` and the merge completes it);
- `fire tower platform`: anyone on the 望火楼's platform (say so if nobody is: 余辉 reads it as a tower with no lookout);
- `cart bed: S2.veh.<id>`, `sedan: S2.veh.<id>`, `animal S2.ani.<id>`;
- `carried in arms`, `shoulders`, `carried on back`: a child carried (its own figure, foot at the carrier's foot);
- `ground: on <prop id>`: standing or sitting on a prop whose base is on the ground (the owner seated on the sacks);
  `table top: <prop id>`;
- `water`: boats; `boat deck: <boat id>`, `boat roof: <boat id>`, `gangplank: <boat id>`: people on boats;
- anything else: say it in words and report it.

## Ownership

You own entities whose **main point** has u inside your range, [start, end): a figure's foot, an animal's fore, a
vehicle's front (a boat's: the waterline under the stem), a tree's base, a prop's base; for buildings and structures,
the middle of their footprint corners. **Exception: the boats named in the units table are owned by the river unit
named there, whichever side of a unit boundary their stem reads** (the section seams at 20500 and 29050 still go by
the stem). Look about 150 px past both ends for context, and don't record things owned by the next unit. A group that
crosses the boundary goes to the unit holding most of its members; list your own members and name the others in your
report (by what and where), so the merge can join them.

**Who records what:**
- **Tile agents** (`t1`–`t12`, by range): everything on land: figures, animals, vehicles (carts, sedans), trees,
  props, groups. The trackers are t2's. Nothing on the water or on a boat.
- **Structures agents** (`structures_w`, `structures_e`, by range): every building (the sheds included), structure on
  land (walls, fences, railings, stairs, platforms, **the 望火楼** with its brick platform and stair), road and ground
  feature on land. `structures_w` records **`S2.road.main` for the whole area**; the others record only side streets.
  The terrace on posts over the water is a building (structures_w), posts and all.
- **River agents** (`river_w`, `river_w2`, `river_m`, `river_e`, by range and by the boats named): everything on or in
  the water: the water and its shore lines, **the banks**, landing stairs and **the jetty**, every boat with its ropes,
  planks and cargo, and everyone on a boat or a gangplank.
- **The in-between kinds:** awnings, canopies and parasols on their own poles, stalls, signboards on posts (王家纸马铺's
  tall sign on a post), lamps on their own pole, mooring posts and stakes **on land**, sacks and sack piles on land are
  the **tile agents' props**, even when they lean on a building. Writing, plaques, boards, curtains, lamps and **the
  pole scaffold** (u ≈ 24800–25150) **fixed to or hung from a building** are part of the building (the structures agent
  writes them in its `what`). A post standing in the water's edge is the river agent's. A tracker on the bank holding a
  boat's rope is a tile agent's figure (the rope is the boat's). **If unsure, record it as yours: a duplicate is easy
  to drop, a miss is not.**
- **Every agent ends its report with the list of painted things it saw and left to another agent** (what, where, to
  whom). The merge compares these lists; the things everyone left are the most common misses.

## The units

| unit | owns u | looks at u | density | what to find (hints to verify, not facts) | seams and boundary notes |
|---|---|---|---|---|---|
| `t1` | 20500–21300 | 20350–21450 | medium: about 15 | the south bank's end: the people by the shed at u ≈ 20900–21100 (v 1250–1420), anything at the bottom among the roofs; **the big willow at the top** (trunk ≈ 20450–20600, v 0–250: S2's even if its trunk reads west of 20500); the second dark willow trunk at ≈ 20480–20600 (v 1150–1790: by its base); the north-bank people at the top (u ≈ 20800–21300, v 0–150) | the S3 seam (below); nothing on the water or on a boat |
| `t2` | 21300–22100 | 21150–22250 | medium: about 15 | **the five trackers** (张安治's "five trackers", Hansen's plates 10–12; u ≈ 21780–22150, v 150–390): each its own figure, pose, the rope over the shoulder or round the chest, which way it leans; their group names 逆水行舟's boat (river_m's) in its `note`; the great willow with its trunk at u ≈ 21300–21450 (v 1050–1450; its crown spreads over the water); the north-bank people at the top (u ≈ 21350–21600, v 50–110); the south bank's people and the mound (u ≈ 21500–22050, v 1380–1700): the big figure at ≈ 21950–22050 is yours if it stands on the bank, river_w2's if on the boat beside it | the rope itself is river_m's |
| `t3` | 22100–22900 | 21950–23050 | medium: about 10–15 | the north-bank people and trees: the big willow at the top (u ≈ 22150–22350, v 0–300); people at the buildings' fronts and on the bank (u 22300–22900, v 0–450) | the terrace's building is structures_w's |
| `t4` | 22900–23700 | 22750–23850 | medium: about 15–20 | **the diners on the terrace over the water** (u ≈ 22950–23450, v 180–420; support `terrace floor: <building id>`); the open-air eatery's tables and benches and its customers (u ≈ 23450–23900, v 200–330: tables and benches are props); people at the top | 豪华客船 (pin 17) and its passengers are river_w2's |
| `t5` | 23700–24500 | 23550–24650 | medium: about 15–20 | the north-bank street: the ox or mule cart (u ≈ 24250–24500, v 80–250) with its team and driver; the porters with sacks (u ≈ 24100–24500, v 200–330); the eatery's east tables; people at the shop fronts (u 23700–24100, v 50–200); 名画记 pin 16 聊天的伙计 (24280: fellows chatting: on land or on a boat? say which) | the trackers are t2's, the boats river_m's |
| `t6` | 24500–25300 | 24350–25450 | medium: about 15 | the people at the top and in front of the scaffolded building (u ≈ 24450–24800, v 0–500); porters carrying goods toward the boats; anything on the narrow bank | the pole scaffold is structures_e's (part of its building) |
| `t7` | 25300–26100 | 25150–26250 | medium: about 15 | 沿河雅座 (名画记 pin 14 at 25680): the people at the halls' windows and in front (u ≈ 25500–25800, v 400–550); the two standing on the bank (u ≈ 25500–25550, v 420–520); the far street at the very top (u ≈ 25600–26100, v 0–130) with its people and tables | the moored boats are river_m's and river_e's |
| `t8` | 26100–26900 | 25950–27050 | medium: about 15–20 | the far street at the top (u 26100–26900, v 0–200: people, an animal?); **王家纸马铺** (名画记 pin 13 at 26850, Hansen's plate 8): its tall signboard on a post (u ≈ 26850–26880, v 60–200) is your prop, with its characters copied as painted; **the great willow** (trunk ≈ 26700–26850, v 550–750); the bank's people | the 纸马铺's building is structures_e's; 汴水悍激 (pin 7) is river_e's water |
| `t9` | 26900–27600 | 26750–27750 | dense: about 20–25 | 喝杯小酒 (名画记 pin 12 at 27320): the west shed's customers at its tables (u ≈ 27050–27600, v 600–850); people at the top street (u 26900–27600, v 0–250); **the people on the jetty** (u ≈ 26950–27350, v 720–900; support `jetty deck: …`) | the jetty itself is river_e's; the sheds are structures_e's; the grain boats (pin 8) are river_e's |
| `t10` | 27600–28150 | 27450–28300 | very dense: about 30–35 | **the porters carrying grain sacks ashore and the owner seated on the sacks** (余辉 私粮进京, 名画记 pin 9 仓前成市 at 27950; u ≈ 27850–28350, v 600–950): count head by head; each sack pile its own prop with its count; the sheds' customers (u ≈ 27700–28150, v 150–550); 名画记 pin 11 河边店铺 (28090); the mooring post with its coiled rope (≈ 27800, v 950–1000: yours if it stands on land) | the porter on the gangplank is river_e's; the porter at its foot is yours; the group spans t10 and t11: t10 holds it |
| `t11` | 28150–28700 | 28000–28850 | dense: about 20–25 | the east end of the sack crowd; **the people round the 望火楼's foot and on its stair** (u ≈ 28150–28500, v 100–300); the long shed's customers (u ≈ 28250–28700, v 450–700); trees at the top (u ≈ 27900–28200) and the willows on the bank (trunks?) | the 望火楼 is structures_e's (support `fire tower platform` for anyone on top) |
| `t12` | 28700–29050 | 28550–29200 | medium: about 10–15 | the 望楼饭铺 shed's east end and its seated customers (u ≈ 28700–29050, v 500–700, kept in S2 by the moved seam); the man with a dark animal (u ≈ 28930–29000, v 600–700); 名画记 pin 10 城乡交界处 (28940); the willow trunks at ≈ 28750 and the massive one at ≈ 28950–29200 (by base) | the S1 seam (below); the boat at the bottom is river_e's |
| `river_w` | 20500–21850 | 20350–22000 | about 3 boats, 12–15 crew | the boat moored along the north bank from ≈ 20380 (v 250–480; about 7 aboard; **its stem decides S2 or S3**: read both ends); **the big cabin boat ≈ 20820–21800** (v 80–410); the small covered boat off the south bank (≈ 20900–21200, v 1050–1200; a hull seen through the willows at ≈ 20900–21250, v 830–1000 may be the same boat: say); the water, both shores and both banks (the south bank's shore runs ≈ (21300, 1300)–(22000, 1500)?) | the S3 seam (below): the south-bank boat with the waving men is S3's; owns the boats named here whichever side of 21850 their stems read |
| `river_w2` | 21850–23300 | 21700–23450 | about 5 boats, 20–25 crew | **the boat with six men working poles or oars** (≈ 21870–22450, v 830–1060); the two cabin boats at the bottom (≈ 21950–22500, v 1450–1660, a pole or mast at ≈ 22100; ≈ 22400–23050, v 1450–1780); the "empty skiff" (≈ 22450–22950, v 1000–1100), **joined to the six men's boat by a long pole** (from ≈ (22300, 940)): a skiff on a line, or the blade of a great sweep? Read it and say which; **豪华客船** (名画记 pin 17; ≈ 22420–23720, v 480–920): its passengers through the windows, the crew on deck and roof; the south bank's end and shore (to ≈ 22300); 余辉's 客船启程 and 船侧祭神 (an offering at a boat's side?) may be here or in river_w: look for them | owns 豪华客船 and the boats named here whichever side of 23300 or 21850 their stems read; the terrace on posts is structures_w's |
| `river_m` | 23300–26000 | 21700–26150 (the rope reaches west to 21780) | about 4–5 boats, 25–30 crew | **逆水行舟** (名画记 pin 15 at 24160): the two big hulls side by side (≈ 23550–25150, v 850–1250, and ≈ 23500–25100, v 480–900), which carries the mast at ≈ 24100–24180, **the eight men rowing** (sections.md), the crew (pin 16 聊天的伙计 at 24280 may be crew); **the tow rope** from the mast west to t2's trackers (≈ 21780–22150): its line as a `rope` polyline on the boat, its far end naming the trackers; the small canopied boat (≈ 24250–24500, v 500–600); the boat moored at ≈ 25150–25990 (v 650–1000); the water, the north shore and bank | the boat moored at ≈ 26000–26800 is river_e's |
| `river_e` | 26000–29050 | 25850–29200 | about 4–5 boats, 15–25 crew | the boat moored at ≈ 26000–26800 (mat-roofed cabin, rudder at ≈ 26600) whichever side of 26000 its stem reads; **the two grain boats 万石船** (名画记 pin 8 at 27460; ≈ 27270–28100 and ≈ 27950–28700) with their cargo, **the gangplank** (≈ 27650–27850, v 1030–1150) and anyone on it; the boat at the bottom (≈ 28300–29000, v 1300–1780, a ladder, a man at its east end); **the jetty** (the raised plank walkway with a railing, u ≈ 26950–27350, v 720–900: a structure if it stands at or over the water; if it stands wholly on land, say so and leave it to structures_e in your report); posts in the water's edge; **汴水悍激** (pin 7 at 26670) as the water's painted lines; the water, the north shore and bank | the S1 seam (below): the bottom boat is S2's; the willows' crowns over the water are the tiles' trees |
| `structures_w` | 20500–24600, plus `S2.road.main` over the whole area | 20350–24750 (the road: 20350–29200) | about 12–15 buildings | the shops along the north bank's top (u ≈ 20800–21600, v 0–120); the buildings at u 22300–24600 (v 0–450); **the terrace on posts over the water** (u ≈ 22950–23450, v 180–480: a building, floor line and posts into the water); the eatery's shelter; the south bank's roofs (u ≈ 20500–21500, v 1300–1800: placeholder footprints, bases below the silk); **`S2.road.main`** for the whole area; **MEASURE THE DIMINUTION EARLY** (figure heights against foot v at about every 1000 px of u, from the tiles' area: S2's land is at D ≈ 21–30 m); the receding-edge table (west and middle) | the road's point 0 is S3's route point at exactly u 20500 (v ≈ 280–330); its last point is at exactly u 29050 (S1's datum) |
| `structures_e` | 24600–29050 | 24450–29200 | about 18–22 buildings and a set piece | the building with **the pole scaffold on its roof** (u ≈ 24800–25150, v 0–200: part of the building); the big halls (u ≈ 25050–26450, v 50–600: 沿河雅座, pin 14); the far street's buildings at the top (u ≈ 25500–27000, v 0–150); **王家纸马铺**'s building (≈ 26850; its sign on a post is t8's prop); the sheds (≈ 27050–27800, ≈ 27700–28350, the long 望楼饭铺 shed ≈ 28250–29000): posts, roofs, the tables' platform; **the 望火楼** (u ≈ 28180–28450, v 50–260): a set piece, its brick platform (corners, height, the stair), the pavilion on it (posts, roof); the receding-edge table (east: the sheds' feet and tables are the best ground edges) | the road east of 24600 is structures_w's, but give your reading of its edges east of 24600 in your report; the jetty and the banks are river_e's |

## The seam with S3 (u 20500), for t1, structures_w, river_w

Settled in Phase 0 and S3's brief (`gen/expand/round2/brief_rainbow_bridge.md`, "The seam with S2"). S3 is mapped at
the same time by other agents; never record its entities.
- the big boat under the arch (bow ≈ 20450) and its whole crew are **S3's**;
- the boat moored along the north bank from ≈ 20330–20380 eastward (v 250–480) goes by its stem: most likely S2's
  (river_w). Read both ends; if the stem is west of 20500, it is S3's and you give a seam note;
- **the boat moored along the south bank (hull ≈ 19750–20650, v 1080–1220), with men waving from its roof, is S3's**
  even if its stem reads east of 20500. Never record it; a seam note only;
- **the big willow at the top (trunk ≈ 20450–20600, v 0–250) is S2's** (t1) even if its trunk reads west of 20500;
- the big tree with the dark trunk at ≈ 20330–20420 (base at the silk's bottom edge, crown to ≈ 20800) is **S3's**;
  the second dark willow trunk at ≈ 20480–20600 (v 1150–1790) goes by its base (t1);
- the south bank's roofs straddle the seam: each goes by the middle of its footprint corners (structures_w);
- `S3.road.main` ends on the north bank at u 20500 (v ≈ 280–330). **`S2.road.main`'s `lines.centre` point 0 is at
  exactly u = 20500**, S3's point there: if `gen/map/S3/parts/structures_w.json` has it when you write the road, copy
  its v; if not, use your own reading and say so (the frame step reconciles them);
- the river runs across: river_w ends its shore lines at u 20500 and gives their points there;
- list everything else that crosses u 20500 in your report, with its points on both sides.

## The seam with S1 (u 29050), for t12, structures_e, river_e

Settled in Phase 0 and S1's brief (`gen/expand/round2/brief_countryside.md`, "The seam with S2"):
- the 望楼饭铺 shed (≈ 28250–29000) and its customers are **S2's**, and so is the boat at the bottom (≈ 28300–29000);
  the seated customers at u ≈ 28900–29050 (v 500–700) and the man with a dark animal at u ≈ 28930–29000 are S2's;
- the village stalls from ≈ 29050 east are **S1's**;
- **the massive willow at the bottom right** (trunk u ≈ 28950–29210, base near the silk's edge): its base decides. t12
  records it only if the base reads west of 29050, and says so either way with the points;
- the two willows over S1's second stall (trunks u ≈ 29100–29260) are **S1's** unless a base reads west of 29050;
- **`S2.road.main`'s last centre point is at exactly u = 29050** (S1's datum), with its v as the strokes give it;
- river_e ends its shore lines at u 29050 (or where the silk's edge cuts them) and gives the points there;
- list everything else that crosses u 29050 in your report, with its points on both sides.

## The structures pass (structures_w and structures_e)

- **Buildings** (`S2.bld.<slug>_<u>`; named ones by name: `S2.bld.wang_paper_horse_shop_26850`,
  `S2.bld.fire_tower_28300`): `base` corners `sw`, `se`, `ne`, `nw` by compass (front = the side the main entrance
  faces; a north-bank house fronting the water faces south, `facing_deg` 270). Heights straight above base corners:
  `<corner>_eave`, `<corner>_ridge`, `<corner>_top`. `bays`: the column feet along the front. Hidden corners `est`,
  with how they were estimated in `note`. **Buildings cut by the silk's top edge** keep their visible corners and get
  placeholder north corners, said in the note; **buildings seen only as roofs** (the south bank) get placeholder
  corners too (the builder settles them as `choice:`). In `what`: storeys, roof type (hip, hip-gable 歇山, gable, mat or
  thatch for sheds), open front or walls, doors and windows, what the shop sells, **every signboard, banner, curtain,
  lamp or awning hung on it, and the pole scaffold, with the characters exactly as painted** (□ for illegible).
- **The 望火楼** (structures_e, a set piece): the brick platform as its own structure `S2.str.fire_tower_platform_<u>`
  (base corners, `<corner>_top` for its height, the stair's foot and top) and the pavilion on it as a building
  (posts' feet on the platform, eaves, ridge, finial); in `note` the platform's height in px against a figure at its
  foot.
- **Structures** (`str`) on land: walls, fences, railings, stairs, platforms, the sheds' raised floors if any.
- **Roads.** `S2.road.main` (structures_w), `"route": true`, `lines: {centre, edge_n, edge_s}`, west to east, point 0
  at exactly u 20500, last point at exactly u 29050. No road edge is drawn as a line: the edges are where the open
  ground stops (building fronts, the bank's top, shed posts). The north-bank strip is narrow, and **where the halls
  fill the bank (u ≈ 24600–26500) say which way the route goes** (the narrow bank in front of them at v ≈ 450–620, or
  the far street at the top at v 0–130), with the evidence, and check it stays inside the painted area. Side streets
  are their own roads (`S2.road.<slug>_<u>`).
- **Ground features** (`grd`) on land: yards, open ground (the wide east bank where the porters work), mounds, a
  raised step. The banks along the water are the river agents'.
- **The diminution** (structures_w, first thing): from the tiles' area, read the painted heights (foot v − head v) of
  standing adults at their foot v, about one every 500–1000 px of u along the north bank and on the south bank, and on
  the boats (crew at their deck's v), as a table `[u, foot v, painted height px]`. Compare with S4's (0.9 of the road's
  scale at v 850, 0.5 at v 320, 0.3 at v 220; a road figure ≈ 1.3 × 77 px/m ≈ 100 px at v 1200). Put it at the top of
  your report.
- **The receding-edge table** (for the frame's `dx_knots`): ground-level receding edges, each as two stroke points
  `(u1,v1)->(u2,v2)` with its slope dv/du and what it is: tables and benches (the eatery, the sheds), the terrace's
  floor edge, cart shafts, a platform's or a step's side, a wall's or shed's foot, the 望火楼 platform's foot. Eaves
  and ridges only where nothing at ground level recedes, and say so (they flatten with height: S4 measured ground
  −1.4 to −2.0, high lines −0.56 to −0.61). Group them west, middle and east.
- **SCALE CUES** in px, in `note` and your report: door heights, column heights and spacing, steps, railings, table
  heights, each with its foot v.

## What the restyle invents here

(Written from the restyle's check sheets, `gen/sections/canal/west|east/check/`; see `sections/canal/notes.md`.)

The restyle's commonest invention here is **extra people**: in crowds, on boats' decks, and inside knobbed willow
trunks. It also turned stacked poles into a willow and, on its first draw, the river into dry ground. Positions are in
scan px; full list in `sections/canal/notes.md`.

- **t1, t2:** figures climbing in the willow trunks at u ≈ 20440–20550 (v 1270–1460) and u ≈ 21490–21545
  (v 1160–1245): only the trunks' knobs are painted. Two or three figures at the big willow's west foot
  (u ≈ 21240–21340, v 1275–1385) are partly real: count on the scan.
- **t2:** **seven trackers** (two half-hidden); **the scan shows five**. At u ≈ 21880–21960 (v 1570–1680) a man
  shouldering a beam is made from a wooden object: read it.
- **t3:** **about six walkers on the bank strip** in front of the houses (u ≈ 22290–22950, v 270–470) and a broad
  stone stair at u ≈ 22480–22590: the scan has only the bank and the tow rope.
- **t4, t5:** a group of four or five (one in red) under the shelter east of the terrace (u ≈ 23600–23720,
  v 300–420): the scan shows one or two among the tables. At u ≈ 24180–24620 (v 40–260) the cart's team is drawn as
  an ox, with riders in red: read the team and any riders on the scan.
- **t5, t6:** **a willow at u ≈ 24600–24900 (v 0–200)** where the scan has stacked poles and the scaffold's pole tips:
  no tree is painted there.
- **t7, t8:** the far street at the top (u ≈ 25500–26500, v 0–130) is drawn denser (an ox cart with a round load,
  oxen, about ten people): its strokes are small and faint, so count on the scan at zoom 3. A small figure in blue on
  the bank at u ≈ 25900 (v 540–585) is probably a post.
- **t8:** two figures in red at the willow trunk at the top (u ≈ 26580–26720, v 50–150): the scan has one (≈ 26700).
  **王家纸马铺's signboard** (u ≈ 26876–26906, v 60–215) is drawn as a black pole with a lamp and no writing: copy the
  characters from the scan.
- **t9, t10:** **about twelve invented people in the yard under the tall pole frame (u ≈ 27300–27620, v 180–450)**: a
  crowd of eight or nine at v 330–440, two by the frame, one in red, a rider. The scan (checked at zoom 3) has the empty
  yard and the frame; only the porter with baskets at ≈ 27640 (v 350–460) is painted. Also a man in red beside the
  porter with a pole at u ≈ 27140–27200 (v 245–325), and a child in red at u ≈ 27715–27745 (v 815–935): neither is
  painted.
- **t10, t11:** six or seven sack porters at u ≈ 28180–28380 (v 645–920) where the scan has about four or five; a horse
  and two or three men round the porter carrying a sack up the bank (u ≈ 28210–28430, v 1030–1230): only the porter is
  painted. Small dark shapes at u ≈ 28420–28530 (v 790–1130): the restyle makes one a leaping dog; read them (birds? a
  dog?).
- **t11, t12, structures_e:** a hillside with terraced fields, a fenced path and houses at u ≈ 28600–29200 (v 0–330):
  the scan has roofs at the top and willow crowns. The 望火楼's platform (u ≈ 28310–28560, v 60–290) is drawn as a wide
  stepped stone terrace: read its corners and stair on the scan.
- **t12:** **the rider on a dark horse or donkey** by the long shed (u ≈ 28910–28990, v 570–680) is drawn as two
  standing men: the animal is painted.
- **river_w:** the small covered boat off the south bank (u ≈ 20955–21230, v 1060–1200) has its mat canopy drawn as a
  tiled pavilion roof; a mark in the open water at ≈ (20970, 630) is drawn as a man with a child (read it); a railing
  with a standing man on the big cabin boat's roof at u ≈ 21000–21360 (v 150–220): check.
- **river_w2:** the cabin boat at the bottom (u ≈ 21970–22215, v 1440–1590) **filled with about five people** (the
  scan shows one or two); the bottom boat at u ≈ 22130–23065 has one man pouring a bucket over the side, and the
  restyle adds a second on the gunwale; **豪华客船's foredeck (u ≈ 23320–23540, v 490–600) has about five people round
  the windlass** where the scan shows one (≈ 23500, v 540–600); its cabin windows (u ≈ 23200–23300, v 700–800) show three
  or four faces where the scan has two.
- **river_m:** knots of four or five people in red and blue on 逆水行舟's northern hull (u ≈ 23750–23980, v 500–580,
  and u ≈ 24600–24740, v 520–650; both halves agree): the scan shows two or three and a winch. Two men on the southern
  hull's bow (u ≈ 23600–23705, v 930–1060) where the scan has one.
- **river_m, river_e:** the river below the moored boats (u ≈ 25500–26500, v 1000–1790) is painted as **dry, grassy
  ground** in the east half's tile t_r1c1, fading into water from about u 26400 (three draws: dry, dry, then an invented shop street; the first is in place). It is water: the scan has the ripple lines. The bank under the
  great willow (u ≈ 26700–27050, v 690–1000) is paved with flagstones in the restyle; the scan has bare ground and
  wash, then water.
- **river_e:** **about eight people crowded onto the bottom boat** under the willow (u ≈ 28450–28850, v 1270–1630): the
  scan shows one or two among the cargo and the willow's knotted trunk.

## Finish

1. Write your file as `{"section": "S2", "entities": [...]}` to `gen/map/S2/parts/<unit>.json` (nothing else in the
   repo: scratch in your own folder).
2. Run `node tools/scroll_map.mjs S2 check --parts gen/map/S2/parts/<unit>.json` until it says PASS. Then the overlay
   over your whole range (zoom 1, grid 50) into `gen/map/S2/look/<unit>_overlay.jpg`, and zoom-2/3 windows over every
   dense part. Read every overlay image. **Every marker must sit on its thing** (feet on the ground contact, heads on
   heads, a boat's front at the waterline); fix and repeat until it does. Then make one more pass over your range
   looking only for what you missed (heads in crowds, things in doorways and sheds, far figures against the top edge,
   props at building bases, crew behind a gunwale, things under willow crowns).
3. Write your report to `gen/map/S2/reports/<unit>.md`:
   - counts by kind (figures, animals, vehicles, boats, trees, props, buildings, structures, roads, water, grd,
     groups); the crowds and how many figures you counted in each;
   - what was hard or ambiguous, faded areas, and what you read with the restyle (with `conf`);
   - the seam notes **by the neighbour's ID** (S3 or S1), and things at your range's edges that a neighbouring unit may
     also record (with their points); groups that cross your edges;
   - the support names you used (and how high they look);
   - scale cues (wheels, doors, tables, hulls, painted heights with foot v) and receding edges you saw, as two stroke
     points each;
   - the list of painted things you saw and **left to** another agent (what, where, to whom);
   - anything that contradicts `reference/scroll/sections.md`;
   - **lessons**: what you learned that the next round should know, as exact text for the skill.
4. Your final answer is the short structured result the workflow asks for; the long text goes in the report.
