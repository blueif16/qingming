# Contact check (2026-10-13T14:08)

140 people in 1 sections; 140 checked (0 boat crew not covered). 24 people with at least one FAIL; 45 FAILs. Contacts: 20 of 129 FAIL.

Cells: FAIL count / worst value in metres (the figure).

| section | boat_body | contact:boat | contact:floor | contact:floor (placement) | contact:rail | contact:reach | contact:seat (no seat) | contact:structure | contact:table | contact:vehicle | deck_support | head_through | stance_soles (placement) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| canal | 1 / 0.077 (boatman_poling_24730) | 4 / 2.265 (boatman_hauling_mast_24140) | 1 / 0.041 (man_seated_canopy_21120) | 2 / -0.126 (boatman_seated_open_boat_22060) | 5 / 0.6 (boatman_leaning_20558) | 2 / 1.592 (boatman_pole_20495) | 2 / 0.427 (boatman_seated_open_boat_22060) | 2 / 0.6 (boatman_on_ladder_23275) | 2 / 0.143 (man_leaning_over_donkey_29000) | 3 / 1 (windlass_man_aft_24660) | 8 / -0.126 (boatman_on_ladder_23275) | 1 / 0.175 (bowman_under_hood_23660) | 12 / -0.129 (boatman_on_ladder_23275) |

## Worst 30

| # | section | figure | model | class | clip | site | value m | with | note |
|---|---|---|---|---|---|---|---|---|---|
| 1 | canal | boatman_hauling_mast_24140 | boatman | contact:boat | haul_line | palm_L | 2.265 | S2.veh.boat_towed_mast_23632|line_shroud_s |  |
| 2 | canal | boatman_hauling_mast_24140 | boatman | contact:boat | haul_line | palm_R | 2.179 | S2.veh.boat_towed_mast_23632|line_shroud_s |  |
| 3 | canal | boatman_pole_20495 | boatman | contact:reach | fend_pole~out | pole_far | 1.592 | water |  |
| 4 | canal | windlass_man_aft_24660 | boatman | contact:vehicle | push | palm_R | 1 | S2.veh.boat_cargo_hooded_bow_23715|body |  |
| 5 | canal | windlass_man_aft_24660 | boatman | contact:vehicle | push | palm_L | 0.986 | S2.veh.boat_cargo_hooded_bow_23715|body |  |
| 6 | canal | boatman_fending_off_23688 | boatman | contact:reach | fend_pole~out | pole_far | 0.707 | S2.veh.boat_passenger_22545|body |  |
| 7 | canal | boatman_leaning_20558 | boatman | contact:rail | reach_over_rail | belly | 0.6 |  | nothing within 0.6 m |
| 8 | canal | boatman_standing_20615 | boatman | contact:rail | lean_over | palm_L | 0.6 |  | nothing within 0.6 m |
| 9 | canal | boatman_standing_20615 | boatman | contact:rail | lean_over | palm_R | 0.6 | body |  |
| 10 | canal | boatman_on_ladder_23275 | boatman | contact:structure | climb_ladder | palm_R | 0.6 | body |  |
| 11 | canal | boatman_on_ladder_23275 | boatman | contact:structure | climb_ladder | palm_L | 0.583 | body |  |
| 12 | canal | boatman_seated_open_boat_22060 | inspector | contact:seat (no seat) | sit | seat | 0.427 |  | no seat under the seat point (107/107 samples): only the ground; nearest seat-high piece body 0.367 m away in plan (top 0) |
| 13 | canal | tracker_lead_21867 | tracker | contact:boat | tow_walk | shoulder | 0.362 | S2.veh.boat_towed_mast_23632|line_tow | the tow line ends at the root + 1.3 m (boats.js), 0.362 m from his nearer shoulder top |
| 14 | canal | man_leaning_over_donkey_29000 | robed_man | contact:seat (no seat) | lean_over_seated | seat | 0.206 | S2.prop.bench_29030 | no seat under the seat point (64/80 samples): only the ground |
| 15 | canal | tracker_lead_21867 | tracker | contact:boat | idle | shoulder | 0.176 | S2.veh.boat_towed_mast_23632|line_tow | the tow line ends at the root + 1.3 m (boats.js), 0.176 m from his nearer shoulder top |
| 16 | canal | bowman_under_hood_23660 | robed_man | head_through | look |  | 0.175 | S2.veh.boat_towed_mast_23632|line_forestay | hips to head top crosses S2.veh.boat_towed_mast_23632/line_forestay in 18% of the samples |
| 17 | canal | man_leaning_over_donkey_29000 | robed_man | contact:table | lean_over_seated | forearm_L | 0.143 | S2.prop.bench_29030 |  |
| 18 | canal | boatman_on_ladder_23275 | boatman | stance_soles (placement) |  |  | -0.129 | body | the stance foot is inside body (a surface 0.129 m above the sole) |
| 19 | canal | boatman_seated_open_boat_22060 | inspector | contact:floor (placement) | sit | sole_L | -0.126 | body | the clip's own sole_L height -0.017 m (placement) |
| 20 | canal | boatman_on_ladder_23275 | boatman | deck_support |  |  | -0.126 | S2.veh.boat_passenger_22545 | the root -0.126 m under the visible S2.veh.boat_passenger_22545/body (timber__nocol) |
| 21 | canal | man_leaning_over_donkey_29000 | robed_man | contact:table | lean_over_seated | forearm_R | 0.119 | S2.prop.bench_29030 |  |
| 22 | canal | figure_in_windlass_24713 | boatman | contact:vehicle | push~figure_in_windlass_24713 | palm_R | 0.107 | S2.veh.boat_cargo_hooded_bow_23715|body |  |
| 23 | canal | sweepman_leaning_on_loom_22285 | boatman | stance_soles (placement) |  |  | -0.105 | body | the stance foot is inside body (a surface 0.105 m above the sole) |
| 24 | canal | sweepman_capped_22208 | inspector | stance_soles (placement) |  |  | -0.102 | body | the stance foot is inside body (a surface 0.102 m above the sole) |
| 25 | canal | sweepman_capped_22242 | boatman | stance_soles (placement) |  |  | -0.097 | body | the stance foot is inside body (a surface 0.097 m above the sole) |
| 26 | canal | passenger_leaning_in_bay_23385 | woman | contact:rail | lean_chin~passenger_leaning_in_bay_23385 | elbow_L | 0.096 | body |  |
| 27 | canal | boatman_leaning_20558 | boatman | stance_soles (placement) |  |  | -0.093 | body | the stance foot is inside body (a surface 0.093 m above the sole) |
| 28 | canal | sweepman_leaning_on_loom_22285 | boatman | deck_support |  |  | -0.091 | S2.veh.boat_sweep_22000 | the root -0.091 m under the visible S2.veh.boat_sweep_22000/body (deck__nocol) |
| 29 | canal | boatman_leaning_20558 | boatman | deck_support |  |  | -0.09 | S2.veh.boat_mat_cargo_21055 | the root -0.09 m under the visible S2.veh.boat_mat_cargo_21055/body (rope__nocol) |
| 30 | canal | windlass_man_aft_24660 | boatman | deck_support |  |  | -0.085 | S2.veh.boat_cargo_hooded_bow_23715 | the root -0.085 m under the visible S2.veh.boat_cargo_hooded_bow_23715/body (lattice__nocol) |

## Clip-level sole offsets (one fix per character clip)

| model | clip | site | clip's own sole height m | figures |
|---|---|---|---|---|

## FAILs per clip

- stance_soles: 12
- deck_support: 8
- fend_pole~out:contact:reach: 2
- lean_over:contact:rail: 2
- sit:contact:floor: 2
- climb_ladder:contact:structure: 2
- haul_line:contact:boat: 2
- push:contact:vehicle: 2
- lean_over_seated:contact:table: 2
- reach_over_rail:contact:rail: 1
- idle:contact:boat: 1
- tow_walk:contact:boat: 1
- sit_floor:contact:floor: 1
- sit:contact:seat: 1
- lean_chin~passenger_leaning_in_bay_23385:contact:rail: 1
- look:head_through: 1
- push~figure_in_windlass_24713:contact:vehicle: 1
- pole_boat~hold:boat_body: 1
- lean_over~man_leaning_casks_25650:contact:rail: 1
- lean_over_seated:contact:seat: 1
