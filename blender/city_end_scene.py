"""The scroll's end (S7, sections/city_end), walkable web scene, composed from the Song construction kit
(blender/song_kit.py), the finished areas' kits (blender/kit_inner_city.py, blender/kit_outer_road.py, imported
read-only) and the section's own kit (blender/kit_city_end.py).

build(scene) creates collection "city_end_scene": one mesh per (material, collide) bucket, named
"g_<material>__col" / "g_<material>__nocol" (the page collides with every "__col" mesh; "hidden__col" is
collider-only). export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships it.
Built headless: qingming/tools/build_scene.sh city_end (never in the live GUI, which is the lead's).

Positions come from the scroll map (qingming/map/README.md) through sections/city_end/layout.json
(tools/map_layout.mjs): X along the street (east = toward the inner city and the gate), Y depth (north), Z up, in the
one world frame shared with S6 and the gate (origin at S5's moat bridge; map/frames/S7.json continues S6's).
derive() reads every structure's place and street-level size from the layout by map ID. What the strokes can't give
(a hidden back wall, a roof's rise, the real size of the halls painted small at the top of the silk) is a builder
choice, marked "choice:" where it is made and listed in sections/city_end/notes.md.

Loyalty (map/BUILDING.md): one map entity, one model. Every piece of geometry is built inside
`sb.entity(<map id>)`; the bucket set is strict, so untagged geometry is an error. build() writes
sections/city_end/placed.json (triangles per map ID) for tools/loyalty_check.mjs, and
gen/sections/city_end/solids.json (where the colliders stand, by owner, for the casting script). Where the scroll
paints nothing the scene has no models: invisible edge walls close the walkable area (the painted area), and the page
paints what lies beyond: mist on every side (west: the scroll's cut end; north and south: the silk's edges; east: S6,
built).

The placeholder footprints of the roofs-only buildings (the halls at the top of the silk and every building south
of the street) were estimated in the scan with dx 50.4; with the frame's west knot they come out 2-6 deg off square.
They are built square (axis-aligned) on the mapped extents, each as a recorded choice.
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
import kit_outer_road as ko
import kit_city_end as kce
from song_kit import V

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
LAYOUT_JSON = QM + r"\sections\city_end\layout.json"
PLACED_JSON = QM + r"\sections\city_end\placed.json"
SOLIDS_JSON = QM + r"\gen\sections\city_end\solids.json"   # where the colliders stand (make_people.py reads it)
COLL = "city_end_scene"
UP = V((0, 0, 1))

LAYOUT = {}
E = {}
WALK = []
EXTENT = {}
PROPS = {}
SOLIDS = {"seats": {}, "passage": {}}
# Real size everywhere (the user, 2026-10-12): positions and footprints come from the map; heights, storeys,
# openings and the sizes of things are real. Painted props are drawn at the figures' 1.3x, so a painted size is used
# at px / 100; buildings near the street are painted at about the street's scale (77 px per metre); the halls at the
# top of the silk are painted at about 0.55 of it, so their heights are real choices.


def fp(eid):
    return [tuple(p) for p in E[eid]["footprint"]]


def dx_at(u):
    """The frame's receding direction at scan u (map/frames/S7.json dx_knots: linear between, constant beyond)."""
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


def seam_x(D):
    """X of the S6 seam (scan u 2000) at depth D: the painted area's east edge."""
    sw, se, ne, nw = LAYOUT["painted_area"]["corners"]
    return se[0] + (D - se[1]) * (ne[0] - se[0]) / (ne[1] - se[1])


def derive(L):
    E.clear()
    E.update(L["entities"])
    # a recorded move (build_choices.json) is already applied to the entity's pos, pts, footprint and bays in
    # layout.json (tools/map_layout.mjs)
    PROPS.clear()
    for eid, e in E.items():
        if e["kind"] == "prop":
            PROPS[eid] = e
    # the walkable area: the painted area (the S6 seam, the scroll's cut end and the silk's edges, layout painted_area)
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    xs = [p[0] for p in (sw, se, ne, nw)]
    # 16 m past the outer edges (west, north, south) so the mist (full 9 m out) covers the ground's end
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
    """Heightfield over the section: low undulation, the street slightly worn down. One smooth mesh; each vertex
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

    # the ground stops at the S6 seam (0.5 m past it, dipping 0.12 m toward it, so the inner city's own ground lies on
    # top where the two meet); on the other sides (the scroll's cut end, the silk's edges) it runs 16 m past the
    # painted area, deep enough under the mist that you never see it end
    (sw, se, ne, nw) = LAYOUT["painted_area"]["corners"]

    def x_on(a, b, y):
        return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])

    def hz(x, y):
        d = x_on(se, ne, y) - x
        return h(x, y) - 0.12 * (1 - _smooth(-0.5, 1.5, d))

    nx, ny = X1 - X0, Y1 - Y0
    verts = [V((X0 + i, Y0 + j, 0.0)) for j in range(ny + 1) for i in range(nx + 1)]
    # a clean edge along the seam, the cut line 0.5 m east of it (no 1 m stair-steps): every cell that reaches west
    # of the cut is kept, every vertex past the cut is moved west onto it, and the triangles that collapse are dropped
    for v in verts:
        cut = x_on(se, ne, v.y) + 0.5
        if v.x > cut:
            v.x = cut
        v.z = hz(v.x, v.y)
    faces = []
    for j in range(ny):
        for i in range(nx):
            cy0, cy1 = Y0 + j, Y0 + j + 1
            cx = X0 + i + 0.5
            if not (x_on(sw, nw, cy0 + 0.5) - 16.0 < cx and X0 + i < max(x_on(se, ne, cy0), x_on(se, ne, cy1)) + 0.5 - 1e-6):
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


# ---------------------------------------------------------------- small helpers

def gable_y(x0, x1, y0, y1, z_eave, z_ridge, over=0.5, **kw):
    """A gable roof whose ridge runs north-south (song_kit.gable_roof turned 90 degrees): x0, x1 are its eave lines,
    y0..y1 the ridge's length (plus `over` past each gable)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    with k.placed(k.frame(cx, cy, 0, 90)):
        k.gable_roof(y0 - cy, y1 - cy, -(x1 - cx), -(x0 - cx), z_eave, z_ridge, over=over, **kw)


def gable_wall_x(x, ya, yb, z0, z1, mat="plaster"):
    """The triangle of a gable wall in the plane x = const under a ridge along X... (ridge across the wall: the wall
    runs ya -> yb, its apex z1 at the middle)."""
    a, b, c = V((x, ya, z0)), V((x, yb, z0)), V((x, (ya + yb) / 2, z1))
    sb.B.add(mat, False, [a, b, c], [(0, 1, 2)])
    sb.B.add(mat, False, [c, b, a], [(0, 1, 2)])


def gable_wall_y(y, xa, xb, z0, z1, mat="plaster"):
    a, b, c = V((xa, y, z0)), V((xb, y, z0)), V(((xa + xb) / 2, y, z1))
    sb.B.add(mat, False, [a, b, c], [(0, 1, 2)])
    sb.B.add(mat, False, [c, b, a], [(0, 1, 2)])


def roof_top_z(z_eave, z_ridge, t, curve=1.35):
    """song_kit.gable_roof's tiled top at fraction t from the eave line to the ridge (mid-length, no corner lift)."""
    return z_eave + (z_ridge - z_eave) * (t ** curve)


def closed_walls(x0, x1, y0, y1, z0, z1, rng, mat="plaster", thick=0.18, skip=()):
    """Four plain walls on an axis-aligned plan (sides 'south', 'east', 'north', 'west'; `skip` leaves sides out
    for the caller to build with openings)."""
    sides = {"south": ((x0, y0), (x1, y0)), "east": ((x1, y0), (x1, y1)), "north": ((x1, y1), (x0, y1)),
             "west": ((x0, y1), (x0, y0))}
    for s, (a, b) in sides.items():
        if s not in skip:
            k.board(mat, True, a, b, thick, z0, z1)


def tile_ends(x0, x1, y, z, step=0.28, out=-1):
    """Round tile-ends (瓦当) along an eave running along X at y, facing out (-1 south, +1 north)."""
    n = int((x1 - x0) / step) + 1
    for i in range(n):
        x = x0 + i * step
        sb.cyl("roof", False, (x, y, z), (x, y + 0.05 * out, z), 0.085, segs=8)


# ---------------------------------------------------------------- 官宦人家: the gate hall, its blocks and railing

def gatehouse(rng):
    """The street gate hall (门屋) of the official's compound (S7.bld.gatehouse_1240): single storey, open to the
    street under a hipped tiled roof with bracket sets, a lintel over the passage between the west column (on its
    stone block) and the east post (on the east block). From west to east along the front, as painted: the
    plain-walled west bay where the gatekeeper sits, with a rolled blind high under its eave (u 1088-1134); the west
    column on its block and the west pier, with the low dark-hatched panel standing on the block (u 1167-1186); the
    passage between its jambs (u 1204-1350), the light door leaf standing open inside it against the west side, a
    small lamp hung from the lintel in its east part (u ~1337), and at its back the low railed partition under a post
    from the lintel; the east post on the east block and a plain east bay.
    choice: the east end at 赵太丞家's west wall (the free-standing boards hide where it ends; est u 1385, the roof
    reaches 1417), so no gap opens between the two fronts; the back at the mapped est D 15.71; the door frame at
    mid-depth (the painted leaf's foot lies 100 px up the silk, behind the front: a 门屋's doors stand under its
    ridge) with the one painted leaf; ridge 5.75 m (130 px over the eave); the passage square to the street (the
    frame's west knot would lean its painted walls about 1 m west over its depth)."""
    e = E["S7.bld.gatehouse_1240"]
    y0, y1 = 13.03, 15.71
    x0 = -103.62
    x1 = E["S7.bld.zhao_taicheng"]["footprint"][0][0] - 0.13      # choice: up to 赵太丞家's west wall
    xc, xp = (b[0] for b in e["bays"])                            # west column (u 1135), east post (u 1360)
    xjw, xje = ux(1204, y0), ux(1350, y0)                         # the passage's jambs
    ze = (e["heights"]["sw_eave"] + e["heights"]["se_eave"]) / 2  # 4.0
    zl = zv(650, 897)                                             # lintel 249 px over the passage floor: 3.2
    zr = ze + 1.75
    ypb = 15.55                                                   # the passage's back: the partition (foot v 757)
    ydoor = 14.45                                                 # choice: the door frame at mid-depth
    zb_w = E["S7.str.gate_block_1160"]["heights"]["sw_top"]
    zb_e = E["S7.str.gate_block_east_1345"]["heights"]["sw_top"]
    ywall_e = E["S7.str.gate_block_east_1345"]["footprint"][2][1] + 0.05   # the east bay's front behind its block
    with sb.entity("S7.bld.gatehouse_1240"):
        # the west bay: a plain front wall up to a beam, the rolled blind over a dark opening above it
        yf = y0 + 0.08
        k.board("plaster", True, (x0, yf), (xc - 0.13, yf), 0.18, 0.0, zv(659, 897))
        k.beam("timber", False, (x0, yf - 0.02, zv(659, 897)), (xc, yf - 0.02, zv(659, 897)), 0.16, 0.12, 0.02)
        sb.quad("interior", False, (xc - 0.15, yf + 0.06, zv(656, 897)), (x0 + 0.1, yf + 0.06, zv(656, 897)),
                (x0 + 0.1, yf + 0.06, zv(625, 897)), (xc - 0.15, yf + 0.06, zv(625, 897)))
        ko.bamboo_blind((ux(1088, y0), yf - 0.06), (ux(1134, y0), yf - 0.06), zv(656, 897), zv(629, 897), rng)
        k.board("plaster", False, (x0, yf), (xc - 0.13, yf), 0.18, zv(625, 897), ze - 0.32)
        # the west column on its block, the west pier behind the block, the hatched panel standing on the block
        k.column(xc, y0 + 0.12, zb_w, ze - 0.3, r=0.13, mat="redwood", base=False)
        k.column(x0 + 0.1, y0 + 0.12, 0.0, ze - 0.3, r=0.12, mat="redwood")
        k.board("plaster", True, (xc + 0.1, 13.52), (xjw, 13.52), 0.16, 0.0, zl)
        xh0, xh1, zh1 = ux(1167, y0), ux(1186, y0), zv(785, 897)
        k.board("lattice", False, (xh0, 13.24), (xh1, 13.24), 0.04, zb_w, zh1)
        for t in (0.15, 0.45, 0.75):   # its dark hatching: slanting battens on its face
            k.beam("timber", False, (xh0 + 0.02, 13.21, zb_w + (zh1 - zb_w) * t), (xh1 - 0.02, 13.21, zb_w + (zh1 - zb_w) * (t + 0.2)),
                   0.025, 0.02, 0)
        # the passage: jambs, side walls running back, the lintel and a plank ceiling, the lamp
        for xj in (xjw, xje):
            k.post("redwood", True, xj, y0 + 0.1, 0.0, zl, 0.17, 0.02)
            k.board("plaster", True, (xj, y0 + 0.2), (xj, y1), 0.16, 0.0, zl)
        k.beam("redwood", False, (xc - 0.1, y0 + 0.1, zl + 0.1), (xp + 0.1, y0 + 0.1, zl + 0.1), 0.2, 0.22, 0.03)
        k.bx("deck", False, (xjw + 0.08, y0 + 0.2, zl), (xje - 0.08, y1, zl + 0.06))
        xl = ux(1337, y0) - 0.05
        ki.round_lantern(xl, 13.55, 2.72, r=0.12)
        k.beam("rope", False, (xl, 13.55, 2.84), (xl, 13.55, zl), 0.012, 0.012, 0)
        # the door frame at mid-depth and its one painted leaf, open against the west side
        k.beam("redwood", False, (xjw, ydoor, 2.55), (xje, ydoor, 2.55), 0.12, 0.16, 0.02)
        for xj in (xjw + 0.1, xje - 0.1):
            k.post("redwood", False, xj, ydoor, 0.0, 2.55, 0.1, 0.015)
        kce.plain_leaf((xjw + 0.16, ydoor), (xjw + 0.16 + (xje - xjw - 0.32) / 2, ydoor), 0.03, 2.45, 82, rng)
        # the low railed partition at the back, under a post from the back lintel
        k.beam("redwood", False, (xjw, ypb, zl - 0.05), (xje, ypb, zl - 0.05), 0.14, 0.18, 0.02)
        kce.low_partition((xjw + 0.08, ypb), (xje - 0.08, ypb), 0.0, 0.66, rng, rails=(0.06, 0.6, 0.78, 0.98),
                          post_to=zl - 0.14, post_at=0.5)   # rails as painted (v 708, 718, 727 over a foot at 754-757)
        SOLIDS["passage"] = {"x": [round(xjw + 0.08, 2), round(xje - 0.08, 2)], "y": [y0, ypb],
                             "door_leaf": [[round(xjw + 0.16, 2), ydoor], 82],
                             "about": "the gate passage between its jambs, open to the street; the door frame at "
                                      "D %.2f, its one leaf open (82 deg) against the west side; the partition at its back" % ydoor}
        # the east post on its block, the east bay's plain front behind the block, the east end wall
        k.column(xp, y0 + 0.12, zb_e, ze - 0.3, r=0.13, mat="redwood", base=False)
        k.board("plaster", True, (xje + 0.08, ywall_e), (x1, ywall_e), 0.16, 0.0, ze - 0.32)
        k.column(x1 - 0.1, y0 + 0.12, 0.0, ze - 0.3, r=0.12, mat="redwood")
        # side and back walls (the bays are closed rooms; the passage runs through to the courtyard behind)
        k.board("plaster", True, (x0, y0 + 0.1), (x0, y1), 0.18, 0.0, ze - 0.3)
        k.board("plaster", True, (x1, ywall_e), (x1, y1), 0.18, 0.0, ze - 0.3)
        k.board("plaster", True, (x0, y1), (xjw, y1), 0.18, 0.0, ze - 0.3)
        k.board("plaster", True, (xje, y1), (x1, y1), 0.18, 0.0, ze - 0.3)
        # the frieze over the lintel, the eave beam, three bracket sets as painted (u 1105-1167, 1224-1274, 1330-1380)
        k.board("plaster", False, (x0, y0 + 0.1), (x1, y0 + 0.1), 0.14, zl + 0.21, ze - 0.4)
        k.board("plaster", False, (xjw, y1 - 0.05), (xje, y1 - 0.05), 0.14, zl + 0.05, ze - 0.4)
        k.beam("timber", False, (x0 - 0.25, y0 + 0.1, ze - 0.36), (x1 + 0.25, y0 + 0.1, ze - 0.36), 0.2, 0.24, 0.03)
        for u in (1136, 1249, 1355):
            k.bracket(ux(u, y0), y0 + 0.1, ze - 0.36 - 0.12, (0, -1), s=0.42)
        k.hip_roof(x0 - 0.8, x1 + 0.6, y0 - 0.85, y1 + 0.55, ze, zr, lift=0.45, ns=14, nt=6, ornament_s=0.9)


def gate_blocks(rng):
    """The two knee-high squared blocks at the gate (上马石 or pier plinths): the west one under the west column
    (0.79 x 0.61 m as painted), the east one under the east post (0.56 m); stone, their east faces hatched dark as
    painted (a darker stone face). Built square on their mapped corners."""
    for eid in ("S7.str.gate_block_1160", "S7.str.gate_block_east_1345"):
        e = E[eid]
        f = e["footprint"]
        xa, xb = min(p[0] for p in f[:2]), max(p[0] for p in f[:2])
        ya, yb = f[0][1], f[2][1]
        zt = e["heights"]["sw_top"]
        with sb.entity(eid):
            k.soft_box("stone", True, (xa, ya, -0.04), (xb, yb, zt), rng, r=0.03, wob=0.005, tilt=0.004)
            sb.quad("interior", False, (xb + 0.004, ya + 0.04, 0.03), (xb + 0.004, yb - 0.04, 0.03),
                    (xb + 0.004, yb - 0.04, zt - 0.05), (xb + 0.004, ya + 0.04, zt - 0.05))


def railing(rng):
    """The low railing west of the gate hall (S7.str.fence_960): square posts with flat caps (painted at u 909 and
    992, a third behind the gatekeeper at ~1060) and three rails; 89 px tall (0.89 m). It ends at its west post
    (u 908): under the seal at the cut edge no rail is painted."""
    line = E["S7.str.fence_960"]["lines"]["line"]
    with sb.entity("S7.str.fence_960"):
        kce.capped_rail_fence([tuple(line[0]), tuple(line[-1])], 0.89, rng, rails=(0.08, 0.46, 0.79), post_every=1.0)


# ---------------------------------------------------------------- 赵太丞家, the doctor's house

def zhao_shop(rng):
    """赵太丞家, the doctor's shop (S7.bld.zhao_taicheng): an open-fronted shop hall on its two painted columns (west
    u 1486 on a dark base, east u 1759), a front beam (v 656), and above it, between ornamented bracket clusters, the
    four lozenge name tablets 趙 · 太 · 丞 · 家 (read east to west, as hung); the board 五勞七傷□□□ fixed to the front of
    the west column (u 1458-1486, v 675-820); plaster side walls, a back wall behind the counter, a gable roof whose
    ridge runs along the street. The floor is at street level (no step painted).
    choice: the back wall at D 15.55 (est 14.99 is the counter's foot line: the counter stands inside it); ridge
    5.4 m; the gables plastered."""
    e = E["S7.bld.zhao_taicheng"]
    xw, xe = (b[0] for b in e["bays"])
    y0, yb = e["footprint"][0][1], 15.55
    ze = e["heights"]["sw_eave"]
    zr = 5.4
    zbeam = zv(656, 897)
    with sb.entity("S7.bld.zhao_taicheng"):
        for x in (xw, xe):
            k.column(x, y0, 0.0, ze - 0.28, r=0.12, mat="redwood")
        k.beam("redwood", False, (xw - 0.15, y0, zbeam), (xe + 0.15, y0, zbeam), 0.16, 0.2, 0.025)
        k.beam("timber", False, (xw - 0.35, y0, ze - 0.28), (xe + 0.35, y0, ze - 0.28), 0.18, 0.24, 0.03)
        # bracket clusters on the beam between the tablets, the tablets hung between them (east to west 趙 太 丞 家)
        for u in (1520, 1605, 1685):
            k.bracket(ux(u, y0), y0, zbeam + 0.1, (0, -1), s=0.4)
        for (u0, u1), cell in (((1458, 1498), "tablet_jia"), ((1545, 1585), "tablet_cheng"),
                               ((1625, 1668), "tablet_tai"), ((1700, 1740), "tablet_zhao")):
            kce.lozenge_tablet((ux((u0 + u1) / 2, y0), y0 - 0.14, zv(631, 897)), (0, -1), 0.42, cell, rng, hang=0.05)
        kce.wall_board((ux(1458, y0), y0 - 0.15), (ux(1486, y0) + 0.02, y0 - 0.15), zv(820, 897), zv(675, 897),
                       "board_wulao", rng)
        # side walls, the back wall (its inner face dark), the gables
        k.board("plaster", True, (xw, y0 + 0.16), (xw, yb), 0.16, 0.0, ze - 0.3)
        k.board("plaster", True, (xe, y0 + 0.16), (xe, yb), 0.16, 0.0, ze - 0.3)
        k.board("plaster", True, (xw, yb), (xe, yb), 0.16, 0.0, ze - 0.3)
        sb.quad("interior", False, (xe - 0.1, yb - 0.09, 0.02), (xw + 0.1, yb - 0.09, 0.02), (xw + 0.1, yb - 0.09, ze - 0.4),
                (xe - 0.1, yb - 0.09, ze - 0.4))
        yf_e, yb_e = y0 - 0.85, yb + 0.3
        zw = ze - 0.3
        zg = roof_top_z(ze, zr, 1.0) - 0.25
        for x in (xw, xe):
            gable_wall_x(x, y0 + 0.1, yb, zw, zg)
        k.gable_roof(xw - 0.1, xe + 0.1, yf_e, yb_e, ze, zr, over=0.45, ornament_s=0.6)


def zhao_back_hall(rng):
    """The back hall of 赵太丞家 (S7.bld.zhao_back_hall_1630): only the south slope of its roof is painted, with a
    ridge-end ornament at its west end. choice: its front at D 15.8 (est 15.32: the front hall's back wall stands at
    15.55, the gate hall's at 15.71), its back at 17.8 (the middle hall's front, 18.0); eave 3.6 m and ridge 5.9 m (real;
    the ridge shows over the shop's); plain walls, a door in its east end (the walls are not painted)."""
    f = fp("S7.bld.zhao_back_hall_1630")
    x0, x1 = f[0][0], f[1][0]
    y0, y1 = 15.8, 17.8
    ze, zr = 3.6, 5.9
    with sb.entity("S7.bld.zhao_back_hall_1630"):
        k.soft_plinth(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, 0.12, rng, edge=0.3)
        closed_walls(x0, x1, y0, y1, 0.12, ze - 0.3, rng, skip=("east",))
        ki.wall_bays((x1, y0), (x1, y1), 0.12, ze - 0.3, [0, 0.25, 0.75, 1.0], ["wall", "door", "wall"], rng)
        for x in (x0, x1):
            gable_wall_x(x, y0, y1, ze - 0.3, roof_top_z(ze, zr, 1.0) - 0.2)
        k.gable_roof(x0, x1, y0 - 0.4, y1 + 0.4, ze, zr, over=0.4, ornament_s=0.65)


# ---------------------------------------------------------------- the halls at the top of the silk

def compound_hall(rng):
    """The middle hall of the official's compound (S7.bld.compound_hall_1420), behind the gate hall: a long tiled hall
    whose south slope is painted, with a ridge-end ornament at its east end (its west end behind the willow).
    choice: front D 18.0 (est 17.85, clear of the back hall), back 20.4 as mapped; eave 3.8 m and ridge 6.4 m (real;
    painted at about 0.55); its front to the courtyard behind the gate hall with windows and doors (not painted: the
    doors are closed by invisible boards), the other walls plain."""
    f = fp("S7.bld.compound_hall_1420")
    x0, x1 = max(f[0][0], f[3][0]), min(f[1][0], f[2][0])
    y0, y1 = 18.0, 20.4
    ze, zr = 3.8, 6.4
    with sb.entity("S7.bld.compound_hall_1420"):
        k.soft_plinth(x0 - 0.1, x1 + 0.1, y0 - 0.15, y1 + 0.05, 0.2, rng, edge=0.34)
        ki.wall_bays((x0, y0), (x1, y0), 0.2, ze - 0.3, [0, 0.12, 0.3, 0.42, 0.58, 0.7, 0.88, 1.0],
                     ["wall", "window", "door", "window", "door", "window", "wall"], rng, sill=0.85)
        closed_walls(x0, x1, y0, y1, 0.2, ze - 0.3, rng, skip=("south",))
        for x in (x0, x1):
            gable_wall_x(x, y0, y1, ze - 0.3, roof_top_z(ze, zr, 1.0) - 0.2)
        k.gable_roof(x0, x1, y0 - 0.6, y1 + 0.5, ze, zr, over=0.5, ornament_s=0.8)


HALL_NS = {"x0": -105.0, "x1": -100.0, "y0": 20.5, "y1": 24.6, "ze": 2.85, "zr": 4.8, "over": 0.6}


def hall_ns(rng):
    """The long north-south hall behind 赵太丞家 (S7.bld.hall_ns_1620): a tiled roof whose ridge runs back (north),
    its broad east slope carrying a tall narrow pale vent (u 1760-1791) and the crow (S7.ani.bird_roof_1735, perched
    at its mapped H 3.2 m). choice: real size (painted at about 0.55): eave 2.85 m and ridge 4.8 m (a side hall);
    its east wall at X -100.0 (the placeholder's -98.3 is 1.7 m further east): built real, the east slope is 3.2 m
    high at the crow's mapped spot, so the crow sits on the tiles where it is painted (the frame's support 'roof:
    S7.bld.hall_ns_1620', H 3.2, 'the bird goes on its east slope'); its north end at D 24.6 (est 25.07), clear of the
    two needle trees in the courtyard (D 25.5); the east wall, toward the open courtyard, with windows and a door."""
    H = HALL_NS
    x0, x1, y0, y1, ze, zr, ov = H["x0"], H["x1"], H["y0"], H["y1"], H["ze"], H["zr"], H["over"]
    xa, xb = x0 - ov, x1 + ov
    xc = (xa + xb) / 2
    with sb.entity("S7.bld.hall_ns_1620"):
        k.soft_plinth(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, 0.12, rng, edge=0.3)
        ki.wall_bays((x1, y0), (x1, y1), 0.12, ze - 0.12, [0, 0.22, 0.42, 0.58, 0.78, 1.0],
                     ["wall", "window", "door", "window", "wall"], rng, sill=0.8)
        closed_walls(x0, x1, y0, y1, 0.12, ze - 0.12, rng, skip=("east",))
        for y in (y0, y1):
            gable_wall_y(y, x0, x1, ze - 0.12, roof_top_z(ze, zr, 1.0) - 0.2)
        gable_y(xa, xb, y0, y1, ze, zr, over=0.45, ornament_s=0.6)
        # the vent on the east slope (painted u 1760-1791, v 186-268), its foot on the tiles
        xv, yv, wv = xc + 0.62 * (xb - xc), 21.9, 0.36
        tv = (xb - (xv + wv / 2)) / (xb - xc)
        kce.roof_vent(xv, yv, roof_top_z(ze, zr, tv), w=wv, d=0.3, h=1.0, rng=rng)


def bird_check():
    """The crow's perch: the built east slope's height at its mapped spot (it must be its support H, 3.2 m)."""
    H = HALL_NS
    b = E["S7.ani.bird_roof_1735"]
    xa, xb = H["x0"] - H["over"], H["x1"] + H["over"]
    xc = (xa + xb) / 2
    t = (xb - b["pos"][0]) / (xb - xc)
    return {"bird_H": b["H"], "roof_top_at_bird": round(roof_top_z(H["ze"], H["zr"], t), 3)}


def main_hall(rng):
    """The main hall of the official's compound at the top of the silk (S7.bld.main_hall_1300): a long hip-gable
    (歇山) roof with tile-ends along its eave and its east gable showing; under the eave its front, between posts
    (u ~1125 and ~1320), the patterned curtain or screen with its dark doorway and the curved tie; a further post
    east of it (u ~1373); the hall stands on a low platform. choice: real size (painted at about 0.55): eave 4.2 m,
    ridge 7.3 m; its east end at the north-south hall's west wall (X -105.1; mapped -104.39 overlaps it); the rest of
    the front plain with a lattice window; side and back walls plain."""
    f = fp("S7.bld.main_hall_1300")
    x0, x1 = max(f[0][0], f[3][0]), HALL_NS["x0"] - 0.1
    y0, y1 = f[0][1], f[2][1]
    ze, zr, zp = 4.2, 7.3, 0.25
    xa, xb, xc2 = ux(1125, y0), ux(1320, y0), ux(1373, y0)
    with sb.entity("S7.bld.main_hall_1300"):
        k.soft_plinth(x0 - 0.3, x1 + 0.25, y0 - 0.45, y1 + 0.2, zp, rng, edge=0.38)
        for x in (x0 + 0.12, xa, xb, xc2, x1 - 0.12):
            k.column(x, y0 + 0.05, zp, ze - 0.3, r=0.13, mat="redwood", base=False)
        kce.patterned_front((xa + 0.13, y0 + 0.12), (xb - 0.13, y0 + 0.12), zp + 0.05, ze - 0.55, rng,
                            door=((1248 - 1125) / (1320 - 1125), 0.09, 0.42))
        k.board("plaster", True, (x0 + 0.24, y0 + 0.12), (xa - 0.13, y0 + 0.12), 0.16, zp, ze - 0.4)
        ki.wall_bays((xb + 0.13, y0 + 0.12), (xc2 - 0.13, y0 + 0.12), zp, ze - 0.4, [0, 1.0], ["window"], rng, sill=1.0,
                     posts=False)
        k.board("plaster", True, (xc2 + 0.13, y0 + 0.12), (x1 - 0.24, y0 + 0.12), 0.16, zp, ze - 0.4)
        k.beam("timber", False, (x0 - 0.2, y0 + 0.05, ze - 0.36), (x1 + 0.2, y0 + 0.05, ze - 0.36), 0.2, 0.26, 0.03)
        closed_walls(x0, x1, y0 + 0.12, y1, zp, ze - 0.3, rng, skip=("south",))
        ki.xieshan_roof(x0 - 0.9, x1 + 0.9, y0 - 0.95, y1 + 0.8, ze, zr, along="x", ornament_s=1.0, lift=0.5, ns=12, nt=6)
        tile_ends(x0 - 0.7, x1 + 0.7, y0 - 0.97, ze - 0.08)


def far_gable(rng):
    """The gable end at the silk's top edge behind the main hall (S7.bld.far_gable_1345): a small gable (山花) with a
    king post rising over the main hall's ridge, the end of a building behind it. choice: a building 2.6 m wide and
    2.8 m deep on its mapped spot (footprint 1.6 x 1.0 placeholder), its gable to the south, eave 5.4 m and ridge
    8.0 m so the gable shows over the main hall's ridge (7.3 m) as painted; a storey beam, corner posts, a door
    and an upper window in its east wall toward the courtyard (its walls are not painted)."""
    f = fp("S7.bld.far_gable_1345")
    cx = (f[0][0] + f[1][0]) / 2
    x0, x1 = cx - 1.3, cx + 1.3
    y0, y1 = f[0][1], f[0][1] + 2.8
    ze, zr = 5.4, 8.0
    with sb.entity("S7.bld.far_gable_1345"):
        k.soft_plinth(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, 0.2, rng, edge=0.3)
        closed_walls(x0, x1, y0, y1, 0.2, ze - 0.15, rng, skip=("east",))
        ki.wall_bays((x1, y0), (x1, y1), 0.2, 2.9, [0, 0.3, 0.7, 1.0], ["wall", "door", "wall"], rng)
        ki.wall_bays((x1, y0), (x1, y1), 2.9, ze - 0.15, [0, 0.25, 0.75, 1.0], ["wall", "window", "wall"], rng, sill=0.7)
        for x in (x0, x1):
            for y in (y0, y1):
                k.post("redwood", False, x, y, 0.2, ze - 0.1, 0.22, 0.03)
        for a, b in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
            k.beam("timber", False, (a[0], a[1], 2.9), (b[0], b[1], 2.9), 0.2, 0.22, 0.03)   # the storey beam
        for y in (y0, y1):
            gable_wall_y(y, x0, x1, ze - 0.15, roof_top_z(ze, zr, 1.0) - 0.15)
        k.post("redwood", False, cx, y0 - 0.06, ze - 0.15, zr - 0.25, 0.1, 0.015)          # the king post
        k.beam("redwood", False, (x0, y0 - 0.06, ze - 0.1), (x1, y0 - 0.06, ze - 0.1), 0.1, 0.16, 0.015)
        gable_y(x0 - 0.45, x1 + 0.45, y0, y1, ze, zr, over=0.45, ornament_s=0.5)


# ---------------------------------------------------------------- east of the shop

def box_shed(rng):
    """The box-like shed east of 赵太丞家 (S7.str.box_shed_1855, faint): a small booth with a slanted flat top, plank
    sides and slats across its front near its foot. choice: 1.65 m at its front, 1.95 m at its back (its top 1.7 m
    over the est base v 870), built square on its mapped corners."""
    f = fp("S7.str.box_shed_1855")
    x0, x1, y0, y1 = f[0][0], max(f[1][0], f[2][0]), f[0][1], f[2][1]
    with sb.entity("S7.str.box_shed_1855"):
        kce.box_shed((x0, y0), (x1, y0), (x1, y1), (x0, y1), 1.65, 1.95, rng)


# ---------------------------------------------------------------- south of the street

def gate_roof(rng):
    """The small gate roof on posts on the street's south side (S7.str.gate_roof_1475), probably the street gate (门罩)
    of the hip-gable building behind it: a hipped tiled roof with upturned ornaments at both ridge ends and round
    tile-ends hanging along its south eave, on four posts with brackets. choice: eave 2.35 m, ridge 3.45 m (112 px of
    ridge over the eave); the posts set 0.3 m in from its mapped corners; bracket sets on the street side only."""
    f = fp("S7.str.gate_roof_1475")
    x0, x1 = max(f[0][0], f[3][0]), min(f[1][0], f[2][0])
    y0, y1 = f[0][1], f[2][1]
    ze, zr = 2.35, 3.45
    with sb.entity("S7.str.gate_roof_1475"):
        for x in (x0 + 0.3, x1 - 0.3):
            for y in (y0 + 0.2, y1 - 0.2):
                k.column(x, y, 0.0, ze - 0.25, r=0.1, mat="redwood")
        for y in (y0 + 0.2, y1 - 0.2):
            k.beam("redwood", False, (x0 + 0.1, y, ze - 0.3), (x1 - 0.1, y, ze - 0.3), 0.14, 0.18, 0.02)
        for x in (x0 + 0.3, x1 - 0.3):
            k.beam("redwood", False, (x, y0 + 0.1, ze - 0.3), (x, y1 - 0.1, ze - 0.3), 0.12, 0.16, 0.02)
            k.bracket(x, y1 - 0.2, ze - 0.22, (0, 1), s=0.3)     # on the street side only (its back is hidden)
        k.hip_roof(x0 - 0.45, x1 + 0.45, y0 - 0.5, y1 + 0.55, ze, zr, lift=0.4, ns=10, nt=5, ornament_s=0.75)
        tile_ends(x0 - 0.3, x1 + 0.3, y0 - 0.52, ze - 0.1)


def hip_gable(rng):
    """The hip-gable building south of the street (S7.bld.hip_gable_1360): a hip-gable (歇山) roof whose ridge runs
    east-west, its east gable (山花) with curved bargeboards, a tie beam and the hanging-fish ornament; walls hidden
    (behind the gate roof, the 解 building and the bottom trees). choice: the footprint X -93.0..-87.75, D -0.6..2.44
    (the placeholder was 3.0 m along the ridge by 5.1 m deep, which a hip-gable roof can't cover: its west end is
    hidden in the trees (est u ~1250, X -91.7) and is carried 1.3 m further west, its south wall 2 m north of the est
    -2.63, clear of the bottom trees); eave 3.0 m, ridge 4.6 m (painted ~4.5 at 0.8 of the street's scale); its
    street front (north) plain with a door under the gate roof."""
    x0, x1, y0, y1 = -93.0, -87.75, -0.6, 2.44
    ze, zr = 3.0, 4.6
    with sb.entity("S7.bld.hip_gable_1360"):
        k.soft_plinth(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, 0.15, rng, edge=0.3)
        door_t = ((-89.94) - x1) / (x0 - x1)      # the door under the gate roof's middle
        ki.wall_bays((x1, y1), (x0, y1), 0.15, ze - 0.3, [0, door_t - 0.12, door_t + 0.12, 1.0], ["wall", "door", "wall"], rng)
        closed_walls(x0, x1, y0, y1, 0.15, ze - 0.3, rng, skip=("north",))
        ki.xieshan_roof(x0 - 0.7, x1 + 0.7, y0 - 0.7, y1 + 0.7, ze, zr, along="x", ornament_s=0.8, lift=0.45, ns=12, nt=5)
        d = (y1 - y0 + 1.4) / 2
        xg = x1 + 0.7 - d * 0.62
        ko.hanging_fish((xg + 0.08, (y0 + y1) / 2, zr - 0.15), (1, 0), s=0.8)


JIE = {"x0": -86.3, "x1": -80.92, "y0": -4.29, "y1": -0.2, "ze": 2.75, "zr": 4.3, "eave_e": -79.75, "eave_w": -86.9}


def jie_building(rng):
    """The 解 building south of the street (S7.bld.jie_building_1800): a single-storey building with its gable end to
    the street and a long tiled roof whose ridge runs back (south) from a ridge-end ornament; a corner ornament at its
    north-east eave corner, where S6's mat awning ties in; its deep east eave carried by a post (painted u 1922-1941,
    foot est v 1728), and from the post the bar running east toward S6's leaning 解 board (its plaque is S6's: the
    bar's west part, to the seam at u 2000, is built here); under the east eave a rail or shelf (v 1604-1630) between
    the wall and the post. choice: the walls on the mapped footprint (its south end at the silk's edge: the building
    runs on beyond it); eave 2.75 m (the post's 211 px), ridge 4.3 m; the east eave 1.17 m deep to the post (its
    painted line, X -79.8 at the post); the eave purlin carried on tie beams from the end walls; its street gable with a
    door (the wall is hidden)."""
    J = JIE
    x0, x1, y0, y1, ze, zr = J["x0"], J["x1"], J["y0"], J["y1"], J["ze"], J["zr"]
    xa, xb = J["eave_w"], J["eave_e"]
    post = (ux(1931, -3.18), -3.18)
    zbar = zv(1522, 1728)
    with sb.entity("S7.bld.jie_building_1800"):
        k.soft_plinth(x0 - 0.05, x1 + 0.05, y0 + 0.05, y1 + 0.05, 0.1, rng, edge=0.28)
        ki.wall_bays((x1, y1), (x0, y1), 0.1, ze - 0.2, [0, 0.42, 0.62, 1.0], ["wall", "door", "wall"], rng)
        closed_walls(x0, x1, y0, y1, 0.1, ze - 0.2, rng, skip=("north",))
        xr = (xa + xb) / 2
        for y in (y0, y1):
            gable_wall_y(y, x0, x1, ze - 0.2, roof_top_z(ze, zr, 1.0) - 0.15)
        # the east eave's purlin on tie beams from the end walls, the painted post, the shelf, the bar
        zp = roof_top_z(ze, zr, (xb - post[0]) / (xb - xr)) - 0.22
        k.beam("timber", False, (post[0], y0 - 0.2, zp), (post[0], y1 + 0.1, zp), 0.14, 0.16, 0.02)
        for y in (y0 + 0.15, y1 - 0.15):
            k.beam("timber", False, (x1, y, zp - 0.12), (post[0] + 0.08, y, zp - 0.12), 0.12, 0.16, 0.02)
        k.column(post[0], post[1], 0.0, zp - 0.08, r=0.1, mat="timber")
        # the shelf under the eave (its painted band v 1604-1630): a board on brackets from the wall, a rail under it
        zs = zv(1604, 1728)
        k.bx("timber", False, (x1 + 0.1, post[1] - 0.18, zs - 0.04), (post[0] - 0.1, post[1] + 0.12, zs))
        k.beam("timber", False, (x1 + 0.1, post[1] - 0.17, zv(1630, 1728)), (post[0], post[1] - 0.17, zv(1630, 1728)),
               0.05, 0.06, 0.008)
        for yb_ in (post[1] - 0.12, post[1] + 0.08):
            k.beam("timber", False, (x1 + 0.1, yb_, zs - 0.3), (x1 + 0.35, yb_, zs - 0.04), 0.04, 0.05, 0.005)
        k.beam("timber", False, (post[0] - 0.05, post[1], zbar), (seam_x(post[1]) - 0.02, post[1], zbar), 0.09, 0.11, 0.015)
        gable_y(xa, xb, y0, y1, ze, zr, over=0.5, ornament_s=0.65)
        # the corner ornament at its north-east eave corner
        k.ridge_ornament((xb - 0.05, y1 + 0.45, roof_top_z(ze, zr, 0.02) + 0.05), (1, 1), s=0.45)


# ---------------------------------------------------------------- props

def P(eid):
    return PROPS["S7.prop." + eid]["pos"]


S6_WELL_PLATFORM = None


def on_s6_platform(x, y):
    """Is (x, y) on the west end of S6's square well platform (S6.str.square_well_2000, built by S6 in its own frame:
    front edge v 997, back edge v 855, west ends u 1955 and 1995, at S6's dx 50.4)? Its planks' top is 0.08 m."""
    yf, yb = (1565 - 997) / 51.25, (1565 - 855) / 51.25
    xf, xbk = (1955 - 8248 - 50.4 * yf) / 77.0, (1995 - 8248 - 50.4 * yb) / 77.0
    if not yf <= y <= yb:
        return False
    # joined with S6 (2026-10-12, the join agent): S6's boards from D 12.18 north run on west to X -90.4
    # (blender/inner_city_scene.py well(), west_ext), under the bail bucket
    if y >= 12.18 and x >= -90.4:
        return True
    return x >= xf + (xbk - xf) * (y - yf) / (yb - yf)


def props(rng, h):
    """Every painted prop at its mapped spot (layout.json), each its own entity; sizes from the painting where measured
    (SCALE CUES in the map; painted props at px / 100, the figures' 1.3x), else choice."""
    def at(eid):
        p = P(eid)
        return p[0], p[1], h(p[0], p[1])

    def ent(eid):
        return sb.entity("S7.prop." + eid)

    # 赵太丞家's free-standing boards (characters below the scan's resolution: □), the lattice stand at their feet
    for eid, z0, z1, w, cell, base in (("board_zhao_west_a_1392", 0.53, 3.98, 0.26, "board_west_a", "splay"),
                                       ("board_zhao_west_b_1433", 0.78, 4.03, 0.28, "board_west_b", "curl"),
                                       ("board_zhao_east_1775", 0.85, 3.8, 0.3, "board_east", "splay")):
        x, y, z = at(eid)
        with ent(eid):
            kce.tall_signboard((x, y, z), (0, -1), z0, z1, w, cell, rng, base=base)
    x, y, z = at("lattice_stand_1452")
    with ent("lattice_stand_1452"):
        # 55 px across its top; its lower edge on the ground, its upper edge raised toward the north-east (45 px)
        kce.lattice_stand((x - 0.27, y - 0.12, z), (x + 0.25, y - 0.15, z), (x - 0.22, y + 0.14, z + 0.44),
                          (x + 0.32, y + 0.14, z + 0.44), rng)
        k.bx("hidden", True, (x - 0.28, y - 0.16, z), (x + 0.33, y + 0.16, z + 0.6))
    # inside the shop: the bench under the seated woman, the bench by the east board, the counter with its rack, the
    # doctor's armchair and its footrest
    x, y, z = at("bench_shop_west_1507")
    with ent("bench_shop_west_1507"):
        # 45 px long, seat 35 px up: a short bench along the front just inside the west column (the woman sits on it
        # facing the doctor); choice: 0.62 m long, 0.435 m high: fitted to her sit_hold_child (fix-gate, details pass
        # 2026-10-13, gen/details/contacts/fix_standard.md rule 3): its seat site, the lowest point of her hips and
        # thighs, is 0.44 m over her feet (gen/details/joints/woman_pale.json), so the top is 0.005 under it (at 0.55,
        # chosen from the hips joint, she sat 0.11 m into it)
        # it runs north-south, so she sits across it facing the doctor (along it, her shins went through its seat),
        # 0.13 m east of the column's plinth
        xb = x + 0.13
        ki.bench((xb, y - 0.13), (xb, y + 0.49), z, h=0.435, w=0.3)
        SOLIDS["seats"]["bench_shop_west_1507"] = {"from": [round(xb, 2), round(y - 0.13, 2)],
                                                   "to": [round(xb, 2), round(y + 0.49, 2)], "w": 0.3, "top": 0.435}
    x, y, z = at("bench_shop_east_1752")
    with ent("bench_shop_east_1752"):
        # end-on to the street behind the east board, legs 45 px: choice 0.9 m long along D
        ki.bench((x - 0.08, y - 0.3), (x - 0.08, y + 0.6), z, h=0.45, w=0.3)
        k.bx("hidden", True, (x - 0.24, y - 0.32, z), (x + 0.08, y + 0.62, z + 0.6))   # nobody sits on it: it blocks
    x, y, z = at("counter_back_1675")
    with ent("counter_back_1675"):
        # its foot line (v 797) is its front; 0.72 m high (64 px), 0.45 m deep, 2.8 m long inside the shop's walls;
        # the medicine rack on its east part (u 1597-1735 painted: 1.4 m), small jars and boxes on it
        ki.counter((x - 1.2, y), (x + 1.6, y), z, 0.72, 0.45, rng)
        kce.medicine_rack((x - 0.25, y + 0.03), (x + 1.15, y + 0.03), z + 0.72, 0.45, 0.3, rng)
    x, y, z = at("armchair_1657")
    with ent("armchair_1657"):
        # facing the street, its back legs against the counter's front (its feet est behind the footrest)
        kce.armchair(x, y - 0.08, z, 270, rng)
    x, y, z = at("footrest_1662")
    with ent("footrest_1662"):
        kce.footrest(x, y - 0.06, z, 270, w=0.55, d=0.3, h=0.15)
    # at the gate: the gatekeeper's box seat, the tied sack, the stones at the railing's foot
    x, y, z = at("seat_box_gatekeeper_1070")
    with ent("seat_box_gatekeeper_1070"):
        # front 65 x 48 px: 0.65 m wide, 0.4 deep (choice); seats don't collide. choice: 0.565 m high, fitted to the
        # gatekeeper's sit_talk (fix-gate, details pass 2026-10-13, gen/details/contacts/fix_standard.md rule 3): its seat
        # site is 0.569 m over his feet (gen/details/joints/robed_man.json), so the top is 0.005 under it (at the
        # painted 0.48 he sat 0.09 m over it)
        k.soft_box("timber", False, (x - 0.33, y - 0.2, z - 0.02), (x + 0.33, y + 0.2, z + 0.565), rng, r=0.03, wob=0.005)
        SOLIDS["seats"]["seat_box_gatekeeper_1070"] = {"from": [round(x - 0.33, 2), round(y, 2)],
                                                       "to": [round(x + 0.33, 2), round(y, 2)], "w": 0.4, "top": 0.565}
    x, y, z = at("tied_sack_1365")
    with ent("tied_sack_1365"):
        kce.sack(x, y, z, rng, h=0.8, r=0.3)    # 42 x 80 px: 0.8 m tall; a hidden collider so it is no step
    x, y, z = at("stones_fence_foot_945")
    with ent("stones_fence_foot_945"):
        # a dark low mass 55 x 15 px (0.7 x 0.2 m): three low stones (reading a; the other reading is the willow's root
        # flare under the seal)
        for dx, r in ((-0.24, 0.13), (0.02, 0.16), (0.26, 0.11)):
            k.rock("stone_dark", x + dx, y + rng.uniform(-0.04, 0.04), z, r, rng, flat=0.45)
    # east of the shop: the leaning reed panel, the buckets at the well's west end
    x, y, z = at("leaning_panel_1812")
    with ent("leaning_panel_1812"):
        # its foot block at v 922-945, its top (v ~800) against the shed's slatted front
        sh = fp("S7.str.box_shed_1855")
        kce.reed_panel((x, y, z + 0.12), (x + 0.2, sh[0][1] - 0.08, 1.3), 0.36, rng, block=True)
    for eid, r, hh, kw in (("bucket_small_1930", 0.22, 0.62, dict(bail=True, lid=True, knob=True)),
                           ("bucket_lidded_1988", 0.21, 0.62, dict(bail=False, lid=True, knob=True)),
                           ("bucket_bail_1950", 0.2, 0.6, dict(bail=True, lid=False)),
                           ("bucket_at_carrier_1890", 0.2, 0.68, dict(bail=True, lid=False))):
        x, y, z = at(eid)
        if on_s6_platform(x, y):
            z = 0.08        # on S6's platform planks (support 'ground: on S6.str.square_well_2000')
        with ent(eid):
            # the bucket's body collides (it stops a walker; joined 2026-10-12: they were walked through)
            kce.hooped_bucket(x, y, z, r, hh, rng, hoops=3, collide=True, **kw)
    # under the 解 building's east eave: the stand, the tall slatted tub, the two leaning poles
    x, y, z = at("bench_jie_eave_1885")
    with ent("bench_jie_eave_1885"):
        # top 67 px long at v 1665-1673, legs to v ~1737: 0.67 m long, 0.68 m high, between the wall and the post
        kce.braced_stand((x - 0.33, y), (x + 0.33, y), z, 0.68, 0.34, rng)
        k.bx("hidden", True, (x - 0.35, y - 0.18, z), (x + 0.35, y + 0.18, z + 0.75))
    x, y, z = at("tub_slatted_1973")
    with ent("tub_slatted_1973"):
        # choice: reading (a), the restyle's: one tall slatted vessel up to under the bar (210 px painted: 2.1 m at
        # px / 100), its lattice band a band; 73 px wide (r 0.36); its ring fitting toward the street side it faces
        kce.slatted_tub(x, y, z, 0.36, 2.1, rng, lid="lattice", ring_dir=(-0.3, -1), hoops=4)
    x, y, z = at("leaning_poles_1888")
    with ent("leaning_poles_1888"):
        # pole A from its foot (est at the silk's edge) up to the east eave's south part, pole B shorter, south-west of
        # it, both tops to the north-west as painted (choice: their tops under the eave, B's foot outside the wall)
        J = JIE
        ki.leaning_poles((x, y, z), [(x - 0.55, y - 0.4, 2.55)], r=0.035)
        ki.leaning_poles((J["x1"] + 0.25, y + 0.3, h(J["x1"] + 0.25, y + 0.3)), [(J["x1"] + 0.1, y - 0.35, 1.95)], r=0.03)


# ---------------------------------------------------------------- colliders and the solids map

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
    """The main street's centre line, carried straight on to the section's west end and east past the seam."""
    c = [tuple(p) for p in L["route"]["centre"]]
    (ax, ay), (bx_, by) = c[0], c[1]
    t = (EXTENT["x0"] - ax) / (bx_ - ax) if bx_ != ax else 0
    return [(EXTENT["x0"], ay + t * (by - ay))] + c + [(EXTENT["x1"], c[-1][1] - 0.6)]


class RecBuckets(sb.Buckets):
    """The strict bucket set, also remembering which owner added which colliding faces (for solids.json)."""

    def __init__(self, strict=True):
        super().__init__(strict)
        self.rec = []

    def add(self, mat, collide, verts, faces, uvs=None):
        owner = self.owners[-1] if self.owners else None
        kmat = f"edge_{owner[5:]}_hidden" if (owner and owner.startswith("edge:") and mat == "hidden") else mat
        b = self.data.get((kmat, collide))
        n0 = len(b["f"]) if b else 0
        super().add(mat, collide, verts, faces, uvs)
        if collide and owner and not owner.startswith("edge:"):
            self.rec.append((owner, (kmat, collide), n0, len(self.data[(kmat, collide)]["f"])))


def solids_map(cell=0.1, z_lo=0.15, z_hi=1.6):
    """Where colliding geometry stands at body height (z_lo..z_hi), as 0.1 m plan cells per owner: every colliding
    triangle is sampled at about 0.05 m and each sample in the band marks its cell (cells are floor(x / cell),
    floor(y / cell))."""
    cells = {}
    for owner, key, f0, f1 in sb.B.rec:
        b = sb.B.data[key]
        got = cells.setdefault(owner, set())
        for fi in range(f0, f1):
            f = b["f"][fi]
            pts = [b["v"][i] for i in f]
            for j in range(1, len(pts) - 1):
                a, bb, c = pts[0], pts[j], pts[j + 1]
                if max(a.z, bb.z, c.z) < z_lo or min(a.z, bb.z, c.z) > z_hi:
                    continue
                n = max(1, int(max((bb - a).length, (c - a).length, (c - bb).length) / 0.05) + 1)
                for i1 in range(n + 1):
                    for i2 in range(n + 1 - i1):
                        p = a + (bb - a) * (i1 / n) + (c - a) * (i2 / n)
                        if z_lo <= p.z <= z_hi:
                            got.add((math.floor(p.x / cell), math.floor(p.y / cell)))
    return {o: sorted([list(c) for c in s]) for o, s in cells.items() if s}


# ---------------------------------------------------------------- build / export

def build(scene, seed=7):
    sb.B = RecBuckets(strict=True)
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    road = route_road(L)
    h = ground(rng, [(road, 4.2)])
    # each part draws from its own seeded stream, so changing one part never re-rolls the others
    for part in (gatehouse, gate_blocks, railing, zhao_shop, zhao_back_hall, compound_hall, hall_ns, main_hall,
                 far_gable, box_shed, gate_roof, hip_gable, jie_building):
        part(random.Random(zlib.crc32(part.__name__.encode())))
    props(random.Random(zlib.crc32(b"props")), h)
    colliders(L["trees"])

    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0 and me.name.startswith("city_end__"):
            bpy.data.meshes.remove(me)

    solids = solids_map()
    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("city_end__" + name)
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
    me = bpy.data.meshes.new("city_end__ground__col")
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
    stats["ground__col"] = sum(len(p.vertices) - 2 for p in me.polygons)
    owners = dict(sb.B.tris)
    owners["ground"] = owners.get("ground", 0) + stats["ground__col"]
    placed = {"about": "Written by blender/city_end_scene.py build(); never edit. Triangles per owner: map IDs, 'edge:*' "
                       "(invisible colliders closing the walkable area) and 'ground'. tools/loyalty_check.mjs compares "
                       "it with the map (map/BUILDING.md).",
              "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed, f, indent=1, ensure_ascii=False)
    out = {"about": "Written by blender/city_end_scene.py build(); never edit. Where the scene's colliders stand at body "
                    "height (0.15-1.6 m), per owner, as 0.1 m plan cells [floor(X / 0.1), floor(D / 0.1)]; the seats "
                    "(non-colliding: people.js grounds a seated figure by a ray) with their tops; the gate passage. For "
                    "gen/sections/city_end/make_people.py: test every figure, walker path and animal body against it.",
           "cell": 0.1, "z_band": [0.15, 1.6], "walk": [list(p) for p in WALK], "seats": SOLIDS["seats"],
           "passage": SOLIDS["passage"], "bird": bird_check(), "owners": solids}
    with open(SOLIDS_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "bird": bird_check(),
            "buckets": stats}


def export(scene, path):
    """Write the raw GLB (street_b1.export_collection: only this collection of this scene, GUI or headless)."""
    return sb.export_collection(scene, COLL, path)
