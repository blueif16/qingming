"""Gate section, walkable web scene, composed from the Song construction kit (blender/song_kit.py).

build(scene) creates collection "gate_scene" in `scene`: one mesh per (material, collide) bucket, named
"g_<material>__col" / "g_<material>__nocol" (the page collides with every "__col" mesh; "hidden__col" is
collider-only). export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships it.

Layout keeps the placement test's frame (figures_world.json): X along the street (out of the city = +X), Y depth
(north), Z up, origin at the moat bridge's near-left deck corner. Only the bridge is measured. The wall, gate
block, tower and tax office follow the restyle's forms at plausible Song sizes (rough positions); the houses are
the two on the south side of the street and two at the west edge, as painted.

Live GUI: importlib.reload(song_kit); importlib.reload(gate_scene); gate_scene.build(bpy.data.scenes["gate_scene"])
"""
import json
import math
import random

import bpy
from mathutils import Vector

import song_kit as k
import street_b1 as sb
from song_kit import V, bx

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SCENE_JSON = QM + r"\sections\gate\scene.json"
COLL = "gate_scene"

# the gate block's brick faces lean in (batter): inner face x at the base and at the top, likewise the outer face
GB = {"xi0": -26.9, "xi1": -25.4, "xo0": -12.1, "xo1": -13.6, "h": 7.88, "y0": -5.0, "y1": 14.0,
      "py0": 5.0, "py1": 8.2, "ph": 5.6}
WING = {"xi0": -26.5, "xi1": -25.0, "xo0": -12.5, "xo1": -14.0}


def face_x(x0, x1, z, h):
    return x0 + (x1 - x0) * z / h


# ---------------------------------------------------------------- ground and water

def road_dist(x, y, road):
    best = 1e9
    for (ax, ay), (bx_, by) in zip(road, road[1:]):
        dx, dy = bx_ - ax, by - ay
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - t * dx, y - ay - t * dy))
    return best


GROUND = {}


def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def ground(rng, road):
    """Heightfield over the section: low undulation, a flattened road with two ruts, the moat channel with
    sloping banks, eroded mounds at both feet of the wall. One smooth mesh with shared vertices (no ink creases
    between cells); each vertex carries how bare it is (road, moat banks, the passage front) in a second UV map,
    and the page blends the ground and road washes along a noisy edge (web/src/surface.js). build() makes the
    object from GROUND."""
    X0, X1, Y0, Y1 = -50, 32, -20, 38
    ph = [rng.uniform(0, 6.283) for _ in range(6)]

    def h(x, y):
        z = (0.035 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.025 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.015 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = road_dist(x, y, road)
        if dr < 3.2:
            z = z * (0.35 + 0.65 * dr / 3.2) - 0.04 * (1 - dr / 3.2) - 0.03 * math.exp(-((dr - 0.8) / 0.2) ** 2)
        if 0 <= x <= 14:
            f = min(x, 14 - x)
            s = min(1.0, f / 2.0)
            z = z * (1 - s) - 2.3 * (s * s * (3 - 2 * s))
        for xb in (-12.3, -26.7):
            df = abs(x - xb)
            if df < 2.4 and not (3.6 < y < 9.6):
                z += 0.38 * (1 - df / 2.4) ** 1.5 * (0.6 + 0.4 * math.sin(1.3 * y + ph[4]))
        return z

    def bare(x, y):
        # the road's verge wanders: a low-frequency wobble on the distance, so the worn edge is never parallel
        dr = (road_dist(x, y, road) + 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5])
              + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1]))
        b = 1 - _smooth(1.5, 3.2, dr)
        b = max(b, _smooth(-1.2, 0.3, min(x, 14 - x)))                                    # moat channel and banks
        if -28.5 < x < -10.5:                                                               # trodden passage front
            b = max(b, 1 - _smooth(0.0, 1.6, max(4.6 - y, y - 8.6, -27.0 - x, x - 12.0)))
        return b

    nx, ny = X1 - X0, Y1 - Y0
    verts = [V((X0 + i, Y0 + j, h(X0 + i, Y0 + j))) for j in range(ny + 1) for i in range(nx + 1)]
    faces = [(j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i)
             for j in range(ny) for i in range(nx)]
    GROUND.update(verts=verts, faces=faces, bare=[bare(v.x, v.y) for v in verts])
    sb.quad("water", False, (0, Y0, -1.65), (14, Y0, -1.65), (14, Y1, -1.65), (0, Y1, -1.65))
    return h


# ---------------------------------------------------------------- the moat bridge (平桥)

def bridge(rng):
    # stone abutments where the deck lands on each bank
    for xc in (-0.05, 14.05):
        k.masonry((xc, -1.2), (xc, 9.2), -2.4, -0.02, 0.6, rng, course=(0.5, 0.7), lmin=0.9, lmax=1.7, seg=1.2)
    # stringers along both edges, then the deck planks laid across them, each a little different
    for y in (0.18, 7.82):
        k.beam("timber", True, (-0.5, y, -0.25), (14.5, y, -0.25), 0.32, 0.4, 0.04)
    k.plank_deck(0.0, 14.0, -0.08, 8.08, 0.0, rng)
    # railings as painted: posts with caps, top / middle / bottom rails, two board courses and one brace per bay
    for y in (0.12, 7.88):
        xs = [i * 1.75 for i in range(9)]
        for xp in xs:
            k.post("timber", True, xp, y, -0.05, 1.12, 0.15, 0.025)
            bx("timber", False, (xp - 0.1, y - 0.1, 1.12), (xp + 0.1, y + 0.1, 1.2))
        k.beam("timber", True, (-0.15, y, 1.02), (14.15, y, 1.02), 0.12, 0.11, 0.025)
        k.beam("timber", True, (0, y, 0.58), (14, y, 0.58), 0.08, 0.08, 0)
        k.beam("timber", False, (0, y, 0.12), (14, y, 0.12), 0.1, 0.08, 0)
        for zc in (0.27, 0.42):
            k.beam("timber", False, (0, y, zc), (14, y, zc), 0.035, 0.11, 0)
        for xa, xb in zip(xs, xs[1:]):
            k.beam("timber", False, (xa + 0.08, y, 0.14), (xb - 0.08, y, 0.56), 0.06, 0.07, 0)
    # three timber trestles standing in the water
    for xt in (3.5, 7.0, 10.5):
        for yp in (0.55, 4.0, 7.45):
            sb.cyl("timber", False, (xt + rng.uniform(-0.04, 0.04), yp, -2.7), (xt, yp, -0.6), 0.17, 0.15, segs=8)
        k.beam("timber", False, (xt, -0.45, -0.55), (xt, 8.45, -0.55), 0.3, 0.26, 0.04)
        k.beam("timber", False, (xt, 0.2, -1.45), (xt, 7.8, -1.45), 0.18, 0.16, 0.03)
        k.beam("timber", False, (xt, 0.6, -1.4), (xt, 3.95, -0.7), 0.1, 0.1, 0.02)
        k.beam("timber", False, (xt, 7.4, -1.4), (xt, 4.05, -0.7), 0.1, 0.1, 0.02)


# ---------------------------------------------------------------- city wall, gate block, passage

def wing(y_from, y_to, rng, flat_near=None):
    """A rammed-earth wing of the city wall: coursed, bulging, slumped faces (kit rammed_wall), rubble and grass
    at both feet, grass along the uneven top."""
    W = WING
    rows = k.rammed_wall(y_from, y_to, W["xi0"], W["xi1"], W["xo0"], W["xo1"], rng, flat_near=flat_near)
    n = len(rows) - 1
    mid = len(rows[0]) // 2
    for j in range(n):
        y = y_from + (y_to - y_from) * (j + rng.random()) / n
        for xf, s_ in ((W["xo0"] + 0.4, 1), (W["xi0"] - 0.4, -1)):
            for _ in range(rng.randint(1, 3)):
                k.rock("rammed", xf + s_ * rng.uniform(0, 1.4), y + rng.uniform(-0.8, 0.8), rng.uniform(-0.05, 0.1),
                       rng.uniform(0.25, 0.65), rng)
            for _ in range(rng.randint(2, 4)):
                k.grass_tuft(xf + s_ * rng.uniform(-0.2, 1.8), y + rng.uniform(-0.7, 0.7), 0.0, rng, h=rng.uniform(0.25, 0.5),
                             mat=rng.choice(("grass", "grass_dry")))
        # grass and brush along the top
        a, b = rows[j][mid - 1], rows[j][mid]
        for _ in range(rng.randint(3, 6)):
            p = a.lerp(b, rng.random())
            k.grass_tuft(p.x, p.y + rng.uniform(-0.6, 0.6), p.z - 0.02, rng, h=rng.uniform(0.3, 0.7),
                         mat=rng.choice(("grass", "grass_dry")))


def gate_block(rng):
    g = GB
    h = g["h"]

    def slab(y0, y1, z0=0.0, cap_bottom=False):
        """One battered brick mass: arrises rounded and its long edges gently uneven (no ruled lines); the top
        ring is the bottom ring carried up the batter."""
        xa0, xb0 = face_x(g["xi0"], g["xi1"], z0, h), face_x(g["xo0"], g["xo1"], z0, h)
        ring = k._round_outline([(xa0, y0), (xb0, y0), (xb0, y1), (xa0, y1)], rng, 0.16, 0.03, 1.4)
        bot = [(p.x, p.y, z0) for p in ring]
        top = [(g["xi1"] + (p.x - xa0) * (g["xo1"] - g["xi1"]) / (xb0 - xa0), p.y, h) for p in ring]
        k.prism("brick", True, bot, top, cap_top=False, cap_bottom=cap_bottom)

    slab(g["y0"], g["py0"])
    slab(g["py1"], g["y1"])
    slab(g["py0"], g["py1"], z0=g["ph"], cap_bottom=True)
    # stone plinth course along the foot of both faces and a stone coping over the top
    for y0, y1 in ((g["y0"], g["py0"]), (g["py1"], g["y1"])):
        k.masonry((g["xo0"], y0), (g["xo0"], y1), -0.05, 0.7, 0.3, rng, course=(0.3, 0.42))
        k.masonry((g["xi0"], y0), (g["xi0"], y1), -0.05, 0.7, 0.3, rng, course=(0.3, 0.42))
    # coping: a ring of edge stones overhanging the faces, and the terrace floor inside it
    xa, xb, ya, yb, e = g["xi1"] - 0.14, g["xo1"] + 0.14, g["y0"] - 0.12, g["y1"] + 0.12, 0.6
    for a, b in (((xa, ya + e / 2), (xb, ya + e / 2)), ((xb - e / 2, ya + e), (xb - e / 2, yb - e)),
                 ((xb, yb - e / 2), (xa, yb - e / 2)), ((xa + e / 2, yb - e), (xa + e / 2, ya + e))):
        k.stone_run("stone", True, a, b, h - 0.04, h + 0.12, e, rng, lmin=1.0, lmax=1.8, r=0.06, jz=0.006, ease=0.03,
                    seg=1.2)
    k.soft_box("stone", True, (xa + e - 0.04, ya + e - 0.04, h - 0.04), (xb - e + 0.04, yb - e + 0.04, h + 0.105), rng,
               r=0.06, wob=0.01, seg=3.0, ease=0, tilt=0)
    # a brick string course just under the coping on both faces: a proud line around the top
    for xa, xb in ((g["xo1"] - 0.02, g["xo1"] + 0.1), (g["xi1"] - 0.1, g["xi1"] + 0.02)):
        bx("brick", False, (xa, g["y0"] - 0.06, h - 0.3), (xb, g["y1"] + 0.06, h - 0.12))

    # the passage: paved floor, threshold, timber lining posts with transverse lintels, a board ceiling,
    # two board door leaves swung back against the walls
    y0, y1, ph = g["py0"], g["py1"], g["ph"]
    k.paving(g["xi0"] - 0.2, g["xo0"] + 0.2, y0, y1, 0.06, rng)
    k.stone_run("stone", True, (-19.6, y0), (-19.6, y1), -0.02, 0.14, 0.3, rng, lmin=1.4, lmax=1.8, r=0.05, ease=0.03)
    xs = [-25.35, -23.0, -20.65, -18.3, -15.95, -13.55]
    for x in xs:
        for y in (y0 + 0.15, y1 - 0.15):
            k.post("timber", True, x, y, 0.06, ph - 0.25, 0.28, 0.04)
        k.beam("timber", False, (x, y0, ph - 0.17), (x, y1, ph - 0.17), 0.28, 0.32, 0.04)
    for y in (y0 + 0.15, y1 - 0.15):
        k.beam("timber", False, (xs[0] - 0.2, y, ph - 0.12), (xs[-1] + 0.2, y, ph - 0.12), 0.22, 0.24, 0.03)
    bx("timber", False, (face_x(g["xi0"], g["xi1"], ph, h), y0, ph - 0.04), (face_x(g["xo0"], g["xo1"], ph, h), y1, ph))
    for y, d in ((y0 + 0.08, 1), (y1 - 0.08, -1)):
        for kk in range(7):
            xa = -22.75 + kk * 0.23
            k.board("timber", False, (xa, y + d * 0.05), (xa + 0.22, y + d * 0.05), 0.09, 0.08, 5.0)
        for zz in (0.6, 2.5, 4.4):
            k.beam("timber", False, (-22.7, y + d * 0.13, zz), (-21.2, y + d * 0.13, zz), 0.1, 0.05, 0)
        for zz in (1.2, 1.9, 3.1, 3.8):
            for xx in (-22.5, -22.1, -21.7, -21.3):
                bx("ridge", False, (xx - 0.035, y + d * 0.1 - 0.035, zz - 0.035), (xx + 0.035, y + d * 0.1 + 0.035, zz + 0.035))
    # the small roofed frame over the outer opening, as painted
    zh = 6.05
    xf = face_x(g["xo0"], g["xo1"], zh, h)
    for y in (y0 - 0.45, y1 + 0.45):
        k.beam("timber", False, (xf - 0.2, y, zh), (xf + 0.95, y, zh), 0.16, 0.2, 0.03)
    top = [V((xf - 0.1, y0 - 0.85, zh + 0.85)), V((xf + 1.15, y0 - 0.85, zh + 0.32)),
           V((xf + 1.15, y1 + 0.85, zh + 0.32)), V((xf - 0.1, y1 + 0.85, zh + 0.85))]
    sb.quad("roof", False, *top, uv=[(0, 0), (0, 1.0), (3.6, 1.0), (3.6, 0)])
    sb.quad("timber", False, *[p - V((0, 0, 0.1)) for p in reversed(top)])
    sb.quad("redwood", False, top[1], top[2], top[2] - V((0, 0, 0.12)), top[1] - V((0, 0, 0.12)))
    k.beam("timber", False, (xf + 1.0, y0 - 0.5, zh + 0.18), (xf + 1.0, y1 + 0.5, zh + 0.18), 0.1, 0.12, 0.02)
    k.beam("timber", False, (xf + 1.0, y0 - 0.5, zh - 0.25), (xf + 1.0, y1 + 0.5, zh - 0.25), 0.1, 0.1, 0.02)
    yy = y0 - 0.45
    while yy < y1 + 0.5:
        k.beam("lattice", False, (xf + 1.0, yy, zh - 0.22), (xf + 1.0, yy, zh + 0.15), 0.04, 0.04, 0)
        yy += 0.16


# ---------------------------------------------------------------- tower: podium, hall, roof

HALL_X = [-24.05, -22.55, -21.05, -19.15, -17.65, -16.15]
HALL_Y = [4.8, 6.3, 8.1, 9.6]
FLOOR = 10.0


def podium():
    z0 = GB["h"] + 0.12
    bx("brick", True, (-24.9, 2.4, z0), (-15.3, 11.9, 9.12))
    bx("stone", False, (-25.0, 2.3, 9.08), (-15.2, 12.0, 9.18))
    # bracket row of the balcony level (平座斗拱) carrying the deck
    for (ax, ay), (bxx, byy), out in (((-24.9, 2.4), (-15.3, 2.4), (0, -1)), ((-15.3, 2.4), (-15.3, 11.9), (1, 0)),
                                       ((-15.3, 11.9), (-24.9, 11.9), (0, 1)), ((-24.9, 11.9), (-24.9, 2.4), (-1, 0))):
        L = math.hypot(bxx - ax, byy - ay)
        n = max(2, round(L / 1.6))
        for i in range(n):
            t = (i + 0.5) / n
            k.bracket(ax + (bxx - ax) * t, ay + (byy - ay) * t, 9.18, out, s=0.5)
    bx("deck", True, (-25.4, 1.9, 9.6), (-14.8, 12.4, FLOOR))
    for a, b in (((-25.43, 1.87), (-14.77, 1.87)), ((-14.77, 1.87), (-14.77, 12.43)),
                 ((-14.77, 12.43), (-25.43, 12.43)), ((-25.43, 12.43), (-25.43, 1.87))):
        k.beam("redwood", False, (a[0], a[1], 9.8), (b[0], b[1], 9.8), 0.07, 0.24, 0)
    k.balustrade([(-21.0, 2.02), (-25.28, 2.02), (-25.28, 12.28), (-14.92, 12.28), (-14.92, 2.02), (-19.2, 2.02)], FLOOR)
    # front stair from the gate-block terrace up to the hall's balcony, with sloped railings
    k.stairs(-21.0, -19.2, -2.1, 1.9, z0, FLOOR, 8, mat="stone")
    for x in (-21.05, -19.15):
        for y, z in ((-2.1, z0), (1.9, FLOOR)):
            k.post("redwood", True, x, y, z, z + 1.1, 0.13, 0.02)
        k.beam("redwood", True, (x, -2.1, z0 + 1.0), (x, 1.9, FLOOR + 1.0), 0.09, 0.08, 0.015)
        k.beam("redwood", False, (x, -2.1, z0 + 0.5), (x, 1.9, FLOOR + 0.5), 0.07, 0.06, 0)


def hall(rng):
    top = 13.1
    cols = set()
    for x in HALL_X:
        cols.add((x, HALL_Y[0]))
        cols.add((x, HALL_Y[-1]))
    for y in HALL_Y:
        cols.add((HALL_X[0], y))
        cols.add((HALL_X[-1], y))
    for x, y in cols:
        k.column(x, y, FLOOR, top, r=0.17)
    # architrave and plate along the column tops
    ring = [(HALL_X[0], HALL_Y[0]), (HALL_X[-1], HALL_Y[0]), (HALL_X[-1], HALL_Y[-1]), (HALL_X[0], HALL_Y[-1])]
    for a, b in zip(ring, ring[1:] + ring[:1]):
        k.beam("redwood", False, (a[0], a[1], top - 0.14), (b[0], b[1], top - 0.14), 0.2, 0.28, 0.03)
        k.beam("redwood", False, (a[0], a[1], top + 0.08), (b[0], b[1], top + 0.08), 0.32, 0.14, 0.03)
    # walls between the columns: sill wall, lattice window, plaster above; the door in the front centre bay
    zt = top + 0.02

    def bay(p0, p1, kind):
        if kind == "door":
            k.plank_door(p0, p1, FLOOR, 12.45, ajar=0.85)
            k.board("plaster", False, p0, p1, 0.14, 12.45, top - 0.28)
            return
        if kind == "wall":
            k.board("plaster", True, p0, p1, 0.14, FLOOR, top - 0.28)
            return
        k.board("plaster", True, p0, p1, 0.14, FLOOR, FLOOR + 0.75)
        k.lattice_window(p0, p1, FLOOR + 0.75, 12.45)
        k.board("plaster", True, p0, p1, 0.14, 12.45, top - 0.28)
        t = (V((p1[0], p1[1], 0)) - V((p0[0], p0[1], 0))).normalized()
        n = V((t.y, -t.x, 0)) * 0.07
        k.board("plaster", True, (p0[0] - n.x, p0[1] - n.y), (p1[0] - n.x, p1[1] - n.y), 0.02,
                FLOOR + 0.75, 12.45)  # keeps walkers out; hidden behind the window's dark backing

    r = 0.18
    for i in range(5):
        xa, xb = HALL_X[i] + r, HALL_X[i + 1] - r
        bay((xa, HALL_Y[0]), (xb, HALL_Y[0]), "door" if i == 2 else "window")
        bay((xb, HALL_Y[-1]), (xa, HALL_Y[-1]), "window" if i == 2 else "wall")
    for j in range(3):
        ya, yb = HALL_Y[j] + r, HALL_Y[j + 1] - r
        bay((HALL_X[0], yb), (HALL_X[0], ya), "window")
        bay((HALL_X[-1], ya), (HALL_X[-1], yb), "window")
    # interior: dark walls and ceiling, the drum
    xi0, xi1, yi0, yi1 = HALL_X[0] + 0.1, HALL_X[-1] - 0.1, HALL_Y[0] + 0.12, HALL_Y[-1] - 0.1
    sb.quad("interior", False, (xi0, yi1, FLOOR), (xi1, yi1, FLOOR), (xi1, yi1, top - 0.3), (xi0, yi1, top - 0.3))
    sb.quad("interior", False, (xi0, yi0, FLOOR), (xi0, yi1, FLOOR), (xi0, yi1, top - 0.3), (xi0, yi0, top - 0.3))
    sb.quad("interior", False, (xi1, yi1, FLOOR), (xi1, yi0, FLOOR), (xi1, yi0, top - 0.3), (xi1, yi1, top - 0.3))
    sb.quad("interior", False, (xi0, yi0, top - 0.3), (xi1, yi0, top - 0.3), (xi1, yi1, top - 0.3), (xi0, yi1, top - 0.3))
    k.drum(-20.1, 7.7, FLOOR + 1.3)
    # bracket sets: on every column and one between each pair, reaching out from the walls
    zb = top + 0.15
    sets = []
    for i, x in enumerate(HALL_X):
        sets.append((x, HALL_Y[0], (0, -1)))
        sets.append((x, HALL_Y[-1], (0, 1)))
        if i < 5:
            xm = (x + HALL_X[i + 1]) / 2
            sets.append((xm, HALL_Y[0], (0, -1)))
            sets.append((xm, HALL_Y[-1], (0, 1)))
    for j, y in enumerate(HALL_Y):
        if 0 < j < 3:
            sets.append((HALL_X[0], y, (-1, 0)))
            sets.append((HALL_X[-1], y, (1, 0)))
        if j < 3:
            ym = (y + HALL_Y[j + 1]) / 2
            sets.append((HALL_X[0], ym, (-1, 0)))
            sets.append((HALL_X[-1], ym, (1, 0)))
    for x, y, out in sets:
        corner = x in (HALL_X[0], HALL_X[-1]) and y in (HALL_Y[0], HALL_Y[-1])
        if corner:
            out = ((1 if x == HALL_X[-1] else -1), (1 if y == HALL_Y[-1] else -1))
        k.bracket(x, y, zb, out, s=0.85)
    # eave beam ring carried on the bracket tips
    e = 0.82
    ring2 = [(HALL_X[0] - e, HALL_Y[0] - e), (HALL_X[-1] + e, HALL_Y[0] - e), (HALL_X[-1] + e, HALL_Y[-1] + e),
             (HALL_X[0] - e, HALL_Y[-1] + e)]
    for a, b in zip(ring2, ring2[1:] + ring2[:1]):
        k.beam("redwood", False, (a[0], a[1], zb + 0.62), (b[0], b[1], zb + 0.62), 0.16, 0.2, 0.03)
    k.hip_roof(HALL_X[0] - 1.7, HALL_X[-1] + 1.7, HALL_Y[0] - 1.7, HALL_Y[-1] + 1.7, 14.05, 17.3,
               lift=0.55, ns=16, nt=7, ornament_s=1.3)


def ramp_and_terrace():
    g = GB
    z0 = g["h"] + 0.12
    # terrace railing around the top of the gate block (open on the west where the ramp's landing joins it)
    k.balustrade([(g["xi1"] - 0.1, -1.4), (g["xi1"] - 0.1, g["y1"] - 0.05), (g["xo1"] + 0.1, g["y1"] - 0.05),
                  (g["xo1"] + 0.1, g["y0"] + 0.05), (g["xi1"] - 0.1, g["y0"] + 0.05)], z0, h=0.95, spacing=1.6)
    # the inner ramp (马道): a stair along the inside of the south wing, up to a landing beside the terrace in
    # front of the tower stair
    xr0, xr1 = -28.45, -26.6
    k.stairs(xr0, xr1, -17.5, -5.5, 0.0, z0, 32, mat="stone", fill_mat="rammed")
    bx("brick", True, (xr0, -5.5, 0.0), (-25.0, -1.4, z0 - 0.12))
    k.paving(xr0 - 0.1, -25.0, -5.6, -1.3, z0, random.Random(5), course=(0.6, 0.9), length=(0.7, 1.2), thick=0.12)
    for y, z in ((-17.5, 0.0), (-13.5, 2.67), (-9.5, 5.33), (-5.5, z0)):
        k.post("redwood", True, xr0 + 0.05, y, z, z + 1.05, 0.13, 0.02)
    k.beam("redwood", True, (xr0 + 0.05, -17.5, 0.95), (xr0 + 0.05, -5.5, z0 + 0.95), 0.09, 0.08, 0.015)
    k.beam("redwood", False, (xr0 + 0.05, -17.5, 0.5), (xr0 + 0.05, -5.5, z0 + 0.5), 0.07, 0.06, 0)
    k.balustrade([(xr0 + 0.05, -5.5), (xr0 + 0.05, -1.35), (-25.0, -1.35)], z0, h=0.95, spacing=1.4)


# ---------------------------------------------------------------- tax office, houses, props

def tax_office(rng):
    x0, x1, yf, yb = -36.8, -28.4, 11.1, 15.4
    zt = 0.35
    k.soft_plinth(x0 - 0.45, x1 + 0.45, yf - 0.35, yb + 0.45, zt, rng)
    k.stairs(-34.4, -30.8, yf - 0.85, yf - 0.3, 0, zt, 2, rng=rng)
    top = 3.3
    for x in (-36.6, -33.8, -31.0, -28.6):
        k.column(x, yf, zt, top, r=0.14, mat="timber")
    for x in (x0 + 0.2, x1 - 0.2):
        k.column(x, yb - 0.1, zt, top, r=0.14, mat="timber")
    bx("plaster", True, (x0, yb - 0.1, zt), (x1, yb + 0.1, top))
    for x in (x0, x1):
        bx("plaster", True, (x - 0.07, yf + 0.25, zt), (x + 0.07, yf + 1.5, top))
        bx("plaster", True, (x - 0.07, yf + 2.9, zt), (x + 0.07, yb - 0.1, top))
        bx("plaster", True, (x - 0.07, yf + 1.5, zt), (x + 0.07, yf + 2.9, zt + 0.9))
        bx("plaster", False, (x - 0.07, yf + 1.5, 2.6), (x + 0.07, yf + 2.9, top))
        if x == x0:
            k.lattice_window((x, yf + 2.9), (x, yf + 1.5), zt + 0.9, 2.6)
        else:
            k.lattice_window((x, yf + 1.5), (x, yf + 2.9), zt + 0.9, 2.6)
        k.add("plaster", False, [(x, yf - 0.9, top), (x, yb + 0.9, top), (x, (yf + yb) / 2, 4.95)], [(0, 1, 2)])
    k.beam("timber", True, (x0 - 0.25, yf, top - 0.15), (x1 + 0.25, yf, top - 0.15), 0.2, 0.3, 0.03)
    k.beam("timber", False, (x0 - 0.25, yf, top + 0.25), (x1 + 0.25, yf, top + 0.25), 0.16, 0.2, 0.03)
    for x in (-36.6, -33.8, -31.0, -28.6):
        k.bracket(x, yf, top, (0, -1), s=0.6, mat="timber")
    k.gable_roof(x0, x1, yf - 1.05, yb + 0.95, top + 0.45, 5.15, over=0.6)
    # inside: the official's desk and bench, the big frame scale, shelves and posted notices
    bx("timber", False, (x0 + 0.1, yf + 0.1, zt), (x1 - 0.1, yb - 0.1, zt + 0.03))
    k.table(-32.8, 11.8, -31.2, 12.4, zt)
    bx("timber", True, (-32.6, 12.9, zt), (-31.4, 13.2, zt + 0.45))
    k.frame_scale(-35.4, 13.2, zt)
    for z in (1.1, 1.6, 2.1):
        bx("timber", False, (-30.6, yb - 0.45, z), (-28.8, yb - 0.1, z + 0.04))
    for i, x in enumerate((-35.2, -34.4, -33.5, -32.7)):
        zz = 1.75 + 0.25 * (i % 2)
        sb.quad("cloth_white", False, (x, yb - 0.11, zz), (x + 0.55, yb - 0.11, zz), (x + 0.55, yb - 0.11, zz + 0.8),
                (x, yb - 0.11, zz + 0.8))
    # the carters' cloth bales in front of the office
    for x, y, z, yaw, m in ((-30.4, 9.9, 0, 0.1, "cloth_white"), (-29.3, 9.75, 0, -0.15, "cloth_white"),
                            (-29.85, 9.85, 0.55, 0.05, "cloth_indigo"), (-30.9, 8.9, 0, 1.4, "cloth_white")):
        k.bale(x, y, z, 1.0, 0.65, 0.55, yaw, m)


HOUSE_BOXES = [(-39.4, -33.2, -8.0, 0.6), (-33.4, -28.4, -7.0, -0.9), (-28.6, -24.9, -18.0, -1.2), (-46.5, -39.0, 8.0, 17.0),
               (-45.0, -38.3, 18.6, 25.4), (-36.7, -29.6, 19.0, 26.0), (-46.0, -38.6, -8.0, 0.6)]


def yards(h):
    """Courtyard walls behind the tax office and between the houses on the north side."""
    k.yard_wall([(-37.4, 16.6), (-28.4, 16.6), (-28.4, 19.4)], h)
    k.yard_wall([(-38.9, 16.6), (-38.9, 19.0)], h, h=1.9)
    k.yard_wall([(-29.2, 26.2), (-26.9, 26.2)], h, h=1.9)


def houses(rng):
    # south side of the street, fronts facing north (yaw 180: the local front at y = 0 faces +Y)
    with k.placed(k.frame(-33.7, -1.5, 0, 180)):
        k.house(5.0, 5.6, rng, bays=3, door_bays=(1,), awning=True)
    with k.placed(k.frame(-28.9, -1.5, 0, 180)):
        k.house(4.2, 5.0, rng, bays=2, door_bays=(0,), rise=1.3)
    # west edge, north side, fronts facing south
    with k.placed(k.frame(-46.0, 11.0, 0, 0)):
        k.house(6.4, 5.5, rng, bays=3, door_bays=(0, 2), awning=True)
    with k.placed(k.frame(-44.5, 19.5, 0, 0)):
        k.house(5.8, 5.4, rng, bays=3, door_bays=(1,), rise=1.6)
    with k.placed(k.frame(-36.2, 20.0, 0, 0)):
        k.house(6.2, 5.6, rng, bays=3, door_bays=(1,), rise=1.55)
    with k.placed(k.frame(-39.0, -1.5, 0, 180)):
        k.house(6.6, 5.8, rng, bays=4, door_bays=(1, 2), awning=True, rise=1.6)
    # jars and baskets by the fronts
    for x, y in ((-38.0, -0.6), (-37.4, -0.4), (-34.4, -0.5), (-32.3, -0.5), (-45.5, 8.0), (-40.0, 8.2), (-43.5, 18.6)):
        (sb.jar if rng.random() < 0.6 else sb.basket)(x + rng.uniform(-0.2, 0.2), y, 0.0, rng)


def dress_ground(rng, h, road):
    """Grass tufts and stones over the open ground: thicker at the edges of things, none on the road or in the
    moat; a few stones along the road's verge."""
    placed = 0
    tries = 0
    while placed < 520 and tries < 6000:
        tries += 1
        x, y = rng.uniform(-46, 28), rng.uniform(-19, 38)
        if -27.3 < x < -11.7 or 0 <= x <= 14:
            continue  # under the wall, in the moat
        if -37.5 < x < -27.8 and 10.3 < y < 16.4:
            continue  # tax office
        dr = road_dist(x, y, road)
        if dr < 2.2:
            continue
        if any(x0 < x < x1 and y0 < y < y1 for x0, x1, y0, y1 in HOUSE_BOXES):
            continue
        z = h(x, y)
        if rng.random() < 0.22:
            k.rock("stone", x, y, z - 0.03, rng.uniform(0.06, 0.2), rng)
        else:
            k.grass_tuft(x, y, z - 0.01, rng, h=rng.uniform(0.15, 0.4), mat=rng.choice(("grass", "grass_dry", "grass_dry")))
        placed += 1
    for _ in range(60):
        x, y = rng.uniform(-46, 28), rng.uniform(-16, 38)
        if 0 <= x <= 14 or -27.3 < x < -11.7:
            continue
        dr = road_dist(x, y, road)
        if 2.2 < dr < 3.4:
            k.rock("stone", x, y, h(x, y) - 0.03, rng.uniform(0.08, 0.22), rng)


def colliders(trees):
    for x0, x1 in ((-0.15, 0), (14, 14.15)):
        bx("hidden", True, (x0, -19, -0.2), (x1, 0, 1.2))
        bx("hidden", True, (x0, 8, -0.2), (x1, 38, 1.2))
    bx("hidden", True, (-46.1, -19, 0), (-46, 38, 3))
    bx("hidden", True, (28, -19, 0), (28.1, 38, 3))
    bx("hidden", True, (-46, -19.1, 0), (28, -19, 3))
    bx("hidden", True, (-46, 38, 0), (28, 38.1, 3))
    for x, d, s in trees:
        sb.cyl("hidden", True, (x, d, 0), (x + 0.15 * s, d + 0.1 * s, 2.5 * s), 0.35 * s, segs=8)


# ---------------------------------------------------------------- build / export

def build(scene, seed=11):
    sb.B = sb.Buckets()
    rng = random.Random(seed)
    layout = json.load(open(SCENE_JSON, encoding="utf-8"))
    h = ground(rng, layout["road"])
    bridge(rng)
    wing(-16.0, GB["y0"], rng)
    wing(GB["y1"], 38.0, rng, flat_near=GB["y1"])
    dress_ground(rng, h, layout["road"])
    gate_block(rng)
    podium()
    hall(rng)
    ramp_and_terrace()
    tax_office(rng)
    houses(rng)
    yards(h)
    colliders(layout["trees"])

    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0 and me.name.startswith("gate__"):
            bpy.data.meshes.remove(me)

    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("gate__" + name)
        me.from_pydata([tuple(v) for v in b["v"]], [], b["f"])
        me.validate()
        tile = sb.MATERIALS[mat_name][1]
        uvl = me.uv_layers.new(name="UVMap")
        for poly, explicit in zip(me.polygons, b["uv"]):
            for kk, li in enumerate(poly.loop_indices):
                if explicit:
                    uvl.data[li].uv = explicit[kk]
                else:
                    uvl.data[li].uv = sb.box_uv(me.vertices[me.loops[li].vertex_index].co, poly.normal, tile)
        me.materials.append(sb.make_material(mat_name))
        # smooth shading, sharp only at creases over 35 deg: wavy edges and curved roofs read as curves, not
        # facets, while chamfers, ledges and box corners keep their ink
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new("g_" + name, me)
        coll.objects.link(ob)
        stats[name] = sum(len(p.vertices) - 2 for p in me.polygons)
    # the ground: one smooth mesh, UVMap = world position / tile, Blend.x = how bare
    me = bpy.data.meshes.new("gate__ground__col")
    me.from_pydata([tuple(v) for v in GROUND["verts"]], [], GROUND["faces"])
    me.validate()
    tile = sb.MATERIALS["ground"][1]
    uv0, uv1 = me.uv_layers.new(name="UVMap"), me.uv_layers.new(name="Blend")
    for li, lp in enumerate(me.loops):
        co = GROUND["verts"][lp.vertex_index]
        uv0.data[li].uv = (co.x / tile, co.y / tile)
        uv1.data[li].uv = (GROUND["bare"][lp.vertex_index], 0.0)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.materials.append(sb.make_material("ground"))
    ob = bpy.data.objects.new("g_ground__col", me)
    coll.objects.link(ob)
    stats["ground__col"] = 2 * len(me.polygons)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "buckets": stats}


def export(scene, path):
    """Write the raw GLB. Swaps window.scene for the call: use_active_scene exports the window's scene, and the
    .blend also holds other scenes (incl. third-party study files) that must never ship."""
    win = bpy.context.window
    prev = win.scene
    win.scene = scene
    try:
        coll = bpy.data.collections[COLL]
        for o in scene.objects:
            o.select_set(o.name in coll.objects)
        bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_active_scene=True, use_selection=True,
                                  export_apply=True, export_cameras=False, export_yup=True, export_animations=False)
    finally:
        win.scene = prev
    return path
