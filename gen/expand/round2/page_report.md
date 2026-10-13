# Page agent report (restart run, 2026-10-12 evening)

Owner this run: `web/src/` and `web/*.html` (delegated by the lead). Defects only. Check results:
`gen/expand/round2/page_qa/`. Regression run: `gen/expand/round2/page_qa/regress.sh <tag> [world|boats|rides|people]`
inside one Chrome slot (`tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>`): the world's 42 walks
(`sections/world/walks.json` on `world.html`, the default world), `boats.html` 12 walks
(`gen/boats/page_test/walks.json`) and 5 rides (`page_qa/ride_test.mjs`, recovered from the boats page agent's
transcript: its scratchpad copy was wiped), and `people_check` on the default world. Logs in `page_qa/<tag>/`.

## Baseline (before any change, 18:28-18:34)

- `page_qa/baseline/` (default world, then 3 sections) and `page_qa/baseline_w3all/` (`?sections=inner_city,gate,
  outer_road&window=all`, the condition of the old 42/42):
  - world walks **40/42** in both. The two fails are not page code:
    - "S6: into the incense shop's open front" stops at X -78.39 D 18.6 against a **static collider** at X -78.69
      D 18.6 at knee, chest and head height (`page_qa/diag_s6_walks.log`): the S6 build (inner_city.glb, 13:21) now
      closes that open front. For the join agent (S6 seam owner) or the lead.
    - "S6: south edge stops you (the open square west of the inn)" is timing: a walker in the way (ended D 0.6 in one
      run, X -72.93 just outside its X range in another, PASS in the diagnostic run).
  - boats.html 12/12 walks, 5/5 rides.
  - `people_check` on the default world: routines and bodies PASS; routing FAIL at both gate spots (7, 3.9) and
    (-8, 4.1): nobody went round, 1-3 turned back. Same on the 3-section world. Known timing-sensitive spot (skill
    `web-scene`); the join agent saw the same before the restart.
- Someone else wrote `web/src/daylight.js` (18:31), `sundial.js` (18:32) and `sundial_glyphs.js` (18:23) during this
  run; no agent transcript shows it. I have left those three files alone.

## Items

### 1. world.html's default: all 8 sections, same start (landed 18:35)

- `web/world.html`: `data-sections="city_end,inner_city,gate,outer_road,outer_road_2,rainbow_bridge,canal,countryside"`
  and `data-spawn="inner_city:spawn"`.
- `web/src/world.js`: the start is `?spawn=`, else the body's `data-spawn` when the URL gives no `?sections=`, else the
  first section's spawn (as before for `?sections=` URLs, `gate.html` and `boats.html`). The default world still
  starts at the inner city's spawn (X -44.5, D 6.8, facing 180), with the window streaming round it.

### 2. `placeTrees` skips `card: "kit"` trees (landed 18:36)

- `web/src/world.js`: a tree with `card: "kit"` is built in its section's GLB, so no card stands on it. The one today
  is S4b's stump (`S4b.tree.stump_14805`, 226 triangles in `outer_road_2.glb`); the willow card that stood on it is
  gone.

### 3. The mist starts at the walkable area (landed 18:38)

- `web/src/backdrop.js` `walkableBoxes(layout, walls, ground, fullAt)`: per section, boxes past the silk's top and
  bottom edges where the walkable area goes on: every point of the things `build_choices` moved (`layout.moved`:
  entities, trees, figures; padded 1.5 m for a hull's beam or a crown) and the north and shore edge walls as built
  (`g_edge_north|shore_hidden__col`, sampled along their triangles), grouped along X. A box never reaches closer than
  the mist's depth plus 0.5 m to where the section's ground ends, so the ground's end stays in full mist.
- `web/src/post.js`: the mist's outward distance is the smaller of the painted area's and each box's (up to 24 boxes,
  `MIST_BOXES`). `world.js` computes each section's boxes when it loads and passes the loaded ones to the backdrop.
  `?mistwalk=0` gives the old mist for A/B.
- Boxes today: S4b north X 71.9-96.4 to D 36.95 (the far bank moved north, the far shed, the two north boats, the
  cove's shore); S3 north X 78.6-115.9 to D 36.96 (the far-bank row moved north) and X 130.5-144.7 to D 34.26 (the
  walk round the bridge's north foot); S7 south X -86.5..-81.3 to D -6.5 (two moved twig bushes). None elsewhere.
- Judgment call: **below the silk's bottom edge only moved things count**, not the walls. The gate's south wall is
  moved 12.6 m down so its lower flight can be climbed; counting it cleared 44 m of unpainted ground and moat south of
  the gate (shot `page_qa/mist/after/gate_bridge_south.png` from the first try), against "south of the silk's bottom
  edge: mist only". The gate keeps its approved mist.
- Shots, before (`?mistwalk=0`) and after: `page_qa/mist/before/sheet.jpg`, `page_qa/mist/after/sheet.jpg` (spots
  `page_qa/mist/shots_mist.json`). S4b's far shed no longer shows ghost-white, and S3's far-bank shops are solid.
- Regression after items 1-3 (`page_qa/after_items123/`, `page_qa/after_items123_w3/`): boats 12/12, rides 5/5;
  world walks on the 3-section world (`?sections=inner_city,gate,outer_road&window=all`, the world they were written
  for) 41/42, the one fail the S6 incense shop collider above; `people_check` as the baseline (routing at the gate).
  - On the new default world (all 8 sections) the same walks give 36/42: besides the incense shop, five walks that
    test S6's west edge ("round the well ... to the west edge", "west edge stops you" x2) and S4's east edge ("the
    inner seam (u 12600) stops you") now cross a seam, since S7 and S4b load beside them. Expected, not a defect: for
    the join agent, who owns `sections/world/walks.json` (restate those five as seam walks when it extends the file
    over the whole scroll). My regression runs the world walks on the 3-section URL from here on.
- Mist re-shot with the final rule (`page_qa/mist/after2/sheet.jpg`): the gate's south is back to its old mist.

### 4. `bow_wave` only while the boat goes ahead (landed 18:44)

- `web/src/boats.js`: the kit's `bow_wave` node (boats under way only) is scaled about its stem by `b.wave` in
  `place()`: 0 while the boat waits at its spot or at the far end and while it goes back astern; going ahead, it grows
  and shrinks with the boat's speed (sin of the eased run, full from two thirds of top speed), times `min(1, run / 4 m)`
  so a boat that barely moves (S3's under-arch boat, `run_m` 0.2) raises none. Before, the wave stood at the bow all
  the time.
- Check: `page_qa/bow_wave_probe.log` (60 s of boat time on boats.html, S2 and S3: the wave by state and the bow wave
  instances' scale).

### 5. `host()` levels (landed 18:49)

- Found (`page_qa/hosts/diag_hosts.mjs`: every painted figure's feet against what is under and over them;
  `page_qa/hosts/before.log`, close-ups `page_qa/hosts/before/` and `before_up/`):
  - the support pattern took only `boat deck|roof: <id>`; `boat stern deck`, `boat bow deck`, `boat after roof` and
    `boat ladder` were hosted only when people.json listed them as crew, always on the main deck, and the ladder and
    windlass men of S2's passenger boat not at all (they stood still while it rode);
  - a roof figure whose spot was not over the roof at the first try along its line to the centre landed on the deck:
    S3 `man_waving_on_boat_roof_19952` (on the deck behind the awning), S2 `passenger_reclining_on_cargo_22848`
    (inside the cabin, 2.1 m under the painted roof);
  - stern figures stood on the main deck beside the raised stern deck: S2 `steersman_27890`, `man_stern_hood_26750`;
  - deck figures stood inside closed cabins or a laden boat's cargo mound (the raycast's first deck hit, unsorted,
    was the deck under the mound): S3 `boatman_poling_16198` (in the mound), `boatman_cabin_door_pole_20300`,
    `passenger_door_16553`; S2 `boatman_poling_24730`, `man_cabin_door_24728`, `second_passenger_window_24050`,
    `boatman_coils_28543` and others. S4b: none (its roof man sits on the roof).
- Fixed in `web/src/boats.js` `host()` and the new `standLocal()` / `surfaces()`: the support names the level (`boat
  [<part> ]deck|roof|ladder: <id>`); roof: the roof under the spot or the nearest within 3 m, the deck only when
  there is none; stern: a raised stern deck within 2.5 m when the hull has one; ladder: the painted height between
  deck and roof at the spot (on the rungs); deck: if a cabin, awning or cargo mound comes down within the figure's
  headroom (1.5 m, 0.9 m seated or crouching), the nearest deck within 4.5 m open overhead, else the top of what
  covers it. Figures at sweeps and oars are placed as before.
- After (`page_qa/hosts/after2.log`, close-ups `after_up/`, `after2_up/`): S3 0 float or sink, S4b 1, S2 4, all
  read right on the close-ups: the S4b man seated in the palm cart sits on the cart's collider (a cart bed, not a
  boat), S2's ladder man stands on the rungs (no collider under him), the child and the seated man under S2's covered
  boat's canopy fit under its eaves, the squatting man at S2's mat-cargo cabin door sits at the door.
- Regression after items 4-5 (`page_qa/after_item5/`, `after_item5_people/`): world 41/42 (the incense shop), boats
  12/12, rides 5/5, people as the baseline; S3's own walks 42/42 and S4b's 26/26 (`after_item5/s3_walks.log`,
  `s4b_walks.log`), so the crew moved out of cabins block no deck route.
- Item 2 checked in the page (`page_qa/stump_card.log`): S4b loads 9 card kinds, no `kit` and no willow card, and no
  card within 1 m of the stump.

### 6. The boarding step over a gunwale: not cheap, on the user list

- A contact's bridge is one flat quad from the rim's foot (deck level) out to the bank or the other deck, so the walker's
  legs pass through the visible bulwark for one step. Lifting it over the gunwale needs a two-part bridge built to each
  boat's gunwale height (the kit's `board__edge` ribbon carries it), new slopes on every boarding in S4b, S3, S2, S1
  and boats.html, and their deck walks rerun while the area agents are checking them. Not done.

## The queue (`round2/page_queue.md`, each marked there)

- **Join agent, S4b's mat-cargo gangplank (done):** `boats.js` `acrossPlank()`: a bridge's end wall (`CAT.cap`) that
  crosses a gangplank's corridor is not built. With the porter out of the way the climb reaches the deck end 6 of 6
  (`page_qa/queue/plank_walks2.log`, `plank_walks3.log`). The pending walks still fail as written, on data: the
  porter (`porter_baskets_14778`, at (74.94, 24.47)) stands on the plank's foot line, and the plank's deck end meets
  the cabin's collider, so a straight walk stops at X 76.77 (the walk expects 76.8).
- **S2 finisher, a gangplank on a rim piece that touches a neighbour (done):** `contacts()` adds the plank's contact
  anyway (`shared`): it opens the shore walls at its foot, with no rim caps beside it. S2's pending walks 2/2
  (`page_qa/queue/s2_gangplank.log`).
- **S3 finisher, walkers left on the water side of a bank contact (not fixed, user list):** reproduced
  (`page_qa/wade_test.js`: 21 of 77 starts end in the water with 8 s pauses). The bank slopes to H -0.7 inside the
  footprint before the shore wall; a walker who comes while the boat is away walks down to the wall, and when the
  bridge reopens at the bank-top height he walks on under it into the water. The footprint hold that the request
  suggested changed nothing (20 of 77) and was taken out. S3's data workaround stands.

## Final regression (19:01-19:05, all changes in)

- **World walks 42/42** on the default world (`world.html`, all eight sections: `page_qa/final_world8/`). The join
  agent restated `sections/world/walks.json` for the eight-section default at 18:55 (the five old edge walks became
  S6|S7 and S4|S4b seam walks), and the incense-shop walk passes again. On the old 3-section URL the new seam walks
  fail by design (`page_qa/final/world.log`, 37/42): from here on the world walks run on the default world.
- **boats.html 12/12 walks, 5/5 rides** (`page_qa/final/`).
- **S3's own walks 42/42, S4b's 26/26** (`page_qa/final/s3_walks.log`, `s4b_walks.log`), for the `boats.js` changes.
- **`people_check` on the default world: FAIL, as at the baseline, on things outside this run's changes**
  (`page_qa/final_people/people.log`): bodies PASS (0.75 m), no walker stuck; routing at the gate's two road spots
  (7, 3.9) and (-8, 4.1): nobody went round, 1-2 turned back, in every run since 18:28 including the one before any
  change; and the off-ground measure added to `tools/people_check.mjs` at 19:00 flags the gate walker
  `top_porter_backbox_8911` 1.1 m off the ground probe. Neither touches what changed here (no boats, trees or mist
  logic at the gate; `people.js` untouched). For the join agent (gate seams, the default-world people check) or the
  lead.

## What landed, by file

- `web/world.html`: default sections all eight, `data-spawn="inner_city:spawn"`.
- `web/src/world.js`: `data-spawn`; `placeTrees` skips `card: "kit"`; each section's walkable boxes to the backdrop;
  `?mistwalk=0`.
- `web/src/backdrop.js`: `walkableBoxes()`; the boxes into the mist uniforms.
- `web/src/post.js`: `MIST_BOXES`, the boxes in `mistAt`.
- `web/src/boats.js`: the bow wave by `b.wave`; `host()` levels with `standLocal()` and `surfaces()`; `acrossPlank()`;
  the shared plank contact.
- Not touched: `daylight.js`, `sundial.js`, `sundial_glyphs.js` (written by someone else during the run), `people.js`.
- QA kept in `gen/expand/round2/page_qa/`: `regress.sh`, `ride_test.mjs` (recovered), `hosts/diag_hosts.mjs`,
  `hosts/figure_shots.mjs`, `wade_test.js`, `mist/shots_mist.json`, and every log and sheet named above.

## Next

Nothing queued. To recheck: `tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>` (world walks on
the default world, boats walks and rides, people_check).

## For the user

- **The mist at the silk's edges** now starts where you can walk, not at the painted rectangle: S4b's cove (far bank,
  far shed, the two north boats) and S3's far-bank row read solid instead of ghost-white. Look from S4b's moorings
  and S3's south bank. The gate's south keeps its mist on purpose: counting its moved south wall would have cleared
  44 m of unpainted ground and moat below the silk ("south: mist only"); say if the lower flight should clear too.
- **The whole scroll is the default world** (`world.html`, S7 to S1), still starting in the inner city.
- **Boat people at their level:** roof figures on roofs, steersmen on the raised stern decks, the ladder man on the
  rungs, and boatmen no longer hidden inside cabins or a grain boat's cargo mound (they step out to the nearest open
  deck, or stand on the mound). S2's window passenger now stands at the window outside the cabin.
- **Bow waves** show only while a boat goes ahead.
- **Still to decide or do (features or not cheap):** trackers following their towpath; S7's procession; the boarding
  step where your legs pass through the gunwale for one step; a walker can reach the water at a bank contact of a
  boat under way when it arrives while the boat is away (S3 avoids it by keeping that boat at rest); S4b's mat-cargo
  gangplank is walkable now, but its porter stands on its foot and its top meets the cabin.
