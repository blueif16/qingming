# 3D trees: the method (survey and choice, 2026-10-13)

The user: the trees "look like they are fake and just made with images … Try to have the exact same way of rendering
as current best methods", without hurting performance much. Every mapped tree stays one tree of its painted form
(map/BUILDING.md, "Trees in 3D"). This file is the choice; `notes.md` is the record of doing it. Until the lead
signs it off, the page draws the 3D trees only with `?trees=3d`.

## How stylized trees are drawn in real time now (survey)

| technique | what it is | where it is used | for us |
|---|---|---|---|
| **Camera-facing cards** (billboards, cross-quads) | the whole tree painted on one quad turned to the camera | old open worlds, our page until now | reads flat up close and turns with you: the user's complaint. Kept only as the far level |
| **Impostors** (octahedral, billboard clouds) | many pre-rendered views of a 3D tree, chosen by angle; or a cloud of planes fitted to the model (Décoret et al., "Billboard Clouds", 2003; Ryan Brucks' octahedral impostors) | Fortnite, UE/Unity far LODs | needs a 3D tree first; ours is only a few seconds of walk beyond the mist, so the painted card does this job |
| **Wood mesh + leaf-clump cards** | a real low-poly trunk and limbs; the crown built from many alpha-tested quads, each a painted clump (a fan of shoots, a twig cluster, a leaf spray), placed in 3D over the branch ends and the crown volume | SpeedTree "fronds", Breath of the Wild / Genshin-style stylized trees, ez-tree (Dan Greenheck, three.js, 2025), Unity/Godot stylized-foliage shaders | **chosen**: true 3D from every side, painted style kept in the clumps, cheap (one quad = a whole spray) |
| **Spherised (sphere-projected) normals** on the clump quads | each clump vertex takes the normal of a sphere round the crown, so a crown of flat cards shades as one soft volume instead of a pile of planes | standard trick of stylized foliage (sphere-normal transfer in DCC tools, "fluffy tree" shaders) | **chosen**: our toon ramp then puts the crown's light and shadow on it like a painted wash |
| **Hanging strands / ribbons** | curved strips (or cards with their root at the top) for whips that hang | weeping willows in SpeedTree, hair cards | **chosen** for the one weeping willow (S7 855) |
| **Vertex-shader wind** | trunk bend scaled by height, per-branch/clump flutter about a pivot, a per-instance phase, gusts as a travelling noise (Crysis, GPU Gems 3 ch. 16; SpeedTree wind; UE pivot painter) | every engine | **chosen**: no CPU per frame |
| **LOD cross-fade by dither** | the near and far forms overlap over a band and each draws a complementary dither pattern, so nothing pops (Unity LODGroup cross-fade) | Unity, UE | **chosen**: the 3D tree and its card hand over over 6 m |
| Procedural growth (L-systems, space colonisation) | trees grown by rules | SpeedTree, ez-tree, Blender sapling | used only for thin wood the cards already draw (we grow tubes along the card's own strokes, not new branches) |
| AI 3D of a whole tree | Meshy/Tripo of a tree with its foliage | | turns shoots and whips into slabs (CLAUDE.md "Foliage"): used for the **bare wood only** |

## The choice, per part

- **Wood.**
  - **Meshy** for the gnarled forms (willow_fan, willow_burl, elm_claw, pine_fan, willow_weep: 23 variants). Each
    card is first repainted bare by shyfai (the same tree, trunk, limbs and heads only, in the B1 style), then Meshy
    image-to-3D (meshy-t2, smart topology, textured, 15 credits). Blender welds, decimates to 2000-2400 triangles,
    sets the foot and the real height, and finds the limbs' ends (geodesic maxima from the foot).
  - Meshy only sees the front:
    - its lean in depth is removed (each height's centre brought back over the foot);
    - the limbs of the many-limbed forms are swung in depth about their forks, alternately forward and back (the
      front view stays the painting's);
    - where the bare painting came back at another scale (the pollard willows, 0.65-0.82), it is fitted to its
      card on the trunk's width.
  - Its painted texture goes into a shared **bark atlas** (512 px for the big willows, 256 for elms and pines).
  - **From the card's strokes** for the thin forms (slender trunks, saplings, young shoot trees: 19 variants): the
    card's solid pixels opened by 1-5 px (shoots go, wood stays), thinned to a skeleton, walked from the foot, each
    branch a tube with the stroke's half-width and the card's paint; side branches swing in depth. Bamboo culms and a
    shrub's stems are thin tubes from the foot to the crown's clumps. The low stem clumps and the hedge row have no
    wood.
- **Crown:** painted clumps, one shared atlas of 32 cells (8 shyfai sheets of 4 clumps, keyed by the cards' own
  keyer), placed by how each form grows:

  | mode | where the clumps go | forms |
  |---|---|---|
  | heads | fans of shoots from each limb's head | pollard willows, young shoot trees |
  | tips | small sprays at branch ends | saplings, slender trunks |
  | along | claw-twig clusters along the upper limbs | elms |
  | fill | needle tufts / leaf sprays through the card's own crown, given depth | pines, bamboo, the shrub, the hedge |
  | hang | curtains of bare whips from the limbs | the weeping willow |
  | foot | fans of stems from the ground | the low stem clumps |

  - Each clump is 1-4 crossed quads cut to the clump's convex outline (7-8 corners: half the overdraw of a square).
  - Normals are spherised from the crown's centre.
  - Roots are staggered and their dense knot faded, so a head never reads as a blot.
  - Clumps are stored in farthest-point order, so a tier's clumpDensity draws a prefix that keeps the crown's shape.
- **Wind** (`web/src/wind.js`, shared with the ambient agent):
  - one direction and strength, with gust fronts rolling at 8 m/s;
  - trunk sway grows to the top (about 0.16 m at the top of a 10 m tree in the default breeze);
  - clumps flutter about their heads;
  - whips swing wider and slower;
  - each tree and clump has its own phase from its position;
  - the sway fades out by the tier's windFar.
- **Far level:** the painted card, cross-faded by a complementary dither over 6 m past the tier's meshNear. Cards
  whose trees are all 3D within 40 m or more stay at their 256 px copy (never seen nearer), which pays for the
  atlases.
- **Drawing:**
  - one `BatchedMesh` for every 3D tree in the loaded sections (one draw a pass with WEBGL_multi_draw), one
    material (the page's toon variant + a patch);
  - the colour pass draws the trees within reach, chosen 4 times a second;
  - the shadow pass draws every tree at rest (no wind, no fade) into the cached static layer, so the static layer
    never redraws for wind;
  - a card casts only while a tree of it has no 3D form under the tier.
- **Tiers** (`tiers.js` `detail.trees`, live through `detail.js`):
  - low: 3D within 25 m, but cards by the rivers, half the clumps;
  - mid: 45 m, 0.75 of the clumps;
  - high: 70 m, every clump;
  - detailScale shortens the reach and thins the crowns before an automatic tier steps down.

## Why not …

- **Meshy for every form:** thin trunks (2 m saplings, slender poles, bamboo) come back blobby or broken, and it would
  have cost 435 more credits. The cards' own strokes are a better source for them: front views match the cards exactly.
- **Per-tree textures:** 23 textures would mean 23 materials (23 draws a pass); the two atlases keep one draw.
- **Octahedral impostors for the far level:** the painted card already is the far level and is loyal to the
  painting's own drawing of that tree; the mist takes over 45-90 m out.
- **Alpha blending for the crowns:** sorting and overdraw; alpha test + the mip-coverage boost holds the shoots.

## Sources

- [ez-tree](https://github.com/dgreenheck/ez-tree) (three.js procedural trees, leaves as alpha cards, LODs); Codrops,
  "Fractals to Forests – Creating Realistic 3D Trees with Three.js" (2025-01-27).
- ArtStation, cremuss: sphere-projected normals for stylized foliage; Godot Shaders, "Stylized Fluffy Tree Leaves".
- GPU Gems 3, ch. 16, "Vegetation Procedural Animation and Shading in Crysis" (main bending, detail bending, phases).
- Décoret, Durand, Sillion, Dorsey, "Billboard Clouds for Extreme Model Simplification" (SIGGRAPH 2003); Unity
  LODGroup dithered cross-fade.
