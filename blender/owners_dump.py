"""Per-owner geometry of a built section, for the contact checks (gen/details/brief_contacts.md).

After a scene builder's build() (blender/build_web_scene.py calls write()), every triangle of the meshes the builder
baked into its collection is written with its owner: the map ID that added it (street_b1.Buckets records one per face,
parallel to the bucket's faces), "edge:<side>" for an invisible edge wall, "ground" for the g_ground* meshes, "water"
for the water strips, else "mesh:<object>". Coordinates are world metres in the map frame: X east, D north (Blender y),
H up (Blender z); the page draws x = X, y = H, z = -D.

    gen/sections/<name>/owners.bin    float32 triangles, 9 per triangle (X, D, H of a, b, c), sorted by
                                      (owner, material, collide)
    gen/sections/<name>/owners.json   {"section", "tris", "materials": {"<mat>__col|nocol": tris},
                                       "owners": {owner: [[first_tri, count, "<mat>__col|nocol"], ...]}, "warnings"}

Triangles are Blender's loop triangles of the baked meshes (what the glTF exporter writes), so the per-material counts
compare one to one with the shipped GLB (tools/owners_verify.mjs). A bucket face whose polygon validate() dropped is
skipped, and noted.
"""
import array
import json
import os
import time

import street_b1 as sb


def _owner_of_object(name):
    if name.startswith("g_ground"):
        return "ground"
    if "water" in name:
        return "water"
    return "mesh:" + name


def _poly_owners(me, b):
    """The owner of each polygon of a mesh baked from bucket b: polygons and bucket faces in the same order, a face
    validate() dropped is skipped (its polygon's vertices are a subset of the face's)."""
    faces, owners = b["f"], b.get("o") or []
    out, j, dropped = [], 0, 0
    for poly in me.polygons:
        pv = set(poly.vertices)
        while j < len(faces) and not pv.issubset(faces[j]):
            j += 1
            dropped += 1
        out.append(owners[j] if j < len(owners) else None)
        j += 1
    dropped += max(0, len(faces) - j)
    return out, dropped


def write(scene, coll_name, out_json, out_bin):
    t0 = time.time()
    coll = bpy_collection(coll_name)
    by_key = {}
    for (mat, collide), b in sb.B.data.items():
        if mat == "__mark__":
            continue
        by_key[f"g_{mat}__{'col' if collide else 'nocol'}"] = b
    groups = {}   # (owner, matkey) -> array of floats
    warnings = []
    materials = {}
    for ob in sorted(coll.objects, key=lambda o: o.name):
        if ob.type != "MESH":
            continue
        me = ob.data
        me.calc_loop_triangles()
        mw = ob.matrix_world
        matkey = ob.name[2:] if ob.name.startswith("g_") else ob.name
        b = by_key.get(ob.name)
        if b is not None:
            powner, dropped = _poly_owners(me, b)
            if dropped:
                warnings.append(f"{ob.name}: {dropped} bucket faces dropped by validate()")
            if len(b.get("o") or []) != len(b["f"]):
                warnings.append(f"{ob.name}: {len(b.get('o') or [])} owners for {len(b['f'])} faces")
        else:
            powner = None
            fixed = _owner_of_object(ob.name)
        co = [mw @ v.co for v in me.vertices]
        materials[matkey] = materials.get(matkey, 0) + len(me.loop_triangles)
        for lt in me.loop_triangles:
            owner = (powner[lt.polygon_index] if powner is not None else fixed) or "?"
            arr = groups.setdefault((owner, matkey), array.array("f"))
            for vi in lt.vertices:
                p = co[vi]
                arr.extend((p.x, p.y, p.z))
    index, first = {}, 0
    with open(out_bin, "wb") as f:
        for (owner, matkey) in sorted(groups):
            arr = groups[(owner, matkey)]
            n = len(arr) // 9
            index.setdefault(owner, []).append([first, n, matkey])
            arr.tofile(f)
            first += n
    out = {"about": "Written by blender/owners_dump.py after the builder's build(); never edit. owners.bin: float32 "
                    "triangles (X, D, H) x 3, in the map frame; owners: owner -> [[first_tri, count, material]].",
           "section": coll_name, "date": time.strftime("%Y-%m-%d %H:%M:%S"), "tris": first,
           "materials": dict(sorted(materials.items())), "owners": dict(sorted(index.items())),
           "warnings": warnings, "seconds": round(time.time() - t0, 1)}
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    return {"owners_tris": first, "owners": len(index), "owners_warnings": len(warnings)}


def bpy_collection(name):
    import bpy
    return bpy.data.collections[name]
