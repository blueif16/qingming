# Perf batch 2: what landed, numbers, next step

Lead: 3d-director-04, 2026-10-13. The user's frame for this batch: reach (phones first); "do the easy optimizations
that remain… we don't need solid rigid checks… tune settings and do it right now and be quick"; the middle version of
the world in cells approved ("if the middle version actually gives us such a boost in performance, then yes"). The
agents' brief: `brief.md`. Baseline: `before_build/` served on 5195 (`serve.py`), the tree at the start of the batch
with the lead's defaults below. A/B benches: `ab_bench.sh` (both sides the same query; Blender not counted, the user
keeps a GUI Blender open).

## Lead: defaults and boats by device (landed)

- **Stepped shading by default** (`world.js` `WORLD_DEFAULTS.shading = 'toon'`, the user). True colours were already on
  by default.
- **Saved settings versioned** (`s.v`): the page saves every key whenever one changes, so a new default never reached
  a returning visitor. v2 puts stepped shading and true colours over the saved copy once; choices made after stay.
- **Boats by device** (the user: "if his device supports then we do a more complex flow"; `map/BUILDING.md` "The
  river's flow, by device"): settings key `boats` = auto | moored | painted | waves (`world.js` `boatMode`/`boatCap`);
  auto gives light *painted* (`tiers.js` `flowCap` 0), balanced *waves* up to 3, full up to 6; waves chosen by hand on
  light: 2. `?boatflow=moored|painted|waves` and `?boatflowcap=N` win. Painted and waves switch live (the cap);
  to or from moored waits for the next visit. `boatflow.js`: the waves lanes are built at cap 0 too, and `pick()`
  holds active copies under the cap. `boats.js` takes `hooks.flow` from the page (other pages keep the URL switch).
- **The 船行 Boats row** in the settings' Display page (`ui/settings_screen.js`, `ui/settings_words.js`; the UI session
  that owned these was cleared and asked the lead to add it).
- Check: `check_deploy.mjs` PASS on the built snapshot (all sections, 34 boats, no errors).
- **The detail systems' tier contract** (proposed by the details session for its 3D trees, ambient life and chatter;
  the user: "performance-friendly yet detail-rich"): `tiers.js` `TIERS[t].detail` (numbers per system, the details
  session tunes them), `web/src/detail.js` (`register(name, { applyTier, stats })`, `applyDetail`, `detailStats`;
  `__test.details()`), and `detailScale`: held at the render-scale floor and still under 30 fps for 8 s, an automatic
  tier first lowers its details 1 -> 0.75 -> 0.5, then steps down.

## Loading agent (landed; `loading.md`, `lessons_loading.md`)

- **Content-hashed names** at build time (`web/vite_asset_hashes.js`): every un-hashed GLB/JSON/KTX2/WebP/WebM/SVG/CSS
  under `assets/` (and the basis transcoder) gets a hard-linked second name `<name>.<8 hex>.<ext>` (~920 files); an
  inline map in each page wraps `fetch` (three's loaders included), falling back to the plain name on a 404; dev and
  check servers have no map. `web/vercel.json` serves the hashed names immutable; `deploy_web.sh`'s live step checks
  that `/assets/gate.<hash>.glb` is. The build holds ~2050 files (hard links; Vercel dedupes uploads), `world.html` 3.5
  -> 13.7 KB gzipped; the first visit after the deploy fetches everything once under the new names.
- **Small tree cards first:** `tools/tree_cards.mjs small` (52 cards at 256 px, 1.1 MB; also after every `ship`),
  `trees.json` `small`; `world.js` `sharpenCards` swaps in the full card nearest first once the stream is idle;
  `?smallcards=0|only`.
- Numbers (phone viewport, CPU 4x, `?tier=low`, 5195 vs 5197, A B A B on fast 4G):
  - cold, first window in 37.7 / 38.9 -> 30.8 / 33.2 s, 36.0 -> 29.3 MB (trees 7.4 -> 0.77 MB); can walk unchanged
    (~10.5 s);
  - second visit: can walk 4.5 / 5.8 -> 3.5 / 4.0 s with 2 network requests (was 79-92); first window 8.9 / 10.9 ->
    8.3 / 9.5 s, 6 requests (was 212);
  - slow 4G, one run each: cold first window 194 -> 162 s; second visit walk 5.7 -> 4.9 s with no requests.
- Checks: check_deploy PASS; world 211/211, boats 12/12, rides 5/5, people only the two stale gate spots, sizes 0.
- For the user: prefetch the first section at low priority while the start screen waits (several seconds sooner to
  walk; costs data for visitors who leave without pressing).

## Frame-rate agent (landed; `framerate.md`, `lessons_framerate.md`)

Measured in one page with a runtime switch (A B B A, 10 rounds, medians; two-page benches swung 2x on the shared
machine), phone proxy (`tier=low`, 390 x 844 at DPR 3, CPU 4x); tool `framerate/inpage_ab.mjs`.
- **Boats in one batch per material across sections** (`boats.js` `join`/`leave`, a shared pool; `world.js`
  `onBatch`): boat batches at the crown 32 -> 15, grain wharf 29 -> 14; crown draws 375 -> 341 (high, 1280 x 720);
  about 1.5 ms a frame at the crown on the phone proxy by the draw cost. Streaming over the S3/S2 river with the flow on:
  no mismatches, orphans or errors.
- **Two-layer shadows** (`world.js` `shadowLayers`; `?shadowcache=0` one layer): the static world drawn into the
  shadow map only when due, its depth kept and blitted back in place of the clear on the people's redraws, then only
  the movers drawn. Movers = direct children of the scene with `userData.shadowMover` (the crowd group, Person roots,
  boat batches); tree cards stay in the world layer, which also redraws after the camera moves 1 m (`CARD_STEP`) and
  when a static direct child is added or removed; high's shadow centre snaps to 1 m. Pixel-identical. Phone proxy CPU
  a frame: crown -10% (41.4 -> 45.9 fps), grain wharf -4%, storyteller -12% (34.3 -> 39.1); the shadow pass's own CPU
  -65…-79%.
- **Empty crowd batches skipped** (`crowd.js` `skipEmpty`): three.js did nearly all its per-object work for an
  instanced batch with nobody in it; now a batch with nobody in view is hidden, one with nobody within the shadow
  distance stops casting. Phone proxy CPU: crown -37% (21 -> 32 fps, a busy-machine run: trust the ratio), grain wharf
  -15%, storyteller -28%. Pixel-identical. High's `peopleFar` 40 m (no pixel changed at 40 or 50 m).
- Checks: world 211/211, boats 12/12, rides 5/5, people only the two stale gate spots, sizes 0; check_deploy PASS.
- Watch: 2 of 7 frozen-clock look runs since trees3d landed logged 36-72 "GL_INVALID_VALUE: glGetProgramiv: Program
  object expected" warnings (two layers on); never in the probe, check or regression runs.
- Next, quick: the low tier's people shadows 15 -> 20 Hz (a movers-only pass is cheap now); still moored boats into the
  world layer (13 draws a pass at the grain wharf).

## Cells (the middle version: built, opt-in, not rolled out)

- Built by the cells agent before it stopped at the usage limit: `tools/cells.mjs` (re-orders a shipped GLB's
  triangles into 8 m ground cells in place, per-node extras `cells`; colliders, `*hidden*`, water and `g_cloth_*`
  untouched; triangles per material checked unchanged) and `web/src/cells.js` (each material's cells of the loaded
  sections as one BatchedMesh, culled cell by cell, the shadow pass too). Not wired into the exporter; no shipped GLB
  is cut (`cells/try/` holds the cut copies).
- The S3 pilot, one snapshot, `?cells=0` against cells, phone proxy, A B A B (`cells/ab_same/`): crown 85 vs 82 fps
  (767k vs 721k triangles, 129 vs 121 calls), under the arch 83 vs 96 fps; the first rep ran on a busy machine (32 vs
  26, 23 vs 24). No clear gain: at the crown the world is ~226k of the ~770k triangles drawn and the crowd ~463k, and
  the low tier already draws few world draws (~40). So cells are **opt-in** (`?cells=1`) and nothing is re-cut; the
  exporters stay as they were. Worth revisiting with builder-made far levels (the full version) or for the high tier.

## A regression found and fixed: the first teleport after load (lead)

- The cells agent saw it: right after load, `view('crown')` dropped the player through the world and reset it to
  spawn; a second teleport worked; 5195 was fine. Bisect (`bisect/log.txt`): gone with `?smallcards=0`, there with
  `?shadowcache=0`, `?boatflow=moored`, `?cells=0`. Trace (`bisect/trace_current.txt`): the player unfrozen 0.2 s
  after the teleport, with S3 not yet in.
- Cause: overlapping teleports. The page's own `view()` at load awaits `settle()`, which since small cards first also
  waits for every full card; `__test` (and a visitor's HUD) comes earlier, so a second `goto()` ran while the first was
  pending, and the first's end set `player.frozen` back to false mid-stream.
- Fix (`world.js` `goto`): only the latest teleport gives the player back (`gotoLatest`, `gotoActive`, `gotoWas`).
  Trace after (`bisect/trace_fixed.txt`): frozen until S3 is in, lands on the deck at 5.28 m.

## Agents

- Frame rate (`framerate.md`): boats' batches across sections, two-layer shadows, far people out of the shadow pass.
- Loading (`loading.md`): content-hashed GLB/JSON names cached immutably, small tree cards first.
- Cells (`cells.md`): the middle version (cells cut at export, one BatchedMesh per material, per-cell culling), pilot
  on rainbow_bridge, then all eight sections if the phone proxy gains.
- Held for the details session (3d-director-2e, rebuilding characters): the crowd's far LOD and per-clip animation
  files; they go on top of its rebuild, the clip-file format agreed with it first.

## The deploy carries (other sessions' work, ready and waiting for it)

- The Start screen (session 3d-director-da, the user's ask): `world.html` waits for a 入畫 press before loading
  anything heavy (`web/src/ui/start.js`, `assets/scroll/band.webp` from `tools/start_band.mjs`); skipped for
  `?start=0` and headless Chrome. The user wants it live. v2 (commit 2c611f7): 入畫 button, the painting band
  swelling into the loading paper, a 卷記 essay and maker card (`ui/about.json`, `start.css`); a 語言 setting
  (`prefs.lang` zh | zh_en: English under places, lore and the journal; `ui_data.mjs` FAILs a place without `_en`);
  the scroll HUD's 繁體 names for all 1,167 map entities and a robed "you" on a cinnabar seal; fonts re-subset (first
  load 178.8 of 250 KB).
- The details session's engine edits, reviewed by the lead:
  - `post.js` no mist on the sky (depth 1): the "weird symbol in the sky" (`gen/details/sky/notes.md`).
  - The chatter registers through `detail.js` from `ui/index.js`; `tiers.js` `detail.talk` numbers.
  - fix-S4's grounding patches, landed by the lead (`gen/details/contacts/fix_s4/engine_patches.md`, `from_perf.md`):
    P1 clips grounded by their mesh soles (`clip_meta.json` `sole_m`, riders on `seat_m`, a WeakSet guard for shared
    hips arrays; `people_precompute.mjs` keeps them); P2 people.json `root_h` for figures seated up on vehicles. P3
    (static figures on visible floors only) was landed and then reverted at fix-S4's request: the Rainbow Bridge's
    visible stepped deck is nocol, its walkable surface the hidden ramp, so 73 deck figures dropped to the ground under
    the bridge. The 24 figures 6-16 cm over the steps got people.json `root_h` instead (data, no builder change: the
    walker's smooth ramp stays). P4 landed: `world.js` `regroundNear(sec)` after `rebuildCollider()` grounds the loaded
    neighbours' static figures and animals within 3 m of a joining section again (the S5-seam archer on the casks). Its outer_road rebuild and export run today.
  - fix-boats E1 (`boats.js` `floorLocal`: hits sorted highest first, so a crew on a cargo mound stands on it; 2 of
    106 crews moved). The details session owns boats exports from now on (sections export with `--no-boats`).
  - trees3d places behind the stream (no await in `placeTrees`); a card stays drawn until its 3D tree's batch is in.
  - Also landed by the details session after the lead's go: `trees3d.js` (3D trees, the card as far LOD,
    `?trees=cards`), `ambient.js` (birds, sparrows, catkins, smoke, cloth sway; `?ambient=0`), both registered in
    `detail.js`, neither casting into the per-frame shadow layer. The trees agent: low `strands` 0.4, `ktx2.mjs` encodes
    the 3D trees' atlases (bark ETC1S, crowns UASTC); a tier switch redraws the world shadow layer once; `budget_check
    all` PASS with 3D trees (binding window rainbow_bridge + canal + countryside 135.9 of 200 MB GPU; S4b + S3 + S2
    133.0, was 198.2 at v1); the crown +4.5 MB GPU on high and mid.
- qingming is its own git repo now (https://github.com/blueif16/qingming, main; skills moved into `qingming/.claude/`,
  symlinked from the root). Committing batch 2 there: ask the user.

## The pre-deploy run (lead)

1. Wait for the cells agent, and for the details session's switches (unsigned work opt-in: `?trees=3d`, `?ambient=1`,
   `?talk=1`; carried children only where `carry_check` passes).
2. `node tools/cast_clips_check.mjs` (every clip the shipped people.json files ask for is in characters.json; added by
   the details session after 7 clips went missing at 02:43), `node tools/ktx2.mjs check`, `budget_check all`, and no
   `clip_meta.json` `sole_m` over 0.2 m in magnitude except those the details session names (a double
   `clip_ground --write-meta` once grew them to metres).
3. A snapshot build served statically: `check_deploy.mjs`, then `regress.sh` at the default URL and at `?tier=low`,
   one look at three views against 5195; console warnings counted (the `glGetProgramiv` watch).
4. Hold `web/` edits (message the live sessions), `tools/deploy_web.sh`, the live slow-4G probe, say "deployed".

## Deployed (2026-10-13 ~06:30)

- Held tree (the details session held `web/` and its char-build lock): cast clips PASS, ktx2 PASS, sole_m guard PASS,
  `budget_check all --no-load` PASS (download with kit and cast: rainbow_bridge 27.39 of 28 MB, canal 26.37, the rest
  12.5-20.3); check_deploy PASS (8 sections, 34 boats, 33.9 MB); regress `b2_final_held`: world 210/211 (the S2 north
  bank E->W yard walk; alone 3/3 on 5195, on 5199, with `boatflow=moored` and on low: a crowd-timing flake), boats
  12/12, rides 5/5, people only the two stale gate spots, sizes 0; low tier world 211/211 (`b2_final_low`).
- `tools/deploy_web.sh` (`final/deploy.log`): 2180 files, 71.9 MB uploaded; `/assets/gate.0d08fa72.glb` served
  `public, max-age=31536000, immutable`. Live: https://qingming-delta.vercel.app
- Carried with it: the Start screen v2, 語言 and HUD names (3d-director-da); the details session's signed-off work
  (sky mist fix, eyes, contact fixes and exports for S4, S5, S7, S2, S1, the bridge's root_h data, P1/P2/P4, boats E1,
  walk-beside, the passing child props); trees3d, ambient and talk opt-in (`?trees=3d`, `?ambient=1`, `?talk=1`).

Frame rate, before (5195, the tree at the start of batch 2) against the deployed build (5199), A B A B, two reps
(`final/ab/ab.log`; the machine mostly quiet; the after side also carries stepped shading, the busy river on high and
today's casts). fps, CPU ms a frame, draw calls:

| | before rep 1 / 2 | after rep 1 / 2 |
|---|---|---|
| **phone proxy** (390 x 844 at DPR 3, CPU 4x, low), crown | 46 / 48 fps, CPU 20.3 / 19.7 | **67 / 59 fps**, CPU 13.8 / 15.7 |
| grain wharf | 43 / 45 fps, CPU 22.1 / 20.9 | **46 / 58 fps**, CPU 20.4 / 16.1 |
| storyteller | 76 / 88 fps, CPU 11.9 / 10.3 | 100 / 71 fps, CPU 8.8 / 12.6 (noisy) |
| **high, 1920 x 1080**, crown | 245 / 266 fps, 385 calls | 259 / 431 fps, **219 calls** |
| grain wharf | 198 / 219 fps, 362 calls | 360 / 244 fps, **211 calls** |
| storyteller | 315 / 494 fps, 285 calls | 643 / 681 fps, **154 calls** |

Since batch 1's own "before" (the page of 2026-10-12), the phone proxy at the crown has gone 25 -> 43 (batch 1) ->
about 60-67 fps.

## Watch: `GL_INVALID_VALUE: glGetProgramiv: Program object expected`

Seen in 2 of 7 frozen-clock look runs (frame-rate agent) and once in an ambient stills run on 5190 (~06:10, whole
world streaming via goto); reruns of the same spots logged 0; never in check, probe or regression runs. It is what
three's `compileAsync` logs when a program it polls (every 10 ms) is deleted mid-poll. Section ops are serialized
(`run()`), so a section's own compile and an unload can't overlap; the likeliest source is a material switching
program while a section's `compile` step polls: `sharpen()` sets `needsUpdate` on a card's material when its full
texture comes in (small cards first), and `applyShading` swaps variants. Harmless (a warning; the program is made
again on first use). Next: drop `needsUpdate` in `sharpen()` (a map swapped for another of the same kind needs no new
program) and see whether the warning goes.

## Round 2 (after the 06:30 deploy)

- **Per-clip animation files** (clips agent; `clips.md`): `tools/clip_split.mjs` writes `chars/body/<name>.glb` (body,
  skin, props, textures, idle) and `chars/clips/<name>/<clip>.glb` from each full GLB (byte copies, every array checked),
  listed in `chars/clips.json` with the full GLB's hash; run at the end of `character.mjs build` and `char_lod.mjs`
  under the char-build lock, temp files and renames, a failure fails the build. The page loads bodies plus the clips a
  section plays; a missing or stale split loads the full GLB. `budget_check` counts the real download: with kit and
  cast rainbow_bridge 27.86 -> 21.75 MB, canal 26.77 -> 20.54, the rest 8.6-15.8. Same 897 people, same clips.
- **Crowd far LOD** (crowd agent; `crowd.md`, `lessons_crowd.md`): `tools/char_lod.mjs` appends a simplified index
  (about a quarter of the triangles, at most ~3.4 cm off on a 1.7 m figure) to each body over the same vertices, +3 KB
  a GLB, props and tack untouched (34 characters, 12 animals); run in `character.mjs` `splitClips` before clip_split and
  in `animal.mjs` build. `people.js` `farBodies` uses it only while its counts match; `crowd.js` draws a character with
  its far body when all its people in view are past `tiers.js` `peopleLod` (low 20 m, mid 30, high 50; `?peoplelod=`),
  so no draw is added (the split form, `?lodsplit=1`, waits for a real-phone test). Phone proxy: grain wharf frame
  triangles 466k -> 393k (-16%; the crowd pass -35%), crown -2%, storyteller none; ms within the noise (the proxy's GPU
  isn't vertex-bound). Look: 0-0.005% of pixels. Regression `b2_crowd`: world 210/211 (S2 "back ashore from the
  hooded-bow cargo boat", failing the same way before the change), boats 12/12, rides 5/5, people only the stale gate
  spots, sizes 0.
- The two walks that failed after the details session's 06:44 boats exports were fixed on its side (walkable hatch
  covers stop the walker earlier: expects widened with a why; the S3 cart puller re-solved off the walk line).
- **Deployed 2026-10-13 ~07:45** from the held tree: cast clips PASS (split current, 34), `char_lod --check` and
  `clip_split --check` PASS, ktx2 PASS, sole_m guard PASS, budget PASS (rainbow_bridge 21.81, canal 20.63 of 28 MB);
  check_deploy PASS (the whole world now 18.3 MB of requests, was 33.9); regress `b2_r2_held`: world 211/211, boats
  12/12, rides 5/5, people only the stale gate spots, sizes 0; low world 211/211 (`b2_r2_low`).
- Lead: `people_precompute.mjs` gives walking IK variants their base's pace; fix-river's E1b (`beside` drivers keep
  their place by the animal).

## Numbers

Live site before batch 2 (`probe.mjs load https://qingming-delta.vercel.app/world.html --net slow4g --throttle 4
--warm 1`, phone viewport; `live_before/load_slow4g.log`), i.e. batch 1 as deployed:

| | live, after batch 1 |
|---|---|
| cold: can walk | **25.1 s** (67 requests, 4.7 MB over the wire; was 76 s before batch 1) |
| cold: first window in | 137.0 s (250 requests, 23.7 MB) |
| second visit: can walk | 3.6 s (103 requests, 23 KB over the wire) |
| second visit: first window in | 9.1 s (239 requests, 62 KB) |

The cold walk waits for: kit and bodies 1.3 MB, the section 1.1 MB, the cast 0.9 MB, other 0.7 MB, code 0.4 MB.

Live after the batch-2 deploy, the same probe (`live_after/load_slow4g.log`; one run each, ±2 s; the machine was
busy with two agents):

| | before (batch 1 live) | after (batch 2 live) |
|---|---|---|
| cold: can walk | 25.1 s, 4.7 MB | 27.3 s, 5.0 MB (the start screen's code, the inline hash map, today's heavier casts) |
| cold: first window in | 137.0 s, 23.7 MB | **109.3 s, 18.1 MB** (small tree cards first) |
| second visit: can walk | 3.6 s, 23 KB | 5.5 s, 0 KB over the wire (159 requests, all from cache) |
| second visit: first window in | 9.1 s, 62 KB | 11.7 s, 415 KB |

Live after round 2 (per-clip files and the far LOD; `live_after2/load_slow4g.log`, the same probe):

| | before batch 2 | after round 1 | **after round 2** |
|---|---|---|---|
| cold: can walk | 25.1 s, 4.7 MB | 27.3 s, 5.0 MB | 26.3 s, 4.6 MB |
| cold: first window in | 137.0 s, 23.7 MB | 109.3 s, 18.1 MB | **96.4 s, 9.9 MB** |
| second visit: can walk | 3.6 s, 23 KB | 5.5 s, 0 KB | **3.0 s, 0 KB** |
| second visit: first window in | 9.1 s, 62 KB | 11.7 s, 415 KB | **5.9 s, 0 KB** |

After round 1: the second visit asked the network for nothing before walking, as designed, but took longer on that run: parsing at
4x CPU (today's casts grew with the IK variants) and a busy machine. The per-clip files (round 2) cut the casts.

## Next

- A real-phone check (any mid Android and an iPhone): the tier it picks, fps at the crown and the grain wharf, and
  `?lodsplit=1` against the default (the far LOD's split form buys ~70k fewer skinned triangles at the crown for 4
  draws; the proxy can't tell).
- The world in cells, the full version (builder-made far levels, texture arrays) for mid and high; the middle
  version is built and opt-in (`?cells=1`).
- `?window=ahead` for the low tier (two walks to look at: S3's under-arch shore, S2's hooded-bow boarding).
- Prefetch the first section at low priority while the start screen waits (the user's call: data for visitors who
  leave without pressing).
- The `glGetProgramiv` watch: drop `needsUpdate` in `sharpen()`.
- The details session's opt-in work (`?trees=3d`, `?ambient=1`, `?talk=1`) goes default when it signs off; each
  registers with `detail.js`, so the tiers already scale it.
