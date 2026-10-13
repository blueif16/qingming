"""gen/sections/canal/boats_people.json: the people.json `boats` block (motion and work; the casting agent's script
copies `boats` into people.json) and its reasons."""
import json
QM = "/home/ran/3d_director/qingming"
TRACKERS = ["tracker_lead_21867", "tracker_bent_21939", "tracker_hatched_coat_21994", "tracker_broad_hat_22057",
            "tracker_rear_22172"]
boats = {
    "boat_towed_mast_23632": {
        "run_m": 4.0, "speed_mps": 0.5, "pause_s": [8, 3],
        "haul": {t: {} for t in TRACKERS},
        "tow": "tracker_lead_21867",
        "crew": {"bowman_under_hood_23660": {}},
    },
    "boat_sweep_22000": {
        "run_m": 4.0, "speed_mps": 0.6, "pause_s": [8, 3],
        "crew": {"sweepman_leaning_back_22110": {"work": "sweep"}, "sweepman_head_back_22132": {"work": "sweep"},
                 "sweepman_upright_22168": {"work": "sweep"}, "sweepman_capped_22208": {"work": "sweep"}},
    },
    "boat_big_cabin_21120": {"crew": {"steersman_stern_21678": {}}},
    "boat_mat_cabin_25980": {"crew": {"man_stern_hood_26750": {}}},
    "boat_grain_27285": {"crew": {"steersman_27890": {}}},
}
why = json.load(open("people_why.json"))
json.dump({"about": ("people.json `boats` for S2 (the boats agent, Run 2; web/src/boats.js): how the boats painted under "
                     "way move and who works them; every other boat is moored (rides the water at its place). "
                     "make_people.py copies `boats` into sections/canal/people.json."),
           "boats": boats, "why": why}, open(f"{QM}/gen/sections/canal/boats_people.json", "w"), indent=1, ensure_ascii=False)
print("boats_people.json:", list(boats))
