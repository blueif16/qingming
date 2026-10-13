"""Write gen/sections/canal/river_plan.json from plan_lines.json (plan.py's output), after checking it:
shared ends between consecutive reaches, built shores never north of their bank tops, the bank >= 0.8 m (perpendicular)
past the seam zone, the south lines as mapped (shore on the water side of its bank top).
    python3 write_plan.py plan_lines.json <out.json> [--dry]"""
import json
import math
import sys

import needs as N
from geo import u_of, interp_uD, line_dist

P = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
E = N.E
lines = P["lines"]
bad = []

# 1. consecutive reaches share their ends exactly; each bank's shore is its reach's north shore
R = N.REACHES
for a, b in zip(R, R[1:]):
    if tuple(lines["water"][a]["shore_n"][-1]) != tuple(lines["water"][b]["shore_n"][0]):
        bad.append(f"{a} -> {b}: north shores don't share their end")
for bid, wid in zip(N.NORTH_BANKS, R):
    if [tuple(p) for p in lines["banks"][bid]["shore"]] != [tuple(p) for p in lines["water"][wid]["shore_n"]]:
        bad.append(f"{bid}: its shore is not {wid}'s north shore")
for a, b in zip(N.NORTH_BANKS, N.NORTH_BANKS[1:]):
    if tuple(lines["banks"][a]["bank_top"][-1]) != tuple(lines["banks"][b]["bank_top"][0]):
        bad.append(f"{a} -> {b}: bank tops don't share their end")
# the ends stay on the mapped ends' u (the seams and the reach joins)
for wid in R:
    m, b_ = E[wid]["lines"]["shore_n"], lines["water"][wid]["shore_n"]
    for i in (0, -1):
        if abs(u_of(*m[i][:2]) - u_of(*b_[i])) > 0.6:
            bad.append(f"{wid} shore_n end {i}: u {u_of(*b_[i]):.1f} vs mapped {u_of(*m[i][:2]):.1f}")
# 2. built north shores never north of their built bank tops (in u, D)
top = []
for bid in N.NORTH_BANKS:
    top += [tuple(p) for p in lines["banks"][bid]["bank_top"]]
top_uD = []
for p in top:
    q = (u_of(*p), p[1])
    if not top_uD or q[0] > top_uD[-1][0] + 1e-6:
        top_uD.append(q)
worst = 0.0
for wid in R:
    for p in lines["water"][wid]["shore_n"]:
        u = u_of(*p)
        t = interp_uD(top_uD, u)
        if t is not None and p[1] > t + 1e-3:
            bad.append(f"{wid}: shore point {p} north of the bank top ({t:.3f})")
# 3. the bank's width (perpendicular), past the seam zone
shore = []
for wid in R:
    shore += [tuple(p) for p in lines["water"][wid]["shore_n"]]
narrow = []
for p in top:
    u = u_of(*p)
    if u < 20750:
        continue
    d = line_dist(p, shore)
    if d < 0.8:
        narrow.append((round(u), round(d, 2)))
if narrow:
    bad.append(f"bank narrower than 0.8 m at {narrow}")
# 4. south banks: shore north of top (the water is north of a south bank)
SOUTH = [k for k, e in E.items() if e["kind"] == "grd" and "bank_top" in (e.get("lines") or {}) and k not in N.NORTH_BANKS]
for sid in SOUTH:
    ln = E[sid]["lines"]
    for p in ln["shore"]:
        u = u_of(*p[:2])
        tl = [(u_of(*q[:2]), q[1]) for q in ln["bank_top"]]
        t = interp_uD(tl, u)
        if t is not None and p[1] < t:
            bad.append(f"{sid}: shore point {p} south of its bank top")
if bad:
    print("PLAN CHECK FAILED:\n  " + "\n  ".join(bad))
    sys.exit(1)

us, dDs = P["u"], P["dD"]
knots = [[u, round(d, 2)] for u, d in zip(us, dDs) if (u - us[0]) % 25 == 0]
if knots[-1][0] != us[-1]:
    knots.append([us[-1], round(dDs[-1], 2)])
rows = P["rows"]
walk_min = min(r[2] for r in rows if r[0] >= 20700)
plan = {
    "about": ("S2's river and banks as built (the boats agent, Run 2; gen/sections/canal/boats/plan.py from "
              "sections/canal/layout.json and map/frames/S2.json). The north bank's top and shore move south along "
              "the frame's receding direction (u kept; dX = -dx(u)/77 * dD) by `shift`, so that a clear walk of at "
              "least 3.0 m lies between the north bank's building and structure fronts and the built bank top "
              "(walkable floors counted: the dining terrace, the jetty), and the five trackers' 4 m haul west keeps "
              "them on the flat; the built shore is the mapped shore, or the built bank top less the bank's width "
              "(1.0 m in D, wider where the bank runs aslant, so it is at least 0.8 m across) where the mapped shore "
              "lies closer or north of it, blended over 0.8 m. The water plane goes only to the built bank top. "
              "The south bank and its shores are as mapped. Lines in metres (X east, D north), the shores at the "
              "water's H; the builder passes each reach to kit_boats.water_strip with its lines replaced by these "
              "and builds the ground's banks from `banks` (the bank top at H 0 falling to the shore at the water's H)."),
    "water_H": -0.7,
    "shift": {"about": ("dD (negative = south) of the north bank top by scan u, every 25 px (linear between); 0 on "
                        "the S3 seam (u 20500), at most 1 m of dD per metre along the bank off it, then at most "
                        "0.55 m per metre smoothed; 0 east of u 28160 (the east wharf is wide enough). Things that "
                        "go with the river move by the bank's displacement at their u (river.json moves)."),
              "u_dD": knots},
    "water": {wid: {k: [list(p) for p in v] for k, v in lines["water"][wid].items()} for wid in R},
    "banks": {},
    "checks": {"walk_min_m": round(walk_min, 2),
               "walk_at_seam_m": [r[2] for r in rows if r[0] == 20500][0],
               "bank_min_m_past_u20750": round(min(line_dist(p, shore) for p in top if u_of(*p) >= 20750), 2),
               "tracker_run_m": 4.0},
    "notes": [],
}
for bid in N.NORTH_BANKS:
    plan["banks"][bid] = {k: [list(p) for p in v] for k, v in lines["banks"][bid].items()}
for sid in SOUTH:
    plan["banks"][sid] = {"bank_top": [list(p[:2]) for p in E[sid]["lines"]["bank_top"]],
                          "shore": [list(p[:2]) for p in E[sid]["lines"]["shore"]]}
plan["notes"] = json.load(open("plan_notes.json"))
if "--dry" not in sys.argv:
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1, ensure_ascii=False)
        f.write("\n")
print("PLAN OK", OUT, "walk min", walk_min, "knots", len(knots),
      "points", {w: len(v["shore_n"]) for w, v in lines["water"].items()})
