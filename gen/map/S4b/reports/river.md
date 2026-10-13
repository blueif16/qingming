# S4b river agent: report (2026-10-12)

Unit `river`: everything on or in the water, owning u 14300–15500 by main point and reading u 14150–15900. Part file
`gen/map/S4b/parts/river.json` (18 entities, `check` PASS). Overlay `gen/map/S4b/look/river_overlay.jpg`
(u 14600–15900, v 0–1000, zoom 1, grid 50). My crops and scripts are in `scratchpad/S4b_river/`, with the
generator `make_river.py`.

## Findings for the lead (read first)

1. **The water level can't be measured the way Phase 0 planned.** S4b's moorings have no vertical bank face, revetment,
   stair or jetty. The bank is a low sandy slope drawn with diagonal ink-wash streaks, and the water is plain silk
   with ripple ticks and eddy swirls. Where the bank's top and the first water are closest, the two-point drop gives
   **an upper bound on the depth**: 0.68–0.75 m below street level at three places. A bank that slopes, as this one
   does, puts the water higher than that. **Proposal: `water` H = −0.7 (conf low; plausible range −0.3 to −0.75)**
   in place of the seed's −1.5. The derivation is under "Water level" below. S3's revetments and the Rainbow
   Bridge's abutments are the place for a real two-point reading. S3's river agent should measure one there, and
   the lead should prefer it if it has a vertical face.
2. **Six boats, not five:** five moor side by side at the near bank and one lies along the far bank. The lead's look
   missed one, the boat with an arched mat awning (`S4b.veh.boat_arched_awning_14945`). Only its after half shows,
   between the mat-cargo boat and the big boat. The setup's "fifth hull at v 340–440" is the mat-cargo boat
   (`…boat_mat_cargo_14900`). The restyle's count is right. North to south: the round boat seen end-on (moored bow-in at
   an angle, its stern resting over the long boat), the long boat, the mat-cargo boat, the arched-awning boat and the
   big cabin boat.
3. **The biggest boat runs to u ≈ 15855, not 15450.** It has a mat-roofed after cabin over u 15500–15805, railings at
   15640–15760, a sweep blade trailing to (15855, 897) and a spar (probably the lowered mast) to u 15865. The
   "riverside hall roof from u ≈ 15530" in the brief is, at v 640–800, **this boat's after cabin**. S3's hall is the
   tiled roof lower down, from about u 15650 at v ~950. Phase 0 gives the boat to S4b, and its main point (the bow
   waterline, (14928, 703)) is in S4b in any case. S3's river agent must not record it. S3's agents should give their
   reading of everything at u 15500–15870, v 600–900 as seam notes on `S4b.veh.boat_big_cabin_14928`.
4. **Bows to the bank, not sterns (conf med; both readings are in every boat's note).** The outer ends carry what marks
   a stern:
   - the round boat has a transom with a rudder stock;
   - the arched-awning boat has a vertical stock and a pole into the water under the seated boatman;
   - the big boat has a long sweep blade in the water beyond its east end;
   - the small boat has its cabin and a tiller-like stick at the east end.

   The bank ends have a forked bitt, a gangplank and mooring ropes to a post. If the lead keeps "sterns to the bank",
   swap `front`/`rear` and `bow_top`/`stern_top` and add 180 to `facing_deg`. Main points would then move to the
   east ends: u 15360–15745 for the rafted boats. That is still inside S4b except the big boat, whose stern is at
   15745.
5. **The water doesn't reach the silk's top edge in S4b (conf low).** Land lines the top from u 14850 to 15560: the
   top-left building, an open shed on posts (u 15000–15170, v 20–90) and the far bank's willows. This contradicts
   sections.md §2 ("the river leaving the top of the frame ≈ 14500–15000"). The one place it could leave is the strip
   at u 15030–15180, v 85–150 between the building and the shed. I read it as land (faint wash, no ripple ticks, and
   the restyle paints sand there). The other reading is the far bank's south face with water up to it.
6. **No crew on the top boat.** The restyle's mast and crewman there are the far bank's willow trunks
   (u 15297–15387, v 17–75).

## Counts by kind

| kind | n | entities |
|---|---|---|
| water | 1 | `S4b.water.bian_river` (lines `shore_s`, `shore_n`) |
| grd | 2 | `S4b.grd.near_bank_14850` (bank_top + shore), `S4b.grd.far_bank_15330` (bank_top + shore) |
| vehicle (boats) | 6 | `boat_big_cabin_14928`, `boat_arched_awning_14945`, `boat_mat_cargo_14900`, `boat_long_cabin_14850`, `boat_round_mat_15025`, `boat_small_cabin_15182` |
| figure (crew) | 5 | 2 high conf (`seated_man_cabin_roof_15012`, `seated_boatman_stern_15372`), 3 low (`boatman_dark_cap_15046`, `boatman_light_hat_15066`, `head_in_cabin_door_15097`) |
| prop | 1 | `S4b.prop.mooring_post_14737` |
| structure (stairs, jetties) | 0 | none painted |
| group | 3 | `big_cabin_boat_crew` (boat + 2), `arched_awning_boat_crew` (boat + 1), `long_cabin_boat_crew` (boat + 2) |
| trees, animals, buildings, roads | 0 | (land: left to others, below) |

The mat-cargo boat, the round boat and the small cabin boat have no crew, so they have no group.

## Water level (the 汴河's surface; frame support `water`)

Method: H_water = H_ground − (v_waterline − v_ground) / 77, at the same u. Ground is taken as street level (H 0): the
bank path and the landing are the same open ground as the top street.

**Why the result is a bound, not a reading.** The formula holds only for a vertical face. Here the waterline at the
same u lies south of (in front of) the ground point, across a landing or slope of some depth s in metres. In this
frame that adds 51.25·s px of v, so |H_water| = (Δv − 51.25·s) / 77 ≤ Δv / 77. Any bank width makes the water higher
than the bound.

| place | ground point (stroke) | waterline (stroke) | Δv | bound on H_water |
|---|---|---|---|---|
| M1: the bank path at the gangplank, u 14778 | (14778, 401): the path under the porter's feet and the plank's foot (14760, 402) | (14778, 456): the first ripple swirl (ripples u 14774–14796, v 456–470) | 55 | ≥ −0.71 |
| M2a: the landing before the top-left building, u 14920 | (14920, 166): the building's front wall foot, the line (14900, 170)–(15030, 142) | (14920, 224): the lower edge of the landing's wash, where the water begins | 58 | ≥ −0.75 |
| M2b: the same landing, u 14990 | (14990, 151): the wall foot | (14990, 203): the landing's edge (B's bow pole crosses here) | 52 | ≥ −0.68 |
| M3 (only if the strip u 15030–15180 v 85–150 is the far bank's face) | (15075, 81): the shed's ground line | (15075, 150): a faint stroke at u 15050–15103 | 69 | ≥ −0.90 |

**Spread:** −0.68 to −0.75 at the three near-bank places (0.07 m), and −0.68 to −0.90 with M3 (0.22 m).

**Trust:** I trust M2a and M2b most. A wall foot is a sure ground point, and the landing in front of it is the
narrowest bank in the picture (52–58 px from wall to water). M1 depends on reading the first swirl as the waterline;
the bank wash there runs on as a tongue to v ~520. M3 depends on the doubtful far-bank reading.

**Proposal: −0.7 m** (the bound, as if the bank faces were steep; conf low). If the landing is a gentle beach about
1 m deep, the true value is about −0.3. For comparison, the seed −1.5 would put every shore point and boat about 1.2 m
further north than −0.7 does.

**Deck heights (freeboards), for `boat deck:` / `boat roof:` H = water + …:**

| boat | gunwale or deck (stroke) | waterline straight below | Δv | H above water |
|---|---|---|---|---|
| big cabin boat, deck | (15200, 773) deck edge with its nail row | (15200, 830) bottom strake | 57 | 0.74 |
|  | (15300, 790) | (15300, 845) | 55 | 0.71 |
| big cabin boat, west cabin roof (the seated man) | roof eave ~v 585 over cabin posts u 14972–15010 | deck ~v 690, plus the deck's 0.73 | 105 + 0.73 m | about 2.1 |
| arched-awning boat, stern deck (the seated boatman) | (15372, 535) deck under him | (15372, ~600) the hull's end curve behind the big boat's rail, est | 65 | 0.84 (est) |
| long boat, south deck (the two faint boatmen) | ~v 410 (the deck edge behind the mat cargo) | hidden, est v ~455 | 45 | about 0.6 (est) |
| small cabin boat (no crew) | (15185, 92) up-swept west end | (15182, 158) | 66 | 0.86 at the end, about 0.7 amidships |

Support names used: `water`, `boat deck: S4b.veh.boat_big_cabin_14928`, `boat roof: S4b.veh.boat_big_cabin_14928`,
`boat deck: S4b.veh.boat_arched_awning_14945`, `boat deck: S4b.veh.boat_long_cabin_14850`, `ground` (the banks, the
post). The `check` warnings about these deck supports not being in the frame are expected.

## Shore points at the seams

- **u 15500, for S3:**
  - near (south) shore `shore_s` (15500, 896, est), under willow whips;
  - near bank top about (15500, 915, est);
  - far (north) shore `shore_n` (15500, 112, est), behind the line of the small boat;
  - far bank top (15500, 75, est); the silk's top edge is at v ~15.

  Both shores run on into S3: the near shore at v ~900–1000 by 十千脚店, the far bank with its shops at the top.
- **West:** the water ends inside S4b, at the mooring post (14738, 662) and the bank path (14778, 455). Nothing
  crosses to S4.

## Things crossing u 15500 (points on both sides)

- `S4b.veh.boat_big_cabin_14928` (S4b's under Phase 0):
  - hull u 14903–15745 at the waterline, the stern's raked end at (15760, 777)–(15745, 865);
  - after cabin's mat roof u 15500–15805, its eave tip (15805, 685);
  - railings and posts u 15640–15760, v 760–850;
  - sweep blade (15690, 850)–(15855, 897);
  - spar along the cabin tops, v 625–640, from u ~15150 to a brushy end at (15830–15865, 630–650), with a small cross
    mark at (15775–15792, 625–642).
- The arched-awning boat's anchor line: from its stern (15403, 533) to a splash mark at (15580–15607, 577–590).
- The mat-cargo boat's looped line: from about (15335, 468) to its end at (15487–15507, 503–513).
- The far bank's willow whips at u 15490–15567, v 20–70: a trunk beyond the seam or above the silk's edge (S3 or t5).
- The water's two shore lines.

## Seam notes and edges

- **S3:** the boat under way at u 15560–15900, v 230–550, with two crew at its west end (u 15620–15700, v 230–290) and
  crew bending at its east end (u 15800–15900, v 380–450). It is S3's; I recorded nothing of it. Everything of the
  big cabin boat east of 15500 is S4b's (above).
- **t4 and t5** (the bank is mine, the people on it theirs):
  - the gangplank's bank end is at t4's porter (feet about (14778, 401));
  - the big boat's ropes end at my post (14737, 665).
- No group crosses my edges.

## Scale cues and receding edges

Hull lengths are along u, painted:

| boat | hull | other cues |
|---|---|---|
| big cabin | 14903–15855 (about 950 px with the sweep; 12.3 m between the waterline points with the seed frame) | freeboard 55–57 px at v ~830–845; west cabin walls about 105 px eave to deck |
| arched awning | awning 15105–15407 (300 px; the west half is hidden) | freeboard at the stern about 65 px |
| mat cargo | 14882–15390 (510 px) | |
| long boat | 14841–15391 (550 px) | east deckhouse 85 px wide, floor v ~410 |
| round boat | foreshortened (about 150 px bow post to transom) | beam 235 px across its sides at v ~270; transom 80 px |
| small cabin | 280 px, plus the stick to 15487 | gunwale to waterline 55–66 px |

Painted crew heights against foot v:

| figure | height | foot v |
|---|---|---|
| seated man on the roof | 54 px | 556 |
| seated boatman | 38 px | 535 |
| standing boatmen, long boat | about 44 px | about 410 |
| doorway figure, head to floor | 51 px | 748 |

These fit S4's diminution: about 0.4–0.5 of the road's size at v 400–550.

Receding edges (two stroke points; they are boat or wall lines, not ground, so only a cross-check):

| edge | stroke points | slope dv/du |
|---|---|---|
| the top-left building's front wall foot | (14900, 170) → (15030, 142) | −0.22 (a wall running east-north-east) |
| the round boat's axis, transom to bow | (15160, 297) → (15025, 220) | +0.57 |
| the near shore's edge band, a level line | (14935, 782) → (15040, 860) | +0.74 |

## What was hard to read, and the restyle

- **Orientation:** see finding 4.
- **Hidden waterlines:** each boat's south waterline is hidden by the next boat south, and its north one by its own
  hull. All `front`/`rear` points except the big boat's west foot, the round boat's transom foot and the small boat's
  west end are `est`.
- **The arched-awning boat's west end isn't painted** (it is behind the big boat's roof cabin). Its front is put at the
  bank line with the others, anywhere from u 14900 to 15100.
- **The long pole** from the post's foot (14740, 660) along the big boat's south side to about (15200, 765): two
  parallel lines about 5 px apart. It is a gangplank or a pole laid along the hull (conf low); it is in the big boat's
  `what`.
- **Faint crew** (conf low, both readings in the notes): the two boatmen on the long boat (a dark cap at
  (15040–15052, 368–376); a lighter outline at (15058–15073, 367–380)), and the head in the big boat's cabin door
  (u 15092–15102, v 697–708).
- **Where the restyle invents** on the water:

| u | v | the restyle draws | the scan has |
|---|---|---|---|
| 14985–15050 | 500–575 | two men on the big boat's roof | one |
| 15330–15370 | 40–90 | a mast and a crewman on the small boat | willow trunks |
| 15075–15120 | 523–547 | a reclining man in dark clothes on the arched-awning boat's deck | unreadable crossing strokes; not recorded. A second pass may look again |
| 15380–15550 | 530–620 | a broad woven mat surface | open water with the anchor line |
| 14800–14880 | 210–330 | sacks with a seated man | a stippled small tree or heap on the bank (t4's, below) |
| 15100–15190 | 10–80 | a tiled house | an open shed on posts: real, the restyle only re-roofs it |

  - Every willow is leafed in the restyle; the scan's are bare.
  - The water is a pale sheet in the restyle; the shores come from the wash and the ripples.
  - The setup's note that the restyle "moves the bow figure on the boat above the biggest about 50 px east" isn't
    borne out. The seated boatman (head (15371, 497)) is in the same place in both, and nothing is painted at
    u 15355–15380, v 455–490 (only the mat-cargo boat's spar).

## Left to other agents (what, where, to whom)

**t4 (u 14100–14850):**
- the porter with baskets on a shoulder pole, feet about (14778, 401), facing east at the gangplank's foot;
- the two figures at u 14645–14700, v 335–405 (one smaller);
- a small stippled tree or heap on the bank at u 14790–14840, v 222–345, base about (14808, 345). The restyle makes
  it sacks with a seated man; it may also be a post wrapped in matting;
- two figures on the bank by the tea house's roof at u 14520–14600, v 600–690 (heads about (14545, 610) and (14590, 640));
- the shop's tables and benches at u 14760–14870, v 140–210 (t4 or t5, by base).

**t5 (u 14850–15500):**
- the man standing behind the riverside roof and pointing east at the river, head (14928, 808), arm to (14968, 825),
  foot hidden (est about (14935, 875)); support `bank top`;
- the far bank's willows at the top edge, all bare:
  - a trunk at about (15230, 20–62);
  - one or two leaning trunks at u 15295–15390, v 17–75, crowns cut by the silk;
  - whips at u 15490–15567, v 20–70 (trunk at or past the seam; a seam note with S3).

**structures_e:**
- the top-left building on the landing: front wall foot (14900, 170)–(15030, 142), eave with rafter ends
  (14880, 125)–(15030, 97), posts at u 14870, 14900 and 15030;
- the open shed on posts at the top edge, u 15000–15170, v 20–90: posts at u 15040, 15050, 15100 and 15160, ground
  line v ~80;
- the riverside building whose roof (u 14950–15180, v 850–1000) backs onto the near shore.

**S3:** the boat under way and its crew (u 15560–15900).

No bank path is drawn: the t4 figures stand on open bank ground at v ~400–410. I recorded no `road` for it. If
structures_e or the lead want it as a ground feature, it runs from about (14600, 410) to the plank's foot (14760, 402).

## Contradictions with `reference/scroll/sections.md`

- §2 S4: "the river leaving the top of the frame ≈ 14500–15000": in S4b the water does not reach the top edge (finding
  5).
- "Riverside moorings ≈ 14400–15700": the moored boats run from the post (14737) to the big boat's stern (≈ 15855).

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

> - **Count moored boats by their ends and by what lies between them.** At S4b the lead counted four rafted boats.
>   There were five side by side plus one along the far bank: the missed one showed only its after half (an arched
>   awning) between two others. Walk the row of bank ends and the row of outer ends at zoom 3, and give every
>   awning, cabin or deck you can't attach to a counted hull its own hull.
> - **Read which end is the bow from the end's furniture, never from the bank.** Rudder stock or transom, sweep
>   blade, after cabin and tiller mark the stern; forked bitt, windlass and gangplank mark the bow. Anchor lines can
>   leave either end. Give both readings in the note: front, rear and facing all flip with it.
> - **Find a boat's whole extent before deciding seams.** S4b's biggest boat ends 400 px further east than Phase 0
>   assumed, and its after cabin had been taken for the next section's riverside hall.
> - **A wash-drawn bank has no vertical face.** Shores are not inked: the shore is where the bank's diagonal ink-wash
>   streaks stop and ripple ticks and eddy swirls begin. The restyle paints the water as a pale sheet, so its colour
>   edge is useless. The two-point water level (ground over waterline at the same u) is then only an upper bound on
>   the depth. Take it where a building's wall foot stands closest to the water, and report it as a bound with the
>   spread. A real reading needs a revetment, a stair or a bridge abutment.
> - **Crop tools:** a plain 3–4× crop of the scan with a light sharpen (sharp `.sharpen()`) reads faint silk better
>   than CLAHE, which turns the silk's weave into noise. The Bash shell is zsh, which does not split an unquoted
>   `$w`, so `for w in "u0-u1 v0-v1" …; set -- $w` passes one argument. Put batch crop loops in a bash script.
