# Lessons from the clips agent (perf batch 2, round 2): exact text to merge

## web-scene, "Loading": add after "Each clip's grounding and stride, and each walker's corridor, come from people_precompute.mjs"

  - **Characters load as a body plus the clips a section plays** (per-clip files: `tools/clip_split.mjs`, manifest
    `assets/chars/clips.json`).
    - The body (`assets/chars/body/<name>.<hash>.glb`) holds the meshes, skin, props, textures and idle. Each other
      clip is its own file (`assets/chars/clips/<name>/<clip>.<hash>.glb`).
    - `world.js` fetches the clips a section's people.json names (`web/src/cast_clips.js` `castClips`) with that
      section's cast, before `populate`, so nobody starts a clip that isn't there. Walkers read their walk's stride
      when they are added.
    - A clip started anyway (`settlePending`) plays idle until it lands. Someone not drawn yet stays hidden until then.
      Each case is counted in `__test.stream.stats().lateClips`, which should stay empty.
    - The full GLB (`chars/<name>.glb`, every clip) stays the source for every tool and review page, and
      `clip_meta.json` stays keyed by it.
    - The page uses a split only while it covers every clip characters.json lists and its `src` equals the build's
      hash of the full GLB. Otherwise it loads the full GLB: a stale split costs bytes, never a clip.
    - `?clipfiles=0` loads the full GLBs, as `people_precompute.mjs` does.
    - The download per section with kit and cast dropped by about a quarter (rainbow_bridge 27.9 -> 21.8 MB). The first
      window comes in 4 s sooner on fast 4G (24 s on slow 4G).
  - A file an exporter names by its own content hash (`<name>.<8 hex sha256>.<ext>`, as `assets/tex/` and
    `clip_split.mjs` do) stays out of the page's inline map, and the CDN serves it immutable. Do that only when the
    exporter's own manifest lists the names and the exporter deletes the old ones. Hundreds of plain names would have
    grown world.html's map by 4.7 KB brotli (13.3 -> 18.0 KB).

## web-scene, "Checking a change for every device": add

  - **A same-build A/B isolates an item** when its page has an off switch (`?clipfiles=0`, `?smallcards=0`,
    `?shadowcache=0`): the same snapshot with and without, interleaved, beside the batch's baseline. Against 5195
    alone, other agents' work in the tree moves the numbers too. On the clips run, the second visit was slower in
    both modes of the new snapshot.
  - **When re-packing meshopt data, cut it out still filtered.** Decode a buffer view without its filter
    (`MeshoptDecoder.decodeGltfBuffer(out, count, stride, src, mode)`), take each accessor's stored elements, and
    compress them again with `encodeGltfBuffer(..., 'ATTRIBUTES', 0)`, declaring the same filter. That is lossless.
    Re-encoding decoded values through gltf-transform's FILTER method isn't (its QUATERNION filter moves keys by an
    LSB), and its lossless QUANTIZE fallback doubled the clip bytes. Check the result by reading every array back.

## characters, the steps table, `build` row: add at the end of "What it does"

  ; then `tools/clip_split.mjs` cuts the world page's body and per-clip files from the new GLB (inside the same lock;
  a failed split fails the build)

## characters, after "After every `build` (and an animal's), run `node tools/ktx2.mjs encode` and `check`": add

Anything else that rewrites a shipped character GLB has to cut its split again:
`flock /tmp/qingming_charbuild.lock node tools/clip_split.mjs <name>`. `char_lod.mjs` does this itself.
`node tools/cast_clips_check.mjs` FAILs on a stale split. A stale split still works on the page, which loads that
character's full GLB, but it costs the bytes.
