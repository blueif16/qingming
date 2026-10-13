"""Inner city section (S6), walkable web scene, composed from the Song construction kit (blender/song_kit.py), the
inner-city kit (blender/kit_inner_city.py) and the workshop's vehicle kit (blender/kit_vehicles.py).

build(scene) creates collection "inner_city_scene": one mesh per (material, collide) bucket, named
"g_<material>__col" / "g_<material>__nocol" (the page collides with every "__col" mesh; "hidden__col" is
collider-only). export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships it.
Built headless: qingming/tools/build_scene.sh inner_city (never in the live GUI, which is the lead's).

Positions come from the scroll map (qingming/map/README.md) through sections/inner_city/layout.json
(tools/map_layout.mjs): X along the street (east = toward the gate), Y depth (north), Z up, in the one world frame
shared with the gate (origin at S5's moat bridge). derive() reads every structure's place and street-level size from
the layout by map ID. What the strokes can't give (a hidden back wall, an upper floor's set-back, a roof's rise) is a
builder choice, marked "choice:" where it is made and listed in sections/inner_city/notes.md.

Loyalty (map/BUILDING.md): one map entity, one model. Every piece of geometry is built inside
`sb.entity(<map id>)`; the bucket set is strict, so untagged geometry is an error. build() writes
sections/inner_city/placed.json (triangles per map ID) for tools/loyalty_check.mjs. Where the scroll paints nothing
the scene has no models: invisible edge walls close the walkable area, and the page paints what lies beyond.
"""
import json
import math
import random
import zlib

import bpy
from mathutils import Vector

import song_kit as k
import street_b1 as sb
import kit_inner_city as ki
import kit_vehicles as kv
from song_kit import V, bx

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
LAYOUT_JSON = QM + r"\sections\inner_city\layout.json"
PLACED_JSON = QM + r"\sections\inner_city\placed.json"
SEATS_JSON = QM + r"\gen\sections\inner_city\seats.json"   # the drivers' seats the vehicle kit returns (make_people reads it)
# seats fitted under seated figures (details pass, fix-inner; gen/details/contacts/fix_inner/tools/fig_seats.mjs): a stool
# owned by the figure where its seat is hidden or unpainted (map/BUILDING.md rule 3), or a mapped seat's fitted height
FIG_SEATS_JSON = QM + r"\gen\sections\inner_city\fig_seats.json"
COLL = "inner_city_scene"
UP = V((0, 0, 1))

LAYOUT = {}
E = {}
WALK = []
EXTENT = {}
PROPS = {}
# Real size everywhere (the user, 2026-10-12: "everything will have a realistic relative size... we just want positions
# to be our relative positions"): positions and footprints come from the map; heights, storeys, openings and the
# sizes of things are real. Painted props are drawn at the figures' 1.3x, so a painted size is used / 1.3 (px / 100);
# the far row at the top of the silk is painted at about 0.6 of the street's scale, so its heights are real choices.
ZD_FLOOR = 4.5      # zhengdian upper floor (map/frames/S6.json supports)
INN_FLOOR = 3.4     # inn upper floor (map/frames/S6.json supports)


def fp(eid):
    return [tuple(p) for p in E[eid]["footprint"]]


def dx_at(u):
    """The frame's receding direction at scan u (map/frames/S6.json dx_knots: linear between, constant beyond)."""
    kn = LAYOUT["frames"][0]["dx_knots"]
    if u <= kn[0][0]:
        return kn[0][1]
    for (u0, d0), (u1, d1) in zip(kn, kn[1:]):
        if u <= u1:
            return d0 + (d1 - d0) * (u - u0) / (u1 - u0)
    return kn[-1][1]


def ux(u, D):
    """World X of scan u on the ground line at depth D (for members read along a painted front)."""
    o = LAYOUT["frames"][0]["origin"]
    return (u - o[0] - dx_at(u) * D) / 77.0


def zv(v, v_foot):
    """Height above a foot at v_foot of a point at v straight above it (77 px per metre)."""
    return (v_foot - v) / 77.0


def derive(L):
    E.clear()
    E.update(L["entities"])
    # a recorded move (build_choices.json) is already applied to the entity's pos, pts, footprint and bays in
    # layout.json (tools/map_layout.mjs)
    PROPS.clear()
    for eid, e in E.items():
        if e["kind"] == "prop":
            PROPS[eid] = e
    # the walkable area: the painted area (the seams and the silk's edges, layout painted_area)
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    xs = [p[0] for p in (sw, se, ne, nw)]
    # 10 m past the outer edges (west, north, south) so the mist (full 9 m out) covers the ground's end (lead, 2026-10-12)
    EXTENT.update(x0=math.floor(min(xs)) - 16, x1=math.ceil(max(xs)) + 4, y0=-21, y1=47)


# ---------------------------------------------------------------- ground

def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def poly_dist(x, y, line):
    best = 1e9
    for (ax, ay), (bx_, by) in zip(line, line[1:]):
        dx, dy = bx_ - ax, by - ay
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - t * dx, y - ay - t * dy))
    return best


GROUND = {}


def ground(rng, roads):
    """Heightfield over the section: low undulation, the streets slightly worn down. One smooth mesh; each vertex
    carries how bare (trodden) it is in a second UV map, and the page blends the ground and road washes along a noisy
    edge (web/src/surface.js). The ground is the painted surface, not a model (owner "ground"). roads: [(line, half
    width of the trodden band)]."""
    X0, X1, Y0, Y1 = EXTENT["x0"], EXTENT["x1"], EXTENT["y0"], EXTENT["y1"]
    ph = [rng.uniform(0, 6.283) for _ in range(6)]

    def h(x, y):
        z = (0.03 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.02 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.012 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = min(poly_dist(x, y, ln) / hw for ln, hw in roads)
        if dr < 1.0:
            z = z * (0.4 + 0.6 * dr) - 0.03 * (1 - dr)
        return z

    def bare(x, y):
        wob = 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5]) + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1])
        return max(1 - _smooth(hw * 0.55, hw * 1.05, poly_dist(x, y, ln) + wob) for ln, hw in roads)

    # the ground stops at the S5 seam (0.5 m past it, dipping 0.12 m toward it, so the gate's own ground lies on top
    # where the two meet); on the silk's edges (north, south) it runs 16 m past the painted area, deep enough under the
    # mist that you never see it end (the mist is full 9 m out and thins within 14 m of the viewer)
    (sw, se, ne, nw) = LAYOUT["painted_area"]["corners"]

    def x_on(a, b, y):
        return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])

    def hz(x, y):
        d = x_on(se, ne, y) - x
        return h(x, y) - 0.12 * (1 - _smooth(-0.5, 1.5, d))

    # the S7 seam (u 2000, the west side, joined 2026-10-12): S7 (city_end) is built, so this ground stops 0.5 m past
    # the seam on a clean line, the way S7's own ground stops 0.5 m past it (no 1 m stair-steps): every cell that
    # reaches east of the cut is kept, every vertex west of it moves east onto it, and the triangles that collapse are
    # dropped. S7's ground dips 0.12 m toward the seam, so this one lies on top where the two meet: measured on the
    # built grounds, S7's stays under this one everywhere up to 0.6 m past the seam; at 16 m past, as before the join,
    # the two poked through each other in patches (sections/inner_city/notes.md, "Joined with S7")
    def cut_w(y):
        return x_on(sw, nw, y) - 0.5

    nx, ny = X1 - X0, Y1 - Y0
    verts = [V((X0 + i, Y0 + j, 0.0)) for j in range(ny + 1) for i in range(nx + 1)]
    for v in verts:
        v.x = max(v.x, cut_w(v.y))
        v.z = hz(v.x, v.y)
    faces = []
    for j in range(ny):
        for i in range(nx):
            cy0, cy1 = Y0 + j, Y0 + j + 1
            cx, cy = X0 + i + 0.5, Y0 + j + 0.5
            if not (X0 + i + 1 > min(cut_w(cy0), cut_w(cy1)) + 1e-6 and cx < x_on(se, ne, cy) + 0.5):
                continue
            a, b = j * (nx + 1) + i, j * (nx + 1) + i + 1
            c, d = (j + 1) * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i
            for t in ((a, b, c), (a, c, d)):
                p, q, r = (verts[x] for x in t)
                if ((q - p).cross(r - p)).length > 1e-4:
                    faces.append(t)
    used = sorted({v for f in faces for v in f})
    remap = {v: n for n, v in enumerate(used)}
    verts = [verts[v] for v in used]
    faces = [tuple(remap[v] for v in f) for f in faces]
    GROUND.update(verts=verts, faces=faces, bare=[bare(v.x, v.y) for v in verts])
    return hz


# ---------------------------------------------------------------- 孙羊正店 and its 彩楼欢门

def zhengdian(rng):
    """孙羊正店 (S6.bld.sunyang_zhengdian), two storeys. Ground floor: an open street front on the painted columns
    under a pent roof (腰檐) that rises to the upper floor; plaster side and back walls, a dark interior. Upper
    storey (the drinking floor): a floor at ZD_FLOOR set back behind a gallery and balustrade, lattice windows with
    open bays (and the open east room where two men sit at a table), under a big hip-gable roof.
    choice: the upper floor's set-back 1.8 m and height 4.5 m (map/frames/S6.json, 'zhengdian upper floor'); the
    upper eave 7.2 m and ridge 10.4 m (real storeys; the painted roof is short); the gallery 1.1 m deep; the
    building ends at the wine depot's west wall (X -47.1; its mapped east end overlapped the depot by 0.3 m), and so
    does the upper storey: painted, the upper storey's east room runs on over the depot to u ~5700, but the gate's
    builder makes the depot 4 m deep, so its roof fills that space (reported); the room's table and two men shift 0.9 m
    west with it (build_choices.json moves, people.json nudges)."""
    sw, se, ne, nw = fp("S6.bld.sunyang_zhengdian")
    y0, y1 = sw[1], nw[1] - 0.1
    xw0, xw1 = sw[0], nw[0]                     # the west wall runs back from sw to nw
    xe = -47.1                                  # choice: the depot's west wall (S5.bld.wine_depot sw -47.02)
    cols = sorted(b[0] for b in E["S6.bld.sunyang_zhengdian"]["bays"])
    ze = (E["S6.bld.sunyang_zhengdian"]["heights"]["sw_eave"] + E["S6.bld.sunyang_zhengdian"]["heights"]["se_eave"]) / 2
    with sb.entity("S6.bld.sunyang_zhengdian"):
        # ground floor: a low stone sill along the front, the painted columns (the west one is the 彩楼's lashed
        # pole), side and back walls, a dark interior
        k.stone_run("stone", True, (xw0 + 0.2, y0 + 0.15), (xe - 0.1, y0 + 0.15), -0.06, 0.1, 0.36, rng, lmin=0.9, lmax=1.6, r=0.04)
        for x in cols[1:]:
            k.column(x, y0 + 0.15, 0.1, ze - 0.2, r=0.12, mat="timber")
        k.beam("timber", True, (xw0 - 0.1, y0 + 0.15, ze - 0.28), (xe + 0.05, y0 + 0.15, ze - 0.28), 0.18, 0.24, 0.03)
        k.beam("redwood", False, (xw0 - 0.1, y0 + 0.1, ze - 0.52), (xe + 0.05, y0 + 0.1, ze - 0.52), 0.06, 0.14, 0.01)
        yg = y0 + 1.8           # choice: the upper storey's front (gallery edge) 1.8 m behind the street front
        xwg = xw0 + (xw1 - xw0) * (yg - y0) / (y1 - y0)
        k.board("plaster", True, (xw0, y0 + 0.4), (xwg, yg), 0.16, 0.0, ze)          # under the pent roof
        k.board("plaster", True, (xwg, yg), (xw1, y1), 0.16, 0.0, ZD_FLOOR + 2.7)    # up to the upper eave
        k.board("plaster", True, (xe, y0 + 0.4), (xe, y1), 0.16, 0.0, ze)
        k.board("plaster", True, (xw1, y1), (xe, y1), 0.16, 0.0, ZD_FLOOR + 2.2)
        # the dark back of the front room: a wall (the walker stops at it), the room behind it is not painted
        k.board("interior", True, (xe - 0.2, y0 + 3.6), (xw0 + 0.2, y0 + 3.6), 0.1, 0.0, ze - 0.2)
        k.bx("deck", True, (xw0 + 0.1, y0 + 0.3, 0.0), (xe - 0.1, y0 + 3.6, 0.06))
        # the doors behind the lamp-boxes: two openings in the dark back of the front room, framed
        for xa, xb in ((cols[1] + 0.25, cols[2] + 0.9), (ux(5190, y0) + 0.0, ux(5280, y0))):
            k.plank_door((xa, y0 + 3.55), (xb, y0 + 3.55), 0.06, 2.25, ajar=0.9)
        # the pent roof from the ground-floor eave up to the gallery's floor
        ki.lean_to(xw0 - 0.55, xe + 0.05, y0 - 0.55, yg + 0.05, ze - 0.05, ZD_FLOOR - 0.12, ns=12, nt=3)   # choice: 0.55 m eave
        # upper storey: floor (people stand on it), gallery balustrade, window wall with open bays, the east room
        xu1 = xe                # choice: ends at the depot's west wall (see the docstring)
        ki.floor_slab(xw0 - 0.1, xu1, yg - 0.05, y1, ZD_FLOOR, rng, strip=0)   # seen only from below: a plain slab
        k.balustrade([(xw0 - 0.05, yg + 0.06), (xu1 - 0.05, yg + 0.06)], ZD_FLOOR, h=0.78, spacing=1.6)
        zw = ZD_FLOOR + 2.7     # choice: upper eave 7.2 m (a real storey over the 4.5 m floor)
        ycol = [yg + 0.06, y1 - 0.1]
        xs = [xw0] + [x for x in (ux(4570, yg), ux(4800, yg), ux(4900, yg), ux(5050, yg), ux(5300, yg)) if xw0 + 0.6 < x < xu1 - 0.6] + [xu1]
        for x in xs:
            k.column(x, ycol[0], ZD_FLOOR, zw, r=0.11, mat="redwood", base=False)
            k.column(x, ycol[1], ZD_FLOOR, zw, r=0.11, mat="redwood", base=False)
        yw = yg + 1.15          # choice: the window wall 1.1 m behind the balustrade (the gallery where 4810 and 5140 sit)
        x_room = ux(5300, yg)   # the open east room (painted 5300-5650)
        ki.wall_bays((xw0 + 0.1, yw), (x_room, yw), ZD_FLOOR, zw - 0.15,
                     [0, 0.12, 0.3, 0.5, 0.72, 1.0], ["window", "open", "window", "window", "window"], rng, mat="plaster", sill=0.7)
        k.beam("redwood", True, (xw0 - 0.2, ycol[0], zw - 0.12), (xu1 + 0.2, ycol[0], zw - 0.12), 0.16, 0.22, 0.03)
        for x in xs[::2]:
            k.bracket(x, ycol[0], zw, (0, -1), s=0.55)
        sb.quad("interior", False, (xu1, y1 - 0.2, ZD_FLOOR), (xw0 + 0.2, y1 - 0.2, ZD_FLOOR), (xw0 + 0.2, y1 - 0.2, zw), (xu1, y1 - 0.2, zw))
        k.board("plaster", True, (xu1, yg + 0.3), (xu1, y1), 0.14, ZD_FLOOR, zw)
        ki.xieshan_roof(xw0 - 1.0, xu1 + 0.9, yg - 0.9, y1 + 0.8, zw + 0.25, zw + 3.2, along="x", ornament_s=1.1,
                        lift=0.5, ns=14, nt=6)


def u2x(u, D=12.9):
    return ux(u, D)


def cailou(rng):
    """The 彩楼欢门 (S6.str.cailou_huanmen_4430): poles, beams, V-braces, flowers, streamers and lanterns at their
    painted u along the 正店's front (D 12.9), heights from the painted v above the front's foot (v 905)."""
    sw, se, ne, nw = fp("S6.str.cailou_huanmen_4430")
    # choice: the gateway stands 0.7 m in front of its estimated foot line (the 正店's columns), clear of the pent
    # roof's eave, as painted (its poles rise in front of the ground-floor eave); its V-band hangs 0.3 m further out
    y = (sw[1] + nw[1]) / 2 - 0.7
    yv = y - 0.3
    vf = 905
    poles = [(4441, 175, 0.1), (4460, 185, 0.07), (4495, 180, 0.07), (4530, 190, 0.07), (4890, 215, 0.07),
             (5000, 215, 0.07), (5297, 170, 0.09), (5347, 680, 0.05)]
    P = [(u2x(u, y), y + (0.0 if i % 2 else 0.12), zv(v, vf), r) for i, (u, v, r) in enumerate(poles)]
    zt, zl = zv(440, vf), zv(705, vf)
    beams = [((P[0][0], y, zt), (P[6][0], y, zt)), ((P[0][0], y + 0.05, zl), (P[6][0], y + 0.05, zl)),
             ((P[0][0], y, zv(600, vf)), (u2x(4600, y), y, zv(600, vf))), ((u2x(5170, y), y, zv(600, vf)), (P[6][0], y, zv(600, vf)))]
    braces = [((u2x(4600, y), yv, zv(600, vf)), (u2x(4800, y), yv, zv(690, vf))),
              ((u2x(5170, y), yv, zv(600, vf)), (u2x(4980, y), yv, zv(690, vf))),
              ((u2x(4800, y), yv, zv(690, vf)), (u2x(4980, y), yv, zv(690, vf))),
              # the east side's bars running back to the upper storey
              ((P[6][0], y, zv(488, vf)), (P[6][0] - 0.15, y + 2.3, zv(400, vf)))]
    flowers = [(px, py, pz - 0.15, 1.1) for px, py, pz, r in P[1:7]]
    n = 7
    for i in range(n):
        x = P[0][0] + (P[6][0] - P[0][0]) * (i + 0.5) / n
        flowers.append((x, y - 0.05, zt - 0.1, 0.8))
    for (p, q) in braces[:3]:
        for t in (0.25, 0.5, 0.75):
            a = V(p).lerp(V(q), t)
            flowers.append((a.x, a.y - 0.05, a.z, 0.7))
    streamers = [(P[0][0] + (P[6][0] - P[0][0]) * (i + 0.3) / 7, y - 0.08, zt - 0.2, rng.uniform(0.9, 1.6)) for i in range(7)]
    lanterns = [(u2x(4655, y), y - 0.25, zv(735, vf), "round", (u2x(4652, y), y - 0.25)),
                (u2x(5105, y), y - 0.25, zv(745, vf), "round", (u2x(5080, y), y - 0.25)),
                (u2x(4845, y), yv - 0.05, zv(655, vf), "round", None),
                (u2x(4525, y), y - 0.2, zv(725, vf), "cube", None)]
    with sb.entity("S6.str.cailou_huanmen_4430"):
        ki.cailou(P, beams, braces, rng, flowers=flowers, lanterns=lanterns, streamers=streamers,
                  lattice=((P[3][0], y), (P[4][0], y), zv(520, vf), zv(600, vf)))


def railings(rng):
    for eid in ("S6.str.railing_4412", "S6.str.railing_4610", "S6.str.railing_5190"):
        line = E[eid]["lines"]["line"]
        with sb.entity(eid):
            # choice: 1.15 m (painted 115 px = 1.15 m at the figures' 1.3x)
            ki.slat_fence(line[0], line[-1], 1.15, rng, slat=0.07)   # painted slats 6-8 px apart


# ---------------------------------------------------------------- the crossroads shops

def corner_shop(rng):
    """The corner shop at the crossroads (S6.bld.corner_shop_3725), where the pork is sold and the storyteller holds
    his crowd: an open front on the painted posts, a lattice frieze under the front eave, plaster walls along the
    cross street with lattice windows, a long hall under a hip-gable roof whose ridge runs back (north) and whose
    small gable faces the main street. choice: ridge 6.3 m; window bays along the west wall (its foot is hidden)."""
    sw, se, ne, nw = fp("S6.bld.corner_shop_3725")
    h = E["S6.bld.corner_shop_3725"]["heights"]
    ze = h["sw_eave"]
    yf = (sw[1] + se[1]) / 2
    cols = sorted(b[0] for b in E["S6.bld.corner_shop_3725"]["bays"]) + [sw[0]]
    cols = sorted(set(round(c, 2) for c in cols))
    with sb.entity("S6.bld.corner_shop_3725"):
        k.soft_plinth(sw[0] - 0.2, se[0] + 0.15, yf - 0.25, nw[1] + 0.1, 0.18, rng, edge=0.36)
        for x in cols:
            k.column(x, yf, 0.18, ze - 0.45, r=0.12, mat="timber")
        k.beam("timber", True, (sw[0] - 0.2, yf, ze - 0.55), (se[0] + 0.2, yf, ze - 0.55), 0.18, 0.24, 0.03)
        for xa, xb in zip(cols, cols[1:]):
            k.lattice_window((xa + 0.12, yf - 0.02), (xb - 0.12, yf - 0.02), ze - 1.05, ze - 0.62, out=0.02)
        # side walls: the west one along the cross street with three lattice windows, the east one plain
        ki.wall_bays((nw[0], nw[1]), (sw[0], yf + 0.35), 0.18, ze - 0.3, [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                     ["wall", "window", "wall", "window", "wall"], rng, sill=0.9)
        k.board("plaster", True, (se[0], yf + 0.35), (ne[0], ne[1]), 0.16, 0.18, ze - 0.3)
        k.board("plaster", True, (nw[0], nw[1]), (ne[0], ne[1]), 0.16, 0.18, ze - 0.3)
        sb.quad("interior", False, (se[0] - 0.15, yf + 2.4, 0.2), (sw[0] + 0.15, yf + 2.4, 0.2), (sw[0] + 0.15, yf + 2.4, ze - 0.6),
                (se[0] - 0.15, yf + 2.4, ze - 0.6))
        x0, x1 = min(sw[0], nw[0]) - 0.75, max(se[0], ne[0]) + 0.7
        ki.xieshan_roof(x0, x1, yf - 0.9, nw[1] + 0.7, ze, 6.3, along="y", ornament_s=0.9, lift=0.55, ns=12, nt=5)
        # the small sign hung under the eave by the west post (□□□□, not legible on the scan)
        ki.signboard((cols[0] + 0.25, yf - 0.12), (cols[0] + 0.62, yf - 0.12), ze - 1.6, ze - 0.85, "stele_5129", rng,
                     posts=False, top="flat")


def butcher_shop(rng):
    """The building east of the corner shop with the 孫羊店 flag before it (S6.bld.butcher_shop_sun): a tiled front
    roof (ridge along the street), a lattice frieze and a dark valance under the eave, a pale wall panel at its west
    end, an open front hung with pale cloth panels. choice: 3.0 m deep as mapped; ridge 5.6 m."""
    sw, se, ne, nw = fp("S6.bld.butcher_shop_sun")
    ze = E["S6.bld.butcher_shop_sun"]["heights"]["se_eave"]
    yf = (sw[1] + se[1]) / 2
    yb = (nw[1] + ne[1]) / 2
    with sb.entity("S6.bld.butcher_shop_sun"):
        k.soft_plinth(sw[0] - 0.1, se[0] + 0.1, yf - 0.2, yb + 0.1, 0.16, rng, edge=0.34)
        xs = [sw[0] + 0.15, sw[0] + 1.25, se[0] - 1.1, se[0] - 0.15]
        for x in xs:
            k.column(x, yf, 0.16, ze - 0.35, r=0.11, mat="timber")
        k.beam("timber", True, (sw[0] - 0.2, yf, ze - 0.45), (se[0] + 0.2, yf, ze - 0.45), 0.18, 0.22, 0.03)
        for xa, xb in zip(xs, xs[1:]):
            k.lattice_window((xa + 0.1, yf - 0.02), (xb - 0.1, yf - 0.02), ze - 0.95, ze - 0.55, out=0.02)
            ki.quad2("interior", V((xa + 0.1, yf - 0.06, ze - 1.3)), V((xb - 0.1, yf - 0.06, ze - 1.3)),
                     V((xb - 0.1, yf - 0.06, ze - 0.95)), V((xa + 0.1, yf - 0.06, ze - 0.95)))
        # pale cloth panels hung in the open front, and the pale wall panel at the west end
        for xa, xb in ((xs[1] + 0.15, xs[1] + 0.95), (xs[2] - 0.9, xs[2] - 0.1)):
            ki.quad2("cloth_white", V((xa, yf + 0.25, 0.9)), V((xb, yf + 0.25, 0.9)), V((xb, yf + 0.25, ze - 1.3)), V((xa, yf + 0.25, ze - 1.3)))
        k.board("plaster", True, (sw[0] + 0.15, yf + 0.05), (sw[0] + 1.15, yf + 0.05), 0.12, 0.16, ze - 1.3)
        k.board("plaster", True, (nw[0], yb), (ne[0], yb), 0.16, 0.16, ze - 0.3)
        k.board("plaster", True, (se[0], yf + 0.3), (ne[0], yb), 0.16, 0.16, ze - 0.3)
        k.board("plaster", True, (sw[0], yf + 0.3), (nw[0], yb), 0.16, 0.16, ze - 0.3)
        sb.quad("interior", False, (se[0] - 0.2, yb - 0.2, 0.17), (sw[0] + 0.2, yb - 0.2, 0.17), (sw[0] + 0.2, yb - 0.2, ze - 0.5),
                (se[0] - 0.2, yb - 0.2, ze - 0.5))
        k.gable_roof(sw[0] - 0.1, se[0] + 0.1, yf - 0.7, yb + 0.6, ze, 5.6, over=0.35)


# ---------------------------------------------------------------- the incense compound and the house at the well

def gable_y(x0, x1, y0, y1, z_eave, z_ridge, over=0.5, **kw):
    """A gable roof whose ridge runs north-south (song_kit.gable_roof turned 90 degrees)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    with k.placed(k.frame(cx, cy, 0, 90)):
        k.gable_roof(y0 - cy, y1 - cy, -(x1 - cx), -(x0 - cx), z_eave, z_ridge, over=over, **kw)


def incense_shop(rng):
    """刘家 incense shop (S6.bld.incense_shop_liu), the east range of the compound: a long hall along the cross
    street, its gable roof's ridge running north (painted: ridge 2 m above the eave, half-width 4 m on the east);
    plaster west, south and north walls; the open shop front on posts along its east side, with a lattice fascia
    board under the eave and a shelf frame inside; a dark matted lean-to roof along that side over the tables at its
    north-east corner. choice: wall feet 240 px below the eave (as mapped); the lean-to 1.9 m deep, 2.4 m at its outer
    posts; front posts every 1.4 m."""
    sw, se, ne, nw = fp("S6.bld.incense_shop_liu")
    ze = E["S6.bld.incense_shop_liu"]["heights"]["se_eave"]
    xe0, xe1 = se[0], ne[0]       # the east wall runs from se to ne
    with sb.entity("S6.bld.incense_shop_liu"):
        k.soft_plinth(sw[0] - 0.1, max(se[0], ne[0]) + 0.1, sw[1] - 0.1, nw[1] + 0.1, 0.15, rng, edge=0.32)
        n = max(3, int((ne[1] - se[1]) / 1.4))
        for i in range(n + 1):
            t = i / n
            x, y = xe0 + (xe1 - xe0) * t, se[1] + (ne[1] - se[1]) * t
            k.column(x, y, 0.15, ze - 0.3, r=0.11, mat="timber")
        k.beam("timber", True, (xe0, se[1] - 0.2, ze - 0.4), (xe1, ne[1] + 0.2, ze - 0.4), 0.18, 0.22, 0.03)
        # the lattice fascia board near the south end (its two or three characters are not legible)
        sb.quad("signs_inner_city", False, (xe0 + 0.11, se[1] + 0.5, ze - 0.75), (xe0 + 0.11, se[1] + 2.4, ze - 0.75),
                (xe0 + 0.11, se[1] + 2.4, ze - 0.45), (xe0 + 0.11, se[1] + 0.5, ze - 0.45), uv=ki.cell_uv("fascia"))
        for a, b in (((sw[0], sw[1]), (se[0] - 0.1, se[1])), ((nw[0], nw[1]), (sw[0], sw[1])), ((ne[0] - 0.1, ne[1]), (nw[0], nw[1]))):
            k.board("plaster", True, a, b, 0.18, 0.15, ze - 0.2)
        k.plank_door((sw[0] + 2.4, sw[1] - 0.05), (sw[0] + 3.6, sw[1] - 0.05), 0.15, 2.2, ajar=0.2)
        # inside the open front: a dark back, a shelf frame of goods
        xb = xe0 - 2.4
        k.board("interior", True, (xb, se[1] + 0.3), (xb, ne[1] - 0.3), 0.1, 0.15, ze - 0.4)   # the walker stops at the dark back
        for z in (0.9, 1.5, 2.1):
            k.beam("timber", False, (xb + 0.3, se[1] + 1.0, z), (xb + 0.3, ne[1] - 1.0, z), 0.4, 0.04, 0.005)
        gable_y(sw[0] - 0.55, max(se[0], ne[0]) + 0.55, sw[1] - 0.2, nw[1] + 0.2, ze, ze + 2.0, over=0.5)
        # the dark matted lean-to over the north-east corner's tables, on posts at its outer edge
        y0, y1 = ne[1] - 3.2, ne[1] + 2.9
        xo = xe1 + 1.9
        ki.mat_roof([(xe1 + 0.05, y0, ze - 0.15), (xo, y0, 2.4), (xo, y1, 2.4), (xe1 + 0.05, y1, ze - 0.15)], 0, rng, mat="oilpaper", sag=0.05)
        for yy in (y0 + 0.2, (y0 + y1) / 2, y1 - 0.2):
            k.post("timber", True, xo - 0.05, yy, -0.03, 2.38, 0.09, 0.015)


def compound_ranges(rng):
    """The compound's west and north ranges (S6.bld.wing_west_2053, S6.bld.north_range_2283): plaster walls under
    gable roofs (ridges painted: the west range's runs back, the north range's along the street), doors and lattice
    windows facing the light-well. choice: eave 3.1 m and ridge 5.1 m as the incense shop's (one roof painted)."""
    sw, se, ne, nw = fp("S6.bld.wing_west_2053")
    with sb.entity("S6.bld.wing_west_2053"):
        k.soft_plinth(sw[0], se[0], sw[1], nw[1], 0.12, rng, edge=0.3)
        ki.wall_bays((se[0], se[1]), (ne[0], ne[1]), 0.12, 2.95, [0, 0.3, 0.6, 1.0], ["window", "door", "window"], rng)
        for a, b in (((sw[0], sw[1]), (se[0], se[1])), ((nw[0], nw[1]), (sw[0], sw[1])), ((ne[0], ne[1]), (nw[0], nw[1]))):
            k.board("plaster", True, a, b, 0.18, 0.12, 2.95)
        gable_y(sw[0] - 0.4, se[0] + 0.4, sw[1] - 0.3, nw[1], 3.1, 5.1, over=0.4)
    sw, se, ne, nw = fp("S6.bld.north_range_2283")
    with sb.entity("S6.bld.north_range_2283"):
        k.soft_plinth(sw[0], se[0], sw[1], nw[1], 0.12, rng, edge=0.3)
        ki.wall_bays((sw[0] + 0.1, sw[1]), (se[0] - 0.1, se[1]), 0.12, 2.95, [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                     ["wall", "window", "door", "window", "wall"], rng)
        for a, b in (((se[0], se[1]), (ne[0], ne[1])), ((ne[0], ne[1]), (nw[0], nw[1])), ((nw[0], nw[1]), (sw[0], sw[1]))):
            k.board("plaster", True, a, b, 0.18, 0.12, 2.95)
        k.gable_roof(sw[0] - 0.2, se[0] + 0.3, sw[1] - 0.6, nw[1] + 0.5, 3.1, E["S6.bld.north_range_2283"]["heights"]["se_ridge"], over=0.4)


def house_at_well(rng):
    """The house behind the square well (S6.bld.house_well_2020): a blank plaster wall to the street under a tiled
    eave with round tile-ends, its roof running back. choice: eave 2.8 m and ridge 4.2 m (real; painted 1.75 m: the
    painter draws it low); 2.5 m deep as mapped."""
    sw, se, ne, nw = fp("S6.bld.house_well_2020")
    ze = 2.8
    with sb.entity("S6.bld.house_well_2020"):
        k.masonry((sw[0], sw[1] + 0.1), (se[0], se[1] + 0.1), -0.05, 0.35, 0.3, rng)
        for a, b in (((sw[0], sw[1] + 0.1), (se[0], se[1] + 0.1)), ((se[0], se[1] + 0.1), (ne[0], ne[1])), ((nw[0], nw[1]), (sw[0], sw[1] + 0.1))):
            k.board("plaster", True, a, b, 0.2, 0.3, ze - 0.05)
        k.gable_roof(sw[0] - 0.2, se[0] + 0.3, sw[1] - 0.45, nw[1] + 0.3, ze, 4.2, over=0.3)
        for i in range(int((se[0] - sw[0]) / 0.28)):
            x = sw[0] - 0.05 + i * 0.28
            sb.cyl("roof", False, (x, sw[1] - 0.47, ze - 0.06), (x, sw[1] - 0.52, ze - 0.06), 0.09, segs=8)


# ---------------------------------------------------------------- the far row at the top of the silk (beyond the north edge)

def far_row(rng):
    """The buildings on the top street at the top of the silk, real size on their painted footprints (the painter
    draws them at about 0.6 of the street's scale; the user, 2026-10-12: real size, map positions): the cloth shop
    (S6.bld.cloth_shop_wang) with its six eave plaques, the 杨家 clinic (S6.bld.clinic_yang) with its signboard
    楊家應症 on the east corner post, the far house (S6.bld.far_house_1859) and the fragment of a building beyond the
    compound (S6.bld.far_building_2561). choice: eaves 2.9 m and ridges 4.4-4.6 m (real; the map reads 1.1-1.85 m);
    the far building's east wall 0.6 m short of its est east end, where a figure is painted."""
    sw, se, ne, nw = fp("S6.bld.cloth_shop_wang")
    ze = 2.9
    yf = (sw[1] + se[1]) / 2
    with sb.entity("S6.bld.cloth_shop_wang"):
        k.soft_plinth(sw[0] - 0.1, se[0] + 0.1, yf - 0.15, nw[1], 0.12, rng, edge=0.3)
        xs = [sw[0]] + sorted(b[0] for b in E["S6.bld.cloth_shop_wang"]["bays"]) + [se[0]]
        for x in xs:
            k.column(x, yf, 0.12, ze - 0.3, r=0.11, mat="timber")
        k.beam("timber", True, (sw[0] - 0.2, yf, ze - 0.38), (se[0] + 0.2, yf, ze - 0.38), 0.16, 0.22, 0.03)
        for a, b in (((sw[0], yf + 0.2), (nw[0], nw[1])), ((ne[0], ne[1]), (se[0], yf + 0.2)), ((nw[0], nw[1]), (ne[0], ne[1]))):
            k.board("plaster", True, a, b, 0.16, 0.12, ze - 0.2)
        sb.quad("interior", False, (se[0] - 0.2, nw[1] - 0.15, 0.13), (sw[0] + 0.2, nw[1] - 0.15, 0.13), (sw[0] + 0.2, nw[1] - 0.15, ze - 0.4),
                (se[0] - 0.2, nw[1] - 0.15, ze - 0.4))
        # the dark eave fascia with six square plaques (one character each, not legible on the scan)
        k.beam("interior", False, (sw[0] - 0.2, yf - 0.1, ze - 0.1), (se[0] + 0.2, yf - 0.1, ze - 0.1), 0.08, 0.45, 0.01)
        for i in range(6):
            x = sw[0] + (se[0] - sw[0]) * (i + 0.5) / 6
            ki.eave_plaque((x, yf - 0.15, ze - 0.1), (0, -1), 0.34, "plaque", variant=(1, 6, 3, 4, 2, 7)[i])
        k.gable_roof(sw[0] - 0.2, se[0] + 0.2, yf - 0.8, nw[1] + 0.5, ze, 4.5, over=0.3)
    sw, se, ne, nw = fp("S6.bld.clinic_yang")
    ze = 2.9
    yf = (sw[1] + se[1]) / 2
    with sb.entity("S6.bld.clinic_yang"):
        k.soft_plinth(sw[0] - 0.1, se[0] + 0.1, yf - 0.15, nw[1], 0.12, rng, edge=0.3)
        for x in (sw[0], se[0]):
            k.column(x, yf, 0.12, ze - 0.3, r=0.11, mat="timber")
        k.beam("timber", True, (sw[0] - 0.2, yf, ze - 0.38), (se[0] + 0.2, yf, ze - 0.38), 0.16, 0.22, 0.03)
        for a, b in (((sw[0], yf + 0.2), (nw[0], nw[1])), ((ne[0], ne[1]), (se[0], yf + 0.2)), ((nw[0], nw[1]), (ne[0], ne[1]))):
            k.board("plaster", True, a, b, 0.16, 0.12, ze - 0.2)
        sb.quad("interior", False, (se[0] - 0.2, nw[1] - 0.15, 0.13), (sw[0] + 0.2, nw[1] - 0.15, 0.13), (sw[0] + 0.2, nw[1] - 0.15, ze - 0.4),
                (se[0] - 0.2, nw[1] - 0.15, ze - 0.4))
        k.beam("cloth_white", False, (sw[0] - 0.1, yf - 0.06, ze - 0.62), (se[0] + 0.1, yf - 0.06, ze - 0.62), 0.05, 0.42, 0.01)   # pale frieze
        k.gable_roof(sw[0] - 0.2, se[0] + 0.2, yf - 0.8, nw[1] + 0.5, ze, 4.4, over=0.3)
        # the signboard 楊家應症 hung on its east corner post
        ki.signboard((se[0] + 0.1, yf - 0.14), (se[0] + 0.55, yf - 0.14), 0.95, 2.75, "clinic_yang", rng, posts=False, top="flat")
    sw, se, ne, nw = fp("S6.bld.far_house_1859")
    with sb.entity("S6.bld.far_house_1859"):
        yfh = sw[1] + 0.9   # choice: its front 0.9 m behind the estimate, behind the bamboo painted before it
        with k.placed(k.frame(sw[0], yfh, 0, 0)):
            k.house(se[0] - sw[0], nw[1] + 0.4 - yfh, rng, eave=2.6, rise=1.4, plinth=0.3, bays=3, door_bays=(1,), brackets=False)
    sw, se, ne, nw = fp("S6.bld.far_building_2561")
    with sb.entity("S6.bld.far_building_2561"):
        x0, x1 = sw[0], se[0] - 0.6
        for x in (x0, x1):
            k.column(x, sw[1], 0.0, 2.4, r=0.1, mat="timber")
        for a, b in (((x0, nw[1]), (x1, nw[1])), ((x0, sw[1] + 0.2), (x0, nw[1])), ((x1, nw[1]), (x1, sw[1] + 0.2))):
            k.board("plaster", True, a, b, 0.14, 0.0, 2.4)
        gable_y(x0 - 0.3, x1 + 0.3, sw[1] - 0.4, nw[1] + 0.3, 2.5, 3.7, over=0.25)
        ki.signboard((x0 + 0.2, sw[1] - 0.12), (x0 + 0.65, sw[1] - 0.12), 1.4, 2.0, "plaque", rng, posts=False, top="flat")


def fence_far(rng):
    line = E["S6.str.fence_far_2000"]["lines"]["line"]
    with sb.entity("S6.str.fence_far_2000"):
        a, b = V((line[0][0], line[0][1], 0)), V((line[-1][0], line[-1][1], 0))
        L = (b - a).length
        n = max(2, int(L / 1.6))
        for i in range(n + 1):
            p = a.lerp(b, i / n)
            k.post("timber", False, p.x, p.y, 0, 1.0, 0.08, 0.015)
        for z in (0.35, 0.65, 0.92):
            k.beam("deck", False, a + UP * z, b + UP * z, 0.04, 0.14, 0.01)


# ---------------------------------------------------------------- the south side (houses seen from behind)

def inn(rng):
    """久住王员外家 (S6.bld.inn_wang_yuanwai), two storeys, seen from behind (south): a big hip-gable roof (its west
    gable with the hanging-fish board turned to the viewer); on the upper storey's south face, under a deep eave, a
    slatted window, the open bay where the scholar sits at his desk, a second open bay, and a little railed balcony
    at the east end; below, the ground floor's own pent roof. Its street front (north) is not painted.
    choice: upper floor 3.4 m (map/frames/S6.json 'inn upper floor'); the street wall at D 1.5 (est 2.44: the
    figures painted at its front stand to D 1.95); upper eave 6.2 m and ridge 9.0 m (real storeys); the bays'
    places from their painted u on the south face; a door and windows on the unpainted street front."""
    sw, se, ne, nw = fp("S6.bld.inn_wang_yuanwai")
    ys, yn = sw[1], 1.5
    x0, x1 = (sw[0] + nw[0]) / 2, (se[0] + ne[0]) / 2
    zu = INN_FLOOR
    ze2 = 6.2
    with sb.entity("S6.bld.inn_wang_yuanwai"):
        k.soft_plinth(x0 - 0.1, x1 + 0.1, ys - 0.2, yn + 0.2, 0.2, rng, edge=0.34)
        # ground floor walls: the street front with a door and lattice windows, the other three plain
        ki.wall_bays((x1, yn), (x0, yn), 0.2, zu - 0.15, [0, 0.2, 0.4, 0.6, 0.8, 1.0], ["window", "wall", "door", "wall", "window"], rng)
        for a, b in (((x0, yn), (x0, ys)), ((x0, ys), (x1, ys)), ((x1, ys), (x1, yn))):
            k.board("plaster", True, a, b, 0.2, 0.2, zu)
        # the street front's pent roof (腰檐) and the south face's
        ki.lean_to(x0 - 0.5, x1 + 0.5, yn + 0.9, yn - 0.05, 2.75, zu - 0.1, ns=10, nt=3)
        ki.lean_to(x0 - 0.5, x1 + 0.5, ys - 0.9, ys + 0.05, 2.75, zu - 0.1, ns=10, nt=3)
        # upper storey: floor, south face with its painted bays (window, the scholar's open bay, a second open bay,
        # the balcony at the east end), plaster elsewhere
        ki.floor_slab(x0, x1, ys - 0.45, yn, zu, rng, strip=0)
        yb = ys - 0.4           # choice: the upper storey's south face 0.4 m past the ground floor's (the scholar sits at D -7.84)
        f = lambda u: (ux(u, ys) - x0) / (x1 - x0)  # noqa: E731
        # the painted south face: a slatted window (3690-3800), the scholar's open bay with his desk (3880-4060), a
        # second open bay with a figure among books (4130-4210), the balcony east of it
        cols = sorted({0.0, max(0.05, f(3690)), f(3800), f(3880), f(4060), f(4130), f(4210), 1.0})
        kinds = []
        for a, b in zip(cols, cols[1:]):
            m = x0 + (a + b) / 2 * (x1 - x0)
            kinds.append("window" if ux(3690, ys) <= m <= ux(3800, ys) else "open" if ux(3880, ys) <= m <= ux(4060, ys)
                         or ux(4130, ys) <= m <= ux(4210, ys) else "wall")
        ki.wall_bays((x0, yb), (x1, yb), zu, ze2 - 0.3, cols, kinds, rng, sill=0.55)
        for t in cols:
            k.column(x0 + t * (x1 - x0), yb, zu, ze2 - 0.2, r=0.1, mat="timber", base=False)
        for a, b in (((x0, yn - 0.2), (x0, yb)), ((x1, yb), (x1, yn - 0.2))):
            k.board("plaster", True, a, b, 0.16, zu, ze2 - 0.25)
        # choice: its upper street face (not painted) with lattice windows like the south face's
        ki.wall_bays((x1, yn - 0.2), (x0, yn - 0.2), zu, ze2 - 0.25, [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                     ["window", "wall", "window", "wall", "window"], rng, sill=0.6)
        xb0 = ux(4210, ys) + 0.1
        k.balustrade([(xb0, yb - 0.02), (xb0, yb - 0.8), (x1 - 0.2, yb - 0.8), (x1 - 0.2, yb - 0.02)], zu, h=0.8, spacing=0.9)
        k.bx("deck", True, (xb0, yb - 0.85, zu - 0.12), (x1 - 0.15, yb, zu))
        sb.quad("interior", False, (x0 + 0.2, yb + 1.6, zu), (x1 - 0.2, yb + 1.6, zu), (x1 - 0.2, yb + 1.6, ze2 - 0.3), (x0 + 0.2, yb + 1.6, ze2 - 0.3))
        ki.xieshan_roof(x0 - 0.9, x1 + 0.9, ys - 1.6, yn + 0.9, ze2, 9.0, along="x", ornament_s=1.0, lift=0.5, ns=12, nt=6)


def south_houses(rng):
    """The inn's west wing and the two houses east of the inn, seen from behind: one storey, fronts on the street
    (north). choice: front walls at D 2.0 (the wing), 1.9 (house_south_4300) and -0.4 (house_south_4839): the
    mapped 2.44 is the street's narrowest reading, and the strokes paint stands, poles, a signboard and a figure
    on the street in front of these houses, behind their ridges (map/frames/S6.json, questions); eaves 2.8 m,
    ridges 4.6-5.0 m; the wing's hip-gable and house_4839's curled ridge ornament as painted."""
    sw, se, ne, nw = fp("S6.bld.inn_west_wing_3146")
    yn = 1.2
    sw, se = (sw[0], -3.1), (se[0], -3.1)   # choice: south wall at D -3.4; the bare trees painted before it stand at the silk's edge
    with sb.entity("S6.bld.inn_west_wing_3146"):
        k.soft_plinth(sw[0], se[0], sw[1] - 0.3, yn, 0.18, rng, edge=0.32)
        ki.wall_bays((se[0], yn), (sw[0], yn), 0.18, 2.6, [0, 0.25, 0.5, 0.75, 1.0], ["window", "door", "wall", "window"], rng)
        for a, b in (((sw[0], yn), (sw[0], sw[1] - 0.3)), ((sw[0], sw[1] - 0.3), (se[0], se[1] - 0.3)), ((se[0], se[1] - 0.3), (se[0], yn))):
            k.board("plaster", True, a, b, 0.18, 0.18, 2.6)
        ki.xieshan_roof(sw[0] - 0.6, se[0] + 0.1, sw[1] - 1.0, yn + 0.8, 2.8, 5.0, along="x", ornament_s=0.9, lift=0.45, ns=10, nt=5)
    sw, se, ne, nw = fp("S6.bld.house_south_4300")
    yn = 1.9
    sw, se = (sw[0], -3.5), (se[0], -3.5)   # choice: south wall at D -3.5 (est -7.8): the bare tree at its back stands at the silk's edge
    with sb.entity("S6.bld.house_south_4300"):
        x0, x1 = (sw[0] + nw[0]) / 2, (se[0] + ne[0]) / 2
        k.soft_plinth(x0, x1, sw[1], yn, 0.15, rng, edge=0.3)
        ki.wall_bays((x1, yn), (x0, yn), 0.15, 2.6, [0, 0.35, 0.65, 1.0], ["window", "door", "window"], rng)
        for a, b in (((x0, yn), (x0, sw[1])), ((x0, sw[1]), (x1, sw[1])), ((x1, sw[1]), (x1, yn))):
            k.board("plaster", True, a, b, 0.18, 0.15, 2.6)
        gable_y(x0 - 0.3, x1 + 0.3, sw[1] - 0.4, yn + 0.7, 2.8, 4.6, over=0.4)
    sw, se, ne, nw = fp("S6.bld.house_south_4839")
    yn = -0.4
    with sb.entity("S6.bld.house_south_4839"):
        x0, x1 = (sw[0] + nw[0]) / 2, (se[0] + ne[0]) / 2
        k.soft_plinth(x0, x1, sw[1], yn, 0.15, rng, edge=0.3)
        ki.wall_bays((x1, yn), (x0, yn), 0.15, 2.4, [0, 0.5, 1.0], ["door", "window"], rng)
        for a, b in (((x0, yn), (x0, sw[1])), ((x0, sw[1]), (x1, sw[1])), ((x1, sw[1]), (x1, yn))):
            k.board("plaster", True, a, b, 0.18, 0.15, 2.4)
        k.gable_roof(x0 - 0.2, x1 + 0.2, sw[1] - 0.5, yn + 0.6, 2.6, 3.8, over=0.3, ornament_s=0.8)
        for i in range(int((x1 - x0) / 0.28) + 1):
            x = x0 - 0.1 + i * 0.28
            sb.cyl("roof", False, (x, yn + 0.58, 2.55), (x, yn + 0.64, 2.55), 0.09, segs=8)


# ---------------------------------------------------------------- the square well and the incense shop's scaffold

def well(rng):
    """The square well (S6.str.square_well_2000): the curb at its mapped corners with the 田 cover, on its painted
    plank platform (structures pass: front edge v ~997 from u 1955 to 2240, back edge v ~855 from 1995 to 2282).
    choice: curb 0.25 m high (map/frames/S6.json 'well cover').
    choice (joined with S7, 2026-10-12): the boards from D 12.18 north run on west to X -90.4, past the platform's
    painted west edge, so the two tall buckets S7 maps standing on the platform's west end (S7.prop.bucket_bail_1950
    at (-90.03, 12.43), S7.prop.bucket_lidded_1988; S7's map: "stands on the platform's plank west end") stand on
    planks: the bail bucket's foot (r 0.2) has 0.17 m of plank west of it. Before, the planks stopped 0.4 m short of
    it. The boards in front (south of D 12.18) stop where they did, so the small bucket and the water carrier's bucket,
    which S7 maps on the ground in front of the platform's west end, stay off them. The boards reach down to z -0.14
    (they were 0.1 m thick, bottoms at -0.02), so no gap shows under their west ends on S7's ground, which dips toward
    the seam (5-6 cm gaps measured before), nor where this ground undulates below -0.02."""
    curb = fp("S6.str.square_well_2000")
    yf, yb = (1565 - 997) / 51.25, (1565 - 855) / 51.25
    plat = [(ux(1955, yf), yf), (ux(2240, yf), yf), (ux(2282, yb), yb), (ux(1995, yb), yb)]
    with sb.entity("S6.str.square_well_2000"):
        ki.square_well(curb, plat, 0.25, rng, west_ext=(12.18, -90.4), z_bottom=-0.14)


def incense_scaffold(rng):
    """The pole scaffold on the incense shop's east front (S6.str.cailou_incense_2895): tall thin poles with spear
    finials (painted tops 340-220 v) along the front, cross-bars along the eave, small ornaments hung on them."""
    sw, se, ne, nw = fp("S6.str.cailou_incense_2895")
    h = E["S6.str.cailou_incense_2895"]["heights"]
    # choice: 0.75 m east of its estimated foot line (the shop's wall), in front of the shop's eave, as painted
    a, b = ((sw[0] + se[0]) / 2 + 0.75, sw[1]), ((nw[0] + ne[0]) / 2 + 0.75, nw[1])
    hs, hn = h["sw_top"], h["nw_top"]
    poles = [(t, hs + (hn - hs) * t + d) for t, d in ((0.0, 0), (0.18, 0.5), (0.4, 0.9), (0.68, 0.6), (0.9, 0.2), (1.0, 0))]
    bars = [(0.0, 2.9, 1.0, 2.6), (0.0, 3.6, 1.0, 3.3), (0.1, 4.4, 0.85, 4.0)]
    with sb.entity("S6.str.cailou_incense_2895"):
        ki.pole_scaffold(a, b, poles, rng, bars=bars, z_foot=0.15)


# ---------------------------------------------------------------- props

def P(eid):
    return PROPS["S6.prop." + eid]["pos"]


def props(rng, h):
    """Every painted prop at its mapped spot (layout.json), each its own entity; sizes from the painting where
    measured (SCALE CUES in the map), else choice."""
    def at(eid):
        p = P(eid)
        return p[0], p[1], h(p[0], p[1])

    def ent(eid):
        return sb.entity("S6.prop." + eid)

    # the 正店's upper room
    x, y, _ = at("table_upper_5497")
    with ent("table_upper_5497"):
        k.table(x - 0.42, y - 0.28, x + 0.42, y + 0.28, ZD_FLOOR, h=0.7)
    x, y, _ = at("ewer_upper_5507")
    with ent("ewer_upper_5507"):
        ki.ewer(x, y, ZD_FLOOR + 0.7)
    x, y, _ = at("dishes_upper_5475")
    with ent("dishes_upper_5475"):
        ki.dishes(x, y, ZD_FLOOR + 0.7, rng)
    x, y, _ = at("vessel_upper_5060")
    with ent("vessel_upper_5060"):
        k.bx("timber", False, (x - 0.3, y - 0.15, ZD_FLOOR + 1.2), (x + 0.3, y + 0.15, ZD_FLOOR + 1.26))  # the bar it stands on
        ki.pot(x, y, ZD_FLOOR + 1.26, r=0.06, h=0.32, mat="jar_green")
    x, y, _ = at("desk_things_4013")
    with ent("desk_things_4013"):
        # the scholar's desk at the inn's window (its legs hidden by the sill) with a lamp stand, a vessel and a book rest
        k.table(x - 0.35, y - 0.22, x + 0.35, y + 0.22, INN_FLOOR, h=0.62)
        ki.pot(x - 0.15, y, INN_FLOOR + 0.62, r=0.06, h=0.12)
        sb.cyl("timber", False, (x + 0.02, y, INN_FLOOR + 0.62), (x + 0.02, y, INN_FLOOR + 1.02), 0.015, segs=5)
        sb.lathe("cloth_white", False, (x + 0.02, y, INN_FLOOR + 1.0), [(0.02, 0), (0.06, 0.05), (0.04, 0.1)], segs=6)
        k.beam("deck", False, (x + 0.12, y, INN_FLOOR + 0.64), (x + 0.3, y + 0.06, INN_FLOOR + 0.9), 0.24, 0.02, 0)
    # the 正店's door: lamps, lamp-boxes, baskets, the stall under the parasol
    for eid in ("gardenia_lamp_5327", "gardenia_lamp_5055", "gardenia_lamp_4422"):
        x, y, z = at(eid)
        with ent(eid):
            ki.gourd_lamp(x, y, z, h=1.25)   # painted lamp 125 px tall (px / 100: real)
    x, y, z = at("lampbox_zhengdian_4515")
    with ent("lampbox_zhengdian_4515"):
        ki.lamp_box(x, y, z, 0.7, 0.45, 1.08, "lampbox_zhengdian", legs=0.85)   # box 71 x 108 px, 220 px from cap to foot
    x, y, z = at("lampbox_sun_4665")
    with ent("lampbox_sun_4665"):
        ki.lamp_box(x, y, z, 0.32, 0.28, 0.75, "lampbox_sun", legs=1.15)   # panel 24 x 73 px, its foot hidden
    x, y, z = at("lampbox_xiang_5160")
    with ent("lampbox_xiang_5160"):
        ki.lamp_box(x, y - 0.25, z, 0.5, 0.38, 0.8, "lampbox_xiang", legs=0.3, flowers=True, rng=rng)   # face 48 x 77 px
    x, y, z = at("counter_inside_5238")
    with ent("counter_inside_5238"):
        ki.counter((x - 0.55, y - 0.2), (x + 0.55, y - 0.2), 0.06, 0.82, 0.5, rng)
        ki.pot(x - 0.2, y - 0.4, 0.9, r=0.08, h=0.14)
        ki.pot(x + 0.15, y - 0.4, 0.9, r=0.07, h=0.12, mat="jar_green")
    for eid, r, hh in (("big_basket_4543", 0.68, 0.8), ("big_basket_4993", 0.82, 0.9)):
        x, y, z = at(eid)
        with ent(eid):
            ki.round_basket(x, y, z, r, hh, rng, mouth=1.02)   # mouths 137 and ~170 px across
            for i in range(3):   # the tall bundle or cane frame standing in it
                a = i * 2.1
                k.beam("bamboo", False, (x + 0.2 * math.cos(a), y + 0.2 * math.sin(a), z + 0.4), (x, y, z + 1.6), 0.03, 0.03, 0)
    x, y, z = at("stool_4461")
    with ent("stool_4461"):
        # choice (fix-inner): the stool's height fitted to the seated man's sit (fig_seats.json), else 0.45
        ki.stool(x, y, z, h=fitted_h("S6.prop.stool_4461", 0.45, z))
    x, y, z = at("tub_4320")
    with ent("tub_4320"):
        ki.tub(x, y, z, 0.27, 0.57, rng)    # 54 x 57 px
    x, y, z = at("sticks_in_tub_4325")
    with ent("sticks_in_tub_4325"):
        for i in range(9):
            a = i * 0.7
            p = V((x + 0.11 * math.cos(a), y + 0.09 * math.sin(a), z + 0.3))
            k.beam("bamboo", False, p, p + V((0.06 * math.cos(a), 0.05 * math.sin(a), 0.9 + 0.12 * math.sin(i))), 0.022, 0.022, 0)
            k.rock("grass_dry", *(p + V((0.06 * math.cos(a), 0.05 * math.sin(a), 0.94 + 0.12 * math.sin(i)))), 0.06, rng, flat=1.4)
    x, y, z = at("parasol_4312")
    with ent("parasol_4312"):
        # painted hub (4269, 762) west of the pole's foot in the tub, the canopy tilted toward the viewer
        ki.umbrella(x - 0.3, y, 2.2, 1.18, rng, tilt=(0.0, 0.25), foot=(x, y, z + 0.1))   # canopy 237 px, hub ~280 px up
    x, y, z = at("net_bag_4286")
    with ent("net_bag_4286"):
        ki.net_bag(x, y, 1.85, h=0.32)
    TRAY = {"tray_stand_4385": (0.7, 0.5, 0.62), "tray_stand_4258": (0.85, 0.55, 0.6), "tray_stand_4110": (1.37, 0.8, 0.65)}   # tray px / 100
    for eid, (L, W_, hh) in TRAY.items():
        x, y, z = at(eid)
        with ent(eid):
            ki.tray_stand(x, y, z, L, W_, hh, rng)
    for eid, stand, mat, high in (("goods_tray_4385", "tray_stand_4385", "cloth_white", 0.25), ("goods_tray_4258", "tray_stand_4258", "interior", 0.0),
                                  ("goods_tray_4108", "tray_stand_4110", "cloth_white", 0.05)):
        x, y, z = at(stand)
        L, W_, hh = TRAY[stand]
        with ent(eid):
            ki.goods_heap(x, y, z + hh + 0.05, L * 0.8, W_ * 0.8, rng, n=9 if L < 1 else 15, mat=mat, high=high, s=0.07)
            if eid == "goods_tray_4258":
                ki.box_stack(x + 0.15, y + 0.1, z + hh, 2, 0.2, 0.15, 0.08, rng)
    x, y, z = at("parasol_south_4265")
    with ent("parasol_south_4265"):
        ki.umbrella(x, y, 2.3, 1.6, rng, tilt=(0.0, 0.05), rise=0.15)   # canopy 322 px, seen almost edge-on
    x, y, z = at("basket_4060")
    with ent("basket_4060"):
        ki.round_basket(x, y, z, 0.16, 0.32, rng)
    x, y, z = at("high_seat_4060")
    with ent("high_seat_4060"):
        ki.stool(x, y, z, h=0.85, s=0.42)
        # the painted "long curved bar" low on the chair's front (map: an arm or rail sweeping down to v ~860, near
        # the legs' feet) as its foot rail, where the stall keeper's feet rest (details pass, fix-inner: he sits 0.85 m
        # up and his sit puts his soles 0.42 m under his seat). choice: a flat rail 0.07 deep, its top 0.434 m up,
        # between the front legs
        k.bx("timber", False, (x - 0.2, y - 0.215, z + 0.404), (x + 0.2, y - 0.145, z + 0.434))
        k.beam("timber", False, (x - 0.25, y + 0.2, z + 1.25), (x + 0.25, y + 0.2, z + 1.25), 0.04, 0.04, 0)
        for sx in (-0.21, 0.21):
            k.beam("timber", False, (x + sx, y + 0.19, z + 0.85), (x + sx, y + 0.2, z + 1.25), 0.035, 0.035, 0)
    x, y, z = at("slanted_rack_4008")
    with ent("slanted_rack_4008"):
        k.bx("timber", True, (x - 0.2, y - 0.2, z), (x + 0.2, y + 0.2, z + 0.5))
        k.beam("deck", False, (x - 0.5, y, z + 0.9), (x + 0.5, y, z + 1.3), 0.4, 0.04, 0.005)
        for t in range(6):
            q = V((x - 0.45 + t * 0.18, y - 0.02, z + 0.93 + t * 0.07))
            k.rock("interior", q.x, q.y, q.z + 0.03, 0.035, rng)
    x, y, z = at("box_stack_4082")
    with ent("box_stack_4082"):
        ki.box_stack(x, y, z, 3, 0.45, 0.4, 0.13, rng, plank=2.1)   # plank 97 px long, stack 35 x 29 px
    # the corner shop's meat counter (孫羊店)
    mc = PROPS["S6.prop.meat_counter_3856"]["footprint"]
    with ent("meat_counter_3856"):
        ki.counter(mc[0], mc[1], 0.18, 0.88, 0.5, rng)
    x, y, z = at("chopping_block_3963")
    with ent("chopping_block_3963"):
        ki.chopping_block(x + 0.3, y + 0.25, 0.18, r=0.3, h=0.8)
    x, y, z = at("meat_pieces_3978")
    with ent("meat_pieces_3978"):
        for i in range(4):
            k.rock("meat", x + 0.3 + rng.uniform(-0.12, 0.12), y + 0.25 + rng.uniform(-0.1, 0.1), 1.08, rng.uniform(0.08, 0.12), rng, flat=0.7)
    x, y, z = at("pot_on_counter_3832")
    with ent("pot_on_counter_3832"):
        ki.pot(x, y + 0.15, 1.06)
    x, y, z = at("hanging_meat_3857")
    with ent("hanging_meat_3857"):
        ki.hanging_pork(x, y + 0.4, E["S6.bld.corner_shop_3725"]["heights"]["sw_eave"] - 0.6, length=1.0, rng=rng)
        k.beam("timber", False, (x - 0.8, y + 0.4, E["S6.bld.corner_shop_3725"]["heights"]["sw_eave"] - 0.58),
               (x + 0.8, y + 0.4, E["S6.bld.corner_shop_3725"]["heights"]["sw_eave"] - 0.58), 0.05, 0.05, 0)
    # the butcher's flag on its slanting pole (structures pass: (4085,545) -> (4445,835))
    x, y, z = at("banner_sunyangdian_4152")
    with ent("banner_sunyangdian_4152"):
        yb = y - 0.35
        foot = (u2x(4445, 12.9), 12.9 - 0.2, 0.0)
        top = (u2x(4085, 13.3) + 1.2, 13.0, zv(545, 880) + 0.1)   # choice: stops short of the butcher's roof hip
        ki.banner_on_pole(foot, top, (x, yb, zv(585, 880)), 0.6, 1.3, "banner_sunyang", (0, -1))   # flag 75 x 130 px
    # the inn's sign, the street sign and its sunshade, the round basket, the curved pole
    x, y, z = at("sign_inn_wang_3272")
    with ent("sign_inn_wang_3272"):
        ki.signboard((x - 0.25, y), (x + 0.25, y), 1.0, 1.0 + 2.1, "inn_wang", rng, posts=True, top="flat")   # 50 x 210 px
    x, y, z = at("sign_street_3641")
    with ent("sign_street_3641"):
        ki.signboard((x - 0.21, y + 0.2), (x + 0.21, y + 0.2), 0.55, 0.55 + 2.05, "street", rng, posts=True, top="flat")   # 40 x 205 px
    x, y, z = at("sunshade_3590")
    with ent("sunshade_3590"):
        # it rests on the street sign's posts (no pole of its own is painted)
        # choice: on the sign's post tops (2.6 m), under the west wing's eave brackets (2.8 m)
        ki.umbrella(x, y + 0.2, 2.62, 1.05, rng, tilt=(0.0, 0.02), rise=0.08, mat="reed", pole=False)   # 210 px across
    x, y, z = at("ridge_round_basket_3695")
    with ent("ridge_round_basket_3695"):
        ki.round_basket(x, y + 0.2, z, 0.35, 0.6, rng, lid=True)   # 70 px across
    x, y, z = at("curved_pole_3580")
    with ent("curved_pole_3580"):
        pts = [V((ux(3497, 2.9), y, 1.5)), V((ux(3580, 2.9), y, 1.0)), V((ux(3730, 2.9), y, 1.5))]
        sb.tube("bamboo", False, [pts[0], pts[0].lerp(pts[1], 0.5) - UP * 0.15, pts[1], pts[1].lerp(pts[2], 0.5) - UP * 0.15, pts[2]], [0.03] * 5)
    # the incense shop's front: the 劉家 sign, the bench, the tables and the rack under the lean-to
    x, y, z = at("signboard_liu_incense_3147")
    with ent("signboard_liu_incense_3147"):
        ki.signboard((x, y - 0.18), (x, y + 0.18), 0.5, 0.5 + 2.5, "liu_incense", rng, posts=True, top="round")   # 33 x >217 px
    x, y, z = at("long_bench_incense_3025")
    with ent("long_bench_incense_3025"):
        ki.bench((x + 0.2, y - 0.5), (x + 0.2, y + 0.5), 0.15, h=0.45, w=0.35)   # 100 x 45 px
    for eid in ("shed_table_3242", "shed_table_3296"):
        f4 = PROPS["S6.prop." + eid]["footprint"]
        xs, ys = [p[0] for p in f4], [p[1] for p in f4]
        with ent(eid):
            k.table(min(xs), min(ys), max(xs), max(ys), 0.0, h=0.7)
    x, y, z = at("table_3218")
    with ent("table_3218"):
        k.table(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 0.0, h=0.7)
    x, y, z = at("shed_back_rack_3330")
    with ent("shed_back_rack_3330"):
        ki.bench((x - 0.2, y - 0.7), (x - 0.2, y + 0.7), 0.0, h=0.55, w=0.4)
        for i in range(4):
            ki.pot(x - 0.2, y - 0.5 + i * 0.33, 0.55, r=0.13, h=0.26, mat="jar_red" if i % 2 else "jar_green")
    x, y, z = at("folding_stand_3115")
    with ent("folding_stand_3115"):
        ki.folding_stand((x - 0.1, y - 0.15, z), (x + 0.25, y + 0.1, z + 1.45), 0.52, rng)
    # the low stall at the bottom edge: two umbrellas, the 子 sign, the low table
    x, y, z = at("umbrella_low_2978")
    with ent("umbrella_low_2978"):
        ki.umbrella(x, y, 2.0, 1.36, rng, tilt=(0.0, 0.08), mat="reed")   # 272 px
    x, y, z = at("umbrella_low_3127")
    with ent("umbrella_low_3127"):
        ki.umbrella(x, y, 2.1, 1.48, rng, tilt=(0.0, 0.06), mat="reed")   # 297 px
    x, y, z = at("signboard_zi_2888")
    with ent("signboard_zi_2888"):
        ki.signboard((x - 0.13, y), (x + 0.13, y), 0.3, 1.06, "zi_2888", rng, posts=True, top="flat")   # 23 x 76 px
    x, y, z = at("low_table_3010")
    with ent("low_table_3010"):
        k.table(x - 0.35, y - 0.25, x + 0.35, y + 0.25, z, h=0.42)
    # the umbrella stall east of the paper stall, the pale awning
    x, y, z = at("umbrella_2815")
    with ent("umbrella_2815"):
        ki.umbrella(x, y, 2.1, 1.03, rng, tilt=(0.0, 0.2))   # 207 px, hub ~210 px above its foot
    x, y, z = at("mat_roof_2800")
    with ent("mat_roof_2800"):
        # the pale cloth awning drawn as a lozenge, on a post at its west corner (structures pass)
        c = [(x - 1.3, y - 0.5, 2.5), (x + 1.2, y - 0.5, 2.45), (x + 1.2, y + 0.8, 2.8), (x - 1.3, y + 0.8, 2.85)]
        ki.mat_roof(c, 0, rng, mat="cloth_white", sag=0.04)
        k.post("timber", True, x - 1.25, y - 0.45, -0.03, 2.48, 0.08, 0.012)
    # the paper-horse stall (列售纸码): the table, the three umbrellas, the paper offerings
    f4 = PROPS["S6.prop.paper_stall_table_2395"]["footprint"]
    xs, ys = [p[0] for p in f4], [p[1] for p in f4]
    with ent("paper_stall_table_2395"):
        k.table(min(xs), min(ys), max(xs), max(ys), 0.0, h=0.84)   # top 84 px above its feet
    for eid, R_, zh in (("umbrella_2368", 1.31, 2.4), ("umbrella_2460", 1.3, 2.6), ("umbrella_2594", 1.03, 2.2)):   # 262, 260, 206 px
        x, y, z = at(eid)
        with ent(eid):
            ki.umbrella(x, y, zh, R_, rng, tilt=(0.0, 0.18), ribs=18)   # painted with many ribs
    for eid, kind in (("paper_figure_2415", "plain"), ("paper_figure_2487", "arms"), ("paper_figure_hat_2516", "hat")):
        x, y, z = at(eid)
        with ent(eid):
            ki.paper_figure(x, y, 0.84, 0.42, rng, hat=kind == "hat", arms=kind == "arms")
    x, y, z = at("paper_tower_2442")
    with ent("paper_tower_2442"):
        ki.paper_tower(x, y, 0.84, 0.52, rng)
    x, y, z = at("paper_goods_tray_2548")
    with ent("paper_goods_tray_2548"):
        k.bx("interior", False, (x - 0.25, y - 0.15, 0.84), (x + 0.25, y + 0.15, 0.88))
        ki.goods_heap(x, y, 0.88, 0.45, 0.25, rng, n=8, mat="cloth_red", s=0.045)
    # the well's pole and the small box at its foot
    x, y, z = at("well_pole_2250")
    with ent("well_pole_2250"):
        ki.capped_pole(x, y, 0.08, 2.2, r=0.045)   # 223 px
        sb.cyl("rope", False, (x + 0.05, y, 2.15), (x + 0.05, y, 0.9), 0.006, segs=4)
    x, y, z = at("water_box_2234")
    with ent("water_box_2234"):
        k.bucket(x, y, 0.08, rng, r=0.18, h=0.3)
        k.beam("timber", False, (x - 0.17, y, 0.38), (x + 0.17, y, 0.38), 0.025, 0.025, 0)
    # the 解 ring: the board, the awning, the bench, the box
    x, y, z = at("jie_signboard_2085")
    with ent("jie_signboard_2085"):
        fa, fb = (ux(2050, (1565 - 1768) / 51.25), (1565 - 1768) / 51.25), (ux(2120, (1565 - 1708) / 51.25), (1565 - 1708) / 51.25)
        # joined with S7 (2026-10-12): the board's top edge leans on the 解 building's east eave, as painted (S7's map:
        # the top edge against the eave at (1940, 1459)-(1996, 1400)). S7 builds that eave at X -79.75, 2.75 m up,
        # on its painted post at (-79.93, -3.18) (blender/city_end_scene.py JIE): the apex rests just inside it.
        # Before S7 was built the apex stood 0.5 m west of the feet at 3.0 m (the corner building's eave, 350 px)
        apex = (-79.6, -3.0, 2.7)
        ki.a_frame_board((fa[0], fa[1], 0.0), (fb[0], fb[1], 0.0), apex, None)
        # the bar (painted v ~1522 from the building's post at u ~1936 to u ~2067): S7 builds its west part, from the
        # post to the seam (S7.bld.jie_building_1800: Y -3.18, 2.675 m up, 0.09 x 0.11 m); it runs on here from the
        # seam to u ~2062 (S7's reading of its east end), and the 解 plaque (painted u 2005-2058, v 1529-1576) hangs
        # from it on two short cords, double-faced, so it reads from the street and from the painting's side.
        # choice: plaque 0.5 m (real size; painted 50 x 47 px at the figures' 1.3x)
        yb_, zb_ = -3.18, (1728 - 1522) / 77.0
        x_seam = ux(2000, yb_) - 0.02    # S7's part ends 0.02 m short of the seam: this one butts onto it
        x_end = ux(2062, yb_)
        k.beam("timber", False, (x_seam, yb_, zb_), (x_end, yb_, zb_), 0.09, 0.11, 0.015)
        ki.hung_plaque((x_seam, yb_, zb_), (x_end, yb_, zb_), ux((2005 + 2058) / 2, yb_), zb_ - 0.055, 0.5, "jie")
    f4 = PROPS["S6.prop.mat_awning_2000"]["footprint"]
    with ent("mat_awning_2000"):
        # choice: the mat about 2.5 m up (structures and t1: from the ring seated under it); posts at its painted feet
        (a, b, c, d) = f4
        ki.mat_roof([(a[0], a[1], 2.35), (b[0], b[1], 2.35), (c[0], c[1], 2.7), (d[0], d[1], 2.7)], 0, rng, mat="reed", sag=0.04)
        for px in (ux(2212, 0.6), ux(2292, 0.6)):
            k.post("timber", True, px, a[1] + 0.1, -0.03, 2.37, 0.1, 0.015)
    x, y, z = at("bench_2100")
    with ent("bench_2100"):
        ki.bench((x - 0.6, y), (x + 0.6, y), z, h=0.42)   # 71 x 33 px: choice 1.2 m long, a bench to sit on
    x, y, z = at("box_2075")
    with ent("box_2075"):
        k.bx("timber", False, (x - 0.14, y - 0.1, 0.7), (x + 0.14, y + 0.1, 0.92))
        k.table(x - 0.25, y - 0.2, x + 0.25, y + 0.2, z, h=0.7)
    # the top street (beyond the north edge): the cloth shop's sign, counters, bench; the red board; the table,
    # the bench and the domed basket at the clinic; the lattice frame
    x, y, z = at("sign_cloth_shop_3450")
    with ent("sign_cloth_shop_3450"):
        # real size (the far row is painted at about 0.6): a 2 m board over its lower box
        ki.signboard((x - 0.24, y), (x + 0.24, y), 0.8, 2.85, "cloth_shop", rng, posts=False, top="flat", foot=0.75)
        ki.signboard((x - 0.24, y - 0.02), (x + 0.24, y - 0.02), 0.12, 0.72, "cloth_shop_box", rng, posts=False, top=None)
    for eid in ("cloth_counter_3595", "cloth_counter_3720"):
        x, y, z = at(eid)
        with ent(eid):
            ki.counter((x - 0.75, y), (x + 0.75, y), 0.12, 0.8, 0.45, rng, front=False)   # real (the far row is painted small)
    x, y, z = at("cloth_bench_3598")
    with ent("cloth_bench_3598"):
        # choice (fix-inner): the top fitted to the customer's sit (fig_seats.json), else 0.45 over the ground
        ki.bench((x - 0.75, y - 0.1), (x + 0.75, y - 0.1), 0.0, h=fitted_h("S6.prop.cloth_bench_3598", 0.45, 0.0), w=0.28)
    x, y, z = at("red_board_3936")
    with ent("red_board_3936"):
        k.board("cloth_red", True, (x - 0.5, y), (x + 0.5, y), 0.08, 0.0, 2.7)   # real: a 1 m board, 2.7 m tall (painted 77 px wide at 0.6)
        for xx in (x - 0.52, x + 0.52):
            k.post("timber", False, xx, y, 0.0, 2.75, 0.07, 0.01)
        k.beam("timber", False, (x - 0.52, y, 2.72), (x + 0.52, y, 2.72), 0.07, 0.07, 0.01)
    f4 = PROPS["S6.prop.counter_table_3940"]["footprint"]
    with ent("counter_table_3940"):
        xs, ys = [p[0] for p in f4], [p[1] for p in f4]
        # choice: the counter on the west side of the clinic's open front (S6.bld.clinic_yang), from 0.25 m off its
        # west wall to just west of the doorway man, 1.06 m long as painted (90 px), 0.45 m deep just behind the front
        # line, with the shop person standing behind it (its est west end ran through the cloth shop's east wall, and
        # its est back corners past the person painted behind it)
        cw = fp("S6.bld.clinic_yang")
        yf = (cw[0][1] + cw[1][1]) / 2
        k.table(cw[0][0] + 0.25, yf + 0.1, -74.0, yf + 0.55, 0.0, h=0.8)
    x, y, z = at("bench_3880")
    with ent("bench_3880"):
        ki.bench((x - 0.5, y), (x + 0.5, y), 0.0, h=0.45)
    x, y, z = at("domed_basket_4080")
    with ent("domed_basket_4080"):
        k.table(x - 0.3, y - 0.25, x + 0.3, y + 0.25, 0.0, h=0.45)
        ki.round_basket(x, y, 0.45, 0.28, 0.32, rng, lid=True)
    x, y, z = at("lattice_frame_3120")
    with ent("lattice_frame_3120"):
        ki.lattice_frame((x - 0.9, y), (x + 0.9, y), 0.0, 0.6, rng)
    # the south edge: stands, poles, the stele-like signboard, the leaning poles
    for eid, kind, hh in (("tripod_stand_4822", "cross", 0.95), ("tripod_stand_4880", "cross", 1.05), ("tripod_stand_knob_4942", "knob", 1.05)):
        x, y, z = at(eid)
        with ent(eid):
            ki.tripod_stand(x, y + 0.2, z, hh, rng, spread=0.2, cross=kind == "cross", knob=kind == "knob")   # ~95-105 px
    for eid, hh in (("pole_4770", 1.0), ("pole_capped_4997", 0.95)):
        x, y, z = at(eid)
        with ent(eid):
            ki.capped_pole(x, y + 0.1, z, hh)
    x, y, z = at("signboard_5129")
    with ent("signboard_5129"):
        ki.signboard((x - 0.15, y + 0.4), (x + 0.15, y + 0.4), 0.3, 1.45, "stele_5129", rng, posts=True, top="pointed")   # 30 px wide
    x, y, z = at("leaning_poles_5045")
    with ent("leaning_poles_5045"):
        ki.leaning_poles((x, y, z), [(x + 0.5, y + 0.4, 2.0), (x + 0.75, y + 0.2, 1.8), (x + 1.2, y + 0.1, 1.4)])


# ---------------------------------------------------------------- vehicles (the workshop's kit, blender/kit_vehicles.py)

PEOPLE_JSON = QM + r"\sections\inner_city\people.json"


def team(*slugs):
    """The team as the page places it: the layout's spot, facing from hind to fore hooves unless people.json gives
    the animal a facing_deg (a team set out along its vehicle's axis)."""
    animals = json.load(open(PEOPLE_JSON, encoding="utf-8")).get("animals", {})
    out = []
    for s in slugs:
        e = E["S6.ani." + s]
        f, hd = e["pts"]["fore"], e["pts"]["hind"]
        kind = "mule" if s.startswith("mule") else "horse" if s.startswith("horse") else "donkey"
        face = animals.get(s, {}).get("facing_deg")
        if face is None:
            face = math.degrees(math.atan2(f[1] - hd[1], f[0] - hd[0]))
        out.append((e["pos"][0], e["pos"][1], face, kind))
    return out


SEATS = {}
SEDAN_POLE_FIT = 1.47   # choice: see vehicles(); the bearers' shoulder top in sedan_carry~pole + the pole's radius


def seat_support(eid, built):
    """A painted driver sits on the kit's driver's seat (`built.seat`, hips; `built.feet`, the footboard). The seat
    and footboard are visible planks that don't collide, and people.js grounds a figure by a ray down from H + 1.2 m:
    an invisible block under the footboard (top 5 cm above it) is what the figure's feet stand on, so the sit clip
    puts the hips on the seat 0.4 m behind. make_people.py puts the figure at the feet (seats.json).
    Details pass (fix-inner, 2026-10-13): both drivers now take their root height from people.json root_h (people.js P2,
    fix_standard.md rule 6: the seat top less the clip's seat height), so the invisible block is gone; it held them 5 cm
    over the visible footboard (the hidden_collider check) and filled the space between the wagon's shafts where its
    carter stands. seats.json keeps the seat and the footboard."""
    if not getattr(built, "seat", None):
        return
    fx, fy, fz = built.feet
    SEATS[eid] = {"seat": list(built.seat), "feet": [fx, fy, round(fz + 0.05, 3)]}


def _fig_seats():
    try:
        with open(FIG_SEATS_JSON, encoding="utf-8") as fi:
            return json.load(fi).get("seats", {})
    except FileNotFoundError:
        return {}


def fitted_h(owner, default, z):
    """A mapped seat's height over z, fitted to its sitter's seat point (fig_seats.json kind "fit"), else default."""
    for e in _fig_seats().values():
        if e["kind"] == "fit" and e["owner"] == owner:
            return round(e["top"] - z, 3)
    return default


def figure_seats():
    """Stools under figures painted seated whose seat is hidden or not painted (map/BUILDING.md rule 3: the seat is part
    of the figure; fix_standard.md rule 5), each owned by the figure's map ID, centred under its clip's seat point at
    its placement, its top 0.007 m under that point (fig_seats.json); not colliding (seats never do).
    choice: 0.34 m square (the seat point moves 0.06-0.12 m over a cycle), on the visible floor under it."""
    for slug, e in sorted(_fig_seats().items()):
        if e["kind"] != "stool":
            continue
        with sb.entity(e["owner"]):
            ki.stool(e["X"], e["D"], e["base"], h=e["h"], s=0.34)


def vehicles(rng, h):
    """Every painted vehicle with its harness reaching to its painted team (map/BUILDING.md): kit_vehicles
    functions, positions from the layout. choice: wheel radii from the painted wheels / 1.3 (the figures' scale), as
    the kit does; the hidden wagon's body (only its team and traces are painted) as the same 太平车 type, behind the
    incense shop's lean-to roof (the lead, 2026-10-12)."""
    def pts(eid):
        e = E[eid]["pts"]
        w = [tuple(e[kk][:2]) for kk in sorted(e) if kk.startswith("wheel")]
        return tuple(e["front"][:2]), tuple(e["rear"][:2]), w
    f, r, w = pts("S6.veh.sack_cart_5412")
    with sb.entity("S6.veh.sack_cart_5412"):
        # the door donkey is led by the man in white, not harnessed (no trace or collar painted): not in the team.
        # The kit's low two-wheeled dray (sack_cart low=True), made for this cart: big round roped sacks heaped on a
        # flat bed between two big wheels, no box sides (the map paints none). choice: low_R 0.75 (painted wheel 200 px
        # across at the figures' 1.3: 1.5 m), bed 2.4 m (load 313 px), bed top 0.87 m and the heap ~1.9 m (painted load
        # top 137 px above the hub)
        kv.sack_cart(f, r, wheels=w, team=team("donkey_team_near_5270", "donkey_team_dark_5300", "donkey_team_pale_5285"),
                     z_of=h, rng=random.Random(5412), low=True, low_R=0.75, bed_len=2.4)
    # choice (details pass, fix-inner, 2026-10-13; gen/details/contacts/fix_inner/notes.md): the poles fitted to their
    # bearers (kit pole_fit, as S4's): each end's axis over the ground under it at the bearer's shoulder-top height in
    # sedan_carry~pole (1.432 m with his soles on the ground: characters/ik_variants.json "pole") plus the pole's
    # radius 0.038 (the kit's pole_h 1.3 had them 0.1-0.2 m under the shoulders). All seven S6 bearers carry a pole on
    # the shoulder (map/text/S6.md).
    for eid in ("S6.veh.sedan_4575", "S6.veh.sedan_4965"):
        f, r, w = pts(eid)
        with sb.entity(eid):
            kv.sedan_chair(f, r, z_of=h, rng=random.Random(4575 if "4575" in eid else 4965), carried=True,
                           pole_fit=SEDAN_POLE_FIT)
    # the matchmaker's seat in the west sedan (map/BUILDING.md rule 3: the seat of a figure painted seated is part of
    # her; "woman seated in the first sedan", her face at its south window): a bench across the back of the cabin, on
    # the cabin's floor. choice: top 0.44 m over the floor (the woman's sit puts her seat point 0.447 m over her soles),
    # 0.6 m across, 0.28 deep, centred 0.30 m behind the cabin's middle (the clip's seat is 0.6 m behind her feet);
    # not colliding (seats never do). The floor's height is the kit's: the poles at the cabin less 0.6, the floor board
    # 0.04 over that.
    f, r, w = pts("S6.veh.sedan_4575")
    o, fwd, left, L = kv._axis(r, f)
    c = o + fwd * (L * 0.5)
    zg = h(c.x, c.y)
    z_p = ((h(r[0], r[1]) - zg + SEDAN_POLE_FIT) + (h(f[0], f[1]) - zg + SEDAN_POLE_FIT)) / 2
    floor = zg + z_p - 0.6 + 0.04
    b = c - fwd * 0.30
    with sb.entity("S6.fig.sedan_passenger_4362"):
        ki.bench((b - left * 0.3).xy, (b + left * 0.3).xy, floor, h=0.44, w=0.28)
    SEATS["S6.fig.sedan_passenger_4362"] = {"seat": [round(b.x, 3), round(b.y, 3), round(floor + 0.44, 3)],
                                             "floor": round(floor, 3), "why": "her bench in the west sedan's cabin"}
    f, r, w = pts("S6.veh.taiping_wagon_3600")
    with sb.entity("S6.veh.taiping_wagon_3600"):
        b = kv.mule_wagon(f, r, wheels=w, team=team("mule_lower_shaft_3560", "mule_lower_3_3498", "mule_lower_2_3462", "mule_lower_1_3427"),
                          z_of=h, rng=random.Random(3600), R=0.85, load=None)   # wheel 170 px tall
        seat_support("S6.veh.taiping_wagon_3600", b)   # the young man painted seated on its front
    f, r, w = pts("S6.veh.hidden_wagon_3400")
    with sb.entity("S6.veh.hidden_wagon_3400"):
        kv.mule_wagon(f, r, wheels=w or None, team=team("mule_upper_1_3585", "mule_upper_2_3620", "mule_upper_3_3655", "mule_upper_lead_3690"),
                      z_of=h, rng=random.Random(3400), R=0.82, load="covered", driver_seat=False)   # its driver walks behind the team
    f, r, w = pts("S6.veh.barrow_casks_3300")
    with sb.entity("S6.veh.barrow_casks_3300"):
        kv.sack_cart(f, r, wheels=w, team=None, z_of=h, rng=random.Random(3300), R=0.42, frame_w=0.8, deck_len=1.4)   # wheel 76-85 px
    f, r, w = pts("S6.veh.barrow_top_3340")
    with sb.entity("S6.veh.barrow_top_3340"):
        kv._barrow(f, r, w, h, random.Random(3340), 0.4, 12, 0.7, False, 1.0)   # real size (painted small at the back: wheel 52 px)
    f, r, w = pts("S6.veh.wine_cart_3090")
    with sb.entity("S6.veh.wine_cart_3090"):
        b = kv.cask_cart(f, r, wheels=w, team=team("donkey_wine_cart_3191", "donkey_wine_cart_3105"), z_of=h, rng=random.Random(3090), R=0.85)   # wheel 230 px tall (the cart turns): choice 1.7 m
        seat_support("S6.veh.wine_cart_3090", b)   # the driver painted seated at its front with the whip
    with open(SEATS_JSON, "w", encoding="utf-8") as fo:
        json.dump(SEATS, fo, indent=1)


# ---------------------------------------------------------------- colliders

def colliders(trees):
    """Invisible colliders: one wall per side of the walkable area (the painted area), and each tree's trunk (part of
    the tree)."""
    for side, (xa, ya), (xb, yb) in zip(("south", "east", "north", "west"), WALK, WALK[1:] + WALK[:1]):
        with sb.entity(f"edge:{side}"):
            k.board("hidden", True, (xa, ya), (xb, yb), 0.1, -2.0, 4.0)
    for t in trees:
        x, d, s = t["X"], t["D"], t["scale"]
        with sb.entity(t["map_id"]):
            sb.cyl("hidden", True, (x, d, 0), (x + 0.15 * s, d + 0.1 * s, 2.5 * s), 0.3 * s, segs=8)


def route_road(L):
    """The main street's centre line, carried straight on to the section's west edge."""
    c = [tuple(p) for p in L["route"]["centre"]]
    (ax, ay), (bx_, by) = c[0], c[1]
    t = (EXTENT["x0"] - ax) / (bx_ - ax) if bx_ != ax else 0
    return [(EXTENT["x0"], ay + t * (by - ay))] + c + [(EXTENT["x1"], c[-1][1] - 0.6)]


# ---------------------------------------------------------------- build / export

def build(scene, seed=6):
    sb.B = sb.Buckets(strict=True)
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    road = route_road(L)
    cross = [tuple(p) for p in E["S6.road.cross_2970"]["lines"]["centre"]]
    top = [tuple(p) for p in E["S6.road.top_2814"]["lines"]["centre"]]
    h = ground(rng, [(road, 4.2), (cross, 3.6), (top, 1.6)])
    # each part draws from its own seeded stream, so changing one part never re-rolls the others
    for part in (zhengdian, cailou, railings, corner_shop, butcher_shop, incense_shop, compound_ranges, house_at_well,
                 far_row, fence_far, inn, south_houses, well, incense_scaffold):
        part(random.Random(zlib.crc32(part.__name__.encode())))
    props(random.Random(zlib.crc32(b"props")), h)
    vehicles(random.Random(zlib.crc32(b"vehicles")), h)
    figure_seats()
    colliders(L["trees"])

    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0 and me.name.startswith("inner_city__"):
            bpy.data.meshes.remove(me)

    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("inner_city__" + name)
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
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new("g_" + name, me)
        coll.objects.link(ob)
        stats[name] = sum(len(p.vertices) - 2 for p in me.polygons)
    me = bpy.data.meshes.new("inner_city__ground__col")
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
    stats["ground__col"] = sum(len(p.vertices) - 2 for p in me.polygons)   # triangles (the seam cut leaves some)
    owners = dict(sb.B.tris)
    owners["ground"] = owners.get("ground", 0) + stats["ground__col"]
    placed = {"about": "Written by blender/inner_city_scene.py build(); never edit. Triangles per owner: map IDs, 'edge:*' "
                       "(invisible colliders closing the walkable area) and 'ground'. tools/loyalty_check.mjs compares "
                       "it with the map (map/BUILDING.md).",
              "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed, f, indent=1, ensure_ascii=False)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "buckets": stats}


def export(scene, path):
    """Write the raw GLB (street_b1.export_collection: only this collection of this scene, GUI or headless)."""
    return sb.export_collection(scene, COLL, path)
