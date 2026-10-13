**Merged into scroll-section "Mapping a section" (steps 1–3) and "What the outer road and the inner city taught",
web-scene "Building a new section", characters "Casting a big section", 2026-10-12** (round 1; checked by the round-2
records agent). "Moves shift `pos` only" is out of date: `map_layout.mjs` moves the whole entity.

# Inner city (S6): workflow lessons for the next area

Written by the S6 area agent (Runs 1 and 2, 2026-10-11/12) so the next area can repeat what worked and skip what
didn't. The records of what was built are in `sections/inner_city/notes.md`; the map in `map/text/S6.md`.

## Mapping (Run 1)

**Split.** Seven subagents ran in parallel from one brief (`gen/map/S6/brief.md`, made from S5's):
- six tiles of **600 px** ownership, each looking 150 px past both ends;
- one structures pass for the whole area: buildings, structures, roads, ground.

The brief asked for tiles of about 800 px, but S6 is the densest part of the scroll (180 figures in 3600 px), and
600 px kept each agent at about 25–40 figures. Each agent took 30–80 minutes and about 300k tokens. The structures pass
was the slowest, at 78 minutes.

**What the brief must say for each tile:**
- what scholars place in its range (sections.md §2 and the 名画记 pins converted to scan u), as hints to verify;
- the seam entities by ID, and who owns which part of them;
- the support names to use (`zhengdian upper floor`, `inn upper floor`, `sedan: <id>`, `cart bed: <id>`), so the
  heights can be put in the frame afterwards.

**Who records what is the main source of misses.** Name it explicitly for the borderline kinds. Four painted things
were missed because each side left them to the other:
- a lantern standing by a door: tile agent or structures agent?
- a pole scaffold on a shop front: a prop or a structure?
- a figure on the boundary between two tiles;
- a porter half-hidden behind another porter.

The rule that worked in the brief: anything that stands on its own is the tile agent's prop; anything hung on a
building is part of the building, written in its `what`. "If unsure, record it as your prop: a duplicate is easy to
drop, a miss is not." Even so, the lead's second pass, one overlay window per tile at zoom 1.2 read against the
scroll, found 4 more.

**Seam duplicates come in disguise.** The same cart was read by two tiles with its front at opposite ends (a
"handcart" pulled west, a "barrow" pushed east). The same donkey and the same sedan passenger were recorded twice.
`scroll_map.mjs merge` flags only same-kind points closer than 30 px, so read the seam lists in the agents' reports as
well. Resolve each by looking at a zoom-3 crop: which way does the man face, where are the handles?

**The restyle misreads ornament as people.** The AI restyle turned 孙羊正店's 彩楼欢门 (posts, flower bunches,
streamers) into two tiers of balconies packed with drinkers, and filled the upper storey with people the strokes
don't paint. On the scroll there are four. Read the check sheets before the tile agents start, and send them a
warning for any area where the restyle invents. Trees again came out bare with willow buds where the scroll paints
needle clusters.

**Cross-section links.** `scroll_map.mjs check` rejects group members that aren't in the section's own map, so an S6
group can't list `S5.fig.cart_pusher_5727`. Put the link in the group's `note`, and the S5 side in the seam notes for
the lead.

**Supports.** Agents invent support strings ("on S6.prop.tray_stand_4385", "table: …", "well cover (the back beam
…)"). Normalise them in `merge_fixes.mjs` to a few frame keys:
- `ground: on <prop>` where the base point is the ground under the thing;
- `table top: <id>` where the base point is on the top;
- per-vehicle keys such as `cart bed: S6.veh.wine_cart_3090`, because the frame's support match is exact or by
  prefix;
- `carried on back`, `shoulders`, `sedan`.

Then derive each height from two stroke points, and write how it was found in the frame.

**Frame.**
- Group the receding edges by area (west, middle, east) and use each group's mean as a knot.
- Expect a scatter of about ±5 px/m.
- Check the knots by measuring the direction of mapped walls (S6: 93° and 94.5° against 90°).
- The far rows at the top of the silk are painted at about 0.55–0.6 of the street's scale (figures, posts, wheels).
  The user then ruled real size everywhere: map positions and footprints, real heights and sizes.

## Building (Run 2)

**Read the user's real-size rule into everything** (2026-10-12): positions and footprints come from the map, heights
and sizes are real. In practice:
- **painted props are drawn at the figures' 1.3×**, so use painted px / 100 for their real size (tables 84 px →
  0.84 m, umbrellas 262 px → 2.6 m across, lamps 125 px → 1.25 m);
- **painted buildings are at about the street's scale**, so their mapped eaves are roughly real near the street
  (2.6–4.1 m);
- **far rows and things the painter squeezes** (a house eave read at 1.75 m, upper storeys only 1.5 m tall) get real
  heights as choices.

**Things inside footprints.** Before building, test every figure, prop, animal and vehicle against every building
footprint (a 20-line point-in-polygon script). In S6 the hits were:
- interior items of open shop fronts: fine;
- figures and props painted behind the south-side roof ridges: the street's south edge read at v 1440 is only its
  narrowest reading;
- one attendant at the inn's estimated front.

Fix these by moving the estimated house fronts south, as a `choice:` in the builder, not by moving the painted
things.

**The kit gaps** (S6 needed all of these; now in `blender/kit_inner_city.py`):
- two-storey parts: a pent roof (`lean_to`), an upper floor slab, wall bays with windows, open bays and doors;
- a hip-gable roof (`xieshan_roof`);
- the 彩楼欢门 (`cailou`) and a small pole scaffold;
- 栀子灯 gourd lamps and lamp-boxes;
- signboards, eave plaques, a banner on a slanting pole, the 解 A-frame board, all from a sign atlas;
- the square well;
- umbrellas, mat roofs and slatted barrier fences;
- stall furniture (tray stands, counters, benches, stools, tubs, baskets, a chopping block) and goods (paper
  offerings, hanging pork, dishes, an ewer).

**Signs.** Ma Shan Zheng (`gen/fonts/`) has no traditional forms for 孫 劉 揀 員 楊 應 錦 鋪, which the scroll paints. LXGW
WenKai TC Bold (OFL) has all of them. It is in `gen/sections/inner_city/fonts/`, and
`gen/sections/inner_city/make_signs.mjs` packs every sign into one 1024 px atlas. Illegible characters (□) are drawn
as faded, broken strokes, never guessed.

**What broke and how it was fixed:**
- **A pent roof facing north rendered inside out.** `song_kit._roof_surface` winds a slope by the order of its eave
  points. For a north-facing slope the x ends must be swapped (`lean_to` does it now).
- **Triangles.** The first build was 131k triangles on about 1600 m², double Messenger's 38 per m².
  - The expensive parts were plank decks on upper floors that are seen only from below (3–4k each), bracket sets
    (about 300 each) and flower bunches.
  - Plain slabs under the floors, brackets on every other column and fewer flowers took it to 114k.
- **Seated figures stood on their seats.** people.js grounds a figure by a ray down from H + 1.2 m, so a colliding
  seat lifted it and the sit clip then floated. Seats under seated figures don't collide now.
- **Walkers on paths through carts.** Walk paths are cut short where a building footprint, a vehicle's band (front to
  rear, ±0.9 m) or the painted area stops them. Two painted walkers had no room and stand instead.
- **A walk clip a character lacks makes the walker slide.** A figure falls back to idle when its clip is missing,
  which is fine, but a walker sliding while it idles is not. A walker plays a walk its character has: `carry_pole`
  with the porter's pole props, `back_load` with a back frame or bundle, `fan_walk` with the fan, else `walk`.
- **Children carried by adults.** A carried child is drawn by its carrier's prop (people.json `carried_by`, the
  woman's `child_in_arms`). For a child on the shoulders or on the back there is no prop yet, so they stand beside
  their carriers.

**Casting 180 figures.**
- Dump every figure's `what` (dress, age, sex, action) into one text file.
- Cast by dress against the existing characters, and request a new one for each type none fits: children, a woman,
  monks, sedan bearers, the storyteller, the butcher, white-robed scholars, elders in tall hats, a bare-backed archer.
- Keep the cast as data (`gen/sections/inner_city/cast.json`), and generate people.json with a script
  (`gen/sections/inner_city/make_people.py`) that holds:
  - the per-figure action cycles, named after the actions the painting asks for, each mapped to the nearest clip
    the character has (an ALIAS chain); what is still wanted goes to `clips_why`;
  - each new character's `stand_in`, until the workshop delivers it;
  - the children's scales;
  - the walkers, chosen from figures painted walking or carrying and not held to a cart, sedan, animal or child;
  - the animals with their tack.

  Rerun it when the workshop delivers.

## QA and fixes (Run 2)

An independent QA agent walked and shot the joined and the alone page (42 spots, 17 walks, people_check), and every
fix was rechecked the same way. **What it found, and the rule each finding gives:**

- **Hollow shop fronts.** The dark back of an open shop front was a non-colliding quad, so the walker went through
  into an empty box.
  - Rule: the back of every open front is a colliding board.
  - Every door in an unpainted wall gets an invisible board in its opening (`wall_bays` does it now). Walk into every
    front and every door.
- **People on furniture, in vehicles or on air.** A spot inside a counter or tub puts the figure on top of it, because
  people.js drops a ray from H + 1.2 m. A spot in a cart puts a shaft through the figure.
  - Rule: test every final figure spot (after nudges) against building footprints, vehicle bands, animal bodies and
    ground props. Know which side a counter's depth runs (`counter()` runs to the left of p0 → p1).
  - A figure painted on a vehicle bed stands beside the vehicle until the kit has seats.
- **Tree cards growing out of roofs.** Trees painted at the silk's edge stood inside walls built to the estimated
  depth.
  - Rule: run the same point-in-footprint test for trees. Move the building's back wall (`choice:`), or move the tree
    along its painted receding line (a move with its reason).
- **Teams at real size do not fit where they are painted.** A four-mule team needs about 5.5 m ahead of the wagon's
  front point (shafts plus two 2.4 m ranks), while the painter overlaps the mules within 2.5 m.
  - Rule: set the team out along the vehicle's axis from the kit's shaft rule. The rear rank's hind ends stand at
    least 0.3 m past the shaft tip, which is at least box front + 1.0 m.
  - Turn the lead rank toward the painted heading only as far as the neighbours allow, then move whatever painted
    thing still clashes (here the barrow), recorded.
  - Give people.json `facing_deg` for every set-out animal, and let the builder's harness read the same value.
- **Moves shift `pos` only.** `map_layout` applies a move to `pos`. A vehicle is built from `pts`
  (front/rear/wheels), so the builder must shift the moved entity's `pts` and `footprint` too (`derive()` does it now).
- **Animal formations** written into `build_choices.json` need the run order make_people → map_layout → make_people,
  because the walk-path blocks read the moved animals from `layout.json`.
- **Walk paths must stop at ground props.** A walker whose path ran over a big basket climbed it, stood raised and
  never reached the player's road spot (people_check FAIL). Paths now stop at every ground prop (its radius + 0.3 m),
  at every animal's real body (animals.json length and width) and at vehicles (front to rear plus 0.6 m, ±1.0 m).
- **Mirrored text.** A quad seen from its back mirrors its sign. Build sign faces so the cell's left edge is on the
  viewer's left (a, b, b_top, a_top with the UVs in order), and read every sign in a shot.
- **A kit part can contradict the painting.** The kit's sack cart is a barrow with its deck over the wheel (2R + 0.12),
  which put the sacks on a 1.9 m stilt frame. The map paints a two-wheeled cart whose load hangs beside the wheel. Use
  another kit body (the 太平车 with sacks), record it as a `choice:` and tell the workshop. Never edit the shared kit.
- **Delivered characters change the casting.** When the workshop delivers, drop the stand-ins, map every requested
  action to the character's real clips (ALIAS chains), add props (`carry_pole` + pole loads, `back_load` + frames,
  fans, a cleaver), rescale the children on the child model (fraction × 1.70 m / its height_m), and recast seated
  figures whose character can't sit yet (recorded in `cast_why`).
- **The dev page reloads while other agents write into `web/`.** A long people_check died twice ("Execution context
  was destroyed"). Run the road spots in batches of 2–3 and rerun any batch that dies.
- **Probe whose geometry is where:** wrap `street_b1.Buckets.add` and `song_kit.placed.__exit__` in a headless build
  and report the owners of vertices inside a box (`placed` transforms at exit, so a probe on `add` alone sees local
  coordinates). It found the stray "dark bar": the clinic's counter poking through the cloth shop's wall.
- **Camera spots inside people or animals** make useless shots. Use `{"view": "first"}` and stand clear of the
  painted crowd, or use the frozen-player helper for mid-air spots (`gen/sections/inner_city/qa/shots_fly.mjs`).

## Text for the skills (for the lead to merge)

### scroll-section, "Mapping a section" (add after step 1)

> - **Tile width follows density.** About 800 px of ownership where the scroll is open; 600 px where it is dense (S6's
>   inner city: 180 figures in 3600 px). Each tile agent's prompt lists what scholars place in its range, the seam
>   entities it owns or must leave, and the support names to use.
> - **Say who records the borderline kinds**: free-standing signs, lamps and stalls are the tile agents' props; what
>   hangs on a building is part of the building (in its `what`); scaffolds and pole frames on a shop front are
>   structures. Things one side leaves to the other are the most common misses.
> - **Read the restyle's check sheets before the tile agents start**, and warn them where it invents (S6: the 彩楼欢门
>   became balconies of drinkers).
> - **The merge:** besides the flagged near-duplicates, read each agent's seam list: the same cart was read with its
>   front at opposite ends by two tiles. A group can list only its own section's IDs; links to a neighbour's entities
>   go in `note`.
> - **Normalise supports in `merge_fixes.mjs`** to the frame's keys (`ground: on <prop>`, `table top: <id>`,
>   `cart bed: <vehicle id>`), and derive each height from two stroke points.

### web-scene, "The atomic scripts" / "A run" (add)

> - **Real size everywhere** (the user, 2026-10-12): positions and footprints come from the map; heights and sizes are
>   real. Painted props are drawn at the figures' 1.3×: size them at painted px / 100. Far rows painted small keep their
>   footprints and get real heights (`choice:`).
> - **Before the first build, test every mapped point against every building footprint.** Figures painted behind a
>   roof ridge mean the house front stands further back: move the estimated front (`choice:`), not the figure.
> - **Section kits:** parts a section needs that song_kit lacks go in `blender/kit_<section>.py` (generic, positions
>   from the caller); the lead moves them into song_kit. Signs come from one atlas per section
>   (`make_signs.mjs`: characters as painted, OFL kai font with traditional forms, illegible ones drawn faded).
> - **Budget:** a plank deck seen only from below costs 3–4k triangles: use a plain slab. Bracket sets cost about 300
>   each. Check `placed.json` owners after the first build and cut the biggest.
> - **Seats under seated figures don't collide** (people.js grounds a figure by a ray from above).
> - **Close every unpainted interior:** the dark back of an open front is a colliding board; every door in an unpainted
>   wall gets an invisible board in its opening. walks.json walks into every front and every door.
> - **A recorded move shifts `pos` only:** the builder shifts the moved entity's `pts` and `footprint` itself, so a
>   moved vehicle is built where its animals and people now stand.
> - **Teams at real size:** set a painted team out along its vehicle's axis by the kit's shaft rule (the rear rank
>   0.3 m past the shaft tip, at least 1.0 m past the box), give each animal `facing_deg` in people.json and build the
>   harness from the same value. Record what had to move for it.
> - **Before shipping, test every final spot** (figures after nudges, trees, animals, vehicles) against footprints,
>   vehicle bands, animal bodies and ground props, and read every sign in a shot (a quad seen from its back mirrors).
> - **A kit body that contradicts the painting:** use another kit function and record it as a `choice:`; tell the
>   workshop. Never edit the shared kit.

### characters, "Routines" (add)

> - **Cast a big section from a table, not by hand:** dump each figure's `what`, cast by dress, keep the cast as data
>   (`cast.json`) and generate people.json with a script holding the action cycles, stand-ins, child scales, walkers
>   and animals; rerun it when the workshop delivers.
> - **Name the requested actions in `do` already:** a character without the clip plays idle until it arrives. Walkers
>   must use a clip their character has (a missing walk slides).
> - **Walk paths:** along the painted direction, cut short at buildings, vehicles (front to rear plus 0.6 m, ±1.0 m),
>   every animal's body, every ground prop (its radius + 0.3 m) and the painted area's edge; a painted walker with no
>   room stands.
> - **When the workshop delivers:** drop the stand-ins; map each requested action to the nearest clip the character
>   has (an ALIAS chain) and write the rest to `clips_why`; give walkers the walk that holds their load
>   (`carry_pole`, `back_load`, `fan_walk`) with the props; scale children on the child model (painted fraction ×
>   1.70 m / its height_m); recast a seated figure whose character can't sit yet (`cast_why`).
> - **A figure painted on a vehicle bed or on someone's shoulders/back** stands beside it until the vehicle kit has
>   seats and the characters have carrier props; say so in `nudge_why`.
> - **people_check on a shared dev server:** run the road spots in batches of 2–3; a page reload kills a long run.
