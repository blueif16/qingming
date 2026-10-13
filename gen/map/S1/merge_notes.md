# S1 merge notes (the countryside, u 29050–37610; from the ten units' reports, 2026-10-12)

`node gen/map/S1/merge_fixes.mjs && node tools/scroll_map.mjs S1 merge` → `map/strokes/S1.json`, **237 entities**:
30 figures, 13 animals, 3 vehicles (the willow-decked sedan, the tipped barrow, the sampan), 84 trees, 26 props,
14 buildings, 8 structures, 5 roads (`S1.road.main` and 4 paths), 2 water, 44 grd, 8 groups. `check` **PASS**, no
warnings. The tool flagged no near-duplicates (same kind, < 30 px); every duplicate below was "in disguise" (two
kinds, or two units' readings of one place). The fixes are idempotent (run twice, same files). The parts as they came
from the units are in `scratchpad/S1_merge/parts_orig/`; the merge's crops (zoom 0.7–4, per-channel normalised, grey
or high-pass) and its scripts (`crop.mjs`, `prof.mjs`, `seam.mjs`) are in `scratchpad/S1_merge/`.

## The units (all `check` PASS)

| unit | owns u | entities | in short |
|---|---|---|---|
| structures_w | 29050–33000 (+ road to 33150) | 37 | 7 thatched or tiled buildings (stall shed, annex, back shed, tiled farmhouse hall and wing, thatched hut, shed on posts), 2 wattle fences, `S1.road.main` + 3 paths, 24 grd (terraced fields, the 菜地, a rock, 20 banks); no water |
| structures_e | 33000–37610 (+ join piece from 32850) | 37 | 8 buildings (five thatched farmhouses, the open barn, a far roof, a small round roof), 6 structures (fences, hedge, rail, the small bridge, posts), the join piece + the bridge path, 2 water (the stream, the pale wash band), 19 grd |
| t1 | 29050–30300 | 46 | the village stall (2 people, furniture, buffalo, ox, tipped barrow), the old man and the child, 5 far figures + far ox (all low), 21 trees (13 young bare trees in the field) |
| t2 | 30300–31100 (named: horse group, travellers) | 28 | the runaway horse + 3 chasers, the travellers (5 figures, 2 donkeys), the tomb-sweeping party (sedan, 6 figures, horse), 5 trees, a trestle |
| t3 | 31100–32100 | 13 | the party's rear porter, 5 great willows + 4 far willows + a sapling, a tied jar and a basin under the shed |
| t4 | 32100–33200 | 14 | 3 great willows, a far grove of 10 bare trees, a reed or stake |
| t5 | 33200–34300 | 19 | 11 bare trees, the farmyard (bending farmer, roller in its frame, 2 objects), a haystack, a nest, a pale bird |
| t6 | 34300–35400 | 18 | a farmer behind the hedge, a figure in the shed (low), 9 trees, 7 props (bench, plank, jar, straw, box, poles, stack) |
| t7 | 35400–36300 | 12 | 3 big bare elms, a pale grove of 7 fan-headed trees, 2 far crowns |
| t8 | 36300–37610 (named: the train, the boat) | 15 | the charcoal train (5 donkeys, 2 drivers), the sampan, 5 trees, a leaning pole |

## What the merge changed (all in `merge_fixes.mjs`, each with its reason)

1. **The road.** `S1.road.main_east` spliced into `S1.road.main` at u 33000 and dropped: structures_w's points to
   u 33000, the piece's east of it. Both units had copied the points at 32850/33000/33150 exactly, so the splice is
   clean (centre 53, edge_n 54, edge_s 51 points; point 0 (29050, 730) est, last (37240, 975) est). Its `what`,
   `vis` and `note` now carry both readings. Note added: from u 35030 to 35420 the route runs inside the south part of
   `S1.grd.threshing_floor_35225` (they share the strip; nothing separates them).
2. **Duplicates in disguise, one kept each:**
   - the pale pointed mass at the 菜地's corner: `S1.grd.rock_29745` kept, t1's `S1.prop.rock_or_heap_29745` retired.
     On zoom 2.5–4 crops it reads as a rock (texture strokes on the shaded west face, no head, hands or feet); the
     hooded-figure reading stays open for the second pass;
   - the dome behind the big farmhouse's east end: t5's `S1.prop.haystack_34080` kept (smooth dome, straight west side,
     no eave or wall), structures_e's `S1.bld.small_round_roof_34080` retired;
   - the bush belt along the farmstead fronts: structures_e's `S1.str.hedge_yard_34265` (line extended east to
     (34530, 920)) and `S1.str.fence_brush_34660` kept, t6's `S1.tree.shrubs_34385` and `S1.tree.shrubs_34735`
     retired (a linear belt is built from its foot line). Both readings (low bushes, t6; brushwood fence,
     structures_e) are in the notes; references renamed.
3. **Groups:** t1's `S1.grp.old_man_child` folded into t2's `S1.grp.runaway_horse` (the child, the man at the post and
   his post; t2 had checked only u 29900–31250), now 7 members; t3's `S1.fig.party_porter_staff_31131` joined to
   `S1.grp.tomb_sweeping_party` (9 members: sedan, 7 figures, horse). Every group lists only S1 IDs.
4. **What each side left to the other** (compared list by list):
   - the hut's great leaning willow `S1.tree.willow_leaning_hut_31240` (t3) is the "great willow" t2 described and the
     "crown over the farmhouse's east end" t1 left: crown_w → (30290, 1050) est and top → (30780, 560) est from t2;
     on a zoom-0.7 crop the trunk runs unbroken from a pollard head at about (30860–30990, 990–1120) down into the
     hollow bole, so conf low → med (second pass confirms at zoom 3);
   - the pale lump at G1's west foot (31545–31600, v 1255–1345): G1's root flare, a note on `S1.tree.willow_great_31620`;
   - the post in the hut fence's gateway (30887–30903, v 1227–1277) and the loose hurdle beside it: added to
     `S1.str.wattle_fence_31100` as `gate_post_foot`/`gate_post_top`;
   - the threshing floor's forked pole at u ~35150 (each side left it to the other): folded into `S1.str.posts_35075`
     as its east post (`post_fork_foot` (35155, 868), `post_fork_top`), with t6's open lean-to reading beside
     structures_e's posts-only reading;
   - **three crow's nests** named only in t6's tree notes became perched props, as t5's `S1.prop.nest_33900` is:
     `S1.prop.nest_34445`, `S1.prop.nest_34680`, `S1.prop.nest_34757`;
   - **the dark slope in front of the pale grove** (t7 left it, structures_e had not recorded it): added as
     `S1.grd.bank_35530` (conf low), its sharp lower edge from darkness profiles at u 35460–35640; t7's grove feet
     (v 745–775) kept and t6's lower reading (v 890–915) declined, since no trunk outline crosses the band;
   - the boat's rope now names `S1.str.small_bridge_36365`.
5. **Settled as "no entity", with a note where it sits:** the blob on the terrace bank (33439–33472, v 1034–1062) and
   the marks below `S1.grd.bank_30300` (30090–30113, v 590–627) are moss dots; t4's "bush at 33375–33450" is the west
   end of `S1.str.fence_brush_33760`; t5's "low pollard willow (33055, 1050)" is the east head of t4's
   `S1.tree.willow_burl_leaning_east_32805`; t5's/t4's crab-claw tree at 33375 is t5's `S1.tree.elm_forked_33433`;
   t7's far crown at 36300 is t8's `S1.tree.far_fan_tree_36300` (recorded once); t6's "tree with foot (35525, 890)"
   is t7's `grove_fan_35485/_35535`.
6. **Bank pairs at u 33000** (structures_w → structures_e): `bank_32445` → `bank_33300`, `bank_32905` → `bank_33650`,
   `bank_32900` → `terrace_lines_33800` (a 30 px step), `bank_32700` → `bank_south_34400` (read 30 px lower),
   `bank_32705` → `bank_south_34400.lower_band_top`. Both units stop exactly at 33000, so there is no overlap to trim;
   each line names its continuation. `S1.water.wash_band_34400` has nothing west of 33000 (note added).
7. **Possible duplicate left open:** t2's `S1.tree.far_tree_30985` (blotches at the top edge, 30955–31015) may be the
   twig ends of t3's `S1.tree.willow_far_31190`'s west limb; a zoom-3.5 crop did not settle it. Both kept, each names
   the other.

## Cross-key seam check against S2 (`map/strokes/S2.json` as of 05:46, before S2's own merge fixes; u 28750–29350)

Only two same-kind pairs are under 30 px, both expected:
- `S1.road.main` point 0 = `S2.road.main`'s last point, (29050, 730) est, edges 695 / 1000 on both sides (the datum).
- `S1.grd.terraced_fields_29450` edge_v155 starts at (29050, 152), 2 px from `S2.grd.bank_lines_top_28900` edge_n's
  end (29050, 150): one stroke, already cut at the seam on both sides.

Seam notes for S2 and the lead (S2's side; S1 does not edit S2's files):
- `S2.grd.bank_lines_top_28900`: its lower line (edge_s) ends at (29050, 192) est, but its note says the stroke runs to
  (29073, 192); S1 has no line there. S1's `edge_v57` runs on west of the seam to about (28960, 58), where S2 has no
  line.
- `S1.tree.willow_burl_29090` (base (29090, 1782) est, S1's; S2 t12 reads (29070, 1785) and did not record it): its
  crown runs west over S2 to u ~28585, and its knobbed limb (28720–28880, v 1283–1450) reaches over
  `S2.veh.boat_bottom_28395`.
- `S1.tree.willow_stall_a_29178` (base (29178, 632)): its whips hang west over `S2.bld.wanglou_shed_28660`'s roof to
  u ~28800.
- `S2.prop.bench_29030` (29008–29052) is S2's and not part of S1's stall (S1's furniture starts at 29267).
- No building crosses the seam (the 望楼 shed ends at 29025–29040, S1's first roof starts at 29262), and the 汴河's
  shore turns south at 28935–28968, so no water crosses it either.

## For the lead (decisions the strokes can't make)

- **The charcoal train's direction** (t8): D4's pricked ears and D2's and D3's lowered heads are at their east ends,
  so as painted the train walks south-east toward the bridge's east end, against 赶驴入城 (into the city, west), the
  brief and the restyle. This decides its routine in `people.json`.
- **Water or ground** (the ground pilot, for the user): structures_e takes the PALE band (33000–36000, between the
  bank feet and the near bank) as water, `S1.water.wash_band_34400`, conf low; structures_w and t4 lean to the DARK
  band (v 1450–1600 from 32850) being the water, or neither. Water is certain only round the bridge.
- **The 菜地** (pin 5): t1 records 13 young bare trees (90–180 px); structures_w's field describes 25–35 small plants
  (30–70 px) in 3–4 bands. Crop or grove of saplings is the user's call; the count is the second pass's.
- **The route** is a reading through unpainted ground at two bends (30400–30720 south, 32300–32850 north) and
  behind the big bare trees (35250–36190); `station_range` will be odd round the bends.
- **Pose words** `running` (3 chasers) and `galloping` (the runaway horse) are not in `map/README.md`'s list; they
  were kept as painted. Please add them, or say which listed word to use.
- **The party** has one rider; he, his horse and the porter with the boxes face east while the sedan goes west; both
  travellers' donkeys face east too. Recorded as painted (t2).

## For the frame step

- **Datum:** `S1.road.main:lines.centre.0` = (29050, 730) est, exactly `S2.road.main`'s last point; its station comes
  from `sections/canal/layout.json` (not written yet).
- **Knots:** no ground-level receding edge anywhere in S1. Hold S2's knot at 29050. Candidates, both weak: the
  farmhouse hall's west hip (29976, 1050)→(30080, 925), slope −1.20, dx ≈ 43, eave level, conf low (structures_w);
  the stream's west-bank waterline (36125, 1058)→(36030, 1255), slope −2.1, dx ≈ +24, conf low (structures_e).
- **Supports used:** `ground` (216), `animal S1.ani.<id>` (3 riders), `stream` (the boat, the stream, the wash band;
  the bridge's bays via `support_by`), `perched: S1.tree.<id>` (4 nests and the pale bird), `bank slope` (t7's two
  elms on the stream bank). The stream: H ≈ −0.7 m (−0.5 to −0.8), from the deck edge and the post feet straight
  below at u 36540 and 36352 and the west bank (structures_e). Nobody stands on the bridge.
- **Stepped ground:** every band is a bank one step higher to the north (35–90 px in the foreground, 5–20 px far up).
  The hut and its fences stand on `S1.grd.bank_30750`'s top, the shed on `S1.grd.bank_yard_31390`, the great willows
  G1–G3 on the willow dyke `S1.grd.bank_31660` (about 45 px over the route along its foot). All are `ground` now; if
  the frame gives `bank top` an H, apply it to them together (t3 asked for it on the four great willows).
- **Diminution** (structures_w, t2, t8): foreground travellers 171–189 px at v 1476–1627 (1.8× S4's road figures);
  140–146 px at v 1100; 103–115 px at v 540–650; 88–97 px at v 400–450; 37–45 px at v 141–145; the rear charcoal
  driver 94 px at v 925. The party's porters high up (v 330–540) are as large as the drivers at v 925: not one curve.

## Second pass: four fresh agents, about 2100–2200 px each, on the tile boundaries

| id | range (u) | holds | read first (flags in the notes) |
|---|---|---|---|
| `west` | 29050–31100 | t1, t2; most figures | the rock or a hooded figure (`S1.grd.rock_29745`); the shape in front of the man at the post and the dark mass on the post (`S1.fig.man_at_post_29812`); the field's plants, trunk by trunk (13 trees or 25–35 plants); the 5 far figures and the far ox (all low) and the blob at (29300–29315, 117–127); the stall man's possible third head; the slats above the counter (29437–29490, v 553–597: goods or lattice, no entity); the stem at (29963–29973, 1290–1317); the fans at the top edge 30170–30320, v 20–70; the diagonal (30200, 230)→(30550, 390); `far_tree_30985` against `willow_far_31190`; the hut willow at zoom 3 (u 31000–31320, v 1100–1490) |
| `willows` | 31100–33200 | t3, t4 | the great willows' feet (G3 at 31910, A and B at 32448/32620); B's roots or a rock (32700–32845, v 1540–1605); the far grove's est feet; `S1.prop.reed_or_stake_32882`; the wash bands under the willows (water or ground) up to u 33000; the far willows and the sapling at the top |
| `farms` | 33200–35400 | t5, t6 | the hump at 33400–33540 (stack, fence or thatch); the hedges (bushes or brushwood); `S1.prop.haystack_34080` (stack or a small shelter on a post); the roller or a man with a wheel (`S1.prop.roller_frame_34158`); the bending farmer and the yard objects (hens?); the pale bird; `S1.str.posts_35075` (frame or lean-to) and the figure under it; the far roof and the long farmhouse's roof material; the trees' crossing stems |
| `start` | 35400–37610 | t7, t8 | each donkey's facing (D1 and D5 end-on); the faint west driver; the boat's bow and whether it floats; the stream's and the pale band's extents; the pale patch with contour strokes at 35907–35980, v 840–900 (ground mark?); the crossing trunks of the three bare elms; `far_fan_tree_36300`'s base; the leaning pole |

## Lessons (exact text for the skill `scroll-section`, "Mapping a section", step 2)

- **In the countryside, duplicates in disguise change kind.** The same strokes came back as a grd rock and a prop
  (S1 29745), a building and a prop (a dome: a small roof or a haystack, 34080), and a structure and two "trees" (a
  bush belt: a hedge or brushwood fence, or hedge shrubs, 34290–34830). The tool's near-duplicate check compares one
  kind only, so for every "left to" pair also compare across kinds by place, and keep the record whose geometry the
  builder needs (a line for a belt, base corners for a rock).
- **Make one rule for a recurring small thing across tiles.** One tile recorded a nest as a perched prop, the next put
  three nests in its trees' notes: the merge made all four props. Decide such cases (nests, birds, moss dots, silk
  creases) in the tile brief.
- **A thing each side left to the other is common where a shed meets open ground.** The forked pole on the threshing
  floor was "a prop" to one unit and "the shed's post" to the other; nobody recorded it. Settle it on a crop and give it
  to the entity that holds its neighbours.
- **A wash band's edge is a darkness profile.** Where a unit names a ground band that nobody recorded, take its sharp
  edge from column profiles (mean grey of 16 px columns in 10 px bins, blurred 1.5 px): the light step gives the edge
  to about ±5 px, quicker and steadier than reading it by eye on faded silk.
- **When the structures unit is split and both halves stop their ground lines at the same u, there is nothing to
  trim:** list the pairs and let each line name its continuation, so the builder can join them.

## Second pass and frame (the frame agent, 2026-10-12)

`node gen/map/S1/merge_fixes.mjs && node tools/scroll_map.mjs S1 merge` → **244 entities** (30 figures, 13 animals,
3 vehicles, 87 trees, 27 props, 14 buildings, 8 structures, 5 roads, 2 water, 47 grd, 8 groups), `check` **PASS**, no
warnings. Then `scratchpad/S1_frame/mkframe.mjs` → `map/frames/S1.json`, `scroll_map S1 all`, `map_layout S1`.
`merge_fixes.mjs` stays idempotent: run twice it gives the same parts, and rebuilt from the units' original parts
(`scratchpad/S1_merge/parts_orig/`) it gives the same parts as the run on the current ones (checked after every edit).
New entities go to `parts/second_pass.json`. Scripts and crops: `scratchpad/S1_frame/` (`vet.py` checks every
proposal's `was` values and note strings against the map; `coincide.py` lists ground lines drawn on a water's shore;
`seamcheck.mjs`; `strips.py`; `v_*.jpg` the frame agent's own crops).

### The second pass: 50 proposals, all accepted (section 8)

Every `was` value and every replaced note string matched the merged map. The frame agent re-read the key crops: the
indigo inverted V at the threshing-floor shed, the line at the boat's east end, the fans at the top edge over
30150–30350, the fourteenth stem, the pale far willow's fan and D1's lowered head.

- **west** (4 new, 13 changes): new, all low: `S1.tree.young_bare_29968` (the 菜地's fourteenth trunk, paired outlines on
  column profiles), `S1.tree.far_tree_top_30297` (the far tree t1 and t2 each left to the other),
  `S1.grd.banked_fields_30400` (far field banks at v 303/334/364 and the measured diagonal; the straight diagonal in
  `field_30430`'s note has no stroke under it), `S1.grd.far_slope_30950`. The far terraces get five missing lines, two
  extended, two moved 8–17 px onto their strokes. `young_bare_29655`'s foot moves 60 px down to its drawn foot;
  `field_30430`'s ridge drops 8–14 px east of 30370. Settled: the 菜地 is 13 trunk feet plus the faint fourteenth (its
  `what` now says so); the rock is a rock (the hooded figure is dropped, and so is "(or a hooded figure)" in its name);
  the man at the post has no second figure and nothing hangs on the bar; the hut willow is one leaning tree;
  `far_tree_30985` is a far shrub, not the far willow's twig ends (both kept; `willow_far_31190`'s note says so); the
  slats over the counter are the shed's lattice.
- **willows** (4 changes): the hut willow's base to the bole's drawn lower edge (31215, 1492, est); a stump reading
  for the far sapling; the rear porter's tool is a plain staff (group note and porter); B's knobbly lobe is its roots.
- **farms** (2 new, 11 changes): new, low: `S1.tree.far_willow_34995` (the pale fan converges on its own point) and
  `S1.grd.floor_behind_yard_34285` (the roller's ground, left by each side to the other). A duplicate in disguise
  across kinds: `S1.str.posts_35075`'s east post and `S1.fig.figure_in_shed_35108` are one indigo inverted V with no
  shaft to the ground: the figure is kept, the post point dropped (`post_e_top`), and the structure's line now runs
  from the west post to the forked pole (its `what` and name rewritten). The post named only in the farmyard group's
  note is `S1.bld.farmhouse_thatched_33955`'s SE corner post (se corner, a bay, `post_se_top`); t5's "small shed" is
  that house's east hip end (the group's and `yard_object_34170`'s `what` follow). `farmhouse_thatched_34600`'s
  ridge_w moves 45 px off an elm stem. Notes: the hump is not a stack (fence or roof stays open), the dome has no post,
  the long farmhouse's roof leans to tile, the yard's hedge is bushes.
  - **The two self-naming notes, accepted in a corrected form.** Their cause was `renameRefs`, which rewrote the
    MERGE notes of the very entities that took over the retired IDs. `renameRefs` now skips its target, and the
    mangled text is restored to the merge's own words (rather than the pass's "(retired; " wording, which a rerun
    would have doubled). `noteOnce` also no longer re-adds a MERGE note that a second-pass `replace_in_note` has
    rewritten (the bridge's and the man at the post's), which kept the file idempotent.
- **start** (1 new, 15 changes): new, low: `S1.prop.mooring_pole_36444` (a vertical line 60 px long that stops 40–60 px
  under the nearest bridge post: a pole in the stream bed, not a rope to a post; the boat's `what`, its note and the
  bridge's note follow). D1 is a side view, head (36340, 792), facing 330; the faint west driver is a figure (conf med)
  holding a stick over D1; the group's note records the train's direction as painted (east). Extents from column
  profiles and measured seals: the near bank and the stream's south shore to ~37250, `spit_36225` to its tip at
  (36815, 1433), the shoal from 35790, the pale band's north shore at 35500–35780 on the lowest stroke (~1390), the north
  bank's foot between the seals to ~37560, the east spit to the seal at 37355, `bank_37050`'s foot on its lowest wash
  layer (918–978). The road's est east end runs on to the seal's edge at 37390. `slender_bare_37018`'s base moves to
  its trunk's centre. The frame agent also moved the pale band's last two shore_s points onto the near bank's new top so
  it meets the stream's shore_s at u 36000. Declined in part: `bank slope` for the two trees on `bank_37050` (that bank
  rises above the road; the frame's `bank slope` is the stream bank's face).

### The frame step (section 9)

- **Datum:** `S1.road.main`'s point 0 on all three lines is copied from `S2.road.main`'s last points on every run; the
  centre (29050, 730) is S2's measured point (S1's est flag dropped). Station +314.87 (`sections/canal/layout.json`).
- **The hut willow's knock-on:** edge_n gets (31150, 1500, est) and (31250, 1500, est) at the bole's foot.
- **The trunks in the road strip** (farms, for the lead): a note on `S1.road.main`; the lines are kept as read.
- **Ground lines on the water's edge stand on the water** (as S2's frame set its banks' shore lines): `support_by
  {bank_foot: stream}` on `bank_36900`, `bank_36060`, `dyke_36380` (their feet are the stream's shore_n) and, with the
  pale band's water reading, `bank_33650` and `bank_35200`; the four land tongues and the shoal take `support: stream`
  (both edges waterlines). The near bank's top stays on the ground (the water lies 1.05 m north of it, the slope
  between).
- **Cross-key seam check against S2** (u 28750–29350, `seamcheck.mjs`): no same-kind pair under 30 px; no line overlaps
  in u across the seam. `S2.grd.bank_lines_top_28900`'s edge_n ends at (29050, 150) and S1's `edge_v155` started 2 px
  off at (29050, 152): one stroke split at the seam, so S1's first point now takes S2's exactly (copied on every run).
  The route's three points are equal. Seam notes for S2 are in the frame's questions (S2's unrecorded curved field line
  (29000, 81)→(29050, 106); its edge_s end at (29050, 192, est) with no S1 line; S1's edge_v57 runs west to ~28960).
- **The frame** (`map/frames/S1.json`): S5's origin and scales, one knot `[29050, -51.6]` (S2's dx at the seam, held to
  the silk's end: no ground-level receding edge is painted in S1), supports `ground` 0, `water` −0.7 (copied from
  S4b; the 汴河 does not reach S1), `stream` −0.7 (measured at the bridge: deck edge over the post foot, 52–58 px),
  `bank slope` (an `H_profile`: −0.38 and −0.59 from where the two big elms' feet sit on the west bank's face), four
  `perched:` keys (nests and the pale bird at their trees' depth) and the three riders' animals (H 0). 25 real-size
  checks, 11 questions.
- **Layout:** `painted_area` west corners (267.21, −4.39) and (290.62, 30.54) equal S2's east corners; the route runs
  from station +314.87 to +442.58 (127.7 m), stations increasing.
