"""The scroll's end kit (S7, sections/city_end): the parts S7 needs that song_kit.py, kit_inner_city.py and
kit_outer_road.py lack (round 2 Run 2, 2026-10-12; review renders in gen/sections/city_end/kit_review/).

Generic builder functions in the song_kit manner: each adds faces to street_b1's bucket set `sb.B` and never opens
an entity; the section builder (blender/city_end_scene.py) wraps every call in `with sb.entity(<map id>):`.
Positions always come from the caller (layout.json); sizes the strokes can't give are keyword arguments marked
`choice:` at the call. Frame: x = map X (east), y = map D (north), z up, metres. Facing: a plan vector (fx, fy) the
face looks toward, or facing_deg (0 = +X east, 90 = north). Built at real size (map/BUILDING.md rule 5).

Messenger's construction rules apply as in song_kit: no plain boxes, edges with thickness, framed openings (frames are
mitred rings with depth, `_frame_ring`), members square to their own frame (`_member`, chamfered), surfaces split where
ink should fall (staves, planks, drawer fronts and boards are separate pieces), the triangles go into trims and small
things. Thin things (cloth, mats, sign faces) are single faces: the exported materials are double-sided.

Signs carry their painted characters from the section's atlas (SIGN_TEX / SIGN_JSON, gen/sections/city_end/
make_signs.mjs): a sign's face is mapped onto its cell, material "signs_city_end"; a face is built with the cell's left
edge on the viewer's left (never mirrored). The only new materials are the atlas and `iron`; everything else is a shared
swatch. Collide only what a walker must not pass (posts, feet, the tub, the shed, fences, the partition, walls);
furniture people sit on never collides (people.js grounds a seated figure by a ray from above).
"""
import json
import math
import os

from mathutils import Vector

import song_kit as k
import street_b1 as sb

V = Vector
UP = V((0, 0, 1))
QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SIGN_TEX = QM + r"\gen\sections\city_end\textures\signs_city_end.png"
SIGN_JSON = QM + r"\gen\sections\city_end\textures\signs_city_end.json"
for _name, _spec in {
    "signs_city_end": (SIGN_TEX, 1, None),
    "iron": (None, 1, "#3b3a38"),
    "stone_dark": (None, 1, "#5f5b52"),
}.items():
    sb.MATERIALS.setdefault(_name, _spec)
_ATLAS = {}


def atlas():
    if not _ATLAS and os.path.exists(SIGN_JSON):
        with open(SIGN_JSON, encoding="utf-8") as f:
            _ATLAS.update(json.load(f))
    return _ATLAS


def cell_uv(name, sub=None):
    """UVs (Blender: origin bottom-left) of a sign's atlas cell: [bottom-left, bottom-right, top-right, top-left] of
    the face. sub = (t0, t1): only that part of the cell's height (0 = top). None when the atlas lacks the cell."""
    a = atlas()
    if not a or name not in a.get("cells", {}):
        return None
    S = a["size"]
    x0, y0, x1, y1 = a["cells"][name]
    if sub:
        h = y1 - y0
        y0, y1 = y0 + h * sub[0], y0 + h * sub[1]
    u0, u1 = x0 / S, x1 / S
    vb, vt = 1 - y1 / S, 1 - y0 / S
    return [(u0, vb), (u1, vb), (u1, vt), (u0, vt)]


def cell_aspect(name, default=1.0):
    """A cell's width / height as drawn (the board's real proportions), so a caller can size a face without
    stretching its characters."""
    return atlas().get("aspect", {}).get(name, default)


def _face(a, b, c, d, sign, sub=None, uv=None):
    """A sign face a (bottom-left, on the viewer's left), b, c, d (counter-clockwise seen from the front) on its cell."""
    uv = uv or cell_uv(sign, sub)
    sb.quad("signs_city_end" if uv else "cloth_white", False, a, b, c, d, uv=uv)


def _fv(facing):
    f = V((facing[0], facing[1], 0))
    return f.normalized()


def _deg(facing_deg):
    a = math.radians(facing_deg)
    return V((math.cos(a), math.sin(a), 0))


# ---------------------------------------------------------------- small helpers (private)

def _seg(p0, p1):
    """Plan frame of p0 -> p1: start, end (z = 0), unit direction t, its right n, length."""
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = b - a
    L = t.length
    t.normalize()
    return a, b, t, V((t.y, -t.x, 0)), L


def _newell(P):
    nv = V((0, 0, 0))
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]
        nv += V(((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)))
    return nv


def _member(mat, collide, p0, p1, side, w, h, c=0.0):
    """A straight member from p0 to p1 whose `w` runs along `side` (squared to the axis) and `h` across both, its long
    edges chamfered by c (k.beam's section turns with the world; this one with the caller's frame)."""
    p0, p1 = V(p0), V(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    d.normalize()
    sd = V(side) - d * V(side).dot(d)
    if sd.length < 1e-6:
        sd = d.orthogonal()
    sd.normalize()
    up = d.cross(sd)
    hw, hh = w / 2, h / 2
    if c <= 0:
        ring = [(hw, hh), (-hw, hh), (-hw, -hh), (hw, -hh)]
    else:
        c = min(c, hw * 0.45, hh * 0.45)
        ring = [(hw - c, hh), (-(hw - c), hh), (-hw, hh - c), (-hw, -(hh - c)),
                (-(hw - c), -hh), (hw - c, -hh), (hw, -(hh - c)), (hw, hh - c)]
    n = len(ring)
    verts = [p0 + sd * s + up * u for s, u in ring] + [p1 + sd * s + up * u for s, u in ring]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    faces += [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    k.add(mat, collide, verts, faces)


def _box8(mat, collide, bot, top):
    """A six-faced solid from 4 bottom and 4 matching top corners (any winding; a plank whose top follows a slope)."""
    bot, top = [V(p) for p in bot], [V(p) for p in top]
    if _newell(bot).z < 0:
        bot.reverse()
        top.reverse()
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    k.add(mat, collide, bot + top, faces)


def _plate(mat, collide, ring, nrm, thick, front=True, back=True):
    """A flat plate cut to a planar outline `ring` (its front plane), `thick` deep behind it (along -nrm)."""
    P = [V(p) for p in ring]
    nrm = V(nrm).normalized()
    if _newell(P).dot(nrm) < 0:
        P.reverse()
    n = len(P)
    verts = P + [p - nrm * thick for p in P]
    faces = [tuple(range(n))] if front else []
    if back:
        faces.append(tuple(reversed(range(n, 2 * n))))
    faces += [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    k.add(mat, collide, verts, faces)


def _slab(mat, collide, pts, nrm, thick):
    """A flat plate cut to a planar outline `pts` (its mid plane), `thick` across it."""
    nrm = V(nrm).normalized()
    _plate(mat, collide, [V(p) + nrm * (thick / 2) for p in pts], nrm, thick)


def _frame_ring(mat, collide, outer, inner, nrm, depth, back=False):
    """A mitred frame: the band between two matching planar rings (its front plane), `depth` deep behind it, with its
    outer and inner edges; `back` closes its back too (a frame seen from both sides)."""
    O, I = [V(p) for p in outer], [V(p) for p in inner]
    nrm = V(nrm).normalized()
    if _newell(O).dot(nrm) < 0:
        O.reverse()
        I.reverse()
    n = len(O)
    verts = O + I + [p - nrm * depth for p in O] + [p - nrm * depth for p in I]
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
        faces.append((i, 2 * n + i, 2 * n + j, j))
        faces.append((n + i, n + j, 3 * n + j, 3 * n + i))
        if back:
            faces.append((2 * n + i, 3 * n + i, 3 * n + j, 2 * n + j))
    k.add(mat, collide, verts, faces)


def _rect_frame(mat, a, b, z0, z1, nrm, fw, depth, proud, grow=0.0, back=False):
    """A framed border round the upright rectangle a -> b (plan points), z0 to z1, its front `proud` in front of that
    plane along nrm, fw wide, `depth` deep; grow pushes its outer edge past the rectangle."""
    t = (b - a).normalized()
    o = nrm * proud
    outer = [a - t * grow + UP * (z0 - grow), b + t * grow + UP * (z0 - grow), b + t * grow + UP * (z1 + grow),
             a - t * grow + UP * (z1 + grow)]
    inner = [a + t * fw + UP * (z0 + fw), b - t * fw + UP * (z0 + fw), b - t * fw + UP * (z1 - fw), a + t * fw + UP * (z1 - fw)]
    _frame_ring(mat, False, [p + o for p in outer], [p + o for p in inner], nrm, depth, back)


def _frame_of(axis):
    """Two unit vectors perpendicular to `axis`, (X, Y) with X x Y = axis (counter-clockwise round it)."""
    Z = V(axis).normalized()
    X = Z.cross(UP) if abs(Z.z) < 0.95 else Z.cross(V((1, 0, 0)))
    X.normalize()
    return X, Z.cross(X).normalized(), Z


def _lathe3(mat, collide, c, X, Y, Z, prof, segs=8, cap0=True, cap1=False, rot=0.0):
    """An elliptical lathe in any frame: prof = [(rx, ry, z)] bottom to top along Z (X x Y = Z); rx = ry = 0 makes a
    point; cap0 closes the first ring (facing -Z), cap1 the last (+Z); rot turns the rings (a fraction of a segment)."""
    c = V(c)
    verts, idx = [], []
    for rx, ry, z in prof:
        if rx <= 0 and ry <= 0:
            idx.append([len(verts)] * segs)
            verts.append(c + Z * z)
        else:
            idx.append(list(range(len(verts), len(verts) + segs)))
            verts += [c + X * (rx * math.cos(2 * math.pi * (i + rot) / segs)) + Y * (ry * math.sin(2 * math.pi * (i + rot) / segs))
                      + Z * z for i in range(segs)]
    faces = []
    for kk in range(len(idx) - 1):
        A, B = idx[kk], idx[kk + 1]
        for i in range(segs):
            j = (i + 1) % segs
            f = [A[i], A[j], B[j], B[i]]
            f = [q for n_, q in enumerate(f) if q not in f[:n_]]
            if len(f) >= 3:
                faces.append(tuple(f))
    if cap0 and len(set(idx[0])) > 2:
        faces.append(tuple(reversed(idx[0])))
    if cap1 and len(set(idx[-1])) > 2:
        faces.append(tuple(idx[-1]))
    k.add(mat, collide, verts, faces)


def _vlathe(mat, collide, c, prof, segs=8, cap0=True, cap1=False, rot=0.0):
    """A round lathe standing up at c: prof = [(r, z)]."""
    _lathe3(mat, collide, c, V((1, 0, 0)), V((0, 1, 0)), UP, [(r, r, z) for r, z in prof], segs, cap0, cap1, rot)


def _dome(mat, c, axis, r, h, segs=6):
    """A low round boss (a knob, a plate): a dome from a ring of radius r on c up to h along axis."""
    X, Y, Z = _frame_of(axis)
    _lathe3(mat, False, c, X, Y, Z, [(r, r, 0), (r * 0.72, r * 0.72, h * 0.6), (0, 0, h)], segs=segs, cap0=False)


def _ring(mat, c, axis, R, r, segs=8, sides=3):
    """A small torus (a ring pull, a knocker): radius R round axis, tube radius r."""
    X, Y, _ = _frame_of(axis)
    pts = [V(c) + (X * math.cos(2 * math.pi * i / segs) + Y * math.sin(2 * math.pi * i / segs)) * R for i in range(segs + 1)]
    sb.tube(mat, False, pts, [r] * (segs + 1), segs=sides)


# ---------------------------------------------------------------- signs

def lozenge_tablet(c, facing, s, sign, rng=None, hang=0.12, tall=None, tilt_deg=8.0, thick=0.03, mat="timber"):
    """A lozenge (a square standing on one corner) name tablet hung under an eave: centre c (x, y, z), its face toward
    `facing` (plan vector), its diagonals s wide and s tall (about 0.4 m), its one character (atlas cell `sign`)
    upright in it, a raised frame with thickness, a short hanger rod up `hang` m from its top corner to the beam.
    The cell's mid-edges go to the lozenge's corners, so the character drawn upright in its square stands upright.
    tall: the upright diagonal if it differs (choice; the needs list reads the painted ones about 0.4 x 0.3 m);
    tilt_deg: the face leans out at its top so it looks a little down at the street (choice: 8 deg)."""
    f = _fv(facing)
    sd = V((-f.y, f.x, 0))                          # the viewer's right (the face seen along -f)
    tl = math.radians(tilt_deg)
    up = UP * math.cos(tl) + f * math.sin(tl)
    fn = f * math.cos(tl) - UP * math.sin(tl)       # the face's normal
    C = V(c)
    hw, hh = s / 2, (tall or s) / 2
    ring = [C - sd * hw, C - up * hh, C + sd * hw, C + up * hh]      # left, bottom, right, top corners
    _plate(mat, False, ring, fn, thick, front=False)
    uv = cell_uv(sign)
    face = [p + fn * 0.002 for p in ring]
    if uv:
        (u0, vb), (u1, _), (_, vt), _ = uv
        um, vm = (u0 + u1) / 2, (vb + vt) / 2
        _face(*face, sign, uv=[(u0, vm), (um, vb), (u1, vm), (um, vt)])
    else:
        _face(*face, sign)
    # the raised frame: a mitred lozenge band fw wide, standing 1.2 cm proud
    fw = min(0.032, 0.14 * min(hw, hh))
    kin = 1 - fw * math.hypot(hw, hh) / (hw * hh)
    outer = [C + (p - C) * 1.025 + fn * 0.012 for p in ring]
    inner = [C + (p - C) * kin + fn * 0.012 for p in ring]
    _frame_ring(mat, False, outer, inner, fn, 0.012 + thick * 0.5)
    # the hanger: an iron rod from a small block on the top corner straight up to the beam
    top = C + up * (hh * 1.025)
    _member(mat, False, top - up * 0.03, top + up * 0.025, sd, 0.05, 0.05, 0.008)
    sb.cyl("iron", False, top + up * 0.02, top + UP * hang, 0.007, segs=5, caps=False)


def wall_board(p_left, p_right, z0, z1, sign, rng, thick=0.05, top="flat", mat="timber"):
    """A narrow signboard fixed to a column or wall (no posts of its own): the board from p_left to p_right (its face
    toward the right of p_left -> p_right, i.e. the viewer) between z0 and z1, characters top to bottom from the
    atlas cell `sign`, in a dark frame standing a little proud of it; a cap plank on top (top='flat'). Iron cramps at
    its edges hold it to the column behind; a small sill moulding under its foot."""
    a, b, t, n, L = _seg(p_left, p_right)
    k.board(mat, False, (a.x, a.y), (b.x, b.y), thick, z0, z1)
    o = n * (thick / 2 + 0.003)
    _face(a + o + UP * z0, b + o + UP * z0, b + o + UP * z1, a + o + UP * z1, sign)
    _rect_frame(mat, a, b, z0, z1, n, min(0.032, L * 0.12), 0.03, thick / 2 + 0.014, grow=0.006)
    if top == "flat":
        m = n * 0.012
        _member(mat, False, a - t * 0.045 + m + UP * (z1 + 0.03), b + t * 0.045 + m + UP * (z1 + 0.03), n, thick + 0.07, 0.045, 0.01)
    _member(mat, False, a - t * 0.02 + n * 0.008 + UP * (z0 - 0.02), b + t * 0.02 + n * 0.008 + UP * (z0 - 0.02), n,
            thick + 0.04, 0.04, 0.008)
    for zz in (z0 + 0.14 * (z1 - z0), z1 - 0.14 * (z1 - z0)):     # iron cramps round its edges, back to the column
        for e, s_ in ((a, -1), (b, 1)):
            q = e + t * (s_ * 0.004) + UP * zz
            _member("iron", False, q + n * (thick / 2 + 0.006), q - n * (thick / 2 + 0.07), t, 0.008, 0.035)


def tall_signboard(foot, facing, z0, z1, w, sign, rng, base="splay", post_top=None, thick=0.06, post_w=0.1, mat="timber"):
    """A tall narrow free-standing signboard on one centre post: the post from the ground at foot (x, y, z) up to
    post_top (default z1 + 0.15); the board w wide from z0 to z1 (heights above the foot) fixed to the post's front, its
    face (atlas cell `sign`, characters top to bottom) toward `facing` (plan vector); framed, with a small cap; base
    'splay' = two splayed feet across the face joined by a cross-piece, 'curl' = a carved curled (scroll) foot each
    side. The post and feet collide, so walkers go round it. Size the board by cell_aspect(sign) (the cell is drawn
    at the board's real proportions)."""
    F = V(foot)
    f = _fv(facing)
    sd = V((-f.y, f.x, 0))                          # the viewer's right
    pt = z1 + 0.15 if post_top is None else post_top
    _member(mat, True, F - UP * 0.03, F + UP * pt, f, post_w, post_w, 0.014)
    _vlathe(mat, False, F + UP * pt, [(post_w * 0.62, 0), (post_w * 0.62, 0.03), (post_w * 0.32, 0.06), (post_w * 0.45, 0.1),
                                      (0.0, 0.17)], segs=6, cap0=True)
    # the board, its face, its frame, a sill under it and a capped plank over it
    c = F + f * (post_w / 2 + thick / 2 + 0.004)
    a, b = c - sd * (w / 2), c + sd * (w / 2)
    za, zb = F.z + z0, F.z + z1
    k.board(mat, False, (a.x, a.y), (b.x, b.y), thick, za, zb)
    o = f * (thick / 2 + 0.003)
    _face(a + o + UP * za, b + o + UP * za, b + o + UP * zb, a + o + UP * zb, sign)
    _rect_frame(mat, V((a.x, a.y, 0)), V((b.x, b.y, 0)), za, zb, f, min(0.032, w * 0.12), 0.03, thick / 2 + 0.014, grow=0.006)
    _member(mat, False, a - sd * 0.03 + UP * (za - 0.03), b + sd * 0.03 + UP * (za - 0.03), f, thick + 0.04, 0.05, 0.01)
    _member(mat, False, a - sd * 0.05 + f * 0.005 + UP * (zb + 0.03), b + sd * 0.05 + f * 0.005 + UP * (zb + 0.03), f,
            thick + 0.08, 0.05, 0.01)
    # the little gabled cap: two slopes and two gable ends on the cap plank
    dd, ze, zr = thick / 2 + 0.065, zb + 0.055, zb + 0.055 + 0.07
    ends = [c + f * 0.005 + sd * (s_ * (w / 2 + 0.07)) for s_ in (-1, 1)]
    vs = []
    for e in ends:
        vs += [e + f * dd + UP * (ze - c.z), e - f * dd + UP * (ze - c.z), e + UP * (zr - c.z)]
    faces = [(0, 3, 5, 2), (1, 2, 5, 4), (0, 2, 1), (3, 4, 5), (0, 1, 4, 3)]
    if _newell([vs[i] for i in faces[2]]).dot(-sd) < 0:
        faces = [tuple(reversed(fc)) for fc in faces]
    k.add("roof", False, vs, faces)
    # the base
    if base == "curl":
        _member(mat, True, F - UP * 0.01, F + UP * 0.13, f, post_w + 0.09, post_w + 0.08, 0.015)
        prof = [(0.0, 0.0), (0.27, 0.0), (0.315, 0.012), (0.34, 0.045), (0.332, 0.082), (0.305, 0.1), (0.278, 0.092),
                (0.268, 0.068), (0.24, 0.07), (0.17, 0.09), (0.11, 0.135), (0.07, 0.21), (0.045, 0.3), (0.0, 0.42)]
        for s_ in (-1, 1):
            pts = [F + sd * (s_ * (post_w / 2 - 0.01 + x)) + UP * zz for x, zz in prof]
            _slab(mat, True, pts, f, 0.07)
    else:
        L1, zl = 0.36, 0.5                                 # painted: the feet spread from about 0.35-0.5 m up
        _member(mat, True, F - sd * L1 + UP * 0.045, F + sd * L1 + UP * 0.045, f, 0.13, 0.09, 0.015)
        _member(mat, True, F - f * 0.2 + UP * 0.035, F + f * 0.26 + UP * 0.035, sd, 0.1, 0.07, 0.012)
        for s_ in (-1, 1):
            e = F + sd * (s_ * L1)
            _member(mat, False, e - sd * (s_ * 0.03) + UP * 0.05, e + sd * (s_ * 0.04) + UP * 0.13, f, 0.12, 0.05, 0.008)
            top, low = F + sd * (s_ * post_w * 0.45) + UP * zl, F + sd * (s_ * (L1 - 0.09)) + UP * 0.08
            _member(mat, True, top, low, f, 0.07, 0.065, 0.01)
        zx = 0.24
        tt = (zl - zx) / (zl - 0.08)
        x = post_w * 0.45 + (L1 - 0.09 - post_w * 0.45) * tt
        _member(mat, False, F - sd * x + UP * zx, F + sd * x + UP * zx, f, 0.05, 0.05, 0.008)


# ---------------------------------------------------------------- 赵太丞家's furniture

def medicine_rack(p0, p1, z, h, d, rng, rows=3, cols=8, jars=6, mat="timber", front_mat="redwood"):
    """A rack of small drawers standing on a counter top at z from p0 to p1, its depth d to the left of p0 -> p1 (as
    kit_inner_city.counter), h tall: each drawer its own framed front with a knob, a few small lidded jars and boxes on
    its top. The drawer fronts face the right of p0 -> p1 (the counter's front)."""
    a, b, t, n, L = _seg(p0, p1)
    e = 0.022
    for p, s_ in ((a, 1), (b, -1)):                 # end boards
        q = p + t * (s_ * e / 2)
        r = q - n * d
        k.board(mat, False, (q.x, q.y), (r.x, r.y), e, z, z + h)
    mid = -n * (d / 2)
    _member(mat, False, a - t * 0.02 + mid + n * 0.012 + UP * (z + h + 0.015), b + t * 0.02 + mid + n * 0.012 + UP * (z + h + 0.015),
            n, d + 0.03, 0.03, 0.008)                # the top, overhanging the front
    _member(mat, False, a + t * e + mid - n * 0.01 + UP * (z + 0.03), b - t * e + mid - n * 0.01 + UP * (z + 0.03), n, d - 0.02, 0.06)
    pa, pb = a + t * e - n * (d - 0.012), b - t * e - n * (d - 0.012)
    sb.quad("interior", False, pa + UP * z, pb + UP * z, pb + UP * (z + h), pa + UP * (z + h))
    # the dividers: rails and stiles standing a little proud, each drawer front recessed between them
    x0, x1, zb, zt = e, L - e, z + 0.06, z + h
    cw, rh = (x1 - x0) / cols, (zt - zb) / rows
    for i in range(rows + 1):
        zz = zb + rh * i
        _member(mat, False, a + t * x0 + UP * zz - n * 0.01, a + t * x1 + UP * zz - n * 0.01, n, 0.03, 0.016)
    for j in range(cols + 1):
        xx = x0 + cw * j
        _member(mat, False, a + t * xx + UP * zb - n * 0.01, a + t * xx + UP * zt - n * 0.01, n, 0.03, 0.014)
    for i in range(rows):
        for j in range(cols):
            s0, s1 = x0 + cw * j + 0.011, x0 + cw * (j + 1) - 0.011
            z_0, z_1 = zb + rh * i + 0.011, zb + rh * (i + 1) - 0.011
            ring = [a + t * s0 + UP * z_0, a + t * s1 + UP * z_0, a + t * s1 + UP * z_1, a + t * s0 + UP * z_1]
            _plate(front_mat, False, [p + n * 0.001 for p in ring], n, 0.02, back=False)
            _dome("iron", a + t * ((s0 + s1) / 2) + n * 0.001 + UP * ((z_0 + z_1) / 2 + rh * 0.08), n, 0.011, 0.016, segs=5)
    # small jars (green and red glaze, a paper cover tied on) and lidded boxes on its top
    ztop = z + h + 0.03
    for i in range(jars):
        s = L * (i + 0.5) / jars + rng.uniform(-0.03, 0.03)
        p = a + t * s - n * (d * 0.5 + rng.uniform(-0.04, 0.04)) + UP * ztop
        if i % 3 != 2:
            r, hh = rng.uniform(0.045, 0.06), rng.uniform(0.11, 0.16)
            rot = rng.uniform(0, 1)
            _vlathe("jar_green" if i % 2 == 0 else "jar_red", False, p,
                    [(r * 0.68, 0), (r, hh * 0.38), (r * 0.92, hh * 0.72), (r * 0.55, hh * 0.85)], segs=6, rot=rot)
            _vlathe("cloth_white", False, p + UP * (hh * 0.85), [(r * 0.62, 0), (r * 0.66, hh * 0.08), (0.0, hh * 0.16)], segs=6,
                    cap0=False, rot=rot)
        else:
            bw, bd, bh = rng.uniform(0.12, 0.16), rng.uniform(0.09, 0.12), rng.uniform(0.06, 0.09)
            _member(mat, False, p, p + UP * bh, t, bw, bd, 0.006)
            _member(front_mat, False, p + UP * (bh - 0.004), p + UP * (bh + 0.018), t, bw + 0.012, bd + 0.012, 0.004)


def armchair(x, y, z, facing_deg, rng, cloth=True, mat="timber", cloth_mat="cloth_white"):
    """A Song armchair at real size, facing_deg the way a sitter looks: seat 0.48 m, a curved top rail about 1.05 m
    with its ends turned up and out past the back posts, a slatted back (two curved slats, as painted), arms over the
    front posts, stretchers, a cloth over the seat hanging down its front. Never collides (a seated figure)."""
    with k.placed(k.frame(x, y, z, facing_deg)):         # local: the sitter looks along +x
        zs, hx, hy = 0.48, 0.21, 0.26
        xb = lambda zz: -hx - 0.05 * max(0.0, zz - zs) / (1.0 - zs)     # the back posts' rake
        for s in (-1, 1):
            sb.tube(mat, False, [(-hx, s * hy, 0.0), (-hx, s * hy, zs), (xb(1.0), s * (hy - 0.01), 1.0)], [0.021, 0.02, 0.018], segs=6)
            sb.tube(mat, False, [(hx, s * hy, 0.0), (hx, s * hy, 0.69)], [0.021, 0.018], segs=6)
            sb.tube(mat, False, [(xb(0.7) - 0.005, s * hy, 0.7), (0.0, s * (hy + 0.012), 0.716), (hx, s * (hy + 0.012), 0.706),
                                 (hx + 0.055, s * (hy + 0.014), 0.675)], [0.016, 0.016, 0.016, 0.012], segs=5)
            sb.tube(mat, False, [(-hx, s * hy, 0.15), (hx, s * hy, 0.15)], [0.011, 0.011], segs=5)
            _member(mat, False, (-hx, s * hy, zs - 0.07), (hx, s * hy, zs - 0.07), (0, 1, 0), 0.018, 0.05)
        # the top rail: bowed back in plan, its ends turned up and out past the posts
        ys = [-0.37, -0.345, -0.3, -0.25, -0.13, 0.0, 0.13, 0.25, 0.3, 0.345, 0.37]
        pts, rr = [], []
        for yy in ys:
            ay = abs(yy)
            if ay <= 0.25:
                xx, zz = xb(1.0) - 0.028 * (1 - (ay / 0.25) ** 2), 1.0 + 0.012 * (ay / 0.25)
            else:
                q = (ay - 0.25) / 0.12
                xx, zz = xb(1.0) + 0.03 * q, 1.012 + 0.03 * q + 0.07 * q ** 3
            pts.append((xx, yy, zz + 0.02))
            rr.append(0.022 if ay < 0.28 else 0.022 - 0.012 * (ay - 0.28) / 0.09)
        sb.tube(mat, False, pts, rr, segs=6)
        for zz in (0.72, 0.86):                          # the back's two curved slats
            ys2 = [-hy, -0.12, 0.0, 0.12, hy]
            sb.tube(mat, False, [(xb(zz) - 0.016 * (1 - (yy / hy) ** 2), yy, zz + 0.012 * (1 - (yy / hy) ** 2)) for yy in ys2],
                    [0.014] * 5, segs=4)
        _member(mat, False, (-hx - 0.03, 0, zs - 0.02), (hx + 0.03, 0, zs - 0.02), (0, 1, 0), 2 * hy + 0.06, 0.04, 0.01)
        _member(mat, False, (hx, -hy, zs - 0.07), (hx, hy, zs - 0.07), (1, 0, 0), 0.018, 0.06)
        sb.tube(mat, False, [(hx, -hy, 0.07), (hx, hy, 0.07)], [0.012, 0.012], segs=5)
        sb.tube(mat, False, [(-hx, -hy, 0.21), (-hx, hy, 0.21)], [0.011, 0.011], segs=5)
        if cloth:
            # a cloth laid over the seat, rumpled, hanging a little down its front in folds (alternate columns in and
            # out), its hem uneven; it stops short of the seat's sides as painted
            ycols = [-0.24, -0.16, -0.08, 0.0, 0.08, 0.16, 0.24]
            rows = [(-hx + 0.02, zs + 0.006), (0.03, zs + 0.016), (hx + 0.034, zs + 0.0), (hx + 0.05, zs - 0.07),
                    (hx + 0.055, zs - 0.14)]
            verts = []
            for ri, (xx, zz) in enumerate(rows):
                for ci, yy in enumerate(ycols):
                    fold = (0.016 if ci % 2 else -0.006) * (ri >= 3)
                    rumple = rng.uniform(-0.006, 0.01) if ri == 1 else 0.0
                    verts.append(V((xx + fold + (rng.uniform(-0.006, 0.006) if ri >= 3 else 0.0), yy,
                                    zz + rumple + (rng.uniform(-0.03, 0.015) if ri == 4 else 0.0))))
            nc = len(ycols)
            faces = [(r * nc + c, (r + 1) * nc + c, (r + 1) * nc + c + 1, r * nc + c + 1) for r in range(len(rows) - 1) for c in range(nc - 1)]
            k.add(cloth_mat, False, verts, faces)


def footrest(x, y, z, facing_deg, w=0.55, d=0.32, h=0.16, mat="timber", edge_mat="lattice"):
    """A low footrest (脚踏): a framed top with thick dark edges (a mitred frame round an inset panel) on four short
    feet standing on a low base frame; w across the facing, d along it. Never collides."""
    with k.placed(k.frame(x, y, z, facing_deg)):
        hx, hy, fw = d / 2, w / 2, 0.045
        rect = lambda ex, ey, zz: [V((-hx - ex, -hy - ey, zz)), V((hx + ex, -hy - ey, zz)), V((hx + ex, hy + ey, zz)), V((-hx - ex, hy + ey, zz))]
        _frame_ring(edge_mat, False, rect(0, 0, h), rect(-fw, -fw, h), UP, 0.055)
        sb.quad(mat, False, *rect(-fw, -fw, h - 0.012))
        for sx in (-1, 1):
            for sy in (-1, 1):
                _member(edge_mat, False, (sx * (hx - 0.03), sy * (hy - 0.03), 0.03), (sx * (hx - 0.03), sy * (hy - 0.03), h - 0.05),
                        (1, 0, 0), 0.04, 0.04)
        _frame_ring(edge_mat, False, rect(0.005, 0.005, 0.03), rect(-0.035, -0.035, 0.03), UP, 0.03)


def lattice_stand(lo_a, lo_b, hi_a, hi_b, rng, cols=5, rows=4, collide=False, mat="timber", bar_mat="lattice"):
    """A small rectangular lattice panel set slanting: its lower edge lo_a -> lo_b on the ground, its upper edge
    hi_a -> hi_b raised (each point (x, y, z)); a frame of four bars round an inner grid, a short prop under the raised
    edge."""
    A, B, C, D = V(lo_a), V(lo_b), V(hi_b), V(hi_a)
    nr = (B - A).cross(D - A).normalized()
    fw, dp = 0.032, 0.028
    In = [A + (B - A).normalized() * fw + (D - A).normalized() * fw, B + (A - B).normalized() * fw + (C - B).normalized() * fw,
          C + (D - C).normalized() * fw + (B - C).normalized() * fw, D + (C - D).normalized() * fw + (A - D).normalized() * fw]
    o = nr * (dp / 2)
    _frame_ring(mat, collide, [p + o for p in (A, B, C, D)], [p + o for p in In], nr, dp, back=True)
    for i in range(1, cols):
        _member(bar_mat, False, In[0].lerp(In[1], i / cols), In[3].lerp(In[2], i / cols), nr, 0.016, 0.015)
    for j in range(1, rows):
        _member(bar_mat, False, In[0].lerp(In[3], j / rows), In[1].lerp(In[2], j / rows), nr, 0.016, 0.015)
    # the prop: a short stick from the ground, a little out past the raised edge, up under its middle
    top = (C + D) / 2 - (D - A).normalized() * 0.02 - nr * (dp / 2 + 0.012) * (1 if nr.z > 0 else -1)
    out = V((D.x - A.x, D.y - A.y, 0))
    out = out.normalized() * 0.07 if out.length > 1e-6 else V((0, 0, 0))
    zg = min(A.z, B.z)
    sb.cyl(mat, collide, V((top.x, top.y, zg - 0.01)) + out, top, 0.016, 0.013, segs=5, caps=False)


# ---------------------------------------------------------------- the gate hall (门屋) of 官宦人家

def plain_leaf(hinge, free, z0, z1, swing_deg, rng, knocker=True, collide=True, mat="deck", frame_mat="timber",
               knocker_at=0.5, thick=0.045):
    """A light plain door leaf: closed it spans hinge -> free (x, y), swung open by swing_deg about the hinge
    (counter-clockwise seen from above), z0 to z1: vertical boards in a frame with two battens, a ring knocker on its
    face. The face (the frame, the knocker) is the right of hinge -> free when shut, turned with the leaf; the battens
    (three, and a diagonal brace) are on its back; a round pivot stile at the hinge."""
    Hh = V((hinge[0], hinge[1], 0))
    t = V((free[0], free[1], 0)) - Hh
    W = t.length
    t.normalize()
    an = math.radians(swing_deg)
    d = V((t.x * math.cos(an) - t.y * math.sin(an), t.x * math.sin(an) + t.y * math.cos(an), 0))
    nl = V((d.y, -d.x, 0))
    Hg = z1 - z0
    m = max(3, round(W / 0.22))
    for i in range(m):
        s0, s1 = W * i / m + (0.004 if i else 0.03), W * (i + 1) / m - 0.004
        pa, pb = Hh + d * s0, Hh + d * s1
        k.board(mat, collide, (pa.x, pa.y), (pb.x, pb.y), thick, z0 + 0.01, z1 - rng.uniform(0.0, 0.012))
    _rect_frame(frame_mat, Hh + d * 0.03, Hh + d * W, z0 + 0.01, z1 - 0.012, nl, 0.075, 0.022, thick / 2 + 0.016)
    ib = -nl * (thick / 2 + 0.014)
    zs = [z0 + 0.17 * Hg, z0 + 0.52 * Hg, z0 + 0.86 * Hg]
    for zz in zs:
        _member(frame_mat, False, Hh + d * 0.07 + UP * zz + ib, Hh + d * (W - 0.05) + UP * zz + ib, nl, 0.028, 0.1, 0.006)
    _member(frame_mat, False, Hh + d * (W - 0.1) + UP * (zs[0] + 0.05) + ib * 0.9, Hh + d * 0.12 + UP * (zs[1] - 0.05) + ib * 0.9,
            nl, 0.022, 0.075)
    sb.cyl(frame_mat, False, Hh + d * 0.03 + UP * (z0 - 0.04), Hh + d * 0.03 + UP * (z1 + 0.06), 0.036, segs=6)
    if knocker:
        p = Hh + d * (W * 0.76) + nl * (thick / 2 + 0.003) + UP * (z0 + knocker_at * Hg)
        _dome("iron", p, nl, 0.05, 0.024, segs=8)
        _ring("iron", p + nl * 0.03 - UP * 0.052, nl, 0.048, 0.007, segs=8, sides=3)


def low_partition(p0, p1, z0, h, rng, rails=(0.1, 0.38, 0.72, 1.0), post_to=None, post_at=0.5):
    """A low railed partition (the lower half of a back door, or a screen) from p0 to p1 (x, y), standing at z0, h tall:
    end posts, rails at the given fractions of h, slats between the bottom and the middle rail; post_to: a post from
    its top rail up to z = post_to at fraction post_at along it (fixed to the lintel). Collides.
    'The middle rail' is the second from the bottom: the slats fill the band between the lowest two rails (the scan's
    partition, rails at fractions 0.06, 0.6, 0.78, 0.98: slats in its tall lower band). A sill lies under it."""
    a, b, t, n, L = _seg(p0, p1)
    a, b = a + UP * z0, b + UP * z0
    rs = sorted(rails)
    for p in (a, b):
        _member("timber", True, p - UP * 0.02, p + UP * (h + 0.035), t, 0.07, 0.07, 0.01)
    _member("timber", True, a - t * 0.03 + UP * 0.025, b + t * 0.03 + UP * 0.025, n, 0.09, 0.05, 0.01)
    for i, r in enumerate(rs):
        top = i == len(rs) - 1
        zz = min(r * h, h - 0.025) if top else max(r * h, 0.07)
        _member("timber", top, a + t * 0.03 + UP * zz, b - t * 0.03 + UP * zz, n, 0.05 if top else 0.04, 0.05 if top else 0.04,
                0.008 if top else 0.0)
    if len(rs) >= 2:
        za, zb = max(rs[0] * h, 0.07) + 0.02, rs[1] * h - 0.02
        m = max(3, int(L / 0.11))
        for i in range(1, m):
            q = a + t * (L * i / m + rng.uniform(-0.008, 0.008))
            _member("timber", False, q + UP * za, q + UP * zb, n, 0.02, 0.034)
    if post_to is not None:
        q = a.lerp(b, post_at)
        _member("timber", False, q + UP * (h - 0.02), V((q.x, q.y, post_to)), t, 0.065, 0.065, 0.008)


def patterned_front(p0, p1, z0, z1, rng, door=(0.55, 0.09, 0.45), mat="timber"):
    """The main hall's front (S7.bld.main_hall_1300): a panel from p0 to p1 (x, y; its face toward the right of
    p0 -> p1) between z0 and z1 covered with rows of small dark repeated motifs (atlas cell 'curtain_motifs': a
    patterned curtain or screen), framed by posts at both ends and a beam on top; in its lower middle a dark upright
    doorway (door = (centre fraction along p0 -> p1, width fraction, height fraction of z1 - z0)) with a thin curved tie
    running out to both sides from its top. The wall behind collides. The cell is tiled so its motifs keep their
    drawn proportions: 14 columns across the panel (as painted), as many rows of cells up it as its height takes (a
    panel wider than three times its height takes the cell more than once across)."""
    a, b, t, n, L = _seg(p0, p1)
    H = z1 - z0
    k.board("plaster", True, (a.x, a.y), (b.x, b.y), 0.1, z0, z1)
    fz = n * 0.054
    A = cell_aspect("curtain_motifs", 3.0)
    nx = max(1, round(L / (A * H)))
    ny = max(1, round(H / (L / nx / A)))
    for i in range(nx):
        pa, pb = a.lerp(b, i / nx) + fz, a.lerp(b, (i + 1) / nx) + fz
        for j in range(ny):
            za, zb = z0 + H * j / ny, z0 + H * (j + 1) / ny
            _face(pa + UP * za, pb + UP * za, pb + UP * zb, pa + UP * zb, "curtain_motifs")
    for p in (a, b):
        _member(mat, True, p + n * 0.02 + UP * (z0 - 0.02), p + n * 0.02 + UP * (z1 + 0.02), t, 0.15, 0.15, 0.02)
    _member(mat, False, a - t * 0.12 + n * 0.03 + UP * (z1 + 0.09), b + t * 0.12 + n * 0.03 + UP * (z1 + 0.09), n, 0.17, 0.18, 0.02)
    _member(mat, False, a + n * 0.03 + UP * (z0 + 0.04), b + n * 0.03 + UP * (z0 + 0.04), n, 0.14, 0.08, 0.012)
    # the doorway: dark, a frame round it, a few lattice bars across it
    fc, fwid, fh = door
    m = a + t * (L * fc)
    dw, dh = fwid * L, fh * H
    da, db = m - t * (dw / 2), m + t * (dw / 2)
    zt = z0 + dh
    dz = fz + n * 0.004
    sb.quad("interior", False, da + dz + UP * z0, db + dz + UP * z0, db + dz + UP * zt, da + dz + UP * zt)
    _rect_frame(mat, da, db, z0 + 0.06, zt, n, -0.04, 0.03, 0.074)
    for i in range(1, 4):
        q = da.lerp(db, i / 4) + dz + n * 0.008
        _member("lattice", False, q + UP * (z0 + 0.08), q + UP * (zt - 0.01), n, 0.012, 0.014)
    # the tie: a thin curved dark line from the doorway's top out to both sides, ending in small curls; its shape in
    # units of the door's width (the painted door is 17 x 32 px: v in units of the painted door height, 1.88 widths),
    # so a doorway made taller than painted keeps the painted tie
    side = [(0.0, 0.05), (0.6, 0.12), (1.3, 0.1), (1.9, -0.05), (2.2, -0.25), (2.15, -0.38), (1.97, -0.37), (1.95, -0.27)]
    hp = min(dh, 1.88 * dw)
    pts = [m - t * (dw * u) + UP * (zt + hp * v) for u, v in reversed(side)] + [m + t * (dw * u) + UP * (zt + hp * v) for u, v in side[1:]]
    sb.tube("lattice", False, [p + fz + n * 0.012 for p in pts], [min(0.013, hp * 0.03)] * len(pts), segs=3)


def roof_vent(x, y, z_base, w=0.38, d=0.3, h=1.1, rng=None):
    """A tall narrow pale box (a chimney or vent) with a small overhanging cap standing on a roof: z_base is the roof
    surface at its downhill face; its body runs 0.4 m below z_base so it sits on any slope. A tiled skirt where it
    meets the roof, a dark band and vent slots under the cap, the cap a thick slab under a low pyramid."""
    P = V((x, y, 0))
    X, Y = V((1, 0, 0)), V((0, 1, 0))
    _member("plaster", False, P + UP * (z_base - 0.4), P + UP * (z_base + h), Y, d, w, 0.02)
    _member("roof", False, P + UP * (z_base - 0.4), P + UP * (z_base + 0.07), Y, d + 0.06, w + 0.06, 0.015)
    zt = z_base + h
    _member("timber", False, P + UP * (zt - 0.14), P + UP * (zt - 0.07), Y, d + 0.03, w + 0.03, 0.006)
    for s_ in (-1, 1):                                   # vent slots on the two broad faces
        o = X * (s_ * (w / 2 + 0.002))
        za, zb = zt - 0.32, zt - 0.18
        c0, c1 = P + o - Y * (d * 0.3), P + o + Y * (d * 0.3)
        q = [c0 + UP * za, c1 + UP * za, c1 + UP * zb, c0 + UP * zb]
        sb.quad("interior", False, *(q if s_ > 0 else q[::-1]))
    e = 0.07
    ring = [P + V((-w / 2 - e, -d / 2 - e, zt + 0.06)), P + V((w / 2 + e, -d / 2 - e, zt + 0.06)), P + V((w / 2 + e, d / 2 + e, zt + 0.06)),
            P + V((-w / 2 - e, d / 2 + e, zt + 0.06))]
    under = [p - UP * 0.06 for p in ring]
    k.prism("roof", False, under, ring, cap_top=False, cap_bottom=True)
    apex = P + UP * (zt + 0.06 + 0.1 + 0.15 * min(w, d))
    for i in range(4):
        sb.B.add("roof", False, [ring[i], ring[(i + 1) % 4], apex], [(0, 1, 2)])


# ---------------------------------------------------------------- at the 解 building and the well's west end

def slatted_tub(x, y, z, r, h, rng, lid="lattice", ring_dir=(1, 0), hoops=3, band=0.15):
    """A tall tub of vertical staves bound with hoops, a lattice lid (a framed grid) on top, an iron ring fitting on
    its face toward ring_dir. Collides (one hidden cylinder). Each stave is its own slightly bowed piece (the joints
    draw the ink); lid='lattice' a framed diagonal grid over a dark inside, anything else a plain board lid.
    lid='band', or 'lattice' on a tub taller than 1.8 m (its lid above the eye, as the restyle's reading (a) paints
    it): the lattice also runs as an openwork band round its top (`band` of its height): diagonal bars standing proud
    of a dark lining between two hoops; the other hoops stay below it."""
    C = V((x, y, z))
    ns = max(12, round(2 * math.pi * r / 0.11))
    th, bow = 0.03, r * 0.035
    hs = 16                                               # hoops, rim and lining: 16 sides
    gap = 0.003 / r
    rad = lambda zz: r * (0.965 + 0.035 * math.sin(math.pi * min(1.0, max(0.0, zz / h)))) + bow * math.sin(math.pi * min(1.0, zz / h))
    for i in range(ns):
        a0, a1 = 2 * math.pi * i / ns + gap, 2 * math.pi * (i + 1) / ns - gap
        top = h + rng.uniform(-0.012, 0.006)
        zs = [0.0, top * 0.5, top]
        rings = []
        for zz in zs:
            ro = rad(zz) * (1 + rng.uniform(-0.004, 0.004))
            rings.append([C + V((math.cos(a) * rr, math.sin(a) * rr, zz)) for a, rr in ((a0, ro), (a1, ro), (a1, ro - th), (a0, ro - th))])
        verts = [p for ring in rings for p in ring]
        faces = []
        for kk in range(2):
            o0, o1 = kk * 4, (kk + 1) * 4
            faces += [(o0 + 0, o0 + 1, o1 + 1, o1 + 0), (o0 + 3, o0 + 0, o1 + 0, o1 + 3), (o0 + 1, o0 + 2, o1 + 2, o1 + 1)]
        faces.append((8, 9, 10, 11))
        k.add("timber", False, verts, faces)
    with_band = lid == "band" or (lid == "lattice" and h > 1.8)
    top_q = 1.0 - band - 0.06 if with_band else 0.87
    if hoops == 3 and not with_band:
        fr = (0.07, 0.3, 0.66)
    else:
        fr = tuple(0.07 + (top_q - 0.07) * i / max(1, hoops - 1) for i in range(hoops))
    if with_band:
        _lattice_band(C, rad, hs, h * (1 - band) - 0.01, h - 0.035)
    for q in fr:
        zz = h * q
        sb.cyl("lattice", False, C + UP * (zz - 0.02), C + UP * (zz + 0.02), (rad(zz) + 0.007) / math.cos(math.pi / hs), segs=hs,
               caps=False)
    # the lid: a rim ring (outer wall, top, inner wall) round a dark inside, the lattice across it
    ri, ro = r * 0.965 - th - 0.012, r * 0.965 + 0.012
    zl = h + 0.005
    _vlathe("timber", False, C + UP * zl, [(ro, 0.0), (ro, 0.045), (ri, 0.045), (ri, 0.0)], segs=16, cap0=False)
    _vlathe("interior", False, C + UP * (zl + 0.004), [(ri + 0.004, 0.0), (0.0, 0.0)], segs=12, cap0=False)
    if lid in ("lattice", "band") and not (with_band and h > 1.8):     # a lid above the eye: plain boards
        sp = 0.11
        K = int(ri / sp)
        for ang in (math.pi / 4, -math.pi / 4):
            u, v = V((math.cos(ang), math.sin(ang), 0)), V((-math.sin(ang), math.cos(ang), 0))
            for j in range(-K, K + 1):
                cc = j * sp
                half = math.sqrt(max(0.0, ri * ri - cc * cc)) + 0.004
                if half < 0.04:
                    continue
                q = C + v * cc + UP * (zl + 0.03 + (0.004 if ang > 0 else 0.0))
                _member("timber", False, q - u * half, q + u * half, UP, 0.024, 0.022)
    else:
        _vlathe("timber", False, C + UP * (zl + 0.02), [(ri + 0.01, 0.0), (ri + 0.01, 0.03)], segs=16, cap0=False, cap1=True)
    # the iron ring fitting on its face
    rd = _fv(ring_dir)
    zr = h * 0.8
    p = C + rd * (rad(zr) + 0.004) + UP * zr
    _dome("iron", p, rd, 0.045, 0.02, segs=6)
    _ring("iron", p + rd * 0.022 - UP * 0.048, rd, 0.042, 0.007, segs=8, sides=3)
    sb.cyl("hidden", True, C, C + UP * h, r, segs=8)


def _lattice_band(C, rad, ns, z0, z1, mat="timber"):
    """An openwork diagonal lattice band round a round body (radius rad(z) at height z above C) between z0 and z1:
    a dark lining, bars at 45 deg each way standing 1.2 cm proud as flat strips (each bent once to follow the
    curve), a hoop at each edge."""
    hb = z1 - z0
    cs = 1 / math.cos(math.pi / ns)                       # circumscribed: the flat sides clear the staves
    sb.cyl("interior", False, C + UP * z0, C + UP * z1, (rad((z0 + z1) / 2) + 0.004) * cs, segs=ns, caps=False)
    R = rad((z0 + z1) / 2) * cs + 0.016
    nb = max(8, round(2 * math.pi * R / 0.15))
    span = hb / R                                        # 45 deg bars
    wbar = 0.022
    for i in range(nb):
        for sgn in (1, -1):
            a0 = 2 * math.pi * i / nb
            pts = [(a0 + sgn * span * q, z0 + hb * q) for q in (0.0, 0.5, 1.0)]
            P = [C + V((math.cos(a) * R, math.sin(a) * R, zz)) for a, zz in pts]
            verts, faces = [], []
            for kk, (a, zz) in enumerate(pts):
                radial = V((math.cos(a), math.sin(a), 0))
                d = (P[min(kk + 1, 2)] - P[max(kk - 1, 0)]).normalized()
                cr = d.cross(radial).normalized() * (wbar / 2)
                verts += [P[kk] - cr, P[kk] + cr]
            for kk in range(2):
                f = (2 * kk, 2 * kk + 1, 2 * kk + 3, 2 * kk + 2)
                nrm = (verts[f[1]] - verts[f[0]]).cross(verts[f[2]] - verts[f[1]])
                faces.append(f if nrm.dot(V((math.cos(pts[kk][0]), math.sin(pts[kk][0]), 0))) > 0 else tuple(reversed(f)))
            k.add(mat, False, verts, faces)
    for zz in (z0, z1):
        sb.cyl("lattice", False, C + UP * (zz - 0.02), C + UP * (zz + 0.02), R + 0.004, segs=ns, caps=False)


def hooped_bucket(x, y, z, r, h, rng, hoops=3, bail=True, lid=False, knob=False, taper=0.9, mat="timber", collide=False):
    """A tall wooden water bucket, taller than wide: staves and hoops, slightly tapered (top radius r * taper), an
    arched bail handle, an optional lid with a knob. The bail as painted: two ear staves rising past the rim, a round
    cross-bar between them. Open, the rim has thickness and a dark inside."""
    C = V((x, y, z))
    rt, th, segs = r * taper, 0.016, 12
    rot = rng.uniform(0, 1)
    rad = lambda zz: r + (rt - r) * zz / h
    if lid:
        _vlathe(mat, collide, C, [(r * 0.96, 0.0), (r, 0.035), (rt, h)], segs=segs, cap1=True, rot=rot)
        _vlathe(mat, False, C + UP * h, [(rt + 0.008, 0.0), (rt + 0.008, 0.022), (rt * 0.92, 0.034)], segs=segs, cap0=True, cap1=True,
                rot=rot)
        if knob:
            _vlathe(mat, False, C + UP * (h + 0.034), [(0.028, 0.0), (0.034, 0.022), (0.016, 0.042), (0.0, 0.05)], segs=6)
    else:
        _vlathe(mat, collide, C, [(r * 0.96, 0.0), (r, 0.035), (rt, h), (rt - th, h), (rt - th, h * 0.8)], segs=segs, rot=rot)
        _vlathe("interior", False, C + UP * (h * 0.8 + 0.003), [(rt - th, 0.0), (0.0, 0.0)], segs=segs, cap0=False, rot=rot)
    for i in range(hoops):
        zz = h * (0.12 + 0.74 * i / max(1, hoops - 1))
        sb.cyl("lattice", False, C + UP * (zz - 0.017), C + UP * (zz + 0.017), rad(zz) + 0.008, segs=segs, caps=False)
    if bail:
        an = 2 * math.pi * rot / segs
        e = V((math.cos(an), math.sin(an), 0))
        tg = V((-e.y, e.x, 0))
        bh = max(0.12, 0.3 * h)
        tops = []
        for s_ in (-1, 1):
            q0 = C + e * (s_ * (rt - th / 2)) + UP * (h * 0.78)
            q1 = C + e * (s_ * (rt - th / 2 - 0.01)) + UP * (h + bh)
            _member(mat, False, q0, q1, tg, 0.055, th + 0.008, 0.004)
            tops.append(q1 - UP * 0.035)
        sb.cyl(mat, False, tops[0] - e * 0.02, tops[1] + e * 0.02, 0.016, segs=6)


def braced_stand(p0, p1, z, h, w, rng, collide=False, mat="timber"):
    """A bench or low table from p0 to p1 (x, y), h tall, w wide: four legs with diagonal braces between them on the
    long sides and a stretcher across each end; aprons under the top."""
    a, b, t, n, L = _seg(p0, p1)
    _member(mat, collide, a + UP * (z + h - 0.025), b + UP * (z + h - 0.025), n, w, 0.05, 0.012)
    legs = {}
    for e, s_ in ((a + t * 0.09, -1), (b - t * 0.09, 1)):
        for side in (-1, 1):
            top = e + n * (side * (w / 2 - 0.05)) + UP * (z + h - 0.05)
            foot = e + n * (side * (w / 2 - 0.035)) + t * (s_ * 0.025) + UP * z
            _member(mat, collide, foot, top, t, 0.05, 0.05, 0.008)
            legs[(s_, side)] = (foot, top)
    for side in (-1, 1):
        fa, ta = legs[(-1, side)]
        fb, tb = legs[(1, side)]
        _member(mat, False, ta - UP * 0.04 + t * 0.02, tb - UP * 0.04 - t * 0.02, n, 0.022, 0.06)      # apron
        _member(mat, False, fa.lerp(ta, 0.16), fb.lerp(tb, 0.82), n, 0.03, 0.045)                      # the brace
    for s_ in (-1, 1):
        fa, ta = legs[(s_, -1)]
        fb, tb = legs[(s_, 1)]
        _member(mat, False, fa.lerp(ta, 0.28), fb.lerp(tb, 0.28), t, 0.03, 0.04)


def reed_panel(foot, top, w, rng, block=True):
    """A narrow densely hatched reed mat or screen leaning at a slant: its foot edge centred at foot (x, y, z), its top
    edge centred at top (x, y, z), w wide across; on a small foot block if block. The mat (a single face, hatched
    along its length) bows a little; bamboo strips bind its long edges, three rope ties cross it."""
    F, T = V(foot), V(top)
    ax = T - F
    Lm = ax.length
    ax.normalize()
    s = ax.cross(UP)
    s = s.normalized() if s.length > 1e-6 else V((1, 0, 0))
    nr = s.cross(ax).normalized()
    secs = [0.0, 0.33, 0.67, 1.0]
    bowv = [0.0, 0.018, 0.016, 0.0]
    ctr = [F + ax * (Lm * q) + nr * bv for q, bv in zip(secs, bowv)]
    for i in range(3):
        u0, u1 = Lm * secs[i], Lm * secs[i + 1]
        p0, p1 = ctr[i], ctr[i + 1]
        sb.quad("reed", False, p0 - s * (w / 2), p0 + s * (w / 2), p1 + s * (w / 2), p1 - s * (w / 2),
                uv=[(u0, 0.0), (u0, w), (u1, w), (u1, 0.0)])
    for e in (-1, 1):
        sb.tube("bamboo", False, [p + s * (e * w / 2) for p in ctr], [0.013] * 4, segs=4)
    for q in (0.16, 0.5, 0.84):
        c = F + ax * (Lm * q) + nr * (0.018 * math.sin(math.pi * q) + 0.008)
        _member("rope", False, c - s * (w / 2 + 0.01), c + s * (w / 2 + 0.01), nr, 0.01, 0.022)
    if block:
        _member("timber", False, F - s * (w / 2 + 0.05) + UP * 0.05 + nr * 0.02, F + s * (w / 2 + 0.05) + UP * 0.05 + nr * 0.02,
                V((nr.x, nr.y, 0)) if abs(nr.z) < 0.99 else V((1, 0, 0)), 0.14, 0.1, 0.015)


def box_shed(sw, se, ne, nw, z_front, z_back, rng, slats=True):
    """A small box-like booth on its footprint corners (x, y): corner posts, a slanted four-sided top (a low lean-to
    roof of boards with an edge trim) falling from z_back at the back to z_front at the front, plank side and back
    walls, and horizontal slats across the front near its foot (0.25-0.55 m). Collides. The front is sw -> se."""
    SW, SE, NE, NW = (V((p[0], p[1], 0)) for p in (sw, se, ne, nw))
    zc = {0: z_front, 1: z_front, 2: z_back, 3: z_back}
    corners = [SW, SE, NE, NW]
    rt, pw = 0.035, 0.08                                   # roof board thickness, post width
    for i, p in enumerate(corners):
        side = (SE - SW) if i in (0, 1) else (NE - NW)
        _member("timber", True, p - UP * 0.03, p + UP * (zc[i] - rt), side, pw, pw, 0.012)
    pl = 0.028

    def wall(p, q, zp, zq, inward):
        L = (q - p).length
        t = (q - p).normalized()
        m = max(2, round(L / 0.22))
        for i in range(m):
            s0, s1 = L * i / m + 0.003, L * (i + 1) / m - 0.003
            a, b = p + t * s0 + inward * (pw / 2 - pl / 2 - 0.004), p + t * s1 + inward * (pw / 2 - pl / 2 - 0.004)
            za, zb = zp + (zq - zp) * s0 / L - rt - 0.01, zp + (zq - zp) * s1 / L - rt - 0.01
            nn = V((t.y, -t.x, 0)) * (pl / 2)
            _box8("deck", True, [a + nn, b + nn, b - nn, a - nn],
                  [a + nn + UP * za, b + nn + UP * zb, b - nn + UP * zb, a - nn + UP * za])

    cen = (SW + SE + NE + NW) / 4
    inw = lambda p, q: (cen - (p + q) / 2 - (q - p).normalized() * (cen - (p + q) / 2).dot((q - p).normalized())).normalized()
    wall(NW, NE, z_back, z_back, inw(NW, NE))
    wall(SW, NW, z_front, z_back, inw(SW, NW))
    wall(SE, NE, z_front, z_back, inw(SE, NE))
    bk = inw(NW, NE)                                      # a dark lining inside the back wall, facing the front
    qa, qb = NW + bk * 0.05, NE + bk * 0.05
    if (qb - qa).cross(UP).dot(bk) < 0:
        qa, qb = qb, qa
    sb.quad("interior", False, qa + UP * 0.02, qb + UP * 0.02, qb + UP * (z_back - 0.1), qa + UP * (z_back - 0.1))
    if slats:
        t = (SE - SW).normalized()
        nf = -inw(SW, SE)
        k.board("deck", True, (SW + t * 0.04).to_2d(), (SE - t * 0.04).to_2d(), 0.03, 0.0, 0.12)
        for zz in (0.29, 0.41, 0.53):
            _member("timber", True, SW + t * 0.04 + nf * 0.01 + UP * zz, SE - t * 0.04 + nf * 0.01 + UP * (zz + rng.uniform(-0.008, 0.008)),
                    nf, 0.03, 0.075)
    # the top: boards running down the slope, overhanging, an edge trim round them
    ov_f, ov_s, ov_b = 0.14, 0.1, 0.06
    tf = (SE - SW).normalized()
    tb = (NE - NW).normalized()
    FL, FR = SW - tf * ov_s, SE + tf * ov_s
    BL, BR = NW - tb * ov_s, NE + tb * ov_s
    dl, dr = (FL - BL).normalized(), (FR - BR).normalized()
    slope = (z_front - z_back) / max(1e-6, ((SW + SE) / 2 - (NW + NE) / 2).length)
    FL, FR = FL + dl * ov_f, FR + dr * ov_f
    BL, BR = BL - dl * ov_b, BR - dr * ov_b
    zF = z_front + slope * ov_f
    zB = z_back - slope * ov_b
    nb = max(3, round((FR - FL).length / 0.24))
    for i in range(nb):
        u0, u1 = i / nb + 0.004, (i + 1) / nb - 0.004
        f0, f1, b0, b1 = FL.lerp(FR, u0), FL.lerp(FR, u1), BL.lerp(BR, u0), BL.lerp(BR, u1)
        zj = rng.uniform(-0.006, 0.006)
        top = [f0 + UP * (zF + zj), f1 + UP * (zF + zj), b1 + UP * (zB + zj), b0 + UP * (zB + zj)]
        _box8("deck", False, [p - UP * rt for p in top], top)
    for p, q, zp, zq in ((FL, FR, zF, zF), (FR, BR, zF, zB), (BR, BL, zB, zB), (BL, FL, zB, zF)):
        dq = (q - p).normalized()
        out = V((dq.y, -dq.x, 0))
        if out.dot((p + q) / 2 - cen) < 0:
            out = -out
        _member("timber", False, p - dq * 0.02 + out * 0.012 + UP * (zp - rt * 0.6), q + dq * 0.02 + out * 0.012 + UP * (zq - rt * 0.6),
                out, 0.03, 0.075, 0.006)


def capped_rail_fence(pts, h, rng, rails=(0.12, 0.5, 0.92), post_every=0.95, collide=True):
    """A low wooden railing along pts (x, y): square posts with flat overhanging caps, three rails at the given
    fractions of h passing through the posts. Each post leans and stands a little differently and each span of rail
    sits a little differently, so no edge is a ruled line; the rails run a little past the end posts.
    Collide: the posts and the top and bottom rails."""
    P = [V((p[0], p[1], 0)) for p in pts]
    posts = []
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        m = max(1, math.ceil((b - a).length / post_every))
        for q in range(m + (1 if i == len(P) - 2 else 0)):
            d = (b - a).normalized()
            posts.append((a.lerp(b, q / m), d))
    tops = []
    for p, d in posts:
        lean = V((rng.uniform(-0.02, 0.02), rng.uniform(-0.02, 0.02), 0))
        zt = h + rng.uniform(-0.015, 0.02)
        _member("timber", collide, p - UP * 0.05, p + lean + UP * zt, d, 0.09, 0.09, 0.012)
        _member("timber", False, p + lean * 1.0 + UP * (zt - 0.005), p + lean * 1.02 + UP * (zt + 0.045), d, 0.135, 0.135, 0.015)
        tops.append((p, lean, zt))
    rs = sorted(rails)
    for i in range(len(tops) - 1):
        (pa, la, _), (pb, lb, _) = tops[i], tops[i + 1]
        d = (pb - pa)
        if d.length < 1e-6:
            continue
        t = d.normalized()
        for j, r in enumerate(rs):
            zz = r * h
            A = pa + la * (zz / h) + UP * (zz + rng.uniform(-0.01, 0.01))
            B = pb + lb * (zz / h) + UP * (zz + rng.uniform(-0.01, 0.01))
            if i == 0:
                A = A - t * 0.07
            if i == len(tops) - 2:
                B = B + t * 0.07
            _member("timber", collide and j in (0, len(rs) - 1), A, B, V((t.y, -t.x, 0)), 0.045, 0.065, 0.0)


# ---------------------------------------------------------------- set-down goods (added by the area agent after QA)

def sack(x, y, z, rng, h=0.8, r=0.3, mat="cloth_white", collide=True):
    """A big cloth sack set down on the ground and tied at the neck (S7.prop.tied_sack_1365, painted 42 x 80 px): a
    soft lumpy body (each ring of its lathe pushed in and out a little, sagging into the ground at its foot), a
    gathered neck under a ruffled mouth, a cord wound round the neck with two short ends hanging. collide: a hidden
    cylinder to 0.95 m, so the walker goes round it instead of climbing it as a step."""
    segs = 12
    prof = [(0.82, 0.0), (0.97, 0.08), (1.0, 0.3), (0.96, 0.5), (0.8, 0.66), (0.42, 0.78), (0.24, 0.84),
            (0.27, 0.9), (0.4, 0.97), (0.3, 1.0)]
    wob = [rng.uniform(-0.06, 0.06) for _ in range(segs)]
    verts, faces = [], []
    for j, (rf, hf) in enumerate(prof):
        for i in range(segs):
            a = 2 * math.pi * i / segs
            k_ = 1.0 + (wob[i] + 0.03 * math.sin(3 * a + j)) * (1.0 if 0 < j < 5 else 0.4)
            rr = r * rf * k_
            verts.append(V((x + math.cos(a) * rr, y + math.sin(a) * rr, z - 0.02 + h * hf)))
    for j in range(len(prof) - 1):
        for i in range(segs):
            i2 = (i + 1) % segs
            faces.append((j * segs + i, j * segs + i2, (j + 1) * segs + i2, (j + 1) * segs + i))
    faces.append(tuple(reversed(range(segs))))
    top = len(prof) - 1
    faces.append(tuple(top * segs + i for i in range(segs)))
    sb.B.add(mat, False, verts, faces)
    zc = z + h * 0.86
    _ring("rope", V((x, y, zc)), V((0, 0, 1)), r * 0.27, 0.018, segs=10, sides=4)
    for s_, ang in ((1, 0.5), (-1, 0.9)):
        a = V((x + math.cos(ang) * r * 0.27, y + math.sin(ang) * r * 0.27, zc))
        sb.tube("rope", False, [a, a + V((0.05 * s_, 0.04, -0.12)), a + V((0.07 * s_, 0.06, -0.24))], [0.014, 0.012, 0.01],
                segs=4)
    if collide:
        sb.cyl("hidden", True, (x, y, z), (x, y, z + 0.95), r * 0.95, segs=8)
