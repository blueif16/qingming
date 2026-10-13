**Merged, 2026-10-12 (round-2 records agent):** §0 into web-scene "Boats and water" (moorings, banks, gangplanks,
crews) and scroll-section playbook step 4 (rivers); §1 into scroll-section "What the river, the boats and the bridge
taught" and step 3 (the water); §2 into scroll-section step 3 (knots); §3–§6 into scroll-section "What round 2 taught
about reading the strokes"; §7 into scroll-section steps 1, 2 and 5; §8 into the playbook's needs step; §9 into
scroll-section's tool quirks, 2026-10-12. Left out as superseded: the river's 16 m run-on (cut at the join), the
unwalkable gangplank (fixed on the page; what remains is on the user list), stern anchor lines (now kit options), the
page tools hard-coding 9223 (they take `CDP_PORT`; `walk_film.mjs` is in `tools/`); §9's `scroll_inspect.mjs` zoom
request.

# Outer road part 2 (S4b): lessons for the skills

Merged by the needs agent after Run 1 (restyle, map, merge, second pass, frame, layout, needs), 2026-10-12, from every
unit's report:
- `gen/map/S4b/reports/`: setup, t1–t5, river, structures_w, structures_e, frame;
- the merge's lessons in `gen/map/S4b/merge_notes.md`;
- the west second pass's `lessons` in `gen/map/S4b/second_pass/west.json` (the east pass wrote none).

Duplicates are merged, and each lesson names its sources. The quoted text is the exact text to add, under the skill
and step named in each heading. All of it is merged (see the top).

**The boat and water lessons come first**, because S3 and S2 are briefed from them.

## 0. Run 2: building the river and the moorings (the boat and water pilot, 2026-10-12)

The area agent's Run 2 lessons, for the skills `web-scene` ("Boats and water") and `scroll-section` (the playbook,
"Area agents, Run 2"). S3 and S2 build their rivers from these. The plan scripts are kept in
`gen/sections/outer_road_2/boats/` (`boat_plan.py`, `solve.py`, `moorings_plan.png`); the choices in
`sections/outer_road_2/build_choices.json` (`boats`, `moves`, `how`, `edges`).

### `web-scene`, "Boats and water": planning a mooring before the first export

> - **Plan the moorings in 2D first, with the kit's own hull outlines.** `gen/sections/outer_road_2/boats/boat_plan.py`
>   draws every boat's gunwale outline (kit_boats.Hull's `w(x)` from the stern gallery to the bow platform) and its
>   waterline at the chosen `kind`, `lw`, `beam` and move, against the shores (yours, and the next section's past the
>   seam) and the neighbours' hulls, and prints every overlap and every waterline on land; `solve.py` stacks a raft
>   from one end (each boat moved outward along its axis until its stem reaches the shore, then sideways only as far
>   as its neighbours need, gap 0.15 m). It runs in seconds without Blender. S4b at the kit's default sizes: 10
>   overlapping pairs; after the plan: none, every gap 0.10-0.39 m.
> - **Shortening fixes boats end to end, not side by side.** A raft's width is the sum of its beams. S4b's five rafted
>   boats are painted with their centre lines 1.8-3.9 m apart, and the cove is 13-15 m across in the frame; at the
>   types' beams (4.5-4.9 m) the raft needs 24 m, at 0.6 of the length and 0.75 of the beam still 20 m. The painter
>   draws the moorings at the far-row scale (0.55-0.65 of the street's: the big boat's painted 12.3 m against a real
>   19 m), so the frame's single depth rate squeezes the river. Three levers, in this order, each recorded: shorten
>   (0.6 of the type at the least), narrow the beam to a real proportion for the shortened hull (3.0-3.2 m for 11-12
>   m; Song inland boats run 3.5-4:1), then make room by moving the far bank (BUILDING.md rule 5's "far rows ... make
>   room with recorded moves"). Never shrink a hull's heights.
> - **A far bank moves as a builder choice, not a layout move.** `map_layout.mjs` moves an entity's `pos`, `pts`,
>   `footprint` and `bays`, never its `lines`, so a water entity's `shore_n` and a grd's `bank_top` don't move with
>   `moves`. Record the move under `how` for the water and the far bank (with the reason), apply it in the builder
>   before `water_strip` (a copy of the water entity with its lines moved along the receding direction, dX = -dx/77 per
>   m of dD, so its end stays on the seam), and record `moves` for every thing standing on that bank. Carry the near
>   shore on to meet it where the cove closes, or the strip's closing opens the river through the bank.
> - **Pass `free` (freeboard) explicitly.** `boat_from_layout` takes it from the painted `bow_top`/`stern_top`, which
>   are estimated and drawn at the far-row scale (S4b's long boat came out at 0.35 m), and a passed `free` also
>   cancels a laden grain boat's low freeboard. Set it from the deck support the frame measured (its gunwale H minus
>   the water's) and check the deck against the bank: the page's boarding probe takes a bank from 1.2 m below to 0.7
>   m above the deck, so a bow 1.25 m over the bank stays closed.
> - **Choose `kind` from the painted extent, not only the parts.** A boat seen stern-on hides its length: S4b's
>   round-matted boat spans 235 x 170 px, which at its heading allows 5-6 m, a small awning boat, not the 12-20 m grain
>   boat its stacked mat awnings suggested. The kit's `kind_of` now reads `what` first; record `kind` anyway.
> - **Move a boat's crew with it.** A crew figure's spot is carried into its boat's frame from its own layout
>   position: record the same `moves` for every `boat deck:`/`boat roof:` figure as for its boat.
> - **A gangplank needs a gap and a free side.** The kit lands the plank on the gunwale beside the foot's position
>   along the hull, clamped to 1 m short of the bow's top; with the bank ahead of a bow-in boat it lands on the bow
>   quarter, so: (a) moor the boat far enough off (about its bow overhang plus 1 m) for the plank to span; (b) put the
>   foot on the side with open water (S4b's mat-cargo boat: the rafted neighbour lay 0.5 m off its port side, so the
>   plank went to starboard and its porter was nudged to the foot).
> - **Edges round a river:** the edge walls stand only on land (S4b: `edge:east` on the seam's land part,
>   `edge:north` west of the cove); across water the shore walls and the boats' rails close the walk. A wall on a seam
>   or the silk's edge would stand across every deck that crosses it.
> - **S4b alone, the river runs on east under the mist:** pass `water_strip` the painted area grown 16 m east (and
>   north over a moved far bank) as `quad`, with `seams=("west", "east")`, and both shores carried straight on 16 m
>   past the seam; the ground runs on beside it. The lead cuts both back when the next section joins.
> - **Move a bow-in boat out until its bow's TOP clears the bank, not its stem.** The kit's raked bow reaches
>   `oh_b` (1.5 m on the big types) past the waterline stem, a passenger boat's platform 1.1 m more. With only the stem
>   at the shore (S4b's first plan) the bow lay 0.8-1.3 m over the bank: the shore walls stood across the foredeck,
>   the boarding bridge became a 51° ramp, and one bow ran into a house's wall. QA's walks found all three.
> - **Rafted decks within about 0.35 m of each other.** The page's contact probe lands a bridge on the first walkable
>   surface it finds, a neighbour's roof block included: S4b's long boat bridged onto the round boat's mat roof, 0.8
>   m over its floor, and you could step down but not back. Set `free` so neighbouring decks match (the round boat
>   0.5 -> 0.85), then walk every crossing both ways.
> - **A hull that crosses a seam opens its rails onto the next section's run-on bank.** Contacts open only
>   `edge:shore` pieces, so carry the edge wall (`edge:east`) along the run-on shore past the seam; it drops with the
>   rest of that side when the neighbour loads, and the neighbour's own bank takes over.
> - **A grain boat's crew house aft (the kit's default) hides a figure painted sitting at the stern:** `cabin: false`
>   where the painting shows the stern open.
> - **Walkers' paths don't see boats.** The casting script's clearance knows buildings, props and the water, not the
>   hulls: a bank walker painted heading for the water climbed a bow's bridges (people_check: "walkers left the
>   ground"). Cap such a path short of the bow overhang, with the reason.
> - **The gangplank isn't walkable on the page yet** when it meets a tapering bow at a shallow angle (S4b's mat-cargo
>   boat: about 15°): the rail opening collapses to 0.22 m and the end walls stand across the plank's corridor (a
>   `boats.js` and kit fix, the lead's). Board such a boat over its bow meanwhile and leave the plank out of walks.json.
> - **Anchor lines from a stern** (S4b's arched and mat-cargo boats paint them) are not in the kit (its `moor` lines
>   start at the bow's bitts): list them as waiting on the boat factory.

### `scroll-section`, "Area agents, Run 2"

> - **Check the next section's boats against yours before the first export.** At real size S4b's sterns run 3-6 m
>   past the seam into S3's river, where S3 maps a boat rowed west toward them (`S3.veh.boat_under_way_15595`, which
>   also travels 8 m), a towed boat and a passenger boat, and S3's far shore comes 2.6 m further south than S4b's: two
>   river areas built at once need one plan of the seam's water (the lead's).
> - **The page tools hard-code the shared bench Chrome (CDP 9223).** An area that must use its own Chrome copies
>   `walk_page`, `shots_page`, `film_page` and `people_check` with the port from `CDP_PORT` (S4b's scratchpad
>   `S4b_run2_lead/tools/`); `budget_check.mjs` already takes `--cdp`.
> - **Films for the user as video:** `S4b_run2_lead/tools/walk_film.mjs` steps the walker at 60 Hz along legs (as
>   walk_page does, so the boats step with it), captures a frame every 4 steps and writes an mp4 (ffmpeg) and a strip.
>   Hide `#stats` with CSS, never remove it: the page's tick writes to it and stops drawing when it's gone.

## 1. Boats and water (skill `scroll-section`, "Mapping a section"; the river role)

> - **Count moored boats by their ends and by what lies between them.** At S4b the lead counted four rafted boats.
>   There were five side by side plus one along the far bank: the missed one showed only its after half (an arched
>   awning) between two others. Walk the row of bank ends and the row of outer ends at zoom 3, and give every
>   awning, cabin or deck you can't attach to a counted hull its own hull. *(river)*
> - **Read which end is the bow from the end's furniture, never from the bank.** Rudder stock or transom, sweep
>   blade, after cabin and tiller mark the stern; forked bitt, windlass and gangplank mark the bow. Anchor lines can
>   leave either end. Give both readings in the note: front, rear and facing all flip with it. *(river; the lead's
>   rule for all river areas)*
> - **Find a boat's whole extent before deciding seams.** S4b's biggest boat ends 400 px further east than Phase 0
>   assumed, and its after cabin had been taken for the next section's riverside hall. *(river, merge)*
> - **A wash-drawn bank has no vertical face.** Shores are not inked: the shore is where the bank's diagonal ink-wash
>   streaks stop and ripple ticks and eddy swirls begin. The restyle paints the water as a pale sheet, so its colour
>   edge is useless. The two-point water level (ground over waterline at the same u) is then only an upper bound on
>   the depth. Take it where a building's wall foot stands closest to the water, and report it as a bound with the
>   spread. A real reading needs a revetment, a stair or a bridge abutment. *(river, frame)*
> - **On the river, every line that touches the water stands on `water`:** a bank's `shore` line (`support_by:
>   {"shore": "water"}`) and a post in the water's edge. Otherwise the same strokes map 0.7 × 77 / 51.25 = 1.05 m
>   apart (S4b). Check each bank's top against its shore in the world file: the near bank's top must lie south of its
>   shore and the far bank's north of it (S4b's est far shore did not, by 0.3 m). *(frame)*
> - **At the silk's top edge over the river, faint strokes may be the far bank** (trees, a shed's posts). Record them
>   with `conf: low` and the support `far bank`, so the river agent's north shore and the build know the far side may
>   be land. *(t5)*
> - **The restyle redraws rafted hulls.** It changes their count, turns a dark stern on the bank into a stack of sacks
>   with a seated man, and paints willow trunks over a boat as its mast and crew. Count hulls, crew and masts on the
>   scan only. *(setup, river)*

For the needs step and the boat factory (skill `scroll-section`, the playbook's needs step):

> - **Check the boat factory's inventory against the merged map before the catalogue.** At S4b the factory's
>   `gen/boats/types.md`, written from crops before the mapping, put two boats' sterns at the bank, gave the top boat
>   "bow east" and merged two hulls into one. The map's orientation (settled by the lead's rule) wins: list each
>   mismatch in the needs file by the factory's number.
> - **Give the rafted gaps with the boats.** S4b's rafted centre lines lie 1.8–3.9 m apart in the frame, under every
>   kit beam (2.3–4.9 m), so the pilot's "shorten, then move outward" rule decides their spacing. Say so in the needs
>   list, so nobody expects painted gaps at real beams.

## 2. The frame: the receding direction (skill `scroll-section`, "Mapping a section", step 3 and the structures role)

> - **Measure receding edges per group, per side of the road, and give the sign of every one.** On S4b at
>   u 12600–13300 the shop furniture north of the road recedes up to the LEFT (slope +0.8 to +1.3, dx about −50 to
>   −62). The furniture under the south hall's east eave and the tables far up the silk recede up to the RIGHT at a
>   shallow slope (−0.5 to −0.7, dx +71 to +119). Further east the tea house's platform and furniture give dx ≈ −68,
>   while the south row's ridges recede up-right at −0.58 to −0.90. The painter draws neighbouring groups from
>   different sides, so a mean across them means nothing. Report each group's ground edges separately with their
>   stroke points, and keep an edge that runs the "wrong" way. A tile agent's furniture edges are often the only
>   ground-level evidence in an open hall, and a flipped sign must reach the frame agent before a knot is fitted
>   across it. A sedan or box that shows its west face is a quick check for "up to the left". *(t2, t4, structures_w,
>   structures_e)*
> - **Before adding a measured knot, compute what it does to the plan.** With X = (u − ou − dx(u)·D)/77, a row at
>   depth D gets (1 − D·Δdx/Δu)/77 m per px of u: a knot change Δdx over Δu px stretches the rows north of the origin
>   (Δdx < 0) or folds them (Δdx > 0, X falling as u rises) once D·Δdx/Δu passes 1. At S4b's seam, a ramp to the
>   north side's −57 within 340 px stretched the silk's top ×8.8, and a ramp to the south side's +97 folded every row
>   north of the road. Keep any ramp under about 1.5 px/m per 100 px of u (the silk's top, D ≈ 30 m, then stays
>   within ×1.5), and tabulate X along silk rows for each option before choosing (`knot_options.mjs` in the S4b frame
>   agent's scratchpad). *(frame)*
> - **When the groups disagree, keep the neighbour's knot as a stated assumption.** One dx per u cannot hold groups
>   drawn from opposite sides at the same u, and a group mean is not a knot. Give the lead each group's stroke points
>   and the computed options, and let builders orient furniture square to its hall as a recorded choice. *(frame)*
> - **Name a support for every raised floor** (`tea house floor`) with its step's two stroke points, rather than
>   `ground` by default. A tile brief's support list names only the floors the lead foresaw. *(t4)*

## 3. Reading the scan (skill `scroll-section`, "Mapping a section", step 1)

> - **Read the gestalt before the points.** At 3–4× the scan's strokes break into pixels: S4b's wheelwright looked
>   like two men and his facing was unreadable. At 1.3–2.5× **without the grid** the outline was one man bending
>   west. Look at a no-grid crop at 1.3–2.5× first (what is it, which way, how many), then take points on a 3× grid.
>   Far furniture (v < 150) read best at 4× without the grid. *(t3; t1 found the same: zoom 2–2.5 with grid 20 reads
>   figures best, a grid-10 zoom-3 crop only for a single measurement)*
> - **Enhance the crop, choosing the method by the job:**
>   - figures and furniture: a contrast-stretched and sharpened crop, sharp
>     `.normalise({lower: 1, upper: 99}).sharpen({sigma: 1})` at 2–3×. It shows caps, feet and furniture edges where
>     the raw crop is mush *(t2)*;
>   - faint far-top buildings, and mat against tile: greyscale with
>     `greyscale().normalise({lower:1, upper:99}).linear(1.3,-30)`. A "faint vertical strokes" spot turned out to be a
>     roof band, three posts and a base line *(structures_e)*;
>   - faint silk on the water: a plain 3–4× crop with a light `.sharpen()`. CLAHE turns the silk's weave into noise
>     there *(river)*, though it brings out faint strokes at the silk's edges for trees *(t5)*;
>   - in every case, put the same crop of the restyle beside it at the same scale and grid (S4b t2 kept a small
>     `crop.mjs` with scan, mosaic or both, a 10 px grid and a marks file).
> - **Check a crowd count with a marks overlay.** Put your head readings in a marks file, draw them on the enhanced
>   crop and read it again: an unmarked cap is a missed figure, and a mark off a cap is a misread. The crowd round
>   S4b's seated man came to 13, not the 15–20 guessed at zoom 1. *(t2)*
> - **Density guesses come from the scan, not the restyle, and are not counts.** t1's brief guessed 30–35 figures and
>   the scan has 14; t4 guessed 20–25 and found 10; t5 guessed 10–15 and found 4. Report the gap in your report, so
>   the merge and the second pass don't hunt for people who were never painted. *(t1, t4, t5)*
> - **A side-by-side zoom settles the restyle's additions faster than the scan alone.** Look for the restyle's
>   figure, then ask whether the scan has a head stroke there. On S4b the bending figure at the tea house's east end
>   was a post and braces, and the drum beside the rail figure was three loose strokes. *(t4; the setup agent found
>   the same at sheet scale: at 0.75× an invented group looks like painted detail, so zoom the suspicious spots side
>   by side at half 160–200, 3×)*

## 4. Figures and animals (skill `scroll-section`, "Mapping a section", the tile role)

> - **Read an animal's anatomy before accepting the restyle's figures round it.** On S4b the restyle turned a
>   horse's long dark tail into "a man in blue bending" and its dark lowered head into a second bending man, and a
>   small donkey into a third. A tail hangs from the rump to the hocks, and a head rises from the chest. Count the
>   legs under the belly; the hock (the backward bend) marks the hind legs, so the facing follows even when the head
>   is hidden. *(t1, t2)*
> - **Rider or man behind the animal: test the proportions.** Compare hat-top-to-seat with a seated person's height
>   at that depth (about 0.5 of a standing figure nearby), and standing height with the nearest measured figure.
>   Legs under the belly that reach the hoof line belong to the animal or to someone nearer, not to a man behind it.
>   *(t1)*
> - **Test a restyle animal by its painted size.** The restyle turned a 60–70 px striped load at the wheelwright's
>   into a saddled mule. The pack mules nearby paint 125 px nose to rump at v 450, and nearer things paint larger.
>   Compare a doubtful animal's length with a certain one at a similar v before recording it. *(t3)*
> - **Count a pack train by its legs.** Four legs per animal: a fifth leg in a cluster (with a second load above it)
>   is another animal, recorded `low` when the rest of it is hidden. *(t3)*
> - **Figures whose lower half a cart or roof hides:** estimate the feet from the standing height at that depth (about
>   130–140 px at v ~1000 on S4b). It often puts them on the ground in front of a raised floor, not on it. Say so,
>   and give the other support in the note. *(t1)*
> - **A shape over a figure's head** (a "load", a "frame", a "roof", a "tall hat") can be a carried rack, a wide hat
>   with a veil, a back load or a stand behind him. A hat sits on the head; a back load stands behind it and runs
>   down behind the neck, with the face showing beside it. Compare the painted height both ways with neighbours at the
>   same foot v. Record the figure once with every reading in its note, and add a prop only if the strokes show the
>   thing's own feet on the ground. *(t2, t5, merge)*
> - **A head drawn across a lintel or an eave line is suspect.** Inside a hall the lintel hides anything above it, and
>   a figure in front of the posts would show its body below. On S4b two "dim heads" sat on the official hall's
>   lintel; one was the same blob that the structures agent called a hanging lamp, and the restyle painted both as
>   hanging things. *(second pass, west)*
> - **Count the legs under furniture.** Five legs under one table's west end mean a second piece: on S4b a bench was
>   read as a counter's west side. *(second pass, west)*

## 5. Trees (skill `scroll-section`, "Mapping a section", the tile role)

> - **Read trees at zoom 1.2–2 on a clean crop, not at zoom 3 with a 20 px grid.** At zoom 3 the scan's weave hides
>   trunk lines, and hanging willow whips look like slender stems. A crop with tick marks only on its edges (and a
>   faint 50 px grid) shows which strokes join. The same crop cut from the mosaic (`u = 12448 + px/2`, `v = py/2` for
>   S4b) gives a side-by-side at any zoom. *(t5)*
> - **Follow a leaning stem to its root before calling it a tree.** A trunk crossing figures 700 px up the silk was
>   the west stem of a tree rooted at the road (u 14045, v 1098), not a second tree. *(t3)*
> - **Twigs pointing up from a drooping bough are its shoots, not a tree.** Follow the bough's line: a trunk must reach
>   the ground. Upright twigs with no bough above them grow from below and are a tree of their own (its foot hidden).
>   The restyle's "animals" and "pots" in bare branches were budding twigs. *(t5)*
> - **Willow heads with hidden trunks.** Where bare willow whips fan from a knob or a convergence point and no trunk
>   stroke shows (behind a bigger tree's crown, a roof or a gate), record one tree per fan centre. Give it a `base`
>   `est` on the nearest readable ground behind the occluder, `conf: low`, and the knob's point in `note`. Never take
>   the trunk from the restyle, which invents light trunks. On S4b t4 the whips over u 14100–14650 had two such
>   centres and a third in t3's range. *(t4)*
> - **Test a canopy's geometry before calling it a parasol.** Its pole's foot is at about rim v + 2.2 × 77 × the local
>   scale. If that point is visible and shows no pole, the canopy is a roof (or part of one). *(t5)*

## 6. Buildings and roads (skill `scroll-section`, "Mapping a section", the structures role)

> - **Read the other structures agent's part and report before you finish.** Buildings on the split line are easy to
>   leave to each other: a hall whose north peak is east of the line but whose main point is west of it, or an open
>   shop centred on the boundary. On S4b, structures_e named two buildings as structures_w's that structures_w had
>   split or missed. Read the tile agents' "left to structures" lists too: t1's list found a large tiled roof that the
>   restyle had painted over as bare ground. *(structures_w)*
> - **A roof that runs on past the neighbour's estimated end:** record only the rest. Start its footprint at the
>   neighbour's est corner, and say in the seam note that the builders must join the roofs. S4b.bld.shop_hall_13170
>   continues S4.bld.official_hall_12530's roof to u 13385. *(structures_w)*
> - **A road's end hidden behind roofs at a seam:** test each reading against the neighbour's buildings. A reading in
>   which the road runs into the next section's hall is wrong. S4b's road bends south of the low house to pass in
>   front of S3's riverside hall. *(structures_w)*
> - **A recurring south-row type:** a hall whose ridge rises up-right (−0.56 to −0.6) from a small south gable
>   (hanging fish, tie beam, open-front posts) to a high north gable peak with a finial near the road, with one north
>   barge descending to the right. Examples: S4.bld.south_hall_12350, S4b.bld.south_hall_gable_14340, and the hall
>   at u 13715–14146. Record both peaks, the ridge, the barges and the tie beam as named points, so the builder can
>   fit the roof whatever footprint it chooses. The ownership point is the footprint's middle, not the north peak:
>   the hall whose peak is at u 14146 belongs to the unit west of 14000. *(structures_e)*
> - **Roof material comes from the scan:** woven mat or thatch is drawn with cross-hatched, diamond strokes, and
>   tiles with scale arcs. The restyle repaints mat roofs as tiles. *(structures_e)*

## 7. Briefs, merge and second pass (skill `scroll-section`, the playbook and "Mapping a section", step 2)

> - **Say in the brief that lines live in `pts`.** A road's, water's or bank's lines go in `pts.lines` (keyed by
>   role) or `pts.line` with a top-level `role`, as in `S4.road.main` and `S5.water.moat_south_8700`. Written outside
>   `pts`, `check` fails with "no ground points". The datum reference `<id>:lines.centre.0` resolves through `pts`.
>   The S4 and S6 briefs said only "`lines: {centre, edge_n, edge_s}`". *(setup)*
> - **Check the brief's conventions with a probe part** (one boat, one crew figure on its deck, one water reach, one
>   group) in your scratchpad: `node tools/scroll_map.mjs <S> check --parts <probe>`, before the unit agents start.
>   *(setup)*
> - **Read every "left to" list against the other unit's part, by place, not by name.** On S4b, four painted things
>   were named in a report and recorded in no part: a stippled stump that the river agent and t4 each left to the
>   other, two heaps behind a ridge that structures_e left to two tiles, and a willow head that t4 left to t3. A
>   front rail was also called a rail by one unit and a bench by another. For each item, find the entity whose points
>   fall on it; if there is none, crop it and add it in `merge_fixes.mjs`. *(merge)*
> - **Settle a duplicate whose two bases disagree by occlusion.** Two units recorded one domed canopy with bases 180 px
>   apart. Its rim runs along a roof's top edge, so it stands behind that roof, and the base behind the roof is the
>   one kept. *(merge)*
> - **Test `merge_fixes.mjs` for idempotency:** run it twice and compare the parts' md5 sums. A guard that tests for
>   text other than what the fix appends (S4b: "front rail" against "a low rail") appends again on every run. *(merge,
>   frame)*
> - **In the second pass, compare the restyle with the overlay side by side** (overlay | restyle) at zoom 1.8–3 in
>   every dense window, not only the scan with the overlay. On S4b's west half this found a slatted crate and a
>   funnel-shaped vessel that the restyle painted and no unit recorded. Read each one on the scan before proposing it:
>   the restyle names a faded thing, and the strokes place it. *(second pass, west)*

## 8. The needs step (skill `scroll-section`, the playbook's needs step; skill `characters`)

> - **Balance the cast before you write it.** At S4b the idler would have played 19 of 66 figures (every short
>   jacket). Give the faint figures whose dress can't be read to other plain characters (porter, carter, townsman), so
>   one face doesn't repeat across a street.
> - **Every clip a cast needs is free once a take exists.** Before asking for an action, look for it among the takes
>   in `characters/motions.json` and every character's clips. List it as `t2m:<take>` or `from:<character>/<clip>`
>   (a local retarget, no credits). Count new takes separately, ranked, with a fallback clip for each. S4b needed
>   20 added clips (on 9 characters) and only 3 new takes.
> - **Withdraw a brief's request that the map contradicts.** S4b's brief asked for a landing stair; the river agent
>   found none painted, so the needs list says none is built (`map/BUILDING.md`: nothing unpainted).

## 9. Tool notes and requests (for the lead)

- **zsh** (the Bash tool's shell) doesn't split an unquoted `$w`, so `for w in "u0-u1 v0-v1" …; set -- $w` passes one
  argument. Put batch crop loops in a `#!/bin/bash` script. *(river, structures_e)*
- **`scroll_map.mjs <S> overlay`:**
  - it has no `--help`, and any unknown flag still renders the default overlay into `gen/map/<S>/`, so always pass
    `--out <your scratch folder>/…` *(structures_w)*;
  - `--x` takes `u0-u1` with a dash; two numbers separated by a space crash sharp with a NaN width *(merge)*;
  - consider an `--enhance` flag *(structures_e)*.
- **`tools/scroll_inspect.mjs`** could take a zoom and a `--nogrid` flag. The fixed 3× zoom with the grid was the
  hardest view to read (t3's scratch `zz.mjs` does this with `NOGRID=1` and `ENH=<contrast>`). *(t3)*
- **`plan.jpg` labels the datum "station 0"** even when `datum.station` is set (S4b: 67.95; `tools/scroll_map.mjs`
  line 586). *(frame)*
