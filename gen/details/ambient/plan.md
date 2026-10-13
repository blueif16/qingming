# Ambient life: plan (agent "ambient", 2026-10-13)

The rule is `map/BUILDING.md` "Ambient life". Only motion and air are added. There are no people, owned animals,
props, buildings or traffic. Every effect is placed from the map's own things (`layout.json`) and kept sparse. The
brief is `../brief_ambient.md`, and the tier contract is `../tier_contract.md`.

## What you would really see

The scene is a spring (清明, early April) day in a Song river town and its countryside, at Kaifeng's latitude. Below,
each thing is checked against the season and against what the scroll paints.

- **Wind on cloth.** Banners, the 新酒 and 孫羊店 flags, curtains, pennants and table cloths stir, and lift when a gust
  comes through. The street feels alive at almost no cost.
- **Swallows (家燕).** They are back by 春分 and 清明 is their season. They skim fast and low along the road and over the
  river, and turn hard at the ends of their beat. Of everything here, swallows say "spring" most strongly.
- **Crows round the big trees.** The scroll paints a crow in S4's great willow and crow's nests in S1's elms. Now and
  then a few crows wheel high over the old willows and roofs. In the city sections, pigeons wheel over the roofs
  instead.
- **Sparrows (麻雀).** They hop and peck in the dust at grain baskets, sacks, the eating houses' tables and the
  stalls. They burst up to the nearest tree or roof when you, or a walker, come close, and drift back down later. This
  is the one thing that answers you.
- **Catkins (柳絮).** In the 清明 weeks white fluff drifts from the willows, slowly and sideways in the wind, and rises
  in gusts. The scroll's trees are mostly willows.
- **Elm seeds (榆钱).** The papery discs ripen around 清明 and spin down under the elms. They play the part of the
  falling leaf, true to the season (dead leaves fall in autumn).
- **Bamboo leaves (竹秋).** Bamboo sheds its yellowed old leaves in the third month, so a few fall at the painted
  bamboo clumps.
- **Kitchen smoke and steam.** A thin wisp leans downwind from the roofs of the painted eating houses, tea houses and
  taverns at cooking hours. Steam rises at the painted steamer rack (S2's eatery rack). No stove is painted outright,
  so the eating places are the sources (see "Placed from the map" below).
- **Egrets (白鹭).** A single white egret now and then, on slow wingbeats low along the 汴河 (S2, S3, S4b).
- **Hour by hour.** Sparrows and swallows are out from dawn to dusk. Crows and pigeons go to roost at dusk (the flocks
  thin, then leave), and bats come out round the trees and eaves for an hour or two. At night only the wind moves.
- **Cabbage whites (菜粉蝶)** flutter along the countryside's hedges and fences (S1) in the warm hours.

### Not added

- **Fireflies:** a summer insect (June), not 清明.
- **Dragonflies:** late spring and summer.
- **Petals:** no blossoming tree is painted.
- **Falling dead leaves:** autumn.
- **Dust at wheels:** no painted cart moves. This is a later idea, for when a cart or a walking team gets the dust.
- **Fish rings on the river:** a later idea.

## Ranked by depth per cost

| # | Effect | Depth | Cost | Pilot |
|---|---|---|---|---|
| 1 | Cloth in the one wind (vertex shader on the existing `g_cloth_*` meshes, flag pieces of `g_signs_*`) | high | ~0: no draw, no texture | yes |
| 2 | Birds in the sky: crows or pigeons wheeling, now and then | high | 1 instanced draw for all flyers in the world, ~27 triangles a bird | yes |
| 3 | Swallows skimming road and water | high | the same draw | yes |
| 4 | Catkins, elm seeds, bamboo leaves | med-high | 1 draw for all particles, 2 triangles each, no texture | yes |
| 5 | Sparrows that flush | high (it reacts) | the bird draw; at most 12 CPU agents, 10 Hz, segments the GPU plays | yes |
| 6 | Kitchen smoke and steam | med | the particle draw (blended puffs) | yes (S4's tea house) |
| 7 | Dusk: roosting, bats | med | the bird draw | yes (by hour) |
| 8 | Egrets over the river, butterflies on S1's hedges | med | the bird draw | at scale-up (S4 has neither river nor hedge) |

## How (cheap)

- `web/src/ambient.js` is one module. `web/src/ambient_sites.js` is a pure function: layout → sites, each with the map
  ID it comes from. It can be imported in node for records.
- **The bird draw:**
  - one `InstancedBufferGeometry`, a procedural low-poly bird of about 27 triangles (body, two-part wings, tail), no
    texture, `MeshToonMaterial` (flat, stepped, fogged, ink-outlined like the world);
  - each species' shape is a uniform table (span, chord, sweep, tail fork, colours) on one shared template;
  - flight paths are functions of time in the vertex shader: a wheel, a skim (a figure-eight along a road or water
    segment), a pass and a flit;
  - flap and glide are in the shader too;
  - sparrows are segments (from, to, start and end time, mode) that a CPU agent writes only when a segment ends.
- **The particle draw:**
  - one `InstancedBufferGeometry` quad and one `ShaderMaterial`, blended, with no depth write, so no ink edges;
  - procedural shapes: fluff, disc, leaf, puff;
  - each particle's path is a function of time (emitter + wind drift + sink + turbulence), with a new random start
    each cycle;
  - it writes the neutral normal (`qmNormalOut`, alpha 0);
  - it is lit from the scene's own hemisphere and sun, so night is dark.
- **The cloth:**
  - a per-vertex `aQmSway` (metres below the piece's top), computed once per loaded mesh;
  - pieces are found by welding positions and flood-filling triangles;
  - only thin sheets (PCA thickness < 3 cm) sway, so sacks and bales stay still;
  - the cloth variant materials get a vertex patch that reads the shared wind (`web/src/wind.js`, the trees agent's).
- **Per frame:** one `scene.onBeforeRender` callback, chained. It sets the uniforms, polls the loaded sections at 4 Hz
  and runs the sparrows at 10 Hz. It does no per-object work. The world needs one line,
  `createAmbient({ scene, camera, player, sections, people, hour })`.
- **Shadows:** none (the lead's rule).
- **Textures:** none. Every shape is drawn in the shader, so the download is 0 bytes, which keeps the river window's
  GPU memory untouched.

## Tiers (`tiers.js` TIERS.<tier>.detail.ambient, counts per loaded section, times `detailScale`)

- **low:**
  - cloth sway near you;
  - a small crow or pigeon flock;
  - sparse catkins and seeds;
  - no smoke, no sparrows.
- **mid:**
  - adds swallows, sparrows (CPU agents), smoke and steam, bats, egrets;
  - catkins at about three times low.
- **high:**
  - everything, denser;
  - cloth sway at every distance.

## Placed from the map

| Effect | From |
|---|---|
| Wheeling flock | Crows round the tallest trees (and S1's nests); pigeons over the largest roof cluster in the built-up sections |
| Swallows | Straight runs of the route centre line (`layout.route`) and side roads inside the painted area; the water entities' shore lines, offset onto the water |
| Egret | Along a reach's shore line, over the water |
| Sparrows | Props named basket, sack, grain, heap, goods, table, tray, bench or stall. They keep 0.9 m from every mapped figure and 1.2 m from every walker path. They perch on the nearest tree crown or building eave. |
| Catkins | Willows (`willow_fan`, `willow_burl`, `willow_weep` cards, or a `what` that says willow), 4 m and taller |
| Elm seeds | `elm_claw` trees |
| Bamboo leaves | `bamboo` clumps |
| Smoke | Buildings named eating house, eatery, tea house, tavern, 饭铺 or 正店: a wisp from the back half of the roof |
| Steam | Props named steamer or stove, or the eatery rack |
| Bats | Round the two tallest trees and the largest roof |
| Butterflies | Hedges, fences and fields |

## Pilot: S4 outer_road

- **Cloth:** the striped banner `S4.prop.banner_frame_11895`, the fortune-teller's table cloth, the curtains.
- **Crows:** round the big willows (`S4.tree.gnarled_willow_12390`, where the painted crow `S4.ani.bird_12433` sits;
  `willow_11300`, `willow_leaning_11185`).
- **Swallows:** along `S4.road.main`.
- **Catkins:** from the seven willows.
- **Elm seeds:** from `S4.tree.twin_trunk_elm_11968` and `bare_tree_s_11075`.
- **Bamboo leaves:** from the two bamboo clumps.
- **Sparrows:** at the heaped basket `S4.prop.big_basket_10000`, the shop's basket, and the tea house's tables.
- **Smoke:** over the tea house `S4.bld.south_hall_11450`.
- **Bats:** at dusk round the big willows.

**Numbers:** bench at high and on the phone proxy at the low tier, ambient off against on, on the same build,
interleaved. Then films and stills, then scale to all eight sections.
