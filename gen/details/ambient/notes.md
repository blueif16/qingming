# Ambient life: notes (agent "ambient", 2026-10-13)

Plan: `plan.md`. Code:
- `web/src/ambient.js` (the module);
- `web/src/ambient_sites.js` (sites from the map, pure, node-importable);
- the shared wind `web/src/wind.js`, which belongs to the trees agent: WIND.uniforms qmWindTime, qmWindDir,
  qmWindStrength; WIND_GLSL qmGust(xz), qmWindAt(xz); WIND.sync(now, frame).

Tools in `tools/`:
- `sites.mjs` writes every section's sites to `sites/<folder>.json`;
- `amb.mjs` has the modes check, cloth, film, sparrows2, stills and bench (in-page A/B: dispose and make again);
- `crop.mjs` makes enlarged crops of raw frames.

## Log

- **Wind.** I wrote a wind.js; the trees agent wrote its own at the same minute and kept it. I adopted theirs
  unchanged, and new terms go through the lead.
- **Sites, from `layout.json` / `people.json` only.** Per section: flocks, swallows, egrets, sparrows, bats,
  butterflies, catkins, seeds, leaves, smoke, steam and banners, as listed by `sites/<folder>.json`.
  - No stove is painted outright; the only painted cooking thing is S2's eatery rack (steam). Smoke rises over the
    painted eating places (`EATING` in ambient_sites.js), from the back half of the roof.
  - The ridge height is estimated as eave + 0.36 × the narrower side when only the eaves are measured.
- **Pilot on S4, injected through the dev server before the hook** (`amb.mjs`'s `import('/src/ambient.js')`, which
  shares the page's three.js, detail.js and wind.js).
  - The swallow reads well up close (crop `films/crops_swallow.jpg`).
  - The crows read as specks at 20 m up (`films/crops_crows.jpg`).
  - The sparrows first looked like fish. I rebuilt the body with plump hexagonal rings (47 triangles a bird), and the
    folded wings now lie along the flank.
- **Cloth.**
  - The shipped GLBs quantize positions (the node matrix carries the scale), so the pieces and weights are computed in
    world metres. The shader turns the world displacement back with `inverse(mat3(modelMatrix))`.
  - Box faces of wrapped goods are rejected: two or more flat pieces within 0.45 m, turned across. Other rules: a
    piece must hang at least 0.3 m, unless it is by a painted banner.
  - S4: the striped banner `S4.prop.banner_frame_11895` (4 white stripes; its dark stripes are another material), the
    fortune-teller's table cloth and the two sedan curtains (7 pieces). The whole world: 15 meshes, 75 pieces.
  - The banner swings visibly (`films/p6_smoke.jpg` left edge, `p4_banner.jpg`).
- **Smoke.** The first versions were invisible: pale grey at 0.2 alpha on a pale sky. It is now a blue-grey that
  darkens at the base, alpha 0.9 × the cooking hours' strength, and 8–16 puffs.
- **The hour.** Birds never blink out: each one flies off (spirals out, climbs away) as its species' hours end.
  Sparrows go up to their perch at dusk and come down in the morning. Bats are out 18.3–21.0 and 4.2–5.7.
- **The hook landed (2026-10-13), after the lead cleared it.** Two lines in world.js: the import, and
  `createAmbient({ scene, camera, player, sections, people: () => people, hour: () => s.hour, query })` after
  `player.pushOut`. The diff was sent to 3d-director-04.

## Numbers (pilot, 2026-10-13, the check server, other agents running)

- **In-page A/B** (`amb.mjs bench`: the ambient disposed, then made again, interleaved, 3–4 reps × 3 s at each view;
  `bench/pilot_*.json`).
  - **Phone proxy, low tier** (390 × 844 × 3, CPU 4×), mean of 3:
    - storyteller: off 108.7 fps, CPU 8.15 ms, GPU 4.80 ms, 99 calls, 86.59 MB. On 98.2 fps, 8.97 ms, 5.58 ms,
      100.7 calls, 86.82 MB.
    - crown: off 64.5 fps, 14.31 ms, 9.30 ms, 141 calls, 93.22 MB. On 70.8 fps, 13.17 ms, 8.45 ms, 143 calls,
      93.48 MB.
    - The reps swing ±15% (storyteller off: 111.5, 94.6, 120), so the sign of the difference changes with the view.
      This is noise.
    - The module itself: +2 draws, +1.1k triangles, 367–369 instances, +0.23–0.26 MB GPU (instance buffers), CPU
      0.00–0.02 ms a frame (its own timer).
    - Shadow layers: worldDraws +1 per make (the scene gained a child), moverDraws unchanged in rate.
  - **Amplified to the caps** (birds 200, particles 1500 a section → 4.2k instances, 11× low): storyteller GPU +0.28 ms;
    the module's CPU 0.03–0.06 ms (0.21 once, on a rebuild); the frame CPU and fps within noise again. So at low counts
    the cost is about 0.03 ms GPU and 0.01 ms CPU.
  - **High, 1080p:**
    - storyteller: off 410.9 fps, CPU 2.24, GPU 2.13, 153.5 calls. On 458.4, 2.01, 2.17, 155.5.
    - crown: off 273.9, 3.47, 3.38, 220 calls. On 271.1, 3.53, 3.57, 222.
    - +2 draws, +14k triangles (all passes), +0.23–0.26 MB.
- **Page loads, `?ambient=0` against on** (`bench/ab_phone.sh`, `tools/bench_page.mjs`): see `bench/ab_phone/ab.log`.
  The crown varies 20–55 fps between loads of the same page (the crowd's state), so the in-page A/B is the measure.
- **Page-load A/B, phone proxy** (`bench/ab_phone/`, `?ambient=0` against on, 2 reps each, fps):
  - storyteller: off 96.6 and 37.9; on 139.6 and 43.6;
  - crown: off 19.8 and 20.3; on 54.7 and 16.2;
  - GPU MB 75–100 on either side, depending on what had streamed.
  - Rep 2 ran beside a stills run. Page loads differ more than the ambient costs.
- **Regression with the hook in and the ambient on** (`gen/expand/round2/page_qa/amb_on/`, `?start=0`):
  - world 211/211, boats 12/12, rides 5/5;
  - people FAIL on only the two stale gate spots (X 7 D 3.9, X −8 D 4.1), the same as the baseline
    `b2_loading_final`.
- **Low tier on a phone viewport**, the default window at the storyteller (inner_city, gate, city_end loaded):
  - 9 birds (three crows a section), 360 particles, 2 draws, 1,143 triangles;
  - no sparrows and no smoke;
  - the cloth sways within 45 m (5 meshes, 27 pieces).
- **In-page A/B, mid tier, phone proxy** (`bench/pilot_phone_mid.json`, 3 reps):
  - storyteller: off 61.7 fps, CPU 14.75 ms, GPU 6.45 ms, 105 calls, 93.06 MB. On 60.8 fps, 15.59 ms, 7.01 ms,
    107.7 calls, 93.29 MB.
  - crown: off 38.0 fps, 28.36 ms, 12.16 ms, 132 calls, 97.72 MB. On 45.5 fps, 21.73 ms, 9.85 ms, 135 calls, 97.97 MB.
  - The module: 2 draws, 4.6–5.0k triangles, 1.25–1.32k instances (18 sparrows, smoke on), CPU 0.044–0.053 ms a frame.
  - A film run shared the GPU, so the differences are noise.
- **Shadow layers and GL warnings** (3d-director-04's checks). The ambient is now one static child of the scene
  (`ambient`, a Group added once and kept; birds and particles inside it; nothing casts). A cloth copy whose section
  leaves while its program is compiling is disposed only after the compile.
  - Streaming the whole world, high tier, 18 gotos from S7 to S1 and back, 3 s each (`amb.mjs stream`;
    `bench/stream_on.json`, `bench/stream_off.json`):
    - with the ambient: worldDraws 263, moverDraws 13,701, GL warnings 0;
    - with `?ambient=0`: worldDraws 288, moverDraws 13,796, GL warnings 0.
  - The ambient adds no world-layer redraws and no `GL_INVALID_VALUE`; there were 27 rebuilds along the way, one per
    section joining or leaving.
- **Opt-in (the lead, 2026-10-13 03:40):** ambient ships off. Only `?ambient=1` makes it. Without the flag
  createAmbient adds nothing, chains nothing and touches no material; it registers a zero-stats stub
  (`__test.details().ambient.off = true`). The check confirmed: no `ambient` object in the scene and no console
  errors. world.js keeps the reviewed two-line hook. All the numbers above were taken while it was on by default,
  which is the same as `?ambient=1` now. `amb.mjs` makes an `ambient=1` instance when the page's own is off.

## After the usage-limit stop (06:00 onward)

- **State checked:** world.js keeps the two-line hook; ambient.js, ambient_sites.js and wind.js are intact; the film
  subagent's films a–f are in `final/`.
- **Films finished:** `final/index.txt` lists them. New this session:
  - dusk birds and bats (`g_s4_dusk_bats2`); bats now take 30% of the birds budget, since the day's flyers have gone;
  - butterflies (`h_s1_butterflies3`), drawn 1.6× life: at real size they are lost beyond 3 m;
  - crows at S1's nests;
  - the S6 banner, with a bug fixed: the flutter followed each face's own normal, so a two-layer banner's lettered
    face sank behind its plain back. The flutter now takes the normal turned to one side, so the layers move as one.
  - eight stills.
- **GL warnings.** One stills run (`?ambient=1`, flocks forced, eight spots across the world) logged a few
  `GL_INVALID_VALUE: glGetProgramiv: Program object expected`. Two reruns of the same spots, both with the ambient
  on, logged none. I can't pin it to the ambient, and the earlier streaming A/B had 0 on both sides. Reported to
  3d-director-04.
- **Final numbers, phone proxy, low tier** (390 × 844 × 3, CPU 4×, `?ambient=1`; the page was heavier than in the
  morning: other agents' work had landed):
  - In-page dispose-and-remake A/B (`bench/final_phone_low.json`, 4 reps × 4 s):
    - storyteller: off 44.5 fps, CPU 21.40 ms, GPU 8.35 ms, 106 calls, 77.44 MB. On 40.8 fps, 23.10 ms, 9.36 ms,
      104.5 calls, 77.67 MB.
    - crown: off 19.2 fps, 49.81 ms, 23.50 ms, 168.5 calls, 92.75 MB. On 22.1 fps, 46.13 ms, 21.24 ms, 139.5 calls,
      93.00 MB.
    - The page drifted down over the run, so these means are noise.
  - **Fast interleave, the decisive one** (`bench/final_phone_low_toggle.json`): the root shown and hidden in turns,
    10 pairs × 2 s at the same view. Its callback runs in both states and costs 0.02–0.1 ms by its own timer. Paired
    median on − off:
    - storyteller: −1.25 fps of 45.8 (−2.7%), CPU +0.42 ms, GPU −0.10 ms, +2 calls;
    - crown: −0.25 fps of 38.8 (−0.6%), CPU +0.44 ms, GPU +0.88 ms, +2 calls.
    - So drawing the two meshes costs about 0.4 ms of CPU at 4× throttle (about 0.1 ms unthrottled, three's per-draw
      work for two materials), plus 0.02–0.1 ms for the module itself. GPU MB +0.23–0.25 (instance buffers).
  - Low thus spends +2 draws, about 0.5 ms CPU at 4× and 0.6–2.7% fps: at the edge of the noise.
  - **Lever:** low `birds: 0` drops the bird draw (one draw left: catkins and seeds). The lead's call.
- **Page-load A/B, phone proxy, low** (`bench/ab_phone_final/`, `tools/bench_page.mjs`, no flag against
  `?ambient=1`, interleaved, 2 reps):
  - crown: off 20.2 and 29.6 fps (CPU 47.6 and 32.1 ms, 127 and 168 calls, 76.3 and 92.6 MB). On 25.9 and 26.6 fps
    (36.6 and 35.4 ms, 129 and 129 calls, 92.85 MB).
  - storyteller: off 47.1 and 43.7 fps (19.6 and 20.7 ms, 100 and 99 calls, 55.0 and 70.5 MB). On 49.9 and 55.1 fps
    (18.3 and 16.4 ms, 101 and 101 calls, 70.7 MB).
  - Loads of the same page differ more than the ambient costs. The toggle bench above is the measure.
- **Applied after the deploy hold** (06:45; held in scratch until "released"):
  1. **Per-tree caps** for catkins, seeds and leaves: at most about 5 a metre of tree height at high (a 10 m willow,
     50 tufts), scaled with the particle budget. S3 has one willow tall enough, and it had been given 540 catkins:
     a snowstorm (`final/b_s3_river_swallows_crop.jpg`). Now 32 (`final/d_s3_catkins_capped_crop.jpg`). Particles
     at high in the S3 window went from about 2.7k to 739.
  2. **Cloth pieces are now judged with the whole section's cloth in view** (two passes). A striped banner whose gaps
     hold no cloth is left still. S4's banner has white stripes between dark 'bark' stripes, which can't sway (they
     are not cloth, and the cells cut takes them), so it no longer parts. S3's white-and-indigo flag (both cloth)
     still sways, and so do S6's 孫羊店 banner and the 正店's red streamers. To make S4's banner sway, its builder
     (`kit_outer_road.striped_banner`, `dark=BRUSH` = 'bark') would make the dark stripes a cloth material; it then
     sways with no ambient change.
  3. **A rounder head** on the small birds (head ring 0.74 of the width, raised).
