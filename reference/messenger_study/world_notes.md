# Messenger's world: how the environment is built (study, 2026-10-10)

This folder is study-only. Never copy from it into project assets or builds.

The October 9 teardown covered Messenger's **characters**, palette, outlines, shading and download sizes. This
note adds what that teardown left out: how the **environment** (buildings, ground, props) is modelled and drawn.

**Sources:**
- `world_drc/`: the shipped `planets/present/full_*.drc` chunks (LOD 0–3) and `hitmesh_*.drc`, fetched from messenger.abeto.co.
- `world_glb/world_lod0.glb`: those chunks converted for Blender, one mesh per batch. COLOR_0 holds a random
  colour per surface ID. The live Blender scene `messenger_world_study` has it loaded.
- `world_renders/`:
  - `sheet_buildings.jpg`: six areas, plain and coloured by surface ID;
  - `sheet_house_wire.jpg`: one house up close with its wireframe.

## Numbers

- **The whole world is small.** It is a planet of about 28 m radius, about 10,000 m². That is roughly three of
  our gate sections (74 × 46 m each).
- **Triangles:**
  - 381k at LOD0 across 10 chunks of 32–52k each;
  - the lower levels have 324k, 243k and 158k;
  - density is about **38 triangles/m²**.
- **Batches:** 588 in total, 65 per chunk. A batch is a spatial cell (a ground patch with everything on it),
  not one building.
  - The median batch is 452 triangles.
  - The densest are 3–4.7k triangles over about 5 × 6 m.
- **Surface IDs:** 3–5k per chunk, about 60–150 per batch. Lines are drawn where the surface ID changes, so
  modellers split surfaces deliberately.
- **Vertex attributes:**
  - position, normal, uv (into the 16×16 palette atlas), `surfaceId`, `batchId`, `elementId`;
  - no image textures on the world;
  - the terrain shader adds subtle triplanar noise to the palette colour.
- **Edge lengths:**
  - median 0.17–0.28 m;
  - the shortest 10% are about 4 cm, the chamfer and trim scale;
  - the longest 10% are about 1 m.

## Construction (from the renders)

- **Big wall planes are just 2 triangles,** flat colour with no texture.
- **Detail goes on edges and small things:**
  - roof slabs with real thickness, fascia boards and an overhang;
  - corner trims and ledges;
  - inset window frames with mullions and sills;
  - door frames, plaques and vents.
- **The ground is never one plane:** curbs with chamfers, kerb ramps, drains, steps, stepped retaining walls,
  rolling terrain and rocks.
- **Building bases are crowded:** pots, boxes, bikes, cones, vending machines, AC units, pipes, cables, signs,
  railings.
- **Natural shapes are faceted and irregular** (rocks, slopes, the stick trees), never smooth or primitive.
- **Slight irregularity everywhere:** leaning posts, uneven fence boards, sagging cables.

So no surface reads as a box, even though the geometry is simple. Each silhouette and edge carries a second
piece, and the outline pass inks every split.

## Rendering and performance (from the shipped JS)

- **One scene pass with multiple render targets.** The fragment shader writes colour plus `gInfo` (normal,
  depth, outline contribution) at `layout(location = 1)`. The outline pass reads that buffer, with no second
  geometry pass.
- **World:**
  - each detail level is one `BatchedMesh`;
  - each batch switches between levels by distance to the player: LOD1 beyond 6 m, LOD2 beyond 12, LOD3 beyond 20;
  - a dot-product test hides cells on the far side of the planet.
- **Characters:** all avatars share one batched skinned mesh (`batchingTexture` + `boneTexture`), which means one draw call.
- **Collision:** five `hitmesh_*.drc` files, merged, separate from the visual mesh.
- **Shadow:** one map, with `HARD_CUT_SHADOW` on characters.

## For us

Four gate sections cover about 1.4× Messenger's whole world, but they hold about 12× its people (240 against
about 20 NPCs). The static budget is affordable: about 130k triangles per gate section at LOD0, plus lower levels.

The people are the hard part. Batched skinning, culling, and dropping the second pass are the three
Messenger techniques that address it.

## Player, camera and NPCs (read from the shipped bundle App3D-*.js, 2026-10-10; study only)

The bundle is in `js/` (never run, never copied). What it does:
- **Third person.** A follow camera (`isFollowCamera`) orbits the local player's character on a sphere: vertical
  angle limited to 45 deg above and below level (phi pi/4..3pi/4), aimed at the top of the player's capsule. Lerps are
  frame-rate independent (`lerpCoefFPS`): target local 0.0125, world 0.175, rotation 0.03, sphere rotation 0.075
  (fast 0.3), radius 0.035 per 60 Hz frame. It re-centres behind the character when idle input allows.
- **Camera collision.** A ray from the target to the camera: on a hit the radius drops to 90% of the hit distance.
  Then up to 10 steps of 5% of the follow distance inwards while `closestPointToPoint` on the collider is nearer
  than 0.75; when clear it eases back out. An over-the-shoulder offset is dropped when blocked.
- **Player body.** A capsule with radius 20% of the character's height (`capsuleRadiusPercentage` .2), shape-cast
  against the merged hit mesh in substeps, with auto-step, floor detection (normal.y > 0.8) and a fall limit.
- **NPCs** walk looping curves at their own speed. Within `talkDistance` (2.5-3 m) they stop, switch to idle and turn
  to face the player (`alwaysFaceCharacter`, `talkFacingPlayer`, slerp 0.04 per frame); a click starts dialogue and
  the camera frames the conversation. They hide beyond `visibilityThreshold` (30-50 m), and their animation updates
  get rarer with distance (`UPDATE_DISTANCE`). The collision code only tests the world hit mesh, so NPCs have no
  volume against the player.
