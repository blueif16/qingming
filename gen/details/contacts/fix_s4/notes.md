# Fix S4: contact fixes, pilot on outer_road (details pass, agent "fix-S4", 2026-10-13)

Brief: `gen/details/brief_contacts_fix.md`. Measurement record: `gen/details/contacts/notes.md`.

## Log

- 01:40 PDT: started. Read the brief, plan.md, the measurement record (notes, summary, outer_road.json), the tools
  (contact_check, joint_tracks, people_dump, place_predict, owners_index, three_node), contacts.json and its
  generator, map/BUILDING.md, the skills (characters, web-scene "Before shipping", scroll-section "Machine
  resources"), S4's people.json (written by gen/sections/outer_road/make_people.py) and build_choices.json.
- Before: S4 outer_road 64 people, 28 failing, 56 FAILs (summary of 2026-10-13T08:27 UTC).
- Messaged 3d-director-04: when and with which exporter state may outer_road be rebuilt and exported; engine
  patches to follow. Replies reach the lead session; asked them to append to `fix_s4/from_perf.md` too.
- Reply from 3d-director-04 (via the lead; `from_perf.md`): outer_road may be rebuilt and exported today with the
  exporter as it is in the tree then (cells.mjs may have landed: same nodes, names, materials, triangles). Message
  04 just before the export and when done. Engine patches: send exact diffs (file, old, new); 04 lands them. After
  the export: `owners_verify.mjs outer_road`, and show the predictor agrees with a fresh dump.

## Tools (built in this pass)

- `tools/contact_check.mjs`: now a module too (`setup()`, `checkPerson()`, `ruleOf()`; an IK variant `<clip>~<v>` takes
  its base clip's rule unless listed); `--predict` places the static figures, animals and riders from the current
  `sections/<s>/people.json` (`tools/place_predict.mjs predictDump`) and writes to `gen/details/contacts/predicted/`;
  animal point-to-mesh distances use per-triangle boxes (an animal figure 109 s → 17 s in the solver).
- `tools/contact_solve.mjs <section> <ids|--failing> [--max 0.6] [--yaw 30] [--at dX,dD,f] [--write]`: grid + pattern
  search of nudge and facing minimising the contact cost (judged by checkPerson on predicted placements);
  `--write` records into `sections/<s>/contact_fixes.json` (base_nudge/base_facing = the casting's, so reruns are
  idempotent). Cost weights: contacts' squared excess (x1), furniture x20, body/site/foot x10, move 2e-4 (a first
  weight of 0.02 on the move made the solver stop 1-3 cm short of PASS: measured on the bearers).
- `tools/contact_fixes.py`: applies `contact_fixes.json` in the casting script (S4's `make_people.py` calls it last;
  the gate, with no script, runs it in place).
- `tools/ik_clip.mjs` + `characters/ik_variants.json` + `tools/character.mjs` clip source `ik:<base>@<variant>`:
  two-bone arm/leg IK and hips pins in the page's root frame (the model loaded by people.js loadCharacters);
  `tools/lib/body_sites.mjs` (the joint tracks' site code, shared; joint tracks identical after the move: 11472
  values, max diff 0).
- `gen/details/contacts/fix_s4/tools/ik_verify.mjs` (base vs variant sites), `pose_svg.mjs` (stick-figure sheets, no
  GPU: `fix_s4/pose_*.png`).

## S4 fixes so far

- Rules (`make_contacts_json.py`): `lift_pole` has no contact (the youth's pole is his own carried prop, wanted);
  `push` palms on the vehicle's surface (a bar where it has one, a cart's tail where not); `sedan_carry~pole_ends`
  (palms only); variants fall back to their base clip's rule.
- Sedans (builder `outer_road_scene.py` + kit `sedan_chair(pole_fit=)`): the two chairs' poles meet at u 10725 over
  the middle bearers; pole ends fitted: 1.44 m over the ground under each end (shoulder top 1.402 in
  sedan_carry~pole + radius 0.038), the west chair's front ends 1.22 m (the front bearer's hands). Rods now: west
  chair 22.715→25.798 at 1.212→1.458, east chair 25.789→29.625 at 1.457→1.432 (abs H).
- Bearer variants built (`flock` charbuild): `sedan_carry~pole` (shoulder_R pinned at x 0.048 y 1.402 via the hips,
  feet kept; palms on the pole line 0.05 off the axis; residual 0), `sedan_carry~pole_ends` (hips pinned across at x
  0.112; palms on two lines 0.465 either side at 1.22 from 0.25 m ahead). Stick sheets `fix_s4/pose_bearer_*.png`.
- Bearers solved (predicted PASS): straining [0.09,-0.33] f178, man_behind [0,0.2] f182, east [0.15,0.54] f177; the
  front bearer [1.26,-0.70] f0 (0.74 m from the casting spot, over the 0.6 m limit, reason recorded: his role is the
  map's, between the pole ends; outside the ends his body touched the dark horse's rump).
- Recasts: groom_10420 bridle → idle (holds the reins at his waist, painted not touching the horse);
  onlooker_cap_12040 lean_wall → stand_sleeves (new idler clip from:farmer/stand_sleeves; arms folded, nothing behind
  him); fortune_teller_12232 tell_fortune+sit → write (new clip from:official/write; the tell_fortune take leans back
  with the hands at the chest: `fix_s4/pose_fortune_teller_tell_fortune.png`).
- Seated pair: the fortune-teller recast to `write~table` (from:official/write, both palms held on the table top,
  `table_palms`), standing 0.15 m north of his painted foot (it lay on the table's edge) on his own stool, refitted
  under his seat point (top 0.44); the table's top 0.83 m over the ground where he sits (fitted to his reach). The
  client `listen~table` (forearms on the table, hands laid flat: `table_forearms`, a new `via: hand` op), on
  `S4.prop.stool_12132`, moved 0.55 m east under him (build_choices.json moves), top 0.41.
- Solved (contact_solve): awning_stall_man (off the goods counter), soldier_behind_box (off the box), basket_leaner,
  onlooker_hat (out of the awning pole).
- IK per figure (`tools/ik_targets.mjs`, rest-point targets from the geometry at the solved placement, within the arm's
  reach, natural elbow when far): groom_rider (bridle), ox_leader_10050 (bridle, carter), bearded_man (browse; the
  painted left hand only, rule `browse~bearded_man_10142`), man_cart_tail (push), ox_driver_10635 (push_flank), the
  child at the table (reach; can't reach, see below). The rider's `ride_fan~steady` (the take's tail sank 0.19 m).
- The cart driver `ox_driver_seated_9815`: drive_cart only, on the S5 cart's driver's plank with `root_h` 0.70 (P2).
- Builder: S4 halls' floor boards collide (the walkable top was 4.5 cm under the visible boards: the shopkeeper's
  sole 8 cm inside); the soldier's stool 0.435 (fitted to his sit).
- Measurement fixes: `closestOnTri` returned NaN on degenerate triangles, which made `World.nearest` and the animal
  soup miss the true nearest triangle (a basket's palm target "nothing within 0.8 m"); inside-an-animal judged by three
  rays (two odd of up, down, east); the solver prefers placements 5 mm inside the tolerances (a solve at 0.030 read
  0.031 on the page) and keeps 0.23 m x scales between bodies and a root 0.15 m off an animal's real-size body (a groom
  had been solved 0.2 m into his horse).
- Shared hips arrays: gltf-transform dedup made each IK variant share its base clip's hips accessor; people.js adds
  `k` in place, so the base moved with its variant's grounding (idler push would have sunk 3 cm everywhere). Fixed in
  `ik_clip.mjs` (own hips track) and guarded in people.js (P1's WeakSet).
- Engine (`engine_patches.md`): P1 (clip `sole_m`/`seat_m`) and P2 (`root_h`) landed by 3d-director-04 and verified
  (clip_ground converged: 0 of 342 clips off by > 5 mm as the page draws them; joint_tracks keyed on people.js now).
  P3 (visible-floor grounding) landed, broke 73 Rainbow Bridge deck figures (nocol steps, hidden ramp), withdrawn and
  reverted. P4 (seam re-grounding) described.
- Exports: outer_road twice (04 told before and after each), owners_verify MATCH, loyalty_check S4 PASS, KTX2 PASS.
- 03:35 page dump after the revert: S4 64 people, 1 failing (child_at_table_12597: S4b's table stands on S4b's
  ground inside S4's south hall plinth, its top 0.40 m over the floor the child stands on; an S4b builder item). All
  sections: 807 people, 260 failing, 527 FAILs (before: 343 / 694). place_predict 690/694 within 1 cm (the 4: P4).
- Lead/04, 03:40: P3 reverted (the predictor is back on hooks.ground; `engine 'visible'` keeps P3's rule for reference).
  The Rainbow Bridge's hidden-ramp figures were fixed in data, not in S3's builder (04 agreed):
  - 21 get `root_h` (`contact_solve.mjs --root-h`), the 3 two-tread stances a nudge under 0.3 m;
  - all go through `sections/rainbow_bridge/contact_fixes.json`, applied by its make_people.py (its summary print now
    tolerates figures without a nudge), and people.json is copied to web;
  - seated_man_cap_18282 is left on the ramp: root_h sank his seat 12 cm into his bench, so S3's fixer fits the bench.
  - Fresh dump: 23 of the 24 pass the deck checks (hidden_collider, stance, furniture), rainbow_bridge hidden_collider
    24 → 1.
- P4 sent as an exact diff for review (`engine_patches.md`).
- After stills: `fix_s4/stills/before_after.jpg` (left: before, right: after; the fortune-teller front and side, the
  sedans side and front, the ox pusher, the cart's tail).
- Regression `regress.sh fix_s4` (start=0):
  - world 211/211, boats 12/12, rides 5/5;
  - people: FAIL only on "nobody went round the player" at the gate (X 7 / X -8), as in baseline, r2_final and
    b2_loading_final before this pass; sizes 0 adults shrunk;
  - contacts REPORT: 807 people, 247 failing, 483 FAILs.
- loyalty_check S4 PASS, owners_verify outer_road MATCH, ktx2 check PASS.

## Result

S4 outer_road on the page dump: 64 people, 28 → 1 failing, 56 → 1 FAILs. Per class, before → after:

| class | before | after |
|---|---|---|
| contact:vehicle | 16 | 0 |
| contact:animal | 8 | 0 |
| contact:table | 7 | 1 |
| contact:seat (no seat) | 5 | 0 |
| stance_soles (clip) | 4 | 0 |
| furniture | 3 | 0 |
| contact:floor | 3 | 0 |
| contact:floor (clip) | 3 | 0 |
| stance_soles (placement) | 2 | 0 |
| body_cylinder | 2 | 0 |
| contact:ridden | 1 | 0 |
| contact:wall | 1 | 0 |
| site_inside | 1 | 0 |

The one left is `child_at_table_12597` (reach~, palm_L 0.098): S4b's table stands on S4b's ground inside S4's
south-hall plinth, its top 0.40 m over the floor he stands on (`fix_standard.md` rule 7). All eight sections: 343 → 247
people failing, 694 → 483 FAILs, from P1/P2, the rule corrections and the bridge's root_h.

## Rollout: what each section needs (`fix_s4/rollout_table.md`, from the fresh dump; figures per fix class)

| fix | city_end | inner_city | gate | outer_road | outer_road_2 | rainbow_bridge | canal | countryside |
|---|---|---|---|---|---|---|---|---|
| lean/table: recast or solve+IK | 1 | 8 | 18 | 1 | 6 | 28 | 7 | 2 |
| seat: build or nudge onto | 1 | 28 | 2 | | 3 | | 1 | 1 |
| seat: fit height/nudge | 1 | 4 | | | 5 | 14 | 15 | |
| feet: placement/terrain/floor | | 13 | 8 | | 9 | 25 | 8 | |
| solve (placement) | 1 | 12 | 13 | | 6 | 9 | 11 | |
| solve+IK (animal) | 1 | 3 | 1 | | 3 | 4 | 3 | 2 |
| solve+IK (vehicle) | | 3 | 4 | | 2 | 4 | 1 | |
| fit+IK (sedan) | | 7 | | | | 2 | | 2 |
| clip feet (chair: uneven soles) | | 6 | 2 | | 2 | 6 | 5 | 1 |
| root_h (deck) | | 2 | | | | 1 | | |
| IK seat (ride clip) | | 1 | | | | | | 1 |
| engine P4 | | 3 | | | | | | |
| people failing | 4 | 63 | 35 | 1 | 26 | 69 | 41 | 8 |

Notes for the fixers:
- **Sedans** reuse `sedan_carry~pole` / `~pole_ends` and the kit's `pole_fit`.
- **Lean/rail** (gate, rainbow_bridge): mostly lean_chin / lean_over / reach_over_rail.
  - Read the map: if a rail is painted, solve the placement, then IK; if not, recast.
- **Feet in floors:** `kit_outer_road_2.hall`, `song_kit.house` and `open_hall` have the nocol-floor-over-plinth
  pattern fixed in S4.
- **Chair clips with uneven soles** need a leg-IK op (`via: leg` pinning a sole; small, alongside `via: arm`). It's
  not built yet.
- **Boat crews (116)** are still unmeasured.
