**Merged into web-scene "The atomic scripts" (Scroll index, Scroll tiles, Scroll HUD) and "The scroll HUD", and
scroll-section playbook steps 4 and 5, 2026-10-12** (records agent; checked by the round-2 records agent).

# The scroll HUD: lessons (HUD agent, 2026-10-12)

The user: "whenever we press the space key, it will show a HUD ... In the middle of the screen, everything, the
graphics, will be hidden or masked somehow. The middle is going to show our current position in the original painting
... We can draw the box or whatever circle on the map, including what people are surrounding us and where they are in
the original scroll ... the top-right settings will also only appear during the space button."

## What was built

| Piece | File | What it does |
|---|---|---|
| Projection | `web/src/scroll_projection.js` | Ground metres (X east, D north, H up = the page's x, −z, y) → scan pixels of `reference/scroll/qingming_commons_38414x1800.jpg`, with the map's own frames: `u = ou + ax·X + dx(u)·D`, `v = ov + ay·X + dy·D − h·H`. `dx` drifts along u, so u is solved **exactly, piece by piece** (each knot interval is linear in u); a fixed-point iteration (what `scroll_map.mjs toScan` does) diverges where the drift is steep (S5, u 7800–8250: \|dx′·D\| > 1 for D > 17 m). Inside the silk the forward map never folds (checked: the slopes would need D > 224 m, or D < −17 m in S5). `ScrollProjection` holds every built section's frames and painted range; a point belongs to the section whose range its projection falls in (the frames agree on the seams). `heading()` maps a ground direction by projecting a 1.5 m step. Pure JS: Node tools import it too. |
| Tiles | `tools/scroll_tiles.mjs` → `web/public/assets/scroll/` | The scan as a webp pyramid: 512 px tiles at 1/1, 1/2, 1/4, 1/8 (`<level>/<col>_<row>.webp`), a 2731 × 128 whole-scroll strip, `tiles.json` (sizes, levels, credit). The painting as it is, no tone change. Quality 70 (65–78 look the same at 2×; 78 costs +18%). |
| Index | `tools/scroll_index.mjs <S>\|all` → `web/public/assets/<folder>/scroll_index.json`, `web/public/assets/scroll/sections.json` | Per map ID (figures, animals, vehicles, buildings, structures): the painted box `b` [u0, v0, u1, v1], foot `f`, head `h` in scan px, name `n`, a short `what` `w`. Boxes come from the measured points: a figure's foot→head with a width by pose (0.42 × height standing, 0.62 seated/squatting, 0.5 carrying/riding); an animal's hooves and head, its rump behind the hind hooves by its model from `people.json` (ox 0.45 hoof span, camel and horse 0.4, donkey and mule 0.2, pig and dog 0.25, bird 0.1; 0.9 when the name says it is seen from behind), its back at min(max(1.2 × the head's height, 1.65 spans), the head + 0.45 span), fitted on the QA's nine measured animals; a lying figure from the head to as far past its foot point (mid-body), or the standing box when it is drawn more upright than flat; a cart's ends and wheels plus 140 px of load; a building's corners and heights. Labels never carry numbers: a cited map ID or slug becomes the thing's name, parentheticals with numbers go, and the text stops at the first clause that still has one (`S5.ani.black_animal_7495`: "A dark-coated quadruped…"). It **checks the projection** on every run: each figure's and animal's layout position projected back with `scroll_projection.js` must land within 2 px of its stroke, or it exits 1. It also rewrites `assets/scroll/sections.json`: every section of `map/sections.json` with a folder that is exported (`assets/<folder>/layout.json`) and indexed, with its name, painted range, frames and the support heights its frame file lists. Keys may carry a letter (`S4b`): ID patterns are `S\d[a-z]?\.`. |
| Export hook | `tools/export_web_scene.mjs` (4 lines after the data copy) | Runs `scroll_index.mjs` for the section whose folder it ships, so a new section shows on the painting with no extra step. |
| HUD | `web/src/scroll_hud.js` | Space (or a scroll button top-right on touch screens) opens it: the street is masked (a blur and a paper-to-umber vignette over the frozen last frame) and the page stops drawing (`world.js` tick returns while it is open). The middle is a mounted window on the painting centred on your scan point: you as a cinnabar ring with a soft wedge for where the camera looks; every painted person and animal within 15 m boxed on their painted figure (square corner brackets for people, rounded for animals, fading from 5 m to 15 m); a walker (people.js `agentOf`) also shows a dot where they are now and a dashed line back to their painted foot. Hover (tap on touch) names it (name + short what); wheel or pinch zooms about the pointer, drag pans, the ring button or a double-click snaps back to you. Bottom: the whole-scroll strip, the built range clear and the rest veiled, the window's extent outlined, a cinnabar dot where you are; click or drag on it to look elsewhere. Credit line "Palace Museum, via Wikimedia Commons". The title tab names the section ("城门 · the city gate"). No numbers anywhere. |
| Page hooks | `web/src/world.js` (5 small edits) | The import; `const hud = new ScrollHud({ sections, player, gui, canvas, getPeople })` after the panel; the H line removed (the HUD owns H); the help line says Space; `if (hud.open) { stream.lastTick = 0; requestAnimationFrame(tick); return; }` at the top of `tick` (lastTick reset so the engine's stall stats don't count the pause); `hud` in `window.__test`. `settings.js` is untouched (`gui.hide()/show()` from the HUD). |

**Choices:**
- **H:** the settings panel is hidden while you walk and shows only in the HUD; H hides and shows it there and does
  nothing outside (with the HUD shut it would have put the panel over the street, against the ask). Below 1500 px the
  panel opens folded to its title bar so it clears the painting.
- **Facing wedge:** the camera's look direction (`player.yaw`), what you saw before pressing Space; in third person
  the avatar may face where it last walked.
- **Your height is the map's, not the build's:** the walker's built floor height minus the offset the still painted
  figures standing within 8 m on the same level (±0.3 m) show between their built floor and their map H (median of
  the nearest five); with nobody near, a rise under 0.8 m counts as ground. The build raises some ground the map takes
  as level (`outer_road_scene.py` `FORECOURT = 0.6`, a choice; the map: "taken as ground"), and the raw height put the
  ring 38 px north there (QA, round 1). The result is then snapped to the nearest support height the section's frame
  lists (0, the office floor 0.35, the tower floor 12.1, ...) when within 0.25 m (QA round 2 found 0.17 m left in the
  gate passage, 13 px). Now every ring is at the map's height to the pixel: the passage v 1353 (H 0), the courier post
  forecourt (built 0.5–0.63) H 0, in front of it H 0, the gate tower floor H 12.1. Walkers' live dots use the same.
- **Radius 15 m** (the low end of the ask): at 18 m the inner city boxed 79–152 people and the painting disappeared
  under brackets. With fading, 15 m still boxes 24–118 at the six landmarks. A walker counts by the nearer of where he
  is now and his painted spot (from `layout.json`), so one who has wandered off keeps the box on his painted figure.
  A child carried by someone (people.json `carried_by`; no person of its own) is boxed with its carrier.
- **Zoom:** every opening starts on you at the readable zoom (frame height / 900 css px per scan px, 0.35–0.9: painted
  people about 60–110 px tall); zoom and pan are not kept between openings.
- **Pointer:** opening releases the pointer lock, and a lock granted after opening (a click just before Space) is
  given back at once (found by the interaction test: the mouse stayed captured by the 3D canvas). Closing with Space
  re-takes the lock (Space is a user gesture); Esc is not, so after Esc you click to walk, as before.
- **Space is free for walking:** nothing bound it before (`player.js` has no jump; grep of `web/src` for Space). The
  HUD's listener runs in the capture phase and takes only Space, Esc (when open) and H (when open); it ignores Space
  in text fields and prevents its default so a focused button is never "clicked".
- **Wheel and touches over the HUD stop there:** the page's wheel listener (third-person camera distance) had been
  changing the camera behind the HUD (found by the interaction test).

## Projection residuals

Every mapped ground point's world position (`map/world/<S>.json`) projected back to the scan against its stroke
point, and every layout figure and animal through the joined projection (all three sections loaded, section picked by
painted range, as the page does):

| Section | ground points (H 0) | supported points (H ≠ 0) | layout figures, joined |
|---|---|---|---|
| S6 inner city | 469: median 0.26, max 0.69 px | 21: median 0.25, max 0.57 px | 188: median 0.26, max 0.68 px |
| S5 gate | 265: median 0.24, max 0.64 px | 44: median 0.25, max 0.57 px | 93: median 0.23, max 0.57 px |
| S4 outer road | 364: median 0.25, max 0.55 px | 5: median 0.18, max 0.25 px | 80: median 0.25, max 0.55 px |

The residue is the world files' rounding to 0.01 m (0.77 px of u, 0.5 px of v). No entity resolved to a neighbour's
frame. Supported points include the S6 cart beds (0.75, 1.45 m), upper floors (3.4, 4.5 m), table tops and the S5
tower floor (12.1 m) and terrace (10 m). Scripts: `scratchpad/hud/residuals.mjs`, `joined.mjs`; the same check now
runs inside `scroll_index.mjs` on every section.

## Tile sizes

| Level | Size | Tiles | On disk |
|---|---|---|---|
| 0 (1/1) | 38414 × 1800 | 76 × 4 = 304 | 18.45 MB |
| 1 (1/2) | 19207 × 900 | 38 × 2 = 76 | 2.74 MB |
| 2 (1/4) | 9604 × 450 | 19 | 0.52 MB |
| 3 (1/8) | 4802 × 225 | 10 | 0.11 MB |
| strip | 2731 × 128 | 1 | 31 kB |
| **total** | | 410 files | **21.85 MB** |

Indexes: inner city 55 kB, gate 26 kB, outer road 27 kB; `sections.json` 1 kB. A view at the default zoom loads 6–15
level-0 tiles (about 0.4–1 MB); nothing is fetched until the HUD first opens. The Vite build grows from about 26 MB to
48 MB (535 files) with the pyramid; only what a viewer opens is downloaded.

## Checks

- **Interaction** (`tools/hud_interact.mjs` (moved from the scratchpad), real GPU Chrome, real key presses): 25/25 PASS. Panel hidden
  while walking, H shut does nothing; Space opens, panel shows, pointer released, no walking while open; H hides and
  shows the panel in the HUD; hovering the storyteller's box names him; no digits in tooltips; wheel zooms in (0.56 →
  2.2) and out to the 1/8 tiles, without touching the camera distance; drag pans; the ring button snaps back to 0 px;
  Esc closes (0 bitmaps left), panel hidden again; Space reopens and closes; walking resumes (0.5 m in 0.6 s).
  Phone (390 × 844, touch, dpr 3): the scroll button shows, opens the HUD, the HUD fits the width (no horizontal
  scroll), a tap names a figure, the close button closes.
- **Download and memory:** no `assets/scroll/` or `scroll_index` request before the HUD opens. Open → close at six
  spots: JS heap within ±1 MB of where it was (22.4 → 22.8 MB etc., GC'd), DOM nodes back to the same count (+14 open),
  0 live bitmaps after close (6–15 tiles while open, at most 40 kept); the canvases are set to 0 × 0 on close. The HUD
  uses no WebGL.
- **No console errors, no 4xx/5xx or failed requests** in the shot and interaction runs; `tools/check_deploy.mjs` on
  the dev page PASS; `vite build` clean.
- **Walks** (`sections/world/walks.json`): 41/42 with `?window=all`; the one fail is the S6 south-edge walk ending at
  X −71.9 against [−72.9, −71.9] (a hair outside; it passes on other runs). With the default streaming window, the S4
  walks fail because `tools/walk_page.mjs` teleports without `__test.goto()`, so their section isn't loaded (the walker
  falls and resets): for the engine agent, not the HUD (the HUD changes nothing while shut).
- **Shots** (`scratchpad/hud/shots_r6/`, after the QA fixes; round 1 was `shots_r3/`, round 2 `shots_r5/`; height spots `shots_post2/`; `<spot>.png`, `<spot>_close.png` at zoom 1.15, `<spot>_world.png`,
  `drawn.json`): the square well, the storyteller's ring, the gate passage, the moat bridge deck, the courier post and
  the fortune-teller; laptop size `shots_laptop/`; phone `interact_r2/phone_*.png`.
- **Independent QA, round 1** (a general-purpose agent, read-only; it cut its own scan crops at each shot's centre and
  zoom and found the painting under the HUD matches them exactly): rings right at 5 of 6 spots (the well: 1.3 m in
  front of the curb's middle; the ring: just south of the front row of listeners; the passage: 49% of the way
  through, inside the block; the bridge: the deck's centre to the pixel; the fortune-teller: 2 m south of his foot);
  the courier post 38 px north (the build's raised forecourt, above). Boxes: 140 of 146 checked right; doubtful were
  big animals (the ox's rump and back, the horse seen from behind, the camel's hump, the black animal's back) and the
  lying soldier (his foot point is mid-body). It also found: walkers who had wandered more than 15 m lost their box
  (`dPainted` could never be under `dNow`), carried children were never boxed, and the first opening's zoom was 0.56
  instead of 0.62 (a bare strip canvas is 300 × 150 and squeezed the frame until drawn). All fixed: animal boxes reach
  0.65 of the hoof span behind the hind hooves and rise to max(1.45 × the head's height, 1.3 spans), capped at the
  head + half a span; lying figures run from the head to as far past the foot point; the frame never shrinks.
- **Independent QA, round 2** (`shots_r5`): all six rings right except 13 px at the gate passage (0.17 m of built
  height left: fixed by the support snap); walkers, carried children and the zoom fixed; no painted person or animal
  within 15 m unboxed at any spot (checked in world coordinates). The 0.65-span rump suited only the lead ox and the
  horse seen from behind: seven side-view animals ran 30–70 px past the tail, because most hind points were measured
  right under the rump. Its measurements gave the rump by species (oxen 0.33–0.75 span, camels 0.39, donkeys
  0.09–0.35, the horse from behind 0.89) and the back heights; the refit puts all nine within about 35 px (most within
  20). A first try matched "from the rear" in "second camel from the rear" (its place in the caravan): the test reads
  the name only.
- **Independent QA, round 3** (`shots_r6`, `scratchpad/hud/qa/r6/`): **PASS.** All six rings within 0.2 px of the
  map's H 0 for their X, D (worked out independently from `map/frames/<S>.json`); the painting under the HUD matches
  its own scan crops in all 12 canvases; no painted person or animal within 15 m unboxed; all 22 animal boxes on the
  right animal (16 checked against the painting: tight fits, one tail maybe 5 px clipped, the far ox 40 px loose past
  its muzzle, faded); both lying figures fit. Figure boxes unchanged from round 1's 140/146 right (the six doubtful
  ones were the animals and the lying soldier, now fixed).

## Pitfalls

- **Vite's dev server loses new public folders that are deleted and re-created.** The first tile run removed
  `assets/scroll/` and wrote it again; the running server then served `index.html` for every tile but the first (its
  public-file list is kept by the watcher). Moving the folder out and back made it rescan; `scroll_tiles.mjs` now
  overwrites in place and deletes only stale files. Never `rm -rf` a folder under `web/public/` while the dev server
  runs; never restart the user's server for it.
- **The dev page reloads under long tests** whenever another agent saves a file in `web/src`; a test that dies with
  "Execution context was destroyed" or a sudden `__test` of undefined just reruns.
- **Leaked pages slow the bench Chrome:** a crashed Playwright script leaves its `world.html` page rendering uncapped
  (vsync off). Five of mine piled up; the scripts now close their pages on any crash. Check
  `curl -s 127.0.0.1:9223/json/list` after a crash.
- **Build heights are not map heights.** Builders raise ground as a choice (a forecourt, a plinth) that the map takes
  as level; anything projected onto the painting must use the map's H. The still figures around a point carry both
  (their built floor and their layout H), which makes the correction local and free.
- **A bare canvas is 300 × 150.** With `width: 100%` and auto height it is half as tall as wide until drawn: in a
  flex column it squeezed the painting's frame on the first opening. Give canvases a CSS height from the start and
  `flex-shrink: 0` to the main panel.
- **Hit tests in a crowd:** the smallest box under the pointer was usually a neighbour's (the storyteller's box centre
  lies on a listener's box); the HUD picks the box whose centre is nearest for its size.

## Proposed skill text

### `web-scene`, the atomic scripts table (new rows)

| Scroll index | `node tools/scroll_index.mjs <S>\|all` | Where the section's painted figures are on the original painting, for the scroll HUD: `web/public/assets/<folder>/scroll_index.json` (per map ID the painted box, foot and head in scan px, a name and a short what, never a number) and `web/public/assets/scroll/sections.json` (every exported section of `map/sections.json` with its painted range and frames). `export_web_scene.mjs` runs it, so a shipped section is on the painting with no extra step. It also checks the projection: every figure's and animal's layout position projected onto the scan with `web/src/scroll_projection.js` must land within 2 px of its stroke (exit 1 otherwise: rerun `map_layout.mjs <S>` after a frame change). |
| Scroll tiles | `node tools/scroll_tiles.mjs [--quality 70]` | The scan as a webp tile pyramid for the HUD (`web/public/assets/scroll/`: 512 px tiles at 1/1–1/8, a whole-scroll strip, `tiles.json`; 410 files, 21.9 MB). Once for the whole scroll; rerun only if the scan changes. Overwrites in place: never delete the folder under a running dev server. |
| Scroll HUD | `web/src/scroll_hud.js`, `web/src/scroll_projection.js` | Space (a scroll button on touch screens) masks the street and shows the original painting centred on your scan point: you (ring and look wedge), the painted people and animals within 15 m boxed by map ID, walkers' live dots, hover or tap to name, wheel/drag/snap, the whole-scroll strip, the settings panel (only here; H hides it). Loads tiles only while open and drops them on close; the page stops drawing meanwhile. Needs from a page: the live `sections` map (`{ layout.section, persons[] with .id = slug }`), `player`, the lil-gui panel, the canvas, `people.agentOf`. Test: `window.__test.hud` (`show()`, `hide()`, `stats()`, `you()`, `drawn`). |

### `web-scene`, "A run", after step 4

> 4b. `export_web_scene.mjs` prints the section's scroll index line: its entry count and the projection check's max
> (under 1 px when the layout is current). Open `world.html`, press Space at a landmark of the section and see that
> the ring sits on the painted spot and the boxes on the painted people.

### `web-scene`, the World page row (add)

> The tuning panel shows only in the scroll HUD (Space; H hides it there). The page's `tick` returns at once while the
> HUD is open.

### `scroll-section`, the playbook, step 4 (Area agents, Run 2), add to the checks

> ... `loyalty_check` PASS; the scroll index (`export_web_scene.mjs` runs `scroll_index.mjs <S>`: projection max under
> 2 px, no labels with digits); checks alone ...

### `scroll-section`, the playbook, step 5 (the lead joins), add

> ... shots across the seams, and HUD shots at the section's landmarks (`window.__test.hud.show()` after
> `__test.goto(X, D)`): an independent QA agent compares each with the scroll (ring on the painted spot, boxes on the
> painted figures) ...

### `scroll-section`, "Mapping a section", step 6 (Build from it), add

> A section key may carry a letter (`S4b`); every tool matches IDs with `S\d[a-z]?\.` and takes the section list from
> `map/sections.json` (keys with a `folder`), never from a fixed list.

## Open questions

- **Deploy size:** the pyramid adds 21.9 MB and 411 files to the build (only what a viewer opens is downloaded). If the
  deploy should stay small, level 0 could be limited to the built range plus a margin (about 30% of the scroll) and
  filled in as sections are added; the tool would take `--range`.
- **Your ring when the build's floor differs from the map's support:** the ring uses the walker's floor height, so a
  plinth or bank built higher or lower than mapped moves it by 77 px per metre. None seen at the six landmarks.
- **Boxes for carts and buildings:** indexed but not drawn; the HUD could name the building you stand in or beside
  (hover on a faint footprint). Not asked for yet.
- **Rendering while open:** paused. If the user wants the walkers behind the mask to keep moving, render at 2–4 fps
  instead (one line in the tick hook).
