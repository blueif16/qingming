# gate: the city gate (城门)

The user chose this as the first reconstruction section on 2026-10-10. It is candidate B in
`reference/scroll/candidates/`.

**Boundary.** It follows S5 in `reference/scroll/sections.md`, which is 余辉's segment 5, "平桥城门", widened to take in
the tax office just inside the gate.

**Scan rect:** x 5600–9312, y 0–1792. Before r3 it was x 6000–9696.

**What's in it**, from inside the city outward; `sections.md` §3 has the scholars' readings:
- the wine depot with three archers, partly at the left edge;
- the tax-office quarrel (货到税讫);
- the tail of the camel caravan, which is leaving the city;
- the inner ramp and the gate tower, with its drum and a lone watchman or sightseer;
- the gate passage, with a camel half out of it;
- the slumping rammed-earth wings with trees;
- the barber at the wall foot (城下修面) and idlers;
- a kneeling figure, read either as a road sacrifice or as a beggar, and a rider in a broad hat with servants;
- the 串车 with the calligraphy-screen tarp, and porters with baskets;
- the moat bridge (平桥), with sightseers at the rail and two beggar boys.

## Runs

**r1_base, 2026-10-10.** Old rect.
- Prompt: `scroll_restyle` and `scroll_restyle_tile`, original wording; model gpt-image-2.5.
- Alignment after registration: overview 0.48, tiles 0.43–0.52.
- The raw tiles drifted 14–34 px down.
- Look: full green canopies on every tree. That is greener than both B1 and the scroll.

**r2_overview_test.** The new look prompt, run on the overview only, on the old rect.
- The trees turned into bare early-spring trees and willows, the colour went muted ochre and sage, and the raw
  alignment rose from 0.31 to 0.54.
- Accepted.

**r3_look_s5, 2026-10-10.** The S5 rect, with the prompt split into parts:
- `scroll_look`: the palette sentence (`style_palette`, copied word for word from `style.txt`), B1's low
  saturation, early-spring trees as painted, readable clothing colours;
- `scroll_layout`: the position rules, plus "do not shift or zoom the picture";
- `scroll_detail`: what to restore from the silk.

Results:
- **Overview:** alignment 0.64, needing no registration (shift 6,−6 px, scale 1).
- **Tiles:** 0.39–0.66 after registration. The raw tiles still drift up to 34 px down.
- **The two lowest tiles,** r0c1 (the tower) and r0c2 (the trees), line up in the overlays. They score lower
  because they are mostly fine hatching and bare branches, which get redrawn stroke by stroke.
- **Water:** the moat under the bridge reads as water again.

## Placement test, 2026-10-10

Goal: get a few figures to their right positions, and check that those positions carry into 3D.

Six figures are recorded in `figures.json`: their foot and head points on the scan, support surface, pose, facing and a prose note.

**Picking the figures.** I chose them for variety:
- `tax_inspector`: standing;
- `tax_official`: seated indoors;
- `camel_driver`: standing with animals;
- `tower_watchman`: elevated;
- `bridge_porter`: walking with a load;
- `bridge_sightseer`: leaning on a rail.

The barber could not be found: the silk is too faded there, and the restyle drew a different group. He is listed under `unresolved`.

**Positions in the pictures.** Read off gridded zooms of the scroll and the restyle (`tools/scroll_inspect.mjs`). `check/figures.jpg` shows the markers sitting on the right figure in both images.

**From the picture to the ground.** A local oblique mapping, fitted on the moat bridge:
- the deck is assumed 8 m wide and 14 m long;
- that gives 77 px/m along the street and a depth axis of (28.75, −53.75) px/m.

`node tools/scroll_pipeline.mjs gate figures` writes `figures_world.json`.

The resulting layout matches the scholarship without being forced to:
- the tax office lands on the north side of the street, about 3 m inside the wall (名画记: "在街北紧贴城墙的第一家");
- the camel driver lands by the passage;
- the porter and the sightseer land on the bridge deck.

**3D check.** `blender/gate_figures_test.py` (scene `gate_figures`) builds:
- a true-scale gray-box with stand-ins;
- an orthographic camera plus a shear that reproduces the scroll's view.

`tools/overlay_render.mjs` lays that render over the restyle.
- All six stand-ins land on their figures (`test3d/oblique_figures.jpg`).
- The eye-level views (`test3d/eye_views.jpg`) show sensible relationships.

**Findings:**
- **The railings check out.** Modelled at a real 1 m height, they land on the painted railings without being fitted to them. The mapping holds at the bridge.
- **Painted figure size is not a usable scale.** Street figures are painted about 1.3× life size against the architecture. The watchman is painted at about 0.7×. Positions must come from foot points, and the build uses true-scale people.
- **Hidden feet need estimates.** These are noted per figure: the official's feet are under the desk, the sightseer's are behind the rail, and the watchman's are behind the threshold.
- **Elevated figures need a support height.** The watchman's 10 m tower floor is assumed. The tower model has to be placed around him, not the other way round.
- **The moat doesn't match.** Modelled running north–south beside the wall, it shows as a diagonal band in the scroll's view. The painting has water only under the bridge and ground with trees north of it. The moat's course is open.
- **The wall, tower and office boxes are rough guesses** for context only. Fitting the projection on more structures (the office front, the gate block) would show how far the single mapping holds across the section.

## Web scene and bench, 2026-10-10

**Build.** Built with the B1 street workflow (skill `web-scene`):
- `blender/gate_scene.py` builds the walkable gate in the live Blender session.
- `tools/export_web_scene.mjs gate` ships it: 161 KB.
- `web/gate.html` is the page, with the six figures from `figures_world.json` (porter and townsman models).
- The trees are 16 willow cards from `scene.json`, at positions read roughly from the restyle.
- A load-test panel adds walkers, gate-section copies, and stand-in buildings at Messenger's density.

**Bench.** `tools/bench_page.mjs` with `sections/gate/bench.json`; Windows Chrome, RTX 4070 SUPER, 1920×1080,
uncapped. Full table in `gen/sections/gate/web_check/bench.md`.

| scene | people | fps | CPU ms | GPU ms | draw calls |
|---|---|---|---|---|---|
| as built (boxes, 6 figures) | 6 | 1550–1790 | 0.5 | 0.55 | 70–74 |
| 1 gate at real density (about 130k static triangles) | 60 | about 510 | 1.85 | 1.6 | 280 |
| 4 gates at real density | 240 | 122–145 | 6.7–8.0 | 4.5–5.7 | 870–1060 |
| 4 gates, no ink normal pass | 240 | 163 | 6.0 | 4.0 | 720 |
| 4 gates, CPU 4× slower | 240 | 20 | 50 | (CPU-bound) | 1055 |
| 1 gate, CPU 4× slower | 60 | 84 | 11.2 | (CPU-bound) | 280 |

- **People dominate the cost.** Each one is a mixer plus three draws (colour, normal, shadow), and none are culled.
- **Animation is only about 20% of CPU time.** The rest is draw submission.
- **The ink pass's second geometry render costs about 25%.** Messenger avoids it with one multiple-render-target pass.
- **Desktop has plenty of headroom even at 4 gates.** A phone-class CPU, approximated with a 4× throttle, holds
  one gate at 60 fps or more but not four.

## Rebuild with the Song construction kit, 2026-10-10

The user rejected the gray-box version, so everything is rebuilt from `blender/song_kit.py`, following Messenger's
construction rules (`reference/messenger_study/world_notes.md`). Forms come from close-ups of the r3 restyle.

**Gate block.**
- Battered brick faces with a stone plinth course, a brick string course and a stone coping.
- The passage has paved floor and threshold, timber lining posts with transverse lintels, a board ceiling, two
  studded board leaves swung back against the walls, and the small roofed frame over the outer opening.

**Tower.**
- A brick podium with a bracket row carrying a planked balcony and balustrade.
- The 5 × 3-bay hall has octagonal red columns on stone bases, an architrave and plate, and lattice windows over
  sill walls.
- The open door shows the drum inside.
- 32 bracket sets carry the eave beam.
- The hipped roof has curved slopes, swept-up corners, a timber underside, rafter ends, hip and main ridges, and
  ridge-end ornaments.
- A front stair with sloped railings climbs from the terrace.

**City wall.**
- Rammed-earth wings built course by course (ledges that ink as lines), bulging and slumped, with an uneven top.
- Rubble and grass at both feet; grass and six trees on top (土墙杂树).
- An inner ramp (马道) runs along the south wing up to a landing on the terrace, which has a balustrade.

**Bridge.**
- Plank deck with gaps on two stringers, stone abutments, three timber trestles standing in the water.
- Railings as painted: capped posts, three rails, two board courses and a brace per bay.

**Tax office.**
- Stone plinth with steps, timber columns, lintels and brackets, plaster walls with lattice windows, an
  overhanging gable roof.
- Inside: the desk, a bench, the frame scale, shelves and posted notices. Cloth bales stand outside.

**Houses and city fabric.**
- Five houses from `song_kit.house`: stone plinth and steps, columns, plank doors, lattice windows, a bracket
  row, gable roof, and awnings on some.
- Courtyard walls with tile caps.

**Ground.**
- A heightfield with a flattened, rutted road and sloping moat banks.
- About 520 grass tufts and stones; none on the road.

**New materials:** one shyfai sheet (`prompts/material_sheet_gate.txt`) cut into brick, rammed earth, stone, red
timber, deck and grassy ground by `tools/cut_material_sheet.mjs`.

**Collision.** Stairs are visual only. The walker collides with a hidden ramp laid over them (Messenger's
separate hit mesh), because the capsule could not climb short treads.

`sections/gate/walks.json` passes all seven routes (`tools/walk_page.mjs`):
- street through the passage and over the bridge;
- up the ramp;
- across the terrace;
- up the tower stair into the hall;
- into the tax office;
- onto a plinth;
- kept out of the moat.

**Size.** 83k triangles in 34 draw calls; `gate.glb` is 1.9 MB, and the page loads 2.7 MB in all.

**Bench** on the rebuilt scene (same setup as above; `bench.md`):

| scene | people | fps | CPU ms | draw calls |
|---|---|---|---|---|
| rebuilt gate | 6 | 1300–1480 | 0.6 | 133–161 |
| 1 gate | 60 | 500–550 | 1.7–1.9 | 295–323 |
| 4 gates | 240 | 141–145 | 6.7–6.9 | 914–1173 |
| 4 gates, no ink normal pass | 240 | 189 | 5.1 | 787 |
| 4 gates, CPU 4× slower | 240 | 22 | 45 | 1150 |
| 1 gate, CPU 4× slower | 60 | 92 | 10.2 | 295 |

**Still rough or missing:**
- The wall, tower and office positions are not measured.
- The moat's course is unresolved.
- No camels, donkeys, carts or the barber's stall yet.
- Every tree is the one willow card.
- The section ends at a bare edge (visible from the tower).

## People and routines, 2026-10-10

**Figures.** 11 more figures read off the scroll grid and added to `figures.json` (17 in all), each checked on
`check/figures_overview.jpg`:
- at the tax office: the carter handing over the manifest, and the man declaring inside at the desk;
- by the wall outside the gate: six idlers (one reclining against the wall, a group talking, one squatting);
- on the moat bridge: three more fish-watchers leaning on the near railing.

**Who they are and what they do** is `people.json` (run by `web/src/people.js`; workflow in the `characters` skill):
- 16 figures cycle through their actions at their spots: the official writes, then answers; the inspector points and
  argues; the carter hands over the manifest, waits, gapes; the watchers lean on the railing; the wall group chats.
- The porter carries his load from the bridge through the passage into the city and back, at his scroll start point.
- 26 traffic walkers on the road through the passage and over the bridge: eight character types, each at its own pace
  (strolling scholars, quick labourers, loaded porters and carters), stopping now and then to look at the view; about a
  third walk in pairs and stop to face each other and talk.
- Nudges where our model needs them: the official sits on the bench, the watchers stand 0.45 m behind the railing so
  their forearms rest on it (two step off the posts), the reclining man leans on our wall face.
- The traffic path is threaded between the wall idlers (D up to 6.1) and the two willows north of them (trunks at D 8.4
  and 8.7). The closest pass to a standing figure is 0.75 m. In a 20 s watch nobody got stuck or left the ground.

**Fixes found on the way:** ground rays fell through the 1.6 cm gaps between deck planks (now three rays, highest wins);
walkers climbed the hidden tree-trunk colliders (now steps over 0.35 m are ignored).

**Bench** (`web_check/bench_people/bench.md`), with people culling and the two CPU fixes in the `web-scene` skill:

| scene | people | fps | CPU ms | draw calls |
|---|---|---|---|---|
| the gate with its people | 43 | 447–528 | 1.7–2.1 | 208–263 |
| 1 gate | 80 | 310–365 | 2.6–3.0 | 277–374 |
| 4 gates | 172 | 147–236 | 4.1–6.6 | 319–839 |
| 4 gates | 240 | 102–150 | 6.5–9.6 | 381–990 |
| 4 gates, CPU 4× slower | 240 | 14 | 69 | 941 |
| 1 gate, CPU 4× slower | 43 | 81 | 11.4 | 204 |

Routines cost more CPU per person than the old single-clip walkers (cross-fades, twin loops, path logic): four gates with
240 people at 4× throttle fell from 22 to 14 fps. Batched skinning and animation detail levels are the next levers.

## Your character, the camera and bodies, 2026-10-10

The user asked for Messenger's view (seeing yourself) and for people to have volume.

- **Messenger, read from its shipped bundle** (`reference/messenger_study/world_notes.md`): a third-person follow
  camera orbiting your own character, aimed at its head, pitch limited to 45 deg, with camera collision; NPCs stop
  and face you within 2.5-3 m; NPCs have no collision volume against the player.
- **Now on the page:** third person by default with your own character (the "You" panel picks which; default the
  official), the camera following with Messenger's lag and wall pull-in, wheel to zoom; V for first person, where
  your body stays below the camera (its head bone collapsed). Everyone has a body: you can't walk through anyone;
  walkers sidestep around you and each other, slow down behind someone, and stop to face you only when you stand in
  their way.
- **The bridge watchers** looked like they were falling into the railing: the lean motion was a stiff plank from the
  feet. A new text-to-motion take, elbows on the rail and chin on clasped hands with the feet under the hips, reads
  right; they stand 0.3 m behind the railing, 0.8 m or more apart.
- **The tower watchman** stood in the middle of the hall doorway and now blocked the way in: moved 0.6 m aside.
- Checks: all 7 walk routes pass; `tools/people_check.mjs` passes (no walker stuck; walkers pass each other at
  0.58 m and figures at 0.63 m; the player stays 0.56 m from anyone it walks into; on the road walkers flow around
  the player and stop no closer than 1 m).
- Bench (`web_check/bench_people/bench.md`, third person): one gate with 43 people 560–620 fps; four gates with 240
  people 121–178 fps; at 4× CPU throttle 79 fps (one gate) and 17 fps (four gates).

## Tiles and edges, 2026-10-10

The user: "all the tiles" means surfaces that look copy-pasted, plus every straight edge that says block-piling
("Minecraft"). Messenger keeps big faces plain and draws its lines where surfaces are cut; we keep painted surfaces,
but nothing may repeat and nothing may be a ruled line. The stair texture they liked worked because its painted,
irregular block outlines happened to fall across the steps and hid the box.

What changed (spots in `shots_tiles.json`; before, steps and `tiles/before_after.jpg` in `gen/sections/gate/tiles/`):
- **Soft pieces** (`song_kit`): `soft_slab` (hand-cut outline: every corner rounded with its own radius, edges
  gently wavy, top edge eased, a slight tilt, its own patch of the swatch), `soft_box`, `stone_run` (a course of
  separate blocks with leaning joints), `masonry`, `paving`, `soft_plinth`, `plank_deck`. Stairs are full-rise
  stones of different lengths on one sawtooth fill. They replace the deck, all stairs, plinths, column bases, the
  gate block's plinth courses and coping, the passage paving, the threshold, the ramp landing and the abutments.
  The joints between pieces draw the ink.
- **Painted stone faces**: `prompts/atlas_stone_faces.txt` gave 16 stones with worn, chipped, inked edges, cut by
  `tools/cut_atlas.mjs` into `textures_v2/atlas_stone.png`. Each face of a soft stone is mapped whole onto a random
  cell (`song_kit.FACE_ATLAS`, material `stone_face`), so the painting traces that stone's own edges and no two
  neighbours match.
- **Structure-free washes**: `prompts/material_sheet_gate_surfaces.txt` (wood grain, stone, brick, rammed earth,
  ground, road; no joints or motifs), made seamless by `tools/make_tileable.mjs`. The deck boards run their grain
  along each board.
- **Ground**: one smooth mesh (no ink creases between 1 m cells, no stair-stepped material seams); each vertex's
  bareness (road, moat banks, passage front) rides in TEXCOORD_1, and the page blends the painted ground and the road
  wash (`textures_v2/ground_road.png`, `tools/join_textures.mjs`) along a noisy edge that dries slightly darker.
- **Page shader** `web/src/surface.js`, by material name: `wash` (texture bombing, two noise-chosen offsets), `washU`
  (offsets along u only, so the rammed earth's painted layers stay level), `blend` (the ground), `patch` (brick:
  painted bricks and a tone-matched wash, `tools/match_tone.mjs`, in ragged metre-scale patches like worn render),
  `tone` (a broad world-space tone wash on everything else). `gate.html?surface=0` turns it off for A/B.
- **Gate block**: arrises rounded and its long edges uneven; the passage jambs follow.
- **Smooth shading**, sharp only above 35 deg: wavy edges and curved roofs read as curves; the rammed wall lost its
  vertical seams.
- The exporter now caps textures at 1024 px (atlases) and keeps unused attributes (for TEXCOORD_1).

What didn't work: the plain stone wash alone rendered near white, so stones looked like foam blocks (hence the
atlas); per-step support blocks with atlas faces made a striped fence on the ramp's side (hence the fill); plain
washes for ground and rammed earth looked blank (the painted swatches came back, bombed); untuned brick patches
looked like smoke (tone-matched, narrower ragged edge).

Size: 122k triangles (83k before; budget about 130k), 35 draw calls, `gate.glb` 2.4 MB. Walk: 7 of 7 routes pass;
people check passes. Bench (`web_check/bench_tiles/bench.md`) ran while Windows was at 76% CPU from other apps
(animation alone cost 0.8 ms against 0.45 this morning), so its numbers are not comparable with the earlier ones.
An A/B on the same machine state shows the surface shader costs nothing measurable (one gate: 286–317 fps off,
271–393 on). Re-bench on an idle machine.

Still straight or repeating: roofs (tile swatch, ruled eaves and ridges), plaster walls and timber boxes of the
houses and office, yard walls, the tower podium (a brick box), the bales, the rammed wall's ledges between its
1.4 m stations.

## People, routing and true colours, 2026-10-10 (evening)

The user: people with "very weird actions… some look like zombies"; walkers you block "continuously trying to walk
or just stay at the same place" (they want smart routing: go round you, or find another way); and "the entire
colour schema doesn't need to be this full yellow… the scroll is yellow because the paper turned bad after 1,000
years… this is the actual true world", with the light changing from morning to evening.

**Actions** (frame sheets: `gen/characters/audit_walks/`, Meshy previews: `gen/meshy_previews/`):
- The zombies were the carry walks without anything to carry: the carter's Carry Heavy Object Walk (551) holds both
  arms straight out; the porter's Carry Water Bucket Walk (552) bends double to the ground every few steps; and the
  sightseer's Thoughtful Walk (121) hangs its head with limp arms. All three are off the road (people.json
  `clips_why`); porters and carters walk with the rig walk until props exist.
- The default idle (library 0) turned round and flung an arm behind; it was what every blocked walker did. Every
  character now has Meshy Idle 3 (243), a calm stand with small weight shifts (24 credits, 489 -> 465).
- 'gape' (Look Around Dumbfounded) is out of every cycle. Crowded walkers no longer slow to a slow-motion shuffle:
  below 35% pace they stand (calm idle) instead.

**Routing** (people.js "routing"): every 0.1 s a walker looks 2.6 m ahead; each body there shuts a span of sideways
offsets (both widths plus a 0.16 m gap); inside the path's corridor (measured once per path against the colliders:
walls, railings and trunks at knee and chest height, ground steps over a curb) it steers to the free offset nearest
where it is, so it keeps to its side of whoever it passes and drifts back to its lane after. It faces the way it
actually moves. Same-way walkers at about its pace are followed; slower ones and anyone standing are overtaken.
If no offset is free within 1.6 m it stops, faces whoever blocks it, and after 1-2 s turns round and goes the other
way; a queue that doesn't move turns round after 3-5 s. Pairs walk abreast and drop into single file where there's
no room beside. `people.debug = true` keeps each walker's spans and free offsets in `a.dbg`.
Checked: `people_check` PASS (you on the bridge: 3-4 go round, none turn back; you in the narrow mouth at X -8:
4-5 go round, 2-5 turn back; nobody stands stuck over 6 s); film strips by the new `tools/film_page.mjs` in
`gen/sections/gate/routing/`. It costs nothing measurable (4 gates, 240 people: 79 fps with it, 73 without).

**True colours** (`web/src/palette.js`): each textured material keeps its painting but its mean colour is moved to a
real one (colour = target / texture mean, per channel, in linear light): grey brick and stone, grey tile roofs, white
lime plaster, weathered timber and planks, red-ochre paint, tan rammed earth, dusty grey-brown ground, green willows.
The warm grade, paper stains and brown ink are off (neutral ink #2a2521). Panel: "true colours" for A/B.

**Daylight** (`web/src/daylight.js`): the sun's path for Kaifeng at Qingming (rises east, about 61 deg in the south at
noon, sets west; +X is east, D north), colour keys by hour for sun, sky zenith and horizon, sky and ground fill and
haze, and a sky dome with a sun glow. Panel "Time of day": hour 05:00-19:48, time flow (game minutes per second),
or `gate.html?hour=18.5&flow=10`. A clock shows the hour. Settings key is now `qingming-gate-test-v2`.
Before/after: `gen/sections/gate/color/before`, `step2` (10:00), `daylight` (eight hours from the bridge).

Bench (`web_check/bench_color/bench.md`, Windows about 28% busy): one gate 316-622 fps, 80 people 305-362, 4 gates
172 people 118-205, 4 gates 240 people 89-135, 4x throttle 68 (1 gate) and 14 (4 gates). Two stray gate tabs from a
crashed screenshot run had been rendering in the bench Chrome (it halved the frame rate); `shots_page` now closes its
tab when the page fails to load.

**Routines by time of day** (asked for later; how achievable):
- The light is done. Crowd size by hour (fewer at dawn and dusk, most around noon) is a small scheduler in people.js
  once walkers enter and leave at the section's edges (handoff item 4); without arrivals it would mean pop-in.
- Different things at different hours (carts and porters bringing goods in the morning, officials arriving at the
  tax office, a noon rest in the shade, trade in the afternoon, closing and going home through the gate at dusk)
  are schedules in people.json over the same setups (item 4): data, plus a clock-driven switch in people.js.
- What costs more: stalls that open and close (kit variants shown or hidden by hour), lanterns and window light at
  dusk (emissive cards and a few lights), and actions such as opening shutters, sweeping, carrying goods or eating
  (Text to Motion: 10 credits per action plus 3 per character; six actions on three characters is about 114).

## Trees, local time and the sundial, 2026-10-10 (night)

**Floating trees.** Every ground tree stood 2.1-3.0 m up. `placeTrees` dropped a ray from 20 m and the BVH it hit
includes the hidden trunk colliders (`gate_scene.colliders`: a 2.5 m cylinder per tree), so each tree sat on the top
of its own trunk. Trees now drop onto visible `__col` meshes only (`floorUnder`); the six on the wing walls still
land on the wall tops (6.6-7.6 m). Before/after: `gen/sections/gate/trees/before`, `final`.
Still open: the positions were read at a glance, and the scroll's trees here are mostly bare elms and pine-like
trees, not willows.

**The time of day is the viewer's local clock** (the user: "linked to whatever browser time… users' local time"):
`localHour()` in daylight.js, followed in 10-second steps. The panel's hour (now 0-24) or `?hour=&flow=` sets an hour
instead; "your local time" turns it back on.

**The sundial** replaces the numeric clock (the user: "I really hate how you're just putting up the time numbers…
think of what, during the time of the scroll, they would use"). A Song equatorial sundial (日晷), `web/src/sundial.js`,
in the top-left corner (104 px, 76 px on phones):
- the face is a painted blank stone disc (shyfai, `prompts/ui_sundial.txt`, `gen/ui/sundial_face_0.png`), cut by
  `tools/make_sundial.mjs`;
- carved on it: the twelve branches (子 at the top, 午 at the bottom, as the upper face reads from the north), the
  hundred 刻 as ticks, the twelve boundaries;
- the branch glyphs are outlines from Ma Shan Zheng (OFL), so the page loads no font;
- in April the sun lights the upper face all day, and the gnomon's shadow turns 15 deg an hour, clockwise; it points
  at the current double hour, whose character is filled with cinnabar;
- the disc takes the world's light;
- once the shadow fades (twilight, night) the moon, at its real phase for the date, rides the ring at the hour;
- on hover: the watch at night, the double hour and its half, the clock time (e.g. "三更 · 子正 · 00:24").

The dial was checked at nine hours and under a full moon (`gen/sections/gate/clock/dials.jpg`, `v3/sheet.jpg`). In an
in-page A/B its cost was within noise.

**Nights are real now** (the page opens at night for many visitors):
- light keys run round the clock (night from 20:36 to 04:12);
- a blue sky fill to walk by, even on a moonless night;
- the moon trails the sun by its phase, lights the town and casts shadows when it is up;
- stars, and a moon disc whose lit side faces the sun;
- the ink line is never lighter than the surface under it (post.js); at night lines had turned pale.

`?date=2026-10-25` picks a full-moon night for checks. Spots: `sections/gate/shots_clock.json`;
full moon: `gen/sections/gate/clock/v2_fullmoon`.

**Tools.** shots_page, film_page and bench_page now set 10:00 unless told otherwise (`--hour local`, or a spot's or
`--set`'s hour), so runs stay comparable whatever the clock says. shots_page and film_page close their tab when a
module fails to compile (the page then never says "Failed").

**Checks:** walk 7/7 PASS; people check PASS.

**Geography (the user asked whether the bridge and gate follow the scroll exactly).** Not yet:
- measured: the moat bridge (it fixes the oblique mapping) and the 17 figures (foot points through that mapping);
- rough: the wall, gate block, tower, tax office and houses follow the restyle's forms at plausible Song sizes, at
  rough positions;
- read at a glance: the trees;
- open: the moat's course (the painting shows water only under the bridge).

The next step is to fit the mapping on more structures (office front, gate block, tower) and place them from the
scroll, as the figures were.

## Open

- Inventory: 17 figures placed (above). The full inventory has not been done.
- Props on the people (brush, manifest, lead rope, the porter's pole and baskets), the camels and donkeys.
- Adopt Messenger's remaining performance techniques before scaling people: one render pass, batched characters,
  detail levels for the static world, animation detail levels for distant people.
- Overlap ghosting is still possible. Read individual `_reg.png` tiles for detail.

## Mapped from the strokes and rebuilt from the map, 2026-10-11

**Why.** The user asked why the bridge "just comes out of the gate" and wanted every position to come from the strokes,
recorded so no session has to look at the scroll again. The strokes do put the moat bridge on the road just outside
the gate (the passage's outer mouth at u ≈ 7513, the bridge's west end at u 8248: 12.1 m). What was wrong was the
method: one scale fitted on the bridge, the gate, tower, office and trees placed by eye, nothing marking which numbers
were measured. The user checked and agreed.

**The map** (`map/`, `map/text/S5.md`): 192 entities from six agents (five tiles of figures, animals, carts, trees and
props; one for structures, roads and water), merged with `gen/map/S5/merge_fixes.mjs`. 81 figures, 12 animals, 2
vehicles, 37 trees, 15 props, 9 buildings, 11 structures, roads, water, 18 groups.

**Corrections to what we believed** (now in the text map):
- a second figure stands on the tower balcony (the watchman is not alone);
- only two camels are inside the gate (a third may hide behind);
- the "screen cart" and "the 串车 crossing the bridge" are one vehicle; its donkey is on the bridge;
- the bridge porter walks west, into the city; the rider outside the gate is on a donkey, perhaps veiled;
- the barber and his customer are there, but no awning, stool or hair sign shows on the faded silk;
- the second taxpayer group is a sack cart drawn west, mostly in S6;
- the north wing is not painted; the south wing is an earthen mass under the block's east half;
- water shows only around the bridge.

**The frame** (`map/frames/S5.json`). The painter uses no single projection: receding edges slope -0.88 at the gate
block and -1.60 at the bridge. The frame keeps one scale across the street (77 px/m), one depth rate on the silk
(51.25 px/m, from the bridge's 8 m deck), and lets the receding direction drift between the two. Checks: passage and
block faces square to the road, wall 11.3 m thick, bridge railing 1.2 m, bridge 12.4 m long (was assumed 14),
passage 2.4 m wide and 8.3 m tall (outside Song norms: an open question).

**What moved in the build** (old → new): gate block X -26.9..-12.1 × D -5..14 → X -23.95..-12.68 × D -0.51..8.53,
height 7.88 → 10.0; passage D 5.0..8.2 → 2.93..5.37, height 5.6 → 8.3; tower floor 10 → 12.06, hall turned to 3 bays
across × 5 along the wall with a north-south ridge; bridge 14 → 12.4 m; tax office front D 11.1 → 11.9 and 3.9 m
further west, columns at the painted bays; houses replaced by the painted ones (wine depot and back hall north, two
roofs and the bracketed house south); trees at their mapped trunks (37, was 22 read at a glance); the 16 figures and
the porter from the map; the road from the map; the lower flight (马道) against the block's south face.

**Builder choices** (marked `choice:` in `blender/gate_scene.py`; moves in `build_choices.json`):
- the north wing runs north along the block's faces (not painted); the south wing runs straight south (painted edges
  slant south-east, low confidence);
- the tower hall's columns are 3.0 m and the hall sits 0.9 m inside the balcony (painted at about 0.6 of the street's
  scale: its door measures 1.3 m); the podium is kept inside the terrace's balustrade;
- the tax office is 4.3 m deep, with a courtyard wall behind (its back is hidden);
- house depths where their backs are hidden; the low south roof sits just south of the big one;
- the lower flight starts 15 m south of the block (its foot is below the silk's edge), on an earthen fill; the upper
  stair takes the 1.4 m the strokes leave, so it is steep and its rails don't collide; since the tower pass
  (2026-10-14) the tower stands 1.1 m north of its painted place (a move in `build_choices.json`) so a 1.25 m landing
  lies between the two flights, and the podium and hall are 1.1 m shallower (their back stays inside the terrace);
- two trees whose bases are estimated at the silk's edge stand beside the lower flight, not on it; the knotted elm
  stands on the wing's slope (support `wing slope`, 1.5 m);
- the reclining customer is nudged 1.07 m east to lean on the north wing (people.json).

**Checks:** walk 7/7 PASS (`walks.json` restated against the new layout); people check PASS (standing on the road just
outside the gate, 7 walkers turned back at the narrow passage); shots `gen/sections/gate/map_rebuild/sheet.jpg`.
Bench (RTX 4070 SUPER, 1080p): one gate with 43 people 350-475 fps; 80 people 240-279; four gates 172 people 82-112;
240 people 78-119; 4× CPU throttle 113 (one gate) and 18 (four). 101.8k triangles, 35 draw calls, `gate.glb` 2.1 MB.

**Open** (also in the text map): the depth of the tall structures (the gate reads narrow: 9 m along the wall with a
2.4 m slot; a reading with equal foreshortening along receding lines would give about 11.5 m and 3.1 m); the moat's
course; the 64 mapped figures not yet in people.json; the animals and carts.

## Loyalty pass, 2026-10-11

The user checked the scene against the painting: "absolutely loyal… replicate exactly what the painting has, even to
the amount of trees… leave out the gap, not just fake something just to extend". They then set the rule this pass
built: 3D models only where things are drawn, and painting (not models) beyond the edges. The standard is now
`map/BUILDING.md`, and `tools/loyalty_check.mjs` enforces it.

**Map corrections** (crops in `gen/map/S5/loyalty/`, fixes in `gen/map/S5/merge_fixes.mjs`):
- **Below the gate:** below and left of the gate block (scan u 6300-7450, v 1250-1790) the "south wing" is a mottled
  mound of earth and rock with trees: moss dots, pale streaks, lumpy contours, no courses and no crest. It is about
  5 m across and 3.8 m high against the block's face, and it runs off the silk's bottom edge. `S5.str.wing_south` is
  retired, replaced by `S5.grd.rock_mound_7200`. Scholars read the mass as the slumped earthen wall (余辉 土墙杂树,
  Hansen); the painted form is the same in either reading. The knotted elm stands on its slope (support
  `mound slope`).
- **North of the gate:** north of the block only the big willow, the old bole, bare ground and the far shed are
  painted. `S5.str.wing_north` is dropped. The gate stands without walls (余辉: 撤防的城门).
- **The canopy:** the stall canopy against the studded-door house was named only in that house's note. It is now
  `S5.prop.canopy_6186`.
- **Trees and houses:** the trees in the area match the map, all 7 of them. The "little houses" are the mapped
  `house_6390` (studded door), `house_5800` and `house_5720`.
- **The map now:** 192 entities: 81 figures, 12 animals, 2 carts, 37 trees, 16 props, 9 buildings, 9 structures,
  4 ground features, 2 roads, 2 water and 18 groups.

**Removed from the build** (none of it is painted):
- both rammed-earth wings and their rubble and grass;
- the courtyard wall behind the tax office;
- the jars and baskets by the house fronts;
- all 520 grass tufts and stones and the 60 verge stones (the user's choice: the ground is painted surface);
- the wheel ruts, and the eroded mounds along the wall's feet;
- the bridge's stone abutments (the deck meets the road level, as painted) and its middle trestle (the water between
  the two frames is clear);
- the awnings on the wine depot and house_5800;
- the moat channel north of 14 m, where the painting has trees and ground, not water.

**Built new, from the map:**
- the mound (kit `earth_mound`, soft boulders on an earth bank);
- the two trestle frames at their painted piles (kit `trestle`);
- the three far buildings: `house_9300` (kit `open_hall`), `hut_9055` and `shed_far_8195` (kit `far_shed`);
- the nine props that were missing: the two bridge baskets, the sack, the stone, the pack frame, the yard bundle pile,
  the stakes, the thing on the ground and the pale mass;
- the canopy;
- the wine depot's casks as hooped casks with a bucket and the fire-swatter pole;
- the clerk's hidden seat, part of the tax office.

**People** (the user's choice): all 81 painted figures and nothing invented.
- **At their spots, 63.** Far-rail leaners stand 0.42 m from the far railing; the beggar boys and the small figure
  are scaled 0.62-0.68.
- **Walkers, 14:** the 9 carriers and the 5 painted mid-stride, each walking 6-8 m along its painted direction and
  back.
- **Left out, 4:** the riders, with their donkeys.
- **Nudged:** the recliner and the barber move 1.2 m south onto the block's east face (the north wing they leaned on
  is gone).
- **Traffic:** the 26 invented walkers are now `load_test_traffic`, which only the load-test panel uses.

**Edges** (`build_choices.json` `edges`):
- **The walkable area:** invisible walls round the painted area (`layout.json` `painted_area`: the seams at u 5600 and
  9400 and the silk's top edge), its south edge carried to just past the lower flight's foot (D −17).
- **Mist:** everything outside the painted area fades into the hour's horizon haze (the scroll's blank silk). It is
  thinner near the viewer, so you always see yourself.
- **The panels:** three painted panels on a 70 m ring show what lies past each seam:
  - east, S4's outer road;
  - north, the far ground;
  - west, S6's street and the big wine house.

  South there is mist only. The panels come from `tools/backdrop.mjs` (`gen/sections/gate/backdrop/`).

**Choices** (marked `choice:` in the builder):
- the far buildings' sizes (they are painted small and far);
- the mound falls to the ground 1.6 m past the silk's edge;
- the canopy's high edge sits under the house eave at 2.5 m;
- the hut's plinth is low, because the background path runs just in front of it;
- unchanged and kept: the gate's literal depth (the user chose it), the lower flight's 15 m run, the hidden depths.

**Checks:**
- **Loyalty:** PASS. Every tree (37), prop (16), building (9), structure (9) and ground feature matches the map one
  for one, and 77 of the 81 figures are placed. Not built yet: the 12 animals, the 2 carts and the 4 riders.
- **Walks:** 11/11 PASS. They include round the gate's open north end, through the painted crowd at the passage's
  outer mouth, and each edge.
- **People:** PASS (14 walkers all moving; walkers go round you at X 7 D 2.7 and X −3 D 6.3).
- **Shots:** `gen/sections/gate/loyalty/final/sheet.jpg` (edges: `loyalty/edges2/`, the mound: `loyalty/mound3/`).
- **Bench** (RTX 4070 SUPER, 1080p): one gate with 77 people 207-303 fps; +40 load-test walkers 142-158; four gates,
  308 people, 34-66; CPU 4× slower: 37 (one gate) and 11 (four). 100k triangles, 32 draw calls, `gate.glb` 1.97 MB.

**Open:**
- **Animals and carts:** the 12 animals and 2 carts need Meshy models, and the 4 riders wait for them.
- **The passage mouth is crowded:** with the literal depth the painted idlers stand across the 2.4 m passage's line;
  you thread a 1.3 m gap.
- **The mound:** it reads as smooth rounded boulders. It could take a painted rock face (atlas) for the scroll's
  texture strokes.
- **The panels:** they sit high (horizon about 8° up), and a few haze wisps survive the sky keying.
- **The ground's painted grass:** the scroll paints grass at the moat banks and the bridge's east foot; it isn't in
  the ground texture yet.

## The backdrop panels, 2026-10-12

The four faults of the loyalty pass's panels are fixed in the tool and the page (`gen/expand/backdrop_lessons.md`):
- **Aspect:** the page makes each panel as tall as its painting's own aspect over the arc it spans; no stretch.
- **Height:** `tools/backdrop.mjs` measures each painting's horizon and the front of its painted ground; the page
  stands the horizon at the viewer's eye (the panels follow the eye's height) and the ground's front in ground mist
  that meets the misty floor. The first-round paintings are bird's-eye views, so they are lifted until their ground
  stops sinking: they no longer float, but their horizon still sits about 4° high.
- **Halos:** every edge pixel is unmixed from the paper colour, and colour is bled under the transparent pixels
  (the mipmaps had mixed the cream in). Checked on night and day grounds (`gen/sections/gate/backdrop/review_*.jpg`).
- **Loyalty:** east (a watchtower, a river with boats, hills) and north (hills, ponds, a far town) painted things the
  scroll does not have there. Both are **held back** (`hold` in `backdrop.json`): mist only until redrawn. West (S6's
  street and the wine house) stays.
- **Light:** the panels take the page's own light (sky fill and sun or moon), so at dusk they dim with the town and at
  night they go dark blue.

The redraw (eye-level prompt, new content prompts `prompts/backdrop_gate_<side>.txt`, north from the top band only:
open ground, mounds, bare trees and pines, without the gate tower's roof, the seal and the far path's riders) waits for
the image API: `node tools/backdrop.mjs gate gen`, then read `review_<side>.jpg`, set `pick`, drop `hold`, `ship`.
Shots: `gen/sections/gate/backdrop/before_gate/` and `rekey_gate/` (alone), `before_joined/`, `after_joined/` and
`rekey_hours/` (10:00, 18:30, 22:00).

## Animals, carts, the new cast and the joined world, 2026-10-12

The user: "continue… create our new assets, I don't care about meshy credits, I want high quality work", and
"mind the sizings and do optimizations for both quality and sizing". The gate is now the middle of a three-section
world (S6 inner city west, S4 outer road part 1 east: `web/world.html`, `gen/expand/progress.md`).

- **Animals and riders:** all 12 painted animals stand at their spots (`people.json` `animals`: 8 donkeys with their
  saddle cloths, collar and pack saddle, 3 camels with their pack frames, one with the fan of straw, and 3 pigs: the
  rooting one, the piglet and the lying one); the 4 riders sit on them (`ride`), the old man side-saddle (the elder,
  `ride_side`). Nudges with reasons (`animals_why`, `nudge_why`): the lead camel 0.31 m south (its painted spot put its
  flank 0.3 m into the passage jamb), the rooting pig 1.5 m west against the south jamb (it shut the idlers' gap, the
  only way through the gate), the caravan leader standing at the camel's head outside the mouth (his walking path ran
  through the camel and parked him mid-passage).
- **Carts:** the 串车 under its script sheet with its trace donkey (`kit_vehicles.barrow_screen`), and the covered ox
  cart with its yoke on S4's three oxen (`covered_ox_cart`, its team read from `sections/outer_road/layout.json`) and a
  driver's seat S4's driver sits on. Loyalty: every kind built, nothing unbuilt.
- **The new cast:** the archer (two archers), the child (beggar boys, the small figure), the elder, the hat
  traveller; the carriers walk with their painted loads (`carry_pole` + `pole_*` props, `back_load` + `back_boxes`); the
  串车's carters push it and the groom holds the bridle where they stand.
- **Seam notes applied** (`merge_fixes.mjs`): from S6, the depot's five west casks (`S5.prop.casks_west_5525`), the pole
  man's load (`S5.prop.pole_load_5645`), the two south roofs running west; from S4, the ox cart's front, wheel and
  team, the willow clump's crown, house_9300's end, and the `/seam/` note bug.
- **Choices for the joined world:** house_5800's hidden street wall at D −0.3 and its west end at X −40.1 (it stood
  over S6's painted rider and porters); the wine depot 2.8 m deep (it took 孙羊正店's east upper room); the far shed's
  cover 2.2 m (real size, `BUILDING.md` rule 5).
- **Edges and ground:** one invisible wall per side (`edge:south|east|north|west`; the page drops the seam walls); the
  ground stops 1 m past the seams (the neighbours dip under it) and runs 16 m past the north and south edges, so the
  mist covers its end.
- **Trees:** every tree on its own painted card by form (`trees/assign/S5.json`: willow fans, slender trunks, crab-claw
  elms, pines, old burled willows, shoot trees, whip clumps).
- **Backdrop:** the east and north panels painted hills and a tower the scroll doesn't have: held back (mist there)
  until their redraw, which waits for the image API's balance (`gen/expand/backdrop_lessons.md`).
- **Checks:** loyalty PASS; walks 11/11 (gate alone) and 42/42 on the joined world (`sections/world/walks.json`);
  people PASS; shots `gen/expand/world_final/`.
- **Bench (joined world, RTX 4070 SUPER, 1080p, machine idle):** 220–284 fps with every painted figure and animal of
  the three sections (CPU 3.3–4.5 ms, GPU ~3.2 ms); +200 load-test walkers 176–215; CPU 4× slower 29–48.
  `gen/expand/bench_world/bench.md`.
