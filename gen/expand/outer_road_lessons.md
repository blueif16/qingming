**Merged into scroll-section "Mapping a section" (steps 1, 2 and 5), "What the outer road and the inner city
taught" and "Pitfalls of running agents in parallel", web-scene "Building a new section", characters "Routines" and
"Casting a big section", 2026-10-12** (round 1; checked by the round-2 records agent).

# Outer road (S4 part 1): lessons for the next area

From the east area agent after Run 1 (restyle, map, layout, needs), 2026-10-11/12. The record of the run is
`sections/outer_road/notes.md`; the merge decisions are `gen/map/S4/merge_notes.md` and `gen/map/S4/merge_fixes.mjs`.

## How the work was split, and how it went

- **Restyle first, in the background.** `section.json` (the gate's, rect 9248 + 3504 × 1792 on multiples of 16, which
  covers the area plus 150 px past both ends) and `scroll_pipeline.mjs outer_road all` ran while the mapping brief was
  written: 9 images, all first time, about 8 minutes with registration. The mosaic was ready before the tile agents
  needed it.
- **Five mapping agents at once:** four tiles of 800 px (9400–10200, 10200–11000, 11000–11800, 11800–12600, each
  looking 150 px past both ends) and one structures agent for the whole area. Tiles took 27–37 minutes; the structures
  agent took 81 minutes (28 entities with footprints, the road's three lines, and a receding-edge table). Start the
  structures agent first or give it half the area each: it is the critical path.
- **Two second-pass agents** (west and east halves) on the merged map, writing proposals to
  `gen/map/S4/second_pass/<half>.json` instead of the parts, so the lead accepts or declines each one in
  `merge_fixes.mjs`. They proposed 8 missing things and found 4 misreads: 5 were accepted as entities, 1 became part of a building (a railing's capped post read as a bush), 2 were declined with reasons (a roof corner the crops don't confirm, a staff that is part of its holder), and all 4 misreads were fixed. Worth it:
  a fresh pass with the merged overlay catches what no tile owned (a child named only in its carrier's `what`, a bird
  named only in a willow's note, ox heads drawn one ox too far west, a gate column 25 px off).
- **The lead's own pass** was the "left to" lists: the structures agent and the tile agents each listed what they left
  to the other. Comparing the two lists found the things that both had left (a plank board, a stair rail, a counter);
  every one of them was settled in `merge_fixes.mjs`.

## What the restyle got wrong (read it beside the scan, never alone)

- It turned an old willow's second stem into a man in a red robe, the white horse lying in the courier yard into a
  bush, the courier post's planked ditch into a rail fence and the humped little bridge into a heap of brushwood.
- It added people where the strokes have none (a man in blue where a donkey stands, a seated person in the big basket,
  a child beside a soldier, a herder for the pigs) and dropped a perched bird.
- It is right far more often than wrong about what a faded thing is (the carried sedan chairs, the seated soldiers,
  the spears against the stakes), so it is the right tool for reading faded silk, and the wrong tool for counting.
- The registered bottom-row tiles carry a smeared strip along their top edge (the rows registration clamps); read
  figures there from the mosaic, which drops it.

## What was hard to read

- **Crowds under parasols and awnings** (u 9600–10200): the silk is darkened there. Count heads at zoom 3 with the grid.
- **Faint things that change the cast or the build:** a third ox for the second cart (two arcs, not resolvable), a
  seventh-and-eighth soldier in one hunched mass (one figure and the foot of a spear), a figure under an eave (a robe
  or a hanging cloth). Record them with `conf: low` and a note with both readings; never drop them silently.
- **Buildings south of the road** are seen as roofs only; their bases lie behind the roofs or below the silk's edge
  (est corners at v 1880–1930). Their ridges run in different directions (−1.28, −0.56) and one roof's ridge and eave
  are not parallel: the footprints are placeholders.
- **Supports for unusual figures:** a driver seated on a cart's front (0.9 m), a child held at a shoulder (foot at the
  carrier's foot, as S6's `shoulders`), a bird in a tree (H from the tree's depth).

## Frame findings

- **The receding direction barely drifts here:** measured 36 at u 10270 (a hall's ridge and eave, −1.28 and −1.61)
  and 31.6 at u 11420 (table and bench edges, −1.4 to −2.0, and the ditch's end, −1.6), against S5's 32.125 at the seam.
  East of u 11420 only high lines recede and they are shallow (−0.56 to −0.61); the frame keeps 31.6 and lists it as a
  question. Ground-level edges (furniture, ditches, decks) are the trustworthy ones; eaves and ridges flatten.
- **The painter shrinks things up the silk:** standing adults are 150–195 px on the road, about 0.9 of that at v 850,
  0.8 at v 630, 0.5 at v 320 and 0.3 at v 220 (the monk at the temple). Eaves agree (the courier gate 2.5 m, the shop
  1.4 m, the temple 1.5 m, a house 0.7 m at 77 px/m). This is what `map/BUILDING.md` rule 5 now handles (real size,
  painted place); measure it per section with figure heights against foot v, since it is the cheapest evidence.
- **The seam is exact:** with the seam knot [9400, 32.125] the painted area's west corners equal the gate's east
  corners to the centimetre, and the route's stations run on from +26.05.

## Workflow notes

- **Each agent needs its own scratchpad folder.** Agents of both areas share one scratchpad: S4's t1 agent ran a
  script with a generic name that S6's t1 agent had overwritten, and it rewrote `gen/map/S6/parts/t1.json` once (the
  S6 agent rewrote it again a minute later). Tell every agent: scripts in `scratchpad/<area>_<agent>/`.
- **Brief the ownership of in-between things explicitly.** Awnings, parasols, stalls and signboards on poles are props
  (tile agents) even when they lean on a building; writing attached to a building is part of it. The two agents still
  each left a few things to the other; the "left to" lists are how the lead finds them.
- **Seam entities are a seam note, not a duplicate.** S4 mapped the team and drivers of S5's cart, and gave the cart's
  front, shafts and yoke as a note on S5's ID.
- **Tool notes for the lead:** `scroll_map.mjs` gives far-north things odd station ranges when the route bends (the
  nearest-segment rule snaps them to a bend's vertex: the temple's 1.6 m side door spans stations +28.6 to +41.8);
  S5's `merge_fixes.mjs` tests the cart's note with `/seam/`, which is case-sensitive, so "Seam entity…" is appended
  on every run (it appears six times in `map/text/S5.md`); custom point names in `pts` (an awning's eave points, a
  sign's `top`) pass the check and are ignored by `world`, which is fine but undocumented.

## Text to add to the skills

**`scroll-section`, "Mapping a section", after step 1 (exact text):**

> - **Restyle while you brief.** Run the section's restyle in the background while you write the tile brief; the
>   tile agents need the mosaic for faded silk.
> - **Ownership of in-between things.** Tell the agents in the brief: awnings and canopies on their own poles,
>   parasols, stalls and signboards on posts are props (tile agents) even when they lean on a building; writing,
>   plaques and notices attached to a building are part of it (structures agent). Ask every agent to end its report
>   with a list of the painted things it saw and left to another agent; compare the lists when merging.
> - **Give every agent its own scratchpad folder** (`scratchpad/<section>_<agent>/`): agents of other areas share the
>   scratchpad, and a script with a generic name gets overwritten.
> - **Run a second pass with fresh agents** on the merged map (one per half of the area). They write proposals to
>   `gen/map/<S>/second_pass/<half>.json`, never to the parts or the map; the lead accepts or declines each in
>   `merge_fixes.mjs` with the reason. On S4 it found a child named only in its carrier's `what`, a bird named only
>   in a tree's note, two ox heads drawn one ox too far west, and a gate column 25 px off.

**`scroll-section`, "What the gate taught", new bullets (exact text):**

> - **The restyle is for reading, not counting.** On S4 it turned a tree's stem into a man, a lying horse into a bush
>   and a planked ditch into a fence, and added people the strokes don't have. Record nothing because the restyle
>   shows it; read faint things at zoom 3 on the scan with the restyle beside it.
> - **Measure the receding direction on ground-level edges** (furniture, ditches, decks, a wall's foot). Eaves and
>   ridges flatten with height (S4: ground −1.4 to −2.0, high lines −0.56 to −0.61); use them only when nothing at
>   ground level recedes, and say so.
> - **Measure the diminution up the silk** from figure heights against their foot v (S4: 0.9 of the road's size at
>   v 850, 0.5 at v 320, 0.3 at v 220). It is the evidence for `map/BUILDING.md` rule 5 (real size, painted place).

**`characters`, "Routines", one sentence (exact text):**

> - A child carried in arms or on the back is its own map figure (support `carried in arms`, `shoulders` or
>   `carried on back`, foot at the carrier's foot); cast it as the child and hold it at the carrier.

## Run 2: build lessons (2026-10-12)

### How the work was split
- **Three subagents in parallel with the builder:** the kit agent (24 parts in `blender/kit_outer_road.py`, the sign
  atlas, a review sheet), the casting agent (`people.json` from a rerunnable generator,
  `gen/sections/outer_road/make_people.py`), the backdrop agent (one panel, four takes, one kept). The lead wrote the
  scene builder at the same time against **fixed kit signatures given in the kit agent's brief**: the builder ran
  against a 60-line stub of the kit (`scratchpad/S4_lead/stub/kit_outer_road.py`, plain boxes) before the kit
  existed, so layout, edges, walks and placement were debugged while the parts were still being made.
- **The casting generator is the right tool:** it models the kit's real sizes (cart bodies, sedan cabins, animal
  bodies) and prints every overlap, so nudges are computed with reasons instead of guessed; rerun it after any build
  or map move.

### What the build taught
- **Real size moves things the map didn't:** the kit's real-size cart bodies (3.9 m, centred on the painted wheel)
  end up to 1.9 m from the painted fronts, so the oxen in the shafts and a driver on the seat must be moved with a
  reason. Record animal moves in `build_choices.json`; `map_layout.mjs` moves only `pos`, so a builder that takes a
  team from `pts.fore/hind` must add the move itself (`outer_road_scene.team` does).
- **Animals have bodies:** a painted pig herd closed the obvious walk up the side road; walks must route round them.
- **Raised ground changes D:** things on a bank are mapped at H 0 and so read about 1.5 m of depth per metre of
  height too far north; consistent among themselves, so build the bank where they are rather than correct the map.
- **Kit faces:** a double-sided face made as two triangles sharing vertices is dropped by `mesh.validate()` and
  misaligns the bucket's explicit UVs; materials are double-sided on export, so thin things are single faces. The
  builder now warns and falls back to box UVs if it happens.
- **Mind the seam's ground:** the gate's ground covers its whole EXTENT rectangle, up to 19 m into S4 at the north;
  S4's ground stops 0.5 m past the seam and dips 0.12 m toward it (as S6 does), but the gate's should stop at its
  seams.

### Text to add to the skills

**`web-scene`, after the Build row's paragraph (exact text):**

> - **Write the builder against fixed kit signatures.** When a kit agent makes the parts, put the exact signatures
>   in its brief and build first against a stub of the kit (plain boxes, same signatures) in your scratchpad: the
>   layout, the edges, the walks and the people can be checked before the parts exist.
> - **Real-size vehicles move their teams.** The kit sizes carts and sedans for real and centres them on the painted
>   wheel or cabin, so the animals in their shafts and the people on their seats may need recorded moves or nudges;
>   take a team's hooves from the layout plus its recorded move (`layout.moved`), so the harness follows.

**`characters`, "Routines", a sentence (exact text):**

> - Generate people.json from a script that knows the kit's real sizes (`gen/sections/outer_road/make_people.py`):
>   it computes each nudge with its reason, routes the walkers round bodies, carts and buildings, and prints every
>   overlap; rerun it after the build or the map moves.
