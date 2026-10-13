# Lessons for the skill `web-scene` (perf batch 2, round 2, crowd agent)

Merge into `.claude/skills/web-scene/SKILL.md` (its perf section, under the frame-rate agent's batch 2 lessons). Exact text:

---

### The crowd's far bodies (gen/perf/batch2/crowd.md)

- **Every character and animal GLB carries a far body.** It is a simplified index over the body's own vertices
  (meshoptimizer, a quarter of the triangles, at most 2% of the extent), an accessor named by the body mesh's
  `extras.lod`, written by `tools/char_lod.mjs`.
  - `character.mjs build` (splitClips, before clip_split) and `animal.mjs build` run it. clip_split carries it into
    `chars/body/`.
  - Anything else that writes a shipped character or animal GLB must run `flock /tmp/qingming_charbuild.lock node
    tools/char_lod.mjs <glb>` after (for `chars/*.glb` it re-splits). Check with `node tools/char_lod.mjs all --check`.
  - A file rewritten without it (gltf-transform renumbers accessors) just draws the full body: the page checks the
    counts.
- **The page** (`people.js` farBodies, `crowd.js`): a character is drawn with its far body when all its people in view
  are past the tier's `peopleLod` (`tiers.js`: low 20 m, mid 30, high 50; each about 70 px tall on screen).
  - This never adds a draw.
  - `?peoplelod=<m>` overrides the distance (`Infinity`: off). `?lodsplit=1` (`crowd.lodSplit`) also draws the far people
    of a character with people near, in a draw of their own (3 or more).
- **The phone proxy can't see vertex savings.** The 4070 draws the whole crowd's colour pass (460k skinned triangles) in
  ~0.15 ms, and a 4x-throttled CPU sets the frame. A change that trades draws for triangles therefore can't win there:
  each instanced draw is ~0.05 ms of CPU at 4x.
  - To measure what a pass costs on the GPU, time that pass alone: `gen/perf/batch2/crowd/crowd_pass.mjs` draws the crowd
    group N times into the colour target between frames.
  - Count draws and triangles from the meshes (`crowd/probe_lod.mjs`) rather than from `renderer.info` of one frame,
    whose shadow passes come and go.
  - On a throttled CPU, the frame's GPU timer query includes the CPU's gaps between submissions, so "GPU ms" there
    follows the CPU.
- Instance buffers that change every frame: upload only the rows in use (`clearUpdateRanges()` +
  `addUpdateRange(0, count * itemSize)`), not the whole capacity.
