**Merged, 2026-10-12 (round-2 records agent):** §1 into scroll-section "What the river, the boats and the bridge
taught" (bow or stern, one boat or two, crews, shores, ropes) and step 3 (the water's bounds); §2 into scroll-section
"Mapping a section" step 3 (the frame); §3–§7 into scroll-section "What round 2 taught about reading the strokes" and
"Review"; §8 into scroll-section step 2 (merge); §9 into scroll-section "Adding a section" and "Review"; §10 into the
playbook's needs step; §11's zsh, overlay and `plan.jpg` notes into scroll-section's tool quirks, 2026-10-12. "From the
restart run": tiled UVs into web-scene "The atomic scripts" (Ship); planning walks into scroll-section playbook step 4;
the boats into web-scene "Boats and water"; the HUD note into web-scene "The scroll HUD", 2026-10-12. Left out: §11's
`--enhance` and overview-size tool requests (listed in `NEXT_SESSION.md`).

# The canal wharves (S2): lessons for the skills

The needs agent merged these after Run 1 (restyle, map, merge, second pass, frame, layout, needs), 2026-10-12. The
sources are:
- every unit report in `gen/map/S2/reports/`: setup, t1–t12, river_w, river_w2, river_m, river_e, structures_w,
  structures_e and frame;
- the merge's lessons in `gen/map/S2/merge_notes.md`;
- the `lessons` in the second-pass proposals `gen/map/S2/second_pass/west.json`, `middle.json` and `east_middle.json`
  (the east pass wrote none);
- the needs step's own lessons (section 10).

Duplicates are merged, and each lesson names its sources in italics. The quoted text is the exact text to add, under
the skill and step named in each heading. All of it is merged (see the top). Where S4b's or S3's lessons
already say the same thing (`outer_road_2_lessons.md`, `rainbow_bridge_lessons.md`), the S2 case is added as a second
example rather than as a new lesson.

## 1. Boats and water (skill `scroll-section`, "Mapping a section"; the river role)

> - **Which end is the bow, when one end is hidden.** A stern shows its rudder hanging into the water below it, or its
>   sweep. If the visible end has open water under and beyond it and no rudder, it is the bow. A hidden rudder can be
>   read from a blade's slope: a rudder hangs down and aft, away from the hull, while a raked stem descends from the
>   stem head into the hull's length. On S2 the three visible rudders all slope aft, and the dark blade at the second
>   grain boat's west end slopes under the hull, so it is a stem. Say which way the blade slopes in the note, and give
>   the other reading; when that reading moves the stem across a seam, say so in the report. *(river_w, river_e)*
> - **A windlass or a crowded upper deck is not proof of a bow.** 豪华客船's windlass stands on the after cabin's roof;
>   the raked stem with an ornamental post and a projecting beam marks its bow. Read both ends before naming `front`,
>   and correct a brief that calls a deck "fore" without that evidence. *(river_w2)*
> - **Boats moored end to end look like one long boat at the setup's zoom.** Find each stem head (a curved stem with a
>   windlass hub) and each rudder before taking a length from a first look. On S2 a "980 px cabin boat" was a 310 px
>   mat-roofed boat plus a 545 px cabin boat. *(river_w)*
> - **One boat or two: follow a rivet row.** At zoom 3, trace one strake's rivet row along the hull through the place
>   where a second boat's bow would be. A midship deckhouse with its own arched hood, or a second windlass, can look
>   like the bow of another boat: S2's "small canopied boat" was the cargo boat's deckhouse. *(river_m)*
> - **Which boat carries a mast: follow the mast down.** A mast drawn over a farther boat's planking stands on the
>   nearer boat. Look for its tabernacle or partners on that boat's deck or roof; a mast stepped in the far boat would
>   stop behind that boat's own side. (S2: 逆水行舟's mast crosses the moored cargo boat's whole side to reach its
>   tabernacle on the near boat's roof, so the near boat is the towed one, and nobody rows it.) *(river_m)*
> - **A long dark shape trailing behind a boat is often its sweep's blade, not a second boat.** Follow the line from
>   the crew's hands. If it runs unbroken past the stern and spreads into a flat blade with no gunwale or thwart, it is
>   the boat's 大橹: record it as part of the boat (`sweep_pivot`, `sweep_tip` points). S2's "empty skiff" at
>   u 22450–22950 and S3's sweep at u 15595 are both blades. *(river_w2)*
> - **Willow whips mimic hull strakes at low zoom.** At zoom 0.6–1 the long curved whips over S2's bottom boat read as
>   hull lines 160 px past the true bow. Confirm a hull's end at zoom 3: strakes carry nail rows, and whips don't.
>   *(river_e)*
> - **A boat lying at a slant shows it in its waterline.** Where the waterline rises toward one end (豪华客船: v 910
>   amidships, v 775 at the stem), that end is further north. Set `facing_deg` from front and rear (here 172, not 180),
>   and keep `rear` on the amidships waterline's level when the stern is hidden. *(river_w2)*
> - **Read a long rope in 650-px windows at zoom 1.6.** Give a point every 100–200 px, plus the lowest sag, any knot or
>   lashed toggle, and the point where it is made fast. Then join it to the tile agents' readings at the far end, and
>   check the whole polyline on an overlay. The tool doesn't draw custom polylines, so put it into a throwaway part as
>   a `line` just for the overlay. (S2's tow rope: 26 points over about 2350 px.) *(river_m)*
> - **Crews at the scan's resolution: count dark heads, and expect few.** Read at zoom 2–3 in colour, with the restyle
>   window beside the scan (`scroll_inspect.mjs`, half 150–200). A head on this scan is a 15–25 px dark mass (hair or
>   cap) or a closed double outline; a 3–8 px stroke rising to a point is a spoke or a post top. The commonest false
>   crew are:
>   - windlasses, cranks and spoked wheels, whose end discs read as bent backs and spoke ends as heads;
>   - a hung fender or a scroll-ended bitt, a head-sized top over a body-sized column. Compare its "head" with a
>     certain head on the same deck (S2: 35 px against 20), and look at the column: a robe has vertical folds and arms,
>     a rope-wrapped fender has close horizontal wrappings and tapers to its foot;
>   - rudder heads: a stock's drum-shaped head with a hole, above a tiller bar, reads as a head in a cap at zoom 3.
>     Record a capped blob on a rudder stock's line only as `conf: low`, with the stock reading in the note.
>
>   Moored, unloading boats carry few people. S2's grain wharf has 4 boats and 5 crew (3 doubtful): the porters on the
>   bank do the work. The briefs guessed 15–25 crew per river unit, and the scan has 5–15. Count heads at zoom 3–4, and
>   treat every restyle crowd on a deck as invented until the strokes show it. *(river_w2, river_m, river_e; second
>   pass middle)*
> - **A head above a moored boat's roof: bank or deck, decide by size.** Find the bank's edge behind the boat and the
>   painted height of a figure standing on that strip. If a man on the strip would be painted far smaller than the head
>   shows, he stands on the boat (its far-side deck or its stern); heads that would be too tall for the boat's deck are
>   on the bank behind it. Record the doubtful one `conf: low` with both readings, and have the river agent and the
>   tile agent name the same pair in their reports so the merge keeps one. (S2: t2 put two boat hands on a 1 m strip of
>   bank.) *(river_w, river_m, t2)*
> - **A painted figure with nothing under it** (S2: a man in the open water, drawn from the waist up) is recorded, with
>   `conf: low` and both readings (wading, or a hidden craft). It is never dropped, and never given an invented boat.
>   *(river_w)*
> - **A "jetty" may be a raised deck at the top of the bank.** Before giving one to the river agent, find where its
>   posts' feet stand against the first current lines below. S2's walkway stands 120–190 px above the water's edge.
>   When the briefs give a thing to each other's agents, record it and say so in the note. *(river_e)*
> - **Behind a moored hull the shore is unknowable.** Put it just behind the boat's top where the bank's visible foot
>   ends, mark it `est`, and say in the note how far down it could lie. At the frame step these est shores (10–50 px
>   below their bank tops) map north of the bank top at the water's H; the builder then puts the bank face at the bank
>   top. *(river_e, frame)*
> - **A stair down to the water gives only a bound on the water level:** H ≥ −Δv/77, because the stair recedes as it
>   falls. Report it as a bound beside S4b's reading. (S2's landing steps: ≥ −0.99.) *(river_w2)*

## 2. The frame (skill `scroll-section`, "Mapping a section", step 3, and the structures role)

> - **The painter's recession can turn over within one section, and a receding direction that turns over is a knot
>   list through zero, not a contradiction.** On S2's east wharf (u 27600–28650) every table's short side recedes
>   up-left (slope +0.9 to +1.25, dx −52), against up-right (≈ −1, dx +47) west of u 26500. 王家纸马铺 between them is
>   drawn frontal, with a level floor line and no side, where the line between the knots crosses 0. A set piece can
>   confirm the direction: the 望火楼's back posts sit 45 px left of its front posts. Measure both ends of a section
>   before knotting, give the frame a knot for each group, and say where the turn falls. If the readings agree within
>   each group, use them: nothing folds when dx falls with u. Tabulate what the stretch does to each silk row and to
>   the route's length (`knot_options.mjs`), give the lead the hold option with its skewed edges, and say which one the
>   frame uses. (S4b's case is different: two sides of one road disagree at the same u, so no knot can hold both.)
>   *(structures_e, frame, t11)*
> - **A steep knot ramp skews short edges even where both ends are right.** Inside S2's turn (−4.5 px/m per 100 px), a
>   table's short side at slope +1 maps 124–131° instead of 90°, because the drift itself stretches u. Check edge
>   directions past the last knot as well as inside the ramp. *(frame)*
> - **Read a tabletop as a parallelogram.** With its back edge and front edge both level, the side that slants says
>   which way depth goes: if the back edge is shifted left, depth recedes up-left. A colour crop at zoom 2–3 with the
>   restyle underneath settles it; the restyle draws the furniture's lean correctly even where it invents people.
>   Report every furniture edge with its sign. *(structures_e, t11)*
> - **Don't take a building front or an eave as a receding edge.** S2's east sheds stand turned to the picture: their
>   fronts run down to the east at +0.2 to +0.3, while their tables recede at about +1. A front is the X direction
>   (turned); only the short sides of things give depth. *(structures_e)*
> - **Short furniture edges disagree between agents** (S2: −0.5 to −1.5 on the same tables). Report every reading with
>   its stroke points and use the group mean. A knot from furniture alone is weak, so say so. *(structures_w)*
> - **Measure the diminution from the parts, not from scratch.** When the structures agent runs late, the tile and
>   river parts already hold dozens of figures with foot and head. A script that lists the standing adults by foot v
>   gives the table in a minute; check a handful on the scan. S2's table came from about 30 figures this way.
>   *(structures_w)*
> - **Give every raised deck its own support.** A boat's waterline-to-deck rise ranges from 32 px (逆水行舟's bow) to
>   298 px (the mat-cabin boat's poop) on one river. Name `boat stern deck:`, `boat bow deck:` and `boat after roof:`
>   wherever crew stand on them, and check each crewman's world D against his hull's waterline points
>   (`worldcheck.mjs`). *(frame)*
> - **Fix route edges to the fronts the buildings' owner read.** Where the route's agent left `edge_n` est and the
>   structures agent measured the front, set the edge to the measured front. Add a point where the yard opens behind a
>   shed's end, or the edge cuts through the shed. *(frame)*

## 3. Reading the scan (skill `scroll-section`, "Mapping a section", step 1: every mapping agent)

> - **Stretch the contrast instead of zooming further.** The commons scan is 1800 px tall: above zoom 3–4 it shows
>   only the weave. Read faint figures, heads and harness on a **gridless, contrast-stretched crop at zoom 2–3.5**
>   (sharp: `extract` → `greyscale()` (optional) → `normalise({lower: 1, upper: 99})` → `resize` with lanczos3 or
>   cubic → a light `sharpen()`, or `blur(1.2)` / `median(3)` on noisy silk). Then take the points on a gridded crop of
>   the same window (`scroll_map.mjs overlay --grid 20 --zoom 3`). A full grid at zoom 3 turns 90–130 px figures into
>   texture, and CLAHE amplifies the weave into noise. Use zoom 5–7 only to decide whether a small patch has an outline
>   or a face, or to measure a blot. On S2 this separated four diners' heads from a balustrade, a horse's lowered head
>   and saddle-cloth from a cart, a willow's split legs from the ground wash, and a donkey and the bench under a
>   "rider". *(t1, t3, t4, t5, t6, t7, t8, t11, t12, river_w, river_e)*
> - **A grid line can hide a stroke.** A thin vertical stake at u 27900 lay exactly on the 50-px grid line and read as
>   grid. When a straight vertical or horizontal stroke falls near a grid value, crop again with no lines before
>   deciding. *(t10)*
> - **The restyle's registration can drift 30–45 px inside one tile** (S2 t5: the cart's wheel sits at u 24317–24377 in
>   the restyle and 24355–24427 on the scan), and where it drifts it also redraws the scene (one animal for two, straw
>   for a mat-covered load). Use it for what a thing is, never for where; match it to the scan by a landmark in the same
>   crop before reading anything from it. *(t5)*
> - **Compare an uncertain shape with a known thing of the same kind on the same crop.** A second pass on faint silk
>   gains more this way than by zooming. (S2: a "head" at u 25810 against the boat's own domed basket 90 px east: one
>   is a single ribbed dome, the other a smooth round top over a ribbed body.) *(second pass east_middle)*
> - **A white fleck of silk damage at the tip of a light structure reads as a pale head at zoom 1–2.** S2's "figure
>   under the awning" was a fleck at the awning's west tip, with the awning's edge lines running through it. Check
>   every pale head on a plain colour crop at zoom 3 for an outline before keeping it. *(second pass west)*

## 4. What the restyle invents, and counting (skill `scroll-section`, "Mapping a section", step 1)

> - **Count from the scan only; a brief's density hint is a guess.** The setup's first look and the restyle both run
>   high. On S2:
>   - t3 was briefed "about 10–15" and the scan has one figure (the bank's six walkers and stone stair were the
>     restyle's);
>   - t9 was briefed "about 20–25" and has one certain figure (the tables of 喝杯小酒 and the jetty are empty);
>   - the river units were briefed 15–25 crew each and have 5–15.
>
>   An almost empty tile is a valid result: say so in the report, with how the range was walked, so the merge doesn't
>   read it as skipped. *(t3, t9, river_w2, river_e)*
> - **The restyle's inventions on the canal**, each settled on the scan:
>   - **extra people:** about twelve in the empty yard under the pole frame (u 27300–27620), crowds on decks and
>     round windlasses, a second man beside a carved stem post, seven trackers for five;
>   - **doubled figures:** a hunched back or a bundle made into a second person (a tracker with a sack from a bent
>     back, two men from one man in a broad hat);
>   - **children in red beside standing adults,** one from a single stake stroke and one from nothing;
>   - **figures in knobbed willow trunks,** and bark where a small figure may stand;
>   - **animals from small dark marks:** a "leaping dog" that is a ladder's dark-tipped cross-bars, a horse from a
>     trestle and table legs, an ox head from a bench;
>   - **people from animals and mechanisms, and back again:** a donkey's head made a man's hat, a donkey made two men,
>     a rudder head briefed as "a man at the boat's east end";
>   - **trees from upright strokes:** a willow from a pole stack, a scaffold's pole tips and a striped cloth on a pole;
>   - **dry ground under moored hulls** (the setup's lesson, below).
>
>   Count heads and pairs of legs, never silhouettes. When the setup's notes say the restyle "makes X an animal", open
>   that tile's check sheet (`gen/sections/<folder>/check/t_rRcC.jpg`) and find it before reading the scan. Record a
>   tree only where a trunk is painted. *(setup, t1, t2, t6, t7, t10, t11, t12, river_m)*

## 5. Figures and animals (skill `scroll-section`, "Mapping a section", the tile role)

> - **Size-check a doubtful face against a sure face at a similar v.** Figures near the silk's bottom edge are painted
>   largest. S2's t1 judged a 45–50 px profile at v 1650–1700 "twice a head's size" by a head at v 1270; the big-hat
>   man's sure profile at v 1613–1653 is 40 px, so the patch is a face's size there. *(t1, second pass west)*
> - **Seated or standing: compare painted heights with standing neighbours at a similar foot v**, not with the
>   furniture beside the figure. S2's eatery man is 72 px at v 398, where standing men are 92–109 px at v 301–373, so he
>   sits, though a 40 px table stands next to him. For a seated figure behind a railing, give the foot from a seated
>   height (about 0.8 of a standing figure's painted height at the same v) and write the floor line's v straight below
>   in the note. *(t4, t5, second pass middle)*
> - **A dark head is the diner test.** Behind balustrades and in sheds, a mass without a dark head (hair or cap) is
>   more often cloth, a bundle or furniture; record it `conf: low` with both readings, and say the restyle's reading
>   separately. *(t4)*
> - **Heads showing over a roof** can stand on the street beyond, behind the building, or on the roof, or be ridge
>   ornaments. Record them as figures with the foot `est` about one figure-height below the head's top and `conf: low`,
>   give the readings, and name them to the structures agent so the merge settles them on one crop. (S2: the
>   scaffold house's west "head" was its 鸱尾.) *(t6, t8)*
> - **Two heads over one body: test which head the body belongs to** by the bare silk under each head. A head with
>   nothing under it belongs to a body leaning toward it. Record the other head as a second figure, `conf: low`, with
>   both readings; never merge them silently. *(t11)*
> - **When feet are hidden behind a roof, say what the visible part is** (head to hip, or head to knee). Give the foot
>   as a range in the note (S2 t9's porter: v 330–355) and pick a middle value as `est`. *(t9)*
> - **Rider or not: check the animal's flank and the seat height.** A rider's leg or robe crosses the animal's flank
>   below its back line. Compare the seat-to-head height with the seated figures beside him, and look for a bench
>   under his hips (S2 t12: the "rider" sat on a bench behind the donkey). The other way round, a figure on an animal
>   can read as a man walking beside a pale animal: look for one continuous body line under the lap and the legs
>   hanging at the animal's side (S2 t8: the hooded rider by 王家纸马铺). *(t8, t12)*
> - **Count a team's animals by their hooves.** Two sets of hooves at different v (S2: 272 and 297) are two animals,
>   even when the near one is foreshortened over the far one. *(t5)*
> - **Before writing that an animal stands in a cart's shafts, follow the bed's lines to their end.** On S2's far
>   street the round-topped cart's bed stops 30 px short of the horse, with posts between, and its `front` had been put
>   under the horse's hind feet. *(second pass east_middle)*
> - **Rooms seen through windows above a lattice skirt are raised floors.** Give the figures `upper floor: <building>`,
>   with the sill's v and the v of the posts' feet straight below in the note, so the frame can set the floor's height,
>   and tell the structures agent. *(t7)*

## 6. Trees (skill `scroll-section`, "Mapping a section", the tile role)

> - **Follow a willow's trunk down to its roots before recording it or assigning it by base.** S2's leaning willows
>   carry their knobbed heads far from their feet: the great willow by 王家纸马铺 has a head sprawling 250 px along the
>   bank top, and its trunk runs down the bank to roots 230 px lower and 100–200 px further east. A thick leader branch
>   in the crown can look like a trunk whose base is 300 px away at the silk's edge. The setup read the head as the
>   trunk and gave the tree to the wrong tile. Record any second reading (a pollard's own short trunk under the head)
>   with its foot point. *(t8, t9, t12)*
> - **One tree named twice across a seam.** S3's brief put "the big bare tree with the dark trunk" at u 20330–20420,
>   and S2's put "the second dark willow trunk" at 20480–20600: on the scan they are one trunk, its foot at
>   u 20465–20600. Before giving a seam tree to either side, read the silk's bottom edge on one zoom-0.8 view across
>   the seam, and name the tree once in both briefs. *(t1)*
> - **A split-trunk willow** (two legs joined in one knobbed head) is one tree: `base` midway between the legs (est),
>   custom points `foot_w` and `foot_e` for each leg's foot, and the two-tree reading in `note`. *(t3)*
> - **Trees whose feet hide behind roofs:** give the base `est` where the roof hides the trunk, and say in the note how
>   far north the true foot could be (the shed's depth), because the base decides the tree's depth in the world. For
>   S2's pollards behind the sheds only the knobbed head and its whips show above the ridge. *(t11)*

## 7. Buildings, structures and roads (skill `scroll-section`, "Mapping a section", the structures role)

> - **The road's `edge_s` is the river agents' `bank_top`.** Where a route runs along water, copy the river units'
>   bank top (the level ground's edge) at the road's stations instead of reading your own. On S2 the structures
>   agent's own reading put the route on the wash slope below the jetty and in front of the scaffold house, where the
>   level strip is only 10–20 px of v deep. *(structures_w)*
> - **A route through a building is a valid, recorded reading.** Where a building fills the bank to the water (S2's
>   dining terrace, S3's tavern front), run the route through its floor, `est`. Give the alternative in the note and a
>   `support_ranges` entry for the frame. Never drop the route below the silk or invent ground. *(structures_w)*
> - **Placeholder back corners must contain the figures on the floor.** Shifting a hidden back along the receding
>   slope can push a building's west side east of the people painted inside it (S2's terrace). Check every placeholder
>   footprint against the tiles' feet on its floor support. *(structures_w)*
> - **Check the neighbours' parts and the tiles' "left to structures" lists before finishing.** Structures agents
>   finish last. By then S2's river agent had recorded the jetty (on land) and a tile had recorded the free-standing
>   pole frame, both with "if structures_e also records it, keep one". The tiles' lists also named a wattle fence, a
>   balustered railing and a roof knob that a pass by range would have missed. *(structures_e)*
> - **A set piece's restyle is a guess about its base.** The restyle turned the 望火楼's single brick face and wooden
>   stair into a wide stepped stone terrace. Take the platform's corners from the brick courses' ends, and its back
>   corners from the pavilion's post shift, as `est`. *(structures_e)*
> - **Free-standing frames, trestles and racks in a yard** belong to the tile agents as props unless the brief names
>   an owner: the base corners, the legs' feet in `bays`, the apexes as custom points, and "drop if structures reads it
>   as fixed to a building". *(t9)*
> - **A post on a plinth's face right under a bay post is the post carried down,** not a mooring bollard. Check the
>   alignment with the building's posts before keeping it as a prop. *(merge)*
> - **Before extending a structure behind an occluder, compare the stroke rhythm on both sides.** S2's slat fence has
>   slats 3–4 px apart east of the top willow; the uprights west of the trunk are 10–20 px apart with a slanting rail,
>   so they are a different thing, not the fence's west end. *(second pass west)*
> - **A roof named only in a building's note is a painted thing without a footprint.** S2's long house said "whether
>   the roof over u 22320–22650 is this house's west part or a second building is not settled", and its footprint
>   started at u 22650, so nothing would have been built under 330 px of painted roof. Give such a roof an entity of its
>   own (or move the building's footprint), with both readings. *(second pass west)*

## 8. Briefs, merge and second pass (skill `scroll-section`, the playbook and "Mapping a section", step 2)

> - **A straddler two units may both claim: record it under the same ID, and name owners by entity.** S2's rear
>   tracker had its foot at u 22172, in t3's range, while the brief gave "the trackers (u ≈ 21780–22150)" to t2; both
>   recorded it under one ID. `merge` keeps the first part file's copy and prints it under "duplicate ids", so no
>   near-duplicate is left to settle by hand: drop the other copy by file in `merge_fixes.mjs` and copy its reading
>   into the kept entity's note. Better still, the brief says "all five trackers, the easternmost at about 22170, are
>   t2's". Read the neighbour's part file, if it exists, before naming a straddler. *(t2, t3, merge)*
> - **Read the neighbour's part before writing a seam figure.** When a neighbouring tile has already written its part,
>   a figure on the boundary (S2: the man at the horse's head, foot u 24497–24506) is recorded once, on the side the
>   neighbour's reading puts the foot, and named in both reports. Groups that cross the seam name the neighbour's IDs in
>   their `note`. A heap on a unit boundary: compute the footprint corners' middle before naming the ID, and give a seam
>   note when it falls within about 20 px of the boundary. *(t5, t10)*
> - **Find a brief's small groups on a zoom-1 overview first.** The setup's positions for minor groups can be a couple
>   of hundred px off (S2 t7: "the two standing on the bank" at u 25500–25550 were at 25325–25385). *(t7)*
> - **Read the neighbour area's reports for your side of the seam.** Its tile agents look 150 px past the seam and note
>   what they see there. S3's t9 and structures_e named a second bare tree and a figure under an eave that S2's tile had
>   judged away. Treat those notes as part of the "left to" comparison. *(merge)*
> - **Make the river units' reaches meet:** copy one shore point and one bank-top point onto both sides of every
>   river-unit seam (S2's readings at u 21850 were 80 px apart), and say whose reading was taken. *(merge)*
> - **In `merge_fixes.mjs`, keep ID swaps out of the merge's own notes** (swap only the text before the first
>   "Merge:"), or a rerun rewrites the retired IDs those notes name on purpose. *(merge)*

## 9. Setup (skill `scroll-section`, "Adding a section")

> - **Keep a restyle unit's aspect to about 2.6:1 or less.** The image API does not draw wider images: S2's overview
>   asked at 4096 × 832 (8864 × 1792 of scan) came back 4096 × 1658, letterboxed with white bands, and S1's (4096 × 848)
>   the same; S3's 4096 × 1376 came back 4096 × 1415. A letterboxed overview ruins every tile, because each tile's
>   colour crop is cut from the overview at the width ratio on both axes. Check the returned overview's size before the
>   tiles run (`restyle --only overview`), and split a long area into pipeline sections nested in its folder
>   (`sections/canal/west`, `sections/canal/east`, 4608 × 1792 each with a 4096 × 1600 overview); read each with
>   `scroll_inspect.mjs canal/west|east`. *(setup)*
> - **Open water under moored hulls can come back as dry ground.** Where the overview paints water in nearly the
>   ground's colour, the tiles below a row of boats drew a grassy yard (S2 east, u ≈ 25500–27400). One redraw fixed one
>   tile; two redraws of the other gave dry ground and then an invented shop street. Read the bottom-row sheets for
>   this, and warn the river agents. *(setup)*

## 10. The needs step (skill `scroll-section`, the playbook's needs step; skill `characters`)

> - **Cast from a table, not by hand.** Write the casting as a small script (slug, character, clip, until, props,
>   description) that checks it covers exactly the map's figures, and derives the counts, the clips to add (each
>   against the character's current `clips`) and the per-character lists. On S2 it caught the boat-borne passengers
>   who are not crew, and the clips trimmed earlier that need adding back. (`scratchpad/S2_needs/cast.py`.)
> - **Pick a new character's model from a figure painted large and face on.** S3 proposed the boatman from a crewman
>   seen from behind. S2's sweep crew stand at 128–155 px facing us, and give a better front reference. Before
>   proposing a model, check the neighbours' crews at the same type for a larger, frontal one.
> - **Use the neighbours' take names.** S2's crews want S3's takes (`work_sweep`, `tow_walk`, `pole_boat`, `fend_pole`,
>   `haul_line`). Name them as S3 did and add S2's figures to them, so the catalogue sees one take serving three areas
>   instead of three near-duplicates.
> - **Give the boats' world extents with the needs.** List each boat's X range and middle D from `layout.json`. Rows
>   moored end to end or side by side closer than the kit's beams (S2: four groups) show at once where the pilot's
>   "shorten, then move outward" rule will act.
> - **Check the boat factory's inventory hull by hull.** S2's #14–#30 were drawn from crops before the mapping. Two of
>   them were one boat in two halves read the wrong way round (逆水行舟), one was a deckhouse, five were three, and
>   three boats were missing. List every mismatch by the factory's number.

## 11. Tool notes and requests (for the lead; not skill text)

- **zsh doesn't split words:** `for w in "20380-20640 0-300 a"; do set -- $w; …` passes one argument in zsh (the Bash
  tool's shell), so `scroll_inspect.mjs` gets NaN. Use `${=c}`, write the calls out, or put crop loops in a small bash
  script in the scratchpad folder. *(t1, t10, t12)*
- **An `--enhance` flag on `scroll_map.mjs overlay`** (the contrast-stretched, gridless crop of section 3) would save
  every agent writing its own; S2's units wrote at least five (`S2_t3/enh.mjs`, `S2_t8/ecrop.mjs`, `S2_t11/crop.mjs`,
  `S2_river_e/sc.mjs`, `S2_needs/crop.mjs`). *(t1, t3, t11)*
- **`tools/scroll_pipeline.mjs` could stop when the overview's returned size differs from the asked size.** It would
  have caught S2's and S1's letterboxed overviews before 20 tiles were spent. *(setup)*
- **The overlay doesn't draw custom polylines** (the tow rope's `pts.rope`); river_m drew it through a throwaway part.
  *(river_m)*
- **`plan.jpg` labels the datum "station 0"** even when `datum.station` is set (S2: +179.21), as S4b's and S3's frames
  noted. *(frame)*

## From the restart run (S2 finisher, 2026-10-12 evening)

### `web-scene`, export and budgets (add)

> **Tiled UVs ship as float32.** `gltf-transform optimize`'s quantize skips any UV set outside 0-1 ("Skipping
> TEXCOORD_0; out of [0,1] range"), and every kit swatch tiles, so a section GLB carries its UVs as floats: in
> `canal.glb` they were 0.93 of its 1.93 MB. Rounding tiled UVs to 1/1024 of a repeat (half a pixel of a 512 px
> swatch) lets meshopt pack them: `canal.glb` 1.93 -> 1.74 MB, no visible change (`UV_Q` in `blender/canal_scene.py`;
> explicit atlas and sign UVs left exact). Worth doing once in `export_web_scene.mjs` (or `street_b1.Buckets`) for
> every section.

### `scroll-section`, checks: planning walks (add)

> Plan walk routes over the page's own colliders, not the layout: probe the loaded page on a 0.25 m grid (surfaces
> under a ray from H 9, and the floors the walker's capsule stands on unmoved; S2 alone took 12 s on an idle machine),
> then A* over it with a head-room test (1.9 m), walls taken from bands of failing capsule cells, and a floor band
> that excludes table and bench tops (H -1.25..0.35 for ground routes). Tools: `gen/sections/canal/qa/run3/tools/`.
> Painted walkers that cross the only strip (S2's sack porters across the bank) delay a walker by 1-3 s: end long
> routes in a wall where you can, or give the end a margin along the route.

### Boats (add to `boats_page_lessons.md`)

> - A bank bridge (a rim piece's contact) steeper than the walker's 34 deg can't be climbed: the high-riding cargo
>   boats (deck H 1.0-1.2 over a bank at 0) have bridges of 28-40 deg, so only some of them board.
> - A contact that lands under a mat canopy (1.8-2.0 m over the deck at its edge) leads only to the rim.
> - `boats.js` `contacts()` skips a gangplank's contact when the rim piece nearest its deck end already touches a
>   neighbour boat, so the shore walls along its foot stay shut (S2's first grain boat; page queue). Rafted boats with
>   a plank need that case.
> - A plank set before a neighbour is moved can end up crossing the neighbour's hull: recheck planks after moves.

### The HUD (add to `hud_lessons.md` "Open questions")

> Where a river plan shifts the bank (S2: up to 3.2 m south, u 22300-26000), the walker's ring maps by the frame
> alone and lands that far into the painted river. The figures' boxes are right (their own spots).
