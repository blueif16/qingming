"""Plan S4b's moorings at real size: each boat's gunwale outline (kit_boats.Hull) in plan, against its neighbours,
the near and far shores (S4b's water entity, S3's beyond the seam) and S3's boats near the seam.
  python3 boat_plan.py plan.json out.svg   (plan.json: {map_id: {kind, lw, beam, dX, dD}})
Prints overlaps (cm) and how far each waterline lies on land. plan.json's dX/dD are the boats' recorded moves, so the
script reads the layout WITHOUT them (layout_premoves.json here: map_layout's output before build_choices.json had
moves; PLAN_LAYOUT=<path> overrides). solve.py stacks the boats south to north (each moved east until its stem is at
the shore, then north until it clears its south neighbours) and writes the moves; the area agent's run, 2026-10-12:
moorings_plan.json / moorings_plan.png, and the kit's default sizes for comparison: moorings_kit_default.png."""
import json
import math
import os
import sys

QM = "/home/ran/3d_director/qingming"
L = json.load(open(os.environ.get("PLAN_LAYOUT") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "layout_premoves.json")))
L3 = json.load(open(f"{QM}/sections/rainbow_bridge/layout.json"))
TYPES = {
    "passenger": dict(lw=19.0, beam=4.5, oh_b=1.5, oh_s=1.8, tw_b=0.36, tw_s=0.62, bb=0.6, free=1.1, draft=1.0),
    "grain": dict(lw=20.0, beam=4.9, oh_b=1.5, oh_s=1.7, tw_b=0.52, tw_s=0.64, bb=0.66, free=1.25, draft=1.2),
    "small": dict(lw=8.0, beam=2.3, oh_b=0.65, oh_s=0.65, tw_b=0.32, tw_s=0.5, bb=0.55, free=0.5, draft=0.45),
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


def outline(kind, lw, B, n=24):
    """Plan outline in the boat frame (x along, y port): gunwale, stern gallery, bow platform."""
    t = TYPES[kind]
    x0, x1 = -t["oh_s"], lw + t["oh_b"]
    xs = [x0 + (x1 - x0) * i / (n - 1) for i in range(n)]
    top = [(x, hull_w(t, lw, B, x)) for x in xs]
    if kind != "small" and B > 3:      # the stern gallery
        g = hull_w(t, lw, B, x0) + 0.05
        top = [(x0 - 1.3, g)] + top
    if kind == "passenger":            # the bow platform and stem post
        top = top + [(x1 + 1.1, 0.6)]
    bot = [(x, -y) for x, y in reversed(top)]
    return top + bot


def waterline(kind, lw, B, n=16):
    t = TYPES[kind]
    k = 0.92
    xs = [lw * i / (n - 1) for i in range(n)]
    top = [(x, k * hull_w(t, lw, B, x)) for x in xs]
    return top + [(x, -y) for x, y in reversed(top)]


def place(poly, front, rear, lw, centre):
    h = math.atan2(front[1] - rear[1], front[0] - rear[0])
    c, s = math.cos(h), math.sin(h)
    rx, ry = centre[0] - c * lw / 2, centre[1] - s * lw / 2
    return [(rx + c * x - s * y, ry + s * x + c * y) for x, y in poly], math.degrees(h)


def pip(p, poly):
    x, y = p
    ins = False
    for (ax, ay), (bx, by) in zip(poly, poly[1:] + poly[:1]):
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
            ins = not ins
    return ins


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy or 1)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def poly_dist(p, poly):
    return min(seg_dist(p, a, b) for a, b in zip(poly, poly[1:] + poly[:1]))


def penetration(A, B):
    """Max depth of A's vertices inside B and B's inside A (m): 0 if they don't overlap (by vertices)."""
    d = 0.0
    for P, Q in ((A, B), (B, A)):
        for p in P:
            if pip(p, Q):
                d = max(d, poly_dist(p, Q))
    return d


def min_gap(A, B):
    if penetration(A, B) > 0:
        return -penetration(A, B)
    return min(min(poly_dist(p, B) for p in A), min(poly_dist(p, A) for p in B))


W = L["entities"]["S4b.water.bian_river"]["lines"]
ss, sn = [tuple(p) for p in W["shore_s"]], [tuple(p) for p in W["shore_n"]]
W3 = L3["entities"]["S3.water.bian_west_15500"]["lines"]
ss3, sn3 = [tuple(p) for p in W3["shore_s"]], [tuple(p) for p in W3["shore_n"]]
# the water: S4b's near shore (north to south-east), S3's near shore on east, S3's far shore back west, S4b's far
# shore, and a run-on north-west where the river leaves the silk (the strip's closing)
plan = json.load(open(sys.argv[1]))
FAR = plan.pop("_far_dD", 0.0)   # the far shore moved north (along the seam's direction, so its east end stays on it)
SEAM_K = -31.6 / 77.0             # dX per dD along the seam line (u constant)
snm = [(x + SEAM_K * FAR, y + FAR) for x, y in sn]
ext = [(ss[0][0] + SEAM_K * FAR * f, ss[0][1] + FAR * f) for f in (1.0, 0.5)] if FAR > 0.5 else []
USE_S3_FAR = plan.pop("_s3_far", False)
if USE_S3_FAR:
    water = ext + ss + ss3[1:] + [(ss3[-1][0] + 2, 20)] + list(reversed(sn3)) + list(reversed(snm))
else:   # S4b's own far shore (moved), run straight on east past the seam (S4b alone: its water runs on under the mist)
    water = ext + ss + ss3[1:] + [(106.0, ss3[-1][1]), (106.0, snm[-1][1])] + list(reversed(snm))
water = [p for i, p in enumerate(water) if i == 0 or p != water[i - 1]]

boats = {}
for mid, e in L["entities"].items():
    if not mid.split(".")[-1].startswith("boat_"):
        continue
    c = plan.get(mid, {})
    kind = c.get("kind", "passenger")
    t = TYPES[kind]
    lw = c.get("lw", t["lw"])
    B = c.get("beam", t["beam"])
    p = e["pts"]
    front, rear = p["front"], p["rear"]
    rot = math.radians(c.get("turn", 0.0))
    if rot:  # turn about the midpoint
        mx, my = (front[0] + rear[0]) / 2, (front[1] + rear[1]) / 2
        def R(q):
            dx, dy = q[0] - mx, q[1] - my
            return (mx + dx * math.cos(rot) - dy * math.sin(rot), my + dx * math.sin(rot) + dy * math.cos(rot))
        front, rear = R(front), R(rear)
    centre = ((front[0] + rear[0]) / 2 + c.get("dX", 0), (front[1] + rear[1]) / 2 + c.get("dD", 0))
    fr = (front[0] + c.get("dX", 0), front[1] + c.get("dD", 0))
    re = (rear[0] + c.get("dX", 0), rear[1] + c.get("dD", 0))
    ol, hd = place(outline(kind, lw, B), fr, re, lw, centre)
    wl, _ = place(waterline(kind, lw, B), fr, re, lw, centre)
    stem = place([(lw, 0.0)], fr, re, lw, centre)[0][0]
    boats[mid] = dict(kind=kind, lw=lw, B=B, ol=ol, wl=wl, hd=hd, centre=centre, stem=stem, front=fr, rear=re,
                      painted=((p["front"][0] + p["rear"][0]) / 2, (p["front"][1] + p["rear"][1]) / 2))

# S3's boats near the seam, at 0.6 of their type (the least S3 can build them at)
s3 = {}
for mid in ("S3.veh.boat_under_way_15595", "S3.veh.boat_towed_mast_16228", "S3.veh.boat_passenger_long_16398"):
    e = L3["entities"][mid]
    kind = "passenger" if "passenger" in mid else "grain"
    lw = TYPES[kind]["lw"] * 0.6
    fr, re = e["pts"]["front"], e["pts"]["rear"]
    ol, _ = place(outline(kind, lw, TYPES[kind]["beam"] * 0.75), fr, re, lw, ((fr[0] + re[0]) / 2, (fr[1] + re[1]) / 2))
    s3[mid] = ol

print(f"{'boat':38s} kind      lw   beam  hd    move(dX,dD)   on land(m)  stem-shore(m)")
for mid, b in boats.items():
    land = max([poly_dist(q, water) for q in b["wl"] if not pip(q, water)] or [0.0])
    sd = poly_dist(b["stem"], water) * (1 if not pip(b["stem"], water) else -1)
    c = plan.get(mid, {})
    print(f"{mid:38s} {b['kind']:9s} {b['lw']:5.1f} {b['B']:4.2f} {b['hd']:5.0f}  ({c.get('dX',0):+.2f},{c.get('dD',0):+.2f})"
          f"   {land:5.2f}       {sd:+.2f}")
ids = list(boats)
print("pairs (gap m; negative = overlap):")
for i in range(len(ids)):
    for j in range(i + 1, len(ids)):
        g = min_gap(boats[ids[i]]["ol"], boats[ids[j]]["ol"])
        if g < 0.6:
            print(f"  {ids[i].split('.')[-1]:24s} {ids[j].split('.')[-1]:24s} {g:+.2f}")
for mid, ol in s3.items():
    for b in ids:
        g = min_gap(boats[b]["ol"], ol)
        if g < 0.5:
            print(f"  S3 {mid.split('.')[-1]:22s} {b.split('.')[-1]:24s} {g:+.2f}")

# the SVG: 20 px per metre, X right, D up
S, X0, X1, Y0, Y1 = 22, 68, 100, 10, 33
def T(p):
    return ((p[0] - X0) * S, (Y1 - p[1]) * S)
out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{(X1-X0)*S}" height="{(Y1-Y0)*S}" style="background:#f4efe4">']
for x in range(X0, X1 + 1):
    out.append(f'<line x1="{T((x,Y0))[0]}" y1="0" x2="{T((x,Y0))[0]}" y2="{(Y1-Y0)*S}" stroke="#ddd" stroke-width="{2 if x%5==0 else 0.5}"/>')
for y in range(Y0, Y1 + 1):
    out.append(f'<line x1="0" y1="{T((X0,y))[1]}" x2="{(X1-X0)*S}" y2="{T((X0,y))[1]}" stroke="#ddd" stroke-width="{2 if y%5==0 else 0.5}"/>')
    if y % 5 == 0:
        out.append(f'<text x="2" y="{T((X0,y))[1]-2}" font-size="11">D {y}</text>')
for x in range(X0, X1 + 1, 5):
    out.append(f'<text x="{T((x,Y0))[0]+2}" y="{(Y1-Y0)*S-3}" font-size="11">X {x}</text>')
pts = " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in water)
out.append(f'<polygon points="{pts}" fill="#b9d3dc" stroke="#557" stroke-width="1"/>')
bt = L["entities"]["S4b.grd.near_bank_14850"]["lines"]["bank_top"]
out.append('<polyline points="' + " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in bt) + '" fill="none" stroke="#a87" stroke-dasharray="4 3"/>')
# the seam u 15500 and the painted area
pa = L["painted_area"]["corners"]
out.append('<polygon points="' + " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in pa) + '" fill="none" stroke="#c33" stroke-width="1.5"/>')
for mid, ol in s3.items():
    out.append('<polygon points="' + " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in ol) + '" fill="#e88" fill-opacity="0.25" stroke="#c44" stroke-dasharray="5 3"/>')
    out.append(f'<text x="{T(ol[len(ol)//4])[0]}" y="{T(ol[len(ol)//4])[1]}" font-size="11" fill="#a22">{mid.split(".")[-1]}</text>')
cols = ["#7a5230", "#2d6a4f", "#9c6644", "#386fa4", "#6d597a", "#b56576"]
for (mid, b), col in zip(boats.items(), cols):
    out.append('<polygon points="' + " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in b["ol"]) + f'" fill="{col}" fill-opacity="0.35" stroke="{col}" stroke-width="1.5"/>')
    out.append('<polygon points="' + " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in b["wl"]) + f'" fill="none" stroke="{col}" stroke-dasharray="2 2"/>')
    e = L["entities"][mid]["pts"]
    a, z = T(e["front"]), T(e["rear"])
    out.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{z[0]}" y2="{z[1]}" stroke="#000" stroke-width="2"/>')
    out.append(f'<circle cx="{a[0]}" cy="{a[1]}" r="4" fill="#000"/>')
    c = T(b["centre"])
    out.append(f'<text x="{c[0]-40}" y="{c[1]+4}" font-size="12" font-weight="bold" fill="#000">{mid.split(".")[-1].replace("boat_","")}</text>')
for f in L["figures"]:
    if str(f.get("support", "")).startswith("boat"):
        q = T((f["X"], f["D"]))
        out.append(f'<circle cx="{q[0]}" cy="{q[1]}" r="3" fill="#d00"/>')
gp = L["entities"].get("S4b.prop.mooring_post_14737")
if gp:
    q = T(gp["pos"])
    out.append(f'<rect x="{q[0]-4}" y="{q[1]-4}" width="8" height="8" fill="#000"/>')
out.append("</svg>")
open(sys.argv[2], "w").write("\n".join(out))
