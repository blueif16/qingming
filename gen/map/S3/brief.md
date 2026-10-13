# Brief: mapping section S3 (the Rainbow Bridge, u 15500–20500) from the strokes

You are one of 14 agents building **the scroll map** of 清明上河图 for a walkable web world. The map records where
every thing in the painting is, measured from the strokes, so that later sessions and builders never need to look at
the scroll again. The user wants the world "absolutely loyal to the original painting… replicate exactly what the
painting has, even to the amount of trees", and "high quality work". Every painted thing you miss will be missing
from the world; every point you misplace puts a thing in the wrong place. Precision and completeness matter more than
speed.

This brief is S4's and S6's (`gen/map/S4/brief.md`, `gen/map/S6/brief.md`) filled in for S3, with round 2's boat and
bridge rules. The rules every agent follows are `gen/expand/round2/mapping_rules.md` ("Everyone" and your role); the
area's facts are `gen/expand/round2/brief_rainbow_bridge.md`.

**Read first:**
- `qingming/map/README.md`, the format: IDs, points, kinds, fields, axes, **Boats**, and the supports with
  `H_profile`. Follow it exactly.
- `qingming/reference/scroll/sections.md` §2, the paragraph "S3 虹桥: the Rainbow Bridge" (lines 310–321), and the
  名画记 pins (lines 150–157).
- `gen/expand/round2/brief_rainbow_bridge.md`, "Your area": the setup agent's first look, and the seams.
- `sections/rainbow_bridge/notes.md`: where the restyle invents (summed up below).
- For what a finished map reads like, skim the first 120 lines of `qingming/map/text/S5.md`.

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. S3 spans u 15500–20500, v 0–1790 (the silk's bottom edge is at about
  v 1770–1790; check it in your range).
- Axes: picture right = east (toward the canal and the countryside, S2 and S1), up the silk = north (away from the
  viewer). `facing_deg`: 0 = east / right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer.
  S4b (the moorings) is the west neighbour at u 15500; S2 (the canal) the east neighbour at u 20500.
- **The lay of the land** (the setup agent's first look; the strokes decide; more in the area brief):
  - **The river** is a diagonal band. In the west it runs along the top of the silk (water ≈ v 230–950 at
    u 15500–17500). The far (north) bank is a thin strip along the top edge (v 0–250): shops, tables, a willow,
    moored boats. Toward the east the water widens and drops: under the arch it is ≈ v 300–1100.
  - **The near (south) bank:**
    - the long riverside hall (≈ 15530–16450, roof v 950–1250, a railed veranda with diners at v 1300–1500);
    - 十千脚店 (its big hip roof ≈ 16400–16850, v 1200–1790, and its gate under the 彩楼欢门 scaffold,
      ≈ 16800–17330);
    - the open ground (≈ 17300–18400, v 1100–1790) with the 串车 and porters;
    - the stalls and crowd at the bridge's south foot (≈ 18100–18900);
    - the shops along the bottom edge (≈ 18500–20650, v 1000–1790).
  - **The bridge:**
    - the deck rises from the south foot (≈ 18400–18900) to the crown (≈ 19400–19600; the arch's top edge at
      v ≈ 180–200) and lands on the north bank at about (19950–20000, 280–330);
    - the arch's south foot is at ≈ 18850–19000, v 750–1050;
    - the big boat lowering its mast lies under it (≈ 19350–20450, v 300–800);
    - a second boat is moored along the south bank past the arch (≈ 19750–20650, v 1080–1220), with men waving
      from its roof.
  - **The route** (`S3.road.main`) runs along the south bank (hidden under roofs at the bottom edge west of the
    tavern door, u 15500 to ≈ 17000), climbs the bridge, crosses the crown and comes down onto the north bank, then
    runs east along it to u 20500.

## Tools for looking

- `node tools/scroll_map.mjs S3 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out gen/map/S3/look/<unit>_<what>.jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg. Write crops only under
  `gen/map/S3/look/`, named after your unit (`t5_parasols.jpg`), never elsewhere.
- `node tools/scroll_inspect.mjs rainbow_bridge <u> <v> <half> gen/map/S3/look/<unit>_insp_<u>_<v>.jpg` shows the
  scroll beside our registered AI restyle (`gen/sections/rainbow_bridge/mosaic.jpg`, covering u 15344–20656) with a
  grid (half ≤ 300 → 3× zoom). The restyle helps read faded silk, but it is a repaint: **positions come from the
  scroll's strokes**. Anything visible only in the restyle gets `"conf": "low"` and a note saying so. The restyle also
  invents: never record a thing because the restyle shows it. **Read "Where the restyle invents" below before you
  use it.**
- `node tools/scroll_map.mjs S3 overlay --parts gen/map/S3/parts/<unit>.json --grid 50 --x U0-U1 --zoom 1 --out gen/map/S3/look/<unit>_self.jpg`
  draws your entities on the scan. `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/<unit>.json`
  validates the format. Warnings about supports not in the frame are fine (S3's frame is written later); errors are
  not. List the support names you used in your report.
- Scripts and scratch files only in `/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/S3_<unit>/`.
  Up to 14 agents run at once, and generic names collide.

## Where the restyle invents (read before using it)

The restyle ran on 2026-10-12, and the six weakest tiles were rerun once (`sections/rainbow_bridge/notes.md` has the
full list and the scores). Its registered alignment is good in the west and **poor over the bridge in both runs**: the
model recomposes the bridge every time. By u range:
- **u 15344–17200 (the river's west reach, the hall, the scaffold): usable** for reading what a faded thing is. It
  turns the bare, stiff-twigged trees (≈ 16100–16700, v 350–1000, and along the bottom edge) into weeping willows, and
  tiles the boats' cabin roofs. It repaints the hall's figures: a standing woman in red at ≈ 15800, v 1300–1400 (the
  scan has a small figure in that window: read what it is), and more diners than the 3–4 painted at
  ≈ 16000–16200, v 1330–1430. It adds figures on the balcony at the hall's east end (≈ 16200–16400). It rewrites the
  脚店 sign's characters. Copy writing from the scan only.
- **u 17060–18080 (the 新酒 banner, the far-bank boats, the 串车): good below v 770 (rerun, alignment 0.51), fair
  above (0.36).** It tiles the mat roof of the shed at ≈ 17600–17900 and the far-bank boats' cabins (painted with mat
  or plank roofs), garbles the banner's 新酒 and the 串车's load, and widens the far bank. The first run put a dark
  animal at the 串车's front; the rerun doesn't. Read whether anything draws the 串车 on the scan at zoom 3.
- **u 17900–18950 (the bridge's south foot): unreliable.** It is zoomed and shifted (alignment 0.08–0.3). It turns
  the mat-covered boats unloading at the south bank (≈ 17800–18100, v 750–1000) into mat stalls on a boardwalk. It
  drops the bridge's ramp at the tile's east edge and paints a beaten-earth road there. It moves the sedan about
  150 px east, enlarges the black donkey at ≈ 17900 into an ox, and moves the parasols.
- **u 18770–20650 (the arch, the crown, the big boat, the north bank, the south bank's shops): do not use the
  mosaic here** (alignment 0.07–0.16 in both runs). The tiles paint the arch larger and shifted, and the east tile
  invents a second full arch east of the crown. They redraw the big boat lower and further west and drop its crew from
  under the arch. They make the north-bank tavern a pavilion, turn the mat-awning stalls under the arch into a tiled
  shop with round basins, and **paint the boat moored along the south bank as house roofs** (the men waving from it
  stand on tiles). The bare tree with the dark trunk at ≈ 20380 becomes a leaning willow. Read this stretch from the
  scan at zoom 3.
  - To tell what a faded mass is, the overview is the better of the two: it keeps one arch and the boat's crew. Use
    `gen/sections/rainbow_bridge/overview_reg.png`, the whole-section restyle registered onto the rect (alignment
    0.54; 4096 × 1415 px for u 15344–20656, v 0–1792: px x = (u − 15344) × 0.771, y = v × 0.790).
  - The overview too moves the arch's south foot west and the big boat down, paints the moored boat as roofs, drops
    the dark-trunk tree, and smears its last ≈ 250 px (u ≈ 20400–20656). Use it to name things, never to place them.
- The registered bottom-row tiles carry a smeared strip along their edges (rows and columns the registration
  clamps). Read figures there from the scan.

## How to measure

- Work systematically: walk your range in columns about 200 px wide, top to bottom (v 0 to the silk's edge), and list
  everything in each window before moving on. **Small, distant, half-hidden and indoor things count**: diners at a
  window, figures on the far bank at the very top of the silk, a head behind a railing or a parasol, a child at a
  shoulder, a dog. **Count the painted figures in every crowd one by one, head by head at zoom 3 with the grid**: the
  crowd on the bridge, the people at the railings, the porters, the customers at a stall are individuals, each with
  an entity. The silk is darkened under parasols and awnings; count there twice. Before finishing, re-walk your range
  once more looking only for figures you missed.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put
  the point where the feet must be from the body (e.g. under the hips for a figure behind a railing or a stall) and
  mark it `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what` (a painted bench or
  stool is its own prop). A rider: a figure with `pose: "riding"`, `support: "animal S3.ani.<id>"`, `foot` = ground
  point straight under the seat (`est`), plus the animal as its own entity. A kneeling figure: `foot` at the knees. A
  lying figure: `foot` = the middle of the body, and say which way the head lies. A child: say "child" in `name` and
  `what`, with its painted height against an adult's.
- `head` = top of the head or hat. In `note`, say when the painted height (foot v − head v) is far from the
  neighbours' (children, far figures).
- Animals: `fore` = ground under the front hooves, `hind` = under the hind hooves, `head` = the head. In `what`:
  species as painted (horse, donkey, mule, ox, dog…), colour, pose, tack (bridle, saddle, saddle cloth, pack frame,
  collar, traces), load, and who rides, leads or drives it.
- Vehicles: `front` / `rear` = ground under the front end (shaft tips, or the front of the body) and the rear end;
  `wheels` = where each visible wheel touches the ground. In `what`: the type (串车 barrow, two-wheeled cart, sedan
  chair 轿), body, cover and load (the 串车's load may be a screen used as a tarp: 余辉, `sections.md:456–460`; record
  what the strokes show), shafts, team and who pulls or pushes. **A sedan chair is a vehicle**: `front` / `rear` =
  ground straight below the ends of its carrying poles (`est`), no wheels; its bearers are figures in a group with it.
  In `note`, SCALE CUES in px (wheel diameter, body length, sedan box width and height) and the shafts' or the body's
  receding edge as DEPTH DIRECTION `(u1,v1) -> (u2,v2)` with its slope dv/du.
- Trees: `base` = where the trunk enters the ground (`est` if hidden, e.g. at the silk's bottom edge or behind a
  roof), `top` = highest point of the crown, `crown_w` / `crown_e` = the crown's west and east extremes. In `what`:
  species as painted (willow with long whips, bare elm-like with stiff twisted twigs, pine-like, other), size, lean,
  leafing, number of trunks. One trunk foot = one tree. The restyle turns bare trees into willows: decide from the
  scan.
- Props: anything that stands on the ground (or on the deck, or on a floor) and isn't a building: stalls and their
  tables, stands, benches, stools, baskets and loads set down, jars, sacks, piles, parasols and mat awnings on their
  own poles, free-standing signboards and lamp-boxes, flags and banners on their own poles, poles, racks, troughs,
  mooring posts. `base` point (or footprint corners via `pts.base` {sw, se, ne, nw} for a stall). A row of identical
  things standing together can be one prop with the **exact count** in `what`. **Copy writing exactly as painted**
  (traditional characters, top to bottom; □ for illegible; say which are unclear).
- **Carried and worn things** (a shoulder pole and its baskets, a bundle, a parasol held up, a rope in the hands)
  are part of their carrier: describe them in the figure's `what`. Anything set down, propped or hung on its own is a
  prop.
- **Every painted thing is its own entity.** If your `what` or `note` mentions a painted thing ("a basket at his
  feet", "a dog at the stall"), that thing needs its own entity too, or a line in your "left to" list naming who
  records it. Before finishing, read through every `what` and `note` you wrote and check this.
- Groups: when several entities do one thing together (a stall and its seller and customers, a sedan and its bearers,
  a cart and the men pulling it, the people at a railing hauling one rope, a boat and its crew), add a `group` entity
  with `members` and a `what`, and set `group` on each member. A group lists only S3 IDs.
- IDs: the slug says what the thing is and ends with the u of its main point, so IDs never collide between agents:
  `S3.fig.rope_thrower_19280`, `S3.ani.donkey_17920`, `S3.veh.chuanche_17560`, `S3.veh.boat_mast_lowering_20450`,
  `S3.tree.bare_elm_16250`, `S3.prop.parasol_18200`, `S3.prop.xinjiu_flagpole_17605`, `S3.grp.sedan_vs_horseman`.
- `what` is what someone who never sees the picture will read: dress (colour, robe or short jacket, hat, cap or
  kerchief), sex and age, the kind of person (boatman, porter, sedan bearer, stall-keeper, scholar, official, servant,
  child), the action, what the hands hold, which way the head turns, the load. One or two concrete sentences. It is
  also what casting is decided from.
- Use `src` when sections.md or the pins name the vignette (`名画记: 串车 (pin 24)`, `名画记: 饮子 (pin 22)`,
  `名画记: 拥挤的桥面 (pin 20)`, `名画记: 大船穿行虹桥 (pin 19)`, `名画记: 虹桥边的小酒馆 (pin 21)`,
  `名画记: 河边泊船 (纤夫) (pin 25)`, `余辉: 车轿相争`, `余辉: 上下呼救`, `余辉: 大船抢险`, `余辉: 欢楼美禄`). Use `vis`
  and `conf` honestly. **Faint things that change the cast or the build** (two figures in one dark mass, a rider or
  only a horse, a boat or a shed) are recorded with `conf: low` and a note giving both readings, never dropped.
- When the painting is ambiguous, say so in `note` and lower `conf`. Never resolve it silently.

## Supports

`support` is what a thing stands on. Use these names (their heights go into the frame afterwards):
- `ground`: the banks, the streets, yards, shop floors at street level;
- `bridge deck`: **everyone and everything on the bridge**, the ramps included, from where the deck leaves the ground
  at each foot. The frame gives it an `H_profile` from the bridge agent's table, so each figure gets the deck's height
  at its own u. `foot` is on the deck's walking surface (est behind the railing). In `note`, say "on the deck at the
  railing" or "mid-deck";
- `water`: boats;
- `boat deck: <boat id>` / `boat roof: <boat id>`: everyone on a boat (the river agents only);
- `upper floor: <building id>`: any upper storey or raised floor, e.g. the riverside hall's veranda if it stands
  above the ground (structures_w gives its floor line). In `note`, give the v of the floor line under the figure;
- `animal S3.ani.<id>` (a rider), `sedan: S3.veh.<id>` (seated in a sedan), `cart bed: <vehicle id>`;
- `carried in arms`, `shoulders`, `carried on back` (a child; its own figure, foot at the carrier's foot);
- `bank slope`: a figure on a sloping bank between the water and the bank top (give the bank's two points in `note`);
- anything else: say it in words and report it.

## Ownership

You own entities whose main point (figure foot, animal fore, vehicle front, tree base, prop base) has u inside your
range, [start, end). Look 150 px past both ends for context, and don't record things owned by the next unit. A group
that crosses a boundary goes to the unit holding most of its members. List your own members, and name the others in
your report (by what and where, and by their expected ID only if you are sure), so the merge can join them.

**Who records what** (the most common misses are things each side leaves to the other):

| what | who |
|---|---|
| figures, animals, carts, sedans, trees, props on land (the banks, the streets, the shops, the far-bank strip) | the tile that owns the main point's u |
| figures, stalls, parasols and props **on the bridge deck** (support `bridge deck`) | the tiles (t5–t9), by u |
| the bridge itself: abutments, arch, ribs, deck edges, railings, ramps, feet, **its end posts** (the tall poles with a crossbar at ≈ 19010 and ≈ 20040, and any others at its ends), the deck's `[u, H]` profile | `bridge` |
| the water, both shores, the banks (`grd` with `bank_top`), landing stairs and jetties, **every boat and everything on or in a boat** (crew, cargo, ropes, planks, poles), mooring posts and stakes standing in the water's edge | `river_w` (15500–18300), `river_e` (18300–20500) |
| buildings (anything with a roof or walls, open shop fronts and sheds included), the 彩楼欢门 scaffold (part of 十千脚店), structures other than the bridge (walls, fences, stairs, platforms, the hall's veranda), roads, ground features | `structures_w` (15500–18000), `structures_e` (18000–20500) |
| writing, plaques, lamps, curtains, banners and pole frames **fixed to a building** (the 脚店 sign on the tavern's gate, a lamp hung from an eave) | the building's structures agent, in its `what` |
| the 新酒 banner: it hangs from a bar running west from a free-standing pole at u ≈ 17600 (a crossed frame and a bird-shaped vane at its top, v ≈ 700–820; foot hidden at about v 1350–1400) | **t4**: one prop, the pole with its bar and banner, `base` at the pole's foot (`est`). If the bar's west end is tied to the scaffold, structures_w says so in the scaffold's `what` |
| trackers and anyone on the bank holding a boat's rope; people throwing ropes from the bridge | the tiles (they are on land or on the deck); the river agent records the rope as part of its boat and names their IDs or positions as its far end |
| the men waving from the roof of the boat moored along the south bank (≈ 19900–20150, v 950–1100) | `river_e` (crew on `boat roof:`). t8 and t9 list them in their "left to" lists with points, in case river_e reads it as a shed on land |

"If unsure, record it as your prop: a duplicate is easy to drop, a miss is not." Every agent ends its report with a
list of the painted things it saw and **left to** another agent, with points.

## The units

Each unit writes `gen/map/S3/parts/<unit>.json` (`{"section": "S3", "entities": [...]}`) and its report
`gen/map/S3/reports/<unit>.md`. The densities are the setup agent's eye counts; you count.

| unit | role | owns u | looks at u | density | hints to verify | seam entities, boundary notes |
|---|---|---|---|---|---|---|
| `bridge` | bridge | `S3.str.rainbow_bridge` (≈ 18300–20200) | 18150–20350 | the bridge | 虹桥 (pin 18 at 18920): south foot ≈ 18400–18900, arch ≈ 18850–20050; the end posts | the deck's `[u, H]` table; the route's deck stretch for structures_w; the north end lands at v ≈ 280–330 near the silk's top: check that the route stays inside the painted area |
| `river_w` | river | water and boats 15500–18300 | 15350–18450 | about 6 boats, 25–35 crew | the boat under way (≈ 15550–15950, its sweep to ≈ 16120; pin 25; 摇橹向前?); the masted boat (≈ 15950–16220) and its line to the trackers; the far-bank boats (≈ 16380–16700, 16600–17300, 17300–17700, 17700–18300); the boats unloading at the south bank (≈ 17650–18100, v 700–1000) | the S4b seam (below); the shore points at u 15500 and 18300; the water-level check reading |
| `river_e` | river | water and boats 18300–20500 | 18150–20650 | 3 boats, about 25–30 crew | 大船抢险 (≈ 19350–20450, pin 19): the mast being lowered, the crew poling and fending off; the boat moored along the south bank (≈ 19750–20650) with the waving men; the north-bank boat from ≈ 20330 (its bow decides its owner) | the S2 seam (below); the shore points at u 18300 and 20500; a water-level check under the arch |
| `structures_w` | structures | buildings etc. 15500–18000, and `S3.road.main` for the whole route | 15350–18150 | about 10–14 buildings and a set piece | the riverside hall (≈ 15530–16450), possibly 十千脚店's own upper storey (刘涤宇 counts 十千脚店 as two-storey, `sections.md:109`); 十千脚店 with the 彩楼欢门 pole by pole and the 脚店 sign (≈ 16950–17010, v 1580–1720); the far-bank shops | the road's datum at u 15500 (S4b's point); the road's last point at exactly u 20500 for S2; the receding-edge table; the diminution |
| `structures_e` | structures | buildings etc. 18000–20500 | 17850–20650 | about 10–14 buildings | the shops at both feet of the bridge; the long open hall on posts on the far bank (≈ 18300–18600, v 50–250); the north-bank tavern (≈ 20050–20450, v 30–330; pin 21 at 19990; 刘涤宇's two-storey building opposite 十千脚店?); the south bank's shops at the bottom (≈ 18500–20650) | the south bank's roofs at the S2 seam, by main point; the receding-edge table |
| `t1` | tile | 15500–16300 | 15350–16450 | open, about 15 | the diners at the hall's windows and veranda (3–4 painted at the east windows; the restyle adds more); willows and bare trees | the S4b seam (below); nothing on the water |
| `t2` | tile | 16300–17000 | 16150–17150 | medium, about 15–20 | the trackers on the far-bank path (≈ 16250–16450, v 30–130; pin 25 纤夫?); far-bank shops' people; trees; the figure(s) on the balcony at the hall's east end (≈ 16200–16400) | trackers west of 16300 are t1's; the 脚店 sign is structures_w's unless it stands on its own |
| `t3` | tile | 17000–17550 | 16850–17700 | dense, about 25–30 | the tavern door under the scaffold; the rider at the gate (≈ 17000–17150, v 1550–1790; 欢楼美禄); the street; the big parasol by the gate (≈ 17330–17500, v 1150–1300) | the 新酒 banner is t4's (its pole's foot ≈ 17600) |
| `t4` | tile | 17550–18050 | 17400–18200 | very dense, about 35–40 | the 串车 (≈ 17480–17720, pin 24; its front decides its owner, t3 or t4); the 新酒 pole and banner (pin 23); the shed's stalls (≈ 17600–17900, v 960–1250); porters; the second wheeled cart (≈ 17950–18100, v 1180–1400) and the black donkey (≈ 17850–18000, v 1480–1600); the people unloading on the bank | the boats and anyone standing on them are river_w's; settle the 串车's front on a zoom-3 crop with t3 |
| `t5` | tile | 18050–18500 | 17900–18650 | very dense, about 30–35 | the parasol stalls (≈ 18100–18300, v 880–1000; two parasols at ≈ 18350–18550, v 1380–1500); the crowd at the bridge's south foot; the 饮子 stall (≈ 18500, pin 22: its main point decides t5 or t6) | where the deck leaves the ground: `bridge deck` from there on (the bridge agent's foot points) |
| `t6` | tile | 18500–18900 | 18350–19050 | very dense, about 40 | the south ramp and deck: the mat-awning stalls (≈ 18300–18600, v 450–600; ≈ 18760–18960, v 600–750), the parasol (≈ 18350–18550, v 450–530); the sedan of 车轿相争 (≈ 18700–18760, v 420–560) and its bearers; the crowd | the 车轿相争 group: t6 records the sedan's party, t7 the horseman's; both list the other side in the report; the merge joins them as `S3.grp.sedan_vs_horseman` |
| `t7` | tile | 18900–19350 | 18750–19500 | very dense, about 35–40 | the crown's crowd; the horseman of 车轿相争 (a horse head at ≈ 19210, v 260? read it); the people at the railings throwing ropes down to the boat (上下呼救; pin 20 at 19240); the stall under the arch's south foot (≈ 19000–19300, v 1000–1250) | the end post at ≈ 19010 is the bridge's; ropes hanging from the railing are the boat's (river_e), the throwers yours |
| `t8` | tile | 19350–19850 | 19200–20000 | dense, about 25–30 | the north ramp's crowd and the railings; the south bank under the arch: the parasol (≈ 19300–19450, v 1150), the people at ≈ 19550–19800, v 1080–1250 | the waving men on the moored boat's roof are river_e's (list them as "left to") |
| `t9` | tile | 19850–20500 | 19700–20650 | medium, about 20–25 | the north bank: the cart pulled up the bank (≈ 19800–19920, v 140–260; its front decides t8 or t9), the tavern's customers (pin 21); the south bank's open shop fronts (≈ 19700–20500, v 1450–1790); the big bare tree with the dark trunk (base ≈ 20330–20420 at the bottom edge) | the S2 seam (below); the big willow at the top (≈ 20450–20550) is S2's |

## The seam with S4b (u 15500), for t1, river_w and structures_w

S4b (the moorings) is being mapped at the same time (`gen/expand/round2/brief_outer_road_2.md`). Settled in Phase 0
(`map/index.md`, "Seams"):
- `S3`'s: the long riverside hall (roof from u ≈ 15530); the boat under way at u ≈ 15550–15900 and its crew.
- `S4b`'s: the biggest rafted boat (stern ≈ 14880, bow ≈ 15450, v 450–850) and the lines running east from the rafted
  boats (river_w says where they end on S3's side, if they do); the willow with its trunk at u ≈ 15450–15500 (its
  crown reaches over the hall to ≈ 15600; never an S3 tree, only a note in t1's report).
- The river runs across: river_w starts its shore lines at u 15500 and gives its points there in its report.
- `S3.road.main` starts at S4b's road centre at u 15500. structures_w reads it there itself (centre, `edge_n`,
  `edge_s`; most likely `est` under the roofs), puts it as the centre line's point 0, and gives the reading in its
  report. The merge sets it to exactly S4b's point.
- Everything else that crosses u 15500 (a roof, a crown, a figure on the line) goes in your report with its points on
  both sides.

## The seam with S2 (u 20500), for t9, river_e and structures_e

S2 (the canal) is being mapped at the same time.
- `S3`'s: the big boat under the arch (bow ≈ 20450) and its whole crew; **the boat moored along the south bank
  (≈ 19750–20650)** and the men on its roof, even if its stem lies east of u 20500 (say so in the report: the lead
  tells S2); the big bare tree with the dark trunk at ≈ 20330–20420.
- `S2`'s: the big willow at the top (≈ 20450–20600). Leave it, with a seam note.
- By main point: the boat moored along the north bank from ≈ 20330 eastward (river_e reads which end is the stem and
  gives both ends); the south bank's roofs (structures_e).
- `S3.road.main` ends on the north bank with a centre point at exactly u 20500 (S2's datum). structures_w gives it,
  with `edge_n` and `edge_s` there.

## Role notes

**Structures** (`mapping_rules.md`, "structures"; and `gen/map/S6/brief.md`, "The structures pass", for the form):
- Buildings: `base` corners `sw`, `se`, `ne`, `nw` by compass, `<corner>_eave`, `<corner>_ridge`, `<corner>_top`
  straight above them, `bays`; hidden corners `est` with how they were estimated. Footprints seen only as roofs get
  placeholder corners, said in the note. In `what`: storeys, roof type, open front or walls, what is sold, **every
  sign, lamp-box, banner and curtain on it with its characters exactly as painted**. Two storeys: give the upper
  floor's line in `note` ("UPPER FLOOR: floor line at v … over u …, straight above the ground at v …").
- **十千脚店's 彩楼欢门** (`S3.str.cailou_huanmen_<u>`, a set piece): the feet of its poles as `base` corners and,
  where they can be read, each pole's foot and top as custom points (`pole1`, `pole1_top`, …: custom names pass
  `check`); the cross-bars' heights; the flowers, streamers and lamp-boxes hung on it. Say in `what` which building it
  stands on, and whether the 新酒 bar's west end is tied to it.
- **The road** `S3.road.main`, with `"route": true` and `lines: {centre, edge_n, edge_s}`, west to east. Points under
  roofs are `est`, with the evidence. For the deck stretch, write the bridge agent's centre line in at merge (say in
  the report where the route leaves the ground at the south foot and where it lands on the north bank). Side streets
  are their own roads.
- **A receding-edge table** of ground-level edges (the hall's veranda and steps, the tavern's gate and threshold,
  stalls and tables, a wall's foot, the deck's cross-boards at the feet) as `(u1,v1) -> (u2,v2)` with the slope, for
  the dx knots. Eaves only where nothing at ground level recedes, and say so. **The diminution:** figure heights
  against their foot v, from the tiles' parts when they land or from your own sample (S4: 0.9 of the road's size at
  v 850, 0.5 at v 320, 0.3 at v 220).

**River** (`mapping_rules.md`, "river"; `map/README.md`, Boats):
- `S3.water.<reach>` with `lines: {shore_n, shore_s}` (a line stops where the silk's edge or the neighbour's seam cuts
  it); banks `S3.grd.bank_<u>` with `bank_top`; landing stairs and jetties as `str`.
- Every boat: `S3.veh.boat_<what>_<u>`, `front` / `rear` at the waterline under the stem and the sternpost (`est`
  where hidden), `beam_n` / `beam_s`, `bow_top` / `stern_top`, `mast` / `mast_top`, `support: water`, `pose`
  (moored, rowed, poled, towed, sailing, drifting, lowering mast), `facing_deg`, and in `what` the type, cabin, mast
  and rig, sweep and oars, cargo, ropes and planks with what their far ends reach; in `note` the SCALE CUE and the
  waterline's evidence. Each boat and its crew form a group; crew on `boat deck: <boat id>` or `boat roof: <boat id>`.
- **The big boat under the arch:** count its crew one by one at zoom 3 (about 20: on the roof, at the bow and stern,
  poling, hauling the mast's lines, fending off from the arch). The mast's foot, its top and where its lines run are
  the build's evidence. Which ropes come down from the bridge, and who holds them on the deck (by position for the
  tiles), go in its `what`.
- **The water level** is S4b's (`map/frames/S4b.json`, when it lands). Give your own reading as a check only: two
  stroke points where a bank meets the water at a vertical face or a stair, with the derivation.

**Bridge** (`mapping_rules.md`, "bridge"): `S3.str.rainbow_bridge` whole, with `base` corners at the four feet (where
the ramps meet the ground), the abutments, the arch's ribs (custom points along the outer rib, e.g. `rib_s`, `rib_n`,
`rib_crown`), the deck's two edges as `lines` (`deck_n`, `deck_s`; custom roles are kept in the strokes), the railings'
tops, and the end posts' feet and tops (`post_sw`, `post_sw_top`, …). **The deck's height profile:** pairs of points
along the deck (a deck-edge point, and the ground or the waterline straight below it at the abutments and under the
arch where it can be read), enough for H at about every 100 px of u from foot to foot, as a table `[u, H]` in your
report with the derivation for each row (H = (v_below − v_deck) / 77 m above that ground or water, plus the water's H
where it is the waterline). Give also the deck's centre line from foot to foot (for `S3.road.main`'s deck stretch),
and its width at the crown and at each foot (a real-size check).

## Finish

1. Write your file as `{"section": "S3", "entities": [...]}` to `gen/map/S3/parts/<unit>.json`.
2. Run `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/<unit>.json` until it PASSes, then the overlay
   over your whole range (zoom 1, grid 50) and zoom-2/3 windows over every dense part. Read every overlay image. Every
   marker must sit on its thing (feet on the ground contact, heads on heads, boats' points on the waterline); fix and
   repeat until it does. Then make one more pass over your range looking only for what you missed (heads in crowds,
   people at railings and windows, far figures at the top of the silk, things under parasols, props at building
   bases).
3. Write your report `gen/map/S3/reports/<unit>.md`: counts by kind (boats separately); every crowd and how many you
   counted in it; what was hard or ambiguous; faded areas; the seam notes by the neighbours' IDs; things at your
   range's edges that a neighbour may also record (with their points); groups that cross your edges; the support
   names you used; scale cues (wheels, doors, tables, sedans, hulls) and receding edges (two stroke points each); the
   list of painted things you saw and **left to** another agent; anything that contradicts sections.md; and your
   **lessons**, as exact text for the skill.
