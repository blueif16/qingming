# S7 frame agent's report (round 2, 2026-10-12)

Scratch files and crops are in `scratchpad/S7_frame/`: `bench_east_z3.jpg`, `bench_east_z7.jpg`, `board_*_feet_*.jpg`,
`stand_jie_z4.jpg`, `s6board_feet_z4.jpg` and `ov_gate_shop.jpg`, plus the edge-trace scripts copied from the second
pass. The parts before the second pass are in `parts_before/`, and the seed frame is `frame_seed.json`.

## 1. Second pass: all accepted

The decisions are in `gen/map/S7/merge_fixes.mjs`, section "the second pass", in its `DECISIONS` table with a reason
for each. The script applies `second_pass/all.json` as written. Each `replace` runs only where its `from` text is
still there, so a second run leaves the parts unchanged (same md5 sums). The record is in `merge_notes.md`, under
"Second pass".

After the merge the map has **70 entities**: 17 figures, 3 animals, 9 trees, 20 props, 9 buildings, 5 structures,
1 road and 6 groups. `check` **PASS**, with no warnings, because the frame now has both support keys.

## 2. The frame (`map/frames/S7.json`)

- **Origin and scales are the seed's** (S5's): origin (8248, 1565), 77 px/m across the street and in height, and
  51.25 px of v per metre of depth.
- **Knots:** `[[1250, 59.9], [2000, 50.4]]`. The seam knot is S6's and is kept.
  - The west knot comes from the only two ground-level receding edges in S7. Both are on the gate's blocks:
    - the west block's foot, traced from the pixels: −0.870, dx 58.9 (weight 2);
    - the east block's top west edge: −0.82, dx 62 (weight 1, because it is 0.56 m up and only 17 px long).
  - The west block's foot alone scatters about ±12 px/m:
    - its straight front part gives 46.5–49;
    - its recorded corners give 64.
- **Checked against mapped walls:** the west block's east face comes out at 86.9° with these knots, and at 79.9° if
  50.4 were kept constant.
- **Middle and east:** no ground-level edge holds up.
  - The bench by 赵太丞家's east board has two readings, −0.88 and −2.8. At zoom 7 the drawn line is the steep one,
    so the bench is drawn from above.
  - The 解 stand shows only a 10 px corner, and the boards' curled feet run east–west.
  - S6's 解 board feet, just east of the seam, read dx 59.6 and agree with the west knot, so they serve as a check.
- **The high lines are steeper:** dx 41–53, the opposite of S4.
- **Supports:**
  - `carried in arms`: H 0 (the child on the lap).
  - `roof: S7.bld.hall_ns_1620`: H 3.2 m. As with S4's "perched", the crow is taken at the mid-depth of its hall's
    placeholder footprint. In the frame's one scale that height lies between the hall's eave (≈2.3 m) and its ridge
    (≈3.5–3.9 m).
- **Datum:** `S7.road.main:lines.centre.3` = (2000, 1180), station −73.63.
- **Checks** (`checks_result`):

  | check | measured | expected |
  |---|---|---|
  | west block's face direction | 86.9° | 90° |
  | west block width | 0.79 m | |
  | west block height | 0.61 m | |
  | east block height | 0.56 m | |
  | gate lintel | 3.23 m | 2.5–3 m ×1.3 |
  | gate bay | 3.16 m | |
  | 赵太丞家 front | 4.12 m | |
  | 赵太丞家 eave | 3.90 m | 3–3.5 m. S6's corner shop gave 4.1 on the same frame, so painted eaves run high. |
  | 解 eave at its post | 2.74 m | |

- **Diminution:** none across the street band. Adults measure 167 px on the north margin (D 11.5–13.2 m) and 175 px
  in the street (D 5.6–6.3 m), with a 25 % spread within each band. The one-scale frame holds here.
- **Questions for the lead** are in the frame's `questions`:
  - the knot's thin evidence, and what dropping it would do (the gate area moves 1.6 m east at D 13 m);
  - S6's west value was set mostly from high lines, while S6's own ground edge at the seam reads 59.6;
  - the street's hidden south walls (it may be up to about 5 m deeper);
  - the hidden depth on the north side;
  - the placeholder footprints' back corners, which were shifted with dx 50.4 and so sit 2–6° off square in the world;
  - the silk's bottom edge, v ≈ 1770 against `SILK_BOTTOM` 1790;
  - the crow's H, which follows a placeholder footprint.

## 3. Generated and checked

- `node tools/scroll_map.mjs S7 all` runs `check` (PASS), then `world`, `text`, `plan` and `overlay`. I read three
  outputs:
  - **The full overlay:** every marker sits on its strokes. The east block's `sw` is at the corner under the east
    jamb, between the food box and the sack.
  - **The dense window** (gate and shop, u 1050–1600, zoom 1.6, `scratchpad/S7_frame/ov_gate_shop.jpg`).
  - **`plan.jpg`:** the crow is on the hall's east half; the route runs from the datum, X −86.06, to X −103.59.
    Footprints far up the silk lean, as the questions say.
- `node tools/map_layout.mjs S7` → `sections/city_end/layout.json`. It has 17 figures, 9 trees and 38 other
  entities, and no recorded moves. Its `painted_area` meets S6's exactly:
  - se (−78.27, −4.39) is S6's sw;
  - ne (−101.13, 30.54) is S6's nw;
  - the west corners are sw (−93.12, −4.39) and nw (−120.29, 30.54).

## 4. The west seam

There is no next area: u 815 is the scroll's cut edge, with mist beyond it (BUILDING.md rule 4). For the record:
- **Route point:** `S7.road.main:lines.centre.0` = scan (815, 1100) est, world (−103.59, 9.07).
- **Station:** −91.25.
- **dx there:** 59.9, constant west of u 1250.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 3 Frame)

> - **A knot from one short edge needs its scatter.** Trace the edge from the pixels and give three numbers for it:
>   the whole edge, its straight part and its recorded corners. S7's gate block gave 58.9, 46.5–49 and 64. Weight a
>   second edge by its length and height. Then check the knot against a mapped wall's direction (S7's block: 87°
>   with the knot, 80° without), and put what dropping the knot would move into `questions`.
> - **Settle a disputed furniture edge at zoom 7 before you count it.** Two units read one bench's seat edge as −0.88
>   and −2.8. The drawn line was the steep one: the bench is drawn from above, as wells and plank platforms are.
> - **A placeholder's est back corners carry the dx they were drawn with.** When the frame's knots differ from that
>   dx, those footprints come out skewed in the world (S7: 2–6°). Say so in `questions`, so the builder squares them
>   as a `choice:` rather than building the skew.
> - **A roof bird's H, as S4's "perched":** take the bird at the mid-depth of its roof's footprint, so
>   H = (v_ground(D_mid) − v_bird) / 77. Then check that H lies between the roof's eave and ridge in the frame's one
>   scale.
