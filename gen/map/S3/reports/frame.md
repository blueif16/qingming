# S3 frame step (the Rainbow Bridge), round 2, 2026-10-12

The frame agent's report. The decisions are in `gen/map/S3/merge_notes.md`, "Second pass and frame". The code is
`gen/map/S3/merge_fixes.mjs` (sections 8 and 9) and the frame is `map/frames/S3.json`. The scripts are in
`scratchpad/S3_frame/`:

- `mkframe.mjs` writes the frame;
- `deckH.mjs` computes the deck heights;
- `deckeval.mjs`, `kiteval.py` and `deckcheck.py` compare the deck keyings;
- `seamcheck.mjs` runs the cross-key seam check;
- `deck_entities.json` holds, for every deck entity, its painted H, world H and kit H.

## Result

- 45 second-pass proposals, all accepted.
- `check` PASS: 467 entities, 11 boats.
- The frame is seeded from S4b: the seam knot is 31.6, the datum is S4b's route point (15500, 1530) at station +110.35,
  and the water is −0.7.
- Three measured knots: 47.9 at u 16880, 39.2 at 18290 and 30.4 at 19830.
- `all` and `map_layout` have been run. The painted area's west corners are exactly S4b's east corners.

## The bridge deck: what was tried

| keying | world H − painted rule (88 deck entities) | world H − kit on_deck | deck lines' lines_H |
|---|---|---|---|
| u-keyed `bridge deck` along deck_e only | rms 3.3, south ramp at 0 | — | deck_e exact; deck_c, deck_w off by rms 3–4 m |
| `H_profile_X` from the kit's table (the lead's note) | rms 2.9, max 5.4; many at 0 (the solve runs away) | rms 2.1, max 4.4 | deck_e rms 2.2, deck_w rms 4.0 |
| `H_profile_X` along deck_c, deck_e or deck_w | rms 2.5–4.2 | — | rms 2.0–4.0 |
| **u-keyed by offset west of the near edge (used)** | **rms 0.17, max 0.52** | rms 1.76, max 3.29 (the kit's own departures) | **exact** |

The reasons:

- **The axis is not along X.** With S3's knots the bridge's axis runs 50.6° from east. Its width lies east-west in the
  picture (the bridge agent), and its heights are level across it. On the visible deck, H is therefore a function of
  depth D alone, and world X does not fix a point's place along the deck.
- **The tool's solve diverges on the flanks.** It takes 8 undamped steps of H = P(X(H)). dX/dH ≈ 0.7, and the painted
  flanks rise more than 1.4 m per m of X, so the iteration diverges there.
- **The kit cannot match the painted deck.** It builds the deck square and walkable, so it cannot follow the painted
  parallelogram: its fit has rms 2.51 m against the mapped heights, and 58 of the 88 world positions lie on the built
  deck. That gap is the build's departure, settled at build time with `on_deck` or recorded moves.

Tool request for the lead: give `world()` a deck support read at u* = max(u, u_s(v)), or an H_profile keyed by depth
D with a damped solve. Either would let the 17 offset supports collapse into one `bridge deck`.

## Knots

| group | edges (dv/du → dx) | knot |
|---|---|---|
| west, 十千脚店's 杈子 | foot −1.12 (45.8), t2's near rail foot −1.10 (46.6), top rail −1.00 (51.3) | [16880, 47.9] |
| middle, the bridge's south foot | tiled wall's coping −1.56 (32.8), the display board −1.12 (45.6) | [18290, 39.2] |
| east, the open shop's floor | the board's west side −1.52 (33.7) and east side −1.90 (27.0) | [19830, 30.4] |
| not used: the north-bank tavern's tables | −1.22, −1.20, −1.3 (39–43) | a knot there would compress the top rows 6:1 |
| not used: the bridge's axis | se → ne −0.571 (89.7) | squaring the bridge locally folds the plan |

- **Wall check:** the big hall's ridge comes out at 87.9° and 十千脚店's gate's east eave at 88.1°.
- **Ramps:** +1.19 px/m per 100 px between 15500 and 16880 (top rows at 0.64), then −0.62 and −0.57. Nothing folds.

## Seams

**S4b (u 15500).**

- Road: 0 px. The datum is S4b's point. The hidden jog to reading (c) runs 5.8 m north within 1.2 m of X.
- Shores: S3's near shore and bank now start at S4b's points. They were 19 and 15 px apart.
- Far bank: `S3.grd.far_bank_seam_15500` (low) joins S4b's far bank to the silk's top edge, and the willow crown
  `S3.tree.willow_crown_top_15520` stands on it. It is S3's by main point; the lead may give it to S4b.
- No same-kind duplicate within 30 px.
- **The painted area meets S4b's:** sw (95.98, −4.39) and nw (81.65, 30.54).

**S2 (u 20500).**

- The road, the water and both banks match at 0 px.
- Route point: (20500, 258, est), world (149.05, 25.50), station +179.21, dx 30.4.
- Painted area east corners: se (160.85, −4.39) and ne (147.06, 30.54).
- Shores at 20500: north (20500, 310, est), world (149.03, 25.54); south (20500, 1235, est), world (156.16, 7.49).
- The north shore maps 0.86 m north of the bank top. The route runs at the water's edge, and its edge_s lies 0.5 m out
  over the water (questions). S2 starts from this point.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 3)

- **Test an `H_profile_X` before using it.** It works only where the deck runs along world X. Where a bridge's
  width lies across the picture, its axis runs diagonally in plan: on S3 it was 50.6° from east, and an X-keyed
  profile missed by 2–3 m. The tool's 8-step solve also diverges where the profile rises faster than about 1.4 m per m
  of X. Compare the world's H of the deck lines and the deck entities with the set piece's reading before you write
  the frame.
- **A deck that is level across the picture can be keyed by u with offsets.** If the heights are level across the
  picture (the same v gives the same H), a point's height is the near edge's at u* = max(u, u_s(v)). The tool reads a
  u-keyed profile at the point's own u, so give one profile per offset west of the near edge, and let each thing name
  its offset, measured on the strokes. The deck lines and the route (with `support_by` per line, 0 beyond the feet)
  are then exact, and the things on the deck fall within the band's error.
- **Riders need their animal's height.** `world()` takes `animal <id>` as the ground unless the frame names that
  support. On a bridge deck or a boat, give each rider's support its own key.
- **Check a far bank's face against the water level.** A north bank's waterline must be painted at least
  (−H_water × 77) px below its top, or the shore maps north of the bank top. On S3 the est far shores sat 10–46 px
  below, so they map 0.15–0.86 m too far north, and at S2's seam the route ends at the water's edge.
- **A knot from the bridge's own axis can fold the plan.** The bridge's foot-to-foot line is the longest ground line
  in S3 and reads dx ~90, against 30–39 for the furniture around it. Ramping to it within a few hundred px folds the
  plan above D ~10 m, so keep the furniture's knots and let the set piece build square (a recorded skew).
