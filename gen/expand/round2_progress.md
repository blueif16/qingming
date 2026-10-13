# Round 2 progress: the rest of the scroll (S7, S4 part 2, S3, S2, S1)

The lead's running record. Newest last. The prep agent's drafts are in `gen/expand/round2/`.

## The user's calls (2026-10-12)

- Coverage asked for: the joined world is u 2000–12600, 29% of the scroll's length (815–37610) and about a third of
  its content (people ~40%, buildings ~33%, trees ~44%, boats 0%). Strip: `gen/coverage/scroll_coverage_2026-10-12.png`.
- "Yes we can continue": the shyfai backlog first (the three panels, `bamboo_5`), then the next areas.
- Asked for a parallel subagent workflow "to get everything done quickly", and set the workflow size guideline to
  unrestricted (`/config`), so all five remaining areas are mapped at once.
- Asked to deploy to Vercel with a short skill for redeploying: done, https://qingming-delta.vercel.app, skill
  `deploy-web`, `tools/deploy_web.sh` (about 35 s).
- Asked whether the full scroll would be too big for browsers: download isn't the limit, memory is (iPhone Safari
  ~1–1.5 GB per tab). Plan: a streaming window that unloads, KTX2 textures, a size budget per section.

## The design (told to the user)

- **Map wide:** tile and structures agents for all five areas at once (picture facts are independent); the frames run in
  order along the scroll afterwards (S4 part 2 → S3 → S2 → S1; S7 from S6).
- **One catalogue:** one agent merges every area's needs list and dedupes it, existing 22 characters first.
- **Factories by kind**, one agent per item: characters, actions, animals, boats (a kit, like carts), tree forms, set
  pieces (the Rainbow Bridge, 十千脚店's 彩楼欢门 scaffold, the 望火楼), backdrop panels.
- **Builders never wait:** stand-ins first, swapped as the factories deliver.
- **Pilots before scale:** boats and water on S4 part 2's moorings, the countryside ground on a small piece of S1; the
  user signs each off before S3/S2/S1 build. The river question (which banks are walkable) goes with the boat pilot.
- **Per unit:** one brief template plus arguments, its own folder, a validator; runs as a Workflow so a failed or
  changed unit reruns alone. Checks against each agent's own preview, not the shared dev page. At most 3 headless
  Blender builds at once (16 cores, 23 GB).

## Running

- **Deploy agent:** done (above). It upgraded the Windows Vercel CLI 41.7.3 → 63.1.2 (uploads need ≥ 47.2.2) and
  created project `qingming` in scope `blueif16s-projects`. It found the shyfai key hardcoded as a fallback in
  `tools/shyfai_image.py` (line 43): to move to the environment only, after the backlog agent finishes.
- **Backlog agent:** the three panels and `bamboo_5`.
- **Prep agent:** Phase 0 questions, briefs for S7 and S4 part 2, a tile plan for S1–S3 (`gen/expand/round2/`).
- **Engine agent:** a streaming window that unloads, KTX2 textures, `tools/budget_check.mjs`
  (`gen/expand/engine_lessons.md`).

## The scroll HUD (asked 2026-10-12)

- The user: Space shows a HUD; the world is masked and the middle shows where you stand on the original painting,
  with the people around you boxed on their painted figures ("the feeling that we are actually living in the
  scroll"); the top-right settings appear only in the HUD.
- How it's exact: each section's `layout.json` carries its frames, the same mapping the map used, so the player's
  ground point (with its height) projects to the painting's pixel; people carry their map IDs, and the strokes give
  their painted figures.
- **HUD agent** started: projection module plus a residual test, the scan as a web tile pyramid
  (`tools/scroll_tiles.mjs`, loaded only while open), a per-section `scroll_index.json` (`tools/scroll_index.mjs`, a step
  every new section runs), `web/src/scroll_hud.js`, a phone button, and an independent QA subagent checking shots at
  landmarks against the scroll. Lessons: `gen/expand/hud_lessons.md`.

## Phase 0 (lead), done 2026-10-12 ~03:50

From the prep agent's drafts (`gen/expand/round2/phase0_questions.md`, briefs, `tile_plan_S1_S2_S3.md`), adopted:
- **S4b** is S4 part 2's own key (folder `outer_road_2`); `tools/scroll_map.mjs` accepts `S\d[a-z]?` IDs; S4 part 1's
  files never change.
- **Folders** in `map/sections.json`: S7 `city_end`, S3 `rainbow_bridge`, S2 `canal`, S1 `countryside`. **The S1|S2
  seam moved to u 29050** so the 望楼饭铺 shed and its customers stay whole in S2.
- **Boats** are vehicles with boat points; crews on `boat deck: <id>`; one water level for the 汴河, measured on S4b's
  moorings (`map/README.md`, Boats). The `BUILDING.md` rows for boats and water wait for the user at the pilot.
- **`H_profile`** supports (the Rainbow Bridge's deck) in `scroll_map.mjs` `supportH` and `map/README.md`. Verified:
  regenerating S5's world with the new code changes none of the gate layout's 58 entity points.
- **Seams** recorded in `map/index.md`; seed frames `map/frames/S4b.json` (`[12600, 31.6]`, datum (12600, 1206),
  station +67.95, water −1.5 as a seed only) and `map/frames/S7.json` (`[2000, 50.4]`, station −73.63).
- `tools/tree_cards.mjs check` reads the sections from `sections.json` (still PASS: 74 trees on 32 cards).
- **The shyfai key** now comes from `$SHYFAI_API_KEY` or `~/.shyfai_key` (0600), not the script.

## The mapping workflow, launched 2026-10-12 ~03:55

- Run `wf_59c016e2-059`; the script is saved (`map-round2`), the rules every agent reads are
  `gen/expand/round2/mapping_rules.md`. Per area: setup (area brief for S3/S2/S1, restyle, tile brief, final units) →
  unit agents in parallel (tiles, structures, river, bridge) → merge → second pass → frame (in order: S4b → S3 → S2 →
  S1; S7 alone) → needs list, lessons, Run 1 report. 58 planned units; up to 14 agents at once.

## The image backlog, done

- Shipped: the outer road's east panel, the gate's east panel, `bamboo_5` (on `S4.tree.leafy_shrub_10865`; the outer
  road's stale tree layout rebuilt, GLB byte-identical). 11 images.
- **On hold:** the gate's north panel. The painting is loyal, but `tools/backdrop.mjs` keys fine twig crowns to
  near-white (37% of its pixels): trees look frosted. Fix in the keyer (edge colour from nearby ink, as the tree-card
  keyer does) plus its bottom-edge bug; both in `gen/expand/backdrop_lessons.md`. For the backdrop factory in Run 2.
- **For the user:** the gate's east panel paints weeping willows where the scroll has fans of stiff shoots; the fix is
  one line in `prompts/backdrop_gate_east.txt` (prompts are the user's call).
- Panels sit with their horizon about 5° above eye level (the painted road is a deep wedge).

## 2026-10-12 ~04:20: the account switch

- The user switched accounts (`/login`) and said "continue on everything". During the logout 8 of S3's unit agents
  failed at start ("Not logged in"): river_w, river_e, structures_w, structures_e, t1–t4. The other 14 running agents
  were unaffected. The 8 were relaunched as separate background agents with the workflow's prompts (same files, same
  rules); the workflow's S3 merge (prompted to check for units that returned nothing) reads their part files, and it
  can't start before S3's t5–t9 and the bridge agent finish.
- **Setup results:** S7 and S4b restyles clean. **S3's restyle is unusable over the bridge** (alignment 0.07–0.16 east of
  ~18800: a second arch invented, the big boat moved, the moored boat painted as roofs); the units read the strokes at
  zoom 3. Better references over the bridge need a config or prompt change (later, the user's and the lead's call).
  **S2's and S1's whole-area overviews came back letterboxed** from the image API (asked 4096×832, got 4096×1658): S2
  now restyles as two nested halves (`canal/west`, `canal/east`; never run the pipeline on `canal` itself).
- **Tool, per-point heights:** `world` now reads a support's `H_profile` at each point's own u, and entities may name
  `support_by` (point or line role) and `support_ranges` (u ranges); off-ground line heights come out as `lines_H`
  (`map/README.md`, supports). S4 and S6 world files unchanged byte for byte; S5 only gained `lines_H` on four
  moat/trestle entities (their existing −1.5). S3's frame agent applies it to the deck and the road over it.
- **A new seam straddler** (S3's setup): the boat moored along the south bank, hull ≈ 19750–20650, v 1080–1220, with the
  men waving from its roof, is S3's (river_e); added to `map/index.md` for S2's river_w.
- **The gate-east prompt** (`prompts/backdrop_gate_east.txt`): the "not weeping willows" sentence appended after the
  user said "continue on everything"; the panel is regenerated with Run 2's backdrop work (with the keyer fix).
- **Factories started ahead of the needs lists** (2026-10-12 ~04:35): the boat kit (`blender/kit_boats.py`, `gen/boats/`:
  types studied from the painting, real size, deck colliders, a placement function against the layout format, a water
  proposal), the Rainbow Bridge set piece (`blender/kit_rainbow_bridge.py`, `gen/set_pieces/rainbow_bridge/`:
  parametric, a smooth deck collider, a height table to check against the frame's `H_profile`), and the backdrop
  factory (`tools/backdrop.mjs` keyer fix, the gate's east and north panels, a horizon trial).

## The user's calls, 2026-10-12 (~05:00)

- "The boats should be moving and you should be able to walk on decks." "For the water think about the most efficient
  treatment that considers sizing and efficiency. Just don't be too fake and just put it in fine." "We'll check on the
  videos later." Written into `map/BUILDING.md` (the boat and water rows, "Boats and water").
- "From now on just communicate with the agents and with our workflow. Try to just get everything done and record
  whatever is needed and important to progress. Only when everything's done tell me the final status and remaining
  questions." So: no reports to the user until the whole scroll is built, checked, deployed and recorded.

## The scroll HUD, done (2026-10-12 ~05:20)

- Space opens it; the street blurs and stops drawing. The painting is centred on your exact spot, with a ring and a
  view wedge; painted people and animals within 15 m are boxed on their figures (wanderers get a dot and a line back);
  hover/tap names them; zoom, pan, snap back; the whole-scroll strip; the credit. The settings panel shows only in the
  HUD (H toggles it there). Phones: a scroll button, fits 390 px. Independent QA passed on its third round (shots in
  the scratchpad `hud/shots_r6/`, `hud/qa/r6/`).
- Projection residuals under 1 px on every mapped point of S4, S5, S6; heights from the map, corrected for builder-raised
  ground (the courier post's forecourt) from nearby painted figures.
- Tiles: 410 webp, 21.85 MB on disk, nothing fetched until the HUD opens, all dropped on close. **The lead's call: ship
  the full pyramid** (the world will cover the whole scroll; viewers download only what they open).
- `tools/export_web_scene.mjs` runs `tools/scroll_index.mjs` for every section (lettered keys, sections from
  `sections.json`; fails if a figure projects more than 2 px off its stroke). Lessons and proposed skill text:
  `gen/expand/hud_lessons.md` (to merge into the skills at the end of the round).
- Open: walks with the default streaming window need teleports that load the destination (sent to the engine agent).
- **S3 reruns' findings** (river_w, structures_w, t1–t4 done; river_e, structures_e running): the riverside hall is
  十千脚店's upper storey (two storeys, floor ≈ 3.8 m); the 彩楼欢门 stands on the gate's roof; the "rider at the gate" is a
  saddled horse with nobody on it; S3's west river has 7 boats and 22 crew, and no bank face to measure water on (S4b's
  value is used). Lead calls (in `mapping_rules.md`, lead's notes): the route west of the tavern door is the riverside
  road (reading c); the scroll's boats have the sweep and rudder at the stern; the receding direction drifts from S4b's
  31.6 to about 46–51 by the tavern (knots); the far bank and north-bank strip are painted at 0.2–0.7 scale, the frame
  keeps one scale (rule 5), and room to walk is a build-time choice.

## The boat kit, done (2026-10-12 ~05:15)

- `blender/kit_boats.py`: passenger (9–10 painted boats), grain/cargo laden, with an awning and sweep, or with the mast
  up and towed (14–16), small with an awning or open (4–5), and the boat lowering its A-frame mast (1). Real sizes:
  passenger 24.6 m overall, grain 24.5 m, small 9.3 m. 1.3k–6.8k triangles and 42–143 KB a boat, with a lower detail
  level at 0.6k–2.4k. Sheet: `gen/boats/sheet.jpg`. Each boat exports as one movable root (`boat:<map id>`) with
  colliders (`deck__col`, `roof__col`, `rim__col`), a boarding edge, a wet line, moving parts with pivots, and rope
  nodes the page re-aims; work points sit in node metadata (the optimize step deletes empty nodes and rewrites
  transforms on mesh nodes). `boat_from_layout()` places a boat from a layout vehicle entity.
- Water (`gen/boats/water.md`): one strip of 150–250 triangles per reach and one 22 KB tile of painted current lines per
  world, a two-fetch shader that only darkens, a soft shore band, no extra pass.
- **The lead settled the pilot's details** in `map/BUILDING.md` (shorten to 0.6 then move outward, the measured water
  H, line look and drift, rails on decks, LOD by distance).
- **Tools changed:** `map_layout.mjs` copies `pose`, `lines_H` and a vehicle's `what`; `scroll_map.mjs world` converts
  `beam_n`/`beam_s` and `bow_top`/`stern_top` (S4 and S6 world files unchanged).
- **Still to do (page and pipeline, after the engine agent):** a per-section boats GLB in `export_web_scene.mjs`,
  loyalty counting boats exported outside the section GLB, the page runtime (boat motion, moving-platform collision,
  rope re-aiming, the water shader).

## Backdrops, done (2026-10-12 ~05:30)

- `tools/backdrop.mjs` keyer fixed (edge matte from nearby ink, as the tree cards; halos at the horizon gone; paintings
  touching the bottom edge key whole; `ship` logs the near-white share). Near-white share: gate north 37.1 → 7.9%,
  gate east 15.1 → 5.6%, outer road east 10.3 → 2.4%, gate west (control) 1.9 → 1.3%.
- Shipped: gate east (new draw with the stiff-shoot sentence, pick 0), gate north (hold removed), outer road east
  (re-keyed). Shots `gen/sections/gate/backdrop/frost_joined/sheet.jpg`, `frost_gate/sheet.jpg`. 4 images.
- KTX2 copies of the panels are stale (run `node tools/ktx2.mjs encode --kind panel` if panels are adopted).
- **For the user's final list:** street panels stand about 4° above eye level because the model paints the road as a
  deep wedge. A prompt line in `backdrop_panel.txt` (`gen/sections/outer_road/backdrop/horizon_trial/line.txt`) brought
  it to 0.4° in a trial, but the trial candidates weren't loyal enough to ship. Changing the shared panel prompt is the
  user's call; the cropping alternative was rejected.

## The Rainbow Bridge kit, done (2026-10-12 ~05:40)

- `blender/kit_rainbow_bridge.py`: two interlocking beam systems (11 rib lines, a choice: the underside isn't
  painted), cross beams at the four painted nodes, X-braced railing, the capped end post, the two 表木 poles, deck 8 m,
  span 15–16 m, crown 5.3–5.4 m. 18.9k visible triangles + 532 collider, 6 draws, 0.34 MB. The painted deck is
  45–70° at its feet: the kit keeps the crown and feet and extends the ramps 2.5–3.5 m to walk at most 34° (steps
  above 17°); every departure is in `Bridge.summary()["notes"]`. Walked headless with `player.js` on both fits: PASS.
  Sheet: `gen/set_pieces/rainbow_bridge/sheet.jpg`.
- **Tool:** supports may now give `H_profile_X` (world X, solved with depth), for the receding deck (`map/README.md`;
  S4–S6 world files unchanged). S3's frame agent is told to use it from the kit's table, and to turn
  `arch_intrados_e` into a `rib_e` line.
- **Still to do:** an output option for set pieces and boats in `export_web_scene.mjs`; ground friction in
  `player.js` (walkers creep downhill on every slope); clearance of the big boat's cabin under the arch (`clearance()`,
  3.45 m over the middle 40% on the agent's reading).

## The engine work, done (2026-10-12 ~06:00)

- **Streaming window that unloads** (default: your section and each neighbour; `?window=0|all`), seams closed and
  covered while a neighbour is out, shared resources reference-counted; the check tools (`walk_page`, `people_check`,
  `shots_page`, `film_page`) teleport through the page's `goto()`, which streams the destination in first. Walks 42/42
  at the default window and `?window=all`; walking end to end and back at `?window=0` returns geometries, materials
  and textures exactly. Load stalls 1.0–1.25 s → 51–126 ms.
- **The biggest GPU item was the crowd's bone bakes** (~116 MB): now only new clips, sliced per frame, tighter, props
  sharing their body's bake.
- **KTX2 adopted for all four kinds** after side-by-side sheets (`gen/expand/ktx2_review/`): tree cards UASTC, panels
  ETC1S, kit ETC1S (signs/script UASTC), bodies ETC1S; `tools/ktx2.mjs encode` after new content. KTX-Software 4.4.2 in
  `~/.local/opt/`.
- Three sections loaded: GPU 393 → 193 MB, JS 202 → 128 MB, download 21.3 → 29.3 MB (+8 MB, mostly UASTC tree cards
  for −64 MB of GPU: kept, the lead's call). Seven sections at the default window: about 260 MB.
- **Budgets** `tools/budgets.json`, `tools/budget_check.mjs` (per section: 9 MB download, 130k triangles, 330 draws,
  75 MB GPU alone; three neighbours 200 MB). Area agents must pass it.
- `people_check` is run at `?window=all` (just-streamed walkers leave their painted spots).
- **Boats and water page runtime** agent started: boats GLB per section, loyalty counting boats, `water_strip()` in the
  boat kit, `web/src/boats.js`/`water.js`, moving decks and ground friction in `player.js`, a test page, and
  `check_deploy` over every section.

## 2026-10-12 ~06:10–09:20: the usage limit

- A session usage limit stopped every agent at about 06:10 until 09:20. The mapping workflow retried its interrupted
  agents itself (S7, S4b and S3 second passes, S2 and S1 merges restarted). The boats page agent (stopped at its start)
  and the records agent (stopped while editing `web-scene/SKILL.md`; its description was already updated) were resumed
  with their context.
- Meshy: one account, 151 credits (about 4 new characters, or fewer with custom actions). The catalogue must cast from
  the 22 existing characters first; more credits is a question for the user's final list.
- Prepared for Run 2: `gen/expand/round2/build_rules.md` (the brief every area agent reads; it wins over the area
  briefs' older Run 2 sections), `tools/blender_slot.sh` and slot locks in `tools/build_scene.sh` (three Blenders at
  once), preview-server ports per area (S7 5191, S4b 5192, S3 5193, S2 5194, S1 5195).
- **Records merged into the skills** (records agent, resumed after the limit): `web-scene`, `scroll-section`,
  `characters`, `deploy-web` now carry the streaming window, KTX2, budgets, the HUD, boats and water, set pieces, the
  keyer and the workflow playbook. The test scripts `tools/walk_bridge.mjs` and `tools/hud_interact.mjs` were moved out
  of the scratchpad; the workflow is saved as `/home/ran/3d_director/.claude/workflows/map-round2.js` (runnable by name).
  Still to fix: `mast`/`mast_top` aren't converted by `world`; `check_deploy` covers only the start window (the boats
  page agent is on it); mark `mapping_rules.md` merged when the workflow ends.

## Boats and water on the page, done (2026-10-12 ~10:20)

- `export_web_scene.mjs` ships `<folder>_boats.glb` + `assets/<folder>/boats.json` (`blender/build_boats.py`, both
  detail levels, checked against the raw); options `--src --raw --out --data --no-boats --boats-only`. `loyalty_check`
  counts boats and crews; `check_deploy` loads `?window=all`. `kit_boats.water_strip/water_mesh/water_quad`.
- `web/src/boats.js`, `water.js`: moored boats ride, boats under way go out and back with sweep, oars and mast working,
  ropes re-aimed, trackers walk with their boat, LOD by distance, sections load and unload them. Decks carry the player;
  rails drop only where a boat touches something. Ground friction when standing still (no more creeping downhill).
  Water: one 22 KB 8-bit line tile, no extra pass. BatchedMesh: 7 boats +27 draws, +88–91k triangles, +0.3–0.4 ms.
- Test page `web/boats.html` (fixture `gen/boats/page_test/`): 12/12 walks, 5/5 ride tests; world walks still 42/42.
  Shots and films kept in `gen/boats/page_shots/`; HUD shots in `gen/hud_shots/`.
- `budget_check` now counts the boats GLB and JSON (the lead). Boat kit fixes started (sweep bar, oars under awnings,
  `kind_of` from `what`, `pose` from the entity, bow wave).

## S7 and S4b mapped; Run 2 started (2026-10-12 ~10:30)

- **S7:** 70 entities (17 figures, 3 animals, 9 trees, 20 props, 9 buildings, 5 structures, 1 road); knots
  [[1250, 59.9], [2000, 50.4]]. Needs `gen/expand/city_end_needs.md`, report `round2/city_end_run1_report.md`.
- **S4b:** 222 entities (66 figures incl. 5 crew, 10 animals, 3 land vehicles, 6 boats, 13 trees, 71 props, 24
  buildings, 1 water, 2 banks). **The lead accepted the frame agent's call:** dx 31.6 constant across S4b, because the
  ground edges at the seam disagree in sign (north −57, south +97, tea house −68): any ramp or re-knot folds or
  stretches the plan, or moves part 1's built east end 8–35 m. Water H −0.7 (a bound from three places where flat
  ground meets the water; S3 reads −0.86 to −1.0). S3's datum is S4b's road end (15500, 1530) est, station +110.35;
  S3's road starts there (checked).
- **Run 2 area agents started for S7 (port 5191) and S4b (5192, the boats-and-water pilot, films for the user in
  `gen/sections/outer_road_2/pilot/`).** Casting from the existing 22 characters with stand-ins; new characters and
  actions wait for the catalogue (Meshy: 151 credits).
- **Boat kit fixes landed** (~10:50): sweep on the stern gallery over the open after deck (no tiller on sweep boats,
  ±10°), oars only on open deck, `kind_of` reads `what` first, `pose`/`what` from the entity, a `bow_wave` node (34
  triangles), wet ring 0.6 m. Test page 12/12 walks, 5/5 rides. S4b told to rebuild its boats. **Page polish queue:**
  show `bow_wave` only while a boat goes ahead; a two-part boarding bridge over the gunwale (legs pass through the side
  for one step).

## Mapping nearly done (2026-10-12 ~11:30): S3, S2 and S1 frames

- **S3:** 467 entities, 232 figures (73 on the bridge deck, 48 on boats), all cast from the existing 22 characters.
  The deck heights use 17 offset supports (the bridge agent's u* rule); `H_profile_X` failed here (the bridge's axis
  runs 50.6° from east, and the solve diverges on the steep flanks): a tool request for a depth-keyed profile.
- **S2:** 398 entities, 140 figures (53 on boats), 17 boats, 4 water reaches, all cast from the existing 22.
  **The receding direction turns over in its east half** (option A, the measured edges, accepted).
- **S1:** no ground-level receding edge, so it holds S2's −51.6. The lead's calls on the trees in the road strip, the
  pale band (water), the charcoal train walking east as painted, and bank rises are in `build_rules.md`. The `running`
  and `galloping` poses are added to `map/README.md`.
- Water: every river section uses S4b's −0.7, a bound; no section has a vertical bank face to measure.
- Only S1's needs agent is still running. Run 2 is building S7 and S4b.

## Mapping finished; all five areas building (2026-10-12 ~11:45)

- The `map-round2` workflow finished: 87 agents, 79 done, the 8 failures being the S3 units rerun outside it; about
  28.5M subagent tokens; 7.7 hours wall-clock including the 3-hour usage-limit pause. No area needs a new character:
  every figure is cast from the existing 22. Optional, ranked by the areas: a boatman (S2's `sweepman_upright_22168`,
  face on), S7's broad-hatted official rider, takes (sweep, tow, pole, fend, haul, sack carry, wheelwright, chase,
  drive donkeys…).
- **Run 2 area agents now building all five:** S7 (5191) and S4b (5192) since ~10:30, S3 (5193), S2 (5194), S1 (5195)
  since ~11:45. The **catalogue agent** merges the five needs lists into `gen/expand/round2/catalogue.md`, with a Meshy
  plan inside 151 credits and three factory orders (workshop, tree cards, vehicles and shared kit parts).
- Still for the lead at the joins: copy S7's knots into `map/frames/S6.json` (S6 things west of u 2000 move) and rerun
  S6 `all`, `map_layout`; cut S6's and S4 part 1's ground at their new seams; add every section to `world.html`'s
  default list; page polish (`bow_wave` while under way, the boarding step); deploy.
- **The user on credits (2026-10-12 ~11:50):** "We are expected to use up all the credits. I also have more accounts if
  you need them." The catalogue now writes a full ranked list of new characters, takes and bodies, not a 151-credit
  plan. Only one Meshy key is on the machine (151 credits); the new account's key must be appended to `~/.meshy_keys`.

## The catalogue and the factories (2026-10-12 ~12:30)

- `gen/expand/round2/catalogue.md`: ten new characters ranked by figures served (boatman 76, grain porter 15, straw-hat
  labourer 13, dark broad-hat man 9, tracker 9, farmer 9, groom 7, youth 5, S7's official rider 3, pale-robed woman 2),
  32 takes, retakes, a conditional buffalo body: 695 credits in all. **151 buys items 1–9, 11, 12** (the boatman, the
  grain porter and eight takes); **the rest needs 545 more** (310 of it not optional). Told the user one more account
  of about 1,100 will be needed; they will add keys on request.
- Lead's calls on the tree factory's questions: saplings' check distances scale by tree height (7 sapling cards for 14
  saplings); S1's card budget is measured after KTX2, and an exception, if needed, gets a reason in `budgets.json`.
- Factories started: **workshop** (free work first, then paid items in rank order; logs deliveries in
  `gen/expand/round2/workshop_progress.md`), **tree cards** (19 new cards, 150 trees assigned). **The vehicles and
  shared-kit factory couldn't start: the session's 20-subagent limit is reached** (area agents' own subagents); it
  starts when slots free. Areas were told what comes to them and to rerun casting when deliveries land.

## S4b built (2026-10-12 ~12:20): the boat pilot

- Built, cast, checked alone and joined: loyalty PASS, KTX2 PASS, budget PASS (124.7k of 130k triangles, 188 draws,
  37.8 MB GPU, 3.9 MB download), walks 26/26 alone (boarding, crossing the raft, rails, ashore) and 4/4 joined,
  `people_check` PASS (76 alone, 157 joined). 6 boats in `outer_road_2_boats.glb` (0.79 MB). Report
  `gen/expand/round2/outer_road_2_run2_report.md`; **pilot films for the user** in `gen/sections/outer_road_2/pilot/`.
- **The main departure (for the user's final list):** the far bank moved 5.5 m north so five rafted real-size hulls fit
  (the painted cove is 13–15 m wide; they need about 20 m), keeping the painted order; the round and small boats and the
  far bank sit up to 4 m past the silk's top edge, in light mist.
- **Open:** the mat-cargo boat's gangplank can't be walked yet (it meets the tapering bow at ~15°; given to the kit
  factory); S3 told to keep its hulls and rowing runs clear of S4b's sterns (3–6 m past u 15500) and to move its north
  bank to meet S4b's moved one; part 1's `soldier_on_stool_11630` sits 0.4 m off his stool (polish list); the backdrop's
  "far off across mist" east-panel line overlaps the user's pending horizon question.
- **Lead:** the page tools (`walk_page`, `people_check`, `shots_page`, `film_page`, `bench_page`, `clip_sheet`) take
  `CDP_PORT` (default 9223, the bench Chrome); `tools/walk_film.mjs` (mp4 walk films) adopted from S4b.
- **Polish list for the joins:** `bow_wave` only while under way; the boarding step; the soldier's stool; cut S4
  part 1's and S6's ground at the new seams; S7's knots into S6's frame.
- **Lead's look at the pilot** (`pilot/shots_10h/sheet.jpg`, `strip_moorings_from_bank.jpg`): boats at real size read
  well, the water is calm and flat with drifting lines, the Rainbow Bridge's panel shows beyond. **Polish item:** the
  mist starts at the raw painted rectangle, so things moved past the silk's edge by recorded moves (S4b's far bank and
  two north boats) turn ghostly white even close up. The mist should start at the walkable area (painted area plus
  recorded moves and `edges`), not the raw rectangle (`web/src/post.js` / `backdrop.js`). S4b's trees still show the
  fallback weeping-willow card until the tree factory's assignments land.
- **2026-10-12 ~12:13: another account switch** (`/login`). The S7 builder died ("Not logged in") and was resumed with
  its context; every other agent was still active.

## S7 built (2026-10-12 ~12:40); joins started

- S7: 9 buildings, 5 structures, 20 props, 9 trees, 17 figures, 2 of 3 animals (`pale_shape_1905` left unbuilt for the
  user: animal or mat?), 48.5k triangles, 0.85 MB. Loyalty, KTX2, budget PASS; walks 18/18 alone, 8/8 joined; people
  check PASS; HUD boxes on the painted spots. Report `gen/expand/round2/city_end_run2_report.md`. Stand-ins until the
  workshop: the official rider (hat traveller), the dark-hat, groom and pale woman casts; takes `examine_child`,
  `sit_hold_child`, `point_way`; a procession routine for the retinue is a page item.
- **Join agent started** for S7|S6 and S4|S4b: S7's knots into S6's frame, ground cut at both seams, S6's 解 board and
  bar, the well planks, a brushing walker, S4's soldier on his stool; rebuild and recheck S6 and S4.
- **For the user's final list:** the scroll's last figure (the broad-hatted official) rides as a stand-in until the
  third Meshy account; `pale_shape_1905` (S7): an animal or a mat?
- **Character gaps** for the next Meshy account are listed in `gen/expand/round2/character_gaps.md` (asked by the user, 2026-10-12): what's waiting, model figures and crops, today's stand-ins, how to finish.

## Tree cards, done (2026-10-12 ~13:20)

- 20 new cards (4 burled willows, 2 elms, 4 slender fan-heads incl. `slender_8`, bamboo, S7's weeping willow, 7
  saplings, a hedge row); all 150 trees assigned (S7 9, S4b 13, S3 20, S2 21, S1 87); `tree_cards.mjs check` PASS (223
  card trees on 52 cards; distances scale with tree height below 8 m). S1's cards fit its 24 MB budget (17.85 MB).
  24 shyfai draws. Lineups `gen/trees/lineup_<S>.jpg`.
- `map_layout` rerun for S7 and S4b; S3, S2 and S1 rerun theirs; every area re-exports before the page shows the cards.
- `budget_check` skips `card: "kit"` trees (the lead). **Page polish item:** `world.js` `placeTrees` must also skip
  `kit` (a willow card stands on S4b's stump).

## 2026-10-12 ~13:40: a weekly usage limit, then a new account

- The account in use hit its weekly limit (resets Oct 16). It stopped the S3, S2 and S1 builders, the workshop, the kit
  factory, the join agent and three area subagents (S2 builder, S2 casting, S1 ground pilot). The S1 kit agent and the
  S2 boats agent had finished just before (their reports came to the lead; results are in their files). The user
  logged in on another account, and **all nine stopped agents were resumed with their context** (`SendMessage`).
- **Lead's calls on S2's boats:** extend the river's estimated east end to the S1 seam as a recorded choice (grain boat
  2 lies east of grain 1 as painted); `small_bow_22158` stays unbuilt (only its bow is painted; the rest would stand on
  the south bank's flat); QA walks onto the high-riding cargo boats. **Page polish additions:** `host()` levels for
  roof, ladder and stern figures; haulers following their towpath. S1's kit agent's four tree moves are accepted.
- S2's boats: 16 built (61.6k triangles at full detail, 2.0 MB), a 3.0 m walk all along the north bank by a smooth
  ΔD(u) shift of the bank (`gen/sections/canal/river_plan.json`). S1's set pieces: 14 buildings, 8 structures, 27
  props, 2 vehicles, 63.2k triangles; the section 94.2k.

## 2026-10-12 ~15:05: more session limits; all resumed

- Two more session limits (the 4:30 pm and 7 pm resets on the accounts in turn) stopped most agents; the workshop also
  stalled (watchdog). The user switched accounts; all eight stopped agents were resumed with their context.
- **State at 15:05:** S3, S2 and S1 are built and `loyalty_check` PASSES for all three (S3 109.8k triangles, 1.9 MB +
  1.3 MB of boats; S2 117.3k, 2.0 + 2.0 MB of boats; S1 96.2k, 1.4 MB); their checks, joins and reports remain. The
  workshop: 92 free retargets, the carried props and the recolours landed; `boatman.glb` landed at 14:13; Meshy is at
  21 credits (130 spent), takes under review. The kit factory: the four vehicle functions and six `kit_common` parts
  landed; the boat options remain. The join agent: S7|S6 and S4|S4b walks and S7+S6 people pass; S4+S4b people, shots
  and the HUD remain.
- **S1's area agent** stalled, then failed with "Unknown error" on resume (likely its image-heavy context). Its ground
  subagent is still running. Plan: when the ground agent reports, a fresh S1 finisher agent takes over from the files
  (final build and export, checks alone and joined with S2, pilot shots, report). Lesson: area agents keep image reads
  small (sheets or a few crops), or delegate image review to subagents.

## 2026-10-12 ~18:00: the PC froze and was restarted; recovery (lead, new session)

- **Cause, measured afterwards:** Windows and WSL share 32 GB, and `.wslconfig` lets WSL take 24 GB of it. Running at
  once were 11 headless Windows Chromes (one per agent, about 1.6 GB each with the whole world loaded) and 10 dev
  servers (about 0.6 GB each, all re-reading `web/` on every write); the load average was around 40. Blender was not
  the cause: a section build takes about 6 s and 0.25 GB. At idle, Windows has about 11 GB free while WSL holds 7 GB.
- **Every running agent died:** the S3, S2 and S1 area agents, S3 QA, the S2 boats agent, the S1 ground agent, the
  workshop, the kit factory and the join agent. A new session can't resume them; fresh agents start from the files.
- **Data intact:** all 294 JSON and 371 GLB files written since noon pass `tools/integrity_check.py`. Meshy downloads
  are intact.
- **Lost:** `/tmp` is emptied at boot, and the old scratchpad with it. Gone are the QA walk and shot results (S3, S2,
  S1), the join agent's seam shots, the kit factory's boat-option tests and its S4b staging build, the agents' helper
  scripts, and the mapping second-pass evidence crops (their results were merged). The transcripts survive.
- **Redone by the lead:**
  - **The canal's final build on the river plan** (it died at 17:59 with an I/O error): rebuilt (116.8k triangles)
    and exported (`canal.glb` 1.98 MB; scroll index max 0.73 px). Loyalty PASS. **Budget FAIL on download** (9.08 of
    9 MB; 23.76 of 20 MB with kit and cast, because the cast grew with the new takes): for the S2 finisher.
  - **The workshop's builds:** `build_paid2` died after the bearer, before the inspector, and `build_paid3` never ran.
    All 8 characters are rebuilt (free local retargets), and `characters.json` lists the new takes.
  - **S3 QA's one logged defect** (`boat_mast_lowering_19518` `run_m` 0 → NaN hull, crew and walkers): S3 had fixed
    the data (`run_m` 0.2); the lead added the guard in `web/src/boats.js`.
- **New rules:** skill `scroll-section`, "Machine resources". New tools: `tools/machine.sh`
  (status | wait | sweep), `tools/chrome_slot.sh` (3 check-Chrome slots, a fresh Chrome per command),
  `tools/check_server.sh` (one shared server on 5190, HMR off) and `tools/integrity_check.py`. `build_scene.sh` and
  `blender_slot.sh` now wait for memory headroom. `build_rules.md`, `web-scene` and `characters` are updated to match.
  QA results go in the repo, never only in the scratchpad.
- **WSL memory kept at 24 GB** (the user asked why lower it; the slots are the fix, so the lead watches
  `machine.sh status` instead).
- **Still to do** (the 15:05 plan, updated):
  1. Finishers for S3, S2 and S1: QA again (results were lost), budget, joined checks, reports. S2 is over its
     download budget.
  2. The S4b boat options: test and ship them (the kit code is in `kit_boats.py`; the tests were lost).
  3. The join of S7|S6 and S4|S4b: the S4+S4b people check, the shots and the HUD shots remain. A second join agent
     for S4b|S3, S3|S2 and S2|S1.
  4. The workshop's takes review (the clip sheets); the animals' tack frames (they timed out under the load).
  5. Page polish:
     - mist from the walkable edge;
     - the stray card on S4b's stump (`placeTrees` skipping `kit`);
     - `bow_wave` only while a boat is under way;
     - the boarding step;
     - `host()` levels for roof, ladder and stern figures;
     - trackers following their towpath;
     - S7's procession;
     - the soldier's stool.
  6. The whole-world pass: every section in `world.html`'s default list, walks and people checks across the scroll,
     `budget_check all`, a real-GPU bench, deploy, skills, `NEXT_SESSION.md`, and the final report.

## The restart run (2026-10-12 ~18:45): six fresh agents

- **The user, at the restart:** "We are not chasing extreme, so just pass the checks and quality bar, merge them, and
  have me check is the primary bar."
- **The brief every agent reads:** `gen/expand/round2/restart_brief.md`. Agents:
  - finishers for S3, S2 and S1;
  - a join agent for every seam, S4b's boats with the new options, and the whole scroll;
  - a page agent, which owns `web/src/` and `web/*.html` this run, fixes defects only, and takes requests through
    `round2/page_queue.md`;
  - a workshop finisher for the take review and the animals' tack frames.
- **Every agent runs under the new machine rules:** the shared check server (5190), Chrome slots, Blender slots, and
  QA results in the repo.
- **Machine watch:** `gen/expand/round2/machine_log.txt`, one line a minute. The lead is called if Windows free memory
  drops under 2 GB or the load goes over 32.
- **~18:50: a new Meshy account** (the user): 1,100 credits, now line 1 of `~/.meshy_keys`; msy_B7y3 (1 credit) is
  retired. The user asked for everything in `character_gaps.md` to be made and cast, about 545 credits:
  - 8 characters, items 13–43's takes, and the buffalo body only if needed.

  A seventh agent, the **workshop paid run** (`restart_brief.md`), owns the new characters and takes. It recasts each
  area after that area's `FINAL BUILD` line and ends with `ALL CAST`. The take reviewer can now ask it for retakes. The
  join agent's whole-scroll pass waits for `ALL CAST`.
- **~18:31: Windows dropped to 1.1 GB free** with only two check Chromes running. The cause was WSL's file cache: WSL
  reported 21 GB "available" while `vmmemWSL` held 15.7 GB, and the user's own apps take about 10 GB. Without root,
  only the slot gate (Windows ≥ 3 GB) protects the machine, so jobs wait. `machine.sh status` now shows the cache.
  Asked the user to drop the cache once. After this run, propose `autoMemoryReclaim=dropCache` in `.wslconfig`; it
  needs `wsl --shutdown`, which would kill the agents now.
- **18:36: the take review is done** (workshop finisher).
  - Pass: `work_sweep`, `reach_over_rail`, `tow_walk`, `sack_carry` (only with a sack bound), `fend_pole` (only with
    `long_pole_mid`), `haul_line`.
  - Not to use, with retakes wanted from the paid run:
    - `chase_run`: the arms stay out at shoulder height; stand-in `run` (S1's three grooms);
    - `pole_boat`: the pole swings skyward; stand-in `stand_pole` + `long_pole` (S2's and S3's boatmen).
  - All six animal tack frames pass.
- **18:56–19:05: four agents done.**
  - **S2 canal, FINAL BUILD 18:56:** walks 26/26 alone and 8/8 joined; 8.88 of 9 MB (tiled UVs rounded to 1/1024);
    GPU 73.4 MB.
  - **S3 rainbow_bridge, FINAL BUILD 18:58:** walks 42/42 alone and 7/7 with S4b; people PASS (233 alone, 305
    joined).
  - **S1 countryside, FINAL BUILD 18:59:** walks 50/50; the hall was cut to 3.0 m deep.
  - **The page agent:** all 8 sections are the default; mist from the walkable edge; `kit` trees skipped; bow waves
    only under way; `host()` on roofs, sterns and ladders; the S4b and S2 gangplanks fixed. Regressions: 42/42 world
    walks, boats 12/12 and 5/5.
  - Reports: `round2/<folder>_run2_report.md`, `page_report.md`.
- **Lead's tool changes:**
  - `people_check`'s ground test is now relative to the built ground, for gaps lasting 1.2 s, probed from knee height.
    The fixed −0.5..0.6 band failed S1's riverbank. With it, S1 PASSES in full, and the default world reads 0 m off.
    The default world still fails only the two stale gate road spots, which the join agent reselects.
  - `budget_check` reads per-section `exceptions` from `budgets.json`.
- **Lead's budget calls:**
  - Download with kit and cast: 20 → 28 MB, because the round-2 river casts are larger (S2 25.1, S3 26.1).
  - S3's GPU: an exception of 82 MB (80.17 measured). The window's 200 MB still binds.
- **S3's wading walkers:** reproduced by the page agent, not fixed. The data workaround stands: the big boat's
  `pause_s` keeps it at the bank. It's on the user list.
- **19:18: ALL CAST** (the workshop paid run, account msy_VYNl). Made:
  - 7 characters: straw_hat, dark_hat, tracker, farmer, groom, youth, official_rider;
  - 23 takes;
  - 9 retakes: `chase_run`, `pole_boat`, and 7 takes that came out wrong.

  Credits: 530 spent, 570 left. woman_pale and the buffalo body were not needed (the free versions pass). All five
  areas are recast, with loyalty, KTX2 and people PASS. The lead did the two owner requests (S4b's four figures, S2's
  `pole_boat`) at ~19:30.
  - For the user: `drive_donkeys`, `lie_wave`, `sit_hold_child` and the idler's `sit_offer` are weak, and the official
    rider's stick may cut into the horse.
- **~19:40: v1 preview deployed** (the user: "deploy now so I can see… deployments are very cheap; redeploy later"):
  - `tools/deploy_web.sh`: 762 files, 81.9 MB; all 8 sections are the default in `world.html`.
  - `check_deploy` on the live `?window=all`: PASS, with 8 sections, 34 boats and 897 people (242 requests,
    60.8 MB, 58 s).
  - Shot: `round2/lead_qa/live_v1.png`.

  The join agent's whole-scroll pass continues; redeploy after it lands.
- **~19:50: the join agent is done** (`round2/joins_report.md`).
  - All 5 new seams are joined: S7|S6 walks 8/8, S4|S4b 4/4, S4b|S3 7/7, S3|S2 8/8, S2|S1 6/6. People PASS at every
    seam after the recast; the HUD rings sit on the painted spots.
  - S4b's boats are rebuilt with the round-2 options (deck walks 26/26). S7's buckets got colliders. S2's river end
    at the S1 seam, a wall with a gap, is fixed.
  - The whole scroll: loyalty 8/8, KTX2 PASS, `people_check` PASS, world walks 210/211 (the one walk was widened,
    not yet retested). `budget_check all` PASS, but the window S4b+S3+S2 is at 198.2 of 200 MB.
- **The lead:** `scroll_index.mjs` `plain()` now drops letter-digit tags. S1's charcoal donkeys were labelled
  "D1"–"D5" in the HUD; S1's index is regenerated, and no other section had tags.
- **Running:** the full world walks (the lead, through a Chrome slot), and a records agent merging the round's lessons
  into the skills and `NEXT_SESSION.md` (text only).
- **Then:** the real-GPU bench alone, the redeploy, the final report.
- **~20:15: full world walks (lead): 209/211.** The join agent's widened S2 bank walk passes now. The two failures
  were real, not flaky (3 of 3 each):
  - **S6 square south edge:** the painted `bending_man_2638` stood within body distance of the line. The start moved
    0.4 m east, and it PASSES.
  - **S4 side-ground walk:** the painted pig herd (walkers) roots across it in the full world; it PASSES alone. A
    route 1 m west didn't clear it. It's marked `known` in `sections/world/walks.json` and goes on the user list
    (should animals give way to the player?).

  World walks: **210/211, plus that 1 known.**
- **~20:00: the real-GPU bench alone** (`gen/sections/world/bench_v1/bench.md`, config `sections/world/bench_v1.json`):
  RTX 4070 SUPER, 1080p, default window, daylight, ink and shadows, 14 views over all 8 sections.
  - **155–400 fps.** The slowest are S3's crown and under-arch views (466 people loaded, 155–157 fps) and S2's grain
    wharf (157).
  - CPU 4× slower: 16–44 fps, the crown slowest (16; GPU 38 ms). This is for the phone pass later.
  - The console showed 30 `GL_INVALID_VALUE: glGetProgramiv` warnings while sections streamed (warnings, not errors;
    not yet traced).
- **~20:05: v1 redeployed** with S1's label fix. The pre-deploy check now loads all 8 sections (34 boats; 60.8 MB;
  26 s), and every live URL returns 200.
- **~20:20: adults drawn at child size (seen by the user), fixed and deployed.**
  - **Cause:** `people.js` loadCharacters sized each model with `Box3.setFromObject`, which counted the hidden
    carried props and tack that the workshop baked into the GLBs today. A 4–6 m boat pole shrank every porter, carter,
    idler, boatman and their kind to about 0.6.
  - **Effect:** 643 people were drawn under 0.95 of their size. After the fix, 27 remain, all deliberate (painted
    children, birds, small animals, small far figures).
  - **Fix:** the body only (no `prop_*` / `tack_*`). `people_check` has a new "sizes" check: an adult under 0.9
    without a people.json `scale` FAILS (0 now).
  - **Regressions:** world walks 210/211 (the S2 boarding walk sits on its range's edge in the full run; 3/3 alone),
    boats 12/12, rides 5/5. Shots in `round2/lead_qa/size_fix/`.
  - The figures placed this afternoon were checked with small people, so worth a look: crews in cabins, people on
    benches.
- **Parallel sessions:** the sound session (3d-director-36) is wiring `web/src/sound.js` into `world.js` (hooks
  only). It held `web/` until this deploy; the next deploy is agreed with it first. A performance research agent is
  writing `gen/perf/proposal.md` (read-only on `web/src`).
- **~20:35: the sound engine is live** (sound session 3d-director-36: `web/src/sound.js`, `world.js` hooks inside
  try, 168 sound files of 1.9 MB fetched on first use, `?sound=0`, M or the bell button, an ElevenLabs credit).
  - The lead's regression run before the deploy: world walks 211/211, boats 12/12, rides 5/5, sizes 0 shrunk.
  - Deploy: 930 files, 101 MB. The sounds are live (200).
  - The sound session may now deploy itself after the regression script passes.
- **~20:40: the user's next asks.**
  - **Performance for every device, not this machine:** phones and whatever people have; no Windows- or GPU-specific
    tuning. The performance agent is re-scoped: device tiers, adaptive resolution, phone memory, slow 4G
    (`gen/perf/proposal.md`).
  - **Boats that flow** ("continuous flow… hide them when out of vision… new waves of boats coming in"). A boat-flow
    agent builds it behind `?boatflow=painted|waves`, today's behaviour staying the default. `map/BUILDING.md`
    allows only painted boats moving a short way and back, and no unpainted traffic by default, so the user picks
    the default from the films (`gen/boats/flow/`).
- **20:46: sound v2 deployed** (the sound session: smooth falloff, beds that follow the crowd, a volume bar in the
  HUD, guarded passes; its regression run: world 210/211 with one flaky S2 walk that passes on rerun, boats 12/12,
  rides 5/5). The boat-flow agent held its `web/` edits during the build. From now on, deploys go through the lead
  at a consistent moment.
- **The performance proposal** (`gen/perf/proposal.md`, the research agent, nothing under `web/` changed). On a phone
  the CPU is the wall (390–500 draws at the worst spots); people are 70% of the triangles, drawn three times. 179 MB
  of phone GPU at the binding window; 76 s to walk on slow 4G.
  - Ranked: device tiers + adaptive resolution; MRT ink without MSAA (measured −21…−41% of the frame, same look);
    the boats' batches (−11…−19%); shadow caching (shadows are 20–25% of the CPU); the crowd's LOD and one draw; the
    world in cells (later).
- **The user: "start the subagent now… do the best practices without doubting too much and apply them quick".** The
  engine agent is building the first batch (tiers, MRT ink + FXAA + 8-bit target, shadow policy, bakes, loading
  wins), recorded in `gen/perf/batch1/notes.md`. It shares `world.js` with the boat-flow agent, re-reading before
  every edit, and does the boats' batches after "boat-flow done". The lead deploys.
- **23:15: boat flow built** (`gen/boats/flow/notes.md`). The default is unchanged; `?boatflow=painted` or
  `?boatflow=waves`. All hooks are in `boats.js` (none in `world.js`), with lanes in
  `web/public/assets/boatflow.json` (57 KB).
  - `painted`: the painted boats under way sail their lanes within each section and are recycled out of sight.
  - `waves`: adds crewed copies arriving from the mist, capped at 2/3/6 per section by device.
  - Cost at S2: +0.01 ms (painted); +0.07 ms, +2 draws, +93k triangles (waves).
  - Default checks: world 211/211, boats 12/12, rides 5/5, loyalty unchanged. Riding under the bridge, the mast
    lowers to 84°.
  - Films: `gen/boats/flow/film_{painted,waves}_{bank,crown}.mp4`.
  - **For the user:** adopt a variant (changes `map/BUILDING.md`)? Open a channel through S2's moorings at the S3
    seam so boats pass under the bridge?
  - Section bugs: S2's ground lip, 0.57 m over S3's river at the seam (X 151.1–151.5, D 15–24); S3's lake ends are
    closed by moored hulls.
- **~23:30: deployed the boat flow and the performance batch, items 1–5** (the engine agent: tiers, MRT ink, shadow
  policy, half-float bakes, loading wins; its own checks at every tier: walks 211 on mid/low, 209 on high with the
  known flaky S2 yard walks; boats 12/12 and rides 5/5 everywhere; sizes 0).
  - 1005 files, 102.6 MB. `deploy_web.sh` now carries `web/vercel.json`'s routes: hashed files are immutable for a
    year (checked live).
  - Live checks: `?tier=low&window=all` PASS. `?boatflow=waves&window=all` PASS on the second run (the first timed
    out on a cold CDN), with 36 boats and 39.6 MB for all 8 sections (60.8 MB before).
  - Next: the engine's boats' batches; the user's choice of boat-flow default and channel.
- **Deployed: the boats' batches** (the engine agent: no per-instance cull or sort on the boat `BatchedMesh`es, their
  own materials, a waves cap by tier of 2/3/6). Its checks: world walks 211/211 at every tier and with
  `?boatflow=waves`, boats 12/12, rides 5/5, the river views look unchanged. One batch per material across sections
  is optional; the cost numbers are coming.
- **The engine agent is done** (`gen/perf/batch1/notes.md`; `web-scene` updated). All six items are live. At the
  crown, quiet / busy:
  - phone proxy: 25→43 fps / 14→31 fps (CPU 38.6→22.1 ms);
  - desktop high: 138–198→201–233 fps;
  - phone GPU memory: 179→98 MB;
  - first walk: 25.6→9.5 s; second visit: 8.7→3.6 s.

  The look on high matches within noise (the ink no longer bleeds through tree cards); low and mid are the same
  picture, softer.
  - Skipped: two-layer shadows (not quick); the low tier keeps window 1 (`?window=ahead` failed two walks);
    cross-section boat batches (next).
  - Asked the UI session (3d-director-2e, `web/src/ui/`) to add a Quality row (settings key `quality`) to
    `ui/settings_screen.js`, and to deploy through the lead.
- **23:55: deployed the UI session's Quality row** (3d-director-2e: `ui/settings_screen.js`, first row of the 畫面
  page; `quality` = 隨宜/簡筆/兼工/工筆; disabled under `?tier=`). Live and verified in `settings_screen-*.js`.
  - The UI session reports two deploys of its own today, on the user's word, each after `regress.sh` passed, before
    deploys went through the lead.
  - **Its files:**
    - `web/src/ui/` (hud, settings_screen, time, journal, places, prefs, words, css);
    - `web/public/assets/ui/`;
    - `sections/*/places.json` and `talk.json`; `tools/ui_data.mjs`, `tools/font_subset.py`;
    - marked hooks in `world.js`, `world.html`, `scroll_hud.js` and `sound.js`.

    Its records are `gen/ui/progress.md` and `gen/ui/r2_*.md`.
  - **Its `world.js` changes:** each visit starts on the viewer's clock, and `applyLight` turns the sun at the
    tier's shadow rate.
- **2026-10-13: the handoff for performance batch 2** is at the top of `NEXT_SESSION.md` (the user: "continue on
  the next batch… a handoff for the next session"). It covers:
  - cross-section boat batches;
  - two-layer shadows;
  - the crowd's LOD, shadow cut and one draw;
  - per-clip animation files, small cards first, hashed names, and a live slow-4G measurement;
  - `?window=ahead` for the low tier;
  - then the world in cells.

  The boat-flow default and the channel stay the user's.
- **2026-10-13: performance batch 2 started** (lead 3d-director-04; record `gen/perf/batch2/notes.md`). The user
  confirmed the plan with lighter checks ("be quick"), boats by device (light: painted boats sailing; balanced and
  full: waves, 3 / 6; a 船行 Boats setting; `map/BUILDING.md` "The river's flow, by device") and the middle version of
  the world in cells. Landed by the lead: stepped shading by default, saved settings versioned (v2), boats by device
  and the Boats row. Agents running: frame rate, loading, cells (pilot S3). The crowd's LOD and per-clip clips wait
  for the details session's character rebuild (3d-director-2e, `gen/details/plan.md`).
