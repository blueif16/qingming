# Brief: mapping S1 (the countryside, u 29050–37610) from the strokes

You are one of ten agents building **the scroll map** of 清明上河图 for a walkable web world, on area S1: the
countryside where the scroll begins, from the mist and the small bridge to the village tea stalls where the canal's
market starts. The map records where every thing in the painting is, measured from the strokes, so that later sessions
and builders never need to look at the scroll again. The user wants the world "absolutely loyal to the original
painting… replicate exactly what the painting has, even to the amount of trees", and "high quality work". Every
painted thing you miss will be missing from the world; every point you misplace puts a thing in the wrong place.
Precision and completeness matter more than speed.

S1 is the emptiest section in people and the fullest in **trees and ground**. Trees are counted one by one, trunk by
trunk. S1 is also **the pilot for the countryside ground**: its fields, banks, terraces, mounds, paths and the stream
are mapped here first, and the user signs off the ground built from them before the other open stretches are built the
same way. The silk is dark and faded here, the ground is ink wash, and the figures are small and faint.

This brief is S4 part 1's (`gen/map/S4/brief.md`) and S6's (`gen/map/S6/brief.md`), filled in for S1, with the
round 2 rules (`gen/expand/round2/mapping_rules.md`: read "Everyone" and the section for your role). The area brief is
`gen/expand/round2/brief_countryside.md`.

**Read first:**
- `qingming/map/README.md`: the format (IDs, points, kinds, fields, axes; follow it exactly), and its paragraph
  **Boats** (only t8 may need it);
- `qingming/reference/scroll/sections.md` §2, the paragraph "S1 郊野 · 古柳: the countryside" (lines 283–294, what
  scholars say is where, by scan x), and the pins table (lines 133–138);
- for what a finished map reads like, the first 120 lines of `qingming/map/text/S5.md`;
- `qingming/trees/types.md`, the tree forms mapped so far (so your tree `what` says which form it is, or that it is a
  new one).

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. S1 spans u 29050–37610, v 0–1790 (the silk's bottom edge is at about v 1770–1790;
  check it in your range). The silk ends at u ≈ 37610 (the mounting beyond).
- Axes: picture right = east (toward the scroll's start, away from the city), up the silk = north (away from the
  viewer). `facing_deg`: 0 = east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
- **The lay of the land** (the setup agent's first look at zoom 0.4–1.2, to orient you; the strokes decide). From the
  west:
  - **The village stalls** (u 29050–29800). Two big willows at u ≈ 29100–29260 (trunks v ≈ 450–700) stand over a
    stall shed with a hatched (thatched?) roof at u ≈ 29250–29820, its front eave at v ≈ 540–560, with people seated at
    a table under it (u ≈ 29300–29460, v 545–640). In front: a large dark mass at u ≈ 29340–29500, v 650–780 (a lying
    water buffalo, with something pale beside it), a standing ox at u ≈ 29490–29600 (v 600–720), and **a barrow lying
    on its side** at u ≈ 29670–29810 (v 630–695), its wheel at the east end. Far up, at v 90–300
    (u ≈ 29200–29900), long horizontal bank lines (terraced fields or banks) crossed by a diagonal track from about
    (29600, 100) to (29720, 310), with small figures or animals at u ≈ 29270–29330 and 29430–29500 (v 100–150). A
    figure walks at u ≈ 29175–29240 (v 950–1050).
  - **The 菜地 and the farmhouse** (u 29500–30400). The vegetable field: rows of small plants or brush at
    u ≈ 29530–30000, v 1070–1380. Figures carrying a pole at u ≈ 29800–29880 (v 920–1100) and a small figure at
    u ≈ 29660 (v 1000–1065): maybe the old man calling a child away (惊马闯市). A tiled farmhouse with a veranda at
    u ≈ 29980–30400 (v 920–1200).
  - **The runaway horse** (惊马闯市, upper half): a faint galloping animal at u ≈ 30075–30240, v 770–850, running west
    (its front half lost to damage); men with arms out run after it at u ≈ 30280–30380 (v 680–780), ≈ 30460–30530
    (v 690–760, half behind a willow) and ≈ 30610–30700 (v 590–680).
  - **The travellers on donkeys** (lower half, v ≈ 1270–1640): a rider at u ≈ 30090–30280, a walker with a stick at
    ≈ 30280–30380, a second rider at ≈ 30430–30580, a walker at ≈ 30600–30700, and a figure at u ≈ 29980–30030
    (v 1300–1470).
  - **The tomb-sweeping party** (high up the silk): the willow-decked sedan at u ≈ 30830–30930 (v 420–570) with its
    bearers, riders at u ≈ 30930–31020 (v 230–350), porters at u ≈ 31030–31150 (v 300–550).
  - **A thatched hut** with a wattle fence at u ≈ 30720–31300 (v 930–1330), and a shed on posts east of it
    (u ≈ 31230–31430, v 1000–1200) with a figure and a table or tub.
  - **The great willows** (隋堤烟柳): huge pollarded trunks at u ≈ 31450–33200, v 900–1650, crowns to the top of the
    silk; more willows along the top at u ≈ 31000–31600 (v 0–300); faded open ground at u 32100–33200.
  - **The farmhouses and the threshing floor** (寂静的谷场): a row of thatched and tiled roofs at u ≈ 33500–35200,
    v 600–900, behind and among bare trees (u ≈ 33300–35000, crowns from v ≈ 200); a threshing floor with something on
    it at about u 35000–35200, v 800–870 (a stone roller?). The lower half (v 1000–1700) is ink-wash ground and water:
    banks, a broad pale band, rocks at the bottom (≈ 34600–34900, v 1600–1700).
  - **The start**: bare trees at u ≈ 35400–37500; the charcoal donkey train walking west at v ≈ 730–940 between
    u ≈ 36280 and 36820 (loaded donkeys, one with its head turned at ≈ 36640–36690, a driver at ≈ 36780–36820); the
    small bridge just south of it, a flat deck on posts at u ≈ 36200–36650, v 1000–1080; under and west of the bridge,
    at u ≈ 36170–36450, v 1120–1210, the faint outline of **a small empty boat** (a sampan; the restyle reads it so
    too; on water or on the bank?); the stream running
    west from the bridge; broad water or mist below (v 1100–1600).
  - **Seals** overlap the silk at about u 37250–37560 (v 50–260, 800–980, 1120–1330, 1600–1740). **They are never
    recorded**, and nothing hidden under them is guessed.
  - Just past the west end (S2's, never record them): the 望楼饭铺 shed with seated customers at u ≈ 28900–29050
    (v 500–700), the man with a dark animal at u ≈ 28930–29000 (v 600–700), and the boat and structure at the bottom
    left (u ≈ 28300–28880, v 1500–1790).

## Tools for looking

Keep every script, crop and scratch file in **your own folder**,
`/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/S1_<unit>/` (for example
`S1_t2/`, `S1_structures_w/`). Up to 14 agents of five areas run at once; generic names collide.

- `node tools/scroll_map.mjs S1 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out <your folder>/<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg.
- `node tools/scroll_inspect.mjs countryside/west <u> <v> <half> <your folder>/inspect_<u>_<v>.jpg` shows the scroll
  beside our registered AI restyle with a grid (half ≤ 300 → 3× zoom). **S1 is restyled in two halves** (the image
  model letterboxes an overview wider than about 3:1), nested in the folder: use `countryside/west` for u < 33256
  (`gen/sections/countryside/west/mosaic.jpg`, u 28896–33392) and `countryside/east` for u ≥ 33256
  (`gen/sections/countryside/east/mosaic.jpg`, u 33120–37616). The tool clips its window to the half's edges, so near
  u 33256 use the half that holds the whole window. The restyle helps read faded silk, but it is a repaint:
  **positions come from the scroll's strokes**, and anything visible only in the restyle gets `"conf": "low"` and a note saying so. **The restyle also
  invents, most where the silk is faintest, which in S1 is almost everywhere: never record a thing because the restyle
  shows it.** Where it invents is listed below, "What the restyle invents here".
- `node tools/scroll_map.mjs S1 overlay --parts gen/map/S1/parts/<unit>.json --grid 50 --x U0-U1 --zoom 1 --out gen/map/S1/look/<unit>_overlay.jpg`
  draws your entities on the scan (your final self-overlay goes in `gen/map/S1/look/`; working crops stay in your
  folder); `node tools/scroll_map.mjs S1 check --parts gen/map/S1/parts/<unit>.json` validates the format. Warnings
  about supports not in the frame are fine (S1's frame is written later); list the support names you used in your
  report. Errors are not.
- Faint strokes: a crop with raised contrast helps (sharp's `linear`/`normalise` in a small script in your folder).
  Say in `note` when a thing was read that way.

## How to measure

- Work systematically: walk your range in columns about 200 px wide, top to bottom (v 0 to the silk's edge), and list
  everything in each window before moving on. **Small, distant, half-hidden and faint things count**: figures far up
  the silk, behind trees and fences, in doorways and under eaves, at tables, a head over a wattle fence, a child, a
  dog, a bird in a tree, a far tree crown at the top of the silk. **Count the painted figures in every group one by
  one at zoom 3 with the grid**: the stall's customers, the sedan's bearers, the porters, the chasers. Before
  finishing, re-walk your range once more looking only for what you missed.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put the
  point where the feet must be from the body (under the hips for a figure behind a fence or a donkey) and mark it
  `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what`. A lying figure: `foot` = the
  middle of the body on the ground; say which way the head lies. A kneeling figure: `foot` at the knees. A rider: a
  figure entity with `pose: "riding"`, `support: "animal S1.ani.<id>"`, `foot` = ground point straight under the seat
  (`est`), plus the animal as its own entity. A child: say "child" in `name` and `what`, and give its painted height
  against the adults' in `note` (the build scales children).
- `head` = top of the head or hat. Painted height = foot v − head v; say in `note` when it is far from the neighbours'.
  The painter shrinks things up the silk (S4: 0.9 of the road's size at v 850, 0.5 at v 320, 0.3 at v 220), so far
  figures are small: they are adults unless the strokes say child.
- **Animals:** `fore` = ground under the front hooves (their midpoint), `hind` = ground under the hind hooves, `head` =
  the head. In `what`: species as painted (donkey / mule / horse / ox / water buffalo / dog / pig), colour, pose
  (standing, walking, galloping, lying, head down), tack and load (bridle, saddle, saddle cloth, panniers, pack frame,
  charcoal baskets), and who rides, leads or drives it. **A damaged animal** (the runaway horse, its front half lost):
  map what is painted; `fore` est where the front hooves must be from the painted hind half, `head` est, `vis: "part:
  front half lost to damage"`, and in `note` the painted extents in px. Nothing is built for the missing half unless
  the user says so.
- **Vehicles:** `front` / `rear` = ground under the front end (where the shafts end, or the front of the body) and the
  rear end; `wheels` = where each visible wheel touches the ground. **A sedan chair is a vehicle**: `front` / `rear` =
  ground straight below the front and rear ends of its carrying poles (`est`), no wheels; its bearers are figures in a
  group with it; someone seated in it is a figure with `support: "sedan: S1.veh.<id>"`. In `what`: the type, body, roof
  (**the willow branches and flowers on the sedan's roof**: what they are, how many sprays), load, wheels, shafts. In
  `note`: the body's length and height and a wheel's rim extents in px (**SCALE CUE**), and the poles' or the body's
  receding edge as **DEPTH DIRECTION** with its two stroke points `(u1,v1) -> (u2,v2)` and slope dv/du.
- **Trees, the bulk of S1.** Every tree is its own entity. `base` = where the trunk enters the ground (`est` if hidden
  by a fence, a roof or the silk's edge), `top` = highest point of the crown, `crown_w` / `crown_e` = the crown's west
  and east extremes. In `what`: the form as painted (**pollarded old willow** with a knobbly swollen head and a fan of
  shoots, willow with rising shoots (`willow_fan` in `trees/types.md`), **bare elm-like tree** with twisted branches,
  sapling, shrub, other), size, lean, the number of trunks, leafing (early spring: bare or a faint haze), and what is
  in it (a bird, a nest). A clump of several trunks from one foot is one tree; separate trunks with separate feet are
  separate trees. Record a tree only where its own trunk or its own crown's base shows; say in `note` when a trunk is
  only inferred. Far crowns at the top of the silk count, each with its base `est`.
- **Props:** anything that stands on the ground (or on a floor) and isn't a building: stalls and their tables,
  benches, stools, mat awnings and canopies on their own poles, baskets, jars, tubs, sacks, bundles set down, piles of
  straw or brushwood, haystacks, the threshing floor's roller, flails, rakes and winnowing baskets, carts or barrows
  standing empty (a vehicle if it has wheels), hitching posts, a well, a trough, a signboard or flag on its own pole.
  `base` point (or footprint corners via `pts.base` {sw, se, ne, nw} for bigger ones). A row of identical things
  standing together can be one prop: give the **exact count** in `what`.
- **Carried and worn things** (a pole and its loads on a shoulder, a bundle on the back, a whip, a hat held, the
  tomb-sweepers' gear) are part of their carrier: describe them in the figure's `what`. Anything set down, propped or
  hung on its own is a prop entity. A visible bench or stool a figure sits on is its own prop (the figure's `what` names
  it by ID); a seat hidden under a figure is not recorded.
- **Signboards and written characters** (a stall's flag, a sign) go in `what` exactly as painted, character by
  character, top to bottom (□ for an illegible one, and say which are unclear).
- **Every painted thing is its own entity.** If your `what` or `note` mentions a painted thing ("a basket stands at
  his feet", "a dog runs beside the donkeys", "a bird on the branch"), that thing needs its own entity too, or a line
  in your "left to" list naming who owns it. Before finishing, read every `what` and `note` you wrote and check this.
- **Groups:** when several entities do one thing together (the sedan and its bearers and riders and porters, the
  donkey train and its drivers, a rider and his donkey and groom, a stall and its seller and customers, the horse and
  its chasers), add a `group` entity with `members` and a `what` that says what the group is doing, and set `group` on
  each member. A group lists only S1 IDs, and only IDs in your own file (the check fails otherwise); a member another
  unit owns goes in the group's `note` and your report.
- **IDs:** make the slug say what the thing is and end it with the u of its main point so IDs never collide between
  agents: `S1.fig.sedan_bearer_30870`, `S1.ani.donkey_charcoal_36420`, `S1.veh.sedan_willow_30880`,
  `S1.tree.willow_pollard_31820`, `S1.prop.stone_roller_35100`, `S1.grp.charcoal_train`, `S1.grd.bank_33600`.
- `what` is what someone who never sees the picture will read: dress (colour, robe or short jacket, hat or cap or
  kerchief, a cloak or hood against the cold), sex and age, action, what the hands hold, which way the head turns, the
  load, the state of a tree. One or two sentences, concrete. It is also what the casting of characters is decided
  from, so say what kind of person it is (farmer, groom, sedan bearer, porter, traveller, charcoal driver, stall
  keeper, old man, woman, child).
- Use `src` when sections.md or the 名画记 pins name the vignette (`余辉: 赶驴入城`, `余辉: 寂静的谷场`,
  `余辉: 隋堤烟柳`, `余辉: 迎寒策蹇`, `余辉: 惊马闯市`, `名画记: 赶驴入城 (pin 1)`, `名画记: 寂静的谷场 (pin 2)`,
  `名画记: 隋堤烟柳 (pin 3)`, `名画记: 骑驴客商 (pin 4)`, `名画记: 菜地 (pin 5)`, `名画记: 杨柳杂花装簇轿顶 (pin 6)`).
  Use `vis` and `conf` honestly.
- **When the painting is ambiguous, say so in `note` and lower `conf`. Never resolve it silently.** Faint things that
  change the cast or the build (a lying buffalo or a rock, a child or a dog, a boat or a bank's wash, water or mist or
  bare ground) are recorded with `conf: low` and a note giving both readings, never dropped.

## Supports

`support` is what a thing stands on. Use these names (their heights go into the frame afterwards):
- `ground`: roads, paths, fields, yards, the threshing floor, open stall floors at ground level;
- `animal S1.ani.<id>`: a rider; `sedan: S1.veh.<id>`: someone seated in a sedan (foot est on the ground under the
  seat);
- `carried in arms`, `shoulders`, `carried on back`: a child carried (its own figure, foot at the carrier's foot);
- `ground: on <prop id>`: standing or sitting on a prop whose base is on the ground; `table top: <prop id>`;
- `small bridge deck`: anyone on the small bridge (in `note`, the v of the deck line under the figure);
- `bank top`, `bank slope`: a figure or thing on a raised bank or terrace clearly above the ground around it (in
  `note`, the v of the bank's foot and top under it, so the frame can give it an H: things on raised ground mapped at
  H 0 read about 1.5 m of depth per metre of height too far north);
- `stream`: a boat on the stream; `boat deck: <boat id>`: its crew (t8, if there is a boat);
- anything else: say it in words and report it.

## Ownership

You own entities whose **main point** has u inside your range, [start, end): a figure's foot, an animal's fore, a
vehicle's front, a tree's base, a prop's base; for buildings and structures, the middle of their footprint corners;
for roads, ground features and water, the unit named below. Look about 150 px past both ends for context, and don't
record things owned by the next unit. A group that crosses the boundary goes to the unit holding most of its members;
list your own members and name the others in your report (by what and where), so the merge can join them. **Named
owners override the ranges** (the units table): t2 records the runaway horse with its chasers and the travellers on
donkeys whole, t8 the donkey train and the possible boat whole, wherever their u.

**Who records what:**
- **Tile agents** (`t1`–`t8`, by range): figures, animals, vehicles (the sedan, any cart or barrow, a boat), trees,
  props, groups.
- **Structures agents** (`structures_w` 29050–33000, `structures_e` 33000–37610): every building (thatched or tiled
  farmhouses, the stalls' sheds with roofs, the hut, sheds on posts), structure (fences and wattle walls, the small
  bridge, platforms, steps, a well's curb), road and path, ground feature (fields, the threshing floor's surface, banks,
  terraces, mounds, rocks, ditches) and water (the stream, ponds, the broad water if it is water). `structures_w`
  records `S1.road.main` from its datum at u 29050 to u 33150; `structures_e` records the rest of it as the join piece
  `S1.road.main_east` (below).
- **The in-between kinds:** stalls, mat awnings and canopies on their own poles, tables and benches, the threshing
  floor's roller and tools, haystacks and straw piles, hitching posts, a flag or sign on its own pole are the **tile
  agents' props**, even when they lean on a building. A flag, sign or curtain **fixed to or hung from a building** is
  part of the building. Fences, wattle walls and gates are structures, even round a field. **If unsure, record it as
  your prop: a duplicate is easy to drop, a miss is not.**
- **Every agent ends its report with the list of painted things it saw and left to another agent** (what, where, to
  whom). The merge compares these lists; the things everyone left are the most common misses.

## The units

| unit | owns u | looks at u | density | what to find (hints to verify, not facts) | seams and boundary notes |
|---|---|---|---|---|---|
| `t1` | 29050–30300 | 28900–30450 | medium: about 20–25 figures, many trees | **the village tea and food stalls**: the stall shed (≈ 29250–29820; the shed is `structures_w`'s) with its tables, benches, seller and seated customers, counted head by head (any awning on its own poles is your prop); **the animals in front** (≈ 29340–29600: the lying water buffalo, one in the strokes though the restyle draws two; the standing ox), with their herders; **the barrow lying on its side** (≈ 29670–29810, v 630–695: a vehicle, `front`/`rear` and its wheel); the far figures at v 0–300; **the 菜地's workers** (pin 5 at 29900) and the pole carriers; the small figure near ≈ 29660 (v 1000–1065): the old man calling a child away (惊马闯市)?; the walker at ≈ 29200 (v 950–1050); **every willow**, including the two over the stall (trunks ≈ 29100–29260) and the big willow at the bottom left | **the S2 seam (below)**; the runaway horse, its chasers and the travellers on donkeys (from u ≈ 29980) are **t2's**: record none of them, but if the old man and the child of 惊马闯市 are in your range they are yours (say so in the report: the merge joins them to t2's group) |
| `t2` | 30300–31100 | 29900–31250 | dense for S1: about 20–25 | **the tomb-sweeping party** (名画记 pin 6 at 30740): the willow-decked sedan (a vehicle) and its bearers, the riders and their horses or donkeys, the porters and their loads, counted one by one; **the travellers on donkeys** (pin 4 at 30010; 迎寒策蹇): every rider, walker and animal, including the figure at ≈ 29980–30030; **the runaway horse** (惊马闯市) with its front half lost (map what is painted) and **every chaser**; the farmhouse's people (≈ 29980–30400) if their feet are ≥ 30300; willows | **named owner: the runaway horse with its chasers, and the travellers on donkeys, whole, wherever their u** (t1 records none of them); the thatched hut (≈ 30720–31300) and its wattle fence are `structures_w`'s; the people at it are yours |
| `t3` | 31100–32100 | 30950–32250 | open: under 10 | **隋堤烟柳, the great old willows**: every tree trunk by trunk (pollarded heads, the number of stems, the lean), the far willows along the top (≈ 31000–31600, v 0–300); the shed on posts east of the hut (≈ 31230–31430) and its figure and table or tub (the shed is `structures_w`'s; what stands under it is yours); the porters at the party's east end if their feet are ≥ 31100 | the party's members west of 31100 are t2's |
| `t4` | 32100–33200 | 31950–33350 | open: under 5 | willows, faded open ground (pin 3 at 32190); any far figure at the top | |
| `t5` | 33200–34300 | 33050–34450 | open: under 10 | the people at the threshing floor and the farmhouses (pin 2 寂静的谷场 at 34100); **bare trees** (elm-like, twisted) round the farmhouses, counted one by one; props at the house bases (baskets, piles, a well) | the farmhouses are `structures_e`'s |
| `t6` | 34300–35400 | 34150–35550 | open: under 10 | the farmhouses' people; **the threshing floor's roller and tools** (≈ 35000–35200, v 800–870: props; the floor itself is `structures_e`'s); haystacks; trees | |
| `t7` | 35400–36300 | 35250–36450 | open: under 5 | trees (the big bare trees at ≈ 35400–36200); anything on the stream's banks | the donkey train and the possible boat are **t8's** |
| `t8` | 36300–37610 | 36150–37610 | open: about 7–10 | **the charcoal donkey train** (赶驴入城, 名画记 pin 1 at 36550): 5 donkeys with their loads (charcoal panniers?) and 2 drivers (sections.md's count: verify), one by one; **the possible small boat** at u ≈ 36170–36450, v 1120–1210 (read it at zoom 3: if it is a boat, record it with the boat convention, `S1.veh.boat_<type>_<u>`, `support: stream`, its crew if any on `boat deck: <id>`; if it is a bank's wash, say so in the report and leave it to `structures_e`); the bare trees of the start (≈ 36200–37500); the mist | **named owner: the whole donkey train and the possible boat, wherever their u.** **The seals (≈ 37250–37560) are never recorded**; a tree half under a seal is recorded from its visible part, the rest est |
| `structures_w` | 29050–33000, plus `S1.road.main` from u 29050 to 33150 | 28900–33150 | the stalls' sheds and roofs (≈ 29050–29800, v 450–700), the bank lines and the diagonal track at the top (≈ 29200–29900, v 90–300: terraces? a road?), the farmhouse with a veranda (≈ 29980–30400), the hut and its wattle fence (≈ 30720–31300), the shed on posts (≈ 31230–31430); **the 菜地** (≈ 29530–30000, v 1070–1380); the paths (the travellers', the party's); **the ground**: banks, terraces, mounds, the great willows' ground; any water at the bottom left | **the countryside-ground pilot, west half**; `S1.road.main`'s point 0 at the datum (below); the receding-edge table | the S2 seam (below) |
| `structures_e` | 33000–37610, plus the road from u 32850 east as `S1.road.main_east` | 32850–37610 | the farmhouses (≈ 33500–35200, v 600–900), thatched and tiled; **the threshing floor** (≈ 35000–35200); fences; **the stream** and **the small bridge** (≈ 36200–36650, v 1000–1080); the broad water or mist below (v 1100–1600); **the ground**: banks, terraces, rocks (≈ 34600–34900, v 1600–1700) | **the countryside-ground pilot, east half**; the stream's water level (below); the receding-edge table | the seals are never recorded |

## The seam with S2 (u 29050), for t1 and structures_w

S2 (the canal) is being mapped at the same time by other agents; its tile `t12` covers u 28700–29050 and looks to
29200. The main-point rule decides; settled in Phase 0 (`map/index.md`, "Seams"):
- **S2's, never record them:** the 望楼饭铺 shed (≈ 28250–29000) and its customers; the shed with seated customers at
  u ≈ 28900–29050 (v 500–700) and the man with a dark animal at u ≈ 28930–29000 (v 600–700) by their main points; the
  boat and the structure at the bottom left (u ≈ 28300–28880, v 1500–1790).
- **S1's:** the village stalls from ≈ 29050 east, with their customers.
- **The big willow at the bottom left** (trunk u ≈ 29000–29210, v 1490–1780, base near the silk's edge): read its base
  at zoom 3. If it is at u ≥ 29050, it is t1's tree; if not, it is S2's and t1 gives its base, top and crown extremes
  in the report as a seam note. Say which in the report either way.
- **The two willows over the stall** (trunks u ≈ 29100–29260): t1's unless a base reads west of 29050.
- If S2's part or strokes exist when you work (`gen/map/S2/parts/*.json`, `map/strokes/S2.json`), check that nothing
  you record within u 28900–29200 duplicates an S2 entity; otherwise list every entity of yours within u 29050–29200 in
  the report, so the merge's cross-key seam check can settle it.
- List everything that crosses u 29050 (a roof, a path, a tree crown, a group, the road), with its points on both
  sides, as seam notes for S2.

## The structures pass (structures_w and structures_e)

- **Buildings** (`S1.bld.<slug>_<u>`: `S1.bld.farmhouse_thatched_34200`, `S1.bld.stall_shed_29450`): `base` corners
  `sw`, `se`, `ne`, `nw` by compass (front = the side the main entrance faces; `facing_deg`). Heights straight above
  base corners: `<corner>_eave`, `<corner>_ridge`, `<corner>_top`. `bays`: the column or post feet along the front.
  Hidden corners `est`, with how they were estimated in `note`. **Buildings seen only as roofs** behind trees, fences or
  each other get placeholder corners, said in the note (the builder settles them as `choice:`). In `what`: the roof
  (**thatch** or tile; hip, gable, lean-to), walls (mud, wattle, timber, open), doors and windows, a veranda, what is
  done there, and any flag, sign or curtain hung on it, with characters exactly as painted. A farmstead of several
  buildings round a yard is several building entities: say which belong together.
- **Structures** (`str`): fences and wattle walls (a `line` of their foot, with the height in `note`), gates, **the
  small bridge** (`S1.str.small_bridge_<u>`: the deck's two edges as `lines: {deck_n, deck_s}` or its corners as
  `base`, the posts' feet as `bays`, the deck's height over the water in `note`), steps, platforms, a well's curb.
- **Roads and paths.** `S1.road.main` (`"route": true`, `lines: {centre, edge_n, edge_s}`, points in increasing u) is
  the country road walked through the section. **No road edge is drawn as a line in the countryside:** read the
  edges where the trodden ground meets field, bank, fence or grass, and say how you read them. Which painted track is
  the main road (the travellers' lower road, the sedan party's upper track, the donkey train's path) is your reading:
  say why in the report.
  - **structures_w** records `S1.road.main` from point 0 to u 33150. **Point 0 is the datum**: S2's route point at
    u 29050. If S2's part or strokes exist (`S2.road.main`, recorded by S2's `structures_w`), use its centre line's v
    at u 29050 exactly; if not, use your own reading and say so in the report (the frame agent sets the exact point
    later, and the lead decides if the two roads don't meet).
  - **structures_e** records the road from u 32850 to its east end (the bridge, or where it leaves the silk or the
    mist takes it) as the **join piece `S1.road.main_east`** (same three lines, increasing u). The merge splices it
    into `S1.road.main` at u 33000 in `merge_fixes.mjs`; it never becomes a map entity of its own.
  - Other paths and tracks are `S1.road.path_<u>` (`lines: {centre, edge_n, edge_s}`, or `edge_w`/`edge_e` for one
    running up the silk), recorded by the structures agent whose range holds most of each: say where each meets the
    main road and where it ends.
- **The ground (the pilot).** Record everything the strokes say about the ground, because here the ground is what is
  built:
  - **Banks and terrace edges** (the painter's ink-wash bands and contour strokes where the ground steps or slopes):
    `S1.grd.bank_<u>` with `lines: {bank_top, bank_foot}` (the top edge, and the line where it meets the lower ground);
    in `note`, which side is higher and its height, judged from a figure, tree trunk or post standing beside it (px,
    with that thing's ID if it has one).
  - **Fields** (the 菜地; any ploughed or planted ground): `S1.grd.field_<u>` with `base` corners or a `line` of its
    edge; in `note`, the rows' direction as two stroke points (a receding edge for the frame) and their count.
  - **The threshing floor** (`S1.grd.threshing_floor_<u>`): its edge as `base` corners or a `line`; its surface.
  - **Mounds, rocks and outcrops** (`S1.grd.mound_<u>`, `S1.grd.rocks_<u>`): `base` corners and `<corner>_top`.
  - **Ditches and the stream's banks**: `bank_top` / `bank_foot` lines as above.
  - **Water** (`S1.water.stream_<u>`, `S1.water.pond_<u>`): `lines: {shore_n, shore_s}` that stop where the silk's
    edge or the mist cuts them. **The stream is not the 汴河:** take two stroke points at the small bridge (a bank top
    and the waterline straight below it; in this frame height moves a point only in v, so "straight below" is the same
    u) and give its depth below the ground beside it in the report, so the frame can write the support `stream`.
  - **Ink-wash bands that may be water, mist or bare ground** (the broad pale band under the farmhouses, the lower half
    at the start): `conf: low` with both readings in `note`. Plain silk at the silk's edges and round the start is
    mist (rule 4): don't record it, say where it is in the report.
- **The receding-edge table** (for the frame's `dx_knots`): ground-level receding edges, each as two stroke points
  `(u1,v1)->(u2,v2)` with its slope dv/du and what it is: the 菜地's rows, a fence's foot running back, a farmhouse's
  side-wall foot or veranda edge, the threshing floor's side, the small bridge's deck and its posts, a table or bench
  at the stall, a path's straight stretch. Eaves and ridges only where nothing at ground level recedes, and say so
  (they flatten with height: S4 measured ground −1.4 to −2.0, high lines −0.56 to −0.61). Group them west, middle and
  east. **structures_w: put the edges nearest the seam (u 29050–29800) first**, since the frame starts from S2's knot
  there.
- **The diminution:** figure heights (foot v − head v) against their foot v, from the tile agents' figures in your
  range or your own reading of a few: 6–10 pairs from the bottom of the silk to the top (S4: 0.9 of the road's size at
  v 850, 0.5 at v 320, 0.3 at v 220).
- **SCALE CUES** in px, in `note` and your report: door heights, post spacing, a fence's height, the bridge's span and
  deck width, the threshing floor's size, each with its foot v.
- Write `gen/map/S1/parts/structures_w.json` or `gen/map/S1/parts/structures_e.json`.

## What the restyle invents here

(Written from the restyle's check sheets, `gen/sections/countryside/check/`; see `sections/countryside/notes.md`.)

Two restyle halves, `countryside/west` (u 28896–33392) and `countryside/east` (u 33120–37616), 2026-10-12. Registered
alignment is 0.42–0.58 on the top rows and 0.21–0.42 on the bottom rows, where the silk is only ink wash: there the
restyle can sit 20–40 px off the strokes (the boat by the bridge is drawn about 30 px south-east of its outline). Never
take a point from it. What it gets wrong, by u range (read the scan at zoom 3, with the restyle only beside it):

- **Everywhere:**
  - **Roofs.** It draws almost every roof as blue tile. The strokes show thatch (hatched strokes) on the stalls
    (≈ 29250–29820), the hut (≈ 30670–31200) and most of the east farmhouses (≈ 33400–35200); the farmhouse with the
    veranda (≈ 29980–30400) is tile in the strokes too. Read thatch or tile on the scan, roof by roof.
  - **Trees.** It adds green weeping willows behind the bare trees (rows of them behind the east farmhouses,
    ≈ 33100–35900, v 200–700, and over the far bare trees at ≈ 32380–32850, v 150–640), and ivy-like leaves on the
    pollarded trunks (≈ 32480–32620, v 1170–1370, where the strokes have dark knots). Count only trunks the scan shows.
  - **Water and ground.** It cannot tell water from ground: it paints the pale and dark wash bands as dry ground with
    grass tufts and stone banks (under the bridge ≈ 36100–36700, v 1050–1250; ≈ 33120–34144, v 1300–1600; a rubble
    bank at ≈ 34860–35840, v 1150–1320), and grass where the silk is plain. The strokes decide.
  - **People.** It adds people round almost every group. Count heads on the scan only.
- **u 29050–30300 (t1, structures_w):**
  - under the stall (≈ 29250–29360, v 545–640) it adds a standing man in red beside the seated customer;
  - **one** lying water buffalo in the strokes (≈ 29340–29500, v 680–790); the restyle draws two lying animals beside
    the standing ox;
  - the stall's east end (≈ 29764–29960, v 480–650) becomes a white-walled house with a blue roof;
  - by the pole frame (≈ 29700–29800, v 1040–1130) it draws a standing man in a blue-and-white robe where the strokes
    show a pale rounded mass (a rock? a hooded figure?): settle it on the scan;
  - right: the barrow lying at ≈ 29670–29810 (v 630–695), the terraced bank lines and the diagonal track at the top,
    the small figure at ≈ 29670 (v 995–1070), the walker at ≈ 29200, the big willow at the bottom left (its base about
    u 29070–29230, v 1730–1790).
- **u 29950–31150 (t2):**
  - **the runaway horse** (≈ 30080–30240, v 760–850) becomes a small beast with a pack (a pig or a loaded donkey); the
    strokes show a faint galloping animal with its legs stretched; the first chaser gets a bundle on his back;
  - the travellers: it draws two men where the strokes show one walker at ≈ 29960–30030, and 4–5 people round the
    second rider (≈ 30400–30700, v 1350–1620) where the strokes show the hooded rider and about 1–2 walkers;
  - right: the sedan with willow sprays on its roof, the riders and porters of the party (it may add one).
- **u 30630–31480 (t2, t3, structures_w):** a white-walled house with a blue roof invented behind the shed on posts
  (≈ 31130–31470, v 835–1210); one walker drawn as two at the tile edge (≈ 30630–30700, v 1440–1635).
- **u 31500–32520, v 0–1030 (t3, t4): useless above the willows.** Three takes all filled the faded upper silk with
  things the strokes don't have: a house with a railing and figures (≈ 31500–31680), a crowd with horses
  (≈ 31680–31950, v 890–1024), a street of shops with a gateway (take 2, kept in
  `gen/sections/countryside/west/runs/takes/`), and in the kept take 3 a man leading a loaded donkey, a porter with a
  shoulder pole and three people at v 100–260 (≈ 31800–32480), a fenced building at the top right and a house at the
  bottom left (≈ 31620–31850, v 790–1000). The strokes there: far willows, faded open ground and the great willows'
  crowns. Below v 1030 (the second take of the bottom row) it is faithful: the pollarded trunks only.
- **u 33120–35400 (t5, t6, structures_e):**
  - a golden haystack at ≈ 33450–33670 (v 770–870) where the strokes show a thatched roof (or a haystack: read it);
  - people and animals at the farmhouses that the strokes don't show at this zoom: a man leading a donkey
    (≈ 33460–33560, v 860–935), a man in red (≈ 34050, v 830–920), a walker and a dog (≈ 33450 and 33816,
    v 875–935), a crowd with oxen or horses (≈ 34070–34380, v 820–915; the strokes show one bending figure at
    ≈ 34230–34270 and objects at ≈ 34120–34200), seated and standing men and a man with a donkey in the farmyard
    (≈ 34900–35290, v 790–900). Each is a hint to look, never a record;
  - right: the bench or roller frame at ≈ 35100–35170 (v 830–860), the rocks at the bottom (≈ 34550–34760,
    v 1540–1780).
- **u 35400–37610 (t7, t8, structures_e):**
  - **the charcoal train** (≈ 36270–36850, v 720–940) is walked by 6–8 men in blue in the restyle; the strokes paint
    5 loaded donkeys and 1–2 drivers (one at ≈ 36780–36820). Count on the scan;
  - a man by a tree at ≈ 35940 (v 850–930): likely invented;
  - **the boat**: both the restyle and the strokes show a small empty boat (a sampan) under and west of the bridge,
    hull ≈ 36170–36440, v 1130–1210 in the strokes; whether it lies on water or on the bank is open;
  - the pole or broken trunk leaning on the tree at ≈ 36990–37090 (v 690–810) is painted (both show it);
  - the seals are painted out, and the mist at the top right (≈ 37000–37600, v 450–700) becomes distant fields, a
    horizon and far willows: none of that is painted. Plain silk there is mist.

## Finish

1. Write your file as `{"section": "S1", "entities": [...]}` to `gen/map/S1/parts/<unit>.json` (nothing else in the
   repo: scratch in your own folder).
2. Run `node tools/scroll_map.mjs S1 check --parts gen/map/S1/parts/<unit>.json` until it says PASS. Then the overlay
   over your whole range (zoom 1, grid 50) into `gen/map/S1/look/<unit>_overlay.jpg`, and zoom-2/3 windows over every
   dense or faint part. Read every overlay image. **Every marker must sit on its thing** (feet on the ground contact,
   heads on heads, a tree's base on its trunk foot, a bank's line on its stroke); fix and repeat until it does. Then
   make one more pass over your range looking only for what you missed (far figures, people behind fences and trees,
   props at house bases, far tree crowns, a second trunk).
3. Write your report to `gen/map/S1/reports/<unit>.md`:
   - counts by kind (figures, animals, vehicles, trees by form, props, buildings, structures, roads, water, grd,
     groups); the groups and how many figures you counted in each;
   - what was hard or ambiguous, faded areas, and what you read with the restyle (with `conf`);
   - the seam notes **by the neighbour's ID** (S2), and things at your range's edges that a neighbouring unit may also
     record (with their points); groups that cross your edges;
   - the support names you used (and how high they look);
   - scale cues (donkeys, doors, the sedan, the bridge) and receding edges you saw, as two stroke points each;
   - the list of painted things you saw and **left to** another agent (what, where, to whom);
   - anything that contradicts `reference/scroll/sections.md` (the donkey train's count, the order of the vignettes);
   - **lessons**: what you learned that the next round should know, as exact text for the skill.
4. Your final answer is the short structured result the workflow asks for; the long text goes in the report.
