# Fix bridge: contact fixes on rainbow_bridge (S3) (details pass, agent "fix-bridge", 2026-10-13)

Brief: `gen/details/brief_contacts_rollout.md` (row fix-bridge). Standard: `gen/details/contacts/fix_standard.md`.
Tools of this pass: `fix_bridge/tools/` (brief.mjs: per failing figure its fails, cast and map line; classes.mjs).

## Log

- 03:12 PDT: started. Read the brief, fix_standard.md, fix_s4 (notes, engine_patches, rollout_table, from_perf),
  contacts/notes.md, qingming/CLAUDE.md, map/BUILDING.md, skills characters (Routines, Casting a big section),
  web-scene (Before shipping), scroll-section (Machine resources).
- Before (page dump 03:06, after fix-S4's root_h): 232 people, 69 failing, 125 FAILs
  (`fix_bridge/before_rainbow_bridge.json`; people.json and contact_fixes.json copied as `*.before.json`).
  Prediction agrees: 69 / 125.
- 03:40: the lead: the leg-IK op has landed (fix-inner, `contacts/leg_ik_landed.md`): shared spec `soles`
  (`<clip>~soles`). No IK variant of mine was built before its frame fix (none built yet), so nothing to rebuild.
- Deck rail figures: the treads are level boards at the smooth ramp's height at each board's middle; the railing
  (top rail centre 1.05 m, top face 1.10 m over the ramp) follows the smooth ramp, which is 22-32 deg steep at the
  ramps' rail figures. `fix_bridge/tools/deck_solve.mjs`: contact_solve's search and cost, with every trial's root put
  on the visible tread under its soles (root_h), and a stance across two treads costed.
- Read (not tested): `ik_clip.mjs` arm ops on an `elbow_*` site look degenerate (the elbow is the forearm bone's origin, so the
  two-bone solve has a zero-length lower bone and turns the forearm about world X). Not used here.
- 03:55: dry solves (deck_solve, no write) of the 17 deck railing figures: 4 reach_over_rail PASS by placement alone
  (rail_watcher_19862, deck_youth_rope_19445, deck_wide_hat_19405, man_bent_over_railing_19065); 5 reach_over_rail
  come within 0.06-0.11 (the belly under the top rail or between it and the slat rail: an IK variant lowers the body
  onto it); no lean_chin passes: the ramps' railings slope 22-32 deg (the two elbows 0.52 m apart along the rail sit
  0.2-0.3 m apart in height), and sightseer's lean_chin elbows ride 5 cm over a level 1.10 m top rail. The painting
  shows them leaning on the railing: recast lean_chin -> lean_over (both hands resting on the rail), each hand laid on
  the top rail's top where it passes (per-figure arm IK, `fix_bridge/tools/rail_ik.mjs --mode palms_top`).
- Written (contact_fixes.json): those 4, the 5 near ones (placement; IK next), under_parasol_bender_19385,
  bank_watcher_at_end_post_18998, far_bank_figure_16823 (flat solves, PASS).
- Builder data: casting `make_people.py` merges `gen/sections/rainbow_bridge/seat_fit.json` (fix_bridge/tools/seat_fit.mjs:
  each own stool under its sitter's seat point, top = seat point - 0.0075, base on the visible surface) into seats.json;
  `rainbow_bridge_scene.py seats()` builds base_H..top_H. Walkers: walls mapped as a foot line only
  (S3.str.tiled_wall_18450) now stop walkers 0.67 m short (both bottom-edge pole carriers walked into it).
- Character builds (flock): sightseer `lean_over` = t2m:lean_over@msy_B7y3 (free local retarget, as the idler's);
  elder `stand_sleeves` = from:farmer/stand_sleeves (as S4's idler). clip_ground --add-missing --write-meta,
  joint_tracks (both engines), ktx2 encode (0 new).
- 04:00-04:40: lean_over recasts placed (deck_solve --leg --rail-dist), rail variants written and built; stopped by the
  usage limit at ~04:40 (mid clip_ground cycle). Two traps met: (1) clip_ground --write-meta run on stale joint tracks
  (its tracks older than the meta, or tools/joint_tracks.mjs bumped to v6 mid-run) wrote diverging sole_m for new IK
  variants (sightseer lean_over~* -0.26 / -0.49): fixed by the cycle `joint_tracks all` (both engines) ->
  `clip_ground --add-missing --write-meta` -> `joint_tracks all` -> `clip_ground` (report: 0-1 off), always under the
  flock; (2) two variants with the same hips op (same base, same median targets) got identical hips arrays, which
  gltf-transform dedups, and the page grounds a shared hips array once: each steady op now carries a per-figure 0.1-0.9
  mm offset in x.
- 06:05 resume (gen/details/resume_0600.md): state checked (JSON parse, cast_clips_check PASS, budget 27.19/28).
  The lead: prefer shared IK specs; hard cap budget_check rainbow_bridge --no-load <= 28 MB after every batch.
  My rail variants are one per figure but nearly one per (character, ramp side): told the lead (main).
- Rail figures, final method (fix_bridge/tools):
  - deck_solve --leg: the root_h on the LOWER tread under the feet (5 points 5 cm round each sole, as contact_check reads
    a foot), the other foot raised later; --rail-dist 0.28,0.36 keeps the root where the hands reach the rail.
  - rail_ik --mode palms_top --feet --steady --chest-forward 0.06: the chest held at the clip's median place (the hips
    move under it; lean_over sways its upper body 0.26 m), each palm on the top rail's top 0.035 m in from its centre
    line where the rail passes the hand (within 0.12 m along it), the foot over the lower tread left as the clip has it
    and every target lifted by its clip height (the variant's own sole_m takes that off again), the other foot pinned
    onto its tread (drawn in towards the body when two risers up: 19715, 18982).
  - rail_ik --mode belly --feet: reach_over_rail's belly held on the railing (y, z) with the feet kept.
- 06:40: all 17 deck railing figures PASS on the prediction (8 lean_over~<fig>, 5 reach_over_rail~<fig>, 4 by
  placement alone). Budget 27.34 / 28 MB PASS. Stick sheets: fix_bridge/poses/.
- 07:00-07:40 (prediction; S3 rebuilt 3 times through tools/build_scene.sh, loyalty_check S3 PASS each time):
  - Builder: `rainbow_bridge_scene.py` props() stands the props inside the open shop on its floor (fix-s4b's k2.hall
    floor boards collide now; the shop's props had sunk 0.14 m into it); seats() builds own stools base_H..top_H;
    `kit_rainbow_bridge_props.chair()` takes `seat`. props_table fits: bench_18630 h 0.286 (moved 0.11 m down the
    ramp: choices/contacts.json -> build_choices.json -> map_layout S3), shop_bench_19902 h 0.483 (over the floor),
    shop_chair_19725 seat 0.324, far_chair_18322 seat 0.428, stool_20126 h 0.377. seat_fit.json: 17 own stools.
  - Shared variants used: robed_man sit~soles (5 sitters), scholar listen~soles, storyteller sit~soles (new, shared
    spec `soles`), porter reach_over_rail~man_bent_over_railing_19195 reused by deck_pole_holder_19625.
  - Per-figure variants added: steer~cart_puller_19870 (+ rule: the handcart's 0.96 m shafts), push~cart_pusher_19922,
    push~barrow_pusher_18295, lean_over~far_shopkeeper_19620, lean_over~mat_stall_keeper_18435,
    hold_horse_neck~groom_holding_horse_19095, bridle~groom_at_donkey_18682, push_flank~donkey_man_east_18768.
  - Recasts: balcony_drinker_16358 (look), mat_leaner_white_18220 (bend_goods), deck_pole_holder_19625
    (reach_over_rail, pole left out), topknot_man_at_cart_17458 (bend_goods), cap_man_at_cart_17545 (point),
    seated_man_topknot_18352 (sit~soles), far_shopkeeper_19620 (lean_over), donkey_man_east_18768 (push_flank).
  - Predicted: 5 of my figures left (2 sedan bearers, donkey_man_west, barrow_pusher 0.055, far_bank_figure_16722).
    The budget split landed (21.75 / 28 MB).
- 07:00-08:00: the north-edge walk (S3) failed against cart_puller_19870 (the lead; fix-boats had copied my in-progress
  people.json to web/ at 06:44): he now stands 0.07 m west of the shaft tips (X 144.85), hands back on them, clear of
  the walk's line. Exports of rainbow_bridge (--no-boats), 04 told before and after each: ~07:01 and ~07:50.
- Sedan (S3.veh.sedan_18842 on the south ramp, 26 deg): rear bearer between the poles at their rear ends, right
  shoulder under the north pole (sedan_carry~sedan_bearer_rear_18688: the shared `pole` setup with the S3 poles' real
  8.7 deg slope); front bearer between the pole ends facing the chair (sedan_carry~sedan_bearer_front_18838: the shared
  `pole_ends` setup with the real slope; its rule = pole_ends', palms only: make_contacts_json.py); builder pole_fit
  (1.767, 1.273): the poles over the rear bearer's shoulder top and in the front bearer's hands.
- The S3 shore walk near the S4b seam (end X 92.4 vs 91.3-92.3) fails since ~07:00: not people (push-out logged: 0
  moves; identical with push-out off), and the S3 and S4b collide meshes there are the deployed ones triangle for
  triangle; the next suspect is S4b's moored boat boat_big_cabin_14928's movable colliders (fix-boats / fix-s4b).
  Reported to main with the evidence (fix_bridge/tools/walk_debug.mjs, glb_near.mjs).
- Page dump (fix_bridge/checks/placements_final.json, checked by fix_bridge/tools/check_dump.mjs into
  fix_bridge/after_rainbow_bridge.json): rainbow_bridge 232 people, 21 failing, 37 FAILs, of which boat crews
  (fix-boats', not covered before this pass) 17 / 30 and the rest 4 / 7 (before: 69 / 125).

## Result (page dump of the full regression, ~07:20; regress.sh fix_bridge)

rainbow_bridge, 232 people: 69 -> 21 failing, 125 -> 38 FAILs. Of those, boat crews (fix-boats', not covered before this
pass) 17 / 31; every other figure: 69 -> 4 failing, 125 -> 7 FAILs. By class (non-crew), before -> after:
contact:rail 34 -> 0, stance_soles (placement) 18 -> 1, contact:seat 14 -> 0, contact:vehicle 14 -> 3,
contact:floor (placement) 10 -> 0, contact:animal 9 -> 2, contact:floor (clip) 8 -> 0, site_inside 6 -> 0,
contact:table 6 -> 0, contact:wall 2 -> 0, furniture 2 -> 1, body_cylinder 1 -> 0, hidden_collider 1 -> 0.

What remains (reason, owner):
- cart_puller_19870 (palm_R 0.05) and barrow_pusher_18295 (palms 0.057 / 0.047): steer and push are walk cycles in
  place; their per-figure arm IK holds the hands on the shafts / handles except where the cycle's sway carries the
  shoulder out of reach, and ik_clip refuses a hips (steadying) op on a locomotion clip. Owner: ik_clip's owner
  (fix-inner) for a steadying op on locomotion clips, then fix-bridge re-runs rail_ik --steady.
- donkey_man_west_18728 (bridle palms 1.5 / 1.1 m): painted bending over the dark donkey's neck from behind it, in
  the ramp's thickest crowd; at real size no spot within 0.6 m of his est foot reaches its neck without standing in
  the bowing man, the leaning man or the load man (best: 0.15 m overlap). Owner: the lead (a recorded move of the
  donkey or of the crowd round it, build_choices.json).
- far_bank_figure_16722 (stance 0.78, on the far house's terrace rail): a faint mark (identification low: "a figure
  or a post of the platform's row") at the foot of the far-bank house's terrace; the bank there drops 0.6 m in
  0.6 m to the water and the terrace behind the rail is 0.5 m deep (every spot within 0.65 m puts his body in the rail
  or the house). Owner: the map / lead (read it as a post, or as a figure on the terrace).
- Boat crews (17): fix-boats.

Checks: loyalty_check S3 PASS; owners_verify rainbow_bridge MATCH (after each export); cast_clips_check PASS (split
current); ktx2 check PASS; budget_check rainbow_bridge 21.81 / 28 MB PASS; place_predict 694/694 within 1 cm (crews
106/106); regression world 211/211, boats 12/12, rides 5/5, people FAIL only on the gate's two "nobody went round the
player" lines (baseline), sizes 0 adults shrunk; contacts REPORT 807 people, 39 failing, 71 FAILs.
