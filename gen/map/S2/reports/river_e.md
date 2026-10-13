# S2 river_e: report (u 26000–29050, looked at 25850–29200)

Unit `river_e`: everything on or in the water at the east wharves. Part file `gen/map/S2/parts/river_e.json`
(16 entities). `node tools/scroll_map.mjs S2 check --parts gen/map/S2/parts/river_e.json`: **PASS**, no warnings.
S2 has no frame yet, so the support names are not checked. Overlay `gen/map/S2/look/river_e_overlay.jpg` (u 25850–29200,
zoom 1, grid 50). I read zoom 1.5–2.5 windows over the mat-cabin boat, the jetty, the grain boats and the bottom boat;
every marker sits on its stroke. Crops, the generator `make_river_e.py` and a sharpened-crop script `sc.mjs` are in
`scratchpad/S2_river_e/`.

## Findings for the lead (read first)

1. **Four boats, and few people on them.** The boats are the mat-cabin boat, two grain boats and a smaller boat at the
   bottom edge. The brief's guess was 15–25 crew; the scan has **5 figures on the boats, and 3 of them are `conf: low`**.
   These are moored, unloading boats. The grain is carried ashore by the porters on the bank (t10's and t11's). The
   restyle's crowds on the decks are invented: about 8 people on and around the bottom boat, and a man and a white
   figure at grain boat 1's stern.
2. **Every boat with a visible rudder lies bow west.** Following the lead's rule (the rudder marks the stern):
   - the mat-cabin boat: rudder under its east end;
   - grain boat 1: rudder hung from its east transom;
   - the bottom boat: rudder at its east end.
   **Grain boat 2's rudder is hidden.** The dark blade at its west end slopes down and east, under the hull, as a
   raked stem does. The three visible rudders all slope down and aft, away from the hull. So I read grain boat 2 as
   bow west too (`conf: low`, both readings in its note). t9 calls the mat-cabin boat's east end its "bow": it is the
   stern.
3. **The "man at the bottom boat's east end" is the rudder head**: the stock, a drum-shaped head with a hole, and its
   ropes. t12 independently reads it the same way. There is no figure there.
4. **The jetty stands on land.** The raised plank walkway in front of the lower shed has its posts' feet on the bank
   slope (v 842–947). The water's edge is 120–190 px lower. The brief says to leave a jetty that stands wholly on land
   to structures_e. But structures_e's brief gives the jetty to river_e, and t9 lists it as river_e's, so I recorded it
   (`S2.str.jetty_27260`) so it is not missed. If structures_e also records it, or reads it as the lower shed's
   raised floor, the merge keeps one. Nobody stands on it (t9 agrees). The tiles' support
   `jetty deck: S2.str.jetty` means this ID.
5. **The water does not reach the S1 seam.** The north shore turns south along the massive willow's west foot and
   meets the silk's bottom edge at about (28968, 1780, est). Past the willow (u 29150–29400, v 1450–1780) the silk is
   bare, with bank wash.
6. **The water level can't be measured here.** The bank is a long wash-drawn slope with no face, stair or revetment,
   and the shore is hidden behind moored hulls for most of the reach. The bounds below are consistent with S4b's
   −0.7 but say nothing tighter.

## Counts by kind

| kind | n | entities |
|---|---|---|
| water | 1 | `S2.water.bian_river_e` (`shore_n` only: the silk's bottom edge cuts the water, so no south shore is painted) |
| grd | 1 | `S2.grd.north_bank_26000` (`bank_top`, `shore`) |
| structure | 1 | `S2.str.jetty_27260` (on the bank: finding 4) |
| **boats** (vehicle) | 4 | below |
| figures (crew) | 5 | 2 `med` on the mat-cabin boat, 3 `low` (one on grain boat 1, two on grain boat 2) |
| prop | 1 | `S2.prop.ribbed_object_28878` (`low`: a mat or basket on the bank, or the end of a small boat) |
| group | 3 | one per boat with crew: `S2.grp.boat_mat_cabin_25980`, `…boat_grain_27285`, `…boat_grain_28095` |
| trees, animals, buildings, roads, landing stairs | 0 | none on the water; no landing stair is painted |

Boats, west to east:

| id | what | front → rear (waterline) | pose, facing | crew |
|---|---|---|---|---|
| `S2.veh.boat_mat_cabin_25980` | big cabin boat with mat roofs, riding high, moored by the warehouse | (25980, 960 est) → (26600, 1000); stern overhang tip (26845, 707); rudder tip (26785, 1047) | moored, 175 | 2: a man crouching on the cabin roof (med); a man in the stern hood's mouth (med; t8 sees him too) |
| `S2.veh.boat_grain_27285` | grain boat 万石船, deep-laden, bow mats, lowered spar, transom stern, gangplank to the bank | (27285, 1330 est) → (27882, 1505); rudder tip (28086, 1593); plank (27795, 1145) → (28023, 1050) | moored, 160 | 1 low: a capped head at the rudder head (or the stock's head) |
| `S2.veh.boat_grain_28095` | second grain boat, bow hood, cargo under the willow whips, cables and bitts aft | (28095, 1468) → (28700, 1470 est) | moored, 190 | 2 low: dark caps among the coiled cables (or bitts) |
| `S2.veh.boat_bottom_28395` | smaller planked boat at the silk's bottom edge, transom gallery, big rudder, ladder up to grain boat 2 | (28395, 1690 est) → (28810, 1728); rudder tip (28955, 1768) | moored, 180 | 0 |

**Crowds counted head by head:** none. No boat carries more than two figures on the scan.

## What was hard or ambiguous

- **The mat-cabin boat's bow is hidden.** Its strakes run west behind the stern and rudder of river_m's boat
  (rudder stock u ≈ 26010, blade to (26095, 1060)), and no stem shows east of u 26060. The front (25980, 960) is an
  estimate. The stem could be anywhere from about u 25930 to 26030.
- **Grain boat 2's orientation and extent** (finding 2). The stern is hidden behind the massive willow's knobbed head
  (u 28600–28950, v 1280–1550), so the rear is an estimate at u 28700.
- **The bottom boat's bow.** Its strakes and dark lower edge show from u ≈ 28400 east. West of that, a zoom-3 crop
  (`bb_bow2.jpg`) shows only willow whips, so the front is an estimate at about u 28395. A zoom-0.6 view fools the eye
  into reading the whips as hull lines back to u 28230.
- **The low-confidence crew:**
  - `S2.fig.steersman_27890`: a dark capped blob on the rudder stock's line above the tiller bar. It may be the stock's
    head.
  - `S2.fig.boatman_coils_28543` and `…_28562`: two dark flat-topped marks among the coiled cables. They may be men's
    black caps (the restyle paints a man in a black cap here; the setup counts "one or two") or a pair of bitts.
  - All three are recorded so the second pass can settle them.
- **The shore.** No shore is inked. I read it where the bank's wash smudges end and the thin current lines begin.
  - It is hidden behind the mat-cabin boat (estimated at v 655–680; the bank shows only to v 640–650, and the true line
    could be as low as v 850).
  - It is also hidden behind both grain boats (estimated at their north gunwales, v 1110–1160) and under the willows
    east of u 28400.
  - **At the great willow, two readings:** t8 and t9 put its roots (27068, 905) at the water's edge. I read the
    smudges at v 930–1100 below the roots as bank wash, so my shore there is about 150 px lower (`conf: low`).
- **Small marks in the water, not recorded:**
  - a dark leaf-shaped accent inside a current curl at (27127–27145, 1368–1386): the ink accent of a curling crest;
  - a dot at (26655, 1591): silk damage.
- **What the restyle got wrong here:**
  - it paints u 25500–26400, v 1000–1790 as dry ground;
  - it paves the bank under the willow with flagstones;
  - it puts a crowd on the bottom boat;
  - it turns the bottom boat's transom into a second barge.

  It is right about the stern-hood man, the roof man, and grain boat 2's stem.

## 汴水悍激 (pin 7) and the water

- **Where the lines are.** The current lines are long, roughly horizontal flowing strokes with curling crests:
  - They fill u 26000–27270 from v ≈ 1000 (≈ 890 east of the mat-cabin boat's stern) to the silk's edge, and are
    densest and longest at v 1050–1500.
  - There are eddy spirals at (26300, 1185) (the largest, with rings over u 26120–26415, v 1155–1210), (26680, 1222),
    (27022, 1223) and (26908, 1495).
  - Thinner lines continue under and between the grain boats (u 27270–28100, v 1500–1780).
- **The silk's bottom edge** is at v ≈ 1780, measured from brightness rows at u 26200, 27000, 28000 and 28700.
- All of this is in the water entity's `what` and `note`.

## Water level (check only; S4b's reading rules)

| place | ground point | waterline | Δv | bound |
|---|---|---|---|---|
| u 28330 | bank top v 975 (t11: v 970–985 over u 28100–28400) | t11's edge line under the bank porter, (28297, 1203) → (28357, 1234) | ≈ 250 | \|H\| ≤ 3.2 m |
| u 27900 | t10's stake on the bank top (27902, 985) | hidden behind grain boat 1's north gunwale, at v ≥ 1145 | ≥ 160 | none (the shore's v is unknown) |
| u 26000–26200 | the warehouse plinth's foot, v 630 | hidden behind the mat-cabin boat, at v ≥ 650 | — | none |

The bank here is a slope 250–300 px of v deep, not a face. **Use S4b's `supports.water`.** S3's abutments are the
better place for a real reading.

**Deck heights** (painted px, for the frame's `boat deck:` / `boat roof:` supports, H = water + Δv/77):

| support | deck or roof (stroke) | waterline straight below | Δv | H above water |
|---|---|---|---|---|
| `boat deck: S2.veh.boat_mat_cabin_25980` (main deck) | (26300, 835): deck edge under the cabin walls | (26300, 990) | 155 | 2.0 |
| the same boat, after deck under the stern hood (the hood man) | (26750, ~702) | ~1000 est (the stern overhangs) | ~298 | ~3.9 (a high poop, est) |
| `boat roof: S2.veh.boat_mat_cabin_25980` (the roof man) | roof edge v 716–720 at u 26295 | 990 | 272 | 3.5 (deck 2.0 + roof 1.5) |
| `boat deck: S2.veh.boat_grain_27285`, stern (the steersman?) | ~1300 est (tiller bar at 1265–1280) | 1505 | ~205 | ~2.7 est |
| the same boat, amidships (no crew) | south gunwale ~1440 at u 27570 | 1493 | 53 | 0.7 (deep-laden) |
| `boat deck: S2.veh.boat_grain_28095`, after deck (the two low figures) | ~1405–1420 at u 28550 | ~1470 est | ~55 | ~0.7 est |
| bottom boat (no crew) | gunwale ~1590 at u 28575 | ~1715 | 125 | 1.6 |

## Shore points at the ends of my range

- **West, u 26000 (river_m):**
  - `shore_n` (26000, 665, est), hidden behind the mat-cabin boat;
  - `bank_top` (26000, 632), the warehouse plinth's foot.
- **East (S1):**
  - `shore_n` ends at the silk's bottom edge at (28968, 1780, est), 80 px west of the seam;
  - `bank_top` ends at about (28900, 1320, est) under the willows;
  - no water reaches u 29050, so there is no shore point there.

## Seam notes and edges

**river_m (u 26000):**
- Its boat moored at u ≈ 25150–26050 has its stern at the east end: the rudder stock at u ≈ 26010 (top (26000–26020,
  720–735)) and the blade to (26095, 1060). Its stern and rudder hide the mat-cabin boat's bow.
- t8's "tall figure at the stern of the boat at u 25950–26010 (v 680–1000)" sits on that stock's line. It is either
  the stock's capped head with a tiller, or a man at the tiller (the restyle paints a carved face on the post). That
  is river_m's call.
- The mat-cabin boat is mine whichever side of 26000 its stem lies (the brief).

**t7 / t8:** t7's capped posts `S2.prop.mooring_post_26018` and its twin at u ≈ 26128 (v 565–630) stand at the
warehouse plinth's foot. No rope from the mat-cabin boat reaches them (zoom 3). They look like the plinth's pillar feet
(structures_e may agree).

**S1 (u 29050):** nothing of mine crosses the seam.
- The bottom boat's rudder tip (28955, 1768) is the easternmost point I recorded.
- The massive willow (t12: base ≈ 29070, so S1's) leans over the bottom boat's stern and hides grain boat 2's stern.

**Groups across edges:** none of mine.
- The porters' group (t10's) unloads grain boat 1, by the gangplank and the mooring lines.
- t11's bank porter `S2.fig.bank_porter_28355` climbs from grain boat 2.
- The merge may name the boats in the porters' group's `note`.

**Points shared with tiles:**
- grain boat 1's mooring lines end at t10's `S2.prop.coiled_rope_27873` and `S2.prop.mooring_stake_27902`;
- grain boat 2's mooring line goes to t11's `S2.prop.mooring_post_rope_28272`;
- the gangplank lands on the bank at (28023, 1050), where nobody stands (t10 agrees).

## Support names used

- `water` (the boats);
- `ground` (the bank);
- `bank slope` (the jetty's posts, the ribbed object);
- `boat deck: S2.veh.boat_mat_cabin_25980`, `boat roof: S2.veh.boat_mat_cabin_25980`,
  `boat deck: S2.veh.boat_grain_27285` and `boat deck: S2.veh.boat_grain_28095`. Their heights are in the table above.

## Scale cues and edges (stroke points)

**Hulls:**
- mat-cabin boat: about 865 px including the stern overhang, 620 px between front and rear; cabin walls about 95 px;
  fore cabin door about 70 px; rudder blade about 190 px;
- grain boat 1: 743 px overall, 600 px between front and rear; transom about 250 px wide; gangplank 245 px long with
  rails about 15 px apart;
- grain boat 2: about 600 px between front and rear; bow hood 275 px wide;
- bottom boat: about 415 px; rudder blade about 160 px.

**Crew painted heights:**
- the roof man: about 42 px crouched, at v 716;
- the hood man: about 74 px from head to the hood floor, at v 702;
- the coil figures: 124 px and 107 px (`low`), at v 1405–1410.

**Edges** (all along the bank or along a hull; none is a ground-level receding edge, so the frame should take its
knots from structures_e's sheds):

| edge | from | to | dv/du |
|---|---|---|---|
| jetty front edge / railing top | (27135, 765) | (27380, 850) | +0.35 |
| grain boat 1 axis (rear → front, waterline) | (27882, 1505) | (27285, 1330) | +0.29 |
| gangplank (boat → bank) | (27795, 1145) | (28023, 1050) | −0.42 |
| mat-cabin boat's bottom strake | (26075, 970) | (26606, 1001) | +0.06 |

## Left to other agents (what, where, to whom)

- **t11:**
  - the bank porter climbing from grain boat 2, feet (28355, 1226 est);
  - the post with a coiled rope at the bank's foot (28272, 1195 est);
  - the ladder or poles lying on the bank slope, (28492, 1155) → (28585, 1102).

  All three are recorded by t11, and none stands on a boat or a plank on the scan.
- **t10:** the mooring stake and rope coil (27902 / 27873, recorded) and the frayed rope end trailing east to
  (27940, 1003).
- **t8 / t9:** the great willow, base ≈ (27068–27072, 893–905). Both recorded it, so the merge keeps one.
- **t12 / S1:**
  - the massive willow at the bottom right, whose trunk and knobbed head overhang the boats (base ≈ 29070 per t12);
  - the willow trunk at about u 28800 (base ≈ v 1200) on the bank.
- **structures_e:**
  - the wattle fence and board panel under the willow's knob head (u 26850–26970, v 625–662; t8 offered it to
    either of us);
  - the lower shed whose tables stand behind the jetty (if its floor is the jetty's deck, keep one);
  - the warehouse and its plinth with the two pillar feet (t7's "capped posts").
- **river_m:** its boat moored at u ≈ 25150–26050 with its rudder and the tall shape at its stern (above).

## Against `reference/scroll/sections.md` and the brief's hints

- "Two deep-laden grain boats moored at the bank (万石船), ≈ 27300–28800": the grain boats lie at 27267–28010 and
  28015–≈ 28700. A third, smaller boat lies at 28390–28810 at the bottom edge. This brief's "second boat
  ≈ 27950–28700, v 1150–1750" includes that bottom boat's hull: grain boat 2 itself is at v 1160–1470.
- The brief's "man at the bottom boat's east end" is the rudder head (finding 3).
- The brief's jetty is on land (finding 4).
- 汴水悍激 (pin 7 at 26670): the strongest current lines and eddies are at u 26100–27100, as pinned.
- No other contradiction.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", river agents)

> - **Read a hidden rudder from the blade's slope.** A rudder hangs down and aft, away from the hull. A raked stem
>   descends from the stem head into the hull's length. On S2 the three visible rudders all slope aft, and the dark
>   blade at the second grain boat's west end slopes under the hull, so it is a stem. Say which way the blade slopes
>   in the note.
> - **Rudder heads look like capped men.** A rudder stock's drum-shaped head with a hole, above a tiller bar, reads
>   as a head in a cap at zoom 3. Two S2 agents found the briefed "man at the bottom boat's east end" to be the
>   rudder head. Record a capped blob on a rudder stock's line only as `conf: low`, with the stock reading in the note.
> - **Moored, unloading boats carry few people.** S2's grain wharf has 4 boats and 5 crew (3 doubtful): the porters on
>   the bank do the work. Don't expect a crew count from a boat's size; count heads on the scan, and treat every
>   restyle crowd on a deck as invented until the strokes show it.
> - **A "jetty" may be a raised deck at the top of the bank.** Before giving one to the river agent, find where its
>   posts' feet stand against the first current lines below. S2's walkway stands 120–190 px above the water's edge.
>   When the briefs give a thing to each other's agents, record it and say so in the note.
> - **Behind a moored hull the shore is unknowable.** Put it just behind the boat's top where the bank's visible foot
>   ends, mark it `est`, and say in the note how far down it could lie.
> - **Willow whips mimic hull strakes at low zoom.** At zoom 0.6–1 the long curved whips over S2's bottom boat read as
>   hull lines 160 px past the true bow. Confirm a hull's end at zoom 3: strakes carry nail rows, and whips don't.
> - **Crop tool:** a sharpened 2–3× crop (sharp `.resize(lanczos3).sharpen({sigma: 1.2})`, `scratchpad/S2_river_e/sc.mjs`)
>   reads faint figures best. At 4–5× the scan's 1800-px height turns everything to mush.
