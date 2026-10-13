# Perf batch 2: the brief every engine agent reads first (lead: 3d-director-04, 2026-10-13)

The goal is reach: anyone, on whatever device, phones first. The user: "We are not trying to optimize it on my
machine. I want more people to see it and play it, even on their phone." For this batch the user also said: "do the
easy optimizations that remain… we don't need solid rigid checks… since we have researched them, tune settings and do it
right now and be quick." So: apply the known best practice without long deliberation; if an item turns out not to be
quick, land the simple version or skip it, and write down why.

## Read first (only what your item needs)

- `qingming/CLAUDE.md`; `gen/perf/proposal.md` (your rank's row and its section); `gen/perf/batch1/notes.md` (what landed,
  how it was measured); the skill `web-scene` (batch 1's lessons are in it); `reference/messenger_study/world_notes.md`
  (study only, never copy anything from it into the project).
- Already landed today by the lead (do not undo): stepped shading by default (`shading: 'toon'`), boats by device
  (`world.js` `boatMode`/`boatCap`, `tiers.js` `flowCap` 0/3/6, a Boats row in settings): by default the full and
  balanced tiers run `?boatflow=waves` behaviour, light runs `painted`. `?boatflow=moored` gives the old behaviour.

## The machine (hard rules; skill `scroll-section`, "Machine resources")

- Pages only through `tools/chrome_slot.sh <cmd>` (it waits for a free Chrome slot). Never start your own Chrome or
  dev server. The check server is `tools/check_server.sh` (5190, a dev server on the live `web/` tree).
- Blender only through `tools/blender_slot.sh` / `tools/build_scene.sh`.
- `tools/machine.sh status` when you start and whenever a job seems stuck. If Windows free memory is under ~2 GB or
  jobs stall at the slot gate, stop and tell the lead (the user may need to drop WSL's file cache).
- Everything a successor needs goes in the repo (`gen/perf/batch2/`), never only in `/tmp` or a scratchpad (it is
  wiped at reboot).

## Shared tree

- Several sessions edit `web/` at once. The details session (3d-director-2e) owns `sections/*/people.json`,
  `characters/*.json`, the character GLBs (`web/public/assets/chars/`, `characters.json`, `ktx2/emb`) and
  `tools/build_character.mjs`; leave all of those alone. Its plan: `gen/details/plan.md`.
- Other engine agents of this batch edit `world.js` too. Re-read a file right before each edit, keep edits small,
  never reformat or move another block. Match the code's comment style (plain sentences, what and why).
- **Snapshots:** build your state into your own folder and serve it statically, so other agents' half-done edits
  don't break your measurements: `cd web && ./node_modules/.bin/vite build --outDir ../gen/perf/batch2/<you>/build
  --emptyOutDir --logLevel warn`, then `python3 gen/perf/batch2/serve.py gen/perf/batch2/<you>/build <port>
  web/vercel.json &` (ports: frame-rate agent 5196, loading agent 5197, cells agent 5198). Kill your server when done
  and delete your build folders at the end (they are ~100 MB each); keep logs and numbers.
- **Never deploy.** Deploys go through the lead.

## The baseline

`gen/perf/batch2/before_build`, served on **5195**: the tree at the start of batch 2 (the lead's defaults included).
Compare against it, never against the live site.

## Checks (light, as the user asked)

For each item, before you call it done:
1. `tools/chrome_slot.sh node tools/check_deploy.mjs http://127.0.0.1:<port>/world.html` PASS (no 404s, no console
   errors, every section streams in).
2. The numbers: `tools/chrome_slot.sh node tools/bench_page.mjs "<url>/world.html?tier=low&adapt=0" <out>
   --configs gen/perf/batch1/bench_phone.json --secs 3 --viewport 390x844x3` (the phone proxy) against the same on
   5195, interleaved A B A B (`gen/perf/batch2/ab_bench.sh <out> http://127.0.0.1:5195 http://127.0.0.1:<port> phone`
   does exactly that; add `high` for the desktop). Memory if your item touches it: `gen/perf/probe.mjs memory`. Keep
   what improves the phone proxy; drop what doesn't, and say so.
3. A look at two or three of the fixed views (storyteller, crown, under_arch, grain_wharf, moorings_bank, farmsteads;
   `?hour=11`), e.g. with `gen/perf/batch1/look_tiers.sh`, compared by eye with 5195: the same picture.
4. Once, when your item is finished: `WORLD_URL=http://127.0.0.1:<port>/world.html BOATS_URL=http://127.0.0.1:<port>/boats.html
   tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh b2_<you>` and the expected result: world walks 211
   (one known flake: S4b "back ashore from the arched-awning boat", S2's north-bank yard walks), boats 12/12, rides
   5/5, people failing only on the two stale gate spots, sizes 0.

No per-tier matrix, no full look sweep: the lead runs one full regression before the deploy, and the user reviews the
deployed world.

## Records

- Your notes: `gen/perf/batch2/<you>.md`: what landed (files, the idea in a few lines), the numbers before and after
  and how they were taken, what was skipped and why, the next step.
- Lessons for the skill: `gen/perf/batch2/lessons_<you>.md`, with the exact text to merge into `web-scene`. The lead
  merges them.
- Your final message to the lead: a short summary (what landed, the phone-proxy numbers, the check results, files
  touched, anything the user must decide). No progress messages before that.

## Round 2 of the batch (after the 06:30 deploy): the character items

These were held until the details session (3d-director-2e) finished rebuilding the casts. Its terms (2026-10-13):
- **Builds stay under `flock /tmp/qingming_charbuild.lock`** (`tools/character.mjs build`, clip_ground, joint_tracks,
  ktx2 all take it). Anything that writes `web/public/assets/chars/`, `characters.json`, `clip_meta.json` or `ktx2/`
  takes the same lock. The details session's fixers keep adding IK variants between builds, so no freeze is needed.
- `character.mjs build` fails rather than silently drop a clip, and fails if two clips share a hips accessor (people.js
  grounds a hips array once: the `GROUNDED` WeakSet in `prepareClip`). Keep both guards.
- IK variants (`<clip>~<spec>`) are ordinary clips.
- `clip_meta.json` stays keyed per character file and clip unless you agree a new key with 3d-director-2e (it updates
  `tools/clip_ground.mjs` and joint_tracks, which read it).
- `node tools/cast_clips_check.mjs` (every clip a shipped people.json asks for exists) must keep passing; update it for
  any new layout.
- Message the lead before any change to the character GLB layout lands; the lead tells 3d-director-2e.
- Machine notes from round 1: `pkill -f`/`pgrep -f` match your own shell; kill by PID. The first teleport after load
  used to drop the player (fixed in `goto`); if a bench's warm-up view lands wrong, say so.
- The phone budget that matters most: rainbow_bridge downloads 27.4 of 28 MB with kit and cast
  (`node tools/budget_check.mjs all --no-load`).
