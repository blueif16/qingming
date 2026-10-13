"""Gate section placement test: stand-in figures at the ground positions read off the scroll.

Reads gen/sections/gate/figures_world.json (written by `tools/scroll_pipeline.mjs gate figures`) and builds, in
`scene`, a true-scale gray-box of the gate section (ground, moat, the flat bridge with railings, a rough wall,
gate tower and tax office) with one stand-in per figure. Everything hangs under the empty "gf_oblique".
set_oblique(scene, True) gives every child the section's oblique projection as a shear, so the orthographic
camera "gf_cam_oblique" renders the scene in the scroll's own view, pixel for pixel on the section's scan
rect. set_oblique(scene, False) restores the true-scale world for eye-level views.

Live GUI: importlib.reload(gate_figures_test); gate_figures_test.build(bpy.data.scenes["gate_figures"])
Units are metres. X runs along the street (out of the city = +X), Y is depth (north, away from the scroll's
viewer), Z is up. Only the bridge is measured; the wall, tower and office are rough guesses for context.
"""
import json
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

QM = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming"
WORLD_JSON = QM + r"\gen\sections\gate\figures_world.json"
OUT_DIR = QM + r"\gen\sections\gate\test3d"
SECTION_RECT = (5600, 0, 3712, 1792)  # sections/gate/section.json rect
COLL = "gate_figures"

C = {
    "earth": (0.80, 0.70, 0.52), "mud": (0.45, 0.40, 0.32), "water": (0.55, 0.66, 0.68),
    "timber": (0.55, 0.40, 0.27), "wall": (0.70, 0.68, 0.64), "roof": (0.42, 0.45, 0.50),
    "dark": (0.18, 0.14, 0.12), "plaster": (0.88, 0.84, 0.76),
}
FIG_COLORS = [(0.86, 0.20, 0.25), (0.20, 0.55, 0.85), (0.95, 0.65, 0.10), (0.55, 0.30, 0.80),
              (0.15, 0.70, 0.45), (0.90, 0.40, 0.70)]


# ---------------------------------------------------------------- primitives

def _obj(name, bm, coll, color, parent):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ob.color = (*color, 1.0)
    ob.parent = parent
    return ob


def box(name, coll, lo, hi, color, parent):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    lo, hi = Vector(lo), Vector(hi)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((lo + hi) / 2) @ Matrix.Diagonal((*(hi - lo), 1.0)), verts=bm.verts)
    return _obj(name, bm, coll, color, parent)


def _along(bm, p0, p1):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((1, 1, d.length, 1)), verts=bm.verts)


def rod(name, coll, p0, p1, r0, color, parent, r1=None, segs=10):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r0, radius2=r0 if r1 is None else r1, depth=1.0)
    _along(bm, p0, p1)
    return _obj(name, bm, coll, color, parent)


def ball(name, coll, c, r, color, parent):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=r)
    bmesh.ops.translate(bm, vec=Vector(c), verts=bm.verts)
    return _obj(name, bm, coll, color, parent)


def label(name, coll, text, loc, parent, size=0.55):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = text
    cu.size = size
    cu.align_x = "CENTER"
    ob = bpy.data.objects.new(name, cu)
    coll.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (math.radians(55), 0, 0)
    ob.color = (0.05, 0.05, 0.05, 1)
    ob.parent = parent
    return ob


# ---------------------------------------------------------------- content

def structures(coll, par):
    box("gf_ground_city", coll, (-46, -12, -0.3), (0, 34, 0), C["earth"], par)
    box("gf_ground_out", coll, (14, -12, -0.3), (28, 34, 0), C["earth"], par)
    box("gf_moat_bed", coll, (0, -12, -2.6), (14, 34, -2.3), C["mud"], par)
    box("gf_water", coll, (0, -12, -1.95), (14, 34, -1.9), C["water"], par)
    # the flat moat bridge: the one measured structure (8 m wide, 14 m long, near-left corner at the origin)
    box("gf_bridge_deck", coll, (0, 0, -0.35), (14, 8, 0), C["timber"], par)
    for i, y in enumerate((0.1, 7.9)):
        box(f"gf_rail_{i}", coll, (0, y - 0.05, 0.95), (14, y + 0.05, 1.05), C["timber"], par)
        for k in range(9):
            x = k * 1.75
            box(f"gf_post_{i}_{k}", coll, (x - 0.06, y - 0.06, 0), (x + 0.06, y + 0.06, 1.05), C["timber"], par)
    for k, x in enumerate((3.5, 7.0, 10.5)):
        box(f"gf_pier_{k}", coll, (x - 0.15, 0, -2.3), (x + 0.15, 8, -0.35), C["timber"], par)
    # city wall running north-south, 12 m thick, with the gate passage at y 5.5-8 (rough)
    box("gf_wall_s", coll, (-25, -12, 0), (-13, 5.5, 8), C["wall"], par)
    box("gf_wall_n", coll, (-25, 8, 0), (-13, 34, 8), C["wall"], par)
    box("gf_lintel", coll, (-25, 5.5, 5.2), (-13, 8, 8), C["wall"], par)
    # gate tower: floor at 10 m (assumed, as in figures.json); its front wall sits just behind the watchman,
    # who stands in the painted doorway
    box("gf_tower_base", coll, (-24, 3, 8), (-14, 13, 10), C["wall"], par)
    box("gf_tower_body", coll, (-23, 4.8, 10), (-15, 11.8, 14), C["plaster"], par)
    box("gf_tower_door", coll, (-20.9, 4.72, 10), (-19.3, 4.8, 12.3), C["dark"], par)
    box("gf_tower_roof", coll, (-24.5, 3.5, 14), (-13.5, 13.1, 14.6), C["roof"], par)
    box("gf_tower_ridge", coll, (-21.5, 7.7, 14.6), (-16.5, 8.9, 15.8), C["roof"], par)
    # tax office: three-bay open hall on the north side of the street (rough)
    box("gf_office_floor", coll, (-36.8, 11, 0), (-28.4, 15.5, 0.15), C["timber"], par)
    box("gf_office_back", coll, (-36.8, 15.3, 0), (-28.4, 15.5, 3.2), C["plaster"], par)
    for k, x in enumerate((-36.6, -33.8, -31.0, -28.6)):
        box(f"gf_office_post_{k}", coll, (x - 0.12, 10.98, 0), (x + 0.12, 11.22, 3.2), C["timber"], par)
    box("gf_office_roof", coll, (-37.5, 10.3, 3.2), (-27.8, 16.2, 3.5), C["roof"], par)
    box("gf_office_desk", coll, (-32.7, 11.85, 0), (-31.3, 12.3, 0.78), C["timber"], par)


def figure(fig, coll, par, color):
    """A stand-in at true scale (1.65 m standing), front = local +X, origin at the feet."""
    n = "gf_" + fig["id"]
    root = bpy.data.objects.new(n, None)
    coll.objects.link(root)
    root.parent = par
    root.location = (fig["X"], fig["D"], fig["H"])
    root.rotation_euler = (0, 0, math.radians(fig["facing_deg"]))
    pose = fig["pose"]
    if pose == "seated":
        box(n + "_stool", coll, (-0.45, -0.2, 0), (-0.05, 0.2, 0.45), C["timber"], root)
        rod(n + "_legs", coll, (-0.2, 0, 0.5), (0.2, 0, 0.5), 0.1, color, root)
        rod(n + "_shins", coll, (0.2, 0, 0.5), (0.22, 0, 0.0), 0.08, color, root)
        rod(n + "_body", coll, (-0.25, 0, 0.45), (-0.2, 0, 1.17), 0.18, color, root, r1=0.14)
        head = Vector((-0.18, 0, 1.3))
    elif pose == "leaning":
        rod(n + "_legs", coll, (0, 0, 0), (0, 0, 0.95), 0.13, color, root)
        rod(n + "_body", coll, (0, 0, 0.95), (0.42, 0, 1.3), 0.18, color, root, r1=0.14)
        head = Vector((0.55, 0, 1.38))
    else:
        rod(n + "_body", coll, (0, 0, 0), (0, 0, 1.42), 0.18, color, root, r1=0.14)
        head = Vector((0, 0, 1.54))
    ball(n + "_head", coll, head, 0.11, color, root)
    rod(n + "_nose", coll, head + Vector((0.08, 0, 0)), head + Vector((0.26, 0, 0)), 0.045, C["dark"], root, r1=0.0)
    rod(n + "_arrow", coll, (0.2, 0, 0.03), (0.75, 0, 0.03), 0.06, C["dark"], root, r1=0.0)
    if fig["id"] == "bridge_porter":  # shoulder pole with a basket at each end, along the walking direction
        rod(n + "_pole", coll, (-0.95, 0, 1.4), (0.95, 0, 1.4), 0.025, C["timber"], root)
        for s in (-1, 1):
            rod(f"{n}_basket_{s}", coll, (0.85 * s, 0, 0.3), (0.85 * s, 0, 0.72), 0.24, C["timber"], root, r1=0.28)
    label(n + "_label", coll, fig["id"], (fig["X"], fig["D"], fig["H"] + 2.3), par)
    return root


# ---------------------------------------------------------------- projection

def _proj(world):
    p = world["projection"]
    kx, kh, (cu, cv) = p["px_per_m_x"], p["px_per_m_height"], p["depth_px_per_m"]
    phi = math.atan2(-cv, kh)  # elevation of the orthographic camera
    s_o = kh / math.cos(phi)  # px per metre on its image plane
    shear = Matrix(((kx / s_o, cu / s_o, 0, 0), (0, 1, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))
    return p, phi, s_o, shear


def set_oblique(scene, on):
    _, _, _, shear = _proj(json.load(open(WORLD_JSON, encoding="utf-8")))
    for ob in scene.collection.children[COLL].objects:
        if ob.parent and ob.parent.name == "gf_oblique":
            ob.matrix_parent_inverse = shear if on else Matrix.Identity(4)


def cameras(coll, world):
    p, phi, s_o, _ = _proj(world)
    sx, sy, w, h = SECTION_RECT
    uc, vc = sx + w / 2, sy + h / 2
    d_c = (vc - p["origin_v"]) / p["depth_px_per_m"][1]
    x_c = (uc - p["origin_u"]) / s_o
    fwd = Vector((0, math.cos(phi), -math.sin(phi)))
    cam = bpy.data.cameras.new("gf_cam_oblique")
    cam.type = "ORTHO"
    cam.ortho_scale = w / s_o
    cam.clip_end = 400
    ob = bpy.data.objects.new("gf_cam_oblique", cam)
    coll.objects.link(ob)
    ob.location = Vector((x_c, d_c, 0)) - 100 * fwd
    ob.rotation_euler = (math.pi / 2 - phi, 0, 0)
    # eye-level views (true-scale world): on the bridge looking into the city, and inside looking out
    for name, loc, yaw in (("gf_cam_bridge", (11.0, 3.2, 1.6), 90), ("gf_cam_inside", (-44.0, 5.5, 1.6), -90),
                           ("gf_cam_plan", (-14.0, 9.0, 120.0), None)):
        cd = bpy.data.cameras.new(name)
        o = bpy.data.objects.new(name, cd)
        coll.objects.link(o)
        o.location = loc
        if yaw is None:
            cd.type = "ORTHO"
            cd.ortho_scale = 66
            cd.clip_end = 400
        else:
            cd.lens = 24
            o.rotation_euler = (math.radians(88), 0, math.radians(yaw))


# ---------------------------------------------------------------- build / render

def build(scene):
    world = json.load(open(WORLD_JSON, encoding="utf-8"))
    coll = bpy.data.collections.get(COLL)
    if coll:
        for ob in list(coll.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
    else:
        coll = bpy.data.collections.new(COLL)
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    par = bpy.data.objects.new("gf_oblique", None)
    coll.objects.link(par)
    structures(coll, par)
    for i, fig in enumerate(world["figures"]):
        figure(fig, coll, par, FIG_COLORS[i % len(FIG_COLORS)])
    cameras(coll, world)
    if scene.world is None:
        scene.world = bpy.data.worlds.new("gf_world")
    scene.world.color = (0.86, 0.80, 0.68)  # silk-coloured sky for the eye-level views
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "OBJECT"
    scene.display.shading.show_object_outline = True
    scene.display.shading.show_shadows = True
    set_oblique(scene, True)
    return {"objects": len(coll.objects), "figures": [f["id"] for f in world["figures"]]}


def render(scene, cam_name, filename, oblique, transparent=False, size=None):
    """Render through `cam_name` to OUT_DIR. Swaps window.scene for the call (rendering a scene that is not
    the window's scene ignores its state)."""
    win = bpy.context.window
    prev = win.scene
    win.scene = scene
    try:
        set_oblique(scene, oblique)
        for ob in scene.collection.children[COLL].objects:  # labels face the oblique camera only
            if ob.name.endswith("_label"):
                ob.hide_render = not oblique
        scene.camera = bpy.data.objects[cam_name]
        r = scene.render
        r.resolution_x, r.resolution_y = size or ((SECTION_RECT[2], SECTION_RECT[3]) if oblique else (1920, 1080))
        r.resolution_percentage = 100
        r.film_transparent = transparent
        r.image_settings.file_format = "PNG"
        r.image_settings.color_mode = "RGBA" if transparent else "RGB"
        r.filepath = OUT_DIR + "\\" + filename
        bpy.ops.render.render(write_still=True)
    finally:
        set_oblique(scene, True)
        win.scene = prev
    return r.filepath
