"""Carried props for the qingming characters: the things painted figures carry (a shoulder pole with baskets, boxes or
a bundle, the itinerant monk's back-frame, a stack of food boxes or a bundle on the back, a round fan, a bucket, a
cleaver, a bow). Each is built from the kit's primitives (song_kit.beam, street_b1.tube / cyl / lathe) plus soft,
lumpy cloth pieces (no boxes for soft things), coloured from one small palette texture, and exported on its own to
gen/props/<prop>.glb. tools/char_props.mjs then binds it into a character's GLB as an optional skinned part
`prop_<name>` (characters/props.json says which bone it follows and where the clip that holds it puts it).

The canonical frame of every prop (as exported, glTF): +Z the character's forward, +Y up, +X the character's left;
metres; the origin is the contact or grip point:
  pole_*       the point of the pole that rests on the shoulder (the pole runs along Z, the loads hang below its ends)
  back_*       the middle of the upper back the load rests against (the load sits behind, toward -Z)
  fan_round    the hand's grip on the handle (the handle runs up +Y, the round blade above it)
  bucket       the middle of the bucket's bottom (it sits upright, +Y up; the rope handle arcs over its mouth)
  cleaver      the grip (the handle runs along +Y, the blade forward of it, edge down)
  bow          the grip in the middle of the bow (the bow stands along +Y, its belly toward +Z, the string behind)
In Blender (Z up) that is: forward = -Y, up = +Z, left = +X; the exporter's Y-up conversion turns it into the above.

Headless:
  blender_wsl.sh -b --factory-startup --python char_props.py -- build <out_dir_unc> [prop,prop]
  blender_wsl.sh -b --factory-startup --python char_props.py -- review <glb_unc> <out_png_unc> <clip> <prop> <t0,t1,...>
      imports a character GLB with its props, hides every prop_* but <prop>, plays <clip>, renders the given times
      from the side and three-quarter, one row each, composed into <out_png>.
"""
import math
import os
import random
import sys

import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

PALETTE = {  # true colours
    "rope": "#c4ad84", "bamboo": "#b8955a", "bamboo_dark": "#8d6c3f", "straw": "#c9b27a", "wicker": "#a8875a",
    "timber": "#7a5a3e", "wood_dark": "#4b3626", "box_red": "#8f3f32", "box_black": "#2f2a28", "cloth_white": "#e6decb",
    "cloth_indigo": "#4f6081", "cloth_ochre": "#b48a4e", "cloth_grey": "#8a9099", "cloth_dark": "#3e3a3c",
    "lantern": "#b5463a", "gourd": "#c8a246", "iron": "#5a5d60", "fan": "#3d3634", "fan_rim": "#7a5a3e",
    "goods": "#9c7b4e", "greens": "#7d8a4f", "tassel": "#a33a2e", "paper": "#ddd2b8",
    "skin": "#d9a982", "hair": "#2a2522", "jacket_child": "#a4513f", "trousers_child": "#d8ccb0",
    "ceramic": "#8b5e3c", "sack": "#d3c29e",
}
KEYS = list(PALETTE)
PN = 5          # 5 x 5 flat cells
ATLAS = 256     # the prop texture: flat cells top-left, painted strips below (true colours, a little variation)
CELL = 16
STRIP_H, STRIP_Y0 = 24, 96
# strips: things whose surface has a grain the eye reads close up (a pole's bamboo, a staff's wood, a basket's weave);
# a mesh maps u along the thing (or round it) and v across the strip
STRIPS = {"bamboo": 0, "bamboo_dark": 1, "wood": 2, "wood_dark": 3, "wicker": 4, "straw": 5}


def _hex(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)


def _strip(name, rng):
    """One painted strip, STRIP_H x ATLAS, rows = across (v), columns = along (u)."""
    W, H = ATLAS, STRIP_H
    img = np.zeros((H, W, 3), dtype=np.float32)
    if name in ("bamboo", "bamboo_dark"):
        base = _hex(PALETTE[name])
        streak = 1 + 0.07 * np.sin(np.linspace(0, 11 * np.pi, H))[:, None] + rng.normal(0, 0.025, (H, 1))
        along = 1 + 0.06 * np.sin(np.linspace(0, np.pi, W))[None, :]          # a little lighter mid-internode
        img[:] = base * streak[..., None] * along[..., None]
        for x0 in (0, W - 6):                                               # the nodes: darker raised bands at the ends
            img[:, x0:x0 + 6] = base * 0.72
        img[:, 6:9] = base * 1.12                                           # the pale ring just past a node
        img[:, W - 9:W - 6] = base * 1.12
    elif name in ("wood", "wood_dark"):
        base = _hex(PALETTE["timber" if name == "wood" else "wood_dark"])
        grain = 1 + 0.10 * np.sin(np.linspace(0, 23 * np.pi, H) + rng.uniform(0, 3))[:, None] + rng.normal(0, 0.03, (H, 1))
        knots = 1 - 0.12 * np.exp(-((np.arange(W) - rng.uniform(40, 200)) / 6) ** 2)[None, :]
        img[:] = base * grain[..., None] * knots[..., None]
    elif name == "wicker":
        base = _hex(PALETTE["wicker"])
        for y in range(H):
            for x in range(W):
                over = ((x // 6) + (y // 4)) % 2            # over-under weave: alternating short strands
                img[y, x] = base * (1.08 if over else 0.86) * (1 - 0.05 * ((y % 4) in (0, 3)))
    elif name == "straw":
        base = _hex(PALETTE["straw"])
        img[:] = base * (1 + 0.09 * np.sin(np.linspace(0, 31 * np.pi, H)) + rng.normal(0, 0.03, H))[:, None, None]
    return np.clip(img, 0, 1)


def palette_image():
    import random as _r
    rng = np.random.default_rng(7)
    buf = np.ones((ATLAS, ATLAS, 4), dtype=np.float32)
    for k, name in enumerate(KEYS):
        rgb = _hex(PALETTE[name])
        cx, cy = k % PN, k // PN
        buf[ATLAS - (cy + 1) * CELL:ATLAS - cy * CELL, cx * CELL:(cx + 1) * CELL, :3] = rgb
    for name, row in STRIPS.items():
        y0 = STRIP_Y0 + row * STRIP_H
        img = _strip(name, rng)
        buf[ATLAS - y0 - STRIP_H:ATLAS - y0, :, :3] = img[::-1]
    img = bpy.data.images.new("prop_palette", ATLAS, ATLAS, alpha=False)
    img.pixels.foreach_set(buf.reshape(-1))
    img.pack()
    return img


def palette_uv(mat):
    k = KEYS.index(mat) if mat in PALETTE else KEYS.index("rope")
    cx, cy = k % PN, k // PN
    return ((cx * CELL + CELL / 2) / ATLAS, 1 - (cy * CELL + CELL / 2) / ATLAS)


def strip_uv(name, u, v):
    """Strip-local (u along, v across, both 0..1) -> atlas UV (glTF: v from the top)."""
    y0 = STRIP_Y0 + STRIPS[name] * STRIP_H
    return ((1 + u * (ATLAS - 2)) / ATLAS, 1 - (y0 + 1 + v * (STRIP_H - 2)) / ATLAS)


def kit():
    import street_b1 as sb
    import song_kit as k
    sb.B = sb.Buckets()
    for name, col in PALETTE.items():          # the kit's soft pieces look up a tile size per material
        sb.MATERIALS.setdefault(name, (None, 1.0, col))
    for name in STRIPS:
        sb.MATERIALS.setdefault("strip:" + name, (None, 1.0, "#808080"))
    return sb, k


V = Vector
UP = V((0, 0, 1))
FWD = V((0, -1, 0))   # the character's forward in Blender
LEFT = V((1, 0, 0))


# ---------------------------------------------------------------- soft pieces and woven things

def soft_roll(sb, mat, p0, p1, r, squash=0.85, segs=7, rng=None, lump=0.08):
    """A soft cloth bundle from p0 to p1: rounded, bellied, a little lumpy."""
    rng = rng or random.Random(7)
    p0, p1 = V(p0), V(p1)
    ax = p1 - p0
    L = ax.length
    ax.normalize()
    side = ax.cross(UP)
    if side.length < 1e-6:
        side = V((1, 0, 0))
    side.normalize()
    up = side.cross(ax).normalized()
    prof = [(0.0, 0.18), (0.08, 0.7), (0.26, 0.97), (0.5, 1.03), (0.74, 0.97), (0.92, 0.7), (1.0, 0.18)]
    vs, fs = [], []
    for t, f in prof:
        c = p0 + ax * (L * t)
        for i in range(segs):
            a = 2 * math.pi * i / segs
            rr = r * f * (1 + rng.uniform(-lump, lump))
            vs.append(c + side * math.cos(a) * rr + up * math.sin(a) * rr * squash)
    m = len(prof)
    for j in range(m - 1):
        for i in range(segs):
            a, b = j * segs + i, j * segs + (i + 1) % segs
            fs.append((a, b, b + segs, a + segs))
    fs.append(tuple(reversed(range(segs))))
    fs.append(tuple(range((m - 1) * segs, m * segs)))
    sb.B.add(mat, False, vs, fs)


def lump(sb, mat, c, rx, ry, rz, rng, nu=8, nv=5, k=0.12):
    """A soft heap or knotted bundle: a squashed, lumpy ellipsoid centred at c."""
    c = V(c)
    ph = [rng.uniform(0, 6.28) for _ in range(3)]
    vs = []
    for j in range(nv + 1):
        t = math.pi * j / nv
        for i in range(nu):
            a = 2 * math.pi * i / nu
            n = 1 + k * math.sin(3 * a + ph[0]) * math.sin(2 * t + ph[1]) + 0.5 * k * math.cos(2 * a - t + ph[2])
            vs.append(c + V((math.sin(t) * math.cos(a) * rx * n, math.sin(t) * math.sin(a) * ry * n, math.cos(t) * rz * n)))
    fs = []
    for j in range(nv):
        for i in range(nu):
            a0, a1 = j * nu + i, j * nu + (i + 1) % nu
            fs.append((a0, a1, a1 + nu, a0 + nu))
    # pole caps: collapse rings 0 and nv into fans by reusing their first vertex (the rings are points already)
    sb.B.add(mat, False, vs, fs)


def stube(sb, strip, pts, radii, segs=10, breaks=None, caps=True):
    """A round member through a polyline with its surface mapped onto a painted strip: u runs along it, restarting at
    each index in `breaks` (bamboo internodes), v runs round it. Smooth-shaded at bake."""
    pts = [V(p) for p in pts]
    n = len(pts)
    breaks = sorted(set([0, n - 1] + list(breaks or [])))
    verts, faces, uvs = [], [], []
    # ring frames by parallel transport (each turned from the last by the change of direction), so the rings never flip
    # where the line's slope changes sign
    frames, prev_d = [], None
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        if prev_d is None:
            m = d.to_track_quat("Z", "X" if abs(d.y) > 0.9 else "Y").to_matrix()
        else:
            m = prev_d.rotation_difference(d).to_matrix() @ frames[-1]
        frames.append(m)
        prev_d = d
    seg_of = []
    for i in range(n - 1):
        b0 = max(x for x in breaks if x <= i)
        b1 = min(x for x in breaks if x > i)
        seg_of.append((b0, b1))
    for i in range(n - 1):
        b0, b1 = seg_of[i]
        u0, u1 = (i - b0) / (b1 - b0), (i + 1 - b0) / (b1 - b0)
        for j in range(segs):
            a0, a1 = 2 * math.pi * j / segs, 2 * math.pi * (j + 1) / segs
            q = [pts[i] + frames[i] @ V((math.cos(a0) * radii[i], math.sin(a0) * radii[i], 0)),
                 pts[i] + frames[i] @ V((math.cos(a1) * radii[i], math.sin(a1) * radii[i], 0)),
                 pts[i + 1] + frames[i + 1] @ V((math.cos(a1) * radii[i + 1], math.sin(a1) * radii[i + 1], 0)),
                 pts[i + 1] + frames[i + 1] @ V((math.cos(a0) * radii[i + 1], math.sin(a0) * radii[i + 1], 0))]
            base = len(verts)
            verts += q
            faces.append((base, base + 1, base + 2, base + 3))
            uvs.append([(u0, j / segs), (u0, (j + 1) / segs), (u1, (j + 1) / segs), (u1, j / segs)])
    if caps:
        for i, sgn in ((0, -1), (n - 1, 1)):
            ring = [pts[i] + frames[i] @ V((math.cos(2 * math.pi * j / segs) * radii[i], math.sin(2 * math.pi * j / segs) * radii[i], 0)) for j in range(segs)]
            base = len(verts)
            verts += ring
            faces.append(tuple(base + j for j in (range(segs) if sgn > 0 else reversed(range(segs)))))
            uvs.append([(0.5, 0.5)] * segs)
    sb.B.add("strip:" + strip, False, verts, faces, uvs)


def slathe(sb, strip, c, prof, segs=12, cap_bottom=True, swap=False):
    """A surface of revolution about +Z at c (profile [(r, z)] bottom to top), mapped onto a strip: u round, v up."""
    c = V(c)
    verts, faces, uvs = [], [], []
    m = len(prof)
    zs = [z for _, z in prof]
    for k_ in range(m - 1):
        for j in range(segs):
            a0, a1 = 2 * math.pi * j / segs, 2 * math.pi * (j + 1) / segs
            (r0, z0), (r1, z1) = prof[k_], prof[k_ + 1]
            q = [c + V((math.cos(a0) * r0, math.sin(a0) * r0, z0)), c + V((math.cos(a1) * r0, math.sin(a1) * r0, z0)),
                 c + V((math.cos(a1) * r1, math.sin(a1) * r1, z1)), c + V((math.cos(a0) * r1, math.sin(a0) * r1, z1))]
            base = len(verts)
            verts += q
            faces.append((base, base + 1, base + 2, base + 3))
            v0 = (z0 - zs[0]) / max(1e-6, zs[-1] - zs[0])
            v1 = (z1 - zs[0]) / max(1e-6, zs[-1] - zs[0])
            row = [(j / segs, v0), ((j + 1) / segs, v0), ((j + 1) / segs, v1), (j / segs, v1)]
            uvs.append([(b_, a_) for a_, b_ in row] if swap else row)   # swap: the grain runs up (a bucket's staves)
    if cap_bottom:
        r0, z0 = prof[0]
        base = len(verts)
        verts += [c + V((math.cos(2 * math.pi * j / segs) * r0, math.sin(2 * math.pi * j / segs) * r0, z0)) for j in range(segs)]
        faces.append(tuple(base + j for j in reversed(range(segs))))
        uvs.append([(0.5, 0.0)] * segs)
    sb.B.add("strip:" + strip, False, verts, faces, uvs)


def ring(sb, mat, c, r, w, segs=12, axis=UP):
    """A thin band (a hoop, a rim) round axis at c."""
    c = V(c)
    axis = V(axis).normalized()
    u = axis.cross(V((1, 0, 0)) if abs(axis.x) < 0.9 else V((0, 1, 0))).normalized()
    v = axis.cross(u)
    pts = [c + (u * math.cos(2 * math.pi * i / segs) + v * math.sin(2 * math.pi * i / segs)) * r for i in range(segs + 2)]
    sb.tube(mat, False, pts, [w] * len(pts), segs=3)


def basket(sb, k, c, r, h, rng, mat="wicker", heap=None, segs=10):
    """A deep round woven basket, rim at c.z, bottom h below: a bellied lathe (its inside is the back of the same wall:
    the props are drawn double-sided), a thick rim, an optional heap of goods on top."""
    c = V(c)
    prof = [(r * 0.72, -h), (r * 0.95, -h * 0.7), (r * 1.03, -h * 0.3), (r * 1.0, 0.0)]
    slathe(sb, "wicker", (c.x, c.y, c.z), prof, segs=max(segs, 14))
    ring(sb, "bamboo_dark", c, r * 1.03, 0.018, segs=segs)
    if heap:
        lump(sb, heap, c + V((0, 0, 0.04)), r * 0.85, r * 0.85, r * 0.45, rng, nu=7, nv=4)


def hang_ropes(sb, top, rim, r, n=3, mat="rope"):
    """n ropes from a point under the pole down to the rim of a hanging load (radius r)."""
    for i in range(n):
        a = 2 * math.pi * i / n + 0.4
        p = V(rim) + V((math.cos(a) * r, math.sin(a) * r, 0))
        sb.tube(mat, False, [V(top), p], [0.008, 0.008], segs=3)


def pole(sb, half, mat="bamboo", r=0.024, sag=0.045, nodes=5):
    """A bamboo carrying pole (扁担) along the forward axis, centred on the shoulder (origin): round, about 4.5 cm thick,
    tapering a little toward its tip end, both ends bowed down under the loads (the bend is greatest at the shoulder,
    as a loaded pole bends), node rings every internode. Returns the two end points (front, back)."""
    n = nodes * 3 + 1
    pts, radii = [], []
    for i in range(n):
        f = -1 + 2 * i / (n - 1)
        pts.append(V((0, f * half, r - sag * f * f)))
        radii.append(r * (1.0 - 0.18 * (f + 1) / 2))               # butt end (front) thicker than the tip end
    stube(sb, mat, pts, radii, segs=8, breaks=list(range(0, n, 3)))
    for i in range(3, n - 1, 3):                                     # the nodes: slight raised rings
        d = (pts[i + 1] - pts[i - 1]).normalized()
        ring(sb, "bamboo_dark", pts[i], radii[i] * 1.06, 0.005, segs=8, axis=d)
    return pts[0], pts[-1]


# ---------------------------------------------------------------- the props (Blender coords: -Y forward, +Z up)

def prop_pole_baskets(sb, k, rng):
    front, back = pole(sb, 0.85)
    for end, heap in ((front, "goods"), (back, None)):
        hook = end + V((0, 0, -0.02))
        rim = V((end.x, end.y, -0.68))
        hang_ropes(sb, hook, rim, 0.19)
        basket(sb, k, rim, 0.2, 0.34, rng, heap=heap)


def prop_pole_boxes(sb, k, rng):
    """Two tall square cages hung from the pole ends: corner posts, rails top and bottom, two slats a side, a dark lid,
    goods showing through."""
    front, back = pole(sb, 0.85)
    for end in (front, back):
        top = V((end.x, end.y, -0.42))
        hang_ropes(sb, end + V((0, 0, -0.02)), top, 0.12, n=2)
        w, h = 0.34, 0.48
        x0, x1, y0, y1, z0, z1 = top.x - w / 2, top.x + w / 2, top.y - w / 2, top.y + w / 2, top.z - h, top.z
        for x in (x0, x1):
            for y in (y0, y1):
                k.beam("timber", False, (x, y, z0), (x, y, z1), 0.03, 0.03, 0)
        for z in (z0 + 0.015, z1 - 0.015):
            for a_, b_ in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
                k.beam("timber", False, (a_[0], a_[1], z), (b_[0], b_[1], z), 0.025, 0.025, 0)
        for f in (0.5,):
            for y in (y0, y1):
                x = x0 + (x1 - x0) * f
                k.beam("bamboo", False, (x, y, z0), (x, y, z1), 0.014, 0.012, 0)
            for x in (x0, x1):
                y = y0 + (y1 - y0) * f
                k.beam("bamboo", False, (x, y, z0), (x, y, z1), 0.012, 0.014, 0)
        k.soft_box("box_black", False, (x0 - 0.01, y0 - 0.01, z1), (x1 + 0.01, y1 + 0.01, z1 + 0.035), rng, r=0.03, wob=0.004, ease=0, tilt=0)
        lump(sb, "goods", V((top.x, top.y, z0 + 0.14)), w * 0.42, w * 0.42, 0.14, rng, nu=6, nv=3)


def prop_pole_bundle(sb, k, rng):
    front, back = pole(sb, 0.8, sag=0.0)
    # one big cloth bundle hanging behind (the back end), knotted at its top; nothing on the front end
    knot = V((0, back.y - 0.02, -0.12))
    sb.tube("rope", False, [back + V((0, 0, -0.02)), knot], [0.01, 0.01], segs=3)
    lump(sb, "cloth_white", V((0, back.y - 0.05, -0.38)), 0.24, 0.22, 0.27, rng, k=0.16)
    lump(sb, "cloth_white", knot + V((0, 0, -0.03)), 0.07, 0.06, 0.06, rng)
    ring(sb, "rope", V((0, back.y - 0.05, -0.3)), 0.25, 0.012)


def prop_back_frame(sb, k, rng):
    """The itinerant monk's 笈: a tall frame on the back, two bamboo posts with rungs, piled with a box and bundles,
    a small curved canopy reaching forward over the head with a lantern box, gourds and tassels hanging from it."""
    b = 0.05                      # the frame's front face, just behind the back
    d = 0.3                       # the frame's depth
    zb, zt = -0.62, 0.78          # bottom and top of the posts (the origin is the upper back)
    for x in (-0.2, 0.2):
        for y in (b, b + d):
            stube(sb, "bamboo", [V((x, y, zb + (zt - zb) * f / 6)) for f in range(7)], [0.019 - 0.002 * f / 6 for f in range(7)], segs=8, breaks=[0, 2, 4, 6])
    for z in (zb + 0.05, 0.25, zt - 0.04):
        for y in (b, b + d):
            k.beam("bamboo_dark", False, (-0.22, y, z), (0.22, y, z), 0.025, 0.025, 0)
        for x in (-0.2, 0.2):
            k.beam("bamboo_dark", False, (x, b, z), (x, b + d, z), 0.022, 0.022, 0)
    # the load: a red box low, bundles and a roll above
    k.soft_box("box_red", False, (-0.19, b + 0.02, zb + 0.08), (0.19, b + d - 0.02, -0.22), rng, r=0.03, wob=0.006, ease=0, tilt=0.01)
    lump(sb, "cloth_indigo", V((0, b + d / 2, 0.0)), 0.2, 0.16, 0.2, rng, nu=7, nv=4)
    soft_roll(sb, "cloth_ochre", (-0.25, b + d / 2, 0.38), (0.25, b + d / 2, 0.38), 0.1, segs=6, rng=rng)
    lump(sb, "cloth_grey", V((0.02, b + d / 2, 0.6)), 0.16, 0.14, 0.13, rng, nu=6, nv=4)
    # straps over the shoulders to the front
    for x in (-0.12, 0.12):
        sb.tube("rope", False, [V((x, b, 0.12)), V((x, -0.04, 0.16)), V((x * 1.4, -0.16, 0.06)), V((x * 1.5, -0.2, -0.12))], [0.012] * 4, segs=3)
    # the canopy: a curved mat on two bent bamboo arms, reaching forward over the head
    for x in (-0.18, 0.18):
        pts = [V((x, b + d * 0.5, zt - 0.02)), V((x, b, zt + 0.12)), V((x, -0.12, zt + 0.15)), V((x, -0.24, zt + 0.1))]
        sb.tube("bamboo_dark", False, pts, [0.012] * 4, segs=3)
    vs, fs = [], []
    nx, ny = 3, 4
    Y0, Y1 = 0.36, -0.28          # the canopy's back and front edges: over the frame and just over the head
    cz = lambda y, x: zt + 0.2 - 1.1 * (y - (Y0 + Y1) / 2) ** 2 - 0.2 * x * x   # noqa: E731
    for j in range(ny + 1):
        y = Y0 + (Y1 - Y0) * j / ny
        for i in range(nx + 1):
            x = -0.27 + 0.54 * i / nx
            vs.append(V((x, y, cz(y, x))))
    for j in range(ny):
        for i in range(nx):
            a_ = j * (nx + 1) + i
            fs.append((a_, a_ + 1, a_ + nx + 2, a_ + nx + 1))
    sb.B.add("straw", False, vs, fs)
    # hanging from the canopy's front edge: a lantern box in the middle, gourds and red tassels at the corners
    fy = Y1 + 0.02
    fz = cz(fy, 0)
    # the lantern box hangs at the canopy's front, a little to the left of the face; gourds at both front corners
    sb.tube("rope", False, [V((0.16, fy, fz)), V((0.16, fy, fz - 0.08))], [0.006, 0.006], segs=3)
    k.soft_box("lantern", False, (0.1, fy - 0.06, fz - 0.24), (0.22, fy + 0.06, fz - 0.08), rng, r=0.02, wob=0.004, ease=0, tilt=0)
    for x in (-0.25, 0.25):
        gx = x if x < 0 else 0.26
        sb.tube("rope", False, [V((gx, fy, cz(fy, gx) - 0.02)), V((gx, fy, cz(fy, gx) - 0.08))], [0.005, 0.005], segs=3)
        sb.lathe("gourd", False, (gx, fy, cz(fy, gx) - 0.26), [(0.01, 0), (0.055, 0.04), (0.06, 0.08), (0.03, 0.12), (0.042, 0.15), (0.012, 0.18)], segs=6)
    sb.cyl("tassel", False, (-0.12, fy, fz - 0.01), (-0.12, fy, fz - 0.16), 0.012, 0.025, segs=4)


def prop_back_boxes(sb, k, rng):
    """A stack of lidded food boxes on the back on a strap frame: three tiers, each its own lacquered box with a lid."""
    b = 0.06
    w, d = 0.36, 0.3
    z = -0.5
    for tier, (h, col) in enumerate(((0.22, "box_black"), (0.18, "box_red"), (0.18, "box_black"))):
        k.soft_box(col, False, (-w / 2, b, z), (w / 2, b + d, z + h - 0.02), rng, r=0.025, wob=0.004, ease=0.01, tilt=0.004)
        k.soft_box("wood_dark", False, (-w / 2 - 0.01, b - 0.01, z + h - 0.03), (w / 2 + 0.01, b + d + 0.01, z + h), rng, r=0.02, wob=0.003, ease=0.006, tilt=0)
        z += h
    # two rails up the sides, a carrying bar on top, straps over the shoulders
    for x in (-w / 2 - 0.02, w / 2 + 0.02):
        k.beam("timber", False, (x, b + d / 2, -0.52), (x, b + d / 2, z + 0.08), 0.03, 0.03, 0.005)
    k.beam("timber", False, (-w / 2 - 0.04, b + d / 2, z + 0.08), (w / 2 + 0.04, b + d / 2, z + 0.08), 0.03, 0.03, 0.005)
    for x in (-0.11, 0.11):
        sb.tube("rope", False, [V((x, b, 0.08)), V((x, -0.04, 0.14)), V((x * 1.4, -0.16, 0.05)), V((x * 1.5, -0.2, -0.12))], [0.012] * 4, segs=3)


def prop_back_bundle(sb, k, rng):
    """A cloth bundle on the back, its corners knotted over the shoulder."""
    lump(sb, "cloth_indigo", V((0, 0.17, -0.12)), 0.2, 0.14, 0.24, rng, k=0.15)
    lump(sb, "cloth_indigo", V((0.08, 0.04, 0.12)), 0.05, 0.05, 0.05, rng)
    sb.tube("cloth_indigo", False, [V((0.08, 0.06, 0.1)), V((0.1, -0.08, 0.12)), V((-0.06, -0.18, -0.1))], [0.025, 0.02, 0.018], segs=4)


def prop_fan_round(sb, k, rng):
    """A round fan (团扇): a short handle up from the grip, a stiff round blade with a rim, held flat to the face."""
    sb.cyl("bamboo_dark", False, (0, 0, -0.04), (0, 0, 0.12), 0.008, segs=5)
    c = V((0, 0, 0.24))
    r = 0.12
    n = 16
    ring_pts = [c + V((math.sin(2 * math.pi * i / n) * r, 0, math.cos(2 * math.pi * i / n) * r)) for i in range(n)]
    for side, mat in ((0.003, "fan"), (-0.003, "fan")):
        vs = [c + V((0, side, 0))] + [p + V((0, side, 0)) for p in ring_pts]
        fs = [(0, 1 + (i + 1) % n, 1 + i) if side > 0 else (0, 1 + i, 1 + (i + 1) % n) for i in range(n)]
        sb.B.add(mat, False, vs, fs)
    sb.tube("fan_rim", False, ring_pts + ring_pts[:2], [0.006] * (n + 2), segs=3)


def prop_bucket(sb, k, rng):
    """A round wooden bucket with two dark hoops and a knotted rope handle; origin at the middle of its bottom."""
    r, h = 0.15, 0.3
    slathe(sb, "wood", (0, 0, 0), [(r * 0.85, 0), (r * 0.95, h * 0.5), (r, h)], segs=14, swap=True)
    inner = [(r * 0.94, h), (r * 0.88, h * 0.5), (r * 0.8, 0.02)]
    verts, faces = [], []
    for rr, z in inner:
        for i in range(12):
            a = 2 * math.pi * i / 12
            verts.append((math.cos(a) * rr, math.sin(a) * rr, z))
    for j in range(2):
        for i in range(12):
            i2 = (i + 1) % 12
            faces.append((j * 12 + i, j * 12 + i2, (j + 1) * 12 + i2, (j + 1) * 12 + i))
    sb.B.add("timber", False, verts, faces)
    for t in (0.15, 0.82):
        ring(sb, "wood_dark", V((0, 0, h * t)), r * (0.87 + 0.13 * t) + 0.006, 0.01)
    arc = [V((math.cos(a) * r * 0.95, 0, h + 0.02 + math.sin(a) * 0.14)) for a in np.linspace(0, math.pi, 9)]
    sb.tube("rope", False, arc, [0.009] * len(arc), segs=3)


def prop_cleaver(sb, k, rng):
    """A butcher's cleaver: a round wooden grip along +Z from the hand, a broad iron blade forward of it, edge down."""
    sb.cyl("wood_dark", False, (0, 0, -0.05), (0, 0, 0.07), 0.016, 0.014, segs=6)
    # the blade: a slab from just above the grip up 0.2, reaching forward (-Y) 0.1
    k.beam("iron", False, (0, -0.01, 0.07), (0, -0.01, 0.27), 0.012, 0.12, 0.002)


def prop_bow(sb, k, rng):
    """A recurved horn bow standing along +Z from the grip, about 1.4 m, its belly toward the front, the string
    behind."""
    pts = []
    n = 13
    for i in range(n):
        f = -1 + 2 * i / (n - 1)
        z = f * 0.7
        y = -0.12 * (1 - f * f) + (0.05 * abs(f) ** 6) + 0.12   # the grip (the bow's middle) at the origin, the
        # limbs sweep back toward the archer and the tips curl forward again (a recurve)
        pts.append(V((0, y, z)))
    radii = [0.018 if abs(i - n // 2) < 2 else 0.013 for i in range(n)]
    stube(sb, "wood_dark", pts, radii, segs=7)
    sb.cyl("cloth_dark", False, (0, 0, -0.06), (0, 0, 0.06), 0.022, segs=8)
    sb.tube("rope", False, [pts[0], pts[-1]], [0.003, 0.003], segs=3)



def prop_pole_shallow_baskets(sb, k, rng):
    """A shoulder pole with two shallow round baskets (trays) hung on four cords each, goods heaped low in them."""
    front, back = pole(sb, 0.8)
    for end, heap in ((front, "goods"), (back, "greens")):
        rim = V((end.x, end.y, -0.55))
        hang_ropes(sb, end + V((0, 0, -0.02)), rim, 0.22, n=4)
        basket(sb, k, rim, 0.24, 0.1, rng, heap=None, segs=12)
        lump(sb, heap, rim + V((0, 0, -0.02)), 0.2, 0.2, 0.07, rng, nu=7, nv=3)


def mat_roll(sb, k, c, r, h, rng):
    """A tall bundle of rolled straw mats standing upright: a bundle of 5 rolls bound with three cords."""
    for i in range(5):
        a = 2 * math.pi * i / 5 + rng.uniform(-0.2, 0.2)
        cx, cy = c.x + math.cos(a) * r * 0.45, c.y + math.sin(a) * r * 0.45
        dz = rng.uniform(-0.04, 0.04)
        slathe(sb, "straw", (cx, cy, c.z - h + dz), [(r * 0.46, 0), (r * 0.5, 0.06), (r * 0.5, h - 0.06), (r * 0.44, h)], segs=6)
    for f in (0.15, 0.5, 0.85):
        ring(sb, "rope", c + V((0, 0, -h * f)), r * 0.98, 0.012, segs=8)


def prop_pole_bundles(sb, k, rng):
    """A shoulder pole with two tall, densely bound bundles of rolled straw mats hanging close under its ends."""
    front, back = pole(sb, 0.75)
    for end in (front, back):
        top = V((end.x, end.y, -0.1))
        sb.tube("rope", False, [end + V((0, 0, -0.02)), top], [0.01, 0.01], segs=3)
        mat_roll(sb, k, top, 0.17, 0.75, rng)


def long_rod(sb, mat, length, r0, r1, below=0.0, bend=0.0, segs=8, n=9):
    """A rod held in the fist: from `below` under the grip up along +Z to `length`, slightly bowed toward -Y, tapering
    from r0 to r1, round, its surface on a painted strip (`mat` names a strip: wood, wood_dark, bamboo, bamboo_dark)."""
    pts = []
    for i in range(n):
        f = i / (n - 1)
        z = -below + (length + below) * f
        pts.append(V((0, -bend * math.sin(math.pi * f), z)))
    strip = mat if mat in STRIPS else ("wood_dark" if mat in ("wood_dark", "bamboo_dark") else "wood")
    breaks = list(range(0, n, 2)) if strip.startswith("bamboo") else None
    stube(sb, strip, pts, [r0 + (r1 - r0) * i / (n - 1) for i in range(n)], segs=segs, breaks=breaks)
    return pts


def prop_goad(sb, k, rng):
    """An ox goad: a long, thin, slightly bent stick (about 2 m), a small iron point at its tip."""
    pts = long_rod(sb, "bamboo_dark", 1.7, 0.016, 0.009, below=0.3, bend=0.05)
    sb.cyl("iron", False, pts[-1], pts[-1] + (pts[-1] - pts[-2]).normalized() * 0.06, 0.007, 0.001, segs=4)


def prop_stick(sb, k, rng):
    """A long stick held in one hand, about 1.5 m, gripped a third of the way from its back end (canonical +Y
    forward of the fist, the short end behind)."""
    long_rod(sb, "wood", 1.0, 0.016, 0.012, below=0.5, bend=0.015)


def prop_staff(sb, k, rng):
    """A tall staff held upright, about 1.9 m, its foot on the ground when held at the side, a knob at the top."""
    pts = long_rod(sb, "wood", 0.95, 0.021, 0.017, below=0.95, bend=0.012)
    sb.lathe("wood_dark", False, tuple(pts[-1]), [(0.018, 0), (0.03, 0.03), (0.028, 0.06), (0.01, 0.08)], segs=6)


def prop_whip(sb, k, rng):
    """A carter's whip: a short handle in the fist, a long flexible stock bending over, a lash with a red tassel."""
    stock = long_rod(sb, "bamboo_dark", 1.2, 0.014, 0.006, below=0.12, bend=0.18)
    tip = stock[-1]
    lash = [tip + V((0, 0.08 * i, -0.18 * i - 0.03 * i * i)) for i in range(5)]
    sb.tube("rope", False, [tip] + lash[1:], [0.005] * 5, segs=3)
    sb.cyl("tassel", False, lash[-1], lash[-1] + V((0, 0.02, -0.12)), 0.006, 0.02, segs=4)


def prop_child_in_arms(sb, k, rng):
    """A small child (about 2 years) held at the left shoulder, clinging: origin at the carrier's left shoulder top.
    The child sits on her left forearm in front of her chest, body against her, head resting on her shoulder, arms
    round her neck. Built of soft pieces (no boxes): a jacket body, a round head with hair, little arms and legs."""
    # positions relative to the shoulder (Blender: +X her left, -Y her front, +Z up)
    hip = V((0.06, -0.17, -0.36))
    chest = V((0.03, -0.15, -0.16))
    head = V((-0.02, -0.12, 0.03))
    lump(sb, "jacket_child", (hip + chest) / 2, 0.1, 0.085, 0.13, rng, nu=7, nv=4, k=0.06)
    lump(sb, "skin", head, 0.075, 0.075, 0.08, rng, nu=8, nv=5, k=0.03)
    lump(sb, "hair", head + V((0.01, 0.015, 0.03)), 0.072, 0.065, 0.055, rng, nu=7, nv=3, k=0.04)
    # arms round her neck: from the child's shoulders up and round behind her neck
    for side in (1, -1):
        sh = chest + V((side * 0.07, 0.02, 0.05))
        pts = [sh, sh + V((side * 0.02, 0.06, 0.08)), V((-0.06 * side - 0.04, 0.03, 0.06)), V((-0.08, 0.06 + 0.02 * side, 0.04))]
        sb.tube("jacket_child", False, pts, [0.03, 0.028, 0.026, 0.025], segs=5)
        sb.B.add("skin", False, *_ball(pts[-1], 0.025))
    # legs folded round her side: thighs forward from the hip, shins hanging
    for side in (1, -1):
        h0 = hip + V((side * 0.05, -0.02, -0.03))
        knee = h0 + V((side * 0.04, -0.12, 0.0))
        foot = knee + V((0, -0.01, -0.13))
        sb.tube("trousers_child", False, [h0, knee, foot], [0.04, 0.034, 0.03], segs=5)
        sb.B.add("hair", False, *_ball(foot + V((0, -0.02, -0.02)), 0.03))


# ---------------------------------------------------------------- carried children, trays, a shoulder box, a lead rope (batch 3)

def child_figure(sb, J, rng, s=1.0):
    """A small child (about 3-4 years, ~1 m) from joint points J (Blender coords, metres): pelvis, chest, neck, head,
    sh_l/sh_r, el_l/el_r, ha_l/ha_r (hands), hi_l/hi_r (hips), kn_l/kn_r, ft_l/ft_r. Soft pieces only: a belly and a
    chest of the jacket, a collar, a round head with a hair cap and two little top-knots, sleeves and trousers as
    tapered tubes, hands and shoes as balls."""
    g = lambda n: V(J[n])  # noqa: E731
    up = (g("neck") - g("pelvis")).normalized()
    lump(sb, "jacket_child", g("pelvis").lerp(g("chest"), 0.35), 0.105 * s, 0.085 * s, 0.11 * s, rng, nu=8, nv=5, k=0.05)
    lump(sb, "jacket_child", g("pelvis").lerp(g("chest"), 0.8), 0.1 * s, 0.08 * s, 0.1 * s, rng, nu=8, nv=5, k=0.05)
    ring(sb, "cloth_white", g("neck") - up * 0.01, 0.045 * s, 0.012, segs=8, axis=up)
    head = g("head")
    sb.B.add("skin", False, *_ball(head, 0.088 * s, n=6))
    lump(sb, "hair", head + up * 0.03 * s - (head - g("neck")).cross(V((1, 0, 0))).normalized() * 0.0, 0.086 * s, 0.084 * s, 0.06 * s, rng, nu=8, nv=4, k=0.03)
    for side in (1, -1):
        sb.B.add("hair", False, *_ball(head + up * 0.075 * s + V((side * 0.045 * s, 0, 0)), 0.024 * s, n=4))
    for sd in ("l", "r"):
        sb.tube("jacket_child", False, [g("sh_" + sd), g("el_" + sd), g("ha_" + sd)], [0.032 * s, 0.028 * s, 0.024 * s], segs=6)
        sb.B.add("skin", False, *_ball(g("ha_" + sd), 0.024 * s, n=4))
        sb.tube("trousers_child", False, [g("hi_" + sd), g("kn_" + sd), g("ft_" + sd)], [0.042 * s, 0.035 * s, 0.03 * s], segs=6)
        sb.B.add("hair", False, *_ball(g("ft_" + sd), 0.032 * s, n=4))     # dark cloth shoes


def prop_child_on_shoulders(sb, k, rng):
    """A child sitting astride a man's neck: origin at the carrier's neck joint (the shoulder line), Blender +X the
    carrier's left, -Y his front, +Z up. The child's seat is behind his head on the shoulders, the thighs go forward
    over his shoulders on either side of his neck, the shins hang down his chest to where his hands hold the ankles;
    the child's hands rest on his head."""
    J = {"pelvis": (0, 0.15, 0.02), "chest": (0, 0.15, 0.26), "neck": (0, 0.14, 0.36), "head": (0, 0.12, 0.445),
         "sh_l": (0.1, 0.15, 0.32), "sh_r": (-0.1, 0.15, 0.32), "el_l": (0.14, 0.07, 0.22), "el_r": (-0.14, 0.07, 0.22),
         "ha_l": (0.095, -0.0, 0.14), "ha_r": (-0.095, -0.0, 0.14),
         "hi_l": (0.075, 0.13, 0.0), "hi_r": (-0.075, 0.13, 0.0), "kn_l": (0.13, -0.08, 0.0), "kn_r": (-0.13, -0.08, 0.0),
         "ft_l": (0.12, -0.13, -0.17), "ft_r": (-0.12, -0.13, -0.17)}
    child_figure(sb, J, rng)


def prop_child_on_back(sb, k, rng):
    """A child riding piggy-back: origin at the carrier's upper back (his Spine joint), axes along his back (Blender +Z
    up his spine, -Y out of his chest, +X his left). The child lies against his back, head beside his head, arms round
    his neck, legs round his waist where his hands (behind his hips) hold the thighs."""
    J = {"pelvis": (0, 0.2, -0.25), "chest": (0, 0.18, 0.0), "neck": (0, 0.16, 0.1), "head": (0.1, 0.1, 0.19),
         "sh_l": (0.1, 0.16, 0.06), "sh_r": (-0.1, 0.16, 0.06), "el_l": (0.15, 0.04, 0.08), "el_r": (-0.15, 0.04, 0.08),
         "ha_l": (0.05, -0.08, 0.05), "ha_r": (-0.05, -0.08, 0.05),
         "hi_l": (0.08, 0.18, -0.28), "hi_r": (-0.08, 0.18, -0.28), "kn_l": (0.2, -0.12, -0.3), "kn_r": (-0.2, -0.12, -0.3),
         "ft_l": (0.18, -0.2, -0.46), "ft_r": (-0.18, -0.2, -0.46)}
    child_figure(sb, J, rng)


def _tray_goods(sb, k, c, rx, ry, rng, n=7):
    """Small round goods (buns, cakes, fruit) heaped on a tray around c."""
    for i in range(n):
        p = V((c.x + rng.uniform(-rx, rx), c.y + rng.uniform(-ry, ry), c.z + 0.03))
        mat = rng.choice(("paper", "goods", "gourd"))
        lump(sb, mat, p, 0.04, 0.04, 0.028, rng, nu=6, nv=3, k=0.08)


def prop_tray(sb, k, rng):
    """A long flat tray of goods held across the waist (the tray vendor): a wooden tray about 0.9 x 0.34 m with a low
    rim, round goods on it and a small lattice box at its left end. Origin: the middle of its underside, where the
    hands hold it; the long side runs across the body (Blender X)."""
    L, W, h = 0.9, 0.34, 0.05
    k.soft_box("timber", False, (-L / 2, -W / 2, 0), (L / 2, W / 2, 0.022), rng, r=0.03, wob=0.002, ease=0.006, tilt=0)
    for y in (-W / 2, W / 2):
        stube(sb, "wood", [V((-L / 2, y, 0.03)), V((L / 2, y, 0.03))], [0.012, 0.012], segs=6)
    for x in (-L / 2, L / 2):
        stube(sb, "wood", [V((x, -W / 2, 0.03)), V((x, W / 2, 0.03))], [0.012, 0.012], segs=6)
    _tray_goods(sb, k, V((-0.08, 0, 0.02)), 0.24, 0.1, rng, n=8)
    # the lattice box at the left end
    x0, x1, y0, y1, z0, z1 = L / 2 - 0.2, L / 2 - 0.03, -0.12, 0.12, 0.022, 0.15
    for x in (x0, x1):
        for y in (y0, y1):
            k.beam("wood_dark", False, (x, y, z0), (x, y, z1), 0.016, 0.016, 0.003)
    for z in (z0 + 0.01, z1):
        for a_, b_ in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
            k.beam("wood_dark", False, (a_[0], a_[1], z), (b_[0], b_[1], z), 0.012, 0.012, 0)
    for f in (0.33, 0.66):
        for y in (y0, y1):
            x = x0 + (x1 - x0) * f
            k.beam("bamboo", False, (x, y, z0), (x, y, z1), 0.008, 0.008, 0)
    lump(sb, "greens", V(((x0 + x1) / 2, 0, z0 + 0.05)), 0.06, 0.08, 0.04, rng, nu=6, nv=3)


def prop_tray_head(sb, k, rng):
    """A round flat tray of goods balanced on the head, on a ring pad: origin at the crown of the head."""
    slathe(sb, "wicker", (0, 0, 0.025), [(0.24, 0.0), (0.28, 0.04), (0.29, 0.05)], segs=16)
    sb.B.add("wicker", False, [V((0, 0, 0.026))] + [V((math.cos(2 * math.pi * i / 16) * 0.24, math.sin(2 * math.pi * i / 16) * 0.24, 0.026)) for i in range(16)],
             [(0, 1 + i, 1 + (i + 1) % 16) for i in range(16)])
    ring(sb, "cloth_white", V((0, 0, 0.012)), 0.06, 0.016, segs=10)          # the pad
    _tray_goods(sb, k, V((0, 0, 0.03)), 0.15, 0.15, rng, n=9)


def prop_box_shoulder(sb, k, rng):
    """A long flat box carried on the shoulder, about 1.0 x 0.3 x 0.15 m, lying along the facing: a lacquered body with
    a lid seam, two cord bands. Origin: the middle of its underside (it rests on the shoulder there)."""
    L, W, H = 1.0, 0.15, 0.3         # carried on edge, so the head clears it (1.0 x 0.3 x 0.15 m)
    k.soft_box("box_black", False, (-W / 2, -L / 2, 0), (W / 2, L / 2, H * 0.7), rng, r=0.025, wob=0.002, ease=0.008, tilt=0)
    k.soft_box("wood_dark", False, (-W / 2 - 0.006, -L / 2 - 0.006, H * 0.7), (W / 2 + 0.006, L / 2 + 0.006, H), rng, r=0.025, wob=0.002, ease=0.01, tilt=0)
    for y in (-L * 0.3, L * 0.3):
        pts = [V((W / 2 + 0.008, y, -0.005)), V((W / 2 + 0.008, y, H + 0.008)), V((-W / 2 - 0.008, y, H + 0.008)), V((-W / 2 - 0.008, y, -0.005))]
        sb.tube("rope", False, pts, [0.008] * 4, segs=3)


def prop_lead_rope(sb, k, rng):
    """A slack lead rope from the fist trailing back and down about 1.5 m (an ox's nose rope held low behind the
    leader): origin at the fist, Blender +Y behind him."""
    end = V((0.02, 1.35, -0.55))
    pts = []
    for i in range(10):
        f = i / 9
        p = V((0, 0, 0)).lerp(end, f) + V((0, 0, -0.18 * math.sin(math.pi * f)))
        pts.append(p)
    sb.tube("rope", False, pts, [0.009] * len(pts), segs=4)
    sb.B.add("rope", False, *_ball(end, 0.018, n=3))



def _ball(c, r, n=5):
    vs, fs = [], []
    for j in range(n + 1):
        t = math.pi * j / n
        for i in range(n * 2):
            a = math.pi * i / n
            vs.append(V((c[0] + math.sin(t) * math.cos(a) * r, c[1] + math.sin(t) * math.sin(a) * r, c[2] + math.cos(t) * r)))
    m = n * 2
    for j in range(n):
        for i in range(m):
            a0, a1 = j * m + i, j * m + (i + 1) % m
            fs.append((a0, a1, a1 + m, a0 + m))
    return vs, fs

PROPS = {
    "pole_baskets": prop_pole_baskets, "pole_boxes": prop_pole_boxes, "pole_bundle": prop_pole_bundle,
    "back_frame": prop_back_frame, "back_boxes": prop_back_boxes, "back_bundle": prop_back_bundle,
    "fan_round": prop_fan_round, "bucket": prop_bucket, "cleaver": prop_cleaver, "bow": prop_bow,
    "pole_shallow_baskets": prop_pole_shallow_baskets, "pole_bundles": prop_pole_bundles,
    "goad": prop_goad, "stick": prop_stick, "staff": prop_staff, "whip": prop_whip, "tray": prop_tray,
    "tray_head": prop_tray_head, "box_shoulder": prop_box_shoulder, "lead_rope": prop_lead_rope,
}


# ---------------------------------------------------------------- round 2 (2026-10-12): the five areas' carried things

def boat_pole(sb, below, above, r0=0.03, r1=0.02, n=13):
    """A bamboo boat pole (篙) along +Z through the fist: its foot `below` metres under the grip, its top `above` over
    it, the butt (foot) thicker, an internode per segment (the strip's dark node bands), an iron shoe on the foot."""
    pts, radii = [], []
    for i in range(n):
        f = i / (n - 1)
        pts.append(V((0, -0.025 * math.sin(math.pi * f), -below + (below + above) * f)))
        radii.append(r0 + (r1 - r0) * f)
    stube(sb, "bamboo", pts, radii, segs=6, breaks=list(range(0, n)))
    sb.cyl("iron", False, pts[0] + V((0, 0, 0.12)), pts[0] - V((0, 0, 0.05)), radii[0] * 1.08, 0.008, segs=6)


def prop_long_pole(sb, k, rng):
    """A 4.6 m boat pole held upright, its foot on the deck 1.05 m under the fist (standing with the pole)."""
    boat_pole(sb, 1.05, 3.55)


def prop_long_pole_low(sb, k, rng):
    """The boat pole gripped near its top, 3.7 m running down from the fist into the water (poling)."""
    boat_pole(sb, 3.7, 0.9, r0=0.028, r1=0.022)


def prop_long_pole_mid(sb, k, rng):
    """The boat pole gripped at its middle, 2.3 m either side (fending off, raising it overhead)."""
    boat_pole(sb, 2.3, 2.3, r0=0.028, r1=0.022)


def sack_neck(sb, c, rng, mat="sack", tilt=V((0, 0, 1))):
    """A sack's tied neck: a gathered lump, a rope wound round it and two cloth ears above."""
    c = V(c)
    lump(sb, mat, c, 0.055, 0.05, 0.06, rng, nu=7, nv=4, k=0.2)
    ring(sb, "rope", c - tilt * 0.01, 0.05, 0.012, segs=8, axis=tilt)
    for s in (1, -1):
        lump(sb, mat, c + tilt * 0.07 + V((s * 0.035, 0, 0)), 0.03, 0.022, 0.045, rng, nu=6, nv=3, k=0.2)


def _back_sack(sb, rng, mat):
    """A big grain sack slung across the upper back, bellied and slumped, its tied neck up over the right shoulder
    where a hand can hold it. Origin: the middle of the upper back (the load sits behind it)."""
    lump(sb, mat, V((0, 0.21, -0.02)), 0.29, 0.19, 0.31, rng, nu=10, nv=6, k=0.1)
    lump(sb, mat, V((0.04, 0.2, -0.24)), 0.25, 0.17, 0.15, rng, nu=9, nv=4, k=0.12)       # the slumped bottom
    sb.tube(mat, False, [V((-0.06, 0.16, 0.24)), V((-0.11, 0.1, 0.3))], [0.09, 0.06], segs=7)
    sack_neck(sb, V((-0.13, 0.07, 0.33)), rng, mat, tilt=V((-0.3, -0.3, 0.9)).normalized())


def prop_back_sack(sb, k, rng):
    _back_sack(sb, rng, "sack")


def prop_back_sack_dark(sb, k, rng):
    _back_sack(sb, rng, "cloth_dark")


def prop_sack_shoulder(sb, k, rng):
    """A full sack lying over one shoulder, half in front and half behind, along the facing. Origin: the top of the
    shoulder."""
    lump(sb, "cloth_white", V((0, 0.08, 0.1)), 0.17, 0.4, 0.15, rng, nu=9, nv=6, k=0.08)
    lump(sb, "cloth_white", V((0.02, 0.36, -0.02)), 0.15, 0.13, 0.16, rng, nu=8, nv=4, k=0.1)
    sack_neck(sb, V((0, -0.33, 0.06)), rng, "cloth_white", tilt=V((0, -1, 0.2)).normalized())


def prop_hip_bag(sb, k, rng):
    """A dark cloth bag on a cord: origin at the top of its cord (at the belt, or in the fist), the bag hanging below,
    gathered and knotted at its mouth."""
    sb.tube("rope", False, [V((0.02, 0, 0)), V((0, 0.005, -0.06)), V((0, 0, -0.1))], [0.007] * 3, segs=3)
    lump(sb, "cloth_dark", V((0, 0, -0.105)), 0.03, 0.028, 0.025, rng, nu=6, nv=3, k=0.2)
    lump(sb, "cloth_dark", V((0, 0, -0.2)), 0.085, 0.05, 0.1, rng, nu=8, nv=5, k=0.12)


def _dish(sb, prof, mat="ceramic", z0=0.03):
    sb.lathe(mat, False, (0, 0, z0), prof, segs=12)


def prop_hand_dish_buns(sb, k, rng):
    """A plate of three steamed buns on the open hand. Origin: the fist (the plate sits just above it)."""
    _dish(sb, [(0.06, 0.0), (0.1, 0.012), (0.12, 0.024)])
    for a in (0.3, 2.4, 4.4):
        lump(sb, "paper", V((math.cos(a) * 0.045, math.sin(a) * 0.045, 0.085)), 0.042, 0.042, 0.035, rng, nu=7, nv=4, k=0.05)


def prop_hand_dish_bowl(sb, k, rng):
    """A small bowl held out on the hand, with something in it."""
    _dish(sb, [(0.032, 0.0), (0.055, 0.02), (0.072, 0.055), (0.075, 0.062)])
    sb.B.add("goods", False, [V((0, 0, 0.078))] + [V((math.cos(2 * math.pi * i / 10) * 0.064, math.sin(2 * math.pi * i / 10) * 0.064, 0.074)) for i in range(10)],
             [(0, 1 + i, 1 + (i + 1) % 10) for i in range(10)])


def prop_hand_dish_cup(sb, k, rng):
    """A small cup held up in the fingers."""
    _dish(sb, [(0.02, 0.0), (0.03, 0.03), (0.036, 0.06)], z0=0.02)


def prop_bundle_small(sb, k, rng):
    """A small cloth bundle held at the chest in both hands, its corners knotted on top. Origin: between the fists."""
    lump(sb, "cloth_indigo", V((0, -0.06, -0.01)), 0.15, 0.1, 0.11, rng, nu=8, nv=5, k=0.12)
    lump(sb, "cloth_indigo", V((0, -0.06, 0.1)), 0.04, 0.035, 0.035, rng, nu=6, nv=3, k=0.2)
    for s in (1, -1):
        lump(sb, "cloth_indigo", V((s * 0.04, -0.06, 0.14)), 0.025, 0.018, 0.04, rng, nu=5, nv=3, k=0.2)


def prop_bundle_hang(sb, k, rng):
    """The same small bundle carried low in one hand by its knot: origin at the knot in the fist."""
    lump(sb, "cloth_indigo", V((0, 0, -0.01)), 0.035, 0.03, 0.03, rng, nu=6, nv=3, k=0.2)
    lump(sb, "cloth_indigo", V((0, 0, -0.14)), 0.15, 0.1, 0.11, rng, nu=8, nv=5, k=0.12)


def prop_back_tall_bundle(sb, k, rng):
    """A tall bundle of reeds lashed upright to a carrying frame on the back, rising well above the head: two side
    poles and cross bars, the bundle bound four times, a ragged top, shoulder ropes. Origin: the upper back."""
    y = 0.13
    for s in (1, -1):
        stube(sb, "wood", [V((s * 0.17, y - 0.04, -0.55)), V((s * 0.17, y - 0.02, 0.3)), V((s * 0.15, y, 1.05))], [0.018, 0.016, 0.014], segs=6)
        sb.tube("rope", False, [V((s * 0.12, 0.08, 0.14)), V((s * 0.14, -0.06, 0.22)), V((s * 0.16, -0.12, 0.0)), V((s * 0.15, -0.02, -0.28)), V((s * 0.16, y - 0.06, -0.4))], [0.012] * 5, segs=3)
    for z in (-0.45, 0.25):
        k.beam("timber", False, (0.19, y - 0.03, z), (-0.19, y - 0.03, z), 0.03, 0.03, 0.005)
    slathe(sb, "straw", (0, y + 0.08, -0.4), [(0.12, 0.0), (0.15, 0.1), (0.15, 1.1), (0.13, 1.35), (0.06, 1.45)], segs=10)
    for z in (-0.25, 0.15, 0.5, 0.85):
        ring(sb, "rope", V((0, y + 0.08, z)), 0.155, 0.012, segs=10)
    for i in range(7):
        a = 2 * math.pi * i / 7
        b = V((math.cos(a) * 0.06, y + 0.08 + math.sin(a) * 0.06, 1.02))
        sb.cyl("straw", False, b, b + V((math.cos(a) * 0.08, math.sin(a) * 0.08, 0.22 + 0.06 * rng.random())), 0.012, 0.004, segs=4)


def prop_t_stick(sb, k, rng):
    """A porter's rest stick (打杵): a stout staff about 0.95 m with a short crossbar on top, held by the crossbar.
    Origin: the fist on the crossbar; the staff runs down from it."""
    stube(sb, "wood", [V((0, 0, 0.02)), V((0, 0, -0.45)), V((0, 0.01, -0.95))], [0.02, 0.019, 0.017], segs=7)
    stube(sb, "wood_dark", [V((0.15, 0, 0.03)), V((-0.15, 0, 0.03))], [0.02, 0.02], segs=7)


def prop_wind_hood(sb, k, rng):
    """A padded hood (风帽) over the head and the back of the neck, open at the face, with a thick rolled rim round
    the opening. Origin: the Head joint (the skull's base); the hood is a padded shell about 15 cm round the skull."""
    c = V((0, 0.012, 0.1))
    R, thick = 0.15, 0.022
    na, nl = 12, 7
    a0, a1 = math.radians(55), math.radians(305)          # azimuth from the front (-Y) round the back: the face is open
    lat = [math.radians(x) for x in (88, 65, 40, 15, -10, -38, -60, -80)]
    outer, inner = [], []
    for j, la in enumerate(lat):
        for i in range(na + 1):
            az = a0 + (a1 - a0) * i / na
            d = V((math.sin(az) * math.cos(la), -math.cos(az) * math.cos(la), math.sin(la)))
            back = max(0.0, -d.y)                         # the back of the hood falls lower, onto the neck
            r = R * (1 + 0.05 * math.sin(3 * az + j)) * (1 + 0.15 * back * (la < 0))
            outer.append(c + d * r)
            inner.append(c + d * (r - thick))
    m = na + 1
    fs = [(j * m + i, j * m + i + 1, (j + 1) * m + i + 1, (j + 1) * m + i) for j in range(len(lat) - 1) for i in range(na)]
    n = len(outer)
    fs += [tuple(reversed([q + n for q in f])) for f in fs]
    edge = [j * m for j in range(len(lat))] + [(len(lat) - 1) * m + i for i in range(1, m)] + [j * m + na for j in range(len(lat) - 2, -1, -1)]
    for a_, b_ in zip(edge, edge[1:]):
        fs.append((b_, a_, a_ + n, b_ + n))
    sb.B.add("cloth_indigo", False, outer + inner, fs)
    rim = [outer[j * m] for j in range(len(lat))][::-1] + [outer[j * m + na] for j in range(len(lat))]
    sb.tube("cloth_indigo", False, rim, [0.022] * len(rim), segs=5)


def prop_wind_cape(sb, k, rng):
    """The hood's short cape: a padded collar-cape from the neck over the shoulders and the upper back, shorter in
    front. Origin: the neck joint."""
    na = 16
    rows = [(0.06, 0.1, 0.0), (-0.04, 0.19, 0.0), (-0.16, 0.27, 0.1), (-0.27, 0.32, 0.22)]   # z, radius, front lift
    outer, inner = [], []
    for z, r, lift in rows:
        for i in range(na):
            az = 2 * math.pi * i / na
            d = V((math.sin(az), -math.cos(az), 0))
            front = max(0.0, math.cos(az))
            rr = r * (1 + 0.04 * math.sin(5 * az)) * (1 - 0.18 * front)
            p = d * rr + V((0, 0.03, z + lift * front ** 2))
            outer.append(p)
            inner.append(p - d * 0.02)
    fs = []
    for j in range(len(rows) - 1):
        for i in range(na):
            a, b = j * na + i, j * na + (i + 1) % na
            fs.append((a, b, b + na, a + na))
    n = len(outer)
    fs += [tuple(reversed([q + n for q in f])) for f in fs]
    last = (len(rows) - 1) * na
    for i in range(na):
        a, b = last + i, last + (i + 1) % na
        fs.append((b, a, a + n, b + n))
    sb.B.add("cloth_indigo", False, outer + inner, fs)


def straw_tier(sb, c, z0, z1, r0, r1, span=300, na=14, rng=None):
    """One layer of a straw rain cape: a ragged skirt round the back and sides from z0 (radius r0) down to z1 (r1),
    open over `360 - span` degrees at the front, its hem cut into tufts; on the straw strip with the grain running
    down."""
    rng = rng or random.Random(3)
    verts, faces, uvs = [], [], []
    a0 = math.radians(180 - span / 2)
    for i in range(na):
        for half in (0, 1):
            az0 = a0 + math.radians(span) * (i + 0.5 * half) / na
            az1 = a0 + math.radians(span) * (i + 0.5 * half + 0.5) / na
            q = []
            for az, z, r in ((az0, z0, r0), (az1, z0, r0), (az1, z1 - (0.05 if half else 0.0) - 0.03 * rng.random(), r1), (az0, z1 - (0.0 if half else 0.05) - 0.03 * rng.random(), r1)):
                q.append(c + V((math.sin(az) * r, -math.cos(az) * r, z)))
            base = len(verts)
            verts += q
            faces.append((base, base + 1, base + 2, base + 3))
            uvs.append([(0.0, half * 0.5), (0.0, half * 0.5 + 0.5), (1.0, half * 0.5 + 0.5), (1.0, half * 0.5)])
    sb.B.add("strip:straw", False, verts, faces, uvs)


def prop_straw_cape(sb, k, rng):
    """A layered straw rain cape (蓑衣) from the neck to the hips: four ragged tiers round the back and the sides,
    open in front. Origin: the Spine joint (the upper chest)."""
    c = V((0, 0.03, 0))
    straw_tier(sb, c, 0.12, -0.08, 0.1, 0.22, span=330, rng=rng)
    straw_tier(sb, c, 0.0, -0.22, 0.2, 0.27, span=300, rng=rng)
    straw_tier(sb, c, -0.15, -0.38, 0.24, 0.3, span=290, rng=rng)
    straw_tier(sb, c, -0.3, -0.55, 0.27, 0.33, span=280, rng=rng)
    ring(sb, "rope", c + V((0, 0, 0.1)), 0.105, 0.012, segs=10)


def food_box(sb, k, c, rng, w=0.34, d=0.24, h=0.36, handle=0.22):
    """A lidded, tiered food box (食盒) with a bail handle arching over it: c = the top of the handle; the box hangs
    below it. Three lacquered tiers with dark bands, a lid, the handle's two posts and crossbar."""
    c = V(c)
    z_top = c.z - handle
    z0 = z_top - h
    for t in range(3):
        a, b = z0 + h * t / 3.2, z0 + h * (t + 1) / 3.2 - 0.008
        k.soft_box("box_red", False, (c.x - w / 2, c.y - d / 2, a), (c.x + w / 2, c.y + d / 2, b), rng, r=0.02, wob=0.001, ease=0.004, tilt=0)
        k.soft_box("box_black", False, (c.x - w / 2 - 0.004, c.y - d / 2 - 0.004, b - 0.004), (c.x + w / 2 + 0.004, c.y + d / 2 + 0.004, b + 0.008), rng, r=0.015, wob=0.0, ease=0.002, tilt=0)
    k.soft_box("box_black", False, (c.x - w / 2 - 0.01, c.y - d / 2 - 0.01, z_top - h * 0.07), (c.x + w / 2 + 0.01, c.y + d / 2 + 0.01, z_top), rng, r=0.025, wob=0.001, ease=0.006, tilt=0)
    for s in (1, -1):
        stube(sb, "wood_dark", [V((c.x + s * (w / 2 + 0.02), c.y, z0 + 0.05)), V((c.x + s * (w / 2 + 0.02), c.y, c.z))], [0.012, 0.012], segs=5)
    stube(sb, "wood_dark", [V((c.x + w / 2 + 0.03, c.y, c.z)), V((c.x - w / 2 - 0.03, c.y, c.z))], [0.016, 0.016], segs=6)


def prop_food_box(sb, k, rng):
    """A food box carried in one hand by its handle. Origin: the fist on the handle's crossbar."""
    food_box(sb, k, V((0, 0, 0.0)), rng)


def prop_pole_hampers(sb, k, rng):
    """Two food boxes hung from the ends of a shoulder pole."""
    front, back = pole(sb, 0.8)
    for end in (front, back):
        sb.tube("rope", False, [end + V((0, 0, -0.02)), end + V((0, 0, -0.2))], [0.009, 0.009], segs=3)
        food_box(sb, k, end + V((0, 0, -0.2)), rng, w=0.36, d=0.26, h=0.34, handle=0.12)


def prop_folded_parasol(sb, k, rng):
    """A closed ceremonial fan (掌扇) on a long pole, about 2.2 m, carried on the shoulder: the pole along the facing,
    the furled head (a long tapered cloth bundle bound with cords) at its front end, raised. Origin: the shoulder."""
    pts = [V((0, 1.3 - 2.2 * f, 0.02 + 0.45 * max(0.0, f - 0.35) ** 1.5)) for f in np.linspace(0, 1, 9)]
    stube(sb, "wood_dark", pts, [0.02] * 9, segs=6)
    tip, prev = pts[-1], pts[-2]
    ax = (tip - prev).normalized()
    head0 = tip - ax * 0.05
    soft_roll(sb, "cloth_red", head0, head0 + ax * 0.75, 0.1, squash=0.55, rng=rng, lump=0.05)
    for f in (0.2, 0.5, 0.8):
        ring(sb, "gourd", head0 + ax * 0.75 * f, 0.07, 0.008, segs=8, axis=ax)
    sb.lathe("gourd", False, tuple(head0 + ax * 0.76), [(0.02, 0), (0.025, 0.03), (0.0, 0.07)], segs=6)


def prop_pole_hooks(sb, k, rng):
    """A bare shoulder pole with a rope and an iron hook hanging from each end (the water carrier's, unloaded)."""
    front, back = pole(sb, 0.8)
    for end in (front, back):
        bot = end + V((0, 0, -0.5))
        sb.tube("rope", False, [end + V((0, 0, -0.02)), end + V((0.01, 0, -0.25)), bot], [0.009] * 3, segs=3)
        hook = [bot + V((0, 0, -0.01 - 0.06 * math.sin(a) ** 0.5 if a < math.pi / 2 else -0.06)) for a in (0, 0.6, 1.2)]
        hook = [bot, bot + V((0, 0, -0.07)), bot + V((0, -0.035, -0.1)), bot + V((0, -0.06, -0.075)), bot + V((0, -0.06, -0.05))]
        sb.tube("iron", False, hook, [0.008] * len(hook), segs=4)


def bucket_at(sb, c, r=0.15, h=0.3, rope=True):
    """A banded wooden bucket, its bottom's middle at c."""
    c = V(c)
    slathe(sb, "wood", (c.x, c.y, c.z), [(r * 0.85, 0), (r * 0.95, h * 0.5), (r, h)], segs=12, swap=True)
    for t in (0.15, 0.82):
        ring(sb, "wood_dark", c + V((0, 0, h * t)), r * (0.87 + 0.13 * t) + 0.006, 0.01, segs=10)
    sb.lathe("timber", False, (c.x, c.y, c.z + h * 0.85), [(r * 0.94, 0.0), (0.0, -0.01)], segs=10)   # the water's surface


def prop_pole_buckets(sb, k, rng):
    """A shoulder pole with two banded buckets of water hung on ropes."""
    front, back = pole(sb, 0.8)
    for end in (front, back):
        rim = V((end.x, end.y, -0.55))
        hang_ropes(sb, end + V((0, 0, -0.02)), rim, 0.15, n=2)
        bucket_at(sb, rim - V((0, 0, 0.3)))


def prop_pole_jar_bundle(sb, k, rng):
    """A shoulder pole with a jar in a rope sling at the front end and a tall netted bundle at the back."""
    front, back = pole(sb, 0.8)
    c = V((front.x, front.y, -0.75))
    sb.lathe("ceramic", False, tuple(c), [(0.09, 0.0), (0.16, 0.1), (0.17, 0.2), (0.1, 0.3), (0.07, 0.33), (0.08, 0.36)], segs=12)
    for a in (0.0, math.pi / 2, math.pi, 3 * math.pi / 2):
        p = c + V((math.cos(a) * 0.17, math.sin(a) * 0.17, 0.18))
        sb.tube("rope", False, [front + V((0, 0, -0.02)), p, c + V((math.cos(a) * 0.1, math.sin(a) * 0.1, -0.005))], [0.008] * 3, segs=3)
    b = V((back.x, back.y, -0.55))
    sb.tube("rope", False, [back + V((0, 0, -0.02)), b + V((0, 0, 0.3))], [0.01, 0.01], segs=3)
    lump(sb, "cloth_white", b, 0.17, 0.17, 0.32, rng, nu=9, nv=6, k=0.1)
    for z in (-0.18, 0.0, 0.18):
        ring(sb, "rope", b + V((0, 0, z)), 0.17 * math.sqrt(max(0.1, 1 - (z / 0.32) ** 2)) + 0.01, 0.006, segs=10)
    for a in np.linspace(0, 2 * math.pi, 7)[:-1]:
        pts = [b + V((math.cos(a) * 0.17 * math.sqrt(max(0.05, 1 - (z / 0.33) ** 2)) * 1.04, math.sin(a) * 0.17 * math.sqrt(max(0.05, 1 - (z / 0.33) ** 2)) * 1.04, z)) for z in np.linspace(-0.3, 0.3, 6)]
        sb.tube("rope", False, pts, [0.005] * len(pts), segs=3)


def prop_pole_fringe_frame(sb, k, rng):
    """A shoulder pole with a round bag at the front and, at the back, a bow-shaped frame hung with long strips."""
    front, back = pole(sb, 0.8)
    f = V((front.x, front.y, -0.42))
    sb.tube("rope", False, [front + V((0, 0, -0.02)), f + V((0, 0, 0.14))], [0.009, 0.009], segs=3)
    lump(sb, "cloth_ochre", f, 0.17, 0.17, 0.16, rng, nu=9, nv=5, k=0.1)
    lump(sb, "cloth_ochre", f + V((0, 0, 0.15)), 0.04, 0.04, 0.04, rng, nu=6, nv=3, k=0.2)
    bow = [V((0.32 * math.cos(a), back.y + 0.05, -0.12 - 0.22 * math.sin(a))) for a in np.linspace(0, math.pi, 9)]
    bow = [V((p.x, p.y, -0.12 + (p.z + 0.12) * -1)) for p in bow]
    stube(sb, "bamboo_dark", bow, [0.012] * len(bow), segs=5)
    sb.tube("rope", False, [back + V((0, 0, -0.02)), bow[4]], [0.008, 0.008], segs=3)
    for p in bow[::1]:
        for dx in (-0.02, 0.02):
            q = p + V((dx, 0, 0))
            L = 0.45 + 0.12 * rng.random()
            sb.B.add("paper", False, [q + V((-0.012, 0, 0)), q + V((0.012, 0, 0)), q + V((0.014, 0.02, -L)), q + V((-0.01, 0.02, -L))], [(0, 1, 2, 3)])


def prop_pole_basket_branches(sb, k, rng):
    """A shoulder pole with a round basket at the front and a long bundle of cut branches slung at the back."""
    front, back = pole(sb, 0.8)
    rim = V((front.x, front.y, -0.55))
    hang_ropes(sb, front + V((0, 0, -0.02)), rim, 0.18)
    basket(sb, k, rim, 0.19, 0.3, rng, heap="greens")
    c = V((back.x, back.y + 0.25, -0.2))
    for i in range(9):
        a = 2 * math.pi * i / 9
        o = V((math.cos(a) * 0.05, 0, math.sin(a) * 0.05))
        p0 = c + o + V((0, -0.55, 0.08))
        p1 = c + o * 2.4 + V((rng.uniform(-0.05, 0.05), 0.6, -0.1 + rng.uniform(-0.05, 0.05)))
        stube(sb, "wood_dark", [p0, (p0 + p1) / 2 + V((0, 0, 0.02)), p1], [0.012, 0.01, 0.006], segs=4, caps=False)
    for y in (-0.35, 0.0):
        ring(sb, "rope", c + V((0, y, 0.06)), 0.075, 0.01, segs=8, axis=V((0, 1, 0)))
    sb.tube("rope", False, [back + V((0, 0, -0.02)), c + V((0, -0.2, 0.12))], [0.008, 0.008], segs=3)


def prop_flat_basket(sb, k, rng):
    """A big flat round winnowing basket held in both hands at the waist, tilted. Origin: between the fists, which
    hold its near rim."""
    c = V((0, -0.3, -0.02))
    slathe(sb, "wicker", tuple(c), [(0.05, -0.05), (0.3, -0.035), (0.37, 0.0), (0.38, 0.02)], segs=18)
    ring(sb, "bamboo_dark", c + V((0, 0, 0.02)), 0.385, 0.014, segs=16)
    lump(sb, "goods", c + V((0, 0.05, -0.02)), 0.18, 0.15, 0.03, rng, nu=8, nv=3, k=0.1)


def prop_rope_coil(sb, k, rng):
    """A coil of rope held against the chest in both hands. Origin: between the fists."""
    c = V((0, -0.04, -0.1))
    for i in range(6):
        ring(sb, "rope", c + V((-0.05 + 0.02 * i, 0, 0.01 * math.sin(i))), 0.16 + 0.012 * math.sin(2.1 * i), 0.016, segs=14, axis=V((1, 0, 0.12)).normalized())
    sb.tube("rope", False, [c + V((0, 0, -0.16)), c + V((0.02, -0.03, -0.3)), c + V((0.04, 0.0, -0.45))], [0.016] * 3, segs=4)


def prop_lidded_basket(sb, k, rng):
    """A round lidded basket with a loop handle carried at the side. Origin: the fist on the handle."""
    c = V((0, 0, -0.4))
    slathe(sb, "wicker", tuple(c), [(0.1, 0.0), (0.15, 0.06), (0.16, 0.18)], segs=14)
    sb.B.add("wicker", False, [c + V((0, 0, 0.002))] + [c + V((math.cos(2 * math.pi * i / 12) * 0.1, math.sin(2 * math.pi * i / 12) * 0.1, 0.002)) for i in range(12)],
             [(0, 1 + (i + 1) % 12, 1 + i) for i in range(12)])
    sb.lathe("wood_dark", False, tuple(c + V((0, 0, 0.18))), [(0.17, 0.0), (0.12, 0.05), (0.0, 0.07)], segs=12)
    ring(sb, "bamboo_dark", c + V((0, 0, 0.18)), 0.165, 0.012, segs=12)
    arc = [V((0.15 * math.cos(a), 0, c.z + 0.19 + 0.21 * math.sin(a))) for a in np.linspace(0, math.pi, 9)]
    stube(sb, "bamboo_dark", arc, [0.011] * len(arc), segs=5)


def prop_mallet(sb, k, rng):
    """A short wooden mallet in the fist: the handle up from the grip, the head across its top."""
    stube(sb, "wood", [V((0, 0, -0.06)), V((0, 0, 0.26))], [0.016, 0.014], segs=6)
    stube(sb, "wood_dark", [V((0, 0.08, 0.3)), V((0, -0.08, 0.3))], [0.045, 0.045], segs=8)


def prop_open_sack(sb, k, rng):
    """A pale sack held open at knee height in both hands, its mouth gathered at the hands. Origin: between the
    fists; the sack hangs below."""
    c = V((0, -0.05, 0.0))
    sb.lathe("sack", False, tuple(c - V((0, 0, 0.5))), [(0.0, -0.01), (0.15, 0.0), (0.22, 0.14), (0.21, 0.32), (0.17, 0.46), (0.19, 0.5)], segs=12)
    sb.lathe("goods", False, tuple(c - V((0, 0, 0.12))), [(0.18, 0.0), (0.0, 0.03)], segs=10)
    ring(sb, "sack", c, 0.19, 0.02, segs=12)


def prop_stick_bag(sb, k, rng):
    """A short stick held upright at the chest with a long dark bag hanging from its top. Origin: the fist."""
    stube(sb, "wood", [V((0, 0, -0.15)), V((0, 0, 0.45))], [0.014, 0.012], segs=6)
    sb.tube("rope", False, [V((0, 0, 0.43)), V((0.01, -0.02, 0.38)), V((0.02, -0.04, 0.34))], [0.007] * 3, segs=3)
    lump(sb, "cloth_dark", V((0.02, -0.06, 0.13)), 0.065, 0.055, 0.22, rng, nu=8, nv=5, k=0.1)


def prop_hoe(sb, k, rng):
    """A field hoe about 1.6 m carried over the right shoulder: the handle along the facing, its small iron head
    hooked down at the back end. Origin: the shoulder."""
    pts = [V((0, -0.45 + 1.6 * f, 0.03 - 0.02 * math.sin(math.pi * f))) for f in np.linspace(0, 1, 7)]
    stube(sb, "wood", pts, [0.019 - 0.004 * i / 6 for i in range(7)], segs=6)
    end = pts[-1]
    neck = [end, end + V((0, 0.05, -0.04)), end + V((0, 0.04, -0.13))]
    sb.tube("iron", False, neck, [0.012, 0.011, 0.01], segs=4)
    b = neck[-1]
    sb.B.add("iron", False, [b + V((-0.07, 0, 0)), b + V((0.07, 0, 0)), b + V((0.08, -0.12, -0.05)), b + V((-0.08, -0.12, -0.05)),
                             b + V((-0.07, 0.008, 0)), b + V((0.07, 0.008, 0)), b + V((0.08, -0.112, -0.055)), b + V((-0.08, -0.112, -0.055))],
             [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)])


def prop_hat_on_back(sb, k, rng):
    """A broad straw hat hanging behind the shoulders on its strings. Origin: the upper back."""
    c = V((0, 0.17, 0.02))
    ax = V((0, 1, 0.25)).normalized()
    u = V((1, 0, 0))
    v = ax.cross(u).normalized()
    na = 16
    vs = [c + ax * 0.13]
    for i in range(na):
        a = 2 * math.pi * i / na
        vs.append(c + (u * math.cos(a) + v * math.sin(a)) * 0.33)
    fs = [(0, 1 + i, 1 + (i + 1) % na) for i in range(na)]
    fs += [(0, 1 + (i + 1) % na, 1 + i) for i in range(na)]
    sb.B.add("straw", False, vs, fs)
    ring(sb, "bamboo_dark", c, 0.33, 0.01, segs=16, axis=ax)
    for s in (1, -1):
        sb.tube("rope", False, [c + v * 0.08 + u * s * 0.05, V((s * 0.07, 0.05, 0.2)), V((s * 0.05, -0.06, 0.24))], [0.006] * 3, segs=3)


def prop_back_chair_frame(sb, k, rng):
    """A pedlar's chair-frame carried on the back (a seat with a back and legs, roped on): uprights, rails, a seat
    board. Origin: the upper back."""
    y0, y1 = 0.15, 0.48
    for s in (1, -1):
        stube(sb, "wood", [V((s * 0.2, y0, -0.75)), V((s * 0.2, y0, 0.55))], [0.02, 0.018], segs=6)
        stube(sb, "wood", [V((s * 0.2, y1, -0.75)), V((s * 0.2, y1, -0.2))], [0.02, 0.02], segs=6)
        k.beam("timber", False, (s * 0.2, y0, -0.2), (s * 0.2, y1, -0.2), 0.03, 0.03, 0.005)
        k.beam("timber", False, (s * 0.2, y0, -0.6), (s * 0.2, y1, -0.6), 0.025, 0.025, 0.004)
    for z in (0.5, 0.2, -0.6):
        k.beam("timber", False, (0.21, y0, z), (-0.21, y0, z), 0.03, 0.025, 0.005)
    k.soft_box("timber", False, (-0.21, y0, -0.21), (0.21, y1, -0.18), rng, r=0.015, wob=0.001, ease=0.003, tilt=0)
    for s in (1, -1):
        sb.tube("rope", False, [V((s * 0.13, 0.08, 0.14)), V((s * 0.14, -0.06, 0.2)), V((s * 0.16, -0.12, 0.0)), V((s * 0.17, y0 - 0.02, -0.25))], [0.012] * 4, segs=3)


def prop_veiled_hat(sb, k, rng):
    """A wide hat with a gauze veil hanging all round to the shoulders (帷帽). Origin: the Head joint; the hat sits
    on the crown."""
    top = 0.17
    sb.lathe("cloth_dark", False, (0, 0.01, top), [(0.22, 0.0), (0.17, 0.022), (0.1, 0.035), (0.09, 0.1), (0.0, 0.11)], segs=16)
    na = 18
    outer, inner = [], []
    for z, r in ((top + 0.004, 0.205), (top - 0.12, 0.21), (top - 0.22, 0.215)):
        for i in range(na):
            a = 2 * math.pi * i / na
            rr = r * (1 + 0.03 * math.sin(4 * a + z * 9))
            outer.append(V((math.cos(a) * rr, 0.01 + math.sin(a) * rr, z)))
            inner.append(V((math.cos(a) * (rr - 0.006), 0.01 + math.sin(a) * (rr - 0.006), z)))
    fs = [(j * na + i, j * na + (i + 1) % na, (j + 1) * na + (i + 1) % na, (j + 1) * na + i) for j in range(2) for i in range(na)]
    n = len(outer)
    fs += [tuple(reversed([q + n for q in f])) for f in fs]
    sb.B.add("cloth_grey", False, outer + inner, fs)


def prop_back_bundle_pale(sb, k, rng):
    """The back bundle in pale cloth (a visitor's)."""
    lump(sb, "cloth_white", V((0, 0.17, -0.12)), 0.2, 0.14, 0.24, rng, k=0.15)
    lump(sb, "cloth_white", V((0.08, 0.04, 0.12)), 0.05, 0.05, 0.05, rng)
    sb.tube("cloth_white", False, [V((0.08, 0.06, 0.1)), V((0.1, -0.08, 0.12)), V((-0.06, -0.18, -0.1))], [0.025, 0.02, 0.018], segs=4)


def prop_child_on_lap(sb, k, rng):
    """A small child (about 2-3 years) sitting upright on a seated woman's lap, facing out, its back against her,
    her hands at its waist. Origin: her Hips joint (Blender +X her left, -Y her front, +Z up)."""
    J = {"pelvis": (0, -0.24, 0.08), "chest": (0, -0.23, 0.27), "neck": (0, -0.23, 0.36), "head": (0, -0.24, 0.44),
         "sh_l": (0.085, -0.23, 0.32), "sh_r": (-0.085, -0.23, 0.32), "el_l": (0.11, -0.28, 0.22), "el_r": (-0.11, -0.28, 0.22),
         "ha_l": (0.07, -0.36, 0.18), "ha_r": (-0.07, -0.36, 0.18),
         "hi_l": (0.06, -0.26, 0.06), "hi_r": (-0.06, -0.26, 0.06), "kn_l": (0.08, -0.45, 0.07), "kn_r": (-0.08, -0.45, 0.07),
         "ft_l": (0.08, -0.5, -0.13), "ft_r": (-0.08, -0.5, -0.13)}
    child_figure(sb, J, rng, s=0.85)


PROPS.update({
    "long_pole": prop_long_pole, "long_pole_low": prop_long_pole_low, "long_pole_mid": prop_long_pole_mid,
    "back_sack": prop_back_sack, "back_sack_dark": prop_back_sack_dark, "sack_shoulder": prop_sack_shoulder,
    "hip_bag": prop_hip_bag, "hand_dish_buns": prop_hand_dish_buns, "hand_dish_bowl": prop_hand_dish_bowl,
    "hand_dish_cup": prop_hand_dish_cup, "bundle_small": prop_bundle_small, "bundle_hang": prop_bundle_hang,
    "back_tall_bundle": prop_back_tall_bundle, "t_stick": prop_t_stick, "wind_hood": prop_wind_hood,
    "wind_cape": prop_wind_cape, "straw_cape": prop_straw_cape, "food_box": prop_food_box,
    "pole_hampers": prop_pole_hampers, "folded_parasol": prop_folded_parasol, "pole_hooks": prop_pole_hooks,
    "pole_buckets": prop_pole_buckets, "pole_jar_bundle": prop_pole_jar_bundle,
    "pole_fringe_frame": prop_pole_fringe_frame, "pole_basket_branches": prop_pole_basket_branches,
    "flat_basket": prop_flat_basket, "rope_coil": prop_rope_coil, "lidded_basket": prop_lidded_basket,
    "mallet": prop_mallet, "open_sack": prop_open_sack, "stick_bag": prop_stick_bag, "hoe": prop_hoe,
    "hat_on_back": prop_hat_on_back, "back_chair_frame": prop_back_chair_frame, "veiled_hat": prop_veiled_hat,
    "back_bundle_pale": prop_back_bundle_pale,
})
# The carried children (child_on_back, child_on_shoulders, child_in_arms, child_on_lap) are no longer built here: since
# 2026-10-13 they are the rigged child posed onto each carrier by IK (tools/carry_pose.mjs, gen/props/carry.json), and
# a full rebuild here must not overwrite them. prop_child_* above are the old kit-primitive children, kept for the
# record (gen/details/children/before/props/).


def bake(sb, name, mat):
    vs, fs, uvs = [], [], []
    for (mname, _), b in sb.B.data.items():
        base = len(vs)
        vs += [tuple(v) for v in b["v"]]
        strip = mname[6:] if mname.startswith("strip:") else None
        uv = None if strip else palette_uv(mname)
        for f, fu in zip(b["f"], b["uv"]):
            fs.append(tuple(i + base for i in f))
            uvs.append([strip_uv(strip, *q) for q in fu] if strip and fu else [uv or palette_uv("rope")] * len(f))
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    me.validate()
    uvl = me.uv_layers.new(name="UVMap")
    for poly, row in zip(me.polygons, uvs):
        for k_, li in enumerate(poly.loop_indices):
            uvl.data[li].uv = row[k_ % len(row)]
    me.materials.append(mat)
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(40))   # round things shade round; boxes and blades keep their edges
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def material(img):
    m = bpy.data.materials.new("prop_palette")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 1.0
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Linear"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return m


def mode_build(out_dir, only=None):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    img = palette_image()
    mat = material(img)
    os.makedirs(out_dir, exist_ok=True)
    for name, fn in PROPS.items():
        if only and name not in only:
            continue
        for o in list(bpy.data.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        sb, k = kit()
        fn(sb, k, random.Random(hash(name) & 0xffff))
        ob = bake(sb, name, mat)
        tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        path = os.path.join(out_dir, f"{name}.glb")
        bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True,
                                  export_apply=True, export_animations=False, export_cameras=False, export_lights=False)
        lo = [min(v.co[i] for v in ob.data.vertices) for i in range(3)]
        hi = [max(v.co[i] for v in ob.data.vertices) for i in range(3)]
        print(f"PROP {name}: {tris} tris, size {[round(h - l, 2) for l, h in zip(lo, hi)]} -> {path}", flush=True)


# ---------------------------------------------------------------- review: the posed character with one prop

def setup(res=(420, 520)):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.view_settings.view_transform = "Standard"
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.62, 0.62, 0.6, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.7
    sc.world = w
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 2.5
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    sc.collection.objects.link(sun)
    g = bpy.data.meshes.new("ground")
    g.from_pydata([(-9, -9, 0), (9, -9, 0), (9, 9, 0), (-9, 9, 0)], [], [(0, 1, 2, 3)])
    gm = bpy.data.materials.new("ground")
    gm.use_nodes = True
    gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.48, 0.38, 1)
    g.materials.append(gm)
    sc.collection.objects.link(bpy.data.objects.new("ground", g))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    return cam


def compose(rows, out):
    imgs = [[bpy.data.images.load(p) for p in row] for row in rows]
    w = max(sum(i.size[0] for i in row) for row in imgs)
    h = sum(max(i.size[1] for i in row) for row in imgs)
    buf = np.zeros((h, w, 4), dtype=np.float32)
    y = h
    for row in imgs:
        rh = max(i.size[1] for i in row)
        y -= rh
        x = 0
        for im in row:
            px = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
            buf[y:y + im.size[1], x:x + im.size[0]] = px
            x += im.size[0]
    sheet = bpy.data.images.new("sheet", w, h, alpha=True)
    sheet.pixels.foreach_set(buf.reshape(-1))
    sheet.filepath_raw = out
    sheet.file_format = "PNG"
    sheet.save()


def mode_review(glb, out_png, clip, prop, times, views=((90, 6), (35, 14)), dist=4.2, z=1.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = 30
    cam = setup()
    bpy.ops.import_scene.gltf(filepath=glb)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    for o in bpy.data.objects:
        base = o.name.split(".")[0]
        if base.startswith("prop_") and base != f"prop_{prop}":
            o.hide_render = True
        if base == "Icosphere":
            o.hide_render = True
    act = bpy.data.actions.get(clip)
    if act is None:
        act = next(a for a in bpy.data.actions if a.name.startswith(clip))
    arm.animation_data_create()
    arm.animation_data.action = act
    if hasattr(arm.animation_data, "action_slot") and act.slots:
        arm.animation_data.action_slot = act.slots[0]
    tmp = os.path.dirname(out_png)
    rows = []
    for vi, (az, el) in enumerate(views):
        row = []
        for ti, t in enumerate(times):
            sc.frame_set(int(round(t * 30)))
            bpy.context.view_layer.update()
            # follow the hips
            hips = arm.matrix_world @ arm.pose.bones["Hips"].head
            target = Vector((hips.x, hips.y, z))
            a, e = math.radians(az), math.radians(el)
            # az 0 = from the front (the character faces -Y in Blender after import), 90 = from its left (+X)
            d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
            cam.location = target + d * dist
            cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
            cam.data.lens = 50
            p = os.path.join(tmp, f"_pr_{vi}_{ti}.png")
            sc.render.filepath = p
            bpy.ops.render.render(write_still=True)
            row.append(p)
        rows.append(row)
    compose(rows, out_png)
    for row in rows:
        for p in row:
            os.remove(p)
    print("REVIEW", out_png, flush=True)


def mode_review_many(jobs_json):
    """Many reviews in one Blender run: a JSON list of {glb, out, clip, prop, times, views?, dist?, z?} (UNC paths;
    dist: camera distance in metres, default 4.2; z: the height it aims at, default 1.0)."""
    import json
    for j in json.load(open(jobs_json, encoding="utf-8")):
        try:
            mode_review(j["glb"], j["out"], j["clip"], j["prop"], j["times"], tuple(tuple(v) for v in j.get("views", ((90, 6), (35, 14)))),
                        j.get("dist", 4.2), j.get("z", 1.0))
        except Exception as e:  # noqa: BLE001
            print("REVIEW FAILED", j["out"], repr(e), flush=True)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if argv and argv[0] == "build":
        mode_build(argv[1], argv[2].split(",") if len(argv) > 2 and argv[2] else None)
    elif argv and argv[0] == "review_many":
        mode_review_many(argv[1])
    elif argv and argv[0] == "review":
        mode_review(argv[1], argv[2], argv[3], argv[4], [float(x) for x in argv[5].split(",")])
