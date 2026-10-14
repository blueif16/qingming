# 清明上河图 web world

A first-person, walkable 清明上河图 that runs smoothly in a browser, including on phones. The quality bar is
Messenger (https://messenger.abeto.co/). Blender setup and the MCP bridge come from the parent `3d_director/CLAUDE.md`
in the local checkout (this repo calls Blender through its own `tools/blender_wsl.sh`). `README.md` maps the folders,
the GitHub repo and the generated-asset dataset.

- **Look matters here.** The root previz rules (flat gray, placement only) don't apply.
- **Messenger's rules are the target spec:**
  - about 1.5–4k triangles per character on one shared 22-bone skeleton;
  - sprite faces;
  - every colour from one palette atlas;
  - outlines where surface IDs change;
  - one signature activity pose per character.
- **Environment construction follows Messenger's world** (`reference/messenger_study/world_notes.md`):
  - never a plain box;
  - large faces stay flat, and the triangles go into edge thickness, trims, framed openings, broken ground and
    props at building bases;
  - surfaces are split where ink lines should fall;
  - about 38 triangles/m² at full detail, with lower detail levels by distance.
- **Web scenes** follow the skill `web-scene`: Blender builder (headless: `tools/build_scene.sh <name>`),
  `tools/export_web_scene.mjs`, the page, then `tools/bench_page.mjs` on the real GPU. Built sections share one map
  frame and join on `web/world.html?sections=…`; new sections follow the playbook in the skill `scroll-section`.
- **Characters** follow the skill `characters`: every character is one scroll figure, run through `tools/character.mjs`.
  Actions come from Meshy's library or from Meshy Text to Motion (prime mode only). What people do in a section is
  data in `sections/<name>/people.json`, run by `web/src/people.js`.
- **3D generation** goes through hosted Meshy/Tripo only (`MESHY_API_KEY` is the first line of `~/.meshy_keys`; `tools/meshy_key.sh retire` drops a spent key; a Meshy task belongs to the account that made it, so switch between characters, never in the middle of one). The conversion of their
  output to Messenger's spec is the crux of the project.
- **Work in small steps:** 1–2 archetypes plus one first-person street frame, working end to end, before
  anything scales.
- **`reference/messenger_study/` is third-party and study-only.** Never copy from it into project assets
  or builds.
- **Sound** follows the skill `sounds` (spec `sounds/<set>.json` → `tools/eleven.mjs` → `sound_check.mjs` → `sound_cut.mjs` →
  `sound_page.mjs`). ElevenLabs key: first line of `~/.elevenlabs_key` (free tier: non-commercial, credit elevenlabs.io).
  Its sound effects are approved; its Chinese voices are not (another provider later).
- **Video shots** follow the skill `film`. Agents make them through CLIs; nobody records a screen. The steps: a spec
  `shots/<name>.json` (places from `tools/film_places.mjs`), then `tools/film_shot.mjs` (check → preview → final), then
  `gen/films/<name>/` (MP4, ProRes or PNG, plus the camera of every frame). The page is stepped a frame at a time on a
  film clock (`web/src/film.js`), so no frame drops. In the game, the 鳥瞰 view (C, `web/src/birdseye.js`) is its live kin.
- **Interactions** (`web/src/interact.js`, data `web/public/assets/interact.json`, records `gen/interact/`): the gate
  tower's drum you beat (birds burst from the crowns: ambient.js `startle`; leaves shiver: wind.js `shake`), glowing
  viewpoint spots where E starts a 鳥瞰-style circle (birdseye.js `vista`; never a trigger underfoot, replay any time),
  and joining the painted people's poses (the moat and Rainbow Bridge rails, the storyteller's ring). Each one, done the
  first time, stamps its seal into the 圖志's 印譜 leaf (`prefs.discovered` `x:<key>`; no count, STYLE.md §9). The near
  talk always wins E. On by default since the user's sign-off (2026-10-13); `?interact=0` turns it off
  (interact.js `DEFAULT_ON`).
- **Meshy deletes API outputs after 3 days.** Download results into `gen/` right away.
- **Blender export:** `export_scene.gltf` exports every scene in the .blend unless you pass `use_active_scene=True`.
  The live .blend holds `messenger_study`, and once that leaked into a GLB. `blender/street_b1.py:export` sets this.
- **Foliage:** AI 3D generators turn willow strands into slabs, so a tree is never one generated mesh. Near you it is
  3D (`web/src/trees3d.js`: Meshy trunks for the gnarled forms, wood from the card's strokes for thin ones, a crown of
  painted clumps); its painted alpha card (from shyfai images) is the far level. Meshy for bodies and solid props.
  On by default since the user's sign-off (2026-10-13); `?trees=cards` shows the cards alone.
- **The scroll map** (`map/`; format and rules in `map/README.md`): every building, tree, figure, animal and prop,
  measured from the strokes. Read `map/text/<S>.md` to know where things are; don't re-read the scroll for that.
  Scenes, `people.json` and tests take positions only from `sections/<name>/layout.json` (`tools/map_layout.mjs`);
  never place anything by eye. Departures from the map go in `sections/<name>/build_choices.json` with a reason, and
  builder-chosen sizes are marked `choice:` in the builder. Mapping a new section: skill `scroll-section`.
- **Loyalty** (`map/BUILDING.md`): a scene holds one model for each thing the map lists and nothing else: no filler
  props, extra walls, grass tufts or invented crowds. All painted figures, no invented traffic. Where nothing is
  painted, invisible edge walls close the walkable area and the page shows painting beyond them (mist, painted
  panels of the neighbouring sections). The builder tags every piece with its map ID, and `tools/loyalty_check.mjs`
  must PASS before a scene is shown.
- **Scroll sections:** the scroll is the ground truth for positions, and B1 (`prompts/style_B1.png`) sets the painting
  style. Colours are the real town's, not the scroll's aged-silk yellow: `web/src/palette.js` and `web/src/daylight.js`.
  The world's hour is the viewer's local clock (each visit starts there), and the time shows only as the time instrument
  (晝夜卷 + 時牌, `web/src/ui/time.js`; drag it to set the hour, 歸今 returns),
  never as numbers.
  Every section goes through `tools/scroll_pipeline.mjs` (skill: `scroll-section`). Prompts live in
  `prompts/`. Keep the current prompts until the user changes them. After a change, rerun the pipeline,
  which regenerates only the stale units.
