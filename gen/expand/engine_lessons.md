**Merged into web-scene "The atomic scripts" (World page, KTX2, Budget), "A run" step 6 and "Memory", 2026-10-12**
(records agent; checked by the round-2 records agent; open question 1 is answered: `check_deploy.mjs` loads
`?window=all`).

# Engine round: bounded memory however long the world gets (2026-10-12)

The brief: a phone must hold the world. Seven sections all loaded would be about 45–50 MB of download, about 815 people,
and 0.5–0.7 GB of GPU memory, and an iPhone Safari tab dies at about 1–1.5 GB. Three things were done, in this
order, each checked before the next: a streaming window that also unloads, GPU-compressed textures (KTX2), and a
size budget per section. All the numbers below are from headless Chrome on the real GPU (RTX 4070 SUPER) at
1280×720: memory, stalls and draw calls. They are not fps; real-GPU fps is the lead's (`tools/bench_page.mjs`).

## What changed

### 1. The streaming window (`web/src/world.js`, `assets.js`, `people.js`, `crowd.js`, `player.js`, `backdrop.js`)

- **The world index.** At start the page reads every section's `layout.json` `painted_area` and `scene.json` (the
  layouts are then dropped). All camera spots are known even when their section isn't loaded.
- **The window.** "Your" section is the one you stand in. It changes only once you are 10 m inside another, or at a
  teleport.
  - Loaded: yours and `window` sections either side. The default is 1; `?window=0` is yours only, `?window=all`
    everything.
  - Also loaded: any section whose painted area is within `AHEAD` = 20 m of you. With `window=0` that brings a
    neighbour in as you near its seam.
  - Unloaded: a section outside that set, once it is over `KEEP` = 32 m away and has stayed unwanted for 2 s.
  - One load or unload runs at a time, nearest first.
  - Sections are about 37 m deep across their slanted seams. So with window 1, the next section starts loading at
    least 27 m before you can reach its seam: over 5 s at a run (4.8 m/s). A section takes 0.4–1 s to come in on the
    dev server.
  - Until it is in, a seam is an outer edge: its wall stands, and the mist and the neighbour's painted panel cover it.
- **Unload frees everything only that section used:**
  - its meshes' geometry and its own materials;
  - its collider (each section has its own BVH now, behind `player.bvh` = `MultiBVH`, which the tools use as before)
    and its edge walls;
  - its people and animals: routines, walkers' corridors, riders, crowd batches and their instance buffers;
  - its trees and its panels.
- **Shared things are counted** and go with their last user:
  - textures by URL (`TextureCache` in `assets.js`);
  - materials by name;
  - tree cards by tree;
  - characters and animals by user (a section, your avatar, the load test).
  - `THREE.Cache` is off: it kept every GLB's bytes and every image for the life of the page. A GLTFLoader plugin
    (`sharedTexturePlugin`) gives every section the same kit swatch texture instead.
- **The crowd's bone bakes** (`crowd.js`), the biggest GPU item (about 116 MB of Float32 textures with three
  sections):
  - baked incrementally (only new clips, appended) and time-sliced (4 ms a frame for people not yet drawn; someone on
    screen who starts a new clip still gets it before the next frame);
  - packed in balanced columns (2100 rows are 2 × 1050, not 2048 + 52);
  - every carried prop and animal tack shares its body's bake: each vertex is moved once by its bone's correction
    `K = BM⁻¹·BI⁻¹·BI′·BM`. That is exact: checked against three's own skinning to 1e-7, and the new bake against the
    old one-pass bake to 6e-8.
  - Fixed on the way: setting bones back to rest by hand between slices broke the bake, because three's
    PropertyMixer skips writing a value it already wrote. The slice now stops its action, and the mixer restores the
    bones itself.
- **Smaller stalls:**
  - Tree cards and panels decode off the main thread (createImageBitmap; Safari keeps TextureLoader, as three's
    GLTFLoader does).
  - Trees are grounded through the section BVHs (the brute-force raycasts took 230 ms).
  - A section's materials are compiled with `renderer.compileAsync` before it is drawn.
  - Characters are prepared one per frame.
- **Tests:**
  - `__test.goto(X, D[, H])` streams the window round a spot and resolves when it is in, holding the player still
    while its own section is missing.
  - `__test.view(name)` returns the same promise, so `bench_page` waits for it unchanged.
  - `__test.sections` lists every section of the world: a loaded one is its record, the others `{ name, state }`.
    `check_deploy` keeps passing.
  - `__test.loaded` is the loaded Map.
  - `__test.stream.stats()` gives the loads and unloads with their stalls, and `baking`.
  - `?gpumem=1` (`web/src/gpumem.js`) counts every GPU allocation at the GL calls: `__test.gpuMem()`,
    `gpuTextures()`.
- **The backdrop ring** stands round the whole world's painted area, from the index, whatever is loaded. The world's
  outer panels look exactly as before. Mist and panels follow the loaded sections.
- **Tools** (the lead's shared tools, small additive changes; a page without `goto` behaves as before):
  - `walk_page`, `shots_page` and `film_page` await `__test.goto` before each walk or spot.
  - `people_check` parks the player with `goto` and holds it there while it counts. Before, the player fell from
    the floorless parking spot and was reset into the gate, so the window would have moved under the count. Its
    `--into` figure is looked up across sections.

### 2. KTX2 (`tools/ktx2.mjs`, `web/public/assets/ktx2.json`, `web/public/basis/`)

- **One encoder:** KTX-Software v4.4.2 (`ktx create`, the current Khronos release, checksum-verified), user-local
  at `~/.local/opt/KTX-Software-4.4.2-Linux-x86_64`. Basis Universal v2.50 ships no binaries, and its new formats
  are newer than three 0.186's transcoder.
- **Copies:**
  - a `.ktx2` next to every webp (`tex/`, `trees/`, `<section>/backdrop_*`);
  - copies of the character and animal body textures in `assets/ktx2/emb/`. The workshop's GLBs are untouched; the
    page finds a copy by the image's byte length and FNV-1a hash. Palettes stay webp: their nearest-filtered cells
    must stay exact.
  - The webps are never touched.
- **The manifest** lists each copy:
  - its webp's sha1 (a rerun encodes only new or changed webps, and drops copies whose webp is gone);
  - sizes;
  - flipped (cards and panels are stored bottom-up, as TextureLoader uploads them);
  - the image's mean colour, computed by palette.js's own code in Chrome (a compressed texture can't be read back);
  - `kinds.<kind>.adopt`, set only after the review.
- **Every base level is a multiple of 4.** ANGLE refuses BC textures otherwise: the cards and panels went black on
  the first try. Such images are resampled by at most 2 px; panels keep the webp's aspect.
- **Mipmaps** use a box filter, as the GPU's own generateMipmap does.
- **The page** loads a copy only for adopted kinds (`?ktx2=0` none, `?ktx2=all` all, for the review). The
  transcoder ships in `public/basis/` (527 KB wasm, 245 KB gzipped, fetched only when a copy is used). After
  upload, the transcoded levels are dropped from the JS heap, and `restoreKtx()` transcodes again after a lost GL
  context.
- **Modes, chosen by size against PSNR on samples, then the in-page review:**

  | Kind | Mode | Review |
  |---|---|---|
  | tree | UASTC + zstd | ETC1S's alpha (22–41 dB) changes the shoots' silhouettes; UASTC keeps alpha exact |
  | panel | ETC1S | UASTC was 4.7× the webp's bytes; ETC1S is 35 dB, and identical at their distance in mist |
  | kit | ETC1S | the sign and script atlases are UASTC (lettering) |
  | chars | ETC1S bodies | |

- **The review** (`node tools/ktx2.mjs review`, `gen/expand/ktx2_review/`): 19 spots, at walking distance, at your
  feet, and your avatar at 2–4 m. Each spot is shot in first person with the people hidden and held, as webp and as
  KTX2, with 1:1 crops of the three most different places and their difference ×4.
  - Mean differences are 0.5–6 on a 0–255 scale. The crops show sub-pixel twig edges and a 2 px camera settle, not
    compression.
  - The only visible change at 1:1: the panels' finest twigs are a touch softer.
- **All four kinds adopted.**

### 3. The budget (`tools/budget_check.mjs`, `tools/budgets.json`)

For each section it reports:
- download (own; with the shared kit and cast);
- triangles drawn and collider-only;
- its panels' and cards' GPU MB from image sizes;
- people (reported, not budgeted: the painting sets it);
- draw calls at its worst camera spot, all passes;
- GPU MB measured alone, headless, minus the fixed render targets;
- and the window (three neighbours together).

PASS/FAIL against `budgets.json`, each limit with its reason. `--cdp <port>` takes another headless Chrome when the
bench one is busy.

## Measured

### Memory with all three sections loaded (1280×720)

| | GPU MB (textures / buffers / renderbuffers) | JS heap + ArrayBuffers | download |
|---|---|---|---|
| before (the original page) | **393** (332 / 16 / 46) | 22.5 + 180 MB | **21.3 MB**, 105 requests |
| streaming code, webp (`?window=all&ktx2=0`) | 313 (251 / 16 / 46) | 22.9 + 83 MB | 21.3 MB |
| + KTX2 (`?window=all`) | **193** (131 / 16 / 46) | 27.2 + 101 MB | **29.3 MB**, 139 requests |
| default window (inner city spawn: S6 + S5) | 175 | 25 + 83 MB | 23.7 MB |
| `?window=0` (S6 only) | 151 | 23 + 70 MB | 16.1 MB |

- About 92 MB of every GPU figure is fixed and doesn't grow with the world: the post pass's targets, the 2048²
  shadow map, and the multisampled renderbuffers. On a phone it is about 60 MB (pixel-ratio cap 1.5, 1024² shadow).
- Per section alone, minus that: **122–131 MB with webp → 47–60 MB with KTX2.** Three neighbours, the most a phone
  holds at once: 383 → **156 MB**.
- Seven sections at the default window hold about 92 + 3 × 55 ≈ 260 MB of GPU memory at any length. Before, it was
  about 0.8 GB for all seven loaded.
- **Where the old 393 MB went:**
  - The Float32 bone bakes were about 116 MB. Prop sharing and balanced columns took the three-section page from 389
    to 309 MB before any KTX2.
  - Tree cards 85 MB, characters and animals 45 MB, kit 25 MB, panels 10 MB.
- **On a desktop, ETC1S copies become BC7, 8 bits a pixel** (three's KTX2Loader prefers BC7 when BPTC exists).
  On iPhone they are ETC1/ETC2 (4 bits opaque) and UASTC becomes ASTC 4×4 (8 bits). So the measured desktop figures
  are the upper bound for a phone.

### On disk

| Kind | webp | KTX2 |
|---|---|---|
| kit | 0.59 MB | 1.60 MB |
| tree cards | 4.30 MB | 8.66 MB |
| panels | 1.07 MB | 1.16 MB |
| character bodies | (inside the GLBs) | +2.43 MB |
| transcoder | | 0.58 MB |

The deploy grows by about 14 MB, because the webps stay as source and fallback.

### The round trip (`?window=0`, the runner on the road's centre line at 4.84 m/s, west end → east end → back)

- **Returns to baseline:**
  - geometries 100 → 100;
  - GL programs, cache textures, models, materials, cards, people and crowd batches are equal;
  - JS heap 23.7 → 24.4 MB, ArrayBuffers 73 → 75 MB;
  - textures 87 → 88: a prop palette first uploaded when its prop was first drawn.
  - GPU +6.6 MB: bakes hold the clips the people have played so far, bounded by each loaded model's clips.
- At the default window: geometries 161 → 161, heap 26.0 → 26.2 MB.
- The runner never reached a section that wasn't loaded: it came within 18.5 m at `window=0`, 29.7 m at the default.
- No console errors, no 4xx.

### The longest main-thread stall while a section loads

The longest frame from the start of the load until 0.6 s after it, as long tasks or frame gaps:

| | warm loads | first neighbour in a fresh browser |
|---|---|---|
| before (original page) | long tasks of 1.0–1.25 s while the rest streamed in | |
| streaming, webp | 60–250 ms | about 0.7 s (22 new shader programs, compiled once per browser) |
| **streaming, KTX2** | **51–97 ms** | **110–126 ms** |

Where the old stalls went:
- uploads of card images decoded on the main thread: 1.7 s in the profile;
- full rebakes of the bone textures: up to 1.06 s in one frame;
- shader compiles at first draw;
- brute-force tree grounding: 230 ms.

### Checks

| Check | Default window | `?window=all` |
|---|---|---|
| `sections/world/walks.json` | 42/42 PASS | 42/42 PASS |
| `people_check` | PASS at every spot during the streaming work; seam spot flaky after KTX2 (below) | PASS at the seam spot, twice, identical numbers |
| `check_deploy` on the dev server | PASS (with KTX2: no 404s) | |

- One walk, "S6: south edge stops you (the open square west of the inn)", failed once in a repeat run at
  `window=all`. A walker's body was in the way at that moment, since walks collide with people.
- people_check spots: inner city -52,9.33; -60.8,5.37; -73,4.49; outer road 18.9,17.3; 31.4,10.3; the S5|S4 seam
  16.0,4.7; with `--into tall_hat_man_2285`.
- The gate's own defaults (7,3.9; -8,4.1) were made for the gate alone with load-test traffic. They fail on the
  original page too.
- **After KTX2, at the default window, the seam spot (16.0, 4.7) failed twice** ("nobody went round": a walker came
  and turned back). The outer road had streamed in just before that spot, so its walkers had only left their painted
  places 12 s earlier. At `?window=all` the spot passes, twice with identical numbers. Routing doesn't depend on the
  window; which walker meets you in 12 s depends on how long they have been walking. Run people_check at
  `?window=all`.
- World shots, original against streamed: the same except where the people stand, apart from a view toward an
  unloaded section. There, by design, its painted panel stands in for the 3D section.

### Budgets proposed (`tools/budgets.json`)

All three sections PASS:

| Number | Budget | Now (S6 / S5 / S4) |
|---|---|---|
| download, the section | 9 MB | 4.8 / 7.7 / 7.5 |
| download, with kit and cast | 20 MB | 15.3 / 16.0 / 16.4 |
| triangles drawn | 130k | 119.5k / 107.2k / 109.6k |
| collider-only triangles | 5k | 0.6–1.2k |
| panels and cards on the GPU | 24 MB | 7.8 / 18.3 / 15.0 (as webp: 31 / 69 / 60) |
| draw calls | 330 | 278 / 224 / 215 |
| GPU MB alone | 75 | 59.7 / 46.7 / 49.4 |
| window GPU MB | 200 | 156 |
| people | reported only | |

## Proposed text for the `web-scene` skill

Replace the **World page** row with:

> | World page | `web/world.html?sections=inner_city,gate,outer_road` (`web/src/world.js`; `gate.html` is the same page with `data-sections="gate"`) | Every section of the world is known from the start (its `layout.json` painted area and `scene.json` spots); only a **window** of them is loaded: yours and one either side (`?window=0` yours only, `?window=all` everything), plus any whose painted area is within 20 m of you. A section loads at least 27 m before a runner can reach its seam, and is fully disposed once it is over 32 m away and has stayed unwanted 2 s (geometry, its own materials, collider, walls, people and animals, trees, panels). Shared things (kit textures, characters and animals, tree cards, materials by name) are counted by their users and go with the last one. Until a neighbour is in, its seam is an outer edge: wall, mist, its painted panel. The backdrop ring stands round the whole world's painted area. `&spawn=<view>` picks a start from any section's `scene.json`. Test hooks: `__test.goto(X, D[, H])` loads the window round a spot and resolves when it is in (`view(name)` too); `__test.sections` lists every section, `__test.loaded` the loaded ones; `__test.stream.stats()` the loads and unloads with their stalls; `?gpumem=1` + `__test.gpuMem()` the GPU bytes. The tools (walks, people, shots, film, bench) wait for the window themselves. |

Add these rows after **Tree cards**:

> | KTX2 | `node tools/ktx2.mjs [status\|encode\|check\|review\|adopt]` (KTX-Software v4.4.2 `ktx`, in `~/.local/opt/KTX-Software-4.4.2-Linux-x86_64`) | A GPU-compressed copy of every texture the page loads: a `.ktx2` next to each webp in `tex/`, `trees/` and `<section>/backdrop_*`, and the characters' and animals' body textures in `assets/ktx2/emb/` (the GLBs untouched). Modes: tree cards UASTC (alpha must stay exact), panels, kit swatches and bodies ETC1S, sign and script atlases UASTC. The webps are never changed: they stay the source and the fallback. `assets/ktx2.json` lists each copy with its webp's hash, so **after any new or redrawn card, panel, swatch or character, run `node tools/ktx2.mjs encode`** (only what changed is encoded) and `check` (FAIL while anything is stale). A new kind is adopted only after `review` (`gen/expand/ktx2_review/`: webp and KTX2 side by side in the page on the real GPU, with 1:1 crops) and `adopt <kind> yes "why"`. The page loads a copy for adopted kinds only; `?ktx2=0` shows the webps, for A/B. |
> | Budget | `node tools/budget_check.mjs <section\|all>` (budgets and their reasons in `tools/budgets.json`) | A section's download (own; with the shared kit and its cast), triangles drawn and collider-only, its panels' and cards' GPU MB, draw calls at its worst camera spot, and its GPU MB measured alone in the bench Chrome; for `all`, the most three neighbours hold together. Must PASS before a section joins the world. Run `node tools/ktx2.mjs encode` first: cards shipped as webp alone fail the texture budget. |

Under **A run**, replace step 6 with:

> 6. `shots_page`, `walk_page`, `people_check` alone (`sections/<name>/shots.json`, `walks.json`) and joined (`shots_joined.json`, `walks_joined.json`: across every seam), then `node tools/ktx2.mjs encode` and `check`, then `node tools/budget_check.mjs <name>` (must PASS), then `bench_page` (the lead's). Record the numbers in `sections/<name>/notes.md`. Run people_check on `world.html?window=all`: its counts depend on how long the walkers have been walking, and a section streamed in just before a road spot has walkers only just leaving their painted places.

Add a section after "Performance facts (the expansion, 2026-10-12)":

> ## Memory (the engine round, 2026-10-12; `gen/expand/engine_lessons.md`)
>
> - **Three sections at 1280×720:** GPU 393 MB → 193 MB, JS ArrayBuffers 180 → 101 MB. The default window holds three
>   sections (about 92 MB fixed render targets + about 55 MB a section) however long the world is.
> - **The biggest item was the crowd's Float32 bone bakes,** about 116 MB, not the textures. They bake only the clips
>   played, incrementally, 4 ms a frame, in balanced columns; props and tack share their body's bake (each vertex
>   moved by its bone's bind correction, exact).
> - **KTX2:** tree cards 85 → 21 MB, the kit and the characters 4–8×. On a desktop ETC1S becomes BC7 (8 bits a
>   pixel); a phone gets ETC1 (4) and ASTC (8). The download grows about 40% (cards: UASTC is twice the webp).
> - **A section's load stalls 51–97 ms** (about 120 ms for the first one in a fresh browser). Before: up to 1.25 s
>   (main-thread image decodes, full rebakes, shader compiles, brute-force tree grounding).
> - **Pitfalls:** a block-compressed texture whose base level isn't a multiple of 4 renders black on desktops
>   (ANGLE). THREE.Cache keeps every GLB and image forever. Setting animated bones back by hand while a mixer's
>   action is live breaks the next sample (three's PropertyMixer skips unchanged values). Removing `#stats` from
>   the page stops its render loop: hide overlays, don't remove them.

## Open questions for the lead

1. **`check_deploy` loads only the first window** (its "every section in" now means "known"; `__test.sections` lists
   them all). A section outside the start window with a broken file would deploy unnoticed. Should
   `check_deploy.mjs` (yours) walk `__test.goto` through every section's spawn, or load with `?window=all`?
2. **Download against GPU.** Adopting all four kinds costs about 8 MB more download for the three sections, and about
   14 MB more on the deploy, for about 200 MB less GPU memory. The tree cards are most of it: +4.4 MB for −64 MB.
   If download matters more on the first visit, `node tools/ktx2.mjs adopt tree no` keeps cards as webp: the GPU
   then holds about 64 MB more with three sections.
3. **The bench Chrome is shared.** Same-site tabs share one renderer process, and leaked `world.html` tabs from
   crashed tool runs (seven at one point) slowed and once blocked my runs. I measured in a private headless Windows
   Chrome on port 9225 (stopped now). The tools could close their pages in a `finally`.
4. **Context loss on iOS:** KTX2 copies re-transcode on `webglcontextrestored`. The bone bakes keep their CPU data
   (38.7 MB with three sections), so they survive. Dropping that copy would save about 39 MB of JS memory but needs a
   rebake on restore. Is it worth doing next?
5. **The fixed render targets** are 92 MB at 1280×720 and grow with the screen: a 4× MSAA half-float colour target
   plus depth, a normal target, a 2048² shadow map with its colour target. On phones the 1.5 pixel-ratio cap keeps
   them near 60 MB. MSAA off on touch screens would halve them.
6. **The tools I patched are yours** (`walk_page`, `people_check`, `shots_page`, `film_page`; the originals are in my
   scratchpad, `engine/`). Each change is one awaited `__test.goto`, and a page without it behaves as before.
