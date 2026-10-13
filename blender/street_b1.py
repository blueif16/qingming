"""Street B1 test slice: a Song market street rebuilt from qingming/gen/v1/target_street_B1.png.

build(scene) creates collection "street_b1" in `scene`: one mesh per (material, collide) bucket, named
"<material>__col" or "<material>__nocol" so the web page knows what the player collides with, plus a
camera "ref_cam" placed to match the B1 target frame. export(path) writes the GLB.

Live GUI: importlib.reload(street_b1); street_b1.build(bpy.data.scenes["street_b1"])
Units are metres. The street runs along +Y, starting at y = 0; +X is the right-hand side.
"""
import math
import random

import bpy
from mathutils import Matrix, Vector

TEX_DIR = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\v1\textures"

# name: (texture file or None, tile size in metres, colour)
MATERIALS = {
    "roof": ("tex_roof.png", 1.4, None),
    "timber": ("tex_timber.png", 1.2, None),
    "plaster": ("tex_plaster.png", 2.0, None),
    "earth": ("tex_earth.png", 3.0, None),
    "reed": ("tex_reed.png", 1.0, None),
    "paving": ("tex_paving.png", 1.4, None),
    "bamboo": (None, 1, "#b8955a"),
    "bark": (None, 1, "#5b4733"),
    "willow": (None, 1, "#b3b98b"),
    "cloth_white": (None, 1, "#e6decb"),
    "cloth_indigo": (None, 1, "#4f6081"),
    "cloth_red": (None, 1, "#c27261"),
    "jar_green": (None, 1, "#8b9a88"),
    "jar_red": (None, 1, "#9b6a58"),
    "ridge": (None, 1, "#585a5c"),
    "interior": (None, 1, "#3d2f24"),
    "hidden": (None, 1, "#ff00ff"),  # collider-only geometry; the web page hides "hidden__*" meshes
}


class Buckets:
    """Geometry accumulated per (material, collide); each face may carry explicit UVs.

    Owners (qingming/map/BUILDING.md): `with entity(id):` says which map entity the geometry added inside belongs
    to; `tris` counts triangles per owner for the scene's manifest. With strict=True, geometry added outside any
    entity is an error, so nothing without a map ID can slip into a scene."""

    def __init__(self, strict=False):
        self.data = {}
        self.strict = strict
        self.owners = []
        self.tris = {}

    def add(self, mat, collide, verts, faces, uvs=None):
        owner = self.owners[-1] if self.owners else None
        if owner is None and self.strict:
            raise RuntimeError(f"untagged geometry ({mat}): wrap it in street_b1.entity(<map id>) (map/BUILDING.md)")
        self.tris[owner] = self.tris.get(owner, 0) + sum(len(f) - 2 for f in faces)
        if owner and owner.startswith("edge:") and mat == "hidden":
            # each edge wall is its own collider-only mesh ("g_edge_<name>_hidden__col"), so the world page can drop
            # the walls between joined sections (an edge named after its side: south, east, north, west)
            mat = f"edge_{owner[5:]}_hidden"
            MATERIALS.setdefault(mat, MATERIALS["hidden"])
        b = self.data.setdefault((mat, collide), {"v": [], "f": [], "uv": []})
        base = len(b["v"])
        b["v"].extend(Vector(v) for v in verts)
        for i, f in enumerate(faces):
            b["f"].append([base + k for k in f])
            b["uv"].append(uvs[i] if uvs else None)
        # each face's owner, parallel to b["f"] (blender/owners_dump.py writes them per owner for the contact checks)
        b.setdefault("o", []).extend([owner] * len(faces))


B = Buckets()


class entity:
    """with entity("S5.bld.tax_office"): ... -- the geometry added inside belongs to that map entity. The innermost
    entity wins (a prop inside a building keeps its own ID). Owners that are not map entities: "edge:<name>" (an
    invisible collider closing the walkable area) and "ground" (the ground surface: roads, water, banks)."""

    def __init__(self, owner):
        self.owner = owner

    def __enter__(self):
        B.owners.append(self.owner)
        return self

    def __exit__(self, *exc):
        B.owners.pop()


# ---------------------------------------------------------------- primitives

def box(mat, collide, center, size, rot_z=0.0):
    cx, cy, cz = center
    sx, sy, sz = (s / 2 for s in size)
    m = Matrix.Translation(center) @ Matrix.Rotation(rot_z, 4, "Z")
    pts = [m @ Vector((x, y, z)) for x in (-sx, sx) for y in (-sy, sy) for z in (-sz, sz)]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    B.add(mat, collide, pts, faces)


def cyl(mat, collide, p0, p1, r0, r1=None, segs=8, caps=True):
    r1 = r0 if r1 is None else r1
    p0, p1 = Vector(p0), Vector(p1)
    axis = (p1 - p0).normalized()
    m = axis.to_track_quat("Z", "X" if abs(axis.y) > 0.9 else "Y").to_matrix()
    verts, faces = [], []
    for k, (p, r) in enumerate(((p0, r0), (p1, r1))):
        for i in range(segs):
            a = 2 * math.pi * i / segs
            verts.append(p + m @ Vector((math.cos(a) * r, math.sin(a) * r, 0)))
    for i in range(segs):
        j = (i + 1) % segs
        faces.append((i, j, segs + j, segs + i))
    if caps:
        faces.append(tuple(reversed(range(segs))))
        faces.append(tuple(range(segs, 2 * segs)))
    B.add(mat, collide, verts, faces)


def tube(mat, collide, pts, radii, segs=5):
    """Tube through a polyline; radii per point."""
    pts = [Vector(p) for p in pts]
    verts, faces = [], []
    for k, p in enumerate(pts):
        d = (pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]).normalized()
        m = d.to_track_quat("Z", "X" if abs(d.y) > 0.9 else "Y").to_matrix()
        for i in range(segs):
            a = 2 * math.pi * i / segs
            verts.append(p + m @ Vector((math.cos(a) * radii[k], math.sin(a) * radii[k], 0)))
    for k in range(len(pts) - 1):
        for i in range(segs):
            j = (i + 1) % segs
            faces.append((k * segs + i, k * segs + j, (k + 1) * segs + j, (k + 1) * segs + i))
    B.add(mat, collide, verts, faces)


def quad(mat, collide, a, b, c, d, uv=None):
    B.add(mat, collide, [a, b, c, d], [(0, 1, 2, 3)], [uv] if uv else None)


def lathe(mat, collide, center, profile, segs=10):
    """profile: [(radius, z), ...] bottom to top, revolved around Z at center."""
    cx, cy, cz = center
    verts, faces = [], []
    for r, z in profile:
        for i in range(segs):
            a = 2 * math.pi * i / segs
            verts.append((cx + math.cos(a) * r, cy + math.sin(a) * r, cz + z))
    for k in range(len(profile) - 1):
        for i in range(segs):
            j = (i + 1) % segs
            faces.append((k * segs + i, k * segs + j, (k + 1) * segs + j, (k + 1) * segs + i))
    faces.append(tuple(reversed(range(segs))))
    B.add(mat, collide, verts, faces)


def ribbon(mat, pts, width):
    """Vertical cloth strip hanging below a polyline (festoons)."""
    verts, faces = [], []
    for p in pts:
        verts += [Vector(p), Vector(p) - Vector((0, 0, width))]
    for k in range(len(pts) - 1):
        faces.append((2 * k, 2 * k + 2, 2 * k + 3, 2 * k + 1))
    B.add(mat, False, verts, faces)


def gable_roof(y0, y1, x_front, x_ridge, x_back, z_front, z_ridge, z_back, tile=1.4):
    """Roof with the ridge along Y; slopes face +-X. UVs run down each slope."""
    t = 0.12
    for xa, za in ((x_front, z_front), (x_back, z_back)):
        slope = math.hypot(xa - x_ridge, za - z_ridge)
        uv = [(y0 / tile, 0), (y1 / tile, 0), (y1 / tile, slope / tile), (y0 / tile, slope / tile)]
        top = [(x_ridge, y0, z_ridge), (x_ridge, y1, z_ridge), (xa, y1, za), (xa, y0, za)]
        if xa > x_ridge:  # keep the winding so normals face up and out
            top = [top[1], top[0], top[3], top[2]]
            uv = [uv[1], uv[0], uv[3], uv[2]]
        quad("roof", False, *top, uv=uv)
        bottom = [Vector(p) - Vector((0, 0, t)) for p in top]
        quad("timber", False, *reversed(bottom))
        quad("timber", False, top[2], top[3], bottom[3], bottom[2])
    box("ridge", False, (x_ridge, (y0 + y1) / 2, z_ridge + 0.06), (0.32, y1 - y0 + 0.1, 0.18))


def gable_roof_x(x0, x1, y_front, y_ridge, y_back, z_eave, z_ridge, tile=1.4):
    """Roof with the ridge along X (facing down the street)."""
    t = 0.14
    for ya in (y_front, y_back):
        slope = math.hypot(ya - y_ridge, z_eave - z_ridge)
        top = [(x0, y_ridge, z_ridge), (x1, y_ridge, z_ridge), (x1, ya, z_eave), (x0, ya, z_eave)]
        uv = [(x0 / tile, 0), (x1 / tile, 0), (x1 / tile, slope / tile), (x0 / tile, slope / tile)]
        if ya < y_ridge:
            top = [top[1], top[0], top[3], top[2]]
            uv = [uv[1], uv[0], uv[3], uv[2]]
        quad("roof", False, *top, uv=uv)
        bottom = [Vector(p) - Vector((0, 0, t)) for p in top]
        quad("timber", False, *reversed(bottom))
    box("ridge", False, ((x0 + x1) / 2, y_ridge, z_ridge + 0.07), (x1 - x0 + 0.1, 0.36, 0.2))


# ---------------------------------------------------------------- set pieces

def shop(side, y0, y1, rng, awning=True):
    s = side
    depth = rng.uniform(4.8, 6.0)
    eave = rng.uniform(2.75, 3.05)
    rise = rng.uniform(1.15, 1.5)
    xf, xb = 4.6, 4.6 + depth
    X = lambda x: s * x
    w = y1 - y0
    # floor, back wall, party walls
    box("timber", True, (X(xf + depth / 2), (y0 + y1) / 2, 0.15), (depth, w, 0.3))
    box("plaster" if rng.random() < 0.5 else "timber", True, (X(xb), (y0 + y1) / 2, eave / 2), (0.16, w, eave))
    for yw in (y0, y1):
        box("plaster", True, (X(xf + 0.2 + depth / 2), yw, eave / 2), (depth - 0.4, 0.16, eave))
        # gable triangle above the party wall, under the roof
        xr = xf + depth * 0.45
        B.add("plaster", False, [(X(xf + 0.2), yw, eave), (X(xr), yw, eave + rise - 0.1), (X(xb), yw, eave)], [(0, 1, 2)])
    # front posts and lintel
    n_posts = 3 if w > 4.6 else 2
    for i in range(n_posts):
        yp = y0 + 0.18 + (w - 0.36) * i / (n_posts - 1)
        cyl("timber", True, (X(xf), yp, 0.3), (X(xf), yp, eave), 0.11)
    box("timber", True, (X(xf), (y0 + y1) / 2, eave - 0.12), (0.2, w, 0.24))
    # interior: dark back, shelves, counter
    box("interior", False, (X(xb - 0.1), (y0 + y1) / 2, eave / 2), (0.05, w - 0.4, eave - 0.2))
    box("timber", True, (X(xb - 0.45), (y0 + y1) / 2, 0.95), (0.6, w * 0.7, 1.3))
    box("timber", True, (X(xf + 0.75), y0 + w * 0.35, 0.72), (0.55, w * 0.5, 0.85))
    # removed shutter boards stacked against the far post
    for k in range(rng.randint(5, 8)):
        box("timber", True, (X(xf + 0.12 + 0.045 * k), y1 - 0.45 - 0.05 * k, 1.5), (0.04, 0.26, 2.35), rot_z=0.05 * s)
    # roof: eave overhangs the sidewalk
    gable_roof(y0 - 0.25, y1 + 0.25, X(xf - 0.95), X(xf + depth * 0.45), X(xb + 0.45),
               eave - 0.28, eave + rise, eave - 0.1)
    if awning:
        zi, zo = eave - 0.3, eave - 1.0
        xi, xo = 4.45, 2.75
        quad("reed", False, (X(xi), y0 + 0.3, zi), (X(xi), y1 - 0.3, zi), (X(xo), y1 - 0.3, zo), (X(xo), y0 + 0.3, zo),
             uv=[(0, 0), (w / 1.0, 0), (w / 1.0, 1.4), (0, 1.4)])
        for yp in (y0 + 0.35, y1 - 0.35):
            cyl("bamboo", True, (X(xo), yp, 0.15), (X(xo), yp, zo + 0.05), 0.045, segs=6)
        cyl("bamboo", False, (X(xo), y0 + 0.2, zo), (X(xo), y1 - 0.2, zo), 0.04, segs=6)
        for k in range(rng.randint(0, 2)):
            yb = rng.uniform(y0 + 0.8, y1 - 0.8)
            col = rng.choice(["cloth_white", "cloth_indigo", "cloth_red", "cloth_white"])
            quad(col, False, (X(xo + 0.08), yb - 0.25, zo - 0.05), (X(xo + 0.08), yb + 0.25, zo - 0.05),
                 (X(xo + 0.08), yb + 0.25, zo - 1.35), (X(xo + 0.08), yb - 0.25, zo - 1.35))
    # sidewalk props
    if rng.random() < 0.6:
        bench(X(3.75), rng.uniform(y0 + 1.0, y1 - 1.2), s, rng)
    for k in range(rng.randint(1, 3)):
        jar(X(rng.uniform(3.9, 4.35)), rng.uniform(y0 + 0.4, y1 - 0.4), 0.15, rng)
    for k in range(rng.randint(0, 2)):
        basket(X(rng.uniform(3.4, 4.3)), rng.uniform(y0 + 0.4, y1 - 0.4), 0.15, rng)


def bench(x, y, side, rng):
    L = rng.uniform(1.3, 1.8)
    box("timber", True, (x, y, 0.62), (0.4, L, 0.08))
    for dy in (-L / 2 + 0.15, L / 2 - 0.15):
        for dx in (-0.12, 0.12):
            box("timber", True, (x + dx, y + dy, 0.385), (0.07, 0.07, 0.47))


def jar(x, y, z, rng):
    h = rng.uniform(0.55, 0.9)
    r = h * rng.uniform(0.38, 0.48)
    prof = [(r * 0.55, 0), (r * 0.95, h * 0.25), (r, h * 0.55), (r * 0.7, h * 0.85), (r * 0.42, h * 0.95), (r * 0.48, h)]
    lathe(rng.choice(["jar_green", "jar_red", "jar_green"]), True, (x, y, z), prof, segs=12)


def basket(x, y, z, rng):
    r = rng.uniform(0.25, 0.38)
    h = r * rng.uniform(0.7, 1.1)
    lathe("reed", True, (x, y, z), [(r * 0.75, 0), (r, h * 0.6), (r * 1.05, h)], segs=12)


def willow(x, y, rng):
    trunk = [(x, y, 0.15), (x + 0.1, y + 0.05, 1.3), (x + 0.35, y + 0.15, 2.6), (x + 0.6, y + 0.3, 3.8)]
    tube("bark", True, trunk, [0.32, 0.26, 0.2, 0.15], segs=8)
    top = Vector(trunk[-1])
    for i in range(7):
        a = 2 * math.pi * i / 7 + rng.uniform(-0.3, 0.3)
        reach = rng.uniform(2.2, 3.4)
        mid = top + Vector((math.cos(a) * reach * 0.5, math.sin(a) * reach * 0.5, rng.uniform(0.9, 1.4)))
        tip = top + Vector((math.cos(a) * reach, math.sin(a) * reach, rng.uniform(1.6, 2.4)))
        tube("bark", False, [top, mid, tip], [0.1, 0.06, 0.03], segs=5)
        for k in range(48):
            t = rng.uniform(0.3, 1.0)
            p = top.lerp(mid, t) if t < 0.6 else mid.lerp(tip, (t - 0.6) / 0.4)
            drop = rng.uniform(1.8, 3.2)
            out = Vector((math.cos(a), math.sin(a), 0)) * rng.uniform(0.15, 0.45)
            pts = [p, p + out * 0.6 + Vector((0, 0, 0.15)), p + out + Vector((0, 0, -drop * 0.5)), p + out * 1.1 + Vector((0, 0, -drop))]
            tube("willow", False, pts, [0.01, 0.009, 0.008, 0.004], segs=3)


def entrance_and_winehouse(y_gate):
    # cailou huanmen: lashed pole frame across the street
    poles = [(-3.4, 6.6), (-1.25, 7.6), (1.25, 7.6), (3.4, 6.6)]
    for x, h in poles:
        cyl("bamboo", True, (x, y_gate, 0), (x, y_gate, h), 0.13, segs=8)
    for z in (4.4, 5.7):
        cyl("bamboo", False, (-3.7, y_gate, z), (3.7, y_gate, z), 0.07, segs=6)
    for x0, x1 in ((-3.4, -1.25), (1.25, 3.4)):
        cyl("bamboo", False, (x0, y_gate, 4.4), (x1, y_gate, 5.7), 0.05, segs=6)
        cyl("bamboo", False, (x0, y_gate, 5.7), (x1, y_gate, 4.4), 0.05, segs=6)
    cols = ["cloth_red", "cloth_indigo", "cloth_white", "cloth_red", "cloth_indigo"]
    spans = [(-3.4, -1.25), (-1.25, 1.25), (1.25, 3.4)]
    for k, (x0, x1) in enumerate(spans):
        for row, (z, sag) in enumerate(((5.65, 0.55), (4.35, 0.45))):
            pts = [(x0 + (x1 - x0) * t / 10, y_gate - 0.12, z - sag * math.sin(math.pi * t / 10)) for t in range(11)]
            ribbon(cols[(k + row) % len(cols)], pts, 0.32)
    # wine flag
    cyl("bamboo", True, (2.6, y_gate + 1.5, 0), (2.6, y_gate + 1.5, 10.5), 0.07, segs=6)
    quad("cloth_red", False, (2.66, y_gate + 1.5, 10.2), (2.66, y_gate + 2.2, 10.2), (2.66, y_gate + 2.2, 7.6), (2.66, y_gate + 1.5, 7.6))
    quad("cloth_white", False, (2.66, y_gate + 2.2, 10.2), (2.66, y_gate + 2.45, 10.2), (2.66, y_gate + 2.45, 7.6), (2.66, y_gate + 2.2, 7.6))
    # two-storey wine house behind the frame
    y0, y1, x0, x1 = y_gate + 3.5, y_gate + 11, -6.5, 6.5
    box("timber", True, (0, (y0 + y1) / 2, 0.2), (x1 - x0, y1 - y0, 0.4))
    for x in (-6.3, -3.2, 0, 3.2, 6.3):
        cyl("timber", True, (x, y0, 0.4), (x, y0, 6.3), 0.15)
    box("interior", False, (0, y0 + 2.5, 1.8), (x1 - x0 - 0.6, 0.1, 2.8))
    box("timber", True, (0, y0, 3.25), (x1 - x0, 0.3, 0.3))
    box("timber", False, (0, y0 + 2.5, 3.4), (x1 - x0, 5.0, 0.15))
    # skirt roof between storeys
    quad("roof", False, (x0 - 0.6, y0 - 1.1, 3.1), (x1 + 0.6, y0 - 1.1, 3.1), (x1 + 0.6, y0 + 0.2, 3.65), (x0 - 0.6, y0 + 0.2, 3.65),
         uv=[(0, 1.3 / 1.4), (14 / 1.4, 1.3 / 1.4), (14 / 1.4, 0), (0, 0)])
    # upper gallery railing and upper walls
    box("timber", False, (0, y0 + 0.05, 4.5), (x1 - x0, 0.08, 0.1))
    for k in range(27):
        x = x0 + 0.25 + k * (x1 - x0 - 0.5) / 26
        box("timber", False, (x, y0 + 0.05, 4.1), (0.06, 0.06, 0.8))
    box("timber", False, (0, y0 + 1.2, 5.0), (x1 - x0 - 0.4, 0.12, 2.6))
    for x in (x0, x1):
        box("plaster", True, (x, (y0 + y1) / 2, 3.15), (0.2, y1 - y0, 6.3))
    box("plaster", True, (0, y1, 3.15), (x1 - x0, 0.2, 6.3))
    gable_roof_x(x0 - 1.0, x1 + 1.0, y0 - 1.3, (y0 + y1) / 2, y1 + 1.0, 6.1, 8.3)


def closing_house(y_front):
    """A single-storey house across the street behind the start, so looking back isn't open plain."""
    x0, x1, y0, y1 = -8.0, 8.0, y_front - 6.0, y_front
    box("timber", True, (0, (y0 + y1) / 2, 0.15), (x1 - x0, y1 - y0, 0.3))
    box("plaster", True, (0, y1 - 0.1, 1.6), (x1 - x0, 0.2, 3.2))
    for x in (-7.8, -4.2, -1.3, 1.3, 4.2, 7.8):
        cyl("timber", True, (x, y1 + 0.05, 0.3), (x, y1 + 0.05, 3.1), 0.12)
    box("timber", False, (0, y1 + 0.05, 2.95), (x1 - x0, 0.22, 0.26))
    box("interior", False, (0, y1 + 0.02, 1.25), (2.2, 0.05, 2.0))
    gable_roof_x(x0 - 0.6, x1 + 0.6, y1 + 1.0, (y0 + y1) / 2, y0 - 0.8, 3.0, 4.6)
    for k in range(6):
        jar(-3.2 + 0.7 * k, y1 + 0.7, 0.0, random.Random(k))


def ground():
    quad("earth", True, (-3.0, -26, 0), (3.0, -26, 0), (3.0, 70, 0), (-3.0, 70, 0),
         uv=[(-1, -26 / 3), (1, -26 / 3), (1, 70 / 3), (-1, 70 / 3)])
    for s in (-1, 1):
        box("paving", True, (s * 3.8, 22, 0.075), (1.6, 96, 0.15))
    quad("earth", True, (-60, -40, -0.02), (60, -40, -0.02), (60, 110, -0.02), (-60, 110, -0.02),
         uv=[(-20, -13), (20, -13), (20, 36), (-20, 36)])


# ---------------------------------------------------------------- build / export

def make_material(name):
    tex, tile, colour = MATERIALS[name]
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = 1.0
    if tex:
        img_node = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None) or nt.nodes.new("ShaderNodeTexImage")
        path = tex if "\\" in tex else TEX_DIR + "\\" + tex  # other builders register textures by full path
        img_node.image = bpy.data.images.load(path, check_existing=True)
        nt.links.new(img_node.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        c = colour.lstrip("#")
        rgb = [((int(c[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)]
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        mat.diffuse_color = (*rgb, 1)
    return mat


def box_uv(co, normal, tile):
    n = [abs(x) for x in normal]
    if n[2] >= n[0] and n[2] >= n[1]:
        return co.x / tile, co.y / tile
    if n[0] >= n[1]:
        return co.y / tile, co.z / tile
    return co.x / tile, co.z / tile


def build(scene, seed=7):
    global B
    B = Buckets()
    rng = random.Random(seed)
    ground()
    for side in (-1, 1):
        y = -16.0
        while y < 24:
            w = rng.uniform(4.0, 5.6)
            shop(side, y, y + w, rng, awning=rng.random() < 0.75)
            y += w
    # the willow itself is a painted card placed by the web page; only its trunk collider lives here
    cyl("hidden", True, (-3.75, 9.5, 0), (-3.6, 9.6, 2.5), 0.35, segs=8)
    closing_house(-17.0)
    entrance_and_winehouse(28.5)

    coll = bpy.data.collections.get("street_b1") or bpy.data.collections.new("street_b1")
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    for o in list(coll.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0 and ("__col" in me.name or "__nocol" in me.name):
            bpy.data.meshes.remove(me)

    stats = {}
    for (mat_name, collide), b in sorted(B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new(name)
        me.from_pydata([tuple(v) for v in b["v"]], [], b["f"])
        me.validate()
        tile = MATERIALS[mat_name][1]
        uvl = me.uv_layers.new(name="UVMap")
        for poly, explicit in zip(me.polygons, b["uv"]):
            for k, li in enumerate(poly.loop_indices):
                if explicit:
                    uvl.data[li].uv = explicit[k]
                else:
                    uvl.data[li].uv = box_uv(me.vertices[me.loops[li].vertex_index].co, poly.normal, tile)
        me.materials.append(make_material(mat_name))
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        stats[name] = sum(len(p.vertices) - 2 for p in me.polygons)

    cam = bpy.data.objects.get("ref_cam") or bpy.data.objects.new("ref_cam", bpy.data.cameras.new("ref_cam"))
    if cam.name not in coll.objects:
        coll.objects.link(cam)
    cam.location = (0.0, -1.0, 1.6)
    cam.rotation_euler = (math.radians(91.5), 0, 0)
    cam.data.sensor_fit = "VERTICAL"
    cam.data.angle = math.radians(46)
    cam.data.clip_end = 300
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 1536, 864
    return {"triangles": sum(stats.values()), "draw_calls": len(stats), "buckets": stats}


def export_collection(scene, coll_name, path):
    """Write collection `coll_name` of `scene` as a raw GLB. use_active_scene exports the active scene only, and the
    live .blend also holds other scenes (incl. third-party study files) that must never ship. In the GUI the window's
    scene is swapped for the call; headless (blender/build_web_scene.py, no window) the scene is made the context's
    scene with temp_override."""
    coll = bpy.data.collections[coll_name]
    for o in scene.objects:
        o.select_set(o.name in coll.objects)
    kw = dict(filepath=path, export_format="GLB", use_active_scene=True, use_selection=True, export_apply=True,
              export_cameras=False, export_yup=True, export_animations=False)
    win = bpy.context.window
    if win is None:
        with bpy.context.temp_override(scene=scene):
            bpy.ops.export_scene.gltf(**kw)
        return path
    prev = win.scene
    win.scene = scene
    try:
        bpy.ops.export_scene.gltf(**kw)
    finally:
        win.scene = prev
    return path


def export(scene, path):
    coll = bpy.data.collections["street_b1"]
    for o in scene.objects:
        o.select_set(o.name in coll.objects)
    # use_active_scene: the .blend also holds other scenes (incl. third-party study files) that must never ship
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_active_scene=True, use_selection=True,
                              export_apply=True, export_cameras=True, export_yup=True, export_animations=False)
