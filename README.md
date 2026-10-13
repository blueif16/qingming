# 清明上河图 web world

A walkable 清明上河图 in the browser. The quality bar is https://messenger.abeto.co/.

**Picking up the work:** `NEXT_SESSION.md` holds the current state, the user's latest asks and a prompt to start the next session with.

**Live:** https://qingming-delta.vercel.app (the joined world). `tools/deploy_web.sh` builds, checks and redeploys it; skill `.claude/skills/deploy-web/SKILL.md`.

## How it was made

**In numbers** (2026-10-13):
- **The scroll:** all of it, built as 8 sections (S1–S7, with S4 in two parts) and joined into one walk.
- **The map:** 1,982 painted things measured on the strokes: 811 people, 92 animals, 224 trees, 146 buildings,
  58 structures, 60 vehicles and 486 props, plus the ground, roads and water.
- **People:** all 811 painted people. 754 act at their painted spots and 57 walk a short way and back. 90 animals.
- **Characters:** 34 (31 made with Meshy, 3 free recolours), with 105 actions, about 90 of them written as text
  prompts, and 76 carried things.
- **Animals, boats, carts:** 13 animal models of 9 kinds; 34 boats with decks you can walk on; 25 carts, barrows and
  sedan chairs.
- **Trees and buildings:** 52 painted cards in 12 forms for the 223 painted trees; 146 buildings and 58 structures.
- **Sound:** 107 sound effects in 168 Opus files, 1.9 MB.
- **Size:** about 100 MB on the server, 22 MB of it the painting the HUD shows. A phone downloads 4.7 MB before you can
  walk. All eight sections with everything they cast come to about 61 MB unpacked.

**The steps:**

1. **Map the scroll from its strokes** (`map/`).
   - Agents mark each painted thing as points on its strokes: feet, roof corners, wheel hubs, bank edges. A frame per
     section turns those points into metres, with its assumptions written down.
   - `tools/scroll_map.mjs` writes each section in metres and in words (`map/text/<S>.md`). Builders read the text, not
     the painting. The last five areas were mapped at once by 87 agents.
2. **Restyle the sections** (`tools/scroll_pipeline.mjs`).
   - shyfai redraws each tile of a section from three images: the scroll tile (layout), the section's restyled overview
     (colours) and B1 (`prompts/style_B1.png`, the style). The tiles are registered back onto the scan and stitched.
   - The result shows the true colours and the detail the silk has lost, and the characters are cropped from it. It is
     a reference only: positions still come from the map.
3. **Build the sets in Blender from kits.**
   - A headless builder per section (`tools/build_scene.sh <name>`) composes the scene from kits: the Song kit (columns,
     brackets, curved roofs, stairs, hand-cut stones), carts, boats, and set pieces such as the Rainbow Bridge.
   - As in Messenger's world, there are no plain boxes: the triangles go into edges, trims and openings. Boats are
     real size. `tools/export_web_scene.mjs` ships each section as an optimized GLB.
4. **Make the characters** (`tools/character.mjs`). Each character is one painted figure.
   - The figure is cropped, and shyfai draws a front, side and back sheet in B1's style. Meshy builds the mesh (about
     4k triangles), retextures and rigs it. One small GLB holds the body, its clips and its carried props, close to
     Messenger's character spec.
   - Actions come from Meshy's library (checked frame by frame before buying) or from Meshy Text to Motion
     (`prompts/motion_<name>.txt`). A take costs 10 credits once; `tools/retarget_local.mjs` puts it on any rig for free.
5. **Animals and trees.**
   - Each animal is a Meshy body on our own rig (`blender/rig_quadruped.py`), with clips keyed in code: a four-beat walk
     that doesn't slide, idle, graze and lie.
   - 3D generators turn willow strands into slabs, so trees are painted cards. shyfai draws a card for each painted
     form, and each tree gets the card of its form.
6. **Place everything by the map, never by eye.**
   - `tools/map_layout.mjs` writes each section's `layout.json`. Builders, people and tests take positions only from it.
     Every departure goes in `build_choices.json` with a reason: 381 moves, such as S4b's far bank moved 5.5 m so the
     real-size hulls fit.
   - `tools/loyalty_check.mjs` must PASS: one model for each mapped thing, and nothing else (`map/BUILDING.md`). Where
     nothing is painted, invisible walls end the walk, and mist or painted panels stand beyond them.
   - What people do is data (`sections/<name>/people.json`): actions at each spot, walkers' paths, animals, riders,
     boat crews.
7. **Fine-tuning.**
   - **Walks:** a clip audit dropped the carry walks that looked like zombies without their load. Carrying came back
     with props.
   - **Sizes:** props baked into the models had shrunk 643 adults to child size. People are now sized from the body
     alone, and `tools/people_check.mjs` fails any adult drawn under 0.9 without a reason.
   - **Room to walk:** figures and animals that shut a passage moved a few decimetres, and the move is recorded.
   - **Routing round you:** walkers steer round you and round others, follow people going their way, and turn back
     when the way is shut.
   - **Retakes:** weak takes were made again (9 in the last paid run).
   - **Eyes:** `tools/eye_check.mjs` found 20 characters whose eyes were plain dots. 16 got another character's eye
     drawn into their texture.
   - **Contacts and joints:** the hands, soles and seats of every clip are measured against the built geometry. The
     fixes come next.
8. **Sound and the ink UI.**
   - The sound effects come from ElevenLabs, each tied to something painted, with low beds of wind and birds. They are
     checked, then cut into single hits and loops (skill `sounds`). There are no voices yet.
   - The UI follows 江南百景圖: traditional characters, brush fonts, ink on paper. The hour shows only as a period
     instrument. Space opens the painting, centred on where you stand, with the people near you boxed.

## Running on any device

The aim is reach, phones first. Every device draws every painted figure; a slower device changes only how things are
drawn. We measure on a desktop GPU set up as a phone, the "phone proxy": a 390 × 844 screen at DPR 3, the CPU slowed
4×, the low tier.

**Download**
- **Compression:** meshes are meshopt and textures webp, and the GPU gets KTX2 copies (4–8 bits a pixel instead of 32).
  With three sections loaded, GPU memory went from 393 to 193 MB.
- **Shared textures:** the kit's textures ship once for every section (the gate's GLB went from 2.0 to 1.5 MB).
  Characters ship only the clips their sections play.
- **Caching:** files have content-hashed names and are cached for a year. A second visit asks the network for 2 files
  instead of about 80.
- **On demand:** fonts are cut down to the characters the UI uses. The settings screen, the journal and the long texts'
  fonts load when first opened. Sounds are mono Opus (24–32 kb/s), fetched when they first play. The HUD's painting is
  a tile pyramid (22 MB), fetched only while the HUD is open.
- **Start, then walk:** nothing heavy loads before you press 入畫. You can walk once your section, its kit and your
  character are in. Tree cards come at 256 px first: 0.77 MB instead of 7.4 MB at the first window. On the live site, a
  first visit on slow 4G walks after 25 s instead of 76.

**Streaming**
- **A window:** the page holds your section and each neighbour, and unloads the rest. Shared kit, characters and
  textures are reference-counted, so walking end to end and back returns to the same memory.
- **Short stalls:** images decode off the main thread, shaders compile before a section shows, and clips bake in 4 ms
  slices. Walkers' paths and clip grounding are computed offline. Load stalls went from 1.0–1.25 s to 51–126 ms.
- **Budgets:** each section must pass `tools/budget_check.mjs`: 9 MB download, 130k triangles, 330 draw calls, 75 MB of
  GPU memory. Three neighbours may take 200 MB, so a phone can hold the window however long the world grows.

**Rendering**
- **Device tiers** (`web/src/tiers.js`): low, mid or high. The page guesses from what the browser reports (touch,
  memory, cores, the GPU's name), checks the first 3 s of frames, then adjusts the resolution while you play. The
  choice is remembered per device, and the Quality setting overrides it.
- **The ink pass:** the colour pass writes the normals the ink outlines need, so no second pass draws them. In the
  prototype that cut the phone proxy's frame by 29%. Low and mid use FXAA and an 8-bit target instead of MSAA. That
  frees 37 MB of buffers on a phone, and phones without float render targets still get a picture.
- **Shadows:** on low and mid the shadow box sits ahead of where you look. It is redrawn only when it or the sun
  moves, and the people 15–20 times a second. People further than 15 m (low) or 30 m (mid) cast no shadow.
- **The crowd:** clips are baked into a half-float bone texture (16 bytes a bone a frame instead of 48). One draw per
  character covers everyone it plays, and people out of view are culled. For 377 people that took the frame rate from
  23–25 to 232–292 fps and the draw calls from 1,145 to 194.
- **Boats:** boats are batched, with three.js's per-boat culling and sorting off, and keep their own materials. At the
  Rainbow Bridge that saved 11% of the CPU frame and 13% of the GPU frame, and 19% on the phone proxy.
- **Collisions:** you are a capsule pushed out of each loaded section's colliders through `three-mesh-bvh`. Tree
  grounding and walkers' footing use the same BVHs.

**Measuring:** batch 1 at the Rainbow Bridge's crown (466 people loaded), before and after:

| | before | after |
|---|---|---|
| phone proxy, crown | 25 fps | 43 fps |
| phone proxy, grain wharf | 20 fps | 46 fps |
| GPU memory, phone screen | 179 MB | 98 MB |
| first visit, until you can walk (fast 4G, CPU 4×) | 25.6 s | 9.5 s |
| second visit, until you can walk | 8.7 s | 3.6 s |
| desktop 1080p, high tier, crown | 138–198 fps | 201–233 fps |

The tools:
- `tools/bench_page.mjs`: frame rate, CPU and GPU time, and draw calls on a phone screen.
- `gen/perf/probe.mjs`: section loads, memory, and first visits on a throttled network.
- `?gpumem=1`: counts every GPU allocation.
- `tools/budget_check.mjs`: checks the size budgets.
- The regression script: 211 walks, the boat and ride tests, and the people check, at each tier.

**Next:**
- **In progress:** two-layer shadows, boats batched across sections, and the world cut into cells of about 8 m.
- **After that:** a lighter crowd at a distance, animation files fetched one clip at a time, a smaller window on the
  low tier, and simpler buildings at a distance.

<!--
Sources for the numbers (checked 2026-10-13 ~01:40; the newest record wins where two disagree). Items noted below as
"not yet live" went out with perf batch 2's deploys later that night.

How it was made
- 8 sections, the whole scroll (scan u 815–37610), S4 in two parts: map/index.md; NEXT_SESSION.md "All eight sections".
- 1,982 mapped things + 192 groups (2,174 entries); 811 figures, 92 animals, 224 trees, 146 buildings,
  58 structures, 60 vehicles, 486 props: counted from map/strokes/*.json (kind field).
- 754 figures at spots + 57 walkers = 811 people; 90 animals, 15 with a path: counted from sections/*/people.json.
  NEXT_SESSION.md and the deploy check say "897 painted people (825 figures, 72 walkers)": that count includes the
  animals, and it is 4 lower than people.json today. The two animals not built (S7 pale_shape_1905, S1's pale bird)
  are in map/index.md and NEXT_SESSION.md.
- 34 characters, 3 recolours (child_red, hat_traveller_dark, woman_pale): web/public/assets/chars/characters.json;
  characters/notes.md (recolour variants). 31 made with Meshy = 34 - 3.
- 105 distinct clip names across characters.json; about 90 Text to Motion: 89 distinct "motion" clips in
  characters.json, 91 entries in characters/motions.json, 90 prompts/motion_*.txt.
- 76 carried-prop parts on 25 characters: characters/props.json (gen/props holds 60 prop GLBs).
- 13 animal models of 9 kinds: web/public/assets/animals/animals.json (dark donkey, dark and white horse, long-horned
  ox and buffalo are retoned bodies).
- 34 boats: web/public/assets/<section>/boats.json (S4b 6, S3 11, S2 16, S1 1); 25 land vehicles: the layout.json
  vehicles that aren't boats.
- 52 cards, 12 forms: web/public/assets/trees/trees.json. 223 card trees: gen/expand/round2_progress.md ("223 card
  trees on 52 cards"); the 224th mapped tree is S4b's stump, built from the kit (trees/notes.md).
- 146 buildings, 58 structures: map/strokes; kits: blender/song_kit.py, kit_vehicles.py, kit_boats.py,
  kit_rainbow_bridge.py, kit_<section>.py.
- 107 sounds, 168 files: web/public/assets/sounds/sounds.json; 1.9 MB: du (1,971,117 bytes); also round2_progress.md
  ("168 sound files of 1.9 MB").
- About 100 MB, 1,036 files: du -sb web/public (102,492,611 bytes); the last deploy logged 1005 files, 102.6 MB
  (round2_progress.md ~23:30). 22 MB of HUD tiles: du assets/scroll (22.1 MB); deploy-web skill (410 files, 21.9 MB).
- 4.7 MB before you can walk: gen/perf/batch2/notes.md and live_before/load_slow4g.log (live site after batch 1,
  phone, slow 4G, 67 requests, 4,654 KB over the wire).
- About 61 MB for all eight sections: NEXT_SESSION.md and the deploy-web skill (v1 live check, 242 requests,
  60.8 MB, decoded sizes). round2_progress.md ~23:30 has a newer "39.6 MB for all 8 sections", but check_deploy.mjs
  sums performance resource entries, which stop at 250 by default (gen/perf/batch2/lessons_loading.md), so that load
  was probably cut short. Not used.
- 87 mapping agents (round 2: tiles, structures, rivers, the bridge): round2_progress.md ("87 agents, 79 done, the 8 failures being the S3 units rerun outside it").
- 381 recorded moves: sum of "moves" in sections/*/build_choices.json. S4b far bank 5.5 m: NEXT_SESSION.md.
- 643 adults at child size: round2_progress.md ~20:20. Room to walk (e.g. the gate's lead camel 0.31 m south):
  gen/expand/progress.md.
- 9 retakes: round2_progress.md 19:18 (chase_run, pole_boat and 7 more).
- Eyes, 20 FAIL before, 16 fixed (a recolour inherits its base's fix): gen/details/eyes/notes.md and table.md. Three
  still FAIL: scholar, hat_traveller, hat_traveller_dark. The fixed GLBs were written to web/public/assets/chars at 01:37, not yet deployed.
- Contacts: gen/details/contacts/summary.md and notes.md (measuring only; the fixes have not landed).

Running on any device
- KTX2 393 → 193 MB GPU (three sections; tree cards UASTC, panels, kit and bodies ETC1S): gen/expand/round2_progress.md "engine work" and skill web-scene "Memory".
- Gate GLB 2.0 → 1.5 MB: gen/expand/progress.md Phase 0. Characters 8.6 → 7.9 MB from trimmed clips: same file,
  Phase 2 (not quoted in the prose).
- Second visit 2 network requests instead of 79–92: gen/perf/batch2/loading.md (local, fast 4G, interleaved).
- Fonts and lazy chunks: gen/ui/r2_settings.md; web/src/ui/hud.js, ui/index.js (dynamic import()).
- Opus 24/32 kb/s, fetched on first use: skill sounds; round2_progress.md ~20:35.
- HUD tiles fetched only while open, dropped on close: round2_progress.md "The scroll HUD, done"; deploy-web skill.
- Start screen: web/src/ui/start.js; gen/perf/batch2/notes.md (in the tree, not yet live at the time of writing).
- Small cards 7.4 → 0.77 MB: gen/perf/batch2/loading.md (in the tree, not yet live).
- Content-hashed names: gen/perf/batch2/loading.md, web/vite_asset_hashes.js, web/vercel.json (in the tree, not yet
  live; batch 1's immutable caching of the JS and kit textures is live).
- Slow 4G 76 s → 25 s: gen/perf/proposal.md (76 s, live before batch 1) and gen/perf/batch2/notes.md (25.1 s, live
  after batch 1); both from probe.mjs load, phone screen, CPU 4×.
- Load stalls 1.0–1.25 s → 51–126 ms: round2_progress.md "engine work"; web-scene "Memory".
- Budgets 9 MB / 130k / 330 / 75 MB / window 200 MB: tools/budgets.json (download with kit and cast 28 MB, raised by
  the lead). The riverside window at 198.2 of 200 MB: NEXT_SESSION.md (not quoted in the prose).
- Tiers, MRT, FXAA, 8-bit target, shadow policy, half floats: web/src/tiers.js; gen/perf/batch1/notes.md.
- MRT −29% of the phone proxy's frame (prototype): gen/perf/proposal.md, ranked techniques #2.
- MSAA buffers 37 → 0 MB on a phone: gen/perf/batch1/notes.md memory table.
- Bakes 48 → 16 bytes a bone a frame: gen/perf/batch1/notes.md step 4; web/src/crowd.js.
- Crowd 377 people 23–25 → 232–292 fps, 1,145 → 194 draws: gen/expand/progress.md Phase 0; skill web-scene "the
  batched crowd".
- Culling and empty batches: web/src/crowd.js update(). Posing far people less often (ANIM_LOD in web/src/people.js:
  every frame within 22 m, every 2nd to 50 m, every 4th beyond, every 8th off screen) applies only to the unbatched
  fallback (?batch=0), so the prose leaves it out.
- Boats −11% CPU / −13% GPU at the crown, −19% phone proxy: gen/perf/proposal.md #3 (measured).
- BVH collisions: web/src/player.js (MeshBVH shapecast, MultiBVH); web-scene "Memory" (tree grounding through the
  section BVHs); proposal (walkers' ground probes).
- Before/after table: gen/perf/batch1/notes.md (quiet-machine runs, rep 1; desktop high is rep 1–2). The phone proxy
  "before" was the old page at its 1.5 pixel-ratio cap with 4× MSAA; "after" is the low tier.
- Next: gen/perf/batch2/notes.md and brief.md; NEXT_SESSION.md (crowd LOD past ~20 m, per-clip files, ?window=ahead,
  builder-made building LODs). Two-layer shadows (world.js shadowLayers) and cells (web/src/cells.js,
  tools/cells.mjs; the shipped GLBs are not cut yet) are in the tree but have no recorded results
  (gen/perf/batch2/framerate.md and cells.md don't exist yet), so they are listed as in progress.
-->

## Repository and generated assets

- **Source:** https://github.com/blueif16/qingming: the code, the docs, the skills (`.claude/`), the map, the prompts,
  the scroll scan and everything the live site serves (`web/public/`).
- **Generated assets:** https://huggingface.co/datasets/ranxxx/qingming-assets: what the pipelines produced under
  `gen/` (about 15 GB of images, meshes, motions, Meshy and shyfai task records, cache keys). Git keeps only gen's
  notes, briefs, specs, small data and scripts (`.gitignore`). To get them back into a checkout, run this from the
  repo root:

      hf download ranxxx/qingming-assets --repo-type dataset --local-dir gen

- **Study material:** our notes on the works we studied are here (`reference/messenger_study/*.md`,
  `reference/jiangnan/**/*.md`, `gen/ui/look/*.md`). Their models, code and art stay out of the repo; they belong to
  their makers. The raw font downloads stay out too (`gen/ui/fonts/src/`; `gen/ui/fonts/CHOICE.md` says where each font
  comes from).
- **Thanks:** we studied [Messenger](https://messenger.abeto.co/) by Abeto and 江南百景圖 by Coconut Island Games
  (椰島遊戲) closely as references for art and textures, and learned a great deal from them. Thank you.
- **Setup:** WSL2 drives Blender 5.2 on Windows through `tools/blender_wsl.sh` (set `BLENDER_EXE` for another
  install). Node runs the tools (`npm install` in `tools/` and in `web/`). API keys stay outside the repo:
  `~/.meshy_keys`, `~/.elevenlabs_key`, `~/.shyfai_key`.

## Test page (street B1 slice)

Run `npm run dev` in `qingming/web`, then open **http://127.0.0.1:5180** in Windows. `localhost` times out from Windows because WSL mirrors IPv4 loopback only.

**Contents:** a street built in the style of `gen/v1/target_street_B1.png` (a style test, not a reconstruction target), the porter and the townsman (Meshy, rigged and animated), and a painted willow card.

**Controls:**
- Desktop: click, then WASD, Shift and mouse.
- Phone: two thumbs.
- R: reference view with the B1 overlay.
- H: hide the tuning panel.
- "copy settings" puts your tuned values on the clipboard.

**Rebuild the assets:**
- **Street:** `qingming/blender/street_b1.py`. In the live Blender session: `build(scene)`, then `export(scene, path)`, then `gltf-transform optimize` (meshopt, webp 512).
- **Characters:** `node tools/character.mjs <name> <step>` (see Characters below). It composes `tools/char_pipeline.py` (Meshy), `tools/build_character.mjs` (merges the clips into one GLB) and `gltf-transform optimize`.
- **Meshy account:** `tools/meshy_key.sh [status|retire]`: lists the keys in `~/.meshy_keys` (masked, with credits); `retire` drops the spent first line so the next key is in use.

**Checks:** `tools/check_page.mjs` takes headless screenshots; `tools/check_walk.mjs` runs collision walk tests.

## Gate section page

Open **http://127.0.0.1:5180/gate.html**. It shows the gate section's walkable scene, built from the Song
construction kit (`blender/song_kit.py`), with the six placed figures and tree cards. You can walk up the inner
ramp, along the wall top and into the tower hall. The load-test panel adds walkers, copies of the section, and
stand-in buildings at Messenger's density.

The skill `.claude/skills/web-scene/SKILL.md` governs the scripts:
- `blender/gate_scene.py`: build, then export;
- `tools/export_web_scene.mjs`: optimize and ship;
- `tools/shots_page.mjs` and `tools/walk_page.mjs`: screenshots and walk tests; `tools/film_page.mjs`: a strip of frames over time from one spot (motion, routing);
- `tools/loyalty_check.mjs`: the map vs what the build places, one for one (`map/BUILDING.md`);
- `tools/backdrop.mjs`: the painted panels beyond the scene's edges;
- `tools/make_sundial.mjs`: the sundial the pages show the time with: cuts the painted face (`gen/ui/sundial_face_0.png`, prompt `prompts/ui_sundial.txt`) to `web/public/assets/ui/sundial_face.webp` and writes the twelve branch glyphs from an OFL brush font (`gen/fonts/`) to `web/src/sundial_glyphs.js`;
- `tools/bench_page.mjs` with `tools/win_chrome.sh`: measure on the real GPU;
- `tools/cut_material_sheet.mjs`: cuts a painted material sheet into textures;
- `tools/make_tileable.mjs`, `tools/cut_atlas.mjs`, `tools/join_textures.mjs`, `tools/match_tone.mjs`: seamless
  swatches, painted face atlases, two-half textures and tone matching (skill `web-scene`).

You walk as one of the characters, seen from behind as in Messenger (V for first person, wheel to zoom, the "You"
panel picks your character). The gate's people are its painted figures and nobody else: 63 at their painted spots
with action cycles, and the 14 painted mid-stride or carrying a load walking a short way and back. The riders wait
for their donkeys. The scene holds exactly what the scroll paints, one model per map entity (`map/BUILDING.md`).
Beyond its edges there is mist and a ring of painted panels (`tools/backdrop.mjs`, `web/src/backdrop.js`). Everyone has a body: walkers step
around you or stop for you, and you can't walk through anyone. `sections/gate/people.json` says who does what; `web/src/people.js`
runs it.

See `sections/gate/notes.md` for what's still rough.

## The joined world (S6 + S5 + S4)

Open **http://127.0.0.1:5180/world.html** (`?sections=inner_city,gate,outer_road` is the default; any subset works,
e.g. `?sections=gate` = `gate.html`). The inner city (S6, `sections/inner_city`), the gate (S5) and the first part of
the outer road (S4 u 9400–12600, `sections/outer_road`) share one map frame, so the walls between them come down and you
walk the street from the square well to the courier post. Every painted figure, animal and cart of the three is
there (373 people and animals), each tree on the card of its painted form, painting and mist beyond the outer edges.

- **Builds:** `tools/build_scene.sh <name>` (headless Blender; never touches the live GUI), then
  `node tools/loyalty_check.mjs <S>` and `node tools/export_web_scene.mjs <name>` (textures go once to `assets/tex/`).
- **Checks on the joined world:** `sections/world/` (`walks.json`, `shots.json`, `bench.json`).
- **The record of the expansion:** `gen/expand/progress.md` (and the agents' briefs, needs, lessons and reports there).
- **New pipelines:** animals `node tools/animal.mjs <type> <step>` (`animals/`, `blender/rig_quadruped.py`); carts
  `blender/kit_vehicles.py`; tree cards `node tools/tree_cards.mjs` (`trees/`); clip use `node tools/clips_used.mjs`;
  Meshy accounts `tools/meshy_key.sh status|retire` (keys in `~/.meshy_keys`).

## Characters

Open **http://127.0.0.1:5180/chars.html** to see every character side by side and play any of its clips.

Each character is one figure in the scroll. The skill `.claude/skills/characters/SKILL.md` runs them through
`tools/character.mjs` (figure crop, shyfai turnaround sheet, Meshy mesh, retexture and rig, library and custom actions,
web GLB):
- `characters/<name>.json`: the figure, prompt, height and clips; `characters/motions.json`: custom actions (Meshy Text
  to Motion), with their text in `prompts/motion_<name>.txt`;
- `characters/notes.md`: the cast, runs, credits and what the custom actions are worth;
- `gen/characters/<name>/`: ref, sheet, views, Meshy tasks; `gen/motions/<name>/`: the motion tasks;
- `web/public/assets/chars/`: the web GLBs and `characters.json`;
- `tools/clip_sheet.mjs`: frame sheets of clips on the real GPU; `tools/people_check.mjs`: routines, bodies and routing round the player as PASS/FAIL.

The Messenger environment study is in `reference/messenger_study/world_notes.md`.

## The scroll map (where everything is)

`map/` records every building, wall, road, bridge, water edge, tree, figure, animal, cart and prop of the scroll as
points measured on the strokes, in metres, and in words. Start with `map/index.md`; read `map/text/<S>.md` for a
section. The format and rules are in `map/README.md`; mapping a section is in the skill `scroll-section`.

- `map/strokes/<S>.json`: picture facts (scan px), per entity, with IDs other files refer to.
- `map/frames/<S>.json`: how picture points become metres, with every assumption, check and open question.
- `map/world/<S>.json`, `map/text/<S>.md`: generated by `tools/scroll_map.mjs`; never edited by hand.
- `sections/<name>/layout.json`: the build's positions, from `tools/map_layout.mjs` (the map plus the recorded moves
  in `sections/<name>/build_choices.json`).
- Review images: `gen/map/<S>/` (overlays on the scan, `plan.jpg`); the mapping agents' work in `gen/map/<S>/parts/`.

S5 (the gate) is mapped: 192 entities (2026-10-11).

## Scroll sections (the reconstruction references)

Each section of the scroll is restyled into our art style, with the scroll as ground truth for where everything sits. The skill `.claude/skills/scroll-section/SKILL.md` (at the repo root) describes the whole workflow.

- `sections/<name>/section.json`: the section's scan rect, model, prompts and tile grid.
- `sections/<name>/notes.md`: the section's record (what it covers, runs, review findings).
- `prompts/`: the source of truth for prompt text and the style image (`style_B1.png`).
- `tools/scroll_pipeline.mjs <name> [status|cut|restyle|check|stitch|all]`: the pipeline. Units are cached by prompt, model and input hashes, so after a prompt edit it regenerates only what depends on it.
- `gen/sections/<name>/`: the outputs:
  - `mosaic.jpg`: registered, at 2× the scan;
  - `<unit>_reg.png`: each unit, registered;
  - `check/`: review sheets.

- `reference/scroll/sections.md`: how scholars and the Palace Museum divide the scroll, mapped to scan x. It
  gives our seven-section list and, for the gate, what every figure group is doing.

- Placing figures:
  - `sections/<name>/figures.json` holds each figure's picture position, support, pose, facing and a note.
  - `tools/scroll_inspect.mjs` makes gridded zooms for reading positions.
  - The `figures` pipeline step computes world positions.
  - `tools/overlay_render.mjs` checks a 3D render against the picture.
  - `blender/gate_figures_test.py` is the gate's stand-in placement test.

Sections so far: **gate** (the city gate, scan x 5600–9312, run r3; 6 sample figures placed).

## What's here

- **`gen/v1/`**: the second pass, with Street B as the target look
  - `target_street_B1.png`: **the style reference** (look only; the reconstruction target will be a clip of the actual scroll). It is B edited for Song accuracy with gpt-image-2.
  - `street_B1_nbp_0.png`: the same edit done by nano-banana-pro, for comparison.
  - `characters_B1_compare.png`: both characters redrawn in B1's style.
    - The rows are porter (gpt), porter (nbp), townsman (gpt), townsman (nbp).
    - The single views are `porter_B1_*` and `townsman_B1_*`.
  - `textures/material_sheet_0.png`: six painted materials in B1's style (shyfai image-to-image).
  - **Porter 3D test:**
    - `porter_compare_sheet.png` compares, left to right:
      - multi-view at 30k triangles;
      - multi-view remeshed to 4k;
      - Smart Topology at 4k.
    - `porter_rig_retex_sheet.png` shows Smart Topology before and after the 3-view retexture.
    - **`porter_final_rig/`: the chosen porter** (Smart Topology 4k, then 3-view retexture, then rig). It has 24 bones, plus walk and run clips.
  - `bodies/`: request bodies for the Meshy tasks. Each task folder has a `task.json`.
- **`gen/v0/`**: the first generation pass (Meshy, 2026-10-08)
  - **Start here:** `review_v0.png` puts everything on one sheet.
  - Street references (first-person target frame):
    - `street_A_nano-banana-pro.png`: the proposed target look.
    - `street_B_gpt-image-2.png`
  - `porter_view0-2.png` and `townsman_view0-2.png`: 3-view character sheets (transparent background).
  - `palette_candidates.png`: colours extracted automatically from the street, the characters and the scroll.
  - `prompts/` holds the exact prompts. `tasks/` holds the Meshy task records.
- **`reference/scroll/`**: the scroll itself.
  - `qingming_commons_38414x1800.jpg` is the Wikimedia Commons scan.
  - `overview_part0-3.png` are downscaled quarters; `crop_0-3.png` are full-resolution crops.
  - `candidates/`: four street clips proposed as the first reconstruction target (`candidates_sheet.jpg` shows all four).
    The x ranges in the scan are: A inner-city crossroads 800–6500, B city gate 6000–9700, C outer road 9600–14900, D 虹桥 bridge head 15000–20200.
    The scroll reads right to left: countryside at the right end of the scan, the city at the left.
  - The highest-resolution version is view-only, in the Palace Museum 名画记 viewer:
    https://minghuaji.dpm.org.cn/paint/detail?id=592d80e225aac624977fee2e19452c1f
- **`reference/messenger_study/`**: our teardown of Messenger's characters.
  - **Third-party, for study only. Never use these files in the project or ship them.**
  - `renders/`: the avatars, the NPCs, wireframe close-ups, and Messenger next to the scroll.
  - `design_sheets/`: their published character sheets. These are renders of the 3D models, not drawings.
  - `glb/`: their characters converted to skinned, animated GLBs.
  - `palette_atlas_16x16.png`: their 59-colour palette.
- **`tools/`**
  - `shyfai_image.py`: **all image generation**, text-to-image or `--ref` image-to-image. Run `--help` first.
  - `meshy_task.py`: any Meshy 3D task (image-to-3d, retexture, remesh, rigging, ...). Pass the request body inline or as `@body.json`.
  - `meshy_image.py`: the older Meshy image calls. Superseded by `shyfai_image.py`.
  - `drc2glb.mjs`, `inspect_drc.mjs`: Draco to GLB conversion. Run `npm install` in `tools/` first.
