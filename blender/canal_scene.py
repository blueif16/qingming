"""The canal wharves (S2, sections/canal, scan u 20500-29050): the 汴河 and its north-bank wharves as a walkable web
scene. Composed from the Song construction kit (blender/song_kit.py), this area's kit (blender/kit_canal.py: the 望火楼,
the thatched eating shed, the stilt terrace, the jetty, the landing steps, poles, frames, sacks, signs), the other area
kits (kit_inner_city.py, kit_outer_road.py, kit_outer_road_2.py, kit_city_end.py), the vehicle kit (kit_vehicles.py)
and the boat kit's water (kit_boats.water_strip; the boats themselves ship in their own GLB from the layout through
blender/build_boats.py, with their options in sections/canal/build_choices.json `boats`, the boats agent's).

build(scene) creates collection "canal_scene": one mesh per (material, collide) bucket ("g_<material>__col" /
"g_<material>__nocol"; "hidden__col" is collider-only), the ground, and the river's four water strips. export(scene,
path) writes the raw GLB; tools/export_web_scene.mjs ships it (and the boats GLB). Built headless only:
qingming/tools/build_scene.sh canal.

Positions come from the scroll map through sections/canal/layout.json (tools/map_layout.mjs, with the recorded moves of
build_choices.json): X east, Y north (depth), Z up, in the one world frame. The river and its banks come from the boats
agent's plan, gen/sections/canal/river_plan.json (the north shore and bank top moved south to make room to walk); until
it exists, from the mapped lines with each north shore clamped to its bank top (river_lines()).
Real size, painted place (map/BUILDING.md rule 5): heights, storeys, openings and the sizes of things are real;
frontages and depths come from the painted footprints; the north bank is painted at 0.5-0.85 of life, so its buildings
keep real heights on their painted frontages and their backs run past the silk's top edge as choice depths. What the
strokes can't give is a builder choice, marked "choice:" where it is made and listed in
gen/sections/canal/build/notes_build.md.

Loyalty: every piece of geometry is built inside `sb.entity(<map id>)` (strict buckets); build() writes
sections/canal/placed.json for tools/loyalty_check.mjs. Where nothing is painted, invisible edge walls close the walkable
area and the page paints what lies beyond.
"""
import json
import math
import os
import random

import bpy

import kit_boats as kb
import kit_canal as kc
import kit_city_end as kce
import kit_inner_city as ki
import kit_outer_road as ko
import kit_outer_road_2 as k2
import kit_vehicles as kv
import song_kit as k
import street_b1 as sb
from song_kit import V

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SEC = QM + r"\sections\canal"
LAYOUT_JSON = SEC + r"\layout.json"
PLACED_JSON = SEC + r"\placed.json"
FRAME_JSON = QM + r"\map\frames\S2.json"
SEATS_JSON = QM + r"\gen\sections\canal\seats.json"
PLAN_JSON = QM + r"\gen\sections\canal\river_plan.json"
COLL = "canal_scene"
UP = V((0, 0, 1))

LAYOUT, E, FIG, WALK, EXTENT, H, RIVER = {}, {}, {}, [], {}, {}, {}
KNOTS = []

# choice (budget, restart run 2026-10-12): tiled (box and ground) UVs rounded to 1/1024 of a swatch repeat (half a pixel
# of a 512 px swatch). The export's quantize skips UVs outside 0-1, so they ship as float32; rounded, meshopt packs them
# about 0.22 MB smaller (canal.glb), which brings the section under its 9 MB download. Explicit UVs (sign and atlas
# cells) are left exact.
UV_Q = 1024
RUN_ON = 16.0                   # the ground and the water run 16 m past the silk's edges under the mist
NORTH_BANKS = ("S2.grd.north_bank_20500", "S2.grd.north_bank_22550", "S2.grd.bank_n_23300", "S2.grd.north_bank_26000")
SOUTH_BANKS = ("S2.grd.south_bank_20500", "S2.grd.mound_south_bank_21420", "S2.grd.south_bank_flat_21850",
               "S2.grd.south_bank_spit_22400")
REACHES = ("S2.water.bian_river_w", "S2.water.bian_river_w2", "S2.water.bian_river_m", "S2.water.bian_river_e")
# choice: the cheap far detail (no rafter ends, no brackets, plain ridges, coarse slopes) for roofs at the silk's top
# and on the far bank, the kit's own roofs (rafter ends, barge boards, ridge ornaments) where the walker passes close
FAR, MID, NEAR = 0, 1, 2


# ---------------------------------------------------------------- the map and the frame

def fp(eid):
    return [tuple(p[:2]) for p in E[eid]["footprint"]]


def P(eid):
    return tuple(E[eid]["pos"][:2])


def pt(eid, name):
    return tuple(E[eid]["pts"][name])


def line(eid, role):
    return [tuple(p[:2]) for p in E[eid]["lines"][role]]


def dx_at(u):
    """The frame's receding direction (px of u per m of depth) at scan u: linear between the knots, constant
    beyond (map/frames/S2.json)."""
    if u <= KNOTS[0][0]:
        return KNOTS[0][1]
    for (u0, d0), (u1, d1) in zip(KNOTS, KNOTS[1:]):
        if u <= u1:
            return d0 + (d1 - d0) * (u - u0) / (u1 - u0)
    return KNOTS[-1][1]


def ux(u, D):
    """World X of scan u on the ground at depth D (the frame's dx drifts along u)."""
    o = LAYOUT["frames"][0]["origin"]
    return (u - o[0] - dx_at(u) * D) / 77.0


def derive(L):
    E.clear()
    E.update(L["entities"])
    FIG.clear()
    FIG.update({f["map_id"]: f for f in L["figures"]})
    FIG.update({f["id"]: f for f in L["figures"]})
    KNOTS[:] = [tuple(k_) for k_ in L["frames"][0]["dx_knots"]]
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    xs = [p[0] for p in WALK]
    # the ground: 0.5 m past the S3 seam (west), 1 m past the S1 seam (east), 16 m past the silk's edges (north,
    # south) under the mist
    EXTENT.update(x0=2 * math.floor((min(xs) - 12) / 2), x1=2 * math.ceil((max(xs) + 2) / 2),
                  y0=2 * math.floor((sw[1] - RUN_ON) / 2), y1=2 * math.ceil((nw[1] + RUN_ON) / 2))


def x_on(a, b, y):
    return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])


def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def seg_closest(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ((dx * dx + dy * dy) or 1.0)))
    q = (a[0] + t * dx, a[1] + t * dy)
    return math.hypot(p[0] - q[0], p[1] - q[1]), q


def poly_dist(p, ln):
    return min(seg_closest(p, a, b)[0] for a, b in zip(ln, ln[1:]))


def pip(p, poly):
    x, y = p
    ins = False
    for (ax, ay), (bx_, by) in zip(poly, poly[1:] + poly[:1]):
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx_ - ax) / (by - ay):
            ins = not ins
    return ins


def local_of(o, yaw, p):
    """A world plan point in a building's frame (origin o, x along yaw)."""
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    dx, dy = p[0] - o[0], p[1] - o[1]
    return (dx * c + dy * s, -dx * s + dy * c)


def world_of(o, yaw, q):
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    return (o[0] + q[0] * c - q[1] * s, o[1] + q[0] * s + q[1] * c)


def front_frame(eid, depth=None, yaw=None, x0=None, x1=None):
    """A building's own frame on its painted front (sw -> se): origin at sw, x along the front, y back (north).
    Returns (origin, yaw_deg, W, depth); depth defaults to the footprint's (its back is a placeholder at the silk's
    top edge on most of S2: the callers give choice depths). x0/x1 trim the front (world X where it starts, ends)."""
    sw, se, ne, nw = fp(eid)
    if yaw is None:
        yaw = math.degrees(math.atan2(se[1] - sw[1], se[0] - sw[0]))
    o = sw
    W = local_of(o, yaw, se)[0]
    if x0 is not None:
        o = world_of(sw, yaw, (local_of(sw, yaw, (x0, sw[1]))[0], 0.0))
        W = local_of(o, yaw, se)[0]
    if x1 is not None:
        W = local_of(o, yaw, (x1, se[1]))[0]
    if depth is None:
        back = ((ne[0] + nw[0]) / 2, (ne[1] + nw[1]) / 2)
        depth = local_of(o, yaw, back)[1]
    return o, yaw, W, depth


def placed(origin, yaw, z=0.0):
    return k.placed(k.frame(origin[0], origin[1], z, yaw))


def hz_at(x, y):
    return H["h"](x, y)


def z_under(o, yaw, W, Dp):
    """The lowest ground under a building's plan rectangle (its floor stands there; walls run 0.1 m below)."""
    pts = [world_of(o, yaw, (x, y)) for x in (0.0, W / 2, W) for y in (0.0, Dp / 2, Dp)]
    return min(hz_at(*p) for p in pts)


# ---------------------------------------------------------------- the river and its banks

def _clamp_north(shore, top):
    """Every shore point that lies on the land side of the bank-top line (left of its west -> east, then south,
    run) moves onto the bank top: the water plane goes only to the bank_top lines (the lead's call)."""
    out = []
    for p in shore:
        best, seg = 1e9, None
        for a, b in zip(top, top[1:]):
            d, q = seg_closest(p, a, b)
            if d < best:
                best, seg = d, (a, b, q)
        a, b, q = seg
        cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
        if cross > 0:
            tx, ty = b[0] - a[0], b[1] - a[1]
            L = math.hypot(tx, ty) or 1.0
            out.append((q[0] + ty / L * 0.02, q[1] - tx / L * 0.02))   # 2 cm toward the water
        else:
            out.append(p)
    return out


def river_lines():
    """The river as built: each reach's shores and each bank's top and shore. From the boats agent's
    gen/sections/canal/river_plan.json when it exists (the north bank moved south, its how and moves in the river.json
    fragment); otherwise the builder's fallback: the mapped lines, every north shore point clamped onto its bank
    top. The middle and east reaches have no south shore (the silk's bottom edge cuts the water): their south side runs
    on 16 m south under the mist, and the reaches meet along straight lines across the river."""
    path = PLAN_JSON
    plan = None
    for p in (path, "/home/ran/3d_director/qingming/gen/sections/canal/river_plan.json"):
        if os.path.exists(p):
            plan = json.load(open(p, encoding="utf-8"))
            break
    banks = {}
    if plan:
        for gid in NORTH_BANKS + SOUTH_BANKS:
            b = (plan.get("banks") or {}).get(gid)
            if b:
                banks[gid] = {"bank_top": [tuple(q[:2]) for q in b["bank_top"]], "shore": [tuple(q[:2]) for q in b["shore"]]}
    for gid in NORTH_BANKS + SOUTH_BANKS:
        if gid not in banks:
            banks[gid] = {"bank_top": line(gid, "bank_top"), "shore": line(gid, "shore")}
    ntop = []
    for gid in NORTH_BANKS:
        for q in banks[gid]["bank_top"]:
            if not ntop or math.hypot(q[0] - ntop[-1][0], q[1] - ntop[-1][1]) > 1e-3:
                ntop.append(q)
    reaches = {}
    for wid in REACHES:
        w = (plan or {}).get("water", {}).get(wid) if plan else None
        sn = [tuple(q[:2]) for q in (w or {}).get("shore_n", [])] or line(wid, "shore_n")
        ss = [tuple(q[:2]) for q in (w or {}).get("shore_s", [])] or \
            ([tuple(q[:2]) for q in E[wid]["lines"]["shore_s"]] if "shore_s" in E[wid]["lines"] else [])
        if not plan:
            sn = _clamp_north(sn, ntop)
        reaches[wid] = {"shore_n": sn, "shore_s": ss}
    if not plan:
        # the north banks' own shore lines are the reaches' north shores, clamped the same way
        for gid in NORTH_BANKS:
            banks[gid]["shore"] = _clamp_north(banks[gid]["shore"], ntop)
    # the run-on south of the silk's bottom edge, at the water's H: D -3.34 is the silk's edge (v 1790 at H -0.7)
    Hw = E[REACHES[0]]["H"]
    d_edge = (1565 - 1790 - 77 * Hw) / 51.25
    d_run = d_edge - RUN_ON
    w2, m_, e_ = reaches["S2.water.bian_river_w2"], reaches["S2.water.bian_river_m"], reaches["S2.water.bian_river_e"]
    xm = m_["shore_n"][-1][0]
    if not m_["shore_s"]:
        a = w2["shore_s"][-1]
        m_["shore_s"] = [a, (a[0], d_run), (xm, d_run)]
    if not e_["shore_s"]:
        end = e_["shore_n"][-1]
        # the S1 seam (u 29050) at the water's H, run on south: the east reach stops on it
        o = LAYOUT["frames"][0]["origin"]
        xs = (29050 - o[0] - dx_at(29050) * d_run) / 77.0
        e_["shore_s"] = [(xm, d_run), (min(xs, end[0]), d_run), end]
    RIVER.update(reaches=reaches, banks=banks, north_top=ntop, H=Hw, plan=bool(plan), d_edge=d_edge, d_run=d_run)
    nsh = []
    for wid in REACHES:
        for q in reaches[wid]["shore_n"]:
            if not nsh or math.hypot(q[0] - nsh[-1][0], q[1] - nsh[-1][1]) > 1e-3:
                nsh.append(q)
    RIVER["north_shore"] = nsh
    # the real shores (not the run-on lines south of the silk), for the ground's banks and the shore walls
    RIVER["south_pairs"] = [(banks[g]["bank_top"], banks[g]["shore"]) for g in SOUTH_BANKS]
    RIVER["shores"] = [nsh] + [reaches[w]["shore_s"] for w in ("S2.water.bian_river_w", "S2.water.bian_river_w2")]
    ents = {}
    for wid in REACHES:
        ent = dict(E[wid])
        ent["lines"] = {"shore_s": [list(p) for p in reaches[wid]["shore_s"]],
                        "shore_n": [list(p) for p in reaches[wid]["shore_n"]]}
        ents[wid] = ent
    return ents


def shore_walls(H_):
    """Invisible walls along every real shore inside the painted area (edge:shore), as kit_boats.water_strip builds
    them (0.5 m pieces from 0.6 m below the water to 1.3 m above the bank), but not along the reaches' run-on lines
    south of the silk (water on both sides)."""
    sw, se, ne, nw = WALK
    quad = kb.water_quad(LAYOUT, H_)
    n = 0
    top = max(H_, 0.0) + 1.3

    def inside(p):
        for i in range(4):
            a, b = quad[i], quad[(i + 1) % 4]
            L = math.hypot(b[0] - a[0], b[1] - a[1])
            if (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]) > 1.0 * L:
                return False
        return True
    with sb.entity("edge:shore"):
        for ln in RIVER["shores"]:
            for a, b in zip(ln, ln[1:]):
                L = math.hypot(b[0] - a[0], b[1] - a[1])
                m = max(1, math.ceil(L / 0.5))
                for i in range(m):
                    p = (a[0] + (b[0] - a[0]) * i / m, a[1] + (b[1] - a[1]) * i / m)
                    q = (a[0] + (b[0] - a[0]) * (i + 1) / m, a[1] + (b[1] - a[1]) * (i + 1) / m)
                    if not (inside(p) or inside(q)):
                        continue
                    k.add("hidden", True, [V((p[0], p[1], H_ - 0.6)), V((q[0], q[1], H_ - 0.6)), V((q[0], q[1], top)),
                                           V((p[0], p[1], top))], [(0, 1, 2, 3)])
                    n += 1
    return n


# ---------------------------------------------------------------- ground

def ground(rng, roads, water_polys):
    """Heightfield over the section: low undulation, the roads and the yards worn, each bank falling from its built
    bank top (H 0) to its built shore at the water's H -0.7 (a wash-drawn slope, as painted), the river bed under the
    water, the south-bank mound a low rounded bank (crest 0.5 m), the two lines at the top east of the 望火楼 a low
    raised bank. The ground is the painted surface (owner "ground"; the banks are their grd entities' ground). Cells are
    0.5 m within 1.0 m of a shore or bank top, 2 m more than 2 m outside the painted area, 1 m elsewhere (crack-free:
    a cell beside finer ones fans from its centre over the shared midpoints). It stops 0.5 m past the S3 seam (dipping
    0.12 m toward it, so S3's ground lies on top), runs level 1 m past the S1 seam (S1's ground dips under it) except
    where the east reach's water ends on that seam (there it stops on the seam, the bed just under the water: S1's bank
    rises out of it; the join, 2026-10-12) and 16 m past the silk's edges under the mist."""
    X0, X1, Y0, Y1 = EXTENT["x0"], EXTENT["x1"], EXTENT["y0"], EXTENT["y1"]
    ph = [rng.uniform(0, 6.283) for _ in range(6)]
    WH = RIVER["H"]
    nsh, ntop = RIVER["north_shore"], RIVER["north_top"]
    pairs = [(nsh, ntop)] + RIVER["south_pairs"]
    sw, se, ne, nw = WALK
    mound = line("S2.grd.mound_south_bank_21420", "bank_top")
    bl_n, bl_s = line("S2.grd.bank_lines_top_28900", "edge_n"), line("S2.grd.bank_lines_top_28900", "edge_s")
    yard_w = line("S2.grd.wharf_yard_28100", "edge_n") + list(reversed(line("S2.grd.wharf_yard_28100", "edge_s")))
    yard_p = fp("S2.grd.yard_pole_frame_27500")
    all_shore = [ln for ln, _ in pairs] + [ln for _, ln in pairs]

    def in_water(p):
        return any(pip(p, poly) for poly in water_polys)

    def bank_w(p, shore, top):
        best, q = 1e9, None
        for a, b in zip(shore, shore[1:]):
            d, qq = seg_closest(p, a, b)
            if d < best:
                best, q = d, qq
        return best, max(0.35, poly_dist(q, top))

    def base(x, y):
        z = (0.03 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.02 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.012 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = min(poly_dist((x, y), ln) / hw for ln, hw in roads)
        if dr < 1.0:
            z = z * (0.4 + 0.6 * dr) - 0.03 * (1 - dr)
        p = (x, y)
        # the south-bank mound: a low rounded bank along its crest (its water side is the bank slope, blended below)
        if y < 5.0:
            dm = poly_dist(p, mound)
            if dm < 3.0:
                z += 0.5 * (1 - _smooth(0.0, 3.0, dm))
        # the two lines at the top east of the 望火楼: a low raised bank between them
        if bl_n[0][0] - 0.8 < x < bl_n[-1][0] + 1.5:
            yn = bl_n[0][1]
            ys = sum(q[1] for q in bl_s) / len(bl_s)
            z += 0.28 * (1 - _smooth(0.0, 0.5, max(0.0, y - yn, ys - y)))
        return z

    # the S1 seam where the east reach's water stops on it (joined 2026-10-12, the join agent): from its run-on south of
    # the silk to its north shore's end on the seam, the bed rises to just under the water at the seam, and this
    # ground stops on the seam there (S1's ground rises out of the water as a bank); north of the water's end it runs
    # on 1 m past the seam as before, but for 3 m it dips 0.15 m toward the seam and under S1's bank (hz), so the
    # lower of the two grounds always reaches past the upper one's edge (no gap to see through)
    e_end = RIVER["reaches"]["S2.water.bian_river_e"]["shore_n"][-1]
    d_end = (RIVER["d_run"], e_end[1])

    def at_end(x, y):
        return d_end[0] - 1.0 < y < d_end[1] and x >= x_on(se, ne, y) - 3.0

    def h(x, y):
        z = base(x, y)
        p = (x, y)
        if in_water(p) or (at_end(x, y) and x >= x_on(se, ne, y) - 1e-6):   # under the water: down from the shore
            ds = min(poly_dist(p, ln) for ln in RIVER["shores"])
            if at_end(x, y):
                ds = min(ds, max(0.0, x_on(se, ne, y) - x) * 0.83)
            return WH - 0.05 - 0.9 * _smooth(0.0, 2.0, ds)
        # every bank whose slope reaches here: the lowest wins (continuous where two banks' slopes meet)
        zz = z
        for shore, top in pairs:
            ds, w = bank_w(p, shore, top)
            if ds < w + 0.6:
                zz = min(zz, WH + (z - WH) * _smooth(0.0, w, ds))
        return zz

    def bare(x, y):
        wob = 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5]) + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1])
        b = max(1 - _smooth(hw * 0.55, hw * 1.05, poly_dist((x, y), ln) + wob) for ln, hw in roads)
        if pip((x, y), yard_w) or pip((x, y), yard_p):
            b = max(b, 0.75)
        ds = min(poly_dist((x, y), ln) for ln in RIVER["shores"])
        return max(b, 0.85 * (1 - _smooth(0.5, 2.5, ds)))   # the wet bank

    def hz(x, y):
        d = x - x_on(sw, nw, y)
        # beside the river's end (north of it) it dips 0.15 m toward the S1 seam and on past it, so S1's bank lies on
        # top where the two meet and this ground runs on under it
        de = x - x_on(se, ne, y)
        end_dip = 0.15 * _smooth(-1.2, 0.0, de) * (1 - _smooth(d_end[1] + 1.6, d_end[1] + 3.0, y)) \
            * _smooth(d_end[0] - 1.0, d_end[0], y) if de > -1.2 else 0.0
        return h(x, y) - 0.12 * (1 - _smooth(-0.5, 1.5, d)) - end_dip

    # leaves of a restricted quadtree in half-metre units: size 4 (2 m), 2 (1 m) or 1 (0.5 m)
    def in_domain(cx, cy, m=1.0):
        """a cell centred at (cx, cy) reaching m m either side touches the strip between the two seam lines (the faces
        are clipped to them afterwards)"""
        return x_on(sw, nw, cy) - 0.5 - m < cx < x_on(se, ne, cy) + 1.0 + m

    def need(cx, cy, s):
        """the size a cell centred at (cx, cy) of size s (m) needs: 0.5 near a shore, 2 far outside, else 1"""
        r = s * 0.71
        if min(poly_dist((cx, cy), ln) for ln in all_shore) < 1.0 + r:
            return 0.5
        if (sw[1] - 2.0 - r < cy < nw[1] + 2.0 + r):
            return 1.0
        return 2.0

    def deep_water(cx, cy, s):
        if not in_water((cx, cy)):
            return False
        ds = min(poly_dist((cx, cy), ln) for ln in RIVER["shores"]) if RIVER["shores"] else 9
        return ds > 1.8 + s * 0.71

    leaves = {}
    for j in range(int((Y1 - Y0) / 2)):
        for i in range(int((X1 - X0) / 2)):
            x, y = X0 + 2 * i, Y0 + 2 * j
            cx, cy = x + 1.0, y + 1.0
            if not in_domain(cx, cy, 2.0):
                continue
            if need(cx, cy, 2.0) >= 2.0:
                if not deep_water(cx, cy, 2.0):
                    leaves[(4 * i, 4 * j)] = 4
                continue
            for di in (0, 1):
                for dj in (0, 1):
                    xx, yy = x + di, y + dj
                    if not in_domain(xx + 0.5, yy + 0.5, 1.0):
                        continue
                    if need(xx + 0.5, yy + 0.5, 1.0) >= 1.0:
                        if not deep_water(xx + 0.5, yy + 0.5, 1.0):
                            leaves[(4 * i + 2 * di, 4 * j + 2 * dj)] = 2
                        continue
                    for ei in (0, 1):
                        for ej in (0, 1):
                            xh, yh = xx + 0.5 * ei, yy + 0.5 * ej
                            if in_domain(xh + 0.25, yh + 0.25, 0.5) and not deep_water(xh + 0.25, yh + 0.25, 0.5):
                                leaves[(4 * i + 2 * di + ei, 4 * j + 2 * dj + ej)] = 1
    # 2:1 balance: a 2 m leaf beside a 0.5 m leaf splits into 1 m leaves
    cell = {}
    for (a, b), s in leaves.items():
        for u in range(s):
            for w in range(s):
                cell[(a + u, b + w)] = (a, b, s)
    changed = True
    while changed:
        changed = False
        for (a, b), s in list(leaves.items()):
            if s != 4 or leaves.get((a, b)) != 4:
                continue
            fine = False
            for u in range(-1, 5):
                for w in (-1, 4):
                    c = cell.get((a + u, b + w))
                    if c and c[2] == 1:
                        fine = True
                    c = cell.get((a + w, b + u))
                    if c and c[2] == 1:
                        fine = True
            if fine:
                del leaves[(a, b)]
                for di in (0, 2):
                    for dj in (0, 2):
                        leaves[(a + di, b + dj)] = 2
                        for u in range(2):
                            for w in range(2):
                                cell[(a + di + u, b + dj + w)] = (a + di, b + dj, 2)
                changed = True
    vid, verts = {}, []

    def v(a, b):   # lattice point (a, b) in half metres
        if (a, b) not in vid:
            vid[(a, b)] = len(verts)
            x, y = X0 + a / 2, Y0 + b / 2
            verts.append(V((x, y, hz(x, y))))
        return vid[(a, b)]
    faces = []
    for (a, b), s in leaves.items():
        def finer(pa, pb):
            c = cell.get((pa, pb))
            return c is not None and c[2] < s
        h2 = s // 2
        mids = {"s": s > 1 and (finer(a + h2 - 1, b - 1) or finer(a + h2, b - 1)),
                "e": s > 1 and (finer(a + s, b + h2 - 1) or finer(a + s, b + h2)),
                "n": s > 1 and (finer(a + h2 - 1, b + s) or finer(a + h2, b + s)),
                "w": s > 1 and (finer(a - 1, b + h2 - 1) or finer(a - 1, b + h2))}
        if not any(mids.values()):
            faces.append((v(a, b), v(a + s, b), v(a + s, b + s), v(a, b + s)))
            continue
        ring = [(a, b)] + ([(a + h2, b)] if mids["s"] else []) + [(a + s, b)] + ([(a + s, b + h2)] if mids["e"] else []) + \
            [(a + s, b + s)] + ([(a + h2, b + s)] if mids["n"] else []) + [(a, b + s)] + ([(a, b + h2)] if mids["w"] else [])
        c = v(a + h2, b + h2)
        for p0, p1 in zip(ring, ring[1:] + ring[:1]):
            faces.append((c, v(*p0), v(*p1)))
    # clip every face to the two seam lines (no stair-stepped cell edge where a neighbour's ground meets it)
    # (east: on the seam where the east reach's water ends on it, 1 m past it north of there, where it runs on under
    # S1's bank: hz's end dip)
    lines_ = [(sw, nw, -0.5, -1), (se, ne, lambda y: 1.0 * _smooth(d_end[1], d_end[1] + 0.4, y), 1)]
    # (a, b, offset along +X, keep side: -1 east of it, +1 west)

    def side(p, a, b, off, keep):
        o = off(p[1]) if callable(off) else off
        return keep * (p[0] - (x_on(a, b, p[1]) + o))        # <= 0 keeps

    extra = {}

    def vx(p):
        key = (round(p[0], 4), round(p[1], 4))
        if key not in extra:
            extra[key] = len(verts)
            verts.append(V((p[0], p[1], hz(p[0], p[1]))))
        return extra[key]
    out_faces = []
    for f in faces:
        poly = [(verts[i].x, verts[i].y, i) for i in f]
        for a, b, off, keep in lines_:
            if all(side(q, a, b, off, keep) <= 1e-9 for q in poly):
                continue
            clipped = []
            for j in range(len(poly)):
                P0, P1 = poly[j], poly[(j + 1) % len(poly)]
                s0, s1 = side(P0, a, b, off, keep), side(P1, a, b, off, keep)
                if s0 <= 0:
                    clipped.append(P0)
                if (s0 < 0 < s1) or (s1 < 0 < s0):
                    t = s0 / (s0 - s1)
                    X_, Y_ = P0[0] + t * (P1[0] - P0[0]), P0[1] + t * (P1[1] - P0[1])
                    clipped.append((X_, Y_, None))
            poly = clipped
            if len(poly) < 3:
                break
        if len(poly) < 3:
            continue
        if all(q[2] is not None for q in poly) and len(poly) == len(f):
            out_faces.append(f)                     # untouched
            continue
        idx = [q[2] if q[2] is not None else vx(q) for q in poly]
        for j in range(1, len(idx) - 1):
            if len({idx[0], idx[j], idx[j + 1]}) == 3:
                out_faces.append((idx[0], idx[j], idx[j + 1]))
    faces = out_faces
    H["h"] = hz
    H["ground"] = (verts, faces, [bare(p.x, p.y) for p in verts])
    return hz


# ---------------------------------------------------------------- a placement check (not geometry)

def mark_rect(x0, x1, y0, y1):
    """Record a closed room's wall rectangle (in the current local frame: song_kit.placed transforms these points with
    the geometry) for check_inside(); a bucket of its own that build() removes before any mesh is made."""
    owner = sb.B.owners[-1] if sb.B.owners else "?"
    b = sb.B.data.setdefault(("__mark__", owner), {"v": [], "f": [], "uv": []})
    b["v"].extend(V((x, y, 0.0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)))


def check_inside():
    """Print every painted figure and animal standing inside a room's walls (open fronts hold their customers and are
    not marked; closed rooms are)."""
    rects = {}
    for key in [kk for kk in sb.B.data if kk[0] == "__mark__"]:
        vs = sb.B.data.pop(key)["v"]
        rects.setdefault(key[1], []).extend([[(v.x, v.y) for v in vs[i:i + 4]] for i in range(0, len(vs), 4)])
    out = []
    things = [(f["map_id"], f["X"], f["D"], f.get("support") or "") for f in LAYOUT["figures"]]
    things += [(k_, (e["pts"]["fore"][0] + e["pts"]["hind"][0]) / 2, (e["pts"]["fore"][1] + e["pts"]["hind"][1]) / 2, "")
               for k_, e in E.items() if e["kind"] == "animal"]
    things += [(t["map_id"], t["X"], t["D"], "") for t in LAYOUT["trees"]]
    for mid, x, y, sup in things:
        if sup.startswith(("boat", "cart", "perched", "animal")):
            continue
        for owner, polys in rects.items():
            for q in polys:
                if pip((x, y), q):
                    out.append([mid, owner, round(x, 2), round(y, 2)])
    print("INSIDE " + json.dumps(out), flush=True)
    H["inside"] = out
    return out


# ---------------------------------------------------------------- composition helpers (local frames, kit parts only)

def roof(x0, x1, yf, yb, z_eave, z_ridge, kind="gable", detail=MID, over=0.45, ornament=0.0, mat="roof"):
    """A tiled roof over the eave rectangle x0..x1, yf..yb, ridge along x. detail NEAR: the kit's own roofs
    (song_kit.gable_roof / hip_roof: rafter ends, barge boards, ridge ornaments); MID: the same curved slopes, fascia
    and raised ridges without rafter ends; FAR: coarse slopes and one plain ridge (roofs at the silk's top)."""
    if detail == NEAR:
        if kind == "hip":
            k.hip_roof(x0, x1, yf, yb, z_eave, z_ridge, lift=0.35, ns=10, nt=4, ornament_s=ornament or 0.6)
        else:
            k.gable_roof(x0, x1, yf, yb, z_eave, z_ridge, over=over, ns=6, nt=3, ornament_s=ornament or 0.45)
        return
    ns, nt = (6, 3) if detail == MID else (3, 2)
    yc = (yf + yb) / 2
    thick = 0.18 if detail == MID else 0.14
    if kind == "hip":
        d = (yb - yf) / 2
        rx0, rx1 = x0 + d, x1 - d
        if rx1 < rx0:
            rx0 = rx1 = (x0 + x1) / 2

        def height(s, t):
            return z_eave + (z_ridge - z_eave) * (t ** 1.6) + 0.3 * (abs(2 * s - 1) ** 3) * (1 - t) ** 2
        slopes = [((x0, yf), (x1, yf), (rx0, yc), (rx1, yc), ns), ((x1, yf), (x1, yb), (rx1, yc), (rx1, yc), max(2, ns // 2)),
                  ((x1, yb), (x0, yb), (rx1, yc), (rx0, yc), ns), ((x0, yb), (x0, yf), (rx0, yc), (rx0, yc), max(2, ns // 2))]
        edges = k._roof_surface(slopes, height, thick, nt, mat=mat, rafters=False)
        if detail == MID:
            for rows in (edges[0], edges[2]):
                for col in (0, -1):
                    ln = [r[col] if len(r) > 1 else r[0] for r in rows]
                    k.beam("ridge", False, ln[0] + UP * 0.06, ln[-1] + UP * 0.06, 0.16, 0.12, 0)
        if rx1 - rx0 > 0.05:
            k.beam("ridge", False, (rx0 - 0.05, yc, z_ridge + 0.1), (rx1 + 0.05, yc, z_ridge + 0.1), 0.24, 0.24,
                   0.03 if detail == MID else 0)
        if ornament:
            k.ridge_ornament((rx0 - 0.05, yc, z_ridge + 0.2), (-1, 0), s=ornament)
            k.ridge_ornament((rx1 + 0.05, yc, z_ridge + 0.2), (1, 0), s=ornament)
        return
    xa, xb = x0 - over, x1 + over

    def height(s, t):
        return z_eave + (z_ridge - z_eave) * (t ** 1.3) + 0.12 * (abs(2 * s - 1) ** 4) * (1 - t)
    slopes = [((xa, yf), (xb, yf), (xa, yc), (xb, yc), ns), ((xb, yb), (xa, yb), (xb, yc), (xa, yc), ns)]
    edges = k._roof_surface(slopes, height, thick, nt, mat=mat, rafters=False)
    for rows in edges:
        for col in (0, -1):
            ln = [r[col] for r in rows]
            k.beam("redwood", False, ln[0] - UP * 0.05, ln[-1] - UP * 0.05, 0.06, 0.24, 0)    # barge boards
    k.beam("ridge", False, (xa - 0.04, yc, z_ridge + 0.08), (xb + 0.04, yc, z_ridge + 0.08), 0.22, 0.22,
           0.03 if detail == MID else 0)
    if ornament:
        k.ridge_ornament((xa, yc, z_ridge + 0.18), (-1, 0), s=ornament)
        k.ridge_ornament((xb, yc, z_ridge + 0.18), (1, 0), s=ornament)


def roof_y(x0, x1, yf, yb, z_eave, z_ridge, kind="gable", detail=MID, over=0.45, ornament=0.0, mat="roof"):
    """roof() with its ridge along y (a gable facing south and north)."""
    cx, cy = (x0 + x1) / 2, (yf + yb) / 2
    hx, hy = (yb - yf) / 2, (x1 - x0) / 2
    with k.placed(k.frame(cx, cy, 0, 90)):
        roof(-hx, hx, -hy, hy, z_eave, z_ridge, kind, detail, over, ornament, mat)


def gable_tri(x, y0, y1, z0, z1, mat="plaster"):
    """The gable triangle over an end wall at x (both faces)."""
    a, b, c = V((x, y0, z0)), V((x, y1, z0)), V((x, (y0 + y1) / 2, z1))
    k.add(mat, False, [a, b, c], [(0, 1, 2)])
    k.add(mat, False, [b, a, c], [(0, 1, 2)])


def gable_tri_y(y, x0, x1, z0, z1, mat="plaster"):
    a, b, c = V((x0, y, z0)), V((x1, y, z0)), V(((x0 + x1) / 2, y, z1))
    k.add(mat, False, [a, b, c], [(0, 1, 2)])
    k.add(mat, False, [b, a, c], [(0, 1, 2)])


def tpost(x, y, z0, z1, r=0.075, collide=True, mat="timber", base=False):
    """A plain round post (6 sides), on a small stone block if `base`."""
    if base:
        k.post("stone", collide, x, y, z0 - 0.05, z0 + 0.1, r * 2.6, 0.02)
        z0 += 0.1
    sb.cyl(mat, collide, (x, y, z0), (x, y, z1), r, r * 0.88, segs=6)


def shop(W, Dp, z0, eave, rise, cols, kinds, rng, roof_kind="gable", detail=MID, side=("wall", "wall"), back="wall",
         col_r=0.09, over=0.45, ornament=0.0, front_over=0.75, back_over=0.55, sill=0.12, head=None, lintel=True,
         mark=True, side_over=0.35, interior=True):
    """A one-storey shop or house in a local frame (front along y = 0 facing -y, x 0..W, depth Dp toward +y), from
    kit parts: round timber columns at `cols` (x positions) on low stone blocks, the front bays as kinds ('wall',
    'window', 'door', 'open': kit_inner_city.wall_bays, no posts of its own), plaster side and back walls, a stone
    sill along the front, lintels front and back, gable triangles, the roof (roof(): gable, hip or xieshan).
    The dark back of an open front is the back wall (colliding); `interior` lays a plank floor. Returns the column top."""
    top = z0 + eave
    cols = sorted(cols or [0.0, W])
    if abs(cols[0]) > 0.05:
        cols = [0.0] + cols
    if abs(cols[-1] - W) > 0.05:
        cols = cols + [W]
    for x in cols:
        tpost(x, 0.0, z0, top, r=col_r, base=True)
    for x in (0.0, W):
        tpost(x, Dp, z0, top, r=col_r, base=False)
    fr = [c / W for c in cols]
    ki.wall_bays((0.0, 0.0), (W, 0.0), z0, top - 0.12, fr, kinds, rng, head=head, posts=False)
    if side[0] == "wall":
        k.board("plaster", True, (0.0, Dp - 0.05), (0.0, 0.08), 0.14, z0 - 0.1, top)
    if side[1] == "wall":
        k.board("plaster", True, (W, 0.08), (W, Dp - 0.05), 0.14, z0 - 0.1, top)
    if back == "wall":
        k.board("plaster", True, (W - 0.05, Dp), (0.05, Dp), 0.14, z0 - 0.1, top)
    if sill:
        k.beam("stone", False, (-0.12, -0.04, z0 - 0.06), (W + 0.12, -0.04, z0 - 0.06), 0.3, sill + 0.08, 0.03)
    if interior:
        k.bx("deck", False, (0.06, 0.06, z0 - 0.02), (W - 0.06, Dp - 0.06, z0 + 0.02))
    if lintel:
        k.beam("timber", True, (-0.12, 0.0, top - 0.08), (W + 0.12, 0.0, top - 0.08), 0.15, 0.2, 0.03)
        k.beam("timber", False, (-0.12, Dp, top - 0.08), (W + 0.12, Dp, top - 0.08), 0.13, 0.18, 0.03)
    if mark and back == "wall" and side == ("wall", "wall") and all(kd != "open" for kd in kinds):
        mark_rect(0.0, W, 0.0, Dp)
    zr = top + 0.1
    if roof_kind == "gable":
        roof(-side_over * 0 + 0.0, W, -front_over, Dp + back_over, zr, zr + rise, "gable", detail, over, ornament)
        for x in (0.0, W):
            gable_tri(x, -0.1, Dp + 0.1, top, zr + rise * 0.88)
    elif roof_kind == "hip":
        roof(-side_over - 0.3, W + side_over + 0.3, -front_over, Dp + back_over, zr, zr + rise, "hip", detail,
             ornament=ornament)
    elif roof_kind == "xieshan":
        if detail >= MID:
            ki.xieshan_roof(-side_over - 0.3, W + side_over + 0.3, -front_over, Dp + back_over, zr, zr + rise,
                            ornament_s=ornament or 0.6, ns=8, nt=4)
        else:
            roof(-side_over - 0.3, W + side_over + 0.3, -front_over, Dp + back_over, zr, zr + rise, "hip", detail)
    elif roof_kind == "gable_y":
        roof_y(-0.1, W + 0.1, -front_over, Dp + back_over, zr, zr + rise, "gable", detail, over, ornament)
        for y in (0.0, Dp):
            gable_tri_y(y, -0.1, W + 0.1, top, zr + rise * 0.88)
    return top


def far_house(W, Dp, z0, eave, rise, rng, roof_kind="gable", front=None, ornament=0.0, front_over=0.6):
    """A far building at the silk's top (cheap: plaster walls, a timber plate, a coarse roof). front: None (a plain
    wall), or a callable drawing the painted front (lattice, openings) on y = 0 between z0 and the eave."""
    top = z0 + eave
    for x, y in ((0.0, 0.0), (W, 0.0), (0.0, Dp), (W, Dp)):
        k.post("timber", True, x, y, z0 - 0.1, top, 0.16, 0.02)
    k.board("plaster", True, (0.08, Dp), (W - 0.08, Dp), 0.12, z0 - 0.1, top)
    k.board("plaster", True, (0.0, 0.08), (0.0, Dp - 0.08), 0.12, z0 - 0.1, top)
    k.board("plaster", True, (W, 0.08), (W, Dp - 0.08), 0.12, z0 - 0.1, top)
    if front is None:
        k.board("plaster", True, (0.08, 0.0), (W - 0.08, 0.0), 0.12, z0 - 0.1, top)
    else:
        front(z0, top)
    k.beam("timber", False, (-0.1, -0.02, top - 0.07), (W + 0.1, -0.02, top - 0.07), 0.12, 0.16, 0)
    mark_rect(0.0, W, 0.0, Dp)
    zr = top + 0.08
    if roof_kind == "hip":
        roof(-0.55, W + 0.55, -front_over, Dp + 0.5, zr, zr + rise, "hip", FAR, ornament=ornament)
    else:
        roof(0.0, W, -front_over, Dp + 0.5, zr, zr + rise, "gable", FAR, over=0.35, ornament=ornament)
        for x in (0.0, W):
            gable_tri(x, -0.05, Dp + 0.05, top, zr + rise * 0.88)
    return top


def open_shed(W, Dp, z0, eave_f, eave_b, posts_x, rng, back_posts=None, roof_kind="gable", rise=1.0, detail=FAR,
              back_wall=False, side_walls=(False, False), over_f=0.6, over_b=0.45, col_r=0.065):
    """An open shed on thin posts (front posts at posts_x on y = 0, back posts on y = Dp), plates along both, a tiled
    roof (gable: ridge along x; 'lean': one slope from the back down to the front)."""
    back_posts = back_posts if back_posts is not None else [0.0, W]
    for x in posts_x:
        tpost(x, 0.0, z0, z0 + eave_f, r=col_r)
    for x in back_posts:
        tpost(x, Dp, z0, z0 + eave_b, r=col_r)
    k.beam("timber", False, (-0.15, 0.0, z0 + eave_f - 0.06), (W + 0.15, 0.0, z0 + eave_f - 0.06), 0.1, 0.12, 0.015)
    k.beam("timber", False, (-0.15, Dp, z0 + eave_b - 0.06), (W + 0.15, Dp, z0 + eave_b - 0.06), 0.1, 0.12, 0.015)
    if back_wall:
        k.board("plaster", True, (W, Dp), (0.0, Dp), 0.1, z0 - 0.1, z0 + eave_b)
    if side_walls[0]:
        k.board("plaster", True, (0.0, Dp), (0.0, 0.05), 0.1, z0 - 0.1, z0 + min(eave_f, eave_b))
    if side_walls[1]:
        k.board("plaster", True, (W, 0.05), (W, Dp), 0.1, z0 - 0.1, z0 + min(eave_f, eave_b))
    if roof_kind == "lean":
        ki.lean_to(-0.3, W + 0.3, -over_f, Dp + over_b, z0 + eave_f, z0 + eave_b + 0.1, ns=6, nt=2,
                   rafters=detail == NEAR)
    else:
        z = z0 + max(eave_f, eave_b)
        roof(0.0, W, -over_f, Dp + over_b, z, z + rise, roof_kind, detail, over=0.3)


def clear_posts(o, yaw, xs, y, things, r=0.32):
    """Posts at local x positions on the line y, each moved along the line (up to 0.5 m) clear of painted things
    (props, figures: world points with a radius), or dropped if it can't be."""
    out = []
    for x in xs:
        best = None
        for dxs in (0.0, 0.15, -0.15, 0.3, -0.3, 0.45, -0.45):
            p = world_of(o, yaw, (x + dxs, y))
            if all(math.hypot(p[0] - t[0], p[1] - t[1]) > t[2] + r * 0.3 for t in things):
                best = x + dxs
                break
        if best is not None:
            out.append(best)
    return out


def things_near(o, yaw, W, Dp, pad=1.0):
    """The painted props and figures (world X, D, radius) over a building's plan, for post placement."""
    out = []
    for f in LAYOUT["figures"]:
        if (f.get("support") or "").startswith("boat"):
            continue
        q = local_of(o, yaw, (f["X"], f["D"]))
        if -pad < q[0] < W + pad and -pad < q[1] < Dp + pad:
            out.append((f["X"], f["D"], 0.3))
    for eid, e in E.items():
        if e["kind"] not in ("prop",):
            continue
        q = local_of(o, yaw, e["pos"])
        if -pad < q[0] < W + pad and -pad < q[1] < Dp + pad:
            out.append((e["pos"][0], e["pos"][1], 0.45))
    return out


def roof_xieshan(x0, x1, yf, yb, z_eave, z_ridge, detail=MID, ornament=0.0):
    """A hip-gable roof (歇山): kit_inner_city.xieshan_roof at NEAR detail; at MID or FAR a plain hip (roof()), since
    the small vertical gables can't show on its coarser concave slopes without poking through them."""
    if detail == NEAR:
        ki.xieshan_roof(x0, x1, yf, yb, z_eave, z_ridge, ornament_s=ornament or 0.6, ns=8, nt=4)
        return
    roof(x0, x1, yf, yb, z_eave, z_ridge, "hip", detail, ornament=ornament)


def pt_on(ln, x):
    """The point of a west -> east polyline at world X (clamped to its ends)."""
    if x <= ln[0][0]:
        return ln[0]
    for a, b in zip(ln, ln[1:]):
        if a[0] <= x <= b[0] and b[0] > a[0]:
            t = (x - a[0]) / (b[0] - a[0])
            return (x, a[1] + t * (b[1] - a[1]))
    return ln[-1]


def lx_u(o, yaw, u, D):
    """A painted scan u at depth D as a building's local x."""
    return local_of(o, yaw, (ux(u, D), D))[0]


# ---------------------------------------------------------------- the west bank (u 20500-22300), north side

def west_bank(rng):
    # S2.str.slat_fence_20740: a tall fence of close vertical slats on the north bank from the big willow's foot to
    # the shop row's west end, set at a slant, with a narrow gateway of two posts (u 20750-20790). choice: 1.9 m (painted
    # 110 -> 75 px tall at the far-row scale), slats 9 cm apart; the gateway's opening closed by an invisible board
    # (behind it nothing is painted)
    eid = "S2.str.slat_fence_20740"
    ln = line(eid, "base")
    gx0, gx1 = ux(20750, 26.9), ux(20790, 27.0)
    ga, gb = pt_on(ln, gx0), pt_on(ln, gx1)
    z = min(hz_at(*p) for p in ln)
    with sb.entity(eid):
        with k.placed(k.frame(0, 0, z)):
            run = [p for p in ln if p[0] < gx0] + [ga]
            for a, b in zip(run, run[1:]):
                ki.slat_fence(a, b, 1.9, rng, slat=0.09, mat="bamboo")
            run = [gb] + [p for p in ln if p[0] > gx1]
            for a, b in zip(run, run[1:]):
                ki.slat_fence(a, b, 1.8, rng, slat=0.09, mat="bamboo")
            ko.gate_frame(ga, gb, 2.0, rng, jamb=0.12, threshold=False, mat="timber")
            k.board("hidden", True, ga, gb, 0.06, 0.0, 2.0)
    # S2.str.low_kerb_20920: a low kerb between the fence's east end and the shop row's corner, a short post at its
    # west end. choice: 0.18 m high, 0.24 m deep
    eid = "S2.str.low_kerb_20920"
    a, b = line(eid, "base")[0], line(eid, "base")[-1]
    z = min(hz_at(*a), hz_at(*b)) - 0.04
    with sb.entity(eid):
        k.stone_run("stone", True, a, b, z, z + 0.2, 0.24, rng, lmin=0.4, lmax=0.7)
        k.post("timber", False, a[0] + 0.05, a[1], z, z + 0.42, 0.09, 0.015)
    # S2.prop.wheel_20965: a small spoked wheel standing on its edge, leaning back against the low kerb.
    # choice: 0.38 m radius (painted 22 px across), 12 spokes, leaning 15 deg
    x, y = P("S2.prop.wheel_20965")
    with sb.entity("S2.prop.wheel_20965"):
        R = 0.38
        z = hz_at(x, y)
        kv.spoked_wheel(V((x, y + 0.08, z + R * 0.97)), V((0.0, 0.966, 0.259)), R, spokes=12)
    # S2.bld.shop_row_21200: a long single-storey tiled shop row with five bays facing the water: a lattice window
    # band over a plain wall, an open bay with a table and a basket, an open bay under a valance, a bay closed by
    # horizontal slatted shutters; a side wall with a lattice door recedes north at the east end. On its painted
    # front (posts u 20982-21423). choice: eave 2.7 (painted 0.92 at the far-row scale), gable roof 1.4 high running
    # off the silk's top edge, 3.2 m deep (its back hidden beyond the silk)
    eid = "S2.bld.shop_row_21200"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.2
    z0 = z_under(o, yaw, W, Dp)
    cols = [max(0.0, lx_u(o, yaw, u, 27.84)) for u in (20982, 21088, 21198, 21318)] + [W]
    cols[0] = 0.0
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 2.7, 1.4, cols, ["window", "open", "open", "open"], rng, side=("wall", "none"),
                       detail=MID, ornament=0.35, sill=0.1)
            k2.valance((cols[2] + 0.05, -0.12), (cols[3] - 0.05, -0.12), top - 0.1, rng, depth=0.32)
            kc.slat_shutters((cols[3] + 0.1, 0.0), (W - 0.1, 0.0), 0.05, top - 0.3, rng)
            # the east side wall: a lattice door at its front, plain behind (the room behind it is not painted)
            k.board("plaster", True, (W, 1.15), (W, Dp - 0.05), 0.14, -0.1, top)
            k.board("plaster", False, (W, 0.08), (W, 1.15), 0.14, 2.15, top)
            ki.lattice_frame((W + 0.04, 0.2), (W + 0.04, 1.05), 0.02, 2.1, rng)
            k.board("hidden", True, (W, 0.08), (W, 1.15), 0.06, 0.0, 2.15)
    # S2.bld.open_shop_21640: a single-storey shop with an open front on slender posts, its floor raised on a plain
    # plinth, a counter inside. choice: floor 0.3 (painted 15-30 px above the street), two steps up at its middle, eave
    # 2.6 over the floor, 3.0 m deep
    eid = "S2.bld.open_shop_21640"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.0
    z0 = z_under(o, yaw, W, Dp)
    H["shop21640_floor"] = z0 + 0.3
    with sb.entity(eid):
        with placed(o, yaw, z0):
            k.beam("stone", True, (-0.05, 0.08, 0.0), (W + 0.05, 0.08, 0.0), 0.2, 0.62, 0.03)    # the plinth's face
            k.bx("stone", True, (0.0, 0.1, -0.1), (W, Dp, 0.3))
            k.stairs(W * 0.3, W * 0.7, -0.5, -0.02, 0.0, 0.3, 2, rng=rng)
            cols = [0.0, lx_u(o, yaw, 21568, 28.24), W]
            shop(W, Dp, 0.3, 2.6, 1.3, cols, ["open", "open"], rng, detail=MID, sill=0.0, interior=False)
    # S2.str.tiled_wall_21810: a plain plastered wall with a tiled coping, running east-west. choice: 1.9 m high, 0.24
    # thick (painted 95 px from coping to foot at the far-row scale; the thickness a placeholder)
    a, b = fp("S2.str.tiled_wall_21810")[0], fp("S2.str.tiled_wall_21810")[1]
    with sb.entity("S2.str.tiled_wall_21810"):
        k.yard_wall([(a[0], a[1] + 0.08), (b[0], b[1] + 0.08)], hz_at, h=1.9, thick=0.24)


# ---------------------------------------------------------------- the south bank (u 20500-22700): roofs at the silk's bottom

def south_bank(rng):
    """Three roofs at the silk's bottom edge, across the river from the walk (painted from above: their bases below
    the silk). Mapped at the ground, a roof outline reads 3-4 m too far north (its height read as depth), so each body
    stands south of its painted roof, where its real-height roof paints where the scroll paints it (choices)."""
    # S2.bld.south_bank_hall_21050: a big hall seen only as a broad hip roof, its ridge high at the west. choice: walls
    # x 163.4-173.0 (its west eave over the figure painted under it, u 20625), D -8.0..-1.6 (the base below the silk),
    # eave 3.2, ridge 2.4 higher; the fish-scale tiles wait on a swatch (roof tiles meanwhile); the eave brackets under
    # its west end are not built (far)
    eid = "S2.bld.south_bank_hall_21050"
    x0, x1, y0, y1 = 163.4, 173.0, -8.0, -1.6
    with sb.entity(eid):
        z0 = min(hz_at(x, y) for x in (x0, x1) for y in (y0, y1))
        with k.placed(k.frame(x1, y1, z0, 180)):           # its front (unseen) toward the bank, north
            far_house(x1 - x0, y1 - y0, 0.0, 3.2, 2.4, rng, roof_kind="hip", front_over=0.9, ornament=0.5)
    # S2.bld.thatched_shed_south_21600: a long low building under a thatched roof with small marks along its ridge,
    # ending at the water by the open boat. choice: walls x 169.4-177.3, D -6.6..-2.9 (east of it the crouching man and
    # the timber frame stand free), eave 2.3, thatch ridge 3.7
    eid = "S2.bld.thatched_shed_south_21600"
    x0, x1, y0, y1 = 169.4, 177.3, -6.6, -2.9
    with sb.entity(eid):
        z0 = min(hz_at(x, y) for x in (x0, x1) for y in (y0, y1))
        with k.placed(k.frame(0, 0, z0)):
            for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
                k.post("timber", True, x, y, -0.1, 2.3, 0.16, 0.02)
            for a, b in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
                k.board("plaster", True, a, b, 0.14, -0.1, 2.25)
            mark_rect(x0, x1, y0, y1)
            ko.thatch_roof(x0 - 0.45, x1 + 0.45, y0 - 0.45, y1 + 0.45, 2.3, 3.7, rng, along="x", hip=True)
    # S2.bld.gable_house_south_21730: a tiled house south of the thatched one, an open gable truss with posts at its west
    # end, its roof running east; a plank leans by the truss. choice: walls x 174.0-179.8, D -10.6..-7.6 (below the
    # silk: only its roof is painted), eave 2.9, ridge 1.6 higher
    eid = "S2.bld.gable_house_south_21730"
    x0, x1, y0, y1 = 174.0, 179.8, -10.6, -7.6
    with sb.entity(eid):
        z0 = min(hz_at(x, y) for x in (x0, x1) for y in (y0, y1))
        with k.placed(k.frame(x0, y0, z0)):
            W, Dp = x1 - x0, y1 - y0
            for x, y in ((W, 0.0), (W, Dp), (1.2, 0.0), (1.2, Dp)):
                k.post("timber", True, x, y, -0.1, 2.9, 0.16, 0.02)
            for a, b in (((1.2, 0.0), (W, 0.0)), ((W, 0.0), (W, Dp)), ((W, Dp), (1.2, Dp)), ((1.2, Dp), (1.2, 0.0))):
                k.board("plaster", True, a, b, 0.14, -0.1, 2.85)
            mark_rect(1.2, W, 0.0, Dp)
            # the open west bay under the gable: two posts and the truss
            for y in (0.0, Dp):
                tpost(0.0, y, 0.0, 2.9, r=0.09)
            k.beam("timber", False, (0.0, -0.2, 2.86), (0.0, Dp + 0.2, 2.86), 0.12, 0.16, 0.02)
            k2.kingpost_gable((0.0, -0.3), (0.0, Dp + 0.3), 2.95, 4.35, rng)
            roof(0.0, W, -0.55, Dp + 0.55, 3.0, 4.6, "gable", FAR, over=0.4)
            gable_tri(W, -0.05, Dp + 0.05, 2.9, 4.45)
            k.beam("deck", False, (-0.3, 0.6, 0.0), (-0.1, 0.75, 2.2), 0.28, 0.05, 0.01)   # the plank leaning by the truss
    # S2.prop.timber_frame_21922: a squared timber slanting up east from a short upright post, a cross-piece at its
    # upper end (a trestle or prop), its post at the painted post (u 21921). choice: 1.5 m long, post 0.7 m
    x, y = P("S2.prop.timber_frame_21922")
    with sb.entity("S2.prop.timber_frame_21922"):
        z = hz_at(x, y)
        k.post("timber", True, x, y + 0.05, z - 0.05, z + 0.7, 0.14, 0.02)
        k.beam("timber", False, (x - 0.35, y + 0.08, z + 0.55), (x + 1.0, y - 0.1, z + 1.3), 0.14, 0.14, 0.02)
        k.beam("timber", False, (x + 0.9, y - 0.4, z + 1.32), (x + 0.9, y + 0.25, z + 1.32), 0.1, 0.1, 0.015)


# ---------------------------------------------------------------- the trackers' bank, the houses and the terrace (u 21850-23500)

def houses(rng):
    # S2.str.slat_screen_22375: a screen of close vertical slats with a capping rail sloping down east, at the top of
    # the bank behind the split willow: the west bay front of the hall behind it (reading b, taken with the hall).
    # choice: 1.9 m (painted 71 px of slats at the far-row scale)
    eid = "S2.str.slat_screen_22375"
    a, b = line(eid, "base")[0], line(eid, "base")[-1]
    z = min(hz_at(*a), hz_at(*b))
    with sb.entity(eid):
        with k.placed(k.frame(0, 0, z)):
            ki.slat_fence(a, b, 1.85, rng, slat=0.08, mat="bamboo")
            k.beam("roof", False, (a[0] - 0.12, a[1], 2.08), (b[0] + 0.12, b[1], 1.88), 0.26, 0.08, 0.02)  # the cap
    # S2.bld.hall_behind_gate_22480: a tiled hall behind the white wall and the gateway, its west bay front the slat
    # screen, the rest of its front hidden. choice: on its painted front (the screen's foot line), 3.6 m deep (its back
    # beyond the silk), eave 3.0, gable roof 1.6 high; the front behind the wall and gate a plain wall
    eid = "S2.bld.hall_behind_gate_22480"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.6
    z0 = z_under(o, yaw, W, Dp)
    xs = local_of(o, yaw, line("S2.str.slat_screen_22375", "base")[-1])[0]
    with sb.entity(eid):
        with placed(o, yaw, z0):
            shop(W, Dp, 0.0, 3.0, 1.6, [0.0, xs + 0.05, W], ["open", "wall"], rng, detail=MID, over=0.7, sill=0.0)
            k.board("hidden", True, (0.0, 0.25), (xs, 0.25), 0.06, 0.0, 2.9)    # the room behind the screen: unpainted
    # S2.str.white_wall_22485: a plain white plastered compound wall with a tiled coping, west of the gateway.
    # choice: 2.3 m (painted 120 px at the far-row scale), 0.28 thick
    a, b = line("S2.str.white_wall_22485", "base")[0], line("S2.str.white_wall_22485", "base")[-1]
    with sb.entity("S2.str.white_wall_22485"):
        k.yard_wall([a, b], hz_at, h=2.3, thick=0.28)
    # S2.str.gateway_22573: a small roofed gateway (门楼): two pairs of posts, a little gabled roof, a closed double
    # door with two ring knockers, a sill. On its painted plan (0.94 m between the jambs: narrowed). choice: lintel 2.2,
    # eave 2.45, ridge 2.95
    eid = "S2.str.gateway_22573"
    o, yaw, W, Dg = front_frame(eid)
    z0 = z_under(o, yaw, W, Dg)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            ko.gate_frame((0.0, 0.0), (W, 0.0), 2.2, rng, jamb=0.13, threshold=True)
            for x in (0.0, W):
                k.post("redwood", True, x, Dg, -0.05, 2.45, 0.13, 0.02)
                k.beam("redwood", False, (x, 0.0, 2.38), (x, Dg, 2.38), 0.1, 0.12, 0.015)
            kce.plain_leaf((0.08, 0.06), (W / 2, 0.06), 0.06, 2.15, 0.0, rng, knocker=True, knocker_at=0.78)
            kce.plain_leaf((W / 2, 0.06), (W - 0.08, 0.06), 0.06, 2.15, 0.0, rng, knocker=True, knocker_at=0.22)
            roof(-0.25, W + 0.25, -0.45, Dg + 0.45, 2.45, 2.95, "gable", MID, over=0.2, ornament=0.25)
    # S2.bld.long_house_22780: a plain plastered front, a band of lattice windows under a projecting plank pent roof, a
    # big tiled hip roof with a small chimney, two doors at its east end facing the terrace. choice: its front wall 0.4 m
    # north of the painted wall foot, so the low shrubs and the weed clump painted along the foot stand outside it (their
    # cards are 0.6-1 m wide); 3.0 m deep (its back hidden); the wall 3.2 m, the lattice band 1.5-2.1 under a plank pent
    # roof at 2.2, the main eave 3.3, ridge 5.1; the chimney at u 22697
    eid = "S2.bld.long_house_22780"
    sw, se, ne, nw = fp(eid)
    o, yaw, W, Dp = (sw[0], sw[1] + 0.4), 0.0, se[0] - sw[0], 3.0
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 3.2, 1.8, [0.0, W / 2, W], ["window", "window"], rng, roof_kind="hip", detail=MID,
                       side=("wall", "none"), front_over=1.0, ornament=0.45, head=2.1)
            # the east end: two doors (a plain panel and a lattice door) facing the bank by the terrace
            ki.wall_bays((W, 0.08), (W, Dp - 0.05), 0.0, top - 0.12, [0.0, 0.45, 0.9, 1.0], ["door", "door", "wall"],
                         rng, head=2.05, posts=True)
            ki.lattice_frame((W + 0.05, Dp * 0.47), (W + 0.05, Dp * 0.86), 0.05, 1.95, rng)
            ki.lean_to(-0.15, W + 0.15, -0.75, 0.02, 2.2, 2.55, mat="deck", ns=4, nt=2, rafters=False)
            kce.roof_vent(lx_u(o, yaw, 22697, 23.0), Dp * 0.32, top + 0.1 + 1.8 * 0.55, w=0.34, d=0.28, h=0.8)
    # S2.bld.lattice_pavilion_top_22945: a small building far up the bank, a sloping roof edge over a row of lattice
    # bars. choice: 2.2 m deep (beyond the silk), eave 2.5, hip roof 1.0 high
    eid = "S2.bld.lattice_pavilion_top_22945"
    o, yaw, W, _ = front_frame(eid)
    Dp = 2.2
    z0 = z_under(o, yaw, W, Dp)

    def lattice_front(Wl):
        def f(z0_, top):
            k.board("plaster", True, (0.08, 0.0), (Wl - 0.08, 0.0), 0.12, z0_ - 0.1, top)
            ki.lattice_frame((0.12, -0.07), (Wl - 0.12, -0.07), z0_ + 0.95, 1.2, rng)
        return f
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 2.5, 1.0, rng, roof_kind="hip", front=lattice_front(W))
    # S2.bld.far_lattice_front_23470: a strip of lattice front at the very top of the silk with a light panel carrying
    # two dark marks (far_panel_2, illegible). choice: 2.8 m deep (beyond the silk), eave 2.6, gable 1.1; the panel at
    # u 23477-23502, 1.55-2.2 m up
    eid = "S2.bld.far_lattice_front_23470"
    o, yaw, W, _ = front_frame(eid)
    Dp = 2.8
    z0 = z_under(o, yaw, W, Dp)
    pa, pb = lx_u(o, yaw, 23477, 29.54), lx_u(o, yaw, 23502, 29.54)

    def lattice_panel(z0_, top):
        k.board("plaster", True, (0.08, 0.0), (W - 0.08, 0.0), 0.12, z0_ - 0.1, top)
        ki.lattice_frame((0.15, -0.07), (pa - 0.05, -0.07), z0_ + 0.9, 1.3, rng)
        ki.lattice_frame((pb + 0.05, -0.07), (W - 0.15, -0.07), z0_ + 0.9, 1.3, rng)
        kc.sign_face((pa, -0.08), (pb, -0.08), z0_ + 1.55, z0_ + 2.2, "far_panel_2", rng)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 2.6, 1.1, rng, front=lattice_panel)
    # S2.bld.hall_behind_terrace_23380: a big tiled hall behind the terrace seen only as its roof: a long ridge, a
    # broad slope to an eave just above the terrace's roof, a hip at its west end, gables near its east end (a hip-gable
    # roof). choice: x 178.0-183.9 (its east end west of the eatery's back furniture), D 24.15-28.6 (its front just
    # behind the terrace's back), eave 3.4, ridge 2.0 higher, plain walls (unseen)
    eid = "S2.bld.hall_behind_terrace_23380"
    o, yaw, W, Dp = (178.0, 24.15), 0.0, 5.9, 4.45
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            for x, y in ((0.0, 0.0), (W, 0.0), (0.0, Dp), (W, Dp)):
                k.post("timber", True, x, y, -0.1, 3.4, 0.18, 0.02)
            for a, b in (((0.0, 0.0), (W, 0.0)), ((W, 0.0), (W, Dp)), ((W, Dp), (0.0, Dp)), ((0.0, Dp), (0.0, 0.0))):
                k.board("plaster", True, a, b, 0.14, -0.1, 3.35)
            k.beam("timber", False, (-0.12, -0.02, 3.3), (W + 0.12, -0.02, 3.3), 0.14, 0.18, 0.02)
            mark_rect(0.0, W, 0.0, Dp)
            roof_xieshan(-0.7, W + 0.7, -0.75, Dp + 0.6, 3.5, 5.5, NEAR, ornament=0.5)   # the kit's 歇山


def terrace(rng):
    # S2.bld.river_terrace_23250: the riverside dining terrace (kc.stilt_terrace): its floor level with the bank top
    # (the frame's `terrace floor` H 0), its front on stilts over the bank slope, a balustrade along the front, a
    # lattice-screened room at the west end, a two-tier roof, a gabled pavilion at the east end. choice: its back 0.45 m
    # north of the furthest thing painted on its floor (the placeholder back left its tables, chair and bundle outside);
    # the floor 6 cm over the bank top at its back; the stilts down to the built ground under each; the west room 1.8 m,
    # the pavilion 2.4 m; eave 2.8
    eid = "S2.bld.river_terrace_23250"
    sw, se, ne, nw = fp(eid)
    on = [(f["X"], f["D"]) for f in LAYOUT["figures"] if (f.get("support") or "").startswith("terrace floor")]
    on += [tuple(e["pos"][:2]) for e in E.values() if (e.get("support") or "").startswith("terrace floor")]
    yb = max([(nw[1] + ne[1]) / 2] + [q[1] + 0.45 for q in on])
    nw2 = (x_on(sw, nw, yb), yb)
    ne2 = (x_on(se, ne, yb), yb)
    zf = max(hz_at(*nw2), hz_at(*ne2), hz_at((nw2[0] + ne2[0]) / 2, yb)) + 0.06
    H["terrace_floor"] = zf
    with sb.entity(eid):
        top = kc.stilt_terrace(sw, se, ne2, nw2, zf, hz_at, rng, west_room=1.8, east_pavilion=2.4, rail_h=0.95,
                               eave=2.8, upper_gap=0.9, blind_east=True)
    H["terrace"] = (sw, se, ne2, nw2)
    # S2.str.landing_steps_22950: five or six rough steps of irregular slabs from the bank at the terrace's west end
    # down to the water, stones beside them. The top edge on the painted top (nw-ne at the bank top), the foot on the
    # built shore (under the water's H)
    eid = "S2.str.landing_steps_22950"
    sw, se, ne, nw = fp(eid)
    sh = RIVER["north_shore"]
    foot_a, foot_b = sw, se
    for i, p in enumerate((sw, se)):
        q = pt_on(sh, p[0])
        if q[1] < p[1] - 0.15:                    # the built shore further south (the river plan): run the steps on
            (foot_a, foot_b) = (q, foot_b) if i == 0 else (foot_a, (p[0], q[1]))
    with sb.entity(eid):
        kc.rough_steps(nw, ne, foot_a, foot_b, min(hz_at(*nw), hz_at(*ne)), RIVER["H"] - 0.25, rng, n=6, stones=True)
    # S2.str.panel_screen_23555: a low panelled wooden screen set at a slant from the pavilion toward the eatery, with
    # stacked boards behind it. choice: 1.0 m high (painted 55 px at the far-row scale)
    a, b = line("S2.str.panel_screen_23555", "base")[0], line("S2.str.panel_screen_23555", "base")[-1]
    z = min(hz_at(*a), hz_at(*b))
    with sb.entity("S2.str.panel_screen_23555"):
        kce.low_partition(a, b, z, 1.0, rng)
        t = V((b[0] - a[0], b[1] - a[1], 0)).normalized()
        n = V((-t.y, t.x, 0))
        for i, (h0, h1) in enumerate(((0.55, 1.25), (0.62, 1.32), (0.7, 1.38))):
            c = V((a[0], a[1], z)) + t * (0.15 + 0.18 * i) + n * (0.25 + 0.05 * i)
            k.board("timber", False, (c.x, c.y), (c.x + t.x * 0.42, c.y + t.y * 0.42), 0.04, z + h0 - 0.5, z + h1)


# ---------------------------------------------------------------- the eatery and the unloading yard (u 23500-24700)

def eatery(rng):
    # S2.bld.eatery_shelter_23750: a broad shelter of mats on slender posts over the open-air eatery's tables, open on
    # every side, a cloth hung under its back eave. Its posts where painted (u 23599, foot v 389; u 23752, foot v 417;
    # the east post u 23943, foot v 367), moved clear of the painted benches and tables; back posts (hidden) choice.
    # choice: eaves 2.45 (front) and 2.65 (back) (painted 1.66 at the far-row scale)
    eid = "S2.bld.eatery_shelter_23750"
    corners = [(185.25, 22.85), (189.3, 22.35), (189.0, 25.15), (184.95, 25.25)]
    posts = [(ux(23599, 22.95), 22.95), (ux(23752, 22.4), 22.4), (ux(23943, 23.4), 23.4), (188.75, 25.05), (185.05, 25.2)]
    near = things_near(corners[0], 0.0, 5.0, 3.5)
    fixed = []
    for p in posts:
        q = clear_posts(p, 0.0, [0.0], 0.0, near, r=0.5)
        if q:
            fixed.append((p[0] + q[0], p[1], 0.0))
    z0 = min(hz_at(*c) for c in corners)
    with sb.entity(eid):
        k2.open_mat_shed(corners, z0, 2.45, 2.65, rng, posts=fixed, over=0.3, post_r=0.06)
        x = ux(23862, 25.1)
        k.board("cloth_white", False, (x - 0.2, 25.12), (x + 0.2, 25.12), 0.02, z0 + 1.85, z0 + 2.55)
    # S2.bld.house_behind_eatery_23855: a small house behind the shelter: a lattice window and a light doorway under a
    # tiled eave; a jar stands just inside the doorway. choice: x 184.9-186.45 (1.55 m: the window and the doorway), 3.2 m
    # deep, eave 2.5, gable 1.2; the room behind the jar closed by an invisible board
    eid = "S2.bld.house_behind_eatery_23855"
    o, yaw, W, Dp = (184.9, 27.18), 0.0, 1.55, 3.2
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            shop(W, Dp, 0.0, 2.5, 1.2, [0.0, 0.72, W], ["window", "open"], rng, detail=MID, sill=0.06)
            k.board("hidden", True, (0.72, 0.62), (W, 0.62), 0.06, 0.0, 2.3)
    # S2.bld.open_shop_24020: a shop open on its front between slender posts and lattice partitions, a mat pent roof
    # under its tiled roof, a round sieve hung on its back wall. Posts at the painted u (23908-24160). choice: 3.6 m
    # deep (its back beyond the silk), eave 3.0, gable 1.4, the mat pent at 2.2-2.5
    eid = "S2.bld.open_shop_24020"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.6
    z0 = z_under(o, yaw, W, Dp)
    cols = [0.0] + [lx_u(o, yaw, u, 26.78) for u in (24001, 24040, 24107)] + [W]
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 3.0, 1.4, cols, ["open", "open", "open", "open"], rng, detail=MID, sill=0.06,
                       ornament=0.35)
            for a, b in ((cols[1], cols[2]), (cols[3], cols[4])):
                ki.lattice_frame((a + 0.06, -0.02), (b - 0.06, -0.02), 0.05, 1.95, rng)
                k.board("hidden", True, (a, 0.05), (b, 0.05), 0.05, 0.0, 2.0)
            ki.lean_to(-0.2, W + 0.2, -0.85, 0.02, 2.2, 2.5, mat="reed", ns=4, nt=2, rafters=False)
            xs = lx_u(o, yaw, 24063, 26.8)
            sb.cyl("reed", False, (xs, Dp - 0.08, 1.65), (xs, Dp - 0.12, 1.65), 0.21, segs=10)
            sb.cyl("timber", False, (xs, Dp - 0.07, 1.65), (xs, Dp - 0.13, 1.65), 0.23, 0.23, segs=10, caps=False)
    # S2.bld.open_shop_24300: a second open-fronted shop east of the first, its own roof and posts and lattice panels.
    # choice: on its painted depth (1.85 m: the shop behind the cart stands right behind it), eave 2.7, gable 1.2
    eid = "S2.bld.open_shop_24300"
    o, yaw, W, Dp = front_frame(eid)
    Dp = 1.85
    z0 = z_under(o, yaw, W, Dp)
    cols = [0.0] + [lx_u(o, yaw, u, 26.8) for u in (24190, 24248)] + [W]
    with sb.entity(eid):
        with placed(o, yaw, z0):
            shop(W, Dp, 0.0, 2.7, 1.2, cols, ["open", "open", "open"], rng, detail=MID, sill=0.06, front_over=0.7,
                 back_over=0.3)
            xl = lx_u(o, yaw, 24274, 26.8)
            ki.lattice_frame((xl + 0.05, -0.02), (W - 0.06, -0.02), 1.0, 1.3, rng)
    # S2.bld.shop_behind_cart_24525: a small building at the very top of the silk behind the cart: corner posts, a
    # lattice band under its eave, a light panel. choice: 2.6 m deep (beyond the silk), eave 2.5, gable 1.1
    eid = "S2.bld.shop_behind_cart_24525"
    o, yaw, W, _ = front_frame(eid)
    Dp = 2.6
    z0 = z_under(o, yaw, W, Dp)

    def band_front(z0_, top):
        k.board("plaster", True, (0.08, 0.0), (W - 0.08, 0.0), 0.12, z0_ - 0.1, top)
        ki.lattice_frame((0.12, -0.07), (W - 0.12, -0.07), top - 0.85, 0.7, rng)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 2.5, 1.1, rng, front=band_front)
    # S2.prop.pole_stack_24680: a dense stack of long poles standing upright and leaning together, its top rounded.
    # choice: 4.2 m (its top arches near the silk's top edge), 0.45 m radius
    x, y = P("S2.prop.pole_stack_24680")
    with sb.entity("S2.prop.pole_stack_24680"):
        kc.pole_stack(x, y, hz_at(x, y), rng, r=0.45, h=4.2)


# ---------------------------------------------------------------- the scaffold house, the halls and the warehouse (u 24700-26600)

def halls(rng):
    # S2.bld.scaffold_house_24975: a long plain plastered front wall (no door or window painted) under a scalloped
    # valance and a bracket frieze; a hip-gable roof with a small hip-gable west end and a light gable facing the river in
    # its east half (a lattice board under it), a ridge-end ornament (鸱尾) at the main ridge's west end; a great
    # scaffold of lashed poles on the ridge, its tips sharpened, rising east; a long pole out west from its foot with a
    # banner of three dark stripes; a big curved mat awning sweeping out from the wall's west end over the stall, on a
    # post at the corner. choice: squared to its painted front (posts u 24745 and 25210); 3.0 m deep, so the head painted
    # over its roof (S2.fig.head_over_roof_e_24867) stands behind it; eave 3.0, ridge 2.0 higher; the cross gable over
    # x 3.4-5.6; the scaffold's poles 3.4-4.4 m over the ridge, tips rising east (painted crown slope -0.23)
    eid = "S2.bld.scaffold_house_24975"
    sw, se, ne, nw = fp(eid)
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.0
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 3.0, 2.0, [0.0, W], ["wall"], rng, roof_kind="xieshan", detail=MID, ornament=0.55,
                       sill=0.1, front_over=0.8, back_over=0.5, side_over=0.2, interior=False)
            kc.scalloped_valance((0.1, -0.16), (W - 0.1, -0.16), top - 0.18, rng)
            for x in (0.6, W * 0.5, W - 0.6):
                k.bracket(x, -0.02, top - 0.32, (0, -1), s=0.42, mat="timber")
            # the cross gable facing the river over the east half, a lattice board under its apex
            gx0, gx1 = W * 0.55, W * 0.92
            zr = top + 0.1
            roof_y(gx0, gx1, -0.85, Dp * 0.5, zr + 0.05, zr + 1.75, "gable", MID, over=0.25)
            gable_tri_y(-0.3, gx0 + 0.05, gx1 - 0.05, zr + 0.05, zr + 1.55)
            ki.lattice_frame((gx0 + 0.6, -0.36), (gx1 - 0.6, -0.36), zr + 0.15, 0.38, rng)
            # the pole scaffold on the ridge (no ornaments: none are painted), the sharpened tips rising east
            zf = zr + 1.9
            poles = [(t, zf + 3.4 + 1.0 * t + rng.uniform(-0.15, 0.15)) for t in (0.0, 0.14, 0.28, 0.43, 0.57, 0.71, 0.86, 1.0)]
            bars = [(0.0, zf + 1.1, 1.0, zf + 1.3), (0.0, zf + 2.2, 1.0, zf + 2.55), (0.1, zf + 0.4, 0.5, zf + 2.1),
                    (0.55, zf + 0.5, 0.95, zf + 2.4)]
            ki.pole_scaffold((W * 0.12, Dp * 0.5), (W * 0.95, Dp * 0.5), poles, rng, bars=bars, z_foot=zf - 0.4,
                             ornaments=0)
            # the long pole out west from the scaffold's foot, the striped banner hanging from it
            ko.striped_banner((W * 0.14, Dp * 0.5, zf - 0.4), 1.1, (-1.0, 0.0), rng, cloth_w=1.05, cloth_h=1.25,
                              stripes=7, arm_rise=4.0, bar_drop=0.15)
            # the swept mat awning from the wall's west end over the stall, on its post at the corner
            kc.swept_awning((0.0, Dp * 0.85), (0.0, 0.0), 2.3, 2.45, 0.85, rng, post=False, mat="reed")
            tpost(-0.05, -0.05, 0.0, 2.5, r=0.07)
    # S2.bld.tall_rear_hall_25330: a tall tiled roof rising behind the open shop and the scaffold house to a round finial
    # on a short pedestal at its peak; a long paddle-shaped thing lies on its east hip. Only the roof is painted.
    # choice: x 202.9-208.4, D 24.1-27.3 (between the open shop's back and the far street, where the far street's people
    # stand), eave 3.6, hip roof 2.6 high nearly to a point, plain walls
    eid = "S2.bld.tall_rear_hall_25330"
    o, yaw, W, Dp = (202.9, 24.1), 0.0, 5.5, 3.2
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 3.6, 2.7, rng, roof_kind="hip", front_over=0.7)
            zt = 3.6 + 0.08 + 2.7
            sb.lathe("stone", False, (W / 2, Dp / 2, zt), [(0.16, 0.0), (0.14, 0.18), (0.18, 0.22), (0.2, 0.36),
                                                         (0.14, 0.5), (0.02, 0.56)], segs=10)
            k.beam("timber", False, (W / 2 + 0.5, Dp / 2 - 0.2, zt - 0.25), (W / 2 + 1.6, Dp / 2 - 0.4, zt - 1.1),
                   0.16, 0.05, 0.01)                                   # the paddle on its east hip
    # S2.bld.open_shop_25340: a shop open to the bank under a low tiled front roof with a heavy eave beam: a stepped
    # rack of goods, the shopkeeper, a dark curtain drawn up into a swag at its east end, two small things hung from a
    # beam in its west bay. Its narrow signboard at the west end is the one board S2.prop.signboard_pole_25235 hangs on
    # its pole (the map records the board and pole there): built once, under the prop.
    # choice: squared to its painted front, 3.3 m deep (the tall rear hall behind it), eave 2.6 (painted 2.48), gable 1.3
    eid = "S2.bld.open_shop_25340"
    sw, se, ne, nw = fp(eid)
    o, yaw = sw, 0.0
    W, Dp = se[0] - sw[0], 3.3
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 2.6, 1.3, [0.0, W], ["open"], rng, detail=MID, sill=0.06, side=("none", "wall"),
                       front_over=0.8)
            k.beam("timber", True, (-0.1, -0.05, top - 0.3), (W + 0.1, -0.05, top - 0.3), 0.2, 0.3, 0.04)  # eave beam
            xa, xb = lx_u(o, yaw, 25385, 20.7), lx_u(o, yaw, 25453, 20.7)
            kc.swag_curtain((xa - 0.3, -0.1), (min(W - 0.05, xb + 0.2), -0.1), top - 0.45, 1.25, rng, swag_end=1)
            for i, xh in enumerate((lx_u(o, yaw, 25281, 20.8), lx_u(o, yaw, 25298, 20.8))):
                sb.cyl("rope", False, (xh, 0.6, top - 0.3), (xh, 0.6, top - 0.6), 0.008, segs=4)
                k.rock("interior" if i else "meat", xh, 0.6, top - 0.75, 0.09, rng, flat=1.5)
            k.board("interior", True, (0.1, Dp - 0.1), (W - 0.1, Dp - 0.1), 0.04, 0.0, top - 0.1)   # the dark back
    # S2.bld.yanhe_yazuo_hall_25690: 沿河雅座: a long hall whose room is raised above the bank (the frame's upper floor,
    # H 1.3): a row of big open windows, a lattice skirt of patterned panels under the sill, posts below standing on the
    # bank with a plank band between them; one huge tiled roof running on east over the warehouse. choice: x from the open
    # shop's east wall (211.2) to its painted east end, 6.5 m deep, the room 2.7 m high over its floor (eave 4.1), gable
    # roof 2.2 high; the open windows 1.4 m from the sill; the room closed (nobody reaches it: its people are painted
    # inside)
    eid = "S2.bld.yanhe_yazuo_hall_25690"
    sw, se, ne, nw = fp(eid)
    o, yaw = (211.2, sw[1]), 0.0
    W, Dp = se[0] - 211.2, 6.5
    z0 = z_under(o, yaw, W, Dp)
    zf = 1.3
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = zf + 2.7
            wx = [lx_u(o, yaw, u, 19.51) for u in (25498, 25695, 25742, 25857)]
            cols = [0.0] + [x for x in wx if 0.3 < x < W - 0.3] + [W]
            for x in cols:
                tpost(x, 0.0, 0.0, top, r=0.1, base=True)
            for x in (0.0, W):
                tpost(x, Dp, 0.0, top, r=0.1)
            # under the sill: a plank band on the ground, the lattice skirt above it, the sill beam
            k.board("deck", True, (0.0, 0.02), (W, 0.02), 0.08, -0.08, 0.42)
            k.board("plaster", True, (0.05, 0.03), (W - 0.05, 0.03), 0.06, 0.4, zf - 0.04)
            for a, b in zip(cols, cols[1:]):                       # the lattice skirt: patterned panels per bay
                ki.lattice_frame((a + 0.12, -0.03), (b - 0.12, -0.03), 0.45, zf - 0.55, rng)
            k.beam("timber", True, (-0.1, -0.06, zf - 0.04), (W + 0.1, -0.06, zf - 0.04), 0.16, 0.12, 0.02)
            ki.floor_slab(0.05, W - 0.05, 0.05, Dp - 0.05, zf, rng, thick=0.22, front="y0", strip=1.2)
            # the open windows: sill wall under them is the skirt; a head band, open sashes propped up
            for a, b in zip(cols, cols[1:]):
                k.board("plaster", False, (a + 0.1, 0.0), (b - 0.1, 0.0), 0.12, zf + 1.45, top - 0.1)
                if b - a > 0.6:
                    k.beam("timber", False, (a + 0.12, -0.03, zf + 1.45), (b - 0.12, -0.03, zf + 1.45), 0.06, 0.08, 0.01)
                    k.board("lattice", False, (a + 0.12, -0.25), (b - 0.12, -0.25), 0.03, zf + 1.48, zf + 1.85)
            k.board("plaster", True, (0.0, 0.08), (0.0, Dp - 0.05), 0.14, -0.1, top)
            k.board("plaster", True, (W, 0.08), (W, Dp - 0.05), 0.14, -0.1, top)
            k.board("plaster", True, (W - 0.05, Dp), (0.05, Dp), 0.14, -0.1, top)
            k.board("interior", True, (0.1, Dp - 0.12), (W - 0.1, Dp - 0.12), 0.03, zf, top - 0.1)
            k.beam("timber", True, (-0.12, 0.0, top - 0.08), (W + 0.12, 0.0, top - 0.08), 0.16, 0.22, 0.03)
            mark_rect(0.0, W, 0.35, Dp)
            roof(0.0, W, -0.85, Dp + 0.55, top + 0.1, top + 2.3, "gable", MID, over=0.0, ornament=0.0)
            gable_tri(0.0, -0.1, Dp + 0.1, top, top + 2.1)
    H["yanhe"] = (o, W, Dp, z0 + zf)
    # S2.bld.warehouse_26070: a closed front of three bays of full-height lattice doors between plain posts under an
    # eave with round tile ends, on a raised platform faced with horizontal planks with capped posts along its face (the
    # bay posts carried down: kc.plank_platform); the roof running on from 沿河雅座's. choice: its east end at the
    # white-walled house's west wall (225.45), 5.0 m deep, the platform 0.9 m (painted 70 px), the doors 2.3 m, eave 3.5
    # over the ground, its own gable roof with its ridge as high as 沿河雅座's (one long roof, as painted, but two
    # slopes: the two fronts stand 1.2 m apart)
    eid = "S2.bld.warehouse_26070"
    sw, se, ne, nw = fp(eid)
    o, yaw = sw, 0.0
    W, Dp = 225.45 - sw[0], 5.0
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            zp = kc.plank_platform((0.0, 0.0), (W, 0.0), Dp, 0.0, 0.9, rng, caps=4)
            zp = zp if isinstance(zp, (int, float)) else 0.9
            top = 3.5
            bx_ = [0.0] + [lx_u(o, yaw, u, 18.4) for u in (26022, 26130)] + [W]
            for x in bx_:
                tpost(x, 0.15, zp, top, r=0.11)
            for x in (0.0, W):
                tpost(x, Dp, zp, top, r=0.11)
            for a, b in zip(bx_, bx_[1:]):
                n = 4
                for i in range(n):
                    xa, xb = a + 0.1 + (b - a - 0.2) * i / n, a + 0.1 + (b - a - 0.2) * (i + 1) / n
                    ki.lattice_frame((xa + 0.02, 0.12), (xb - 0.02, 0.12), zp, 2.3, rng)
                k.board("plaster", False, (a + 0.1, 0.15), (b - 0.1, 0.15), 0.12, zp + 2.3, top - 0.1)
            k.board("interior", True, (0.1, 0.25), (W - 0.1, 0.25), 0.04, zp, zp + 2.35)
            k.board("plaster", True, (0.0, 0.2), (0.0, Dp - 0.05), 0.14, zp - 0.05, top)
            k.board("plaster", True, (W - 0.05, Dp), (0.05, Dp), 0.14, zp - 0.05, top)
            k.beam("timber", False, (-0.12, 0.15, top - 0.08), (W + 0.12, 0.15, top - 0.08), 0.16, 0.22, 0.03)
            for i in range(int(W / 0.32)):                         # the row of round tile ends under the eave
                x = 0.1 + i * 0.32
                sb.cyl("roof", False, (x, -0.92, top + 0.18), (x, -0.98, top + 0.17), 0.075, segs=6)
            mark_rect(0.0, W, 0.3, Dp)
            # its own gable roof, its ridge as high as 沿河雅座's (the painted roof runs on without a break)
            zr_ = H["yanhe"][3] - z0 + 2.7 + 0.1 + 2.2
            zr_ = max(top + 1.8, min(zr_, top + 2.5))
            roof(-0.05, W, -0.95, Dp + 0.5, top + 0.12, zr_, "gable", MID, over=0.0)
            gable_tri(W, -0.1, Dp + 0.1, top, zr_ - 0.2)
    # S2.bld.white_wall_house_26330: a plain white plastered front wall and a hipped tiled roof with round tile ends at
    # the eave; its east end under the great willow's whips. No door or writing painted. choice: squared to its painted
    # front, 4.5 m deep, wall 3.1 (painted 150 px), hip 1.9 high
    eid = "S2.bld.white_wall_house_26330"
    sw, se, ne, nw = fp(eid)
    o, yaw, W, _ = front_frame(eid)
    Dp = 4.5
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 3.1, 1.9, [0.0, W], ["wall"], rng, roof_kind="hip", detail=MID, sill=0.1,
                       front_over=0.8, ornament=0.45, interior=False)
            for i in range(int(W / 0.32)):
                x = 0.1 + i * 0.32
                sb.cyl("roof", False, (x, -0.78, top + 0.12), (x, -0.84, top + 0.11), 0.075, segs=6)


# ---------------------------------------------------------------- the far street at the top of the silk (u 24600-26900)

def far_street(rng):
    """Small sheds along the far street behind the halls, painted at about 0.6 of the bank's size: real heights on
    their painted frontages, squared to their painted fronts, backs beyond the silk's top edge (choices), coarse
    roofs. Their posts stand where painted, moved along the front (at most 0.45 m) clear of the people and the
    furniture painted at them."""
    # S2.bld.far_shed_25785: a small open shed, a tiled roof on four or five posts, tables and a trestle under it.
    # choice: 2.6 m deep, eave 2.4, gable 1.0, a plain back wall
    eid = "S2.bld.far_shed_25785"
    o, yaw, W, _ = front_frame(eid, yaw=0.0)
    Dp = 2.6
    z0 = z_under(o, yaw, W, Dp)
    xs = clear_posts(o, yaw, [0.0] + [lx_u(o, yaw, u, 27.8) for u in (25735, 25822)] + [W], 0.0,
                     things_near(o, yaw, W, Dp))
    with sb.entity(eid):
        with placed(o, yaw, z0):
            open_shed(W, Dp, 0.0, 2.4, 2.4, xs, rng, rise=1.0, back_wall=True)
    # S2.bld.far_long_shed_26260: a long open shed on posts, a plain light back wall in its middle; under it a stall
    # table with goods, a donkey at its west end, people and a table at its east end. choice: 2.6 m deep, eave 2.4,
    # gable 1.1, its back wall run its whole length (behind it nothing is painted)
    eid = "S2.bld.far_long_shed_26260"
    o, yaw, W, _ = front_frame(eid)
    Dp = 2.6
    z0 = z_under(o, yaw, W, Dp)
    xs = clear_posts(o, yaw, [0.0] + [lx_u(o, yaw, u, 27.63) for u in (26205, 26315, 26381)] + [W], 0.0,
                     things_near(o, yaw, W, Dp))
    with sb.entity(eid):
        with placed(o, yaw, z0):
            open_shed(W, Dp, 0.0, 2.4, 2.4, xs, rng, back_posts=[0.0, W / 2, W], rise=1.1, back_wall=True)
    # S2.bld.mat_hut_26515: a hut whose front is a screen of close vertical slats, at its east end a doorway of two
    # posts and a lintel opening on a light plastered wall; its roof hidden by the willow. choice: 2.8 m deep, walls
    # 2.2, a low reed-mat gable roof (0.8 high)
    eid = "S2.bld.mat_hut_26515"
    o, yaw, W, _ = front_frame(eid)
    Dp = 2.8
    z0 = z_under(o, yaw, W, Dp)
    xd0, xd1 = lx_u(o, yaw, 26536, 27.4), lx_u(o, yaw, 26584, 27.4)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            ki.slat_fence((0.0, 0.0), (xd0, 0.0), 2.15, rng, slat=0.06, mat="reed")
            k.board("plaster", True, (0.05, 0.12), (xd0, 0.12), 0.08, -0.1, 2.15)
            ko.gate_frame((xd0, 0.0), (xd1, 0.0), 2.0, rng, jamb=0.11, threshold=True, mat="timber")
            k.board("plaster", True, (xd0, 0.35), (xd1, 0.35), 0.1, -0.1, 2.2)      # the light wall behind the door
            k.board("reed", True, (xd1 + 0.1, 0.0), (W, 0.0), 0.08, -0.1, 2.2)
            for a, b in (((W, 0.0), (W, Dp)), ((W, Dp), (0.0, Dp)), ((0.0, Dp), (0.0, 0.0))):
                k.board("plaster", True, a, b, 0.1, -0.1, 2.2)
            mark_rect(0.0, W, 0.2, Dp)
            roof(0.0, W, -0.5, Dp + 0.4, 2.25, 3.05, "gable", FAR, over=0.3, mat="reed")
            for x in (0.0, W):
                gable_tri(x, 0.0, Dp, 2.2, 2.95, mat="reed")
    # S2.bld.open_shed_26755: a small open frame of posts and beams under the willow's whips (its roof, if any, is
    # hidden by them, so none is built): three posts at the front, two behind, cross-beams at three levels.
    # choice: 2.3 m posts, beams at 1.1, 1.65 and 2.2 m
    eid = "S2.bld.open_shed_26755"
    o, yaw, W, Dp = front_frame(eid, yaw=0.0)
    z0 = z_under(o, yaw, W, Dp)
    xs = [lx_u(o, yaw, u, 27.94) for u in (26721, 26745, 26786)]
    with sb.entity(eid):
        with placed(o, yaw, z0):
            for x in xs:
                tpost(x, 0.0, 0.0, 2.3, r=0.06)
            for x in (xs[0], xs[-1]):
                tpost(x, Dp, 0.0, 2.3, r=0.06)
            for z in (1.1, 1.65, 2.2):
                k.beam("timber", False, (xs[0] - 0.12, 0.0, z), (xs[-1] + 0.12, 0.0, z), 0.07, 0.08, 0.01)
            for x in (xs[0], xs[-1]):
                k.beam("timber", False, (x, -0.1, 2.2), (x, Dp + 0.1, 2.2), 0.07, 0.08, 0.01)


# ---------------------------------------------------------------- 王家纸马铺 and the yard east of it (u 26900-27700)

def paper_shop(rng):
    # S2.bld.wang_paper_horse_shop_27100: a long single-storey shop open along its whole front under a tiled roof with
    # a heavy eave beam, its shelves and counters stacked with paper goods; a light side wall at its east end, a rounded
    # hip at its west end. On its painted front (posts u 26920-27281). choice: eave 2.9 (painted 1.32 at the far-row
    # scale), a hip-gable roof 1.7 high, 3.6 m deep (its back beyond the silk); inside, a counter along the front 0.55 m
    # in, shelves on the back wall (paper goods from the inner city kit: stacked packets, paper models)
    eid = "S2.bld.wang_paper_horse_shop_27100"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.6
    z0 = z_under(o, yaw, W, Dp)
    cols = sorted({0.0, W} | {round(lx_u(o, yaw, u, 26.6), 3) for u in (26980, 27050, 27120, 27175)})
    with sb.entity(eid):
        with placed(o, yaw, z0):
            top = shop(W, Dp, 0.0, 2.9, 1.7, cols, ["open"] * (len(cols) - 1), rng, roof_kind="xieshan", detail=MID,
                       sill=0.12, side=("wall", "wall"), ornament=0.5, front_over=0.85)
            k.beam("timber", True, (-0.15, -0.06, top - 0.32), (W + 0.15, -0.06, top - 0.32), 0.22, 0.32, 0.04)
            k.board("interior", True, (0.12, Dp - 0.12), (W - 0.12, Dp - 0.12), 0.03, 0.05, top - 0.15)
            # the counters along the front (gaps at the doors), heaped with paper goods
            for a, b in ((0.35, cols[2] - 0.15), (cols[2] + 0.75, cols[4] - 0.15), (cols[4] + 0.75, W - 0.35)):
                if b - a < 0.6:
                    continue
                ki.counter((b, 0.55), (a, 0.55), 0.05, 0.85, 0.5, rng)
                ki.goods_heap((a + b) / 2, 0.8, 0.9, b - a - 0.2, 0.36, rng, n=int((b - a) * 5), mat="cloth_white",
                              s=0.08, high=0.1)
            # shelves on the back wall, stacked with packets and paper models
            for zz in (0.95, 1.6):
                k.beam("timber", False, (0.3, Dp - 0.38, zz), (W - 0.3, Dp - 0.38, zz), 0.42, 0.04, 0.0)
            for i in range(5):
                x = 0.9 + i * (W - 1.8) / 4
                ki.box_stack(x, Dp - 0.38, 0.99, 2, 0.34, 0.26, 0.16, rng, mat="cloth_white")
                ki.paper_figure(x + 0.35, Dp - 0.4, 1.64, 0.55, rng)
            ki.paper_tower(W * 0.33, Dp - 0.4, 0.05, 1.2, rng)
            ki.paper_tower(W * 0.71, Dp - 0.4, 0.05, 1.1, rng)
            # the dark slanting strut over the sign at the west end
            k.beam("timber", False, (-0.15, -0.6, top + 0.15), (0.35, -0.2, top + 0.55), 0.07, 0.07, 0.01)
    # S2.bld.low_shed_27245: a low tiled roof with a small gable at its east end (a post under it), behind the big
    # eating shed; a porter walks behind it. choice: D 21.95-23.45 (its back south of the porter), eave 2.3, gable 0.9
    eid = "S2.bld.low_shed_27245"
    sw, se, ne, nw = fp(eid)
    o, yaw, W, Dp = (sw[0], 21.95), 0.0, se[0] - sw[0], 1.5
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 2.3, 0.9, rng, front_over=0.45)
            k.post("timber", False, W + 0.05, Dp / 2, 2.3, 3.1, 0.1, 0.01)
    # S2.bld.top_long_house_27560: a long tiled roof at the top running down east behind the pole frame. choice: on its
    # painted front (falling east, as painted), 3.5 m deep, eave 2.9, gable 1.5, plain walls (only roofs show)
    eid = "S2.bld.top_long_house_27560"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.5
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 2.9, 1.5, rng, front_over=0.7)
    # S2.bld.eating_shed_west_27300 (喝杯小酒): a big open eating shed under a huge tiled roof whose eave runs down
    # to the east; under its front a flat woven-mat awning on posts with a diagonal stay; tables and benches under it.
    # On its painted front (falling east). choice: its east end 0.9 m short of the painted corner (the man behind the tub
    # stands at the next shed's post); the hall's open front 1.7 m behind the awning's posts, its back wall at 5.35 m
    # (south of the low shed), eave 3.2, hip roof 2.0 high; the awning 2.25-2.55 from 1.5 m in front of the painted
    # front to the hall's eave, on posts where painted (u 27070, 27125, 27283, 27368) and two stays
    eid = "S2.bld.eating_shed_west_27300"
    o, yaw, W, _ = front_frame(eid)
    W = W - 0.9
    Dp = 5.35
    z0 = z_under(o, yaw, W, Dp)
    near = things_near(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            yh = 1.7
            cols = clear_posts(o, yaw, [0.0, W * 0.25, W * 0.5, W * 0.75, W], yh, near)
            for x in cols:
                tpost(x, yh, 0.0, 3.2, r=0.1, base=True)
            for x in (0.0, W):
                tpost(x, Dp, 0.0, 3.2, r=0.1)
            k.board("plaster", True, (0.0, yh + 0.1), (0.0, Dp - 0.05), 0.14, -0.1, 3.2)
            k.board("plaster", True, (W, yh + 0.1), (W, Dp - 0.05), 0.14, -0.1, 3.2)
            k.board("plaster", True, (W - 0.05, Dp), (0.05, Dp), 0.14, -0.1, 3.2)
            k.board("interior", True, (0.1, Dp - 0.12), (W - 0.1, Dp - 0.12), 0.03, 0.0, 3.0)
            k.beam("timber", True, (-0.12, yh, 3.12), (W + 0.12, yh, 3.12), 0.15, 0.2, 0.03)
            roof(-0.5, W + 0.5, yh - 0.7, Dp + 0.55, 3.3, 5.3, "hip", MID, ornament=0.5)
            # the flat mat awning on posts and two stays
            ki.mat_roof([(0.0, -1.5, 2.25), (W, -1.5, 2.25), (W, yh - 0.25, 2.55), (0.0, yh - 0.25, 2.55)], 0, rng,
                        mat="reed", sag=0.04)
            aps = [local_of(o, yaw, (ux(u, 16.3), 16.3))[0] for u in (27070, 27125, 27283, 27368)]
            for x in clear_posts(o, yaw, [x for x in aps if 0.2 < x < W - 0.2], 0.35, near, r=0.35):
                tpost(x, 0.35, 0.0, 2.45, r=0.06)
            for x in (W * 0.3, W * 0.62):
                sb.cyl("bamboo", False, (x, -1.45, 2.24), (x + 0.15, 0.1, 0.0), 0.04, 0.035, segs=6)
    # S2.str.jetty_27260: a raised plank walkway along the top of the bank in front of the eating shed, its posts on the
    # bank slope, a river-facing fascia of short slats (kc.jetty). choice: the deck 0.12 m over the bank top at its land
    # side (the painted top line read as the rail: the deck about 40 px lower, at street level), so walkers step on
    eid = "S2.str.jetty_27260"
    sw, se, ne, nw = fp(eid)
    zd = max(hz_at(*nw), hz_at(*ne), 0.0) + 0.12
    with sb.entity(eid):
        kc.jetty(sw, se, ne, nw, zd, hz_at, rng, posts=4, rail_h=0.6)
    H["jetty_deck"] = zd


def yard_frames(rng):
    # S2.prop.pole_frame_27490: a tall open framework of long poles in the yard east of the paper shop: a big A-frame of
    # two railed ladders leaning together at the west (apex u 27415), tall poles crossing near the eaves, long beams
    # laid across them, a cross-braced A-frame at the east (apex u 27598); no roof. choice: apexes 4.2 and 4.0 m (painted
    # 2.1 and 1.9 at the far-row scale), beams at 3.2 and 1.5 m, its north legs 0.5 m behind its front ones
    eid = "S2.prop.pole_frame_27490"
    sw, se = pt(eid, "sw")[:2], pt(eid, "se")[:2]
    yf = (sw[1] + se[1]) / 2
    xw, xe = ux(27415, yf), ux(27598, yf)
    z = min(hz_at(*sw), hz_at(*se))
    with sb.entity(eid):
        kc.a_frame((xw - 1.3, yf - 0.1, z), (xw + 1.3, yf + 0.1, z), (xw, yf + 0.25, z + 4.2), rng, ladders=True)
        kc.a_frame((xe - 1.2, yf - 0.1, z), (xe + 1.2, yf + 0.1, z), (xe, yf + 0.25, z + 4.0), rng, brace=0.42)
        for (xa, xb, lean) in ((xw + 1.0, xw + 2.2, 0.5), (xw + 2.6, xw + 1.6, 0.45), (xe - 1.6, xe - 0.4, 0.5)):
            kc.pole((xa, yf + 0.5, z), (xb, yf + 0.5 - lean, z + 4.6), rng, r=0.055)
        x0, x1 = min(sw[0], xw - 1.5), max(se[0], xe + 1.3)
        kc.pole((x0, yf + 0.3, z + 3.2), (x1, yf + 0.3, z + 3.15), rng, r=0.06)
        kc.pole((x0 + 0.4, yf + 0.25, z + 1.5), (x1 - 0.2, yf + 0.25, z + 1.5), rng, r=0.06)
    # S2.prop.trestle_board_27310: a small A-frame trestle of poles with a long curved slatted board across it, sloping
    # down west. choice: trestle 1.1 m, board 1.6 m
    x, y = P("S2.prop.trestle_board_27310")
    z = hz_at(x, y)
    with sb.entity("S2.prop.trestle_board_27310"):
        kc.a_frame((x - 0.35, y - 0.25, z), (x + 0.35, y + 0.25, z), (x, y, z + 1.1), rng, r=0.035)
        for i in range(5):
            dy = -0.2 + i * 0.1
            k.beam("timber", False, (x - 0.9, y + dy, z + 0.75), (x + 0.75, y + dy, z + 1.2), 0.08, 0.025, 0)
        k.beam("timber", False, (x - 0.7, y - 0.26, z + 0.82), (x - 0.7, y + 0.26, z + 0.82), 0.04, 0.04, 0)
        k.beam("timber", False, (x + 0.55, y - 0.26, z + 1.16), (x + 0.55, y + 0.26, z + 1.16), 0.04, 0.04, 0)
    # S2.prop.low_stand_27500: a low box-like stand on short legs under the pole frame. choice: 0.9 x 0.45 x 0.5 m
    x, y = P("S2.prop.low_stand_27500")
    with sb.entity("S2.prop.low_stand_27500"):
        kce.braced_stand((x - 0.45, y), (x + 0.45, y), hz_at(x, y), 0.5, 0.45, rng)
    # S2.str.railed_stair_27630: a railing of close balusters slanting down east from the pole frame's east end to the
    # tiled shed's west gable posts, a lower rail on posts (the rail of a stair, ramp or raised gallery; only the
    # railing is painted). choice: 0.9 m from its top end, 0.95 m high at u 27560 falling to the ground at u 27690
    eid = "S2.str.railed_stair_27630"
    sw, se = pt(eid, "sw")[:2], pt(eid, "se")[:2]
    a = (ux(27560, sw[1]), sw[1])
    b = (ux(27690, se[1]), se[1])
    with sb.entity(eid):
        kc.sloped_balustrade((a[0], a[1], hz_at(*a) + 0.95), (b[0], b[1], hz_at(*b) + 0.05), rng, h=0.9)


# ---------------------------------------------------------------- the east wharf sheds, the 望火楼 (u 27500-29050)

def east_wharf(rng):
    # S2.bld.lower_shed_27780: an open eating shed: a front gable over its middle, a low front roof and a flat mat
    # awning on posts to its capped east front post (u 27990); at the back a long counter beam with slatted blinds and
    # two dark cloths hung on the back rail. On its painted front. choice: 3.7 m deep (the porters' path behind it), the
    # gable over x 0.6-4.4 (apex u 27697) eave 2.5, ridge 4.1; the low front roof 2.2-2.5; the awning 2.35-2.6; the back
    # beam at 2.25 with blinds to 1.35
    eid = "S2.bld.lower_shed_27780"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.7
    z0 = z_under(o, yaw, W, Dp)
    near = things_near(o, yaw, W, Dp)
    xg = lx_u(o, yaw, 27697, 14.3)
    gx0, gx1 = max(0.3, xg - 1.9), xg + 1.9
    with sb.entity(eid):
        with placed(o, yaw, z0):
            fx = clear_posts(o, yaw, [0.0, gx0, gx1, (gx1 + W) / 2, W - 0.02], 0.0, near)
            for x in fx:
                tpost(x, 0.0, 0.0, 2.35, r=0.075, base=True)
            k.post("timber", False, W - 0.02, 0.0, 2.35, 2.47, 0.2, 0.03)               # the capped east post
            for x in (0.0, gx1, W):
                tpost(x, Dp, 0.0, 2.6, r=0.075)
            k.beam("timber", False, (-0.1, 0.0, 2.3), (W + 0.1, 0.0, 2.3), 0.1, 0.12, 0.015)
            k.beam("timber", False, (-0.1, Dp, 2.25), (W + 0.1, Dp, 2.25), 0.12, 0.14, 0.015)   # the counter beam
            for a, b in ((0.3, W * 0.38), (W * 0.42, W * 0.8), (W * 0.84, W - 0.2)):
                ko.bamboo_blind((a, Dp + 0.02), (b, Dp + 0.02), 1.35, 2.2, rng)
            xc = lx_u(o, yaw, 27768, 14.5)
            for i, dxx in enumerate((-0.18, 0.2)):
                k.board("cloth_indigo", False, (xc + dxx - 0.14, Dp - 0.05), (xc + dxx + 0.14, Dp - 0.05), 0.02,
                        1.75 + 0.05 * i, 2.22)
            roof_y(gx0, gx1, -0.9, Dp + 0.35, 2.5, 4.1, "gable", MID, over=0.3, ornament=0.3)
            gable_tri_y(-0.55, gx0 + 0.1, gx1 - 0.1, 2.5, 3.9)
            ki.lean_to(0.0, gx0 + 0.2, -0.75, 0.6, 2.2, 2.5, ns=3, nt=2, rafters=False)
            ki.mat_roof([(gx1 - 0.2, -0.75, 2.35), (W + 0.25, -0.75, 2.35), (W + 0.25, Dp + 0.3, 2.6),
                         (gx1 - 0.2, Dp + 0.3, 2.6)], 0, rng, mat="reed", sag=0.04)
    H["lower_shed"] = (o, yaw, W, Dp, z0)
    # S2.bld.tiled_shed_27985 (河边店铺): a long open shed on posts under a tiled roof behind the porters' yard: a gable
    # at its west end over two open bays (a man behind a big tub there), a long hatched mat curtain from its eave further
    # east, tables and benches under the roof. On its painted front (falling east); its posts where painted, moved clear
    # of the tables and benches painted at their feet. choice: 3.1 m deep, a plain back wall; eave 2.8, gable roof 1.4;
    # the west gable over x 0-2.6 (apex u 27801), eave 2.6, ridge 4.2
    eid = "S2.bld.tiled_shed_27985"
    o, yaw, W, _ = front_frame(eid)
    Dp = 3.1
    z0 = z_under(o, yaw, W, Dp)
    near = things_near(o, yaw, W, Dp)
    xg = lx_u(o, yaw, 27801, 21.6)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            fx = [0.0] + [lx_u(o, yaw, u, d) for u, d in ((27738, 21.7), (27830, 21.6), (28000, 20.6), (28087, 20.4),
                                                        (28144, 20.3), (28219, 20.1))] + [W]
            fx = clear_posts(o, yaw, sorted(x for x in fx if -0.05 < x < W + 0.05), 0.0, near)
            for x in fx:
                tpost(x, 0.0, 0.0, 2.8, r=0.075, base=True)
            for x in (0.0, W / 2, W):
                tpost(x, Dp, 0.0, 2.8, r=0.075)
            k.board("plaster", True, (W - 0.05, Dp), (0.05, Dp), 0.12, -0.1, 2.8)
            k.board("plaster", True, (0.0, Dp - 0.05), (0.0, 0.1), 0.12, -0.1, 2.8)
            k.board("plaster", True, (W, 0.1), (W, Dp - 0.05), 0.12, -0.1, 2.8)
            k.beam("timber", False, (-0.12, 0.0, 2.74), (W + 0.12, 0.0, 2.74), 0.12, 0.16, 0.02)
            gx1 = max(2.4, xg + 1.3)
            roof_y(-0.2, gx1, -0.8, Dp + 0.4, 2.7, 4.2, "gable", MID, over=0.3, ornament=0.3)
            gable_tri_y(-0.45, -0.1, gx1 - 0.1, 2.7, 4.0)
            roof(gx1 - 0.2, W, -0.75, Dp + 0.45, 2.9, 4.3, "gable", MID, over=0.4)
            gable_tri(W, -0.1, Dp + 0.1, 2.8, 4.15)
            xa, xb = lx_u(o, yaw, 27930, 20.9), lx_u(o, yaw, 28000, 20.6)
            ko.bamboo_blind((xa, -0.12), (xb, -0.12), 0.95, 2.75, rng)
    # S2.bld.gable_loft_house_28060: a building behind the tiled shed whose big gable faces the river: under the gable a
    # balustrade across an open loft on two posts. choice: x 270.1-274.5 (narrowed: the 望火楼's stair and the trees
    # beside it stand east of it), D 25.15-28.3 (its front just behind the bare tree painted at its foot), the loft floor
    # at 2.8 behind a 0.9 m balustrade, the eave 4.5, a gable 2.0 high
    eid = "S2.bld.gable_loft_house_28060"
    o, yaw, W, Dp = (270.1, 25.15), 0.0, 4.4, 3.15
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            for x, y in ((0.0, 0.0), (W, 0.0), (0.0, Dp), (W, Dp)):
                k.post("timber", True, x, y, -0.1, 4.5, 0.18, 0.02)
            k.board("plaster", True, (0.08, 0.0), (W - 0.08, 0.0), 0.14, -0.1, 2.8)
            for a, b in (((W, 0.08), (W, Dp - 0.08)), ((W - 0.08, Dp), (0.08, Dp)), ((0.0, Dp - 0.08), (0.0, 0.08))):
                k.board("plaster", True, a, b, 0.14, -0.1, 4.5)
            k.board("plaster", False, (0.08, 1.0), (W - 0.08, 1.0), 0.12, 2.8, 4.5)        # the loft's back
            k.board("deck", False, (0.05, 0.5), (W - 0.05, 0.5), 1.0, 2.74, 2.8)            # its floor
            px = [lx_u(o, yaw, u, 25.2) for u in (27969, 28112)]
            px = [min(max(x, 0.4), W - 0.4) for x in px]
            for x in px:
                tpost(x, 0.0, 2.8, 4.45, r=0.08, collide=False)
            k.balustrade([(0.15, -0.02), (W - 0.15, -0.02)], 2.8, h=0.85, spacing=1.1, mat="timber", collide=False)
            mark_rect(0.0, W, 0.0, Dp)
            roof_y(-0.1, W + 0.1, -0.6, Dp + 0.5, 4.55, 6.5, "gable", MID, over=0.35, ornament=0.35)
            gable_tri_y(0.0, -0.1, W + 0.1, 4.5, 6.3)
    # S2.bld.rear_shed_28380: a long tiled roof between the 望火楼 and the 望楼饭铺 at the foot of the tower's platform,
    # hiding the platform's foot and the stair's foot; a small dark knob on its ridge (an ornament). choice: x 274.6-279.3,
    # D 22.75-24.85 (east of it the willows behind the shed), eave 2.7, gable 1.3, plain walls
    eid = "S2.bld.rear_shed_28380"
    o, yaw, W, Dp = (274.6, 22.75), 0.0, 4.7, 2.1
    z0 = z_under(o, yaw, W, Dp)
    with sb.entity(eid):
        with placed(o, yaw, z0):
            far_house(W, Dp, 0.0, 2.7, 1.3, rng, front_over=0.5)
            xk = local_of(o, yaw, (ux(28428, 23.8), 23.8))[0]
            k.rock("ridge", min(max(xk, 0.3), W - 0.3), Dp / 2, 2.7 + 0.08 + 1.3 + 0.2, 0.12, rng, flat=0.9)
    # the 望火楼: S2.str.fire_tower_platform_28450 (the brick platform and its stair) and S2.bld.fire_tower_28440 (the
    # pavilion on it), from kc.fire_tower at real size. The painted face (2.0 m wide at the frame's scale) is the far-row
    # diminution: choice: a platform 4.0 x 4.0 m centred on the painted front's middle and run back north (straight
    # north: the painted back corners stand 45 px left of the front ones, which in this frame is straight back), its
    # front just behind the rear shed's back (D 24.95); the kit's real height (5.6 m); the stair at the platform's front
    # depth, west of it, climbing east to its front-west corner, its foot 2.7 m west of the platform (the painted run,
    # 1.4 m at the frame's scale, times the platform's 2.0 enlargement), clear of the elm painted beside it
    psw, pse = pt("S2.str.fire_tower_platform_28450", "sw")[:2], pt("S2.str.fire_tower_platform_28450", "se")[:2]
    cx = (psw[0] + pse[0]) / 2
    yf = 24.95
    sw, se, ne, nw = (cx - 2.0, yf), (cx + 2.0, yf), (cx + 2.0, yf + 4.0), (cx - 2.0, yf + 4.0)
    z0 = min(hz_at(*p) for p in (sw, se, ne, nw))
    foot = (sw[0] - 2.7, yf + 0.6, hz_at(sw[0] - 2.7, yf + 0.6))
    with sb.entity("S2.str.fire_tower_platform_28450"):
        ft = kc.fire_tower(sw, se, ne, nw, z0, rng, stair_foot=foot, part="platform")
    with sb.entity("S2.bld.fire_tower_28440"):
        kc.fire_tower(sw, se, ne, nw, z0, rng, stair_foot=foot, part="pavilion")
    H["fire_tower"] = (sw, se, ne, nw, z0, ft)
    # S2.bld.wanglou_shed_28660 (望楼饭铺): the long open eating shed under thatch below the 望火楼 (kc.thatch_shed_skirt):
    # a big hipped thatched roof with a gable vent, a lower thatched skirt roof along its front, a second big thatched
    # roof behind its east half, many plain posts, a slatted fringe under the front eave, a short valance across the east
    # bay, a wall of vertical slats closing the back at its east end. On its painted plan. choice: the kit's sizes; the
    # slat wall over 0.72-0.98 of its length (u 28920-29030), the rear roof over 0.45-1.0 and 2.2 m deep (clear of the
    # 望火楼's platform), the valance over 0.86-0.97 (u 28949-29014)
    eid = "S2.bld.wanglou_shed_28660"
    sw, se, ne, nw = fp(eid)
    z0 = min(hz_at(*p) for p in (sw, se, ne, nw))
    with sb.entity(eid):
        kc.thatch_shed_skirt(sw, se, ne, nw, z0, rng, posts=8, vent=True, fringe=True, back_slats=(0.72, 0.98),
                             rear_roof=(0.45, 1.0, 2.2), valance=(0.86, 0.97))
    # S2.bld.far_shed_top_28720: a faint long low building at the very top east of the 望火楼: a roof band, posts, a
    # bench or table line under it. choice: squared, its front 0.25 m north of the painted line (the three far trees
    # painted at its foot stand in front of it, as their strokes cross its eave), 2.4 m deep, eave 2.4, gable 1.0, a
    # plain back wall
    eid = "S2.bld.far_shed_top_28720"
    sw, se, ne, nw = fp(eid)
    o, yaw, W, Dp = (sw[0], 28.45), 0.0, se[0] - sw[0], 2.4
    z0 = z_under(o, yaw, W, Dp)
    xs = clear_posts(o, yaw, [0.0] + [lx_u(o, yaw, u, 28.4) for u in (28700, 28785, 28848)] + [W], 0.0,
                     things_near(o, yaw, W, Dp))
    with sb.entity(eid):
        with placed(o, yaw, z0):
            open_shed(W, Dp, 0.0, 2.4, 2.4, xs, rng, rise=1.0, back_wall=True, side_walls=(True, True))


def wharf_frames(rng):
    # S2.str.wattle_fence_26890: under the west half of the great willow's head, a low block of close vertical hatching
    # (a wattle or reed fence) with a curved lower edge, and at its east end a small frame of two posts and two rails
    # (u 26935-26970). choice: 0.9 m (painted 0.66 at the bank's scale), on the footprint's mid-line
    eid = "S2.str.wattle_fence_26890"
    sw, se, ne, nw = fp(eid)
    a = ((sw[0] + nw[0]) / 2, (sw[1] + nw[1]) / 2)
    b = ((se[0] + ne[0]) / 2, (se[1] + ne[1]) / 2)
    xf = ux(26935, (a[1] + b[1]) / 2)
    t = (xf - a[0]) / (b[0] - a[0])
    m = (xf, a[1] + t * (b[1] - a[1]))
    z = min(hz_at(*a), hz_at(*b))
    with sb.entity(eid):
        with k.placed(k.frame(0, 0, z)):
            ki.slat_fence(a, m, 0.9, rng, slat=0.05, mat="reed")
        ko.low_rail_fence([(m[0] + 0.05, m[1]), b], 0.85, rng, rails=2, post_every=1.0)
    # S2.prop.pennant_frame_27930: two long poles leaning together into a tall A whose apex stands over the painted
    # base point: the east pole's foot on the east corner of the lower shed's eave, the west pole's lower end held up by
    # the man in the long robe (S2.fig.pennant_pole_holder_27810); a cord of about eight small pennants runs from the
    # apex down west to the lower shed's roof (at u 27825), a few more hang along the east pole. choice: the apex 5.2 m
    # (painted 4.4 at the bank's scale), the held end at his hands (1.0 m)
    eid = "S2.prop.pennant_frame_27930"
    x, y = P(eid)
    o, yaw, W, Dp, z0 = H["lower_shed"]
    zg = hz_at(x, y)
    apex = (x, y + 0.3, zg + 5.2)
    ce = world_of(o, yaw, (W - 0.02, 0.0))
    east_foot = (ce[0], ce[1], z0 + 2.42)
    hf = FIG.get("S2.fig.pennant_pole_holder_27810")
    if hf:
        # choice (details pass, fix-river 2026-10-13; gen/details/contacts/fix_standard.md rule 3, fit the object to the
        # body): the held end on the line from the apex through the middle of his two palms as fend_pole has them on the
        # page at his spot (palms (260.31, 12.78, 1.24) and (260.58, 12.74, 1.34), measured from
        # gen/details/joints/robed_man.json), 0.2 m past them; his palms are laid on the pole by an IK clip variant
        # (characters/ik_variants.json "pennant_pole_holder_27810"); re-measure if his placement changes
        mx, my, mz = 260.445, 12.756, 1.288
        L_ = math.dist((mx, my, mz), apex)
        west_foot = tuple(m + (m - a) / L_ * 0.2 for m, a in zip((mx, my, mz), apex))
    else:
        west_foot = (ux(27840, 14.0), 14.0, hz_at(ux(27840, 14.0), 14.0) + 1.0)
    xr = ux(27825, 14.4)
    roof_pt = (xr, 14.6, z0 + 2.5)
    with sb.entity(eid):
        kc.a_frame(west_foot, east_foot, apex, rng, r=0.045)
        kc.pennant_cord(apex, roof_pt, 8, rng, sag=0.35, size=0.26)
        mid = tuple(apex[i] + (east_foot[i] - apex[i]) * 0.55 for i in range(3))
        kc.pennant_cord(apex, mid, 3, rng, sag=0.04, size=0.22)


# ---------------------------------------------------------------- props

def support_z(eid):
    """The height a prop stands on: its support (the frame's) as built."""
    e = E[eid]
    x, y = e["pos"][:2]
    sup = e.get("support") or "ground"
    if sup.startswith("terrace floor"):
        return H["terrace_floor"]
    if sup.startswith("upper floor"):
        return H["yanhe"][3]
    if sup.startswith("table top"):
        return H["tops"][sup.split(": ", 1)[1]]
    if sup == "water":
        return RIVER["H"]
    if eid == "S2.prop.shop_table_21682":
        return H["shop21640_floor"]
    return hz_at(x, y)


def fitted_ht(eid, z, ht):
    """A mapped bench's, stool's or sack pile's height fitted to the figure painted seated on it (details pass, fix-river
    2026-10-13; gen/details/contacts/fix_standard.md rule 3: the top at the sitter's seat point on the page less 0.008
    m): seats.json entries with fit_owner == eid give its top_H (map H); else the builder's own choice ht."""
    for v in _seats_data().values():
        if isinstance(v, dict) and v.get("fit_owner") == eid and v.get("top_H") is not None:
            return float(v["top_H"]) - z
    return ht


def props(rng):
    """Every painted prop at its mapped spot, at real size (painted props are drawn at the figures' scale: sizes are
    choices from what they are), furniture turned square to the building it stands in (choices)."""
    H["tops"] = {}
    yaw_of = {}

    def fyaw(bid):
        if bid not in yaw_of:
            yaw_of[bid] = front_frame(bid)[1]
        return yaw_of[bid]

    def table(eid, L_, W_, yaw, ht=0.78):
        x, y = P(eid)
        z = support_z(eid)
        with sb.entity(eid):
            with k.placed(k.frame(x, y, z, yaw)):
                k.table(-L_ / 2, -W_ / 2, L_ / 2, W_ / 2, 0.0, h=ht)
        H["tops"][eid] = z + ht

    def bench(eid, L_, yaw, ht=0.45, w=0.26):
        x, y = P(eid)
        z = support_z(eid)
        ht = fitted_ht(eid, z, ht)
        c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
        with sb.entity(eid):
            ki.bench((x - c * L_ / 2, y - s * L_ / 2), (x + c * L_ / 2, y + s * L_ / 2), z, h=ht, w=w)

    # the west bank: the shop row's table and its basket, the raised shop's counter
    yr = fyaw("S2.bld.shop_row_21200")
    table("S2.prop.table_shop_21160", 1.1, 0.55, yr)
    x, y = P("S2.prop.basket_on_table_21180")
    with sb.entity("S2.prop.basket_on_table_21180"):
        ki.round_basket(x, y + 0.08, H["tops"]["S2.prop.table_shop_21160"], 0.17, 0.2, rng)
    x, y = P("S2.prop.shop_table_21682")
    with sb.entity("S2.prop.shop_table_21682"):
        c, s = math.cos(math.radians(fyaw("S2.bld.open_shop_21640"))), math.sin(math.radians(fyaw("S2.bld.open_shop_21640")))
        # choice: 0.85 m long, its depth inside the shop (north of its painted top line)
        ki.counter((x - 0.05 - c * 0.42, y - s * 0.42), (x - 0.05 + c * 0.42, y + s * 0.42),
                   support_z("S2.prop.shop_table_21682"), 0.82, 0.4, rng)
    # the terrace (on its floor)
    ty = -2.0
    table("S2.prop.terrace_table_23125", 0.9, 0.6, ty)
    table("S2.prop.terrace_table_23298", 0.85, 0.6, ty)
    table("S2.prop.pavilion_table_23392", 0.7, 0.5, ty, ht=0.72)
    x, y = P("S2.prop.terrace_bundle_23187")
    with sb.entity("S2.prop.terrace_bundle_23187"):
        k.sack(x, y, support_z("S2.prop.terrace_bundle_23187"), rng, s=0.55, mat="cloth_white")
    x, y = P("S2.prop.terrace_chair_23250")
    with sb.entity("S2.prop.terrace_chair_23250"):
        k2.chair(x, y, support_z("S2.prop.terrace_chair_23250"), 270 + ty, rng, back="slats")
    # the open-air eatery under its shelter (squared to the shelter's front, falling 7 deg east, choice)
    ey = -7.0
    table("S2.prop.eatery_table_23683", 0.95, 0.6, ey)
    table("S2.prop.eatery_table_23730", 0.95, 0.6, ey)
    table("S2.prop.eatery_table_23788", 1.0, 0.6, ey)
    table("S2.prop.eatery_table_23755", 1.15, 0.62, ey)
    table("S2.prop.eatery_table_23818", 0.9, 0.55, ey)
    table("S2.prop.eatery_table_23852", 1.0, 0.6, ey)
    table("S2.prop.eatery_table_23880", 1.2, 0.65, ey)
    table("S2.prop.eatery_back_table_23670", 1.1, 0.5, ey, ht=0.85)
    bench("S2.prop.eatery_bench_23612", 0.9, ey)
    bench("S2.prop.eatery_bench_23727", 1.3, ey)
    bench("S2.prop.eatery_bench_23818", 0.7, ey)
    bench("S2.prop.eatery_bench_23848", 1.2, ey, ht=0.4)
    bench("S2.prop.eatery_bench_23893", 0.55, ey)
    bench("S2.prop.eatery_bench_23922", 0.6, ey)
    x, y = P("S2.prop.eatery_rack_23688")
    z = support_z("S2.prop.eatery_rack_23688")
    with sb.entity("S2.prop.eatery_rack_23688"):
        ki.tray_stand(x, y, z, 0.6, 0.45, 0.8, rng, yaw=ey)
        for i in range(4):
            sb.cyl("bamboo", False, (x, y, z + 0.82 + 0.13 * i), (x, y, z + 0.82 + 0.13 * i + 0.12), 0.2 - 0.01 * i, segs=10)
        sb.cyl("bamboo", False, (x, y, z + 1.34), (x, y, z + 1.4), 0.12, 0.03, segs=10)
    x, y = P("S2.prop.eatery_dark_object_23574")
    z = support_z("S2.prop.eatery_dark_object_23574")
    with sb.entity("S2.prop.eatery_dark_object_23574"):
        k.beam("timber", False, (x - 0.3, y, z + 0.92), (x + 0.3, y, z + 0.92), 0.3, 0.03, 0)   # its shelf
        ki.pot(x, y, z + 0.94, r=0.13, h=0.24)
    x, y = P("S2.prop.doorway_jar_23885")
    with sb.entity("S2.prop.doorway_jar_23885"):
        k2.big_jar(x, y, support_z("S2.prop.doorway_jar_23885"), rng, r=0.3, h=0.7, mat="jar_green", rim_mat="jar_green")
    # the open-fronted eating houses at the top of the bank and their tables set out on the street
    sy = fyaw("S2.bld.open_shop_24020")
    # choice (build.json moves): the black-capped man's bench turned north-south 0.75 m west of the small table's
    # centre (at their real sizes the painted bench, 0.3 m from the table, stood inside it), 0.7 m long
    bench("S2.prop.shop_bench_23955", 0.7, sy + 90)
    table("S2.prop.shop_small_table_23983", 0.6, 0.45, sy, ht=0.72)
    bench("S2.prop.shop_bench_24066", 0.5, sy)
    table("S2.prop.shop_table_24005", 1.2, 0.6, sy)
    bench("S2.prop.shop_bench_23978", 1.1, sy)
    table("S2.prop.shop_table_24112", 1.1, 0.6, sy)
    bench("S2.prop.shop_bench_24100", 1.2, sy)
    # the stall under the scaffold house's sweeping eave: a braced table with light goods and sprigs
    x, y = P("S2.prop.stall_table_24708")
    z = support_z("S2.prop.stall_table_24708")
    with sb.entity("S2.prop.stall_table_24708"):
        kce.braced_stand((x - 0.55, y), (x + 0.55, y), z, 0.78, 0.55, rng)
    H["tops"]["S2.prop.stall_table_24708"] = z + 0.78
    x, y = P("S2.prop.stall_goods_24672")
    with sb.entity("S2.prop.stall_goods_24672"):
        zt = support_z("S2.prop.stall_goods_24672")
        ki.round_basket(x + 0.1, y, zt, 0.16, 0.18, rng)
        ki.goods_heap(x + 0.35, y + 0.02, zt, 0.4, 0.3, rng, n=5, mat="cloth_white", s=0.08)
        for i in range(5):
            a = i * 1.257
            sb.cyl("leaf", False, (x + 0.1, y, zt + 0.12), (x + 0.1 + 0.12 * math.cos(a), y + 0.12 * math.sin(a), zt + 0.5),
                   0.012, 0.006, segs=4)
    # the bank in front of the scaffold house: the mooring post with its rope coiled at its foot
    x, y = P("S2.prop.mooring_post_25207")
    z = hz_at(x, y)
    with sb.entity("S2.prop.mooring_post_25207"):
        k2.mooring_post(x, y, z - 0.15, z + 0.7, rng, r=0.11)
        kc.rope_coil(x + 0.05, y - 0.2, z, rng, r=0.25, turns=3, h=0.1)
    # the tall pole with a knob and the narrow signboard hung beside it (□□(□): pole_sign), at the open shop's west
    # corner. choice: pole 4.2 m, the board 0.3 x 0.95 m on an arm 0.35 m west of the pole, 2.15-3.1 m up
    x, y = P("S2.prop.signboard_pole_25235")
    z = hz_at(x, y)
    with sb.entity("S2.prop.signboard_pole_25235"):
        ki.capped_pole(x, y, z, 4.2, r=0.05)
        xb = x - 0.2
        kc.sign_face((xb - 0.3, y - 0.02), (xb, y - 0.02), z + 2.15, z + 3.1, "pole_sign", rng)
        k.beam("timber", False, (x, y - 0.02, z + 3.2), (xb - 0.35, y - 0.02, z + 3.2), 0.04, 0.05, 0)
        for xx in (xb - 0.27, xb - 0.03):
            sb.cyl("rope", False, (xx, y - 0.02, z + 3.18), (xx, y - 0.02, z + 3.1), 0.008, segs=4)
    # the goods racks in the open shop's west corner: two tiered slatted stands set at an angle, small wares on them
    x, y = P("S2.prop.goods_racks_25290")
    z = hz_at(x, y)
    with sb.entity("S2.prop.goods_racks_25290"):
        k2.two_tier_stall(x - 0.4, y + 0.05, z, 15.0, rng, L=0.9, W=0.5, h=1.0, wares="jar_red", goods="cloth_white")
        k2.two_tier_stall(x + 0.45, y + 0.2, z, -20.0, rng, L=0.9, W=0.5, h=1.0, wares="jar_green", goods="cloth_white")
    # 沿河雅座's furniture on its upper floor: the ladder to the loft, a low table, the long table and three folding seats
    zf = H["yanhe"][3]
    x, y = P("S2.prop.hall_ladder_25535")
    with sb.entity("S2.prop.hall_ladder_25535"):
        kc.ladder((x, y + 0.3, zf), (x + 0.45, y + 1.0, zf + 2.4), rng, w=0.42)
    table("S2.prop.hall_table_25565", 0.8, 0.45, 0.0, ht=0.42)
    eid = "S2.prop.hall_tables_chairs_25775"
    q = [pt(eid, n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
    xs = [p[0] for p in q]
    ym = sum(p[1] for p in q) / 4
    with sb.entity(eid):
        x0, x1 = min(xs) + 0.1, max(xs) - 0.1
        with k.placed(k.frame(0, 0, zf)):
            k.table(x0, ym + 0.05, x1, ym + 0.6, 0.0, h=0.78)
        for f_ in (0.15, 0.5, 0.85):
            kc.folding_seat(x0 + (x1 - x0) * f_, ym - 0.25, zf, 90.0, rng)
    # the far street's stalls and sheds
    x, y = P("S2.prop.stall_table_25650")
    table("S2.prop.stall_table_25650", 0.7, 0.45, 0.0, ht=0.72)
    eid = "S2.prop.stall_awning_25660"
    x, y = P(eid)
    z = hz_at(x, y)
    xe = fp("S2.bld.far_shed_25785")[0][0]
    with sb.entity(eid):
        ki.mat_roof([(x - 0.75, y - 0.55, z + 2.05), (xe, y - 0.55, z + 2.2), (xe, y + 0.55, z + 2.25),
                     (x - 0.75, y + 0.55, z + 2.1)], 0, rng, mat="cloth_white", sag=0.06)
        kc.pole((x - 0.95, y - 0.6, z), (x - 0.55, y + 0.5, z + 2.35), rng, r=0.035)
        kc.pole((x - 0.55, y - 0.6, z), (x - 0.95, y + 0.5, z + 2.35), rng, r=0.035)
        kc.pole((x - 0.8, y, z + 2.15), (ux(25677, y), y + 0.25, z), rng, r=0.035)
    eid = "S2.prop.shed_tables_25845"
    q = [pt(eid, n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
    z = min(hz_at(*p) for p in q)
    yy = sum(p[1] for p in q) / 4
    with sb.entity(eid):
        for u0, u1 in ((25777, 25817), (25827, 25847), (25877, 25900)):
            a, b = ux(u0, yy), ux(u1, yy)
            if b - a < 0.5:
                a, b = (a + b) / 2 - 0.3, (a + b) / 2 + 0.3
            with k.placed(k.frame(0, 0, z)):
                k.table(a, yy - 0.25, b, yy + 0.25, 0.0, h=0.7)
        xt = ux(25866, yy)
        kc.a_frame((xt - 0.3, yy - 0.2, z), (xt + 0.3, yy + 0.2, z), (xt, yy, z + 0.95), rng, r=0.03)
    # choice: 0.75 m long (the second stall man is painted standing at its east end)
    table("S2.prop.stall_table_26173", 0.75, 0.5, 0.0)
    x, y = P("S2.prop.stall_table_26173")
    with sb.entity("S2.prop.stall_table_26173"):
        ki.dishes(x - 0.15, y, H["tops"]["S2.prop.stall_table_26173"], rng, n=3)
        ki.goods_heap(x + 0.18, y, H["tops"]["S2.prop.stall_table_26173"], 0.3, 0.3, rng, n=5, mat="cloth_white", s=0.07)
    x, y = P("S2.prop.wheel_26343")
    with sb.entity("S2.prop.wheel_26343"):
        R = 0.62
        kv.spoked_wheel(V((x, y, hz_at(x, y) + R)), V((0.0, 1.0, 0.0)), R, spokes=14)
    table("S2.prop.table_26392", 0.8, 0.5, 0.0, ht=0.75)
    x, y = P("S2.prop.shed_counter_26765")
    z = hz_at(x, y)
    with sb.entity("S2.prop.shed_counter_26765"):
        ki.counter((x - 0.6, y), (x + 0.6, y), z, 0.85, 0.4, rng)      # its depth inside the shed (north)
        for dxx in (-0.15, 0.1):
            k.board("cloth_indigo", False, (x + dxx - 0.1, y + 0.2), (x + dxx + 0.1, y + 0.2), 0.02, z + 0.9, z + 1.55)
        k.beam("timber", False, (x - 0.6, y + 0.2, z + 1.6), (x + 0.6, y + 0.2, z + 1.6), 0.05, 0.05, 0)
    x, y = P("S2.prop.baskets_26778")
    z = hz_at(x, y)
    with sb.entity("S2.prop.baskets_26778"):
        ki.round_basket(x - 0.3, y, z, 0.24, 0.32, rng)
        ki.round_basket(x + 0.32, y + 0.04, z, 0.25, 0.34, rng)
        kc.pole((x - 0.75, y + 0.15, z + 0.05), (x + 0.8, y - 0.1, z + 0.38), rng, r=0.03)
    # 王家纸马铺's tall signboard: one column of characters (wang_paper_horse: faded broken strokes, the scan illegible;
    # scholarship reads 王家紙馬), a narrow board with dark side edges and a small cap, in a low foot frame with two
    # splayed feet. choice: 0.5 m wide, its height by the cell's aspect, from 0.55 m up
    eid = "S2.prop.signboard_wang_paper_horse_26896"
    x, y = P(eid)
    z = hz_at(x, y)
    asp = kc.cell_aspect("wang_paper_horse", 0.22)
    w = 0.5
    hb = min(2.6, max(1.6, w / max(asp, 0.1)))
    with sb.entity(eid):
        kc.sign_face((x - w / 2, y), (x + w / 2, y), z + 0.55, z + 0.55 + hb, "wang_paper_horse", rng, thick=0.05,
                     frame=True, cap=True)
        for sgn in (-1, 1):
            k.beam("interior", False, (x + sgn * (w / 2 + 0.03), y, z + 0.5), (x + sgn * (w / 2 + 0.03), y, z + 0.6 + hb),
                   0.05, 0.07, 0.01)
            k.beam("timber", True, (x + sgn * (w / 2 - 0.05), y, z + 0.6), (x + sgn * (w / 2 + 0.2), y + 0.05, z), 0.07,
                   0.07, 0.01)
            k.beam("timber", False, (x + sgn * (w / 2 - 0.05), y - 0.25, z + 0.04), (x + sgn * (w / 2 - 0.05), y + 0.25, z + 0.04),
                   0.08, 0.08, 0.01)
        k.beam("timber", False, (x - w / 2 - 0.15, y, z + 0.3), (x + w / 2 + 0.15, y, z + 0.3), 0.06, 0.07, 0.01)
    # its paper goods: the stand piled to the eave with stacked paper offerings (a ladder-like rack against it), and the
    # tall paper effigy beside it. choice: the stand 0.8 x 0.5 x 0.5 m, the stack to 2.6 m; the effigy 1.8 m
    eid = "S2.prop.paper_goods_stack_27070"
    x, y = P(eid)
    z = hz_at(x, y)
    with sb.entity(eid):
        ko.slatted_box(x, y, z, 0.8, 0.5, 0.25, 0.0, rng, legs=0.25, lid=True, collide=True)
        ki.box_stack(x, y, z + 0.52, 4, 0.7, 0.45, 0.2, rng, mat="cloth_white")
        ki.paper_tower(x - 0.1, y, z + 1.32, 0.9, rng)
        ki.paper_figure(x + 0.25, y - 0.1, z + 1.32, 0.6, rng, hat=True)
        kc.ladder((x - 0.35, y - 0.3, z), (x + 0.35, y - 0.3, z + 2.5), rng, w=0.35)
    x, y = P("S2.prop.tall_paper_item_27112")
    with sb.entity("S2.prop.tall_paper_item_27112"):
        ki.paper_figure(x, y, hz_at(x, y), 1.8, rng, arms=True)
    # 喝杯小酒's tables under the mat awning and the parasol (set diagonally like the shed, choice: its yaw)
    wy = fyaw("S2.bld.eating_shed_west_27300")
    table("S2.prop.table_awning_27205", 1.0, 0.55, wy)
    x, y = P("S2.prop.table_awning_27205")
    with sb.entity("S2.prop.table_awning_27205"):
        c, s = math.cos(math.radians(wy)), math.sin(math.radians(wy))
        ki.bench((x - c * 0.5 + s * 0.5, y - s * 0.5 - c * 0.5), (x + c * 0.5 + s * 0.5, y + s * 0.5 - c * 0.5),
                 hz_at(x, y), h=0.45, w=0.26)
    table("S2.prop.table_awning_27270", 1.0, 0.55, wy)
    table("S2.prop.table_awning_27330", 1.0, 0.55, wy)
    table("S2.prop.table_parasol_27435", 1.6, 0.6, wy)
    x, y = P("S2.prop.parasol_27430")
    z = hz_at(x, y)
    with sb.entity("S2.prop.parasol_27430"):
        ki.umbrella(x, y, z + 2.35, 1.05, rng, tilt=(-0.1, -0.12), foot=(x + 0.15, y + 0.2, z), ribs=16, mat="reed")
    x, y = P("S2.prop.tub_27532")
    with sb.entity("S2.prop.tub_27532"):
        kce.slatted_tub(x, y, hz_at(x, y), 0.32, 0.8, rng, lid="board")
    # the lower shed's tables and benches (squared to its front, choice)
    ly = fyaw("S2.bld.lower_shed_27780")
    table("S2.prop.table_27672", 1.4, 0.6, ly)
    bench("S2.prop.bench_27700", 1.4, ly)
    table("S2.prop.table_27755", 0.9, 0.55, ly)
    bench("S2.prop.bench_27840", 0.7, ly)
    table("S2.prop.table_27918", 1.6, 0.65, ly)
    bench("S2.prop.bench_27942", 1.3, ly)
    table("S2.prop.table_back_27945", 1.0, 0.55, ly)
    bench("S2.prop.bench_28018", 0.6, ly)
    # the wharf: the stake and its coiled rope, the sacks (the owner's seat), the bank's stakes, ladder and mat
    x, y = P("S2.prop.stake_27708")
    with sb.entity("S2.prop.stake_27708"):
        kc.stake(x, y, hz_at(x, y) - 0.1, hz_at(x, y) + 1.2, rng)
    x, y = P("S2.prop.coiled_rope_27873")
    with sb.entity("S2.prop.coiled_rope_27873"):
        kc.rope_coil(x, y, hz_at(x, y), rng, r=0.32, turns=5)
    x, y = P("S2.prop.mooring_stake_27902")
    with sb.entity("S2.prop.mooring_stake_27902"):
        kc.stake(x, y, hz_at(x, y) - 0.15, hz_at(x, y) + 1.05, rng, r=0.05)
    # the grain owner's seat (S2.prop.sack_pile_27996): its lying sacks under his hips (seats.json "sacks"), the
    # standing sack west of him as painted; choice: the bottom sack settled 0.16 m into the ground so the level top is
    # 0.42 m over it (his sit puts the hips there)
    eid = "S2.prop.sack_pile_27996"
    q = [pt(eid, n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
    seat = next((v for v in _seats_data().values() if isinstance(v, dict) and v.get("kind") == "sacks"), None)
    x, y = (seat["X"], seat["D"]) if seat else (sum(p[0] for p in q) / 4, sum(p[1] for p in q) / 4)
    z = hz_at(x, y)
    with sb.entity(eid):
        top = fitted_ht(eid, z, None)
        if top is None:
            zt = kc.sack_pile(x, y, z - 0.16, 178.0, rng, lying=2, standing=1, seat=True)
        else:
            # choice (details pass, fix-river 2026-10-13; fix_standard.md rule 3): his sit_point puts the seat 0.29 m
            # over his soles, so one lying sack is under him (its top 0.34 m over its foot, set down into the ground to
            # the fitted top) and the second lies beside it; the standing sack west of him as painted
            zt = kc.sack_pile(x, y, z + top - 0.34, 178.0, rng, lying=2, standing=1, seat=True, stack=1)
    H["tops"][eid] = zt
    H["owner_seat"] = round(zt - z, 3)
    eid = "S2.prop.sack_heap_28144"
    q = [pt(eid, n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
    x, y = sum(p[0] for p in q) / 4, sum(p[1] for p in q) / 4
    yaw = math.degrees(math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]))
    with sb.entity(eid):
        kc.sack_pile(x, y, min(hz_at(*p) for p in q), yaw, rng, lying=4, standing=2, seat=False)
    x, y = P("S2.prop.mooring_post_rope_28272")
    with sb.entity("S2.prop.mooring_post_rope_28272"):
        kc.post_with_rope(x, y, hz_at(x, y) - 0.2, hz_at(x, y) + 1.35, rng)
    x, y = P("S2.prop.ladder_28538")
    with sb.entity("S2.prop.ladder_28538"):
        a, b = (x - 0.95, y - 0.5), (x + 0.95, y + 0.5)
        kc.ladder((a[0], a[1], hz_at(*a) + 0.06), (b[0], b[1], hz_at(*b) + 0.08), rng, w=0.42)
    x, y = P("S2.prop.ribbed_object_28878")
    with sb.entity("S2.prop.ribbed_object_28878"):
        a, b = (x - 0.45, y - 0.1), (x + 0.45, y + 0.1)
        kc.rolled_mat((a[0], a[1], hz_at(*a) + 0.16), (b[0], b[1], hz_at(*b) + 0.16), 0.16, rng)
    x, y = P("S2.prop.bundle_28520")
    with sb.entity("S2.prop.bundle_28520"):
        kv.soft_sack(V((x, y, hz_at(x, y))), 0.95, 0.65, 0.38, math.radians(-8), rng, mat="hemp")
    # the tiled shed: the tub on its stand, its tables and benches (squared to its front, choice)
    x, y = P("S2.prop.tub_27815")
    z = hz_at(x, y)
    with sb.entity("S2.prop.tub_27815"):
        for dxx, dyy in ((-0.3, -0.3), (0.3, -0.3), (0.3, 0.3), (-0.3, 0.3)):
            k.post("timber", False, x + dxx, y + dyy, z, z + 0.3, 0.06, 0.01)
        k.beam("timber", False, (x - 0.38, y, z + 0.28), (x + 0.38, y, z + 0.28), 0.7, 0.05, 0.01)
        ki.tub(x, y, z + 0.3, 0.42, 0.48, rng)
    ty2 = fyaw("S2.bld.tiled_shed_27985")
    table("S2.prop.table_27870", 0.8, 0.5, ty2)
    bench("S2.prop.bench_27922", 0.6, ty2)
    bench("S2.prop.bench_28015", 0.7, ty2 + 90)
    table("S2.prop.table_28068", 0.95, 0.55, ty2)
    bench("S2.prop.bench_28090", 1.1, ty2)
    bench("S2.prop.bench_28210", 1.3, ty2)
    eid = "S2.prop.table_28205"
    q = [pt(eid, n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
    table(eid, 1.0, 0.45, ty2)
    # 望楼饭铺's furniture (squared to its front, choice)
    wy2 = fyaw("S2.bld.wanglou_shed_28660")
    eid = "S2.prop.long_board_rack_28365"
    q = [pt(eid, n_)[:2] for n_ in ("sw", "se", "ne", "nw")]
    z = min(hz_at(*p) for p in q)
    with sb.entity(eid):
        a = ((q[0][0] + q[3][0]) / 2, (q[0][1] + q[3][1]) / 2)
        b = ((q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2)
        for f_ in (0.15, 0.85):
            p = (a[0] + (b[0] - a[0]) * f_, a[1] + (b[1] - a[1]) * f_)
            kc.a_frame((p[0] - 0.05, p[1] - 0.3, z), (p[0] + 0.05, p[1] + 0.3, z), (p[0], p[1], z + 0.55 - 0.15 * f_), rng,
                       r=0.03)
        for i in range(4):
            o_ = -0.27 + 0.18 * i
            k.beam("timber", False, (a[0], a[1] + o_, z + 0.55 + 0.03 * i), (b[0], b[1] + o_ * 0.6, z + 0.42 + 0.03 * i),
                   0.16, 0.035, 0)
    x, y = P("S2.prop.tall_jar_28396")
    with sb.entity("S2.prop.tall_jar_28396"):
        k2.big_jar(x, y, hz_at(x, y), rng, r=0.33, h=0.95)
    table("S2.prop.table_28522", 0.75, 0.5, wy2)
    table("S2.prop.table_28598", 1.2, 0.55, wy2)
    bench("S2.prop.bench_28610", 1.2, wy2)
    x, y = P("S2.prop.stool_28665")
    with sb.entity("S2.prop.stool_28665"):
        kc.folding_seat(x, y, hz_at(x, y), wy2, rng, h=0.42, seat_mat="timber")
    table("S2.prop.table_back_28680", 0.85, 0.5, wy2)
    bench("S2.prop.shed_bench_28740", 1.0, wy2 - 15)
    table("S2.prop.shed_table_28806", 0.6, 0.45, wy2)
    x, y = P("S2.prop.shed_stool_28871")
    with sb.entity("S2.prop.shed_stool_28871"):
        ki.stool(x, y, hz_at(x, y), h=fitted_ht("S2.prop.shed_stool_28871", hz_at(x, y), 0.42), s=0.32)
    bench("S2.prop.bench_29030", 0.75, wy2)
    # the far shed at the top: its crossed-leg benches, the trough in front of it
    x, y = P("S2.prop.far_shed_furniture_28728")
    with sb.entity("S2.prop.far_shed_furniture_28728"):
        for dxx in (-0.45, 0.45):
            kc.folding_seat(x + dxx, y + 0.1, hz_at(x, y), 0.0, rng, h=0.45, w=0.75, seat_mat="timber")
    x, y = P("S2.prop.tub_or_trough_28923")
    with sb.entity("S2.prop.tub_or_trough_28923"):
        ki.tub(x, y, hz_at(x, y), 0.33, 0.32, rng)
    # the mooring post standing in the water off the terrace, its rope knotted round its top in loops
    x, y = P("S2.prop.mooring_post_23126")
    with sb.entity("S2.prop.mooring_post_23126"):
        zf_ = min(hz_at(x, y), RIVER["H"]) - 0.3
        k2.mooring_post(x, y, zf_, RIVER["H"] + 1.7, rng, r=0.09)
        kc.rope_coil(x, y, RIVER["H"] + 1.35, rng, r=0.13, turns=3, h=0.06, tail=True)


# ---------------------------------------------------------------- vehicles

def team(*eids, kind="mule"):
    out = []
    for eid in eids:
        a = E[eid]["pts"]
        (fx, fd, _), (hx, hd, _) = a["fore"], a["hind"]
        out.append(((fx + hx) / 2, (fd + hd) / 2, math.degrees(math.atan2(fd - hd, fx - hx)), kind))
    return out


def _mule_cart_fallback(front, rear, wheel, tm, rng):
    """The mule cart from the vehicle kit's own parts, until kit_vehicles.open_cart lands (catalogue §3): its
    two-wheeled bed (as the low sack cart's), the load (a dark straw-and-sack heap under a flat mat-covered bundle
    tilted up at its west end), the rails run on past the rear, a prop stick under the rear, short shafts to the team's
    harness. choice: R 0.79 so the bed's top is the frame's cart bed (H 0.91), where the loader stands: its collider
    there is the bed's own height; a separate collider over the load."""
    origin, fwd, left, L = kv._axis(rear, front)
    s_w = kv._along(wheel, origin, fwd)
    zg = hz_at(*(origin + fwd * s_w).xy)
    M = kv._frame_m(origin, fwd, zg)
    R = 0.79
    bed_len, hw = 2.3, 0.62
    bx0, bx1 = s_w - bed_len / 2, s_w + bed_len / 2
    z_bed = R + 0.12
    track = kv._two_wheel_bed(M, s_w, bx0, bx1, hw, R, z_bed, 16, rng, left, track_extra=0.2)
    yaw = math.atan2(fwd.y, fwd.x)
    with k.placed(M):
        k.bx("hidden", True, (bx0 - 0.05, -track - 0.12, 0.0), (bx1 + 0.05, track + 0.12, z_bed))   # the bed (loader)
        k.bx("hidden", True, (bx0 - 0.05, -hw, z_bed), (bx1 - 0.75, hw, z_bed + 0.95))             # the load
        for y in (hw, -hw):        # the side rails, run on past the rear
            k.beam("timber", False, (bx0 - 0.5, y, z_bed + 0.16), (bx1, y, z_bed + 0.16), 0.06, 0.06, 0.01)
            for x in (bx0 - 0.1, (bx0 + bx1) / 2, bx1 - 0.1):
                k.post("timber", False, x, y, z_bed - 0.05, z_bed + 0.2, 0.05, 0.01)
        sb.cyl("timber", False, (bx0 + 0.15, 0.0, z_bed - 0.1), (bx0 + 0.05, 0.05, 0.0), 0.04, segs=6)   # the prop stick
        # the load: a mat-covered flat bundle tilted up at its west (front) end over a dark heap
        ki.mat_roof([(bx0 + 0.1, -hw + 0.05, z_bed + 0.62), (bx1 - 0.85, -hw + 0.05, z_bed + 0.95),
                     (bx1 - 0.85, hw - 0.05, z_bed + 0.95), (bx0 + 0.1, hw - 0.05, z_bed + 0.62)], 0, rng, mat="reed",
                    sag=-0.08, frame=False)
    for i, (xx, yy) in enumerate(((bx0 + 0.45, 0.25), (bx0 + 0.45, -0.25), (bx0 + 1.05, 0.0))):
        p = M @ V((xx, yy, z_bed))
        kv.soft_sack(p, 0.8, 0.5, 0.42, yaw + (math.pi / 2 if i == 2 else 0.0), rng, mat="bark")
    if tm:
        tip = kv._shafts(M, bx1 - 0.25, bx1 + 1.2, z_bed - 0.1, R + 0.25, hw - 0.04, left)
        kv._harness(origin, fwd, left, tip, tm, hz_at, "mule", "shafts")


def vehicles(rng):
    """The three carts on land (kit_vehicles; the boats ship in their own GLB)."""
    # S2.veh.mule_cart_24305: the big two-wheeled cart being loaded, facing west, its two mules on long traces in front
    eid = "S2.veh.mule_cart_24305"
    v = E[eid]["pts"]
    front, rear, wheel = tuple(v["front"][:2]), tuple(v["rear"][:2]), tuple(v["wheel0"][:2])
    tm = team("S2.ani.cart_mule_lead_24192", "S2.ani.cart_mule_near_24215")
    with sb.entity(eid):
        if hasattr(kv, "open_cart"):
            b = kv.open_cart(front, rear, wheels=[wheel], team=tm, z_of=hz_at, rng=random.Random(24305),
                             load="mat_bundle", prop_stick=True)
            H["cart_kit"] = "kit_vehicles.open_cart"
            H["cart_bed"] = getattr(b, "bed", None)
        else:
            _mule_cart_fallback(front, rear, wheel, tm, random.Random(24305))
            H["cart_kit"] = "builder fallback (kit_vehicles' two-wheeled bed, shafts and harness)"
    # S2.veh.barrow_crates_25598: a barrow on the far street with two lattice crates, the rear one higher, its handles
    # at the man at its west end. choice: 2.0 m from the painted rear (the man) along its heading (the painted 0.72 m is
    # the far-row foreshortening), wheel R 0.42 under the crates
    eid = "S2.veh.barrow_crates_25598"
    v = E[eid]["pts"]
    rear = tuple(v["rear"][:2])
    d = (v["front"][0] - rear[0], v["front"][1] - rear[1])
    Ld = math.hypot(*d)
    front = (rear[0] + d[0] / Ld * 2.0, rear[1] + d[1] / Ld * 2.0)
    with sb.entity(eid):
        if hasattr(kv, "barrow_load"):
            kv.barrow_load(front, rear, z_of=hz_at, rng=random.Random(25598), load="crates", held=True, R=0.42)
            H["barrow_kit"] = "kit_vehicles.barrow_load"
        else:
            M, origin, fwd, left, L, s_w, z_deck, hw = kv._barrow(front, rear, None, hz_at, random.Random(25598), 0.42, 12,
                                                                  0.7, True, 1.0)
            yaw = math.degrees(math.atan2(fwd.y, fwd.x))
            for dxs, h_ in ((-0.25, 0.38), (0.25, 0.5)):
                p = M @ V((s_w + dxs, 0.0, z_deck))
                ko.slatted_box(p.x, p.y, p.z, 0.45, 0.5, h_, yaw, rng, lid=True)
            H["barrow_kit"] = "builder fallback (kit_vehicles' barrow frame and two slatted crates)"
    # S2.veh.cart_round_top_26035: a round-topped thing on a low frame on the far street (a parked cart under a round
    # arched cover, wheels hidden): kc.round_top_cart when the kit agent lands it, else a short bed on four legs under
    # kit_vehicles.barrel_cover (the needs list's choice). choice: bed 0.75 m, the cover's top 1.95 m
    eid = "S2.veh.cart_round_top_26035"
    v = E[eid]["pts"]
    front, rear = tuple(v["front"][:2]), tuple(v["rear"][:2])
    with sb.entity(eid):
        if hasattr(kc, "round_top_cart"):
            kc.round_top_cart(front, rear, hz_at, rng)
            H["round_kit"] = "kit_canal.round_top_cart"
        else:
            origin, fwd, left, L = kv._axis(rear, front)
            M = kv._frame_m(origin, fwd, min(hz_at(*front), hz_at(*rear)))
            with k.placed(M):
                for x in (0.12, L - 0.12):
                    for y in (-0.5, 0.5):
                        k.post("timber", True, x, y, -0.05, 0.75, 0.08, 0.01)
                for y in (-0.55, 0.55):
                    k.beam("timber", False, (0.0, y, 0.72), (L, y, 0.72), 0.1, 0.12, 0.015)
                k.bx("deck", True, (0.05, -0.58, 0.74), (L - 0.05, 0.58, 0.8))
                kv.barrel_cover(0.15, L - 0.15, 0.62, 0.8, 0.95, 1.95, hoops=6)
            H["round_kit"] = "builder fallback (a bed on legs under kit_vehicles.barrel_cover)"


# ---------------------------------------------------------------- parts of figures (rule 3)

def _seats_data():
    path = SEATS_JSON if os.path.exists(SEATS_JSON) else "/home/ran/3d_director/qingming/gen/sections/canal/seats.json"
    return json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}


def seats(rng):
    """Figures painted seated on something the map doesn't list: the seat is part of the figure (map/BUILDING.md rule
    3). The casting agent lists them (gen/sections/canal/seats.json) by kind: "stool" (kit_inner_city.stool), "folding_seat"
    (kc.folding_seat: 沿河雅座's own folding seats), "sacks" (the grain owner's: the mapped sack pile, built in props()),
    "none" (a mapped bench or stool, the ground, a floor or a boat). Its "footings" are hidden blocks a standing figure
    needs (the man standing waist-deep in the river): part of that figure. Seats never collide."""
    data = _seats_data()
    n = 0
    for mid, s in data.items():
        if mid in ("about", "footings") or mid not in FIG or not isinstance(s, dict):
            continue
        kind = s.get("kind") or ("stool" if float(s.get("seat_h") or 0) >= 0.15 else "none")
        if kind not in ("stool", "folding_seat"):
            continue
        seat_h = float(s.get("seat_h") or 0)
        sup = str(s.get("support") or FIG[mid].get("support") or "ground")
        bx_, by_ = s["X"], s["D"]
        if sup.startswith("terrace floor"):
            z = H["terrace_floor"]
        elif sup.startswith("upper floor"):
            z = H["yanhe"][3]
        else:
            z = hz_at(bx_, by_)
        if s.get("base_H") is not None:
            z = float(s["base_H"])   # the floor or ground under the seat point as the page has it (seat_fit.mjs)
        if s.get("top_H") is not None:
            # choice (details pass, fix-river 2026-10-13; gen/details/contacts/fix_standard.md rule 3): the seat's top
            # fitted to the sitter's seat point on the page less 0.008 m (seats.json top_H, from contact_fixes.json
            # "seats"), centred under it; the folding seat's webbing sags 0.041 m under its rails at the middle
            seat_h = float(s["top_H"]) - z + (0.041 if kind == "folding_seat" else 0.0)
        with sb.entity(mid):
            if kind == "folding_seat":
                kc.folding_seat(bx_, by_, z, float(s.get("facing_deg") or 0.0), rng, h=max(0.12, seat_h))
            else:
                ki.stool(bx_, by_, z, h=max(0.12, seat_h), s=0.32)
        n += 1
    for mid, fo in (data.get("footings") or {}).items():
        if mid not in FIG:
            continue
        hx, hy = [v / 2 for v in fo.get("size", [0.5, 0.5])]
        x, y, top = fo["X"], fo["D"], fo["top_H"]
        with sb.entity(mid):
            k.bx("hidden", True, (x - hx, y - hy, min(hz_at(x, y), top - 0.3) - 0.1), (x + hx, y + hy, top))
    return n


def figure_parts(rng):
    """Things painted with a figure and standing beside it on the ground: S2.fig.man_with_sticks_bank_24390's small
    bundle of upright sticks (catalogue §2d: a kit part, part of the figure). choice: 0.3 m east of his foot, 1.1 m."""
    mid = "S2.fig.man_with_sticks_bank_24390"
    f = FIG.get(mid)
    if not f:
        return
    x, y = f["X"] + 0.32, f["D"] + 0.05
    z = hz_at(x, y)
    with sb.entity(mid):
        if hasattr(kc, "stick_bundle"):
            kc.stick_bundle(x, y, z, rng)
        else:
            for i in range(7):
                a = i * 0.9
                kc.pole((x + 0.04 * math.cos(a), y + 0.04 * math.sin(a), z - 0.02),
                        (x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), z + 1.05 + 0.05 * (i % 3)), rng, r=0.012)
            sb.cyl("rope", False, (x, y, z + 0.55), (x, y, z + 0.6), 0.07, segs=6)


# ---------------------------------------------------------------- colliders and roads

def colliders(trees):
    """Invisible walls round the walkable area (build_choices.json edges), only on land: edge:west on the S3 seam's
    land parts (the north strip from the built bank top to the silk's top; the south bank from the silk's bottom to its
    shore), edge:east on the S1 seam (all land), edge:north along the silk's top edge, edge:south along the silk's
    bottom where it is land (the south bank in the west; the sliver east of the water's end). Across the water the shore
    walls (edge:shore) and the boats' rails close the walk. And each tree's trunk (part of the tree)."""
    sw, se, ne, nw = WALK
    n_seam = RIVER["banks"]["S2.grd.north_bank_20500"]["bank_top"][0]
    s_seam = RIVER["reaches"]["S2.water.bian_river_w"]["shore_s"][0]
    spit_end = RIVER["banks"]["S2.grd.south_bank_spit_22400"]["bank_top"][-1]
    e_end = RIVER["reaches"]["S2.water.bian_river_e"]["shore_n"][-1]
    walls = {"west": [(n_seam, nw), (sw, s_seam)], "east": [(se, ne)], "north": [(ne, nw)],
             "south": [(sw, spit_end), (e_end, se)]}
    H["edges"] = walls
    for side, segs in walls.items():
        with sb.entity(f"edge:{side}"):
            for (xa, ya), (xb, yb) in segs:
                if math.hypot(xb - xa, yb - ya) > 0.05:
                    k.board("hidden", True, (xa, ya), (xb, yb), 0.1, -2.0, 4.0)
    skip = ("shrub", "weed", "stems", "small_tree")
    for t in trees:
        if any(w in t["map_id"] for w in skip):
            continue
        x, d, s = t["X"], t["D"], t.get("scale", 1.0)
        z = hz_at(x, d)
        with sb.entity(t["map_id"]):
            if t["map_id"] == "S2.tree.willow_split_22285":
                # the split trunk's two legs (its custom points foot_w (22225, 290), foot_e (22345, 318) on the scan)
                for u, v in ((22225, 290), (22345, 318)):
                    D = (1565 - v) / 51.25
                    X = ux(u, D)
                    sb.cyl("hidden", True, (X, D, hz_at(X, D)), (x, d, z + 2.5), 0.26, segs=8)
                continue
            r = 0.3 * s if (t.get("height_m") or 0) >= 3.0 else 0.18
            sb.cyl("hidden", True, (x, d, z), (x + 0.12 * s, d + 0.08 * s, z + 2.5 * s), r, segs=8)


def roads(L):
    c = [tuple(p) for p in L["route"]["centre"]]
    (ax, ay), (bx_, by) = c[0], c[1]
    head = (ax - (bx_ - ax) * 2, ay - (by - ay) * 2)
    (ax, ay), (bx_, by) = c[-2], c[-1]
    tail = (bx_ + (bx_ - ax) * 2, by + (by - ay) * 2)
    return [([head] + c + [tail], 1.6), (line("S2.road.far_street_26200", "centre"), 1.3)]


# ---------------------------------------------------------------- build / export

def build(scene, seed=2):
    sb.B = sb.Buckets(strict=True)
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    ents = river_lines()
    frame = json.load(open(FRAME_JSON, encoding="utf-8"))
    Hw = frame["supports"]["water"]["H"]
    RIVER["H"] = Hw
    # the river: one strip per reach at the frame's water H between its shores as built (the boats agent's plan),
    # stopped on the seams, the middle and east reaches run on south under the mist; the shore walls along every real
    # shore (edge:shore, shore_walls()), not along the reaches' run-on lines
    strips = []
    quad = kb.water_quad(L, Hw)
    for wid in REACHES:
        strips.append(kb.water_strip(ents[wid], frame, wid, quad=quad, seams=("west", "east"), walls=False))
    ground(rng, roads(L), [ws.polygon for ws in strips])
    n_walls = shore_walls(Hw)
    west_bank(rng)
    south_bank(rng)
    houses(rng)
    terrace(rng)
    eatery(rng)
    halls(rng)
    far_street(rng)
    paper_shop(rng)
    yard_frames(rng)
    east_wharf(rng)
    wharf_frames(rng)
    props(rng)
    vehicles(rng)
    n_seats = seats(rng)
    figure_parts(rng)
    colliders(L["trees"])

    check_inside()
    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("canal__" + name)
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
                    uu, vv = sb.box_uv(me.vertices[me.loops[li].vertex_index].co, poly.normal, tile)
                    uvl.data[li].uv = (round(uu * UV_Q) / UV_Q, round(vv * UV_Q) / UV_Q)
        me.materials.append(sb.make_material(mat_name))
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new("g_" + name, me)
        coll.objects.link(ob)
        stats[name] = sum(len(p.vertices) - 2 for p in me.polygons)
    # the ground: one smooth mesh, UVMap = world position / tile, Blend.x = how bare
    verts, faces, bare = H["ground"]
    me = bpy.data.meshes.new("canal__ground__col")
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    tile = sb.MATERIALS["ground"][1]
    uv0, uv1 = me.uv_layers.new(name="UVMap"), me.uv_layers.new(name="Blend")
    for li, lp in enumerate(me.loops):
        co = verts[lp.vertex_index]
        uv0.data[li].uv = (round(co.x / tile * UV_Q) / UV_Q, round(co.y / tile * UV_Q) / UV_Q)
        uv1.data[li].uv = (bare[lp.vertex_index], 0.0)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.materials.append(sb.make_material("ground"))
    coll.objects.link(bpy.data.objects.new("g_ground__col", me))
    gt = sum(len(p.vertices) - 2 for p in me.polygons)
    stats["ground__col"] = gt
    kb.water_mesh(bpy, strips, coll=coll)
    stats["water"] = sum(ws.tris for ws in strips)
    owners = dict(sb.B.tris)
    owners["ground"] = owners.get("ground", 0) + gt
    for ws in strips:
        owners[ws.map_id] = owners.get(ws.map_id, 0) + ws.tris
    placed_ = {"about": "Written by blender/canal_scene.py build(); never edit. Triangles per owner: map IDs, "
                        "'edge:*' (invisible colliders closing the walkable area; edge:shore along the water) and "
                        "'ground'. The boats are in their own GLB (gen/sections/canal/web_build/canal_boats.json). "
                        "tools/loyalty_check.mjs compares it with the map (map/BUILDING.md).",
               "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed_, f, indent=1, ensure_ascii=False)
    print("WATER " + json.dumps({"tris": [ws.tris for ws in strips], "walls": n_walls, "H": Hw, "plan": RIVER["plan"],
                                 "notes": [n for ws in strips for n in ws.notes], "seats": n_seats,
                                 "cart": H.get("cart_kit"), "barrow": H.get("barrow_kit"), "round": H.get("round_kit"),
                                 "edges": {k_: [[list(map(lambda c: round(c, 2), a)), list(map(lambda c: round(c, 2), b))]
                                                for a, b in v] for k_, v in H["edges"].items()},
                                 "terrace_floor": round(H.get("terrace_floor", 0), 3), "owner_seat": H.get("owner_seat"),
                                 "fire_tower": str(H.get("fire_tower", ("",) * 6)[5])}), flush=True)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "buckets": stats}


def export(scene, path):
    """The raw GLB through street_b1.export_collection, written first to a local temp file and copied to `path` in
    1 MB chunks: a single 2 MB write over the WSL share failed intermittently here (OSError 22)."""
    import shutil
    import tempfile
    import time
    tmp = os.path.join(tempfile.gettempdir(), "canal_raw_%d.glb" % os.getpid())
    sb.export_collection(scene, COLL, tmp)
    for attempt in range(4):
        try:
            with open(tmp, "rb") as fi, open(path, "wb") as fo:
                shutil.copyfileobj(fi, fo, 1 << 20)
            break
        except OSError as e:
            print(f"WARNING export copy attempt {attempt + 1}: {e}", flush=True)
            time.sleep(2)
    os.remove(tmp)
    return path
