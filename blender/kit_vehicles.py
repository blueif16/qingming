"""Vehicle kit: the carts, wagons and sedan chairs the scroll paints, built from song_kit primitives.

Every function adds faces to street_b1's bucket set `sb.B` through song_kit / street_b1 primitives, exactly like
song_kit's set pieces, and returns the triangles it added. It never opens an entity: the section builder wraps each
call in `with sb.entity(<vehicle map id>):` (map/BUILDING.md: one map entity, one model). The lead moves these
functions into song_kit.py afterwards.

Frame: the scene frame of the section builders: x = map X (east), y = map D (north), z up, metres. Positions always
come from the caller (layout.json): `front`, `rear` (ground under the vehicle's front and rear ends), `wheels` (wheel
ground contacts), `team` (the draught animals' painted spots). Sizes the strokes can't give are keyword `choice:`
arguments with real-size defaults. Painted carts are drawn about 1.3x life size like the figures, so a body's
length is a real-size choice centred where the map puts it (the axle at the painted wheel); the shafts, pole and
traces stretch to the painted team or to `front`.

`z_of(x, y)` gives the ground height (default flat 0). `rng` seeds the small irregularities (random.Random).

Return value: the triangles added, as an int. Carts that seat a driver (`covered_ox_cart`, `mule_wagon`, `cask_cart`)
return a `Built` (an int subclass: `int(r)` and arithmetic work exactly as before) carrying `.seat = (x, y, z,
facing_deg)`, the top of the driver's seat in world coordinates (a seated figure's hips go there, facing the cart's
heading), and `.feet = (x, y, z)`, the top of the footboard where his feet rest. Both lie outside the cart's hidden
walker collider.

Harness: a vehicle's harness (pole, shafts, yoke, swingletree, traces) is part of the vehicle and reaches to its
team's painted spots. `team=[(X, D, facing_deg, kind), ...]`: each draught animal's map position (the midpoint
between its fore and hind hooves, on the ground) and facing (deg: 0 = east/+x, 90 = north/+y); kind is a key of
HARNESS. The collars and saddle cloths are the animals' own tack (animals/, map/BUILDING.md); the vehicle's traces end
at the collar's sides. HARNESS holds the animal sizes the harness needs; it is to be updated from the animal models.

Review (headless, never the live GUI):
    scripts/blender_wsl.sh -b --factory-startup --python qingming/blender/kit_vehicles.py -- review <out_dir>
builds every type into a review scene with stand-in markers for the teams and renders three views of each to
<out_dir>/<type>_<view>.png, printing the triangles per type.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mathutils import Quaternion, Matrix, Vector  # noqa: E402

import song_kit as k  # noqa: E402
import street_b1 as sb  # noqa: E402

V = Vector
KIT_TEX = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\vehicles\textures"
# The one texture the vehicle kit adds: the cursive-script screen spread over the 串车's load (余辉: 书屏遭废), painted
# in B1's style through shyfai (gen/vehicles/textures/prompt_script_sheet.txt). Mapped whole onto the domed sheet.
sb.MATERIALS.setdefault("script_sheet", (KIT_TEX + r"\script_sheet.png", 1, None))
# hemp sacking (true colour: undyed hemp, greyish tan), for the sacks carts carry; a flat colour like the kit's cloths
sb.MATERIALS.setdefault("hemp", (None, 1, "#c8b590"))

# Animal sizes the harness needs, metres, from the animal's root (on the ground between its fore and hind hooves):
# collar_fwd/collar_h = the collar's (or the ox yoke's) contact point ahead of the root and above the ground;
# half_w = half the distance between the collar's two trace hooks (the hames); withers_h, length = body size.
# Measured on the rigged animal models (gen/animals/<kind>/rig.json, web/public/assets/animals/animals.json,
# 2026-10-11): the donkey's and the mule's from their collar tack ("collar" variant: hames points; collar_h is the
# hooks' height + 0.06 because _team() hangs the traces 0.06 below C); the ox's from the top of its neck just ahead
# of the hump, where the neck yoke rests (_ox_yoke() sets the bar 0.07 above C); the horse's from its estimated collar
# (it has no collar variant yet). Re-run tools/animal.mjs <kind> rig and copy the numbers if a model changes.
HARNESS = {
    "ox": dict(withers_h=1.329, collar_fwd=0.661, collar_h=1.184, half_w=0.357, length=2.058,
               # the girth's trace hooks (the ox's `draught` tack, animals.json harness.trace_girth_l/r): a lead ox's
               # rope traces start here, not at its neck yoke
               trace_fwd=0.17, trace_h=0.744, trace_w=0.35),
    "donkey": dict(withers_h=1.026, collar_fwd=0.363, collar_h=0.980, half_w=0.222, length=1.493),
    "mule": dict(withers_h=1.424, collar_fwd=0.528, collar_h=1.258, half_w=0.255, length=2.089),
    "horse": dict(withers_h=1.438, collar_fwd=0.617, collar_h=1.046, half_w=0.186, length=2.054),
}
UP = V((0, 0, 1))


class Built(int):
    """The triangles a vehicle added (an int, so callers that sum or log it see no change), plus where its driver
    sits: `.seat` (x, y, z, facing_deg) is the top of the seat, world coordinates, facing the cart's heading; `.feet`
    (x, y, z) the top of the footboard. None when the vehicle has no seat. `.bed` (x, y, z): where a figure painted
    standing on an open cart's bed stands (open_cart), the bed's top; None for the others."""

    def __new__(cls, tris, seat=None, feet=None, bed=None):
        o = super().__new__(cls, tris)
        o.seat, o.feet, o.bed = seat, feet, bed
        return o


# ---------------------------------------------------------------- helpers

def _zf(z_of):
    return z_of if z_of else (lambda x, y: 0.0)


def _tri_count():
    return sum(len(f) - 2 for b in sb.B.data.values() for f in b["f"])


def _orient(verts, faces, inside):
    """Wind every face outward: inside[i] is a point inside the solid near face i."""
    out = []
    for f, p in zip(faces, inside):
        a, b, c = verts[f[0]], verts[f[1]], verts[f[2]]
        n = (b - a).cross(c - a)
        if n.length < 1e-12 and len(f) > 3:
            n = (c - a).cross(verts[f[3]] - a)
        fc = sum((verts[j] for j in f), V((0, 0, 0))) / len(f)
        out.append(tuple(reversed(f)) if n.dot(fc - p) < 0 else tuple(f))
    return out


def _axis(rear, front):
    """The vehicle's ground axis: origin at `rear`, unit forward and left vectors, length."""
    r, f = V((rear[0], rear[1], 0)), V((front[0], front[1], 0))
    d = f - r
    L = d.length
    fwd = d / L
    return r, fwd, V((-fwd.y, fwd.x, 0)), L


def _frame_m(origin, fwd, z):
    return Matrix.Translation((origin.x, origin.y, z)) @ Matrix.Rotation(math.atan2(fwd.y, fwd.x), 4, "Z")


def _along(p, origin, fwd):
    return (V((p[0], p[1], 0)) - origin).dot(fwd)


def _plane_basis(axis):
    a = V(axis).normalized()
    ref = V((0, 0, 1)) if abs(a.z) < 0.9 else V((1, 0, 0))
    u = ref.cross(a).normalized()
    w = a.cross(u).normalized()
    return a, u, w


def _lathe_axis(mat, c, a, u, w, prof, segs=8, caps=True, collide=False):
    """A solid of revolution about the axis a through c: prof = [(radius, t along a), ...]."""
    verts = []
    for r, t in prof:
        for i in range(segs):
            ang = 2 * math.pi * (i + 0.5) / segs
            verts.append(c + a * t + (u * math.cos(ang) + w * math.sin(ang)) * r)
    faces, ins = [], []
    for kk in range(len(prof) - 1):
        for i in range(segs):
            j = (i + 1) % segs
            faces.append((kk * segs + i, kk * segs + j, (kk + 1) * segs + j, (kk + 1) * segs + i))
            ins.append(c + a * ((prof[kk][1] + prof[kk + 1][1]) / 2))
    if caps:
        n = len(prof)
        tm = sum(t for _, t in prof) / n
        faces += [tuple(range(segs)), tuple(range((n - 1) * segs, n * segs))]
        ins += [c + a * tm, c + a * tm]
    k.add(mat, collide, verts, _orient(verts, faces, ins))


def _sweep_rect(mat, pts, nrms, across, n0, n1, b0, b1, sides=(0, 1, 2, 3), caps=True, uv_len=None):
    """A rectangular section swept along a polyline: at point j the corners are pts[j] + nrms[j]*n + across[j]*b for
    n in (n0, n1), b in (b0, b1). sides: which of the four long faces to build (0: b0 side, 1: n1 side, 2: b1 side,
    3: n0 side)."""
    m = len(pts)
    acr = across if isinstance(across, (list, tuple)) else [across] * m
    sec = [(n0, b0), (n1, b0), (n1, b1), (n0, b1)]
    verts = [V(pts[j]) + V(nrms[j]) * n + V(acr[j]) * b for j in range(m) for n, b in sec]
    cen = [V(pts[j]) + V(nrms[j]) * ((n0 + n1) / 2) + V(acr[j]) * ((b0 + b1) / 2) for j in range(m)]
    faces, ins = [], []
    for j in range(m - 1):
        for s in sides:
            faces.append((j * 4 + s, j * 4 + (s + 1) % 4, (j + 1) * 4 + (s + 1) % 4, (j + 1) * 4 + s))
            ins.append((cen[j] + cen[j + 1]) / 2)
    if caps:
        faces += [(0, 1, 2, 3), ((m - 1) * 4, (m - 1) * 4 + 1, (m - 1) * 4 + 2, (m - 1) * 4 + 3)]
        ins += [cen[0] + (cen[1] - cen[0]) * 0.5, cen[-1] + (cen[-2] - cen[-1]) * 0.5]
    k.add(mat, False, verts, _orient(verts, faces, ins))


def _rope(p0, p1, sag=0.04, r=0.013, n=4, mat="rope"):
    p0, p1 = V(p0), V(p1)
    L = (p1 - p0).length
    pts = [p0.lerp(p1, i / n) - UP * (sag * L * 4 * (i / n) * (1 - i / n)) for i in range(n + 1)]
    sb.tube(mat, False, pts, [r] * len(pts), segs=4)


def _polybeam(mat, pts, w, h, c=None, collide=False):
    for a, b in zip(pts, pts[1:]):
        k.beam(mat, collide, a, b, w, h, c)


def _obeam(mat, p0, p1, w, h, c=None, caps=True):
    """song_kit.beam's chamfered member, wound outward (song_kit.beam's faces face inward, which the page's
    double-sided materials hide, but a review render with back-face culling shows anything inside one, such as a
    rope band's ends); caps False leaves the ends open (a band round something)."""
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
    ring = [(hw - c, hh), (-(hw - c), hh), (-hw, hh - c), (-hw, -(hh - c)), (-(hw - c), -hh), (hw - c, -hh),
            (hw, -(hh - c)), (hw, hh - c)]
    n = len(ring)
    verts = [p0 + side * s_ + upv * u for s_, u in ring] + [p1 + side * s_ + upv * u for s_, u in ring]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    if caps:
        faces += [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    m = (p0 + p1) / 2
    k.add(mat, False, verts, _orient(verts, faces, [m] * len(faces)))


def _quad2(mat, a, b, c, d, uv=None):
    """A thin panel seen from both sides: the quad and its reverse."""
    sb.quad(mat, False, a, b, c, d, uv)
    sb.quad(mat, False, d, c, b, a, uv[::-1] if uv else None)


def plank(mat, a, b, thick, z0, z1, rng, collide=False):
    """An upright board on the plan segment a->b (like song_kit.board) whose grain runs along it: the swatch's plank
    lines follow the board, each board its own patch of the swatch."""
    a, b = V((a[0], a[1], 0)), V((b[0], b[1], 0))
    t = (b - a).normalized()
    n = V((t.y, -t.x, 0)) * (thick / 2)
    ring = [a + n, b + n, b - n, a - n]
    if (ring[1] - ring[0]).cross(ring[2] - ring[1]).z < 0:
        ring.reverse()
    verts = [p + V((0, 0, z0)) for p in ring] + [p + V((0, 0, z1)) for p in ring]
    faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)] + [(4, 5, 6, 7), (3, 2, 1, 0)]
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    nn = n.normalized()
    uvs = []
    for fi, f in enumerate(faces):     # sides: across = height; top and bottom: across = the board's width
        uvs.append([((verts[i].z if fi < 4 else verts[i].dot(nn)) / tile + ou, verts[i].dot(t) / tile + ov) for i in f])
    k.add(mat, collide, verts, faces, uvs)


def plank_flat(mat, a, b, width, z0, z1, rng):
    """A board lying flat from plan point a to b, `width` across, its grain along a->b."""
    plank(mat, a, b, width, z0, z1, rng)


# ---------------------------------------------------------------- wheels

def spoked_wheel(c, axis, R, spokes=16, felloes=None, rim_d=None, rim_w=None, hub_r=None, hub_len=None, segs=None,
                 mat="timber", iron="lattice", phase=0.0):
    """A Song spoked wheel standing on its own: separate felloes (the joints draw the ink) with a rectangular section,
    spokes between nave and felloes, an octagonal nave with two iron bands, the axle end and its linchpin.
    c: centre; axis: along the axle, pointing out of the cart; R: outer radius; felloes: pieces (default spokes/2);
    segs: segments round the rim (default 3 per felloe from R 0.7 up, else 2)."""
    a, u, w = _plane_basis(axis)
    c = V(c)
    rim_d = rim_d or max(0.07, R * 0.12)
    rim_w = rim_w or max(0.06, R * 0.1)
    hub_r = hub_r or max(0.08, R * 0.17)
    hub_len = hub_len or max(0.26, R * 0.5)

    def P(ang, r, t=0.0):
        return c + (u * math.cos(ang) + w * math.sin(ang)) * r + a * t

    nf = felloes or max(4, spokes // 2)
    r0, r1 = R - rim_d, R
    gap = 0.012 / R
    for i in range(nf):
        a0 = phase + 2 * math.pi * i / nf + gap / 2
        a1 = phase + 2 * math.pi * (i + 1) / nf - gap / 2
        m = max(2, round(segs / nf)) if segs else (3 if R >= 0.7 else 2)
        angs = [a0 + (a1 - a0) * j / m for j in range(m + 1)]
        pts = [P(an, r0) for an in angs]
        nrms = [(P(an, 1.0) - c) for an in angs]
        _sweep_rect(mat, pts, nrms, a, 0.0, rim_d, -rim_w / 2, rim_w / 2)
    for i in range(spokes):
        ang = phase + 2 * math.pi * (i + 0.5) / spokes
        k.beam(mat, False, P(ang, hub_r * 0.8), P(ang, r0 + 0.012), rim_w * 0.6, rim_w * 0.48, 0)
    prof = [(hub_r * 0.5, -hub_len / 2), (hub_r * 0.82, -hub_len / 2 + 0.02), (hub_r, -hub_len * 0.12),
            (hub_r, hub_len * 0.12), (hub_r * 0.78, hub_len / 2 - 0.02), (hub_r * 0.48, hub_len / 2)]
    _lathe_axis(mat, c, a, u, w, prof, segs=8)
    for t in (-hub_len * 0.3, hub_len * 0.3):
        rr = hub_r * 0.95 + 0.012
        _lathe_axis(iron, c, a, u, w, [(rr, t - 0.02), (rr, t + 0.02)], segs=8, caps=False)
    e = c + a * (hub_len / 2)
    k.beam(mat, False, e - a * 0.01, e + a * 0.07, hub_r * 0.62, hub_r * 0.62, 0.012)
    k.beam(iron, False, e + a * 0.045 + w * hub_r * 0.75, e + a * 0.045 - w * hub_r * 0.75, 0.025, 0.02, 0)
    return hub_len


# ---------------------------------------------------------------- harness

def _team(team, z_of, default_kind):
    out = []
    for t in team or []:
        X, D = t[0], t[1]
        facing = t[2] if len(t) > 2 and t[2] is not None else 0.0
        kind = t[3] if len(t) > 3 else default_kind
        H = HARNESS[kind]
        f = V((math.cos(math.radians(facing)), math.sin(math.radians(facing)), 0))
        s = V((-f.y, f.x, 0))
        root = V((X, D, z_of(X, D)))
        C = root + f * H["collar_fwd"] + UP * H["collar_h"]
        girth = None
        if "trace_h" in H:   # the girth's trace hooks, where a lead animal's traces start
            G = root + f * H["trace_fwd"] + UP * H["trace_h"]
            girth = (G + s * H["trace_w"], G - s * H["trace_w"])
        out.append(dict(root=root, fwd=f, left=s, C=C, H=H, kind=kind, girth=girth,
                        sides=(C + s * H["half_w"] - UP * 0.06, C - s * H["half_w"] - UP * 0.06)))
    return out


def _ranks(animals, origin, fwd, gap=0.9):
    """Group the team into ranks by distance ahead of the vehicle (nearest first)."""
    order = sorted(animals, key=lambda a: _along(a["root"], origin, fwd))
    ranks = []
    for a in order:
        d = _along(a["root"], origin, fwd)
        if ranks and d - ranks[-1][0] < gap:
            ranks[-1][1].append(a)
        else:
            ranks.append([d, [a]])
    return [r[1] for r in ranks]


def _ox_yoke(oxen, z_extra=0.07):
    """A neck yoke across one or more oxen: a bar on top of their necks just ahead of the withers, bowed up at the
    ends, with a pair of bow pins down each neck. Returns the bar's two ends and its centre."""
    left = oxen[0]["left"]
    cs = sorted((o["C"] for o in oxen), key=lambda p: p.dot(left))
    y = max(p.z for p in cs) + z_extra
    a = V((cs[0].x, cs[0].y, y)) - left * 0.42
    b = V((cs[-1].x, cs[-1].y, y)) + left * 0.42
    mid = (a + b) / 2
    span = (b - a).length
    ax = (b - a).normalized()
    pts = [a + UP * 0.07, a.lerp(b, 0.18) + UP * 0.015, mid, a.lerp(b, 0.82) + UP * 0.015, b + UP * 0.07]
    _polybeam("timber", pts, 0.11, 0.1, 0.02)
    for p in cs:
        q = V((p.x, p.y, y))
        for sgn in (-1, 1):
            top = q + ax * sgn * 0.19
            k.beam("timber", False, top, top - UP * 0.42 + ax * sgn * -0.04, 0.04, 0.04, 0)
    return a, b, mid, span


def _swingletree(centre, left, width):
    """A crossbar the traces pull on, with an iron ring at each end. Returns its ends."""
    a, b = centre + left * (width / 2), centre - left * (width / 2)
    k.beam("timber", False, a, b, 0.07, 0.07, 0.015)
    for p in (a, b):
        k.beam("lattice", False, p - left * 0.03, p + left * 0.03, 0.08, 0.08, 0.02)
    return a, b


def _traces(ranks, anchors, sag=0.03, skip_first=False):
    """Rope traces: rank 0 pulls on `anchors` (a function giving the two anchor points for one animal), every later
    rank on the collar of the nearest animal of the rank behind it. skip_first: rank 0 is yoked, not traced."""
    for ri, rank in enumerate(ranks):
        if ri == 0 and skip_first:
            continue
        for an in rank:
            if ri == 0:
                aL, aR = anchors(an)
            else:
                prev = min(ranks[ri - 1], key=lambda p: (p["root"] - an["root"]).length)
                aL, aR = prev["sides"]
            sL, sR = an.get("girth") or an["sides"]
            _rope(sL, aL, sag)
            _rope(sR, aR, sag)


def _harness(origin, fwd, left, tip, team, z_of, kind, draught):
    """Join the pole or shaft tip(s) to the team. tip: the pole's tip (pole) or the crossbar centre (shafts).
    draught: 'pole' or 'shafts'. Returns nothing; builds the yoke or swingletree and the traces."""
    animals = _team(team, z_of, kind)
    if not animals:
        return
    ranks = _ranks(animals, origin, fwd)
    first = ranks[0]
    if first[0]["kind"] == "ox":
        _ox_yoke(first)
        for rank in ranks[1:]:     # leading oxen pull on their own neck yokes, traced back to the oxen behind
            for o in rank:
                _ox_yoke([o])
        _traces(ranks, None, skip_first=True)
        return
    lat = [(an["root"] - tip).dot(left) for an in first]
    width = max(0.7, max(lat) - min(lat) + 0.7)
    cen = tip + left * ((max(lat) + min(lat)) / 2)
    ends = _swingletree(cen, left, width)
    k.beam("rope", False, tip, cen, 0.03, 0.03, 0) if (cen - tip).length > 0.05 else None

    def anchors(an):
        d = (an["root"] - cen).dot(left)
        p = cen + left * d
        return p + left * (an["H"]["half_w"] + 0.06), p - left * (an["H"]["half_w"] + 0.06)
    _traces(ranks, anchors)


# ---------------------------------------------------------------- the big covered ox cart

def _arch_profile(hw, z_e, z_s, z_top, n_arc=5):
    """Cross-section of a barrel cover (y, z, ny, nz) from the left eave over the crown to the right eave: straight
    sides from z_e up to z_s, then an elliptic arch to the crown at z_top."""
    left = [(hw, z_e, 1.0, 0.0)]
    hz = z_top - z_s
    for i in range(n_arc + 1):
        t = (math.pi / 2) * i / n_arc
        y, z = hw * math.cos(t), z_s + hz * math.sin(t)
        n = V((math.cos(t) / hw, math.sin(t) / hz, 0)).normalized()
        left.append((y, z, n.x, n.y))
    right = [(-y, z, -ny, nz) for (y, z, ny, nz) in reversed(left[:-1])]
    return left + right


def barrel_cover(x0, x1, hw, z_e, z_s, z_top, hoops=7, thick=0.04, mat="reed", hoop_mat="timber"):
    """A woven-mat barrel cover (棕盖/篷) in a local frame, running along x from x0 to x1: the mat as a shell with real
    thickness (top, underside, rims at both ends and along both eaves) laid over bent hoops; the end hoops are
    broader, as the painted cover's edge bands. UVs run along the cart, so the mat's weave follows it."""
    prof = _arch_profile(hw, z_e, z_s, z_top)
    n = len(prof)
    xs = [x0 + (x1 - x0) * i / (hoops - 1) for i in range(hoops)]
    arc = [0.0]
    for (ya, za, *_), (yb, zb, *_) in zip(prof, prof[1:]):
        arc.append(arc[-1] + math.hypot(yb - ya, zb - za))
    outer = [[V((x, y, z)) for (y, z, _, _) in prof] for x in xs]
    inner = [[V((x, y - ny * thick, z - nz * thick)) for (y, z, ny, nz) in prof] for x in xs]
    for shell, inward in ((outer, False), (inner, True)):
        verts, faces, uvs = [], [], []
        for i in range(hoops):
            verts += shell[i]
        for i in range(hoops - 1):
            for j in range(n - 1):
                faces.append((i * n + j, (i + 1) * n + j, (i + 1) * n + j + 1, i * n + j + 1))
                uvs.append([(xs[i], arc[j]), (xs[i + 1], arc[j]), (xs[i + 1], arc[j + 1]), (xs[i], arc[j + 1])])
        # the top faces out of the arch, the underside into it (checked against the cart's axis line below)
        ins = []
        for f in faces:
            fc = sum((verts[q] for q in f), V((0, 0, 0))) / 4
            ax = V((fc.x, 0, z_s - 0.3))
            ins.append(fc + (fc - ax) if inward else ax)
        oriented = _orient(verts, faces, ins)
        uvs = [uv if fo == fi else uv[::-1] for uv, fo, fi in zip(uvs, oriented, faces)]
        k.add(mat, False, verts, oriented, uvs)
    # rims: the shell's two ends and its two eaves
    for i, sgn in ((0, -1), (hoops - 1, 1)):
        for j in range(n - 1):
            a, b, c, d = outer[i][j], outer[i][j + 1], inner[i][j + 1], inner[i][j]
            q = [a, b, c, d]
            if (b - a).cross(d - a).x * sgn < 0:
                q = q[::-1]
            sb.quad(mat, False, *q)
    for j, sgn in ((0, 1), (n - 1, -1)):
        for i in range(hoops - 1):
            q = [outer[i][j], outer[i + 1][j], inner[i + 1][j], inner[i][j]]
            if (q[1] - q[0]).cross(q[3] - q[0]).z > 0:
                q = q[::-1]
            sb.quad(mat, False, *q)
    # hoops: bands on the mat, the end ones broader
    for i, x in enumerate(xs):
        bw = 0.11 if i in (0, hoops - 1) else 0.06
        pts = [V((x, y, z)) for (y, z, _, _) in prof]
        nrms = [V((0, ny, nz)) for (_, _, ny, nz) in prof]
        b0, b1 = (-bw / 2, bw / 2)
        if i == 0:
            b0, b1 = -0.015, bw - 0.015
        elif i == hoops - 1:
            b0, b1 = -bw + 0.015, 0.015
        _sweep_rect(hoop_mat, pts, nrms, V((1, 0, 0)), -0.004, 0.03, b0, b1, sides=(0, 1, 2), caps=True)
    return xs


def _panelled_side(x0, x1, y, z0, z1, out, rng, bay=0.55, frieze=0.3, mat="timber", panel="timber",
                   frieze_panel="deck"):
    """One side wall of a cart body in a local frame (a plane at y, facing `out` = +1/-1 in y): posts every `bay`,
    bottom, mid and top rails, a board panel set back in each bay below, and under the top rail a frieze of small
    pale panels standing proud of a dark backing (their outlines draw the painted frieze's ink). Single-sided: the
    body is closed by its cover and end screens."""
    n = max(2, round((x1 - x0) / bay))
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    zf0 = z1 - frieze
    for x in xs:
        k.beam(mat, False, (x, y, z0), (x, y, z1), 0.075, 0.075, 0)
    for z, hh in ((z0 + 0.04, 0.09), (zf0, 0.07), (z1 - 0.035, 0.09)):
        k.beam(mat, False, (x0 - 0.04, y, z), (x1 + 0.04, y, z), 0.09, hh, 0.015)

    def face(m, xa, xb, za, zb, d):
        yy = y + out * d
        q = [V((xa, yy, za)), V((xb, yy, za)), V((xb, yy, zb)), V((xa, yy, zb))]
        if out > 0:     # wound to face out of the body
            q = q[::-1]
        sb.quad(m, False, *q, uv=[(q[i].x / 1.2, q[i].z / 1.2) for i in range(4)])
    face("lattice", x0, x1, zf0 + 0.03, z1 - 0.07, -0.02)
    for xa, xb in zip(xs, xs[1:]):
        face(panel, xa + 0.035, xb - 0.035, z0 + 0.08, zf0 - 0.035, -0.012)
        face(frieze_panel, xa + 0.085, xb - 0.085, zf0 + 0.075, z1 - 0.115, 0.004)
    return xs


def _driver_seat(M, fwd, x_seat, z_seat, half, x_feet, z_feet, rng, hang_from):
    """A driver's seat across the front of a cart (local frame M, x forward): a plank on two short bearers at x_seat,
    its top at z_seat, `half` wide each side, and a footboard ahead and below (x_feet, top at z_feet) slung on two
    hangers from the points `hang_from` (local (x, y, z), one per side). Returns Built-style (seat, feet) world tuples."""
    with k.placed(M):
        for y in (half - 0.05, -half + 0.05):
            k.beam("timber", False, (x_seat - 0.17, y, z_seat - 0.07), (x_seat + 0.17, y, z_seat - 0.07), 0.07, 0.07, 0.012)
        plank_flat("timber", (x_seat, half), (x_seat, -half), 0.3, z_seat - 0.045, z_seat, rng)
        plank_flat("timber", (x_feet, half * 0.8), (x_feet, -half * 0.8), 0.2, z_feet - 0.035, z_feet, rng)
        for (hx, hy, hz) in hang_from:
            k.beam("timber", False, (x_feet, hy, z_feet - 0.03), (hx, hy, hz), 0.035, 0.035, 0.006)
    heading = math.degrees(math.atan2(fwd.y, fwd.x))
    seat = M @ V((x_seat, 0, z_seat))
    feet = M @ V((x_feet, 0, z_feet))
    return (round(seat.x, 3), round(seat.y, 3), round(seat.z, 3), round(heading, 1)), (round(feet.x, 3), round(feet.y, 3), round(feet.z, 3))


def covered_ox_cart(front, rear, wheels=None, team=None, z_of=None, rng=None, R=0.85, spokes=18, body_len=3.9,
                    body_w=1.24, wheel_at=0.56, body_h=0.88, cover_h=1.05, hoops=7, basket=True, front_screen=True,
                    driver_seat=True):
    """The big covered ox cart (牛拉大盖车; S5.veh.covered_ox_cart_9800, S4's three-ox carts): a panelled body with a
    frieze of framed panels under a woven-mat barrel cover on hoops, a timber bed on two sills over the axle, two big
    spoked wheels outside the body, a woven screen across the front, a basket hung under the rear, and a draught pole
    running forward from under the bed to the neck yoke of the oxen flanking it; lead oxen pull on rope traces from
    their own neck yokes.

    Positions (map): front/rear set the axis (the vehicle faces rear -> front); wheels[0] is the near wheel's ground
    contact: its position along the axis places the axle (only that is used: its sideways offset is not reliable in
    the oblique view); without wheels the axle sits at the middle. team: the oxen (see module doc); without a team
    the pole runs to `front` and its yoke lies where a pair of oxen would stand.
    choice: R wheel radius 0.85 (painted wheel 174 px across = 2.26 m at the map's scale, / 1.3 for the painted
    figures' scale); spokes 18 (as painted); body_len 3.9 (the painted cover, 5.0 m, / 1.3); body_w 1.24; wheel_at
    0.56 (the painted wheel sits 56% along the cover from its rear); body_h 0.88 (bed to top rail); cover_h 1.05
    (top rail to crown; the painted cover is about 1.2 x the body's height); driver_seat True: the sills run on past
    the body's front with a seat across them (top about 1.05 m: the painted driver sits on the front of the shafts,
    H 0.9) and a footboard slung ahead (S4's seam note: "a footboard ... with the seated driver's feet on it");
    returns a Built with .seat and .feet."""
    z_of = _zf(z_of)
    rng = rng or random.Random(9800)
    t0 = _tri_count()
    origin, fwd, left, L = _axis(rear, front)
    s_w = _along(wheels[0], origin, fwd) if wheels else L * 0.45
    zg = z_of(*(origin + fwd * s_w).xy)
    bx0 = s_w - wheel_at * body_len
    bx1 = bx0 + body_len
    hw = body_w / 2
    z_sill = R + 0.05
    z_bed = z_sill + 0.14
    z_rail = z_bed + body_h
    track = hw + 0.27
    M = _frame_m(origin, fwd, zg)
    with k.placed(M):
        # bed: two sills over the axle, cross bearers, floor boards, iron-shod sill ends
        for y in (hw - 0.05, -hw + 0.05):
            k.beam("timber", False, (bx0 - 0.22, y, z_sill + 0.07), (bx1 + 0.12, y, z_sill + 0.07), 0.13, 0.14, 0.02)
            k.beam("lattice", False, (bx0 - 0.24, y, z_sill + 0.07), (bx0 - 0.12, y, z_sill + 0.07), 0.15, 0.16, 0.02)
        for x in [bx0 + 0.1 + i * (body_len - 0.2) / 4 for i in range(5)]:
            k.beam("timber", False, (x, hw + 0.04, z_sill - 0.02), (x, -hw - 0.04, z_sill - 0.02), 0.1, 0.08, 0.015)
        k.board("timber", False, (bx0, 0), (bx1, 0), body_w - 0.12, z_bed - 0.05, z_bed)
        # axle, its bearing blocks under the sills
        k.beam("timber", False, (s_w, track + 0.05, R), (s_w, -track - 0.05, R), 0.12, 0.12, 0.02)
        for y in (hw - 0.05, -hw + 0.05):
            k.bx("timber", False, (s_w - 0.14, y - 0.08, R + 0.04), (s_w + 0.14, y + 0.08, z_sill))
        # body: panelled sides, corner posts, the rear end boarded, the front open behind the screen
        for y, out in ((hw, 1), (-hw, -1)):
            _panelled_side(bx0, bx1, y, z_bed, z_rail, out, rng)
        for x, sgn in ((bx0, -1), (bx1, 1)):
            k.beam("timber", False, (x, hw, z_rail - 0.035), (x, -hw, z_rail - 0.035), 0.09, 0.09, 0.015)
        xr = bx0 + 0.012
        for i in range(4):
            ya, yb = -hw + 0.04 + i * (body_w - 0.08) / 4, -hw + 0.04 + (i + 1) * (body_w - 0.08) / 4 - 0.012
            k.board("timber", False, (xr, ya), (xr, yb), 0.03, z_bed, z_rail - 0.08)
        # the cover, its eaves a little proud of the body; its end arches closed by a woven screen (front) and
        # boards (rear) under the arch
        z_s = z_rail + cover_h * 0.58
        z_top = z_rail + cover_h
        xs = barrel_cover(bx0 - 0.26, bx1 + 0.3, hw + 0.08, z_rail - 0.04, z_s, z_top, hoops=hoops)
        prof = _arch_profile(hw + 0.035, z_rail, z_s - 0.03, z_top - 0.05)
        # rear: the boarded arch (a fan of boards inside the cover's end)
        xa = bx0 + 0.02
        ring = [V((xa, y, z)) for (y, z, _, _) in prof]
        cen = V((xa, 0, z_rail))
        for p, q in zip(ring, ring[1:]):
            tri = [cen, p, q]
            if (p - cen).cross(q - cen).x > 0:
                tri = tri[::-1]
            k.add("timber", False, tri, [(0, 1, 2)])
        if front_screen:
            # the woven screen across the front: mat in a bent frame, from the bed up into the arch, leaning out
            xf = bx1 - 0.05
            pts = [V((xf + 0.12 * (z - z_bed) / (z_top - z_bed), y * 0.94, z)) for (y, z, _, _) in prof]
            bottom = [V((xf, hw * 0.94, z_bed)), V((xf, -hw * 0.94, z_bed))]
            outline = [bottom[0]] + pts + [bottom[1]]
            c = V((xf + 0.05, 0, (z_bed + z_top) / 2))
            for p, q in zip(outline, outline[1:]):
                _quad2("reed", c, p, q, c)
            _quad2("reed", c, outline[-1], outline[0], c)
            sb.tube("timber", False, outline + [outline[0]], [0.035] * (len(outline) + 1), segs=4)
            for y in (-0.22, 0.22):
                top = min(pts, key=lambda p: abs(p.y - y))
                k.beam("timber", False, V((xf, y, z_bed)), V((top.x, y, top.z)), 0.04, 0.04, 0)
        if basket:
            # the basket hung under the rear: woven, flared, with a rim, on two ropes from the sills
            cx, cz = bx0 - 0.12, z_sill - 0.72
            _lathe_axis("reed", V((cx, 0, cz)), V((0, 0, 1)), V((1, 0, 0)), V((0, 1, 0)),
                        [(0.2, 0.0), (0.33, 0.14), (0.4, 0.38), (0.41, 0.52)], segs=10)
            _lathe_axis("rope", V((cx, 0, cz)), V((0, 0, 1)), V((1, 0, 0)), V((0, 1, 0)),
                        [(0.425, 0.48), (0.425, 0.55)], segs=10, caps=False)
            for y in (0.33, -0.33):
                k.beam("rope", False, (cx + 0.05, y, cz + 0.53), (bx0 - 0.12, y * 1.4, z_sill + 0.02), 0.025, 0.025, 0)
        # the walker's collider: the body and wheels (it stops at the body's front, so the driver's seat is clear)
        k.bx("hidden", True, (bx0 - 0.3, -track - 0.12, 0), (bx1 + (0.04 if driver_seat else 0.3), track + 0.12, z_top))
    seat = feet = None
    if driver_seat:   # the sills run on past the front; the seat across them, the footboard slung from their ends
        with k.placed(M):
            for y in (hw - 0.05, -hw + 0.05):
                k.beam("timber", False, (bx1 + 0.1, y, z_sill + 0.07), (bx1 + 0.62, y, z_sill + 0.07), 0.11, 0.12, 0.02)
        seat, feet = _driver_seat(M, fwd, bx1 + 0.38, z_sill + 0.17, hw - 0.02, bx1 + 0.78, R * 0.62, rng,
                                  [(bx1 + 0.6, y, z_sill + 0.03) for y in (hw - 0.05, -hw + 0.05)])
    # wheels, outside the body (world)
    for sgn in (1, -1):
        c = M @ V((s_w, sgn * track, R))
        spoked_wheel(c, left * sgn, R, spokes=spokes, phase=rng.uniform(0, 1))
    # the draught pole: from under the bed, level past the body's front, rising to the yoke
    p0 = M @ V((s_w - 0.5, 0, R + 0.02))
    p1 = M @ V((bx1 + 0.35, 0, R + 0.04))
    if team:
        animals = _team(team, z_of, "ox")
        first = _ranks(animals, origin, fwd)[0]
        yc = sum((o["C"] for o in first), V((0, 0, 0))) / len(first)
        tip = V((yc.x, yc.y, max(o["C"].z for o in first) + 0.07 - 0.05))
    else:
        H = HARNESS["ox"]
        f = V((front[0], front[1], 0))
        tip = V((f.x, f.y, z_of(f.x, f.y) + H["collar_h"] + 0.02))
    _polybeam("timber", [p0, p1, p1.lerp(tip, 0.5) + UP * 0.03, tip + fwd * 0.12], 0.12, 0.13, 0.025)
    if team:
        _harness(origin, fwd, left, tip, team, z_of, "ox", "pole")
    else:   # no team given: the pair's yoke bar lies across the pole's tip, where the painted oxen stand
        a, b = tip + UP * 0.05 + left * 0.95, tip + UP * 0.05 - left * 0.95
        _polybeam("timber", [a + UP * 0.07, a.lerp(b, 0.18) + UP * 0.015, (a + b) / 2, a.lerp(b, 0.82) + UP * 0.015,
                             b + UP * 0.07], 0.11, 0.1, 0.02)
    return Built(_tri_count() - t0, seat, feet)


# ---------------------------------------------------------------- the barrow (串车) and its loads

def soft_sack(c, length, width, height, yaw, rng, mat="hemp", tie=True, nu=12, nv=7):
    """A filled cloth sack lying on its side, as loaded on a cart: a slumped, slightly lumpy ellipsoid along `yaw`,
    flattened where it rests, one end gathered into a neck with a tie. c: the middle of its underside."""
    ax = V((math.cos(yaw), math.sin(yaw), 0))
    sd = V((-ax.y, ax.x, 0))
    c = V(c)
    mid = c + UP * (height / 2)
    lump = [rng.uniform(0.96, 1.04) for _ in range(nu)]
    verts = [mid - ax * (length / 2)]
    for j in range(1, nv):
        s = -1 + 2 * j / nv
        pr = (1 - abs(s) ** 2.6) ** 0.5          # a round, filled body easing into rounded ends
        for i in range(nu):
            a = 2 * math.pi * (i + 0.5) / nu
            y = math.cos(a) * width / 2 * pr * lump[i]
            z = math.sin(a) * height / 2 * pr * (1.0 if math.sin(a) > 0 else 0.6) * lump[i]
            verts.append(mid + ax * (s * length / 2) + sd * y + UP * z)
    neck = mid + ax * (length / 2)
    verts.append(neck)
    faces, ins = [], []
    for i in range(nu):
        faces.append((0, 1 + (i + 1) % nu, 1 + i))
        ins.append(mid)
    for j in range(nv - 2):
        for i in range(nu):
            a0, a1 = 1 + j * nu + i, 1 + j * nu + (i + 1) % nu
            faces.append((a0, a1, a1 + nu, a0 + nu))
            ins.append(mid)
    last = 1 + (nv - 2) * nu
    for i in range(nu):
        faces.append((last + i, last + (i + 1) % nu, len(verts) - 1))
        ins.append(mid)
    k.add(mat, False, verts, _orient(verts, faces, ins))
    if tie:
        p0 = neck - ax * 0.02
        sb.cyl(mat, False, p0, p0 + ax * 0.12 + UP * 0.02, width * 0.12, width * 0.17, segs=6)
        sb.cyl("rope", False, p0 + ax * 0.03, p0 + ax * 0.06, width * 0.135, segs=6, caps=False)


def _barrow(front, rear, wheels, z_of, rng, R, spokes, frame_w, held, deck_len):
    """The 串车's frame in a local frame: two long rails at axle height from the rear handles to the front shafts,
    one big spoked wheel under the middle on an axle between them, and above the wheel a raised deck on four posts
    and braces, on which the load rides (so the whole wheel shows below it, as painted); two resting legs at the rear.
    Returns (M, origin, fwd, left, L, s_w, z_deck, hw)."""
    origin, fwd, left, L = _axis(rear, front)
    s_w = _along(wheels[0], origin, fwd) if wheels else L * 0.5
    zg = z_of(*(origin + fwd * s_w).xy)
    M = _frame_m(origin, fwd, zg)
    hw = frame_w / 2
    z_r = R + 0.02
    z_h = 0.86 if held else z_r
    z_deck = 2 * R + 0.12
    d0, d1 = s_w - deck_len / 2, s_w + deck_len / 2
    with k.placed(M):
        for sgn in (1, -1):
            y = sgn * hw
            pts = [V((0.0, sgn * (hw - 0.08), z_h)), V((0.8, y, z_r)), V((L - 0.8, y, z_r)),
                   V((L, sgn * (hw - 0.1), z_r + 0.12))]
            _polybeam("timber", pts, 0.07, 0.09, 0.015)
            # posts and braces carrying the deck bearer
            for x in (s_w - R - 0.07, s_w + R + 0.07):
                k.beam("timber", False, (x, y, z_r), (x, y, z_deck - 0.06), 0.065, 0.065, 0.012)
            for xa, xb in ((s_w - R - 0.65, d0 + 0.05), (s_w + R + 0.65, d1 - 0.05)):
                k.beam("timber", False, (xa, y, z_r + 0.03), (xb, y, z_deck - 0.08), 0.05, 0.05, 0)
            k.beam("timber", False, (d0, y, z_deck - 0.05), (d1, y, z_deck - 0.05), 0.08, 0.08, 0.015)
            # resting leg at the rear
            k.beam("timber", False, (0.95, y, z_r), (0.85, y * 1.05, 0.03 if not held else 0.2), 0.06, 0.06, 0.012)
        for x in (0.8, s_w - R - 0.07, s_w + R + 0.07, L - 0.8):
            k.beam("timber", False, (x, hw + 0.03, z_r + 0.01), (x, -hw - 0.03, z_r + 0.01), 0.065, 0.065, 0.012)
        k.beam("timber", False, (s_w, hw + 0.05, R), (s_w, -hw - 0.05, R), 0.07, 0.07, 0.012)
        nb = 6
        for i in range(nb):
            xa = d0 + i * deck_len / nb
            plank_flat("timber", ((xa + xa + deck_len / nb - 0.02) / 2, hw + 0.04),
                       ((xa + xa + deck_len / nb - 0.02) / 2, -hw - 0.04), deck_len / nb - 0.02, z_deck - 0.01, z_deck + 0.025, rng)
        k.bx("hidden", True, (0.3, -hw - 0.1, 0), (L - 0.3, hw + 0.1, z_deck + 0.6))  # the walker's collider
    spoked_wheel(M @ V((s_w, 0, R)), left, R, spokes=spokes, hub_len=0.26, phase=rng.uniform(0, 1))
    return M, origin, fwd, left, L, s_w, z_deck + 0.025, hw


def _dome_fn(cx, a, b, z0, z_top, peak_dx, lift=0.0):
    """The domed sheet's surface (_dome), local frame: S(ang, th) -> point; ang round the dome from +x (the front),
    th 0 at the hem to pi/2 at the crown."""
    def S(ang, th):     # th: 0 = hem, pi/2 = crown
        zh = z0 + lift * max(0.0, math.cos(ang)) ** 1.5
        return V((cx + a * math.cos(ang) * math.cos(th) + peak_dx * math.sin(th),
                  b * math.sin(ang) * math.cos(th), zh + (z_top - zh) * math.copysign(abs(math.sin(th)) ** 0.85, th)))
    return S


def _dome(M, cx, a, b, z0, z_top, peak_dx, nu=16, nv=5, mat="script_sheet", band="lattice", band_w=0.13, wraps=3,
          lift=0.0):
    """A domed sheet spread over a load (local frame of M): a half ellipsoid a x b at its hem (z0) rising to z_top,
    its upper part leaning peak_dx along x and its hem lifted by up to `lift` at the front (so the load shows under
    it there); the sheet carries the script texture in columns running up its meridians (`wraps` times round), with a
    dark band along its hem and one down its front quarter, where the painted sheet's edge runs."""
    S = _dome_fn(cx, a, b, z0, z_top, peak_dx, lift)
    ths = [(math.pi / 2) * j / nv for j in range(nv)]
    loc = [S(2 * math.pi * i / nu, th) for th in ths for i in range(nu)] + [S(0, math.pi / 2)]
    verts = [M @ p for p in loc]
    top = len(verts) - 1
    faces, uvs, ins = [], [], []
    centre = M @ V((cx, 0, z0))
    for j in range(nv - 1):
        for i in range(nu):
            faces.append((j * nu + i, j * nu + (i + 1) % nu, (j + 1) * nu + (i + 1) % nu, (j + 1) * nu + i))
            uvs.append([(wraps * i / nu, j / nv), (wraps * (i + 1) / nu, j / nv), (wraps * (i + 1) / nu, (j + 1) / nv),
                        (wraps * i / nu, (j + 1) / nv)])
            ins.append(centre)
    for i in range(nu):
        j = nv - 1
        faces.append((j * nu + i, j * nu + (i + 1) % nu, top))
        uvs.append([(wraps * i / nu, j / nv), (wraps * (i + 1) / nu, j / nv), (wraps * (i + 0.5) / nu, 0.99)])
        ins.append(centre)
    oriented = _orient(verts, faces, ins)
    uvs = [uv if fo == fi else uv[::-1] for uv, fo, fi in zip(uvs, oriented, faces)]
    k.add(mat, False, verts, oriented, uvs)
    k.add("cloth_white", False, verts, [f[::-1] for f in oriented])    # the sheet's inside, seen under the hem
    # the hem band: a strip round the hem, just proud of the sheet
    th1 = math.atan2(band_w, (z_top - z0))
    for i in range(nu):
        a0, a1 = 2 * math.pi * i / nu, 2 * math.pi * (i + 1) / nu
        q = [S(a0, -0.02), S(a1, -0.02), S(a1, th1), S(a0, th1)]
        q = [M @ (p + (p - V((cx, 0, p.z))).normalized() * 0.012) for p in q]
        _quad2(band, *q)
    # the sheet's edge running from near the crown down its front quarter to the hem
    line = [S(math.radians(-40 + 12 * j / nv), (math.pi / 2) * (0.92 - 0.94 * j / nv)) for j in range(nv + 1)]
    for p, q in zip(line, line[1:]):
        nrm = (p - V((cx, 0, z0))).normalized()
        side = (q - p).cross(nrm).normalized() * (band_w / 2)
        nrm = nrm * 0.015
        _quad2(band, M @ (p - side + nrm), M @ (q - side + nrm), M @ (q + side + nrm), M @ (p + side + nrm))


def _wicker_band(M, cx, a, b, z0, z1, segs=14, mat="reed"):
    """An oval woven wall (the load's wicker body) on the deck: outer face and a top rim."""
    ring0 = [V((cx + a * math.cos(2 * math.pi * i / segs), b * math.sin(2 * math.pi * i / segs), z0)) for i in range(segs)]
    ring1 = [V((p.x, p.y, z1)) for p in ring0]
    verts = [M @ p for p in ring0 + ring1]
    faces = [(i, (i + 1) % segs, segs + (i + 1) % segs, segs + i) for i in range(segs)] + [tuple(range(segs, 2 * segs))]
    k.add(mat, False, verts, _orient(verts, faces, [M @ V((cx, 0, (z0 + z1) / 2 - 0.05))] * len(faces)))


def _draught_pole(M, L, R, origin, fwd, left, team, z_of, mat="bamboo"):
    """A long draught pole from the barrow's front cross bar to a swingletree behind the nearest animal of the team,
    jointed like bamboo; the team's rope traces run from it along their flanks to their collars."""
    tip = M @ V((L - 0.75, 0, R + 0.05))
    animals = _team(team, z_of, "donkey")
    first = _ranks(animals, origin, fwd)[0]
    near = min(first, key=lambda an: _along(an["root"], origin, fwd))
    end = near["root"] - near["fwd"] * (near["H"]["length"] * 0.5 + 0.35)
    end.z = z_of(end.x, end.y) + near["H"]["withers_h"] * 0.62
    sb.cyl(mat, False, tip, end, 0.032, 0.027, segs=6)
    d = (end - tip).normalized()
    n = max(2, int((end - tip).length / 0.45))
    for i in range(1, n):
        p = tip.lerp(end, i / n)
        sb.cyl(mat, False, p - d * 0.012, p + d * 0.012, 0.038, segs=6)
    _harness(origin, fwd, left, end, team, z_of, "donkey", "pole")


def barrow_screen(front, rear, wheels=None, team=None, z_of=None, rng=None, R=0.6, spokes=14, frame_w=0.86,
                  held=True, deck_len=1.9, dome_len=2.4, dome_w=1.55, dome_top=2.6, peak_dx=-0.22, stakes=False,
                  poles=False, panel=False):
    """The 串车 under the cursive-script screen (S5.veh.cart_screen_8510): a long barrow with one big spoked wheel
    under the middle, rear handles and front shafts, its load (a wicker body) riding on a deck above the wheel under
    a huge domed sheet written all over in cursive script and edged by a dark band; a long jointed draught pole runs
    from the front to a swingletree behind the trace donkey, whose rope traces run along its flanks to its collar.

    Positions (map): rear = ground under the rear handle tips, front = under the front shafts' ends (the barrow spans
    exactly between them: the carters hold it there), wheels[0] = the wheel (its place along the axis), team = the
    trace donkey(s) (S5.ani.trace_donkey_8814).
    choice: R 0.6 (painted wheel about 1.3 m across at life size); spokes 14; frame_w 0.86; held True (the handles
    held up by the carters, as painted; False rests it on its rear legs); deck_len 1.9; dome_len 2.4, dome_w 1.55,
    dome_top 2.6 (painted: the sheet spans u 8290-8500 and rises to v 1075, far above the wheel); peak_dx -0.2 (the
    painted dome is highest behind the wheel).
    Extras (round 2, S3.veh.chuanche_17775, 书屏遭废, all off by default): stakes True: three stakes standing up out of
    the load's rear (west) end, lashed together; poles True: two long poles running forward out of the load's top
    past its front, rope loops hanging from them and one rope ending in an iron hook; panel True: a ribbed woven
    panel (a mat or a basket's side) laid over the sheet's front-left (north-east) shoulder."""
    z_of = _zf(z_of)
    rng = rng or random.Random(8510)
    t0 = _tri_count()
    M, origin, fwd, left, L, s_w, z_deck, hw = _barrow(front, rear, wheels, z_of, rng, R, spokes, frame_w, held, deck_len)
    _wicker_band(M, s_w, dome_len / 2 - 0.1, dome_w / 2 - 0.08, z_deck - 0.02, z_deck + 0.42)
    _dome(M, s_w, dome_len / 2, dome_w / 2, z_deck + 0.02, dome_top, peak_dx, lift=0.36)
    if stakes or poles or panel:
        S = _dome_fn(s_w, dome_len / 2, dome_w / 2, z_deck + 0.02, dome_top, peak_dx, lift=0.36)
        with k.placed(M):
            _screen_extras(S, s_w, z_deck, deck_len, dome_len, dome_top, hw, rng, stakes, poles, panel)
    if team:
        _draught_pole(M, L, R, origin, fwd, left, team, z_of)
    return _tri_count() - t0


def _flat_bar(mat, a, b, w, d, out):
    """A bar seen from one side only (slats, ribs on a face): its front and two sides, no back or ends (6 triangles)."""
    a, b = V(a), V(b)
    t = (b - a).normalized()
    o = V(out).normalized()
    s = t.cross(o).normalized() * (w / 2)
    od = o * d
    verts = [a - s, b - s, b + s, a + s, a - s + od, b - s + od, b + s + od, a + s + od]
    faces = [(4, 5, 6, 7), (0, 1, 5, 4), (3, 7, 6, 2)]
    k.add(mat, False, verts, _orient(verts, faces, [(a + b) / 2 - o * 0.05] * 3))


def _hook(top, rng, s=1.0, mat="ridge"):
    """An iron hook hanging from `top`: a short shank, a curve and a barbed tip (the painted rope's end)."""
    p = V(top)
    a = rng.uniform(0, 6.283)
    side = V((math.cos(a), math.sin(a), 0))
    pts = [p, p - UP * 0.12 * s, p - UP * 0.19 * s + side * 0.04 * s, p - UP * 0.17 * s + side * 0.09 * s,
           p - UP * 0.1 * s + side * 0.1 * s]
    _polybeam(mat, pts, 0.022 * s, 0.022 * s, 0)


def _screen_extras(S, s_w, z_deck, deck_len, dome_len, dome_top, hw, rng, stakes, poles, panel):
    """barrow_screen's extras in the barrow's local frame (x forward, y left): S is the sheet's surface (_dome_fn).
    choice: stakes 1.2-1.4 m above the deck; poles reaching 0.7 m past the sheet's front, their loops hanging to about
    1.0 m above the ground (painted: down to v 1495 of a cart standing on v 1560); the panel over 25-80 degrees of the
    sheet's front-left quarter, 15-70% of its height."""
    if stakes:
        xs = s_w - deck_len / 2 + 0.08
        tops = []
        for y, hgt in ((-0.36, 1.25), (0.0, 1.4), (0.36, 1.2)):
            foot = V((xs + rng.uniform(-0.03, 0.03), y, z_deck - 0.06))
            top = foot + V((-0.08 + rng.uniform(-0.04, 0.02), y * 0.12 + rng.uniform(-0.03, 0.03), hgt))
            sb.cyl("timber", False, foot, top - (top - foot).normalized() * 0.09, 0.034, 0.03, segs=6)
            sb.cyl("timber", False, top - (top - foot).normalized() * 0.09, top, 0.03, 0.006, segs=6, caps=False)
            tops.append((foot, top))
        for f in (0.62, 0.8):       # lashings across the stakes
            pts = [a.lerp(b, f) + V((0.035, 0, 0)) for a, b in tops]
            sb.tube("rope", False, pts, [0.016] * len(pts), segs=4)
            for q in pts:
                sb.cyl("rope", False, q - UP * 0.025, q + UP * 0.025, 0.045, segs=6, caps=False)
    if poles:
        x_end = s_w + dome_len / 2 + 0.7
        ends = []
        for y in (0.26, -0.3):
            a = V((s_w + 0.05, y, dome_top - 0.32))
            b = V((x_end + rng.uniform(-0.1, 0.05), y * 1.25, dome_top - 0.2 + rng.uniform(-0.04, 0.04)))
            sb.cyl("bamboo", False, a, b, 0.035, 0.028, segs=6)
            for f in (0.35, 0.7):    # bamboo joints
                q = a.lerp(b, f)
                d = (b - a).normalized()
                sb.cyl("bamboo", False, q - d * 0.012, q + d * 0.012, 0.041, segs=6)
            ends.append((a, b))
        # rope loops hanging from the poles' outer halves, one rope ending in an iron hook
        loops = ((0, 0.62, 0.8, 1.15), (1, 0.6, 0.84, 0.95), (0, 0.84, 0.97, 1.35))
        for i, f0, f1, z_lo in loops:
            a, b = ends[i]
            p, q = a.lerp(b, f0), a.lerp(b, f1)
            pts = []
            for j in range(9):        # a long U: the rope falls almost straight from each end, round at the foot
                t = j / 8
                c = p.lerp(q, 0.5 - 0.5 * math.cos(math.pi * t) * (1.0 - 0.25 * math.sin(math.pi * t)))
                c.z = c.z - (c.z - z_lo) * math.sin(math.pi * t) ** 0.35
                pts.append(c + V((0, 0.04 * math.sin(math.pi * t) * (1 if i else -1), 0)))
            sb.tube("rope", False, pts, [0.015] * len(pts), segs=4)
        a, b = ends[1]
        p = a.lerp(b, 0.95)
        low = V((p.x + 0.04, p.y - 0.05, 1.1))
        sb.tube("rope", False, [p, p.lerp(low, 0.5) + V((0.02, 0, 0)), low], [0.015] * 3, segs=4)
        _hook(low, rng)
    if panel:
        nu, nv = 5, 4
        a0, a1 = math.radians(25), math.radians(80)
        t0, t1 = 0.15 * math.pi / 2, 0.7 * math.pi / 2
        grid = []
        for i in range(nu + 1):
            ang = a0 + (a1 - a0) * i / nu
            col = []
            for j in range(nv + 1):
                p = S(ang, t0 + (t1 - t0) * j / nv)
                out = V((p.x - s_w, p.y, 0)).normalized()
                col.append(p + out * 0.06)
            grid.append(col)
        verts = [p for col in grid for p in col]
        m = nv + 1
        faces = [(i * m + j, (i + 1) * m + j, (i + 1) * m + j + 1, i * m + j + 1) for i in range(nu) for j in range(nv)]
        ins = [V((s_w, 0, z_deck + 0.3))] * len(faces)
        ori = _orient(verts, faces, ins)
        uvs = []
        for fo in ori:          # the weave's strands run up the panel (u across, v up)
            uvs.append([((fi // m) * 0.3, (fi % m) * 0.3) for fi in fo])
        k.add("reed", False, verts, ori, uvs)
        for i in range(nu + 1):     # the ribs, up the panel
            col = grid[i]
            pts = [p + V((p.x - s_w, p.y, 0)).normalized() * 0.025 for p in col]
            sb.tube("bamboo", False, pts, [0.018] * len(pts), segs=4)
        for j in (0, nv):           # its top and bottom edges bound
            pts = [grid[i][j] + V((grid[i][j].x - s_w, grid[i][j].y, 0)).normalized() * 0.02 for i in range(nu + 1)]
            sb.tube("rope", False, pts, [0.02] * len(pts), segs=4)


# ---------------------------------------------------------------- the barrow with its other loads (round 2)

def _mat_roll(a, b, r, mat="reed", band="rope"):
    """A rolled mat lying from a to b: the roll, its end faces wound in (a spiral line drawn as a smaller inner ring),
    two rope bands."""
    a, b = V(a), V(b)
    d = (b - a).normalized()
    sb.cyl(mat, False, a, b, r, segs=10)
    for e, sgn in ((a, -1), (b, 1)):
        sb.cyl("lattice", False, e + d * sgn * 0.004, e + d * sgn * 0.012, r * 0.42, segs=8)
    for f in (0.2, 0.8):
        p = a.lerp(b, f)
        sb.cyl(band, False, p - d * 0.03, p + d * 0.03, r * 1.05, segs=10, caps=False)


def _hoop_load(s_w, z_deck, deck_len, hw, rng):
    """barrow_load(load="hoops") in the barrow's local frame: straw bundles and sacks heaped on the deck, a rolled mat
    across the heap (painted end-on among the hoops), four bare bent hoops over it all (a cover frame without its mat),
    tied by a ridge pole and a batten along each shoulder, the heap roped down.
    choice: crown 1.05-1.15 m over the deck (the hoops close over the heap; painted load 155 px over a 96 px wheel),
    hoops flaring 0.59 m either side."""
    d0, d1 = s_w - deck_len / 2, s_w + deck_len / 2
    zd = z_deck

    def bundle(x, y, z, length, width, height, yaw, mat, tie=True):
        soft_sack(V((x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), z)), length * rng.uniform(0.95, 1.03),
                  width * rng.uniform(0.95, 1.05), height, yaw + rng.uniform(-0.08, 0.08), rng, mat=mat, tie=tie)
    # three layers, heaped highest in the middle: straw bundles and sacks across the deck, a rolled mat across the
    # second layer (painted end-on among the hoops), a dark bundle and a small sack on top
    for i, (dx, mat) in enumerate(((-0.62, "reed"), (0.0, "bark"), (0.62, "reed"))):
        bundle(s_w + dx, 0.0, zd, 1.0, 0.58, 0.38, math.pi / 2 * (1 if i % 2 else -1), mat, tie=mat != "bark")
    bundle(s_w - 0.45, 0.0, zd + 0.3, 0.92, 0.52, 0.36, -math.pi / 2, "hemp")
    bundle(s_w + 0.56, 0.0, zd + 0.3, 0.9, 0.5, 0.34, math.pi / 2, "reed")
    r_m = 0.23
    _mat_roll(V((s_w + 0.07, -0.52, zd + 0.33 + r_m)), V((s_w + 0.1, 0.52, zd + 0.34 + r_m)), r_m)
    bundle(s_w - 0.22, 0.05, zd + 0.62, 0.95, 0.5, 0.32, 0.0, "bark", tie=False)
    bundle(s_w + 0.48, -0.08, zd + 0.6, 0.62, 0.42, 0.3, 0.4, "reed")
    # the hoops
    n = 4
    crowns, shoulders = [], {1: [], -1: []}
    for i in range(n):
        f = i / (n - 1)
        x = d0 + 0.2 + (deck_len - 0.4) * f + rng.uniform(-0.03, 0.03)
        z_top = zd + 1.05 + 0.1 * (1 - abs(2 * f - 1))
        zs = zd + 0.5
        prof = [(0.49, zd - 0.03), (0.56, zd + 0.22)]
        for j in range(6):
            t = (math.pi / 2) * j / 5
            prof.append((0.59 * math.cos(t), zs + (z_top - zs) * math.sin(t)))
        prof += [(-y, z) for y, z in reversed(prof[:-1])]
        pts = [V((x, y, z)) for y, z in prof]
        sb.tube("bamboo", False, pts, [0.022] * len(pts), segs=5)
        crowns.append(V((x, 0, z_top + 0.02)))
        for sgn in (1, -1):
            t = math.pi / 4
            shoulders[sgn].append(V((x, sgn * (0.59 * math.cos(t) + 0.02), zs + (z_top - zs) * math.sin(t))))
    d = V((1, 0, 0))
    sb.tube("bamboo", False, [crowns[0] - d * 0.12] + crowns + [crowns[-1] + d * 0.12], [0.02] * (n + 2), segs=5)
    for sgn in (1, -1):
        sb.tube("bamboo", False, shoulders[sgn], [0.018] * n, segs=4)
    for x in (s_w - 0.35, s_w + 0.3):       # ropes over the heap, tied to the deck's bearers
        half = [V((x, hw + 0.03, zd - 0.03)), V((x, 0.54, zd + 0.2)), V((x, 0.52, zd + 0.56)), V((x, 0.3, zd + 0.92))]
        pts = half + [V((x, 0.0, zd + 0.99))] + [V((p.x, -p.y, p.z)) for p in reversed(half)]
        sb.tube("rope", False, pts, [0.016] * len(pts), segs=4)


def _lattice_crate(c, l, w, h, rng, mat="timber", slat="timber"):
    """A lattice crate standing at c (the middle of its foot), l along x, w across, h tall, local frame: corner posts,
    rails round its foot and top, its four faces slatted (vertical slats and a middle bar, each a strip with its own
    edges) over a dark inside, a plank lid."""
    c = V(c)
    hx, hy = l / 2, w / 2
    corners = [V((c.x + sx * hx, c.y + sy * hy, c.z)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for p in corners:
        k.beam(mat, False, p, p + UP * h, 0.05, 0.05, 0.008)
    for z in (0.025, h - 0.025):
        for a, b in zip(corners, corners[1:] + corners[:1]):
            k.beam(mat, False, a + UP * z, b + UP * z, 0.045, 0.045, 0.006)
    # the dark inside, a little in from the slats
    inner = [V((c.x + sx * (hx - 0.03), c.y + sy * (hy - 0.03), c.z)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for a, b in zip(inner, inner[1:] + inner[:1]):
        q = [a + UP * 0.03, b + UP * 0.03, b + UP * (h - 0.03), a + UP * (h - 0.03)]
        k.add("interior", False, q, _orient(q, [(0, 1, 2, 3)], [c + UP * (h / 2)]))
    for a, b in zip(corners, corners[1:] + corners[:1]):
        L = (b - a).length
        t = (b - a).normalized()
        out = V((t.y, -t.x, 0))
        if out.dot(a - c) < 0:
            out = -out
        m = max(2, round(L / 0.11))
        for i in range(1, m):
            p = a + t * (L * i / m) - out * 0.012
            _flat_bar(slat, p + UP * 0.05, p + UP * (h - 0.05), 0.026, 0.014, out)
        _flat_bar(slat, a + t * 0.03 + UP * (h / 2) - out * 0.006, b - t * 0.03 + UP * (h / 2) - out * 0.006, 0.03, 0.016,
                  out)
    nb = 3
    for i in range(nb):
        ya = c.y - hy + w * i / nb + 0.006
        yb = c.y - hy + w * (i + 1) / nb - 0.006
        plank_flat("timber", (c.x - hx, (ya + yb) / 2), (c.x + hx, (ya + yb) / 2), yb - ya, c.z + h, c.z + h + 0.025, rng)


def _crate_load(s_w, z_deck, deck_len, hw, rng):
    """barrow_load(load="crates") in the barrow's local frame: two lattice crates one behind the other, the rear one
    low and wide, the front one standing taller (S2.veh.barrow_crates_25598: the map's east (front) crate 30 x 37 px,
    the west (rear) one 37 x 25 px), each roped to the deck's bearers. choice: rear 0.72 x 0.66 x 0.44 m, front
    0.6 x 0.6 x 0.66 m."""
    specs = ((s_w - 0.45, 0.72, 0.66, 0.44), (s_w + 0.42, 0.6, 0.6, 0.66))
    for x, l, w, h in specs:
        _lattice_crate(V((x + rng.uniform(-0.02, 0.02), rng.uniform(-0.03, 0.03), z_deck)), l, w, h, rng)
        pts = [V((x, hw + 0.03, z_deck - 0.03)), V((x, w / 2 + 0.03, z_deck + 0.08)), V((x, w / 2 + 0.03, z_deck + h + 0.02)),
               V((x, w / 2 - 0.06, z_deck + h + 0.045)), V((x, -w / 2 + 0.06, z_deck + h + 0.045)),
               V((x, -w / 2 - 0.03, z_deck + h + 0.02)), V((x, -w / 2 - 0.03, z_deck + 0.08)), V((x, -hw - 0.03, z_deck - 0.03))]
        sb.tube("rope", False, pts, [0.015] * len(pts), segs=4)


def barrow_load(front, rear, wheels=None, z_of=None, rng=None, load="hoops", held=True, R=0.6, spokes=14,
                frame_w=0.86, deck_len=1.9):
    """The 串车's barrow (as barrow_screen and sack_cart: one big spoked wheel under a raised deck, rear handles, front
    shafts) with another load:
    - load "hoops": bare bent hoops over bundles, sacks and a rolled mat (S3.veh.barrow_hooped_load_18100: "the load a
      mass of bundled goods under arched hoops (a cover frame)"; pushed from the handles, a man hauling a rope at the
      front: the rope is the figure's, not built);
    - load "crates": two lattice crates, the rear one low and wide, the front one taller (S2.veh.barrow_crates_25598,
      low confidence, far up the silk).
    Positions: as barrow_screen (rear = ground under the handle tips, front = under the front shafts' ends, wheels[0] =
    the wheel's place along the axis). No team (neither is drawn by an animal). choice: R 0.6, spokes 14, frame_w
    0.86, held True (the handles at the pusher's hands; False rests it on its legs), deck_len 1.9. Returns the
    triangles added."""
    z_of = _zf(z_of)
    rng = rng or random.Random(18100 if load == "hoops" else 25598)
    t0 = _tri_count()
    M, origin, fwd, left, L, s_w, z_deck, hw = _barrow(front, rear, wheels, z_of, rng, R, spokes, frame_w, held, deck_len)
    with k.placed(M):
        if load == "hoops":
            _hoop_load(s_w, z_deck, deck_len, hw, rng)
        elif load == "crates":
            _crate_load(s_w, z_deck, deck_len, hw, rng)
        else:
            raise ValueError(f"barrow_load: load {load!r} (hoops | crates)")
    return _tri_count() - t0


def sack_cart(front, rear, wheels=None, team=None, z_of=None, rng=None, R=0.6, spokes=14, frame_w=0.9, held=True,
              deck_len=2.0, low=False, low_R=0.62, bed_len=2.3, bed_w=1.2):
    """The sack cart drawn by a donkey team (S6, at 孙羊正店's east end, heading west): the 串车's barrow loaded high
    with big sacks lashed down with crossing ropes, its jointed draught pole running ahead to the team's swingletree;
    later ranks pull on the collars of the rank behind.
    Positions: as barrow_screen. choice: R 0.6, spokes 14, frame_w 0.9, held True, deck_len 2.0 (painted: a heap of
    big sacks crossed by ropes, men pushing at the rear).
    low True: a low two-wheeled cart instead of the barrow: a flat bed (top about 0.74 m) over an axle between two big
    spoked wheels (low_R 0.62), short shafts forward to the team, the sacks heaped on the bed (S6's sack cart: the
    barrow's raised deck put the heap on a 1.9 m stilt frame). choice: low_R 0.62, bed_len 2.3, bed_w 1.2; the bed's
    middle sits at the painted wheel."""
    z_of = _zf(z_of)
    rng = rng or random.Random(5480)
    t0 = _tri_count()
    if low:
        return _sack_cart_low(front, rear, wheels, team, z_of, rng, low_R, spokes, bed_len, bed_w, t0)
    M, origin, fwd, left, L, s_w, z_deck, hw = _barrow(front, rear, wheels, z_of, rng, R, spokes, frame_w, held, deck_len)
    yaw = math.atan2(fwd.y, fwd.x)
    sl, sw_, sh = 1.0, 0.56, 0.4
    heap = []
    for i in range(2):            # bottom layer: two rows of two, lengthwise
        for sgn in (1, -1):
            heap.append(((s_w + (i - 0.5) * (sl + 0.02), sgn * 0.27, z_deck), 0.0 if i else math.pi))
    for i in range(3):            # second layer: three across, bedded in the hollows
        heap.append(((s_w + (i - 1) * 0.5, 0.0, z_deck + sh * 0.72), math.pi / 2 * (1 if i % 2 else -1)))
    heap.append(((s_w - 0.1, 0.0, z_deck + sh * 1.45), 0.15))      # one on top, lengthwise
    for (x, y, z), a in heap:
        p = M @ V((x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), z))
        soft_sack(p, sl * rng.uniform(0.92, 1.04), sw_ * rng.uniform(0.95, 1.08), sh, yaw + a, rng)
    with k.placed(M):     # lashings hugging the heap, tied to the deck bearers
        for x in (s_w - 0.5, s_w + 0.5):
            pts = [V((x, hw + 0.03, z_deck - 0.03)), V((x, hw + 0.02, z_deck + sh * 0.7)), V((x, 0.38, z_deck + sh * 1.65)),
                   V((x, 0.0, z_deck + sh * 1.8)), V((x, -0.38, z_deck + sh * 1.65)), V((x, -hw - 0.02, z_deck + sh * 0.7)),
                   V((x, -hw - 0.03, z_deck - 0.03))]
            sb.tube("rope", False, pts, [0.018] * len(pts), segs=4)
        pts = [V((s_w - 1.02, 0.0, z_deck - 0.02)), V((s_w - 1.03, 0.0, z_deck + sh * 0.9)), V((s_w - 0.62, 0.0, z_deck + sh * 2.05)),
               V((s_w - 0.1, 0.0, z_deck + sh * 2.5)), V((s_w + 0.42, 0.0, z_deck + sh * 2.3)), V((s_w + 0.8, 0.0, z_deck + sh * 1.78)),
               V((s_w + 1.03, 0.0, z_deck + sh * 0.9)), V((s_w + 1.02, 0.0, z_deck - 0.02))]
        sb.tube("rope", False, pts, [0.018] * len(pts), segs=4)
    if team:
        _draught_pole(M, L, R, origin, fwd, left, team, z_of, mat="timber")
    return _tri_count() - t0


def _sack_cart_low(front, rear, wheels, team, z_of, rng, R, spokes, bed_len, bed_w, t0):
    """sack_cart(low=True): the sacks on a low two-wheeled bed, short shafts to the team (see sack_cart)."""
    origin, fwd, left, L = _axis(rear, front)
    s_w = _along(wheels[0], origin, fwd) if wheels else L * 0.45
    zg = z_of(*(origin + fwd * s_w).xy)
    M = _frame_m(origin, fwd, zg)
    bx0, bx1 = s_w - bed_len / 2, s_w + bed_len / 2
    hw = bed_w / 2
    z_bed = R + 0.12
    track = _two_wheel_bed(M, s_w, bx0, bx1, hw, R, z_bed, spokes, rng, left, track_extra=0.2)
    yaw = math.atan2(fwd.y, fwd.x)
    sl, sw_, sh = 0.95, 0.55, 0.4
    with k.placed(M):
        k.bx("hidden", True, (bx0 - 0.05, -track - 0.12, 0), (bx1 + 0.05, track + 0.12, z_bed + sh * 2.3))
        for y in (hw, -hw):   # low side rails on stakes, the sacks bulging over them
            for x in [bx0 + 0.1 + i * (bed_len - 0.2) / 3 for i in range(4)]:
                k.post("timber", False, x, y, z_bed - 0.1, z_bed + 0.22, 0.055, 0.01)
            k.beam("timber", False, (bx0 + 0.05, y, z_bed + 0.19), (bx1 - 0.05, y, z_bed + 0.19), 0.055, 0.055, 0.01)
    heap = []
    for i in range(2):            # bottom layer: two rows of two, lengthwise
        for sgn in (1, -1):
            heap.append(((s_w + (i - 0.5) * (sl + 0.02), sgn * 0.29, z_bed), 0.0 if i else math.pi))
    for i in range(3):            # second layer: three across, bedded in the hollows
        heap.append(((s_w + (i - 1) * 0.55, 0.0, z_bed + sh * 0.72), math.pi / 2 * (1 if i % 2 else -1)))
    heap.append(((s_w - 0.1, 0.0, z_bed + sh * 1.45), 0.15))      # one on top, lengthwise
    for (x, y, z), a in heap:
        p = M @ V((x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), z))
        soft_sack(p, sl * rng.uniform(0.92, 1.04), sw_ * rng.uniform(0.95, 1.08), sh, yaw + a, rng)
    with k.placed(M):     # lashings over the heap, tied to the rails
        for x in (s_w - 0.5, s_w + 0.5):
            pts = [V((x, hw + 0.02, z_bed + 0.19)), V((x, hw * 0.9, z_bed + sh * 0.8)), V((x, 0.36, z_bed + sh * 1.62)),
                   V((x, 0.0, z_bed + sh * 1.78)), V((x, -0.36, z_bed + sh * 1.62)), V((x, -hw * 0.9, z_bed + sh * 0.8)),
                   V((x, -hw - 0.02, z_bed + 0.19))]
            sb.tube("rope", False, pts, [0.018] * len(pts), segs=4)
    if team:
        animals = _team(team, z_of, "donkey")
        first = _ranks(animals, origin, fwd)[0]
        d0 = min(_along(an["root"], origin, fwd) - an["H"]["length"] * 0.5 for an in first)
        x_tip = max(bx1 + 0.8, min(bx1 + 1.8, d0 - 0.25))
    else:
        x_tip = min(bx1 + 1.6, L)
    tip = _shafts(M, bx0 + 0.25, x_tip, z_bed - 0.1, R + 0.3, hw - 0.04, left)
    if team:
        _harness(origin, fwd, left, tip, team, z_of, "donkey", "shafts")
    return _tri_count() - t0


# ---------------------------------------------------------------- two-wheeled carts and wagons

def _two_wheel_bed(M, s_w, bx0, bx1, hw, R, z_bed, spokes, rng, left, track_extra=0.25, sill=0.12):
    """A flat bed on two sills over an axle, wheels outside it (world). Returns the track half-width."""
    track = hw + track_extra
    with k.placed(M):
        for y in (hw - 0.05, -hw + 0.05):
            k.beam("timber", False, (bx0, y, z_bed - sill / 2), (bx1, y, z_bed - sill / 2), 0.11, sill, 0.02)
        n = max(3, round((bx1 - bx0) / 0.6))
        for i in range(n + 1):
            x = bx0 + 0.08 + i * (bx1 - bx0 - 0.16) / n
            k.beam("timber", False, (x, hw, z_bed - sill - 0.03), (x, -hw, z_bed - sill - 0.03), 0.08, 0.07, 0.012)
        nb = max(3, round(2 * hw / 0.22))
        for i in range(nb):
            ya = -hw + 0.02 + i * (2 * hw - 0.04) / nb
            yb = ya + (2 * hw - 0.04) / nb - 0.012
            plank_flat("timber", (bx0 + 0.03, (ya + yb) / 2), (bx1 - 0.03, (ya + yb) / 2), yb - ya, z_bed - 0.04, z_bed, rng)
        k.beam("timber", False, (s_w, track + 0.04, R), (s_w, -track - 0.04, R), 0.11, 0.11, 0.02)
        for y in (hw - 0.05, -hw + 0.05):
            k.bx("timber", False, (s_w - 0.13, y - 0.07, R + 0.04), (s_w + 0.13, y + 0.07, z_bed - sill))
    for sgn in (1, -1):
        spoked_wheel(M @ V((s_w, sgn * track, R)), left * sgn, R, spokes=spokes, phase=rng.uniform(0, 1))
    return track


def _shafts(M, x_from, x_tip, z_from, z_tip, half, left, crossbar=True):
    """Two shafts from the bed forward, converging a little, joined at their tips by a crossbar (where a man walks
    between them or the team's traces pull). Returns the crossbar centre (world)."""
    for sgn in (1, -1):
        pts = [M @ V((x_from, sgn * half, z_from)), M @ V(((x_from + x_tip) / 2, sgn * half * 0.95, (z_from + z_tip) / 2 + 0.03)),
               M @ V((x_tip, sgn * half * 0.85, z_tip))]
        _polybeam("timber", pts, 0.07, 0.08, 0.015)
    if crossbar:
        k.beam("timber", False, M @ V((x_tip - 0.06, half * 0.95, z_tip)), M @ V((x_tip - 0.06, -half * 0.95, z_tip)),
               0.06, 0.06, 0.012)
    return M @ V((x_tip, 0, z_tip))


def mule_wagon(front, rear, wheels=None, team=None, z_of=None, rng=None, R=0.82, spokes=18, box_len=2.9,
               box_w=1.5, box_h=0.72, shaft_len=2.3, load="sacks", wheel_at=0.5, driver_seat=True):
    """The four-mule wagon (太平车, S6's crossroads): a deep plank box with corner posts, rails and battened sides on
    a bed over two big spoked wheels, two long shafts forward joined by a crossbar, and the team ahead on rope
    traces (later ranks pull on the collars of the rank behind). load: 'sacks' (heaped sacks), 'covered' (a load
    under a dark cloth, as the far wagon), or None.
    Positions: as covered_ox_cart (the shafts end at `front` when there is no team, else just behind the first
    rank). choice: R 0.82, spokes 18, box_len 2.9, box_w 1.5, box_h 0.72, shaft_len 2.3 (beyond the box), wheel_at
    0.5. driver_seat True: a seat across the shafts just ahead of the box (top about 1.05 m) and a footboard slung
    between the shafts ahead of it; returns a Built with .seat and .feet."""
    z_of = _zf(z_of)
    rng = rng or random.Random(3500)
    t0 = _tri_count()
    origin, fwd, left, L = _axis(rear, front)
    s_w = _along(wheels[0], origin, fwd) if wheels else L * 0.35
    zg = z_of(*(origin + fwd * s_w).xy)
    M = _frame_m(origin, fwd, zg)
    bx0 = s_w - wheel_at * box_len
    bx1 = bx0 + box_len
    hw = box_w / 2
    z_bed = R + 0.2
    track = _two_wheel_bed(M, s_w, bx0, bx1, hw, R, z_bed, spokes, rng, left)
    with k.placed(M):
        zt = z_bed + box_h
        k.bx("hidden", True, (bx0 - 0.05, -track - 0.12, 0), (bx1 + 0.05, track + 0.12, zt + 0.5))
        for y in (hw, -hw):
            for x in (bx0, bx1):
                k.post("timber", False, x, y, z_bed - 0.05, zt + 0.06, 0.09, 0.015)
        sides = [((bx0, hw), (bx1, hw)), ((bx1, -hw), (bx0, -hw)), ((bx1, hw), (bx1, -hw)), ((bx0, -hw), (bx0, hw))]
        for (xa, ya), (xb, yb) in sides:
            nb = 4
            for i in range(nb):
                z0 = z_bed + i * box_h / nb
                plank("timber", (xa, ya), (xb, yb), 0.035, z0 + 0.008, z0 + box_h / nb - 0.008, rng)
            k.beam("timber", False, (xa, ya, zt), (xb, yb, zt), 0.07, 0.06, 0.012)
            L2 = math.hypot(xb - xa, yb - ya)
            for i in range(1, max(2, round(L2 / 0.7))):
                t = i / max(2, round(L2 / 0.7))
                x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
                o = V((yb - ya, -(xb - xa), 0)).normalized() * 0.03
                k.beam("timber", False, (x + o.x, y + o.y, z_bed), (x + o.x, y + o.y, zt), 0.05, 0.035, 0.008)
        if load == "sacks":     # the box full of sacks, the top layer heaped above its rails
            n = max(2, round((box_len - 0.2) / 0.95))
            for i in range(n):
                for j in (-1, 1):
                    x = bx0 + 0.1 + (i + 0.5) * (box_len - 0.2) / n
                    soft_sack((x + rng.uniform(-0.04, 0.04), j * hw * 0.48, zt - 0.3), (box_len - 0.2) / n * 0.97,
                              hw * 0.9, 0.42, rng.uniform(-0.08, 0.08) + (0 if (i + j) % 2 else math.pi), rng)
            for i in range(n - 1):
                x = bx0 + 0.1 + (i + 1) * (box_len - 0.2) / n
                soft_sack((x, rng.uniform(-0.05, 0.05), zt + 0.02), box_w * 0.82, 0.55, 0.4,
                          math.pi / 2 + rng.uniform(-0.15, 0.15), rng)
        elif load == "covered":     # a load heaped high under a dark cover, roped (the far wagon at the crossroads)
            soft_sack(((bx0 + bx1) / 2, 0, zt - 0.45), box_len * 0.98, box_w * 0.96, 1.25, 0.0, rng, mat="bark",
                      tie=False, nu=16, nv=9)
            zc = zt - 0.45 + 0.625
            for x in (bx0 + 0.55, (bx0 + bx1) / 2, bx1 - 0.55):
                sl = 2 * (x - (bx0 + bx1) / 2) / (box_len * 0.98)
                pr = (1 - abs(sl) ** 2.6) ** 0.5 + 0.03
                pts = [V((x, hw, zt))] + [V((x, hw * 0.96 * pr * math.cos(a), zc + 0.625 * pr * math.sin(a)))
                                          for a in [math.radians(d) for d in (15, 50, 90, 130, 165)]] + [V((x, -hw, zt))]
                sb.tube("rope", False, pts, [0.018] * len(pts), segs=4)
    z_tip = R + 0.32
    if team:
        animals = _team(team, z_of, "mule")
        first = _ranks(animals, origin, fwd)[0]
        d0 = min(_along(an["root"], origin, fwd) - an["H"]["length"] * 0.5 for an in first)
        x_tip = max(bx1 + 1.0, min(bx1 + shaft_len, d0 - 0.3))
    else:
        x_tip = min(bx1 + shaft_len, L)
    tip = _shafts(M, bx0 + 0.3, x_tip, z_bed - 0.12, z_tip, hw - 0.02, left)
    seat = feet = None
    if driver_seat:
        zs = lambda x: (z_bed - 0.12) + (z_tip - (z_bed - 0.12)) * (x - bx0 - 0.3) / max(0.1, x_tip - bx0 - 0.3)  # noqa: E731
        xs_, xf_ = bx1 + 0.28, bx1 + 0.68
        seat, feet = _driver_seat(M, fwd, xs_, zs(xs_) + 0.1, (hw - 0.02) * 0.97, xf_, max(0.45, zs(xs_) - 0.5), rng,
                                  [(xf_, sgn * (hw - 0.02) * 0.93, zs(xf_)) for sgn in (1, -1)])
    if team:
        _harness(origin, fwd, left, tip, team, z_of, "mule", "shafts")
    return Built(_tri_count() - t0, seat, feet)


def cask_cart(front, rear, wheels=None, team=None, z_of=None, rng=None, R=0.68, spokes=16, bed_len=2.2, bed_w=1.25,
              cask_r=0.46, cask_h=0.78, shaft_len=1.6, wheel_at=0.55, driver_seat=True):
    """The donkey cart with two wine casks (S6, ≈ 2700-3250): a flat bed with low side rails over two spoked wheels,
    two big hooped casks standing on it one behind the other (the rear one wrapped in a woven basket to half its
    height, as painted), lids with bungs, roped down; short shafts forward to a crossbar, and the donkeys (painted
    two abreast) on rope traces.
    Positions: as covered_ox_cart. choice: R 0.68, spokes 16, bed_len 2.2, bed_w 1.25, cask_r 0.46, cask_h 0.78
    (painted: two casks as wide as the wheel is tall), shaft_len 1.6, wheel_at 0.55. driver_seat True: a seat across
    the shafts just ahead of the bed (the painted driver sits at the front with a whip) and a footboard slung ahead;
    returns a Built with .seat and .feet."""
    z_of = _zf(z_of)
    rng = rng or random.Random(2900)
    t0 = _tri_count()
    origin, fwd, left, L = _axis(rear, front)
    s_w = _along(wheels[0], origin, fwd) if wheels else L * 0.4
    zg = z_of(*(origin + fwd * s_w).xy)
    M = _frame_m(origin, fwd, zg)
    bx0 = s_w - wheel_at * bed_len
    bx1 = bx0 + bed_len
    hw = bed_w / 2
    z_bed = R + 0.16
    track = _two_wheel_bed(M, s_w, bx0, bx1, hw, R, z_bed, spokes, rng, left, track_extra=0.22)
    with k.placed(M):
        k.bx("hidden", True, (bx0 - 0.05, -track - 0.12, 0), (bx1 + 0.05, track + 0.12, z_bed + cask_h + 0.1))
        for y in (hw, -hw):   # low side rails on stakes
            for x in [bx0 + 0.1 + i * (bed_len - 0.2) / 3 for i in range(4)]:
                k.post("timber", False, x, y, z_bed - 0.1, z_bed + 0.3, 0.06, 0.012)
            k.beam("timber", False, (bx0 + 0.05, y, z_bed + 0.27), (bx1 - 0.05, y, z_bed + 0.27), 0.06, 0.06, 0.012)
        for i, x in enumerate((bx0 + 0.55, bx1 - 0.58)):
            k.cask(x, 0, z_bed, cask_r, cask_h, rng)
            k.bx("timber", False, (x - 0.05, -0.05, z_bed + cask_h - 0.005), (x + 0.05, 0.05, z_bed + cask_h + 0.04))
            if i == 0:   # the woven basket round the rear cask's lower half
                _lathe_axis("reed", V((x, 0, z_bed)), V((0, 0, 1)), V((1, 0, 0)), V((0, 1, 0)),
                            [(cask_r * 0.9 + 0.03, 0.0), (cask_r + 0.035, cask_h * 0.3), (cask_r * 1.02 + 0.035, cask_h * 0.48)],
                            segs=12, caps=False)
            rr = cask_r * 1.02 + 0.02
            pts = [V((x, hw, z_bed + 0.27)), V((x, rr * 0.98, z_bed + cask_h * 0.62)), V((x, rr * 0.8, z_bed + cask_h * 0.94)),
                   V((x, rr * 0.45, z_bed + cask_h + 0.02)), V((x, -rr * 0.45, z_bed + cask_h + 0.02)),
                   V((x, -rr * 0.8, z_bed + cask_h * 0.94)), V((x, -rr * 0.98, z_bed + cask_h * 0.62)), V((x, -hw, z_bed + 0.27))]
            sb.tube("rope", False, pts, [0.015] * len(pts), segs=4)
    if team:
        animals = _team(team, z_of, "donkey")
        first = _ranks(animals, origin, fwd)[0]
        d0 = min(_along(an["root"], origin, fwd) - an["H"]["length"] * 0.5 for an in first)
        x_tip = max(bx1 + 0.8, min(bx1 + shaft_len, d0 - 0.25))
    else:
        x_tip = min(bx1 + shaft_len, L)
    tip = _shafts(M, bx0 + 0.25, x_tip, z_bed - 0.1, R + 0.25, hw - 0.04, left)
    seat = feet = None
    if driver_seat:
        z0s, z1s = z_bed - 0.1, R + 0.25
        zs = lambda x: z0s + (z1s - z0s) * (x - bx0 - 0.25) / max(0.1, x_tip - bx0 - 0.25)  # noqa: E731
        xs_, xf_ = bx1 + 0.24, min(x_tip - 0.15, bx1 + 0.62)
        seat, feet = _driver_seat(M, fwd, xs_, zs(xs_) + 0.1, (hw - 0.04) * 0.97, xf_, max(0.4, zs(xs_) - 0.48), rng,
                                  [(xf_, sgn * (hw - 0.04) * 0.92, zs(xf_)) for sgn in (1, -1)])
    if team:
        _harness(origin, fwd, left, tip, team, z_of, "donkey", "shafts")
    return Built(_tri_count() - t0, seat, feet)


def open_cart(front, rear, wheels=None, team=None, z_of=None, rng=None, load="mat_bundle", prop_stick=True, R=0.68,
              spokes=16, bed_len=2.4, bed_w=1.25, rails_past=0.4, wheel_at=0.6):
    """The big open two-wheeled cart being loaded on S2's bank street (S2.veh.mule_cart_24305): a long open bed on two
    sills over two big spoked wheels, low slatted racks along its sides whose top rails run on past the rear with the
    sills (as painted, to u 24518), a front cross beam with two iron eyes; no shafts: its team of mules pulls on long
    rope traces from those eyes to their collars (later ranks on the collars of the rank behind them). load
    "mat_bundle": a big flat bundle under a woven mat, tilted up at the front over a dark heap of straw, roped (None:
    an empty bed); prop_stick True: a stick propping the bed's rear on the ground.
    Positions: as covered_ox_cart (front/rear set the axis; wheels[0] places the axle along it; team as the module
    doc). choice: R 0.68 (painted wheel 73 px, a man's chest height), spokes 16, bed_len 2.4, bed_w 1.25, the bed's top
    R + 0.23 = 0.91 m (S2's support `cart bed`), rails_past 0.4, wheel_at 0.6 (the axle 0.6 of the bed from its rear:
    painted hub at 0.68). Returns a Built whose `.bed` is where the painted loader stands: the top of the bed's free
    front, 0.28 m in from its front edge (the walker collider's top is the bed there, so people.js grounds him on it);
    `.seat`/`.feet` None (no driver's seat is painted)."""
    z_of = _zf(z_of)
    rng = rng or random.Random(24305)
    t0 = _tri_count()
    origin, fwd, left, L = _axis(rear, front)
    s_w = _along(wheels[0], origin, fwd) if wheels else L * 0.45
    zg = z_of(*(origin + fwd * s_w).xy)
    M = _frame_m(origin, fwd, zg)
    bx0 = s_w - wheel_at * bed_len
    bx1 = bx0 + bed_len
    hw = bed_w / 2
    z_bed = R + 0.23
    track = _two_wheel_bed(M, s_w, bx0, bx1, hw, R, z_bed, spokes, rng, left, track_extra=0.22)
    with k.placed(M):
        # colliders: the bed (its top is the bed's, where the loader stands) and the load over the bed's after part
        k.bx("hidden", True, (bx0 - 0.05, -track - 0.12, 0), (bx1 + 0.05, track + 0.12, z_bed))
        if load:
            k.bx("hidden", True, (bx0 - 0.05, -hw - 0.05, z_bed), (bx1 - 0.6, hw + 0.05, z_bed + 1.0))
        # the sills run on past the rear, iron-shod
        for y in (hw - 0.05, -hw + 0.05):
            k.beam("timber", False, (bx0 - rails_past, y, z_bed - 0.06), (bx0 + 0.02, y, z_bed - 0.06), 0.1, 0.11, 0.015)
            k.beam("lattice", False, (bx0 - rails_past - 0.015, y, z_bed - 0.06), (bx0 - rails_past + 0.09, y, z_bed - 0.06),
                   0.115, 0.125, 0.015)
        # low racks along both sides: stakes, a top rail running on past the rear with the sills, slats between
        n = max(3, round(bed_len / 0.55))
        for y in (hw, -hw):
            for i in range(n + 1):
                x = bx0 + 0.06 + i * (bed_len - 0.12) / n
                k.post("timber", False, x, y, z_bed - 0.1, z_bed + 0.3, 0.05, 0.01)
            k.beam("timber", False, (bx0 - rails_past, y, z_bed + 0.27), (bx1 + 0.04, y, z_bed + 0.27), 0.055, 0.055, 0.01)
            k.beam("timber", False, (bx0 - rails_past + 0.06, y, z_bed - 0.05), (bx0 - rails_past + 0.06, y, z_bed + 0.25),
                   0.045, 0.045, 0)
            for i in range(n):
                x0_ = bx0 + 0.06 + i * (bed_len - 0.12) / n
                for f in (0.33, 0.66):
                    x = x0_ + (bed_len - 0.12) / n * f
                    _flat_bar("timber", (x, y, z_bed + 0.01), (x, y, z_bed + 0.25), 0.035, 0.012, (0, 1 if y > 0 else -1, 0))
        # the front: a cross beam carrying the traces' two iron eyes, a low front rail
        k.beam("timber", False, (bx1 + 0.03, hw + 0.06, z_bed - 0.08), (bx1 + 0.03, -hw - 0.06, z_bed - 0.08), 0.1, 0.12, 0.015)
        k.beam("timber", False, (bx1 - 0.02, hw, z_bed + 0.17), (bx1 - 0.02, -hw, z_bed + 0.17), 0.045, 0.045, 0.008)
        for y in (0.32, -0.32):
            _lathe_axis("lattice", V((bx1 + 0.1, y, z_bed - 0.08)), V((0, 0, 1)), V((1, 0, 0)), V((0, 1, 0)),
                        [(0.045, -0.015), (0.045, 0.015)], segs=6, caps=False)
        if load == "mat_bundle":
            # the dark heap of straw, highest under the bundle's raised front
            for x, y, r, fl in ((bx0 + 0.35, 0.36, 0.3, 0.7), (bx0 + 0.42, -0.34, 0.31, 0.7), (bx0 + 0.95, 0.4, 0.34, 0.8),
                                (bx0 + 1.0, -0.38, 0.34, 0.8), (bx1 - 1.05, 0.3, 0.42, 1.0), (bx1 - 0.98, -0.28, 0.44, 1.0),
                                (bx1 - 0.82, 0.02, 0.4, 1.0)):
                k.rock("bark", x + rng.uniform(-0.04, 0.04), y + rng.uniform(-0.03, 0.03), z_bed + 0.02, r, rng, flat=fl)
            # the bundle under its woven mat, tilted up toward the front, two rope bands and a rope down to the front
            pa, pb = V((bx0 + 0.14, rng.uniform(-0.03, 0.03), z_bed + 0.22)), V((bx1 - 0.62, 0.0, z_bed + 0.8))
            _obeam("reed", pa, pb, 1.12, 0.3, 0.1)
            dd = (pb - pa).normalized()
            for f in (0.24, 0.72):
                q = pa.lerp(pb, f)
                _obeam("rope", q - dd * 0.03, q + dd * 0.03, 1.14, 0.32, 0.105, caps=False)
            top = pb + V((0, 0, 0.15))
            sb.tube("rope", False, [pa + V((0, 0, 0.155)), pa.lerp(pb, 0.5) + V((0, 0, 0.16)), top,
                                    V((bx1 - 0.05, 0.0, z_bed + 0.19))], [0.016] * 4, segs=4)
        elif load:
            raise ValueError(f"open_cart: load {load!r} (mat_bundle | None)")
        if prop_stick:   # the stick propping the bed's rear, its foot on the ground behind it
            sb.cyl("timber", False, (bx0 + 0.12, -0.12, z_bed - 0.14), (bx0 - 0.28, -0.18, 0.0), 0.035, 0.03, segs=6)
    bed = M @ V((bx1 - 0.28, 0, z_bed))
    if team:
        animals = _team(team, z_of, "mule")
        ranks = _ranks(animals, origin, fwd)
        fc = M @ V((bx1 + 0.1, 0, z_bed - 0.08))

        def anchors(an):     # each animal's two traces to the eyes nearer it on the front beam
            d = max(-0.32, min(0.32, (an["root"] - fc).dot(left)))
            p = fc + left * d
            return p + left * 0.06, p - left * 0.06
        _traces(ranks, anchors, sag=0.025)
    return Built(_tri_count() - t0, bed=(round(bed.x, 3), round(bed.y, 3), round(bed.z, 3)))


# ---------------------------------------------------------------- the sedan chair

def _lattice(p0, p1, z0, z1, out, nx=4, nz=3, frame="lattice", bar="lattice", back="interior"):
    """A small lattice window in a wall plane (local frame): from plan point p0 to p1 between z0 and z1, standing
    `out` metres proud of the wall towards its outside (the right of p0->p1); a thin frame, a grid of thin bars,
    and a dark backing set into the wall."""
    p0, p1 = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (p1 - p0).normalized()
    n = V((t.y, -t.x, 0))
    o = n * out
    L = (p1 - p0).length
    for a, b in ((p0 + UP * z0, p1 + UP * z0), (p0 + UP * z1, p1 + UP * z1), (p0 + UP * z0, p0 + UP * z1),
                 (p1 + UP * z0, p1 + UP * z1)):
        k.beam(frame, False, a + o, b + o, 0.035, 0.035, 0)
    for i in range(1, nx):
        q = p0 + t * (L * i / nx) + o * 0.6
        k.beam(bar, False, q + UP * z0, q + UP * z1, 0.016, 0.016, 0)
    for j in range(1, nz):
        z = z0 + (z1 - z0) * j / nz
        k.beam(bar, False, p0 + o * 0.6 + UP * z, p1 + o * 0.6 + UP * z, 0.016, 0.016, 0)
    a, b = p0 - n * 0.005, p1 - n * 0.005
    q = [a + UP * z0, b + UP * z0, b + UP * z1, a + UP * z1]
    if (q[1] - q[0]).cross(q[3] - q[0]).dot(n) < 0:
        q = q[::-1]
    sb.quad(back, False, *q)


def sedan_chair(front, rear, z_of=None, rng=None, carried=True, w=0.78, d=0.92, body_h=1.42, pole_h=1.3,
                roof_rise=0.24, curtain="cloth_indigo", panel=None, cabin_at=0.5, front_style="curtain",
                roof="concave", finial=True):
    """A sedan chair (轿, two stand at 孙羊正店's door): a tall cabin framed in dark timber, its walls divided into
    boarded panels, a lattice window high in each side, a door curtain hanging in folds in front, under a small roof
    of four concave slopes with upswept corners and a finial; two long poles run along its sides through iron-bound
    brackets, from `rear` to `front` (the ground under the pole ends, where the bearers stand).
    choice: carried True (the poles on the bearers' shoulders at pole_h 1.3; False: set down on four short feet,
    poles at mid-cabin); w 0.78, d 0.92, body_h 1.42 (painted cabins stand taller than their bearers' shoulders and
    about twice as tall as wide); roof_rise 0.24; curtain colour; cabin_at 0.5: where the cabin's centre sits along
    the poles, as a fraction from `rear` (0) to `front` (1), so a cabin painted off-centre on its poles sits there.
    Styles (round 2; catalogue §3: the catalogue calls the first `front`, but `front` is the poles' front point, so the
    style is `front_style`):
    - front_style "curtain" (the door curtain, as above) | "closed": the front boarded to the top like the back, a door
      leaf framed in it and a small lattice window high in it, no curtain (S3.veh.sedan_18842: "a tall dark box ... a
      lattice window in its front"; S1.veh.sedan_willow_30805: "a tall, closed, dark box");
    - roof "concave" (the four concave slopes above) | "round": a barrel vault across the cabin (its arch shows on the
      sides, as S3 paints the box's rounded top), boarded, with three arched ribs, its eaves overhanging front and
      back, arched boards closing the sides under it; the crown roof_rise x 1.5 over the eave (choice: 0.36);
    - finial True: the turned finial on the concave roof's peak, a small knob on the round roof's crown; False: none
      (S1's "low roof and a knob finial": roof "concave", a lower roof_rise, finial True).
    panel: the wall boards' material, default "deck" (pale boards) with the curtain, "timber" (a dark box, as both
    closed sedans are painted) when closed."""
    z_of = _zf(z_of)
    rng = rng or random.Random(4500)
    t0 = _tri_count()
    panel = panel or ("deck" if front_style != "closed" else "timber")
    origin, fwd, left, L = _axis(rear, front)
    mid = L * min(0.9, max(0.1, cabin_at))
    zg = z_of(*(origin + fwd * mid).xy)
    M = _frame_m(origin, fwd, zg)
    pole_mid = 0.6      # poles pass the cabin this far up its side
    z_f = (pole_h - pole_mid) if carried else 0.14
    z_p = z_f + pole_mid
    hx, hy = d / 2, w / 2
    zt = z_f + body_h
    zw0, zw1 = z_f + 0.66, zt - 0.3          # the window band
    rise_r = roof_rise * 1.5                  # the round roof's crown over its eave
    with k.placed(M):
        x0, x1 = mid - hx, mid + hx
        k.bx("hidden", True, (x0 - 0.05, -hy - 0.12, 0),
             (x1 + 0.05, hy + 0.12, zt + (0.3 if roof != "round" else max(0.3, rise_r + 0.08))))
        if not carried:
            for x in (x0 + 0.06, x1 - 0.06):
                for y in (hy - 0.06, -hy + 0.06):
                    k.post("lattice", False, x, y, 0, z_f, 0.06, 0)
        # the frame: corner posts, sill, rails at the window band and the top
        for x in (x0, x1):
            for y in (hy, -hy):
                k.post("lattice", False, x, y, z_f, zt, 0.06, 0.01)
        sides = (((x0, hy), (x1, hy)), ((x1, -hy), (x0, -hy)), ((x1, hy), (x1, -hy)), ((x0, -hy), (x0, hy)))
        for z, hh in ((z_f + 0.03, 0.07), (zw0 - 0.03, 0.045), (zw1 + 0.02, 0.04), (zt - 0.035, 0.07)):
            for (xa, ya), (xb, yb) in sides:
                k.beam("lattice", False, (xa, ya, z), (xb, yb, z), 0.055, hh, 0.01)
        k.board("timber", False, (x0, 0), (x1, 0), w - 0.02, z_f - 0.02, z_f + 0.04)
        k.board("timber", False, (x0, 0), (x1, 0), w - 0.02, zt - 0.03, zt + 0.01)     # the ceiling under the roof
        # boarded panels: the lower walls all round (a stile in the middle of the long sides), the frieze over the
        # windows, the back to the top
        for (xa, ya), (xb, yb) in sides:
            k.board(panel, False, (xa, ya), (xb, yb), 0.022, z_f + 0.06, zw0 - 0.05)
        for (xa, ya), (xb, yb) in sides[:2]:
            k.board(panel, False, (xa, ya), (xb, yb), 0.022, zw1 + 0.04, zt - 0.06)
            xm = (xa + xb) / 2
            k.beam("lattice", False, (xm, ya, z_f + 0.06), (xm, ya, zw0 - 0.05), 0.04, 0.04, 0)
        k.board(panel, False, (x0, -hy), (x0, hy), 0.022, zw0 - 0.05, zt - 0.06)
        # lattice windows high in both sides, a small one in the back
        _lattice((x1 - 0.06, hy + 0.012), (x0 + 0.06, hy + 0.012), zw0, zw1, 0.015, nx=5, nz=3)
        _lattice((x0 + 0.06, -hy - 0.012), (x1 - 0.06, -hy - 0.012), zw0, zw1, 0.015, nx=5, nz=3)
        if front_style == "closed":
            # the front boarded round a small lattice window high in its middle; a door leaf framed below the window
            wy = min(0.2, hy - 0.12)
            for ya, yb in ((-hy, -wy), (wy, hy)):
                k.board(panel, False, (x1, ya), (x1, yb), 0.022, zw0 - 0.05, zt - 0.06)
            k.board(panel, False, (x1, -wy), (x1, wy), 0.022, zw1 + 0.04, zt - 0.06)
            k.board(panel, False, (x1, -wy), (x1, wy), 0.022, zw0 - 0.05, zw0 + 0.05)
            _lattice((x1 + 0.02, -wy), (x1 + 0.02, wy), zw0 + 0.05, zw1, 0.015, nx=4, nz=3)
            for yy in (-wy, wy):         # the door leaf's stiles, its rail under the window
                k.beam("lattice", False, (x1 + 0.016, yy, z_f + 0.07), (x1 + 0.016, yy, zw0 - 0.04), 0.035, 0.03, 0)
            k.beam("lattice", False, (x1 + 0.016, -wy, (z_f + zw0) / 2), (x1 + 0.016, wy, (z_f + zw0) / 2), 0.03, 0.03, 0)
        else:
            # door: the curtain hanging in folds from the top rail
            nf = 4
            for i in range(nf):
                ya = -hy + 0.05 + i * (w - 0.1) / nf
                yb = ya + (w - 0.1) / nf
                xa = x1 + 0.012 + (0.025 if i % 2 else 0.0)
                xb = x1 + 0.012 + (0.0 if i % 2 else 0.025)
                _quad2(curtain, V((xa, ya, zw0 - 0.02)), V((xb, yb, zw0 - 0.02)), V((xb, yb, zt - 0.07)), V((xa, ya, zt - 0.07)))
        if roof == "round":
            _round_roof(x0, x1, hy, zt, rise_r, panel, finial)
        else:
            # the roof: four concave slopes to a point, the corners swept up, a finial on top
            o = 0.13
            rx0, rx1, ry0, ry1 = x0 - o, x1 + o, -hy - o, hy + o
            ap = (mid, 0.0)
            z_e = zt + 0.03

            def height(s, t):
                return z_e + roof_rise * (t ** 1.6) + 0.12 * (abs(2 * s - 1) ** 3) * (1 - t) ** 2
            corners = [(rx0, ry0), (rx1, ry0), (rx1, ry1), (rx0, ry1)]
            slopes = [(corners[i], corners[(i + 1) % 4], ap, ap, 4) for i in range(4)]
            k._roof_surface(slopes, height, 0.045, 3, mat="lattice", under="timber", rafters=False)
            zr = z_e + roof_rise
            if finial:
                _lathe_axis("timber", V((mid, 0, zr - 0.03)), V((0, 0, 1)), V((1, 0, 0)), V((0, 1, 0)),
                            [(0.05, 0.0), (0.065, 0.05), (0.03, 0.11), (0.045, 0.15), (0.0, 0.24)], segs=8)
        # poles and their brackets
        for sgn in (1, -1):
            y = sgn * (hy + 0.075)
            sb.cyl("timber", False, (0.0, y, z_p), (L, y, z_p), 0.038, 0.034, segs=6)
            for x in (x0 + 0.16, x1 - 0.16):
                k.bx("lattice", False, (x - 0.055, min(sgn * hy, y + sgn * 0.05), z_p - 0.075),
                     (x + 0.055, max(sgn * hy, y + sgn * 0.05), z_p - 0.04))
                k.beam("lattice", False, (x, y, z_p - 0.05), (x, y, z_p + 0.05), 0.07, 0.1, 0.01)
    return _tri_count() - t0


def _round_roof(x0, x1, hy, zt, rise, panel, finial, o=0.13, thick=0.045, na=8):
    """sedan_chair(roof="round"), local frame: a boarded barrel vault across the cabin (its axis along y), eaves at
    x0 - o and x1 + o just over the top rail, the crown `rise` higher; its shell has thickness (top, underside, the
    arched rims at both sides, the eave edges), three arched ribs on top (the board joints' ink), the walls under it
    closed: an arched board over each side wall, a strip over the front and back walls; a knob on the crown."""
    mid = (x0 + x1) / 2
    xa, xb = x0 - o, x1 + o
    z_e = zt + 0.03
    half = (xb - xa) / 2

    def zv(x):
        u = (x - mid) / half
        return z_e + rise * max(0.0, 1 - u * u)
    xs = [xa + (xb - xa) * i / na for i in range(na + 1)]
    ya, yb = -hy - o, hy + o
    top = [[V((x, y, zv(x))) for x in xs] for y in (ya, yb)]
    und = [[V((p.x, p.y, p.z - thick)) for p in row] for row in top]
    for rows, mat, sgn in ((top, "lattice", 1), (und, "timber", -1)):
        verts = rows[0] + rows[1]
        n = len(xs)
        faces = [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]
        ins = [V(((xs[i] + xs[i + 1]) / 2, 0, zv((xs[i] + xs[i + 1]) / 2) - sgn * 0.5)) for i in range(n - 1)]
        k.add(mat, False, verts, _orient(verts, faces, ins))
    for j, y in ((0, ya), (1, yb)):            # the arched rims at the sides
        for i in range(len(xs) - 1):
            q = [top[j][i], top[j][i + 1], und[j][i + 1], und[j][i]]
            k.add("lattice", False, q, _orient(q, [(0, 1, 2, 3)], [V(((xs[i] + xs[i + 1]) / 2, 0, q[0].z - thick / 2))]))
    for i in (0, len(xs) - 1):                 # the eave edges
        q = [top[0][i], top[1][i], und[1][i], und[0][i]]
        k.add("lattice", False, q, _orient(q, [(0, 1, 2, 3)], [V((mid, 0, q[0].z - thick / 2))]))
    for y in (ya + 0.06, 0.0, yb - 0.06):      # arched ribs over the board joints
        pts = [V((x, y, zv(x))) for x in xs]
        nrms = [V((-(zv(x + 0.01) - zv(x - 0.01)) / 0.02, 0, 1)).normalized() for x in xs]
        _sweep_rect("lattice", pts, nrms, V((0, 1, 0)), -0.005, 0.03, -0.025, 0.025, sides=(0, 1, 2))
    # the walls closed under the vault: an arched board over each side wall, a strip over the front and back
    for y in (hy, -hy):
        prof = [V((x, y, zv(x) - thick)) for x in [x0 + (x1 - x0) * i / na for i in range(na + 1)]]
        cen = V((mid, y, zt - 0.02))
        tris = [[cen, p, q] for p, q in zip(prof, prof[1:])]
        tris += [[cen, V((x1, y, zt - 0.02)), prof[-1]], [cen, prof[0], V((x0, y, zt - 0.02))]]
        for tri in tris:
            if ((tri[1] - tri[0]).cross(tri[2] - tri[0])).y * y < 0:
                tri = tri[::-1]
            k.add(panel, False, tri, [(0, 1, 2)])
    for x, sgn in ((x0, -1), (x1, 1)):
        zu = zv(x) - thick
        if zu > zt + 0.01:
            k.board(panel, False, (x, -hy), (x, hy), 0.022, zt - 0.04, zu + 0.01)
    if finial:
        zc = zv(mid)
        _lathe_axis("timber", V((mid, 0, zc - 0.02)), V((0, 0, 1)), V((1, 0, 0)), V((0, 1, 0)),
                    [(0.045, 0.0), (0.055, 0.035), (0.03, 0.075), (0.0, 0.1)], segs=8)


# ---------------------------------------------------------------- review (headless)

TYPES = {
    # name: (call, team stand-ins) -- S5 types at their layout positions; S4/S6 types at sample positions
    "covered_ox_cart": lambda: covered_ox_cart(front=(18.93, 2.93), rear=(12.94, 3.12), wheels=[(15.72, 2.79)]),
    "covered_ox_cart_team": lambda: covered_ox_cart(
        front=(18.93, 2.93), rear=(12.94, 3.12), wheels=[(15.72, 2.79)],
        team=[(19.4, 3.55, 0, "ox"), (19.4, 2.45, 0, "ox"), (22.2, 3.0, 0, "ox")]),
    "barrow_screen": lambda: barrow_screen(front=(1.07, 5.60), rear=(-3.24, 5.83), wheels=[(-0.38, 5.64)],
                                           team=[(4.43, 5.58, 0, "donkey")]),
    "sack_cart": lambda: sack_cart(front=(-2.0, 0.0), rear=(2.2, 0.0), wheels=[(0.1, 0.0)],
                                   team=[(-4.6, 0.3, 180, "donkey"), (-4.6, -0.5, 180, "donkey"), (-6.8, -0.1, 180, "donkey")]),
    "mule_wagon": lambda: mule_wagon(front=(4.0, 0.0), rear=(0.0, 0.0), wheels=[(1.5, -0.95)],
                                     team=[(6.6, 0.55, 0, "mule"), (6.6, -0.55, 0, "mule"), (9.0, 0.55, 0, "mule"),
                                           (9.0, -0.55, 0, "mule")]),
    "mule_wagon_covered": lambda: mule_wagon(front=(4.0, 0.0), rear=(0.0, 0.0), wheels=[(1.5, -0.95)], load="covered"),
    "cask_cart": lambda: cask_cart(front=(3.4, 0.0), rear=(0.0, 0.0), wheels=[(1.2, -0.8)],
                                   team=[(5.0, 0.42, 0, "donkey"), (5.0, -0.42, 0, "donkey")]),
    "sedan_chair": lambda: sedan_chair(front=(1.4, 0.0), rear=(-1.4, 0.0)),
    "sedan_chair_down": lambda: sedan_chair(front=(1.4, 0.0), rear=(-1.4, 0.0), carried=False),
    "sack_cart_low": lambda: sack_cart(front=(-2.0, 0.0), rear=(2.2, 0.0), wheels=[(0.1, 0.0)], low=True,
                                       team=[(-4.2, 0.3, 180, "donkey"), (-4.2, -0.5, 180, "donkey"), (-6.4, -0.1, 180, "donkey")]),
    "sedan_chair_offset": lambda: sedan_chair(front=(2.0, 0.0), rear=(-2.0, 0.0), cabin_at=0.3),
    # round 2 (catalogue §3, order (c1)): sample positions at the painted lengths
    "barrow_load_hoops": lambda: barrow_load(front=(-1.17, 0.0), rear=(1.17, 0.0), wheels=[(-0.17, 0.0)], load="hoops"),
    "barrow_load_crates": lambda: barrow_load(front=(1.0, 0.0), rear=(-1.0, 0.0), wheels=[(0.15, 0.0)], load="crates"),
    "sedan_closed_round": lambda: sedan_chair(front=(1.14, 0.0), rear=(-1.14, 0.0), front_style="closed", roof="round"),
    "sedan_closed_low": lambda: sedan_chair(front=(1.9, 0.0), rear=(-1.9, 0.0), front_style="closed", roof_rise=0.14),
    "barrow_screen_extras": lambda: barrow_screen(front=(2.27, 0.0), rear=(-2.27, 0.0), wheels=[(0.58, 0.0)], held=False,
                                                  stakes=True, poles=True, panel=True),
    "open_cart": lambda: open_cart(front=(1.0, 0.0), rear=(-1.4, 0.0), wheels=[(0.0, -0.8)],
                                   team=[(3.75, 0.5, 0, "mule"), (3.55, -0.75, -25, "mule")]),
}
TEAMS = {
    "covered_ox_cart_team": [(19.4, 3.55, 0, "ox"), (19.4, 2.45, 0, "ox"), (22.2, 3.0, 0, "ox")],
    "barrow_screen": [(4.43, 5.58, 0, "donkey")],
    "sack_cart": [(-4.6, 0.3, 180, "donkey"), (-4.6, -0.5, 180, "donkey"), (-6.8, -0.1, 180, "donkey")],
    "mule_wagon": [(6.6, 0.55, 0, "mule"), (6.6, -0.55, 0, "mule"), (9.0, 0.55, 0, "mule"), (9.0, -0.55, 0, "mule")],
    "cask_cart": [(5.0, 0.42, 0, "donkey"), (5.0, -0.42, 0, "donkey")],
    "sack_cart_low": [(-4.2, 0.3, 180, "donkey"), (-4.2, -0.5, 180, "donkey"), (-6.4, -0.1, 180, "donkey")],
    "open_cart": [(3.75, 0.5, 0, "mule"), (3.55, -0.75, -25, "mule")],
}


ANIMAL_GLB = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\animals\{kind}\{kind}_raw.glb"


def _animal(bpy, coll, X, D, facing, kind):
    """Review only: the rigged animal model (tools/animal.mjs) at a team spot in its rest pose, wearing its collar if
    it has one, so the harness can be judged against the real neck and chest. False when the model isn't built."""
    path = ANIMAL_GLB.format(kind=kind)
    if not os.path.exists(path):
        return False
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)
        base = o.name.split(".")[0]
        if base.startswith("tack_") and base not in ("tack_collar", "tack_draught"):
            o.hide_render = True
        if o.type == "EMPTY" or base == "Icosphere":
            o.hide_render = True
        if o.type == "ARMATURE":
            if o.animation_data:
                o.animation_data.action = None
            for pb in o.pose.bones:
                pb.matrix_basis.identity()
        o.name = "standin_" + o.name
    for o in new:
        if o.parent is None:
            o.location = (X, D, 0)
            o.rotation_mode = "QUATERNION"      # the importer's mode; the model faces -Y, so turn it to `facing`
            o.rotation_quaternion = Quaternion((0, 0, 1), math.radians(facing + 90)) @ o.rotation_quaternion
    return True


def _stand_in(bpy, coll, X, D, facing, kind):
    """Review only: the real animal model at a team spot if it is built, else a grey block animal sized from
    HARNESS, so the harness's reach can be judged."""
    if _animal(bpy, coll, X, D, facing, kind):
        return
    H = HARNESS[kind]
    f = V((math.cos(math.radians(facing)), math.sin(math.radians(facing)), 0))
    s = V((-f.y, f.x, 0))
    root = V((X, D, 0))
    Lb, wh, hw = H["length"], H["withers_h"], H["half_w"] + 0.03
    verts, faces = [], []

    def box(c, hx, hy, z0, z1):
        b = len(verts)
        for dz in (z0, z1):
            for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                verts.append(c + f * (sx * hx) + s * (sy * hy) + UP * dz)
        faces.extend([(b, b + 3, b + 2, b + 1), (b + 4, b + 5, b + 6, b + 7), (b, b + 1, b + 5, b + 4),
                      (b + 1, b + 2, b + 6, b + 5), (b + 2, b + 3, b + 7, b + 6), (b + 3, b, b + 4, b + 7)])
    box(root, Lb * 0.38, hw, wh * 0.58, wh)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(root + f * (sx * Lb * 0.3) + s * (sy * hw * 0.6), 0.05, 0.05, 0.0, wh * 0.6)
    neck = root + f * (H["collar_fwd"] + 0.05)
    box(neck, 0.13, hw * 0.6, H["collar_h"] - 0.2, H["collar_h"] + 0.12)
    box(root + f * (H["collar_fwd"] + 0.32), 0.18, hw * 0.45, H["collar_h"] - 0.15, H["collar_h"] + 0.1)
    me = bpy.data.meshes.new(f"standin_{kind}")
    me.from_pydata([tuple(v) for v in verts], [], faces)
    mat = bpy.data.materials.get("standin") or bpy.data.materials.new("standin")
    mat.diffuse_color = (0.55, 0.55, 0.58, 1)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (0.42, 0.42, 0.45, 1)
    me.materials.append(mat)
    ob = bpy.data.objects.new(f"standin_{kind}", me)
    coll.objects.link(ob)


def _bake(bpy, coll, prefix):
    """Bake the bucket set into one mesh per bucket in `coll` (as gate_scene.build does)."""
    tris = 0
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
        mat = sb.make_material(mat_name)
        mat.use_backface_culling = True     # flipped faces show as holes in the review renders
        me.materials.append(mat)
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new(name, me)
        ob.hide_render = mat_name.endswith("hidden")
        coll.objects.link(ob)
        tris += sum(len(p.vertices) - 2 for p in me.polygons)
    return tris


def review(out_dir, only=None):
    import bpy
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.view_settings.view_transform = "Standard"
    scene.render.film_transparent = False
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.78, 0.8, 0.84, 1)
    bg.inputs["Strength"].default_value = 0.9
    for o in list(scene.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.2
    sun.data.angle = math.radians(3)
    sun.rotation_euler = (math.radians(48), math.radians(12), math.radians(-35))
    scene.collection.objects.link(sun)
    gme = bpy.data.meshes.new("ground")
    gme.from_pydata([(-80, -80, 0), (80, -80, 0), (80, 80, 0), (-80, 80, 0)], [], [(0, 1, 2, 3)])
    gmat = bpy.data.materials.new("review_ground")
    gmat.use_nodes = True
    next(n for n in gmat.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (0.55, 0.47, 0.36, 1)
    gme.materials.append(gmat)
    scene.collection.objects.link(bpy.data.objects.new("ground", gme))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 40
    scene.collection.objects.link(cam)
    scene.camera = cam
    results = {}
    names = [n for n in TYPES if not only or n in only]
    colls = {}
    for name in names:
        sb.B = sb.Buckets()
        n_tris = TYPES[name]()
        coll = bpy.data.collections.new(name)
        scene.collection.children.link(coll)
        baked = _bake(bpy, coll, name)
        for t in TEAMS.get(name, []):
            _stand_in(bpy, coll, *t)
        if getattr(n_tris, "seat", None):   # review only: a red marker on the seat, a blue one on the footboard
            for p, col in ((n_tris.seat[:3], (0.85, 0.1, 0.1, 1)), (n_tris.feet, (0.1, 0.25, 0.85, 1))):
                me = bpy.data.meshes.new("seatmark")
                r_ = 0.06
                me.from_pydata([(p[0] + dx * r_, p[1] + dy * r_, p[2] + dz * r_) for dx, dy, dz in
                                ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))], [],
                               [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)])
                m_ = bpy.data.materials.new("seatmark")
                m_.use_nodes = True
                next(nd for nd in m_.node_tree.nodes if nd.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = col
                me.materials.append(m_)
                ob_ = bpy.data.objects.new("standin_seat", me)
                coll.objects.link(ob_)
            print(f"SEAT {name}: seat {n_tris.seat} feet {n_tris.feet}", flush=True)
        if getattr(n_tris, "bed", None):    # review only: a red marker where the loader stands
            p = n_tris.bed
            me = bpy.data.meshes.new("bedmark")
            r_ = 0.06
            me.from_pydata([(p[0] + dx * r_, p[1] + dy * r_, p[2] + dz * r_) for dx, dy, dz in
                            ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))], [],
                           [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)])
            m_ = bpy.data.materials.new("bedmark")
            m_.use_nodes = True
            next(nd for nd in m_.node_tree.nodes if nd.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (0.85, 0.1, 0.1, 1)
            me.materials.append(m_)
            coll.objects.link(bpy.data.objects.new("standin_bed", me))
            print(f"BED {name}: {n_tris.bed}", flush=True)
        colls[name] = coll
        results[name] = (n_tris, baked)
        print(f"VEHICLE {name}: {n_tris} triangles (baked {baked})", flush=True)
    for name in names:
        for nn, c in colls.items():
            c.hide_render = nn != name
        objs = [o for o in colls[name].objects if not o.hide_render]
        lo = V((min(min((o.matrix_world @ V(b))[i] for b in o.bound_box) for o in objs) for i in range(3)))
        hi = V((max(max((o.matrix_world @ V(b))[i] for b in o.bound_box) for o in objs) for i in range(3)))
        c = (lo + hi) / 2
        size = (hi - lo).length
        veh = [o for o in objs if not o.name.startswith("standin")]
        vlo = V((min(min((o.matrix_world @ V(b))[i] for b in o.bound_box) for o in veh) for i in range(3)))
        vhi = V((max(max((o.matrix_world @ V(b))[i] for b in o.bound_box) for o in veh) for i in range(3)))
        views = {"scroll": (-75, 22, c, size), "front34": (35, 24, c, size), "rear34": (215, 30, c, size),
                 "close": (-55, 16, (vlo + vhi) / 2, (vhi - vlo).length)}
        for vname, (az, el, c, size) in views.items():
            dist = size * 0.95 + 1.0
            d = V((math.cos(math.radians(az)) * math.cos(math.radians(el)),
                   math.sin(math.radians(az)) * math.cos(math.radians(el)), math.sin(math.radians(el))))
            cam.location = c + d * dist
            cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = os.path.join(out_dir, f"{name}_{vname}.png")
            bpy.ops.render.render(write_still=True)
    print("REVIEW_DONE " + " ".join(f"{n}={t[0]}" for n, t in results.items()), flush=True)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if argv and argv[0] == "review":
        review(argv[1], argv[2].split(",") if len(argv) > 2 else None)
