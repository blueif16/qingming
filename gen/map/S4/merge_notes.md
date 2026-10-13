# S4 merge notes (part 1, u 9400–12600), from the agents' reports, 2026-10-11

Five agents (four tiles of ~800 px, one for structures, roads and water), brief `gen/map/S4/brief.md`.
Cross-tile fixes are applied by `gen/map/S4/merge_fixes.mjs`; this file says why.

## t1 (9400–10200), 45 entities
- Seam note for S5.veh.covered_ox_cart_9800 (for the lead): body front panel u ≈ 9688 (v 1240–1320), footboard to
  u ≈ 9750 (v 1280–1307) with the seated driver's feet on it; ground under the body front est (9690, 1415) near side,
  (9720, 1370) centre. One shaft visible: leaves the chassis (9690, 1313), along the shaft ox's back
  (9740, 1315) -> (9880, 1308); front ends hidden, est at the yoke (9960, 1325), ground under them est (9960, 1455)
  (the shaft ox's fore hooves 9947/9997, v 1458–1466). So the cart's `front` should be (9960, 1455, est), not
  (9800, 1415, est). Yoke not clearly drawn: a tangle of collars and ropes over the oxen's necks (u 9950–10010,
  v 1320–1390), tassels (10022, 1397), (10081, 1395); yoke est (9965, 1330). Rope traces from the chassis front
  (9690, 1335) to the shaft ox's rump (9776, ~1360), knotted ends at (9727–9740, 1353–1370); long traces to the lead
  ox. No second wheel visible; an upright oval woven thing at u 9690–9760, v 1195–1310 behind the seated driver
  (rolled front blind or round hamper) belongs to the cart's `what`. Near wheel re-measured: rim u 9464–9637, hub
  (9543, 1328), contact est (9545, 1415) (S5 has 9548, 1422).
- Team: shaft ox (fore 9972), far-side ox (fore 10045), lead ox on long traces (fore est 10235, forelegs hidden by
  the south roof: kept in t1 with the team), seated driver on the shafts (support `vehicle S5.veh...`, ~0.9 m),
  walking driver 9902, leader with nose ropes 10050, man striding west with a stick 10148 (med).
- Willow clump: no second clump east of 9450; every whip converges at u 9390–9470 at the silk's edge. Seam note:
  S5.tree.willow_clump_9392 `crown_e` about (9745, 1500) instead of (9600, 1420).
- Edges: pig_10185 belongs in t2's S4.grp.pig_herd_10236; the dark horse is t2's horse_rider_10205, its foreleg hoof
  measured (10197, 1163); the monk (≈10208) is t2's.
- New supports: `vehicle S5.veh.covered_ox_cart_9800` (seat ~0.9 m), `gate hall floor` (temple gate base ~0.5 m).
- Incident: the shared scratchpad; t1's script was overwritten by the S6 t1 agent's, and t1 ran it once by mistake,
  rewriting gen/map/S6/parts/t1.json with that agent's own content (the S6 agent rewrote it a minute later). Tell the
  lead.

## t2 (10200–11000), 53 entities
- Second covered ox cart `S4.veh.covered_ox_cart_10550`, seen from behind heading north-east: two legible oxen
  (shaft ox_shaft_10712, lead ox_lead_10872 on traces), maybe a third (curls at u 10562–10630, v 985–1020: unresolved).
  Four men with it. Wheel rim u 10475–10534, top v 1103, bottom hidden (>182 px); hub est (10505, 1195).
  DEPTH: roof's south eave (10429, 1130) -> (10561, 1030), slope −0.76; shaft ox's hoof line (10578, 1203) ->
  (10712, 1135), −0.51.
- The two tall boxes are sedan chairs (轿), carried west (bottoms ~25 px above the bearers' foot line); six figures.
- Rider with a conical hat and a dark round fan on a horse going west, a groom at its head.
- Pigs: 4 in all (3 here + t1's pig_10185). Three pack donkeys with dark lumpy loads (charcoal?) at a thatched stall.
- Low conf: `prop.mat_canopy_10555` (stall shelter or a parked covered cart end-on), the stall shed (may be a
  structure), a bench at (10945, 1712).
- Edges: ox_leader_11017 (t3) joins S4.grp.covered_ox_cart_10550. The gnarled trunk mass u 10895–11080: t2 holds the
  west stem (tree.gnarled_10950), t3 the east (tree.willow_stem_11020, low conf): one tree or two?

## t3 (11000–11800), 40 entities
- Soldiers: 5 here (lying 11430, dozing 11488, squatting behind the box 11580, bearded 11640, hugging his knee 11792).
  Only one big document box (+ maybe a small one under the lying soldier's head). 4 spears at a stake palisade.
- Porters group (u 11000–11240): porter with two hatched bundles on a pole, a half-hidden man, a youth lifting a tied
  bundle (faded; other reading: a man in a dark cape).
- 8 pieces of furniture under the south eave; a figure in a doorway (11738).
- The forecourt is a bank above the road (willow roots drop v 705 -> 790): structures agent.
- Restyle inventions not recorded: a child at the soldier 11792, a figure at the roots, a wheel, a bush where the
  white horse lies.
- Notice on the gate: a pale sheet with 2–3 columns of tiny illegible marks.

## t4 (11800–12600), 35 entities
- Soldiers: 2 here (slumped 11885, faint 12022 curled over a lidded box), so 7 with t3's, not nine. A dark upright at
  11926–11950, v 642–710 read as a root (maybe a small figure: check).
- White horse lying in the yard behind the gate roof, u 11817–11945, v 180–265, head west (conf med).
- Fortune-teller's stall: awning, long table, stool, 3 signboards (看命 clear; 神課; 決□), fortune-teller, a client,
  6 onlookers; a possible figure at the back (12382, low).
- Courier props east of the gate: one pole with a furled dark banner, a red shaft (spear or pennant), a small dark
  cone on the gate's east post.
- Inner seam at 12600: the parasol (canopy 12413–12635, foot est 12572), willow_12588, a child (foot 12597) reaching
  onto a table in the next part; the south row's hip roof (12100 to past 12750); the compound building east of the
  big willow (u 12530–12750) with a stair and a dark doorway; things east of 12600 for the next part.
- Low conf: a stick on the road (maybe a rut), a slatted crate at the stair foot, the long wedge by the seated man.

## structures (whole area), 28 entities
- Road lines all est (no edge drawn); centre starts at (9400, 1370, est) = the datum; edge_n starts at the bridge's NE
  corner (9455, 1168, est), 35 px east of S5's last edge_n point; edge_s starts at S5's (9400, 1575); between u 9640
  and 10160 the open ground runs off the silk's bottom edge.
- Receding edges: steep at ground level (tables −1.4 to −2.0, the ditch's end −1.6), the big south hall's ridge and
  eave −1.28/−1.61 (re-measured by the lead), shallow high lines east of 11600 (−0.56 to −0.61). The frame's knots:
  map/frames/S4.json.
- Seam note S5.bld.house_9300: roof ends at about u 9462 (tiles v 50–102, eave v 100–102, upper hip area 9340–9460 at
  v 25–52); last post at 9455 (v 100–115, feet est v 152), perhaps shared with S4.bld.house_9590 (whose west barge
  (9502,72)->(9400,107) overlaps it); posts 9262/9283/9365 match S5's; se about (9458, 152, est). Moat bridge NE
  corner: nothing of the bridge shows east of u ~9340; (9455, 1168) stays est.
- Lead's checks of the "left to" lists (crops look/lead_c_*.jpg): the third parasol is the light one listed twice; the
  counter in house_9590 is part of the house; the stake at 11855 is the banner frame's pole; the plank board above
  forecourt_edge_11390 is part of it; south_hall_12350's "table 12480–12560" is its stair rail (the table is east of
  12600, part 2); the nest at 11063–11085, the gabled shape behind the awning and the low roof in front of the doorway
  are crossing branches at zoom 3 (not recorded).

## second pass (two agents, second_pass/west.json, east.json)
- Accepted: S4.fig.child_in_arms_10430 + S4.grp.person_with_child_10430 (support `carried in arms`, H 0, as S6's
  `shoulders`); S4.tree.behind_house_9640 (low); S4.fig.figure_under_eave_11382 (low); S4.str.stair_or_roof_end_11755
  (low); S4.ani.bird_12433 (low; support `perched`, 9.5 m).
- Part of a building: the "small bush" at 10296 is the south hall 10330's railing end post (note on the hall).
- Declined: S4.bld.roof_corner_top_11270 (the lead's crop shows willow whips at the top edge, no tile rows it can
  confirm); S4.prop.staff_or_rolled_mat_12588 (held against the seated man's knee: part of his figure).
- Misreads fixed: the two ox heads of S5's cart's team (each one ox too far west); the red pole's foot (measured
  (11933, 714): the "dark upright" t4 left as a root); the gate's west column at u 11585 (gatehouse sw/nw and the
  wall's se/ne moved 25 px); the wording of man_behind_roof_11165 (no roof in front of him).
- Soldiers: still 7 (the hunched mass is one hooded figure plus the red pole's foot). The scholars' nine may count
  the two carriers of S4.grp.porters_11100.
