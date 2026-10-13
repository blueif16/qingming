"""kit_boats.water_strip on the plan's W and W2 reaches in plain Python (Blender modules stubbed), walls off."""
import json, os, sys, types
QM = "/home/ran/3d_director/qingming"
for name in ("mathutils", "song_kit", "street_b1", "kit_vehicles"):
    sys.modules[name] = types.ModuleType(name)
sys.modules["mathutils"].Matrix = object
sys.modules["mathutils"].Vector = lambda *a: a
sys.modules["street_b1"].MATERIALS = {}
sys.path.insert(0, os.path.join(QM, "blender"))
import kit_boats as kb
L = json.load(open(f"{QM}/sections/canal/layout.json"))
F = json.load(open(f"{QM}/map/frames/S2.json"))
P = json.load(open(sys.argv[1]))
for wid in ("S2.water.bian_river_w", "S2.water.bian_river_w2"):
    ent = dict(L["entities"][wid])
    ent["lines"] = P["water"][wid]
    ws = kb.water_strip(ent, F, wid, layout=L, seams=("west", "east"), walls=False)
    area = 0
    for f in ws.faces:
        a, b, c = (ws.verts[i] for i in f)
        area += ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
    print(wid, "tris", ws.tris, "area m2", round(area, 1), "ring", len(ws.polygon), ws.notes)
