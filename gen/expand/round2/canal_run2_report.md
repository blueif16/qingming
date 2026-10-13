# S2 (`canal`, u 20500–29050): Run 2 report

The canal wharves (汴河 · 运河两岸): the north bank from the S3 seam past the trackers hauling 逆水行舟, the riverside
terrace, the unloading yard with its sack porters, 沿河雅座 and the warehouse, 王家纸马铺, the grain wharf with the two
万石船 and the 望火楼, to 望楼饭铺 at the S1 seam; across the river, the south bank's hall and sheds; sixteen boats.

- **Run 2** (area agent and its builder, kit, casting, boats and QA subagents) built, cast and exported S2. The lead
  rebuilt and exported it at 18:08 after the PC froze. The QA results and the boats agent's last crew check were lost
  with `/tmp`, and the report was never written.
- **Run 3** (this finisher, 2026-10-12 evening, `restart_brief.md`) brought the cast current, fixed the section's
  download budget, wrote the walks and shots, ran every check alone and joined, and wrote this report.

The record is `sections/canal/notes.md` ("Run 2", "Restart run"); the builder's, casting's and boats' notes are under
`gen/sections/canal/` (`build/notes_build.md`, `cast/notes_cast.md`, `boats/`); the lessons are in
`gen/expand/canal_lessons.md` ("From the restart run"). Check results are in `gen/sections/canal/qa/run3/`.
**`FINAL BUILD 18:56`** is in the notes (canal.glb 18:33, canal_boats.glb 17:04; neither changed after it).

## Built, per kind (`node tools/loyalty_check.mjs S2` PASS)

| kind | mapped | built | how |
|---|---|---|---|
| figure | 140 | 140 | people.json: 129 standing, sitting or at work, 11 walkers; 53 on boats (47 crew on 12 boats hosted) |
| prop | 103 | 103 | at their mapped points at real size (`blender/canal_scene.py`, `kit_canal.py`) |
| building | 37 | 37 | kit parts; real heights on painted frontages, backs past the silk's top are choice depths |
| tree | 21 | 21 | cards from the tree factory (`trees/assign/S2.json`) |
| vehicle | 20 | 19 | 16 boats in `canal_boats.glb`; the mule cart, the crate barrow, the round-topped cart |
| animal | 9 | 9 | two cart mules (collars), horse (girth cloth), horse_dark, donkeys (saddle cloth), donkey_dark (halter), 2 birds |
| structure | 12 | 12 | the 望火楼's platform and stair, the landing steps, the jetty, the railed stair, fences, screens |
| grd, road, water | 11, 2, 4 | all | the ground's banks (the river plan's), two worn roads and yards, four water strips |

- **Not built:** `boat_small_bow_22158`, the lead's call (only its bow is painted at the silk's edge; the rest would
  stand on the south bank's flat).
- `build_choices.json`: 90 moves, 13 `how`, 1 `unbuilt`, 6 `edges`, 16 `boats`, each with its reason (merged from
  `gen/sections/canal/choices/*.json`).
- **Geometry:** 116.8k triangles (115.2k drawn, 1.6k collider), 46 draw buckets; `canal.glb` 1.74 MB of geometry.
  The boats GLB is 1.92 MB: 61.6k triangles at lod 0, 24.2k at lod 1.
- **The scroll index** projects within 0.73 px (limit 2).

## What Run 3 changed

1. **The budget, the cheap way.** Kit swatches tile, so the export's quantize skipped every UV set ("out of [0,1]
   range") and the UVs shipped as float32: 0.93 of `canal.glb`'s 1.93 MB. The builder now rounds tiled UVs to 1/1024
   of a swatch repeat (`UV_Q`, a `choice:`; half a pixel of a 512 px swatch; sign and atlas UVs left exact). `canal.glb`
   is 1.74 MB, and the section's download went from 9.08 to **8.88 of 9 MB**. Shots 17 and 18 show no seams or
   swimming.
2. **Casting rerun** (`make_people.py`), twice:
   - it took up what the workshop delivered: boatman, grain_porter and the paid run's tracker, straw_hat, dark_hat and
     youth; the takes work_sweep, fend_pole, haul_line, sack_carry and tow_walk; horse_dark and donkey_dark with
     their tack. **No figure plays a stand-in now.**
   - it drops takes `workshop_progress.md` marks **NOT TO USE** (`NOT_TO_USE`: pole_boat, chase_run): S2's poling
     boatman plays `stand_pole` with `long_pole`. The pennant holder (robed_man has no pole bound to `fend_pole`) plays
     `stand_pole` again.
   - the footing under the man standing in the river moved with his recorded move (out of the cargo boat's hull), so
     the scene was rebuilt once (`tools/build_scene.sh canal`) and exported with `--no-boats`.
3. **`walks.json`, `walks_joined.json`, `shots.json`, `shots_joined.json` written.** The routes were planned over the
   page's own colliders, probed on a 0.25 m grid. The tools were rebuilt from the dead QA agent's transcript and are in
   `gen/sections/canal/qa/run3/tools/` (README.txt).
4. **The boats agent's crew check, rerun** (`boats/crew_check.py`): 61 spots, 3 flagged, all accepted (below).

## Checks (all through the check server 5190 and Chrome slots)

| check | result | file (`gen/sections/canal/qa/run3/`) |
|---|---|---|
| `loyalty_check S2` | PASS (after every export) | |
| `ktx2.mjs check` | PASS (3 encoded: grain_porter, horse_dark, donkey_dark) | |
| walks alone, `sections/canal/walks.json` | **26/26** | `walks_alone.log` |
| walks joined, `walks_joined.json` (S3 + S2 + S1) | **8/8** | `walks_joined.log` |
| `people_check` at `?window=all` | PASS (11 walkers, 138 figures, 0 stuck; 2 went round the player in the yard) | `people_check.log` |
| shots alone, `shots.json` (18) | no console errors | `shots_alone/sheet.jpg` |
| shots joined, `shots_joined.json` (9) | ground and water continuous at both seams | `shots_joined_s3/`, `shots_joined_s1/` |
| HUD (Space) at the trackers, the yard, the grain wharf | boxes on the painted figures; the ring, see below | `hud/sheet.jpg`, `hud.json` |
| `budget_check canal` (loaded, Chrome slot) | **FAIL on 1, the cast** (below) | `budget.log`, `budget.json` |
| the boats' crew check | 3 flagged, accepted | `crew_check.log`, `crew_check.json` |

**The 26 walks alone:**
- **The edges:** the S3 seam on the north strip and on the south bank, the silk's top twice, the S1 seam twice, the
  silk's bottom on the south bank, and the shore walls on both banks.
- **The north bank:** W->E from the S3 seam to the S1 seam's foot in five legs (the trackers' bank, behind the terrace
  and the eatery, across the unloading yard, the warehouse front, the jetty and the east wharf), and back E->W in three.
- **The boats:** onto the big cabin boat and back ashore; up the hooded-bow cargo boat's west bridge onto its high
  deck (H 1.0) and back; onto the mat-roofed, the open and the mat-shelter boats; 20 s at the rail of 逆水行舟 and of
  the sweep boat (held while each pauses 8 s at its painted spot, then carried 4 m with it).

**The 8 joined walks:** across the S3 seam on the north strip and on the south bank, and across the S1 seam on the road
and north of 望楼饭铺, each both ways.

**Judgment calls (recorded in the notes):**
- `people_check` uses one road spot, the unloading yard (194.5, 22.3), where five sack porters cross. The east bank's
  walkers are too sparse for a 12 s spot (none crossed at 272, 12.74 or 259.5, 18.34).
- **The crew check's three flags are accepted.** The two passengers in 逆水行舟's cabin window have the boat's body
  0.8 m over their feet: that is the window's sill, and they are painted showing over it. `child_or_vase_21076`, a
  child (scale 0.89), stands under the covered boat's mat at 1.5 m.
- **The north bank behind the terrace.** The terrace's east end is closed as painted (balcony railing and blind), so
  the way east runs behind the terrace and the eatery, through a gap one walker wide. The walks pass there both ways.

## Budget (`node tools/budget_check.mjs canal`, loaded alone)

| number | S2 | budget | |
|---|---|---|---|
| download, the section | 8.88 MB (GLB 3.66 with boats, JSON 0.33, panels 0.37, cards 4.51) | 9 | PASS |
| **download, with kit and cast** | **25.12 MB** (kit 0.97, cast 15.27 MB for 27 models) | 20 | **FAIL** |
| triangles drawn | 115.2k | 130k | PASS |
| triangles, colliders | 1.6k | 5k | PASS |
| textures, own | 14.43 MB | 24 | PASS |
| draw calls (most, at the terrace) | 301 | 330 | PASS |
| GPU MB, section alone | 73.4 MB (149 people and animals loaded) | 75 | PASS |

**Exception asked (for the lead): the miss is the cast, not the section.**
- S2 paints 149 people and animals; every one is cast, and since this run each plays its own character.
- At the restart the number was 23.76 MB. The workshop's deliveries raised the cast to 27 models: boatman,
  grain_porter, tracker, straw_hat, dark_hat, youth, horse_dark and donkey_dark.
- The largest are the free-retarget clip sets (idler 1.27 MB with 43 clips, porter 0.96 MB, townsman 0.84 MB).
  Trimming unused clips (`tools/clips_used.mjs`) is the workshop's lever.
- The cheap fixes in S2's files would undo the casting: fold the one-figure characters (official, butcher,
  child_robed, dark_hat, about 0.27 MB each) into others, or go back to stand-ins. I didn't apply them.
- **Proposal:** raise `download_with_shared_mb` to about 26 for S2 (S3 asks about 27), or count the cast once per
  window. The characters are shared and come from cache after the first section.

## Requests

- **Page queue** (`page_queue.md`, S2 finisher): `boats.js` `contacts()` gives a gangplank no contact when its deck-end
  rim piece already touches a neighbour boat. So the shore walls along S2's first grain boat's plank stay shut, and
  you stop at the water's edge. Pending walks: `qa/run3/walks_gangplank_pending.json`.
- **The join agent:**
  - At the S1 seam, the east reach's water (run on to the seam, the lead's call) ends against S1's ground in a
    straight pale vertical face (shot `shots_joined_s1/j08`).
  - At the S3 seam, pale flat patches show on the shore near the seam (`shots_joined_s3/j03`, `j05`). This may be the
    page's mist item.
- **The lead:**
  - Round tiled UVs in `export_web_scene.mjs` for every section: it saves about 10% of each GLB (lessons).
  - The budget exception above.

## Waiting on others

- **The workshop:** the paid run's further takes (sit_offer, lie_wave, sit_point, pour_bucket, climb_ladder,
  lean_over_seated, tiller) and a `pole_boat` retake. `make_people.py` takes them up by itself on a rerun.
- **The boat factory:** `boat_small_bow_22158` (bow only).

## For the user

1. **Which boats you can board.**
   - You can: the big cabin boat, the hooded-bow cargo boat (only over its west bridge; its other two are too steep),
     the mat-roofed, open and mat-shelter boats, and the two grain boats once the plank is fixed. 逆水行舟 and the
     sweep boat carry you while they move.
   - You can't: the passenger boat (u 22545), the mat-cabin boat (u 25980) and the bottom boat touch nothing. The
     mat-canopy boat (u 25145) and the mat-cargo boat (u 21055) take you only to their rims; their decks there are
     under the mat canopies.
2. **The first grain boat's gangplank** can't be walked yet (a page fix is requested). Since the second grain boat was
   moved north, the plank also passes over that boat's west end.
3. **The scroll HUD on the middle north bank:** the ring lands up to 3 m (about 250 px) into the painted river. The
   bank there was widened to give a 3 m walk, and the HUD doesn't know about the widening. The figures' boxes are
   right.
4. **The S1 seam:** the river's east end meets S1's land in a straight cut. That seam is the join agent's.
5. **The two passengers in 逆水行舟's cabin window** stand at the sill, showing over it as painted.
6. **The way along the north bank behind the riverside terrace** is a one-person gap between the terrace and the
   eatery's tables.
