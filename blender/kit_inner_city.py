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

from mathutils import Matrix, Vector

import song_kit as k
import street_b1 as sb

V = Vector
UP = V((0, 0, 1))
QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SIGN_TEX = QM + r"\gen\sections\inner_city\textures\signs_inner_city.png"
SIGN_JSON = QM + r"\gen\sections\inner_city\textures\signs_inner_city.json"
# flat colours (true colours, palette.js leaves unknown names as painted): flower bunches on the scaffolds (red and
# pale paper or silk flowers on green silk leaves), the red gourd lamps, the dark oiled paper of the stall umbrellas,
# raw pork
for _name, _spec in {
    "signs_inner_city": (SIGN_TEX, 1, None),
    "flower": (None, 1, "#b8505c"),
    "flower_pale": (None, 1, "#e9c3b0"),
    "leaf": (None, 1, "#5d7a48"),
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
        lashing((x, y, z), UP, r)


def _basis(nrm):
    """An orthonormal frame (u, v) across the direction nrm, with u x v = nrm."""
    n = V(nrm).normalized()
    a = UP if abs(n.z) < 0.9 else V((1, 0, 0))
    u = n.cross(a).normalized()
    return n, u, n.cross(u)


def lashing(at, axis, r, h=0.18, mat="rope", segs=6):
    """Rope turns bound round a lashed member at a joint: a short band standing proud of the member (r its radius),
    along `axis`, centred on `at`. Two bands across each other (one per member) make a lashed joint."""
    d = V(axis).normalized()
    at = V(at)
    sb.cyl(mat, False, at - d * h / 2, at + d * h / 2, r + 0.022, segs=segs, caps=False)


def rosette(c, nrm, r, rng, mat="flower", petals=5, cup=0.35, heart=None):
    """One paper or silk flower facing nrm: pointed petals cupped toward nrm round a raised heart of another colour
    (heart: material; default the pale paper for a red flower, red for a pale one). 2 x petals triangles; the
    cupped petals catch the light differently, so a cluster reads as flowers, not lumps."""
    n, u, v = _basis(nrm)
    c = V(c)
    heart = heart or ("flower" if mat == "flower_pale" else "flower_pale")
    rot = rng.uniform(0, 2 * math.pi)
    hub = c + n * r * cup * 0.45
    notch = [c + (u * math.cos(rot + 2 * math.pi * (i + 0.5) / petals) + v * math.sin(rot + 2 * math.pi * (i + 0.5) / petals))
             * r * 0.5 + n * r * cup * 0.25 for i in range(petals)]
    tips = [c + (u * math.cos(rot + 2 * math.pi * i / petals) + v * math.sin(rot + 2 * math.pi * i / petals)) * r * rng.uniform(0.9, 1.08)
            + n * r * cup * rng.uniform(0.7, 1.3) for i in range(petals)]
    sb.B.add(heart, False, [hub] + notch, [(0, 1 + i, 1 + (i + 1) % petals) for i in range(petals)])
    sb.B.add(mat, False, notch + tips, [(i - 1 if i else petals - 1, petals + i, i) for i in range(petals)])


def leaf(base, d, length, rng, mat="leaf", w=0.38):
    """A pointed leaf blade from `base` along d, folded a little along its midrib (2 triangles)."""
    d = V(d).normalized()
    side = d.cross(UP)
    if side.length < 1e-4:
        side = V((1, 0, 0))
    side.normalize()
    up = side.cross(d)
    b = V(base)
    tip = b + d * length + up * (-0.15 * length)
    mid = b + d * length * 0.45
    sb.B.add(mat, False, [b, mid + side * length * w * 0.5 + up * 0.03 * length, tip, mid - side * length * w * 0.5 + up * 0.03 * length],
             [(0, 1, 2), (0, 2, 3)])


def _cap_dirs(f, n, spread=1.25):
    """n directions over a cap round f (the first along f), spread up to `spread` rad off it (golden-angle spiral)."""
    f, u, v = _basis(f)
    out = []
    for i in range(n):
        t = 0.0 if i == 0 else spread * math.sqrt(i / max(1, n - 1))
        a = i * 2.39996
        out.append((f * math.cos(t) + (u * math.cos(a) + v * math.sin(a)) * math.sin(t)).normalized())
    return out


def flower_bunch(x, y, z, rng, s=1.0, n=5, face=(0.0, -1.0, 0.3), leaves=2):
    """A bunch of paper or silk flowers tied to a scaffold: n rosettes packed round a dark leafy heart, facing out
    (most toward `face`, by default the street side, -y), every third one pale; pointed leaves sticking out below.
    About 10 n + 12 triangles."""
    c = V((x, y, z))
    if s < 0.75:
        n = max(3, n - 1)
    pale = rng.randrange(3)
    for i, d in enumerate(_cap_dirs(face, n, spread=1.35)):
        p = c + d * 0.075 * s
        rosette(p, d, rng.uniform(0.11, 0.14) * s, rng, mat="flower_pale" if i % 3 == pale else "flower")
    for i in range(leaves):
        a = rng.uniform(0, 2 * math.pi)
        d = V((math.cos(a), math.sin(a) * 0.6 + 0.3, -0.5)).normalized()
        leaf(c + d * 0.05 * s, d, 0.26 * s, rng)


def flower_spire(x, y, z0, z1, rng, w=0.3):
    """A tapering spire of flowers on a pole top (the 彩楼's dressed tops, painted as tall narrow triangles of crossed
    sticks with flowers tied at the crossings and leaves between): three thin sticks lashed round the pole into a
    narrow cone from z0 up to its tip at z1; in each tier a flower tied on every stick, facing out, and on the lower
    tiers one more facing the street; leaves hanging between; flowers smaller toward the tip."""
    H = z1 - z0
    tip = V((x, y, z1))
    a0 = -math.pi / 2 + math.pi / 3 + rng.uniform(-0.3, 0.3)      # one stick toward the street's sides, none hidden
    angs = [a0 + i * 2.094 for i in range(3)]
    feet = [V((x + w * math.cos(a), y + w * math.sin(a), z0)) for a in angs]
    for f in feet:
        sb.cyl("bamboo", False, f, tip, 0.017, 0.012, segs=4, caps=False)
    tiers = max(2, min(5, round(H / 0.55)))
    for kk in range(tiers):
        t = (kk + 0.2) / tiers
        zc = z0 + H * t
        rr = w * (1 - t)
        size = 0.09 + 0.075 * (1 - t)
        for i, a in enumerate(angs):
            a2 = a + (kk % 2) * 0.5
            d = V((math.cos(a2), math.sin(a2), 0.2)).normalized()
            p = V((x + math.cos(a2) * (rr + 0.04), y + math.sin(a2) * (rr + 0.04), zc + rng.uniform(-0.05, 0.05)))
            rosette(p, d, size * rng.uniform(0.9, 1.12), rng, mat="flower_pale" if (i + kk) % 3 == 1 else "flower")
        if t < 0.6:
            d = V((rng.uniform(-0.3, 0.3), -1, 0.25)).normalized()
            rosette(V((x, y, zc + H * 0.5 / tiers)) + d * (rr * 0.8 + 0.05), d, size * 1.1, rng)
        for j in range(2):
            a = angs[(kk + j) % 3] + 1.05
            d = V((math.cos(a), math.sin(a), -0.9)).normalized()
            leaf(V((x + math.cos(a) * rr * 0.6, y + math.sin(a) * rr * 0.6, zc)), d, 0.2 + 0.1 * (1 - t), rng)


def streamer(p, length, rng, w=0.09, mat="cloth_red"):
    """A cloth streamer hanging from a point (its tie): folded back over the tie at the top, then falling in a soft,
    slowly turning S (the light turns across it), narrowing a little to a swallow-tailed end."""
    p = V(p)
    segs = 5
    ph = rng.uniform(0, 2 * math.pi)
    tw = rng.uniform(-0.6, 0.6)
    verts = []
    for i in range(segs + 1):
        t = i / segs
        ang = tw * t + 0.3 * math.sin(2.5 * t + ph)               # twist about the vertical
        across = V((math.cos(ang), math.sin(ang), 0))
        out = V((-math.sin(ang), math.cos(ang), 0))
        sway = 0.06 * length * t * math.sin(3.0 * t + ph)          # the cloth swings out more toward its end
        c = p + V((0, 0, -length * t)) + out * sway + V((0, -0.02 * t, 0))
        hw = w / 2 * (1 - 0.18 * t)
        verts += [c - across * hw, c + across * hw]
    faces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(segs - 1)]
    # the swallow-tail: the last row's corners are the tails, notched up at the middle
    L1, R1, L2, R2 = 2 * (segs - 1), 2 * (segs - 1) + 1, 2 * segs, 2 * segs + 1
    verts.append((verts[L2] + verts[R2]) / 2 + V((0, 0, w * 0.7)))
    N = len(verts) - 1
    faces += [(L1, R1, N), (R1, R2, N), (N, L2, L1)]
    # the fold over the tie: the cloth comes up over it from behind
    a, b = verts[0], verts[1]
    verts += [b + V((0, 0.07, 0.06)), a + V((0, 0.07, 0.06))]
    faces.append((0, 1, N + 1, N + 2))
    sb.B.add(mat, False, verts, faces)


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


def wall_bays(p0, p1, z0, z1, cols, kinds, rng, mat="plaster", thick=0.14, sill=0.75, head=None, out_n=None,
              posts=True):
    """A wall from p0 to p1 between columns at fractions `cols` (0..1, both ends included) with each bay a 'wall',
    'window' (sill wall, straight-bar lattice window, plaster above), 'open' or 'door' (plank door ajar). With `posts`
    a timber post stands at each interior column (closing the gap between bays); the end columns are the caller's.
    Outer side = right of p0 -> p1."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    head = head if head is not None else z1 - 0.35
    if posts:
        for f in cols[1:-1]:
            p = a + t * (L * f)
            k.post("timber", True, p.x, p.y, z0, z1, 0.24, 0.03)
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
            # the room behind is not painted: an invisible board in the doorway stops the walker at the door
            k.board("hidden", True, pa2, pb2, 0.06, z0, head)
        elif kind == "open":
            k.board(mat, False, pa2, pb2, thick, head, z1)   # a head board over the opening


# ---------------------------------------------------------------- the flowered scaffold gateway (彩楼欢门)

def cailou(poles, beams, braces, rng, flowers=(), lanterns=(), streamers=(), lattice=None, spires=True):
    """The 彩楼欢门 of a wine house: lashed poles standing on the street in front of the shop, their tops tied with
    flower bunches; horizontal beams and V-braces between them hung with flowers and streamers; lanterns on posts
    and on the scaffold.
    poles: [(x, y, z_top, r)]; beams: [((x, y, z), (x, y, z))]; braces: [(p, q)] (thin lashed members);
    flowers: [(x, y, z, s)]; lanterns: [(x, y, z, kind, post_foot_or_None)] kind 'round' | 'cube';
    streamers: [(x, y, z, length)]; lattice: optional (p0, p1, z0, z1): a band of crossed bars between two poles.
    spires: a flower bunch set at a pole's top crowns a spire of flowers that runs down that pole to the highest
    member lashed to it (flower_spire). Every joint of a beam or brace with a pole is lashed (rope turns round both
    members), and brace ends are lashed where they meet; beams run a little past the poles that carry their ends."""
    R_BEAM, R_BRACE = 0.055, 0.035
    poles = [tuple(p) for p in poles]

    def plan_hit(p, q, x, y, tol):
        """Where the member p->q passes a pole at (x, y) in plan: (t along it, z there), or None."""
        P_, Q_ = V((p[0], p[1], 0)), V((q[0], q[1], 0))
        d = Q_ - P_
        L2 = d.length_squared
        if L2 < 1e-9:
            return None
        t = max(0.0, min(1.0, (V((x, y, 0)) - P_).dot(d) / L2))
        if (P_ + d * t - V((x, y, 0))).length > tol:
            return None
        return t, p[2] + (q[2] - p[2]) * t

    # the standing poles
    for x, y, zt, r in poles:
        sb.cyl("bamboo", True, (x, y, -0.05), (x, y, zt), r, r * 0.8, segs=6)
    # the ledgers: round poles lashed across the standing ones, running on a little past the poles at their ends
    joints = {i: [] for i in range(len(poles))}       # pole index -> [z] of the members lashed to it
    for p, q in beams:
        P_, Q_ = V(p), V(q)
        d = (Q_ - P_).normalized()
        ends = []
        for e, sgn in ((P_, -1), (Q_, 1)):
            near = any(math.hypot(e.x - x, e.y - y) < 0.35 for x, y, zt, r in poles)
            ends.append(e + d * sgn * (0.22 if near else 0.04))
        sb.cyl("bamboo", min(p[2], q[2]) < 2.2, ends[0], ends[1], R_BEAM, segs=6)
        for i, (x, y, zt, r) in enumerate(poles):
            hit = plan_hit(p, q, x, y, 0.3)
            if hit and -0.1 < hit[1] < zt:
                c = P_.lerp(Q_, hit[0])
                lashing((x, y, hit[1]), UP, r, h=0.24)
                lashing(c, d, R_BEAM, h=0.2, segs=5)
                joints[i].append(hit[1])
    # the braces: thinner poles, lashed at both ends and where they cross a pole
    for p, q in braces:
        P_, Q_ = V(p), V(q)
        d = (Q_ - P_).normalized()
        sb.cyl("bamboo", False, P_ - d * 0.06, Q_ + d * 0.06, R_BRACE, segs=5)
        for e in (P_, Q_):
            lashing(e, d, R_BRACE, h=0.16, segs=5)
        for i, (x, y, zt, r) in enumerate(poles):
            hit = plan_hit(p, q, x, y, 0.3)
            if hit and -0.1 < hit[1] < zt:
                joints[i].append(hit[1])
    # the lattice band: two rails and crossed bars between them, a flower at each crossing
    if lattice:
        (ax, ay), (bx_, by), z0, z1 = lattice
        A, B = V((ax, ay, 0)), V((bx_, by, 0))
        L = (B - A).length
        t = (B - A).normalized()
        for zz in (z0, z1):
            sb.cyl("bamboo", False, A - t * 0.12 + UP * zz, B + t * 0.12 + UP * zz, 0.03, segs=5)
        n = max(2, int(L / 0.7))
        for i in range(n):
            pa, pb = A.lerp(B, i / n), A.lerp(B, (i + 1) / n)
            sb.cyl("bamboo", False, pa + UP * z0, pb + UP * z1, 0.02, segs=4, caps=False)
            sb.cyl("bamboo", False, pa + UP * z1, pb + UP * z0, 0.02, segs=4, caps=False)
            m = pa.lerp(pb, 0.5) + UP * ((z0 + z1) / 2) + V((0, -0.05, 0))
            rosette(m, (0, -1, 0.2), 0.09, rng, mat="flower_pale" if i % 2 else "flower")
        for i, (x, y, zt, r) in enumerate(poles):
            for zz in (z0, z1):
                if plan_hit((ax, ay, zz), (bx_, by, zz), x, y, 0.3):
                    joints[i].append(zz)
    # flowers: a bunch at a pole's top crowns a spire down to the highest member lashed to that pole
    for x, y, z, s in flowers:
        top = None
        if spires:
            for i, (px, py, zt, r) in enumerate(poles):
                if math.hypot(px - x, py - y) < 0.4 and abs(zt - z) < 0.8:
                    top = i
        if top is not None:
            px, py, zt, r = poles[top]
            below = [zz for zz in joints[top] if zz < z - 0.8]
            z0 = max(max(below) + 0.25 if below else zt * 0.6, z - 3.4)
            flower_spire(px, py, z0, z - 0.12 * s, rng)
            flower_bunch(x, y, z, rng, s, n=6, face=(0, -1, 0.9))
        else:
            # a bunch on a brace hangs a pair of short red tails
            on_brace = any(plan_hit(p, q, x, y, 0.2) and abs(plan_hit(p, q, x, y, 0.2)[1] - z) < 0.25 for p, q in braces)
            flower_bunch(x, y, z, rng, s)
            if on_brace:
                streamer((x, y - 0.08, z - 0.1 * s), rng.uniform(0.4, 0.6) * s, rng, w=0.06)
    for x, y, z, ln in streamers:
        streamer((x, y, z), ln, rng)
    for x, y, z, kind, foot in lanterns:
        if foot:
            k.post("timber", True, foot[0], foot[1], -0.05, z - 0.25, 0.08, 0.015)
            k.post("timber", False, foot[0], foot[1], z - 0.3, z - 0.24, 0.13, 0.02)   # a little bearing block
        if kind == "round":
            round_lantern(x, y, z)
        else:
            cube_lantern(x, y, z)


def round_lantern(x, y, z, r=0.3):
    """A round lantern with a cross pattern (the 正店's globe lamps on posts, ⊕ as painted): a paper globe, its frame
    of two meridian hoops and an equator hoop in dark lattice, a cap ring on top and a red tassel below."""
    c = V((x, y, z))
    prof = [(0.05, -r), (r * 0.64, -r * 0.76), (r, 0), (r * 0.64, r * 0.76), (0.07, r)]
    sb.lathe("cloth_white", False, (x, y, z), prof, segs=8)
    sb.cyl("lattice", False, c - UP * 0.012, c + UP * 0.012, r + 0.008, segs=8, caps=False)
    for i in range(4):     # half-hoops as thin strips standing on the globe
        a = i * math.pi / 2
        d = V((math.cos(a), math.sin(a), 0))
        s_ = V((-d.y, d.x, 0)) * 0.014
        pts = [c + d * (rr + 0.008) + UP * zz for rr, zz in prof]
        verts = []
        for p in pts:
            verts += [p - s_, p + s_]
        sb.B.add("lattice", False, verts, [(2 * j, 2 * j + 1, 2 * j + 3, 2 * j + 2) for j in range(len(pts) - 1)])
    sb.cyl("timber", False, c + UP * (r - 0.02), c + UP * (r + 0.06), 0.1, 0.07, segs=6)
    sb.cyl("cloth_red", False, c - UP * (r - 0.01), c - UP * (r + 0.2), 0.025, 0.06, segs=5)


def cube_lantern(x, y, z, s=0.36, diamond=True, hang=0.45):
    """A square lantern (方灯): paper faces in a dark frame with a crossed lattice on each face, hung corner-down as
    a diamond (as painted at the 正店's door; diamond=False sets it square) on a cord `hang` m long, a red tassel
    from its lowest corner."""
    h = s / 2
    yaw = math.radians(45) if diamond else 0.0
    M = Matrix.Translation((x, y, z)) @ Matrix.Rotation(yaw, 4, "Y")
    with k.placed(M):
        k.bx("cloth_white", False, (-h + 0.015, -h + 0.015, -h + 0.015), (h - 0.015, h - 0.015, h - 0.015))
        corners = [V((sx, sy, sz)) for sx in (-h, h) for sy in (-h, h) for sz in (-h, h)]
        for a, b in ((0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)):
            sb.cyl("lattice", False, corners[a], corners[b], 0.016, segs=4)
        for sy in (-h - 0.004, h + 0.004):   # the crossed lattice on the faces toward and away from the street
            for (ax, az), (bx_, bz) in (((-h, -h), (h, h)), ((-h, h), (h, -h))):
                pa, pb = V((ax, sy, az)), V((bx_, sy, bz))
                o = (pb - pa).cross(V((0, 1, 0))).normalized() * 0.01
                sb.B.add("lattice", False, [pa - o, pb - o, pb + o, pa + o], [(0, 1, 2, 3)])
    top = V((x, y, z + (h * math.sqrt(2) if diamond else h)))
    low = V((x, y, z - (h * math.sqrt(2) if diamond else h)))
    sb.cyl("rope", False, top, top + UP * hang, 0.008, segs=3, caps=False)
    sb.cyl("timber", False, top - UP * 0.02, top + UP * 0.05, 0.035, 0.025, segs=5)
    sb.cyl("cloth_red", False, low + UP * 0.02, low - UP * 0.2, 0.02, 0.05, segs=5)


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

def _ribbed_lathe(mat, collide, center, profile, segs, ribs=0.0, ribbed=None, rot=0.0, cap=True):
    """sb.lathe with longitudinal ridges: on the rows listed in `ribbed` (all rows if None) every other vertex is
    pulled in by `ribs` (a fraction of the radius), so the body shows segs / 2 ridges (a gardenia fruit, a
    woven basket's stakes). The first row is capped unless cap=False (a ring, a rim)."""
    cx, cy, cz = center
    verts, faces = [], []
    for j, (r, zz) in enumerate(profile):
        for i in range(segs):
            a = rot + 2 * math.pi * i / segs
            rr = r * (1 - ribs * (i % 2)) if (ribbed is None or j in ribbed) else r * (1 - ribs * 0.5)
            verts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr, cz + zz))
    for j in range(len(profile) - 1):
        for i in range(segs):
            i2 = (i + 1) % segs
            faces.append((j * segs + i, j * segs + i2, (j + 1) * segs + i2, (j + 1) * segs + i))
    if cap:
        faces.append(tuple(reversed(range(segs))))
    sb.B.add(mat, collide, verts, faces)


def gourd_lamp(x, y, z, h=1.25, rng=None):
    """栀子灯 (a gardenia-fruit lamp), as painted at the 正店's doors: a tall reddish lamp, a ribbed belly under a
    narrow waist and a smaller upper bulb, a crown of green sepals at its neck (the gardenia fruit's), a dark hoop at
    the waist; on a low box stand (a soft block with slatted faces under an overhanging top board). h: the lamp's
    height above the stand."""
    rng = rng or random.Random(round(x * 97 + y * 31))
    zs = 0.2                                                    # choice: the stand 0.2 m, its top 0.5 m square
    k.soft_box("timber", True, (x - 0.21, y - 0.21, z - 0.03), (x + 0.21, y + 0.21, z + zs - 0.04), rng, r=0.03, wob=0.004,
               seg=1.0, ease=0.008)
    k.beam("timber", True, (x - 0.25, y, z + zs - 0.045), (x + 0.25, y, z + zs), 0.5, 0.045, 0.012)
    for sy in (-0.212, 0.212):                                  # the slats painted on its faces
        for sx in (-0.1, 0.0, 0.1):
            sb.quad("lattice", False, (x + sx - 0.012, y + sy * 1.02, z + 0.02), (x + sx + 0.012, y + sy * 1.02, z + 0.02),
                    (x + sx + 0.012, y + sy * 1.02, z + zs - 0.06), (x + sx - 0.012, y + sy * 1.02, z + zs - 0.06))
    zb = z + zs
    prof = [(0.05, 0.0), (0.14, h * 0.05), (0.205, h * 0.15), (0.225, h * 0.28), (0.19, h * 0.42), (0.11, h * 0.52),
            (0.068, h * 0.59), (0.112, h * 0.69), (0.1, h * 0.78), (0.045, h * 0.86)]
    _ribbed_lathe("lantern", False, (x, y, zb), prof, 10, ribs=0.08, ribbed=(1, 2, 3, 4, 5, 7, 8), rot=rng.uniform(0, 1))
    sb.cyl("lattice", False, (x, y, zb + h * 0.6 - 0.02), (x, y, zb + h * 0.6 + 0.02), 0.078, segs=10, caps=False)
    # the crown (the fruit's sepals, made in the lamp's frame): short points splayed out round the neck
    a0 = rng.uniform(0, 1)
    for i in range(6):
        a, b = a0 + 2 * math.pi * (i - 0.32) / 6, a0 + 2 * math.pi * (i + 0.32) / 6
        m = (a + b) / 2
        sb.B.add("lattice", False, [V((x + math.cos(a) * 0.04, y + math.sin(a) * 0.04, zb + h * 0.85)),
                                    V((x + math.cos(b) * 0.04, y + math.sin(b) * 0.04, zb + h * 0.85)),
                                    V((x + math.cos(m) * 0.11, y + math.sin(m) * 0.11, zb + h * 0.86 + 0.08))], [(0, 1, 2)])
    sb.cyl("lattice", False, (x, y, zb + h * 0.84), (x, y, zb + h * 0.87), 0.05, segs=6, caps=False)


def lamp_box(x, y, z, w, d, h, sign, yaw=0.0, cap=True, legs=0.55, flowers=None, rng=None):
    """An upright lamp-box (灯箱): a tall box with framed paper faces, its front face (toward -y in its frame)
    carrying the sign's characters, under a small hipped cap (a thick red eave, concave tiled slopes, hip ridges, a
    knob), on legs braced by a low stretcher frame when they are tall; optional flower spray on top."""
    with k.placed(k.frame(x, y, z, yaw)):
        z0, z1 = legs, legs + h
        for sx in (-w / 2, w / 2):
            for sy in (-d / 2, d / 2):
                k.post("timber", True, sx, sy, 0, z1 + 0.04, 0.06, 0.012)
        if legs > 0.35:
            zs = min(0.16, legs * 0.3)
            for (ax, ay), (bx_, by) in (((-w / 2, -d / 2), (w / 2, -d / 2)), ((w / 2, -d / 2), (w / 2, d / 2)),
                                        ((w / 2, d / 2), (-w / 2, d / 2)), ((-w / 2, d / 2), (-w / 2, -d / 2))):
                k.beam("timber", False, (ax, ay, zs), (bx_, by, zs), 0.035, 0.035, 0)
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
            # a small hipped cap: a thick eave, concave slopes, hip ridges, a knob
            e = 0.1
            ring = [V((-w / 2 - e, -d / 2 - e, z1 + 0.09)), V((w / 2 + e, -d / 2 - e, z1 + 0.09)), V((w / 2 + e, d / 2 + e, z1 + 0.09)),
                    V((-w / 2 - e, d / 2 + e, z1 + 0.09))]
            under = [V((p.x * 0.97, p.y * 0.97, z1 + 0.04)) for p in ring]
            k.prism("redwood", False, under, ring, cap_top=False, cap_bottom=True)
            apex = V((0, 0, z1 + 0.09 + 0.2 + 0.14 * min(w, d)))
            mid = [p.lerp(apex, 0.45) - UP * 0.035 for p in ring]
            for i in range(4):
                j = (i + 1) % 4
                sb.B.add("roof", False, [ring[i], ring[j], mid[j], mid[i]], [(0, 1, 2, 3)])
                sb.B.add("roof", False, [mid[i], mid[j], apex], [(0, 1, 2)])
                k.beam("ridge", False, ring[i] + UP * 0.03, mid[i] + UP * 0.02, 0.035, 0.035, 0)
                k.beam("ridge", False, mid[i] + UP * 0.02, apex, 0.035, 0.035, 0)
            sb.lathe("timber", False, (0, 0, apex.z - 0.02), [(0.035, 0), (0.055, 0.04), (0.012, 0.1)], segs=6)
        if flowers and rng:
            flower_bunch(0, 0, z1 + 0.09 + 0.2 + 0.14 * min(w, d) + 0.16, rng, s=0.8, face=(0, -1, 0.8))


def signboard(p_left, p_right, z0, z1, sign, rng, posts=True, top="round", foot=None, thick=0.07, sub=None,
              back="timber"):
    """A tall signboard: a board from p_left to p_right (its face toward the right of p_left -> p_right, i.e. the
    viewer) between z0 and z1, its face carrying the sign's characters, set in a dark frame that stands a little
    proud of it; its head arched (top='round'), gabled ('pointed') or under a cap plank ('flat'), each with thickness
    and framed; on two posts down to the ground (posts=True) or a box foot (foot=(z_foot_top))."""
    a, b, t, n, L = _frame_vecs(p_left, p_right)
    o = n * (thick / 2 + 0.004)
    uv = cell_uv(sign, sub)
    sb.quad("signs_inner_city", False, a + o + UP * z0, b + o + UP * z0, b + o + UP * z1, a + o + UP * z1, uv=uv)
    k.board(back, False, (a.x, a.y), (b.x, b.y), thick, z0, z1)
    fd, fw = thick + 0.03, 0.05                     # the frame: fd deep (along n), fw wide (in the face's plane)
    upright = (fd, fw) if abs(n.y) >= abs(n.x) else (fw, fd)    # k.beam's section for an upright member: w along y
    for p, q, sec in ((a + UP * z0, b + UP * z0, (fd, fw)), (b + UP * z0, b + UP * z1, upright),
                      (b + UP * z1, a + UP * z1, (fd, fw)), (a + UP * z1, a + UP * z0, upright)):
        e = (q - p).normalized() * (fw / 2)
        k.beam("timber", False, p - e + n * 0.01, q + e + n * 0.01, sec[0], sec[1], 0.008)
    m = a.lerp(b, 0.5)
    th = n * (thick / 2)
    if top == "round":
        # an arched head: a slab with thickness, framed along its arch
        rise, kk = 0.3 * L, 6
        arc = [m - t * (L / 2 * math.cos(math.pi * i / kk)) + UP * (z1 + rise * math.sin(math.pi * i / kk)) for i in range(kk + 1)]
        c = m + UP * z1
        verts = [c + th] + [p + th for p in arc] + [c - th] + [p - th for p in arc]
        B0 = kk + 2
        faces = [(0, 1 + i + 1, 1 + i) for i in range(kk)] + [(B0, B0 + 1 + i, B0 + 2 + i) for i in range(kk)]
        faces += [(1 + i, 2 + i, B0 + 2 + i, B0 + 1 + i) for i in range(kk)]
        sb.B.add(back, False, verts, faces)
        sb.tube("timber", False, [p + n * 0.01 for p in arc], [0.027] * len(arc), segs=4)
    elif top == "pointed":
        apex = m + UP * (z1 + L * 0.5)
        A, Bp = a + UP * z1, b + UP * z1
        sb.B.add(back, False, [A + th, Bp + th, apex + th, A - th, Bp - th, apex - th],
                 [(0, 1, 2), (5, 4, 3), (1, 4, 5, 2), (2, 5, 3, 0)])
        for p, q in ((A, apex), (Bp, apex)):
            k.beam("timber", False, p + n * 0.01, q + n * 0.01, fd, fw, 0)
    elif top == "flat":
        k.beam("timber", False, a - t * 0.06 + UP * (z1 + 0.05), b + t * 0.06 + UP * (z1 + 0.05), thick + 0.08, 0.05, 0.012)
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
    # a is on the viewer's left when the face is seen along -f: the cell's left edge goes there (not mirrored)
    sb.quad("signs_inner_city", False, a + f * 0.004 - UP * cloth_h, b + f * 0.004 - UP * cloth_h, b + f * 0.004, a + f * 0.004,
            uv=uv)
    k.beam("bamboo", False, a + UP * 0.03, b + UP * 0.03, 0.03, 0.03, 0)


def a_frame_board(foot_a, foot_b, apex, sign_center, plaque=0.55, sign="jie", rng=None):
    """The 解 board: a tall triangular board leaning against an eave (two feet on the ground, the apex up at the
    eave), boarded over, with a small framed plaque bearing the sign hung on its face (sign_center None: no plaque on
    the face; hung_plaque hangs it from a bar instead)."""
    A, B, P = V(foot_a), V(foot_b), V(apex)
    for q in (A, B):
        k.beam("timber", True, q, P, 0.08, 0.08, 0.015)
    # the boarding: thin boards across the triangle, from the feet up
    n = 9
    for i in range(1, n):
        t = i / n
        p, q = A.lerp(P, t), B.lerp(P, t)
        k.beam("deck", False, p, q, 0.06, 0.16 * (1 - t * 0.5), 0.01)
    if sign_center is None:
        return
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


def hung_plaque(bar_a, bar_b, x_c, z_top, s, sign, drop=0.08):
    """A small framed plaque hung under a horizontal bar (bar_a -> bar_b, its underside at z_top) on two short cords,
    centred at X x_c along it, in the bar's vertical plane: the sign on both faces (read the right way round from
    either side), a thin board between them, a timber frame round it."""
    a, b = V(bar_a), V(bar_b)
    along = V((b.x - a.x, b.y - a.y, 0)).normalized()
    t = (x_c - a.x) / (b.x - a.x) if abs(b.x - a.x) > 1e-6 else 0.5
    top = V((a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, z_top - drop))
    h = s / 2
    c = top - UP * h
    n = V((-along.y, along.x, 0))          # one face's normal (across the bar)
    uv = cell_uv(sign)
    for f in (n, -n):
        right = (-f).cross(UP).normalized()   # the reader's right, standing on the f side and facing the plaque
        o = f * 0.022
        sb.quad("signs_inner_city", False, c + o - right * h - UP * h, c + o + right * h - UP * h, c + o + right * h + UP * h,
                c + o - right * h + UP * h, uv=uv)
    corners = [c + along * sa * (h - 0.01) + n * sn * 0.018 for sa in (-1, 1) for sn in (-1, 1)]
    k.bx("deck", False, (min(p.x for p in corners), min(p.y for p in corners), c.z - h + 0.01),
         (max(p.x for p in corners), max(p.y for p in corners), c.z + h - 0.01))
    for p, q in ((c - along * h - UP * h, c + along * h - UP * h), (c + along * h - UP * h, c + along * h + UP * h),
                 (c + along * h + UP * h, c - along * h + UP * h), (c - along * h + UP * h, c - along * h - UP * h)):
        k.beam("timber", False, p, q, 0.05, 0.05, 0.01)
    for sd in (-1, 1):
        hk = top + along * (sd * h * 0.6)
        sb.cyl("rope", False, hk, hk + UP * (drop + 0.01), 0.008, segs=4)


def eave_plaque(p, facing, s, sign, variant=0):
    """A small square plaque hung under an eave, its face toward `facing`. variant 0-7 turns the cell's image by a
    quarter turn per step and mirrors it from 4 on, so a row of plaques with one illegible cell do not repeat."""
    f = V((facing[0], facing[1], 0)).normalized()
    sd = V((-f.y, f.x, 0))
    c = V(p)
    h = s / 2
    uv = cell_uv(sign)
    if variant >= 4:
        uv = [uv[1], uv[0], uv[3], uv[2]]
    r = variant % 4
    uv = uv[r:] + uv[:r]
    sb.quad("signs_inner_city", False, c + f * 0.03 + sd * h - UP * h, c + f * 0.03 - sd * h - UP * h, c + f * 0.03 - sd * h + UP * h,
            c + f * 0.03 + sd * h + UP * h, uv=uv)
    k.bx("timber", False, (c.x - h * abs(sd.x) - 0.02, c.y - h * abs(sd.y) - 0.02, c.z - h - 0.02),
         (c.x + h * abs(sd.x) + 0.02, c.y + h * abs(sd.y) + 0.02, c.z + h + 0.02))


# ---------------------------------------------------------------- the square well (方井)

def square_well(curb, platform, z_top, rng, west_ext=None, z_bottom=None):
    """The square well: a wide plank platform (boards running east-west, a few cm thick, each its own soft piece)
    round a low wooden curb whose opening is divided into four by a 田-shaped plank cover; dark water in the four
    openings. The curb is laid like the character 井: its four timbers cross at the corners and run on past them,
    with a peg through each crossing. The boards stop at the curb, so the openings look down a dark shaft to the
    water. curb, platform: four plan corners each [sw, se, ne, nw]; z_top: the curb's top above the ground.
    west_ext = (y_from, x_west): the boards from y_from north run on west to x_west (their west ends stepping out past
    the platform's west edge). z_bottom: how low the boards reach (default: their own 0.1 m thickness), so no gap
    shows under them where the ground below dips."""
    psw, pse, pne, pnw = (V((p[0], p[1], 0)) for p in platform)
    csw, cse, cne, cnw = (V((p[0], p[1], 0)) for p in curb)

    def x_on(p, q, y):
        """x of the line p-q at depth y."""
        return p.x + (q.x - p.x) * ((y - p.y) / (q.y - p.y) if abs(q.y - p.y) > 1e-6 else 0.0)

    # platform boards: three bands (south of the curb, beside it, north of it); beside it every board is cut in two
    zb, thick = 0.08, 0.1
    yc0, yc1 = (csw.y + cse.y) / 2, (cnw.y + cne.y) / 2
    bands = [(psw.y, yc0 - 0.02, False), (yc0 - 0.02, yc1 + 0.02, True), (yc1 + 0.02, pnw.y, False)]
    for y0_, y1_, cut in bands:
        if y1_ - y0_ < 0.05:
            continue
        n = max(1, round((y1_ - y0_) / 0.3))
        for i in range(n):
            ya, yb = y0_ + (y1_ - y0_) * i / n + 0.006, y0_ + (y1_ - y0_) * (i + 1) / n - 0.006
            xw = (x_on(psw, pnw, ya), x_on(psw, pnw, yb))
            ext = west_ext is not None and ya >= west_ext[0]
            if ext:
                xw = (min(xw[0], west_ext[1]), min(xw[1], west_ext[1]))
            xe = (x_on(pse, pne, ya), x_on(pse, pne, yb))
            spans = [(xw, (x_on(csw, cnw, ya) + 0.02, x_on(csw, cnw, yb) + 0.02)),
                     ((x_on(cse, cne, ya) - 0.02, x_on(cse, cne, yb) - 0.02), xe)] if cut else [(xw, xe)]
            for (wa, wb), (ea, eb) in spans:
                if min(ea, eb) - max(wa, wb) < 0.08:
                    continue
                zt = zb + rng.uniform(-0.01, 0.008)
                k.soft_slab("deck", True, [(wa + rng.uniform(-0.03, 0.03), ya), (ea + rng.uniform(-0.03, 0.03), ya),
                                           (eb + rng.uniform(-0.03, 0.03), yb), (wb + rng.uniform(-0.03, 0.03), yb)],
                            zt - thick if z_bottom is None else z_bottom, zt, rng, r=0.03, wob=0.006, seg=2.0, ease=0.012,
                            along=(1, 0))
    # the curb: four timbers crossing at the corners like 井, the east-west pair laid over the north-south pair
    w, hgt, over = 0.16, z_top - zb + 0.02, 0.16
    ring = [csw, cse, cne, cnw]
    for i, (p, q) in enumerate(zip(ring, ring[1:] + ring[:1])):
        d = (q - p).normalized()
        lift = 0.02 if i % 2 == 0 else 0.0
        k.beam("timber", True, p - d * over + UP * (z_top - hgt / 2 + lift), q + d * over + UP * (z_top - hgt / 2 + lift),
               w, hgt, 0.025)
    for c in ring:
        sb.cyl("lattice", False, c + UP * (z_top - 0.02), c + UP * (z_top + 0.035), 0.025, segs=5)
    # the 田 cover: one plank each way across the middle, a little below the curb's top, ends let into the curb
    mid = lambda p, q: p.lerp(q, 0.5)  # noqa: E731
    for p, q in ((mid(csw, cnw), mid(cse, cne)), (mid(csw, cse), mid(cnw, cne))):
        k.beam("timber", False, p + UP * (z_top - 0.05), q + UP * (z_top - 0.05), 0.13, 0.08, 0.015)
    # the shaft: dark inner walls from under the curb's lip down to the water, which lies dark below
    zw = 0.07
    inner = []
    cen = (csw + cse + cne + cnw) / 4
    for c in ring:
        inner.append(c + (cen - c).normalized() * ((w / 2 + 0.006) * 1.414))
    for p, q in zip(inner, inner[1:] + inner[:1]):
        sb.quad("interior", False, q + UP * zw, p + UP * zw, p + UP * (z_top - 0.035), q + UP * (z_top - 0.035))
    sb.B.add("interior", False, [p + UP * zw for p in inner], [(0, 1, 2, 3)])   # the water, dark down the shaft


# ---------------------------------------------------------------- shades: umbrellas, awnings

def umbrella(x, y, z_hub, R, rng, tilt=(0.0, 0.0), foot=None, ribs=14, rise=0.3, mat="oilpaper", pole=True):
    """A big stall umbrella (parasol) of oiled paper or mat on bamboo ribs, at real size. The canopy is a shallow
    dome from its crown (0.12 above the hub) down to the rim (`rise` below the hub), leaned by tilt (dx, dy: rise
    per m of radius toward +x, +y). Each panel between two ribs is its own piece and sags a little between them, so
    every rib draws as a crease and the rim is scalloped; the rim is bound (a narrow band with thickness). Under it:
    the ribs as flat bamboo slats on edge, a crown ring at the hub, and (on a pole) a stretcher from a runner on the
    pole to each rib. A wooden knob caps the crown; the pole runs down to its foot."""
    hub = V((x, y, z_hub))
    tl = V((tilt[0], tilt[1], 0))
    n = max(6, ribs)
    T = (0.06, 0.42, 0.78, 1.0)
    drop = rise + 0.12
    half = R * math.sin(math.pi / n)          # half the chord between two rib tips

    def at(a, t, sag=0.0, inset=0.0, down=0.0):
        p = V((math.cos(a), math.sin(a), 0)) * (R * t - inset)
        p.z = 0.12 - drop * (0.3 * t + 0.7 * t * t) - sag - down
        return hub + p + UP * p.dot(tl)

    edge = "bamboo" if mat == "reed" else "lattice"
    a0 = rng.uniform(0, 2 * math.pi / n)
    scallop = R * (1 - math.cos(math.pi / n)) + 0.12 * half    # the paper's edge curves in between the rib tips
    for i in range(n):
        a, b = a0 + 2 * math.pi * i / n, a0 + 2 * math.pi * (i + 1) / n
        m = (a + b) / 2
        rows = []
        for t in T:
            sag = 0.16 * half * t * (0.55 if t == 1.0 else 1.0)
            rows.append((at(a, t), at(m, t, sag, scallop * t ** 4), at(b, t)))
        verts, faces = [], []
        for L_, M_, R_ in rows:
            verts += [L_, M_, R_]
        for j in range(len(T) - 1):
            o, o2 = 3 * j, 3 * j + 3
            faces += [(o, o2, o2 + 1, o + 1), (o + 1, o2 + 1, o2 + 2, o + 2)]
        sb.B.add(mat, False, verts, faces)
        # the bound rim: a narrow band turned down under the paper's edge
        L_, M_, R_ = rows[-1]
        band = [L_, M_, R_, L_ - UP * 0.035, M_ - UP * 0.035, R_ - UP * 0.035]
        sb.B.add(edge, False, band, [(0, 3, 4, 1), (1, 4, 5, 2)])
        # the rib under the paper: a flat bamboo slat on edge, following the dome
        pts = [at(a, t, down=0.01) for t in T]
        verts = []
        for p in pts:
            verts += [p, p - UP * 0.022]
        sb.B.add("bamboo", False, verts, [(2 * j, 2 * j + 1, 2 * j + 3, 2 * j + 2) for j in range(len(pts) - 1)])
    # the crown: a ring under the hub where the ribs meet, a knob over the paper's top
    sb.cyl("timber", False, hub - UP * 0.02, hub + UP * 0.09, 0.05, segs=6, caps=False)
    sb.lathe("timber", False, (x, y, z_hub + 0.1), [(R * 0.06 + 0.03, 0), (R * 0.04 + 0.02, 0.05), (0.02, 0.11)], segs=6)
    if pole:
        f = V(foot) if foot else V((x, y, 0))
        sb.cyl("bamboo", True, f - UP * 0.05, hub + UP * 0.15, 0.035, segs=6)
        # the runner on the pole and a stretcher (flat slat) from it up to each rib
        ax = (f - hub).normalized()
        run = hub + ax * (0.3 * R + 0.12)
        sb.cyl("timber", False, run - ax * 0.06, run + ax * 0.06, 0.05, segs=6)
        for i in range(n):
            a = a0 + 2 * math.pi * i / n
            q = at(a, 0.42, down=0.03)
            p = run + V((math.cos(a), math.sin(a), 0)) * 0.05
            sb.B.add("bamboo", False, [p, q, q - UP * 0.018, p - UP * 0.018], [(0, 1, 2, 3)])


# ---------------------------------------------------------------- fences, stands, furniture

def slat_fence(p0, p1, h, rng, slat=0.11, mat="timber"):
    """A barrier fence (杈子) of close-set vertical slats (flat, each set by hand: a little off its spacing and
    plumb) under a top rail, with a second rail just below it as painted and a bottom rail; capped posts at the ends.
    slat: the slats' spacing."""
    a, b, t, n, L = _frame_vecs(p0, p1)
    for p in (a, b):
        k.post(mat, True, p.x, p.y, -0.03, h + 0.04, 0.1, 0.02)
        k.post(mat, False, p.x, p.y, h + 0.04, h + 0.1, 0.13, 0.025)            # cap block
    k.beam(mat, True, a - t * 0.05 + UP * (h - 0.025), b + t * 0.05 + UP * (h - 0.025), 0.08, 0.055, 0.012)
    k.beam(mat, False, a + UP * (h * 0.86), b + UP * (h * 0.86), 0.05, 0.045, 0)
    k.beam(mat, True, a + UP * 0.12, b + UP * 0.12, 0.06, 0.06, 0.01)
    m = max(2, int(L / slat))
    along_x = abs(t.x) >= abs(t.y)      # k.beam's section for an upright member: w across y, h across x
    for i in range(1, m):
        p = a + t * (L * i / m + rng.uniform(-0.01, 0.01))
        lean = n * rng.uniform(-0.012, 0.012) + t * rng.uniform(-0.012, 0.012)
        ww, hh = (0.024, 0.042) if along_x else (0.042, 0.024)
        k.beam(mat, False, p + UP * 0.05, p + lean + UP * (h - 0.05 + rng.uniform(-0.01, 0.01)), ww, hh, 0)


def tray_stand(x, y, z, L, W, h, rng, yaw=0.0, tray_mat="interior"):
    """An oval tray on a folding stand (a street vendor's 托盘架), as painted: two leg frames hinged across each other
    (an X seen from the tray's end), a pin through each crossing, a low stretcher in each frame, their top rails
    carrying the tray; the tray dark and shallow, with a raised rim that has thickness."""
    with k.placed(k.frame(x, y, z, yaw)):
        zt = h - 0.03
        lx = L * 0.27
        for s_ in (1, -1):
            f0, f1 = V((0, -s_ * W * 0.42, 0)), V((0, s_ * W * 0.3, zt - 0.02))
            for sx in (-lx, lx):
                o = V((sx + s_ * 0.022, 0, 0))
                k.beam("timber", False, f0 + o, f1 + o, 0.035, 0.035, 0)
            k.beam("timber", False, f1 + V((-lx - 0.05, 0, 0)), f1 + V((lx + 0.05, 0, 0)), 0.04, 0.035, 0)
            fs = f0.lerp(f1, 0.2)
            k.beam("timber", False, fs + V((-lx + s_ * 0.022, 0, 0)), fs + V((lx + s_ * 0.022, 0, 0)), 0.03, 0.03, 0)
        tc = 0.42 / 0.72
        for sx in (-lx, lx):
            sb.cyl("lattice", False, (sx - 0.05, 0, zt * tc), (sx + 0.05, 0, zt * tc), 0.013, segs=4)
        # the tray: a floor, the rim's inner wall, its rounded top, the outer wall and the underside
        rows = [(0.9, 0.012), (0.95, 0.055), (1.0, 0.066), (1.03, 0.035), (0.97, -0.005)]
        seg = 12
        verts = [V((0, 0, h + 0.012))]
        for r, zz in rows:
            for i in range(seg):
                a = 2 * math.pi * i / seg
                verts.append(V((math.cos(a) * L / 2 * r, math.sin(a) * W / 2 * r, h + zz)))
        verts.append(V((0, 0, h - 0.005)))
        faces = [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)]
        for j in range(len(rows) - 1):
            for i in range(seg):
                i2 = (i + 1) % seg
                faces.append((1 + j * seg + i, 1 + (j + 1) * seg + i, 1 + (j + 1) * seg + i2, 1 + j * seg + i2))
        last, cb = 1 + (len(rows) - 1) * seg, len(verts) - 1
        faces += [(cb, last + (i + 1) % seg, last + i) for i in range(seg)]
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
    """A big round woven basket: a bellied body on a rounded bottom, its upright stakes showing as ridges, a woven
    band of split bamboo, and a thick rolled rim at the mouth; inside, the shadowed inner wall down to its bottom, or
    a domed woven lid (lid=True)."""
    segs = 14 if r > 0.3 else 10
    rm = r * mouth
    prof = [(r * 0.38, 0), (r * 0.74, h * 0.1), (r * 0.93, h * 0.35), (r, h * 0.7), (rm, h - 0.03)]
    _ribbed_lathe(mat, True, (x, y, z), prof, segs, ribs=0.04, ribbed=(1, 2, 3, 4), rot=rng.uniform(0, 1))
    tr = min(0.03, r * 0.12)
    _ribbed_lathe("bamboo", False, (x, y, z), [(rm + 0.004, h - 0.045), (rm + tr, h - 0.008), (rm - tr, h + 0.006)], segs,
                  cap=False)
    sb.cyl("bamboo", False, (x, y, z + h * 0.42 - 0.018), (x, y, z + h * 0.42 + 0.018), r * 0.95 + 0.01, segs=segs, caps=False)
    if lid:
        _ribbed_lathe(mat, False, (x, y, z + h), [(rm + 0.02, 0.0), (rm * 0.88, h * 0.14), (rm * 0.5, h * 0.27), (0.04, h * 0.32)],
                      segs, ribs=0.03, ribbed=(1, 2), rot=rng.uniform(0, 1))
        sb.lathe("bamboo", False, (x, y, z + h * 1.31), [(0.05, 0), (0.04, 0.04), (0.01, 0.06)], segs=6)
    else:
        _ribbed_lathe("interior", False, (x, y, z), [(r * 0.8, h * 0.4), (rm - tr, h - 0.02)], segs)


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


def box_stack(x, y, z, n, w, d, hh, rng, mat="timber", yaw=0.0, plank=1.0, bench=0.0):
    """Flat lidded boxes (or steamer trays) stacked on a long dark plank: each tier a box whose lid projects as a
    darker rim, each a little askew, the stack tied with two cords over the top. plank: the plank's length as a
    multiple of 2w; bench: the plank's height (0 = laid on the ground, on two cross battens)."""
    with k.placed(k.frame(x, y, z, yaw)):
        L = w * plank
        zp = bench + 0.08
        k.beam("redwood", True, (-L, 0, zp - 0.04), (L, 0, zp - 0.04), d + 0.06, 0.06, 0.015)
        for sx in (-L + 0.1, L - 0.1):
            if bench > 0:
                for sy in (-1, 1):
                    k.beam("timber", False, (sx, sy * (d / 2 - 0.02), 0.0), (sx, sy * (d / 2 - 0.07), zp - 0.07), 0.04, 0.04, 0.008)
            else:
                k.beam("timber", False, (sx, -d / 2 - 0.02, 0.025), (sx, d / 2 + 0.02, 0.025), 0.06, 0.05, 0.01)
        zz = zp
        for i in range(n):
            j, yaw_i = rng.uniform(-0.02, 0.02), rng.uniform(-3.0, 3.0)
            with k.placed(k.frame(j, 0, zz, yaw_i)):
                k.soft_box(mat, False, (-w / 2, -d / 2 + 0.01, 0), (w / 2, d / 2 - 0.01, hh - 0.03), rng, r=0.015,
                           wob=0.003, ease=0.006)
                k.soft_box("redwood", False, (-w / 2 - 0.014, -d / 2 - 0.004, hh - 0.034), (w / 2 + 0.014, d / 2 + 0.004, hh - 0.004),
                           rng, r=0.008, wob=0.002, ease=0.004)
                k.beam("interior", False, (-w / 2 + 0.03, -d / 2 - 0.002, hh * 0.45), (w / 2 - 0.03, -d / 2 - 0.002, hh * 0.45),
                       0.004, 0.012, 0)   # the joint line of the tray's side
            zz += hh
        for sx in (-w * 0.22, w * 0.22):   # two cords round the stack, knotted on top
            pts = [V((sx, -d / 2 - 0.012, zp + 0.02)), V((sx, -d / 2 - 0.012, zz + 0.006)), V((sx, d / 2 + 0.012, zz + 0.006)),
                   V((sx, d / 2 + 0.012, zp + 0.02))]
            sb.tube("rope", False, pts, [0.007] * 4, segs=4)
        sb.tube("rope", False, [V((-w * 0.22, 0, zz + 0.01)), V((0, 0, zz + 0.09)), V((w * 0.22, 0, zz + 0.01))], [0.008] * 3, segs=4)


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
