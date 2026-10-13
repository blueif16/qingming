"""The north bank's need for a shift, by scan u (S2 Run 2, boats agent): for each u, the least move south (dD <= 0)
of the mapped bank top along the receding direction that gives a clear walk of WALK m from every building and
structure front, CLEAR m past every prop and figure standing on the strip, and the trackers their spots on land.
Walkable floors (the terrace, the jetty) extend the walk south. Writes needs.json; prints the need by stretch.
    python3 needs.py [WALK]"""
import json
import os
import math
import sys

from geo import QM, u_of, X_of, k_of, shift, shape_dist, interp_uD, pip, poly_dist, line_dist

WALK = float(os.environ.get("WALK", "3.0"))
CLEAR = 1.2          # a walker passes a prop or a figure on the river side
L = json.load(open(os.environ.get("PLAN_LAYOUT") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "layout_premoves.json")))
E = L["entities"]
NORTH_BANKS = ["S2.grd.north_bank_20500", "S2.grd.north_bank_22550", "S2.grd.bank_n_23300", "S2.grd.north_bank_26000"]
REACHES = ["S2.water.bian_river_w", "S2.water.bian_river_w2", "S2.water.bian_river_m", "S2.water.bian_river_e"]


def chain(lines):
    out = []
    for ln in lines:
        for p in ln:
            p = (p[0], p[1])
            if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > 1e-6:
                out.append(p)
    return out


NB = chain([E[k]["lines"]["bank_top"] for k in NORTH_BANKS])
NS = chain([E[k]["lines"]["shore_n"] for k in REACHES])
NB_uD = [(u_of(*p), p[1]) for p in NB]
NS_uD = [(u_of(*p), p[1]) for p in NS]

FLOORS = {"S2.bld.river_terrace_23250": E["S2.bld.river_terrace_23250"]["footprint"],
          "S2.str.jetty_27260": E["S2.str.jetty_27260"]["footprint"]}
SKIP = set(FLOORS) | {"S2.str.landing_steps_22950"}

# fronts: every building and structure on the north side (side > -0.5 m), as its footprint or base line
fronts = {}
for mid, e in E.items():
    if e["kind"] not in ("building", "structure") or mid in SKIP or e.get("side", 0) < -0.5:
        continue
    if e.get("footprint"):
        fronts[mid] = ("poly", [tuple(p[:2]) for p in e["footprint"]])
    elif (e.get("lines") or {}).get("base"):
        fronts[mid] = ("line", [tuple(p[:2]) for p in e["lines"]["base"]])
    elif e.get("pts"):
        pts = [tuple(v[:2]) for k, v in e["pts"].items() if not k.endswith("_top")]
        fronts[mid] = ("line", pts)

# props and figures on the strip (on the ground, between the fronts and the bank): a walker passes them
TRACKERS = [f for f in L["figures"] if f["map_id"].startswith("S2.fig.tracker_")]
strip = {}
for mid, e in E.items():
    if e["kind"] not in ("prop", "animal", "vehicle") or mid.split(".")[-1].startswith("boat_"):
        continue
    if e.get("support") != "ground" or not (-1.0 <= e.get("side", 99) <= 4.5):
        continue
    if any(w in mid for w in ("mooring", "coiled_rope", "stake_")):
        continue           # bank things: they go with the river (moves), not obstacles to it
    r = 1.6 if "cart" in mid and "mule" in mid else (0.6 if e["kind"] == "animal" else 0.5)
    strip[mid] = ("pt", tuple(e["pos"][:2]), r)
for f in L["figures"]:
    if f.get("support") != "ground" or not (-1.0 <= f.get("side", 99) <= 4.5):
        continue
    strip[f["map_id"]] = ("pt", (f["X"], f["D"]), 0.35)
# each strip thing: on land (north of the built bank top), and where a walker can't pass it on its north side (less
# than PASS m to the nearest front), CLEAR m of walk on its south side
PASS = 1.4
strip_need = {}
for mid, sh in list(strip.items()):
    u = u_of(*sh[1])
    D0 = interp_uD(NB_uD, u)
    if D0 is None or sh[1][1] < D0 - 0.6:
        del strip[mid]          # on the slope or in the water: not on the strip
        continue
    north = min(shape_dist(sh[1], f) for f in fronts.values()) - sh[2]
    strip_need[mid] = CLEAR if north < PASS else 0.3


def floor_edge(u):
    """the south edge of a walkable floor at scan u: (D, floor id) or None"""
    best = None
    for fid, fp in FLOORS.items():
        # sample the polygon's boundary along this u-line: the southmost point of the polygon at u
        Ds = []
        for i in range(len(fp)):
            a, b = fp[i], fp[(i + 1) % len(fp)]
            ua, ub = u_of(*a), u_of(*b)
            if (ua - u) * (ub - u) <= 0 and abs(ub - ua) > 1e-9:
                t = (u - ua) / (ub - ua)
                Ds.append(a[1] + t * (b[1] - a[1]))
        if Ds and (best is None or min(Ds) < best[0]):
            best = (min(Ds), fid)
    return best


def need_at(u, walk=WALK, clear=CLEAR, use_strip=True):
    """(dD, binding obstacle id) for the bank-top point at scan u."""
    D0 = interp_uD(NB_uD, u)
    if D0 is None:
        return 0.0, None
    p0 = (X_of(u, D0), D0)
    fl = floor_edge(u)
    k = k_of(u)
    last = None
    for i in range(0, 400):
        dD = -0.02 * i
        p = (p0[0] + k * dD, p0[1] + dD)
        wp = p
        if fl and fl[0] < p[1]:          # the floor reaches further south: the walk's edge is the floor's
            wp = (X_of(u, fl[0]), fl[0])
        bad = None
        for mid, sh in fronts.items():
            if shape_dist(wp, sh) < walk - 1e-6:
                bad = mid
                break
        if not bad and use_strip:
            for mid, sh in strip.items():
                c = strip_need[mid] if clear == CLEAR else clear
                if shape_dist(p, sh) < c - 1e-6 or (abs(sh[1][0] - p[0]) < sh[2] + 0.3 and sh[1][1] < p[1] + 0.3):
                    bad = mid
                    break
        if not bad:
            return dD, last
        last = bad
    return -8.0, last


if __name__ == "__main__":
    U = list(range(20500, 28972, 5))
    res = []
    for u in U:
        dD, why = need_at(u)
        res.append((u, round(dD, 2), why))
    json.dump({"walk": WALK, "clear": CLEAR, "need": res, "NB": NB, "NS": NS}, open("needs.json", "w"), indent=0)
    # print by stretch
    cur = None
    for u, dD, why in res:
        key = (round(dD * 2) / 2, why)
        if cur is None or key != cur[0]:
            if cur:
                print(f"u {cur[1]:5d}-{cur[2]:5d}  need {cur[0][0]:+5.1f}  min {cur[3]:+5.2f}  {cur[0][1]}")
            cur = [key, u, u, dD]
        else:
            cur[2] = u
            cur[3] = min(cur[3], dD)
    print(f"u {cur[1]:5d}-{cur[2]:5d}  need {cur[0][0]:+5.1f}  min {cur[3]:+5.2f}  {cur[0][1]}")
