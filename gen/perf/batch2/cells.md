# Perf batch 2: the world in cells, the middle version (the cells agent, 2026-10-13)

Proposal rank 9 (`gen/perf/proposal.md`), the middle version the user approved: cells cut at export from what is
shipped, one `BatchedMesh` per material, each cell culled, the shadow pass culled the same way. Not this batch: texture
arrays, builder-made far levels, a whole-scroll Blender rebuild. Working folder: `gen/perf/batch2/cells/`.

## What the page reads from a section GLB (checked first)

- `world.js` `fetchSection`: every mesh by name. `*hidden__*` are collider-only (hidden); every `*__col` mesh feeds the
  section's collider (its world positions and index, merged into one `MeshBVH`), `g_edge_<side>_hidden__col` the seam
  walls; the visible `__col` meshes' vertex ranges are the floors (`floorUnder`: trees grounded; `surfaceUnder`: the
  footsteps' floor name, sound.js). `g_ground__col`'s box: the walkable extent and the backdrop (`rebuildBackdrop`).
  The materials are shared by name across sections (`sharedStd`). Corridors (`corridors.json`) are keyed by the
  collider's triangle count. Node extras: none in any of the eight GLBs (flat nodes, one primitive each, triangles).
- Offline: `tools/owners_verify.mjs` and the contacts check (triangles per material over the whole GLB),
  `tools/boat_lanes.mjs` (triangles by node name), `tools/budget_check.mjs` (sizes, triangle counts from the JSON).
- The lead's constraints: keep the cloth (`g_cloth_*`) out of the cells as its own meshes (an ambient module may sway
  it); every triangle once, so the triangles per material stay.

## What landed

(filled in below as it lands)
