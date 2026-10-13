# The water: a proposal (the boat factory, 2026-10-12)

The user's rule (map/BUILDING.md, "Boats and water"): one flat surface per reach, no reflections, no refraction, no
simulated waves; the painted current lines (汴水悍激) as the material's own slow pattern, a soft shore line, and a wet
line where hulls meet it; a few triangles and one small texture per world. This is how. The page work is the lead's
engine agent's; the hull side of the wet line is already in the boat kit.

Preview: the review renders in `gen/boats/review/` (`*_eye.png`, `*_bow34.png`, `*_scroll.png`) draw the water this way
in Blender (`kit_boats._review_water`, an approximation of the shader below), with the kit's wet band and ring on every
boat. The painted reference: `gen/boats/crops/S2_water_lines_plain.jpg` (S2 u 26450-27050, the 汴水悍激 pin).

## What the scroll paints

Faint, thin ink lines of even weight running along the river, long gently undulating strokes that break off and
start again a little offset, about 0.5-1 m apart across the flow and 2-5 m long at the frame's scale, with small
eye-shaped eddies here and there. No shading, no reflections of boats or banks, no highlights. The lines thin out at
the banks.

## 1. Geometry: one strip per reach (the section builder's ground)

- Per `water` entity (a reach between its mapped `shore_n` and `shore_s`), one mesh at the frame's `water` H: four rows
  of vertices across (the north shore, 2.5 m in from it, 2.5 m in from the south shore, the south shore) and a column
  every ~4 m along the reach and at every mapped shore point. Where the silk's edge cuts a shore, the strip runs on
  16 m under the mist (rule 4). About 6 triangles per column: **150-250 triangles for a reach the length of S2**
  (111 m).
- **UV0** = (s, n) in metres: s along the reach's centre line in the direction of the flow, n across it. **TEXCOORD_1.x**
  = the distance to the nearest shore in metres (0 on the shore, 2.5 on the inner rows and beyond): the same second-UV
  slot the ground's `blend` weight uses (`gate_scene.ground()`), which `export_web_scene.mjs` keeps (attribute pruning
  is off).
- Material `water` (already in `song_kit` as a flat colour, and in `palette.js` as `#6f8e8f`). Mesh
  `g_water__nocol`: nothing collides with the water; the shores are closed by `edge:shore` walls and the boats' own
  colliders (`kit_boats`) carry anyone aboard.

## 2. The texture: one per world

`gen/boats/water/water_lines.webp`: **512 x 512, one channel (grey), seamless, 22 KB** (PNG master
`water_lines.png`). Painted through shyfai with `prompts/boat_water_lines.txt` (the current lines as the scroll draws
them, ink on white, 12-16 strokes across the tile, a few eddies), candidate `lines_0.png` of two. The model drew it
seamless: `tile_check_raw.jpg` repeats it 2 x 2 with no seam. (`tools/make_tileable.mjs`'s cross-fade ghosts line art
into double strokes, so it is not used here.) Ship it once in `web/public/assets/tex/` like the swatches, mipmapped,
anisotropy 4, single channel (R8) if the loader allows.

## 3. The shader: a `current` kind for `web/src/surface.js`

The same patch pattern as `surface.js` (Lambert or Toon base, `onBeforeCompile` into `map_fragment`), on the `water`
material:

```glsl
uniform sampler2D qmLines;   // water_lines (ink = 1 - r)
uniform float qmTime;        // seconds, the page's clock
varying vec2 vQmS;           // uv0: metres along (s) and across (n) the reach
varying float vQmShore;      // uv1.x: metres to the nearest shore
// two layers drifting downstream: one tile per 8 m at 0.25 m/s, a second at 12.8 m per tile, 0.15 m/s, shifted
// across, so the repeat never shows and the lines seem to stream past one another
float qmA = 1.0 - texture2D(qmLines, vec2(vQmS.x - qmTime * 0.25, vQmS.y) / 8.0).r;
float qmB = 1.0 - texture2D(qmLines, vec2(vQmS.x - qmTime * 0.15, vQmS.y + 3.0) / 12.8 + vec2(0.37, 0.61)).r;
float qmInk = max(qmA, qmB * 0.7) * smoothstep(0.3, 2.8, vQmShore);   // the painted lines stop short of the bank
diffuseColor.rgb *= 1.0 - 0.3 * qmInk;                                // darker only: never lighter than the water
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.66, 0.62),      // the soft shore line: a pale wet band
                       0.45 * (1.0 - smoothstep(0.0, 0.9, vQmShore)));
diffuseColor.rgb *= qmTone(vQmWorld);                                 // surface.js's broad tone wash
```

- **Cost:** 2 texture fetches and about 20 ALU per water fragment; no extra pass, render target, depth read or
  transparency. The water is opaque, lit by the hour like the ground (roughness 1, no specular: nothing reflects), and
  receives the shadow map, so boats and the bridge throw shadows on it.
- **Distance:** mipmaps thin the lines far away; if they shimmer at grazing angles, fade `qmInk` by view distance
  (40-80 m), as the ink pass fades.
- **Night:** the lines only darken, so they follow `post.js`'s rule that ink is never lighter than the surface.
- **The ink pass** draws nothing on the flat water itself; it draws the shore (the bank's crease) and the hulls' wet
  lines against it.
- **Flow:** downstream is east (+X), unless the river agents read otherwise. The evidence: the boat rowed upstream
  (逆水行舟, S2 u ~24200) heads west with its trackers pulling west, and the big boat under the bridge (大船抢险) heads
  west against the current. Each reach's UV0 `s` runs downstream, so the shader needs no per-reach uniform. Speed
  0.25 m/s (choice): a visible drift that doesn't read as a flood.

## 4. The shore

- The water side: the pale band and the fading lines above, both from TEXCOORD_1.x, so every shore gets them free.
- The bank side (optional, the builders' choice): where a bank meets the water as a face or a slope, a strip of dark
  wet earth 0.15-0.2 m tall just above the water (a flat colour `wet_earth`, about `#6b6253`), 2 triangles per 2 m of
  shore. Landing stairs get the same on their lowest step.

## 5. Where a hull meets the water (built: `blender/kit_boats.py`)

- **On the hull** (`_wet_band`, part of the `body` node): a dark band `wet_hull` (`#3d342a`, wet timber) from 5 cm
  under the water to 11 cm above it, 3 cm proud of the planking (over the laps), along both sides and across both
  transoms. About 50-90 triangles a boat. It moves with the boat, and a moored boat's ride (±2-3 cm) stays inside it.
  Its edges draw ink against the hull, and its silhouette is a crisp dark line against the water.
- **On the water** (`_wet_ring`, node `wet__ring`, about 70 triangles): a flat ribbon 1.5 cm above the water round the
  waterline, 0.6 m wide (1.4 m at the bow of a boat under way: its bow wave); uv.x is 0 at the hull and 1 at the outer
  edge, uv.y is metres round the hull. One shared material for every boat: the water colour lightened about 25%,
  alpha `0.55 * (1 - uv.x)^1.5`, transparent with depthWrite off, drawn after the water. On a boat under way, the
  same line texture scrolls along uv.y at the boat's speed, so ripples stream past the bow. The page fades it in and
  out with the boat's motion.
- **Why not depth-intersection foam:** it needs the scene's depth while the water draws (a depth prepass, or the
  post pass's target read back mid-frame), i.e. another geometry pass or MRT, which the page doesn't have yet (the
  Messenger single-pass MRT is still on the list). The kit's geometry gives the same line for about 150 triangles a
  boat and costs nothing per pixel beyond the ring's few blended fragments.

## Costs, summed

| item | cost |
|---|---|
| water surface | 150-250 triangles per reach, 1 draw call per section (one material) |
| texture | 1 x 512 x 512 grey, 22 KB, per world |
| shader | 2 fetches + ~20 ALU per water fragment; no pass, target or depth read |
| shore | free on the water (uv1); optional 1 triangle/m wet strip on banks |
| hull wet line | ~150 triangles per boat (band + ring), 1 shared transparent material |

Nothing here reflects, refracts, waves or needs a render target.

## For the lead's engine agent

- Add the `current` kind to `surface.js` for material `water` (uniforms `qmLines`, `qmTime`; varyings from uv0 and
  uv1.x) and a shared `water_ring` material (transparent, from uv.x; texture scroll for boats under way).
- The section builders write UV0 (s, n) and TEXCOORD_1.x (shore distance) on the water strip; a helper for it would
  sit best beside the ground's in a kit (the river reaches are S4b's, S3's, S2's and S1's).
