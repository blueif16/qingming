# Next session: start here (written 2026-10-13, after round 2 and performance batch 1)

**Update 2026-10-13 ~07:45: performance batch 2 is done and live** (record and next steps:
`gen/perf/batch2/notes.md`, "Next"; the details pass: `gen/details/progress.md`). The prompt below was batch 2's;
keep it as history. The open list and "Next" further down still stand, minus what batch 2 did.

Paste the prompt below into a new session.

---

We are continuing the 清明上河图 web world in `/home/ran/3d_director/qingming`. All eight sections of the scroll are
live at https://qingming.infinityopus.com (v1, 2026-10-12; own domain since 2026-10-13, on Cloudflare since 2026-10-14: skill `deploy-web`). Since v1 went live, these have landed:
- the adult-size fix: carried props had shrunk 643 adults to about 0.6; `people_check` now has a "sizes" check;
- sound, built by a parallel session;
- a new ink UI (`web/src/ui/`: HUD, settings, time instrument, journal), built by a parallel session;
- boat flow behind `?boatflow=painted|waves`. The default is unchanged until the user picks one;
- **performance batch 1**:
  - device tiers with adaptive resolution (`web/src/tiers.js`, `?tier=low|mid|high`, the settings' Quality row);
  - MRT ink, with FXAA and an 8-bit target on low and mid;
  - the shadow policy;
  - half-float bakes;
  - loading quick wins;
  - the boats' cull and sort flags.

  At the Rainbow Bridge's crown, the phone proxy (390 × 844 at DPR 3, CPU 4×, low tier) went from 25 to 43 fps,
  phone GPU memory from 179 to 98 MB, and a cold first walk from 25.6 to 9.5 s.

**Your job: performance batch 2.** The goal is reach: anyone, on whatever device, phones first. The user: "We are not
trying to optimize it on my machine. I want more people to see it and play it, even on their phone." Use the RTX 4070
SUPER only as a measuring instrument, under the phone proxy. The user's bar: "do the best practices without doubting
too much and apply them quick"; pass the checks, and the user's own look is the primary review.

Read first:
- `qingming/CLAUDE.md` and your memory, especially `feedback-any-device-reach`, `feedback-machine-resources`,
  `feedback-pass-checks-user-is-primary-bar` and `feedback-loyal-to-painting` (every painted figure stays, on every
  tier);
- `gen/perf/proposal.md` (the measurements, the ranked techniques, "What to borrow from Messenger", "Device tiers");
- `gen/perf/batch1/notes.md` (what landed, the numbers and how they were taken, and "Next");
- the skill `web-scene` (batch 1's lessons are in it) and the skill `scroll-section` "Machine resources" (hard rules);
- `reference/messenger_study/world_notes.md` (study only, never copy).

The batch, in order (each step checked before the next):
1. **The boats' batches across sections:** one batch per material, 32 → 14 draws at the crown. `boats.js` `batch()`
   keeps `it.gid`; flow copies use `copy`, `uncopy` and `show` (`gen/boats/flow/notes.md`, "For the lead").
2. **Two-layer shadows:** a cached world map, redrawn when its snapped centre or the sun steps, plus a per-frame
   people map. Proposal rank 4.
3. **The crowd:**
   - an index-only LOD past about 20 m (meshopt, 4.2k → about 1k triangles, the same vertices so the bake still
     drives it), with the distance by tier;
   - far people out of the shadow pass;
   - then one draw per pass for every character (body textures in an array).

   Proposal rank 5.
4. **Loading, the rest of rank 8:**
   - per-clip animation files, fetched as routines ask;
   - 256 px tree cards first;
   - content-hashed GLB and JSON names, so they can be cached immutably too;
   - a measurement of the live site on slow 4G (`node gen/perf/probe.mjs load https://qingming-delta.vercel.app/world.html --net slow4g` on Vercel, as it was then;
     it was 76 s to walk before batch 1).
5. **`?window=ahead` for the low tier:** find why S3's under-arch shore walk and S2's hooded-bow boarding fail
   without the section behind (a wall or boat contact owned by the neighbour), fix it, and make it the low tier's
   window.
6. **If time remains, the world in cells** (rank 9, the big structural one): either start it with a pilot on one
   section, or write its plan. It touches the builders and kits, so it needs a whole-scroll rebuild.

**How:**
- Run as the lead with one or two engine subagents. Brief them from a file; `gen/perf/batch1/` shows the pattern.
- Run the checks after every step, at each tier and with `?boatflow=waves`:
  - `tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>`, with `WORLD_URL` carrying `?tier=`:
    world walks 211, boats 12/12, rides 5/5, people with only the two stale gate road spots failing, sizes 0;
  - the look at 6 fixed views (storyteller, crown, under_arch, grain_wharf, moorings_bank, farmsteads; `?hour=11`):
    high equals the old picture within noise; low and mid are the same picture, softer;
  - before and after numbers on high and on the phone proxy (`tools/bench_page.mjs`, `gen/perf/probe.mjs memory`
    and `load`), the same way as batch 1.
- **Machine rules:**
  - Pages only through `tools/chrome_slot.sh` against `tools/check_server.sh` (5190); Blender only through the slot
    scripts.
  - `tools/machine.sh status` whenever you check on agents.
  - WSL's file cache can squeeze Windows. If jobs stall at the slot gate, ask the user to run
    `wsl -u root sh -c "echo 3 > /proc/sys/vm/drop_caches"` in PowerShell.
- **Parallel sessions share `web/`.** A sound session owns `web/src/sound.js` and `web/public/assets/sounds/`. The ink
  UI session (3d-director-2e) owns `web/src/ui/`, `web/public/assets/ui/` and `sections/*/places.json` and
  `talk.json`; its hooks in `world.js`, `world.html`, `scroll_hud.js` and `sound.js` are listed in
  `gen/ui/r2_*.md`.
  - Check `ListAgents` at the start. Re-read a shared file before each edit; keep edits small and never reformat
    another session's block.
  - **Deploys go through you:** ask the live sessions to hold `web/` edits, deploy with `tools/deploy_web.sh` once the
    checks pass, then say "deployed".
- Record in `gen/perf/batch2/notes.md` (what landed, its numbers, the next step) and in
  `gen/expand/round2_progress.md`. Merge the lessons into `web-scene` at the end.
- Report to the user once, at the end: numbers before and after, what's live, and what's next.

**Not yours to decide** (the user's, still open):
- the boat-flow default (today's, `painted` or `waves`; it changes `map/BUILDING.md`);
- a channel through S2's moorings at the S3 seam so boats pass under the bridge;
- the review list below.

Leave them as they are.

---

## Where the world stands

- **Eight sections, joined:** loyalty PASS 8/8, KTX2 PASS, `budget_check all` PASS, world walks 210/211 on the whole
  scroll (`sections/world/walks.json`; the S4 side-ground walk is marked `known`: the painted pig herd roots across it
  in the full world. Should animals give way to the player?), `people_check` PASS at `?window=all`, HUD rings on the painted spots at every
  new section's landmarks. Every seam walked both ways.
- **Content:** 897 painted people (825 figures, 72 walkers), 34 boats on walkable, moving decks, rivers as water
  strips; 34 characters (3 of them free recolour variants), 13 animal types, 52 tree cards, every tree assigned.
- **Size:** v1 is 762 files, 81.9 MB; the live check loads every section in 60.8 MB. The streaming window is at its
  limit where the rivers are: S4b + S3 + S2 hold 198.2 of 200 MB of GPU. Anything added there needs room first (trim
  the casts with `tools/clips_used.mjs`, or distance LODs on S4b's buildings). Downloads with kit and cast run to 26 MB
  (S3) against the raised 28 MB budget.
- **Speed:** the whole scroll at the default window on the RTX 4070 SUPER at 1080p runs at 155–400 fps over 14 views.
  The crown and the view under the arch are slowest (466 people loaded, about 155 fps). With the CPU 4x slower it runs
  at 16–44 fps, and the crown is the slowest. Files: `gen/sections/world/bench_v1/bench.md`, config
  `sections/world/bench_v1.json`. A performance research agent was writing `gen/perf/proposal.md` (ranked techniques
  with measured gains, and what to borrow from Messenger) when this was written.
- **Sizes fixed after v1 (2026-10-12 ~20:20):** for most of the day, 643 adults were drawn at about 0.6 (child size),
  because the carried props baked into the character GLBs inflated the load-time box. `people.js` now sizes from the
  body only, and `people_check` fails on any adult under 0.9 without a `scale`. Figures placed that afternoon were
  judged with small people, so look for full-size people clipping in cabins, on benches and under low roofs.
- **Meshy:** 570 credits left on `msy_VYNl` (line 1 of `~/.meshy_keys`); `msy_B7y3` is retired. A take is 10 credits
  once and free on every character after; a character about 30.

- **After v1, the same evening:**
  - **Performance batch 1 live** (`gen/perf/proposal.md`, `gen/perf/batch1/notes.md`): device tiers (`tiers.js`,
    `?tier=`, settings `quality`), MRT ink, shadow policy, half-float bakes, loading wins, and the boats' batches.
    - At the crown: phone proxy 25→43 fps; phone GPU 179→98 MB; first walk 25.6→9.5 s.
    - Next from the proposal: the crowd's LOD and one-draw batching, per-clip animation files, two-layer shadows,
      the world in cells.
  - **Boat flow** (`gen/boats/flow/notes.md`): `?boatflow=painted|waves`. The default is unchanged until the user
    picks one (it changes `map/BUILDING.md`). The films are in `gen/boats/flow/`. Optional: a channel through S2's
    moorings at the S3 seam. Section bugs from it: S2's ground lip 0.57 m over S3's river at the seam; S3's lake ends
    closed by moored hulls.
  - **Sound** live (a parallel session). A UI session is rebuilding the HUD and settings (`web/src/ui/`); it was asked
    for a Quality row.

## The user's open list (from the round-2 reports)

Whole world:
- The mist now starts where you can walk (S4b's cove and S3's far bank read solid). The gate's south keeps its mist
  on purpose (its moved south wall would clear 44 m of unpainted ground and moat): should the lower flight clear too?
- Not built yet: the trackers walking their towpath with their boat, and S7's procession (the retinue stands).
- Boarding a boat, your legs pass through the gunwale for one step (not cheap to fix).
- Weak but used takes: `drive_donkeys`, `lie_wave`, `sit_hold_child`, the idler's `sit_offer`.
- Prompts are yours: the "seventy paces" horizon sentence for `prompts/backdrop_panel.txt` (it works for streets, not
  rivers), and its "pale fresh-green willows" line, which may push green tips.
- The PC: WSL's file cache squeezed Windows to 1.1 GB free during the run. Proposal: `autoMemoryReclaim=dropCache` in
  `C:\Users\ran\.wslconfig` (needs `wsl --shutdown`).

S7, the end: faint shapes built one way (the face at the gate door as a peeking child, low stones, a gnarled tree,
the box shed, the tub as one tall slatted vessel; `pale_shape_1905` left unbuilt); the main hall's motifs fill its
whole front, where the painting hides the lower part.

S4b, the moorings:
- The compromise: each boat at 0.6 of its real length and narrowed, the raft spread to real width, the far bank moved
  5.5 m north into the mist; painted order kept, painted metres not (films in `gen/sections/outer_road_2/pilot/`).
- The mat-cargo boat's gangplank can be climbed, but its painted bow hood closes the top and its porter stands at the
  foot: board it, and the long boat, across the raft. The biggest boat's stern (past the S3 seam) boards only along
  its side.

S3, the Rainbow Bridge:
- Look at the crown's crowd and the sedan-versus-horseman standoff, the big boat under the arch lowering its mast,
  and 十千脚店 under its 彩楼欢门.
- The big boat waits outside the arch's near face (its stem can't pass the 2.86 m soffit) and stays put so its bank
  bridge is safe; a boat under way that touches a bank can still let a walker wade in (page, not fixed).
- The far bank west of the bridge is closed and moved 5.5 m north; the north-bank tavern is narrowed and opened where
  the lengthened north ramp lands on it; the moored south-bank boat boards only at its two ends.
- Faint shapes: `second_horse_19230` (only a head painted) built as a dark horse, `dog_or_donkey_19825` as a donkey.
- The restyle still recomposes the arch (u 18700–20656): reference images only, a prompt call.

S2, the canal:
- Boats you can't board: the passenger boat (u 22545), the mat-cabin boat (25980) and the bottom boat touch nothing;
  the mat-canopy (25145) and mat-cargo (21055) boats take you only to their rims; the hooded-bow cargo boat only by
  its west bridge.
- The HUD ring on the middle north bank lands up to 3 m into the painted river (the bank was widened to walk); the
  boxes are right.
- The river's end at the S1 seam meets a sandy bank in a straight 10 m line, mostly under the mist (shots R2, R5 in
  `gen/sections/countryside/qa/run3/join_shots_s2_s1/`).

S1, the countryside:
- The plank bridge's west landing has a short 35° step on its south half; the yard hedge (`hedge_yard_34265`) reads
  as bright green lumps in the winter scene (duller or barer?); the hall by the 菜地 is 3.0 m deep, not 3.6, to keep
  the road open.
- Map calls: the pale band built as water; the runaway horse built whole and walking (no gallop); the 菜地 as 14 young
  trees; the pale bird not built; the charcoal train walking east as painted (against the title 赶驴入城).

Older map questions (`map/index.md`): the receding direction at the S5|S6 seam (58.24 carried, about 51 measured);
S5's street south edge.

## Next (after performance batch 2; ask the user which)

- **Fix what the review finds,** section by section, with the checks of the restart run (done = the checks PASS and
  the quality bar holds; skill `scroll-section`, playbook step 6), then redeploy (skill `deploy-web`).
- **The open list's decisions** above, and the features it names (towpath trackers, S7's procession).
- **Room and phones, beyond batch 2:** casts trimmed of unplayed clips (`tools/clips_used.mjs`), builder-made low
  detail levels for buildings, and the world in cells if batch 2 only planned it. Half-float bakes and the
  whole-scroll bench are done (`gen/perf/batch1/notes.md`, `gen/sections/world/bench_v1/`).
- **Two section bugs from the boat-flow agent:** S2's ground lip 0.57 m over S3's river at the seam (X 151.1–151.5,
  D 15–24, collider too); S3's lake ends closed by moored hulls.
- **Sound on the page:** live since 2026-10-12 ~20:35 (`web/src/sound.js`, hooks in `world.js` inside try,
  `web/public/assets/sounds/`, check `tools/sound_web.mjs`; M or the bell button; `?sound=0` turns it off). Built by
  a parallel session. Before any deploy, run the regression script
  (`tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>`).
- **Installable app and git:** still unanswered from earlier sessions.
- **Small fixes for the lead:** `characters/woman.json`'s `figure` still crops S7's doctor (it should be
  `S7.fig.standing_woman_1567`, [1545, 712, 1595, 895]); tool requests from the round: an `--enhance` crop on `scroll_map.mjs overlay`, a stop in
  `scroll_pipeline.mjs` when the overview comes back at another size, `CDP_PORT` in `tools/hud_interact.mjs`,
  tiled-UV rounding in `export_web_scene.mjs` for every section (about 10% of each GLB), the pose words `running` and
  `galloping` in `map/README.md`.

## How to work (unchanged, plus round 2's machine rules)

- Images only through `tools/shyfai_image.py`; 3D only through hosted Meshy (say the cost; the user said quality over
  credits).
- Never cheap geometry and never anything unpainted (`map/BUILDING.md`); real size, painted place.
- The machine: headless Blender only through `tools/build_scene.sh` / `tools/blender_slot.sh`; page checks only
  through `tools/chrome_slot.sh` against the check server (`tools/check_server.sh start`, 5190); no agent starts its
  own Chrome or dev server; 5180 is the user's, 9223 the bench's. `tools/machine.sh status` and `sweep` (skill
  `scroll-section`, "Machine resources"). Check results and anything a successor needs go in the repo, not `/tmp`.
- Agents keep records: notes per section, `gen/expand/<name>_lessons.md` with exact skill text; the lead merges them.
- Tell the user the plan in a few lines, do it, check it, record it. The user's bar from round 2: "just pass the
  checks and quality bar, merge them, and have me check is the primary bar"; no progress reports, one final report.
