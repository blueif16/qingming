# look agent log (ink UI round, 2026-10-12)

Owner: look agent. Brief: `gen/ui/brief.md`. Writes only `gen/ui/look/**`, `reference/jiangnan/web/**`, and the `Sky`
class of `web/src/daylight.js` behind `?sky=ink`.

## Log

- 20:58 Downsized the three refs to `ref_small/` (`tools_resize.mjs`, sharp from `tools/node_modules`; no PIL or
  ImageMagick on this machine). `tools_crop.mjs <ref> x y w h out [w]` cuts evidence crops.
- 21:00 **Finding: none of the three screenshots shows an open sky.** The repo copies are byte-identical (md5) to the
  user's originals in `C:\Users\ran\brain-hot\Screenshot 2026-10-12 at 8.38.32/8.38.59/8.39.30 PM.png`. The names
  `jn1_keyart_pink_sky` / `jn2_bridge_ink_sky` and the brief's "pink-sky key art", "ink cloud streaks", "red sun disc"
  were the lead's guesses, not what is in the images. jn1 = countryside with 石橋, a poem (程顥 郊行即事) and seal;
  jn2 = 汴河漕運 canal with a water wheel; jn3 = 虹橋 with crowds. All are top-down isometric views; the "sky" the
  user means can only be (a) the drifting cloud-mist blocks (雲霧) that sweep over the top-left of jn2 and jn3 and carry
  the place title and seal, (b) the mottled paper ground (jn1's sage-green paper has blotchy wash patches), or (c) the
  ink-streaked water. I read it as (a)+(b): soft blocks of white wash with dry-brush edges, over paper that is never
  one flat colour. Recorded as a question for the user; the sky design takes (a)+(b) plus 江南百景图's own key art
  (web study) and Messenger's sky (subagent study).
- 21:02 Subagents started: Messenger sky teardown -> `messenger_sky.md`; 江南百景圖 day/night/seasons web study ->
  `jiangnan_web.md` + `reference/jiangnan/web/`.
- 21:05 Palette: `tools_palette.mjs` (k-means in Lab, 16 clusters per image, plus the named regions in
  `palette_regions.json`, picked on gridded zooms made with `tools_grid.mjs`) and `tools_pigments.mjs` (Lab filters
  per pigment) -> `palette.json`, `crops/palette_swatches.png`. Our palette in Lab is in `jiangnan_look.md` §4.
- 21:10 Baseline sky shots `sky_shots/base/` (spots `sky_spots.json`: bridge crown for the sun hours, threshing floor
  for day, the inner-city street). The first countryside spot (290, 8.5) put the camera in a shed.
- 21:12 **daylight.js edits (shared file; re-read before each; surgical; listed here):**
  1. the `Sky` class comment gained one line about `?sky=ink`;
  2. the constructor's first line: `if (Sky.INK) { this.inkInit(radius); return; }`;
  3. `set()`'s first line: `if (this.ink) { this.inkSet(light, camera); return; }`;
  4. new members at the end of the class: `static INK`, `static INK_COLORS`, `static inkNoise()`, `inkInit()`,
     `inkSet()`.
  Nothing outside the class changed. With no flag the old code runs line for line (base shots before and after match).
- 21:15 ink v1: the cloud plane gave converging spikes in street views. v2 samples the noise on the compass circle
  and up the elevation, so the bands are horizontal everywhere. v3 has fewer blocks (cover 0.38), lighter contours
  (0.32) and a vermilion disc from low = 0.05. v1 shots deleted; v2 and v3 kept.
- 21:18 GL warning "glGetProgramiv: Program object expected" showed in some ink-mode shot runs. A trace of every
  program-taking WebGL call on deleted programs (`tools_gltrace.mjs`) found 0, and console runs without screenshots
  found 0. It is likely Chrome-internal during streaming plus screenshots. Left open; watch it in default runs.
- 21:20 Subagent reports in: `messenger_sky.md` (two flat noise-cut tones, an ink contour via the outline pass, no
  time of day, 74 KB noise KTX2) and `jiangnan_web.md` (no day/night in the cities; key art has blush washes, a
  flat vermilion disc, and night as indigo/plum bands with gold specks; titles in clouds may be the uploader's edit).
- 21:20 Found: a pale vertical column in the sky with **either** sky (default too), looking along the scroll. It is
  post.js mist on sky pixels at the far plane (inside the backdrop ellipse, outside the walkable area). Fix belongs
  to post.js's owner: no mist where depth == 1. Recorded in `sky_design.md` and `compatibility.md`.
- 21:22 Concept frames: clean captures with the HUD hidden (`tools_capture.mjs`, `concept_spots*.json`) ->
  `concepts/src/`. Picked street_spawn, bridge_west_a and country_willows. Prompts are in `concepts/*_A.txt` and
  `*_B.txt`; batch in `concepts/jobs.jsonl`; run with
  `python3 -I tools/shyfai_image.py --batch gen/ui/look/concepts/jobs.jsonl --jobs 3 --size 1536x864`
  (gpt-image-2.5, 6/6 ok, about 40 s each). Refs: the screenshot, then jn2 (street), jn3 (bridge) or jn1
  (countryside).
- 21:25 Sky microbench (`tools_skybench.mjs` -> `perf/skybench.json`): ink equals default within ±0.03 ms at 4K
  (bandwidth-bound); phone size is at the timer's noise floor. Noise tile 30 ms once at 4× throttle.
- 21:30 Whole-page A/B at phone 390×844×3, touch, 4× throttle, alternating loads (`tools_skyab.mjs` ->
  `perf/skyab_phone4x.json`). It ran while the perf session's run_rest bench was using another slot (noisier). The
  default numbers agree with `gen/perf/phone_4x` (crown 11 fps / 92 ms CPU here, 12.4 / 79 there).
- 21:40 A/B done: within noise at a phone viewport under 4× throttle (`sky_design.md` table). The sky is free at
  the scale we can measure.
- 21:42 **The default path is proven unchanged:** removing my 3 inserted lines and the appended member block from
  daylight.js gives md5 `c77773aac993196e3823d08442f2f0c2`, the file's md5 before my first edit.
- 21:45 Wrote `jiangnan_look.md`, `sky_design.md` and `compatibility.md` (matrix, ranking, true colours, concept
  differences, questions). `messenger_sky.md` and `jiangnan_web.md` came from the subagents and were reviewed.
  Comparison sheet: `sky_shots/compare_default_vs_ink.jpg`.

## State for a successor

- Done: all five deliverables. The ink sky is behind `?sky=ink` (v3). Shots are in `sky_shots/`, perf in `perf/`,
  concepts in `concepts/`.
- Open:
  - the user's answers (`compatibility.md` §7);
  - the post.js sky-mist column and the panel sky seams belong to their owners;
  - before making the ink sky the default, move the 30 ms noise build to idle time.
- Tools here (study scripts, none ship): `tools_resize`, `tools_crop`, `tools_grid`, `tools_sheet`, `tools_pairs`,
  `tools_palette`, `tools_pigments`, `tools_capture`, `tools_console`, `tools_gltrace`, `tools_skybench` and
  `tools_skyab` (`.mjs`). Run Chrome ones through `tools/chrome_slot.sh`.

## Round 2 (lead's message, 21:45): the chat images are the sky references

- The lead saved the user's three pasted images as `reference/jiangnan/jn4_keyart_pink_wash_red_sun.png`,
  `jn5_bridge_poem_ink_streak_sky.png` and `jn6_ingame_isometric_town.png`; the two sets are explained in
  `reference/jiangnan/README.md`.
- **jn5 sampled** (`tools_sample.mjs`, `sky_regions*.json`): two tones, paper L 84–85 `#dbd3c0` and strokes L 79–80
  `#cfc2af`; bimodal (hard cut); no contour; level combed strokes; dense high, blank above the horizon; mountains
  `#c9c5b9`.
- **jn4 sampled:** pink washes `#f9d2c5` (L 87, soft, continuous L 85–96); sun `#f09b6a`–`#f1a173` with blooms; paper
  `#fbf6e3`.
- Crops: `crops/jn5_*`, `crops/jn4_*`, `crops/jn6_xiangyun.png`, `crops/plaques_jn1_jn3.jpg`.
- **jiangnan_look.md:** §0 rewritten (two sets), §9 now the jn5/jn4 sky, §10 the place-name language for the ui
  agent, §12 updated. Correction: the plaque is **掃墓歸來**, not 楊柳歸來 (the type agent's notes have the old
  reading).
- **daylight.js v4** (my own ink block replaced as a unit; the default lines untouched; md5 check repeated, still
  `c77773aa…`):
  - jn5-style two-tone combed strokes, no contour, as a deeper wash of the hour's sky;
  - wet pink strokes and a bloomed vermilion disc at a low sun;
  - darker ink streaks at night;
  - the noise tile built in idle time (`requestIdleCallback`), with a 1×1 empty tile until then.
  v4.1 makes the strokes blockier and less grey (desat 0.3, dark 0.88, tilt 0.25, octaves 58/42).
- **Re-measured:** `perf/skybench_v4.json` (4K ±0.05 ms; `inkInit` 1.7 ms at 4×; noise 26.6 ms in idle time) and
  `perf/skyab_phone4x_v4.json` (whole page, phone 4×). The microbench now installs the real tile itself.
- **Sheets:** `sky_shots/jn5_jn4_vs_ink_v4.jpg` (made by `tools_vs.mjs` with `sky_vs_rows.json`) and
  `sky_shots/compare_default_vs_ink.jpg` (default against v4). `tools_pairs.mjs` now reads .png or .jpg.
- **compatibility.md:** §1, matrix row E, rank 1, §4 (jn5's sky *is* cream paper), §6 (place names, plaque
  correction) and §7 question 1 (true blue or jn5's cream) are updated.
