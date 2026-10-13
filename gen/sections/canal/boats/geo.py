"""S2 frame and plane geometry for the river plan (boats agent, S2 Run 2). Pure Python, no Blender.
The frame (map/frames/S2.json F1): X = (u - 8248 - dx(u) D) / 77, v = 1565 - 51.25 D - 77 H."""
import json
import math

QM = "/home/ran/3d_director/qingming"
FR = json.load(open(f"{QM}/map/frames/S2.json"))["frames"][0]
KN = FR["dx_knots"]
OU, OV = FR["origin"]


def dx(u):
    if u <= KN[0][0]:
        return KN[0][1]
    if u >= KN[-1][0]:
        return KN[-1][1]
    for (u0, d0), (u1, d1) in zip(KN, KN[1:]):
        if u <= u1:
            return d0 + (u - u0) / (u1 - u0) * (d1 - d0)
    return KN[-1][1]


def X_of(u, D):
    return (u - OU - dx(u) * D) / 77.0


def u_of(X, D):
    """scan u of a ground point (X, D): solve u = OU + 77 X + dx(u) D (monotone in u over S2's knots)."""
    lo, hi = 15000.0, 35000.0
    f = lambda u: u - OU - 77 * X - dx(u) * D  # noqa: E731
    for _ in range(80):
        m = (lo + hi) / 2
        if f(m) > 0:
            hi = m
        else:
            lo = m
    return (lo + hi) / 2


def k_of(u):
    """dX per dD when a point moves along the receding direction at scan u (u kept)."""
    return -dx(u) / 77.0


def shift(p, dD, u=None):
    u = u_of(*p[:2]) if u is None else u
    return (p[0] + k_of(u) * dD, p[1] + dD)


def seg_closest(p, a, b):
    dx_, dy_ = b[0] - a[0], b[1] - a[1]
    L2 = dx_ * dx_ + dy_ * dy_
    t = 0.0 if L2 < 1e-12 else max(0.0, min(1.0, ((p[0] - a[0]) * dx_ + (p[1] - a[1]) * dy_) / L2))
    return (a[0] + dx_ * t, a[1] + dy_ * t), t


def seg_dist(p, a, b):
    q, _ = seg_closest(p, a, b)
    return math.hypot(p[0] - q[0], p[1] - q[1])


def line_dist(p, ln):
    return min(seg_dist(p, a, b) for a, b in zip(ln, ln[1:])) if len(ln) > 1 else math.hypot(p[0] - ln[0][0], p[1] - ln[0][1])


def poly_dist(p, poly):
    return min(seg_dist(p, a, b) for a, b in zip(poly, poly[1:] + poly[:1]))


def pip(p, poly):
    x, y = p
    ins = False
    for (ax, ay), (bx, by) in zip(poly, poly[1:] + poly[:1]):
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
            ins = not ins
    return ins


def shape_dist(p, shape):
    """distance from p to an obstacle shape: ('poly', pts) (0 inside), ('line', pts), ('pt', (x, y), r)."""
    kind = shape[0]
    if kind == "poly":
        return 0.0 if pip(p, shape[1]) else poly_dist(p, shape[1])
    if kind == "line":
        return line_dist(p, shape[1])
    return max(0.0, math.hypot(p[0] - shape[1][0], p[1] - shape[1][1]) - shape[2])


def interp_uD(line_uD, u):
    """D of a line given as [(u, D)] (u increasing) at u; None outside its range."""
    if u < line_uD[0][0] - 1e-6 or u > line_uD[-1][0] + 1e-6:
        return None
    for (u0, d0), (u1, d1) in zip(line_uD, line_uD[1:]):
        if u0 - 1e-6 <= u <= u1 + 1e-6:
            return d0 if abs(u1 - u0) < 1e-9 else d0 + (u - u0) / (u1 - u0) * (d1 - d0)
    return None


def poly_area(poly):
    return 0.5 * sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(poly, poly[1:] + poly[:1]))
