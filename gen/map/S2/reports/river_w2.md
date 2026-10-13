# S2 river_w2 report (owns u 21850–23300, plus 豪华客船 whole; looked at 21700–23450), 2026-10-12

Part: `gen/map/S2/parts/river_w2.json`, `check` PASS (31 entities). Overlay: `gen/map/S2/look/river_w2_overlay.jpg`
(u 21700–23800, zoom 1, grid 50). I also read zoom-2.4 overlays of the sweep boat and of 豪华客船 (u 22400–23760, zoom
1.4), and every marker sits on its thing. Working crops and the generator `make_part.py` are in the scratchpad
`S2_river_w2/`.

## Findings for the merge and the lead (read first)

1. **The "skiff" is the blade of a great stern sweep (大橹), not a boat.** The six men's loom runs unbroken past the
   boat's lashed stern frame (pivot ≈ (22400, 1000)) east-south-east to (22818, 1089). There its two edges spread into a
   flat blade with an upturned tip (u 22780–22945, v 1057–1112). It has no gunwale, thwart or second hull line. The
   sweep is about 700 px long and is part of `S2.veh.boat_sweep_22000`. S3's river_w has the same rig at u 15595: five
   men at a long sweep with its blade lying in the water.
2. **The crew is 15, not 20–25.** I counted head by head at zoom 3–4: 6 at the sweep, 6 on 豪华客船, 2 in the open
   boat and 1 in the mat-roofed boat. The restyle adds about 10: 7 at the sweep, about 5 in the open boat, about 5
   round 豪华客船's windlass, 3–4 faces in its windows, and a second man on the mat-roofed boat's gunwale.
3. **豪华客船 has its bow west** (conf med). The west end has the raked stem, the curved post with a netted knob and a
   beam lashed and projecting west at deck level. The east end carries the windlass, which sits on the **after
   cabin's roof**, not on a foredeck as the setup's warning calls it, and a small railed stern panel. The rudder is
   hidden behind 逆水行舟's bows. Its stem's main point is (22545, 775), so it is inside my range anyway. The hull lies
   at a slant: the waterline rises from v 910 amidships to v 775 at the stem, so the bow is further north
   (facing ≈ 172).
4. **余辉's two vignettes, as candidates (conf low, both tagged with "(?)" in `src`):**
   - **船侧祭神:** `S2.fig.boatman_pouring_bucket_22665` bends over the mat-roofed boat's side and tips a wooden bucket,
     whose stream runs down the hull into the river. The strokes don't say whether it is slops or a libation.
   - **客船启程:** `S2.grp.boat_passenger_crew`. A man climbs the ladder to 豪华客船's roof, where the mooring rope from
     `S2.prop.mooring_post_23126` is tied, as if casting off. Otherwise the boat looks moored.
   - Neither is settled. I tagged neither as certain.
5. **The south bank runs further east than the setup's look.** A low spit with clumps of growth runs under the
   mat-roofed boat to the silk's bottom edge at about (22680, 1790): `S2.grd.south_bank_spit_22400`. East of 22680 the
   silk's edge cuts the water.
6. **Water-level check** (S4b's reading rules): see "Water level" below. The landing steps give only a bound:
   H_water ≥ −0.99 m. That agrees with S4b's −0.7 proposal and doesn't tighten it.

## Counts

| kind | n | |
|---|---|---|
| boats (vehicles) | 5 | 豪华客船 `boat_passenger_22545`; the sweep boat `boat_sweep_22000`; the open boat `boat_open_21968`; the mat-roofed boat `boat_mat_roof_22290`; a small boat's bow at the silk's edge `boat_small_bow_22158` |
| figures | 15 | sweep boat 6; 豪华客船 6 (1 reclining on the roof cargo, 1 on the side walkway, 1 on the ladder, 2 in the open bay, 1 at the windlass); open boat 2 (1 conf low); mat-roofed boat 1 |
| props | 1 | the mooring post in the water's edge off the terrace, with 豪华客船's rope (`support: water`) |
| structures | 1 | the rough landing steps at the terrace's west end |
| water | 1 | `S2.water.bian_river_w2` |
| grd | 4 | the north bank (21850–23300); the south bank's mound; the south bank's flat edge; the low spit |
| groups | 4 | one per boat with crew (the small bow has none) |
| animals, trees, buildings, roads | 0 | |

**Crowds:**
- **The sweep:** six, counted head by head and leg pair by leg pair at zoom 3.6. West to east: the man leaning far
  back with his face up, the man with his head thrown back, the tall upright man, two capped men bending, and the man
  leaning on the loom at its east end. The restyle paints seven.
- **豪华客船:** six on the scan. At the windlass there is one man (the restyle paints about five). The windows of the
  long lattice cabin (u 22700–23300) show furniture, not faces: a chair or bench back at u 22960–23020 and a table with
  things on it at u 23090–23140, recorded in the boat's `what`. Two people are in the open bay at 23300–23440, one of
  them faint (conf med) and one only a dark hair mass over a face (conf low, man or woman).

## What was hard or ambiguous

- **The sweep boat's bow is not painted.** West of u ≈ 22050 its hull is lost under the great willow's whips (t2's
  `S2.tree.willow_great_21345`), so `front` is est at (22000, 1075).
  - Its stern carries an oval side panel with two eye-like marks. In some boats that marks a bow. I read the end where
    the sweep is worked as the stern (the lead's rule) and noted the other reading.
  - The men's feet are est at v ≈ 975, the deck edge under them. They lean on the loom at about knee height, where it
    runs east to the pivot.
- **Bottom boats:**
  - The open boat's heading isn't painted. Its front is put at the tied west end.
  - Its crouching figure at the east end (`S2.fig.crouching_figure_open_boat_22175`) could be a basket under a cloth:
    conf low, both readings in the note.
  - The small knobs on its far gunwale are bollards. The restyle makes two of them people.
  - The pole with a hanging cloth that the brief gives to the first bottom boat ("a pole or mast at ≈ 22100") belongs
    to the mat-roofed boat. It rises from the roof's west post (22278, 1505) to (22190, 1332), bound at (22215, 1430).
- **The bucket man's back:** a dark rounded mass east of his head (u 22640–22700, v 1540–1600) is read as his own
  hunched back. A second crouching man is possible (the restyle draws one). Both readings are in the note.
- **The mooring post's knot** (u 23124–23155, v 489–515) sits where 逆水行舟's tow rope passes (v ≈ 512). Part of the
  "knot" may be the tow rope crossing. The other reading of the post is one of the terrace's stilts (structures_w) with
  the rope tied to it (conf low).
- **No shoreline is inked anywhere.** The shores are where the bank wash and weeds stop and the ripple lines begin.
  豪华客船 hides the north shore over u 22400–23300 (est).
- **A light vertical streak at (22091, 530–575)** in the water is a crease or flaw in the silk, not a stake. The
  restyle doesn't draw it. Not recorded.
- **Read with the restyle:** only to check the bow post's netted knob, the eye panel and the open boat's bollards.
  Nothing is recorded because the restyle shows it.

## Seam notes (unit seams; no section seam in my range)

- **West, river_w (u 21850):**
  - The water's lines end at u 21850: `shore_n` (21850, 425, est), `shore_s` (21850, 1418, est, behind the mound's
    crest).
  - The north bank's `bank_top` starts at (21850, 300, est).
  - **The south bank's mound** `S2.grd.south_bank_mound_21700` has its middle in river_w's range. t2 left it "to
    structures_w or river_w2". I recorded it whole (crest 21413–21980). If river_w also records it, keep one.
  - The open boat's rope reaches the mound's east face at (21905, 1490).
- **East, river_m (u 23300):**
  - `shore_n` ends at (23300, 500, est).
  - 豪华客船 is mine by name. Its stern (est (23725, 895)) lies hidden behind the bows of 逆水行舟's two hulls.
  - 逆水行舟's tow rope (river_m's) crosses 豪华客船's roof cargo at v ≈ 490–515 and passes the landing steps' foot at
    v ≈ 485–495.
- **Land units:**
  - t2's big man in the broad hat, `S2.fig.big_hat_man_south_bank_22045`, sits on the bank's edge just west of the
    small boat's bow `S2.veh.boat_small_bow_22158`. I agree with t2 that he is on land. If the merge puts him in the
    boat, he becomes its crew and the support changes.
  - t4's terrace diners (`S2.grp.terrace_diners_23230`) look down on 豪华客船. That link is named in my group's note.
- **Possible duplicates:**
  - The landing steps `S2.str.landing_steps_22950` (t3 and t4 left them "to structures_w (stair) / river_w2 (bank)").
    If structures_w records them too, keep one.
  - The mooring post `S2.prop.mooring_post_23126`, if structures_w reads it as a stilt.

## Supports used

- `water`: the 5 boats and the mooring post.
- `boat deck: <boat id>`: 豪华客船's side walkway and open bay; the sweep boat's after deck; the open boat; the
  mat-roofed boat.
- `boat roof: S2.veh.boat_passenger_22545`: the man reclining on the roof cargo and the boatman at the windlass.
- **New:** `boat ladder: S2.veh.boat_passenger_22545`, for the man on the ladder. His feet are on a rung about 120 px
  above the ladder's foot on the walkway (23243, 835); the ladder's top is at the roof's edge, about (23305, 690).
  Normalise it at the merge to `boat deck: …` plus a height, or keep it as its own support.
- `ground`: the banks and the landing steps.

**Deck heights (painted Δv from gunwale or walkway to the waterline straight below; H above water = Δv / 77):**

| boat | deck or gunwale | waterline | Δv | H above water |
|---|---|---|---|---|
| 豪华客船, side walkway | (23200, 840) | (23200, 910) | 70 | 0.91 |
| 豪华客船, roof cargo top (the reclining man) | ~v 538 at u 22848 | ~v 880 | 342 | well above the cabin roof; the frame should take roof eave ≈ 140 px over the walkway, i.e. walkway + 1.8 m |
| 豪华客船, after-cabin roof deck (the windlass man) | ~v 590 at u 23468 | ~v 905 | 315 | about walkway + 3.2 m at painted size (the after cabin is tall); conf low |
| sweep boat, after deck | ~v 975–995 at u 22100–22200 | est ~1080–1112 | ~110 | about 1.4 (a raised stern deck; est) |
| open boat | (22100, 1536) | (22100, 1559) | 23 | 0.30 |
| mat-roofed boat, near gunwale at the bucket man | (22665, 1595) | (22665, 1690) | 95 | 1.2 (the stern rises; amidships est ≈ 0.9) |

## Water level (a check against S4b's reading only)

- **The only usable place is the rough landing steps at the terrace's west end** (`S2.str.landing_steps_22950`).
  - Top tread: (22932, 410), at the foot of the terrace's west wall, on ground level.
  - Lowest step at the water: (22952, 486, est), where the tow rope crosses it.
  - Δv = 76, so H_water ≥ −76/77 = **−0.99 m**.
- **This is a bound, not a reading** (S4b's argument). The stair recedes as it descends: its run of 5–6 treads must
  lie south of its top. Each metre of run takes 51.25 px of v, so the true surface is higher than −0.99. For example,
  a run of 0.5 m gives −0.65 m.
- **The bound agrees with S4b's proposal of −0.7 m.** It doesn't tighten it.
- **No vertical bank face is painted in my range.** The terrace's stilts (structures_w) stand in the water at
  v ≈ 485–500 under a floor sill at v 438–456. That gives a floor about 0.6 m above the water at painted size. It isn't
  a ground point, so it can't give the water level.

## Scale cues and receding edges

**Scale cues:**
- **豪华客船:**
  - Waterline about 1180 px (22545–23725).
  - Walkway to waterline 70 px. Walkway to cabin eave about 140 px.
  - Lattice window bays 45–55 px.
  - The standing man on the walkway is 145 px tall at foot v 838.
- **The sweep boat:**
  - The six men are 128–155 px tall at foot v ≈ 975: 139, 131, 155, 150, 136, 128.
  - The sweep is about 700 px from the loom at the men to its tip.
- **The mat-roofed boat:** about 590 px at the waterline, plus a stern frame to 23062. Roof posts at u ≈ 22280 and
  22735; roof top at v ≈ 1440.
- **The open boat:** about 270 px long; its seated man is 62 px tall.
- **For the diminution:** the boats' figures are far larger than the bank's. Figures on the water at v 840–975 are
  128–155 px tall. t2's trackers at v 235–386 are 85–99 px, and t4's eatery man at v 398 is 72 px.

**Receding edges:**
- No ground-level edge recedes in the water.
- The landing steps' west edge, (22916, 404) → (22935, 488), is a stair falling to the water, not a receding direction.
- **The hulls' slant, for the builder:**
  - 豪华客船's waterline rises toward the bow: (23000, 903) → (22545, 775), slope +0.28 between those points and
    steeper near the stem.
  - The mat-roofed boat: front (22290, 1600) → rear (22880, 1685).

## Left to another agent

| what | where (scan px) | to |
|---|---|---|
| 逆水行舟's tow rope over 豪华客船's cargo and past the landing steps; its ID for my notes | v ≈ 440–515 over u 22100–23450 | river_m |
| the bows of 逆水行舟's two hulls against 豪华客船's stern: the northern hull's curved bow, and the southern hull's dark arched bow cabin; a man with a long pole standing on the southern bow, and a second figure beside him | northern bow u ≈ 23700–23820, v 540–700; southern bow cabin u ≈ 23580–23720, v 860–960; the poler (23700, 770–900); the second figure ≈ (23750, 780–830) | river_m |
| the five trackers and the big man in the broad hat; the timber frame and the crouching man by it | u 21840–22180, v 150–390; (22045, 1570–1712); u 21880–21985, v 1557–1670 | t2 (all recorded by t2) |
| the great willow whose whips hide the sweep boat's bow | crown over u 21700–22090, v 600–1150 | t2 (`S2.tree.willow_great_21345`) |
| the terrace on stilts (hall, balustrade, stilts in the water), its east pavilion, the houses, the fence and the gateway along the north bank | u 22320–23500, v 0–500 | structures_w |
| the thatched (mat) roof and the tiled roofs on the south bank west of the mound | u ≈ 21150–21930, v 1450–1790 | structures_w |
| the weeds and shrubs along the north bank in front of the houses | u 22400–22910, v 330–440 | t3 (recorded as `S2.tree.weed_clump_22665`, `S2.tree.shrub_row_22805`) |
| the terrace diners | u 23075–23400, v 310–395 | t4 |
| the landing steps, if structures_w also records them as a stair | u 22916–22978, v 404–488 | merge: keep one |
| the south bank west of 21850: its shore, and the small covered boat | u ≈ 20900–21850 | river_w |

## Against `reference/scroll/sections.md`

- **No contradiction.**
- 豪华客船 (pin 17, u 22960) is here: the stem is at u 22545 and the stern est at 23725.
- 余辉's 船侧祭神 and 客船启程 have possible matches here (see "Findings" above). Both are unconfirmed.
- 余辉 lists 摇橹向前 under 拱桥上下 (the bridge only), so it most likely names S3's sweep boat at u 15595, not this
  one. I gave the sweep boat no `src`.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **A long dark shape trailing behind a boat is often its sweep's blade, not a second boat.** Follow the line from the
  crew's hands. If it runs unbroken past the stern and spreads into a flat blade with no gunwale or thwart, it is the
  boat's 大橹: record it as part of the boat (`sweep_pivot`, `sweep_tip` points). S2's "empty skiff" at u 22450–22950 and
  S3's sweep at u 15595 are both blades.
- **A boat's windlass or crowded upper deck is not proof of a bow.** 豪华客船's windlass stands on the after cabin's
  roof. The raked stem with an ornamental post and a projecting beam marks the bow. Read both ends before naming
  `front`, and correct a brief that calls a deck "fore" without that evidence.
- **A boat lying at a slant shows it in its waterline.** Where the waterline rises toward one end (豪华客船: v 910
  amidships, v 775 at the stem), that end is further north. Set `facing_deg` from front and rear (here 172, not 180),
  and keep `rear` on the amidships waterline's level when the stern is hidden.
- **Crew counts from the brief or the restyle are not counts.** S2's river_w2 was briefed "20–25 crew", and the scan has
  15. The restyle's extras sat on bollards, in window lattices and round a windlass. Count dark heads at zoom 3–4.
- **A stair down to the water is the river agents' best water-level place, and it still gives only a bound:**
  H ≥ −Δv/77, because the stair recedes as it falls. Report it as a bound beside S4b's reading.
