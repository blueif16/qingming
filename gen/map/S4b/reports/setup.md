# S4b setup: report (2026-10-12)

## What was done

- **Restyle.** I wrote `sections/outer_road_2/section.json` (rect `[12448, 0, 3216, 1792]`, overview `3216x1792`) and
  ran `node tools/scroll_pipeline.mjs outer_road_2 all --jobs 2`. All 9 images came back on the first try in about
  8 minutes. Registered alignment: overview 0.738, tiles 0.531–0.685, with no outlier. The outputs are
  `gen/sections/outer_road_2/mosaic.jpg` and the sheets in `gen/sections/outer_road_2/check/`.
- **Restyle review.** I read all eight check sheets, then made side-by-side zooms (`tools/scroll_inspect.mjs`) of
  ten spots: the rafted boats, the sterns' bank, the top edge, the crowd, the horse group, the wheelwright, the
  second cart's rear, the tea house's east end and the east willows. The inventions are listed by u range in
  `sections/outer_road_2/notes.md` and, by unit, in `gen/map/S4b/brief.md`, "What the restyle invents here".
- **Tile brief.** `gen/map/S4b/brief.md`, from S4's and S6's briefs, filled in for S4b. It covers:
  - the unit table;
  - the boat and water convention;
  - the supports (including `bank top` and `bank slope`, which are new);
  - who records the in-between kinds;
  - both seams (S4 at 12600, S3 at 15500);
  - the structures pass (road datum, receding-edge table);
  - the river pass (how to measure the water level, deck heights, shore points at 15500).
- **Units.** The nine planned units are confirmed and none is split. My rough count for `t2`, the densest, is about
  35–38 figures, which is under 40.

## Findings for the lead

- **The rafted boats may be five, not four.** On the scan, a fifth hull lies at about v 340–440, between the
  long-cabin boat (v 190–330) and the boat with the round mat roof (v 410–520), and the restyle draws five as well.
  The river agent is told to count stems and sterns.
- **The top boat lies within S4b:** its scan hull runs u ≈ 15190–15470 (the restyle stretches it to 15520).
- **The biggest boat's bow may lie close to or past u 15500** (its hull reads 14890 to about 15450–15500+ at
  zoom 1). Phase 0 gives it to S4b in any case.
- **The sedan chair's box is at about u 13050–13150,** east of t1's range. The brief gives it to t1 explicitly (with
  the first palm-covered cart), whichever way it faces, so t1 and t2 don't both record it or both leave it.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 1)

> - **Say in the brief that lines live in `pts`.** A road's, water's or bank's lines go in `pts.lines` (keyed by
>   role) or `pts.line` with a top-level `role`, as in `S4.road.main` and `S5.water.moat_south_8700`. Written outside
>   `pts`, `check` fails with "no ground points". The datum reference `<id>:lines.centre.0` resolves through `pts`.
>   The S4 and S6 briefs said only "`lines: {centre, edge_n, edge_s}`".
> - **Check the brief's conventions with a probe part** (one boat, one crew figure on its deck, one water reach, one
>   group) in your scratchpad: `node tools/scroll_map.mjs <S> check --parts <probe>`, before the unit agents start.
> - **Read the restyle's check sheets, then zoom the suspicious spots side by side** (`tools/scroll_inspect.mjs`,
>   half 160–200 at 3×). At sheet scale (0.75×), an invented group of figures looks like painted detail. On S4b the
>   worst inventions were on a bank by rafted boats' sterns, where a dark stern became a stack of sacks with a seated
>   man and three figures became six. The restyle also redrew the hull count of rafted boats, and leafed every bare
>   willow.
