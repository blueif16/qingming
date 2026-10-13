"""Inner-city kit: the parts S6 (the inner city, sections/inner_city) needs that song_kit.py lacks.

Generic builder functions in the song_kit manner (the lead moves them into song_kit.py afterwards): each adds faces
to street_b1's bucket set `sb.B` and never opens an entity; the section builder wraps every call in
`with sb.entity(<map id>):`. Positions always come from the caller (layout.json); sizes the strokes can't give are
keyword arguments marked `choice:` at the call. Frame: x = map X (east), y = map D (north), z up, metres.

Messenger's construction rules (no plain boxes; edges have thickness; openings are framed; the triangles go into
trims and small things) apply as in song_kit. Signs carry their painted characters from one atlas per section
(SIGN_ATLAS, gen/sections/inner_city/make_signs.mjs): a sign's face is mapped onto its cell.
"""
import json
import math
import random

from mathutils import Vector

import song_kit as k
import street_b1 as sb

V = Vector
UP = V((0, 0, 1))
QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SIGN_TEX = QM + r"\gen\sections\inner_city\textures\signs_inner_city.png"
SIGN_JSON = QM + r"\gen\sections\inner_city\textures\signs_inner_city.json"
# flat colours (true colours, palette.js leaves unknown names as painted): flower bunches on the scaffolds, the red
# gourd lamps, the dark oiled paper of the stall umbrellas, raw pork
for _name, _spec in {
    "signs_inner_city": (SIGN_TEX, 1, None),
    "flower": (None, 1, "#b8505c"),
    "lantern": (None, 1, "#a64e3c"),
    "oilpaper": (None, 1, "#6a5642"),
    "meat": (None, 1, "#d6a48e"),
}.items():
    sb.MATERIALS.setdefault(_name, _spec)
_ATLAS = {}


def atlas():
    if not _ATLAS:
        with open(SIGN_JSON, encoding="utf-8") as f:
            _ATLAS.update(json.load(f))
    return _ATLAS


def cell_uv(name, sub=None):
    """UVs (Blender: origin bottom-left) of a sign's atlas cell: [(u0, v0), (u1, v0), (u1, v1), (u0, v1)] = bottom-left,
    bottom-right, top-right, top-left of the face. sub = (t0, t1): only that part of the cell's height (0 = top)."""
    a = atlas()
    S = a["size"]
    x0, y0, x1, y1 = a["cells"][name]
    if sub:
        h = y1 - y0
        y0, y1 = y0 + h * sub[0], y0 + h * sub[1]
    u0, u1 = x0 / S, x1 / S
    vb, vt = 1 - y1 / S, 1 - y0 / S
    return [(u0, vb), (u1, vb), (u1, vt), (u0, vt)]


# ---------------------------------------------------------------- small helpers

def quad2(mat, a, b, c, d, uv=None):
    """A thin surface seen from both sides (cloth, paper, mat)."""
    sb.quad(mat, False, a, b, c, d, uv=uv)
    sb.quad(mat, False, d, c, b, a, uv=[uv[3], uv[2], uv[1], uv[0]] if uv else None)


def _frame_vecs(p0, p1):
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (b - a)
    L = t.length
    t.normalize()
    n = V((t.y, -t.x, 0))   # right of p0 -> p1
    return a, b, t, n, L


def lashed_pole(x, y, z0, z1, r=0.075, rng=None, lashings=(), mat="bamboo"):
    """A round pole (a lashed scaffold member): slightly tapered, rope bindings at the given heights."""
    sb.cyl(mat, True, (x, y, z0), (x, y, z1), r, r * 0.8, segs=7)
    for z in lashings:
        sb.cyl("rope", False, (x, y, z - 0.07), (x, y, z + 0.07), r * 1.22, segs=7, caps=False)


def flower_bunch(x, y, z, rng, s=1.0, n=5):
    """A bunch of paper or silk flowers tied to a scaffold: small soft lumps round a point, some leaves."""
    for _ in range(n):
        dx, dy, dz = (rng.uniform(-0.22, 0.22) * s for _ in range(3))
        k.rock("flower", x + dx, y + dy, z + dz, rng.uniform(0.07, 0.12) * s, rng, flat=0.9)
    for _ in range(2):
        a = rng.uniform(0, 6.28)
        p = V((x, y, z))
        q = p + V((math.cos(a) * 0.3 * s, math.sin(a) * 0.3 * s, rng.uniform(-0.2, 0.05) * s))
        k.beam("willow", False, p, q, 0.025 * s, 0.07 * s, 0)


def streamer(p, length, rng, w=0.09, mat="cloth_red"):
    """A cloth streamer hanging from a point, gently curved."""
    p = V(p)
    pts = [p + V((rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), -length * i / 4)) for i in range(5)]
    for a, b in zip(pts, pts[1:]):
        quad2(mat, a + V((w / 2, 0, 0)), a - V((w / 2, 0, 0)), b - V((w / 2, 0, 0)), b + V((w / 2, 0, 0)))


# ---------------------------------------------------------------- roofs and storeys

def lean_to(x0, x1, y_low, y_high, z_low, z_high, mat="roof", thick=0.16, ns=8, nt=4, curve=1.25, rafters=True):
    """A single-slope tiled roof (a pent roof 腰檐 or a lean-to) from its low eave at y_low (z_low) up to a wall at
    y_high (z_high), along x0..x1; slightly concave, fascia and rafter ends along the eave."""
    def height(s, t):
        return z_low + (z_high - z_low) * (t ** curve)
    xa, xb = (x0, x1) if y_low < y_high else (x1, x0)   # wind the slope so its top faces up and out
    k._roof_surface([((xa, y_low), (xb, y_low), (xa, y_high), (xb, y_high), ns)], height, thick, nt, mat=mat,
                    rafters=rafters)
    k.beam("timber", False, (x0, y_high + 0.02, z_high - 0.05), (x1, y_high + 0.02, z_high - 0.05), 0.12, 0.14, 0.02)


def mat_roof(corners, z, rng, mat="reed", sag=0.06, frame=True):
    """A flat or gently sloping woven-mat roof over four corners [(x, y, z), ...] (counter-clockwise from above):
    a thin slab with a sag in the middle, a timber frame round its edge and battens across."""
    P = [V(c) for c in corners]
    mid = sum(P, V((0, 0, 0))) / 4 - UP * sag
    a, b, c, d = P
    W = (b - a).length
    L = (d - a).length
    for q in ((a, b, mid), (b, c, mid), (c, d, mid), (d, a, mid)):
        sb.B.add(mat, False, [q[0] + UP * 0.03, q[1] + UP * 0.03, q[2] + UP * 0.03], [(0, 1, 2)])
        sb.B.add(mat, False, [q[2], q[1], q[0]], [(0, 1, 2)])
    if frame:
        for p, q in ((a, b), (b, c), (c, d), (d, a)):
            k.beam("timber", False, p, q, 0.06, 0.07, 0.012)
        n = max(2, int(W / 0.6))
        for i in range(1, n):
            t = i / n
            k.beam("bamboo", False, a.lerp(b, t) + UP * 0.02, d.lerp(c, t) + UP * 0.02, 0.035, 0.03, 0)


def xieshan_roof(x0, x1, y0, y1, z_eave, z_ridge, along="x", ornament_s=0.9, lift=0.4, ns=12, nt=6, gable_mat="redwood"):
    """Hip-gable roof (歇山): a hipped roof whose upper part ends in small vertical gables with a hanging-fish board
    (懸魚) at the ridge ends. along: the ridge's direction ('x' or 'y')."""
    if along == "y":
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        hx, hy = (y1 - y0) / 2, (x1 - x0) / 2
        with k.placed(k.frame(cx, cy, 0, 90)):
            xieshan_roof(-hx, hx, -hy, hy, z_eave, z_ridge, "x", ornament_s, lift, ns, nt, gable_mat)
        return
    k.hip_roof(x0, x1, y0, y1, z_eave, z_ridge, lift=lift, ns=ns, nt=nt, ornament_s=ornament_s)
    d = (y1 - y0) / 2
    yc = (y0 + y1) / 2
    # the gables: vertical triangles set in from the hip ends, on the upper 45% of the rise
    zg = z_eave + (z_ridge - z_eave) * 0.5
    half = d * 0.52
    for x, sgn in ((x0 + d * 0.62, 1), (x1 - d * 0.62, -1)):
        tri = [V((x, yc - half, zg)), V((x, yc + half, zg)), V((x, yc, z_ridge + 0.05))]
        if sgn > 0:
            tri = [tri[1], tri[0], tri[2]]
        sb.B.add("plaster", False, tri, [(0, 1, 2)])
        sb.B.add("plaster", False, list(reversed(tri)), [(0, 1, 2)])
        for p, q in ((tri[0], tri[2]), (tri[1], tri[2])):
            k.beam(gable_mat, False, p + V((-sgn * 0.05, 0, 0)), q + V((-sgn * 0.05, 0, 0.04)), 0.06, 0.2, 0.012)
        # the hanging-fish board under the apex
        k.beam(gable_mat, False, V((x - sgn * 0.07, yc, z_ridge - 0.05)), V((x - sgn * 0.07, yc, z_ridge - 0.75)), 0.04, 0.22, 0.01)


def floor_slab(x0, x1, y0, y1, z, rng, thick=0.22, front="y0", strip=1.4):
    """An upper floor: a slab at z on joists, a fascia beam round its edge (collides: people stand on it); plank
    boards laid only along the edge that shows (front: 'y0' or 'y1', `strip` m deep), the rest is a plain wash."""
    if strip <= 0:
        k.bx("deck", True, (x0 + 0.02, y0 + 0.02, z - 0.05), (x1 - 0.02, y1 - 0.02, z))
    elif front == "y0":
        k.plank_deck(x0, x1, y0, y0 + strip, z, rng, w=(0.26, 0.36), thick=0.05)
        k.bx("deck", True, (x0 + 0.02, y0 + strip, z - 0.05), (x1 - 0.02, y1 - 0.02, z))
    else:
        k.plank_deck(x0, x1, y1 - strip, y1, z, rng, w=(0.26, 0.36), thick=0.05)
        k.bx("deck", True, (x0 + 0.02, y0 + 0.02, z - 0.05), (x1 - 0.02, y1 - strip, z))
    k.bx("timber", True, (x0 + 0.04, y0 + 0.04, z - thick), (x1 - 0.04, y1 - 0.04, z - 0.05))
    for a, b in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
        k.beam("redwood", False, (a[0], a[1], z - 0.13), (b[0], b[1], z - 0.13), 0.08, 0.2, 0.015)


def wall_bays(p0, p1, z0, z1, cols, kinds, rng, mat="plaster", thick=0.14, sill=0.75, head=None, out_n=None):
    """A wall from p0 to p1 between columns at fractions `cols` (0..1, both ends included) with each bay a 'wall',
    'window' (sill wall, straight-bar lattice window, plaster above), 'open' or 'door' (plank door ajar); the columns
    themselves are the caller's. Outer side = right of p0 -> p1."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    head = head if head is not None else z1 - 0.35
    for i, kind in enumerate(kinds):
        f0, f1 = cols[i], cols[i + 1]
        pa, pb = a + t * (L * f0 + 0.12), a + t * (L * f1 - 0.12)
        pa2, pb2 = (pa.x, pa.y), (pb.x, pb.y)
        if kind == "wall":
            k.board(mat, True, pa2, pb2, thick, z0, z1)
        elif kind == "window":
            k.board(mat, True, pa2, pb2, thick, z0, z0 + sill)
            k.lattice_window(pa2, pb2, z0 + sill, head)
            k.board(mat, False, pa2, pb2, thick, head, z1)
            inner = (pa - n * 0.08, pb - n * 0.08)
            k.board("plaster", True, (inner[0].x, inner[0].y), (inner[1].x, inner[1].y), 0.02, z0 + sill, head)
        elif kind == "door":
            k.plank_door(pa2, pb2, z0, head, ajar=rng.uniform(0.3, 0.8))
            k.board(mat, False, pa2, pb2, thick, head, z1)
        elif kind == "open":
            k.board(mat, False, pa2, pb2, thick, head, z1)   # a head board over the opening


# ---------------------------------------------------------------- the flowered scaffold gateway (彩楼欢门)

def cailou(poles, beams, braces, rng, flowers=(), lanterns=(), streamers=(), lattice=None):
    """The 彩楼欢门 of a wine house: lashed poles standing on the street in front of the shop, their tops tied with
    flower bunches; horizontal beams and V-braces between them hung with flowers and streamers; lanterns on posts
    and on the scaffold.
    poles: [(x, y, z_top, r)]; beams: [((x, y, z), (x, y, z))]; braces: [(p, q)] (thin lashed members);
    flowers: [(x, y, z, s)]; lanterns: [(x, y, z, kind, post_foot_or_None)] kind 'round' | 'cube';
    streamers: [(x, y, z, length)]; lattice: optional (p0, p1, z0, z1): a band of crossed bars between two poles."""
    for x, y, zt, r in poles:
        lashed_pole(x, y, -0.05, zt, r=r, rng=rng, lashings=(zt * 0.28, zt * 0.62, zt - 0.4))
        # a pointed, flagged cap on the tall poles
        sb.cyl("bamboo", False, (x, y, zt), (x, y, zt + 0.45), r * 0.8, 0.01, segs=6)
    for p, q in beams:
        k.beam("bamboo", True if min(p[2], q[2]) < 2.2 else False, p, q, 0.11, 0.11, 0.025)
        L = (V(q) - V(p)).length
        for i in range(max(1, int(L / 0.9))):
            m = V(p).lerp(V(q), (i + 0.5) / max(1, int(L / 0.9)))
            sb.cyl("rope", False, m - V((0.06, 0, 0)), m + V((0.06, 0, 0)), 0.07, segs=6, caps=False)
    for p, q in braces:
        k.beam("bamboo", False, p, q, 0.07, 0.07, 0.015)
    if lattice:
        (ax, ay), (bx_, by), z0, z1 = lattice
        A, B = V((ax, ay, 0)), V((bx_, by, 0))
        L = (B - A).length
        n = max(2, int(L / 0.7))
        for i in range(n):
            pa, pb = A.lerp(B, i / n), A.lerp(B, (i + 1) / n)
            k.beam("bamboo", False, pa + UP * z0, pb + UP * z1, 0.04, 0.04, 0)
            k.beam("bamboo", False, pa + UP * z1, pb + UP * z0, 0.04, 0.04, 0)
    for x, y, z, s in flowers:
        flower_bunch(x, y, z, rng, s)
    for x, y, z, ln in streamers:
        streamer((x, y, z), ln, rng)
    for x, y, z, kind, foot in lanterns:
        if foot:
            k.post("timber", True, foot[0], foot[1], -0.05, z - 0.25, 0.08, 0.015)
        if kind == "round":
            round_lantern(x, y, z)
        else:
            cube_lantern(x, y, z)


def round_lantern(x, y, z, r=0.3):
    """A round lantern on a frame with a cross pattern (the 正店's 栀子灯 style on posts): a ribbed sphere, a cap."""
    prof = [(0.05, -r), (r * 0.7, -r * 0.75), (r, 0), (r * 0.7, r * 0.75), (0.05, r)]
    sb.lathe("cloth_white", False, (x, y, z), prof, segs=10)
    for a in range(4):
        ang = a * math.pi / 4
        d = V((math.cos(ang), math.sin(ang), 0))
        pts = [V((x, y, z)) + d * (r * 1.02 * math.cos(t)) + UP * (r * 1.02 * math.sin(t)) for t in (-1.4, -0.7, 0, 0.7, 1.4)]
        sb.tube("lattice", False, pts, [0.012] * 5, segs=4)
    sb.cyl("timber", False, (x, y, z + r), (x, y, z + r + 0.12), 0.06, 0.04, segs=6)


def cube_lantern(x, y, z, s=0.36):
    """A cube lantern: paper faces in a dark frame, hung under a cap."""
    h = s / 2
    k.bx("cloth_white", False, (x - h + 0.02, y - h + 0.02, z - h + 0.02), (x + h - 0.02, y + h - 0.02, z + h - 0.02))
    for sx in (-h, h):
        for sy in (-h, h):
            k.beam("lattice", False, (x + sx, y + sy, z - h), (x + sx, y + sy, z + h), 0.03, 0.03, 0)
    for sz in (-h, h):
        for (ax, ay), (bx_, by) in (((-h, -h), (h, -h)), ((h, -h), (h, h)), ((h, h), (-h, h)), ((-h, h), (-h, -h))):
            k.beam("lattice", False, (x + ax, y + ay, z + sz), (x + bx_, y + by, z + sz), 0.03, 0.03, 0)
    k.post("timber", False, x, y, z + h, z + h + 0.18, 0.05, 0)


def pole_scaffold(p0, p1, poles, rng, bars=(), z_foot=0.0, ornaments=6):
    """A row of tall thin poles with spear-like finials along a shop front (a small 彩楼), tied by cross-bars and hung
    with small ornaments. poles: [(t 0..1 along p0->p1, z_top)]; bars: [(t0, z0, t1, z1)]."""
    A, B = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    for t, zt in poles:
        p = A.lerp(B, t)
        lashed_pole(p.x, p.y, z_foot - 0.05, zt, r=0.05, rng=rng, lashings=(zt * 0.5,))
        sb.cyl("timber", False, (p.x, p.y, zt), (p.x, p.y, zt + 0.35), 0.06, 0.005, segs=5)   # spear finial
    for t0, z0, t1, z1 in bars:
        a, b = A.lerp(B, t0), A.lerp(B, t1)
        k.beam("bamboo", False, (a.x, a.y, z0), (b.x, b.y, z1), 0.045, 0.045, 0)
    for i in range(ornaments):
        t = (i + 0.5) / ornaments
        p = A.lerp(B, t)
        z = rng.uniform(2.6, 3.6)
        sb.cyl("rope", False, (p.x, p.y, z), (p.x, p.y, z - 0.35), 0.008, segs=4)
        k.rock("cloth_red", p.x, p.y, z - 0.42, 0.06, rng, flat=1.2)


# ---------------------------------------------------------------- lamps, lamp-boxes, signs, banners

def gourd_lamp(x, y, z, h=1.25, rng=None):
    """栀子灯: a tall reddish gourd-shaped lamp (a narrow neck over a round belly) on a low box stand."""
    sb.lathe("timber", True, (x, y, z), [(0.24, 0), (0.24, 0.22), (0.2, 0.24)], segs=8)
    zb = z + 0.24
    prof = [(0.06, 0), (0.24, h * 0.12), (0.3, h * 0.3), (0.24, h * 0.48), (0.1, h * 0.6), (0.08, h * 0.72),
            (0.14, h * 0.82), (0.1, h * 0.93), (0.03, h)]
    sb.lathe("lantern", False, (x, y, zb), prof, segs=12)
    for t in (0.3, 0.82):
        r = 0.3 if t < 0.5 else 0.14
        sb.cyl("lattice", False, (x, y, zb + h * t - 0.015), (x, y, zb + h * t + 0.015), r + 0.012, segs=12, caps=False)


def lamp_box(x, y, z, w, d, h, sign, yaw=0.0, cap=True, legs=0.55, flowers=None, rng=None):
    """An upright lamp-box (灯箱): a tall box with framed paper faces, its front face (toward -y in its frame)
    carrying the sign's characters, under a small roof-shaped cap, on short legs; optional flower spray on top."""
    with k.placed(k.frame(x, y, z, yaw)):
        z0, z1 = legs, legs + h
        for sx in (-w / 2, w / 2):
            for sy in (-d / 2, d / 2):
                k.post("timber", True, sx, sy, 0, z1 + 0.04, 0.06, 0.012)
        # faces: the front carries the characters; the others are plain paper
        uv = cell_uv(sign)
        sb.quad("signs_inner_city", False, (-w / 2 + 0.03, -d / 2 - 0.005, z0), (w / 2 - 0.03, -d / 2 - 0.005, z0),
                (w / 2 - 0.03, -d / 2 - 0.005, z1), (-w / 2 + 0.03, -d / 2 - 0.005, z1), uv=uv)
        sb.quad("cloth_white", False, (w / 2 - 0.02, d / 2, z0), (-w / 2 + 0.02, d / 2, z0), (-w / 2 + 0.02, d / 2, z1), (w / 2 - 0.02, d / 2, z1))
        for sx in (-w / 2, w / 2):
            a, b = (sx, -d / 2 + 0.02), (sx, d / 2 - 0.02)
            if sx > 0:
                sb.quad("cloth_white", False, (sx, a[1], z0), (sx, b[1], z0), (sx, b[1], z1), (sx, a[1], z1))
            else:
                sb.quad("cloth_white", False, (sx, b[1], z0), (sx, a[1], z0), (sx, a[1], z1), (sx, b[1], z1))
        for zz in (z0, z1):
            for (ax, ay), (bx_, by) in (((-w / 2, -d / 2), (w / 2, -d / 2)), ((w / 2, -d / 2), (w / 2, d / 2)),
                                        ((w / 2, d / 2), (-w / 2, d / 2)), ((-w / 2, d / 2), (-w / 2, -d / 2))):
                k.beam("timber", False, (ax, ay, zz), (bx_, by, zz), 0.05, 0.05, 0.01)
        if cap:
            # a small roof-shaped cap: four sloping faces with a thick eave, and a knob
            e = 0.1
            ring = [V((-w / 2 - e, -d / 2 - e, z1 + 0.06)), V((w / 2 + e, -d / 2 - e, z1 + 0.06)), V((w / 2 + e, d / 2 + e, z1 + 0.06)),
                    V((-w / 2 - e, d / 2 + e, z1 + 0.06))]
            apex = V((0, 0, z1 + 0.32))
            k.prism("roof", False, [p - UP * 0.04 for p in ring], ring, cap_top=False, cap_bottom=True)
            for i in range(4):
                sb.B.add("roof", False, [ring[i], ring[(i + 1) % 4], apex], [(0, 1, 2)])
            sb.lathe("timber", False, (0, 0, z1 + 0.3), [(0.03, 0), (0.05, 0.04), (0.01, 0.09)], segs=6)
        if flowers and rng:
            flower_bunch(0, 0, z1 + 0.45, rng, s=0.8)


def signboard(p_left, p_right, z0, z1, sign, rng, posts=True, top="round", foot=None, thick=0.07, sub=None,
              back="timber"):
    """A tall signboard: a board from p_left to p_right (its face toward the right of p_left -> p_right, i.e. the
    viewer) between z0 and z1, its face carrying the sign's characters; a dark frame round it, a rounded or
    pointed top, on two posts down to the ground (posts=True) or a box foot (foot=(z_foot_top))."""
    a, b, t, n, L = _frame_vecs(p_left, p_right)
    o = n * (thick / 2 + 0.004)
    uv = cell_uv(sign, sub)
    sb.quad("signs_inner_city", False, a + o + UP * z0, b + o + UP * z0, b + o + UP * z1, a + o + UP * z1, uv=uv)
    k.board(back, False, (a.x, a.y), (b.x, b.y), thick, z0, z1)
    for p, q in ((a + UP * z0, b + UP * z0), (b + UP * z0, b + UP * z1), (b + UP * z1, a + UP * z1), (a + UP * z1, a + UP * z0)):
        k.beam("timber", False, p + n * 0.01, q + n * 0.01, 0.045, thick + 0.03, 0.008)
    m = a.lerp(b, 0.5)
    if top == "round":
        sb.cyl("timber", False, (m.x - t.x * L / 2, m.y - t.y * L / 2, z1 + 0.02), (m.x + t.x * L / 2, m.y + t.y * L / 2, z1 + 0.02),
               0.05, segs=6)
        k.beam("timber", False, m + UP * z1, m + UP * (z1 + L * 0.35), L * 0.55, thick + 0.02, L * 0.12)
    elif top == "pointed":
        sb.B.add("timber", False, [a + o + UP * z1, b + o + UP * z1, m + o + UP * (z1 + L * 0.5)], [(0, 1, 2)])
        sb.B.add("timber", False, [m - o + UP * (z1 + L * 0.5), b - o + UP * z1, a - o + UP * z1], [(0, 1, 2)])
    if posts:
        for p in (a - t * 0.03, b + t * 0.03):
            k.post("timber", True, p.x, p.y, -0.05, z1 + 0.05, 0.08, 0.015)
    if foot is not None:
        k.soft_box("timber", True, (m.x - L * 0.6, m.y - 0.25, -0.02), (m.x + L * 0.6, m.y + 0.25, foot), rng, r=0.03, wob=0.005)


def banner_on_pole(foot, top, cloth_top, cloth_w, cloth_h, sign, facing):
    """A cloth banner hanging from a slanting pole: the pole from foot (x, y, z) to top; the banner's top edge at
    cloth_top (x, y, z) hangs straight down, cloth_w wide, its face toward `facing` (plan vector)."""
    k.beam("bamboo", True, foot, top, 0.07, 0.07, 0.015)
    f = V((facing[0], facing[1], 0)).normalized()
    s = V((-f.y, f.x, 0))   # across the face
    c = V(cloth_top)
    a, b = c - s * cloth_w / 2, c + s * cloth_w / 2
    uv = cell_uv(sign)
    # front face toward f (wound so its normal points along f), the back plain cloth
    quad2("cloth_white", a - f * 0.006 - UP * cloth_h, b - f * 0.006 - UP * cloth_h, b - f * 0.006, a - f * 0.006)
    sb.quad("signs_inner_city", False, b + f * 0.004 - UP * cloth_h, a + f * 0.004 - UP * cloth_h, a + f * 0.004, b + f * 0.004,
            uv=uv)
    k.beam("bamboo", False, a + UP * 0.03, b + UP * 0.03, 0.03, 0.03, 0)


def a_frame_board(foot_a, foot_b, apex, sign_center, plaque=0.55, sign="jie", rng=None):
    """The 解 board: a tall triangular board leaning against an eave (two feet on the ground, the apex up at the
    eave), boarded over, with a small framed plaque bearing the sign hung on its face."""
    A, B, P = V(foot_a), V(foot_b), V(apex)
    for q in (A, B):
        k.beam("timber", True, q, P, 0.08, 0.08, 0.015)
    # the boarding: thin boards across the triangle, from the feet up
    n = 9
    for i in range(1, n):
        t = i / n
        p, q = A.lerp(P, t), B.lerp(P, t)
        k.beam("deck", False, p, q, 0.06, 0.16 * (1 - t * 0.5), 0.01)
    c = V(sign_center)
    nrm = ((B - A).cross(P - A)).normalized()
    if nrm.dot(V((0, -1, 0))) < 0:
        nrm = -nrm
    side = (B - A).normalized()
    h = plaque / 2
    uv = cell_uv(sign)
    off = nrm * 0.09
    sb.quad("signs_inner_city", False, c + off - side * h - UP * h, c + off + side * h - UP * h, c + off + side * h + UP * h,
            c + off - side * h + UP * h, uv=uv)
    for p, q in ((c - side * h - UP * h, c + side * h - UP * h), (c + side * h - UP * h, c + side * h + UP * h),
                 (c + side * h + UP * h, c - side * h + UP * h), (c - side * h + UP * h, c - side * h - UP * h)):
        k.beam("timber", False, p + off * 0.6, q + off * 0.6, 0.05, 0.05, 0.01)


def eave_plaque(p, facing, s, sign):
    """A small square plaque hung under an eave, its face toward `facing`."""
    f = V((facing[0], facing[1], 0)).normalized()
    sd = V((-f.y, f.x, 0))
    c = V(p)
    h = s / 2
    uv = cell_uv(sign)
    sb.quad("signs_inner_city", False, c + f * 0.03 + sd * h - UP * h, c + f * 0.03 - sd * h - UP * h, c + f * 0.03 - sd * h + UP * h,
            c + f * 0.03 + sd * h + UP * h, uv=uv)
    k.bx("timber", False, (c.x - h * abs(sd.x) - 0.02, c.y - h * abs(sd.y) - 0.02, c.z - h - 0.02),
         (c.x + h * abs(sd.x) + 0.02, c.y + h * abs(sd.y) + 0.02, c.z + h + 0.02))


# ---------------------------------------------------------------- the square well (方井)

def square_well(curb, platform, z_top, rng):
    """The square well: a wide plank platform (boards running east-west, a few cm thick) round a low wooden curb
    whose opening is divided into four by a 田-shaped plank cover; dark water in the four openings.
    curb, platform: four plan corners each [sw, se, ne, nw]; z_top: the curb's top above the ground."""
    psw, pse, pne, pnw = (V((p[0], p[1], 0)) for p in platform)
    # platform boards
    n = max(4, int((pnw - psw).length / 0.28))
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n - 0.012
        a, b = psw.lerp(pnw, t0), pse.lerp(pne, t0)
        c, d = pse.lerp(pne, t1), psw.lerp(pnw, t1)
        k.soft_slab("deck", True, [(a.x, a.y), (b.x, b.y), (c.x, c.y), (d.x, d.y)], -0.04, 0.08 + rng.uniform(-0.01, 0.01), rng,
                    r=0.03, wob=0.006, seg=1.4, ease=0.012, along=(1, 0))
    csw, cse, cne, cnw = (V((p[0], p[1], 0)) for p in curb)
    ring = [csw, cse, cne, cnw]
    w = 0.16
    for p, q in zip(ring, ring[1:] + ring[:1]):
        k.beam("timber", True, p + UP * (z_top - 0.08), q + UP * (z_top - 0.08), w, 0.18, 0.02)
    # the 田 cover: one bar each way across the middle
    mid = lambda p, q: p.lerp(q, 0.5)  # noqa: E731
    k.beam("timber", False, mid(csw, cnw) + UP * (z_top - 0.06), mid(cse, cne) + UP * (z_top - 0.06), 0.13, 0.14, 0.02)
    k.beam("timber", False, mid(csw, cse) + UP * (z_top - 0.06), mid(cnw, cne) + UP * (z_top - 0.06), 0.13, 0.14, 0.02)
    sb.B.add("water", False, [csw + UP * 0.02, cse + UP * 0.02, cne + UP * 0.02, cnw + UP * 0.02], [(0, 1, 2, 3)])
    sb.B.add("interior", False, [cnw + UP * (z_top - 0.16), cne + UP * (z_top - 0.16), cse + UP * (z_top - 0.16), csw + UP * (z_top - 0.16)], [(0, 1, 2, 3)])


# ---------------------------------------------------------------- shades: umbrellas, awnings

def umbrella(x, y, z_hub, R, rng, tilt=(0.0, 0.0), foot=None, ribs=14, rise=0.3, mat="oilpaper", pole=True):
    """A big stall umbrella (parasol) of oiled paper or mat on bamboo ribs: a shallow cone from its hub out to the
    rim, tilted by tilt (dx, dy per m of radius), ribs and a stretcher bell under it, a pole down to its foot."""
    hub = V((x, y, z_hub))
    tl = V((tilt[0], tilt[1], 0))
    rim = []
    for i in range(ribs):
        a = 2 * math.pi * i / ribs
        d = V((math.cos(a), math.sin(a), 0))
        rim.append(hub + d * R + UP * (-rise + d.dot(tl) * R))
    top = hub + UP * 0.12
    for i in range(ribs):
        p, q = rim[i], rim[(i + 1) % ribs]
        sb.B.add(mat, False, [top, p, q], [(0, 1, 2)])
        sb.B.add(mat, False, [q - UP * 0.015, p - UP * 0.015, top - UP * 0.03], [(0, 1, 2)])
        k.beam("bamboo", False, top - UP * 0.04, p - UP * 0.03, 0.02, 0.02, 0)
    stretch = hub - UP * 0.45
    for i in range(0, ribs, 2):
        k.beam("bamboo", False, stretch, hub.lerp(rim[i], 0.45) - UP * 0.06, 0.015, 0.015, 0)
    if pole:
        f = V(foot) if foot else V((x, y, 0))
        sb.cyl("bamboo", True, f - UP * 0.05, hub + UP * 0.15, 0.035, segs=6)


# ---------------------------------------------------------------- fences, stands, furniture

def slat_fence(p0, p1, h, rng, slat=0.11, mat="timber"):
    """A barrier fence (杈子) of close-set vertical slats under a top rail and over a bottom rail, posts at the ends."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    for p in (a, b):
        k.post(mat, True, p.x, p.y, -0.03, h + 0.08, 0.1, 0.02)
    k.beam(mat, True, a + UP * (h - 0.03), b + UP * (h - 0.03), 0.07, 0.07, 0.012)
    k.beam(mat, False, a + UP * (h * 0.82), b + UP * (h * 0.82), 0.05, 0.05, 0)
    k.beam(mat, True, a + UP * 0.12, b + UP * 0.12, 0.06, 0.06, 0.01)
    m = max(2, int(L / slat))
    for i in range(1, m):
        p = a + t * (L * i / m)
        k.beam(mat, False, p + UP * 0.08, p + UP * (h - 0.06) + UP * rng.uniform(-0.02, 0.02), 0.035, 0.03, 0)


def tray_stand(x, y, z, L, W, h, rng, yaw=0.0, tray_mat="interior"):
    """An oval tray on a folding stand with crossed, splayed legs (a street vendor's 托盘架)."""
    with k.placed(k.frame(x, y, z, yaw)):
        for sx in (-1, 1):
            k.beam("timber", False, (sx * L * 0.32, -W * 0.45, 0), (-sx * L * 0.18, W * 0.3, h - 0.06), 0.04, 0.04, 0)
            k.beam("timber", False, (sx * L * 0.32, W * 0.45, 0), (-sx * L * 0.18, -W * 0.3, h - 0.06), 0.04, 0.04, 0)
        k.beam("timber", False, (-L * 0.3, 0, h * 0.45), (L * 0.3, 0, h * 0.45), 0.03, 0.03, 0)
        prof = [(0.0, 0), (1.0, 0.03), (1.04, 0.09)]
        verts, faces = [], []
        seg = 14
        for j, (r, zz) in enumerate(prof):
            for i in range(seg):
                a = 2 * math.pi * i / seg
                verts.append(V((math.cos(a) * L / 2 * r, math.sin(a) * W / 2 * r, h + zz)))
        for j in range(len(prof) - 1):
            for i in range(seg):
                i2 = (i + 1) % seg
                faces.append((j * seg + i, j * seg + i2, (j + 1) * seg + i2, (j + 1) * seg + i))
        sb.B.add(tray_mat, False, verts, faces)


def goods_heap(x, y, z, L, W, rng, n=9, mat="cloth_white", s=0.09, high=0.0):
    """Goods heaped on a tray or a table: small soft lumps (cakes, buns, fruit), higher at the back if `high`."""
    for i in range(n):
        dx, dy = rng.uniform(-L / 2, L / 2) * 0.8, rng.uniform(-W / 2, W / 2) * 0.8
        zz = z + s * 0.6 + (high * max(0.0, dy / (W / 2)) if high else 0) + rng.uniform(0, s * 0.5)
        k.rock(mat, x + dx, y + dy, zz, s * rng.uniform(0.8, 1.2), rng, flat=0.75)


def stool(x, y, z, h=0.42, s=0.32, mat="timber"):
    # seats don't collide: a figure painted seated on one stands on the floor below it (people.js grounds it there)
    k.bx(mat, False, (x - s / 2, y - s / 2, z + h - 0.05), (x + s / 2, y + s / 2, z + h))
    for sx in (-1, 1):
        for sy in (-1, 1):
            k.beam(mat, False, (x + sx * s * 0.38, y + sy * s * 0.38, z), (x + sx * s * 0.42, y + sy * s * 0.42, z + h - 0.05), 0.04, 0.04, 0)


def bench(p0, p1, z, h=0.45, w=0.28, mat="timber"):
    """A long bench from p0 to p1: a thick plank top on splayed legs with a stretcher."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    k.beam(mat, False, a + UP * (z + h - 0.03), b + UP * (z + h - 0.03), w, 0.06, 0.015)   # seats don't collide (see stool)
    for p in (a + t * 0.15, b - t * 0.15):
        for s in (1, -1):
            k.beam(mat, False, p + n * s * w * 0.32 + UP * (z + h - 0.06), p + n * s * w * 0.45 + UP * z, 0.045, 0.045, 0)
    k.beam(mat, False, a + t * 0.15 + UP * (z + h * 0.35), b - t * 0.15 + UP * (z + h * 0.35), 0.035, 0.035, 0)


def counter(p0, p1, z, h, d, rng, mat="timber", front=True):
    """A shop counter: a top on legs with a front board (aprons), along p0 -> p1, d deep (toward the left)."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    back = -n * d
    top = [a, b, b + back, a + back]
    k.soft_slab(mat, True, [(p.x, p.y) for p in (top if (top[1] - top[0]).cross(top[2] - top[1]).z > 0 else top[::-1])],
                z + h - 0.06, z + h, rng, r=0.03, wob=0.005, ease=0.01)
    for p in (a + t * 0.06, b - t * 0.06):
        for q in (p + back * 0.1, p + back * 0.9):
            k.post(mat, False, q.x, q.y, z, z + h - 0.06, 0.06, 0.012)
    if front:
        k.board(mat, True, (a.x + t.x * 0.04, a.y + t.y * 0.04), (b.x - t.x * 0.04, b.y - t.y * 0.04), 0.04, z + 0.1, z + h - 0.08)


def tub(x, y, z, r, h, rng, mat="timber"):
    sb.lathe(mat, True, (x, y, z), [(r * 0.85, 0), (r, h)], segs=10)
    for t in (0.2, 0.75):
        sb.cyl("lattice", False, (x, y, z + h * t - 0.02), (x, y, z + h * t + 0.02), r * (0.87 + 0.13 * t) + 0.01, segs=10, caps=False)
    sb.cyl("interior", False, (x, y, z + h - 0.06), (x, y, z + h - 0.05), r * 0.95, segs=10)


def round_basket(x, y, z, r, h, rng, mat="reed", mouth=1.0, lid=False):
    """A big round woven basket: a bellied body, a rim, woven bands."""
    prof = [(r * 0.55, 0), (r * 0.9, h * 0.35), (r, h * 0.75), (r * mouth, h)]
    sb.lathe(mat, True, (x, y, z), prof, segs=12)
    sb.cyl("timber", False, (x, y, z + h - 0.03), (x, y, z + h + 0.01), r * mouth + 0.02, segs=12, caps=False)
    for t in (0.3, 0.6):
        sb.cyl("bamboo", False, (x, y, z + h * t - 0.01), (x, y, z + h * t + 0.01), r * (0.8 + 0.2 * t) + 0.012, segs=12, caps=False)
    if lid:
        sb.lathe(mat, False, (x, y, z + h), [(r * mouth + 0.02, 0), (r * 0.6, h * 0.25), (0.03, h * 0.32)], segs=12)
    else:
        sb.cyl("interior", False, (x, y, z + h - 0.12), (x, y, z + h - 0.11), r * mouth * 0.95, segs=12)


def chopping_block(x, y, z, r=0.32, h=0.8):
    """A thick round chopping block on a stout stump."""
    sb.lathe("timber", True, (x, y, z), [(r * 0.7, 0), (r * 0.75, h - 0.22), (r, h - 0.2), (r, h)], segs=10)
    sb.cyl("interior", False, (x, y, z + h - 0.21), (x, y, z + h - 0.17), r + 0.012, segs=10, caps=False)


def hanging_pork(x, y, z_hook, length=1.0, rng=None):
    """A half carcass hung from a hook: a long pale piece narrowing to a point."""
    sb.cyl("rope", False, (x, y, z_hook), (x, y, z_hook - 0.18), 0.012, segs=4)
    prof = [(0.02, 0), (0.17, length * 0.2), (0.2, length * 0.45), (0.14, length * 0.75), (0.03, length)]
    sb.lathe("meat", False, (x, y, z_hook - 0.18 - length), list(reversed([(r, length - zz) for r, zz in prof])), segs=8)


def pot(x, y, z, r=0.13, h=0.2, mat="interior"):
    sb.lathe(mat, False, (x, y, z), [(r * 0.6, 0), (r, h * 0.5), (r * 0.7, h), (r * 0.25, h * 1.15)], segs=10)


def ewer(x, y, z, h=0.3):
    sb.lathe("jar_green", False, (x, y, z), [(0.06, 0), (0.1, h * 0.35), (0.06, h * 0.7), (0.03, h * 0.85), (0.045, h)], segs=10)
    k.beam("jar_green", False, (x + 0.07, y, z + h * 0.4), (x + 0.16, y, z + h * 0.75), 0.02, 0.02, 0)


def dishes(x, y, z, rng, n=3):
    for i in range(n):
        dx, dy = rng.uniform(-0.15, 0.15), rng.uniform(-0.1, 0.1)
        sb.lathe("cloth_white", False, (x + dx, y + dy, z), [(0.04, 0), (0.09, 0.035), (0.1, 0.045)], segs=10)


def paper_figure(x, y, z, h, rng, hat=False, arms=False):
    """A paper offering for burning: a paper man on a little stand (painted pale with pink)."""
    sb.cyl("cloth_white", False, (x, y, z), (x, y, z + h * 0.6), h * 0.14, h * 0.08, segs=6)
    sb.lathe("cloth_white", False, (x, y, z + h * 0.6), [(0.01, 0), (h * 0.09, h * 0.08), (0.01, h * 0.18)], segs=6)
    if arms:
        k.beam("cloth_red", False, (x - h * 0.22, y, z + h * 0.48), (x + h * 0.22, y, z + h * 0.48), 0.03, 0.03, 0)
    if hat:
        sb.cyl("interior", False, (x, y, z + h * 0.76), (x, y, z + h * 0.8), h * 0.12, segs=6)
    k.beam("cloth_red", False, (x, y - h * 0.15, z + h * 0.2), (x, y - h * 0.15, z + h * 0.45), h * 0.24, 0.01, 0)


def paper_tower(x, y, z, h, rng):
    """A tiered paper offering (a paper house or tower): shrinking boxes with little eaves."""
    zz = z
    for i, s in enumerate((0.22, 0.17, 0.12)):
        hh = h * (0.36 - 0.06 * i)
        k.bx("cloth_white", False, (x - s / 2, y - s / 2, zz), (x + s / 2, y + s / 2, zz + hh))
        k.bx("cloth_red", False, (x - s / 2 - 0.03, y - s / 2 - 0.03, zz + hh), (x + s / 2 + 0.03, y + s / 2 + 0.03, zz + hh + 0.025))
        zz += hh + 0.025
    sb.cyl("cloth_red", False, (x, y, zz), (x, y, zz + 0.08), 0.03, 0.005, segs=5)


def box_stack(x, y, z, n, w, d, hh, rng, mat="timber", yaw=0.0):
    """Flat boxes or steamer trays stacked on a plank."""
    with k.placed(k.frame(x, y, z, yaw)):
        k.beam("timber", True, (-w * 0.9, 0, 0.04), (w * 0.9, 0, 0.04), d + 0.06, 0.08, 0.015)
        for i in range(n):
            zz = 0.08 + i * hh
            k.soft_box(mat, False, (-w / 2 + rng.uniform(-0.02, 0.02), -d / 2, zz), (w / 2, d / 2, zz + hh - 0.01), rng, r=0.02,
                       wob=0.004, ease=0.008)


def tripod_stand(x, y, z, h, rng, spread=0.22, cross=True, knob=False):
    """A tall stand of three thin poles meeting at the top (with a cross-bar halfway up, or a knob)."""
    apex = V((x, y, z + h))
    feet = [V((x + spread * math.cos(a), y + spread * math.sin(a), z)) for a in (0.3, 2.4, 4.4)]
    for f in feet:
        k.beam("bamboo", True, f, apex, 0.035, 0.035, 0)
    if cross:
        a, b = feet[0].lerp(apex, 0.5), feet[1].lerp(apex, 0.5)
        k.beam("bamboo", False, a, b, 0.025, 0.025, 0)
    if knob:
        sb.lathe("timber", False, (x, y, z + h - 0.02), [(0.02, 0), (0.07, 0.06), (0.02, 0.13)], segs=6)


def capped_pole(x, y, z, h, r=0.04, mat="bamboo"):
    sb.cyl(mat, True, (x, y, z - 0.05), (x, y, z + h), r, r * 0.85, segs=6)
    sb.lathe("timber", False, (x, y, z + h), [(r * 1.6, 0), (r * 1.4, 0.06), (0.01, 0.1)], segs=6)


def lattice_frame(p0, p1, z, h, rng, mat="timber"):
    """A long low frame with lattice sides (a rack or a barrow's body)."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    for p in (a, b):
        k.post(mat, True, p.x, p.y, z, z + h + 0.1, 0.06, 0.012)
    k.beam(mat, False, a + UP * (z + h), b + UP * (z + h), 0.05, 0.05, 0.01)
    k.beam(mat, False, a + UP * (z + 0.08), b + UP * (z + 0.08), 0.05, 0.05, 0.01)
    m = max(2, int(L / 0.25))
    for i in range(m):
        p, q = a + t * (L * i / m), a + t * (L * (i + 1) / m)
        k.beam("lattice", False, p + UP * (z + 0.08), q + UP * (z + h), 0.025, 0.025, 0)
        k.beam("lattice", False, p + UP * (z + h), q + UP * (z + 0.08), 0.025, 0.025, 0)


def folding_stand(foot, top, w, rng, mat="timber"):
    """A tall narrow wooden frame leaning from its foot to its top, with a cross-bar near its foot."""
    F, T = V(foot), V(top)
    s = (T - F).cross(UP).normalized() * (w / 2)
    for o in (s, -s):
        k.beam(mat, True, F + o, T + o, 0.04, 0.04, 0.008)
    for t in (0.12, 0.97):
        k.beam(mat, False, F.lerp(T, t) + s, F.lerp(T, t) - s, 0.035, 0.035, 0)


def net_bag(x, y, z_top, h=0.4, rng=None):
    """A netted bag (or a gourd in a net) hanging on a cord."""
    sb.cyl("rope", False, (x, y, z_top), (x, y, z_top - 0.15), 0.008, segs=4)
    sb.lathe("rope", False, (x, y, z_top - 0.15 - h), [(0.02, 0), (0.12, h * 0.3), (0.13, h * 0.6), (0.05, h)], segs=8)


def leaning_poles(base, tops, r=0.035):
    for t in tops:
        sb.cyl("bamboo", True, base, t, r, r * 0.8, segs=5)
