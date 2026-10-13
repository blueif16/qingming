# S2 frame step (the canal wharves), round 2, 2026-10-12

This is the frame agent's report. The decisions are in `gen/map/S2/merge_notes.md`, "Second pass and frame". The code
is `gen/map/S2/merge_fixes.mjs`, sections 6 and 7. The frame is `map/frames/S2.json`.

The scripts are in `scratchpad/S2_frame/`:
- `mkframe.mjs` writes the frame, with `questions.json`;
- `knot_options.mjs` gives X along the silk rows for each knot option, and the world direction of each measured edge;
- `worldcheck.mjs` checks bank tops against shores, the route's strip depths and each crew against its boat;
- `seamcheck.mjs` runs the cross-key seam check.

My crops are `k_*.jpg` in the same folder. The pre-frame parts are in `backup/`.

## Result

- **Second pass:** all 36 proposals accepted (west 11, middle 14, east-middle 3, east 8). I also settled three items the
  passes left to the lead:
  - the west "head" on the scaffold house's ridge is retired as the ridge-end ornament;
  - the second head among 逆水行舟's roof coils is raised to med;
  - the second bare tree's `crown_w` is moved.

  In all, 8 entities were retired and 3 added.
- **Check:** PASS, 398 entities, 17 of them boats. `merge_fixes.mjs` is idempotent. Rebuilt from the merge's 18
  original parts, it gives the same parts.
- **Frame:** seeded from S3:
  - the seam knot is 30.4;
  - the datum is S3's route point (20500, 258, est), at station +179.21;
  - the water is −0.7, copied from S4b.

  It adds four measured knots and 34 supports, plus 23 checks and 8 questions.
- **`all` and `map_layout`:** both run. The painted area's west corners are exactly S3's east corners. The route runs
  from +179.21 to +314.87.

## Knots

dx = 51.25 / |mean slope| of the group, at the group's mean u.

| group | edges | mean slope | knot |
|---|---|---|---|
| seam | S3's last knot [19830, 30.4], constant | | [20500, 30.4] |
| west | the shop row's east side (ground) −1.13; the gateway's low roof −1.18 and −1.26 | −1.19 | [22185, 43.1] |
| middle | 9 edges of the eatery and shop-front furniture, from −0.53 to −1.5 | −1.07 | [23989, 48.3] |
| middle-east | 沿河雅座's table −1.0; the far-street table −1.2 (both low) | −1.10 | [25924, 46.6] |
| east | 10 edges of the sheds' tables, by structures_e, t10 and t11, from +0.72 to +1.25 | **+0.99** | **[28121, −51.6]** |

**The direction turns over.** I checked it on my own crop of the tiled shed's tables: every short side runs down to the
right. Three things agree with the turn:
- the 望火楼 pavilion's back posts stand 45 px to the left of its front posts;
- 王家纸马铺 is drawn frontal;
- the line between the two knots crosses 0 at about u 26960, where 王家纸马铺 stands.

The ramp −4.47 px/m per 100 px stretches the rows, and nothing folds:

| option | knots east of 25924 | X stretch at mid-water / route / north strip / silk top | route 25900–28250 | east edges' direction (90 = square) |
|---|---|---|---|---|
| **A, used** | to −51.6 at 28121 | ×1.45 / 1.75 / 2.1 / 2.35 | 53.9 m | 82° and 99° past 28121; 124–131° inside the turn |
| B, hold | +46.6 constant | ×1 | 34.4 m | 139–145° everywhere |
| C, limited ramp | to +13.7 at 28121 (1.5 px/m per 100 px) | ×1.16 / 1.25 / 1.37 / 1.45 | 40.7 m | 125–140° |

**Wall checks:**
- west, the shop row's side: 91.2°;
- middle, the eatery table: 92.0°;
- middle-east, 沿河雅座's table: 85.9°;
- 王家纸马铺's front: −0.3°.

S1 seeds from −51.6. S1's structures_w found no ground edge in 29050–33000. A slow ramp inside S1 back to its weak +24
(+1.1 per 100 px) does not fold.

## Supports (each from two stroke points, or assumed)

| support | value | how |
|---|---|---|
| `ground` | 0 | |
| `water` | −0.7 | copied from S4b. S2's own bounds agree: ≥ −0.99 at the landing steps, ≥ −1.0 at u 25250, \|H\| ≤ 3.2 in the east |
| `bank slope` | −0.35 | assumed, half way down |
| terrace floor | 0 | the sill is level with the bank top |
| 沿河雅座's upper floor | 1.30 | |
| the 望火楼 platform | 1.13 | a lower bound |
| two table tops | 0.40 and 0.42 | |
| the mule cart's bed | 0.91 | |
| the great willow's birds | 10.47 | |
| the rider's donkey | 0 | |

There are 23 boat keys. Each is water + rise / 77:
- `boat deck: <id>` for 13 boats;
- `boat roof:` for the mat-cargo boat, 豪华客船, 逆水行舟 and the mat-cabin boat;
- `boat stern deck:` for the big cabin boat, the mat-cabin boat and grain boat 1;
- `boat bow deck:` for 逆水行舟;
- `boat after roof:` and `boat ladder:` for 豪华客船.

Every crewman falls between 0.3 m south of his boat's near waterline and 2.5 m north of its northmost recorded
waterline point.

## Real-size checks (frame's `checks_result`)

The eaves on the north bank come out 0.9–2.5 m. They are painted at 0.5–0.85 of life, so built at real size they need
1.2–2 times their painted frontage.

| check | result |
|---|---|
| the warehouse's eave | 3.3 m |
| 王家纸马铺's front | 10.7 m (it is in the stretch) |
| 望楼饭铺's front | 9.1 m |
| the jetty | 5.2 m long |
| grain boat 1 | 8.6 m |
| 豪华客船 | 16.2 m |
| 逆水行舟 | 19.8 m |
| 逆水行舟's mast | 8.6 m |
| the river at u 21000 | 23.2 m |
| the shop-row strip | 0.63 m deep |
| the gateway | 0.94 m |

The boats are painted short against their crews, so the boat kit's real sizes are a recorded choice.

## The strips (the lead asked for each strip's depth)

The route's edge_n to edge_s:

| stretch | depth |
|---|---|
| north-bank strip, u 20500–21800 | 0.56–1.56 m |
| towpath | 2.2–3.1 m |
| long house | 1.1–1.2 m |
| terrace | 1.0–1.3 m |
| eatery | 1.2–2.3 m |
| unloading yard | 4.2–5.9 m |
| **scaffold house, 24700–25100** | **0.20–0.29 m** |
| halls | 0.5–1.6 m |
| warehouse to the great willow | 0.5–0.8 m |
| jetty and lower shed | 0.9–2.5 m |
| porters' wharf and 望楼饭铺 | 6.0–8.2 m |

The frame keeps one scale. The diminution table is structures_w's, in the frame's second question.

## Banks against the water level

North-bank shores that are est and hidden behind moored boats lie only 10–50 px below their bank top. At H −0.7 they
then map north of the top:

| bank | stretch | shore north of the top by |
|---|---|---|
| S2.grd.north_bank_20500 | u 20500–21720 | 0.24–0.86 m |
| S2.grd.bank_n_23300 | 23300–26000 | 0.07–0.46 m |
| S2.grd.north_bank_26000 | 26000–26650 | 0.41–0.76 m |

The south banks are fine. The builder puts the bank face at the bank top there (frame question 3).

## Seams

**S3 (u 20500).** The cross-key check over 20200–20800 finds no same-kind pair under 30 px. The road, the water and both
banks match at 0 px. The painted area meets S3's: sw (160.85, −4.39) and nw (147.06, 30.54).

There are two seam notes for S3, from the second pass:
- the small frame at 20440–20530 is S3's by its middle, and nobody has recorded it;
- S3's south-bank boat runs on to about u 20745.

**S1 (u 29050; the "west seam" for the next area).**
- **Route point:** `S2.road.main`'s last centre point, scan **(29050, 730)**, measured. In S1's strokes this is
  `S1.road.main`'s point 0, marked est. World (281.07, 16.29), **station +314.87**.
- **dx there: −51.6.** This is S2's last knot [28121, −51.6], constant to the seam, so S1's seam knot is [29050, −51.6].
  If the lead takes option B, it is +46.6.
- **Painted area:** S1's west corners must equal S2's se (267.21, −4.39) and ne (290.62, 30.54).
- **Water:** H −0.7. No water reaches u 29050: the north shore turns south under the massive willow and meets the silk's
  bottom edge at (28968, 1780, est).
- **Road edges at 29050:** edge_n (29050, 695, est) and edge_s (29050, 1000, est). Both match S1's at 0 px.
- **Cross-key check over 28750–29350:** no same-kind pair under 30 px. `S2.grd.bank_lines_top_28900` and
  `S1.grd.terraced_fields_29450` are the same lines read twice (2 px apart), and one reading should go.
- **The massive willow** is S1's, by its base: `S1.tree.willow_burl_29090`.

## What was hard

- **The turn of the receding direction** (above). One dx per u cannot give the turn without stretching the far rows.
- **No water face anywhere.** The level is S4b's bound.
- **The route's strips are thin.** In front of the scaffold house the level strip is 10–20 px of v.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 3)

- **A receding direction that turns over is a knot list through zero, not a contradiction.** On S2's east wharf every
  ground-level edge recedes up-left (dx −52), against +47 west of it. A frontal building, drawn with a level floor line
  and no side, marks where the turn passes through 0. If the readings agree within each group, use them: nothing folds
  when dx falls with u. Tabulate what the stretch does to each silk row and to the route's length (`knot_options.mjs`),
  give the lead the hold option with its skewed edges, and say which one the frame uses. (S4b's case is different: two
  sides of one road disagree at the same u, so no knot can hold both.)
- **A steep knot ramp skews short edges even where both ends are right.** Inside S2's turn (−4.5 px/m per 100 px), a
  table's short side at slope +1 maps 124–131° instead of 90°, because the drift itself stretches u. Check edge
  directions past the last knot as well as inside the ramp.
- **Give every raised deck its own support.** A boat's waterline-to-deck rise ranges from 32 px (逆水行舟's bow) to
  298 px (the mat-cabin boat's poop) on one hull. Name `boat stern deck:`, `boat bow deck:` and `boat after roof:`
  wherever crew stand on them, and check each crewman's world D against his hull's waterline points (`worldcheck.mjs`).
- **Fix route edges to the fronts the buildings' owner read.** Where the route's agent left edge_n est and the
  structures agent measured the front, set the edge to the measured front, and add a point where the yard opens behind
  a shed's end, or the edge cuts through the shed.
