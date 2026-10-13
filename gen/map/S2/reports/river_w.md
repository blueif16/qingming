# S2 river_w: report (water and boats, u 20500–21850; looked at 20350–22000), 2026-10-12

Part file: `gen/map/S2/parts/river_w.json` (25 entities). `node tools/scroll_map.mjs S2 check --parts gen/map/S2/parts/river_w.json`
gives **PASS**. S2 has no frame yet, so there are no support warnings.

Overlays read:
- the whole range at zoom 1 with grid 50: `gen/map/S2/look/river_w_overlay.jpg`;
- marker checks on contrast-stretched zoom 2–3 crops of each boat and its crew;
- zoom 3–7 crops of every boat end, crew head and doubtful shape, with the restyle beside them (`scroll_inspect.mjs canal/west`).

Every marker sits on its thing. The generator script `make_river_w.py`, the crop tool `crop.mjs` and all crops are in
`scratchpad/S2_river_w/`.

## Counts

| kind | n | entities |
|---|---|---|
| water | 1 | `S2.water.bian_river_w` (`shore_n`, `shore_s`, both from u 20500 to 21850) |
| grd | 3 | `S2.grd.north_bank_20500`, `S2.grd.south_bank_20500` (to 21420), `S2.grd.mound_south_bank_21420` (the south-bank mound, 21420–21960) |
| **boats** (veh) | 5 | below |
| figures | 13 | 12 on boats (2 conf low), plus 1 man in the open water (conf low) |
| groups | 3 | one per boat with crew |
| structures (stairs, jetties), props (posts) | 0 | none painted in the water's edge in u 20500–21850 |

The brief expected about 3 boats and 12–15 crew; I found 5 boats and 13 people.

Boats, north to south:

| id | what | waterline front → rear | pose, facing | crew |
|---|---|---|---|---|
| `S2.veh.boat_mat_cargo_21055` | long cargo boat with mat roofs, baskets and a water jar, moored along the north bank; its west end is behind S3's big boat | (21055, 493 est) → (20385, 465 est) | moored, 356 (bow east, conf med) | 6 |
| `S2.veh.boat_mat_shelter_20805` | low boat with mat roofs and a coiled rope, moored close in to the bank between the cargo boat and the bank | (20805, 300 est) → (21112, 305 est) | moored, 180 (bow unknown) | 0 |
| `S2.veh.boat_big_cabin_21120` | big cabin boat: stem head with a windlass hub, coiled ropes under an awning, low cabin, arched cabin, deckhouse, rudder house and a big rudder | (21120, 300 est) → (21665, 387 est) | moored, 168 (bow west, conf high: rudder at the east end) | 4 (1 low) |
| `S2.veh.boat_covered_21205` | small boat with a mat canopy on posts, off the south bank | (21205, 1235 est) → (20875, 1242 est) | moored, 1 (bow east, conf low) | 2 (1 low) |
| `S2.veh.boat_skiff_21080` | open skiff under the great south willow's whips, its east end behind the trunk | (21080, 920 est) → (21330, 1030 est) | moored, 154 (bow unknown) | 0 |

**Crews counted head by head on the scan** (zoom 3–4):
- **The cargo boat: 6.** By head (u, v):
  - (20490, 333), the pole man;
  - (20553, 368), leaning over the gunwale;
  - (20612, 330), standing at the rail;
  - (20658, 255), on the mat roof with his arm out;
  - (20873, 386), seated in the cabin door;
  - (20936, 372), in a cap at the rail.

  The brief said about 7. A seventh head nearer the west end belongs to S3's stern crew (`S3.fig.boatman_stern_rail_20400`).
- **The big cabin boat: 3, plus 1 low.**
  - the man in the low cabin's window (21332, 268);
  - the man on the far-side deck (21503, 128);
  - the steersman on the stern (21675, 130);
  - possibly one under the awning's west end (21245, 162): conf low.
- **The covered boat: 1, plus 1 low.** The seated man (21107, 1122). Beside him is a narrow upright shape (21075, 1140): a
  child or a tall vase, conf low.

## What was hard or ambiguous

- **The cargo boat's bow and its seam.**
  - Its west end lies behind the high stern and rudder of S3's big boat (`S3.veh.boat_mast_lowering_19518`, stern
    u ≈ 20330–20480). Its mat roof begins at u ≈ 20380.
  - No rudder or sweep shows at either end. The east end comes to a long, low point at the waterline (u 21000–21070,
    v 470–500), with open water and willow whips below and beyond it, where a rudder would have to show. I read it as
    the bow (conf med).
  - Under the other reading (bow west, upstream like the big cabin boat), the stem is at about 20385. The boat is then
    S3's by the seam rule, with `front`/`rear` swapped and facing about 176. S3's river_e does not record it ("the
    north-bank boat (S2's)"), so nothing is duplicated. The merge or the lead decides on the stem's u.
- **One big cabin boat or two boats.** The setup's "big cabin boat ≈ 20820–21800" is read here as two boats moored end
  to end:
  - the low mat-roofed boat at 20800–21115;
  - the big cabin boat, whose curved stem head with a round windlass hub stands at u ≈ 21120 (v 155–210).

  The restyle also draws two. The other reading, one 980 px boat with its bow at 20800, is in both boats' notes. Nailed
  hull planks at v 245–265 do show just west of the stem head at u 21090–21120. The mat-shelter boat's bow end is
  unknown (conf low).
- **The heads above the big cabin boat's roofs.**
  - t2 recorded the two men at (21503, 128) and (21673, 130) on the bank behind the boat, with both readings
    (`S2.fig.man_behind_boat_roof_21503`, `S2.fig.man_behind_boat_stern_21673`).
  - I record them as crew (`S2.fig.boatman_far_deck_21505`, `S2.fig.steersman_stern_21678`). The bank strip's edge here
    is at v ≈ 160–175, and t2's men on it stand with their feet at v 124–146 and are 46–73 px tall. A man on the strip
    with his head at v 128 would be 30–45 px tall, far smaller than these are painted. Both heads therefore stand on the
    boat (est feet v ≈ 210).
  - **The merge keeps one of each pair.**
- **The upright post on the big cabin boat** (u ≈ 21362, v 150–200). I read it as part of the boat (a bitt or short pole
  on deck, written in the boat's `what` and as `deck_post`). t2 recorded it as a bank mooring post
  (`S2.prop.post_north_bank_21364`, conf low). The merge keeps one reading.
- **The restyle's inventions here** (from the brief), checked on the scan:
  - The covered boat's tiled pavilion roof is a mat canopy on thin posts.
  - The "man with a child" in the open water is one man holding a small dark round thing to his face.
  - The "railing with a standing man" on the big cabin boat's roof is a row of six coiled ropes, a flat awning and the
    deck post. One pale patch at the awning's west end (21245, 160–185) might be a head; t1 also saw "a standing figure
    at about (21240, 160–180)". Recorded as `S2.fig.figure_under_awning_21245`, conf low. At zoom 5–7 it shows no
    outline or face.
- **The covered boat's companion** `S2.fig.child_or_vase_21076` (conf low): a narrow upright shape with a flat, brimmed
  top. The restyle paints a child; at zoom 4 it reads as a tall lidded vase on a stand. If it is a vase, retire it: it
  is then the boat's cargo.
- **The man in the open water** `S2.fig.man_in_river_20970` (conf low on his support). The figure is certain: a head
  in a dark cap, a robe, a hand to his face. Nothing is painted below his waist (v ≈ 700) and no hull is drawn under
  him. Two readings:
  - he wades waist-deep (foot est at the surface, support `water`);
  - he stands in a craft hidden by the willow whips.

  A straight line (20705, 812) → (20990, 760) runs below him: a pole or a straight whip.
- **Is the "hull through the willows" the covered boat?** No. It is a separate open skiff at v 835–1030, about 200 px
  north of the covered boat's canopy. Its east end is hidden behind the great willow's trunk.
- **What the "shed posts" are.** At zoom 2, the uprights at u 20610–20690, v 1150–1260 (east of S3's south-bank boat)
  look like a shed's posts. At zoom 3 they are the forked branches of t1's dark-trunked tree. Nothing was recorded.
- **Waterlines are estimates everywhere.**
  - The near-side waterline is the hull's lowest planking line where it shows: the cargo boat at v 462–493, the big
    cabin boat at v 345–388.
  - Elsewhere it is extended along the hull's slope, or set just below the gunwale (the covered boat and the skiff,
    seen through willow whips).
- **Shores.** No shoreline is inked west of u ≈ 21780.
  - `shore_n` runs behind the moored boats, just south of the bank strip's edge, ±30 px.
  - `shore_s` between 21000 and 21300 lies between the covered boat's waterline (v ≈ 1240) and t1's people on the bank
    (feet at v 1372–1444), ±40 px.
  - From 21420 east the shore is the mound's crest silhouette.
- **A faint reddish mark in the water** at (20683, 645–675): a short vertical stroke with a crossbar, which the restyle
  ignores. It is probably a stain, possibly a stake. Not recorded; for the second pass.

## Water level check reading

**None measurable in u 20500–21850.** Places tried:
- the north bank: its edge is hidden behind the moored boats west of 21720. East of the big cabin boat's stern it is a
  wash-drawn slope, (21800, 232) down to the water at (21820, 335), not a vertical face. A slope's drop mixes depth with
  height, so it bounds nothing useful.
- the south bank: it faces away from the viewer and is hidden behind S3's boat, the willow whips, the covered boat and
  the bank's people. The mound is a rounded crest whose foot is behind it.

No stair, quay face, jetty or post meets the water anywhere in the range. **Use S4b's `supports.water`.**

## Shore and bank points at the seams

- **u 20500 (S3):** I copied S3's river_e points exactly:
  - `shore_n` (20500, 330, est) and north `bank_top` (20500, 300, est), from `S3.water.bian_river_18300` and
    `S3.grd.north_bank_20250`;
  - `shore_s` (20500, 1235, est) and south `bank_top` (20500, 1255, est), from `S3.grd.south_bank_20120`.

  `S3.road.main`'s last point (20500, 258) lies 42 px north of the bank top, which is consistent.
- **u 21850 (river_w2):**
  - `shore_n` = (21850, 345), visible: the foot of the wash slope under the trackers' path;
  - north `bank_top` = (21850, 248);
  - `shore_s` = (21850, 1432), on the mound's crest.

  The mound (`S2.grd.mound_south_bank_21420`, mine by its main point) carries on in my part to (21960, 1530), where it
  meets the water beside river_w2's open boat. river_w2 starts its south shore from there.

## Seam notes (S3, by S3's IDs)

- **`S3.veh.boat_mast_lowering_19518`:** its high stern (stern_top (20420, 305)) and its rudder ((20435, 580)) cover the
  west end of `S2.veh.boat_mat_cargo_21055`. Four of the cargo boat's crew turn toward it: the pole man fends it off
  and the man on the roof stretches his arm out to it. The group's `src` is "余辉: 大船抢险 (setting: the neighbouring
  boat)". S3's `S3.fig.boatman_cabin_door_pole_20300` holds his pole out east. On the scan it is a straight line at
  v ≈ 545–552 that ends in open water at about (20605, 552), level with S3's pole end (20600, 548). It passes about
  60 px south of this boat's waterline and touches nothing of mine.
- **`S3.veh.boat_moored_south_bank_19745`** (the boat with the waving men): its east end, about 20640 (roof v 1083–1100,
  hull v 1130–1250), lies in my look range. Not recorded, as the brief says.
- **The north-bank cargo boat's stem:** if the lead reads its bow as west, it becomes S3's (stem at about 20385).
- My water, north bank and south bank start on S3's seam points (above).
- Nothing else of mine crosses u 20500.

## Things at my edges a neighbour may also record

- **t2:**
  - `S2.fig.man_behind_boat_roof_21503` = my `S2.fig.boatman_far_deck_21505`;
  - `S2.fig.man_behind_boat_stern_21673` = my `S2.fig.steersman_stern_21678`;
  - `S2.prop.post_north_bank_21364` = the big cabin boat's deck post.

  Keep one of each; my case for the boat is above.
- **t1:** saw "a standing figure on the big cabin boat at about (21240, 160–180)". That is my
  `S2.fig.figure_under_awning_21245` (conf low).
- **structures_w** may record the south-bank mound as a ground feature (t2 left it there). It is mine as
  `S2.grd.mound_south_bank_21420`. Keep one.
- **river_w2:** the mound's east end (21850–21960) is in my part. The open boat beside it, with a line from its stern
  toward the mound at about (21904, 1480) (t2's note), is river_w2's.

## Groups across edges

- **`S2.grp.boat_covered_21205`** faces t1's `S2.grp.south_bank_people_21150` across the water's edge. The bank man
  holds a small round object up toward the boat, and the boat carries a vase-like thing. This may be 余辉's 船侧祭神 (an
  offering at a boat's side), which the brief places between the grain boats and the bridge. Unconfirmed and not tagged;
  for the needs and second-pass agents.
- **The cargo boat's mooring rope** runs from the deck coil (20835, 318) up to the foot of t1's
  `S2.tree.willow_top_20668` at about (20660, 205). It is recorded as the boat's `mooring_rope` polyline, far end named
  in its note.

## Supports used

- `water`: the 5 boats, the water, and `S2.fig.man_in_river_20970` (wading, foot est at the surface);
- `boat deck: S2.veh.boat_mat_cargo_21055` (5): the deck is the near gunwale's level, v ≈ 412–427 over a waterline of
  v ≈ 462–486, so about 50–60 px of freeboard;
- `boat roof: S2.veh.boat_mat_cargo_21055` (1): the man on the mat cover over the cargo, feet at v ≈ 338, about 85 px
  above the near gunwale and 135 px above the waterline;
- `boat deck: S2.veh.boat_big_cabin_21120` (4):
  - the window man's cabin floor is at the near gunwale (v ≈ 300 over a waterline of ≈ 345);
  - the far-deck man and the steersman are est at v ≈ 210 on the far side and the stern, under a stern top of v ≈ 255
    over a waterline of 387;
- `boat deck: S2.veh.boat_covered_21205` (2): the gunwale is at v ≈ 1195 over an est waterline of ≈ 1238, about 40 px of
  freeboard.

## Scale cues

- **Hull lengths (waterline):**
  - cargo boat about 670 px;
  - big cabin boat about 545 px (stem head to rudder about 670 px);
  - mat-shelter boat about 310 px;
  - covered boat about 335 px;
  - skiff about 265 px (est).
- **Freeboard:**
  - cargo boat 50–55 px;
  - big cabin boat's stem head about 130 px above its est waterline;
  - its stern top about 130 px above its waterline.
- **Crew painted heights** (head → est foot):

  | figure | v of foot | height |
  |---|---|---|
  | pole man | 412 | 79 px |
  | standing man | 420 | 90 px |
  | man on the roof | 338 | 83 px |
  | far-deck man (est) | 212 | 84 px |
  | steersman (est) | 210 | 80 px |
  | seated man on the covered boat (to the deck) | 1195 | 73 px |
  | the man in the water (to his waist) | 702 | 76 px |

  The crews on the north-bank boats (deck v 210–427) are painted about 80–90 px tall. t2's men on the bank strip
  (v 124–146) are 46–73 px tall.
- **Hull axes** (depth cues only, not ground edges), as dv/du:
  - cargo boat +0.04;
  - big cabin boat 0.16 (rear → front rising westward, about 12° north of west at dx ≈ 40);
  - skiff 0.44.

No ground-level receding edges in my range: everything on land is the tiles' or structures_w's.

## Left to other agents (painted things I saw and did not record)

- **t1:**
  - a dark blob on a willow twig at about (21125, 640), probably a perched bird;
  - the dark round thing at (21015, 652) is held by the man in the water (named in his `what`; not a separate thing
    unless the second pass reads it as a bird);
  - `S2.tree.willow_top_20668`'s foot is the mooring rope's far end.
- **t2:** nothing new. The bird at (21731, 636) and the mound's shrub are in its part. The trackers on the bank at
  21830–22180 are its figures.
- **structures_w:**
  - the shops along the north bank's top (u 20950–21800, v 0–150);
  - the big tiled roof on the south bank (u 20450–21460, v 1310–1790);
  - the thatched or tiled roof along the mound's south foot (ridge about (21380, 1450) → (21900, 1650)).
- **river_m:** 逆水行舟's tow rope reaches t2's rear tracker at about (22172, 386). It does not enter my range.
- **river_w2:**
  - the open boat with a pole by the mound's east end (u ≈ 21960–22250, v 1430–1580);
  - the boat with six men at 21870–22450, v 830–1060, which shows at the edge of my look range.
- **S3:** the big boat's stern and rudder, and the south-bank boat's east end (above).

## Contradictions with sections.md and the briefs

- **"About 7 aboard"** the north-bank boat: 6 are painted. The seventh head belongs to S3's stern crew.
- **"Big cabin boat ≈ 20820–21800":** two boats (above).
- **"The south bank's shore runs ≈ (21300, 1300)–(22000, 1500)":** it runs lower. It reaches (21340, 1422) at the great
  willow's foot, then follows the mound's crest from (21420, 1415) through (21700, 1398) to (21960, 1530).
- **"A hull seen through the willows may be the same boat"** as the covered boat: it is a separate skiff.
- Nothing in u 20500–21850 contradicts `reference/scroll/sections.md` §2. 余辉's 船侧祭神 may be the covered boat with
  t1's group (unconfirmed).

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **A head above a moored boat's roof: decide bank or deck by size.** Find the bank's edge behind the boat and the
  painted height of a figure standing on that strip. If a man on the strip would be painted far smaller than the head
  shows, he stands on the boat (its far-side deck or stern). S2: t2 put two boat hands on a 1 m strip of bank. The river
  agent and the tile agent should name the same pair in their reports so the merge keeps one.
- **A boat whose end is hidden behind a neighbour: read the bow from the end you can see.** A stern shows its rudder
  hanging into the water below it, or its sweep. If the visible end has open water under and beyond it and no rudder,
  it is the bow. Give the other reading in `note`. When that reading moves the stem across a seam, say so in the report.
- **Boats moored end to end along a bank look like one long boat at the setup's zoom.** Find each stem head (a curved
  stem with a windlass hub) and each rudder before taking a length from a first look. S2: a "980 px cabin boat" was a
  310 px mat-roofed boat plus a 545 px cabin boat.
- **A near tree's forked branches read as a shed's posts at zoom 2.** Check uprights at the water's edge at zoom 3 before
  recording a structure or a post.
- **Contrast-stretched crops** (sharp `normalise()`, Lanczos) at zoom 2–3, with labels only on the 50 px lines, read
  best on this silk. Above zoom 4 the weave swamps the strokes. Use zoom 5–7 only to decide whether a small patch has
  an outline or a face.
- **A painted figure with nothing under it** (S2: a man in the open water, drawn from the waist up) is recorded, with
  `conf: low` on its support and both readings (wading, or a hidden craft). It is never dropped, and never given an
  invented boat.
