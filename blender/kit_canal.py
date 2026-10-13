"""The canal wharves kit (S2, sections/canal): the parts S2 needs that song_kit.py and the other area kits lack
(round 2 Run 2, 2026-10-12; review renders in gen/sections/canal/kit_review/, the contract in the S2 lead's
kit_contract.md).

Generic builder functions in the song_kit manner: each adds faces to street_b1's bucket set `sb.B` and never opens
an entity; the section builder (blender/canal_scene.py) wraps every call in `with sb.entity(<map id>):`.
Positions always come from the caller (layout.json); sizes the strokes can't give are keyword arguments marked
`choice:`. Frame: x = map X (east), y = map D (north), z up, metres. Built at real size (map/BUILDING.md rule 5).

Messenger's construction rules apply as in song_kit: no plain boxes, edges with thickness, members chamfered and
squared to their own frame (`_member`), surfaces split where ink should fall (brick courses as laps, planks, slats and
treads as separate pieces), the triangles in trims and small things. Thin things (cloth, mats, sign faces, pennants)
are single faces: the exported materials are double-sided. Collide only what a walker must not pass; furniture people
sit on never collides (people.js grounds a seated figure by a ray from above). Steep stairs get a hidden wall, never a
walkable ramp over 34 deg.

Signs: S2's own atlas (gen/sections/canal/make_signs.mjs -> textures/signs_canal.png + .json), material
"signs_canal", registered here with sb.MATERIALS.setdefault as kit_city_end does; a face is built with the cell's left
edge on the viewer's left (never mirrored). No other new material: every surface is a shared swatch.

Review: tools/blender_slot.sh -b --factory-startup --python <abs>/blender/kit_canal.py -- review <abs out_dir> [names]
(EEVEE + Freestyle ink, true colours as palette.js, a 1.7 m scale post beside each part; prints TRIS per part).
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.append(r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\blender")  # a scratch copy finds the kits

from mathutils import Vector  # noqa: E402

import song_kit as k  # noqa: E402
import street_b1 as sb  # noqa: E402

V = Vector
UP = V((0, 0, 1))
QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
SIGN_TEX = QM + r"\gen\sections\canal\textures\signs_canal.png"
SIGN_JSON = QM + r"\gen\sections\canal\textures\signs_canal.json"
_SIGN_JSON_WSL = "/home/ran/3d_director/qingming/gen/sections/canal/textures/signs_canal.json"
_ATLAS = {}


def atlas():
    if not _ATLAS:
        for p in (SIGN_JSON, _SIGN_JSON_WSL):
            if os.path.exists(p):
                with open(p, encoding="utf-8") as f:
                    _ATLAS.update(json.load(f))
                break
    return _ATLAS


if atlas():
    sb.MATERIALS.setdefault("signs_canal", (SIGN_TEX, 1, None))


def cell_uv(name, sub=None):
    """UVs (Blender: origin bottom-left) of a sign's atlas cell: [bottom-left, bottom-right, top-right, top-left];
    sub = (t0, t1): only that part of the cell's height (0 = top). None when the atlas lacks the cell."""
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
    """A cell's width / height as drawn (the board's real proportions)."""
    return atlas().get("aspect", {}).get(name, default)


# ---------------------------------------------------------------- small helpers (private)

def _p3(p, z=0.0):
    return V((p[0], p[1], p[2] if len(p) > 2 else z))


def _p2(p):
    return V((p[0], p[1], 0.0))


def _zf(z, x, y):
    """A height that is a number or a callable (x, y) -> z (the bank slope under a stilt)."""
    return z(x, y) if callable(z) else z


def _area(ring):
    return 0.5 * sum(ring[i].x * ring[(i + 1) % len(ring)].y - ring[(i + 1) % len(ring)].x * ring[i].y
                     for i in range(len(ring)))


def _offset(ring, d):
    """A convex plan ring pushed outward by d (inward for d < 0), corners mitred; keeps the ring's order and z."""
    n = len(ring)
    sgn = 1.0 if _area(ring) > 0 else -1.0
    out = []
    for i in range(n):
        a, b, c = ring[i - 1], ring[i], ring[(i + 1) % n]
        t1, t2 = _p2(b - a).normalized(), _p2(c - b).normalized()
        n1, n2 = V((t1.y, -t1.x, 0)) * sgn, V((t2.y, -t2.x, 0)) * sgn
        m = n1 + n2
        f = d / max(0.2, 1 + n1.dot(n2))
        out.append(V((b.x + m.x * f, b.y + m.y * f, b.z)))
    return out


def _newell(P):
    nv = V((0, 0, 0))
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]
        nv += V(((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)))
    return nv


def _member(mat, collide, p0, p1, side, w, h, c=0.0):
    """A straight member p0 -> p1 whose `w` runs along `side` (squared to the axis) and `h` across both; its long
    edges chamfered by c (c = 0: 12 triangles)."""
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
    """A six-faced solid from 4 bottom and 4 matching top corners (any winding)."""
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


def _face1(mat, pts, nrm):
    """A single-sided thin face (cloth, a mat) wound to face nrm."""
    P = [V(p) for p in pts]
    if _newell(P).dot(V(nrm)) < 0:
        P.reverse()
    k.add(mat, False, P, [tuple(range(len(P)))])


def _lathe3(mat, collide, c, X, Y, Z, prof, segs=8, cap0=True, cap1=False, rot=0.0):
    """An elliptical lathe in any frame: prof = [(rx, ry, z)] bottom to top along Z; rx = ry = 0 makes a point."""
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


def _frame_of(axis):
    Z = V(axis).normalized()
    X = Z.cross(UP) if abs(Z.z) < 0.95 else Z.cross(V((1, 0, 0)))
    X.normalize()
    return X, Z.cross(X).normalized(), Z


def _vlathe(mat, collide, c, prof, segs=8, cap0=True, cap1=False, rot=0.0):
    """A round lathe standing up at c: prof = [(r, z)]."""
    _lathe3(mat, collide, c, V((1, 0, 0)), V((0, 1, 0)), UP, [(r, r, z) for r, z in prof], segs, cap0, cap1, rot)


def _rod(mat, collide, a, b, r0, r1=None, segs=6, caps=True):
    """A round rod a -> b (r0 at a, r1 at b)."""
    sb.cyl(mat, collide, V(a), V(b), r0, r0 if r1 is None else r1, segs=segs, caps=caps)


def _seg(p0, p1):
    """Plan frame of p0 -> p1: start, end (z = 0), unit direction t, its right n, length."""
    a, b = _p2(p0), _p2(p1)
    t = b - a
    L = t.length
    t.normalize()
    return a, b, t, V((t.y, -t.x, 0)), L


# ---------------------------------------------------------------- kit_common: the factory's shared parts
# The round-2 catalogue (§8 c2) fixes their signatures; S2's 望楼饭铺 (thatch_gablet, thatch_lean_to), terrace and
# jetty (stilt_deck), swag_curtain and stakes (mooring_stake) stand on them. Until blender/kit_common.py lands, the
# private stubs below (same signatures, plain but not boxy) stand in; once it exists its parts are used, with no
# change to the builder's calls. This kit never edits kit_common.py.
try:
    import kit_common as _kcm  # noqa: E402
except ImportError:
    _kcm = None
STRAW = "reed"          # kit_outer_road.STRAW


def _common(name):
    """kit_common's part `name` when the module has it, else this kit's stub with the same signature."""
    f = getattr(_kcm, name, None) if _kcm is not None else None
    return f if f is not None else globals()["_stub_" + name]


def _tri_total():
    return sum(sb.B.tris.values())


def _stub_thatch_lean_to(p0, p1, depth, z_low, z_high, rng, posts=0, fringe=True, side=1, thick=0.22, mat=STRAW):
    """Stub of kit_common.thatch_lean_to: a single-slope thatch, its low eave along p0 -> p1 at z_low, rising `depth`
    m to z_high on the left of p0 -> p1 (side=1; -1 the right): _thatch_lean's bulging straw slab with a wobbly rolled
    hem and ragged straw ends (fringe); `posts` round posts under the low eave from z 0."""
    t0 = _tri_total()
    if side < 0:
        p0, p1 = p1, p0
    a, b, t, n_r, L = _seg(p0, p1)
    yaw = math.degrees(math.atan2(t.y, t.x))
    with k.placed(k.frame(a.x, a.y, 0.0, yaw)):
        z_sk = _thatch_lean(0.0, L, 0.0, depth, z_low, z_high, rng, thick=thick, mat=mat, ragged=fringe)
        if posts:
            for i in range(posts):
                x = L * (i + 0.5) / posts if posts > 1 else L / 2
                sb.cyl("timber", True, V((x, 0.3, -0.05)), V((x, 0.3, z_sk(0.3) - 0.04)), 0.06, 0.052, segs=6, caps=False)
    return _tri_total() - t0


def _stub_thatch_gablet(apex, foot_l, foot_r, depth, rng, kingpost=True, mat=STRAW):
    """Stub of kit_common.thatch_gablet: a small gable vent set into a thatch's hip end: a dark triangle apex /
    foot_l / foot_r (x, y, z) facing the right of foot_l -> foot_r (the viewer), barge boards along its sloping edges
    with their ends run past, a sill, a king post (kingpost), and a little straw hood running `depth` m back into the
    roof over each barge."""
    t0 = _tri_total()
    A, Fl, Fr = V(apex), V(foot_l), V(foot_r)
    tt = _p2(Fr - Fl).normalized()
    nrm = V((tt.y, -tt.x, 0))
    _face1("interior", [Fl - nrm * 0.03, Fr - nrm * 0.03, A - nrm * 0.03], nrm)
    for p in (Fl, Fr):
        e = (A - p).normalized()
        _member("timber", False, p - e * 0.06 + nrm * 0.02, A + e * 0.12 + nrm * 0.02, nrm, 0.05, 0.11, 0.01)
        back = -nrm * depth
        side_o = 1 if p is Fr else -1
        _face1(mat, [p + nrm * 0.05 + UP * 0.06, A + nrm * 0.05 + UP * 0.08, A + back + UP * 0.08, p + back + UP * 0.06],
               tt * side_o + UP)
    _member("timber", False, Fl - tt * 0.04 + UP * 0.02, Fr + tt * 0.04 + UP * 0.02, nrm, 0.06, 0.06, 0.01)
    if kingpost:
        _member("timber", False, (Fl + Fr) / 2 + UP * 0.05 + nrm * 0.01, A - UP * 0.18 + nrm * 0.01, nrm, 0.05, 0.05)
    return _tri_total() - t0


def _poly_span(P, x):
    """The y range of a convex plan polygon P (local, x-y) along the vertical line at x, or None."""
    ys = []
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]
        if (a.x - x) * (b.x - x) <= 0 and abs(b.x - a.x) > 1e-9:
            ys.append(a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x))
        elif abs(b.x - a.x) <= 1e-9 and abs(a.x - x) < 1e-9:
            ys += [a.y, b.y]
    return (min(ys), max(ys)) if len(ys) >= 2 else None


def _stub_stilt_deck(outline, deck_z, rng, z_of, post_every=1.8, rail=None, fascia=None, collide=True):
    """Stub of kit_common.stilt_deck: a plank deck over the convex plan polygon `outline` with its top at deck_z,
    planks running across edge 0 (each its own board, gaps between, a little up or down), joists under them, round
    posts every <= post_every round the outline down to z_of(x, y) (a callable, or a number) where the ground is
    below the deck; rail / fascia = (edge indices, "balusters" | "slats"): a railing on those edges, or a band of
    short slats or balusters hanging from the deck's edge. collide: one hidden walkable slab (the deck's top) and
    the posts; the rails collide by a hidden wall."""
    t0 = _tri_total()
    zof = z_of if callable(z_of) else (lambda x, y, _z=z_of: _z)
    P = [_p2(p) for p in outline]
    a, b, t, n_r, Lf = _seg(P[0], P[1])
    left = -n_r
    loc = [V(((p - a).dot(t), (p - a).dot(left), 0)) for p in P]
    xs_ = [p.x for p in loc]
    x, i = min(xs_) + 0.005, 0
    thick = 0.05

    def W(lx, ly, z):
        return a + t * lx + left * ly + UP * z
    while x < max(xs_) - 0.03:
        w = min(rng.uniform(0.24, 0.32), max(xs_) - x)
        xm = x + w / 2
        sp = _poly_span(loc, xm)
        if sp and sp[1] - sp[0] > 0.05:
            y0, y1 = sp[0] + rng.uniform(-0.03, 0.02), sp[1] + rng.uniform(-0.02, 0.03)
            zt = deck_z + rng.uniform(-0.008, 0.006)
            g = rng.uniform(0.008, 0.016)
            bot = [W(x + g, y0, zt - thick), W(x + w - g, y0 + rng.uniform(-0.01, 0.01), zt - thick),
                   W(x + w - g, y1, zt - thick), W(x + g, y1 + rng.uniform(-0.01, 0.01), zt - thick)]
            _box8("deck", False, bot, [p + UP * thick for p in bot])
        x += w
        i += 1
    if collide:
        k.add("hidden", True, [V((p.x, p.y, deck_z)) for p in (P if _area(P) > 0 else list(reversed(P)))],
              [tuple(range(len(P)))])
    # posts round the outline, joists between opposite posts along edge 0's normal
    pts = []
    for j in range(len(P)):
        p, q = P[j], P[(j + 1) % len(P)]
        m = max(1, math.ceil((q - p).length / post_every))
        for s in range(m):
            pts.append(p.lerp(q, s / m))
    cen = sum(P, V((0, 0, 0))) / len(P)
    for p in pts:
        c = p + (cen - p).normalized() * 0.08
        zg = zof(c.x, c.y)
        if zg < deck_z - 0.15:
            sb.cyl("timber", collide, V((c.x, c.y, zg - 0.1)), V((c.x, c.y, deck_z - thick - 0.02)), 0.07, 0.062, segs=7, caps=False)
    for xx in [min(xs_) + 0.1 + (max(xs_) - min(xs_) - 0.2) * f for f in (0.0, 0.33, 0.67, 1.0)]:
        sp = _poly_span(loc, xx)
        if sp:
            k.beam("timber", False, W(xx, sp[0] + 0.05, deck_z - thick - 0.06), W(xx, sp[1] - 0.05, deck_z - thick - 0.06),
                   0.08, 0.1, 0.012)
    for spec, is_rail in ((rail, True), (fascia, False)):
        if not spec:
            continue
        edges, kind = spec
        for j in edges:
            p, q = P[j % len(P)], P[(j + 1) % len(P)]
            p, q = p + (cen - p).normalized() * 0.03, q + (cen - q).normalized() * 0.03
            if is_rail:
                if kind == "balusters":
                    _gou_lan([p, q], deck_z, 0.9, rng, mat="timber")
                else:
                    _slat_rail(p, q, deck_z, deck_z + 0.9, rng)
                if collide:
                    k.add("hidden", True, [V((p.x, p.y, deck_z)), V((q.x, q.y, deck_z)), V((q.x, q.y, deck_z + 1.05)),
                                           V((p.x, p.y, deck_z + 1.05))], [(0, 1, 2, 3)])
            else:
                _slat_rail(p, q, deck_z - 0.42, deck_z - 0.02, rng, rails=(0.12, 0.92), gap=0.035 if kind == "slats" else 0.12)
    return _tri_total() - t0


def _slat_rail(p, q, z0, z1, rng, rails=(0.08, 0.95), w=0.06, gap=0.04, mat="timber"):
    """Close vertical slats (single faces, a little in or out) between z0 and z1 along plan p -> q, on rails."""
    p, q = _p2(p), _p2(q)
    tt = (q - p).normalized()
    out = V((tt.y, -tt.x, 0))
    L = (q - p).length
    s, i = 0.02, 0
    while s < L - 0.02:
        e = min(L - 0.02, s + w * rng.uniform(0.85, 1.15))
        o = out * (0.012 if i % 2 else 0.0)
        za, zb = z1 - rng.uniform(0.0, 0.03), z1 - rng.uniform(0.0, 0.03)
        k.add(mat, False, [p + tt * s + o + UP * z0, p + tt * e + o + UP * z0, p + tt * e + o + UP * zb,
                           p + tt * s + o + UP * za], [(0, 1, 2, 3)])
        s = e + gap * rng.uniform(0.7, 1.3)
        i += 1
    for f in rails:
        zz = z0 + (z1 - z0) * f
        _member(mat, False, p + out * 0.03 + UP * zz, q + out * 0.03 + UP * zz, out, 0.04, 0.05, 0.008)


def _stub_swag_curtain(top_a, top_b, z_top, z_hem, rng, gather="b", tie_z=None, stripes=0, mat="cloth_indigo"):
    """Stub of kit_common.swag_curtain: a cloth hung from a rod along top_a -> top_b at z_top, its face toward the
    right of top_a -> top_b, in shallow vertical folds; drawn up into a tied swag at the `gather` end ("a" | "b"):
    its hem sweeps up from z_hem at the free end to the tie at tie_z, the gathered bunch hanging below the tie;
    stripes = n: n vertical stripes of cloth_white across it."""
    t0 = _tri_total()
    A, Bp = _p2(top_a), _p2(top_b)
    if gather == "a":
        A, Bp = Bp, A
    tt = (Bp - A).normalized()
    out = V((tt.y, -tt.x, 0)) * (1 if gather != "a" else -1)
    L = (Bp - A).length
    tz = tie_z if tie_z is not None else z_hem + (z_top - z_hem) * 0.55
    m = max(4, round(L / 0.14))
    cols = []
    for i in range(m + 1):
        f = i / m
        g = f ** 2.2                                  # cloth bunches toward the gathered end
        x = L * (0.75 * f + 0.25 * g) if f < 1 else L
        fold = (0.03 if i % 2 else -0.03) * (1 + 1.5 * f)
        hem = z_hem + (tz - z_hem) * (f ** 1.6) + rng.uniform(-0.015, 0.015)
        cols.append((A + tt * min(L, x * (1 - 0.08 * f)) + out * fold, hem))
    verts, faces = [], []
    for i, (p, hem) in enumerate(cols):
        verts += [p + UP * z_top, p + UP * ((z_top + hem) / 2) + out * 0.01, p + UP * hem]
    for i in range(m):
        b0, b1 = i * 3, (i + 1) * 3
        mm = "cloth_white" if stripes and (i * stripes // m) % 2 == 1 else mat
        k.add(mm, False, [verts[b0], verts[b1], verts[b1 + 1], verts[b0 + 1]], [(0, 1, 2, 3)])
        k.add(mm, False, [verts[b0 + 1], verts[b1 + 1], verts[b1 + 2], verts[b0 + 2]], [(0, 1, 2, 3)])
    C = A + tt * (L - 0.05) + out * 0.04
    sb.tube(mat, False, [C + UP * tz, C + UP * (tz - 0.25) + out * 0.03, C + UP * z_hem + out * 0.02],
            [0.09, 0.07, 0.05], segs=6)
    sb.cyl("rope", False, C + UP * (tz - 0.03), C + UP * (tz + 0.03), 0.095, segs=6, caps=False)
    sb.cyl("bamboo", False, A - tt * 0.05 + UP * (z_top + 0.015) + out * 0.01, Bp + tt * 0.05 + UP * (z_top + 0.015) + out * 0.01,
           0.018, segs=5)
    return _tri_total() - t0


def _stub_mooring_stake(x, y, z_foot, z_top, rng, r=0.06, top="taper", rope=None, lamp=False):
    """Stub of kit_common.mooring_stake: a thin tapered post (a little out of true) from z_foot to z_top, its top
    "taper" (sharpened) or "knob"; rope None, "turns" (a few turns near the top), "knot" (turns, a knot and a short
    tail) or "coil" (a rope coiled round its top and hanging in loops down its sides); lamp: a small box lamp on top.
    Returns the rope point (x, y, z) a boat's line ties to."""
    lean = V((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), 0))
    F, T = V((x, y, z_foot)), V((x, y, z_top)) + lean
    sb.cyl("bark", True, F, T, r, r * 0.72, segs=7, caps=True)
    ax = (T - F).normalized()
    if top == "knob":
        _lathe3("bark", False, T, *_frame_of(ax), [(r * 0.8, r * 0.8, 0.0), (r * 1.15, r * 1.15, 0.04), (r * 0.9, r * 0.9, 0.1),
                                                     (0.0, 0.0, 0.13)], segs=7)
    else:
        _lathe3("bark", False, T, *_frame_of(ax), [(r * 0.72, r * 0.72, 0.0), (0.0, 0.0, r * 2.2)], segs=7, cap0=False)
    zr = z_top - 0.18
    P = F.lerp(T, (zr - z_foot) / max(1e-6, z_top - z_foot))
    if rope in ("turns", "knot", "coil"):
        nt = 3 if rope != "coil" else 5
        for i in range(nt):
            c = P + ax * (0.045 * (i - nt / 2))
            ring = [c + (V((math.cos(2 * math.pi * j / 8), math.sin(2 * math.pi * j / 8), 0))) * (r * 0.9 + 0.022)
                    + UP * (0.006 * math.sin(j)) for j in range(9)]
            sb.tube("rope", False, ring, [0.017] * 9, segs=4)
        if rope == "knot":
            k.rock("rope", P.x + r + 0.02, P.y, P.z, 0.04, rng, flat=0.9)
            sb.tube("rope", False, [P + V((r + 0.03, 0, 0)), P + V((r + 0.06, 0.02, -0.12)), P + V((r + 0.05, 0.03, -0.22))],
                    [0.016, 0.014, 0.01], segs=4)
        if rope == "coil":
            for sgn_ in (-1, 1):
                d = V((sgn_ * (r + 0.03), 0, 0))
                sb.tube("rope", False, [P + d, P + d * 1.3 - UP * 0.25, P + d * 1.1 - UP * 0.45, P + d * 0.6 - UP * 0.3,
                                         P + d * 0.4 - UP * 0.05], [0.017] * 5, segs=4)
    if lamp:
        _member("timber", False, T + UP * 0.02, T + UP * 0.24, V((1, 0, 0)), 0.16, 0.16, 0.02)
    return (P.x, P.y, P.z)


# ---------------------------------------------------------------- the set piece: 望火楼

def _gou_lan(pts, z, h, rng, mat="redwood", post_every=1.25, baluster=0.26, collide=False):
    """A Song baluster railing (勾栏) along a plan polyline at floor height z: a floor sill (地栿), a mid rail (盆唇) and a
    top rail (寻杖) between capped posts (望柱) at the ends and every <= post_every, close square balusters between."""
    P = [_p2(p) + UP * z for p in pts]
    for a, b in zip(P, P[1:]):
        L = (b - a).length
        if L < 0.05:
            continue
        t = (b - a) / L
        nside = V((-t.y, t.x, 0))
        _member(mat, collide, a + UP * 0.035, b + UP * 0.035, nside, 0.1, 0.07, 0.012)          # sill
        _member(mat, False, a + UP * (h * 0.46), b + UP * (h * 0.46), nside, 0.05, 0.05)         # mid rail
        _member(mat, collide, a + UP * (h - 0.03), b + UP * (h - 0.03), nside, 0.065, 0.06, 0.012)  # top rail
        m = max(1, math.ceil(L / post_every))
        for i in range(m + 1):
            p = a.lerp(b, i / m)
            if i == 0 and a is not P[0]:
                continue            # the corner post is the previous run's last
            _member(mat, collide, p, p + UP * (h + 0.08), t, 0.1, 0.1, 0.015)
            _vlathe(mat, False, p + UP * (h + 0.08), [(0.065, 0.0), (0.065, 0.03), (0.04, 0.05), (0.055, 0.09), (0.0, 0.15)],
                    segs=6, cap0=True)
        nb = max(1, int(L / baluster))
        for i in range(nb):
            f = (i + 0.5) / nb
            if any(abs(f - j / m) * L < 0.1 for j in range(m + 1)):
                continue
            p = a.lerp(b, f)
            _member(mat, False, p + UP * 0.07, p + UP * (h - 0.06), t, 0.035, 0.035)


def fire_tower(sw, se, ne, nw, z0, rng, plat_h=5.6, stair_foot=None, stair_w=0.85, rail_h=0.85, post_h=2.6,
               pav_inset=0.45, eave_over=1.25, roof_rise=1.9, finial=True, part="both", batter=0.11, course=0.31,
               stair_deg=52.0, stair_rails=1, lift=0.28, curve=1.45):
    """望火楼, the fire-watch tower (S2.str.fire_tower_platform_28450 + S2.bld.fire_tower_28440).

    part='platform' builds the brick platform, its coping, the baluster railing on its top and the wooden stair (the
    platform's map entry names the railing and the stair); part='pavilion' the four posts, their beams and the roof
    with its finial; 'both' all of it. The two calls agree (no randomness in the shared heights), so the builder wraps
    each in its own map ID. Returns dict(top=<z of the platform top>, posts=[4 (x, y) of the pavilion's posts in the
    order sw, se, ne, nw], stair_top=(x, y, z) where the stair lands).

    sw..nw: the platform's corners at its foot (any convex quad; its back corners may stand shifted along the
    receding direction). The platform: horizontal grey brick courses, each its own lap (its foot stands 2.5 cm proud
    with a 45 deg chamfer facing down and out, so the ink draws one line per course, as the scan's courses), battered
    `batter` m in over its height, a stone coping that stands out 7 cm; one hidden solid collider. The railing runs
    along the top's front (sw-se) and both sides, open on the west side where the stair lands. The stair: straight,
    two stringers, treads, a hand-rail on its near (south) side (`stair_rails`=2: both sides), from `stair_foot`
    (x, y, z) up to the top's front-west corner (it lands on the west edge just north of the sw corner, as painted:
    climbing eastward against the platform's west side); default foot: straight out west at `stair_deg`. Steeper than
    34 deg (a Song 楼梯), so a hidden wall stands over its plan, never a walkable ramp.
    The pavilion: four octagonal posts on stone drums, inset `pav_inset` from the coping's edge, an architrave (阑额)
    with projecting ends and a plate (普拍枋) over it, a cap block and a diagonal corner arm on each post; a pyramidal
    (攒尖) tiled roof, concave (`curve`), its corners swept up `lift`, eaves `eave_over` past the posts, raised hip
    ridges with upturned tips, and a round finial (宝顶) on a pedestal at its peak.

    Real size (choice:, the area agent's starting point, kept): 東京夢華錄 卷三: "又於高處磚砌望火樓，樓上有人卓望"
    -- a brick-built watch platform. The scan (u 28260-28600): posts 50-60 px from the platform top (v ~200) to the
    eave (v ~150), the roof 80 px eave to finial top (the finial 20 px), the platform face >= 85 px (its foot hidden
    behind the rear shed at v >= 283), the face 155 px wide, the eaves 264 px. A man must stand under the eave: posts
    2.6 m, so 0.047 m/px; the painted face then stands >= 4.0 m with its foot hidden: 5.6 m (plat_h). The painter
    draws the tower broad (the face would be 7.3 m wide at that scale, the eaves 12 m); a 5.6 m platform 5.0-5.4 m
    wide and 4.4-4.8 m deep carries a 4.3 m pavilion with 6.2 m eaves, still broad and squat as painted (the
    builder's corners decide). Roof rise 1.9 m (+ finial 0.85 m) over a 2.6 m post: the painted roof is about as tall
    as the posts, part of which is the plan's depth seen from above. Courses 0.31 m (the painted lines are 6-7 px
    apart). The map's own heights (H 1.13 at the top, the frame's `fire tower platform` support) are a lower bound,
    painted small at the silk's top.
    """
    C = [_p2(p) for p in (sw, se, ne, nw)]
    top = z0 + plat_h
    cap_h, cap_o, lap = 0.2, 0.07, 0.025
    sgn = 1.0 if _area(C) > 0 else -1.0

    def ring_at(z, o):
        bt = batter * max(0.0, min(1.0, (z - z0) / plat_h))
        return [V((p.x, p.y, z)) for p in _offset(C, o - bt)]

    TOP = ring_at(top, cap_o)                         # the coping's outer edge at the top
    PR = _offset(TOP, -pav_inset)                     # the pavilion's post centres
    posts = [(p.x, p.y) for p in PR]
    # the stair lands on the west edge (nw -> sw) just north of the sw corner
    swt, nwt = TOP[0], TOP[3]
    wdir = _p2(nwt - swt).normalized()
    west_out = V((-wdir.y, wdir.x, 0)) * (-sgn)       # outward normal of the west edge
    if west_out.dot(_p2(swt - TOP[1])) < 0:
        west_out = -west_out
    P_top = _p2(swt) + wdir * (stair_w / 2 + 0.12) + UP * top
    if stair_foot is None:
        run = plat_h / math.tan(math.radians(stair_deg))
        F = P_top + west_out * run
        F.z = z0
    else:
        F = _p3(stair_foot)
    stair_top = (P_top.x, P_top.y, P_top.z)

    if part in ("platform", "both"):
        # brick courses, each its own lap
        z_start, z_cap = z0 - 0.08, top - cap_h
        n = max(4, round((z_cap - z_start) / course))
        h = (z_cap - z_start) / n
        zs = [z_start + i * h + (rng.uniform(-0.018, 0.018) if 0 < i < n else 0.0) for i in range(n + 1)]
        for i in range(n):
            zb, zt = zs[i], zs[i + 1]
            r0, r1, r2 = ring_at(zb, 0.0), ring_at(zb + lap, lap), ring_at(zt, 0.0)
            verts = r0 + r1 + r2
            faces = []
            for a in range(4):
                b = (a + 1) % 4
                faces += [(a, b, 4 + b, 4 + a), (4 + a, 4 + b, 8 + b, 8 + a)]
            if sgn < 0:
                faces = [tuple(reversed(f)) for f in faces]
            k.add("brick", False, verts, faces)
        # the coping: chamfered out, a band, the top
        c0, c1, c2 = ring_at(z_cap, 0.0), ring_at(z_cap + 0.06, cap_o), ring_at(top, cap_o)
        verts = c0 + c1 + c2
        faces = []
        for a in range(4):
            b = (a + 1) % 4
            faces += [(a, b, 4 + b, 4 + a), (4 + a, 4 + b, 8 + b, 8 + a)]
        faces.append((8, 9, 10, 11))
        if sgn < 0:
            faces = [tuple(reversed(f)) for f in faces]
        k.add("stone", False, verts, faces)
        k.prism("hidden", True, [V((p.x, p.y, z0 - 0.1)) for p in ring_at(z0, 0.0)], TOP, cap_top=True)
        # the railing on the top: west side (open where the stair lands), front, east side
        RR = _offset(TOP, -0.1)
        gap = stair_w + 0.24
        west_end = RR[0] + _p2(RR[3] - RR[0]).normalized() * gap
        _gou_lan([RR[3], west_end], top, rail_h, rng)
        _gou_lan([RR[0], RR[1], RR[2]], top, rail_h, rng)
        # the stair
        _fire_stair(F, P_top, stair_w, rng, rails=stair_rails, z_floor=top)

    if part in ("pavilion", "both"):
        zt = top + post_h
        for p in PR:
            _vlathe("stone", True, V((p.x, p.y, top)), [(0.2, 0.0), (0.2, 0.06), (0.17, 0.12), (0.135, 0.15)], segs=8)
            _rod("redwood", True, V((p.x, p.y, top + 0.15)), V((p.x, p.y, zt)), 0.11, 0.1, segs=8, caps=False)
        for i in range(4):
            a, b = _p2(PR[i]), _p2(PR[(i + 1) % 4])
            t = (b - a).normalized()
            nside = V((-t.y, t.x, 0))
            _member("redwood", False, a - t * 0.16 + UP * (zt - 0.14), b + t * 0.16 + UP * (zt - 0.14), nside, 0.1, 0.22, 0.015)
            _member("redwood", False, a - t * 0.22 + UP * (zt + 0.04), b + t * 0.22 + UP * (zt + 0.04), nside, 0.2, 0.08, 0.012)
        cx = sum((p for p in PR), V((0, 0, 0))) / 4
        for p in PR:
            out = _p2(p - cx).normalized()
            _member("redwood", False, V((p.x, p.y, zt + 0.08)), V((p.x, p.y, zt + 0.2)), out, 0.24, 0.24, 0.03)
            _member("redwood", False, V((p.x, p.y, zt + 0.27)) - out * 0.25, V((p.x, p.y, zt + 0.36)) + out * 0.75,
                    V((-out.y, out.x, 0)), 0.11, 0.15, 0.015)
        z_eave = zt + 0.42
        E = _offset(PR, eave_over)
        apex = V((cx.x, cx.y, 0))

        def height(s, t):
            return z_eave + roof_rise * (t ** curve) + lift * (abs(2 * s - 1) ** 3) * (1 - t) ** 2

        order = [0, 1, 2, 3] if _area(E) > 0 else [3, 2, 1, 0]
        slopes = [(E[order[i]], E[order[(i + 1) % 4]], apex, apex, 8) for i in range(4)]
        edges = k._roof_surface(slopes, height, 0.2, 6)
        for rows in edges:
            line = [r[0] for r in rows]
            for a, b in zip(line, line[1:]):
                _member("ridge", False, a + UP * 0.07, b + UP * 0.07, _p2(b - a).cross(UP), 0.15, 0.13, 0.02)
            tip = line[0]
            o = _p2(tip - apex).normalized()
            _member("ridge", False, tip + UP * 0.06 - o * 0.1, tip + o * 0.2 + UP * 0.16, o.cross(UP), 0.12, 0.11, 0.02)
        if finial:
            zr = z_eave + roof_rise
            _vlathe("ridge", False, V((cx.x, cx.y, zr - 0.12)),
                    [(0.3, 0.0), (0.3, 0.13), (0.24, 0.17), (0.17, 0.3), (0.25, 0.33), (0.25, 0.37), (0.11, 0.41),
                     (0.21, 0.47), (0.27, 0.57), (0.23, 0.68), (0.12, 0.75), (0.06, 0.8), (0.07, 0.85), (0.0, 0.92)],
                    segs=8)
    return dict(top=top, posts=posts, stair_top=stair_top)


def _fire_stair(F, T, w, rng, rails=1, z_floor=None, rise=0.235, mat="timber"):
    """A straight steep wooden stair from foot F (x, y, z) to its landing T (x, y, z): two stringers, treads between
    them, a hand-rail on the near (south) side (rails=2: both); a hidden wall over its plan (a walkable hidden ramp
    instead when it comes out under 34 deg)."""
    F, T = V(F), V(T)
    a = _p2(T - F)
    L = a.length
    a.normalize()
    H = T.z - F.z
    s = V((-a.y, a.x, 0))
    d3 = (T - F).normalized()
    nrm = d3.cross(s)
    if nrm.z < 0:
        nrm = -nrm
    for sg in (-1, 1):
        o = s * (sg * (w / 2 - 0.035))
        _member(mat, False, F + o - nrm * 0.1 - d3 * 0.05, T + o - nrm * 0.1, s, 0.06, 0.24, 0.012)
    n = max(3, round(H / rise))
    depth = max(0.17, min(0.27, L / n + 0.05))
    for i in range(1, n):
        f = i / n
        c = F + a * (L * f) + UP * (H * f - 0.025)
        _member(mat, False, c - s * (w / 2 - 0.065), c + s * (w / 2 - 0.065), a, depth, 0.045, 0.008)
    near = s if s.y < 0 else -s
    sides = [near] if rails == 1 else [near, -near]
    for sd in sides:
        o = sd * (w / 2 + 0.02)
        rh = 0.92
        pts = [F + o + a * 0.12 + UP * (H * 0.12 / max(L, 0.1)), F + o + (T - F) * 0.5, T + o - a * 0.06]
        for p in pts:
            _member(mat, False, p - nrm * 0.12, p + UP * rh, a, 0.07, 0.07, 0.01)
        _member(mat, False, pts[0] + UP * rh - d3 * 0.12, pts[-1] + UP * rh + d3 * 0.04, sd, 0.065, 0.06, 0.012)
        _member(mat, False, pts[0] + UP * (rh * 0.5), pts[-1] + UP * (rh * 0.5), sd, 0.04, 0.04)
    hw = w / 2 + 0.06
    z0 = min(F.z, T.z) - 0.1
    if math.degrees(math.atan2(H, max(L, 1e-6))) > 34.0:
        bot = [F - s * hw, F + s * hw, T + s * hw, T - s * hw]
        _box8("hidden", True, [V((p.x, p.y, z0)) for p in bot], [V((p.x, p.y, T.z)) for p in bot])
    else:
        bot = [F - s * hw, F + s * hw, T + s * hw, T - s * hw]
        _box8("hidden", True, [V((p.x, p.y, z0)) for p in bot],
              [bot[0] + UP * (F.z - bot[0].z), bot[1] + UP * (F.z - bot[1].z), bot[2] + UP * (T.z - bot[2].z),
               bot[3] + UP * (T.z - bot[3].z)])


# ---------------------------------------------------------------- sheds, halls and the water's edge

def _thatch_hip(x0, x1, y0, y1, z_eave, z_ridge, rng, thick=0.3, hip_k=1.0, mat="reed", ragged=True, ridge=True,
                vent=None, step=0.6):
    """A hipped thatch (庑殿 form in straw) over the local plan rectangle (its eave line), ridge along x: straight,
    slightly bulging slopes with crisp hip lines (rounded a little where the straw turns over them), a rolled hem
    `thick` deep whose line wobbles in plan and height (never ruled), a straw underside, a ragged fringe of straw ends,
    a ridge roll bound with rope. hip_k: the hipped ends' run as a fraction of the half depth (1 = the same pitch as
    the long slopes). vent = cv (0..1): the +x end becomes a half-hip (歇山 in thatch) with a gable vent
    (kit_common.thatch_gablet) cv of the rise deep: the ridge runs on to the gablet's plane, the end slope rises at the
    long slopes' pitch only to the gablet's foot, and the gablet fills the step (all faces planar but the bulge). UVs: the reed swatch's strands
    run down the slope. Returns {'z_top_at', 'z_under_at', 'ridge': (rx0, rx1, yc, zr)}."""
    H = z_ridge - z_eave
    yc, d = (y0 + y1) / 2, (y1 - y0) / 2
    run = max(0.05, d * hip_k)
    rx0, rx1 = x0 + run, x1 - run
    if rx1 < rx0:
        rx0 = rx1 = (x0 + x1) / 2
        run = (x1 - x0) / 2
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    # the half-hip (歇山 in thatch) at +x for the vent: the ridge runs on to the gablet's plane xv; the end slope
    # rises (at the long slopes' pitch) only to the gablet's foot at tb of the rise; the gablet fills the step
    tb = xv = wv = None
    if vent is not None:
        tb = max(0.3, min(0.85, 1 - vent))
        xv = x1 - run * tb
        wv = d * (1 - tb)
        if xv <= rx0 + 0.2:
            tb = xv = wv = None

    def ts_te(x, y):
        ts = 1 - abs(y - yc) / d
        if x < rx0:
            te = (x - x0) / max(1e-6, rx0 - x0)
        elif xv is not None:
            te = 1.0 if x <= xv else tb * (x1 - x) / max(1e-6, x1 - xv)
        elif x > rx1:
            te = (x1 - x) / max(1e-6, x1 - rx1)
        else:
            te = 1.0
        return ts, te

    def z_top_at(x, y):
        ts, te = ts_te(x, y)
        t = max(0.0, min(ts, te))
        hip = max(0.0, 1 - abs(ts - te) / 0.12) if te < 0.999 else 0.0
        return z_eave + H * (t + 0.05 * math.sin(math.pi * t)) + 0.07 * hip * (1 - 0.5 * t)

    def push(p, amt):
        """The hem's wobble: outward from the ridge, a smooth function of the position (shared corners agree)."""
        q = V((min(max(p.x, rx0), rx1), yc, 0))
        o = V((p.x - q.x, p.y - q.y, 0))
        o = o.normalized() if o.length > 1e-6 else V((0, 0, 0))
        s = (p.x + p.y) * 1.0
        w = 0.05 * (math.sin(s * 1.7 + ph[0]) + 0.6 * math.sin(s * 4.1 + ph[1])) / 1.6
        dz = 0.03 * (math.sin(s * 2.3 + ph[2]) + 0.5 * math.sin(s * 5.3 + ph[3])) / 1.5
        return o * (w * amt), dz * amt

    if xv is None:
        slopes = [((x0, y0), (x1, y0), (rx0, yc), (rx1, yc)), ((x1, y0), (x1, y1), (rx1, yc), (rx1, yc)),
                  ((x1, y1), (x0, y1), (rx1, yc), (rx0, yc)), ((x0, y1), (x0, y0), (rx0, yc), (rx0, yc))]
    else:
        slopes = [((x0, y0), (xv, y0), (rx0, yc), (xv, yc)), ((xv, y0), (x1, y0), (xv, yc - wv), (xv, yc - wv)),
                  ((x1, y0), (x1, y1), (xv, yc - wv), (xv, yc + wv)),
                  ((x1, y1), (xv, y1), (xv, yc + wv), (xv, yc + wv)), ((xv, y1), (x0, y1), (xv, yc), (rx0, yc)),
                  ((x0, y1), (x0, y0), (rx0, yc), (rx0, yc))]
    ts_rows = [0.0, 0.3, 0.65, 1.0]
    tile = sb.MATERIALS[mat][1]
    hems = []
    for E0, E1, R0, R1 in slopes:
        E0, E1, R0, R1 = (V((p[0], p[1], 0)) for p in (E0, E1, R0, R1))
        L = (E1 - E0).length
        ns = max(2, round(L / step))
        apex = (R1 - R0).length < 1e-6
        top, und = [], []
        for t in ts_rows:
            row, urow = [], []
            for i in range(ns + 1):
                s = i / ns
                p = E0.lerp(E1, s).lerp(R0.lerp(R1, s), t)
                z = z_top_at(p.x, p.y)
                amt = 1.0 if t == 0.0 else (0.4 if t == 0.3 else 0.0)
                o, dz = push(p, amt)
                row.append(V((p.x + o.x, p.y + o.y, z + dz)))
                inn = V((0, 0, 0)) if t > 0 else (p - V((min(max(p.x, rx0), rx1), yc, 0)))
                inn = inn.normalized() * 0.06 if inn.length > 1e-6 else V((0, 0, 0))
                urow.append(V((p.x + o.x - inn.x, p.y + o.y - inn.y, z + dz - thick + (0.05 if t == 0.0 else 0.0))))
            top.append(row)
            und.append(urow)
        verts, faces, uvs = [], [], []
        acc = [0.0]
        for j in range(1, len(top)):
            acc.append(acc[-1] + (top[j][ns // 2] - top[j - 1][ns // 2]).length)
        for rows, flip, vo in ((top, False, 0.0), (und, True, 0.37)):
            base = len(verts)
            for r in rows:
                verts.extend(r)
            for j in range(len(rows) - 1):
                for i in range(ns):
                    q = [base + j * (ns + 1) + i, base + j * (ns + 1) + i + 1, base + (j + 1) * (ns + 1) + i + 1,
                         base + (j + 1) * (ns + 1) + i]
                    uv = [(acc[j] / tile + vo, L * i / ns / tile), (acc[j] / tile + vo, L * (i + 1) / ns / tile),
                          (acc[j + 1] / tile + vo, L * (i + 1) / ns / tile), (acc[j + 1] / tile + vo, L * i / ns / tile)]
                    if apex and j == len(rows) - 2:
                        q, uv = q[:3], uv[:3]
                        q[2] = base + (j + 1) * (ns + 1) + ns // 2
                    if flip:
                        q, uv = list(reversed(q)), list(reversed(uv))
                    faces.append(tuple(q))
                    uvs.append(uv)
        bt, bu = 0, len(top) * (ns + 1)
        for i in range(ns):                   # the rolled hem
            faces.append((bu + i, bu + i + 1, bt + i + 1, bt + i))
            uvs.append([(0.0, L * i / ns / tile), (0.0, L * (i + 1) / ns / tile), (thick / tile, L * (i + 1) / ns / tile),
                        (thick / tile, L * i / ns / tile)])
        k.add(mat, False, verts, faces, uvs)
        hems.append(und[0])
    if ragged:
        for hem in hems:
            for p, q in zip(hem, hem[1:]):
                Ls = (q - p).length
                if Ls < 1e-6:
                    continue
                tv = (q - p) / Ls
                out = V((tv.y, -tv.x, 0))
                s = rng.uniform(0.0, 0.08)
                while s < Ls:
                    c = p.lerp(q, s / Ls)
                    w = rng.uniform(0.03, 0.07)
                    k.add(mat, False, [c - tv * (w / 2), c + tv * (w / 2), c + out * 0.015 - UP * rng.uniform(0.04, 0.1)],
                          [(0, 1, 2)])
                    s += rng.uniform(0.06, 0.14)
    if xv is not None:
        rx1 = xv
    zr = z_top_at((rx0 + rx1) / 2, yc)
    if ridge:
        if rx1 - rx0 < 0.2:
            k.rock(mat, (rx0 + rx1) / 2, yc, zr + 0.04, 0.2, rng, flat=0.55)
        else:
            ex0, ex1 = rx0 - 0.12, rx1 + 0.12
            pts = [V((ex0 + (ex1 - ex0) * f, yc, zr + (0.03 if 0.05 < f < 0.95 else -0.02))) for f in (0.0, 0.06, 0.35, 0.65, 0.94, 1.0)]
            sb.tube(mat, False, pts, [0.06, 0.13, 0.14, 0.14, 0.13, 0.06], segs=8)
            nb = max(2, round((ex1 - ex0) / 0.7))
            for i in range(nb + 1):
                xx = ex0 + 0.12 + (ex1 - ex0 - 0.24) * i / nb
                sb.cyl("rope", False, (xx - 0.025, yc, zr + 0.03), (xx + 0.025, yc, zr + 0.03), 0.145, segs=8, caps=False)
    if xv is not None:
        zb = z_eave + H * (tb + 0.05 * math.sin(math.pi * tb))
        _common("thatch_gablet")((xv, yc, zr - 0.02), (xv, yc - wv, zb), (xv, yc + wv, zb), 0.45, rng, kingpost=True,
                                 mat=mat)

    def z_under_at(x, y):
        return z_top_at(x, y) - thick
    return {"z_top_at": z_top_at, "z_under_at": z_under_at, "ridge": (rx0, rx1, yc, zr)}


def _local_frame(sw, se, ne, nw):
    """A shed's local frame: origin sw, x along sw -> se, y to its left (back); its front length and its mean depth
    (the back corners' mean distance from the front line; est back corners shift, the roofs stand square)."""
    a, b, t, n_r, L = _seg(sw, se)
    left = -n_r
    D = sum((_p2(q) - a).dot(left) for q in (ne, nw)) / 2
    return a, math.degrees(math.atan2(t.y, t.x)), L, max(1.0, D)


def _thatch_lean(x0, x1, y_lo, y_hi, z_lo, z_hi, rng, thick=0.16, mat="reed", ragged=True, nx_step=0.55):
    """A lean-to of thatch in the local frame: from its eave along y = y_lo (z_lo, the low side) up to y_hi (z_hi),
    between x0 and x1: a slightly bulging top whose hem wobbles in plan and height (never ruled), a rolled front
    edge `thick` deep, a straw underside, closed ends, and a ragged fringe of straw ends along the hem. UVs: the reed
    swatch's strands run down the slope. Returns z_under(y): the underside's height at y (for posts and plates)."""
    nx = max(2, round((x1 - x0) / nx_step))
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    tile = sb.MATERIALS[mat][1]

    def wob(i, amp):
        f = i / nx
        return amp * (math.sin(6.283 * 2.3 * f + ph[0]) + 0.6 * math.sin(6.283 * 5.1 * f + ph[1])) / 1.6

    ys = [y_lo, y_lo + (y_hi - y_lo) * 0.45, y_hi]
    top_rows, und_rows = [], []
    for j, y in enumerate(ys):
        f = (y - y_lo) / max(1e-6, y_hi - y_lo)
        bulge = 0.05 * math.sin(math.pi * f)
        row, urow = [], []
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx
            dy = wob(i, 0.06) if j == 0 else 0.0
            dz = wob(i + 3, 0.035) if j == 0 else 0.0
            z = z_lo + (z_hi - z_lo) * f + bulge + dz
            row.append(V((x, y + dy, z)))
            urow.append(V((x, y + dy + (0.05 if j == 0 else 0.0), z - thick + (0.04 if j == 0 else 0.0))))
        top_rows.append(row)
        und_rows.append(urow)
    verts, faces, uvs = [], [], []

    def grid(rows, flip, voff):
        base = len(verts)
        for r in rows:
            verts.extend(r)
        acc = [0.0]
        for j in range(1, len(rows)):
            acc.append(acc[-1] + (rows[j][0] - rows[j - 1][0]).length)
        for j in range(len(rows) - 1):
            for i in range(nx):
                q = (base + j * (nx + 1) + i, base + j * (nx + 1) + i + 1, base + (j + 1) * (nx + 1) + i + 1,
                     base + (j + 1) * (nx + 1) + i)
                uv = [(acc[j] / tile + voff, rows[j][i].x / tile), (acc[j] / tile + voff, rows[j][i + 1].x / tile),
                      (acc[j + 1] / tile + voff, rows[j + 1][i + 1].x / tile), (acc[j + 1] / tile + voff, rows[j + 1][i].x / tile)]
                if flip:
                    q, uv = tuple(reversed(q)), list(reversed(uv))
                faces.append(q)
                uvs.append(uv)
        return base
    # top faces up: rows go from the eave up the slope, x increasing; (i, i+1, up) is counter-clockwise from above
    bt = grid(top_rows, False, 0.0)
    bu = grid(und_rows, True, 0.3)
    w = nx + 1
    for i in range(nx):                       # the rolled front edge
        q = (bu + i, bu + i + 1, bt + i + 1, bt + i)
        faces.append(q)
        uvs.append([(0.0, top_rows[0][i].x / tile), (0.0, top_rows[0][i + 1].x / tile), (thick / tile, top_rows[0][i + 1].x / tile),
                    (thick / tile, top_rows[0][i].x / tile)])
    for e, sgn in ((0, -1), (nx, 1)):          # the two ends
        ring = [bt + e, bt + w + e, bt + 2 * w + e, bu + 2 * w + e, bu + w + e, bu + e]
        if _newell([verts[q_] for q_ in ring]).x * sgn < 0:
            ring = list(reversed(ring))
        faces.append(tuple(ring))
        uvs.append([(0.1 * q_, 0.0) for q_ in range(6)])
    k.add(mat, False, verts, faces, uvs)
    if ragged:                                 # tufts of straw ends under the hem
        hem = und_rows[0]
        for i in range(nx):
            p, q = hem[i], hem[i + 1]
            L = (q - p).length
            s = rng.uniform(0.0, 0.08)
            while s < L:
                c = p.lerp(q, s / L)
                tv = (q - p) / L
                wdt = rng.uniform(0.03, 0.07)
                k.add(mat, False, [c - tv * (wdt / 2), c + tv * (wdt / 2), c - V((0, 0.015, 0)) - UP * rng.uniform(0.04, 0.1)],
                      [(0, 1, 2)])
                s += rng.uniform(0.06, 0.14)

    def z_under(y):
        f = max(0.0, min(1.0, (y - y_lo) / max(1e-6, y_hi - y_lo)))
        return z_lo + (z_hi - z_lo) * f + 0.05 * math.sin(math.pi * f) - thick
    return z_under


def _slat_row(x0, x1, y, z0, z_top, rng, w=0.075, gap=0.03, mat="reed", rails=(0.35, 0.85), collide=True):
    """A wall of close vertical slats (bamboo or reed) along y between x0 and x1 (local frame), z0 up to z_top(x)
    (a number or a callable); two horizontal rails; one hidden board collider. Each slat its own single face, a little
    in or out and uneven at the top."""
    zt = z_top if callable(z_top) else (lambda x: z_top)
    x = x0
    i = 0
    while x < x1 - 0.02:
        xe = min(x1, x + w * rng.uniform(0.8, 1.2))
        o = 0.012 if i % 2 else -0.012
        za, zb = zt(x) - rng.uniform(0.0, 0.06), zt(xe) - rng.uniform(0.0, 0.06)
        k.add(mat, False, [V((x, y + o, z0)), V((xe, y + o, z0)), V((xe, y + o, zb)), V((x, y + o, za))], [(0, 1, 2, 3)],
              [[(0, x), (0, xe), (zb, xe), (za, x)]])
        x = xe + gap * rng.uniform(0.6, 1.4)
        i += 1
    for f in rails:
        zz = z0 + (min(zt(x0), zt(x1)) - z0) * f
        k.beam("bamboo", False, (x0, y - 0.03, zz), (x1, y - 0.03, zz), 0.035, 0.035, 0)
    if collide:
        k.add("hidden", True, [V((x0, y, z0)), V((x1, y, z0)), V((x1, y, z0 + 1.8)), V((x0, y, z0 + 1.8))], [(0, 1, 2, 3)])


def _post_row(pts, z_top_at, rng, r=0.065, mat="timber", plate=True):
    """Plain round posts at plan points (local frame) from the ground to z_top_at(x, y) - 0.1, each a little out of
    true; a plate following their tops. Returns the tops."""
    tops = []
    for x, y in pts:
        zt = z_top_at(x, y) - 0.1
        top = V((x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), zt))
        sb.cyl(mat, True, V((x, y, -0.06)), top, r, r * 0.85, segs=6, caps=False)
        tops.append(top)
    if plate:
        for p, q in zip(tops, tops[1:]):
            if abs(p.z - q.z) < 0.2:
                k.beam(mat, False, p + UP * 0.04, q + UP * 0.04, 0.08, 0.09, 0.015)
    return tops


def thatch_shed_skirt(sw, se, ne, nw, z0, rng, eave=2.6, rise=1.9, skirt_depth=1.3, skirt_eave=2.05, posts=8,
                      vent=True, fringe=True, back_slats=None, rear_roof=None, valance=None, main=(0.0, 1.0),
                      skirt=(0.0, 1.0), over=0.45, post_r=0.065):
    """望楼饭铺 (S2.bld.wanglou_shed_28660): an open eating shed on plain posts under a big hipped thatched roof, a
    lower thatched skirt roof along its front. Returns the highest ridge's z.

    sw..nw: the shed's plan (sw -> se its front, the posts' feet); the roofs stand square on the front line and the
    back corners' mean depth (the back corners are est). Three rows of plain round posts (they collide): `posts` along
    the front, carrying the skirt's eave plate; half as many under the main roof's front eave, `skirt_depth` back from
    the front; half as many along the back; plates along each row's tops and light rafters under the skirt.
    The skirt (my reading of the painting: its eave over the front posts, v ~540, the main roof's hem above and
    behind it, v ~470) is a lean-to of thatch (kit_common.thatch_lean_to) from `skirt_eave` at the front posts up
    under the main roof's hem,
    `skirt_depth` deep, over the part `skirt`=(t0, t1) of the front, with a ragged straw hem. The main roof:
    `_thatch_hip` (straight slopes with crisp hips as painted, a rolled wobbly hem, a roped ridge roll, a ragged
    fringe; kit_outer_road.thatch_roof's rounded loaf read wrong beside the scan) from the skirt's back to
    the back line + `over`, eave at `eave`, ridge `rise` above it, over `main`=(t0, t1) of the front (the painted
    upper roof covers about the west 55%: u 28280-28700 of 28300-29050). vent: a small gable vent (a dark triangle
    under barge boards with a little king post) in its east hip, as painted at u 28653-28737.
    fringe: True or (t0, t1): a slatted fringe of short reed strips hanging under the skirt's eave (painted at u
    28880-28910). back_slats=(t0, t1): a wall of vertical slats along the back over that part (painted u 28920-29030),
    with a hidden board collider. rear_roof=(t0, t1, depth): a second big hipped thatch over that part, from the
    skirt's back to `depth` m behind the back line, standing 0.35 m higher (painted u 28600-29050, behind the east
    half). valance=(t0, t1): a short valance (kit_outer_road_2.valance) along that part of the skirt's eave (painted
    u 28949-29014).
    choice: posts 13 cm round; the skirt's thatch 0.16 m, the main roof's 0.28 m (thatch_roof); over 0.45 m.
    """
    a, yaw, L, D = _local_frame(sw, se, ne, nw)
    ridges = [eave + rise]
    with k.placed(k.frame(a.x, a.y, z0, yaw)):
        # the main roof
        mx0, mx1 = main[0] * L - over, main[1] * L + over
        my0, my1 = skirt_depth - over, D + over
        info = _thatch_hip(mx0, mx1, my0, my1, eave, eave + rise, rng, vent=0.45 if vent else None)
        rinfo = None
        if rear_roof:
            r0, r1, rdep = rear_roof
            rx0, rx1, ry0, ry1 = r0 * L - over, r1 * L + over, skirt_depth + 0.5, D + rdep + over
            rinfo = _thatch_hip(rx0, rx1, ry0, ry1, eave + 0.35, eave + 0.35 + rise + 0.25, rng)
            ridges.append(eave + 0.35 + rise + 0.25)
        # the skirt: from its eave over the front posts up under the main roof's hem
        sx0, sx1 = skirt[0] * L - 0.05, skirt[1] * L + 0.05     # thatch_lean_to runs its eave 0.2 m past both ends
        z_hi = eave - 0.1
        sk_d = skirt_depth + 0.57
        _common("thatch_lean_to")((sx0, -0.32), (sx1, -0.32), sk_d, skirt_eave, z_hi, rng, posts=0, fringe=True, side=1,
                                  thick=0.2, mat=STRAW)

        def z_sk(y):
            f = max(0.0, min(1.0, (y + 0.32) / sk_d))
            return skirt_eave + (z_hi - skirt_eave) * f - 0.2

        def under(x, y):
            zs = []
            if mx0 + 0.3 < x < mx1 - 0.3 and my0 + 0.3 < y < my1 - 0.3:
                zs.append(info["z_under_at"](x, y))
            if rinfo and rx0 + 0.3 < x < rx1 - 0.3 and ry0 + 0.3 < y < ry1 - 0.3:
                zs.append(rinfo["z_under_at"](x, y))
            if sx0 < x < sx1 and -0.3 < y < skirt_depth + 0.2:
                zs.append(z_sk(y))
            return min(zs) if zs else eave - 0.3

        nf = max(2, posts)
        front = [(L * i / (nf - 1) + (rng.uniform(-0.06, 0.06) if 0 < i < nf - 1 else 0.0), 0.0) for i in range(nf)]
        front = [p for p in front if sx0 - 0.05 <= p[0] <= sx1 + 0.05]   # outside the skirt the middle row stands
        _post_row(front, under, rng, r=post_r)
        nm = max(2, nf // 2 + 1)
        mid = [(L * i / (nm - 1), skirt_depth) for i in range(nm)]
        _post_row(mid, under, rng, r=post_r)
        back = [(L * i / (nm - 1), D) for i in range(nm)]
        _post_row(back, under, rng, r=post_r)
        for x, _y in front[::2]:                # light rafters under the skirt
            k.beam("bamboo", False, (x, -0.2, z_sk(-0.2) - 0.03), (x, skirt_depth + 0.15, z_sk(skirt_depth + 0.15) - 0.03),
                   0.05, 0.05, 0)
        # the slatted fringe under the skirt's eave
        if fringe:
            f0, f1 = (0.0, 1.0) if fringe is True else fringe
            x, zt = f0 * L - 0.2, z_sk(-0.2) + 0.02
            i = 0
            while x < f1 * L + 0.2:
                xe = x + rng.uniform(0.05, 0.09)
                o = -0.3 + (0.01 if i % 2 else -0.01)
                zb_ = zt - rng.uniform(0.2, 0.3)
                k.add("reed", False, [V((x, o, zb_)), V((xe, o, zb_)), V((xe, o, zt)), V((x, o, zt))], [(0, 1, 2, 3)],
                      [[(zb_, x), (zb_, xe), (zt, xe), (zt, x)]])
                x = xe + rng.uniform(0.015, 0.04)
                i += 1
            k.beam("bamboo", False, (f0 * L - 0.22, -0.3, zt - 0.02), (f1 * L + 0.22, -0.3, zt - 0.02), 0.03, 0.03, 0)
        if valance:
            import kit_outer_road_2 as ko2
            ko2.valance((valance[0] * L, -0.36), (valance[1] * L, -0.36), z_sk(-0.36) + 0.04, rng, depth=0.3)
        if back_slats:
            _slat_row(back_slats[0] * L, back_slats[1] * L, D - 0.05, 0.0, lambda x: min(2.3, under(x, D - 0.05) - 0.05), rng)
    return z0 + max(ridges)


def _plain_gable(x0, x1, yf, yb, z_eave, z_ridge, mat="reed", thick=0.1, barge=True):
    """A plain gable roof (no tiles: a mat or board roof) over x0..x1 between eave lines yf (front) and yb, ridge
    along x: straight slopes with thickness, a timber underside, fascia, barge boards on both gable ends, a ridge
    batten. (song_kit.gable_roof is the tiled one.)"""
    yc = (yf + yb) / 2

    def height(s, t):
        return z_eave + (z_ridge - z_eave) * t
    slopes = [((x0, yf), (x1, yf), (x0, yc), (x1, yc), max(2, round((x1 - x0) / 1.4))),
              ((x1, yb), (x0, yb), (x1, yc), (x0, yc), max(2, round((x1 - x0) / 1.4)))]
    edges = k._roof_surface(slopes, height, thick, 2, mat=mat, under="timber", rafters=False)
    if barge:
        for rows in edges:
            for col in (0, -1):
                line = [r[col] for r in rows]
                for a, b in zip(line, line[1:]):
                    k.beam("timber", False, a - UP * 0.04, b - UP * 0.04, 0.06, 0.22, 0.012)
    k.beam("timber", False, (x0 - 0.05, yc, z_ridge + 0.04), (x1 + 0.05, yc, z_ridge + 0.04), 0.14, 0.1, 0.02)


def _diamond_band(a, b, z_top, z_bot, out, rng, step=0.32, mat="timber"):
    """A carved sill band along a -> b (plan, local): a top and a bottom moulding and a row of small lozenge bosses
    between them (the painted floor sill's repeated carving), facing `out` (plan vector)."""
    A, Bp = V((a[0], a[1], 0)), V((b[0], b[1], 0))
    t = (Bp - A).normalized()
    o = V(out).normalized()
    L = (Bp - A).length
    _member(mat, False, A + UP * z_top, Bp + UP * z_top, o, 0.08, 0.06, 0.012)
    _member(mat, False, A + UP * z_bot, Bp + UP * z_bot, o, 0.08, 0.06, 0.012)
    k.add(mat, False, [A + UP * (z_bot + 0.03), Bp + UP * (z_bot + 0.03), Bp + UP * (z_top - 0.03), A + UP * (z_top - 0.03)],
          [(0, 1, 2, 3)] if t.cross(UP).dot(o) > 0 else [(3, 2, 1, 0)])
    n = max(1, round(L / step))
    zc, r = (z_top + z_bot) / 2, (z_top - z_bot) / 2 - 0.035
    for i in range(n):
        c = A + t * (L * (i + 0.5) / n) + o * 0.01 + UP * zc
        ring = [c - t * r * 1.3, c - UP * r, c + t * r * 1.3, c + UP * r]
        _plate(mat, False, [p + o * 0.03 for p in ring], o, 0.03, back=False)


def stilt_terrace(sw, se, ne, nw, z_floor, z_foot, rng, west_room=1.8, east_pavilion=2.4, rail_h=0.95, eave=2.8,
                  upper_gap=0.9, blind_east=True, posts=None):
    """The riverside dining terrace (S2.bld.river_terrace_23250). Returns the top of its roofs (z of the higher ridge).

    sw -> se its front (the water side), the back corners' mean depth its depth (the back corners are placeholders);
    all heights here are above the floor z_floor (eave, rail_h, upper_gap). The floor is kit_common.stilt_deck (planks,
    joists, round stilts down to z_foot: a number, or a callable (x, y) -> z for the bank slope under each stilt;
    walkable; it cross-braces its tall posts), with a carved sill band along its front edge (two mouldings and a row of
    lozenge bosses, as the painted sill's repeated carving). Posts at the bays (`posts`: fractions along the front,
    default the painted bays 0, west_room, ~1.4 m apart, the pavilion's west post, the east corner), front and back.
    Along the front a balustrade (it stops a walker: one hidden wall the whole front): light plain panels (plaster)
    between slender dividers, short balusters under a top rail at `rail_h`. The west room: a straight-bar lattice
    screen (song_kit.lattice_window) over its front above the panels, and a lattice partition on its east side over
    the front half only (the route runs across the floor's back from the west end). The roof in two tiers as painted:
    a tiled lower eave (kit_inner_city.lean_to) along the front at `eave`, and a plain light upper roof (a mat roof:
    reed) `upper_gap` higher over the back, on the back posts and short posts on the tie beams, a clerestory gap
    between them. At the east end the pavilion (`east_pavilion` m): its own tiled gable roof (song_kit.gable_roof),
    the gable facing the river with an open king-post truss (kit_outer_road_2.kingpost_gable), a balcony railing of
    close slats with dark knobbed corner posts along its front and east side, and a slatted blind
    (kit_outer_road.bamboo_blind) on its east side above the railing (`blind_east`). The back is open onto the street.
    choice: posts 13 cm square, stilts 12 cm; the upper roof rises 0.8 m, the pavilion's ridge 1.3 m over its eave.
    """
    import kit_inner_city as ki
    import kit_outer_road as ko
    import kit_outer_road_2 as ko2
    a, yaw, L, D = _local_frame(sw, se, ne, nw)
    tdir = _p2(V(se) - V(sw)).normalized()
    left = V((-tdir.y, tdir.x, 0))

    def zf(lx, ly):
        w = a + tdir * lx + left * ly
        return _zf(z_foot, w.x, w.y) - z_floor

    xp = max(west_room + 0.8, L - east_pavilion)
    if posts is None:
        xs = [0.0, west_room]
        n_mid = max(1, round((xp - west_room) / 1.45))
        xs += [west_room + (xp - west_room) * i / n_mid for i in range(1, n_mid + 1)]
        xs.append(L)
    else:
        xs = sorted(L * f for f in posts)
    with k.placed(k.frame(a.x, a.y, z_floor, yaw)):
        # the floor (kit_common.stilt_deck: planks, joists, round stilts down the bank) and its carved sill
        _common("stilt_deck")([(0.0, -0.06), (L, -0.06), (L, D), (0.0, D)], 0.0, rng, zf, post_every=1.45, rail=None,
                              fascia=None, collide=True)
        _diamond_band((-0.04, -0.1), (L + 0.04, -0.1), -0.1, -0.36, (0, -1, 0), rng)
        # posts, plates and tie beams
        ze = eave - 0.1
        for x in xs:
            for y in (0.0, D):
                zt = (eave + upper_gap - 0.08) if y == D and x <= xp + 0.01 else ze
                k.post("timber", True, x, y, 0.0, zt, 0.13, 0.02)
        k.beam("timber", False, (-0.15, 0.0, ze), (L + 0.15, 0.0, ze), 0.12, 0.16, 0.02)
        k.beam("timber", False, (-0.15, D, eave + upper_gap - 0.12), (xp + 0.1, D, eave + upper_gap - 0.12), 0.12, 0.14, 0.02)
        k.beam("timber", False, (xp, D, ze), (L + 0.15, D, ze), 0.12, 0.14, 0.02)
        yq = max(0.3, D * 0.3)
        for x in xs:
            if x <= xp + 0.01:
                k.beam("timber", False, (x, -0.1, ze - 0.12), (x, D + 0.1, ze - 0.12), 0.1, 0.13, 0.015)
                k.post("timber", False, x, yq, ze - 0.06, eave + upper_gap - 0.06, 0.1, 0.015)
        # the balustrade: panels, dividers, short balusters, top rail; one hidden wall
        k.add("hidden", True, [V((0, -0.05, 0)), V((L, -0.05, 0)), V((L, -0.05, rail_h + 0.15)), V((0, -0.05, rail_h + 0.15))],
              [(0, 1, 2, 3)])
        for xa_, xb_ in zip(xs, xs[1:]):
            if xa_ >= xp - 0.01:
                continue
            A, Bp = V((xa_ + 0.07, -0.02, 0)), V((xb_ - 0.07, -0.02, 0))
            k.beam("timber", False, A + UP * 0.05, Bp + UP * 0.05, 0.07, 0.06, 0.01)
            k.board("plaster", False, (A.x, -0.02), (Bp.x, -0.02), 0.025, 0.08, rail_h - 0.2)
            k.beam("timber", False, A + UP * (rail_h - 0.18), Bp + UP * (rail_h - 0.18), 0.06, 0.05, 0.01)
            k.beam("timber", False, A + UP * rail_h, Bp + UP * rail_h, 0.075, 0.065, 0.015)
            Lb = Bp.x - A.x
            nd = max(1, round(Lb / 0.6))
            for i in range(1, nd):
                xx = A.x + Lb * i / nd
                k.beam("timber", False, (xx, -0.035, 0.08), (xx, -0.035, rail_h - 0.2), 0.04, 0.03, 0)
            nbl = max(2, round(Lb / 0.3))
            for i in range(nbl):
                xx = A.x + Lb * (i + 0.5) / nbl
                k.beam("timber", False, (xx, -0.02, rail_h - 0.16), (xx, -0.02, rail_h - 0.03), 0.035, 0.035, 0)
            if xb_ <= west_room + 0.01:      # the west room: a lattice screen over its front
                k.lattice_window((A.x, -0.0), (Bp.x, -0.0), rail_h + 0.05, ze - 0.12)
        if west_room > 0.3:
            k.lattice_window((west_room, -0.0), (west_room, D * 0.5), 0.05, ze - 0.12)
        # the two-tier roof over the hall
        ki.lean_to(-0.35, xp + 0.25, -0.75, D * 0.45, eave, eave + 0.6)
        _plain_gable(-0.3, xp + 0.15, yq - 0.45, D + 0.45, eave + upper_gap, eave + upper_gap + 0.8)
        # the east pavilion
        xc, hw = (xp + L) / 2, (L - xp) / 2
        with k.placed(k.frame(xc, 0.0, 0.0, 90)):
            k.gable_roof(-0.3, D + 0.25, -hw - 0.35, hw + 0.35, eave + 0.1, eave + 1.4, over=0.3, ns=6, nt=3, ornament_s=0.22)
        ko2.kingpost_gable((xp, -0.12), (L, -0.12), eave - 0.05, eave + 1.3, rng)
        zr = rail_h
        rail = [V((xp, -0.06, 0)), V((L + 0.04, -0.06, 0)), V((L + 0.04, D, 0))]
        for p, q in zip(rail, rail[1:]):
            tt = (q - p).normalized()
            out = V((tt.y, -tt.x, 0))
            k.beam("timber", False, p + UP * 0.06, q + UP * 0.06, 0.07, 0.06, 0.01)
            k.beam("timber", False, p + UP * zr, q + UP * zr, 0.07, 0.06, 0.01)
            Ls = (q - p).length
            ns_ = max(2, round(Ls / 0.09))
            for i in range(1, ns_):
                c = p + tt * (Ls * i / ns_) + out * 0.01
                k.add("timber", False, [c - tt * 0.015 + UP * 0.09, c + tt * 0.015 + UP * 0.09, c + tt * 0.015 + UP * (zr - 0.03),
                                        c - tt * 0.015 + UP * (zr - 0.03)], [(0, 1, 2, 3)])
        if D > 0.2:
            k.add("hidden", True, [V((L + 0.05, 0, 0)), V((L + 0.05, D, 0)), V((L + 0.05, D, rail_h + 0.15)),
                                   V((L + 0.05, 0, rail_h + 0.15))], [(0, 1, 2, 3)])
        for p in (V((xp, -0.06, 0)), V((L + 0.04, -0.06, 0)), V((L + 0.04, D, 0))):
            k.post("timber", False, p.x, p.y, 0.0, zr + 0.1, 0.1, 0.015)
            _vlathe("interior", False, p + UP * (zr + 0.1), [(0.06, 0.0), (0.075, 0.05), (0.06, 0.1), (0.0, 0.14)], segs=6)
        if blind_east:
            ko.bamboo_blind((L + 0.08, 0.15), (L + 0.08, D - 0.1), zr + 0.2, ze - 0.05, rng)
    return z_floor + max(eave + upper_gap + 0.8, eave + 1.4)


def rough_steps(top_a, top_b, foot_a, foot_b, z_top, z_foot, rng, n=6, stones=True):
    """Rough landing steps (S2.str.landing_steps_22950): n treads of irregular stone slabs from the bank top (the
    edge top_a -> top_b at z_top) down to the water (foot_a -> foot_b at z_foot, under the water's H), each its own soft
    slab (song_kit.soft_slab: hand-cut outline, rounded corners, eased top; the stone's painted face atlas) laid
    a little askew and of its own width, each resting on the one below; a hidden ramp collider from top to foot; a
    few stones beside them (`stones`: 'with weeds or stones beside them'). choice: treads overlap 0.08 m."""
    TA, TB, FA, FB = _p2(top_a), _p2(top_b), _p2(foot_a), _p2(foot_b)
    rise = (z_top - z_foot) / n
    for i in range(n):
        f0, f1 = i / n, (i + 1) / n
        ja, jb = rng.uniform(-0.14, 0.08), rng.uniform(-0.08, 0.14)
        a0, b0 = TA.lerp(FA, max(0.0, f0 - 0.06)), TB.lerp(FB, max(0.0, f0 - 0.06))
        a1, b1 = TA.lerp(FA, f1), TB.lerp(FB, f1)
        w = (b0 - a0).normalized()
        out = [a0 + w * (0.05 + ja), b0 - w * (0.05 - jb), b1 - w * (0.02 - jb * 0.7), a1 + w * (0.03 + ja * 0.6)]
        zt = z_top - rise * (i + 0.6) + rng.uniform(-0.04, 0.03)
        k.soft_slab("stone", False, [(p.x, p.y) for p in out], zt - rng.uniform(0.16, 0.24), zt, rng, r=0.09, wob=0.035,
                    seg=0.35, tilt=0.05)
    k.add("hidden", True, [V((TA.x, TA.y, z_top)), V((TB.x, TB.y, z_top)), V((FB.x, FB.y, z_foot)), V((FA.x, FA.y, z_foot))],
          [(0, 1, 2, 3)] if _newell([TA, TB, FB, FA]).z >= 0 else [(3, 2, 1, 0)])
    if stones:
        w = (TB - TA).normalized()
        for side, P0, P1 in ((-1, TA, FA), (1, TB, FB)):
            for j in range(2):
                f = rng.uniform(0.25, 0.85)
                p = P0.lerp(P1, f) + w * side * rng.uniform(0.18, 0.35)
                k.rock("stone", p.x, p.y, z_top - (z_top - z_foot) * f + 0.02, rng.uniform(0.12, 0.22), rng, flat=0.5)
    return None


def plank_platform(p0, p1, depth, z0, h, rng, caps=4):
    """The warehouse's raised platform (S2.bld.warehouse_26070's base): its face along p0 -> p1, its depth to the left
    of p0 -> p1, from z0 up h: the face and the two ends faced with horizontal planks, each its own lap (its foot 2 cm
    proud with a chamfer, so the ink draws one line per plank, as painted), a nosing board along the top's front edge,
    the top boarded along the front (walkable) and plain behind; `caps` capped posts standing proud on the face (the
    bay posts carried down, painted at u ~25895, 26010, 26120). One hidden solid collider. Returns its top z.
    choice: planks 0.2 m high; the posts 0.16 m square with a cap block and a knob."""
    a, b, t, n_r, L = _seg(p0, p1)
    left = -n_r
    top = z0 + h
    ring = [a, b, b + left * depth, a + left * depth]
    np_ = max(2, round(h / 0.2))
    zs = [z0 - 0.04 + (h + 0.02) * i / np_ for i in range(np_ + 1)]
    for i in range(np_):
        zb, zt = zs[i], zs[i + 1]
        for (P, Q, o) in ((a, b, n_r), (b, b + left * depth, t), (a + left * depth, a, -t)):
            lap = 0.02
            verts = [P + UP * zb, Q + UP * zb, Q + o * lap + UP * (zb + lap), P + o * lap + UP * (zb + lap),
                     Q + UP * zt, P + UP * zt]
            faces = [(0, 1, 2, 3), (3, 2, 4, 5)]
            if _newell([verts[q] for q in faces[1]]).dot(o) < 0:
                faces = [tuple(reversed(f)) for f in faces]
            k.add("deck", False, verts, faces)
    _member("timber", False, a - t * 0.03 + n_r * 0.03 + UP * (top - 0.03), b + t * 0.03 + n_r * 0.03 + UP * (top - 0.03),
            n_r, 0.1, 0.07, 0.012)
    x = 0.0
    while x < L - 0.05:
        w = min(rng.uniform(0.24, 0.32), L - x)
        q0, q1 = a + t * (x + 0.006), a + t * (x + w - 0.006)
        d0 = min(depth, 0.9 + rng.uniform(-0.1, 0.1))
        bot = [q0 + UP * (top - 0.04), q1 + UP * (top - 0.04), q1 + left * d0 + UP * (top - 0.04), q0 + left * d0 + UP * (top - 0.04)]
        _box8("deck", False, bot, [p + UP * (0.04 + rng.uniform(-0.004, 0.004)) for p in bot])
        x += w
    if depth > 0.95:
        k.add("deck", False, [a + left * 0.9 + UP * (top - 0.005), b + left * 0.9 + UP * (top - 0.005),
                              b + left * depth + UP * (top - 0.005), a + left * depth + UP * (top - 0.005)],
              [(0, 1, 2, 3)] if _newell([a, b, b + left, a + left]).z > 0 else [(3, 2, 1, 0)])
    k.prism("hidden", True, [p + UP * (z0 - 0.05) for p in (ring if _newell(ring).z > 0 else list(reversed(ring)))],
            [p + UP * top for p in (ring if _newell(ring).z > 0 else list(reversed(ring)))])
    for i in range(max(0, caps)):
        f = (i + 0.5) / caps if caps > 1 else 0.5
        c = a + t * (L * f) + n_r * 0.06
        _member("timber", False, c + UP * (z0 - 0.03), c + UP * (top + 0.06), t, 0.16, 0.16, 0.02)
        _member("timber", False, c + UP * (top + 0.06), c + UP * (top + 0.13), t, 0.22, 0.22, 0.025)
        _vlathe("timber", False, c + UP * (top + 0.13), [(0.06, 0.0), (0.07, 0.03), (0.0, 0.08)], segs=6)
    return top


def swept_awning(a, b, out, z, rise, rng, post=True, mat="reed"):
    """A big curved mat awning (S2.bld.scaffold_house_24975's, over its stall) cantilevered from the wall line a -> b
    (plan points; a third value is the ground's z under the post, else 0) at height z, sweeping `out` m to the right
    of a -> b and up `rise` m at its free edge (upturned like the painted mat): a mat slab with thickness and a rolled
    free edge, bamboo ribs under it following the sweep, a bamboo pole along the free edge, a ledger on the wall; held
    by a post at a's corner (`post`) with a diagonal stay. choice: the sweep z + rise * s^1.8 across, the mat 4 cm."""
    A, Bp = _p2(a), _p2(b)
    zg = a[2] if len(a) > 2 else 0.0
    tt = (Bp - A).normalized()
    right = V((tt.y, -tt.x, 0))
    L = (Bp - A).length
    ns, nt, th = max(3, round(L / 0.6)), 5, 0.04

    def P(s, u):
        sag = 0.06 * math.sin(math.pi * s) * math.sin(math.pi * u)
        return A + tt * (L * s) + right * (out * u) + UP * (z + rise * (u ** 1.8) - sag)
    tops = [[P(i / ns, j / nt) for i in range(ns + 1)] for j in range(nt + 1)]
    verts = [p for row in tops for p in row] + [p - UP * th for row in tops for p in row]
    W = ns + 1
    off = len(verts) // 2
    faces, uvs = [], []
    tile = sb.MATERIALS[mat][1]
    for j in range(nt):
        for i in range(ns):
            q = (j * W + i, j * W + i + 1, (j + 1) * W + i + 1, (j + 1) * W + i)
            uv = [(i * L / ns / tile, j * out / nt / tile), ((i + 1) * L / ns / tile, j * out / nt / tile),
                  ((i + 1) * L / ns / tile, (j + 1) * out / nt / tile), (i * L / ns / tile, (j + 1) * out / nt / tile)]
            if _newell([verts[x] for x in q]).z < 0:
                q, uv = tuple(reversed(q)), list(reversed(uv))
            faces.append(q)
            uvs.append(uv)
            faces.append(tuple(off + x for x in reversed(q)))
            uvs.append(list(reversed(uv)))
    for i in range(ns):                 # the free edge's band
        q = (nt * W + i, nt * W + i + 1, off + nt * W + i + 1, off + nt * W + i)
        faces.append(q)
        uvs.append([(0, 0), (L / ns / tile, 0), (L / ns / tile, th / tile), (0, th / tile)])
    k.add(mat, False, verts, faces, uvs)
    nr = max(2, round(L / 0.7))
    for i in range(nr + 1):
        s = i / nr
        pts = [P(s, u / 4) - UP * (th + 0.025) for u in range(5)]
        sb.tube("bamboo", False, pts, [0.025] * 5, segs=5)
    edge = [P(i / ns, 1.0) - UP * 0.01 + right * 0.02 for i in range(ns + 1)]
    sb.tube("bamboo", False, [edge[0] - tt * 0.15] + edge + [edge[-1] + tt * 0.15], [0.035] * (ns + 3), segs=6)
    _member("timber", False, A - tt * 0.1 + UP * (z - 0.08) - right * 0.03, Bp + tt * 0.1 + UP * (z - 0.08) - right * 0.03,
            right, 0.08, 0.12, 0.012)
    if post:
        pf = A + right * (out * 0.92)
        zt = z + rise * (0.92 ** 1.8) - th - 0.03
        sb.cyl("bamboo", True, V((pf.x, pf.y, zg - 0.05)), V((pf.x, pf.y, zt)), 0.055, 0.048, segs=7, caps=False)
        sb.cyl("bamboo", False, V((pf.x, pf.y, zt - 0.7)), A + right * 0.05 + UP * (z - 0.5), 0.03, segs=5)
    return None


# ---------------------------------------------------------------- poles, frames, ropes and small things

def _lash(at, axis, r, mat="rope"):
    """Rope turns lashing a joint: a short fat band round `axis` at `at`."""
    ax = V(axis).normalized()
    sb.cyl(mat, False, V(at) - ax * 0.035, V(at) + ax * 0.035, r + 0.012, segs=6, caps=False)


def pole(a, b, rng, r=0.05, taper=0.8, sharpen=False, mat="bamboo", collide=False):
    """A pole from a to b (x, y, z): a long rod tapering to r * taper, bowed a little off true (no pole is ruled),
    bamboo nodes (thin rings) every ~0.6 m when mat is bamboo and it is thick enough; sharpen: a cut point at b (the
    scaffold's crown tips). collide: walkers stop at it."""
    A, Bp = V(_p3(a)), V(_p3(b))
    d = Bp - A
    L = d.length
    if L < 1e-4:
        return
    ax = d / L
    side = ax.orthogonal().normalized()
    bow = side * (L * rng.uniform(-0.006, 0.006))
    pts = [A, A.lerp(Bp, 0.5) + bow, Bp]
    rr = [r, r * (1 + taper) / 2, r * taper]
    sb.tube(mat, collide, pts, rr, segs=6)
    if mat == "bamboo" and r >= 0.03 and L > 1.0:
        m = int(L / 0.6)
        for i in range(1, m):
            f = i / m + rng.uniform(-0.02, 0.02)
            c = A.lerp(Bp, f) + bow * (1 - abs(2 * f - 1))
            rad = r * (1 - (1 - taper) * f)
            sb.cyl(mat, False, c - ax * 0.012, c + ax * 0.012, rad * 1.12, segs=6, caps=False)
    if sharpen:
        _lathe3(mat, False, Bp, *_frame_of(ax), [(r * taper, r * taper, 0.0), (0.0, 0.0, r * 4)], segs=6, cap0=False)


def ladder(foot, top, rng, w=0.45, rungs=None, r=0.035, mat="bamboo", collide=False):
    """A free-standing, leaning or lying ladder (S2.prop.ladder_28538; the legs of the pole frame's A-frame) from foot
    to top (x, y, z): two rails (poles) w apart, running 0.15 m past the top rung, rungs every ~0.32 m lashed at both
    ends. Its rungs run level across whatever the lean. collide: a hidden slab along it."""
    F, T = V(_p3(foot)), V(_p3(top))
    d = T - F
    L = d.length
    ax = d.normalized()
    side = ax.cross(UP)
    side = side.normalized() if side.length > 1e-4 else V((1, 0, 0))
    for s in (-0.5, 0.5):
        pole(F + side * (w * s), T + side * (w * s) + ax * 0.15, rng, r=r, taper=0.85, mat=mat)
    n = rungs or max(2, int(L / 0.32))
    for i in range(1, n + 1):
        p = F.lerp(T, i / (n + 0.4))
        sb.cyl(mat, False, p - side * (w / 2 + 0.03), p + side * (w / 2 + 0.03), r * 0.6, segs=5, caps=False)
    if collide:
        k.add("hidden", True, [F - side * (w / 2), F + side * (w / 2), T + side * (w / 2), T - side * (w / 2)], [(0, 1, 2, 3)])


def a_frame(foot_a, foot_b, apex, rng, r=0.06, brace=None, ladders=False, mat="bamboo"):
    """Two poles (or, ladders=True, two railed ladders: the pole frame's west A, apex ~(27415, 105)) leaning together,
    crossing a little past the apex and lashed there; brace=t: a cross brace between the legs at fraction t of their
    height (the east A, apex ~(27598, 120)), lashed at both ends."""
    A, Bp, X = V(_p3(foot_a)), V(_p3(foot_b)), V(_p3(apex))
    for f, other in ((A, Bp), (Bp, A)):
        d = (X - f).normalized()
        if ladders:
            ladder(f, X + d * 0.1, rng, mat=mat)
        else:
            pole(f, X + d * 0.35, rng, r=r, taper=0.8, mat=mat)
    _lash(X, (Bp - A), r * (1.6 if not ladders else 2.5))
    if brace is not None:
        p, q = A.lerp(X, brace), Bp.lerp(X, brace)
        pole(p - (q - p).normalized() * 0.15, q + (q - p).normalized() * 0.15, rng, r=r * 0.7, taper=0.9, mat=mat)
        for e in (p, q):
            _lash(e, (q - p), r)


def pennant_cord(a, b, n, rng, sag=0.3, size=0.28, mats=("cloth_red", "cloth_white", "cloth_indigo")):
    """A cord from a to b (x, y, z) sagging `sag` m with n small pennants hanging from it (S2.prop.pennant_frame_27930:
    about eight from the apex down to the lower shed's roof, painted hanging 10-20 px), each a single triangle a
    little turned, their colours cycling through mats."""
    A, Bp = V(_p3(a)), V(_p3(b))

    def at(t):
        return A.lerp(Bp, t) - UP * (sag * 4 * t * (1 - t))
    pts = [at(i / 10) for i in range(11)]
    sb.tube("rope", False, pts, [0.008] * len(pts), segs=4)
    d = (Bp - A).normalized()
    for i in range(n):
        t = (i + 0.5) / n
        p = at(t)
        turn = V((-d.y, d.x, 0)) * rng.uniform(-0.25, 0.25)
        e = (d + turn).normalized() * (size * 0.55)
        tip = p + e * 0.5 - UP * (size * rng.uniform(0.85, 1.1)) + turn * 0.1
        k.add(mats[i % len(mats)], False, [p, p + e, tip], [(0, 1, 2)])


def pole_stack(x, y, z, rng, r=0.45, h=4.2, n=28, lean=0.1, mat="bamboo"):
    """A dense stack of long poles or stalks standing upright and leaning together, its top rounded
    (S2.prop.pole_stack_24680: a mass of vertical strokes, top edge arching): n thin rods from a ragged foot circle r
    across, leaning in toward the middle, heights falling off toward the edge as a dome; a few rope ties round the
    middle; one hidden collider."""
    c = V((x, y, z))
    for i in range(n):
        a = 2 * math.pi * i / n + rng.uniform(-0.2, 0.2)
        rr = r * math.sqrt(rng.uniform(0.05, 1.0))
        foot = c + V((math.cos(a) * rr, math.sin(a) * rr, -0.04))
        hh = h * math.sqrt(max(0.1, 1 - 0.55 * (rr / r) ** 2)) * rng.uniform(0.93, 1.03)
        topp = c + V((math.cos(a) * rr * (1 - lean * 3), math.sin(a) * rr * (1 - lean * 3), hh))
        topp += V((rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05), 0))
        sb.cyl(mat, False, foot, topp, rng.uniform(0.022, 0.032), 0.016, segs=5, caps=False)
    for zz in (h * 0.35, h * 0.62):
        sb.cyl("rope", False, c + UP * (zz - 0.03), c + UP * (zz + 0.03), r * (1 - lean * 3 * zz / h) + 0.03, segs=10, caps=False)
    sb.cyl("hidden", True, c - UP * 0.05, c + UP * min(h, 2.2), r + 0.02, segs=8)


def sloped_balustrade(top, foot, rng, h=0.9, spacing=0.12, low_rail=0.35, post_every=1.2, mat="timber"):
    """The slanting railing of a stair or ramp (S2.str.railed_stair_27630: an upper rail with close balusters between
    it and a middle rail, a lower rail on posts): from top to foot (x, y, z: the walking line under it), posts every
    <= post_every with knob tops, a sloping top rail at h, a middle rail at 0.62 h with close balusters (`spacing`)
    between it and the top rail, a lower rail at low_rail, a sill along the foot line. It stops a walker (a hidden
    sloped wall)."""
    T, F = V(_p3(top)), V(_p3(foot))
    d = T - F
    L = _p2(d).length
    side = _p2(d).normalized().cross(UP)
    for zz, w_, hh in ((h, 0.07, 0.065), (h * 0.62, 0.05, 0.05), (low_rail, 0.05, 0.05), (0.04, 0.08, 0.06)):
        _member(mat, False, F + UP * zz, T + UP * zz, side, w_, hh, 0.01)
    m = max(1, math.ceil(L / post_every))
    for i in range(m + 1):
        p = F.lerp(T, i / m)
        _member(mat, False, p - UP * 0.03, p + UP * (h + 0.1), side, 0.09, 0.09, 0.012)
        _vlathe(mat, False, p + UP * (h + 0.1), [(0.055, 0.0), (0.06, 0.03), (0.0, 0.1)], segs=6)
    nb = max(2, round(L / spacing))
    for i in range(nb):
        f = (i + 0.5) / nb
        if any(abs(f - j / m) * L < 0.06 for j in range(m + 1)):
            continue
        p = F.lerp(T, f)
        _member(mat, False, p + UP * (h * 0.62 + 0.02), p + UP * (h - 0.03), side, 0.03, 0.03)
    k.add("hidden", True, [F, T, T + UP * (h + 0.15), F + UP * (h + 0.15)], [(0, 1, 2, 3)])


def folding_seat(x, y, z, yaw_deg, rng, h=0.45, w=0.42, d=0.34, mat="timber", seat_mat="cloth_indigo"):
    """A crossed-leg folding seat (交杌; three in 沿河雅座, S2.prop.hall_tables_chairs_25775): two X-frames of legs
    pinned where they cross, on the sitter's left and right, joined by foot bars on the ground and seat rails at the top,
    a webbing seat sagging between the rails; the sitter faces yaw_deg. Never collides (seated figures)."""
    a = math.radians(yaw_deg)
    f = V((math.cos(a), math.sin(a), 0))
    s = V((-f.y, f.x, 0))
    c = V((x, y, z))
    for sg in (-1, 1):
        e = c + s * (sg * w / 2)
        for k_ in (-1, 1):
            p0 = e - f * (k_ * d / 2) + UP * 0.02
            p1 = e + f * (k_ * d / 2) + UP * (h - 0.03)
            _member(mat, False, p0 + s * (0.012 * k_), p1 + s * (0.012 * k_), s, 0.028, 0.03)
        sb.cyl("ridge", False, e + UP * (h / 2) - s * 0.03, e + UP * (h / 2) + s * 0.03, 0.012, segs=5)
    for k_ in (-1, 1):
        _member(mat, False, c - s * (w / 2 + 0.02) + f * (k_ * d / 2) + UP * 0.02,
                c + s * (w / 2 + 0.02) + f * (k_ * d / 2) + UP * 0.02, f, 0.035, 0.035, 0.006)
        _member(mat, False, c - s * (w / 2 + 0.03) + f * (k_ * d / 2) + UP * (h - 0.015),
                c + s * (w / 2 + 0.03) + f * (k_ * d / 2) + UP * (h - 0.015), f, 0.035, 0.03, 0.006)
    pts = []
    for i in range(4):
        u = i / 3
        pts.append(c - f * (d / 2) + f * (d * u) + UP * (h - 0.015 - 0.03 * math.sin(math.pi * u)))
    for i in range(3):
        p, q = pts[i], pts[i + 1]
        k.add(seat_mat, False, [p - s * (w / 2), p + s * (w / 2), q + s * (w / 2), q - s * (w / 2)], [(0, 1, 2, 3)])


def slat_shutters(p0, p1, z0, z1, rng, slats=None, mat="timber"):
    """Horizontal slatted shutters closing a bay (S2.bld.shop_row_21200's east bay): a frame of two stiles, a head
    and a sill standing a little proud, two leaves divided by a centre stile, each filled with horizontal slats
    tilted like louvres (each its own board, so the ink draws every slat); `slats` per leaf (default one every
    0.12 m). It collides (a hidden board in its plane). Faces the right of p0 -> p1."""
    a, b, t, n, L = _seg(p0, p1)
    o = n * 0.03
    for p in (a, b):
        _member(mat, False, p + o + UP * z0, p + o + UP * z1, n, 0.09, 0.07, 0.012)
    _member(mat, False, a + o + UP * z1, b + o + UP * z1, n, 0.08, 0.1, 0.012)
    _member(mat, False, a + o + UP * (z0 + 0.04), b + o + UP * (z0 + 0.04), n, 0.08, 0.09, 0.012)
    m = a.lerp(b, 0.5)
    _member(mat, False, m + o + UP * z0, m + o + UP * z1, n, 0.06, 0.06, 0.01)
    ns = slats or max(4, round((z1 - z0 - 0.15) / 0.12))
    for lo, hi in ((a + t * 0.045, m - t * 0.03), (m + t * 0.03, b - t * 0.045)):
        for i in range(ns):
            zc = z0 + 0.1 + (z1 - z0 - 0.17) * (i + 0.5) / ns
            tilt = UP * 0.035
            _member(mat, False, lo + o * 0.5 + UP * zc, hi + o * 0.5 + UP * zc, n + tilt * 4, 0.022, 0.1)
    k.add("hidden", True, [a + UP * z0, b + UP * z0, b + UP * z1, a + UP * z1], [(0, 1, 2, 3)])


def scalloped_valance(p0, p1, z, rng, depth=0.32, scallop=0.45, mat="cloth_white", band_mat="cloth_indigo"):
    """A scalloped hanging-cloth valance (S2.bld.scaffold_house_24975's front, under its bracket frieze): a dark band
    0.07 m deep along p0 -> p1 from z, under it the cloth hanging in scallops `scallop` m wide whose hem dips to
    `depth`, gathered a little at each join (where a short tab hangs), on a thin rod; faces the right of p0 -> p1."""
    a, b, t, n, L = _seg(p0, p1)
    m = max(1, round(L / scallop))
    k_ = 6
    top_band = z - 0.07
    pts = []
    for i in range(m * k_ + 1):
        f = i / (m * k_)
        u = (i % k_) / k_
        dip = math.sin(math.pi * u) if i % k_ else 0.0
        o = n * (0.012 * math.sin(math.pi * u) + 0.004)
        pts.append((a + t * (L * f) + o, top_band - depth * (0.45 + 0.55 * dip) + rng.uniform(-0.008, 0.008)))
    for (p, zh), (q, zq) in zip(pts, pts[1:]):
        k.add(mat, False, [p + UP * zh, q + UP * zq, q + UP * top_band, p + UP * top_band], [(0, 1, 2, 3)])
    k.add(band_mat, False, [a + n * 0.006 + UP * top_band, b + n * 0.006 + UP * top_band, b + n * 0.006 + UP * z,
                            a + n * 0.006 + UP * z], [(0, 1, 2, 3)])
    for i in range(m + 1):
        p = a + t * (L * i / m) + n * 0.014
        k.add(band_mat, False, [p - t * 0.025 + UP * (top_band - depth * 0.55), p + t * 0.025 + UP * (top_band - depth * 0.55),
                                p + t * 0.025 + UP * top_band, p - t * 0.025 + UP * top_band], [(0, 1, 2, 3)])
    sb.cyl("bamboo", False, a - t * 0.04 + UP * (z + 0.01), b + t * 0.04 + UP * (z + 0.01), 0.016, segs=5)


def _standing_sack(c, h, r, rng, mat):
    """A short sack standing on end, its neck gathered and tied: a lumpy lathe with a slumped belly and a tuft."""
    j = [rng.uniform(0.94, 1.06) for _ in range(4)]
    prof = [(r * 0.9, 0.0), (r * 1.04 * j[0], h * 0.1), (r * 1.06 * j[1], h * 0.42), (r * 0.98 * j[2], h * 0.7),
            (r * 0.74, h * 0.82), (r * 0.34, h * 0.87), (r * 0.36, h * 0.92), (r * 0.46 * j[3], h * 0.98), (0.0, h * 1.02)]
    _vlathe(mat, False, c, prof, segs=8, rot=rng.random())
    sb.cyl("rope", False, c + UP * (h * 0.85), c + UP * (h * 0.89), r * 0.3, segs=6, caps=False)


def sack_pile(x, y, z, yaw_deg, rng, lying=4, standing=2, seat=False, mat="cloth_white", stack=None):
    """A pile of grain sacks (S2.prop.sack_pile_27996, the grain owner's seat; S2.prop.sack_heap_28144): long sacks
    lying one on another with tied ends (kit_vehicles.soft_sack), two to a course, each course a little askew and set
    back; short ones standing on end with tied necks beside them, along +yaw. seat=True: two lying sacks one on the
    other (top about 0.58 m, a sitter's height; any more lie beside them; stack=1 one under him, top 0.34 m), no collider (people.js grounds the sitter
    by a ray from above); else one hidden collider. Returns its top z.
    choice: long sacks 0.95 x 0.42 x 0.34 m, standing 0.72 m (painted 55-80 px long, 35-60 px high at v 900)."""
    import kit_vehicles as kv
    a = math.radians(yaw_deg)
    f = V((math.cos(a), math.sin(a), 0))
    s = V((-f.y, f.x, 0))
    c = V((x, y, z))
    top = z
    zc = z
    i = 0
    course = 0
    n_stack = min(2, lying) if seat else lying      # a seat: two sacks one on the other (a sitter's height), the rest beside
    if seat and stack is not None:                  # a lower seat: `stack` sacks under the sitter, the rest beside
        n_stack = max(1, min(stack, lying))
    while i < n_stack:
        per = 1 if seat else min(2, n_stack - i)
        hh = 0.34 * (0.9 if course else 1.0)
        for j in range(per):
            off = s * ((j - (per - 1) / 2) * 0.4 - course * 0.05) + f * (course * 0.06 + rng.uniform(-0.05, 0.05))
            kv.soft_sack(c + off + UP * (zc - z), 0.95 * rng.uniform(0.92, 1.05), 0.42, hh,
                         a + rng.uniform(-0.12, 0.12) + (math.pi if (i + j) % 2 else 0.0), rng, mat=mat)
        zc += hh * 0.82
        top = zc + hh * 0.18
        i += per
        course += 1
    # a low seat (stack given): the sacks beside it lie set back 0.5 m behind the sitter (along +yaw), clear of his feet
    back = f * 0.5 if (seat and stack is not None) else f * 0.0
    for j in range(lying - n_stack):
        kv.soft_sack(c - s * (0.48 * (j + 1)) + back + f * rng.uniform(-0.08, 0.08), 0.95 * rng.uniform(0.92, 1.05), 0.42, 0.34,
                     a + rng.uniform(-0.15, 0.15), rng, mat=mat)
    for j in range(standing):
        p = c + f * (0.72 + 0.36 * j) + s * rng.uniform(-0.1, 0.1)
        _standing_sack(p, 0.72 * rng.uniform(0.9, 1.05), 0.2, rng, mat)
        top = max(top, z + 0.72) if not seat else top
    if not seat:
        r_ = max(0.6, 0.72 + 0.36 * max(0, standing - 1) + 0.25)
        bot = [c - f * 0.55 - s * 0.45, c + f * r_ - s * 0.45, c + f * r_ + s * 0.45, c - f * 0.55 + s * 0.45]
        _box8("hidden", True, [p - UP * 0.02 for p in bot], [p + UP * max(0.3, top - z - 0.05) for p in bot])
    return top


def rope_coil(x, y, z, rng, r=0.32, turns=4, h=0.14, tail=True):
    """A coil of heavy rope lying in stacked loops (S2.prop.coiled_rope_27873, at the stake's foot): `turns` loops,
    each a little smaller and higher than the one below, never round (each loop its own wobble), and a short frayed
    end trailing over the ground (tail)."""
    c = V((x, y, z))
    rr = 0.038
    pts, rad = [], []
    m = 9
    ph = rng.uniform(0, 6.28)
    for i in range(turns * m + 1):
        f = i / m
        ang = ph + 2 * math.pi * f
        R = r * (1 - 0.06 * f) * (1 + 0.05 * math.sin(3 * ang + i))
        pts.append(c + V((math.cos(ang) * R, math.sin(ang) * R, rr + (h - 2 * rr) * f / turns)))
        rad.append(rr)
    sb.tube("rope", False, pts, rad, segs=5)
    if tail:
        e = pts[-1]
        d = V((math.cos(ph), math.sin(ph), 0))
        sp = V((-d.y, d.x, 0))
        tl = [e, e + sp * 0.12 - d * 0.05 - UP * (e.z - z - rr) * 0.6, e + sp * 0.24 + d * 0.02 + UP * (rr - (e.z - z)),
              e + sp * 0.3 + d * 0.14 + UP * (rr - (e.z - z))]
        sb.tube("rope", False, tl, [rr, rr, rr * 0.95, rr * 0.9], segs=5)
        q = tl[-1]
        for j in range(4):
            dd = (sp + d * rng.uniform(-0.6, 0.6)).normalized()
            k.add("rope", False, [q - dd.cross(UP) * 0.012, q + dd.cross(UP) * 0.012, q + dd * rng.uniform(0.06, 0.11)], [(0, 1, 2)])


def rolled_mat(a, b, r, rng, ribs=6, mat="reed"):
    """A rolled mat or ribbed bundle between two (x, y, z) (S2.prop.ribbed_object_28878, at the water's edge): a
    slightly flattened roll whose ends show the mat's spiral (an inner ring set back), `ribs` rope ties across it."""
    A, Bp = V(_p3(a)), V(_p3(b))
    ax = Bp - A
    L = ax.length
    X, Y, Z = _frame_of(ax)
    prof = [(r * 0.7, r * 0.6, -0.002), (r, r * 0.86, 0.01), (r, r * 0.86, L - 0.01), (r * 0.7, r * 0.6, L + 0.002)]
    _lathe3(mat, False, A, X, Y, Z, prof, segs=8, cap0=True, cap1=True)
    for e, sg in ((A, -1), (Bp, 1)):
        _lathe3(mat, False, e + Z * (0.004 * sg), X, Y, Z, [(r * 0.35, r * 0.3, 0.0), (r * 0.18, r * 0.15, 0.002 * sg)], segs=6,
                cap0=False, cap1=True)
    for i in range(ribs):
        f = (i + 0.5) / ribs
        c = A + Z * (L * f)
        _lathe3("rope", False, c, X, Y, Z, [(r * 1.04, r * 0.9, -0.015), (r * 1.04, r * 0.9, 0.015)], segs=8, cap0=False)


# ---------------------------------------------------------------- built on kit_common, and the two late parts

def jetty(sw, se, ne, nw, z_deck, z_feet, rng, posts=6, rail_h=0.6):
    """The raised plank walkway (S2.str.jetty_27260) on kit_common.stilt_deck: a plank deck on round posts standing on
    the bank slope (z_feet a number or a callable (x, y) -> z), about `posts` along its front, a fascia of short
    vertical slats hanging under its river edge (sw -> se) and along that edge a low rail of short vertical slats
    `rail_h` high with capped end posts (it stops a walker: a hidden wall 1.05 m high). The land end (nw -> ne) meets
    the ground: where the bank under it lies lower than the deck, two planks ramp down to it (a hidden walkable ramp).
    Nobody is painted on it. Returns the deck z. choice: rail 0.6 m of slats 7 cm wide, 5 cm apart (the painted
    'railing or fascia of short vertical slats': both)."""
    zof = z_feet if callable(z_feet) else (lambda x, y, _z=z_feet: _z)
    S, E, N_, W_ = _p2(sw), _p2(se), _p2(ne), _p2(nw)
    front = (E - S).length
    _common("stilt_deck")([sw, se, ne, nw], z_deck, rng, zof, post_every=max(0.8, front / max(1, posts - 1)),
                          rail=None, fascia=([0], "slats"), collide=True)
    cen = (S + E + N_ + W_) / 4
    a, b = S + (cen - S).normalized() * 0.06, E + (cen - E).normalized() * 0.06
    _slat_rail(a, b, z_deck, z_deck + rail_h, rng, rails=(0.12, 0.96), w=0.07, gap=0.05)
    tt = (b - a).normalized()
    for p in (a, b):
        _member("timber", False, p + UP * (z_deck - 0.05), p + UP * (z_deck + rail_h + 0.08), tt, 0.09, 0.09, 0.012)
        _vlathe("timber", False, p + UP * (z_deck + rail_h + 0.08), [(0.06, 0.0), (0.06, 0.025), (0.0, 0.08)], segs=6)
    k.add("hidden", True, [a + UP * z_deck, b + UP * z_deck, b + UP * (z_deck + 1.05), a + UP * (z_deck + 1.05)], [(0, 1, 2, 3)])
    # the land end
    m = (N_ + W_) / 2
    back = _p2(m - (S + E) / 2).normalized()
    zg = zof(m.x + back.x * 0.7, m.y + back.y * 0.7)
    if z_deck - zg > 0.06:
        side = (N_ - W_).normalized()
        run = max(0.5, min(2.0, (z_deck - zg) / math.tan(math.radians(22))))
        for s_ in (-0.32, 0.0, 0.32):
            c0 = m + side * s_
            bot = [c0 - side * 0.14, c0 + side * 0.14, c0 + side * 0.14 + back * run, c0 - side * 0.14 + back * run]
            zs = [z_deck - 0.01, z_deck - 0.01, zg + 0.02, zg + 0.02]
            _box8("deck", False, [V((p.x, p.y, z - 0.05)) for p, z in zip(bot, zs)], [V((p.x, p.y, z)) for p, z in zip(bot, zs)])
        h = [m - side * 0.5, m + side * 0.5, m + side * 0.5 + back * run, m - side * 0.5 + back * run]
        k.add("hidden", True, [V((h[0].x, h[0].y, z_deck)), V((h[1].x, h[1].y, z_deck)), V((h[2].x, h[2].y, zg + 0.02)),
                               V((h[3].x, h[3].y, zg + 0.02))], [(0, 1, 2, 3)] if _area(h) > 0 else [(3, 2, 1, 0)])
    return z_deck


def swag_curtain(p0, p1, z_top, drop, rng, swag_end=1, mat="cloth_indigo"):
    """A curtain hung from the eave beam p0 -> p1 (S2.bld.open_shop_25340), its face toward the right of p0 -> p1 (the
    street), `drop` m deep, drawn up into a tied swag at p1 (swag_end=1) or p0 (0): a thin wrapper over
    kit_common.swag_curtain (gather "b" / "a"). Returns its triangles."""
    return _common("swag_curtain")(p0, p1, z_top, z_top - drop, rng, gather="b" if swag_end == 1 else "a", tie_z=None,
                                   stripes=0, mat=mat)


def stake(x, y, z_foot, z_top, rng, r=0.05, mat="bark"):
    """A thin tapering mooring stake (S2.prop.mooring_stake_27902, S2.prop.stake_27708): kit_common.mooring_stake with
    a sharpened top and no rope (mat: kit_common's own; kept for the contract). Returns the rope point (x, y, z)."""
    return _common("mooring_stake")(x, y, z_foot, z_top, rng, r=r, top="taper", rope=None)


def post_with_rope(x, y, z_foot, z_top, rng, r=0.1, coils=3):
    """A tall post with a rope coiled round its top and hanging down its sides (S2.prop.mooring_post_rope_28272):
    kit_common.mooring_stake(top="knob", rope="coil") (`coils` is kit_common's to decide; kept for the contract).
    Returns the rope point (x, y, z)."""
    return _common("mooring_stake")(x, y, z_foot, z_top, rng, r=r, top="knob", rope="coil")


def round_top_cart(front, rear, z_of, rng, bed_h=0.62, bed_w=1.15, cover_from=0.22, cover_over=0.12, cover_h=1.05,
                   hoops=6, legs=True):
    """The round-topped cart on the far street (S2.veh.cart_round_top_26035, low; the catalogue §3 gives it to
    kit_canal): a short bed on legs under a barrel cover, no wheels or shafts (none painted: 'no wheel is readable',
    no shaft runs to the horse). front, rear: ground points (x, y) under the bed's ends (the layout's front/rear);
    z_of: a callable (x, y) -> z or a number. The bed: two long side members on four splayed legs, end bars, a deck of
    boards; the cover (kit_vehicles.barrel_cover, a woven mat on hoops) from `cover_from` of the bed's length to
    `cover_over` past its front end (painted: the round top u 25940-26005 over the bed u 25912-25998), its crown
    `cover_h` over the bed. One hidden collider. Returns its triangles.
    choice: bed 0.62 m high and 1.15 m wide, the cover 1.05 m tall (the painted round top is 65 x 62 px over an 86 px
    bed: about as tall as it is long)."""
    import kit_vehicles as kv
    t0 = _tri_total()
    zof = z_of if callable(z_of) else (lambda x, y, _z=z_of: _z)
    R, Fp = _p2(rear), _p2(front)
    ax = Fp - R
    Lb = ax.length
    ax.normalize()
    yaw = math.degrees(math.atan2(ax.y, ax.x))
    zg = (zof(R.x, R.y) + zof(Fp.x, Fp.y)) / 2
    hw = bed_w / 2
    with k.placed(k.frame(R.x, R.y, zg, yaw)):
        zb = bed_h
        for s in (-1, 1):
            _member("timber", False, (-0.08, s * (hw - 0.05), zb - 0.07), (Lb + 0.1, s * (hw - 0.05), zb - 0.07), (0, 1, 0),
                    0.09, 0.13, 0.015)
        for x in (0.02, Lb - 0.02):
            _member("timber", False, (x, -hw - 0.04, zb - 0.1), (x, hw + 0.04, zb - 0.1), (1, 0, 0), 0.08, 0.08, 0.012)
        x = 0.0
        while x < Lb - 0.05:
            w = min(rng.uniform(0.22, 0.3), Lb - x)
            bot = [V((x + 0.01, -hw + 0.02, zb - 0.04)), V((x + w - 0.01, -hw + 0.02, zb - 0.04)),
                   V((x + w - 0.01, hw - 0.02, zb - 0.04)), V((x + 0.01, hw - 0.02, zb - 0.04))]
            _box8("deck", False, bot, [p + UP * (0.035 + rng.uniform(-0.005, 0.005)) for p in bot])
            x += w
        if legs:
            for x in (0.1, Lb - 0.12):
                for s in (-1, 1):
                    _member("timber", False, (x - 0.04 * (1 if x < Lb / 2 else -1), s * (hw + 0.04), -0.03),
                            (x, s * (hw - 0.06), zb - 0.12), (1, 0, 0), 0.07, 0.07, 0.01)
        x0c, x1c = Lb * cover_from, Lb + cover_over
        kv.barrel_cover(x0c, x1c, hw + 0.06, zb + 0.0, zb + cover_h * 0.45, zb + cover_h, hoops=hoops)
        _box8("hidden", True, [V((-0.1, -hw - 0.05, 0)), V((Lb + 0.15, -hw - 0.05, 0)), V((Lb + 0.15, hw + 0.05, 0)),
                               V((-0.1, hw + 0.05, 0))],
              [V((-0.1, -hw - 0.05, zb + cover_h)), V((Lb + 0.15, -hw - 0.05, zb + cover_h)),
               V((Lb + 0.15, hw + 0.05, zb + cover_h)), V((-0.1, hw + 0.05, zb + cover_h))])
    return _tri_total() - t0


def stick_bundle(x, y, z, rng, n=11, h=1.8, r=0.09, lean=0.05, tie=True, mat="bamboo"):
    """A bundle of upright sticks (poles, or incense) standing on the ground beside its figure
    (S2.fig.man_with_sticks_bank_24390; the builder places it under that figure's ID): n thin rods of uneven heights
    from a loose foot circle `r` across, leaning in toward a tighter top, tied with a rope band at 0.6 of the height.
    No collider (it stands against the figure). choice: 1.8 m (the painted sticks rise from the hidden foot to just
    above his head: u 24406-24423, v 457-491)."""
    c = V((x, y, z))
    tilt = V((rng.uniform(-lean, lean), rng.uniform(-lean, lean), 0))
    for i in range(n):
        a = 2 * math.pi * (i + rng.uniform(-0.3, 0.3)) / n
        rr = r * math.sqrt(rng.uniform(0.25, 1.0))
        foot = c + V((math.cos(a) * rr, math.sin(a) * rr, -0.03))
        hh = h * rng.uniform(0.86, 1.04)
        top = c + tilt * hh + V((math.cos(a) * rr * 0.45, math.sin(a) * rr * 0.45, hh))
        sb.cyl(mat, False, foot, top, rng.uniform(0.011, 0.017), 0.009, segs=5, caps=False)
    if tie:
        zt = h * 0.6
        cc = c + tilt * zt + UP * zt
        sb.cyl("rope", False, cc - UP * 0.025, cc + UP * 0.025, r * 0.72 + 0.02, segs=8, caps=False)


# ---------------------------------------------------------------- signs

def _frame_ring(mat, outer, inner, nrm, depth):
    """A mitred frame: the band between two matching planar rings (its front plane), `depth` deep behind it."""
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
        faces += [(i, j, n + j, n + i), (i, 2 * n + i, 2 * n + j, j), (n + i, n + j, 3 * n + j, 3 * n + i)]
    k.add(mat, False, verts, faces)


def sign_face(p_left, p_right, z0, z1, cell, rng, thick=0.05, frame=True, cap=False, mat="timber"):
    """A signboard face on a cell of S2's sign atlas (material signs_canal; gen/sections/canal/make_signs.mjs): a board
    from p_left to p_right (plan points), z0 to z1, `thick` deep, its face toward the right of p_left -> p_right (the
    viewer), the cell's left edge on the viewer's left (never mirrored); frame: a dark mitred frame standing a little
    proud round the face (the painted boards' dark side edges); cap: a small cap plank on top (the paper shop's board).
    Cells: wang_paper_horse (one column of 5 faded, broken marks: the scan's 4-5 illegible characters), pole_sign
    (2-3 marks), shop_sign_3 (3 marks), far_panel_2 (a light panel with 2 dark marks). Size the board by
    cell_aspect(cell) (the cell is drawn at the painted board's proportions). Without the atlas: a pale blank face."""
    a, b, t, n, L = _seg(p_left, p_right)
    k.board(mat, False, (a.x, a.y), (b.x, b.y), thick, z0, z1)
    o = n * (thick / 2 + 0.003)
    uv = cell_uv(cell)
    sb.quad("signs_canal" if uv else "cloth_white", False, a + o + UP * z0, b + o + UP * z0, b + o + UP * z1,
            a + o + UP * z1, uv=uv)
    if frame:
        fw = min(0.03, L * 0.12)
        g = 0.006
        outer = [a - t * g + UP * (z0 - g), b + t * g + UP * (z0 - g), b + t * g + UP * (z1 + g), a - t * g + UP * (z1 + g)]
        inner = [a + t * fw + UP * (z0 + fw), b - t * fw + UP * (z0 + fw), b - t * fw + UP * (z1 - fw), a + t * fw + UP * (z1 - fw)]
        pr = n * (thick / 2 + 0.014)
        _frame_ring("lattice", [p + pr for p in outer], [p + pr for p in inner], n, 0.03)
    if cap:
        _member(mat, False, a - t * 0.04 + n * 0.008 + UP * (z1 + 0.025), b + t * 0.04 + n * 0.008 + UP * (z1 + 0.025), n,
                thick + 0.06, 0.045, 0.01)
        _member(mat, False, a - t * 0.02 + n * 0.008 + UP * (z1 + 0.06), b + t * 0.02 + n * 0.008 + UP * (z1 + 0.06), n,
                thick + 0.03, 0.03, 0.008)
    return None


# ---------------------------------------------------------------- review (headless)

_PALETTE_JS = QM + r"\web\src\palette.js"
_REVIEW = {}


def _review_part(name, views=("scroll", "front34", "rear34")):
    """Register a review builder: fn(rng) builds the sample part inside sb.entity(name)."""
    def deco(fn):
        _REVIEW[name] = (fn, views)
        return fn
    return deco


def _palette():
    import re
    pal = {}
    for p in (_PALETTE_JS, "/home/ran/3d_director/qingming/web/src/palette.js"):
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                txt = f.read()
            body = txt[txt.index("export const PALETTE"):]
            body = body[:body.index("};")]
            for m in re.finditer(r"(\w+):\s*'(#[0-9a-fA-F]{6})'", body):
                pal[m.group(1)] = m.group(2)
            break
    return pal


def _true_colour(bpy, mat, name, pal):
    """Review only: palette.js's retint (a textured material keeps its painting, its mean moved to the true colour);
    the two-half swatches (brick | wash, ground | road) show their first half."""
    nt = mat.node_tree
    img = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None)
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    if img is not None and name in ("brick", "ground"):
        uvn = nt.nodes.new("ShaderNodeUVMap")
        fr = nt.nodes.new("ShaderNodeVectorMath")
        fr.operation = "FRACTION"
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (0.5, 1.0, 1.0)
        nt.links.new(uvn.outputs["UV"], fr.inputs[0])
        nt.links.new(fr.outputs["Vector"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], img.inputs["Vector"])
    hexc = pal.get(name)
    if not hexc:
        return
    c = hexc.lstrip("#")
    lin = [(int(c[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)]
    if img is None:
        bsdf.inputs["Base Color"].default_value = (*lin, 1)
        return
    px = img.image.pixels[:]
    n = len(px) // 4
    w = img.image.size[0]
    half = name in ("brick", "ground")
    idx = [i for i in range(0, n, max(1, n // 4096)) if not half or (i % w) < w // 2]
    mean = [sum(px[i * 4 + ch] for i in idx) / len(idx) for ch in range(3)]
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    nt.links.new(img.outputs["Color"], mix.inputs["A"])
    mix.inputs["B"].default_value = (*[min(4.0, t / max(1e-3, m_)) for t, m_ in zip(lin, mean)], 1)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])


def _bake(bpy, coll, prefix, pal):
    tris, col = 0, 0
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        if not b["f"]:
            continue
        name = f"{prefix}_{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new(name)
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
        new = bpy.data.materials.get(mat_name) is None
        mat = sb.make_material(mat_name)
        if new:
            _true_colour(bpy, mat, mat_name, pal)
        mat.use_backface_culling = False
        me.materials.append(mat)
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new(name, me)
        ob.hide_render = mat_name.endswith("hidden")
        coll.objects.link(ob)
        nt_ = sum(len(p.vertices) - 2 for p in me.polygons)
        if mat_name.endswith("hidden"):
            col += nt_
        else:
            tris += nt_
    return tris, col


def _review_scene(bpy):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 1100, 800
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.62, 0.72, 0.84, 1)
    bg.inputs["Strength"].default_value = 0.85
    for o in list(scene.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.4
    sun.data.angle = math.radians(3)
    sun.rotation_euler = (math.radians(45), math.radians(10), math.radians(-30))
    scene.collection.objects.link(sun)
    import bmesh
    me = bpy.data.meshes.new("review_ground")
    me.from_pydata([(-60, -60, 0), (60, -60, 0), (60, 60, 0), (-60, 60, 0)], [], [(0, 1, 2, 3)])
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=24, use_grid_fill=True)
    bm.to_mesh(me)
    m = bpy.data.materials.new("review_ground")
    m.use_nodes = True
    next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = \
        (0.33, 0.29, 0.21, 1)
    me.materials.append(m)
    g = bpy.data.objects.new("review_ground", me)
    g.location.z = -0.002
    scene.collection.objects.link(g)
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = 1.1
    fs = scene.view_layers[0].freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new("ink")
    ls.select_by_visibility = True
    ls.select_crease = True
    ls.select_silhouette = True
    ls.select_border = True
    fs.crease_angle = math.radians(140)
    ls.linestyle.color = (0.16, 0.12, 0.09)
    ls.linestyle.alpha = 0.85
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 35
    cam.data.clip_end = 400
    scene.collection.objects.link(cam)
    scene.camera = cam
    return scene, cam


def _scale_post(bpy, coll, x, y, z=0.0):
    """Review only: a 1.7 m figure-sized post (0.24 m wide, a head-sized knob) for scale."""
    import bmesh
    from mathutils import Matrix
    me = bpy.data.meshes.new("scale_post")
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.12, radius2=0.12, depth=1.48,
                          matrix=Matrix.Translation((0, 0, 0.74)))
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=0.11, matrix=Matrix.Translation((0, 0, 1.59)))
    bm.to_mesh(me)
    m = bpy.data.materials.get("scale_post") or bpy.data.materials.new("scale_post")
    m.use_nodes = True
    next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (0.75, 0.12, 0.08, 1)
    me.materials.append(m)
    ob = bpy.data.objects.new("standin_scale", me)
    ob.location = (x, y, z)
    coll.objects.link(ob)


def review(out_dir, only=None):
    """Build each registered part, bake it as a scene bakes its buckets, count its triangles and render its views."""
    import random
    import bpy
    scene, cam = _review_scene(bpy)
    pal = _palette()
    names = [n for n in _REVIEW if not only or n in only]
    colls, info = {}, {}
    for name in names:
        fn, views = _REVIEW[name]
        sb.B = sb.Buckets()
        rng = random.Random(sum(map(ord, name)))
        res = fn(rng)
        coll = bpy.data.collections.new(name)
        scene.collection.children.link(coll)
        tris, col = _bake(bpy, coll, name, pal)
        owners = {o: t for o, t in sb.B.tris.items()}
        objs = [o for o in coll.objects if not o.hide_render]
        lo = V((min(min((o.matrix_world @ V(b))[i] for b in o.bound_box) for o in objs) for i in range(3)))
        hi = V((max(max((o.matrix_world @ V(b))[i] for b in o.bound_box) for o in objs) for i in range(3)))
        sp = res.get("scale_at") if isinstance(res, dict) and "scale_at" in res else (lo.x - 0.6, lo.y - 0.4, 0.0)
        _scale_post(bpy, coll, *sp)
        colls[name] = coll
        info[name] = dict(tris=tris, collider=col, owners=owners, lo=list(lo), hi=list(hi),
                          ret=(res.get("ret") if isinstance(res, dict) else res))
        print(f"TRIS {name} {tris} (collider {col}) owners {owners} bbox {tuple(round(v, 2) for v in lo)} "
              f"{tuple(round(v, 2) for v in hi)} ret {info[name]['ret']}", flush=True)
    for name in names:
        for nn, c in colls.items():
            c.hide_render = nn != name
        lo, hi = V(info[name]["lo"]), V(info[name]["hi"])
        c = (lo + hi) / 2
        size = max((hi - lo).length, 1.2)
        for vname in _REVIEW[name][1]:
            if isinstance(vname, tuple):
                vname, loc, target = vname
                loc, target = V(loc), V(target)
            else:
                az, el = {"scroll": (-90, 24), "front34": (-55, 14), "rear34": (125, 22), "side": (-10, 10),
                          "top": (-90, 62), "eye": (-80, 4)}[vname]
                d = V((math.cos(math.radians(az)) * math.cos(math.radians(el)),
                       math.sin(math.radians(az)) * math.cos(math.radians(el)), math.sin(math.radians(el))))
                target = c
                loc = c + d * (size * 1.05 + 0.8)
                if vname == "eye":
                    loc.z = 1.6
            cam.location = loc
            cam.rotation_euler = (target - loc).normalized().to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = os.path.join(out_dir, f"{name}_{vname}.png")
            bpy.ops.render.render(write_still=True)
    path = os.path.join(out_dir, "review_tris.json")
    allinfo = {}
    if os.path.exists(path):
        with open(path) as f:
            allinfo = json.load(f)
    allinfo.update({n: {kk: v for kk, v in info[n].items() if kk in ("tris", "collider", "ret")} for n in names})
    with open(path, "w") as f:
        json.dump(allinfo, f, indent=1, default=str)
    print("REVIEW_DONE", flush=True)


@_review_part("fire_tower", views=("scroll", "front34", "rear34",
                                  ("eye", (-1.0, -14.0, 1.6), (2.6, 2.3, 5.2))))
def _rv_fire_tower(rng):
    # the builder's starting plan: 5.2 m front, 4.6 m deep, the back corners shifted up-left as painted (-0.5 m X)
    with sb.entity("S2.str.fire_tower_platform_28450"):
        r = fire_tower((0, 0), (5.2, 0), (4.7, 4.6), (-0.5, 4.6), 0.0, rng, part="platform")
    with sb.entity("S2.bld.fire_tower_28440"):
        fire_tower((0, 0), (5.2, 0), (4.7, 4.6), (-0.5, 4.6), 0.0, rng, part="pavilion")
    return {"ret": r, "scale_at": (r["stair_top"][0] - 5.2, -0.8, 0.0)}



@_review_part("thatch_shed_skirt", views=("scroll", "front34", "rear34", ("eye", (3.0, -9.0, 1.6), (4.6, 2.0, 1.6)),
                                         ("vent", (10.5, -3.0, 6.2), (5.6, 2.2, 3.9))))
def _rv_thatch_shed_skirt(rng):
    # the map's footprint (S2.bld.wanglou_shed_28660) moved to the origin: 9.1 m front, 4.9 m deep
    with sb.entity("S2.bld.wanglou_shed_28660"):
        r = thatch_shed_skirt((0.0, 0.0), (9.04, -1.08), (11.78, 3.02), (2.72, 3.41), 0.0, rng, main=(0.0, 0.58),
                              skirt=(0.12, 1.0), fringe=(0.8, 0.86), back_slats=(0.84, 1.0), rear_roof=(0.42, 1.0, 2.2),
                              valance=(0.88, 0.98))
    return {"ret": r, "scale_at": (4.0, -1.6, 0.0)}


@_review_part("stilt_terrace", views=("scroll", "front34", "rear34", ("eye", (2.0, -7.5, 1.6), (3.6, 1.0, 2.2))))
def _rv_stilt_terrace(rng):
    # the map's footprint (6.5 m x 2.1 m, placeholder back) at the origin; the floor 1.2 m over the shore at its front
    with sb.entity("S2.bld.river_terrace_23250"):
        r = stilt_terrace((0.0, 0.0), (6.52, -0.29), (6.43, 1.85), (-0.05, 2.15), 1.2, lambda x, y: max(0.0, 0.55 * y),
                          rng)
    return {"ret": r, "scale_at": (-0.8, -1.2, 0.0)}


@_review_part("jetty", views=("scroll", "front34", "rear34"))
def _rv_jetty(rng):
    # the map's points (S2.str.jetty_27260) moved to the origin; the bank falls 1.1 m toward the river (the front)
    def bank(x, y):
        return max(0.0, 0.85 + 0.42 * y)
    k.add("rammed", False, [V((-1.0, 0.0, 0.85)), V((8.0, 0.0, 0.85)), V((8.0, 2.5, 0.85)), V((-1.0, 2.5, 0.85))], [(0, 1, 2, 3)])
    with sb.entity("S2.str.jetty_27260"):
        r = jetty((0.61, -1.9), (5.48, -3.95), (6.64, -2.25), (0.0, 0.0), 0.95, bank, rng)
    return {"ret": r, "scale_at": (-0.4, -2.6, 0.0)}


@_review_part("stakes", views=("front34", "scroll"))
def _rv_stakes(rng):
    with sb.entity("S2.prop.mooring_stake_27902"):
        r1 = stake(0.0, 0.0, 0.0, 1.5, rng)
    with sb.entity("S2.prop.mooring_post_rope_28272"):
        r2 = post_with_rope(1.0, 0.0, 0.0, 2.3, rng)
    return {"ret": [r1, r2], "scale_at": (-0.7, 0.3, 0.0)}


@_review_part("swag_curtain", views=("front34", "scroll"))
def _rv_swag_curtain(rng):
    k.beam("timber", False, (-0.2, 0.0, 2.45), (3.0, 0.0, 2.45), 0.14, 0.18, 0.02)
    for x in (-0.1, 2.9):
        k.post("timber", False, x, 0.05, 0.0, 2.4, 0.16, 0.02)
    with sb.entity("S2.bld.open_shop_25340"):
        r = swag_curtain((0.0, -0.1), (2.8, -0.1), 2.35, 1.5, rng)
    return {"ret": r, "scale_at": (-0.7, -0.6, 0.0)}


@_review_part("round_top_cart", views=("scroll", "front34", "rear34"))
def _rv_round_top_cart(rng):
    with sb.entity("S2.veh.cart_round_top_26035"):
        r = round_top_cart((2.2, 0.0), (0.0, 0.0), 0.0, rng)
    return {"ret": r, "scale_at": (-0.6, -1.0, 0.0)}


@_review_part("stick_bundle", views=("front34", "scroll"))
def _rv_stick_bundle(rng):
    with sb.entity("S2.fig.man_with_sticks_bank_24390"):
        r = stick_bundle(0.0, 0.0, 0.0, rng)
    return {"ret": r, "scale_at": (-0.45, 0.0, 0.0)}



@_review_part("rough_steps", views=("scroll", "front34", "side"))
def _rv_rough_steps(rng):
    k.add("rammed", False, [V((-1.5, 1.8, 1.2)), V((3.2, 1.8, 1.2)), V((3.2, 4.0, 1.2)), V((-1.5, 4.0, 1.2))], [(0, 1, 2, 3)])
    with sb.entity("S2.str.landing_steps_22950"):
        rough_steps((0.0, 1.8), (1.4, 1.8), (0.15, 0.0), (1.6, 0.0), 1.2, -0.05, rng)
    return {"ret": None, "scale_at": (-0.6, 0.6, 0.0)}


@_review_part("plank_platform", views=("scroll", "front34", "rear34"))
def _rv_plank_platform(rng):
    with sb.entity("S2.bld.warehouse_26070"):
        r = plank_platform((0.0, 0.0), (7.7, 0.0), 2.4, 0.0, 0.9, rng, caps=3)
    return {"ret": r, "scale_at": (-0.6, -0.6, 0.0)}


@_review_part("swept_awning", views=("scroll", "front34", ("eye", (-1.0, -6.5, 1.6), (1.8, -1.0, 2.6))))
def _rv_swept_awning(rng):
    k.add("plaster", False, [V((-0.3, 0.05, 0)), V((4.0, 0.05, 0)), V((4.0, 0.05, 3.3)), V((-0.3, 0.05, 3.3))], [(0, 1, 2, 3)])
    with sb.entity("S2.bld.scaffold_house_24975"):
        swept_awning((0.0, 0.0, 0.0), (3.6, 0.0), 2.4, 2.6, 0.9, rng)
    return {"ret": None, "scale_at": (4.4, -1.0, 0.0)}


@_review_part("pole_frames", views=("scroll", "front34", "rear34"))
def _rv_pole_frames(rng):
    # the yard frame as painted: a west A of two railed ladders, a braced east A, long beams laid across, crossing poles
    with sb.entity("S2.prop.pole_frame_27490"):
        a_frame((0.0, -0.9, 0.0), (0.0, 0.9, 0.0), (0.0, 0.0, 5.0), rng, ladders=True)
        a_frame((4.4, -0.9, 0.0), (4.4, 0.9, 0.0), (4.4, 0.0, 4.7), rng, r=0.06, brace=0.42)
        for zz, dy in ((3.5, 0.0), (2.6, 0.25)):
            pole((-0.6, dy, zz), (5.2, dy - 0.05, zz + 0.25), rng, r=0.065)
        for x in (1.4, 2.4, 3.3):
            pole((x, 0.5, 0.0), (x + 0.5, -0.3, 4.4), rng, r=0.05)
    with sb.entity("S2.prop.pennant_frame_27930"):
        a_frame((7.0, 0.0, 0.0), (9.0, 0.6, 0.0), (8.0, 0.3, 4.6), rng, r=0.05)
        pennant_cord((8.0, 0.3, 4.55), (6.0, 1.0, 2.6), 8, rng)
        pennant_cord((8.0, 0.3, 4.4), (8.8, 0.5, 2.2), 3, rng, sag=0.1)
    with sb.entity("S2.prop.ladder_28538"):
        ladder((10.2, -0.5, 0.0), (12.4, 1.0, 0.5), rng)
    return {"ret": None, "scale_at": (-1.4, -1.2, 0.0)}


@_review_part("pole_stack", views=("front34", "scroll"))
def _rv_pole_stack(rng):
    with sb.entity("S2.prop.pole_stack_24680"):
        pole_stack(0.0, 0.0, 0.0, rng)
    return {"ret": None, "scale_at": (-0.9, -0.3, 0.0)}


@_review_part("sloped_balustrade", views=("front34", "scroll"))
def _rv_sloped_balustrade(rng):
    with sb.entity("S2.str.railed_stair_27630"):
        sloped_balustrade((0.0, 0.0, 1.5), (3.4, 0.0, 0.0), rng)
    return {"ret": None, "scale_at": (4.0, -0.4, 0.0)}


@_review_part("sack_pile", views=("front34", "scroll", "rear34"))
def _rv_sack_pile(rng):
    with sb.entity("S2.prop.sack_pile_27996"):
        r1 = sack_pile(0.0, 0.0, 0.0, 0, rng, lying=2, standing=1, seat=True)
    with sb.entity("S2.prop.sack_heap_28144"):
        r2 = sack_pile(2.2, 0.0, 0.0, 10, rng, lying=4, standing=2)
    return {"ret": [r1, r2], "scale_at": (-0.9, -0.4, 0.0)}


@_review_part("small_things", views=("front34", "scroll", "top"))
def _rv_small_things(rng):
    with sb.entity("S2.prop.hall_tables_chairs_25775"):
        for i in range(3):
            folding_seat(0.6 * i, 0.0, 0.0, -90 + 10 * i, rng)
    k.add("plaster", False, [V((1.9, 0.6, 0)), V((4.6, 0.6, 0)), V((4.6, 0.6, 2.9)), V((1.9, 0.6, 2.9))], [(0, 1, 2, 3)])
    with sb.entity("S2.bld.shop_row_21200"):
        slat_shutters((2.0, 0.5), (3.6, 0.5), 0.1, 2.1, rng)
    with sb.entity("S2.bld.scaffold_house_24975"):
        scalloped_valance((1.9, 0.48), (4.6, 0.48), 2.85, rng)
    with sb.entity("S2.prop.coiled_rope_27873"):
        rope_coil(0.6, -1.3, 0.0, rng)
    with sb.entity("S2.prop.ribbed_object_28878"):
        rolled_mat((1.6, -1.4, 0.16), (2.6, -1.2, 0.16), 0.16, rng)
    return {"ret": None, "scale_at": (-0.7, 0.4, 0.0)}


@_review_part("signs", views=("front34", ("eye", (1.2, -3.2, 1.6), (1.2, 0.0, 1.9))))
def _rv_signs(rng):
    x = 0.0
    for cell, h in (("wang_paper_horse", 1.75), ("pole_sign", 0.95), ("shop_sign_3", 0.95), ("far_panel_2", 0.6)):
        w = h * cell_aspect(cell, 0.3)
        with sb.entity("review/" + cell):
            sign_face((x, 0.0), (x + w, 0.0), 1.2, 1.2 + h, cell, rng, cap=(cell == "wang_paper_horse"))
        x += w + 0.45
    return {"ret": None, "scale_at": (-0.5, 0.3, 0.0)}

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if argv and argv[0] == "review":
        review(argv[1], argv[2].split(",") if len(argv) > 2 and argv[2] not in ("", "all") else None)
