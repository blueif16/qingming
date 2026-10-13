# 清明上河图 web world

A walkable 清明上河图 in the browser. The quality bar is https://messenger.abeto.co/.

**Picking up the work:** `NEXT_SESSION.md` holds the current state, the user's latest asks and a prompt to start the next session with.

**Live:** https://qingming-delta.vercel.app (the joined world). `tools/deploy_web.sh` builds, checks and redeploys it; skill `.claude/skills/deploy-web/SKILL.md`.

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
