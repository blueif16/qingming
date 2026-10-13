# Round 2 restart (2026-10-12 evening): finish, join, ship

Every agent of the restart reads this file first, then:
- its role's parts of `build_rules.md`;
- the skill `scroll-section`, "Machine resources";
- `map/BUILDING.md`.

This file wins where they disagree.

## The user's bar (said at the restart)

> "We are not chasing extreme, so just pass the checks and quality bar, merge them, and have me check is the primary bar."

- **Done** means the checks PASS and the quality bar holds; then stop.
  - The checks: `loyalty_check`, `ktx2.mjs check`, `budget_check`, walks alone and joined, `people_check`, and the
    scroll index (projection under 2 px).
  - The quality bar: `map/BUILDING.md` and the skills.
- No polishing past done, and no extra rounds on looks.
- On a judgment call, take the option that passes and record it (`build_choices.json`, your notes). Then add a line
  to "For the user" in your report.
- The user's own look at the deployed world is the primary review. The goal is everything joined, shipped and in front
  of them, with a short list of what to look at.
- **Budget misses:** fix them the cheap way first. Otherwise write the exception, with its reason and numbers, in your
  report; the lead decides and edits `tools/budgets.json`.

## What happened

- **The PC froze at about 18:00.** Running at once were 11 per-agent Chromes and 10 dev servers. The user restarted
  the machine.
- **The previous agents died and can't be resumed.** You pick up from the files.
- **The data is intact** (`tools/integrity_check.py`).
- **The scratchpad (`/tmp`) was wiped.** Lost with it: QA results, walk and shot logs, the join agent's seam shots,
  and the kit factory's test runs.
- **The lead redid:**
  - the canal's final build and export;
  - the workshop's eight rebuilds;
  - the guard in `boats.js` against `run_m` 0.
- The record is `gen/expand/round2_progress.md`, last entry.

## Machine rules (hard)

- **Page checks:**
  - Load pages only from `http://127.0.0.1:5190`. Run `tools/check_server.sh start` first; it does nothing if the
    server is already up.
  - Run every page tool through `tools/chrome_slot.sh <command>`. For a batch, use
    `tools/chrome_slot.sh bash -c 'cmd1 && cmd2'`.
  - There are 3 slots. Waiting for one is normal.
  - Never start your own Chrome or dev server. Never use 5180 (the user's) or 9223 (the bench).
- **Headless Blender** runs only through `tools/build_scene.sh` or `tools/blender_slot.sh`.
- **CPU-heavy steps** run one at a time: `ktx2.mjs encode`, exports, sheets.
- **Subagents:** at most one of your own at a time (a QA agent, for example), and only if it saves you real work. Your
  subagent follows this file too.
- **Images:** read sheets and a few crops, not dozens of full-size images.
- **Durable state:**
  - Check results go in `gen/sections/<folder>/qa/run3/`: the JSON, the logs and the sheets.
  - At the end of every stage, append to your record (your section's `notes.md`, or your report) what landed and
    the exact next command.
  - Your scratchpad folder `scratchpad/<S>_run3_<role>/` is for throwaway scripts only.
- **End of a stage:**
  - Close your tabs. The page tools do this themselves.
  - Kill your own background monitors (`until … sleep` loops).
  - Leave nothing of yours running.
- **Ownership** is as in the skill's "Who owns what", plus what this file assigns. A change you need in a file you
  don't own goes as a request in your report, or to the page agent's queue file (below).

## Roles

### Area finishers: S3 `rainbow_bridge`, S2 `canal`, S1 `countryside`

You own your area's files (`build_rules.md`). Start from:
- your `sections/<folder>/notes.md`;
- the notes under `gen/sections/<folder>/`;
- `gen/expand/<folder>_lessons.md`;
- the state below.

1. **Bring the build current.**
   - If a layout, choice or builder input is newer than `gen/sections/<folder>/web_build/<folder>_raw.glb`, rebuild:
     `tools/build_scene.sh <folder>`.
   - Export: `node tools/export_web_scene.mjs <folder>`. Add `--no-boats` if the boats GLB is newer than the layout.
   - Then `node tools/ktx2.mjs encode`, then `check`.
   - Before the final checks, read `gen/expand/round2/workshop_progress.md` for any take marked not to use, and rerun
     your casting script if one affects you.
2. **The automatic checks:** `node tools/loyalty_check.mjs <S>` PASS; `node tools/budget_check.mjs <folder>` PASS (or
   the exception in your report).
3. **Checks alone, at `world.html?sections=<folder>`:**
   - Walks: `sections/<folder>/walks.json`. Write it if it's missing: routes through the section, every edge stops
     you, decks board and carry where there are boats.
   - Shots: `shots.json`.
   - `people_check` at `?window=all`.
4. **Joined with each neighbour that is already final:** `walks_joined.json`, `shots_joined.json`. S3 joins S4b now.
   Seam fixes in the older section are the join agent's.
5. **HUD:** press Space at 2–3 landmarks. The ring sits on the painted spot and the boxes on the painted figures.
6. **Mark the build final.** Once your GLBs won't change, append `FINAL BUILD <time>` to `sections/<folder>/notes.md`.
   The join agent starts your seams from that line.
7. **The report:** `gen/expand/round2/<folder>_run2_report.md`, in the format of `build_rules.md`, ending with "For
   the user".

State at the restart:
- **S3 `rainbow_bridge`** (built 15:26, boats 15:40, loyalty PASS).
  - The lost QA run had 34 walk routes alone: all PASS with a QA-only boat guard, and 33/34 without it. The failure
    was a walker crossing the route under the arch.
  - The boat NaN defect is fixed in the data (`run_m` 0.2) and in `boats.js`.
  - Still to do:
    - `walks.json` and `shots.json` in `sections/rainbow_bridge/` (the lost ones were in the scratchpad);
    - `people_check`, the budget, the joined checks with S4b, the report.
  - From S4b's report: keep the hulls clear of S4b's sterns (3–6 m past u 15500), and make the north bank meet S4b's
    moved bank.
- **S2 `canal`** (rebuilt and exported by the lead at 18:08 on the latest river plan; loyalty PASS).
  - **The budget FAILS on download:** the section is 9.08 of 9 MB, and with kit and cast it is 23.76 of 20 MB; the
    cast grew with the new takes.
  - There is no `walks.json` or `shots.json`.
  - The earlier QA results are lost; its notes are under `gen/sections/canal/`.
  - The canal boats' crew check was in progress.
- **S1 `countryside`** (built 16:48, 96.5k triangles, loyalty PASS; `walks.json` and `shots.json` exist).
  - The ground agent's last pass took review shots: `gen/sections/countryside/kit_review/ground_eye_*.png`,
    17:37–17:51. Its notes may say whether it meant one more change. If it's unclear, the current build stands.
  - The budget check was running.
  - The S1|S2 seam corners matched S2's exactly at 16:49.

### Join agent: every seam, then the whole scroll

You own:
- the seam work in finished sections: S6 `inner_city`, S5 `gate`, S4 `outer_road`, and S7 `city_end` and S4b
  `outer_road_2` (their area agents are done);
- seam knots in `map/frames/`;
- `sections/world/` (the whole-world walks and shots);
- `gen/expand/round2/joins_report.md`.

1. **S7|S6 and S4|S4b.** What the previous join agent finished:
   - the ground cut at both seams (`inner_city_scene.py`, `outer_road_scene.py`), S7's knots in S6's frame, and the
     soldier on his stool;
   - walks 8/8 across S7|S6 and 4/4 across S4|S4b;
   - `people_check` PASS for S7+S6 and for S4+S4b.

   Its last run, `people_check` on the default world, failed one spot at the gate (−8, 4.1) under a load average of
   40; rerun it. Still to do: shots across both seams, and HUD shots at S7's and S4b's landmarks (the old shots were
   lost).
2. **S4b's boats with the kit factory's new options** (`gen/boats/round2_options.json`, `blender/kit_boats.py`). S3,
   S2 and S1 already shipped boats built after the options landed; S4b's `outer_road_2_boats.glb` (13:23) predates them.
   - Run `node tools/export_web_scene.mjs outer_road_2 --boats-only --rebuild-boats`.
   - Then the S4b deck walks (`sections/outer_road_2/walks.json`) and loyalty.
   - The mat-cargo boat's gangplank (it can't be walked): fix it only if it's cheap; otherwise it goes on the user
     list.
3. **The three new seams, as each side's `FINAL BUILD` line appears:** S4b|S3, then S3|S2, then S2|S1.
   - Apply the seam notes (`map/index.md` "Seams", `gen/map/<S>/merge_fixes.mjs`).
   - Cut the older side's ground to the seam.
   - Walks across each seam both ways; `people_check` joined; shots across; HUD at the new landmarks.
4. **The whole scroll,** after the workshop paid run's `ALL CAST` line in `workshop_progress.md`: all 8
   sections at `?window=all`.
   - `people_check`.
   - `sections/world/walks.json` extended over every section, using teleports (`goto`). The 42 existing walks must
     still pass.
   - `node tools/budget_check.mjs all`.
5. **The report:** `gen/expand/round2/joins_report.md`, ending with "For the user".

### Page agent: `web/src/` and `web/*.html` (the lead delegates them to you for this run)

Fix defects only. Other agents' requests arrive in `gen/expand/round2/page_queue.md`; read it after each item.
1. `world.html`'s default sections become all 8 in scroll order:
   `city_end,inner_city,gate,outer_road,outer_road_2,rainbow_bridge,canal,countryside`. Keep the current start spot.
2. `world.js` `placeTrees` skips `card: "kit"` trees. A willow card stands on S4b's stump.
3. **The mist starts at the walkable area,** not at the raw painted rectangle. The walkable area is the painted area,
   plus recorded moves and `edges`. Today, things moved past the silk's edge turn ghostly white even close up: S4b's
   far bank and two north boats (`web/src/post.js`, `backdrop.js`).
4. `bow_wave` shows only while a boat is under way.
5. **`host()` levels:** figures on roofs, ladders and sterns stand at their host's height. Check which ones float or
   sink in S2, S3 and S4b.
6. The boarding step over a gunwale, where the legs pass through the side for one step: fix it only if it's cheap.

The trackers following their towpath and S7's procession are features, not defects: put them on the user list.

After each change, these must still pass:
- the world's walks, `sections/world/walks.json`, 42/42;
- `web/boats.html` (12/12 walks, 5/5 rides);
- a quick `people_check` on the default world.

Report: `gen/expand/round2/page_report.md`.

### Workshop finisher

You own the workshop's files (the skill's "Who owns what"). Meshy has 1 credit left: no retakes, no new characters.
1. **Review the new takes.** Make clip sheets for the 8 new takes on their casts:
   `tools/chrome_slot.sh node tools/clip_sheet.mjs http://127.0.0.1:5190 <name> <clips> --side`.
   - The takes: `work_sweep`, `reach_over_rail`, `tow_walk`, `sack_carry`, `pole_boat`, `fend_pole`, `haul_line`,
     `chase_run`.
   - Judge each by whether it shows the action the figure really does: hands on the pole, the load on the back.
   - A take that fails is marked not to use in `workshop_progress.md`, with the clip that stands in for it. Areas fall
     back to that clip.
2. **The animals' tack frames:** they timed out under the load. Run
   `tools/chrome_slot.sh node tools/animal.mjs <animal> frames --base http://127.0.0.1:5190 …` for the six tack
   specs.
3. **Record** in `workshop_progress.md`: what passed, what's not to use, and the stand-in for each.

Finish this first: areas read it before their final checks.

### Workshop paid run (added at about 18:50)

The user added a new Meshy account (1,100 credits, now line 1 of `~/.meshy_keys`; the spent one is retired) and asked
for everything still waiting to be made, with the casts replaced to match.

**You own:**
- the new characters' files, `characters/<new>.json` and `gen/characters/<new>/`;
- the new takes, `gen/motions/<take>/<account>/`;
- your lines in `workshop_progress.md` (append only).

The workshop finisher still owns the review of the first eight takes. Run `character.mjs build` on existing
characters only after its line "take review done" is in `workshop_progress.md`; until then, build only the new
characters. A take it marks "retake wanted" is yours to retake.

1. **The list:** `character_gaps.md` and catalogue §1a and §8 (a), in rank order, skill `characters`.
   - The 8 characters: straw_hat, dark_hat, tracker, farmer, groom, youth, official_rider, and woman_pale if the
     recolour doesn't read.
   - The takes, items 13–43.
   - The buffalo body, only if the free one doesn't read.

   One account now, so characters can run in parallel; Meshy tasks are remote and cheap on the machine. The local
   steps (sheets, retargets, builds) run one at a time.
2. **Check each delivery the skill's way** (clip sheets through `tools/chrome_slot.sh`, palette, size) before it is
   cast.
3. **Replacements:** for each area a delivery serves, once that area's `FINAL BUILD` line is in its notes (its finisher
   is done):
   - rerun `gen/sections/<folder>/make_people.py`;
   - `node tools/map_layout.mjs <S>`;
   - `node tools/export_web_scene.mjs <folder> --no-boats` (people and data; the geometry doesn't change);
   - `loyalty_check`, `ktx2.mjs encode` and `check`;
   - `people_check` at `?window=all` through a Chrome slot.

   For an area still being finished, write the delivery in `workshop_progress.md`; you do its replacement after the
   `FINAL BUILD` line.
4. **The cast's size:** new characters add to each area's download. Run `node tools/budget_check.mjs <folder>` after
   each replacement and report any miss with numbers. The lead decides.
5. **Record:** a line per delivery in `workshop_progress.md`, update `character_gaps.md` (what's done, what's left),
   and end with the line `ALL CAST <time>`. The join agent's whole-scroll pass waits for it.

## The lead

- Watches `tools/machine.sh status` and reads the records.
- Applies budget exceptions.
- When everyone is done: a real-GPU bench with nothing else running, the deploy (skill `deploy-web`), merging the
  lessons files into the skills, `NEXT_SESSION.md`, and one final report to the user with what to look at.
