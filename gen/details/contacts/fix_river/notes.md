# Fix river: contact fixes on canal (S2) and countryside (S1) (details pass, agent "fix-river", 2026-10-13)

Brief: `gen/details/brief_contacts_rollout.md` (row fix-river). Standard: `gen/details/contacts/fix_standard.md`.
Before: the 03:06 page dump (`before/contacts.<s>.json`, `before/people.<s>.json`, `before/placed.<s>.json`).

## Result (page dumps: 03:06 before, 06:45 after; boat crews are fix-boats', counted apart)

| section | figures failing | FAILs |
|---|---|---|
| canal (S2) | 41 -> 2 | 63 -> 5 |
| countryside (S1) | 8 -> 1 | 14 -> 1 |

At 06:20 canal was 1 / 3. The 06:45 dump adds shop_man_dark_cap_23963 (see Remaining): official was rebuilt at
06:33 and its sit_talk~soles now draws 3.5 cm high. fix-boats' pole rules also caught `pennant_pole_holder_27810` (S2)
and `party_porter_staff_31131` (S1) after the before dump; both are fixed. canal's boat crews, newly measured by
fix-boats, are 40 failing / 100 FAILs: theirs. Snapshots: `after_canal.json`, `after_countryside.json`.

FAILs by class, before -> after (page, 06:45):

| class | canal | countryside |
|---|---|---|
| contact:seat | 15 -> 1 | |
| contact:seat (no seat) | 1 -> 1 | 1 -> 0 |
| contact:floor (clip) (chair soles) | 6 -> 1 | 1 -> 0 |
| contact:floor / (placement) | 3 -> 0 | |
| stance_soles (placement) | 6 -> 0 | |
| site_inside / head_inside | 8 -> 0 | |
| body_cylinder | 5 -> 0 | |
| contact:rail | 5 -> 0 | 1 -> 0 |
| contact:table | 5 -> 2 | 2 -> 0 |
| contact:wall | 1 -> 0 | |
| contact:animal | 6 -> 0 | 2 -> 1 |
| contact:vehicle (incl. sedan poles) | 2 -> 0 | 6 -> 0 |
| contact:ridden | | 1 -> 0 |

### Remaining
- canal `man_leaning_over_donkey_29000` (seat, forearms 0.14 / 0.12 m). Painted on a low bench, bending far over the
  dark donkey's back with both hands at its neck. At real size the donkey is 1.49 m long and about 1.0 m at the
  withers (painted 0.66 m), so its back is at a seated man's shoulder height and 0.9 m or more from the mapped bench.
  His take (lean_over_seated, made for him) sits at 0.16 m and sways 5 cm, so no bench height holds the seat for 90% of
  the cycle. The fix needs a new take, either seated on a 0.45 m bench leaning over a 1 m back, or standing at the
  donkey's flank, plus a recorded move of the donkey or the bench (rule 7), or the lead's call on scale.
  Owner: lead (decision) / workshop (take).
- canal `shop_man_dark_cap_23963` (seat 0.04, sole_L 0.032; passed at 06:20). official's `sit_talk~soles` was rebuilt
  at 06:33 and is drawn 3.5 cm high. Its clip_meta sole_m diverges (-0.035 -> -0.105 -> -0.21) because it has no
  effect on the page, probably a hips accessor shared with the base (sent to main for fix-inner). child `sit~soles` shows
  the same, but hall_small_figure_25628 still passes. Owner: fix-inner; then I re-check him on a dump.
- countryside `charcoal_driver_36250` (palm 0.046). He walks beside D1 (E1 + E1b). The dump, about 8 s after load,
  catches the pair turning round at the end of D1's 2.3 m path, when a follower crosses the path at LAT_RATE while the
  donkey turns in place: about 2 s of each ~10 s cycle. Optional E1c (in `engine_beside.md`, not sent) would keep him in
  the donkey's frame through the turn. Owner: 3d-director-04 (E1c, if wanted). His partner 36797 PASSes.

## What was done, by fix class

### Casting hooks (my sections' scripts)
- `gen/sections/canal/make_people.py` and `gen/sections/countryside/make_people.py` apply `contact_fixes.json` last
  (`tools/contact_fixes.py`). Both reproduced their people.json byte for byte before the hook.
- canal's script also applies `contact_fixes.json` "seats" (a seat's centre, top and floor: into seats.json) and
  "animals" (an animal a figure holds plays one clip). countryside's applies "walkers" (`beside`, engine item E1).
- Builders: `canal_scene.seats()` builds `top_H` / `base_H` seats; `fitted_ht()` fits mapped benches, the shed stool
  and the grain owner's sack pile (kit `sack_pile(stack=1)`, the other sack set back 0.5 m behind him);
  `countryside_scene.figure_seats()` builds figure-owned stools from contact_fixes "seats";
  `SEDAN_POLE_FIT = (1.47, 1.44)`.

### 2. Placement (contact_solve, written into contact_fixes.json)
canal: figure_by_top_willow, man_north_bank_small, shop_standing, bank_man_seated, bank_crouching, bank_tall_man,
bank_small_figure, crouching_man_by_timber, big_hat_man_south_bank, cart_loader, man_behind_cart_rear, stall_keeper_24650,
far_street_figure, hall_seated_man, hall_small_figure, youth_topknot, stall_keeper_26174, shop_man_dark_cap (0.31 m
along his bench, out of the shop front's beam). countryside: man_at_post, both sedan bearers.

### 3. Fit the object to the body (rule 3; `tools/seat_fit.mjs`, `tools/record_seats.py`)
- 12 figure-owned stools and folding seats (canal): top at the seat point on the page less 0.008 m, centred under it,
  standing on the floor the page has there. The hall child's folding seat is set 0.10 m back so its foot bar clears
  his soles.
- Mapped seats fitted in height only: eatery_bench_23612 (0.376 m), shop_bench_23955, shop_bench_24066 (to
  `sit~soles`), shed_bench_28740, shed_stool_28871, and the sack pile under the grain owner (one sack, top 0.28 m).
- The pennant frame's held pole end on the line from its apex through the holder's palms (fend_pole), 0.2 m past them.
- S1's sedan poles: 1.47 m (rear) / 1.44 m (front; the ground under the front end is 3 cm over his).

### 1. Recasts (the painting shows no contact for the clip)
- overseer_28092: arms_folded (a wall lean) -> stand_sleeves (new carter clip from:farmer/stand_sleeves).
- sack_porter_back_28271: push_flank (an animal's flank) -> bend_goods. He steadies a sack on a walker's back.
- far_street_man_25688: browse -> look/idle. Painted standing at a low table (about 0.35 m), no hand on it.
- child_29674 (S1): reach (a table) -> hand_over (new child_robed clip from:townsman/hand_over), a hand held out.
- party_porter_staff_31131 (S1): stand_pole (its foot 10 cm over the ground) -> idle with `staff_on_shoulder` (new
  porter prop in idle; painted with the staff over his shoulder).
- pennant_pole_holder_27810: no carried pole; he holds the frame's built pole (`fend_pole~pennant_pole_holder_27810`,
  its own rule in make_contacts_json.py: both palms on the structure).

### 4. IK clip variants (characters/ik_variants.json)
Shared:
- `soles` (fix-inner's leg op): sightseer listen, scholar listen, robed_man sit, fortune_teller sit, child sit, farmer
  drink (and the existing official sit_talk~soles);
- `pole` (S4's): both S1 bearers.

Per figure:
- `bridle~carter_24218` and `bridle~man_at_horse_head_24506` (scholar): `tools/animal_hold.mjs`. Hands go where the
  animal's body stays within 2-3 cm over every frame of its clips. The held animals play one clip: the lead mule
  `idle`, the horse `head_low` (contact_fixes "animals").
- `lean_over~terrace_diner_leaning_23216` (scholar).
- `lean_chin~man_at_railing_27650` (sightseer): the chest held at the median by the hips, elbows on the rail.
- `push~barrow_pusher_25532` (straw_hat): `tools/reach_hold.mjs`, points reachable in every frame (push is a
  locomotion take, so no hips op).
- `fend_pole~pennant_pole_holder_27810` (robed_man).
- `sit_offer~tub_vendor_27765` (idler): the seat held on the ground.
- `ride~traveller_rider_30165` (townsman, S1): the seat held at the take's median.

Characters rebuilt (under the flock): scholar, townsman, sightseer, straw_hat, robed_man, idler, fortune_teller,
child, carter, child_robed, farmer, porter.

## Incident: clip_meta sole_m divergence (03:45-04:10, mine)
My build loop ran `clip_ground --write-meta` twice per build with no joint_tracks in between. clip_ground writes old +
the residual measured on the joint tracks, so stale tracks doubled every residual, and the values grew across builds
(robed_man sit~soles -15 m, fortune_teller sit~soles +5.4, and other agents' clips).

Repaired under the lock: `joint_tracks all` -> `clip_ground --write-meta` -> `joint_tracks all` -> `clip_ground` (7
still off, all fix-bridge's S3 lean_over variants). The lead was told. `tools/build_chars.sh` now alternates the two.
Rule: never two clip_ground writes without fresh joint tracks in between.

Second incident: a straw_hat build failed (ik_clip refuses a hips op on the locomotion take `push`) and its node
process hung while holding the charbuild lock (about 10 min). I killed it by PID. The variant was redone arm-only.

## Tools (gen/details/contacts/fix_river/tools/)
- `seat_fit.mjs`: a seated figure's seat point at its predicted placement and the fitted seat (hold window aware).
- `record_seats.py`: writes the seat fits into contact_fixes.json "seats".
- `animal_hold.mjs`: hand targets on an animal's body where it stays put across all its clips.
- `reach_hold.mjs`: hand or elbow targets on a static owner, reachable in every frame.
- `ik_targets_as.mjs`: tools/ik_targets.mjs with an explicit target kind (a variant whose rule differs from its base).
- `check_now.mjs`: the predicted check with animals on their current cycles, boat crews counted apart.
- `classes.mjs`: FAILs per class. `margin_solve.mjs`: re-place with a 1 cm margin. `beside_gapscan.mjs`, `beside_drivers.mjs`: the beside drivers. `add_clips.py`: add clip sources under the lock. `build_chars.sh`: safe builds.

## Exports and checks
- Exports (3d-director-04 told before and after each): canal and countryside at ~06:10, both `--no-boats`.
  owners_verify: canal MATCH (116766 tris, 46 nodes), countryside MATCH (96627 tris, 37 nodes). Live with batch 2's
  deploy.
- people.json-only ships after that (no GLB change): canal 06:19 (margin re-placements), countryside 06:19 (beside, gap
  +0.57) and 06:4x (gap +0.40, along -0.15, under /tmp/qingming_contact_fixes.lock).
- loyalty_check S2 and S1: PASS. cast_clips_check (shipped and --source): PASS. ktx2 check: PASS.
- budget_check --no-load: canal 26.41 / 28 MB PASS, countryside 18.85 / 28 MB PASS.
- place_predict: 689 of 694 static figures within 1 cm of the dump. The 5 that differ are in inner_city, outer_road and
  outer_road_2 (P4 and seam items), none in S2/S1.
- Regression `regress.sh fix_river` (06:28, start=0): world 211/211, boats 12/12, rides 5/5. people: FAIL only on
  "nobody went round the player" at the gate (X 7 / X -8), as in the baseline; sizes: 0 adults shrunk. contacts
  REPORT: 807 people, 244 failing, 534 FAILs (boat crews now included by fix-boats).
- Engine items for 3d-director-04 (`engine_beside.md`): E1 (walkers beside an animal) and E1b (a beside follower keeps
  its place) landed. E1c (turning with it) is written up but not sent.
