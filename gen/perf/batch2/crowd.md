# Perf batch 2, round 2: the crowd agent's far bodies (2026-10-13)

The item: `gen/perf/proposal.md` rank 5, "an index-only LOD past ~20 m", with the distance set per tier. Landed in the
**no-split** form the lead chose: a character is drawn with its far body only when all its people in view are past the
tier's LOD distance. The split form is in the code behind a switch, off by default, for a test on real phones. The
shipped GLBs carry the far bodies since 07:11 (written under the char-build lock). Snapshot on 5197 (since deleted), tools
and raw numbers in `gen/perf/batch2/crowd/`. Not deployed.

## What landed

- **`tools/char_lod.mjs`** (new): meshoptimizer's simplifier (`simplify`, a quarter of the triangles, error at most 2% of
  the model's extent (about 3.4 cm on a 1.7 m figure), border locked) runs on each body of 1000 triangles or more.
  - Bodies: 34 characters (4.1-4.4k -> 1.02-1.13k triangles, 1.7-3.4 cm) and 12 animals (3.2-4.3k -> 0.8-1.16k). The bird
    (382 triangles) is left as it is.
  - The result is appended to the same GLB as one bufferView, meshopt-compressed like the file's own indices, and one
    accessor. The body mesh gets `extras.lod = { accessor, count, of, verts, tris, err }`. Nothing else changes: every
    byte already in the file stays where it was (checked: `crowd/lod_verify.mjs`). Vertices and UVs are untouched, so the
    bake drives the far body exactly like the full one, and the scholar's single face island stays as it is.
  - Cost: +3 KB a GLB. `budget_check all --no-load` PASSES every section (rainbow_bridge 21.76 MB with kit and cast,
    after the clips split).
  - Options: `--check` lists bodies without one, `--out <dir>` writes into a copy, `--parts N` also simplifies props and
    tack of N or more triangles (not used: props stay full, so the carried children never change).
  - Writing in place into `chars/` re-runs `tools/clip_split.mjs` for those characters. That tool carries
    `extras.lod` into `chars/body/` with the accessor renumbered, which the page now loads.
- **Builds keep it.** `tools/character.mjs` `splitClips` calls char_lod on the GLBs it just built, before clip_split (the
  order the details session asked for). `tools/animal.mjs` `build` calls it after `gltf-transform optimize`.
- **`web/src/people.js`** `farBodies(gltf)` (in `loadCharacters`, for full GLBs and split bodies alike): if a skinned
  mesh's `extras.lod` still fits it (full index and vertex counts), its accessor is loaded through the GLTFLoader parser
  into `geometry.userData.lodIndex`. A GLB rebuilt or rewritten since then has no far body, so the full one draws.
- **`web/src/crowd.js`**
  - Each batch whose source mesh has a `lodIndex` gets a second InstancedMesh, `crowd_<name>_far`. It shares the vertex
    attributes (the same attribute objects, so one GPU upload), the material (so no program or material switch), the
    depth material and the bake uniforms, and has its own instance matrices and rows.
  - `Crowd.update` sends a person past `lodFar` to the far mesh. By default (`lodSplit = false`) the far people of a
    character who also has people nearer stay in the full draw. So the far mesh draws only when all of that
    character's people in view are far, and the draw count is never higher than before.
  - `lodSplit = true` (`?lodsplit=1`): a character with people near draws its far ones apart when there are `lodMin`
    (3) or more of them.
  - `fill()` writes one mesh (near ones first, the shadow and ink counts as before; empty meshes leave the passes).
  - Instance buffers now upload only the rows in use (`addUpdateRange`; before, the whole capacity every frame).
  - `normalPass`, `meshes()` and `stats()` (`far`) cover both meshes.
- **`web/src/tiers.js`** `peopleLod` sets the distance per tier: low 20 m, mid 30 m, high 50 m. At each of these a
  person is about 70 px tall: low and mid on a phone held upright, high on a 4K screen.
- **`web/src/world.js`** sets `crowd.lodFar` from the tier, at load and on a tier change. Overrides:
  `?peoplelod=<m>` (`Infinity`: never) and `?lodsplit=1`.

## Numbers (phone proxy: `?tier=low&adapt=0`, 390 x 844 at DPR 3, CPU 4x; in one page)

The shipped form against the far bodies off, same page and view, counted from the crowd's meshes
(`crowd/probe_lod.mjs`: `probe_shipped.json` vs `probe_off.json`):

| view | people drawn far | crowd's colour pass, triangles | frame, triangles (all passes) | draw calls |
|---|---|---|---|---|
| crown | 5 of 123 | 465k -> 449k (-3%) | 772k -> 756k (-2%) | 127 = 127 |
| grain wharf | 24 of 65 | 206k -> 133k (**-35%**) | 466k -> 393k (**-16%**) | 148 = 148 |
| storyteller | 0 of 65 | 229k = | 403k = | 99 = 99 |

- **Frame CPU and GPU ms:** no change beyond the machine's noise, and none is possible on the CPU side, since the draws
  are the same.
  - In-page A/B `crowd/inpage_nosplit_phone.json` (12 rounds, A B B A, the regression running beside it), paired medians:
    CPU crown -6.0%, grain wharf +7.4%, storyteller +2.3%. The storyteller had no far people at all, which shows the
    noise floor.
- **The crowd's own pass** (`crowd/crowd_pass.mjs`: the crowd group drawn alone 20 times into the colour target between
  frames, GPU timer query): grain wharf -9…-17% GPU. The whole pass is 0.05-0.15 ms on the 4070, so the proxy's GPU can't
  show a gain. The saving is for vertex-bound phone GPUs.
- **The split form**, for the record (`lodSplit`, lodMin 3; files `inpage_lod20min3_phone.json`,
  `inpage_lod20_phone_r16.json`, `inpage_split_crown.json`, `pass_lod20_*.json`):
  - Triangles: crown -9%, grain wharf -18%, storyteller -3…-4% of the frame.
  - The crowd's pass on the GPU: -10…-16%.
  - Draws: +4 at the crown, +1 at the grain wharf, +0-1 at the storyteller, about 0.05 ms each at 4x.
  - Frame CPU, pooled over 38 rounds: crown +4.9% median (B lower in 15/38, not significant), grain wharf +1.8%,
    storyteller -1.7%.
  - So no gain on the proxy in ms, which is why the lead shipped the no-split form. Splitting with lodMin 1 cut the crown
    by -14% of the frame's triangles for +12 draws.
- High tier at 1920 x 1080, 40 m, split (`inpage_lod40_high.json`): the 4070 draws the frame in 2.5 ms of GPU, so there
  is nothing to win there. Triangles -8% at the crown.

## Look (frozen time, pixel diff against far bodies off: `crowd/look.mjs`, a copy of batch 1's)

- Low at 20 m (`look_low/`): crown 0, grain wharf 0.005%, storyteller 0 of the pixels changed; split 0.004 / 0.005 / 0.
- Mid at 30 m (`look_mid/`): 0 / 0.002% / 0.
- High at 50 m and 40 m, 1080p (`look_high/`): no pixel changed.
- Everyone on the far body, near people too (`all`): 6.8% / 3.1% / 1.1% changed. Up close the faces and folds are visibly
  coarser, with no broken triangles and the skinning right. So the distance is what keeps it invisible.
- The low look run logged 36 "GL_INVALID_VALUE: glGetProgramiv: Program object expected" warnings. This is the frozen-clock
  flake the frame-rate agent saw before this change (`framerate.md`). The mid and high runs, check_deploy and the probes
  had none.

## Checks

- `check_deploy` (snapshot built after the char_lod run, `window=all`): PASS, 8 sections, 34 boats, 250 requests, 18.3 MB.
- Regression `b2_crowd` (`gen/expand/round2/page_qa/b2_crowd/`):
  - world 210/211. The fail is "S2: back ashore from the hooded-bow cargo boat", which also fails in `b2_clips` just
    before this and in older runs: a boat-walk flake, not the crowd.
  - boats 12/12, rides 5/5.
  - people: FAIL only on the two stale gate spots (X 7 D 3.9, X -8 D 4.1); sizes 0.
- `char_lod.mjs all --check` and on the bodies: every body has one. `clip_split --check` PASS (34),
  `cast_clips_check` PASS. `budget_check all --no-load` PASS.

## Files

`tools/char_lod.mjs` (new), `tools/character.mjs` (splitClips: one call), `tools/animal.mjs` (build: one call),
`web/src/crowd.js`, `web/src/people.js` (farBodies), `web/src/tiers.js` (peopleLod), `web/src/world.js` (peopleLod(),
`?peoplelod`, `?lodsplit`). Data: every `web/public/assets/chars/*.glb`, `chars/body/*.glb`, `chars/clips/**` and
`clips.json` (re-split by clip_split), and `web/public/assets/animals/*.glb` except the bird.

Tools in `gen/perf/batch2/crowd/`:
- `snapshot.sh`: build into `crowd/build`.
- `probe_lod.mjs`: far and full people, crowd triangles, draws.
- `inpage_ab.mjs`: the frame-rate agent's tool plus triangles and `--install/--collect` hooks.
- `crowd_pass.mjs`: the crowd's pass alone, GPU and CPU.
- `paired.py`: paired A/B differences.
- `look.mjs`, `lod_time.mjs` (the simplifier's speed: 1.1-3 ms a body in node, so doing it at load time would cost
  about 5-12 ms a character at 4x), `lod_verify.mjs`.

## Next

- A real phone with `?lodsplit=1` (and `?peoplelod=15`) against the default. The split's +4 draws buy about 70k fewer
  skinned triangles at the crown. Only a vertex-bound GPU can say whether that pays.
- Props and tack of 1000+ triangles (the carried children, 2k; panniers, 1.5k) could get far bodies too (`--parts 1000`).
  Each is a batch of its own, so the same draw rule would apply.
- The rank-5 L item, one draw a pass for all characters (body textures in an array), would make the split free: near
  and far would be two index ranges of one draw list.
