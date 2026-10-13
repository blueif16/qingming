# S3 river_e: report (the water and the boats, u 18300–20500)

Part file: `gen/map/S3/parts/river_e.json`, 40 entities. `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/river_e.json`
gives **PASS**. Overlays: `gen/map/S3/look/river_e_self_full.jpg` (the whole range, zoom 0.65, grid 50),
`river_e_self.jpg` (zoom 1), `river_e_self_B.jpg` (the big boat, zoom 1.45) and `river_e_self_{a,b,c,d,e,W}.jpg`
(zoom 2 windows over the bow, amidships, the stern, the moored boat, the cabin boat and the west reach). Every head
and foot marker sits on its figure. Est feet sit where the body says they must be.

This unit replaces the first attempt, which failed at start, so nothing earlier exists.

## Key findings

1. **The big boat's bow is at the west end (u 19518), not at 20450.** The west end has a windlass with a rope drum,
   a squared bow board, and crew poling and pointing forward toward the bridge. The east end has a rudder blade in the
   water (20400–20470, v 560–600), a high poop deck over the after cabin, and the A-frame mast lowered aft onto it.
   The hull lies across the current, heading about 200° (WSW). Both ends are inside S3 (u 19510–20480).
2. **There is a fourth boat: a cabin boat under the arch** (`S3.veh.boat_cabin_under_arch_19225`). It lies north of
   (behind) the big boat, with its own waterline (v ≈ 580) and water visible between its hull and the big boat's
   bow. Two passengers lean on its railing. The restyle paints the whole structure as the bridge's underside framework.
   I recorded it as a boat (conf med) with both readings in the note.
3. **I count 21 crew on the big boat.** That includes 2 at conf low (a head among the rigging; a second figure at
   the stern rail that may be one man's arms). The brief expected about 20.
4. **The north-bank boat from about 20350 is S2's.** Its stem reads at the east end, about u 21025. I did not record
   it; its points and crew are in the seam notes. If S2 reads the stem at the west end, it and its crew come back to
   river_e.
5. **The water level can't be read here either.** There is no vertical bank face, stair or visible abutment foot at
   the water. The only bounds are at least −0.86 to −1.0 m, which fits S4b's −0.7 proposal. Not used.
6. **What looked like the south bank at u 18300–18480 is the bridge deck's west edge.** That is the crowd's boundary
   in the bridge agent's geometry. The river runs on under the deck, so the south shore there is est all the way to
   the arch's south foot. I dropped my early grd for it before handing in.

## Counts by kind

| kind | count | what |
|---|---|---|
| water | 1 | `S3.water.bian_river_18300` (shore_n, shore_s) |
| grd (banks) | 4 | `S3.grd.far_bank_18450`, `S3.grd.south_bank_19300`, `S3.grd.south_bank_20120`, `S3.grd.north_bank_20250` |
| **boats** (vehicles) | 3 | the big boat lowering its mast `S3.veh.boat_mast_lowering_19518`; the cabin boat under the arch `S3.veh.boat_cabin_under_arch_19225`; the boat moored along the south bank `S3.veh.boat_moored_south_bank_19745` |
| figures | 27 | big boat 21 (2 conf low), cabin boat 2, moored boat 4 |
| props | 2 | `S3.prop.floating_timber_19090` (conf low), `S3.prop.round_ribbed_object_19765` (conf low, on the moored boat's roof) |
| groups | 3 | `S3.grp.boat_mast_lowering_crew` (22 members), `S3.grp.cabin_boat_under_arch_crew` (3), `S3.grp.south_bank_boat_crew` (6) |

**The big boat's crew, counted one by one** (enhanced zoom 1.8–3 crops `river_e_B*.jpg`, then the overlays):
- bow, 2: `bowman_arm_out_19565` and `_19583`;
- forward deck, 3: `boatman_leaning_on_bundle_19650`, `boatman_poling_bow_19632`, `boatman_reaching_19681`;
- far side amidships, 4: `boatman_pole_raised_19775`, `boatman_capped_19800`, `boatman_both_arms_pole_19840`,
  `boatman_hat_pole_19915`;
- near-side polers, 3: `boatman_bending_pole_19746`, `boatman_bent_pole_19830`, `boatman_standing_pole_19892`;
- under the deckhouse's mat roof, 3: `boatman_under_mat_roof_19955`, `_19970`, `boatman_crouching_20026`;
- a head among the rigging by the mast's foot, 1, conf low: `head_in_rigging_19990`;
- on the poop (support `boat roof:`), 4: `boatman_hauling_rope_20205`, `boatman_stern_seated_20285`,
  `boatman_stern_bending_20365`, and `boatman_stern_rail_20400` (conf low);
- in the after cabin's door with a long pole, 1: `boatman_cabin_door_pole_20300`.

**Cabin boat under the arch, 2:** `man_at_cabin_rail_19366` and `man_leaning_over_rail_19432`.

**Moored boat, 4:**
- `man_waving_on_boat_roof_19952`, standing;
- `man_reclining_waving_20060`, lying, arm raised;
- `man_in_hatch_20148`;
- `man_in_hatch_20172` (conf med: t9 also reads two heads there).

## The boats (points in the part; the build facts here)

| boat | front → rear | heading | hull, px | freeboard (two stroke points) | cabin, mast, gear |
|---|---|---|---|---|---|
| `boat_mast_lowering_19518` | (19518, 766) → (20398, 600 est) | 200° | 880 along u; near-side band 60 deep | mid-ship: gunwale (19800, 732) over waterline (19800, 792) = 60 px = **0.78 m**; bow: (19515, 700)/(19518, 766) = 66 px = 0.86 m; poop: about **2.5–3 m** (est: its south eave (20200, 470) over the near waterline (20200, 700) = 230 px) | windlass at the bow; a striated bundle (lowered mat sail or cables) over the foredeck; mat-roofed deckhouse amidships (19920–20060, v 575–640); planked after cabin with a south door (20050–20330, v 450–650) under a poop deck; rudder; A-frame mast lowered aft, foot (19930, 560 est), head (20295, 175), lashings near the head, lines hanging onto the poop; 4–5 poles into the water off the south side; a long pole east to (20600, 548) |
| `boat_cabin_under_arch_19225` | (19225, 582 est) → (19950, 585 est) | 180 (unknown) | ≥ 725 | cabin floor (19400, 525) over waterline (19400, 580) = 55 px = **0.71 m** | railed open cabin side (posts ≈ 19320–19700, rail v 480–525); roof hidden or merged with the arch's underside; no mast, oars or poles |
| `boat_moored_south_bank_19745` | (19745, 1188 est) → (20640, 1185 est) | 180 (conf low) | ≈ 895 | roof (19952, 1097) over waterline est (19952, 1188) = 91 px = **1.18 m** (est); hatch floor about 1.1 m (est) | dark arched mat roof with three round coils (19745–20000); small cabin door (19958–19991, v 1137–1164); hatch with an arched frame (20090–20190); long low roof east to ≈ 20630 with an arched door at (20345, 1168); hull below v ≈ 1165–1185 hidden by the shops' roofs |

**Waterline evidence.**
- Big boat: the near side runs along the hull band's lower edge, (19518, 766) → (19600–19900, ~790) →
  (20100, 740) → (20330, 645). The far side is hidden. beam_n (19850, 600, est) comes from the far-side crew's feet,
  which agree with a beam of about 4 m at 48 px of v per metre across the axis.
- Cabin boat: the hull band's lower edge at v 578–582, with ripples drawn just below it at u 19200–19480.
- Moored boat: hidden under the roofs. t8 reads the hull's lower edge at about v 1165–1185.

**Ropes and their far ends (big boat).**
- A rope thrown by `S3.fig.deck_youth_rope_19445` (t8) leaves the crown railing at about (19471, 244). It hangs in a
  loop to about (19600, 418) in front of the cabin boat's roof. Its lower end reaches toward the far-side crew, whose
  poles and hands go up: `boatman_pole_raised_19775`, `boatman_both_arms_pole_19840`. The line is drawn pale and faint.
- `S3.fig.deck_pole_holder_19625` (t8) holds a level pole or taut rope at (19585–19658, v 209–228). No far end is
  painted.
- `S3.prop.bundle_over_rail_19392` (t8) may hang on a rope.
- Two U-shaped loops hang under the arch's rib at (19772, 392) and (19855, 390): rope loops round the rib or the
  bridge's iron hooks (conf low). They are in the boat's `what`; the bridge agent may prefer them as bridge hardware.

**Pose and story** (余辉 大船抢险, 上下呼救; 名画记 pin 19 大船穿行虹桥).
- The hull has swung across the current.
- The bow men point and shout. The far-side men push poles up at the arch and the cabin boat. The near-side men pole
  off the river bed.
- The poop hands haul the mast's lines.
- The man in the cabin door holds a long pole out to the east.
- People at the railings above (t7, t8, t9) shout and throw a rope.
- The men on the moored boat's roof wave.

## Water and banks

- **Shore points at the seams:**
  - u 18300: shore_n (18300, 255, est) and shore_s (18300, 630, est), taken from river_w's
    `S3.water.bian_west_15500` so the two reaches meet. The far bank's top is (18300, 240, est), river_w's `bank_n`.
  - u 20500: shore_n (20500, 310, est), shore_s (20500, 1235, est). Bank tops: north (20500, 300, est), south
    (20500, 1255, est).
- **No shoreline is inked in the range.** Every shore is where the wash or the land's figures stop and the ripples
  begin.
  - Far bank west of the bridge: the lower edge of the wash under the hall on stilts (v 362–380). The bank top is the
    hall's post feet: (18446, 290), (18492, 297), (18542, 310).
  - Far shore under the bridge's deck (u 18640–20050): hidden, est.
  - North bank east of the bridge: its edge is at v ≈ 288 under the tavern's tables. structures_e reads the boats'
    hulls from v ≈ 290–300 there, so the waterline is est at v ≈ 300–310.
  - South shore from 18300 to the arch's south foot (18910, 1045): hidden under the deck, so a straight est
    placeholder.
  - Under the arch: hidden behind t7's mat-awning stall's roof (its top at v ≈ 1015) and the onlookers, est at
    v ≈ 1040–1100.
  - East of 19745: behind the moored boat and the shops' roofs, est v ≈ 1220–1235.
- **Water-level check** (a check only; S4b's value is the one used). No place in u 18150–20650 shows a bank's
  vertical face, a stair, a revetment or an abutment's foot meeting the water. The arch's south foot is hidden behind
  the onlookers, and the north foot behind the big boat's rigging. Bounds only, H = −Δv / 77:

  | place | ground (stroke) | waterline (stroke) | Δv | bound |
  |---|---|---|---|---|
  | far bank under the hall on stilts, post 1 | (18446, 290) | (18446, 367): lowest wash streak | 77 | ≥ −1.00 m |
  | same, post 2 | (18492, 297) | (18492, 373) | 76 | ≥ −0.99 m |
  | same, post 3 | (18542, 310) | (18542, 376) | 66 | ≥ −0.86 m |
  | north bank under the tavern | (20300, 288): bank edge | (20300, ~302, est): hidden behind the hulls | ~14 | about −0.2 m, not a measurement |

  The posts may stand partway down a sloping, washed bank, so these are loose upper bounds on the depth. They fit
  S4b's −0.7 (tighter) and say nothing against it. Spread −0.86 to −1.0 (0.14 m). **No reading to report against
  S4b.**

## What was hard

- **The tangle around the mast's foot** (u 19880–20150, v 380–620). Dozens of crossing ropes and poles. The mast's
  foot is est; one "head" there is conf low (t9 saw it too and left it to me).
- **The far-side crew's feet are all hidden** behind the near-side men and the bundle. Their feet are est at the far
  gunwale (v ≈ 590–605). One man, `boatman_both_arms_pole_19840`, is painted larger (118 px). The long apron near him
  may be his or his neighbour's.
- **The cabin boat under the arch.** The restyle reads it as the bridge's underside. The strokes show a hull band
  with iron cramps, a railing, two leaning men and its own waterline. Its roof (boards slanting south-east) can't be
  told from the arch's underside beams.
- **Plain zoom 3 on this scan is a blur over the boat.** A greyscale crop with `normalise`, mild CLAHE (tile 40, max
  slope 3), lanczos upscale and `sharpen` at zoom 1.5–2.6 made the strokes readable. My scratch script is in the
  scratchpad (`S3_river_e/enh.mjs`). At zoom 3 the CLAHE turns into silk-weave noise, as S4b found.
- **Which ends are the stems** of the moored boat and the north-bank boat: both ends are hidden or plain. Read from the
  gear and the cabin's place (below), conf low.
- **The restyle** over u 18770–20656 was not used for positions. The overview was used only to name things. It too
  drops the cabin boat into the bridge and paints the moored boat as roofs.

## Seam notes (by the neighbours' IDs)

**S2 (u 20500).**
- **The north-bank boat** (S2's by its stem; not recorded here). It is moored along the north bank. Points:
  - west end (the stern by my reading) hidden behind the big boat's stern at about u 20350–20470; its mat roof
    starts at (20380, 280–330);
  - near-side waterline from about (20480, 455, est) to (20850, 460);
  - east end: a low pointed end with its top at (21025, 362) and waterline est (21025, 440); I read it as the bow.
  - Why bow east: a big round woven bundle or coil sits forward of it (20700–20800, v 320–420), and the long mat cabin
    is at the west end, as on the big boat, whose cabin is aft.

  Its crew, all S2's with the boat:
  - head (20488, 332), a small figure under the roof's west end, foot est (20490, 390);
  - (20557, 371), crouching at the gunwale, foot est (20560, 410);
  - (20615, 333), standing, foot (20612, 414);
  - (20660, 258), standing high on the roof with arms out, foot est (20675, 330);
  - (20880, 380) and (20935, 375).

  The first two stand west of u 20500 but go with the boat. If S2 reads the stem at the west end (≈ 20350–20470),
  the boat and all six are river_e's.
- **`S3.veh.boat_moored_south_bank_19745` is S3's whole** (area brief), but its east end, at ≈ (20637, 1085–1190),
  lies past the seam. The lead tells S2.
- **The big boat is wholly S3's** (stern ≈ 20398–20480). The long pole held by `boatman_cabin_door_pole_20300`
  reaches over the seam to about (20600, 548), over open water.
- The water continues east: shore points at u 20500 above.

**river_w (u 18300).**
- My water and far bank start at river_w's seam points (above). `S3.water.bian_west_15500` ends where
  `S3.water.bian_river_18300` begins.
- `S3.veh.boat_mat_cabin_18005` (hull 18005–18322) is river_w's either way, as its note says. I read its east end the
  same way: a stern, under an overhanging hood with a post like a rudder stock at u ≈ 18240.

**Within S3.**
- t8, the rope: the thrower is `S3.fig.deck_youth_rope_19445` (t8, u 19445), not a t7 figure. I saw no rope from t7's
  stretch reach a boat.
- t8, the boat's west end: `S3.fig.light_robed_at_bow_19745` (conf low) stands just below my
  `S3.prop.round_ribbed_object_19765`. If it is on the boat's bow, it is crew of `boat_moored_south_bank_19745`
  (support `boat deck:`), so the merge should move it to `S3.grp.south_bank_boat_crew` or drop it.
- The deck watchers are named in the big boat group's note for a possible joint 上下呼救 group:
  - t7: `S3.fig.man_at_railing_face_west_19318`, `S3.fig.man_at_railing_facing_us_19347`;
  - t8: `S3.fig.deck_rail_face_19350` to `S3.fig.deck_stooping_hat_19765`;
  - t9: `S3.fig.rail_watcher_19862`, `_19892`, `_19923`.
- t9 left to me "a head under the bridge at (19985, 405)". That is my `S3.fig.head_in_rigging_19990` (conf low; its
  note gives the other readings: a rope block, or a man on the north bank at the bridge's foot).
- t9's "figures on the big boat's stern roof" at (20290, 289) and (20354, 274) are my
  `boatman_stern_seated_20285` and `boatman_stern_bending_20365`.
- bridge:
  - `S3.prop.floating_timber_19090` runs in behind the arch's south leg (west end est at u ≈ 18918) and passes behind
    `S3.prop.bridge_end_post_19026`. If it is a footing timber of the abutment, it is the bridge's.
  - The cabin boat under the arch sits below the bridge's `arch_intrados_e`. The bridge part doesn't claim it.
- structures_e: my far bank's top uses `S3.bld.far_bank_hall_18520`'s post feet. The north bank's edge agrees with
  `S3.bld.tavern_20230` (v ≈ 288). The moored boat's hull covers `S3.bld.open_shop_20000`'s ridge, as their note says.

**Groups crossing edges:** none. All three groups are inside S3. The 上下呼救 link to the deck figures is only a note.

## Supports used

- `water`: the 3 boats, the floating timber and the water;
- `ground`: the banks;
- `boat deck: S3.veh.boat_mast_lowering_19518`: 17 figures;
- `boat roof: S3.veh.boat_mast_lowering_19518`: the 4 poop hands. The poop is the high deck over the after cabin,
  about 2.5–3 m above the water (est).
- `boat deck: S3.veh.boat_cabin_under_arch_19225`: 2 figures;
- `boat roof: S3.veh.boat_moored_south_bank_19745`: 2 wavers and the round object;
- `boat deck: S3.veh.boat_moored_south_bank_19745`: 2 men in the hatch.

## Scale cues

- **Big boat**
  - Hull 880 px along u from stem to sternpost; near-side band 60 px.
  - Crew painted heights: bow men ~90 px (feet v ~700); near-side polers 85–118 px (feet v 720–740); far side 83–118 px
    (feet v ~595–605); poop hands 73–95 px (feet v 372–395).
- **Cabin boat under the arch:** ≥ 725 px; hull band 55 px; passengers 72–74 px to the cabin floor; railing posts
  50–70 px apart.
- **Moored boat:** ≈ 895 px; the standing waver 155 px (foot v 1097); the reclining man's head 30 px.
- **Floating timber:** ≈ 340 × 20 px.

Receding edge (the big boat's near-side waterline): (19700, 790) → (20330, 645), slope −0.23, about 22° north of east
with dx 31.6. The hull's own line, not a ground edge.

## Left to another agent (seen, not recorded)

- **S2 (its river agent):** the north-bank boat and its six crew and cargo (points above).
- **t8:**
  - the rope thrower `S3.fig.deck_youth_rope_19445` (recorded by t8);
  - the onlookers on the south bank under the arch at u 19590–19700, v 1080–1160, including a man waving with his arm
    up, head ≈ (19675, 1110);
  - the tilted parasol (canopy 19678–19815, hub ≈ (19803, 1182));
  - the big parasol in front of the mat shed (19364–19629, v 1070–1140).

  All on land; t8 reports them.
- **t7:** the mat-awning stall under the arch's south foot (19020–19380, roof top v ≈ 1015; t7 has
  `S3.prop.mat_awning_stall_19050`), and the onlookers at u 18870–19000, v 1050–1250.
- **t9:** the dark-trunk tree (trunk 20380–20460 crossing the moored boat; its crown over the water at u 20150–20650,
  v 400–1100).
- **bridge:**
  - the end posts `S3.prop.bridge_end_post_19026` (crossbar ≈ (19008, 777)) and `_20050`, and the railing's end post at
    (20034, 317–394);
  - a small rectangular plaque or box hanging under the arch's crown rib at (19605–19635, 300–335);
  - the two U-shaped loops under the rib (in the big boat's `what` as possibly rope loops).
- **structures_e:** the hall on stilts on the far bank (`S3.bld.far_bank_hall_18520`), the north-bank tavern, and the
  south bank's shop roofs that hide the moored boat's hull and the shore.
- **river_w:** `S3.veh.boat_mat_cabin_18005` and its two passengers.

## Contradictions with sections.md and the briefs

- **The big boat's bow** is the west end (u 19518), not "bow ≈ 20450" (`map/index.md` Seams; tile brief). The span
  19510–20480 agrees with sections.md's ≈ 19500–20500.
- **The tile brief's "3 boats"** for river_e is 4 boats in the area: the cabin boat under the arch is new, and the
  north-bank boat is S2's.
- **The mast's lines** run from about (19930, 560) to (20295, 175). That is the brief's "(19900, 600) to (20300, 100)"
  read more closely: the head is at v 175, and the lines above it belong to the tavern's frame.

## Needs (for the needs agent, one line each)

- **Boat: the big boat lowering its mast.**
  - Hull 880 px (≈ 18–20 m by its crew), beam ≈ 4 m, squared bow with a windlass, high stern with a rudder and a poop
    over a planked after cabin.
  - Mat-roofed deckhouse amidships; A-frame mast hinged at deck and lowered aft.
  - 21 crew; poles; cargo not painted.
  - Not rafted, under way across the current.
- **Boat: the cabin boat under the arch.** At least 725 px long, a railed open cabin, no mast; 2 passengers.
  Drifting under the bridge.
- **Boat: the moored boat at the south bank.**
  - ≈ 895 px, a dark arched mat roof forward with coiled ropes, a central hatch, a long low roof aft with a small
    arched door; no mast.
  - 2 men on the roof waving, 2 in the hatch. Moored along the south bank.
- **Prop: a floating timber.** About 4–5 m, possibly a punt.
- **Actions:** lowering a mast (hauling its lines from the poop), poling off the bottom, pushing a pole up at an arch,
  pointing and shouting at the bow, leaning over a cabin rail, waving both arms from a roof, reclining and waving.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

> - **Two hulls can overlap in the picture: check each one's waterline.** On S3 the cabin under the Rainbow Bridge's
>   arch looked like the big boat's cabin. It has its own waterline 190 px north of the big boat's, with water drawn
>   between its hull and the big boat's bow, so it is a second boat. The restyle had painted it as the bridge's
>   underside.
> - **Read a boat's ends by its gear, not by which end is nearer the next section.** A windlass or rope drum, coiled
>   cables and men poling forward mark the bow. A rudder blade, a high poop over the after cabin and a mast lowered
>   onto it mark the stern. S3's big boat had been noted "bow ≈ 20450", and that was its stern.
> - **Faint pale lines can be ropes.** The rope thrown from the Rainbow Bridge is drawn in a light line that a plain
>   crop hides. A greyscale crop with `normalise`, mild CLAHE (tile 40, max slope 3), lanczos upscale and `sharpen` at
>   zoom 1.5–2.6 shows it, and it separates the crew from the rigging. Above zoom 3 the CLAHE turns the silk's weave
>   into noise.
> - **A crowd's edge against water may be a bridge deck, not a bank.** At the Rainbow Bridge's west side the water
>   ends at the deck's west edge. The river runs on under the deck. Ask the bridge agent's geometry before drawing a
>   bank there.
> - **The 汴河's surface can't be measured from the banks here either.** S3 has no vertical face at the water.
>   Report bounds and don't replace S4b's value.
