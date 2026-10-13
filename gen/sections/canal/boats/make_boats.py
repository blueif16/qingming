"""S2's boats as built (the boats agent, Run 2): the `boats` block (kit options per boat, each with its reason), the
`moves` of every boat (boats_final.json, from the 2D plan) and of its crew, and `unbuilt`, into boats_choices.json
(write_river.py composes river.json from it). Crew go with their boat, spread along the built hull in their painted
proportion (a figure painted at a boat's end stays at that end of the longer built hull) and brought inside its beam.
    python3 make_boats.py"""
import json
import math

import boat_plan as bp

FIN = json.load(open("boats_final.json"))
E = bp.E
L = bp.L

# kit options (what the map can't say), from the map's what/note, the needs list and the catalogue's presets
KIT = {
    "S2.veh.boat_mat_shelter_20805": dict(kind="small", lw=4.8, beam=1.8, free=0.6, cloths=False,
                                          cargo=[["jar", 0.15, 0.25, "deck"]]),
    "S2.veh.boat_big_cabin_21120": dict(kind="passenger", lw=11.4, beam=3.0, free=0.8,
                                        cabin={"x0": 0.24, "x1": 0.62, "pattern": "house", "roof": "mat", "segs": 2},
                                        stern_house=True, bow_canopy=True,
                                        cargo=[["coil", 0.74, -0.85, "deck"], ["coil", 0.8, -0.85, "deck"],
                                               ["coil", 0.86, -0.85, "deck"]]),
    "S2.veh.boat_mat_cargo_21055": dict(kind="grain", hold="awning", laden=False, lw=12.0, beam=3.1, free=0.8,
                                        cabin={"x0": 0.8, "x1": 0.94, "pattern": "house", "roof": "mat", "segs": 1},
                                        cargo=[["coil", 0.25, 0.45, "deck"], ["jar", 0.97, -0.3, "deck"]]),
    "S2.veh.boat_skiff_21080": dict(kind="small", awning=False, lw=4.8, beam=1.5, free=0.45, cargo=[]),
    "S2.veh.boat_covered_21205": dict(kind="small", lw=4.8, beam=1.7, free=0.6, cloths=False,
                                      cargo=[["basket", 0.12, 0.0, "deck"]]),
    "S2.veh.boat_open_21968": dict(kind="small", awning=False, lw=4.8, beam=1.6, free=0.45, cargo=[],
                                   moor=[[176.4, 1.76, -0.1]]),
    "S2.veh.boat_sweep_22000": dict(kind="grain", hold="awning", laden=False, lw=12.0, beam=3.4, free=1.4,
                                    sweep="port", cabin=False),
    "S2.veh.boat_mat_roof_22290": dict(kind="small", lw=8.0, beam=2.3, free=0.8, cloths=True,
                                       cargo=[["basket", 0.42, 0.2, "deck"]], moor=[[184.5, -1.6, -0.3]]),
    "S2.veh.boat_passenger_22545": dict(kind="passenger", lw=13.0, beam=3.8, free=0.95,
                                        cabin={"x0": 0.3, "x1": 0.84, "pattern": "passenger", "roof": "board",
                                               "segs": 3, "ladder": [4.5, 1]},
                                        stern_house=True, bow_canopy=True, moor=["S2.prop.mooring_post_23126"],
                                        cargo=[["coil", 0.45, 0.5, "roof"], ["basket", 0.55, -0.45, "roof"],
                                               ["roll", 0.65, 0.0, "roof"], ["basket", 0.74, 0.45, "roof"]]),
    "S2.veh.boat_towed_mast_23632": dict(kind="grain", hold="hatch", laden=False, lw=19.0, beam=4.3, free=0.91,
                                         cabin={"x0": 0.1, "x1": 0.84, "pattern": "passenger", "roof": "mat",
                                                "segs": 3, "wall_h": 1.6},
                                         mast="up", mast_at=0.6, mast_h=10.0, tow_to="tracker_lead_21867",
                                         cargo=[["coil", 0.05, 0.0, "deck"]]),
    "S2.veh.boat_cargo_hooded_bow_23715": dict(kind="grain", hold="hatch", laden=False, lw=13.0, beam=3.8, free=2.0),
    "S2.veh.boat_moored_mat_canopy_25145": dict(kind="grain", hold="awning", laden=False, lw=12.0, beam=3.4, free=2.0,
                                                moor=["S2.prop.mooring_post_25207"],
                                                cargo=[["coil", 0.9, 0.5, "deck"], ["coil", 0.9, -0.5, "deck"]]),
    "S2.veh.boat_mat_cabin_25980": dict(kind="passenger", lw=11.4, beam=3.2, free=1.9,
                                        cabin={"x0": 0.38, "x1": 0.92, "pattern": "boards", "roof": "board", "segs": 2,
                                               "ladder": [8.1, 1]},
                                        stern_house=False, bow_canopy=False,
                                        cargo=[["coil", 0.55, 0.3, "roof"], ["coil", 0.63, 0.3, "roof"],
                                               ["coil", 0.71, 0.3, "roof"]]),
    "S2.veh.boat_grain_27285": dict(kind="grain", hold="laden", laden=True, lw=12.0, beam=3.6, free=0.7,
                                    cabin={"x0": 0.76, "x1": 0.92, "pattern": "house", "roof": "mat", "segs": 1},
                                    gangplank=[262.87, 11.08, 0.0],
                                    moor=[[260.86, 11.38, 0.15], "S2.prop.mooring_stake_27902"]),
    "S2.veh.boat_grain_28095": dict(kind="grain", hold="laden", laden=True, lw=12.0, beam=3.6, free=0.71,
                                    cargo=[["coil", 0.12, 0.5, "deck"], ["coil", 0.16, -0.4, "deck"]]),
    "S2.veh.boat_bottom_28395": dict(kind="small", awning=False, lw=6.0, beam=2.0, free=0.9, cargo=[]),
}
WHY = json.load(open("boats_why.json"))
FIX = json.load(open("crew_fix.json"))["fix"]
MOVE_WHY = json.load(open("boats_move_why.json"))
UNBUILT = {
    "S2.veh.boat_small_bow_22158": {
        "by": "river (boats agent)",
        "why": ("only the bow of a small boat is painted, coming in from below the silk's bottom edge beside the south "
                "bank's flat edge; the map's south shores put the rest of its hull on the flat bank and the spit (no "
                "water south of D -2.3 there), and moved north over open water it would lie across the open boat and "
                "the mat-roofed boat. A bow-only boat at the silk's edge is one of the things the boat kit can't do "
                "yet (brief: listed as waiting on the boat factory, never invented)")},
}

# crew: every figure on a boat support goes with its boat
crew = {}
for f in L["figures"]:
    s = str(f.get("support", ""))
    if s.startswith("boat"):
        crew.setdefault(s.split(": ")[1], []).append(f)
moves = {}
for mid, c in FIN.items():
    e = E[mid]
    fr, re = e["pts"]["front"], e["pts"]["rear"]
    Lp = math.hypot(fr[0] - re[0], fr[1] - re[1])
    ux, uy = (fr[0] - re[0]) / Lp, (fr[1] - re[1]) / Lp
    nx, ny = -uy, ux
    mx, my = (fr[0] + re[0]) / 2, (fr[1] + re[1]) / 2
    dX, dD = c["dX"], c["dD"]
    if abs(dX) > 0.005 or abs(dD) > 0.005:
        moves[mid] = {"dX": round(dX, 2), "dD": round(dD, 2), "why": MOVE_WHY[mid]}
    k = KIT[mid]
    lw, B = k["lw"], k["beam"]
    t_ = bp.TYPES[k["kind"]]
    same = mid == "S2.veh.boat_sweep_22000"
    for f in crew.get(mid, []):
        if same:
            fx = FIX.get(f["id"])
            n_ = fx["nudge"] if fx else [0.0, 0.0]
            moves[f["map_id"]] = {"dX": round(dX + n_[0], 2), "dD": round(dD + n_[1], 2),
                                  "why": f"crew: goes with his boat ({mid}, its painted stern kept), its sweep crew on its after deck"
                                         + (f"; then {fx['why']} (gen/sections/canal/boats/crew_check.json)" if fx else "")}
            continue
        s = (f["X"] - mx) * ux + (f["D"] - my) * uy
        t = (f["X"] - mx) * nx + (f["D"] - my) * ny
        s2 = max(-lw / 2 - t_["oh_s"] + 0.6, min(lw / 2 + t_["oh_b"] - 0.6, s * lw / Lp))
        tmax = max(0.0, B / 2 - 0.5)
        t2 = max(-tmax, min(tmax, t))
        X2 = mx + dX + s2 * ux + t2 * nx
        D2 = my + dD + s2 * uy + t2 * ny
        fx = FIX.get(f["id"])
        if fx and "along" in fx:
            X2 += fx["along"] * ux
            D2 += fx["along"] * uy
        elif fx:
            X2 += fx["nudge"][0]
            D2 += fx["nudge"][1]
        mdX, mdD = round(X2 - f["X"], 2), round(D2 - f["D"], 2)
        extra = []
        if abs(s2 - s) > 0.05:
            extra.append(f"{s2 - s:+.1f} m along it, spread in his painted proportion over the built {lw:g} m hull "
                         f"(painted {Lp:.1f} m)")
        if abs(t2 - t) > 0.05:
            extra.append(f"{t2 - t:+.1f} m across it, inside its {B:g} m beam")
        if fx:
            extra.append("then " + fx["why"] + " (gen/sections/canal/boats/crew_check.json)")
        moves[f["map_id"]] = {"dX": mdX, "dD": mdD,
                              "why": f"crew: goes with his boat ({mid}, moved ({dX:+.2f}, {dD:+.2f}))"
                                     + ("; " + "; ".join(extra) if extra else "")}
boats = {mid: {"kit": KIT[mid], "why": WHY[mid]} for mid in KIT}
json.dump({"boats": boats, "moves": moves, "unbuilt": UNBUILT}, open("boats_choices.json", "w"), indent=1,
          ensure_ascii=False)
print(len(boats), "boats,", len(moves), "moves,", len(UNBUILT), "unbuilt")
