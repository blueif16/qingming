"""Headless review of the inner-city kit parts (blender/kit_inner_city.py): each part built the way
blender/inner_city_scene.py calls it, baked like inner_city_scene.build() bakes its buckets, triangle counts printed,
and a few views of each part rendered to PNG (EEVEE) beside a 1.7 m reference figure.

    scripts/blender_wsl.sh -b --factory-startup --python <this file> -- <out_dir> [tag] [part,part,...]

Writes <out_dir>/<tag>_<part>_<view>.png and prints "TRIS <part> <n>" and "REVIEW_TRIS {...}".
"""
import json
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BLENDER_DIR = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "blender"))
sys.path.insert(0, BLENDER_DIR)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else HERE
TAG = argv[1] if len(argv) > 1 else "review"
ONLY = set(argv[2].split(",")) if len(argv) > 2 and argv[2] else None

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import street_b1 as sb  # noqa: E402
import song_kit as k  # noqa: E402
import kit_inner_city as ki  # noqa: E402
import inner_city_scene as ics  # noqa: E402

V = Vector


def layout():
    L = json.load(open(ics.LAYOUT_JSON, encoding="utf-8"))
    ics.LAYOUT.clear()
    ics.LAYOUT.update(L)
    ics.derive(L)
    return L


# ---------------------------------------------------------------- the parts, called as the scene calls them

def part_cailou(rng):
    ics.cailou(rng)                       # the scene's own call (positions from layout.json)


def ctx_cailou(rng):
    with sb.entity("context"):
        ics.zhengdian(rng)                # the house behind it, for the context views only


def part_umbrella(rng):
    ki.umbrella(0.0, 0.0, 2.4, 1.31, rng, tilt=(0.0, 0.18))                              # umbrella_2368
    ki.umbrella(3.5 - 0.3, 0.0, 2.2, 1.18, rng, tilt=(0.0, 0.25), foot=(3.5, 0.0, 0.1))  # parasol_4312
    ki.umbrella(7.0, 0.0, 2.0, 1.36, rng, tilt=(0.0, 0.08), mat="reed")                  # umbrella_low_2978
    ki.umbrella(10.5, 0.0, 2.75, 1.05, rng, tilt=(0.0, 0.02), rise=0.08, mat="reed", pole=False)   # sunshade_3590


def part_gourd_lamp(rng):
    ki.gourd_lamp(0.0, 0.0, 0.0, h=1.25)
    ki.gourd_lamp(1.0, 0.3, 0.0, h=1.25)


def part_lamp_box(rng):
    ki.lamp_box(0.0, 0.0, 0.0, 0.7, 0.45, 1.08, "lampbox_zhengdian", legs=0.85)
    ki.lamp_box(1.3, 0.0, 0.0, 0.32, 0.28, 0.75, "lampbox_sun", legs=1.15)
    ki.lamp_box(2.4, -0.25, 0.0, 0.5, 0.38, 0.8, "lampbox_xiang", legs=0.3, flowers=True, rng=rng)


def part_square_well(rng):
    ics.well(rng)                         # the scene's own call


def part_tray_stand(rng):
    ki.tray_stand(0.0, 0.0, 0.0, 0.7, 0.5, 0.62, rng)
    ki.tray_stand(1.3, 0.0, 0.0, 0.85, 0.55, 0.6, rng)
    ki.tray_stand(3.0, 0.0, 0.0, 1.37, 0.8, 0.65, rng)
    with sb.entity("context"):
        ki.goods_heap(0.0, 0.0, 0.62 + 0.05, 0.7 * 0.8, 0.5 * 0.8, rng, n=9, mat="cloth_white", high=0.25, s=0.07)
        ki.goods_heap(3.0, 0.0, 0.65 + 0.05, 1.37 * 0.8, 0.8 * 0.8, rng, n=15, mat="cloth_white", high=0.05, s=0.07)


def part_round_basket(rng):
    ki.round_basket(0.0, 0.0, 0.0, 0.68, 0.8, rng, mouth=1.02)
    ki.round_basket(1.4, 0.0, 0.0, 0.16, 0.32, rng)
    ki.round_basket(2.3, 0.0, 0.0, 0.35, 0.6, rng, lid=True)
    ki.round_basket(3.3, 0.0, 0.45, 0.28, 0.32, rng, lid=True)


def part_slat_fence(rng):
    line = ics.E["S6.str.railing_4412"]["lines"]["line"]
    a, b = V((line[0][0], line[0][1], 0)), V((line[-1][0], line[-1][1], 0))
    d = b - a
    ki.slat_fence((0.0, 0.0), (d.x, d.y), 1.4, rng)


def part_signboard(rng):
    ki.signboard((-0.25, 0.0), (0.25, 0.0), 1.0, 1.0 + 2.1, "inn_wang", rng, posts=True, top="flat")
    ki.signboard((1.2, -0.18), (1.2, 0.18), 0.5, 0.5 + 2.5, "liu_incense", rng, posts=True, top="round")
    ki.signboard((2.0 - 0.15, 0.4), (2.0 + 0.15, 0.4), 0.3, 1.45, "stele_5129", rng, posts=True, top="pointed")
    ki.signboard((3.0 - 0.24, 0.0), (3.0 + 0.24, 0.0), 0.8, 2.85, "cloth_shop", rng, posts=False, top="flat", foot=0.75)
    ki.signboard((3.0 - 0.24, -0.02), (3.0 + 0.24, -0.02), 0.12, 0.72, "cloth_shop_box", rng, posts=False, top=None)
    ki.signboard((4.2, 0.0), (4.62, 0.0), 0.55, 0.55 + 2.05, "street", rng, posts=True, top="flat")


PARTS = {
    "cailou": part_cailou,
    "umbrella": part_umbrella,
    "gourd_lamp": part_gourd_lamp,
    "lamp_box": part_lamp_box,
    "square_well": part_square_well,
    "tray_stand": part_tray_stand,
    "round_basket": part_round_basket,
    "slat_fence": part_slat_fence,
    "signboard": part_signboard,
}
CONTEXT = {"cailou": ctx_cailou}


# ---------------------------------------------------------------- bake (as inner_city_scene.build does)

def bake(coll_name, owner_filter=None):
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new(coll_name + "__" + name)
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
        me.materials.append(sb.make_material(mat_name))
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(35))
        ob = bpy.data.objects.new(coll_name + "_" + name, me)
        coll.objects.link(ob)
    return coll


def bbox(coll):
    pts = []
    for ob in coll.objects:
        if ob.type == "MESH":
            pts += [ob.matrix_world @ v.co for v in ob.data.vertices]
    lo = V((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = V((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


# ---------------------------------------------------------------- stage

def stage():
    sc = bpy.context.scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = 960, 720
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "Standard"
    sc.render.image_settings.file_format = "PNG"
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.55, 0.68, 0.85, 1)
    bg.inputs[1].default_value = 0.9
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.2
    sun.data.angle = math.radians(3)
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
    sc.collection.objects.link(sun)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 35
    cam.data.clip_end = 400
    sc.collection.objects.link(cam)
    sc.camera = cam
    return sc, cam


def ground_and_figure(coll_name, lo, hi):
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)
    c = (lo + hi) / 2
    R = max(hi.x - lo.x, hi.y - lo.y) * 0.9 + 4
    me = bpy.data.meshes.new(coll_name + "_ground")
    me.from_pydata([(c.x - R, c.y - R, -0.002), (c.x + R, c.y - R, -0.002), (c.x + R, c.y + R, -0.002), (c.x - R, c.y + R, -0.002)],
                   [], [(0, 1, 2, 3)])
    m = bpy.data.materials.new(coll_name + "_ground")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.36, 0.28, 1)
    me.materials.append(m)
    coll.objects.link(bpy.data.objects.new(coll_name + "_ground", me))
    # a 1.7 m reference figure beside the part (front-left)
    fm = bpy.data.materials.new(coll_name + "_fig")
    fm.use_nodes = True
    fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.3, 0.55, 1)
    fx, fy = lo.x - 0.5, lo.y - 0.4
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=1.45, location=(fx, fy, 0.725), vertices=12)
    body = bpy.context.active_object
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(fx, fy, 1.58), segments=12, ring_count=8)
    head = bpy.context.active_object
    for o in (body, head):
        o.data.materials.append(fm)
        for cl in list(o.users_collection):
            cl.objects.unlink(o)
        coll.objects.link(o)
    return coll


def look(cam, eye, target):
    cam.location = eye
    cam.rotation_euler = (V(target) - V(eye)).to_track_quat("-Z", "Y").to_euler()


def views(lo, hi, part):
    """Camera spots round a part: front (from -y, the street side), three-quarter, eye level close, high."""
    c = (lo + hi) / 2
    size = max(hi.x - lo.x, hi.z - lo.z, (hi.y - lo.y))
    d = size * 1.25 + 1.2
    out = [("front", c + V((0, -d, 0.15 * size)), c),
           ("threequarter", c + V((d * 0.7, -d * 0.75, 0.35 * size + 0.5)), c),
           ("eye", V((c.x - 0.35 * (hi.x - lo.x), lo.y - max(2.2, 0.45 * size), 1.6)), V((c.x, c.y, max(1.4, c.z)))),
           ("high", c + V((-d * 0.55, -d * 0.55, d * 0.9)), c)]
    if part == "cailou":
        out = [("front", V((c.x, lo.y - 16, 3.5)), V((c.x, c.y, 5.0))),
               ("threequarter", V((hi.x + 4, lo.y - 10, 2.2)), V((c.x + 1, c.y, 5.0))),
               ("eye", V((c.x - 2.5, lo.y - 5.0, 1.6)), V((c.x - 1.5, c.y, 6.5))),
               ("spire", V((c.x + 1.0, lo.y - 4.0, 6.0)), V((c.x + 1.2, c.y, 7.6))),
               ("joint", V((lo.x + 4.0, lo.y - 3.0, 3.0)), V((lo.x + 2.5, c.y, 3.4))),
               ("lanterns", V((lo.x + 3.5, lo.y - 3.0, 2.2)), V((lo.x + 2.5, c.y, 2.6))),
               ("bunch", V((c.x + 0.3, lo.y - 1.6, 6.3)), V((c.x + 0.3, c.y, 5.9))),
               ("lantern_close", V((c.x - 0.6, lo.y - 1.8, 3.0)), V((c.x - 0.6, c.y, 3.4)))]
    if part == "umbrella":
        out.append(("under", V((c.x - 2.0, lo.y - 1.5, 1.2)), V((c.x - 3.0, c.y, 2.3))))
        out.append(("up", V((0.75, -0.55, 1.55)), V((0.0, 0.1, 2.45))))
    if part == "square_well":
        out.append(("down", c + V((0, -2.5, 3.2)), c))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    sc, cam = stage()
    L = layout()
    tris = {}
    colls = {}
    for name, fn in PARTS.items():
        if ONLY and name not in ONLY:
            continue
        sb.B = sb.Buckets(strict=True)
        rng = random.Random(6)
        with sb.entity("review"):
            fn(rng)
        tris[name] = sum(v for kk, v in sb.B.tris.items() if kk != "context")
        print(f"TRIS {name} {tris[name]}", {kk: v for kk, v in sb.B.tris.items()}, flush=True)
        colls[name] = bake("part_" + name)
        if name in CONTEXT:
            sb.B = sb.Buckets(strict=True)
            CONTEXT[name](random.Random(6))
            colls[name + "_ctx"] = bake("ctx_" + name)
    print("REVIEW_TRIS " + json.dumps(tris), flush=True)
    for name in tris:
        lo, hi = bbox(colls[name])
        colls[name + "_stage"] = ground_and_figure("stage_" + name, lo, hi)
        show = {"part_" + name, "stage_" + name, "ctx_" + name}
        for cl in bpy.context.scene.collection.children:
            cl.hide_render = cl.name not in show
        for view, eye, target in views(lo, hi, name):
            if name == "cailou" and view in ("front", "threequarter"):
                bpy.data.collections["ctx_cailou"].hide_render = view == "front"
            look(cam, eye, target)
            sc.render.filepath = os.path.join(OUT, f"{TAG}_{name}_{view}.png")
            bpy.ops.render.render(write_still=True)
        if "ctx_" + name in bpy.data.collections:
            bpy.data.collections["ctx_" + name].hide_render = True
    print("REVIEW_DONE", flush=True)


main()
