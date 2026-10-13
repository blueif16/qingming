# S3 river_w: report (water and boats, u 15500–18300; looked at 15350–18450)

Part file: `gen/map/S3/parts/river_w.json` (39 entities). `node tools/scroll_map.mjs S3 check --parts gen/map/S3/parts/river_w.json`: **PASS**
(no warnings; S3's frame does not exist yet). Overlays read: the whole range at zoom 0.8 with grid 50 (two windows, 15350–16900 and
16850–18450), then zoom 2.2 windows over the two crews (the boat under way, 15570–15980 × 210–540; the unloading boat,
17680–18080 × 650–960). Crops and scripts are in `scratchpad/S3_river_w/`. This run replaces the first attempt, which stopped at
the start. Its crops in `gen/map/S3/look/river_w_*` were not used.

## Counts

| kind | n | |
|---|---|---|
| water | 1 | `S3.water.bian_west_15500` (`shore_n`, `shore_s`) |
| grd | 2 | `S3.grd.bank_n_16150` (far bank, `bank_top`), `S3.grd.bank_s_15500` (south bank, `bank_top`, all est) |
| **boats** (veh) | 7 | below |
| figures | 22 | all crew on `boat deck: <boat id>`; 6 of them `conf: low` |
| props | 1 | `S3.prop.mooring_post_17702` (conf low) |
| groups | 6 | one per boat with crew |
| structures (stairs, jetties) | 0 | no landing stair, jetty or quay is painted in u 15500–18300 |

Boats, west to east:

| id | what | waterline front → rear | pose, facing | crew |
|---|---|---|---|---|
| `S3.veh.boat_under_way_15595` | mat-roofed boat sculled by a stern sweep (pin 25; 余辉 摇橹向前) | (15595, 440 est) → (15955, 522 est); sweep blade tip (16133, 563) | rowed, 162 | 8: 3 at the bow, 5 at the sweep (1 low) |
| `S3.veh.boat_towed_mast_16228` | laden boat with a tall mast, towed by the five trackers | (16228, 312 est) → (15972, 295 est); mast top (16068, 12); towline end (16325, 112) | towed, 355 | 3: bow poler + 2 low on the cargo |
| `S3.veh.boat_passenger_long_16398` | very long passenger boat with lattice-window cabin, moored at the far bank | (16398, 340 est) → (17340, 388 est) | moored, 176 | 1 low (cabin door) |
| `S3.veh.boat_awning_17442` | boat with fore mat awning and high mat cabin, far bank | (17442, 345 est) → (17705, 368 est) | moored, 173 | 1 seated |
| `S3.veh.boat_lowered_mast_17708` | long low boat, heavy wales, mast lowered on an A-frame crutch (conf low) | (17708, 370 est) → (17998, 377 est); spar to (18100, 208) | moored, 178 | 0 |
| `S3.veh.boat_mat_cabin_18005` | boat with dark arched mat cabin, overhanging hood at the east end (bow unsure) | (18005, 378 est) → (18322, 378 est) | moored, 180 | 2 seated (1 low) |
| `S3.veh.boat_unloading_17705` | cargo boat moored along the south bank, grapnel anchor under the bow, mat hood and awnings over the stern | (17705, 868 est) → (18120, 950 est) | moored, 165 | 7: 6 on the foredeck + 1 low under the awning |

**Crowds counted head by head** (zoom 3–4, scan):
- **The unloading boat's foredeck: 6.** Heads at 17742, 17783, 17830, 17860, 17882 (half hidden) and 17918. The overview restyle
  also paints 6. The tile mosaic is shifted about 80 px east here and loses them.
- **The sweep crew: 5.** One is faint (15855). The restyle paints 6.
- **The bow of the boat under way: 3.**

## What was hard or ambiguous

- **The scan's resolution.** At zoom 3–4 figures under 40 px tall turn to blobs. All crew counts on the far-bank boats are low or
  medium confidence. The restyle fills the long passenger boat with diners (16540–16760). The scan shows one dark shape in its door
  (`S3.fig.passenger_door_16553`, low).
- **Bow or stern.**
  - The towed boat's bow is fixed: the towline runs from its masthead to the trackers ahead (east), and its east end carries a
    projecting bow beam.
  - The boat under way has the same projecting beam at its **west** end and works its 橹 over the **east** end. I read it as bow
    west (facing 162). The other reading is a bow sweep with bow east (facing about 342); both are in its note.
  - The far-bank boats are read as bows west: the long boat has a rudder post at its east end. The mat-cabin boat
    (`…_18005`) is low confidence. If its bow is east, its main point moves to 18322, in river_e's range; I keep it either way.
- **One boat or two.** The setup's "16380–16700" and "16600–17300" far-bank boats are **one** long passenger boat: its near-side
  bottom line runs unbroken from (16395, 335) to (17300, 388).
  - Between 17350 and 18330 I read three boats (awning boat, lowered-mast boat, mat-cabin boat).
  - The middle one is low confidence. Its row of log-like wales (17710–18000, v 340–375) and lattice rail could be a timber
    raft or a wharf platform. I read it as a boat because its bottom line continues its neighbours'.
  - The crossed A-frame at 17720–17770 could belong to either the awning boat or the lowered-mast boat. I gave it to the
    lowered-mast boat as its mast crutch.
- **The unloading boat's stern.**
  - The flat lattice mat awnings on poles (17960–18250, v 740–880, poles at about 18010 and 18170) and the arched mat hood
    (18040–18130, v 735–800) are read as this boat's stern cover.
  - Other readings: a second, mat-hooded boat moored astern (no hull visible: t5's parasol covers 18050–18250, v 870–980), or a
    mat-awning stall on the bank, which is what the restyle and overview paint.
  - The "figure under the awning" (18015) stands on the same spot as the awning's west pole. It is low confidence.
- **The things under the unloading boat's bow** are read as a multi-pronged grapnel anchor hanging under the bow. The prongs
  splay from (17740, 855) to five hooked tips at v 895–925. They could also be a bundle of poles or oars.
- **The shores are inked nowhere.**
  - The south shore is hidden behind reeds and roofs, the hall's north eave (v about 950), the shed's north eave (v about 935)
    and the unloading boat's hull.
  - Between 16420 and 17480 no ink stands between the lowest ripples and the tree feet, so the line there is interpolated
    (±60 px).
  - The north shore is hidden behind the moored boats east of 16390.
- **The "skiff" at 15600–15856, v 838–897** is the sweep blade of S4b's big rafted boat (the lead's message, from t1), so I don't
  record it. My first reading was a narrow hull, because the blade is drawn like one.

## Water level check reading

**None measurable in this reach.** Places tried:
- the south bank: its face points away from the viewer and is hidden everywhere;
- the far bank:
  - 16150–16450 is a wash-drawn slope, not a vertical face;
  - 16450–18300 its edge is hidden behind the moored boats;
  - the ground in front of the shops at 17250–17650 ends in wash strokes with no face;
- the far-bank hall on posts (18330–18460): its platform (v about 200–230) and its posts' feet (v about 245–265) would give
  roughly −0.4 m, but the platform is a raised floor, not ground level, and the posts' feet are blurred. Not usable.

**Use S4b's `supports.water`.** No landing stair or quay exists in u 15500–18300 to measure on. river_e's abutments under the
arch are the next chance.

## Shore points at the seams

- **u 15500 (S4b):**
  - `shore_n`: none. The water runs to the silk's top edge; the far bank is beyond the silk from the seam to about u 16150.
    A willow crown hangs from beyond the edge at 15200–15570, v 15–70.
  - `shore_s` = (15500, 915, est), behind S4b's willow crown and the reeds south of S4b's big rafted boat. Its hull bottom is at
    v about 820–850 and its sweep blade reaches (15856, 893).
  - South `bank_top` = (15500, 930, est).
- **u 18300 (river_e):**
  - `shore_n` = (18300, 255, est), behind the mat-cabin boat's east end, at the foot of the far-bank hall on posts.
  - Far `bank_top` = (18300, 240, est).
  - `shore_s` = (18300, 630, est), at the north-west edge of the land at the bridge's south foot, under the stall awning at
    18300–18460, v 480–600.
  - South `bank_top` = (18300, 640, est).

## Seam notes

**S4b (u 15500):**
- **S4b's rafted boat, bow at about 15790.** Its stem is at about (15765, 755), with the waterline under it at about (15740, 835),
  est. Its foredeck awning runs 15550–15800 at v 640–690, eave tip at (15800, 685).
  - A long pole with a frayed, broom-like end runs east from its roof at v 625–650 to about (15870, 640).
  - Its sweep blade lies at 15600–15856, v 838–897.
  - A possible figure stands on its foredeck under the awning at (15655, head about 683, foot about 720). This is for S4b's river
    agent, whose look range stops at 15650.
  - The S4b brief's "bow ≈ 15450" is about 340 px short. Nothing of mine touches the boat. My `shore_s` passes south of its sweep
    blade.
  - **Question for S4b and the lead:** S4b reads this boat's east end as the bow, but its sweep is at that end, and a 橹 is
    normally worked over the stern. The boat under way raises the same question.
- **S4b's lines from the rafted boats, where they end on S3's side:**
  - (a) A knotted pole or tasselled rope runs from about (15370, 482) east to its end at **(15505, 513)**, 5 px into S3. It ends
    in open water and reaches nothing. This is the "knotted pole lying across the rafted boat" that t1 left.
  - (b) A straight line runs from the bow of the third rafted boat (15400, 538) to **(15592, 586)**, where a small multi-pronged
    object (a grapnel anchor?) lies in open water at 15580–15605, v 576–592. It reaches no S3 entity.
  - Both are S4b's.
- **A small stake** stands in the water at (15465, 600–628), on S4b's side.
- **S4b's top boat** has both ends west of 15500: its prow and pole tip are at about (15485, 88). It is S4b's.
- **The faint strokes at the top edge (15480–15570, v 25–70)**, which the restyle paints as a boat (t1's left-to), are willow whips
  hanging from a crown beyond the silk's top edge. They continue west over 15200–15460, and no trunk is on the silk. There is no
  boat and nothing for river_w. For t1 and S4b: a tree with no trunk on the silk is not recorded, per the brief.

**river_e (u 18300):**
- The mat-cabin boat (`S3.veh.boat_mat_cabin_18005`) ends at 18322. If river_e reads its bow as east, its main point moves to
  18322; it stays mine either way, and the merge drops one if both record it.
- The festooned line at 18050–18300, v 220–245 (rope lashings or a furled sail on the lowered-mast boat's spar) ends at about
  18300.

## Things at my edges a neighbour may also record

- **The unloading boat's mat awnings** (17960–18250, v 740–880, poles about 18010 and 18170) and the arched hood: recorded as part
  of `S3.veh.boat_unloading_17705`. If t4 or t5 records them as a stall awning on the bank, the merge keeps one, settled on a
  zoom-3 crop.
- **`S3.prop.mooring_post_17702`**: a post with a small box lamp between the awning boat and the lowered-mast boat. It may be a
  deck post of the awning boat.
- **`S3.fig.figure_under_awning_18015`**: low confidence; may be the awning's pole.

## Groups across edges

- **`S3.grp.boat_towed_16228`**: the five trackers are t2's figures. The rear tracker is `S3.fig.tracker_16333` at (16325, 112),
  where the towline ends. The merge may add the trackers to the group.

## Supports used

`water` (the boats, the water, the mooring post) and `boat deck: <boat id>` for:
- `S3.veh.boat_under_way_15595`
- `S3.veh.boat_towed_mast_16228`
- `S3.veh.boat_passenger_long_16398`
- `S3.veh.boat_awning_17442`
- `S3.veh.boat_mat_cabin_18005`
- `S3.veh.boat_unloading_17705`

Exceptions:
- The two figures on the towed boat's cargo heap stand on the cargo, not the deck (feet est at v 165–175). Their height above the
  deck is a builder choice.
- The three bowmen of the boat under way stand on a raised bow deck: floor at v about 298, level with the bow top at
  (15597, 300).

## Scale cues and hull axes

All hull axes run from waterline front to waterline rear. These are depth cues only, not ground edges.

| boat | waterline length | hull axis slope dv/du | other cues |
|---|---|---|---|
| boat under way | about 370 px | 0.23 | bow top to waterline about 140 px; crew 62–90 px tall |
| towed boat | about 255 px | 0.07 | mast deck to top about 215 px |
| long passenger boat | about 945 px | 0.05 | window bays 40–50 px |
| awning boat | about 265 px | 0.09 | |
| lowered-mast boat | about 290 px | | spar about 370 px |
| mat-cabin boat | about 315 px | | |
| unloading boat | about 415 px | 0.20 | crew 110–135 px tall; bow beam about 45 px |

## Left to other agents (painted things I saw and did not record)

- **t2:**
  - the five trackers on the far-bank path, foot / head:
    - (16330, 128) / (16340, 100);
    - (16362, 115) / (16362, 87);
    - (16385, 100) / (16390, 75);
    - (16410, 85) / (16415, 58);
    - (16422, 78) / (16430, 48), the leader, upright.

    All bend forward, walking up the bank to the north-east, and the towline reaches the rear one;
  - the bare trees and willow on the far bank behind the long boat (16400–16750, v 0–250).
- **t1:**
  - the reeds and bushes along the south shore in front of the hall (15850–16450, v 850–950);
  - the bare trees at 16100–16700, v 350–1000;
  - the willow crown at the top edge (15200–15570, v 15–70), with no trunk on the silk.
- **t3, t4, t5** (far-bank strip, 17000–18450, v 0–200): the shops' people and tables, for example the man seated at a table at
  (18270, 130) and the figures at the tables at 17250–17330, v 100–150 and 17600–17700, v 100–170.
- **t4:**
  - the 新酒 pole with its crossed frame and bird vane (17605, top v about 690);
  - the banner's bar and the guy line from it to the ground (17400, 1000) → (17330, 1150).
- **t4 or t5:** the flat mat awnings if they are a stall (see above).
- **t5:**
  - the parasol at 18050–18250, v 870–980;
  - the crowd at the water's edge at the bridge's south foot, for example heads at (18210, 750), (18290, 680) and (18280, 760);
    the man at (18290, 680) holds a pole that slants down to the west;
  - the stall awning at 18300–18460, v 480–600.
- **structures_w:**
  - the riverside hall, whose north eave stands at the water at v about 950;
  - the mat-roofed shed at 17550–17920, v 930–1250, at the water's edge, with the unloading boat moored along it;
  - the far-bank shops 16750–18300.
- **structures_e:** the far-bank hall on posts at 18330–18600, with its posts' feet at the water's edge at v about 245–265.
- **S4b:** the rafted boat's bow end, its pole, its sweep blade and the possible figure on its foredeck (above); its two lines
  (above); the stake at (15465, 600–628).

## Contradictions with sections.md and the briefs

- **The S4b seam.** S4b's biggest rafted boat reaches about 15790, not about 15450.
- **The far-bank boats.** The two boats at 16380–16700 and 16600–17300 are one.
- **The south-bank boats.** The "boats" unloading at the south bank are one boat, or possibly two, with a mat-covered stern half.
- **Pin 25 (河边泊船 (纤夫), 15690).** It falls on the boat under way. The trackers belong to the towed boat at 15960–16230.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Bow or stern: find one boat whose heading is fixed, then compare.** A towline from the masthead to trackers ahead fixes a
  heading, and so does an anchor under the bow. A sweep (橹) at one end does not settle it alone: Song boats work sweeps over the
  stern and sometimes over the bow. Use the fixed boat's bow fittings (a projecting bow beam, a grapnel) to read the others, and
  record both readings in `note` when they disagree.
- **A long tapered shape beside a big boat is often its sweep blade, not a boat.** Big 橹 blades are drawn like narrow hulls,
  with planking strokes and a turned-up tip. Before calling a shape a boat, find a hull's two ends and a gunwale. A blade has a
  loom running up into its boat.
- **One boat or two: follow the near-side bottom line.** A continuous waterline under several cabins is one boat (S3: a
  950 px passenger boat that the first look split in two). A break in it, or a second stem, is a second boat.
- **Check a straddler with a crop that holds both of its ends.** A neighbour's look range (150 px) can stop short of a long
  hull: S4b's brief put the big rafted boat's bow at 15450, but it is at about 15790.
- **The overview restyle counts crews better than a shifted tile.** Where a tile registers badly (shifts of 80–110 px), the
  overview kept the unloading boat's six porters. Count on the scan, then name with the overview.
- **Gridded crops for counting:** label only the major lines (every 50 or 100 px) in boxed labels. Labels on every 10–20 px line
  can't be read at zoom ≤ 2. A plain `normalise` stretch reads better than CLAHE on this silk, which CLAHE turns to noise.
