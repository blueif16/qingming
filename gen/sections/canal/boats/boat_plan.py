"""S2's moorings at real size, in plan (the boats agent, Run 2; adapted from gen/sections/outer_road_2/boats/
boat_plan.py): every boat's gunwale outline at its kit kind, lw, beam and move (kit_boats.Hull's half-breadth from the
stern gallery to the bow platform and stem post), its waterline, a sweep's loom and blade, a moving boat's whole run,
against the built water (river_plan.json's north shore, the mapped south shores, S3's shores past the seam, the run-on
under the mist past the silk's bottom edge) and S3's boats near the seam.
    python3 boat_plan.py boats_plan.json [out_prefix]     (boats_plan.json: {map_id: {kind, lw, beam, dX, dD, ...}})
Prints per boat: the outline on land (m), the gap to the shore, and every pair closer than 0.6 m (negative =
overlap), the runs of the boats under way against the rest. Reads the layout WITHOUT the recorded moves
(layout_premoves.json; the moves are the plan's dX/dD)."""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from geo import QM, u_of, X_of, pip, poly_dist  # noqa: E402

L = json.load(open(os.environ.get("PLAN_LAYOUT") or os.path.join(HERE, "layout_premoves.json")))
L3 = json.load(open(f"{QM}/sections/rainbow_bridge/layout.json"))
RP = json.load(open(os.environ.get("RIVER_PLAN") or f"{QM}/gen/sections/canal/river_plan.json"))
E = L["entities"]
# kit_boats.TYPES (the plan needs the hull's plan shape only)
TYPES = {
    "passenger": dict(lw=19.0, beam=4.5, oh_b=1.5, oh_s=1.8, tw_b=0.36, tw_s=0.62),
    "grain": dict(lw=20.0, beam=4.9, oh_b=1.5, oh_s=1.7, tw_b=0.52, tw_s=0.64),
    "small": dict(lw=8.0, beam=2.3, oh_b=0.65, oh_s=0.65, tw_b=0.32, tw_s=0.5),
}


def hull_w(t, lw, B, x):
    x0, x1 = -t["oh_s"], lw + t["oh_b"]
    xw = lw * 0.55
    hb = B / 2
    if x <= xw:
        u = min(1.0, (xw - x) / (xw - x0))
        return hb * (t["tw_s"] + (1 - t["tw_s"]) * (1 - u ** 2.2))
    u = min(1.0, (x - xw) / (x1 - xw))
    return hb * (t["tw_b"] + (1 - t["tw_b"]) * (1 - u ** 2.0))


def outline(kind, lw, B, n=26):
    """The gunwale in plan (boat frame: x from the sternpost's waterline point, y to port), with the stern gallery
    (big hulls), the passenger bow platform and stem post."""
    t = TYPES[kind]
    x0, x1 = -t["oh_s"], lw + t["oh_b"]
    xs = [x0 + (x1 - x0) * i / (n - 1) for i in range(n)]
    top = [(x, hull_w(t, lw, B, x) + 0.05) for x in xs]       # + the wale's thickness
    if kind != "small" and B > 3:
        g = hull_w(t, lw, B, x0) + 0.1
        top = [(x0 - 1.3, g)] + top
    if kind == "passenger":
        top = top + [(x1 + 1.0, 0.55), (x1 + 1.15, 0.1)]
    elif kind == "grain":
        top = top + [(x1 + 0.15, hull_w(t, lw, B, x1) + 0.2)]   # the capping beam's horns
    bot = [(x, -y) for x, y in reversed(top)]
    return top + bot


def waterline(kind, lw, B, n=16):
    t = TYPES[kind]
    xs = [lw * i / (n - 1) for i in range(n)]
    top = [(x, 0.92 * hull_w(t, lw, B, x)) for x in xs]
    return top + [(x, -y) for x, y in reversed(top)]


def sweep_poly(kind, lw, B, side, swing=0.0):
    """The great sweep in plan: from its crossbar inboard over the after deck, through the pin on the stern gallery's
    quarter, out astern to the blade (kit_boats._sweep, big hull: reach 6.0, out 1.8)."""
    t = TYPES[kind]
    x0 = -t["oh_s"]
    py = side * (hull_w(t, lw, B, x0) + 0.05)
    pin = (x0 - 0.5, py)
    tip = (pin[0] - 6.0, py + side * 1.8)
    bar = (pin[0] + 2.6, py * 0.3)
    a = math.radians(swing)
    def rot(p):
        dx, dy = p[0] - pin[0], p[1] - pin[1]
        return (pin[0] + dx * math.cos(a) - dy * math.sin(a), pin[1] + dx * math.sin(a) + dy * math.cos(a))
    w = 0.25
    return [rot(p) for p in [(bar[0], bar[1] + w), (tip[0], tip[1] + w), (tip[0], tip[1] - w), (bar[0], bar[1] - w)]]


def place(poly, front, rear, lw, centre):
    h = math.atan2(front[1] - rear[1], front[0] - rear[0])
    c, s = math.cos(h), math.sin(h)
    rx, ry = centre[0] - c * lw / 2, centre[1] - s * lw / 2
    return [(rx + c * x - s * y, ry + s * x + c * y) for x, y in poly]


def penetration(A, B):
    d = 0.0
    for P, Q in ((A, B), (B, A)):
        for p in P:
            if pip(p, Q):
                d = max(d, poly_dist(p, Q))
    return d


def seg_x(a, b, c, d):
    def o(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return o(a, b, c) * o(a, b, d) < 0 and o(c, d, a) * o(c, d, b) < 0


def _bbox(P):
    xs = [p[0] for p in P]
    ys = [p[1] for p in P]
    return min(xs), min(ys), max(xs), max(ys)


def min_gap(A, B, cap=1.0):
    """the least distance between two outlines (negative: overlap depth); anything beyond `cap` is reported as cap"""
    a, b = _bbox(A), _bbox(B)
    if a[0] - b[2] > cap or b[0] - a[2] > cap or a[1] - b[3] > cap or b[1] - a[3] > cap:
        return cap
    pen = penetration(A, B)
    if pen > 0:
        return -pen
    for a, b in zip(A, A[1:] + A[:1]):
        for c, d in zip(B, B[1:] + B[:1]):
            if seg_x(a, b, c, d):
                return -0.01
    return min(min(poly_dist(p, B) for p in A), min(poly_dist(p, A) for p in B))


# ------------------------------------------------------------------ the water as built
W = RP["water"]
sn = []
for wid in ("S2.water.bian_river_w", "S2.water.bian_river_w2", "S2.water.bian_river_m", "S2.water.bian_river_e"):
    for p in W[wid]["shore_n"]:
        p = tuple(p)
        if not sn or math.hypot(p[0] - sn[-1][0], p[1] - sn[-1][1]) > 1e-6:
            sn.append(p)
ss_w = [tuple(p) for p in W["S2.water.bian_river_w"]["shore_s"]]
ss_w2 = [tuple(p) for p in W["S2.water.bian_river_w2"]["shore_s"]]
S3W = L3["entities"]["S3.water.bian_river_18300"]["lines"]
S3T = L3["entities"]["S3.grd.north_bank_20250"]["lines"]["bank_top"]
s3n = [tuple(p[:2]) for p in S3W["shore_n"] if p[0] < 144.3] + [tuple(p[:2]) for p in S3T if p[0] > 144.5][:-1]
s3s = [tuple(p[:2]) for p in S3W["shore_s"]]
DEEP = -25.0                         # the strip runs on under the mist past the silk's bottom edge
NORTH = s3n + sn
SOUTH_REV = list(reversed(ss_w2)) + list(reversed(ss_w))[1:] + list(reversed(s3s))[1:]
WATER = NORTH + [(sn[-1][0], DEEP), (ss_w2[-1][0], DEEP)] + SOUTH_REV
SHORES = [NORTH, ss_w2, ss_w, s3s]


def shore_dist(p):
    return min(min(math.hypot(p[0] - q[0], p[1] - q[1]) if False else _sd(p, ln)) for ln in SHORES)


def _sd(p, ln):
    from geo import seg_dist
    return min(seg_dist(p, a, b) for a, b in zip(ln, ln[1:]))


def on_land(poly):
    """how far the polygon's points lie outside the water (m; 0 if all in)"""
    return max([poly_dist(q, WATER) if not pip(q, WATER) else 0.0 for q in poly] + [0.0])


# ------------------------------------------------------------------ the boats
def boat(mid, c, ent, s3=False):
    kind = c.get("kind")
    t = TYPES[kind]
    lw = c.get("lw", t["lw"])
    B = c.get("beam", t["beam"])
    p = ent["pts"]
    fr0, re0 = p["front"], p["rear"]
    dX, dD = c.get("dX", 0.0), c.get("dD", 0.0)
    fr = (fr0[0] + dX, fr0[1] + dD)
    re = (re0[0] + dX, re0[1] + dD)
    centre = ((fr[0] + re[0]) / 2, (fr[1] + re[1]) / 2)
    ol = place(outline(kind, lw, B), fr, re, lw, centre)
    wl = place(waterline(kind, lw, B), fr, re, lw, centre)
    h = math.atan2(fr[1] - re[1], fr[0] - re[0])
    b = dict(kind=kind, lw=lw, B=B, ol=ol, wl=wl, centre=centre, front=fr, rear=re, hd=math.degrees(h),
             painted=[fr0[:2], re0[:2]], parts=[ol])
    if c.get("sweep"):
        side = 1 if c["sweep"] == "port" else -1
        b["sweep"] = [place(sweep_poly(kind, lw, B, side, sw), fr, re, lw, centre) for sw in (-10, 0, 10)]
        b["parts"] = [ol] + b["sweep"]
    run = c.get("run", 0.0)
    if run:
        ux, uy = math.cos(h), math.sin(h)
        b["run_parts"] = []
        for i in range(1, int(run / 0.5) + 1):
            s_ = min(run, 0.5 * i)
            b["run_parts"] += [[(x + ux * s_, y + uy * s_) for x, y in q] for q in b["parts"]]
        b["path"] = [(x + ux * run, y + uy * run) for x, y in ol]
    return b


S3_KINDS = {"S3.veh.boat_mast_lowering_19518": "passenger", "S3.veh.boat_moored_south_bank_19745": "grain",
            "S3.veh.boat_cabin_under_arch_19225": "passenger"}


S3C = json.load(open(f"{QM}/sections/rainbow_bridge/build_choices.json")).get("boats", {})
S3_NEAR = ("S3.veh.boat_mast_lowering_19518", "S3.veh.boat_moored_south_bank_19745", "S3.veh.boat_cabin_under_arch_19225",
           "S3.veh.boat_skiff_19255")


def s3_boats(scale):
    """S3's boats near the seam: scale 'S3' = as S3 builds them (its build_choices kit kind, lw, beam, at its layout's
    moved place); a number = at that fraction of the kit's default type sizes"""
    out = {}
    for mid in S3_NEAR:
        kit = (S3C.get(mid) or {}).get("kit", {})
        kind = kit.get("kind") or S3_KINDS.get(mid, "small")
        t = TYPES[kind]
        if scale == "S3":
            c = {"kind": kind, "lw": kit.get("lw", t["lw"]), "beam": kit.get("beam", t["beam"])}
        else:
            c = {"kind": kind, "lw": t["lw"] * scale, "beam": t["beam"] * (1.0 if scale == 1.0 else 0.7)}
        out[mid] = boat(mid, c, L3["entities"][mid], s3=True)
    return out


def report(plan, s3scale=0.6, quiet=False):
    boats = {mid: boat(mid, c, E[mid]) for mid, c in plan.items() if not mid.startswith("_")}
    s3 = s3_boats(s3scale)
    lines, worst = [], 0.0
    for mid, b in boats.items():
        land = on_land(b["ol"])
        wland = on_land(b["wl"])
        gap = min(_sd(q, ln) for q in b["ol"] for ln in SHORES)
        c = plan[mid]
        lines.append(f"{mid.split('.')[-1]:30s} {b['kind']:9s} lw {b['lw']:5.1f} beam {b['B']:4.2f} hd {b['hd']:4.0f}"
                     f" move ({c.get('dX', 0):+.2f},{c.get('dD', 0):+.2f})  on land {land:4.2f} (wl {wland:4.2f})"
                     f"  to a shore {gap:5.2f}")
        worst = max(worst, land)
        if b.get("run_parts"):
            rl = max(on_land(q) for q in b["run_parts"])
            lines.append(f"    its run of {c.get('run')} m: on land {rl:4.2f}")
            worst = max(worst, rl)
    pairs = []
    ids = list(boats)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            A, Bb = boats[ids[i]], boats[ids[j]]
            g = min(min_gap(p, q) for p in A["parts"] for q in Bb["parts"])
            if g < 0.6:
                pairs.append((ids[i], ids[j], g, "rest"))
            for X_, Y_ in ((A, Bb), (Bb, A)):
                if X_.get("run_parts"):
                    g2 = min(min_gap(p, q) for p in X_["run_parts"] for q in Y_["parts"])
                    if g2 < 0.3:
                        pairs.append((ids[i], ids[j], g2, "run"))
    for mid, ob in s3.items():
        for b_ in ids:
            g = min(min_gap(p, ob["ol"]) for p in boats[b_]["parts"])
            if g < 0.6:
                pairs.append((mid, b_, g, f"S3@{s3scale}"))
    if not quiet:
        print("\n".join(lines))
        print("pairs (gap m; negative = overlap):")
        for a, b_, g, k in pairs:
            print(f"  {a.split('.')[-1]:30s} {b_.split('.')[-1]:30s} {g:+.2f}  {k}")
    return boats, s3, pairs, worst


if __name__ == "__main__":
    plan = json.load(open(sys.argv[1]))
    sc = os.environ.get("S3_SCALE", "S3")
    boats, s3, pairs, worst = report(plan, sc if sc == "S3" else float(sc))
    if len(sys.argv) > 2:
        cols = ["#7a5230", "#2d6a4f", "#9c6644", "#386fa4", "#6d597a", "#b56576", "#4a7c59", "#8d5a97", "#c06014"]
        hulls = {}
        for i, (mid, b) in enumerate(boats.items()):
            hulls[mid] = {"ol": b["ol"], "wl": b["wl"], "centre": b["centre"], "painted": b["painted"],
                          "col": cols[i % len(cols)], "path": b.get("path")}
            for k_, sp in enumerate(b.get("sweep", [])[1:2]):
                hulls[mid + f"#sweep{k_}"] = {"ol": sp, "centre": sp[1], "col": "#444"}
        for mid, b in s3.items():
            hulls[mid] = {"ol": b["ol"], "centre": b["centre"], "col": "#c33", "painted": b["painted"]}
        json.dump(hulls, open(sys.argv[2] + "_hulls.json", "w"))
