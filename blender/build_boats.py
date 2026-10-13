"""Headless build of a section's boats GLB for the page (map/BUILDING.md "Boats and water"; the skill web-scene).

    tools/blender_slot.sh -b --factory-startup --python <abs>/qingming/blender/build_boats.py -- <src_dir> <raw.glb>
    (tools/export_web_scene.mjs runs it when the section's layout lists boats and the raw GLB is missing or stale)

src_dir holds the section's layout.json (every vehicle whose slug starts `boat_`, at its painted waterline:
`pts.front`, `pts.rear`, `pose`, `what`) and build_choices.json, whose optional `boats` block gives the kit what
the map can't (each with its reason):

    "boats": {
      "S4b.veh.boat_mat_cargo_14900": {
        "kit": { "kind": "grain", "hold": "laden", "lw": 15.0, "sweep": "starboard", "oars": 3, "mast": "up",
                 "tow_to": "tracker_lead_22000", "gangplank": [X, D, H] | "<map id>", "moor": ["<map id>", ...],
                 "cargo": [...], "cabin": {...}, "stern_house": true },
        "why": "rafted between ... at real size it overlaps its neighbour: shortened to 15 m (choice)"
      }
    }

Kit option values that name things resolve from the layout: a figure slug or figure map ID -> its foot at (X, D)
and H + 1.25 m (a tracker's shoulder: the tow line's far end); a prop or structure map ID -> its position at H + 0.8
(a mooring post's head) or, for `gangplank`, at its own H (the plank's foot on the bank). Everything else goes to
kit_boats.boat_from_layout as it is (see boat_nodes for the options).

Writes <raw.glb> with every boat twice, `boat:<map id>` (lod 0) and `boat:<map id>@lod1` (the page switches by
distance), and <raw minus _raw.glb>.json beside it: per boat its kind, pose, motion, sizes, deck_z / roof_z (above
the water), heading, triangles per detail level, the kit options used and the kit's note (mapped length against real
size). Prints BOATS_STATS {...}.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(argv) < 2:
    raise SystemExit("usage: ... --python build_boats.py -- <src_dir> <raw.glb>")
src, raw = argv[0], argv[1]

import bpy  # noqa: E402
import kit_boats as kb  # noqa: E402

t0 = time.time()
layout = json.load(open(os.path.join(src, "layout.json"), encoding="utf-8"))
cpath = os.path.join(src, "build_choices.json")
choices = json.load(open(cpath, encoding="utf-8")) if os.path.exists(cpath) else {}
kit_for = {k: (v or {}).get("kit", {}) for k, v in (choices.get("boats") or {}).items()}
unbuilt = set((choices.get("unbuilt") or {}).keys())
ents = layout.get("entities", {})
figs = {f["id"]: f for f in layout.get("figures", [])}
figs.update({f["map_id"]: f for f in layout.get("figures", [])})


def is_boat(mid, e):
    return e.get("kind") == "vehicle" and mid.split(".")[-1].startswith("boat_")


def where(ref, key):
    """A kit option that names a thing -> its scene point (X, D, z)."""
    if isinstance(ref, (list, tuple)):
        return tuple(ref)
    if ref in figs:
        f = figs[ref]
        return (f["X"], f["D"], (f.get("H") or 0.0) + 1.25)
    e = ents.get(ref)
    if e is None:
        raise KeyError(f"{key}: {ref} is neither a figure nor an entity of the layout")
    p = e.get("pos") or (e.get("pts", {}).get("base") or [0, 0])[:2]
    H = e.get("H") or 0.0
    return (p[0], p[1], H + (0.0 if key == "gangplank" else 0.8))


boats, bns, stats = {}, [], {}
for mid, e in ents.items():
    if not is_boat(mid, e) or mid in unbuilt:
        continue
    opts = dict(kit_for.get(mid, {}))
    kind = opts.pop("kind", None)
    for key in ("tow_to", "gangplank"):
        if key in opts and opts[key] is not None:
            opts[key] = where(opts[key], key)
    if "moor" in opts:
        opts["moor"] = [where(m, "moor") for m in opts["moor"]]
    made = {}
    for lod in (0, 1):
        bn = kb.boat_from_layout(e, mid, kind=kind, sink="nodes", lod=lod, **opts)
        bns.append(bn)
        made[lod] = bn
    info, t = made[0].info, made[0].tris
    vis = lambda tt: sum(v for n, v in tt.items() if not n.endswith(("__col", "__edge")))  # noqa: E731
    boats[mid] = {
        "kind": info["kind"], "pose": info["pose"], "motion": info["motion"], "lw": info["lw"], "loa": info["loa"],
        "beam": info["beam"], "deck_z": info["deck_z"], "roof_z": info["roof_z"], "heading_deg": info["heading_deg"],
        "water_H": e["pts"]["front"][2] if len(e["pts"]["front"]) > 2 else e.get("H", 0.0),
        "tris": {"lod0": vis(t), "lod1": vis(made[1].tris), "colliders": sum(v for n, v in t.items() if n.endswith("__col")),
                 "nodes": t},
        "kit": {k: v for k, v in kit_for.get(mid, {}).items()}, "note": info.get("note"),
    }
scene = bpy.context.scene
scene.name = "boats"
for o in list(scene.objects):
    bpy.data.objects.remove(o, do_unlink=True)
os.makedirs(os.path.dirname(raw) or ".", exist_ok=True)
if bns:
    coll = kb.export_boats(bpy, scene, bns, raw)
    # the boats' geometry by node, for the contact checks of their crews (blender/boat_owners.py; details pass, fix-boats):
    # gen/sections/<name>/boat_owners.{json,bin}; never fails the build
    try:
        import boat_owners
        # argv[2] (optional): another directory for them (fix-boats: a kit change measured in scratch before export)
        gdir = argv[2] if len(argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                                         "gen", "sections", os.path.basename(os.path.normpath(src)))
        if os.path.isdir(gdir):
            print("BOAT_OWNERS " + json.dumps(boat_owners.write(coll, os.path.join(gdir, "boat_owners.json"),
                                                                os.path.join(gdir, "boat_owners.bin"),
                                                                layout.get("section"))), flush=True)
    except Exception as ex:  # noqa: BLE001
        print(f"BOAT_OWNERS failed: {ex!r}", flush=True)
man = raw[:-len("_raw.glb")] + ".json" if raw.endswith("_raw.glb") else raw + ".json"
summary = {"about": "Written by blender/build_boats.py: the section's boats as built for the page (both detail levels "
                    "in the GLB). tris: visible triangles per detail level, collider triangles, triangles per node.",
           "section": layout.get("section"), "boats": boats}
with open(man, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=1, ensure_ascii=False)
print("BOATS_STATS " + json.dumps({"boats": len(boats), "glb": raw if bns else None, "manifest": man,
                                   "lod0": sum(b["tris"]["lod0"] for b in boats.values()),
                                   "lod1": sum(b["tris"]["lod1"] for b in boats.values()),
                                   "seconds": round(time.time() - t0, 1)}), flush=True)
