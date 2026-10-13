"""Countryside kit (S1, sections/countryside: the scroll's start, scan u 29050-37610): the parts the area needs that
song_kit.py, kit_inner_city.py, kit_outer_road.py, kit_outer_road_2.py, kit_vehicles.py and kit_boats.py lack. Two
parts, each owned by one worker of the S1 Run 2 build (edit only your own section, with exact-string edits; never
rewrite the whole file):

1. GROUND (the countryside-ground pilot): terrain from the mapped banks, terraces, fields, paths, rocks and the
   stream's banks, broken and irregular as the painting draws them (no tiles, no straight lines, no plain planes).
2. SET PIECES: the thatched farmhouses, the tiled farmstead at the field, the threshing floor's things (stone roller,
   domed haystack), the wattle and brushwood fences and the hedge, the turf-decked plank bridge, the trough barrow,
   the sedan's willow spray, and the small props the map lists.

Generic builder functions in the song_kit manner: each adds faces to street_b1's bucket set `sb.B` through the
song_kit / street_b1 primitives and never opens an entity; the area builder (blender/countryside_scene.py) wraps every
call in `with sb.entity(<map id>):`. Positions always come from the caller (layout.json); sizes the strokes can't give
are keyword defaults marked `choice:` here. Frame: x = map X (east), y = map D (north), z up, metres. yaw_deg 0 = +x
(east), 90 = +y (north). Built at real size (map/BUILDING.md rule 5).
"""
import math
import random

from mathutils import Matrix, Vector

import song_kit as k
import street_b1 as sb

V = Vector
UP = V((0, 0, 1))


# ==================================================================== GROUND (the ground agent's section) ==========
# The countryside ground (the pilot, S1 Run 2): a terrain built from the map's bank lines, plots, paths, ridges and
# water, the way the painting draws it: each bank a soft face lofted between its top and foot strokes, its higher side
# north, its rise a choice of the caller's; terraces between the banks; ridges and furrows as geometry; floors smooth
# and pale; paths worn and pale in the ground's texture; the water's banks falling to its level. No tiles, no straight
# lines: every line is a smooth curve through the map's points with a small wobble, and the mesh is a constrained
# Delaunay triangulation of jittered points (mathutils.geometry.delaunay_2d_cdt) whose edges follow every bank top,
# bank foot, shore and plot rim, so the bank faces are their own surfaces ("earth") and the ink falls on the strokes.
# Large flat faces stay coarse (about 1.2 m), the triangles go into the banks, rims, ridges and shores (about 0.45 m).
#
# Generic: every term takes its positions from the caller (the area builder reads them from layout.json). The terms:
#   Bank(top, foot, rise, ...)       an inland step, higher side north (+y), lobe north decaying to `kfar`
#   Ridge(pts, h, w, ...)            a low irregular earth ridge along a line (field ridges, clods' bed, far slopes)
#   Plot(outline, h, ...)            a raised bed, plot or floor with a soft irregular rim (smooths the ground inside)
#   Wear(ring, centre, ...)          a worn path or road: paler (the ground's Blend UV) and a little lower
#   Terrain(...)                     sums them, levels them on anchors (the route), adds the water's banks and bed,
#                                    and meshes the result (Terrain.mesh)
# Frame: x = map X (east), y = map D (north), z up, metres.

import zlib as _zlib


def _crc(s):
    return _zlib.crc32(str(s).encode("utf-8")) & 0xffff


def smooth(a, b, x):
    if a == b:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def _seg(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L2 = dx * dx + dy * dy
    t = 0.0 if L2 < 1e-12 else max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2))
    qx, qy = a[0] + t * dx, a[1] + t * dy
    return math.hypot(p[0] - qx, p[1] - qy), (qx, qy), t


def pline_dist(p, ln):
    """Distance from p to the polyline ln, and the nearest point on it."""
    best, q = 1e18, None
    for a, b in zip(ln, ln[1:]):
        d, qq, _ = _seg(p, a, b)
        if d < best:
            best, q = d, qq
    return best, q


def in_poly(p, poly):
    x, y = p
    ins = False
    n = len(poly)
    for i in range(n):
        ax, ay = poly[i]
        bx_, by = poly[(i + 1) % n]
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx_ - ax) / (by - ay):
            ins = not ins
    return ins


def catmull(pts, step=0.35):
    """A smooth curve through the points (Catmull-Rom, centripetal-ish by uniform parameter), sampled about every
    `step` m: the painted stroke between the map's sparse points, never a ruled chord."""
    pts = [tuple(p[:2]) for p in pts]
    if len(pts) < 2:
        return pts
    out = []
    ext = [(2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1])] + pts + \
          [(2 * pts[-1][0] - pts[-2][0], 2 * pts[-1][1] - pts[-2][1])]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        n = max(1, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
        for j in range(n):
            t = j / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2
                                    + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    out.append(pts[-1])
    return out


def catmull_closed(ring, step=0.35):
    """A smooth closed curve through a ring of points (Catmull-Rom, wrapping), sampled about every `step` m."""
    ring = [tuple(p[:2]) for p in ring]
    n = len(ring)
    out = []
    for i in range(n):
        p0, p1, p2, p3 = ring[i - 1], ring[i], ring[(i + 1) % n], ring[(i + 2) % n]
        m = max(1, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
        for j in range(m):
            t = j / m
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2
                                    + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out


def wobble(pts, amp, rng, wl=(1.4, 3.1)):
    """Offset a sampled polyline across itself by a sum of two slow sines (amp m): no straight runs."""
    if amp <= 0 or len(pts) < 3:
        return list(pts)
    ph = [rng.uniform(0, 6.283) for _ in range(2)]
    out, s = [], 0.0
    for i, p in enumerate(pts):
        if i:
            s += math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1.0
        o = amp * (0.65 * math.sin(6.283 * s / wl[0] + ph[0]) + 0.35 * math.sin(6.283 * s / wl[1] + ph[1]))
        out.append((p[0] - dy / L * o, p[1] + dx / L * o))
    return out


def resample(pts, step):
    """Even arc-length samples of a polyline, ends kept."""
    pts = [tuple(p[:2]) for p in pts]
    if len(pts) < 2:
        return pts
    out = [pts[0]]
    carry = 0.0
    for a, b in zip(pts, pts[1:]):
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        s = step - carry
        while s < L:
            out.append((a[0] + (b[0] - a[0]) * s / L, a[1] + (b[1] - a[1]) * s / L))
            s += step
        carry = L - (s - step)
    if math.hypot(out[-1][0] - pts[-1][0], out[-1][1] - pts[-1][1]) > step * 0.3:
        out.append(pts[-1])
    else:
        out[-1] = pts[-1]
    return out


def soft_ring(corners, rng, r=0.6, wob=0.08, step=0.35):
    """A closed, soft, irregular outline from a polygon's corners: each corner rounded with its own radius, the sides
    bowed a little, the whole wobbling (a plot's or a floor's rim, never a ruled edge). Counter-clockwise."""
    c = [tuple(p[:2]) for p in corners]
    area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(c, c[1:] + c[:1]))
    if area < 0:
        c.reverse()
    pts = []
    n = len(c)
    for i in range(n):
        a, b, d = c[i - 1], c[i], c[(i + 1) % n]
        la = math.hypot(b[0] - a[0], b[1] - a[1])
        ld = math.hypot(d[0] - b[0], d[1] - b[1])
        rr = min(r * rng.uniform(0.7, 1.3), la * 0.45, ld * 0.45)
        p0 = (b[0] + (a[0] - b[0]) * rr / la, b[1] + (a[1] - b[1]) * rr / la)
        p1 = (b[0] + (d[0] - b[0]) * rr / ld, b[1] + (d[1] - b[1]) * rr / ld)
        for j in range(5):
            t = j / 4
            pts.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * b[0] + t * t * p1[0],
                        (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * b[1] + t * t * p1[1]))
    ring = resample(pts + [pts[0]], step)[:-1]
    ph = [rng.uniform(0, 6.283) for _ in range(3)]
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    out = []
    for i, p in enumerate(ring):
        a = math.atan2(p[1] - cy, p[0] - cx)
        o = wob * (math.sin(3 * a + ph[0]) + 0.6 * math.sin(7 * a + ph[1]) + 0.35 * math.sin(13 * a + ph[2]))
        dx, dy = p[0] - cx, p[1] - cy
        L = math.hypot(dx, dy) or 1.0
        out.append((p[0] + dx / L * o, p[1] + dy / L * o))
    return out


class XFn:
    """A line running west to east as y = f(x): linear between dense samples, flat past its ends."""

    def __init__(self, pts):
        q = sorted((tuple(p[:2]) for p in pts), key=lambda p: p[0])
        xs, ys = [], []
        for x, y in q:
            if xs and x - xs[-1] < 1e-3:
                continue
            xs.append(x)
            ys.append(y)
        self.xs, self.ys = xs, ys
        self.x0, self.x1 = xs[0], xs[-1]

    def __call__(self, x):
        xs, ys = self.xs, self.ys
        if x <= xs[0]:
            return ys[0]
        if x >= xs[-1]:
            return ys[-1]
        lo, hi = 0, len(xs) - 1
        while hi - lo > 1:
            m = (lo + hi) // 2
            if xs[m] <= x:
                lo = m
            else:
                hi = m
        t = (x - xs[lo]) / (xs[hi] - xs[lo])
        return ys[lo] + (ys[hi] - ys[lo]) * t


def _toe(u, toe):
    """The bank face's profile across it (0 at its foot, 1 at its top): straight, with a soft toe at the foot and a
    crisp top (the ink line falls on the top stroke)."""
    if u <= 0:
        return 0.0
    if u >= 1:
        return 1.0
    k_ = 1 - toe / 2
    return (u * u / (2 * toe) if u < toe else u - toe / 2) / k_


class Bank:
    """An inland bank, its higher side north (+y): a soft face from its foot stroke up to its top stroke, the ground
    north of the top raised by `rise` (choice), the raise holding for `plateau` m north of the top and then easing to
    `kfar` of itself over `decay` m (terraces step up without stacking without end); the rise tapers out over `taper` m
    beyond the stroke's ends, the face narrowing to a point there (a fading stroke, never a step at a line's end).
    The face is widened to stay under the walk limit (`s_max`, tan of the slope: 0.64 is 32.6 deg): the extra width
    goes `widen_top` to the top side, the rest to the foot. top and foot are point lists (the map's); foot=None makes
    a foot `gap` m south of the top (a single painted stroke)."""

    def __init__(self, mid, top, foot=None, rise=0.3, gap=0.5, widen_top=0.5, taper=3.0, plateau=4.0, decay=8.0,
                 kfar=0.35, s_max=0.64, toe=0.2, wob=0.05, rng=None, step=0.35, vary=0.0):
        rng = rng or random.Random(_crc(mid))
        self.id, self.r, self.toe = mid, rise, toe
        self.plateau, self.decay, self.kfar, self.taper = plateau, decay, kfar, taper
        top = [tuple(p[:2]) for p in top]
        if top[0][0] > top[-1][0]:
            top.reverse()
        tf = XFn(wobble(catmull(top, step), wob, rng))
        if foot:
            foot = [tuple(p[:2]) for p in foot]
            if foot[0][0] > foot[-1][0]:
                foot.reverse()
            ff = XFn(wobble(catmull(foot, step), wob * 0.8, rng))
        else:
            ff = XFn([(x, y - gap) for x, y in zip(tf.xs, tf.ys)])
        xa, xb = min(tf.x0, ff.x0), max(tf.x1, ff.x1)
        # the rise varies along the stroke by up to `vary` of itself (no bank is one even step along its length)
        vph = [rng.uniform(0, 6.283) for _ in range(2)]
        vlen = [rng.uniform(5.0, 9.0), rng.uniform(2.2, 3.6)]

        def mod(x):
            return 1 + vary * (0.7 * math.sin(6.283 * x / vlen[0] + vph[0]) + 0.3 * math.sin(6.283 * x / vlen[1] + vph[1]))
        gmin = rise * (1 + vary) / (1 - toe / 2) / s_max
        self.xa, self.xb = xa - taper, xb + taper
        n = max(2, int((self.xb - self.xa) / step) + 1)
        self.X, self.T, self.F, self.A = [], [], [], []
        for i in range(n + 1):
            x = self.xa + (self.xb - self.xa) * i / n
            t, f = tf(x), ff(x)
            g = t - f
            if g < gmin:
                ex = gmin - max(g, 0.0)
                if g < 0:
                    c = (t + f) / 2
                    t, f = c + gmin / 2, c - gmin / 2
                else:
                    t, f = t + ex * widen_top, f - ex * (1 - widen_top)
            a = (smooth(xa - taper, xa, x) * smooth(xb + taper, xb, x) if taper > 0 else 1.0) * mod(x)
            # the tongue: the face narrows to a point beyond the stroke's ends
            w = smooth(xa - taper, xa, x) * smooth(xb + taper, xb, x) if taper > 0 else 1.0
            c = (t + f) / 2
            t, f = c + (t - c) * (0.08 + 0.92 * w), c + (f - c) * (0.08 + 0.92 * w)
            self.X.append(x)
            self.T.append(t)
            self.F.append(f)
            self.A.append(a)
        self.n = n
        self.ymin = min(self.F)

    def _at(self, x):
        u = (x - self.xa) / (self.xb - self.xa) * self.n
        i = max(0, min(self.n - 1, int(u)))
        t = u - i
        return (self.T[i] + (self.T[i + 1] - self.T[i]) * t, self.F[i] + (self.F[i + 1] - self.F[i]) * t,
                self.A[i] + (self.A[i + 1] - self.A[i]) * t)

    def height(self, x, y):
        """The bank's step here: 0 south of its foot, its rise north of its top (times its taper along x). Summed
        over the banks this is a column of steps; Terrain.solve_level takes out what the tapers leave behind."""
        if x <= self.xa or x >= self.xb or y <= self.ymin:
            return 0.0
        t, f, a = self._at(x)
        if a <= 0 or y <= f:
            return 0.0
        if y >= t:
            return self.r * a
        return self.r * a * _toe((y - f) / (t - f), self.toe)

    def grid(self, xs, ys):
        """numpy: the step profile S (0..1, no taper) on the grid ys x xs, and the taper A on xs."""
        import numpy as np
        T = np.interp(xs, self.X, self.T)
        F = np.interp(xs, self.X, self.F)
        A = np.interp(xs, self.X, self.A, left=0.0, right=0.0)
        u = np.clip((ys[:, None] - F[None, :]) / np.maximum(T - F, 1e-3)[None, :], 0.0, 1.0)
        k_ = 1 - self.toe / 2
        S = np.where(u < self.toe, u * u / (2 * self.toe), u - self.toe / 2) / k_
        return np.clip(S, 0.0, 1.0), A

    def top_line(self):
        return list(zip(self.X, self.T))

    def foot_line(self):
        return list(zip(self.X, self.F))

    def ring(self):
        """The face's outline (top west to east, foot back): the bank's own surface."""
        return self.top_line() + list(reversed(self.foot_line()))[1:-1]


class Ridge:
    """A low earth ridge along a line (a field's bank ridge, the clods' bed): height h, half-width w, its height
    varying along it (lumps) and fading at its ends over `fade` m."""

    def __init__(self, mid, pts, h=0.06, w=0.3, lump=0.35, fade=1.0, rng=None, step=0.3, wob=0.04):
        rng = rng or random.Random(_crc(mid))
        self.id, self.h, self.w = mid, h, w
        self.pts = wobble(catmull(pts, step), wob, rng)
        self.s = [0.0]
        for a, b in zip(self.pts, self.pts[1:]):
            self.s.append(self.s[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        self.L, self.fade = self.s[-1], fade
        self.ph = [rng.uniform(0, 6.283) for _ in range(3)]
        self.lump = lump
        xs, ys = [p[0] for p in self.pts], [p[1] for p in self.pts]
        m = 2.5 * w
        self.box = (min(xs) - m, max(xs) + m, min(ys) - m, max(ys) + m)

    def height(self, x, y):
        b = self.box
        if not (b[0] < x < b[1] and b[2] < y < b[3]):
            return 0.0
        best, sb_ = 1e9, 0.0
        for i, (a, c) in enumerate(zip(self.pts, self.pts[1:])):
            d, _, t = _seg((x, y), a, c)
            if d < best:
                best, sb_ = d, self.s[i] + t * (self.s[i + 1] - self.s[i])
        if best > 2.5 * self.w:
            return 0.0
        along = smooth(0, self.fade, sb_) * smooth(self.L, self.L - self.fade, sb_)
        lump = 1 + self.lump * (math.sin(sb_ * 2.1 + self.ph[0]) * 0.6 + math.sin(sb_ * 5.3 + self.ph[1]) * 0.4)
        return self.h * along * lump * math.exp(-(best / self.w) ** 2 * 1.6)


class Plot:
    """A raised plot, bed or floor with a soft irregular rim: up `h` inside its outline (`rim` m of soft edge), the
    ground's undulation damped inside it by `calm` (a floor is smooth), paler by `bare` (the ground's Blend UV)."""

    def __init__(self, mid, outline, h=0.1, rim=0.35, calm=0.6, bare=0.85):
        self.id, self.ring, self.h, self.rim, self.calm, self.bare_v = mid, outline, h, rim, calm, bare
        xs, ys = [p[0] for p in outline], [p[1] for p in outline]
        m = rim + 0.6
        self.box = (min(xs) - m, max(xs) + m, min(ys) - m, max(ys) + m)
        self.closed = list(outline) + [outline[0]]

    def inside(self, x, y):
        """-1 outside .. +1 inside, soft over the rim (0 on the outline)."""
        b = self.box
        if not (b[0] < x < b[1] and b[2] < y < b[3]):
            return -1.0
        d, _ = pline_dist((x, y), self.closed)
        sd = d if in_poly((x, y), self.ring) else -d
        return max(-1.0, min(1.0, sd / self.rim))

    def weight(self, x, y):
        return smooth(-1.0, 1.0, self.inside(x, y))


class Wear:
    """A worn path or road: its strip (a ring from its two edges) paler and a little lower, its centre line the most
    worn; the edges noisy, never ruled."""

    def __init__(self, mid, ring, centre, depth=0.03, edge=0.6, strip=0.7, rng=None):
        rng = rng or random.Random(_crc(mid))
        self.id, self.ring, self.depth, self.edge, self.strip = mid, ring, depth, edge, strip
        self.closed = list(ring) + [ring[0]]
        self.centre = catmull(centre, 0.5)
        xs, ys = [p[0] for p in ring], [p[1] for p in ring]
        self.box = (min(xs) - 2, max(xs) + 2, min(ys) - 2, max(ys) + 2)
        self.ph = [rng.uniform(0, 6.283) for _ in range(4)]

    def wear(self, x, y):
        b = self.box
        if not (b[0] < x < b[1] and b[2] < y < b[3]):
            return 0.0
        wob = 0.35 * math.sin(0.73 * x + self.ph[0]) * math.cos(0.61 * y + self.ph[1]) + \
            0.18 * math.sin(1.9 * x - 1.3 * y + self.ph[2])
        d, _ = pline_dist((x, y), self.closed)
        sd = d if in_poly((x, y), self.ring) else -d
        w_strip = smooth(-self.edge, self.edge, sd + wob)
        dc, _ = pline_dist((x, y), self.centre)
        w_c = 1 - smooth(0.5, 1.4, dc + 0.6 * wob)
        return max(self.strip * w_strip, w_c * w_strip if w_strip > 0.05 else 0.0, w_c * 0.8)


class Water:
    """One reach's water for the terrain: its polygon (the strip's, as built), its shores, the land tongues standing in
    it (rings), and per shore the width of its bank (a shore bank's face from the shore up to its land line)."""

    def __init__(self, mid, polygon, shores, H, spits=(), banks=(), w_def=1.5, w_cap=3.2):
        self.id, self.H = mid, H
        self.poly = [tuple(p) for p in polygon]
        self.closed = self.poly + [self.poly[0]]
        self.shores = [[tuple(p[:2]) for p in s] for s in shores]
        self.spits = list(spits)      # [(id, ring, back, streak)]: a land tongue; streak: a shoal's broken streaks
        self.banks = list(banks)      # [(id, land_line)]
        self.w_def, self.w_cap = w_def, w_cap
        xs, ys = [p[0] for p in self.poly], [p[1] for p in self.poly]
        self.box = (min(xs) - 4, max(xs) + 4, min(ys) - 4, max(ys) + 4)


class Terrain:
    """The sum of the terms, levelled on anchors, with the water's banks and bed: h(x, y), bare(x, y), and mesh()."""

    def __init__(self, rng, seam=None, undulate=(0.05, 0.018)):
        self.banks, self.ridges, self.plots, self.wears, self.waters = [], [], [], [], []
        self.anchors = []            # [(x, y, target H)]
        self.sigma = 7.0
        self.seam = seam             # (a, b): the seam line; the ground dips 0.12 m toward it
        self.pads = []               # [(x, y, r)]: ground kept at its land height (a bridge's end on its bank)
        self.ph = [rng.uniform(0, 6.283) for _ in range(8)]
        self.amp = undulate
        self.shore_pts = None

    # -- the land
    def undulation(self, x, y):
        a, b = self.amp
        ph = self.ph
        return (a * (0.6 * math.sin(0.41 * x + ph[0]) * math.cos(0.33 * y + ph[1]) + 0.4 * math.sin(0.19 * x - 0.27 * y + ph[2]))
                + b * (math.sin(1.7 * x + 1.1 * y + ph[3]) * 0.6 + math.sin(2.9 * x - 2.3 * y + ph[4]) * 0.4))

    def h1(self, x, y):
        """The raw land: banks, ridges, plots, wear and undulation, before levelling."""
        z = 0.0
        for b in self.banks:
            z += b.height(x, y)
        calm = 0.0
        for p in self.plots:
            w = p.weight(x, y)
            if w > 0:
                z += p.h * w
                calm = max(calm, p.calm * w)
        wear = self.wear(x, y)
        z += self.undulation(x, y) * (1 - calm) * (1 - 0.5 * wear)
        for r in self.ridges:
            z += r.height(x, y)
        z -= max(w.depth * w.wear(x, y) for w in self.wears) if self.wears else 0.0
        return z

    def wear(self, x, y):
        return max((w.wear(x, y) for w in self.wears), default=0.0)

    def solve_level(self, box, cell=1.0, iters=6000, tol=1e-7):
        """The level field (numpy, on a `cell` m grid over box = (x0, x1, y0, y1)): the banks summed as columns of
        steps (Bank.height) are right across every face but carry each step on north of a stroke's end as a ramp along
        x (the taper). The level field Phi takes those ramps out in the least-squares sense (its x-gradient the ramps'
        opposite, its y-gradient 0) while holding the anchors (x, y, H, weight) at their H, so the steps stay crisp on
        the painted faces, fade smoothly round the strokes' ends in every direction (a finite bank is an embankment
        whose raise eases off away from it, not a terrace running on without end) and the walk keeps its levels.
        Solved by conjugate gradients."""
        import numpy as np
        x0, x1, y0, y1 = box
        nx, ny = int(math.ceil((x1 - x0) / cell)) + 1, int(math.ceil((y1 - y0) / cell)) + 1
        xs = x0 + cell * np.arange(nx)
        ys = y0 + cell * np.arange(ny)
        gx = np.zeros((ny, nx - 1))
        for b in self.banks:
            S, A = b.grid(xs, ys)
            gx -= b.r * (A[None, 1:] - A[None, :-1]) * (S[:, 1:] + S[:, :-1]) / 2
        W = np.full((ny, nx), 1e-6)
        Tt = np.zeros((ny, nx))
        for ax, ay, t, w in self.anchors:
            i, j = int(round((ay - y0) / cell)), int(round((ax - x0) / cell))
            if 0 <= i < ny and 0 <= j < nx:
                tgt = t - self.h1(ax, ay)
                Tt[i, j] = (Tt[i, j] * W[i, j] + tgt * w) / (W[i, j] + w)
                W[i, j] += w

        def Amul(P):
            out = W * P
            d = P[:, 1:] - P[:, :-1]
            out[:, 1:] += d
            out[:, :-1] -= d
            d = P[1:, :] - P[:-1, :]
            out[1:, :] += d
            out[:-1, :] -= d
            return out
        bvec = W * Tt
        bvec[:, 1:] += gx
        bvec[:, :-1] -= gx
        P = np.zeros((ny, nx))
        r = bvec - Amul(P)
        d = r.copy()
        rr = float((r * r).sum())
        b2 = float((bvec * bvec).sum()) or 1.0
        it = 0
        for it in range(iters):
            Ad = Amul(d)
            alpha = rr / float((d * Ad).sum())
            P += alpha * d
            r -= alpha * Ad
            rn = float((r * r).sum())
            if rn < tol * tol * b2:
                break
            d = r + (rn / rr) * d
            rr = rn
        self.phi = (P.tolist(), x0, y0, cell, nx, ny)
        self.solve_info = {"grid": [nx, ny], "iters": it + 1, "residual": (rn / b2) ** 0.5}
        return self.solve_info

    def corr(self, x, y):
        """minus the level field at (x, y) (bilinear)."""
        if not getattr(self, "phi", None):
            return 0.0
        P, x0, y0, c, nx, ny = self.phi
        fx = min(max((x - x0) / c, 0.0), nx - 1.001)
        fy = min(max((y - y0) / c, 0.0), ny - 1.001)
        j, i = int(fx), int(fy)
        tx, ty = fx - j, fy - i
        v = (P[i][j] * (1 - tx) * (1 - ty) + P[i][j + 1] * tx * (1 - ty) + P[i + 1][j] * (1 - tx) * ty
             + P[i + 1][j + 1] * tx * ty)
        return -v

    def land(self, x, y):
        z = self.h1(x, y) - self.corr(x, y)
        if self.seam:
            a, b = self.seam
            # the signed distance east of the seam line (a -> b runs south to north)
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            d = ((x - a[0]) * dy - (y - a[1]) * dx) / L
            z -= 0.12 * (1 - smooth(-0.5, 2.5, d))
        return z

    # -- the water
    def prepare_water(self, s_max=0.64):
        """Sample every shore (0.3 m) with its bank's width: the distance to a shore bank's land line where one runs
        along it (widened to keep under the walk limit), else w_def."""
        self.shore_pts = []
        for wa in self.waters:
            for s in wa.shores:
                for q in resample(s, 0.3):
                    w = wa.w_def
                    for bid, land in wa.banks:
                        d, _ = pline_dist(q, land)
                        if d < wa.w_cap:
                            w = max(0.5, d)
                            break
                    # the drop from the land 2 m inland of the shore to the water
                    dh = max(0.0, self.land(*self._inland(wa, q, 2.0)) - wa.H)
                    w = max(w, dh / (1 - 0.2 / 2) / s_max, 0.6)
                    self.shore_pts.append((q[0], q[1], min(w, wa.w_cap), wa))
        self._grid = {}
        for sp in self.shore_pts:
            self._grid.setdefault((int(sp[0] // 2), int(sp[1] // 2)), []).append(sp)

    def _inland(self, wa, q, dist):
        best = None
        for ang in range(0, 360, 30):
            p = (q[0] + dist * math.cos(math.radians(ang)), q[1] + dist * math.sin(math.radians(ang)))
            if not in_poly(p, wa.poly):
                d, _ = pline_dist(p, wa.closed)
                if best is None or d > best[0]:
                    best = (d, p)
        return best[1] if best else q

    def _near_shore(self, x, y, reach=4.0):
        gx, gy = int(x // 2), int(y // 2)
        best = None
        rr = int(reach // 2) + 1
        for i in range(gx - rr, gx + rr + 1):
            for j in range(gy - rr, gy + rr + 1):
                for sp in self._grid.get((i, j), ()):
                    d = math.hypot(x - sp[0], y - sp[1])
                    if best is None or d < best[0]:
                        best = (d, sp)
        return best

    def water_at(self, x, y):
        for wa in self.waters:
            b = wa.box
            if b[0] < x < b[1] and b[2] < y < b[3] and in_poly((x, y), wa.poly):
                return wa
        return None

    def h(self, x, y):
        """The built ground: the land, falling to the water's level at its shores over each shore's bank width, the
        bed under the water, the land tongues at the water's level with their backs a little raised."""
        zl = self.land(x, y)
        wa = self.water_at(x, y)
        pad = 0.0
        for px, py, pr in self.pads:
            pad = max(pad, 1 - smooth(pr * 0.55, pr, math.hypot(x - px, y - py)))
        if wa is not None:
            for sid, ring, back, streak in wa.spits:
                if in_poly((x, y), ring):
                    d, _ = pline_dist((x, y), list(ring) + [ring[0]])
                    # a low rounded back (a dome over about 0.7 m from the waterline), lumpy along its length; a shoal
                    # only breaks the water in short streaks
                    lump = 0.75 + 0.25 * math.sin(1.3 * x + 0.7 * y + self.ph[7]) * math.cos(2.9 * x - 1.1 * y)
                    if back < 0:     # a bar under the water
                        return wa.H + back * smooth(0.0, 0.4, d) - 0.05 * (1 - smooth(0.0, 0.4, d))
                    # the edge 0.05 m under the water: the outline is where the back meets the water, not the ring
                    zz = -0.05 + (back + 0.05) * (1 - (1 - smooth(0.0, 0.7, d)) ** 2) * lump
                    if streak:
                        m = 0.5 + 0.5 * math.sin(0.9 * x + self.ph[6]) * math.sin(2.3 * x + 0.4 * y + self.ph[5])
                        zz = back * smooth(0.0, 0.5, d) * (m - 0.45) * 2.2
                    return wa.H + zz
            d, _ = pline_dist((x, y), wa.closed)
            for sid, ring, back, streak in wa.spits:
                d = min(d, pline_dist((x, y), list(ring) + [ring[0]])[0])
            zb = wa.H - 0.16 * smooth(0.0, 0.22, d) - 0.7 * smooth(0.1, 1.9, d)
            return zb + (min(zl, wa.H + 0.7) - 0.03 - zb) * pad if pad > 0 else zb
        ns = self._near_shore(x, y) if self.shore_pts else None
        if ns is None:
            return zl
        d, (sx, sy, w, wa) = ns
        if d >= w:
            return zl
        zw = wa.H + (max(zl, wa.H) - wa.H) * _toe(d / w, 0.2)
        return zw + (zl - zw) * pad

    def bare(self, x, y):
        b = 0.18 + 0.12 * (0.5 + 0.5 * math.sin(0.23 * x + self.ph[5]) * math.cos(0.31 * y + self.ph[6]))
        for p in self.plots:
            w = p.weight(x, y)
            if w > 0:
                b = max(b, p.bare_v * w)
        b = max(b, self.wear(x, y))
        if self.shore_pts:
            ns = self._near_shore(x, y)
            if ns:
                b = max(b, 0.8 * (1 - smooth(0.3, 1.8, ns[0])))
        return min(1.0, b)

    # -- the mesh
    def mesh(self, domain, lines, rings, density, rng, fine=0.45, coarse=1.2, far=3.4, near_w=1.3, clear=0.13,
             extra=()):
        """Constrained Delaunay mesh of the ground. domain: the ground's outer ring; lines: constraint polylines (bank
        faces' outlines, shores, rims, ridges); rings: [(tag, ring)] regions whose triangles are tagged (a triangle's
        tags: every ring its centroid lies in; a ring that must split surfaces has its outline in `lines` too, sampled
        the same way); density(x, y) -> 'coarse' | 'far' (the caller's map of where detail goes; within near_w of a
        line it is fine).
        Returns (verts [(x, y)], tris [(i, j, k)], tags [[tag, ...] per tri])."""
        from mathutils import Vector as _V
        from mathutils.geometry import delaunay_2d_cdt
        pts, edges = [], []
        cell = {}

        def add_pt(p):
            pts.append(p)
            cell.setdefault((int(p[0] // 0.5), int(p[1] // 0.5)), []).append(p)
            return len(pts) - 1
        # the lines clipped to the domain (a constraint running out of it would leak the triangulation)
        for ln in lines:
            run = []
            for p in list(ln) + [None]:
                if p is not None and in_poly(p, domain):
                    run.append(p)
                    continue
                if len(run) >= 2:
                    idx = [add_pt(q) for q in run]
                    edges += list(zip(idx, idx[1:]))
                elif len(run) == 1:
                    add_pt(run[0])
                run = []
        for p in extra:
            if in_poly(p, domain):
                add_pt(p)
        dom = [add_pt(p) for p in domain]
        edges += list(zip(dom, dom[1:] + dom[:1]))
        ring_ids = [(tag, list(ring)) for tag, ring in rings]   # tags only: their edges come in `lines`
        # the near-feature mask: cells within near_w of any constraint point
        near = set()
        r_ = int(math.ceil(near_w / 0.5))
        for (i, j) in list(cell.keys()):
            for a in range(-r_, r_ + 1):
                for b in range(-r_, r_ + 1):
                    near.add((i + a, j + b))
        xs, ys = [p[0] for p in domain], [p[1] for p in domain]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        nx, ny = int((x1 - x0) / fine) + 1, int((y1 - y0) / fine) + 1
        kc_, kf = max(1, round(coarse / fine)), max(1, round(far / fine))
        for j in range(ny):
            for i in range(nx):
                x, y = x0 + (i + 0.5) * fine, y0 + (j + 0.5) * fine
                key = (int(x // 0.5), int(y // 0.5))
                kind = "fine" if key in near else density(x, y)
                step = {"fine": 1, "coarse": kc_, "far": kf}[kind]
                if i % step or j % step:
                    continue
                s = fine * step
                p = (x + rng.uniform(-0.38, 0.38) * s, y + rng.uniform(-0.38, 0.38) * s)
                if not in_poly(p, domain):
                    continue
                ok = True
                for a in (-1, 0, 1):
                    for b in (-1, 0, 1):
                        for q in cell.get((key[0] + a, key[1] + b), ()):
                            if abs(q[0] - p[0]) < clear and abs(q[1] - p[1]) < clear:
                                ok = False
                if ok:
                    pts.append(p)
        # one face (the domain): the rings are constraints only, and each triangle is tagged by the rings its centroid
        # lies in (delaunay_2d_cdt's own face membership leaks when many rings cross each other)
        out = delaunay_2d_cdt([_V(p) for p in pts], edges, [dom], 1, 1e-5, True)
        verts = [(v.x, v.y) for v in out[0]]
        boxes = []
        for tag, ring in ring_ids:
            xs_, ys_ = [p[0] for p in ring], [p[1] for p in ring]
            boxes.append((tag, ring, min(xs_), max(xs_), min(ys_), max(ys_)))
        tris, tags = [], []
        for f in out[2]:
            if len(f) != 3:
                continue
            cx = (verts[f[0]][0] + verts[f[1]][0] + verts[f[2]][0]) / 3
            cy = (verts[f[0]][1] + verts[f[1]][1] + verts[f[2]][1]) / 3
            if not in_poly((cx, cy), domain):
                continue
            tris.append(tuple(f))
            tags.append([tag for tag, ring, a0, a1, b0, b1 in boxes
                         if a0 <= cx <= a1 and b0 <= cy <= b1 and in_poly((cx, cy), ring)])
        return verts, tris, tags


class TriLookup:
    """The height of a triangulated surface at (x, y): barycentric in the triangle under the point (a 2 m hash)."""

    def __init__(self, verts, tris, z):
        self.v, self.t, self.z = verts, tris, z
        self.g = {}
        for n, (a, b, c) in enumerate(tris):
            xs = (verts[a][0], verts[b][0], verts[c][0])
            ys = (verts[a][1], verts[b][1], verts[c][1])
            for i in range(int(min(xs) // 2), int(max(xs) // 2) + 1):
                for j in range(int(min(ys) // 2), int(max(ys) // 2) + 1):
                    self.g.setdefault((i, j), []).append(n)

    def __call__(self, x, y):
        for n in self.g.get((int(x // 2), int(y // 2)), ()):
            a, b, c = self.t[n]
            (ax, ay), (bx_, by), (cx, cy) = self.v[a], self.v[b], self.v[c]
            den = (by - cy) * (ax - cx) + (cx - bx_) * (ay - cy)
            if abs(den) < 1e-12:
                continue
            l1 = ((by - cy) * (x - cx) + (cx - bx_) * (y - cy)) / den
            l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den
            l3 = 1 - l1 - l2
            if l1 >= -1e-6 and l2 >= -1e-6 and l3 >= -1e-6:
                return l1 * self.z[a] + l2 * self.z[b] + l3 * self.z[c]
        return None


def upright_rock(mat, x, y, z, rx, ry, h, rng, lean=(0.0, 0.0), nu=14, nv=9, lump=0.12, collide=True):
    """A pale pointed upright rock (a standing stone): a lumpy spindle, broad at its base sunk into the ground,
    narrowing to a blunt point, leaning a little; smooth-shaded."""
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    verts = []
    for j in range(nv + 1):
        t = j / nv                                   # 0 = base, 1 = tip
        rad = (1 - t ** 1.6) ** 0.75 if t < 1 else 0.0
        zz = z - 0.15 + (h + 0.15) * t
        for i in range(nu):
            a = 2 * math.pi * i / nu
            n = 1 + lump * (math.sin(2.3 * a + ph[0] + 3 * t) * 0.6 + math.sin(5.1 * a + ph[1] - 5 * t) * 0.4)
            verts.append(V((x + lean[0] * t * h + math.cos(a) * rx * rad * n,
                            y + lean[1] * t * h + math.sin(a) * ry * rad * n, zz)))
    faces = []
    for j in range(nv):
        for i in range(nu):
            a0, a1 = j * nu + i, j * nu + (i + 1) % nu
            faces.append((a0, a1, a1 + nu, a0 + nu))
    faces.append(tuple(reversed(range(nu))))
    sb.B.add(mat, collide, verts, faces)


def standing_stone(mat, x, y, z, w, d, h, rng, lean=(0.0, 0.0)):
    """A tall weathered standing rock (a pale pointed upright rock): a lumpy main mass, a split-off slab leaning on its
    side and a low stone at its foot, coarse enough that its facets break sharp (the cracks the painter hatches), each
    its own size and set. w x d at its base, h tall."""
    k.boulder(mat, x, y, z + 0.05, w * 0.5, d * 0.5, h, rng, nu=16, nv=11, lump=0.2, sink=0.3)
    a = rng.uniform(0, 6.283)
    k.boulder(mat, x + math.cos(a) * w * 0.4, y + math.sin(a) * d * 0.4, z, w * 0.32, d * 0.36, h * 0.58, rng,
              nu=13, nv=9, lump=0.22, sink=0.35)
    a2 = a + rng.uniform(2.2, 3.6)
    k.boulder(mat, x + math.cos(a2) * w * 0.55, y + math.sin(a2) * d * 0.55, z, w * 0.3, d * 0.24, h * 0.2, rng,
              nu=11, nv=7, lump=0.26, sink=0.4)


def outcrop(mat, centre, rx, ry, h, rng, z_of, n=4, crack_mat=None):
    """A rock outcrop rising in a dome (山石 with crack strokes): a big soft boulder and smaller ones pressed against it,
    their joints the crack lines the painter draws; z_of(x, y) gives the ground."""
    cx, cy = centre
    k.boulder(mat, cx, cy, z_of(cx, cy), rx, ry, h, rng, nu=20, nv=10, lump=0.16, sink=0.3)
    for i in range(n):
        a = rng.uniform(0, 6.283)
        f = rng.uniform(0.45, 0.8)
        px, py = cx + math.cos(a) * rx * f, cy + math.sin(a) * ry * f
        s = rng.uniform(0.35, 0.6)
        k.boulder(crack_mat or mat, px, py, z_of(px, py), rx * s, ry * s * rng.uniform(0.8, 1.2), h * s * rng.uniform(0.7, 1.1),
                  rng, nu=14, nv=8, lump=0.18, sink=0.35)


def stony_ground(mat, ring, rng, z_of, n=9, size=(0.25, 0.7), flat=0.45):
    """Low broken stony ground inside a ring: low flat boulders and small faceted stones, each its own size and set."""
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    placed_ = []
    tries = 0
    while len(placed_) < n and tries < n * 40:
        tries += 1
        p = (rng.uniform(min(xs), max(xs)), rng.uniform(min(ys), max(ys)))
        if not in_poly(p, ring):
            continue
        r = rng.uniform(*size)
        if any(math.hypot(p[0] - q[0], p[1] - q[1]) < (r + rr) * 0.8 for q, rr in placed_):
            continue
        placed_.append((p, r))
        k.boulder(mat, p[0], p[1], z_of(*p), r * rng.uniform(1.0, 1.5), r, r * flat * rng.uniform(0.7, 1.3), rng,
                  nu=12, nv=7, lump=0.2, sink=0.4)
    return len(placed_)


def clods(mat, pts, rng, z_of, every=0.32, size=(0.06, 0.13)):
    """A ridge of clods along a line: small faceted lumps of earth, each its own size, spacing and set."""
    line_ = resample(catmull(pts, 0.3), every)
    for p in line_:
        if rng.random() < 0.18:
            continue
        x, y = p[0] + rng.uniform(-0.1, 0.1), p[1] + rng.uniform(-0.1, 0.1)
        r = rng.uniform(*size)
        k.rock(mat, x, y, z_of(x, y) + r * 0.25, r, rng, flat=rng.uniform(0.45, 0.7))
    return len(line_)
# ==================================================================== END GROUND ==================================


# ==================================================================== SET PIECES (the kit agent's section) =========
# S1's set pieces and props (the kit agent, Run 2), built at real size from the strokes and the map's `what`, never
# from the restyle (it tiles every thatched roof blue). Thatch is `reed` (its strands laid down the slope), old straw
# and brushwood `bark`, wattle-and-daub `plaster` on a `rammed` foot, tiles `roof`, ridges `ridge`, dark insides
# `interior`, willow whips `willow`. Thin things (fringe tufts, strands, leaves) are single faces (the exported
# materials are double-sided). Colliders only on what stops a walker: walls, posts, fences and hedges (hidden boards),
# the bridge's deck and its invisible side rails, jars, heaps; never on seats. Functions that build in their own frame
# take origin (x, y) and yaw_deg: x along the front, y back from it (yaw 0: the front faces south). Review sheets:
# gen/sections/countryside/kit_review/ (the kit agent's scratch review.py).
import kit_inner_city as _ki  # noqa: E402
import kit_outer_road as _ko  # noqa: E402
import kit_outer_road_2 as _k2  # noqa: E402
import kit_vehicles as _kv  # noqa: E402
try:   # the round's shared parts (factory (c), gen/expand/round2/catalogue.md order c2); stubs below until it lands
    import kit_common as _kc  # noqa: E402
except ImportError:
    _kc = None

_STRAW, _OLD, _BRUSH, _DARK = _ko.STRAW, "bark", "bark", "interior"


def sp_tris():
    """Triangles in the bucket set so far (for per-piece counts)."""
    return sum(len(f) - 2 for b in sb.B.data.values() for f in b["f"])


def _sp_has(name):
    return _kc is not None and hasattr(_kc, name)


# ---- the shared parts: kit_common's when it has them, these stubs (same signatures, honest geometry) until then

def kc_thatch_gablet(apex, foot_l, foot_r, depth, rng, kingpost=True, mat=_STRAW):
    """kit_common.thatch_gablet, or the stub: a small pale gable vent (a plaster triangle apex / foot_l / foot_r, seen
    from outside with foot_l on the left) with a king post and a tie beam, under two little thatch slopes that run
    `depth` m back into the hip from the triangle and 0.3 m out over it, with ragged ends. Returns the triangles."""
    if _sp_has("thatch_gablet"):
        return _kc.thatch_gablet(apex, foot_l, foot_r, depth, rng, kingpost=kingpost, mat=mat)
    t0 = sp_tris()
    A, Lf, Rf = V(apex), V(foot_l), V(foot_r)
    right = Rf - Lf
    right.z = 0
    b = right.length / 2
    right.normalize()
    n = right.cross(UP)
    base = (Lf + Rf) / 2
    k.add("plaster", False, [Lf, Rf, A], [(0, 1, 2)])
    if kingpost:
        k.beam("timber", False, base + n * 0.035 - UP * 0.02, A + n * 0.035 - UP * 0.02, 0.08, 0.08, 0.01)
        k.beam("timber", False, Lf + n * 0.04 - right * 0.06 + UP * 0.03, Rf + n * 0.04 + right * 0.06 + UP * 0.03,
               0.09, 0.1, 0.012)
        for sgn in (-1, 1):
            k.beam("timber", False, base.lerp(A, 0.3) + n * 0.03, base + right * (sgn * b * 0.55) + n * 0.03 + UP * 0.02,
                   0.05, 0.05, 0)
    ov, th = 0.3, 0.16
    rt = A + UP * 0.17
    for sgn in (-1, 1):
        lo = base + right * (sgn * (b + 0.24)) - UP * 0.1
        top = [rt + n * ov, rt - n * depth, lo - n * depth, lo + n * ov]
        if (top[1] - top[0]).cross(top[2] - top[1]).z < 0:
            top.reverse()
        _ko._hexa(mat, False, [p - UP * th for p in top], top)
        edge = [(lo + n * ov).lerp(lo - n * depth, f) - UP * 0.08 for f in (0.0, 0.35, 0.7)]
        _sp_fringe(edge, tuple(base - right * sgn * 2), rng, "ragged", (0.06, 0.16), closed=False, mat=mat)
        barge = [(rt + n * ov).lerp(lo + n * ov, f) - UP * 0.1 for f in (0.0, 0.5, 1.0)]
        _sp_fringe(barge, tuple(base - n * 2), rng, "ragged", (0.05, 0.12), closed=False, mat=mat)
    return sp_tris() - t0


def kc_thatch_lean_to(p0, p1, depth, z_low, z_high, rng, posts=0, fringe=True, side=1, thick=0.22, mat=_STRAW):
    """kit_common.thatch_lean_to, or the stub: a single-slope roof of thatch or brush whose low eave runs from p0 to
    p1 (plan points) at z_low and rises `depth` m to the side `side` (1: the left of p0 -> p1, -1: its right) to
    z_high; a soft slab with a rolled front edge and a slight sag, ragged straw ends along the eave and the ends;
    posts: n round posts under the eave (a skirt carried at its front), or (n_front, n_back) under both edges (a
    free-standing open shed), on z 0 of the caller's frame (wrap the call in song_kit.placed on raised ground), with
    plates and knee braces; 0: a skirt the caller's walls carry. Returns the triangles.
    choice: overhang 0.3 m past p0, p1 and the eave line."""
    if _sp_has("thatch_lean_to"):
        return _kc.thatch_lean_to(p0, p1, depth, z_low, z_high, rng, posts=posts, fringe=fringe, side=side, thick=thick,
                                  mat=mat)
    t0 = sp_tris()
    a = V((p0[0], p0[1], 0))
    bq = V((p1[0], p1[1], 0))
    if side < 0:
        a, bq = bq, a
    yaw = math.degrees(math.atan2(bq.y - a.y, bq.x - a.x))
    W = (bq - a).length
    nf, nb = (posts, 0) if isinstance(posts, int) else (int(posts[0]), int(posts[1]))
    pl = []
    for n_, y_ in ((nf, 0.08), (nb, depth - 0.08)):
        for i in range(n_):
            pl.append((0.1 + (W - 0.2) * (i / (n_ - 1) if n_ > 1 else 0.5), y_))
    _sp_lean_to_body(a, yaw, W, depth, rng, z0=0.0, z_low=z_low, z_high=z_high, over=0.3, thick=thick, posts=pl,
                     fringe=fringe, mat=mat)
    return sp_tris() - t0


def kc_board_wall(p0, p1, z0, z1, rng, battens=2, ragged=True, doors=(), mat="timber", collide=True):
    """kit_common.board_wall, or the stub: a wall of vertical boards from plan p0 to p1 (its face to the right), z0 to
    z1: planks of their own widths with hairline gaps, each its own height and (ragged) foot, `battens` battens
    across, door-like panels (doors: [(a0, a1)] metres along it) framed by two stiles and a lintel; a hidden collider
    board behind. Returns the triangles."""
    if _sp_has("board_wall"):
        return _kc.board_wall(p0, p1, z0, z1, rng, battens=battens, ragged=ragged, doors=doors, mat=mat, collide=collide)
    t0 = sp_tris()
    bt = (0.3, None) if battens >= 2 else ((None,) if battens == 1 else ())
    _sp_board_wall(p0, p1, z0, z1 - z0, rng, battens=bt, mat=mat, collide=collide, ragged=ragged)
    A, Bp = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (Bp - A).normalized()
    nrm = V((t.y, -t.x, 0))
    for a0, a1 in doors:
        for a_ in (a0, a1):
            p = A + t * a_ + nrm * 0.035
            k.beam(mat, False, p + UP * z0, p + UP * (z0 + min(1.85, z1 - z0 - 0.1)), 0.07, 0.04, 0.008)
        k.beam(mat, False, A + t * (a0 - 0.05) + nrm * 0.035 + UP * (z0 + min(1.9, z1 - z0 - 0.05)),
               A + t * (a1 + 0.05) + nrm * 0.035 + UP * (z0 + min(1.9, z1 - z0 - 0.05)), 0.08, 0.05, 0.008)
    return sp_tris() - t0


def kc_mooring_stake(x, y, z_foot, z_top, rng, r=0.06, top="taper", rope=None, lamp=False):
    """kit_common.mooring_stake, or the stub: a thin tapered pole planted in the bed (S1.prop.mooring_pole_36444),
    its top plain and tapering ('taper') or knobbed; rope 'turns' winds a few turns under the top. Returns the rope
    point (x, y, z): where a boat's mooring line ends."""
    if _sp_has("mooring_stake"):
        return _kc.mooring_stake(x, y, z_foot, z_top, rng, r=r, top=top, rope=rope, lamp=lamp)
    lean = (rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04))
    tx, ty = x + lean[0], y + lean[1]
    sb.cyl("timber", True, (x, y, z_foot - 0.4), (tx, ty, z_top - 0.06), r * 1.1, r * 0.6, segs=6)
    if top == "knob":
        k.rock("timber", tx, ty, z_top - 0.06, r * 1.2, rng, flat=0.8)
    else:
        _ko._lathe3("timber", False, (tx, ty, z_top - 0.06), V((1, 0, 0)), V((0, 1, 0)), UP,
                    [(r * 0.6, r * 0.6, 0.0), (r * 0.3, r * 0.3, 0.04), (0.0, 0.0, 0.06)], segs=6, cap0=False)
    zr = z_top - 0.22
    if rope:
        for q in range(3):
            zz = zr - 0.03 + q * 0.025
            sb.cyl("rope", False, (tx, ty, zz - 0.01), (tx, ty, zz + 0.01), r * 0.75 + 0.012, segs=6, caps=False)
    return (tx, ty, round(zr, 3))


def _sp_frame(origin, yaw_deg, z0=0.0):
    return k.frame(origin[0], origin[1], z0, yaw_deg)


def _sp_local(origin, yaw_deg, p):
    """A world plan point in a building's frame (origin, yaw)."""
    a = math.radians(yaw_deg)
    dx, dy = p[0] - origin[0], p[1] - origin[1]
    return (dx * math.cos(a) + dy * math.sin(a), -dx * math.sin(a) + dy * math.cos(a))


def _sp_tuft(mat, a, b, out, L, rng, side=0.03):
    """One hanging bundle of straw ends from the hem segment a-b: a strip down about L, narrowing a little, its end cut
    ragged (each corner its own length), pushed out a little: straw hanging in bundles, not teeth."""
    a, b = V(a), V(b)
    t = (b - a).normalized()
    o = out * rng.uniform(0.015, 0.05) + t * rng.uniform(-side, side)
    w = (b - a).length
    pa = a + o + t * (w * 0.12) - UP * (L * rng.uniform(0.65, 1.0))
    pb = b + o - t * (w * 0.12) - UP * (L * rng.uniform(0.65, 1.0))
    k.add(mat, False, [a, b, pb, pa], [(0, 1, 2, 3)])


def _sp_fringe(hem, centre, rng, style="ragged", L=(0.1, 0.28), dark=0.1, closed=True, mat=_STRAW,
               spacing=(0.045, 0.11)):
    """A ragged fringe of straw ends hanging from a hem polyline (3D points): tufts of their own widths, lengths and
    spacing ('ragged'), or bundles of four to six with gaps between them ('dashed': the stall's painted row of
    hanging thatch ends). `centre` (x, y): the roof's middle, so the tufts lean outward."""
    segs = [(hem[j], hem[(j + 1) % len(hem)]) for j in range(len(hem) if closed else len(hem) - 1)]
    lens = [(q - p).length for p, q in segs]
    per = sum(lens)
    if per < 1e-6:
        return
    sp, j, acc = rng.uniform(0.0, 0.08), 0, 0.0
    group = 0
    while sp < per:
        while j < len(segs) - 1 and acc + lens[j] < sp:
            acc += lens[j]
            j += 1
        p, q = segs[j]
        tv = (q - p) / max(lens[j], 1e-6)
        c0 = p + tv * (sp - acc)
        out = V((c0.x - centre[0], c0.y - centre[1], 0))
        out = out.normalized() if out.length > 1e-6 else V((0, 0, 0))
        w = rng.uniform(0.03, 0.065)
        m = _OLD if rng.random() < dark else mat
        if style == "dashed":
            LL = rng.uniform(*L) * (0.8 if group % 5 == 4 else 1.0)
            _sp_tuft(m, c0 - tv * (w / 2), c0 + tv * (w / 2), out, LL, rng, 0.015)
            group += 1
            sp += rng.uniform(0.035, 0.05) if group % rng.choice((4, 5, 6)) else rng.uniform(0.09, 0.15)
        else:
            _sp_tuft(m, c0 - tv * (w / 2), c0 + tv * (w / 2), out, rng.uniform(*L), rng)
            if rng.random() < 0.45:         # a second, shorter sliver beside it: split ends
                _sp_tuft(m, c0 + tv * (w * 0.2), c0 + tv * (w * 0.9), out, rng.uniform(L[0], (L[0] + L[1]) / 2), rng)
            sp += rng.uniform(*spacing)


def _sp_rrect(xw, xe, hy, rcw, rce, ka, kx, ky):
    """A rounded rectangle from x = -xw to +xe, y = -hy to +hy, its west corners rounded rcw and its east corners
    rce; counter-clockwise from the south-east corner's start, with fixed point counts (rings of different sizes
    loft together)."""
    rcw = max(0.0, min(rcw, hy, (xw + xe) / 2))
    rce = max(0.0, min(rce, hy, (xw + xe) / 2))
    pts = []

    def arc(cx_, cy_, r, a0):
        for q in range(ka):
            a = math.radians(a0 + 90 * q / ka)
            pts.append((cx_ + r * math.cos(a), cy_ + r * math.sin(a)))

    def edge(p0, p1, n):
        for q in range(n):
            f = q / n
            pts.append((p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f))
    arc(xe - rce, -hy + rce, rce, -90)
    edge((xe, -hy + rce), (xe, hy - rce), ky)
    arc(xe - rce, hy - rce, rce, 0)
    edge((xe - rce, hy), (-xw + rcw, hy), kx)
    arc(-xw + rcw, hy - rcw, rcw, 90)
    edge((-xw, hy - rcw), (-xw, -hy + rcw), ky)
    arc(-xw + rcw, -hy + rcw, rcw, 180)
    edge((-xw + rcw, -hy), (xe - rce, -hy), kx)
    return pts


def _sp_in_rr(px, py, xw, xe, hy, rcw, rce):
    if px < -xw or px > xe or abs(py) > hy:
        return False
    rc, cx_ = (rce, xe - rce) if px > 0 else (rcw, -xw + rcw)
    if abs(px - cx_) <= 1e-9:
        return True
    if (px > cx_ if px > 0 else px < cx_) and abs(py) > hy - rc:
        return math.hypot(px - cx_, abs(py) - (hy - rc)) <= rc
    return True


def thatch_loaf(x0, x1, y0, y1, z_eave, z_ridge, rng, ends=("hip", "hip"), hip_k=0.6, round_=0.45, thick=0.3,
                fringe="ragged", fringe_len=(0.12, 0.3), courses=False, knob=None, gablets=(), gablet_c=0.42,
                ridge_ext=None, prof=1.3, mat=_STRAW):
    """A thick, rounded straw roof (the S1 farmhouses' thatch) over the eave rectangle x0..x1, y0..y1 (local), ridge
    along x: a loaf of rounded-rectangle rings from a flat ridge down to the eave, a wobble in plan and height round
    the eave (never ruled), a rolled hem `thick` deep with a straw-mat underside, a ragged fringe of straw bundles
    hanging from the hem ('ragged', or 'dashed': bundles with gaps, the stall's painted row), optionally a second
    course of shorter ends higher up (courses: off by default, it read as floating cards), a ridge roll bound with
    rope (a lumpy knob at one end: knob 'w' or 'e', the gable house's painted knob). The slopes run nearly straight
    (z = ridge - rise * c^prof, prof 1.3: a rounded ridge, a slight belly), the hipped ends steeper than the sides
    (hip_k 0.6: the painted hip-and-gable thatch, not a beehive). ends: (west, east), each 'hip'
    (rounds down) or 'gable' (square). gablets: a subset of ('w', 'e'): a small pale gable vent with a king post near
    the ridge on that hipped end (歇山 in thatch: the S1 farmhouses' painted 'pale triangle with a king post'), under
    two little thatch slopes that run the ridge out over it. ridge_ext: {end: metres} to run the ridge roll out (a
    roof that dies into a neighbour's). Returns {'z_under_at': f(x, y), 'zc': f(c), 'hem': [...], ...}: the
    underside's height over a plan point, for walls and posts under it.
    choice: thick 0.3 m; fringe 0.12-0.3 m (painted: the barn's 13 px band, the stall's dashed row of 11 px ends);
    gablet base at 42% of the ring down from the ridge, 0.75 of the ring's half width (painted vents 27-45 px wide)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    Lx, Ly = (x1 - x0) / 2, (y1 - y0) / 2
    H = z_ridge - z_eave
    Rx = max(0.0, Lx - Ly * hip_k)

    def ext(c, end):
        return (Rx + (Lx - Rx) * c) if end == "hip" else Lx

    def rad(c, end):
        return min(Ly * c, Lx) * (round_ if end == "hip" else 0.1)

    def zc(c):
        return z_ridge - H * c ** prof

    ka = 3
    kx = max(1, round(2 * max(0.0, Lx - Ly * 0.5) / 0.42))
    ky = max(1, round(2 * Ly * max(0.06, 1 - round_ if "hip" in ends else 0.9) / 0.42))
    m = 4 * ka + 2 * kx + 2 * ky
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    wob = [0.04 * (math.sin(6.283 * 3 * j / m + ph[0]) + 0.6 * math.sin(6.283 * 8 * j / m + ph[1])) / 1.6 for j in range(m)]
    zw = [0.035 * (math.sin(6.283 * 4 * j / m + ph[2]) + 0.5 * math.sin(6.283 * 9 * j / m + ph[3])) / 1.5 for j in range(m)]

    def ring(c, d, z, amt=1.0):
        pts = _sp_rrect(max(0.02, ext(c, ends[0]) + d), max(0.02, ext(c, ends[1]) + d), max(0.02, Ly * c + d),
                        max(0.0, rad(c, ends[0]) + d), max(0.0, rad(c, ends[1]) + d), ka, kx, ky)
        out = []
        for j, (px, py) in enumerate(pts):
            r = math.hypot(px, py) or 1.0
            wj = wob[j] * amt * c
            out.append(V((cx + px + px / r * wj, cy + py + py / r * wj, z + zw[j] * amt * c)))
        return out

    cs = [0.07, 0.2, 0.35, 0.5, 0.64, 0.77, 0.89, 1.0]
    rings = [ring(c, 0.0, zc(c)) for c in cs]
    ze = zc(1.0)
    rings.append(ring(1.0, 0.05, ze - thick * 0.5))
    hem = rings[-1]
    rings.append(ring(1.0, -0.02, ze - thick))
    under_cs = [c for c in (0.94, 0.8, 0.62, 0.45, 0.3) if Ly * c - thick * 0.9 > 0.08]
    c_top_u = under_cs[-1] if under_cs else 1.0
    for c in under_cs:
        rings.append(ring(c, -thick * 0.9, zc(c) - thick, 0.5))
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    acc = [0.0] * m
    vlist = []
    for i, r in enumerate(rings):
        if i:
            acc = [acc[j] + (r[j] - rings[i - 1][j]).length for j in range(m)]
        per = [0.0]
        for j in range(m):
            per.append(per[-1] + (r[(j + 1) % m] - r[j]).length)
        vlist.append((list(acc), per))
    verts = [p for r in rings for p in r]
    faces, uvs = [], []
    for i in range(len(rings) - 1):
        (ua, pa), (ub, pb) = vlist[i], vlist[i + 1]
        for j in range(m):
            j2 = (j + 1) % m
            faces.append((i * m + j, (i + 1) * m + j, (i + 1) * m + j2, i * m + j2))
            uvs.append([(ua[j] / tile + ou, pa[j] / tile + ov), (ub[j] / tile + ou, pb[j] / tile + ov),
                        (ub[j2] / tile + ou, pb[j + 1] / tile + ov), (ua[j2] / tile + ou, pa[j + 1] / tile + ov)])
    faces.append(tuple(range(m)))
    uvs.append([(0.2 + ou, vlist[0][1][j] / tile + ov) for j in range(m)])
    n = len(rings)
    faces.append(tuple(reversed(range((n - 1) * m, n * m))))
    uvs.append([(0.5 + ou, vlist[-1][1][j] / tile + ov) for j in reversed(range(m))])
    k.add(mat, False, verts, faces, uvs)
    if fringe:
        _sp_fringe(hem, (cx, cy), rng, fringe, fringe_len)
        if courses:     # a second course of shorter ends a little up the slope: the layered thatch
            c2 = 0.86
            r2 = ring(c2, 0.05, zc(c2) - 0.02)
            _sp_fringe(r2, (cx, cy), rng, "ragged", (fringe_len[0] * 0.35, fringe_len[1] * 0.35), dark=0.04,
                       spacing=(0.09, 0.2))
    # the ridge roll, bound with rope; run out over gablets and any extension
    zr = zc(0.07) + 0.03
    xw0 = ext(0.0, ends[0]) + 0.12
    xe0 = ext(0.0, ends[1]) + 0.12
    gx = {}
    for g in gablets:
        e_ = ends[0] if g == "w" else ends[1]
        if e_ != "hip":
            continue
        gx[g] = ext(gablet_c, "hip")
    if "w" in gx:
        xw0 = max(xw0, gx["w"] + 0.32)
    if "e" in gx:
        xe0 = max(xe0, gx["e"] + 0.32)
    for g, d in (ridge_ext or {}).items():
        if g == "w":
            xw0 += d
        else:
            xe0 += d
    if xw0 + xe0 < 0.5:
        k.rock(mat, cx, cy, zr + 0.02, 0.2, rng, flat=0.55)
        sb.cyl("rope", False, (cx, cy, zr - 0.02), (cx, cy, zr + 0.06), 0.19, segs=8, caps=False)
    else:
        fs = [-1.0, -0.85, -0.4, 0.0, 0.4, 0.85, 1.0]
        pts = [V((cx + (xe0 if f > 0 else xw0) * f, cy + rng.uniform(-0.015, 0.015),
                  zr + (0.02 if abs(f) < 0.9 else -0.02) + rng.uniform(-0.015, 0.015))) for f in fs]
        sb.tube(mat, False, pts, [0.07, 0.13, 0.15, 0.15, 0.15, 0.13, 0.07], segs=8)
        nb = max(2, round((xw0 + xe0) / 0.65))
        for i in range(nb + 1):
            xx = cx - xw0 * 0.8 + (xw0 + xe0) * 0.8 * i / nb
            sb.cyl("rope", False, (xx - 0.025, cy, zr + 0.01), (xx + 0.025, cy, zr + 0.01), 0.16, segs=8, caps=False)
    if knob:
        xk = cx + (xe0 if knob == "e" else -xw0)
        k.rock(mat, xk, cy, zr + 0.06, 0.2, rng, flat=0.8)
        sb.cyl("rope", False, (xk - 0.12, cy, zr), (xk - 0.07, cy, zr), 0.17, segs=8, caps=False)
    # gablets: a pale triangle with a king post standing up out of the hip near the ridge, two little thatch slopes
    # running the ridge out over it, a short ragged edge on them
    for g, xg_ in gx.items():
        s = -1 if g == "w" else 1
        xg = cx + s * xg_
        zg = zc(gablet_c)
        b = Ly * gablet_c * 0.75
        apex = V((xg, cy, z_ridge - 0.11))
        fl, fr = V((xg, cy - s * b, zg - 0.08)), V((xg, cy + s * b, zg - 0.08))   # foot_l on the viewer's left
        kc_thatch_gablet(apex, fl, fr, 1.1, rng, mat=mat)

    def z_under_at(x, y):
        lx, ly = x - cx, y - cy

        def inside(c):
            d = -thick * 0.9
            return _sp_in_rr(lx, ly, max(0.02, ext(c, ends[0]) + d), max(0.02, ext(c, ends[1]) + d),
                             max(0.02, Ly * c + d), max(0.0, rad(c, ends[0]) + d), max(0.0, rad(c, ends[1]) + d))
        if not inside(1.0):
            return zc(1.0) - thick
        lo, hi = 0.0, 1.0
        for _ in range(22):
            mid = (lo + hi) / 2
            lo, hi = (lo, mid) if inside(mid) else (mid, hi)
        return zc(max(hi, c_top_u)) - thick
    return {"z_under_at": z_under_at, "zc": zc, "hem": hem, "thick": thick, "ridge_z": zr}


def _sp_door(p0, p1, a0, a1, h_wall, thick, rng, top, door_h=1.75, wall_mat="plaster"):
    """A plastered wall from p0 to p1 (local plan points, its face to the right) with a framed plank door from a0 to
    a1 metres along it: wall either side, a low wall over the lintel, jambs and lintel, a stone sill, a closed door
    of vertical planks with battens (collides)."""
    A, Bp = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (Bp - A).normalized()
    nrm = V((t.y, -t.x, 0))
    d0, d1 = A + t * a0, A + t * a1
    zd = min(door_h, h_wall - 0.18)
    _ko.earth_wall(A, d0 - t * 0.05, 0.0, h_wall, thick, rng, mat=wall_mat, top=top)
    _ko.earth_wall(d1 + t * 0.05, Bp, 0.0, h_wall, thick, rng, mat=wall_mat, top=top)
    _ko.earth_wall(d0 - t * 0.05, d1 + t * 0.05, zd, h_wall - zd, thick * 0.8, rng, mat=wall_mat, foot=0.0, top=top)
    for p in (d0, d1):
        k.beam("timber", True, p + nrm * 0.02 + UP * -0.03, p + nrm * 0.02 + UP * (zd + 0.1), 0.09, 0.12, 0.015)
    k.beam("timber", False, d0 - t * 0.14 + nrm * 0.03 + UP * (zd + 0.07), d1 + t * 0.14 + nrm * 0.03 + UP * (zd + 0.07),
           0.12, 0.13, 0.02)
    sill = [d0 - t * 0.03 - nrm * 0.1, d1 + t * 0.03 - nrm * 0.1, d1 + t * 0.03 + nrm * 0.14, d0 - t * 0.03 + nrm * 0.14]
    k.soft_slab("stone", False, [(p.x, p.y) for p in sill], -0.04, 0.06, rng, r=0.03, wob=0.005)
    L = (d1 - d0).length
    nb = max(3, round(L / 0.2))
    for i in range(nb):
        a = d0 + t * (L * i / nb + 0.004)
        b = d0 + t * (L * (i + 1) / nb - 0.004)
        k.board("timber", True, a - nrm * 0.03, b - nrm * 0.03, 0.04, 0.06, zd - 0.01 + rng.uniform(-0.01, 0.0))
    for zz in (0.35, zd - 0.35):
        k.beam("timber", False, d0 + t * 0.06 + nrm * 0.0 + UP * zz, d1 - t * 0.06 + nrm * 0.0 + UP * zz, 0.035, 0.09, 0)


def _sp_walls(W, Dp, eave, sides, door, wall_thick, rng, top, door_h=1.75, wall_mat="plaster"):
    """The four walls of a W x Dp plan (local, front at y = 0) where sides[...] == 'wall', each rising to meet the
    roof's underside (top), one with a door; round corner posts where walls meet."""
    corners = {"s": ((0, 0), (W, 0)), "e": ((W, 0), (W, Dp)), "n": ((W, Dp), (0, Dp)), "w": ((0, Dp), (0, 0))}
    for side, (p0, p1) in corners.items():
        if sides.get(side) != "wall":
            continue
        if door and door[0] == side:
            _sp_door(p0, p1, door[1], door[2], eave, wall_thick, rng, top, door_h, wall_mat)
        else:
            _ko.earth_wall(p0, p1, 0.0, eave, wall_thick, rng, mat=wall_mat, top=top)
    for (x, y), adj in (((0, 0), "sw"), ((W, 0), "se"), ((W, Dp), "en"), ((0, Dp), "nw")):
        if any(sides.get(c) == "wall" for c in adj):
            zt = top(x, y)
            sb.cyl("timber", True, (x, y, -0.05), (x, y, zt), 0.085, 0.075, segs=7)


def _sp_open_side(p0, p1, xs, top, rng, post_r=0.07, plate=True, braces=True):
    """An open side from p0 to p1 (local): round posts at the given distances along it, a plate beam over them under
    the roof, knee braces; posts collide."""
    A, Bp = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (Bp - A).normalized()
    L = (Bp - A).length
    pts = [A + t * x for x in xs]
    zs = [top(p.x, p.y) for p in pts]
    for p, zt in zip(pts, zs):
        lean = V((rng.uniform(-0.02, 0.02), rng.uniform(-0.02, 0.02), 0))
        sb.cyl("timber", True, p + UP * -0.06, p + lean + UP * (zt - 0.02), post_r, post_r * 0.85, segs=7)
    if plate:
        za, zb = top(A.x, A.y) - 0.07, top(Bp.x, Bp.y) - 0.07
        zm = min(zs) - 0.05 if zs else min(za, zb)
        k.beam("timber", False, A - t * 0.05 + UP * min(za, zm), Bp + t * 0.05 + UP * min(zb, zm), 0.1, 0.1, 0.015)
        if braces:
            for p, zt in zip(pts, zs):
                for sgn in (1, -1):
                    if (sgn > 0 and (p - A).length > L - 0.3) or (sgn < 0 and (p - A).length < 0.3):
                        continue
                    k.beam("timber", False, p + UP * (min(zt, zm) - 0.45), p + t * (0.35 * sgn) + UP * (min(zt, zm) - 0.07),
                           0.045, 0.045, 0.006)


def thatch_house(origin, yaw_deg, W, Dp, rng, z0=0.0, eave=2.0, ridge=4.6, along="x", ends=("hip", "hip"),
                 gablets=(), over=0.45, round_=0.45, hip_k=0.6, thick=0.32, sides=None, posts=None, door=None,
                 knob=None, fringe="ragged", fringe_len=(0.12, 0.3), wall_thick=0.2, ridge_ext=None, roof=None,
                 lean_tos=(), extra_walls=()):
    """A thatched farmhouse (S1's set piece: 10 of its 14 buildings) in its own frame: origin = its front-left
    (south-west) corner at ground height z0, x along the front (W), y back (Dp); soft plastered wattle walls on a
    rammed foot rising to meet the roof's underside (each side 'wall', 'open' or 'none'), round corner posts, a
    framed plank door (door = (side, a0, a1) metres along that side from its first corner, sides running s: west to
    east, e: south to north, n: east to west, w: north to south), open sides on round posts (posts = {side: [a...]})
    under a plate with knee braces, and a thick rounded straw roof (thatch_loaf) whose ridge runs along x (along='x')
    or back into the picture (along='y': a house seen gable-on). ends: the roof's two ends along its ridge (x: west,
    east; y: south, north), each 'hip' or 'gable'; gablets: a subset of those ends' compass letters. roof: an
    optional list of extra loaves [(x0, x1, y0, y1, ridge, kw)] in house coordinates (a lower wing beside the main
    roof). lean_tos: [(p0, p1, depth, z_low, z_high, side)] in house coordinates: single-slope wings
    (kc_thatch_lean_to as a skirt; the walls rise to meet them); extra_walls: [(p0, p1)] more plastered walls (a
    wing's), their faces to the right. Returns the roof's underside in house coordinates.
    choice: wall top (eave) 2.0 m, the roof's drip edge drooping below it; walls 0.2 m; overhang 0.45 m."""
    sides = sides or {"s": "wall", "e": "wall", "n": "wall", "w": "wall"}
    posts = posts or {}
    roofs = [(-over, W + over, -over, Dp + over, ridge, dict(along=along, ends=ends, gablets=gablets, knob=knob,
                                                              round_=round_, hip_k=hip_k, ridge_ext=ridge_ext))]
    for r in roof or []:
        roofs.append(r)
    unders = []
    with k.placed(_sp_frame(origin, yaw_deg, z0)):
        for rx0, rx1, ry0, ry1, rz, kw in roofs:
            al = kw.get("along", "x")
            Ly_ = ((ry1 - ry0) if al == "x" else (rx1 - rx0)) / 2
            cw = max(0.3, (Ly_ - over) / max(Ly_, 1e-6))
            Hr = max(0.4, (rz - eave - thick) / cw ** 1.3)
            z_e = max(eave - 0.75, rz - Hr)
            g_map = {"w": "w", "e": "e"} if al == "x" else {"s": "w", "n": "e"}
            gl = tuple(g_map[g] for g in kw.get("gablets", ()) if g in g_map)
            kn = kw.get("knob")
            kn = g_map.get(kn) if kn else None
            re_ = {g_map[g]: d for g, d in (kw.get("ridge_ext") or {}).items() if g in g_map}
            lk = dict(ends=kw.get("ends", ("hip", "hip")), hip_k=kw.get("hip_k", hip_k), round_=kw.get("round_", round_),
                      thick=thick, fringe=fringe, fringe_len=fringe_len, knob=kn, gablets=gl, ridge_ext=re_)
            if al == "x":
                info = thatch_loaf(rx0, rx1, ry0, ry1, z_e, rz, rng, **lk)
                unders.append(info["z_under_at"])
            else:
                cxr, cyr = (rx0 + rx1) / 2, (ry0 + ry1) / 2
                hx, hy = (ry1 - ry0) / 2, (rx1 - rx0) / 2
                with k.placed(k.frame(cxr, cyr, 0, 90)):
                    info = thatch_loaf(-hx, hx, -hy, hy, z_e, rz, rng, **lk)
                f = info["z_under_at"]
                unders.append(lambda x, y, f=f, cxr=cxr, cyr=cyr: f(y - cyr, cxr - x))

        for p0, p1, dep, zl, zh, sd in lean_tos:
            kc_thatch_lean_to(p0, p1, dep, zl, zh, rng, posts=0, side=sd)
            A, Bq = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
            tv = (Bq - A).normalized()
            lv = V((-tv.y, tv.x, 0)) * sd
            Ll = (Bq - A).length

            def lt(x, y, A=A, tv=tv, lv=lv, Ll=Ll, dep=dep, zl=zl, zh=zh):
                q = V((x, y, 0)) - A
                a_, d_ = q.dot(tv), q.dot(lv)
                if -0.3 <= a_ <= Ll + 0.3 and -0.3 <= d_ <= dep:
                    return zl + (zh - zl) * max(0.0, d_) / max(dep, 1e-6) - 0.22
                return -1e9
            unders.append(lt)

        def under(x, y):
            return max(u(x, y) for u in unders) - 0.03
        _sp_walls(W, Dp, eave, sides, door, wall_thick, rng, under)
        for p0, p1 in extra_walls:
            _ko.earth_wall(p0, p1, 0.0, eave, wall_thick, rng, mat="plaster", top=under)
            for x, y in (p0, p1):
                sb.cyl("timber", True, (x, y, -0.05), (x, y, under(x, y)), 0.08, 0.07, segs=7)
        ends_pts = {"s": ((0, 0), (W, 0)), "e": ((W, 0), (W, Dp)), "n": ((W, Dp), (0, Dp)), "w": ((0, Dp), (0, 0))}
        for side, xs in posts.items():
            _sp_open_side(ends_pts[side][0], ends_pts[side][1], xs, under, rng)
    return under


def lean_to_room(origin, yaw_deg, W, Dp, rng, z0=0.0, z_low=2.15, z_high=3.0, sides=None, posts=None, wall_thick=0.2,
                 thick=0.22):
    """A low wing under a single-slope thatch (S1.bld.stall_annex_29350, the stall's lower west roof over its seated
    customers): kc_thatch_lean_to from the front eave (z_low over the ground) rising back to z_high, plastered walls
    on the sides marked 'wall' rising to meet its underside, round posts on the open sides (posts = {side: [a...]}),
    in its own frame (origin = the front-left corner at z0, x along the front, y back)."""
    sides = sides or {"s": "open", "e": "none", "n": "wall", "w": "wall"}
    posts = posts or {}
    with k.placed(_sp_frame(origin, yaw_deg, z0)):
        kc_thatch_lean_to((0.0, 0.0), (W, 0.0), Dp, z_low, z_high, rng, posts=0, side=1, thick=thick)

        def under(x, y):
            return z_low + (z_high - z_low) * max(0.0, min(1.0, y / Dp)) - thick - 0.03
        _sp_walls(W, Dp, z_low, sides, None, wall_thick, rng, under)
        ends_pts = {"s": ((0, 0), (W, 0)), "e": ((W, 0), (W, Dp)), "n": ((W, Dp), (0, Dp)), "w": ((0, Dp), (0, 0))}
        for side, xs in posts.items():
            _sp_open_side(ends_pts[side][0], ends_pts[side][1], xs, under, rng)
    return under


def slat_screen(p0, p1, z0, z1, rng, slat=0.045, gap=0.045, mat="timber"):
    """A screen of thin vertical slats between a top and a bottom rail (the stall's painted lattice fascia under the
    eave, and the slats from the eave down to the counter): plan p0 -> p1, z0 to z1 (3D or plan points). Each slat its
    own width and a hair off true."""
    A, Bp = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (Bp - A)
    L = t.length
    t.normalize()
    for zz in (z0 + 0.02, z1 - 0.02):
        k.beam(mat, False, A + UP * zz, Bp + UP * zz, 0.04, 0.045, 0.008)
    s = rng.uniform(0.02, gap)
    while s < L - 0.02:
        w = slat * rng.uniform(0.8, 1.2)
        p = A + t * (s + w / 2)
        k.beam(mat, False, p + UP * (z0 + 0.03) + V((rng.uniform(-0.006, 0.006), 0, 0)), p + UP * (z1 - 0.03), w, 0.018, 0)
        s += w + gap * rng.uniform(0.8, 1.2)


def _sp_lean_to_body(origin, yaw_deg, W, Dp, rng, z0=0.0, z_low=2.25, z_high=2.75, over=0.35, thick=0.2, posts=None,
                     z_of=None, fringe=True, fringe_len=(0.1, 0.26), mat=_STRAW):
    """A single-slope roof of brush or thatch on bare round posts, no walls (S1.bld.shed_posts_31370; the painted
    'low roof of brush or thatch carried on bare posts'): a soft slab with a rolled front edge, sagging a little
    between the posts, wobbling along its edges, its low eave at the front (y = 0, z_low over the ground) and its high
    side at the back; ragged straw ends along the front and both ends; plates over the post rows, knee braces.
    posts: [(x, y)] local (default: the four corners and one between at the front). z_of(x, y): the ground under a
    local point (a post on the raised yard). choice: slab 0.2 m; overhang 0.35 m; posts 0.14 m round poles."""
    z_of = z_of or (lambda x, y: 0.0)
    posts = posts if posts is not None else [(0.1, 0.1), (W / 2, 0.1), (W - 0.1, 0.1), (0.1, Dp - 0.1), (W - 0.1, Dp - 0.1)]
    with k.placed(_sp_frame(origin, yaw_deg, z0)):
        ya, yb = -over, Dp + over

        def zt(x, y):
            f = (y - ya) / (yb - ya)
            sag = 0.05 * math.sin(math.pi * min(1, max(0, (x + over) / (W + 2 * over)))) * math.sin(math.pi * f)
            return z_low + (z_high - z_low) * f - sag
        n = max(4, round((W + 2 * over) / 0.35))
        rings, ins = [], []
        wob = _ko._wave(rng, 0.03)
        for i in range(n + 1):
            x = -over + (W + 2 * over) * i / n + (rng.uniform(-0.03, 0.03) if 0 < i < n else 0)
            yf = ya - wob(x) - 0.03
            yk = yb + wob(x + 7.0)
            prof = [(yf + 0.05, zt(x, ya) - thick * 0.75), (yf, zt(x, ya) - thick * 0.25), (yf + 0.06, zt(x, ya) + 0.03),
                    (Dp * 0.5, zt(x, Dp * 0.5) + 0.02 + rng.uniform(-0.015, 0.015)), (yk, zt(x, yb) + 0.02),
                    (yk + 0.02, zt(x, yb) - thick), (Dp * 0.5, zt(x, Dp * 0.5) - thick)]
            rings.append([V((x, y, z)) for y, z in prof])
            ins.append(V((x, Dp * 0.5, zt(x, Dp * 0.5) - thick * 0.5)))
        m = len(rings[0])
        verts = [p for r in rings for p in r]
        faces, fin = [], []
        for i in range(n):
            for j in range(m):
                j2 = (j + 1) % m
                faces.append((i * m + j, (i + 1) * m + j, (i + 1) * m + j2, i * m + j2))
                fin.append(ins[i])
        for i, sgn in ((0, -1), (n, 1)):
            faces.append(tuple(range(i * m, i * m + m)))
            fin.append(ins[i] - V((sgn * 0.3, 0, 0)))
        k.add(mat, False, verts, _kv._orient(verts, faces, fin))
        if fringe:
            front = [r[1] - UP * 0.02 for r in rings]
            _sp_fringe(front, (W / 2, Dp), rng, "ragged", fringe_len, closed=False, mat=mat)
            for r in (rings[0], rings[-1]):
                side = [r[1].lerp(r[4], f) - UP * (thick * 0.6) for f in (0.0, 0.33, 0.66, 1.0)]
                _sp_fringe(side, (W / 2, Dp / 2), rng, "ragged", (fringe_len[0] * 0.6, fringe_len[1] * 0.6), closed=False,
                           mat=mat)
        rows = {}
        for x, y in posts:
            zg = z_of(x, y)
            top_ = zt(x, y) - thick - 0.02
            sb.cyl("timber", True, (x, y, zg - 0.08), (x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), top_),
                   0.07, 0.06, segs=7)
            rows.setdefault(round(y, 1), []).append((x, top_))
        for y, pr in rows.items():
            if len(pr) < 2:
                continue
            pr.sort()
            for (xa, za), (xb, zb) in zip(pr, pr[1:]):
                k.beam("timber", False, (xa - 0.12, y, za - 0.05), (xb + 0.12, y, zb - 0.05), 0.09, 0.09, 0.012)
            for x, z_ in pr:
                for sgn in (1, -1):
                    if (sgn > 0 and x >= max(p[0] for p in pr) - 0.05) or (sgn < 0 and x <= min(p[0] for p in pr) + 0.05):
                        continue
                    k.beam("timber", False, (x, y, z_ - 0.5), (x + sgn * 0.35, y, z_ - 0.1), 0.04, 0.04, 0.006)


def tile_roof(x0, x1, y0, y1, z_eave, z_ridge, rng, ends=("hip", "hip"), tg=0.45, curve=1.45, lift=0.1, thick=0.17,
              ns_per_m=2.6, nt=5, mat="roof", trim="timber", ridge_ext=(0.0, 0.0)):
    """A farmhouse's tiled roof over the eave rectangle x0..x1, y0..y1 (local), ridge along x: two long slopes,
    slightly concave (t^curve), the corners swept up a little (`lift`), a timber underside and fascia (plain, no
    painted rafters: a farmhouse, not a hall in town), a raised ridge of ridge tiles with small upturned ends, hip
    ridges. ends: (west, east), each 'hip' (a hipped end up to the ridge), 'hipgable' (歇山: the hip up to `tg` of
    the rise, then a pale gable with a king post up to the ridge: the hall's and the long farmhouse's painted west
    ends) or 'gable' (the long slopes run to the end, barge boards). ridge_ext: (west, east) metres the long slopes
    and ridge run on past a gable end (a roof that dies into a neighbour's). Returns height(x, y) of the tiled top.
    choice: tiles at 1.4 m a swatch; thick 0.17 m; lift 0.1 m."""
    yc, d = (y0 + y1) / 2, (y1 - y0) / 2
    H = z_ridge - z_eave
    ns = max(4, round((x1 - x0) * ns_per_m))

    def height(s, t):
        return z_eave + H * (t ** curve) + lift * (abs(2 * s - 1) ** 3) * (1 - t) ** 2

    def xl(t):
        e = ends[0]
        if e == "hip":
            return x0 + d * t
        if e == "hipgable":
            return x0 + d * min(t, tg)
        return x0 - ridge_ext[0] * t

    def xr(t):
        e = ends[1]
        if e == "hip":
            return x1 - d * t
        if e == "hipgable":
            return x1 - d * min(t, tg)
        return x1 + ridge_ext[1] * t
    tile = sb.MATERIALS[mat][1]
    up = UP

    def surface(rows, uvs_of, flip):
        verts, faces, uvs, vu = [], [], [], []
        idx = {}
        for j, row in enumerate(rows):
            for i, p in enumerate(row):
                idx[(j, i)] = len(verts)
                verts.append(p)
                vu.append(p - up * thick)
        for j in range(len(rows) - 1):
            a, b = rows[j], rows[j + 1]
            for i in range(len(a) - 1):
                if len(b) == 1:
                    f = (idx[(j, i)], idx[(j, i + 1)], idx[(j + 1, 0)])
                else:
                    f = (idx[(j, i)], idx[(j, i + 1)], idx[(j + 1, i + 1)], idx[(j + 1, i)])
                f = tuple(reversed(f)) if flip else f
                faces.append(f)
                uvs.append([uvs_of[q] for q in f])
        k.add(mat, False, verts, faces, uvs)
        k.add(trim, False, vu, [tuple(reversed(f)) for f in faces])
        return verts

    # the two long slopes: front (y0 -> yc) and back (y1 -> yc)
    eaves = []
    for side, ye in ((0, y0), (1, y1)):
        rows, uv_of = [], {}
        n_id = 0
        for j in range(nt + 1):
            t = j / nt
            y = ye + (yc - ye) * t
            a_, b_ = xl(t), xr(t)
            row = []
            for i in range(ns + 1):
                s = i / ns
                x = a_ + (b_ - a_) * s
                row.append(V((x, y, height(s, t))))
                uv_of[n_id] = (x / tile, (d * t * 1.15) / tile)
                n_id += 1
            rows.append(row)
        surface(rows, uv_of, flip=(side == 1))
        eaves.append(rows)
    # the hipped ends
    hips = []
    for side, xe_ in ((0, x0), (1, x1)):
        e = ends[side]
        if e == "gable":
            hips.append(None)
            continue
        tmax = 1.0 if e == "hip" else tg
        rows, uv_of = [], {}
        n_id = 0
        nh = max(3, round(2 * d * ns_per_m))
        steps = max(2, round(nt * tmax))
        for j in range(steps + 1):
            t = tmax * j / steps
            x = (xe_ + d * t) if side == 0 else (xe_ - d * t)
            half = d * (1 - t)
            row = []
            cnt = nh + 1 if half > 1e-6 else 1
            for i in range(cnt):
                s = i / nh if cnt > 1 else 0.5
                y = yc - half + 2 * half * s
                row.append(V((x, y, height(s, t))))
                uv_of[n_id] = (y / tile, (d * t * 1.15) / tile)
                n_id += 1
            rows.append(row)
        surface(rows, uv_of, flip=(side == 1))
        hips.append(rows)
    # fascia along every eave, ridge, hip ridges, gables
    for rows in eaves + [h for h in hips if h]:
        eave = rows[0]
        for a, b in zip(eave, eave[1:]):
            sb.quad(trim, False, a, b, b - up * thick, a - up * thick)
    xa, xb = xl(1.0), xr(1.0)
    zr = z_ridge
    k.beam("ridge", False, (xa - 0.06, yc, zr + 0.06), (xb + 0.06, yc, zr + 0.06), 0.2, 0.18, 0.03)
    for x, sgn in ((xa, -1), (xb, 1)):
        k.beam("ridge", False, (x - sgn * 0.12, yc, zr + 0.12), (x + sgn * 0.1, yc, zr + 0.26), 0.16, 0.12, 0.025)
    for side, rows in enumerate(hips):
        if not rows:
            continue
        for col in (0, -1):
            line = [r[col] if len(r) > 1 else r[0] for r in rows]
            for a, b in zip(line, line[1:]):
                k.beam("ridge", False, a + up * 0.05, b + up * 0.05, 0.13, 0.11, 0.02)
        if ends[side] == "hipgable":
            xg = xl(tg) if side == 0 else xr(tg)
            sgn = -1 if side == 0 else 1
            zb_ = height(0.5, tg) - thick
            half = d * (1 - tg)
            tri = [V((xg, yc - half, zb_)), V((xg, yc + half, zb_)), V((xg, yc, zr - thick))]
            if sgn < 0:
                tri = [tri[1], tri[0], tri[2]]
            k.add("plaster", False, tri, [(0, 1, 2)])
            k.beam(trim, False, (xg + sgn * 0.03, yc, zb_), (xg + sgn * 0.03, yc, zr - thick - 0.02), 0.08, 0.08, 0.01)
            k.beam(trim, False, (xg + sgn * 0.04, yc - half, zb_ + 0.04), (xg + sgn * 0.04, yc + half, zb_ + 0.04), 0.09, 0.1, 0.012)
            for yy in (yc - half, yc + half):        # barge boards under the long slopes' edges
                k.beam(trim, False, (xg + sgn * 0.05, yy, zb_ + 0.06), (xg + sgn * 0.05, yc, zr - 0.04), 0.05, 0.2, 0.012)
    for side in (0, 1):
        if ends[side] != "gable":
            continue
        xg = xl(0.0) if side == 0 else xr(0.0)
        for ye in (y0, y1):
            k.beam(trim, False, (xg, ye, height(0.0, 0.0) - 0.05), (xg, yc, zr - 0.04), 0.05, 0.22, 0.012)

    def top(x, y):
        t = min(1.0, max(0.0, 1 - abs(y - yc) / d))
        return z_eave + H * (t ** curve)
    return top


def _sp_board_wall(p0, p1, z0, h, rng, thick=0.045, battens=(0.3, None), mat="timber", collide=True, top=None,
                   ragged=True):
    """A wall of vertical boards (the farmhouse wing's painted board wall) from plan p0 to p1, its face to the right:
    planks of their own widths (0.15-0.26 m) with hairline gaps, each its own height and a ragged foot, leaning a
    hair; two battens across the outside; a hidden collider board behind them. top(x, y): an optional height to
    rise to (under a roof). choice: battens at 0.3 m and 0.35 m below the top."""
    A, Bp = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (Bp - A)
    L = t.length
    t.normalize()
    nrm = V((t.y, -t.x, 0))
    s = 0.0
    while s < L - 0.04:
        w = min(L - s, rng.uniform(0.15, 0.26))
        if L - s - w < 0.08:
            w = L - s
        a, b = A + t * (s + 0.004), A + t * (s + w - 0.004)
        m_ = (a + b) / 2
        zt = (top(m_.x, m_.y) if top else z0 + h) + rng.uniform(-0.03, 0.01)
        zb = z0 + (rng.uniform(-0.06, 0.05) if ragged else -0.02)
        k.board(mat, False, a, b, thick * rng.uniform(0.85, 1.1), zb, zt)
        s += w
    ztop = (top((A.x + Bp.x) / 2, (A.y + Bp.y) / 2) if top else z0 + h)
    for zz in battens:
        z_ = (ztop - 0.35) if zz is None else z0 + zz
        k.beam(mat, False, A + t * 0.04 + nrm * (thick * 0.5 + 0.02) + UP * z_, Bp - t * 0.04 + nrm * (thick * 0.5 + 0.02) + UP * z_,
               0.035, 0.09, 0.008)
    if collide:
        _ko._hexa("hidden", True, [A - nrm * 0.1 + UP * z0, Bp - nrm * 0.1 + UP * z0, Bp - nrm * 0.04 + UP * z0, A - nrm * 0.04 + UP * z0],
                  [A - nrm * 0.1 + UP * (ztop - 0.1), Bp - nrm * 0.1 + UP * (ztop - 0.1), Bp - nrm * 0.04 + UP * (ztop - 0.1),
                   A - nrm * 0.04 + UP * (ztop - 0.1)])


def tile_house(origin, yaw_deg, W, Dp, rng, z0=0.0, eave=2.4, ridge=4.0, ends=("hip", "hip"), tg=0.45, over=0.5,
               sides=None, posts=None, door=None, walls="plaster", wall_thick=0.2, ridge_ext=(0.0, 0.0), lift=0.1,
               veranda=None):
    """A tiled farmhouse in its own frame (origin = front-left corner at ground z0, x along the front W, y back Dp):
    walls of plastered wattle ('plaster') or vertical boards ('boards') to the eave, round corner posts, open sides
    on posts under a plate (posts = {side: [a...]}), a framed plank door, and a tile_roof over it (ridge along x,
    `ends` west/east). veranda = dict(x1=, depth=, floor=, posts=[a...], rail=(a0, a1), bracket=(a0, a1)): an open
    veranda at the front's west end, from x 0 to x1 and `depth` deep, the wall set back behind it with a door, a
    plank floor `floor` high on a low earth plinth, posts on the front line, a railing of short balusters between
    rail[0] and rail[1], an arched bracket between bracket[0] and bracket[1] (the hall's painted veranda).
    choice: walls 0.2 m to the eave 2.4 m; overhang 0.5 m."""
    sides = sides or {"s": "wall", "e": "wall", "n": "wall", "w": "wall"}
    posts = posts or {}
    with k.placed(_sp_frame(origin, yaw_deg, z0)):
        d_full = (Dp + 2 * over) / 2
        t_w = over / d_full
        H_guess = ridge - eave
        z_e = eave + 0.12 - H_guess * (t_w ** 1.45) / (1 - t_w ** 1.45 if t_w < 1 else 1)
        z_e = min(eave, max(eave - 0.45, z_e))
        top = tile_roof(-over, W + over, -over, Dp + over, z_e, ridge, rng, ends=ends, tg=tg, ridge_ext=ridge_ext,
                        lift=lift)

        def under(x, y):
            return top(x, y) - 0.2
        vx1 = veranda["x1"] if veranda else 0.0
        vd = veranda["depth"] if veranda else 0.0
        flat = lambda x, y: eave   # noqa: E731
        corners = {"s": ((vx1, 0), (W, 0)), "e": ((W, 0), (W, Dp)), "n": ((W, Dp), (0, Dp)),
                   "w": ((0, Dp), (0, vd))}
        for side, (p0, p1) in corners.items():
            if sides.get(side) != "wall":
                continue
            if walls == "boards":
                kc_board_wall(p0, p1, 0.0, min(eave, under((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)), rng)
            elif door and door[0] == side:
                _sp_door(p0, p1, door[1], door[2], eave, wall_thick, rng, flat)
            else:
                _ko.earth_wall(p0, p1, 0.0, eave, wall_thick, rng, mat="plaster")
        for (x, y) in ((vx1 if sides.get("s") == "wall" else 0, 0), (W, 0), (W, Dp), (0, Dp)):
            sb.cyl("timber", True, (x, y, -0.05), (x, y, min(eave, under(x, y)) + 0.02), 0.08, 0.07, segs=7)
        ends_pts = {"s": ((0, 0), (W, 0)), "e": ((W, 0), (W, Dp)), "n": ((W, Dp), (0, Dp)), "w": ((0, Dp), (0, 0))}
        for side, xs in posts.items():
            _sp_open_side(ends_pts[side][0], ends_pts[side][1], xs, lambda x, y: min(eave, under(x, y)), rng)
        if veranda:
            fl = veranda.get("floor", 0.35)
            # the plinth and plank floor under the veranda
            k.soft_box("rammed", True, (-0.08, -0.08, -0.1), (vx1 + 0.04, vd + 0.1, fl - 0.06), rng, r=0.06, wob=0.01)
            k.plank_deck(-0.04, vx1, -0.04, vd + 0.05, fl, rng, w=(0.2, 0.28), thick=0.05, collide=True)
            # the set-back wall behind it with its door, and its west return
            _sp_door((0, vd), (vx1, vd), vx1 * 0.35, vx1 * 0.35 + 0.85, eave, wall_thick, rng, flat, door_h=1.85)
            _ko.earth_wall((vx1, vd), (vx1, 0), 0.0, eave, wall_thick, rng, mat="plaster")
            ps = veranda.get("posts", [0.08, vx1 * 0.5, vx1])
            for a in ps:
                sb.cyl("timber", True, (a, 0.0, fl - 0.05), (a, 0.0, eave), 0.075, 0.065, segs=7)
                k.soft_box("stone", False, (a - 0.13, -0.13, fl - 0.12), (a + 0.13, 0.13, fl + 0.02), rng, r=0.03, wob=0.005)
            k.beam(trim_ := "timber", False, (-0.15, 0.0, eave - 0.06), (vx1 + 0.1, 0.0, eave - 0.06), 0.12, 0.14, 0.02)
            k.beam(trim_, False, (0.0, -0.05, eave - 0.06), (0.0, vd + 0.05, eave - 0.06), 0.11, 0.13, 0.02)
            ra, rb = veranda.get("rail", (ps[0], ps[1]))
            zr0, zr1 = fl + 0.05, fl + 0.55
            k.beam("timber", True, (ra, 0.0, zr1), (rb, 0.0, zr1), 0.06, 0.06, 0.01)
            k.beam("timber", False, (ra, 0.0, zr0 + 0.05), (rb, 0.0, zr0 + 0.05), 0.05, 0.05, 0.008)
            nbal = max(3, round((rb - ra) / 0.12))
            for i in range(1, nbal):
                xx = ra + (rb - ra) * i / nbal
                k.beam("timber", False, (xx, 0.0, zr0 + 0.07), (xx, 0.0, zr1 - 0.03), 0.03, 0.03, 0)
            # the open west end of the veranda: a rail too (nobody steps off the floor's end)
            k.beam("timber", True, (0.0, 0.0, zr1), (0.0, vd, zr1), 0.06, 0.06, 0.01)
            for i in range(1, max(2, round(vd / 0.12))):
                yy = vd * i / max(2, round(vd / 0.12))
                k.beam("timber", False, (0.0, yy, zr0 + 0.07), (0.0, yy, zr1 - 0.03), 0.03, 0.03, 0)
            ba, bb = veranda.get("bracket", (ps[1], ps[2]))
            arc = [V((ba + (bb - ba) * f, 0.0, eave - 0.12 - 0.28 * (1 - (2 * f - 1) ** 2) ** 0.5 * 0.0 - 0.3 * (1 - abs(2 * f - 1)) ** 1.6))
                   for f in (0.0, 0.15, 0.32, 0.5, 0.68, 0.85, 1.0)]
            sb.tube("timber", False, arc, [0.035] * len(arc), segs=4)
    return under


def wattle_fence(pts, h, rng, binds=(0.16, 0.66), spacing=(0.08, 0.15), post_every=1.1, collide=True, h_coll=1.7,
                 mat=_BRUSH, stake_mat="timber"):
    """A tall woven wattle fence along a polyline (the hut's painted fences): upright stakes of brushwood, each
    leaning, standing and spiking differently (thin square spikes, every few a stouter post), a thinner infill of
    twigs between them, some slanting, all bound by two horizontal withies (twisted pairs) at `binds` of the
    height. h: a height, or (h_start, h_end) along the line (the painted fence rises to its east end). A hidden board
    stops the walker. Never ruled: nothing repeats. choice: 1.8-2.2 m; stakes 2.5-4.5 cm."""
    P = [V((p[0], p[1], p[2] if len(p) > 2 else 0.0)) for p in pts]
    segl = [(P[i + 1] - P[i]).to_2d().length for i in range(len(P) - 1)]
    total = sum(segl)
    h0, h1 = (h, h) if not isinstance(h, (tuple, list)) else h

    def at(s):
        s = min(max(s, 0.0), total)
        acc = 0.0
        for i, L in enumerate(segl):
            if acc + L >= s or i == len(segl) - 1:
                f = (s - acc) / max(L, 1e-6)
                p = P[i].lerp(P[i + 1], f)
                t = (P[i + 1] - P[i])
                t.z = 0
                t.normalize()
                return p, t, V((t.y, -t.x, 0))
            acc += L

    def hh(s):
        return h0 + (h1 - h0) * s / max(total, 1e-6)
    s = rng.uniform(0.0, 0.05)
    nxt_post = rng.uniform(0.3, post_every)
    while s < total:
        p, t, nrm = at(s)
        hs = hh(s)
        post_ = s >= nxt_post
        if post_:
            nxt_post = s + rng.uniform(post_every * 0.7, post_every * 1.3)
        w = rng.uniform(0.05, 0.07) if post_ else rng.uniform(0.025, 0.045)
        top_h = hs * (rng.uniform(0.9, 1.0) if post_ else rng.uniform(0.82, 1.1))
        lean = t * rng.uniform(-0.07, 0.07) + nrm * rng.uniform(-0.05, 0.05)
        _ko._spike(stake_mat if post_ else mat, p - UP * 0.1, p + lean * (top_h / 2) + UP * (top_h - 0.1),
                   w, rng.uniform(0.07, 0.18))
        if rng.random() < 0.55:          # an infill twig beside it, thinner, often slanting
            s2 = s + rng.uniform(0.02, 0.06)
            q, _, _ = at(s2)
            th = hs * rng.uniform(0.55, 1.05)
            sl = t * rng.uniform(-0.25, 0.25) + nrm * rng.uniform(-0.04, 0.04)
            _ko._spike(mat, q - UP * 0.05 + nrm * rng.uniform(-0.03, 0.03), q + sl * th + UP * (th - 0.08),
                       rng.uniform(0.015, 0.025), rng.uniform(0.05, 0.12))
        s += rng.uniform(*spacing)
    # two withies, each a twisted pair wobbling along both faces
    for fb in binds:
        for side in (1, -1):
            for strand in (0, 1):
                n_ = max(3, round(total / 0.45))
                pts_ = []
                for i in range(n_ + 1):
                    sp_ = total * i / n_
                    p, t, nrm = at(sp_)
                    z = hh(sp_) * fb + 0.035 * math.sin(i * 2.1 + strand * 3.1) + rng.uniform(-0.015, 0.015)
                    pts_.append(p + nrm * side * (0.035 + 0.01 * strand) + UP * z)
                sb.tube(mat, False, pts_, [0.016] * len(pts_), segs=3)
    if collide:
        for i in range(len(P) - 1):
            a, b = P[i], P[i + 1]
            t = (b - a)
            t.z = 0
            t.normalize()
            nrm = V((t.y, -t.x, 0))
            bot = [a + nrm * 0.04, b + nrm * 0.04, b - nrm * 0.04, a - nrm * 0.04]
            if (bot[1] - bot[0]).cross(bot[2] - bot[1]).z < 0:
                bot.reverse()
            _ko._hexa("hidden", True, [q - UP * 0.1 for q in bot], [q + UP * h_coll for q in bot])


def gate_post(foot, rng, h=1.05, hurdle=None):
    """The thin post standing in the hut's gateway and the loose hurdle lying beside it (S1.str.wattle_fence_31100's
    gate_post_foot / gate_post_top and its 'few loose fence strokes lying on the ground'): a round post with a cut top,
    and a small wattle panel (two rails, woven stakes) lying flat. hurdle: ((x, y, z), yaw_deg) or None.
    choice: post 1.05 m (painted 50 px); hurdle 0.9 x 0.55 m."""
    x, y, z = foot
    sb.cyl("timber", True, (x, y, z - 0.08), (x + 0.02, y - 0.01, z + h), 0.055, 0.045, segs=6)
    _ko._lathe3("timber", False, (x + 0.02, y - 0.01, z + h), V((1, 0, 0)), V((0, 1, 0)), UP,
                [(0.045, 0.045, 0.0), (0.03, 0.03, 0.03), (0.0, 0.0, 0.04)], segs=6, cap0=False)
    if hurdle:
        (hx, hy, hz), yaw = hurdle
        with k.placed(k.frame(hx, hy, hz, yaw)):
            for yy in (-0.22, 0.22):
                sb.cyl("timber", False, (-0.48, yy, 0.035), (0.48, yy + rng.uniform(-0.04, 0.04), 0.04), 0.025, segs=5)
            xx = -0.42
            while xx < 0.44:
                sb.cyl(_BRUSH, False, (xx + rng.uniform(-0.02, 0.02), -0.32, 0.02), (xx + rng.uniform(-0.05, 0.05), 0.33, 0.03),
                       rng.uniform(0.012, 0.02), segs=3, caps=False)
                xx += rng.uniform(0.07, 0.11)


def _sp_twig(mat, a, b, r):
    """A thin twig: a three-sided prism with no caps (6 triangles)."""
    a, b = V(a), V(b)
    X, Y, Z = _ko._frame_of(b - a)
    ring = [X * math.cos(2 * math.pi * i / 3) * r + Y * math.sin(2 * math.pi * i / 3) * r for i in range(3)]
    verts = [a + o for o in ring] + [b + o * 0.6 for o in ring]
    k.add(mat, False, verts, [(i, (i + 1) % 3, 3 + (i + 1) % 3, 3 + i) for i in range(3)])


def brush_fence(pts, heights, rng, collide=True, h_coll=1.3, mat=_BRUSH):
    """A fence of dense crossed brushwood (the farmsteads' painted bands of crossed hatching): stout stakes every
    0.6-0.9 m, each leaning its own way; between them brushwood laid slanting in both directions, crossing (each twig
    its own angle, length and height); two binding withies; the top ragged with twig ends. heights: [(s, h)] along
    the line's length (the painted top line), or one height. A hidden board stops the walker.
    choice: 1.25-1.4 m (painted 60-110 px)."""
    P = [V((p[0], p[1], p[2] if len(p) > 2 else 0.0)) for p in pts]
    segl = [(P[i + 1] - P[i]).to_2d().length for i in range(len(P) - 1)]
    total = sum(segl)
    prof = heights if isinstance(heights, (list, tuple)) else [(0.0, heights), (1.0, heights)]

    def hh(s):
        f = s / max(total, 1e-6)
        for (fa, ha), (fb, hb) in zip(prof, prof[1:]):
            if fa <= f <= fb:
                return ha + (hb - ha) * (f - fa) / max(fb - fa, 1e-6)
        return prof[-1][1] if f > prof[-1][0] else prof[0][1]

    def at(s):
        s = min(max(s, 0.0), total)
        acc = 0.0
        for i, L in enumerate(segl):
            if acc + L >= s or i == len(segl) - 1:
                f = (s - acc) / max(L, 1e-6)
                p = P[i].lerp(P[i + 1], f)
                t = (P[i + 1] - P[i])
                t.z = 0
                t.normalize()
                return p, t, V((t.y, -t.x, 0))
            acc += L
    s = rng.uniform(0.05, 0.3)
    while s < total:
        p, t, nrm = at(s)
        hs = hh(s)
        lean = t * rng.uniform(-0.06, 0.06) + nrm * rng.uniform(-0.05, 0.05)
        _ko._spike("timber", p - UP * 0.1, p + lean * hs + UP * (hs * rng.uniform(0.92, 1.05) - 0.06),
                   rng.uniform(0.045, 0.065), rng.uniform(0.04, 0.1))
        s += rng.uniform(0.6, 0.9)
    for dirn in (1, -1, 0):
        s = rng.uniform(-0.3, 0.0)
        while s < total + 0.2:
            ang = math.radians(rng.uniform(25, 72) if dirn else rng.uniform(78, 95))
            hs = hh(min(max(s, 0), total))
            length = hs / math.sin(ang) * rng.uniform(0.55, 1.15)
            dx = math.cos(ang) * length * (dirn or rng.choice((1, -1)))
            s0 = s
            s1 = s + dx
            a, _, nrm0 = at(s0)
            b, _, _ = at(s1)
            off = nrm0 * rng.uniform(-0.05, 0.05)
            za = rng.uniform(-0.05, 0.08)
            zb = min(hh(min(max(s1, 0), total)) * rng.uniform(0.82, 1.18), za + length * math.sin(ang))
            if 0 <= s0 <= total or 0 <= s1 <= total:
                _sp_twig(mat, a + off + UP * za, b + off * 1.3 + UP * zb, rng.uniform(0.01, 0.022))
            s += rng.uniform(0.05, 0.11) if dirn else rng.uniform(0.12, 0.3)
    for fb in (0.3, 0.72):
        for side in (1, -1):
            n_ = max(3, round(total / 0.5))
            pts_ = []
            for i in range(n_ + 1):
                sp_ = total * i / n_
                p, t, nrm = at(sp_)
                pts_.append(p + nrm * side * 0.06 + UP * (hh(sp_) * fb + rng.uniform(-0.03, 0.03)))
            sb.tube(mat, False, pts_, [0.018] * len(pts_), segs=3)
    if collide:
        for i in range(len(P) - 1):
            a, b = P[i], P[i + 1]
            t = (b - a)
            t.z = 0
            t.normalize()
            nrm = V((t.y, -t.x, 0))
            bot = [a + nrm * 0.06, b + nrm * 0.06, b - nrm * 0.06, a - nrm * 0.06]
            if (bot[1] - bot[0]).cross(bot[2] - bot[1]).z < 0:
                bot.reverse()
            _ko._hexa("hidden", True, [q - UP * 0.1 for q in bot], [q + UP * h_coll for q in bot])


def _sp_blob(mat, c, rx, ry, rz, rng, sub=1, lump=0.18, sink=0.35):
    """A soft lumpy foliage mass: an icosphere (subdivided `sub` times) pushed in and out by low-frequency noise, its
    bottom flattened and tucked under (a bush's rounded clump)."""
    t = (1 + 5 ** 0.5) / 2
    vs = [V(p).normalized() for p in ((-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t),
                                     (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1))]
    fs = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6),
          (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7),
          (9, 8, 1)]
    for _ in range(sub):
        cache, nf = {}, []

        def mid(i, j):
            key = (min(i, j), max(i, j))
            if key not in cache:
                cache[key] = len(vs)
                vs.append((vs[i] + vs[j]).normalized())
            return cache[key]
        for a, b, c_ in fs:
            ab, bc, ca = mid(a, b), mid(b, c_), mid(c_, a)
            nf += [(a, ab, ca), (b, bc, ab), (c_, ca, bc), (ab, bc, ca)]
        fs = nf
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    C = V(c)
    verts = []
    for d in vs:
        n = 1 + lump * (math.sin(2.3 * d.x + ph[0]) * math.sin(2.7 * d.y + ph[1]) + 0.6 * math.sin(3.1 * d.z + 1.7 * d.x + ph[2])
                        + (0.55 * math.sin(6.1 * d.x + 4.7 * d.y + ph[3]) * math.sin(5.3 * d.z - 3.9 * d.y) if sub > 1 else 0.0))
        zz = d.z * rz * n if d.z > -0.2 else (-0.2 * rz + (d.z + 0.2) * rz * sink)
        verts.append(C + V((d.x * rx * n, d.y * ry * n, zz)))
    k.add(mat, False, verts, fs)


def hedge_row(pts, heights, rng, collide=True, mat="grass", twig_mat=_BRUSH):
    """A hedge of low bushes along a polyline, rising where the painting rises (the yard's south band and its taller
    east clump): soft lumpy foliage clumps of their own sizes overlapping along the line, a few dark twigs poking out
    of them (early spring: leaf-dab clusters on bare twigs). heights: [(f, h)] along the line (f 0..1 of its length).
    A hidden box per stretch stops the walker. choice: clumps 0.35-0.75 m across."""
    P = [V((p[0], p[1], p[2] if len(p) > 2 else 0.0)) for p in pts]
    segl = [(P[i + 1] - P[i]).to_2d().length for i in range(len(P) - 1)]
    total = sum(segl)

    def hh(s):
        f = s / max(total, 1e-6)
        for (fa, ha), (fb, hb) in zip(heights, heights[1:]):
            if fa <= f <= fb:
                return ha + (hb - ha) * (f - fa) / max(fb - fa, 1e-6)
        return heights[-1][1] if f > heights[-1][0] else heights[0][1]

    def at(s):
        s = min(max(s, 0.0), total)
        acc = 0.0
        for i, L in enumerate(segl):
            if acc + L >= s or i == len(segl) - 1:
                f = (s - acc) / max(L, 1e-6)
                p = P[i].lerp(P[i + 1], f)
                t = (P[i + 1] - P[i])
                t.z = 0
                t.normalize()
                return p, t, V((t.y, -t.x, 0))
            acc += L
    s = rng.uniform(0.0, 0.15)
    while s < total:
        p, t, nrm = at(s)
        hs = hh(s)
        r = min(0.6, max(0.27, hs * rng.uniform(0.45, 0.6)))
        c = p + nrm * rng.uniform(-0.12, 0.12) + UP * (hs - r * rng.uniform(0.85, 1.0))
        _sp_blob(mat, c, r * rng.uniform(1.0, 1.3), r * rng.uniform(0.85, 1.1), r * rng.uniform(0.8, 1.0), rng, sub=2,
                 lump=0.16)
        if hs > 0.8:     # a lower clump under a tall one: a bush is full to the ground
            _sp_blob(mat, p + nrm * rng.uniform(-0.1, 0.1) + UP * (r * 0.45), r * 1.15, r * 0.95, r * 0.65, rng, lump=0.1)
        for _ in range(rng.randint(3, 6)):
            a = c + V((rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), rng.uniform(0.0, 0.15)))
            dvec = V((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0.4, 1.0))).normalized()
            _sp_twig(twig_mat, a, a + dvec * (r + rng.uniform(0.08, 0.2)), 0.01)
        s += r * rng.uniform(1.1, 1.5)
    if collide:
        for i in range(len(P) - 1):
            a, b = P[i], P[i + 1]
            t = (b - a)
            t.z = 0
            t.normalize()
            nrm = V((t.y, -t.x, 0))
            hm = max(hh(sum(segl[:i])), hh(sum(segl[:i + 1])))
            bot = [a + nrm * 0.25, b + nrm * 0.25, b - nrm * 0.25, a - nrm * 0.25]
            if (bot[1] - bot[0]).cross(bot[2] - bot[1]).z < 0:
                bot.reverse()
            _ko._hexa("hidden", True, [q - UP * 0.1 for q in bot], [q + UP * max(0.6, hm * 0.9) for q in bot])


def _sp_resample(line, n):
    """A polyline resampled to n points evenly by arc length (plan; z kept if given)."""
    P = [V((p[0], p[1], p[2] if len(p) > 2 else 0.0)) for p in line]
    seg = [(P[i + 1] - P[i]).length for i in range(len(P) - 1)]
    tot = sum(seg)
    out = []
    for q in range(n):
        s = tot * q / (n - 1)
        acc = 0.0
        for i, L in enumerate(seg):
            if acc + L >= s - 1e-9 or i == len(seg) - 1:
                out.append(P[i].lerp(P[i + 1], min(1.0, (s - acc) / max(L, 1e-9))))
                break
            acc += L
    return out


def turf_bridge(deck_s, deck_n, feet, z_water, z_of, rng, width=1.5, hump=0.18, deck_t=0.1, post_r=0.065):
    """The small plank bridge (草桥, S1.str.small_bridge_36365): a long low flat bridge on thin round posts standing in
    the water at their painted feet, each set to the deck's north or south edge by which side of the deck's middle
    it is painted on; a cap beam across at every post station, two log stringers, a deck of round poles laid across,
    and over them a top of turf and brushwood with ragged edges (sods heaped along the middle, brush twigs and straw
    sticking out of the edges); no railing. Both ends meet the bank tops level (z_of at the ends), the west third
    ramps up `hump` and the deck eases back down to the east bank. Walkable: a smooth hidden deck solid running 0.6 m
    onto each bank, and invisible side rails along both edges (nothing painted: the walker must not fall in), running
    on 0.8 m past each end to close the shore walls' gaps. deck_s, deck_n: the mapped deck edges (their middle line is
    the bridge's axis); feet: the posts' feet [(x, y)]. Returns deck_z(x, y), the deck top over a plan point.
    choice: width 1.5 m (painted 0.4-0.7 m: a farm bridge a laden walker and a donkey cross); hump 0.18 m; posts
    13 cm round; poles 8-11 cm."""
    S = _sp_resample(deck_s, 9)
    N = _sp_resample(deck_n, 9)
    C = [(a + b) / 2 for a, b in zip(S, N)]
    for c in C:
        c.z = 0.0
    seg = [(C[i + 1] - C[i]).length for i in range(len(C) - 1)]
    L = sum(seg)
    za, zb = z_of(C[0].x, C[0].y), z_of(C[-1].x, C[-1].y)

    def at(s):
        """Point, unit tangent, unit left normal of the axis at arc length s (extrapolated past the ends)."""
        if s <= 0:
            t = (C[1] - C[0]).normalized()
            return C[0] + t * s, t, V((-t.y, t.x, 0))
        acc = 0.0
        for i, ln in enumerate(seg):
            if acc + ln >= s or i == len(seg) - 1:
                t = (C[i + 1] - C[i]).normalized()
                return C[i] + t * (s - acc), t, V((-t.y, t.x, 0))
            acc += ln

    def ss(e0, e1, u):
        f = min(1.0, max(0.0, (u - e0) / (e1 - e0)))
        return f * f * (3 - 2 * f)

    def zdeck(s):
        u = min(1.0, max(0.0, s / L))
        return za + (zb - za) * u + hump * ss(0.0, 0.33, u) * ss(1.0, 0.72, u)

    def project(x, y):
        best = (1e9, 0.0, 0.0)
        acc = 0.0
        for i, ln in enumerate(seg):
            t = (C[i + 1] - C[i]).normalized()
            q = V((x, y, 0)) - C[i]
            f = min(ln, max(0.0, q.dot(t)))
            d = (q - t * f).length
            if d < best[0]:
                nrm = V((-t.y, t.x, 0))
                best = (d, acc + f, q.dot(nrm))
            acc += ln
        return best[1], best[2]
    hw = width / 2
    # posts at their painted feet, set to the edge they are painted on; cap beams at each station
    stations = []
    for x, y in feet:
        s, o = project(x, y)
        stations.append((s, 1 if o >= 0 else -1))
    stations.sort()
    groups = []
    for s, side in stations:
        if groups and s - groups[-1][-1][0] < 0.35:
            groups[-1].append((s, side))
        else:
            groups.append([(s, side)])
    for g in groups:
        sm = sum(s for s, _ in g) / len(g)
        p, t, nrm = at(sm)
        zc_ = zdeck(sm) - deck_t - 0.13
        for s, side in g:
            q, _, n2 = at(s)
            foot = q + n2 * side * (hw - 0.07) + V((rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), 0))
            sb.cyl("timber", False, foot + UP * (z_water - 0.45), foot + V((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04),
                   zc_ - 0.04)), post_r * rng.uniform(0.9, 1.15), post_r * 0.85, segs=6)
        k.beam("timber", False, p - nrm * (hw + 0.12) + UP * zc_, p + nrm * (hw + 0.12) + UP * (zc_ + rng.uniform(-0.03, 0.03)),
               0.11, 0.1, 0.02)
    # two log stringers, onto the banks at both ends
    for side in (-1, 1):
        pts, rr = [], []
        for i in range(9):
            s = -0.45 + (L + 0.9) * i / 8
            p, t, nrm = at(s)
            pts.append(p + nrm * side * (hw - 0.22) + UP * (zdeck(s) - deck_t - 0.07))
            rr.append(0.08 * rng.uniform(0.9, 1.1))
        sb.tube("timber", False, pts, rr, segs=6)
    # the deck of round poles laid across
    s = 0.02
    while s < L - 0.02:
        p, t, nrm = at(s)
        r = rng.uniform(0.04, 0.055)
        z = zdeck(s) - deck_t + 0.04
        a = p - nrm * (hw + rng.uniform(-0.04, 0.1)) + t * rng.uniform(-0.03, 0.03) + UP * (z + rng.uniform(-0.01, 0.01))
        b = p + nrm * (hw + rng.uniform(-0.04, 0.1)) + t * rng.uniform(-0.03, 0.03) + UP * (z + rng.uniform(-0.01, 0.01))
        sb.cyl("timber" if rng.random() < 0.7 else _BRUSH, False, a, b, r, r * 0.9, segs=5, caps=False)
        s += r * 2 + rng.uniform(0.005, 0.03)
    # the turf-and-brush top: a lumpy mat of sods over the poles, its edges ragged, narrower here and wider there
    nu = max(8, round(L / 0.28))
    cols = [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0]
    ph = [rng.uniform(0, 6.283) for _ in range(3)]
    grid = []
    for i in range(nu + 1):
        s = L * i / nu
        p, t, nrm = at(s)
        row = []
        for j, f in enumerate(cols):
            edge = j in (0, len(cols) - 1)
            reach = hw * (rng.uniform(0.78, 0.98) if edge else 1.0)
            bump = 0.0 if edge else 0.035 * math.sin(3.1 * s + ph[0] + 2.0 * f) + 0.02 * math.sin(7.3 * s + ph[1]) + rng.uniform(-0.01, 0.01)
            zz = zdeck(s) + (-0.035 if edge else 0.03 + bump * (1 - abs(f) * 0.6))
            row.append(p + nrm * (f * reach) + t * (rng.uniform(-0.04, 0.04) if 0 < i < nu else 0) + UP * zz)
        grid.append(row)
    verts = [q for row in grid for q in row]
    m = len(cols)
    faces = [(i * m + j, i * m + j + 1, (i + 1) * m + j + 1, (i + 1) * m + j) for i in range(nu) for j in range(m - 1)]
    faces = [tuple(reversed(f)) for f in faces] if ((verts[1] - verts[0]).cross(verts[m] - verts[0])).z < 0 else faces
    k.add("earth", False, verts, faces)
    for i in range(nu + 1):         # brush and straw sticking out of the edges, a few straw tufts on top
        for j in (0, m - 1):
            if rng.random() < 0.75:
                q = grid[i][j]
                p, t, nrm = at(L * i / nu)
                out = nrm * (1 if j == m - 1 else -1)
                dvec = (out * rng.uniform(0.6, 1.0) + t * rng.uniform(-0.6, 0.6) + UP * rng.uniform(-0.35, 0.35)).normalized()
                _sp_twig(_BRUSH, q - out * 0.1, q + dvec * rng.uniform(0.15, 0.32), rng.uniform(0.008, 0.014))
            if rng.random() < 0.35:
                q = grid[i][j]
                k.rock(_STRAW, q.x, q.y, q.z - 0.01, rng.uniform(0.07, 0.11), rng, flat=0.35)
    for _ in range(int(L * 0.6)):
        s = rng.uniform(0.3, L - 0.3)
        p, t, nrm = at(s)
        q = p + nrm * rng.uniform(-hw * 0.5, hw * 0.5)
        k.rock(_STRAW if rng.random() < 0.6 else "earth", q.x, q.y, zdeck(s) + 0.035, rng.uniform(0.08, 0.13), rng, flat=0.3)
    # the walkable deck: a smooth hidden solid, 0.6 m onto each bank, sloping into the ground there
    rings, ins = [], []
    n_ = max(6, round((L + 1.2) / 0.5))
    for i in range(n_ + 1):
        s = -0.6 + (L + 1.2) * i / n_
        p, t, nrm = at(s)
        zt_ = zdeck(min(max(s, 0.0), L)) + 0.035 - (0.12 * (-s / 0.6) if s < 0 else 0.0) - (0.12 * ((s - L) / 0.6) if s > L else 0.0)
        rings.append([p - nrm * hw + UP * zt_, p + nrm * hw + UP * zt_, p + nrm * hw + UP * (zt_ - 0.7), p - nrm * hw + UP * (zt_ - 0.7)])
        ins.append(p + UP * (zt_ - 0.35))
    verts, faces, fin = [], [], []
    for r in rings:
        verts += r
    for i in range(n_):
        for j in range(4):
            j2 = (j + 1) % 4
            faces.append((i * 4 + j, (i + 1) * 4 + j, (i + 1) * 4 + j2, i * 4 + j2))
            fin.append((ins[i] + ins[i + 1]) / 2)
    faces += [(0, 1, 2, 3), tuple(range(n_ * 4, n_ * 4 + 4))]
    fin += [ins[0] + (ins[1] - ins[0]).normalized() * 0.2, ins[-1] - (ins[-1] - ins[-2]).normalized() * 0.2]
    k.add("hidden", True, verts, _kv._orient(verts, faces, fin))
    # the invisible side rails, 0.8 m past each end onto the banks (they close the shore walls' gaps there)
    for side in (-1, 1):
        n_ = max(6, round((L + 1.6) / 0.6))
        for i in range(n_):
            s0, s1 = -0.8 + (L + 1.6) * i / n_, -0.8 + (L + 1.6) * (i + 1) / n_
            p0, _, n0 = at(s0)
            p1, _, n1 = at(s1)
            a0, a1 = p0 + n0 * side * (hw + 0.02), p1 + n1 * side * (hw + 0.02)
            z0_, z1_ = zdeck(min(max(s0, 0), L)), zdeck(min(max(s1, 0), L))
            bot = [a0, a1, a1 + n1 * side * 0.06, a0 + n0 * side * 0.06]
            if (bot[1] - bot[0]).cross(bot[2] - bot[1]).z < 0:
                bot.reverse()
            _ko._hexa("hidden", True, [q + UP * (min(z0_, z1_) - 0.5) for q in bot], [q + UP * (max(z0_, z1_) + 1.1) for q in bot])

    def deck_z(x, y):
        s, _ = project(x, y)
        return zdeck(s) + 0.035
    return deck_z


def stone_roller(x, y, z, yaw_deg, rng, r=0.23, L=0.72):
    """A stone threshing roller (碌碡) idle in its drag frame (S1.prop.roller_frame_34158): a dark, slightly tapered
    stone cylinder with shallow grooves, its axis along yaw (end on to the viewer at yaw 90), in a pale wooden frame:
    two side bars past its ends, the west one bent round its side, end bars where the axle pins go, a short peg at the
    top, a squared drag bar sticking out low at the east. A hidden box stops the walker.
    choice: stone 0.46 m across, 0.72 m long (painted 65 x 70 px with its frame)."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        # the stone: axis along local x
        prof = []
        for i in range(6):
            f = i / 5
            rr = r * (0.88 + 0.12 * f) * (0.97 if i % 2 else 1.0)
            prof.append((rr, rr, -L / 2 + L * f))
        _ko._lathe3("ridge", False, (0, 0, r), V((0, 1, 0)), V((0, 0, 1)), V((1, 0, 0)), prof, segs=12, cap0=True, cap1=True)
        for sx in (-1, 1):
            sb.cyl("timber", False, (sx * (L / 2 - 0.02), 0, r), (sx * (L / 2 + 0.07), 0, r), 0.03, segs=6)
        # the frame (pale timber: deck)
        w = r + 0.07
        k.beam("deck", False, (-L / 2 - 0.12, -w, r + 0.02), (L / 2 + 0.12, -w, r + 0.04), 0.06, 0.08, 0.012)
        bend = [V((-L / 2 - 0.12, w, r + 0.02)), V((-L / 4, w + 0.06, r + 0.1)), V((L / 4, w + 0.06, r + 0.1)),
                V((L / 2 + 0.12, w, r + 0.04))]
        sb.tube("deck", False, bend, [0.035] * 4, segs=5)
        for sx in (-1, 1):
            k.beam("deck", False, (sx * (L / 2 + 0.08), -w - 0.03, r), (sx * (L / 2 + 0.08), w + 0.03, r + 0.02), 0.06, 0.07, 0.01)
        k.beam("deck", False, (0.05, w + 0.05, r + 0.1), (0.07, w + 0.04, r + 0.33), 0.04, 0.04, 0.006)
        k.beam("deck", False, (L / 2 + 0.08, -w * 0.4, 0.07), (L / 2 + 0.62, -w * 0.5, 0.05), 0.07, 0.07, 0.008)
        k.bx("hidden", True, (-L / 2 - 0.1, -w - 0.05, 0), (L / 2 + 0.1, w + 0.05, 2 * r + 0.05))


def haystack_dome(x, y, z, rng, r=0.66, h_side=0.85, h_dome=0.8, mat=_STRAW):
    """A domed haystack (草垛, S1.prop.haystack_34080): a round stack with nearly straight sides (the painted straight
    west side) bellying a little, under a smooth dome with a twisted straw knob on top; a ragged skirt of straw ends at
    the foot, two loose rope bands. A hidden cylinder stops the walker.
    choice: 1.3 m across, 1.65 m high (it must stand between the big farmhouse's east wall and the roller)."""
    prof = [(r * 0.94, r * 0.94, -0.05), (r, r, 0.15), (r * 1.03, r * 1.03, h_side * 0.55), (r, r, h_side)]
    for i in range(1, 6):
        a = math.pi / 2 * i / 6
        prof.append((r * math.cos(a), r * math.cos(a), h_side + h_dome * math.sin(a)))
    prof.append((0.0, 0.0, h_side + h_dome))
    _ko._lathe3(mat, False, (x, y, z), V((1, 0, 0)), V((0, 1, 0)), UP, prof, segs=16, cap0=False,
                uv_tile=sb.MATERIALS[mat][1])
    k.rock(mat, x, y, z + h_side + h_dome - 0.02, 0.12, rng, flat=1.2)
    foot = [V((x + math.cos(2 * math.pi * i / 22) * r * 0.98, y + math.sin(2 * math.pi * i / 22) * r * 0.98, z + 0.14))
            for i in range(22)]
    _sp_fringe(foot, (x, y), rng, "ragged", (0.08, 0.18))
    for zz in (h_side * 0.35, h_side * 0.8):
        ring = [V((x + math.cos(2 * math.pi * i / 12) * (r * 1.03 + 0.012), y + math.sin(2 * math.pi * i / 12) * (r * 1.03 + 0.012),
                   z + zz + 0.03 * math.sin(i * 1.7))) for i in range(13)]
        sb.tube("rope", False, ring, [0.012] * 13, segs=3)
    sb.cyl("hidden", True, (x, y, z - 0.05), (x, y, z + h_side + h_dome * 0.6), r * 0.92, segs=8)


def block_bench(p0, p1, z, rng, h=0.42, w=0.3, mat="timber"):
    """A low plank bench on two block legs (S1.prop.bench_35133, the long plank under the shed): a thick plank top,
    a squared block leg under each end. Seats never collide. choice: 0.42 m high, 0.3 m wide."""
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (b - a).normalized()
    nrm = V((-t.y, t.x, 0))
    top = [a - nrm * (w / 2), b - nrm * (w / 2), b + nrm * (w / 2), a + nrm * (w / 2)]
    k.soft_slab(mat, False, [(p.x, p.y) for p in top], z + h - 0.06, z + h, rng, r=0.02, wob=0.004, ease=0.008)
    for p in (a + t * 0.16, b - t * 0.16):
        q = [p - t * 0.07 - nrm * (w * 0.4), p + t * 0.07 - nrm * (w * 0.4), p + t * 0.07 + nrm * (w * 0.4), p - t * 0.07 + nrm * (w * 0.4)]
        k.soft_slab(mat, False, [(c.x, c.y) for c in q], z - 0.02, z + h - 0.06, rng, r=0.015, wob=0.004, ease=0.0)


def flat_basket(x, y, z, r, rng, h=0.13, sticks=0, handle=None, mat=_STRAW):
    """A wide shallow round basket on the ground (a feeding tray, a sieve): a woven tray with ribbed stakes, a rolled
    rim of split bamboo, its dark inside; `sticks` thin sticks standing in it (the yard object's two uprights);
    handle = a yaw (deg): a short handle pole running out that way (the stall's basket)."""
    _ki._ribbed_lathe(mat, False, (x, y, z), [(r * 0.7, 0), (r * 0.86, h * 0.3), (r * 0.97, h * 0.7), (r, h - 0.01)],
                      14, ribs=0.03, ribbed=(1, 2), rot=rng.uniform(0, 1))
    tr = 0.018
    _ki._ribbed_lathe("bamboo", False, (x, y, z), [(r + 0.004, h - 0.025), (r + tr, h), (r - tr, h + 0.01)], 14, cap=False)
    _ki._ribbed_lathe(_DARK, False, (x, y, z), [(r * 0.66, 0.012), (r - tr, h - 0.01)], 14, cap=True)
    for i in range(sticks):
        a = rng.uniform(0, 6.283)
        p = V((x + math.cos(a) * r * 0.3, y + math.sin(a) * r * 0.3, z + 0.02))
        _sp_twig("timber", p, p + V((rng.uniform(-0.08, 0.08), rng.uniform(-0.08, 0.08), rng.uniform(0.3, 0.42))), 0.012)
    if handle is not None:
        a = math.radians(handle)
        d = V((math.cos(a), math.sin(a), 0))
        p = V((x, y, z + h * 0.6)) + d * (r * 0.9)
        sb.cyl("timber", False, p, p + d * 0.45 - UP * (h * 0.5), 0.016, 0.014, segs=5)


def tied_jar(x, y, z, rng, r=0.33, h=0.78):
    """A large earthenware storage jar with a cloth tied over its mouth (S1.prop.jar_tied_31298): kit_outer_road_2's
    big jar, a cloth domed over the rim and gathered under it by a cord, its loose edge hanging in a few points.
    Collides (the jar). choice: 0.66 m across, 0.78 m high (painted 50 x 65 px)."""
    _k2.big_jar(x, y, z, rng, r=r, h=h)
    rm = r * 0.93
    _ko._lathe3("cloth_white", False, (x, y, z + h - 0.06), V((1, 0, 0)), V((0, 1, 0)), UP,
                [(rm * 0.96, rm * 0.96, 0.0), (rm * 1.04, rm * 1.04, 0.05), (rm * 0.98, rm * 0.98, 0.09), (rm * 0.7, rm * 0.7, 0.13),
                 (rm * 0.3, rm * 0.3, 0.155), (0.0, 0.0, 0.16)], segs=12, cap0=False)
    sb.cyl("rope", False, (x, y, z + h - 0.035), (x, y, z + h - 0.015), rm * 0.99 + 0.012, segs=12, caps=False)
    a0 = rng.uniform(0, 6.283)
    for i in range(3):              # the cloth's corners hanging a little below the cord
        a = a0 + 2.094 * i + rng.uniform(-0.3, 0.3)
        c = V((x + math.cos(a) * rm * 1.0, y + math.sin(a) * rm * 1.0, z + h - 0.055))
        tv = V((-math.sin(a), math.cos(a), 0)) * rng.uniform(0.05, 0.08)
        k.add("cloth_white", False, [c - tv, c + tv, c + V((math.cos(a), math.sin(a), 0)) * 0.025 - UP * rng.uniform(0.04, 0.07)],
              [(0, 1, 2)])


def basin_on_stand(x, y, z, rng, r=0.37, h=0.18, stand=0.32):
    """A wide shallow wooden basin with a thick rim on a low three-legged stand (S1.prop.basin_31373). Collides.
    choice: 0.74 m across (painted 77 px), stand 0.32 m."""
    zt = z + stand
    for i in range(3):
        a = rng.uniform(0, 0.3) + 2 * math.pi * i / 3
        f = V((x + math.cos(a) * r * 0.8, y + math.sin(a) * r * 0.8, z))
        t = V((x + math.cos(a) * r * 0.45, y + math.sin(a) * r * 0.45, zt))
        k.beam("timber", True, f, t, 0.045, 0.045, 0.006)
    sb.cyl("timber", False, (x, y, z + stand * 0.4), (x, y, z + stand * 0.4 + 0.035), r * 0.62, segs=10, caps=False)
    _ki.tub(x, y, zt, r, h, rng)
    sb.cyl("timber", False, (x, y, zt + h - 0.02), (x, y, zt + h + 0.015), r + 0.02, segs=12, caps=False)


def sawhorse(x, y, z, yaw_deg, rng, h=0.72, spread=0.55, length=0.5):
    """An A-frame trestle (a sawhorse) of two crossed sticks at each end, crossing near the top, a short bar laid in
    the crotches (S1.prop.trestle_hut_gate_30841: 'two crossed sticks ... with a short crossbar above'); seen end on
    it is the painted A. choice: 0.72 m high."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        for xx in (-length / 2, length / 2):
            xc = 0.82 * h
            for sgn in (-1, 1):
                a = V((xx + rng.uniform(-0.02, 0.02), sgn * spread / 2, -0.03))
                b = V((xx, -sgn * 0.09, h + rng.uniform(-0.03, 0.03)))
                k.beam("timber", False, a, b, 0.035, 0.035, 0.006)
            k.beam("timber", False, (xx, -spread * 0.3, 0.22), (xx, spread * 0.3, 0.23), 0.025, 0.025, 0)
        sb.cyl("timber", False, (-length / 2 - 0.15, 0, 0.82 * h + 0.03), (length / 2 + 0.15, 0.01, 0.82 * h + 0.04), 0.035, segs=6)


def crossed_poles(x, y, z, yaw_deg, rng, L=0.95, h=0.6):
    """A low frame of crossed and slanting poles (S1.prop.crossed_poles_34925, a trestle or drying rack): two X frames
    of round poles joined by a top pole and a low rail. choice: 0.95 m long, 0.6 m high (painted 47 x 55 px)."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        for xx in (-L / 2 + 0.05, L / 2 - 0.05):
            for sgn in (-1, 1):
                sb.cyl("bamboo", False, (xx + rng.uniform(-0.03, 0.03), sgn * 0.24, -0.03),
                       (xx + rng.uniform(-0.03, 0.03), -sgn * 0.14, h + rng.uniform(-0.03, 0.04)), 0.025, 0.02, segs=5)
        sb.cyl("bamboo", False, (-L / 2 - 0.1, 0, h * 0.8), (L / 2 + 0.1, 0.02, h * 0.82), 0.028, segs=5)
        sb.cyl("bamboo", False, (-L / 2, 0.16, 0.2), (L / 2, 0.15, 0.22), 0.02, segs=5)


def crow_nest(x, y, z, rng, r=0.26):
    """A crow's nest (S1.prop.nest_*: 'a dark tangled clump of twigs' in a bare elm's fork; no bird): a loose
    squashed ball of dark twigs crossing every way round a dark core, a few long sticks poking out. (x, y, z) is its
    bottom. choice: 0.5 m across."""
    c = V((x, y, z + r * 0.7))
    _sp_blob(_DARK, c, r * 0.55, r * 0.55, r * 0.38, rng, sub=1, lump=0.15, sink=1.0)
    for _ in range(34):
        u = V((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.6, 0.6))).normalized()
        v = u.cross(V((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))).normalized()
        p = c + u * r * rng.uniform(0.55, 0.9)
        ln = rng.uniform(0.2, 0.42)
        _sp_twig(_BRUSH, p - v * ln / 2, p + v * ln / 2, rng.uniform(0.008, 0.014))
    for _ in range(5):
        u = V((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.2, 0.8))).normalized()
        _sp_twig(_BRUSH, c + u * r * 0.4, c + u * (r + rng.uniform(0.12, 0.25)), 0.01)


def post_crossbar(x, y, z, rng, h=2.5, bar_z=1.1, bar_yaw=0.0, bar_len=1.35):
    """A tall wooden post (S1.prop.post_crossbar_29862: a hitching post or a well's upright, 'topped with a cap-like
    crosspiece and a two-pronged fork, with a horizontal bar through it at about waist height' on which a man leans):
    a round post on a stone, a cap-like crosspiece near its top, a fork of two prongs above it, a bar through it at
    waist height (pegged). The post collides. choice: 2.5 m (1.5 x the man beside it), the bar 1.35 m at 1.1 m."""
    k.rock("stone", x, y, z - 0.02, 0.2, rng, flat=0.4)
    top = V((x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), z + h * 0.88))
    sb.cyl("timber", True, (x, y, z - 0.1), top, 0.085, 0.075, segs=8)
    a = math.radians(bar_yaw)
    d = V((math.cos(a), math.sin(a), 0))
    cp = top + UP * 0.02
    k.beam("timber", False, cp - d * 0.32 + UP * 0.03, cp + d * 0.32 + UP * 0.06, 0.12, 0.09, 0.025)
    k.beam("timber", False, cp - d * 0.36 + UP * 0.08, cp - d * 0.42 + UP * 0.17, 0.08, 0.06, 0.015)
    k.beam("timber", False, cp + d * 0.36 + UP * 0.11, cp + d * 0.44 + UP * 0.2, 0.08, 0.06, 0.015)
    for sgn in (-1, 1):
        sb.cyl("timber", False, cp + UP * 0.08 + d * (sgn * 0.04), cp + UP * (h * 0.12 + 0.12) + d * (sgn * 0.13), 0.04, 0.03, segs=6)
    bc = V((x, y, z + bar_z))
    sb.cyl("timber", False, bc - d * (bar_len / 2), bc + d * (bar_len / 2), 0.045, 0.04, segs=7)
    sb.cyl("timber", False, bc + V((-d.y, d.x, 0)) * -0.12, bc + V((-d.y, d.x, 0)) * 0.12, 0.018, segs=4)


def pale_board(x, y, z, rng, z0=1.25, z1=2.4, w=0.21):
    """A narrow pale upright board with a hooked top (S1.prop.pale_board_29172, a blank sign or a banner between the
    stall's willows; no writing is painted, none is built), hung on a thin pole planted beside it.
    choice: the board from 1.25 to 2.4 m (painted v 445-530 over a foot at 628), on a 2.6 m pole."""
    sb.cyl("timber", True, (x - 0.06, y + 0.04, z - 0.1), (x - 0.05, y + 0.05, z + z1 + 0.25), 0.035, 0.028, segs=6)
    k.board("deck", False, (x - w / 2 + 0.02, y), (x + w / 2 + 0.02, y), 0.025, z + z0, z + z1)
    k.beam("timber", False, (x - w / 2, y - 0.02, z + z1 - 0.02), (x + w / 2 + 0.04, y - 0.02, z + z1 - 0.02), 0.03, 0.04, 0.005)
    hook = [V((x + 0.02, y - 0.02, z + z1)), V((x + 0.02, y - 0.02, z + z1 + 0.1)), V((x + 0.08, y - 0.02, z + z1 + 0.15)),
            V((x + 0.11, y - 0.02, z + z1 + 0.1))]
    sb.tube("ridge", False, hook, [0.012] * 4, segs=4)


def hanging_bundle(x, y, z_hook, rng, toward=(0.0, 1.0)):
    """A bundle of straw sandals hung on a peg (S1.prop.hanging_bundle_29198, 'a small cluster of pale things ... hung
    on the east side of the willow's trunk at head height'): a peg pointing back toward the trunk (`toward`), a cord,
    four sandals of their own sizes hanging at angles. choice: sandals 0.24 m."""
    d = V((toward[0], toward[1], 0)).normalized()
    hook = V((x, y, z_hook))
    sb.cyl("timber", False, hook + d * 0.16, hook - d * 0.02, 0.014, segs=4)
    sb.cyl("rope", False, hook, hook - UP * 0.12, 0.006, segs=4, caps=False)
    for i in range(4):
        a = 2 * math.pi * i / 4 + rng.uniform(-0.4, 0.4)
        c = hook - UP * (0.12 + rng.uniform(0.08, 0.14)) + V((math.cos(a), math.sin(a), 0)) * 0.035
        ln, wd = rng.uniform(0.21, 0.25), rng.uniform(0.075, 0.09)
        ax = (V((math.cos(a), math.sin(a), 0)) * 0.25 - UP).normalized()
        sd = V((-math.sin(a), math.cos(a), 0))
        q = [c - sd * wd / 2, c + sd * wd / 2, c + sd * wd * 0.4 + ax * ln, c - sd * wd * 0.4 + ax * ln]
        _ko._slab_poly(_STRAW, False, q, ax.cross(sd), 0.018)
        sb.cyl("rope", False, hook - UP * 0.12, c, 0.005, segs=3, caps=False)


def thin_stake(base, top, rng, r=0.022):
    """A single thin stake stuck in the ground, leaning (S1.prop.reed_or_stake_32882; read as a stake, not a reed)."""
    _ko._spike("timber", V(base) - UP * 0.15, V(top), r * 2, 0.06)


def leaning_pole(foot, rest, rng, over=1.57, r=0.055):
    """A straight cut pole leaning from its foot on the ground against a trunk at `rest` and running on past it
    (S1.prop.leaning_pole_37075: 'its squared upper end sticking out north-west past the slender tree'), its upper end
    sawn square. Collides. choice: about 0.11 m thick (painted 10-12 px)."""
    F, R = V(foot), V(rest)
    T = F + (R - F) * over
    sb.cyl("timber", True, F - (R - F).normalized() * 0.05, T, r, r * 0.85, segs=7)
    return T


def post_frame(foot_a, foot_b, rng, h_a=2.05, h_b=2.45, beam=True):
    """Two posts on the threshing floor's north edge joined by a beam (S1.str.posts_35075, taken as a frame: the
    strokes show no roof between the farmhouse's eave and their tops): a thin round post at foot_a and a taller pole
    with a forked top at foot_b, a pole laid from the first's top into the fork, lashed. Posts collide.
    choice: 2.05 and 2.45 m (painted 80 and 113 px)."""
    A, B = V(foot_a), V(foot_b)
    ta = A + V((rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), h_a))
    tb = B + V((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), h_b - 0.3))
    sb.cyl("timber", True, A - UP * 0.1, ta, 0.06, 0.05, segs=6)
    sb.cyl("timber", True, B - UP * 0.1, tb, 0.075, 0.065, segs=7)
    d = (tb - ta)
    d.z = 0
    d = d.normalized() if d.length > 1e-6 else V((1, 0, 0))
    for sgn in (-1, 1):
        sb.cyl("timber", False, tb, tb + UP * 0.32 + V((-d.y, d.x, 0)) * (sgn * 0.12) + d * 0.05, 0.035, 0.025, segs=5)
    if beam:
        sb.cyl("timber", False, ta + UP * 0.02 - d * 0.12, tb + UP * 0.1 + d * 0.15, 0.05, 0.045, segs=6)
        for p in (ta + UP * 0.02, tb + UP * 0.1):
            sb.cyl("rope", False, p - UP * 0.04, p + UP * 0.04, 0.06, segs=6, caps=False)


def trough_barrow(front, rear, wheel, z_of, rng, roll=35.0, L=1.7, R=0.27, spokes=10):
    """A front-wheel trough barrow (独轮车) lying tipped on the ground (S1.veh.barrow_tipped_29795): a trough of boards
    tapering from a wide square front to the narrow handle end, its two side boards running on as handles with worn
    grips, two short legs under it, a small spoked wheel at the front in a fork, a curved guard over it; laid down
    rolled `roll` degrees onto its far side (the open trough turned to the viewer, as painted), its handle tips and
    the wheel's rim resting on the ground. front: the ground under the wheel; rear: under the handle tips; wheel: the
    painted wheel (unused but for the side). A hidden box stops the walker.
    choice: 1.7 m long (painted 1.34 m), wheel 0.54 m across (painted 36 px), roll 35 degrees."""
    z_of = z_of or (lambda x, y: 0.0)
    a = V((rear[0], rear[1], 0))
    b = V((front[0], front[1], 0))
    mid = (a + b) / 2
    d = (b - a).normalized()
    yaw = math.degrees(math.atan2(d.y, d.x))
    zg = z_of(mid.x, mid.y)
    o = mid - d * (L / 2)
    # build upright in a local frame (x from the handle tips at 0 to the wheel's front at L, y left, z up), roll it
    # about x, then lift it so its lowest point rests on the ground
    roll_r = math.radians(roll)
    cr, sr = math.cos(roll_r), math.sin(roll_r)

    def rolled(p):
        return V((p[0], p[1] * cr - p[2] * sr, p[1] * sr + p[2] * cr))
    xw = L - R * 0.6
    key = [(0.0, 0.17, 0.42), (0.0, -0.17, 0.42), (xw, 0.0, 0.0), (xw, R * 0.9, R), (xw, -R * 0.9, R),
           (0.55, 0.2, 0.0), (0.55, -0.2, 0.0), (L - 0.05, 0.3, 0.5), (L - 0.05, -0.3, 0.5)]
    zmin = min(rolled(p).z for p in key)
    M = k.frame(o.x, o.y, zg - zmin, yaw) @ Matrix.Rotation(roll_r, 4, "X")
    with k.placed(M):
        x0t, x1t = 0.5, L - 0.42
        zb = 0.28

        def wdt(x):
            f = (x - x0t) / (x1t - x0t)
            return 0.17 + 0.13 * f
        # floor and two sides and the front board, boards with thickness
        for xa, xb in ((x0t, (x0t + x1t) / 2), ((x0t + x1t) / 2, x1t)):
            _ko._hexa("timber", False, [V((xa, -wdt(xa), zb)), V((xb, -wdt(xb), zb)), V((xb, wdt(xb), zb)), V((xa, wdt(xa), zb))],
                      [V((xa, -wdt(xa), zb + 0.03)), V((xb, -wdt(xb), zb + 0.03)), V((xb, wdt(xb), zb + 0.03)), V((xa, wdt(xa), zb + 0.03))], rng)
        for sgn in (-1, 1):
            pa, pb = V((x0t, sgn * wdt(x0t), zb)), V((x1t, sgn * (wdt(x1t) + 0.06), zb))
            top_a, top_b = pa + UP * 0.2 + V((0, sgn * 0.03, 0)), pb + UP * 0.3 + V((0, sgn * 0.05, 0))
            q = [pa, pb, top_b, top_a]
            _ko._slab_poly("timber", False, q, V((0, sgn, 0)), 0.03)
            # handles: the side rails running on to the tips, with grips
            h0 = V((x1t - 0.1, sgn * (wdt(x1t) + 0.02), zb + 0.12))
            h1 = V((0.0, sgn * 0.17, 0.42))
            k.beam("timber", False, h0, h1, 0.045, 0.05, 0.01)
            sb.cyl("bark", False, h1 + (h0 - h1).normalized() * 0.02, h1 + (h0 - h1).normalized() * 0.16, 0.03, segs=6)
            k.beam("timber", False, V((0.62, sgn * 0.19, zb)), V((0.55, sgn * 0.2, 0.0)), 0.04, 0.04, 0.006)
            # the fork down to the axle
            k.beam("timber", False, V((x1t - 0.05, sgn * (wdt(x1t) - 0.02), zb + 0.05)), V((xw, sgn * 0.07, R)), 0.04, 0.04, 0.006)
        fa = V((x1t, -wdt(x1t) - 0.04, zb))
        _ko._slab_poly("timber", False, [fa, V((x1t, wdt(x1t) + 0.04, zb)), V((x1t + 0.04, wdt(x1t) + 0.08, zb + 0.32)),
                                         V((x1t + 0.04, -wdt(x1t) - 0.08, zb + 0.32))], V((1, 0, 0.1)), 0.03)
        # the wheel: rim, hub, spokes, axle
        rim = [V((xw + math.cos(2 * math.pi * i / 16) * R, 0.0, R + math.sin(2 * math.pi * i / 16) * R)) for i in range(17)]
        sb.tube("timber", False, rim, [0.03] * 17, segs=4)
        sb.cyl("timber", False, (xw, -0.06, R), (xw, 0.06, R), 0.06, segs=8)
        sb.cyl("ridge", False, (xw, -0.1, R), (xw, 0.1, R), 0.015, segs=4)
        for i in range(spokes):
            ang = 2 * math.pi * i / spokes
            k.beam("timber", False, (xw + math.cos(ang) * 0.05, 0, R + math.sin(ang) * 0.05),
                   (xw + math.cos(ang) * (R - 0.02), 0, R + math.sin(ang) * (R - 0.02)), 0.022, 0.018, 0)
        guard = [V((xw + math.cos(math.radians(a_)) * (R + 0.07), 0.0, R + math.sin(math.radians(a_)) * (R + 0.07)))
                 for a_ in (170, 140, 110, 80, 50, 20)]
        for gy in (-0.05, 0.05):
            sb.tube("timber", False, [p + V((0, gy, 0)) for p in guard], [0.018] * len(guard), segs=4)
        k.bx("hidden", True, (0.0, -0.3, 0.0), (L, 0.3, 0.6))
    return yaw


def willow_spray(front, rear, z_of, rng, w=0.78, d=0.92, body_h=1.42, pole_h=1.3, cabin_at=0.5, n_twigs=12):
    """The willow decking of the tomb-sweeping party's sedan (杨柳杂花装簇轿顶, S1.veh.sedan_willow_30805), in the
    frame kit_vehicles.sedan_chair builds the cabin in (same front, rear and sizes): a spray of `n_twigs` long bare
    willow whips with a faint green haze of buds fanning up and forward (west, as painted) from the roof's front
    corners, more strands hanging down the cabin's front face, a few short twigs standing at its rear corners. No
    flowers (none can be told apart at this size). choice: whips 0.8-1.4 m, strands 0.5-0.9 m."""
    z_of = z_of or (lambda x, y: 0.0)
    origin, fwd, left, L = _kv._axis(rear, front)
    mid = L * min(0.9, max(0.1, cabin_at))
    zg = z_of(*(origin + fwd * mid).xy)
    z_f = pole_h - 0.6
    zt = z_f + body_h
    x1 = mid + d / 2
    x0 = mid - d / 2
    hy = w / 2
    with k.placed(_kv._frame_m(origin, fwd, zg)):
        for i in range(n_twigs):
            sy = (1 if i % 3 == 0 else -1) * rng.uniform(0.1, 1.0) * (hy + 0.1)
            base = V((x1 + 0.05, sy, zt + 0.1))
            ln = rng.uniform(1.0, 1.6)
            out = V((rng.uniform(0.5, 1.0), sy * rng.uniform(0.2, 0.8), rng.uniform(0.55, 1.1))).normalized()
            pts = [base]
            dvec = out
            for q in range(4):
                dvec = (dvec + V((0.12, 0, -0.12 * q))).normalized()
                pts.append(pts[-1] + dvec * (ln / 4))
            sb.tube("willow", False, pts, [0.02, 0.016, 0.012, 0.008, 0.004], segs=3)
            for q in range(2):            # side shoots
                b0 = pts[1].lerp(pts[3], rng.uniform(0.0, 1.0))
                sv = (dvec + V((rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(0.0, 0.5)))).normalized()
                sb.tube("willow", False, [b0, b0 + sv * 0.25, b0 + sv * 0.5 + V((0.05, 0, -0.05))], [0.008, 0.006, 0.003],
                        segs=3)
            for q in range(14):           # the green haze of buds along the outer half
                p = pts[1].lerp(pts[-1], rng.uniform(0.0, 1.0))
                a = rng.uniform(0, 6.283)
                e = V((math.cos(a), math.sin(a), rng.uniform(-0.5, 0.5))).normalized() * 0.035
                k.add("grass", False, [p, p + e, p + e.cross(dvec).normalized() * 0.02 + e * 0.5], [(0, 1, 2)])
        for i in range(12):             # strands hanging down the front face
            sy = -hy + w * (i + rng.uniform(0.1, 0.9)) / 12
            a = V((x1 + 0.08 + rng.uniform(0, 0.05), sy, zt + 0.06))
            ln = rng.uniform(0.5, 0.9)
            pts = [a, a + V((0.05, rng.uniform(-0.03, 0.03), -ln * 0.4)), a + V((0.04, rng.uniform(-0.05, 0.05), -ln * 0.75)),
                   a + V((0.02, rng.uniform(-0.06, 0.06), -ln))]
            sb.tube("willow", False, pts, [0.008, 0.007, 0.005, 0.003], segs=3)
        for i in range(4):              # a few twigs standing at the rear corners
            sy = (1 if i % 2 else -1) * (hy + 0.05)
            base = V((x0 - 0.05, sy, zt + 0.08))
            tip = base + V((rng.uniform(-0.15, 0.0), sy * rng.uniform(0.0, 0.3), rng.uniform(0.35, 0.6)))
            sb.tube("willow", False, [base, base.lerp(tip, 0.5) + V((0, 0, 0.02)), tip], [0.01, 0.007, 0.004], segs=3)
# ==================================================================== END SET PIECES ==============================
