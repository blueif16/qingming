"""Render the composed inner-city scene (inner_city_scene.build, the current kit) at eye height around the refined
parts. Writes <out_dir>/<tag>_scene_<view>.png; placed.json is redirected into kit_review (the real one untouched).

    scripts/blender_wsl.sh -b --factory-startup --python <this file> -- <out_dir> [tag]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "blender")))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else HERE
TAG = argv[1] if len(argv) > 1 else "scene"

import bpy  # noqa: E402
from mathutils import Vector as V  # noqa: E402

import inner_city_scene as ics  # noqa: E402

ics.PLACED_JSON = os.path.join(HERE, "placed_scene_views.json")
sc = bpy.context.scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
ics.build(sc)
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 1280, 800
sc.view_settings.view_transform = "Standard"
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.68, 0.85, 1)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.2
sun.rotation_euler = (math.radians(45), math.radians(8), math.radians(-30))
sc.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = 24
cam.data.clip_end = 300
sc.collection.objects.link(cam)
sc.camera = cam


def centre(eid):
    e = ics.E[eid]
    if "pos" in e:
        return V((e["pos"][0], e["pos"][1], 0))
    f = e["footprint"]
    return V((sum(p[0] for p in f) / len(f), sum(p[1] for p in f) / len(f), 0))


c = centre("S6.str.cailou_huanmen_4430")
lamp = centre("S6.prop.gardenia_lamp_4422")
umb = centre("S6.prop.umbrella_2460")
well = centre("S6.str.square_well_2000")
views = [("cailou", c + V((-2.0, -9.5, 1.6)), c + V((0.0, 0.0, 4.8))),
         ("door", lamp + V((1.8, -4.2, 1.6)), lamp + V((1.6, 0.0, 1.3))),
         ("stall", umb + V((2.5, -5.5, 1.6)), umb + V((0.0, 0.0, 1.6))),
         ("well", well + V((2.5, -4.5, 1.7)), well + V((0.0, 0.0, 0.3)))]
for name, eye, target in views:
    cam.location = eye
    cam.rotation_euler = (target - eye).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = os.path.join(OUT, f"{TAG}_scene_{name}.png")
    bpy.ops.render.render(write_still=True)
print("SCENE_VIEWS_DONE", flush=True)
