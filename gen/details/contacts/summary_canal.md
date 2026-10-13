# Contact check (2026-10-13T17:10)

140 people in 1 sections; 140 checked (0 boat crew not covered). 16 people with at least one FAIL; 31 FAILs. Contacts: 20 of 129 FAIL.

Cells: FAIL count / worst value in metres (the figure).

| section | boat_body | contact:boat | contact:floor (placement) | contact:rail | contact:reach | contact:seat (no seat) | contact:structure | contact:table | contact:vehicle | deck_support | stance_soles (placement) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| canal | 1 / 0.073 (boatman_poling_24730) | 3 / 2.255 (boatman_hauling_mast_24140) | 2 / -0.127 (boatman_seated_open_boat_22060) | 5 / 0.6 (boatman_leaning_20558) | 1 / 1.54 (boatman_pole_20495) | 2 / 0.427 (boatman_seated_open_boat_22060) | 2 / 0.6 (boatman_on_ladder_23275) | 2 / 0.143 (man_leaning_over_donkey_29000) | 3 / 1 (windlass_man_aft_24660) | 3 / -0.09 (boatman_leaning_20558) | 7 / -0.127 (boatman_on_ladder_23275) |

## Worst 30

| # | section | figure | model | class | clip | site | value m | with | note |
|---|---|---|---|---|---|---|---|---|---|
| 1 | canal | boatman_hauling_mast_24140 | boatman | contact:boat | haul_line | palm_L | 2.255 | S2.veh.boat_towed_mast_23632|line_shroud_s |  |
| 2 | canal | boatman_hauling_mast_24140 | boatman | contact:boat | haul_line | palm_R | 2.17 | S2.veh.boat_towed_mast_23632|line_shroud_s |  |
| 3 | canal | boatman_pole_20495 | boatman | contact:reach | fend_pole~out | pole_far | 1.54 | water |  |
| 4 | canal | windlass_man_aft_24660 | boatman | contact:vehicle | push | palm_R | 1 | S2.veh.boat_cargo_hooded_bow_23715|body |  |
| 5 | canal | windlass_man_aft_24660 | boatman | contact:vehicle | push | palm_L | 0.985 | S2.veh.boat_cargo_hooded_bow_23715|body |  |
| 6 | canal | boatman_leaning_20558 | boatman | contact:rail | reach_over_rail | belly | 0.6 |  | nothing within 0.6 m |
| 7 | canal | boatman_standing_20615 | boatman | contact:rail | lean_over | palm_L | 0.6 |  | nothing within 0.6 m |
| 8 | canal | boatman_standing_20615 | boatman | contact:rail | lean_over | palm_R | 0.6 | body |  |
| 9 | canal | boatman_on_ladder_23275 | boatman | contact:structure | climb_ladder | palm_R | 0.6 | body |  |
| 10 | canal | boatman_on_ladder_23275 | boatman | contact:structure | climb_ladder | palm_L | 0.578 | body |  |
| 11 | canal | boatman_seated_open_boat_22060 | inspector | contact:seat (no seat) | sit | seat | 0.427 |  | no seat under the seat point (107/107 samples): only the ground; nearest seat-high piece body 0.368 m away in plan (top 0) |
| 12 | canal | man_leaning_over_donkey_29000 | robed_man | contact:seat (no seat) | lean_over_seated | seat | 0.204 | S2.prop.bench_29030 | no seat under the seat point (64/80 samples): only the ground |
| 13 | canal | tracker_lead_21867 | tracker | contact:boat | idle | shoulder | 0.176 | S2.veh.boat_towed_mast_23632|line_tow | the tow line ends at the root + 1.3 m (boats.js), 0.176 m from his nearer shoulder top |
| 14 | canal | man_leaning_over_donkey_29000 | robed_man | contact:table | lean_over_seated | forearm_L | 0.143 | S2.prop.bench_29030 |  |
| 15 | canal | boatman_seated_open_boat_22060 | inspector | contact:floor (placement) | sit | sole_L | -0.127 | body | the clip's own sole_L height -0.017 m (placement) |
| 16 | canal | boatman_on_ladder_23275 | boatman | stance_soles (placement) |  |  | -0.127 | body | the stance foot is inside body (a surface 0.127 m above the sole) |
| 17 | canal | man_leaning_over_donkey_29000 | robed_man | contact:table | lean_over_seated | forearm_R | 0.118 | S2.prop.bench_29030 |  |
| 18 | canal | figure_in_windlass_24713 | boatman | contact:vehicle | push~figure_in_windlass_24713 | palm_R | 0.106 | S2.veh.boat_cargo_hooded_bow_23715|body |  |
| 19 | canal | boatman_leaning_20558 | boatman | stance_soles (placement) |  |  | -0.092 | body | the stance foot is inside body (a surface 0.092 m above the sole) |
| 20 | canal | boatman_leaning_20558 | boatman | deck_support |  |  | -0.09 | S2.veh.boat_mat_cargo_21055 | the root -0.09 m under the visible S2.veh.boat_mat_cargo_21055/body (rope__nocol) |
| 21 | canal | passenger_leaning_in_bay_23385 | woman | contact:rail | lean_chin~passenger_leaning_in_bay_23385 | elbow_L | 0.087 | body |  |
| 22 | canal | windlass_man_aft_24660 | boatman | deck_support |  |  | -0.085 | S2.veh.boat_cargo_hooded_bow_23715 | the root -0.085 m under the visible S2.veh.boat_cargo_hooded_bow_23715/body (lattice__nocol) |
| 23 | canal | boatman_seated_open_boat_22060 | inspector | contact:floor (placement) | sit | sole_R | -0.081 | body | the clip's own sole_R height 0.018 m (placement) |
| 24 | canal | boatman_poling_24730 | boatman | boat_body | pole_boat~hold |  | 0.073 | S2.veh.boat_cargo_hooded_bow_23715|body | S2.veh.boat_cargo_hooded_bow_23715/body 0.073 m into the torso (hips to neck, 0.12 m round) |
| 25 | canal | man_leaning_casks_25650 | boatman | contact:rail | lean_over~man_leaning_casks_25650 | palm_R | 0.069 | body |  |
| 26 | canal | boatman_pouring_bucket_22665 | boatman | stance_soles (placement) |  |  | 0.054 |  | clip sole height -0.001 m (placement) |
| 27 | canal | boatman_poling_24730 | boatman | stance_soles (placement) |  |  | -0.052 | body | the stance foot is inside body (a surface 0.052 m above the sole) |
| 28 | canal | sweepman_capped_22208 | inspector | stance_soles (placement) |  |  | -0.05 | body | the stance foot is inside body (a surface 0.05 m above the sole) |
| 29 | canal | windlass_man_aft_24660 | boatman | stance_soles (placement) |  |  | -0.044 | body | the stance foot is inside body (a surface 0.044 m above the sole) |
| 30 | canal | crewman_crouching_24125 | boatman | stance_soles (placement) |  |  | -0.041 | body | the stance foot is inside body (a surface 0.041 m above the sole) |

## Clip-level sole offsets (one fix per character clip)

| model | clip | site | clip's own sole height m | figures |
|---|---|---|---|---|

## FAILs per clip

- stance_soles: 7
- deck_support: 3
- lean_over:contact:rail: 2
- sit:contact:floor: 2
- climb_ladder:contact:structure: 2
- haul_line:contact:boat: 2
- push:contact:vehicle: 2
- lean_over_seated:contact:table: 2
- fend_pole~out:contact:reach: 1
- reach_over_rail:contact:rail: 1
- idle:contact:boat: 1
- sit:contact:seat: 1
- lean_chin~passenger_leaning_in_bay_23385:contact:rail: 1
- push~figure_in_windlass_24713:contact:vehicle: 1
- pole_boat~hold:boat_body: 1
- lean_over~man_leaning_casks_25650:contact:rail: 1
- lean_over_seated:contact:seat: 1
