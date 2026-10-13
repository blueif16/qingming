"""Outer road, part 1 (S4, scan u 9400-12600), walkable web scene, composed from the Song construction kit
(blender/song_kit.py), this area's kit (blender/kit_outer_road.py), the west area's kit (blender/kit_inner_city.py, for
the parts both areas paint) and the workshop's vehicle kit (blender/kit_vehicles.py).

build(scene) creates collection "outer_road_scene": one mesh per (material, collide) bucket, named
"g_<material>__col" / "g_<material>__nocol" (the page collides with every "__col" mesh; "hidden__col" is
collider-only). export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships it.
Built headless: qingming/tools/build_scene.sh outer_road (never in the live GUI, which is the lead's).

Positions come from the scroll map (qingming/map/README.md) through sections/outer_road/layout.json
(tools/map_layout.mjs): X east (away from the city), Y north (depth), Z up, in the one world frame shared with the gate
(origin at S5's moat bridge). derive() reads every place from the layout by map ID. Real size, painted place
(map/BUILDING.md rule 5): heights, storeys, openings and the sizes of things are real; frontages and depths come from
the painted footprints; far up the silk (where the painter draws at about 0.3-0.6 of the street's scale) buildings
keep real heights and take their painted frontage, narrowing a part rather than shrinking it. What the strokes can't
give is a builder choice, marked "choice:" where it is made and listed in sections/outer_road/notes.md.

Loyalty (map/BUILDING.md): one map entity, one model. Every piece of geometry is built inside
`sb.entity(<map id>)`; the bucket set is strict, so untagged geometry is an error. build() writes
sections/outer_road/placed.json (triangles per map ID) for tools/loyalty_check.mjs. Where the scroll paints nothing the
scene has no models: invisible edge walls close the walkable area, and the page paints what lies beyond.
"""
import json
import math
import random

import bpy

import kit_inner_city as ki
import kit_outer_road as ko
import kit_vehicles as kv
import song_kit as k
import street_b1 as sb
from song_kit import V, bx

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
LAYOUT_JSON = QM + r"\sections\outer_road\layout.json"
PLACED_JSON = QM + r"\sections\outer_road\placed.json"
COLL = "outer_road_scene"
UP = V((0, 0, 1))

LAYOUT = {}
E = {}
FIG = {}
WALK = []
EXTENT = {}
H = {}          # the ground height function, set by ground()
FORECOURT = 0.6  # choice: the courier post's forecourt and yard stand on a bank about 0.6 m above the road: its planked
#                  face is 70-78 px on the silk (about 1 m at the map's scale, 0.75 m real), the pollard willows' roots
#                  run down it (map: S4.grd.ditch_11570, t3's note on the forecourt)
DITCH = -0.15    # choice: the ditch's dry bed below the road (no water is painted)


# ---------------------------------------------------------------- the map

def fp(eid):
    return [tuple(p) for p in E[eid]["footprint"]]


def P(eid):
    return tuple(E[eid]["pos"])


def pt(eid, name):
    return tuple(E[eid]["pts"][name])


def dx_at(u):
    """The frame's receding direction at scan u (map/frames/S4.json dx_knots: linear between, constant beyond)."""
    kn = LAYOUT["frames"][0]["dx_knots"]
    if u <= kn[0][0]:
        return kn[0][1]
    for (u0, d0), (u1, d1) in zip(kn, kn[1:]):
        if u <= u1:
            return d0 + (d1 - d0) * (u - u0) / (u1 - u0)
    return kn[-1][1]


def ux(u, D):
    """World X of scan u on the ground at depth D (for members read along a painted front or a wall face)."""
    o = LAYOUT["frames"][0]["origin"]
    return (u - o[0] - dx_at(u) * D) / 77.0


def zv(v, v_foot):
    """Height above a foot at v_foot of a point at v straight above it (77 px per metre, the map's scale)."""
    return (v_foot - v) / 77.0


def line(eid, role):
    return [tuple(p) for p in E[eid]["lines"][role]]


def derive(L):
    E.clear()
    E.update(L["entities"])
    FIG.clear()
    FIG.update({f["id"]: f for f in L["figures"]})
    # the walkable area: the painted area (the S5 seam at u 9400, the inner seam at u 12600 and the silk's edges)
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    xs = [p[0] for p in WALK]
    # 10 m past the outer edges (east, north, south) so the mist (full 9 m out) covers the ground's end (lead, 2026-10-12)
    EXTENT.update(x0=math.floor(min(xs)) - 1, x1=math.ceil(max(xs)) + 16, y0=-21, y1=47)


# ---------------------------------------------------------------- ground

def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def poly_dist(x, y, ln):
    best = 1e9
    for (ax, ay), (bx_, by) in zip(ln, ln[1:]):
        dx, dy = bx_ - ax, by - ay
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - t * dx, y - ay - t * dy))
    return best


def y_on(ln, x):
    """The polyline's y at x (clamped at its ends): for the ditch's banks, which run east-west."""
    if x <= ln[0][0]:
        return ln[0][1]
    for (ax, ay), (bx_, by) in zip(ln, ln[1:]):
        if x <= bx_:
            return ay + (by - ay) * (x - ax) / (bx_ - ax)
    return ln[-1][1]


def x_on(a, b, y):
    return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])


GROUND = {}


def ditch_lines():
    """The ditch's north bank (the forecourt's planked face) and its south bank, west to east: the west stretch's
    curved near bank (its rounded east end at u ~11500 left out: the bed closes there), then straight on to the east
    stretch's near bank past the little bridge."""
    n = line("S4.grd.ditch_11570", "bank_n")
    sw_ = line("S4.grd.ditch_11570", "bank_s_w")[:-1]
    se_ = line("S4.grd.ditch_11570", "bank_s_e")
    return n, sw_ + se_


def ground(rng, roads):
    """Heightfield over the section: low undulation, the roads slightly worn down, the courier post's forecourt and
    yard raised on their bank behind the planked ditch, the ditch's dry bed. One smooth mesh; each vertex carries how
    bare (trodden) it is in a second UV map, and the page blends the ground and road washes along a noisy edge
    (web/src/surface.js). The ground is the painted surface, not a model (owner "ground").
    It stops at the S5 seam (0.5 m past it, dipping 0.12 m toward it, so the gate's own ground lies on top where the
    two meet, as S6 does) and 0.5 m past the S4b seam (part 2's ground dips under it there), and runs 16 m past the
    silk's edges, deep enough under the mist that you never see it end."""
    X0, X1, Y0, Y1 = EXTENT["x0"], EXTENT["x1"], EXTENT["y0"], EXTENT["y1"]
    ph = [rng.uniform(0, 6.283) for _ in range(6)]
    bank_n, bank_s = ditch_lines()
    fx0, fx1 = bank_n[0][0] - 0.7, bank_n[-1][0] + 0.4

    def raise_(x, y):
        w = _smooth(fx0 - 0.9, fx0 + 0.3, x) * (1 - _smooth(fx1 - 0.2, fx1 + 0.8, x))
        yn = y_on(bank_n, x)
        return FORECOURT * w * _smooth(yn - 0.05, yn + 0.45, y)

    def bed(x, y):
        w = _smooth(fx0 - 0.2, fx0 + 0.8, x) * (1 - _smooth(fx1 - 0.6, fx1 + 0.2, x))
        yn, ys = y_on(bank_n, x), y_on(bank_s, x)
        return DITCH * w * _smooth(ys - 0.15, ys + 0.45, y) * (1 - _smooth(yn - 0.4, yn - 0.05, y))

    def h(x, y):
        z = (0.03 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.02 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.012 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = min(poly_dist(x, y, ln) / hw for ln, hw in roads)
        if dr < 1.0:
            z = z * (0.4 + 0.6 * dr) - 0.03 * (1 - dr)
        return z + raise_(x, y) + bed(x, y)

    def bare(x, y):
        wob = 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5]) + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1])
        b = max(1 - _smooth(hw * 0.55, hw * 1.05, poly_dist(x, y, ln) + wob) for ln, hw in roads)
        yn, ys = y_on(bank_n, x), y_on(bank_s, x)
        if fx0 < x < fx1 and ys - 0.2 < y < yn:   # the ditch's bed: bare earth
            b = max(b, 0.8)
        return b

    sw, se, ne, nw = WALK

    def hz(x, y):
        d = x - x_on(sw, nw, y)
        return h(x, y) - 0.12 * (1 - _smooth(-0.5, 1.5, d))

    # the S4b seam (u 12600, the east side, joined 2026-10-12): part 2 (outer_road_2) is built, so this ground stops
    # 0.5 m past the seam on a clean line, the way part 2's own ground stops 0.5 m past it (no 1 m stair-steps): every
    # cell that reaches west of the cut is kept, every vertex east of it moves west onto it, and the triangles that
    # collapse are dropped. Part 2's ground dips 0.12 m toward the seam, so this one lies on top where the two meet:
    # measured on the built grounds, part 2's stays under this one everywhere up to 0.8 m past the seam; at 16 m past,
    # as before the join, part 2's poked through this one in patches (sections/outer_road/notes.md, "Joined with S4b")
    def cut_e(y):
        return x_on(se, ne, y) + 0.5

    nx, ny = X1 - X0, Y1 - Y0
    verts = [V((X0 + i, Y0 + j, 0.0)) for j in range(ny + 1) for i in range(nx + 1)]
    for v in verts:
        v.x = min(v.x, cut_e(v.y))
        v.z = hz(v.x, v.y)
    faces = []
    for j in range(ny):
        for i in range(nx):
            cy0, cy1 = Y0 + j, Y0 + j + 1
            cx, cy = X0 + i + 0.5, Y0 + j + 0.5
            if not (x_on(sw, nw, cy) - 0.5 < cx and X0 + i < max(cut_e(cy0), cut_e(cy1)) - 1e-6):
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
    H["h"] = hz
    return hz


# ---------------------------------------------------------------- a hall on a painted front (shared by the buildings)

def hall(x0, x1, yf, yb, rng, z0=0.0, plinth=0.3, eave=2.9, rise=1.5, cols=None, kinds=None, roof="gable",
         side=("wall", "wall"), back="wall", brackets=False, over=0.5, steps=True, col_r=0.12, lintel=True,
         ornament_s=0.45, plinth_foot=-0.05):
    """A one-storey hall in world coordinates, its front along y = yf facing south (the map's facing 270), x0..x1
    along the front, back wall at yb > yf. z0: the ground under it; plinth: the stone platform's height; eave: column
    height above the floor (real: choice per call). cols: the painted column X along the front (both ends included);
    kinds: each front bay 'wall', 'window', 'door', 'open' (ki.wall_bays). side: (west, east) 'wall' or 'open'; back
    'wall' or 'open'. roof: 'gable' (ridge along x), 'hip', 'xieshan' (ridge along x), 'gable_y' / 'xieshan_y'
    (ridge north-south, gables facing south and north). plinth_foot: how deep the plinth's body reaches (deeper for a
    hall that crosses the S4b seam onto part 2's ground, which dips 0.12 m toward the seam). Returns the top of the
    columns."""
    zt = z0 + plinth
    top = zt + eave
    if plinth > 0.02:
        k.soft_plinth(x0 - 0.3, x1 + 0.3, yf - 0.35, yb + 0.3, zt, rng, z_foot=z0 + plinth_foot)
        if steps:
            xm = (x0 + x1) / 2
            n = max(1, round(plinth / 0.16))
            k.stairs(xm - 0.6, xm + 0.6, yf - 0.35 - 0.3 * n, yf - 0.35, z0, zt, n, rng=rng)
    cols = sorted(cols) if cols else [x0, x1]
    if abs(cols[0] - x0) > 0.05:
        cols = [x0] + cols
    if abs(cols[-1] - x1) > 0.05:
        cols = cols + [x1]
    for x in cols:
        k.column(x, yf, zt, top, r=col_r, mat="timber")
    for x in (x0, x1):
        k.column(x, yb, zt, top, r=col_r, mat="timber")
    W = x1 - x0
    kinds = kinds or ["open"] * (len(cols) - 1)
    fr = [(c - x0) / W for c in cols]
    ki.wall_bays((x0, yf), (x1, yf), zt, top - 0.12, fr, kinds, rng)
    if side[0] == "wall":
        k.board("plaster", True, (x0, yb - 0.1), (x0, yf + 0.12), 0.14, zt, top)
    if side[1] == "wall":
        k.board("plaster", True, (x1, yf + 0.12), (x1, yb - 0.1), 0.14, zt, top)
    if back == "wall":
        k.board("plaster", True, (x1 - 0.1, yb), (x0 + 0.1, yb), 0.14, zt, top)
    # floor boards: they collide (fix-S4, 2026-10-13): the walkable top was the plinth's at zt - 0.015, so people and
    # the player stood 4.5 cm inside the visible boards (S4's shopkeeper_10425: a sole 0.083 m under them)
    k.bx("timber", True, (x0 + 0.08, yf + 0.08, zt), (x1 - 0.08, yb - 0.08, zt + 0.03))
    if lintel:
        k.beam("timber", True, (x0 - 0.15, yf, top - 0.1), (x1 + 0.15, yf, top - 0.1), 0.16, 0.22, 0.03)
        k.beam("timber", False, (x0 - 0.15, yb, top - 0.1), (x1 + 0.15, yb, top - 0.1), 0.14, 0.2, 0.03)
    if brackets:
        for x in cols:
            k.bracket(x, yf, top, (0, -1), s=0.5, mat="timber")
    zr = top + (0.3 if brackets else 0.12)
    D = yb - yf
    if roof == "gable":
        k.gable_roof(x0 - 0.1, x1 + 0.1, yf - 0.8, yb + 0.6, zr, zr + rise, over=over, ornament_s=ornament_s)
        for x in (x0, x1):   # the gable triangles over the side walls
            k.add("plaster", False, [(x, yf - 0.1, top), (x, yb + 0.1, top), (x, (yf + yb) / 2, zr + rise * 0.9)], [(0, 1, 2)])
            k.add("plaster", False, [(x, yb + 0.1, top), (x, yf - 0.1, top), (x, (yf + yb) / 2, zr + rise * 0.9)], [(0, 1, 2)])
    elif roof == "hip":
        k.hip_roof(x0 - 0.65, x1 + 0.65, yf - 0.75, yb + 0.6, zr, zr + rise, lift=0.35, ns=8, nt=4, ornament_s=ornament_s)
    elif roof == "xieshan":
        ki.xieshan_roof(x0 - 0.65, x1 + 0.65, yf - 0.75, yb + 0.6, zr, zr + rise, along="x", ornament_s=ornament_s)
    elif roof in ("gable_y", "xieshan_y"):
        if roof == "xieshan_y":
            ki.xieshan_roof(x0 - 0.6, x1 + 0.6, yf - 0.7, yb + 0.7, zr, zr + rise, along="y", ornament_s=ornament_s)
        else:
            cx, cy = (x0 + x1) / 2, (yf + yb) / 2
            with k.placed(k.frame(cx, cy, 0, 90)):
                k.gable_roof(-D / 2 - 0.1, D / 2 + 0.1, -W / 2 - 0.8, W / 2 + 0.8, zr, zr + rise, over=over,
                             ornament_s=ornament_s)
            for y in (yf, yb):   # the gable triangles facing south and north
                k.add("plaster", False, [(x0 - 0.1, y, top), (x1 + 0.1, y, top), ((x0 + x1) / 2, y, zr + rise * 0.9)], [(0, 1, 2)])
                k.add("plaster", False, [(x1 + 0.1, y, top), (x0 - 0.1, y, top), ((x0 + x1) / 2, y, zr + rise * 0.9)], [(0, 1, 2)])
    return top


def bay_cols(eid, x0, x1, min_w=0.55):
    """The painted columns along a front (the map's `bays`), inside x0..x1, merged where closer than min_w (a bay
    narrower than that can't hold a real opening: narrowed parts, never shrunk ones, map/BUILDING.md rule 5)."""
    xs = sorted(b[0] for b in E[eid].get("bays", []) if x0 - 0.05 <= b[0] <= x1 + 0.05)
    out = [x0]
    for x in xs + [x1]:
        if x - out[-1] >= min_w:
            out.append(x)
    if x1 - out[-1] > 0.05:
        out.append(x1)
    elif out[-1] != x1:
        out[-1] = x1
    return out


# ---------------------------------------------------------------- the top of the silk: houses, the temple, the shop

def top_row(rng):
    """The buildings along the top of the silk, real size on their painted footprints (the painter draws them at
    about 0.3-0.5 of the street's scale: the map reads their eaves 0.7-1.6 m; real eaves here are choices):
    the gabled house, the railing, the temple's gate hall with its shut studded door and two guardian statues behind
    lattice railings, its side door where the monk goes in, the open shop, the roof behind it."""
    # S4.bld.house_9590: open front on thin posts, a lattice window and a low counter in it, a small front gable over
    # its west part (king post). choice: eave 2.6, ridge 1.3 higher (real; the map reads 0.7-0.95)
    sw, se, ne, nw = fp("S4.bld.house_9590")
    x0, x1, yf, yb = sw[0], se[0], sw[1], nw[1]
    with sb.entity("S4.bld.house_9590"):
        cols = bay_cols("S4.bld.house_9590", x0, x1, min_w=0.6)
        kinds = ["open"] * (len(cols) - 1)
        kinds[-1] = "window"
        top = hall(x0, x1, yf, yb, rng, plinth=0.15, eave=2.6, rise=1.3, cols=cols, kinds=kinds, roof="gable",
                   brackets=False, steps=False)
        # the low counter in the open front's east bays
        ki.counter((cols[-3] + 0.1, yf + 0.25), (cols[-2] - 0.1, yf + 0.25), 0.15, 0.85, 0.4, rng)
        # the small front gable over the west part, its king post and tie beam
        gx0, gx1 = x0 - 0.1, x0 + min(1.3, (x1 - x0) * 0.45)
        gm = (gx0 + gx1) / 2
        zg = top + 0.12
        with k.placed(k.frame(gm, yf + 0.4, 0, 90)):
            k.gable_roof(-1.25, 0.6, -(gx1 - gx0) / 2 - 0.15, (gx1 - gx0) / 2 + 0.15, zg + 0.15, zg + 1.05, over=0.2, ornament_s=0.4)
        k.add("plaster", False, [(gx0, yf - 0.8, zg), (gx1, yf - 0.8, zg), (gm, yf - 0.8, zg + 0.95)], [(0, 1, 2)])
        k.add("plaster", False, [(gx1, yf - 0.8, zg), (gx0, yf - 0.8, zg), (gm, yf - 0.8, zg + 0.95)], [(0, 1, 2)])
        k.beam("timber", False, (gx0, yf - 0.82, zg + 0.05), (gx1, yf - 0.82, zg + 0.05), 0.08, 0.1, 0.015)
        k.beam("timber", False, (gm, yf - 0.82, zg + 0.05), (gm, yf - 0.82, zg + 0.9), 0.07, 0.07, 0.01)
    # S4.str.railing_9760: low two-rail railing from the house's east post to the temple's west end
    a, b = pt("S4.str.railing_9760", "sw"), pt("S4.str.railing_9760", "se")
    with sb.entity("S4.str.railing_9760"):
        ko.low_rail_fence([(a[0], a[1]), (max(b[0], fp("S4.bld.temple_gate_hall_9960")[0][0] - 0.1), b[1])], 0.75, rng, rails=2, post_every=0.9)
    # S4.bld.temple_gate_hall_9960 (清净的寺庙): long tiled roof on bracket sets; plain panelled bays west; a lattice
    # window with a guardian statue behind it each side of the shut studded double door; the east bays on a low stone
    # plinth. Columns at the painted bays (merged where a real opening can't fit). choice: columns 2.9 m on a 0.35 m
    # plinth (the map reads the eave 1.55 m, at about 0.4 of the street's scale), hip roof 1.9 m high
    sw, se, ne, nw = fp("S4.bld.temple_gate_hall_9960")
    x0, x1, yf, yb = sw[0], se[0], sw[1], nw[1]
    yb = max(yb, yf + 2.4)   # choice: 2.4 m deep (the painted 1.9 m leaves no room for the statues behind the railing)
    cols = bay_cols("S4.bld.temple_gate_hall_9960", x0, x1, min_w=0.55)
    # which bay holds what, from the painted u of the door's jambs and the windows (map note)
    door = (ux(9990, yf), ux(10063, yf))
    wins = [(ux(9907, yf), ux(9967, yf)), (ux(10070, yf), ux(10128, yf))]
    kinds = []
    for a_, b_ in zip(cols, cols[1:]):
        m = (a_ + b_) / 2
        if door[0] - 0.2 <= m <= door[1] + 0.2:
            kinds.append("shut")
        elif any(w0 - 0.25 <= m <= w1 + 0.25 for w0, w1 in wins):
            kinds.append("window")
        else:
            kinds.append("wall")
    TEMPLE.update(x0=x0, x1=x1, yf=yf, yb=yb, cols=cols, kinds=kinds)
    with sb.entity("S4.bld.temple_gate_hall_9960"):
        z0, zt = 0.0, 0.35
        top = zt + 2.9
        k.soft_plinth(x0 - 0.3, x1 + 0.3, yf - 0.45, yb + 0.3, zt, rng)
        k.stairs(door[0] - 0.1, door[1] + 0.1, yf - 1.05, yf - 0.45, 0, zt, 2, rng=rng)
        for x in cols:
            k.column(x, yf, zt, top, r=0.14)
        for x in (x0, x1):
            k.column(x, yb, zt, top, r=0.14)
        fr = [(c - x0) / (x1 - x0) for c in cols]
        ki.wall_bays((x0, yf), (x1, yf), zt, top - 0.12, fr, [("open" if q == "shut" else q) for q in kinds], rng,
                     sill=0.9, head=top - 0.55)
        for (a_, b_), q in zip(zip(cols, cols[1:]), kinds):
            if q == "shut":   # the shut gate: two studded leaves meeting in the middle
                m = (a_ + b_) / 2
                ko.studded_leaf((a_ + 0.1, yf + 0.06), (m, yf + 0.06), zt, top - 0.55, 0, rng, rows=4, cols=3)
                ko.studded_leaf((b_ - 0.1, yf + 0.06), (m, yf + 0.06), zt, top - 0.55, 0, rng, rows=4, cols=3)
        k.board("plaster", True, (x0, yb - 0.1), (x0, yf + 0.12), 0.14, zt, top)
        k.board("plaster", True, (x1, yf + 0.12), (x1, yb - 0.1), 0.14, zt, top)
        k.board("plaster", True, (x1 - 0.1, yb), (x0 + 0.1, yb), 0.14, zt, top)
        sb.quad("interior", False, (x1 - 0.15, yb - 0.08, zt), (x0 + 0.15, yb - 0.08, zt), (x0 + 0.15, yb - 0.08, top - 0.2),
                (x1 - 0.15, yb - 0.08, top - 0.2))
        k.bx("timber", False, (x0 + 0.08, yf + 0.08, zt), (x1 - 0.08, yb - 0.08, zt + 0.03))
        k.beam("redwood", True, (x0 - 0.15, yf, top - 0.12), (x1 + 0.15, yf, top - 0.12), 0.18, 0.26, 0.03)
        for x in cols:
            k.bracket(x, yf, top, (0, -1), s=0.6)
        for x in [(a_ + b_) / 2 for a_, b_ in zip(cols, cols[1:]) if b_ - a_ > 0.9]:
            k.bracket(x, yf, top, (0, -1), s=0.45)
        k.hip_roof(x0 - 0.7, x1 + 0.7, yf - 0.85, yb + 0.6, top + 0.42, top + 2.3, lift=0.4, ns=12, nt=5, ornament_s=0.9)
    # S4.bld.temple_side_door_10210: the small gate east of the hall: two pairs of thin columns on base blocks, a tiled
    # roof, a narrow doorway with one leaf open, through which the monk goes in. choice: eave 2.6, door 1.0 x 2.1 m
    sw, se, ne, nw = fp("S4.bld.temple_side_door_10210")
    x0, x1, yf, yb = max(sw[0], TEMPLE["x1"] + 0.15), se[0], sw[1], max(nw[1], sw[1] + 1.4)
    with sb.entity("S4.bld.temple_side_door_10210"):
        top = 2.6
        for x in (x0, x1):
            for y in (yf, yb):
                k.column(x, y, 0.0, top, r=0.09, mat="timber")
        xm = (x0 + x1) / 2
        k.board("plaster", True, (x0 + 0.1, yf + 0.5), (xm - 0.5, yf + 0.5), 0.12, 0.0, top)
        k.board("plaster", True, (xm + 0.5, yf + 0.5), (x1 - 0.1, yf + 0.5), 0.12, 0.0, top)
        ko.gate_frame((xm - 0.5, yf + 0.5), (xm + 0.5, yf + 0.5), 2.1, rng, threshold=True)
        ko.studded_leaf((xm - 0.5, yf + 0.5), (xm + 0.5, yf + 0.5), 0.05, 2.1, 70, rng, rows=0, cols=0, ring=True)
        k.board("plaster", False, (xm - 0.5, yf + 0.5), (xm + 0.5, yf + 0.5), 0.12, 2.1, top)
        k.beam("timber", False, (x0 - 0.1, yf, top - 0.1), (x1 + 0.1, yf, top - 0.1), 0.12, 0.18, 0.02)
        k.beam("timber", False, (x0 - 0.1, yb, top - 0.1), (x1 + 0.1, yb, top - 0.1), 0.12, 0.18, 0.02)
        k.gable_roof(x0 - 0.05, x1 + 0.05, yf - 0.55, yb + 0.5, top + 0.08, top + 1.0, over=0.35, ornament_s=0.45)
    # S4.bld.shop_house_10400: open-fronted shop, hipped tiled roof; a plank wall with a small window at its west end;
    # thin posts along the open front; goods inside on a low floor with a hatched step. choice: eave 2.7 (the map reads
    # 1.4 m), ridge 1.3 higher
    sw, se, ne, nw = fp("S4.bld.shop_house_10400")
    x0, x1, yf, yb = sw[0], se[0], (sw[1] + se[1]) / 2, (nw[1] + ne[1]) / 2
    with sb.entity("S4.bld.shop_house_10400"):
        cols = bay_cols("S4.bld.shop_house_10400", x0, x1, min_w=0.8)
        kinds = ["window"] + ["open"] * (len(cols) - 2)
        hall(x0, x1, yf, yb, rng, plinth=0.18, eave=2.7, rise=1.3, cols=cols, kinds=kinds, roof="hip", brackets=False,
             steps=False, col_r=0.09)
        k.stairs(cols[1] + 0.3, cols[-1] - 0.3, yf - 0.55, yf - 0.05, 0.0, 0.18, 1, rng=rng)
    # S4.bld.roof_behind_shop_10500: only its fish-scale tiles show over the shop's ridge (low confidence): a plain
    # tiled house behind the shop. choice: eave 3.4 so that its roof shows over the shop's ridge (4.3 m), as painted
    sw, se, ne, nw = fp("S4.bld.roof_behind_shop_10500")
    x0, x1 = sw[0], se[0]
    yf = max(sw[1], fp("S4.bld.shop_house_10400")[3][1] + 0.35)
    yb = max(nw[1], yf + 2.2)   # choice: 2.2 m deep, its back hidden
    with sb.entity("S4.bld.roof_behind_shop_10500"):
        hall(x0, x1, yf, yb, rng, plinth=0.1, eave=3.4, rise=1.4, kinds=["wall"], roof="gable", brackets=False, steps=False)


TEMPLE = {}


# ---------------------------------------------------------------- the courier post (递铺, 懒兵候主)

WALL_H = 2.4    # choice: the earthen wall's body, real (the map reads 2.7-2.9 m at the street's scale with its spikes)
CREST_H = 0.38  # choice: the crossed stakes on its top (painted about 30 px)


def courier_post(rng):
    """The courier post's front on its bank: the spiked earthen wall west and east of the gate building, the gate with
    its west leaf open inward carrying the posted notice, the planked bank of the ditch in front with the little humped
    bridge, and the two buildings up in the yard. Everything north of the ditch stands on the raised forecourt
    (FORECOURT)."""
    h = H["h"]
    zf = FORECOURT
    # the walls: their painted fronts (D of the face), west end at the willow trunk, east end where the spikes stop
    for eid in ("S4.str.post_wall_w_11470", "S4.str.post_wall_e_11950"):
        sw, se, ne, nw = fp(eid)
        yc = (sw[1] + nw[1]) / 2
        with sb.entity(eid):
            ko.earth_wall((sw[0], yc), (se[0], yc), zf, WALL_H, nw[1] - sw[1], rng)
            ko.stake_crest((sw[0] + 0.1, yc), (se[0] - 0.1, yc), zf + WALL_H, CREST_H, rng)
    # the gate building: west column (u 11585), the framed side panel, the doorway between the jambs at u 11653 and
    # 11830 (2.3 m), the west leaf open inward with the posted notice, the east leaf swung back out of sight; a tiled
    # gable roof 0.8 m deep (painted: a gateway roof only ~0.8 m deep). choice: lintel 2.4 m, eave 3.0 m (real; the map
    # reads 2.2 m and 2.5 m)
    sw, se, ne, nw = fp("S4.bld.post_gatehouse_11730")
    x0, x1, yf, yb = sw[0], se[0], sw[1], nw[1]
    j0, j1 = ux(11653, yf), ux(11830, yf)
    zl, ze = zf + 2.4, zf + 3.0
    POST.update(door=(j0, j1), yf=yf, yb=yb)
    with sb.entity("S4.bld.post_gatehouse_11730"):
        k.soft_box("stone", True, (x0 - 0.15, yf - 0.25, zf - 0.08), (x1 + 0.15, yb + 0.25, zf + 0.06), rng, r=0.05)
        for x in (x0, x1):
            for y in (yf, yb):
                k.column(x, y, zf + 0.06, ze, r=0.12, mat="redwood")
        # the framed side panel west of the doorway and the plain panel east of it
        for a_, b_ in ((x0 + 0.12, j0 - 0.08), (j1 + 0.08, x1 - 0.12)):
            if b_ - a_ > 0.1:
                k.board("plaster", True, (a_, (yf + yb) / 2), (b_, (yf + yb) / 2), 0.12, zf + 0.06, ze)
                k.beam("redwood", False, (a_, yf + 0.25, zf + 0.5), (b_, yf + 0.25, zf + 0.5), 0.06, 0.06, 0.01)
                k.beam("redwood", False, (a_, yf + 0.25, zl - 0.2), (b_, yf + 0.25, zl - 0.2), 0.06, 0.06, 0.01)
        ko.gate_frame((j0, (yf + yb) / 2), (j1, (yf + yb) / 2), zl, rng, threshold=True)
        k.board("plaster", False, (j0, (yf + yb) / 2), (j1, (yf + yb) / 2), 0.12, zl + 0.12, ze)
        jm = (j0 + j1) / 2
        ko.studded_leaf((j0 + 0.04, (yf + yb) / 2), (jm, (yf + yb) / 2), zf + 0.08, zl - 0.02, 62, rng, rows=6, cols=3,
                        notice="notice")
        ko.studded_leaf((j1 - 0.04, (yf + yb) / 2), (jm, (yf + yb) / 2), zf + 0.08, zl - 0.02, 88, rng, rows=6, cols=3)
        k.beam("redwood", True, (x0 - 0.15, yf, ze - 0.1), (x1 + 0.15, yf, ze - 0.1), 0.16, 0.22, 0.03)
        k.beam("redwood", False, (x0 - 0.15, yb, ze - 0.1), (x1 + 0.15, yb, ze - 0.1), 0.14, 0.2, 0.03)
        k.gable_roof(x0 - 0.1, x1 + 0.1, yf - 0.75, yb + 0.7, ze + 0.12, ze + 1.15, over=0.4, ornament_s=0.45)
    # the ditch in front: its north bank faced with planks and capped stakes along the west stretch (u 11140-11510)
    # and the east stretch (u 11895-11995); in the weak middle stretch the forecourt's bank is plain earth (the ground)
    bank_n, _ = ditch_lines()
    west = [p for p in bank_n if p[0] <= ux(11510, p[1]) + 0.3]
    xe0 = ux(11895, bank_n[-1][1])
    east = [(xe0, y_on(bank_n, xe0))] + [p for p in bank_n if p[0] > xe0]
    with sb.entity("S4.grd.ditch_11570"):
        for seg in (west, east):
            if len(seg) >= 2:
                ko.planked_bank(seg, zf + 0.05, zf + 0.05 - DITCH + 0.05, rng, face=1)
    # the little humped bridge straight over the ditch from the road to the forecourt. choice: its four corners squared
    # to its painted west side and deck (the map's est north-east corner falls west of its south-east one)
    sw, se, ne, nw = fp("S4.str.small_bridge_11800")
    bx0, bx1 = (sw[0] + nw[0]) / 2, se[0] - 0.15
    by0, by1 = min(sw[1], se[1]), max(nw[1], ne[1]) - 0.05
    with sb.entity("S4.str.small_bridge_11800"):
        ko.humped_bridge((bx0, by0, h(bx0, by0)), (bx1, by0, h(bx1, by0)), (bx1, by1, zf), (bx0, by1, zf), 0.3, rng)
    # the yard: the west wing and the north hall, real height on their painted footprints (painted at about 0.4 of the
    # street's scale: the map reads their eaves 1.0-1.6 m). choice: eaves 2.8 and 2.9 m
    sw, se, ne, nw = fp("S4.bld.post_west_wing_11650")
    x0, x1, yf, yb = sw[0], se[0], sw[1], max(nw[1], ne[1])
    with sb.entity("S4.bld.post_west_wing_11650"):
        cols = bay_cols("S4.bld.post_west_wing_11650", x0, x1, min_w=0.7)
        kinds = ["open"] * (len(cols) - 1)
        kinds[-1] = "wall"   # the panel of vertical boards between the two nearest columns
        hall(x0, x1, yf, yb, rng, z0=zf, plinth=0.35, eave=2.8, rise=1.3, cols=cols, kinds=kinds, roof="gable",
             brackets=True)
    sw, se, ne, nw = fp("S4.bld.post_north_hall_11970")
    x0, x1, yf, yb = max(sw[0], nw[0]), min(se[0], ne[0]), sw[1], nw[1]
    with sb.entity("S4.bld.post_north_hall_11970"):
        cols = bay_cols("S4.bld.post_north_hall_11970", x0, x1, min_w=0.9)
        if len(cols) < 4:
            cols = [x0 + (x1 - x0) * i / 3 for i in range(4)]
        kinds = ["door"] + ["window"] * (len(cols) - 2)
        hall(x0, x1, yf, yb, rng, z0=zf, plinth=0.3, eave=2.9, rise=1.5, cols=cols, kinds=kinds, roof="gable")
    # the low plank frame in the yard (a low fence, trough or a shed's wall: built as the painted frame)
    a, b = pt("S4.str.yard_frame_12025", "sw"), pt("S4.str.yard_frame_12025", "se")
    with sb.entity("S4.str.yard_frame_12025"):
        ko.low_rail_fence([(a[0], a[1]), (b[0], b[1])], 0.6, rng, rails=2, post_every=0.7)


POST = {}


def courier_props(rng):
    """The soldiers' things on the forecourt: the four spears leaning on the stake crest, the pillow box, the two
    document boxes, the stool by the open leaf, the furled dark banner and the red pole east of the gate, the small dark
    cone on the gate's east post, the saddle on its stand in the yard. Sizes from the painting where measured (/1.3)."""
    h = H["h"]
    yw = fp("S4.str.post_wall_w_11470")[0][1] - 0.05   # the wall's face
    ztop = FORECOURT + WALL_H + CREST_H * 0.6
    for eid, utop in (("S4.prop.spear_11342", 11375), ("S4.prop.spear_11400", 11440), ("S4.prop.spear_11505", 11525),
                      ("S4.prop.spear_11541", 11557)):
        x, y = P(eid)
        top = (ux(utop, yw), yw, ztop)
        with sb.entity(eid):
            ko.spear((x, y, h(x, y)), top, rng, tassel=0.32 if eid.endswith("11541") or eid.endswith("11400") else None)
    x, y = P("S4.prop.pillow_box_11348")
    with sb.entity("S4.prop.pillow_box_11348"):
        ko.document_box(x, y, h(x, y), 0.45, 0.3, 0.22, 4, rng)
    x, y = P("S4.prop.document_box_11581")
    with sb.entity("S4.prop.document_box_11581"):
        ko.document_box(x, y, h(x, y), 0.88, 0.5, 0.45, 0, rng)    # front 88 x 45 px
    x, y = P("S4.prop.document_box_12041")
    with sb.entity("S4.prop.document_box_12041"):
        ko.document_box(x, y, h(x, y), 0.45, 0.32, 0.3, 12, rng)   # 42 x 30 px
    x, y = P("S4.prop.stool_11662")
    with sb.entity("S4.prop.stool_11662"):
        # choice: top 0.435 m, fitted to the soldier seated on it (his sit's seat point 0.430-0.450 m up with his soles
        # on the ground; at 0.45 it sank 1.8 cm into the stool for a tenth of the cycle: fix-S4 2026-10-13)
        ki.stool(x, y, h(x, y), h=0.435, s=0.42)
    x, y = P("S4.prop.furled_dark_banner_11870")
    with sb.entity("S4.prop.furled_dark_banner_11870"):
        # painted upright (its top straight above its foot on the silk), so it stands at its mapped foot, leaning a
        # little back toward the gate's east end. choice: 4.4 m (the pole is ~380 px)
        ko.bamboo_banner((x, y, h(x, y)), (x + 0.1, y + 0.4, FORECOURT + 4.4), rng)
    x, y = P("S4.prop.red_pole_and_spear_11935")
    with sb.entity("S4.prop.red_pole_and_spear_11935"):
        # painted upright from its measured foot to the wall's spike line (u 11933 at both ends): choice 3.9 m
        ko.bamboo_banner((x, y, h(x, y)), (x, y + 0.35, FORECOURT + 3.9), rng, cloth_from=0.55, cloth_len=1.0, mat="cloth_red")
        ko.spear((x + 0.15, y + 0.1, h(x, y)), (x - 0.05, y + 0.45, FORECOURT + 3.4), rng)   # the second thin shaft crossing it
    x, y = P("S4.prop.dark_cone_on_gate_post_11821")
    with sb.entity("S4.prop.dark_cone_on_gate_post_11821"):
        # hung on the gate building's east post: a small dark furled flag (or rolled umbrella) on a peg
        px, py = fp("S4.bld.post_gatehouse_11730")[1][0], POST["yf"] - 0.15
        ko.bamboo_banner((px - 0.05, py, FORECOURT + 1.2), (px - 0.05, py, FORECOURT + 2.6), rng, cloth_from=0.05,
                         cloth_len=1.15, mat="interior")
    x, y = P("S4.prop.saddle_on_stand_11760")
    with sb.entity("S4.prop.saddle_on_stand_11760"):
        ko.saddle_on_stand(x, y, h(x, y), 0, rng)
    x, y = P("S4.prop.post_11410")
    with sb.entity("S4.prop.post_11410"):
        k.post("timber", True, x, y, h(x, y) - 0.1, h(x, y) + 0.7, 0.1, 0.015)
        sb.cyl("timber", False, (x, y, h(x, y) + 0.7), (x, y, h(x, y) + 0.76), 0.08, 0.06, segs=6)


# ---------------------------------------------------------------- south of the road: the row of halls

def south_row(rng):
    """The halls south of the road, seen by the painter mostly as roofs. Each stands on its painted footprint (est
    where hidden) at real height; they face south (their open fronts toward the viewer), their north walls on the
    road's south edge."""
    # S4.bld.south_hall_10330: the big hall with its ridge running away from the road, gables north and south, a
    # hanging fish on the south gable, an open south front with a railing of thin balusters (south of the silk's
    # edge). choice: east wall at X 33.2 (the map's est width puts it over the willow and the leafy shrub painted at its
    # east side, which stand outside it); eave 3.0 (the map reads 3.05), ridge 2.6 higher
    sw, se, ne, nw = fp("S4.bld.south_hall_10330")
    x0, x1, yf, yb = (sw[0] + nw[0]) / 2, 33.2, max(sw[1], se[1]), min(ne[1], nw[1])
    with sb.entity("S4.bld.south_hall_10330"):
        cols = [x0 + (x1 - x0) * i / 3 for i in range(4)]
        top = hall(x0, x1, yf, yb, rng, plinth=0.25, eave=3.0, rise=2.6, cols=cols, kinds=["open"] * 3, roof="gable_y",
                   brackets=False, steps=False, col_r=0.14)
        k.balustrade([(x0 + 0.15, yf - 0.2), (x1 - 0.15, yf - 0.2)], 0.25, h=0.85, spacing=1.15)
        ko.hanging_fish(((x0 + x1) / 2, yf - 0.85, top + 0.3 + 2.6 * 0.82), (0, -1), s=1.0)
        ko.hanging_fish(((x0 + x1) / 2, yb + 0.85, top + 0.3 + 2.6 * 0.82), (0, 1), s=1.0)
    # S4.bld.thatched_hut_10780: a low hut under a rounded thatched roof between the road and the big hall's north end.
    # choice: walls 2.0 m, roof top 4.0 (its painted roof is about 4 m high), east end trimmed to the tiled hall
    sw, se, ne, nw = fp("S4.bld.thatched_hut_10780")
    with sb.entity("S4.bld.thatched_hut_10780"):
        ko.thatch_hut(sw[0], min(se[0], 33.25), sw[1], nw[1], 2.0, 4.0, rng)
    # S4.bld.tiled_hall_11080: a tiled hall whose ridge, with an upturned ornament at its west end, runs east just
    # below the road; the rest hidden by the willow and bamboo. choice: a plain front (wall, door, window: nothing of it
    # is painted), eave 2.9, rise 1.6
    sw, se, ne, nw = fp("S4.bld.tiled_hall_11080")
    x0, x1, yf, yb = max(sw[0], nw[0]), se[0], sw[1], nw[1]
    with sb.entity("S4.bld.tiled_hall_11080"):
        cols = [x0 + (x1 - x0) * i / 3 for i in range(4)]
        hall(x0, x1, yf, yb, rng, plinth=0.3, eave=2.9, rise=1.6, cols=cols, kinds=["wall", "door", "window"], roof="gable",
             brackets=False)
    # S4.bld.small_pavilion_10920: a small pavilion with a gourd-like finial on its roof, at the bottom of the silk
    # among bamboo and willows. choice: 3.0 x 2.4 m on its est footprint, columns 2.6 m, pyramidal-hipped roof
    sw, se, ne, nw = fp("S4.bld.small_pavilion_10920")
    xc, yc = (sw[0] + se[0] + ne[0] + nw[0]) / 4, (sw[1] + nw[1]) / 2
    x0, x1, y0, y1 = xc - 1.5, xc + 1.5, yc - 1.2, yc + 1.2
    with sb.entity("S4.bld.small_pavilion_10920"):
        k.soft_plinth(x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, 0.25, rng)
        for x in (x0, x1):
            for y in (y0, y1):
                k.column(x, y, 0.25, 2.85, r=0.11)
        k.balustrade([(x0, y0 + 0.4), (x0, y1), (x1, y1), (x1, y0 + 0.4)], 0.25, h=0.6, spacing=1.0)
        for a_, b_ in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
            k.beam("redwood", False, (a_[0], a_[1], 2.75), (b_[0], b_[1], 2.75), 0.14, 0.2, 0.02)
        k.hip_roof(x0 - 0.7, x1 + 0.7, y0 - 0.7, y1 + 0.7, 3.0, 4.5, lift=0.45, ns=10, nt=5, ornament_s=0.0001)
        sb.lathe("ridge", False, (xc, yc, 4.4), [(0.16, 0), (0.2, 0.12), (0.13, 0.3), (0.07, 0.38), (0.12, 0.5), (0.1, 0.62),
                                                 (0.03, 0.72), (0.0, 0.76)], segs=8)
    # S4.bld.south_hall_11450: the eating house: a long straight ridge, a big tiled south slope, a lower pent roof of
    # mat over the open front with a beam and a rolled blind, a wall of vertical boards at its east part; tables and
    # benches inside under the roof. choice: west end at X 38.55 (its painted furniture under the eave reaches u 11215,
    # west of the map's est west end, and the tiled hall stands just north-west), eave 3.3, rise 1.8, no plinth (the
    # tables stand on the ground)
    sw, se, ne, nw = fp("S4.bld.south_hall_11450")
    x0, x1, yf, yb = 38.55, se[0], sw[1], nw[1]
    xcol = E["S4.bld.south_hall_11450"]["bays"][0][0]
    with sb.entity("S4.bld.south_hall_11450"):
        cols = [x0, (x0 + xcol) / 2, xcol, x1]
        top = hall(x0, x1, yf, yb, rng, plinth=0.0, eave=3.3, rise=1.8, cols=cols, kinds=["open", "open", "wall"],
                   roof="gable", brackets=False, steps=False)
        # the pent roof of mat over the open bays, on two thin posts, and the rolled blind under the front beam
        zp = top - 0.45
        ki.mat_roof([(x0 + 0.1, yf - 1.3, zp - 0.35), (xcol, yf - 1.3, zp - 0.35), (xcol, yf - 0.05, zp), (x0 + 0.1, yf - 0.05, zp)],
                    0, rng, mat="reed", sag=0.03)
        for x in (x0 + 0.2, xcol - 0.1):
            sb.cyl("bamboo", True, (x, yf - 1.25, 0), (x, yf - 1.25, zp - 0.33), 0.04, segs=6)
        sb.cyl("bamboo", False, (xcol - 0.45, yf - 0.12, top - 0.4), (xcol - 0.05, yf - 0.12, top - 0.4), 0.09, segs=8)
    # S4.bld.south_pavilion_11760: the taller roof east of the eating house, its raised ridge ending in two upturned
    # ornaments and a gable on its east end; a column, the doorway where a person stands, a lattice window. choice:
    # eave 3.4, rise 2.2, hip-gable roof; plinth 0.3 (its stair is S4.str.stair_or_roof_end_11755)
    sw, se, ne, nw = fp("S4.bld.south_pavilion_11760")
    x0, x1, yf, yb = sw[0], se[0], sw[1], nw[1]
    with sb.entity("S4.bld.south_pavilion_11760"):
        cols = [x0, ux(11700, yf), ux(11770, yf), x1]
        hall(x0, x1, yf, yb, rng, plinth=0.3, eave=3.4, rise=2.2, cols=cols, kinds=["wall", "door", "window"], roof="xieshan",
             brackets=True, steps=False, ornament_s=1.0)
    # S4.str.stair_or_roof_end_11755 (low confidence): read as the short stair with a hand rail down from the
    # pavilion's floor in front of its doorway (the person in the doorway stands at its top)
    a, b = pt("S4.str.stair_or_roof_end_11755", "sw"), pt("S4.str.stair_or_roof_end_11755", "se")
    sx0, sx1 = min(a[0], b[0]), max(a[0], b[0])
    with sb.entity("S4.str.stair_or_roof_end_11755"):
        k.stairs(sx0, sx1, yf - 0.95, yf - 0.33, 0.0, 0.3, 2, rng=rng)
        k.beam("timber", False, (sx1 + 0.05, yf - 1.0, 0.85), (sx1 + 0.05, yf - 0.3, 1.15), 0.06, 0.06, 0.01)
        for y, z in ((yf - 1.0, 0.0), (yf - 0.3, 0.3)):
            k.post("timber", False, sx1 + 0.05, y, z, z + 0.88, 0.07, 0.01)
    # S4.bld.south_hall_12100 and S4.bld.south_hall_12350 (placeholders in the map: est footprints that overlap).
    # choice: 12100 from its est west end to X 52.6, 12350 east of it turned to the frame's axes (its painted ridge,
    # -0.56, and eave, -0.26, aren't parallel), ridge north-south between its two gables, the south gable with its
    # hanging fish; its east side open on posts over the stair and the child at the table (the table is part 2's)
    sw, se, ne, nw = fp("S4.bld.south_hall_12100")
    with sb.entity("S4.bld.south_hall_12100"):
        cols = [sw[0] + (52.6 - sw[0]) * i / 3 for i in range(4)]
        hall(sw[0], 52.6, sw[1], nw[1], rng, plinth=0.25, eave=3.2, rise=1.8, cols=cols, kinds=["window", "door", "window"],
             roof="gable", brackets=False)
    x0, x1, yf, yb = 52.75, 58.4, -4.4, 1.4
    with sb.entity("S4.bld.south_hall_12350"):
        # its east end crosses the S4b seam onto part 2's ground, which dips toward the seam: the plinth reaches 0.2 m
        # down so no gap shows under it (joined 2026-10-12)
        top = hall(x0, x1, yf, yb, rng, plinth=0.2, eave=3.3, rise=2.7, cols=[x0, (x0 + x1) / 2, x1], kinds=["wall", "wall"],
                   roof="gable_y", side=("wall", "open"), brackets=False, steps=False, plinth_foot=-0.2)
        for y in (yf + (yb - yf) / 3, yf + 2 * (yb - yf) / 3):
            k.column(x1, y, 0.2, top, r=0.12, mat="timber")
        k.beam("timber", True, (x1, yf, top - 0.1), (x1, yb, top - 0.1), 0.16, 0.22, 0.03)
        for y in (yf + 0.2, yf + (yb - yf) / 3, yf + 2 * (yb - yf) / 3):
            k.bracket(x1, y, top, (1, 0), s=0.5, mat="timber")
        ko.hanging_fish(((x0 + x1) / 2, yf - 0.85, top + 0.12 + 2.7 * 0.82), (0, -1), s=1.1)
        # the stair rail at the open side's south end (painted 12420-12560, v 1620-1780)
        k.stairs(x1 - 1.6, x1 - 0.6, yf - 0.75, yf - 0.3, 0.0, 0.2, 1, rng=rng)


# ---------------------------------------------------------------- the official hall at the east end (most of it in part 2)

def official_hall(rng):
    """S4.bld.official_hall_12530: a hall on a raised floor behind the big gnarled willow, with a railing along its
    floor's front, thin posts, light screen panels at its west end and a stair down at its front. Its south-west corner
    is in part 1; the rest crosses the inner seam (built whole: it is this section's entity). choice: floor 0.45 m,
    eave 2.8 above it (the map reads 2.3 at the street's scale), hip roof"""
    sw, se, ne, nw = fp("S4.bld.official_hall_12530")
    x0, x1, yf, yb = sw[0], se[0], sw[1], nw[1]
    with sb.entity("S4.bld.official_hall_12530"):
        cols = bay_cols("S4.bld.official_hall_12530", x0, x1, min_w=0.9)
        kinds = ["window"] + ["open"] * (len(cols) - 2)
        # most of it stands on part 2's ground, which dips toward the seam: the plinth reaches 0.2 m down (joined 2026-10-12)
        top = hall(x0, x1, yf, yb, rng, plinth=0.45, eave=2.8, rise=1.5, cols=cols, kinds=kinds, roof="hip", brackets=False,
                   steps=False, col_r=0.1, plinth_foot=-0.2)
        k.balustrade([(cols[1] + 0.1, yf - 0.15), (x1, yf - 0.15)], 0.45, h=0.75, spacing=1.2)
        # the stair along the front, rising west to the floor (painted from (12675, 935) up to (12562, 845))
        k.stairs(x0 + 0.1, x0 + 1.1, yf - 1.35, yf - 0.4, 0.0, 0.45, 3, rng=rng)


# ---------------------------------------------------------------- the stalls and things on the road's north side

def stalls(rng):
    """The bridgehead stalls and the things the scroll paints on the open ground north of the road, each at its mapped
    spot. Sizes from the painting where measured (painted near things are drawn at the figures' 1.3x: px / 77 / 1.3),
    else choice."""
    h = H["h"]

    def at(eid):
        x, y = P(eid)
        return x, y, h(x, y)

    # S4.prop.mat_awning_9475: a flat woven-mat sunshade with a grid of battens, tilted toward the viewer, over the
    # stall north of S5's covered cart; mat 245 x 130 px on the silk (front edge u 9356-9576, v ~1040), a prop pole at
    # its front. choice: front edge 2.2 m up, back edge 2.7 m, 2.0 m deep, four bamboo poles
    x, y, z = at("S4.prop.mat_awning_9475")
    xa, xb = ux(9356, y), ux(9576, y)
    with sb.entity("S4.prop.mat_awning_9475"):
        ki.mat_roof([(xa, y, z + 2.2), (xb, y, z + 2.2), (xb + 0.1, y + 2.0, z + 2.7), (xa + 0.1, y + 2.0, z + 2.7)], 0, rng)
        for px, py, pz in ((xa + 0.15, y, 2.2), (xb - 0.15, y, 2.2), (xa + 0.25, y + 1.9, 2.7), (xb - 0.05, y + 1.9, 2.7)):
            sb.cyl("bamboo", True, (px, py, z - 0.05), (px, py, z + pz), 0.04, segs=6)
        k.beam("bamboo", False, (ux(9508, y), y - 0.25, z), (ux(9531, y), y, z + 2.15), 0.04, 0.04, 0)   # the slanting prop
    # S4.prop.awning_goods_9565: on the stall's counter (hidden by the cart): a light lidded box and round white loaves
    x, y, z = at("S4.prop.awning_goods_9565")
    with sb.entity("S4.prop.awning_goods_9565"):
        ki.counter((x - 0.9, y + 0.2), (x + 0.9, y + 0.2), z, 0.85, 0.5, rng)
        k.soft_box("cloth_white", False, (x + 0.1, y, z + 0.85), (x + 0.45, y + 0.3, z + 1.05), rng, r=0.02)
        for i in range(6):
            sb.lathe("cloth_white", False, (x - 0.65 + 0.12 * i, y + 0.15 + 0.06 * (i % 2), z + 0.85),
                     [(0.07, 0), (0.08, 0.03), (0.05, 0.07), (0.0, 0.08)], segs=7)
    # S4.prop.parasol_dark_9715: canopy 270 px across (R 1.35 m), many radiating ribs, tilted toward the viewer
    x, y, z = at("S4.prop.parasol_dark_9715")
    with sb.entity("S4.prop.parasol_dark_9715"):
        ki.umbrella(x, y, z + 2.45, 1.35, rng, tilt=(0.0, 0.22), foot=(x, y + 0.1, z), ribs=18, mat="oilpaper")
    # S4.prop.round_goods_stack_9790: about ten roll-like goods end-on in rows on a low stand
    x, y, z = at("S4.prop.round_goods_stack_9790")
    with sb.entity("S4.prop.round_goods_stack_9790"):
        ko.round_goods_stack(x, y, z, rng, rows=3, n=10, r=0.12)
    # S4.prop.big_basket_10000: a very large round basket heaped with a shaggy brown load: bottom 130 px, heap 180 x
    # 155 px (/1.3: 1.0 m wide, heap 1.2 m high)
    x, y, z = at("S4.prop.big_basket_10000")
    with sb.entity("S4.prop.big_basket_10000"):
        ko.heaped_basket(x, y, z, 0.62, 0.5, 0.75, rng)
    # S4.prop.table_9940 and S4.prop.hanging_goods_9890: the small table under the light parasol with a little rack on
    # it, and the round spotted things hanging from the stall's thin pole (u 9885-9893)
    x, y, z = at("S4.prop.table_9940")
    with sb.entity("S4.prop.table_9940"):
        k.table(x - 0.35, y - 0.25, x + 0.35, y + 0.25, z, h=0.72)
        for dx in (-0.2, 0.2):
            k.post("timber", False, x + dx, y, z + 0.72, z + 1.15, 0.03, 0)
        k.beam("timber", False, (x - 0.22, y, z + 1.12), (x + 0.22, y, z + 1.12), 0.03, 0.03, 0)
    x, y, z = at("S4.prop.hanging_goods_9890")
    with sb.entity("S4.prop.hanging_goods_9890"):
        sb.cyl("bamboo", True, (x, y, z), (x, y, z + 2.4), 0.03, segs=6)
        ko.hanging_gourds(x + 0.08, y, z + 1.75, 3, rng)
    # S4.prop.parasol_light_9970: canopy 250 px (R 1.25 m), light cover with fine ribs, on a tall pole by the table
    x, y, z = at("S4.prop.parasol_light_9970")
    with sb.entity("S4.prop.parasol_light_9970"):
        ki.umbrella(x, y, z + 2.5, 1.25, rng, tilt=(0.0, 0.2), foot=(x, y, z), ribs=20, mat="hemp")
    # S4.prop.mat_awning_10030: the sloping lean-to of mat on battens over the stall east of the trees, its high edge on
    # the north side; the donkey, the bench and the crouching man are under its east end. choice: low edge 2.2 m at its
    # mapped front, high edge 2.9 m at D +4.6 (over the donkey), poles at its corners
    x, y, z = at("S4.prop.mat_awning_10030")
    xa, xb = ux(9860, y), ux(10200, y + 2.0)
    with sb.entity("S4.prop.mat_awning_10030"):
        ki.mat_roof([(xa, y, z + 2.2), (xb, y, z + 2.2), (xb + 0.2, y + 4.6, z + 2.9), (xa + 0.6, y + 4.6, z + 2.9)], 0, rng)
        for px, py, pz in ((xa + 0.2, y + 0.1, 2.2), (xb - 0.15, y + 0.1, 2.2), (xa + 0.7, y + 4.5, 2.9), (xb + 0.05, y + 4.5, 2.9)):
            sb.cyl("bamboo", True, (px, py, h(px, py) - 0.05), (px, py, h(px, py) + pz), 0.045, segs=6)
    x, y, z = at("S4.prop.bench_10180")
    with sb.entity("S4.prop.bench_10180"):
        ki.bench((x - 0.25, y), (x + 0.25, y), z, h=0.42, w=0.24)    # 35-40 px long: a small bench with splayed legs
    # the side road: the thatched stall with its long table, the stand and the arched mat canopy by the sedan chairs
    sw, se, ne, nw = fp("S4.prop.stall_shed_10470")
    with sb.entity("S4.prop.stall_shed_10470"):
        # choice: 1.5 m deep (the map's est back is 0.9 m behind its front), eave 2.3, ridge 2.9
        ko.thatch_shed(sw[0], se[0], sw[1], sw[1] + 1.5, 2.3, 2.9, rng)
    x, y, z = at("S4.prop.long_table_10525")
    with sb.entity("S4.prop.long_table_10525"):
        k.table(x - 0.6, y - 0.22, x + 0.6, y + 0.22, z, h=0.75)   # top 117 px long
    x, y, z = at("S4.prop.stand_10497")
    with sb.entity("S4.prop.stand_10497"):
        k.table(x - 0.3, y - 0.25, x + 0.3, y + 0.25, z, h=0.6)    # top 57 px, legs 65 px
    x, y, z = at("S4.prop.mat_canopy_10555")
    with sb.entity("S4.prop.mat_canopy_10555"):
        ko.arched_canopy((ux(10480, y), y), (ux(10632, y), y), 1.3, z, 1.45, rng)
    x, y, z = at("S4.prop.small_stand_10900")
    with sb.entity("S4.prop.small_stand_10900"):
        k.table(x - 0.2, y - 0.18, x + 0.2, y + 0.18, z, h=0.45)
        k.bale(x, y, z + 0.47, 0.42, 0.32, 0.38, 0.3, "reed")      # the hatched bundle on top
    x, y, z = at("S4.prop.slatted_box_11075")
    with sb.entity("S4.prop.slatted_box_11075"):
        ko.slatted_box(x, y, z, 0.45, 0.4, 0.5, 0, rng, legs=0.12)
    x, y, z = at("S4.prop.tied_bundle_11205")
    with sb.entity("S4.prop.tied_bundle_11205"):
        k.sack(x, y, z, rng, s=1.6, mat="reed")
    # the shop's goods
    x, y, z = at("S4.prop.goods_heap_10345")
    zf = 0.18   # the shop's floor
    with sb.entity("S4.prop.goods_heap_10345"):
        ki.goods_heap(x, y + 0.5, zf, 0.9, 0.6, rng, n=10, mat="reed")
        sb.cyl("cloth_white", False, (x + 0.1, y + 0.9, zf + 0.25), (x + 0.75, y + 0.95, zf + 0.25), 0.22, segs=10)   # the pale roll
    x, y, z = at("S4.prop.basket_10379")
    with sb.entity("S4.prop.basket_10379"):
        ki.round_basket(x, y + 0.15, zf, 0.24, 0.26, rng)
    x, y, z = at("S4.prop.tray_stand_10408")
    with sb.entity("S4.prop.tray_stand_10408"):
        ki.tray_stand(x, y + 0.2, zf, 0.4, 0.4, 0.55, rng)
    # the temple's guardian statues, behind the lattice railings of the gate's side bays (moved 0.6 m in from the
    # front line, build_choices.json moves). choice: seated, 1.5 m tall on a 0.35 m block
    for eid in ("S4.prop.guardian_statue_9942", "S4.prop.guardian_statue_10102"):
        x, y = P(eid)
        with sb.entity(eid):
            ko.guardian_statue(x, y, 0.35, 270, 1.5, rng)


def low_structures(rng):
    """The low fences and the bench-like construction at the bottom edge."""
    h = H["h"]
    a, b = pt("S4.str.rail_fence_10190", "sw"), pt("S4.str.rail_fence_10190", "se")
    with sb.entity("S4.str.rail_fence_10190"):
        ko.low_rail_fence([(a[0], a[1]), (b[0], b[1])], 0.8, rng, rails=4, post_every=0.7)
    # S4.str.forecourt_edge_11390 (low confidence): a plank board on a thick dark beam with short vertical members below
    # it, at the bottom of the silk: built as a long low bench on its painted line. choice: top 0.6 m
    a, b = pt("S4.str.forecourt_edge_11390", "sw"), pt("S4.str.forecourt_edge_11390", "se")
    y = a[1] + 0.35
    with sb.entity("S4.str.forecourt_edge_11390"):
        za = h(a[0], y)
        k.soft_box("deck", True, (a[0] + 0.3, y - 0.3, za + 0.55), (b[0] - 0.4, y + 0.3, za + 0.62), rng, r=0.03)
        k.beam("interior", False, (a[0], y - 0.32, za + 0.48), (b[0], y - 0.32, za + 0.48), 0.1, 0.14, 0.02)
        n = 6
        for i in range(n):
            xx = a[0] + 0.2 + (b[0] - a[0] - 0.4) * i / (n - 1)
            k.post("timber", False, xx, y - 0.3, za - 0.05, za + 0.42, 0.07, 0.01)


# ---------------------------------------------------------------- the fortune-teller (临街神算) and the south furniture

TABLE_H_FORTUNE = 0.83   # choice: see fortune_teller()


def fortune_teller(rng):
    """The fortune-teller's stall by the road: the woven-mat awning on poles sloping down toward the road, its east end
    closed by a bamboo blind behind the big willow; the three hanging signboards 決□, 看命, 神課 (as painted); the long
    table with its cloth apron and papers; the client's stool; the stick lying on the road. Front eave 2.2 m and rear 2.8
    m (real; the map reads 2.5 and 2.8)."""
    h = H["h"]
    sw, se, ne, nw = fp("S4.prop.mat_awning_12066")
    zf, zb = 2.2, 2.8
    with sb.entity("S4.prop.mat_awning_12066"):
        ki.mat_roof([(sw[0], sw[1], h(*sw) + zf), (se[0], se[1], h(*se) + zf), (ne[0], ne[1], h(*ne) + zb),
                     (nw[0], nw[1], h(*nw) + zb)], 0, rng)
        poles = [(ux(12068, sw[1]), sw[1], zf), (ux(12101, sw[1]), sw[1], zf), (ux(12260, sw[1]), sw[1], zf),
                 (se[0] - 0.1, se[1], zf), (nw[0] + 0.1, nw[1], zb), ((nw[0] + ne[0]) / 2, nw[1], zb), (ne[0] - 0.1, ne[1], zb)]
        for px, py, pz in poles:
            sb.cyl("bamboo", True, (px, py, h(px, py) - 0.05), (px, py, h(px, py) + pz), 0.045, segs=6)
        ko.bamboo_blind((se[0] - 0.05, se[1] + 0.05), (ne[0] - 0.05, ne[1] - 0.05), h(*se) + 0.1, h(*se) + zf + 0.2, rng)
    yb = (nw[1] + sw[1]) / 2 + 0.55   # the signs hang under the awning behind the fortune-teller (their bases est)
    for eid, sign in (("S4.prop.sign_left_12207", "jue"), ("S4.prop.sign_kanming_12266", "kanming"),
                      ("S4.prop.sign_shenke_12335", "shenke")):
        x, _ = P(eid)
        with sb.entity(eid):
            # boards 21-27 x 47-60 px: choice 0.28 x 0.7 m, hung from the awning's underside
            ko.hanging_sign((x - 0.14, yb), (x + 0.14, yb), h(x, yb) + 2.42, 0.7, sign, rng, cord=0.12)
    sw_, se_, ne_, nw_ = fp("S4.prop.table_12183")
    with sb.entity("S4.prop.table_12183"):
        x0, x1, y0, y1 = sw_[0], se_[0], sw_[1], max(nw_[1], sw_[1] + 0.55)
        z = h(x0, y0)
        # choice: top 0.83 m, fitted to the seated fortune-teller's reach (write~table, both palms on it: at 0.8 his
        # left arm stopped 2.5 cm short; fix-S4 2026-10-13); the client's forearms rest on it too (listen~table)
        # its top TABLE_H_FORTUNE over the ground where he sits (the ground under the table dips 2.8 cm west to east)
        f = FIG["fortune_teller_12232"]
        th = h(f["X"], f["D"] + 0.15) + TABLE_H_FORTUNE - z
        k.table(x0, y0, x1, y1, z, h=th)
        ki.quad2("cloth_indigo", V((x0 + 0.02, y0 - 0.03, z + 0.12)), V((x1 - 0.02, y0 - 0.03, z + 0.12)),
                 V((x1 - 0.02, y0 - 0.03, z + th - 0.03)), V((x0 + 0.02, y0 - 0.03, z + th - 0.03)))
        for i in range(3):
            xx = x0 + 0.35 + 0.45 * i
            sb.quad("cloth_white", False, (xx, y0 + 0.12, z + th + 0.005), (xx + 0.3, y0 + 0.14, z + th + 0.005),
                    (xx + 0.28, y0 + 0.36, z + th + 0.005), (xx - 0.02, y0 + 0.34, z + th + 0.005))
    # the fortune-teller is painted seated behind the table, his seat hidden by it: the seat is part of his figure
    # (map/BUILDING.md rule 3). choice (fitted to his body, fix-S4 2026-10-13): the stool under his seat point in his
    # write~table clip (he stands 0.15 m north of his painted foot, which lay on the table's edge; the seat point is
    # 0.03 m behind his root and 0.09 m to its right, i.e. west), its top 0.44 m (the clip's seat point 0.449 m up)
    f = FIG["fortune_teller_12232"]
    sx, sy = f["X"] - 0.09, f["D"] + 0.18
    with sb.entity("S4.fig.fortune_teller_12232"):
        ki.stool(sx, sy, h(sx, sy), h=0.44, s=0.36)
    # the client's stool (recorded move: under his seat at the table's west end); choice: top 0.41 m, fitted to his
    # listen~table seat point (0.417 m up with his soles on the ground)
    x, y = P("S4.prop.stool_12132")
    with sb.entity("S4.prop.stool_12132"):
        ki.stool(x, y, h(x, y), h=0.41, s=0.3)
    x, y = P("S4.prop.stick_on_road_12260")
    with sb.entity("S4.prop.stick_on_road_12260"):
        z = h(x, y) + 0.025
        k.beam("bamboo", False, (x - 0.5, y + 0.35, z), (x + 0.45, y - 0.4, z), 0.035, 0.035, 0)
    x, y = P("S4.prop.slatted_crate_12576")
    with sb.entity("S4.prop.slatted_crate_12576"):
        ko.slatted_box(x, y, h(x, y), 0.6, 0.45, 0.42, 0, rng)
    # the striped banner on its pole frame by the road (pole cap to its est foot 354 px: choice 4.0 m real; cloth 150 x
    # 80 px: 1.5 x 0.8 m), its crossbar slanting up to the east
    x, y = P("S4.prop.banner_frame_11895")
    with sb.entity("S4.prop.banner_frame_11895"):
        ko.striped_banner((x, y, h(x, y)), 4.0, (1.0, 0.25), rng, cloth_w=0.8, cloth_h=1.5)
    # the big dark parasol near the inner seam: canopy 222 px across (R 1.1 m), its pole leaning from its est foot
    # toward its painted top
    x, y = P("S4.prop.parasol_12572")
    with sb.entity("S4.prop.parasol_12572"):
        z = h(x, y)
        ki.umbrella(x - 0.45, y + 0.1, z + 2.5, 1.1, rng, tilt=(0.05, 0.25), foot=(x, y, z), ribs=16, mat="oilpaper")


def south_furniture(rng):
    """The tables, benches and stools of the eating house and the bench by the small pavilion, each at its spot.
    Sizes /1.3 from the painting (large table top ~100 px, legs 47 px; small stand 50 x 45 px)."""
    h = H["h"]

    def at(eid):
        x, y = P(eid)
        return x, y, h(x, y)

    sw, se, ne, nw = fp("S4.prop.table_11292")
    with sb.entity("S4.prop.table_11292"):
        k.table(sw[0], sw[1], se[0], max(nw[1], sw[1] + 0.7), h(*sw), h=0.78)
    for eid, L_ in (("S4.prop.table_11385", 0.7), ("S4.prop.table_11515", 0.65)):
        x, y, z = at(eid)
        with sb.entity(eid):
            k.table(x - L_ / 2, y - L_ / 2, x + L_ / 2, y + L_ / 2, z, h=0.75)
    for eid, a_, b_ in (("S4.prop.bench_11215", (-0.55, 0.15), (0.55, -0.15)), ("S4.prop.bench_11435", (0.0, -0.6), (0.0, 0.6)),
                        ("S4.prop.bench_10945", (-0.6, 0.0), (0.6, 0.0))):
        x, y, z = at(eid)
        with sb.entity(eid):
            ki.bench((x + a_[0], y + a_[1]), (x + b_[0], y + b_[1]), z, h=0.45, w=0.26)
    x, y, z = at("S4.prop.slatted_stand_11243")
    with sb.entity("S4.prop.slatted_stand_11243"):
        ko.slatted_box(x, y, z, 0.45, 0.4, 0.45, 0, rng, legs=0.1, lid=True)
    x, y, z = at("S4.prop.slatted_stool_11302")
    with sb.entity("S4.prop.slatted_stool_11302"):
        ko.slatted_box(x, y, z, 0.4, 0.35, 0.5, 0, rng, legs=0.08, lid=True)
    x, y, z = at("S4.prop.slatted_box_11355")
    with sb.entity("S4.prop.slatted_box_11355"):
        ko.slatted_box(x, y, z, 0.42, 0.38, 0.48, 0, rng, legs=0.0, lid=True)


# ---------------------------------------------------------------- vehicles

def team(*eids):
    """A cart's team from the map: each animal between its fore and hind hooves, facing hind -> fore."""
    out = []
    for eid in eids:
        a = E[eid]["pts"]
        (fx, fd, _), (hx, hd, _) = a["fore"], a["hind"]
        # a recorded move (build_choices.json) already moves the whole animal, hooves too (tools/map_layout.mjs)
        out.append(((fx + hx) / 2, (fd + hd) / 2, math.degrees(math.atan2(fd - hd, fx - hx)), "ox"))
    return out


SEDAN_POLE_FIT = 1.47   # choice: see vehicles(); the bearers' shoulder top in sedan_carry~pole + the pole's radius
SEDAN_POLE_HANDS = 1.25   # choice: the west chair's front ends in its front bearer's hands (sedan_carry~pole_ends)


def vehicles(rng):
    """The second covered ox cart (kit covered_ox_cart) with its two legible oxen, and the two sedan chairs carried
    west (kit sedan_chair, carried). S5's covered cart, whose team is mapped here, is built by the gate builder."""
    h = H["h"]
    v = E["S4.veh.covered_ox_cart_10550"]["pts"]
    with sb.entity("S4.veh.covered_ox_cart_10550"):
        kv.covered_ox_cart(front=tuple(v["front"][:2]), rear=tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])],
                           team=team("S4.ani.ox_shaft_10712", "S4.ani.ox_lead_10872"), z_of=h, rng=random.Random(10550))
    # the chairs: their poles at shoulder height on the bearers, from their painted west ends to their painted east
    # ends (the west chair's u ~10460-10715, the east chair's from the middle bearer, u ~10735, to the rear bearer, u
    # ~11005), each cabin at its painted place along them (kit cabin_at, a fraction from the rear (east) end).
    # choice: the west chair's poles end at u 10500, 0.5 m short of their painted end, so that its front bearer stands
    # clear of the dark horse beside him at real size
    # choice (details pass, fix-S4, 2026-10-13; gen/details/contacts/fix_s4/notes.md): the two chairs' poles meet at u
    # 10725, over the shoulders of the two middle bearers who carry both (the straining bearer "under the poles between
    # the two chairs, the pole across his shoulder"; painted ends u 10715 and 10735), so no pole end hangs unsupported;
    # and the poles are fitted to their bearers (kit pole_fit): each end's axis over the ground under it at the
    # bearer's shoulder-top height in his carry clip (sedan_carry~pole holds it at 1.432 m with his soles on the ground:
    # characters/ik_variants.json "pole", gen/details/joints_proposed/bearer.json) plus the pole's radius 0.038, 1.470 m
    # (the kit's pole_h 1.3 had them 0.07-0.13 m under the shoulder tops); the west chair's front (west) ends at 1.25
    # m, in the hands of its front bearer, who stands between them "bending ... as if about to lift them"
    # (sedan_carry~pole_ends)
    for eid, (u0, u1), fit in (("S4.veh.sedan_chair_10623", (10500, 10725), (SEDAN_POLE_FIT, SEDAN_POLE_HANDS)),
                               ("S4.veh.sedan_chair_10810", (10725, 11005), SEDAN_POLE_FIT)):
        p = E[eid]["pts"]
        xc, yc = (p["front"][0] + p["rear"][0]) / 2, (p["front"][1] + p["rear"][1]) / 2
        xf, xr = ux(u0, yc), ux(u1, yc)
        with sb.entity(eid):
            kv.sedan_chair(front=(xf, yc), rear=(xr, yc), z_of=h, rng=random.Random(int(xc * 100)), carried=True,
                           cabin_at=(xr - xc) / (xr - xf), pole_fit=fit)


# ---------------------------------------------------------------- colliders and the road

def colliders(trees):
    """Invisible colliders: one wall per side of the walkable area (the painted area: the S5 seam west, the inner seam
    at u 12600 east, the silk's edges), each its own mesh so a joined world drops the walls on a seam with a loaded
    neighbour (web/src/world.js); and each tree's trunk (part of the tree), not for low bushes and clumps."""
    for side, (xa, ya), (xb, yb) in zip(("south", "east", "north", "west"), WALK, WALK[1:] + WALK[:1]):
        with sb.entity(f"edge:{side}"):
            k.board("hidden", True, (xa, ya), (xb, yb), 0.1, -2.0, 4.0)
    h = H["h"]
    for t in trees:
        if (t.get("height_m") or 0) < 3.0:
            continue
        x, d, s = t["X"], t["D"], t["scale"]
        with sb.entity(t["map_id"]):
            z = h(x, d)
            sb.cyl("hidden", True, (x, d, z), (x + 0.12 * s, d + 0.08 * s, z + 2.5 * s), 0.3 * s, segs=8)


def roads(L):
    """The trodden bands for the ground: the main road's centre line carried on past both ends, the side open ground
    and the path along the house fronts at the top, each with a half width (choice: the painted open ground's)."""
    c = [tuple(p) for p in L["route"]["centre"]]
    (ax, ay), (bx_, by) = c[0], c[1]
    head = (ax - (bx_ - ax) * 2, ay - (by - ay) * 2)
    (ax, ay), (bx_, by) = c[-2], c[-1]
    tail = (bx_ + (bx_ - ax) * 2, by + (by - ay) * 2)
    return [([head] + c + [tail], 4.5), (line("S4.road.side_ground_10400", "centre"), 3.0),
            (line("S4.road.top_path_9900", "centre"), 1.3)]


# ---------------------------------------------------------------- build / export

def build(scene, seed=12):
    sb.B = sb.Buckets(strict=True)
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    ground(rng, roads(L))
    top_row(rng)
    courier_post(rng)
    courier_props(rng)
    south_row(rng)
    official_hall(rng)
    stalls(rng)
    low_structures(rng)
    fortune_teller(rng)
    south_furniture(rng)
    vehicles(rng)
    colliders(L["trees"])

    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0 and me.name.startswith("outer_road__"):
            bpy.data.meshes.remove(me)

    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("outer_road__" + name)
        me.from_pydata([tuple(v) for v in b["v"]], [], b["f"])
        me.validate()
        if len(me.polygons) != len(b["f"]):
            # validate() dropped degenerate faces, so the explicit UVs no longer line up: box UVs for this bucket
            print(f"WARNING bucket {name}: {len(b['f']) - len(me.polygons)} degenerate faces dropped; box UVs used", flush=True)
            b["uv"] = [None] * len(me.polygons)
        tile = sb.MATERIALS[mat_name][1]
        uvl = me.uv_layers.new(name="UVMap")
        for poly, explicit in zip(me.polygons, b["uv"]):
            for kk, li in enumerate(poly.loop_indices):
                if explicit and kk < len(explicit):
                    uvl.data[li].uv = explicit[kk]
                else:
                    uvl.data[li].uv = sb.box_uv(me.vertices[me.loops[li].vertex_index].co, poly.normal, tile)
        me.materials.append(sb.make_material(mat_name))
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new("g_" + name, me)
        coll.objects.link(ob)
        stats[name] = sum(len(p.vertices) - 2 for p in me.polygons)
    # the ground: one smooth mesh, UVMap = world position / tile, Blend.x = how bare
    me = bpy.data.meshes.new("outer_road__ground__col")
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
    placed = {"about": "Written by blender/outer_road_scene.py build(); never edit. Triangles per owner: map IDs, 'edge:*' "
                       "(invisible colliders closing the walkable area) and 'ground'. tools/loyalty_check.mjs compares "
                       "it with the map (map/BUILDING.md).",
              "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed, f, indent=1, ensure_ascii=False)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "buckets": stats}


def export(scene, path):
    """Write the raw GLB (street_b1.export_collection: only this collection of this scene, GUI or headless)."""
    return sb.export_collection(scene, COLL, path)
