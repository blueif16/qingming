# Perf batch 2: the frame-rate engine agent (2026-10-13)

Three items from the brief (`gen/perf/batch2/brief.md`): the boats' batches across sections, two-layer shadows, far
people out of the shadow pass. All three landed. Snapshot `gen/perf/batch2/framerate/build2` on 5196 (the live tree,
so it also held the other sessions' work of the night: trees3d, ambient, start screen, small cards; deleted after the
checks); baseline 5195. Tools and raw numbers in `gen/perf/batch2/framerate/`. Not deployed.

Files touched: `web/src/boats.js` (pool: join/leave, uncopy guard, the batches' shadowMover flag), `web/src/world.js`
(onBatch, shadowLayers and its line in shadowPolicy, CARD_STEP, the shadow comment, `__test.shadowLayers`),
`web/src/crowd.js` (skipEmpty, the group's flag), `web/src/people.js` (a Person root's flag), `web/src/tiers.js`
(high: snap 1, peopleFar 40).

## How it was measured

The machine was shared the whole time (two or three other check Chromes, load up to 11): the same page and view swung
2x between runs (the phone proxy at the crown: 29.7 ms then 62.3 ms CPU a frame on the baseline, minutes apart), so
two-page benches (`ab_bench.sh`) could not show a 5-10% change. Each item was therefore measured **in one page**, a
runtime switch flipped between 2-second measures, A B B A ... for 10 rounds, medians (`framerate/inpage_ab.mjs`): the
machine's load lands on both sides alike. Phone proxy = `?tier=low&adapt=0`, 390 x 844 at DPR 3, CPU 4x (as
`bench_phone.json`); views crown, grain_wharf, storyteller, each warmed 12 s unthrottled first. The shadow pass's own
time was measured too (`framerate/shadow_split.mjs`: three's shadow render call timed, world passes and movers-only
passes apart). The two-page A/B against 5195 ran once at the end for the record (below).

## 1. The boats' batches across sections (landed)

- `boats.js`: `batch(set)` (at fetch) now only prepares each section's pieces by material (`set.byMat`); `join(set)`
  (in `add`, when the section joins) puts them into the page's pool, one `BatchedMesh` per material across every
  loaded section (`this.pool`, keyed by material name, its texture's source, side, transparency, alpha test): adds the
  geometries and instances, packs freed space first (`optimize`), grows the buffers by 1.25x (`setGeometrySize`) and
  the instance count when full. `leave(set)` (in `remove`, after `flow.detach` has deleted the section's flow copies)
  deletes its instances and geometries; the last section out removes the batch, disposes it and its material. A
  section joining a batch that exists drops its own copy of the material (the texture is the same cached one).
  `uncopy` deletes a copy's instances only while its section is still joined (`set.joined`: after leaving, the ids may
  be another section's). The wet rings' batch keeps renderOrder 1, no shadow, no ink.
- `world.js`: `onBatch(bm, on)` given to `Boats`: a new batch is shaded like a section mesh (`shaded`,
  `materialFor`) and added to the scene; a dropped one is removed, unshaded and its material disposed (`disposeStd`).
- Result: boat batches at the crown 32 -> 15 (14 materials; `timber` comes twice: two texture sources), grain wharf
  29 -> 14; draw calls of a frame at the crown (high, 1280 x 720) 375 -> 341. Checked by `framerate/probe_fr.mjs`
  across storyteller, crown, under_arch, grain_wharf, moorings_bank, farmsteads, crown, storyteller (the window
  streaming across S3/S2 with the waves flow on, copies coming and going): every batch's live instances equal what the
  boats and their copies hold (0 mismatches, 0 orphans), all batches gone when the window leaves the river, no
  console errors; `check_deploy` with `window=all` (34 boats) PASS.
- Numbers: two-page phone-proxy A/B (`framerate/ab_item1/ab.log`) was swamped by the machine (both sides 15-32 fps
  at the crown run to run). From the shadow-pass split, a draw costs about 0.08 ms at 4x CPU, so 17 fewer draws a pass
  at the crown is about 1.5 ms a frame on the phone proxy (colour pass every frame, movers' shadow pass at 15 Hz).

## 2. Two-layer shadows (landed)

- `world.js` `shadowLayers` (after `shadowPolicy`): `renderer.shadowMap.render` is wrapped. **The split rule:** every
  direct child of the scene is the world's layer by default; a direct child with `userData.shadowMover = true` is a
  mover (its whole subtree drawn every people's turn). Flagged: the crowd's group (`crowd.js`), a Person's root (your
  character, `?batch=0` people; `people.js`), the boats' batches (`boats.js`). The tree cards are in the world's layer
  (32-41 instanced draws, most of the movers' cost when they were movers); they turn to the camera, so a people's turn
  redraws the world too once the camera has gone `CARD_STEP` (1 m) from where it was last drawn.
- The world's layer is drawn (three's own pass, with a stand-in root holding only the static children) when it is due:
  the snapped centre or the sun stepped, `shadowState.dirty` (a section came or went, shadows switched), the camera
  went 1 m, or a static direct child of the scene came or went (a section's tree cards, a module's meshes: the list is
  compared each pass). Its depth is then copied (`blitFramebuffer`, `DEPTH_BUFFER_BIT`) into a depth-only renderbuffer
  of the same format (DEPTH_COMPONENT24, the shadow map's depth texture). A movers-only redraw (the people's turn,
  peopleHz) replaces three's clear of the shadow target with the copy back, then draws only the movers. The map the
  materials sample is three's own; nothing in the shading changed. `?shadowcache=0`: one layer, as before;
  `__test.shadowLayers` = { on, world, worldDraws, moverDraws }. A static thing that changes inside an object already
  in the scene asks for `shadowLayers.world = true`.
- `tiers.js` high: `snap: 1` (was 0): the box round you steps by 1 m, so the world's layer is redrawn as you walk a
  metre, not every frame (its people are still drawn every frame).
- Look: with time frozen, one layer against two layers pixel-identical (mean 0.000) at crown, grain_wharf, under_arch
  (low), after motion (people walked with two layers on, then frozen: grain_wharf, moorings_bank identical to one
  layer, so no ghosts), and across a tier switch low -> high (the map and the copy re-made).
- Numbers, phone proxy, in one page (`inpage_item2_phone_b.json`, A one layer, B two layers):

  | view | one layer | two layers |
  |---|---|---|
  | crown | 41.4 fps, CPU 22.6 ms, GPU 8.5 | **45.9 fps, CPU 20.2 (-10%)**, GPU 5.7 |
  | grain wharf | 21.5 fps, CPU 45.6, GPU 20.6 | **21.8 fps, CPU 43.7 (-4%)**, GPU 18.0 |
  | storyteller | 34.3 fps, CPU 27.9, GPU 12.8 | **39.1 fps, CPU 24.6 (-12%)**, GPU 9.7 |

  The shadow pass's own CPU a frame (`shadow_split_low2.json`): crown 0.66 -> 0.14 ms, grain wharf 2.17 -> 0.78,
  storyteller 1.36 -> 0.48 (a world pass 118-138 draws, 5-9 ms at 4x; a movers pass 4-24 draws, 0.8-2.5 ms). Smaller
  than the proposal's -14...-18%: batch 1's policy had already cut the low tier's shadow redraws to 15 Hz.

## 3. Far people out of the shadow pass (landed)

- `crowd.js` `update`: a batch with nobody to draw now leaves the passes altogether: `mesh.visible = false` when
  nobody of it is in view, `mesh.castShadow = false` when nobody is within `shadowFar`. Before, an empty batch
  (count 0) still went through three's per-object work in every pass (render list, program and uniforms, its
  onBeforeRender, an instanced draw of 0); the shadow cut lowered the count but kept the draw. `crowd.skipEmpty`
  (default true; false = as before, for A/B).
- `tiers.js` high (full): `peopleFar: 40` (was Infinity). Look (1920 x 1080, frozen, `look_peoplefar/`): 50 and 40 m
  changed no pixel at crown and storyteller, 0.001% at the grain wharf; 30 m changed 0.03% there. 40 m is the same
  picture (and the same as INK_FAR, people's ink).
- Numbers, phone proxy, in one page (`inpage_skip_phone.json`, A empty batches drawn as before, B skipped): crown
  21.0 -> **32.3 fps, CPU 45.3 -> 28.7 ms (-37%)**, grain wharf 14.2 -> **16.5 fps, CPU 67.9 -> 57.8 (-15%)**,
  storyteller 27.3 -> **37.3 fps, CPU 34.0 -> 24.6 (-28%)**; the same picture (pixel-identical, frozen, three views).
  (This run caught the machine at its busiest, so the absolute ms are high; the ratio is what holds.) High, 1080p,
  40 m against Infinity (`inpage_far_high.json`): CPU -1.5% crown, -3.2% grain wharf, -0.7% storyteller.

## Final checks (snapshot rebuilt from the tree at 02:59, after the hooks.stand revert)

- `check_deploy` (`world.html?start=0`, window=all): PASS, 8 sections, 34 boats, 250 requests.
- Regression `b2_framerate` (`WORLD_URL=…:5196/world.html?start=0`, `BOATS_URL=…/boats.html?start=0`): world walks
  **211/211**, boats **12/12**, rides **5/5**, people FAIL only on the two stale gate spots (X 7 D 3.9, X -8 D 4.1),
  sizes 0 (`gen/expand/round2/page_qa/b2_framerate/`). Contacts: the details session's report, unchanged by this.
- Look: in one page, frozen, everything new (two layers + empty batches skipped) against everything off: pixel-identical
  at crown, grain_wharf, under_arch, storyteller (`framerate/look_final_inpage/`); against 5195 by eye
  (`framerate/look_final_pair_*.jpg`, `look_final_crop_storyteller.jpg`): the same picture (people's shadows where they
  were; the 3D trees seen are the trees session's).
- Two-page phone-proxy A/B against 5195 (`framerate/ab_final/ab.log`, both reps with 2-3 other check Chromes running;
  the snapshot also carries the other sessions' new modules, whose animation shows in its anim ms):

  | | 5195 rep 1 / rep 2 | snapshot rep 1 / rep 2 |
  |---|---|---|
  | crown | 44 / 39 fps, CPU 21.8 / 24.0, GPU 12.7 / 15.6 | 50 / 19 fps, CPU 18.8 / 49.4 (anim 21.6 that run), GPU 9.7 / 12.4 |
  | grain wharf | 18 / 25 fps, CPU 53.4 / 39.2, GPU 26.2 / 19.8 | 22 / 23 fps, CPU 43.4 / 41.0, GPU 17.0 / 16.6 |
  | storyteller | 37 / 44 fps, CPU 25.3 / 21.6 | 40 / 40 fps, CPU 23.1 / 23.5, GPU 8.6 / 8.6 |

  Too noisy to read beyond "GPU lower everywhere"; the in-page numbers above are the measurements.

## Skipped, and the next step

- Nothing skipped. Not done: the low tier's peopleHz could go up (15 -> 20) now that a movers pass is cheap, for
  smoother people's shadows on phones; and the boats could join the world's layer when moored and still (they bob, so
  they are movers: 13 draws a movers pass at the grain wharf).
- Seen in passing (not from these items as far as could be told): in 2 of 7 frozen-clock look runs after trees3d
  landed, "GL_INVALID_VALUE: glGetProgramiv: Program object expected" warnings (36-72); not reproduced with a
  getProgramParameter trace (`framerate/badprog.mjs`, `look_bad.mjs`), never in the probe or check runs.
