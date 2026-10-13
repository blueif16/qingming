"""S2's crew spots, headless (blender_slot.sh; after scratchpad/boats_fix/crew_check.py): every figure on a boat stood
where web/src/boats.js host() would stand it (its painted spot carried into the boat's frame and dropped on the deck,
or the roof for `boat roof:`; the sweep crew at the sweep's bar at both ends of the stroke) or, for a figure host()
doesn't take (its support isn't `boat deck|roof:` and its boat's people.json `crew` doesn't list it), where people.js
would (dropped from H + 1.2 m onto the first collider below). Checks: a floor under the feet, inside the hull, and
nothing of the boat's body in the column from 0.3 to 1.8 m above the feet.
    blender_slot.sh -b --factory-startup --python crew_check.py -- <qingming> <boats_people.json> <out.json>"""
import json
import math
import os
import random
import re
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
QM, BP, OUT = argv[0], argv[1], argv[2]
NUDGE = json.load(open(argv[3])) if len(argv) > 3 else {}
sys.path.insert(0, os.path.join(QM, "blender"))
from mathutils import Vector as V  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402
import kit_boats as kb  # noqa: E402

L = json.load(open(os.path.join(QM, "sections/canal/layout.json")))
C = json.load(open(os.path.join(QM, "sections/canal/build_choices.json")))
PEOPLE = json.load(open(BP)).get("boats", {})
ents = L["entities"]
figs = {f["id"]: f for f in L["figures"]}
figs.update({f["map_id"]: f for f in L["figures"]})


def where(ref, key):
    if isinstance(ref, (list, tuple)):
        return tuple(ref)
    if ref in figs:
        f = figs[ref]
        return (f["X"], f["D"], (f.get("H") or 0.0) + 1.25)
    e = ents[ref]
    p = e.get("pos")
    return (p[0], p[1], (e.get("H") or 0.0) + (0.0 if key == "gangplank" else 0.8))


def bvh_of(bn, names, cats=None):
    verts, polys = [], []
    for n in names:
        nd = bn.sink.nodes.get(n)
        if not nd:
            continue
        o = nd["origin"]
        for b in nd["B"].data.values():
            base = len(verts)
            verts += [V(v) + o for v in b["v"]]
            polys += [[base + i for i in f] for f in b["f"]]
    return BVHTree.FromPolygons(verts, polys) if polys else None


def hits_down(tree, x, y, z0=12.0):
    out = []
    if tree is None:
        return out
    z = z0
    for _ in range(12):
        h = tree.ray_cast(V((x, y, z)), V((0, 0, -1)), 40.0)
        if h[0] is None:
            break
        out.append((h[0].z, h[1]))
        z = h[0].z - 0.01
    return out


res = {}
for mid, e in ents.items():
    if not (e.get("kind") == "vehicle" and mid.split(".")[-1].startswith("boat_")):
        continue
    if mid in (C.get("unbuilt") or {}):
        continue
    slug = mid.split(".")[-1]
    opts = dict((C.get("boats", {}).get(mid) or {}).get("kit", {}))
    kind = opts.pop("kind", None)
    for key in ("tow_to", "gangplank"):
        if key in opts and opts[key] is not None:
            opts[key] = where(opts[key], key)
    if "moor" in opts:
        opts["moor"] = [where(m, "moor") for m in opts["moor"]]
    bn = kb.boat_from_layout(e, mid, kind=kind, sink="nodes", lod=0, **opts)
    M, Mi = bn.M, bn.M.inverted()
    H = bn.info["hull"]
    lw = bn.info["lw"]
    deck = bvh_of(bn, ["deck__col"])
    roof = bvh_of(bn, ["roof__col"])
    body = bvh_of(bn, ["body", "mast"] + [n for n in bn.sink.nodes if n.startswith(("oar_", "sweep"))])
    P = {p["name"]: p for p in bn.sink.points}
    spec = PEOPLE.get(slug) or PEOPLE.get(mid) or {}
    crew_spec = spec.get("crew") or {}
    spots = []
    crew = [f for f in L["figures"] if str(f.get("support", "")).endswith(": " + mid) and str(f.get("support", "")).startswith("boat")]
    sweepers = [fid for fid, j in crew_spec.items() if j.get("work") == "sweep"]
    for f in crew:
        m = re.match(r"^boat (deck|roof): (.+)$", f.get("support", ""))
        hosted = bool(m) or f["id"] in crew_spec
        job = crew_spec.get(f["id"], {})
        level = m.group(1) if m else "deck"
        if job.get("work") == "sweep" and "pt_sweep_bar" in P:
            nd = bn.sink.nodes["sweep"]
            piv = nd["origin"]
            bar = P["pt_sweep_bar"]["boat"]
            d = V((bar.x - piv.x, bar.y - piv.y, 0)).normalized()
            k = sweepers.index(f["id"])
            n = len(sweepers)
            perp = V((d.y, -d.x, 0))
            c = bar + d * 0.55 + perp * ((-0.6 + 1.2 * k / (n - 1)) if n > 1 else 0)
            amp = math.radians(nd["extras"]["amp_deg"])
            from mathutils import Matrix
            for sw in (0.0, -amp, amp):
                q = Matrix.Translation(piv) @ Matrix.Rotation(sw, 4, "Z") @ Matrix.Translation(-piv) @ c
                spots.append((f["id"] + ("" if not sw else ("-" if sw < 0 else "+")), q, "deck", True, f))
            continue
        nd_ = NUDGE.get(f["id"], [0.0, 0.0])
        p = Mi @ V((f["X"] + nd_[0], f["D"] + nd_[1], f.get("H") or 0.0))
        spots.append((f["id"], p, level, hosted, f))
    def test(q, level, hosted):
        bad, note = [], ""
        if hosted:
            # host(): the deck (or roof) below the spot, from 8 m up in the boat's frame; brought in toward the centre
            got = None
            for i in range(9):
                t = i / 8
                x = q.x * (1 - t) + max(-lw / 2 + 2 + lw / 2, min(lw / 2 - 2 + lw / 2, q.x)) * t if False else q.x
                cx = max(2.0, min(lw - 2.0, q.x))
                x = q.x + (cx - q.x) * t
                y = q.y * (1 - t)
                dh = hits_down(deck, x, y, 8.0)
                rh = hits_down(roof, x, y, 8.0) if level == "roof" else []
                pick = (rh[0] if rh else (dh[0] if dh else None)) if level == "roof" else (dh[0] if dh else None)
                if pick:
                    got = (x, y, pick[0], i)
                    break
            if not got:
                bad.append(f"no {level} under it")
                zx, zy, zz = q.x, q.y, q.z
            else:
                zx, zy, zz, i = got
                if i:
                    note = f"brought in {math.hypot(zx - q.x, zy - q.y):.2f} m"
        else:
            # people.js: from H + 1.2 down onto the first collider (deck, roof, rim, body)
            zt = q.z + 1.2
            cand = []
            for tree in (deck, roof):
                for z, nrm in hits_down(tree, q.x, q.y, zt):
                    cand.append(z)
                    break
            if not cand:
                bad.append("unhosted: nothing under it")
                zx, zy, zz = q.x, q.y, q.z
            else:
                zx, zy, zz = q.x, q.y, max(cand)
            note = (note + " unhosted").strip()
        inner = H.inner(zx, zz) if H.x0 < zx < H.x1 else 0.0
        if abs(zy) > max(0.0, inner - 0.15):
            bad.append(f"|y| {abs(zy):.2f} > inner {inner:.2f}-0.15")
        for ox, oy in ((0, 0), (0.18, 0), (-0.18, 0), (0, 0.18), (0, -0.18)):
            h = body.ray_cast(V((zx + ox, zy + oy, zz + 0.3)), V((0, 0, 1)), 1.5) if body else (None,)
            if h[0] is not None:
                bad.append(f"body {h[0].z - zz:.2f} m over the feet")
                break
        return bad, note, zx, zy, zz

    out = []
    for sid, q, level, hosted, f in spots:
        bad, note, zx, zy, zz = test(q, level, hosted)
        fix = None
        if bad and not sid.endswith(("+", "-")) and not crew_spec.get(f["id"], {}).get("work"):
            best = None
            for ix in range(-16, 17):
                for iy in range(-8, 9):
                    dx, dy = 0.25 * ix, 0.15 * iy
                    cost = math.hypot(dx, dy)
                    if best and cost >= best[0]:
                        continue
                    qq = V((q.x + dx, q.y + dy, q.z))
                    b2, _, *_ = test(qq, level, hosted)
                    if not b2:
                        best = (cost, dx, dy)
            if best:
                hd = math.radians(bn.info["heading_deg"])
                wx = best[1] * math.cos(hd) - best[2] * math.sin(hd)
                wy = best[1] * math.sin(hd) + best[2] * math.cos(hd)
                fix = {"along": round(best[1], 2), "across": round(best[2], 2), "nudge_world": [round(wx, 2), round(wy, 2)]}
        out.append({"spot": sid, "x": round(zx - lw / 2, 2), "y": round(zy, 2), "feet_above_water": round(zz, 2),
                    "painted_H_above_water": round((f.get("H") or 0) - (e["pts"]["front"][2]), 2),
                    "hosted": hosted, "level": level, "ok": not bad, "why": bad, "note": note, "fix": fix})
    res[mid] = {"kind": bn.info["kind"], "lw": lw, "deck_z": bn.info["deck_z"], "roof_z": bn.info["roof_z"],
                "note": bn.info.get("note"), "spots": out}
    nbad = sum(not s["ok"] for s in out)
    print(f"CREW {slug}: {len(out)} spots, {nbad} bad", flush=True)
    for s in out:
        if not s["ok"] or s["note"]:
            print(f"    {s['spot']:34s} x {s['x']:6.2f} y {s['y']:5.2f} feet {s['feet_above_water']:5.2f} "
                  f"(painted {s['painted_H_above_water']:5.2f}) {s['level']:4s} {'ok' if s['ok'] else s['why']} {s['note']} {('FIX ' + json.dumps(s['fix'])) if s.get('fix') else ''}", flush=True)
json.dump(res, open(OUT, "w"), indent=1)
print("CREW_DONE", flush=True)
