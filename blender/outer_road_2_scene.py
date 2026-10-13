"""Outer road, part 2 (S4b, scan u 12600-15500): the outer road east to the moorings, a walkable web scene and the pilot
for boats and water. Composed from the Song construction kit (blender/song_kit.py), this area's kit
(blender/kit_outer_road_2.py), part 1's and the west area's kits (kit_outer_road.py, kit_inner_city.py), the vehicle
kit (kit_vehicles.py) and the boat kit's water (kit_boats.water_strip; the boats themselves ship in their own GLB from
the layout through blender/build_boats.py, with their options in sections/outer_road_2/build_choices.json `boats`).

build(scene) creates collection "outer_road_2_scene": one mesh per (material, collide) bucket ("g_<material>__col" /
"g_<material>__nocol"; "hidden__col" is collider-only), the ground, and the river's water strip. export(scene, path)
writes the raw GLB; tools/export_web_scene.mjs ships it (and the boats GLB). Built headless only:
qingming/tools/build_scene.sh outer_road_2.

Positions come from the scroll map through sections/outer_road_2/layout.json (tools/map_layout.mjs, with the recorded
moves of build_choices.json): X east, Y north (depth), Z up, in the one world frame (origin at S5's moat bridge).
Real size, painted place (map/BUILDING.md rule 5): heights, storeys, openings and the sizes of things are real;
frontages and depths come from the painted footprints; buildings far up the silk keep real heights. What the strokes
can't give is a builder choice, marked "choice:" where it is made and listed in sections/outer_road_2/notes.md.

Loyalty: every piece of geometry is built inside `sb.entity(<map id>)` (strict buckets); build() writes
sections/outer_road_2/placed.json for tools/loyalty_check.mjs. Where nothing is painted, invisible edge walls close the
walkable area and the page paints what lies beyond.
"""
import json
import math
import os
import random

import bpy

import kit_boats as kb
import kit_inner_city as ki
import kit_outer_road as ko
import kit_outer_road_2 as k2
import kit_vehicles as kv
import song_kit as k
import street_b1 as sb
from song_kit import V

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SEC = QM + r"\sections\outer_road_2"
LAYOUT_JSON = SEC + r"\layout.json"
PLACED_JSON = SEC + r"\placed.json"
FRAME_JSON = QM + r"\map\frames\S4b.json"
SEATS_JSON = QM + r"\gen\sections\outer_road_2\seats.json"
COLL = "outer_road_2_scene"
UP = V((0, 0, 1))

LAYOUT, E, FIG, WALK, EXTENT, H, RIVER = {}, {}, {}, [], {}, {}, {}

# choice (build_choices.json how S4b.water.bian_river): the far shore and the far bank built 5.5 m north of their
# mapped lines along the frame's receding direction, the cove's north-west shore carried on to meet them, so the six
# moored hulls fit at real size (at least 0.6 of their types); both shores run on 16 m east past the S3 seam (they
# shape the banks there). Since S3 joined (2026-10-12, the join agent) the water strip stops on the seam and the ground
# 0.5 m past it, where S3's own water and banks take over (S3's shores start exactly on S4b's at u 15500)
FAR_DD = 5.5
SEAM_K = -31.6 / 77.0          # dX per dD along the frame's receding direction (u constant)
RUN_ON = 16.0
# choice: the near shore's run-on past the S3 seam follows S3's mapped near shore (sections/rainbow_bridge/layout.json,
# S3.water.bian_west_15500 shore_s, read 2026-10-12; copied, not read at build time), so the big cabin boat's stern,
# which runs 3-6 m past the seam at real size, floats where S3 paints water; its bank top 1.4 m inland of it
S3_NEAR_SHORE = [(88.39, 14.11), (90.81, 13.54), (93.13, 13.25), (95.92, 13.15), (98.93, 13.05), (102.59, 12.08),
                 (105.5, 11.9)]
TEA_FLOOR = 0.18               # the frame's support `tea house floor` (the platform's front face, 14 px)
# part 1's S4.bld.south_hall_12350 floor boards' top (outer_road_scene.py: plinth 0.2 + boards 0.03, they collide), on
# which S4b.prop.table_12645 stands under that hall's open east side (fix-s4b, details pass 2026-10-13)
S4_HALL_FLOOR = 0.23


# ---------------------------------------------------------------- the map

def fp(eid):
    return [tuple(p) for p in E[eid]["footprint"]]


def P(eid):
    return tuple(E[eid]["pos"][:2])


def pt(eid, name):
    return tuple(E[eid]["pts"][name])


def line(eid, role):
    return [tuple(p[:2]) for p in E[eid]["lines"][role]]


def ux(u, D):
    """World X of scan u on the ground at depth D (dx 31.6 everywhere in S4b: the frame's one knot)."""
    o = LAYOUT["frames"][0]["origin"]
    return (u - o[0] - 31.6 * D) / 77.0


def derive(L):
    E.clear()
    E.update(L["entities"])
    FIG.clear()
    FIG.update({f["map_id"]: f for f in L["figures"]})
    FIG.update({f["id"]: f for f in L["figures"]})
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    xs = [p[0] for p in WALK]
    # the ground: 0.5 m past the part 1 seam (west), 16 m past the other edges (east: S3 not built; north and south:
    # under the mist); y to 16 m past the moved far bank
    EXTENT.update(x0=math.floor(min(xs)) - 1, x1=math.ceil(max(xs)) + 17, y0=-21, y1=52)


def x_on(a, b, y):
    return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])


def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ((dx * dx + dy * dy) or 1.0)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def poly_dist(p, ln):
    return min(seg_dist(p, a, b) for a, b in zip(ln, ln[1:]))


def pip(p, poly):
    x, y = p
    ins = False
    for (ax, ay), (bx_, by) in zip(poly, poly[1:] + poly[:1]):
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx_ - ax) / (by - ay):
            ins = not ins
    return ins


def front_frame(eid, min_depth=2.2, max_depth=None, yaw=None):
    """A building's own frame on its painted front (sw -> se): origin at sw, x along the front, y back (north); returns
    (origin, yaw_deg, W, depth). yaw=0 squares it to the frame's axes (part 1's way for the south row)."""
    sw, se, ne, nw = fp(eid)
    if yaw is None:
        yaw = math.degrees(math.atan2(se[1] - sw[1], se[0] - sw[0]))
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    W = (se[0] - sw[0]) * c + (se[1] - sw[1]) * s
    back = ((ne[0] + nw[0]) / 2, (ne[1] + nw[1]) / 2)
    dp = -(back[0] - sw[0]) * s + (back[1] - sw[1]) * c
    dp = max(min_depth, dp)
    if max_depth:
        dp = min(dp, max_depth)
    return sw, yaw, W, dp


# ---------------------------------------------------------------- the river and its banks

def river_lines():
    """The water entity's shores as built (how: S4b.water.bian_river): the near shore with its north-west end carried
    on north along the receding direction to the moved far shore, the far shore moved, both run on 16 m east."""
    w = E["S4b.water.bian_river"]
    ss = line("S4b.water.bian_river", "shore_s")      # north-west end first, then south and east to the seam
    sn = line("S4b.water.bian_river", "shore_n")      # west to east
    mv = lambda p: (p[0] + SEAM_K * FAR_DD, p[1] + FAR_DD)  # noqa: E731
    snm = [mv(p) for p in sn]
    ext = [(ss[0][0] + SEAM_K * FAR_DD * f, ss[0][1] + FAR_DD * f) for f in (1.0, 0.66, 0.33)]
    near = ext + ss + [(x, y) for x, y in S3_NEAR_SHORE if x > ss[-1][0] + 0.5]
    far = snm + [(snm[-1][0] + RUN_ON, snm[-1][1])]
    nb = line("S4b.grd.near_bank_14850", "bank_top")
    nb_ext = [(nb[0][0] + SEAM_K * FAR_DD * f, nb[0][1] + FAR_DD * f) for f in (1.0, 0.66, 0.33)]
    near_top = nb_ext + nb + [(x, y - 1.4) for x, y in S3_NEAR_SHORE if x > nb[-1][0] + 0.5]
    fb = [mv(p) for p in line("S4b.grd.far_bank_15330", "bank_top")]
    far_top = fb + [(fb[-1][0] + RUN_ON, fb[-1][1])]
    poly = list(near) + list(reversed(far))
    RIVER.update(near=near, far=far, near_top=near_top, far_top=far_top, poly=poly, H=w["H"])
    ent = dict(w)
    ent["lines"] = {"shore_s": [list(p) for p in near], "shore_n": [list(p) for p in far]}
    return ent


# ---------------------------------------------------------------- ground

def ground(rng, roads):
    """Heightfield over the section: low undulation, the roads worn down, the near bank falling from its mapped top to
    the water's H at its mapped shore (a sandy slope; steep where the two lines meet, at the bank path), the river bed
    under the water, the far bank the same. Cells within 3 m of a shore are 0.5 m (crack-free 1 m cells elsewhere).
    The ground is the painted surface, not a model (owner "ground"; the banks are their grd entities' ground). It stops
    0.5 m past the part 1 seam (dipping 0.12 m toward it, so part 1's ground lies on top) and 0.5 m past the S3 seam
    (S3's ground dips 0.12 m under it there; cut on a clean line since S3 joined), and runs 16 m past the silk's edges
    under the mist."""
    X0, X1, Y0, Y1 = EXTENT["x0"], EXTENT["x1"], EXTENT["y0"], EXTENT["y1"]
    ph = [rng.uniform(0, 6.283) for _ in range(6)]
    WH = RIVER["H"]
    near, far, ntop, ftop, poly = RIVER["near"], RIVER["far"], RIVER["near_top"], RIVER["far_top"], RIVER["poly"]

    def bank_w(p, shore, top):
        # the bank's width here: from the nearest shore point to the bank-top line (at least 0.35 m)
        best, q = 1e9, None
        for a, b in zip(shore, shore[1:]):
            d = seg_dist(p, a, b)
            if d < best:
                dx, dy = b[0] - a[0], b[1] - a[1]
                t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ((dx * dx + dy * dy) or 1)))
                best, q = d, (a[0] + t * dx, a[1] + t * dy)
        return best, max(0.35, poly_dist(q, top))

    def h(x, y):
        z = (0.03 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.02 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.012 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = min(poly_dist((x, y), ln) / hw for ln, hw in roads)
        if dr < 1.0:
            z = z * (0.4 + 0.6 * dr) - 0.03 * (1 - dr)
        p = (x, y)
        if pip(p, poly):          # under the water: down from the shore to the bed
            ds = min(poly_dist(p, near), poly_dist(p, far))
            return WH - 0.05 - 0.9 * _smooth(0.0, 2.0, ds)
        for shore, top in ((near, ntop), (far, ftop)):
            ds, w = bank_w(p, shore, top)
            if ds < w + 0.6:
                t = _smooth(0.0, w, ds)
                return WH + (z - WH) * t
        return z

    def bare(x, y):
        wob = 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5]) + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1])
        b = max(1 - _smooth(hw * 0.55, hw * 1.05, poly_dist((x, y), ln) + wob) for ln, hw in roads)
        ds = min(poly_dist((x, y), near), poly_dist((x, y), far))
        return max(b, 0.85 * (1 - _smooth(0.5, 2.5, ds)))   # the wet sandy bank

    sw, se, ne, nw = WALK

    def hz(x, y):
        d = x - x_on(sw, nw, y)
        return h(x, y) - 0.12 * (1 - _smooth(-0.5, 1.5, d))

    # the S3 seam (u 15500, the east side, joined 2026-10-12): S3 (rainbow_bridge) is built, so this ground stops 0.5 m
    # past the seam on a clean line, as S3's own ground stops 0.5 m past it: every cell that reaches west of the cut is
    # kept, every vertex east of it moves west onto it, and the faces that collapse are dropped (as part 1 did at the
    # S4b seam)
    def cut_e(y):
        return x_on(se, ne, y) + 0.5

    # cells: 1 m, or 0.5 m within 3 m of a shore; a 1 m cell beside a fine one takes the shared midpoints (a fan)
    nx, ny = X1 - X0, Y1 - Y0
    shores = [near, far, ntop, ftop]

    def fine(i, j):
        c = (X0 + i + 0.5, Y0 + j + 0.5)
        return min(poly_dist(c, ln) for ln in shores) < 3.0

    def inside(i, j):
        cx, cy = X0 + i + 0.5, Y0 + j + 0.5
        if not (x_on(sw, nw, cy) - 0.5 < cx and X0 + i < max(cut_e(cy - 0.5), cut_e(cy + 0.5)) - 1e-6):
            return False
        # skip cells well inside the water (the opaque water hides them)
        if pip((cx, cy), poly) and min(poly_dist((cx, cy), near), poly_dist((cx, cy), far)) > 2.6:
            return False
        return True

    keep = {(i, j) for j in range(ny) for i in range(nx) if inside(i, j)}
    fn = {(i, j) for (i, j) in keep if fine(i, j)}
    vid, verts = {}, []

    def v(a, b):   # lattice point (a, b) in half metres
        if (a, b) not in vid:
            vid[(a, b)] = len(verts)
            x, y = X0 + a / 2, Y0 + b / 2
            x = min(x, cut_e(y))
            verts.append(V((x, y, hz(x, y))))
        return vid[(a, b)]
    faces = []
    for (i, j) in keep:
        a, b = 2 * i, 2 * j
        if (i, j) in fn:
            for di in (0, 1):
                for dj in (0, 1):
                    faces.append((v(a + di, b + dj), v(a + di + 1, b + dj), v(a + di + 1, b + dj + 1), v(a + di, b + dj + 1)))
            continue
        nb = {"s": (i, j - 1) in fn, "e": (i + 1, j) in fn, "n": (i, j + 1) in fn, "w": (i - 1, j) in fn}
        if not any(nb.values()):
            faces.append((v(a, b), v(a + 2, b), v(a + 2, b + 2), v(a, b + 2)))
            continue
        ring = [(a, b)] + ([(a + 1, b)] if nb["s"] else []) + [(a + 2, b)] + ([(a + 2, b + 1)] if nb["e"] else []) + \
            [(a + 2, b + 2)] + ([(a + 1, b + 2)] if nb["n"] else []) + [(a, b + 2)] + ([(a, b + 1)] if nb["w"] else [])
        c = v(a + 1, b + 1)
        for p0, p1 in zip(ring, ring[1:] + ring[:1]):
            faces.append((c, v(*p0), v(*p1)))

    def area(f):
        ps = [verts[k] for k in f]
        return sum(((ps[k] - ps[0]).cross(ps[k + 1] - ps[0])).length for k in range(1, len(ps) - 1)) / 2
    faces = [f for f in faces if area(f) > 1e-4]   # cells squeezed onto the S3 cut
    H["h"] = hz
    H["ground"] = (verts, faces, [bare(p.x, p.y) for p in verts])
    return hz


# ---------------------------------------------------------------- a placement check (not geometry)

def mark_rect(x0, x1, y0, y1):
    """Record a building's wall rectangle (in the current local frame: song_kit.placed transforms these points with the
    geometry) for check_inside(); a bucket of its own that build() removes before any mesh is made."""
    owner = sb.B.owners[-1] if sb.B.owners else "?"
    b = sb.B.data.setdefault(("__mark__", owner), {"v": [], "f": [], "uv": []})
    b["v"].extend(V((x, y, 0.0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)))


def hall(x0, x1, yf, yb, rng, **kw):
    mark_rect(x0, x1, yf, yb)
    return k2.hall(x0, x1, yf, yb, rng, **kw)


def south_row_hall(x0, x1, y0, y1, rng, **kw):
    mark_rect(x0, x1, y0, y1)
    return k2.south_row_hall(x0, x1, y0, y1, rng, **kw)


def check_inside():
    """Print every painted figure and animal standing inside a building's walls (a placement check: open halls and
    shops hold their customers, but nobody should stand in a closed wall)."""
    rects = {}
    for key in [kk for kk in sb.B.data if kk[0] == "__mark__"]:
        vs = sb.B.data.pop(key)["v"]
        rects.setdefault(key[1], []).extend([[(v.x, v.y) for v in vs[i:i + 4]] for i in range(0, len(vs), 4)])
    out = []
    things = [(f["map_id"], f["X"], f["D"], f.get("support") or "") for f in LAYOUT["figures"]]
    things += [(k_, (e["pts"]["fore"][0] + e["pts"]["hind"][0]) / 2, (e["pts"]["fore"][1] + e["pts"]["hind"][1]) / 2, "")
               for k_, e in E.items() if e["kind"] == "animal"]
    for mid, x, y, sup in things:
        if sup.startswith(("boat", "cart", "perched")):
            continue
        for owner, polys in rects.items():
            for q in polys:
                if pip((x, y), q):
                    out.append([mid, owner, round(x, 2), round(y, 2)])
    print("INSIDE " + json.dumps(out), flush=True)
    return out


# ---------------------------------------------------------------- buildings: helpers

def placed(origin, yaw, z=0.0):
    return k.placed(k.frame(origin[0], origin[1], z, yaw))


def hz_at(x, y):
    return H["h"](x, y)


def bldg_z(eid):
    sw, se, ne, nw = fp(eid)
    return min(hz_at(*p) for p in (sw, se, ne, nw))


# ---------------------------------------------------------------- the north side, west: the shop hall, the big roof, the crowd

def north_west(rng):
    # S4b.bld.shop_hall_13170: the eastern bays of the official hall's building (part 1 builds the hall to its est east
    # end, (56.47, 11.51) / (55.59, 14.93)): an open front on thin posts along its painted front (sw -> se, which falls
    # 1.9 m toward the road), long tables inside, a dark valance under the eave from end to end, a light signboard
    # between two posts at u 13040-13080, a hipped east end. Its west end is a plain end tucked under part 1's hip
    # (seam note: the two roofs meet). choice: floor 0.12 (road level), eave 2.8 (part 1's hall's), rise 1.5
    eid = "S4b.bld.shop_hall_13170"
    # choice: squared to the frame's axes like part 1's hall it continues: front at D 11.0 (its painted front falls
    # from 11.5 to 9.6 along the road, receding the painter's way, not the frame's), back at 14.6, east wall at X 61.9
    # (the painted east edge recedes up-left; X 61.0 is where it passes at mid-depth, so the porter painted at its north-east
    # corner stands outside; a wall at the painted front's east end would stand 2.5 m into the open square)
    x0, x1, yf, yb = 56.47, 61.0, 11.0, 14.6   # the east wall where the painted east edge passes at mid-depth
    o, yaw, W, dp = (x0, yf), 0.0, x1 - x0, yb - yf
    z0 = min(hz_at(x, y) for x in (x0, x1) for y in (yf, yb))
    with sb.entity(eid):
        with placed(o, yaw, z0):
            cols = [0.0, W * 0.2, W * 0.4, W * 0.6, W * 0.8, W]
            top = hall(0.0, W, 0.0, dp, rng, plinth=0.12, eave=2.8, rise=1.5, cols=cols, kinds=["open"] * 5,
                          roof="hip", side=("open", "wall"), back="wall", steps=False, col_r=0.09)
            k2.valance((-0.6, -0.5), (W + 0.6, -0.5), top - 0.05, rng, depth=0.4)
            # the light signboard on the front between two posts (u 13040-13080): its writing is illegible at the
            # scan's resolution, so the board is built plain (a sign atlas cell with illegible marks waits on the lead)
            xa = (ux(13040, o[1] + 0.1) - o[0]) / math.cos(math.radians(yaw))
            xb = xa + 0.55
            k.board("cloth_white", False, (xa, -0.06), (xb, -0.06), 0.04, 1.45, 2.35)
            for x_ in (xa - 0.03, xb + 0.03):
                k.post("timber", False, x_, -0.06, 1.4, 2.4, 0.05, 0.01)
    # S4b.bld.big_roof_hall_12990: a very large tiled roof rising behind the shop hall and part 1's hall; its walls hidden;
    # under its lower west part the open framing of a gable (tie beam, post, rafters); a mat awning along its east edge
    # down to u ~13340 shading the seated man at the crowd. choice: eave 3.6, rise 2.2 (its top shows over both front
    # roofs), plain walls
    eid = "S4b.bld.big_roof_hall_12990"
    sw, se, ne, nw = fp(eid)
    # choice: x 51.6-58.0, D 15.6-17.9: its east end where the painted east edge passes at that depth (u ~13270), its
    # back short of the seated man and his goods (painted under the roof's east end and its mat awning, outside its
    # walls), its front 0.7 m behind part 1's hall so the bird painted over the hall perches above its eave
    x0, x1, yf, yb = 51.6, 58.0, 15.6, 17.9
    z0 = bldg_z(eid)
    with sb.entity(eid):
        top = hall(x0, x1, yf, yb, rng, z0=z0, plinth=0.15, eave=3.6, rise=2.2, kinds=["wall"], roof="gable",
                      steps=False, col_r=0.14)
        k2.kingpost_gable((x0, yf + 0.2), (x0, yb - 0.2), top + 0.1, top + 0.1 + 1.95, rng)
        # the mat awning hung along its east end over the seated man (lattice-textured strip), on two poles
        a, b, c, d = (x1 - 1.6, yb - 0.6, z0 + 2.75), (x1 + 0.6, yb - 0.6, z0 + 2.75), (x1 + 0.9, yb + 1.6, z0 + 2.15), \
            (x1 - 1.3, yb + 1.6, z0 + 2.15)
        ki.mat_roof([a, b, c, d], 0, rng, mat="reed", sag=0.04)
        for px, py in ((c[0] - 0.1, c[1] - 0.05), (d[0] + 0.1, d[1] - 0.05)):
            sb.cyl("bamboo", True, (px, py, hz_at(px, py) - 0.05), (px, py, z0 + 2.15), 0.04, segs=6)
    # S4b.bld.far_roof_12930: a large roof of diamond-patterned tiles far up the silk between the straight trees; no
    # walls show. choice: eave 3.0, hip roof 2.0 high, plain walls (the diamond tiles wait on a swatch: roof tiles meanwhile)
    eid = "S4b.bld.far_roof_12930"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        hall(sw[0], se[0], sw[1], max(nw[1], sw[1] + 2.4), rng, z0=bldg_z(eid), plinth=0.12, eave=3.0, rise=2.0,
                kinds=["wall"], roof="hip", steps=False)
    # S4b.bld.crowd_shop_13180: an open shop behind the crowd, its lattice-tiled roof's eave rising to the right, an open
    # front on thin posts, a light back wall, a low balustrade along its west side. choice: eave 2.6, rise 1.2
    eid = "S4b.bld.crowd_shop_13180"
    o, yaw, W, dp = front_frame(eid, min_depth=2.6)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            hall(0.0, W, 0.0, dp, rng, plinth=0.1, eave=2.6, rise=1.2, cols=[0.0, W * 0.45, W],
                    kinds=["open", "open"], roof="gable", side=("open", "wall"), back="wall", steps=False, col_r=0.08)
            k.balustrade([(0.08, 0.2), (0.08, dp - 0.2)], 0.1, h=0.7, spacing=0.8, mat="timber")


def top_street(rng):
    """The shops along the top of the silk: the long row of eating houses, the open shop with tables, the small house
    with its gateway, the big roof behind the trees. Far up the silk (painted at 0.3-0.5 of the street's scale: the map
    reads their eaves 0.5-1.1 m) they keep real heights on their painted frontages (rule 5); their backs run off the
    silk's top edge (hidden: choice depths)."""
    # S4b.bld.top_street_shops_13580: open front on thin posts (8 painted) with a low railing along it. choice: eave 2.6
    eid = "S4b.bld.top_street_shops_13580"
    o, yaw, W, dp = front_frame(eid, min_depth=2.6)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            n = 7
            cols = [W * i / n for i in range(n + 1)]
            hall(0.0, W, 0.0, dp, rng, plinth=0.12, eave=2.6, rise=1.3, cols=cols, kinds=["open"] * n, roof="gable",
                    side=("wall", "open"), back="wall", steps=False, col_r=0.07)
            ko.low_rail_fence([(0.3, -0.12), (W * 0.7, -0.12)], 0.6, rng, rails=2, post_every=0.9)
    # S4b.bld.top_open_shop_13990: open-fronted shop, thin posts, eave rising gently to the right. choice: eave 2.6
    eid = "S4b.bld.top_open_shop_13990"
    o, yaw, W, dp = front_frame(eid, min_depth=2.6)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            hall(0.0, W, 0.0, dp, rng, plinth=0.1, eave=2.6, rise=1.3, cols=[0.0, W / 3, 2 * W / 3, W],
                    kinds=["open"] * 3, roof="gable", side=("wall", "wall"), back="wall", steps=False, col_r=0.07)
    # S4b.bld.top_shop_14224: a low house, a small lattice window under its eave, a narrow gateway frame with a lintel and
    # a lattice transom at its east end. choice: eave 2.5, 2.4 m deep (its back beyond the silk)
    eid = "S4b.bld.top_shop_14224"
    o, yaw, W, dp = front_frame(eid, min_depth=2.4)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            gw = 0.95
            hall(0.0, W - gw, 0.0, dp, rng, plinth=0.1, eave=2.5, rise=1.2, cols=[0.0, (W - gw) / 2, W - gw],
                    kinds=["wall", "window"], roof="gable", steps=False)
            ko.gate_frame((W - gw, 0.0), (W, 0.0), 2.1, rng, threshold=True)
            ki.lattice_frame((W - gw + 0.08, 0.02), (W - 0.08, 0.02), 2.1, 0.35, rng)
            k.gable_roof(W - gw - 0.1, W + 0.15, -0.45, 0.45, 2.55, 2.95, over=0.15, ornament_s=0.3)
    # S4b.bld.roof_behind_trees_13980: a big hipped roof between the big trees' branches; walls hidden. choice: eave 3.2
    eid = "S4b.bld.roof_behind_trees_13980"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        hall(sw[0], se[0], sw[1], nw[1], rng, z0=bldg_z(eid), plinth=0.12, eave=3.2, rise=2.0, kinds=["wall"],
                roof="hip", steps=False)


# ---------------------------------------------------------------- the wheelwright (车铺劳作)

def wheelwright(rng):
    """S4b.bld.wheelwright_shed_13840: a narrow tiled shed running down from the top of the yard (its roll-tile ridge at
    the upper, north end), continued by a lower lean-to of lattice mat on two posts, open west onto the square; a small
    pent-roofed lattice box in a light wall under the upper roof's west end; a rail from the south post to the big tree.
    Built along its painted axis (north end -> south end). choice: 2.2 m deep, the upper shed's eave 2.5 / ridge 3.0,
    the lean-to 2.3 -> 2.6"""
    eid = "S4b.bld.wheelwright_shed_13840"
    sw, se, ne, nw = fp(eid)
    n_end = ((ne[0] + nw[0]) / 2, (ne[1] + nw[1]) / 2)
    s_end = ((sw[0] + se[0]) / 2, (sw[1] + se[1]) / 2)
    yaw = math.degrees(math.atan2(s_end[1] - n_end[1], s_end[0] - n_end[0]))
    Lx = math.hypot(s_end[0] - n_end[0], s_end[1] - n_end[1])
    z0 = min(hz_at(*n_end), hz_at(*s_end))
    with sb.entity(eid):
        # local frame: x from the north end to the south end; y to the left of that (east: the shed's back), the open
        # side at y = -1.1 (west)
        with placed(n_end, yaw, z0):
            xm = Lx * 0.48
            mark_rect(0.0, xm, -1.1, 1.1)
            # the upper tiled shed: back wall, end wall, posts on the open side, a lean-to tiled roof falling west
            k.board("plaster", True, (0.0, 1.1), (xm, 1.1), 0.14, 0.0, 2.95)
            k.board("plaster", True, (0.0, -1.05), (0.0, 1.05), 0.14, 0.0, 2.95)
            for x_ in (0.0, xm * 0.5, xm):
                k.column(x_, -1.1, 0.0, 2.45, r=0.08, mat="timber", base=False)
            ki.lean_to(-0.3, xm + 0.1, -1.55, 1.3, 2.35, 3.05, mat="roof")
            sb.cyl("ridge", False, (-0.3, 1.25, 3.08), (xm + 0.1, 1.25, 3.08), 0.09, segs=6)
            # the pent-roofed lattice box in the light wall under the upper roof's west end
            ki.lattice_frame((0.25, -1.08), (0.95, -1.08), 1.1, 0.6, rng)
            k.beam("roof", False, (0.15, -1.25, 1.8), (1.05, -1.25, 1.8), 0.08, 0.35, 0.01)
            # the lower lean-to of lattice mat on its two posts (the painted bays' feet), carried on from the upper roof
            for x_ in (Lx * 0.72, Lx - 0.1):
                k.column(x_, -1.1, 0.0, 2.25, r=0.07, mat="timber", base=False)
                k.column(x_, 1.1, 0.0, 2.55, r=0.07, mat="timber", base=False)
            ki.mat_roof([(xm, -1.4, 2.25), (Lx + 0.2, -1.4, 2.2), (Lx + 0.2, 1.3, 2.6), (xm, 1.3, 2.65)], 0, rng,
                        mat="reed", sag=0.03)
        # the rail from the south post to the big forked elm's trunk
        tx, ty = (lambda t: (t["X"], t["D"]))(next(t for t in LAYOUT["trees"] if t["map_id"] == "S4b.tree.forked_elm_14045"))
        c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
        sp = (n_end[0] + c * (Lx - 0.1) + s * 1.1, n_end[1] + s * (Lx - 0.1) - c * 1.1)
        ko.low_rail_fence([sp, (tx - 0.45, ty + 0.25)], 0.85, rng, rails=1, post_every=1.4)


# ---------------------------------------------------------------- the tea house (小铺闲坐?)

def tea_house(rng):
    """S4b.str.tea_house_platform_14520 and S4b.bld.tea_house_14531: an open hall on a low platform (the frame's `tea
    house floor`, 0.18 m) north of the road. The big tiled gable roof's south gable faces the road with an open king-post
    truss, tie beam and short posts; its long west slope runs on over the tables west of the hall; a second, smaller
    gable roof runs parallel on its east side; across the whole front a broad lean-to canopy of mat with a fringed
    eave on posts; a lattice screen closes the west end, a pale doorway with a lattice transom opens in it at the
    north-west; a low rail with capped end posts along the east bays' front. No writing.
    choice: the hall's gable posts at u 14465 and 14742 (painted), its back wall at the map's est D 11.0; eave 3.0,
    ridge 4.8 (the painted apex reads 4.8 m over the floor); the east roof eave 2.8, ridge 4.0; the canopy 2.3 m at
    its front posts, 2.75 m where it meets the hall"""
    edge = line("S4b.str.tea_house_platform_14520", "edge")
    yb = 11.35
    zf = TEA_FLOOR
    with sb.entity("S4b.str.tea_house_platform_14520"):
        outline = list(edge) + [(edge[-1][0] + 0.3, yb), (edge[0][0] - 0.2, yb)]
        k.soft_slab("stone", True, outline, -0.25, zf, rng, r=0.08, wob=0.012, seg=0.9, along=(1.0, 0.0))
        # the small step down near the hall's west post (painted at u 14397-14420)
        sx = ux(14408, 7.8)
        k.stairs(sx - 0.45, sx + 0.45, 7.35, 7.8, 0.0, zf, 1, rng=rng)
    eid = "S4b.bld.tea_house_14531"
    sw, se, ne, nw = fp(eid)
    yf = (sw[1] + se[1]) / 2 + 0.05
    gx0, gx1 = ux(14465, yf), ux(14742, yf)        # the gable's posts
    rx = (gx0 + gx1) / 2
    with sb.entity(eid):
        # the hall's frame: posts on the front and back lines, back wall, west lattice screen with the doorway
        hx0, hx1 = gx0 - 2.2, se[0] - 0.1
        mark_rect(hx0, hx1, yf + 0.05, yb - 0.25)
        # choice: the west gable post 0.35 m east of its painted u 14465, clear of the chair under the hatted customer
        for x_ in (hx0, gx0 + 0.35, gx1, hx1 - 2.6, hx1):
            k.column(x_, yf + 0.05, zf, zf + 2.95, r=0.1, mat="timber", base=True, rng=rng)
            k.column(x_, yb - 0.25, zf, zf + 2.95, r=0.1, mat="timber", base=True, rng=rng)
        k.board("plaster", True, (hx1, yb - 0.25), (hx0, yb - 0.25), 0.14, zf, zf + 2.95)
        ki.lattice_frame((hx0, yf + 0.1), (hx0, yb - 1.4), zf, 2.4, rng)
        ko.gate_frame((hx0, yb - 1.35), (hx0, yb - 0.35), zf + 2.05, rng, threshold=True)
        ki.lattice_frame((hx0, yb - 1.3), (hx0, yb - 0.4), zf + 2.1, 0.45, rng)
        k.beam("timber", True, (hx0 - 0.15, yf + 0.05, zf + 2.9), (hx1 + 0.15, yf + 0.05, zf + 2.9), 0.16, 0.22, 0.03)
        k.beam("timber", False, (hx0 - 0.15, yb - 0.25, zf + 2.9), (hx1 + 0.15, yb - 0.25, zf + 2.9), 0.14, 0.2, 0.03)
        # the big gable roof, ridge north-south over the gable posts; its long west slope carried on over the tables
        zt = zf + 3.0
        half = 3.0
        with placed((rx, (yf + yb) / 2), 90):
            k.gable_roof(-(yb - yf) / 2 - 0.4, (yb - yf) / 2 + 0.4, -half, half, zt, zt + 1.8, over=0.45, ornament_s=0.6)
        k2.kingpost_gable((gx0 - 0.4, yf - 0.4), (gx1 + 0.4, yf - 0.4), zt + 0.05, zt + 1.7, rng)
        with placed((rx - half, (yf + yb) / 2), 90):
            ki.lean_to(-(yb - yf) / 2 - 0.4, (yb - yf) / 2 + 0.4, half + 0.3, -0.1, zt - 0.75, zt - 0.02, mat="roof")
        # posts under the west slope's far eave, among the tables
        for y_ in (yf + 0.6, yb - 0.6):
            k.column(rx - 2 * half - 0.1, y_, zf, zt - 0.8, r=0.08, mat="timber", base=False)
        # the second, smaller gable roof on the east side, parallel
        ex = (gx1 + hx1) / 2 + 0.4
        with placed((ex, (yf + yb) / 2 + 0.2), 90):
            k.gable_roof(-(yb - yf) / 2 - 0.2, (yb - yf) / 2 + 0.4, -1.9, 1.9, zf + 2.75, zf + 3.85, over=0.3,
                         ornament_s=0.45)
        # the front canopy of mat with its fringed eave, across the whole front on posts
        k2.fringed_canopy((hx0 - 2.6, yf - 1.85), (hx1 + 0.3, yf - 1.85), 1.85, zf + 2.3, zf + 2.75, rng, posts=6,
                          fringe=0.25, z0=zf)
        # the low rail with capped end posts along the east bays' front
        ko.low_rail_fence([(gx1 + 0.3, yf - 0.15), (hx1 - 0.2, yf - 0.15)], 0.6, rng, rails=2, post_every=1.0)


# ---------------------------------------------------------------- the bank above the moorings

def bank(rng):
    # S4b.str.bank_shed_14445: an open mat-roofed shed on posts at the top of the bank, a post-and-brace frame under its
    # east end. choice: eaves 2.2 (south) and 2.45 (north)
    with sb.entity("S4b.str.bank_shed_14445"):
        k2.open_mat_shed(fp("S4b.str.bank_shed_14445"), bldg_z("S4b.str.bank_shed_14445"), 2.2, 2.45, rng, braces=True)
    # S4b.bld.mat_shed_15038: an open shed east of the tea house under a mat roof (a stall). choice: eaves 2.3 / 2.5
    with sb.entity("S4b.bld.mat_shed_15038"):
        k2.open_mat_shed(fp("S4b.bld.mat_shed_15038"), bldg_z("S4b.bld.mat_shed_15038"), 2.3, 2.5, rng)
    # S4b.bld.riverbank_house_14640: a small tiled house set askew at the top of the bank, open bays on three posts at
    # its south-west end with a low railing between the first two. choice: 2.6 x 2.4 m (painted 1.7 x 1.7 far up the
    # silk: a door and the open bays need 2.4 m), eave 2.5, hip roof
    eid = "S4b.bld.riverbank_house_14640"
    o, yaw, W, dp = front_frame(eid, min_depth=2.4)
    W = max(W, 2.6)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            hall(0.0, W, 0.0, dp, rng, plinth=0.12, eave=2.5, rise=1.3, cols=[0.0, W * 0.4, W * 0.75, W],
                    kinds=["open", "open", "wall"], roof="hip", side=("open", "wall"), steps=False, col_r=0.07)
            ko.low_rail_fence([(0.1, -0.1), (W * 0.4 - 0.1, -0.1)], 0.6, rng, rails=2, post_every=0.6)
    # S4b.bld.far_house_14615: a tiled house behind the riverbank house, a light gable end with a post at its west end.
    # choice: 2.4 m deep (its back beyond the silk), eave 2.5
    eid = "S4b.bld.far_house_14615"
    o, yaw, W, dp = front_frame(eid, min_depth=2.4)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            hall(0.0, W, 0.0, dp, rng, plinth=0.1, eave=2.5, rise=1.2, kinds=["wall"], roof="gable", steps=False)
            k.post("timber", False, 0.02, dp / 2, 2.6, 3.55, 0.08, 0.01)
    # S4b.bld.top_house_tables_14876: by the moorings, an open shop front with tables under the eave in its west part, a
    # boarded lattice at its west end, a plastered wall and a row of round tile ends in its east part. choice: eave 2.6
    eid = "S4b.bld.top_house_tables_14876"
    o, yaw, W, dp = front_frame(eid, min_depth=2.4)
    with sb.entity(eid):
        with placed(o, yaw, bldg_z(eid)):
            hall(0.0, W, 0.0, dp, rng, plinth=0.1, eave=2.6, rise=1.3, cols=[0.0, W * 0.3, W * 0.55, W],
                    kinds=["open", "open", "wall"], roof="gable", side=("wall", "wall"), steps=False, col_r=0.07)
            ki.lattice_frame((0.06, 0.2), (0.06, dp - 0.2), 0.1, 2.3, rng)
    # S4b.bld.far_shed_15098 (on the far bank, moved with it): a faint long low shed, three posts. choice: posts 2.2 m
    eid = "S4b.bld.far_shed_15098"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        with k.placed(k.frame(0, 0, bldg_z(eid))):
            k.far_shed(sw[0], se[0], sw[1] + 0.1, rng, h=2.2, depth=max(1.2, nw[1] - sw[1]))
    # S4b.prop.bank_timber_15162: a log along the bank's lip (faint)
    x, y = P("S4b.prop.bank_timber_15162")
    with sb.entity("S4b.prop.bank_timber_15162"):
        z = hz_at(x, y) + 0.1
        k.beam("bark", False, (x - 1.4, y + 0.05, z), (x + 1.4, y - 0.05, z + 0.02), 0.2, 0.18, 0.06)
    # S4b.tree.stump_14805: a solid stump, no card (the catalogue: built in the area's kit; how: model), hooking east
    t = next(t for t in LAYOUT["trees"] if t["map_id"] == "S4b.tree.stump_14805")
    with sb.entity("S4b.tree.stump_14805"):
        k2.stump(t["X"], t["D"], hz_at(t["X"], t["D"]), rng, hook_deg=0.0)
    # S4b.prop.mooring_post_14737: at the water's edge; the big cabin boat's two ropes tie to it (the boats GLB)
    x, y = P("S4b.prop.mooring_post_14737")
    with sb.entity("S4b.prop.mooring_post_14737"):
        k2.mooring_post(x, y, min(hz_at(x, y), RIVER["H"]) - 0.25, RIVER["H"] + 0.8, rng)


# ---------------------------------------------------------------- the south row

def south_row(rng):
    """The halls south of the road, seen mostly as roofs: squared to the frame's axes (part 1's way), each on a
    rectangle chosen inside its painted footprint so that neighbours don't overlap (choices), real heights."""
    def z_of(x0, x1, y0, y1):
        return min(hz_at(x, y) for x in (x0, x1) for y in (y0, y1))

    def hall_on(eid, x0, x1, y0, y1, **kw):
        with sb.entity(eid):
            return hall(x0, x1, y0, y1, rng, z0=z_of(x0, x1, y0, y1), **kw)

    # S4b.bld.south_gable_shed_13380: a small tiled roof at the bottom edge, its gable (a post and framing) facing west
    # toward the second cart. choice: x 66.2-69.4 (clear of the cart's people on the road), y -5.6..-2.7 (walls below
    # the silk's edge), eave 2.5
    with sb.entity("S4b.bld.south_gable_shed_13380"):
        x0, x1, y0, y1 = 66.2, 69.4, -5.6, -2.7
        z0 = z_of(x0, x1, y0, y1)
        with placed(((x0 + x1) / 2, (y0 + y1) / 2), 90, z0):
            hall(-(y1 - y0) / 2, (y1 - y0) / 2, -(x1 - x0) / 2, (x1 - x0) / 2, rng, plinth=0.1, eave=2.5, rise=1.3,
                    kinds=["wall"], roof="gable_y", steps=False)
    # S4b.bld.south_bottom_roof_13770: a gabled roof at the bottom edge in front of the big south hall's gable (a porch
    # roof, its ridge rising north to a gable peak). choice: x 69.9-74.9, y -5.6..-3.15, eave 2.4, ridge 1.1 higher
    hall_on("S4b.bld.south_bottom_roof_13770", 69.9, 74.9, -5.6, -3.15, plinth=0.08, eave=2.4, rise=1.1,
            cols=[69.9, 72.4, 74.9], kinds=["open", "open"], roof="gable_y", side=("wall", "wall"), back="open",
            steps=False, col_r=0.08)
    # S4b.bld.south_hall_13920: the big south hall: ridge north-south rising to a high north gable peak with a finial
    # near the road, its south gable with a tie beam, king post and a railed balcony / lattice screen on two posts.
    # choice: x 73.9-79.3 (east of the hipped roof on the road, south_hip_roof_13810), y -2.95..1.15, eave 3.2
    with sb.entity("S4b.bld.south_hall_13920"):
        south_row_hall(73.9, 79.3, -2.95, 1.15, rng, z0=z_of(73.9, 79.3, -2.95, 1.15), eave=3.2, rise=2.2,
                          north_lift=0.9, fish=False, balcony=True)
    # S4b.bld.south_hip_roof_13810: a small building with a hipped roof of lattice-textured tiles just south of the road,
    # facing it (north), brackets under its west eave; a man stands on the road behind it. choice: eave 2.45 (painted
    # 2.44), x 69.6-73.6, y 1.2-3.3
    with sb.entity("S4b.bld.south_hip_roof_13810"):
        x0, x1, y0, y1 = 69.6, 73.6, 1.2, 3.3
        z0 = z_of(x0, x1, y0, y1)
        with placed(((x0 + x1) / 2, (y0 + y1) / 2), 180, z0):
            top = hall(-(x1 - x0) / 2, (x1 - x0) / 2, -(y1 - y0) / 2, (y1 - y0) / 2, rng, plinth=0.1, eave=2.45,
                          rise=1.1, cols=[-(x1 - x0) / 2, 0.0, (x1 - x0) / 2], kinds=["door", "window"], roof="hip",
                          steps=False)
            for yy in (-0.6, 0.0, 0.6):
                k.bracket((x1 - x0) / 2, yy, top, (1, 0), s=0.4, mat="timber")
    # S4b.bld.south_hall_gable_14340: a large hall, its ridge rising north from a small south gable at the bottom edge
    # (hanging fish, tie beam, the posts of an open front) to a high north gable peak with a finial. choice: x 79.5-85.3,
    # y -5.2..-0.6, eave 3.3
    with sb.entity("S4b.bld.south_hall_gable_14340"):
        south_row_hall(79.5, 85.3, -5.2, -0.6, rng, z0=z_of(79.5, 85.3, -5.2, -0.6), eave=3.3, rise=2.3,
                          north_lift=1.0, fish=True)
    # S4b.bld.south_hall_long_14680: a long hall south of the road seen from behind: a straight ridge with curled ends,
    # a hip at its west end and a gable with a hanging fish at its east end, a small hatch with its own ridge and a
    # raised white box on its south slope. choice: x 76.3? -> 79.6..89.6 east of the south hall, y -0.3..2.1, eave 3.0,
    # hip-gable roof (xieshan: the hip shows at the west end)
    x0, x1, y0, y1 = 79.6, 89.6, -0.3, 2.05
    with sb.entity("S4b.bld.south_hall_long_14680"):
        z0 = z_of(x0, x1, y0, y1)
        top = hall(x0, x1, y0, y1, rng, z0=z0, plinth=0.15, eave=3.0, rise=1.6, kinds=["wall"] * 3,
                      cols=[x0, (2 * x0 + x1) / 3, (x0 + 2 * x1) / 3, x1], roof="xieshan", steps=False)
        ko.hanging_fish((x1 + 0.55, (y0 + y1) / 2, top + 1.2), (1, 0), s=0.9)
        # the hatch on the south slope (painted u 14931-14992): on the roof surface 0.9 m in from the eave
        hx = ux(14960, y0)
        zr = top + 0.12 + 1.6 * (0.9 / ((y1 - y0) / 2 + 0.75))
        k2.roof_hatch(hx, y0 - 0.75 + 0.9, zr, -90, rng, slope_deg=36)
    # S4b.bld.south_hall_edge_14945: a long hall along the silk's bottom edge, a hip at its west end; only its ridge and
    # upper south slope show. choice: x 85.6-91.0, y -5.6..-2.6 (its south front below the silk), eave 2.9
    hall_on("S4b.bld.south_hall_edge_14945", 85.6, 91.0, -5.6, -2.6, plinth=0.1, eave=2.9, rise=1.5, kinds=["wall"],
            roof="hip", steps=False)
    # S4b.bld.south_hall_diagonal_15242: a big hall at the south-east corner, its ridge rising north to a gable peak at
    # the seam. choice: x 91.3-96.2, y -5.0..-0.75, eave 3.2 (its east part runs past the seam, as painted)
    with sb.entity("S4b.bld.south_hall_diagonal_15242"):
        south_row_hall(91.3, 96.2, -5.0, -0.75, rng, z0=z_of(91.3, 96.2, -5.0, -0.75), eave=3.2, rise=2.2,
                          north_lift=1.1, fish=False)
    # S4b.bld.house_behind_willow_15414: a low tiled house north of the road behind the big willow (reading 2: fronting
    # south like the S3 riverside hall beside it), a screen of reeds under its eave (S4b.str.reed_fence_15320).
    # choice: x 90.9-93.6, y 2.7-4.7 (clear of the willow's trunk), eave 2.5
    hall_on("S4b.bld.house_behind_willow_15414", 90.9, 93.6, 2.7, 4.7, plinth=0.1, eave=2.5, rise=1.2,
            cols=[90.9, 92.25, 93.6], kinds=["door", "wall"], roof="gable", steps=False)
    with sb.entity("S4b.str.reed_fence_15320"):
        ln = line("S4b.str.reed_fence_15320", "fence")
        for a, b in zip(ln, ln[1:]):
            ki.slat_fence(a, b, 1.9, rng, slat=0.07, mat="bamboo")


# ---------------------------------------------------------------- props

def props(rng):
    h = H["h"]

    def at(eid):
        x, y = P(eid)
        e = E[eid]
        sup = e.get("support") or "ground"
        if sup == "tea house floor":
            z = TEA_FLOOR
        elif sup.startswith("table top") or sup == "official hall floor":
            z = e["H"]
        else:
            z = h(x, y)
        return x, y, z

    def table(eid, L_, W_, yaw, ht=0.78, z=None):
        x, y, z0 = at(eid)
        z = z0 if z is None else z
        with sb.entity(eid):
            with k.placed(k.frame(x, y, z, yaw)):
                k.table(-L_ / 2, -W_ / 2, L_ / 2, W_ / 2, 0.0, h=ht)

    def bench(eid, L_, yaw, ht=0.45):
        x, y, z = at(eid)
        c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
        with sb.entity(eid):
            ki.bench((x - c * L_ / 2, y - s * L_ / 2), (x + c * L_ / 2, y + s * L_ / 2), z, h=ht, w=0.26)

    def stool(eid, ht=0.42):
        x, y, z = at(eid)
        with sb.entity(eid):
            ki.stool(x, y, z, h=ht, s=0.32)

    def chair(eid, yaw, back):
        x, y, z = at(eid)
        with sb.entity(eid):
            k2.chair(x, y, z, yaw, rng, back=back)

    # the shop hall's furniture (squared to the hall's front, choice: its yaw)
    hy = 0.0   # squared to the shop hall (choice)
    table("S4b.prop.table_13010", 1.3, 0.6, hy)
    table("S4b.prop.table_13205", 1.9, 0.55, hy)
    bench("S4b.prop.bench_13200", 1.9, hy)
    stool("S4b.prop.stool_13130")
    x, y, z = at("S4b.prop.back_counter_13175")
    with sb.entity("S4b.prop.back_counter_13175"):
        c, s = math.cos(math.radians(hy)), math.sin(math.radians(hy))
        ki.counter((x - c * 0.9, y - s * 0.9), (x + c * 0.9, y + s * 0.9), z, 0.9, 0.45, rng)
        ki.goods_heap(x, y, z + 0.9, 0.9, 0.3, rng, n=6, mat="cloth_white", s=0.07)
    x, y, z = at("S4b.prop.table_bowls_13275")
    with sb.entity("S4b.prop.table_bowls_13275"):
        c, s = math.cos(math.radians(hy)), math.sin(math.radians(hy))
        # choice: 0.92 m high, fitted to the counter man's hands (idler lean_over, palms 0.91-0.96 m: fix-s4b, details
        # pass; it was 0.85, his hands 6-13 cm over it and his arms short of it when the take rocks back)
        ki.counter((x - c * 0.6, y - s * 0.6), (x + c * 0.6, y + s * 0.6), z, 0.92, 0.45, rng)
        ki.dishes(x, y, z + 0.92, rng, n=2)
    x, y, z = at("S4b.prop.funnel_vessel_12884")
    with sb.entity("S4b.prop.funnel_vessel_12884"):
        k2.funnel_vessel(x, y, z, rng)
    x, y, z = at("S4b.prop.big_jar_12707")
    with sb.entity("S4b.prop.big_jar_12707"):
        k2.big_jar(x, y, z, rng)
    x, y, z = at("S4b.prop.thatch_shade_13049")
    with sb.entity("S4b.prop.thatch_shade_13049"):
        k2.fan_shade(x, y, z, 0.0, rng)
    # the bottom shop (under part 1's south hall's east end; squared to the frame, choice)
    table("S4b.prop.table_12900", 1.1, 0.6, 0)
    table("S4b.prop.table_tray_12845", 1.0, 0.55, 0, ht=0.56 + 0.0)
    # choice: 0.41 m high, fitted to the faint sitter's seat point (idler sit: 0.415-0.44 m; fix-s4b, details pass)
    bench("S4b.prop.bench_12835", 1.6, 0, ht=0.41)
    x, y, z = at("S4b.prop.jug_12833")
    with sb.entity("S4b.prop.jug_12833"):
        ki.ewer(x, y, z, h=0.32)
    x, y, z = at("S4b.prop.tray_12823")
    with sb.entity("S4b.prop.tray_12823"):
        k2.tray(x, y, z, 0)
    x, y, z = at("S4b.prop.slatted_crate_12819")
    with sb.entity("S4b.prop.slatted_crate_12819"):
        ko.slatted_box(x, y, z, 0.6, 0.45, 0.45, 0, rng)
    x, y, z = at("S4b.prop.slatted_rack_12732")
    with sb.entity("S4b.prop.slatted_rack_12732"):
        ko.slatted_box(x, y, z, 1.1, 0.4, 0.5, 0, rng, legs=0.12, lid=True)
    x, y, z = at("S4b.prop.barrel_12677")
    with sb.entity("S4b.prop.barrel_12677"):
        k.cask(x, y, z, 0.3, 0.95, rng)
    x, y, z = at("S4b.prop.counter_frame_12655")
    with sb.entity("S4b.prop.counter_frame_12655"):
        k2.counter_frame(x, y, z, 0, rng)
    # the child's table: part 1's child (S4.fig.child_at_table_12597) reaches onto its west end. It stands on part 1's
    # south hall's floor (S4_HALL_FLOOR), not on S4b's ground 0.33 m under it, moved clear of that hall's east column
    # (build_choices.json moves). choice: 0.6 x 0.5 m (its west end on the seam, as painted at u 12599), 0.6 m high: the
    # top at the child's reach palms less 0.02 (fix-s4b, details pass 2026-10-13; it was 0.8 x 0.5 x 0.72 on S4b's
    # ground, its top 0.40 m over the floor the child stands on and its legs inside the hall's plinth)
    table("S4b.prop.table_12645", 0.6, 0.5, 0, ht=0.6, z=S4_HALL_FLOOR)
    # the crowd's square and the top street
    x, y, z = at("S4b.prop.goods_on_mat_13282")
    with sb.entity("S4b.prop.goods_on_mat_13282"):
        k2.goods_on_mat(x, y, z, 0, rng)
    table("S4b.prop.table_13315", 1.0, 0.55, 25)
    table("S4b.prop.small_table_13368", 0.7, 0.45, 25, ht=0.6)
    x, y, z = at("S4b.prop.stall_13480")
    with sb.entity("S4b.prop.stall_13480"):
        k2.two_tier_stall(x, y, z, 25, rng)
    ty = front_frame("S4b.bld.top_street_shops_13580")[1]
    table("S4b.prop.table_13615", 1.8, 0.55, ty)
    bench("S4b.prop.bench_13590", 1.6, ty)
    bench("S4b.prop.bench_13658", 1.4, ty)
    bench("S4b.prop.bench_13740", 1.2, ty)
    x, y, z = at("S4b.prop.reed_mat_13870")
    with sb.entity("S4b.prop.reed_mat_13870"):
        ko.bamboo_blind((x - 0.45, y), (x + 0.45, y + 0.15), z, z + 2.1, rng)
    oy = front_frame("S4b.bld.top_open_shop_13990")[1]
    table("S4b.prop.table_13970", 1.0, 0.55, oy)
    table("S4b.prop.table_14067", 1.0, 0.55, oy)
    bench("S4b.prop.bench_13943", 1.0, oy)
    bench("S4b.prop.bench_13988", 1.0, oy)
    chair("S4b.prop.chair_13980", oy - 90, "lattice")
    chair("S4b.prop.chair_14028", oy + 180, "round")
    stool("S4b.prop.stool_14088")
    # the wheelwright's yard
    x, y, z = at("S4b.prop.loose_wheel_13665")
    with sb.entity("S4b.prop.loose_wheel_13665"):
        kv.spoked_wheel(V((x, y, z + 0.09)), V((0, 0, 1)), 0.85, spokes=18)
    x, y, z = at("S4b.prop.pole_frame_basket_13690")
    with sb.entity("S4b.prop.pole_frame_basket_13690"):
        k2.pole_frame_basket(x, y, z, 30, rng)
    x, y, z = at("S4b.prop.striped_load_13684")
    with sb.entity("S4b.prop.striped_load_13684"):
        k2.striped_load(x, y, z, 30, rng)
    with sb.entity("S4b.prop.timber_pile_13745"):
        c4 = [pt("S4b.prop.timber_pile_13745", n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
        k2.timber_pile(c4, min(h(*p) for p in c4), rng)
    x, y, z = at("S4b.prop.tool_on_ground_13632")
    with sb.entity("S4b.prop.tool_on_ground_13632"):
        k2.tool_on_ground(x, y, z, 20, rng)
    x, y, z = at("S4b.prop.leaning_poles_13775")
    with sb.entity("S4b.prop.leaning_poles_13775"):
        ki.leaning_poles((x, y, z), [(x + 0.5, y + 0.6, z + 2.3), (x + 0.75, y + 0.45, z + 2.25), (x + 0.3, y + 0.75, z + 2.35)])
    table("S4b.prop.goods_table_13892", 1.3, 0.6, 0, ht=0.82)
    x, y, z = at("S4b.prop.goods_heap_13925")
    with sb.entity("S4b.prop.goods_heap_13925"):
        ki.goods_heap(x, y, z, 0.8, 0.45, rng, n=9, mat="hemp", s=0.09)
    x, y, z = at("S4b.prop.sacks_under_table_13890")
    with sb.entity("S4b.prop.sacks_under_table_13890"):
        k.sack(x - 0.25, y, z, rng, s=0.8, mat="hemp")
        k.sack(x + 0.25, y + 0.05, z, rng, s=0.75, mat="cloth_white")
    x, y, z = at("S4b.prop.round_basket_13840")
    with sb.entity("S4b.prop.round_basket_13840"):
        k2.sieve_basket(x, y, z, 0.5, rng)
    # the tea house's furniture on its floor (squared to the hall, choice)
    bench("S4b.prop.bench_14200", 1.8, 0)
    table("S4b.prop.table_14265", 1.2, 0.6, 0)
    bench("S4b.prop.bench_14302", 1.4, 0)
    x, y, z = at("S4b.prop.small_box_or_stool_14384")
    with sb.entity("S4b.prop.small_box_or_stool_14384"):
        ki.stool(x, y, z, h=0.4, s=0.34)
    chair("S4b.prop.chair_14458", 0, "plain")
    table("S4b.prop.table_14518", 0.75, 0.6, 0, ht=0.75)
    # choice: 0.225 m high, fitted under the stout man's seat (robed_man knee_on_stool~customer_white_14560 holds it 0.40-0.42 m
    # up; his right heel drawn up on it, his left foot tucked under its board, 0.17 m clear of it; fix-s4b, details pass)
    stool("S4b.prop.stool_14595", ht=0.225)
    table("S4b.prop.table_14630", 1.2, 0.6, 0)
    bench("S4b.prop.bench_14665", 1.8, 0)
    table("S4b.prop.table_14722", 0.9, 0.6, 0)
    x, y, z = at("S4b.prop.round_basket_or_drum_14795")
    with sb.entity("S4b.prop.round_basket_or_drum_14795"):
        ki.round_basket(x, y, z, 0.25, 0.3, rng)
    table("S4b.prop.table_14805", 1.6, 0.55, 0)
    stool("S4b.prop.stool_14840")
    x, y, z = at("S4b.prop.small_box_14915")
    with sb.entity("S4b.prop.small_box_14915"):
        ko.slatted_box(x, y, z, 0.4, 0.35, 0.35, 0, rng, lid=True)
    table("S4b.prop.long_table_15050", 2.0, 0.55, 0, ht=0.63 - TEA_FLOOR)
    x, y, z = at("S4b.prop.slatted_box_15078")
    with sb.entity("S4b.prop.slatted_box_15078"):
        ko.slatted_box(x, y, z, 0.45, 0.35, 0.3, 0, rng, lid=True)
    x, y, z = at("S4b.prop.round_canopy_14905")
    with sb.entity("S4b.prop.round_canopy_14905"):
        ki.umbrella(x, y, z + 2.7, 1.7, rng, tilt=(0.0, 0.12), foot=(x, y, z), ribs=20, mat="oilpaper")
    for eid in ("S4b.prop.bundle_heap_14680", "S4b.prop.bundle_heap_14970"):
        x, y, z = at(eid)
        with sb.entity(eid):
            k2.straw_heap((x - 1.4, y - 0.05), (x + 1.4, y + 0.05), z, rng)
    # the top house by the moorings
    hy2 = front_frame("S4b.bld.top_house_tables_14876")[1]
    table("S4b.prop.table_14830", 1.0, 0.55, hy2)
    bench("S4b.prop.bench_14795", 1.0, hy2)
    bench("S4b.prop.bench_14861", 0.8, hy2 + 90)
    chair("S4b.prop.chair_14788", hy2 + 90, "slats")
    # the small slatted frame on its post between the south roofs
    x, y, z = at("S4b.prop.slatted_frame_13320")
    with sb.entity("S4b.prop.slatted_frame_13320"):
        k2.slatted_frame(x, y, z, rng)


# ---------------------------------------------------------------- vehicles

def team(*eids):
    out = []
    for eid in eids:
        a = E[eid]["pts"]
        (fx, fd, _), (hx, hd, _) = a["fore"], a["hind"]
        out.append(((fx + hx) / 2, (fd + hd) / 2, math.degrees(math.atan2(fd - hd, fx - hx)), "ox"))
    return out


def vehicles(rng):
    """The two palm-covered family carts (大棕盖车, this area's kit: the vehicle kit has no palm variant) and the sedan
    chair set down (kit_vehicles.sedan_chair, carried=False)."""
    h = H["h"]
    v = E["S4b.veh.palm_cart_13070"]["pts"]
    with sb.entity("S4b.veh.palm_cart_13070"):
        k2.palm_cart(tuple(v["front"][:2]), tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])], z_of=h,
                     rng=random.Random(13070), hitched=False)
    v = E["S4b.veh.palm_cart_13455"]["pts"]
    with sb.entity("S4b.veh.palm_cart_13455"):
        k2.palm_cart(tuple(v["front"][:2]), tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])],
                     team=team("S4b.ani.ox_shaft_13442", "S4b.ani.ox_lead_13458"), z_of=h, rng=random.Random(13455),
                     hitched=True, load=True)
    # the sedan chair: its poles run east at mid-height to the crossbar across its attendant (u ~13263-13283)
    # the person seated under the first cart's thatch hood sits on the kit's plank across its sills (it doesn't
    # collide): a hidden block under him, its top at the plank (the cart's own part: what grounds its sitter)
    s_ = FIG.get("S4b.fig.seated_in_cart_front_12995")
    if s_:
        with sb.entity("S4b.veh.palm_cart_13070"):
            z = h(s_["X"], s_["D"])
            k.bx("hidden", True, (s_["X"] - 0.18, s_["D"] - 0.3, z + 0.9), (s_["X"] + 0.18, s_["D"] + 0.3, z + 1.08))
    p = E["S4b.veh.sedan_chair_13140"]["pts"]
    yc = (p["front"][1] + p["rear"][1]) / 2
    xr, xf = p["rear"][0] - 0.2, ux(13273, yc)
    with sb.entity("S4b.veh.sedan_chair_13140"):
        kv.sedan_chair(front=(xf, yc), rear=(xr, yc), z_of=h, rng=random.Random(13140), carried=False,
                       cabin_at=min(0.45, 0.6 / max(0.1, xf - xr)))


# ---------------------------------------------------------------- seats painted with their sitters (rule 3)

def seats(rng):
    """Figures painted seated on something the map doesn't list (the ground, a hidden stool, a cart bed or a boat):
    the seat is part of the figure. The casting agent lists them (gen/sections/outer_road_2/seats.json); a seat on a
    boat or a cart is that boat's or cart's, so nothing is built for those here."""
    if not os.path.exists(SEATS_JSON):
        return 0
    n = 0
    for mid, s in json.load(open(SEATS_JSON, encoding="utf-8")).items():
        if mid not in FIG or str(s.get("what", "")).startswith(("boat", "cart", "ground", "none")):
            continue
        # a seat on a boat is the boat's (its deck moves): the stern boatman's stool stood still in the water at the
        # boat's rest place (fix-s4b, details pass 2026-10-13; the boat kit's to build: fix-boats)
        if str(s.get("support", "")).startswith(("boat", "cart")):
            continue
        seat_h = float(s.get("seat_h") or 0)
        if seat_h < 0.15:
            continue
        bx_, by_ = s["X"], s["D"]          # the seat's centre, under the sitter's hips (the casting script's HIPS)
        z = s.get("H") if s.get("H") not in (None, 0) else H["h"](bx_, by_)
        with sb.entity(mid):
            ki.stool(bx_, by_, z, h=seat_h, s=0.32)
        n += 1
    return n


# ---------------------------------------------------------------- colliders, water, roads

def colliders(trees):
    """Invisible walls round the walkable area (build_choices.json edges): edge:west on the part 1 seam, edge:south on
    the silk's bottom edge, edge:east on the S3 seam's land part only (the moored hulls run past the seam), edge:north
    on the silk's top edge west of the cove (the cove and the far bank are closed by the water's shore walls); and each
    tall tree's trunk (part of the tree)."""
    sw, se, ne, nw = WALK
    # where the seam meets the near shore (its last mapped point is on the seam)
    seam_pt = line("S4b.water.bian_river", "shore_s")[-1]
    # the north edge stops at the cove's west shore where it crosses the silk's top edge
    cove_x = nw[0]
    ext = RIVER["near"][:5]
    for a, b in zip(ext, ext[1:]):
        if (a[1] - nw[1]) * (b[1] - nw[1]) <= 0 and a[1] != b[1]:
            cove_x = a[0] + (nw[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1])
            break
    # past the seam the run-on bank (S3's land, not built) must not be reached from a deck: the big cabin boat's stern
    # runs 3-6 m past the seam and opens its rails onto that bank (QA); edge:east carries on along the run-on shore,
    # and drops with the rest of edge:east when S3 is loaded (then S3's own bank is there)
    run = [seam_pt] + [p for p in S3_NEAR_SHORE if p[0] > seam_pt[0] + 0.5]
    walls = {"south": [(sw, se)], "east": [(se, seam_pt)] + list(zip(run, run[1:])), "north": [((cove_x, nw[1]), nw)],
             "west": [(nw, sw)]}
    for side, segs in walls.items():
        with sb.entity(f"edge:{side}"):
            for (xa, ya), (xb, yb) in segs:
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
    c = [tuple(p) for p in L["route"]["centre"]]
    (ax, ay), (bx_, by) = c[0], c[1]
    head = (ax - (bx_ - ax) * 2, ay - (by - ay) * 2)
    (ax, ay), (bx_, by) = c[-2], c[-1]
    tail = (bx_ + (bx_ - ax) * 3, by + (by - ay) * 3)
    return [([head] + c + [tail], 4.0), (line("S4b.road.cross_13530", "centre"), 2.6),
            (line("S4b.road.top_street_13700", "centre"), 2.0)]


# ---------------------------------------------------------------- build / export

def build(scene, seed=4):
    sb.B = sb.Buckets(strict=True)
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    water_ent = river_lines()
    ground(rng, roads(L))
    north_west(rng)
    top_street(rng)
    wheelwright(rng)
    tea_house(rng)
    bank(rng)
    south_row(rng)
    props(rng)
    vehicles(rng)
    n_seats = seats(rng)
    colliders(L["trees"])
    # the river: one strip at the frame's water H between its shores as built (how: S4b.water.bian_river), stopped on
    # the part 1 seam (no water there) and on the S3 seam (S3's strip starts there edge to edge, joined 2026-10-12), run
    # on north under the mist; its shore walls (edge:shore)
    frame = json.load(open(FRAME_JSON, encoding="utf-8"))
    Hw = frame["supports"]["water"]["H"]
    quad = kb._grow_quad(kb.water_quad(L, Hw), [0.0, 0.0, RUN_ON, 0.0])
    ws = kb.water_strip(water_ent, frame, "S4b.water.bian_river", quad=quad, seams=("west", "east"))

    check_inside()
    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("outer_road_2__" + name)
        me.from_pydata([tuple(v) for v in b["v"]], [], b["f"])
        me.validate()
        if len(me.polygons) != len(b["f"]):
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
    verts, faces, bare = H["ground"]
    me = bpy.data.meshes.new("outer_road_2__ground__col")
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    tile = sb.MATERIALS["ground"][1]
    uv0, uv1 = me.uv_layers.new(name="UVMap"), me.uv_layers.new(name="Blend")
    for li, lp in enumerate(me.loops):
        co = verts[lp.vertex_index]
        uv0.data[li].uv = (co.x / tile, co.y / tile)
        uv1.data[li].uv = (bare[lp.vertex_index], 0.0)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.materials.append(sb.make_material("ground"))
    coll.objects.link(bpy.data.objects.new("g_ground__col", me))
    gt = sum(len(p.vertices) - 2 for p in me.polygons)
    stats["ground__col"] = gt
    kb.water_mesh(bpy, [ws], coll=coll)
    stats["water"] = ws.tris
    owners = dict(sb.B.tris)
    owners["ground"] = owners.get("ground", 0) + gt
    owners["S4b.water.bian_river"] = owners.get("S4b.water.bian_river", 0) + ws.tris
    placed_ = {"about": "Written by blender/outer_road_2_scene.py build(); never edit. Triangles per owner: map IDs, "
                        "'edge:*' (invisible colliders closing the walkable area; edge:shore along the water) and "
                        "'ground'. The boats are in their own GLB (gen/sections/outer_road_2/web_build/"
                        "outer_road_2_boats.json). tools/loyalty_check.mjs compares it with the map (map/BUILDING.md).",
               "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed_, f, indent=1, ensure_ascii=False)
    print("WATER " + json.dumps({"tris": ws.tris, "walls": ws.wall_pieces, "H": ws.H, "ring": len(ws.polygon),
                                 "notes": ws.notes, "seats": n_seats}), flush=True)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "buckets": stats}


def export(scene, path):
    return sb.export_collection(scene, COLL, path)
