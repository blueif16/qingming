"""Moves for the bank-slope and in-water things that keep their painted relation with the water (S2 Run 2): each
keeps its place across the slope (a fraction from the bank top to the shore) at its u; in-water things keep their
distance off the shore. Prints JSON {map_id: {dX, dD, why}}."""
import json
import sys

import needs as N
from geo import u_of, k_of, interp_uD

P = json.load(open("plan_lines.json"))
us, dDs = P["u"], P["dD"]
top_b, sh_b = [], []
for bid in N.NORTH_BANKS:
    top_b += [tuple(p) for p in P["lines"]["banks"][bid]["bank_top"]]
for wid in N.REACHES:
    sh_b += [tuple(p) for p in P["lines"]["water"][wid]["shore_n"]]


def uD(line):
    out = []
    for p in line:
        q = (u_of(*p), p[1])
        if not out or q[0] > out[-1][0] + 1e-6:
            out.append(q)
    return out


TB, SB = uD(top_b), uD(sh_b)


def disp(X, D, mode):
    u = u_of(X, D)
    t0, s0 = interp_uD(N.NB_uD, u), interp_uD(N.NS_uD, u)
    t1, s1 = interp_uD(TB, u), interp_uD(SB, u)
    if t0 is None or t1 is None:
        return 0.0, 0.0, u, None
    s0 = min(s0, t0)
    if mode == "water":
        dD = s1 - s0
        f = None
    else:
        # its place across the slope: a fraction from the top (0) to the shore (1); where the mapped slope is nil or
        # the thing stands at its top, half way down (the frame's `bank slope` support, H -0.35)
        f = (t0 - D) / (t0 - s0) if t0 - s0 > 0.3 else 0.5
        if f < 0.2:
            f = 0.5
        dD = (t1 - t0) * (1 - f) + (s1 - s0) * f if f <= 1 else s1 - s0
        if f == 0.5 and t0 - s0 <= 0.3 or f == 0.5:
            dD = (t1 - f * (t1 - s1)) - D if abs(t1 - t0) > 0.02 else 0.0
    return k_of(u) * dD, dD, u, f


THINGS = {
    "S2.str.landing_steps_22950": "top",
    "S2.prop.mooring_post_23126": "water",
    "S2.prop.mooring_post_25207": "slope",
    "S2.prop.mooring_post_rope_28272": "slope",
    "S2.prop.ribbed_object_28878": "slope",
    "S2.prop.ladder_28538": "slope",
    "S2.fig.man_with_sticks_bank_24390": "slope",
    "S2.fig.sack_porter_bank_edge_24467": "slope",
    "S2.fig.bank_porter_28355": "slope",
}
figs = {f["map_id"]: f for f in N.L["figures"]}
out = {}
for mid, mode in THINGS.items():
    if mid in figs:
        X, D = figs[mid]["X"], figs[mid]["D"]
    else:
        e = N.E[mid]
        X, D = e["pos"][:2]
    if mode == "top":
        u = u_of(X, D)
        dD = interp_uD(TB, u) - interp_uD(N.NB_uD, u)
        dX, f = k_of(u) * dD, None
    else:
        dX, dD, u, f = disp(X, D, mode)
    out[mid] = {"dX": round(dX, 2), "dD": round(dD, 2), "u": round(u), "f": None if f is None else round(f, 2), "pos": [X, D]}
    print(f"{mid:42s} u {u:7.0f} ({X:.2f}, {D:.2f}) f {f}  dX {dX:+.2f} dD {dD:+.2f}")
json.dump(out, open("slope_moves.json", "w"), indent=1)
