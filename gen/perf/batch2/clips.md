# Perf batch 2, round 2: per-clip animation files (the clips agent)

Item: `gen/perf/proposal.md` rank 8 ("First load": clips fetched per clip as routines ask) and rank 7's notes on
bakes. Brief: `brief.md`, "Round 2 of the batch". Layout agreed with 3d-director-2e through the lead (2e chose to put
the split into `character.mjs build`; its three conditions are met, below).

## What landed

The idea: a character's GLB carried every clip it has (idler 66, boatman 38, IK variants included), but a section
plays a few of them. The page used to fetch whole casts and play about half their animation bytes. Now the page
fetches a body per character and, for each section it loads, only the clips that section's people play.

- **The full GLB stays as it is.** `web/public/assets/chars/<name>.glb` (every clip), `characters.json` and
  `clip_meta.json` (keyed per full GLB file and clip) are unchanged. Every tool reads them as before: clip_ground,
  joint_tracks, carry_check, eye_check, char_lod, ktx2, chars.html and creatures.html.
- **`tools/clip_split.mjs`** cuts files from each full GLB:
  - `assets/chars/body/<name>.<hash>.glb`: the meshes, skin, carried props, textures and the idle clip. The images
    keep the same bytes, so the KTX2 copies still match. char_lod's `extras.lod` index is carried, and its accessor is
    renumbered.
  - `assets/chars/clips/<name>/<clip>.<hash>.glb`: each other clip alone, with the nodes it moves.
  - `assets/chars/clips.json`: per character, `src` (the full GLB's sha256, first 8 hex), `body`, `base` and `clips`.
  - **Bytes are copied, not re-encoded.** Each accessor's stored meshopt elements are cut out still filtered, then
    compressed again losslessly under the same filter. Every key therefore decodes to the same value as in the full
    GLB, and the tool checks every array after writing (a mismatch fails the run).
    - A first try re-encoded through gltf-transform. Its QUATERNION filter isn't idempotent, so the read-back failed.
      The lossless fallback came out 2x bigger.
  - **Names are content hashes.** The build leaves them out of the page's inline map, so world.html stays at
    13.3 KB brotli; with plain names it grew to 18.0 KB. The CDN serves them immutable, and an unchanged clip keeps
    its name across deploys.
  - **Writes are atomic.** Each file and the manifest go to a temp file that is then renamed. A character is unlisted
    while its files are rewritten, and listed again after everything reads back the same. A failure exits 1 and
    leaves that one character unlisted, so the page loads its full GLB. Old files are deleted.
  - Runs: all 34 characters in about 1.2 s. An unchanged character is skipped (`--force`); `--check` exits 1 when a
    split is stale. `--pub`/`--out` work on copies.
- **Hooks**, so the split never goes stale:
  - `tools/character.mjs` `build` and `all` call `clip_split.mjs <names>` after `registry()`, inside the same flock.
    A failed split fails the build. It has already run in 2e's 07:15 build.
  - `tools/char_lod.mjs`, when it writes a `chars/*.glb` in place, re-runs clip_split for those characters at its
    end.
- **`web/src/cast_clips.js`** holds the clip rules the page and the tools share:
  - `castClips(people, castAs)`: per character, every string in a figure's or walker's own people.json entry that
    names one of its clips, plus idle, walk (walkers), ride (riders) and a tracker's boat haul walk and stand.
  - `trafficClips(spec)`: the load test's traffic.
  - `settlePending` and `LATE_CLIPS`: the late path, below.
- **`web/src/world.js`**:
  - It fetches `clips.json` at start (`?clipfiles=0` loads the full GLBs as before).
  - `splitOf(n)` uses a character's split only when it lists every clip characters.json gives that character and its
    `src` equals the build's content hash of the full GLB (`window.__qmAsset`; the dev and check servers trust the
    manifest). Otherwise the page loads the full GLB, so a stale split costs bytes, never a wrong clip.
  - `ensureModels(names, clips)` loads the bodies and the section's clips side by side, and adds missing clips to
    models already in. It is used by `loadSection`, the first section's cast, `setAvatar` and the start (idle, walk
    and run for your own character) and `setCrowd`.
  - `stream.stats()` gains `split` and `lateClips`.
- **`web/src/people.js`**:
  - `loadCharacters(..., split, want)`: the body instead of the full GLB, with the clips fetched beside it.
  - `prefetchClips` and `loadClips`: each clip is grounded and measured exactly as before (CLIP_META keys are the
    full GLB's), after one pause.
  - `Person.play` and `playPending`; `People.remove` drops a pending wait.
- **`web/src/crowd.js`**:
  - `CrowdPerson.play` and `playPending`.
  - `Crowd.update` keeps a person who hasn't been drawn yet hidden while its first clip is still on its way.
- **The late path** covers any clip the section didn't list (none in practice: `lateClips` stayed empty over the
  whole world). The person plays idle and waits; when the clip lands it plays it, straight in if nobody has seen
  them yet.
- **Tools**:
  - `cast_clips_check.mjs` also FAILs when a character's split is stale, or when a clip people.json asks for isn't
    fetched with its section.
  - `budget_check.mjs` counts what the page downloads: the body, its KTX2 copies and the clips the section plays
    (animals stay full GLBs). It also prints the full-GLB figure.
  - `people_precompute.mjs` loads with `?clipfiles=0`, so it still measures every clip.

## Numbers

**Download per section with kit and cast** (`node tools/budget_check.mjs all --no-load`, raw bytes; the same tree,
full GLBs -> split):

| | before, MB | after, MB | cast before -> after |
|---|---|---|---|
| rainbow_bridge | 27.86 | **21.75** | 18.59 -> 12.48 |
| canal | 26.77 | 20.54 | 16.81 -> 10.58 |
| outer_road | 20.66 | 15.82 | 12.04 -> 7.20 |
| outer_road_2 | 19.63 | 13.47 | 13.92 -> 7.75 |
| inner_city | 19.40 | 15.73 | 13.39 -> 9.72 |
| gate | 19.47 | 14.86 | 10.54 -> 5.93 |
| countryside | 19.06 | 14.37 | 10.52 -> 5.83 |
| city_end | 12.77 | 8.60 | 8.41 -> 4.24 |

Every clip of the whole world (all sections loaded) costs a little less than the full GLBs: raw 16.3 vs 17.5 MB,
brotli 9.4 vs 10.0 MB. Some clips are never played anywhere.

**First load.** `gen/perf/probe.mjs load`, phone viewport, CPU 4x, fast 4G, `--warm 1`, `?tier=low`. Three sides,
interleaved A B C, two reps each (`clips/run_load.sh`):
- before = 5195;
- full = my snapshot with `?clipfiles=0`, which isolates this item;
- split = my snapshot.

| | before (5195) | full | split |
|---|---|---|---|
| cold, can walk | 12.1 / 9.8 s | 9.8 / 12.8 s | 11.4 / 9.0 s |
| cold, first window in | 39.5 / 37.1 s | 34.0 / 34.4 s | **29.4 / 30.3 s** |
| second visit, can walk | 2.8 / 3.0 s | 4.0 / 5.3 s | 4.2 / 3.2 s |
| second visit, first window | 6.6 / 8.4 s | 7.7 / 8.9 s | 8.8 / 7.1 s |

- The cast the loading screen waits for (your character and the pinned townsman): 1951 KB -> 939-978 KB. The walk
  times are inside the noise.
- Complete byte counts (`loading/load_detail.mjs`, resource buffer 5000, one run each):
  - first window in: 31.4 -> 26.7 MB, 33.5 -> 30.7 s, 252 -> 372 requests;
  - every tree card full: 38.8 -> 34.1 MB.
- Slow 4G, cold, one run each: can walk 49.3 -> 44.0 s, first window 167 -> 143 s.
- The second visit is slower on my snapshot than on 5195 in both modes. That comes from other work in the tree,
  not this item.

**Streaming** (`probe.mjs stream`, phone viewport, CPU 4x from the start, 13 section loads, two runs each, full vs
split on the same snapshot; `clips/stream_summary.txt`):
- The longest frame per load, median: 335 / 353 ms full, 302 / 260 ms split.
  - Worst: 532 / 724 ms full, 639 / 905 ms split. Each run's worst load was canal or outer_road_2, which have long
    tasks in both modes.
- The most baking in one frame: 15 / 40 ms full, 20 / 50 ms split. **The bakes don't stall.**
- The load operation takes longer, with no network throttling: median 1.9 / 1.5 s full, 2.4 / 2.3 s split.
  - Each clip file is its own fetch and parse, about 5 ms a file at 4x (`clips/parse_cost.mjs`), spread over tasks.
  - A section whose cast is already in now fetches its clips; with full GLBs it had them.
  - On a real link the smaller downloads outweigh this.
- Peak JS heap: 360 / 401 MB full, 304 / 354 MB split.

**Memory** (`probe.mjs memory`, phone, low tier): JS heap used at the crown 70.6 -> 47.8 MB, at the storyteller
64.6 -> 49.8 MB. The bakes are the same (21.0 MB and 12.8 MB): the same clips are baked.

**Same people** (`clips/split_probe.mjs`, every section loaded, split vs `?clipfiles=0`):
- 897 people in both. Each person asked for and had the same clips (0 differences), no late clips, no page errors.
- With `?clipmeta=0` (the page samples every clip itself), 349 clips gave the same grounding, stride, speed and hips
  height in both modes, i.e. the same key data.
- `clips/late_test.mjs`: a clip started before it came plays idle, then the clip, for a crowd person and for your
  own character.

**Phone proxy frame rate** (bench_page, full vs split on the same build, A B A B): the runs swung 2x (crown 42 / 82
fps full, 46 / 52 fps split). Draws and triangles are the same, and nothing changes per frame by design.

## Checks

- `node tools/cast_clips_check.mjs`: PASS (split current for 34 characters). `clip_split.mjs --check`: PASS.
- `check_deploy.mjs` on 5196: PASS (8 sections, 34 boats).
- Regression `b2_clips` (`gen/expand/round2/page_qa/b2_clips/`):
  - world 209/211, boats 12/12, rides 5/5;
  - people: only the two stale gate spots, sizes 0.
  - The two world fails:
    - **S3 "north edge … by the painted figures at the edge"** ends at D 29.1 instead of 29.5-30.3. It fails the same
      way with `?clipfiles=0` on the same snapshot (2/2) and passes on 5195. So it comes from a tree change since the
      batch start (rainbow_bridge re-exported at 07:16, walks.json edited at 07:13), not from this item. That is the
      details session's business.
    - **S2 "back ashore from the hooded-bow cargo boat"** is a flake: 4/4 on reruns in both modes.
  - The regression's contacts step rewrote `gen/details/contacts/summary.json` from my snapshot, as every regress run
    does.
- Look (`clips/look/`, `clips/look_same/`): crown, storyteller and grain_wharf against 5195, and full vs split on the
  same build. Same people in the same places doing the same things; only their timing differs.

## Skipped, and the next step

- Animals stay full GLBs (4-9 clips each; small).
- The next step, quick: fetch the next section's clips during idle time, at low priority. This is the
  window-neighbour prefetch the loading agent suggested for the first section.
- Later: a light clip parser instead of GLTFLoader for clip files, which would save the 5 ms a file (nodes, scene),
  but only if a section's load time on a phone ever matters more than its bytes.
- Clips stay loaded while their model stays in. Pruning them per section would save JS heap only; the bakes already
  prune.
