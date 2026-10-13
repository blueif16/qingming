# S2 river_m: report (water and boats, owns u 23300–26000; looked at 21700–26150)

Part file `gen/map/S2/parts/river_m.json` (35 entities). `node tools/scroll_map.mjs S2 check --parts gen/map/S2/parts/river_m.json`:
**PASS**, with no warnings (S2 has no frame yet). Self-overlay: `gen/map/S2/look/river_m_overlay.jpg` (u 23300–26150,
v 0–1790, zoom 1, grid 50). I read zoom-2 overlays over both hulls and the moored boat, and a zoom-0.7 overlay of the tow
rope with t2's trackers (u 21700–24300). Every marker sits on its thing. Crops, the generator `make_river_m.py` and the
greyscale crop tool `gcrop.mjs` are in `scratchpad/S2_river_m/`.

## Findings for the merge and the lead (read first)

1. **The mast stands on the southern hull, and that hull is 逆水行舟** (`S2.veh.boat_towed_mast_23632`).
   - From v ≈ 460 to its tabernacle the mast is drawn *over* the northern boat's planking. The tabernacle sits on the
     southern boat's cabin roof: posts at u ≈ 24185 and 24222, braces at u 24180–24260, v 893–965.
   - Mast top: (24183, 302). The tow rope is made fast at (24188, 375).
   - The bow is west (the rudder is at the east end) and the pose is `towed`.
2. **The tow rope is recorded as a polyline on the boat** (`pts.rope`, from the mast out to the far end).
   - It runs 26 points, about 2356 px along u. East of 22900 they are my reading; from there west they are t3's and t2's.
   - `rope_end` is (21832, 197), in the hands of t2's lead tracker `S2.fig.tracker_lead_21867`; the whole file is
     `S2.grp.trackers`.
   - The lowest sag is v ≈ 518–521 at u 23250–23500.
   - A short bar is lashed across the rope at (23945, 435–472): `rope_toggle`. This is t4's "stake or marker on the
     rope".
3. **The northern hull is one boat**, a high-sided cargo boat moored along the bank, bow west
   (`S2.veh.boat_cargo_hooded_bow_23715`).
   - Its rivet rows run unbroken from u ≈ 23710 to the stern at ≈ 25165. I checked at zoom 3 at 24540–24820, where a
     second bow would be.
   - Its stern touches the moored boat's bow (u ≈ 25150).
4. **The brief's "small canopied boat" (24250–24500, v 500–600) is read as this cargo boat's midship deckhouse.**
   - The deckhouse is mat-roofed and open-sided: roof u 24275–24583, v 496–530, with a dark arched hood at its east end.
   - Its two men sit at the cargo boat's deck level (v ≈ 600), and no separate stem, hull or waterline shows.
   - Conf med. The other reading is a small boat tucked between the cargo boat and the bank. It is written in the boat's
     note. If the lead prefers it, that boat needs its own entity, and the two deckhouse men become its crew.
5. **So river_m has 3 boats, not 4–5:** 逆水行舟, the cargo boat, and the boat moored before the halls
   (`S2.veh.boat_moored_mat_canopy_25145`, moored to t6's post `S2.prop.mooring_post_25207`).
   - Nothing else floats in u 23300–26000. South of v ≈ 1230 the water is empty to the silk's edge (v ≈ 1776).
6. **I can't find "rowed by eight men" (sections.md) on the scan.**
   - No oar or sweep is in the water.
   - The fan of about 15 long lines from the mast are stays.
   - Only one roof man hauls a line (`boatman_hauling_mast_24140`).
   - The boat is towed and fended off. The pole men are one on 逆水行舟 against 豪华客船's stern, and one on the cargo
     boat at its gunwale.
7. **A long dark blade projects east at deck level from 逆水行舟's stern** (25000–25285, v 910–1015).
   - It could be a sweep (橹) shipped aft, or the stern awning's eave. Conf low; recorded as `sweep_root` and `sweep_tip`.
   - The rudder blade itself hangs at the waterline (24965–25185, v 1160–1220).

## Counts by kind

| kind | n | entities |
|---|---|---|
| water | 1 | `S2.water.bian_river_m` (`shore_n` only; no south shore in this reach) |
| grd | 1 | `S2.grd.bank_n_23300` (`bank_top`, `shore`) |
| vehicle (boats) | 3 | `boat_towed_mast_23632` (逆水行舟), `boat_cargo_hooded_bow_23715`, `boat_moored_mat_canopy_25145` |
| figure | 27 | 25 crew + 2 at the bank's edge (below); by conf: high 4, med 10, low 13 |
| group | 3 | one per boat with its crew |
| prop, structure (stairs, jetties), tree, animal, building | 0 | No landing stair, jetty, quay or post in the water's edge in u 23300–26000. The two mooring posts on the bank are t6's and t7's. |

**Crews counted head by head** (zoom 2–3 colour, with the restyle beside):

| boat | crew | by conf | the restyle |
|---|---|---|---|
| 逆水行舟 | **11** | 2 high, 6 med, 3 low | adds a second bowman |
| cargo boat | **11** | 2 high, 3 med, 6 low | paints knots of 4–5 at both windlasses |
| moored boat | **3** | 1 med, 2 low | |

- **逆水行舟:**
  - foredeck: bowman, fender-off, robed man;
  - roof: a leaning man, the hauling man, a seated man, and two low (a second head among the coils; a shape at the
    after roof);
  - inside: a passenger at a window and a man at a door;
  - stern awning: a low standing shape.
- **Cargo boat:**
  - bow: the man with his arm out, and two low at the windlass (scan 3, restyle 4–5);
  - deck: two crouching (one low);
  - deckhouse: two men, and one low at its east end;
  - aft: two low at the windlass and the poler (scan 2–3 there).
- **Moored boat:** the man leaning on the casks, and two low (one under the canopy, one at the cabin's east end).
- **Bank's edge:** two (low). They are probably t5's, below.

## What was hard or ambiguous

- **The scan's resolution.**
  - Zoom 4 shows only weave. Crew on the cargo boat are 45–70 px tall and crossed by a dozen stays, so heads, post tops,
    windlass bars and coils look alike.
  - Every figure whose head I could not separate from gear is `conf: low`, with both readings in its note.
- **Which hull is which.** Settled above:
  - the mast is drawn over the far boat;
  - the rivet rows are continuous;
  - the rudders show the bows. The rudder at 25100–25130 is the cargo boat's; the rudder blade at the waterline and the
    projecting blade are 逆水行舟's; the rudder at 26000–26105 is the moored boat's.
- **The cargo boat's waterline is hidden** behind 逆水行舟 all along. front, rear and beam_s are est at v ≈ 870–885,
  where its stem and sternpost disappear.
  - Its visible side runs about 180 px from the gunwale (v ≈ 695) to that line. 逆水行舟's side is 65 px. So it rides
    high (unladen), or it is a higher-sided boat. The builder should know this.
- **The two figures behind the deckhouse roof** (`man_with_sticks_bank_24390`, `sack_porter_bank_edge_24467`).
  - Their heads (v 467–470) are too high for the boat's deck. That would make them ~130 px tall where the crew there are
    ~62–67. So I put them on the bank's slope, feet hidden behind the roof.
  - t6 left them to "t5 or river_m". I recorded them with conf low (`support: ground`, no group). **If t5 has them, the
    merge keeps t5's and retires mine.**
- **The restyle invents here, as the setup listed.** It adds:
  - a second bowman on 逆水行舟 (on the scan, the carved stem post);
  - knots of 4–5 at both cargo-boat windlasses (the scan has about 3 and 2–3);
  - two seated men under the moored boat's canopy (the scan has one faint figure; the dark one is the canopy's post);
  - a seated person in red at its cabin's east end (a box);
  - dry ground in the river below the moored boat (u 25500–26400, v 1000–1790; on the scan it is water with ripples).
- **t7's "white-capped head at about (25555, 560)"** is the canopy's mat on the scan (zoom 3.5). The white lidded jar
  at (25430–25480, 620–657) may be what was seen; it is described in the boat's `what`.

## Water level check reading

**I can't measure one in u 23300–26000.** The bank is a wash slope everywhere (bank top at v ≈ 470–520, wash to the
hidden shore), with no vertical face, stair or quay. As in S4b's report, a slope gives only a bound:

| place | ground point | waterline | Δv | bound on H_water |
|---|---|---|---|---|
| bank west of t6's post, u 25250 | (25250, 560), where the flat bank ends in wash | (25250, 638) est, hidden behind the moored boat's bow | 78 | ≥ −1.0 (weak; the shore is hidden) |

The nearest real face is the warehouse's plank-faced platform at u ≈ 25900–26150. Its top (door sill) is at v ≈ 555–565,
and the capped posts at its foot stand at v ≈ 630 (t7). That face is river_e's to read. It would give about −0.85 m below
the platform's top, but the platform may stand above street level. **Use S4b's `supports.water`.**

**Deck heights (freeboards) for the frame:**

| boat | gunwale or deck (stroke) | waterline below | Δv | other |
|---|---|---|---|---|
| 逆水行舟, amidships | (24400, 1145), the wale | (24400, 1212) | 67 | cabin wall ≈ 110 px (v 1030–1140); roof front edge v ≈ 1000–1030; roof crew stand at v ≈ 915–975 (support `boat roof:`) |
| 逆水行舟, bow | bow deck (23640, 1068) | (23640, 1100) est | 32 | the bowman stands here |
| cargo boat, amidships | (24400, 695), the south gunwale | (24400, ~885) est, hidden | ~190 | deck crew feet at v 578–682 on its deck plane |
| moored boat, amidships | (25600, 800), the gunwale | (25600, 1008) | 208 | crew feet est at v ≈ 598–690 |

Supports used:
- `water`;
- `boat deck: S2.veh.boat_towed_mast_23632`;
- `boat roof: S2.veh.boat_towed_mast_23632`;
- `boat deck: S2.veh.boat_cargo_hooded_bow_23715`;
- `boat deck: S2.veh.boat_moored_mat_canopy_25145`;
- `ground` (the bank, and the two bank-edge figures).

## Shore points at my unit's ends (for the merge)

- **u 23300 (river_w2):**
  - `shore_n` (23300, 492) est, under the terrace's stilts (t4: their feet reach the shore at v ≈ 485–495);
  - `bank_top` (23300, 470) est.
- **u 26000 (river_e):**
  - `shore_n` (26000, 650) est, behind the moored boat's stern and under the warehouse platform;
  - `bank_top` (26000, 615) est.
- **No `shore_s`** anywhere in 23300–26000. The silk's bottom edge cuts the water at v ≈ 1776.

## Seam notes and edges (no section seam in my range)

- **river_w2 (u 23300):**
  - **豪华客船's stern** is at u ≈ 23690–23705. Its sternpost runs v 540–707, with its mat roof and cabin at
    23300–23690, v 520–890.
  - Its foredeck and crew are river_w2's, and I recorded nothing of it.
  - The cargo boat's bow touches it end to end: the stem at u ≈ 23705–23737, the arched beam from (23700, 600).
  - 逆水行舟's fender-off man (`boatman_fending_off_23688`) presses his pole on 豪华客船's stern planking at
    (23584, 748). If river_w2 reads him on 豪华客船's stern, the merge keeps one.
- **river_e (u 26000):**
  - The moored boat's stern and rudder (26000–26105, v 730–1065) overlap the west end of river_e's boat, which begins at
    u ≈ 26020–26060, v 650–1000.
  - The capped posts at 26018 and 26128 are t7's and t8's. **My moored boat's rope goes to t6's post at 25207, not to
    them.**
- **t2 (trackers):** the rope's far end names `S2.fig.tracker_lead_21867` and the group `S2.grp.trackers`. The merge
  may join `S2.grp.boat_towed_mast_23632` and `S2.grp.trackers`, or name each in the other's note.
- **t6:** `S2.prop.mooring_post_25207` is the far end of `boat_moored_mat_canopy_25145`'s rope (`rope_end`).
- **t5:** the two bank-edge figures above. 名画记 pin 16 聊天的伙计 (24280) is t5's to place. The nearest pair on the
  water is the two men in the cargo boat's deckhouse (24393, 24447), noted in the group.
- **Groups crossing my edges:** none of mine. Only the tow rope reaches out (to t2).

## Scale cues and hull axes (depth cues only, not ground edges)

| boat | waterline front → rear | length | axis slope dv/du | other cues |
|---|---|---|---|---|
| 逆水行舟 | (23632, 1100) est → (25050, 1205) est | ~1420 px | 0.07 | mast 663 px from foot (24190, 965) to top (24183, 302); window opening ~95 px; foredeck crew 120–133 px tall at foot v 893–1068 |
| cargo boat | (23715, 870) est → (25145, 875) est | ~1430 px | ~0 | crew 62–67 px tall at foot v 578–600; visible side ~180 px |
| moored boat | (25145, 935) est → (26030, 1000) est | ~885 px | 0.07 | crew ~70 px at foot v ≈ 598; side ~200 px |

For structures_w's diminution table: on the same reach, the standing crew are about 120–133 px tall at foot v ≈ 900–1070
and 62–70 px at v ≈ 580–600.

## Left to other agents (painted things I saw and did not record)

| what | where (scan px) | to |
|---|---|---|
| 豪华客船's stern half: cabin, mat roof, sternpost, the figures and windlass on its after deck | u 23300–23705, v 500–900 (figures at ≈ (23450–23480, 530–580)) | river_w2 |
| the five trackers holding the rope | u 21780–22200, v 150–390 | t2 (done) |
| sack porters and walkers on the bank above the boats | feet ≈ (24300, 417), (24455, 432), (24535, 466) | t5 / t6 |
| the eatery's tables and benches, the terrace and its stilts | u 23300–24000, v 200–500 | t4, t5, structures_w |
| the two men on the bank before the shop | feet (25333, 568), (25367, 587) | t7 (done) |
| the mooring post with its rope coils | (25207, 548) | t6 (done) |
| the scaffolded building and the 沿河雅座 hall | u 24745–26150, v 0–560 | structures_e |
| river_e's boat west end and the capped posts under the warehouse | u ≥ 26000, v 560–1000 | river_e, t7, t8 |

## Contradictions with `reference/scroll/sections.md` and the brief

- **"A boat rowed upstream by eight men"** (sections.md §2) is not what the strokes show (finding 6). The boat is
  towed, with two men poling or fending off. Unless "eight" counts all the crew, it is wrong.
- **The brief's "4–5 boats" and "small canopied boat":** 3 boats (findings 4 and 5).
- **The brief's "moored boat at ≈ 25150–25990 (v 650–1000)":** confirmed. Its stern and rudder run to 26105.

## Lessons (exact text for the skill `scroll-section`, "Mapping a section")

- **Which boat carries a mast: follow the mast down.** A mast drawn over a farther boat's planking stands on the nearer
  boat. Look for its tabernacle or partners on that boat's deck or roof. A mast stepped in the far boat would stop behind
  the far boat's own side. (S2: 逆水行舟's mast crosses the moored cargo boat's whole side to reach its tabernacle on the
  near boat's roof.)
- **One boat or two: follow a rivet row.** At zoom 3, trace one strake's rivet row along the hull through the place where
  a second boat's bow would be. A midship deckhouse with its own arched hood, or a second windlass, can look like the bow
  of another boat. (S2: the "small canopied boat" was the cargo boat's deckhouse.)
- **Read a long rope in 650-px windows at zoom 1.6.** Give a point every 100–200 px, plus the lowest sag, any knot or
  lashed toggle, and the point where it is made fast. Then join it to the tile agents' readings at the far end, and check
  the whole polyline on an overlay. The tool doesn't draw custom polylines, so put it into a throwaway part as a `line`
  just for the overlay.
- **Heads above a deckhouse roof that would be too tall on the boat's deck are on the bank behind the boat.** Compare
  their painted height with the crew's at the same v before choosing the support.
- **Boat crews at the scan's resolution.** Read at zoom 2–3 in colour, with the restyle window beside the scan
  (`scroll_inspect.mjs`, half 150–200). Give `conf: low` to every head that can't be told from a windlass bar, a post top
  or a coil, and write both readings. On a towed boat, the restyle's commonest invention is a second man beside a carved
  stem post.
