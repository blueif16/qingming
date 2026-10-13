---
name: scroll-section
description: Restyle a section of the 清明上河图 scroll into the qingming art style, with the scroll as ground truth for where every person and object sits. Use when adding, regenerating or reviewing a scroll section, or after editing anything in qingming/prompts/; and map a section: every building, tree, person, animal, boat and object measured from the strokes into the scroll map (map/, read as text), which every scene takes its positions from, including rivers, boats and arched decks. Also the playbook for expanding the walkable world: many areas mapped at once by the map-round2 workflow (tile, structures, river and bridge agents, frames in order along the scroll), then area agents and factories build them.
---

# Scroll section pipeline (qingming/)

**Goal.** Get reference images that show what each section looks like in our style. The scroll fixes the layout: every building, tree, person, animal and cart stays where Zhang Zeduan painted it. B1's style supplies the look. The model fills in the detail the silk has lost.

These images are references for the 3D build. They are not the build itself.

## Pieces

- `qingming/sections/<name>/section.json` defines one section:
  - the scan rect `[x, y, w, h]` in the 38414×1800 scan;
  - the model;
  - the style image;
  - the prompt names;
  - the tile grid: `src` px per tile, `overlap`, and output `size`.
- `qingming/sections/<name>/notes.md` is the section's record, written in prose:
  - what the section covers;
  - each run, with its date, what changed and the scores;
  - review findings and open issues.

  Update it after every run.
- `qingming/prompts/` is the source of truth for prompt text.
  - `{name}` inside a prompt pulls in `prompts/name.txt`.
  - `scroll_restyle` (the overview) and `scroll_restyle_tile` (the tiles) share three parts:
    - `scroll_look`: palette, saturation, early-spring trees, clothing colours;
    - `scroll_layout`: the position rules;
    - `scroll_detail`: what to restore from the silk.

    To change the look, edit `scroll_look` only.
  - `style_ref.txt` is the style phrase that every image-referenced asset since B1 has used.
  - `style.txt` is the original text-only style block.
  - `style_B1.png` is the style image.
- `qingming/tools/scroll_pipeline.mjs` runs the pipeline. Outputs go to `qingming/gen/sections/<name>/`.

## Units

- `overview`: the whole section, restyled once. It sets the colours and decides how each thing is drawn.
- `t_rRcC`: tiles, the smallest unit. Each tile is sent with three images: the scroll tile (layout), the overview's crop of the same area (colours) and the style image.

Each unit is cached under a key built from its prompt text, model, size and the hashes of its reference images. So:
- editing `prompts/style_ref.txt` regenerates every unit of every section the next time it runs;
- editing `scroll_restyle_tile.txt` regenerates only the tiles;
- a new overview makes all of its tiles stale.

## Run (from `qingming/`)

```
node tools/scroll_pipeline.mjs <name> status             # what is ok / stale / missing
node tools/scroll_pipeline.mjs <name> restyle --dry-run  # what would be generated
node tools/scroll_pipeline.mjs <name> all                # cut -> restyle -> check -> stitch
node tools/scroll_pipeline.mjs <name> restyle --only t_r1c2 --force   # redo one unit
```

What each step does:
- **cut**: crops the scan into the section's inputs.
- **restyle**: generates the stale units through `tools/shyfai_image.py`. It runs the overview first, then the tiles in parallel (`--jobs`, default 3, about 50 s per image). Rerunning retries only the units that failed. The key comes from `$SHYFAI_API_KEY` or the first line of `~/.shyfai_key` (mode 0600, never in the project); `python3 -I tools/shyfai_image.py --list-models` tests it, and a spent balance answers 403 INSUFFICIENT_BALANCE.
- **check**: registers each output onto its scroll input and writes `check/<unit>.jpg` (scroll | registered restyle | 50% overlay). It prints the alignment score before and after registration, plus the scale and shift it found.
- **stitch**: writes `mosaic.jpg`, the registered tiles feathered together at 2× the scan. To convert to scan coordinates: x = rect.x + px/2, y = rect.y + py/2.

Comparing runs: `snapshot <label>` copies the light review files (overview, mosaic preview, check sheets, the exact
prompts sent, alignment) to `runs/<label>/`. Take a snapshot before changing a prompt so the two runs can be put
side by side.

## Adding a section

1. Pick the scan rect from the section list in `qingming/reference/scroll/sections.md` §2. It follows 余辉's seven
   segments and the Palace Museum's 49 viewer pins converted to scan x. Its §3 records each figure group's activity
   for the gate.
   - Width and height should be multiples of 16.
   - The height is usually 1792, which keeps the scroll's bottom border out.
   - A width of 1024 + n×896 avoids extra tiles (2816, 3712, 4608, ...). Other widths work too: tiles are spread
     evenly, with at least the configured overlap.
   - The overview `size` should equal the rect size if it is no wider than 4096 px. For wider sections, use the rect scaled down to a 4096 max edge, rounded to multiples of 16.
   - **Keep a restyle unit's aspect to about 2.6:1 or less.** The image API doesn't draw wider: S2's overview, asked at
     4096 × 832, came back 4096 × 1658, letterboxed with white bands, and every tile's colour crop was wrong (S1's the
     same). A wider area restyles as nested halves, `sections/<folder>/west/section.json` and `east/` with an overlap
     (`node tools/scroll_pipeline.mjs canal/west all`; never run the pipeline on the parent folder); `sections/canal/
     notes.md` says which half to read for which u. Check the returned overview's size before the tiles run
     (`restyle --only overview`): the pipeline doesn't stop on a wrong aspect, and S1 and S2 each lost a run of tiles.
2. Copy `sections/gate/section.json` and edit the title and rect.
3. Run `status`, then `restyle --dry-run`, then `all`.
4. Review (below), then write `notes.md`.

## Review

- **Read the check sheets, not just the scores.** Registered alignment came out at about 0.43–0.52 on the gate. A unit far below its neighbours has probably moved, added or dropped things. Check its overlay, then rerun it with `--only <unit> --force`.
- **Raw outputs drift:** up to about 4% in scale and up to 35 px down per 1024-px tile. The overview barely drifts
  since `scroll_layout` added "do not shift or zoom". Registration fixes this. Always use `<unit>_reg.png` or the mosaic for positions, never `<unit>_0.png`.
- **Overlaps can ghost.** The feathered zones can show a faint second version of a figure that two tiles drew differently. For detail, read the individual registered tiles.
- **Don't drop the style image.** A text-only restyle (the style text with no B1 image) drifted and came out over-saturated in the 2026-10-10 test (`gen/sections/gate/test/`).
- **The restyle recomposes big set pieces.** Over S3's Rainbow Bridge (alignment 0.07–0.16 east of u 18800) it invented
  a second arch, moved the big boat and painted a moored boat as roofs. Where a unit scores like that, the mapping
  agents read the strokes at zoom 3 without it. A rerun doesn't fix it (S3: two runs, both redrew the arch): keep the
  better output and mark the stretch "not for positions" in the tile brief. Registration shifts that stop at 110 px
  mean the restyle drifted past the search: treat those tiles as misregistered, whatever their score.
- **Read the sheets for what changes ownership and for land over water,** not only for inventions: S3's moored boat
  painted as roofs with its crew on the tiles (the crew moves from the river agent to a tile), S2's moored hulls over a
  dry yard, S1's faintest silk painted as a street of shops in all three draws. Redraw such a tile once or twice, then
  stop and warn the tile agents in their brief; the prompts are the user's.

## Mapping a section (the scroll map)

Every position in the world comes from the scroll map: `qingming/map/` (format and rules in `map/README.md`, the
section list in `map/index.md`). It records every building, wall, road, bridge, water edge, tree, figure, animal,
cart and prop as points measured on the strokes, turns them into metres, and writes the section **in words**
(`map/text/<S>.md`). Later sessions and builders read the text map and `layout.json`; they don't re-read the scroll.
It replaced `figures.json` / `figures_world.json` on 2026-10-11 (S5, the gate, is the pilot).

1. **Inventory by tiles, with subagents.** Cut the section into tiles (ownership ranges, each looking 150 px past both
   ends) plus one agent for the structures, roads and water of the whole section. Give each the shared brief
   (`gen/map/S5/brief.md` is the template; `gen/map/S4/brief.md` and `gen/map/S6/brief.md` are filled-in ones) and
   seed figures already measured. Each writes `gen/map/<S>/parts/<tile>.json`, reads crops with a grid
   (`node tools/scroll_map.mjs <S> overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3`), checks itself with
   `overlay --parts <file>` and `check --parts <file>`, and reports edge cases. The restyle
   (`tools/scroll_inspect.mjs`) helps read faded silk, but positions come from the strokes.
   - **Restyle while you brief.** Run the section's restyle in the background while you write the tile brief: the
     tile agents need the mosaic for faded silk (S4: 9 images, about 8 minutes).
   - **Tile width follows density:** about 800 px of ownership where the scroll is open, 600 px where it is dense
     (S6: 180 figures in 3600 px, so 25–40 figures per agent).
   - **Each tile's brief names** what scholars place in its range (sections.md §2, the 名画记 pins in scan u) as hints
     to verify; the seam entities by ID and who owns which part of each; and the support names to use
     (`zhengdian upper floor`, `sedan: <id>`, `cart bed: <id>`), so heights can go in the frame afterwards.
   - **Say who records the in-between kinds;** things each side leaves to the other are the most common misses.
     Anything that stands on its own is a tile agent's prop, even when it leans on a building: signboards on posts,
     lamps by a door, stalls, awnings and canopies on their own poles, parasols. Writing, plaques and notices on a
     building, and what hangs from it, are part of the building (structures agent, in its `what`); so are scaffolds and
     pole frames on a shop front. "If unsure, record it as your prop: a duplicate is easy to drop, a miss is not."
     Every agent ends its report with a list of the painted things it saw and **left to** another agent.
   - **Read the restyle's check sheets before the tile agents start,** and warn them where it invents (S6: the
     彩楼欢门 became balconies of drinkers) and where it drops things (S7: a bird on a roof).
   - **Check the seams before briefing:** the neighbour's strokes and notes, and one wide crop across each seam (S7's
     brief put the 解 plaque 50 px off; S4b's biggest boat runs 340 px past its seam table's bow; S2's and S3's briefs
     named one trunk twice). Give a scene that straddles a tile boundary to one tile by name (a procession, a shop's
     boards, "all five trackers").
   - **Density hints are guesses, not quotas** (S4b t1: 30–35 briefed, 14 painted; S2 t3: 10–15, one; river units:
     15–25 crew, 5–15). Tiles walk their range twice and report the honest count; an almost empty tile is a valid
     result, reported with how the range was walked.
   - **One rule per recurring small thing** (nests, birds, moss dots, silk creases), and say that lines live in `pts`
     (`pts.lines` by role, or `pts.line` with a top-level `role`; outside `pts`, `check` fails "no ground points").
     Test the brief's conventions on a probe part (one boat, one crew figure, one water reach, one group:
     `check --parts <probe>`) before the units start.
   - **Start the structures agent first, or split it into two halves of the area.** S4's 800 px tiles took 27–37
     minutes each (S6's dense 600 px tiles 30–80 minutes and about 300k tokens each); the structures agent took about
     80 minutes on both (S4: 28 footprints, the road's three lines, a receding-edge table). It is the critical path.
   - **Where there is water, a river agent** (one per 2200–2900 px of river) maps everything on or in it: the
     `water` entity (`shore_n`, `shore_s` lines that stop where the silk's edge cuts them), the banks (`grd` with
     `bank_top`), landing stairs and jetties, every boat (`map/README.md`, Boats) and everyone on a boat (figures with
     `support: boat deck: <boat id>` or `boat roof: <boat id>`; each boat and its crew a group). Ropes and planks are
     part of their boat, and a far end names what it reaches by ID; trackers on the bank are a tile's figures; posts
     standing in the water's edge are the river agent's props. Tile agents map the land only.
   - **A set piece gets its own agent** (S3: the bridge agent for `S3.str.rainbow_bridge` whole, with a table of its
     deck's height, `[u, H]` about every 100 px, and how each was derived). Stalls and figures on it stay the tiles'.
   - **Every agent works in its own scratchpad folder** (`scratchpad/<section>_<agent>/`); see the playbook below.
2. **Merge.** `node tools/scroll_map.mjs <S> merge` joins the parts into `map/strokes/<S>.json` and flags
   near-duplicates in the overlaps (same kind, under 30 px). Cross-tile fixes from the agents' reports (shared groups,
   a duplicate on a boundary, a support) go in `gen/map/<S>/merge_fixes.mjs`, which edits the parts, so the merge
   stays reproducible.
   - **Seam duplicates come in disguise:** read every agent's seam list too. Two tiles read the same cart with its
     front at opposite ends (a handcart pulled west, a barrow pushed east); a donkey and a sedan passenger were
     recorded twice. Settle each on a zoom-3 crop (which way the man faces, where the handles are).
   - **Compare the "left to" lists** of the structures agent and the tile agents: what both left (S4: a plank board, a
     stair rail, a counter) is settled in `merge_fixes.mjs`.
   - **A group lists only its own section's IDs.** A link to a neighbour's entity goes in the group's `note`, and the
     neighbour's side becomes a seam note for the lead.
   - **Normalise supports** to the frame's keys: `ground: on <prop>` (base on the ground under the thing),
     `table top: <id>`, per-vehicle `cart bed: <vehicle id>`, `boat deck: <boat id>`, `boat roof: <boat id>` (the frame
     matches supports exactly or by prefix), `bridge deck`, `carried on back`, `carried in arms`, `shoulders`, `sedan`;
     a named floor (`upper floor: riverside hall`) becomes the building's own ID. Derive each height from two stroke
     points and write how it was found in the frame.
   - **Units rerun outside a workflow** (relaunched by hand after a failure) write the same part and report files;
     merge them like the others. A merge whose input lists a unit with no result checks its part file before calling
     it missing.
   - **Every unit reads its neighbours' parts before finishing** (they land while it works): a short script lists their
     entities within 150 px of its edges; each straddler is settled in both notes and the non-owner drops its copy.
     Structures agents finish last: they read the tiles' "left to structures" lists and the other half's part, and list
     every building within 300 px of their range's ends with its corners.
   - **Duplicates change kind** (a mat canopy as a building and a prop, a figure and a structure's post, a rock and a
     prop, a bush belt as a structure and two trees). The near-duplicate check compares one kind only: list every
     cross-kind pair under 30 px apart and settle each on one crop. Compare "left to" lists by u range, not only by
     name (S3: far-bank tables each tile left to the other).
   - **A straddler recorded by two units under one ID** is kept from the first part file and printed under "duplicate
     ids": drop the other copy by file in `merge_fixes.mjs`. A duplicate whose two bases disagree is settled by
     occlusion (S4b's domed canopy: its rim runs along a roof's top edge, so the base behind the roof is kept). A
     footprint prop's main point is its `sw` corner (`primary()` takes the first ground point): name its ID after
     that u.
   - **Dangling IDs:** scan every `what` and `note` for `S<n>.` IDs not in the merged map and rewrite them (S3: five
     units). A point named only in a neighbour's note is a missing entity on whichever side its main point falls.
     Read the neighbour's seam points from its strokes in `merge_fixes.mjs` on every run, lines as well as the route:
     areas merge and frame in parallel. River units' reaches meet: copy one shore point and one bank-top point onto
     both sides of every river-unit seam.
   - **Keep `merge_fixes.mjs` idempotent:** run it twice and compare md5 sums, and rebuild from the units' original
     parts; a guard tests for the exact text the fix appends; rename references before writing notes that name
     retired IDs (skipping the entity that takes the ID over); keep ID swaps out of the merge's own notes (swap only
     the text before the first "Merge:").
   - **Test the route against the ground points:** list every tree and prop base between `edge_n` and `edge_s` (S1:
     nine trunk feet in the road strip; the walkable line is then the lead's call), and each unit's road edges against
     its own footprints (S7's `edge_n` cut through a shed). A prop base behind a building's back wall is a misread
     foot.
3. **Frame.** `map/frames/<S>.json`: the scale across the street (and heights), the depth rate, and the receding
   direction, which drifts along the scroll (`dx_knots`, measured from structures' receding edges). Every number is
   derived from named stroke points or written down as an assumption; `checks` compare real-size things (railing
   height, passage width) with what the frame gives; `questions` hold what the strokes can't settle. A new section
   continues its neighbour's frame (`map/README.md`, Frames, "One world across sections"): only `dx_knots` are
   measured, the seam knot and the datum's `station` come from the neighbour.
   - Group the receding edges by area (west, middle, east) and use each group's mean as a knot; expect a scatter of
     about ±5 px/m. Check the knots against the direction of mapped walls (S6: 93° and 94.5° against 90°). The drift
     can be large (S4b's seam 31.6 px/m to 46–51 by S3's tavern): keep the seam knot and add the measured ones.
   - **Heights point by point** (`map/README.md`, supports). A support's `H` is one height; a surface that rises and
     falls along the scroll gives `H_profile`, `[u, H]` pairs read at each point's own u. A surface that recedes across
     the picture: first find which way its width lies (the bridge agent's reading) and test any keying against the
     painted heights. `H_profile_X` (`[X, H]` in world X, solved with depth) missed S3's 虹桥 by 2–3 m: the deck is
     level across the picture (the same v gives the same H), its axis runs 50.6° from east, and the tool's 8-step solve
     diverges where a deck rises faster than about 1.4 m per m of X. S3 keys it by u in bands, one `H_profile` support
     per 50 px west of the painted near edge (`bridge deck: <N> px west of the near edge`): a point takes the near
     edge's H at u* = max(u, u_s(v)), and each line or thing names its band, measured at its own v (88 deck things,
     rms 0.17 m). Compare the result with the set piece's `on_deck` and report the gap as the build's departure (S3:
     rms 1.76 m, 30 of 88 off the built deck). An entity on several supports names them: `support_by: {"<point name or
     line role>": "<support>"}` (the deck's edge lines on their bands, the abutment corners on the ground) and
     `support_ranges: [{"u": [a, b], "support": "<support>"}]` (the route's centre line where it crosses the deck).
     `world` then writes each off-ground line's point heights as `lines_H`. Check in `map/world/<S>.json` that the deck
     lines rise and fall as painted, and the deck figures' H.
   - **Every raised level gets its own support,** with the step's two stroke points: a floor (`tea house floor`,
     `upper floor: <building>`), each boat level crew stand on (`boat deck: <id>`, `boat stern deck:`, `boat bow deck:`,
     `boat after roof:`, `boat ladder:`; one river's waterline-to-deck rise runs 32–298 px; the page stands each figure
     on the level its support names), and each rider (`world()` takes `animal <id>` as the ground unless the frame
     names it: S3's two riders stood 8 m north of their mounts). Check each crewman's world D against his hull's
     waterline.
   - **The water** is the support `water`: one H for the whole 汴河, measured once (S4b's moorings) from two stroke
     points where the bank meets the water at a vertical face or a stair (the waterline and a point straight above it
     at ground level). 1 m of H moves boats and crews 1.5 m in depth, so measure at two or three places and give the
     spread. Later river sections copy it and report their own reading only as a check. Elsewhere the readings are
     bounds: a stair down to the water gives H ≥ −Δv/77 (it recedes as it falls), and a wash-drawn bank, with no
     vertical face, an upper bound on the depth; report them and keep the measured level.
   - **Every line that touches the water stands on `water`:** a bank's shore (`support_by: {"shore": "water"}`, or
     `{"bank_foot": "<water>"}`), a post in the water's edge, a land tongue between two waterlines. Otherwise one stroke
     maps to two places 1.05 m apart (0.7 × 77 / 51.25). In the world file the near bank's top must lie south of its
     shore and the far bank's north of it; a far bank's waterline must be painted at least −H_water × 77 px below its
     top, or the shore maps north of the bank top (S3's est far shores: 0.15–0.86 m). A thing on a bank face takes
     H = H_water · (v_foot − v_top) / (v_water − v_top) at its u (a generic half-way `bank slope` put S1's elm in the
     stream); when only such things use the support, an `H_profile` in u carries the per-foot values.
   - **Keep the one-scale frame** even where the painter shrinks things (S3/S2's far bank and north-bank strip are
     painted at 0.2–0.7 of the road's size, so at the one depth rate the strip is only 1.6–2.3 m deep): report each
     strip's depth and the diminution table; room to walk is a recorded move at build time (`map/BUILDING.md` rule 5).
   - **Before adding a knot, compute what it does to the plan.** With X = (u − ou − dx(u)·D)/77, a row at depth D gets
     (1 − D·Δdx/Δu)/77 m per px of u: a knot change stretches the rows north of the origin (Δdx < 0) or folds them
     (Δdx > 0) once D·Δdx/Δu passes 1 (S4b: a ramp to −57 within 340 px stretched the silk's top ×8.8; one to +97
     folded every row north of the road). Keep a ramp under about 1.5 px/m per 100 px of u, tabulate X along silk rows
     for each option (`knot_options.mjs`, in the S4b and S2 frame agents' records), and check edge directions past the
     last knot too (S2: a table's short side mapped 124–131° for 90° beside a steep ramp).
   - **Receding edges per group, per side of the road, with the sign of every one.** The painter draws neighbouring
     groups from different sides (S4b: furniture north of the road up-left, dx −50 to −62; south of it up-right, +71 to
     +119): no one dx holds both, and a mean means nothing. Keep the neighbour's knot as a stated assumption and give
     the lead each group's stroke points. Where each group agrees, the recession can turn over inside a section (S2's
     east wharf: dx +47 → −52, 王家纸马铺 drawn frontal where it crosses 0): a knot list through zero, not a
     contradiction.
   - **Which edges count:** only the short sides of things give depth (a building turned to the picture shows its
     front as X; a hip runs at 45° in plan). Read a tabletop as a parallelogram; settle a disputed furniture edge at
     zoom 7 (a bench, a well and a plank platform are drawn from above); trace a short edge from its pixels (the
     stroke's lower boundary per column, a line fit) and give its scatter (S7's gate block: 58.9 whole edge, 46.5–49
     its straight part, 64 its recorded corners), then check the knot against a mapped wall. A knot from a set piece's
     own axis can fold the plan (S3's bridge foot line read dx ≈ 90 against 30–39): keep the furniture's knots and let
     the set piece build square. Compare the high lines with the ground edges: S3's slope like the ground, S7's are
     steeper, S4's flatter.
   - **The countryside may have no ground-level receding edge** (S1: fences, banks, field lines and sheds all run along
     the scroll). List each rejected candidate with its slope, hold the neighbour's seam knot to the end, say in metres
     what the alternatives would move, and have the frame script read the seam value from the neighbour's frame, so a
     lead's choice there carries over with one rerun.
   - **Placeholder back corners carry the dx they were drawn with:** where the knots differ, those footprints come out
     skewed (S7: 2–6°). Say so in `questions`, so the builder squares them as a `choice:`.
   - **Measure the diminution from the parts** when the structures agent finishes after the tiles: a short script over
     `pts.foot` and `pts.head` gives the table in a minute (S1's foreground figures are 1.8× S4's road figures). Sample
     it per area: a man inside a building at the bottom edge is painted 82 px where men outside are 160–190.
   - **A roof bird's H** (as S4's perched bird): at the mid-depth of its roof's footprint, H = (v_ground(D_mid) −
     v_bird) / 77, between the roof's eave and ridge.
4. **Generate.** `node tools/scroll_map.mjs <S> all` (check, fit, world, text, plan, overlay). Read the full overlay,
   one dense window at zoom 1, and `gen/map/<S>/plan.jpg` before using the result.
5. **Second pass, with fresh agents** on the merged map (one per half of the area). They write proposals to
   `gen/map/<S>/second_pass/<half>.json`, never to the parts or the map; the lead accepts or declines each in
   `merge_fixes.mjs` with the reason, then runs `all` again. On S4 it found a child named only in its carrier's `what`,
   a bird named only in a tree's note, two ox heads drawn one ox too far west and a gate column 25 px off. On S6 the
   lead's own pass (one overlay window per tile at zoom 1.2, read against the scroll) found 4 more things.
   - **Plan it by density, not by halves** (S3: two thirds of the entities east of u 18000, so three passes of 122, 166
     and 130 entities; they found 45 things). Each reads overlay | restyle side by side at zoom 1.8–3 in every dense
     window (S4b: a crate and a funnel-shaped vessel no unit recorded), then the scan.
   - **Vet and apply proposals by path:** check every proposal's `was` values and replaced note strings against the
     merged map first (S1's `vet.py`), and apply `set` keys as deep paths (`pts.base.se`, `null` deletes a point,
     `(append)` extends a line); a setter that knows only top-level `pts` keys writes `pts["base.se"]` silently. A
     `replace_in_note` that rewrites a merge note must stop that note being appended again.
6. **Build from it.** `node tools/map_layout.mjs <S>` writes `sections/<folder>/layout.json` (the map plus the recorded
   moves in `sections/<folder>/build_choices.json`, each with its reason, and the section's painted area on the
   ground). Builders, the page and people.json take positions from it by map ID (skill `web-scene`), one model per
   entity and nothing else (`map/BUILDING.md`, checked by `tools/loyalty_check.mjs`). It keeps each entity's `pose`,
   `lines_H` and a vehicle's `what` (the boat kit reads a boat's type from it). Check that its `painted_area` meets the
   neighbour's along the seam (the neighbour's corners are in its `layout.json`).
   - **Section keys** are `S<n>`, or `S<n>` plus a letter for a later part built under its own key so the finished
     part's files never change (`S4b`, u 12600–15500, folder `outer_road_2`). The tools accept them (`check` validates
     IDs as `S\d[a-z]?\.<kind>.<slug>`) and take the section list from `map/sections.json` (keys with a `folder`),
     never from a fixed list: `scroll_map.mjs`, `map_layout.mjs`, `loyalty_check.mjs`, `scroll_index.mjs`,
     `tree_cards.mjs check`.

What the loyalty pass taught (S5, 2026-10-11; crops in `gen/map/S5/loyalty/`):
- **Read a mass for what it is painted as, not what it should be.** The "south wing" was recorded as a slumped
  rammed-earth wall because the scholarship names 土墙杂树 and a gate "should" have walls. The strokes show a mottled
  mound of earth and rock with trees, about 5 m across, ending at the silk's edge. It is now
  `S5.grd.rock_mound_7200`. North of the gate block nothing but trees and bare ground is painted, so the gate stands
  without walls.
- **Things named only in another entity's note get missed.** The structures agent left the stall canopy to the tile
  agents, and none recorded it. When merging, search the notes for painted things without an entity.
- **Retire, don't rewrite.** A misread entity is dropped in `merge_fixes.mjs` with its reason, and the right one is
  added with a new ID.

What the gate taught (S5, `map/text/S5.md`, `sections/gate/notes.md`):
- **The painter uses no single projection.** Receding edges slope about -0.9 at the gate block and -1.6 at the bridge,
  and flatten up the tower. One frame fitted on one structure skews the rest.
- **Tall structures are compressed.** The tower is painted at about 0.6 of the street's scale (its door measures
  1.3 m; the watchman is 0.7× life), and its depth is compressed further. The strokes fix where it stands and its
  east-west size; its north-south size is a builder choice.
- **Painted figure size is not a scale.** Street figures are about 1.3× life. Always place by foot point.
- **Bases at the silk's bottom edge are estimates.** Trees and stairs running off the silk have unknown true bases.

What the outer road and the inner city taught (S4 part 1 and S6, 2026-10-11/12; `sections/outer_road/notes.md`,
`sections/inner_city/notes.md`, merge decisions in `gen/map/<S>/merge_notes.md`):
- **The restyle is for reading, not counting.** On S4 it turned a willow's second stem into a man, a lying horse into
  a bush and a planked ditch into a fence, added people the strokes don't have and dropped a perched bird; on S6 it
  filled 孙羊正店's upper storey with drinkers where four are painted. It is right far more often than wrong about
  *what* a faded thing is. Record nothing because the restyle shows it; read faint things at zoom 3 on the scan with
  the restyle beside it.
- **The registered bottom-row tiles carry a smeared strip along their top edge** (rows the registration clamps):
  read figures there from the mosaic.
- **Count crowds under parasols and awnings head by head** at zoom 3 with the grid: the silk is darkened there.
- **Faint things that change the cast or the build** (a third ox, two soldiers in one hunched mass, a robe or a
  hanging cloth) are recorded with `conf: low` and a note giving both readings, never dropped silently.
- **Measure the receding direction on ground-level edges** (furniture, ditches, decks, a wall's foot). Eaves and
  ridges flatten with height (S4: ground −1.4 to −2.0, high lines −0.56 to −0.61); use them only when nothing at
  ground level recedes, and say so.
- **Measure the diminution up the silk** from figure heights against their foot v (S4: 0.9 of the road's size at
  v 850, 0.5 at v 320, 0.3 at v 220; S6's far rows 0.55–0.6). It is the evidence for `map/BUILDING.md` rule 5 (real
  size, painted place).
- **Buildings seen only as roofs** (south of the road, bases behind the roofs or below the silk) have placeholder
  footprints: say so in the entity's note; the builder settles them as `choice:`.
- **Unusual supports:** a driver on a cart's front (0.9 m), a bird in a tree (H from the tree's depth), a child at a
  shoulder or in arms (its own figure, foot at the carrier's foot: support `shoulders`, `carried in arms` or
  `carried on back`).
- **A seam entity is a seam note, not a duplicate.** S4 mapped the team and drivers of S5's covered cart and gave the
  cart's front, shafts and yoke as a note on S5's ID.
- **Tool quirks:** where the route bends, far-north things get odd station ranges (the nearest segment snaps to a
  bend's vertex), so don't trust `station_range` there; custom point names in `pts` (an awning's eave points, a
  sign's `top`) pass `check` and are ignored by `world`, so builders can still read them from the strokes' `pts`. A
  point list that must reach the world in metres is a line role: S3's `arch_intrados_e` became the line `rib_e` in
  `merge_fixes.mjs` (its first and last points the springings at the water). `scroll_map.mjs <S> overlay` has no
  `--help` and ignores unknown flags: it then renders the whole section into `gen/map/<S>/`, so always pass `--out`
  into your scratch folder; `--x` takes `u0-u1` with a dash (two numbers crash sharp with a NaN width); it doesn't
  draw custom polylines (put a rope in a throwaway part as a `line` to see it). `plan.jpg` labels the datum
  "station 0" even when `datum.station` is set. The Bash tool's zsh doesn't split an unquoted `$w` (`set -- $w`
  passes one argument): put crop loops in a `#!/bin/bash` script or use `${=w}`.

What the river, the boats and the bridge taught (round 2: S4b, S3, S2, S1, S7, 2026-10-12; the lead's notes at the end
of `gen/expand/round2/mapping_rules.md`, each area's `gen/map/<S>/merge_notes.md`):
- **Which end is the bow.** The scroll's boats carry the big sweep (大橹) and the rudder at the **stern**: the end with
  the rudder is `rear`, the other `front`, and `facing_deg` points the bow. Use the sweep where the rudder is hidden,
  unless the boat also shows side sweeps. A part with it the other way round (S4b's biggest rafted boat: its sweep is at
  the end its brief called the bow) is swapped, `front`/`rear` and `facing_deg`, in `merge_fixes.mjs` and said in the
  merge notes; a boat recorded with both readings in its note is settled the same way.
  - Where the rudder is hidden: a rudder blade hangs down and aft, away from the hull, while a raked stem descends
    from the stem head into the hull's length (say which way the blade slopes). Find one boat whose heading is fixed
    (a tow line from its masthead to trackers ahead, an anchor under its bow) and read the others by their fittings:
    tiller, sweep, high poop, after cabin, a mast lowered onto it mark a stern; a forked bitt, a windlass hub on a
    curved stem, a projecting bow beam, a grapnel, a gangplank, men poling forward mark a bow. A windlass alone is
    no proof (S2's 豪华客船 has one on its after cabin), and a brief's bow is a hint (S3's big boat: its stern).
- **One boat or two.** Follow the near-side bottom line, or a strake's rivet row at zoom 3: one continuous waterline
  under several cabins is one boat (S3: 945 px); a break in it or a second stem is two; a midship deckhouse with its
  own hood can look like a bow; boats moored end to end read as one at the setup's zoom (S2: a "980 px boat" was 310 +
  545). Count a raft by its bank ends and its outer ends, and give every awning or cabin that no counted hull carries
  its own hull (S4b had five rafted, not four). A mast belongs to the boat where its tabernacle stands. A long tapered
  shape trailing a boat is usually its sweep blade, with a loom running up into the boat (S2's "empty skiff", S3's at
  u 15595); profile any long floating shape (a timber keeps one depth, a hull deepens and shows frames). Willow whips
  mimic strakes at low zoom; strakes carry nail rows. A boat at a slant shows it in its waterline: `facing_deg` from
  front and rear (S2: 172).
- **Crews are few on moored boats** (S2's grain wharf: 4 boats, 5 crew; the porters on the bank do the work): every
  restyle crowd on a deck is invented until the strokes show it. False crew: windlass discs and spoke ends, hung
  fenders and scroll-ended bitts (a head-sized top on a wrapped column), a rudder stock's drum head. A head above a
  moored boat's roof stands on its far deck or on the bank behind it by its painted size: record the doubtful one
  `conf: low`, and the river and tile agents name the same pair. A figure with nothing under it (S2's man in open
  water) is `conf: low` with both readings, never dropped and never given an invented boat.
- **Shores and banks.** Shores are not inked: the shore is where the bank's wash streaks stop and ripple ticks and
  eddies begin (the restyle paints the water as a pale sheet). Anchor water on what stands in it and run it only as
  far as the same blank silk; record the rest `conf: low`. Behind a moored hull the shore is unknowable: `est` just
  behind the boat's top, with how far down it could lie. A "jetty" may be a raised deck at the bank top (find its
  posts' feet against the current lines). A crowd's edge against water may be a bridge deck's far edge: test it by
  its offset from the painted edge at the same v (S3's stayed 696–776 px west of the near railing's edge while that
  curved). At the silk's top over the river, faint strokes may be the far bank: support `far bank`, `conf: low`.
- **Ropes and trackers.** Read a long rope in 650 px windows at zoom 1.6: a point every 100–200 px plus the lowest
  sag, knots and where it is made fast, joined to the tile agents' far end (S2's tow rope: 26 points over 2350 px);
  faint pale lines can be ropes (a stretched greyscale crop). Count trackers head by head and give the line's two
  ends in the rear man's note, so the river agent names him as the rope's far end. A line at a boat's end: a rope runs
  to what it is tied to and slants toward it; a vertical line that rises from the boat and stops short of everything is
  a pole planted in the bed.
- **The bridge agent** reads which way the deck's width lies before naming its edges (on the 虹桥 the hidden far edge
  lies about 750 px west across the picture, not up the silk: name them by side, `deck_e`, `deck_w`, `deck_c`), traces
  long edges with a brightness profile across the band (S3's hand line was 10–30 px off), takes heights from the
  deck's own feet (H = (v of the ground line joining the edge's two feet − v of the edge) / 77; one profile per
  plausible foot where a foot is hidden), reports the slopes in metres for the builder (45–70° at the 虹桥's feet),
  and writes the railing's foot v every 50–100 px for the tiles. Tile agents near its feet mark supports provisional
  until they have its geometry (S3: 35 entities that look like the bank's crowd stand on the ramp at H 1–3 m).
- **Boats run past their tile.** A long hull's bow, roof or sweep blade can reach hundreds of px into the next unit or
  section (S4b's biggest rafted boat: stern ≈ 14880, bow ≈ 15790, sweep blade to 15856, past S4b's seam at 15500). It
  stays whole with its main point's owner, extended in the merge from a zoom-3 read; boats at a seam go with their whole
  crew, even crew standing past it.
- **A route where no road is painted** follows painted open ground that stays on the silk (S3 west of the tavern door:
  the riverside road behind it, not the street the tavern faces, which would run below the silk's edge with a hidden
  12 m turn). The hidden stretch is `est`; its end points are exactly the neighbours' route points at the seams; the
  builder lays only what the walkable area needs, as a recorded choice.
- **Seam straddlers between two new areas go by main point,** settled by the lead before the units start and written
  into `map/index.md` (Seams) and the rules file; the other side retires its copy as a seam note naming the owner's ID.

What round 2 taught about reading the strokes (S4b, S3, S2, S1, S7, 2026-10-12; the cases in
`gen/expand/<folder>_lessons.md`):
- **Crops by job.** The scan is about 1800 px tall: above zoom 3–4 it shows the weave, and CLAHE turns that into false
  strokes. Read *what* a thing is on a gridless, contrast-stretched crop at zoom 1.3–2.6, then take its points on a
  gridded crop at zoom 3 (`overlay --grid 20 --zoom 3`); zoom 5–8 only to measure a blot or read writing. A grid line
  can hide a stroke lying on it. sharp recipes, each a 20-line script in your scratch folder (`overlay` has no enhance
  mode yet):
  - figures, furniture, caps, feet: `normalise({lower: 1, upper: 99})`, a lanczos upscale, a light `sharpen()`;
  - faint far figures, pale trunks, mat against tile: `greyscale().blur(1.2–1.6).normalise({lower: 2, upper:
    98}).linear(1.3, -30)`;
  - faint ink-wash figures and animals (S1): a grey high-pass (the scan minus a 12 px Gaussian, ×4, offset to mid
    grey) at zoom 2.5–5; it showed donkeys' ears and which way each faced where stretching left smudges;
  - red touches (food, flowers; planks against mat; iron cramps against beams): `modulate({saturation: 1.6–1.8})`
    plus `linear(1.25, -35)`;
  - trunks on dark silk, and anything under a seal: the red channel alone, normalised (`extractChannel('red')`):
    vermilion and yellow silk go pale, ink stays dark;
  - writing: `greyscale().normalise().sharpen()` at zoom 5–8; water: a plain 3–4× crop with a light `sharpen()`.
- **Profiles settle what the eye merges** (mean grey along short bands): an outlined trunk is a pair of minima 8–10 px
  apart that stay together down the silk (single drifting minima are whips; S1's 菜地: 13 trunks where the eye saw
  25–35 plants); a hidden trunk ends where its band stops being darker than both sides; a wash band's edge is the
  light step in 16 px columns (±5 px); a proposed line is real when the darkness peaks at offset 0 against parallels
  2–16 px either side, run in 40 px segments to find where it ends (S1: two far field lines 8–17 px off, five not
  there).
- **Count heads and pairs of legs, never silhouettes.** Put a numbered marker on every head (a small sharp script),
  sweep again for unmarked heads, then place feet (S4b's crowd: 13, not 15–20). A head is a 15–25 px dark mass (hair,
  cap) or a closed outline with a face; test a doubtful one against a sure face at a similar v (figures near the
  bottom edge are painted largest). False heads in round 2: a jar in a porter's rope sling, hooks under the arch's
  rib, a ridge ornament (鸱尾), a fleck of silk damage at a light structure's tip, a parasol's far rim, a raised arm
  curling beside a head, a basin under fruit taken for a seated back (a back is widest at the shoulders). A dark mass
  joined to a figure in the same tone with no head or legs of its own is that figure's clothing (S3's third "donkey"
  was two wide sleeves); long unbroken strokes from waist to hem are robe folds. Behind balustrades and in sheds a
  mass without a dark head is more often cloth, a bundle or furniture. Two heads over one body: the head with bare
  silk under it belongs to a body leaning toward it, and the other is a second figure, `conf: low`. Compare an
  uncertain shape with a sure thing of the same kind on the same crop (it gains more than zooming), and with its
  neighbours' painted heights (at the silk's top edge far figures are about 80 px, so a 100 px "man" there is more
  likely a stand or a load).
- **Where the feet are.** Seated or standing: compare painted height with standing neighbours at a similar foot v,
  not with the furniture (seated ≈ 0.8). Hidden feet get an `est` foot from a whole figure's height nearby (say what
  hides them, give the range in the note); people leaning over a railing stand a step behind it (measure the handrail
  at the posts' tops first); a head over a roof may stand beyond it, on it, or be an ornament (`conf: low`, named to
  the structures agent); a head drawn across a lintel or an eave line is suspect. A shape over a head may be a hat, a
  back load (it runs down behind the neck with the face beside it) or a stand behind; add a prop only where its own
  feet show.
- **Animals, riders, carts.** Read an animal's head end from its tack and legs, not its load: the halter ties at the
  head, the breeching lies over the rump, the hock points to the tail, the knee forward; legs spread along u mean a
  side view. Count teams and trains by hooves (a fifth leg is another animal, `conf: low`). A rider shows a leg or
  robe across the flank and sits at a seated man's height: look for a bench under his hips and for an empty saddle (a
  brief's "rider" is a hint). Test a doubtful animal's length against a sure one at a similar v. A cart's front is
  its harness end (raised poles, a crossbar, rope loops and hooks); rest legs mark the rear; follow the bed's lines to
  their end before putting an animal in its shafts. A rider on a mostly hidden horse settles its facing (where he
  sits, which way his stirrup boot points, where the groom stands); its fore, hind and head points are `est` from a
  body length of about one standing figure's height. A vignette's direction comes from the heads, not its title or
  the restyle (S1's 赶驴入城 train faces east): both readings, and the conflict to the lead. On worn silk colour tells a
  garment from a post: the painter tints clothing with indigo, and posts, poles and twigs are plain ink.
- **Trees.** Follow every trunk to its roots: leaning willows carry their heads 250 px from their feet, a willow limb
  can arch 300 px over a roof, a thick leader in a crown looks like a trunk. A pollard's knot is its head, not its
  foot. Crowns with hidden trunks: one tree per fan's convergence point (inner shoots crossing in an X mark the gap
  between two), base `est` with its possible v range. Two parallel contours 20–25 px apart with a pale middle are one
  trunk; a split-trunk willow is one tree (`foot_w`, `foot_e`); crossing trunks are followed from each foot; a pale
  tree behind a dark one is a further tree. Count a grove at three levels (a strip through the trunks, the feet, the
  crowns), bottom-edge trees by the trunks that cross the silk's edge, and "rows of small plants" against a figure
  (S1's 菜地 is 13 young trees). Long straight lines through crowns and ground are creases in the silk. A trunk can
  change tone along its length. Twigs pointing up from a drooping bough are its shoots, not a tree (a trunk must reach
  the ground). Measure a big tree's base before deciding its owner, and read one painting idiom
  the same way across neighbours (S1's root lobes, mapped as roots on one tree and left open on the next).
- **Seals and writing.** Measure a seal's box from its red pixels (R − G > 45) and run every line to where it really
  meets it (S1 stopped a road and three banks 150 px early "under a seal"); a seal's straight border is not a trunk.
  Shop-board characters (about 15 px) don't resolve at any zoom: count the marks, write each as □ and put the
  scholars' readings in `note`; never take characters from the restyle. A "board" under an eave may be several tablets
  hung between bracket sets (S7: 趙 · 太 · 丞 · 家), the clusters between them ornaments.
- **The restyle** is right about *what* more often than not and never about *where* (30–45 px drift inside one
  tile; where a tile is misregistered, the overview names things better). It invents people from trunk feet,
  panniers, bundles, sheds and pale patches, children in red, doubled figures, animals from ladders, trestles and
  benches, trees from pole stacks, tiles over mat roofs, dry ground and stone banks over water and wash bands, and
  whole streets on the faintest silk; it redraws rafted hulls (their count, a dark stern as sacks, willow trunks as
  masts and crew) and drops small dark animals. Where a tile and the overview disagree about a faint group, both are
  inventing: count legs, hooves and torsos on the strokes. In the countryside it gets the trunks right in
  number (20–40 px west) and almost everything else wrong. Where the setup says it invents, open that tile's check
  sheet before reading the scan.
- **Easy to miss:** empty furniture is painted furniture (record tables nobody sits at and say they are empty, so
  nobody casts diners there); buildings cut by the silk's top edge (a lattice band, a beam, tables) get placeholder
  footprints `conf: low`; a roof named only in a building's note needs an entity of its own; free-standing frames,
  trestles and racks are tile props unless the brief names an owner. Five legs under one table's end mean a second
  piece; a small box's "peak" may be its top's receding edge (look for the falling slope before recording a gabled
  lid). A parasol's hub is where its ribs meet; its
  pole's foot lies about rim v + 2.2 × 77 × the local scale below (no pole there: a roof); a tall pole with a crossed
  bar behind a crowd can be a bridge's end post (表木).
- **Structures.** Test an upper storey by what is under its floor (a platform band and a pent roof with drip tiles:
  平坐 over 腰檐) and give the floor line and the est ground as two numbers; rooms seen through windows above a lattice
  skirt are raised floors. Sort a stack of roofs by their ridges (a ridge running up-right is a hall running back;
  S7's top half was six roofs); on a roof seen from above at the bottom edge, find both gable apexes and the eaves
  first (footprint = the ridge's ground line ± half the eave span, corners below the silk clamped to v 1795); a gable
  vent with thatch sweeping both sides means a house running back; mat or thatch is cross-hatched, tile is scale arcs.
  A building south of the street hides its own street wall: estimate its foot from a measured eave height on the same
  building (S7: 275 px below the visible roof line). Give roofs-only footprints one stated rule, written in every note.
  A recurring south-row hall (S4, S4b) has a ridge rising up-right from a small south gable to a high north gable peak
  near the road: record both peaks, the ridge, the barges and the tie beam as named points, so the builder can fit the
  roof to any footprint. A building's main point is the centroid of its base corners; a roof running on past the
  neighbour's est end is recorded from there with a seam note to join the roofs. A scaffold is recorded pole by pole (`poleN_top`, `poleN`,
  `tierN_w|e`) on the building it stands on. Placeholder back corners must contain the figures on the floor. A post on
  a plinth's face under a bay post is that post carried down; compare stroke rhythm before running a structure on
  behind an occluder; trace a curve to where it starts before calling a shed a boat.
- **Roads.** Along water, the road's `edge_s` is the river agents' `bank_top`. A route through a building that fills
  the bank is a valid recorded reading (`est`, with a `support_ranges` entry); a hidden road end is tested against the
  neighbour's buildings. Copy the neighbour's road points first and read its parts again just before writing the road;
  set route edges to the fronts the structures agent measured.
- **The countryside's ink-wash ground** (S1): a dark wash band you can see faces you, so the ground steps down toward
  you across it: `bank_top` on its sharper upper edge, `bank_foot` where it fades (a layered bank's foot is its lowest
  stroke, from a column profile; a bole's base is where its bark texture ends, not the wash's top); wash tongues into
  blank silk are spits. Crossed short hatching under a smoother roof wash is a brushwood fence or hedge; leaf-dab
  clusters with no uprights are bushes. A stream's level comes from a deck that meets both banks level (S1: H ≈ −0.7).

## Expanding the world (the playbook)

Two rounds so far. Round 1 (S4 part 1 and S6, 2026-10-11/12) ran one area agent per section, each mapping with its own
subagents; its files still show that way (`gen/expand/brief_outer_road.md`, `brief_inner_city.md`, `brief_workshop.md`,
`progress.md`). Round 2 (S4b, S3, S2, S1, S7, 2026-10-12) mapped all five areas at once with one workflow, built them
with area agents and factories, was finished after a PC freeze by a restart run (step 6), and went live as v1 with all
eight sections joined. Reuse round 2's files: the lead's record `gen/expand/round2_progress.md`, the Phase
0 evidence `gen/expand/round2/phase0_questions.md`, the area briefs `gen/expand/round2/brief_<folder>.md` (and the tile
plan `tile_plan_S1_S2_S3.md` they were drawn from), the shared mapping brief `gen/expand/round2/mapping_rules.md`, the
shared build brief `gen/expand/round2/build_rules.md` and the restart brief `gen/expand/round2/restart_brief.md`; the
reports `gen/expand/round2/<folder>_run{1,2}_report.md`, `joins_report.md` and `page_report.md` show the format. The
standard every agent follows is `map/BUILDING.md`; a change to it needs the user.

1. **Phase 0, the lead (before any agent starts).**
   - Ask the user in one go: which areas; whether animals, carts, boats and new characters are made now (Meshy
     credits); how big a workflow may be (round 2: unrestricted, set by the user in `/config`).
   - `map/sections.json`: one key per area (a letter for a later part under its own key, `S4b`), its `folder`, and
     `area` when only part of it is built now (the tools use `area || x`). Seams in `map/index.md`, "Seams", with the
     owner of every straddler (by main point; a boat with its whole crew). Move a seam rather than cut a painted group
     (S1|S2 went to u 29050 so the 望楼饭铺 shed and its customers stay whole in S2).
   - Seed frames where the neighbour is built (`map/frames/<S>.json`: S5's origin and scales, the neighbour's knot at
     the seam, the datum's `station` from the neighbour's route; `map/README.md`, Frames). An area whose neighbour is
     new gets its frame in order along the scroll (step 2).
   - New kinds get their convention in `map/README.md` and the tools first (round 2: lettered keys, boats, `H_profile`,
     one water level measured once), since only the lead edits shared files.
   - Write the area briefs (area, scholars' hints, seams, the ownership table below, Run 1 and Run 2) and the shared
     mapping brief: "Everyone", then one section per role (setup, tile, structures, river, bridge, merge, second
     pass, frame, needs), with the validator each role runs and the files it may write. Tell every agent: lessons go in
     its report as exact text for the skills, and scripts in its own scratchpad folder.
   - Start what doesn't need the needs lists, in parallel: factories for kinds the scroll obviously has (round 2: the
     boat kit, the Rainbow Bridge set piece, the backdrop keyer) and shared machinery (the streaming engine, the HUD;
     skill `web-scene`).
2. **Map every area at once: the `map-round2` workflow.** The saved workflow `map-round2`
   (`/home/ran/3d_director/.claude/workflows/map-round2.js`: run it by name with the Workflow tool and `args`)
   takes `args.areas`, each `{S, name, x, folder, brief, rect, units, east, eastFolder}`, and runs per area:
   **setup** (writes a missing area brief, starts the restyle in the background, writes the tile brief
   `gen/map/<S>/brief.md`, returns the final unit list and where the restyle invents) → **units** in parallel (`tile`
   by range, `structures`, `river`, `bridge`; each writes `gen/map/<S>/parts/<unit>.json` and `reports/<unit>.md`) →
   **merge** (`merge_fixes.mjs`, the cross-key seam check against a finished neighbour, the second-pass ranges) →
   **second pass** (fresh agents, proposals only) → **frame** → **needs**. Every prompt is one line naming the role,
   area, range and brief, plus "read `mapping_rules.md`: Everyone and your role"; results come back as small JSON
   (`part_file`, `check_pass`, `counts`, `left_to`, `seam_notes`), and long text goes in the report files.
   - **Frames run in order along the scroll**, the rest runs wide: S4b (from S4) → S3 → S2 → S1, and S7 alone from S6.
     Each frame agent waits for its east neighbour's, seeds from it (S5's origin and scales, the neighbour's dx at the
     seam as the seam knot, the datum on the neighbour's route point at the seam with its station, `supports.water`),
     runs the cross-key seam check within 300 px, applies the second-pass proposals, runs `all` and `map_layout.mjs`,
     and returns the west seam (route point, station, dx) for the next.
   - **Notes to running agents go in the rules file.** Workflow agents can't be messaged. The lead appends "The lead's
     notes by area" to `mapping_rules.md` (a straddler settled, a convention decided, a tool change, which end is the
     bow), and every agent that starts later reads it. Write a note before the step that needs it starts (a merge, a
     frame).
   - **Units are the smallest rerunnable piece.** When agents die (round 2: a `/login` mid-run stopped 8 of S3's units
     at start), relaunch them as separate background agents with the workflow's prompts (same files, same rules); the
     workflow's result for them is empty, so its merge agent is told to look for their part files.
   - **Sizes:** 58 planned units, up to 14 agents at once. Tiles own about 600 px where dense, 800–1000 where open, at
     most about 40 figures each; the structures, river and bridge agents are the critical path, so they start first.
   - **The needs step** writes `gen/expand/<folder>_needs.md` (prose, one line per item): a cast for every figure from
     the existing characters first (`characters/notes.md`), a new character only when none fits (its model figure's map
     ID and a crop, what it wears, which figures it plays), the actions the clips can't show, every animal (species,
     pose, tack, load, rider), every vehicle (type, wheels, body, load, team, map size), every boat (type, hull length
     and beam as mapped, cabin, mast, sweep, cargo, crew, rafted to what), carried props, the kit parts `song_kit.py`
     lacks, the set pieces, the tree forms by count (`trees/types.md`); merges the units' lessons into
     `gen/expand/<folder>_lessons.md`; and writes the Run 1 report `gen/expand/round2/<folder>_run1_report.md` (counts
     per kind, boats apart; the frame, its knots and water level; what was hard to read; seam notes by the neighbours'
     IDs; the needs in brief). What round 2's needs agents learned:
     - **Cast with a script, one row per figure,** checked against `map/strokes/<S>.json` (every figure exactly once)
       and each character's clips; it prints the counts, the free retargets, the takes wanted and the props. Look for
       every wanted clip among the existing takes and clips first (`t2m:`, `from:`: free; S4b needed 20 clips and only
       3 takes), use the neighbours' take names (S2 used S3's `work_sweep`, `tow_walk`, `pole_boat`, ...), and give
       every wanted take a stand-in clip that plays now. Spread faint figures and look-alike neighbours over plain
       characters (S3's idler would have played 68 of 232; S4b's 19 of 66); cast by look, not by name.
     - **A new character's model is a map ID,** painted large and face on (S2's sweep crew at 128–155 px, not S3's
       crewman seen from behind), its crop cut from that figure's head and foot points (the `woman`'s crop turned out
       to be S7's doctor). Look for the free route first: a prop (`wind_hood`), a recolour, the ox body with a tone and
       horns for a buffalo; give the paid fallback in the same line.
     - **List what finished areas' kits already have** against each need (builders import them read-only), and
       withdraw a brief's request the map contradicts (S4b's landing stair: none painted).
     - **Boats:** check the boat factory's inventory hull by hull against the merged map (S2: two of its boats were
       one read backwards, a deckhouse, five that were three, three missing); give each boat's X range and middle D
       and the rafted gaps (S4b's centre lines 1.8–3.9 m apart, under every kit beam).
     - **Trees:** classify by form with a script over the map's `what`, and flag forms whose mapped heights pass their
       cards (S1's great willows 10–17 m against 8–10 m cards) and groves where one form repeats within a few metres:
       those are the cards worth drawing. Give the factories gridless, contrast-stretched scan crops beside the
       registered restyle, named with their rect.
3. **One catalogue, factories by kind.** One agent merges every area's needs list into `gen/expand/round2/catalogue.md`
   (existing characters first, duplicates dropped). Factories, one agent per kind: characters and actions (skill
   `characters`), animals, vehicles, boats (`blender/kit_boats.py`), tree forms, set pieces (the Rainbow Bridge,
   十千脚店's 彩楼欢门 scaffold, the 望火楼), backdrop panels. Builders never wait: `stand_in`s and kit stubs first, swapped
   as factories deliver. Pilots before scale: boats and water on S4b's moorings, the countryside ground on a small
   piece of S1; the user signs each off before the rest builds. Each factory appends one line per delivery to its
   progress file, which areas watch:
   - **the kit factory** (`kit_vehicles.py`, `kit_common.py`, `kit_boats.py`): `gen/expand/round2/kit_progress.md`, the
     signature, triangles and the areas using it. A catalogue keyword that clashes with an existing positional is
     renamed (`sedan_chair(front_style=)`, not `front=`), so builders probe for a part or keyword
     (`has(module, fn, *kwargs)`) and call it the moment it lands. Boat options per boat go in
     `gen/boats/round2_options.json`, each `add` merged by the area into `build_choices.json` `boats.<id>.kit`;
   - **the workshop:** `gen/expand/round2/workshop_progress.md`, with each take's verdict ("\*\*PASS `take`\*\*",
     "\*\*NOT TO USE `take`\*\* → <stand-in>", "retake wanted"), the line `take review done`, and `ALL CAST <time>` once
     every area is recast; casting scripts read the verdicts (skill `characters`);
   - **the tree factory** reads each tree's `what` and `note` and the needs lists' cards; adds a variant only where a
     painted shape has no card or a cluster runs out of cards; pins the old variants' `refs: [0, 1]` and diffs
     `tree_cards.mjs status` before adding scan crops to a form (no old card goes stale); reads every check image and
     `form_<form>.jpg` beside the scan; assigns with the resolver (`gen/trees/round2/solve.mjs`, readings in
     `prefs.mjs`; pin the unmistakable tree of a tight cluster first) into `trees/assign/<S>.json` with a lineup per
     area (`gen/trees/lineup_<S>.jpg`); runs `ktx2.mjs encode --kind tree` and `check --kind tree`, then
     `tree_cards.mjs check`; reruns `map_layout.mjs` only for areas reported done and leaves the export to the area.
4. **Area agents, Run 2** (one per area, about 1–2 h), by `build_rules.md` (it wins over an area brief): the builder
   built headless (`tools/build_scene.sh <folder>`; every other headless Blender through `tools/blender_slot.sh`; the
   live GUI is the lead's), new parts in the area's own `blender/kit_<folder>.py`, shared kits imported never edited;
   rivers with `kit_boats`, the bridge with `kit_rainbow_bridge.build()`; `people.json` generated by a script with
   `stand_in`s (skill `characters`); panels past each side edge where a neighbour's strip is painted (a panel stands in
   while that neighbour isn't loaded); then `loyalty_check` PASS, the scroll index (`export_web_scene.mjs` runs
   `scroll_index.mjs <S>`: projection max under 2 px, no digits in labels), `ktx2.mjs encode` and `check`,
   `budget_check.mjs <folder>` PASS; checks alone (`world.html?sections=<folder>`) and joined with every built
   neighbour (`walks_joined.json`, `shots_joined.json`, decks that board where there are boats, `people_check` at
   `?window=all`), against the one check server (`tools/check_server.sh start`, 5190, HMR off) and inside a Chrome
   slot (`tools/chrome_slot.sh <command>`), never the user's 5180 and never an agent's own Chrome or dev server (see
   "Machine resources"); records and lessons. What ran well under an area agent: a kit agent (signatures fixed in its brief, the builder written against
   a stub meanwhile), a casting agent, a backdrop agent and an independent QA agent who walks and shoots alone and
   joined, and rechecks every fix the same way. What round 2's area agents added:
   - **One `build_choices.json` from fragments.** Each subagent writes only `gen/sections/<folder>/choices/<agent>.json`
     (the tables, every entry with its why) and one script merges them (`gen/sections/rainbow_bridge/merge_choices.py`):
     a key set by two fragments stops the merge and names both, except `moves`, which add up (dX, dD summed, the
     reasons joined). Give each table's entries one owner.
   - **Compute moves from the map, never from the current layout.** `layout.json` = `map/world/<S>.json` + everyone's
     moves, so a move recomputed from it comes out about zero, and a rerun script moves things twice: un-apply
     `layout.moved` (pos, pts, footprint, bays; a figure's or tree's X, D) before measuring, and give absolute targets
     as targets minus that base. The agent whose move lands last computes with the others' included and says so.
   - **Test a set piece's whole built footprint against every mapped thing on the first day** (deck, ramps extended
     for the walk limit, abutments): S3's north ramp, lengthened 3 m, landed on a handcart, a shed, a counter, people,
     half a tavern and 2 m past the silk's top edge (21 moves, a narrowed tavern, an edge detour).
   - **The area kit's name:** when `kit_<folder>.py` is already a factory's set-piece kit, the area's own is
     `kit_<folder>_area.py` (S3: `kit_rainbow_bridge_area.py`, with `kit_rainbow_bridge_props.py` for its props).
   - **Rivers:** check the next section's boats against yours before the first export (S4b's sterns ran 3–6 m into S3's
     river, over a boat rowed toward them); two river areas built at once need one plan of the seam's water (the
     lead's).
   - **Walks and shots written before the set pieces and the ground land go stale** (S1: 11 of 50 walks and 3 shots
     after the hall and the shores changed): rerun all of them after the last build and rewrite what the build moved,
     with the reason in each `why`. Board every boat that touches the walkable bank in `walks.json`: onto it, along its
     deck to each end's rail, 20 s riding against a rail, back off (find the spots with a few test walks along the hull
     first). Plan routes over the page's own colliders, not the layout: probe the loaded page on a 0.25 m grid, then A*
     with a 1.9 m head-room test and a ground band that excludes table tops (H −1.25..0.35)
     (`gen/sections/canal/qa/run3/tools/`, README.txt; S2 alone: 12 s). A plan view of the raw GLB's `__col` meshes,
     the water strip and the shore walls with the walk traces (a small SVG through sharp) answers a failed walk
     without 3D shots.
   - **HUD check:** per landmark `__test.goto(X, D)`, stand there, `await __test.hud.show()`, wait until
     `hud.stats().pending` is 0, screenshot, record `hud.you()` and `hud.drawn`
     (`gen/sections/rainbow_bridge/qa/run3/tools/hud_shots.mjs <url> <out_dir> <spots.json>`, in a Chrome slot;
     `tools/hud_interact.mjs` still hard-codes 9223). Where a builder widened a bank the frame doesn't know, the ring
     lands off the painted ground (S2: up to 3 m into the river); the boxes stay right.
5. **The lead joins:** applies the seam notes (`gen/map/<neighbour>/merge_fixes.mjs`; knots past a seam copied into the
   frames whose entities reach across it; the older section's ground cut back to the seam), reruns the casting scripts
   when factories deliver, rebuilds, runs every check on the joined world (`loyalty_check` per section, walks across
   every seam, `people_check`, shots across the seams, and HUD shots at each new section's landmarks:
   `__test.goto(X, D)` then `__test.hud.show()`, compared by an independent QA agent with its own scan crops: ring on
   the painted spot, boxes on the painted figures), `budget_check.mjs all`, and benches on the real GPU. Bench numbers
   from an agent's shared Chrome mean nothing. Then records: each section's `notes.md`, `map/index.md`, the skills
   (the lessons files merged and marked), `NEXT_SESSION.md`; then deploy (skill `deploy-web`). Round 2's joins
   (`gen/expand/round2/joins_report.md`):
   - The older side's ground is cut 0.5 m past the seam on a clean line (vertices past it moved onto it, collapsed
     faces dropped); its water strip and run-on walls stop on the seam. Where a river ends against land at a seam, the
     lower ground must reach past the upper ground's edge: sample the heights along the seam (S2's bed rises to just
     under the water there, S1's bank rises 2.2 m out of it).
   - The world's walks (`sections/world/walks.json`) are composed from every section's own and joined walk files,
     sorted west to east, `from` naming each source, a `goto` per walk; walks that rely on a seam wall or pass only
     alone stay out (210/211 on the whole scroll). Seam shots go in the joined shot files; a spot's `hour` carries over
     to the spots after it, so set it on every spot.
   - `people_check` road spots lie on a painted walker's actual path (`people.json` `walkers[].path`; a spot 0.8 m off
     the porter's line failed), with `--into` a figure of the section (the default is the gate's). The gate's own spots
     (7, 3.9) and (−8, 4.1) predate the loyalty pass and fail by design; the whole scroll uses −96.2,3.6; −52,9.33;
     −73,4.49; 16.0,4.7; 18.9,17.3; 60.5,17.1; 131,−3.32; 194.5,22.3; 268.78,11.96; 289.5,0.2
     (`gen/sections/world/qa/run3/people_world_all.log`). A spot that turns walkers back once in three runs is timing.
6. **Finishing a round after a stop** (round 2's restart run, `gen/expand/round2/restart_brief.md`; it wins over the
   other briefs):
   - **Done** means `loyalty_check`, `ktx2.mjs check`, `budget_check`, walks alone and joined, `people_check` and the
     scroll index PASS and the quality bar (`map/BUILDING.md`, the skills) holds; then stop: no polishing past done.
     The user's own look at the deployed world is the primary review (the user: "just pass the checks and quality bar,
     merge them, and have me check"). On a judgment call take the option that passes, record it (`build_choices.json`,
     the notes) and add a line to the report's "For the user". A budget miss is fixed the cheap way first, else written
     as an exception with its numbers; the lead decides and edits `tools/budgets.json` (`exceptions`).
   - **Roles:** area finishers, each owning its area and ending with `FINAL BUILD <time>` in
     `sections/<folder>/notes.md` once its GLBs won't change; a join agent (the finished sections' seam work, seam knots
     in `map/frames/`, `sections/world/`), starting each seam when both sides' line is in; a page agent, owning
     `web/src/` and `web/*.html` for the run, defects only, taking requests through `gen/expand/round2/page_queue.md`
     (one line each, marked done or not with the reason) and rerunning `gen/expand/round2/page_qa/regress.sh <tag>`
     (world walks, `boats.html` walks and rides, `people_check`, in one Chrome slot) after each change; a workshop
     finisher (take reviews, `take review done`) and a paid run (new characters and takes; recasts each area after its
     `FINAL BUILD`; `ALL CAST <time>`). The whole-scroll pass waits for `ALL CAST`.
   - Each agent runs at most one subagent of its own at a time, keeps its check results in
     `gen/sections/<folder>/qa/run3/` and ends every stage with what landed and the exact next command in its record.
     The report ends with "For the user"; the lead collects those into `NEXT_SESSION.md`.

**Who owns what** (two agents never edit the same file):
- **A mapping unit** (tile, structures, river, bridge): its own `gen/map/<S>/parts/<unit>.json` and
  `reports/<unit>.md`; a second-pass agent its `second_pass/<id>.json`. Nothing else.
- **An area's merge and frame agents, and its area agent:** `map/strokes|frames|world|text/<S>.*`, `gen/map/<S>/`,
  `sections/<folder>/`, `gen/sections/<folder>/`, `blender/<folder>_scene.py`, `blender/kit_<folder>.py`,
  `prompts/backdrop_<folder>_*.txt`, `web/public/assets/<folder>/` (through the tools), `gen/expand/<folder>_*.md`.
- **The workshop and the factories:** `animals/`, `tools/animal.mjs`, `blender/rig_quadruped.py`,
  `blender/kit_vehicles.py`, `blender/kit_common.py`, `blender/char_props.py`, `characters/`, `prompts/char_*`,
  `prompts/motion_*`,
  `prompts/animal_*`, `gen/animals/`, `gen/vehicles/`, `gen/characters/`, `gen/motions/`, `gen/props/`,
  `web/public/assets/chars/` and `animals/`, the character tools, `web/creatures.html`; the boat kit
  (`blender/kit_boats.py`, `gen/boats/`) and the set pieces (`blender/kit_<piece>.py`, `gen/set_pieces/`) each their
  factory's.
- **Only the lead:** `song_kit.py`, `street_b1.py`, the finished sections' builders and map files (their
  `merge_fixes.mjs` too), the page and its modules in `web/src/` and `web/*.html`, the shared tools, `map/README.md`,
  `map/BUILDING.md`, `map/index.md`, `map/sections.json`, the rules files, the skills and the deploy (the lead may
  delegate the page to one page agent for a run, and the finished sections' seams to a join agent). Once a factory
  delivers, its kit is shared: areas import it and never edit it.
- An agent that needs a change in a file it doesn't own works around it and writes the request in its report; what it
  learns about a neighbour's entity is a seam note.

**Pitfalls of running agents in parallel:**
- **The scratchpad is shared.** S4's tile agent ran a generically named script that S6's tile agent had overwritten,
  and it rewrote `gen/map/S6/parts/t1.json`. Every agent and subagent keeps scripts in `scratchpad/<S>_<role>/`
  (Run 2: `scratchpad/<S>_run2_<agent>/`).
- **Blenders, Chromes and dev servers come from shared slots** ("Machine resources", below), never one per agent.
- **The dev page reloads while other agents write into `web/`,** which kills a long `people_check` ("Execution
  context was destroyed"): check on the check server (5190, HMR off), close every tab you open, and rerun a batch
  that dies.
- **A `/login` mid-run kills the agents starting at that moment** ("Not logged in"); running ones go on. Relaunch the
  dead units by hand (step 2). Usage limits stop running subagents mid-step: every long-running agent appends one
  line of results to its record after each step, and a live one is resumed with SendMessage (it keeps its context).
- **The image API's balance can run out** (403 INSUFFICIENT_BALANCE): queue the images with their commands in the
  lessons file and go on; mapping reads the scan at zoom 3 without the restyle.
- **Meshy tasks belong to the account that made them** (skill `characters`, Accounts): the workshop switches
  accounts between characters, never inside one.

## Machine resources (and recovering from a crash)

Round 2 froze the PC and the user had to restart it (2026-10-12 ~18:00). Running at once were 11 headless Chromes, one
per agent at about 1.6 GB each with the whole world loaded, and 10 dev servers at about 0.6 GB each, all re-reading
`web/` on every write. The load average was around 40. All of it shares 32 GB with WSL, which `.wslconfig` lets take
24 GB. At idle, Windows has about 11 GB free while WSL holds 7 GB. Blender was not the cause: a section build takes
about 6 s and 0.25 GB.

- **One pool, shared slots.** `tools/machine.sh status` shows both sides: Windows free memory, WSL available memory,
  load, Blenders, check Chromes, dev servers and taken slots.
  - Headless Blender runs only through `tools/build_scene.sh` or `tools/blender_slot.sh` (3 slots).
  - Page checks (`walk_page`, `people_check`, `shots_page`, `film_page`, `clip_sheet`, `animal.mjs frames`) run only
    through `tools/chrome_slot.sh <command>` (3 slots). The slot's Chrome starts fresh for the command, gets
    `CDP_PORT`, and stops after it.
  - Pages load from the one check server: `tools/check_server.sh start`, http://127.0.0.1:5190, HMR off.
  - Benches run on `tools/win_chrome.sh` (9223) with nothing else running.
  - Every slot first waits in `tools/machine.sh wait`: Windows ≥ 3 GB free, WSL ≥ 2 GB available, load under the
    core count. The `QM_*` variables override these thresholds.
  - No agent starts its own Chrome, dev server or Blender.
- **CPU-heavy steps** (`ktx2.mjs encode`, export optimize, image keying, sheets) run one at a time per agent, never
  in parallel loops.
- **Recycle at the end of every stage** (build, export, check batch, factory item). The agent leaves nothing of its own
  running: tabs closed, background `until … sleep` monitors killed, slots released (the scripts do that).
  - The lead runs `tools/machine.sh status` whenever it checks on agents, and `tools/machine.sh sweep` between
    stages and after any agent dies. `sweep` stops leftover check Chromes and dev servers; it keeps 5180, 5190 and
    the bench Chrome.
  - The live GUI Blender is the lead's. Build into a named scene and save the .blend after each stage. Run
    `bpy.data.orphans_purge(do_recursive=True)` after removing a scene. Save and restart Blender when its memory
    passes about 4 GB.
  - During a run the lead logs `machine.sh status` once a minute (`gen/expand/round2/machine_log.txt`) and is called
    when Windows drops under 2 GB free or the load passes 32. The restart run (seven agents, at most one subagent
    each, every page check in a slot) held there without a freeze.
  - Stop a process by its PID (`ss -ltnp | grep :<port>`), never with `pkill -f` on a pattern that also matches your
    own command line: it killed the shell that ran it.
- **Images cost an agent its context.** The S1 area agent, heavy with images, couldn't be resumed. Review sheets and a
  few crops, and hand bigger image reviews to a subagent.
- **Save at each stage: files are the only state.** After a reboot or in a new session, the old agents can't be
  messaged or resumed, so fresh agents pick up from the files.
  - Every agent ends each stage by appending to its record what landed and the exact next command. The record is
    `sections/<folder>/notes.md`, or the factory's progress file.
  - **The scratchpad is not durable.** It lives in `/tmp`, which Ubuntu empties at boot. The 2026-10-12 restart wiped
    the QA agents' defect logs and walk results, the join agent's seam shots and the kit factory's test runs.
    Findings, check results and logs that a successor needs go in the repo: `gen/sections/<folder>/qa/`, the factory's
    `gen/…` folder, `workshop_logs/`. Keep only throwaway scripts in `scratchpad/<S>_<role>/`.
- **After a crash, a reboot or a killed agent:**
  1. Run `python3 tools/integrity_check.py --since "<round start>"`. A half-written JSON or GLB is redone by the step
     that writes it, never patched by hand.
  2. Find the work that was cut off:
     - files newer than the last record entry (`find qingming -newermt …`);
     - a `build.log` that ends in an error;
     - a workshop log without its final line;
     - the dead agents' transcripts: `~/.claude/projects/-home-ran-3d-director/<session>/subagents/agent-<id>.jsonl`,
       with `.meta.json` naming each agent. These survive a reboot: the last tool calls show where each agent
       stopped, and the scripts and findings it wrote to the wiped scratchpad can be read back from them. A dead
       agent's tools are rebuilt by replaying, in order into a new folder, its `cat > file <<'EOF'` blocks, the
       `python3 -` blocks that edit those files and its `sed -i` lines (S3's route planner, route generator and
       calibrating walker came back exactly from about 20 calls; the boats page's `ride_test.mjs` too). Rerun its
       probes against the current build, since a rebuilt scene moves things, and keep the rebuilt tools in the repo
       (`gen/sections/<folder>/qa/run3/tools/`).
  3. Run `tools/machine.sh sweep`, rerun the interrupted steps, and start fresh agents from the record
     (`round2_progress.md`). Never redo what landed. Meshy results are safe once they are in `gen/`, and credits are
     logged in `workshop_logs/credits.log`.
- **WSL's file cache squeezes Windows.** Within 10 minutes of the restart run, Windows was down to 1.1 GB free while
  WSL reported 21 GB "available": 16 GB of its file cache, which Windows counts as used by `vmmemWSL`. The
  `wsl cache` line of `machine.sh status` shows it.
  - Only root frees it: `sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'`, run by the user (no passwordless sudo).
  - Evicting per file without root (`posix_fadvise`) freed 2.3 GB of cache but added about 6 GB of metadata from
    walking 2.9 million files. Don't.
  - The slot gate is the safety net: on Windows under 3 GB free, jobs wait instead of freezing the PC.
- **The machine's own settings are the user's call.** `C:\Users\ran\.wslconfig` gives WSL `memory=24GB` of the 32 GB:
  a ceiling, not a reservation, filled mostly with file cache under load. The user kept it (2026-10-12); the slots are
  the fix. If `machine.sh status` still shows Windows short while WSL holds a lot of cache, propose
  `autoMemoryReclaim=dropCache` before a lower cap. Claude Code and every agent run inside WSL, so a low cap would
  swap.

## Changing the style or the prompts

These are the user's call. Start from the current prompts, and change them only when the user asks or approves. After an edit, run `status` across the sections to see what went stale, then `all` for each section. The cache regenerates only what depends on the change.
