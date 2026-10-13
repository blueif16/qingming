"""Per-node geometry of a section's boats, for the contact checks (the details pass's boat crews,
gen/details/brief_contacts_rollout.md row fix-boats; blender/owners_dump.py does the same for the sections).

blender/build_boats.py calls write() after export_boats(), on the objects it has just baked and exported, so every
triangle here is one the boats GLB carries (Blender's loop triangles of the baked meshes, as the glTF exporter writes
them). Detail level 0 only: the crews stand by lod 0's nodes, and the page shows lod 0 within 32-36 m.

Frames: each node's triangles are in that node's own glTF frame (y up: Blender (x, y, z) -> (x, z, -y)), the frame the
page draws them in (boats.js batches each mesh into its holder's frame). A node's rest matrix is relative to its boat's
root; a root's rest matrix is its world matrix (page frame: x = X, y = H, z = -D). All matrices column-major, 16 floats,
as three.js Matrix4.elements. The page moves a root (bob, roll, its run) and the moving parts (sweep, oars, mast, ropes)
every frame: tools/people_dump.mjs writes their matrices at the dump instant and at frozen times, and
tools/lib/boat_world.mjs poses these triangles with them.

    gen/sections/<name>/boat_owners.bin    float32 triangles, 9 per triangle, node-local glTF frame
    gen/sections/<name>/boat_owners.json   {"section", "tris", "boats": {<map id>: {"rest": [16], "info": {...},
                                             "points": {...}, "world_points": [...], "nodes": {<node>: {"rest": [16],
                                             "tris": [[first_tri, count, "<mat>__col|nocol"]], "points": {...},
                                             "anim": {...}, "line": {"a", "b", "kind", "r"}?}}}}}
Owner names the checks use: "<map id>|<node>" (body, deck__col, roof__col, rim__col, board__edge, sweep, oar_p0 ...,
mast, line_<name>). Collider and edge nodes are hidden ("hidden__col" / "hidden__nocol"); every other node keeps its
song_kit material, visible ("<mat>__nocol").
"""
import array
import json
import math
import time

from mathutils import Matrix

# Blender (z up) -> glTF (y up): (x, y, z) -> (x, z, -y)
_C = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
_Ci = _C.inverted()


def _gl(m):
    """A Blender 4x4 matrix as the glTF exporter writes it (y up), column-major 16 floats."""
    g = _C @ m @ _Ci
    return [round(g[r][c], 6) for c in range(4) for r in range(4)]


def _plain(v):
    """ID properties (groups, arrays) as plain JSON values."""
    if hasattr(v, "to_dict"):
        v = v.to_dict()
    if hasattr(v, "to_list"):
        v = v.to_list()
    if isinstance(v, dict):
        return {k: _plain(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [_plain(x) for x in v]
    return v


def _matkey(node, mat):
    if node.endswith("__col"):
        return "hidden__col"
    if node.endswith("__edge"):
        return "hidden__nocol"
    return f"{mat}__nocol"


def write(coll, out_json, out_bin, section=None):
    """coll: the collection export_boats() baked (roots boat:<id> and boat:<id>@lod1, their holders and meshes)."""
    t0 = time.time()
    groups = {}          # (boat id, node, matkey) -> array (insertion order)
    boats = {}
    for root in sorted((o for o in coll.objects if o.name.startswith("boat:") and o.parent is None and "@lod1" not in o.name),
                       key=lambda o: o.name):
        bid = root.name[len("boat:"):]
        info = {k: _plain(root[k]) for k in ("kind", "pose", "motion", "lw", "loa", "beam", "deck_z", "roof_z") if k in root.keys()}
        b = boats[bid] = {"rest": _gl(root.matrix_basis), "info": info, "points": _plain(root.get("points", {}) or {}),
                          "world_points": _plain(root.get("world_points", []) or []), "nodes": {}}
        sfx = ":" + bid
        for h in sorted(root.children, key=lambda o: o.name):
            node = h.name[:-len(sfx)] if h.name.endswith(sfx) else h.name
            nd = b["nodes"][node] = {"rest": _gl(h.matrix_basis), "tris": [], "points": _plain(h.get("points") or {})}
            anim = {k: _plain(h[k]) for k in ("anim", "axis_gltf", "roll_axis_gltf", "amp_deg", "period_s", "angle_deg", "range_deg") if k in h.keys()}
            if anim:
                nd["anim"] = anim
            if "a" in h.keys() and "b" in h.keys():
                nd["line"] = {"a": str(h["a"]), "b": str(h["b"]), "collide": bool(h.get("collide", False))}
            for mo in h.children:
                if mo.type != "MESH":
                    continue
                me = mo.data
                me.calc_loop_triangles()
                ml = mo.matrix_basis       # identity under its holder (bake_boat)
                co = [ml @ v.co for v in me.vertices]
                mats = [m.name if m else "none" for m in me.materials]
                if "line" in nd:
                    # a unit line along local -Y (Blender): its kind by material, its radius from the mesh
                    m0 = mats[0] if mats else "rope"
                    nd["line"]["kind"] = {"deck": "plank", "bamboo": "ladder"}.get(m0.split(".")[0], "rope")
                    nd["line"]["r"] = round(max((math.hypot(v.x, v.z) for v in co), default=0.0), 4)
                for lt in me.loop_triangles:
                    mat = mats[lt.material_index] if lt.material_index < len(mats) else "none"
                    key = (bid, node, _matkey(node, mat.split(".")[0]))
                    arr = groups.get(key)
                    if arr is None:
                        arr = groups[key] = array.array("f")
                    for vi in lt.vertices:
                        p = co[vi]
                        arr.extend((p.x, p.z, -p.y))
    first = 0
    with open(out_bin, "wb") as f:
        for (bid, node, mk), arr in groups.items():
            n = len(arr) // 9
            boats[bid]["nodes"][node]["tris"].append([first, n, mk])
            arr.tofile(f)
            first += n
    out = {"about": "Written by blender/boat_owners.py (from blender/build_boats.py, after the export); never edit. "
                    "boat_owners.bin: float32 triangles in each node's glTF frame (y up), 9 per triangle; rest matrices "
                    "column-major (three.js Matrix4.elements), a root's in the page's world frame, a node's relative to "
                    "its root. Detail level 0 only.",
           "section": section, "date": time.strftime("%Y-%m-%d %H:%M:%S"), "tris": first, "boats": boats,
           "seconds": round(time.time() - t0, 2)}
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    return {"boat_owner_tris": first, "boats": len(boats)}
