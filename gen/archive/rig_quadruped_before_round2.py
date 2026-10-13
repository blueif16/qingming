"""Quadruped rig for the qingming animals: our skeleton fitted to a Meshy body, skinned, tack and loads bound to it,
clips keyed procedurally (a true four-beat walk with planted hooves, a calm idle, head down, lying), exported as one
GLB with named clips. Meshy rigs only humanoids, so the animal rig is ours (gen/expand/brief_workshop.md, Run 1).

Headless (tools/animal.mjs composes these):
  blender_wsl.sh -b --factory-startup --python rig_quadruped.py -- test <out.png> <label>=<glb> ...
      renders each Meshy test mesh, normalised, from the side, three-quarter, front and above, one row per mesh.
  blender_wsl.sh -b --factory-startup --python rig_quadruped.py -- rig <config.json> <in.glb> <out.glb> <rig.json> <frames_dir>
      fits, skins, keys and exports; writes rig.json (the measures the page needs) and review frames.

One skeleton for every body plan (equid, bovid, camelid): the same 31 bones and names, fitted per model, so a clip made
for one fits another of the same plan. The animal faces -Y in Blender (+Z in glTF / three.js), the origin on the
ground between its hooves; the animal's left is +X. Bones (".L" = the animal's left):
  root > hips > spine1 > spine2 > chest > neck1 > neck2 > neck3 > head > ear.L/.R
  hips > tail1 > tail2 > tail3
  chest > scapula.L > humerus.L > forearm.L > cannon_f.L > hoof_f.L     (fore: shoulder, elbow, knee, fetlock, hoof)
  hips > femur.L > tibia.L > cannon_h.L > hoof_h.L                    (hind: hip, stifle, hock, fetlock, hoof)
The legs are solved analytically each frame (2-bone IK from the shoulder/hip to the knee/hock, the cannon angle and the
hoof pitch from the gait), so a planted hoof moves backward at exactly the walk speed: the page moves the root at that
speed and the hoof stays put on the ground.
"""
import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

FPS = 30
FWD = Vector((0, -1, 0))   # the animal's forward in Blender
UP = Vector((0, 0, 1))

# Joint heights as fractions of the back height (Hb, the top of the back at the middle of the barrel) and
# fore-aft offsets (+ = forward) as fractions of Hb, per body plan. Fitted on the turnaround sheets and anatomy
# plates (horse/donkey, cattle, Bactrian camel); a config's "joints" can override any of them.
PLANS = {
    "equid": dict(fetlock=0.13, knee=0.31, elbow=0.56, elbow_u=-0.05, shoulder=0.70, shoulder_u=0.10, withers=0.98,
                  withers_u=-0.06, hfetlock=0.13, hock=0.40, hock_u=-0.04, stifle=0.62, stifle_u=0.10, hip=0.80,
                  hip_u=-0.02, spine_z=0.86, head_len=0.48, neck_base_u=0.04, tail_z=0.86, ear_len=0.22,
                  walk=dict(cycle=1.05, stride=0.92, duty=0.62, offsets=(0.0, 0.25, 0.5, 0.75), lift_f=0.09, lift_h=0.08,
                            fold_f=58, flip_f=52, fold_h=24, flip_h=36)),
    "bovid": dict(fetlock=0.11, knee=0.30, elbow=0.52, elbow_u=-0.05, shoulder=0.66, shoulder_u=0.10, withers=1.0,
                  withers_u=-0.06, hfetlock=0.11, hock=0.40, hock_u=-0.04, stifle=0.58, stifle_u=0.12, hip=0.80,
                  hip_u=-0.02, spine_z=0.84, head_len=0.40, neck_base_u=0.06, tail_z=0.90, ear_len=0.1, poll_from_ears=False, ear_motion=0.0,
                  walk=dict(cycle=1.25, stride=1.0, duty=0.64, offsets=(0.0, 0.25, 0.5, 0.75), lift_f=0.08, lift_h=0.07,
                            fold_f=55, flip_f=45, fold_h=22, flip_h=32)),
    "camelid": dict(fetlock=0.09, knee=0.33, elbow=0.55, elbow_u=-0.04, shoulder=0.68, shoulder_u=0.09, withers=0.96,
                    withers_u=-0.05, hfetlock=0.09, hock=0.40, hock_u=-0.05, stifle=0.56, stifle_u=0.12, hip=0.80,
                    hip_u=-0.02, spine_z=0.84, head_len=0.24, neck_base_u=0.06, tail_z=0.86, ear_len=0.06, poll_from_ears=False,
                    neck_march=True, neck_root_z=0.74, lie_mode="kush", lie_neck_raise=34.0, lie_pitch=5.0,
                    # camels walk in a near-pace: each hind lands just before the fore on the same side
                    walk=dict(cycle=1.3, stride=1.0, duty=0.62, offsets=(0.0, 0.12, 0.5, 0.62), lift_f=0.08, lift_h=0.07,
                              fold_f=55, flip_f=45, fold_h=22, flip_h=32)),
    # digitigrade: "fetlock" is the top of the paw, "knee" the carpus (wrist), "hock" the hock; the toe is the paw's
    # front. A dog walks in the same lateral four-beat sequence, quicker and with a lighter step.
    "canid": dict(fetlock=0.07, knee=0.22, elbow=0.5, elbow_u=-0.04, shoulder=0.68, shoulder_u=0.1, withers=0.98,
                  withers_u=-0.06, hfetlock=0.07, hock=0.3, hock_u=-0.03, stifle=0.56, stifle_u=0.12, hip=0.8,
                  hip_u=-0.02, spine_z=0.84, head_len=0.44, neck_base_u=0.02, tail_z=0.88, ear_len=0.16,
                  lie_mode="sphinx", lie_neck_raise=4.0, lie_pitch=6.0,
                  walk=dict(cycle=0.72, stride=1.05, duty=0.6, offsets=(0.0, 0.25, 0.5, 0.75), lift_f=0.1, lift_h=0.09,
                            fold_f=65, flip_f=55, fold_h=28, flip_h=40)),
}
LEGS = ("f.L", "f.R", "h.L", "h.R")


def log(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------- import and normalise

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_body(path, name="body"):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in meshes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in new:
        if o != ob and o.name in bpy.data.objects:
            bpy.data.objects.remove(o, do_unlink=True)
    ob.name = name
    return ob


def verts(ob):
    n = len(ob.data.vertices)
    co = np.empty(n * 3, dtype=np.float64)
    ob.data.vertices.foreach_get("co", co)
    return co.reshape(n, 3)


def set_verts(ob, co):
    ob.data.vertices.foreach_set("co", co.reshape(-1).astype(np.float64))
    ob.data.update()


def low_legs(co, frac=0.2):
    """The four leg columns near the ground: vertices below frac of the height, split left/right by x and front/back
    by the widest gap in the long axis. Returns {leg: mask} with legs 'f.L' ... in the normalised frame."""
    zmax = co[:, 2].max()
    low = co[:, 2] < frac * zmax
    ys = np.sort(co[low, 1])
    gaps = np.diff(ys)
    k = int(np.argmax(gaps))
    ysplit = (ys[k] + ys[k + 1]) / 2
    out = {}
    for leg in LEGS:
        front = co[:, 1] < ysplit if leg[0] == "f" else co[:, 1] >= ysplit
        side = co[:, 0] > 0 if leg.endswith("L") else co[:, 0] <= 0
        out[leg] = low & front & side
    return out, ysplit


def normalise(ob, forward=None, back_m=None):
    """Turn the body so the long axis runs along Y with the head toward -Y, centre it between its hooves, put the
    hooves on z = 0 and scale it so the back at mid-barrel is back_m high. Returns the scale and the head side used."""
    co = verts(ob)
    co[:, 2] -= co[:, 2].min()
    ext = co.max(0) - co.min(0)
    if ext[0] > ext[1]:                       # long axis along X: turn 90 degrees about Z
        co = co[:, [1, 0, 2]] * np.array([1, -1, 1])
    co[:, 0] -= (co[:, 0].max() + co[:, 0].min()) / 2
    legs, ysplit = low_legs(co)
    fy = np.mean([co[legs[l], 1].mean() for l in LEGS if l[0] == "f" and legs[l].any()])
    hy = np.mean([co[legs[l], 1].mean() for l in LEGS if l[0] == "h" and legs[l].any()])
    # which end is the head: the end that reaches furthest beyond its legs (the neck and head stick out; the rump
    # barely passes the hind legs); a config can force it with forward = "-y" / "+y"
    lo_end, hi_end = co[:, 1].min(), co[:, 1].max()
    a, b = min(fy, hy), max(fy, hy)
    head_low = (a - lo_end) > (hi_end - b)
    if forward == "+y":
        head_low = False
    elif forward == "-y":
        head_low = True
    if not head_low:
        co[:, 1] *= -1
        co[:, 0] *= -1
    legs, ysplit = low_legs(co)
    # centre between the hooves
    feet = np.concatenate([co[legs[l]] for l in LEGS])
    co[:, 1] -= (co[legs["f.L"] | legs["f.R"], 1].mean() + co[legs["h.L"] | legs["h.R"], 1].mean()) / 2
    co[:, 0] -= feet[:, 0].mean()
    scale = 1.0
    if back_m:
        hb = back_height(co, bvh_of(ob, co))
        scale = back_m / hb
        co *= scale
    set_verts(ob, co)
    return scale, head_low


def bvh_of(ob, co=None):
    from mathutils.bvhtree import BVHTree
    co = verts(ob) if co is None else co
    return BVHTree.FromPolygons([tuple(v) for v in co], [tuple(p.vertices) for p in ob.data.polygons])


def top_at(bvh, x, y):
    """Height of the body's top surface above (x, y): a ray cast straight down."""
    hit = bvh.ray_cast(Vector((x, y, 50.0)), Vector((0, 0, -1)))
    return hit[0].z if hit[0] is not None else None


def back_height(co, bvh):
    """The back's lowest point between the withers and the croup (where a rider or a pack sits): along the middle half
    of the span between the fore and hind legs, the lowest top of the body (ray cast down the middle)."""
    legs, _ = low_legs(co)
    fy = co[legs["f.L"] | legs["f.R"], 1].mean()
    hy = co[legs["h.L"] | legs["h.R"], 1].mean()
    tops = [top_at(bvh, 0.0, fy + (hy - fy) * t) for t in np.linspace(0.25, 0.75, 21)]
    tops = [z for z in tops if z is not None]
    return float(min(tops))


# ---------------------------------------------------------------- review renders

def look_material(ob, colour=(0.55, 0.53, 0.5, 1)):
    if ob.data.materials and ob.data.materials[0] and ob.data.materials[0].use_nodes:
        return
    m = bpy.data.materials.new("clay")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = colour
    ob.data.materials.clear()
    ob.data.materials.append(m)


def setup_render(res=(640, 520)):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.62, 0.62, 0.6, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
    sc.world = w
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 2.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    sc.collection.objects.link(sun)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    ground = bpy.data.meshes.new("ground")
    ground.from_pydata([(-20, -20, 0), (20, -20, 0), (20, 20, 0), (-20, 20, 0)], [], [(0, 1, 2, 3)])
    g = bpy.data.objects.new("ground", ground)
    gm = bpy.data.materials.new("ground")
    gm.use_nodes = True
    gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.48, 0.38, 1)
    ground.materials.append(gm)
    sc.collection.objects.link(g)
    return cam


def aim(cam, target, az_deg, el_deg, dist, ortho=None):
    """Camera on a sphere round target: az 0 = from the animal's left side (+X), 90 = from the front (-Y)."""
    az, el = math.radians(az_deg), math.radians(el_deg)
    d = Vector((math.cos(az) * math.cos(el), -math.sin(az) * math.cos(el), math.sin(el)))
    cam.location = Vector(target) + d * dist
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    if ortho:
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = ortho
    else:
        cam.data.type = "PERSP"
        cam.data.lens = 50


def render_to(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def compose(rows, out, label_h=0):
    """rows: list of lists of png paths -> one png sheet (Blender image API, no PIL)."""
    imgs = [[bpy.data.images.load(p) for p in row] for row in rows]
    w = max(sum(i.size[0] for i in row) for row in imgs)
    h = sum(max(i.size[1] for i in row) for row in imgs)
    buf = np.zeros((h, w, 4), dtype=np.float32)
    y = h
    for row in imgs:
        rh = max(i.size[1] for i in row)
        y -= rh
        x = 0
        for im in row:
            px = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
            buf[y:y + im.size[1], x:x + im.size[0]] = px
            x += im.size[0]
    sheet = bpy.data.images.new("sheet", w, h, alpha=True)
    sheet.pixels.foreach_set(buf.reshape(-1))
    sheet.filepath_raw = out
    sheet.file_format = "PNG"
    sheet.save()
    for row in imgs:
        for im in row:
            bpy.data.images.remove(im)


def mode_test(out_png, items):
    reset()
    cam = setup_render((520, 420))
    tmp = os.path.dirname(out_png)
    rows = []
    obs = []
    for item in items:
        label, path = item.split("=", 1)
        ob = import_body(path, label)
        look_material(ob)
        normalise(ob, back_m=1.0)
        co = verts(ob)
        ob.data.polygons.foreach_set("use_smooth", [False] * len(ob.data.polygons))
        n_tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
        log(f"TEST {label}: {len(co)} verts, {n_tris} tris, size {np.round(co.max(0) - co.min(0), 2).tolist()} (back = 1.0)")
        obs.append((label, ob))
    for label, ob in obs:
        for o2 in obs:
            o2[1].hide_render = o2[1] is not ob
        co = verts(ob)
        c = (co.max(0) + co.min(0)) / 2
        row = []
        for k, (az, el, ortho) in enumerate(((0, 4, 2.6), (35, 18, None), (90, 6, 2.6), (60, 65, None))):
            aim(cam, (0, c[1], 0.65), az, el, 4.8, ortho)
            p = os.path.join(tmp, f"_t_{label}_{k}.png")
            render_to(p)
            row.append(p)
        rows.append(row)
    compose(rows, out_png)
    for row in rows:
        for p in row:
            os.remove(p)



# ---------------------------------------------------------------- fitting the skeleton

def _slab_centre(co, mask, axis, value, half):
    sel = mask & (np.abs(co[:, axis] - value) < half)
    if sel.sum() < 3:
        return None
    return co[sel].mean(0), co[sel]


def fit(co, plan, over=None, bvh=None):
    """Joint positions (Vectors) for the skeleton, from the normalised body (head toward -Y, hooves on z = 0, the back's
    saddle at Hb) and the plan's proportions. Returns (J, info)."""
    P = dict(PLANS[plan])
    P.update(over or {})
    Hb = back_height(co, bvh)
    legs, ysplit = low_legs(co)
    J, info = {}, {"Hb": Hb}
    leg_x, leg_y = {}, {}
    for leg in LEGS:
        m = legs[leg]
        leg_x[leg] = float(co[m, 0].mean())
        leg_y[leg] = float(co[m, 1].mean())
    yf = (leg_y["f.L"] + leg_y["f.R"]) / 2
    yh = (leg_y["h.L"] + leg_y["h.R"]) / 2
    info.update(yf=yf, yh=yh)

    def leg_point(leg, z):
        """Centre of the leg column at height z: vertices near that height, on the leg's side and end, near the
        column's line (so the belly and the other leg are left out)."""
        side = co[:, 0] > 0 if leg.endswith("L") else co[:, 0] <= 0
        end = co[:, 1] < ysplit if leg[0] == "f" else co[:, 1] >= ysplit
        near = np.hypot(co[:, 0] - leg_x[leg], co[:, 1] - leg_y[leg]) < 0.22 * Hb
        sel = side & end & near & (np.abs(co[:, 2] - z) < 0.05 * Hb)
        if sel.sum() < 3:
            return Vector((leg_x[leg], leg_y[leg], z))
        c = co[sel].mean(0)
        return Vector((c[0], c[1], z))

    for leg in LEGS:
        s = 1 if leg.endswith("L") else -1
        x = leg_x[leg]
        ly = leg_y[leg]
        # the toe: the front of the hoof on the ground; the hoof's centre is the column's bottom
        bottom = legs[leg] & (co[:, 2] < 0.04 * Hb)
        toe_y = float(co[bottom, 1].min()) if bottom.any() else ly - 0.05 * Hb
        hoof_c = leg_point(leg, 0.02 * Hb)
        if leg[0] == "f":
            fet = leg_point(leg, P["fetlock"] * Hb)
            knee = leg_point(leg, P["knee"] * Hb)
            elbow = Vector((x * 0.95, ly - P["elbow_u"] * Hb, P["elbow"] * Hb))
            shoulder = Vector((x * 0.9, ly - P["shoulder_u"] * Hb, P["shoulder"] * Hb))
            top = Vector((x * 0.55, ly - P["withers_u"] * Hb, P["withers"] * Hb * 0.93))
            J[f"scapula.{leg[-1]}"] = (top, shoulder)
            J[f"humerus.{leg[-1]}"] = (shoulder, elbow)
            J[f"forearm.{leg[-1]}"] = (elbow, knee)
            J[f"cannon_f.{leg[-1]}"] = (knee, fet)
            J[f"hoof_f.{leg[-1]}"] = (fet, Vector((hoof_c.x, toe_y, 0.0)))
        else:
            fet = leg_point(leg, P["hfetlock"] * Hb)
            hock = leg_point(leg, P["hock"] * Hb)
            stifle = Vector((x * 1.0, ly - P["stifle_u"] * Hb, P["stifle"] * Hb))
            hip = Vector((x * 0.85, ly - P["hip_u"] * Hb, P["hip"] * Hb))
            J[f"femur.{leg[-1]}"] = (hip, stifle)
            J[f"tibia.{leg[-1]}"] = (stifle, hock)
            J[f"cannon_h.{leg[-1]}"] = (hock, fet)
            J[f"hoof_h.{leg[-1]}"] = (fet, Vector((hoof_c.x, toe_y, 0.0)))
        info[f"toe.{leg}"] = toe_y

    zs = P["spine_z"] * Hb
    L = Vector((0, yh - 0.06 * Hb, zs))                         # lumbosacral point, over the hind legs
    # the neck's root: the centre of the neck where it leaves the trunk, in front of the withers, above the point of
    # the shoulder
    neck_root = Vector((0, yf - P["neck_base_u"] * Hb, P.get("neck_root_z", 0.82) * Hb))
    # the croup's end and the tail's root: the rearmost body point high up near the middle
    high = (co[:, 2] > 0.7 * Hb) & (np.abs(co[:, 0]) < 0.12 * Hb)
    rear_y = float(co[high, 1].max())
    tail_root = Vector((0, rear_y - 0.04 * Hb, P["tail_z"] * Hb))
    if P.get("tail_path"):   # a tail that curls up (a dog's sickle tail): its line given as [y, z] in units of Hb
        tail_root = Vector((0, P["tail_path"][0][0] * Hb, P["tail_path"][0][1] * Hb))
    J["root"] = (Vector((0, 0, 0)), Vector((0, -0.25 * Hb, 0)))
    J["hips"] = (L.copy(), tail_root.copy())
    a, b = L, Vector((0, neck_root.y + 0.06 * Hb, zs))
    J["spine1"] = (a, a.lerp(b, 0.4))
    J["spine2"] = (a.lerp(b, 0.4), a.lerp(b, 0.78))
    J["chest"] = (a.lerp(b, 0.78), neck_root)

    # the head: muzzle = the front-most part; poll = between the ear (or horn) bases, else head_len back from the
    # muzzle along the centre line of slices across the head and neck
    tip_y = float(co[:, 1].min())
    front = co[:, 1] < tip_y + 0.05 * Hb
    muzzle = Vector(co[front].mean(0))
    muzzle.x = 0
    muzzle.y = tip_y + 0.01 * Hb
    upper = (co[:, 2] > 0.42 * Hb) & (np.abs(co[:, 0]) < 0.3 * Hb) & (co[:, 1] < neck_root.y)
    line = []
    for y in np.linspace(neck_root.y, tip_y + 0.02 * Hb, 28):
        sel = upper & (np.abs(co[:, 1] - y) < 0.035 * Hb)
        if sel.sum() >= 3:
            zz = co[sel, 2]
            line.append(Vector((0, y, (np.percentile(zz, 15) + np.percentile(zz, 85)) / 2)))
    hl = P["head_len"] * Hb
    poll = None
    for p in reversed(line):
        if (p - muzzle).length >= hl:
            poll = p.copy()
            break
    poll = poll or neck_root.lerp(muzzle, 0.5)
    ears = {}
    el = P.get("ear_len", 0.2) * Hb
    head_zone = (co[:, 1] < neck_root.y - 0.08 * Hb) & (co[:, 2] > 0.6 * Hb)
    for s, name in ((1, "ear.L"), (-1, "ear.R")):
        side = head_zone & (co[:, 0] * s > 0.0)
        if side.sum() < 8:
            continue
        pts = co[side]
        tip = Vector(pts[np.argmax(pts[:, 2])])
        near = (np.abs(pts[:, 2] - (tip.z - el)) < 0.03 * Hb) & (np.hypot(pts[:, 0] - tip.x, pts[:, 1] - tip.y) < 0.18 * Hb)
        if near.sum() >= 3:
            base = Vector(pts[near].mean(0))
            ears[name] = (base, tip)
    if len(ears) == 2 and P.get("poll_from_ears", True):
        eb = (ears["ear.L"][0] + ears["ear.R"][0]) / 2
        poll = Vector((0, eb.y + 0.04 * Hb, eb.z - 0.06 * Hb))
    for s, name in ((1, "ear.L"), (-1, "ear.R")):
        if name in ears:
            J[name] = ears[name]
        else:
            base = poll + Vector((s * 0.06, 0.03, 0.06)) * Hb
            J[name] = (base, base + Vector((s * 0.06, 0.02, 0.04)) * Hb)
    # the neck: three bones from the root to the poll, each joint moved to the middle of the neck's cross-section
    # (between the throat and the crest, across the root-poll line)
    d = (poll - neck_root).normalized()
    up = Vector((0, d.z, -d.y)) if d.z * 0 == 0 else Vector((0, 0, 1))
    if up.z < 0:
        up = -up
    # the neck's centre line, marched from the root toward the poll: each step looks across the neck (vertices near the
    # plane square to the current direction, within reach) and moves to the middle of what it finds; the last third
    # heads straight for the poll (the jaw and the ears would pull the centre off)
    if P.get("neck_march", False):
        pts_ = [neck_root.copy()]
        dcur = (poll - neck_root).normalized()
        total = (poll - neck_root).length
        steps = 8
        st = total / steps * 1.15
        for k_ in range(steps * 2):
            prev = pts_[-1]
            togo = (poll - prev)
            if togo.length < st * 1.2:
                break
            pred = prev + dcur * st
            rel = co - np.array(pred)
            along = rel @ np.array(dcur)
            sel = (np.abs(along) < st * 0.5) & (np.linalg.norm(rel, axis=1) < 0.4 * Hb) & (np.abs(co[:, 0]) < 0.3 * Hb)
            c = pred
            if sel.sum() >= 4:
                upv = Vector((0, dcur.z, -dcur.y))
                if upv.z < 0:
                    upv = -upv
                acr = rel[sel] @ np.array(upv)
                lo_, hi_ = np.percentile(acr, 10), np.percentile(acr, 90)
                c = pred + upv * ((lo_ + hi_) / 2) * 0.8
            frac = min(1.0, (k_ + 1) / steps)
            dnew = (c - prev).normalized().lerp((poll - c).normalized(), frac * frac).normalized()
            pts_.append(Vector((0, c.y, c.z)))
            dcur = dnew
        pts_.append(poll.copy())
        cum = [0.0]
        for p_, q_ in zip(pts_, pts_[1:]):
            cum.append(cum[-1] + (q_ - p_).length)

        def nat(f):
            t = f * cum[-1]
            for k_ in range(len(pts_) - 1):
                if cum[k_ + 1] >= t:
                    return pts_[k_].lerp(pts_[k_ + 1], (t - cum[k_]) / max(1e-9, cum[k_ + 1] - cum[k_]))
            return pts_[-1].copy()
        mids = [nat(1 / 3), nat(2 / 3)]
    else:
        # a gentle bow toward the crest (straight-line joints: the cross-section centres zig-zag on the jaw and mane)
        mids = [neck_root.lerp(poll, f) + up * (0.025 * Hb * math.sin(math.pi * f)) for f in (1 / 3, 2 / 3)]
    J["neck1"] = (neck_root, mids[0])
    J["neck2"] = (mids[0], mids[1])
    J["neck3"] = (mids[1], poll)
    J["head"] = (poll, muzzle)
    info["muzzle"] = muzzle
    # tail: behind the buttocks, near the middle, hanging from the root; its lowest point is the tip
    if P.get("tail_path"):
        sel = np.zeros(len(co), dtype=bool)
    else:
        sel = (co[:, 1] > yh + 0.14 * Hb) & (np.abs(co[:, 0]) < 0.09 * Hb) & (co[:, 2] < tail_root.z) & (co[:, 2] > 0.15 * Hb)
    if sel.sum() >= 6:
        pts = co[sel]
        tip = Vector(pts[np.argmin(pts[:, 2])])
        # follow the hanging tail: slab centres in z between root and tip
        tl = [tail_root]
        for z in np.linspace(tail_root.z - 0.08 * Hb, tip.z + 0.02 * Hb, 8):
            ss = sel & (np.abs(co[:, 2] - z) < 0.03 * Hb)
            if ss.sum() >= 2:
                c = co[ss].mean(0)
                tl.append(Vector((c[0], c[1], z)))
        tl.append(tip)
    elif P.get("tail_path"):
        tl = [Vector((0, y * Hb, z * Hb)) for y, z in P["tail_path"]]
    else:
        tip = tail_root + Vector((0, 0.15, -0.35)) * Hb
        tl = [tail_root, tip]
    tlen = [0.0]
    for p, q in zip(tl, tl[1:]):
        tlen.append(tlen[-1] + (q - p).length)

    def tat(f):
        t = f * tlen[-1]
        for k in range(len(tl) - 1):
            if tlen[k + 1] >= t:
                u = (t - tlen[k]) / max(1e-9, tlen[k + 1] - tlen[k])
                return tl[k].lerp(tl[k + 1], u)
        return tl[-1].copy()
    J["tail1"] = (tail_root, tat(0.3))
    J["tail2"] = (tat(0.3), tat(0.62))
    J["tail3"] = (tat(0.62), tat(1.0))
    info["P"] = P
    return J, info


PARENT = {
    "root": None, "hips": "root", "spine1": "hips", "spine2": "spine1", "chest": "spine2",
    "neck1": "chest", "neck2": "neck1", "neck3": "neck2", "head": "neck3", "ear.L": "head", "ear.R": "head",
    "tail1": "hips", "tail2": "tail1", "tail3": "tail2",
}
for _s in ("L", "R"):
    PARENT.update({f"scapula.{_s}": "chest", f"humerus.{_s}": f"scapula.{_s}", f"forearm.{_s}": f"humerus.{_s}",
                   f"cannon_f.{_s}": f"forearm.{_s}", f"hoof_f.{_s}": f"cannon_f.{_s}",
                   f"femur.{_s}": "hips", f"tibia.{_s}": f"femur.{_s}", f"cannon_h.{_s}": f"tibia.{_s}",
                   f"hoof_h.{_s}": f"cannon_h.{_s}"})
CONNECT = {"spine2", "chest", "neck2", "neck3", "head", "tail2", "tail3"} | {
    f"{b}.{s}" for b in ("humerus", "forearm", "cannon_f", "hoof_f", "tibia", "cannon_h", "hoof_h") for s in ("L", "R")}
ORDER = list(PARENT)


def build_armature(J, name="rig"):
    arm = bpy.data.armatures.new(name)
    ob = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for b in ORDER:
        h, t = J[b]
        e = arm.edit_bones.new(b)
        e.head, e.tail = h, t
        # roll: X axis to the animal's left (+X) for every bone, so pitch is always about local X
        e.align_roll(Vector((0, 0, 1)) if abs((t - h).normalized().z) < 0.9 else Vector((0, -1, 0)))
        eb[b] = e
    for b in ORDER:
        if PARENT[b]:
            eb[b].parent = eb[PARENT[b]]
            eb[b].use_connect = b in CONNECT
    eb["root"].use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in ob.pose.bones:
        pb.rotation_mode = "QUATERNION"
    return ob


# ---------------------------------------------------------------- skinning

def _heat_weights(body, rig):
    """Heat weights on a welded copy of the body (the retextured mesh is split along its UV seams, and the heat solve
    fails on a split mesh), mapped back to the body's vertices by position. Returns (W, names)."""
    import bmesh
    from mathutils.kdtree import KDTree
    me = body.data.copy()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(me)
    bm.free()
    tmp = bpy.data.objects.new("weld", me)
    bpy.context.scene.collection.objects.link(tmp)
    tmp.vertex_groups.clear()
    bpy.ops.object.select_all(action="DESELECT")
    tmp.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    names = [b.name for b in rig.data.bones if b.use_deform]
    idx = {g.name: g.index for g in tmp.vertex_groups}
    Wt = np.zeros((len(me.vertices), len(names)))
    col = {nm: k for k, nm in enumerate(names)}
    inv = {g.index: g.name for g in tmp.vertex_groups}
    for v in me.vertices:
        for g in v.groups:
            nm = inv[g.group]
            if nm in col:
                Wt[v.index, col[nm]] = g.weight
    kd = KDTree(len(me.vertices))
    for v in me.vertices:
        kd.insert(v.co, v.index)
    kd.balance()
    co = verts(body)
    W = np.zeros((len(co), len(names)))
    for i, c in enumerate(co):
        _, j, _ = kd.find(Vector(c))
        W[i] = Wt[j]
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.meshes.remove(me)
    return W, names


def _nearest_bone_weights(co, rig, names, falloff):
    """Fallback weights by distance to the bone segments (inverse-distance, sharp falloff)."""
    segs = []
    for nm in names:
        b = rig.data.bones[nm]
        segs.append((np.array(b.head_local), np.array(b.tail_local)))
    D = np.zeros((len(co), len(names)))
    for k, (h, t) in enumerate(segs):
        d = t - h
        f = np.clip(((co - h) @ d) / max(1e-9, d @ d), 0, 1)
        D[:, k] = np.linalg.norm(h + f[:, None] * d - co, axis=1)
    W = 1.0 / np.maximum(D, 1e-4) ** falloff
    return W


def skin(body, rig, info):
    """Automatic (heat) weights, then fixes: legs never pull the other side or the other end of the body, ears and
    tail only move their own vertices, at most 4 influences, normalised."""
    Hb, yf, yh = info["Hb"], info["yf"], info["yh"]
    W, names = _heat_weights(body, rig)
    co = verts(body)
    n = len(co)
    unw = W.sum(1) < 1e-4
    unweighted = float(unw.mean())
    if unweighted > 0.5:
        log(f"RIG skin: heat weights left {unweighted * 100:.0f}% of the vertices unweighted; using distance weights")
        W = _nearest_bone_weights(co, rig, names, 6)
    elif unw.any():
        # loose shells (fur locks, a mane) the heat solve could not reach take the weights of the nearest weighted
        # vertices of the body
        from mathutils.kdtree import KDTree
        idx = np.where(~unw)[0]
        kd = KDTree(len(idx))
        for j, i in enumerate(idx):
            kd.insert(Vector(co[i]), j)
        kd.balance()
        for i in np.where(unw)[0]:
            acc = np.zeros(W.shape[1])
            tot = 0.0
            for _, j, d in kd.find_n(Vector(co[i]), 4):
                w = 1.0 / max(d, 1e-3) ** 2
                acc += W[idx[j]] * w
                tot += w
            W[i] = acc / tot
    mid = (yf + yh) / 2
    for k, nm in enumerate(names):
        part = nm.split(".")[0]
        if nm.endswith(".L") and not nm.startswith("ear"):
            W[co[:, 0] < -0.02 * Hb, k] = 0
        if nm.endswith(".R") and not nm.startswith("ear"):
            W[co[:, 0] > 0.02 * Hb, k] = 0
        if part in ("scapula", "humerus", "forearm", "cannon_f", "hoof_f"):
            W[co[:, 1] > mid, k] = 0
        if part in ("femur", "tibia", "cannon_h", "hoof_h"):
            W[co[:, 1] < mid, k] = 0
        if part == "tail":
            W[co[:, 1] < yh, k] = 0
    # any vertex left without weight takes distance weights
    lost = W.sum(1) < 1e-6
    if lost.any():
        Wd = _nearest_bone_weights(co[lost], rig, names, 6)
        W[lost] = Wd
    # at most 4 influences, normalised
    order = np.argsort(W, axis=1)
    W[np.arange(n)[:, None], order[:, :-4]] = 0
    W /= W.sum(1, keepdims=True)
    body.vertex_groups.clear()
    for k, nm in enumerate(names):
        g = body.vertex_groups.new(name=nm)
        nz = np.where(W[:, k] > 1e-4)[0]
        for i in nz:
            g.add([int(i)], float(W[i, k]), "REPLACE")
    body.parent = rig
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    log(f"RIG skin: heat weights ({unweighted * 100:.1f}% unweighted before the fixes), {len(names)} bones")


# ---------------------------------------------------------------- posing (our own FK and analytic leg IK)

def smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def rot_u(vec_uw, ang):
    """Rotate a (u, w) vector clockwise by ang (u forward, w up): positive = heel up / sole backward."""
    u, w = vec_uw
    c, s = math.cos(ang), math.sin(ang)
    return (u * c + w * s, -u * s + w * c)


class Poser:
    """Evaluates the skeleton: FK bones from armature-space delta rotations, legs from hoof targets. Writes keys."""

    def __init__(self, rig, info):
        self.rig = rig
        self.info = info
        self.R = {b.name: b.matrix_local.copy() for b in rig.data.bones}
        self.rest = {b.name: (Vector(b.head_local), Vector(b.tail_local)) for b in rig.data.bones}
        self.len = {k: (t - h).length for k, (h, t) in self.rest.items()}
        self.prevq = {}

    def rel(self, b):
        p = PARENT[b]
        return self.R[p].inverted() @ self.R[b] if p else self.R[b]

    def fk(self, b, P, G=None, offset=None):
        """Pose bone b with an armature-space delta rotation G (Quaternion) about its head and an optional head
        offset (armature space). P: posed matrices so far. Returns the basis."""
        A = (P[PARENT[b]] @ self.rel(b)) if PARENT[b] else self.R[b].copy()
        head = A.to_translation() + (offset or Vector((0, 0, 0)))
        rot = (G.to_matrix() if G else Matrix.Identity(3)) @ A.to_3x3()
        P[b] = Matrix.Translation(head) @ rot.to_4x4()
        return A.inverted() @ P[b]

    def aim(self, b, P, target):
        """Pose leg bone b (connected to its parent or girdle-rooted) to point at target, minimal rotation from the
        way it would hang with an identity basis."""
        A = (P[PARENT[b]] @ self.rel(b)) if PARENT[b] else self.R[b].copy()
        head = A.to_translation()
        d0 = (A.to_3x3() @ Vector((0, 1, 0))).normalized()
        d = (target - head)
        if d.length < 1e-6:
            d = d0
        q = d0.rotation_difference(d.normalized())
        P[b] = Matrix.Translation(head) @ (q.to_matrix() @ A.to_3x3()).to_4x4()
        return A.inverted() @ P[b]

    def tail(self, b, P):
        return P[b] @ Vector((0, self.len[b], 0))

    def solve_leg(self, side, fore, P, toe, phi, theta, bases):
        """toe: armature-space toe point; phi: hoof flexion (rad, + = heel up / sole back, about the toe); theta:
        cannon angle from vertical (+ = upper joint ahead of the fetlock)."""
        s = side
        if fore:
            names = (f"scapula.{s}", f"humerus.{s}", f"forearm.{s}", f"cannon_f.{s}", f"hoof_f.{s}")
        else:
            names = (None, f"femur.{s}", f"tibia.{s}", f"cannon_h.{s}", f"hoof_h.{s}")
        g, up1, up2, can, hoof = names
        # girdle joint
        if fore:
            G = P[g] @ Vector((0, self.len[g], 0))
        else:
            G = (P["hips"] @ self.rel(up1)).to_translation()
        # fetlock from the toe and the hoof's flexion (rotating the rest hoof about the toe)
        fet0, toe0 = self.rest[hoof]
        v = fet0 - toe0                                       # toe -> fetlock at rest
        du, dw = rot_u((-v.y, v.z), phi)                      # u = -y
        F = Vector((toe.x + v.x, toe.y - du, toe.z + dw))
        # knee / hock from the cannon angle; a leg stretched past its reach straightens its cannon toward the
        # girdle (as a real leg does at the ends of the stride) so the hoof stays exactly on its target
        L3 = self.len[can]
        L1, L2 = self.len[up1], self.len[up2]
        kx = F.x + (self.rest[can][0].x - self.rest[can][1].x)

        def knee(th):
            return Vector((kx, F.y - L3 * math.sin(th), F.z + L3 * math.cos(th)))

        def reach(Kp):
            return math.hypot(-Kp.y + G.y, Kp.z - G.z)
        K = knee(theta)
        if reach(K) > (L1 + L2) * 0.999:
            th_al = math.atan2(-(G.y - F.y), G.z - F.z)
            lo_, hi_ = 0.0, 1.0
            if reach(knee(th_al)) <= (L1 + L2) * 0.999:
                for _ in range(20):
                    mid = (lo_ + hi_) / 2
                    if reach(knee(theta + (th_al - theta) * mid)) > (L1 + L2) * 0.999:
                        lo_ = mid
                    else:
                        hi_ = mid
                K = knee(theta + (th_al - theta) * hi_)
            else:
                K = knee(th_al)
        # elbow / stifle: 2-bone IK in the leg's (u, w) plane from G to K
        gu, gw = -G.y, G.z
        ku, kw = -K.y, K.z
        dx, dz = ku - gu, kw - gw
        d = math.hypot(dx, dz)
        dmax = (L1 + L2) * 0.999
        if d > dmax:
            self.overreach = max(getattr(self, "overreach", 0.0), d - dmax)
            d = dmax
        d = max(d, abs(L1 - L2) + 1e-4)
        a = math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
        base = math.atan2(dz, dx)
        # in (u, w) with the line G->K pointing down, turning it counter-clockwise (+a) puts the joint ahead:
        # the hind stifle bends forward, the fore elbow backward
        ang = base - a if fore else base + a
        E_uw = (gu + L1 * math.cos(ang), gw + L1 * math.sin(ang))
        ex = (self.rest[up1][1].x)
        E = Vector((ex, -E_uw[0], E_uw[1]))
        bases[up1] = self.aim(up1, P, E)
        bases[up2] = self.aim(up2, P, K)
        bases[can] = self.aim(can, P, F)
        bases[hoof] = self.aim(hoof, P, toe)
        return self.tail(hoof, P)

    def key(self, bases, frame, hips_loc=None):
        for b, M in bases.items():
            if M is None:
                continue
            pb = self.rig.pose.bones[b]
            q = M.to_quaternion().normalized()
            pq = self.prevq.get(b)
            if pq is not None and pq.dot(q) < 0:
                q.negate()
            self.prevq[b] = q
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=frame)
            if b == "hips":
                pb.location = M.to_translation()
                pb.keyframe_insert("location", frame=frame)


# ---------------------------------------------------------------- clips

def quat(axis, deg):
    return Quaternion(Vector(axis), math.radians(deg))


def qmul(*qs):
    out = Quaternion()
    for q in qs:
        out = out @ q
    return out


class Clip:
    """A clip is a function of time t (s) over a loop of `length` s returning the pose parameters:
    body: hips offset (Vector, armature space) and hips rotation (Quaternion); spine/neck/head/ear/tail deltas
    (Quaternion per bone, armature-space axes); legs: per leg (toe Vector, phi, theta, scapula swing deg)."""


def leg_rest(poser, leg):
    fore = leg[0] == "f"
    s = leg[-1]
    hoof = f"hoof_{'f' if fore else 'h'}.{s}"
    can = f"cannon_{'f' if fore else 'h'}.{s}"
    toe = poser.rest[hoof][1].copy()
    k, f = poser.rest[can]
    theta0 = math.atan2(-(k.y - f.y), k.z - f.z)
    return toe, theta0


def evaluate(poser, pose, frame):
    """pose: dict with hips_off, hips_rot, fk {bone: Quaternion}, scap {side: deg}, legs {leg: (toe, phi, theta)}."""
    em = poser.info["P"].get("ear_motion", 1.0)
    if em != 1.0:   # horns, not ears (the ox): keep them still
        for e in ("ear.L", "ear.R"):
            if e in pose["fk"]:
                pose["fk"][e] = Quaternion().slerp(pose["fk"][e], em)
    P, bases = {}, {}
    P["root"] = poser.R["root"].copy()
    bases["root"] = Matrix.Identity(4)
    bases["hips"] = poser.fk("hips", P, pose.get("hips_rot"), pose.get("hips_off"))
    for b in ("spine1", "spine2", "chest", "neck1", "neck2", "neck3", "head", "ear.L", "ear.R", "tail1", "tail2", "tail3"):
        bases[b] = poser.fk(b, P, pose["fk"].get(b))
    for s in ("L", "R"):
        bases[f"scapula.{s}"] = poser.fk(f"scapula.{s}", P, quat((1, 0, 0), pose["scap"].get(s, 0.0)))
    for leg in LEGS:
        toe, phi, theta = pose["legs"][leg]
        poser.solve_leg(leg[-1], leg[0] == "f", P, toe, phi, theta, bases)
    poser.key(bases, frame)
    return P


def body_lean(poser, P_girdle, toe):
    return math.atan2(P_girdle.y - toe.y, P_girdle.z - toe.z) * -1


def make_clip(poser, rig, name, length, fn):
    """Key one looping clip into its own action: frames 0..length*FPS, the last equal to the first."""
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    poser.prevq = {}
    poser.overreach = 0.0
    n = int(round(length * FPS))
    for f in range(n + 1):
        t = (f % n) / FPS
        evaluate(poser, fn(t), f)
    act.frame_range = (0, n)
    if poser.overreach > 1e-3:
        log(f"RIG {name}: legs over-reached by up to {poser.overreach * 100:.1f} cm (targets clamped)")
    return act


def neutral(poser):
    legs = {}
    for leg in LEGS:
        toe, th = leg_rest(poser, leg)
        legs[leg] = (toe, 0.0, th)
    return {"hips_off": Vector((0, 0, 0)), "hips_rot": Quaternion(), "fk": {}, "scap": {}, "legs": legs}


def girdle_rest(poser, leg):
    s = leg[-1]
    if leg[0] == "f":
        return poser.rest[f"scapula.{s}"][1]
    return poser.rest[f"femur.{s}"][0]


def walk_fn(poser, info, cfg):
    P = info["P"]
    W = dict(P["walk"])
    W.update(cfg.get("walk", {}))
    Hb = info["Hb"]
    T, S, beta = W["cycle"], W["stride"] * Hb, W["duty"]
    T = round(T * FPS) / FPS            # a whole number of frames, so the clip loops exactly at the gait's period
    offs = dict(zip(("h.L", "f.L", "h.R", "f.R"), W["offsets"]))
    rest = {leg: leg_rest(poser, leg) for leg in LEGS}

    def fn(t):
        p = (t / T) % 1.0
        pose = neutral(poser)
        legs = {}
        for leg in LEGS:
            fore = leg[0] == "f"
            toe0, th0 = rest[leg]
            s = (p - offs[leg]) % 1.0
            G = girdle_rest(poser, leg)
            if s < beta:
                u = S * beta / 2 - (s / beta) * S * beta
                lift = 0.0
                bo = smooth((s / beta - 0.8) / 0.2)            # breakover in the last fifth of stance
                phi = math.radians(28 if fore else 22) * bo
                flex = 0.0
            else:
                q = (s - beta) / (1 - beta)
                e = smooth(q) * 0.85 + q * 0.15
                u = -S * beta / 2 + e * S * beta
                lift = (W["lift_f"] if fore else W["lift_h"]) * Hb * math.sin(math.pi * min(1.0, q ** 0.85))
                if fore:
                    phi = math.radians(28 * (1 - q / 0.75) + W["flip_f"] * math.sin(math.pi * q / 0.75) ** 1.2) if q < 0.75 else 0.0
                    flex = math.radians(W["fold_f"]) * math.sin(math.pi * q / 0.8) ** 1.3 if q < 0.8 else 0.0
                else:
                    phi = math.radians(22 * (1 - q / 0.8) + W["flip_h"] * math.sin(math.pi * q / 0.8)) if q < 0.8 else 0.0
                    flex = -math.radians(W["fold_h"]) * math.sin(math.pi * q / 0.85) if q < 0.85 else 0.0
            toe = Vector((toe0.x, toe0.y - u, lift))
            lean = math.atan2(-(G.y - toe.y), G.z - toe.z)
            theta = th0 + 0.55 * (lean - math.atan2(-(G.y - toe0.y), G.z - toe0.z)) + flex
            legs[leg] = (toe, phi, theta)
            if fore:   # the shoulder blade swings with the leg: forward as the hoof reaches forward
                pose["scap"][leg[-1]] = -7.0 * u / (S * beta / 2)
        pose["legs"] = legs
        w2 = 4 * math.pi * p
        pose["hips_off"] = Vector((0.006 * Hb * math.sin(2 * math.pi * p), 0, -0.012 * Hb * (0.5 + 0.5 * math.cos(w2 - 0.6))))
        pose["hips_rot"] = qmul(quat((0, 1, 0), 1.6 * math.sin(2 * math.pi * p)), quat((1, 0, 0), 0.8 * math.sin(w2)))
        nod = math.sin(w2 - 1.2)
        pose["fk"] = {
            "spine1": quat((0, 0, 1), 1.2 * math.sin(2 * math.pi * p + 0.5)),
            "chest": quat((0, 1, 0), -1.0 * math.sin(2 * math.pi * p)),
            "neck1": quat((1, 0, 0), 2.5 * nod + 4.0),
            "neck3": quat((1, 0, 0), 1.5 * nod),
            "head": quat((1, 0, 0), -2.0 * nod),
            "ear.L": quat((0, 1, 0), 4 * math.sin(2 * math.pi * p)),
            "ear.R": quat((0, 1, 0), -4 * math.sin(2 * math.pi * p + 0.7)),
            "tail1": quat((0, 0, 1), 7 * math.sin(2 * math.pi * p)),
            "tail2": quat((0, 0, 1), 7 * math.sin(2 * math.pi * p - 0.8)),
            "tail3": quat((0, 0, 1), 6 * math.sin(2 * math.pi * p - 1.6)),
        }
        return pose
    return fn, T, S


def bump(t, at, width):
    """A smooth 0..1..0 bump centred at `at` (s), `width` s wide."""
    x = (t - at) / width
    return math.exp(-x * x * 4) if abs(x) < 1.5 else 0.0


def idle_fn(poser, info, cfg, length=8.0):
    Hb = info["Hb"]

    def fn(t):
        pose = neutral(poser)
        w = 2 * math.pi * t / length
        sway = math.sin(w)
        breathe = math.sin(2 * math.pi * t / (length / 2))
        pose["hips_off"] = Vector((0.012 * Hb * sway, 0.006 * Hb * math.sin(w + 1.0), -0.004 * Hb * (1 + breathe) / 2))
        pose["hips_rot"] = quat((0, 1, 0), 1.2 * sway)
        look = math.sin(w + 0.4)
        swish = bump(t, 2.6, 0.7) - 0.8 * bump(t, 3.2, 0.6) + bump(t, 6.1, 0.8)
        flickL = bump(t, 1.3, 0.35) + bump(t, 5.2, 0.4)
        flickR = bump(t, 3.9, 0.35) + 0.7 * bump(t, 7.0, 0.3)
        pose["fk"] = {
            "spine2": quat((1, 0, 0), 0.8 * breathe),
            "chest": quat((1, 0, 0), -0.6 * breathe),
            "neck1": qmul(quat((0, 0, 1), 7 * look), quat((1, 0, 0), 3 * math.sin(2 * w + 0.3))),
            "neck2": quat((0, 0, 1), 6 * look),
            "head": qmul(quat((0, 0, 1), 6 * look), quat((1, 0, 0), 4 * math.sin(3 * w))),
            "ear.L": qmul(quat((0, 0, 1), 18 * flickL), quat((1, 0, 0), -8 * flickL + 3 * math.sin(w))),
            "ear.R": qmul(quat((0, 0, 1), -18 * flickR), quat((1, 0, 0), -8 * flickR + 3 * math.sin(w + 2))),
            "tail1": quat((0, 0, 1), 4 * math.sin(w) + 16 * swish),
            "tail2": quat((0, 0, 1), 5 * math.sin(w - 0.5) + 18 * swish),
            "tail3": quat((0, 0, 1), 5 * math.sin(w - 1.0) + 16 * swish),
        }
        return pose
    return fn, length


def head_down_angles(poser, info, target_z, tilt=18.0):
    """The neck pitch that brings the muzzle down to target_z with the face hanging nearly straight down (tilt degrees
    forward of vertical), as a grazing animal holds it. Bisection on the neck's total bend; the head's own rotation
    turns the face to that direction. Returns ({neck bone: deg}, head delta Quaternion)."""
    split = {"neck1": 0.62, "neck2": 0.26, "neck3": 0.12}
    t = math.radians(tilt)
    want = Vector((0, -math.sin(t), -math.cos(t)))
    hl = poser.len["head"]

    def trial(total):
        P = {}
        P["root"] = poser.R["root"].copy()
        poser.fk("hips", P, quat((1, 0, 0), 3.0))
        for b_ in ("spine1", "spine2", "chest"):
            poser.fk(b_, P, quat((1, 0, 0), 2.0) if b_ == "chest" else None)
        for b_ in ("neck1", "neck2", "neck3"):
            poser.fk(b_, P, quat((1, 0, 0), total * split[b_]))
        poser.fk("head", P)
        cur = (P["head"].to_3x3() @ Vector((0, 1, 0))).normalized()
        poll = P["head"].to_translation()
        return poll.z + want.z * hl, cur.rotation_difference(want)
    lo, hi = 0.0, 120.0
    for _ in range(30):
        mid = (lo + hi) / 2
        z, _q = trial(mid)
        if z > target_z:
            lo = mid
        else:
            hi = mid
    z, qh = trial(mid)
    return {b_: mid * f for b_, f in split.items()}, qh


def graze_fn(poser, info, cfg, length=6.0):
    Hb = info["Hb"]
    ang, qhead = head_down_angles(poser, info, cfg.get("graze_z", 0.06) * Hb)

    def fn(t):
        pose = neutral(poser)
        w = 2 * math.pi * t / length
        nib = math.sin(2 * math.pi * t * 1.5) * (0.5 + 0.5 * math.sin(w))
        pose["hips_off"] = Vector((0.006 * Hb * math.sin(w), 0.01 * Hb, -0.004 * Hb))
        pose["hips_rot"] = quat((1, 0, 0), 3.0)
        pose["fk"] = {b: quat((1, 0, 0), a) for b, a in ang.items()}
        pose["fk"]["head"] = qhead
        pose["fk"]["chest"] = quat((1, 0, 0), 2.0)
        toe, phi, th = pose["legs"]["f.L"]
        pose["legs"]["f.L"] = (toe + Vector((0, -0.12 * Hb, 0)), phi, th)
        pose["fk"]["neck1"] = qmul(quat((0, 0, 1), 6 * math.sin(w)), quat((1, 0, 0), ang["neck1"] - 2 * math.sin(w * 2)))
        pose["fk"]["head"] = qmul(quat((0, 0, 1), 5 * math.sin(w + 1)), quat((1, 0, 0), 3 * nib), qhead)
        pose["fk"]["ear.L"] = quat((1, 0, 0), 6 + 6 * bump(t, 2.0, 0.4))
        pose["fk"]["ear.R"] = quat((1, 0, 0), 6 + 6 * bump(t, 4.3, 0.4))
        sw = bump(t, 3.3, 0.8)
        pose["fk"]["tail1"] = quat((0, 0, 1), 3 * math.sin(w) + 14 * sw)
        pose["fk"]["tail2"] = quat((0, 0, 1), 3 * math.sin(w - 0.5) + 16 * sw)
        pose["fk"]["tail3"] = quat((0, 0, 1), 3 * math.sin(w - 1) + 14 * sw)
        return pose
    return fn, length


def head_low_fn(poser, info, cfg, length=8.0):
    """Standing with the head hanging low (muzzle at about knee height, face slanting down): a tired or patient
    animal, as the scroll's horses stand at the roadside. Breathing, a slow ear droop and a tail swish."""
    Hb = info["Hb"]
    ang, qhead = head_down_angles(poser, info, cfg.get("head_low_z", 0.32) * Hb, tilt=35.0)

    def fn(t):
        pose = neutral(poser)
        w = 2 * math.pi * t / length
        breathe = math.sin(2 * math.pi * t / (length / 2))
        pose["hips_off"] = Vector((0.008 * Hb * math.sin(w), 0.0, -0.003 * Hb * (1 + breathe) / 2))
        pose["hips_rot"] = quat((0, 1, 0), 1.0 * math.sin(w))
        pose["fk"] = {b: quat((1, 0, 0), a + (1.5 * math.sin(w + 0.5) if b == "neck1" else 0)) for b, a in ang.items()}
        pose["fk"]["head"] = qmul(quat((0, 0, 1), 4 * math.sin(w + 1)), qhead)
        pose["fk"]["spine2"] = quat((1, 0, 0), 0.8 * breathe)
        pose["fk"]["ear.L"] = quat((0, 0, 1), 20 + 12 * bump(t, 3.0, 0.6))
        pose["fk"]["ear.R"] = quat((0, 0, 1), -20 - 12 * bump(t, 6.2, 0.6))
        sw = bump(t, 4.6, 0.8)
        pose["fk"]["tail1"] = quat((0, 0, 1), 3 * math.sin(w) + 14 * sw)
        pose["fk"]["tail2"] = quat((0, 0, 1), 3 * math.sin(w - 0.5) + 16 * sw)
        pose["fk"]["tail3"] = quat((0, 0, 1), 3 * math.sin(w - 1) + 14 * sw)
        return pose
    return fn, length


def walk_low_fn(poser, info, cfg, walk):
    """The walk with the head hanging low (the same legs and speed as walk, so the page moves it the same way)."""
    fn0, T = walk[0], walk[1]
    Hb = info["Hb"]
    ang, qhead = head_down_angles(poser, info, cfg.get("head_low_z", 0.32) * Hb + 0.05 * Hb, tilt=40.0)

    def fn(t):
        pose = fn0(t)
        nod = math.sin(4 * math.pi * t / T - 1.2)
        for b, a in ang.items():
            pose["fk"][b] = qmul(quat((1, 0, 0), a + (2.0 * nod if b == "neck1" else 0)), pose["fk"].get(b, Quaternion()))
        pose["fk"]["head"] = qmul(quat((1, 0, 0), -1.5 * nod), qhead)
        return pose
    return fn, T


def toe_for_joint(poser, leg, K, theta, phi):
    """The toe target that puts the upper end of the cannon (knee/carpus or hock) at K, for a cannon angle theta and a
    hoof/paw flexion phi (the inverse of Poser.solve_leg's chain toe -> fetlock -> knee)."""
    s = leg[-1]
    fore = leg[0] == "f"
    hoof = f"hoof_{'f' if fore else 'h'}.{s}"
    can = f"cannon_{'f' if fore else 'h'}.{s}"
    L3 = poser.len[can]
    fet0, toe0 = poser.rest[hoof]
    v = fet0 - toe0
    du, dw = rot_u((-v.y, v.z), phi)
    F = Vector((K.x, K.y + L3 * math.sin(theta), K.z - L3 * math.cos(theta)))
    return Vector((F.x - v.x, F.y + du, F.z - dw))


def lie_fn(poser, info, cfg, length=8.0, lift=0.0):
    """Lying on the chest (sternal), head up, breathing. By body plan (PLANS lie_mode):
    - default (equids, bovids): fore cannons folded back under the forearms with the knees on the ground in front,
      hind legs folded under the belly;
    - "kush" (camelids): the camel's kneel-down: forelegs folded tight, carpal pads on the ground just ahead of the
      chest, the cannons and feet folded back under it; hind legs in a flat Z (stifle forward beside the belly, hock on
      the ground under the hip, cannon and foot forward under the belly); the body rests on its sternal pad and the
      neck rises clear of the ground;
    - "sphinx" (canids): forelegs stretched forward along the ground, hind legs folded under the belly.
    lift: metres added to the body's height (mode_rig grounds the clip: the chest's midline rests on the ground)."""
    Hb = info["Hb"]
    P0 = info["P"]
    mode = P0.get("lie_mode", "fold")
    belly = P0["elbow"] * Hb * 0.92
    drop = belly - 0.03 * Hb - lift
    rest = {leg: leg_rest(poser, leg) for leg in LEGS}
    elbow0 = {s: poser.rest[f"forearm.{s}"][0] for s in ("L", "R")}
    hip0 = {s: poser.rest[f"femur.{s}"][0] for s in ("L", "R")}

    def fore_kush(leg):
        s = leg[-1]
        E = elbow0[s]
        L2 = poser.len[f"forearm.{s}"]
        ez = E.z - drop
        kz = 0.035 * Hb
        reach = math.sqrt(max(0.0, L2 * L2 - (ez - kz) ** 2)) * 0.96
        K = Vector((E.x * 0.95, E.y - reach, kz))
        th, ph = math.radians(92), math.radians(96)
        return toe_for_joint(poser, leg, K, th, ph), ph, th

    def hind_kush(leg):
        s = leg[-1]
        H = hip0[s]
        K = Vector((H.x * 1.05, H.y + 0.06 * Hb, 0.035 * Hb))
        th, ph = math.radians(-90), math.radians(-88)
        return toe_for_joint(poser, leg, K, th, ph), ph, th

    def fore_sphinx(leg):
        s = leg[-1]
        E = elbow0[s]
        L2 = poser.len[f"forearm.{s}"]
        ez = E.z - drop
        kz = 0.03 * Hb
        reach = math.sqrt(max(0.0, L2 * L2 - (ez - kz) ** 2)) * 0.97
        K = Vector((E.x * 0.9, E.y - reach, kz))
        th, ph = math.radians(-88), math.radians(-85)
        return toe_for_joint(poser, leg, K, th, ph), ph, th

    def fn(t):
        pose = neutral(poser)
        w = 2 * math.pi * t / length
        breathe = math.sin(2 * math.pi * t / (length / 2))
        pose["hips_off"] = Vector((0.0, 0.0, -drop + 0.004 * Hb * breathe))
        pose["hips_rot"] = quat((0, 1, 0), 4.0 if mode == "fold" else 2.0)
        if P0.get("lie_pitch"):   # degrees the forequarters rise (a camel rests high on its sternal pad)
            pose["hips_rot"] = qmul(quat((1, 0, 0), -P0["lie_pitch"]), pose["hips_rot"])
        legs = {}
        for leg in LEGS:
            toe0, th0 = rest[leg]
            fore = leg[0] == "f"
            if mode == "kush":
                legs[leg] = fore_kush(leg) if fore else hind_kush(leg)
                continue
            if mode == "sphinx" and fore:
                legs[leg] = fore_sphinx(leg)
                continue
            if fore:
                # the cannon folded back under the forearm, the knee in front on the ground, the hoof pointing back
                toe = Vector((toe0.x * 0.9, toe0.y + 0.18 * Hb, 0.02 * Hb))
                legs[leg] = (toe, math.radians(100), math.radians(95))
            else:
                # the hock on the ground behind the hip, the cannon along the ground, the hoof tucked forward under the belly
                # (kept inside it: a hoof peeking out from under a lowered barrel reads as a stray piece)
                toe = Vector((toe0.x * 0.85, toe0.y - P0.get("lie_hind_fwd", 0.16) * Hb, 0.08 * Hb))
                legs[leg] = (toe, math.radians(-65), math.radians(-95))
        pose["legs"] = legs
        look = math.sin(w + 0.3)
        raise_ = P0.get("lie_neck_raise", 10.0)   # degrees the neck lifts at its base (the camel's beard clears the ground)
        pose["fk"] = {
            "spine2": quat((1, 0, 0), 1.0 * breathe),
            "neck1": qmul(quat((1, 0, 0), -raise_), quat((0, 0, 1), 6 * look)),
            "neck2": qmul(quat((0, 0, 1), 5 * look), quat((1, 0, 0), -0.3 * (raise_ - 10))),
            "head": qmul(quat((1, 0, 0), 6 + 0.9 * (raise_ - 10) + 3 * math.sin(2 * w)), quat((0, 0, 1), 4 * look)),
            "ear.L": quat((0, 0, 1), 14 * bump(t, 2.2, 0.4)),
            "ear.R": quat((0, 0, 1), -14 * bump(t, 5.6, 0.4)),
            "tail1": quat((0, 0, 1), 10),
            "tail2": quat((0, 0, 1), 12),
            "tail3": quat((0, 0, 1), 10 + 6 * math.sin(w)),
        }
        return pose
    return fn, length


def chest_floor(rig, body, info, frame):
    """Lowest height of the trunk's underside along the midline (chest and belly, between the fore and hind legs) at a
    frame of the current action: where a lying animal rests on the ground."""
    bpy.context.scene.frame_set(frame)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    me = ev.to_mesh()
    idx = info["midline"]
    z = min((body.matrix_world @ me.vertices[i].co).z for i in idx)
    ev.to_mesh_clear()
    return z


# ---------------------------------------------------------------- tack and loads (built from the kit, bound to the rig)
# Each variant (animals/<type>.json "tack": {name: [pieces]}) becomes one skinned mesh "tack_<name>" in the GLB, drawn
# with one small palette texture (one colour per kit material: Messenger's palette atlas). Soft pieces (cloths, the
# collar) take their weights from the body under them; rigid pieces (frames, boxes, bundles) ride on one spine bone.

PALETTE = {  # true colours (web/src/palette.js shows the town's real colours, not the aged silk)
    "rope": "#c4ad84", "cloth_white": "#e6decb", "cloth_indigo": "#4f6081", "cloth_red": "#a85a4a",
    "cloth_dark": "#3e3a3c", "cloth_grey": "#8a9099", "timber": "#7a5a3e", "wood_dark": "#4b3626",
    "leather": "#5a3b28", "straw": "#c9b27a", "felt": "#b8a58a", "box": "#9a7a52", "iron": "#3a3a3a",
    "bundle_blue": "#6b7d92", "pink": "#c28b80", "cloth_ochre": "#b48a4e",
    "wicker": "#9b8155", "charcoal": "#2a2725", "crow": "#1c1c21", "beak": "#3a3634",
}
PAL_KEYS = list(PALETTE)
PAL_N = 5  # 5 x 5 cells


def palette_image(path=None):
    cell = 16
    size = cell * PAL_N
    buf = np.ones((size, size, 4), dtype=np.float32)
    for k, name in enumerate(PAL_KEYS):
        c = PALETTE[name].lstrip("#")
        rgb = [int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        cx, cy = k % PAL_N, k // PAL_N
        buf[size - (cy + 1) * cell:size - cy * cell, cx * cell:(cx + 1) * cell, :3] = rgb
    img = bpy.data.images.new("tack_palette", size, size, alpha=False)
    img.pixels.foreach_set(buf.reshape(-1))
    img.pack()
    return img


def palette_uv(mat):
    k = PAL_KEYS.index(mat) if mat in PALETTE else PAL_KEYS.index("rope")
    cx, cy = k % PAL_N, k // PAL_N
    return ((cx + 0.5) / PAL_N, 1 - (cy + 0.5) / PAL_N)


def tack_material(img):
    m = bpy.data.materials.get("tack") or bpy.data.materials.new("tack")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 1.0
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return m


def kit():
    import street_b1 as sb
    import song_kit as k
    sb.B = sb.Buckets()
    return sb, k


def ray_out(bvh, origin, d, far=3.0):
    """The body's surface along direction d from an origin inside it: the first hit going out (so another part of the
    body further along the ray, a head or a rump, is never taken)."""
    d = d.normalized()
    hit = bvh.ray_cast(origin, d, far)
    return hit[0]


def drape(sb, bvh, axis_z, y0, y1, a_max, mat, hem=None, ny=5, na=7, lift=0.018, thick=0.012, hang=True):
    """A cloth over the back between y0 and y1 (long axis), from the spine down each side to a_max degrees from the
    top, conforming to the body; below the body's widest point it hangs straight down. A hem band in `hem`."""
    rows = []
    for j in range(ny + 1):
        y = y0 + (y1 - y0) * j / ny
        col = []
        for i in range(-na, na + 1):
            a = math.radians(a_max) * i / na
            d = Vector((math.sin(a), 0, math.cos(a)))
            p = ray_out(bvh, Vector((0, y, axis_z)), d)
            if p is None:
                p = Vector((0, y, axis_z)) + d * 0.2
            col.append(p + d * lift)
        if hang:   # past the widest point on each side, hang straight down
            for half in (range(na, 2 * na + 1), range(na, -1, -1)):
                idx = list(half)
                xmax, prev = 0.0, None
                for k_ in idx:
                    p = col[k_]
                    if prev is not None and abs(p.x) < xmax - 0.002:
                        step = (p - prev).length
                        col[k_] = Vector((math.copysign(xmax, p.x if p.x else (1 if idx[-1] > na else -1)), p.y, prev.z - step))
                        p = col[k_]
                    xmax = max(xmax, abs(p.x))
                    prev = p
        rows.append(col)
    m = len(rows[0])
    top = [v for r in rows for v in r]
    faces = []
    for j in range(ny):
        for i in range(m - 1):
            a = j * m + i
            faces.append((a, a + 1, a + m + 1, a + m))
    # the inner sheet (offset toward the body) and the border strip: the cloth has thickness
    inner = []
    for j, r in enumerate(rows):
        for i, p in enumerate(r):
            a = math.radians(a_max) * (i - (m - 1) / 2) / ((m - 1) / 2)
            inner.append(p - Vector((math.sin(a), 0, math.cos(a))) * thick)
    n = len(top)
    vs = top + inner
    fs = faces + [tuple(reversed([q + n for q in f])) for f in faces]
    ring = [j * m for j in range(ny + 1)] + [ny * m + i for i in range(1, m)] + [j * m + m - 1 for j in range(ny - 1, -1, -1)] + [i for i in range(m - 2, 0, -1)]
    for a_, b_ in zip(ring, ring[1:] + ring[:1]):
        fs.append((b_, a_, a_ + n, b_ + n))
    sb.B.add(mat, False, vs, fs)
    if hem:   # a band along the two hanging edges
        for i in (0, m - 1):
            pts = [rows[j][i] for j in range(ny + 1)]
            out = Vector((1 if i else -1, 0, 0)) * -1
            band = [p + Vector((0, 0, 0.0)) for p in pts]
            vs2 = [p + Vector((math.copysign(0.004, p.x), 0, 0)) for p in band] + [p + Vector((math.copysign(0.004, p.x), 0, 0.06)) for p in band]
            k2 = len(band)
            fs2 = [(q, q + 1, q + 1 + k2, q + k2) if i else (q + 1, q, q + k2, q + 1 + k2) for q in range(k2 - 1)]
            sb.B.add(hem, False, vs2, fs2)
    return rows


def girth(sb, bvh, axis_z, y, mat="leather", w=0.045, lift=0.012, n=20):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        d = Vector((math.sin(a), 0, math.cos(a)))
        p = ray_out(bvh, Vector((0, y, axis_z)), d)
        if p is not None:
            pts.append(p + d * lift)
    vs = [p + Vector((0, -w / 2, 0)) for p in pts] + [p + Vector((0, w / 2, 0)) for p in pts]
    k_ = len(pts)
    fs = [(i, (i + 1) % k_, (i + 1) % k_ + k_, i + k_) for i in range(k_)]
    sb.B.add(mat, False, vs, fs)


def collar(sb, k, co, centre, axis, mat="felt", hames="timber", tube=0.045, n=14, reach=0.4):
    """A padded collar round the neck: the neck's cross-section in the plane across `axis` at `centre` (the outermost
    body vertex in each of n directions), padded out and swept as a tube; two wooden hames on its sides carry the
    trace hooks."""
    axis = axis.normalized()
    u = axis.cross(Vector((1, 0, 0))).normalized()
    v = Vector((1, 0, 0))
    c = np.array(centre)
    rel = co - c
    dist_ax = rel @ np.array(axis)
    near = (np.abs(dist_ax) < 0.035) & (np.linalg.norm(rel, axis=1) < reach)
    pts = rel[near] - np.outer(dist_ax[near], np.array(axis))
    pu, pv = pts @ np.array(u), pts @ np.array(v)
    ang = np.arctan2(pv, pu)
    rad = np.hypot(pu, pv)
    ring = []
    for i in range(n):
        a = -math.pi + 2 * math.pi * (i + 0.5) / n
        da = np.abs((ang - a + math.pi) % (2 * math.pi) - math.pi)
        sel = da < math.pi / n * 1.6
        r = float(rad[sel].max()) if sel.any() else float(np.median(rad)) if len(rad) else 0.12
        d = u * math.cos(a) + v * math.sin(a)
        ring.append(Vector(centre) + d * (r + tube * 0.85))
    pts_ = ring + ring[:2]
    sb.tube(mat, False, pts_, [tube] * len(pts_), segs=6)
    for side in (1, -1):
        side_pts = sorted(ring, key=lambda p: -side * p.x)[:4]
        side_pts.sort(key=lambda p: p.z)
        for a_, b_ in zip(side_pts, side_pts[1:]):
            k.beam(hames, False, a_ + Vector((side * tube * 0.9, 0, 0)), b_ + Vector((side * tube * 0.9, 0, 0)), 0.035, 0.03, 0.006)
    return ring


def pack_frame(sb, k, top_y, top_z, half_w, length, mat="timber"):
    """A sawbuck pack saddle on the back: two crossed pairs of bars, front and rear, joined by side boards."""
    for y in (top_y - length / 2, top_y + length / 2):
        for s in (1, -1):
            k.beam(mat, False, Vector((s * half_w * 0.95, y, top_z - 0.13)), Vector((-s * 0.06, y, top_z + 0.09)), 0.04, 0.04, 0.008)
    for s in (1, -1):
        k.beam(mat, False, Vector((s * half_w * 0.92, top_y - length / 2 - 0.05, top_z - 0.12)),
               Vector((s * half_w * 0.92, top_y + length / 2 + 0.05, top_z - 0.12)), 0.03, 0.09, 0.008)


def soft_roll(sb, mat, p0, p1, r, squash=0.8, segs=7, rng=None, lump=0.08):
    """A soft cloth bundle or sack lying from p0 to p1: rounded, bellied ends, a little lumpy, squashed by its load
    (no straight edge, no box)."""
    import random as _r
    rng = rng or _r.Random(7)
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0)
    L = ax.length
    ax.normalize()
    side = ax.cross(Vector((0, 0, 1)))
    if side.length < 1e-6:
        side = Vector((1, 0, 0))
    side.normalize()
    up = side.cross(ax).normalized()
    prof = [(0.0, 0.15), (0.07, 0.68), (0.25, 0.97), (0.5, 1.02), (0.75, 0.97), (0.93, 0.68), (1.0, 0.15)]
    vs, fs = [], []
    for t, f in prof:
        c = p0 + ax * (L * t)
        for i in range(segs):
            a = 2 * math.pi * i / segs
            rr = r * f * (1 + rng.uniform(-lump, lump))
            vs.append(c + side * math.cos(a) * rr + up * math.sin(a) * rr * squash)
    m = len(prof)
    for j in range(m - 1):
        for i in range(segs):
            a, b = j * segs + i, j * segs + (i + 1) % segs
            fs.append((a, b, b + segs, a + segs))
    fs.append(tuple(reversed(range(segs))))
    fs.append(tuple(range((m - 1) * segs, m * segs)))
    sb.B.add(mat, False, vs, fs)


def rope_band(sb, centre, ax, r, squash=0.8, w=0.022, segs=8):
    """A rope tied round a roll at `centre` (axis ax, radius r)."""
    ax = Vector(ax).normalized()
    side = ax.cross(Vector((0, 0, 1)))
    if side.length < 1e-6:
        side = Vector((1, 0, 0))
    side.normalize()
    up = side.cross(ax).normalized()
    pts = [centre + side * math.cos(2 * math.pi * i / segs) * r + up * math.sin(2 * math.pi * i / segs) * r * squash for i in range(segs + 2)]
    sb.tube("rope", False, pts, [w] * len(pts), segs=3)


def side_bundles(sb, k, top_y, top_z, half_w, length, mat="cloth_white", drop=0.35, rng=None):
    """Two soft bundles hanging on the sides from the frame, each tied with two rope bands and slung on a rope."""
    import random as _r
    rng = rng or _r.Random(5)
    r = drop * 0.42
    for s in (1, -1):
        c = Vector((s * (half_w + r * 0.7), top_y, top_z - drop * 0.5))
        a, b = c - Vector((0, length * 0.62, 0)), c + Vector((0, length * 0.62, 0))
        soft_roll(sb, mat, a, b, r, 0.95, rng=rng)
        for f in (-0.3, 0.32):
            rope_band(sb, c + Vector((0, length * f, 0)), (0, 1, 0), r * 1.03, 0.95)
        for f in (-0.3, 0.32):
            q = c + Vector((0, length * f, 0))
            k.beam("rope", False, Vector((s * half_w * 0.75, q.y, top_z - 0.06)), q + Vector((-s * r * 0.4, 0, r * 0.9)), 0.022, 0.022, 0)


def top_bundle(sb, k, top_y, top_z, length, mat="cloth_indigo", w=0.3, h=0.2):
    """A soft roll lying across the top of the load, tied twice."""
    c = Vector((0, top_y, top_z + h / 2 + 0.04))
    soft_roll(sb, mat, c - Vector((w * 1.25, 0, 0)), c + Vector((w * 1.25, 0, 0)), h * 0.6, 0.75)
    for f in (-0.55, 0.55):
        rope_band(sb, c + Vector((w * f, 0, 0)), (1, 0, 0), h * 0.62, 0.75)


def saddle(sb, k, top_y, top_z, half_w, length, mat="leather", rng=None):
    """A Song riding saddle on the cloth: a padded seat with a raised pommel and cantle (arched boards) and
    stirrup leathers with iron stirrups."""
    seat = top_z + 0.03
    k.beam(mat, False, Vector((0, top_y - length * 0.45, seat)), Vector((0, top_y + length * 0.45, seat)), half_w * 1.5, 0.05, 0.02)
    for y, h in ((top_y - length * 0.48, 0.09), (top_y + length * 0.5, 0.07)):
        pts = [Vector((half_w * 0.85 * math.cos(a), y, seat + h * math.sin(a))) for a in np.linspace(0.15, math.pi - 0.15, 7)]
        for a_, b_ in zip(pts, pts[1:]):
            k.beam("wood_dark", False, a_, b_, 0.03, 0.05, 0.008)
    for s in (1, -1):
        hang = Vector((s * half_w * 1.05, top_y - length * 0.1, seat - 0.02))
        foot = hang + Vector((s * 0.05, 0, -0.55))
        k.beam(mat, False, hang, foot, 0.035, 0.008, 0)
        sb.cyl("iron", False, foot - Vector((0, 0.06, 0.02)), foot + Vector((0, 0.06, -0.02)), 0.012, segs=5)


def camel_pack(sb, k, y_front, y_rear, top_z, half_w, mats, sheaf=False):
    """The caravan camel's load between the humps: a wooden frame (two ladders along the sides on cross bars),
    boxes and bundles hung on both sides, a bundle on top, a cloth hanging down one side; optionally a fan-shaped
    sheaf standing up from the front bundle."""
    ym = (y_front + y_rear) / 2
    L = abs(y_rear - y_front)
    for y in (y_front + 0.04, y_rear - 0.04):
        k.beam("timber", False, Vector((half_w + 0.05, y, top_z - 0.05)), Vector((-half_w - 0.05, y, top_z - 0.05)), 0.05, 0.05, 0.01)
    for s in (1, -1):
        for z in (top_z - 0.08, top_z - 0.55):
            k.beam("timber", False, Vector((s * (half_w + 0.06), y_front - 0.05, z)), Vector((s * (half_w + 0.06), y_rear + 0.05, z)), 0.04, 0.05, 0.01)
        for y in (y_front + 0.02, y_rear - 0.02):
            k.beam("timber", False, Vector((s * (half_w + 0.06), y, top_z - 0.02)), Vector((s * (half_w + 0.1), y, top_z - 0.62)), 0.04, 0.04, 0.01)
        # a box and a bundle on each side
        c = Vector((s * (half_w + 0.26), ym - L * 0.1, top_z - 0.42))
        k.beam(mats[0], False, c - Vector((0, L * 0.34, 0)), c + Vector((0, L * 0.34, 0)), 0.34, 0.58, 0.04)
        for f in (-0.2, 0.2):
            q = c + Vector((0, L * f, 0))
            k.beam("rope", False, q - Vector((0, 0.015, 0)), q + Vector((0, 0.015, 0)), 0.36, 0.6, 0.04)
        c2 = Vector((s * (half_w + 0.28), ym + L * 0.3, top_z - 0.2))
        soft_roll(sb, mats[1], c2 - Vector((0, L * 0.26, 0)), c2 + Vector((0, L * 0.26, 0)), 0.2, 1.0)
        rope_band(sb, c2, (0, 1, 0), 0.205, 1.0)
    # the hanging cloth on the near (left) side
    c = Vector((half_w + 0.45, ym + 0.05, top_z - 0.45))
    k.beam(mats[2], False, c + Vector((0, 0, 0.35)), c + Vector((0.02, 0.0, -0.55)), 0.02, 0.18, 0.004)
    top_bundle(sb, k, ym, top_z, L, mats[1], w=half_w + 0.1, h=0.22)
    if sheaf:
        base = Vector((0, y_front - 0.02, top_z + 0.3))
        for i in range(7):
            a = math.radians(-35 + 70 * i / 6)
            tip = base + Vector((0.6 * math.sin(a), -0.08, 0.75 * math.cos(a)))
            k.beam("straw", False, base, tip, 0.05, 0.03, 0.006)
        k.beam("rope", False, base + Vector((-0.06, 0, 0.08)), base + Vector((0.06, 0, 0.08)), 0.08, 0.06, 0.01)


def bake_tack(sb, name, mat):
    """sb.B buckets -> one mesh object, every face mapped to its kit material's palette cell."""
    vs, fs, uvs = [], [], []
    for (mname, _), b in sb.B.data.items():
        base = len(vs)
        vs += [tuple(v) for v in b["v"]]
        uv = palette_uv(mname)
        for f in b["f"]:
            fs.append(tuple(i + base for i in f))
            uvs.append([uv] * len(f))
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    me.validate()
    uvl = me.uv_layers.new(name="UVMap")
    for poly, row in zip(me.polygons, uvs):
        for k_, li in enumerate(poly.loop_indices):
            uvl.data[li].uv = row[k_ % len(row)]
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    sb.B = sb.Buckets()
    return ob


def bind_tack(tack, body, rig, rigid_bone=None, soft=True):
    """Skin a tack mesh: soft pieces average the weights of the nearest body vertices; rigid ones follow one bone."""
    from mathutils.kdtree import KDTree
    names = [g.name for g in body.vertex_groups]
    tack.vertex_groups.clear()
    groups = {nm: tack.vertex_groups.new(name=nm) for nm in names}
    if rigid_bone:
        groups[rigid_bone].add(list(range(len(tack.data.vertices))), 1.0, "REPLACE")
    else:
        bco = verts(body)
        kd = KDTree(len(bco))
        for i, c in enumerate(bco):
            kd.insert(Vector(c), i)
        kd.balance()
        Wb = {}
        for v in body.data.vertices:
            Wb[v.index] = {body.vertex_groups[g.group].name: g.weight for g in v.groups}
        for v in tack.data.vertices:
            acc = {}
            near = kd.find_n(v.co, 6)
            tot = 0.0
            for co_, idx, d in near:
                w = 1.0 / max(d, 1e-3) ** 2
                tot += w
                for nm, wt in Wb[idx].items():
                    acc[nm] = acc.get(nm, 0.0) + wt * w
            top = sorted(acc.items(), key=lambda kv: -kv[1])[:4]
            s_ = sum(w for _, w in top) or 1.0
            for nm, w in top:
                groups[nm].add([v.index], w / s_, "REPLACE")
    tack.parent = rig
    mod = tack.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    for p in tack.data.polygons:
        p.use_smooth = False


def breast_strap(sb, k, bvh, y, z, Hb, mat="leather", w=0.05, lift=0.014, tassels=5, tassel_mat="cloth_red", n=18):
    """A breast strap round the front of the chest at height z, from one shoulder to the other (cast onto the body from
    a centre inside the chest at depth y), with harness tassels hanging from it."""
    c = Vector((0, y, z))
    pts = []
    for i in range(n + 1):
        a = math.radians(-115 + 230 * i / n)
        d = Vector((math.sin(a), -math.cos(a), 0))
        p = ray_out(bvh, c, d, 3.0)
        if p is not None:
            pts.append(p + d * lift)
    if len(pts) < 3:
        return pts
    vs = [p + Vector((0, 0, -w / 2)) for p in pts] + [p + Vector((0, 0, w / 2)) for p in pts]
    m = len(pts)
    sb.B.add(mat, False, vs, [(i, i + 1, i + 1 + m, i + m) for i in range(m - 1)])
    # tassels: a knot and a red tuft hanging from the strap's lower edge
    for j in range(tassels):
        p = pts[int((j + 0.5) * (m - 1) / tassels)]
        top = p + Vector((0, 0, -w / 2))
        sb.cyl(tassel_mat, False, top, top + Vector((0, 0, -0.07 * Hb / 1.2)), 0.012, 0.035, segs=5)
    return pts


def nose_rope(sb, start, end, sag=0.08, r=0.012, n=8, mat="rope"):
    """A slack rope from start to end (the nose ring to the chest)."""
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append(start.lerp(end, t) + Vector((0, 0, -sag * 4 * t * (1 - t))))
    sb.tube(mat, False, pts, [r] * len(pts), segs=4)


def panniers(sb, k, top_y, top_z, half_w, length, Hb, mat="wicker", load="charcoal", rise=0.22, rng=None):
    """Two wicker panniers slung on the sides of a pack saddle, heaped with a dark lumpy load (charcoal) that rises above
    the back: round baskets with rim rings and uprights, the load as piled lumps on each and across the top."""
    import random as _r
    rng = rng or _r.Random(11)
    r = 0.15 * Hb
    h = 0.42 * Hb
    for s in (1, -1):
        cx, cy, z0 = s * (half_w + r * 0.75), top_y, top_z - 0.5 * Hb
        sb.lathe(mat, False, (cx, cy, z0), [(r * 0.78, 0.0), (r * 0.95, h * 0.45), (r * 1.04, h)], segs=9)
        for zz in (0.05, 0.5, 0.97):
            rr = r * (0.8 + 0.24 * zz) + 0.008
            sb.cyl("rope", False, (cx, cy, z0 + h * zz - 0.012), (cx, cy, z0 + h * zz + 0.012), rr, segs=9, caps=False)
        for i in range(6):
            a = 2 * math.pi * (i + 0.5) / 6
            p0 = Vector((cx + math.cos(a) * r * 0.8, cy + math.sin(a) * r * 0.8, z0))
            p1 = Vector((cx + math.cos(a) * r * 1.06, cy + math.sin(a) * r * 1.06, z0 + h + 0.02))
            k.beam("wood_dark", False, p0, p1, 0.018, 0.018, 0)
        # the heap: lumps rising above the rim, higher toward the animal's back
        for j in range(11):
            a = rng.uniform(0, 2 * math.pi)
            d = rng.uniform(0, r * 0.75)
            x = cx + math.cos(a) * d - s * 0.02
            y = cy + math.sin(a) * d
            zz = z0 + h + rng.uniform(0.0, rise * Hb) * (1.0 - d / (r * 1.4))
            k.rock(load, x, y, zz, rng.uniform(0.045, 0.075) * Hb / 1.0, rng, flat=0.8)
    # across the top of the saddle
    for j in range(7):
        x = rng.uniform(-half_w * 0.7, half_w * 0.7)
        y = top_y + rng.uniform(-length * 0.35, length * 0.35)
        k.rock(load, x, y, top_z + rng.uniform(0.04, 0.12) * Hb, rng.uniform(0.05, 0.08) * Hb, rng, flat=0.8)


def build_tack(cfg, body, rig, info):
    """Every variant in cfg['tack'] -> a skinned mesh 'tack_<name>'. Returns ({name: object}, {name: notes})."""
    specs = cfg.get("tack") or {}
    if not specs:
        return {}, {}
    sb, k = kit()
    img = palette_image()
    mat = tack_material(img)
    bvh = bvh_of(body)
    Hb = info["Hb"]
    co = verts(body)
    bones = rig.data.bones
    out, notes = {}, {}
    # the saddle line: the back's lowest point between withers and croup
    yf, yh = info["yf"], info["yh"]
    best = None
    for t in np.linspace(0.25, 0.75, 21):
        y = yf + (yh - yf) * t
        z = top_at(bvh, 0.0, y)
        if z is not None and (best is None or z < best[1]):
            best = (y, z)
    sy, sz = best
    axis_z = 0.72 * Hb
    halfw = float(np.abs(co[np.abs(co[:, 1] - sy) < 0.05 * Hb, 0]).max())
    for name, pieces in specs.items():
        rigid = []
        for pc in pieces:
            kind = pc["kind"]
            if kind == "cloth":
                y0 = sy + pc.get("span", [-0.22, 0.22])[0] * Hb
                y1 = sy + pc.get("span", [-0.22, 0.22])[1] * Hb
                drape(sb, bvh, axis_z, y0, y1, pc.get("down", 70), pc.get("mat", "cloth_dark"), pc.get("hem"))
            elif kind == "girth":
                gy = sy + pc.get("at", -0.12) * Hb
                girth(sb, bvh, axis_z, gy, pc.get("mat", "leather"))
                if pc.get("traces"):   # where a cart's traces hook onto the girth band: its sides at mid-barrel
                    gl = lambda v: [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]  # noqa: E731
                    zt = pc.get("trace_z", 0.6) * Hb
                    pl = ray_out(bvh, Vector((0, gy, zt)), Vector((1, 0, 0)), 3.0)
                    pr = ray_out(bvh, Vector((0, gy, zt)), Vector((-1, 0, 0)), 3.0)
                    if pl is not None and pr is not None:
                        notes.setdefault(name, {})["girth_traces"] = {"trace_girth_l": gl(pl + Vector((0.02, 0, 0))),
                                                                      "trace_girth_r": gl(pr - Vector((0.02, 0, 0)))}
            elif kind == "breast_strap":
                sh = bones["scapula.L"].tail_local
                breast_strap(sb, k, bvh, sh.y + pc.get("back", 0.08) * Hb, pc.get("z", 0.62) * Hb, Hb, pc.get("mat", "leather"),
                             tassels=pc.get("tassels", 5))
            elif kind == "nose_rope":
                mz = info["muzzle"]
                start = Vector((0, mz.y + 0.03 * Hb, mz.z - 0.03 * Hb))
                sh = bones["scapula.L"].tail_local
                end = Vector((0, sh.y - 0.12 * Hb, pc.get("end_z", 0.55) * Hb))
                end = (ray_out(bvh, Vector((0, sh.y + 0.1 * Hb, end.z)), Vector((0, -1, 0)), 3.0) or end) + Vector((0, -0.02, 0))
                nose_rope(sb, start, end, sag=pc.get("sag", 0.1) * Hb)
            elif kind == "collar":
                n1 = bones["neck1"]
                h, t = Vector(n1.head_local), Vector(n1.tail_local)
                c = h.lerp(t, pc.get("at", 0.25))
                ring = collar(sb, k, co, c, t - h, pc.get("mat", "felt"))
                gl = lambda v: [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]  # noqa: E731
                tl_, tr_ = max(ring, key=lambda p: p.x), min(ring, key=lambda p: p.x)
                notes.setdefault(name, {})["traces"] = {"trace_l": gl(tl_ + Vector((0.04, 0, 0))), "trace_r": gl(tr_ - Vector((0.04, 0, 0))),
                                                        "collar": gl((tl_ + tr_) / 2)}
            else:
                rigid.append(pc)
        soft_ob = bake_tack(sb, f"tack_{name}", mat) if sb.B.data else None
        if soft_ob is not None and len(soft_ob.data.vertices):
            bind_tack(soft_ob, body, rig)
        for pc in rigid:
            kind = pc["kind"]
            ln = pc.get("length", 0.36) * Hb
            if kind == "pack_frame":
                pack_frame(sb, k, sy, sz + 0.04, halfw, ln, pc.get("mat", "timber"))
            elif kind == "side_bundles":
                side_bundles(sb, k, sy, sz + 0.02, halfw, ln, pc.get("mat", "cloth_white"), pc.get("drop", 0.35) * Hb)
            elif kind == "top_bundle":
                top_bundle(sb, k, sy, sz + 0.06, ln, pc.get("mat", "cloth_indigo"))
            elif kind == "saddle":
                saddle(sb, k, sy, sz + 0.02, halfw, ln, pc.get("mat", "leather"))
            elif kind == "panniers":
                panniers(sb, k, sy, sz + 0.05, halfw, ln, Hb, pc.get("mat", "wicker"), pc.get("load", "charcoal"), pc.get("rise", 0.22))
            elif kind == "camel_pack":
                # between the humps: the frame spans from the front hump's back to the rear hump's front
                camel_pack(sb, k, sy - pc.get("half", 0.22) * Hb, sy + pc.get("half", 0.22) * Hb, sz + 0.05, halfw,
                           pc.get("mats", ["box", "bundle_blue", "pink"]), pc.get("sheaf", False))
        rigid_ob = bake_tack(sb, f"tack_{name}_rigid", mat) if sb.B.data else None
        if rigid_ob is not None:
            sp = "spine2" if sy < (bones["spine2"].head_local.y) else "spine1"
            bind_tack(rigid_ob, body, rig, rigid_bone=sp)
            if soft_ob is not None:
                # one object per variant: join the rigid part into the soft one (both skinned, groups by name)
                bpy.ops.object.select_all(action="DESELECT")
                rigid_ob.select_set(True)
                soft_ob.select_set(True)
                bpy.context.view_layer.objects.active = soft_ob
                bpy.ops.object.join()
            else:
                soft_ob = rigid_ob
                soft_ob.name = f"tack_{name}"
        soft_ob.name = f"tack_{name}"
        soft_ob.data.name = f"tack_{name}"
        out[name] = soft_ob
        notes.setdefault(name, {}).update(node=f"tack_{name}", triangles=sum(len(p.vertices) - 2 for p in soft_ob.data.polygons))
    seat_y = sy + cfg.get("seat_back", 0.0)
    for name, ob in out.items():
        z = top_at(bvh_of(ob, verts(ob)), 0.0, seat_y)
        notes[name]["seat_m"] = round(float(z if z is not None else sz), 4)
    return out, notes


# ---------------------------------------------------------------- review frames, export, measures

def bone_sticks(rig, name="sticks"):
    """A red stick mesh along every deform bone at rest (review renders only)."""
    vs, fs = [], []
    for b in rig.data.bones:
        h, t = Vector(b.head_local), Vector(b.tail_local)
        d = t - h
        if d.length < 1e-6:
            continue
        side = d.cross(Vector((0, 0, 1)) if abs(d.normalized().z) < 0.9 else Vector((1, 0, 0))).normalized() * 0.012
        up = d.cross(side).normalized() * 0.012
        i = len(vs)
        vs += [h + side, h - side, h + up, h - up, t]
        fs += [(i, i + 2, i + 4), (i + 2, i + 1, i + 4), (i + 1, i + 3, i + 4), (i + 3, i, i + 4)]
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in vs], [], fs)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    m = bpy.data.materials.new("stick")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.05, 0.05, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.9, 0.05, 0.05, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.0
    me.materials.append(m)
    return ob


def ghost(body):
    """Make the body see-through for the rig check render."""
    for m in body.data.materials:
        if not m or not m.use_nodes:
            continue
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Alpha"].default_value = 0.35
        m.surface_render_method = "BLENDED"


def render_clip_frames(rig, body, clips, out_dir, name, n=8):
    """One row of n frames per clip and view (side, three-quarter), composed per clip into <out_dir>/<clip>.png."""
    cam = bpy.context.scene.camera
    Hb = 1.0
    co = verts(body)
    size = float(max(co[:, 1].max() - co[:, 1].min(), co[:, 2].max()))
    sheets = []
    for clip, act in clips.items():
        rig.animation_data.action = act
        f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
        rows = []
        for vi, (az, el, ortho) in enumerate(((0, 3, size * 1.35), (38, 16, None))):
            row = []
            for k in range(n):
                f = f0 + round((f1 - f0) * k / n)
                bpy.context.scene.frame_set(f)
                aim(cam, (0, 0, size * 0.42), az, el, size * 3.4, ortho)
                p = os.path.join(out_dir, f"_f_{clip}_{vi}_{k}.png")
                render_to(p)
                row.append(p)
            rows.append(row)
        out = os.path.join(out_dir, f"{clip}.png")
        compose(rows, out)
        for row in rows:
            for p in row:
                os.remove(p)
        sheets.append(out)
    return sheets


def measures(rig, body, info, cfg, walk):
    """What the page needs (rig.json), in glTF/three.js model space: x = the animal's left... (Blender x),
    y up (Blender z), z forward (Blender -y)."""
    co = verts(body)
    gl = lambda v: [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]  # noqa: E731
    Hb = info["Hb"]
    bones = {b.name: b for b in rig.data.bones}
    # saddle: on the back's top surface at its lowest point between the withers and the croup
    legs, _ = low_legs(co)
    yf, yh = info["yf"], info["yh"]
    best = None
    bvh = bvh_of(body)
    for t in np.linspace(0.25, 0.75, 21):
        y = yf + (yh - yf) * t
        z = top_at(bvh, 0.0, y)
        if z is not None and (best is None or z < best[1]):
            best = (y, z)
    # the rider sits a little behind the back's lowest point on small animals (a donkey is ridden on its loins)
    sy_ = best[0] + cfg.get("seat_back", 0.0)
    saddle = Vector((0, sy_, top_at(bvh, 0.0, sy_) or best[1]))
    best = (sy_, saddle.z)
    sb_ = "spine1" if best[0] > (bones["spine1"].head_local.y + bones["spine1"].tail_local.y) / 2 else "spine2"
    if best[0] < bones["spine2"].head_local.y:
        sb_ = "spine2"
    b = bones[sb_]
    local = b.matrix_local.inverted() @ saddle
    # harness: the collar sits round the neck root, in front of the withers, at about the point of the shoulder
    nr = bones["neck1"].head_local
    collar = Vector((0, nr.y - 0.04 * Hb, info["P"]["shoulder"] * Hb + 0.12 * Hb))
    tw = abs(bones["scapula.L"].tail_local.x) + 0.05 * Hb
    yy = bones["neck1"].head_local.y - 0.1 * Hb
    yoke = Vector((0, yy, top_at(bvh, 0.0, yy) or collar.z + 0.2 * Hb))
    fore_toe = (bones["hoof_f.L"].tail_local + bones["hoof_f.R"].tail_local) / 2
    hind_toe = (bones["hoof_h.L"].tail_local + bones["hoof_h.R"].tail_local) / 2
    _, T, S = walk
    return {
        "length_m": round(float(co[:, 1].max() - co[:, 1].min()), 3),
        "height_m": round(float(top_at(bvh, 0.0, bones["scapula.L"].head_local.y) or Hb), 3),
        "back_m": round(Hb, 3),
        "top_m": round(float(co[:, 2].max()), 3),
        "width_m": round(float(co[:, 0].max() - co[:, 0].min()), 3),
        "hoof_span_m": round(float(hind_toe.y - fore_toe.y), 3),
        "walk": {"clip": "walk", "cycle_s": round(T, 3), "stride_m": round(S, 3), "speed_mps": round(S / T, 3),
                 "footfall": "lateral four-beat: left hind, left fore, right hind, right fore"},
        "saddle": {"bone": sb_, "offset": [round(local.x, 4), round(local.y, 4), round(local.z, 4)], "rest": gl(saddle)},
        "harness": {"collar": gl(collar), "trace_l": gl(collar + Vector((tw, 0.02 * Hb, -0.05 * Hb))),
                    "trace_r": gl(collar + Vector((-tw, 0.02 * Hb, -0.05 * Hb))), "bone": "chest",
                    "yoke": gl(yoke)},
        "head_bone": "head", "hoof_bones": ["hoof_f.L", "hoof_f.R", "hoof_h.L", "hoof_h.R"],
    }


def export_glb(rig, objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in [rig] + objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True,
                              export_apply=False, export_animations=True, export_animation_mode="ACTIONS",
                              export_force_sampling=True, export_frame_range=False, export_skins=True,
                              export_morph=False, export_cameras=False, export_lights=False,
                              export_reset_pose_bones=True, export_optimize_animation_size=True)


def tone_body(body, tone, out_png):
    """Recolour the body's base-colour texture: hue shift (degrees), saturation and value multipliers, in HSV, on every
    pixel (a whole-coat adjustment: the ox's orange toward the painting's yellow-dun, a white variant of the horse).
    The toned image is saved to out_png and swapped into the material, so the exporter writes it."""
    mats = [m for m in body.data.materials if m and m.use_nodes]
    for m in mats:
        tex = next((n for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image), None)
        if not tex:
            continue
        img = tex.image
        w, h = img.size
        px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
        rgb = px[:, :3]
        mx, mn = rgb.max(1), rgb.min(1)
        v = mx
        d = mx - mn
        s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
        hh = np.zeros_like(mx)
        r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
        nz = d > 1e-6
        rm = nz & (mx == r)
        gm = nz & (mx == g) & ~rm
        bm = nz & ~rm & ~gm
        hh[rm] = ((g - b)[rm] / d[rm]) % 6
        hh[gm] = ((b - r)[gm] / d[gm]) + 2
        hh[bm] = ((r - g)[bm] / d[bm]) + 4
        hh = (hh / 6 + tone.get("hue", 0) / 360.0) % 1.0
        s = np.clip(s * tone.get("saturation", 1.0), 0, 1)
        v = np.clip(v * tone.get("value", 1.0) + tone.get("lift", 0.0), 0, 1)
        i = np.floor(hh * 6).astype(int) % 6
        f = hh * 6 - np.floor(hh * 6)
        p_ = v * (1 - s)
        q_ = v * (1 - f * s)
        t_ = v * (1 - (1 - f) * s)
        out = np.zeros_like(rgb)
        for k, (a, b_, c) in enumerate(((v, t_, p_), (q_, v, p_), (p_, v, t_), (p_, q_, v), (t_, p_, v), (v, p_, q_))):
            sel = i == k
            out[sel, 0], out[sel, 1], out[sel, 2] = a[sel], b_[sel], c[sel]
        px[:, :3] = out
        new = bpy.data.images.new(img.name + "_toned", w, h, alpha=False)
        new.pixels.foreach_set(px.reshape(-1))
        new.filepath_raw = out_png
        new.file_format = "PNG"
        new.save()
        new.source = "FILE"
        new.reload()
        tex.image = new
        log(f"RIG tone: {tone} -> {out_png}")


def mode_rig(cfg_path, in_glb, out_glb, rig_json, frames_dir):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    os.makedirs(frames_dir, exist_ok=True)
    reset()
    bpy.context.scene.render.fps = FPS     # the glTF exporter turns frames into seconds at the scene's rate
    cam = setup_render((480, 400))
    body = import_body(in_glb, cfg["name"])
    if cfg.get("tone"):
        tone_body(body, cfg["tone"], os.path.join(os.path.dirname(out_glb), f"{cfg['name']}_body_toned.png"))
    scale, head_low = normalise(body, cfg.get("forward"), cfg["back_m"])
    co = verts(body)
    n_tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
    log(f"RIG {cfg['name']}: {len(co)} verts, {n_tris} tris, scale {scale:.3f}, size {np.round(co.max(0) - co.min(0), 3).tolist()}")
    J, info = fit(co, cfg["plan"], cfg.get("joints"), bvh_of(body))
    Hb_ = info["Hb"]
    info["midline"] = [int(i) for i in np.where((np.abs(co[:, 0]) < 0.06 * Hb_) & (co[:, 1] > info["yf"] - 0.12 * Hb_)
                                                 & (co[:, 1] < info["yh"]) & (co[:, 2] > 0.25 * Hb_) & (co[:, 2] < 0.75 * Hb_))[0]]
    rig = build_armature(J, f"{cfg['name']}_rig")
    for o in (body,):
        for p in o.data.polygons:
            p.use_smooth = True
    skin(body, rig, info)
    tack, tack_notes = build_tack(cfg, body, rig, info)
    poser = Poser(rig, info)
    clips = {}
    walk = walk_fn(poser, info, cfg)
    makers = {
        "idle": lambda: idle_fn(poser, info, cfg),
        "walk": lambda: walk[:2],
        "graze": lambda: graze_fn(poser, info, cfg),
        "sniff": lambda: graze_fn(poser, info, cfg),       # a dog's head-down: the same nose to the ground
        "head_low": lambda: head_low_fn(poser, info, cfg),
        "walk_low": lambda: walk_low_fn(poser, info, cfg, walk),
        "lie": lambda: lie_fn(poser, info, cfg),
    }
    for clip in cfg.get("clips", ["idle", "walk"]):
        fn, length = makers[clip]()
        clips[clip] = make_clip(poser, rig, clip, length, fn)
        if clip == "lie" and info["midline"]:
            # ground it: the chest's midline rests on the ground (two passes: the legs' IK depends on the height)
            for _ in range(2):
                z = chest_floor(rig, body, info, 0)
                lift = getattr(poser, "lie_lift", 0.0) + (0.012 * info["Hb"] - z)
                poser.lie_lift = lift
                bpy.data.actions.remove(clips[clip])
                fn, length = lie_fn(poser, info, cfg, lift=lift)
                clips[clip] = make_clip(poser, rig, clip, length, fn)
            log(f"RIG lie: chest midline at {chest_floor(rig, body, info, 0) * 100:.1f} cm (lift {poser.lie_lift * 100:+.1f} cm)")
    if "walk" in clips:   # the no-skating check: a toe on the ground must stay put while the root moves at the speed
        _, T, S = walk
        v = S / T
        rig.animation_data.action = clips["walk"]
        n = int(round(T * FPS))
        track = {h: [] for h in ("hoof_f.L", "hoof_f.R", "hoof_h.L", "hoof_h.R")}
        for f in range(2 * n):             # two cycles, so a stance that spans the loop point is seen whole
            bpy.context.scene.frame_set(f % n)
            ev = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
            for h in track:
                tl = ev.pose.bones[h].tail
                track[h].append((tl.y - v * f / FPS, tl.z))
        worst = 0.0
        for h, pts in track.items():
            run = []
            for y, z in pts:
                if z < 0.004 * info["Hb"]:
                    run.append(y)
                elif run:
                    worst = max(worst, max(run) - min(run))
                    run = []
            if run:
                worst = max(worst, max(run) - min(run))
        log(f"RIG walk slip: a planted toe moves at most {worst * 1000:.1f} mm over the ground (speed {v:.3f} m/s)")
        walk_slip = worst
    else:
        walk_slip = None
    m = measures(rig, body, info, cfg, walk)
    m["clips"] = {k: round((a.frame_range[1] - a.frame_range[0]) / FPS, 3) for k, a in clips.items()}
    m["walk"]["slip_mm"] = round(walk_slip * 1000, 1) if walk_slip is not None else None
    m["triangles"] = n_tris
    m["bones"] = len(rig.data.bones)
    m["tack"] = tack_notes
    for nm, tn in tack_notes.items():   # a collar variant: the traces hook onto its hames
        if "traces" in tn:
            m["harness"].update(tn.pop("traces"), source=f"tack_{nm}")
        if "girth_traces" in tn:          # a draught girth: the traces hook onto the girth band's sides
            m["harness"].update(tn.pop("girth_traces"), girth_source=f"tack_{nm}")
    for nm, tn in tack_notes.items():
        if "seat_m" in tn and tn["seat_m"] > m["saddle"]["rest"][1]:
            tn["saddle_rest"] = [m["saddle"]["rest"][0], tn["seat_m"], m["saddle"]["rest"][2]]
    # review: the rig check (bones through the see-through body) and frame sheets of every clip
    sticks = bone_sticks(rig)
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
    import copy  # noqa: F401
    mats = [mm.copy() for mm in body.data.materials]
    orig = list(body.data.materials)
    for k, mm in enumerate(mats):
        body.data.materials[k] = mm
    ghost(body)
    size = float(max(co[:, 1].max() - co[:, 1].min(), co[:, 2].max()))
    rows = []
    for az, el in ((0, 2), (90, 2), (38, 20)):
        aim(cam, (0, 0, size * 0.45), az, el, size * 3.4, size * 1.3 if el < 5 else None)
        pth = os.path.join(frames_dir, f"_rig_{az}.png")
        render_to(pth)
        rows.append(pth)
    compose([rows], os.path.join(frames_dir, "rig_check.png"))
    for pth in rows:
        os.remove(pth)
    for k, mm in enumerate(orig):
        body.data.materials[k] = mm
    bpy.data.objects.remove(sticks, do_unlink=True)
    for o in tack.values():
        o.hide_render = True
    render_clip_frames(rig, body, clips, frames_dir, cfg["name"])
    if tack:   # each variant on the idle pose, side and three-quarter
        rig.animation_data.action = clips.get("idle") or next(iter(clips.values()))
        bpy.context.scene.frame_set(0)
        row = []
        for nm, o in tack.items():
            for o2 in tack.values():
                o2.hide_render = o2 is not o
            for az, el in ((0, 3), (35, 18)):
                aim(cam, (0, 0, size * 0.45), az, el, size * 3.0, size * 1.3 if el < 5 else None)
                pth = os.path.join(frames_dir, f"_tack_{nm}_{az}.png")
                render_to(pth)
                row.append(pth)
        compose([row], os.path.join(frames_dir, "tack.png"))
        for pth in row:
            os.remove(pth)
        for o in tack.values():
            o.hide_render = False
    export_glb(rig, [body] + list(tack.values()), out_glb)
    json.dump(m, open(rig_json, "w"), indent=1)
    log("RIG measures " + json.dumps(m))


# ---------------------------------------------------------------- a perched bird (built from kit shapes, its own tiny rig)

def _ellipsoid(c, r, rot, segs=10, rings=6):
    """Vertices and faces of a low-poly ellipsoid: centre c, radii r (x, y, z), rotated by the 3x3 matrix rot."""
    vs = [c + rot @ Vector((0, 0, -r[2]))]
    for j in range(1, rings):
        t = math.pi * j / rings
        for i in range(segs):
            a = 2 * math.pi * i / segs
            vs.append(c + rot @ Vector((math.sin(t) * math.cos(a) * r[0], math.sin(t) * math.sin(a) * r[1], -math.cos(t) * r[2])))
    vs.append(c + rot @ Vector((0, 0, r[2])))
    fs = [(0, 1 + (i + 1) % segs, 1 + i) for i in range(segs)]
    for j in range(rings - 2):
        b = 1 + j * segs
        fs += [(b + i, b + (i + 1) % segs, b + segs + (i + 1) % segs, b + segs + i) for i in range(segs)]
    top = len(vs) - 1
    b = 1 + (rings - 2) * segs
    fs += [(b + i, b + (i + 1) % segs, top) for i in range(segs)]
    return vs, fs


def build_bird(cfg):
    """A perched crow, about 0.45 m long, at its real size: an ellipsoid body tilted head-up, a round head and a dark
    beak, folded wings along the flanks, a fan tail hanging behind, two legs gripping the perch at the origin. One mesh,
    parts drawn from the palette; bones root, body, head, tail, wing.L, wing.R (rigid parts, legs blend root to body)."""
    from mathutils import Matrix
    S = cfg.get("size", 1.0)
    parts = []   # (verts, faces, palette key, weights: bone or [(bone_at_bottom, bone_at_top, z0, z1)])
    tilt = Matrix.Rotation(math.radians(37), 3, "X")        # long axis from tail-low to chest-high (front = -y)
    vs, fs = _ellipsoid(Vector((0, 0.012, 0.13)) * S, Vector((0.052, 0.058, 0.115)) * S, tilt, 10, 6)
    parts.append((vs, fs, "crow", "body"))
    vs, fs = _ellipsoid(Vector((0, -0.066, 0.232)) * S, Vector((0.036, 0.042, 0.036)) * S, Matrix.Identity(3), 8, 5)
    parts.append((vs, fs, "crow", "head"))
    # beak: a cone forward from the face
    base, tip = Vector((0, -0.1, 0.228)) * S, Vector((0, -0.162, 0.215)) * S
    n = 6
    ax = (tip - base).normalized()
    side = ax.cross(Vector((0, 0, 1))).normalized()
    up = side.cross(ax).normalized()
    vs = [base + (side * math.cos(2 * math.pi * i / n) * 0.016 + up * math.sin(2 * math.pi * i / n) * 0.012) * S for i in range(n)] + [tip]
    fs = [(i, (i + 1) % n, n) for i in range(n)] + [tuple(reversed(range(n)))]
    parts.append((vs, fs, "beak", "head"))
    # wings: long flattened ellipsoids along the flanks, tips crossing over the tail
    for sx, bone in ((1, "wing.L"), (-1, "wing.R")):
        rot = Matrix.Rotation(math.radians(50), 3, "X") @ Matrix.Rotation(math.radians(sx * 6), 3, "Y")
        vs, fs = _ellipsoid(Vector((sx * 0.04, 0.035, 0.125)) * S, Vector((0.014, 0.05, 0.135)) * S, rot, 8, 5)
        parts.append((vs, fs, "crow", bone))
    # tail: a fan of three tapered feathers hanging back and down
    for k_, a in enumerate((-12, 0, 12)):
        rot = Matrix.Rotation(math.radians(a), 3, "Z")
        root = Vector((0, 0.07, 0.065)) * S
        L = 0.16 * S
        d = rot @ Vector((0, math.cos(math.radians(55)), -math.sin(math.radians(55))))
        sd = rot @ Vector((1, 0, 0))
        w0, w1, th = 0.012 * S, 0.026 * S, 0.006 * S
        p0, p1 = root, root + d * L
        vs = [p0 - sd * w0, p0 + sd * w0, p1 + sd * w1, p1 - sd * w1]
        vs = [v + Vector((0, 0, th)) for v in vs] + [v - Vector((0, 0, th)) for v in vs]
        fs = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        parts.append((vs, fs, "crow", "tail"))
    # legs and toes
    for sx in (1, -1):
        foot = Vector((sx * 0.022, 0.0, 0.0)) * S
        top = Vector((sx * 0.024, 0.01, 0.085)) * S
        n = 5
        vs = []
        for p in (foot + Vector((0, 0, 0.006 * S)), top):
            vs += [p + Vector((math.cos(2 * math.pi * i / n), math.sin(2 * math.pi * i / n), 0)) * 0.0045 * S for i in range(n)]
        fs = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        parts.append((vs, fs, "beak", [("root", "body", foot.z, top.z)]))
        for d in (Vector((0.006, -0.035, 0)), Vector((-0.006, -0.035, 0)), Vector((0, 0.025, 0))):
            a, b = foot + Vector((0, 0, 0.004 * S)), foot + d * S + Vector((0, 0, 0.002 * S))
            ax = (b - a).normalized()
            sd = ax.cross(Vector((0, 0, 1))).normalized() * 0.003 * S
            vs = [a + sd, a - sd, a + Vector((0, 0, 0.005 * S)), b]
            fs = [(0, 1, 3), (1, 2, 3), (2, 0, 3), (0, 2, 1)]
            parts.append((vs, fs, "beak", "root"))
    # one mesh
    V_, F_, UV_, W_ = [], [], [], []
    for vs, fs, key, wt in parts:
        b = len(V_)
        V_ += [tuple(v) for v in vs]
        uv = palette_uv(key)
        for f in fs:
            F_.append(tuple(i + b for i in f))
            UV_.append(uv)
        for v in vs:
            if isinstance(wt, str):
                W_.append({wt: 1.0})
            else:
                b0, b1, z0, z1 = wt[0]
                t = min(1.0, max(0.0, (v.z - z0) / max(1e-6, z1 - z0)))
                W_.append({b0: 1 - t, b1: t} if 0 < t < 1 else ({b0: 1.0} if t <= 0 else {b1: 1.0}))
    me = bpy.data.meshes.new(cfg["name"])
    me.from_pydata(V_, [], F_)
    me.validate()
    uvl = me.uv_layers.new(name="UVMap")
    for poly, uv in zip(me.polygons, UV_):
        for li in poly.loop_indices:
            uvl.data[li].uv = uv
    me.materials.append(tack_material(palette_image()))
    ob = bpy.data.objects.new(cfg["name"], me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    # the rig
    J = {
        "root": (Vector((0, 0, 0)), Vector((0, -0.04, 0)) * S),
        "body": (Vector((0, 0.03, 0.085)) * S, Vector((0, -0.04, 0.19)) * S),
        "head": (Vector((0, -0.05, 0.2)) * S, Vector((0, -0.09, 0.26)) * S),
        "tail": (Vector((0, 0.07, 0.065)) * S, Vector((0, 0.16, -0.06)) * S),
        "wing.L": (Vector((0.045, -0.03, 0.18)) * S, Vector((0.05, 0.11, 0.05)) * S),
        "wing.R": (Vector((-0.045, -0.03, 0.18)) * S, Vector((-0.05, 0.11, 0.05)) * S),
    }
    parent = {"root": None, "body": "root", "head": "body", "tail": "body", "wing.L": "body", "wing.R": "body"}
    arm = bpy.data.armatures.new(cfg["name"] + "_rig")
    rig = bpy.data.objects.new(cfg["name"] + "_rig", arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for b_, (h, t) in J.items():
        e = arm.edit_bones.new(b_)
        e.head, e.tail = h, t
        e.align_roll(Vector((0, 0, 1)) if abs((t - h).normalized().z) < 0.9 else Vector((0, -1, 0)))
        eb[b_] = e
    for b_, pa in parent.items():
        if pa:
            eb[b_].parent = eb[pa]
    bpy.ops.object.mode_set(mode="OBJECT")
    groups = {b_: ob.vertex_groups.new(name=b_) for b_ in J}
    for i, w in enumerate(W_):
        for b_, x in w.items():
            groups[b_].add([i], x, "REPLACE")
    ob.parent = rig
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    return ob, rig


def _local_q(rig, bone, G):
    """An armature-space rotation G (Quaternion) as the bone's local basis rotation (parents at rest)."""
    R = rig.data.bones[bone].matrix_local.to_quaternion()
    return R.inverted() @ G @ R


def bird_idle(ob, rig, length=8.0):
    """Perched: breathing, quick head turns between held looks (a bird's head moves in jerks), a tail flick or two, a
    wing shuffle; loops."""
    act = bpy.data.actions.new("idle")
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    n = int(round(length * FPS))
    looks = [(0.0, 0, 0), (0.9, 38, 4), (2.2, 38, -8), (2.6, -25, 0), (4.0, -25, 6), (4.4, 12, -4), (5.8, 55, 0),
             (6.6, -10, 2), (7.6, 0, 0), (8.0, 0, 0)]

    def look(t):
        for (t0, y0, p0), (t1, y1, p1) in zip(looks, looks[1:]):
            if t0 <= t <= t1:
                u = min(1.0, (t - t0) / 0.14)          # a quick turn, then held
                u = u * u * (3 - 2 * u)
                return y0 + (y1 - y0) * u if t1 - t0 > 0.2 else y1, p0 + (p1 - p0) * u
        return 0, 0
    prev = {}
    for f in range(n + 1):
        t = (f % n) / FPS
        breathe = math.sin(2 * math.pi * t / 2.0)
        yaw, pitch = look(t)
        flick = bump(t, 1.7, 0.35) + 0.8 * bump(t, 5.1, 0.3)
        shuffle = bump(t, 3.3, 0.6)
        rots = {
            "body": quat((1, 0, 0), 1.5 * breathe - 4 * shuffle),
            "head": qmul(quat((0, 0, 1), yaw), quat((1, 0, 0), pitch)),
            "tail": quat((1, 0, 0), -24 * flick + 2 * breathe),
            "wing.L": quat((0, 1, 0), 14 * shuffle),
            "wing.R": quat((0, 1, 0), -14 * shuffle),
        }
        for b_, G in rots.items():
            q = _local_q(rig, b_, G).normalized()
            if b_ in prev and prev[b_].dot(q) < 0:
                q.negate()
            prev[b_] = q
            pb = rig.pose.bones[b_]
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=f)
        pb = rig.pose.bones["body"]
        pb.location = (0, 0, 0)
        pb.keyframe_insert("location", frame=f)
    act.frame_range = (0, n)
    return act


def mode_bird(cfg_path, out_glb, rig_json, frames_dir):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    os.makedirs(frames_dir, exist_ok=True)
    reset()
    bpy.context.scene.render.fps = FPS
    cam = setup_render((480, 400))
    ob, rig = build_bird(cfg)
    clips = {"idle": bird_idle(ob, rig)}
    co = verts(ob)
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    gl = lambda v: [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]  # noqa: E731
    m = {
        "kind": "bird", "length_m": round(float(co[:, 1].max() - co[:, 1].min()), 3),
        "height_m": round(float(co[:, 2].max()), 3), "back_m": round(float(co[:, 2].max()) * 0.7, 3),
        "top_m": round(float(co[:, 2].max()), 3), "width_m": round(float(co[:, 0].max() - co[:, 0].min()), 3),
        "perch": {"bone": "root", "rest": gl(Vector((0, 0, 0))), "about": "the feet's grip on the branch: put this point on the perch"},
        "clips": {k: round((a.frame_range[1] - a.frame_range[0]) / FPS, 3) for k, a in clips.items()},
        "triangles": tris, "bones": len(rig.data.bones), "tack": {},
    }
    log(f"RIG {cfg['name']}: {len(co)} verts, {tris} tris, size {np.round(co.max(0) - co.min(0), 3).tolist()}")
    render_clip_frames(rig, ob, clips, frames_dir, cfg["name"])
    export_glb(rig, [ob], out_glb)
    json.dump(m, open(rig_json, "w"), indent=1)
    log("RIG measures " + json.dumps(m))


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if argv and argv[0] == "test":
        mode_test(argv[1], argv[2:])
    elif argv and argv[0] == "rig":
        mode_rig(*argv[1:6])
    elif argv and argv[0] == "bird":
        mode_bird(*argv[1:5])
