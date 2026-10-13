"""S3 props kit: the Rainbow Bridge's (sections/rainbow_bridge) mapped props, data-driven.

Two halves:
- **Generic parts** the other kits lack, in the song_kit manner (world coordinates, metres, x = map X east, y = map D
  north, z up; every call adds faces to street_b1's bucket set `sb.B` and never opens an entity): furniture that stands
  on uneven ground with one foot height per leg (`table_body`, `bench_body`, `chair_body`), a lattice-stiffened or
  gridded woven-mat awning (`mat_awning_body`), a gabled frame awning, a bottle stand and bottles, round-topped jars,
  a round tray on a splayed stand, a hardware pedlar's sloping display board, a goods pole hung with dough twists, a
  vase-shaped parasol runner, a heap of flat coils, a heap of fruit, a shelf rack, a propped board, a bundle hung over a
  railing, a small crossed box, a lidded box on a post, a hooked post, a lamp post at the water's edge, a rope reel, a
  long table row, a leaning and a hanging signboard with illegible (faded, broken) strokes, an oval tray, bowl stacks
  and the two-wheeled handcart (`handcart`, the vehicle S3.veh.handcart_19862, until the vehicle factory delivers).
- **The dispatcher** `place_props(table, ents, z_at, rng, skip=())`: builds every entry of
  `gen/sections/rainbow_bridge/props_table.json` at its layout entity, inside `sb.entity(<map id>)`. An entry's `part`
  is a placer of this module (`fn(c, **args)`, c = the entry's context: its entity, position, `z_at`, the deck's axis)
  or "module.function" (called inside `song_kit.placed(frame(x, y, z, yaw))` with local args; "$rng" is replaced by
  the rng). Things on one of these props' tops ("table top: <id>") stand on its built top (TOPS), so `z_at` is only
  asked at feet.

Sizes: props are painted at about the figures' 1.3x, so a painted size reads px / (100 s) metres, s the local painted
figure scale (1.0 on the street, 0.6-0.9 on the deck and the south-bank interiors, 0.22-0.5 far up the silk). Every
size is real (map/BUILDING.md rule 5); where the painted reading falls outside real furniture, the real size is a
`choice:` (props_table.json `why` gives both). Colliders: seats, canopies, mats and small goods never collide; posts,
poles, stands and table bodies do (a hidden box for tables and stands, material `hidden`).

Imports read-only: song_kit, street_b1, kit_inner_city (umbrella, round_basket, pot, dishes, stool, tub, goods_heap),
kit_vehicles (spoked_wheel, _axis, _frame_m, _polybeam). No new material or texture: shared swatches and flat colours
only (true colours from web/src/palette.js by name).
Review: scratchpad S3_run2_props/review_props.py (headless, tools/blender_slot.sh).
"""
import math
import random

from mathutils import Vector

import song_kit as k
import street_b1 as sb
import kit_inner_city as ki
import kit_vehicles as kv

V = Vector
UP = V((0, 0, 1))
DARK = "interior"
TOPS = {}          # map id -> world z of the built top of a prop that carries other props (filled by place_props)
DECK_YAW = 48.7    # the built bridge's axis (deg from east): kit_rainbow_bridge as fitted (deck_fit.json, the bridge-fit agent)


# ---------------------------------------------------------------- small helpers

def _rot(yaw_deg):
    a = math.radians(yaw_deg)
    return V((math.cos(a), math.sin(a), 0)), V((-math.sin(a), math.cos(a), 0))


def _w(cx, cy, yaw, lx, ly):
    """World plan point of local (lx along yaw, ly to its left) about (cx, cy)."""
    t, n = _rot(yaw)
    return (cx + t.x * lx + n.x * ly, cy + t.y * lx + n.y * ly)


def _tri():
    return sum(len(f) - 2 for b in sb.B.data.values() for f in b["f"])


def _lathe(mat, collide, c, prof, segs=8, cap0=True, cap1=False, axis=None, rot=0.0):
    """A lathe about `axis` (default up) through c: prof = [(r, d)] with d along the axis, bottom first."""
    c = V(c)
    a = V(axis).normalized() if axis is not None else UP
    ref = V((1, 0, 0)) if abs(a.x) < 0.9 else V((0, 1, 0))
    u = a.cross(ref).normalized()
    w = a.cross(u).normalized()
    verts, faces = [], []
    for r, d in prof:
        for i in range(segs):
            an = rot + 2 * math.pi * i / segs
            verts.append(c + a * d + (u * math.cos(an) + w * math.sin(an)) * r)
    for j in range(len(prof) - 1):
        for i in range(segs):
            i2 = (i + 1) % segs
            faces.append((j * segs + i, j * segs + i2, (j + 1) * segs + i2, (j + 1) * segs + i))
    if cap0 and prof[0][0] > 1e-4:
        faces.append(tuple(reversed(range(segs))))
    if cap1 and prof[-1][0] > 1e-4:
        o = (len(prof) - 1) * segs
        faces.append(tuple(range(o, o + segs)))
    # (a, u, w) is right-handed, so each band (angle increasing, then along +a) faces away from the axis
    sb.B.add(mat, collide, verts, faces)


def _slab(mat, collide, quad, thick, down=None):
    """A thin solid slab under the planar quad [a, b, c, d] (top face), `thick` along -normal (or -down)."""
    P = [V(p) for p in quad]
    nrm = (P[1] - P[0]).cross(P[3] - P[0]).normalized()
    if nrm.z < 0:
        P = [P[0], P[3], P[2], P[1]]
        nrm = -nrm
    o = (V(down) if down is not None else -nrm) * thick
    verts = P + [p + o for p in P]
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    sb.B.add(mat, collide, verts, faces)


def _bar(mat, p0, p1, w, h=None):
    """A thin member as four side faces, no end caps (8 triangles): far furniture's legs and stretchers."""
    p0, p1 = V(p0), V(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    d.normalize()
    ref = UP if abs(d.z) < 0.95 else V((1, 0, 0))
    a = d.cross(ref).normalized() * (w / 2)
    b = d.cross(a).normalized() * ((h or w) / 2)
    ring = [a + b, -a + b, -a - b, a - b]
    verts = [p0 + r for r in ring] + [p1 + r for r in ring]
    sb.B.add(mat, False, verts, [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)])


def _hidden_box(lo, hi):
    k.bx("hidden", True, lo, hi)


def _strokes(mat, c, side, up, nrm, w, h, cells, rng, vertical=True):
    """Illegible characters as painted (map: □): in each of `cells` character cells down the board's face (centre c,
    width w along `side`, height h along `up`, face normal `nrm`), two or three short, broken, faded strokes, never a
    guessed character (web-scene skill: illegible characters are faded, broken strokes)."""
    c, side, up, nrm = V(c), V(side).normalized(), V(up).normalized(), V(nrm).normalized()
    ch = h / cells
    for i in range(cells):
        cc = c + up * (h / 2 - ch * (i + 0.5)) + nrm * 0.004
        for _ in range(rng.randint(2, 3)):
            ang = rng.choice((0.0, math.pi / 2, math.pi / 4, -math.pi / 4)) + rng.uniform(-0.15, 0.15)
            d = side * math.cos(ang) + up * math.sin(ang)
            ln = rng.uniform(0.25, 0.55) * min(w, ch)
            p = cc + side * rng.uniform(-0.2, 0.2) * w + up * rng.uniform(-0.25, 0.25) * ch
            q = d.cross(nrm).normalized() * rng.uniform(0.008, 0.014) * max(1.0, w / 0.3)
            a, b = p - d * ln / 2, p + d * ln / 2
            quad = [a - q, b - q, b + q, a + q]
            if (quad[1] - quad[0]).cross(quad[3] - quad[0]).dot(nrm) < 0:
                quad.reverse()
            sb.B.add(mat, False, quad, [(0, 1, 2, 3)])


def _tray(c, R, rim, mat=DARK, seg=10, sx=1.0, sy=1.0):
    """A shallow round (or oval: sx, sy) tray: floor, raised rim with thickness, underside; c = middle of its foot."""
    c = V(c)
    rows = [(0.92, 0.012), (1.0, rim), (1.03, rim * 0.6), (0.97, -0.004)]
    verts = [c + UP * 0.012]
    for r, zz in rows:
        for i in range(seg):
            a = 2 * math.pi * i / seg
            verts.append(c + V((math.cos(a) * R * r * sx, math.sin(a) * R * r * sy, zz)))
    verts.append(c - UP * 0.004)
    faces = [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)]
    for j in range(len(rows) - 1):
        for i in range(seg):
            i2 = (i + 1) % seg
            faces.append((1 + j * seg + i, 1 + (j + 1) * seg + i, 1 + (j + 1) * seg + i2, 1 + j * seg + i2))
    last, cb = 1 + (len(rows) - 1) * seg, len(verts) - 1
    faces += [(cb, last + (i + 1) % seg, last + i) for i in range(seg)]
    sb.B.add(mat, False, verts, faces)


def bun(x, y, z, s, rng, mat="cloth_white"):
    """A round bun or cake sitting on a surface: a low domed lump (13 triangles), a little irregular."""
    j = rng.uniform(0.9, 1.1)
    _lathe(mat, False, (x, y, z), [(s * 0.9 * j, 0.0), (s * 0.5, s * 0.7 * j)], segs=5, cap0=False, cap1=True,
           rot=rng.uniform(0, 1))


def _buns(c, R, n, rng, mat="cloth_white", s=0.05, high=0.0):
    """Round goods (buns, cakes, fruit) on a tray or in a heap about c, within radius R."""
    c = V(c)
    for i in range(n):
        a = rng.uniform(0, 2 * math.pi)
        r = R * math.sqrt(rng.uniform(0.0, 1.0)) * 0.85
        p = c + V((math.cos(a) * r, math.sin(a) * r, 0))
        zz = high * (1 - r / max(R, 1e-6))
        bun(p.x, p.y, p.z + zz, s * rng.uniform(0.85, 1.15), rng, mat=mat if isinstance(mat, str) else rng.choice(mat))


def bowl(x, y, z, r=0.08, h=0.045, mat="cloth_white", segs=6):
    """A small bowl (rim r, h deep) on its foot ring, its dark inside showing."""
    _lathe(mat, False, (x, y, z), [(r * 0.5, 0.0), (r * 0.86, h * 0.55), (r, h)], segs=segs)
    _lathe(DARK, False, (x, y, z), [(r * 0.93, h - 0.004), (r * 0.5, h * 0.3)], segs=segs, cap0=False, cap1=True)


def bowl_stack(x, y, z, n, rng, r=0.075, step=0.03, mat="cloth_white", segs=6):
    """Bowls stacked n high: one tapering body and a rim ring standing proud at each bowl's lip (an ink line each),
    the top bowl's dark inside."""
    zt = (n - 1) * step + 0.045
    _lathe(mat, False, (x, y, z), [(r * 0.5, 0.0), (r * 0.9, zt)], segs=segs)
    for i in range(n):
        z0 = z + i * step + 0.045
        sb.cyl(mat, False, (x, y, z0 - 0.008), (x, y, z0), r, segs=segs, caps=False)
    _lathe(DARK, False, (x, y, z), [(r * 0.95, zt), (r * 0.45, zt - 0.025)], segs=segs, cap0=False, cap1=True)


# ---------------------------------------------------------------- furniture on uneven ground

def table_body(cx, cy, yaw, zf, L, W, h, rng, legs="square", splay=0.0, stretch=False, apron="rails", top_mat="timber",
               mat="timber", collide=True, lod=0, top_th=0.045, shelf=False):
    """A table (or a counter, a stand) L along yaw x W, its top h above the ground at its centre, every leg down to the
    ground under it (zf(x, y): the support's z there, so it stands on a ramp or a raised floor; the top stays level).
    legs: 'square' (plumb) or 'splayed' (feet `splay` m out at the ends); stretch: low stretchers round the legs;
    apron: 'rails' (two rails under the top's long sides), 'board' (a plain front board, a counter's apron), None;
    shelf: a lower shelf board between the stretchers. A hidden collider fills the body (collide). Returns the top's
    world z."""
    z0 = zf(cx, cy)
    hx, hy, inset = L / 2, W / 2, min(0.07, L * 0.1)
    feet = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            fx, fy = sx * (hx - inset + (splay if legs == "splayed" else 0.0)), sy * (hy - inset)
            wx, wy = _w(cx, cy, yaw, fx, fy)
            feet.append((sx, sy, fx, fy, zf(wx, wy)))
    zt = max(z0 + h, max(f[4] for f in feet) + 0.25)
    c = 0.0 if lod else 0.01
    lw = 0.05 if L > 0.6 else 0.04
    with k.placed(k.frame(cx, cy, 0.0, yaw)):
        k.beam(top_mat, False, (-hx, 0, zt - top_th / 2), (hx, 0, zt - top_th / 2), W, top_th, 0.0 if lod else 0.012)
        for sx, sy, fx, fy, fz in feet:
            if lod:
                _bar(mat, (fx, fy, fz - 0.02), (sx * (hx - inset), fy, zt - top_th), lw)
            else:
                k.beam(mat, False, (fx, fy, fz - 0.02), (sx * (hx - inset), fy, zt - top_th), lw, lw, 0)
        za = zt - top_th - 0.05
        if apron == "rails" and not lod:
            for sy in (-1, 1):
                k.beam(mat, False, (-hx + inset, sy * (hy - inset), za), (hx - inset, sy * (hy - inset), za), 0.025, 0.07, 0)
        elif apron == "board":
            ab = min(0.3, h * 0.4)
            k.beam(mat, False, (-hx + 0.02, -hy + 0.02, zt - top_th - ab / 2), (hx - 0.02, -hy + 0.02, zt - top_th - ab / 2),
                   0.022, ab, 0)
        if stretch or shelf:
            zs = min(f[4] for f in feet) + 0.14
            for sy in (-1, 1):
                if lod:
                    _bar(mat, (-hx + inset, sy * (hy - inset), zs), (hx - inset, sy * (hy - inset), zs), 0.03)
                else:
                    k.beam(mat, False, (-hx + inset, sy * (hy - inset), zs), (hx - inset, sy * (hy - inset), zs), 0.03, 0.03, 0)
            if not lod:
                for sx in (-1, 1):
                    k.beam(mat, False, (sx * (hx - inset), -hy + inset, zs), (sx * (hx - inset), hy - inset, zs), 0.03, 0.03, 0)
            if shelf:
                k.beam(mat, False, (-hx + inset, 0, zs + 0.025), (hx - inset, 0, zs + 0.025), W - 2 * inset, 0.02, 0)
        if collide:
            _hidden_box((-hx + 0.04, -hy + 0.04, min(f[4] for f in feet)), (hx - 0.04, hy - 0.04, zt - top_th))
    return zt


def bench_body(cx, cy, yaw, zf, L, rng, h=0.45, w=0.26, lattice_side=False, lod=0, mat="timber"):
    """A long bench (seat top h above the ground) along yaw: a thick plank seat on splayed legs with a stretcher; legs
    to the ground under each (zf). lattice_side: a lattice panel closing one end (as painted in the open shop). Seats
    never collide (people.js grounds a seated figure by a ray: a colliding seat lifts it)."""
    hx = L / 2
    z0 = zf(cx, cy)
    zt = z0 + h
    with k.placed(k.frame(cx, cy, 0.0, yaw)):
        k.beam(mat, False, (-hx, 0, zt - 0.03), (hx, 0, zt - 0.03), w, 0.055, 0.0 if lod else 0.012)
        ends = (-hx + 0.12, hx - 0.12)
        fz = {}
        for ex in ends:
            for s in (-1, 1):
                wx, wy = _w(cx, cy, yaw, ex, s * w * 0.48)
                fz[(ex, s)] = zf(wx, wy)
                if lod:
                    _bar(mat, (ex, s * w * 0.3, zt - 0.06), (ex, s * w * 0.48, fz[(ex, s)] - 0.02), 0.045)
                else:
                    k.beam(mat, False, (ex, s * w * 0.3, zt - 0.06), (ex, s * w * 0.48, fz[(ex, s)] - 0.02), 0.045, 0.045, 0)
        zs = min(fz.values()) + (zt - min(fz.values())) * 0.35
        if lod:
            pass                     # far benches: no stretcher (it draws nothing at that distance)
        else:
            k.beam(mat, False, (ends[0], 0, zs), (ends[1], 0, zs), 0.035, 0.035, 0)
        if lattice_side:
            ex = hx - 0.04
            for i in range(4):
                yy = -w * 0.4 + w * 0.8 * i / 3
                k.beam("lattice", False, (ex, yy, zt - 0.06), (ex, yy, min(fz.values()) + 0.05), 0.02, 0.02, 0)
            k.beam("lattice", False, (ex, -w * 0.45, (zt + zs) / 2), (ex, w * 0.45, (zt + zs) / 2), 0.02, 0.02, 0)
    return zt


def chair_body(x, y, z, facing_deg, rng, back_h=1.0, seat=0.46, s=0.44, kind="slats", lod=0, mat="timber"):
    """A Song chair (a sitter looks along facing_deg): four legs, a framed seat, the back legs running up as back
    posts to a top rail whose ends turn up past them ('slats': two back slats; 'curved': a back rail bowed back and a
    splat; 'plain': one splat). Never collides. choice: back 1.0 m, seat 0.46 m."""
    hs = s / 2
    c = 0.0 if lod else 0.008
    with k.placed(k.frame(x, y, z, facing_deg)):
        k.beam(mat, False, (-hs, 0, seat - 0.02), (hs, 0, seat - 0.02), s, 0.04, c)
        member = (lambda a, b, w: _bar(mat, a, b, w)) if lod else (lambda a, b, w: k.beam(mat, False, a, b, w, w, 0))
        for sy in (-1, 1):
            member((hs - 0.03, sy * (hs - 0.03), 0), (hs - 0.03, sy * (hs - 0.03), seat - 0.04), 0.04)
            member((-hs + 0.03, sy * (hs - 0.03), 0), (-hs - 0.01, sy * (hs - 0.04), back_h), 0.04)
            if not lod:
                k.beam(mat, False, (-hs + 0.03, sy * (hs - 0.03), 0.16), (hs - 0.03, sy * (hs - 0.03), 0.16), 0.025, 0.025, 0)
        zr = back_h + 0.01
        bow = 0.05 if kind == "curved" else 0.0
        pts = [V((-hs - 0.0, -hs - 0.07, zr + 0.05)), V((-hs - 0.01, -hs + 0.02, zr)), V((-hs - 0.01 - bow, 0.0, zr + 0.01)),
               V((-hs - 0.01, hs - 0.02, zr)), V((-hs - 0.0, hs + 0.07, zr + 0.05))]
        kv._polybeam(mat, pts, 0.04, 0.035, 0.0)
        if kind == "slats":
            for sy in (-0.06, 0.06):
                k.beam(mat, False, (-hs + 0.0, sy, seat + 0.02), (-hs - 0.01, sy, zr - 0.02), 0.018, 0.04, 0)
        else:
            k.beam(mat, False, (-hs + 0.0, 0, seat + 0.02), (-hs - 0.01 - bow * 0.6, 0, zr - 0.02), 0.018, 0.12, 0)
        if not lod:
            k.beam(mat, False, (-hs - 0.0, -hs + 0.03, seat + 0.18), (-hs - 0.0, hs - 0.03, seat + 0.18), 0.025, 0.025, 0)


# ---------------------------------------------------------------- parasols and awnings

def vase_runner(foot, hub, R, mat="timber"):
    """The turned, vase-shaped runner on a parasol's pole into which the ribs' stretchers gather (S3's lower twin
    parasol): a wide mouth just under kit_inner_city.umbrella's runner, a narrowing neck, a round belly, a knob
    below. Its axis follows the pole."""
    F, Hb = V(foot), V(hub)
    ax = (F - Hb).normalized()
    run = Hb + ax * (0.3 * R + 0.12)
    prof = [(0.02, 0.5), (0.05, 0.46), (0.035, 0.42), (0.08, 0.36), (0.09, 0.3), (0.05, 0.22), (0.07, 0.16),
            (0.15, 0.06), (0.17, -0.02)]
    # listed from its foot (far from the hub) to its mouth (at the runner): d measured along -ax from the foot point
    base = run + ax * 0.5
    _lathe(mat, False, base, [(r, 0.5 - d) for r, d in prof], segs=6, cap0=True, cap1=True, axis=-ax)


def parasol_body(foot, hub, R, rng, ribs=16, tilt=(0.0, 0.0), rise=0.3, mat="oilpaper", vase=False, pole=True):
    """A stall parasol at real size: kit_inner_city.umbrella (ribbed canopy, bound rim, ribs, crown, knob, pole from
    `foot` to the hub, runner and stretchers), plus the vase-shaped runner where painted. The canopy never collides;
    the pole does (umbrella's own)."""
    ki.umbrella(hub[0], hub[1], hub[2], R, rng, tilt=tuple(tilt), foot=tuple(foot), ribs=ribs, rise=rise, mat=mat,
                pole=pole)
    if vase:
        vase_runner(foot, hub, R)


def canopy_z(hub, R, t, a, tilt=(0.0, 0.0), rise=0.3):
    """Height of an umbrella's rib at fraction t of R, angle a (kit_inner_city.umbrella's own formula), for things hung
    from it."""
    drop = rise + 0.12
    p = V((math.cos(a), math.sin(a), 0)) * (R * t)
    return hub[2] + 0.12 - drop * (0.3 * t + 0.7 * t * t) + p.x * tilt[0] + p.y * tilt[1]


def mat_awning_body(corners, rng, grid=(0, 0), lattice=0.0, sag=0.03, mat="reed", frame_mat="timber", lod=0):
    """A woven-mat awning over four eave corners [a, b, c, d] (x, y, z; counter-clockwise from above; a-b the front):
    the mat as one sagging sheet (single faces: materials are double-sided), a timber frame round its edge, battens in a
    grid (grid=(n across a-b, n along a-d), as painted on the deck stalls) and/or a diagonal lattice of bamboo slats
    `lattice` m apart over it (the bank awning that is 'stiffened with a diagonal lattice'). Never collides."""
    a, b, c, d = [V(p) for p in corners]
    mid = (a + b + c + d) / 4 - UP * sag
    ab, bc, cd, da = (a + b) / 2 - UP * sag * 0.4, (b + c) / 2 - UP * sag * 0.4, (c + d) / 2 - UP * sag * 0.4, (d + a) / 2 - UP * sag * 0.4
    for q in ((a, ab, mid, da), (ab, b, bc, mid), (mid, bc, c, cd), (da, mid, cd, d)):
        sb.B.add(mat, False, list(q), [(0, 1, 2, 3)])

    def at(u, v):        # bilinear point on the sheet, a little above it
        p = a.lerp(b, u).lerp(d.lerp(c, u), v)
        s = 4 * u * (1 - u) * 4 * v * (1 - v)
        return p - UP * sag * s + UP * 0.025

    for p, q in ((a, b), (b, c), (c, d), (d, a)):
        k.beam(frame_mat, False, p, q, 0.06, 0.07, 0)
    nx, ny = grid
    for i in range(1, nx):
        u = i / nx
        k.beam("bamboo", False, at(u, 0.0), at(u, 1.0), 0.035, 0.03, 0)
    for j in range(1, ny):
        v = j / ny
        k.beam("bamboo", False, at(0.0, v), at(1.0, v), 0.035, 0.03, 0)
    if lattice > 0:
        nrm = (b - a).cross(d - a).normalized()
        if nrm.z < 0:
            nrm = -nrm
        W = (b - a).length
        D = (d - a).length
        n = max(2, int((W + D) / lattice))
        for sgn in (1, -1):
            for i in range(1, n):
                s0 = i / n * (W + D)
                # the line u*W + sgn*v*D = s0 (sgn=-1: shifted to cover the square), clipped to the unit square
                seg = []
                for (u, v) in ((0, None), (1, None), (None, 0), (None, 1)):
                    if u is not None:
                        vv = (s0 - u * W) / D if sgn > 0 else (u * W - (s0 - D)) / D
                        if 0 <= vv <= 1:
                            seg.append((u, vv))
                    else:
                        uu = (s0 - v * D) / W if sgn > 0 else ((s0 - D) + v * D) / W
                        if 0 <= uu <= 1:
                            seg.append((uu, v))
                if len(seg) >= 2:
                    (u0, v0), (u1, v1) = seg[0], seg[-1]
                    if abs(u0 - u1) + abs(v0 - v1) > 0.05:
                        # a flat split-bamboo slat laid on the mat (one face: its edges draw the ink against the mat)
                        p0, p1 = at(u0, v0), at(u1, v1)
                        sd = (p1 - p0).cross(nrm).normalized() * 0.022
                        quad = [p0 - sd, p1 - sd, p1 + sd, p0 + sd]
                        if (quad[1] - quad[0]).cross(quad[3] - quad[0]).dot(nrm) < 0:
                            quad.reverse()
                        sb.B.add("bamboo", False, quad, [(0, 1, 2, 3)])


def posts_to(feet_tops, r=0.045, mat="bamboo"):
    """Poles from each foot (x, y, z) up to its top (x, y, z): colliding bamboo, a little sunk at the foot."""
    for f, t in feet_tops:
        sb.cyl(mat, True, (f[0], f[1], f[2] - 0.05), tuple(t), r, r * 0.85, segs=6)


def frame_awning_body(corners, z_eave, ridge_h, rng, mat="reed"):
    """A light gabled frame awning over four post feet [sw, se, ne, nw] (x, y, z), ridge along sw->se's direction: four
    posts, eave plates, a ridge pole on two short king posts, three rafters a side, a mat laid over both slopes.
    choice: eave z_eave over each foot, ridge ridge_h over the eaves."""
    P = [V(p) for p in corners]
    E = [V((p.x, p.y, p.z + z_eave)) for p in P]
    posts_to([(p, e) for p, e in zip(P, E)], r=0.045, mat="timber")
    for i in range(4):
        k.beam("timber", False, E[i], E[(i + 1) % 4], 0.06, 0.07, 0.01)
    rw, re = (E[0] + E[3]) / 2 + UP * ridge_h, (E[1] + E[2]) / 2 + UP * ridge_h
    k.beam("timber", False, rw - (re - rw).normalized() * 0.15, re + (re - rw).normalized() * 0.15, 0.06, 0.07, 0.01)
    for p in ((E[0] + E[3]) / 2, (E[1] + E[2]) / 2):
        k.beam("timber", False, p, p + UP * ridge_h, 0.05, 0.05, 0)
    for t in (0.0, 0.5, 1.0):
        r = rw.lerp(re, t)
        for a_, b_ in ((E[0], E[1]), (E[3], E[2])):
            e = a_.lerp(b_, t)
            k.beam("bamboo", False, r + UP * 0.03, e + (e - r).normalized() * 0.15, 0.035, 0.035, 0)
    for a_, b_ in ((E[0], E[1]), (E[3], E[2])):
        o0, o1 = a_ + (a_ - rw).normalized() * 0.15, b_ + (b_ - re).normalized() * 0.15
        sb.B.add(mat, False, [o0 + UP * 0.04, o1 + UP * 0.04, re + UP * 0.07, rw + UP * 0.07], [(0, 1, 2, 3)])


# ---------------------------------------------------------------- stands, vessels and goods

def bottle(x, y, z, h, rng, mat="jar_green", r=0.07):
    """A round-shouldered bottle with a narrow neck and a small round top (the wine bottle form, 梅瓶)."""
    prof = [(r * 0.62, 0.0), (r * 1.0, h * 0.6), (r * 0.82, h * 0.76), (r * 0.32, h * 0.88), (r * 0.42, h * 0.96), (r * 0.15, h)]
    _lathe(mat, False, (x, y, z), prof, segs=6, cap1=True, rot=rng.uniform(0, 1))


def jar(x, y, z, h, rng, r=None, mat="jar_red", lid=True):
    """A small round-topped jar: a full belly, a short neck, a domed lid (or a rolled open mouth)."""
    r = r or h * 0.42
    prof = [(r * 0.6, 0.0), (r, h * 0.45), (r * 0.78, h * 0.76), (r * 0.5, h * 0.86)]
    prof += [(r * 0.32, h * 1.0), (0.0, h * 1.04)] if lid else [(r * 0.52, h * 0.92)]
    _lathe(mat, False, (x, y, z), prof, segs=6, rot=rng.uniform(0, 1))


def bottle_stand_body(x, y, z, yaw, w, d, h, rng, cloth="cloth_indigo"):
    """A small box-shaped stall stand: four legs, a framed top board, a low shelf, its front hung with a dark cloth in
    folds down to a hand's breadth above the ground (as painted at the west end of the mat canopy). The body collides
    (hidden). Returns the top's z."""
    hx, hy = w / 2, d / 2
    with k.placed(k.frame(x, y, z, yaw)):
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.beam("timber", False, (sx * (hx - 0.03), sy * (hy - 0.03), 0), (sx * (hx - 0.03), sy * (hy - 0.03), h - 0.03),
                       0.04, 0.04, 0)
        k.beam("timber", False, (-hx - 0.02, 0, h - 0.015), (hx + 0.02, 0, h - 0.015), d + 0.04, 0.03, 0.008)
        k.beam("timber", False, (-hx + 0.03, 0, 0.2), (hx - 0.03, 0, 0.2), d - 0.06, 0.02, 0)
        n = 5
        pts = []
        for i in range(n + 1):
            u = -hx + w * i / n
            pts.append((u, -hy - 0.012 - (0.015 if i % 2 else 0.0)))
        for i in range(n):
            (u0, y0), (u1, y1) = pts[i], pts[i + 1]
            sb.B.add(cloth, False, [V((u0, y0, 0.1 + rng.uniform(0, 0.03))), V((u1, y1, 0.1 + rng.uniform(0, 0.03))),
                                    V((u1, y1, h - 0.04)), V((u0, y0, h - 0.04))], [(0, 1, 2, 3)])
        _hidden_box((-hx, -hy, 0), (hx, hy, h - 0.04))
    return z + h


def round_tray_stand_body(x, y, zf, R, h, rng, legs=4, splay=0.18, basket=False, goods=0, tray_mat=DARK,
                          goods_mat="cloth_white", collide=True):
    """A round flat tray (or a shallow woven basket) on a stand of `legs` splayed legs braced by a ring of bars
    half-way down; each foot on the ground under it (zf). goods: round things on the tray. Returns the tray's top z."""
    z0 = zf(x, y)
    zt = z0 + h
    feet = []
    for i in range(legs):
        a = math.pi / legs + 2 * math.pi * i / legs
        fx, fy = x + math.cos(a) * (R * 0.55 + splay), y + math.sin(a) * (R * 0.55 + splay)
        top = V((x + math.cos(a) * R * 0.45, y + math.sin(a) * R * 0.45, zt - 0.03))
        fz = zf(fx, fy)
        feet.append(V((fx, fy, fz)))
        k.beam("timber", collide, V((fx, fy, fz - 0.02)), top, 0.035, 0.035, 0)
    mids = [f.lerp(V((x, y, zt)), 0.45) for f in feet]
    for i in range(legs):
        k.beam("timber", False, mids[i], mids[(i + 1) % legs], 0.025, 0.025, 0)
    if basket:
        segs = 14
        hh = 0.09
        ki._ribbed_lathe("reed", False, (x, y, zt - 0.02), [(R * 0.6, 0), (R * 0.85, hh * 0.35), (R * 0.97, hh * 0.75),
                                                              (R, hh - 0.012)], segs, ribs=0.03, ribbed=(1, 2), rot=rng.uniform(0, 1))
        ki._ribbed_lathe("bamboo", False, (x, y, zt - 0.02), [(R + 0.003, hh - 0.025), (R + 0.02, hh), (R - 0.02, hh + 0.01)],
                         segs, cap=False)
        ki._ribbed_lathe(DARK, False, (x, y, zt - 0.02), [(R * 0.58, 0.01), (R - 0.02, hh - 0.012)], segs)
        top = zt + 0.01
    else:
        _tray(V((x, y, zt - 0.02)), R, 0.045, mat=tray_mat, seg=12)
        top = zt + 0.01
    if goods:
        _buns(V((x, y, top)), R * 0.8, goods, rng, mat=goods_mat, s=min(0.06, R * 0.18))
    return top


def display_board_body(sw, se, ne, nw, zf, rng, front_h=0.22, back_h=0.62, box=True):
    """A hardware pedlar's sloping display board (S3.prop.small_goods_display_18060): a framed board on four short legs
    over its plan corners [sw, se, ne, nw] (x, y), low at its front edge sw-se and raised at the back, laid in rows with
    small dark goods: short rods, rings, knife and scissor shapes, combs; a dark lidded box at its north-east corner.
    The body collides (hidden). choice: front 0.22 m, back 0.62 m above the ground."""
    P = [V((p[0], p[1], 0)) for p in (sw, se, ne, nw)]
    for p in P:
        p.z = zf(p.x, p.y)
    T = [P[0] + UP * front_h, P[1] + UP * front_h, P[2] + UP * back_h, P[3] + UP * back_h]
    _slab("deck", False, T, 0.035)          # pale weathered boards, so the dark goods read on them
    for i in range(4):
        k.beam("redwood", False, T[i] + UP * 0.012, T[(i + 1) % 4] + UP * 0.012, 0.04, 0.035, 0)
    for i in range(4):
        k.beam("timber", False, P[i] + (T[i] - P[i]) * 0.0 - UP * 0.02, T[i] - UP * 0.035, 0.045, 0.045, 0)
    k.beam("timber", False, P[0].lerp(P[3], 0.5) + UP * 0.12, P[1].lerp(P[2], 0.5) + UP * 0.12, 0.03, 0.03, 0)
    nrm = (T[1] - T[0]).cross(T[3] - T[0]).normalized()
    if nrm.z < 0:
        nrm = -nrm

    def at(u, v):
        return T[0].lerp(T[1], u).lerp(T[3].lerp(T[2], u), v) + nrm * 0.004

    side = (T[1] - T[0]).normalized()
    upb = (T[3] - T[0]).normalized()
    rows = 3
    for j in range(rows):
        v = 0.18 + 0.64 * j / (rows - 1)
        n = 6 + j
        for i in range(n):
            u = 0.08 + 0.84 * (i + rng.uniform(-0.2, 0.2)) / max(1, n - 1)
            if box and u > 0.8 and v > 0.7:
                continue
            p = at(u, v)
            kind = (i + j) % 5
            if kind == 0:          # a short rod
                d = (side * rng.uniform(-0.3, 0.3) + upb).normalized()
                k.beam("lattice", False, p - d * 0.07, p + d * 0.07, 0.014, 0.014, 0)
            elif kind == 1:        # a ring, flat on the board
                rr = 0.03
                ring = [p + (side * math.cos(2 * math.pi * q / 6) + upb * math.sin(2 * math.pi * q / 6)) * rr for q in range(6)]
                inner = [p + (q - p) * 0.55 for q in ring]
                for q in range(6):
                    sb.B.add("ridge", False, [ring[q], ring[(q + 1) % 6], inner[(q + 1) % 6], inner[q]], [(0, 1, 2, 3)])
            elif kind == 2:        # a knife: a narrow blade and a dark handle
                d = (upb + side * rng.uniform(-0.2, 0.2)).normalized()
                sd = d.cross(nrm).normalized()
                sb.B.add("ridge", False, [p - sd * 0.012, p + sd * 0.012, p + d * 0.11], [(0, 1, 2)])
                k.beam(DARK, False, p, p - d * 0.06, 0.016, 0.012, 0)
            elif kind == 3:        # scissors: two crossed blades
                for s_ in (-1, 1):
                    d = (upb + side * 0.35 * s_).normalized()
                    sb.B.add("ridge", False, [p - d * 0.06 - side * 0.006, p - d * 0.06 + side * 0.006, p + d * 0.06],
                             [(0, 1, 2)])
            else:                  # a comb: a half disc with a back
                rr = 0.045
                pts = [p + (side * math.cos(math.pi * q / 4) + upb * math.sin(math.pi * q / 4)) * rr for q in range(5)]
                sb.B.add("timber", False, [p] + pts, [(0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 5)])
    if box:
        bp = at(0.9, 0.84)
        k.beam(DARK, False, bp, bp + UP * 0.2, 0.2, 0.16, 0.01)
        k.beam("lattice", False, bp + UP * 0.2, bp + UP * 0.235, 0.23, 0.19, 0.008)
    lo = V((min(p.x for p in P), min(p.y for p in P), min(p.z for p in P)))
    # hidden collider: a slab under the board (the board's own outline, from the ground to its front height)
    sb.B.add("hidden", True, [P[0], P[1], P[2], P[3], T[0], T[1], T[2], T[3]],
             [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
    return lo


def goods_pole_body(x, y, z, rng, h=2.75, tiers=(1.5, 1.85, 2.2), arm=0.36, strings=2, mat="bamboo"):
    """A pedlar's display pole (S3.prop.goods_pole_18785): an upright pole set in a dark box-like stand, hung from about
    a man's height to above his head with clusters of curly twisted goods (strings of dough twists) on both sides:
    short cross-arms at `tiers` heights, `strings` strings a side from each, every string a chain of twists (a
    ribbon turning through half a turn per twist, so each twist draws its own ink). Pole and stand collide.
    choice: pole 2.75 m, stand 0.42 m square, 0.45 m tall."""
    sb.cyl("bamboo", True, (x, y, z - 0.05), (x, y, z + h), 0.04, 0.032, segs=6)
    sb.lathe("timber", False, (x, y, z + h), [(0.05, 0), (0.035, 0.05), (0.01, 0.1)], segs=6)
    bw = 0.21
    k.prism(DARK, True, [V((x - bw, y - bw, z)), V((x + bw, y - bw, z)), V((x + bw, y + bw, z)), V((x - bw, y + bw, z))],
            [V((x - bw * 0.85, y - bw * 0.85, z + 0.45)), V((x + bw * 0.85, y - bw * 0.85, z + 0.45)),
             V((x + bw * 0.85, y + bw * 0.85, z + 0.45)), V((x - bw * 0.85, y + bw * 0.85, z + 0.45))])
    for p, q in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
        k.beam("timber", False, (x + p[0] * bw * 0.86, y + p[1] * bw * 0.86, z + 0.455),
               (x + q[0] * bw * 0.86, y + q[1] * bw * 0.86, z + 0.455), 0.035, 0.03, 0)
    for zt in tiers:
        a0 = rng.uniform(-0.2, 0.2)
        d = V((math.cos(a0), math.sin(a0) * 0.4, 0)).normalized()
        k.beam("timber", False, V((x, y, z + zt)) - d * arm, V((x, y, z + zt)) + d * arm, 0.03, 0.03, 0)
        for s_ in (-1, 1):
            for i in range(strings):
                top = V((x, y, z + zt)) + d * s_ * arm * (0.35 + 0.65 * i / max(1, strings - 1))
                top += V((rng.uniform(-0.03, 0.03), rng.uniform(-0.05, 0.05), 0))
                n = rng.randint(4, 5)
                L = 0.07
                verts, faces = [], []
                ph = rng.uniform(0, math.pi)
                for q in range(n + 1):
                    an = ph + q * math.pi / 2
                    c = top - UP * (0.02 + q * L) + V((rng.uniform(-0.008, 0.008), rng.uniform(-0.008, 0.008), 0))
                    o = V((math.cos(an), math.sin(an), 0)) * 0.03
                    verts += [c - o, c + o]
                for q in range(n):
                    faces.append((2 * q, 2 * q + 1, 2 * q + 3, 2 * q + 2))
                sb.B.add(mat, False, verts, faces)
                sb.cyl("rope", False, tuple(top + UP * 0.015), tuple(top - UP * 0.03), 0.004, segs=3, caps=False)


def coiled_heap_body(x, y, z, rng, n=9, r=0.17, spread=(0.8, 0.55), tiers=3, mat="reed", yaw=0.0, zf=None):
    """A heap of flat round coils (coils of twisted dough or coiled baskets, S3.prop.coiled_goods_18600): each coil a
    low round body with a dark spiral laid on its top, heaped in `tiers` (each tier fewer and a little inward, each
    coil tilted), so the heap rises to about tiers x 0.2 m. choice: coils 0.34 m across."""
    left = n
    zt = z
    for t in range(tiers):
        m = max(1, round(left / (tiers - t))) if t < tiers - 1 else left
        left -= m
        sx, sy = spread[0] * (1 - 0.3 * t), spread[1] * (1 - 0.3 * t)
        for i in range(m):
            a = 2 * math.pi * i / m + rng.uniform(-0.3, 0.3) + t
            u, v = math.cos(a) * sx * 0.32 * (1 if m > 1 else 0), math.sin(a) * sy * 0.32 * (1 if m > 1 else 0)
            cx, cy = _w(x, y, yaw, u, v)
            z_here = zf(cx, cy) if zf else z
            rr = r * rng.uniform(0.85, 1.1)
            tl = V((rng.uniform(-0.25, 0.25), rng.uniform(-0.25, 0.25), 1)).normalized()
            hh = 0.075
            c0 = V((cx, cy, zt - z + z_here + 0.005))
            _lathe(mat, False, c0, [(rr * 0.9, 0.0), (rr, hh * 0.5), (rr * 0.82, hh)], segs=8, cap1=True, axis=tl,
                   rot=rng.uniform(0, 1))
            # the dark spiral on its top
            X = tl.cross(V((1, 0, 0)) if abs(tl.x) < 0.9 else V((0, 1, 0))).normalized()
            Y = tl.cross(X)
            pts, nn = [], 9
            for q in range(nn):
                f = q / (nn - 1)
                an = 2 * math.pi * 2.2 * f
                pts.append(c0 + tl * (hh + 0.003) + (X * math.cos(an) + Y * math.sin(an)) * rr * (0.12 + 0.62 * f))
            verts, faces = [], []
            for q, p in enumerate(pts):
                dd = (pts[min(q + 1, nn - 1)] - pts[max(q - 1, 0)]).normalized()
                o = dd.cross(tl).normalized() * 0.008
                verts += [p - o, p + o]
            for q in range(nn - 1):
                faces.append((2 * q, 2 * q + 2, 2 * q + 3, 2 * q + 1))
            sb.B.add("lattice", False, verts, faces)
        zt += 0.075 * 0.9


def fruit_heap_body(x, y, z, rng, R=0.3, h=0.32, n=10, mats=("cloth_red", "cloth_white", "jar_red", "bamboo")):
    """A big heap of lumpy round things touched with pink and red (fruit, buns or flowers) piled high in a vessel's mouth:
    a warm buff mound of the round things filling the mouth (R) and rising h, with n of them, pink, red and pale,
    standing out on its surface."""
    prof = [(R, 0.0), (R * 0.88, h * 0.4), (R * 0.55, h * 0.8), (R * 0.12, h)]
    _lathe("bamboo", False, (x, y, z), prof, segs=9, cap0=False, cap1=True, rot=rng.uniform(0, 1))
    for i in range(n):
        f = (i + 0.5) / n
        a = 2.39996 * i + rng.uniform(-0.2, 0.2)          # golden-angle spiral over the mound
        rr = R * 0.92 * math.sqrt(1 - f)
        zz = h * (1 - (rr / R) ** 1.6) * 0.92
        s = rng.uniform(0.055, 0.075)
        k.rock(mats[i % len(mats)], x + math.cos(a) * rr, y + math.sin(a) * rr, z + zz + s * 0.35, s, rng, flat=0.8)


def shelf_rack_body(p_left, p_right, z, h, depth, rng, shelves=(0.55, 0.95, 1.35), red=(1,)):
    """An open rack of shelves standing against a wall (behind the diners in the riverside hall): two pairs of uprights,
    each shelf a pair of bars (front and back) with slats across, some bars painted red (`red`: shelf indices)."""
    a, b = V((p_left[0], p_left[1], z)), V((p_right[0], p_right[1], z))
    t = (b - a).normalized()
    n = V((t.y, -t.x, 0))                 # toward the viewer (right of left -> right)
    back = -n * depth
    for p in (a, b):
        for o in (V((0, 0, 0)), back):
            k.beam("timber", True, p + o, p + o + UP * h, 0.04, 0.04, 0)
    for i, zz in enumerate(shelves):
        m = "redwood" if i in red else "timber"
        for o in (V((0, 0, 0)), back):
            k.beam(m, False, a + o + UP * zz, b + o + UP * zz, 0.03, 0.035, 0)
        for f in (0.25, 0.5, 0.75):
            p = a.lerp(b, f) + UP * (zz + 0.02)
            k.beam("timber", False, p, p + back, 0.05, 0.012, 0)
    return z + shelves[0] + 0.03


def propped_board_body(lo_a, lo_b, hi_a, hi_b, rng, thick=0.04, props=True, mat="deck"):
    """A large plain board propped at a slant (a shutter taken down, a counter top): its low edge lo_a-lo_b, its high
    edge hi_a-hi_b (x, y, z), two battens under it and two sticks propping its high edge. Collides (a walker can't step
    through it)."""
    A, B, C, D = V(lo_a), V(lo_b), V(hi_b), V(hi_a)
    _slab(mat, True, [A, B, C, D], thick)
    nrm = (B - A).cross(D - A).normalized()
    if nrm.z < 0:
        nrm = -nrm
    for f in (0.15, 0.85):
        p, q = A.lerp(B, f), D.lerp(C, f)
        k.beam("timber", False, p - nrm * (thick + 0.015), q - nrm * (thick + 0.015), 0.05, 0.03, 0)
    if props:
        for f in (0.25, 0.75):
            q = D.lerp(C, f) - nrm * thick
            foot = V((q.x, q.y, min(A.z, B.z))) + V(((D - A).x, (D - A).y, 0)).normalized() * 0.08
            foot.z = min(A.z, B.z)
            k.beam("bamboo", True, foot, q, 0.03, 0.03, 0)


def rail_bundle_body(rail, out, rng, h=0.55, w=0.38, mat="cloth_white"):
    """A pale bundle hanging over the outside of a railing (S3.prop.bundle_over_rail_19392): a soft lumpy bundle with
    vertical folds hung on a rope tied round the rail's top. rail: (x, y, z) on the rail's top at the bundle; out: plan
    direction out of the deck. choice: 0.55 m tall, 0.38 m across."""
    R = V(rail)
    o = V((out[0], out[1], 0)).normalized()
    c = R + o * (w * 0.55) - UP * (0.12 + h)
    ki._ribbed_lathe(mat, False, tuple(c), [(w * 0.18, 0.0), (w * 0.42, h * 0.15), (w * 0.5, h * 0.45), (w * 0.46, h * 0.75),
                                             (w * 0.3, h * 0.93), (w * 0.12, h)], 10, ribs=0.12, ribbed=(1, 2, 3, 4),
                     rot=rng.uniform(0, 1))
    top = c + UP * h
    sb.tube("rope", False, [top, top + UP * 0.06 - o * 0.05, R + UP * 0.03 + o * 0.02, R + UP * 0.03 - o * 0.08,
                            R - UP * 0.05 - o * 0.07], [0.012] * 5, segs=4)


def crossed_box_body(x, y, z, yaw, l, w, h, rng, stick=(0.25, 0.25, 0.55)):
    """A small box with a crossed (X) pattern on its faces, a short stick rising from it (S3.prop.small_box_20345)."""
    with k.placed(k.frame(x, y, z, yaw)):
        k.beam("timber", False, (-l / 2, 0, h / 2), (l / 2, 0, h / 2), w, h, 0.01)
        for (ax, ay), (bx_, by), nrm in ((((-l / 2, -w / 2), (l / 2, -w / 2), V((0, -1, 0)))),
                                         (((l / 2, -w / 2), (l / 2, w / 2), V((1, 0, 0)))),
                                         (((l / 2, w / 2), (-l / 2, w / 2), V((0, 1, 0)))),
                                         (((-l / 2, w / 2), (-l / 2, -w / 2), V((-1, 0, 0))))):
            A, B = V((ax, ay, 0.03)), V((bx_, by, 0.03))
            for p, q in ((A, B + UP * (h - 0.06)), (B, A + UP * (h - 0.06))):
                d = (q - p).normalized()
                sd = d.cross(nrm).normalized() * 0.012
                quad = [p - sd + nrm * 0.004, q - sd + nrm * 0.004, q + sd + nrm * 0.004, p + sd + nrm * 0.004]
                if (quad[1] - quad[0]).cross(quad[3] - quad[0]).dot(nrm) < 0:
                    quad.reverse()
                sb.B.add("lattice", False, quad, [(0, 1, 2, 3)])
        if stick:
            k.beam("bamboo", False, (l * 0.2, 0, h * 0.6), stick, 0.025, 0.025, 0)


def post_box_body(x, y, z, z_box, w, d, hb, rng, yaw=0.0):
    """A small upright lidded box on a post (S3.prop.lamp_box_18676: a lamp-box sign or a chest): a post from the
    ground to z_box, a framed box w x d x hb on it, a small hipped lid with a knob. Post collides."""
    sb.cyl("timber", True, (x, y, z - 0.05), (x, y, z + z_box), 0.04, 0.035, segs=6)
    with k.placed(k.frame(x, y, z + z_box, yaw)):
        k.beam("cloth_white", False, (0, 0, 0), (0, 0, hb), w * 0.92, d * 0.92, 0)
        for zz in (0.0, hb):
            for (ax, ay), (bx_, by) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
                k.beam("timber", False, (ax * w / 2, ay * d / 2, zz), (bx_ * w / 2, by * d / 2, zz), 0.03, 0.03, 0)
        e = 0.04
        ring = [V((-w / 2 - e, -d / 2 - e, hb + 0.02)), V((w / 2 + e, -d / 2 - e, hb + 0.02)), V((w / 2 + e, d / 2 + e, hb + 0.02)),
                V((-w / 2 - e, d / 2 + e, hb + 0.02))]
        apex = V((0, 0, hb + 0.02 + 0.12))
        for i in range(4):
            sb.B.add("roof", False, [ring[i], ring[(i + 1) % 4], apex], [(0, 1, 2)])
        sb.B.add("redwood", False, list(reversed(ring)), [(0, 1, 2, 3)])
        sb.lathe("timber", False, (0, 0, hb + 0.13), [(0.025, 0), (0.03, 0.025), (0.008, 0.05)], segs=5)


def hooked_post_body(x, y, z, h, rng, curl=(1, 0)):
    """A small thin upright with a hooked top curling over toward `curl` (plan direction)."""
    cd = V((curl[0], curl[1], 0)).normalized()
    sb.cyl("timber", True, (x, y, z - 0.03), (x, y, z + h * 0.85), 0.018, 0.015, segs=5)
    top = V((x, y, z + h * 0.85))
    pts = [top, top + UP * h * 0.12 + cd * 0.015, top + UP * h * 0.15 + cd * 0.05, top + UP * h * 0.1 + cd * 0.08]
    sb.tube("timber", False, pts, [0.015, 0.014, 0.013, 0.012], segs=4)


def lying_pole_body(a, b, rng, r0=0.035, r1=0.025, mat="bamboo"):
    """A long stick lying on the ground from a (the thicker end) to b, (x, y, z)."""
    A, B = V(a) + UP * r0, V(b) + UP * r1
    sb.cyl(mat, False, A, B, r0, r1, segs=6)


def lamp_post_body(x, y, z_foot, z_top, rng, box=(0.2, 0.2, 0.26)):
    """A tall thin post at the water's edge with a small box (a lamp or a plaque) near its top (S3.prop.
    mooring_post_17702): the post from below the waterline, the box clasping it, a small cap. Collides. Returns its
    head (x, y, z), where a mooring line could end."""
    sb.cyl("timber", True, (x, y, z_foot), (x, y, z_top), 0.065, 0.05, segs=7)
    sb.lathe("timber", False, (x, y, z_top), [(0.06, 0), (0.045, 0.04), (0.012, 0.08)], segs=6)
    bw, bd, bh = box
    zb = z_top - 0.12 - bh
    k.beam("cloth_white", False, (x + 0.075, y, zb), (x + 0.075, y, zb + bh), bw * 0.9, bd * 0.9, 0)
    for zz in (zb, zb + bh):
        k.beam("timber", False, (x + 0.075 - bw / 2, y - bd / 2, zz), (x + 0.075 + bw / 2, y - bd / 2, zz), 0.025, 0.025, 0)
        k.beam("timber", False, (x + 0.075 - bw / 2, y + bd / 2, zz), (x + 0.075 + bw / 2, y + bd / 2, zz), 0.025, 0.025, 0)
    for q in range(3):
        sb.cyl("rope", False, (x, y, z_foot + 1.1 + q * 0.03), (x, y, z_foot + 1.12 + q * 0.03), 0.075, segs=7, caps=False)
    return (x, y, z_foot + 1.13)


def rope_reel_body(x, y, z, r, rng, h=0.32):
    """A rope reel standing on a boat's roof (S3.prop.round_ribbed_object_19765, the tile agents' reading): a low drum
    of coiled rope between a base disc and a top cross of radiating spokes, a spindle rising through it to a spike."""
    _lathe("timber", False, (x, y, z), [(r, 0.0), (r, 0.03)], segs=10, cap1=True)
    _lathe("rope", False, (x, y, z + 0.03), [(r * 0.8, 0.0), (r * 0.9, 0.06), (r * 0.92, 0.12), (r * 0.85, 0.18), (r * 0.5, 0.19)],
           segs=10, cap1=True)
    for i in range(6):
        a = 2 * math.pi * i / 6 + rng.uniform(-0.05, 0.05)
        k.beam("timber", False, (x, y, z + 0.23), (x + math.cos(a) * r, y + math.sin(a) * r, z + 0.21), 0.03, 0.025, 0)
    _lathe("timber", False, (x, y, z), [(0.03, 0.0), (0.03, 0.26), (0.045, 0.27), (0.004, h + 0.12)], segs=6)


def oval_tray_body(x, y, z, L, W, rng, yaw=0.0, mat=DARK):
    """A large flat oval tray (S3.prop.shop_table_tray_20140's): floor, raised rim with thickness."""
    with k.placed(k.frame(x, y, z, yaw)):
        _tray(V((0, 0, 0)), 0.5, 0.04, mat=mat, seg=14, sx=L, sy=W)


def leaning_sign_body(foot, top, w, rng, cells=3, thick=0.04, mat="cloth_white", frame="timber", face=(0, -1)):
    """An upright signboard leaning back from its foot to its top (x, y, z: the board's bottom and top middles), w
    across: a pale board in a dark frame standing proud of it, its face (toward `face`, the viewer) carrying `cells`
    illegible characters as faded broken strokes; a small foot batten. Collides (a walker can't pass through)."""
    F, T = V(foot), V(top)
    u = (T - F).normalized()
    f = V((face[0], face[1], 0)).normalized()
    s = u.cross(f)
    s = (s - u * s.dot(u)).normalized() if s.length > 1e-6 else V((1, 0, 0))
    nrm = s.cross(u).normalized()
    if nrm.dot(f) < 0:
        s = -s
        nrm = -nrm
    hw = w / 2
    P = [F - s * hw, F + s * hw, T + s * hw, T - s * hw]
    _slab(mat, True, P, thick, down=-nrm)
    for a, b in ((P[0], P[1]), (P[1], P[2]), (P[2], P[3]), (P[3], P[0])):
        e = (b - a).normalized() * 0.02
        k.beam(frame, False, a - e + nrm * 0.006, b + e + nrm * 0.006, 0.04, 0.04, 0)
    L = (T - F).length
    _strokes("lattice", (F + T) / 2 + nrm * 0.01, s, u, nrm, w * 0.6, L * 0.75, cells, rng)
    k.beam("timber", False, F - s * (hw + 0.05) - nrm * 0.05, F + s * (hw + 0.05) - nrm * 0.05, 0.06, 0.05, 0)


def hanging_sign_body(top, w, h, rng, cells=2, face=(0, -1), cord=0.16):
    """A small framed signboard hanging on two cords from its top middle `top` (x, y, z: where the cords meet a rib):
    a pale board in a dark frame with a capping strip, its face toward `face` carrying `cells` illegible characters as
    faded broken strokes (map: □□)."""
    f = V((face[0], face[1], 0)).normalized()
    s = V((-f.y, f.x, 0))
    T = V(top) - UP * cord
    B = T - UP * h
    P = [B - s * w / 2, B + s * w / 2, T + s * w / 2, T - s * w / 2]
    _slab("cloth_white", False, P, 0.02, down=-f)
    for a, b in ((P[0], P[1]), (P[1], P[2]), (P[3], P[0])):
        k.beam("lattice", False, a + f * 0.005, b + f * 0.005, 0.025, 0.025, 0)
    k.beam("timber", False, P[3] - s * 0.02 + UP * 0.012, P[2] + s * 0.02 + UP * 0.012, 0.04, 0.03, 0)
    _strokes("lattice", (T + B) / 2 + f * 0.012, s, UP, f, w * 0.55, h * 0.75, cells, rng)
    for e in (T - s * w * 0.3, T + s * w * 0.3):
        sb.cyl("rope", False, tuple(e + UP * 0.02), tuple(V(top)), 0.005, segs=3, caps=False)


def table_row_body(p_w, p_e, n, zf, rng, size=(0.72, 0.72, 0.76), bench=(0.72, 0.42), lod=1):
    """A row of n small square tables, each with a bench before it (south), spaced evenly from p_w to p_e (x, y) along
    the far bank's shop front (S3.prop.far_bank_tables_19210, 'about 7'). choice: tables 0.72 m, benches 0.72 m."""
    A, B = V((p_w[0], p_w[1], 0)), V((p_e[0], p_e[1], 0))
    d = B - A
    yaw = math.degrees(math.atan2(d.y, d.x))
    _, nrm = _rot(yaw)
    for i in range(n):
        c = A.lerp(B, (i + 0.5) / n)
        table_body(c.x, c.y, yaw, zf, size[0], size[1], size[2], rng, stretch=True, apron=None, lod=lod)
        if bench:
            b = c - nrm * (size[1] / 2 + 0.2)
            bench_body(b.x, b.y, yaw, zf, bench[0], rng, h=bench[1], w=0.22, lod=lod)


# ---------------------------------------------------------------- the handcart (S3.veh.handcart_19862)

class Cart(int):
    """Triangles added (an int), plus `.tips` (x, y, z): the middle between the shaft tips (where a puller's hands go),
    and `.axle` (x, y, z)."""

    def __new__(cls, tris, tips=None, axle=None):
        o = super().__new__(cls, tris)
        o.tips, o.axle = tips, axle
        return o


def handcart(front, rear, wheels=None, z_of=None, rng=None, R=0.5, spokes=10, body_len=1.6, body_w=0.85, side_h=0.4,
             shaft_len=0.95, axle_from_rear=0.45):
    """A two-wheeled handcart (S3.veh.handcart_19862): a slatted box body whose two long top rails run on past its
    front end as shafts (a man pulls between them), two big spoked wheels on an axle under the body's rear half, two
    resting legs under the body's front. Real size, its axle at the painted wheel (wheels[0]), heading rear -> front;
    the shafts end shaft_len past the body (they may reach past the painted `front`: Cart.tips says where).
    One hidden collider. choice: R 0.5 (painted wheel ~78 px ≈ 1 m tall), body 1.6 x 0.85 x 0.4 m, shafts 0.95 m.
    Returns a Cart (int triangles) with .tips and .axle."""
    z_of = kv._zf(z_of)
    rng = rng or random.Random(19862)
    t0 = _tri()
    origin, fwd, left, L = kv._axis(rear, front)
    s_w = kv._along(wheels[0], origin, fwd) if wheels else L * 0.25
    zg = z_of(*(origin + fwd * s_w).xy)
    M = kv._frame_m(origin, fwd, zg)
    hw = body_w / 2
    x_r = s_w - axle_from_rear
    x_f = x_r + body_len
    x_t = x_f + shaft_len
    z_b = R + 0.06                       # the body's floor
    z_r = z_b + side_h                   # its top rails
    z_tip = 0.82                          # the shafts' tips at a puller's hands
    with k.placed(M):
        for sgn in (1, -1):
            y = sgn * hw
            pts = [V((x_r - 0.06, y, z_r)), V((x_f, y, z_r)), V((x_t, sgn * (hw - 0.05), z_tip))]
            kv._polybeam("timber", pts, 0.06, 0.07, 0.012)
            k.beam("timber", False, (x_r - 0.04, y, z_b), (x_f + 0.04, y, z_b), 0.07, 0.08, 0.012)
            for x in (x_r, x_f, (x_r + x_f) / 2):
                k.beam("timber", False, (x, y, z_b - 0.04), (x, y, z_r), 0.05, 0.05, 0)
            m = 7
            for i in range(1, m):
                if i == m // 2:
                    continue
                x = x_r + body_len * i / m
                a, b = V((x - 0.02, y + sgn * 0.004, z_b + 0.05)), V((x + 0.02, y + sgn * 0.004, z_b + 0.05))
                quad = [a, b, b + UP * (side_h - 0.07), a + UP * (side_h - 0.07)]
                if sgn < 0:
                    quad.reverse()
                sb.B.add("timber", False, quad, [(0, 1, 2, 3)])
            sb.B.add(DARK, False, [V((x_r + 0.03, y - sgn * 0.02, z_b + 0.02)), V((x_f - 0.03, y - sgn * 0.02, z_b + 0.02)),
                                   V((x_f - 0.03, y - sgn * 0.02, z_r - 0.03)), V((x_r + 0.03, y - sgn * 0.02, z_r - 0.03))][::sgn],
                     [(0, 1, 2, 3)])
            # resting leg under the body's front
            k.beam("timber", False, (x_f - 0.1, y * 0.95, z_b - 0.02), (x_f - 0.05, y * 0.98, 0.02), 0.045, 0.045, 0)
        for x in (x_r, x_f):
            k.beam("timber", False, (x, hw, z_r - 0.02), (x, -hw, z_r - 0.02), 0.05, 0.05, 0)
            k.beam("timber", False, (x, hw, z_b + 0.15), (x, -hw, z_b + 0.15), 0.4 * 0 + 0.03, 0.26, 0)
        nb = 4
        for i in range(nb):
            ya = -hw + 0.03 + i * (2 * hw - 0.06) / nb
            yb = ya + (2 * hw - 0.06) / nb - 0.012
            k.beam("timber", False, (x_r + 0.02, (ya + yb) / 2, z_b + 0.02), (x_f - 0.02, (ya + yb) / 2, z_b + 0.02), yb - ya, 0.03, 0)
        k.beam("timber", False, (s_w, hw + 0.2, R), (s_w, -hw - 0.2, R), 0.07, 0.07, 0.012)
        for sgn in (1, -1):
            k.beam("timber", False, (s_w, sgn * (hw - 0.03), R + 0.03), (s_w, sgn * (hw - 0.03), z_b - 0.03), 0.08, 0.06, 0)
        k.beam("timber", False, (x_t - 0.05, hw - 0.06, z_tip), (x_t - 0.05, -hw + 0.06, z_tip), 0.045, 0.045, 0)
        _hidden_box((x_r - 0.1, -hw - 0.25, 0.0), (x_f + 0.1, hw + 0.25, z_r + 0.1))
    for sgn in (1, -1):
        kv.spoked_wheel(M @ V((s_w, sgn * (hw + 0.13), R)), left * sgn, R, spokes=spokes, hub_len=0.22, phase=rng.uniform(0, 1))
    tips = M @ V((x_t, 0, z_tip))
    axle = M @ V((s_w, 0, R))
    return Cart(_tri() - t0, tuple(round(v, 3) for v in tips), tuple(round(v, 3) for v in axle))


# ---------------------------------------------------------------- the dispatcher

class Ctx:
    """One table entry's context for its placer: its map entity, plan position, the support's z (z_at), the rng, the
    run (other entries' args, built tops, the deck's axis)."""

    def __init__(self, eid, ent, z_at, rng, run, entry):
        self.id, self.e, self.rng, self.run, self.entry = eid, ent, rng, run, entry
        self.x, self.y = ent["pos"][0], ent["pos"][1]
        self._z_at = z_at

    def z(self, x=None, y=None):
        """The support's z under (x, y) (default the entity's position). A prop on one of this table's built tops
        stands on it (TOPS); everything else asks the builder's z_at."""
        sup = self.e.get("support") or ""
        if sup.startswith("table top: ") and sup[11:].strip() in TOPS:
            return TOPS[sup[11:].strip()]
        return self._z_at(self.x if x is None else x, self.y if y is None else y, self.e)

    def zf(self):
        return lambda x, y: self.z(x, y)

    def pt(self, name):
        p = self.e["pts"][name]
        return (p[0], p[1])

    def corners(self):
        return [self.pt(n) for n in ("sw", "se", "ne", "nw")]

    def yaw(self, v):
        if isinstance(v, str):
            if v.startswith("deck"):
                return self.run["deck_yaw"] + (float(v[4:]) if len(v) > 4 else 0.0)
            raise ValueError(f"{self.id}: yaw {v!r}")
        return float(v or 0.0)

    def off(self, d, yaw=0.0):
        """World plan point of a local offset d = (along yaw, left of it) from the entity's position."""
        return _w(self.x, self.y, yaw, d[0], d[1])

    def anchored(self, L, W, yaw, anchor):
        """The centre of an L x W thing whose painted foot (the map's base point) is `anchor`: 'center', or 'front'
        (the base is the middle of its south edge: the front legs' feet, as the tile agents read most tables), 'back'."""
        if anchor == "center":
            return self.x, self.y
        a = math.radians(yaw)
        dn = abs(L / 2 * math.sin(a)) + abs(W / 2 * math.cos(a))
        return self.x, self.y + (dn if anchor == "front" else -dn)


# placers: one per kind of entry (props_table.json `part`), fn(c, **args)

def table(c, L, W, h, yaw=0.0, anchor="front", legs="square", splay=0.0, stretch=False, apron="rails", top_mat="timber",
          lod=0, goods=None, shelf=False, collide=True):
    """A table, counter or stand on its feet (each leg on the support under it). goods: things painted on it that
    belong to this entity ([{"kind": "bowls"|"bowl_stacks"|"jars"|"dish"|"lidded_box"|"buns"|"pot"|"tray"|"wares",
    "at": [u, v] (fractions of L and W from the centre), ...}])."""
    yaw = c.yaw(yaw)
    cx, cy = c.anchored(L, W, yaw, anchor)
    zt = table_body(cx, cy, yaw, c.zf(), L, W, h, c.rng, legs=legs, splay=splay, stretch=stretch, apron=apron,
                    top_mat=top_mat, lod=lod, shelf=shelf, collide=collide)
    TOPS[c.id] = zt
    c.run["plans"][c.id] = (cx, cy, yaw, L, W)
    for g in goods or ():
        _goods(c, g, cx, cy, yaw, L, W, zt)
    return zt


def _goods(c, g, cx, cy, yaw, L, W, zt):
    u, v = g.get("at", (0.0, 0.0))
    x, y = _w(cx, cy, yaw, u * L, v * W)
    kind, rng = g["kind"], c.rng
    n = g.get("n", 3)
    if kind == "bowls":
        for i in range(n):
            px, py = _w(x, y, yaw, (i - (n - 1) / 2) * g.get("step", 0.2), rng.uniform(-0.05, 0.05))
            bowl(px, py, zt, r=g.get("r", 0.075), mat=g.get("mat", "cloth_white"))
    elif kind == "bowl_stacks":
        for i in range(n):
            px, py = _w(x, y, yaw, (i - (n - 1) / 2) * g.get("step", 0.2), rng.uniform(-0.05, 0.05))
            bowl_stack(px, py, zt, g.get("high", 4) + rng.randint(-1, 1), rng, r=g.get("r", 0.075), mat=g.get("mat", "cloth_white"))
    elif kind == "jars":
        for i in range(n):
            px, py = _w(x, y, yaw, (i - (n - 1) / 2) * g.get("step", 0.14), rng.uniform(-0.04, 0.04))
            jar(px, py, zt, g.get("h", 0.2) * rng.uniform(0.9, 1.1), rng, mat=g.get("mat", "jar_red"))
    elif kind == "dish":
        _tray(V((x, y, zt)), g.get("r", 0.16), 0.025, mat=g.get("mat", "cloth_white"), seg=10)
    elif kind == "tray":
        _tray(V((x, y, zt)), g.get("r", 0.22), 0.035, mat=g.get("mat", DARK), seg=12)
        if g.get("buns"):
            _buns(V((x, y, zt + 0.01)), g.get("r", 0.22) * 0.8, g["buns"], rng, s=0.045)
    elif kind == "lidded_box":
        s = g.get("s", (0.22, 0.16, 0.14))
        with k.placed(k.frame(x, y, zt, yaw)):
            k.beam(g.get("mat", "redwood"), False, (0, 0, 0), (0, 0, s[2] - 0.03), s[0], s[1], 0.008)
            k.beam(DARK, False, (0, 0, s[2] - 0.03), (0, 0, s[2]), s[0] + 0.02, s[1] + 0.02, 0.006)
    elif kind == "buns":
        _buns(V((x, y, zt)), g.get("r", 0.2), n, rng, mat=g.get("mat", "cloth_white"), s=g.get("s", 0.045))
    elif kind == "pot":
        ki.pot(x, y, zt, r=g.get("r", 0.08), h=g.get("h", 0.13), mat=g.get("mat", DARK))
    elif kind == "wares":
        for i in range(n):
            px, py = _w(x, y, yaw, (i - (n - 1) / 2) * g.get("step", 0.25), rng.uniform(-0.05, 0.05))
            if i % 2:
                bowl(px, py, zt, r=0.06, mat=DARK)
            else:
                jar(px, py, zt, 0.14, rng, mat=DARK)
    elif kind == "under":          # dark things stowed under the table (bundles, a basket)
        for i in range(n):
            px, py = _w(x, y, yaw, (i - (n - 1) / 2) * g.get("step", 0.3), rng.uniform(-0.06, 0.06))
            k.rock(g.get("mat", DARK), px, py, c.z(px, py) + 0.1, 0.13, rng, flat=0.75)
    elif kind == "oval_tray":
        oval_tray_body(x, y, zt, g.get("L", 0.7), g.get("W", 0.42), rng, yaw=yaw)
    else:
        raise ValueError(f"{c.id}: goods kind {kind}")


def bench(c, L, yaw=0.0, h=0.45, w=0.26, anchor="center", lattice_side=False, lod=0):
    yaw = c.yaw(yaw)
    cx, cy = c.anchored(L, w, yaw, anchor)
    return bench_body(cx, cy, yaw, c.zf(), L, c.rng, h=h, w=w, lattice_side=lattice_side, lod=lod)


def stool(c, h=0.42, s=0.32):
    ki.stool(c.x, c.y, c.z(), h=h, s=s)


def chair(c, facing=0.0, back_h=1.0, kind="slats", lod=0):
    chair_body(c.x, c.y, c.z(), c.yaw(facing), c.rng, back_h=back_h, kind=kind, lod=lod)


def parasol(c, R, hub_h, hub_off=(0.0, 0.0), tilt=(0.0, 0.0), ribs=16, rise=0.3, mat="oilpaper", vase=False):
    """A parasol on its pole: the foot at the entity's position on its support, the hub hub_h above it (offset
    hub_off m east and north where the pole slants)."""
    z = c.z()
    hub = (c.x + hub_off[0], c.y + hub_off[1], z + hub_h)
    parasol_body((c.x, c.y, z), hub, R, c.rng, ribs=ribs, tilt=tilt, rise=rise, mat=mat, vase=vase)
    c.run["parasols"][c.id] = dict(hub=hub, R=R, tilt=tuple(tilt), rise=rise)


def mat_awning(c, eave, front_h=None, back_h=None, size=None, yaw="deck", grid=(0, 0), lattice=0.0, posts="corners",
               mat="reed", rail_side=False, heights=None):
    """A woven-mat awning on poles. Plan: the entity's mapped corners (eave='corners': sw, se, ne, nw), or a real-size
    rectangle `size` [along, across] centred on its position, turned to `yaw` (on the deck: the deck's axis), its
    front the right-hand side of the axis. front_h, back_h: the eave over the support at each corner. posts: 'corners',
    or 'front' (two front poles, the back resting on the bank), or a list of corner indices; heights: the eave over
    each corner [sw, se, ne, nw] instead of front_h/back_h (an edge resting on a neighbouring canopy)."""
    if eave == "corners":
        P = c.corners()
    else:
        yw = c.yaw(yaw)
        a, d = size[0] / 2, size[1] / 2
        P = [c.off((-a, -d), yw), c.off((a, -d), yw), c.off((a, d), yw), c.off((-a, d), yw)]
    zs = [c.z(*p) for p in P]
    hs = list(heights) if heights else [front_h, front_h, back_h, back_h]
    E = [(p[0], p[1], z + h) for p, z, h in zip(P, zs, hs)]
    mat_awning_body(E, c.rng, grid=tuple(grid), lattice=lattice, mat=mat)
    idx = range(4) if posts == "corners" else ((0, 1) if posts == "front" else posts)
    feet = []
    for i in idx:
        f = (P[i][0], P[i][1], zs[i])
        feet.append((f, (E[i][0], E[i][1], E[i][2] - 0.04)))
    posts_to(feet)
    if rail_side:
        # the east side lashed to the bridge's near railing (kit: 1.05 m): a rope binding at each back post
        for i in (1, 2):
            p = V((P[i][0], P[i][1], zs[i] + 1.0))
            sb.cyl("rope", False, tuple(p - UP * 0.03), tuple(p + UP * 0.03), 0.06, segs=6, caps=False)


def frame_awning(c, eave_h=2.2, ridge_h=0.55, size=(2.2, 1.6), yaw="deck"):
    yw = c.yaw(yaw)
    a, d = size[0] / 2, size[1] / 2
    P = [c.off((-a, -d), yw), c.off((a, -d), yw), c.off((a, d), yw), c.off((-a, d), yw)]
    feet = [(p[0], p[1], c.z(*p)) for p in P]
    frame_awning_body(feet, eave_h, ridge_h, c.rng)


def bottle_stand(c, w=0.55, d=0.4, h=0.87, yaw=0.0):
    zt = bottle_stand_body(c.x, c.y, c.z(), c.yaw(yaw), w, d, h, c.rng)
    TOPS[c.id] = zt
    return zt


def bottles(c, n=5, h=0.3, spread=0.4, yaw=0.0, mat="jar_green"):
    z = c.z()
    yw = c.yaw(yaw)
    for i in range(n):
        x, y = c.off(((i - (n - 1) / 2) * spread / max(1, n - 1), c.rng.uniform(-0.08, 0.08)), yw)
        bottle(x, y, z, h * c.rng.uniform(0.85, 1.1), c.rng, mat=mat if i % 3 else "jar_red", r=h * 0.24)


def jars(c, n=6, h=0.2, spread=0.75, yaw=0.0, mat="jar_red"):
    z = c.z()
    yw = c.yaw(yaw)
    for i in range(n):
        x, y = c.off(((i - (n - 1) / 2) * spread / max(1, n - 1), c.rng.uniform(-0.05, 0.05)), yw)
        jar(x, y, z, h * c.rng.uniform(0.85, 1.1), c.rng, mat=mat if i % 2 else "jar_green")


def tray_stand(c, R, h, legs=4, splay=0.18, basket=False, goods=0, collide=True):
    zt = round_tray_stand_body(c.x, c.y, c.zf(), R, h, c.rng, legs=legs, splay=splay, basket=basket, goods=goods,
                               collide=collide)
    TOPS[c.id] = zt
    return zt


def round_tray(c, R=0.35, buns=5):
    z = c.z()
    _tray(V((c.x, c.y, z)), R, 0.04, mat=DARK, seg=12)
    if buns:
        _buns(V((c.x, c.y, z + 0.01)), R * 0.8, buns, c.rng, s=0.05)


def display_board(c, front_h=0.22, back_h=0.62, size=None, yaw=0.0):
    """On the mapped corners, or (size [L, D]) a real-size board centred on the entity, its front edge along yaw."""
    if size:
        yw = c.yaw(yaw)
        a, d = size[0] / 2, size[1] / 2
        sw, se, ne, nw = c.off((-a, -d), yw), c.off((a, -d), yw), c.off((a, d), yw), c.off((-a, d), yw)
    else:
        sw, se, ne, nw = c.corners()
    display_board_body(sw, se, ne, nw, c.zf(), c.rng, front_h=front_h, back_h=back_h)


def goods_pole(c, h=2.75, tiers=(1.5, 1.85, 2.2), arm=0.36):
    goods_pole_body(c.x, c.y, c.z(), c.rng, h=h, tiers=tuple(tiers), arm=arm)


def coiled_heap(c, n=9, r=0.17, spread=(0.8, 0.55), tiers=3, yaw="deck", on=None):
    """on: a table of this run the heap spills onto (as painted: 'at the north-east end of the table and beyond it'):
    coils over its built plan sit on its top."""
    zf = c.zf()
    if on and on in c.run["plans"]:
        cx, cy, yw, L_, W_ = c.run["plans"][on]
        t, nn = _rot(yw)

        def zf(x, y, _z=c.zf()):
            d = V((x - cx, y - cy, 0))
            if abs(d.dot(t)) <= L_ / 2 and abs(d.dot(nn)) <= W_ / 2:
                return TOPS[on]
            return _z(x, y)
    coiled_heap_body(c.x, c.y, c.z(), c.rng, n=n, r=r, spread=tuple(spread), tiers=tiers, yaw=c.yaw(yaw), zf=zf)


def basket(c, r=0.2, h=0.25, mat="reed", lid=False, mouth=1.0):
    """kit_inner_city.round_basket at the entity (a dark basket: mat 'bark')."""
    ki.round_basket(c.x, c.y, c.z(), r, h, c.rng, mat=mat, mouth=mouth, lid=lid)
    TOPS[c.id] = c.z() + h


def fruit_heap(c, R=0.3, h=0.32, n=16):
    fruit_heap_body(c.x, c.y, c.z() - 0.04, c.rng, R=R, h=h, n=n)


def tub(c, r=0.35, h=0.18, mat=DARK):
    ki.tub(c.x, c.y, c.z(), r, h, c.rng, mat=mat)


def pot_rack(c, w=0.75, h=1.5, depth=0.28, shelf=0.6, yaw=0.0):
    """The open rack of shelves against the hall's back wall with the dark pot on its lowest shelf: the rack is what
    makes the painted pot stand (map/BUILDING.md rule 3), built under the pot's ID."""
    yw = c.yaw(yaw)
    pl, pr = c.off((-w / 2, -depth), yw), c.off((w / 2, -depth), yw)     # its back on the wall's floor line (the base)
    z = c.z()
    zs = shelf_rack_body(pl, pr, z, h, depth, c.rng, shelves=(shelf, shelf + 0.42, shelf + 0.84))
    px, py = c.off((-0.08, 0.0), yw)
    ki.pot(px, py, zs, r=0.09, h=0.14, mat=DARK)


def propped_board(c, L=1.4, D=0.9, low=0.12, high=0.7, yaw=0.0, anchor="front"):
    """A board L wide (along yaw) and D deep (in plan), its low edge (south) `low` and its high edge (north) `high`
    above the ground."""
    yw = c.yaw(yaw)
    cx, cy = c.anchored(L, D, yw, anchor)
    a, b = _w(cx, cy, yw, -L / 2, -D / 2), _w(cx, cy, yw, L / 2, -D / 2)
    cc, d = _w(cx, cy, yw, L / 2, D / 2), _w(cx, cy, yw, -L / 2, D / 2)
    propped_board_body((a[0], a[1], c.z(*a) + low), (b[0], b[1], c.z(*b) + low), (d[0], d[1], c.z(*d) + high),
                       (cc[0], cc[1], c.z(*cc) + high), c.rng)


def rail_bundle(c, rail_h=1.05, out="deck-90", h=0.55, w=0.38):
    """The bundle over the bridge's near railing: the base point is the railing's foot (the map), the rail's top
    rail_h over the deck there (the bridge kit's railing: 1.05 m), out = the plan direction out of the deck."""
    o = math.radians(c.yaw(out))
    rail_bundle_body((c.x, c.y, c.z() + rail_h), (math.cos(o), math.sin(o)), c.rng, h=h, w=w)


def crossed_box(c, l=0.34, w=0.3, h=0.32, yaw=0.0):
    crossed_box_body(c.x, c.y, c.z(), c.yaw(yaw), l, w, h, c.rng, stick=(0.28, 0.24, 0.62))


def post_box(c, z_box=1.3, w=0.32, d=0.26, hb=0.32):
    post_box_body(c.x, c.y, c.z(), z_box, w, d, hb, c.rng)


def hooked_post(c, h=0.3, curl=(1, 0), on_h=0.0):
    """on_h: stands that high over the support (on a wall's coping: the builder's wall top over its ground)."""
    hooked_post_body(c.x, c.y, c.z() + on_h, h, c.rng, curl=curl)


def lying_pole(c, L=1.5, yaw=0.0):
    yw = c.yaw(yaw)
    a, b = c.off((-L / 2, 0), yw), c.off((L / 2, 0), yw)
    lying_pole_body((a[0], a[1], c.z(*a)), (b[0], b[1], c.z(*b)), c.rng)


def leaning_pole(c, top=(-0.6, 0.12, 2.4), r=0.03):
    z = c.z()
    sb.cyl("bamboo", True, (c.x, c.y, z - 0.02), (c.x + top[0], c.y + top[1], z + top[2]), r, r * 0.8, segs=6)


def lamp_post(c, above=2.4, below=0.6):
    """Standing in the water's edge: above, below = the post's top above and its foot below the support (the water)."""
    z = c.z()
    try:                       # the shared mooring stake from factory (c) (catalogue section 6), once it lands
        import kit_common
    except ImportError:
        kit_common = None
    if kit_common is not None and hasattr(kit_common, "mooring_stake"):
        return kit_common.mooring_stake(c.x, c.y, z - below, z + above, c.rng, lamp=True)
    return lamp_post_body(c.x, c.y, z - below, z + above, c.rng)


def rope_reel(c, r=0.24):
    rope_reel_body(c.x, c.y, c.z(), r, c.rng)


def leaning_sign(c, w=0.36, L=0.95, lean=(0.12, 0.22), cells=3):
    """foot at the entity's base; its top leans back by lean = (east, north) m (the map's top point's direction)."""
    z = c.z()
    t = V((lean[0], lean[1], 0))
    hz = math.sqrt(max(0.1, L * L - t.length_squared))
    leaning_sign_body((c.x, c.y, z + 0.05), (c.x + lean[0], c.y + lean[1], z + 0.05 + hz), w, c.rng, cells=cells)


def hanging_sign(c, parasol_id, w=0.24, h=0.5, cells=2, t=0.72):
    """Hung from a rib of the parasol `parasol_id` (built earlier in this run) straight above the entity's position."""
    p = c.run["parasols"].get(parasol_id)
    if p is None:
        top = (c.x, c.y, c.z() + 2.2)
    else:
        hub = p["hub"]
        a = math.atan2(c.y - hub[1], c.x - hub[0])
        r = math.hypot(c.x - hub[0], c.y - hub[1])
        tt = min(0.98, r / p["R"]) if p["R"] > 0 else t
        top = (c.x, c.y, canopy_z(hub, p["R"], tt, a, p["tilt"], p["rise"]) - 0.04)
    hanging_sign_body(top, w, h, c.rng, cells=cells)


def table_row(c, w_off, e_off, n=7, size=(0.72, 0.72, 0.76), bench=(0.72, 0.42)):
    """The far bank's row of tables: its ends w_off, e_off (dX, dD from the entity's base: the map's w_end and e_end
    stroke points through the frame, so a move of the entity moves the row)."""
    pw = (c.x + w_off[0], c.y + w_off[1])
    pe = (c.x + e_off[0], c.y + e_off[1])
    table_row_body(pw, pe, n, c.zf(), c.rng, size=tuple(size), bench=tuple(bench) if bench else None)


def oval_tray(c, L=0.7, W=0.42):
    oval_tray_body(c.x, c.y, c.z(), L, W, c.rng)


def small_thing(c, kind="pot", r=0.08, h=0.14):
    """A small vessel standing on its support: kind 'pot' (dark round pot), 'handled_basket' (a small round basket with
    a bail handle), 'jar' (narrow round-topped jar), 'bowl'."""
    z = c.z()
    if kind == "pot":
        ki.pot(c.x, c.y, z, r=r, h=h, mat=DARK)
    elif kind == "handled_basket":          # small and far: a light woven body, its dark inside, a bail handle
        _lathe("reed", False, (c.x, c.y, z), [(r * 0.7, 0.0), (r, h * 0.6), (r * 0.95, h)], segs=7)
        _lathe(DARK, False, (c.x, c.y, z), [(r * 0.9, h - 0.004), (r * 0.6, h * 0.5)], segs=7, cap0=False, cap1=True)
        sb.tube("bamboo", False, [(c.x - r * 0.9, c.y, z + h), (c.x - r * 0.5, c.y, z + h + r * 0.8), (c.x + r * 0.5, c.y, z + h + r * 0.8),
                                  (c.x + r * 0.9, c.y, z + h)], [0.01] * 4, segs=3)
    elif kind == "jar":
        jar(c.x, c.y, z, h, c.rng, r=r, mat="jar_green")
    elif kind == "bowl":
        bowl(c.x, c.y, z, r=r, mat="cloth_white")
    else:
        raise ValueError(kind)


def dishes(c, n=3, spread=0.35, yaw=0.0, mat=DARK):
    z = c.z()
    yw = c.yaw(yaw)
    for i in range(n):
        x, y = c.off(((i - (n - 1) / 2) * spread / max(1, n - 1), c.rng.uniform(-0.06, 0.06)), yw)
        bowl(x, y, z, r=0.075, mat=mat)


def slat_rack(c, l=0.6, w=0.35, h=0.9, yaw=0.0, slats="h", legs=0.0, top=True, light_box=None):
    """A box, rack or crate with slatted sides (slats as thin boards proud of a dark inside: the gaps draw the ink), on
    `legs` m legs; light_box: [l, w, h] a pale box beside it to the west (the goods stand's 'light box-like thing').
    The body collides (hidden)."""
    yw = c.yaw(yaw)
    z = c.z()
    slat_box_body(c.x, c.y, z, yw, l, w, h, c.rng, slats=slats, legs=legs, top=top)
    if light_box:
        bl, bw_, bh = light_box
        bx_, by_ = c.off((-(l / 2 + bl / 2 + 0.08), 0.0), yw)
        with k.placed(k.frame(bx_, by_, c.z(bx_, by_), yw)):
            k.beam("cloth_white", False, (0, 0, 0), (0, 0, bh), bl, bw_, 0.015)
            k.beam("rope", False, (0, -bw_ / 2 - 0.004, bh * 0.5), (0, bw_ / 2 + 0.004, bh * 0.5), 0.02, bh + 0.01, 0)


def slat_box_body(x, y, z, yaw, l, w, h, rng, slats="v", legs=0.0, top=True, gap=0.085):
    """A slatted box, stand or rack: corner posts (running down `legs` m as legs), rails round its top and bottom, the
    slats as thin boards just proud of a dark inside (the gaps draw the ink: cheaper than kit_outer_road.slatted_box
    for a far or faded prop), a top board. Collides (hidden)."""
    hl, hw = l / 2, w / 2
    zb, zt = legs, legs + h
    with k.placed(k.frame(x, y, z, yaw)):
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.beam("timber", False, (sx * (hl - 0.02), sy * (hw - 0.02), 0), (sx * (hl - 0.02), sy * (hw - 0.02), zt), 0.04, 0.04, 0)
        sides = [((-hl, -hw), (hl, -hw)), ((hl, -hw), (hl, hw)), ((hl, hw), (-hl, hw)), ((-hl, hw), (-hl, -hw))]
        for (ax, ay), (bx_, by) in sides:
            A, B = V((ax, ay, 0)), V((bx_, by, 0))
            t = (B - A).normalized()
            nrm = V((t.y, -t.x, 0))
            for zz in (zb + 0.02, zt - 0.02):
                k.beam("timber", False, A + UP * zz, B + UP * zz, 0.03, 0.03, 0)
            sb.B.add(DARK, False, [A - nrm * 0.012 + UP * zb, B - nrm * 0.012 + UP * zb, B - nrm * 0.012 + UP * zt,
                                   A - nrm * 0.012 + UP * zt], [(0, 1, 2, 3)])
            L = (B - A).length
            if slats == "v":
                m = max(2, round(L / gap))
                for i in range(1, m):
                    p = A + t * (L * i / m) + nrm * 0.006
                    sb.B.add("timber", False, [p - t * 0.014 + UP * (zb + 0.03), p + t * 0.014 + UP * (zb + 0.03),
                                               p + t * 0.014 + UP * (zt - 0.03), p - t * 0.014 + UP * (zt - 0.03)], [(0, 1, 2, 3)])
            else:
                m = max(2, round(h / gap))
                for i in range(1, m):
                    zz = zb + h * i / m
                    p, q = A + t * 0.02 + nrm * 0.006, B - t * 0.02 + nrm * 0.006
                    sb.B.add("timber", False, [p + UP * (zz - 0.014), q + UP * (zz - 0.014), q + UP * (zz + 0.014),
                                               p + UP * (zz + 0.014)], [(0, 1, 2, 3)])
        if top:
            k.beam("timber", False, (-hl - 0.01, 0, zt + 0.012), (hl + 0.01, 0, zt + 0.012), w + 0.02, 0.025, 0)
        _hidden_box((-hl, -hw, 0), (hl, hw, zt))


def slat_panel(c, w=0.38, top_rise=1.0, yaw="deck", lean=0.45):
    """A short panel of two rails with slanting slats between them (S3.prop.slatted_panel_18615: a rack, a ladder set
    down or a bench back), standing on its foot at the entity's position and leaning `lean` m back (across yaw) to its
    top top_rise m up."""
    yw = c.yaw(yaw)
    t, n = _rot(yw)
    z = c.z()
    F = V((c.x, c.y, z))
    T = F + n * lean + UP * top_rise
    for s in (-1, 1):
        k.beam("timber", False, F + t * s * w / 2, T + t * s * w / 2, 0.04, 0.04, 0)
    for i in range(5):
        f0, f1 = 0.1 + 0.16 * i, 0.1 + 0.16 * i + 0.12
        a, b = F.lerp(T, f0) - t * w / 2, F.lerp(T, f1) + t * w / 2
        k.beam("timber", False, a, b, 0.03, 0.02, 0)


def handcart_entry(c, **kw):
    """(Not in the props table: the builder calls handcart() for S3.veh.handcart_19862 itself.)"""
    p = c.e["pts"]
    return handcart(p["front"], p["rear"], wheels=[p["wheel0"]] if "wheel0" in p else None, z_of=lambda x, y: c.z(x, y),
                    rng=c.rng, **kw)


def _order(entries, have):
    """Supports before the things on them."""
    first, later, last = [], [], []
    for e in entries:
        sup = (have.get(e["id"], {}) or {}).get("support") or ""
        if e.get("part") == "hanging_sign":          # hung from a parasol built earlier in the run
            last.append(e)
        else:                                         # on a table, or spilling onto one ("on")
            (later if sup.startswith("table top: ") or (e.get("args") or {}).get("on") else first).append(e)
    return first + later + last


def deck_yaw(ents):
    """The built deck's axis: the bridge kit builds the deck square along one axis (48.7 deg from east as fitted); the
    mapped deck_e line (50.5 deg end to end) is the painted edge, not the built one."""
    return DECK_YAW


def place_props(table, ents, z_at, rng, skip=()):
    """Build every prop of `table` (props_table.json "props") at its layout entity, inside sb.entity(id).
    ents: layout.json entities by map ID (pos [X, D], pts, H, support, what, name).
    z_at: (X, D, ent) -> the z its base stands on at that point. The builder resolves the support there: the ground's
          heightfield, the built bridge deck (it slopes up to 34 deg), the riverside hall's upper floor (3.83), the
          far-bank hall's raised deck (0.39), the top of the table the prop stands on, a boat's roof. Call it at every
          foot of a thing on a slope (each leg or post of a stall on the deck).
    skip: ids not to build (the builder's call).
    Returns {id: triangles}."""
    import importlib
    if isinstance(table, dict):          # the whole props_table.json passed: take its "props"
        table = table.get("props", [])
    TOPS.clear()
    run = {"deck_yaw": deck_yaw(ents), "parasols": {}, "plans": {}, "ents": ents}
    out = {}
    for e in _order(list(table), ents):
        eid = e["id"]
        if eid in skip or eid not in ents:
            continue
        part, args = e["part"], dict(e.get("args") or {})
        args.pop("top_h", None)          # the builder's: its z_at reads it (a carrying prop's top above its base)
        c = Ctx(eid, ents[eid], z_at, rng, run, e)
        before = sb.B.tris.get(eid, 0)
        with sb.entity(eid):
            if "." in part:
                mod, fn = part.rsplit(".", 1)
                f = getattr(importlib.import_module(mod), fn)
                yw = c.yaw(args.pop("_yaw", 0.0))
                args = {kk: (rng if vv == "$rng" else vv) for kk, vv in args.items()}
                with k.placed(k.frame(c.x, c.y, c.z(), yw)):
                    f(**args)
            else:
                globals()[part](c, **args)
        out[eid] = sb.B.tris.get(eid, 0) - before
    return out
