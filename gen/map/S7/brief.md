# Brief: mapping section S7 (the scroll's end, u 815–2000) from the strokes

You are one of several agents building **the scroll map** of 清明上河图 for a walkable web world. The map records
where every thing in the painting is, measured from the strokes, so that later sessions and builders never need
to look at the scroll again. Errors here become errors in the world, and anything you leave out will not exist in
it, so precision and completeness matter more than speed. The user: "absolutely loyal to the original painting…
replicate exactly what the painting has, even to the amount of trees"; "I want high quality work".

This brief is S6's (`gen/map/S6/brief.md`, the inner city, mapped 2026-10-11) filled in for S7. S7 is the last piece
of the scroll at the city end, west of S6: the official's compound and its gatehouse (官宦人家, 门房指路), the doctor's
shop 赵太丞家 (太丞医铺), the broad-hatted official riding out with his retinue, the street, the 解 building's roofs
along the bottom and the willows at the cut edge. Round 2's shared rules are `gen/expand/round2/mapping_rules.md`
("Everyone" plus your role's section); the area brief is `gen/expand/round2/brief_city_end.md`.

**Read first:** `qingming/map/README.md` (the format: IDs, points, kinds, fields, axes; follow it exactly), then
`qingming/reference/scroll/sections.md` §2, the S7 paragraph (lines 353–360), 余辉's three questions (line 82: 问病 at
赵太丞家, 问命 at the 解 sign, 问道 at the gatehouse) and the 名画记 pins of S7 (§1.4: **48 国医赵太丞家 u 1630, 49
官宦人家 u 1240**). For the level of detail expected in `what` and `note`, skim the first 120 lines of `map/text/S6.md`;
its west end (the well, the 解 ring) is your neighbour.

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. S7 spans **u 815–2000**, v 0 to the silk's bottom edge (about v 1775–1790: check
  it in your range). The west end is the silk's **cut edge at u ≈ 815**: the scroll is thought to be cut short here,
  and nothing is painted beyond it.
- **Collectors' seals are stamped over the silk's west edge** (red, u ≈ 815–910, at about v 0–110, 180–460,
  600–960 and 1040–1120). Never record a seal or the mounting. Read the strokes through them; a trunk or figure
  hidden under a seal gets `est` points, `vis: "part: collector's seal"` and a note.
- Axes: picture right = east (toward S6 and the gate), up the silk = north (away from the viewer). `facing_deg`: 0 =
  east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
- **The lay of the land** (the lead's first look and the setup agent's, to orient you; the strokes decide):
  - **The street** (S6's main street, continuing) runs west through the middle of the silk at about v 900–1300. In
    it: the official in a broad hat (head u ≈ 1580–1660, v ≈ 985–1000) riding, his horse mostly hidden behind a small
    roof in front; a man at u ≈ 1440–1530 with a long object over his shoulder (the object runs u ≈ 1355–1480,
    v ≈ 1080–1100); a pale oval outlined in ink at u ≈ 1450–1610, v ≈ 1115–1190 between that man and the rider (the
    horse's body? the folded object?); two attendants at u ≈ 1660–1770; a porter with shoulder-pole baskets
    (u ≈ 1190–1350, v ≈ 1080–1240); men walking at u ≈ 1850–2000 (one is the bundle man, foot ≈ (1972, 1257)).
  - **North of the street:**
    - The gatehouse of the official's compound (u ≈ 1020–1430, v ≈ 580–950): open gate hall with its door at
      u ≈ 1150–1290, a raised stone block in front of the door's west post (u ≈ 1130–1210, v ≈ 820–890), the
      gatekeeper seated by the fence (u ≈ 1040–1100), a man standing behind him at the post (u ≈ 1120), the visitor
      with a big cloth bundle on his back and a **food box in his right hand** (foot ≈ (1290, 965), box ≈ (1320, 935)),
      facing a man in a dark cap who points the way (u ≈ 1340–1390, head v ≈ 765; his hand ≈ (1330, 800)). A small
      lamp seems to hang inside the gate at ≈ (1246, 680).
    - A low wooden fence (railing) at u ≈ 900–1050, v ≈ 790–890.
    - 赵太丞家 (u ≈ 1440–1800, v ≈ 380–990): the horizontal board 赵太丞家 at v ≈ 620–680; a vertical board fixed to
      the shop front at u ≈ 1460–1490 (v 680–880); **free-standing tall boards on their own feet**: one or two at
      u ≈ 1385–1445 (feet ≈ v 990–1000) and one at u ≈ 1755–1790 (feet ≈ v 985); a tilted lattice stand at
      u ≈ 1430–1490, v ≈ 900–975. Inside: a seated woman (u ≈ 1490–1535), a woman with a child (≈ 1535–1580), a man
      in a dark robe (≈ 1590–1635), a counter or cabinet at the back (≈ 1600–1700, v 680–770), a chair (≈ 1645–1690,
      v 750–815), a bench by the east board (≈ 1735–1780, v 770–860).
    - East of the shop (u ≈ 1800–2000, v ≈ 720–1000): a man bending under a pole by the well's west end (head
      ≈ (1880, 835)), tall wooden buckets at the platform's west end, and a **pale rounded shape** at u ≈ 1800–1990,
      v ≈ 760–860 (see the restyle warnings).
    - The compound's tiled roofs fill the top of the silk (u ≈ 1000–1900, v 0–600), with a wall panel at
      u ≈ 1080–1340, v ≈ 255–335 (a lattice or a board of small characters, with a dark object hung in its middle at
      ≈ (1240, 310): window, lock or plaque? faces at it?), and a **black bird on a roof slope** at ≈ (1715–1740,
      110–150).
    - Needle trees at the top right (u ≈ 1850–2000, v ≈ 50–300); S6's needle tree `S6.tree.needle_tree_2025` has
      foliage at 1985–2055.
  - **South of the street:** a small roof on posts at u ≈ 1330–1615, v ≈ 1165–1280 (it hides the horse); a
    hip-gable building below it (u ≈ 1290–1590, v ≈ 1270–1590); the 解 building's big roof (u ≈ 1380–1950,
    v ≈ 1290–1790) with a tall slatted tub at its east end (u ≈ 1937–2013, v ≈ 1597–1750, foot ≈ (1973, 1741)); the
    mat awning's west end at u ≈ 1870–1935, v ≈ 1262–1370 (S6's).
  - **West:** willows at the cut edge (u 815–1000, the whole height; one more willow crown at u ≈ 980–1150,
    v ≈ 300–560); a bare tree with knobbed twig ends (u ≈ 820–1200, v ≈ 940–1300); big bare and willow trees along
    the bottom (u ≈ 815–1400, v ≈ 1250–1790).

## Tools for looking

- `node tools/scroll_map.mjs S7 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out gen/map/S7/look/<unit>_<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg. Write crops only under
  `gen/map/S7/look/`, named after your unit (`t1_…`, `t2_…`, `structures_…`).
- `node tools/scroll_inspect.mjs city_end <u> <v> <half> gen/map/S7/look/<unit>_insp_<u>_<v>.jpg` shows the scroll
  beside our registered AI restyle (`gen/sections/city_end/mosaic.jpg`, covers u 816–2160, v 0–1792) with a grid
  (half ≤ 300 → 3× zoom). The restyle helps read faded silk, but it is a repaint: **positions come from the scroll's
  strokes**, anything visible only in the restyle gets `"conf": "low"` and a note, and **never record a thing because
  the restyle shows it.** Read the warnings below first.
- `node tools/scroll_map.mjs S7 overlay --parts <your file> --grid 50 --x U0-U1 --zoom 1 --out gen/map/S7/look/<unit>_self.jpg`
  draws your entities on the scan; `node tools/scroll_map.mjs S7 check --parts <your file>` validates the format
  (warnings about supports not in the frame are fine; errors are not).
- Scripts and scratch files go in your own folder,
  `/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/S7_<unit>/`. Up to 14
  agents run at once; never use a generic script name in a shared place.

## Where the restyle invents (read before you use it)

The restyle (run 1, 2026-10-12, `sections/city_end/notes.md`) registers well (0.53–0.66) and is right about most
figures, the shop and the roofs. It departs from the strokes here:

- **u ≈ 815–910, all heights (the cut edge):** it drops the seals (right: they are not painted things) and paints
  willow trunks reaching the ground at about u 835–930, v ≈ 870–880, where the seals cover the scan. Trunk bases there
  come from the strokes only (`est`, and say what the seal hides).
- **u ≈ 1715–1740, v ≈ 110–150:** it **drops the black bird** on the roof slope. The bird is painted: record it from
  the scan.
- **u ≈ 1800–2000, v ≈ 760–870 (behind the bucket man):** it turns the pale rounded shape into a long striped animal
  with its head down (in the overview, a mat roof). On the scan it is a faint pale mass with an ink outline (a
  rounded west end at u ≈ 1800, a top line at v ≈ 787–800). Read it at zoom 3: an animal (which?), a cloth or mat
  over something, or part of a shed. If you can't settle it, record it with `conf: low` and both readings in the
  note; never drop it silently.
- **u ≈ 1400–1610, v ≈ 1080–1190 (the retinue):** it paints the official's horse as a white horse whose body shows
  above the small roof, with the man in front holding a rope to it, and the long object as a rolled pole. The scan's
  pale oval may indeed be the horse's body (an outlined, uncoloured horse), but the horse's colour, head and legs in
  the restyle are its own. Map the horse from the strokes.
- **u ≈ 1320–1390, v ≈ 740–960 (the gatehouse scene):** it gives the pointing man a woman's hair bun and puts a white
  puff (steam or cloud) at ≈ (1330, 745) that the scan doesn't have; the scan's man wears a dark cap and points with
  his hand at ≈ (1330, 800).
- **u ≈ 1480–1640, v ≈ 700–890 (the shop's interior):** about the right number of figures, but the dress colours
  and the child's place are the model's. Count heads on the scan at zoom 3.
- **u ≈ 1830–2160, v 0–300:** the needle-cluster trees come out as soft leafy trees (as on S5 and S6). Species come
  from the strokes.
- **u ≈ 815–1400, v ≈ 1250–1790:** the bottom trees are merged into one big tree and willow masses. Count trunks on
  the scan.
- **u ≈ 2040–2160, v ≈ 1380–1630 (S6's 解 ring):** it adds seated figures under the awning. That is S6's, already
  mapped; nothing to record.

## How to measure

- Work systematically: walk your range in columns about 200 px wide, top to bottom (v 0 to the silk's edge), and list
  everything in each window before moving on. **Small, distant, half-hidden and indoor things count**: people seen
  through the shop front, faces at a window or a door, a head behind a roof or a fence, figures at the very top of
  the silk, a child in arms, a bird on a roof. **Count the painted figures in every group one by one**: the women
  and children at the doctor's, the retinue, the men at the gate are individuals, each its own entity. Before
  finishing, re-walk your range once more looking only for figures you missed.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put
  the point where the feet must be from the body (e.g. under the hips for a figure behind a roof or counter) and mark
  it `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what` (a painted bench or stool
  is its own prop; a seat hidden under the figure is not recorded). A kneeling figure: `foot` at the knees. A child:
  say "child" in `name` and `what` (they will be scaled down), and give the painted height against an adult's.
  A child held by an adult is its own figure, foot at the carrier's foot, support `carried in arms` (or `shoulders`,
  `carried on back`).
- **The rider** (t2): the official is a figure with `pose: "riding"`, `support: "animal S7.ani.<id>"`, `foot` = the
  ground point straight under the seat (`est`); his horse is its own animal entity **however little of it shows**:
  `fore` and `hind` = ground under the front and hind hooves (`est`, from the body and the rider), `head`, `vis:
  "part: <what hides it>"`. Say in `what` what of the horse is painted (outline, colour, saddle, bridle, reins, who
  leads it) and in `note` which strokes you took for it.
- `head` = top of the head or hat (the broad hat's crown, not its brim). `painted height` = foot v − head v; say in
  `note` when it is far from the neighbours' (children, far figures).
- Animals: `fore`, `hind`, `head`; in `what`: species as painted, colour, pose, tack, load, who rides or leads it.
  **The bird on the roof** is an animal: `fore` and `hind` at its feet on the roof, `head`, `support: "roof: <the
  building's ID if you know it, else 'roof at u …'>"`, and in `note` the eave and ridge points straight below and
  above it, so its height can be derived.
- Trees: `base` = where the trunk enters the ground (`est` if hidden), `top` = highest point of the crown, `crown_w` /
  `crown_e` = the crown's west and east extremes. In `what`: species as painted (willow with hanging whips, bare
  elm-like with twisted or knobbed branches, pine-like with needle clusters, other), size, lean, leafing, number of
  trunks. A clump of several trunks from one foot is one tree; separate trunks with separate feet are separate
  trees. A crown that runs off the silk's west edge: say so (`crown_w` at the edge, `est`).
- Props: anything that stands on the ground (or on a floor) and isn't a building: free-standing signboards on their
  own feet or posts, stands, counters, chairs, benches, stools, buckets, tubs, baskets and loads set down, boxes,
  racks. `base` point (or footprint corners via `pts.base` {sw, se, ne, nw} for bigger ones). **Signboards: copy
  their characters into `what` exactly as painted** (traditional characters as written, top to bottom; □ for an
  illegible character, and say which are unclear). Scholars give "治酒所伤真方集香丸" for one of 赵太丞家's boards:
  record what the strokes show, character by character. Furniture inside the open shop front counts.
- **Carried and worn things** (the porter's pole and baskets, the visitor's bundle and food box 食盒, the retinue's
  long object, a fan, a whip) are part of their carrier: describe them in the figure's `what`. Anything set down,
  propped or hung on its own is a prop.
- **Every painted thing is its own entity.** If your `what` or `note` mentions a painted thing ("buckets stand at
  his feet", "a bird sits on the roof"), that thing needs its own entity too. Before finishing, read through every
  `what` and `note` you wrote and check this.
- Groups: when several entities do one thing together (the official, his horse and his retinue; the gatekeeper, the
  pointing man and the visitor; the women, children and doctor at the shop; the men at the well's west end), add a
  `group` entity with `members` and a `what` that says what the group is doing, and set `group` on each member. **A
  group lists only S7 IDs**: a link to an S6 entity goes in the group's `note` (`check` rejects foreign members).
- IDs: make the slug say what the thing is and end it with the u of its main point so IDs never collide between
  agents: `S7.fig.gatekeeper_1065`, `S7.fig.visitor_food_box_1290`, `S7.fig.official_rider_1600`,
  `S7.ani.horse_official_1470`, `S7.ani.bird_roof_1725`, `S7.tree.willow_edge_850`, `S7.prop.board_zhao_east_1775`,
  `S7.grp.official_retinue`, `S7.bld.zhao_taicheng`, `S7.bld.gatehouse_1020`.
- `what` is what someone who never sees the picture will read: dress (colour, robe or short jacket, hat or cap or
  kerchief), sex and age, action, what the hands hold, which way the head turns, the load. One or two sentences,
  concrete. It is also what the casting of characters will be decided from, so say what kind of person it is
  (official, attendant, groom, gatekeeper, visitor, porter, doctor, woman, child, servant, water carrier…).
- Use `src` when sections.md or the pins name the vignette (`余辉: 太丞医铺`, `余辉: 门房指路`, `名画记: 国医赵太丞家
  (pin 48)`, `名画记: 官宦人家 (pin 49)`, `Hansen: the rider in a broad hat`). Use `vis` and `conf` honestly.
- **Faint things that change the cast or the build** (the pale shape, a second child, a face at a window) are
  recorded with `conf: low` and a note giving both readings, never dropped silently.

## Supports

`support` is what a thing stands on. Use these names (their heights go into the frame file afterwards):
- `ground`: the street, the yards, open shop floors and the gate hall's floor at street level;
- `floor: <building ID>`: a floor or platform raised above the street (the doctor's shop floor or the gate hall's
  floor, if they are raised): in `note` give the floor line's v under the figure and the street's v straight below
  it, so the step can be measured;
- `upper floor: <building ID>`: a figure at an upper window;
- `animal S7.ani.<id>`: a rider;
- `carried in arms`, `shoulders`, `carried on back`: a child held by an adult;
- `ground: on <prop ID>` (base on the ground under the thing) and `table top: <prop ID>` (base on the top): things
  standing on or set on furniture;
- `roof: <building ID>`: the bird;
- anything else: say it in words and list it in your report.

## Who records what (the main source of misses)

- **Tile agents** record figures, animals, trees and props: free-standing signboards on their own feet or posts,
  lamps or boards standing at a door, counters, chairs, benches, stools, buckets, tubs, baskets, boxes, stands.
- **The structures agent** records buildings, structures (the fence, walls, steps and platforms, the stone block at
  the gate, the small roof on posts), roads and ground features, and **everything fixed to a building in its
  `what`**: the horizontal board 赵太丞家, the board fixed to the shop front at u ≈ 1460–1490, writing, plaques,
  hanging lamps, curtains, the wall panel at u ≈ 1080–1340, the medicine drawers if they are built into the back
  wall. Copy every character as painted, □ for the unreadable.
- "If unsure, record it as your prop: a duplicate is easy to drop, a miss is not." Every agent ends its report with
  the list of painted things it saw and **left to** another agent (by what and where, and the expected owner).

## Units and ownership

You own entities whose main point (figure foot, animal fore, vehicle front, tree base, prop base) has u inside your
range, [start, end), **except where this table says otherwise**. Look past both ends as given, and don't record
things the table gives to another unit. A group goes to the unit holding most of its members.

| unit | owns u | looks at u | density | hints to verify | seam and boundary entities |
|---|---|---|---|---|---|
| `t1` | 815–1450 | 815–1600 | medium: about 12–18 figures, mostly v 700–1300; many trees | the gatehouse scene 门房指路 (pin 49 官宦人家 at u 1240): the gatekeeper, the man at the post, the visitor with the bundle and the food box, the man pointing the way; faces at the wall panel or the gate; the porter; the willows to the cut edge, the bare tree with knobbed twigs, the big trees along the bottom; benches or stools at the gate | west: the silk's cut edge (seals are not recorded). **Not t1's:** the official's retinue (all of it, even a member whose foot falls west of 1450) and 赵太丞家's free-standing boards and stand at u ≈ 1385–1490: both are t2's; list them under "left to t2" |
| `t2` | 1450–2000 | 1300–2150 | dense: about 20–25 figures | 赵太丞家 (pin 48 at u 1630; ≈ 1480–1780): the women and children, the doctor, the man at the door, the shop's furniture; **its free-standing boards at u ≈ 1385–1445 and ≈ 1755–1790 and the tilted lattice stand at ≈ 1430–1490 (yours even west of 1450)**; the official riding out with his retinue (≈ 1440–1780; **every member is yours**, the horse its own animal however little shows); the bird on the roof (≈ 1725, 130); the needle tree at ≈ 1910 (separate from `S6.tree.needle_tree_2025` only if its own trunk or crown top shows); the bucket man, the pale shape and the men at the well's west end; the walkers at 1850–2000 | every S6 ID in "The seam with S6" below; the 解 plaque (settled: S6's, see below) |
| `structures` | 815–2000 | 800–2150 | about 8–12 buildings | 官宦人家 (the compound's stacked roofs and the gatehouse), 赵太丞家 with its back halls and its fixed boards, the 解 building and the small roof on posts in front of it, the hip-gable building between them, the fence, the street `S7.road.main` | `S6.road.main`, the awning's posts, the 解 building's eave and the bar the plaque hangs from |

## The seam with S6 (u 2000)

S6 is mapped (`map/strokes/S6.json`, `map/text/S6.md`); never re-record its entities. **Entities that straddle the
seam stay S6's, and S6's builder builds them.** What you learn about one is a **seam note on its S6 ID, in your
report** (the lead applies it), not a new S7 entity.

- **`S6.road.main`** continues west as `S7.road.main` (structures agent). S6's centre line starts at (2000, 1180) est;
  its `edge_n` at u 2000 is v 800 (the wall foot of the house behind the well) and its `edge_s` is v 1300 (the 解
  building's north side; S6 ran that edge down the slanted board from (2045, 1310) to (2165, 1775)).
- **`S6.str.square_well_2000`**: the curb's centre is (2102, 917), so the well is S6's; only its plank platform's
  west end (front edge v ≈ 997 from u ≈ 1955, back edge v ≈ 855 from ≈ 1995) lies on your side. The tall hooped
  buckets standing on that west end are **S7's props** (t2), not part of the well.
- **`S6.prop.mat_awning_2000`**: the mat is seen from v 1262 to v 1365–1370, u ≈ 1870–2297, its west end tied into
  your corner building with posts at u ≈ 1918–1936. Say in a seam note (structures agent; t2 confirms) whether those
  posts are the awning's or the building's, and where the mat really starts.
- **`S6.prop.jie_signboard_2085`**, the tall triangular board (feet (2050, 1768) and (2120, 1708), apex
  ≈ (2000, 1416)), leans against the eave of your corner building. **The 解 plaque is already in S6's note**: it hangs
  at u 2005–2058, v 1529–1576 from a bar at v ≈ 1522 that runs east from the building's post at u ≈ 1936 (the setup
  agent's zoom-3 look agrees; the area brief's u 1955–1990 is about 50 px too far west). So the plaque is S6's: no
  S7 entity. The structures agent says in a seam note whether the bar is the building's (then the plaque is the
  building's sign) or the board's.
- **`S6.bld.far_house_1859`** (top of the silk, roof from u ≈ 1820, eave v ≈ 100) and **`S6.str.fence_far_2000`**
  are S6's: seam notes only.
- **`S6.tree.willow_2330`** is S6's; its crown reaches west to u 1822 (the big bare-looking crown over u 1780–2150,
  v 150–740). **`S6.tree.needle_tree_2025`** is S6's (foliage 1985–2055, v 12–250).
- S6's figures nearest the seam: `S6.fig.well_bucket_lifter_2032` (foot (2032, 896)), `S6.fig.crouching_dark_2028`
  (foot (2028, 1290) est), `S6.fig.itinerant_monk_2078` (the man with the tall back frame, foot (2078, 1248)),
  `S6.fig.jie_listener_west_2062`. They are not yours.
- **Yours, listed by S6 as not yet mapped** (`map/index.md`): three buckets at the well, (1990, 928), (1950, 920)
  and (1922, 995); the tub under the 解 sign (1973, 1741); a man with a bundle (foot 1972, 1257); the 解 building
  (small roof 1880–1960, big roof 1500–1830); a needle tree at about 1910; figures at u 1850–1900. **The seam is
  tight here** (S6's figures at 2028–2032 stand 30–60 px from yours): before you record anything at u 1950–2000,
  check S6's list above, and say in your report how you told yours from S6's.

## The west edge (u ≈ 815)

The scroll's end: no seam, no neighbour, no panel (mist only, `map/BUILDING.md` rule 4). Record what is painted up
to the edge and nothing more. A tree or roof cut by the edge gets its visible points and `est` ones at the edge.
The structures agent measures **the silk's cut edge** (u at v ≈ 100, 900 and 1700) and the silk's bottom edge, and
gives them in its report.

## Finish (tile agents)

1. Write your file as `{"section": "S7", "entities": [...]}` to `gen/map/S7/parts/<unit>.json`.
2. **Validator:** `node tools/scroll_map.mjs S7 check --parts gen/map/S7/parts/<unit>.json` must PASS; then the
   overlay of your whole range at zoom 1 with grid 50, and zoom-2 windows over every dense part (t2: the shop's
   interior, the retinue, the well's west end). Read every overlay image. Every marker must sit on its thing (feet on
   the ground contact, heads on heads); fix and repeat until it does. Then make one more pass looking only for what
   you missed (heads behind the boards and the small roof, faces at windows, things at building bases, the bird).
3. Report `gen/map/S7/reports/<unit>.md`, then reply with its essentials: counts by kind (figures, animals, trees,
   props, groups); each group and how many figures you counted in it; what was hard or ambiguous; faded areas; the
   seam notes by S6 ID; things at your range's edges a neighbour may also record (with their points); the list of
   painted things you saw and **left to** another unit; support names you used (and how high they look); real-size
   cues in px (doors, boards, benches, buckets, the tub, a horse's body); **receding edges you saw** (a counter's or
   bench's side, the stand, the stone block, a board's feet) as two stroke points `(u1,v1)->(u2,v2)` each, for the
   frame's knots; anything that contradicts sections.md; and **lessons**, as exact text for the skill.

## The structures pass (one agent, the whole area u 815–2000, looking to 2150) — the critical path

The structures agent records, for the whole area: every **building** (`bld`), every **structure** (`str`: the fence,
walls, steps and platforms, the stone block at the gate, the small roof on posts if it stands on its own), the
**road** (`road`) and **ground features** (`grd`). Start at once: the tile agents and the frame wait on you.

- **Buildings** (`S7.bld.<slug>_<u>`; the named ones by name: `S7.bld.zhao_taicheng`, `S7.bld.gatehouse_<u>`,
  `S7.bld.jie_building_<u>`, …): `base` corners `sw`, `se`, `ne`, `nw` by compass (front = the side the main
  entrance faces: the shop and the gatehouse face the street, south, `facing_deg` 270; a building south of the
  street fronting it faces north, `facing_deg` 90). Heights straight above base corners: `<corner>_eave`,
  `<corner>_ridge`, `<corner>_top`. `bays`: the column feet along the front. Hidden corners `est`, with how they were
  estimated in `note`. **Footprints seen only as roofs** (the compound's stacked roofs at the top, the 解 building
  and the hip-gable building south of the street, whose bases are behind their roofs or below the silk) get
  placeholder corners, said in the note; the builder settles them as `choice:`. In `what`: storeys, roof type (hip,
  hip-gable 歇山, gable), open front or walls, doors and windows, what the shop sells, **every board, plaque, lamp,
  curtain or awning fixed to it, with the characters exactly as painted** (□ for illegible). Say which entities
  belong together (the compound 官宦人家: its gatehouse and halls; 赵太丞家: its front hall and back halls).
  - 官宦人家 (pin 49, u 1240): the gatehouse (u ≈ 1020–1430) and the halls behind it (the stacked roofs at the top
    of the silk, u ≈ 1000–1900, v 0–600). Is the gatehouse an open gate hall (门屋) with a door, and are its doors
    open? The wall panel at u ≈ 1080–1340, v ≈ 255–335: what is it (lattice window, a board of characters, a
    notice), and what hangs at ≈ (1240, 310)?
  - 赵太丞家 (pin 48, u 1630): the front hall (u ≈ 1440–1800) and its back halls; the board 赵太丞家 (v ≈ 620–680:
    copy it, including any characters beyond the four); the board fixed to the front at u ≈ 1460–1490 (copy it); the
    medicine drawers or cabinet if built in. **The free-standing boards on their own feet are t2's props** (mention
    them in your report, not as entities).
  - South of the street: the small roof on posts (u ≈ 1330–1615, v ≈ 1165–1280: a gate roof? a shed? which building
    does it belong to?), the hip-gable building below it (u ≈ 1290–1590), the 解 building (big roof u ≈ 1380–1950,
    v ≈ 1290–1790) and the corner building at its east end that the 解 board leans against and the awning ties into
    (small roof ≈ 1880–1960). S6 calls the corner building S7's: say whether it is part of the 解 building.
  - East of the shop (u ≈ 1800–2000, v ≈ 600–860): what stands behind the bucket man (a wall, a shed with a lean-to
    roof and a post at u ≈ 1905?) and where `S6.bld.house_well_2020` (west end at u 2020) begins.
- **The fence** (`S7.str.fence_<u>`, u ≈ 900–1050, v ≈ 790–890): its line or corners, height, posts, and whether it
  continues west under the seals.
- **The road.** `S7.road.main`, with `"route": true` and `lines: {centre, edge_n, edge_s}`. The centre line runs
  **west to east (increasing u)**, and **its last point must be exactly `[2000, 1180]`**, `S6.road.main`'s first point
  (the frame's datum: `S7.road.main:lines.centre.<last>`, station −73.63). Its edges at u 2000 meet S6's: `edge_n`
  `[2000, 800]` and `edge_s` `[2000, 1300]`, unless the strokes say otherwise (then say so). No road edge is drawn
  as a line: the edges are where the open ground stops (the gatehouse's and the shop's fronts and the fence on the
  north; the small roof, the hip-gable building and the 解 building on the south). Its west end is the silk's cut
  edge. Say whether anything opens off it (a lane, the compound's yard).
- **Ground features** (`grd`): a raised step or platform in front of the gate or the shop, a drain, yards.
- **The receding-edge table** (for the frame's `dx_knots`): ground-level receding edges, each as two stroke points
  `(u1,v1)->(u2,v2)` with its slope dv/du, grouped west (the fence, the gatehouse's threshold and step sides, the
  stone block), middle (the doctor's floor edge, counter and benches as you see them, the shop's side walls' feet)
  and east (the walls and the shed east of the shop, the 解 building's posts). Eaves and ridges flatten with height
  (S4: ground −1.4 to −2.0, high lines −0.56 to −0.61): use them only where nothing at ground level recedes, and say
  so. Put the table in your report and the edges in each entity's `note`. The frame's seam knot is `[2000, 50.4]`
  (S6's value); S6's west building edges read about −0.8 to −1.15.
- **SCALE CUES** in px, in `note` and your report: door heights, column heights and spacing, steps, the fence's
  height, board sizes, the stone block.
- **Seams with S6** (no S7 entities for these; seam notes by S6 ID in your report): `S6.road.main` (its edges at the
  seam), `S6.prop.mat_awning_2000` (the posts at 1918–1936: awning's or building's?), `S6.prop.jie_signboard_2085`
  (the bar at v ≈ 1522 from u ≈ 1936: building's or board's?), `S6.bld.far_house_1859`, `S6.bld.house_well_2020`,
  `S6.str.square_well_2000` (its platform's west end).
- Write `gen/map/S7/parts/structures.json`; report `gen/map/S7/reports/structures.md` as a tile does, plus: the
  buildings in order along the street, the boards and writing with their characters, the receding-edge table, the
  silk's cut edge and bottom edge, what is ambiguous, and lessons as exact text for the skill.
