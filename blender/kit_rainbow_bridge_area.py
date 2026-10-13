"""S3's area kit (the Rainbow Bridge, sections/rainbow_bridge): 十千脚店 whole, and the generic parts it needs that
song_kit.py, kit_inner_city.py and kit_outer_road.py lack (round 2 Run 2, 2026-10-12; review renders in
gen/sections/rainbow_bridge/kit_review/tavern_*.png). The bridge itself is the factory's kit_rainbow_bridge.py; this is
the area's own module, so it is named kit_rainbow_bridge_area.py.

Generic builder functions in the song_kit manner: each adds faces to street_b1's bucket set `sb.B` and never opens an
entity. Positions always come from the caller; sizes the strokes can't give are keyword arguments marked `choice:` at
the call. Frame: x = map X (east), y = map D (north), z up, metres. Built at real size (map/BUILDING.md rule 5).

One composition entry, shiqian_jiaodian(ents, z_at, rng, upper_floor), builds the tavern from its nine layout entities,
each role inside `with sb.entity(<map id>):`. Where layout.json carries only an entity's base (the 彩楼欢门's eighteen
poles and four tiers, the 新酒 pole's vane, bar and banner, the gate's hanging post and boards), the kit reads the
painted points from the map itself (map/strokes/S3.json, scan px) and places them with the section's frame
(map/frames/S3.json F1): a point painted at (u, v) is put at a chosen depth D (a `choice:`), and X and H follow from the
frame, so from the scroll's own view every pole projects onto its painted stroke whatever depth it was given.

Messenger's construction rules apply as in song_kit: no plain boxes, edges with thickness (roof slabs with red fascia,
framed openings, lashed joints), surfaces split where ink should fall; the triangles go into trims and small things,
roofs keep coarse tile grids and sparse rafter ends (budget: the whole complex with its scaffold <= 22k). Thin things
(cloth, sign faces, the vane) are single faces; exported materials are double-sided. Signs carry their painted
characters from the section's atlas (gen/sections/rainbow_bridge/make_signs.mjs -> textures/signs_rainbow_bridge.png +
.json; material "signs_rainbow_bridge"), each face built with its cell's left edge on the viewer's left (never
mirrored). Colliders: the walls and doors of the closed buildings, the gate's posts, the fence, the 杈子, the lamp-box's
legs and the 新酒 pole; the upper floor's slab (people.js grounds the diners on it); nothing collides between the
upper floor and 5.1 m above it where figures stand; roofs and the scaffold never collide.
"""
import json
import math
import os

from mathutils import Vector

import kit_inner_city as ki
import song_kit as k
import street_b1 as sb

try:                                    # the shared factory part (c), when it lands; else the stand-in below
    import kit_common as _kc
except Exception:                       # noqa: BLE001 -- not there yet
    _kc = None

V = Vector
UP = V((0, 0, 1))
QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
FRAME_JSON = QM + r"\map\frames\S3.json"
STROKES_JSON = QM + r"\map\strokes\S3.json"
SIGN_TEX = QM + r"\gen\sections\rainbow_bridge\textures\signs_rainbow_bridge.png"
SIGN_JSON = QM + r"\gen\sections\rainbow_bridge\textures\signs_rainbow_bridge.json"
for _name, _spec in {
    "signs_rainbow_bridge": (SIGN_TEX, 1, None),
}.items():
    sb.MATERIALS.setdefault(_name, _spec)
sb.MATERIALS.setdefault("cloth_indigo", (None, 1, "#4f6081"))
_ATLAS, _FR, _STROKES = {}, {}, {}
PARTS = {}                              # triangles per (owner, part) of the last build: what each piece costs


def _tick(label):
    """Record the triangles the current owner gained since its last tick under `label` (PARTS)."""
    owner = sb.B.owners[-1] if sb.B.owners else None
    now = sb.B.tris.get(owner, 0)
    last = PARTS.setdefault("_last", {}).get(owner, 0)
    PARTS.setdefault(owner, {})[label] = PARTS.get(owner, {}).get(label, 0) + now - last
    PARTS["_last"][owner] = now


# ---------------------------------------------------------------- the atlas

def atlas():
    if not _ATLAS and os.path.exists(SIGN_JSON):
        with open(SIGN_JSON, encoding="utf-8") as f:
            _ATLAS.update(json.load(f))
    return _ATLAS


def cell_uv(name, sub=None):
    """UVs (Blender: origin bottom-left) of an atlas cell: [bottom-left, bottom-right, top-right, top-left] of the
    face; sub = (t0, t1): only that part of the cell's height (0 = top). None when the atlas lacks the cell."""
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
    """A cell's width / height as drawn (the face's real proportions)."""
    return atlas().get("aspect", {}).get(name, default)


def sign_face(a, b, c, d, cell, fallback="cloth_white"):
    """A sign face: a = bottom-left on the viewer's left, b bottom-right, c top-right, d top-left (counter-clockwise
    seen from the front), mapped onto its atlas cell."""
    uv = cell_uv(cell)
    sb.quad("signs_rainbow_bridge" if uv else fallback, False, V(a), V(b), V(c), V(d), uv=uv)


# ---------------------------------------------------------------- the map: scan points into the world

def _frame():
    if not _FR:
        with open(FRAME_JSON, encoding="utf-8") as f:
            F = json.load(f)
        f1 = F["frames"][0]
        _FR.update(o=f1["origin"], ax=f1["x"][0], dv=f1["d"][1], h=f1["h"], knots=f1["dx_knots"],
                   supports={k_: v.get("H") for k_, v in F.get("supports", {}).items()})
    return _FR


def dx_at(u):
    """The frame's receding direction (px of u per metre of D) at scan u: linear between the knots, constant beyond."""
    kn = _frame()["knots"]
    if u <= kn[0][0]:
        return kn[0][1]
    for (u0, a), (u1, b) in zip(kn, kn[1:]):
        if u <= u1:
            return a + (b - a) * (u - u0) / (u1 - u0)
    return kn[-1][1]


def scan_to_world(u, v, D):
    """The point painted at scan (u, v), put at depth D (metres north; a choice where the strokes can't give it):
    (X, D, H) by map/frames/S3.json F1 (u = u0 + 77 X + dx(u) D, v = v0 - 51.25 D - 77 H). Any D projects back onto the
    same painted point."""
    F = _frame()
    X = (u - F["o"][0] - dx_at(u) * D) / F["ax"]
    H = (F["o"][1] + F["dv"] * D - v) / F["h"]
    return X, D, H


def u_to_x(u, D):
    """World X of scan u on the plane at depth D (the H doesn't change it)."""
    return scan_to_world(u, 0.0, D)[0]


def world_to_scan(X, D, H):
    """Inverse of scan_to_world (dx is piecewise linear in u, so u solves in closed form on its piece)."""
    F = _frame()
    base = F["o"][0] + F["ax"] * X
    kn = F["knots"]
    u = base + kn[0][1] * D
    for _ in range(4):                  # fixed point: converges in 2-3 steps (dx changes slowly)
        u = base + dx_at(u) * D
    return u, F["o"][1] + F["dv"] * D - F["h"] * H


def strokes(map_id):
    """An entity's painted points (scan px) from map/strokes/S3.json."""
    if not _STROKES:
        with open(STROKES_JSON, encoding="utf-8") as f:
            S = json.load(f)
        E = S["entities"]
        for e in (E.values() if isinstance(E, dict) else E):
            _STROKES[e["id"]] = e.get("pts", {})
    return _STROKES.get(map_id, {})


def _uv(p):
    return float(p[0]), float(p[1])


# ---------------------------------------------------------------- small helpers

def _rod(a, b, r, mat="bamboo", segs=5, taper=1.0, collide=False):
    """A round member a -> b (open ends: the rods are thin and their ends are tied or pointed)."""
    sb.cyl(mat, collide, V(a), V(b), r, r * taper, segs=segs, caps=False)


def knob(p, r=0.07, h=0.18, mat="ridge"):
    """A round knob ornament (宝珠): a small lathed bulb on a collar."""
    sb.lathe(mat, False, tuple(p), [(r * 0.6, 0), (r * 0.75, h * 0.18), (r, h * 0.45), (r * 0.7, h * 0.8), (0.0, h)], segs=6)


def _rafters(eave, inward, step, thick, mat="redwood", length=0.32):
    """Rafter ends under an eave polyline (as song_kit's roofs draw them), every `step` m instead of every 0.32 m."""
    for a, b in zip(eave, eave[1:]):
        L = (b - a).length
        n = max(1, int(L / step))
        for m in range(n):
            p = a.lerp(b, (m + 0.5) / n) - UP * (thick + 0.05) - inward * 0.02
            k.beam(mat, False, p, p + inward * length, 0.085, 0.085, 0)


def _slope(E0, E1, R0, R1, height, ns, nt, thick=0.18, mat="roof", under="timber"):
    """One tiled roof slope from its eave E0 -> E1 up to R0 -> R1 (plan points), height(s, t) -> z; wound so its top
    faces up. Fascia along the eave (red), timber underside (song_kit._roof_surface). Returns its rows (eave first)."""
    E0, E1, R0, R1 = (V((p[0], p[1], 0)) for p in (E0, E1, R0, R1))
    if (E1 - E0).cross((R0 + R1) / 2 - (E0 + E1) / 2).z < 0:
        E0, E1, R0, R1 = E1, E0, R1, R0
        h0 = height
        height = lambda s, t: h0(1 - s, t)    # noqa: E731 -- the same surface, s reversed
    return k._roof_surface([(E0, E1, R0, R1, ns)], height, thick, nt, mat=mat, under=under, rafters=False)[0]


# ---------------------------------------------------------------- roofs

def xieshan(x0, x1, y0, y1, z_eave, z_ridge, rng=None, lift=0.4, curve=1.7, thick=0.22, ns=10, nt=4,
            rafter_step=0.5, rafter_sides=("y0", "y1"), ornaments=(1.0, 1.0), gable_mat="redwood", ridge_in=None):
    """Hip-gable roof (歇山), ridge along x over the eave rectangle: concave slopes with swept corners, red fascia,
    sparse rafter ends on the listed sides, hip ridges, the main ridge with an ornament (鸱吻) at each end
    (ornaments = (west scale, east scale), 0 = none), and the small vertical gables with barge boards and a
    hanging-fish board set in from the hip ends (as kit_inner_city.xieshan_roof, at a third of its cost).
    ridge_in: how far the ridge's ends stand in from the eave's ends (default half the depth: 45 deg hips); a shorter
    one gives the long ridge and short, steep hip skirts of a painted 歇山 seen from the front."""
    yc, d = (y0 + y1) / 2, (y1 - y0) / 2
    ri = d if ridge_in is None else min(d, ridge_in)
    rx0, rx1 = x0 + ri, x1 - ri

    def height(s, t):
        return z_eave + (z_ridge - z_eave) * (t ** curve) + lift * (abs(2 * s - 1) ** 3) * (1 - t) ** 2

    S = _slope((x0, y0), (x1, y0), (rx0, yc), (rx1, yc), height, ns, nt, thick)
    N = _slope((x1, y1), (x0, y1), (rx1, yc), (rx0, yc), height, ns, nt, thick)
    _slope((x1, y0), (x1, y1), (rx1, yc), (rx1, yc), height, max(4, ns // 2), nt, thick)
    _slope((x0, y1), (x0, y0), (rx0, yc), (rx0, yc), height, max(4, ns // 2), nt, thick)
    for side, rows, inward in (("y0", S, V((0, 1, 0))), ("y1", N, V((0, -1, 0)))):
        if side in rafter_sides:
            _rafters(rows[0], inward, rafter_step, thick)
    for side, x, inward in (("x0", x0, V((1, 0, 0))), ("x1", x1, V((-1, 0, 0)))):
        if side in rafter_sides:
            _rafters([V((x, y0, z_eave + lift)), V((x, yc, z_eave)), V((x, y1, z_eave + lift))], inward, rafter_step, thick)
    # hip ridges along the first and last columns of the long slopes, a knob at each foot
    for rows in (S, N):
        for col in (0, -1):
            line = [r[col] for r in rows]
            for a, b in zip(line, line[1:]):
                k.beam("ridge", False, a + UP * 0.07, b + UP * 0.07, 0.17, 0.13, 0)
            knob(line[0] + UP * 0.08, r=0.07, h=0.2)
    k.beam("ridge", False, (rx0 - 0.1, yc, z_ridge + 0.12), (rx1 + 0.1, yc, z_ridge + 0.12), 0.28, 0.3, 0.04)
    for s, x, f in ((ornaments[0], rx0 - 0.05, -1), (ornaments[1], rx1 + 0.05, 1)):
        if s:
            k.ridge_ornament((x, yc, z_ridge + 0.26), (f, 0), s=s)
    # the gables: vertical triangles standing on the hip skirts, 0.62 of the way in to the ridge's ends
    fg = 0.62
    zg = z_eave + (z_ridge - z_eave) * fg ** curve
    half = d * (1 - fg)
    for x, sgn in ((x0 + ri * fg, 1), (x1 - ri * fg, -1)):
        tri = [V((x, yc - half, zg)), V((x, yc + half, zg)), V((x, yc, z_ridge + 0.05))]
        if sgn > 0:
            tri = [tri[1], tri[0], tri[2]]
        sb.B.add("plaster", False, tri, [(0, 1, 2)])
        for p, q in ((tri[0], tri[2]), (tri[1], tri[2])):
            k.beam(gable_mat, False, p + V((-sgn * 0.05, 0, 0)), q + V((-sgn * 0.05, 0, 0.04)), 0.06, 0.2, 0)
        k.beam(gable_mat, False, V((x - sgn * 0.07, yc, z_ridge - 0.05)), V((x - sgn * 0.07, yc, z_ridge - 0.7)), 0.04, 0.2, 0)


def gable_roof(r0, r1, w_l, w_r, z_ridge, z_l, z_r, over=0.45, lift=0.12, curve=1.3, thick=0.16, ns=6, nt=3,
               rafter_step=0.55, rafter_sides=("l", "r"), ends=("curl", "curl"), end_s=0.55, barge="redwood"):
    """Overhanging gable roof (悬山) whose ridge runs in plan from r0 to r1 (any direction), its eaves w_l to the left and
    w_r to the right of r0 -> r1 at z_l and z_r (they may differ: a ridge off centre), running `over` m past both
    gables; slightly concave, corners lifted, barge boards (搏风) down both gables, a raised ridge, and at each end an
    ornament: 'curl' (a small 鸱吻), 'knob' (a round knob, 宝珠) or None."""
    R0, R1 = V((r0[0], r0[1], 0)), V((r1[0], r1[1], 0))
    t = (R1 - R0).normalized()
    nl = V((-t.y, t.x, 0))
    A, Bp = R0 - t * over, R1 + t * over

    def hfun(z_e):
        return lambda s, tt: z_e + (z_ridge - z_e) * (tt ** curve) + lift * (abs(2 * s - 1) ** 4) * (1 - tt)

    rows_l = _slope(A + nl * w_l, Bp + nl * w_l, A, Bp, hfun(z_l), ns, nt, thick)
    rows_r = _slope(Bp - nl * w_r, A - nl * w_r, Bp, A, hfun(z_r), ns, nt, thick)
    for side, rows, inward in (("l", rows_l, -nl), ("r", rows_r, nl)):
        if side in rafter_sides:
            _rafters(rows[0], inward, rafter_step, thick)
        for col in (0, -1):
            line = [r[col] for r in rows]
            for a, b in zip(line, line[1:]):
                k.beam(barge, False, a - UP * 0.06, b - UP * 0.06, 0.07, 0.28, 0)
    a = V((A.x, A.y, z_ridge + 0.1))
    b = V((Bp.x, Bp.y, z_ridge + 0.1))
    k.beam("ridge", False, a - t * 0.05, b + t * 0.05, 0.22, 0.24, 0.03)
    for kind, p, f in ((ends[0], a, -t), (ends[1], b, t)):
        if kind == "curl":
            k.ridge_ornament(p + UP * 0.1, (f.x, f.y), s=end_s)
        elif kind == "knob":
            knob(p + UP * 0.1, r=0.16 * end_s / 0.55, h=0.38 * end_s / 0.55)
    return rows_l, rows_r


def flat_top_roof(x0, x1, y0, y1, z_eave, z_top, inset, rng, lift=0.22, thick=0.18, ns=6, nt=2, rafter_step=0.5,
                  rafter_sides=("y0", "x1")):
    """A gate roof with a flat top (盝顶): four short tiled slopes from the eave rectangle up to a flat deck inset by
    `inset`, red fascia, corner ridges, rafter ends on the listed sides; the deck (timber boards on a slab) carries
    what stands on the roof. Returns the deck rectangle (x0, x1, y0, y1, z)."""
    a0, a1, b0, b1 = x0 + inset, x1 - inset, y0 + inset, y1 - inset

    def height(s, t):
        return z_eave + (z_top - z_eave) * t + lift * (abs(2 * s - 1) ** 3) * (1 - t) ** 2

    S = _slope((x0, y0), (x1, y0), (a0, b0), (a1, b0), height, ns, nt, thick)
    E = _slope((x1, y0), (x1, y1), (a1, b0), (a1, b1), height, ns, nt, thick)
    N = _slope((x1, y1), (x0, y1), (a1, b1), (a0, b1), height, ns, nt, thick)
    W = _slope((x0, y1), (x0, y0), (a0, b1), (a0, b0), height, ns, nt, thick)
    for side, rows, inward in (("y0", S, V((0, 1, 0))), ("x1", E, V((-1, 0, 0))), ("y1", N, V((0, -1, 0))),
                               ("x0", W, V((1, 0, 0)))):
        if side in rafter_sides:
            _rafters(rows[0], inward, rafter_step, thick)
    for rows in (S, N):
        for col in (0, -1):
            line = [r[col] for r in rows]
            for a, b in zip(line, line[1:]):
                k.beam("ridge", False, a + UP * 0.06, b + UP * 0.06, 0.15, 0.12, 0)
    # the deck: a slab with a timber kerb round it
    k.bx("timber", False, (a0 - 0.02, b0 - 0.02, z_top - 0.08), (a1 + 0.02, b1 + 0.02, z_top + 0.02))
    for p, q in (((a0, b0), (a1, b0)), ((a1, b0), (a1, b1)), ((a1, b1), (a0, b1)), ((a0, b1), (a0, b0))):
        k.beam("redwood", False, (p[0], p[1], z_top + 0.04), (q[0], q[1], z_top + 0.04), 0.1, 0.1, 0)
    return a0, a1, b0, b1, z_top + 0.02


def slat_roof(x_hi, x_lo, y0, y1, z_hi, z_lo, step=0.13, rng=None):
    """A slatted roof (the side gallery's): thin slats laid down the slope from a ledger at x_hi (z_hi) to an eave
    batten at x_lo (z_lo), along y0..y1, on two rafters; the slats lie a little apart so the sky shows between them."""
    k.beam("timber", False, (x_hi, y0, z_hi), (x_hi, y1, z_hi), 0.1, 0.12, 0)
    k.beam("timber", False, (x_lo, y0 - 0.1, z_lo), (x_lo, y1 + 0.1, z_lo), 0.08, 0.1, 0)
    for y in (y0 + 0.15, y1 - 0.15):
        k.beam("timber", False, (x_hi, y, z_hi - 0.06), (x_lo, y, z_lo - 0.06), 0.06, 0.08, 0)
    n = max(2, int((y1 - y0) / step))
    for i in range(n + 1):
        y = y0 + (y1 - y0) * i / n
        j = rng.uniform(-0.01, 0.01) if rng else 0.0
        k.beam("reed", False, (x_hi + 0.05, y + j, z_hi + 0.05), (x_lo - 0.12, y + j, z_lo + 0.03), 0.07, 0.025, 0)


# ---------------------------------------------------------------- storeys

def lattice(p0, p1, z0, z1, step=0.15, out=0.03):
    """A plain straight-bar lattice window (直棂窗) for walls the scroll doesn't paint: a square-section frame proud of the
    wall on its outer side (right of p0 -> p1), bars every `step` m, a dark backing (half song_kit.lattice_window's
    cost)."""
    a, b, t, n, L = ki._frame_vecs(p0, p1)
    o = n * out
    k.beam("timber", False, a + o + UP * z0, b + o + UP * z0, 0.12, 0.08, 0)
    k.beam("timber", False, a + o + UP * z1, b + o + UP * z1, 0.09, 0.08, 0)
    for p in (a, b):
        k.beam("timber", False, p + o + UP * z0, p + o + UP * z1, 0.08, 0.08, 0)
    m = max(3, int(L / step))
    for i in range(1, m):
        q = a + t * (L * i / m) + o * 0.5
        k.beam("lattice", False, q + UP * z0, q + UP * z1, 0.04, 0.04, 0)
    sb.quad("interior", False, a - n * 0.03 + UP * z0, b - n * 0.03 + UP * z0, b - n * 0.03 + UP * z1, a - n * 0.03 + UP * z1)


def plaster_wall(p0, p1, z0, z1, rng, posts=(), thick=0.16, openings=(), mat="plaster", plinth=0.38):
    """A plain wall p0 -> p1 (outer side = right) from z0 to z1 with timber posts at fractions `posts` (proud of it,
    so its face splits where the ink falls) and openings [(f0, f1, kind)] kind 'door' (a plank door ajar, an
    invisible board in it: the room behind is not painted) or 'window' (a straight-bar lattice window at sill 0.9);
    a stone plinth band `plinth` m tall along its foot where it stands on the ground (z0 > 0.5 above it: none).
    Collides."""
    a, b, t, n, L = ki._frame_vecs(p0, p1)
    cuts = sorted(openings)
    f = 0.0
    segs = []
    for f0, f1, kind in cuts:
        if f0 > f:
            segs.append((f, f0, None))
        segs.append((f0, f1, kind))
        f = f1
    if f < 1.0:
        segs.append((f, 1.0, None))
    for f0, f1, kind in segs:
        pa, pb = a + t * (L * f0), a + t * (L * f1)
        A2, B2 = (pa.x, pa.y), (pb.x, pb.y)
        if kind is None:
            k.board(mat, True, A2, B2, thick, z0, z1)
        elif kind == "door":
            zh = z0 + 2.2
            k.plank_door(A2, B2, z0, zh, ajar=rng.uniform(0.0, 0.2))
            k.board(mat, True, A2, B2, thick, zh + 0.1, z1)
            k.board("hidden", True, A2, B2, 0.06, z0, zh)
        elif kind == "window":
            zs, zh = z0 + 0.9, min(z1 - 0.3, z0 + 2.0)
            k.board(mat, True, A2, B2, thick, z0, zs)
            lattice(A2, B2, zs, zh)
            k.board(mat, True, A2, B2, thick, zh, z1)
        if plinth and kind != "door":
            k.board("stone", True, A2, B2, thick + 0.07, z0 - 0.05, z0 + plinth)
    for fr in posts:
        p = a + t * (L * fr) + n * (thick / 2 + 0.02)
        k.post("timber", False, p.x, p.y, z0, z1, 0.16, 0)
    k.beam("timber", False, a + n * (thick / 2 + 0.02) + UP * (z1 - 0.1), b + n * (thick / 2 + 0.02) + UP * (z1 - 0.1),
           0.08, 0.16, 0)


def platform_floor(x0, x1, y0, y1, z, band=0.45, band_sides=("y0", "x1"), mat="deck"):
    """An upper floor (平坐): a slab whose top is at z (collides: the diners are grounded on it), a plain fascia band
    `band` m deep under its edge on the sides that show, and the floor beam below the band."""
    k.bx(mat, True, (x0, y0, z - 0.12), (x1, y1, z))
    sides = {"y0": ((x0, y0), (x1, y0), V((0, -1, 0))), "y1": ((x1, y1), (x0, y1), V((0, 1, 0))),
             "x0": ((x0, y1), (x0, y0), V((-1, 0, 0))), "x1": ((x1, y0), (x1, y1), V((1, 0, 0)))}
    for s in band_sides:
        p, q, o = sides[s]
        P, Q = V((p[0], p[1], 0)) + o * 0.03, V((q[0], q[1], 0)) + o * 0.03
        k.board("timber", False, (P.x, P.y), (Q.x, Q.y), 0.06, z - band, z - 0.1)
        k.beam("redwood", False, P + o * 0.03 + UP * (z - 0.06), Q + o * 0.03 + UP * (z - 0.06), 0.08, 0.1, 0)
        k.beam("timber", False, P + UP * (z - band - 0.06), Q + UP * (z - band - 0.06), 0.14, 0.12, 0)


def rail(pts, z, h=0.9, post_step=1.6, baluster_step=0.5, mat="redwood", collide=False, corner_knob=None):
    """A balcony railing (勾欄) along a polyline: square posts with caps, a top rail, a mid rail and a bottom rail, and
    plain balusters between the mid and top rails (square sections: a third of song_kit.balustrade's cost).
    corner_knob: the index of a vertex whose post carries a looped knob (as painted at the balcony's turn)."""
    for i, (p, q) in enumerate(zip(pts, pts[1:])):
        A, B = V((p[0], p[1], z)), V((q[0], q[1], z))
        L = (B - A).length
        n = max(1, math.ceil(L / post_step))
        for kk in range(n + (1 if i == len(pts) - 2 else 0)):
            c = A.lerp(B, kk / n)
            k.post(mat, collide, c.x, c.y, z, z + h + 0.05, 0.1, 0)
            k.bx(mat, False, (c.x - 0.07, c.y - 0.07, z + h + 0.05), (c.x + 0.07, c.y + 0.07, z + h + 0.1))
        k.beam(mat, collide, A + UP * (h - 0.03), B + UP * (h - 0.03), 0.08, 0.07, 0)
        k.beam(mat, False, A + UP * (h * 0.5), B + UP * (h * 0.5), 0.06, 0.05, 0)
        k.beam(mat, False, A + UP * 0.08, B + UP * 0.08, 0.07, 0.06, 0)
        m = max(1, int(L / baluster_step))
        for kk in range(m):
            c = A.lerp(B, (kk + 0.5) / m)
            k.post(mat, False, c.x, c.y, z + h * 0.5, z + h - 0.06, 0.04, 0)
    if corner_knob is not None:
        p = pts[corner_knob]
        sb.lathe("redwood", False, (p[0], p[1], z + h + 0.1), [(0.06, 0), (0.09, 0.06), (0.06, 0.13), (0.0, 0.2)], segs=6)


def slat_band(p0, p1, z_lo, z_hi, out, step=0.3, mat="timber"):
    """The band of slanted slats under a front eave (as painted along the riverside hall): slats leaning out from a
    beam at z_lo to the eave's underside at z_hi, `out` m further out (right of p0 -> p1), slanted along the band so
    they read as hatching, with a batten along each edge."""
    a, b, t, n, L = ki._frame_vecs(p0, p1)
    lo0, lo1 = a + UP * z_lo, b + UP * z_lo
    hi0, hi1 = a + n * out + UP * z_hi, b + n * out + UP * z_hi
    k.beam(mat, False, lo0, lo1, 0.07, 0.07, 0)
    k.beam(mat, False, hi0, hi1, 0.06, 0.06, 0)
    m = max(2, int(L / step))
    for i in range(m):
        f = (i + 0.3) / m
        q0 = lo0.lerp(lo1, f)
        q1 = hi0.lerp(hi1, min(1.0, f + 0.35 / L))
        k.beam(mat, False, q0, q1, 0.05, 0.03, 0)


# ---------------------------------------------------------------- the gate's parts

def hanging_post(x, y, z_top, z_knob, r=0.09, mat="redwood"):
    """A hanging post (垂柱): a short post hanging from the eave beam, ringed collar under the beam, ending in mid-air
    in a carved, ringed bulb (as painted at 十千脚店's west front corner)."""
    k.post(mat, False, x, y, z_knob + 0.18, z_top, r * 2, 0.02)
    sb.lathe(mat, False, (x, y, z_top - 0.32), [(r * 1.25, 0), (r * 1.45, 0.07), (r * 1.25, 0.14)], segs=8)
    sb.lathe(mat, False, (x, y, z_knob - 0.05), [(0.0, 0.0), (r * 0.9, 0.04), (r * 1.4, 0.11), (r * 1.15, 0.18),
                                                  (r * 1.35, 0.21), (r * 1.05, 0.25)], segs=8)


def pleated_blind(p0, p1, z_top, depth, rng, pleat=0.07, mat="reed", hem="interior"):
    """A blind or valance of fine vertical pleats hung under an eave beam p0 -> p1 (the band of fine vertical hatching
    under 十千脚店's gate eave): the cloth or split-bamboo sheet folded every `pleat` m (each fold is an ink line on the
    page), its hem gently waved, on a rod, with a dark hem band."""
    a, b, t, n, L = ki._frame_vecs(p0, p1)
    m = max(2, round(L / (pleat / 2)))
    top, low, hm = [], [], []
    for i in range(m + 1):
        o = n * (0.014 if i % 2 == 0 else -0.014)
        p = a + t * (L * i / m)
        w = rng.uniform(-0.015, 0.015)
        top.append(p + o * 0.5 + UP * z_top)
        low.append(p + o + UP * (z_top - depth + 0.09 + w))
        hm.append(p + o * 1.1 + UP * (z_top - depth + w))
    for A, Bv, mm in ((top, low, mat), (low, hm, hem)):
        k.add(mm, False, A + Bv, [(i, i + 1, m + 2 + i, m + 1 + i) for i in range(m)])
    _rod(a + n * 0.02 + UP * (z_top + 0.02) - t * 0.05, b + n * 0.02 + UP * (z_top + 0.02) + t * 0.05, 0.022)


def hanging_board(p_left, p_right, z0, z1, cell, thick=0.05, cords=None):
    """A narrow board with painted writing (□ where illegible), its face toward the right of p_left -> p_right (the
    viewer), in a dark frame; hung on two cords from z `cords` if given (else fixed to a post)."""
    a, b, t, n, L = ki._frame_vecs(p_left, p_right)
    o = n * (thick / 2 + 0.004)
    sign_face(a + o + UP * z0, b + o + UP * z0, b + o + UP * z1, a + o + UP * z1, cell)
    k.board("timber", False, (a.x, a.y), (b.x, b.y), thick, z0, z1)
    for p, q in ((a + UP * z0, b + UP * z0), (a + UP * z1, b + UP * z1)):
        k.beam("timber", False, p - t * 0.02 + n * 0.012, q + t * 0.02 + n * 0.012, thick + 0.02, 0.035, 0)
    if cords:
        for p in (a + t * 0.06, b - t * 0.06):
            _rod(p + UP * z1, p + UP * cords, 0.008, mat="rope", segs=3)


def lattice_panel(p0, p1, z0, z1, rng, arch=0.25, slats=6, mat="timber"):
    """A free-standing slatted panel with a curved top (as painted beside the gate's east post): a frame, vertical
    slats, two rails, and an arched head rail."""
    a, b, t, n, L = ki._frame_vecs(p0, p1)
    for p in (a, b):
        k.post(mat, True, p.x, p.y, z0, z1, 0.07, 0)
    k.beam(mat, False, a + UP * (z0 + 0.12), b + UP * (z0 + 0.12), 0.05, 0.05, 0)
    k.beam(mat, False, a + UP * (z1 - 0.05), b + UP * (z1 - 0.05), 0.05, 0.05, 0)
    arc = [a.lerp(b, i / 6) + UP * (z1 + arch * math.sin(math.pi * i / 6)) for i in range(7)]
    sb.tube(mat, False, arc, [0.03] * 7, segs=4)
    for i in range(1, slats):
        p = a.lerp(b, i / slats)
        k.beam(mat, False, p + UP * (z0 + 0.12), p + UP * (z1 + arch * math.sin(math.pi * i / slats) - 0.02), 0.025, 0.04, 0)


def carved_leaf(hinge, open_to, z0, z1, w, rng, thick=0.05, mat="redwood"):
    """A door leaf standing open, its face carved: a frame of stiles and rails round two sunk panels, each with a raised
    lozenge (the curved and scrolled strokes painted at the gate's west side)."""
    a = V((hinge[0], hinge[1], 0))
    t = (V((open_to[0], open_to[1], 0)) - a).normalized()
    b = a + t * w
    n = V((t.y, -t.x, 0))
    k.board(mat, True, (a.x, a.y), (b.x, b.y), thick, z0, z1)
    for zz in (z0 + 0.06, (z0 + z1) * 0.5, z1 - 0.06):
        k.beam(mat, False, a + n * thick * 0.6 + UP * zz, b + n * thick * 0.6 + UP * zz, 0.03, 0.08, 0)
    for zc in (z0 + (z1 - z0) * 0.3, z0 + (z1 - z0) * 0.72):
        c = a.lerp(b, 0.5) + n * (thick * 0.6 + 0.012) + UP * zc
        hw, hh = w * 0.3, (z1 - z0) * 0.14
        sb.quad("timber", False, c - t * hw, c - UP * hh, c + t * hw, c + UP * hh)


def _swag_standin(top_a, top_b, z_top, z_hem, rng, gather="b", tie_z=None, stripes=0, mat="cloth_indigo"):
    """Stand-in for kit_common.swag_curtain (factory part (c), same arguments): a curtain hung from a rod top_a -> top_b
    at z_top, swept to the `gather` end and tied there at tie_z, falling below the tie to the hem at z_hem; in folds,
    with `stripes` alternate stripes in cloth_white. Returns the triangles added."""
    A, Bp = V((top_a[0], top_a[1], z_top)), V((top_b[0], top_b[1], z_top))
    if gather == "a":
        A, Bp = Bp, A
    t = (Bp - A).normalized()
    n = V((t.y, -t.x, 0))
    tie_z = z_top - (z_top - z_hem) * 0.45 if tie_z is None else tie_z
    tie = Bp - t * 0.12 + n * 0.06 + UP * (tie_z - z_top)
    cols, rows = 9, 6
    tris = 0
    grid = []
    for i in range(cols + 1):
        f = i / cols
        top = A.lerp(Bp, f)
        fold = n * (0.05 * (1 if i % 2 else -1))
        col = []
        for j in range(rows + 1):
            s = j / rows
            if s <= 0.5:              # from the rod to the tie: every fold swept toward the tied end
                q = top.lerp(tie + t * (-0.08 + 0.16 * f), (s / 0.5) ** 1.3) + fold * (1 - s)
            else:                     # below the tie: the gathered cloth falls to the hem
                q = (tie + t * (-0.08 + 0.16 * f)).lerp(V((tie.x, tie.y, z_hem)) + t * (-0.25 + 0.3 * f), (s - 0.5) / 0.5)
                q = q + fold * 0.6 * (s - 0.5)
            col.append(q)
        grid.append(col)
    for i in range(cols):
        m = "cloth_white" if (stripes and i % 2) else mat
        for j in range(rows):
            vs = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
            sb.B.add(m, False, vs, [(0, 1, 2, 3)])
            tris += 2
    _rod(A - t * 0.08, Bp + t * 0.08, 0.02)
    sb.cyl("rope", False, tie - UP * 0.05, tie + UP * 0.05, 0.12, segs=6, caps=False)
    return tris + 12 + 12


def swag_curtain(top_a, top_b, z_top, z_hem, rng, gather="b", tie_z=None, stripes=0, mat="cloth_indigo"):
    """The shared swag curtain (kit_common.swag_curtain when it has landed, else the stand-in)."""
    if _kc is not None and hasattr(_kc, "swag_curtain"):
        return _kc.swag_curtain(top_a, top_b, z_top, z_hem, rng, gather=gather, tie_z=tie_z, stripes=stripes, mat=mat)
    return _swag_standin(top_a, top_b, z_top, z_hem, rng, gather=gather, tie_z=tie_z, stripes=stripes, mat=mat)


# ---------------------------------------------------------------- barriers

def crossed_barrier(p0, p1, h, rng, bay=0.55, mat="timber", box_at=None, box_h=None):
    """A 杈子 of crossed bars: two long rails (top and foot) on posts, a short post at every bay and an X of two bars in
    each bay, as painted along 十千脚店's forecourt; box_at (0..1 along it): a small capped box post standing in it."""
    a, b, t, n, L = ki._frame_vecs(p0, p1)
    m = max(2, round(L / bay))
    for i in range(m + 1):
        p = a + t * (L * i / m)
        end = i in (0, m)
        k.post(mat, True, p.x, p.y, -0.03, h + (0.06 if end else 0.0), 0.11 if end else 0.07, 0)
        if end:
            k.bx(mat, False, (p.x - 0.08, p.y - 0.08, h + 0.06), (p.x + 0.08, p.y + 0.08, h + 0.12))
    k.beam(mat, True, a - t * 0.06 + UP * (h - 0.03), b + t * 0.06 + UP * (h - 0.03), 0.08, 0.07, 0)
    k.beam(mat, True, a + UP * 0.12, b + UP * 0.12, 0.07, 0.07, 0)
    for i in range(m):
        pa, pb = a + t * (L * i / m), a + t * (L * (i + 1) / m)
        j = rng.uniform(-0.01, 0.01)
        k.beam(mat, False, pa + UP * 0.16 + n * 0.035, pb + UP * (h - 0.07 + j) + n * 0.035, 0.035, 0.045, 0)
        k.beam(mat, False, pa + UP * (h - 0.07) - n * 0.035, pb + UP * (0.16 + j) - n * 0.035, 0.035, 0.045, 0)
    if box_at is not None:
        p = a + t * (L * box_at)
        hb = box_h or h + 0.25
        k.bx(mat, True, (p.x - 0.13, p.y - 0.13, -0.02), (p.x + 0.13, p.y + 0.13, hb))
        k.bx("redwood", False, (p.x - 0.17, p.y - 0.17, hb), (p.x + 0.17, p.y + 0.17, hb + 0.06))
        knob((p.x, p.y, hb + 0.06), r=0.06, h=0.13, mat="timber")


# ---------------------------------------------------------------- the lamp-box

def sign_lamp_box(x, y, z, w, d, h, legs, front_cell, side_cell=None, rng=None, crest=0.32):
    """An upright lamp-box sign (灯箱) facing south (-y): framed paper faces on four legs, the front face carrying
    front_cell and the east face side_cell (both read unmirrored from outside), under a small hipped cap with a
    carved crest board of scrolls on its front and a knob."""
    x0, x1, y0, y1 = x - w / 2, x + w / 2, y - d / 2, y + d / 2
    zb, zt = z + legs, z + legs + h
    for sx in (x0, x1):
        for sy in (y0, y1):
            k.post("timber", True, sx, sy, z, zt + 0.04, 0.055, 0)
    for zz in (z + 0.12, zb, zt):
        for p, q in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
            k.beam("timber", False, (p[0], p[1], zz), (q[0], q[1], zz), 0.045, 0.045, 0)
    e = 0.006
    # front: viewer looks north, left = west
    sign_face((x0 + 0.03, y0 - e, zb + 0.03), (x1 - 0.03, y0 - e, zb + 0.03), (x1 - 0.03, y0 - e, zt - 0.03),
              (x0 + 0.03, y0 - e, zt - 0.03), front_cell)
    # east side: viewer looks west, left = south
    if side_cell:
        sign_face((x1 + e, y0 + 0.03, zb + 0.03), (x1 + e, y1 - 0.03, zb + 0.03), (x1 + e, y1 - 0.03, zt - 0.03),
                  (x1 + e, y0 + 0.03, zt - 0.03), side_cell)
    sb.quad("cloth_white", False, (x1 - 0.02, y1 + e, zb), (x0 + 0.02, y1 + e, zb), (x0 + 0.02, y1 + e, zt), (x1 - 0.02, y1 + e, zt))
    sb.quad("cloth_white", False, (x0 - e, y1 - 0.02, zb), (x0 - e, y0 + 0.02, zb), (x0 - e, y0 + 0.02, zt), (x0 - e, y1 - 0.02, zt))
    # the cap: a thick red eave, four concave slopes, a knob
    ex = 0.08
    ring = [V((x0 - ex, y0 - ex, zt + 0.08)), V((x1 + ex, y0 - ex, zt + 0.08)), V((x1 + ex, y1 + ex, zt + 0.08)),
            V((x0 - ex, y1 + ex, zt + 0.08))]
    under = [V((x + (p.x - x) * 0.92, y + (p.y - y) * 0.92, zt + 0.03)) for p in ring]
    k.prism("redwood", False, under, ring, cap_top=False, cap_bottom=True)
    apex = V((x, y, zt + 0.08 + 0.16 + 0.12 * min(w, d)))
    mid = [p.lerp(apex, 0.45) - UP * 0.03 for p in ring]
    for i in range(4):
        j = (i + 1) % 4
        sb.B.add("roof", False, [ring[i], ring[j], mid[j], mid[i]], [(0, 1, 2, 3)])
        sb.B.add("roof", False, [mid[i], mid[j], apex], [(0, 1, 2)])
    knob(apex, r=0.04, h=0.1, mat="timber")
    # the crest: a carved board of scrolls along the cap's front, the painted ornament
    if crest:
        zc = zt + 0.1
        prof = []
        for i in range(13):
            s = i / 12
            bump = crest * (0.55 + 0.45 * abs(math.sin(math.pi * s * 3))) * (1 - 0.35 * abs(2 * s - 1))
            prof.append((x0 - ex * 0.5 + (w + ex) * s, zc + bump))
        verts = [V((px, y0 - ex - 0.01, zc)) for px, _ in prof] + [V((px, y0 - ex - 0.01, pz)) for px, pz in prof]
        m = len(prof)
        sb.B.add("redwood", False, verts, [(i, i + 1, m + i + 1, m + i) for i in range(m - 1)])
        for s in (0.08, 0.92):
            px = x0 - ex * 0.5 + (w + ex) * s
            sb.cyl("timber", False, (px, y0 - ex - 0.03, zc + crest * 0.5), (px, y0 - ex + 0.02, zc + crest * 0.5), 0.05, segs=6)


# ---------------------------------------------------------------- the 新酒 pole

def bird_vane(p, length=0.7, facing=-1.0, rise=0.35, mat="timber"):
    """A bird-shaped wind vane on a pole top (as painted on the 新酒 pole): a flat bird in the vertical x-z plane, its
    head toward `facing` (-1 = west), beak out, tail swept up, on a short spindle; double faces (the vane turns)."""
    P = V(p)
    f = facing
    L = length
    outline = [(0.5 * L, 0.02), (0.36 * L, 0.10), (0.18 * L, 0.13), (0.02 * L, 0.10), (-0.18 * L, 0.10 + rise * 0.4),
               (-0.45 * L, rise), (-0.5 * L, rise * 0.85), (-0.28 * L, 0.05), (-0.05 * L, -0.06), (0.25 * L, -0.05),
               (0.42 * L, -0.02)]
    beak = [(0.5 * L, 0.02), (0.68 * L, 0.0), (0.5 * L, -0.03)]
    head = V((P.x + f * 0.46 * L, P.y, P.z + 0.14))
    for poly in (outline, beak):
        vs = [V((P.x + f * a_, P.y, P.z + 0.12 + b_)) for a_, b_ in poly]
        c = sum(vs, V((0, 0, 0))) / len(vs)
        n = len(vs)
        verts = vs + [c]
        faces = [(i, (i + 1) % n, n) for i in range(n)]
        sb.B.add(mat, False, verts, faces)
        sb.B.add(mat, False, verts, [tuple(reversed(fc)) for fc in faces])
    knob(head + V((0, 0, -0.01)), r=0.045, h=0.07, mat="interior")
    _rod(P, P + UP * 0.14, 0.02, mat="timber", segs=4)


def x_frame(c, arm, rise, off, mat="timber"):
    """Two slats crossed in an X in the vertical x-z plane in front of a pole (the 新酒 pole's crossed frame): each
    `arm` m to either side and `rise` m up/down, `off` m south of the pole's axis."""
    c = V(c)
    for sgn in (1, -1):
        a = c + V((-arm, off, -sgn * rise))
        b = c + V((arm, off, sgn * rise))
        k.beam(mat, False, a, b, 0.05, 0.11, 0)
    sb.cyl("rope", False, c + V((0, off - 0.06, 0)), c + V((0, off + 0.06, 0)), 0.07, segs=6, caps=False)


def banner_cloth(left, right, z_top, h, cell, rng, sag=0.04):
    """A banner hung from a yard (the 新酒 banner): the yard from `left` to `right` (plan, viewer's left to right seen
    from the south), the cloth falling `h` m in three gentle folds, its painted face toward the south and a matching
    face toward the north (each read unmirrored), on two cords to the bar above."""
    a, b = V((left[0], left[1], z_top)), V((right[0], right[1], z_top))
    t = (b - a).normalized()
    n = V((t.y, -t.x, 0))           # south for a west -> east yard
    uv = cell_uv(cell)
    cols = 6
    for sgn in (1, -1):
        verts = []
        for i in range(cols + 1):
            f = i / cols
            fold = n * (0.035 * math.sin(f * math.pi * 3)) + n * (0.004 * sgn)
            p = a.lerp(b, f) + fold
            verts += [p - UP * (h + 0.02 * math.sin(f * 7.0)) + n * 0.03, p]
        faces = []
        for i in range(cols):
            if sgn > 0:
                faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
            else:
                faces.append((2 * i + 2, 2 * i, 2 * i + 1, 2 * i + 3))
        if uv:
            (u0, vb), (u1, _), (_, vt), _ = uv
            fuv = []
            for i in range(cols):
                fa, fb = i / cols, (i + 1) / cols
                if sgn < 0:          # seen from the north the cell runs east -> west
                    fa, fb = 1 - fa, 1 - fb
                ua, ub = u0 + (u1 - u0) * fa, u0 + (u1 - u0) * fb
                if sgn > 0:
                    fuv.append([(ua, vb), (ub, vb), (ub, vt), (ua, vt)])
                else:
                    fuv.append([(ub, vb), (ua, vb), (ua, vt), (ub, vt)])
            sb.B.add("signs_rainbow_bridge", False, verts, faces, fuv)
        else:
            sb.B.add("cloth_white", False, verts, faces)
    _rod(a - t * 0.08 + UP * 0.02, b + t * 0.08 + UP * 0.02, 0.022, mat="bamboo")


# ---------------------------------------------------------------- the scaffold's own members

def bound_spire(c, w, z0, apex, rng, legs=4, tie_step=0.38, r=0.032):
    """A spire of bound poles (the 彩楼欢门's tapering spires, painted with many cross-ties; no flowers): `legs` poles
    from a ring of half-width w at z0 (around plan point c) converging to the apex, lashed there, with a ring of
    horizontal ties every tie_step m that narrows toward the tip."""
    C = V((c[0], c[1], z0))
    A = V(apex)
    angs = [math.pi / 4 + i * 2 * math.pi / legs + rng.uniform(-0.1, 0.1) for i in range(legs)]
    feet = [C + V((w * math.cos(a_), w * math.sin(a_), 0)) for a_ in angs]
    for f in feet:
        _rod(f, A, r, segs=4, taper=0.5)
    H = A.z - z0
    n = max(2, int(H / tie_step))
    for i in range(1, n):
        s = i / n
        ring = [f.lerp(A, s) for f in feet]
        for p, q in zip(ring, ring[1:] + ring[:1]):
            _rod(p, q, 0.016, segs=3)
    ki.lashing(A - UP * 0.12, UP, r * 0.8, h=0.18, segs=5)
    _rod(A, A + UP * 0.35, 0.012, segs=3, taper=0.3)


def a_frame(foot_a, foot_b, apex, tie_s=0.55, r=0.035, top_knob=False, rung=0.4):
    """Two poles leaning together into an A (lashed at the apex) with a cross-tie at tie_s of their height and, as
    painted, lighter ties every `rung` m up to the tip (0: none), so it reads as the scroll's ladder-like A-frames."""
    fa, fb, A = V(foot_a), V(foot_b), V(apex)
    _rod(fa, A, r, segs=5, taper=0.6)
    _rod(fb, A, r, segs=5, taper=0.6)
    _rod(fa.lerp(A, tie_s), fb.lerp(A, tie_s), 0.02, segs=4)
    if rung:
        n = int((A.z - fa.z) / rung)
        for i in range(1, n):
            f = i / n
            if abs(f - tie_s) > 0.08 and f < 0.9:
                _rod(fa.lerp(A, f), fb.lerp(A, f), 0.013, segs=3)
    ki.lashing(A - UP * 0.1, UP, r, h=0.16, segs=5)
    if top_knob:
        knob(A, r=0.06, h=0.14, mat="timber")


def diamond_lattice(pts, z0, z1, rng, cell=0.42, r=0.022, mat="bamboo"):
    """A band of diamond lattice (crossed diagonals between two rails) along a closed or open polyline: the scaffold's
    parapet on the gate's roof (painted 16880-17113, v 1255-1320), with no flowers at the crossings."""
    for p, q in zip(pts, pts[1:]):
        A, B = V((p[0], p[1], 0)), V((q[0], q[1], 0))
        L = (B - A).length
        t = (B - A).normalized()
        for zz in (z0, z1):
            _rod(A - t * 0.08 + UP * zz, B + t * 0.08 + UP * zz, 0.03, segs=5)
        n = max(2, int(L / cell))
        for i in range(n):
            pa, pb = A.lerp(B, i / n), A.lerp(B, (i + 1) / n)
            _rod(pa + UP * z0, pb + UP * z1, r, segs=4, mat=mat)
            _rod(pa + UP * z1, pb + UP * z0, r, segs=4, mat=mat)


# ---------------------------------------------------------------- 十千脚店: the composition

ROLES = ("river_hall", "wing", "rear_hall", "gate", "cailou", "chazi", "gate_fence", "lamp_box", "xinjiu_pole")

# choice: the riverside hall's upper storey. Its window wall stands on the line D -2.1 (the doorway figure is mapped
# at D -2.3 standing in the doorway, the pot rack "at the back of the middle bay" at -2.34); the balcony's edge 0.1 m
# behind the footprint's front (-4.1, est at the silk's edge); its bays at the painted posts (u, on the wall line).
HALL_POSTS_U = [15592, 15610, 15681, 15725, 15795, 15861, 15908, 15955, 16028, 16110, 16204, 16296]
HALL_BAYS = ["wall", "window", "open", "open", "doorway", "window", "window", "window", "open", "open", "window"]
# choice: the hall's west end stands clear of S4b's south hall as S4b built it (blender/outer_road_2_scene.py,
# S4b.bld.south_hall_diagonal_15242: walls to x 96.2, its east eave ~0.5 m beyond at z 3.4-3.85, plinth to 96.45),
# which the painting shows overlapping the hall's west end; the painted corner bay west of it (u 15592-15610) is dropped
HALL_WEST_CLEAR = 96.75


def _fp(ent):
    sw, se, ne, nw = (tuple(p) for p in ent["footprint"])
    return sw, se, ne, nw


def _z0(ent, z_at):
    return min(z_at(p[0], p[1]) for p in ent["footprint"]) if ent.get("footprint") else z_at(*ent["pos"])


def _rect(x0, y0, x1, y1):
    return [(round(x0, 3), round(y0, 3)), (round(x1, 3), round(y0, 3)), (round(x1, 3), round(y1, 3)), (round(x0, 3), round(y1, 3))]


def river_hall(mid, ent, z_at, rng, upper_floor):
    """十千脚店's riverside hall (its 楼): a lower storey under the upper floor at `upper_floor` (the frame's measured
    3.83 m); the 平坐 floor with its plain band; a tiled pent roof (腰檐) under the balcony's east part, as painted
    (u 15955-16300); the upper storey's window wall with its painted bays (lattice windows, the open panel, the doorway
    with its partition, the open middle bay with the hanging cloth); the balcony's posts, railing and band of slanted
    slats under the eave; the side gallery under its slatted roof, its railing turning from the balcony's; the big
    歇山 roof. Its north side faces the route: plain walls with a door and windows.
    Returns (rects, upper floor z, info)."""
    sw, se, ne, nw = _fp(ent)
    z0 = _z0(ent, z_at)
    zf = z0 + upper_floor
    y_bal = sw[1] + 0.1                 # choice: the balcony's edge (-4.0)
    y_low = y_bal + 0.1                 # the lower storey's front wall under it
    y_w = y_bal + 1.9                   # choice: the upper window wall (-2.1), see HALL_POSTS_U
    y_b = nw[1] - 0.2                   # choice: the back wall (1.69), 1.5 m short of the route's edge
    xs = [u_to_x(u, y_w) for u in HALL_POSTS_U]
    bays = list(HALL_BAYS)
    if xs[0] < HALL_WEST_CLEAR:          # start at the clear line; the bay it falls in keeps its kind
        i = next(j for j, x in enumerate(xs) if x > HALL_WEST_CLEAR + 0.3)
        xs, bays = [HALL_WEST_CLEAR] + xs[i:], bays[i - 1:]
    x_w, x_e = xs[0], xs[-1]            # the upper storey, painted 15592-16296: X 96.3-105.5 (built from 96.75)
    x_g = x_e + 1.5                     # choice: the side gallery 1.5 m wide (its two figures at X 106.3-106.7)
    z_low = z0 + upper_floor - 0.48     # the lower storey's wall top, under the 平坐 band
    z_top = zf + 2.75                   # choice: the upper wall's head (a real storey: 2.75 m)
    z_eave = zf + 3.27                  # the upper eave, 7.1 m (sw_eave measured 7.27 at the est base)
    z_ridge = z0 + 8.6                  # choice: the ridge (painted 8.5 at the roof's est depth; a 24 deg roof)
    with sb.entity(mid):
        # -- the lower storey: plain walls (not painted; hidden by the bottom-edge trees), timber posts at the bays
        fr = [(x - x_w) / (x_g - x_w) for x in xs[1:]]
        plaster_wall((x_w, y_low), (x_g, y_low), z0, z_low, rng, posts=fr)
        plaster_wall((x_g, y_b), (x_w, y_b), z0, zf - 0.1, rng, posts=[0.33, 0.66],
                     openings=[(0.18, 0.27, "window"), (0.45, 0.54, "door"), (0.72, 0.81, "window")])
        plaster_wall((x_w, y_b), (x_w, y_low), z0, zf - 0.1, rng, posts=[0.5])
        plaster_wall((x_g, y_low), (x_g, y_b), z0, z_low, rng, posts=[0.5])
        _tick("lower storey")
        # -- the pent roof (腰檐) under the balcony's east part, as painted: 1.0 m out, its eave 1.3 m under the floor
        xp0, xp1 = u_to_x(15955, y_low), min(u_to_x(16300, y_low), x_g + 0.1)
        ki.lean_to(xp0, xp1, y_low - 1.0, y_low + 0.05, zf - 1.3, zf - 0.55, ns=8, nt=3)
        _tick("pent roof")
        # -- the upper floor (平坐): the slab people stand on, its plain band along the front and the gallery's side
        platform_floor(x_w - 0.12, x_g + 0.05, y_bal, y_b + 0.08, zf, band=0.45, band_sides=("y0", "x1"))
        _tick("floor")
        # -- the upper storey's window wall and its ends
        cols = [(x - x_w) / (x_e - x_w) for x in xs]
        kinds = ["open" if b_ in ("open", "doorway") else b_ for b_ in bays]
        ki.wall_bays((x_w, y_w), (x_e, y_w), zf, z_top, cols, kinds, rng, mat="plaster", sill=0.8, head=zf + 2.25)
        k.board("plaster", False, (x_w, y_w), (x_e, y_w), 0.14, z_top, z_top + 0.95)       # frieze up under the roof
        k.board("plaster", True, (x_w, y_w), (x_w, y_b), 0.14, zf, z_top + 0.3)
        plaster_wall((x_e, y_w), (x_e, y_b), zf, z_top, rng, openings=[(0.3, 0.5, "window")], plinth=0)
        plaster_wall((x_e, y_b), (x_w, y_b), zf, z_top + 0.25, rng, posts=[0.25, 0.5, 0.75],
                     openings=[(0.12, 0.2, "window"), (0.4, 0.48, "window"), (0.66, 0.74, "window")], plinth=0)
        # the dark rooms behind the open bays and the doorway: a colliding board (nobody walks into an empty box)
        opens = [(xs[i], xs[i + 1]) for i, b_ in enumerate(bays) if b_ in ("open", "doorway")]
        for xa, xb in opens:
            k.board("interior", True, (xb, y_w + 0.9), (xa, y_w + 0.9), 0.06, zf, z_top)
        # the doorway's plain partition (u 15837-15860) and the middle bay's small hanging cloth (u 16110-16125)
        k.board("timber", False, (u_to_x(15837, y_w), y_w + 0.05), (u_to_x(15860, y_w), y_w + 0.05), 0.04, zf, zf + 1.9)
        xc0, xc1 = u_to_x(16110, y_w), u_to_x(16125, y_w) + 0.12
        ki.quad2("cloth_white", V((xc0, y_w - 0.1, zf + 1.55)), V((xc1, y_w - 0.1, zf + 1.55)),
                 V((xc1, y_w - 0.1, zf + 2.2)), V((xc0, y_w - 0.1, zf + 2.2)))
        _tick("upper walls")
        # -- the balcony: posts at the bays carry the front beam; slanted slats up to the eave; the railing
        y_p = y_bal + 0.06
        for x in xs + [x_g]:
            k.post("redwood", False, x, y_p, zf, zf + 2.55, 0.13, 0)
        k.beam("redwood", False, (x_w - 0.3, y_p, zf + 2.6), (x_g + 0.15, y_p, zf + 2.6), 0.16, 0.2, 0)
        _tick("balcony posts")
        slat_band((x_w - 0.2, y_p), (x_e + 0.5, y_p), zf + 2.7, z_eave - 0.15, 0.3, step=0.3)
        _tick("slat band")
        y_gn = y_b - 0.05
        rail([(x_w + 0.05, y_w - 0.1), (x_w + 0.05, y_p), (x_g, y_p), (x_g, y_gn)], zf, h=0.85, corner_knob=2)
        _tick("railing")
        # -- the side gallery: its posts and slatted roof from the hall's east wall down to the gallery's edge
        for y in (y_p, (y_p + y_gn) / 2, y_gn):
            k.post("redwood", False, x_g, y, zf, zf + 2.05, 0.12, 0)
        k.beam("timber", False, (x_g, y_p - 0.2, zf + 2.1), (x_g, y_gn + 0.2, zf + 2.1), 0.12, 0.14, 0)
        slat_roof(x_e + 0.3, x_g + 0.3, y_p - 0.25, y_gn + 0.15, zf + 2.6, zf + 2.05, step=0.19, rng=rng)
        k.board("plaster", True, (x_e, y_gn), (x_g, y_gn), 0.12, zf, zf + 2.1)
        _tick("gallery")
        # -- the 歇山 roof over the upper storey, its gable over the east end above the gallery
        # as painted: the ridge runs nearly the eave's whole length (painted X 96.5-106.5 at its est depth: the west
        # hip's foot straight below the ridge's end, the east gable over the gallery), short steep hip skirts under
        # small gables; the eave from 0.5 m past the west wall to 1.05 m past the east wall, over the gallery's
        # inner half (the gallery's slatted roof comes out from under it)
        xieshan(x_w - 0.5, x_e + 1.05, y_bal - 0.35, y_b + 0.7, z_eave, z_ridge, rng=rng, ns=10, nt=4, lift=0.25,
                rafter_sides=("y0", "y1"), ornaments=(0.75, 0.75), ridge_in=0.75)
        _tick("roof")
    rects = [_rect(x_w, y_low, x_g, y_b)]
    info = {"x_w": x_w, "x_e": x_e, "x_g": x_g, "y_bal": y_bal, "y_w": y_w, "y_b": y_b, "zf": zf}
    return rects, zf, info


def wing(mid, ent, z_at, rng, x_west, upper_floor_foot=3.55):
    """The wing with the long receding roof: no wall of it is painted (bare ground under its east eave, with the 杈子),
    so plain walls stand inside the placeholder footprint; its ridge runs back north from the south gable at the silk's
    edge (an ornament there) to a finial at its north end; the east slope comes down to an eave with drip tiles along
    the forecourt; its west eave meets the riverside hall."""
    sw, se, ne, nw = _fp(ent)
    z0 = _z0(ent, z_at)
    x0 = x_west                          # choice: shares the riverside hall's east wall (no gap)
    # choice: the painted east eave (16880, 1508) -> (16602, 1787) at a real eave height (3.1 m) lies on X ~113.6, just
    # inside the 杈子; the east wall stands 1.15 m in from it, so bare ground lies under the eave as painted. The
    # placeholder footprint put the wall at X 110.6, which left a 3 m gap the scroll doesn't paint (recorded under how)
    z_e = 3.1                            # choice: the east eave's height
    d_e = (_frame()["o"][1] - _frame()["h"] * z_e - 1508) / -_frame()["dv"]     # the NE eave corner's depth at it
    x_eave_e = min(u_to_x(16880, d_e), 113.55)   # 114.3 painted; kept 0.4 m short of the 杈子 (X 113.94)
    x1 = x_eave_e - 1.15
    y0, y1 = sw[1] + 0.99, nw[1] + 0.06  # choice: the south gable wall 0.4 m behind the two bare trees painted at the
    #                                      bottom edge in front of it (D -4.04); north: the rear hall's south wall
    zw = z0 + 3.0                        # choice: a single storey, wall head 3.0
    zr = z0 + 5.0                        # choice: ridge 5.0 (painted 4.3 at its south end, 5.3 at its north finial)
    # the painted ridge (16420, 1470) -> (16710, 1160) at 5.0 m: X 109.3-109.7
    xr = (scan_to_world(16420, 1470 - 0, (1565 - 77 * 5.0 - 1470) / 51.25)[0]
          + scan_to_world(16710, 1160, (1565 - 77 * 5.0 - 1160) / 51.25)[0]) / 2
    slope = (zr - (z0 + z_e)) / (x_eave_e - xr)
    with sb.entity(mid):
        plaster_wall((x1, y0), (x1, y1), z0, zw, rng, posts=[0.5], openings=[(0.2, 0.36, "window"), (0.6, 0.74, "door")])
        plaster_wall((x0, y0), (x1, y0), z0, zw, rng, posts=[0.5])
        plaster_wall((x1, y1), (x0, y1), z0, zw, rng)
        # the south gable's plaster triangle over the wall
        sb.B.add("plaster", False, [V((x0, y0 - 0.01, zw)), V((x1, y0 - 0.01, zw)), V((xr, y0 - 0.01, zr - 0.15))], [(0, 1, 2)])
        # the west eave tucks under the riverside hall's upper floor (its slab's foot at 3.71)
        gable_roof((xr, y1 - 0.25), (xr, y0), w_l=x_eave_e - xr, w_r=xr - x0 + 0.05, z_ridge=zr,
                   z_l=z0 + z_e, z_r=min(zr - slope * (xr - x0 + 0.05), z0 + upper_floor_foot), over=0.4, ns=6, nt=3,
                   rafter_sides=("l",), ends=("curl", "curl"), end_s=0.5)
    return [_rect(x0, y0, x1, y1)]


def rear_hall(mid, ent, z_at, rng):
    """The rear hall behind the wing: an east-west ridge with a round knob at its east end, its east verge (barge board)
    straight down from the ridge's end; its north wall faces the route, with a door and windows."""
    sw, se, ne, nw = _fp(ent)
    z0 = _z0(ent, z_at)
    x0, x1 = sw[0], se[0]                # 107.76 .. 111.93
    y0, y1 = sw[1] + 0.1, nw[1] - 0.15   # choice: 0.5 .. 3.75 (0.85 m short of the route's edge)
    zw = z0 + 3.05                       # choice
    zr = z0 + 5.2                        # choice: above the wing's ridge (5.0), as the painting shows it behind
    with sb.entity(mid):
        plaster_wall((x1, y1), (x0, y1), z0, zw, rng, posts=[0.5],
                     openings=[(0.14, 0.3, "window"), (0.42, 0.58, "door"), (0.7, 0.86, "window")])
        plaster_wall((x0, y1), (x0, y0), z0, zw, rng)
        plaster_wall((x1, y0), (x1, y1), z0, zw, rng)
        plaster_wall((x0, y0), (x1, y0), z0, zw, rng)
        yc = (y0 + y1) / 2
        for x in (x0 - 0.01, x1 + 0.01):
            tri = [V((x, y0, zw)), V((x, y1, zw)), V((x, yc, zr - 0.12))]
            sb.B.add("plaster", False, tri if x > x0 else list(reversed(tri)), [(0, 1, 2)])
        gable_roof((x0, yc), (x1, yc), w_l=yc - y0 + 0.55, w_r=y1 - yc + 0.55, z_ridge=zr, z_l=z0 + 3.15,
                   z_r=z0 + 3.15, over=0.4, ns=6, nt=3, rafter_sides=("l", "r"), ends=(None, "knob"), end_s=0.55)
    return [_rect(x0, y0, x1, y1)]


def gate(mid, ent, z_at, rng):
    """十千脚店's gate (门楼): an open gatehouse under a flat-topped roof with a red fascia, which carries the 彩楼欢门.
    The front: a hanging post (垂柱) at the west corner ending in a carved knob in mid-air, the painted posts to the
    ground (two thin ones and the heavy east corner post with its board), the valance of fine vertical pleats under
    the front eave, the small board of marks over the lamp-box. The east side: the striped curtain gathered and tied at
    the front post, the slatted panel with a curved top, the board under the east eave. The west side: a carved door
    leaf standing open. Returns the roof's deck (x0, x1, y0, y1, z) and the posts."""
    sw, se, ne, nw = _fp(ent)
    z0 = _z0(ent, z_at)
    h = ent.get("heights", {})
    z_e = z0 + sum(h.values()) / max(1, len(h)) if h else z0 + 5.45   # the measured eave, 5.49 (an upper bound)
    S = strokes(mid)
    ex0, ex1 = min(sw[0], nw[0]), max(se[0], ne[0])
    ey0, ey1 = sw[1], nw[1]
    y_f = ey0 + 0.49                     # choice: the front posts' line (-4.0), under the eave 0.5 m in
    y_k = ey1 - 0.42                     # choice: the back posts (-1.3)
    x_e = u_to_x(17150, y_f)             # the heavy east post (u 17136-17164): X 118.1
    x_w = u_to_x(16917, y_f) + 0.03      # the west side on the hanging post's line (u 16917): X 115.1
    z_b = z_e - 0.5                      # the eave beam's soffit
    deck = None
    with sb.entity(mid):
        # posts to the ground: the heavy east front post, the two thin posts (u 17075, 17106), the back corners, and a
        # west post behind the door leaf carrying the cantilever of the hanging post
        for x, y, r in ((x_e, y_f, 0.15), (x_e, y_k, 0.13), (x_w, y_k, 0.13), (x_w, y_f + 1.55, 0.12)):
            k.column(x, y, z0, z_b, r=r, mat="redwood", rng=rng)
        for u in (17075, 17106):
            k.post("redwood", True, u_to_x(u, y_f), y_f, z0, z_b - 0.05, 0.1, 0)
        # the eave beams round the gate (red), and the cantilevers under the roof's corners
        for p, q in (((x_w - 0.3, y_f), (x_e + 0.3, y_f)), ((x_w - 0.3, y_k), (x_e + 0.3, y_k)),
                     ((x_w, y_f - 0.3), (x_w, y_k + 0.3)), ((x_e, y_f - 0.3), (x_e, y_k + 0.3))):
            k.beam("redwood", False, (p[0], p[1], z_b + 0.12), (q[0], q[1], z_b + 0.12), 0.18, 0.24, 0.02)
        # the hanging post (垂柱) at the west front corner: its knob at the painted foot (u 16917, v 1545)
        pk = S.get("pendant_w_foot", [16917, 1545])
        _, _, zk = scan_to_world(pk[0], pk[1], y_f)
        hanging_post(x_w, y_f, z_b, z0 + zk, r=0.085)
        # the valance under the front eave (painted 16893-17153, v 1385-1450): 0.75 m deep, fine pleats
        pleated_blind((u_to_x(16893, y_f), y_f - 0.08), (u_to_x(17153, y_f) - 0.1, y_f - 0.08), z_b, 0.75, rng)
        # the boards: □□□□ on the heavy east post, □□ under the east eave, the □□ marks over the lamp-box
        hanging_board((x_e - 0.14, y_f - 0.17), (x_e + 0.14, y_f - 0.17), z0 + 2.35, z0 + 3.85, "gate_board_4")
        xb0 = u_to_x(17277, y_k)
        hanging_board((xb0, y_k - 0.16), (xb0 + 0.36, y_k - 0.16), z0 + 2.6, z0 + 3.65, "gate_board_2")
        xm0 = u_to_x(17010, y_f)         # painted u 17010-17035
        hanging_board((xm0 - 0.04, y_f - 0.12), (xm0 - 0.04 + 0.34, y_f - 0.12), z_b - 1.35, z_b - 0.79, "gate_marks_2",
                      cords=z_b - 0.75)
        # the striped curtain on the east side, gathered and tied at the front post (painted 17180-17260, v 1380-1650)
        # choice: hung on the front 1.1 m of the east side, tied at 2.4 m (painted gathered at about v 1500-1560)
        swag_curtain((x_e + 0.02, y_f + 0.12), (x_e + 0.02, y_f + 1.2), z_b - 0.05, z0 + 0.6, rng, gather="a",
                     tie_z=z0 + 2.4, stripes=4, mat="cloth_indigo")
        # the slatted panel with a curved top between the curtain and the east back post (u 17257-17325, v 1430-1600)
        lattice_panel((x_e + 0.05, y_k - 0.95), (x_e + 0.05, y_k - 0.12), z0 + 0.8, z0 + 2.75, rng)
        # the carved door leaf at the west side, standing open (u 16965-17000, v 1595-1690)
        carved_leaf((x_w, y_f + 1.4), (x_w + 1.0, y_f + 1.4), z0, z0 + 2.3, 0.46, rng)
        # the roof: a flat top carrying the scaffold; red fascia; corner sweeps; rafter ends on the seen sides
        deck = flat_top_roof(ex0, ex1, ey0, ey1, z_e, z_e + 0.33, 0.33, rng, lift=0.2, ns=6, nt=2,
                             rafter_sides=("y0", "x1", "y1"))
    return deck, {"x_w": x_w, "x_e": x_e, "y_f": y_f, "y_k": y_k, "z_e": z_e}


# The 彩楼欢门's poles (structures_w's pole-by-pole record, map/strokes/S3.json custom pts): name -> (form, depth D of
# the painted top, extra). choice: every D (the strokes can't give depth): the front (west) poles on the scaffold's
# front face, the east ones further back, so each stands on the gate's roof; X and H follow from the frame.
POLES = {
    "pole1": ("plain", -4.0, {"lean_foot": True}),    # tall single pole at the west, slightly leaning west
    "pole2": ("fan", -4.0, {}),                       # fans out west from tier 2's west end
    "pole3": ("fan", -4.0, {}),                       # fans out west, lower
    "pole4": ("aframe", -4.0, {"legs_u": (16910, 16940), "tie_v": 920}),
    "pole5": ("lean", -3.8, {"foot_u": 16975}),       # leans west off the west spire
    "pole6": ("lean", -3.8, {"foot_u": 16985}),       # short leaning pole beside pole5
    "pole7": ("spire", -3.7, {"base_u": (16958, 17045), "base_v": 956}),     # the west spire
    "pole8": ("plain", -4.0, {}),                     # second-tallest plain pole, out of the west spire
    "pole9": ("aframe", -3.3, {"w": 0.22, "knob": True}),   # A-frame leaning east, a knob at its top
    "pole10": ("plain", -3.4, {}),                    # tall plain pole in the middle
    "pole11": ("spire", -2.8, {"w": 0.36}),           # the middle spire, paired ties
    "pole12": ("spire", -2.2, {"w": 0.36}),           # the east spire
    "pole13": ("aframe", -1.9, {"w": 0.22}),
    "pole14": ("spire", -1.6, {"w": 0.28}),           # a short spire
    "pole15": ("plain", -1.7, {}),                    # the tallest, plain, a wrapped joint (v 805-850)
    "pole16": ("fan", -2.5, {}),                      # fans out east
    "pole17": ("fan", -2.4, {}),
    "pole18": ("fan", -2.2, {}),
}


def cailou(mid, ent, deck, rng, z_ground=0.0):
    """十千脚店's 彩楼欢门 on the gate's roof: a cage of lashed poles on the roof's deck (a diamond-lattice parapet, then
    posts tied by the four painted tiers of ledgers, the dense band of short uprights between the tiers), and above it
    the eighteen painted poles (plain tall poles, fans splaying west and east from the tiers' ends, A-frames, and the
    three tapering spires of bound poles with many ties), every joint lashed. No flowers, streamers or lamps (as
    painted). Built with kit_inner_city.cailou (poles, ledgers, braces and their lashings, flowers=(), streamers=(),
    lanterns=()) plus the new parts here (the lattice parapet without flowers, bound spires, A-frames).
    Returns the scaffold's tie point for the 新酒 bar (the cage's north-east post) and the cage."""
    S = strokes(mid)
    a0, a1, b0, b1, zp = deck
    cx0, cx1 = a0 + 0.05, a1 - 0.05      # the cage's posts stand on the deck's edge
    cy0, cy1 = b0 + 0.05, b1 - 0.05
    yf = cy0                             # its front face (the painted tiers lie on it)

    def tier_z(name):
        return z_ground + scan_to_world(*_uv(S[name + "_w"]), yf)[2]

    zt = [tier_z(t) for t in ("tier1", "tier2", "tier3", "tier4")]      # 10.2, 9.5, 9.0, 8.5 above the ground
    lat_top = z_ground + scan_to_world(16880, 1255, yf)[2]               # the parapet's top, painted v 1255
    lat_top = max(zp + 0.6, min(lat_top, zp + 0.95))
    ztop_cage = max(zt)
    # the tiers' painted ends: tier 2 (the widest) runs out further west; all run past the east posts at the back
    xw_t = {t: u_to_x(S[t + "_w"][0], yf) for t in ("tier1", "tier2", "tier3", "tier4")}
    xe_back = u_to_x(S["tier2_e"][0], cy1)
    with sb.entity(mid):
        # -- the cage: posts (corners, front and back middles, side middles), ledgers at the parapet top and the tiers
        xm = (cx0 + cx1) / 2
        ym = (cy0 + cy1) / 2
        posts = [(cx0, cy0), (xm, cy0), (cx1, cy0), (cx1, ym), (cx1, cy1), (xm, cy1), (cx0, cy1), (cx0, ym)]
        P = [(x, y, ztop_cage + 0.25 - zp, 0.05) for x, y in posts]
        # the plain tall poles stand on the deck too (their painted tops; the line through the painted foot where given)
        braces, extra_poles = [], []
        for name, (form, D, ex) in POLES.items():
            top = S.get(name + "_top")
            if not top:
                continue
            X, _, Ht = scan_to_world(*_uv(top), D)
            Ht += z_ground
            if form == "plain":
                foot = S.get(name)
                if foot and len(foot) >= 2:
                    Xf, _, Hf = scan_to_world(float(foot[0]), float(foot[1]), D)
                    Hf += z_ground
                    # extend the line top -> painted foot down to the deck, then keep the foot on the deck
                    k_ = (X - Xf) / max(0.1, Ht - Hf)
                    xd = Xf - k_ * (Hf - zp)
                else:
                    xd = X
                xd = min(max(xd, cx0), cx1)
                if ex.get("lean_foot") or abs(xd - X) > 0.08:
                    braces.append(((xd, D, zp), (X, D, Ht), 0.055))
                else:
                    extra_poles.append((X, D, Ht - zp, 0.06))
        P += extra_poles
        # ledgers: the parapet's top ring and the four tiers round the cage, running past the posts at their ends
        beams = []
        rings = [lat_top - zp] + [z - zp for z in zt]
        for i, z in enumerate(rings):
            west = cx0 - 0.1 if i == 0 else min(cx0 - 0.1, xw_t[("tier1", "tier2", "tier3", "tier4")[i - 1]])
            east = cx1 + 0.1 if i == 0 else max(cx1 + 0.1, xe_back)
            beams.append(((west, cy0, z), (east, cy0, z)))
            beams.append(((west, cy1, z), (east, cy1, z)))
            beams.append(((cx0, cy0 - 0.12, z), (cx0, cy1 + 0.12, z)))
            beams.append(((cx1, cy0 - 0.12, z), (cx1, cy1 + 0.12, z)))
        # X-braces in the cage's lower storey (between the parapet and tier 4), on all four faces
        zb0, zb1 = lat_top - zp + 0.05, min(rings[1:]) - 0.05
        brace_list = []
        for (pa, pb) in (((cx1, cy0), (cx1, cy1)), ((cx0, cy1), (xm, cy1)), ((xm, cy1), (cx1, cy1)),
                         ((cx0, cy0), (cx0, cy1))):     # none on the front face (not painted there)
            brace_list.append(((pa[0], pa[1], zb0), (pb[0], pb[1], zb1)))
            brace_list.append(((pa[0], pa[1], zb1), (pb[0], pb[1], zb0)))
        with k.placed(k.frame(0, 0, zp)):
            ki.cailou(P, beams, brace_list, rng, flowers=(), lanterns=(), streamers=(), lattice=None, spires=False)
        # the leaning plain poles (pole1 and any whose painted foot leans), lashed where they pass the ledgers
        for (xf, yf_, zf_), (xt, yt, zt_), r in braces:
            _rod((xf, yf_, zf_ - 0.05), (xt, yt, zt_), r, segs=6, taper=0.55)
            for z in rings:
                zz = zp + z
                if zf_ < zz < zt_:
                    s = (zz - zf_) / (zt_ - zf_)
                    ki.lashing(V((xf, yf_, zf_)).lerp(V((xt, yt, zt_)), s), UP, r, h=0.2, segs=5)
        # the dense uprights the scroll paints between the tiers (and down to the parapet on the seen faces): light
        # poles every ~0.4 m on all four faces, the front and east ones from the parapet's top to over tier 1
        zlo, zhi = min(zt), max(zt)
        for (pa, pb), z_from in ((((cx0, cy0), (cx1, cy0)), lat_top), (((cx1, cy0), (cx1, cy1)), lat_top),
                                 (((cx0, cy1), (cx1, cy1)), zlo), (((cx0, cy0), (cx0, cy1)), zlo)):
            A, B = V((pa[0], pa[1], 0)), V((pb[0], pb[1], 0))
            n = max(3, int((B - A).length / 0.4))
            for i in range(1, n):
                c = A.lerp(B, i / n)
                if min(abs(c.x - xm), abs(c.y - ym)) < 0.12:
                    continue                  # a cage post stands there
                _rod((c.x, c.y, z_from - 0.05), (c.x, c.y, zhi + rng.uniform(0.25, 0.6)), 0.024, segs=4, taper=0.7)
        # the diamond-lattice parapet on the deck (no flowers)
        diamond_lattice([(cx0, cy0), (cx1, cy0), (cx1, cy1), (cx0, cy1), (cx0, cy0)], zp + 0.08, lat_top - 0.02, rng,
                        cell=0.36, r=0.028)
        # -- the fans, leaners, A-frames and spires, from their painted tops
        for name, (form, D, ex) in POLES.items():
            top = S.get(name + "_top")
            if not top or form == "plain":
                continue
            X, _, Ht = scan_to_world(*_uv(top), D)
            T = V((X, D, Ht + z_ground))
            if form == "fan":
                foot = S.get(name)
                if foot and len(foot) >= 2:
                    Xf, _, Hf = scan_to_world(float(foot[0]), float(foot[1]), D)
                else:
                    Xf, Hf = (cx0 if X < xm else cx1), zt[1] - z_ground
                F = V((min(max(Xf, cx0 - 0.4), cx1 + 0.4), min(max(D, cy0), cy1), Hf + z_ground))
                # the fan springs from the tiers' end and is lashed to the tier below it too
                dirv = (T - F).normalized()
                F0 = F - dirv * min(1.1, (F.z - (zt[3] + 0.05)) / max(0.2, dirv.z))
                _rod(F0, T, 0.04, segs=5, taper=0.5)
                ki.lashing(F, dirv, 0.04, h=0.18, segs=5)
                ki.lashing(F0 + dirv * 0.1, dirv, 0.04, h=0.16, segs=5)
            elif form == "lean":
                xf = u_to_x(ex["foot_u"], D)
                F = V((min(max(xf, cx0), cx1), min(max(D, cy0), cy1), zt[0]))
                _rod(F - (T - F).normalized() * 0.6, T, 0.035, segs=5, taper=0.5)
                ki.lashing(F, (T - F), 0.035, h=0.16, segs=5)
            elif form == "aframe":
                w = ex.get("w", 0.2)
                if "legs_u" in ex:
                    la, lb = (u_to_x(u, D) for u in ex["legs_u"])
                else:
                    la, lb = X - w, X + w
                yA = min(max(D, cy0), cy1)
                fa, fb = V((la, yA, zt[0])), V((lb, yA, zt[0]))
                tie = 0.55
                if "tie_v" in ex:
                    zt_tie = scan_to_world(top[0], ex["tie_v"], D)[2] + z_ground
                    tie = max(0.2, min(0.85, (zt_tie - zt[0]) / max(0.3, T.z - zt[0])))
                a_frame(fa, fb, T, tie_s=tie, top_knob=ex.get("knob", False))
            elif form == "spire":
                if "base_u" in ex:
                    xa, xb = (u_to_x(u, D) for u in ex["base_u"])
                    c = ((xa + xb) / 2, D)
                    w = (xb - xa) / 2 * 0.8
                    zb = zt[0]               # on tier 1 (painted base v 956, tier 1 v 987)
                else:
                    c, w, zb = (X, D), ex.get("w", 0.35), zt[0]
                c = (min(max(c[0], cx0 + w * 0.5), cx1 - w * 0.5), min(max(c[1], cy0 + w * 0.5), cy1 - w * 0.5))
                bound_spire(c, w, zb, T, rng)
        # pole15's wrapped joint (v 805-850)
        t15 = S.get("pole15_top")
        if t15:
            for v in (812, 840):
                X, D, Hj = scan_to_world(t15[0] + 8, v, POLES["pole15"][1])
                ki.lashing(V((X, D, Hj + z_ground)), UP, 0.06, h=0.14, segs=5)
    tie = V((cx1, cy1, 0))
    return tie, {"x": (cx0, cx1), "y": (cy0, cy1), "z": (zp, ztop_cage), "tiers": zt, "parapet": lat_top}


def xinjiu_pole(mid, ent, tie, z_at, rng, cage):
    """The 新酒 pole: a tall pole (its foot hidden behind the 串车's load, est) topped by a short crossbar and a bird vane
    (head west), an X-frame of two slats lower down; the long bar from the pole west to the scaffold, lashed to its
    north-east post, with a stay from the bar up to the pole; the banner (新酒 in the light panel of its middle band)
    hangs from its own yard under the bar's east half, facing south as painted.
    choice: the bar is level at the height painted at the pole (v 905: 6.4 m); painted, it is level across the picture
    from a pole at D 3.2 to a scaffold at D <= -0.9, which no level bar can be (it would climb 2.9 m), so it meets the
    scaffold 2.9 m lower than its painted tie (recorded)."""
    S = strokes(mid)
    bx, by = ent["pts"]["base"][0], ent["pts"]["base"][1]
    z0 = z_at(bx, by)
    D = by
    top = S.get("top", [17605, 707])
    Xt, _, Ht = scan_to_world(*_uv(top), D)
    T = V((Xt, D, z0 + Ht))
    Fb = V((bx, by, z0))
    with sb.entity(mid):
        k.soft_box("stone", True, (bx - 0.22, by - 0.22, z0 - 0.06), (bx + 0.22, by + 0.22, z0 + 0.16), rng, r=0.05, wob=0.01)
        sb.cyl("timber", True, Fb, T, 0.1, 0.065, segs=8)

        def on_pole(z):
            s = (z - Fb.z) / (T.z - Fb.z)
            return Fb.lerp(T, s)
        # the crossbar (v 739) and the vane on the top (beak (17582, 708), tail up to (17637, 678))
        zc = z0 + scan_to_world(top[0], S.get("crossbar", [17605, 739])[1], D)[2]
        c = on_pole(zc)
        k.beam("timber", False, c - V((0.2, 0, 0)), c + V((0.2, 0, 0)), 0.05, 0.06, 0)
        vw, ve = S.get("vane_w", [17582, 708]), S.get("vane_e", [17637, 678])
        L = abs(u_to_x(ve[0], D) - u_to_x(vw[0], D))
        bird_vane(T, length=max(0.5, min(0.9, L)), facing=-1.0, rise=0.3)
        # the X-frame (centre (17607, 818), arms 17570-17650, v 785-850)
        xf = S.get("xframe", [17607, 818])
        zx = z0 + scan_to_world(xf[0], xf[1], D)[2]
        arm = (u_to_x(17650, D) - u_to_x(17570, D)) / 2
        x_frame(on_pole(zx), arm, (850 - 785) / 77 / 2, -0.09)
        # the bar (v 905 at the pole), level, to the scaffold's north-east post
        zb = z0 + scan_to_world(*_uv(S.get("bar_e", [17607, 905])), D)[2]
        A = on_pole(zb)
        Bt = V((tie.x, tie.y, zb))
        _rod(A + (A - Bt).normalized() * 0.15, Bt + (Bt - A).normalized() * 0.12, 0.055, mat="bamboo", segs=6)
        ki.lashing(A, (Bt - A), 0.055, h=0.2, segs=6)
        ki.lashing(Bt, (Bt - A), 0.055, h=0.2, segs=6)
        # the stay from the bar (u 17500) up to the pole under the X-frame

        def bar_at_u(u):
            # the point on the bar whose projection has scan u (bisection along the bar)
            lo, hi = 0.0, 1.0
            for _ in range(30):
                m = (lo + hi) / 2
                p = A.lerp(Bt, m)
                if world_to_scan(p.x, p.y, p.z - z0)[0] > u:
                    lo = m
                else:
                    hi = m
            return A.lerp(Bt, (lo + hi) / 2)
        s0 = bar_at_u(17500)
        _rod(s0, on_pole(zx - 0.55), 0.02, mat="rope", segs=4)
        # the banner on its yard under the bar: centred where the painted banner is (u 17428-17562), 1.5 x 2.3 m
        bn = [S.get(kk) for kk in ("banner_nw", "banner_ne", "banner_sw")]
        uc = (bn[0][0] + bn[1][0]) / 2 if bn[0] and bn[1] else 17495
        cpt = bar_at_u(uc)
        w = 1.5                            # choice: painted 134 px wide (1.3-1.75 m)
        hb = 2.3                           # choice: painted 210 px long (2.1-2.7 m)
        left = (cpt.x - w / 2, cpt.y)
        right = (cpt.x + w / 2, cpt.y)
        zy = zb - 0.16
        banner_cloth(left, right, zy, hb, "xinjiu_banner", rng)
        for x in (left[0] + 0.1, right[0] - 0.1):
            q = bar_at_u(world_to_scan(x, cpt.y, zb - z0)[0])
            _rod(V((x, cpt.y, zy + 0.02)), q, 0.008, mat="rope", segs=3)
    return {"bar": (tuple(A), tuple(Bt)), "banner_c": tuple(cpt)}


def shiqian_jiaodian(ents, z_at, rng, upper_floor=3.83):
    """十千脚店 from its layout entities.
    ents: {role: (map_id, entity)} with the roles 'river_hall', 'wing', 'rear_hall', 'gate', 'cailou', 'chazi',
          'gate_fence', 'lamp_box', 'xinjiu_pole' (entity = sections/rainbow_bridge/layout.json entities[map_id]).
    z_at: (X, D) -> the ground's z there (the builder's heightfield; flat 0 in your tests).
    Builds each role's pieces inside sb.entity(map_id) into the current bucket set (street_b1.B).
    Returns {"rects": {map_id: [[(x, y), (x, y), (x, y), (x, y)], ...]},   # closed walls in world XY (inside check)
             "upper_floor_z": z of the balcony floor's top,
             "tris": {map_id: triangles}}."""
    before = dict(sb.B.tris)
    PARTS.clear()
    out = {"rects": {}, "upper_floor_z": None, "tris": {}, "notes": []}
    ids = {r: ents[r][0] for r in ROLES if r in ents}

    if "river_hall" in ents:
        mid, e = ents["river_hall"]
        rects, zf, hinfo = river_hall(mid, e, z_at, rng, upper_floor)
        out["rects"][mid] = rects
        out["upper_floor_z"] = zf
        x_west = hinfo["x_g"]
    else:
        x_west = ents["wing"][1]["footprint"][0][0]
    if "wing" in ents:
        mid, e = ents["wing"]
        out["rects"][mid] = wing(mid, e, z_at, rng, x_west, upper_floor_foot=upper_floor - 0.28)
    if "rear_hall" in ents:
        mid, e = ents["rear_hall"]
        out["rects"][mid] = rear_hall(mid, e, z_at, rng)
    deck = None
    if "gate" in ents:
        mid, e = ents["gate"]
        deck, ginfo = gate(mid, e, z_at, rng)
        out["rects"][mid] = []          # an open gatehouse: posts only, no closed wall
    tie, cage = None, None
    if "cailou" in ents and deck:
        mid, e = ents["cailou"]
        zg = _z0(ents["gate"][1], z_at)
        tie, cage = cailou(mid, e, deck, rng, z_ground=zg)
    if "chazi" in ents:
        mid, e = ents["chazi"]
        ln = e["lines"]["foot"]
        a, b = ln[1] if len(ln) > 2 else ln[0], ln[-1]
        # the post box (cap painted at (16905, 1620-1660)): where the painted foot line passes u 16905
        S = strokes(mid)
        pc = S.get("post_cap", [16905, 1640])
        fl = [q for q in S.get("line", []) if len(q) >= 2 and not (len(q) > 2 and q[2] == "est")] or [[16820, 1788], [16956, 1636]]
        (u1_, v1_), (u2_, v2_) = fl[0][:2], fl[-1][:2]
        vf = v1_ + (v2_ - v1_) * (pc[0] - u1_) / (u2_ - u1_)
        Dc = (vf - _frame()["o"][1]) / _frame()["dv"]       # the depth of a ground point painted at v
        f = max(0.05, min(0.95, (Dc - a[1]) / (b[1] - a[1]))) if abs(b[1] - a[1]) > 1e-6 else 0.6
        z = z_at(*a)
        with sb.entity(mid):
            with k.placed(k.frame(0, 0, z)):
                crossed_barrier(a, b, 1.05, rng, bay=0.52, box_at=f, box_h=0.93)   # choice: 1.05 m (painted 1.2)
        out["rects"][mid] = []
    if "gate_fence" in ents:
        mid, e = ents["gate_fence"]
        a, b = e["lines"]["foot"][0], e["lines"]["foot"][-1]
        z = z_at(*a)
        with sb.entity(mid):
            with k.placed(k.frame(0, 0, z)):
                ki.slat_fence(a, b, 1.15, rng, slat=0.085, mat="redwood")    # choice: 1.15 m (painted 1.3); red bars
        out["rects"][mid] = []
    if "lamp_box" in ents:
        mid, e = ents["lamp_box"]
        x, y = e["pts"]["base"][0], e["pts"]["base"][1]
        z = z_at(x, y)
        with sb.entity(mid):
            # choice: face 0.55 x 1.25 m on 0.7 m legs, 0.36 deep, crest 0.26 (painted 49 + 16 px wide, 112 px tall;
            # its foot behind the fence. Painted, its foot meets the fence's top in the scroll's view; at 0.7 m both
            # characters clear the 1.15 m fence for a walker in front of it; 2.3 m to the crest, painted 2.18)
            sign_lamp_box(x, y, z, 0.55, 0.36, 1.25, 0.7, "jiaodian_front", "shiqian_side", rng=rng, crest=0.26)
        out["rects"][mid] = []
    if "xinjiu_pole" in ents:
        mid, e = ents["xinjiu_pole"]
        if tie is None:
            tie = V((e["pos"][0] - 2.0, e["pos"][1] - 4.0, 0))
        info = xinjiu_pole(mid, e, tie, z_at, rng, cage)
        out["xinjiu"] = info
        out["rects"][mid] = []
    out["tris"] = {mid: sb.B.tris.get(mid, 0) - before.get(mid, 0) for mid in ids.values()}
    out["parts"] = {o: v for o, v in PARTS.items() if o != "_last"}
    if cage:
        out["cage"] = cage
    return out
