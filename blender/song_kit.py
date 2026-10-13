"""Song construction kit: the builder functions every qingming scene is composed from.

Messenger's rules (reference/messenger_study/world_notes.md) applied to Song architecture:
- large faces stay flat;
- the triangles go into edge thickness, chamfers, framed openings, brackets, balustrades and props;
- nothing is a bare box.

Every function adds faces to street_b1's bucket set `sb.B`, keyed by (material, collide). A scene builder bakes
those buckets into one mesh per bucket, so a whole section stays at about 30 draw calls.

Units are metres, Z up. Functions take world coordinates. `placed(matrix)` builds a group in a local frame and
moves it into place. Faces without explicit UVs get box-projected UVs at bake time, from world position and the
material's tile size.
"""
import math
import random

from mathutils import Matrix, Vector

import street_b1 as sb

V = Vector
GATE_TEX = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\sections\gate\textures"
# structure-free washes (prompts/material_sheet_gate_surfaces.txt): joints, board edges and courses are modelled
SURF_TEX = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\sections\gate\textures_v2"
for _name, _spec in {
    "brick": (SURF_TEX + r"\brick_patch.png", 2.0, None),  # two halves, painted bricks | wash: surface.js 'patch'
    "stone": (SURF_TEX + r"\tex_stone.png", 1.5, None),
    "stone_blocks": (GATE_TEX + r"\tex_stone.png", 2.5, None),
    "redwood": (GATE_TEX + r"\tex_redwood.png", 1.2, None),
    "deck": (SURF_TEX + r"\tex_wood.png", 1.6, None),
    "ground": (SURF_TEX + r"\ground_road.png", 4.0, None),  # two halves, painted ground | road wash: web/src/surface.js
    "rammed": (GATE_TEX + r"\tex_rammed.png", 4.0, None),
    "water": (None, 1, "#93a9a3"),
    "lattice": (None, 1, "#4b3626"),
    "drum": (None, 1, "#8f4a3a"),
    "rope": (None, 1, "#c4ad84"),
    # poles, shafts and stakes: the painted wood wash, toned to bamboo on the page (palette.js); a flat colour read as
    # plastic close up (the carts' draught poles, 2026-10-12)
    "bamboo": (SURF_TEX + r"\tex_wood.png", 0.9, None),
    "grass": (None, 1, "#9d9b63"),
    "grass_dry": (None, 1, "#b9a46c"),
}.items():
    sb.MATERIALS[_name] = _spec
# painted face atlases (tools/cut_atlas.mjs): soft pieces of material `key` are drawn with material `name`, each face
# group mapped whole onto one of cols x rows painted cells, so the painted, worn edge of the cell traces that face
FACE_ATLAS = {"stone": ("stone_face", 4, 4)}
sb.MATERIALS["stone_face"] = (SURF_TEX + r"\atlas_stone.png", 1, None)


def add(mat, collide, verts, faces, uvs=None):
    sb.B.add(mat, collide, verts, faces, uvs)


class placed:
    """with placed(M): ...  -- everything added inside the block is transformed by the 4x4 matrix M."""

    def __init__(self, matrix):
        self.m = matrix

    def __enter__(self):
        self.mark = {k: len(b["v"]) for k, b in sb.B.data.items()}
        return self

    def __exit__(self, *exc):
        for k, b in sb.B.data.items():
            for i in range(self.mark.get(k, 0), len(b["v"])):
                b["v"][i] = self.m @ b["v"][i]


def frame(x, y, z=0.0, yaw_deg=0.0):
    return Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.radians(yaw_deg), 4, "Z")


# ---------------------------------------------------------------- primitives

def bx(mat, collide, lo, hi):
    sb.box(mat, collide, tuple((a + b) / 2 for a, b in zip(lo, hi)), tuple(b - a for a, b in zip(lo, hi)))


def prism(mat, collide, bottom, top, cap_top=True, cap_bottom=False):
    """Side walls between two rings with the same number of points (counter-clockwise seen from above)."""
    n = len(bottom)
    verts = [V(p) for p in bottom] + [V(p) for p in top]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    if cap_top:
        faces.append(tuple(range(n, 2 * n)))
    if cap_bottom:
        faces.append(tuple(reversed(range(n))))
    add(mat, collide, verts, faces)


def beam(mat, collide, p0, p1, w, h, c=None):
    """A member from p0 to p1 with a w x h section and chamfered long edges (c=0: a plain box section)."""
    p0, p1 = V(p0), V(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    d.normalize()
    up = V((0, 0, 1)) if abs(d.z) < 0.95 else V((1, 0, 0))
    side = d.cross(up).normalized()
    upv = side.cross(d).normalized()
    hw, hh = w / 2, h / 2
    c = min(w, h) * 0.18 if c is None else c
    if c <= 0:
        ring = [(hw, hh), (-hw, hh), (-hw, -hh), (hw, -hh)]
    else:
        ring = [(hw - c, hh), (-(hw - c), hh), (-hw, hh - c), (-hw, -(hh - c)),
                (-(hw - c), -hh), (hw - c, -hh), (hw, -(hh - c)), (hw, hh - c)]
    n = len(ring)
    verts = [p0 + side * s + upv * u for s, u in ring] + [p1 + side * s + upv * u for s, u in ring]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    faces += [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    add(mat, collide, verts, faces)


def post(mat, collide, x, y, z0, z1, w, c=None):
    beam(mat, collide, (x, y, z0), (x, y, z1), w, w, c)


def board(mat, collide, a, b, thick, z0, z1):
    """An upright board standing on the plan segment a->b, `thick` across it, from z0 to z1."""
    a, b = V((a[0], a[1], 0)), V((b[0], b[1], 0))
    t = (b - a).normalized()
    n = V((t.y, -t.x, 0)) * (thick / 2)
    ring = [a + n, b + n, b - n, a - n]
    if (ring[1] - ring[0]).cross(ring[2] - ring[1]).z < 0:
        ring.reverse()
    prism(mat, collide, [p + V((0, 0, z0)) for p in ring], [p + V((0, 0, z1)) for p in ring], cap_bottom=True)


def rock(mat, x, y, z, r, rng, flat=0.55, collide=False):
    """A faceted, irregular stone or clod: a jittered icosahedron, flattened."""
    t = (1 + 5 ** 0.5) / 2
    base = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t),
            (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
    faces = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6),
             (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10),
             (8, 6, 7), (9, 8, 1)]
    verts = []
    for p in base:
        v = V(p).normalized() * r * rng.uniform(0.75, 1.15)
        verts.append(V((x + v.x, y + v.y, z + max(v.z, -0.2 * r) * flat)))
    add(mat, collide, verts, faces)


# ---------------------------------------------------------------- timber members

def column(x, y, z0, z1, r=0.16, mat="redwood", base=True, cap=True, rng=None):
    """Octagonal column, slightly tapered, on a soft square stone plinth with a round drum; a cap block on top."""
    z = z0
    if base:
        rng = rng or random.Random(round(x * 733 + y * 271 + z0 * 59))
        h = r * 1.5
        soft_box("stone", True, (x - h, y - h, z - 0.04), (x + h, y + h, z + 0.12), rng, r=0.04, wob=0.006, tilt=0.01)
        sb.cyl("stone", True, (x, y, z + 0.12), (x, y, z + 0.22), r * 1.45, r * 1.25, segs=10)
        z += 0.22
    sb.cyl(mat, True, (x, y, z), (x, y, z1), r, r * 0.88, segs=8)
    if cap:
        post(mat, False, x, y, z1, z1 + 0.16, r * 2.1, 0.03)


def bracket(x, y, z, out, s=1.0, mat="redwood"):
    """A simplified bracket set (斗拱) standing on a column or beam top, reaching outward along `out` (plan
    vector). Returns the height of its top above z."""
    o = V((out[0], out[1], 0)).normalized()
    t = V((-o.y, o.x, 0))
    P = V((x, y, z))
    up = V((0, 0, 1))

    def block(c, w, h):
        bx(mat, False, (c.x - w / 2, c.y - w / 2, c.z), (c.x + w / 2, c.y + w / 2, c.z + h))

    post(mat, False, x, y, z, z + 0.17 * s, 0.34 * s, 0.05 * s)              # cap block 栌斗
    z1 = 0.17 * s
    a = P + up * (z1 + 0.07 * s)
    beam(mat, False, a - o * 0.42 * s, a + o * 0.55 * s, 0.12 * s, 0.14 * s)    # outward arm 华栱
    beam(mat, False, a - t * 0.46 * s, a + t * 0.46 * s, 0.12 * s, 0.14 * s)    # wall arm 泥道栱
    for e in (o * 0.5 * s, t * 0.42 * s, -t * 0.42 * s):
        block(P + e + up * (z1 + 0.14 * s), 0.17 * s, 0.09 * s)                 # small blocks 散斗
    z2 = z1 + 0.23 * s
    a2 = P + up * (z2 + 0.07 * s)
    beam(mat, False, a2 - o * 0.3 * s, a2 + o * 0.98 * s, 0.12 * s, 0.14 * s)   # second outward arm
    c1 = P + o * 0.92 * s + up * (z2 + 0.21 * s)
    beam(mat, False, c1 - t * 0.55 * s, c1 + t * 0.55 * s, 0.12 * s, 0.14 * s)  # crosswise arm 令栱
    for e in (-t * 0.5 * s, t * 0.5 * s, V((0, 0, 0))):
        block(c1 + e + up * 0.07 * s, 0.17 * s, 0.09 * s)
    return z2 + 0.37 * s


def balustrade(pts, z, h=1.0, spacing=1.3, mat="redwood", collide=True, balusters=True):
    """Railing along a polyline: capped posts, top, middle and bottom rails, short balusters between the
    middle and top rails."""
    up = V((0, 0, 1))
    for (ax, ay), (bx_, by) in zip(pts, pts[1:]):
        A, B = V((ax, ay, z)), V((bx_, by, z))
        L = (B - A).length
        n = max(1, math.ceil(L / spacing))
        for k in range(n + 1):
            p = A.lerp(B, k / n)
            post(mat, collide, p.x, p.y, z, z + h + 0.06, 0.12, 0.02)
            bx(mat, False, (p.x - 0.085, p.y - 0.085, z + h + 0.06), (p.x + 0.085, p.y + 0.085, z + h + 0.12))
        beam(mat, collide, A + up * (h - 0.04), B + up * (h - 0.04), 0.09, 0.08, 0.015)
        beam(mat, collide, A + up * (h * 0.52), B + up * (h * 0.52), 0.07, 0.06, 0)
        beam(mat, False, A + up * 0.1, B + up * 0.1, 0.08, 0.06, 0)
        if balusters:
            m = max(1, math.floor(L / 0.5))
            for k in range(m):
                p = A.lerp(B, (k + 0.5) / m)
                post(mat, False, p.x, p.y, z + h * 0.52, z + h - 0.04, 0.05, 0)


def lattice_window(p0, p1, z0, z1, bars=None, out=0.03):
    """Straight-bar lattice window (直棂窗) in the wall plane from p0 to p1 (plan points); a frame proud of the
    wall by `out` on its outer side (the right of p0->p1), a dark backing behind the bars."""
    p0, p1 = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = p1 - p0
    L = t.length
    t.normalize()
    n = V((t.y, -t.x, 0))
    up = V((0, 0, 1))
    off = n * out
    bars = bars or max(3, int(L / 0.13))
    beam("timber", False, p0 + off + up * z0, p1 + off + up * z0, 0.13, 0.09, 0.02)
    beam("timber", False, p0 + off + up * z1, p1 + off + up * z1, 0.09, 0.09, 0.015)
    for p in (p0, p1):
        beam("timber", False, p + off + up * z0, p + off + up * z1, 0.09, 0.09, 0.015)
    for k in range(1, bars):
        q = p0 + t * (L * k / bars) + off * 0.5
        beam("lattice", False, q + up * z0, q + up * z1, 0.045, 0.045, 0)
    a, b = p0 - n * 0.03, p1 - n * 0.03
    sb.quad("interior", False, a + up * z0, b + up * z0, b + up * z1, a + up * z1)


def plank_door(p0, p1, z0, z1, boards=None, ajar=0.0):
    """Board door leaves in a frame; ajar 0..1 swings the two leaves inward (to the left of p0->p1)."""
    p0, p1 = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = p1 - p0
    L = t.length
    t.normalize()
    n = V((t.y, -t.x, 0))
    up = V((0, 0, 1))
    for p in (p0, p1):
        beam("timber", False, p + n * 0.03 + up * z0, p + n * 0.03 + up * (z1 + 0.08), 0.11, 0.11, 0.02)
    beam("timber", False, p0 + n * 0.03 + up * (z1 + 0.04), p1 + n * 0.03 + up * (z1 + 0.04), 0.12, 0.12, 0.02)
    sb.quad("interior", False, p0 - n * 0.6 + up * z0, p1 - n * 0.6 + up * z0, p1 - n * 0.6 + up * z1, p0 - n * 0.6 + up * z1)
    half = L / 2
    for side, hinge, dirv in ((0, p0, t), (1, p1, -t)):
        ang = math.radians(80) * ajar
        d = dirv * math.cos(ang) - n * math.sin(ang)
        boards_n = boards or max(2, int(half / 0.22))
        for k in range(boards_n):
            a = hinge + d * (half * k / boards_n)
            b = hinge + d * (half * (k + 1) / boards_n - 0.012)
            board("timber", False, a, b, 0.06, z0, z1)
        for zz in (z0 + 0.35, (z0 + z1) / 2, z1 - 0.35):  # battens
            beam("timber", False, hinge + d * 0.05 + up * zz - n * 0.05, hinge + d * (half - 0.05) + up * zz - n * 0.05,
                 0.1, 0.04, 0)


def stairs(x0, x1, ya, yb, z0, z1, n, mat="stone", collide=True, rng=None, fill_mat=None):
    """Steps along Y from ya (at z0) to yb (at z1), laid like real masonry: every step is one to three solid stones
    of the full rise, of different lengths, with rounded nosings, joints staggered from step to step and a few
    millimetres of height and tilt per stone. Underneath, one continuous sawtooth fill (plain wash, `fill_mat`)
    shows at the open sides. The walker collides with a hidden ramp laid over the nosings instead of the steps
    themselves (Messenger's separate hit mesh): a capsule can't climb short treads."""
    rng = rng or random.Random(round(x0 * 997 + ya * 131 + z1 * 17))
    if collide:
        verts = [(x0, ya, z0), (x1, ya, z0), (x1, yb, z0), (x0, yb, z0), (x1, yb, z1), (x0, yb, z1)]
        add("hidden", True, verts, [(0, 1, 4, 5), (0, 3, 2, 1), (2, 3, 5, 4), (1, 2, 4), (0, 5, 3)])
    sgn = 1 if yb > ya else -1
    rise = (z1 - z0) / n
    tread_t = rise + 0.02
    W = x1 - x0
    fronts = [ya + (yb - ya) * k / n for k in range(n + 1)]
    # the fill: a sawtooth profile in (y, z) under the stones, extruded across the stair
    prof = [(ya + sgn * 0.05, z0)]
    for k in range(1, n):
        zf = z0 + rise * k - 0.01
        prof += [(fronts[k] + sgn * 0.05, prof[-1][1]), (fronts[k] + sgn * 0.05, zf)]
    prof += [(yb, prof[-1][1]), (yb, z0)]
    if sgn < 0:
        prof.reverse()
    m = len(prof)
    xa, xb = x0 + 0.03, x1 - 0.03
    verts = [V((xa, y, z)) for y, z in prof] + [V((xb, y, z)) for y, z in prof]
    # the profile runs clockwise in (y, z), so it faces -x as listed
    faces = [tuple(range(m)), tuple(reversed(range(m, 2 * m)))]
    faces += [(i, m + i, m + (i + 1) % m, (i + 1) % m) for i in range(m)]
    if n > 1:
        fm = fill_mat or mat
        add(fm, False, verts, faces, _piece_uvs(verts, faces, fm, rng))
    for k in range(n):
        front, back = fronts[k], fronts[k + 1] + sgn * 0.04
        ztop = z0 + rise * (k + 1)
        mm = 1 if W < 1.1 else rng.choice((2, 2, 3)) if W < 2.6 else rng.randint(3, 4)
        cuts = sorted(rng.uniform(0.2, 0.8) * W for _ in range(mm - 1))
        xs = [x0 - 0.02] + [x0 + c for c in cuts] + [x1 + 0.02]
        lo, hi = sorted((front - sgn * 0.035, back))
        for xa_, xb_ in zip(xs, xs[1:]):
            zt = ztop + rng.uniform(-0.008, 0.006)
            soft_slab(mat, False, [(xa_ + 0.006, lo), (xb_ - 0.006, lo), (xb_ - 0.006, hi), (xa_ + 0.006, hi)],
                      zt - tread_t, zt, rng, r=0.05, wob=0.008, ease=0.025, tilt=0.012)


# ---------------------------------------------------------------- soft pieces: nothing with a straight edge

def _round_outline(pts, rng, r, wob, seg):
    """A plan polygon (counter-clockwise) as a hand-cut outline: every corner rounded with its own radius, every
    edge subdivided about every `seg` m and its inner points nudged in or out by up to `wob`."""
    P = [V((p[0], p[1], 0)) for p in pts]
    n = len(P)
    corners = []
    for i in range(n):
        a, b, c = P[i - 1], P[i], P[(i + 1) % n]
        da, dc = a - b, c - b
        rr = min(r * rng.uniform(0.6, 1.4), 0.45 * da.length, 0.45 * dc.length)
        p0, p2 = b + da.normalized() * rr, b + dc.normalized() * rr
        corners.append([p0, p0 * 0.25 + b * 0.5 + p2 * 0.25, p2])
    out = []
    for i in range(n):
        out += corners[i]
        a, b = corners[i][2], corners[(i + 1) % n][0]
        d = b - a
        m = max(1, round(d.length / seg))
        nrm = V((d.y, -d.x, 0)).normalized() if d.length > 1e-9 else V((0, 0, 0))
        for j in range(1, m):
            out.append(a + d * (j / m) + nrm * rng.uniform(-wob, wob))
    return out


def _atlas_uvs(verts, faces, cols, rows, rng, margin=0.015):
    """Each face group of a piece (top/bottom and each of the four sides, by dominant normal) is mapped whole onto
    one random cell of the atlas, randomly mirrored, normalised over the piece's bounds."""
    lo = V((min(p.x for p in verts), min(p.y for p in verts), min(p.z for p in verts)))
    hi = V((max(p.x for p in verts), max(p.y for p in verts), max(p.z for p in verts)))
    size = V((max(hi.x - lo.x, 1e-6), max(hi.y - lo.y, 1e-6), max(hi.z - lo.z, 1e-6)))
    axes = {0: (1, 2), 1: (0, 2), 2: (0, 1)}
    groups = {}
    uvs = []
    for f in faces:
        nrm = V((0, 0, 0))
        for i in range(len(f)):
            a, b = verts[f[i]], verts[f[(i + 1) % len(f)]]
            nrm += V(((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)))
        ax = max(range(3), key=lambda i: abs(nrm[i]))
        key = (ax, nrm[ax] > 0)
        if key not in groups:
            groups[key] = (rng.randrange(cols * rows), rng.random() < 0.5, rng.random() < 0.5)
        cell, fu, fv = groups[key]
        cu, cv = cell % cols, cell // cols
        a0, a1 = axes[ax]
        row = []
        for i in f:
            p = verts[i]
            u, v = (p[a0] - lo[a0]) / size[a0], (p[a1] - lo[a1]) / size[a1]
            u, v = (1 - u if fu else u), (1 - v if fv else v)
            u, v = margin + u * (1 - 2 * margin), margin + v * (1 - 2 * margin)
            row.append(((cu + u) / cols, 1 - (cv + 1 - v) / rows))
        uvs.append(row)
    return uvs


def _add_piece(mat, collide, verts, faces, rng, along=None):
    atlas = FACE_ATLAS.get(mat) if along is None else None
    if atlas:
        add(atlas[0], collide, verts, faces, _atlas_uvs(verts, faces, atlas[1], atlas[2], rng))
    else:
        add(mat, collide, verts, faces, _piece_uvs(verts, faces, mat, rng, along))


def _piece_uvs(verts, faces, mat, rng, along=None):
    """Explicit UVs for one piece: box-projected (or along a grain direction), shifted by a random offset, so that
    no two pieces show the same patch of the swatch."""
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    if along is not None:
        g = V((along[0], along[1], 0)).normalized()
        q = V((-g.y, g.x, 0))
    uvs = []
    for f in faces:
        nrm = V((0, 0, 0))
        for i in range(len(f)):  # Newell's normal
            a, b = verts[f[i]], verts[f[(i + 1) % len(f)]]
            nrm += V(((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)))
        row = []
        for i in f:
            p = verts[i]
            if along is None:
                u, v = sb.box_uv(p, nrm, 1.0)
            else:
                u, v = p.dot(g), (p.dot(q) if abs(nrm.z) > 0.5 * nrm.length else p.z)
            row.append((u / tile + ou, v / tile + ov))
        uvs.append(row)
    return uvs


def soft_slab(mat, collide, outline, z0, z1, rng, r=0.05, wob=0.012, seg=0.7, ease=None, tilt=0.008, along=None,
              cap_bottom=False):
    """A solid piece from a plan outline, with no straight edge: corners rounded, edges gently wavy
    (_round_outline), the top edge eased by an inset ring (one soft ink line instead of a knife edge), the top
    tilted by up to `tilt` m per m. Each piece samples its own patch of the swatch (along: grain direction).
    ease=0 leaves the top edge sharp and saves a ring (for pieces whose top is hidden)."""
    ring = _round_outline(outline, rng, r, wob, seg)
    n = len(ring)
    e = min(r * 0.6 if ease is None else ease, (z1 - z0) * 0.45)
    if e <= 0:
        verts = [V((p.x, p.y, z0)) for p in ring] + [V((p.x, p.y, z1)) for p in ring]
        faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)] + [tuple(range(n, 2 * n))]
        _add_piece(mat, collide, verts, faces, rng, along)
        return
    cx = sum(p.x for p in ring) / n
    cy = sum(p.y for p in ring) / n
    gx, gy = rng.uniform(-tilt, tilt), rng.uniform(-tilt, tilt)
    inset = []
    for i in range(n):
        a, b, c = ring[i - 1], ring[i], ring[(i + 1) % n]
        t1, t2 = (b - a), (c - b)
        o = V((t1.y, -t1.x, 0)).normalized() + V((t2.y, -t2.x, 0)).normalized()
        inset.append(b - (o.normalized() if o.length > 1e-6 else o) * e)
    dz = [gx * (p.x - cx) + gy * (p.y - cy) for p in ring]
    verts = ([V((p.x, p.y, z0)) for p in ring] + [V((p.x, p.y, z1 - e + d)) for p, d in zip(ring, dz)]
             + [V((p.x, p.y, z1 + d)) for p, d in zip(inset, dz)])
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    faces += [(n + i, n + (i + 1) % n, 2 * n + (i + 1) % n, 2 * n + i) for i in range(n)]
    faces.append(tuple(range(2 * n, 3 * n)))
    if cap_bottom:
        faces.append(tuple(reversed(range(n))))
    _add_piece(mat, collide, verts, faces, rng, along)


def soft_box(mat, collide, lo, hi, rng, **kw):
    """soft_slab over an axis-aligned plan rectangle."""
    soft_slab(mat, collide, [(lo[0], lo[1]), (hi[0], lo[1]), (hi[0], hi[1]), (lo[0], hi[1])], lo[2], hi[2], rng, **kw)


def stone_run(mat, collide, p0, p1, z0, z1, depth, rng, lmin=0.55, lmax=1.2, gap=0.012, r=0.045, off=0.0,
              jz=0.012, jo=0.01, jd=0.0, skew=0.0, **kw):
    """A course of separate dressed blocks along the plan segment p0->p1, `depth` across it (centred on the
    segment, shifted `off` to its right), each block its own length, height and set: the joints draw the ink.
    jd: depth jitter per block; skew: joints lean by up to that much across the course instead of running square."""
    p0, p1 = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    L = (p1 - p0).length
    t = (p1 - p0) / L
    nrm = V((t.y, -t.x, 0))
    cuts = [0.0]
    while L - cuts[-1] > lmax:
        cuts.append(cuts[-1] + rng.uniform(lmin, lmax))
    if L - cuts[-1] < lmin * 0.5 and len(cuts) > 1:
        cuts.pop()
    cuts.append(L)
    leans = [0.0] + [rng.uniform(-skew, skew) for _ in cuts[1:-1]] + [0.0]
    for k_, (sa, sb_) in enumerate(zip(cuts, cuts[1:])):
        o = off + rng.uniform(-jo, jo)
        d = depth + rng.uniform(-jd, jd)
        a, b = p0 + t * (sa + gap / 2), p0 + t * (sb_ - gap / 2)
        lo_, hi_ = nrm * (o - d / 2), nrm * (o + d / 2)
        la, lb = t * leans[k_], t * leans[k_ + 1]
        outline = [a + lo_ - la, b + lo_ - lb, b + hi_ + lb, a + hi_ + la]
        if (outline[1] - outline[0]).cross(outline[2] - outline[1]).z < 0:
            outline.reverse()
        soft_slab(mat, collide, [(p.x, p.y) for p in outline], z0, z1 + rng.uniform(-jz, jz), rng, r=r, **kw)


def paving(x0, x1, y0, y1, z, rng, mat="stone", course=(0.5, 0.8), length=(0.55, 1.15), thick=0.1, gap=0.012):
    """Dressed slabs in running courses along X: course widths and slab lengths vary, joints are staggered, every
    slab is a soft piece a few millimetres proud of or below its neighbours."""
    y = y0
    while y < y1 - 0.05:
        w = rng.uniform(*course)
        if y1 - (y + w) < course[0] * 0.6:
            w = y1 - y
        stone_run(mat, True, (x0, y + w / 2), (x1, y + w / 2), z - thick, z, w - gap, rng, lmin=length[0],
                  lmax=length[1], gap=gap, r=0.07, jz=0.008, jo=0.012, jd=0.02, skew=0.08, wob=0.015, ease=0.025,
                  tilt=0.012)
        y += w


def plank_deck(x0, x1, y0, y1, z, rng, mat="deck", w=(0.24, 0.34), thick=0.06, collide=True):
    """Deck boards laid across Y from x0 to x1, each its own piece: eased edges, ragged ends, slightly skewed, a
    few millimetres up or down, butt joints on some, grain running along the board."""
    x = x0
    while x < x1 - 0.05:
        bw = min(rng.uniform(*w), x1 - x)
        gap = rng.uniform(0.01, 0.02)
        ends = [y0 + rng.uniform(-0.07, 0.03), y1 + rng.uniform(-0.03, 0.07)]
        if rng.random() < 0.35:
            ends.insert(1, rng.uniform(y0 + 1.5, y1 - 1.5))
        for k, (ya, yb) in enumerate(zip(ends, ends[1:])):
            ya, yb = ya + (0.006 if k else 0), yb - (0.006 if k < len(ends) - 2 else 0)
            s0, s1 = rng.uniform(-0.015, 0.015), rng.uniform(-0.015, 0.015)
            zt = z + rng.uniform(-0.01, 0.008)
            soft_slab(mat, collide, [(x + gap / 2, ya + s0), (x + bw - gap / 2, ya - s0), (x + bw - gap / 2, yb + s1),
                                     (x + gap / 2, yb - s1)], zt - thick, zt, rng, r=0.03, wob=0.006, seg=1.6,
                      ease=0.012, tilt=0.006, along=(0, 1))
        x += bw


def masonry(p0, p1, z0, z1, depth, rng, course=(0.32, 0.48), mat="stone", collide=True, **kw):
    """Coursed stone along the plan segment p0->p1: stone_run courses stacked from z0 to z1, each course its own
    height, with the joints of one course falling anywhere on the next."""
    z = z0
    while z < z1 - 0.02:
        hgt = rng.uniform(*course)
        if z1 - (z + hgt) < course[0] * 0.5:
            hgt = z1 - z
        stone_run(mat, collide, p0, p1, z, z + hgt, depth, rng, jz=0.0 if z + hgt >= z1 - 1e-6 else 0.006, **kw)
        z += hgt


def soft_plinth(x0, x1, y0, y1, zt, rng, mat="stone", edge=0.42, z_foot=-0.05):
    """A building's stone platform (台基): a soft body, and a ring of edge stones (阶条石) of varied lengths
    around its top, a little proud of the body; the floor sits inside the ring. z_foot: how deep the body reaches
    (deeper where it stands on a neighbouring section's ground, which dips toward the seam)."""
    soft_box(mat, True, (x0 + 0.05, y0 + 0.05, z_foot), (x1 - 0.05, y1 - 0.05, zt - 0.1), rng, r=0.1, wob=0.015,
             seg=1.2, ease=0, tilt=0)
    e = edge / 2
    for a, b in (((x0, y0 + e), (x1, y0 + e)), ((x1 - e, y0 + edge), (x1 - e, y1 - edge)),
                 ((x1, y1 - e), (x0, y1 - e)), ((x0 + e, y1 - edge), (x0 + e, y0 + edge))):
        stone_run(mat, True, a, b, zt - 0.16, zt, edge, rng, lmin=1.0, lmax=1.8, r=0.05, jz=0.006, ease=0.03,
                  tilt=0.008, seg=1.0)
    soft_box(mat, True, (x0 + edge - 0.04, y0 + edge - 0.04, zt - 0.17), (x1 - edge + 0.04, y1 - edge + 0.04, zt - 0.015),
             rng, r=0.05, wob=0.01, seg=2.0, ease=0, tilt=0)


# ---------------------------------------------------------------- roofs

def _roof_surface(slopes, height, thick, nt, tile=1.4, mat="roof", under="timber", rafters=True):
    """Shared by hip and gable roofs. slopes: [(E0, E1, R0, R1, ns)] in plan; height(s, t) -> z.
    Writes the tiled top, the timber underside, the fascia along the eave and rafter ends under it."""
    up = V((0, 0, 1))
    edges = []
    for E0, E1, R0, R1, ns in slopes:
        E0, E1, R0, R1 = (V((p[0], p[1], 0)) for p in (E0, E1, R0, R1))
        apex = (R1 - R0).length < 1e-6
        rows = []
        for j in range(nt + 1):
            t = j / nt
            row = []
            cols = 1 if (apex and j == nt) else ns + 1
            for i in range(cols):
                s = i / ns if cols > 1 else 0.5
                p = E0.lerp(E1, s).lerp(R0.lerp(R1, s), t)
                row.append(V((p.x, p.y, height(s, t))))
            rows.append(row)
        eave_len = (E1 - E0).length
        slope_len = sum((rows[j + 1][0] - rows[j][0]).length for j in range(nt)) if not apex else ((E0 - R0).length * 1.2)
        verts, faces, uvs = [], [], []
        verts_u, faces_u = [], []
        index = {}

        def vid(j, i):
            key = (j, i)
            if key not in index:
                index[key] = len(verts)
                verts.append(rows[j][i])
                verts_u.append(rows[j][i] - up * thick)
            return index[key]

        def uv(j, i):
            s = i / ns if len(rows[j]) > 1 else 0.5
            return (s * eave_len / tile, (j / nt) * slope_len / tile)

        for j in range(nt):
            top_apex = len(rows[j + 1]) == 1
            for i in range(ns):
                if top_apex:
                    f = (vid(j, i), vid(j, i + 1), vid(j + 1, 0))
                    faces.append(f)
                    uvs.append([uv(j, i), uv(j, i + 1), uv(j + 1, 0)])
                else:
                    f = (vid(j, i), vid(j, i + 1), vid(j + 1, i + 1), vid(j + 1, i))
                    faces.append(f)
                    uvs.append([uv(j, i), uv(j, i + 1), uv(j + 1, i + 1), uv(j + 1, i)])
        add(mat, False, verts, faces, uvs)
        add(under, False, verts_u, [tuple(reversed(f)) for f in faces])
        edges.append(rows)
    # fascia board along each eave, and rafter ends under it
    for rows in edges:
        eave = rows[0]
        for a, b in zip(eave, eave[1:]):
            sb.quad("redwood", False, a, b, b - up * thick, a - up * thick)
        if rafters:
            for i, (a, b) in enumerate(zip(eave, eave[1:])):
                L = (b - a).length
                k = max(1, int(L / 0.32))
                nxt = rows[1]
                inward = (nxt[min(i, len(nxt) - 1)] + nxt[min(i + 1, len(nxt) - 1)]) / 2 - (a + b) / 2
                inward.z = 0
                inward.normalize()
                for m in range(k):
                    p = a.lerp(b, (m + 0.5) / k) - up * (thick + 0.05) - inward * 0.02
                    beam("redwood", False, p, p + inward * 0.35, 0.09, 0.09, 0)
    return edges


def ridge_ornament(p, facing, s=1.0, mat="ridge"):
    """A ridge-end ornament (鸱吻): a tall block curling inward over the ridge. facing: plan vector pointing
    outward along the ridge."""
    o = V((facing[0], facing[1], 0)).normalized()
    up = V((0, 0, 1))
    P = V(p)
    beam(mat, False, P, P + up * 0.45 * s, 0.32 * s, 0.24 * s, 0.05 * s)
    beam(mat, False, P + up * 0.4 * s, P + up * 0.75 * s - o * 0.18 * s, 0.26 * s, 0.2 * s, 0.05 * s)
    beam(mat, False, P + up * 0.72 * s - o * 0.16 * s, P + up * 0.82 * s - o * 0.42 * s, 0.2 * s, 0.16 * s, 0.04 * s)
    beam(mat, False, P + up * 0.2 * s + o * 0.1 * s, P + up * 0.5 * s + o * 0.2 * s, 0.14 * s, 0.12 * s, 0.03 * s)


def hip_roof(x0, x1, y0, y1, z_eave, z_ridge, lift=0.45, curve=1.7, thick=0.24, ns=14, nt=6, ornament_s=1.2):
    """Hipped roof (庑殿) over the eave rectangle, ridge along X: concave slopes, corners swept up, tiled top,
    timber underside, fascia and rafter ends, raised main and hip ridges, ridge-end ornaments."""
    yc = (y0 + y1) / 2
    d = (y1 - y0) / 2
    rx0, rx1 = x0 + d, x1 - d

    def height(s, t):
        return z_eave + (z_ridge - z_eave) * (t ** curve) + lift * (abs(2 * s - 1) ** 3) * (1 - t) ** 2

    slopes = [((x0, y0), (x1, y0), (rx0, yc), (rx1, yc), ns),
              ((x1, y0), (x1, y1), (rx1, yc), (rx1, yc), max(6, ns // 2)),
              ((x1, y1), (x0, y1), (rx1, yc), (rx0, yc), ns),
              ((x0, y1), (x0, y0), (rx0, yc), (rx0, yc), max(6, ns // 2))]
    edges = _roof_surface(slopes, height, thick, nt)
    up = V((0, 0, 1))
    # hip ridges follow the curved hip lines (the first and last column of the long slopes)
    for rows in (edges[0], edges[2]):
        for col in (0, -1):
            line = [r[col] if len(r) > 1 else r[0] for r in rows]
            for a, b in zip(line, line[1:]):
                beam("ridge", False, a + up * 0.08, b + up * 0.08, 0.2, 0.16, 0.03)
            ridge_ornament(line[0] + up * 0.1, (line[0] - line[-1]), s=0.35 * ornament_s)
    beam("ridge", False, (rx0 - 0.1, yc, z_ridge + 0.14), (rx1 + 0.1, yc, z_ridge + 0.14), 0.3, 0.32, 0.05)
    ridge_ornament((rx0 - 0.05, yc, z_ridge + 0.28), (-1, 0), s=ornament_s)
    ridge_ornament((rx1 + 0.05, yc, z_ridge + 0.28), (1, 0), s=ornament_s)


def gable_roof(x0, x1, yf, yb, z_eave, z_ridge, over=0.5, lift=0.18, curve=1.35, thick=0.16, ns=8, nt=4,
               ornament_s=0.6):
    """Overhanging gable roof (悬山), ridge along X between eave lines at yf and yb: slightly concave, the four
    corners lifted, barge boards along both gable edges, a raised ridge with curled ends."""
    yc = (yf + yb) / 2
    xa, xb = x0 - over, x1 + over

    def height(s, t):
        return z_eave + (z_ridge - z_eave) * (t ** curve) + lift * (abs(2 * s - 1) ** 4) * (1 - t)

    slopes = [((xa, yf), (xb, yf), (xa, yc), (xb, yc), ns),
              ((xb, yb), (xa, yb), (xb, yc), (xa, yc), ns)]
    edges = _roof_surface(slopes, height, thick, nt)
    up = V((0, 0, 1))
    for rows in edges:
        for col in (0, -1):
            line = [r[col] for r in rows]
            for a, b in zip(line, line[1:]):
                beam("redwood", False, a - up * 0.06, b - up * 0.06, 0.07, 0.3, 0.015)  # barge board 搏风
    beam("ridge", False, (xa - 0.05, yc, z_ridge + 0.1), (xb + 0.05, yc, z_ridge + 0.1), 0.24, 0.26, 0.04)
    ridge_ornament((xa, yc, z_ridge + 0.2), (-1, 0), s=ornament_s)
    ridge_ornament((xb, yc, z_ridge + 0.2), (1, 0), s=ornament_s)


# ---------------------------------------------------------------- set pieces

def house(W, D, rng, eave=2.9, rise=1.5, plinth=0.45, bays=3, door_bays=(1,), brackets=True, awning=False):
    """A one-storey Song street house in a local frame: front along y = 0 facing -y, x from 0 to W, depth D
    toward +y. Stone plinth with front steps, timber columns on bases, plank doors and lattice windows in the
    front bays, plaster side and back walls with gable triangles, bracket row under the front eave, overhanging
    gable roof. Place it with `with placed(frame(...)):`."""
    zt = plinth
    soft_plinth(-0.4, W + 0.4, -0.6, D + 0.4, zt, rng)
    stairs(W * 0.38, W * 0.62, -1.15, -0.55, 0, zt, 2, rng=rng)
    xs = [W * k / bays for k in range(bays + 1)]
    top = zt + eave
    for x in xs:
        column(x, 0, zt, top, r=0.12, mat="timber")
    for x in (0, W):
        column(x, D, zt, top, r=0.12, mat="timber")
    # side and back walls, and the gable triangles above the side walls
    bx("plaster", True, (-0.07, 0.12, zt), (0.07, D - 0.12, top))
    bx("plaster", True, (W - 0.07, 0.12, zt), (W + 0.07, D - 0.12, top))
    bx("plaster", True, (0.12, D - 0.07, zt), (W - 0.12, D + 0.07, top))
    for x in (0.0, W):
        add("plaster", False, [(x, -0.2, top), (x, D + 0.2, top), (x, D / 2, top + rise * 0.92)], [(0, 1, 2)])
    beam("timber", True, (-0.2, 0, top - 0.12), (W + 0.2, 0, top - 0.12), 0.18, 0.24, 0.03)  # front lintel
    beam("timber", False, (-0.2, D, top - 0.12), (W + 0.2, D, top - 0.12), 0.16, 0.22, 0.03)
    for k in range(bays):
        xa, xb = xs[k] + 0.13, xs[k + 1] - 0.13
        if k in door_bays:
            plank_door((xa, 0.05), (xb, 0.05), zt, top - 0.45, ajar=rng.uniform(0.3, 0.9))
            bx("plaster", False, (xa, -0.0, top - 0.45), (xb, 0.1, top - 0.24))
        else:
            bx("plaster", True, (xa, 0.0, zt), (xb, 0.12, zt + 0.85))
            lattice_window((xa, 0.0), (xb, 0.0), zt + 0.85, top - 0.55)
            bx("plaster", False, (xa, 0.0, top - 0.55), (xb, 0.12, top - 0.24))
    # floor boards: they collide (fix-gate, details pass 2026-10-13, as S4's halls): over the collide plinth alone the
    # walkable top was zt - 0.015, so people and the player stood 5.5 cm inside the visible boards
    bx("timber", True, (0.1, 0.1, zt), (W - 0.1, D - 0.1, zt + 0.04))
    if brackets:
        for x in xs:
            bracket(x, 0, top, (0, -1), s=0.55, mat="timber")
    gable_roof(-0.1, W + 0.1, -0.95, D + 0.75, top + 0.32, top + 0.32 + rise, over=0.45)
    if awning:
        za, zb = top - 0.25, 2.1
        sb.quad("reed", False, (0.2, -0.95, za), (W - 0.2, -0.95, za), (W - 0.2, -2.6, zb), (0.2, -2.6, zb),
                uv=[(0, 0), (W, 0), (W, 1.7), (0, 1.7)])
        for x in (0.35, W - 0.35):
            sb.cyl("bamboo", True, (x, -2.55, 0), (x, -2.55, zb + 0.05), 0.045, segs=6)
        sb.cyl("bamboo", False, (0.2, -2.55, zb), (W - 0.2, -2.55, zb), 0.04, segs=6)


def bale(x, y, z, l, w, h, yaw, mat="cloth_white"):
    """A cloth bale: a well-rounded block with two rope bands."""
    o = V((math.cos(yaw), math.sin(yaw), 0))
    P = V((x, y, z + h / 2))
    beam(mat, True, P - o * l / 2, P + o * l / 2, w, h, min(w, h) * 0.14)
    for f in (-0.3, 0.0, 0.3):
        c = P + o * l * f
        beam("rope", False, c - o * 0.025, c + o * 0.025, w + 0.025, h + 0.025, min(w, h) * 0.14)
    beam("rope", False, P - o * (l / 2 + 0.01) + V((0, 0, h / 2)), P + o * (l / 2 + 0.01) + V((0, 0, h / 2)), 0.05, 0.025, 0)


def drum(x, y, z, r=0.62, length=0.7):
    """The tower drum on its stand (城上暮鼓): axis along X, rims and studs, a timber frame with splayed legs."""
    sb.cyl("drum", False, (x - length / 2, y, z), (x + length / 2, y, z), r, segs=16)
    for sx in (-1, 1):
        sb.cyl("rope", False, (x + sx * length / 2, y, z), (x + sx * (length / 2 + 0.02), y, z), r * 1.02, segs=16)
    for sx in (-1, 1):
        for sy in (-1, 1):
            beam("timber", False, (x + sx * 0.25, y + sy * 0.55, z - r - 0.5), (x + sx * 0.25, y + sy * 0.3, z - 0.1),
                 0.08, 0.08, 0.015)
    beam("timber", False, (x - 0.25, y - 0.35, z - 0.15), (x - 0.25, y + 0.35, z - 0.15), 0.08, 0.08, 0.015)
    beam("timber", False, (x + 0.25, y - 0.35, z - 0.15), (x + 0.25, y + 0.35, z - 0.15), 0.08, 0.08, 0.015)


def frame_scale(x, y, z):
    """A large frame scale: two posts, a crossbar, a steelyard beam with chains and two pans."""
    for dy in (-0.6, 0.6):
        post("timber", True, x, y + dy, z, z + 2.4, 0.1, 0.02)
    beam("timber", False, (x, y - 0.7, z + 2.35), (x, y + 0.7, z + 2.35), 0.1, 0.12, 0.02)
    beam("timber", False, (x, y - 0.55, z + 1.9), (x, y + 0.55, z + 1.9), 0.05, 0.05, 0)
    for dy in (-0.45, 0.45):
        sb.cyl("rope", False, (x, y + dy, z + 1.9), (x, y + dy, z + 1.0), 0.01, segs=4)
        sb.lathe("timber", False, (x, y + dy, z + 0.95), [(0.05, 0), (0.28, 0.06), (0.3, 0.1)], segs=10)


def table(x0, y0, x1, y1, z, h=0.78, mat="timber"):
    bx(mat, True, (x0, y0, z + h - 0.05), (x1, y1, z + h))
    bx(mat, False, (x0 + 0.04, y0 + 0.04, z + h - 0.14), (x1 - 0.04, y1 - 0.04, z + h - 0.05))  # apron
    for xx in (x0 + 0.06, x1 - 0.06):
        for yy in (y0 + 0.06, y1 - 0.06):
            post(mat, False, xx, yy, z, z + h - 0.05, 0.06, 0.012)


# ---------------------------------------------------------------- earthworks and dressing

def rammed_wall(y_from, y_to, xi0, xi1, xo0, xo1, rng, h_lo=6.6, h_hi=7.8, layers=8, flat_near=None, flat_h=7.88,
                mat="rammed"):
    """Rammed-earth wall (夯土城墙) running along Y. Battered faces built course by course: each course steps in
    a few cm at its top, so the courses read as ink lines; the faces bulge and slump from section to section,
    the top is uneven. xi0/xo0: inner and outer face x at the base; xi1/xo1: at the top. flat_near: keep the
    top level (at flat_h) within 4.6 m of that y, where the wall meets the gate block."""
    n = max(2, int(abs(y_to - y_from) / 1.4))
    rows = []
    for j in range(n + 1):
        y = y_from + (y_to - y_from) * j / n
        h = rng.uniform(h_lo, h_hi)
        if flat_near is not None and abs(y - flat_near) < 4.6:
            h = flat_h
        bulge_i, bulge_o = rng.uniform(-0.35, 0.25), rng.uniform(-0.25, 0.35)
        inner, outer = [], []
        for l in range(layers + 1):
            f = l / layers
            z = h * f
            wob = math.sin(math.pi * f) * 1.0
            xi = xi0 + (xi1 - xi0) * f + bulge_i * wob + rng.uniform(-0.05, 0.05)
            xo = xo0 + (xo1 - xo0) * f + bulge_o * wob + rng.uniform(-0.05, 0.05)
            if 0 < l < layers:  # the course ledge: out at the course top, then stepped in
                inner += [V((xi - 0.06, y, z)), V((xi, y, z + 0.03))]
                outer += [V((xo + 0.06, y, z)), V((xo, y, z + 0.03))]
            else:
                inner.append(V((xi, y, z)))
                outer.append(V((xo, y, z)))
        top_i = inner[-1] + V((rng.uniform(0.1, 0.5), 0, rng.uniform(-0.1, 0.1)))
        top_o = outer[-1] - V((rng.uniform(0.1, 0.5), 0, rng.uniform(-0.1, 0.1)))
        rows.append(inner + [top_i, top_o] + list(reversed(outer)))
    m = len(rows[0])
    verts, faces = [], []
    for row in rows:
        verts.extend(row)
    for j in range(n):
        for i in range(m - 1):
            a = j * m + i
            faces.append((a, a + 1, a + m + 1, a + m))
    faces.append(tuple(range(m)))
    faces.append(tuple(range(n * m, n * m + m)))
    add(mat, True, verts, faces)
    return rows


def grass_tuft(x, y, z, rng, h=0.3, mat="grass"):
    """A clump of blades: thin leaning triangles fanned around a point."""
    blades = rng.randint(4, 7)
    verts, faces = [], []
    for b in range(blades):
        a = 2 * math.pi * b / blades + rng.uniform(-0.4, 0.4)
        lean = rng.uniform(0.25, 0.6)
        hh = h * rng.uniform(0.6, 1.2)
        w = 0.025
        d = V((math.cos(a), math.sin(a), 0))
        s = V((-d.y, d.x, 0)) * w
        base = V((x, y, z)) + d * rng.uniform(0.0, 0.06)
        tip = base + d * hh * lean + V((0, 0, hh))
        i = len(verts)
        verts += [base - s, base + s, tip]
        faces.append((i, i + 1, i + 2))
    add(mat, False, verts, faces)


def yard_wall(pts, z_of, h=2.1, thick=0.32, mat="plaster"):
    """Courtyard wall along a polyline: stone footing, plaster body, a small tiled gable cap with a ridge.
    z_of(x, y) gives the ground height."""
    up = V((0, 0, 1))
    for (ax, ay), (bx_, by) in zip(pts, pts[1:]):
        a, b = V((ax, ay, 0)), V((bx_, by, 0))
        L = (b - a).length
        t = (b - a).normalized()
        n = V((t.y, -t.x, 0))
        z0 = min(z_of(ax, ay), z_of(bx_, by)) - 0.05
        board("stone", True, a, b, thick + 0.1, z0, z0 + 0.4)
        board(mat, True, a, b, thick, z0 + 0.4, z0 + h)
        zc = z0 + h
        ca, cb = a - t * 0.05, b + t * 0.05
        for side in (1, -1):
            e0, e1 = ca + n * side * (thick / 2 + 0.16), cb + n * side * (thick / 2 + 0.16)
            r0, r1 = ca, cb
            quad_pts = [e0 + up * zc, e1 + up * zc, r1 + up * (zc + 0.32), r0 + up * (zc + 0.32)]
            sb.quad("roof", False, *quad_pts, uv=[(0, 0), (L / 1.4, 0), (L / 1.4, 0.25), (0, 0.25)])
            sb.quad("redwood", False, e0 + up * zc, e1 + up * zc, e1 + up * (zc - 0.06), e0 + up * (zc - 0.06))
        beam("ridge", False, ca + up * (zc + 0.36), cb + up * (zc + 0.36), 0.14, 0.12, 0.02)


# ---------------------------------------------------------------- painted things added in the loyalty pass (2026-10-11)
# Each builds one thing the scroll paints (map/BUILDING.md: one map entity, one model). Positions come from the
# caller (layout.json); sizes the strokes can't give are the caller's "choice:".

def trestle(xs, y0, y1, z_bed, z_top, rng, mat="timber"):
    """A timber pier under a bridge end, as the moat bridge's are painted: at each x of `xs` a bent of three round
    piles across the deck (y0..y1) with square caps and a cross beam under the deck; along both edges a long beam
    under the caps and a low one near the water; diagonal struts between the bents."""
    ys = [y0 + 0.45, (y0 + y1) / 2, y1 - 0.45]
    for x in xs:
        for y in ys:
            sb.cyl(mat, False, (x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), z_bed), (x, y, z_top - 0.42),
                   0.15, 0.13, segs=8)
            bx(mat, False, (x - 0.17, y - 0.17, z_top - 0.5), (x + 0.17, y + 0.17, z_top - 0.4))
        beam(mat, False, (x, y0 + 0.15, z_top - 0.36), (x, y1 - 0.15, z_top - 0.36), 0.2, 0.16, 0.03)
    xa, xb = min(xs) - 0.25, max(xs) + 0.25
    for y in (ys[0], ys[-1]):
        beam(mat, False, (xa, y, z_top - 0.62), (xb, y, z_top - 0.62), 0.18, 0.2, 0.03)
        beam(mat, False, (xa, y, z_bed + 0.6), (xb, y, z_bed + 0.6), 0.16, 0.16, 0.03)
        for a, b in zip(xs, xs[1:]):
            if b - a > 0.6:
                beam(mat, False, (a, y, z_bed + 0.7), (b, y, z_top - 0.75), 0.1, 0.1, 0.02)


def canopy(x0, x1, y_low, y_high, z_low, z_high, poles, rng, mat="reed"):
    """A flat stall canopy of mat and planks on poles (the one painted at the studded-door house): a thin slab
    from its low front edge (y_low, z_low) up to its high edge (y_high, z_high), a timber frame round it and
    battens across, carried by `poles` = [(x_foot, y_foot, x_top), ...] (a pole may slant)."""
    th = 0.05
    a, b = V((x0, y_low, z_low)), V((x1, y_low, z_low))
    c, d = V((x1, y_high, z_high)), V((x0, y_high, z_high))
    up = V((0, 0, th))
    W, L = x1 - x0, (c - b).length
    sb.quad(mat, False, a + up, b + up, c + up, d + up, uv=[(0, 0), (W, 0), (W, L), (0, L)])
    sb.quad(mat, False, d, c, b, a, uv=[(0, 0), (W, 0), (W, L), (0, L)])
    for p, q in ((a, b), (b, c), (c, d), (d, a)):
        beam("timber", False, p + up * 0.5, q + up * 0.5, 0.07, 0.08, 0.012)
    n = max(2, int(W / 0.55))
    for i in range(1, n):
        t = i / n
        beam("timber", False, a.lerp(b, t) + up * 1.6, d.lerp(c, t) + up * 1.6, 0.04, 0.03, 0)
    for xf, yf, xt in poles:
        top = V((xt, y_low, z_low))
        sb.cyl("bamboo", True, (xf, yf, -0.1), top, 0.05, 0.045, segs=6)


def cask(x, y, z, r, h, rng, mat="timber"):
    """A hooped wooden cask (梢桶) standing on end: a bellied stave body, dark hoops, a lid."""
    prof = [(r * 0.86, 0), (r, h * 0.3), (r * 1.02, h * 0.5), (r, h * 0.7), (r * 0.86, h)]
    sb.lathe(mat, True, (x, y, z), prof, segs=12)
    for t in (0.1, 0.32, 0.68, 0.9):
        rr = r * (0.9 + 0.12 * math.sin(math.pi * t)) + 0.012
        sb.cyl("lattice", False, (x, y, z + h * t - 0.025), (x, y, z + h * t + 0.025), rr, segs=12, caps=False)
    sb.cyl(mat, False, (x, y, z + h - 0.03), (x, y, z + h), r * 0.84, segs=12)


def bucket(x, y, z, rng, r=0.17, h=0.28, mat="timber"):
    """A small open wooden bucket with two hoops."""
    sb.lathe(mat, False, (x, y, z), [(r * 0.8, 0), (r, h)], segs=10)
    for t in (0.25, 0.8):
        sb.cyl("lattice", False, (x, y, z + h * t - 0.015), (x, y, z + h * t + 0.015), r * (0.82 + 0.18 * t) + 0.008,
               segs=10, caps=False)


def sack(x, y, z, rng, s=1.0, mat="cloth_white"):
    """A tied cloth sack set down on the ground: a soft lump with a gathered neck and a tie."""
    rock(mat, x, y, z + 0.18 * s, 0.26 * s, rng, flat=0.95, collide=True)
    sb.cyl(mat, False, (x, y, z + 0.38 * s), (x + 0.02, y, z + 0.55 * s), 0.07 * s, 0.1 * s, segs=6)
    sb.cyl("rope", False, (x, y, z + 0.43 * s), (x, y, z + 0.47 * s), 0.085 * s, segs=6)


def pack_frame(x, y, z, yaw, rng, mat="timber"):
    """A pack set down on its frame: a strapped box load on four short legs (the pack frame a pack animal carries)."""
    with placed(frame(x, y, z, yaw)):
        for sx in (-0.38, 0.38):
            for sy in (-0.24, 0.24):
                post(mat, True, sx, sy, 0, 0.42, 0.06, 0.012)
        beam(mat, False, (-0.45, -0.24, 0.4), (0.45, -0.24, 0.4), 0.07, 0.07, 0.012)
        beam(mat, False, (-0.45, 0.24, 0.4), (0.45, 0.24, 0.4), 0.07, 0.07, 0.012)
        bale(0, 0, 0.44, 0.9, 0.55, 0.5, 0, "cloth_white")


def stakes(x, y, z, rng, mat="bark"):
    """Two short stakes or stumps, one slanting, and a low log lying beside them (far open ground)."""
    sb.cyl(mat, True, (x - 0.3, y, z - 0.1), (x - 0.32, y + 0.02, z + 0.7), 0.07, 0.055, segs=6)
    sb.cyl(mat, True, (x + 0.3, y, z - 0.1), (x + 0.55, y - 0.05, z + 0.55), 0.07, 0.05, segs=6)
    sb.cyl(mat, False, (x + 0.75, y - 0.1, z + 0.08), (x + 1.25, y + 0.05, z + 0.1), 0.09, 0.08, segs=6)


def bundle_pile(x, y, z, rng, mat="reed"):
    """Rounded straw-wrapped bundles stacked in three tiers (the yard pile behind the back hall)."""
    for tier, (n, zz) in enumerate(((4, 0.0), (3, 0.5), (2, 0.98))):
        for i in range(n):
            xx = x + (i - (n - 1) / 2) * 0.62 + rng.uniform(-0.05, 0.05)
            rock(mat, xx, y + rng.uniform(-0.08, 0.08), z + zz + 0.26, 0.32, rng, flat=0.85, collide=tier == 0)
            sb.cyl("rope", False, (xx - 0.33, y, z + zz + 0.26), (xx + 0.33, y, z + zz + 0.26), 0.15, segs=6, caps=False)


def far_shed(x0, x1, y, rng, h=1.7, depth=1.2, mat="reed"):
    """A tiny low shed (row of short posts under a cover) with a small signboard on a pole beside it."""
    n = max(2, round((x1 - x0) / 0.8))
    for i in range(n + 1):
        xx = x0 + (x1 - x0) * i / n
        for yy in (y, y + depth):
            post("timber", True, xx, yy, 0, h - (0.15 if yy > y else 0), 0.08, 0.012)
    sb.quad(mat, False, (x0 - 0.15, y - 0.2, h), (x1 + 0.15, y - 0.2, h), (x1 + 0.15, y + depth + 0.15, h - 0.2),
            (x0 - 0.15, y + depth + 0.15, h - 0.2), uv=[(0, 0), (x1 - x0, 0), (x1 - x0, depth), (0, depth)])
    sb.quad(mat, False, (x0 - 0.15, y + depth + 0.15, h - 0.25), (x1 + 0.15, y + depth + 0.15, h - 0.25),
            (x1 + 0.15, y - 0.2, h - 0.05), (x0 - 0.15, y - 0.2, h - 0.05))
    xp = x1 + 0.6
    post("timber", True, xp, y + 0.2, 0, 2.6, 0.07, 0.012)
    board("cloth_white", False, (xp + 0.05, y + 0.2), (xp + 0.65, y + 0.2), 0.03, 2.0, 2.45)


def open_hall(W, D, rng, eave=2.5, rise=1.2, bays=3):
    """A small hall open to the front on posts (the far house at the top of the silk): plaster side and back
    walls, a timber floor on a low plinth, and a hipped tiled roof. Local frame as house(): front along y = 0
    facing -y."""
    zt = 0.25
    soft_plinth(-0.3, W + 0.3, -0.4, D + 0.3, zt, rng)
    top = zt + eave
    for k in range(bays + 1):
        column(W * k / bays, 0, zt, top, r=0.11, mat="timber")
    for x in (0, W):
        column(x, D, zt, top, r=0.11, mat="timber")
    bx("plaster", True, (-0.06, 0.12, zt), (0.06, D - 0.12, top))
    bx("plaster", True, (W - 0.06, 0.12, zt), (W + 0.06, D - 0.12, top))
    bx("plaster", True, (0.12, D - 0.06, zt), (W - 0.12, D + 0.06, top))
    beam("timber", True, (-0.2, 0, top - 0.12), (W + 0.2, 0, top - 0.12), 0.16, 0.22, 0.03)
    bx("timber", True, (0.1, 0.1, zt), (W - 0.1, D - 0.1, zt + 0.04))  # floor boards collide (fix-gate, as house())
    hip_roof(-0.7, W + 0.7, -0.75, D + 0.7, top + 0.15, top + 0.15 + rise, lift=0.35, ns=10, nt=5, ornament_s=0.8)


def boulder(mat, x, y, z, rx, ry, rz, rng, collide=True, nu=18, nv=10, lump=0.14, sink=0.25):
    """A soft, lumpy boulder (山石): a squashed sphere with low-frequency bumps (fading to nothing at the top, so it
    stays round there), a broad, slightly flattened crown and a flattened base sunk into the ground; enough segments
    that it shades smooth. (x, y, z) is the centre of its base; it rises about rz."""
    ph = [rng.uniform(0, 6.283) for _ in range(6)]
    fr = [rng.uniform(1.5, 2.6) for _ in range(3)]
    verts = []
    for j in range(nv + 1):
        t = math.pi * j / nv                      # 0 = top
        for i in range(nu):
            a = 2 * math.pi * i / nu
            d = V((math.sin(t) * math.cos(a), math.sin(t) * math.sin(a), math.cos(t)))
            n = 1 + lump * math.sin(t) * (math.sin(fr[0] * a + ph[0]) * math.sin(fr[1] * t + ph[1])
                                          + 0.6 * math.sin(fr[2] * (a + t) + ph[2]) + 0.4 * math.cos(3.3 * a - 2.1 * t + ph[3]))
            # a broader, flatter crown; the lower half tucks in under the ground, so no base lip shows
            zz = d.z ** 1.35 * rz * n if d.z > 0 else d.z * rz * sink * 2
            verts.append(V((x + d.x * rx * n, y + d.y * ry * n, z - 0.12 * rz + zz)))
    faces = []
    for j in range(nv):
        for i in range(nu):
            a0, a1 = j * nu + i, j * nu + (i + 1) % nu
            faces.append((a0, a1, a1 + nu, a0 + nu))
    faces.append(tuple(reversed(range(nv * nu, (nv + 1) * nu))))
    add(mat, collide, verts, faces)


def earth_mound(nw, ne, se, sw, crest, rng, z_of, mat="rammed", rock_mat=None, tail=1.6, earth=0.6):
    """A mound of earth and rock (土坡山石) on a four-corner plan: soft boulders piled highest (`crest`) along its
    north edge nw-ne and smaller toward its south edge sw-se, bound by an earth bank (`earth` x crest high at the
    north edge) that falls to the ground `tail` m beyond the south edge. Corners are (x, y); z_of(x, y) gives
    the ground."""
    nu, nv = 9, 9
    P = lambda u, v: (V(nw).lerp(V(ne), u)).lerp(V(sw).lerp(V(se), u), v)  # noqa: E731
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    verts, faces = [], []
    for j in range(nv + 1):
        v = j / nv
        for i in range(nu + 1):
            u = i / nu
            p = P(u, v * (1 + tail / max(1e-6, (V(sw) - V(nw)).length)))
            side = min(u, 1 - u) * 2                          # 0 at the sides, 1 in the middle
            fall = (1 - v) ** 1.25                            # crest at the north edge, ground past the south edge
            lump = 1 + 0.12 * math.sin(3.1 * u * 6.283 / 3 + ph[0]) * math.cos(2.3 * v * 6.283 / 3 + ph[1])
            h = earth * crest * fall * min(1.0, side * 2.2) ** 0.7 * lump
            edge = i in (0, nu) or j == nv
            verts.append(V((p.x, p.y, z_of(p.x, p.y) - 0.06 + (0 if edge else max(0.0, h)))))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces.append((a, a + nu + 1, a + nu + 2, a + 1))
    # the face against the block: a short wall from the crest down to the ground, hidden behind it
    for i in range(nu):
        a, b = verts[i], verts[i + 1]
        k = len(verts)
        verts += [V((a.x, a.y + 0.02, z_of(a.x, a.y) - 0.06)), V((b.x, b.y + 0.02, z_of(b.x, b.y) - 0.06))]
        faces.append((i + 1, i, k, k + 1))
    add(mat, True, verts, faces)
    # the rocks: rows of soft boulders piled against the block, big and tall at the north edge, smaller toward
    # the south, each a little off the grid; earth fills between them (the patch above, kept lower)
    ext = 1 + tail / max(1e-6, (V(sw) - V(nw)).length)
    for row, (v, n, size) in enumerate(((0.12, 3, 1.0), (0.42, 3, 0.72), (0.72, 3, 0.5), (0.95, 3, 0.32))):
        for i in range(n):
            u = (i + 0.5) / n + rng.uniform(-0.08, 0.08)
            u = min(0.9, max(0.1, u))
            vv = v + rng.uniform(-0.05, 0.05)
            p = P(u, vv)
            bank = earth * crest * (1 - vv / ext) ** 1.25 * min(1.0, min(u, 1 - u) * 4.4) ** 0.7
            r = size * rng.uniform(0.85, 1.15)
            boulder(rock_mat or mat, p.x, p.y, z_of(p.x, p.y) + 0.45 * bank, 1.9 * r, 1.6 * r, 0.55 * crest * r, rng)
