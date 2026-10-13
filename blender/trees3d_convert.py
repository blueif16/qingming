"""A Meshy tree (trunk, limbs and heads, textured) -> the 3D trees' trunk spec (gen/details/trees/method.md):
upright, its foot at the origin, the real height, decimated to about `tris` triangles, the painted texture carried
into vertex colours, and the ends of its limbs (the heads where the crown's clumps spring) found as the far ends of
the wood measured along the surface from the foot. Writes one JSON for tools/trees3d.mjs build (no glTF exporter
options to guess): positions, normals, colours (linear), indices, tips, height.

  tools/blender_slot.sh -b --factory-startup --python <abs>/blender/trees3d_convert.py -- \
      <in.glb> <out.json> <height_m> [tris=2000] [front=-y]

Meshy puts the input picture's view on the model's front: after the glTF import (Y up -> Z up) that is -Y, which the
page turns to face south (+z in three), as the painting shows the tree from the south.
"""
import bpy, bmesh, sys, json, math, heapq
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out, height_m = argv[0], argv[1], float(argv[2])
tris = int(argv[3]) if len(argv) > 3 else 2000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in bpy.context.scene.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = ob.data
raw_tris = sum(len(p.vertices) - 2 for p in me.polygons)

# the painted texture (base colour) of the material, as a float array
img = None
for m in me.materials:
    if m and m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type == "TEX_IMAGE" and n.image:
                img = n.image
                break
    if img:
        break
tex = None
if img:
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    tex = px.reshape(h, w, 4)  # linear floats (Blender converts sRGB images on read)

# drop small loose pieces (Meshy sometimes leaves crumbs round a model)
bm = bmesh.new()
bm.from_mesh(me)
# the glTF import splits vertices along UV seams: weld them first (corners keep their UVs), so pieces are real pieces
diag = max((Vector(a) - Vector(b)).length for a, b in [(ob.bound_box[0], ob.bound_box[6])])
welded = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=diag * 1e-5)
welded -= len(bm.verts)
bm.verts.ensure_lookup_table()
seen, islands = set(), []
for v in bm.verts:
    if v.index in seen:
        continue
    stack, isl = [v], []
    seen.add(v.index)
    while stack:
        a = stack.pop()
        isl.append(a)
        for e in a.link_edges:
            b = e.other_vert(a)
            if b.index not in seen:
                seen.add(b.index)
                stack.append(b)
    islands.append(isl)
islands.sort(key=len, reverse=True)
dropped = 0
for isl in islands[1:]:
    if len(isl) < 0.03 * len(bm.verts):
        bmesh.ops.delete(bm, geom=isl, context="VERTS")
        dropped += 1
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.to_mesh(me)
bm.free()

# decimate to the near budget (UVs follow the collapse)
cur = len(me.polygons)
if cur > tris:
    mod = ob.modifiers.new("dec", "DECIMATE")
    mod.ratio = tris / cur
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=mod.name)

# upright: foot at the origin (the centre of the lowest 2% of the wood), real height
co = np.array([v.co[:] for v in me.vertices])
z0, z1 = co[:, 2].min(), co[:, 2].max()
low = co[co[:, 2] < z0 + 0.02 * (z1 - z0)]
foot = np.array([low[:, 0].mean(), low[:, 1].mean(), z0])
s = height_m / (z1 - z0)
for v in me.vertices:
    v.co = Vector(((v.co.x - foot[0]) * s, (v.co.y - foot[1]) * s, (v.co.z - foot[2]) * s))
me.update()

# smooth shading: wood is round; the ink comes from the silhouettes and creases (post.js)
for p in me.polygons:
    p.use_smooth = True

# colours: the texture sampled at every corner, averaged per vertex
nv = len(me.vertices)
col = np.ones((nv, 3), dtype=np.float64) * 0.35
if tex is not None and me.uv_layers.active:
    acc, cnt = np.zeros((nv, 3)), np.zeros(nv)
    uvl = me.uv_layers.active.data
    H, W = tex.shape[0], tex.shape[1]
    for loop in me.loops:
        u, v = uvl[loop.index].uv
        x = min(W - 1, max(0, int((u % 1.0) * W)))
        y = min(H - 1, max(0, int((v % 1.0) * H)))
        # a 3x3 mean, so a corner doesn't land on one ink speck
        patch = tex[max(0, y - 1):y + 2, max(0, x - 1):x + 2, :3].reshape(-1, 3).mean(axis=0)
        acc[loop.vertex_index] += patch
        cnt[loop.vertex_index] += 1
    m = cnt > 0
    col[m] = acc[m] / cnt[m][:, None]

# geodesic distance from the foot over the edges; the limbs' ends are its local maxima
co = np.array([v.co[:] for v in me.vertices])
Hm = co[:, 2].max()
adj = [[] for _ in range(nv)]
for e in me.edges:
    a, b = e.vertices
    d = float(np.linalg.norm(co[a] - co[b]))
    adj[a].append((b, d))
    adj[b].append((a, d))
g = np.full(nv, np.inf)
prev = np.full(nv, -1)
pq = []
for i in np.where(co[:, 2] < 0.03 * Hm)[0]:
    g[i] = 0.0
    pq.append((0.0, int(i)))
heapq.heapify(pq)
while pq:
    d, a = heapq.heappop(pq)
    if d > g[a]:
        continue
    for b, w in adj[a]:
        if d + w < g[b]:
            g[b] = d + w
            prev[b] = a
            heapq.heappush(pq, (g[b], b))
# pieces the foot doesn't reach start from their own lowest point, at its height
for _ in range(8):
    un = np.where(~np.isfinite(g))[0]
    if not len(un):
        break
    i = int(un[np.argmin(co[un, 2])])
    g[i] = co[i, 2]
    pq = [(g[i], i)]
    while pq:
        d, a = heapq.heappop(pq)
        if d > g[a]:
            continue
        for b, w in adj[a]:
            if d + w < g[b]:
                g[b] = d + w
                prev[b] = a
                heapq.heappush(pq, (g[b], b))
g[~np.isfinite(g)] = 0
# a vertex is a tip when nothing within 0.12 H (straight-line) lies farther from the foot along the wood
R = 0.12 * Hm
order = np.argsort(-g)
taken = np.zeros(nv, dtype=bool)
tips = []
for i in order:
    if taken[i] or co[i, 2] < 0.3 * Hm:
        continue
    near = np.linalg.norm(co - co[i], axis=1) < R
    if g[near].max() > g[i] + 1e-6:
        taken[near & (g <= g[i])] = True
        continue
    taken[near] = True
    # its direction: from the point 0.08 H back along the wood to the tip
    j, back = int(i), 0.0
    while prev[j] >= 0 and g[i] - g[j] < 0.08 * Hm:
        j = int(prev[j])
    dvec = co[i] - co[j]
    n = np.linalg.norm(dvec)
    dvec = dvec / n if n > 1e-6 else np.array([0.0, 0.0, 1.0])
    # the head: the wood within 0.05 H of the tip, its centre and size
    head = np.linalg.norm(co - co[i], axis=1) < 0.05 * Hm
    c = co[head].mean(axis=0)
    rad = float(np.linalg.norm(co[head] - c, axis=1).mean())
    tips.append({"i": int(i), "p": [round(float(x), 4) for x in co[i]], "c": [round(float(x), 4) for x in c], "dir": [round(float(x), 4) for x in dvec],
                 "r": round(rad, 4), "g": round(float(g[i]), 3)})

# triangles and corners: positions/normals per vertex (smooth), indices
idx, cuv = [], []
uvd = me.uv_layers.active.data if me.uv_layers.active else None
for p in me.polygons:
    idx.extend(p.vertices[:])
    for li in p.loop_indices:  # the Meshy texture's UV at each corner (Blender's: v up from the image's bottom)
        u, v = (uvd[li].uv[:] if uvd else (0.0, 0.0))
        cuv.extend([round(float(u), 5), round(float(v), 5)])
nrm = np.array([v.normal[:] for v in me.vertices])
res = {
    "src": src, "raw_tris": raw_tris, "welded": welded, "tris": len(idx) // 3, "verts": nv, "dropped_pieces": dropped,
    "height": round(float(Hm), 4), "bbox": [[round(float(x), 3) for x in co.min(axis=0)], [round(float(x), 3) for x in co.max(axis=0)]],
    "positions": [round(float(x), 4) for x in co.reshape(-1)],
    "normals": [round(float(x), 3) for x in nrm.reshape(-1)],
    "colors": [round(float(x), 4) for x in col.reshape(-1)],
    "indices": idx,
    "corner_uv": cuv,
    "texture": img.filepath_raw if img else None,
    "tips": tips,
    "geo": [round(float(x), 3) for x in g],
    "geo_max": round(float(g.max()), 3),
}
json.dump(res, open(out, "w"))
print("TREES3D_CONVERT", json.dumps({k: res[k] for k in ("raw_tris", "welded", "tris", "verts", "dropped_pieces", "height", "bbox", "geo_max")}), "tips", len(tips))
