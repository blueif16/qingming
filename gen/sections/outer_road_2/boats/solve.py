"""Greedy stack: boats south -> north; each moved east (outward) until its waterline is in the water with its stem
at the shore, and north (dD) only as far as its south neighbours need (gap >= GAP). Uses boat_plan's geometry."""
import json, math, sys, importlib.util, io, contextlib
spec = importlib.util.spec_from_file_location("bp", "boat_plan.py")
ARGS = list(sys.argv)
cfg = json.load(open(ARGS[1]))
order = cfg.pop("_order")
GAP = cfg.pop("_gap", 0.2)
far = cfg.get("_far_dD", 0.0)
tmp = dict(cfg); json.dump(tmp, open("_tmp_plan.json", "w"))
sys.argv = ["bp", "_tmp_plan.json", "_tmp.svg"]
with contextlib.redirect_stdout(io.StringIO()):
    bp = importlib.util.module_from_spec(spec); spec.loader.exec_module(bp)
L = bp.L
def build(mid, dX, dD):
    c = cfg.get(mid, {}); kind = c["kind"]; t = bp.TYPES[kind]
    lw, B = c.get("lw", t["lw"]), c.get("beam", t["beam"])
    p = L["entities"][mid]["pts"]
    fr = (p["front"][0] + dX, p["front"][1] + dD); re = (p["rear"][0] + dX, p["rear"][1] + dD)
    cen = ((fr[0] + re[0]) / 2, (fr[1] + re[1]) / 2)
    ol, _ = bp.place(bp.outline(kind, lw, B), fr, re, lw, cen)
    wl, _ = bp.place(bp.waterline(kind, lw, B), fr, re, lw, cen)
    stem = bp.place([(lw, 0.0)], fr, re, lw, cen)[0][0]
    return ol, wl, stem
def on_land(wl):
    return max([bp.poly_dist(q, bp.water) for q in wl if not bp.pip(q, bp.water)] or [0.0])
placed = {}
res = {}
for mid in order:
    c = cfg[mid]
    best = None
    dD0 = c.get("dD0", 0.0)
    for k in range(0, 160):
        dD = dD0 + 0.15 * k
        # dX: the smallest move east (from dX0) that puts the waterline in the water
        dX = c.get("dX0", 0.0)
        for j in range(0, 300):
            ol, wl, stem = build(mid, dX, dD)
            if on_land(wl) <= c.get("land_tol", 0.05):
                break
            dX += 0.15
        if on_land(wl) > c.get("land_tol", 0.05):
            continue
        ok = all(bp.min_gap(ol, o) >= GAP for o in placed.values())
        if ok:
            best = (dX, dD, ol, wl, stem); break
    if best is None:
        print("no fit", mid); continue
    dX, dD, ol, wl, stem = best
    placed[mid] = ol
    sd = bp.poly_dist(stem, bp.water)
    maxD = max(p[1] for p in ol)
    res[mid] = dict(cfg[mid], dX=round(dX, 2), dD=round(dD, 2))
    print(f"{mid.split('.')[-1]:24s} dX {dX:+5.1f} dD {dD:+5.1f}  stem-shore {sd:4.2f}  hull D {min(p[1] for p in ol):5.1f}..{maxD:5.1f}  X {min(p[0] for p in ol):5.1f}..{max(p[0] for p in ol):5.1f}")
res["_far_dD"] = far
json.dump(res, open(ARGS[2], "w"), indent=1)
