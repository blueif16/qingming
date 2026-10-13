# Fix gate: contact fixes on gate (S5) and city_end (S7) (details pass, agent "fix-gate", 2026-10-13)

Brief: `gen/details/brief_contacts_rollout.md` (row fix-gate). Standard: `gen/details/contacts/fix_standard.md`.
Before: `before_gate.json` / `before_city_end.json` (the 03:06 page dump). After: `after_gate.json` / `after_city_end.json`
(the 06:10 page dump, `placements_after2.json`), confirmed by the regression's own dump (06:12).

## Result (page dump)

| section | failing figures | FAILs |
|---|---|---|
| gate (S5) | 35 -> 1 | 74 -> 1 |
| city_end (S7) | 4 -> 0 | 6 -> 0 |

By class, before -> after. Gate:

| class | before | after |
|---|---|---|
| contact:rail | 23 | 0 |
| contact:vehicle | 8 | 0 |
| body_cylinder | 7 | 0 |
| contact:table | 6 | 0 |
| stance_soles (placement) | 6 | 0 |
| contact:floor (placement) | 5 | 0 |
| furniture | 5 | 0 |
| contact:seat (no seat) | 4 | 0 |
| contact:floor (clip) | 3 | 0 |
| contact:wall | 2 | 1 |
| head_inside | 2 | 0 |
| contact:animal | 2 | 0 |
| site_inside | 1 | 0 |

city_end: contact:animal 2 -> 0, contact:seat 1 -> 0, contact:seat (no seat) 1 -> 0, contact:wall 1 -> 0,
site_inside 1 -> 0.

Also fixed: `hat_pole_man_5940`, whose staff's foot was 4-12 cm over the ground. fix-boats' new pole rules caught it.

## What remains

- **gate `tree_leaner_7952`** (lean_wall, back 0.6: nothing within 0.6 m).
  - The painting has him leaning on the east side of the big willow's trunk (`S5.tree.willow_7856`).
  - Trunks are drawn by the page (trees3d). The section GLB holds only the trunk's hidden collider (r 0.42 at X -11.25,
    D 8.78), and contact_check rightly never counts a hidden collider as a wall.
  - His measured foot is also 1.6 m from the willow's mapped base. That base is an estimate: it is hidden behind the
    idlers' heads.
  - **Owner: main.** Two things are needed:
    - a map decision on the willow's estimated base against his measured foot;
    - a contact_check target for tree trunks (the trunk collider, or the trees3d trunk).
  - Then solve him against that target.
- **Not failing, noted.** `luggage_servant_8002`'s path runs east into his own rider's standing donkey and then into
  the barrow. The page stops him behind the donkey ("no room"). A path walked the other way would contradict the
  painted direction, so it is left as it is.

## Fixes

### Builders

- **`blender/song_kit.py` `house()` and `open_hall()` floor boards collide** (shared fix, done first and reported).
  - The walkable top had been the plinth's inner slab at zt - 0.015.
  - Gate: 84 tris moved from timber nocol to col.
  - inner_city calls `k.house`, so its next build picks this up.
- **`blender/gate_scene.py`:**
  - the tax office floor boards collide (the declarer had stood 4.5 cm inside them);
  - the tower balcony railing is 1.075 m high (choice; was 1.0), as the moat bridge's top rail, for the balcony man's lean.
- **`blender/city_end_scene.py`** (choice, rule 3):
  - the shop's west bench is 0.435 m high (was 0.55; the woman's seat site is 0.44 m);
  - the gatekeeper's box seat is 0.565 m (was 0.48; robed_man's sit_talk seat is 0.569 m).

### People

- **Gate:** `sections/gate/contact_fixes.json` holds 34 figures and 2 walkers, applied in place by
  `python3 tools/contact_fixes.py gate`.
- **city_end:** `sections/city_end/contact_fixes.json` holds 3 figures. It is applied by
  `gen/sections/city_end/make_people.py`, which now calls `apply_contact_fixes(people, 'city_end')` before its checks.
- **`tools/contact_fixes.py`** now also takes `"walkers": {id: {path, why}}`: a shorter path for a walker whose painted
  path runs through a built thing. The reason goes in walkers_why.
- **Gate, solved placements:**
  - tax_carter_manifest, tower_watchman, wall_recliner, hidden_man_6452, carter_6418, tax_carter_gaping_6300;
  - man_brown/white_awning, figure_by_trunk_5772, the two archers, caravan_leader_7388.
- **Rail leaners on lean_chin~moat_rail** (11 in all, then solved):
  - near rail: bridge_sightseer, rail_watcher_2/3/4, rail_leaner_8665;
  - far rail: far_rail_dark_9308, far_rail_white_bent_9255, far_rail_turned_9100, far_rail_white_8698,
    far_rail_bending_8822, far_rail_back_8615;
  - far_rail_turned_9100 turned 74 degrees toward the railing (reason recorded; the casting had faced him along it).
  - tower_balcony_man_6600 is also on lean_chin~moat_rail. He moved 0.55 m onto the built balcony, where he had stood
    on the terrace balustrade.
- **The tax office:**
  - the official is on write~office_desk and sit_talk~office_bench, 3 cm clear of the bench's front edge (at the edge,
    the page's quantised bench caught the ground rays);
  - the clerk is recast to sit_talk~office_bench (no desk is painted at him; the official's sit take jumps its seat
    9 cm, so it isn't used).
- **Recasts:**
  - beggar boys: reach (a table reach) -> hand_over (new child clip, from:carter);
  - pack_handler: push -> browse~ at the pack box (new carter clip from:townsman). He moved 1.1 m: his painted foot is
    1.7 m from the box's mapped spot, whose identification is low.
  - cart_shaftman: push -> idle~ with his hands on the front shafts;
  - cart_pusher_8254: push -> steer~ with his hands on the rear handles, 0.9 m back from inside the barrow's frame;
  - hat_pole_man: stand_pole~staff_foot.
- **IK at solved placements:** cart_pusher_5727 (push~, on S6's sack cart), groom_8167 (bridle~, the right hand only:
  he holds a stick in the other).
- **Walkers:** top_porter_backbox_8911 ran through three trunks and the rider's donkey, so his path now ends at his
  painted spot. porter_back_8050 ran through the 串车 and onto the moat railing, so his path ends 0.6 m short of the
  barrow.
- **city_end:**
  - groom_1698 bridle -> idle (hands together at his waist, as painted; S4's groom precedent);
  - man_at_post_1118 solved against the gatehouse post;
  - the woman with the child solved onto the refitted bench;
  - the gatekeeper's seat fits after the box refit.

### IK variants (characters/ik_variants.json) and character GLBs

- **Shared specs:**
  - `office_bench`: seat 0.425 m, both soles on the floor;
  - `office_desk`: as office_bench, plus palm_L on a 0.75 m desk;
  - `moat_rail`: the right elbow held 1.10 m up by the hips, for a 1.075 m top rail;
  - `staff_foot`: palm_R held 0.937 m up so the porter's staff foot reaches the ground. It is also for inner_city
    pole_man_5578 and countryside party_porter_staff_31131.
- **Per-figure specs:** cart_shaftman_8498 (with a hips op, so the hanging hands reach 0.72 m shafts),
  cart_pusher_8254, cart_pusher_5727, groom_8167, pack_handler_5837.
- **Variants built:**
  - official: write~office_desk, sit_talk~office_bench (sit~office_bench was built, then dropped);
  - sightseer: lean_chin~moat_rail;
  - idler: lean_chin~moat_rail;
  - porter: stand_pole~staff_foot;
  - carter: push~cart_pusher_5727, steer~cart_pusher_8254, idle~cart_shaftman_8498, bridle~groom_8167,
    browse~pack_handler_5837 (steer~cart_shaftman_8498 was built, then dropped).
- **New clips:** child hand_over (from:carter), carter browse (from:townsman).
- **Rules** (`gen/details/contacts/tools/make_contacts_json.py`): bridle~groom_8167 (palm_R only), steer~cart_pusher_8254 and
  idle~cart_shaftman_8498 (palms on the vehicle's surface, since the barrow's bent rails are not found as rods; the
  steer one keeps steer's hold of 0.6).
- **Characters rebuilt under the flock:** official, sightseer, idler, child, carter (5 times), porter. After every build:
  - `clip_ground --add-missing --write-meta`
  - `joint_tracks <char>`
  - `clip_ground --write-meta`
  - `joint_tracks <char>`
  - `ktx2 encode`
  - `cast_clips_check --source` PASS.

## Traps found (sent to main)

- **clip_meta sole_m divergence (04:20).** clip_ground writes meta + residual measured on the joint tracks. On stale
  tracks, every run adds the same residual again. Six fixers running it after every build drove other agents' variants
  to -18 m and +7 m.
  - Repaired under the flock: `joint_tracks all`, `clip_ground --write-meta`, `joint_tracks all`. Backup:
    `clip_meta.before_repair.json`.
  - Proposed: clip_ground works from the sole_m the tracks were made with.
- **IK variants of locomotion clips lose their locomotion flag.** push~cart_pusher_5727 and steer~cart_pusher_8254 got
  `locomotion: false, speed: 0` in clip_meta, so the page didn't pin their travel: the variant walked 2.3 m into the
  cart. I gave them their base's speed/locomotion/stride. A re-measure (people_precompute on a carter build) can undo
  this: ik_clip or precompute should copy the base's locomotion fields to `~` variants.
- **The ground-ray edge.** A seated figure whose root sits exactly on a bench's front edge stood on the bench on the page
  (quantisation) while the predictor had him on the floor. The solve's margin doesn't cover the ground rays: keep roots
  2-3 cm clear of furniture edges.
- **Max-turn readings of 170-180 degrees** in `*.ik.json` are on every arm variant, S4's too. The stick sheets
  (`pose_*.png`) show natural poses.

## Checks

- **Exports** (3d-director-04 told before and after): gate and city_end, each with `--no-boats`. owners_verify: gate MATCH
  (108489 tris), city_end MATCH (48476 tris).
- loyalty_check S5 PASS, S7 PASS. ktx2 check PASS. cast_clips_check (source and shipped) PASS.
- budget_check after the last variant batch (`all --no-load`), every section PASS:
  - gate 19.21/28 MB, city_end 12.52;
  - rainbow_bridge 27.39 (it shares the carter, whose GLB grew 773 -> 867 KB with my five per-figure variants), canal 26.37.
- place_predict: every gate and city_end static figure agrees with the page within 1 cm. The 5 that differ elsewhere are
  inner_city, outer_road and outer_road_2 figures.
- **Regression** `regress.sh fix_gate` (start=0):
  - world 211/211, boats 12/12, rides 5/5;
  - people: FAIL only on the gate's two "nobody went round the player" lines (X 7, X -8), as before this pass;
    sizes: 0 adults shrunk;
  - contacts REPORT: 807 people, 249 failing, 539 FAILs (all sections, with fix-boats' new crew rules).
