"""Build the inner-city scene with the ORIGINAL kit (kit_review/before_kit/kit_inner_city.py) for a fair before/after
triangle comparison; writes kit_review/placed_before_kit.json instead of sections/inner_city/placed.json, no GLB."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "blender")))
sys.path.insert(0, os.path.join(HERE, "before_kit"))          # the original kit wins over blender/kit_inner_city.py
import bpy  # noqa: E402,F401
import kit_inner_city  # noqa: E402
import inner_city_scene as ics  # noqa: E402

assert "before_kit" in kit_inner_city.__file__, kit_inner_city.__file__
ics.PLACED_JSON = os.path.join(HERE, "placed_before_kit.json")
stats = ics.build(bpy.context.scene)
print("BEFORE_KIT_STATS " + json.dumps({k: v for k, v in stats.items() if k != "buckets"}), flush=True)
