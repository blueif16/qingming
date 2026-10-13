"""Draw S2's river plan (fronts, old and new bank tops and shores, the route, strip things, trees, hulls).
    python3 draw.py plan_lines.json out_prefix [hulls.json]   -> <out_prefix>_{w,m,e}.svg (+ .png via svg2png)"""
import json
import subprocess
import sys

import needs as N
from geo import X_of, u_of

P = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
HULLS = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
E = N.E
L = N.L
PANELS = {"w": (145, 196), "m": (190, 241), "e": (236, 287)}
S = 26
Y0, Y1 = -6, 31


def poly(pts, T, **kw):
    a = " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in pts)
    attrs = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<polygon points="{a}" {attrs}/>'


def pline(pts, T, **kw):
    a = " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in pts)
    attrs = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<polyline points="{a}" fill="none" {attrs}/>'


for name, (x0, x1) in PANELS.items():
    T = lambda p, x0=x0: ((p[0] - x0) * S, (Y1 - p[1]) * S)  # noqa: E731
    W, H = (x1 - x0) * S, (Y1 - Y0) * S
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" style="background:#f6f1e6" font-family="sans-serif">']
    for x in range(x0, x1 + 1):
        o.append(f'<line x1="{T((x, 0))[0]}" y1="0" x2="{T((x, 0))[0]}" y2="{H}" stroke="#e2dccf" stroke-width="{1.5 if x % 5 == 0 else 0.4}"/>')
        if x % 5 == 0:
            o.append(f'<text x="{T((x, 0))[0] + 2}" y="{H - 4}" font-size="12" fill="#887">X {x}</text>')
    for y in range(Y0, Y1 + 1):
        o.append(f'<line x1="0" y1="{T((x0, y))[1]}" x2="{W}" y2="{T((x0, y))[1]}" stroke="#e2dccf" stroke-width="{1.5 if y % 5 == 0 else 0.4}"/>')
        if y % 5 == 0:
            o.append(f'<text x="3" y="{T((x0, y))[1] - 3}" font-size="12" fill="#887">D {y}</text>')
    # u lines every 250 px
    for u in range(20500, 29051, 250):
        a, b = (X_of(u, -6), -6), (X_of(u, 31), 31)
        if x0 - 10 < a[0] < x1 + 10 or x0 - 10 < b[0] < x1 + 10:
            o.append(pline([a, b], T, stroke="#cfc6b4", stroke_width=0.8, stroke_dasharray="2 4"))
            o.append(f'<text x="{T(b)[0] + 2}" y="14" font-size="11" fill="#998">u {u}</text>')
    # the water as built: each reach between its north shore and its south shore (or the silk's bottom run on)
    for wid, ln in P["lines"]["water"].items():
        sn = ln["shore_n"]
        ss = ln.get("shore_s") or [(sn[-1][0], -6), (sn[0][0] - 8, -6)]
        if "shore_s" in ln:
            ring = list(ss) + list(reversed(sn))
        else:
            ring = list(sn) + [(sn[-1][0], -6), (sn[0][0] - 2, -6)]
        o.append(poly(ring, T, fill="#bcd5de", stroke="none"))
    # mapped water (outline only)
    for wid in N.REACHES:
        for k in ("shore_n", "shore_s"):
            if k in E[wid]["lines"]:
                o.append(pline(E[wid]["lines"][k], T, stroke="#3b6f8f", stroke_width=1.2, stroke_dasharray="5 4"))
    # banks: mapped tops dashed, built solid; built shores solid blue
    for bid in [k for k, e in E.items() if e["kind"] == "grd" and "bank_top" in (e.get("lines") or {})]:
        o.append(pline(E[bid]["lines"]["bank_top"], T, stroke="#8a6a44", stroke_width=1.5, stroke_dasharray="6 4"))
    for bid, ln in P["lines"]["banks"].items():
        o.append(pline(ln["bank_top"], T, stroke="#6b4a24", stroke_width=2.5))
        o.append(pline(ln["shore"], T, stroke="#1f5a85", stroke_width=2.2))
    # fronts
    for mid, sh in N.fronts.items():
        if sh[0] == "poly":
            o.append(poly(sh[1], T, fill="#9a948a", fill_opacity=0.55, stroke="#555", stroke_width=1))
        else:
            o.append(pline(sh[1], T, stroke="#444", stroke_width=3))
        c = sh[1][0]
        if x0 - 2 < c[0] < x1:
            o.append(f'<text x="{T(c)[0] + 2}" y="{T(c)[1] - 3}" font-size="10" fill="#333">{mid.split(".")[-1]}</text>')
    for fid, fp in N.FLOORS.items():
        o.append(poly([p[:2] for p in fp], T, fill="#d9b46c", fill_opacity=0.6, stroke="#9a7a3a", stroke_width=1))
    # the route
    o.append(pline(L["route"]["centre"], T, stroke="#b03030", stroke_width=1, stroke_dasharray="1 3"))
    # strip things, trees, other figures
    for mid, sh in N.strip.items():
        q = T(sh[1])
        o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{sh[2] * S:.1f}" fill="none" stroke="#b05" stroke-width="1"/>')
    for t in L["trees"]:
        q = T((t["X"], t["D"]))
        o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="5" fill="#3a7d3a"/>')
    for f in L["figures"]:
        q = T((f["X"], f["D"]))
        col = "#d00" if str(f.get("support", "")).startswith("boat") else ("#06c" if f.get("support") in ("bank slope", "water") else "#333")
        o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="2.5" fill="{col}"/>')
    for mid, e in E.items():
        if e.get("support") in ("bank slope", "water") and e["kind"] == "prop":
            q = T(e["pos"])
            o.append(f'<rect x="{q[0] - 4}" y="{q[1] - 4}" width="8" height="8" fill="#06c"/>')
    # hulls
    for mid, h in HULLS.items():
        o.append(poly(h["ol"], T, fill=h.get("col", "#7a5230"), fill_opacity=0.35, stroke=h.get("col", "#7a5230"), stroke_width=1.5))
        if h.get("wl"):
            o.append(poly(h["wl"], T, fill="none", stroke=h.get("col", "#7a5230"), stroke_dasharray="2 2"))
        if h.get("path"):
            o.append(poly(h["path"], T, fill="none", stroke="#c00", stroke_width=1, stroke_dasharray="6 3"))
        c = T(h["centre"])
        o.append(f'<text x="{c[0] - 30:.0f}" y="{c[1] + 4:.0f}" font-size="12" font-weight="bold">{mid.split(".")[-1].replace("boat_", "")}</text>')
        if h.get("painted"):
            a, b = T(h["painted"][0]), T(h["painted"][1])
            o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#000" stroke-width="2"/>')
            o.append(f'<circle cx="{a[0]:.1f}" cy="{a[1]:.1f}" r="4" fill="#000"/>')
    # dD labels
    us, dDs = P["u"], P["dD"]
    for i in range(0, len(us), 50):
        u = us[i]
        t = N.interp_uD(N.NB_uD, u)
        if t is None:
            continue
        p = (X_of(u, t + dDs[i]), t + dDs[i])
        if x0 < p[0] < x1:
            q = T(p)
            o.append(f'<text x="{q[0]:.0f}" y="{q[1] + 16:.0f}" font-size="11" fill="#6b4a24">{dDs[i]:+.1f}</text>')
    o.append(f'<text x="10" y="30" font-size="18" font-weight="bold">S2 river plan, panel {name}: dashed = mapped, solid = built (brown bank top, blue shore); grey fronts, gold floors, red dotted route, magenta rings = strip things</text>')
    o.append("</svg>")
    svg = f"{OUT}_{name}.svg"
    open(svg, "w").write("\n".join(o))
    subprocess.run(["node", "/home/ran/3d_director/qingming/gen/sections/outer_road_2/boats/svg2png.mjs", svg, f"{OUT}_{name}.png"], check=True)
print("drawn", OUT)
