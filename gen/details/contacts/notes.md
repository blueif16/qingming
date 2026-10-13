# Contacts: measurement record (details pass, agent "contacts", 2026-10-13)

Brief: `gen/details/brief_contacts.md`. Check-only: nothing in the world is changed here.

## Log

- 2026-10-13: started. Read plan.md, brief, qingming/CLAUDE.md, skills characters / web-scene / scroll-section.

## Stage 1: per-owner geometry (done)

- `blender/street_b1.py` `Buckets.add`: one added line, `b["o"]`, the owner of each face parallel to `b["f"]` (geometry
  unchanged).
- `blender/owners_dump.py` (new), called from `blender/build_web_scene.py` after `build()` (in a try, never fails a
  build): every loop triangle of the collection's baked meshes with its owner (bucket faces' owners; `ground` for
  g_ground*, `water` for the water strips), map frame X, D, H → `gen/sections/<name>/owners.bin` (float32, 9 per tri,
  sorted by owner, material) + `owners.json` (owner → [[first_tri, count, "<mat>__col|nocol"]]).
- Every section builder fills `street_b1.B` (all eight bake from `sb.B.data`); boats are built by `kit_boats` into
  their own GLB and are NOT covered (boat crews' contacts with decks, poles, oars are not measured against geometry).
- `tools/owners_build.sh <name...>`: rebuilds through `tools/build_scene.sh`, then puts back the builder's outputs
  (placed.json, seats/solids/ground_at json, the raw GLB and build.log in web_build/) and reports DRIFT. Logs and
  backups in `gen/details/contacts/build/`. All eight built in 6-19 s each (three slots).
- `tools/owners_verify.mjs <section|all>` (0.1 s): per-material triangles from owners == shipped GLB accessor
  counts; per-material bounds (dequantized, page frame) within 1.5-3.8 mm (quantization); per-owner triangles ==
  the shipped `placed.json` (ground, water and road parts folded into the ground/water meshes).
  Result `gen/details/contacts/owners_verify.json`: 7 MATCH; **outer_road_2 DRIFT (explained)**: the builder now adds
  two 60-tri `timber__nocol` stools, owners `S4b.fig.seated_boatman_stern_15372` and `S4b.fig.seated_man_13240`,
  not in the shipped GLB. The checks leave those two owners out (`exclude_owners`), so they measure what is live.
