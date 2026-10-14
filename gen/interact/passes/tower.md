# The tower pass (2026-10-14, helper session for the lead)

The user: on the wall-top terrace by the gate tower you could get in but never get out; make the gap between the
stairs and the platform above a little larger, push the top part of the building away a little.

## What was wrong (`grid_tower_before.txt`)

The lower flight (马道) arrives at the terrace's south edge (D -0.51) on the same axis as the upper stair, and the upper
stair began right there (D -0.36: its painted 1.0 m run stretched south to the edge, a builder choice). No landing:
to reach the 1.5 m strip in front of the podium (the 城樓 viewpoint, X -16 D 0.6, and the west part) you squeezed
past the stair's ramp side, and could not squeeze back.

## What changed

- **Offset: +1.1 m north (dD 1.1)** for the podium's painted front, the hall, the upper stair, the drum's map spot
  and the two figures on the balcony (`tower_watchman`, `tower_balcony_man_6600`): six moves in
  `sections/gate/build_choices.json` with their reasons, applied by `tools/map_layout.mjs S5`.
- **The upper stair keeps its run** (`UPPER_RUN = 1.44`, choice, `blender/gate_scene.py`): foot at D 0.74, top at
  the deck's edge D 2.18. A **1.25 m landing** now lies between the two flights (clear lane about 1.15 m between the
  terrace's south balustrade and the stair's first step); the strip in front of the podium is 2.6 m deep (was 1.5).
- **The back does not move.** A plain 1.1 m shift would have pushed the balcony 0.4 m past the block's north face.
  The builder's existing rule keeps the podium inside the terrace's balustrade (its back, estimated and hidden behind
  the hall, at D 7.43), so the podium is 4.85 m deep (was 5.95) and the hall 3.85 m (was 4.95; still 3 × 5 bays).
  The roof keeps its size and moves 0.55 m north (its south eave now at D 0, its north eave 1.5 m past the block's
  north face, 16 m up).
- **The drum did not move.** The builder hangs it 0.9 m inside the hall's back wall (the painted spot falls outside
  the hall, as before), and that wall stayed: centre (-18.77, 5.93, 13.36) as before. So `drum.stands` X, D and every
  per-character spot are unchanged, and `slots.json` / `drum_tip.json` still hold.
- `interact.json` (one read-modify-write, only these keys): `drum.stands[*].cam.at` east (-16.3, 3.0, 13.9) ->
  (-16.3, 3.5, 13.9), west (-21.6, 3.0, 13.9) -> (-21.25, 3.5, 13.9). The hall's front wall is now at D 3.08, so at
  D 3.0 both cameras looked into it; the old west camera only worked because it sat inside a column at D 2.97 (X -21.6
  is outside the west wall): now 0.15 m inside it. `look` unchanged. `drum.react` untouched: with the drum and the
  hall's back fixed it still frames the tower (checked in the page, see below); shift it only if you want the hall's
  front in the same place in frame (+1.1 for `look`).
- `vistas[tower]` unchanged: it stands on the terrace, which did not move; D 0.6 is now inside a 2.3 m wide strip,
  1.6 m clear of the deck edge (was 0.5). `around` is the map ID S5.str.gate_tower, so its circle follows the move.
- Spots on the balcony moved +1.1 in D: `scene.json` view `tower` (D 2.62 -> 3.72), `sections/gate/shots.json`
  (6_balcony, 8_from_tower), `shots_loyalty.json` (m4_mound_above), `sections/world/shots.json` (w07, w08),
  `tools/ktx2.mjs` review spot kit_tower_wall.
- `sections/gate/walks.json`: five new walks (landing to the 城樓 spot and back down, to the strip's west end and back
  down, up both flights into the hall and back down), and the hall walk's expect tightened to the hall's floor
  (D 3.3..6.8). `sections/world/walks.json` untouched (its S5 tower walks still pass).

## Checks

- Build: `tools/build_scene.sh gate` (107.9k triangles, was 108.5k: podium 5456 -> 4880, hall 16400 -> 16280, upper
  stair 1250 -> 1366); `loyalty_check S5` PASS; `export_web_scene.mjs gate` (scroll index projection max 0.57 px; the
  moved figures are skipped as recorded moves); `people_precompute gate` (corridors); `ktx2.mjs check` PASS (nothing
  new to encode); `budget_check gate --no-load` PASS (7.71 MB, 106.7k drawn, 1.2k collider).
- Grid: `grid_tower_after.txt` (same probe): the whole terrace strip X -22.25..-15.25 is walkable at D 0.0..0.5 across
  the stair's foot, and the strip in front of the podium at D 0.0..1.75.
- Walks, gate alone (`world.html?sections=gate`): 16/16 PASS, the five new ones included (landing -> 城樓 spot ends
  X -16.1 D 0.2; back down ends on the flight at D -6.7; west end X -22.4 and back down; into the hall at D ~4.5 and
  back down both flights to D -9.1).
- Regression `tower_pass` (`gen/expand/round2/page_qa/tower_pass/`): world 211/211, boats 12/12, rides 5/5; people
  FAIL only on the two known road spots (X 7 D 3.9, X -8 D 4.1); contacts 807 people, 39 failing (the baseline; the
  gate's one is tree_leaner_7952). Both tower figures PASS every contact check at their new spots (the balcony man's
  elbows on the front rail: gap 1.2 / 3.2 cm).
- Drum: in the page (hour 10), E-equivalent `strike()` from both sides: the walk to the stand, `strike_drum`, the
  boom, startle (39-42 birds), the watchman's bark; the inside cameras at D 3.5 frame the drum and the player, the stick
  on the skin at the hit (`tower_after_drum.jpg`: east, west, and the unchanged react cut). `clips_check.mjs`: 88/88
  PASS (drum_east 8/8, drum_west 8/8; spots identical, only the distance to the watchman shrank to 3.0-4.4 m).
  `drum_tip.mjs` not rerun (it reads only the character GLBs, nothing here changed them).
- Shots (hour 10): `tower_after_terrace.jpg` (first person on the east strip looking at the landing: the stair's foot
  stops short of the balustrade, the 马道's opening beyond), `tower_after_terrace_3p.jpg`, `tower_after_landing_from_flight.jpg`
  (from the 马道 looking up at the landing and the stair), `tower_after_street.jpg` (from the moat bridge),
  `tower_after_north.jpg` (the block's north face: the podium stays inside it).

## Not done / open

- `drum.react` (the lead's): not touched; the cut still frames the tower well, so no shift is needed. If you want it
  to aim where it aimed on the hall's front, +1.1 on `look` D.
- `sections/world/walks.json` (the lead's) is unchanged: its S5 tower walks still pass, but its "upper stair ->
  balcony -> into the hall" accepts D 2.1..6.8, which now includes the balcony; the gate's copy is tightened to 3.3..6.8.
  The five new walks are only in `sections/gate/walks.json`.
- Rewritten by the tools as a side effect (not hand edits): `gen/details/contacts/*.json|md` and
  `gen/details/placements.json` (the regression's contacts step), `gen/interact/clips_check.json`,
  `web/public/assets/clip_meta.json` (people_precompute; 4 clip entries differ from HEAD: official write~soles,
  sit~soles, lean_over~player_crown_a, soldier lean_over~player_crown_b), `gen/sections/gate/owners.json`.
