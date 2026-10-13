"""How far the five trackers can walk west with 逆水行舟 (the page moves each hauler by the boat's travel along its
heading, on the ground there): for each step s, every tracker on land (D at least MARGIN north of the built bank top
at its u), clear of fronts, of the other figures and of the props, and of the trees' trunks.
    python3 trackers.py plan_lines.json [boat dX dD]"""
import json
import math
import sys

import needs as N
from geo import u_of, interp_uD, shape_dist

P = json.load(open(sys.argv[1]))
mv = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (0.0, 0.0)
us, dDs = P["u"], P["dD"]
MARGIN = 0.4
E = N.E
b = E["S2.veh.boat_towed_mast_23632"]["pts"]
fx, fy = b["front"][0] - b["rear"][0], b["front"][1] - b["rear"][1]
L_ = math.hypot(fx, fy)
fx, fy = fx / L_, fy / L_
TR = [f for f in N.L["figures"] if f["map_id"].startswith("S2.fig.tracker_")]
others = [f for f in N.L["figures"] if not f["map_id"].startswith("S2.fig.tracker_") and f.get("support") == "ground"]
props = [(mid, e) for mid, e in E.items() if e["kind"] == "prop" and e.get("support") == "ground"]
trees = N.L["trees"]


def dD_at(u):
    if u <= us[0]:
        return dDs[0]
    if u >= us[-1]:
        return dDs[-1]
    i = min(int((u - us[0]) // 5), len(us) - 2)
    t = (u - us[i]) / 5.0
    return dDs[i] + t * (dDs[i + 1] - dDs[i])


def why_not(p):
    u = u_of(*p)
    t = interp_uD(N.NB_uD, u)
    if t is not None and p[1] < t + dD_at(u) + MARGIN:
        return f"bank (top {t + dD_at(u):.2f})"
    for mid, sh in N.fronts.items():
        if shape_dist(p, sh) < 0.35:
            return mid
    for f in others:
        if math.hypot(p[0] - f["X"], p[1] - f["D"]) < 0.65:
            return f["map_id"]
    for mid, e in props:
        if math.hypot(p[0] - e["pos"][0], p[1] - e["pos"][1]) < 0.8:
            return mid
    for t_ in trees:
        if math.hypot(p[0] - t_["X"], p[1] - t_["D"]) < 0.6:
            return t_["map_id"]
    return None


for f in TR:
    print(f["map_id"], f["X"], f["D"], "start:", why_not((f["X"], f["D"])))
best = None
for i in range(0, 300):
    s = 0.1 * i
    for f in TR:
        p = (f["X"] + fx * s, f["D"] + fy * s)
        w = why_not(p)
        if w:
            best = (s, f["map_id"], w, p)
            break
    if best:
        break
print(f"heading ({fx:.3f}, {fy:.3f}); max run {best[0] - 0.1:.1f} m: then {best[1]} at ({best[3][0]:.2f}, {best[3][1]:.2f}) meets {best[2]}")
