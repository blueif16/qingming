# Character gaps: what waits for the next Meshy account

Written 2026-10-12, during round 2. Every painted figure in the world is placed and animated, but where no matching
character exists yet, an existing character plays the figure as a stand-in. This file lists the characters and takes
still to make, the painted figure each is modelled on, and what plays the figures today. **To finish:** add a Meshy
key (`echo 'msy_…' >> ~/.meshy_keys`), then run the workshop from where it stopped (below).

The full detail is in `gen/expand/round2/catalogue.md`: §1a ranks the paid list, §1b lists every figure each character
plays, and §1c covers the takes. What has landed so far is in `gen/expand/round2/workshop_progress.md`.

## Status, 2026-10-12 19:18: made and cast (the workshop paid run, account `msy_VYNl`, 1,100 → 570)

**Done.** Everything below that was waiting is made and cast, except what is listed under "Left".
- **Characters (7, 210 credits):** straw_hat, dark_hat, tracker, farmer, groom, youth, official_rider. Each plays its
  figures in S7, S3, S2 and S1 (S4b's script doesn't name them yet: see "Left").
- **Takes (23 + 9 retakes, 320 credits):** every item 13–43 except `floor_write`, and the retakes the review wanted
  (`chase_run`, `pole_boat`) plus seven of the new takes once each (`beckon_lean`, `knee_on_stool`, `sit_hold_child`,
  `sit_offer`, `lie_wave`, `hammer_rim`, `drive_donkeys`). Verdicts in `workshop_progress.md`.
- **Recast:** S7, S4b, S3, S2 and S1 (`make_people.py` → `map_layout` → export `--no-boats` → loyalty, KTX2,
  `people_check`, budget: all PASS under the lead's 28 MB cast budget).

**Left (not made, on purpose):**
- `woman_pale` (item 45): the free recolour reads as S7's pale-robed women.
- The buffalo body (item 46): the free ox-body buffalo reads.
- `floor_write` (item 41): S4b's casting plays its official's `write` at his desk and never asks for it.
- Weak but used (the user's look decides): `drive_donkeys` (straw_hat; the switch arm is held back high, no hand on
  the load), `lie_wave` (lies flat, waves the forearm), the idler's `sit_offer` (take 1), `sit_hold_child` (a small lift).
- Requests to the areas' owners (not the workshop's files): S4b's `make_people.py` still casts its youth
  (`youth_onlooker_13265`), its two broad-hatted men (`man_big_hat_12895`, `man_wide_hat_13760`, official_rider) and
  its light-hatted boatman (`boatman_light_hat_15066`, straw_hat) on the old characters; S2's `make_people.py`
  hard-codes `NOT_TO_USE = {'pole_boat', 'chase_run'}`, so its poling boatman (`boatman_poling_24730`) still plays
  `stand_pole` though `pole_boat` now passes.

## Made on the account in use (151 credits, being made now)

The boatman (76 crew in S4b, S3 and S2), the grain porter (15), and the takes `work_sweep`, `reach_over_rail`,
`tow_walk`, `sack_carry`, `pole_boat`, `fend_pole`, `haul_line` and `chase_run`, with one retake allowance. Check
`workshop_progress.md` for what actually landed.

## Waiting for the next account (about 545 credits; one ~1,100 account covers it)

**Characters** (about 30 credits each), ranked by figures served. Each is modelled on one painted figure: its map ID,
plus the scan crop `[u0, v0, u1, v1]`.

| # | character | figures (S7 / S4b / S3 / S2 / S1) | model figure and crop | played today by |
|---|---|---|---|---|
| 10 | straw_hat (labourer) | 13 (– / 1 / 3 / 6 / 3) | `S3.fig.porter_straw_hat_17762` [17689, 1511, 17803, 1729] | hat_traveller (a traveller's long robe, not a labourer's jacket), idler, carter |
| 14 | dark_hat | 9 (2 / – / 6 / 1 / –) | `S7.fig.porter_baskets_1255` [1206, 1051, 1309, 1248] | hat_traveller (a light straw cone, not a dark broad hat), porter, inspector |
| 15 | tracker (纤夫) | 9 (– / – / 5 / 4 / –) | `S2.fig.tracker_rear_22172` [22134, 283, 22190, 390] | idler, porter, carter |
| 16 | farmer | 9 (– / – / – / – / 9) | `S1.fig.man_with_stick_29205` [29162, 941, 29246, 1102] | soldier, scholar and others (town dress) |
| 17 | groom | 7 (2 / – / 2 / – / 3) | `S7.fig.groom_1698` [1637, 1069, 1751, 1287] | inspector (an official's robe), idler |
| 21 | youth | 5 (– / 1 / 2 / 2 / –) | `S3.fig.youth_round_face_18643` [18610, 358, 18670, 473] | child models scaled up 1.25–1.4× |
| 22 | official_rider | 3 (1 / 2 / – / – / –) | `S7.fig.official_rider_1610` [1550, 975, 1680, 1215] (the scroll's last figure) | hat_traveller |
| 45 | woman_pale (optional) | 2 (2 / – / – / – / –) | `S7.fig.standing_woman_1567` [1545, 712, 1595, 895] | woman (a free recolour may do) |

**Takes** (10 credits each; made once, retargeted to every character for free): `drive_donkeys` (S1's charcoal drivers),
`wave_arms`, `sit_offer`, `lie_wave`, `hammer_rim` (S4b's wheelwright), `examine_child`, `sit_hold_child`, `point_way`
(S7's doctor's shop), then the optional single-figure tail: `sit_point`, `hold_horse_neck`, `lunge_arms_wide`,
`pour_bucket`, `climb_ladder`, `stand_sleeves`, `beckon_lean`, `lean_over_seated`, `look_up`, `tighten_girth`,
`knee_on_stool`, `rest_load_stick`, `seated_tiller`, `floor_write`, `lean_post_talk`, `walk_hold_chest`. Each one's
model figure and crop is in catalogue §1a (items 13–43). Until they land, the figures play the closest existing clip.

**Animal body** (15 credits, only if needed): S1's water buffalo (`S1.ani.water_buffalo_lying_29462` [29350, 670, 29505,
795]), if the free one built from the ox body doesn't read.

## How to finish (a later session)

1. Add the key, then `tools/meshy_key.sh status`.
2. Run the workshop on catalogue §8 (a) from the first item `workshop_progress.md` hasn't marked done, in rank order
   (skill `characters`; switch accounts only between characters).
3. After each delivery, for each area it serves (`city_end`, `outer_road_2`, `rainbow_bridge`, `canal`,
   `countryside`): rerun `gen/sections/<folder>/make_people.py` (it already names the new casts), then
   `node tools/map_layout.mjs <S>`, `node tools/export_web_scene.mjs <folder>`, `node tools/loyalty_check.mjs <S>`,
   `node tools/ktx2.mjs encode` and `check`, and `people_check` at `?window=all`.
4. Redeploy with `tools/deploy_web.sh`.
