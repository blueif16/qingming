# Building from the map: the loyalty standard

`README.md` is the language of positions: what the scroll paints, where, in scan pixels and metres. This file is the
language of building: how a section's map becomes a walkable scene, and how we know that the scene holds exactly what
the painting holds. Every section, and every worker on a piece of one, follows it.

It was set on the gate (S5) on 2026-10-11, when the user asked for the scene to be "absolutely loyal to the original
painting… replicate exactly what the painting has, even to the amount of trees", and then: "only place the 3D models
where things are actually drawn. If they're not drawn and we need a boundary, we can have a texture, sort of like
paintings… This way we can be certain that for each of the objects listed in the painting, we have a 3D model that's
placed."

## The rules

1. **One map entity, one model.** Every 3D thing in a scene belongs to exactly one map ID, and every map ID of the
   section is built exactly once, or is listed as not built yet, with the reason and who decided.
2. **Nothing without a map ID.** No filler props, no extra walls, yards or abutments, no grass tufts or stones, no
   invented crowds. If the painting shows something the map lacks, add it to the map first (skill `scroll-section`),
   then build it.
3. **Parts belong to their entity.** What makes a painted thing stand or read is part of it and carries its ID: a
   hidden back wall, a beam, a roof trim, a stair's collider ramp, the seat of a figure painted seated. A part must be
   painted, described in the entity's `what` or `note`, or structurally needed and hidden. Otherwise it is an
   invention.
4. **Where nothing is painted, nothing is built.** Close the walkable area with invisible edge walls. Beyond them the
   world is painting, not models: mist (the scroll's blank silk, 留白) where the scroll paints nothing, the
   neighbouring sections as painted panels until they are built. Never invent a structure to fill a gap.
5. **Real size, painted place** (the user, 2026-10-11: "everything will have a realistic relative size… we don't want
   anything to look weird… we just want positions to be our relative positions"). Every model is built at real size:
   people, animals, doors, storeys, eaves, wheels. Only positions come from the map. Far up the silk the painter draws
   things smaller (about 0.55–0.6 of the street's scale in S6), so the map reads their heights small and their
   frontages packed: there a building keeps real heights, storeys and openings and takes its frontage and depth from
   its painted footprint, so neighbours still stand side by side as painted. Where a real part can't fit a footprint,
   it is narrowed, never shrunk in height. Never a miniature.
6. **Sizes the strokes can't give are choices, not inventions.** A depth hidden behind a roof, a stair's foot below
   the silk's edge, the tower's true scale: mark them `choice:` in the builder and list them in the section's notes.
7. **Every departure is recorded,** in `sections/<name>/build_choices.json`, each with its reason.

## How each kind is built

| kind | built as | where it is placed |
|---|---|---|
| building, structure, prop | a model from the kit (`blender/song_kit.py`, and the section kits `blender/kit_<name>.py`) | the builder, from `layout.json` entities |
| tree | a painted card (`web/public/assets/*_card.webp`) | the page, every tree in `layout.json` |
| figure | a person: one of the characters, with an action cycle or a short walk | `people.json` (skill `characters`) |
| vehicle | a model from the vehicle kit (`blender/kit_vehicles.py`, a kit module of its own beside `song_kit.py`): wheels, shafts, body, roof, load, and the harness (yoke, traces) that joins it to its painted animals | the builder, from `layout.json` (`front`, `rear`, `wheels`) |
| animal | a rigged animal (Meshy body, our quadruped rig: `animals/`, `web/public/assets/animals/`), with its painted tack and load | `people.json` `animals` (the page) |
| road, water, grd | the ground surface: shape, washes, water planes | the builder's ground |
| boat (a `veh` with a `boat_` slug) | a model from the boat kit (`blender/kit_boats.py`): hull, deck, cabin, mast and rig as painted (lowered where painted lowered), sweep and oars, ropes to their painted ends, cargo; a walkable deck (and cabin roof) collider | the page, from `layout.json` (`front`, `rear` at the waterline, `facing_deg`, `pose`), with its crew (`people.json` `boats`) |
| water | one flat surface per river reach at the frame's `water` H, between its mapped shores, with invisible walls along every shore (`edge:shore`); the cheapest treatment that doesn't look fake (below) | the builder's ground (the surface) and the page (its material) |
| group | nothing of its own (its members are built) | |

A `grd` that is a solid thing (a mound of earth and rock, `S5.grd.rock_mound_7200`) is built as a model: say so under
`how` in `build_choices.json`.

**Animals** (the user, 2026-10-11: build them now, "high quality work"). Every painted animal stands at its map
position (between its fore and hind hooves), facing from its hind to its fore hooves, doing what it is painted doing:
an idle cycle where it stands, its walk along a short path where it is painted walking with nobody riding or leading
it away. Its painted tack and load (saddle cloth, pack frame, panniers, collar) are part of it. A rider is the painted
figure on it (`people.json` figure with `ride`); a cart's team stands in its harness, which belongs to the cart.

**Boats and water** (the user, 2026-10-12: "The boats should be moving and you should be able to walk on decks. For
the water think about the most efficient treatment that considers sizing and efficiency. Just don't be too fake").
- Every painted boat is built at real size for its type, centred on its painted waterline and turned to its painted
  heading; rafted boats keep their painted order and gaps, and a hull that would overlap its painted neighbour or the
  bank is shortened, never shrunk in height.
- **Boats move as painted.** A boat painted under way (rowed, poled, towed, sailing, drifting, lowering its mast) moves
  a short way along its painted heading and back, like a painted walker, with its crew doing their painted work (the
  sweep, the oars, the poles, the tow rope to its painted trackers); a moored boat stays at its mooring and rides the
  water gently. The hull, its crew and its colliders move together.
- **The river's flow, by device** (the user, 2026-10-13: "a flow that is a little bit more complex… if his device
  supports then we do a more complex flow… a more dynamic feeling"; both flow designs kept, one per device). The page's
  Boats setting (船行, `world.js` `boatMode`, `web/src/boatflow.js`): by device (the default) gives the light tier
  *sailing* (the painted boats under way that have a river sail it, into the mist and back) and the balanced and full
  tiers a *busy river* (also copies of the section's own painted boats coming in waves, at most 3 / 6 a section);
  *moored* is the motion above. This is the one place the world shows boats beyond the painted ones: copies of painted
  boats only, on the river, never on land or at a painted mooring.
- **Decks are walkable.** The player can step aboard any boat that touches a bank, a stair or a jetty (or another
  walkable boat) and is carried along while standing on a moving deck; the crew stand on the deck, not on the water.
- **The water** is one flat surface per reach: no reflections, no refraction, no simulated waves; the painted current
  lines (汴水悍激) as the material's own slow pattern, a soft shore line, and a wet line where hulls meet it. Its cost
  is a few triangles and one small texture per world, not per section.
- **Settled by the lead from the pilot** (2026-10-12; boat kit `blender/kit_boats.py`, `gen/boats/`): rafted or
  crowded boats are shortened to keep their painted order and gaps, down to 0.6 of their type's length, and beyond that
  moved outward over open water as a recorded move. The river's surface is the frame's measured `water` H (S4b's
  moorings). Water lines at 0.3 of the water colour, drifting 0.25 m/s downstream, the sparser line tile (`lines_0`).
  Decks keep invisible rails where they don't touch a bank, jetty, stair or another boat, so nobody falls in. Boats far
  from the player switch to the kit's lower detail level by distance on the page.

**People.** Every painted figure stands at its painted spot, doing what it is painted doing. Figures painted
mid-stride or carrying a load walk a short way along their painted direction and back; that is where the movement
comes from. Children are scaled down (`scale`). A figure that rides or pushes something not built yet is left out
with it, or kept standing at its spot, and listed. Traffic that is not painted is never shown by default (people.json
`load_test_traffic` is for the load-test panel only).

## The vocabulary

- **Map ID** (`S5.bld.tax_office`): the only name a piece of the scene goes by. Figures and trees also carry their slug
  (`tax_official`) in `layout.json` and `people.json`.
- **Owner**: what a piece of geometry belongs to. A map ID, `edge:<name>` (an invisible wall closing the walkable
  area), or `ground` (the ground surface).
- **Painted area**: the section's scan rectangle (its two seams and the silk's top and bottom edges) on the ground,
  `layout.json` `painted_area`, written by `tools/map_layout.mjs`.
- **Walkable area**: the painted area, moved only where a choice needs it (the gate: its south edge carried to the
  lower flight's foot). Recorded under `edges` in `build_choices.json`.
- **Status** of an entity: built (as its kind's default or its `how`), or not built yet (`unbuilt`, with a reason).
- **Choice**: a size or shape the strokes can't give, marked `choice:` in the builder.

## The files

| file | written by | holds |
|---|---|---|
| `map/strokes/<S>.json` … `map/text/<S>.md` | the map (README.md) | what is painted, where |
| `sections/<name>/layout.json` | `tools/map_layout.mjs`, never by hand | the build's positions, the painted area, the recorded moves |
| `sections/<name>/build_choices.json` | by hand | `moves`, `how`, `unbuilt`, `edges`, each with a reason |
| `sections/<name>/placed.json` | the builder's `build()`, never by hand | triangles per owner, and the walkable area |
| `sections/<name>/people.json` | by hand (skill `characters`) | who each painted figure is and what they do; `animals`: each painted animal's model, load and cycle |
| `sections/<name>/backdrop.json` | by hand | the painted panels beyond each edge, the ring, the mist |

## How it is enforced

- **The builder is strict.** `street_b1.Buckets(strict=True)`: every piece of geometry is added inside
  `with sb.entity("<map id>"):`, and anything added outside one is an error. The innermost entity wins, so a prop
  inside a building keeps its own ID.
- **The count check.** `node tools/loyalty_check.mjs <S>` compares the map with `placed.json`, the layout's trees and
  `people.json`, kind by kind, and prints the table. It fails on:
  - geometry owned by something that is not in the map;
  - a person who is not a mapped figure, or invented traffic;
  - a mapped entity that is neither built nor listed as unbuilt.

  Run it after every build. A scene is not shown while it fails.
- **The edges.** Walk tests (`walks.json`) check that each edge stops you, and that nothing that isn't painted blocks
  the way.

## Beyond the edge: mist and the painted ring

- **Mist.** `web/src/post.js`, set up by `web/src/backdrop.js`. Every pixel's world position is rebuilt from depth, and
  the further it lies outside the painted area, the more it turns to mist, ink and all. The mist colour is the hour's
  horizon haze, so the ground dissolves into the sky. Like real mist, it thins near the viewer, so you always see
  yourself.
- **The ring.** Painted panels stand on a ring well beyond the walkable area, one past each edge that has something
  beyond it. A misty floor carries the ground out to them.
  - **Making them:** `node tools/backdrop.mjs <name> all`. Each panel restyles the scroll strip that lies past its edge
    (`backdrop.json` `scan`) with `prompts/backdrop_panel.txt` plus its content prompt and the style image, keys out
    the painted sky, and fades its ends into mist.
  - **When a panel goes:** when the neighbouring section is built, its panel goes and the edge wall moves.

## Splitting the work (for parallel workers, later)

A **piece** is a set of map IDs owned by one worker, for example "the bridge and its trestles" or "the far
buildings". A worker:
- builds only its own IDs, each inside `sb.entity(...)`;
- adds new parts to the kit as generic functions that take positions from the caller: shared parts to `song_kit.py`
  (the lead), parts first needed by its own section to `blender/kit_<name>.py`, which other sections import and reuse
  (the kit is `song_kit.py` plus its modules: `kit_vehicles.py`, `kit_inner_city.py`, `kit_outer_road.py`);
- tests its piece in the composed scene;
- reports any thing it finds painted but missing from the map, instead of building it unmapped.

The lead composes the pieces, runs the count check, the walks, the people check and the shots, and records the
results.
