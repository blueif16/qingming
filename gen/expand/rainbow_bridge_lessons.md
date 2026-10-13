**Merged, 2026-10-12 (round-2 records agent), all three parts:**
- "From the set-piece factory": merged into web-scene "Set pieces" earlier the same day.
- "From the mapping": merged into scroll-section "Review", "Mapping a section" (steps 1, 2, 3 and 5), "What the river,
  the boats and the bridge taught" (bow or stern, one boat or two, shores, ropes, the bridge agent), "What round 2
  taught about reading the strokes", the playbook's needs step; characters "Casting a big section", 2026-10-12. The
  `H_profile_X` correction replaced scroll-section step 3's deck sentence and web-scene "Set pieces"' profile bullet.
- "From Run 2": merged into scroll-section playbook step 4; web-scene "Building a new section", "Set pieces" (fitting
  the crowd), "Boats and water", "Backdrop panels"; characters "Routines" and "Casting a big section", 2026-10-12.
- "From Run 3": merged into scroll-section "Machine resources" (after a crash) and playbook step 4 (walks, HUD check);
  web-scene "Building a new section" (ground at the seams) and "Boats and water"; characters "Reviewing actions"
  (verdicts), 2026-10-12.
- Left out: §10's tool requests (listed in `NEXT_SESSION.md`); "Private Chrome" (superseded by the Chrome slots); the
  boats-page crew-schema correction (superseded by the page agent's `host()` levels).

# Rainbow Bridge (S3) lessons

Three parts:
- **From the set-piece factory** (the bridge kit): merged into the skills on 2026-10-12 by the records agent. It is
  unchanged below.
- **From the mapping** (round 2, Run 1): merged here by the S3 needs agent, 2026-10-12. **Merged 2026-10-12 (see the top).** Its
  sources:
  - every unit's report, `gen/map/S3/reports/` (bridge, river_w, river_e, structures_w, structures_e, t1–t9, frame);
  - the merge's lessons in `gen/map/S3/merge_notes.md`;
  - the three second passes' `lessons` in `gen/map/S3/second_pass/{west,middle,east}.json`;
  - the setup's lessons in `sections/rainbow_bridge/notes.md`;
  - the needs step's own.

  Duplicates are merged, and each lesson names its sources in italics. The quoted text is the exact text to add,
  under the skill and step named in each heading.
- **From Run 2** (build, cast, check): the area agent and its seven subagents, 2026-10-12. **Merged 2026-10-12 (see the top).** At the end of
  this file.

## From the set-piece factory (the bridge kit, `blender/kit_rainbow_bridge.py`), 2026-10-12

Exact text for the skill `web-scene` (a new subsection "Set pieces" under "Building a new section", or after the
atomic scripts table). Record: `gen/set_pieces/rainbow_bridge/study.md`.

---

### Set pieces (the Rainbow Bridge, 2026-10-12)

A set piece is one mapped entity big enough to need its own kit module (`blender/kit_<piece>.py`), built before its
section's map lands and fitted to it once it does. The bridge's record: `gen/set_pieces/rainbow_bridge/study.md`.

- **Split the kit into a fit and a build.** The fit is plain Python (no bpy): mapped entity + `map/frames/<S>.json` →
  one plan in world metres. The build lays the pieces along that plan inside `sb.entity(<map id>)`. The fit then also
  runs as a CLI (`python3 blender/kit_rainbow_bridge.py table <layout.json> <frame.json>`), so the frame agent and the
  lead can read the deck's heights without Blender.
- **Write the fit against a stub before the map exists, then against the first real part.** The stub (your own reading
  of the scan, in `layout.json` form) found the shape of the code; the bridge agent's part found what the stub hid: its
  hidden far edge and centre line sit at the same depth as the painted edge, so "near edge = lower D" failed. Classify
  edges by their side of the foot-to-foot axis, and anchor the build on the measured (painted) edge, not on footprint
  midpoints that include estimated corners.
- **A painted arch is not a walkable deck.** The 虹桥 is painted 5.4 m high over about 13.5 m of depth (45–70 deg at the
  feet). Keep the painted crown and the painted feet as places, give the deck one smooth family (level at the crown and
  at the landings), and extend the ramps along their ends until it is within the walk limit (34 deg: the gate's flight).
  Steps (level treads) where it is steeper than 17 deg; the collider stays one smooth hidden surface. Record every
  extension as a choice.
- **Choose a deck shape under constraints; don't patch it pointwise.** Raising a fitted profile wherever the structure
  pokes through left kinks at every node (and a 32 deg spike that drove an 8 m ramp extension). Search the family for
  the shape closest to the mapped heights that clears the structure everywhere and stays walkable: smooth by
  construction. When a pointwise envelope is unavoidable, a morphological close (max over ±w, then mean over ±w) is
  smooth and never below the original.
- **Model the structure the way it carries load.** The woven arch: system A (3 beams, a level middle beam) and system B
  (4 beams) one beam-and-cross-beam depth below it, B's cross beams carrying A's beams and A's pressing B's. Lifting
  each system's nodes over the other's beams in turn cascaded upward and made the arch 2.4 m deep. Then match the
  painting's look on top: the scroll draws the arch's face as one smooth band, so a curved facing timber covers each
  outer face and the weave shows from below.
- **Expose the deck's height, and give the map the build's own profile.** `Bridge.h_profile()` is the built deck as
  [u, H] along the painted edge, ready to be the frame's `bridge deck` H_profile; `check_profile` compares the map's
  pairs with the build; `on_deck(u, v)` places a painted foot on the deck by solving H and depth together. A u-keyed
  profile alone can't place figures across a receding deck (the far railing at a given u is metres further along the
  bridge).
- **Walk the collider headless with the page's own walker.** `web/src/player.js` runs in Node (stub `addEventListener`
  and `matchMedia`, give it the build's `__col` triangles as one BufferGeometry, hold W at 60 Hz): foot to foot both ways,
  into both railings, at the ramp's side from the ground. No browser, no dev server, and it catches what a render can't
  (the walker 6–15 cm off the deck's table height; the railings at ±3.7 m). It also showed the walker creeping downhill
  standing still on any slope (0.1 m/s at 10 deg, 0.23 m/s at 33 deg): `player.js` has no ground friction. Steer by the
  deck's centre line extended past the feet, or the test walker circles at the end.
- **Budget the hidden parts first.** The bridge's abutments are hidden in the painting yet cost 9.8k of the first 25.5k
  triangles. Coursed stone with eased tops only on the top course, longer blocks, and nothing below the water's surface
  took them to 4.5k; the railings (5.3k), which every walker sees, kept theirs. The bridge ships at 18.9k visible
  triangles, 0.34 MB of geometry, 6 draw calls.
- **Look at the sheet at full-scroll scale before calling the kit done.** Beside the painted bridge, the polygonal outer
  ribs read wrong at once; at render scale they had looked fine.

---

## From the mapping (round 2, Run 1, 2026-10-12): merged 2026-10-12

### 1. A correction first (skill `scroll-section`, "Mapping a section", step 3, "Heights point by point")

The skill now tells the frame agent to give the Rainbow Bridge's deck an `H_profile_X` built from the set piece's own
table. S3's frame agent tested that and **it does not fit this deck** (rms 2.9 m against the painted heights, many
south-ramp figures at H 0). Replace the sentence "a surface that recedes across the picture (the Rainbow Bridge's deck:
… gives `H_profile_X` …) Build it from the set piece's own table …" with:

> - **A deck that recedes across the picture.** First find which way its width lies (the bridge agent's reading) and
>   test any keying against the painted heights before writing the frame. S3's Rainbow Bridge is level across the
>   picture: the same v gives the same H. Its axis runs 50.6° from east, so world X doesn't fix a point's place along
>   it. An `H_profile_X` (world X, solved with depth) missed by 2–3 m, and the tool's 8-step solve diverged where the
>   deck rises faster than about 1.4 m per m of X. Key such a deck by u with offsets: one `H_profile` support per band
>   west of the painted near edge (S3: 17 supports, `bridge deck: <N> px west of the near edge`, in 50-px steps). A
>   point's H is the near edge's at u* = max(u, u_s(v)), and each line or thing names its band, measured on the
>   strokes at its own v. The deck lines are then exact (`support_by` per line; the route's centre, edge_n and edge_s
>   on their own bands, 0 beyond the feet), and the deck's things fall within the band's error (S3: 88 entities,
>   rms 0.17 m). Compare the result with the set piece's `on_deck` and report the gap as the build's departure
>   (S3: rms 1.76 m; 30 of 88 off the built deck). *(frame)*
> - **Riders need their animal's height.** `world()` takes `animal <id>` as the ground unless the frame names that
>   support. On a bridge deck or a boat, give each rider's support its own key (S3: without it the two riders stood
>   on the ground 8 m north of their mounts). *(frame)*

### 2. Reading the strokes (skill `scroll-section`, "Mapping a section", step 1: every mapping agent)

> - **Read at zoom 2–2.6 on a contrast-stretched crop, not at zoom 3+.** The scan is about 1800 px tall, so above
>   zoom 3 the silk's weave swamps the strokes, and CLAHE turns it into false strokes. Use sharp's `normalise({lower:
>   1, upper: 99})`, a lanczos upscale and a light `sharpen()`, with a sparse labelled grid (50 or 100 px; labels on
>   every 10–20 px line can't be read). Read what a thing is at zoom 1.2–2.6, and use zoom 3 only to place its points.
>   A shape that reads as a second head only at zoom 3 (a raised arm curling beside a head) is usually part of its
>   neighbour. *(t3, t5, t6, t7, t8, t9, river_w, second pass west; the bridge agent read structure at 1.2–1.6)*
> - **Two more derived crops for faint things:** a colour crop with the saturation raised (`modulate({saturation:
>   1.6–1.8})` plus `linear(1.25, -35)`) and a greyscale stretch (`linear(1.4, -40)`). The colour crop shows the few
>   red touches that tell food or flowers from a robe. It also tells planks from mat, a hull's iron cramps from a
>   bridge's beams, and a parasol's far rim from a figure. These crops could become a `--stretch` mode of
>   `scroll_map.mjs overlay`. *(t1, t9, second pass east)*
> - **Dot every head, then re-read the dotted crop.** Put a numbered marker on every head you count (a small sharp
>   script re-renders a window in seconds), sweep once more with head markers only and look for unmarked heads, and only
>   then place feet. The same script catches two marks on one person and a load read as a head. *(t5, t6, t7)*
> - **Follow the ropes before counting a head.** A dark jar in a rope sling at a porter's pole end looks exactly like a
>   dark-haired head at zoom 2 (S3, (18385, 900)), and so does a bundle over a man's shoulders. Before keeping a "head"
>   among ropes or under a bridge, look along the structure for repeats: S3's "head in the rigging" was the third of
>   three hooks hanging under the arch's rib at regular spacing. *(t5, second pass east)*
> - **A dark mass joined to a figure in the same tone, with no head, ears or legs of its own, is that figure's
>   clothing.** S3's third "donkey" at the bridge's foot was the calling man's two wide sleeves. Look for the animal's
>   legs and body where they would have to be. Likewise a rounded mass with no collar, neck or hair is not a back: a
>   seated back is widest at the shoulders, a basin or basket at its belly (S3's "diner seen from behind" was a basin
>   under a heap of fruit). Check a doubtful figure against any canopy beside it, too: a parasol's far rim against a
>   dark mass reads as a light-robed body. *(second pass middle, west, east)*
> - **When a mass's size doesn't fit what it would be, record both things** with `conf: low`, each note naming the
>   other's reading, so the merge can drop one without re-reading the scroll. Measure a doubtful head against the faces
>   round it: one tall hat over a round face would make a 58 px head among 20 px faces, so it is a second man behind.
>   Use the neighbours' painted heights to choose between readings: at the silk's top edge the far figures are about
>   80 px, so a "man" of 100 px there is more likely a stand or a load. *(t1, t8, second pass east)*
> - **A "rider" in a brief is a hint, not a fact.** At 十千脚店's gate the brief's rider is a saddled horse with an
>   empty saddle. Read the saddle before you cast a rider. *(t3)*
> - **Read a cart's front from its harness end.** On a 串车 the end with raised poles, a crossbar and ropes with loops and
>   hooks is the front. The end whose poles rest on the ground beside rest legs is the rear (the handles), even with men
>   standing there. A barrow pushed from handles that rest near the ground faces away from them. Give both ends' points,
>   and reading B in the note with the point that would change the owner. *(t3, t4)*
> - **Read an animal's head end from its tack and its legs, not its load.** The halter rope ties at the head and a
>   breeching strap lies over the rump; a hind leg's hock points toward the tail, a foreleg's knee forward, and the tail
>   is thin with a tuft. Where the tile restyle is misregistered the overview names animals better (S3: the tile made a
>   donkey seen from behind into an ox). A horse in profile in a crowd: find its head, its tail and the rider's seat line
>   before deciding how many animals there are; a separate head beyond the tail is a second animal, `conf: low`, both
>   readings. *(t4, t6, t7)*
> - **People leaning over a railing: put their hidden feet a step behind it,** not on the deck's painted edge. Measure
>   the handrail at the posts' tops first. On S3 a man at a painted 1.4 m parapet would come out about 200 px tall where
>   the crowd is about 140. Write the railing's foot v every 50–100 px in the report, for the bridge agent. *(t7, t8)*
> - **Figures behind roofs and sheds:** give the foot `est` from the painted height of a whole figure nearby, and say
>   what hides it. The foot then lies inside the roof's area on the scan, which is correct. *(t8)*
> - **Things at a moored boat's end** may be crew or people on the bank. Record them `conf: low` with all readings, and
>   name them in the river agent's "left to" list so one copy is dropped at the merge. *(t8)*
> - **Tracker files:** count the men head by head and follow the line to the man it ends at. Give the line's two ends in
>   the rear man's note, so the river agent can name him as the rope's far end. *(t2)*
> - **Trees:**
>   - A pollarded willow's knot is its head, not its foot. Put `base` where the trunk and the whips converge at the
>     bank (`est` when a boat or roof hides it), and say where the head is in `what`.
>   - Crowns whose trunks are hidden (behind a ridge, below the silk's edge): one tree per fan of shoots from a hidden
>     centre. Where two fans overlap, their inner shoots cross in an X, which marks the gap between two bases. Write the
>     possible v range of the hidden base in the note.
>   - Measure a big tree's base before deciding its owner: a briefed position is often where the trunk first shows.
>     S3's dark-trunk tree, briefed at 20330–20420, meets the silk's edge at ≈ 20525, past the seam.
>   - One trunk can change tone along its length (dark and mottled below, pale above). Join the parts by their
>     outlines, not their tone.
>
>   *(t1, t2, t9)*
> - **Empty furniture is painted furniture.** A 名画记 "tavern" pin doesn't mean customers are painted. Record every
>   table, bench and chair as a prop even when nobody sits at it, and say that the tables are empty, so nobody casts
>   diners there (S3's north-bank tavern, pin 21). *(t9)*
> - **Parasols and poles:**
>   - Decide whether a parasol stands on a bridge deck or on the far bank by its painted size: at deck scale (figures
>     ≈ 140 px) a canopy sits about 190 px above its base, and a far-bank one is painted smaller.
>   - Read a parasol's hub where its ribs meet, at zoom 3 on a stretched crop: two of S3's hubs had been put at a
>     canopy's end (36 and 86 px off).
>   - A tall pole with a crossed bar at its top behind a crowd can be a bridge's far-side end post (表木), not a mast.
>
>   *(t7, second pass middle)*
> - **Where the restyle drifts, trust it for *what* and never for *where*;** where it is misregistered by 50–100 px
>   and recomposes, don't use its tiles even to name things (the overview may still name a robe or a bundle). The
>   overview counts crews better than a shifted tile. *(t3, t5, river_w)*

### 3. The river role (skill `scroll-section`, "Mapping a section", the river agent)

The skill already has the bow rule, "boats run past their tile" and the seam straddlers. Add:

> - **Bow or stern: find one boat whose heading is fixed, then compare.** A tow line from the masthead to trackers ahead
>   fixes a heading, and so does an anchor under the bow. Read the others by that boat's bow fittings (a projecting
>   bow beam, a grapnel). A windlass or rope drum, coiled cables and men poling forward mark a bow; a rudder blade, a
>   high poop over an after cabin and a mast lowered onto it mark a stern. S3's big boat had been briefed "bow ≈ 20450",
>   and that was its stern. *(river_w, river_e)*
> - **One boat or two: follow the near-side bottom line.** A continuous waterline under several cabins is one boat (S3: a
>   945 px passenger boat that the first look split in two); a break in it, or a second stem, is a second boat. Two
>   hulls can overlap in the picture: check each one's waterline. S3's cabin under the arch has its own waterline 190 px
>   north of the big boat's, with water between, so it is a second boat (the restyle painted it as the bridge's
>   underside). *(river_w, river_e)*
> - **A long tapered shape beside a big boat is often its sweep blade,** drawn like a narrow hull with planking and a
>   turned-up tip; a blade has a loom running up into its boat. Profile any long thin floating shape: a timber keeps
>   one depth, a hull deepens to its middle, rises to a stem and shows frames (S3's "floating timber" under the arch is
>   a skiff). *(river_w, second pass middle)*
> - **A boat's fittings bound its ends.** A recorded stern that falls under the boat's own stern hood is too short: put
>   the rear under the hood's far end. *(second pass middle)*
> - **Faint pale lines can be ropes.** The rope thrown from the Rainbow Bridge is a light line that a plain crop hides;
>   a stretched greyscale crop at zoom 1.5–2.6 shows it and separates the crew from the rigging. *(river_e)*
> - **A crowd's edge against water may be a bridge deck, not a bank.** Test a hidden deck edge by its offset from the
>   painted edge at the same v: on S3 the line where the south ramp's crowd meets the water stays 696–776 px west of the
>   near railing's edge from v 400 to 965 while that edge curves. A natural bank would not follow the arch, so it is the
>   deck's far edge, and the river runs on under the deck. *(river_e, second pass middle)*
> - **Where no bank face, stair or abutment meets the water, report bounds and don't replace the measured level**
>   (S3: none in u 15500–20650; −0.86 to −1.0 under a hall on stilts, against S4b's −0.7). *(river_e, river_w, frame)*

### 4. A set piece's own agent (skill `scroll-section`, "Mapping a section", the bridge agent)

> - **Trace long structural edges with a brightness profile, not by eye.** S3's deck edge (a light beam 16–20 px wide
>   under the railing) was traced by sampling across the band every few px along a rough hand line and taking the
>   band's edge (`scratchpad/S3_bridge/band.mjs`); the hand line had been 10–30 px off on the flanks. *(bridge)*
> - **Read which way a deck's width lies before naming its edges.** On the 虹桥 the painted railing is the east side,
>   and the hidden far edge lies about 750 px west across the picture, not up the silk. Heights are level across that
>   deck in the picture, so a figure on the visible ramp takes the H of the edge point at its own v, not its own u.
>   Name the edges by side (`deck_e`, `deck_w`, `deck_c`). *(bridge)*
> - **A deck's heights come from its own feet:** H along an edge = (v of the edge's ground line − v of the edge) / 77,
>   the ground line joining the edge's two feet where it meets level ground. Hidden springings rule out the waterline,
>   and a sheared symmetric arch fits any tilt. When a foot is hidden, give the profile for each plausible foot.
>   *(bridge)*
> - **Check a deck's slopes in metres before it becomes a collider.** S3's painted bridge rises 5.4 m over about 6.8 m
>   of depth each side (45–70° at the feet). Report it for a builder's choice; don't build the painted slope.
>   *(bridge)*
> - **Tile agents ask the bridge agent's geometry before labelling supports at its foot.** The deck's far edge may not
>   be painted, so a crowd that looks like the bank's stands on the ramp at H 1–3 m (S3: 35 entities west of the near
>   edge's foot). A tile that finishes first marks its supports provisional and puts the other reading in the note.
>   *(t5, t6)*

### 5. The structures role (skill `scroll-section`, "Mapping a section", the structures agent)

> - **Test an upper storey by what is under the floor, not by the figures on it.** S3's riverside hall's railing has no
>   ground under it: a platform band and a tiled pent roof with drip tiles (平坐 over 腰檐) sit directly below and share
>   its ends, so the floor is an upper floor. Give the floor line, and the est ground under it, as two numbers.
>   *(structures_w)*
> - **Trace a curve back to where it starts before calling a shed a boat.** S3's mat shed under the arch seemed to sit
>   on a hull; the "hull" was a big roof's north-gable bargeboard. *(structures_e)*
> - **On a roof seen from above at the bottom edge,** find both gables' apexes and the eaves parallel to the ridge before
>   placing walls. Record apexes, eave corners, truss columns (`bays`) and the ridge as custom points; make the footprint
>   the ridge's ground line ± half the eave span; clamp corners below the silk to v 1795 and give the true estimate in
>   the note. Footprints must not cover painted bare ground: where no wall is painted under an eave, put the placeholder
>   wall where its foot would be hidden behind the roof, and say so. *(structures_e, structures_w)*
> - **Buildings cut by the silk's top edge still count.** On S3's north bank only a lattice band, a beam or two and the
>   tables in front show. Record them (`conf: low`, a placeholder footprint at the edge, both readings), or the far bank
>   is built from nothing. *(structures_e)*
> - **Say which point owns a building at a unit boundary:** the centroid of its base corners (`world` places it there).
>   Before finishing, each structures agent lists every building within 300 px of its range's ends with its corners, so
>   the pair can be compared (S3: a far-bank shop was recorded by both). *(structures_e)*
> - **Record a scaffold pole by pole as custom points** (`poleN_top`, `poleN`), with its tiers as `tierN_w`/`tierN_e`. Its
>   base corners are the building it stands on, and the heights above the ground go in the note (S3's 彩楼欢门 stands on
>   the gate's roof). *(structures_w)*
> - **Compare the high lines with the ground edges before discarding them.** Around 十千脚店 the eaves and ridges slope
>   like the ground barrier (−1.0 to −1.1), unlike S4's flattened high lines. Say so; it is evidence for the knot.
>   *(structures_w)*
> - **Size does not follow foot v alone.** A man inside a building at the bottom edge is painted 82 px tall where men on
>   the open ground below him are 160–190 px. Sample the diminution per area (the open ground, an interior, the far
>   bank). *(structures_e)*

### 6. Merge and second pass (skill `scroll-section`, "Mapping a section", step 2 and step 5)

> - **Read the neighbours' parts before you finish.** They land while you work. List their entities within 150 px of
>   your edges with a short script over `gen/map/<S>/parts/*.json`, settle each straddler in both parts' notes, and drop
>   your copy of anything they already own (S3: t3 confirmed the 串车's front from t4's note; t5 dropped an awning and a
>   figure; t7 dropped a hat, a crown, a railing man and a shed). A group lists only its own part's IDs; name the
>   neighbour's members in its `note` for the merge. *(t4, t5, t6, t7)*
> - **A footprint prop's main point is its `sw` corner** (`primary()` takes the first ground point). Choose placeholder
>   corners knowing which tile that puts the prop in, name the ID after that u, and say in both reports which ID to keep.
>   *(t4, t5, t6)*
> - **Read every unit's dropped drafts out of the notes.** Scan every `what` and `note` for `S<n>.` IDs that are not in
>   the merged map and rewrite each: a dangling ID reads like a missing entity (S3: five units). The same holds after the
>   second pass: S3's `S3.bld.open_shop_20000` still names "a hanging sack" that was retired as a porter's load.
>   *(merge, needs)*
> - **One thing in two kinds escapes the near-duplicate check,** which compares only the same kind: a mat canopy (a
>   building and a prop), a far-bank rail (a building's part and a prop), a wall's "gate frame" (custom points and a
>   prop). Read both units' `what` side by side, and decide the kind by the brief's who-records-what (a flat mat roof on
>   posts, open on all sides, is an awning: a tile prop). *(merge)*
> - **Compare the units' "left to" lists by u range, not only by name.** S3's far-bank tables at 19353–19396 were left by
>   t7 to t8 and by t8 to t7, so nobody recorded them. *(second pass east)*
> - **Read every neighbour's `note` for things placed on your side of the seam.** S4b's far-bank ground named a willow
>   foot 20 px into S3 with no entity in either map; a point named in a neighbour's note is a missing entity on whichever
>   side its main point falls. *(second pass west)*
> - **Read the neighbour's seam point from its strokes in `merge_fixes.mjs` on every run,** not as a copied number: the
>   areas merge and frame in parallel (S4b's strokes were rewritten while S3's merge ran). *(merge)*
> - **Plan the second pass by density, not by halves.** S3's brief planned two agents; two thirds of the entities lay
>   east of u 18000, so the merge proposed three (122, 166 and 130 entities), and they found 45 things. *(merge)*

### 7. The frame (skill `scroll-section`, "Mapping a section", step 3)

> - **A knot from a bridge's own axis can fold the plan.** S3's foot-to-foot line is the longest ground line in the
>   area and reads dx ≈ 90, against 30–39 for the furniture round it. Ramping to it within a few hundred px folds the
>   plan above D ≈ 10 m, so keep the furniture's knots and let the set piece build square (a recorded skew). *(frame)*
> - **Check a far bank's face against the water level.** A north bank's waterline must be painted at least (−H_water ×
>   77) px below its top, or the shore maps north of the bank top. S3's est far shores sat 10–46 px below, so they map
>   0.15–0.86 m too far north, and at S2's seam the route ends at the water's edge. *(frame)*

### 8. Setup (skill `scroll-section`, "Review" and "Mapping a section", step 1)

> - **A rerun doesn't fix a restyle that recomposes.** S3's tiles over the Rainbow Bridge registered at 0.07–0.16 in two
>   runs; both redrew the arch larger, added a second arch and moved the big boat. A tile far below its neighbours is
>   worth one rerun. If the rerun fails the same way, keep the better output, mark the stretch "not for positions" in the
>   tile brief, and read the scan there. Registration shifts that stop at 110 px mean the restyle drifted further than
>   the search allows: treat those tiles as misregistered, whatever their score. *(setup)*
> - **Read the check sheets for what changes ownership, not only for what is invented.** S3's restyle painted a boat
>   moored at the bank as house roofs with its crew standing on tiles, which moves the crew from the river agent to the
>   tiles. Name such things, with their owner, in the tile brief. *(setup)*
> - **Check a seam's agreed extents on one wide crop across the seam before the units start.** S4b's biggest rafted boat
>   runs on to a bow at u ≈ 15790, 340 px past the seam table's "bow ≈ 15450"; a boat half-hidden behind a tree is easy
>   to cut short. *(t1, river_w)*

### 9. The needs step (skill `scroll-section`, the playbook's needs step; skill `characters`)

> - **Cast with a script, one row per figure.** S3 has 232 figures. A table `[slug, character, clip, wanted take, props,
>   text, tags]` checked against `map/strokes/<S>.json` (every figure exactly once) and against each character's clip
>   list prints the counts, the free retargets to add (`from:`/`t2m:` sources), the takes wanted and the props, and
>   writes the per-character lines with each figure's support and H from `layout.json`
>   (`scratchpad/S3_needs/cast.js`, `gen_cast.js`). Hand-written lines drift from the map. *(needs)*
> - **Give every wanted take a stand-in clip that plays now** (`push` for a sweep crew and the trackers, `lean_over` for a
>   man bent over a railing, `stand_pole` for a poler), so builders never wait for the catalogue. *(needs)*
> - **Count the crews before deciding on a boatman.** On S3 48 of 232 figures stand on boats, 36 of them crew. One boat
>   carries 19, so cast from two or three labourers they repeat visibly. The crews' clearest model is the one painted at
>   street size (S3: the waver on the moored boat's roof, 155 px), not the busiest. *(needs)*
> - **Spread the faint figures across characters.** When the dress can't be read, the default labourer ends up playing
>   a third of the area (S3's idler would have played 68). Give the faint ones to the carter and the camel driver, and
>   say so. *(needs; S4b did the same)*
> - **Check the factory's inventory and kit names against the merged map:** S3's had two hulls where the map has three,
>   missed two boats and read #12 as a passenger hull. And `build_rules.md`'s `kit_<folder>.py` is, for S3, the bridge
>   factory's own module, so the area's kit needs another name. *(needs)*

### 10. Tool notes and requests (for the lead; not skill text)

- **`world()`:** a deck support read at u* = max(u, u_s(v)), or an `H_profile` keyed by depth D with a damped solve.
  Either would let S3's 17 offset supports collapse back into one `bridge deck`. *(frame)*
- **`scroll_map.mjs overlay`:**
  - a `--stretch` mode (the crops in §2); *(t1, t9)*
  - it ignores unknown flags, so `overlay --help` writes `gen/map/<S>/overlay_<u0>_<u1>.jpg`: always pass `--out` under
    `look/`. *(structures_e)*
- **`plan.jpg`** labels the datum "station 0" even when `datum.station` is set (+110.35 on S3; S4b saw the same).
  *(frame)*
- **The area kit's name for S3** (`build_rules.md`): `kit_<folder>.py` = `kit_rainbow_bridge.py`, the shared set-piece
  kit. *(needs)*


## From Run 2 (build, cast, check; 2026-10-12): merged 2026-10-12

The S3 area agent and its subagents (tavern kit, props, bridge fit, river, casting, backdrop, QA). Each lesson is the
exact text to add, under the skill and section named in its heading; the source agent is in italics.

### 1. The area agent's own (skill `scroll-section`, "Area agents, Run 2", unless named)

- **One build_choices from fragments.** With several subagents writing choices at once, each writes only
  `gen/sections/<folder>/choices/<agent>.json` (the tables of build_choices.json, every entry with its why) and one
  small script merges them (`gen/sections/rainbow_bridge/merge_choices.py`): a key set by two fragments stops the merge
  and names both, except `moves`, which add up (dX, dD summed, the reasons joined with each agent's name), so a strip
  moved by one agent and a small spread inside it by another compose. Give each table's entries one owner (S3: the
  water and banks' `how` collided once between the builder and the river agent). *(lead)*
- **Fix the factories' signatures in the builder, and probe for them.** `has(module, fn, *kwargs)` (inspect the
  signature) lets the builder call a factory's new part or keyword the moment it lands and its stand-in until then
  (S3: `kit_common.stilt_deck`, `board_wall`; `kit_vehicles.barrow_load`, `sedan_chair(front_style, roof)`,
  `barrow_screen(stakes, poles, panel)`), with no edit at the swap. A catalogue keyword that clashes with an existing
  positional (`sedan_chair`'s `front`) gets renamed by the factory: probe for the style keyword's possible names. *(lead)*
- **Test a set piece's whole built footprint against every mapped thing on the first day:** deck, ramps (extended for
  the walk limit), abutments and skirts against buildings, figures, props, trees, vehicles and the painted area's
  edges. On S3 the north ramp, extended 3 m to walk at 34°, landed on the north bank's handcart, shed, counter and
  people, half of the north-bank tavern, and 2 m past the silk's top edge: 21 ground moves, a narrowed tavern and an
  edge detour followed. *(lead, bridge fit, casting)*
- **skill `web-scene`, "Building a new section": a lighter composition for far rows.** Fronts painted at 0.22–0.35 of
  the street's scale and seen across a river from 10–30 m need the same kit parts at lower cost: thin posts,
  `kit_inner_city.wall_bays`, two `kit_inner_city.lean_to` slopes with fascia and a ridge, no rafter ends, no plinth
  (0.4–0.8k triangles a front instead of a full `kit_outer_road_2.hall`'s ~3.2k). S3's buildings went from 92k to 69k
  this way and the budget went to what the walker passes. *(lead)*
- **A ramp landing on a painted building:** narrow the building to the part the ramp leaves (real heights, painted
  front and depth, its painted end kept), open it on all sides where the route must pass through it, and move its
  furniture inside or just behind it; record it as `how` with its reason. *(lead; S3's north-bank tavern)*
- **Private Chrome:** copy the page tools that take `CDP_PORT` (S4b's `S4b_run2_lead/tools/`) and S7's `chrome.sh`
  (its own profile and port) into your scratchpad; S3 used port 9243 with dev server 5193. *(lead)*
- **Usage limits stop subagents mid-run:** have every long-running subagent append one line of results to a progress
  file after each step, so its work survives a stop, and resume it with SendMessage (it keeps its context). *(lead)*

### 2. Bridge fit (skills as named)

- **web-scene, Set pieces:** "Fit a skewed painted deck onto a square built deck by height, not by place. people.js grounds a figure by a ray from its layout H + 1.2 and a recorded move never changes H, so the deck under the moved point must be at most H + 1.0 (keep it within ±0.5). Rules that worked on S3 (`deck_fit.json`): STAY where the point is on the deck and at its height; INWARD straight across where only the railing is in the way; ALONG to the nearest station in the height window for the railing crowd (so its painted order holds with the stays), or to the same fraction of the crown's height on the painted flank for the rest, across the deck at its painted N px of the deck's width; riders, a sedan's bearers and an animal's hooves move as one unit."
- **web-scene, Set pieces:** "Pack a deck crowd constructively, then open the lane. A pairwise-push solver jammed against fixed stays. A greedy packer converged in seconds with no overlaps: stays, then animals and vehicles, props with bodies, then people in painted order, each at the free spot nearest its target inside its height window and the railings. Then find the cheapest foot-to-foot path through the clearance field (narrow cells and the deck's sides cost more) and keep bodies off it only where it is narrower than the player."
- **web-scene, Set pieces:** "The kit's near railing is not the painted near edge: the arch's axis comes from the mapped rib line, and on S3 the built near railing lies 1.1–1.5 m inside `deck_e`, so every leaner mapped at the railing stood outside it."
- **web-scene, Set pieces:** "A ramp extended for the walk limit lands on the painted bank. Move what it covers to the side it is painted on, give edge:north a detour round the foot 1 m past the collider's run-out (overlapping the far railing's wall, so nobody goes round the far corner), and lay ground under the detour."
- **scroll-section, Area agents Run 2:** "Fragments' moves of one entity sum. A fragment written by a script that reruns must take its own moves back out of layout.json before computing (layout = world + everyone's moves), or it moves things twice; give absolute targets as targets minus that base."
- **characters:** "A painted animal whose map point overlaps painted people is not a stay. Only S3's second horse's head is painted, but the whole model stood in the railing crowd, so move it with its party."

### 3. River and boats (skills as named)

scroll-section, "Area agents, Run 2":
> - **Compute moves from the map, never from the current layout.** `map_layout.mjs` applies `build_choices` moves on top of `map/world/<S>.json`. Once your fragment is merged, `layout.json` already holds your moves, and a move recomputed from it comes out about zero. Un-apply `layout.moved` (pos, pts, footprint, bays; a figure's or tree's X, D) before you measure.
> - **Move a far bank with a step between buildings, not a taper.** Buildings stand at the bank top end to end, and each moves rigidly. Under a taper the shore shears beneath them, and S3's far hall had a corner 1.9 m in the water. Move everything west of one scan line by the full amount and let the shore step back along that line (S3: 5.5 m west of u 18300, beside the hall on stilts). Pull the shore 0.3 m out from the moved bank tops so the trees and tables at the edge stay on land.
> - **Trackers go with their towed boat.** When a towed boat moves to make room, move its trackers too, ahead of its bow on the bank, so the tow line leads forward.
web-scene, "Boats and water":
> - **Solve a crowded reach numerically.** Use hull outlines at the gunwale (with the stern gallery, the bow platform or horns, and the sweep blade's swing), swept along each boat's run. Test them against each other, the neighbour's shipped hulls, the shores (signed: penetration counts), the abutments and the seam. Then run a coordinate search with a weak pull toward each boat's painted place, or the moved bank's place for boats moored there. Shoreline crossings need signed depth, or the search has no gradient. S3's 11 boats solved in minutes this way (scratchpad `S3_run2_river/solve.py`).
> - **A boat at an arch: check the built geometry against the soffit.** Count the facing timber (0.46 m) at both faces. The high ends decide: the passenger type's curled stem post (free + 2.3 m) and stern gallery rail can cross a face nowhere under a 3.7 m arch. So a big boat waits outside the near face (bow toward the arch, run 0), and a boat painted under the arch is built low (the small type's awning, 1.7–1.9 m).
> - **Read the kind from the painting's proportions,** not only the preset. A boat painted at 0.3 of its neighbour's length beside a 0.6-scale passenger hull is a small boat. A painted roof about 1 m over the water, with a `boat roof:` figure on it, needs the small type's low awning: the grain type's awnings rise 3–3.8 m, and the figure lands inside them.
> - **Carry the crew proportionally.** A boat built 2–5 times its painted length keeps its crew at their painted metres, so they bunch amidships, often under a roof. Give each crew figure a `nudge` that carries its painted place along and across the waterline onto the built hull (sweep and oar crews need none).
> - **Cut the run of a boat painted heading toward a neighbour's hulls.** A boat under way goes out along its heading, and when another section's sterns sit just ahead, `run_m` 1 m keeps the motion without the collision.
Correction for boats_page_lessons (crew schema): `boats.js host()` reads only `boat deck:` and `boat roof:` supports. A figure on another support such as `boat bow deck:` needs a `crew` entry (work-less) in `people.json` `boats.<slug>` to be hosted on its boat.

### 4. The tavern kit (skill `web-scene`, "Set pieces" / "Section kits")

- **Place a painted structure's custom points with the frame, at a chosen depth.** layout.json carries only a set piece's base, so the kit reads its pole-by-pole stroke points (map/strokes/<S>.json, scan px) and puts each at a depth D chosen to stand on its support; X and H follow from the frame (u = u0 + 77 X + dx(u) D, v = v0 − 51.25 D − 77 H). Any D projects back onto the painted stroke, so from the scroll's view the build matches the painting whatever the depths (十千脚店's 18 poles land on their painted tops).
- **Check a kit in the scroll's own projection.** Shear every vertex onto (u, v) (kit_rainbow_bridge_area.world_to_scan), render orthographic looking north with the camera's sensor fit set to horizontal (Blender fits ortho_scale to the longer side, so a tall crop comes out zoomed 1.3×), and put it beside the scan crop at the same scale. It showed the hall's ridge 1.2 m short and the wing's roof 2.6 m too high at once; eye-level renders hid both.
- **A painted eave at real height tells you where the wall goes.** The wing's east eave, painted at ground level on its placeholder footprint, lands 3 m further east at a real 3.1 m eave, just inside the 杈子 painted under it. Build the wall 1.15 m in from there, so bare ground lies under the eave as painted. A placeholder footprint that leaves an unpainted gap is wrong.
- **Painted links between different depths can't all be level.** The 新酒 bar is painted level across the picture from a pole at D 3.2 to a scaffold at D ≤ −0.9; a level bar would have to climb 2.9 m. Keep it level at the height painted at its more visible end and record the miss. Hang a banner painted square to the viewer from its own yard, so it faces the viewer whatever way the bar runs.
- **Check an upper floor with people.js's own ray.** Cast down from H + 1.2 at each mapped figure and prop on the floor, and ±0.25 m around it, through the colliding buckets: the first hit must be the floor (3.83 for all 7 diners and 5 props on 十千脚店's balcony).
- **At a seam, check the neighbour's as-built geometry, not its footprint.** S4b's south hall runs past the seam as painted (walls to x 96.2, its eave 0.5 m beyond at the riverside hall's floor height), so the hall's west end was moved to x 96.75 and recorded.
- **Budget roofs and windows first.** The complex is 17.8k: roofs on coarse tile grids (ns 10, nt 4) with rafter ends every 0.5 m only on the eaves people see; song_kit.lattice_window (~200 tris) only on painted walls, a square-section lattice at half that cost on unpainted ones. A scaffold's cost is mostly lashings (~10 tris each), rods and spires (4.5k). kit_inner_city.cailou stands a scaffold on a roof under `k.placed(k.frame(0, 0, z))`; its `lattice` option always adds flowers, so an unflowered scaffold needs its own lattice.

### 5. Props (skills as named)

- web-scene, "Building a new section": "**Props as data.** A section's props go in a table (`gen/sections/<name>/props_table.json`: id, part, args, why) read by one dispatcher, `place_props(table, ents, z_at, rng, skip)`. The builder resolves the support (`z_at(X, D, ent)`) and the dispatcher asks it at every foot, so a stall stands on a 30° ramp with level tops and legs of different lengths. Carrying props record their built top (`TOPS`, and `top_h` for the builder), so things on them sit on the real top, not on the frame's painted height (S3: the far-bank table painted 0.36 m high, built 0.75)."
- web-scene, "Building a new section": "**Real-size furniture in a compressed row needs spreads, not shrinking.** Far up the silk (s 0.22–0.5) a table, its bench and the man painted behind it map within 0.3 m of depth. Build them real and spread them inside the group, recorded (S3: 33 moves of 0.1–0.8 m), keeping the painted order. Never move a seat from under its sitter; move the table. Check every figure against every prop body (a 30-line AABB script): a figure inside a table's hidden collider is lifted onto its top."
- web-scene, "Set pieces": "**On a bridge deck, orient props to the built axis, not to the map's corners.** The map's stall corners on a skewed deck are slivers (5.4 × 0.6 m). Build a real rectangle centred on the fitted point along the kit's axis, with tables and benches across the deck so they stand level, and awnings low at the downhill edge."
- web-scene, "Budget": "**Props budget: about 190 triangles a prop.** S3's 103 props are 19.3k. What it took: legs and stretchers as plain 4-sided bars (8 triangles) for far furniture; buns and coils as 5–8-segment lathes, not icosahedra; lattice slats as flat faces laid on the mat (their edges draw the ink); bowl stacks as one body with a rim ring per bowl; parasols 10–20 ribs (`ki.umbrella` costs about 29 a rib)."
- scroll-section, "Area agents, Run 2": "Moves of one entity from several fragments add up (dX, dD summed). The agent whose move lands last must compute its target with the others' moves included, and say so in its why."

### 6. Casting (skill `characters`, "Casting a big section")

- Cast a catalogue character that isn't made yet as `character` with `stand_in`: the page and the casting script switch to it by themselves once `characters.json` lists it. Keep the cast in a data file (`cast.json`) and never hand-edit people.json.
- After every workshop delivery, rerun the script and probe each new seated clip's hips and feet (`node tools/char_props.mjs <raw.glb> --probe <clip> <t>` at t 1–6). Retargets keep the root under the hips; library chair sits keep it at the feet. A wrong offset puts a sitter beside his stool.
- Resolve each painted action through a chain of clips of the same posture (chair sit, floor sit or crouch, ride, standing). When the character lacks the posture, use a recast with its reason; never stand a seated figure up.
- The workshop ships props as variants (`back_sack_dark`, `sack_shoulder`, `stick_shoulder`, `stick_ride`, `hand_dish_buns`). Map each painted prop to its parts in order of preference, and pick a walker's clip from the clip its load is placed in. A prop placed in `idle` on the back or hip may show on every standing step; a hand prop needs a single-clip cycle.
- people.js spawns a walker's root at y 0 and grounds its first step from 1.5 m. A walker whose path starts on a bridge deck or upper floor higher than about 1.3 m lands under it, so it stands until the page passes a start height.
- Railing leaners stand 0.36 m inside the built railing's line, turned square to it. The painter turns railings toward the viewer, so the painted facing must give way to the railing's own normal.
- Crew: bring each painted spot onto the real-size hull (`build_choices.json` boats `lw` and `beam`, centred between front and rear, inset 0.4 m across and 1.0 m along), then separate crewmates within the boat. boats.js applies a crew nudge, but sweep and oar workers stand at their bar.
- Never clamp back into the painted area a figure that a recorded move put beyond it (a closed far bank moved out under the mist). Clamp only figures that are inside but within 0.32 m of the edge.
- Take furniture sizes from the props table's `args` exactly as the placer reads them. Tables are anchored at their front edge unless `anchor` says otherwise, and `yaw: "deck"` is the bridge's axis. Then slide a seated figure off a table top by the smallest move in any direction, not always straight back.
- A painted walking animal that is ridden or led stands, and its groom and driver stand with it (map/BUILDING.md). Put a cart's puller at the kit's real shaft tips, not at the painted front.

### 7. Backdrop (skill `web-scene`, "Backdrop panels")

- **Looking along the scroll, a side panel's strip is depth.** Past an east or west seam, the strip's u runs away from the viewer, so its length sets how far down the street or river the view reaches. Choose its end from the neighbour's `layout.json`: take each thing's angle and distance from the section's centre (the ring is 70 m), and end where a painted thing closes the view or a painted link ends. S3 east ends at u 24300 so that the trackers' tow line ends at its boat's masthead.
- **The horizon trial's sentence works in a content prompt for a street, not for a river.** S3's content prompts carry it ("Everything in this picture is far away … some seventy paces … heads on the horizon … no deeper than those people are tall … Below that sliver of ground there is only white mist.").
  - Looking down the outer road, the ground strips were 0.043 and 0.059 (draw 1), then 0.033 and 0.053 (draw 2). The pick at 0.033 is the first street panel the page does not lift.
  - Looking down the river, they were 0.078, 0.063, 0.076 and 0.109: the model paints the river as a channel opening to the image's bottom edge.
- **A view down a river runs to the horizon** in every candidate (4 of 4), as a straight canal between rows of houses. It did so even with "the far end of the river is closed by two big boats … no water shows beyond them" and "no straight canal running to the horizon". S4b's east view was closed by something painted across the river (the bridge). Boats lying along the river don't close it. Record it as a departure; don't spend a third draw on it.
- **Say what each side has and what it doesn't.** Draw 1 put the tea house's diners on the road's south side, where the strip paints only the backs of halls. "On the left of the road … there are no shop fronts and nobody sitting: only the plain plastered back walls and big heavy grey tiled roofs of a row of large halls … their fronts facing away from the road" fixed the side in both draw-2 candidates, though small awnings still crept in.
- **Near and far get swapped** for things on the strip's top band at its far end: 2 of 4 east candidates put the far eatery and mule cart nearest. Read the sheet front to back against the strip.
- **Counts don't hold.** "Exactly five trackers" came out as 7–15 men, and there were three palm carts where two are painted. Count files of people and teams on the sheet.
- **The pollard sentence held in 6 of 8 candidates.** It failed twice on S3 west: green hanging strands once, thin pale strands behind the halls once. `backdrop_panel.txt`'s colour line "pale fresh-green willows" may be pushing green tips; changing it is the user's call.
- **Prefer omissions to inventions when picking.** S3 east's pick lacks the passenger boat and the hooded cargo boat. The candidate that had them invented a herd of mules and a stone bank.
- **Encode KTX2 with `--kind panel --only <name>`.** This encodes only your own panels (a parallel agent's stale files stay out of your run). Check afterwards.

## From Run 3 (the restart finisher, 2026-10-12 evening): merged 2026-10-12

The finisher that picked S3 up from the files after the PC restart. Exact text to add, under the skill and section
named.

- **scroll-section, "Machine resources", after a crash:** "A dead QA agent's tools can be rebuilt from its transcript.
  Its `cat > file <<'EOF'` blocks, the `python3 -` blocks that edit those files and its `sed -i` lines, replayed in
  order into a new scratchpad folder, gave S3's route planner, route generator and calibrating walker back exactly
  (`agent-<id>.jsonl`, about 20 calls). Rerun its probes against the current build, since a rebuilt scene moves things."
- **web-scene, "Building a new section", the ground at the seams:** "Where a river crosses a seam, the 0.5 m of ground
  past the seam must be river bed, not land. A builder whose `wet(p)` tests only the water strips (which stop at the
  seam) builds a 0.5–1 m strip of bank-height ground right across the river past each seam. It stands 0.6 m above the
  neighbour's water, and boats whose sterns cross the seam open bank bridges onto it. Test the point carried back onto
  the seam line. Check: probe the section's collider heights along both seams over the water; nothing may stand above
  the water there."
- **web-scene, "Boats and water":** "A boat under way that touches a bank closes its bank bridge and shore gate each
  time its pause ends. A walker who is on the bank inside the gap then can wade into the water (S3's big boat: 2 of 14
  boardings). If the painted motion is something other than travel (a mast lowered and raised, `mast_cycle_s`, which
  runs on its own clock), keep the hull at its spot with a long `pause_s` (S3: [3600, 3]) so its contacts stay open."
- **scroll-section, "Area agents, Run 2", walks:** "Board every boat that touches the walkable bank, in the walks: onto
  it, along its deck to the rails at each end, 20 s riding against a rail, and back off. A boat with a low awning over
  its middle can only be boarded at its open ends (S3's moored south-bank boat: its mat roof is 1.0 m over the bank).
  Find the spots with a few test walks along the hull first."
- **characters, casting:** "Have the casting script read the workshop's verdicts. S3's `make_people.py` drops every
  take that `workshop_progress.md` marks `**NOT TO USE `take`**`, unless a later `**PASS `take`**` line passes its
  retake, so the chain falls back to the stand-in clip with no hand edit."
- **scroll-section, HUD check (tool note for the lead):** "A HUD check needs no special tool: per landmark,
  `__test.goto(X, D)`, stand the player there, `await __test.hud.show()`, wait until `hud.stats().pending` is 0, take
  a screenshot and record `hud.you()` and `hud.drawn`. S3's script is in the run 3 report; `tools/hud_interact.mjs`
  still hard-codes CDP 9223."
