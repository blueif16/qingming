# Perf batch 1: what landed, numbers, next step

The first batch of `gen/perf/proposal.md` ("Recommended first batch"), done by the engine agent, 2026-10-12/13. The
goal is reach (phones and whatever people have); the RTX 4070 SUPER is only the measuring instrument (CPU throttled,
phone viewport). Not deployed here: the lead deploys.

## How it is checked

- **Snapshots, not the live tree.** Other agents edit `web/` all the time (the UI agent's files broke the build once
  mid-edit), so each step is built (`vite build`) into the scratchpad and served by a tiny static server
  (`scratchpad/serve.py <dir> <port> [web/vercel.json]`, which applies vercel.json's cache headers as the CDN would).
  Before = `src_before/` (a copy of `web/src` at the start) built and served on 5195.
- **Regression:** `gen/expand/round2/page_qa/regress.sh` with `WORLD_URL`/`BOATS_URL` (now an env too) carrying
  `?tier=`; tags `b1_<step>_<tier>`. Pass = world walks 211 (one known flake: S4b "back ashore from the arched-awning
  boat", S2's north-bank yard walks, both failing one baseline run in three), boats 12/12, rides 5/5, people with only
  the two stale gate spots (X 7 D 3.9, X -8 D 4.1), sizes 0.
- **Look:** `gen/perf/batch1/look_tiers.sh <out> [views] [base]` -> `look.mjs`: one page load per run, time frozen
  (people, boats, your own character's idle, water and sky clocks), DOM overlays hidden; per view the old pipeline
  (separate normal pass, 4x MSAA half float: `post.configure({ mrt: false })`) as base, then high, mid, low as the batch
  draws them, then the base again (the noise floor). `diff.json` (mean |diff| per channel, share of pixels changed by
  more than 30 a channel), `sheet_<view>.jpg`, `crop_<view>.jpg` (the middle at 1:1).
- **Numbers:** `tools/bench_page.mjs` (now `--viewport 390x844x3` and per-entry `wait`) with
  `bench_high.json` / `bench_phone.json` (each view warmed unthrottled, then measured); `ab_bench.sh` runs before and
  after interleaved, A B A B, each waiting for a quiet machine. Memory: `gen/perf/probe.mjs memory ?gpumem=1`. First
  load: `probe.mjs load` (fast 4G, CPU 4x, phone viewport) on the local static server (no brotli, so bytes are the
  raw sizes; before and after compare).

## Step 1: device tiers and adaptive resolution (landed)

- `web/src/tiers.js` (new): `TIERS` low / mid / high (render scale cap and floor, MSAA or FXAA, colour target, the
  shadow policy, the window), `guessTier()` from touch, `deviceMemory`, cores, iPhone, the GPU name
  (`WEBGL_debug_renderer_info`: software renderers, older Mali / Adreno / PowerVR -> low; integrated Intel / AMD,
  Safari's masked "Apple GPU", touch -> mid), the first check (median of the first 3 s of real frames, tick against
  interval: slow and CPU-bound -> one tier down, slow and GPU-bound -> scale to the floor; a later visit that runs
  well steps back toward the guess), Messenger's controller (every 4 s; < 30 fps and GPU-bound -0.1, >= 55 +0.1; paused
  while streaming; stops after 4 reversals; at the floor or CPU-bound and still slow for 8 s an automatic tier steps
  down once), remembered per device with its GPU name (`localStorage` `qingming-tier-v1`, try/catch).
- `world.js`: `?tier=low|mid|high` (never stored), `?adapt=0`, `?mrt=0`; settings key `quality` (auto|low|mid|high),
  in the lil-gui panel as "Quality" and reachable from the settings screen through `setSetting('quality', ...)`
  (the UI agent's `ui/settings_screen.js` can add the row: `world('quality', 'step', { values: ['auto', 'low',
  'mid', 'high'] })`); the pixel ratio is min(device, tier cap, the settings' sharpness) x scale; `__test.tiers`
  (`stats()`, `apply(name, why)`), `__test.post`, `__test.shadows()`.
- The window per tier: 'ahead' (yours and the one you walk or look toward) was built for low, but under it two world
  walks failed (S3 "the water's edge stops you (under the arch)" ended in the water, S2 "board the hooded-bow cargo
  boat") and with `&window=1` the same build passed 211/211. The low tier keeps window 1; 'ahead' stays as
  `?window=ahead` for its own round.
- Checks (snapshot s12, steps 1 and 2 together): high 209/211 (S2 yard walks, the known flake), mid 209/211 (S4b
  ashore + S2 yard: known), low 208/211 with 'ahead' -> 211/211 with window 1; boats 12/12, rides 5/5 at every tier;
  people FAIL only on the two stale gate spots, sizes 0.

## Step 2: MRT ink, FXAA, 8-bit colour (landed)

- `post.js`: every built-in mesh material writes its view normal to attachment 1 while it draws its colour (a patch
  of `ShaderChunk.dithering_pars_fragment` / `dithering_fragment`, which every Basic/Lambert/Toon/Phong/Standard
  fragment shader ends with): lit materials their `normal`, unlit ones and `QM_INK_NEUTRAL` (tree cards) the empty
  normal; ShaderMaterials write `qmNormalOut` themselves (both skies, `daylight.js`). The target is cleared to the
  background colour and attachment 1 to the empty normal (`clearBufferfv`). No normal pass, no crowd normal draws.
  `InkPost(renderer, { mrt, samples, hdr, fxaa })`, `configure()`; other pages keep the old defaults (`mrt: false`).
- High: 4x MSAA on a half-float target (as before, now with two attachments). Low and mid: no MSAA, an 8-bit sRGB
  colour target (`SRGB8_ALPHA8`: linear values stored on the sRGB curve) and FXAA (classic, luma on a gamma-like
  curve, edges only: flat painted strokes are left alone) in the ink pass.
- Look (s12, six views, `s12/look/`): high against the old pipeline 0.24-1.94 mean |diff| a channel, against a noise
  floor (the same shot twice) of 0.00-1.04; the differences are the moving tow ropes (under the arch), your own
  character's idle and, where trees stand, ink no longer drawn through tree cards (the old normal pass left the cards
  out, so creases behind a crown inked through it). Mid 0.97-3.5, low 1.7-5.3: the same picture, softer (FXAA, the
  low tier's 1024 shadow map). Verdict: high identical within noise; low and mid the same picture, softer.

## Step 3: the shadow policy (landed)

- `world.js` `placeSun` / `shadowPolicy`, `crowd.js`: the box is the tier's (high: 96 m round you, redrawn every frame,
  as before; mid: +-36 m pushed 12 m ahead of where you look, centre snapped to 1 m; low: +-32 m, 12 m ahead, snapped
  to 2 m, 1024²); the map is redrawn when its snapped centre or the sun moves, when a section comes or goes or the
  shadows are switched on, and for the people (and boats) at 20 Hz on mid, 15 Hz on low. People past 30 m (mid) or
  15 m (low) cast none: the crowd's instances are ordered near first and the shadow pass draws only the near ones
  (`onBeforeShadow`). The two-layer version (a cached world map plus a per-frame people map) did not come quickly:
  next round.

## Step 4: bakes (landed)

- `crowd.js` `BakeSet`: half floats, two texels a bone (a quaternion; the translation and one scale: every bone
  matrix of the cast is a rotation times a uniform scale to 1e-4, translations under 2.2 m, so half floats keep the
  vertices within about 2 mm), 16 bytes a bone a frame instead of 48. Laid out for every row asked for (baked and
  queued), a finished clip copied into its rows and uploaded alone (`texture.addUpdateRange`, one texSubImage2D per
  row); pruned when its section's people leave (`Crowd.prune`: a set keeps only the clips the people still here may
  play). A clip someone on screen starts is baked at once, alone (it goes to the queue's front), not the whole queue.
- `people.js`: every routine asks for all its clips while its section loads (`CrowdPerson.expect`: a figure's cycle,
  a walker's walk, pause, stops, halts and talk), queued behind the clip each one starts with.

## Step 5: loading quick wins (landed)

- Tree cards of a section load side by side (`placeTrees`).
- `tools/people_precompute.mjs` (new step, in a Chrome slot, after `export_web_scene.mjs` or `character.mjs`):
  `web/public/assets/clip_meta.json` (each clip's drift and grounding correction, stride, speed, hips height: 45
  model files, 467 clips, 59 KB) and `web/public/assets/<section>/corridors.json` (every walker path's corridor,
  measured with the default window in, 1-3 KB a section, keyed by the collider's triangle count so a rebuilt section
  measures again). The page applies them (`?clipmeta=0`, `?corridors=0` for A/B) and measures whatever is missing.
- `web/vercel.json` (new): hashed files (`assets/*-<8>.js|css|wasm`, `assets/tex/*.<hash>.webp|ktx2`) cached a year,
  immutable. A `--prebuilt` deploy reads no vercel.json, so `tools/deploy_web.sh` now carries its routes into
  `.vercel/output/config.json` (headers with `continue: true` before the filesystem).
- You walk once your section's ground, its kit and your character are in: its cast and trees come as the first
  streaming operation after the loading screen (`stream.pending`), before any neighbour; the test hooks still appear
  only once the window and your section's people are in (`settle()` always).

- Checks (snapshot s345, steps 3-5): world walks high 209/211 (the two S2 north-bank yard walks; the before build,
  run the same hour, failed S2 E->W and an S4 walk: timing flakes), mid 211/211, low 211/211; boats 12/12 and rides
  5/5 at each tier; people FAIL only on the two stale gate spots, sizes 0. `people_precompute.mjs all`: 3-15 corridors
  a section, 45 model files, 467 clips.
- A fix found by the look check: the boats' wet rings were left out of the old normal pass (no ink round a hull);
  under MRT they inked, so `world.js` gives the `water_ring` material `QM_INK_NEUTRAL` (transparent, alpha 0: the
  water's normal stays under it).
- The first section's cast first: the deferred load ran beside the first neighbour's (two operations at once broke
  `stream.op`, "Cannot read properties of null (reading 't0')", and city_end failed to load); it is now the first entry
  of `stream.pending`, which `streamUpdate` runs before any load or unload.

## Step 6: the boats' batches (landed; the boat-flow agent done 23:15, the lead's go)

- `boats.js` `batch()`: `perObjectFrustumCulled = false`, `sortObjects = false` on every boat `BatchedMesh` (three
  then returns early from `onBeforeRender` in every pass instead of culling, sorting and re-uploading per batch).
- `world.js`: a `BatchedMesh` keeps its own material (the boats GLB's copy of the kit material, by name; disposed with
  its section through `disposeStd`), so the world's plain meshes and the boats' batches no longer share one material
  that needs two programs.
- `tiers.js` `flowCap` (low 2, mid 3, high 6) sets `boats.flow.cap` for `?boatflow=waves` (`?boatflowcap=` wins).
- Checks (snapshot s6): world 211/211 at high, mid and low, and 211/211 with `?boatflow=waves`; boats 12/12, rides 5/5
  at each tier; people only the stale gate spots, sizes 0; look at under_arch, grain_wharf, moorings_bank unchanged
  (high against the old pipeline 0.14-0.31).
- Not done (not quick and clean: `copy`/`uncopy` of the flow copies, materials and disposal across sections): one batch
  per material across sections. At the crown 32 boat batches carry 14 materials, so it would save about 18 draws a
  pass. Next.

## Numbers (before = the build at the start, 5195; after = snapshot s6 with items 1-5 and the boats' flags, 5199)

All in a Chrome slot on the RTX 4070 SUPER; `final/` (`ab/ab.log`, `memory_*`, `load_*`). Benches interleaved A B A B;
rep 1 ran on a quiet machine (no other check Chrome or Blender, load under 1), rep 2 with a headless Blender running
(both sides). fps, CPU ms / GPU ms a frame (GPU ms is inflated when the frame is CPU-fed), draw calls of the last frame.

| | before rep 1 / rep 2 | after rep 1 / rep 2 |
|---|---|---|
| **high, 1920 × 1080**, crown | 138 / 198 fps, CPU 7.0 / 4.9, GPU 6.7 / 4.7, 495 calls, 3.38 M tris | 201 / 233 fps, CPU 4.7 / 4.1, GPU 4.7 / 3.6, 385 calls, 2.51 M |
| grain wharf | 187 / 166 fps, CPU 5.1 / 5.8, GPU 4.7 / 5.2, 442 calls | 182 / 235 fps, CPU 5.2 / 4.0, GPU 4.9 / 3.2, 362 calls |
| storyteller | 273 / 386 fps, CPU 3.4 / 2.4, GPU 3.3 / 2.4, 371 calls | 397 / 341 fps, CPU 2.3 / 2.7, GPU 2.0 / 2.2, 285 calls |
| **phone proxy** (390 × 844 DPR 3, CPU 4×; before: its cap 1.5 and 4x MSAA, after: the low tier), crown | 25 / 14 fps, CPU 38.6 / 70.9, GPU 28.6 / 47.1, 387 calls, 2.24 M tris | **43 / 31 fps**, CPU 22.1 / 30.6, GPU 12.7 / 15.7, 146-313 calls, 0.77-1.48 M |
| grain wharf | 20 / 13 fps, CPU 48.3 / 78.1 | **46 / 33 fps**, CPU 20.9 / 29.3 |
| storyteller | 41 / 30 fps, CPU 23.3 / 32.3 | **51 / 65 fps**, CPU 18.4 / 14.3 |

(The low tier's calls and triangles change from frame to frame: the shadow map is redrawn 15 times a second.)

Memory (`probe.mjs memory`, `?gpumem=1`, at the binding window S4b + S3 + S2, standing on the crown):

| | before | after |
|---|---|---|
| phone viewport, GPU | 178.7 MB (textures 115.5 with bakes 56.9, buffers 26.5, MSAA renderbuffers 36.7) | **97.8 MB** (textures 71.3 with bakes 19.4, buffers 26.4, renderbuffers 0) |
| phone viewport, at the grain wharf | 188.4 MB | 102.4 MB |
| phone viewport, JS | heap 61 MB, ArrayBuffers 296 MB | heap 52 MB, ArrayBuffers 196 MB |
| desktop 1080p, high, GPU | 289.2 MB (renderbuffers 102.8) | 276.3 MB (bakes -37; renderbuffers 126.6: the normals are multisampled now too) |

First load (`probe.mjs load`, phone viewport, CPU 4x, fast 4G; the local static build without brotli, so the bytes are
raw; after with `web/vercel.json`'s headers):

| | before | after |
|---|---|---|
| cold: can walk | 25.6 s (111 requests, 21.4 MB) | **9.5 s** (64 requests, 8.5 MB) |
| cold: first window in | 42.7 s | 37.2 s |
| second visit: can walk | 8.7 s | **3.6 s** |
| second visit: first window in | 16.2 s | 8.0 s |

The live site (brotli, slow 4G) was 76 s to walk before; its after number comes with the next deploy's measurement
(`probe.mjs load https://qingming-delta.vercel.app/world.html --net slow4g`).

## Next

1. The boats' batches across sections (one batch per material; 32 -> 14 at the crown).
2. The two-layer shadow (a cached world map, a per-frame people map), then the crowd's LOD and one-draw batching
   (proposal rank 5), per-clip animation files and small cards first (rank 8), the world in cells (rank 9).
3. `?window=ahead` for the low tier: find why S3's under-arch shore and S2's hooded-bow boarding fail without the
   section behind (a wall or a boat contact that belongs to the neighbour).
4. The settings screen's Quality row (the UI agent's `ui/settings_screen.js`: `world('quality', 'step', ...)`).
5. Content-hashed GLB/JSON names, so they can be immutable too.
