# S3 bridge unit: the Rainbow Bridge (虹桥)

Unit `bridge` (round 2, 2026-10-12). Part: `gen/map/S3/parts/bridge.json`. `check` PASS. Crops: `gen/map/S3/look/bridge_*`
(the full self-overlays are `bridge_self.jpg`, `bridge_self_s.jpg`, `bridge_self_n.jpg`; the traced lines on contrast-
stretched crops are `bridge_geom_ov.jpg` and `bridge_final_ov.jpg`). Scripts: `scratchpad/S3_bridge/` (`band.mjs` traces
the deck edge, `crop.mjs` makes contrast-stretched gridded crops, `htab.mjs` and `build.mjs` compute the heights).

## Counts

| kind | n | IDs |
|---|---|---|
| structure | 1 | `S3.str.rainbow_bridge` |
| prop | 2 | `S3.prop.bridge_end_post_19026` (south-east 表木), `S3.prop.bridge_end_post_20050` (north-east 表木) |
| group | 1 | `S3.grp.rainbow_bridge` (the bridge and its two posts: one set piece) |
| figures, animals, boats | 0 | all on or around the bridge are the tiles' and river_e's (left-to list below) |

## The reading, in one paragraph (it changes the deck model)

The painted east face of the bridge (the woven arch, the outer deck beam, the railing) runs from the south bank at the
picture's lower left (deck edge visible to (18815, 1072)) over the hump to the north bank at the upper right, where the
near railing ends at a capped post at (20027, 325–396). **The deck's width lies across the picture, not up the silk.** The
far (west) railing is not painted; the people and stalls on the south ramp spread west of the near railing until they meet
the upstream water at (18490, 395) → (18300, 700), 700–800 px west of the near edge at the same v. At the crown the deck
shows only as the row of people above the near railing, and the north ramp's surface is hidden behind the crown. This is a
bridge running south to north whose deck surface is seen from above on the south ramp. Consequences:

- The painted edge is the **east** edge. I named the lines `deck_e` (painted), `deck_w` (hidden, est) and `deck_c` (the
  centre line, est), not `deck_s`/`deck_n` as the tile brief suggested. Base corners follow (front = south): `se` and `ne`
  are `deck_e`'s feet, `sw` and `nw` `deck_w`'s.
- **Heights are level across the deck in the picture.** A point on the visible south ramp has the H of the `deck_e` point
  at its own **v**, not its own u. A u-keyed `H_profile` (the tool as it is) gives everything west of u 18810 H 0: the
  sedan of 车轿相争, the stalls by the water and the crowd at u 18300–18810 would be placed as if on the ground (rule and
  numbers below).

## The deck edge `deck_e` and how it was traced

`deck_e` is where the near railing's posts stand: the upper edge of the light outer beam of the arch, a band 16–20 px wide
directly under the railing (at the crown: railing base v 280, beam 280–298, then the arch timbers to the underside at
v ~320). I traced it with a brightness profile across the band every 8–20 px along a rough hand line (the hand line was
10–30 px off on the flanks), dropped the stations where the band was crossed by figures or the post's crossbar, smoothed
along the curve (σ 6 px) and resampled every ~48 px. The north end (u 19900–20025), where the big boat's mast lines cross
the railing, was read by eye on zoom-3 crops (±8 px). The south foot is hidden: the edge is visible down to (18815, 1072),
then goes behind the heads of the people standing on the south bank (their feet at v ~1290).

Points, scan px (u, v), with the deck H at each (derivation below):

| u | v | H (m) | | u | v | H (m) | | u | v | H (m) |
|---|---|---|---|---|---|---|---|---|---|---|
| 18810 | 1090 est | 0.00 | | 19107 | 552 | 4.78 | | 19561 | 285 | 4.88 |
| 18815 | 1072 | 0.20 | | 19140 | 518 | 4.98 | | 19610 | 280 | 4.59 |
| 18824 | 1044 | 0.49 | | 19174 | 483 | 5.18 | | 19659 | 280 | 4.22 |
| 18842 | 998 | 0.96 | | 19210 | 451 | 5.33 | | 19709 | 287 | 3.76 |
| 18870 | 933 | 1.59 | | 19250 | 423 | 5.40 | | 19756 | 296 | 3.29 |
| 18890 | 887 | 2.04 | | 19290 | 397 | 5.44 | | 19808 | 310 | 2.73 |
| 18911 | 843 | 2.46 | | 19332 | 373 | 5.44 | | 19854 | 325 | 2.19 |
| 18935 | 798 | 2.86 | | 19375 | 349 | 5.43 | | 19897 | 346 | 1.60 |
| 18961 | 751 | 3.28 | | 19419 | 329 | 5.37 | | 19941 | 367 | 1.00 |
| 18988 | 711 | 3.60 | | 19465 | 311 | 5.26 | | 19990 | 386 | 0.39 |
| 19019 | 668 | 3.93 | | 19512 | 296 | 5.10 | | 20025 | 396 | 0.00 |
| 19045 | 627 | 4.27 | | | | | | | | |
| 19075 | 589 | 4.54 | | | | | | | | |

`deck_w` = `deck_e` shifted 750 px west at the same v (all est); `deck_c` = shifted 375 px west (est). Point i of each line
has the same H as point i of `deck_e`.

## The deck's height profile `[u, H]`

**Derivation.** The east face is a vertical plane, so the point straight below a deck-edge point (same u) on level ground
lies on the face's ground line, the straight line through the edge's two feet: `se` (18810, 1090, est) and `ne`
(20025, 396), slope −0.5712. For each row, H = (v of that ground line at u − v of `deck_e` at u) / 77, metres above the
ground (`ground`, H 0). The waterline cannot be used: the arch's springings at both banks are hidden (south: behind the
crowd; north: behind the mast lines), and the shore under the arch is hidden behind the mat-roofed stall. The arch's own
symmetry cannot fix the tilt either (I tried: a sheared symmetric arch fits a wide range of slopes).

Profile for the frame's support `bridge deck`, one pair per ~100 px with extra pairs on the steep flanks:

| u | v `deck_e` | v ground line | H (m) | H if the south foot is at v 1290 | H if the deck lands at (18905, 862) |
|---|---|---|---|---|---|
| 18810 | 1090 | 1090 | 0.00 | 2.41 | below ground |
| 18850 | 979 | 1067 | 1.14 | 3.47 | below ground |
| 18900 | 866 | 1039 | 2.24 | 4.47 | below ground |
| 18950 | 771 | 1010 | 3.11 | 5.24 | 0.94 |
| 19000 | 694 | 981 | 3.73 | 5.76 | 1.66 |
| 19050 | 621 | 953 | 4.31 | 6.25 | 2.35 |
| 19100 | 560 | 924 | 4.73 | 6.56 | 2.87 |
| 19200 | 460 | 867 | 5.29 | 6.93 | 3.63 |
| 19300 | 391 | 810 | 5.44 | 6.88 | 3.98 |
| 19400 | 338 | 753 | 5.39 | 6.63 | 4.14 |
| 19500 | 300 | 696 | 5.14 | 6.18 | 4.09 |
| 19600 | 281 | 639 | 4.65 | 5.49 | 3.79 |
| 19700 | 286 | 582 | 3.84 | 4.49 | 3.19 |
| 19800 | 308 | 525 | 2.81 | 3.26 | 2.36 |
| 19900 | 347 | 467 | 1.56 | 1.81 | 1.31 |
| 19950 | 370 | 439 | 0.89 | 1.04 | 0.74 |
| 20000 | 389 | 410 | 0.28 | 0.33 | 0.23 |
| 20025 | 396 | 396 | 0.00 | 0.00 | 0.00 |

Ready to paste:

```
"bridge deck":        H_profile [[18810,0],[18850,1.14],[18900,2.24],[18950,3.11],[19000,3.73],[19050,4.31],[19100,4.73],[19200,5.29],[19300,5.44],[19400,5.39],[19500,5.14],[19600,4.65],[19700,3.84],[19800,2.81],[19900,1.56],[19950,0.89],[20000,0.28],[20025,0]]
"bridge west edge":   H_profile [[18060,0],[18100,1.14],[18150,2.24],[18200,3.11],[18250,3.73],[18300,4.31],[18350,4.73],[18450,5.29],[18550,5.44],[18650,5.39],[18750,5.14],[18850,4.65],[18950,3.84],[19050,2.81],[19150,1.56],[19200,0.89],[19250,0.28],[19275,0]]
"bridge centre line": H_profile [[18435,0],[18475,1.14],[18525,2.24],[18575,3.11],[18625,3.73],[18675,4.31],[18725,4.73],[18825,5.29],[18925,5.44],[19025,5.39],[19125,5.14],[19225,4.65],[19325,3.84],[19425,2.81],[19525,1.56],[19575,0.89],[19625,0.28],[19650,0]]
```

`S3.str.rainbow_bridge` already carries `support: ground` (its four feet) and
`support_by: {"deck_e": "bridge deck", "deck_w": "bridge west edge", "deck_c": "bridge centre line"}`, so with the three
supports in the frame each line point gets its own H (`world` reads an `H_profile` at each point's own u). The highest deck
H is 5.44 m at u ~19330; the picture's highest deck point (19610, 280) is at 4.65 m (the hump's top is left of the picture's
top because the bridge recedes to the upper right).

**Which column.** The primary column takes the south foot just below the last visible point of the edge. The south foot
could be lower (hidden down to the feet of the people in front, v ~1290: second column), or the deck could land on the bank
higher, with the steep band below being the arch going down to its springing (third column). Nothing painted settles it;
the primary is the smallest assumption. The north foot (capped end post) is firm, so all three agree north of the crown.

## Figures on the deck: H by v on the south ramp (for the lead; a tool change)

For everyone standing on the visible south ramp, H is the profile at u* = the `deck_e` point (south of the picture's top,
u ≤ 19610) that has the figure's own foot v; for figures at the near railing, on the crown and on the north ramp, u* = their
own u. One rule covers both: **u* = max(u, u_s(v))**, with u_s(v) from this table (v < 280 → 19610):

| v | u_s | H (m) | | v | u_s | H (m) |
|---|---|---|---|---|---|---|
| 1090 | 18810 | 0.00 | | 600 | 19067 | 4.46 |
| 1050 | 18823 | 0.44 | | 550 | 19109 | 4.80 |
| 1000 | 18842 | 0.94 | | 500 | 19158 | 5.08 |
| 950 | 18863 | 1.43 | | 450 | 19212 | 5.33 |
| 900 | 18885 | 1.92 | | 400 | 19286 | 5.43 |
| 850 | 18908 | 2.40 | | 350 | 19374 | 5.43 |
| 800 | 18934 | 2.85 | | 320 | 19442 | 5.31 |
| 750 | 18962 | 3.29 | | 300 | 19500 | 5.15 |
| 700 | 18996 | 3.69 | | 290 | 19539 | 4.98 |
| 650 | 19031 | 4.08 | | 280 | 19610 | 4.59 |

What the u-keyed profile alone would do (H at the figure's own u, flat 0 west of 18810):

| example foot (u, v) | rule u* → H | u-keyed H | error in depth (1.5 m per m of H) |
|---|---|---|---|
| the sedan of 车轿相争, (18750, 578) | 19085 → 4.62 | 0 | ~6.9 m |
| a stall by the upstream water, (18420, 640) | 19037 → 4.17 | 0 | ~6.3 m |
| a robed man low on the ramp, (18580, 1010) | 18838 → 0.84 | 0 | ~1.3 m |
| a figure at the near railing, (19050, 615) | 19055 → 4.36 | 4.31 | — |
| a figure at the north ramp's railing, (19800, 300) | 19800 → 2.81 | 2.81 | — |

Until the tool reads `bridge deck` this way, the frame agent can check the south-ramp figures by hand with this table.

**Where the deck leaves the ground (for t5–t7).** South: along v ≈ 1090 (est) between u ≈ 18060 and 18810, at the level
of the lowest visible point of the east edge. Anything standing between `deck_w` and `deck_e` above that line is on the
deck (`bridge deck`); below it is the south bank (`ground`). The people at u 18780–18990 with heads at v 1050–1100 and feet
at v ~1290 stand on the ground in front of the foot. North: the near railing ends at the capped post (20027, 396); the
north ramp's figures stand behind the near railing (feet hidden, est just above `deck_e`).

## The route's deck stretch (for structures_w, `S3.road.main`)

- `deck_c` is the route's deck stretch, foot to foot: it leaves the south bank at **(18435, 1090) est**, crosses the hump
  at (19235, 280) and lands on the north bank at **(19650, 396) est**, its north half hidden behind the arch's near face.
  Copy `S3.str.rainbow_bridge:lines.deck_c` into the road's centre line between those two points and give the road
  `support_ranges: [{"u": [18435, 19650], "support": "bridge centre line"}]`.
- The road's two edges on the deck are the deck's edges: for a road running west to east, `edge_n` (its left side) becomes
  `deck_w` on the bridge and `edge_s` becomes `deck_e`. `support_ranges` applies one support to all three lines in a u
  range, but the three need different profiles: give the road only its centre line on the deck, or the lead extends the
  tool to role and range.
- **North bank, and the painted area:** from the landing the road must climb north before it turns east. East of u 20050
  the north bank's land ends at v ~280–300 (the fronts of the tavern's tables, u 20050–20350); below that are the big
  boat's mast lines and the north-bank boat (u 20330+, v 280–430). The cart "pulled up the bank" stands at
  (19830–19960, 140–260). A centre line from (19650, 396) up past the cart to about (19900, 260), then east at v ~250–280,
  stays inside the painted north bank; the silk's top edge is at v ~20 (about 5–7 m of painted ground north of the road
  at H 0). The setup agent's "lands at about (19950–20000, 280–330)" is the near railing's end and the north bank above it,
  not the deck's centre.

## Real-size checks and frame issues (for the frame agent and the lead)

- **Deck width:** 750 px of u = 9.7 m at 77 px/m (the west boundary of the crowd at the water gives 695–797 px).
- **Railing:** handrail ~50 px above the deck edge = 0.65 m in the frame; the figures at the crown are ~110 px from head to
  the deck edge (1.43 m), so the railing is painted at about half a figure's height and the people on the bridge at about
  0.85–0.9 of the frame's scale.
- **Arch:** depth from the deck edge to the underside 60 px on the flanks (0.78 m) and 40 px at the crown (0.52 m); the
  underside at the crown (19612, 320) is 4.1 m above the ground (plus the water's depth below the ground for the boat's
  clearance).
- **Length and slopes: the painted deck is far too steep to walk.** Foot to foot the east edge spans 1215 px of u and
  694 px of v: 13.5 m of depth at 51.25 px/m. With the crown 5.4 m up, the deck rises 45–70° near the feet and 25–35°
  half-way up (computed along a south-to-north axis; along a north-east axis it is a few degrees less). The painter
  compresses the bridge's length up the silk far more than its height. A walkable deck collider that follows this profile
  will not work: the bridge needs a local stretch (a real-size length with its feet at the painted places) or a lower
  crown, a choice for the lead (`map/BUILDING.md` rule 5).
- **Receding direction:** the foot-to-foot line is the bridge's axis on the ground (slope −0.571), and the deck's width
  is level in the picture (east-west). The bridge is square (axis at right angles to its width) only if the local dx is
  about 90 px/m (51.25 / 0.571). With dx 31.6 (S4b's seam knot) the axis comes out 53° from east and the deck a
  parallelogram skewed by 37°. The frame's knots come from ground-level edges, not from the bridge, so this is a check
  for the frame agent, not a knot.
- **End posts:** the south-east post is painted ~513 px from foot (est) to its cross (6.7 m in the frame), the north-east
  one ~355 px (4.6 m): the far post is painted smaller. Real size is the builder's.

## What was hard

- The south foot is hidden behind the crowd at the south bank; the edge is visible to (18815, 1072) only (three
  readings above).
- The north end (u 19900–20025) is crossed by the big boat's mast lines; the deck edge there is ±8 px.
- The west edge is not painted anywhere. Its position comes from where the deck crowd meets the upstream water
  (v 395–700); south of v ~700 it runs among the shore-side stalls (u 18000–18330), and north of the crown it is hidden.
- At first sight the deck looks narrow at the crown and wide at the south foot; that is the deck surface being visible on
  the south ramp and hidden beyond the crown, not a change of width.
- The restyle was not used (the brief says it recomposes the bridge). The scan was read on contrast-stretched crops at
  zoom 1.2–5.

## Seams

None: the bridge lies inside S3 (u 18060–20050). The north-east post (base u 20050) is S3's; S2's seam at 20500 is not
touched.

## Edges of my range that a neighbour may also record

- Railing end post (望柱) at (20027, 325–396): recorded as custom points `rail_end_n`/`rail_end_n_top` of the bridge (part
  of it), not as a separate entity. t9 should not record it.
- The block clasping the north-east 表木 at (20046–20056, 296–327): part of `S3.prop.bridge_end_post_20050` (`clamp`).
- The square beam ends on the arch face, at the crown (19598–19645, 300–332) and on the south flank (19104–19125,
  571–614): custom points of the bridge (`beam_end_crown`, `beam_end_19115`). The crown one might be a board; conf low.

## Support names used

`ground` (the bridge's feet, both posts). `support_by` on the bridge: `bridge deck` (`deck_e`), `bridge west edge`
(`deck_w`), `bridge centre line` (`deck_c`): **the last two are new support names**; the frame agent adds them with the
profiles above.

## Scale cues and receding edges

- Scale cues (px): railing ~50 high, posts 55–65 apart on the south flank with an X-brace in each panel; outer deck beam
  16–20; arch depth 60 (flanks) / 40 (crown); figures at the crown ~110 to the deck edge; deck width 750 of u; posts ~10
  (south-east) and ~8 (north-east) thick; their crossbars ~90 and ~45 long.
- Receding edge: the bridge's axis on the ground, se → ne, (18810, 1090) → (20025, 396), slope −0.571 (a long structure
  edge, not a ground-level furniture edge: use as a check, see above).

## Left to other agents (painted things I saw and did not record)

- **river_e:** the big boat under the arch (its cabin roof and side seen through the arch at u 19250–19800, v 330–590;
  its bow and crew at u 19500–20450, v 450–800; its mast lines from about (19900, 600) up to (20300, 100), crossing the
  north end of the bridge); any rope from the bridge to the boat; **a long thin object lying on the water just east of the
  arch's south foot, (18926, 968) → (19260, 953), with an upturned hooked east end at about (19255, 940–988)**: a pole, a
  beam or a narrow skiff, conf low; the water under the arch; the boat moored along the south bank (19750–20650,
  v 1080–1220) and the men waving from its roof; the north-bank boat from u ~20330.
- **t6/t7 (deck figures and props, `bridge deck`):** the crowd on the south ramp and at the crown (heads at v 150–300 from
  u 18640 to 19950); the sedan (18720–18790, v 420–580); the mat-awning stall hanging over the near railing
  (18740–18960, v 620–760); the parasol stall and mat-awning stall by the upstream water (18310–18560, v 440–700); the big
  parasol at the south foot (18660–18900, v 880–1000; on the ground or the lowest ramp, by its pole's foot); a parasol on
  the far side near the crown (19060–19220, v 100–170); a dark mass that may be the horse of 车轿相争 at about
  (19180–19240, 250–300).
- **t7/t8 (south bank under the arch):** the mat-roofed stall under the arch's south foot (roof u 19000–19400,
  v 1010–1150) and the people under it; the people standing at the bridge's south foot (u 18780–18990, heads v 1050–1100,
  feet v ~1290).
- **t8/t9 (north bank):** the cart pulled up the bank (19830–19960, v 140–260); a man and a small dark animal (a dog?) at
  (19785–19830, v 165–210) beside it; the people at the north ramp's railing (19650–19950, v 180–330, `bridge deck`); the
  table on the north bank at the bridge's end (19970–20053, v 237–300).
- **structures_e:** the tiled roof of the south-bank building that hides the south-east post's foot (u 18900–19150,
  v 1230–1500); the north-bank tavern (20050–20350, v 30–300); the far-bank open hall on posts (18350–18620, v 100–310).
- **t5:** the shore-side stalls with mat awnings and a big parasol at the south bank (u 17950–18330, v 760–1150), which
  `deck_w`'s south stretch runs through (the strokes don't say whether they stand on the lowest ramp or on the bank).

## Against `reference/scroll/sections.md`

- "South foot ≈ 18400–18900, arch ≈ 18850–20050": consistent. The east edge's foot is at u ~18810, the deck's south end
  spans u ~18060–18810 at v ~1090 (west half est), and the arch's face runs from ~18815 to ~20025. Pin 18 (18920) is on the
  south flank, pin 20 (19240) over the crown's crowd.
- sections.md does not say which way the deck's width lies. The strokes say east-west across the picture (above).

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Trace long structural edges with a brightness profile, not by eye.** On S3 the Rainbow Bridge's deck edge (a light
  beam 16–20 px wide under the railing) was traced by sampling the scan across the band every few px along a rough hand
  line and taking the band's edge (`scratchpad/S3_bridge/band.mjs`); the hand line had been 10–30 px off on the flanks.
  Read the structure first on crops at zoom 1.2–1.6 with the contrast stretched (sharp `normalise`), which show faded
  strokes far better than the plain overlay; zoom 3 and more only for single points.
- **A bridge deck's heights come from its own feet.** H along a deck edge = (v of the edge's ground line − v of the
  edge) / 77, the ground line joining the edge's two feet where it meets level ground (straight below = same u). Hidden
  springings rule out the waterline, and a sheared symmetric arch fits any tilt, so the arch's shape can't fix it. When a
  foot is hidden, give the profile for each plausible foot.
- **Read which way a deck's width lies before naming its edges.** On the 虹桥 the painted railing is the east side; the
  hidden far edge lies about 750 px west across the picture (where the deck crowd meets the upstream water), not up the
  silk. Heights are level across that deck in the picture, so a figure on the visible ramp takes the H of the edge point
  at its own v, not its own u; a u-keyed profile alone puts the whole south ramp (the sedan, the stalls) on the ground.
- **Check a deck's slopes in metres before it becomes a walkable collider.** S3's painted bridge rises 5.4 m over about
  6.8 m of depth each side in the frame (45–70° at the feet): a painted arch can be far steeper than any real deck. Report
  it for a builder's choice; don't build the painted slope.
