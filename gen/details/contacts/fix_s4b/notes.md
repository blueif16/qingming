# Fix S4b: contact fixes on outer_road_2, plus S4's last figure (details pass, agent "fix-s4b", 2026-10-13)

Brief: `gen/details/brief_contacts_rollout.md` (row fix-s4b). Standard: `gen/details/contacts/fix_standard.md`.
Tools of this agent: `fix_s4b/tools/cfx.py` (sets fields of one entry of `sections/<s>/contact_fixes.json`; people.json is
only ever written by the casting script). Scratch helpers (seat fits, reach, animal/owner surface targets) were in the
session scratchpad; what they computed is recorded below and in each contact_fixes entry.

## Before

Page dump 2026-10-13 03:06: outer_road_2 66 people, 26 failing (the brief's row), S4 outer_road 1 failing
(child_at_table_12597).

## Builder and casting changes

- `blender/kit_outer_road_2.py` `hall()` and `south_row_hall()`: the floor boards collide (as S4's halls, song_kit.house /
  open_hall). Over the collide plinth alone the walkable top was 4.5 cm under the visible boards. Fixed
  man_in_shed_13220 at once. rainbow_bridge_scene.py uses both (lead told; fix-bridge rechecks on its next build).
- `blender/outer_road_2_scene.py`:
  - `S4b.prop.table_12645` (the S4 child's table) stands on part 1's south hall floor (`S4_HALL_FLOOR` 0.23), 0.6 x 0.5 m,
    0.6 m high (its top at the child's reach palms less 0.02: 0.83), moved 0.27 m south-west (build_choices.json) clear
    of S4's east hall column (X 58.4, D -2.47, base 0.36 m), its west end on the seam as painted (u 12599).
  - `table(..., z=)` takes a support height; `bench_12835` 0.41 m (fitted); `stool_14595` 0.225 m (fitted);
  - `seats()` skips seats on boat decks or carts (its docstring's rule): the stern boatman's stool stood still in the
    water at the boat's rest place (fix-boats told: the boat kit's to build).
- `sections/outer_road_2/build_choices.json` moves (then `node tools/map_layout.mjs S4b`): table_12645 (above);
  chair_14458 +0.25 D, table_14518 +0.2 D, stool_14595 +0.15 D: the tea house's front furniture at real size stood
  half off its mapped platform (front face D 7.13-7.35), its sitters on the ground at its edge.
- `gen/sections/outer_road_2/make_people.py`:
  - applies `sections/outer_road_2/contact_fixes.json` (tools/contact_fixes.py) before seats.json and its checks;
  - an entry's `seat` {X, D, H, seat_h, why} refits that figure's own seat in seats.json (rule 3);
  - `show_goods_seated` is a floor sit (its 0.48 m stool, never shipped, is gone: "no stool shows");
  - its furniture parser reads `ht=` for benches and stools.
- Shared: `clip_ground.mjs` (lead, at this agent's request): a chair clip whose rule rests one sole on the floor is
  grounded by that sole (robed_man knee_on_stool: sole_m -0.074 -> 0.007). `make_contacts_json.py` (under the lock):
  variant rules `lean_over~man_bending_to_donkey_13440`, `idle~man_big_hat_12895` (palms on the animal).

## Per figure (outer_road_2)

| figure | was | fix |
|---|---|---|
| official_seated_12728 | write: no desk; seat -0.047; uneven soles | recast sit_talk~soles (shared; sit's seat drifts 8 cm), nudge so its hips land on the painted seat point; own stool on the hall floor (0.48), 0.495 m |
| man_dark_cap_by_stair_12700 | seat 0.50 over the ground (root on the hall plinth) | solve 3 cm: sits on the official hall plinth's front ledge behind the jar |
| dark_figure_or_garment_12825 | body in the hall plinth | solve 0.22 m |
| man_seated_front_of_hall_12866 | root on the hall plinth, feet on the ground | 0.26 m south off the plinth (--at); own stool refitted (0.41) |
| man_in_shed_13220 | sole 4.5 cm in the floor | kit floor collides |
| man_standing_by_hall_12942 | on the shop hall's ledge | solve 0.16 m |
| onlooker_dark_robe_13222 | body in the big roof hall | solve 0.28 m |
| seated_man_13240 | floor sit, seat lifts 5 cm | stool removed (casting); show_goods_seated~seated_man_13240 (seat held on the ground) |
| customer_light_12990 | root on the shop hall's plinth edge | 0.23 m south (--at); own stool refitted (0.32) |
| seated_in_bottom_shop_12792 | seat 4 cm in the bench | bench_12835 0.41 m |
| figure_in_shop_13242 | seat 6 cm over his stool (floor rose) | own stool on the shop floor (0.113), 0.435 |
| stall_keeper_seated_13940 | seat 7 cm in his stool | own stool 0.435 |
| counter_man_leaning_13325 | lean_chin elbows on nothing | recast lean_over (hands on the counter, painted); placed behind its east end; lean_over~counter_man_leaning_13325 |
| man_in_white_at_horse_13360 | bridle in the air | recast idle/look: "may be holding it" only, and the horse lowers and raises its head |
| man_bowed_at_horse_13410 | girth hands off | placed west of the donkey's head, against the horse; girth~man_bowed_at_horse_13410 |
| man_bending_to_donkey_13440 | lean_over: no rail | placed at the donkey's flank (0.83 m, reason recorded); variant with its own rule: hands on the donkey's back |
| porter_at_cart_rear_13090 | hands 0.6-0.7 off the cart | solve 0.6 m; reach_up_load~porter_at_cart_rear_13090 (hands on the thatch hood's underside over him) |
| carter_at_shaft_ox_13243 | steer: shafts 1-1.3 m off | recast push_flank (he is beside the ox, not between the shafts); 1.83 m with the team (reason recorded); push_flank~carter_at_shaft_ox_13243 |
| man_big_hat_12895 | bridle 1.5 m off the horse | 1.28 m to the horse's far flank (est foot; reason recorded); idle~man_big_hat_12895 (knees bent, hands on the withers) |
| small_companion_14654 | reach: no table | recast look/idle (the painted contact is the man's sleeve: a figure, not measured) |
| man_at_gate_post_14540 | body in the shed post | solve 8 cm |
| customer_bent_14420 | lean_over on a chair back; feet in the platform | recast bend_goods; onto the platform (0.27 m) |
| customer_hat_14462 | on the ground at the platform edge; right foot in a post base | chair moved onto the platform; listen only; placed 0.1 m N, 0.05 m W |
| customer_white_14560 | knee_on_stool: left sole 8 cm under (grounding) | clip_ground fix (lead); knee_on_stool~customer_white_14560 (seat held); stool fitted 0.225 |
| customer_cap_14785 | uneven soles (clip) | listen~soles (shared) |
| wheelwright_bending_13620 | wheelwright hand 0.56 off; browse: no table | browse -> bend_goods; feet off the rim (--at); **wheelwright stays failing** (below) |

## S4 outer_road: child_at_table_12597

- Table moved and fitted (above). Child re-solved on the base clip reach (`--base-clips`), placed with --at so both palms
  come down 7 cm inside the table's west end (nudge [0.03, -0.26], facing 0; 0.42 m from the casting spot).
- `ik_targets outer_road child_at_table_12597 --clip reach --owner S4b.prop.table_12645 --write` under the flock; child
  rebuilt (reach~child_at_table_12597, `sole_shift_m` 0.008: built after the frame-trap fix), clip_ground, joint_tracks,
  ktx2. S4's casting rerun (it also carried basket_leaner_10078's recorded solve [-0.03,-0.25] f190, which its
  people.json had not picked up; it still passes). Predicted S4: 64 people, 0 failing.

## Result (page dump after the export, 2026-10-13 ~06:43)

| section | failing figures | FAILs |
|---|---|---|
| outer_road_2 (S4b) | 26 -> 1 (+1 boat crew, newly measured: fix-boats') | 53 -> 1 (+2 crew) |
| outer_road (S4) | 1 -> 0 | 1 -> 0 |

S4b FAILs by class, before -> after: contact:seat 8 -> 0; contact:floor (placement) 7 -> 0; contact:rail 6 -> 0;
contact:animal 6 -> 0; contact:table 5 -> 0; contact:vehicle 4 -> 0; body_cylinder 4 -> 0; contact:floor (clip) 3 -> 0;
stance_soles (placement) 3 -> 0; contact:floor 2 -> 0; furniture 2 -> 0; contact:structure 1 -> 1; site_inside 1 -> 0;
below_support 1 -> 0. (Crew: seated_boatman_stern_15372 contact:floor + contact:boat, fix-boats'.) S4: contact:table 1 -> 0.

What remains:
- **wheelwright_bending_13620** (contact:structure, palm_L 0.60): the take (idler wheelwright = hammer_rim) presses a rim
  at knee height; the painted wheel lies flat on the ground (kit rim 0.13-0.15 m up), 0.6 m under his hand, and no idler
  clip reaches it bent at the waist (bucket_lift's lowest palm 0.33 m; the arm reaches ~0.5 m from the shoulder). Owner:
  the lead: a new Text to Motion take (a man bent double hammering a rim at his feet), or a decision to set the wheel on
  low blocks (not painted). His cycle's browse (no table) is now bend_goods, his feet off the rim.
- **seated_boatman_stern_15372** (crew): fix-boats.

Checks: owners_verify outer_road_2 MATCH (122441 tris; the old DRIFT's two stools are gone); loyalty_check S4b PASS,
S4 PASS; cast_clips_check --source PASS; budget_check all --no-load PASS (outer_road_2 19.36 MB, rainbow_bridge
27.47/28); place_predict 689/694 within 1 cm, the 5 are S3 figures in halls whose floors my kit change raised by
4.4 cm in S3's newer build (not yet exported: fix-bridge); regression `fix_s4b`: world 211/211, boats 12/12, rides 5/5,
people FAIL only on the two baseline "nobody went round the player" lines at the gate (sizes: 0 adults shrunk),
contacts REPORT 807 people, 55 failing, 109 FAILs (all sections).

IK variants added (characters/ik_variants.json; all per-figure: no shared spec fits these geometries): child
reach~child_at_table_12597 (remade), official_rider idle~man_big_hat_12895 (bridle~ dropped), inspector
girth~man_bowed_at_horse_13410, idler lean_over~counter_man_leaning_13325, reach_up_load~porter_at_cart_rear_13090,
push_flank~carter_at_shaft_ox_13243, scholar lean_over~man_bending_to_donkey_13440, robed_man
knee_on_stool~customer_white_14560, storyteller show_goods_seated~seated_man_13240. Shared ones used: official
sit_talk~soles, sightseer listen~soles. Character GLBs rebuilt (flock): child, official_rider, inspector, idler, scholar,
robed_man, storyteller. Rules added (make_contacts_json.py): lean_over~man_bending_to_donkey_13440,
idle~man_big_hat_12895 (palms on the animal).

Lessons:
- The arm reaches about 0.5 m from the shoulder site (not the 0.63-0.67 the clips' widest frames suggest): place the
  figure first so every target is within ~0.5 m all through the clip, then make the targets. A take that rocks (idler
  lean_over sways 0.3 m) takes a height-only target (`to: {y}`, as table_palms) on a top, not a point.
- Animal targets go on the part of the posed body that every clip of that animal shares (horse: z <= 0.35-0.45 of its
  length; donkey z <= 0.2): a horse that lowers and raises its head (head_low, idle) moves its neck 0.5 m.
- A figure's own stool under a seat point whose foot is tucked under it: the floor probe (0.15 m up) sees the stool's
  board; a board 0.17 m over the foot keeps it out.

## Log

- 03:00-03:45 local: read the brief, standard, pilot notes; kit floor fix; table move; S4b build; child solve + IK + build.
- 03:45-04:30: casting hooks (contact_fixes, seat fits), solves, recasts, tea house moves, clip_ground request (landed),
  first variant batch (official_rider, inspector, idler x3, scholar, robed_man, storyteller) under the flock;
  budget_check all PASS (rainbow_bridge 27.39/28), cast_clips_check PASS.
- 04:30-06:00: stopped (usage limit). 06:05: state checked (all JSON parses, casting reproducible).
- 06:10-: variants with residuals 5-30 cm (targets beyond the arm's reach): placements moved closer, targets re-made
  within reach (shoulder-to-target <= 0.55 m); man_big_hat to idle + knees bent. Waiting for the lead's deploy hold.
- ~06:30-06:45: lock released; batch 2 (official_rider with --drop of the old bridle~ variant, inspector, idler, scholar)
  and batch 3 (official_rider, idler) under the flock; fix-inner's rebuilt ik_clip in use; counter raised to 0.92 and
  the counter man's hands on a height target. 04 told before and after; `export_web_scene.mjs outer_road_2 --no-boats`;
  sections/outer_road/people.json copied to web; fresh dump: S4b 2 failing (wheelwright; crew), S4 0; regression run.
- Next (if anyone resumes): the wheelwright take (lead's call); nothing else of fix-s4b's is open.
