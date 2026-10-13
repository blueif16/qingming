"""Headless build of a walkable web scene, so several workers can build at once without the live GUI.

    scripts/blender_wsl.sh -b --factory-startup --python qingming/blender/build_web_scene.py -- <module> <out_dir>
    (or: qingming/tools/build_scene.sh <name>, which fills these in)

Imports blender/<module>.py (a scene builder such as gate_scene: derive() from layout.json, every piece inside
sb.entity(<map id>)), builds it into a scene of its own named after the module's COLL, exports
<out_dir>/<COLL minus "_scene">_raw.glb with the module's export(), and prints the build stats as one JSON line
(BUILD_STATS {...}). The builder itself writes sections/<name>/placed.json. Paths in the builders are UNC paths, so
the Windows Blender reads the same files as the live session.
"""
import importlib
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(argv) < 2:
    raise SystemExit("usage: ... --python build_web_scene.py -- <module> <out_dir>")
module, out_dir = argv[0], argv[1]

import bpy  # noqa: E402

t0 = time.time()
mod = importlib.import_module(module)
name = mod.COLL[:-len("_scene")] if mod.COLL.endswith("_scene") else mod.COLL
scene = bpy.context.scene  # the factory scene, renamed: headless has no window to swap
scene.name = mod.COLL
stats = mod.build(scene)
# every triangle with its owner (map ID, edge:*, ground) for the contact checks: gen/sections/<name>/owners.{json,bin}
try:
    import owners_dump
    gen = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gen", "sections", name)
    os.makedirs(gen, exist_ok=True)
    stats.update(owners_dump.write(scene, mod.COLL, os.path.join(gen, "owners.json"), os.path.join(gen, "owners.bin")))
except Exception as e:  # never fail a build over the check data
    print(f"OWNERS failed: {e!r}", flush=True)
os.makedirs(out_dir, exist_ok=True)
path = mod.export(scene, os.path.join(out_dir, f"{name}_raw.glb"))
stats = {k: v for k, v in (stats or {}).items() if k != "buckets"}
stats.update(glb=path, seconds=round(time.time() - t0, 1))
print("BUILD_STATS " + json.dumps(stats), flush=True)
