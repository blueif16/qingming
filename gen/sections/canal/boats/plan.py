"""S2's river as built (boats agent, Run 2): the north bank's shift dD(u), the built bank tops and shores, the checks.
    python3 plan.py [--recompute]      -> plan_lines.json (the lines, the shift, the checks), plan_river.svg
The need per u comes from needs.py (cached in needs.json)."""
import json
import math
import os
import sys

import needs as N
from geo import QM, u_of, X_of, k_of, interp_uD, shape_dist, line_dist, seg_dist

HERE = os.path.dirname(os.path.abspath(__file__))
E = N.E
STEP = 5
U0, U1 = 20500, 28967          # the seam with S3; the north shore's last point (the silk's bottom edge)
SLOPE = 0.55                   # dD per metre of X along the bank (35 deg): no kink sharper than the painted bank's own
SEAM_SLOPE = 1.0               # off the seam, where dD must be 0: the painted bank rises 48 deg there
SMOOTH = 60                    # px of u: erosion then mean (stays under the need)
BANK = 1.0                     # m: the built bank (top to shore) where the mapped one is narrower
BANK_SEAM = 150                # px: the bank widens from 0 on the seam (where the shore meets S3's at the bank top)
SEAM_ZONE = 250                # px: no widening this close to the seam (the shore starts at the bank top there)
SOFT = 0.8                     # m: the blend where the built shore leaves the mapped one for the offset of the bank top
OVERRIDE = {}                  # u range -> cap on the need (decisions recorded in notes)


def load_need(recompute=False):
    path = os.path.join(HERE, "needs.json")
    if not recompute and os.path.exists(path):
        d = json.load(open(path))
        if d.get("rule") == "v2":
            return {u: (dD, why) for u, dD, why in d["need"]}
    res = []
    for u in range(U0, U1 + 1, STEP):
        dD, why = N.need_at(u)
        res.append((u, round(dD, 3), why))
    json.dump({"rule": "v2", "walk": N.WALK, "clear": N.CLEAR, "need": res}, open(path, "w"), indent=0)
    return {u: (dD, why) for u, dD, why in res}


TRACK_RUN = float(os.environ.get("TRACK_RUN", "0"))   # m: the trackers' walk west with the towed boat
TRACK_MARGIN = 0.4                                     # m of flat ground south of a tracker's feet


def tracker_reqs(run=None):
    """[(u, dD cap)]: each tracker's path west along the towed boat's heading kept on the flat (TRACK_MARGIN)"""
    run = TRACK_RUN if run is None else run
    if run <= 0:
        return []
    b = E["S2.veh.boat_towed_mast_23632"]["pts"]
    fx, fy = b["front"][0] - b["rear"][0], b["front"][1] - b["rear"][1]
    n = math.hypot(fx, fy)
    fx, fy = fx / n, fy / n
    out = []
    for f in N.L["figures"]:
        if not f["map_id"].startswith("S2.fig.tracker_"):
            continue
        for i in range(int(run / 0.2) + 1):
            p = (f["X"] + fx * 0.2 * i, f["D"] + fy * 0.2 * i)
            u = u_of(*p)
            t = interp_uD(N.NB_uD, u)
            if t is not None:
                out.append((u, p[1] - TRACK_MARGIN - t))
    return out


def make_shift(need):
    us = sorted(need)
    T = [need[u][0] for u in us]
    for ut, cap in tracker_reqs():
        for i, u in enumerate(us):
            if abs(u - ut) <= 12:
                T[i] = min(T[i], cap)
    for (a, b), cap in OVERRIDE.items():
        T = [max(t, cap) if a <= u <= b else t for u, t in zip(us, T)]
    # the largest function under the need with |slope| <= SLOPE (per metre of X: about 77 px of u)
    n = len(us)
    f = T[:]
    lim = SLOPE * STEP / 77.0
    for i in range(1, n):
        f[i] = min(f[i], f[i - 1] + lim)
    for i in range(n - 2, -1, -1):
        f[i] = min(f[i], f[i + 1] + lim)
    # smooth (erode, then average: never above f)
    w = SMOOTH // STEP
    ero = [min(f[max(0, i - w):i + w + 1]) for i in range(n)]
    sm = [sum(ero[max(0, i - w):i + w + 1]) / len(ero[max(0, i - w):i + w + 1]) for i in range(n)]
    # the seam: 0 on u 20500, at most SEAM_SLOPE off it, eased
    out = []
    for u, v in zip(us, sm):
        x = (u - U0) / 77.0
        cap = -SEAM_SLOPE * x
        v = max(v, cap) if v < cap else v
        out.append(min(0.0, v))
    # ease the seam knee: one more mean over the first metres
    w2 = 40 // STEP
    eased = out[:]
    for i in range(1, min(n, 400 // STEP)):
        seg = out[max(0, i - w2):i + w2 + 1]
        eased[i] = sum(seg) / len(seg)
    eased = [max(v, -SEAM_SLOPE * (u - U0) / 77.0) for u, v in zip(us, eased)]
    out = [round(v, 3) for v in eased]
    for i, u in enumerate(us):       # exact zeros where nothing is needed for a stretch
        if abs(out[i]) < 0.005:
            out[i] = 0.0
    return us, out


def dD_at(us, dDs, u):
    if u <= us[0]:
        return dDs[0]
    if u >= us[-1]:
        return dDs[-1]
    i = int((u - us[0]) // STEP)
    i = min(i, len(us) - 2)
    t = (u - us[i]) / (us[i + 1] - us[i])
    return dDs[i] + t * (dDs[i + 1] - dDs[i])


def dp(pts, tol):
    """Douglas-Peucker on [(X, D)], ends kept."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dmax, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = seg_dist(pts[i], a, b)
        if d > dmax:
            dmax, idx = d, i
    if dmax <= tol:
        return [a, b]
    return dp(pts[:idx + 1], tol)[:-1] + dp(pts[idx:], tol)


def built_lines(us, dDs, tol=0.04, W=None):
    """the built north bank top and shore, per mapped entity, in (X, D); each keeps its mapped end u's.
    W: {u: bank width in D at that u} (default BANK, from 0 on the seam)"""
    top_uD = N.NB_uD
    sh_uD = N.NS_uD

    def top_b(u):
        return interp_uD(top_uD, u) + dD_at(us, dDs, u)

    def bank_w(u):
        ramp = min(1.0, max(0.0, (u - U0) / BANK_SEAM))
        if W is None:
            return BANK * ramp
        return dD_at(us, [W[x] for x in us], u) * ramp

    def shore_b(u):
        s = interp_uD(sh_uD, u)
        t = interp_uD(top_uD, u)
        if t is None:                 # past the bank top's east end (the shore turns south): as mapped
            return s
        a, b = s, top_b(u) - bank_w(u)
        k = SOFT                      # a smooth minimum: no hook where the mapped shore crosses the offset line
        h = max(0.0, min(1.0, 0.5 + 0.5 * (b - a) / k))
        return (b * (1 - h) + a * h) - k * h * (1 - h)

    def line(fn, u_a, u_b, mapped_u):
        grid = sorted(set([u_a, u_b] + [u for u in mapped_u if u_a < u < u_b] +
                          list(range(int(math.ceil(u_a / 20.0)) * 20, int(u_b), 20))))
        grid = [u for u in grid if u_a <= u <= u_b]
        pts = [(X_of(u, fn(u)), fn(u)) for u in grid]
        return [(round(x, 3), round(d, 3)) for x, d in dp(pts, tol)]

    lines = {"banks": {}, "water": {}}
    for bid in N.NORTH_BANKS:
        bt = E[bid]["lines"]["bank_top"]
        sh = E[bid]["lines"]["shore"]
        ua, ub = u_of(*bt[0]), u_of(*bt[-1])
        sa, sb = u_of(*sh[0]), u_of(*sh[-1])
        lines["banks"][bid] = {"bank_top": line(top_b, ua, ub, [u_of(*p) for p in bt]),
                               "shore": line(shore_b, sa, sb, [u_of(*p) for p in sh])}
    for wid in N.REACHES:
        sn = E[wid]["lines"]["shore_n"]
        ua, ub = u_of(*sn[0]), u_of(*sn[-1])
        lines["water"][wid] = {"shore_n": line(shore_b, ua, ub, [u_of(*p) for p in sn])}
        if wid == N.REACHES[0]:     # on the S3 seam the shore meets the bank top: the mapped bank top's seam point
            seam = tuple(E[N.NORTH_BANKS[0]]["lines"]["bank_top"][0][:2])
            for ln in (lines["water"][wid]["shore_n"], lines["banks"][N.NORTH_BANKS[0]]["shore"],
                       lines["banks"][N.NORTH_BANKS[0]]["bank_top"]):
                ln[0] = seam
                while len(ln) > 2 and math.hypot(ln[1][0] - seam[0], ln[1][1] - seam[1]) < 0.1:
                    ln.pop(1)
        if "shore_s" in E[wid]["lines"]:
            lines["water"][wid]["shore_s"] = [tuple(p[:2]) for p in E[wid]["lines"]["shore_s"]]
    return lines, top_b, shore_b


def checks(lines, top_b, shore_b, us, dDs):
    """walk widths (fronts -> built bank top, floors counted), bank widths, strip things on land"""
    top = []
    for bid in N.NORTH_BANKS:
        top += lines["banks"][bid]["bank_top"]
    shore = []
    for wid in N.REACHES:
        shore += lines["water"][wid]["shore_n"]
    floors = {fid: ("poly", [tuple(p[:2]) for p in fp]) for fid, fp in N.FLOORS.items()}
    rows = []
    for u in range(U0, 28160, 10):
        t = top_b(u)
        p = (X_of(u, t), t)
        fl = N.floor_edge(u)
        wp = (X_of(u, fl[0]), fl[0]) if fl and fl[0] < t else p
        dfront, who = min((shape_dist(wp, sh), mid) for mid, sh in N.fronts.items())
        s = shore_b(u)
        bank = line_dist(p, shore) if s is not None else None
        rows.append((u, round(dD_at(us, dDs, u), 2), round(dfront, 2), who, round(bank, 2) if bank else None,
                     fl[1] if fl and fl[0] < t else None))
    strip_bad = []
    for mid, sh in N.strip.items():
        u = u_of(*sh[1])
        t = top_b(u)
        if t is None:
            continue
        gap = sh[1][1] - t
        d = shape_dist((X_of(u, t), t), sh)
        need = N.strip_need[mid]
        if gap < 0.05 or d < need - 0.05:
            strip_bad.append((mid, round(gap, 2), round(d, 2), need))
    return rows, strip_bad


def stretches(rows, key=2, step=0.5):
    out, cur = [], None
    for r in rows:
        k_ = (min(3.0, math.floor(r[key] / step) * step) if r[key] is not None else None, r[3])
        if cur is None or k_ != cur["k"]:
            if cur:
                out.append(cur)
            cur = {"k": k_, "u0": r[0], "u1": r[0], "min": r[key], "dD": [r[1], r[1]], "floor": r[5]}
        else:
            cur["u1"] = r[0]
            cur["min"] = min(cur["min"], r[key])
            cur["dD"] = [min(cur["dD"][0], r[1]), max(cur["dD"][1], r[1])]
    out.append(cur)
    return out


if __name__ == "__main__":
    need = load_need("--recompute" in sys.argv)
    us, dDs = make_shift(need)
    W = {u: BANK for u in us}
    for it in range(4):
        lines, top_b, shore_b = built_lines(us, dDs, W=W)
        shore = []
        for wid in N.REACHES:
            shore += lines["water"][wid]["shore_n"]
        grow = {}
        for u in us:
            t = top_b(u) if interp_uD(N.NB_uD, u) is not None else None
            if t is None or u < U0 + SEAM_ZONE:
                continue
            d = line_dist((X_of(u, t), t), shore)
            if d < 0.86:
                grow[u] = min(3.0, W[u] * 0.92 / max(0.2, d))
        if not grow:
            break
        new = dict(W)
        for u, w in grow.items():
            for v in range(u - 100, u + 101, STEP):
                if v in new:
                    new[v] = max(new[v], w)
        ws = [new[u] for u in us]
        k = 100 // STEP
        W = {u: sum(ws[max(0, i - k):i + k + 1]) / len(ws[max(0, i - k):i + k + 1]) for i, u in enumerate(us)}
        W = {u: max(W[u], new[u] if u in grow else 0) for u in us}
        print(f"bank widened at {len(grow)} u's (iteration {it})")
    rows, strip_bad = checks(lines, top_b, shore_b, us, dDs)
    for s in stretches(rows):
        print(f"u {s['u0']:5d}-{s['u1']:5d} dD {s['dD'][0]:+5.2f}..{s['dD'][1]:+5.2f}  walk min {s['min']:5.2f}"
              f"  {s['k'][1]}{'  (floor ' + s['floor'] + ')' if s['floor'] else ''}")
    banks = [r for r in rows if r[4] is not None and r[4] < 0.8 and r[0] > U0 + BANK_SEAM]
    print("bank < 0.8 m at", [(r[0], r[4]) for r in banks][:20])
    print("strip things not clear:", strip_bad)
    json.dump({"u": us, "dD": dDs, "W": [W[u] for u in us], "lines": lines, "rows": rows, "strip_bad": strip_bad},
              open(os.path.join(HERE, "plan_lines.json"), "w"))
