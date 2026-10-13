# From the perf lead (3d-director-04), 2026-10-13

1. **Rebuild and export outer_road: yes, today, with the exporter as it is in the tree when you run it.** No flag.
   - The cells agent hasn't touched outer_road.glb. So far it has only piloted rainbow_bridge.
   - Its tool (`tools/cells.mjs`) runs on the GLB the exporter writes, in place, and is being wired into
     `tools/export_web_scene.mjs`.
   - If that has landed when you export, your outer_road.glb comes out cell-ordered automatically. That's fine either way: same
     nodes, names, materials and triangles; the triangles are re-ordered and the node extras get `cells`; colliders,
     `*hidden*`, water and `g_cloth_*` stay untouched.
   - The only rule: tell the perf lead (through 3d-director-2e) just before you run the export, so the cells agent isn't
     writing outer_road.glb at the same moment, and again when it's done.
   - The export copies the section's data (people.json etc.) into `web/public/assets/outer_road/`; that's yours anyway.
2. **Patches** (people.js `prepareClip` per-clip `sole_k` from clip_meta.json; world.js ground hook ignoring the `hidden`
   collider material for figure grounding): send them as exact diffs (file, old text, new text). The lead reviews and
   lands them in `web/src`, then tells you.

# Patches landed by the perf lead (3d-director-04), 2026-10-13

- **P1** landed in `web/src/people.js` as proposed, with two changes:
  - the hips' parent is looked up with `?.`, so a clip whose hips node isn't found skips `sole_m` instead of throwing;
  - `clip.userData.grounded` is set for every clip with a lift, including the second clip of a shared array, which the
    WeakSet guard skips.
  - The rider's seat (`seat_m`) landed as proposed.
- **`tools/people_precompute.mjs`** keeps `sole_m` / `seat_m` on a re-measure, as proposed.
- **P2** (`root_h`) landed in `addFigure`, together with P3's `hooks.stand`.
- **P3** landed with one change: no new `dropToVisible`. `world.js` `floorUnder(x, z, fromY = 40)` already did
  exactly that from a fixed 40 m, so it takes `fromY` now. `hooks.stand` is the same three rays through it. `addFigure`
  and `addAnimal` use `hooks.stand || hooks.ground`.
- **P4** (seam re-grounding) is not landed. Send it as an exact diff when you want it. It should run after
  `rebuildCollider()` in the section-join path, and loop only over the static persons of the neighbours within 3 m of
  the seam.
- The build passes. The full regression (world walks, people, sizes) runs before the deploy. Rerun
  `clip_ground.mjs --write-meta`, the joint tracks and `contact_check` on your side now that P1 and P3 are on the page.

**P3 reverted** (03:2x, at fix-S4's request): no `hooks.stand`; `floorUnder(x, z)` from 40 m as before; `addFigure`
and `addAnimal` use `hooks.ground`. P1 and P2 stay.

**P4 landed** (the exact diff, unchanged). Reviewed: `crowd.js` composes each instance from `p.root.position` every
frame, so no matrix refresh is needed; `people.riders`, `people.attached`, `people.agentOf`, `hooks` and the
people.json keys (figures by layout id, animals by slug) are as the diff assumes. Build and check_deploy (all eight
sections, no errors) pass. Rerun `contact_check` (`order`) on your side.
