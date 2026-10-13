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
    "goad": prop_goad, "stick": prop_stick, "staff": prop_staff, "whip": prop_whip, "child_in_arms": prop_child_in_arms,
    "child_on_shoulders": prop_child_on_shoulders, "child_on_back": prop_child_on_back, "tray": prop_tray,
    "tray_head": prop_tray_head, "box_shoulder": prop_box_shoulder, "lead_rope": prop_lead_rope,
}


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


def mode_review(glb, out_png, clip, prop, times):
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
    for vi, (az, el) in enumerate(((90, 6), (35, 14))):
        row = []
        for ti, t in enumerate(times):
            sc.frame_set(int(round(t * 30)))
            bpy.context.view_layer.update()
            # follow the hips
            hips = arm.matrix_world @ arm.pose.bones["Hips"].head
            target = Vector((hips.x, hips.y, 1.0))
            a, e = math.radians(az), math.radians(el)
            # az 0 = from the front (the character faces -Y in Blender after import), 90 = from its left (+X)
            d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
            cam.location = target + d * 4.2
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


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if argv and argv[0] == "build":
        mode_build(argv[1], argv[2].split(",") if len(argv) > 2 and argv[2] else None)
    elif argv and argv[0] == "review":
        mode_review(argv[1], argv[2], argv[3], argv[4], [float(x) for x in argv[5].split(",")])
