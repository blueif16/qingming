"""For a boat: at each along-bank offset s (m, east positive), the least move south o (m) that puts its outline in the
water. python3 omin.py <map_id> kind lw beam dX0 dD0 [s0 s1]"""
import math, sys
import boat_plan as bp
mid, kind, lw, B, dX0, dD0 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6])
s0, s1 = (float(sys.argv[7]), float(sys.argv[8])) if len(sys.argv) > 8 else (-3, 14)
e = bp.E[mid]
fr, re = e["pts"]["front"], e["pts"]["rear"]
h = math.atan2(fr[1] - re[1], fr[0] - re[0])
ux, uy = math.cos(h), math.sin(h)
if ux < 0:
    ux, uy = -ux, -uy           # s positive = east
s = s0
while s <= s1 + 1e-9:
    for i in range(0, 91):
        o = -3.0 + 0.1 * i
        c = dict(kind=kind, lw=lw, beam=B, dX=dX0 + s * ux, dD=dD0 + s * uy - o)
        b = bp.boat(mid, c, e)
        if bp.on_land(b["ol"]) <= 0.03:
            xs = [p[0] for p in b["ol"]]
            print(f"s {s:+5.1f}  o {o:3.1f}  move ({c['dX']:+.2f},{c['dD']:+.2f})  X {min(xs):6.1f}..{max(xs):6.1f}  to shore {min(bp._sd(q, bp.NORTH) for q in b['ol']):.2f}")
            break
    s += 0.5
