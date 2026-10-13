# Brief: mapping section S5 (the city gate) from the strokes

You are one of several agents building **the scroll map** of 清明上河图 for a walkable web world. The map records
where every thing in the painting is, measured from the strokes, so that later sessions and builders never need
to look at the scroll again. Errors here become errors in the world, so precision and completeness matter more
than speed.

**Read first:** `qingming/map/README.md` (the format: IDs, points, kinds, fields, axes; follow it exactly), then
`qingming/reference/scroll/sections.md` §3 "The city-gate section" (what scholars say is where, by scan x).

## Where things are

- Working directory: `/home/ran/3d_director/qingming`.
- The scan: `reference/scroll/qingming_commons_38414x1800.jpg` (38414 × 1800). All points are full-scan pixels
  `[u, v]`, u to the right, v down. Section S5 spans u 5600–9400, v 0–1800 (the silk's bottom edge is at about
  v 1790).
- Axes: picture right = east (out of the city), up the silk = north (away from the viewer). `facing_deg`: 0 = east /
  right, 90 = north / away, 180 = west / left, 270 = south / toward the viewer. The road runs left–right through the
  gate passage (around u 7280–7450) and over the moat bridge (u 8250–9300, lower right).

## Tools for looking

- `node tools/scroll_map.mjs S5 overlay --parts none --grid 20 --x U0-U1 --y V0-V1 --zoom 3 --out /tmp/...jpg`
  crops the scan with a labelled grid in scan px. Use windows of about 250 × 250 px at zoom 3 to read points (each
  grid cell is 20 px); `--grid 50 --zoom 1` for wider views. Then Read the jpg. Write crops under
  `gen/map/S5/look/` (create it; name files after your tile), not in the repo's other folders.
- `node tools/scroll_inspect.mjs gate <u> <v> <half>` shows the scroll beside our registered AI restyle
  (`gen/sections/gate/mosaic.jpg`) with a grid (half ≤ 300 → 3× zoom). The restyle helps read faded silk, but it is
  a repaint: **positions come from the scroll's strokes**, and anything visible only in the restyle gets
  `"conf": "low"` and a note. It only covers u ≤ 9312.
- `node tools/scroll_map.mjs S5 overlay --parts <your file> --grid 50 --x U0-U1 --zoom 1` draws your entities on
  the scan; `node tools/scroll_map.mjs S5 check --parts <your file>` validates the format.

## How to measure

- Work systematically: walk your range in columns about 250 px wide, top to bottom, and list everything in each
  window before moving on. Small, distant and half-hidden things count. Figures far up the silk (behind trees, on
  the wall, in the background) count.
- Points to about ±5 px. Ground contacts, not boxes: a figure's `foot` is midway between the feet where they touch
  the ground (for a walker, midway between the planted foot and the ground under the lifted one). Hidden feet: put
  the point where the feet must be from the body (e.g. under the hips for a figure behind a rail) and mark it
  `"est"`. A seated figure: `foot` where the feet rest; say "seated on <what>" in `what`. A rider: a figure entity
  with `pose: "riding"`, `support: "animal S5.ani.<id>"`, `foot` = ground point straight under the seat (`est`),
  plus the animal as its own entity. A kneeling figure: `foot` at the knees.
- Animals: `fore` = ground under the front hooves (their midpoint), `hind` = ground under the hind hooves, `head` =
  the head. Note load, harness and who leads it.
- Vehicles: `front` / `rear` = ground under the front end (shafts) and rear end; `wheels` = where each visible wheel
  touches the ground. Note the type (串车 wheelbarrow, ox cart, covered cart), load and draught.
- Trees: `base` = where the trunk enters the ground (`est` if hidden), `top` = highest point of the crown,
  `crown_w` / `crown_e` = the crown's west and east extremes. In `what`: species as painted (bare elm-like with
  twisted branches, willow, pine-like with needle clusters, other), size, lean, leafing, anything growing on a
  wall. `support` = ground, wall top, bank slope.
- Props: anything that stands on the ground and isn't a building: bales, baskets set down, jars, the barber's
  awning and stool, stalls, benches, poles, signboards, piles. `base` point (or footprint corners via `pts.base`
  {sw, se, ne, nw} for bigger ones).
- Groups: when several entities do one thing together (a quarrel, a caravan, a ring of idlers), add a `group`
  entity with `members` and a `what` that says what the group is doing, and set `group` on each member.
- IDs: keep the seed IDs you are given. For new entities, make the slug say what the thing is and end it with
  the u of its main point so IDs never collide between agents: `S5.fig.porter_8420`, `S5.tree.elm_7820`,
  `S5.ani.camel_6290`, `S5.veh.cart_screen_8380`, `S5.prop.bales_6120`, `S5.grp.tax_quarrel`.
- `what` is what someone who never sees the picture will read: dress, action, what the hands hold, which way the
  head turns, the load, the state of a tree. One or two sentences, concrete.
- Use `src` when sections.md names the vignette. Use `vis` and `conf` honestly.

## Ownership

You own entities whose main point (figure foot, animal fore, vehicle front, tree base, prop base) has u inside
your range, [start, end). Look about 150 px past both ends for context, and don't record things owned by the next
tile. A group that crosses the boundary goes to the tile holding most of its members; list all members (other
tiles will use the same ID scheme, so name members you don't own by their expected ID only if you're sure;
otherwise list only your own and say so in the report).

## Seeds

`gen/map/S5/seed/figures_seed.json` holds 17 figures measured on 2026-10-10. Include the seeds in your range in
your output with the same IDs. Re-check every point, correct what is wrong, and say what you changed in `note`.

## Finish

1. Write your file as `{"section": "S5", "entities": [...]}` (path given below).
2. Run the check, then the overlay over your whole range (zoom 1, grid 50) and several zoom-2 windows over the dense
   parts. Read every overlay image. Every marker must sit on its thing; fix and repeat until it does.
3. Reply with a short report: counts by kind, what was hard or ambiguous, seeds you corrected, faded areas, things
   at your range's edges that a neighbour may also record, and anything that contradicts sections.md.
