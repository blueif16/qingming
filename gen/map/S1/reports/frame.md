# S1 frame step: report (the frame agent, 2026-10-12)

Inputs: the four second-pass proposal files (`gen/map/S1/second_pass/west|willows|farms|start.json`, 50 proposals),
S2's finished frame (`map/frames/S2.json`, option A), S2's route (`map/strokes/S2.json`, `sections/canal/layout.json`).
Outputs: `gen/map/S1/merge_fixes.mjs` sections 8 (second pass) and 9 (frame step), `parts/second_pass.json`,
`map/strokes/S1.json` (244 entities, `check` PASS), `map/frames/S1.json`, `map/world/S1.json`, `map/text/S1.md`,
`gen/map/S1/plan.jpg`, `gen/map/S1/overlay_29050_37610.jpg`, `sections/countryside/layout.json`, and the zoom-1 overlays
`gen/map/S1/look/frame_dense_29900.jpg`, `frame_farms_33300.jpg`, `frame_stream_35900.jpg`. Every decision is listed in
`merge_notes.md`, "Second pass and frame". Scripts: `scratchpad/S1_frame/` (`mkframe.mjs` writes the frame and reads the
seam knot from S2's frame; `questions.json`; `vet.py`; `coincide.py`; `seamcheck.mjs`; `strips.py`).

**Rerun** when the strokes change: `node gen/map/S1/merge_fixes.mjs && node tools/scroll_map.mjs S1 merge && node
<scratchpad>/S1_frame/mkframe.mjs && node tools/scroll_map.mjs S1 all && node tools/map_layout.mjs S1`.

## The knots

One knot, `[29050, -51.6]`: S2's dx at the seam (S2's last knot [28121, -51.6], constant beyond), held to the silk's end.

No ground-level receding edge is painted anywhere in S1. Every unit searched for one and found none (structures_w,
structures_e and t1 reports), and the frame agent agrees:
- the stall counter and the table are frontal;
- fences, hedges, banks, the field lines and the 菜地's rows all run along the scroll;
- no farmhouse shows a side wall;
- the threshing floor has no edge.

Rejected candidates, with their slopes and implied dx:

| candidate | slope | dx | why rejected |
|---|---|---|---|
| the hall's west hip | −1.20 | +43 | a hip |
| the stall shed's east hip | +0.85 | | a hip |
| the farmhouse wing's two wall feet | +0.44, −0.34 | +126 or −92 as a turned box | no single dx |
| the shed on posts' post pair | +0.51 | −100 | |
| the bridge's post pairings | +0.76 or −0.41 | −67 or +126 | pairing unreadable |
| the stream bank's waterline | −2.1 | +24 | a curving bank |
| the tipped barrow | +0.39 | | lies at an angle |
| the far raised path | +0.88 to +0.91 | | runs diagonally on the ground |
| the sedan's poles | −0.29 | | the sedan heads west-south-west |

The two post pairings that can be read at all lean up-left, the sign of S2's east knot.

The dx itself is the lead's call, with S2's turn (frame questions, first item):
- **Option B (S2 holds +46.6):** S1's knot becomes +46.6. One rerun of `mkframe.mjs` picks this up, because it reads S2's knots. Far things in S1 then move 38.9 m west at the silk's top and 13.9–20.8 m on the route.
- **A frontal reading (dx 0):** far things move 20.4 m west at the silk's top and 7.3–10.9 m on the route.

Any held value keeps everything unfolded. A ramp from −51.6 at S4b's suggested 1.5 px/m per 100 px would reach 0 at u ~32490.

## Supports

| support | H (m) | how |
|---|---|---|
| `ground` | 0 | the countryside ground, one level (bank rises are the ground pilot's) |
| `water` | −0.7 | copied from S4b; the 汴河 does not reach S1 (S2's river turns south at 28968) |
| `stream` | −0.7 | measured at the bridge: the deck's south edge over the post foot straight below at u 36540 (54 px, −0.70) and 36352 (52 px, −0.68); the west bank's top over its waterline (58 px, −0.75) |
| `bank slope` | −0.38, −0.59 | `H_profile` at u 35920 and 36070: where the two big elms' feet sit on the stream's west bank face, H = −0.7·(v_foot − v_top)/(v_water − v_top) |
| `perched: S1.tree.elm_slender_33906` | 8.96 | the nest over the tree's foot |
| `perched: S1.tree.bare_elm_twin_34552` | 6.90 | the nest over the tree's foot |
| `perched: S1.tree.bare_elm_tall_34703` | 7.73 | the mean of its two nests (8.12, 7.34): each nest maps about 0.6 m off the trunk |
| `perched: S1.tree.elm_34110` | 7.25 | the pale bird (low) |
| `animal S1.ani.horse_party_31023`, `…donkey_traveller_30216`, `…donkey_traveller_30546` | 0 | a rider's foot is the ground under his seat |

Nobody stands on the bridge and nobody is painted in the sedan, so the frame has no `small bridge deck` and no `sedan:`.

Lines on the water's edge stand on `stream` (merge_fixes section 9 (d)):
- the feet of `bank_36900`, `bank_36060` and `dyke_36380` (they are the stream's shore_n);
- with the pale band's water reading, the feet of `bank_33650` and `bank_35200`;
- the four land tongues and the shoal (both edges are waterlines).

The near bank's top stays on the ground. The water lies 1.05 m north of it, with the bank's slope between.

## Checks (real size, `checks_result`)

The bridge's span is 6.55 m and its deck runs at 3.4°. The stream is 14.3 m wide at the bridge.

| thing | measured | against |
|---|---|---|
| donkey D4's hoof span | 0.95 m | real size fits |
| the travellers' donkey's hoof span | 0.87 m | real size fits |
| the ox's hoof span | 1.00 m | real size fits |
| the sedan | 3.77 m | real size fits |
| the shed on posts' eave | 2.27 m | real size fits |
| the hut's eave | 2.01 m | real size fits |
| the great willow G1 | 12.2 m | real size fits |
| the stall shed's eave | 1.58 m | painted small |
| the stall shed's front | 5.9 m | painted small (expect 8–12 m) |
| the hall's eave over its veranda | 0.65 m | painted small |
| the big farmhouse's eave | 1.34 m | painted small |
| its corner post | 0.51 m | painted small |
| the barn's eave | 0.91 m | painted small |
| the barn's front | 4.1 m | painted small |
| the threshing floor | 5.0 × 2.9 m | painted small |
| the sampan | 2.97 m | painted small |
| the gate post | 0.65 m | painted small |

The things painted small are built at real size in their painted places (rule 5).

## Strips and the diminution

The route's strip:

| stretch | u | depth (m) |
|---|---|---|
| the village | 29050–30350 | 6.0–9.5 |
| the hut | 30750–31350 | 1.8–4.4 |
| under the great willows | 31450–31950 | 0.88–1.07 |
| in front of the farmsteads | 33450–34850 | 0.84–1.1 |
| the floor and the grove | 34900–35900 | 1.5–1.9 |
| the train's path | 35900–36800 | 1.5–2.2 |
| the east end | 36850–37390 | 0.86–1.27 |

In front of the farmsteads, nine trunk feet stand inside the strip. The bends at 30400–30720 and 32000–32800 turn
across the depth, so the strip is not measured there.

The diminution, as painted height over life (1.65 m = 127 px):

| foot v | ratio |
|---|---|
| 141–145 | 0.29–0.35 |
| 329–448 | 0.63–0.76 |
| 541–683 | 0.81–0.91 |
| 766–925 | 0.65–0.97 |
| 1095–1114 | 1.10–1.15 |
| 1476–1627 | 1.35–1.49 |

It is not one curve: the east-end drivers are painted smaller than the party's porters higher up.

## Seams

**S2 (u 29050):**
- The route's three points are equal (S1 copies S2's on every run). The datum is (29050, 730), world (281.07, 16.29), station +314.87.
- The painted area's west corners equal S2's east corners: (267.21, −4.39) and (290.62, 30.54).
- Cross-key check within u 28750–29350: no same-kind pair under 30 px, and no line overlap in u.
- The far field line `edge_v155` now starts exactly on S2's `bank_lines_top_28900` edge_n end (29050, 150). It was 2 px off.

Seam notes for S2:
- S2 did not record its curved line (29000, 81)→(29050, 106).
- S2's edge_s ends at (29050, 192, est) and has no S1 line.
- S1's edge_v57 runs west to ~(28960, 58).

**East end:** the silk ends at u ~37610 and there is no neighbour. The route ends at the seal's west edge (37390, 1005, est).

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", steps 2, 3 and 5)

- **Keep `merge_fixes.mjs` idempotent through the second pass.**
  - A rename after a retirement must skip the entity that takes over the ID. Its own MERGE note names the retired ID as history: S1's `renameRefs` made two notes say their own entity was retired.
  - A second-pass `replace_in_note` that rewrites an earlier MERGE note must stop that note being added again. `noteOnce` checks a prefix, so the next run doubled it.
  - Test both ways after every edit: run twice, and rebuild from the units' original parts. Both must give the same files.
- **Vet and apply proposals by path.**
  - Before applying, check every proposal's `was` values and replaced note strings against the merged map (S1: `vet.py`).
  - Apply `set` keys as deep paths: `pts.base.se`, `pts.lines.ridge_n`, `null` to delete a point, `(append)` to extend a line.
  - A setter that only knows top-level `pts` keys writes `pts["base.se"]` silently.
- **When a whole section has no ground-level receding edge, hold the neighbour's seam knot to the end.**
  - No ramp is needed and nothing stretches.
  - In the questions, say in metres what the alternatives move at the silk's top and on the route: the neighbour's other option, a frontal dx 0, a weak candidate.
  - Have the frame script read the seam value from the neighbour's frame, so the lead's choice there carries over with one rerun. (S1 holds S2's −51.6.)
- **A ground line drawn on the water's shore stands on the water's support.**
  - Compare every `grd` line's points with the water entities' shore lines (S1: `coincide.py`).
  - Give a bank's foot that is the shore `support_by {bank_foot: <water>}`.
  - Give a land tongue whose both edges are waterlines the water's support.
  - Leave a near bank's top on the ground: the water then lies 1.05 m north of it, the bank's slope between.
  - Without this, one stroke maps to two places 1.05 m apart.
- **A thing on a bank face gets its H from where its foot sits on the face.**
  - Use H = H_water · (v_foot − v_top)/(v_water − v_top) at the foot's u.
  - With a generic half-way `bank slope`, S1's tall elm, drawn 10 px above the waterline, mapped inside the stream.
  - When only those things use the support, an `H_profile` in u carries the per-foot values.
- **Copy the neighbour's seam points on every run, lines as well as the route.** A ground line split at the seam (S1's far field line, 2 px off S2's) takes the neighbour's exact end point in `merge_fixes.mjs`, read from its strokes.
