"""The countryside (S1, scan u 29050-37610): the scroll's start, open country with no street, a walkable web scene and
the pilot for the countryside ground. Composed from the Song construction kit (blender/song_kit.py), this area's kit
(blender/kit_countryside.py: its GROUND section, the terrain; its SET PIECES section, the farmhouses, fences, bridge
and props), the other areas' kits it imports (kit_outer_road.py, kit_outer_road_2.py, kit_inner_city.py, kit_vehicles.py)
and the boat kit's water (kit_boats.water_strip; the one boat ships in its own GLB from the layout, with its options in
sections/countryside/build_choices.json `boats`).

build(scene) creates collection "countryside_scene": one mesh per (material, collide) bucket ("g_<material>__col" /
"g_<material>__nocol"; "hidden__col" is collider-only), the ground ("g_ground__col", plus the smooth floors
"g_ground_floors__col"), and the water strips. export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships
it (and the boats GLB). Built headless only: qingming/tools/build_scene.sh countryside.

Positions come from the scroll map through sections/countryside/layout.json (tools/map_layout.mjs, with the recorded
moves of build_choices.json): X east, Y north (depth), Z up, in the one world frame. Real size, painted place
(map/BUILDING.md rule 5). What the strokes can't give is a builder choice, marked "choice:" where it is made and listed
in sections/countryside/notes.md. Every piece of geometry is built inside `sb.entity(<map id>)` (strict buckets);
build() writes sections/countryside/placed.json for tools/loyalty_check.mjs, and gen/sections/countryside/ground_at.json
(the built ground under every figure, animal, vehicle and tree) for the casting agent.

Two workers write this file (S1 Run 2): the ground/builder agent owns all of it except the block between
"# ==== SET PIECES (kit agent) ====" and "# ==== END SET PIECES ====", which the kit agent fills.
"""
import json
import math
import os
import random
import zlib

import bpy

import kit_boats as kb
import kit_countryside as kc
import song_kit as k
import street_b1 as sb
from song_kit import V

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SEC = QM + r"\sections\countryside"
LAYOUT_JSON = SEC + r"\layout.json"
PLACED_JSON = SEC + r"\placed.json"
CHOICES_JSON = SEC + r"\build_choices.json"
FRAME_JSON = QM + r"\map\frames\S1.json"
GROUND_AT_JSON = QM + r"\gen\sections\countryside\ground_at.json"
COLL = "countryside_scene"
UP = V((0, 0, 1))
RUN_ON = 16.0          # the ground runs 16 m past the east, north and south edges, under the mist

# ---------------------------------------------------------------- the map and the helpers the set pieces use
#
# E       layout.json entities by map ID (E[id]["pos"], ["pts"], ["lines"], ["footprint"], ["bays"], ["what"], ...)
# FIG     layout.json figures by map ID and by slug (X, D, H, pose, facing_deg, support)
# LAYOUT  the whole layout.json (LAYOUT["trees"], LAYOUT["route"], LAYOUT["frames"], ...)
# WALK    the painted area's corners [sw, se, ne, nw] (layout painted_area; the walkable area: edges in build_choices)
# fp(id)  an entity's footprint [(x, y), ...] (sw, se, ne, nw for buildings)
# P(id)   an entity's pos (x, y)
# pt(id, name)    one of its named points (x, y, H)
# line(id, role)  one of its lines [(x, y), ...]
# zg(x, y)        the BUILT ground's height there (the ground mesh, water bed and banks included; 0 before the ground
#                 exists). Stand things on it: a post's foot at zg, a building's floor at zfoot(its corners).
# zfoot(points)   the lowest zg under a footprint: at its corners and its centre.
# pip(p, poly)    point-in-polygon; poly_dist(p, pts) the distance to a polyline; seg_dist(p, a, b).
# on_water(x, y)  True where the stream or the pale band's water is (their strips as built).
# WATER_H         the stream's H (map/frames/S1.json supports.stream), -0.7.

LAYOUT, E, FIG, WALK, EXTENT, GROUND = {}, {}, {}, [], {}, {}
WATER_H = -0.7


def fp(eid):
    return [tuple(p[:2]) for p in E[eid]["footprint"]]


def P(eid):
    return tuple(E[eid]["pos"][:2])


def pt(eid, name):
    return tuple(E[eid]["pts"][name])


def line(eid, role):
    return [tuple(p[:2]) for p in E[eid]["lines"][role]]


def zg(x, y):
    f = GROUND.get("zg")
    return f(x, y) if f else 0.0


def zfoot(points):
    pts = [tuple(p[:2]) for p in points]
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    return min(zg(x, y) for x, y in pts + [(cx, cy)])


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


def on_water(x, y):
    return any(pip((x, y), ws.polygon) for ws in GROUND.get("strips", []))


def x_on(a, b, y):
    return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])


def placed(origin, yaw, z=0.0):
    return k.placed(k.frame(origin[0], origin[1], z, yaw))


def derive(L):
    E.clear()
    E.update(L["entities"])
    FIG.clear()
    FIG.update({f["map_id"]: f for f in L["figures"]})
    FIG.update({f["id"]: f for f in L["figures"]})
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    # the ground: 0.5 m past the S2 seam (west), 16 m past the other edges (east: the silk's end; north and south:
    # the silk's edges, under the mist)
    EXTENT.update(quad=kb._grow_quad([sw, se, ne, nw], [RUN_ON, RUN_ON, RUN_ON, 0.5]))


# ==== SET PIECES (kit agent) ====
# The kit agent's block: the buildings, structures, props and land vehicles of S1, composed from the layout with
# blender/kit_countryside.py (its SET PIECES section) and the shared kits. Each function returns how many entities it
# built. build() calls them after the ground exists, so zg() and zfoot() give the built ground. The ground agent edits
# nothing in this block.
#
# Notes from the ground agent:
# - the small bridge S1.str.small_bridge_36365: the stream's shore walls (edge:shore) leave a gap of BRIDGE_GAP m either
#   side of the deck's centre line where it lands on each bank, so the walker can cross. The bridge carries its own
#   invisible side rails (material "hidden", colliding, part of its entity: no railing is painted) along the deck's
#   whole length and about 0.8 m past each end onto the bank, so nobody walks off the deck or round its end into the
#   water. The ground under each deck end is kept at the bank top's level (choice), so the deck's ends meet the ground.
# - the sampan and its mooring pole stand in the water at WATER_H (-0.7); the stream bed under them is at about -1.5.
BRIDGE_GAP = 1.1


import kit_inner_city as _sp_ki  # noqa: E402
import kit_outer_road as _sp_ko  # noqa: E402
import kit_outer_road_2 as _sp_k2  # noqa: E402
import kit_vehicles as _sp_kv  # noqa: E402

SP_PLANS = {}     # map id -> the built plan's corners (world), for the point-in-polygon test and the notes


def _sp_scan(u, v, H=0.0):
    """A scan point (u, v) at height H on the ground, through the section's frame (layout.json frames[0], as
    tools/map_layout.mjs maps it): for the few painted points the layout doesn't carry (the hut's gate post)."""
    f = LAYOUT["frames"][0]
    (ou, ov), (xu, xv), (du, dv), h = f["origin"], f["x"], f["d"], f["h"]
    a, b = u - ou, v - ov + h * H
    det = xu * dv - du * xv
    return ((a * dv - du * b) / det, (xu * b - a * xv) / det)


def _sp_bframe(eid, depth, dy=0.0, x0=None, x1=None, yaw=None):
    """A building's frame from its painted footprint: its front sw -> se (the yaw from it unless given), moved `dy` m
    back (a moved wall: choice), trimmed to world X x0..x1, `depth` m deep (choice: the depth is hidden or a
    placeholder). Records the plan in SP_PLANS. Returns (origin, yaw, W, depth)."""
    sw, se = fp(eid)[0], fp(eid)[1]
    if yaw is None:
        yaw = math.degrees(math.atan2(se[1] - sw[1], se[0] - sw[0]))
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    xa = sw[0] if x0 is None else x0
    xb = se[0] if x1 is None else x1
    o = (sw[0] + c * (xa - sw[0]) / c - s * dy, sw[1] + s * (xa - sw[0]) / c + c * dy)
    W = (xb - xa) / c
    SP_PLANS[eid] = [o, (o[0] + c * W, o[1] + s * W), (o[0] + c * W - s * depth, o[1] + s * W + c * depth),
                     (o[0] - s * depth, o[1] + c * depth)]
    return o, yaw, W, depth


def _sp_plan(eid, o, yaw, W, depth):
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    SP_PLANS[eid] = [tuple(o), (o[0] + c * W, o[1] + s * W), (o[0] + c * W - s * depth, o[1] + s * W + c * depth),
                     (o[0] - s * depth, o[1] + c * depth)]


def _sp_along(o, yaw, p):
    """How far along a building's front a plan point lies (its local x)."""
    return kc._sp_local(o, yaw, p)[0]


def _sp_z(eid):
    return zfoot(SP_PLANS[eid])


def _sp_z3(pts):
    return [(x, y, zg(x, y)) for x, y in pts]


def buildings(rng):
    """The 14 buildings: 10 thatched (kc.thatch_house / lean_to_room / the shared lean-to), the tiled farmstead at
    the field (hall and wing), the tiled long farmhouse (build_choices how) and the far roof behind it. Frontages from
    the painted footprints, real heights (map/BUILDING.md rule 5); depths and moved walls are choices (notes.md)."""
    n = 0
    # -- the village stall (thatched hip roof on posts, open front, a dashed row of hanging thatch ends, a lattice
    # fascia between the posts at u 29486-29599 and slats from u 29437 down to the counter's top)
    eid = "S1.bld.stall_shed_29600"
    o, yaw, W, Dp = _sp_bframe(eid, 2.8)            # choice: 2.8 m deep (painted 62 px placeholder)
    z0 = _sp_z(eid)
    bays = [_sp_along(o, yaw, b) for b in E[eid]["bays"]]
    eave = 2.15                                     # choice: real eave (painted 1.5 m; a walker passes under it)
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(29600), z0=z0, eave=eave, ridge=4.15, along="x",
                        sides={"s": "open", "e": "wall", "n": "wall", "w": "none"},
                        posts={"s": bays, "w": [0.05]}, fringe="dashed", fringe_len=(0.12, 0.22))
        c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))

        def front(a):
            return (o[0] + c * a, o[1] + s * a)
        ua, ub = _sp_along(o, yaw, _sp_scan(29486, 664)), _sp_along(o, yaw, _sp_scan(29599, 665))
        uc = _sp_along(o, yaw, _sp_scan(29437, 664))
        kc.slat_screen(front(ua + 0.06), front(ub - 0.06), z0 + eave - 0.5, z0 + eave - 0.1, random.Random(1))
        kc.slat_screen(front(uc), front(ua - 0.06), z0 + 0.88, z0 + eave - 0.1, random.Random(2), gap=0.06)
    n += 1
    # -- its lower west roof over the seated customers: a lean-to, walls west and back, open to the stall
    eid = "S1.bld.stall_annex_29350"
    sw, se = fp(eid)[0], fp(eid)[1]
    o, yaw, W, Dp = _sp_bframe(eid, 2.8, x0=sw[0] + 0.23)   # choice: west wall 0.23 m in, behind the willow trunk
    with sb.entity(eid):
        kc.lean_to_room(o, yaw, W, Dp, random.Random(29350), z0=_sp_z(eid), z_low=eave, z_high=3.05,
                        sides={"s": "open", "e": "none", "n": "wall", "w": "wall"}, posts={})
    n += 1
    # -- the small thatched shed behind the stall's east end: open under its eave (no wall drawn), a big willow
    # trunk painted across its front. choice: its front 0.45 m behind the trunk's foot, its west wall clear of the
    # stall's east wall (0.12 m), its east wall at the painted footprint's east corner: 1.2 x 2.0 m
    eid = "S1.bld.stall_back_shed_29860"
    trunk = [t for t in LAYOUT["trees"] if t["map_id"] == "S1.tree.willow_east_29845"][0]
    dy = trunk["D"] + 0.45 - fp(eid)[0][1]
    o, yaw, W, Dp = _sp_bframe(eid, 2.0, dy=dy, x0=SP_PLANS["S1.bld.stall_shed_29600"][1][0] + 0.12, yaw=0.0)
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(29860), z0=_sp_z(eid), eave=2.0, ridge=3.55,
                        sides={"s": "open", "e": "wall", "n": "wall", "w": "wall"}, posts={"s": [0.08, W - 0.08]},
                        fringe="dashed", fringe_len=(0.1, 0.2))
    n += 1
    # -- the thatched hut behind its wattle fences: walls hidden, a door facing the gateway. choice: its front wall
    # 0.54 m behind the placeholder (D 6.3), so the gate post and the trestle painted in the gateway stand in a yard
    eid = "S1.bld.hut_thatched_31000"
    o, yaw, W, Dp = _sp_bframe(eid, 3.3, dy=6.3 - fp(eid)[0][1])
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(31000), z0=_sp_z(eid), eave=1.95, ridge=4.25,
                        door=("s", 0.55, 1.4))
    n += 1
    # -- the open shed on posts east of the hut: a lean-to of thatch or brush on bare posts (the shared lean-to)
    eid = "S1.bld.shed_posts_31370"
    sw, se = fp(eid)[0], fp(eid)[1]
    o, yaw, W, Dp = _sp_bframe(eid, 2.4, x1=se[0] + 0.15)    # choice: 2.4 m deep over the jar and the basin
    with sb.entity(eid):
        p0, p1 = SP_PLANS[eid][0], SP_PLANS[eid][1]
        with k.placed(k.frame(0, 0, _sp_z(eid), 0)):     # posts stand on the raised yard (z 0 of this frame)
            # choice: low eave 2.27 m (the painted east post, 180 px), high side 2.7 m; three posts in front (the bays),
            # two behind
            kc.kc_thatch_lean_to(p0, p1, Dp, 2.27, 2.7, random.Random(31370), posts=(3, 2))
    n += 1
    # -- the west farmstead: three thatched houses side by side behind the brushwood fence
    # back house: choice: its front at D 13.65 (the placeholder put the front foot 0.36 m under the eave; at the
    # neighbours' painted eave it stands just behind the fence), west under the willow to X 335.25, east to 338.0
    eid = "S1.bld.farmhouse_back_33450"
    o, yaw, W, Dp = _sp_bframe(eid, 3.2, dy=13.65 - fp(eid)[0][1], x0=335.25, x1=338.0)
    door_x = _sp_along(o, yaw, (pt(eid, "door_patch")[0], 13.65)) if "door_patch" in E[eid]["pts"] else 1.85
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(33450), z0=_sp_z(eid), eave=1.9, ridge=4.05,
                        door=("s", door_x - 0.4, door_x + 0.4))
    n += 1
    eid = "S1.bld.farmhouse_gable_33670"
    o, yaw, W, Dp = _sp_bframe(eid, 3.2, x1=340.3)      # choice: east wall at 340.3, clear of the big house
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(33670), z0=_sp_z(eid), eave=1.95, ridge=4.25,
                        gablets=("w",), knob="e", door=("s", 0.6, 1.4))
    n += 1
    eid = "S1.bld.farmhouse_thatched_33955"
    o, yaw, W, Dp = _sp_bframe(eid, 4.8)                 # choice: 4.8 m deep (seen gable-on: its long axis north)
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(33955), z0=_sp_z(eid), eave=2.05, ridge=5.0, along="y",
                        gablets=("s",), door=("e", 0.9, 1.75), fringe_len=(0.14, 0.32))
    n += 1
    # -- the east farmstead: the house with the high rounded roof and its lower west wing, the open barn, the long
    # tiled house behind, the far roof
    eid = "S1.bld.farmhouse_thatched_34600"
    o, yaw, W, Dp = _sp_bframe(eid, 4.0)
    with sb.entity(eid):
        # choice: the lower west wing a lean-to 1.0 m wide against the west wall, its front 0.4 m back (the farmer
        # painted before the house's west end stands clear of it)
        kc.thatch_house(o, yaw, W, Dp, random.Random(34600), z0=_sp_z(eid), eave=2.3, ridge=4.75, along="y",
                        round_=0.6, hip_k=0.8, door=("s", 1.3, 2.1),
                        lean_tos=[((-1.0, 4.0), (-1.0, 0.4), 1.0, 1.85, 2.3, 1)],
                        extra_walls=[((-0.95, 0.4), (0.0, 0.4)), ((-0.95, 4.0), (-0.95, 0.4)), ((0.0, 4.0), (-0.95, 4.0))])
    SP_PLANS[eid] = [_sp_world(o, yaw, p) for p in ((-1.0, 0.0), (W, 0.0), (W, Dp), (-1.0, Dp))]
    n += 1
    eid = "S1.bld.barn_open_34860"
    bays = E[eid]["bays"]
    sw = fp(eid)[0]
    o0, yaw0, _, _ = _sp_bframe(eid, 2.25)
    W = _sp_along(o0, yaw0, bays[-1]) + 0.05            # choice: the east wall on the painted east post
    o, yaw, W, Dp = _sp_bframe(eid, 2.25, x1=sw[0] + W * math.cos(math.radians(yaw0)))
    with sb.entity(eid):
        kc.thatch_house(o, yaw, W, Dp, random.Random(34860), z0=_sp_z(eid), eave=2.0, ridge=4.5, along="y",
                        gablets=("s",), sides={"s": "open", "e": "wall", "n": "wall", "w": "wall"},
                        posts={"s": [_sp_along(o, yaw, b) for b in bays[:-1]]}, fringe_len=(0.12, 0.26))
    n += 1
    eid = "S1.bld.farmhouse_long_34950"
    o, yaw, W, Dp = _sp_bframe(eid, 2.1)                 # choice: 2.1 m deep, between the barn and the far roof
    barn_e = SP_PLANS["S1.bld.barn_open_34860"][1][0] - o[0]
    with sb.entity(eid):
        kc.tile_house(o, yaw, W, Dp, random.Random(34950), z0=_sp_z(eid), eave=2.3, ridge=3.75,
                      ends=("hipgable", "hip"), sides={"s": "none", "e": "wall", "n": "wall", "w": "wall"},
                      posts={"s": [barn_e + 0.15, (barn_e + W) / 2 + 0.1, W - 0.08]})
    n += 1
    eid = "S1.bld.far_roof_34840"
    o, yaw, W, Dp = _sp_bframe(eid, 3.4)
    with sb.entity(eid):
        kc.tile_house(o, yaw, W, Dp, random.Random(34840), z0=_sp_z(eid), eave=2.8, ridge=5.6,
                      ends=("hipgable", "hipgable"), door=("n", 1.0, 1.85))
    n += 1
    # -- the tiled farmstead at the field: the hall with its west veranda, and the board-walled front wing
    eid = "S1.bld.farmhouse_hall_30200"
    # choice: 3.0 m deep (the S1 finisher, Run 3; was 3.6): the painted road's south edge runs along the hall's mapped
    # back (D 10.34), so at 3.6 m its back wall stood 2.3 m into the road and left 0.18 m between it and the runaway
    # horse's lane (D 13.8); at 3.0 m a walker's lane of 0.8 m stays open there. The ridge kept at the kit's ~47 deg.
    o, yaw, W, Dp = _sp_bframe(eid, 3.0)
    with sb.entity(eid):
        # choice: the veranda's bays 0.9 m (painted 0.5-0.6 m, under a person's width), rail in the first
        kc.tile_house(o, yaw, W, Dp, random.Random(30200), z0=_sp_z(eid), eave=2.55, ridge=4.2,
                      ends=("hipgable", "hip"), veranda=dict(x1=1.9, depth=1.05, floor=0.3, posts=[0.06, 0.95, 1.9],
                                                             rail=(0.06, 0.95), bracket=(0.95, 1.9)))
    n += 1
    eid = "S1.bld.farmhouse_wing_30190"
    # choice: the wing's plan (its two painted faces fit no rectangle): a rectangle from the near corner, turned 28
    # degrees (the least-squares fit of the faces), 2.8 x 0.9 m, so its back stays clear of the veranda
    near = fp(eid)[0]
    o, yaw, W, Dp = near, 28.0, 2.8, 0.9
    _sp_plan(eid, o, yaw, W, Dp)
    with sb.entity(eid):
        kc.tile_house(o, yaw, W, Dp, random.Random(30190), z0=_sp_z(eid), eave=1.9, ridge=2.85, over=0.45,
                      ends=("hip", "hip"), walls="boards")
    n += 1
    return n


def _sp_world(o, yaw, p):
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    return (o[0] + c * p[0] - s * p[1], o[1] + s * p[0] + c * p[1])


def structures(rng):
    """The 8 structures: the turf bridge, the wattle and brushwood fences, the hedge, the rail, the posts frame."""
    n = 0
    eid = "S1.str.small_bridge_36365"
    with sb.entity(eid):
        kc.turf_bridge(line(eid, "deck_s"), line(eid, "deck_n"), [tuple(b[:2]) for b in E[eid]["bays"]], WATER_H, zg,
                       random.Random(36365))
    n += 1
    eid = "S1.str.wattle_fence_31100"
    with sb.entity(eid):
        kc.wattle_fence(_sp_z3(line(eid, "line")), (1.8, 2.2), random.Random(31100))   # choice: rising to its east end
        # the thin post in the gateway and the loose hurdle beside it (the fence's gate_post_foot / gate_post_top
        # (30895, 1277) / (30895, 1227) and the loose strokes at (30880-30920, 1283-1297), map/strokes/S1.json)
        gx, gy = _sp_scan(30895, 1277)
        hx, hy = _sp_scan(30900, 1290)
        kc.gate_post((gx, gy, zg(gx, gy)), random.Random(31101), hurdle=((hx, hy + 0.05, zg(hx, hy)), 8.0))
    n += 1
    eid = "S1.str.wattle_fence_30760"
    with sb.entity(eid):
        kc.wattle_fence(_sp_z3(line(eid, "line")), 1.8, random.Random(30760))           # choice: 1.8 m (145 px)
    n += 1
    eid = "S1.str.fence_brush_33760"
    with sb.entity(eid):
        # choice: reading (a), a brushwood fence along the whole line (the west hump's other reading, a low thatched
        # hip, would be a building the map doesn't list); heights from its painted top points, the west end 0.5 m
        kc.brush_fence(_sp_z3(line(eid, "line")), [(0.0, 0.5), (0.1, 1.2), (0.45, 1.3), (0.9, 1.25), (1.0, 1.15)],
                       random.Random(33760))
    n += 1
    eid = "S1.str.fence_brush_34660"
    with sb.entity(eid):
        kc.brush_fence(_sp_z3(line(eid, "line")), [(0.0, 1.1), (1.0, 1.2)], random.Random(34660))
    n += 1
    eid = "S1.str.hedge_yard_34265"
    with sb.entity(eid):
        # the low south band (40 px) rising into the taller east clump (90 px): bushes (the second pass)
        kc.hedge_row(_sp_z3(line(eid, "line")), [(0.0, 0.5), (0.3, 0.55), (0.42, 1.05), (0.85, 1.2), (1.0, 0.85)],
                     random.Random(34265))
    n += 1
    eid = "S1.str.rail_34170"
    with sb.entity(eid):
        ln = line(eid, "line")
        z = min(zg(x, y) for x, y in ln)
        with k.placed(k.frame(0, 0, z, 0)):
            _sp_ko.low_rail_fence(ln, 0.55, random.Random(34170), rails=1, post_every=0.8)   # choice: one rail at 0.55 m
    n += 1
    eid = "S1.str.posts_35075"
    with sb.entity(eid):
        (ax, ay), (bx_, by) = line(eid, "line")[0], line(eid, "line")[-1]
        # choice: posts and a beam (a frame): the strokes show no roof between the farmhouse's eave and their tops
        kc.post_frame((ax, ay, zg(ax, ay)), (bx_, by, zg(bx_, by)), random.Random(35075))
    n += 1
    return n


def _sp_tree(tid):
    return [t for t in LAYOUT["trees"] if t["map_id"] == tid][0]


def props(rng):
    """The 27 props, each at its layout point on the built ground."""
    n = 0

    def at(eid):
        x, y = P(eid)
        return x, y, zg(x, y)
    # the stall: the counter (a table on legs: no front board is painted), the small table, the basket at its foot,
    # the bundle hung on the west willow, the pale board between the willows
    eid = "S1.prop.stall_counter_29430"
    f = fp(eid)
    with sb.entity(eid):
        a, b = f[0], f[1]
        t = (b[0] - a[0], b[1] - a[1])
        L_ = math.hypot(*t)
        u = (t[0] / L_, t[1] / L_)
        # choice: top 0.86 m (painted 63 px over its feet), 0.46 m deep (its back corners est, 24 px), set between the
        # stall's front posts
        _sp_ki.counter((a[0] + u[0] * 0.12, a[1] + u[1] * 0.12), (b[0] - u[0] * 0.1, b[1] - u[1] * 0.1), zfoot(f), 0.86,
                       0.46, random.Random(29430), front=False)
    eid = "S1.prop.stall_table_small_29285"
    x, y, z = at(eid)
    with sb.entity(eid):
        k.table(x - 0.3, y - 0.21, x + 0.3, y + 0.21, z, h=0.52)           # choice: 0.6 x 0.42 m, 0.52 m high (low)
    eid = "S1.prop.round_basket_29430"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.flat_basket(x, y, z, 0.26, random.Random(29431), h=0.13, handle=0.0)   # choice: 0.52 m (painted 45 px)
    eid = "S1.prop.hanging_bundle_29198"
    x, y, z = at(eid)
    tr = _sp_tree("S1.tree.willow_stall_a_29178")
    with sb.entity(eid):
        kc.hanging_bundle(x, y, z + 1.6, random.Random(29198), toward=(tr["X"] - x, tr["D"] - y))   # choice: 1.6 m
    eid = "S1.prop.pale_board_29172"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.pale_board(x, y, z, random.Random(29172))
    eid = "S1.prop.post_crossbar_29862"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.post_crossbar(x, y, z, random.Random(29862))
    # the hut and the shed on posts
    eid = "S1.prop.trestle_hut_gate_30841"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.sawhorse(x, y, z, 90.0, random.Random(30841))     # seen end on from the south: the painted A
    eid = "S1.prop.jar_tied_31298"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.tied_jar(x, y, z, random.Random(31298))
    eid = "S1.prop.basin_31373"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.basin_on_stand(x, y, z, random.Random(31373))
    eid = "S1.prop.reed_or_stake_32882"
    x, y, z = at(eid)
    with sb.entity(eid):
        # read as a thin stake (the needs list), leaning north-west as painted (55 px, top 16 px west)
        kc.thin_stake((x, y, z), (x - 0.2, y + 0.12, z + 0.75), random.Random(32882))
    # the west farmstead's yard and the floor behind it
    eid = "S1.prop.haystack_34080"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.haystack_dome(x, y, z, random.Random(34080), r=0.62, h_side=0.85, h_dome=0.75)
    eid = "S1.prop.roller_frame_34158"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.stone_roller(x, y, z, 90.0, random.Random(34158))   # its round end to the viewer, as painted
    eid = "S1.prop.yard_object_34208"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.flat_basket(x, y, z, 0.24, random.Random(34208), h=0.12, sticks=2)   # a flat basket with two sticks
    eid = "S1.prop.yard_object_34170"
    x, y, z = at(eid)
    with sb.entity(eid):
        _sp_ki.round_basket(x, y, z, 0.2, 0.26, random.Random(34170), lid=True)   # a low dark lidded basket
    # the barn's front and the threshing floor
    eid = "S1.prop.stack_34858"
    x, y, z = at(eid)
    with sb.entity(eid):
        # read as stacked boards and poles: choice 0.9 x 0.55 m, 0.5 m high (painted 60 px wide)
        _sp_k2.timber_pile([(x - 0.45, y - 0.27), (x + 0.45, y - 0.27), (x + 0.45, y + 0.27), (x - 0.45, y + 0.27)], z,
                           random.Random(34858))
    eid = "S1.prop.crossed_poles_34925"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.crossed_poles(x, y, z, 0.0, random.Random(34925), L=0.75)
    eid = "S1.prop.slatted_box_34960"
    x, y, z = at(eid)
    with sb.entity(eid):
        _sp_ko.slatted_box(x, y, z, 0.6, 0.45, 0.42, 0.0, random.Random(34960), slats="h", collide=True)
    eid = "S1.prop.long_plank_shed_35060"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.block_bench((x - 1.0, y), (x + 1.0, y), z, random.Random(35060), h=0.42, w=0.25)   # choice: 2.0 m long
    eid = "S1.prop.jar_shed_35058"
    x, y, z = at(eid)
    with sb.entity(eid):
        _sp_k2.big_jar(x, y, z, random.Random(35058), r=0.15, h=0.3, mat="jar_red", rim_mat="jar_red", segs=10)
    eid = "S1.prop.bench_35133"
    x, y, z = at(eid)
    with sb.entity(eid):
        kc.block_bench((x - 0.5, y), (x + 0.5, y), z, random.Random(35133))   # choice: 1.0 m (painted 65 px)
    eid = "S1.prop.straw_strip_35206"
    x, y, z = at(eid)
    with sb.entity(eid):
        # read as a strip of swept straw at the floor's edge: choice 1.4 m (painted 88 px), 0.3 m wide, 7 cm high
        _sp_k2.straw_heap((x - 0.7, y + 0.03), (x + 0.7, y - 0.03), z, random.Random(35206), w=0.3, h=0.07, bands=0,
                          collide=False)
    # the crows' nests, perched at their trees' depth (no bird)
    for eid in ("S1.prop.nest_33900", "S1.prop.nest_34445", "S1.prop.nest_34680", "S1.prop.nest_34757"):
        x, y = P(eid)
        tr = _sp_tree(E[eid]["support"].split(": ")[1])
        with sb.entity(eid):
            kc.crow_nest(x, y, zg(tr["X"], tr["D"]) + E[eid]["H"], random.Random(int(eid[-5:])))
    # the pole leaning on the slender tree, its foot against the big forked elm
    eid = "S1.prop.leaning_pole_37075"
    x, y, z = at(eid)
    tr = _sp_tree("S1.tree.slender_bare_37018")
    with sb.entity(eid):
        # choice: it rests on the slender tree's trunk 1.33 m up (its painted crossing (37035, 750) on that trunk)
        kc.leaning_pole((x, y, z), (tr["X"], tr["D"], zg(tr["X"], tr["D"]) + 1.33), random.Random(37075))
    # the mooring pole in the stream bed at the sampan's east end
    eid = "S1.prop.mooring_pole_36444"
    x, y = P(eid)
    with sb.entity(eid):
        # choice: 1.05 m over the water (painted 60 px over the boat's end), its foot in the bed
        SP_PLANS["mooring_rope_point"] = kc.kc_mooring_stake(x, y, min(WATER_H - 0.6, zg(x, y)), WATER_H + 1.05,
                                                             random.Random(36444), r=0.045, top="taper", rope="turns")
    n += 27
    return n


def vehicles(rng):
    """The two land vehicles (the boat ships from the boat kit): the willow-decked sedan, the tipped trough barrow."""
    eid = "S1.veh.sedan_willow_30805"
    f, r = pt(eid, "front"), pt(eid, "rear")
    with sb.entity(eid):
        try:      # the closed front (factory (c): boarded, a lattice window, no curtain), the low roof with its knob
            _sp_kv.sedan_chair(f, r, z_of=zg, rng=random.Random(30805), carried=True, front_style="closed")
        except TypeError:   # an older kit_vehicles: a dark curtain hung closed
            _sp_kv.sedan_chair(f, r, z_of=zg, rng=random.Random(30805), carried=True, panel="timber", curtain="interior")
        kc.willow_spray(f, r, zg, random.Random(30806))
    eid = "S1.veh.barrow_tipped_29795"
    with sb.entity(eid):
        kc.trough_barrow(pt(eid, "front"), pt(eid, "rear"), pt(eid, "wheel0"), zg, random.Random(29795))
    return 2
# ==== END SET PIECES ====


# ---------------------------------------------------------------- the ground (the countryside-ground pilot)
#
# Every painted band is a bank one step higher to the north (the frame maps every bank line at H 0). The terrain
# (kit_countryside, GROUND) sums one term per mapped ground entity:
# - each inland bank a soft face lofted from its foot stroke up to its top stroke, raising the ground north of it by
#   its rise (BANKS below, choice: the rises), the raise holding a few metres and easing back (terraces that don't
#   stack without end), tapering out beyond the stroke's ends;
# - the plots (the 菜地's raised bed, the raised field, the floors and the yard) raised with soft irregular rims, the
#   floors smooth and pale; the field ridges, the clods and the 菜地's soil ridges as geometry; the paths worn and pale;
# - a levelling field: the raw sum is levelled on anchors (the route at its chosen H by station, ROUTE_H; the S2 seam
#   at 0; the land 2.5 m in from each shore at the water's bank height), spread smoothly (Gaussian, 7 m), so the walk
#   keeps its levels and the banks keep their crisp steps;
# - the water's banks: the land falls to the stream's H at every shore over its bank's width (a mapped shore bank: to
#   its land line; else 1.5 m), the bed under the water, the land tongues at the water's level, backs a little raised.
# The mesh is a constrained Delaunay triangulation whose edges follow every bank top and foot, shore, rim and ridge;
# the bank faces, the shore faces and the land tongues are their own surfaces ("earth", owned by their grd IDs), the
# floors their own ground mesh, so the ink falls on the painted strokes.

# choice: the banks' rises in metres (map/frames/S1.json maps every bank at H 0; build_choices.json `how`, the lead's
# call bank_rises). Each: rise, and optionally widen_top (where the widening to the walk limit goes: its share to the
# top side), s_max (the face's steepest slope, tan: 0.52 is 27.5 deg), taper (m the step fades over beyond the stroke's
# ends). The level solve (kit_countryside.Terrain.solve_level) eases each step off away from its stroke
BANKS = {
    # the village and the 菜地 (the travellers' band below them; the village level with the 菜地)
    "S1.grd.bank_29590": dict(rise=0.15),                        # the stall yard's soft step (10-20 px of face)
    "S1.grd.bank_29750": dict(rise=0.45),                        # the 菜地's south edge, a slope (80-110 px)
    "S1.grd.bank_29780": dict(rise=0.2),                         # the next step down (25 px)
    "S1.grd.bank_29950": dict(rise=0.25),                        # curving under the travellers (35 px)
    "S1.grd.bank_29830": dict(rise=0.15),                        # the lowest line at the bottom left
    "S1.grd.bank_30250": dict(rise=0.25),                        # the long low bank near the silk's bottom
    "S1.grd.bank_30900": dict(rise=0.25),                        # east of the travellers (40-50 px)
    "S1.grd.bank_30750": dict(rise=0.6, widen_top=0.4),          # the hut's bank: the hut and its fences on top
    "S1.grd.bank_30300": dict(rise=0.35),                        # the chase field's north bank (35-60 px)
    "S1.grd.bank_31390": dict(rise=0.15, taper=2.0),             # far, under the willows by the party's track
    # the great willows (隋堤): the willow dyke, 0.8 m over the road at its foot (eased under 27 deg)
    "S1.grd.bank_31660": dict(rise=0.8, widen_top=0.55, s_max=0.5),
    "S1.grd.bank_31680": dict(rise=0.3),                         # south of the road under the willows (45 px)
    "S1.grd.bank_31700": dict(rise=0.25),                        # the third step down
    "S1.grd.bank_31825": dict(rise=0.12, gap=0.6),               # one wash line above the silk's edge
    "S1.grd.bank_yard_31390": dict(rise=0.3),                    # the shed on posts' raised yard (50 px)
    "S1.grd.bank_32445": dict(rise=0.35),                        # behind the massive willows (the route climbs it)
    "S1.grd.bank_32900": dict(rise=0.3),                         # behind the east willow (the route climbs it)
    "S1.grd.bank_32905": dict(rise=0.4),                         # at the east willow's foot (60-90 px)
    "S1.grd.bank_32700": dict(rise=0.2),                         # the massive willow's roots
    "S1.grd.bank_32705": dict(rise=0.15),                        # the lowest band east of the willows
    # the farmsteads and the terrace below them: the yard bank widened to its foot (the nine trees stand on its top)
    "S1.grd.yard_bank_34400": dict(rise=0.35, widen_top=0.1, s_max=0.45),
    "S1.grd.bank_33300": dict(rise=0.1),                         # the thin band at the terrace's foot (30-40 px)
    "S1.grd.bank_35530": dict(rise=0.3),                         # the slope the pale grove stands on
    "S1.grd.bank_37050": dict(rise=0.3),                         # the layered bank north of the road at the east end
}
BANK_DEFAULTS = dict(s_max=0.52, taper=3.0, step=0.45, wob=0.1, vary=0.18)
# choice: single painted strokes with no foot drawn: (entity, line role, rise, gap to the made foot)
STEPS = [
    ("S1.grd.terrace_lines_33800", "bank_top_a", 0.07, 0.5), ("S1.grd.terrace_lines_33800", "bank_top_b", 0.04, 0.4),
    ("S1.grd.terrace_lines_33800", "bank_top_c", 0.05, 0.4), ("S1.grd.terrace_lines_33800", "bank_top_d", 0.04, 0.4),
    ("S1.grd.bank_south_34400", "lower_band_top", 0.12, 0.6),
]
# choice: the far fields at the top of the silk: low terraces, each step 0.05 m with an earth ridge 0.05 m high along
# its edge; the diagonals (the fields' east boundary, the banked fields' edge) ridges 0.07 m
FIELD_STEP, FIELD_RIDGE, DIAG_RIDGE = 0.05, 0.05, 0.07
# the shore banks: their foot is the water's shore; their land line (top) is where their face meets the land
SHORE_BANKS = {"S1.grd.bank_33650": "bank_top", "S1.grd.bank_35200": "bank_top", "S1.grd.bank_36060": "bank_top",
               "S1.grd.bank_36900": "bank_top", "S1.grd.dyke_36380": "bank_top", "S1.grd.bank_south_34400": "bank_foot"}
# choice: the land tongues' backs above the water (they are mapped at the water's level, both edges waterlines), a
# low rounded back, its edges just under the water so its outline is where the back meets the water; the shoal a
# bar 0.06 m under the water (the map's reading: ripple wash in the water; the water's current lines carry it)
SPITS = {"S1.grd.spit_east_37060": (0.14, False), "S1.grd.spit_under_boat_36140": (0.06, False),
         "S1.grd.spit_36150": (0.13, False), "S1.grd.spit_36225": (0.13, False), "S1.grd.shoal_36380": (-0.06, False)}
# choice: the land 2.5 m in from a shore sits this far above the water (the stream's banks measured 0.7 m at the
# bridge; the pale band's, a lower flat, 0.4 m)
SHORE_LAND = {"S1.water.stream_36500": 0.7, "S1.water.wash_band_34400": 0.4}
BAND_MIN = 1.2         # choice: the pale band's least width (m)
# the reference level: the village's route at the S2 seam is H 0 (choice: the ground's levels are the banks' steps
# summed from there)
REF_PT = (284.0, 15.0)


def _lis(pts):
    """The longest run of points with x increasing (drops a stroke's curled end)."""
    n = len(pts)
    best = [1] * n
    prev = [-1] * n
    for i in range(n):
        for j in range(i):
            if pts[j][0] < pts[i][0] and best[j] + 1 > best[i]:
                best[i], prev[i] = best[j] + 1, j
    i = max(range(n), key=lambda q: best[q])
    out = []
    while i >= 0:
        out.append(pts[i])
        i = prev[i]
    return out[::-1]


def water_entities():
    """The two water entities as built (build_choices.json how): the stream's north shore starts at the pale band's
    east end (363.02, 3.88), so the two strips meet on one chord with no sliver and the open side between the band's
    end and the stream's west bank is walled (the land tongues are seen, not walked); at the bridge's east end the north
    shore gives way round the roots of the big bare elm the painting roots on that bank (S1.tree.elm_bare_36660, mapped
    1 m into the water: its bank top carried out round it, the bridge's east end landing on it); both shores carried on
    east past the silk's end under the mist along their mapped trend, wobbling (plain silk there: water or mist), so
    the run-on water meets the run-on ground along a shore with its bank, never a ruled edge. The pale band's west end
    rounded to a point (its two shores meet at (320.9, 1.25)) instead of a straight chord."""
    st = dict(E["S1.water.stream_36500"])
    sn, ss = line("S1.water.stream_36500", "shore_n"), line("S1.water.stream_36500", "shore_s")
    i_cut = next(i for i, p in enumerate(sn) if abs(p[0] - 376.29) < 0.01)
    bulge = [(375.0, 10.55), (374.45, 9.95), (374.35, 9.2), (374.75, 8.55), (375.5, 8.3), (376.3, 8.5), (376.95, 9.05),
             (377.4, 9.6)]
    sn = sn[:i_cut] + bulge + sn[i_cut + 2:]
    run_n = [(390.4, 11.05), (393.0, 10.85), (396.0, 11.35), (399.2, 11.15), (402.5, 11.6), (406.0, 11.4), (409.5, 11.8)]
    run_s = [(378.6, -0.14), (381.4, -0.08), (384.6, 0.15), (388.0, -0.15), (391.5, 0.2), (395.0, -0.05), (398.5, 0.25),
             (402.0, 0.05)]
    st["lines"] = {"shore_n": _soft_shore([(363.02, 3.88)] + sn + run_n, "stream_n"),
                   "shore_s": _soft_shore(ss + run_s, "stream_s")}
    wb = dict(E["S1.water.wash_band_34400"])
    bn, bs = line("S1.water.wash_band_34400", "shore_n"), line("S1.water.wash_band_34400", "shore_s")
    tip = (320.9, 1.25)
    sn_b = _soft_shore([tip, (321.55, 2.05), (322.3, 2.42)] + bn, "band_n")
    ss_b = _soft_shore([tip, (321.15, 0.62)] + bs, "band_s")
    # choice: the band kept at least BAND_MIN m wide: where its two mapped shores nearly meet (0.1-0.3 m at
    # X 327-342) its south shore gives way south, so its water runs on unbroken as painted
    for p in ss_b:
        if not 323.5 < p[0] < 359.5:
            continue
        d, q = kc.pline_dist(tuple(p), [tuple(c) for c in sn_b])
        if d < BAND_MIN:
            p[1] -= (BAND_MIN - d) * kc.smooth(323.5, 325.5, p[0]) * kc.smooth(359.5, 357.5, p[0])
    wb["lines"] = {"shore_n": sn_b, "shore_s": ss_b}
    return {"S1.water.stream_36500": st, "S1.water.wash_band_34400": wb}


def _soft_shore(pts, key, amp=0.1):
    """A shore as built: a smooth curve through the mapped points (0.6 m samples), wobbling up to `amp` m across
    itself, its two ends kept where they are (where the strips and shores meet)."""
    c = kc.catmull([tuple(p[:2]) for p in pts], 0.6)
    rng = random.Random(_seed(key))
    ph = [rng.uniform(0, 6.283) for _ in range(2)]
    s_ = [0.0]
    for a, b in zip(c, c[1:]):
        s_.append(s_[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    L_ = s_[-1]
    out = []
    for i, p in enumerate(c):
        a, b = c[max(0, i - 1)], c[min(len(c) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        n = math.hypot(dx, dy) or 1.0
        o = amp * kc.smooth(0, 1.5, s_[i]) * kc.smooth(L_, L_ - 1.5, s_[i]) * \
            (0.65 * math.sin(s_[i] / 1.9 + ph[0]) + 0.35 * math.sin(s_[i] / 0.83 + ph[1]))
        out.append([p[0] - dy / n * o, p[1] + dx / n * o])
    return out


def landings():
    """Where the small bridge's deck meets the stream's north shore at each end (its centre line run on 2 m and cut
    with the shore): the gaps in the shore walls and the ground kept at the bank top's level there."""
    ds, dn = line("S1.str.small_bridge_36365", "deck_s"), line("S1.str.small_bridge_36365", "deck_n")
    c = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) for a, b in zip(ds, dn)]
    sn = [tuple(p) for p in GROUND["water_ents"]["S1.water.stream_36500"]["lines"]["shore_n"]]
    out = []
    for a, b in ((c[1], c[0]), (c[-2], c[-1])):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        far = (b[0] + dx / L * 2.0, b[1] + dy / L * 2.0)
        hit = None
        for p, q in zip(sn, sn[1:]):
            # segment a->far against p->q
            r, s = (far[0] - a[0], far[1] - a[1]), (q[0] - p[0], q[1] - p[1])
            den = r[0] * s[1] - r[1] * s[0]
            if abs(den) < 1e-9:
                continue
            t = ((p[0] - a[0]) * s[1] - (p[1] - a[1]) * s[0]) / den
            u = ((p[0] - a[0]) * r[1] - (p[1] - a[1]) * r[0]) / den
            if 0 <= t <= 1 and 0 <= u <= 1 and (hit is None or t < hit[0]):
                hit = (t, (a[0] + r[0] * t, a[1] + r[1] * t))
        out.append({"deck_end": b, "shore": hit[1] if hit else b, "dir": (dx / L, dy / L)})
    return out


# choice: the route's H where the levelling holds it (stations; elsewhere, at the hut's bank, the climb behind the
# massive willows and the farmsteads' east end, it is free and follows the banks it crosses): the village at the S2
# seam's 0, the willow road on the travellers' band, the farmsteads' road on its terrace, the train's path on the
# stream's banks (0.7 m over the water, measured)
ROUTE_H = [((314.9, 331.0), 0.0), ((347.0, 365.0), -0.55), ((384.0, 420.0), 0.1), ((430.0, 443.0), 0.0)]


def ground(rng):
    """The countryside ground (the pilot): the terrain, its mesh, the water strips and their shore walls, the rocks."""
    L = LAYOUT
    sw, se, ne, nw = WALK
    T = kc.Terrain(random.Random(7), seam=(sw, nw))
    GROUND["terrain"] = T
    owner_rings = []          # (tag, ring): tags the triangles inside (owners' counts and surfaces)
    lines_c = []              # constraint polylines (the surfaces' outlines among them)
    # -- the banks
    for bid, kw in BANKS.items():
        e = E[bid]
        if "line" in e["lines"]:
            top, foot = _lis(line(bid, "line")), None
        else:
            top = _lis(line(bid, "bank_top"))
            foot = _lis(line(bid, "bank_foot")) if "bank_foot" in e["lines"] else None
        T.banks.append(kc.Bank(bid, top, foot, rng=random.Random(_seed(bid)), **dict(BANK_DEFAULTS, **kw)))
    for bid, role, rise, gap in STEPS:
        T.banks.append(kc.Bank(bid, _lis(line(bid, role)), None, rng=random.Random(_seed(bid + role)),
                               **dict(BANK_DEFAULTS, rise=rise, gap=gap, taper=2.0)))
    # the far fields: low terraces with earth ridges; the diagonals ridges
    for fid in ("S1.grd.terraced_fields_29450", "S1.grd.banked_fields_30400"):
        for role in E[fid]["lines"]:
            pts = line(fid, role)
            if role.startswith("diag"):
                T.ridges.append(kc.Ridge(fid, pts, h=DIAG_RIDGE, w=0.35, rng=random.Random(_seed(fid + role))))
                continue
            pts = _lis(pts)
            if len(pts) < 2:
                continue
            T.banks.append(kc.Bank(fid, pts, None, rng=random.Random(_seed(fid + role)),
                                   **dict(BANK_DEFAULTS, rise=FIELD_STEP, gap=0.35, taper=1.5)))
            T.ridges.append(kc.Ridge(fid, pts, h=FIELD_RIDGE, w=0.3, rng=random.Random(_seed(role))))
    # the far slope's edge under the far shrubs: a short ridge (choice)
    T.ridges.append(kc.Ridge("S1.grd.far_slope_30950", line("S1.grd.far_slope_30950", "bank_top"), h=0.08, w=0.4,
                             fade=0.3))
    # -- the plots, beds and floors (soft rims, in the ground's own mesh: no line is painted round them)
    r2 = random.Random(29790)
    # choice: the 菜地 a raised bed 0.2 m over the village ground, its rim soft and irregular (0.8 m), its soil bare;
    # three soil ridges along the plant bands (v 1140-1200, 1200-1280, 1280-1350: D 7.6, 6.3, 5.0), each 0.06-0.08 m
    # high, wobbling, their heights varying
    veg = kc.soft_ring(fp("S1.grd.field_vegetable_29790"), r2, r=1.4, wob=0.22)
    T.plots.append(kc.Plot("S1.grd.field_vegetable_29790", veg, h=0.2, rim=0.8, calm=0.75, bare=0.92))
    vf = fp("S1.grd.field_vegetable_29790")
    for yy, hh in ((7.6, 0.07), (6.3, 0.08), (5.0, 0.06)):
        xa = x_on(vf[0], vf[3], yy) + 0.9
        xb = x_on(vf[1], vf[2], yy) - 0.9
        pts = [(xa + (xb - xa) * t / 6, yy + r2.uniform(-0.12, 0.12)) for t in range(7)]
        T.ridges.append(kc.Ridge("S1.grd.field_vegetable_29790", pts, h=hh, w=0.32, lump=0.4, fade=0.8, rng=r2))
    # choice: the raised field behind the chase field 0.1 m, between the chase field bank's top, its dotted ridge and
    # its west slope; a ridge of clods along its north edge (0.08 m and the clods as geometry)
    bt = line("S1.grd.bank_30300", "bank_top")
    rn = line("S1.grd.field_30430", "ridge_n")
    ew = line("S1.grd.field_30430", "edge_w")
    f_out = [ew[-1]] + [p for p in bt if ew[-1][0] < p[0] < rn[-1][0] + 0.2] + [(rn[-1][0] + 0.2, rn[-1][1] - 0.3)] + \
        list(reversed(rn)) + [ew[1]]
    T.plots.append(kc.Plot("S1.grd.field_30430", kc.soft_ring(f_out, random.Random(30430), r=0.6, wob=0.08), h=0.1,
                           rim=0.45, calm=0.4, bare=0.7))
    T.ridges.append(kc.Ridge("S1.grd.field_30430", rn, h=0.08, w=0.3, lump=0.5, fade=0.5))
    # choice: the threshing floor built 8.8 x 3.0 m (painted 5.0 x 2.5): east-west from the open barn's front to the
    # pale grove's bank, north-south from the yard bank's top to the long farmhouse's front (no more room in depth);
    # 0.06 m above the ground, smooth and pale, a soft irregular rim. The floor behind the yard and the yard the same
    tf = [(354.6, 12.55), (363.15, 12.6), (363.5, 15.25), (357.7, 15.5)]
    for fid, corners, hh in (("S1.grd.threshing_floor_35225", tf, 0.06),
                             ("S1.grd.floor_behind_yard_34285", fp("S1.grd.floor_behind_yard_34285"), 0.05),
                             ("S1.grd.yard_34205", fp("S1.grd.yard_34205"), 0.04)):
        ring = kc.soft_ring(corners, random.Random(_seed(fid)), r=1.0, wob=0.12)
        T.plots.append(kc.Plot(fid, ring, h=hh, rim=0.5, calm=0.92, bare=1.0))
    # -- the paths: worn bands, paler and a little lower, their edges noisy
    for rid in ("S1.road.main", "S1.road.path_30300", "S1.road.path_36380", "S1.road.path_30950", "S1.road.path_29640"):
        ln = E[rid]["lines"]
        a, b = (ln["edge_n"], ln["edge_s"]) if "edge_n" in ln else (ln["edge_w"], ln["edge_e"])
        ring = [tuple(p[:2]) for p in a] + [tuple(p[:2]) for p in reversed(b)]
        strip = 0.66 if rid == "S1.road.main" else 0.75
        T.wears.append(kc.Wear(rid, ring, line(rid, "centre"), depth=0.035, edge=0.55, strip=strip,
                               rng=random.Random(_seed(rid))))
        owner_rings.append((rid, ring))
    # choice: the diagonal raised path across the far fields 0.1 m above them
    pr = [tuple(p[:2]) for p in E["S1.road.path_29640"]["lines"]["edge_w"]] + \
        [tuple(p[:2]) for p in reversed(E["S1.road.path_29640"]["lines"]["edge_e"])]
    T.plots.append(kc.Plot("S1.road.path_29640", kc.soft_ring(pr, random.Random(29640), r=0.3, wob=0.05), h=0.1,
                           rim=0.35, calm=0.5, bare=0.9))
    for p_ in T.plots:
        owner_rings.append((p_.id, list(p_.ring)))
    # -- the water
    went = water_entities()
    GROUND["water_ents"] = went
    strips = [kb.water_strip(ent, WATER_H, wid, layout=L, seams=("west",), walls=False) for wid, ent in went.items()]
    GROUND["strips"] = strips
    spits = []
    for sid, (back, streak) in SPITS.items():
        ln = E[sid]["lines"]
        ring = [tuple(p[:2]) for p in ln["edge_n"]] + [tuple(p[:2]) for p in reversed(ln["edge_s"])][1:-1]
        # a soft irregular outline: a smooth closed curve through the mapped edges, wobbling
        ring = kc.wobble(kc.catmull_closed(ring, 0.35), 0.07, random.Random(_seed(sid)))
        spits.append((sid, ring, back, streak))
    for ws in strips:
        ent = went[ws.map_id]
        shores = [[tuple(p) for p in ent["lines"]["shore_s"]], [tuple(p) for p in ent["lines"]["shore_n"]]]
        banks = [(bid, kc.catmull(_lis(line(bid, role)), 0.3)) for bid, role in SHORE_BANKS.items()]
        T.waters.append(kc.Water(ws.map_id, ws.polygon, shores, WATER_H, spits=spits, banks=banks))
    # the bridge's landings: the ground kept at the bank top's level there (choice); the big bare elm at the bridge's
    # east end on its bank (choice: the bank's top carried out round its roots)
    lands = landings()
    GROUND["landings"] = lands
    for ld in lands:
        sx, sy = ld["shore"]
        dx, dy = ld["dir"]
        T.pads.append((sx + dx * 0.25, sy + dy * 0.25, 1.0))
    elm = next(t for t in L["trees"] if t["map_id"] == "S1.tree.elm_bare_36660")
    T.pads.append((elm["X"], elm["D"], 1.1))
    # -- the levelling anchors: the route where it is held (ROUTE_H), the seam at 0, the land in from each shore
    cen = [tuple(p) for p in L["route"]["centre"]]
    sts = L["route"]["stations"]
    for (p, s0), (q, s1) in zip(zip(cen, sts), zip(cen[1:], sts[1:])):
        n = max(1, int(math.hypot(q[0] - p[0], q[1] - p[1]) / 2.0))
        for i in range(n):
            t = i / n
            st = s0 + (s1 - s0) * t
            for (a_, b_), hh in ROUTE_H:
                if a_ <= st <= b_:
                    T.anchors.append((p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, hh, 4.0))
    for i in range(36):
        t = i / 35
        T.anchors.append((sw[0] + (nw[0] - sw[0]) * t, sw[1] + (nw[1] - sw[1]) * t, 0.0, 4.0))
    for wa in T.waters:
        for s_ in wa.shores:
            for q in kc.resample(s_, 3.0):
                p = T._inland(wa, q, 2.5)
                if pip(p, WALK) and not any(kc.in_poly(p, w2.poly) for w2 in T.waters):
                    T.anchors.append((p[0], p[1], WATER_H + SHORE_LAND[wa.id], 2.0))
    qx, qy = [c[0] for c in EXTENT["quad"]], [c[1] for c in EXTENT["quad"]]
    info = T.solve_level((min(qx) - 1, max(qx) + 1, min(qy) - 1, max(qy) + 1), cell=1.0)
    print("LEVEL_SOLVE " + json.dumps(info), flush=True)
    T.prepare_water(s_max=0.5)
    # -- the constraint lines and the tagged rings
    for b in T.banks:
        ring = b.ring()
        lines_c.append(ring + [ring[0]])
        owner_rings.append((("face", b.id), ring))
    for r_ in T.ridges:
        lines_c.append(kc.resample(r_.pts, 0.4))
        if r_.h >= 0.06:
            for off in (-r_.w * 0.9, r_.w * 0.9):
                lines_c.append(kc.resample(_offset(r_.pts, off), 0.45))
    for ws in strips:
        owner_rings.append((("water", ws.map_id), [tuple(p) for p in ws.polygon]))
        ent = went[ws.map_id]
        for role in ("shore_s", "shore_n"):
            lines_c.append(kc.resample([tuple(p) for p in ent["lines"][role]], 0.4))
    for sid, ring, back, streak in spits:
        owner_rings.append((("face", sid) if not streak else sid, ring))
        lines_c.append(ring + [ring[0]])
    # the shore banks' faces: from the shore up to their land line (the shore moved inland by its width)
    for bid, ring, land in shore_faces(T):
        owner_rings.append((("face", bid), ring))
        lines_c.append(land)
    # the seam: finely sampled, so the dip under S2's ground is smooth
    lines_c.append(kc.resample([EXTENT["quad"][3], EXTENT["quad"][0]], 0.6))
    # and the bank where S2's river ends on the seam (s2_river_end below): a line 1.1 m in, for its slope
    lines_c.append(kc.resample([(x_on(sw, nw, d) + S2_END_IN, d) for d in (S2_END_D[0] + 14.0, S2_END_D[1] + 0.8)], 0.6))
    # -- the mesh
    paint = kb._grow_quad(WALK, [2.0, 2.0, 2.0, 0.0])

    def density(x, y):
        return "coarse" if kc.in_poly((x, y), paint) else "far"
    q = EXTENT["quad"]
    dom = kc.resample([q[0], q[1], q[2], q[3]], 3.0)[:-1] + kc.resample([q[3], q[0]], 0.6)[:-1]
    # points just inside every shore, so a narrow reach's bed drops below its water between its two shores
    extra = []
    for ws in strips:
        ent = went[ws.map_id]
        for role in ("shore_s", "shore_n"):
            sm = kc.resample([tuple(p) for p in ent["lines"][role]], 0.4)
            for i, q in enumerate(sm):
                a, b = sm[max(0, i - 1)], sm[min(len(sm) - 1, i + 1)]
                dx, dy = b[0] - a[0], b[1] - a[1]
                n = math.hypot(dx, dy) or 1.0
                for sg in (1, -1):
                    p = (q[0] - dy / n * 0.3 * sg, q[1] + dx / n * 0.3 * sg)
                    if pip(p, ws.polygon):
                        extra.append(p)
                        break
    verts2, tris, tags = T.mesh(dom, lines_c, owner_rings, density, random.Random(11), fine=0.55, coarse=1.5, far=4.0,
                                near_w=0.9, clear=0.16, extra=extra)
    z = [s2_river_end(x, y, T.h(x, y)) for x, y in verts2]
    bare = [T.bare(x, y) for x, y in verts2]
    GROUND["zg_mesh"] = kc.TriLookup(verts2, tris, z)
    GROUND["zg"] = lambda x, y: (lambda r: r if r is not None else T.h(x, y))(GROUND["zg_mesh"](x, y))
    # -- sort the triangles: drop the bed deep under the water; the faces to the earth bucket (their own surfaces,
    # smooth, sharing vertices); the rest the ground
    main = []
    counts = {}
    earth = {}
    for t, tg in zip(tris, tags):
        cx = sum(verts2[i][0] for i in t) / 3
        cy = sum(verts2[i][1] for i in t) / 3
        face = next((g[1] for g in tg if isinstance(g, tuple) and g[0] == "face"), None)
        wat = next((g[1] for g in tg if isinstance(g, tuple) and g[0] == "water"), None)
        if wat and face is None:
            wa = next(w for w in T.waters if w.id == wat)
            d, _ = kc.pline_dist((cx, cy), wa.closed)
            if d > 2.6 and all(z[i] < WATER_H - 0.5 for i in t):
                continue
        if face:
            earth.setdefault(face, []).append(t)
            continue
        main.append(t)
        own = wat or next((g for g in tg if isinstance(g, str)), "ground")
        counts[own] = counts.get(own, 0) + 1
    for owner, ts in earth.items():
        with sb.entity(owner):
            remap, vs, fs, uvs = {}, [], [], []
            for t in ts:
                a_, b_, c_ = t
                (ax, ay), (bx_, by), (cx_, cy_) = verts2[a_], verts2[b_], verts2[c_]
                if (bx_ - ax) * (cy_ - ay) - (cx_ - ax) * (by - ay) < 0:
                    t = (a_, c_, b_)
                for i in t:
                    if i not in remap:
                        remap[i] = len(vs)
                        vs.append(V((verts2[i][0], verts2[i][1], z[i])))
                fs.append(tuple(remap[i] for i in t))
                uvs.append([(verts2[i][0] / 3.0, (verts2[i][1] + 0.7 * z[i]) / 3.0) for i in t])
            sb.B.add("earth", True, vs, fs, uvs)
    GROUND["mesh"] = (verts2, z, bare, main)
    GROUND["floors"] = []
    GROUND["owners"] = counts
    # -- the shore walls (edge:shore), with the bridge's gaps; the rocks
    shore_walls(strips, went, lands)
    rocks(rng)
    report(T)


# the S2 seam where S2's river ends on it (joined 2026-10-12, the join agent): S2's east reach of the 汴河 runs on to the
# seam (S2's recorded choice: grain boat 2 lies east of grain 1 as painted) and stops on it, from its run-on south of
# the silk (D -19.34) to its north shore's end (274.98, 7.2). There the ground rises out of the water as a bank (the
# water's H on the seam, the land 2.2 m in), not as a cliff with the water against it; in its 0.5 m past the seam it
# stays under the water. It blends out over 1.6 m round the water's north end (D 6.8-8.4, where S2's north bank rises;
# S2's ground stops on the seam there too and dips 0.15 m under this one: blender/canal_scene.py hz) and south of its
# run-on. choice: the bank's width (S2's river banks fall over 1-3 m)
S2_END_D = (-19.34, 7.2)
S2_END_IN = 1.1


def s2_river_end(x, y, z):
    sw, nw = WALK[0], WALK[3]
    w = (1 - _smooth_(S2_END_D[1] - 0.4, S2_END_D[1] + 1.2, y)) * _smooth_(S2_END_D[0] - 1.6, S2_END_D[0], y)
    if w <= 0:
        return z
    de = (x - x_on(sw, nw, y)) * 0.83          # metres east of the seam, square to it
    if de > 2.2:
        return z
    b = WATER_H + (z - WATER_H) * _smooth_(0.0, 2.2, de) if de >= 0 else WATER_H - 0.3 * min(1.0, -de / 0.5)
    return z + (min(z, b) - z) * w


def _smooth_(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def _seed(s):
    return zlib.crc32(s.encode("utf-8")) & 0xffff


def _interp(knots, s):
    if s <= knots[0][0]:
        return knots[0][1]
    for (a, ha), (b, hb) in zip(knots, knots[1:]):
        if s <= b:
            return ha + (hb - ha) * (s - a) / (b - a)
    return knots[-1][1]


def _offset(pts, off):
    out = []
    for i, p in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L_ = math.hypot(dx, dy) or 1.0
        out.append((p[0] - dy / L_ * off, p[1] + dx / L_ * off))
    return out


def shore_faces(T):
    """Each shore bank's face as built: the run of shore samples its land line governs, and the same samples moved
    inland by their bank width (the crisp top of the face)."""
    out = []
    for wa in T.waters:
        for s in wa.shores:
            sm = kc.resample(s, 0.4)
            runs, cur = [], None
            for q in sm:
                bid = None
                for b_id, land in wa.banks:
                    d, _ = kc.pline_dist(q, land)
                    if d < wa.w_cap:
                        bid = b_id
                        break
                ns = T._near_shore(q[0], q[1], 1.0)
                w = ns[1][2] if ns else wa.w_def
                p = T._inland(wa, q, 1.0)
                n = (p[0] - q[0], p[1] - q[1])
                Ln = math.hypot(*n) or 1.0
                land_pt = (q[0] + n[0] / Ln * w, q[1] + n[1] / Ln * w)
                if bid and (cur is None or cur[0] != bid):
                    cur = (bid, [], [])
                    runs.append(cur)
                elif not bid:
                    cur = None
                if cur:
                    cur[1].append(q)
                    cur[2].append(land_pt)
            for bid, qs, ls in runs:
                if len(qs) < 3:
                    continue
                ls = kc.catmull(ls[::3] + ([ls[-1]] if (len(ls) - 1) % 3 else []), 0.35)
                out.append((bid, qs + list(reversed(ls)), ls))
    return out


def shore_walls(strips, went, lands):
    """Invisible walls along every shore (edge:shore), 0.5 m pieces from below the water to 1.3 m over the higher of
    the water and the bank top; a gap of BRIDGE_GAP m either side of each bridge landing (the bridge's own rails close
    it); only within the painted area (the edges close the rest)."""
    quad = kb._grow_quad(WALK, [1.0, 1.0, 1.0, 1.0])
    top = max(WATER_H, 0.0) + 1.6
    n = 0
    with sb.entity("edge:shore"):
        for ws in strips:
            ent = went[ws.map_id]
            for role in ("shore_s", "shore_n"):
                ln = [tuple(p) for p in ent["lines"][role]]
                for a, b in zip(ln, ln[1:]):
                    L_ = math.hypot(b[0] - a[0], b[1] - a[1])
                    m = max(1, math.ceil(L_ / 0.5))
                    for i in range(m):
                        p = (a[0] + (b[0] - a[0]) * i / m, a[1] + (b[1] - a[1]) * i / m)
                        q = (a[0] + (b[0] - a[0]) * (i + 1) / m, a[1] + (b[1] - a[1]) * (i + 1) / m)
                        mid = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
                        if not (pip(p, quad) or pip(q, quad)):
                            continue
                        if role == "shore_n" and ws.map_id == "S1.water.stream_36500" and any(
                                math.hypot(mid[0] - ld["shore"][0], mid[1] - ld["shore"][1]) < BRIDGE_GAP for ld in lands):
                            continue
                        k.add("hidden", True, [V((p[0], p[1], WATER_H - 0.6)), V((q[0], q[1], WATER_H - 0.6)),
                                               V((q[0], q[1], top)), V((p[0], p[1], top))], [(0, 1, 2, 3)])
                        n += 1
    GROUND["shore_walls"] = n


def rocks(rng):
    """The rocks the map lists as grd entities, built as models (build_choices.json how: model)."""
    # S1.grd.rocks_34620: a pale outcrop with crack strokes rising in a dome from the near bank at the silk's bottom.
    # choice: a dome 3.2 x 2.6 m, 1.5 m high (painted 240 px across), its joints the cracks
    f = fp("S1.grd.rocks_34620")
    cx, cy = sum(p[0] for p in f) / 4, sum(p[1] for p in f) / 4
    with sb.entity("S1.grd.rocks_34620"):
        kc.outcrop("stone", (cx, cy - 0.3), 1.6, 1.3, 1.5, random.Random(34620), zg, n=4)
    # S1.grd.rocks_34360: lower broken stony ground. choice: ten low flat stones 0.25-0.65 m
    with sb.entity("S1.grd.rocks_34360"):
        kc.stony_ground("stone", kc.soft_ring(fp("S1.grd.rocks_34360"), random.Random(1), r=0.6, wob=0.05),
                        random.Random(34360), zg, n=10, size=(0.25, 0.65), flat=0.45)
    # S1.grd.rock_29745: a pale pointed upright rock at the 菜地's north-west corner, hatched on its west side.
    # choice: a weathered standing rock 1.2 x 1.0 m, 1.9 m high: a lumpy main mass, a split slab against it and a low
    # stone at its foot, coarse enough that its facets break sharp
    f = fp("S1.grd.rock_29745")
    cx, cy = sum(p[0] for p in f) / 4, sum(p[1] for p in f) / 4
    with sb.entity("S1.grd.rock_29745"):
        kc.standing_stone("stone", cx, cy, zfoot(f), 1.2, 1.0, 1.9, random.Random(29745))
    # the clods along the raised field's north edge (part of S1.grd.field_30430)
    with sb.entity("S1.grd.field_30430"):
        kc.clods("earth", line("S1.grd.field_30430", "ridge_n"), random.Random(30431), zg)


def report(T):
    """Print the levels at the places that matter (the walk, the banks' tops, the floors, the far fields)."""
    spots = {"seam_village": (282.0, 15.5), "stall_yard": (289.0, 16.6), "village_route": (290.5, 14.0),
             "veg_bed": (284.0, 6.4), "travellers": (287.3, 0.3), "turn_south": (295.5, 7.0), "hut": (299.8, 6.4),
             "willow_road": (306.0, 1.6), "dyke_top": (306.0, 4.0), "shed_yard": (305.0, 7.0),
             "chase_field": (298.0, 16.0), "far_field_w": (291.5, 27.5), "far_field_e": (299.0, 28.5),
             "far_ox": (294.8, 27.7), "party": (311.0, 23.6), "climb": (320.0, 5.8), "farm_road": (340.0, 12.5),
             "terrace": (340.0, 8.0), "band_bank_top": (335.0, 4.6), "near_land": (330.0, -2.0),
             "rocks": (341.0, -2.6), "threshing_floor": (360.0, 14.0), "train_path": (376.0, 14.0),
             "bridge_w": GROUND["landings"][0]["shore"], "bridge_e": GROUND["landings"][1]["shore"],
             "east_end": (384.0, 12.0)}
    out = {k_: round(T.h(*p), 3) for k_, p in spots.items()}
    print("LEVELS " + json.dumps(out), flush=True)


# ---------------------------------------------------------------- colliders: the edges, the trunks

def colliders(trees):
    """Invisible walls round the walkable area (build_choices.json edges): edge:west on the S2 seam, edge:south and
    edge:north on the silk's edges, edge:east at the silk's end; and each tall tree's trunk (part of the tree)."""
    sw, se, ne, nw = WALK
    walls = {"south": [(sw, se)], "east": [(se, ne)], "north": [(ne, nw)], "west": [(nw, sw)]}
    for side, segs in walls.items():
        with sb.entity(f"edge:{side}"):
            for (xa, ya), (xb, yb) in segs:
                k.board("hidden", True, (xa, ya), (xb, yb), 0.1, -4.0, 5.0)
    for t in trees:
        if (t.get("height_m") or 0) < 3.0:
            continue
        x, d, s = t["X"], t["D"], t["scale"]
        with sb.entity(t["map_id"]):
            z = zg(x, d)
            sb.cyl("hidden", True, (x, d, z - 0.1), (x + 0.12 * s, d + 0.08 * s, z + 2.5 * s), 0.3 * s, segs=8)


# ---------------------------------------------------------------- ground_at.json (for the casting agent)

def ground_at():
    """{map_id: z} for every figure, animal, vehicle and tree: the built ground under it (perched things: their tree's
    foot plus their H). Prints the largest z - map H per kind."""
    out, worst = {}, {}

    def put(kind, mid, x, y, H, z):
        out[mid] = round(z, 3)
        dz = z - (H or 0.0)
        if kind not in worst or dz > worst[kind][0]:
            worst[kind] = (round(dz, 3), mid)
    trees = {t["map_id"]: t for t in LAYOUT["trees"]}
    for f in LAYOUT["figures"]:
        sup = f.get("support") or ""
        if sup.startswith("animal "):
            a = E[sup[7:]]["pts"]
            x, y = (a["fore"][0] + a["hind"][0]) / 2, (a["fore"][1] + a["hind"][1]) / 2
            put("figure", f["map_id"], x, y, 0.0, zg(x, y))
        else:
            put("figure", f["map_id"], f["X"], f["D"], f.get("H", 0.0), zg(f["X"], f["D"]))
    for mid, e in E.items():
        if e["kind"] == "animal":
            a = e["pts"]
            x, y = (a["fore"][0] + a["hind"][0]) / 2, (a["fore"][1] + a["hind"][1]) / 2
            sup = e.get("support") or ""
            if sup.startswith("perched: "):
                t = trees[sup[9:]]
                put("animal", mid, x, y, e.get("H"), zg(t["X"], t["D"]) + (e.get("H") or 0.0))
            else:
                put("animal", mid, x, y, e.get("H"), zg(x, y))
        elif e["kind"] == "vehicle":
            a = e["pts"]
            x, y = (a["front"][0] + a["rear"][0]) / 2, (a["front"][1] + a["rear"][1]) / 2
            if (e.get("support") or "") == "stream":
                put("vehicle", mid, x, y, e.get("H"), WATER_H)
            else:
                put("vehicle", mid, x, y, e.get("H"), zg(x, y))
    for t in LAYOUT["trees"]:
        put("tree", t["map_id"], t["X"], t["D"], t.get("H", 0.0), zg(t["X"], t["D"]))
    os.makedirs(os.path.dirname(GROUND_AT_JSON), exist_ok=True)
    with open(GROUND_AT_JSON, "w", encoding="utf-8") as f:
        json.dump({"about": "Written by blender/countryside_scene.py build(); never edit. The built ground's height (m) under "
                            "every figure, animal, vehicle and tree of S1 (an animal or vehicle: between its hooves or "
                            "ends; a rider: under its animal; a perched thing: its tree's foot plus its H; the boat: "
                            "the stream's H). people.js drops a figure from its map H + 1.2 m, so a figure whose z is "
                            "more than about 1.0 m above its map H needs lifting in people.json.",
                   "worst": {kd: {"dz": w[0], "id": w[1]} for kd, w in worst.items()}, "z": out}, f, indent=1,
                  ensure_ascii=False)
    print("GROUND_AT " + json.dumps({kd: w for kd, w in worst.items()}), flush=True)
    return out


# ---------------------------------------------------------------- build / export

def _ground_object(coll, name, verts2, z, bare, tris):
    """One smooth ground mesh from the terrain's triangles: UVMap = world position / tile, Blend.x = how bare."""
    used = sorted({i for t in tris for i in t})
    remap = {i: n for n, i in enumerate(used)}
    vs = [(verts2[i][0], verts2[i][1], z[i]) for i in used]
    fs = []
    for a, b, c in tris:
        (ax, ay), (bx_, by), (cx, cy) = verts2[a], verts2[b], verts2[c]
        if (bx_ - ax) * (cy - ay) - (cx - ax) * (by - ay) < 0:
            b, c = c, b
        fs.append((remap[a], remap[b], remap[c]))
    me = bpy.data.meshes.new("countryside__" + name)
    me.from_pydata(vs, [], fs)
    me.validate()
    tile = sb.MATERIALS["ground"][1]
    l0, l1 = me.uv_layers.new(name="UVMap"), me.uv_layers.new(name="Blend")
    for li, lp in enumerate(me.loops):
        vi = used[lp.vertex_index]
        l0.data[li].uv = (verts2[vi][0] / tile, verts2[vi][1] / tile)
        l1.data[li].uv = (bare[vi], 0.0)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.materials.append(sb.make_material("ground"))
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    return len(me.polygons)


def build(scene, seed=1):
    sb.B = sb.Buckets(strict=True)
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    GROUND.clear()
    ground(rng)
    n_set = {"buildings": buildings(random.Random(101)), "structures": structures(random.Random(102)),
             "props": props(random.Random(103)), "vehicles": vehicles(random.Random(104))}
    colliders(L["trees"])
    ground_at()

    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("countryside__" + name)
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
    verts2, z, bare, main = GROUND["mesh"]
    stats["ground__col"] = _ground_object(coll, "g_ground__col", verts2, z, bare, main)
    if GROUND["floors"]:
        stats["ground_floors__col"] = _ground_object(coll, "g_ground_floors__col", verts2, z, bare, GROUND["floors"])
    kb.water_mesh(bpy, GROUND["strips"], coll=coll)
    stats["water"] = sum(ws.tris for ws in GROUND["strips"])
    owners = dict(sb.B.tris)
    for o, n in GROUND["owners"].items():
        owners[o] = owners.get(o, 0) + n
    for ws in GROUND["strips"]:
        owners[ws.map_id] = owners.get(ws.map_id, 0) + ws.tris
    print("WATER " + json.dumps({ws.map_id: {"tris": ws.tris, "ring": len(ws.polygon), "notes": ws.notes}
                                 for ws in GROUND["strips"]}) + f" shore_walls {GROUND.get('shore_walls')}", flush=True)
    placed_ = {"about": "Written by blender/countryside_scene.py build(); never edit. Triangles per owner: map IDs, "
                        "'edge:*' (invisible colliders closing the walkable area; edge:shore along the water) and "
                        "'ground'. The ground's triangles are counted under the grd, road and water entity whose "
                        "region they lie in, the rest under 'ground'. The boat is in its own GLB. "
                        "tools/loyalty_check.mjs compares it with the map (map/BUILDING.md).",
               "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed_, f, indent=1, ensure_ascii=False)
    print("SETPIECES " + json.dumps(n_set), flush=True)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "buckets": stats}


def export(scene, path):
    """Writes the raw GLB. Written first to the Windows temp folder and copied over in 1 MB chunks: one big write of
    the binary chunk to the \\wsl.localhost share failed with EINVAL (2026-10-12, S1 Run 2)."""
    import tempfile
    tmp = os.path.join(tempfile.gettempdir(), "countryside_raw_%d.glb" % os.getpid())
    sb.export_collection(scene, COLL, tmp)
    with open(tmp, "rb") as src, open(path, "wb") as dst:
        while True:
            chunk = src.read(1 << 20)
            if not chunk:
                break
            dst.write(chunk)
    os.remove(tmp)
    return path
