**Merged, 2026-10-12 (round-2 records agent):** §1–§5 into scroll-section "What round 2 taught about reading the
strokes" (crops, profiles, seals, trees, the countryside's ink-wash ground); §6 into scroll-section step 2 (merge) and
step 5 (vetting proposals); §7 into scroll-section step 3 (the frame, the water); §8 into scroll-section "Adding a
section" and "Review"; §10 into the playbook's needs step; §11 into scroll-section playbook step 4 (stale walks, plan
views) and characters "Reviewing actions" (verdicts), web-scene "Building a new section" (hidden depth), 2026-10-12.
Left out: §9's tool requests (in `NEXT_SESSION.md`); the `trees/types.md` record (the tree factory made `sapling`);
§11's `people_check` ground band (superseded: the lead made the test relative to the built ground, now in web-scene).

# The countryside (S1): lessons for the skills

The needs agent merged these after Run 1 (restyle, map, merge, second pass, frame, layout, needs), 2026-10-12. The
sources are:
- every unit report in `gen/map/S1/reports/`: t1–t8, structures_w, structures_e and frame;
- the merge's lessons in `gen/map/S1/merge_notes.md`;
- the `lessons` in the second-pass proposals `gen/map/S1/second_pass/west.json`, `willows.json`, `farms.json` and
  `start.json`;
- the setup's record in `sections/countryside/notes.md` (no lessons section of its own);
- the needs step's own lessons (section 10).

Duplicates are merged, and each lesson names its sources in italics. The quoted text is the exact text to add, under
the skill and step named in each heading. All of it is merged (see the top). Where S4b's, S3's, S2's or
S7's lessons already say the same thing (`outer_road_2_lessons.md`, `rainbow_bridge_lessons.md`, `canal_lessons.md`,
`city_end_lessons.md`), the S1 case is a second example, not a new lesson.

S1 is the pilot for the countryside: faded, dark, worn silk; ink-wash ground; bare trees by the dozen; few people. Most
of what is new here is about reading that silk, counting trees and mapping ground.

## 1. Reading faint, worn silk (skill `scroll-section`, "Mapping a section", step 1: every mapping agent)

> - **On worn silk, read at zoom 1.3–2.5 with a contrast stretch, not at zoom 3–5.** Where the silk is dark and faded,
>   its weave is coarser than the strokes, and raw crops above zoom 3 break the strokes into texture. Read points at
>   zoom 1.8–2.5 on a crop normalised per channel (sharp `normalise({lower: 0.5, upper: 99.5})`), and orient at zoom 1.
>   Pick the filter by what you look for:
>   - **tiny far figures and pale far trees:** blur before you stretch. A greyscale crop blurred about 1.2–1.6 px, then
>     normalised and given a little gain (sharp `.greyscale().blur(1.6).normalise({lower: 2, upper: 98}).linear(1.3,
>     -30)`), shows each pale trunk as two outline strokes and separates ink from weave;
>   - **faint ink-wash figures and animals:** a grey high-pass crop (the scan minus a 12 px Gaussian blur, ×4, offset to
>     mid grey) at zoom 2.5–5 with the grid. On S1 contrast stretching left the travellers and the tomb-sweeping party as
>     smudges; the high-pass crop showed the donkeys' eyes and ears, the sedan's poles, the porters' loads and which way
>     each animal faces;
>   - **bare trunks on dark silk:** the red channel, normalised and enlarged 1.7–2.4×: ink goes dark, the yellow silk
>     light, and the painter's pale-filled trunks with two dark contours read as pale bands;
>   - **ink-wash banks:** colour, `normalise({lower: 1, upper: 99})` then `linear(1.4–1.7)`, at zoom 0.9–1.6, grid
>     10–25.
>
>   Keep each filter script (about 20 lines of sharp) in your scratch folder. *(t1, t2, t5, t6, t7, structures_w)*
> - **Profiles settle what the eye merges.** Take the mean grey along short bands and read the minima:
>   - **trunk feet in a row of big trunks:** the mean grey in 10 px bins along scan rows every 30–40 px of v across the
>     feet. Outlines show as dips and open silk as peaks. It decided three of four willow feet in S1's 隋堤烟柳 where the
>     zoom-2/3 crops and the restyle disagreed by 30–60 px;
>   - **a trunk is a pair of minima:** in a column darkness profile across a grove, an outlined stem shows as two minima
>     8–10 px apart that stay together from band to band down the silk; single minima that drift are whips or twigs.
>     Count trunk feet this way where crowns tangle (S1's 菜地: 13 trunks and a faint fourteenth, against "25–35 plants"
>     by eye). The foot is where the pair stops;
>   - **where a hidden trunk ends:** the mean grey of a 14–60 px band down the trunk against 15 px of silk either side,
>     in 5 px bins of v: the end is where the band stops being darker than both sides (S1's far-grove foot line, to
>     within 10 px);
>   - **a wash band's edge:** mean grey of 16 px columns in 10 px bins, blurred 1.5 px: the light step gives the edge to
>     about ±5 px, quicker and steadier than the eye on faded silk;
>   - **a ground or field line's position:** average the darkness along the proposed line and along parallels 2–16 px
>     either side. A real stroke is darkest at offset 0, a misplaced line at an offset, and a line that isn't there
>     gives a flat profile. Run it in 40 px segments to find where the line ends (S1's far fields: two lines 8–17 px
>     off, five missing).
>
>   *(t3, t6, merge, second pass west, second pass willows)*
> - **A layered wash bank has its foot at its lowest stroke.** Countryside banks are painted as two or three stacked wash
>   strokes with paler gaps between them; the lower edge of the first stroke is a layer, not the foot (S1
>   `bank_37050`: mapped 868–870, drawn foot 918–978). Take the foot from a column profile through the whole band, and
>   check it against the figures and the road beside it. *(second pass start)*
> - **A tree's base where its bole meets a dark bank wash is easy to set too high.** Look for the lower edge of the bark
>   texture (cracks, hollows, knots), not the top of the wash; the silk turns pale just below the true foot on a row
>   profile. Then check the bank line or road edge that runs past the foot. *(second pass willows)*
> - **Measure a seal before you stop a line at it.** Find each seal's box from its red pixels (R − G > 45 on the scan),
>   run every line to the box it really meets, and say where the strokes show again past the seal. S1's east end
>   stopped the road and three bank lines at u 37250 "under a seal"; the seals there begin at 37362–37396, so 150 px of
>   painted bank were left out. *(second pass start)*
> - **Long straight lines through crowns and ground are creases or seams in the silk,** not trunks, posts or ropes (S1:
>   u 31236–31240, v 20–460; 31480–31505, v 410–760). A crease runs straight through everything; a trunk ends somewhere
>   and has two outlines; a rope or pole stops at things. *(t3, t6, t8)*
> - **On worn silk, colour separates a garment from a post.** The painter tints clothing with indigo; posts, poles and
>   twigs are plain grey-black ink. Read a doubtful upright in natural colour at zoom 3–4 (`scroll_inspect` half
>   45–60), and check whether a shaft runs on to the ground: a post's does. *(second pass farms)*
> - **Read faint small animals on a gridless crop of the whole group first** (zoom 2–3, `normalise` 0.5–99.5 plus a light
>   `sharpen`, ticks only on the border), then take points on a gridded crop. At zoom 4–5 the weave breaks the strokes,
>   and which end is the head is lost. *(t8)*

## 2. What the restyle invents in the countryside (skill `scroll-section`, "Mapping a section", step 1)

> - **The countryside restyle gets trunks right and almost everything else wrong.** On S1 it drew every trunk in the
>   right number (often 20–40 px west of the strokes), but it tiled the thatched roofs in blue, added green weeping
>   willows and ivy, drew people round every group, and dried every wash band into grassy ground with stone banks. Use it
>   to tell which trunk is which, never for feet, crowns, roofs, people or water. Take feet only from the scan: on
>   ink-wash ground it draws them 20–30 px lower. *(t3, t4, t5, setup)*
> - **Its invented people come from things it misreads:** a trunk foot, a brush clump or a shed (S1's farmhouse grove);
>   two lumpy panniers become two men in hats (the charcoal train's 6–8 "drivers"); a pale patch of ground with a dark
>   contour between trunks becomes a man; a willow trunk leaning behind a lying buffalo becomes a second buffalo's head.
>   Check that the silk under a restyle figure is not plain at every contrast, and follow every dark band to its ends
>   before counting animals. *(t1, t5, t6, t7, t8)*
> - **Where the silk is faintest, the restyle paints whole streets.** Above S1's great willows (u 31500–32520) three
>   draws of one tile gave a house with figures, a crowd with horses and a street of shops; the strokes have willows and
>   bare ground. Say so in the tile brief so nobody reads it. *(setup)*
> - **When the restyle's tile and its overview disagree about a faint group, both are inventing.** At S1's party rider
>   the tile draws three men and the overview a rider with a groom. Count legs, hooves and torsos on the strokes: four
>   hooves and one torso make one horse and its rider. *(t2)*
> - **A setup's "figure" from a zoom 0.4–1.2 look can be a prop:** S1's "figure and a table or tub" under the shed is a
>   jar with a tied cover and a basin. Read every hinted figure at zoom 3–4 before counting it. *(t3)*

## 3. Figures and animals (skill `scroll-section`, "Mapping a section", the tile role)

> - **Take a vignette's direction from the heads, not from its title or the restyle.** S1's charcoal train is 赶驴入城
>   ("into the city", westward), and the restyle walks it west; on the strokes D4's pricked ears and D1–D3's lowered
>   heads are at their east ends, and the rear driver holds a stick out over the last donkey. The party's horse and both
>   travellers' donkeys face east too, though the scholarship sends both groups home. Record each animal's facing from
>   its own head (ears, and which end the neck rises from), give the other reading in the note, and give the conflict
>   to the lead: it decides the walking routine. *(t2, t8, second pass start)*
> - **Read a pack animal's view from its legs, not its load.** Legs spread along u mean a side view (S1's D1: three legs
>   37 px apart, its head lowered at the east end); an end-on animal shows its panniers left and right of a central head
>   or rump, its legs splayed to both sides (D5). *(second pass start)*
> - **`head` goes on the head itself.** When something round sits behind or on a head (a hat blown back on its strings, a
>   bundle on the shoulders), give its extents and both readings in the note. *(t2)*
> - **Compare low-confidence figures against posts and poles, not only against their own kind.** On S1's threshing floor
>   a figure (t6) and a structure's post (structures_e) were the same inverted-V strokes. For every figure with conf
>   low, list the structures' posts, poles and frame points within 20 px of its head-foot span. *(second pass farms)*
> - **A line at a boat's end: follow it to both ends before naming it.** A rope runs to what it is tied to and slants
>   toward it; a vertical line that rises from the boat and stops short of everything is a pole planted in the bed (S1:
>   60 px long, ending 40–60 px under the nearest bridge post). Check the post a note names against the structure's own
>   `bays`. *(t8, second pass start)*
> - **Named owners and range owners can split a group at a range edge.** On S1 t2 named the sedan party, but one
>   porter's feet were at 31130, in t3's range. Give the stray member's points in the group's note and the report, so the
>   merge adds him. *(t2)*

## 4. Trees (skill `scroll-section`, "Mapping a section", the tile role)

> - **Count a grove at three levels:** a horizontal strip through the trunks (count the bands), the feet zone (roots, and
>   where each band meets the ground), and the crown band (follow each band up to its head). A trunk that stops at a roof
>   line is a tree behind the house with a placeholder base. *(t5)*
> - **Two contour lines are one trunk:** a pair of parallel dark lines 20–25 px apart with a pale middle is one trunk, not
>   two thin ones. Two stems from one root spread are one tree (name the stems in `what`). Two stems whose lines
>   converge below a hiding crown are one tree; a stem that joins another tree's crown is its branch. *(t4, t5)*
> - **Crossing trunks: follow each outline from its foot,** at zoom 1.5 over the whole height, and record one tree per
>   foot. Where two trunks meet and one carries on, give both readings of which top belongs to which foot; the feet don't
>   change, only the heights. *(t7)*
> - **Far groves behind big crowns:** count trunks at zoom 1.6–2.6 on a raised-contrast greyscale crop; at zoom 3 the
>   faint far trunks dissolve into the weave. When every far foot is hidden, take the foot line from the trunks of the
>   same grove that show the lowest end (S1: three trunks ending at v 640–657), put every hidden base on it `est`, and
>   say which tree then looks too big. *(t4)*
> - **A pale tree behind a dark one is a separate, further tree,** not a limb (S1 36465): record it with `est` and the
>   visible stretch in `note`. **A pale crown with its own convergence point is its own tree:** trace each fan to where
>   its shoots converge; two convergence points 100+ px apart are two trees. *(t8, second pass farms)*
> - **Interlaced pollard willows:** assign whips only near the heads, mark the crown's top and extremes `est`, and give a
>   high fan with no head of its own to the tree whose head it rises from. Two boles that touch are two trees when each
>   has its own foot and its own pollard head. *(t3, t4)*
> - **Read one painting idiom the same way across neighbours.** On S1's dyke the painter draws exposed willow roots as
>   pale-topped lobes with dark knobbed edges, which look like small rocks; one tree's lobes were mapped as roots and the
>   next tree's left open. Compare the neighbouring case at the same zoom and give both the same reading. *(second pass
>   willows)*
> - **Measure "rows of small plants" against a figure before leaving them to the field.** S1's 菜地 "rows" have trunks
>   90–180 px tall beside 145 px adults: they are 13 young trees, not crops. *(t1)*
> - **A tree on a stream bank can stand on its top, its face or its foot.** Compare the foot's v with the bank's
>   `bank_top` and `bank_foot` at that u (read the structures agent's part), and give the support and both v in the
>   note. *(t7)*

## 5. Ground, water, buildings and roads: the countryside pilot (skill `scroll-section`, "Mapping a section", the structures role)

> - **Read ink-wash ground by its visible faces.** A dark wash band you can see faces the viewer, so the ground steps down
>   toward the viewer across it. Record `bank_top` on its sharper upper edge and `bank_foot` where the band fades,
>   higher side north unless a figure or trunk says otherwise, and its height as the band's depth in px. Tongue-shaped
>   wash strokes pointing into blank silk are spits or land tongues. *(structures_e, structures_w)*
> - **Anchor water on what stands in it** (bridge posts' feet, a lying boat), and extend it only as far as the same blank
>   silk runs. Record the rest as `water` with `conf: low` and both readings in the note: the restyle dries every wash
>   band, so it cannot help. *(structures_e)*
> - **A stream's support comes from a deck that meets the banks level:** take the deck's edge and a post's foot straight
>   below it (S1: 52–58 px, H ≈ −0.7 m). *(structures_e)*
> - **In a farmstead, crossed short hatching under a smoother roof wash is a brushwood fence or hedge** hiding the walls,
>   not more thatch: put the eave at the change of texture. Rounded leaf-dab clusters with no uprights are bushes.
>   *(structures_e, second pass farms)*
> - **Roofs seen gable-on recede.** A small gable vent at the top with the thatch sweeping down both sides means the
>   house's long axis runs back into the picture: give its placeholder footprint more depth than its width suggests, and
>   say so. *(structures_e)*
> - **A hip is not a receding edge.** A hip's corner line runs at 45° in plan. Use only eaves or ground lines that run
>   along a building's side. **Read a long horizontal line above a roof at zoom 2 before calling it the ridge:** on S1's
>   stall the line 60 px above the ridge was a far field bank. *(structures_w)*
> - **Copy the neighbour's road points first, then read your own,** and check `gen/map/<neighbour>/parts/` again just
>   before writing the road. When the structures unit is split in two, write the join piece early, split your bands the
>   way the neighbour split them, stop your ground lines at your ownership boundary, and list the ID pairs at the join.
>   *(structures_w, structures_e)*
> - **Count the painter's diminution from the tile agents' parts** (a short script over `pts.foot` and `pts.head`) when
>   the structures agent finishes after them: S1's foreground figures are 1.8× S4's road figures, so one section's "road
>   size" is not another's. *(structures_w)*

## 6. The merge and the second pass (skill `scroll-section`, "Mapping a section", step 2)

> - **In the countryside, duplicates in disguise change kind.** The same strokes came back as a rock and a prop (S1
>   29745), a building and a prop (a dome: a small roof or a haystack, 34080), a structure and two "trees" (a bush belt:
>   a hedge or a brushwood fence, or hedge shrubs), and a figure and a structure's post (35108). The tool's near-duplicate
>   check compares one kind only, so compare every "left to" pair across kinds by place, and keep the record whose
>   geometry the builder needs (a line for a belt, base corners for a rock). *(merge, second pass farms)*
> - **Make one rule for a recurring small thing across tiles in the tile brief:** nests, birds, moss dots, silk creases.
>   One tile recorded a nest as a perched prop and the next put three nests in its trees' notes; the merge made all four
>   props. *(merge, t6)*
> - **Things each side left to the other hide where a shed meets open ground, and where two tiles name the same strokes
>   in notes.** The forked pole on the threshing floor was "a prop" to one unit and "the shed's post" to the other; the
>   fans at the top edge above the chase field were named by both neighbours and mapped by neither (a small far tree).
>   Search every "left to" and "not used" note for strokes both neighbours mention. *(merge, second pass west)*
> - **After the merge, test the route against the ground points.** List every tree and prop base between the route's
>   `edge_n` and `edge_s`. In S1 nine trunk feet stand in the road strip in front of the farmsteads, because the only
>   level ground there is the trees' strip; the walkable line is then the lead's call, not a stroke reading. *(second
>   pass farms)*
> - **Keep `merge_fixes.mjs` idempotent through the second pass:**
>   - rename references before writing MERGE notes that name the retired IDs, and make the rename skip the entity that
>     takes over the ID (S1's `renameRefs` made two notes say their own entity was retired);
>   - a second-pass `replace_in_note` that rewrites a MERGE note must stop that note being added again (`noteOnce` checks
>     a prefix, so the next run doubled it);
>   - test both ways after every edit: run twice, and rebuild from the units' original parts; both must give the same
>     files. *(frame, second pass farms)*
> - **Vet and apply proposals by path.** Check every proposal's `was` values and replaced note strings against the merged
>   map before applying (S1: `vet.py`). Apply `set` keys as deep paths (`pts.base.se`, `pts.lines.ridge_n`, `null` to
>   delete a point, `(append)` to extend a line): a setter that knows only top-level `pts` keys writes `pts["base.se"]`
>   silently. *(frame)*

## 7. The frame (skill `scroll-section`, "Mapping a section", step 3)

> - **The countryside may have no ground-level receding edge at all.** In S1 fences, hedges, banks, field lines and
>   sheds all run along the scroll; the only diagonals are hips, paths running across the ground, a lying barrow, a
>   sedan's poles and a farmhouse painted turned 45°. Say so in the receding-edge table with each rejected candidate and
>   its slope, and **hold the neighbour's seam knot to the end** (no ramp, nothing stretches). In the questions, say in
>   metres what the alternatives move at the silk's top and on the route (the neighbour's other option, a frontal dx 0,
>   a weak candidate), and have the frame script read the seam value from the neighbour's frame, so the lead's choice
>   there carries over with one rerun (S1 holds S2's −51.6). *(structures_w, structures_e, frame)*
> - **A ground line drawn on the water's shore stands on the water's support.** Compare every `grd` line's points with
>   the water entities' shore lines (S1: `coincide.py`). Give a bank whose foot is the shore `support_by {bank_foot:
>   <water>}`, give a land tongue whose both edges are waterlines the water's support, and leave a near bank's top on the
>   ground (the water then lies 1.05 m north of it, the slope between). Otherwise one stroke maps to two places 1.05 m
>   apart. *(frame)*
> - **A thing on a bank face gets its H from where its foot sits on the face:** H = H_water · (v_foot − v_top) /
>   (v_water − v_top) at the foot's u. With a generic half-way `bank slope`, S1's tall elm, drawn 10 px above the
>   waterline, mapped inside the stream. When only those things use the support, an `H_profile` in u carries the
>   per-foot values. *(frame)*
> - **Copy the neighbour's seam points on every run, lines as well as the route.** A ground line split at the seam (S1's
>   far field line, 2 px off S2's) takes the neighbour's exact end point in `merge_fixes.mjs`, read from its strokes.
>   *(frame)*

## 8. Setup (skill `scroll-section`, "Adding a section")

> - **Keep a restyle unit to about 2.6:1 or less.** The image model letterboxes an overview wider than about 3:1: S1's
>   whole area (8720 × 1792, 4.9:1) asked `4096x848` and came back 4096 × 1695 with white bands, so every tile's colour
>   crop was the wrong area and nothing registered. Split a wide area into halves nested in its folder
>   (`countryside/west`, `countryside/east`, overlapping 272 px), and never run the pipeline on the parent alone.
>   *(setup, `sections/countryside/notes.md`)*
> - **Redraw a tile that paints a street into empty silk once or twice, then stop and warn the tile agents.** S1's
>   tile above the great willows invented in all three draws; the prompts are the user's call. *(setup)*

## 9. Tool notes and requests (for the lead; not skill text)

- `tools/scroll_pipeline.mjs` `cutOverviewCrops()` scales both axes by the width ratio, so an overview that comes back at
  another aspect gives every tile the wrong colour crop. A check that the returned size matches `overview.size`, or
  separate x and y ratios, would have caught it (S1 and S2 both lost a run). *(setup)*
- `node tools/scroll_map.mjs <S> overlay --help` is not help: it renders the whole section into `gen/map/<S>/`. Always
  pass `--out` into your scratch folder. *(t6)*
- Pose words `running` (three grooms) and `galloping` (the runaway horse) are not in `map/README.md`'s list. *(merge,
  frame)*
- In the agents' zsh, `set -- $var` does not split words: run multi-crop loops under `bash -c '…'`. *(t1)*

## 10. The needs step (skill `scroll-section`, the playbook's needs step; skill `characters`; `trees/types.md`)

> - **In the countryside the needs list is mostly trees, ground and the area's own kit.** Classify every tree by form
>   with a short script over the map's `what` (the tile agents name the form there), read the doubtful ones, and give
>   counts by form with their mapped heights. Flag every form whose mapped heights pass its cards (S1's great willows are
>   10–17 m against `willow_burl`'s 8–10 m cards) and every grove where one form repeats within a few metres (eleven
>   bare elms in 17 m in front of S1's farmhouses): those are the new cards worth asking for.
> - **Look for the free route before a new character or body.** S1's two travellers in wind hoods (迎寒策蹇) are a hood
>   prop (`wind_hood`) on existing characters, not a new character; a water buffalo is the ox's body with a dark `tone`
>   and a kit-built horn piece on the head bone before it is a 15-credit Meshy body. Say the paid fallback in the same
>   line.
> - **Cast by the look, not the name.** The soldier's belted long jacket and cap fit a farmer; the camel driver's indigo
>   mantle fits a hooded rider's cloak and an indigo-tinted cloak. Read each character's look in `characters/notes.md`
>   against the figure's `what`.
> - **Follow the lead's precedents already in the people files:** carried sedans are built carried and do not move, and
>   their bearers play `sedan_carry` in place (`sections/outer_road/people.json`, the lead, 2026-10-12).
> - **Give the factories crops they can use:** a gridless, contrast-stretched scan crop beside the registered restyle
>   (`S1_needs/crop.mjs`), named in the line with its rect, and read each crop before you cite it.

## `trees/types.md` (record)

- A new form for the young trees of a planted plot, **`sapling`**: a thin dark trunk with a small twiggy angular crown,
  1.1–2.7 m (S1's 14 young trees of the 菜地).
- `willow_burl` needs bigger cards for S1's dyke (10–17 m, roots spreading like rocks, a hollow bole leaning hard
  north-west).
- The far crowns at the silk's top edge (S1 30860, 30985) are dark knotted blotches of far shrubs, 0.3 m painted.

## 11. Finishing after a restart (Run 3, the S1 finisher; skill `scroll-section`, "Area agents" and "Machine resources")

- **Walks and shots written before the set pieces and the ground land go stale.** S1's were written at 13:16. The kit
  agent then built the hall 3.6 m deep into the painted road, and the ground agent lowered the shores and the dyke,
  so 11 of 50 walks and 3 shots failed. Rerun every walk and shot after the last build and rewrite what the build
  moved, saying why in each `why`.
- **A plan view of the built colliders answers a failed walk quickly.** Read the raw GLB's `__col` meshes, the water
  strip and `g_edge_shore_hidden__col`, and draw them with the walk traces as a small SVG through sharp (about 900 px).
  It shows whether a walker is stopped by a wall, a body, a slope or a stale route, with no 3D shots.
- **A building's hidden depth must be checked against the painted road behind it.** Where the road's edge is the
  building's mapped back, the depth choice decides whether the road stays walkable.
- **Casting scripts should honour the workshop's verdicts by themselves.** S1's `make_people.py` reads
  `workshop_progress.md` in order: "NOT TO USE `x`" bars a clip, and a later "**PASS `x`**" lifts the bar. A take
  barred after review then never plays, and a passed retake plays on the next rerun.
- **`people_check`'s ground band is absolute (−0.5..0.6).** Sections whose built ground dips (S1's road under the
  dyke at −0.6) fail it while every walker is on the ground. Check the path heights against the built ground before
  calling it a defect.
