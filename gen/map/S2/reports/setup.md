# S2 setup report (2026-10-12)

## Written

- `gen/expand/round2/brief_canal.md`: the area brief, in the form of `brief_outer_road_2.md`.
- `gen/map/S2/brief.md`: the tile brief (from S4b's), with the units, hints, seams, supports and the restyle's warnings.
- `sections/canal/section.json` (the whole area's rect, record only: don't run it), `sections/canal/west/section.json`,
  `sections/canal/east/section.json` (the restyle's two halves), `sections/canal/notes.md`.
- Restyle outputs in `gen/sections/canal/west/` and `gen/sections/canal/east/`. The broken whole-area run is in
  `gen/sections/canal/runs/whole_letterboxed/`; the east redraws are in `gen/sections/canal/east/runs/first_draw/`.

## Units (changes from the plan)

- **river_w split in two:** `river_w` 20500–21850 (the two north-bank moored boats, the small covered boat off the south
  bank, both shores and banks at the west end) and `river_w2` 21850–23300 (the six men's boat with its long pole, the
  two bottom cabin boats, 豪华客船). Unsplit, river_w held about 8 boats and 35 crew plus two shores, the heaviest unit in
  S2.
- **Boats named to a river unit whichever side of an internal boundary their stem reads:** 豪华客船 → river_w2 (its
  stem may be east of 23300); the boat moored at ≈ 26000–26800 → river_e (its stem is right at 26000). The section seams
  (20500, 29050) still go by the stem.
- **river_m looks west to 21700:** 逆水行舟's tow rope runs about 2300 px from the mast (u ≈ 24180, top v ≈ 300) west to
  the five trackers at u ≈ 21780–22150. The plan put "the boat towed by trackers" in river_w and "the trackers of
  逆水行舟" in t5: the trackers are t2's, and the towed boat is river_m's.
- **t12 added** (28700–29050) for the moved S1|S2 seam, as the rules say.
- **structures_e not split** (about 18–22 buildings plus the 望火楼, comparable to S4's structures agent with 28
  footprints).

## Lessons (exact text for the skill `scroll-section`, "Adding a section")

- **Keep a restyle unit's aspect to about 2.6:1 or less.** The image API does not draw wider images: S2's overview
  asked at 4096 × 832 (8864 × 1792 of scan) came back 4096 × 1658, letterboxed with white bands, and S1's (4096 × 848) the
  same; S3's 4096 × 1376 came back 4096 × 1415. A letterboxed overview ruins every tile, because each tile's colour crop
  is cut from the overview at the width ratio on both axes (row-0 tiles got mostly white). Check the returned
  overview's size before the tiles run (`restyle --only overview`), and split a long area into pipeline sections nested
  in its folder (`sections/canal/west`, `sections/canal/east`, 4608 × 1792 each with a 4096 × 1600 overview); read each
  with `scroll_inspect.mjs canal/west|east`.
- **Open water under moored hulls can come back as dry ground.** Where the overview paints water in nearly the
  ground's colour, the tiles below a row of boats drew a grassy yard (S2 east, u ≈ 25500–27400); one redraw fixed one
  tile, and two redraws of the other gave dry ground and then an invented shop street. Read the bottom-row sheets for
  this, and warn the river agents.
- **The restyle's commonest invention on the canal is extra people:** crowds in empty yards (about twelve under the
  pole frame at u ≈ 27300–27620), crews filling decks and foredecks, figures climbing knobbed willow trunks, seven
  trackers for five. Count from the scan, never the restyle.

## For the lead

- `tools/scroll_pipeline.mjs` could stop when the overview's returned size differs from the asked size (it would have
  caught S2's and S1's letterboxed overviews before 20 tiles were spent).
