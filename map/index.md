# Scroll map index

What the map covers, section by section. The format and rules are in `README.md`. For any section, read
`text/<S>.md`: it says where everything is, in words, so you never need to open the scroll.

The scroll is read from right to left: S1 (countryside, scan u ≈ 37610) first, S7 (the end, u ≈ 815) last.
Section ranges follow 余辉's seven segments (`reference/scroll/sections.md` §2). `sections.json` is the same list for
the tools.

| Section | Scan u | Build folder | Map status | Datum (station 0) | Route |
|---|---|---|---|---|---|
| S1 郊野 · 古柳, the countryside | 29050–37610 (moved from 28700, round 2) | `sections/countryside` | built and joined, live in v1 (round 2, 2026-10-12) | S2's route point at u 29050, S2's station there | `S1.road.main` |
| S2 汴河 · 运河两岸, the canal wharves | 20500–29050 | `sections/canal` | built and joined, live in v1 (round 2, 2026-10-12) | S3's north-bank route point at u 20500, S3's station there | `S2.road.main` |
| S3 虹桥, the Rainbow Bridge | 15500–20500 | `sections/rainbow_bridge` | built and joined, live in v1 (round 2, 2026-10-12) | S4b's road centre at u 15500, S4b's station there | `S3.road.main` |
| S4 城门口外, the outer road | 9400–15500 | `sections/outer_road` (part 1, u 9400–12600) | part 1 mapped, 206 entities (2026-10-11: 65 figures, 17 animals, 3 vehicles, 23 trees, 54 props, 17 buildings); built and joined to the gate (2026-10-12, loyalty PASS) | where the main road crosses the S5 seam (station +26.05) | `S4.road.main` |
| S4b 城门口外 part 2, the outer road east to the moorings | 12600–15500 | `sections/outer_road_2` | built and joined, live in v1 (round 2, 2026-10-12); the pilot for boats and water | `S4b.road.main:lines.centre.0` at scan (12600, 1206), station +67.95 (S4's centre line there) | `S4b.road.main` |
| S5 城门, the city gate | 5600–9400 | `sections/gate` | mapped, 194 entities (pilot, 2026-10-11; loyalty pass the same day: the wings retired, the mound and the canopy added); the gate scene is built from it one for one (`BUILDING.md`, `tools/loyalty_check.mjs` PASS); its animals, carts and riders built 2026-10-12; joined with S4 and S6 on `web/world.html` | centre of the gate passage's outer (east) mouth | `S5.road.main` |
| S6 城内十字街 · 闹市, the inner city | 2000–5600 | `sections/inner_city` | mapped, 373 entities (2026-10-11: 180 figures, 19 animals, 8 vehicles, 14 trees, 85 props, 15 buildings, 7 structures, 3 roads, 42 groups); built and joined to the gate (2026-10-12, loyalty PASS) | where the main street crosses the S5 seam: `S6.road.main:lines.centre.6` = scan (5600, 1250), station −26.51 | `S6.road.main` |
| S7 卷尾 · 赵太丞家, the end | 815–2000 | `sections/city_end` | built and joined, live in v1 (round 2, 2026-10-12) | `S7.road.main` at scan (2000, 1180), station −73.63 (S6's first route station) | `S7.road.main` |

## Seams

**Round 2 (2026-10-12), the seams agreed before mapping** (`gen/expand/round2/phase0_questions.md` §3 and §5,
`tile_plan_S1_S2_S3.md`). Every new frame starts with its neighbour's knot at the seam: S4b `[12600, 31.6]`, S7
`[2000, 50.4]`; S3, S2 and S1 follow in order along the scroll once their east neighbour's frame and route exist.
- **S4b | S4 at u 12600:** see "S4 inner seam" below. The seated official at u 12700–12755 is S4b's figure inside
  `S4.bld.official_hall_12530` (floor 0.45 m, a builder choice in `blender/outer_road_scene.py`): S4b's frame carries the
  support `official hall floor`, H 0.45. Part 1's ground runs 16 m past u 12600; the lead cuts it to the seam when S4b
  joins.
- **S3 | S4b at u 15500:** the long riverside hall (roof from u ≈ 15530 to ≈ 16450) is S3's; the biggest rafted boat
  (stern ≈ 14880, bow at ≈ (15790, 670–755), its sweep blade to (15856, 893), per S3's t1) is S4b's; the willow with its trunk at u ≈ 15450–15500 is S4b's (a seam note
  for S3 about its crown); the boat under way at u ≈ 15550–15900 and its crew are S3's (pin 25). The river runs across:
  each side maps its own reach and ends its shore lines at u 15500; S4b gives its shore points there to the lead for S3.
  The 汴河's water level is measured once, on S4b's moorings.
- **S2 | S3 at u 20500:** the big boat under the arch (bow ≈ 20450) is S3's; the boat moored along the south bank (hull ≈ 19750–20650, v 1080–1220, the men waving at the big boat on its roof) is S3's (river_e) even where its stem crosses 20500; the boat moored along the north bank from
  ≈ 20400 eastward goes by its main point; the big willow at ≈ 20500–20600 is S2's; the south bank's roofs go by main
  point. S3's route continues along the north bank into S2's.
- **S1 | S2 at u 29050** (moved from 28700 so the 望楼饭铺 shed, ≈ 28250–29000, and its customers stay whole in S2):
  the boat at the bottom (≈ 28300–28750) is S2's; the village stalls from ≈ 29050 east are S1's.
- **S7 | S6 at u 2000:** see below. S7's west edge is the scroll's cut end (it is thought truncated): mist only, no
  panel. S6's ground runs 16 m past u 2000; the lead cuts it when S7 joins.

**One world.** S4 and S6 continue S5's frame (`README.md`, Frames): a seam point is the same metres in both
sections, and the route's stations run on (S5's road ends at station −26.51 in the west and +26.05 in the east).

- **S4 inner seam at u 12600 (part 1 | the rest of S4):** part 1 ends between the fortune-teller (≈ 12050–12400) and
  the palm-covered family carts (≈ 12700–13550). Crossing it: the road; `S4.bld.official_hall_12530` (mostly east of the
  seam, built whole by part 1); `S4.bld.south_hall_12350`; `S4.prop.parasol_12572` (canopy to 12635);
  `S4.tree.willow_12588` (crown to 12750); `S4.fig.child_at_table_12597` (its table east of the seam). Recorded for
  part 2, not mapped: a seated official at 12700–12755, a small boy, a big jar, a figure by the stair, a small figure
  under the parasol, the table and a drum at 12600–12700, a hanging lamp, roofs behind the pines, the palm-covered
  cart's roof at 12690–12920.
- **S5 | S4 at u 9400** (applied 2026-10-12): `S5.veh.covered_ox_cart_9800`'s front is at its shaft ox (9960, 1455);
  its team (`S4.ani.ox_shaft_9972`, `ox_far_10045`, `ox_lead_10235`) and drivers are S4's (`S4.grp.cart_9800_team`);
  the gate builder reads S4's layout for the yoke. `S5.tree.willow_clump_9392` is one clump; `S5.bld.house_9300` ends
  at u ~9462.

Neighbouring sections share their boundary strip: each section's tiles look about 150 px past its ends, and an
entity belongs to the section holding its main point. When a section is mapped, record here what crosses each
seam (a road, a cart that continues, a building cut by the boundary) and the IDs on both sides.

- **S5 | S4 at u 9400:**
  - the main road (`S5.road.main`) continues east from the bridge's east end;
  - the big covered ox cart `S5.veh.covered_ox_cart_9800` stands with its rear on the bridgehead and its front, oxen
    and driver in S4 (u 9775–9960, not yet mapped); S4 should refer to the same ID;
  - `S5.bld.house_9300` continues east; the bridge's north-east corner (est, u 9455) is hidden by the cart;
  - S4 owns: the gnarled tree at u ≈ 9445, the tree whose trunk is near u 9600, the mat awning and parasol stall
    (u 9355–9600), figures at u 9497, 9620, 9650, 9700+.
- **S7 | S6 at u 2000** (from the S6 map, 2026-10-11):
  - the main street continues west;
  - the well platform's west end (u 1955–2000), the mat awning over the 解 ring and the bar the 解 plaque hangs from
    are tied into S7's corner building (posts at u ~1918–1936); `S6.bld.far_house_1859` (west end ~1825) is S6's;
  - **the 解 sign and its ring of young men are in S6** (u 2030–2340), not in S7 as `reference/scroll/sections.md`
    §2 says; the square well (curb 2000–2205) is S6's too;
  - not yet mapped, for S7: three buckets at the well (1990, 928), (1950, 920), (1922, 995); a tub under the 解 sign
    (1973, 1741); a man with a bundle (foot 1972, 1257); the 解 building (small roof 1880–1960, big roof 1500–1830);
    a needle tree at ~1910; figures at u 1850–1900.
- **S6 | S5 at u 5600:**
  - the street continues west from the tax office;
  - `S5.bld.wine_depot` straddles the seam (its west end, about u 5400, is estimated); the third archer (u ≈ 5465) and
    the rest of the eight casks are in S6; S6 should reuse this ID;
  - `S5.bld.house_5800` and `S5.bld.house_5720` continue west; `S5.bld.back_hall_5790` may belong to 孙羊正店;
  - the sack cart drawn west by a donkey team has its front at u ≈ 5410 (S6); its pusher is `S5.fig.cart_pusher_5727`;
  - a man at u ≈ 5575 carries a pole whose load stands beside `S5.fig.roof_watcher_5712`.
  - Applied from the S6 map (2026-10-11, `gen/map/S5/merge_fixes.mjs`): the depot's five west casks
    (`S5.prop.casks_west_5525`) and the pole man's load (`S5.prop.pole_load_5645`) are S5 props built by the gate
    builder; `S5.bld.house_5800` and `S5.bld.house_5720` run west to their painted ends (u ~5140 and ~5216) and the
    gate builder builds them there; the third archer is `S6.fig.archer_waistguard_5465`, the pole man
    `S6.fig.pole_man_5578`; the sack cart is `S6.veh.sack_cart_5412` with its team (`S6.grp.sack_cart_5410`), its rear
    at the S5 pusher's hands; 孙羊正店's upper storey (S6) reaches to u ~5700 and abuts `S5.bld.back_hall_5790`.

## Facts settled by the map (don't re-litigate)

- The gate stands without walls (loyalty pass, 2026-10-11): north of the gate block only trees and bare ground are
  painted, and the mass below its east half is a mound of earth and rock with trees (`S5.grd.rock_mound_7200`), not a
  coursed wall. The user saw this on the painting itself; the gridded crops confirm it.
- The moat bridge (平桥) is on the main road just outside the gate: the passage's outer mouth (centre u ≈ 7513) is
  12.1 m along the road from the bridge's west end (u 8248), about one bridge-length (the deck is 12.4 m). The
  Rainbow Bridge (虹桥) is a different bridge, about 11,000 px further east in S3. Checked by the user on 2026-10-11.

## Open questions (for the user)

- **Far things are painted smaller** (the S6 map, 2026-10-11): figures, posts and wheels far up the silk are drawn at
  about 0.55–0.6 of the street's scale. Settled by the user the same day: everything is built at real size and only
  positions come from the map (`BUILDING.md` rule 5); far buildings keep real heights and take their frontage from
  their painted footprint. The frame stays one scale.
- **The receding direction at the S5|S6 seam:** S5 carries the gate's 58.24 west of its gate block (unmeasured there);
  S6's edges near the seam read about 51. Changing the seam knot moves S5 entities west of the gate by up to ~1 m.
- **S5's street south edge** may lie lower than v 1440 at the seam (figures seen over the south ridges stand at v
  1480–1575).
