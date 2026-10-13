**Merged:** the first part into web-scene "The atomic scripts" (Boats) and "Boats and water", 2026-10-12 (records
agent); the second part ("The boat kit's fixes after the page round") into web-scene "Boats and water" (crews on open
deck, the bow wave, `board__edge`) and the Boats row (`kind_of` order), 2026-10-12 (round-2 records agent). Its
"What the tools don't carry yet" list is out of date (`map_layout.mjs` copies `pose` and `what`).

# The boat factory's lessons (round 2, 2026-10-12): exact text for the skill `web-scene`

Each block below is ready to paste. The first goes into "The atomic scripts" table, the rest into a new section
"Boats and water (what the boat factory taught, 2026-10-12)" after "Building a new section".

## Row for the atomic-scripts table

| Boats | `blender/kit_boats.py` (a kit module of its own beside `kit_vehicles.py`) | The painted boats as kit models, real size per type (`TYPES`, `choice:`): `passenger` (客船: long windowed house, bow platform and curled stem post, foredeck canopy, stern gallery), `grain` (漕船 / 万石船: `hold='laden'` mat mound under a rope net, `'awning'` arched mat awnings, `'hatch'`; a crew house aft), `small` (awning or open, thwarts). Options as painted: `mast` `'up'`/`'lowering'`/`'down'` (the A-frame 人字桅 with rungs, stays, `tow_to`), `sweep` (大橹), `oars`, `gangplank`, `moor`, `cargo`, `cloths`, `stern_house`. `boat_from_layout(ent, map_id, sink='nodes'|'world')` places one from its `layout.json` entity (`front`/`rear` at the waterline, centred on their midpoint, turned to their heading). Sink `'nodes'`: one movable root per boat (`boat:<map id>`) for the page, with `body`, `deck__col`, `roof__col`, `rim__col`, `board__edge`, `wet__ring`, moving parts (`mast`, `sweep`, `oar_*`), re-aimable `line_*` ropes and named points in extras; `export_boats()` writes them to one GLB. Sink `'world'`: baked static into the section's buckets inside `sb.entity(id)`. `lod=1` for far boats. Review: `scripts/blender_wsl.sh -b --factory-startup --python qingming/blender/kit_boats.py -- review <out_dir> [names] [lods]` (`export` for GLBs); types and painted parts in `gen/boats/types.md`, the water in `gen/boats/water.md`, the sheet `gen/boats/sheet.jpg`. |

## Boats and water (what the boat factory taught, 2026-10-12)

**Boats are movable roots, and the web pipeline rewrites node transforms.** `tools/export_web_scene.mjs` runs
`gltf-transform optimize` with meshopt, and two of its steps reshape a node tree:
- **prune** deletes empty leaf nodes, so a point exported as an empty is gone. Named points ride in their parent
  node's extras (`points: {name: [x, y, z]}`, in that node's glTF frame, y up). Extras survive.
- **quantization** multiplies the dequantization matrix into the transform of any leaf node that holds a mesh. A
  movable part or a rope you re-aim at runtime must therefore be an **empty that holds the transform and extras, with
  its mesh in a child**: quantization leaves nodes with children alone and puts its correction in the child.
  `kit_boats.bake_boat` does this for every node. Check a shipped GLB by rebuilding each line from its end points
  (`gen/boats/glb`, a 0.000 m error after the fix, hundreds of metres before).

**Ropes between parts that move apart are unit lines.** A stay from a lowering mast to the deck, a tow line to a
tracker on the bank, a mooring line or a gangplank is a node `line_<name>` holding a 1 m mesh along its local +Z, with
extras `a` and `b` (point names). Each frame: position = a, lookAt(b), scale.z = |b − a|. World-fixed ends (the
tracker, the mooring post, the gangplank's foot) sit in the root's extras `world_points`: the page keeps their scene
position while the boat moves.

**Real size against the painted size of boats.** Boats far up the silk are painted small. S4b's biggest rafted boat
maps to an 8.1 m waterline and S3's sweep boat to 7.4 m; both are built at 19-20 m. S2's passenger boat, painted
lower, maps to 17.7 m against 19 m. Seen stern-on, a hull is foreshortened (S2's grain boat: 13 m against 20 m).
`boat_from_layout` builds the type's real length centred on the painted midpoint and returns `.note` when the map
differs by more than 30%. Rafted boats at real size overlap their painted neighbours and run into the bank: give
them `lw=` choices, or record moves. Measure hulls against figures painted on them (figures are drawn about 1.3x
life). Don't measure them against the frame's metres.

**Plank seams draw only as laps.** The ink pass (`post.js`) fires on normal changes, so a seam between two coplanar
strakes draws nothing. Each strake is its own band whose lower edge stands 2.5 cm proud with a 45-degree chamfer
facing down and out. The chamfer faces the walker's eye (5-15 degrees above the water) and the scroll's view, so it
draws as one ink line per seam and shades a little darker. Wales and the gunwale cap are swept bars with a top, an
outer face and a bottom: two lines each.

**Boat budgets.** At full detail a big boat is about 6.4-6.8k triangles (the hull and wales about 1.8k, the house
2.4k), 124-143 KB shipped (geometry only; the swatches are shared). At `lod=1` it is 1.7-2.4k triangles, 58-74 KB. A
small boat is 1.3-2.1k / 0.6-1.2k triangles, 42-60 / 30-44 KB. Colliders add 200-250 triangles (deck, roof blocks,
rim walls in 2 m pieces), the boarding edge 90, the wet ring 70. S2's 16-20 boats cost 2-2.7 MB at full detail.
Ship far boats at `lod=1` only, or switch by distance on the page (Messenger: beyond 20 m). The cheapest cuts were
coarser deck strips (2.4 m), every other post and two of three rails at `lod=1`, and single-ring coils.

**Decks for crew and for walkers.** `people.js` drops a figure from H + 1.2 m onto the first collider below, and an
empty BVH returns y 0. Every boat therefore has a hidden deck (`deck__col`, its top the deck surface; a laden boat's
cargo mound and the stern gallery are in it) and roof blocks (`roof__col`, cambered tops at the roof surface, walls
that stop a walker). `boat deck: <id>` (the gunwale's H) lands on the deck 0.2-0.4 m below; `boat roof: <id>` lands on
the roof. The water itself never collides.

**The water level decides what the bank sees.** With the seed water H −1.5 and the eye 1.6 m above the bank, a
deep-laden grain boat 25 m off the bank shows only its mat mound over the bank edge (`gen/boats/review/
grain_laden_lod0_eye.png`). Measure the river's H once, on S4b's stair or bank face. The whole look of the moorings
depends on it.

**Review renders that show the ink.** Blender's Freestyle with crease 140 degrees, silhouettes and borders
(`kit_boats._review_scene`) roughly shows where the page's ink pass will draw. Subdivide large planes (the review
water and bank): on two-triangle planes Freestyle's visibility test fails and draws hidden hull lines across the
bank. `kit_boats._true_colour` applies palette.js's retint (texture × target / mean), so the renders show the page's
true colours, not the swatches' aged yellow.

**Line-art textures.** Asked for a seamless tile, shyfai (gpt-image-2.5) drew the current lines seamless already
(`gen/boats/water/tile_check_raw.jpg`). `tools/make_tileable.mjs`'s cross-fade ghosts line art into doubled strokes:
check the raw tile's seam before cross-fading a drawing.

**What the tools don't carry yet for boats** (lead-owned; until then the builder passes these by hand):
- `tools/map_layout.mjs` copies neither `pose` nor `what` for vehicles. A boat's motion (moored or under way) and its
  type come from them, so pass `pose=` to `boat_from_layout`; `kind_of()` reads the slug.
- `tools/scroll_map.mjs world()` does not convert `beam_n` / `beam_s`, `bow_top` / `stern_top` (heights from the rise,
  like the corners' `_top`) or `mast` / `mast_top`. `boat_from_layout` uses them when they come through.

# The boat kit's fixes after the page round (2026-10-12, the boat kit's owner): exact text for the skill `web-scene`

The page round (`gen/expand/boats_page_lessons.md`, "Kit clashes found on the page" and items 2, 5 and 8 of its open
list) found four kit faults. Fixed in `blender/kit_boats.py`; the API, the export structure (roots, colliders, pivots,
extras) and the test page's numbers are unchanged except where noted. Proof: the test page's 12 walks and 5 rides
PASS on the re-exported boats (end points as before; 3 mm drift on the rowed boat R), S4b's six boats build through
`export_web_scene.mjs` with the right types, and a headless crew check (below) passes every spot on 12 rigs.

**Replace** in the Boats row of the atomic-scripts table: "`kind_of()` (slug, name, `what`)" with "`kind_of()` (`what`,
then name, then slug)". The "What the tools don't carry yet" list above is out of date: `map_layout.mjs` now copies a
vehicle's `pose` and `what`, and the kit reads both from the entity (`pose=` and `kind=` stay as overrides).

## Boats: where the crews work (add to "Boats and water")

**Read a boat's type from its `what`, not its slug.** The river agents' slugs name what caught their eye
(`boat_small_cabin_15182` is small, `boat_arched_awning_14945` is a grain boat). `kind_of` now reads the `what`'s head,
the words before the first boat noun ("A smaller boat", "The big cargo boat", "Only the bow of a small boat"), for a
type word, size first. Failing that it counts the parts painted on the hull: cabin, deckhouse, windows or board walls
(passenger) against mat roof, awning, hood, cargo, hold, hatch, sweep or tow (grain), with other boats named in the text
left out first (map IDs, "the big cabin boat's bow", 豪华客船). A tie falls to the name, then the slug. Counting
occurrences, not presence, matters: S4b's big cabin boat has a sweep, bales and a mat-roofed after cabin, and only its
four mentions of a cabin and its planked walls outvote them (5 to 3). On S4b's layout it gives the area agent's six types (the slug alone got three wrong). Over
every mapped boat it disagrees with `types.md` four times, and the area builders settle those with `kind`: S3's
`boat_mast_lowering_19518` reads grain (the map writes "the big cargo boat"; the kit's preset models #12 as passenger),
S2's `boat_mat_roof_22290` grain (types.md #18 small), `boat_bottom_28395` small, and `boat_mat_cabin_25980` passenger.
Test without Blender: stub `mathutils`, `song_kit`, `street_b1` and `kit_vehicles` in `sys.modules`, then import the kit
(session scratchpad `boats_fix/kind_test.py`).

**Crews work on open deck, as painted.** A sweep or an oar puts its crew where the page stands them: 0.55 m inboard
of `pt_sweep_bar`, spread 0.6 m either way across the loom, or 0.5 m inboard of an oar's grip. A roof over that spot
hides the crew. The kit lists what covers the deck as stretches along the boat: roofs, awnings, hoods, the laden mound,
the bitts, a mast's feet, deck cargo, a small boat's thwarts and the tiller. The crews go only into the open
stretches between (`_open_spans`).
- **The sweep (大橹)** as S3 #6 and S2 #16 paint it. Its pin sits on the stern frame (the gallery's side beam) at the
  quarter. The loom runs forward and inboard over the after deck, aft of any house, nearly level to a crossbar at
  chest height. Past the pin the shaft bends down astern into the water: a straight loom from the water through a pin
  2.8 m up reaches chest height only 15 m inboard. The crew's middle is placed so the spread and the swing stay inside
  the hull at both ends of the stroke: `SWEEP_AMP` 10 degrees (it was 14), at 3 m about 0.5 m each way.
- **The tiller is unshipped when a big boat has a sweep:** the sweep steers. Put over even 35 degrees, the tiller still
  lay across the whole after deck at chest height, through the inner hands at the stroke's end. `pt_tiller` is then the
  stock's head.
- **Oars** go on the foredeck of a big boat, where the painted working crews stand, with the rowers abreast at least
  0.6 m apart. On a small boat they go amidships between the thwarts, port and starboard in turn. Each grip comes inboard
  only so far that its rower stays on his own side. When the open deck is too short for the oars asked for, the
  rest share the longest stretch and `.note` says so (in the boats manifest). A small boat under an awning has room
  for one rower.
- **Check crew spots headlessly before the page** (session scratchpad `boats_fix/crew_check.py`). Emulate the page's
  placement, then for each spot cast a ray down to `deck__col` and five rays up through a 0.18 m radius column from
  0.3 to 1.8 m against the body and mast. Test both ends of the sweep's stroke. It found the tiller (1.2 m over the
  inner hand), a rower in a thwart and a rower past the floor's end before any page ran.

**The bow wave is its own node.** `wet__ring` is 0.6 m all round on every boat. A boat under way also has `bow_wave`
(extras `anim: "bow_wave"`): the same kind of ribbon (material `water_ring`, u 0 at the hull to 1 outside), 5 mm over
the ring, growing from nothing at 0.55 of the waterline to 1.4 m at the stem. It adds 34 triangles (14 at lod 1). The
page should show it only while the boat goes ahead (and hide it astern). Until it does, the wave shows as before.
`boats.js` takes it as a part of kind `bow_wave` that `animate()` ignores, and batches it with the rest. The static
sink still bakes it in for a boat painted under way.

**Boarding legs through the side are the page's.** The kit's `board__edge` already carries the gunwale's height all
round: its vertices are the gunwale top. A two-part bridge over the gunwale can read them there. No kit change is
needed.
