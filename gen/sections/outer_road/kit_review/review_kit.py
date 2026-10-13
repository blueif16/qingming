"""Headless review of the outer-road kit (blender/kit_outer_road.py): every function built at a sample real size
(the painted sizes, px / 77 / 1.3, or a real-size choice where the painting is foreshortened), baked the way a scene
bakes its buckets, its triangles counted, and two views of it rendered (EEVEE) beside a 1.7 m reference figure. Some
parts get context pieces (a wall under the stake crest, the gate frame round a leaf, the forecourt and ditch banks
round the bridge, ...), built with the kit too but not counted.

    scripts/blender_wsl.sh -b --factory-startup --python <this file> -- <out_dir> [part,part,...]

Writes <out_dir>/<part>_a.png and <part>_b.png, <out_dir>/review_tris.json, and prints "TRIS <part> <n>".
Then: node gen/sections/outer_road/kit_review/sheet.mjs <out_dir> -> <part>.jpg (both views) and sheet.jpg.
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
ONLY = set(argv[1].split(",")) if len(argv) > 1 and argv[1] else None

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import street_b1 as sb  # noqa: E402
import song_kit as k  # noqa: E402
import kit_inner_city as ki  # noqa: E402
import kit_outer_road as ko  # noqa: E402

V = Vector


# ---------------------------------------------------------------- the parts at sample sizes

def p_earth_wall(rng):
    ko.earth_wall((0, 0), (3.3, 0), 0.0, 2.3, 0.5, rng)            # post_wall_w_11470: 3.3 m, ~0.5 m thick


def p_stake_crest(rng):
    ko.stake_crest((0.1, 0), (3.2, 0), 2.3, 0.32, rng)              # spikes ~30 px


def c_stake_crest(rng):
    ko.earth_wall((0, 0), (3.3, 0), 0.0, 2.3, 0.5, rng)


def p_gate_frame(rng):
    ko.gate_frame((0, 0), (2.0, 0), 2.25, rng)                      # doorway ~1.8-2.3 m


def p_studded_leaf(rng):
    ko.studded_leaf((0.1, 0), (1.0, 0), 0.12, 2.24, 58, rng, notice="notice")   # the open west leaf with the notice
    ko.studded_leaf((1.9, 0), (1.0, 0), 0.12, 2.24, 0, rng, outer=(0, -1))      # its pair, shut (for the review)


def c_studded_leaf(rng):
    ko.gate_frame((0, 0), (2.0, 0), 2.25, rng)


def p_planked_bank(rng):
    ko.planked_bank([(0, 0), (2.6, 0.12), (5.0, 0.0)], 0.65, 0.85, rng)        # faces south (right of an eastward line)


def c_planked_bank(rng):
    k.soft_box("rammed", False, (-0.2, 0.2, -0.3), (5.2, 2.2, 0.65), rng, r=0.05, wob=0.01, ease=0)


def p_humped_bridge(rng):
    ko.humped_bridge((0, 0, 0), (2.3, 0, 0), (2.6, 2.3, 0.6), (0.3, 2.3, 0.6), 0.25, rng)


def c_humped_bridge(rng):
    # the raised forecourt behind its planked bank either side of the bridge, the ditch bed in front
    k.soft_box("rammed", False, (-2.5, 2.05, -0.3), (5.2, 4.5, 0.6), rng, r=0.05, wob=0.01, ease=0)
    ko.planked_bank([(-2.5, 2.0), (0.2, 1.95)], 0.65, 0.85, rng)
    ko.planked_bank([(2.55, 1.98), (5.2, 2.02)], 0.65, 0.85, rng)
    sb.quad("rammed", False, (-2.5, 0.9, -0.2), (5.2, 0.9, -0.2), (5.2, 2.0, -0.2), (-2.5, 2.0, -0.2))


def p_spear(rng):
    ko.spear((0, 0, 0), (0.55, 0.05, 2.75), rng, tassel=0.6)       # spear_11541: ~280 px, tassel a third down
    ko.spear((0.9, 0, 0), (1.3, 0.05, 2.6), rng, tassel=0.78)      # spear_11342: a ring just below the head
    ko.spear((1.6, 0, 0), (1.85, 0.05, 2.7), rng, shaft_mat="redwood")   # the red-shafted one


def p_bamboo_banner(rng):
    ko.bamboo_banner((0, 0, 0), (0.3, 0.05, 3.7), rng, cloth_from=0.75, cloth_len=1.3, mat="bark")


def p_striped_banner(rng):
    ko.striped_banner((0, 0, 0), 3.6, (1, 0), rng, cloth_w=0.8, cloth_h=1.55)


def p_document_box(rng):
    ko.document_box(0, 0, 0, 0.88, 0.5, 0.45, 0, rng)              # document_box_11581: 88 x 45 px
    ko.document_box(1.0, 0.1, 0, 0.42, 0.32, 0.3, 15, rng)         # document_box_12041: 42 x 30 px


def p_slatted_box(rng):
    ko.slatted_box(0, 0, 0, 0.45, 0.35, 0.32, 0, rng, legs=0.18)              # slatted_box_11075 (on short legs)
    ko.slatted_box(0.8, 0, 0, 0.36, 0.32, 0.46, 0, rng)                       # slatted_stool_11302
    ko.slatted_box(1.6, 0.05, 0, 0.66, 0.45, 0.45, 0, rng, lid=False, slats="h")   # slatted_crate_12576


def p_thatch_roof(rng):
    ko.thatch_roof(0, 4.0, 0, 3.0, 2.2, 3.4, rng)
    ko.thatch_roof(5.0, 7.4, 0, 3.4, 2.0, 2.9, rng, along="y", hip=False)    # ridge along y, thatched gable ends


def p_thatch_shed(rng):
    ko.thatch_shed(0, 2.4, 0, 1.8, 2.15, 2.75, rng)


def p_thatch_hut(rng):
    ko.thatch_hut(0, 3.1, 0, 2.4, 1.9, 4.0, rng, door=(1.0, 1.85))


def p_bamboo_blind(rng):
    ko.bamboo_blind((0, 0), (1.6, 0), 0.9, 2.4, rng)
    ko.bamboo_blind((2.0, 0), (3.0, 0), 2.32, 2.4, rng)            # rolled up (tea house, 11540-11560)


def c_bamboo_blind(rng):
    k.beam("timber", False, (-0.2, 0, 2.5), (3.2, 0, 2.5), 0.16, 0.2, 0.02)


def p_arched_canopy(rng):
    ko.arched_canopy((0, 0), (0, 1.6), 1.5, 0.55, 0.7, rng)


def p_guardian_statue(rng):
    ko.guardian_statue(0, 0, 0.5, -90, 1.9, rng)


def c_guardian_statue(rng):
    k.soft_box("stone", False, (-1.0, -1.0, 0), (1.0, 0.8, 0.5), rng, r=0.04, wob=0.01)
    ki.slat_fence((-0.9, -0.85), (0.9, -0.85), 0.5 + 0.55, rng, slat=0.09)


def p_round_goods_stack(rng):
    ko.round_goods_stack(0, 0, 0, rng)


def p_hanging_gourds(rng):
    ko.hanging_gourds(0, 0, 2.0, 3, rng)


def c_hanging_gourds(rng):
    k.beam("bamboo", False, (-0.6, 0, 2.06), (0.6, 0, 2.06), 0.06, 0.06, 0.01)


def p_heaped_basket(rng):
    ko.heaped_basket(0, 0, 0, 0.55, 0.5, 0.7, rng)


def p_saddle_on_stand(rng):
    ko.saddle_on_stand(0, 0, 0, 0, rng)


def p_hanging_sign(rng):
    for x0, w, sign in ((0.0, 0.21, "jue"), (0.5, 0.27, "kanming"), (1.05, 0.26, "shenke")):
        ko.hanging_sign((x0, 0), (x0 + w, 0), 1.9, w / ko.cell_aspect(sign), sign, rng)


def c_hanging_sign(rng):
    k.beam("timber", False, (-0.3, 0, 2.12), (1.6, 0, 2.12), 0.1, 0.1, 0.02)


def p_hanging_fish(rng):
    ko.hanging_fish((0, 0, 3.0), (0, -1))


def c_hanging_fish(rng):
    for sx in (-1, 1):
        k.beam("redwood", False, (0, -0.05, 3.08), (sx * 1.8, -0.05, 2.2), 0.07, 0.3, 0.015)


def p_low_rail_fence(rng):
    ko.low_rail_fence([(0, 0), (1.6, 0), (2.7, 0.7)], 0.65, rng)


PARTS = {
    "earth_wall": p_earth_wall, "stake_crest": p_stake_crest, "gate_frame": p_gate_frame,
    "studded_leaf": p_studded_leaf, "planked_bank": p_planked_bank, "humped_bridge": p_humped_bridge,
    "spear": p_spear, "bamboo_banner": p_bamboo_banner, "striped_banner": p_striped_banner,
    "document_box": p_document_box, "slatted_box": p_slatted_box, "thatch_roof": p_thatch_roof,
    "thatch_shed": p_thatch_shed, "thatch_hut": p_thatch_hut, "bamboo_blind": p_bamboo_blind,
    "arched_canopy": p_arched_canopy, "guardian_statue": p_guardian_statue, "round_goods_stack": p_round_goods_stack,
    "hanging_gourds": p_hanging_gourds, "heaped_basket": p_heaped_basket, "saddle_on_stand": p_saddle_on_stand,
    "hanging_sign": p_hanging_sign, "hanging_fish": p_hanging_fish, "low_rail_fence": p_low_rail_fence,
}
CONTEXT = {
    "stake_crest": c_stake_crest, "studded_leaf": c_studded_leaf, "planked_bank": c_planked_bank,
    "humped_bridge": c_humped_bridge, "bamboo_blind": c_bamboo_blind, "guardian_statue": c_guardian_statue,
    "hanging_gourds": c_hanging_gourds, "hanging_sign": c_hanging_sign, "hanging_fish": c_hanging_fish,
}
# views: (eye offset from the part's centre in units of its size d, target offset); a = three-quarter from the
# south-west a little above, b = closer from the south-east nearer eye level
FRAME_PART = {"humped_bridge"}          # frame the views on the part itself, not its context
VIEWS = {
    "humped_bridge": [("a", (-0.75, -1.0, 0.55)), ("b", (0.3, -1.1, 0.1))],
    "guardian_statue": [("a", (-0.5, -1.3, 0.35)), ("b", (0.15, -1.0, 0.1))],
    "studded_leaf": [("a", (-0.55, -1.2, 0.2)), ("b", (0.6, -0.65, 0.1))],
}


# ---------------------------------------------------------------- bake (as a scene's build() bakes)

def bake(coll_name):
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)
    for (mat_name, collide), b in sorted(sb.B.data.items()):
        name = f"{mat_name}__{'col' if collide else 'nocol'}"
        me = bpy.data.meshes.new(coll_name + "__" + name)
        me.from_pydata([tuple(v) for v in b["v"]], [], b["f"])
        me.validate()
        if len(me.polygons) != len(b["f"]):        # a dropped face would shift the bucket's explicit UVs
            print(f"DROPPED {coll_name} {name}: {len(b['f']) - len(me.polygons)} faces", flush=True)
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
        ob.hide_render = mat_name.endswith("hidden")          # collider-only, as the page hides it
        coll.objects.link(ob)
    return coll


def bbox(coll):
    pts = []
    for ob in coll.objects:
        if ob.type == "MESH" and not ob.hide_render:
            pts += [ob.matrix_world @ v.co for v in ob.data.vertices]
    lo = V((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = V((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def stage():
    sc = bpy.context.scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    sc.render.engine = "BLENDER_EEVEE"
    sc.eevee.taa_render_samples = 24
    sc.render.resolution_x, sc.render.resolution_y = 900, 700
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
    zg = -0.002
    me.from_pydata([(c.x - R, c.y - R, zg), (c.x + R, c.y - R, zg), (c.x + R, c.y + R, zg), (c.x - R, c.y + R, zg)], [], [(0, 1, 2, 3)])
    m = bpy.data.materials.new(coll_name + "_ground")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.36, 0.28, 1)
    me.materials.append(m)
    coll.objects.link(bpy.data.objects.new(coll_name + "_ground", me))
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


def main():
    os.makedirs(OUT, exist_ok=True)
    sc, cam = stage()
    tris, colls = {}, {}
    for name, fn in PARTS.items():
        if ONLY and name not in ONLY:
            continue
        sb.B = sb.Buckets(strict=True)
        rng = random.Random(4)
        with sb.entity("review"):
            fn(rng)
        tris[name] = sb.B.tris.get("review", 0)
        hidden = sum(len(f) - 2 for (m, _), b in sb.B.data.items() if m.endswith("hidden") for f in b["f"])
        print(f"TRIS {name} {tris[name]} (collider {hidden})", flush=True)
        colls[name] = bake("part_" + name)
        if name in CONTEXT:
            sb.B = sb.Buckets(strict=True)
            with sb.entity("context"):
                CONTEXT[name](random.Random(4))
            colls[name + "_ctx"] = bake("ctx_" + name)
    with open(os.path.join(OUT, "review_tris.json"), "w") as f:
        json.dump(tris, f, indent=1)
    print("REVIEW_TRIS " + json.dumps(tris), flush=True)
    for name in tris:
        lo, hi = bbox(colls[name])
        if name + "_ctx" in colls and name not in FRAME_PART:
            lo2, hi2 = bbox(colls[name + "_ctx"])
            lo = V((min(lo.x, lo2.x), min(lo.y, lo2.y), min(lo.z, lo2.z)))
            hi = V((max(hi.x, hi2.x), max(hi.y, hi2.y), max(hi.z, hi2.z)))
        ground_and_figure("stage_" + name, lo, hi)
        show = {"part_" + name, "stage_" + name, "ctx_" + name}
        for cl in sc.collection.children:
            cl.hide_render = cl.name not in show
        c = (lo + hi) / 2
        size = max(hi.x - lo.x, hi.z - lo.z, hi.y - lo.y, 0.6)
        d = size * 1.15 + 1.0
        for view, (ex, ey, ez) in VIEWS.get(name, [("a", (-0.75, -1.15, 0.45)), ("b", (0.7, -0.95, 0.12))]):
            eye = c + V((ex * d, ey * d, ez * d))
            eye.z = max(eye.z, 0.6)
            look(cam, eye, c)
            sc.render.filepath = os.path.join(OUT, f"{name}_{view}.png")
            bpy.ops.render.render(write_still=True)
    print("REVIEW_DONE", flush=True)


main()
