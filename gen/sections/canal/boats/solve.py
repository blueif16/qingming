"""Place S2's boats one by one (the boats agent, Run 2; after S4b's solve.py): each boat starts from its base move
(the bank's displacement at its u for the boats moored along the north bank) and takes the cheapest further move,
along its own axis (`a`, m) and outward over open water (`o`, m, along `out`), that puts its whole gunwale outline in
the water and at least GAP from every boat placed before it (and its run, for a boat under way).
    python3 solve.py solve_in.json boats_plan.json
solve_in.json: {"_order": [...], "_gap": 0.2, map_id: {kind, lw, beam, sweep?, run?, dX0, dD0, out: [x, y] | null,
                 a: [lo, hi], o: [lo, hi], wa: cost per m along, near: max gap to the north shore (bank boats)}}"""
import json
import math
import sys

import boat_plan as bp

cfg = json.load(open(sys.argv[1]))
order = cfg.pop("_order")
GAP = cfg.pop("_gap", 0.2)
placed = {}
res = {}
for i, (px, py, pr) in enumerate(cfg.pop("_posts", [])):   # posts standing in the water: a boat keeps clear of them
    poly = [(px + pr * math.cos(k * math.pi / 4), py + pr * math.sin(k * math.pi / 4)) for k in range(8)]
    placed[f"post{i}"] = {"ol": poly, "parts": [poly]}
S3S = cfg.pop("_s3", None)          # S3's boats near the seam as obstacles, at this fraction of their types' length
if S3S:
    for mid, b in bp.s3_boats(S3S).items():
        placed[mid] = dict(b, parts=[b["ol"]])


def frange(lo, hi, st):
    n = int(round((hi - lo) / st))
    return [lo + st * i for i in range(n + 1)]


for mid in order:
    c = cfg[mid]
    e = bp.E[mid]
    fr, re = e["pts"]["front"], e["pts"]["rear"]
    h = math.atan2(fr[1] - re[1], fr[0] - re[0])
    ux, uy = math.cos(h), math.sin(h)
    ox, oy = c.get("out") or (0.0, 0.0)
    n = math.hypot(ox, oy) or 1.0
    ox, oy = ox / n, oy / n
    best = None
    if c.get("fixed"):
        b = bp.boat(mid, c, e)
        placed[mid] = b
        res[mid] = {k: v for k, v in c.items() if k not in ("out", "a", "o", "wa", "near", "land_tol", "fixed")}
        print(f"{mid.split('.')[-1]:30s} fixed ({c['dX']:+.2f}, {c['dD']:+.2f})  on land {bp.on_land(b['ol']):.2f}", flush=True)
        continue
    A = frange(*c.get("a", [0, 0]), 0.25)
    O = frange(*c.get("o", [0, 0]), 0.1)
    for a in A:
        for o in O:
            cost = c.get("wo", 1.0) * abs(o) + c.get("wa", 0.6) * abs(a)
            if best and cost >= best[0]:
                continue
            dX = c.get("dX0", 0.0) + a * ux + o * ox
            dD = c.get("dD0", 0.0) + a * uy + o * oy
            cc = dict(c, dX=dX, dD=dD)
            b = bp.boat(mid, cc, e)
            if bp.on_land(b["ol"]) > c.get("land_tol", 0.03):
                continue
            if b.get("run_parts") and max(bp.on_land(q) for q in b["run_parts"]) > c.get("land_tol", 0.03):
                continue
            ok = True
            for pid, pb in placed.items():
                g = min(bp.min_gap(p, q) for p in b["parts"] for q in pb["parts"])
                if g < GAP:
                    ok = False
                    break
                for X_, Y_ in ((b, pb), (pb, b)):
                    if X_.get("run_parts") and min(bp.min_gap(p, q) for p in X_["run_parts"] for q in Y_["parts"]) < GAP:
                        ok = False
                        break
                if not ok:
                    break
            if not ok:
                continue
            if c.get("near") is not None:
                gap = min(bp._sd(q, bp.NORTH) for q in b["ol"])
                if gap > c["near"]:
                    continue
            best = (cost, a, o, dX, dD, b)
    if best is None:
        print(f"NO FIT {mid}")
        continue
    cost, a, o, dX, dD, b = best
    placed[mid] = b
    out = {k: v for k, v in c.items() if k not in ("dX0", "dD0", "out", "a", "o", "wa", "wo", "near", "land_tol")}
    out.update(dX=round(dX, 2), dD=round(dD, 2), _a=a, _o=round(o, 2))
    res[mid] = out
    gN = min(bp._sd(q, bp.NORTH) for q in b["ol"])
    print(f"{mid.split('.')[-1]:30s} a {a:+5.2f} o {o:4.1f}  move ({dX:+.2f}, {dD:+.2f})  to N shore {gN:4.2f}", flush=True)
json.dump(res, open(sys.argv[2], "w"), indent=1)
