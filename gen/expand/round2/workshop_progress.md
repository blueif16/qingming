# Workshop progress (round 2)

The workshop (catalogue §8 (a)) appends one line here each time something lands in `web/public/assets/`. Area agents:
rerun your casting script (`make_people.py`) when a new line appears, then `node tools/clips_used.mjs`. Clip names are
the catalogue's (one name per action; `listen`, not `sit_listen`). Credits per item are in `characters/notes.md`.

- 2026-10-12 · **free retargets (catalogue 2a), 92 clips landed** (`web/public/assets/chars/*.glb`, `characters.json`;
  KTX2 check PASS). Serves all five areas (S7, S4b, S3, S2, S1). Per character: idler +12 (steer, drive_team,
  arms_folded, bend_goods, sleep_side, stand_pole, lean_over, reach, back_load, sit_talk, knees_up, carry_pole; now
  38 clips, 1.1 MB: trim first once you recast); scholar +9 (point, crane, bridle, lean_over, lean_chin, ride,
  sit_talk, listen, bow); porter +11 (push, look, bend_goods, point, lean_over, crouch, crane, back_load, sit_floor,
  push_flank, reach); robed_man +15 (sit_talk, sit, look, knees_up, drink, hail, bend_goods, lean_chin, point,
  back_load, carry_pole, chin, sit_floor, stand_pole, lead); townsman +6 (carry_pole, sit, listen, lean_over, hail,
  kneel_sleep); hat_traveller +11 (bridle, look, stand_pole, lean_over, point, talk, carry_pole, sit, push, crouch,
  drink); camel_driver +5 (sit_floor, sit, bend_goods, ride, crouch); carter +4 (hold_rope, stand_pole, tie_kerchief,
  arms_folded); inspector +3 (bridle, push_flank, push); woman +4 (look, lean_chin, tie_kerchief, ride_side);
  fortune_teller +3 (hand_over, look, talk); storyteller +2 (sit_floor, sit); child +2 (crouch, sit); butcher +2
  (hold_tray, hand_over); sightseer +1 (listen); child_robed +1 (reach); elder +1 (arms_folded). Carry clips
  (`carry_pole`, `back_load`) get their loads in the props batch (next): until then play them only with a prop the
  character already has.
- 2026-10-12 · **carried props (catalogue 2d) landed** in the characters' GLBs (`characters/props.json`, geometry
  `gen/props/`, reviews `gen/characters/<name>/props_<prop>.png`; KTX2 PASS). Switch them on with people.json
  `"props": [...]` on the figure that plays the binding's clip. Serves all five areas. New geometry bound now to the
  interim casts (the new characters get the same bindings when they land):
  - idler: `long_pole` (stand_pole), `back_sack` (back_load), `bag_hand` (idle, a bag hanging from the right hand),
    `straw_cape` (any clip), `pole_hooks`, `hoe`, `staff_shoulder` (carry_pole), `mallet` (bend_goods), `hat_on_back`
    (run), `stick_drive` (drive_team), `bucket_pour` (bucket_lift);
  - porter: `long_pole` (stand_pole), `back_sack`, `back_sack_dark` (back_load), `sack_shoulder`, `pole_hampers`,
    `pole_buckets`, `pole_jar_bundle`, `pole_basket_branches`, `hoe`, `staff_shoulder` (carry_pole),
    `back_tall_bundle` + `t_stick` (idle), `straw_cape`, `back_bundle` (any), `flat_basket` (hold_tray), `open_sack`
    (bend_goods);
  - robed_man: `long_pole`, `back_sack_dark`, `hip_bag` (any), `hand_dish_bowl` (drink), `back_chair_frame` (any),
    `pole_bundles` (carry_pole), `fan_point` (fan_round on point);
  - townsman: `back_sack`, `sack_shoulder` (carry_pole), `hip_bag`, `wind_hood` + `wind_cape` (ride),
    `folded_parasol` (carry_pole), `rope_coil` (**hold_tray**, a new free clip on the townsman), `back_bundle`;
  - hat_traveller (and hat_traveller_dark): `long_pole`, `back_tall_bundle`, `pole_fringe_frame`,
    `pole_shallow_baskets`, `pole_bundles_small` (pole_bundles at 0.6; carry_pole), `staff_walk` and `stick` (walk),
    `stick_ride` (ride), `stick_shoulder` (idle);
  - carter: `long_pole`, `stick` (walk), `stick_under_arm` (idle); inspector: `bundle_hang` (walk), `stick_point`
    (point); bearer: `bundle_hang` (idle); butcher: `hand_dish_buns` (hold_tray); camel_driver: `wind_hood` +
    `wind_cape` (ride), `food_box` (idle), `back_bundle_pale` (1.6x, any); scholar: `lidded_basket`, `stick_bag`,
    `hoe` (idle), `stick_ride` (ride); woman (and woman_pale): `veiled_hat` (ride_side), `child_on_lap` (sit).
  - Geometry ready for the new characters' takes: `long_pole_low` (pole_boat), `long_pole_mid` (fend_pole),
    `hand_dish_cup`, `bundle_small` (both hands).
- 2026-10-12 · **recolour variants (catalogue 2e) landed**: `hat_traveller_dark` (black felt hat: play dark_hat's 9
  figures and official_rider's 3 until those characters exist), `woman_pale` (pale over-robe: S7's two women;
  item 45 is not needed if she reads), `child_red` (red jacket: S3 child_red_18592). Same rig, clips and props as
  their base (`"body_from"` in `characters/<name>.json`). Serves S7, S4b, S3, S2.
- 2026-10-12 · **the paid list landed** (account msy_B7y3, 150 of 151 credits; `workshop_logs/credits.log`):
  - `boatman` (mesh, retexture and rig);
  - `grain_porter`;
  - the takes `work_sweep`, `reach_over_rail`, `tow_walk`, `sack_carry`, `pole_boat` (retaken once), `fend_pole`,
    `haul_line` and `chase_run`, retargeted onto their casts (`build_paid1–3.log`).

  The PC restart cut `build_paid2` off after the bearer; the lead rebuilt the inspector and the `build_paid3` casts at
  18:20. **Still to do:** review the new takes' clip sheets, and the animals' tack frames, which timed out under the
  load. The rest of the catalogue needs a new Meshy account (`character_gaps.md`).
- 2026-10-12 (restart run) · **animals' tack frames: all six PASS** on the GPU (check server 5190, `chrome_slot.sh`;
  log `workshop_logs/tack_frames_run3.log`, no page errors). Sheets `gen/animals/<type>/gpu_<tack>.jpg`:
  `donkey_dark` `pack_bale` (idle, walk_low: the bale rides the back, roped, no clipping), `donkey_dark`
  `halter_breeching` (idle, walk: rope halter on the head, breeching strap round the haunch), `horse_white`
  `saddle_fringe` (idle, walk: red skirt with fringe, bridle, crupper; the legs move behind the skirt), `horse_dark`
  `saddle_dark` (idle, walk: slate skirt, saddle, bridle), `mule` `pack_heap_dark` (idle, walk: wicker side loads with
  the dark heap), `horse` `girth_cloth` (head_low, walk). Nothing to change; use them as listed in `animals.json`.
- 2026-10-12 18:36 (restart run) · **review of the eight paid takes on their rebuilt casts** (GPU sheets through
  `chrome_slot.sh` on 5190: `gen/characters/<name>/clips_takes_run3.jpg` for all 12 casts, `--side`; close-ups with
  the carried props `gen/characters/{boatman,grain_porter,porter,idler,bearer}/close_takes_run3_*.jpg`; logs
  `workshop_logs/takes_review_run3.log`, `takes_close_run3.log`, no page errors). The variants
  (`hat_traveller_dark`, `child_red`) share their base's retargets and verdicts.
  - **PASS `work_sweep`** (boatman, inspector): feet braced wide, a whole-body lunge forward and lean back, face up;
    the hands sit lower than a sweep's bar.
  - **PASS `reach_over_rail`** (all casts: boatman, porter, idler, inspector, townsman, hat_traveller, scholar,
    child): bends about 45°, head down, an arm reaching down and out, then straightens. Put the figure at the rail.
  - **PASS `tow_walk`** (porter, carter, idler, hat_traveller): bent far forward, hands low at the waist, lunging
    straining steps between more upright ones.
  - **PASS `sack_carry`** with its sack (grain_porter `back_sack` / `back_sack_dark`, porter `back_sack_carry`):
    bent forward, the sack stays on the back. Townsman, idler and robed_man have the clip but no sack bound: don't
    cast them in it.
  - **PASS `fend_pole`** with `long_pole_mid` (boatman, grain_porter, porter; robed_man has no pole binding): the
    pole raised overhead in both hands, then thrust level at chest height. Not without the pole (S2's
    `pennant_pole_holder_27810`, robed_man, has none).
  - **PASS `haul_line`** (boatman, grain_porter, carter): forward foot planted, leaning back, hand over hand to the
    chest.
  - **NOT TO USE `pole_boat` → stand-in `stand_pole` + prop `long_pole`.** The body poles (hands together at the
    shoulder, push down, bend deep), but the pole (`long_pole_low`) rides the right hand rigidly and swings up with
    the wrist: horizontal at 1.3 s, straight up at 5.3 s, pointing at the sky for about two thirds of the 7.9 s
    cycle, so it reads as waving a pole. Areas: S2 `boatman_poling_24730`, S3's five `pole_boat` boatmen.
  - **NOT TO USE `chase_run` → stand-in `run`.** Both arms stay straight out sideways at shoulder height for the
    whole run on every cast (idler, bearer, inspector). The take itself does it: in
    `gen/motions/chase_run/msy_B7y3/motion_smpl.glb` the shoulders stay within about 20° of the T-pose rest. It reads as
    an aeroplane, not one arm thrust forward. Areas: S1's three `groom_chasing_*`.
  - **retake wanted: `chase_run`** — the arms stay in the T-pose for the whole run. Stand-in `run`. Prompt hint:
    say where both arms are and how high, e.g. "right arm reaching forward at chest height, the hand open; left arm
    bent at the elbow, pumping low at his side; arms never out to the sides".
  - **retake wanted: `pole_boat`** — the grip hand turns over, so the rigid pole points up for two thirds of the
    cycle. Stand-in `stand_pole` + `long_pole`. Prompt hint: "both fists stay locked one above the other on a pole
    that keeps the same slant, down in front of him into the water, from start to end; the wrists don't turn; he
    walks his hands down the pole as he bends, then lifts it hand over hand", and read it with `?props=long_pole_low`.
- take review done 18:36
- 2026-10-12 18:42 (restart run) · **workshop paid run started** on the new account `msy_VYNl` (1,100 credits): the
  seven characters straw_hat, dark_hat, tracker, farmer, groom, youth and official_rider (sheets read against their
  crops: all match; meshes running), and 23 takes (catalogue items 13–43, all but `floor_write`, which S4b's casting
  doesn't ask for: its official plays `write`). Not made, judged free: `woman_pale` (item 45: the recolour reads as
  S7's pale-robed women, `gen/characters/woman_pale/recolour_check.jpg`) and the buffalo body (item 46: the ox-body
  buffalo reads, `gen/animals/buffalo/clips_gpu.jpg`). Nothing new is in `characters.json` yet; the next lines say
  what landed. Existing characters' configs list the new takes' clips (built only after "take review done").
- 2026-10-12 19:05 (restart run) · **paid run: seven new characters landed** (account `msy_VYNl`; `characters.json`,
  KTX2 PASS): `straw_hat` 516 KB, `dark_hat` 435 KB, `tracker` 294 KB, `farmer` 341 KB, `groom` 336 KB, `youth`
  316 KB (1.45 m), `official_rider` 270 KB. Each mesh matches its sheet and crop (`gen/characters/<name>/views.jpg`,
  clip sheets `clips_paid4.jpg`). Props bound as the interim casts had them (`characters/props.json`): straw_hat
  `pole_shallow_baskets`, `pole_bundles`, `pole_bundles_small`, `staff_walk`, `stick` (on `drive_donkeys`),
  `stick_shoulder`, `long_pole`, `long_pole_low`; dark_hat `pole_baskets`, `bundle_small` (on `walk_hold_chest`),
  `back_tall_bundle`, `tray`; tracker `straw_cape`; farmer `hoe` (on idle, over the shoulder); groom `staff` (over the
  shoulder, idle), `hat_on_back` (chase_run); official_rider `stick` (ride). The woman's `child_on_lap` now rides
  `sit_hold_child` (S7's seated woman). Serves S7, S4b, S3, S2, S1.
- 2026-10-12 19:05 (restart run) · **paid run: takes landed and read on the GPU** (frame sheets
  `gen/characters/<cast>/clips_paid4.jpg`; one cast each, same frames on every rig):
  - **PASS `chase_run`** (retake on `msy_VYNl`, groom, idler, inspector, bearer): one arm thrust forward, the other
    bent back, arms never out to the sides. Replaces the stand-in `run`; bind `hat_on_back` with it on the groom.
  - PASS: `wave_arms` (boatman, robed_man), `lean_over_seated`, `look_up` (robed_man), `sit_point`, `show_goods_seated`
    (storyteller; take 1 of `sit_offer`), `examine_child` (fortune_teller: hands out at shoulder height, bends deeper
    than painted), `point_way` (scholar), `lean_post_talk` (idler; the lean is slight), `pour_bucket`, `climb_ladder`,
    `tiller_seated` (boatman), `lunge_arms_wide`, `girth` (inspector: reads as tightening a strap only when he faces
    the horse's flank), `rest_on_stick` (porter), `walk_hold_chest` (dark_hat with `bundle_small`), `stand_sleeves`
    (farmer), `hold_horse_neck` (groom), `reach_up_load` (idler: S4b's name for `fend_pole`).
  - Retaken once (plainly wrong, first takes kept in `gen/motions/<take>_take1_msy_VYNl/`): `beckon_lean`,
    `knee_on_stool`, `sit_hold_child`, `sit_offer` (the idler's), `lie_wave`, `hammer_rim` (S4b `wheelwright`),
    `drive_donkeys`; and the `pole_boat` prop fixed (the pole now rides the hips at a fixed slant, not the turning
    wrist). Verdicts in the next line.
- 2026-10-12 19:05 (restart run) · **recast S7 `city_end`** (the new official_rider, groom ×2, dark_hat ×2, woman_pale
  with `sit_hold_child` + `child_on_lap`, examine_child, point_way, lean_post_talk, walk_hold_chest): `make_people.py`
  ("checks: none", nothing left to make), `map_layout S7`, export `--no-boats` (scroll index max 0.57 px), loyalty
  PASS, KTX2 PASS, `people_check` alone `?window=all` PASS (spots −96.2,3.6 and −86.6,5.8 on the walkers' lines; the
  old spot −84.5,7.0 now lies off every walker's path), budget PASS (11.83 MB with kit and cast). Logs
  `gen/sections/city_end/qa/run3/*_paid4.*`.
- 2026-10-12 19:05 (restart run) · **recast S2 `canal`** (tracker ×4, straw_hat ×6, youth ×2, dark_hat ×1; sit_offer,
  lie_wave, sit_point, pour_bucket, climb_ladder, lean_over_seated): `make_people.py` ("checks: none"), `map_layout
  S2`, export `--no-boats` (max 0.73 px), loyalty PASS, KTX2 PASS, `people_check` PASS (11 walkers, 0 stuck), budget:
  download with kit and cast 25.12 MB (27 models, cast 15.27 MB): over the old 20, under the lead's new 28; all else
  PASS (GPU 73.33 of 75). Logs `gen/sections/canal/qa/run3/*_paid4.*`. Retakes may still change clips, not casts.
- 2026-10-12 19:12 (restart run) · **paid run: retakes read** (`gen/characters/<cast>/clips_paid4_retake.jpg`):
  - **PASS `pole_boat`** (retake on `msy_VYNl` with the prop fixed: `long_pole_low` now rides the hips at the fist's
    place, 25° from vertical, so it slants down into the water the whole clip and never turns with the wrist; boatman
    and straw_hat). Replaces the stand-in `stand_pole` + `long_pole`.
  - **PASS `beckon_lean`** (robed_man; the arm rises toward a hail late in the cycle), **PASS `knee_on_stool`**
    (robed_man, sits low, knee up, forearm across it), **PASS `sit_hold_child`** (woman / woman_pale with
    `child_on_lap`; a small lift), **PASS `lie_wave`** (boatman, idler: lies flat and waves the forearm; weak),
    **PASS `wheelwright`** (idler, the `hammer_rim` retake: bent 45°, hands working low; small strikes),
    **PASS `drive_donkeys`** on the straw_hat with its `stick` only (weak: the switch arm is held back at shoulder
    height, no hand on the load); it is taken off the idler, where the crooked arm reads oddly without a switch (S3's
    `donkey_walker_18481` keeps his fallback).
  - `sit_offer`: the retake came out a shrug, so the idler's `sit_offer` is take 1 again
    (`t2m:sit_offer_take1_msy_VYNl`, the storyteller's passing `show_goods_seated`); weak on the idler.
  - Free additions the casts asked for: farmer `drink` (S1 stall customer), townsman `sit_floor` (S2
    `man_seated_canopy_21120`), boatman `knees_up` (S4b `seated_man_cabin_roof_15012`: S4b's script stopped on a
    KeyError without it), robed_man `long_pole_mid` on `fend_pole` (S2's pennant pole holder), boatman `bucket_pour`
    now held in `pour_bucket` (S2's pouring boatman), official_rider `stick` turned down (it crossed his face).
- 2026-10-12 19:12 (restart run) · **recast S4b `outer_road_2`** (boatman ×5 crews; wheelwright, show_goods_seated,
  reach_up_load, rest_on_stick, knee_on_stool, look_up, girth, tiller_seated): `make_people.py` (0 stand-ins, 0
  recasts, nothing left to make), `map_layout S4b`, export `--no-boats` (max 0.56 px), loyalty PASS, KTX2 PASS,
  `people_check` PASS (spots 60.5,17.1 and 71.5,23.9), budget PASS (18.12 MB with kit and cast). Logs
  `gen/sections/outer_road_2/qa/run3/*_paid4.*`. Its script still casts no youth, official_rider or straw_hat (it
  predates them): see the paid run's report.
- 2026-10-12 19:18 (restart run) · **recast S3 `rainbow_bridge`** (straw_hat ×3, dark_hat ×6, tracker ×5, youth ×2,
  groom ×2; `pole_boat` back on its six boatmen with the fixed pole, wave_arms, lie_wave, hold_horse_neck,
  lunge_arms_wide): `make_people.py` ("checks: 0"), `map_layout S3`, export `--no-boats` (max 0.55 px), loyalty
  PASS, KTX2 PASS, `people_check` PASS (8 walkers, 233 figures), budget PASS (26.13 of 28 MB with kit and cast, GPU
  79.63 of 82). Logs `gen/sections/rainbow_bridge/qa/run3/*_paid4.*`.
- 2026-10-12 19:18 (restart run) · **recast S1 `countryside`** (farmer ×9, straw_hat ×3, groom ×3; `chase_run` with
  `hat_on_back`, drive_donkeys + stick, stand_sleeves, beckon_lean, the stall customer's drink): `make_people.py`
  ("checks: none", nothing left to make), `map_layout S1`, export `--no-boats` (max 0.64 px), loyalty PASS, KTX2
  PASS, `people_check` PASS (15 walkers, three road spots), budget PASS (18.29 MB). Logs
  `gen/sections/countryside/qa/run3/*_paid4.*`.
- 2026-10-12 19:18 (restart run) · **S2 `canal` recast again** for the free additions (townsman sit_floor, the pennant
  pole holder's fend_pole + long_pole_mid, pour_bucket + bucket_pour): loyalty, KTX2, `people_check` PASS, budget PASS
  (25.15 of 28 MB). Its poling boatman stays on `stand_pole`: S2's script hard-codes `pole_boat` as not to use.
- Every area's `people.json` checked against `characters.json`: every clip and prop it plays exists (0 missing).
ALL CAST 19:18
- 2026-10-12 ~19:30 (restart run, the lead) · **the owner requests, done:**
  - S4b `make_people.py` now casts `youth_onlooker_13265` → youth, `man_big_hat_12895` and `man_wide_hat_13760` →
    official_rider (the missing `crane` falls back to `idle`), and `boatman_light_hat_15066` → straw_hat.
  - S2 `make_people.py`: `NOT_TO_USE` is empty (both retakes pass), so `boatman_poling_24730` plays `pole_boat` with
    `long_pole_low`.
  - Both areas: `map_layout`, export `--no-boats`, loyalty, KTX2 and budget (18.33 and 25.15 of 28 MB) PASS.
    `people_check` PASS: `qa/run3/people_check_lead_recast.log`.
