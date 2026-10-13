# Performance for every device: where the frame and the memory go, and what to do next

2026-10-12, the perf research round (`gen/perf/`). Brief: profile the worst spots, measure what each idea really gains,
look at what Messenger does that we don't, and propose; no shared-file edits. Mid-round the user moved the goal:
**not this machine, but many more people on whatever they have** (iPhone Safari, about 1–1.5 GB a tab; mid-range
Android; laptops with integrated graphics; older desktops), keeping the look. The RTX 4070 SUPER is only the measuring
instrument, scaled down.

## In short

- **On a phone the CPU is the wall, and it is draw submission:** 390–500 draws in three geometry passes at the worst
  spots (the Rainbow Bridge, the grain wharf): 29–32 fps at 4× CPU slowdown, on a phone viewport too. People, boats
  and the world each cost about a third; the normal pass and the shadow pass a fifth to a quarter each.
- **On a phone GPU it is vertices and bandwidth:** 2.2–3.4 M triangles a frame (70% people, drawn three times),
  a 4× MSAA half-float target, and 103 MB of multisampled buffers at 1080p.
- **Memory:** 179 MB of GPU on a phone viewport at the binding window, a third of it render targets and a third the
  crowd's Float32 bone bakes; both have cheap, look-neutral cuts (to ~95 MB).
- **Loading:** a first visit on slow 4G walks after 76 s and has its window after 139 s; a second visit still pays
  ~100 revalidations. Section loads stall 0.3–1.75 s on the phone proxy, from work that can be precomputed.
- **The best single change is Messenger's own: write the ink pass's normals from the colour pass (MRT) and drop
  MSAA** — prototyped here with the look unchanged, −21…−41% of the frame. The **first batch**: device tiers with
  adaptive resolution, MRT ink, the boats' batches, a shadow-refresh policy, smaller bakes, and loading quick wins.

## How it was measured

- **Tools (all in `gen/perf/`, nothing in `web/` touched).** `probe.mjs` drives `world.html` on the check server
  (5190) inside a Chrome slot; `instrument.js` is injected at runtime and wraps the page's own objects through
  `window.__test`:
  - CPU per part of the frame (walker, people, boats, each render pass, shadows), draw calls and triangles per pass,
    bytes uploaded per frame;
  - every idea as an on/off experiment, read **A/B against the bases measured right beside it** (3 pairs each), with
    the scene's time frozen (all per-frame work still done, dt = 0) so people and boats moving in and out of view
    don't blur the comparison. `noop` (base against base) gives the noise floor: **±5%**.
  - Prototypes behind experiments, no page edit: the MRT ink pass (`exp.mrt`), shadow caching, the boats' batches
    without per-pass culling, cell culling of the world, cheaper crowd skinning, a crowd hide radius.
  - `stream` (section loads, stalls, GL errors traced at every program query), `memory` (GPU bytes via `?gpumem=1`,
    the bakes, the heap), `load` (the live deployment under network throttling), `loadprofile` (a CPU profile of
    one section streaming in), `shots` (the look with an experiment on).
- **Device-like conditions:** CPU 4× slower (DevTools' phone estimate; 6× as a weaker phone); a phone viewport,
  390 × 844 at DPR 3, which the page caps to 1.5 (585 × 1266) with touch on (1024² shadow map); slow 4G as
  Lighthouse defines it (1.6 Mbps down, 150 ms RTT) and fast 4G (9 Mbps, 60 ms) against
  https://qingming-delta.vercel.app (brotli, CDN). WebGL limits checked against WebGL 2's guaranteed minimums.
- **Machine:** other agents' check Chromes ran during parts of the round; every bench waited for a quiet machine
  before each view (`quiet` in each `bench.json`), but they often started again mid-run: bases then drift by up to
  2×, which the interleaved A/B absorbs into wide ranges, not into wrong signs. Absolute ms differ
  from the lead's bench (another Chrome, different tool); the ratios are what this proposal uses.
- **GPU timing caveat.** On this GPU the frame is CPU-fed even at 3840 × 2160 (GPU ms ≈ CPU ms; cutting the pixels
  by 86% there saved only 5–20%), and ANGLE's timer queries can't split a frame into passes (the later segments read
  0). So GPU costs come from A/B totals at 1080p and at 3840 × 2160 (where render-target bandwidth shows), and the
  phone-side GPU reasoning uses the work itself: triangles per pass, skinned vertices, fragments shaded per pixel.
- **Noise.** A/B at 1080p with time frozen: ±5% (`noop`). The 3840 × 2160 runs had stretches where another job ran
  (bases moved by up to 2×); only effects seen at both resolutions and at two or more spots are used.

## Where the time goes

The three worst spots, at desktop speed (1×, 1920 × 1080) and on the phone proxy (4× CPU):

| | crown (S4b+S3+S2, 466 people) | grain wharf (S3+S2+S1, 432) | storyteller (S7+S6+S5, 308) |
|---|---|---|---|
| frame CPU at 1× | 3.9–4.7 ms | 4.2 ms | 2.2 ms |
| at 4× CPU, same viewport | **31.8 ms (30 fps)** | **30.1 ms (32 fps)** | 17.9 ms (53 fps) |
| phone viewport, 4× CPU | **34.3 ms (29 fps)**: colour 13.4, shadow 8.3, normals 7.4, people 1.6, walker 1.2, boats 0.7 | not measured on a quiet machine | not measured on a quiet machine |
| colour pass | 1.45–1.8 ms (37%) | 1.6 ms (38%) | 0.82 ms (38%) |
| shadow pass | 0.86–1.06 ms (22%) | 0.92 ms (22%) | 0.54 ms (25%) |
| normal pass + crowd normals | 0.77–0.96 ms (20%) | 0.81 ms (19%) | 0.34 ms (16%) |
| people (routines + crowd) | 0.30–0.35 ms (8%) | 0.32 ms | 0.17 ms |
| walker, boats, the rest | 0.47 ms | 0.52 ms | 0.29 ms |
| draw calls (shadow / colour / normal / crowd normal) | 203 / 166 / 82 / 43 = **495** | 169 / 165 / 71 / 39 = 445 | 159 / 123 / 58 / 27 = 367 |
| triangles, all passes | **3.37 M** (phone view 2.24 M) | 1.50 M (1.27 M) | 1.95 M (1.30 M) |
| fragments shaded per pixel (depth complexity) | 3.7–4.1 (8.4–9.2) | 2.3–2.6 (5.0) | 2.6–2.7 (5.7–5.9) |

What that says:
- **The CPU is the wall on phones, and it is draw submission.** About 80% of the frame is three.js issuing about 500
  draws in three geometry passes: 4–9 µs a draw at desktop speed, 45–120 µs on the phone proxy (387 draws there:
  189 shadow, 113 colour, 84 normals). About 11% of the main thread is three re-resolving shader programs
  (`getProgram`, profiled per pass): 31% of the normal pass, where
  one override material alternates between plain, instanced and batched meshes, and 13% of the colour pass, most
  likely where the boats' batches share the world's materials by name (a batched and a plain mesh need different
  programs, so every switch between them re-resolves).
- **What costs what** (A/B, frame CPU / GPU at 1×, desktop viewport, time running: read to ±10%):

  | hidden or removed | crown | grain wharf | storyteller |
  |---|---|---|---|
  | the crowd (all people) | −29% / −32% | −32% / −35% | −41% / −41% |
  | the boats | **−33% / −35%** | −23% / −25% | (none) |
  | the world (sections' meshes) | −33% / −31% | −21% / −24% | −34% / −34% |
  | the normal pass (ink off) | −17% / −14% | −21% / −19% | −22% / −17% |
  | the shadow pass | −11…−18% / −14…−21% | −8% / −11% | −25% / −25% |
  | trees, backdrop panels | ≤ 6% | ≤ 7% | ≤ 1% |

- **The boats are the surprise.** Seven to sixteen boats cost a third of the frame at the bridge: each of their 32
  `BatchedMesh`es redoes its per-instance cull and sort and re-uploads its indirect texture in every pass (colour,
  shadow, normals), and they force the program churn above. Turning off their per-instance cull and sort alone:
  ● **−11% CPU, −13% GPU** at the crown (`boats_plain`, +27 draws; −5…−12% in the other runs).
- **People are close, not far.** At the crown the camera sees 195 people: 74 within 15 m, 44 at 15–25 m, 24 at
  25–40, 53 beyond. A 30 m hide radius changes the frame by 2–5% (noise); a 20 m one by 2–5% too. Their cost is the
  near ones' skinned vertices (each person ~4.2k triangles, 12–48 bone-texture reads a vertex, drawn in three
  passes) and one draw per character per pass (76 batches at the crown).
- **Triangles.** 2.2–3.4 M a frame at the worst spots, about 70% of it people. Messenger's whole world is 381k at its
  top detail. On a phone GPU (vertex-bound well before it is pixel-bound at 0.74 Mpx) this is the GPU wall.
- **Only 3–36% of the world's triangles are in the camera's frustum** (3–27% on a portrait phone, 21–36% on a
  landscape desktop), but each section's meshes span the whole section, so almost nothing is culled. Sorted into 8 m
  cells, the colour and normal passes would draw 9–41% of them (crown: 344k → 142k on a desktop, 55k on a phone), and
  the shadow pass 44–96% (`cell_cull_8m`). On the 4070 that bought nothing (its frame isn't vertex-bound); on a phone
  GPU at 2.2 M triangles a frame it is the vertex work that cells remove.
- **Overdraw** is 2.3–4.1 shaded fragments a pixel: the opaque sort is by material first (three's rule), so the big
  section meshes can't go front to back. Tile-based phone GPUs (Apple, Mali, Adreno's LRZ) absorb most of it;
  laptops' integrated GPUs don't.

## Where the memory goes

GPU at the binding window (S4b + S3 + S2, standing on the crown), counted at the GL calls:

| | desktop 1920 × 1080 | phone 585 × 1266 (DPR 3 capped at 1.5) |
|---|---|---|
| **total** | **289 MB** | **179 MB** |
| render targets | **166 MB**: 4× MSAA half-float colour + MSAA depth 103, resolved colour 16, depth 8, normals 8, shadow map 2048² 32 (16 of it an unused colour attachment) | **56 MB** (MSAA 37, shadow 1024² 8) |
| crowd bone bakes (Float32) | **56 MB** (35 bakes) | 56 MB |
| geometry | 26 MB | 26 MB |
| textures (cards, kit, bodies, panels) | ~40 MB as BC7 | ~38 MB (ETC1S kinds halve on phones) |
| JS memory (not GPU; the same at either viewport) | **230–310 MB**: objects 59–77, ArrayBuffers 168–235 | (bakes' CPU copies 37–60 of the ArrayBuffers; geometry, animation, colliders and crowd batches' geometry copies most of the rest; a heap snapshot should name the remainder) |

- **The bakes grow with where you have been,** not with where you are: a character's bake keeps every clip anyone
  played since it was loaded. Walking from the bridge to the wharf with only S2 + S1 loaded (191 people) still held
  51 MB of bakes. And each new clip rebuilds and re-uploads the character's whole bake (up to **8.7 MB in one
  frame**).
- **A smaller window saves less than its budget suggests:** sections share their cast, so `?window=0` at the crown
  (S3 + S2) saved only 14 MB of 289. The budget check's sum of sections (198 of 200 MB) is an upper bound.
- **Peaks while streaming** (phone viewport, walking the window from one end of the scroll to the other): GPU
  201 MB, JS **444 MB** (most likely each load's transient buffers: parsed GLBs, transcoded textures, bake buffers). On an iPhone, where
  the GPU memory and the JS heap share the tab's 1–1.5 GB, that is about 650 MB at the peak: it fits, with less room
  than `budgets.json` assumes (it plans 100–150 MB of JS).

## Loading and streaming

**First visit** (the live site, phone viewport, CPU 4×):

| | can walk (loading screen gone) | first window in |
|---|---|---|
| slow 4G, cold | **76 s**, 13.6 MB, 103 requests | 139 s, 24.3 MB, 173 requests |
| slow 4G, second visit | 8.6 s (99 revalidations, 112 KB) | 22.7 s |
| fast 4G, cold | 25.6 s, 13.6 MB | 55 s, 25.0 MB |

- What the loading screen waits for (13.6 MB): the cast of the first section 6.0 MB (44%), kit and body textures
  2.9, tree cards 2.5, the section 1.1, other data 0.5, code 0.35, panels 0.2.
- The first window's 24.3 MB: the cast 8.4 MB (34 characters with every clip they own; a window plays only **47–54%
  of its cast's animation bytes**), tree cards 7.4 MB (UASTC), kit and body textures 4.4 MB, the three sections' GLBs
  2.3 MB, panels 0.7, code 0.35, audio 0.3. (Vercel already serves brotli; GLBs shrink about 45% on the wire.)
- **Everything revalidates on every visit**: `cache-control: public, max-age=0, must-revalidate` on every file,
  hashed or not, so a second visit pays ~100 round trips before it can walk.
- **What the first section waits for:** the section, its whole cast and every tree card before the loading screen
  goes; cards load one after another (`placeTrees` awaits each new card in a loop).

**Section loads** (stall = the longest frame while it loads):

| | load time | stall | the long task |
|---|---|---|---|
| desktop speed | 0.7–3.6 s | 56–309 ms | |
| CPU 4× | **3.5–10.7 s** | **0.3–1.75 s** | `populate` (people) 0.13–1.6 s as one task: each walker's corridor is thousands of BVH rays; trees 1–7 s (serial card loads + grounding); models 0.8–4.4 s (each clip's grounding and stride sampled at load); urgent bakes up to 322 ms in a frame |

- At 4× CPU the whole window took 13–26 s to switch after a teleport; walking, a section starts 27 m (5 s at a run)
  ahead of its seam and takes 4–11 s, so a runner on a phone meets a closed seam for a few seconds.
- **CPU profile of one load at 4×** (S2 and S1 streaming in while you stand at the wharf, 17 s of samples):
  rendering keeps 75%; the load's own long task is `populate` 1.6 s, nearly all of it `corridorFor` (each walker's
  corridor: BVH rays every 0.5 m along the path, up to 16 steps a side, at knee and chest height plus ground probes).
  In steady state, walkers' ground probes (3 rays, 10 times a second each, through every loaded section's BVH and
  every boat) are 7.5% of the frame at 4×.
- **The 30 `GL_INVALID_VALUE: glGetProgramiv` warnings did not come back** in fresh Chromes along the bench's own
  route, with and without 4× throttling (every program query traced and checked: 0 errors). They most likely came
  from the long-lived bench Chrome (stale tabs share its GPU process; the skill warns about them). The probe's
  `stream` mode traces them if they return.

## WebGL limits

The page stays far inside WebGL 2's guaranteed minimums (the most any program uses: 61 uniform vectors of 224,
4 samplers of 16, 10 attribute slots of 16; bake textures ≤ 216 × 2048). The risks on phones are features, not
limits:
- **Rendering to a 4× MSAA half-float target** needs `EXT_color_buffer_float`/`_half_float`; a phone without it gets
  an incomplete framebuffer (a black page). An 8-bit (sRGB) target removes the dependency.
- **`EXT_disjoint_timer_query`** is absent on iOS and most Android: any adaptive quality must use frame times.
- **`KHR_parallel_shader_compile`** isn't everywhere: there `compileAsync` compiles synchronously, so a section's
  shaders still stall once.
- **`WEBGL_multi_draw`**: without it three draws a `BatchedMesh` instance by instance.

## Ranked techniques

Reach: **all** = every device gains; **phones** = mostly weak CPUs/GPUs. Gains measured here are marked ●, estimates ○
(with their reasoning in the notes below the table).

| # | Technique | Reach | Gain | Work | Look risk | Files |
|---|---|---|---|---|---|---|
| 1 | **Device tiers + adaptive resolution** (picked at start, frame-time controller, manual override; "Device tiers" below) | all | ○ holds 30–60 fps on GPU-bound devices by trading pixels; turns the passes below on or off per tier | S–M | none on high; softer image on low | new `src/tiers.js`; `world.js`, `settings.js`, `post.js` |
| 2 | **MRT ink**: normals written by the colour pass into a second target (Messenger's gInfo); the normal pass and the crowd's normal draws go | all | ● 1080p, crown: −18% CPU / −16% GPU keeping 4× MSAA, −22% / −21% with MSAA off; −125 draws. 3840 × 2160, three spots: with MSAA off **−32…−41%**; keeping 4× MSAA +5…+19% (two multisampled targets), so it goes with dropping MSAA. Phone viewport, 4× CPU: **−29%** | M | ● none: screenshots equal within the noise (mean 0.30/255 vs 0.08) | `post.js`, `crowd.js`, `world.js`, `surface.js`, `water.js`, `backdrop.js`, `daylight.js` |
| 3 | **Boats' batches without per-pass culling and sorting**, with their own copies of the kit materials (no program churn against the world's meshes), one batch per material across sections | all | ● −11% CPU / −13% GPU at the crown (1080p), −19% on the phone proxy; −5…−9% at the river spots at 3840 × 2160 | S | none | `boats.js` |
| 4 | **Shadows: the world cached, people redrawn** (a cached world map, redrawn when its snapped centre or the sun moves; people into a small per-frame layer); the box pushed ahead of the camera and shrunk to ±32 m | all | ● the whole shadow pass is 20–25% of the CPU (24% on the phone proxy), 160–200 draws; caching it all −20…−25% (phone proxy −25%); people alone ~30% of it ⇒ ○ two layers −14…−18%; first step (redraw every 2nd–3rd frame) ○ −7…−15% | S (policy) → M (two layers) | none (people's shadows move as now); low tier: no people shadows past 15 m | `post.js`, `world.js`, a shadow chunk patch (`surface.js`), `crowd.js` |
| 5 | **Crowd: fewer draws and vertices**: index-only LOD past ~20 m (meshopt: 4.2k → 1.05k triangles at 2.4–3.6 cm error, same vertices so the bake still drives it); far people out of the shadow pass; one draw per pass for all characters (body textures in an array) | all; vertices matter most on phones | crowd = ● 23–41% of the frame (1080p and 3840 × 2160); ● drawing a quarter of the crowd's triangles −7…−15% GPU on the 4070 (not vertex-bound; ○ much more on a phone), one bake row instead of four −5…−28%; LOD ○ −35% of crowd vertices (60% of the people in view are past 15 m); one draw ○ −145 draws ≈ −20% CPU | M (LOD, shadow cut) → L (one draw) | low (LOD past 20 m is < 2 px) | `crowd.js`, `people.js`, `tools/character.mjs` |
| 6 | **Memory**: FXAA in the ink pass instead of 4× MSAA on low/mid; 8-bit sRGB colour target; bakes as half float with 2 texels a bone, pruned to the window's clips on unload; a depth-only shadow target | phones first | ○ phone GPU 179 → ~95 MB (targets 56 → 17, bakes 56 → ~19); desktop 289 → ~150 MB; JS 230–310 MB → ~200 MB (the bakes' CPU copies dropped: a lost context rebakes from the clips). ● At 3840 × 2160 (bandwidth shows): 8-bit colour target −16…−26% GPU, MSAA off −5…−27%; at 1080p MSAA off −5% | M | MSAA → FXAA softens edges a little (high tier keeps MSAA) | `post.js`, `crowd.js`, `world.js` |
| 7 | **Streaming and routines without stalls**: walkers' corridors and ground heights along their paths, and the clips' grounding and stride, precomputed offline; a section's cards loaded in parallel; BVHs built in a worker; every clip a section's routines list baked while it loads (no urgent bakes), new rows uploaded alone; Messenger's warm-up (`initTexture` + one hidden render) | phones first | ● the longest stall at 4× CPU is `populate`'s corridors (1.6 s); walkers' ground rays are 7.5% of the frame at 4×; ○ stall 0.3–1.75 s → ~0.1–0.3 s, section load 4–11 s → ~2–4 s | M | none | `people.js`, `world.js`, `crowd.js`, `tools/export_web_scene.mjs`, `tools/character.mjs` |
| 8 | **First load**: walk as soon as your section, its kit and your character are in; people then trees stream in nearest first; clips fetched per clip as routines ask; 256 px cards first; immutable caching for hashed files, content-hashed GLB/JSON names | slow links, everyone's first visit | ● the loading screen waits for 13.6 MB, 44% of it the cast; ○ slow 4G: walk 76 s → ~25 s, fast 4G 25.6 → ~10 s; second visit 8.6 → ~2–3 s | M | cards sharpen and people appear in the first seconds | `world.js`, `people.js`, `assets.js`, `tools/character.mjs`, `tools/tree_cards.mjs`/`ktx2.mjs`, `web/vercel.json` |
| 9 | **The world in cells (Messenger's world)**: one `BatchedMesh` per surface kind with the kit in a texture array, 8–12 m cells culled and sorted front to back, builder-made far levels (no brackets, rafter ends, trims past 25 m) | all; GPU on phones | ● 8 m cells drop 59–91% of the world's triangles from the colour and normal passes (no gain on the 4070, which isn't vertex-bound); ○ draws 495 → ~100, CPU −30% beyond items 2–5; overdraw 3.7 → ~1.5 | L | medium (the surface shaders move to texture arrays) | `tools/export_web_scene.mjs`, the builders and kits, `world.js`, `surface.js` |
| 10 | **WebGPU** | Safari 26, Chrome; WebGL 2 fallback still needed | ○ lower per-draw CPU, compute skinning; most of it reachable in WebGL 2 through 2, 5 and 9 | XL (every shader patch rewritten in TSL) | medium | everything |

Notes on the estimates (○):
- **1.** On a GPU-bound device the fragment work scales with pixels: the cap from 1.5 to 1.0 is −56% of pixels.
- **4.** `shadow_people_only` (only the crowd casting) kept 25–35% of the shadow pass's CPU at every view, and the
  cached map costs nothing on frames where nothing static moved.
- **5.** At the crown 195 people are in view: 74 within 15 m, 44 at 15–25 m, 77 beyond 25 m. Each is drawn three
  times now (colour, shadow, normals); after item 2, twice.
- **6.** Targets on a phone: colour sRGB 3 + normals 3 + depth 3 + shadow depth 4 MB (+4 for the colour attachment
  three adds) against 37 MB of MSAA buffers now. Bakes: 2 bytes instead of 4 a value, 8 values a bone instead of 12.
- **7.** The long tasks measured at 4×: `populate` 0.13–1.6 s (corridor rays), models 0.8–4.4 s spread over frames
  (clip sampling at load), trees 1–7 s (serial loads, grounding rays), bakes up to 322 ms in one frame.
- **8.** Your section's geometry, its kit textures, its panels and your character are about 3.5 MB of the 13.6 MB the
  loading screen waits for now; at 1.6 Mbps that is ~20 s with the round trips. The cast's clips: 47–54% of their
  bytes are played by the window that loads them.
- **9.** Measured on the 4070: no gain beyond the noise of those runs, since it isn't vertex-bound; a phone GPU at
  2.2 M triangles a frame is.

Not worth it here: impostors for far people (the LOD already takes them to ~1k triangles and the mist covers past
45 m); occlusion queries (tile-based phones absorb overdraw, and cells sorted front to back get most of it on laptops);
a hide radius on the mid and high tiers (people are near: 2–5%).

## What to borrow from Messenger

From its shipped bundle (study only; the full notes are this round's subagent report, summarised here):

| Messenger does | We do | Borrow? |
|---|---|---|
| One scene pass into two targets: colour, and `gInfo` (depth, normal, outline flag); the outline pass reads it | A second geometry pass for normals, plus a second crowd draw for their normals | **Yes**: prototyped here (MRT), same look |
| No MSAA anywhere; SMAA as the last pass, merged with the sRGB encode | 4× MSAA on a half-float target (103 MB at 1080p) | **Yes** on mid and low tiers: FXAA or SMAA in the ink pass |
| Adaptive resolution: every 4 s from the average fps (under 30: −0.1, 60 or more: +0.1, floor 0.6), stops after 4 reversals, paused while loading; below 0.9 the shadow map halves | A fixed pixel-ratio cap of 1.5 | **Yes**, the core of the tiers |
| One device flag (iPhone): lower-detail world files, one fewer LOD, 1024 shadow map, mono music | Touch screens get a 1024 shadow map | **Yes**, as tiers (below) |
| The world as 4 `BatchedMesh`es of ~590 spatial cells, one CPU loop a frame (sphere vs frustum, distance LOD at 6/12/20 m), its flags reused by the shadow pass | One mesh per material per section (~35 a section), culled whole | **Later** (the big draw-call cut, rank 9) |
| NPCs hidden past 15–30 m; their animation updated less often with distance (0 → 0.3 s from 7.5 to 75 m) | Everyone painted is drawn at any distance; baked animation (cheaper than Messenger's mixers) | **No**: our people are near (a 20–30 m radius gained 2–5%) and loyalty wants every painted figure; the LOD and the shadow cut do more |
| Shadow map 2400² over ±24 m (2 cm texels), its box pushed 6 m ahead of the camera, redrawn every frame | 2048² over ±48 m (4.7 cm texels), centred on you, redrawn every frame | The box ahead of the camera, yes; we also cache (we have 10× its casters) |
| BVH built in a worker; physics at a fixed 60 Hz, 3 substeps | BVH built on the main thread (9–25 ms a section, ×4 on a phone) | **Yes** |
| Warm-up: compile every material into the real target, `initTexture` every texture, one offscreen render, before showing | `compileAsync` per section | Add `initTexture` and a hidden first render per section |
| GPU uploads time-sliced (512 elements a frame) | Whole bake textures re-uploaded when a clip is added (8.7 MB in one frame) | **Yes** |
| A 5-tap cross outline, width × min(1, height/1300) | A 3×3 Sobel and Laplacian (17 fetches a pixel) | The width scaling, yes (thin lines on small screens) |
| No streaming (one small planet, loaded whole) | A streaming window | Ours is our own |

## Device tiers

**What each tier gets** (every tier keeps every mapped building, tree, boat and painted figure; tiers change how they are drawn):

| | Low: older phones, mid Android, 2–4 GB | Mid: recent phones, laptops with integrated graphics | High: desktop or discrete GPU |
|---|---|---|---|
| Render scale | DPR cap 1.0, adaptive 0.6–1.0 | cap 1.5, adaptive 0.7–1.0 | cap 2, adaptive 0.8–1.0 |
| Anti-aliasing | FXAA in the ink pass | FXAA or SMAA | 4× MSAA (or SMAA) |
| Ink | MRT normals, depth + normal edges, fade by 40 m | MRT, fade by 70 m | MRT |
| Shadows | Cached world layer, refreshed on a 2 m move or a sun step; people cast none past 15 m; 1024² | Cached world + people layer at 20 Hz; 1024–2048² | Per frame or cached; 2048² |
| Crowd (everyone painted, on every tier) | 1k-triangle LOD past 12 m, no shadows past 15 m | LOD past 20 m, no shadows past 30 m | LOD past 30 m |
| Window | Yours + the one you walk toward (2) | 3 | 3 |
| Textures | Half-size tree cards and panels | Full | Full |
| Bakes | Half float, 2 texels a bone (all tiers) | | |

**How the page picks it:**
1. **A guess before loading**, from what the browser says: touch and screen size, `navigator.deviceMemory` where present (Chrome, Android: ≤ 4 GB → low), `hardwareConcurrency`, the GPU name from `WEBGL_debug_renderer_info` (Mali-G5x/G6x, Adreno 5xx/6xx below 640, PowerVR, "Intel(R) UHD/HD" → low or mid; "Apple GPU" on iPhone → mid), and iPhone (Safari tabs die at 1–1.5 GB) → never high.
2. **A check while the first section loads**: the median frame time of the first 3 s of real frames, CPU part (the tick) against the frame interval. CPU-bound (tick ≈ interval) steps down crowd, shadow refresh and the window; GPU-bound steps down the render scale first.
3. **Adaptive resolution while playing** (Messenger's controller): every 4 s, under 30 fps → −0.1 scale, at 55+ → +0.1, within the tier's range, paused while a section streams in; it stops after 4 reversals. At the floor for 8 s the page offers the next tier down.
4. **Manual override**: `?tier=low|mid|high` and a "Quality" choice in the settings panel (in the Space scroll HUD), remembered per device (localStorage, read in a try/catch).
5. The tier is remembered with the device's GPU name, so a second visit starts at the right one.

## Recommended first batch

Six pieces, each small or medium, independent, and good on every device; together they roughly halve the phone
proxy's frame at the worst spots and its memory, and get a first visitor walking in a third of the time.

1. **Tiers and adaptive resolution** (rank 1), with the manual override, so every later item can be switched per tier
   from day one.
2. **MRT ink** (rank 2), with FXAA in the ink pass for the low and mid tiers and an 8-bit sRGB colour target (the
   memory half of rank 6). Prototyped and measured here; the same look.
3. **The boats' batches** (rank 3): two flags and one batch per material across sections.
4. **The shadow policy** (rank 4, first step): redraw when the snapped centre or the sun moves, people at 20 Hz on
   mid, the box ahead of the camera. The two-layer version follows once the policy is in.
5. **Bakes**: half float, 2 texels a bone, pruned on unload, new clips appended alone, every routine's clip baked while
   its section loads (ranks 6 and 7).
6. **Loading quick wins** (ranks 7 and 8): cards in parallel, corridors and clip metadata precomputed, immutable
   cache headers, and walking before the cast and the cards are in.

Expected on the phone proxy at the crown (○, from the measured parts of its 34.3 ms at 4× CPU): the normal pass and
the crowd's normals go (−7.4 ms), the boats' share drops (−11…−19%), the shadow pass falls to its people layer
(8.3 → ~2.5 ms): **about 34 → 17–19 ms, 29 → 50+ fps**; GPU memory 179 → ~95 MB; a first visit on slow 4G walking
after ~25 s instead of 76 s.

Then, in this order: the crowd's LOD and one-draw batching (rank 5), per-clip animation files and low-resolution cards
first (rank 8), and the world in cells (rank 9), which is the big structural one.

## Files of this round

- `gen/perf/probe.mjs`, `gen/perf/instrument.js`: the probe and its in-page experiments (MRT, shadow cache, cell
  culling, boats' batches, crowd variants), runnable in a Chrome slot: `tools/chrome_slot.sh node gen/perf/probe.mjs
  bench|stream|memory|load|loadprofile|shots <url> <out_dir> [options]` (options at the top of `probe.mjs`).
- `gen/perf/run_rest.sh`, `run_phone_again.sh`: the runs behind the numbers here; `summarize.py <run_dir>` prints a
  run; `imgdiff.mjs` and `cropsheet.mjs` compare screenshots. `node_modules` is a link to `tools/node_modules`.
- Results: `desk_1x/`, `desk_mrt/`, `desk_frozen/`, `phone_4x/`, `gpu_4k/`, `memory_*`, `stream*/`, `load_*`,
  `loadprof_4x/`, `shots_mrt/` (the MRT look check, `crown_sheet.jpg`).
- `gen/perf/lod_trial.mjs`: the crowd LOD trial (meshoptimizer, index-only).

