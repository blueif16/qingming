**Merged, 2026-10-12 (round-2 records agent):** Run 1's setup, reading, structures, merge and frame lessons into
scroll-section "Mapping a section" (steps 1–3) and "What round 2 taught about reading the strokes"; the needs lessons
into the playbook's needs step and characters "Casting a big section"; Run 2's into web-scene "Building a new
section", the Backdrop and KTX2 rows and "Before shipping", characters "Casting a big section", scroll-section
playbook step 5 (people_check spots) and "Machine resources" (pkill), 2026-10-12. Left out: the `woman.json` record
(in `NEXT_SESSION.md`); the `trees/types.md` record (the tree factory made `willow_weep_1`); the page tools hard-coding
9223 (superseded by `CDP_PORT` and the Chrome slots).

Round 2, S7 Run 1, merged from the units' reports by the needs agent, 2026-10-12.

# The scroll's end (S7): lessons

Every agent of S7's mapping wrote its lessons as exact text for the skills. They are merged here by the skill and the
step they belong to, duplicates joined, each with its source report. The records: `gen/map/S7/reports/` (setup, t1, t2,
structures, frame), `gen/map/S7/merge_notes.md`, `gen/map/S7/second_pass/all.json`, the needs list
`gen/expand/city_end_needs.md` and the Run 1 report `gen/expand/round2/city_end_run1_report.md`.

## Skill `scroll-section`, "Mapping a section", step 1: the setup and the tile brief

(setup)

- **Check the seam list against the neighbour's strokes before briefing.** The neighbour's notes often settle a
  question the area brief still asks (S7: S6 had already measured the 解 plaque at u 2005–2058; the brief's u
  1955–1990 was 50 px off and would have sent two agents to look for it on the wrong side of the seam).
- **Give a scene that straddles a tile boundary to one tile, by name,** instead of trusting the main-point rule: a
  procession (rider, horse, attendants) and a shop's free-standing boards both sat across S7's t1|t2 boundary.
- **The restyle drops small dark animals** (S7: a bird on a roof slope) as well as adding things: list them in the
  warnings so a tile agent records them from the scan.
- **A lead's density estimate is not a quota** (t2): S7's t2 was estimated at 20–25 figures and the strokes have 12.
  Tell the tiles to walk their range twice and report the honest count.

## Skill `scroll-section`, "Mapping a section": reading the strokes (tile agents)

- **Read through collectors' seals with the red channel** (t1). A crop of the scan's red channel only (sharp
  `extractChannel('red')` then `normalise()`; script `scratchpad/S7_t1/cropred.mjs`) makes vermilion seals nearly as
  pale as the silk while ink stays dark, so trunks and limbs under a seal can be traced. **A seal's straight border is
  not a trunk:** the restyle painted one there on S7.
- **Read the points on the gridded crop and the shapes on a raw one** (t1, t2). The grid hides thin outlines. A raw,
  contrast-normalised crop (`sharp(...).normalise()`, low saturation, zoom 3–4; `scratchpad/S7_t1/crop.mjs`,
  `scratchpad/S7_t2/enh.mjs`) showed that a pale shape was a sack tied at the neck below a man's sash, not his robe,
  and separates a faint child's face from robe folds better than the plain scan or the restyle. CLAHE amplifies the
  silk weave and hides it. Above zoom 4 the scan only blurs, except for writing and edges (below).
- **To settle a faint extra figure, look for a closed head** (second pass): hair wash, a face, a chin line, at zoom 6 in
  greyscale. Long parallel strokes running unbroken from waist to hem are robe folds: S7's "second child" at the
  doctor's was folds.
- **The restyle turns objects into people** (t2): at S7's well it painted a hooped bucket as a child, and in the shop it
  added a second child. Hoops, bails and lids on the scan decide. A person the scholars expect but the strokes only
  hint at gets its own entity with `conf: low` and both readings.
- **Check a "second crown" for a trunk before you record a second tree** (t1). A willow limb can arch 300 px over a
  roof (S7: from u 930 to u 1232). If no trunk shows between the crown and the ground, it belongs to the nearest trunk,
  and the note says so.
- **Count bottom-edge trees by the trunks that cross the silk's edge** (t1); shoot masses without a drawn trunk are
  recorded once each, with their convergence points in the note (S7: one trunk and one shoot mass in u 815–1450).
- **A rider on a mostly hidden horse** (t2): settle the horse's facing from the rider and the people at its head (where
  he sits on the visible body, which way his boot in the stirrup points, where the groom stands). Then give fore, hind
  and head `est` from a body length of about one standing figure's height. Write which strokes were taken for the
  horse and which readings were rejected (S7: a pale outlined oval was the hindquarters, not a load or a horse facing
  the other way).
- **Shop-board characters below the scan's resolution** (t2): on the 38414-px scan a board character is about 15 px and
  does not resolve at any zoom. Count the character marks along the board, copy each as □, and put the scholars'
  readings in `note` as readings, not as strokes. Never take characters from the restyle: it paints blobs.
- **A small box's "peak" or "lid" may be its top's receding edge** (second pass). In this oblique view a box's top
  shows as a parallelogram whose side edge rises up-right at about the receding slope (−0.8 on S7). Before you record a
  gabled lid, look for the second, falling slope.

## Skill `scroll-section`, "Mapping a section": the structures agent

(structures)

- **Sort a stack of roofs by their ridges.** A double line with tiles on both sides, often with an ornament at its end,
  is a ridge. The next ridge down marks where the roof in front stops. A ridge that runs up-right in the receding
  direction is a hall running back (north-south). S7's top half was six roofs in depth order, which first read as two.
- **Read writing with a sharpened greyscale zoom** (sharp: `greyscale().normalise().sharpen()`, zoom 5–8) beside the
  grid crop. A "horizontal board" under an eave may be several tablets hung between bracket sets (S7: 趙 · 太 · 丞 · 家),
  and the clusters between them are ornaments, not characters.
- **A building south of the street hides its own street wall behind its roof.** Estimate the wall foot from a measured
  eave height on the same building: a post under the eave, from the eave to its foot. S7's 解 building: eave corner
  (2000, 1360) + 211 px puts the wall foot at v ≈ 1575, 275 px below the visible roof line. Keep the road's edge at the
  neighbour's convention, and put both readings in the notes and a question for the lead.
- **Give roofs-only footprints one stated rule:** frontage from the visible ridge or eave ends, a depth band ordered by
  the ridges' v, corners shifted by the frame's dx. Write the rule in every note so the builder can redo them as
  `choice:`.
- **Check the neighbour's notes against the strokes at the seam before writing seam notes.** S6 put a house's west end
  57 px too far east, read a pale mass's top line as a wall foot, and called a building's eave post an awning post.
- **Ground-level receding edges can be scarce** where a street is lined with open fronts and roofs: blocks, bench seats
  and a board's feet were all S7 had. Say how few there are, and compare them with the high lines. In S7 the high lines
  are steeper than the ground ones, the opposite of S4.

## Skill `scroll-section`, "Mapping a section", step 2: the merge and the second pass

(merge; second pass)

- **Compare the "left to" lists thing by thing, and look for the same thing recorded twice under different kinds.** On
  S7, each unit left two things to the other: the 解 eave's leaning poles and the stones at the railing's foot. Two
  more were recorded by both units in different forms: the gate passage's partition (a tile's prop and a building
  part), and a small shape at the gate's door leaf (a tile's figure and a building's lamp). Settle each on one zoom-3
  crop. Keep one entity, and let the other name it by ID.
- **Check for duplicates across kinds, not only within one kind.** The merge flags things of the same kind under 30 px
  apart. On S7, one unit read 20 px of strokes as a structure (a second gate block) and the other as a prop (a box with
  a peaked lid). Both survived the merge. List every pair of entities of different kinds whose points lie under 30 px
  apart, and look at each pair that isn't an obvious neighbour on one zoom-6 crop.
- **Check a unit's road edges against its own footprints.** S7's `edge_n` cut through the shed the same unit had just
  mapped, which put half of the shed in the street.
- **A prop's base behind a building's back wall is a red flag.** Check which drawn line is the prop's foot. S7's back
  counter had its base on its top rail, 1.1 m behind the wall.
- **Measure short receding edges from the pixels.** Trace the lower boundary of the stroke per column (3×3 mean below
  a threshold) and fit a line. On S7's gate block, two eye readings of one 30-px edge gave −0.80 and −1.08; the trace
  gave −0.87 over the whole foot and −1.10 over its straight front part, where the line bends at the jamb.

## Skill `scroll-section`, "Mapping a section", step 3: the frame

(frame)

- **A knot from one short edge needs its scatter.** Trace the edge from the pixels and give three numbers for it: the
  whole edge, its straight part and its recorded corners. S7's gate block gave 58.9, 46.5–49 and 64. Weight a second
  edge by its length and height. Then check the knot against a mapped wall's direction (S7's block: 87° with the knot,
  80° without), and put what dropping the knot would move into `questions`.
- **Settle a disputed furniture edge at zoom 7 before you count it.** Two units read one bench's seat edge as −0.88 and
  −2.8. The drawn line was the steep one: the bench is drawn from above, as wells and plank platforms are.
- **A placeholder's est back corners carry the dx they were drawn with.** When the frame's knots differ from that dx,
  those footprints come out skewed in the world (S7: 2–6°). Say so in `questions`, so the builder squares them as a
  `choice:` rather than building the skew.
- **A roof bird's H, as S4's "perched":** take the bird at the mid-depth of its roof's footprint, so
  H = (v_ground(D_mid) − v_bird) / 77. Then check that H lies between the roof's eave and ridge in the frame's one
  scale.

## Skill `scroll-section`, "Expanding to a new section": the needs step

(needs agent)

- **Check a character's model crop against the map before casting from it.** The `woman` character's `figure` crop
  `[1575, 725, 1655, 905]` is S7's doctor (`S7.fig.doctor_dark_robe_1615`, a man in a dark knee robe over pale
  trousers), not one of the women beside him: the workshop picked it before S7 was mapped (its id is even
  `woman_zhao_taicheng_1615`, the doctor's u). Give a new
  character's model as a map ID, and cut its crop from that figure's head and foot points.
- **Cast by dress against the map's `what`, and spread look-alike neighbours over different characters.** Two figures
  side by side in light robes with top-knots (S7's gatekeeper and the man at the post) as one character read as twins:
  the bearded one went to `robed_man` (its model's own look), the other to `idler`.
- **Name each new action once, with who plays it and its stand-in.** Local retargets (`t2m:`, `from:`) are free, so a
  take costs 10 credits once whichever rig plays it. List the free `from:` retargets separately, so the catalogue
  counts only the takes.
- **List what the finished areas' kits already have against each need.** Later builders import them read-only
  (`outer_road_scene.py` imports `kit_inner_city`): S7's benches, counter, leaning poles, hip-gable roofs, blind and
  rail fence exist there. The factories then make only what no kit has.
- **Look at each willow before giving it a form.** `trees/types.md` says the painter's willows never hang in curtains;
  S7's cut-edge willow does (long whips hanging from a limb arched over the gatehouse). A new form is cheaper than a
  wrong card at the scroll's last landmark.

## Skill `characters` (record)

- `characters/woman.json` `figure` should name a woman: `S7.fig.standing_woman_1567`, crop `[1545, 712, 1595, 895]`
  (the current crop is the doctor; see above). The character itself reads as a Song woman and plays S7's women.

## `trees/types.md` (record)

- Add a form for the hanging willow (`willow_weep`: `S7.tree.willow_edge_855`), and qualify "they never hang in
  curtains" to S4–S6: at the scroll's end the painter hangs a willow's whips.

# Run 2 (build, people, checks; 2026-10-12): lessons

From the S7 area agent and its kit, casting and QA agents (`gen/expand/round2/city_end_run2_report.md`). Exact text for
the skills, by skill and step.

## Skill `web-scene`, "Building a new section"

(area agent)

- **Write the stub kit yourself, first, as the contract.** Put every new part's signature and docstring in
  `blender/kit_<folder>.py` with plain stand-in bodies, build the whole section against it, and brief the kit agent to
  replace the bodies in place, keeping every signature. The kit agent develops in its scratchpad copy and installs
  only whole, importable files (`python3 -m py_compile` plus a review run), so the area agent's headless builds never
  import a half-edited kit. S7: the stub build ran first time, and the kit agent's 17 parts dropped in without a
  builder change.
- **Have the builder write a solids map for the casting script.** Record which owner added which colliding faces (a
  `Buckets` subclass that remembers `(owner, bucket, first face, last face)` on `add`; `placed` transforms the vertices
  in place at exit, so read them after the build), sample every colliding triangle at about 0.05 m, and write the
  0.1 m plan cells where colliders stand at body height (0.15-1.6 m) per owner, with the seats (non-colliding, their
  tops) and any opening a figure stands in (`gen/sections/city_end/solids.json`). The casting script tests every
  spot, path and animal body against it: footprints miss the low colliders that stand a figure on top of them (a
  sack, a block, a tub).
- **A perched animal sits at its mapped H; build its roof to meet it.** `people.js` puts a `perch` animal (the bird) at
  the layout's H whatever is built under it, and a recorded move can't change H. When a hall painted small is built at
  real size, its slope at the bird's spot comes out higher than the frame's H (S7: 4.0 m against 3.2): move the
  placeholder wall (a choice), not the bird. S7's north-south hall's east wall went 1.7 m west, so its east slope is
  3.22 m high at the crow's painted spot; the builder prints the roof's height under the bird on every build
  (`BUILD_STATS` `bird`).
- **A placeholder footprint must fit the roof the map names.** A hip-gable (歇山) or hipped roof needs the ridge's
  length longer than the depth (`song_kit.hip_roof` puts the ridge's ends at `x0 + d`, `x1 - d`; with the depth
  greater, the ridge folds back on itself). S7's hip-gable building was a 3.0 m × 5.1 m placeholder with an
  east-west ridge: built 5.25 m × 3.04 m, its hidden west end carried west into the trees, as a recorded choice.
- **Trees estimated at the silk's bottom edge can land inside a building that runs off it.** Test tree bases against
  every footprint before building, and move the tree along its receding line (straight south in the world: a
  `dD` move) past the building's south eave, recorded; the building keeps its painted extent. S7: two twig bushes
  0.9 m south of the 解 building.
- **A building at the seam owns its overhang past the seam.** S7's 解 building's north-east eave reaches about 1 m
  into S6's ground, as painted (the 解 board leans on it there). Build it whole in its own section; the neighbour's
  props that lean on it are a seam note (where the neighbour's builder should put them), never a second model.
- **No panel where the neighbour is always in the window.** With streaming, the section you stand in loads with one
  neighbour each side, so an end section's only neighbour (S7's S6) is always loaded with it: no panel is needed on
  that seam (alone or at `?window=0` the seam shows mist). Write it in `backdrop.json`'s `about` and ship it with
  `panels: []` (`node tools/backdrop.mjs <folder> ship` copies it to the page).
- **Stale texture copies after a re-export.** A section's sign atlas redrawn between two exports leaves its first
  `tex/signs_<folder>.<hash>.webp` (and its KTX2) behind, and `ktx2.mjs encode` encodes it too. After the last export,
  check which hash the GLB names (`strings web/public/assets/<folder>.glb | grep signs_`), delete the stale pair (files
  only, never a folder under `web/public/`), and run `encode` again (it drops the orphan) and `check`.
- **The page tools are fixed to the bench Chrome (CDP 9223).** To check on your own Chrome, start a second Windows
  Chrome with its own profile on another port (`scratchpad/S7_run2_qa/chrome.sh`, port 9241) and run copies of
  `shots_page`, `walk_page`, `people_check`, `film_page` with the port from an env var, `ROOT` set to `qingming/`, and
  `node_modules` and `package.json` symlinked from `tools/`; `budget_check.mjs` already takes `--cdp`. (For the lead: a
  `CDP_PORT` env var in the four tools would save every area this.)

## Skill `web-scene`, "Section kits"

(kit agent; exact text)

- **Sign faces on lozenges:** map the cell's mid-edges to the diamond's corners and draw the character upright in the
  square cell, with the lozenge border along the mid-edges. The character stands upright with no rotated drawing.
  Build every sign face with its bottom-left vertex on the viewer's left: the face's right vector `sd = (-f.y, f.x)` is
  the viewer's right. `kit_inner_city.eave_plaque` starts at `+sd`, which is the back face, so it reads mirrored.
- **Cells keep their drawn proportions:** draw each board's cell at the builder's real width / height, put the ratio
  in the atlas JSON (`aspect`), and give callers `cell_aspect()`. Tile a pattern cell (`curtain_motifs`) over a face in
  an n×m grid of quads instead of stretching one quad: a 3:1 cell on a 2.3 × 3.4 m panel stretched its motifs 4.4×.
- **Frames as mitred rings:** a frame is one ring prism (outer and inner ring with depth, 24 tris for 4 sides;
  `kit_city_end._frame_ring`) instead of four overlapping beams (48-112). Members square to the caller's frame
  (`_member(p0, p1, side, w, h, c)`) avoid `k.beam`'s world-fixed section on rotated parts.
- **Thin round things circumscribe:** a 16-sided hoop or lining round a 21-stave body needs radius / cos(π/16), or the
  staves poke through its flat sides.
- **Painted shapes in painted units:** the tie over the hall's doorway is measured in door widths, so a doorway built
  taller than painted keeps the painted curve.
- **Review per instance:** wrap each call in `sb.entity("review/<n>")` (the innermost entity wins) to get triangles per
  instance from `B.tris`. A 17-part review (EEVEE + Freestyle, two views each) takes about 25 s in one slot.

## Skill `characters`, "Casting a big section" and "Routines"

(casting agent; exact text)

- **Seated clips move the body off the figure's spot.** people.js stands a seated figure at its feet (the ground ray),
  and the sit clip puts the hips behind them. Measure the clip on the web GLB in Blender: the Hips and ToeBase bone
  heads over the clip. Then nudge so the hips sit on the built seat (the builder's solids.json `seats`), and check the
  seat's top against the clip's seat height (the hips joint minus 0.1 m). Measured: the woman's `sit` (Meshy 32) puts
  the hips 0.58 m behind and 0.18 m left of the feet point, seat 0.56 m, toes 0.33 m behind. The library sit 33 (elder
  and others) puts them 0.32 m behind and 0.17 m left, seat about 0.51 m. The official's `sit_talk` puts them 0.27 m
  behind and 0.14 m right, seat about 0.62 m.
- **A prop bound to one clip can ride another only where its bone holds still.** Render it with `char_props.py review`
  at several times. To hold a figure in a clip's calm opening, use a step of `[clip, 1]`: people.js restarts the clip at
  a random point of its first 3 s at every step. The S7 woman's `child_in_arms` on `sit` uses this.
- **Test spots against the builder's collider cells (`solids.json`), not the footprints.** A figure standing in a low
  collider, such as a sack, a block or a tub, is stood on top of it by the ground rays at its spot and ±0.12 m in X.
  Built props that don't collide (buckets, furniture) still need a body's clearance.
- **A figure whose wanted character can't hold the pose is cast as a pose fallback, not a stand_in.** world.js plays
  `character` whenever it exists, so write the fallback as `character`. Keep the wanted character in the script
  (`POSE`) so it comes back by itself when any of the pose's clips lands.
- **A head painted at an opening gets its estimated foot on the wrong floor line.** Place it from the builder's
  opening, using the passage range and the door leaf's hinge and swing, not from the estimated foot.
- **The builder sizes a seat to the clip, not to the painting, and records it.** A bench painted 0.35 m high under a
  woman whose `sit` seats its hips at 0.56 m makes her hover: S7 built it 0.55 m as a choice.

## Skill `web-scene`, checks (QA agent, exact text; the area agent's additions in brackets)

- "Every `scene.json` view and spawn stands inside its own section's painted area, not past the seam: on
  `?sections=<name>` a spawn 0.3 m past a seam starts outside the edge wall on the ground's last strip and falls off.
  Walk 1 s from each view alone (`walks.json`)." [S7's seam slants (u 2000 recedes at dx 50.4): test a view against
  the seam line at its own D, not against the seam's X at the street.]
- "A section without `trees/assign/<S>.json` draws every tree on the default willow card (S7 shipped nine willows):
  assign every mapped tree a card and run `tree_cards.mjs check` before the first export." [When the assignment is a
  factory's file, put a proposal in the section's own folder and name it in the report.]
- "Walk into every painted prop nobody sits on (benches, stands, sacks): kit benches and stands collide only by their
  legs or not at all, and a low sack is a step the walker climbs. Give each a hidden collider box."
- "A seat's long side faces where the sitter faces: a figure sitting along a bench's length puts its shins through the
  seat."
- "Two grounds that both undulate ±5 cm don't stay one under the other: an older section's ground running past its
  seam pokes through the new one in patches. Clip it at the seam when the neighbour is built."
- [A ground cut by a slanted seam stair-steps when whole 1 m cells are kept or dropped by their centres: keep every
  cell that reaches west of the cut line, move every vertex past it onto the line, and drop the triangles that
  collapse (`city_end_scene.ground`).]
- [`people_check`'s road spots must lie on a painted walker's actual path (read `people.json` `walkers[].path`), not
  beside his spot: a spot 0.8 m off the porter's line failed "nobody went round"; one on it passed. Pass `--into` a
  figure of the section: the default is the gate's.]
- [Never `pkill -f` a pattern that also matches your own command line: `pkill -f "vite --port 5191"` killed the shell
  that ran it. Stop a dev server by its PID (`ss -ltnp | grep :<port>`).]
