# Boat flow (`?boatflow=painted|waves`): record

The user (2026-10-12): "make the boats actually flow… a continuous flow so they're always flowing in and out, and we
sort of hide them a little bit when they're out of vision, there will be new waves of boats coming in."
`map/BUILDING.md` keeps painted boats to a short run along their heading and back, and shows no traffic that isn't
painted; a change there needs the user, so both readings are built behind a URL switch and the default is today's.

## Stage 1: the lanes (tools/boat_lanes.mjs -> sections/world/boatflow.json)

Landed: `node tools/boat_lanes.mjs --plan --ship` reads what the river sections ship (water strips, shores, every
built piece over the water, the boats GLBs, people.json, the painted areas) and writes the lanes, a copy in
`web/public/assets/boatflow.json` (40 KB, fetched only when a variant is on) and plans in this folder
(`lanes_s3.png`, `lanes_s2.png`). Dev aids: `--debug`, `--probe <slug>:<lane>`, `--clrmap x0,x1,d0,d1`, `--dump <dir>`.

What the river allows at real size (the finding that shapes everything):
- **The river is three basins, not one stream.** S4b's moorings are a closed cove (its bank, and the raft of five
  hulls built at real size). S3's water west of the bridge is filled by the two painted boats under way and the
  moorings round them; from there a 3 m channel runs past the unloading boat, under the Rainbow Bridge, to the S3/S2
  seam, where the S2 moorings (mat_cargo_21055 and big_cabin_21120 rafted across the north two thirds, the stay boat
  19518's stern and moored_south_bank_19745 on the south) leave no gap even a skiff fits (0.9 m clearance at best).
  S2 east of that is open river, and it leaves the silk's bottom edge into the mist (the strip's run-on).
- So the reaches are: **S2's river** (102-122 m, from the moorings by the S3 seam to the mist; big and small boats),
  **S3's lake under the bridge** (34 m, closed at both ends; small boats only), and nothing in S4b (moored only).
  Every lane lies inside one section (`owner`): its boats load and go with that section, so a section's flow never
  shows a boat whose section is gone. S1's stream is too short to bother.
- **Painted boats under way that flow:** 22000 (sweep, west) and 23632 (towed west by its five trackers) in S2;
  19225 (drifting west under the arch) in S3. 16228 (towed east) and 15595 (sculled west) sit in S3's closed west
  basin: their reach at real size is 22 and 28 m, so they keep their painted run (a flow would only shuttle them out of
  sight and back in sight). 19518 (lowering its mast at the bridge) keeps its painted behaviour, as asked.
- **The bridge:** the built soffit is 2.5-4.1 m over the water across the channel (lowest by the faces). Every boat
  that can reach it fits under with its mast down (small boats: 0.36-1.56 m of headroom); the lanes keep to the
  arch's crown there. The masted lake boat (17708's copy in the waves) has its mast down through the whole lake (it is
  shorter than the 16 m the tool keeps the mast down either side of the arch).
- Choices (marked in the tool): margin 0.4 m between a moving hull and banks or moored hulls (0.3 for small boats; the
  painted moorings leave 0.1-0.4), head 0.25 m under anything overhead, draft 0.35 m, a lowered mast at 84 degrees,
  a mast painted lowered raised to 6 degrees for open water, waves classes: small up to 2.4 m across, big up to 3.8 m.
- Two section bugs seen on the way (not mine; for the lead): S2's ground runs on 0.5 m past its west seam at 0.57 m
  over S3's river (a lip across the water at X 151.1-151.5, D 15-24, collider too); the tool leaves seam skirts out.

Next: `web/src/boatflow.js` (the motion, out-of-sight spawning, conflicts) with minimal hooks in boats.js/world.js.

## Stage 2: the page (web/src/boatflow.js; hooks in boats.js only)

Landed: `web/src/boatflow.js` (BoatFlow) behind `?boatflow=painted|waves`; `boats.js` builds it from the URL itself, so
**world.js has no new line**. boats.js hooks (each a line or two, all inert when the switch is off): the constructor
(`this.flow`), `batch` keeps each instance's geometry id, `add` gives the section a `MoverSet` (its copies' decks in the
collider list) and calls `flow.attach`, `remove` calls `flow.detach`, `step` calls `flow.step`, `pose` takes
`flow.move` for a flowing boat and rides the bob on `b.base`, `update` skips hidden boats, `animate` sets a flow boat's
mast from `b.mastDeg`, `aim` stows ropes `flow.stowed` names, `hauler` hands a flowing towed boat's trackers to
`flow.hauler`, `host` records crew spots for copies (and skips copies), `supportOf` skips hidden boats; new methods
`copy`, `uncopy`, `show`.
- Motion: a boat sits on its lane by the chord (stern and bow waterline ends on the lane), eases in and out (0.12 /
  0.18 m/s2), pauses at its painted spot (people.json pause), waits at a closed end, goes into the mist at an open one.
  Spawning and hiding only where nobody sees it (camera frustum by the hull's bounding sphere, post.js's mist formula
  on the loaded painted area and walkable boxes, past 210 m), never within 26 m of you, never a boat you stand on.
- Conflicts: each moving boat looks ahead along its lane (the hull's convex outline from the tool, grown 0.3 m) and
  waits for any hull it would touch; two that wait on each other let the one further along go when its next 2 m is
  clear; zones (the tool's, only where two lanes meet head on) are held by the first direction in; a waves boat parked
  in a painted boat's way goes as soon as nobody sees it; one held up 25 s where nobody sees it goes too.
- Waves: per section a pool of copies (cap by device: 2 small phone, 3 touch, 6 desktop; `?boatflowcap=N`), made the
  first time they are needed, with their template's crew (working hands first, at most 5) or a boatman poling at the
  stern; waves of 2-3 boats 14-30 s apart, 40-110 s of quiet, no new boat on a lane while one there waits or is held
  up. Turns: tool lanes `<reach>-loop` (up the reach, a turn of radius >= 6 m big / 3.5 m small, back down), found
  in S2's east half where the river is wide enough; S3's lake has no room to turn (closed both ends: up/down only).
- Trackers (painted 23632): the bank gives 1.5 m (the white wall, the gateway and the slat screen behind them), so they
  keep their painted haul (4 m along the heading and back on their own clock) and the tow line shows while the boat
  lies at its spot.
- A teleport (tools, the scroll HUD) lands you with the painted boats near you at their painted spots, as a section
  shows them when it loads (`flow.snap = false` turns this off for films).
- Ride: `gen/boats/flow/tools/bridge_ride.mjs` (waves): a copy of S3's small boat with the lowered mast down the lake
  under the arch: carried all the way, 0.00 m drift in its frame, mast at 84 deg under the arch, 4.24 m over the
  walker's feet to the soffit. PASS.
- Regression, default (tag flow_default): boats.html 12/12, rides 5/5, world 210/211 (S4b "back ashore from the
  arched-awning boat": flaky in the baseline too, passes alone first time, fails on repeats; earlier baseline runs
  fail a different single walk each time), people FAIL as in every baseline run ("nobody went round the player").
  loyalty_check S4b, S3, S2, S1: PASS (unchanged; the variants are page behaviour).

- Variants' world walks (regress.sh `world`, WORLD_URL with the switch): waves 211/211 (tag flow_waves4); painted
  209-210/211 over rounds, the fails S2's north-bank walks through the unloading yard and past the trackers, the
  walks the baseline also fails one run in three (sound_v2: the same E->W walk). What it took: trackers on the
  boats' clock (`stepHaul`, as boats.js), a teleport of more than 3 m in one step counting as a landing.


## Stage 3: checks, cost, films (2026-10-12, final code)

- Default (switch off), tag flow_default2: world 211/211, boats.html 12/12, rides 5/5. people_check FAILs as in every
  baseline run ("nobody went round the player", S6), not boats.
- Waves: world 211/211 (flow_waves4), 210/211 (flow_waves5: S4b "back ashore from the arched-awning boat", the
  baseline's own flake). boats.html?boatflow=waves 12/12 walks, rides pass (the test boats have no lanes).
- Painted: world 210/211 over its last rounds: one S2 north-bank walk through the unloading yard, held 2 s behind a
  sack porter (the same walk the baseline sound_v2 run failed). Alone it passes (2/2).
- `loyalty_check` S4b, S3, S2, S1: PASS, unchanged.
- Bridge ride (`tools/bridge_ride.mjs`, waves): PASS, carried the whole way, 0 m drift, mast at 84 deg under the arch,
  4.24 m to the soffit over the walker's feet.
- Cost (`tools/flow_cost.mjs`, S2 river view from the roof of the boat moored at X 236, after 150 s of flow; the
  check Chrome on the RTX 4070 SUPER, shared with a film run, so compare rows):

  | flow | fps | CPU ms | GPU ms | draws | triangles | boats CPU ms/frame (flow's own) | waves boats (shown) | people |
  |---|---|---|---|---|---|---|---|---|
  | off | 175 | 5.52 | 4.91 | 508 | 3957k | 0.175 | - | 432 |
  | painted | 169 | 5.69 | 5.41 | 508 | 3957k | 0.183 (0.018) | - | 432 |
  | waves (cap 6) | 160 | 6.04 | 5.62 | 510 | 4050k | 0.248 (0.029) | 8 (5) | 452 |
  | phone-like: CPU x4, cap 2: off / painted / waves | 15 / 14 / 17 | 67 / 69 / 58 | | 508 / 508 / 509 | +31k | 1.30 / 1.67 / 1.73 (0.28-0.33) | 4 (2) | +11 |

  The copies are instances in their section's existing batches (+1-2 draws: the crowd's extra characters), their
  colliders the templates' BVHs; who waits for whom is worked out ten times a second.
- S3's lake (closed at both ends, too narrow to turn): a boat watched at one end goes back the other way after 10-22 s,
  astern from the far end (no bow wave, boats.js's 'back' state), ahead from its start, so the lake keeps moving
  while you stand on the bridge; out of sight it is recycled as everywhere else.
- Films for the user (60 s each, real speed, mp4 + contact strip .jpg), in this folder:
  - `film_painted_bank` / `film_waves_bank`: S2's river from the roof of the boat moored at the north bank (X 236),
    looking south-west across the water toward the mist where the river leaves the silk;
  - `film_painted_crown` / `film_waves_crown`: from the Rainbow Bridge's crown over the west railing, down onto the
    channel under the arch and S3's lake.
  `tools/flow_film.mjs` makes them (`--from` lets the river run while you stand elsewhere, then walks you in without
  the teleport's reset; `--cam` the follow camera's distance).

- Final runs on the final code (tags flow_default2, flow_waves6, flow_painted8): default world 211/211, boats.html
  12/12, rides 5/5; waves 209/211 and painted 210/211, the misses the S2 north-bank walks through the sack porters'
  yard (people timing: replayed from walk 95 on, all of them pass in painted; the baseline sound_v2 run missed the
  same walk). Bridge ride PASS again (`bridge_ride.log`).

## For the lead and the user

- **Decision (the user):** keep today's motion, or adopt `painted` or `waves` (either needs `map/BUILDING.md`'s
  "Boats move as painted" and "no invented traffic" changed). Second, optional: the river can't carry boats through
  at real size: S2's moorings at the S3 seam (mat_cargo_21055 rafted to big_cabin_21120, 19518's stern, the south-bank
  boat) leave no gap, and S3's west basin is filled by the two painted boats under way. Opening a channel (shortening
  or moving that raft, a build choice) would let S2's boats come up under the bridge, masts down; the lanes tool would
  find it on its next run.
- **sound.js / boats.list:** with `waves` the list also holds copies: `id` `<template map id>~flow<n>` (unique, stable
  while the page lives), `extra: true`, `roots[0]` their root, `info.motion` 'under_way'; while out of sight `hidden`
  is true and the root sits 100 m under the water at its lane's start. Flow boats' `state` is 'rest' (at the painted
  spot), 'out' (ahead), 'back' (astern, S3's lake), 'far' (waiting); `effort` and `wave` as before.
- **world.js:** no new line. `water.js`, `backdrop.js`: untouched. `web/public/assets/boatflow.json` (57 KB) must ship
  with the page; it is fetched only with the switch on.
- **For the engine's batches:** boats.js `batch()` keeps `it.gid` per instance and copies add instances to the same
  batches (`copy`, growing them with `setInstanceCount` when full) and delete them (`uncopy`); `show(b, on)` toggles a
  boat's instances. A device tier (tiers.js) could set `flowCap()` in boatflow.js instead of its own touch/memory guess.
- Two section bugs seen on the way (for the lead): S2's ground lip 0.57 m over S3's river at the seam (X 151.1-151.5,
  D 15-24, collider too); and the S3 lake's ends are closed by moored hulls, so no waves boat can turn there.

boat-flow done 2026-10-12 23:15
