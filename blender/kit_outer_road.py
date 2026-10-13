"""Outer-road kit: the parts S4's first area (the outer road, sections/outer_road) needs that song_kit.py and
kit_inner_city.py lack: the courier post (递铺) with its earthen wall, crossed-stake crest, studded gate, planked
ditch bank and humped little bridge; the soldiers' spears, banners and document boxes; the thatched stall and hut;
the fortune-teller's hanging boards; the stall goods at the bridgehead; the temple's guardian statues.

Generic builder functions in the song_kit manner (the lead moves them into song_kit.py afterwards): each adds faces
to street_b1's bucket set `sb.B` with (material, collide) and never opens an entity; the area builder
(blender/outer_road_scene.py) wraps every call in `with sb.entity(<map id>):`. Positions always come from the caller
(layout.json); sizes the strokes can't give are keyword defaults marked `choice:` here. Frame: x = map X (east),
y = map D (north), z up, metres. Built at real size (map/BUILDING.md rule 5): a painted size is roughly
px / 77 / 1.3 (the painter draws near things at the figures' 1.3x).

Messenger's construction rules apply as in song_kit: no plain boxes, edges with thickness, framed openings, no ruled
straight line (soft pieces, jittered members, wavy eaves), the triangles go into edges and small things. Signs
carry their painted characters from this area's atlas (gen/sections/outer_road/make_signs.mjs, material
`signs_outer_road`), its only new material. Reused from kit_inner_city: round_basket (in heaped_basket).
Review: gen/sections/outer_road/kit_review/review_kit.py.
"""
import json
import math
import random

from mathutils import Vector

import song_kit as k
import street_b1 as sb
import kit_inner_city as ki

V = Vector
UP = V((0, 0, 1))
QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SIGN_TEX = QM + r"\gen\sections\outer_road\textures\signs_outer_road.png"
SIGN_JSON = QM + r"\gen\sections\outer_road\textures\signs_outer_road.json"
# the only new material is the sign atlas: every other colour is a shared swatch (each material is one more draw
# call in a scene). Iron (blades, studs, rings, straps) is the grey of the ridge tiles; the document boxes' dark
# lacquer is `interior`; brushwood and shaggy loads are `bark` with `reed` straw; dark cloth is `bark`; dried gourds
# `bamboo`; the painted guardians `redwood` robes, `ridge` armour, `plaster` faces.
# Thin things (strands, fringes, cloth, mats) are single faces: the exported materials are double-sided (glTF
# doubleSided from Blender's default backface setting), and a back face sharing a front face's vertices would be
# dropped by mesh.validate() and shift the bucket's UVs.
IRON, DARK, BRUSH, STRAW = "ridge", "interior", "bark", "reed"
sb.MATERIALS.setdefault("signs_outer_road", (SIGN_TEX, 1, None))
_ATLAS = {}


def atlas():
    if not _ATLAS:
        with open(SIGN_JSON, encoding="utf-8") as f:
            _ATLAS.update(json.load(f))
    return _ATLAS


def cell_uv(name):
    """UVs (Blender: origin bottom-left) of a sign's atlas cell: bottom-left, bottom-right, top-right, top-left."""
    a = atlas()
    S = a["size"]
    x0, y0, x1, y1 = a["cells"][name]
    u0, u1 = x0 / S, x1 / S
    vb, vt = 1 - y1 / S, 1 - y0 / S
    return [(u0, vb), (u1, vb), (u1, vt), (u0, vt)]


def cell_aspect(name):
    """The painted board's width / height (the cell's), so a caller can size a board without distorting its text."""
    return atlas()["aspect"][name]


# ---------------------------------------------------------------- small helpers

def _p3(p, z=0.0):
    return V((p[0], p[1], p[2] if len(p) > 2 else z))


def _seg(p0, p1):
    """Plan frame of p0 -> p1: start, end (z = 0), unit direction t, its right n, length."""
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = b - a
    L = t.length
    t.normalize()
    return a, b, t, V((t.y, -t.x, 0)), L


def _wave(rng, amp, lams=(1.7, 0.63)):
    """A low-frequency wobble along a length: amp * mean of sines with random phases."""
    ph = [rng.uniform(0, 6.283) for _ in lams]
    return lambda s: amp * sum(math.sin(6.283 * s / lam + p) for lam, p in zip(lams, ph)) / len(lams)


def _loft(mat, collide, rings, rng, closed=False, cap0=True, cap1=True, uvs=None):
    """Faces between consecutive rings of equal length. Winding: rings run along a direction d; each ring is listed
    counter-clockwise in the (right-of-d, up) plane (a wall's profile from its front foot over the top to its back
    foot), or counter-clockwise seen from above when the rings stack downward (a roof from the ridge down). cap0 /
    cap1 close the first / last ring."""
    m = len(rings[0])
    verts = [V(p) for r in rings for p in r]
    faces = []
    for i in range(len(rings) - 1):
        for j in range(m if closed else m - 1):
            j2 = (j + 1) % m
            faces.append((i * m + j, (i + 1) * m + j, (i + 1) * m + j2, i * m + j2))
    if cap0:
        faces.append(tuple(range(m)))
    if cap1:
        n = len(rings)
        faces.append(tuple(reversed(range((n - 1) * m, n * m))))
    if uvs is None:
        k._add_piece(mat, collide, verts, faces, rng)
    else:
        k.add(mat, collide, verts, faces, uvs)


def _hexa(mat, collide, bottom, top, rng=None, along=None):
    """A six-faced solid from 4 bottom and 4 top corners, both counter-clockwise seen from above (a plank whose top
    follows a curve)."""
    verts = [V(p) for p in bottom] + [V(p) for p in top]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    if rng is not None:
        k._add_piece(mat, collide, verts, faces, rng, along)
    else:
        k.add(mat, collide, verts, faces)


def _frame_of(axis):
    """Two unit vectors perpendicular to `axis`, (X, Y) with X x Y = axis (counter-clockwise round it)."""
    Z = V(axis).normalized()
    X = Z.cross(UP) if abs(Z.z) < 0.95 else Z.cross(V((1, 0, 0)))
    X.normalize()
    return X, Z.cross(X).normalized(), Z


def _lathe3(mat, collide, c, X, Y, Z, prof, segs=8, cap0=True, cap1=False, uv_tile=None):
    """An elliptical lathe in any frame: prof = [(rx, ry, z)] bottom to top along Z, ellipse radii along X and Y
    (X x Y = Z). Caps: cap0 at the first ring (facing -Z), cap1 at the last (facing +Z); rx = ry = 0 makes a point.
    uv_tile: explicit UVs, u = arc length up the profile, v = round the ring (for straw hatching)."""
    c = V(c)
    verts, idx = [], []
    for rx, ry, z in prof:
        if rx <= 0 and ry <= 0:
            idx.append([len(verts)] * segs)
            verts.append(c + Z * z)
        else:
            idx.append(list(range(len(verts), len(verts) + segs)))
            verts += [c + X * (rx * math.cos(2 * math.pi * i / segs)) + Y * (ry * math.sin(2 * math.pi * i / segs)) + Z * z
                      for i in range(segs)]
    faces = []
    uvs = [] if uv_tile else None
    acc = [0.0] * segs
    for kk in range(len(idx) - 1):
        A, B = idx[kk], idx[kk + 1]
        nxt = [acc[i] + (verts[B[i]] - verts[A[i]]).length for i in range(segs)]
        for i in range(segs):
            j = (i + 1) % segs
            f = [A[i], A[j], B[j], B[i]]
            f = [q for n_, q in enumerate(f) if q not in f[:n_]]       # a point ring makes triangles
            if len(f) < 3:
                continue
            faces.append(tuple(f))
            if uv_tile:
                v0, v1 = i / segs * 2.0, (i + 1) / segs * 2.0
                full = {A[i]: (acc[i] / uv_tile, v0), A[j]: (acc[j] / uv_tile, v1), B[j]: (nxt[j] / uv_tile, v1),
                        B[i]: (nxt[i] / uv_tile, v0)}
                uvs.append([full[q] for q in f])
        acc = nxt
    if cap0 and len(set(idx[0])) > 2:
        faces.append(tuple(reversed(idx[0])))
        if uv_tile:
            uvs.append([(0.0, 0.0)] * segs)
    if cap1 and len(set(idx[-1])) > 2:
        faces.append(tuple(idx[-1]))
        if uv_tile:
            uvs.append([(0.0, 0.0)] * segs)
    k.add(mat, collide, verts, faces, uvs)


def _bar(mat, collide, p0, p1, side, w, h):
    """A plain rectangular member from p0 to p1 (no chamfer) whose `w` runs along `side` (made square to the axis)
    and `h` across both: k.beam's section turns with the world, this one with the caller's frame."""
    p0, p1 = V(p0), V(p1)
    d = (p1 - p0).normalized()
    sd = V(side) - d * V(side).dot(d)
    sd.normalize()
    up = d.cross(sd)
    ring = [sd * (w / 2) + up * (h / 2), -sd * (w / 2) + up * (h / 2), -sd * (w / 2) - up * (h / 2), sd * (w / 2) - up * (h / 2)]
    verts = [p0 + o for o in ring] + [p1 + o for o in ring]
    faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)] + [(3, 2, 1, 0), (4, 5, 6, 7)]
    k.add(mat, collide, verts, faces)


def _dome(mat, c, axis, r, h, segs=6):
    """A low round boss (a door stud, a knob): a dome from a ring of radius r on c up to h along axis."""
    X, Y, Z = _frame_of(axis)
    _lathe3(mat, False, c, X, Y, Z, [(r, r, 0), (r * 0.72, r * 0.72, h * 0.6), (0, 0, h)], segs=segs, cap0=False)


def _slab_poly(mat, collide, pts, nrm, thick):
    """A flat plate cut to a planar outline `pts` (3D, any winding), `thick` across it, its front facing `nrm`."""
    P = [V(p) for p in pts]
    n = len(P)
    nv = V((0, 0, 0))
    for i in range(n):
        a, b = P[i], P[(i + 1) % n]
        nv += V(((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)))
    nrm = V(nrm).normalized()
    if nv.dot(nrm) < 0:
        P.reverse()
    front = [p + nrm * (thick / 2) for p in P]
    back = [p - nrm * (thick / 2) for p in P]
    verts = front + back
    faces = [tuple(range(n)), tuple(reversed(range(n, 2 * n)))]
    faces += [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    k.add(mat, collide, verts, faces)


def _spike(mat, a, b, w, tip):
    """A square stake from a to b (w across, no chamfer) ending in a pyramid point `tip` long beyond b."""
    a, b = V(a), V(b)
    d = (b - a).normalized()
    X, Y, _ = _frame_of(d)
    h = w / 2
    sq = [X * h + Y * h, -X * h + Y * h, -X * h - Y * h, X * h - Y * h]
    verts = [a + o for o in sq] + [b + o for o in sq] + [b + d * tip]
    faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
    faces += [(4 + i, 4 + (i + 1) % 4, 8) for i in range(4)]
    faces.append((3, 2, 1, 0))
    k.add(mat, False, verts, faces)


def _ring(mat, c, axis, R, r, segs=8, sides=3):
    """A small torus (a ring pull, a loop): radius R round axis, tube radius r."""
    X, Y, Z = _frame_of(axis)
    pts = [V(c) + (X * math.cos(2 * math.pi * i / segs) + Y * math.sin(2 * math.pi * i / segs)) * R for i in range(segs + 1)]
    sb.tube(mat, False, pts, [r] * (segs + 1), segs=sides)


# ---------------------------------------------------------------- 1-3. the courier post's wall, crest and gateway

def earth_wall(p0, p1, z0, h, thick, rng, mat="plaster", foot_mat="rammed", foot=0.3, step=0.45, top=None):
    """The courier post's plain earthen wall along plan p0 -> p1, its face toward the right of p0 -> p1: a soft body
    lofted through cross-sections every `step` m, each with its own top height (+-5 cm), face bulge and a slumped,
    rounded top (no straight edge anywhere); battered 3.5 cm a side; rounded, lower ends; on a low footing of
    `foot_mat` a few cm proud of the body. Collides. h: top above z0; thick: at the foot of the body. top: an
    optional f(x, y) -> z for the top instead (a wall that rises to meet a roof's underside; no lowered ends).
    choice: foot 0.3 m tall, 6 cm proud (nothing is drawn at the foot, which the soldiers hide)."""
    a, b, t, n, L = _seg(p0, p1)
    top_w, bul_f, bul_b, slump = _wave(rng, 0.05), _wave(rng, 0.025), _wave(rng, 0.025), _wave(rng, 0.03, (0.9, 0.37))
    foot_f, foot_b = _wave(rng, 0.015), _wave(rng, 0.015)
    if L < 0.7:
        ss = [0.0, L / 2, L]
    else:
        mm = max(1, round((L - 0.36) / step))
        ss = [0.0, 0.06] + [0.18 + (L - 0.36) * i / mm for i in range(mm + 1)] + [L - 0.06, L]
    half = thick / 2
    fh = min(foot, h * 0.25)
    body, base = [], []
    for s in ss:
        d = min(s, L - s)
        f = 0.72 + 0.28 * min(1.0, d / 0.18) ** 0.5          # the rounded ends
        P = a + t * s
        zb = z0 + fh - 0.03 if fh > 0 else z0
        hb = half * (0.85 + 0.15 * f)
        if top is None:
            zt = z0 + h + top_w(s) - (1 - f) * 0.3
        else:
            q = P + n * hb
            zt = top(q.x, q.y) + top_w(s) * 0.2
        ht = hb - 0.035
        rt = min(0.1, thick * 0.28)
        zm = zb + (zt - zb) * 0.45
        fb, bb = bul_f(s), bul_b(s)
        cr = 0.015 + slump(s)
        prof = [(hb, zb), (hb + 0.012 + fb, zm), (ht + fb * 0.5, zt - rt), (ht * 0.55, zt - rt * 0.15 + cr * 0.5),
                (0.0, zt + cr), (-ht * 0.55, zt - rt * 0.15 + cr * 0.4), (-ht - bb * 0.5, zt - rt),
                (-hb - 0.012 - bb, zm), (-hb, zb)]
        body.append([P + n * o + UP * z for o, z in prof])
        if fh <= 0:
            continue
        hf = (half + 0.06) * (0.85 + 0.15 * f)
        fp = [(hf, z0 - 0.08), (hf + foot_f(s), z0 + fh * 0.55), (hf - 0.045, z0 + fh), (-hf + 0.045, z0 + fh),
              (-hf - foot_b(s), z0 + fh * 0.55), (-hf, z0 - 0.08)]
        base.append([P + n * o + UP * z for o, z in fp])
    _loft(mat, True, body, rng)
    if base:
        _loft(foot_mat, True, base, rng)


def stake_crest(p0, p1, z, h, rng, spacing=0.26, mat="timber", w=0.035):
    """The row of crossed (X-shaped) stakes along a wall top from p0 to p1, set in at height z, about h tall: each
    pair crosses about a third of the way up and is lashed there; every pair leans, stands and spreads a little
    differently, so the crest never reads as a ruled fence. choice: stakes 3.5 cm square, spread about 0.6 h."""
    a, b, t, n, L = _seg(p0, p1)
    m = max(1, round(L / spacing))
    for i in range(m):
        s = L * (i + 0.5) / m + rng.uniform(-0.025, 0.025)
        c = a + t * s + n * rng.uniform(-0.015, 0.015)
        hh = h * rng.uniform(0.85, 1.12)
        spread = hh * rng.uniform(0.5, 0.7)
        xz = 0.32 + rng.uniform(-0.05, 0.05)            # the crossing, as a fraction of the height
        tilt = n * rng.uniform(-0.04, 0.04)
        zb = z - 0.06
        for sgn in (1, -1):
            lo = c - t * (sgn * spread * xz) + UP * zb
            hi = c + t * (sgn * spread * (1 - xz)) + tilt + UP * (z + hh * rng.uniform(0.93, 1.0) - 0.07)
            _spike(mat, lo, hi, w * rng.uniform(0.9, 1.1), 0.07)
        x = c + UP * (zb + (z + hh - 0.07 - zb) * xz) + tilt * xz
        sb.cyl("rope", False, x - n * 0.03, x + n * 0.03, w * 0.95, segs=5, caps=False)


def gate_frame(p0, p1, z_lintel, rng, jamb=0.16, threshold=True, mat="redwood"):
    """A gateway's frame between plan points p0 and p1 (the two jambs' centres): chamfered jambs from the ground up
    into a lintel that runs past them, an upper pivot rail (连楹) behind the lintel for the leaves' top pivots, and
    a soft stone threshold with pivot stones (门枕石) inside the jambs. Jambs collide; the threshold doesn't (a
    walker's capsule can't step over 12 cm, so it stands in the sill). Outer side = right of p0 -> p1.
    choice: lintel 0.2 x 0.22 m, 0.3 m past the jambs; threshold 0.12 m high, 0.36 m deep."""
    a, b, t, n, L = _seg(p0, p1)
    for p in (a, b):
        hw, hd, c = jamb / 2, jamb * 0.65, 0.025
        ring = [(hw - c, -hd), (hw, -hd + c), (hw, hd - c), (hw - c, hd), (-hw + c, hd), (-hw, hd - c), (-hw, -hd + c),
                (-hw + c, -hd)]
        pts = [p + t * x + n * y for x, y in ring]           # t, n: counter-clockwise from above when t x n = -z
        if t.cross(n).z < 0:
            pts.reverse()
        k.prism(mat, True, [q - UP * 0.05 for q in pts], [q + UP * (z_lintel + 0.16) for q in pts])
    k.beam(mat, False, a - t * 0.3 + UP * (z_lintel + 0.11), b + t * 0.3 + UP * (z_lintel + 0.11), 0.2, 0.22, 0.03)
    k.beam("timber", False, a - n * 0.17 + UP * (z_lintel + 0.03), b - n * 0.17 + UP * (z_lintel + 0.03), 0.1, 0.12, 0.02)
    if threshold:
        e = jamb / 2 + 0.01
        pa, pb = a + t * e, b - t * e
        ring = [pa + n * 0.18, pb + n * 0.18, pb - n * 0.18, pa - n * 0.18]
        if (ring[1] - ring[0]).cross(ring[2] - ring[1]).z < 0:
            ring.reverse()
        k.soft_slab("stone", False, [(p.x, p.y) for p in ring], -0.05, 0.12, rng, r=0.04, wob=0.006, ease=0.02)
        for p, s in ((a, 1), (b, -1)):
            q = p - n * 0.3 + t * s * 0.06
            k.soft_slab("stone", False, [(q.x + dx, q.y + dy) for dx, dy in
                                         ((-0.13, -0.13), (0.13, -0.13), (0.13, 0.13), (-0.13, 0.13))],
                        -0.04, 0.17, rng, r=0.035, wob=0.006, ease=0.02)


# ---------------------------------------------------------------- 4. the studded leaf

def studded_leaf(hinge, free, z0, z1, swing_deg, rng, rows=6, cols=4, ring=True, notice=None, collide=True,
                 mat="redwood", ring_at=0.85, notice_w=0.62, outer=None):
    """One door leaf of vertical boards with rows of round studs (the heads of the nails that fix the battens behind
    them, so each row has a batten), hinged at plan point `hinge` on a round pivot stile, its free edge at `free`
    when shut, swung inward by `swing_deg` (to the left of hinge -> free). ring: a round plate with a hanging ring
    pull near the free edge at `ring_at` of the height (painted high, beside the notice). notice: an atlas sign name
    pasted as a paper sheet high on its face, toward the hinge, its lower corner lifting. outer: a plan vector
    toward the street side, for a leaf whose hinge -> free runs the other way (a gate's second leaf): its studded face
    turns to `outer` and it swings away from it.
    choice: boards 6 cm thick about 0.2 m wide; studs 3 cm; notice 0.62 of the leaf's width (painted 42 of 60 px)."""
    H = z1 - z0
    h = V((hinge[0], hinge[1], 0))
    f = V((free[0], free[1], 0))
    t = (f - h)
    W = t.length
    t.normalize()
    nr = V((t.y, -t.x, 0))
    sgn = -1.0 if outer is not None and nr.dot(V((outer[0], outer[1], 0))) < 0 else 1.0
    nr = nr * sgn
    ang = math.radians(swing_deg)
    d = t * math.cos(ang) - nr * math.sin(ang)          # along the leaf, hinge -> free edge
    nl = V((d.y, -d.x, 0)) * sgn                        # the leaf's outer face
    m = max(3, round(W / 0.2))
    for i in range(m):
        pa = h + d * (W * i / m + (0.004 if i else 0.03))
        pb = h + d * (W * (i + 1) / m - 0.004)
        k.board(mat, collide, (pa.x, pa.y), (pb.x, pb.y), 0.06, z0 + 0.01, z1 - rng.uniform(0.0, 0.012))
    sb.cyl("timber", False, h + d * 0.035 - UP * 0.04 + UP * z0, h + d * 0.035 + UP * (z1 + 0.06), 0.045, segs=6)
    # the notice's place decides where the studs stop
    zn_top = z1 - 0.07 * H
    if notice:
        nw = W * notice_w
        nh = nw / cell_aspect(notice)
        zn_bot = zn_top - nh
    else:
        zn_bot = z1 - 0.1 * H
    zs = [z0 + 0.1 * H + (zn_bot - 0.08 - z0 - 0.1 * H) * r / max(1, rows - 1) for r in range(rows)]
    for zz in zs:
        k.beam("timber", False, h + d * 0.06 - nl * 0.055 + UP * zz, h + d * (W - 0.04) - nl * 0.055 + UP * zz,
               0.05, 0.09, 0.012)
        for c in range(cols):
            p = h + d * (W * (0.16 + 0.68 * c / max(1, cols - 1))) + nl * 0.03 + UP * (zz + rng.uniform(-0.006, 0.006))
            _dome(IRON, p, nl, 0.03, 0.025)
    if notice:
        uv = cell_uv(notice)
        xc = W * (0.08 + notice_w / 2)
        pa, pb = h + d * (xc - nw / 2) + nl * 0.034, h + d * (xc + nw / 2) + nl * 0.034
        zc = zn_bot + nh * 0.22                                   # the lower 22% lifts off the board
        lift = nl * 0.018
        vm = uv[0][1] + (uv[2][1] - uv[0][1]) * 0.22
        sb.quad("signs_outer_road", False, pa + UP * zc, pb + UP * zc, pb + UP * zn_top, pa + UP * zn_top,
                uv=[(uv[0][0], vm), (uv[1][0], vm), uv[2], uv[3]])
        sb.quad("signs_outer_road", False, pa + UP * zn_bot + lift, pb + UP * zn_bot + lift * 0.4, pb + UP * zc, pa + UP * zc,
                uv=[uv[0], uv[1], (uv[1][0], vm), (uv[0][0], vm)])
    if ring:
        p = h + d * (W * 0.86) + nl * 0.03 + UP * (z0 + ring_at * H)
        _dome(IRON, p, nl, 0.06, 0.03, segs=8)
        _ring(IRON, p + nl * 0.035 - UP * 0.07, nl, 0.065, 0.008, segs=8, sides=3)


# ---------------------------------------------------------------- 5-6. the ditch bank and the little bridge

def planked_bank(pts, z_top, depth, rng, face=1, stake_every=1.5, mat="deck"):
    """A ditch bank along the plan polyline `pts`, faced with horizontal planks from z_top down to z_top - depth,
    held by small capped stakes in front of them; behind the planks an earth backing (it collides, so the bank is a
    wall from the ditch). face = +1: the planks face the right of the polyline's direction (the ditch side), -1 the
    left. Planks are separate pieces of their own lengths with staggered butt joints, each a little bowed and set, so
    no course is a ruled line. choice: planks 12-17 cm wide, 4 cm thick, 1.1-2.4 m long; stakes 9 cm round."""
    P = [V((p[0], p[1], 0)) for p in pts]
    zb = z_top - depth
    # the backing strip along the whole polyline
    nrm = []
    for i, p in enumerate(P):
        ds = []
        if i > 0:
            ds.append((p - P[i - 1]).normalized())
        if i < len(P) - 1:
            ds.append((P[i + 1] - p).normalized())
        tt = sum(ds, V((0, 0, 0))).normalized()
        nrm.append(V((tt.y, -tt.x, 0)) * face)
    for i in range(len(P) - 1):
        a, b = P[i] - nrm[i] * 0.01, P[i + 1] - nrm[i + 1] * 0.01
        quad = [a + UP * (zb - 0.1), b + UP * (zb - 0.1), b + UP * (z_top + 0.02), a + UP * (z_top + 0.02)]
        if face < 0:
            quad = [quad[1], quad[0], quad[3], quad[2]]
        sb.quad("rammed", True, *quad)
    # plank courses
    z = z_top
    while z > zb + 0.04:
        ph = min(rng.uniform(0.12, 0.17), z - zb + 0.02)
        zc = z - ph / 2
        for i in range(len(P) - 1):
            a, b = P[i], P[i + 1]
            L = (b - a).length
            t = (b - a) / L
            n = V((t.y, -t.x, 0)) * face
            s = -rng.uniform(0.0, 0.6) if i == 0 else 0.0
            while s < L - 0.05:
                ln = min(rng.uniform(1.1, 2.4), L - s + (0.03 if i == len(P) - 2 else 0.0))
                pa, pb = a + t * (max(0.0, s) + 0.006), a + t * (s + ln - 0.006)
                o = n * (0.03 + rng.uniform(-0.006, 0.006))
                k.beam(mat, False, pa + o + UP * (zc + rng.uniform(-0.012, 0.012)),
                       pb + o + UP * (zc + rng.uniform(-0.012, 0.012)), 0.04, ph - 0.014, 0.008)
                s += ln
        z -= ph
    # small capped stakes
    acc = rng.uniform(0.2, 0.6) * stake_every
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        L = (b - a).length
        t = (b - a) / L
        n = V((t.y, -t.x, 0)) * face
        s = acc
        while s < L:
            p = a + t * s + n * 0.075
            zt = z_top + 0.05 + rng.uniform(-0.02, 0.03)
            sb.cyl("timber", False, p + UP * (zb - 0.15), p + UP * zt, 0.045, 0.04, segs=6, caps=False)
            sb.lathe("timber", False, p + UP * zt, [(0.065, 0), (0.068, 0.025), (0.04, 0.045), (0.0, 0.05)], segs=6)
            s += stake_every * rng.uniform(0.85, 1.15)
        acc = s - L


def humped_bridge(sw, se, ne, nw, rise, rng, front=0.45, ramp_w=0.4, ramp_len=0.9, brush=True, thick=0.07):
    """The little humped crossing over the ditch in front of the courier gate (S4.str.small_bridge_11800). Corners
    are 3D (x, y, z) or plan points (z = 0): the south edge sw-se at the road, the north edge nw-ne on the forecourt;
    `rise` is the hump above the straight line from the deck's front to the north edge. As painted: the south (viewer)
    face is a planked face standing `front` above the road, two corner posts and one diagonal brace in front of the
    planks, a cap beam on top; from it a plank deck laid across, arched north-south on two log stringers, runs over
    the ditch (open beneath at the sides, where the ditch passes) to the forecourt; rough brushwood and turf heaped
    on top (a low mound, straw tufts, short twigs), the plank ends bare; at the south-west foot an earth-and-turf slope
    `ramp_w` of the width and `ramp_len` deep comes down to the road ("sloping down to the road at its south-west
    foot"). The hidden collider is a solid under the deck top with the slope as its only way up from the road: the
    rest of the planked face is a wall. front=0: a plain humped deck starting at the road (no face, no slope).
    choice: front 0.45 m (the painted face, ~50 px); planks 0.24 m wide, 7 cm thick; stringers 15 cm logs."""
    SW, SE, NE, NW = (_p3(p) for p in (sw, se, ne, nw))

    def P(u, v):
        return SW.lerp(SE, u).lerp(NW.lerp(NE, u), v)

    def Z(u, v):
        v = min(1.0, max(0.0, v))
        zs = SW.z + (SE.z - SW.z) * u + front
        zn = NW.z + (NE.z - NW.z) * u
        return zs + (zn - zs) * v + rise * math.sin(math.pi * v)

    def Q(u, v, dz=0.0):
        p = P(u, v)
        return V((p.x, p.y, Z(u, v) + dz))

    depth = ((NW + NE) / 2 - (SW + SE) / 2).to_2d().length
    width = ((SE + NE) / 2 - (SW + NW) / 2).to_2d().length
    east = ((SE + NE) / 2 - (SW + NW) / 2)
    east.z = 0
    east.normalize()
    north = V((-east.y, east.x, 0))
    south = -north
    # deck planks across, each following the hump
    nv = max(6, round(depth / 0.24))
    gv = 0.006 / max(depth, 0.1)
    for i in range(nv):
        v0, v1 = i / nv + gv, (i + 1) / nv - gv
        ua, ub = -0.04 + rng.uniform(-0.02, 0.015), 1.04 + rng.uniform(-0.015, 0.02)
        dz = rng.uniform(-0.008, 0.008)
        top = [Q(ua, v0, dz), Q(ub, v0, dz + rng.uniform(-0.01, 0.01)), Q(ub, v1, dz), Q(ua, v1, dz)]
        _hexa("deck", False, [p - UP * thick for p in top], top, rng, along=(east.x, east.y))
    # stringers
    for u in (0.1, 0.9):
        pts = [Q(u, v, -thick - 0.075) for v in (0.0, 0.15, 0.32, 0.5, 0.68, 0.85, 1.0)]
        sb.tube("timber", False, pts, [0.075, 0.078, 0.075, 0.074, 0.076, 0.075, 0.073], segs=6)
    zr = lambda u: SW.z + (SE.z - SW.z) * u                       # noqa: E731  the road at the south edge
    if front > 0.05:
        # the planked south face, its cap beam, corner posts and the diagonal brace
        qa, qb = P(0.0, 0.0), P(1.0, 0.0)
        qa.z = qb.z = 0.0
        top_a, top_b = Z(0.0, 0.0) - thick - 0.15, Z(1.0, 0.0) - thick - 0.15
        sb.quad("rammed", False, qa + north * 0.02 + UP * (zr(0) - 0.1), qb + north * 0.02 + UP * (zr(1) - 0.1),
                qb + north * 0.02 + UP * (top_b + 0.1), qa + north * 0.02 + UP * (top_a + 0.1))
        z = min(zr(0), zr(1)) - 0.06
        while z < max(top_a, top_b) - 0.03:
            ph = rng.uniform(0.13, 0.17)
            zc = z + ph / 2
            ua_, ub_ = 0.02, 0.98
            if zc + ph / 2 > top_a:
                ua_ = 0.02 + 0.96 * min(1.0, max(0.0, (zc + ph / 2 - top_a) / max(1e-6, top_b - top_a))) if top_b > top_a else ua_
            if zc + ph / 2 > top_b and top_a > top_b:
                ub_ = 0.98 - 0.96 * min(1.0, (zc + ph / 2 - top_b) / max(1e-6, top_a - top_b))
            if ub_ - ua_ > 0.05:
                k.beam("deck", False, qa.lerp(qb, ua_) + south * 0.02 + UP * (zc + rng.uniform(-0.01, 0.01)),
                       qa.lerp(qb, ub_) + south * 0.02 + UP * (zc + rng.uniform(-0.01, 0.01)), 0.04, ph - 0.014, 0.008)
            z += ph
        k.beam("timber", False, qa.lerp(qb, -0.03) + UP * (top_a + 0.06), qa.lerp(qb, 1.03) + UP * (top_b + 0.06), 0.14, 0.12, 0.02)
        for u in (0.02, 0.98):
            p = qa.lerp(qb, u) + south * 0.06
            sb.cyl("timber", False, p + UP * (zr(u) - 0.15), p + UP * (Z(u, 0.0) - thick - 0.02), 0.055, 0.05, segs=6)
        u0, u1 = ramp_w * 0.3, 0.92
        k.beam("timber", False, qa.lerp(qb, u0) + south * 0.075 + UP * (zr(u0) + 0.06),
               qa.lerp(qb, u1) + south * 0.075 + UP * (top_a + (top_b - top_a) * u1 - 0.02), 0.07, 0.09, 0.012)
        # the earth-and-turf slope at the south-west foot
        nl_, na_ = 6, 7
        vf = -ramp_len / max(depth, 0.1)

        def slope_h(u, t):
            e = min(1.0, max(0.0, (ramp_w - u) / (ramp_w * 0.45)), max(0.0, (u + 0.06) / 0.08))
            return front * (t ** 1.3) * (e ** 0.7)
        grid = []
        for j in range(nl_ + 1):
            t = j / nl_
            row = []
            for i in range(na_ + 1):
                u = -0.06 + (ramp_w + 0.04) * i / na_
                p = P(u, vf * (1 - t) - 0.01)
                bump = 0.0 if i in (0, na_) or j == 0 else rng.uniform(-0.025, 0.025)
                row.append(V((p.x, p.y, zr(min(1.0, max(0.0, u))) - 0.04 + slope_h(u, t) + bump)))
            grid.append(row)
        verts = [p for row in grid for p in row]
        faces = [(j * (na_ + 1) + i, j * (na_ + 1) + i + 1, (j + 1) * (na_ + 1) + i + 1, (j + 1) * (na_ + 1) + i)
                 for j in range(nl_) for i in range(na_)]
        k._add_piece("rammed", False, verts, faces, rng)
        for _ in range(5):
            u, t = rng.uniform(0.0, ramp_w * 0.8), rng.uniform(0.25, 1.0)
            p = P(u, vf * (1 - t))
            k.rock(BRUSH if rng.random() < 0.6 else STRAW, p.x, p.y, zr(u) - 0.02 + slope_h(u, t), rng.uniform(0.08, 0.14), rng, flat=0.5)
        # its collider: a wedge from the road up to the deck's front over the slope's full-height part
        ua_, ub_ = -0.04, ramp_w * 0.8
        f0, f1 = P(ua_, vf), P(ub_, vf)
        f0.z, f1.z = zr(0.0) - 0.02, zr(ub_) - 0.02
        t0, t1 = Q(ua_, 0.0), Q(ub_, 0.0)
        b0, b1 = V((t0.x, t0.y, f0.z - 0.1)), V((t1.x, t1.y, f1.z - 0.1))
        k.add("hidden", True, [f0, f1, t1, t0, b1, b0], [(0, 1, 2, 3), (3, 2, 4, 5), (0, 3, 5), (1, 4, 2), (0, 5, 4, 1)])
    else:
        s0, s1 = Q(-0.07, 0.0, -thick - 0.16), Q(1.07, 0.0, -thick - 0.16)
        sb.tube("bark", False, [s0, s0.lerp(s1, 0.5) + UP * 0.01, s1], [0.075, 0.085, 0.075], segs=6)
    # brushwood and turf heaped on top: a low rough mound over the middle of the deck (the plank ends stay bare),
    # tufts of straw and brushwood on it, short twigs sticking out
    if brush:
        ph = [rng.uniform(0, 6.283) for _ in range(3)]

        def mound(u, v):
            e = min(1.0, min(u - 0.1, 0.9 - u) / 0.14, min(v - 0.04, 0.97 - v) / 0.12)
            if e <= 0:
                return 0.0
            hgt = 0.13 + 0.06 * math.sin(7.0 * u + ph[0]) * math.cos(5.0 * v + ph[1]) + 0.035 * math.sin(13 * u + 11 * v + ph[2])
            return hgt * (e ** 0.6)

        nu_, nv_ = 8, 10
        grid = [[Q(0.1 + 0.8 * i / nu_, 0.04 + 0.93 * j / nv_, mound(0.1 + 0.8 * i / nu_, 0.04 + 0.93 * j / nv_) - 0.01)
                 for i in range(nu_ + 1)] for j in range(nv_ + 1)]
        verts = [p for row in grid for p in row]
        faces = [(j * (nu_ + 1) + i, j * (nu_ + 1) + i + 1, (j + 1) * (nu_ + 1) + i + 1, (j + 1) * (nu_ + 1) + i)
                 for j in range(nv_) for i in range(nu_)]
        k.add(BRUSH, False, verts, faces)
        area = depth * width
        for _ in range(int(area * 2.6)):
            u, v = rng.uniform(0.18, 0.82), rng.uniform(0.1, 0.9)
            p = Q(u, v, mound(u, v) + 0.01)
            k.rock(STRAW if rng.random() < 0.7 else BRUSH, p.x, p.y, p.z, rng.uniform(0.08, 0.13), rng, flat=0.85)
        for _ in range(int(area * 10)):
            u, v = rng.uniform(0.12, 0.88), rng.uniform(0.06, 0.95)
            p = Q(u, v, mound(u, v) - 0.02)
            a = rng.uniform(0, 6.283)
            dvec = V((math.cos(a), math.sin(a), rng.uniform(0.1, 0.7))).normalized()
            k.beam("timber", False, p, p + dvec * rng.uniform(0.12, 0.3), 0.012, 0.012, 0)
    # the walkable collider: a closed solid under the deck top (its south end the planked face's wall)
    zlow = min(SW.z, SE.z, NE.z, NW.z) - 0.35
    rings = []
    for j in range(13):
        v = j / 12
        rings.append([P(1.0, v).to_2d().to_3d() + UP * zlow, Q(1.0, v), Q(0.5, v), Q(0.0, v),
                      P(0.0, v).to_2d().to_3d() + UP * zlow])
    _loft("hidden", True, rings, rng, closed=True)


# ---------------------------------------------------------------- 7-9. spears and banners

def spear(foot, top, rng, blade=0.32, tassel=None, shaft_mat="timber"):
    """A long spear from foot to top (3D points): a slightly tapered shaft, an iron socket and a narrow leaf blade
    (diamond section) at the top; tassel = fraction along the shaft from the foot for a knotted red tassel with a
    loop and three hanging strands. choice: shaft 3.6 cm thick."""
    F, T = V(foot), V(top)
    ax = (T - F).normalized()
    b0 = T - ax * blade
    sb.cyl(shaft_mat, False, F, b0 - ax * 0.05, 0.018, 0.016, segs=6)
    sb.cyl(IRON, False, b0 - ax * 0.08, b0 + ax * 0.02, 0.019, 0.013, segs=6)
    s1 = ax.cross(UP)
    s1 = s1.normalized() if s1.length > 1e-4 else V((1, 0, 0))
    s2 = ax.cross(s1).normalized()
    q1 = b0 + ax * blade * 0.3
    r0 = [b0 + s1 * 0.011, b0 + s2 * 0.007, b0 - s1 * 0.011, b0 - s2 * 0.007]
    r1 = [q1 + s1 * 0.03, q1 + s2 * 0.009, q1 - s1 * 0.03, q1 - s2 * 0.009]
    verts = r0 + r1 + [T]
    faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
    faces += [(4 + i, 4 + (i + 1) % 4, 8) for i in range(4)] + [(3, 2, 1, 0)]
    k.add(IRON, False, verts, faces)          # s1 x s2 = ax: the rings run counter-clockwise round the shaft
    if tassel is not None:
        m = F.lerp(T, tassel)
        k.rock("cloth_red", m.x, m.y, m.z, 0.032, rng, flat=1.0)
        _ring("cloth_red", m - UP * 0.055, s1, 0.04, 0.008, segs=7, sides=3)
        for i in range(3):
            a = 2.1 * i + rng.uniform(-0.3, 0.3)
            o = V((math.cos(a), math.sin(a), 0)) * 0.012
            ln = rng.uniform(0.16, 0.26)
            sb.tube("cloth_red", False, [m + o, m + o * 1.6 - UP * ln * 0.5, m + o * 2.0 - UP * ln], [0.011, 0.009, 0.004], segs=3)


def bamboo_banner(foot, top, rng, cloth_from=0.62, cloth_len=1.4, mat="cloth_indigo", r=0.03, cloth_r=0.17):
    """A bamboo pole from foot to top (3D) with node rings every ~0.33 m, and a dark cloth banner hanging furled
    from its upper part (its top tied at `cloth_from` of the pole from the foot): a long, narrow, pleated roll,
    narrow at the tie and flaring to `cloth_r` at its ragged lower edge, hanging plumb (the pole runs inside it
    where they overlap). choice: pole 6 cm thick; cloth flaring to 0.34 m (painted 43 px)."""
    F, T = V(foot), V(top)
    L = (T - F).length
    ax = (T - F) / L
    nn = max(2, round(L / 0.33))
    for i in range(nn):
        a, b = F.lerp(T, i / nn), F.lerp(T, (i + 1) / nn)
        ra, rb = r * (1 - 0.25 * i / nn), r * (1 - 0.25 * (i + 1) / nn)
        sb.cyl("bamboo", True if i < 3 else False, a, b, ra, rb, segs=6, caps=(i == 0 or i == nn - 1))
        if i:
            sb.cyl("bamboo", False, a - ax * 0.012, a + ax * 0.012, ra * 1.18, segs=6, caps=False)
    tie = F.lerp(T, cloth_from)
    low_pole = F.lerp(T, max(0.0, cloth_from - cloth_len / L))
    bottom = low_pole.lerp(tie - UP * cloth_len, 0.5)
    axis = (tie - bottom).normalized()
    X, Y, Z = _frame_of(axis)
    segs = 10
    rings = []
    for kk, f in enumerate((0.0, 0.25, 0.5, 0.75, 1.0)):
        c = bottom.lerp(tie, f)
        rr = cloth_r * (1 - f) ** 0.85 + 0.035 * f
        sway = (X * rng.uniform(-0.02, 0.02) + Y * rng.uniform(-0.02, 0.02)) * (1 - f)
        ring = []
        for i in range(segs):
            ang = 2 * math.pi * i / segs
            rad = rr * (1.0 if i % 2 == 0 else 0.72)
            dz = rng.uniform(-0.05, 0.03) if kk == 0 else 0.0
            ring.append(c + sway + X * (math.cos(ang) * rad) + Y * (math.sin(ang) * rad) + Z * dz)
        rings.append(ring)
    _loft(mat, False, list(reversed(rings)), rng, closed=True)
    sb.cyl("rope", False, tie - axis * 0.06, tie + axis * 0.0, 0.045, segs=6, caps=False)


def striped_banner(foot, h, arm_dir, rng, cloth_w=0.9, cloth_h=1.9, stripes=7, light="cloth_white", dark=BRUSH,
                   arm_rise=25.0, bar_drop=0.7):
    """The striped banner on its pole frame (S4.prop.banner_frame_11895): a tall round pole with a round cap, a
    crossbar through it `bar_drop` below the cap, slanting up outward along plan vector `arm_dir` by `arm_rise`
    degrees, its short stub behind the pole ending in a knob and braced down to the pole by a strut (as painted),
    and from the bar a long cloth of `stripes` alternating light and dark vertical stripes, pleated (each stripe a
    little in or out), its top following the bar, its lower edge uneven, tied to the bar at three points.
    choice: pole 13 cm; bar rising 25 deg; strut meeting the pole 0.9 m below the bar (painted)."""
    Fo = _p3(foot)
    o = V((arm_dir[0], arm_dir[1], 0)).normalized()
    cn = V((o.y, -o.x, 0))
    top = Fo + UP * h
    sb.cyl("timber", True, Fo - UP * 0.15, top, 0.065, 0.055, segs=8)
    sb.lathe("timber", False, top - UP * 0.01, [(0.05, 0), (0.14, 0.02), (0.14, 0.06), (0.1, 0.08), (0.0, 0.085)], segs=10)
    zb = h - bar_drop
    tn = math.tan(math.radians(arm_rise))
    L = cloth_w + 0.45
    stub = Fo + UP * (zb - 0.3 * tn) - o * 0.3
    outer = Fo + UP * (zb + L * tn) + o * L
    sb.cyl("timber", False, stub, outer, 0.035, 0.03, segs=6)
    sb.lathe("timber", False, stub - o * 0.02 - UP * 0.05, [(0.02, 0), (0.05, 0.03), (0.045, 0.07), (0.0, 0.1)], segs=6)
    k.beam("timber", False, stub - UP * 0.02, Fo + UP * (zb - 0.9), 0.045, 0.045, 0.008)
    # the cloth
    a0 = 0.28
    bot_wave = _wave(rng, 0.04, (0.5,))
    for i in range(stripes):
        s0, s1 = a0 + cloth_w * i / stripes, a0 + cloth_w * (i + 1) / stripes
        off = cn * (0.012 if i % 2 else -0.012)
        ta = Fo + o * s0 + UP * (zb + s0 * tn - 0.04) + off
        tb = Fo + o * s1 + UP * (zb + s1 * tn - 0.04) + off
        ba = ta - UP * (cloth_h + bot_wave(s0) + rng.uniform(-0.015, 0.015))
        bb = tb - UP * (cloth_h + bot_wave(s1) + rng.uniform(-0.015, 0.015))
        sb.quad(dark if i % 2 else light, False, ba, bb, tb, ta)
    for f in (0.05, 0.5, 0.95):
        s = a0 + cloth_w * f
        p = Fo + o * s + UP * (zb + s * tn)
        sb.cyl("rope", False, p - o * 0.03, p + o * 0.03, 0.045, segs=5, caps=False)


# ---------------------------------------------------------------- 10-11. boxes

def document_box(x, y, z, l, w, h, yaw_deg, rng, mat=DARK):
    """A dark lidded chest (a courier's document box): the body three boards high (the joints draw the painted
    hatching), on two runners, a lid with a lip all round, iron corner straps, two iron bands over the lid and down
    the long sides, and a rope handle between them. Collides. l along its yaw, w across, h overall.
    choice: lid 18% of the height with a 2 cm lip; runners 4 cm."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        hl, hw = l / 2, w / 2
        for sx in (-0.33, 0.33):
            k.beam("timber", False, (sx * l, -hw + 0.04, 0.02), (sx * l, hw - 0.04, 0.02), 0.06, 0.04, 0.008)
        zb, zl = 0.04, h * 0.82
        nc = 3
        for i in range(nc):
            za, zt = zb + (zl - zb) * i / nc, zb + (zl - zb) * (i + 1) / nc - 0.004
            k.soft_box(mat, True, (-hl, -hw, za), (hl, hw, zt), rng, r=0.012, wob=0.003, seg=2.0, ease=0.006, tilt=0.002)
        lip = 0.02
        k.soft_box(mat, True, (-hl - lip, -hw - lip, zl), (hl + lip, hw + lip, h), rng, r=0.025, wob=0.004, seg=2.0,
                   ease=0.016, tilt=0.004)
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.post(IRON, False, sx * hl, sy * hw, zb + 0.01, zl - 0.01, 0.045, 0)
        for sx in (-0.28, 0.28):
            xx = sx * l
            k.beam(IRON, False, (xx, -hw - lip - 0.004, h + 0.004), (xx, hw + lip + 0.004, h + 0.004), 0.05, 0.008, 0)
            for sy in (-1, 1):
                _bar(IRON, False, (xx, sy * (hw + 0.005), zb + 0.03), (xx, sy * (hw + 0.005), zl), (1, 0, 0), 0.05, 0.008)
        pts = [V((-0.2 * l, 0, h)), V((-0.12 * l, 0, h + 0.07)), V((0.12 * l, 0, h + 0.07)), V((0.2 * l, 0, h))]
        sb.tube("rope", False, pts, [0.012] * 4, segs=4)


def slatted_box(x, y, z, l, w, h, yaw_deg, rng, legs=0.0, lid=True, slats="v", collide=False, mat="timber"):
    """A box, stand, stool or crate with lattice (slatted) sides: four corner posts (running down `legs` m below the
    box as short legs), top and bottom rails round it, slats on all four sides (slats='v' vertical, 'h'
    horizontal, as the crate at the compound stair), a dark inside showing through the gaps, a top board if `lid`.
    l along its yaw, w across, h the box (without legs). choice: slats 2.5 cm, 7 cm apart."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        hl, hw = l / 2, w / 2
        zb, zt = legs, legs + h
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.post(mat, collide, sx * (hl - 0.022), sy * (hw - 0.022), 0, zt, 0.045, 0.008)
        sides = [((-hl, -hw), (hl, -hw)), ((hl, -hw), (hl, hw)), ((hl, hw), (-hl, hw)), ((-hl, hw), (-hl, -hw))]
        for (ax, ay), (bx_, by) in sides:
            A, B = V((ax, ay, 0)), V((bx_, by, 0))
            for zz in (zb + 0.025, zt - 0.025):
                k.beam(mat, False, A + UP * zz, B + UP * zz, 0.035, 0.035, 0)
            L = (B - A).length
            t = (B - A) / L
            nrm = V((t.y, -t.x, 0))
            if slats == "v":
                m = max(2, round(L / 0.07))
                for i in range(1, m):
                    p = A + t * (L * i / m) + nrm * 0.004
                    _bar(mat, False, p + UP * (zb + 0.04), p + UP * (zt - 0.04), t, 0.025, 0.012)
            else:
                m = max(2, round((h - 0.08) / 0.07))
                for i in range(1, m):
                    zz = zb + 0.04 + (h - 0.08) * i / m
                    k.beam(mat, False, A + t * 0.03 + nrm * 0.004 + UP * zz, B - t * 0.03 + nrm * 0.004 + UP * zz, 0.012, 0.025, 0)
            ia, ib = A - nrm * 0.02 + t * 0.02, B - nrm * 0.02 - t * 0.02
            sb.quad("interior", False, ia + UP * (zb + 0.02), ib + UP * (zb + 0.02), ib + UP * (zt - 0.02), ia + UP * (zt - 0.02))
        sb.quad("interior", False, (-hl + 0.02, -hw + 0.02, zb + 0.03), (hl - 0.02, -hw + 0.02, zb + 0.03),
                (hl - 0.02, hw - 0.02, zb + 0.03), (-hl + 0.02, hw - 0.02, zb + 0.03))
        if lid:
            k.soft_box(mat, collide, (-hl - 0.015, -hw - 0.015, zt), (hl + 0.015, hw + 0.015, zt + 0.025), rng, r=0.015,
                       wob=0.003, seg=2.0, ease=0.008, along=(1, 0))


# ---------------------------------------------------------------- 12-14. thatch

def _rrect(hx, hy, rc, ka, kx, ky):
    """A rounded rectangle centred on 0, counter-clockwise from the south-east corner's start: ka points on each
    corner arc, kx points on the north and south edges, ky on the east and west edges (fixed counts, so rings of
    different sizes loft together)."""
    rc = max(0.0, min(rc, hx, hy))
    cx_, cy_ = hx - rc, hy - rc
    pts = []
    corners = [((cx_, -cy_), -90), ((cx_, cy_), 0), ((-cx_, cy_), 90), ((-cx_, -cy_), 180)]
    edges = [((hx, -cy_), (hx, cy_), ky), ((cx_, hy), (-cx_, hy), kx), ((-hx, cy_), (-hx, -cy_), ky),
             ((-cx_, -hy), (cx_, -hy), kx)]
    for (c, a0), (e0, e1, ke) in zip(corners, edges):
        for q in range(ka):
            a = math.radians(a0 + 90 * q / ka)
            pts.append((c[0] + rc * math.cos(a), c[1] + rc * math.sin(a)))
        for q in range(ke):
            f = q / ke
            pts.append((e0[0] + (e1[0] - e0[0]) * f, e0[1] + (e1[1] - e0[1]) * f))
    return pts


def _thatch_plan(Lx, Ly, z_eave, z_ridge, hip=True, hip_k=0.8, round_=0.85):
    """The thatch loaf's plan, centred on 0: zc(c) the height of ring c (1 = eave, 0 = ridge), size(c) its rounded
    rectangle (hx, hy, rc), inside(x, y, c, d) whether a point lies within ring c grown by d."""
    H = z_ridge - z_eave
    Rx = max(0.0, Lx - Ly * hip_k) if hip else Lx

    def zc(c):
        return z_ridge - H * c * c

    def size(c):
        hy = Ly * c
        hx = (Rx + (Lx - Rx) * c) if hip else Lx
        return hx, hy, min(hx, hy) * (round_ if hip else 0.3)

    def inside(x, y, c, d):
        hx, hy, rc = size(c)
        hx, hy, rc = max(0.02, hx + d), max(0.02, hy + d), max(0.0, rc + d)
        ax, ay = abs(x), abs(y)
        if ax > hx or ay > hy:
            return False
        if ax > hx - rc and ay > hy - rc:
            return math.hypot(ax - (hx - rc), ay - (hy - rc)) <= rc
        return True
    return zc, size, inside


def thatch_roof(x0, x1, y0, y1, z_eave, z_ridge, rng, along="x", hip=True, thick=0.28, mat=STRAW,
                ridge_mat=STRAW, fringe=True, hip_k=0.8, round_=0.85):
    """A thick, rounded straw roof over the plan rectangle (the eave line), ridge along x (or y): a loaf of
    rounded-rectangle rings from a flat ridge down to the eave, convex (bulging) like a thatch, its corners
    rounded (hip=True: the ends round down too; False: steep thatched gable ends); a rolled hem `thick` deep under
    the eave, the underside a straw mat; a wobble in plan and height round the eave (soft, never ruled); a ragged
    fringe of straw ends along the hem; a ridge roll bound with rope. Straw: the reed swatch with its strands laid
    down the slope. hip_k: how far the hipped ends round in (x Ly); round_: the corner radius (x the smaller half
    size; gable ends take 0.3). Returns {'z_under': f(d), 'z_under_at': f(x, y), 'thick': thick}: the underside's
    height d m in from the eave line (across the ridge), or over a plan point, for posts and walls under it.
    choice: thick 0.28 m; the profile z = ridge - rise * c^2."""
    if along == "y":
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        hx, hy = (y1 - y0) / 2, (x1 - x0) / 2
        with k.placed(k.frame(cx, cy, 0, 90)):
            info = thatch_roof(-hx, hx, -hy, hy, z_eave, z_ridge, rng, "x", hip, thick, mat, ridge_mat, fringe, hip_k, round_)
        local = info["z_under_at"]
        info["z_under_at"] = lambda x, y: local(y - cy, cx - x)     # world -> the rotated frame
        return info
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    Lx, Ly = (x1 - x0) / 2, (y1 - y0) / 2
    H = z_ridge - z_eave
    zc, size, inside = _thatch_plan(Lx, Ly, z_eave, z_ridge, hip, hip_k, round_)
    Rx = size(0.0)[0]

    ka = 3
    kx = max(1, round(2 * max(0.0, Lx - Ly * 0.85) / 0.45))
    ky = max(1, round(2 * max(0.0, Ly * 0.15) / 0.45))
    m = 4 * ka + 2 * kx + 2 * ky
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    wob = [0.035 * (math.sin(6.283 * 3 * j / m + ph[0]) + 0.6 * math.sin(6.283 * 7 * j / m + ph[1])) / 1.6 for j in range(m)]
    zw = [0.03 * (math.sin(6.283 * 4 * j / m + ph[2]) + 0.5 * math.sin(6.283 * 9 * j / m + ph[3])) / 1.5 for j in range(m)]

    def ring(c, d, z, amt=1.0):
        hx, hy, rc = size(c)
        pts = _rrect(max(0.02, hx + d), max(0.02, hy + d), max(0.0, rc + d), ka, kx, ky)
        out = []
        for j, (px, py) in enumerate(pts):
            r = math.hypot(px, py) or 1.0
            wj = wob[j] * amt * c
            out.append(V((cx + px + px / r * wj, cy + py + py / r * wj, z + zw[j] * amt * c)))
        return out

    cs = [0.07, 0.2, 0.35, 0.5, 0.64, 0.77, 0.89, 1.0]
    rings = [ring(c, 0.0, zc(c)) for c in cs]
    ze = zc(1.0)
    rings.append(ring(1.0, 0.05, ze - thick * 0.5))
    rings.append(ring(1.0, -0.02, ze - thick))
    under_cs = [c for c in (0.94, 0.8, 0.62, 0.45, 0.3) if Ly * c - thick * 0.9 > 0.08]
    c_top_u = under_cs[-1] if under_cs else 1.0
    for c in under_cs:
        rings.append(ring(c, -thick * 0.9, zc(c) - thick, 0.5))
    # UVs: u down the slope (the strands of the reed swatch run along u), v round the ring
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    acc = [0.0] * m
    vlist = []
    for i, r in enumerate(rings):
        if i:
            acc = [acc[j] + (r[j] - rings[i - 1][j]).length for j in range(m)]
        per = [0.0]
        for j in range(m):
            per.append(per[-1] + (r[(j + 1) % m] - r[j]).length)
        vlist.append((list(acc), per))
    verts = [p for r in rings for p in r]
    faces, uvs = [], []
    for i in range(len(rings) - 1):
        (ua, pa), (ub, pb) = vlist[i], vlist[i + 1]
        for j in range(m):
            j2 = (j + 1) % m
            faces.append((i * m + j, (i + 1) * m + j, (i + 1) * m + j2, i * m + j2))
            uvs.append([(ua[j] / tile + ou, pa[j] / tile + ov), (ub[j] / tile + ou, pb[j] / tile + ov),
                        (ub[j2] / tile + ou, pb[j + 1] / tile + ov), (ua[j2] / tile + ou, pa[j + 1] / tile + ov)])
    faces.append(tuple(range(m)))
    uvs.append([(0.2 + ou, vlist[0][1][j] / tile + ov) for j in range(m)])
    n = len(rings)
    faces.append(tuple(reversed(range((n - 1) * m, n * m))))
    uvs.append([(0.5 + ou, vlist[-1][1][j] / tile + ov) for j in reversed(range(m))])
    k.add(mat, False, verts, faces, uvs)
    # the ragged fringe: tufts of straw ends of their own widths and lengths, at uneven spacing under the hem
    if fringe:
        hem = rings[len(cs) + 1]
        segs_ = [(hem[j], hem[(j + 1) % m]) for j in range(m)]
        lens = [(q - p).length for p, q in segs_]
        per = sum(lens)
        sp, j, acc0 = rng.uniform(0.0, 0.1), 0, 0.0
        while sp < per:
            while j < m - 1 and acc0 + lens[j] < sp:
                acc0 += lens[j]
                j += 1
            p, q = segs_[j]
            tv = (q - p) / max(lens[j], 1e-6)
            c0 = p + tv * (sp - acc0)
            out = V((c0.x - cx, c0.y - cy, 0))
            out = out.normalized() if out.length > 1e-6 else V((0, 0, 0))
            w = rng.uniform(0.03, 0.07)
            k.add(mat, False, [c0 - tv * (w / 2), c0 + tv * (w / 2), c0 + out * 0.015 - UP * rng.uniform(0.03, 0.08)], [(0, 1, 2)])
            sp += rng.uniform(0.05, 0.13)
    # the ridge roll, bound with rope
    zr = zc(0.07) + 0.02
    if hip and Rx < 0.2:
        k.rock(ridge_mat, cx, cy, zr + 0.02, 0.2, rng, flat=0.55)
        sb.cyl("rope", False, (cx, cy, zr - 0.02), (cx, cy, zr + 0.06), 0.19, segs=8, caps=False)
    else:
        ex = (Rx if hip else Lx) + 0.12
        pts = [V((cx + ex * f, cy, zr + (0.02 if abs(f) < 0.9 else -0.03))) for f in (-1.0, -0.8, -0.3, 0.3, 0.8, 1.0)]
        sb.tube(ridge_mat, False, pts, [0.06, 0.13, 0.14, 0.14, 0.13, 0.06], segs=8)
        nb = max(2, round(2 * ex / 0.7))
        for i in range(nb + 1):
            xx = cx - ex * 0.75 + 1.5 * ex * i / nb
            sb.cyl("rope", False, (xx - 0.025, cy, zr), (xx + 0.025, cy, zr), 0.145, segs=8, caps=False)

    def z_under(dist):
        c = min(1.0, max(c_top_u, 1 - dist / max(Ly, 1e-6)))
        return zc(c) - thick

    def z_under_at(x, y):
        lx, ly = x - cx, y - cy
        lo, hi = 0.0, 1.0
        if not inside(lx, ly, 1.0, -thick * 0.9):
            return zc(1.0) - thick
        for _ in range(22):
            mid = (lo + hi) / 2
            if inside(lx, ly, mid, -thick * 0.9):
                hi = mid
            else:
                lo = mid
        return zc(max(hi, c_top_u)) - thick
    return {"z_under": z_under, "z_under_at": z_under_at, "thick": thick}


def thatch_shed(x0, x1, y0, y1, z_eave, z_ridge, rng, inset=0.28, post_r=0.05):
    """An open stall (S4.prop.stall_shed_10470): a thatch_roof over the plan rectangle (its eave line) on four
    slender posts set `inset` in from the eave, tied by plates under the thatch and braced by knee braces.
    Posts collide. choice: posts 10 cm round, inset 0.28 m."""
    info = thatch_roof(x0, x1, y0, y1, z_eave, z_ridge, rng, along="x" if (x1 - x0) >= (y1 - y0) else "y")
    d_in = inset if (x1 - x0) >= (y1 - y0) else inset
    zp = info["z_under"](d_in) - 0.05
    xs, ys = (x0 + inset, x1 - inset), (y0 + inset, y1 - inset)
    for xx in xs:
        for yy in ys:
            sb.cyl("timber", True, (xx + rng.uniform(-0.02, 0.02), yy + rng.uniform(-0.02, 0.02), -0.06), (xx, yy, zp + 0.04),
                   post_r, post_r * 0.85, segs=6)
    corners = [(xs[0], ys[0]), (xs[1], ys[0]), (xs[1], ys[1]), (xs[0], ys[1])]
    for (ax, ay), (bx_, by) in zip(corners, corners[1:] + corners[:1]):
        k.beam("timber", False, (ax, ay, zp), (bx_, by, zp), 0.08, 0.09, 0.015)
        for (px, py), (qx, qy) in (((ax, ay), (bx_, by)), ((bx_, by), (ax, ay))):
            d = V((qx - px, qy - py, 0)).normalized()
            k.beam("timber", False, V((px, py, zp - 0.45)), V((px, py, zp - 0.04)) + d * 0.4, 0.045, 0.045, 0.008)


def thatch_hut(x0, x1, y0, y1, z_wall, z_top, rng, door=None, over=0.45, thick_wall=0.18, door_h=1.72, round_=0.45):
    """A low hut (S4.bld.thatched_hut_10780): soft plastered wattle walls (earth_wall) on the plan rectangle, round
    timber posts at the corners, under a big rounded thatch roof that overhangs the walls by `over` and comes down
    low; `door` = (x0, x1) of a framed door opening in its north (road) side, dark inside. The roof's eave is set so
    its underside clears the wall corners at z_wall, and the walls rise to meet the underside all round (no gap, no
    wall through the thatch). Walls collide. choice: walls 0.18 m; the roof over 0.45 m, its corners rounded 0.45;
    the door 1.72 m high."""
    th = 0.28
    Lx, Ly = (x1 - x0) / 2 + over, (y1 - y0) / 2 + over
    along = "x" if Lx >= Ly else "y"
    La, Lb = (Lx, Ly) if along == "x" else (Ly, Lx)            # half sizes along and across the ridge
    zc, size, inside = _thatch_plan(La, Lb, 0.0, 1.0, True, 0.8, round_)
    ca, cb = (x1 - x0) / 2 - thick_wall / 2, (y1 - y0) / 2 - thick_wall / 2   # a wall corner's outer point
    if along == "y":
        ca, cb = cb, ca
    lo, hi = 0.0, 1.0
    if inside(ca, cb, 1.0, -th * 0.9):
        for _ in range(22):
            mid = (lo + hi) / 2
            lo, hi = (lo, mid) if inside(ca, cb, mid, -th * 0.9) else (mid, hi)
    c = max(hi, 0.3)
    z_eave = z_top - (z_top - z_wall - th) / (c * c)
    z_eave = min(z_wall + th, max(z_wall - 0.8, z_eave))
    info = thatch_roof(x0 - over, x1 + over, y0 - over, y1 + over, z_eave, z_top, rng, along=along, thick=th, round_=round_)
    under = info["z_under_at"]

    def top(x, y):
        return under(x, y) - 0.03
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    for i, (p, q) in enumerate(zip(corners, corners[1:] + corners[:1])):
        if i == 2 and door:
            dx1, dx0 = max(door), min(door)
            zd = min(door_h, z_wall - 0.15)
            earth_wall(p, (dx1 + 0.06, y1), 0.0, z_wall, thick_wall, rng, top=top)
            earth_wall((dx0 - 0.06, y1), q, 0.0, z_wall, thick_wall, rng, top=top)
            earth_wall((dx1 + 0.06, y1), (dx0 - 0.06, y1), zd, z_wall - zd, thick_wall * 0.8, rng, foot=0.0, top=top)
            for xx in (dx0, dx1):
                k.beam("timber", True, (xx, y1 + 0.02, -0.03), (xx, y1 + 0.02, zd + 0.1), 0.09, 0.12, 0.015)
            k.beam("timber", False, (dx0 - 0.15, y1 + 0.03, zd + 0.06), (dx1 + 0.15, y1 + 0.03, zd + 0.06), 0.13, 0.12, 0.02)
            k.soft_box("stone", False, (dx0 - 0.02, y1 - 0.12, -0.04), (dx1 + 0.02, y1 + 0.14, 0.06), rng, r=0.03, wob=0.005)
            sb.quad("interior", False, (dx1, y1 - 0.25, 0.0), (dx0, y1 - 0.25, 0.0), (dx0, y1 - 0.25, zd), (dx1, y1 - 0.25, zd))
        else:
            earth_wall(p, q, 0.0, z_wall, thick_wall, rng, top=top)
    for xx, yy in corners:
        sb.cyl("timber", True, (xx, yy, -0.05), (xx, yy, under(xx, yy) - 0.02), 0.085, 0.075, segs=8)


# ---------------------------------------------------------------- 15-16. blinds and mat canopies

def bamboo_blind(p0, p1, z0, z1, rng, roll_r=0.05):
    """A blind of thin vertical slats (the reed swatch turned upright) hanging from a rolled top between plan
    points p0 and p1, from z1 (the roll) down to z0: a few strips, each a little in or out (a hanging blind's
    ripple), a bamboo rod along the bottom, rope ties round the roll with short ends. If z1 - z0 < 0.15 the blind
    is rolled up: only the roll and its ties."""
    a, b, t, n, L = _seg(p0, p1)
    rolled = (z1 - z0) < 0.15
    rr = roll_r * (1.5 if rolled else 1.0)
    zr = z1 - rr
    sb.cyl("reed", False, a - t * 0.03 + UP * zr, b + t * 0.03 + UP * zr, rr, segs=8)
    for f in (0.18, 0.82):
        p = a + t * (L * f) + UP * zr
        sb.cyl("rope", False, p - t * 0.012, p + t * 0.012, rr + 0.008, segs=8, caps=False)
        sb.tube("rope", False, [p + n * rr, p + n * (rr + 0.01) - UP * 0.1, p + n * rr - UP * 0.2], [0.007, 0.006, 0.004], segs=3)
    if rolled:
        return
    m = max(2, round(L / 0.22))
    zt = zr - rr * 0.6
    for i in range(m):
        s0, s1 = L * i / m, L * (i + 1) / m
        o = n * (0.008 if i % 2 else -0.008)
        pa, pb = a + t * s0 + o, a + t * s1 + o
        za, zb = z0 + rng.uniform(-0.012, 0.012), z0 + rng.uniform(-0.012, 0.012)
        sb.quad("reed", False, pa + UP * za, pb + UP * zb, pb + UP * zt, pa + UP * zt, uv=[(za, s0), (zb, s1), (zt, s1), (zt, s0)])
    k.beam("bamboo", False, a + UP * (z0 + 0.01), b + UP * (z0 + 0.01), 0.022, 0.022, 0)


def arched_canopy(p0, p1, width, z0, h, rng, z_ground=0.0, shelves=(0.43, 0.68)):
    """A low arched mat canopy (S4.prop.mat_canopy_10555): a woven mat (reed swatch) on bamboo hoops, a barrel
    from plan p0 to p1, `width` across, springing at z0 and rising h at the crown; a dark binding along both open
    ends; four posts from the ground to the springing with side rails; plank shelves inside at the heights in
    `shelves` (above z_ground; painted at 0.43 and 0.68 m) on cross bearers.
    choice: hoops every ~0.45 m; the mat 2 cm outside them."""
    a, b, t, n, L = _seg(p0, p1)
    nh = max(3, round(L / 0.45)) + 1
    ka = 8
    hw = width / 2

    def arc(s, off=0.0, jit=0.0):
        P = a + t * s
        pts = []
        for q in range(ka + 1):
            ph = math.pi * q / ka
            j = jit * math.sin(ph)
            pts.append(P + n * ((hw + off) * math.cos(ph)) + UP * (z0 + (h + off + j) * math.sin(ph)))
        return pts

    arcs = [arc(L * i / (nh - 1), 0.02, rng.uniform(-0.03, 0.03) if 0 < i < nh - 1 else 0.0) for i in range(nh)]
    for i in range(nh - 1):
        A, B = arcs[i], arcs[i + 1]
        sa, sbb = L * i / (nh - 1), L * (i + 1) / (nh - 1)
        for q in range(ka):
            ua, ub = q / ka * (math.pi * hw), (q + 1) / ka * (math.pi * hw)
            sb.quad("reed", False, A[q], A[q + 1], B[q + 1], B[q], uv=[(sa, ua), (sa, ub), (sbb, ub), (sbb, ua)])
    for i in range(nh):
        s = L * i / (nh - 1)
        pts = arc(s, 0.0)
        end = i in (0, nh - 1)
        sb.tube("lattice" if end else "bamboo", False, arc(s, 0.025) if end else pts, [0.025 if end else 0.018] * (ka + 1), segs=3)
    for s in (0.04, L - 0.04):
        for sd in (1, -1):
            p = a + t * s + n * (sd * hw)
            k.post("timber", True, p.x, p.y, z_ground - 0.05, z0 + 0.04, 0.07, 0.012)
    for sd in (1, -1):
        k.beam("timber", False, a + n * (sd * hw) + UP * z0, b + n * (sd * hw) + UP * z0, 0.06, 0.07, 0.012)
    for zs in shelves:
        z = z_ground + zs
        if z > z0 + h * 0.6:
            continue
        for s in (0.04, L - 0.04):
            p = a + t * s
            k.beam("timber", False, p - n * hw + UP * (z - 0.05), p + n * hw + UP * (z - 0.05), 0.05, 0.05, 0.008)
        w2 = hw * 0.75
        ring = [a + t * 0.02 - n * w2, b - t * 0.02 - n * w2, b - t * 0.02 + n * w2, a + t * 0.02 + n * w2]
        if (ring[1] - ring[0]).cross(ring[2] - ring[1]).z < 0:
            ring.reverse()
        k.soft_slab("deck", False, [(p.x, p.y) for p in ring], z - 0.025, z, rng, r=0.03, wob=0.006, seg=1.2, ease=0.008,
                    along=(t.x, t.y))


# ---------------------------------------------------------------- 17. the temple-gate guardian

def guardian_statue(x, y, z, facing_deg, h, rng):
    """A seated temple-gate guardian (S4.prop.guardian_statue_9942, _10102) on a block plinth, carved from soft
    pieces in painted-stone colours: a stone plinth with a moulded top; the figure seated on it, a robed body
    (elliptical lathe) flaring over the hips, broad armoured shoulder pads, thighs to rounded knees and lower legs to
    a foot ledge, arms down to hands on the knees, one holding an upright mace; a round head with a flared helmet
    and a crest knob. Seen only through a lattice railing high on the silk, so the silhouette (helmet, shoulders,
    mace, knees) carries it. facing_deg: the plan direction it faces (deg from +x, counter-clockwise; -90 = south).
    h: overall height including the plinth. choice: plinth 22% of h; a mace in the right hand."""
    s = h
    with k.placed(k.frame(x, y, z, facing_deg + 90)):          # build facing -y
        zp = 0.22 * s
        k.soft_box("stone", False, (-0.32 * s, -0.3 * s, 0), (0.32 * s, 0.26 * s, zp - 0.03 * s), rng, r=0.03, wob=0.006)
        k.soft_box("stone", False, (-0.35 * s, -0.33 * s, zp - 0.035 * s), (0.35 * s, 0.29 * s, zp), rng, r=0.025, wob=0.005,
                   ease=0.012)
        k.soft_box("stone", False, (-0.28 * s, -0.46 * s, 0), (0.28 * s, -0.29 * s, 0.07 * s), rng, r=0.02, wob=0.005)
        X, Y, Z = V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))
        # body: hips to neck
        _lathe3("redwood", False, (0, 0.03 * s, zp), X, Y, Z,
                [(0.2 * s, 0.17 * s, 0), (0.19 * s, 0.15 * s, 0.1 * s), (0.17 * s, 0.13 * s, 0.22 * s),
                 (0.19 * s, 0.13 * s, 0.33 * s), (0.13 * s, 0.1 * s, 0.39 * s), (0.06 * s, 0.06 * s, 0.42 * s)],
                segs=10, cap0=True, cap1=True)
        _lathe3("ridge", False, (0, 0.03 * s, zp + 0.17 * s), X, Y, Z,
                [(0.185 * s, 0.145 * s, 0), (0.19 * s, 0.15 * s, 0.035 * s)], segs=10, cap0=False, cap1=False)
        zs = zp + 0.33 * s
        for sx in (-1, 1):
            k.rock("ridge", sx * 0.2 * s, 0.03 * s, zs, 0.085 * s, rng, flat=0.7)
            # thigh, knee, lower leg
            hip = V((sx * 0.1 * s, -0.02 * s, zp + 0.07 * s))
            knee = V((sx * 0.12 * s, -0.27 * s, zp + 0.08 * s))
            sb.tube("redwood", False, [hip, hip.lerp(knee, 0.5) + UP * 0.01 * s, knee], [0.085 * s, 0.08 * s, 0.07 * s], segs=6)
            k.rock("redwood", knee.x, knee.y - 0.01 * s, knee.z, 0.075 * s, rng, flat=0.95)
            foot = V((sx * 0.13 * s, -0.36 * s, 0.07 * s))
            sb.tube("redwood", False, [knee, knee.lerp(foot, 0.5), foot + UP * 0.03 * s], [0.065 * s, 0.07 * s, 0.075 * s], segs=6)
            k.rock("ridge", foot.x, foot.y - 0.02 * s, foot.z + 0.02 * s, 0.05 * s, rng, flat=0.6)
            # arm: shoulder, elbow, hand on the knee
            sh = V((sx * 0.21 * s, 0.03 * s, zs - 0.02 * s))
            el = V((sx * 0.25 * s, -0.04 * s, zp + 0.19 * s))
            hand = V((sx * 0.14 * s, -0.24 * s, zp + 0.15 * s))
            sb.tube("redwood", False, [sh, el, hand], [0.06 * s, 0.055 * s, 0.045 * s], segs=6)
            k.rock("plaster", hand.x, hand.y, hand.z, 0.04 * s, rng, flat=0.9)
            if sx > 0:
                sb.cyl("ridge", False, hand - UP * 0.12 * s, hand + UP * 0.42 * s, 0.018 * s, segs=6)
                _lathe3("ridge", False, hand + UP * 0.42 * s, X, Y, Z,
                        [(0.02 * s, 0.02 * s, 0), (0.045 * s, 0.045 * s, 0.05 * s), (0.04 * s, 0.04 * s, 0.11 * s),
                         (0.0, 0.0, 0.14 * s)], segs=6)
        # head, helmet, crest
        zh = zp + 0.42 * s
        _lathe3("plaster", False, (0, 0.02 * s, zh), X, Y, Z,
                [(0.05 * s, 0.05 * s, 0), (0.085 * s, 0.09 * s, 0.05 * s), (0.09 * s, 0.095 * s, 0.11 * s),
                 (0.08 * s, 0.085 * s, 0.15 * s)], segs=10, cap0=False, cap1=True)
        _lathe3("ridge", False, (0, 0.025 * s, zh + 0.12 * s), X, Y, Z,
                [(0.13 * s, 0.13 * s, -0.01 * s), (0.11 * s, 0.11 * s, 0.03 * s), (0.095 * s, 0.1 * s, 0.07 * s),
                 (0.06 * s, 0.065 * s, 0.12 * s), (0.0, 0.0, 0.14 * s)], segs=10, cap0=True)
        k.rock("redwood", 0, 0.025 * s, zh + 0.265 * s, 0.035 * s, rng, flat=1.4)


# ---------------------------------------------------------------- 18-21. goods

def round_goods_stack(x, y, z, rng, rows=3, n=10, r=0.12, yaw_deg=0.0, length=0.45, stand=0.12, mat=STRAW,
                      end_mat="cloth_white", both_ends=False):
    """About ten roll-like goods (rolled mats or coiled bundles, S4.prop.round_goods_stack_9790) lying end-on (their
    axes along the local y, so a viewer to the south sees their ends) in stacked rows on a low plank stand, each
    row sitting in the grooves of the one below; each seen end pale with a dark spiral (both_ends: the back ends
    too); every roll its own radius and set. choice: rolls 0.45 m long; stand 0.12 m."""
    counts, offs = [], []
    left, prev, off = n, None, 0.0
    for i in range(rows):
        cnt = math.ceil(left / (rows - i)) + (rows - 1) // 2 if prev is None else min(prev - 1, math.ceil(left / (rows - i)))
        cnt = min(cnt, left)
        if cnt <= 0:
            break
        if prev is not None and (prev - cnt) % 2 == 0:
            off += r * 1.03                     # same parity as the row below: move into its grooves
        counts.append(cnt)
        offs.append(off)
        left -= cnt
        prev = cnt
    with k.placed(k.frame(x, y, z, yaw_deg)):
        W = counts[0] * 2 * r * 1.03 + 0.1
        if stand > 0:
            k.soft_box("timber", False, (-W / 2, -length / 2 - 0.03, stand - 0.04), (W / 2, length / 2 + 0.03, stand), rng,
                       r=0.02, wob=0.004, ease=0.008, along=(1, 0))
            for sx in (-1, 1):
                for sy in (-1, 1):
                    k.post("timber", False, sx * (W / 2 - 0.05), sy * (length / 2 - 0.02), 0, stand - 0.04, 0.045, 0)
        for row, (cnt, off) in enumerate(zip(counts, offs)):
            zc = stand + r + row * r * 1.03 * math.sqrt(3)
            for i in range(cnt):
                xc = off + (i - (cnt - 1) / 2) * 2 * r * 1.03 + rng.uniform(-0.008, 0.008)
                rr = r * rng.uniform(0.92, 1.03)
                yaw = math.radians(rng.uniform(-5, 5))
                d = V((math.sin(yaw), math.cos(yaw), 0))
                c = V((xc, rng.uniform(-0.03, 0.03), zc + (rr - r)))
                a, b = c - d * (length / 2), c + d * (length / 2)
                sb.cyl(mat, False, a, b, rr, segs=10, caps=False)
                for idx, (e, dn) in enumerate(((a, -d), (b, d))):
                    X, Y, Z = _frame_of(dn)
                    ring = [e + (X * math.cos(2 * math.pi * q / 10) + Y * math.sin(2 * math.pi * q / 10)) * rr for q in range(10)]
                    k.add(end_mat, False, ring, [tuple(range(10))])
                    if idx == 1 and not both_ends:
                        continue
                    # the spiral: a thin dark ribbon winding out from the centre, a hair proud of the end
                    turns, npts = 2.6, 18
                    ph = rng.uniform(0, 6.283)
                    sp = []
                    for q in range(npts):
                        f = q / (npts - 1)
                        ang = ph + 6.283 * turns * f
                        sp.append((X * math.cos(ang) + Y * math.sin(ang), rr * (0.08 + 0.82 * f)))
                    w = rr * 0.06
                    for q in range(npts - 1):
                        (u0, r0), (u1, r1) = sp[q], sp[q + 1]
                        quad = [e + dn * 0.003 + u0 * (r0 - w / 2), e + dn * 0.003 + u1 * (r1 - w / 2),
                                e + dn * 0.003 + u1 * (r1 + w / 2), e + dn * 0.003 + u0 * (r0 + w / 2)]
                        if (quad[1] - quad[0]).cross(quad[2] - quad[1]).dot(dn) < 0:
                            quad.reverse()
                        k.add("lattice", False, quad, [(0, 1, 2, 3)])


def hanging_gourds(x, y, z_hook, n, rng, s=1.0):
    """Small round spotted things (dried gourds, S4.prop.hanging_goods_9890) hanging on cords from a hook at
    z_hook: an iron hook, cords of different lengths, each gourd a lathe of two bulbs (or a round one) with a few
    dark spots on it. choice: about 0.18 m tall (painted ~30 px for two or three)."""
    hook = V((x, y, z_hook))
    sb.cyl(IRON, False, hook + UP * 0.05, hook - UP * 0.02, 0.008, segs=4)
    _ring(IRON, hook - UP * 0.03, V((1, 0, 0)), 0.025, 0.006, segs=6, sides=3)
    for i in range(n):
        a = 2 * math.pi * i / max(1, n) + rng.uniform(-0.4, 0.4)
        spread = 0.06 * s if n > 1 else 0.0
        ln = rng.uniform(0.1, 0.32)
        end = hook - UP * 0.05 + V((math.cos(a) * spread, math.sin(a) * spread, -ln))
        sb.cyl("rope", False, hook - UP * 0.05, end, 0.006, segs=4, caps=False)
        hh = 0.18 * s * rng.uniform(0.85, 1.15)
        if rng.random() < 0.6:
            prof = [(0.012, 0), (0.03, 0.06), (0.025, 0.12), (0.055, 0.2), (0.075, 0.33), (0.07, 0.48), (0.04, 0.58), (0.008, 0.62)]
            prof = [(r * hh / 0.62, -zz * hh / 0.62) for r, zz in prof]
        else:
            prof = [(0.01, 0), (0.05, -0.025), (0.085, -0.08), (0.085, -0.13), (0.05, -0.175), (0.008, -0.19)]
            prof = [(r * hh / 0.19, zz * hh / 0.19) for r, zz in prof]
        # a lathe hanging downward: list it bottom to top for an outward winding
        prof = list(reversed(prof))
        z0 = prof[0][1]
        sb.lathe("bamboo", False, (end.x, end.y, end.z + z0), [(r, zz - z0) for r, zz in prof], segs=8)
        rmax = max(r for r, _ in prof)
        zmid = [zz for r, zz in prof if r == rmax][0]
        for q in range(4):
            ang = rng.uniform(0, 6.283)
            dz = rng.uniform(-0.25, 0.25) * hh
            nrm = V((math.cos(ang), math.sin(ang), 0))
            c = V((end.x, end.y, end.z + zmid + dz)) + nrm * (rmax * (1 - (abs(dz) / hh) ** 2 * 1.2) + 0.002)
            X, Y, Z = _frame_of(nrm)
            rs = rng.uniform(0.008, 0.014) * s
            k.add("lattice", False, [c + (X * math.cos(2 * math.pi * e / 5) + Y * math.sin(2 * math.pi * e / 5)) * rs
                                     for e in range(5)], [(0, 1, 2, 3, 4)])


def heaped_basket(x, y, z, r, h, heap, rng, mat=BRUSH, strands=170):
    """A big round woven basket (kit_inner_city.round_basket) heaped `heap` m above its rim with a shaggy brown
    load of straw or brushwood (S4.prop.big_basket_10000): a lumpy mound that swells a little past the rim, and
    strands sticking out of it everywhere, drooping over the rim, pale and dark."""
    ki.round_basket(x, y, z, r, h, rng, mouth=1.04)
    zr = z + h
    k.boulder(mat, x, y, zr - 0.04, r * 1.06, r * 1.02, heap + 0.04, rng, collide=False, nu=14, nv=7, lump=0.2, sink=0.06)
    for _ in range(12):                                  # tufts in the load: bunches of strands from one point
        a = rng.uniform(0, 6.283)
        e = rng.uniform(0.1, 0.9)
        ce = math.cos(e * math.pi / 2)
        c = V((x + math.cos(a) * r * 1.0 * ce, y + math.sin(a) * r * 0.97 * ce, zr + heap * math.sin(e * math.pi / 2) * 0.92))
        out = V((math.cos(a) * ce, math.sin(a) * ce, math.sin(e * math.pi / 2) * 0.8)).normalized()
        m = STRAW if rng.random() < 0.5 else mat
        for _ in range(5):
            d = (out + V((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(-0.3, 0.4)))).normalized()
            tip = c + d * rng.uniform(0.12, 0.25)
            side = d.cross(UP)
            side = side.normalized() * rng.uniform(0.01, 0.018) if side.length > 1e-4 else V((0.012, 0, 0))
            k.add(m, False, [c - side, c + side, tip], [(0, 1, 2)])
    for i in range(strands):
        a = rng.uniform(0, 6.283)
        e = rng.uniform(0.0, 1.0) ** 0.8 if rng.random() < 0.85 else rng.uniform(-0.2, 0.1)
        ce = math.cos(e * math.pi / 2)
        base = V((x + math.cos(a) * r * 1.05 * ce, y + math.sin(a) * r * 1.02 * ce, zr + heap * max(0.0, math.sin(e * math.pi / 2)) * 0.95))
        out = V((math.cos(a), math.sin(a), 0))
        ln = rng.uniform(0.12, 0.32)
        droop = 0.7 if e < 0.35 else rng.uniform(-0.4, 0.3)
        tip = base + out * ln * (0.8 if e < 0.35 else 0.55) + UP * (-droop * ln + (0.25 * ln if e > 0.7 else 0))
        side = V((-out.y, out.x, 0)) * rng.uniform(0.008, 0.016)
        if (tip - base).length < 0.02:
            continue
        m = STRAW if rng.random() < 0.3 else mat
        k.add(m, False, [base - side, base + side, tip], [(0, 1, 2)])


def saddle_on_stand(x, y, z, yaw_deg, rng, stand=0.55):
    """A domed straw-hatched saddle or pad with a small knob on top (S4.prop.saddle_on_stand_11760), set on a low
    saddle stand (a sawhorse: a top rail on two splayed leg pairs and a stretcher). Along its yaw = the saddle's
    length. choice: saddle 0.66 x 0.5 x 0.24 m; stand 0.55 m."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        k.beam("timber", False, (-0.42, 0, stand), (0.42, 0, stand), 0.09, 0.08, 0.015)
        for sx in (-0.34, 0.34):
            for sy in (-1, 1):
                k.beam("timber", False, (sx, sy * 0.2, 0), (sx, sy * 0.02, stand - 0.03), 0.045, 0.045, 0.008)
            k.beam("timber", False, (sx, -0.14, stand * 0.35), (sx, 0.14, stand * 0.35), 0.035, 0.035, 0)
        k.beam("timber", False, (-0.34, 0, stand * 0.35), (0.34, 0, stand * 0.35), 0.035, 0.035, 0)
        X, Y, Z = V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))
        zs = stand + 0.035
        _lathe3("reed", False, (0, 0, zs), X, Y, Z,
                [(0.33, 0.25, -0.05), (0.34, 0.26, 0.0), (0.31, 0.24, 0.08), (0.25, 0.19, 0.15), (0.15, 0.12, 0.21),
                 (0.0, 0.0, 0.24)], segs=12, cap0=True, uv_tile=0.5)
        _lathe3("timber", False, (0.17, 0, zs + 0.17), X, Y, Z,
                [(0.035, 0.035, 0), (0.05, 0.045, 0.05), (0.04, 0.035, 0.1), (0.0, 0.0, 0.12)], segs=6, cap0=False)


# ---------------------------------------------------------------- 22-24. signs, ornaments, fences

def hanging_sign(p_left, p_right, z_top, h, sign, rng, cord=0.18, thick=0.025):
    """A narrow vertical board hanging on two cords from z_top + cord down to its top at z_top (the fortune-teller's
    boards, S4.prop.sign_kanming_12266 and friends): its face (to the right of p_left -> p_right) carrying the atlas
    sign, a thin dark frame round it, a capping strip on top, the cords tied through two eyes. Size the board by
    cell_aspect(sign) to keep the painted proportions."""
    a, b, t, n, L = _seg(p_left, p_right)
    z0 = z_top - h
    k.board("timber", False, (a.x, a.y), (b.x, b.y), thick, z0, z_top)
    o = n * (thick / 2 + 0.003)
    sb.quad("signs_outer_road", False, a + o + UP * z0, b + o + UP * z0, b + o + UP * z_top, a + o + UP * z_top, uv=cell_uv(sign))
    f = thick + 0.012
    for p, q in ((a + UP * z0, b + UP * z0), (b + UP * z0, b + UP * z_top), (a + UP * z_top, a + UP * z0)):
        side = t if abs((q - p).normalized().z) > 0.5 else UP
        _bar("lattice", False, p + n * 0.004, q + n * 0.004, side, 0.022, f)
    k.beam("timber", False, a - t * 0.02 + UP * (z_top + 0.012), b + t * 0.02 + UP * (z_top + 0.012), f + 0.01, 0.025, 0.006)
    for e in (a + t * (L * 0.18), b - t * (L * 0.18)):
        _ring(IRON, e + UP * (z_top + 0.035), n, 0.014, 0.004, segs=6, sides=3)
        sb.cyl("rope", False, e + UP * (z_top + 0.045), e + UP * (z_top + cord) + t * rng.uniform(-0.01, 0.01), 0.006, segs=4,
               caps=False)


def hanging_fish(p, facing, s=1.0, mat="timber", thick=0.045):
    """The hanging-fish board (悬鱼) under a gable apex at 3D point p, flat in the gable's plane, its face toward
    `facing` (plan vector out of the gable): a narrow shank hanging from the apex, a fish body with side fins, and a
    forked tail at the bottom. s scales it (1.0: 0.95 m long, 0.32 m wide). choice: the outline (painted as a plain
    board with a block at its foot)."""
    f = V((facing[0], facing[1], 0)).normalized()
    sd = V((-f.y, f.x, 0))
    P = V(p)
    half = [(0.06, 0.0), (0.055, -0.36), (0.1, -0.42), (0.15, -0.5), (0.16, -0.6), (0.12, -0.68), (0.07, -0.74),
            (0.15, -0.9), (0.13, -0.95), (0.06, -0.86), (0.0, -0.82)]
    right = [(x * s, zz * s) for x, zz in half]
    left = [(-x, zz) for x, zz in reversed(right[:-1])]
    outline = right + left
    pts = [P + sd * x + UP * zz for x, zz in outline]
    _slab_poly(mat, False, pts, f, thick * s)
    k.beam(mat, False, P + UP * 0.02 * s - f * 0.01, P - UP * 0.1 * s - f * 0.01, 0.16 * s, thick * s * 1.6, 0.01)


def low_rail_fence(pts, h, rng, rails=3, post_every=1.6, collide=True, mat="timber"):
    """A low fence of horizontal rails on posts along a polyline (S4.str.rail_fence_10190, railing_9760,
    yard_frame_12025): round-topped posts at every corner and at most `post_every` apart, each leaning and standing
    a little differently; `rails` rails from near the top down, each span its own sag and set, ends running a
    little past the end posts. Collide: the posts and the top and bottom rails."""
    P = [V((p[0], p[1], 0)) for p in pts]
    posts = []
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        L = (b - a).length
        m = max(1, math.ceil(L / post_every))
        for q in range(m + (1 if i == len(P) - 2 else 0)):
            posts.append(a.lerp(b, q / m))
    tops = []
    for p in posts:
        lean = V((rng.uniform(-0.025, 0.025), rng.uniform(-0.025, 0.025), 0))
        zt = h + 0.05 + rng.uniform(-0.02, 0.025)
        top = p + lean + UP * zt
        k.beam(mat, collide, p - UP * 0.06, top, 0.085, 0.085, 0.015)
        sb.lathe(mat, False, top, [(0.05, 0), (0.045, 0.025), (0.0, 0.045)], segs=6)
        tops.append((p, lean, zt))
    zs = [h - 0.05 - (h - 0.2) * j / max(1, rails - 1) for j in range(rails)] if rails > 1 else [h - 0.05]
    for (pa, la, _), (pb, lb, _) in zip(tops, tops[1:]):
        d = (pb - pa)
        if d.length < 1e-6:
            continue
        t = d.normalized()
        n = V((t.y, -t.x, 0))
        for j, zz in enumerate(zs):
            f0, f1 = zz / max(h, 1e-6), zz / max(h, 1e-6)
            A = pa + la * f0 + n * 0.055 + UP * (zz + rng.uniform(-0.012, 0.012))
            B = pb + lb * f1 + n * 0.055 + UP * (zz + rng.uniform(-0.012, 0.012))
            if pa is tops[0][0]:
                A = A - t * 0.08
            if pb is tops[-1][0]:
                B = B + t * 0.08
            col = collide and (j == 0 or j == len(zs) - 1)
            if d.length > 1.2:
                M = A.lerp(B, 0.5) - UP * rng.uniform(0.008, 0.02)
                k.beam(mat, col, A, M, 0.05, 0.075, 0.01)
                k.beam(mat, col, M, B, 0.05, 0.075, 0.01)
            else:
                k.beam(mat, col, A, B, 0.05, 0.075, 0.01)
