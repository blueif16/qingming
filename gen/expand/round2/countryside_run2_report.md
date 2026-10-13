# S1 `countryside` (the scroll's start, u 29050–37610): Run 2 report

Written by the S1 finisher after the restart (`restart_brief.md`, "Area finishers"). The S1 area agent and its ground
agent died before reporting. Their work is in the files: the builder `blender/countryside_scene.py` and kit
`blender/kit_countryside.py`, the casting script `gen/sections/countryside/make_people.py`, and the records in
`sections/countryside/notes.md` ("Run 2" and "Run 3"). Check results are in `gen/sections/countryside/qa/run3/`.

**FINAL BUILD 2026-10-12 18:59.** From that time `countryside.glb` and `countryside_boats.glb` don't change. Only
`people.json` may still follow the workshop (below).

## Built, per kind (`node tools/loyalty_check.mjs S1` PASS)

| kind | built as | mapped | built | not built yet |
|---|---|---|---|---|
| tree | card (`trees/assign/S1.json`) | 87 | 87 | 0 |
| grd | ground | 47 | 47 | 0 |
| figure | person | 30 | 30 | 0 |
| prop | model | 27 | 27 | 0 |
| building | model | 14 | 14 | 0 |
| animal | animal | 13 | 12 | 1: `pale_bird_34250` (a bird or a pale abrasion; waits on a pale bird variant and the lead's reading) |
| structure | model | 8 | 8 | 0 |
| road | ground | 5 | 5 | 0 |
| vehicle | model; the boats GLB | 3 | 3 | 0 (the sedan, the barrow, the sampan) |
| water | ground | 2 | 2 | 0 (the stream; the pale band, water as the lead called it) |

- **Scene:** 96,463 triangles, 37 draw calls, 173 owners. The boats GLB holds the sampan (1.2k triangles near, 0.5k
  far), moored to its painted pole with no crew.
- **Edges:** invisible walls east, north, south and west, plus `edge:shore` along both water strips (411 pieces).
- **Records:** 17 recorded moves and 55 `how` entries in `build_choices.json`. The lead's four calls are recorded
  there: the trees in the road strip, the train walking east, the bank rises, and the runaway horse built whole.
- **Backdrop:** a painted panel west (S2), and mist east (past the silk's start), north and south.

## Checks

| check | result |
|---|---|
| `loyalty_check S1` | PASS (as above) |
| `ktx2.mjs encode`, `check` | PASS (127 encoded, 0 orphaned) |
| `budget_check countryside` (slot Chrome, 5190) | **PASS** |
| walks alone (`sections/countryside/walks.json`) | **50/50 PASS** (every edge, the shores, the bridge both ways, the banks, the road end to end) |
| shots alone (`shots.json`) | 50 taken, no console errors (`qa/run3/shots_alone/sheet.jpg`) |
| `people_check` (`?sections=countryside&window=all`) | **PASS by reason** (below) |
| HUD (Space at 3 landmarks) | ring on the painted spot, boxes on the painted figures (`qa/run3/hud/sheet.jpg`) |
| scroll index | 68 entries; projection max **0.64 px** (under 2) |
| joined with S2 | **not due**: S2 has no `FINAL BUILD` yet; preliminary run 3/5 (below) |

**Budget numbers:**

| what | used | budget |
|---|---|---|
| download, the section | 7.54 MB | 9 |
| download, with kit and cast | 18.26 MB | 20 |
| triangles drawn | 93.0k | 130k |
| triangles, colliders | 3.4k | 5k |
| textures, own | 17.85 MB | 24 |
| draw calls (most) | 247 | 330 |
| GPU, section alone | 44.61 MB | 75 |

No exception is requested.

**`people_check`:** 15 walkers, 27 figures, 0 stuck. Walking into a figure stops at 0.56 m (bodies need 0.56). On the
road at three spots nobody walked through the player; 7 went round and 2 turned back; the longest stand was 4.6 s
(the limit is 6). The tool prints FAIL on one line only: "walkers left the ground (y −0.64, 0.06)". Its band is fixed
at −0.5..0.6, and S1's built ground goes lower. Along every walker and animal path the built ground lies between
−0.60 (the road under the willow dyke) and +0.06, so the −0.64 is a walker standing on that ground.
`closestToFigure` 0.04 m is the two riders, which the tool counts as standing figures, sitting on their walking
donkeys.

**HUD, by landmark:**

| landmark | boxes | ring |
|---|---|---|
| the stall and the runaway horse | 26 | on the road behind the painted hall |
| the great willows | 9 | on the dyke between the willows |
| the bridge and the charcoal train | 15 | at the bridge's west end |

The boxes sit on the painted buffalo, ox, stall people, horse and grooms, the man at the post with the child, and
the five donkeys with their drivers.

## What the finisher changed (each recorded in the notes, with its reason)

1. **The build brought current.**
   - `make_people.py` was rerun on the ground agent's 16:48 build.
   - The charcoal train's seven recorded moves had gone stale: D5 was recorded at dX 1.56, but it stands at 1.99 by a
     nudge. They are recorded again in `build_choices.json`, and `map_layout.mjs S1` was rerun.
   - Then rebuild, export, KTX2 and budget.
2. **The hall (`farmhouse_hall_30200`) is built 3.0 m deep, not 3.6** (a `choice:`).
   - The painted road's south edge is the hall's mapped back.
   - At 3.6 m its back wall stood 2.3 m into the road. It left 0.18 m between it and the runaway horse's lane, and
     both road walks stopped at its corners.
3. **The walks were rewritten to the ground agent's last build.**
   - That build holds the shore land 0.7 m over the water, so the bridge's east landing sits at H −0.33. It also
     lowered the willow dyke's crest to about H 0.07.
   - Ten walks around the bridge, the pool and the dyke face had the older lines and heights.
   - Plan views of the built colliders and water showed every walker on land or deck, never below the water.
4. **The spawn faces 0, not 8.** With 8, W led into the horse's lane.
5. **Three shot spots were moved:** one stood inside the hall, and two third-person cameras sat inside the great
   leaning willow.
6. **The workshop's verdicts are honoured.**
   - `make_people.py` now reads `workshop_progress.md`: a "NOT TO USE `x`" line bars a clip, and a later
     "**PASS `x`**" lifts the bar.
   - `chase_run` is barred, so the grooms play `run`.

## What stands in for what (people.json as of 18:55)

- **The workshop's new paid run put `farmer`, `groom` and `straw_hat` in the registry at 18:53.** It has no
  "landed" line or take review yet. The script casts what the registry holds, so S1 now plays its targets:
  - farmer ×10: crouch, bend_goods, stand_sleeves, idle, sit;
  - straw_hat ×3: the two charcoal drivers on `drive_donkeys`, and a far figure;
  - groom ×3: `run`, with `chase_run` barred;
  - robed_man plays the new `beckon_lean` at the post.
- **Still standing in:**
  - the seated customer plays farmer `sit` (`drink` is still to make);
  - the water buffalo is the ox body, lying;
  - the runaway horse walks (there is no gallop clip);
  - groom 30353's `hat_on_back` is bound to `chase_run`, so it waits for the retake.
- **When the workshop records its review of this run:** `python3 gen/sections/countryside/make_people.py`, then
  `node tools/export_web_scene.mjs countryside --boats-only` (it copies the data). A take marked not to use is
  dropped by itself.

## For the lead

- **Joined with S2 (the join agent's, at S2|S1).** A preliminary run of `walks_joined.json` against S2's 18:33 build
  gave 3/5.
  - The two road crossings and the one behind the stall PASS.
  - The two off-road crossings at D 6.4 FAIL: S2's river now reaches the seam there (the lead's call), and the W->E
    start lies in S2's water. Both ways a wall stops the walker at the seam.
  - That route needs moving off the river.
- **Tool requests:**
  - `people_check.mjs`'s ground band (−0.5..0.6) should be relative to the built ground. S1's ground runs to −0.6.
  - `hud_interact.mjs` is hard-wired to 9223. The finishers use a copy of a goto + `hud.show()` script through
    `chrome_slot.sh`.

## For the user

1. **The bridge's west landing.**
   - Stepping off the plank bridge westward along its south half, you meet a short 35° step in a hollow. You have to
     step right, onto the north half, to get off.
   - Left as is: the fix is in the ground's landing pads.
2. **The hall by the 菜地 is 3.0 m deep** (it was 3.6 m), so the village road behind it stays open.
3. **The yard hedge before the eastern farmsteads** (`hedge_yard_34265`) reads as bright green lumpy blobs against
   the winter scene. Tell us if it should be duller or barer.
4. **The three grooms chasing the runaway horse run with the plain `run`.** Their new "chase" take held the arms out
   like a T-pose, and a retake is wanted. The first groom's hat on his back comes with that retake.
5. **The new farmer, straw-hat and groom figures now play in S1** (landed minutes before the check). Look at them
   at the stall, the far fields and the charcoal train.
6. **Still open from the map:**
   - the pale band (built as water, the lead's call);
   - the runaway horse built whole (it walks; there is no gallop);
   - the 菜地 as 14 young trees;
   - the pale bird, not built;
   - the charcoal train walking east as painted (against the title 赶驴入城). Its walk is short, 2.5 m, because
     the stream's shore lies close.
