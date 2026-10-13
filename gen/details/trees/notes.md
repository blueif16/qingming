# 3D trees: record (details pass, agent "trees", 2026-10-13)

Brief: `gen/details/brief_trees.md`. Method and survey: `method.md`. Tool: `tools/trees3d.mjs` (config
`trees/trees3d.json`), Blender step `blender/trees3d_convert.py`, page module `web/src/trees3d.js`, shared wind
`web/src/wind.js`, pilot harness `gen/details/trees/tools/pilot.mjs`.

## Stage log

1. **Assets for the pilot form (willow_fan, 4 variants).**
   - Bare frameworks: shyfai i2i of each painted card (`prompts/bare.txt` + `bare_willow_fan.txt`), 4 draws, 41-45 s each,
     all good at the first draw (`check/bare_willow_fan.jpg`: card beside its bare wood). willow_fan_1's limbs moved a
     little (6 heads for the card's 8); the others keep the card's forks and lean.
   - Clump sheet: one shyfai sheet of four shoot fans (`prompts/clumps.txt` + `clumps_willow_fan.txt`), good at the first
     draw: narrow, wide, leaning left, leaning right, each from one root point.
   - Meshy image-to-3D (meshy-t2, smart topology, 3000 target, textured) of each keyed bare painting: 4 x 15 = **60
     credits** (`gen/expand/round2/workshop_logs/credits.log`, balance 570 -> 510), about 1 min each.
   - Blender (`trees3d_convert.py`): weld the glTF's UV-seam splits (the first run read 147 "pieces" and kept 140
     triangles), drop crumbs, decimate to 2000 triangles, foot to the origin, real height (the bare painting's box at the
     card's metres per pixel), the Meshy texture into vertex colours (sRGB bytes: linearised in the build), the limbs'
     ends as local maxima of the geodesic distance from the foot (2-5 heads per tree).
   - Build (`trees3d.mjs build`): Meshy's limbs stand nearly in one plane (from one view), so each limb is swung in depth
     about its fork, alternately forward and back (the front view stays the painting's); per head 3 crossed fan quads +
     2 tilted, cut to each clump's convex outline (7-8 corners, 47-61% of the cell: half the overdraw of a square),
     normals spherised (0.55 radial + 0.45 up) so the crown shades as one soft volume, a little darker toward each
     root. 2073-2183 triangles a tree (wood 2000), 83-91 KB GLB.
2. **The page module** (`web/src/trees3d.js`): one BatchedMesh of every 3D tree in the loaded sections, one material
   (the page's shading variant + its patch), wind in the vertex shader, the dithered hand-over computed from the
   distance in both shaders (no per-frame work), near trees chosen 4 times a second for the colour pass; the shadow
   pass draws every tree at rest. Pilot first injected through `__test` (no world.js line), then the world.js hook
   (12 small edits, `world_hook.diff`, sent to 3d-director-04 on landing, 2026-10-13 ~02:05).
3. **Pilot look** (`shots/pilot_v2/`, `shots/pilot_v3_hooked/`, the gate's four willow_fan trees + S4's three):
   real trunks with their heads and fans of shoots; the elms, pines and other forms stay cards until they are built.
   Fixes on the way: the card fade first hid every card (now only cards with a 3D tree fade); trunk colours were
   too pale (sRGB bytes used as linear).
4. **Wind** (`film/pilot_v2/`: `film.jpg`, `wind.mp4`, `three_frames.jpg`, `diff_0_10.png`): the fans flutter about
   their heads and the trees sway a little; the trunk's top moves at most ~0.16 m in the default breeze.
5. **Pilot numbers** (gate + outer road, the four willow_fan variants, high 1920 x 1080 and the phone proxy, in-page
   A/B: the same page with the 3D trees off and on, A B A B; `bench/pilot_hooked_high/`, `bench/pilot_hooked_phone_low/`,
   `bench/pilot_mem_*`):
   - high: +1 draw call (the batch; the four cards' shadow draws gone), +20-35k triangles (all passes), CPU and GPU
     within the noise (2.2-3.3 ms CPU); the cached world shadow layer is not redrawn while you stand (0 world redraws
     in each 3 s window), the people's layer every frame as before;
   - phone proxy, low tier (3D within 25 m, half the clumps): 55.6 fps mean with cards, 55.5 with 3D trees; CPU
     16.4 -> 16.8 ms (+2%), GPU 6.7 -> 7.2 ms (alpha-tested crowns and 14k triangles);
   - GPU memory at the gate (high, 1080p): 168.8 MB with cards, 169.1 MB with 3D trees (+0.3: the crown atlas and
     geometry, less the four willow cards kept at 256 px);
   - a slot's Chrome keeps other agents' saved settings: one profile had shadows off, so the first high bench read
     0 shadow redraws. The harness now pins shadows on and toon shading (`pilot.mjs`); bench configs set them too.
6. **The hook check** (the lead's must-keep): switching the tier by hand, and switching trees3d's own numbers with the
   shadow box unchanged, each redraws the cached world shadow layer exactly once (`checks/shadow_tier/eval.json`:
   world draws 1 -> 2 -> 3 -> 4 -> 5 -> 6 over high, low, high, 3D off, 3D on, detailScale 0.5; standing still: none).
   trees3d's applyTier calls onChange (world.js shadowState.dirty) on every tier or scale change.
7. **Scale to all 12 forms** (2026-10-13, ~02:15-03:00):
   - 19 more bare paintings (willow_burl 7, elm_claw 6, pine_fan 5, willow_weep 1), all good at the first draw
     (`check/bare_<form>.jpg`); 7 more clump sheets (whips, elm claws, pine needle fans, hanging whips, young shoots,
     bamboo sprays, evergreen leaf clusters), all good at the first draw; the atlas is 2048 px, 6 x 6 cells of 340 px
     (`check/atlas.jpg`: outlines and roots).
   - 19 Meshy trunks: 19 x 15 = 285 credits (510 -> 225). Credits in all: **345** (23 trunks).
   - Card-built wood (`tools/lib/trees3d_proc.mjs`) for shoot_tree, slender, sapling (19 variants); stems from the
     foot for bamboo and the shrub; no wood for whip_clump and the hedge.
   - Fixes found by looking (`shots/forms_v1` .. `forms_v6`, cards beside 3D at one tree of every form):
     - the pollard willows' bare paintings came back 1.3-1.5 x bigger than their cards (no whips to fill the
       frame): the trunk's width above the foot fits the scale (0.65-0.82; elms 0.9-1.0);
     - Meshy's own lean in depth is removed; the burls are no longer swung in depth (one massive bole, not limbs);
       normals are recomputed after any swing;
     - vertex colours were too coarse for the big boles (clay-like): the Meshy textures go into a bark atlas
       (2048 px, ETC1S);
     - pines: big flat needle fans read as palm or ginkgo leaves; now small tufts through the card's own needle
       masses (fill);
     - fan heads read as red blots from afar (every shoot meets at the root): roots staggered and the knot faded
       in the shader;
     - the weeping willow's curtains were too dense; sparser now (14 whips);
     - the young shoot trees: big fans of shoots from short stems (heads), as the card paints them.
   - GLBs meshopt-compressed with quantized attributes: 52 variants, 1.7 MB in all (5-80 KB each); the page bakes
     the dequantising transform into the batch's geometry.
   - `node tools/trees3d.mjs check`: 223 mapped trees (+1 kit) each with its card, its 256 px far level and its 3D
     tree, 52 variants, 32 cells; PASS. `tools/tree_cards.mjs check` PASS as before.
   - `budget_check all` PASS with the 3D trees: the binding window is now rainbow_bridge + canal + countryside at
     135.9 MB of 200 (S4b + S3 + S2: 133.0). In the crown's window (S4b + S3 + S2, 1080p) the page measures +4.5 MB
     on high (200.6 -> 205.1) and mid (140.8 -> 145.3): atlases +10.6, geometry +2.7, cards kept small -8.7.
8. **Benches, round 1** (`bench/ab/run1/`, `tools/ab_trees.sh` + `tools/ab_summary.py`: `?trees=cards` (A)
   against 3D trees (B), A B A B, each run a fresh slot Chrome with shadows and toon pinned; high and mid at
   1920 x 1080, the phone proxy 390 x 844 at DPR 3 with 4x CPU on the low tier; the perf batch's views):
   - high: within the noise at all three views (fps 251 -> 276 crown, 292 -> 304 wharf, 322 -> 379 storyteller;
     run-to-run spread +-30% on this shared machine), +1-3 draw calls, +17-116k triangles all passes;
   - mid: crown 267 -> 247 fps, grain wharf 282 -> 229 (CPU +0.8 ms, GPU +1 ms), storyteller 332 -> 336;
   - phone proxy (low: no 3D by the rivers): crown and storyteller within noise; grain wharf 63 -> 23 fps, all of it
     in the people's part (anim 3 -> 9-16 ms): the trees step waited for the 3D atlases and GLBs, so the people's
     bakes ran late. Fixed: `placeTrees` no longer awaits `trees3d.place` (a world.js line, sent to 3d-director-04),
     each card stays drawn and casting until a batch holding its 3D tree exists, and the GLBs dequantise with a
     typed-array loop (was a getComponent per value). Round 2 with 3 reps checks it.
9. **The GL warnings** ("glGetProgramiv: Program object expected", 36 once in `shots/forms_v4`, and in 2 of 7 of the
   lead's frozen-clock look runs): trees3d compiles nothing and disposes no material while frames draw (variants
   once per shading mode, one depth material, a section change swaps only the BatchedMesh). The same 12-spot
   toggling run with a GL trace (`pilot.mjs --gltrace`: every deleteProgram remembered, every getProgramParameter on a
   deleted program reported with both stacks): 0 and 0 (`shots/forms_v7`). Told 3d-director-04 with the trace recipe.
10. **Off by default** (the lead, 2026-10-13 ~03:47, before the performance session's regression and deploy): the 3D
    trees draw only with `?trees=3d`. Inside `trees3d.js` (world.js unchanged): without the flag the Trees3D that
    world.js builds is inert (no fetch, nothing in the scene, card materials untouched, castShadow untouched, cards
    sharpen as before, no shadowState calls; detail.js 'trees' stats all 0). Proof (`checks/off_path*/`): the default
    page and `?trees=cards` draw the same 206 / 219 calls and 1,839,332 / 1,940,972 triangles at the bridge / crown,
    32 / 25 card meshes all casting, one card program, the same scene children. `vite build` clean. The harness and
    `ab_trees.sh` now load B with `&trees=3d`.
11. **Benches, rounds 2-4** (`bench/ab/run2..4`, pooled medians in `bench/ab/pooled.json`):
    - high: within the noise (crown 266 -> 312 fps, wharf 265 -> 294, storyteller 412 -> 394; calls +1-5, +12-116k
      triangles all passes);
    - mid: crown 256 -> 258, wharf 286 -> 237, storyteller 365 -> 432 (calls +1-2, +20-66k triangles);
    - phone proxy, low: the B runs after a view change more often caught the people's bakes still running (anim 14-21
      ms against 3-4): with a 15 s warm-up, 3 of 5 B runs at the grain wharf against 0 of 5 A. Traced at the wharf
      throttled from the start (`checks/wharf*`): both sides bake as long (anim 16-29 ms for 24 s), no world-layer
      redraws, no rebuilds; the steady frames are the same. Round 4 warms 35 s before measuring.
12. **After the usage-limit stop** (resumed 06:03; state checked: every JSON parses, the hook and the opt-in switch
    in place, `trees3d.mjs check` and `tree_cards.mjs check` PASS, `ktx2 check` PASS):
    - Regression with the 3D trees on (`regress.sh trees3d_on world people`, `?start=0&trees=3d`): world walks
      **211/211 PASS**; people FAIL only on the two known stale gate spots (X 7 D 3.9, X -8 D 4.1), as in every
      baseline (`gen/expand/round2/page_qa/trees3d_on/`).
    - Final look, cards beside 3D at 12 views at 10:00 and 17:30 (`shots/final_h10/sheet.jpg`,
      `shots/final_h17.5/sheet.jpg`).
    - Wind films (48 frames, 0.12 s apart, 960 px mp4): `film/final_willow_weep/`, `final_pine_fan/`,
      `final_bamboo/`, `final_gate_willows/` (`wind.mp4` + `film.jpg`), and the pilot's `film/pilot_v2/`.
    - Phone viewport GPU memory on low (`bench/mem_phone_*`): by the rivers (crown) 92.5 MB with cards and 92.5
      with the flag (no 3D there on low, the atlases never uploaded); at the gate 89.2 -> 104.1 MB (+15: atlases
      10.6 as BC7 on this desktop, about 8 on a phone as ASTC + ETC1; geometry +4), 37 of 74 trees drawn in 3D
      within 33 m, 69k triangles.
    - Round 4 (phone, 35 s warm, 3 reps): crown 38 -> 47 fps, grain wharf 55 -> 54, storyteller 111 -> 131.
    - Round 5 (phone, low, the gate window with every form in 3D, 35 s warm, 3 reps): bridge 26.7 -> 28.7 fps
      (CPU 35.5 -> 33.8 ms, GPU 18.9 -> 17.4), tower 37.5 -> 65.2 (noise); within the noise.

## Results (2026-10-13, for the lead's sign-off; the page draws them only with ?trees=3d)

Interleaved A/B, cards (`?trees=cards`) against 3D trees, fresh slot Chromes, shadows and toon pinned; medians of
all runs (`bench/ab/run1..5`, `bench/ab/pooled.json`). fps; CPU / GPU ms a frame; draw calls and triangles (all
passes) of the last frame.

| tier | view | cards | 3D trees |
|---|---|---|---|
| high 1920x1080 | crown | 266 fps, 3.48 / 3.04 ms, 219 calls, 1938k | 312 fps, 2.93 / 2.61 ms, 220 calls, 1979k |
| | grain wharf | 265 fps, 3.53 / 2.90, 211, 774k | 294 fps, 3.15 / 2.78, 216, 887k |
| | storyteller | 412 fps, 2.12 / 1.92, 154, 1058k | 394 fps, 2.28 / 1.86, 155, 1088k |
| mid 1920x1080 | crown | 256 fps, 3.40 / 2.44, 164, 1214k | 258 fps, 3.55 / 2.80, 165, 1237k |
| | grain wharf | 286 fps, 3.23 / 2.06, 163, 538k | 237 fps, 3.67 / 2.20, 165, 604k |
| | storyteller | 365 fps, 2.33 / 1.69, 127, 645k | 432 fps, 1.95 / 1.29, 128, 665k |
| low, phone proxy (390x844x3, 4x CPU) | crown (no 3D by the rivers) | 38 fps | 47 fps |
| | grain wharf (S1's trees 3D) | 55 fps | 54 fps |
| | storyteller | 111 fps | 131 fps |
| | gate bridge (37 trees in 3D) | 26.7 fps, 35.5 / 18.9 ms | 28.7 fps, 33.8 / 17.4 ms |

Run-to-run spread on this shared machine is about +-30%; nothing beyond it except mid at the grain wharf (-17%,
+0.4 ms CPU, +0.1 ms GPU).

GPU memory (`?gpumem=1`):
- the rivers' window (S4b + S3 + S2 at the crown), 1080p: high 200.6 -> 205.1 MB, mid 140.8 -> 145.3;
- phone viewport, low: 92.5 -> 92.5 by the rivers (cards there), 89.2 -> 104.1 at the gate;
- `budget_check all`: PASS, the biggest window 135.9 of 200 MB.

## Left

1. **Sign-off, then on by default:**
   - `trees3d.js` `TREES3D_ON` (or a tiers/prefs flag);
   - CLAUDE.md's "Foliage" line still says cards for trees;
   - the skill now says 3D near, card far.
2. **Trunk colliders:** the sections' trunk colliders are 0.35 m cylinders, and a pollard's 3D bole is 0.8-1.8 m in
   radius (`trees3d.json` `variants.<card>.trunk.r`, the bole's median radius at 0.3-1.6 m). The builders' trunk
   colliders should take it; until then you can walk into a big bole's edge.
3. **A wood LOD for the low tier:** the Meshy wood is 2000-2400 triangles a tree. At the gate on low, 37 trees in
   3D are 69k triangles: within the noise on the phone proxy, but a 600-800 triangle LOD (a second decimation in
   `convert`) would halve it.
4. **Look polish:**
   - pines a little bluer and fuller than their cards;
   - the burls' Meshy bark a little olive;
   - fan heads still show a warm knot from far;
   - the hedge row denser than painted.
5. **The 256 px cards have no KTX2 copies** (`ktx2.mjs` lists `trees/*.webp`, not `trees/small/`). Encoding them
   would cut every far card's GPU bytes about 4x.
6. **`tree_cards.mjs`** keeps its own copy of the keyer. `tools/lib/paper_key.mjs` is the same code, byte-identical
   on willow_fan_1; switch it over.
7. **The GL warnings** (the lead's look runs): not reproduced with trees3d (GL trace, 0). The trace recipe is with
   3d-director-04.
8. **Meshy:** msy_VYNl 225 credits left after this pass's 345.
