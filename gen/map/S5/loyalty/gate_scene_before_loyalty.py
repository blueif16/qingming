"""Gate section, walkable web scene, composed from the Song construction kit (blender/song_kit.py).

build(scene) creates collection "gate_scene" in `scene`: one mesh per (material, collide) bucket, named
"g_<material>__col" / "g_<material>__nocol" (the page collides with every "__col" mesh; "hidden__col" is
collider-only). export(scene, path) writes the raw GLB; tools/export_web_scene.mjs ships it.

Positions come from the scroll map (qingming/map/README.md) through sections/gate/layout.json
(tools/map_layout.mjs): X along the street (out of the city = +X), Y depth (north), Z up, origin at the moat
bridge's south-west deck corner. derive() reads every structure's place and street-level size from the layout by
map ID. What the strokes can't give (a hidden back wall, the tower drawn at a smaller scale than the street, a
stair foot below the silk's edge) is a builder choice, marked "choice:" where it is made and listed in
sections/gate/notes.md.

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
LAYOUT_JSON = QM + r"\sections\gate\layout.json"
COLL = "gate_scene"

# Filled by derive(layout) from the scroll map. GB: the gate block's brick faces lean in (batter): inner face x
# at the base and at the top, likewise the outer face; y0/y1 its north-south extent; py0/py1 and ph the passage.
GB, WING_N, WING_S, BRIDGE, POD, OFFICE, HOUSES, PROPS = {}, {}, {}, {}, {}, {}, [], {}
HALL_X, HALL_Y = [], []
RAMP = {}
LAYOUT = {}
FLOOR = 0.0
TOP = 0.0
EXTENT = {"x0": -54.0, "x1": 32.0, "y0": -20.0, "y1": 38.0}


def _fp(L, eid):
    return L["entities"][eid]["footprint"]


def derive(L):
    """Every place and street-level size in the scene, from the map (layout.json). Footprints are [sw, se, ne, nw]."""
    global FLOOR, TOP
    E = L["entities"]
    sw, se, ne, nw = _fp(L, "S5.str.gate_block")
    top = E["S5.str.gate_block"]["pts"]
    ps = _fp(L, "S5.str.gate_passage")
    GB.clear()
    GB.update(xi0=(sw[0] + nw[0]) / 2, xo0=(se[0] + ne[0]) / 2, xi1=top["sw_top"][0], xo1=top["se_top"][0],
              h=top["se_top"][2], y0=min(sw[1], se[1]), y1=max(ne[1], nw[1]), py0=ps[0][1], py1=ps[3][1],
              ph=E["S5.str.gate_passage"]["pts"]["se_top"][2])
    # wings: the north wing is not painted (choice: it continues the block's faces north, 0.4 m inside them, as a
    # city wall must); the south wing's painted foot meets the block's east half (S5.str.wing_south), and runs
    # south (choice: straight south; its painted edges slant south-east, low confidence)
    WING_N.clear()
    WING_N.update(xi0=GB["xi0"] + 0.4, xi1=GB["xi1"] + 0.4, xo0=GB["xo0"] - 0.4, xo1=GB["xo1"] - 0.4)
    ws = E["S5.str.wing_south"]["lines"]
    WING_S.clear()
    WING_S.update(xi0=ws["foot_w"][0][0], xo0=ws["foot_e"][0][0], xi1=ws["foot_w"][0][0] + 0.9, xo1=ws["foot_e"][0][0] - 0.9)
    bsw, bse, bne, bnw = _fp(L, "S5.str.moat_bridge")
    BRIDGE.clear()
    BRIDGE.update(x0=(bsw[0] + bnw[0]) / 2, x1=(bse[0] + bne[0]) / 2, y0=bsw[1], y1=bnw[1])
    # the tower: the podium's painted front on the terrace; choice: kept inside the terrace's balustrade
    psw, pse, pne, pnw = _fp(L, "S5.str.tower_podium")
    POD.clear()
    POD.update(x0=max((psw[0] + pnw[0]) / 2, GB["xi1"] + 0.6), x1=min((pse[0] + pne[0]) / 2, GB["xo1"] - 0.6),
               y0=psw[1], y1=min(pnw[1], GB["y1"] - 1.1))
    FLOOR = E["S5.str.tower_podium"]["pts"]["sw_top"][2]
    # the hall: 3 bays across its south end (columns at the painted bays) and 5 along the wall, as painted; choice:
    # columns 3.0 m (the tower is painted at about 0.6 of the street's scale: its door measures 1.3 m), and the
    # hall kept 0.9 m inside the balcony's edge
    bays = sorted(b[0] for b in E["S5.str.gate_tower"]["bays"])
    lo, hi = POD["x0"] - 0.4 + 0.9, POD["x1"] + 0.4 - 0.9
    HALL_X[:] = [lo + (b - bays[0]) * (hi - lo) / (bays[-1] - bays[0]) for b in bays]
    ya, yb = max(_fp(L, "S5.str.gate_tower")[0][1], POD["y0"] - 0.4 + 0.9), POD["y1"] + 0.4 - 0.9
    HALL_Y[:] = [ya + i * (yb - ya) / 5 for i in range(6)]
    TOP = FLOOR + 3.0
    # tax office: its painted front and columns; choice: 4.3 m deep (its back is hidden behind the roof and trees)
    osw, ose, one, onw = _fp(L, "S5.bld.tax_office")
    OFFICE.clear()
    OFFICE.update(x0=osw[0], x1=ose[0], yf=(osw[1] + ose[1]) / 2, cols=sorted(b[0] for b in E["S5.bld.tax_office"]["bays"]))
    OFFICE["yb"] = OFFICE["yf"] + 4.3
    # houses: each painted front (the edge on the street); choice: depths, where the back is hidden
    HOUSES[:] = []
    for eid, depth, kw in (("S5.bld.wine_depot", 4.0, dict(bays=2, door_bays=(0, 1), awning=True)),
                           ("S5.bld.back_hall_5790", 3.6, dict(bays=2, door_bays=(1,), rise=1.4)),
                           ("S5.bld.house_5800", 4.0, dict(bays=2, door_bays=(0,), awning=True)),
                           ("S5.bld.house_5720", 3.5, dict(bays=2, door_bays=(1,), rise=1.3)),
                           ("S5.bld.house_6390", 2.6, dict(bays=1, door_bays=(0,), rise=1.3))):
        e = E[eid]
        a, b, c, d = e["footprint"]
        if e.get("facing_deg") == 270 and eid != "S5.bld.house_6390":   # front on the north side's street edge, facing south
            x0, x1, yf = a[0], b[0], (a[1] + b[1]) / 2
            HOUSES.append(dict(id=eid, frame=(x0, yf, 0), yaw=0, W=x1 - x0, D=depth, kw=kw, box=(x0, x1, yf, yf + depth)))
        elif eid == "S5.bld.house_6390":                                 # south of the block, its painted door faces south
            x0, x1 = (a[0] + d[0]) / 2, (b[0] + c[0]) / 2
            HOUSES.append(dict(id=eid, frame=(x0, a[1], 0), yaw=0, W=x1 - x0, D=c[1] - a[1], kw=kw, box=(x0, x1, a[1], c[1])))
        else:                                                            # south side of the street: front = north edge, facing north
            x0, x1, yf = d[0], c[0], (c[1] + d[1]) / 2
            HOUSES.append(dict(id=eid, frame=(x1, yf, 0), yaw=180, W=x1 - x0, D=depth, kw=kw, box=(x0, x1, yf - depth, yf)))
    # south of the street the low house sits in front of (south of) the big one: choice: their painted roofs overlap
    big = next(h for h in HOUSES if h["id"] == "S5.bld.house_5800")
    low = next(h for h in HOUSES if h["id"] == "S5.bld.house_5720")
    yf = big["box"][2] - 0.15
    low["frame"] = (low["frame"][0], yf, 0)
    low["box"] = (low["box"][0], low["box"][1], yf - low["D"], yf)
    PROPS.clear()
    for eid in ("S5.prop.frame_scale_5930", "S5.prop.bale_box_6203", "S5.prop.bale_netted_6262", "S5.prop.bale_netted_6300",
                "S5.prop.casks_5665", "S5.prop.tower_drum_6898"):
        if eid in E:
            PROPS[eid] = E[eid]["pos"]
    figs = {f["id"]: f for f in L["figures"]}
    OFFICE["official"] = (figs["tax_official"]["X"], figs["tax_official"]["D"])


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
    X0, X1, Y0, Y1 = int(EXTENT["x0"]), int(EXTENT["x1"]), int(EXTENT["y0"]), int(EXTENT["y1"])
    bx0, bx1 = BRIDGE["x0"], BRIDGE["x1"]
    ph = [rng.uniform(0, 6.283) for _ in range(6)]

    def h(x, y):
        z = (0.035 * math.sin(0.37 * x + ph[0]) * math.cos(0.29 * y + ph[1])
             + 0.025 * math.sin(0.83 * x + 0.6 * y + ph[2]) + 0.015 * math.sin(1.7 * x - 1.3 * y + ph[3]))
        dr = road_dist(x, y, road)
        if dr < 3.2:
            z = z * (0.35 + 0.65 * dr / 3.2) - 0.04 * (1 - dr / 3.2) - 0.03 * math.exp(-((dr - 0.8) / 0.2) ** 2)
        if bx0 <= x <= bx1:
            f = min(x - bx0, bx1 - x)
            s = min(1.0, f / 2.0)
            z = z * (1 - s) - 2.3 * (s * s * (3 - 2 * s))
        for xb in (GB["xo0"] + 0.4, GB["xi0"] - 0.2):
            df = abs(x - xb)
            if df < 2.4 and not (GB["py0"] - 1.4 < y < GB["py1"] + 1.4) and (y > GB["y0"] - 0.5 or xb > GB["xo0"]):
                z += 0.38 * (1 - df / 2.4) ** 1.5 * (0.6 + 0.4 * math.sin(1.3 * y + ph[4]))
        return z

    def bare(x, y):
        # the road's verge wanders: a low-frequency wobble on the distance, so the worn edge is never parallel
        dr = (road_dist(x, y, road) + 0.6 * math.sin(0.41 * x + ph[4]) * math.cos(0.33 * y + ph[5])
              + 0.3 * math.sin(1.1 * x - 0.7 * y + ph[1]))
        b = 1 - _smooth(1.5, 3.2, dr)
        b = max(b, _smooth(-1.2, 0.3, min(x - bx0, bx1 - x)))                               # moat channel and banks
        if GB["xi0"] - 1.6 < x < GB["xo0"] + 1.6:                                          # trodden passage front
            b = max(b, 1 - _smooth(0.0, 1.6, max(GB["py0"] - 0.4 - y, y - GB["py1"] - 0.4, GB["xi0"] - 0.1 - x, x - GB["xo0"] - 0.1)))
        return b

    nx, ny = X1 - X0, Y1 - Y0
    verts = [V((X0 + i, Y0 + j, h(X0 + i, Y0 + j))) for j in range(ny + 1) for i in range(nx + 1)]
    faces = [(j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i)
             for j in range(ny) for i in range(nx)]
    GROUND.update(verts=verts, faces=faces, bare=[bare(v.x, v.y) for v in verts])
    sb.quad("water", False, (bx0, Y0, -1.65), (bx1, Y0, -1.65), (bx1, Y1, -1.65), (bx0, Y1, -1.65))
    return h


# ---------------------------------------------------------------- the moat bridge (平桥)

def bridge(rng):
    """The moat bridge on its mapped deck (S5.str.moat_bridge): x0..x1 along the road, y0..y1 across it."""
    x0, x1, y0, y1 = BRIDGE["x0"], BRIDGE["x1"], BRIDGE["y0"], BRIDGE["y1"]
    L, ym = x1 - x0, (y0 + y1) / 2
    # stone abutments where the deck lands on each bank
    for xc in (x0 - 0.05, x1 + 0.05):
        k.masonry((xc, y0 - 1.2), (xc, y1 + 1.2), -2.4, -0.02, 0.6, rng, course=(0.5, 0.7), lmin=0.9, lmax=1.7, seg=1.2)
    # stringers along both edges, then the deck planks laid across them, each a little different
    for y in (y0 + 0.18, y1 - 0.18):
        k.beam("timber", True, (x0 - 0.5, y, -0.25), (x1 + 0.5, y, -0.25), 0.32, 0.4, 0.04)
    k.plank_deck(x0, x1, y0 - 0.08, y1 + 0.08, 0.0, rng)
    # railings as painted (posts about 1.7 m apart): posts with caps, top / middle / bottom rails, two board
    # courses and one brace per bay
    n = max(2, round(L / 1.75))
    for y in (y0 + 0.12, y1 - 0.12):
        xs = [x0 + i * L / n for i in range(n + 1)]
        for xp in xs:
            k.post("timber", True, xp, y, -0.05, 1.12, 0.15, 0.025)
            bx("timber", False, (xp - 0.1, y - 0.1, 1.12), (xp + 0.1, y + 0.1, 1.2))
        k.beam("timber", True, (x0 - 0.15, y, 1.02), (x1 + 0.15, y, 1.02), 0.12, 0.11, 0.025)
        k.beam("timber", True, (x0, y, 0.58), (x1, y, 0.58), 0.08, 0.08, 0)
        k.beam("timber", False, (x0, y, 0.12), (x1, y, 0.12), 0.1, 0.08, 0)
        for zc in (0.27, 0.42):
            k.beam("timber", False, (x0, y, zc), (x1, y, zc), 0.035, 0.11, 0)
        for xa, xb in zip(xs, xs[1:]):
            k.beam("timber", False, (xa + 0.08, y, 0.14), (xb - 0.08, y, 0.56), 0.06, 0.07, 0)
    # three timber trestles standing in the water
    for xt in (x0 + L / 4, x0 + L / 2, x0 + 3 * L / 4):
        for yp in (y0 + 0.55, ym, y1 - 0.55):
            sb.cyl("timber", False, (xt + rng.uniform(-0.04, 0.04), yp, -2.7), (xt, yp, -0.6), 0.17, 0.15, segs=8)
        k.beam("timber", False, (xt, y0 - 0.45, -0.55), (xt, y1 + 0.45, -0.55), 0.3, 0.26, 0.04)
        k.beam("timber", False, (xt, y0 + 0.2, -1.45), (xt, y1 - 0.2, -1.45), 0.18, 0.16, 0.03)
        k.beam("timber", False, (xt, y0 + 0.6, -1.4), (xt, ym - 0.05, -0.7), 0.1, 0.1, 0.02)
        k.beam("timber", False, (xt, y1 - 0.6, -1.4), (xt, ym + 0.05, -0.7), 0.1, 0.1, 0.02)


# ---------------------------------------------------------------- city wall, gate block, passage

def wing(y_from, y_to, rng, W, flat_near=None):
    """A rammed-earth wing of the city wall: coursed, bulging, slumped faces (kit rammed_wall), rubble and grass
    at both feet, grass along the uneven top. W: its face x at the base and the top."""
    h = GB["h"]
    rows = k.rammed_wall(y_from, y_to, W["xi0"], W["xi1"], W["xo0"], W["xo1"], rng, h_lo=0.72 * h, h_hi=0.86 * h,
                         flat_near=flat_near, flat_h=h)
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
    xc = (g["xi0"] + g["xo0"]) / 2
    k.stone_run("stone", True, (xc, y0), (xc, y1), -0.02, 0.14, 0.3, rng, lmin=1.4, lmax=1.8, r=0.05, ease=0.03)
    xs = [g["xi0"] + 1.55 + i * (g["xo0"] - g["xi0"] - 3.0) / 5 for i in range(6)]
    for x in xs:
        for y in (y0 + 0.15, y1 - 0.15):
            k.post("timber", True, x, y, 0.06, ph - 0.25, 0.28, 0.04)
        k.beam("timber", False, (x, y0, ph - 0.17), (x, y1, ph - 0.17), 0.28, 0.32, 0.04)
    for y in (y0 + 0.15, y1 - 0.15):
        k.beam("timber", False, (xs[0] - 0.2, y, ph - 0.12), (xs[-1] + 0.2, y, ph - 0.12), 0.22, 0.24, 0.03)
    bx("timber", False, (face_x(g["xi0"], g["xi1"], ph, h), y0, ph - 0.04), (face_x(g["xo0"], g["xo1"], ph, h), y1, ph))
    for y, d in ((y0 + 0.08, 1), (y1 - 0.08, -1)):
        for kk in range(7):
            xa = xc - 3.25 + kk * 0.23
            k.board("timber", False, (xa, y + d * 0.05), (xa + 0.22, y + d * 0.05), 0.09, 0.08, 5.0)
        for zz in (0.6, 2.5, 4.4):
            k.beam("timber", False, (xc - 3.2, y + d * 0.13, zz), (xc - 1.7, y + d * 0.13, zz), 0.1, 0.05, 0)
        for zz in (1.2, 1.9, 3.1, 3.8):
            for xx in (xc - 3.0, xc - 2.6, xc - 2.2, xc - 1.8):
                bx("ridge", False, (xx - 0.035, y + d * 0.1 - 0.035, zz - 0.035), (xx + 0.035, y + d * 0.1 + 0.035, zz + 0.035))
    # the small roofed frame over the outer opening, as painted
    zh = ph + 0.45
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

def podium():
    """The bracketed podium and balcony on the terrace (S5.str.tower_podium), and the stair up to it from the
    terrace's south edge (S5.str.tower_stair), on the lower flight's axis as painted."""
    z0 = GB["h"] + 0.12
    x0, x1, y0, y1 = POD["x0"], POD["x1"], POD["y0"], POD["y1"]
    zb = z0 + 1.0
    bx("brick", True, (x0, y0, z0), (x1, y1, zb))
    bx("stone", False, (x0 - 0.1, y0 - 0.1, zb - 0.04), (x1 + 0.1, y1 + 0.1, zb + 0.06))
    # bracket row of the balcony level (平座斗拱) carrying the deck
    for (ax, ay), (bxx, byy), out in (((x0, y0), (x1, y0), (0, -1)), ((x1, y0), (x1, y1), (1, 0)),
                                       ((x1, y1), (x0, y1), (0, 1)), ((x0, y1), (x0, y0), (-1, 0))):
        L = math.hypot(bxx - ax, byy - ay)
        n = max(2, round(L / 1.6))
        for i in range(n):
            t = (i + 0.5) / n
            k.bracket(ax + (bxx - ax) * t, ay + (byy - ay) * t, zb + 0.06, out, s=0.5)
    e = 0.4
    dx0, dx1, dy0, dy1 = x0 - e, x1 + e, y0 - e, y1 + e
    bx("deck", True, (dx0, dy0, FLOOR - 0.4), (dx1, dy1, FLOOR))
    for a, b in (((dx0 - 0.03, dy0 - 0.03), (dx1 + 0.03, dy0 - 0.03)), ((dx1 + 0.03, dy0 - 0.03), (dx1 + 0.03, dy1 + 0.03)),
                 ((dx1 + 0.03, dy1 + 0.03), (dx0 - 0.03, dy1 + 0.03)), ((dx0 - 0.03, dy1 + 0.03), (dx0 - 0.03, dy0 - 0.03))):
        k.beam("redwood", False, (a[0], a[1], FLOOR - 0.2), (b[0], b[1], FLOOR - 0.2), 0.07, 0.24, 0)
    st = LAYOUT["entities"]["S5.str.tower_stair"]["footprint"]
    sx0, sx1 = (st[0][0] + st[3][0]) / 2, (st[1][0] + st[2][0]) / 2
    k.balustrade([(sx0 - 0.05, dy0 + 0.12), (dx0 + 0.12, dy0 + 0.12), (dx0 + 0.12, dy1 - 0.12), (dx1 - 0.12, dy1 - 0.12),
                  (dx1 - 0.12, dy0 + 0.12), (sx1 + 0.05, dy0 + 0.12)], FLOOR)
    # choice: the stair's run is what the strokes leave between the terrace's edge and the deck (the tower is
    # compressed in depth), so it is steep
    ya, yb = GB["y0"] + 0.15, dy0
    k.stairs(sx0, sx1, ya, yb, z0, FLOOR, 8, mat="stone")
    for x in (sx0 - 0.05, sx1 + 0.05):
        # the bottom posts and the rails don't collide: the strokes leave almost no landing between the two flights,
        # so one steps off the upper stair's side onto the terrace
        for y, z, col in ((ya, z0, False), (yb, FLOOR, True)):
            k.post("redwood", col, x, y, z, z + 1.1, 0.13, 0.02)
        k.beam("redwood", False, (x, ya, z0 + 1.0), (x, yb, FLOOR + 1.0), 0.09, 0.08, 0.015)
        k.beam("redwood", False, (x, ya, z0 + 0.5), (x, yb, FLOOR + 0.5), 0.07, 0.06, 0)


def hall(rng):
    top = TOP
    zw = FLOOR + 2.45   # door and window head
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
            k.plank_door(p0, p1, FLOOR, zw, ajar=0.85)
            k.board("plaster", False, p0, p1, 0.14, zw, top - 0.28)
            return
        if kind == "wall":
            k.board("plaster", True, p0, p1, 0.14, FLOOR, top - 0.28)
            return
        k.board("plaster", True, p0, p1, 0.14, FLOOR, FLOOR + 0.75)
        k.lattice_window(p0, p1, FLOOR + 0.75, zw)
        k.board("plaster", True, p0, p1, 0.14, zw, top - 0.28)
        t = (V((p1[0], p1[1], 0)) - V((p0[0], p0[1], 0))).normalized()
        n = V((t.y, -t.x, 0)) * 0.07
        k.board("plaster", True, (p0[0] - n.x, p0[1] - n.y), (p1[0] - n.x, p1[1] - n.y), 0.02,
                FLOOR + 0.75, zw)  # keeps walkers out; hidden behind the window's dark backing

    r = 0.18
    nx, ny = len(HALL_X) - 1, len(HALL_Y) - 1
    for i in range(nx):
        xa, xb = HALL_X[i] + r, HALL_X[i + 1] - r
        bay((xa, HALL_Y[0]), (xb, HALL_Y[0]), "door" if i == nx // 2 else "window")
        bay((xb, HALL_Y[-1]), (xa, HALL_Y[-1]), "window" if i == nx // 2 else "wall")
    for j in range(ny):
        ya, yb = HALL_Y[j] + r, HALL_Y[j + 1] - r
        bay((HALL_X[0], yb), (HALL_X[0], ya), "window")
        bay((HALL_X[-1], ya), (HALL_X[-1], yb), "window")
    # interior: dark walls and ceiling, the drum
    xi0, xi1, yi0, yi1 = HALL_X[0] + 0.1, HALL_X[-1] - 0.1, HALL_Y[0] + 0.12, HALL_Y[-1] - 0.1
    sb.quad("interior", False, (xi0, yi1, FLOOR), (xi1, yi1, FLOOR), (xi1, yi1, top - 0.3), (xi0, yi1, top - 0.3))
    sb.quad("interior", False, (xi0, yi0, FLOOR), (xi0, yi1, FLOOR), (xi0, yi1, top - 0.3), (xi0, yi0, top - 0.3))
    sb.quad("interior", False, (xi1, yi1, FLOOR), (xi1, yi0, FLOOR), (xi1, yi0, top - 0.3), (xi1, yi1, top - 0.3))
    sb.quad("interior", False, (xi0, yi0, top - 0.3), (xi1, yi0, top - 0.3), (xi1, yi1, top - 0.3), (xi0, yi1, top - 0.3))
    dxy = PROPS.get("S5.prop.tower_drum_6898")
    if not dxy or not (xi0 + 0.7 < dxy[0] < xi1 - 0.7 and yi0 + 0.7 < dxy[1] < yi1 - 0.7):
        dxy = ((xi0 + xi1) / 2, yi1 - 0.9)   # choice: the painted drum (low confidence) falls outside the hall
    k.drum(dxy[0], dxy[1], FLOOR + 1.3)
    # bracket sets: on every column and one between each pair, reaching out from the walls
    zb = top + 0.15
    sets = []
    for i, x in enumerate(HALL_X):
        sets.append((x, HALL_Y[0], (0, -1)))
        sets.append((x, HALL_Y[-1], (0, 1)))
        if i < nx:
            xm = (x + HALL_X[i + 1]) / 2
            sets.append((xm, HALL_Y[0], (0, -1)))
            sets.append((xm, HALL_Y[-1], (0, 1)))
    for j, y in enumerate(HALL_Y):
        if 0 < j < ny:
            sets.append((HALL_X[0], y, (-1, 0)))
            sets.append((HALL_X[-1], y, (1, 0)))
        if j < ny:
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
    # hipped roof with its main ridge north-south, as painted (the kit's ridge runs along local X)
    cx, cy = (HALL_X[0] + HALL_X[-1]) / 2, (HALL_Y[0] + HALL_Y[-1]) / 2
    hx, hy = (HALL_X[-1] - HALL_X[0]) / 2 + 1.7, (HALL_Y[-1] - HALL_Y[0]) / 2 + 1.7
    with k.placed(k.frame(cx, cy, 0, 90)):
        k.hip_roof(-max(hy, hx + 0.6), max(hy, hx + 0.6), -hx, hx, top + 0.95, top + 4.2, lift=0.55, ns=16, nt=7, ornament_s=1.3)


def ramp_and_terrace():
    g = GB
    z0 = g["h"] + 0.12
    # the lower flight (马道, S5.str.inner_ramp) against the block's south face, rising north to a gap in the
    # terrace's south balustrade, on the upper stair's axis as painted. choice: its foot is below the silk's edge;
    # it starts 15 m south so the flight rises at about 34 degrees, on an earthen fill
    st = LAYOUT["entities"]["S5.str.tower_stair"]["footprint"]
    xm = ((st[0][0] + st[3][0]) / 2 + (st[1][0] + st[2][0]) / 2) / 2
    xr0, xr1 = xm - 0.95, xm + 0.95
    xr0 = max(xr0, max(h["box"][1] for h in HOUSES if h["id"] == "S5.bld.house_6390") + 0.35)
    xr1 = xr0 + 1.9
    yr0, yr1 = g["y0"] - 15.0, g["y0"]
    RAMP.update(x0=xr0, x1=xr1, y0=yr0, y1=yr1)
    k.stairs(xr0, xr1, yr0, yr1, 0.0, z0, 40, mat="stone", fill_mat="rammed")
    for x in (xr0 + 0.05, xr1 - 0.05):
        for y, z in ((yr0, 0.0), (yr0 + 5, z0 / 3), (yr0 + 10, 2 * z0 / 3), (yr1, z0)):
            k.post("redwood", True, x, y, z, z + 1.05, 0.13, 0.02)
        k.beam("redwood", True, (x, yr0, 0.95), (x, yr1, z0 + 0.95), 0.09, 0.08, 0.015)
        k.beam("redwood", False, (x, yr0, 0.5), (x, yr1, z0 + 0.5), 0.07, 0.06, 0)
    # terrace railing around the top of the gate block, open where the flight arrives
    k.balustrade([(xr1 + 0.05, g["y0"] + 0.05), (g["xo1"] + 0.1, g["y0"] + 0.05), (g["xo1"] + 0.1, g["y1"] - 0.05),
                  (g["xi1"] - 0.1, g["y1"] - 0.05), (g["xi1"] - 0.1, g["y0"] + 0.05), (xr0 - 0.05, g["y0"] + 0.05)],
                 z0, h=0.95, spacing=1.6)


# ---------------------------------------------------------------- tax office, houses, props

def tax_office(rng):
    """The three-bay open hall on its painted front (S5.bld.tax_office): front columns at the painted bays, eave
    height from the strokes; the official's desk and bench where he sits, the frame scale and the bales where
    they are painted."""
    o = OFFICE
    x0, x1, yf, yb, cols = o["x0"], o["x1"], o["yf"], o["yb"], o["cols"]
    zt = 0.35
    k.soft_plinth(x0 - 0.45, x1 + 0.45, yf - 0.35, yb + 0.45, zt, rng)
    k.stairs(cols[1] + 0.3, cols[2] - 0.3, yf - 0.85, yf - 0.3, 0, zt, 2, rng=rng)
    eav = LAYOUT["entities"]["S5.bld.tax_office"]["heights"]
    top = (eav["sw_eave"] + eav["se_eave"]) / 2
    for x in cols:
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
    for x in cols:
        k.bracket(x, yf, top, (0, -1), s=0.6, mat="timber")
    k.gable_roof(x0, x1, yf - 1.05, yb + 0.95, top + 0.45, top + 1.85, over=0.6)
    # inside: the official's desk and bench, the big frame scale, shelves and posted notices
    bx("timber", False, (x0 + 0.1, yf + 0.1, zt), (x1 - 0.1, yb - 0.1, zt + 0.03))
    ox, oy = o["official"]
    k.table(ox - 0.8, oy - 0.85, ox + 0.8, oy - 0.3, zt)
    bx("timber", True, (ox - 0.6, oy - 0.05, zt), (ox + 0.6, oy + 0.25, zt + 0.45))
    fs = PROPS.get("S5.prop.frame_scale_5930", (x0 + 1.4, yf + 2.1))
    k.frame_scale(fs[0], max(fs[1], yf + 0.6), zt)
    for z in (1.1, 1.6, 2.1):
        bx("timber", False, (x1 - 2.2, yb - 0.45, z), (x1 - 0.4, yb - 0.1, z + 0.04))
    for i, x in enumerate((x0 + 1.6, x0 + 2.4, x0 + 3.3, x0 + 4.1)):
        zz = 1.75 + 0.25 * (i % 2)
        sb.quad("cloth_white", False, (x, yb - 0.11, zz), (x + 0.55, yb - 0.11, zz), (x + 0.55, yb - 0.11, zz + 0.8),
                (x, yb - 0.11, zz + 0.8))
    # the carters' bales where they are painted: the upper netted bale lies on the front one
    front = PROPS.get("S5.prop.bale_netted_6262")
    for eid, z, yaw, m in (("S5.prop.bale_netted_6262", 0, 0.1, "cloth_white"), ("S5.prop.bale_netted_6300", 0.55, 0.05, "cloth_indigo"),
                           ("S5.prop.bale_box_6203", 0, 1.4, "cloth_white")):
        p = PROPS.get(eid)
        if not p:
            continue
        if z and front and math.hypot(p[0] - front[0], p[1] - front[1]) > 1.2:
            z = 0
        k.bale(p[0], p[1], z, 1.0, 0.65, 0.55, yaw, m)


def yards(h):
    """A courtyard wall behind the tax office. choice: the strokes hide everything behind it."""
    o = OFFICE
    k.yard_wall([(o["x0"] - 0.6, o["yb"] + 1.2), (o["x1"], o["yb"] + 1.2), (o["x1"], o["yb"] + 4.0)], h)


def houses(rng):
    """Each painted house on its painted front (layout HOUSES): the wine depot and the hall behind it on the north
    side, the two roofs and the bracketed house south of the street."""
    for hs in HOUSES:
        x, y, z = hs["frame"]
        with k.placed(k.frame(x, y, z, hs["yaw"])):
            k.house(hs["W"], hs["D"], rng, **hs["kw"])
    # the wine depot's casks (S5.prop.casks_5665), and jars and baskets by the street fronts
    cx = PROPS.get("S5.prop.casks_5665")
    if cx:
        for i in range(4):
            sb.jar(cx[0] - 0.9 + 0.6 * i, cx[1] + 0.3, 0.0, rng)
    for hs in HOUSES:
        if hs["id"] == "S5.bld.back_hall_5790":
            continue
        x0, x1, ya, yb = hs["box"]
        yfr = ya - 0.55 if hs["yaw"] == 0 else yb + 0.55
        for _ in range(2):
            (sb.jar if rng.random() < 0.6 else sb.basket)(rng.uniform(x0 + 0.4, x1 - 0.4), yfr, 0.0, rng)


def _blocked(x, y, margin=0.4):
    """Is (x, y) on a wall, the moat, the ramp, the office or a house (no grass or stones there)?"""
    if GB["xi0"] - margin < x < GB["xo0"] + margin and y > GB["y0"] - margin:
        return True
    if WING_S["xi0"] - margin < x < WING_S["xo0"] + margin and y < GB["y0"]:
        return True
    if BRIDGE["x0"] <= x <= BRIDGE["x1"]:
        return True
    if RAMP and RAMP["x0"] - 0.3 < x < RAMP["x1"] + 0.3 and RAMP["y0"] - 0.3 < y < RAMP["y1"]:
        return True
    o = OFFICE
    if o["x0"] - 0.7 < x < o["x1"] + 0.7 and o["yf"] - 0.8 < y < o["yb"] + 1.0:
        return True
    return any(x0 - 0.3 < x < x1 + 0.3 and y0 - 0.3 < y < y1 + 0.3 for x0, x1, y0, y1 in (hs["box"] for hs in HOUSES))


def dress_ground(rng, h, road):
    """Grass tufts and stones over the open ground: thicker at the edges of things, none on the road or in the
    moat; a few stones along the road's verge."""
    placed = 0
    tries = 0
    while placed < 520 and tries < 6000:
        tries += 1
        x, y = rng.uniform(EXTENT["x0"] + 2, EXTENT["x1"] - 2), rng.uniform(EXTENT["y0"] + 1, EXTENT["y1"])
        if _blocked(x, y):
            continue
        dr = road_dist(x, y, road)
        if dr < 2.2:
            continue
        z = h(x, y)
        if rng.random() < 0.22:
            k.rock("stone", x, y, z - 0.03, rng.uniform(0.06, 0.2), rng)
        else:
            k.grass_tuft(x, y, z - 0.01, rng, h=rng.uniform(0.15, 0.4), mat=rng.choice(("grass", "grass_dry", "grass_dry")))
        placed += 1
    for _ in range(60):
        x, y = rng.uniform(EXTENT["x0"] + 2, EXTENT["x1"] - 2), rng.uniform(EXTENT["y0"] + 4, EXTENT["y1"])
        if _blocked(x, y):
            continue
        dr = road_dist(x, y, road)
        if 2.2 < dr < 3.4:
            k.rock("stone", x, y, h(x, y) - 0.03, rng.uniform(0.08, 0.22), rng)


def colliders(trees):
    bx0, bx1, by0, by1 = BRIDGE["x0"], BRIDGE["x1"], BRIDGE["y0"], BRIDGE["y1"]
    ex0, ex1, ey0, ey1 = EXTENT["x0"] + 2, EXTENT["x1"] - 2, EXTENT["y0"] + 1, EXTENT["y1"]
    for x0, x1 in ((bx0 - 0.15, bx0), (bx1, bx1 + 0.15)):
        bx("hidden", True, (x0, ey0, -0.2), (x1, by0, 1.2))
        bx("hidden", True, (x0, by1, -0.2), (x1, ey1, 1.2))
    bx("hidden", True, (ex0 - 0.1, ey0, 0), (ex0, ey1, 3))
    bx("hidden", True, (ex1, ey0, 0), (ex1 + 0.1, ey1, 3))
    bx("hidden", True, (ex0, ey0 - 0.1, 0), (ex1, ey0, 3))
    bx("hidden", True, (ex0, ey1, 0), (ex1, ey1 + 0.1, 3))
    for t in trees:
        x, d, s = t["X"], t["D"], t["scale"]
        sb.cyl("hidden", True, (x, d, 0), (x + 0.15 * s, d + 0.1 * s, 2.5 * s), 0.35 * s, segs=8)


def route_road(L):
    """The road's centre line from the map's route, carried straight on to the section's edges."""
    c = [tuple(p) for p in L["route"]["centre"]]
    (ax, ay), (bx_, by) = c[0], c[1]
    t = (EXTENT["x0"] - ax) / (bx_ - ax) if bx_ != ax else 0
    head = (EXTENT["x0"], ay + t * (by - ay))
    (ax, ay), (bx_, by) = c[-2], c[-1]
    t = (EXTENT["x1"] - bx_) / (bx_ - ax) if bx_ != ax else 0
    tail = (EXTENT["x1"], by + t * (by - ay))
    return [head] + c + [tail]


# ---------------------------------------------------------------- build / export

def build(scene, seed=11):
    sb.B = sb.Buckets()
    rng = random.Random(seed)
    L = json.load(open(LAYOUT_JSON, encoding="utf-8"))
    LAYOUT.clear()
    LAYOUT.update(L)
    derive(L)
    road = route_road(L)
    h = ground(rng, road)
    bridge(rng)
    wing(EXTENT["y0"] + 3.5, GB["y0"], rng, WING_S)
    wing(GB["y1"], EXTENT["y1"], rng, WING_N, flat_near=GB["y1"])
    gate_block(rng)
    podium()
    hall(rng)
    houses(rng)
    ramp_and_terrace()
    tax_office(rng)
    yards(h)
    dress_ground(rng, h, road)
    colliders(L["trees"])

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
