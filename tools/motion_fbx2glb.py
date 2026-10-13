"""Convert a Meshy Text to Motion result (FBX on Meshy's SMPL-H skeleton) to a GLB holding just that skeleton and the
clip, so tools/retarget_local.mjs can carry it onto any of our characters without a paid Meshy retarget (and so
across Meshy accounts).

  scripts/blender_wsl.sh -b --factory-startup --python qingming/tools/motion_fbx2glb.py -- <motion.fbx> <out.glb>
"""
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30
bpy.ops.import_scene.fbx(filepath=argv[0], automatic_bone_orientation=False)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
act = arm.animation_data.action
f0, f1 = (int(x) for x in act.frame_range)
bpy.context.scene.frame_start, bpy.context.scene.frame_end = f0, f1
# keep the skeleton and one skinned mesh (the exporter needs a skin to write the joints)
keep = {arm}
for o in bpy.data.objects:
    if o.type == "MESH" and any(m.type == "ARMATURE" for m in o.modifiers) and len(keep) < 2:
        keep.add(o)
for o in list(bpy.data.objects):
    if o not in keep and o.type != "EMPTY":
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=argv[1], export_format="GLB", export_animations=True, export_force_sampling=True,
                          export_frame_range=True, export_skins=True, export_morph=False, export_materials="NONE")
print("MOTION_GLB", argv[1], f0, f1)
