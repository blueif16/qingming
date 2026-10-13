"""The Rainbow Bridge (S3, scan u 15500-20500): 十千脚店 and its 彩楼欢门, the river with its eleven boats, the bridge
with its crowded deck, the shops at both of its feet and along both banks; a walkable web scene. Composed from the
Song construction kit (blender/song_kit.py), S3's area kits (blender/kit_rainbow_bridge_area.py: 十千脚店 and its
scaffold; blender/kit_rainbow_bridge_props.py: the props and the handcart), the bridge factory's set piece
(blender/kit_rainbow_bridge.py), the vehicle kit (kit_vehicles.py), the other areas' kits (kit_inner_city,
kit_outer_road, kit_outer_road_2) and the boat kit's water (kit_boats.water_strip; the boats themselves ship in their
own GLB from the layout through blender/build_boats.py, with their options in build_choices.json `boats`).

build(scene) creates collection "rainbow_bridge_scene": one mesh per (material, collide) bucket ("g_<material>__col" /
"g_<material>__nocol"; "hidden__col" is collider-only; each edge wall its own mesh), the ground, and the river's water
strips. export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships it (and the boats GLB). Built
headless only: qingming/tools/build_scene.sh rainbow_bridge.

Positions come from the scroll map through sections/rainbow_bridge/layout.json (tools/map_layout.mjs, with the
recorded moves of build_choices.json, merged from gen/sections/rainbow_bridge/choices/ by merge_choices.py): X east,
Y north (depth), Z up, in the one world frame. Real size, painted place (map/BUILDING.md rule 5): heights, storeys,
openings and the sizes of things are real; frontages and depths come from the painted footprints; buildings far up
the silk keep real heights and run back past the silk's top edge (into the mist) where the painted strip is too
shallow. What the strokes can't give is a builder choice, marked "choice:" where it is made and listed in
sections/rainbow_bridge/notes.md.

Data this builder reads besides the layout (each written by one Run 2 agent; the builder falls back when one is
missing): gen/sections/rainbow_bridge/bridge_params.json (the bridge kit's params: the three 表木), river_plan.json
(the shores and bank tops as built, the far bank, the seam walls), props_table.json (every prop's kit part),
seats.json (seats painted with their sitters).

Loyalty: every piece of geometry is built inside `sb.entity(<map id>)` (strict buckets); build() writes
sections/rainbow_bridge/placed.json for tools/loyalty_check.mjs. Where nothing is painted, invisible edge walls close
the walkable area and the page paints what lies beyond.
"""
import importlib
import inspect
import json
import math
import os
import random

import bpy

import kit_boats as kb
import kit_inner_city as ki
import kit_outer_road as ko
import kit_outer_road_2 as k2
import kit_rainbow_bridge as krb
import kit_vehicles as kv
import song_kit as k
import street_b1 as sb
from song_kit import V

try:                                 # S3's area kits (Run 2 agents); the builder runs without them while they're made
    import kit_rainbow_bridge_area as ka
except ImportError:
    ka = None
try:
    import kit_rainbow_bridge_props as kp
except ImportError:
    kp = None
try:                                 # the shared parts of factory (c) (catalogue.md, order (c) c2): used once they land
    import kit_common as kc
except ImportError:
    kc = None


def has(mod, fn, *kws):
    """A kit function that exists and takes these keyword arguments (the factories' fixed signatures, catalogue.md
    order (c)): the builder calls the new part when it has landed and its stand-in until then."""
    f = getattr(mod, fn, None) if mod is not None else None
    if f is None:
        return None
    try:
        ps = inspect.signature(f).parameters
    except (TypeError, ValueError):
        return f
    return f if all(k_ in ps for k_ in kws) else None

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SEC = QM + r"\sections\rainbow_bridge"
GEN = QM + r"\gen\sections\rainbow_bridge"
LAYOUT_JSON = SEC + r"\layout.json"
PLACED_JSON = SEC + r"\placed.json"
FRAME_JSON = QM + r"\map\frames\S3.json"
BRIDGE_PARAMS = GEN + r"\bridge_params.json"
BRIDGE_PLAN = GEN + r"\bridge_plan.json"
RIVER_PLAN = GEN + r"\river_plan.json"
PROPS_TABLE = GEN + r"\props_table.json"
SEATS_JSON = GEN + r"\seats.json"
COLL = "rainbow_bridge_scene"
UP = V((0, 0, 1))
RUN_ON = 16.0                       # the ground runs this far past the silk's top and bottom edges, under the mist
SEAM_PAST = 0.5                     # and this far past the seams (S4b west, S2 east), dipping 0.12 m toward them

# the entities others build (the tavern kit, the bridge kit's poles, the boats GLB): the props table skips them
TAVERN = {"river_hall": "S3.bld.tavern_river_hall_15540", "wing": "S3.bld.tavern_wing_16300",
          "rear_hall": "S3.bld.tavern_rear_hall_16560", "gate": "S3.bld.tavern_gate_16870",
          "cailou": "S3.str.cailou_huanmen_16880", "chazi": "S3.str.chazi_barrier_16800",
          "gate_fence": "S3.str.gate_fence_16955", "lamp_box": "S3.prop.lamp_box_jiaodian_17035",
          "xinjiu_pole": "S3.prop.xinjiu_flagpole_17630"}
POSTS = ("S3.prop.bridge_end_post_19026", "S3.prop.bridge_end_post_20050", "S3.prop.bridge_end_post_far_19176")
BRIDGE = "S3.str.rainbow_bridge"
TAVERN_N_X = (146.4, 148.8)        # the north-bank tavern as built (north_bank(): narrowed to clear the north ramp)
UPPER_FLOOR = 3.83                  # the frame's support `upper floor: S3.bld.tavern_river_hall_15540`
FAR_DECK = 0.39                     # the frame's support `upper floor: S3.bld.far_bank_hall_18520` (its raised deck)

LAYOUT, E, FIG, WALK, EXTENT, H, RIVER, PLAN, STATE = {}, {}, {}, [], {}, {}, {}, {}, {}


# ---------------------------------------------------------------- the map

def fp(eid):
    return [tuple(p[:2]) for p in E[eid]["footprint"]]


def P(eid):
    return tuple(E[eid]["pos"][:2])


def line(eid, role):
    return [tuple(p[:2]) for p in E[eid]["lines"][role]]


def load_json(path, default=None):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def derive(L):
    E.clear()
    E.update(L["entities"])
    FIG.clear()
    FIG.update({f["map_id"]: f for f in L["figures"]})
    FIG.update({f["id"]: f for f in L["figures"]})
    sw, se, ne, nw = (tuple(c) for c in L["painted_area"]["corners"])
    WALK[:] = [sw, se, ne, nw]
    xs = [p[0] for p in WALK]
    EXTENT.update(x0=math.floor(min(xs)) - 2, x1=math.ceil(max(xs)) + 2, y0=math.floor(sw[1] - RUN_ON),
                  y1=math.ceil(nw[1] + RUN_ON))
    PLAN.clear()
    PLAN.update(load_json(RIVER_PLAN, {}) or {})


def x_on(a, b, y):
    return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])


def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ((dx * dx + dy * dy) or 1.0)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def seg_closest(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ((dx * dx + dy * dy) or 1.0)))
    return (a[0] + t * dx, a[1] + t * dy)


def poly_dist(p, ln):
    if len(ln) == 1:
        return math.hypot(p[0] - ln[0][0], p[1] - ln[0][1])
    return min(seg_dist(p, a, b) for a, b in zip(ln, ln[1:]))


def poly_closest(p, ln):
    best = None
    for a, b in zip(ln, ln[1:]):
        q = seg_closest(p, a, b)
        d = math.hypot(p[0] - q[0], p[1] - q[1])
        if best is None or d < best[0]:
            best = (d, q)
    return best


def pip(p, poly):
    x, y = p
    ins = False
    for (ax, ay), (bx_, by) in zip(poly, poly[1:] + poly[:1]):
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx_ - ax) / (by - ay):
            ins = not ins
    return ins


# ---------------------------------------------------------------- the river as built

WATERS = ("S3.water.bian_west_15500", "S3.water.bian_river_18300")
SOUTH_TOPS = ("S3.grd.bank_s_15500", "S3.grd.south_bank_19300", "S3.grd.south_bank_20120")
NORTH_TOPS = ("S3.grd.far_bank_seam_15500", "S3.grd.bank_n_16150", "S3.grd.far_bank_18450", "S3.grd.north_bank_20250")


def _clip_north(shore, tops):
    """The lead's note (build_rules.md): on S3's north side the estimated shores map up to 0.86 m north of the bank
    tops, so the water plane goes only to the bank-top line: a shore point whose nearest bank-top point lies south
    of it (within 2 m) is taken to that bank-top point."""
    out = []
    for p in shore:
        best = None
        for t in tops:
            c = poly_closest(p, t) if len(t) > 1 else (math.hypot(p[0] - t[0][0], p[1] - t[0][1]), t[0])
            if best is None or c[0] < best[0]:
                best = c
        out.append(best[1] if best and best[0] < 2.0 and best[1][1] < p[1] else p)
    return out


def river_lines():
    """The water entities' shores as built and the banks for the heightfield: the river agent's
    gen/sections/rainbow_bridge/river_plan.json when it exists, else the mapped lines (north shores clipped to the
    bank tops; bank tops 1 m inland where none is mapped)."""
    plan = PLAN.get("water") or {}
    waters = {}
    for wid in WATERS:
        w = dict(E[wid])
        if wid in plan:
            ss, sn = plan[wid]["shore_s"], plan[wid]["shore_n"]
            seams = tuple(plan[wid].get("seams") or ("west", "east"))
        else:
            ss = line(wid, "shore_s")
            sn = _clip_north(line(wid, "shore_n"), [line(t, "bank_top") for t in NORTH_TOPS])
            seams = ("west", "east")
        w["lines"] = {"shore_s": [list(p[:2]) for p in ss], "shore_n": [list(p[:2]) for p in sn]}
        waters[wid] = (w, seams)
    banks = PLAN.get("banks") or {}
    if banks.get("south") and banks.get("north"):
        south = ([tuple(p[:2]) for p in banks["south"]["shore"]], [tuple(p[:2]) for p in banks["south"]["top"]])
        north = ([tuple(p[:2]) for p in banks["north"]["shore"]], [tuple(p[:2]) for p in banks["north"]["top"]])
    else:
        s_sh = [tuple(p) for p in waters[WATERS[0]][0]["lines"]["shore_s"]] + \
               [tuple(p) for p in waters[WATERS[1]][0]["lines"]["shore_s"]][1:]
        n_sh = [tuple(p) for p in waters[WATERS[0]][0]["lines"]["shore_n"]] + \
               [tuple(p) for p in waters[WATERS[1]][0]["lines"]["shore_n"]][1:]
        s_top = [p for t in SOUTH_TOPS for p in line(t, "bank_top")]
        n_top = [p for t in NORTH_TOPS for p in line(t, "bank_top")]
        south, north = (s_sh, s_top), (n_sh, n_top)
    polys = []
    for wid, (w, _) in waters.items():
        ss, sn = w["lines"]["shore_s"], w["lines"]["shore_n"]
        polys.append([tuple(p) for p in ss] + [tuple(p) for p in reversed(sn)])
    RIVER.update(waters=waters, south=south, north=north, polys=polys, H=E[WATERS[0]]["H"])


# ---------------------------------------------------------------- ground

def ground(rng, roads):
    """Heightfield over the section: low undulation, the roads worn down, each bank falling from its bank-top line
    (H 0) to its shore at the water's H (a sandy slope), the river bed under the water. Cells within 3 m of a shore
    are 0.5 m (crack-free 1 m cells elsewhere). The ground is the painted surface, not a model (owner "ground"; the
    banks are their grd entities' ground). It stops 0.5 m past both seams (S4b west, built; S2 east, built at the
    same time), dipping 0.12 m toward them (the neighbour's ground lies on top), and runs 16 m past the silk's top
    and bottom edges under the mist."""
    X0, X1, Y0, Y1 = EXTENT["x0"], EXTENT["x1"], EXTENT["y0"], EXTENT["y1"]
    ph = [rng.uniform(0, 6.283) for _ in range(6)]
    WH = RIVER["H"]
    (s_sh, s_top), (n_sh, n_top) = RIVER["south"], RIVER["north"]
    polys = RIVER["polys"]
    shores = [s_sh, n_sh]

    def bank_w(p, shore, top):
        best = poly_closest(p, shore)
        if best is None:
            return 1e9, 1.0
        w = poly_dist(best[1], top) if len(top) > 1 else 1.0
        return best[0], max(0.35, min(3.0, w if w < 3.0 else 1.0))

    def wet(p):
        # past a seam the river runs on (the water strips stop at the seams): test the point carried back onto the
        # seam, so the 0.5 m of ground past it is river bed, not a strip of land across the river at H -0.1 (run 3:
        # it stood 0.6 m above the neighbour's water and let you step off the moored boat's stern onto it)
        x, y = p
        sw_, se_, ne_, nw_ = WALK
        xw, xe = x_on(sw_, nw_, y), x_on(se_, ne_, y)
        q = (max(xw + 0.05, min(xe - 0.05, x)), y)
        return any(pip(q, poly) for poly in polys)

    def h(x, y):
        z = (0.03 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.02 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.012 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = min((poly_dist((x, y), ln) / hw for ln, hw in roads), default=9.0)
        if dr < 1.0:
            z = z * (0.4 + 0.6 * dr) - 0.03 * (1 - dr)
        p = (x, y)
        if wet(p):
            ds = min(poly_dist(p, s_sh), poly_dist(p, n_sh))
            return WH - 0.05 - 0.9 * _smooth(0.0, 2.0, ds)
        for shore, top in ((s_sh, s_top), (n_sh, n_top)):
            ds, w = bank_w(p, shore, top)
            if ds < w + 0.6:
                return WH + (z - WH) * _smooth(0.0, w, ds)
        return z

    def bare(x, y):
        wob = 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5]) + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1])
        b = max((1 - _smooth(hw * 0.55, hw * 1.05, poly_dist((x, y), ln) + wob) for ln, hw in roads), default=0.0)
        ds = min(poly_dist((x, y), s_sh), poly_dist((x, y), n_sh))
        return max(b, 0.85 * (1 - _smooth(0.5, 2.5, ds)))   # the wet sandy bank

    sw, se, ne, nw = WALK

    def hz(x, y):
        dw = x - x_on(sw, nw, y)
        de = x_on(se, ne, y) - x
        return h(x, y) - 0.12 * (1 - _smooth(-0.5, 1.5, dw)) - 0.12 * (1 - _smooth(-0.5, 1.5, de))

    nx, ny = X1 - X0, Y1 - Y0

    def fine(i, j):
        c = (X0 + i + 0.5, Y0 + j + 0.5)
        return min(poly_dist(c, ln) for ln in shores) < 3.0

    def inside(i, j):
        cx, cy = X0 + i + 0.5, Y0 + j + 0.5
        if not (x_on(sw, nw, cy) - SEAM_PAST - 0.5 < cx < x_on(se, ne, cy) + SEAM_PAST + 0.5):
            return False
        if wet((cx, cy)) and min(poly_dist((cx, cy), s_sh), poly_dist((cx, cy), n_sh)) > 2.6:
            return False
        return True

    keep = {(i, j) for j in range(ny) for i in range(nx) if inside(i, j)}
    fn = {(i, j) for (i, j) in keep if fine(i, j)}
    vid, verts = {}, []

    def v(a, b):   # lattice point (a, b) in half metres
        if (a, b) not in vid:
            vid[(a, b)] = len(verts)
            x, y = X0 + a / 2, Y0 + b / 2
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
    H["h"] = hz
    H["ground"] = (verts, faces, [bare(p.x, p.y) for p in verts])
    return hz


def roads(L):
    """The worn ground of the route's land stretches (its deck stretch is the bridge's), the tavern's forecourt and
    the street in front of the open shop."""
    rt = E["S3.road.main"]
    c, hs = rt["lines"]["centre"], rt["lines_H"]["centre"]
    south = [tuple(p[:2]) for p, hh in zip(c, hs) if hh <= 0.01 and p[1] < 15]
    north = [tuple(p[:2]) for p, hh in zip(c, hs) if hh <= 0.01 and p[1] >= 15]
    (ax, ay), (bx_, by) = south[0], south[1]
    head = (ax - (bx_ - ax) * 0.5, ay - (by - ay) * 0.5)
    out = [([head] + south, 4.0)]
    if len(north) > 1:
        out.append((north, 2.4))
    out.append((line("S3.road.tavern_front_16620", "centre"), 3.0))
    out.append((line("S3.road.south_street_20250", "centre"), 2.4))
    return out


def hz_at(x, y):
    return H["h"](x, y)


def bldg_z(eid):
    return min(hz_at(*p) for p in fp(eid))


# ---------------------------------------------------------------- what things stand on

def z_at(X, D, ent=None):
    """The z an entity's base stands on at (X, D): the built bridge deck, the riverside hall's upper floor, the
    far-bank hall's raised deck, the top of the table it stands on (its built top), a boat's roof or deck (the
    layout's H: boats are in their own GLB), or the ground's heightfield."""
    s = ((ent or {}).get("support") or "ground")
    if s.startswith("bridge deck") or s.startswith("animal") or s.startswith("sedan"):
        br = STATE.get("bridge")
        z = br.deck_H(X, D) if br else None
        return z if z is not None else hz_at(X, D)
    if s.startswith("upper floor: S3.bld.tavern_river_hall"):
        return STATE.get("upper_floor_z", UPPER_FLOOR)
    if s.startswith("upper floor: S3.bld.far_bank_hall"):
        return STATE.get("far_deck_z", FAR_DECK)
    if s.startswith("table top: "):
        tid = s[len("table top: "):].strip()
        top = STATE.get("tops", {}).get(tid)
        if top is not None:
            return top
        base = E.get(tid)
        if base is not None:
            return z_at(base["pos"][0], base["pos"][1], base) + max(0.3, float(ent.get("H") or 0) - float(base.get("H") or 0))
        return hz_at(X, D) + float(ent.get("H") or 0)
    if s.startswith("boat") or s == "water":
        return float((ent or {}).get("H") or 0.0)
    return hz_at(X, D)


# ---------------------------------------------------------------- a placement check (not geometry)

RECTS = {}


def mark(eid, corners):
    RECTS.setdefault(eid, []).append([tuple(c[:2]) for c in corners])


def check_inside():
    """Print every painted figure and animal standing inside a closed wall rectangle (open halls and shops hold their
    customers; nobody should stand in a closed wall)."""
    out = []
    things = [(f["map_id"], f["X"], f["D"], f.get("support") or "") for f in LAYOUT["figures"]]
    things += [(k_, (e["pts"]["fore"][0] + e["pts"]["hind"][0]) / 2, (e["pts"]["fore"][1] + e["pts"]["hind"][1]) / 2, "")
               for k_, e in E.items() if e["kind"] == "animal" and "fore" in e.get("pts", {})]
    for mid, x, y, sup in things:
        if sup.startswith(("boat", "cart", "perched", "upper floor")):
            continue
        for owner, polys in RECTS.items():
            for q in polys:
                if pip((x, y), q):
                    out.append([mid, owner, round(x, 2), round(y, 2)])
    print("INSIDE " + json.dumps(out), flush=True)
    return out


# ---------------------------------------------------------------- buildings: helpers

def placed(origin, yaw, z=0.0):
    return k.placed(k.frame(origin[0], origin[1], z, yaw))


def front_frame(eid, min_depth=2.2, depth=None):
    """A building's own frame on its painted front (sw -> se): origin at sw, x along the front, y back (north):
    (origin, yaw_deg, W, depth). depth: the painted depth (sw to the back's midpoint, square to the front), at least
    min_depth, or `depth` when given (a choice: real depth where the silk's edge cuts the painted one)."""
    sw, se, ne, nw = fp(eid)
    yaw = math.degrees(math.atan2(se[1] - sw[1], se[0] - sw[0]))
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    W = (se[0] - sw[0]) * c + (se[1] - sw[1]) * s
    back = ((ne[0] + nw[0]) / 2, (ne[1] + nw[1]) / 2)
    dp = -(back[0] - sw[0]) * s + (back[1] - sw[1]) * c
    dp = depth if depth is not None else max(min_depth, dp)
    return sw, yaw, W, dp


def local_rect(origin, yaw, x0, x1, y0, y1):
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    return [(origin[0] + x * c - y * s, origin[1] + x * s + y * c) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]


def eave_h(eid, default):
    """A mapped eave height above the base when the strokes give one at the street's scale; the default otherwise."""
    pts = E[eid].get("pts", {})
    hs = [p[2] for n, p in pts.items() if n.endswith("_eave") and len(p) > 2]
    return max(default, max(hs)) if hs else default


# ---------------------------------------------------------------- the tavern (十千脚店): the area kit

def tavern(rng):
    ents = {role: (mid, E[mid]) for role, mid in TAVERN.items() if mid in E}
    if ka is None or not hasattr(ka, "shiqian_jiaodian"):
        print("WARNING kit_rainbow_bridge_area.shiqian_jiaodian missing: 十千脚店 not built this run", flush=True)
        return
    res = ka.shiqian_jiaodian(ents, hz_at, rng, upper_floor=UPPER_FLOOR) or {}
    for mid, polys in (res.get("rects") or {}).items():
        for q in polys:
            mark(mid, q)
    STATE["upper_floor_z"] = res.get("upper_floor_z", UPPER_FLOOR)
    STATE["tavern_tris"] = res.get("tris", {})


# ---------------------------------------------------------------- the bridge (the factory's set piece)

def bridge(frame):
    """kit_rainbow_bridge.build from the layout entity and the frame, with the bridge-fit agent's params (the three
    表木 as their own entities). The deck's height function serves z_at (props, vehicles and seats on the deck)."""
    bp = load_json(BRIDGE_PARAMS, {}) or {}
    params = dict(bp.get("params") or {})
    posts = []
    for q in params.get("posts") or [{"id": pid} for pid in POSTS]:
        pid = q.get("id")
        e = E.get(pid) if pid else None
        if e is None and ("X" not in q or "D" not in q):
            continue
        X = q.get("X", e["pos"][0] if e else None)
        D = q.get("D", e["pos"][1] if e else None)
        posts.append({"id": pid, "X": X, "D": D, "H": q.get("H", hz_at(X, D))})
    params["posts"] = posts
    br = krb.build(E[BRIDGE], frame, entity_id=BRIDGE, params=params)
    STATE["bridge"] = br
    s = br.summary()
    print("BRIDGE " + json.dumps({k_: s[k_] for k_ in ("length_m", "span_m", "rise_m", "crown_H", "width_m",
                                                     "max_slope_deg", "soffit_above_water_m", "triangles")}), flush=True)
    for n in s["notes"]:
        print("BRIDGE_NOTE " + n, flush=True)
    return br


# ---------------------------------------------------------------- the south bank east of the tavern

def south_bank(rng):
    # S3.str.tiled_wall_18450: a plain wall ~1.8 m with a coping of round tiles, running back (north) from the silk's
    # bottom edge beside the big building's west eave, then turning east at its north end
    ft = line("S3.str.tiled_wall_18450", "foot")
    with sb.entity("S3.str.tiled_wall_18450"):
        for a, b in zip(ft, ft[1:]):
            za = min(hz_at(*a), hz_at(*b))
            ko.earth_wall(a, b, za, 1.75, 0.34, rng, mat="plaster", foot_mat="stone", foot=0.25)
            L = math.hypot(b[0] - a[0], b[1] - a[1])
            yaw = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
            with placed(a, yaw, za):   # the coping: a small tiled gable roof along the wall's top
                k.gable_roof(-0.12, L + 0.12, -0.32, 0.32, 1.7, 1.98, over=0.12, lift=0.03, thick=0.07, ns=3, nt=2,
                             ornament_s=0.25)

    # S3.bld.bridge_foot_hall_19000: the biggest roof on the south bank, an overhanging-gable (悬山) roof whose ridge
    # runs back (north) from an open south gable at the silk's edge (a log tie beam on four columns, a king post with a
    # hanging fish) to a north gable with a ridge-end ornament at the bridge's foot: S4b's south-row hall type
    eid = "S3.bld.bridge_foot_hall_19000"
    sw, se, ne, nw = fp(eid)
    z = bldg_z(eid)
    # choice: square to the frame's axes on the footprint's mean sides (its painted sides recede); eave 3.4, rise 2.4
    # at the south gable, the north gable 0.8 higher (the ridge rises to the north, as S4b's south-row halls); its
    # front columns where the open south gable's tie beam rests (u 18708-19003 of the gable's 18505-19260)
    x0, x1 = (sw[0] + nw[0]) / 2 + 0.3, (se[0] + ne[0]) / 2 - 0.3
    y0, y1 = min(sw[1], se[1]), max(nw[1], ne[1])
    with sb.entity(eid):
        k2.south_row_hall(x0, x1, y0, y1, rng, z0=z, eave=3.4, rise=2.4, north_lift=0.8,
                          cols=[x0 + (x1 - x0) * f for f in (0.0, 0.27, 0.5, 0.73, 1.0)], fish=True)
    # (open to the south: its gable figure stands in the open front; no closed-wall rectangle to check)

    # S3.bld.mat_shed_19160: a shed with a plaited-mat gable roof right at the water's edge, people eating at tables
    # under it, a mat flap closing its west gable end and a mat panel at its east end
    eid = "S3.bld.mat_shed_19160"
    sw, se, ne, nw = fp(eid)
    z = bldg_z(eid)
    with sb.entity(eid):
        # choice: front eave 2.1 (painted 1.9 from the frame), ridge 2.9 along x at the shed's middle
        cx0, cx1 = min(sw[0], nw[0]), max(se[0], ne[0])
        y0, y1 = min(sw[1], se[1]), max(nw[1], ne[1])
        ym = (y0 + y1) / 2
        k2.open_mat_shed([(cx0, y0), (cx1, y0), (cx1, ym), (cx0, ym)], z, 2.1, 2.85, rng, over=0.3)
        k2.open_mat_shed([(cx0, ym), (cx1, ym), (cx1, y1), (cx0, y1)], z, 2.85, 2.1, rng, over=0.3,
                         posts=[(cx0, y1, 0.0), (cx1, y1, 0.0)])
        for x, mat_ in ((cx0 - 0.05, "reed"), (cx1 + 0.05, "reed")):   # the gable ends' mat flap and panel
            k.add(mat_, False, [V((x, y0 - 0.2, z + 0.35)), V((x, y1 + 0.2, z + 0.35)), V((x, y1 + 0.2, z + 2.0)),
                                V((x, ym, z + 2.8)), V((x, y0 - 0.2, z + 2.0))], [(0, 1, 2, 3, 4)])
            k.add(mat_, False, [V((x, y0 - 0.2, z + 2.0)), V((x, ym, z + 2.8)), V((x, y1 + 0.2, z + 2.0)),
                                V((x, y1 + 0.2, z + 0.35)), V((x, y0 - 0.2, z + 0.35))], [(0, 1, 2, 3, 4)])

    # S3.bld.mat_shed_19530: a low shed under the arch, a single-pitch mat roof sloping down to its front over a
    # front of vertical boards and door-like panels
    eid = "S3.bld.mat_shed_19530"
    # its painted depth (1.4 m): the men waving at the big boat stand on the bank right behind it
    o, yaw, W, dp = front_frame(eid, min_depth=1.3)
    z = bldg_z(eid)
    with sb.entity(eid):
        # choice: front eave 2.0 (painted 1.2-1.4 at 0.6 of the street's scale), back 2.7
        with placed(o, yaw, 0.0):
            k2.open_mat_shed([(0, 0), (W, 0), (W, dp), (0, dp)], z, 2.0, 2.7, rng, over=0.35)
            bw = has(kc, "board_wall", "battens", "doors")
            if bw:                   # vertical boards and door-like panels (factory (c)'s board_wall)
                bw((0, 0.05), (W, 0.05), z, z + 1.95, rng, battens=2, ragged=True,
                   doors=((0.25 * W, 0.45 * W), (0.62 * W, 0.8 * W)), collide=True)
            else:
                ki.wall_bays((0, 0.05), (W, 0.05), z, z + 1.95, [0, 0.25, 0.45, 0.62, 0.8, 1.0],
                             ["wall", "door", "wall", "door", "wall"], rng, mat="deck")
            for xx in (0.0, W):
                k.board("deck", True, (xx, 0.1), (xx, dp - 0.1), 0.06, z, z + 2.0)
            k.board("deck", True, (0.1, dp), (W - 0.1, dp), 0.06, z, z + 2.0)
    mark(eid, local_rect(o, yaw, 0, W, 0, dp))

    # S3.bld.open_shop_20000: a long single-storey tiled building along the south bank east of the big building, a
    # hipped west end, an open front under the eave (people at long tables and benches), plain wall panels and doors
    # in the middle, a wall of vertical boards at its east end
    eid = "S3.bld.open_shop_20000"
    o, yaw, W, dp = front_frame(eid)
    z = bldg_z(eid)
    with sb.entity(eid), placed(o, yaw, 0.0):
        # choice: plinth 0.25, eave 3.0, rise 1.7, hip roof (the painted hipped west end; the east end hidden by the
        # tree); front bays as painted: open, open, wall/door panels (u 20016-20094), open, the board wall (east)
        cols = [0.0, 0.18, 0.4, 0.55, 0.7, 0.9, 1.0]
        kinds = ["open", "open", "door", "wall", "open", "wall"]
        k2.hall(0.0, W, 0.0, dp, rng, z0=z, plinth=0.25, eave=3.0, rise=1.7, cols=[W * f for f in cols], kinds=kinds,
                roof="hip", side=("wall", "wall"), back="wall", steps=False)
        k.board("hidden", True, (0.3, dp - 0.35), (W - 0.3, dp - 0.35), 0.1, z, z + 3.0)   # the open front's back

    # S3.bld.front_roof_19800: a tiled roof at the silk's bottom edge in front of the open shop, its top edge along the
    # shop's floor line and a hip at its east end; two posts at its west end. choice: a pent roof falling south from
    # 3.2 m at its painted top edge to 2.5 m at the silk's edge, on posts, closed behind (its rooms lie off the silk)
    eid = "S3.bld.front_roof_19800"
    sw, se, ne, nw = fp(eid)
    z = bldg_z(eid)
    with sb.entity(eid):
        x0, x1 = min(sw[0], nw[0]), max(se[0], ne[0])
        yl, yh = min(sw[1], se[1]), max(nw[1], ne[1])
        ki.lean_to(x0, x1, yl - 0.4, yh, z + 2.5, z + 3.2)
        for x in (x0 + 0.3, x0 + 1.2):
            sb.cyl("timber", True, (x, yl + 0.3, z), (x, yl + 0.3, z + 2.55), 0.1, 0.09, segs=8)
        k.board("plaster", True, (x0, yh - 0.12), (x1, yh - 0.12), 0.14, z, z + 3.15)
        k.board("plaster", True, (x0 + 1.6, yl + 0.4), (x1, yl + 0.4), 0.14, z, z + 2.5)
        k.board("plaster", True, (x0 + 1.6, yl + 0.4), (x0 + 1.6, yh - 0.12), 0.14, z, z + 2.9)


# ---------------------------------------------------------------- the far (north) bank west of the bridge

def far_hall_row(eid, rng, kinds, cols, roof="gable", eave=2.9, rise=1.6, depth=4.2, side=("open", "open"),
                 back="wall", z_ext=0.0, near=False):
    """One front of the far bank's long roofs (and the north bank's shops), at real height in its painted frontage;
    its depth runs back past the silk's top edge (choice: `depth`, real, where the painted strip is 1.9-2.1 m).
    near=True: S4b's full hall (kit_outer_road_2.hall: plinth, octagonal columns on bases, rafter ends) for a front the
    walker passes; otherwise a lighter composition of the same kit parts for fronts seen across the river at 10-30 m
    (thin posts, the bays of kit_inner_city.wall_bays, two kit_inner_city.lean_to slopes with fascia and a ridge, no
    rafter ends): the far rows are painted at 0.22-0.35 of the street's scale and the section's triangles go to what
    the walker sees close."""
    o, yaw, W, dp = front_frame(eid, depth=depth)
    z = bldg_z(eid) + z_ext
    with sb.entity(eid), placed(o, yaw, 0.0):
        if near:
            k2.hall(0.0, W, 0.0, dp, rng, z0=z, plinth=0.15, eave=eave, rise=rise, cols=[W * f for f in cols],
                    kinds=kinds, roof=roof, side=side, back=back, steps=False, over=0.3)
        else:
            top = z + eave
            xs = [W * f for f in cols]
            for x in xs:
                sb.cyl("timber", True, (x, 0.0, z - 0.05), (x, 0.0, top), 0.085, 0.075, segs=6)
            for x in (0.0, W):
                sb.cyl("timber", True, (x, dp, z - 0.05), (x, dp, top), 0.085, 0.075, segs=6)
            ki.wall_bays((0.0, 0.0), (W, 0.0), z, top - 0.12, list(cols), kinds, rng, posts=False)
            for x, sd in ((0.0, side[0]), (W, side[1])):
                if sd == "wall":
                    k.board("plaster", True, (x, dp - 0.08), (x, 0.1), 0.12, z, top)
            if back == "wall":
                k.board("plaster", True, (W - 0.08, dp), (0.08, dp), 0.12, z, top)
            k.beam("timber", True, (-0.15, 0.0, top - 0.08), (W + 0.15, 0.0, top - 0.08), 0.14, 0.2, 0.025)
            k.beam("timber", False, (-0.15, dp, top - 0.08), (W + 0.15, dp, top - 0.08), 0.12, 0.18, 0.02)
            ym, zr = dp / 2, top + 0.1 + rise
            if roof == "hip":
                k.hip_roof(-0.45, W + 0.45, -0.55, dp + 0.45, top + 0.1, zr, lift=0.25, ns=4, nt=2, ornament_s=0.3)
            else:
                ki.lean_to(-0.25, W + 0.25, -0.6, ym, top + 0.06, zr, ns=4, nt=2, rafters=False)
                ki.lean_to(-0.25, W + 0.25, dp + 0.5, ym, top + 0.06, zr, ns=4, nt=2, rafters=False)
                k.beam("ridge", False, (-0.3, ym, zr + 0.06), (W + 0.3, ym, zr + 0.06), 0.2, 0.18, 0.04)
                for x in (0.0, W):       # the gable triangles over the side walls
                    k.add("plaster", False, [(x, -0.05, top), (x, dp + 0.05, top), (x, ym, zr - 0.05)], [(0, 1, 2)])
                    k.add("plaster", False, [(x, dp + 0.05, top), (x, -0.05, top), (x, ym, zr - 0.05)], [(0, 1, 2)])
        if "open" in kinds:              # the open front's dark back: nobody walks into an empty box
            k.board("hidden", True, (0.2, dp - 0.4), (W - 0.2, dp - 0.4), 0.1, z, z + eave)
    if all(kk != "open" for kk in kinds):
        mark(eid, local_rect(o, yaw, 0, W, 0.2, dp))
    return o, yaw, W, dp, z


def far_bank(rng):
    # the far bank's buildings are painted at 0.22-0.35 of the street's scale (eaves read 0.95-1.5 m): real heights
    # (choice: eave 2.8, ridge 1.5 higher), their painted frontages, depth 4.2 m back past the silk's top edge
    far_hall_row("S3.bld.far_house_16560", rng, ["open", "wall", "wall", "open"], [0, 0.25, 0.5, 0.75, 1.0],
                 eave=2.8, rise=1.5)
    # its plank terrace edge with a low rail on short legs along the bank (part of the house)
    eid = "S3.bld.far_house_16560"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        yr = min(sw[1], se[1]) - 0.5
        pts = [(sw[0] + 1.0, yr), (se[0] + 0.2, yr)]
        k.balustrade(pts, hz_at(*pts[0]) + 0.05, h=0.45, spacing=1.0, mat="timber", collide=True, balusters=False)
    far_hall_row("S3.bld.far_shop_17170", rng, ["open", "open"], [0, 0.5, 1.0], eave=2.7, rise=1.3)
    for eid, kinds, cols in (("S3.bld.far_shop_17290", ["open", "open", "open"], [0, 0.34, 0.67, 1.0]),
                             ("S3.bld.far_shop_17575", ["door", "open"], [0, 0.5, 1.0]),
                             ("S3.bld.far_shop_17725", ["window", "window"], [0, 0.5, 1.0]),
                             ("S3.bld.far_hall_17875", ["open", "open", "open", "open"], [0, 0.25, 0.5, 0.75, 1.0])):
        # the long roof over several fronts (u 17300-18205): one eave and ridge height for all four
        far_hall_row(eid, rng, kinds, cols, eave=2.9, rise=1.6)
    # S3.bld.far_hall_17875's low lattice balustrade along its front at the bank's edge
    eid = "S3.bld.far_hall_17875"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        k.balustrade([(sw[0] + 0.1, sw[1] - 0.15), (se[0] - 0.1, se[1] - 0.15)], hz_at(*sw), h=0.62, spacing=1.2,
                     mat="timber", collide=True)
    # S3.bld.far_bank_shed_18280: a small open shed, a dark roof on slender posts
    far_hall_row("S3.bld.far_bank_shed_18280", rng, ["open"], [0, 1.0], roof="hip", eave=2.5, rise=1.0, depth=2.6,
                 side=("open", "open"), back="open")
    # S3.bld.far_bank_hall_18520: a long open hall on posts over a raised plank deck on short stilts over the sloping
    # bank, a railing along the deck's front, tables inside, a wall of vertical boards at its east end
    eid = "S3.bld.far_bank_hall_18520"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        zd = max(hz_at(*sw), hz_at(*se), 0.0) + FAR_DECK     # the frame's support: 0.39 above the stilts' feet
        STATE["far_deck_z"] = zd
        # choice: the deck's back 4.0 m behind its painted front (the silk's edge cuts the hall), square to the front
        fx, fy = se[0] - sw[0], se[1] - sw[1]
        fl = math.hypot(fx, fy)
        nxv, nyv = -fy / fl, fx / fl
        back = 4.0
        bsw, bse = (sw[0] + nxv * back, sw[1] + nyv * back), (se[0] + nxv * back, se[1] + nyv * back)
        deck = [sw, se, bse, bsw]
        sd = has(kc, "stilt_deck", "rail")
        if sd:                       # factory (c)'s shared stilt deck (catalogue.md c2), its front edge railed
            sd(deck, zd, rng, hz_at, post_every=1.8, rail=([0], "balusters"), collide=True)
        else:                        # stand-in until it lands: a plank slab on round stilts and a railing
            k.add("deck", True, [V((p[0], p[1], zd)) for p in deck], [(0, 1, 2, 3)])
            k.add("timber", False, [V((p[0], p[1], zd - 0.12)) for p in reversed(deck)], [(0, 1, 2, 3)])
            for a, b in ((sw, se), (se, bse), (bsw, sw)):
                k.beam("timber", False, (a[0], a[1], zd - 0.06), (b[0], b[1], zd - 0.06), 0.12, 0.14, 0.015)
            for t in [i / 5 for i in range(6)]:
                for off in (0.0, back * 0.5, back):
                    x = sw[0] + fx * t + nxv * off
                    y = sw[1] + fy * t + nyv * off
                    zg = hz_at(x, y)
                    sb.cyl("timber", True, (x, y, zg - 0.1), (x, y, zd - 0.12), 0.07, 0.065, segs=6)
            k.balustrade([sw, se], zd, h=0.8, spacing=1.1, mat="timber", collide=True)
        # the hall over the deck: columns on its front and back, a tiled hip roof; the board wall at its east end
        eave = 2.8
        for t in (0.0, 0.33, 0.66, 1.0):
            for off in (0.15, back - 0.15):
                x = sw[0] + fx * t + nxv * off
                y = sw[1] + fy * t + nyv * off
                k.column(x, y, zd, zd + eave, r=0.09, mat="timber", base=False)
        bw = has(kc, "board_wall", "battens")
        a_, b_ = (se[0] + nxv * 0.1, se[1] + nyv * 0.1), (bse[0] - nxv * 0.1, bse[1] - nyv * 0.1)
        if bw:                       # the east end's wall of vertical boards (factory (c)'s board_wall)
            bw(a_, b_, zd, zd + eave, rng, battens=2, ragged=False, collide=True)
        else:
            k.board("deck", True, a_, b_, 0.06, zd, zd + eave)
        yaw = math.degrees(math.atan2(fy, fx))
        with placed(sw, yaw, 0.0):
            k.hip_roof(-0.6, fl + 0.6, -0.7, back + 0.5, zd + eave + 0.1, zd + eave + 1.6, lift=0.3, ns=8, nt=4,
                       ornament_s=0.5)
    # S3.bld.far_bank_house_18850: a tiled roof behind the hall, running off the silk's top edge (roof only)
    far_hall_row("S3.bld.far_bank_house_18850", rng, ["wall", "window", "wall"], [0, 0.33, 0.66, 1.0], eave=3.0,
                 rise=1.6, depth=4.5)
    # S3.str.far_wall_16895: a faint low wall on the far bank's slope east of the far-bank house
    ft = line("S3.str.far_wall_16895", "foot")
    with sb.entity("S3.str.far_wall_16895"):
        for a, b in zip(ft, ft[1:]):
            ko.earth_wall(a, b, min(hz_at(*a), hz_at(*b)), 1.25, 0.3, rng, mat="plaster", foot_mat="rammed", foot=0.2)


# ---------------------------------------------------------------- the north bank east of the bridge's north foot

def north_bank(rng):
    # S3.bld.tavern_20230 (虹桥边的小酒馆): open-fronted on slender posts, a large roof with a lattice-filled gable at its
    # east, a lower roof skirt with tile ends over a band of lattice windows, tables at the water's edge under it.
    # choice: eave 2.9, rise 1.7, depth 4.6 back past the silk's top edge (its painted 1.6 m is the strip's depth)
    # The bridge's built north ramp (extended 3 m along its axis to walk at 34 deg, kit_rainbow_bridge's choice)
    # lands where the painting puts the tavern's west half, and the S2 seam bounds its east end: choice (recorded in
    # choices/builder.json how): the tavern narrowed to its painted east part, X 146.4-148.8 (0.3 m clear of the
    # ramp's near skirt; its painted 143.7-147.9), at its painted front (the bank top, D 24.92) and painted depth
    # (to D 26.6), open on all four sides on slender posts so the route runs through it along the water as painted
    eid = "S3.bld.tavern_20230"
    sw, se, ne, nw = fp(eid)
    x0, x1 = TAVERN_N_X
    y0, y1 = min(sw[1], se[1]), max(nw[1], ne[1]) + 0.06
    z = min(hz_at(x0, y0), hz_at(x1, y0), hz_at(x0, y1), hz_at(x1, y1))
    with sb.entity(eid):
        eave = 2.95                       # choice: real (painted 2.18-2.36 at 0.5-0.7 of the street's scale)
        xs = [x0, (x0 + x1) / 2, x1]
        for y in (y0, y1):
            for x in xs:
                k.column(x, y, z, z + eave, r=0.085, mat="timber", base=True)
        k.soft_box("stone", True, (x0 - 0.15, y0 - 0.12, z - 0.1), (x1 + 0.15, y1 + 0.12, z + 0.06), rng, r=0.05,
                   wob=0.01, seg=0.8)        # a low stone floor under the posts (open on all sides)
        for (a, b) in (((x0, y0), (x1, y0)), ((x0, y1), (x1, y1)), ((x0, y0), (x0, y1)), ((x1, y0), (x1, y1))):
            k.beam("timber", False, (a[0], a[1], z + eave - 0.08), (b[0], b[1], z + eave - 0.08), 0.12, 0.18, 0.02)
        # the band of lattice windows under the lower roof skirt (painted u 20105-20230, v 150-200), front and east
        k.lattice_window((x0 + 0.08, y0), (x1 - 0.08, y0), z + eave - 0.62, z + eave - 0.18)
        k.lattice_window((x1, y0 + 0.08), (x1, y1 - 0.08), z + eave - 0.62, z + eave - 0.18)
        # the lower roof skirt with tile ends along the front, then the big roof with its lattice-filled east gable
        ki.lean_to(x0 - 0.35, x1 + 0.35, y0 - 0.75, y0 + 0.15, z + eave - 0.02, z + eave + 0.42, ns=5, nt=2)
        ki.xieshan_roof(x0 - 0.55, x1 + 0.55, y0 - 0.25, y1 + 0.55, z + eave + 0.55, z + eave + 1.85, along="x",
                        ornament_s=0.4, ns=8, nt=4)
        ki.lattice_frame((x1 + 0.4, (y0 + y1) / 2 - 0.55), (x1 + 0.4, (y0 + y1) / 2 + 0.55), z + eave + 0.75, 0.75, rng)
    # S3.bld.north_bank_shop_19290: a shop at the silk's top edge, only its lattice front painted
    far_hall_row("S3.bld.north_bank_shop_19290", rng, ["window", "open", "window"], [0, 0.33, 0.66, 1.0],
                 eave=2.8, rise=1.5, depth=4.0)
    # S3.bld.north_bank_shed_19620: posts and two long beams under the silk's top edge, the roof off the silk
    eid = "S3.bld.north_bank_shed_19620"
    sw, se, ne, nw = fp(eid)
    with sb.entity(eid):
        # choice: an open shed, mat roof at 2.4-2.8 m over its painted posts, its back 3 m behind its front
        z = bldg_z(eid)
        fx, fy = se[0] - sw[0], se[1] - sw[1]
        fl = math.hypot(fx, fy)
        bk = (-fy / fl * 3.0, fx / fl * 3.0)
        k2.open_mat_shed([sw, se, (se[0] + bk[0], se[1] + bk[1]), (sw[0] + bk[0], sw[1] + bk[1])], z, 2.4, 2.8, rng,
                         over=0.2)


# ---------------------------------------------------------------- props (the props agent's table)

def props(rng):
    table = load_json(PROPS_TABLE, {}) or {}
    rows = table.get("props") or []
    skip = set(POSTS) | {TAVERN["lamp_box"], TAVERN["xinjiu_pole"]}
    if kp is None or not hasattr(kp, "place_props") or not rows:
        print("WARNING props: kit_rainbow_bridge_props.place_props or props_table.json missing: props not built",
              flush=True)
        return {}
    # the tables' built tops (z_at for things on them): the table's base z + its top_h
    tops = {}
    for r in rows:
        th = r.get("top_h", (r.get("args") or {}).get("top_h"))
        e = E.get(r["id"])
        if th is not None and e is not None:
            tops[r["id"]] = z_at(e["pos"][0], e["pos"][1], e) + float(th)
    STATE["tops"] = tops
    return kp.place_props(rows, E, z_at, rng, skip=skip)


# ---------------------------------------------------------------- vehicles (land)

def vehicles(rng):
    """The 串车 set down in the open ground (kit_vehicles.barrow_screen, held=False: no animal, as painted); the
    hooped-load barrow pushed and hauled (choice until the vehicle factory's hooped load lands: the kit's sack barrow,
    held); the closed sedan going up the bridge's south ramp, carried (kit_vehicles.sedan_chair on the built deck);
    the north-bank handcart (S3's props kit, until the vehicle factory's handcart lands)."""
    v = E["S3.veh.chuanche_17775"]["pts"]
    extra = {"stakes": True, "poles": True, "panel": True} if has(kv, "barrow_screen", "stakes", "poles", "panel") else {}
    with sb.entity("S3.veh.chuanche_17775"):
        kv.barrow_screen(tuple(v["front"][:2]), tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])], z_of=hz_at,
                         rng=random.Random(17775), held=False, **extra)
    STATE["vehicles_waiting"] = [] if extra else ["S3.veh.chuanche_17775: barrow_screen(stakes, poles, panel)"]
    v = E["S3.veh.barrow_hooped_load_18100"]["pts"]
    with sb.entity("S3.veh.barrow_hooped_load_18100"):
        if has(kv, "barrow_load", "load"):
            kv.barrow_load(tuple(v["front"][:2]), tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])], z_of=hz_at,
                           rng=random.Random(18100), load="hoops", held=True)
        else:                       # stand-in until factory (c)'s barrow_load(load="hoops") lands
            kv.sack_cart(tuple(v["front"][:2]), tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])], z_of=hz_at,
                         rng=random.Random(18100), held=True)
            STATE["vehicles_waiting"].append("S3.veh.barrow_hooped_load_18100: barrow_load(load='hoops')")
    v = E["S3.veh.sedan_18842"]["pts"]
    # factory (c)'s new kwargs (catalogue.md c1): a closed boarded front and a round roof. The spec calls the first
    # `front`, which is already the poles' end point: take whichever style keyword the landed kit names
    extra = {"roof": "round"} if has(kv, "sedan_chair", "roof") else {}
    for kw in ("front_style", "front_kind", "face", "door", "front_type"):
        if extra and has(kv, "sedan_chair", kw):
            extra[kw] = "closed"
    with sb.entity("S3.veh.sedan_18842"):
        kv.sedan_chair(front=tuple(v["front"][:2]), rear=tuple(v["rear"][:2]),
                       z_of=lambda x, y: z_at(x, y, {"support": "bridge deck"}), rng=random.Random(18842), carried=True,
                       **extra)
    if not extra:
        STATE["vehicles_waiting"].append("S3.veh.sedan_18842: sedan_chair(front='closed', roof='round')")
    v = E["S3.veh.handcart_19862"]["pts"]
    if kp is not None and hasattr(kp, "handcart"):
        with sb.entity("S3.veh.handcart_19862"):
            kp.handcart(tuple(v["front"][:2]), tuple(v["rear"][:2]), wheels=[tuple(v["wheel0"][:2])], z_of=hz_at,
                        rng=random.Random(19862))
    else:
        print("WARNING handcart: kit_rainbow_bridge_props.handcart missing", flush=True)


# ---------------------------------------------------------------- seats painted with their sitters (rule 3)

def seats(rng):
    """Figures painted seated on something the map doesn't list (a hidden stool): the seat is part of the figure. The
    casting agent lists them (gen/sections/rainbow_bridge/seats.json); a seat on a boat, a cart or the ground needs
    nothing here. Seats never collide (people.js grounds a seated figure by a ray from H + 1.2 m)."""
    n = 0
    for mid, s in (load_json(SEATS_JSON, {}) or {}).items():
        if mid not in FIG or str(s.get("what", "")).startswith(("boat", "cart", "ground", "none")):
            continue
        seat_h = float(s.get("seat_h") or 0)
        if seat_h < 0.15:
            continue
        x, y = s["X"], s["D"]
        z = z_at(x, y, FIG[mid])
        with sb.entity(mid):
            ki.stool(x, y, z, h=seat_h, s=0.32)
        n += 1
    return n


# ---------------------------------------------------------------- colliders: edges and tree trunks

def colliders(trees):
    """Invisible walls round the walkable area (build_choices.json edges): edge:west on the S4b seam's land part,
    edge:south on the silk's bottom edge, edge:east on the S2 seam's land parts (the moored boat's stern runs past
    the seam), edge:north on the silk's top edge where land meets it (or where the river plan moves it), and walls the
    river plan asks for; each tall tree's trunk (part of the tree)."""
    sw, se, ne, nw = WALK
    ed = PLAN.get("edges") or {}
    s_sh, n_sh = RIVER["south"][0], RIVER["north"][0]

    def seam_shore(shore, a, b):     # where a seam line a -> b meets a shore polyline
        for p, q in zip(shore, shore[1:]):
            d1 = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])
            d2 = (q[0] - a[0]) * (b[1] - a[1]) - (q[1] - a[1]) * (b[0] - a[0])
            if d1 * d2 <= 0 and d1 != d2:
                t = d1 / (d1 - d2)
                return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
        return None
    w_s = seam_shore(s_sh, sw, nw) or s_sh[0]
    e_s = seam_shore(s_sh, se, ne) or s_sh[-1]
    e_n = seam_shore(n_sh, se, ne) or n_sh[-1]
    walls = {"south": [(sw, se)],
             "west": [tuple(map(tuple, ed["west_land"]))] if ed.get("west_land") else [(sw, w_s)],
             "east": ([tuple(map(tuple, ed["east_land_south"]))] if ed.get("east_land_south") else [(se, e_s)]) +
                     ([tuple(map(tuple, ed["east_land_north"]))] if ed.get("east_land_north") else [(e_n, ne)])}
    fb = PLAN.get("far_bank") or {}
    bp = (load_json(BRIDGE_PLAN, {}) or {}).get("edge_north") or {}
    if fb.get("edge_north"):
        pts = [tuple(p) for p in fb["edge_north"]]
        walls["north"] = list(zip(pts, pts[1:]))
    elif bp.get("polyline"):
        # the silk's top edge, detouring north round the bridge's north foot (the bridge-fit agent's polyline: the
        # ramp's low end runs 2-3 m past the top edge; walls along the far railing keep the far bank closed)
        pts = [nw] + [tuple(p) for p in bp["polyline"]]
        if math.hypot(pts[-1][0] - ne[0], pts[-1][1] - ne[1]) > 0.05:
            pts.append(ne)
        walls["north"] = list(zip(pts, pts[1:]))
    else:
        walls["north"] = [(nw, ne)]
    for side, segs in walls.items():
        with sb.entity(f"edge:{side}"):
            for (xa, ya), (xb, yb) in segs:
                k.board("hidden", True, (xa, ya), (xb, yb), 0.1, -2.0, 4.0)
    for name, pts in (PLAN.get("extra_walls") or {}).items():
        with sb.entity(f"edge:{name}"):
            for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
                k.board("hidden", True, (xa, ya), (xb, yb), 0.1, -2.0, 4.0)
    h = H["h"]
    for t in trees:
        if (t.get("height_m") or 0) < 2.0:          # shrubs and whip clumps: no trunk to stop at
            continue
        x, d, s = t["X"], t["D"], t.get("scale", 1.0)
        with sb.entity(t["map_id"]):
            z = h(x, d)
            sb.cyl("hidden", True, (x, d, z), (x + 0.12 * s, d + 0.08 * s, z + 2.5 * s), 0.3 * s, segs=8)


# ---------------------------------------------------------------- build / export

def build(scene, seed=3):
    sb.B = sb.Buckets(strict=True)
    rng = random.Random(seed)
    for m in (ka, kp):                       # pick up the area kits' latest edits in a live session
        if m is not None:
            try:
                importlib.reload(m)
            except Exception as ex:          # noqa: BLE001
                print(f"WARNING reload {m.__name__}: {ex}", flush=True)
    RECTS.clear()
    STATE.clear()
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    frame = json.load(open(FRAME_JSON, encoding="utf-8"))
    river_lines()
    ground(rng, roads(L))
    bridge(frame)
    tavern(random.Random(16870))
    south_bank(random.Random(19000))
    far_bank(random.Random(17300))
    north_bank(random.Random(20230))
    prop_tris = props(random.Random(18000))
    vehicles(rng)
    n_seats = seats(rng)
    colliders(L["trees"])
    strips = []
    for wid, (w, seams) in RIVER["waters"].items():
        strips.append(kb.water_strip(w, frame, wid, layout=L, seams=seams))
    inside = check_inside()

    coll = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    stats = {}
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        if mat_name == "__mark__":
            continue
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new("rainbow_bridge__" + name)
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
    me = bpy.data.meshes.new("rainbow_bridge__ground__col")
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
    kb.water_mesh(bpy, strips, coll=coll)
    stats["water"] = sum(s.tris for s in strips)
    owners = dict(sb.B.tris)
    owners["ground"] = owners.get("ground", 0) + gt
    for s in strips:
        owners[s.map_id] = owners.get(s.map_id, 0) + s.tris
    placed_ = {"about": "Written by blender/rainbow_bridge_scene.py build(); never edit. Triangles per owner: map IDs, "
                        "'edge:*' (invisible colliders closing the walkable area; edge:shore along the water) and "
                        "'ground'. The boats are in their own GLB (gen/sections/rainbow_bridge/web_build/"
                        "rainbow_bridge_boats.json). tools/loyalty_check.mjs compares it with the map (map/BUILDING.md).",
               "section": L["section"], "walk": [list(p) for p in WALK], "owners": dict(sorted(owners.items()))}
    with open(PLACED_JSON, "w", encoding="utf-8") as f:
        json.dump(placed_, f, indent=1, ensure_ascii=False)
    print("WATER " + json.dumps({"tris": [s.tris for s in strips], "walls": [s.wall_pieces for s in strips],
                                 "notes": [s.notes for s in strips], "seats": n_seats, "inside": len(inside),
                                 "props": len(prop_tris)}), flush=True)
    top = sorted(((v, k_) for k_, v in owners.items()), reverse=True)[:25]
    print("OWNERS_TOP " + json.dumps(top), flush=True)
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "owners": len(owners), "buckets": stats}


def export(scene, path):
    return sb.export_collection(scene, COLL, path)
