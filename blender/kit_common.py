"""Shared parts for round 2 (catalogue gen/expand/round2/catalogue.md §6 and §8 (c2)): the parts several areas need that
no kit had. The kit factory owns this module; area kits import it read-only (their stubs stand in until a part lands).

    thatch_gablet   the small pale gable vent with a king post set into a thatch roof's hip end
                    (S1 farmhouse_gable_33670, farmhouse_thatched_33955, barn_open_34860, farmhouse_long_34950; S2 wanglou_shed_28660)
    thatch_lean_to  a single-slope thatched roof with a ragged fringe: a skirt along a front, or an open shed on posts
                    (S1 stall_annex_29350, shed_posts_31370, farmhouse_thatched_34600's west wing, posts_35075; S2 wanglou_shed_28660)
    stilt_deck      a plank deck on round posts over a sloping bank, with an optional rail or a fascia of slats
                    (S3 far_bank_hall_18520; S2 river_terrace_23250, jetty_27260)
    swag_curtain    a cloth hung from a beam and gathered into a tied swag at one end, optionally striped
                    (S3 tavern_gate_16870, striped, tied at the east post; S2 open_shop_25340)
    board_wall      vertical boards with battens and ragged feet, optional door-like panels
                    (S1 farmhouse_wing_30190; S3 mat_shed_19530, far_bank_hall_18520's east end)
    mooring_stake   a thin tapered post or pole, plain, knobbed, knotted, turned or coiled with rope, or carrying a box lamp;
                    returns the rope point for the boat kit's lines
                    (S2 mooring_stake_27902, mooring_post_23126 (knot), mooring_post_rope_28272 (coil); S1 mooring_pole_36444;
                    S3 mooring_post_17702 (lamp))

Conventions (song_kit's): every function adds faces to street_b1's bucket set `sb.B` and never opens an entity (the
area builder wraps each call in `with sb.entity(<map id>):`); positions come from the caller, in the caller's frame
(world, or a `song_kit.placed(...)` frame); sizes the strokes can't give are keyword `choice:` defaults at real size;
each returns the triangles it added (mooring_stake returns its rope point). Frame: x = map X (east), y = map D (north),
z up, metres. Song_kit's materials only (timber, deck, reed, rope, bamboo, bark, plaster, lattice, interior, cloth_*,
hidden). Messenger's construction rules: no plain box, large faces flat, the triangles in edge thickness, trims and
framed openings, every board its own piece with its own patch of the swatch (the joints draw the ink), no ruled
straight edge (wobbled eaves, ragged feet, jittered members). Thin things (cloth, straw tufts, slats) are single faces:
the exported materials are double-sided. Colliders: `hidden` faces with collide=True (a deck's walkable top, a wall's
or a rail's 1.05 m stop), the posts themselves.

Review (headless): scratchpad kitfactory/common/review_common.py renders every part with Freestyle ink into
gen/kit_common/review/ and gen/kit_common/sheet.jpg.
"""
import math
import random

from mathutils import Vector

import song_kit as k
import street_b1 as sb

try:                    # the straw of kit_outer_road.thatch_roof, so the thatch parts match it
    from kit_outer_road import STRAW
except Exception:       # pragma: no cover (kit_outer_road missing): its value
    STRAW = "reed"

V = Vector
UP = V((0, 0, 1))


# ---------------------------------------------------------------- helpers

def _tris():
    return sum(len(f) - 2 for b in sb.B.data.values() for f in b["f"])


def _p2(p):
    return V((p[0], p[1], 0.0))


def _p3(p, z=0.0):
    return V((p[0], p[1], p[2] if len(p) > 2 else z))


def _seg(p0, p1):
    """Plan frame of p0 -> p1: start, end (z 0), unit direction t, its right n, its left l, length."""
    a, b = _p2(p0), _p2(p1)
    t = b - a
    L = t.length
    t = t / L if L > 1e-9 else V((1, 0, 0))
    return a, b, t, V((t.y, -t.x, 0)), V((-t.y, t.x, 0)), L


def _orient(verts, faces, inside):
    """Wind each face outward: inside is one point (or one per face) inside the solid."""
    ins = inside if isinstance(inside, list) else [inside] * len(faces)
    out = []
    for f, p in zip(faces, ins):
        a, b, c = verts[f[0]], verts[f[1]], verts[f[2]]
        n = (b - a).cross(c - a)
        if n.length < 1e-12 and len(f) > 3:
            n = (c - a).cross(verts[f[3]] - a)
        fc = sum((verts[j] for j in f), V((0, 0, 0))) / len(f)
        out.append(tuple(reversed(f)) if n.dot(fc - V(p)) < 0 else tuple(f))
    return out


def _solid(mat, collide, verts, faces, inside, uvs=None):
    """Faces wound outward (UVs kept in step)."""
    verts = [V(p) for p in verts]
    ori = _orient(verts, faces, inside)
    if uvs:
        uvs = [uv if tuple(fo) == tuple(fi) else uv[::-1] for uv, fo, fi in zip(uvs, ori, faces)]
    k.add(mat, collide, verts, ori, uvs)


def _hexa_uv(mat, bottom, top, rng, grain, collide=False, bottom_face=True):
    """A six-faced piece (a board, a plank) from 4 bottom and 4 top corners, wound outward, with its own patch of the
    swatch: `grain` is the world direction the swatch's grain follows. The timber swatch draws its grain along v, the
    deck and reed swatches along u (song_kit's swatches), so each picks its axis."""
    verts = [V(p) for p in bottom] + [V(p) for p in top]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    if not bottom_face:
        faces = faces[1:]
    c = sum(verts, V((0, 0, 0))) / 8
    g = V(grain).normalized()
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    along_v = mat in ("timber",)          # the timber swatch's planks run up the image
    uvs = []
    for f in faces:
        a, b, cc = verts[f[0]], verts[f[1]], verts[f[2]]
        nrm = (b - a).cross(cc - a)
        if nrm.length < 1e-12:
            nrm = V((0, 0, 1))
        nrm.normalize()
        q = nrm.cross(g)
        if q.length < 1e-6:
            q = V((1, 0, 0)) if abs(g.x) < 0.9 else V((0, 1, 0))
        q.normalize()
        row = []
        for i in f:
            s, w = verts[i].dot(g) / tile, verts[i].dot(q) / tile
            row.append((w + ou, s + ov) if along_v else (s + ou, w + ov))
        uvs.append(row)
    _solid(mat, collide, verts, faces, c, uvs)


def _bar(mat, a, b, w, h, c=0.0, collide=False):
    k.beam(mat, collide, a, b, w, h, c)


def _lathe(mat, c, axis, prof, segs=8, collide=False, cap0=True, cap1=True):
    """A solid of revolution about `axis` through c: prof = [(radius, t along the axis)] from the bottom up; a zero
    radius is a single point (a cone's tip)."""
    a = V(axis).normalized()
    ref = UP if abs(a.z) < 0.9 else V((1, 0, 0))
    u = ref.cross(a).normalized()
    w = a.cross(u).normalized()
    c = V(c)
    verts, rings = [], []
    for r, t in prof:
        if r < 1e-6:
            rings.append([len(verts)])
            verts.append(c + a * t)
            continue
        ring = []
        for i in range(segs):
            ang = 2 * math.pi * (i + 0.5) / segs
            ring.append(len(verts))
            verts.append(c + a * t + (u * math.cos(ang) + w * math.sin(ang)) * r)
        rings.append(ring)
    faces, ins = [], []
    for kk in range(len(rings) - 1):
        r0, r1 = rings[kk], rings[kk + 1]
        mid = c + a * ((prof[kk][1] + prof[kk + 1][1]) / 2)
        if len(r0) == 1 and len(r1) == 1:
            continue
        for i in range(segs):
            j = (i + 1) % segs
            if len(r1) == 1:
                faces.append((r0[i], r0[j], r1[0]))
            elif len(r0) == 1:
                faces.append((r0[0], r1[j], r1[i]))
            else:
                faces.append((r0[i], r0[j], r1[j], r1[i]))
            ins.append(mid)
    tm = sum(t for _, t in prof) / len(prof)
    if cap0 and len(rings[0]) > 1:
        faces.append(tuple(rings[0]))
        ins.append(c + a * (tm + 1e-3) if tm > prof[0][1] else c + a * (prof[0][1] + 1e-3))
    if cap1 and len(rings[-1]) > 1:
        faces.append(tuple(rings[-1]))
        ins.append(c + a * (tm - 1e-3) if tm < prof[-1][1] else c + a * (prof[-1][1] - 1e-3))
    _solid(mat, collide, verts, faces, ins)


def _tufts(pts, rng, mat=STRAW, drop=(0.03, 0.08), spacing=(0.05, 0.13), out=None):
    """A ragged fringe: straw ends of their own widths and lengths at uneven spacing hanging under the polyline
    `pts` (the hem's lowest edge), each a single thin triangle leaning a little outward (`out(p)` -> plan vector)."""
    segs = list(zip(pts, pts[1:]))
    lens = [(q - p).length for p, q in segs]
    total = sum(lens)
    s, j, acc = rng.uniform(0.0, 0.08), 0, 0.0
    verts, faces = [], []
    while s < total and segs:
        while j < len(segs) - 1 and acc + lens[j] < s:
            acc += lens[j]
            j += 1
        p, q = segs[j]
        tv = (q - p) / max(lens[j], 1e-6)
        c = p + tv * (s - acc)
        o = out(c) if out else V((0, 0, 0))
        w = rng.uniform(0.03, 0.07)
        i = len(verts)
        verts += [c - tv * (w / 2), c + tv * (w / 2), c + o * 0.015 - UP * rng.uniform(*drop)]
        faces.append((i, i + 1, i + 2))
        s += rng.uniform(*spacing)
    if faces:
        k.add(mat, False, verts, faces)


# ---------------------------------------------------------------- thatch

def thatch_gablet(apex, foot_l, foot_r, depth, rng, kingpost=True, mat=STRAW):
    """The small pale gable vent of a thatched hip-and-gable roof (歇山 in thatch), set into the roof's hip end: the
    triangle apex / foot_l / foot_r ((x, y, z) each) faces the right of foot_l -> foot_r (the viewer); its face is a
    pale plastered tympanum set 5 cm back in a frame of two barge boards, which follow its sloping edges and run past
    the apex so they cross (as painted), and a sill along its foot; a king post from the sill to the apex; over each
    barge a hood of thatch (a rolled straw edge with a ragged fringe) running `depth` m back into the roof, the two
    hoods meeting in a short ridge roll behind the apex. The caller's roof gives the thatch around it; `depth` should
    reach into that roof. Returns the triangles added.
    choice: barge boards 0.05 x 0.14 m, crossing 0.15 m past the apex; the hood's straw edge 0.16 m deep, overhanging
    the face by 0.06 m (S1 barn_open_34860 [34680, 683, 35021, 882], S2 wanglou_shed_28660's vent u 28653-28737)."""
    t0 = _tris()
    A, Fl, Fr = V(apex), V(foot_l), V(foot_r)
    # the members scale with the vent (a small vent keeps its pale face clear of its frame)
    sc = max(0.4, min(1.0, (A.z - (Fl.z + Fr.z) / 2) / 0.6))
    tt = _p2(Fr - Fl).normalized()
    nrm = V((tt.y, -tt.x, 0))                 # the facing (toward the viewer)
    back = -nrm
    # the tympanum: pale plaster, set back; the king post divides it into its two painted halves
    M = (Fl + Fr) / 2
    face = [p + back * 0.05 for p in (Fl, Fr, A)]
    _solid("plaster", False, face, [(0, 1, 2)], face[0] + back * 1.0)
    # sill (tie beam) along the foot
    _bar("timber", Fl - tt * 0.06 - UP * 0.02, Fr + tt * 0.06 - UP * 0.02, 0.09, 0.08 * sc, 0.01)
    # barge boards: broad face to the viewer, proud of the face, crossing past the apex
    for F in (Fl, Fr):
        e = (A - F).normalized()
        _bar("timber", F - e * 0.08 + nrm * 0.03, A + e * 0.15 * sc + nrm * 0.03 + rng.uniform(-0.01, 0.01) * UP, 0.05,
             0.14 * sc, 0.01)
    if kingpost:
        _bar("timber", M + UP * 0.03, A - UP * 0.1 * sc, 0.06 * sc, 0.06 * sc, 0.008)
    # the hoods: a thatch slab over each barge line, its front a rolled straw edge, running `depth` back
    tile = sb.MATERIALS[mat][1]
    hem_lines = []
    for F, sgn in ((Fl, -1), (Fr, 1)):
        d = (A - F)
        Lb = d.length
        d.normalize()
        m = d.cross(back)
        if m.z < 0:
            m = -m
        m.normalize()
        # the profile across the hood (w back from the face, h along the roof's normal), front to back over the top
        prof = [(depth, -0.06), (0.3, 0.03 * sc), (0.05, 0.04 * sc), (-0.05 * sc, -0.01), (-0.035 * sc, -0.07 * sc),
                (0.03, -0.11 * sc), (0.3, -0.1 * sc), (depth, -0.14)]
        ns = max(3, round(Lb / 0.35))
        rows = []
        for i in range(ns + 1):
            s = -0.12 + (Lb + 0.2) * i / ns
            wob = rng.uniform(-0.02, 0.02) if 0 < i < ns else 0.0
            base = F + d * s + m * (0.07 + 0.12 * sc)
            rows.append([base + back * (w + (wob if w < 0.1 else 0.0)) + m * (h + (wob * 0.5 if h < -0.05 else 0.0))
                         for w, h in prof])
        verts = [p for r in rows for p in r]
        np_ = len(prof)
        faces, uvs = [], []
        arc = [0.0]
        for (wa, ha), (wb, hb) in zip(prof, prof[1:]):
            arc.append(arc[-1] + math.hypot(wb - wa, hb - ha))
        ou, ov = rng.random(), rng.random()
        for i in range(ns):
            sa, sb_ = (-0.12 + (Lb + 0.2) * i / ns), (-0.12 + (Lb + 0.2) * (i + 1) / ns)
            for j in range(np_ - 1):
                faces.append((i * np_ + j, (i + 1) * np_ + j, (i + 1) * np_ + j + 1, i * np_ + j + 1))
                # straw strands run down the slope (u: the swatch's strands)
                uvs.append([(-sa / tile + ou, arc[j] / tile + ov), (-sb_ / tile + ou, arc[j] / tile + ov),
                            (-sb_ / tile + ou, arc[j + 1] / tile + ov), (-sa / tile + ou, arc[j + 1] / tile + ov)])
        faces.append(tuple(range(np_)))
        uvs.append([(ou, arc[j] / tile + ov) for j in range(np_)])
        faces.append(tuple(range(ns * np_, (ns + 1) * np_)))
        uvs.append([(ou + 0.3, arc[j] / tile + ov) for j in range(np_)])
        inside = F + d * (Lb / 2) + m * 0.04 + back * (depth * 0.5)
        _solid(mat, False, verts, faces, inside, uvs)
        hem_lines.append([r[5] for r in rows])
    # the ridge roll where the hoods meet, running back from the apex
    sb.tube(mat, False, [A + UP * 0.12 * sc - nrm * 0.03, A + UP * 0.1 * sc + back * (depth * 0.5), A + back * depth],
            [0.06 * sc, 0.08 * sc, 0.06 * sc], segs=7)
    for line in hem_lines:
        _tufts(line, rng, mat, drop=(0.03, 0.07), out=lambda p: nrm)
    return _tris() - t0


def thatch_lean_to(p0, p1, depth, z_low, z_high, rng, posts=0, fringe=True, side=1, thick=0.22, mat=STRAW):
    """A single-slope thatched roof: its low eave along p0 -> p1 at z_low, rising `depth` m (in plan) to its high edge
    at z_high on the left of p0 -> p1 (side=1; -1: the right). The thatch as kit_outer_road.thatch_roof's: a thick,
    slightly bulging straw slab, its strands down the slope, a rolled hem `thick` deep at the eave, the two ends rounded
    down, a wobble in plan and height along the eave (never ruled), a ragged fringe of straw ends under the hem and the
    ends (fringe); the high edge rounded off (it tucks under whatever the lean-to leans on). posts: n round posts under
    the low eave, 0.3 m in from it (a skirt carried at its front); or (n_front, n_back): posts under both edges, for a
    free-standing open shed (its high edge then gets a fringe too). Posts stand on z 0 of the caller's frame (wrap the
    call in song_kit.placed(frame(x, y, z_ground, yaw)) on raised ground). Returns the triangles added.
    choice: the eave runs 0.2 m past p0 and p1; bulge 0.05 + 0.02 x depth; posts 0.06 m with cap blocks
    (S1 stall_annex_29350, shed_posts_31370; S2 wanglou_shed_28660's skirt)."""
    t0 = _tris()
    a, b, t, n_r, n_l, L = _seg(p0, p1)
    up_dir = n_l if side >= 0 else n_r          # toward the high edge
    rise = z_high - z_low
    bulge = 0.05 + 0.02 * depth
    n_front, n_back = (posts, 0) if isinstance(posts, int) else (int(posts[0]), int(posts[1]))

    def z_top(v):
        f = max(0.0, min(1.0, v / max(depth, 1e-6)))
        return z_low + rise * f + bulge * math.sin(math.pi * f)

    oe = 0.2
    nu = max(3, round((L + 2 * oe) / 0.45))
    us = [-oe + (L + 2 * oe) * i / nu for i in range(nu + 1)]
    nv = max(3, round(depth / 0.5))
    vs = [depth * (1 - kk / nv) for kk in range(nv + 1)]           # the top, from the high edge down to the eave
    under = [(v, z_top(v) - thick * 0.92) for v in vs[::-1][1:-1]]     # back up under the slope
    # the profile (closed): the top down the slope, the rolled hem at the eave, the underside back up, the high edge's
    # rounded end
    prof = ([(v, z_top(v)) for v in vs] + [(-0.04, z_low - thick * 0.45), (0.04, z_low - thick)] + under
            + [(depth - 0.03, z_top(depth) - thick * 0.9), (depth + 0.03, z_top(depth) - thick * 0.42)])
    np_ = len(prof)
    hem_i = nv + 2                                                    # the hem's lowest point (fringe line)
    back_i = np_ - 2                                                  # the high edge's lowest point
    ph = [rng.uniform(0, 6.283) for _ in range(4)]
    rows = []
    for i, u in enumerate(us):
        f = i / nu
        wob = 0.035 * (math.sin(6.283 * 2.3 * f + ph[0]) + 0.5 * math.sin(6.283 * 5.1 * f + ph[1])) / 1.5
        zw = 0.03 * math.sin(6.283 * 3.7 * f + ph[2])
        wb = 0.02 * math.sin(6.283 * 2.9 * f + ph[3])
        end = i in (0, nu)
        row = []
        for j, (v, z) in enumerate(prof):
            eave = v < 0.3
            vv = v + (wob if eave else (wb if v > depth - 0.2 else wob * 0.3))
            zz = z + (zw if eave else zw * 0.3)
            if end:     # the ends round down and in
                cz = z_top(max(0.0, min(depth, v))) - thick * 0.46
                zz = cz + (zz - cz) * 0.6 - thick * 0.15
                vv = vv * 0.97 + 0.03 * depth * 0.5
            uu = u + (0.06 if i == 0 else -0.06 if i == nu else 0.0)
            row.append(a + t * uu + up_dir * vv + UP * zz)
        rows.append(row)
    verts = [p for r in rows for p in r]
    faces, uvs = [], []
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    arcs = []
    for r in rows:
        acc = [0.0]
        for p, q in zip(r, r[1:] + r[:1]):
            acc.append(acc[-1] + (q - p).length)
        arcs.append(acc)
    for i in range(nu):
        for j in range(np_):
            j2 = j + 1
            jj = j2 % np_
            faces.append((i * np_ + j, (i + 1) * np_ + j, (i + 1) * np_ + jj, i * np_ + jj))
            uvs.append([(arcs[i][j] / tile + ou, us[i] / tile + ov), (arcs[i + 1][j] / tile + ou, us[i + 1] / tile + ov),
                        (arcs[i + 1][j2] / tile + ou, us[i + 1] / tile + ov), (arcs[i][j2] / tile + ou, us[i] / tile + ov)])
    for i in (0, nu):
        faces.append(tuple(range(i * np_, (i + 1) * np_)))
        uvs.append([(arcs[i][j] / tile + ou, 0.37 * j / tile + ov) for j in range(np_)])
    mid = a + t * (L / 2) + up_dir * (depth / 2) + UP * (z_top(depth / 2) - thick * 0.46)
    ins = []
    for f in faces:
        c = sum((verts[q] for q in f), V((0, 0, 0))) / len(f)
        rel = c - a
        v = min(max(rel.dot(up_dir), 0.05), depth - 0.05)
        ins.append(a + t * max(-oe + 0.01, min(L + oe - 0.01, rel.dot(t))) + up_dir * v + UP * (z_top(v) - thick * 0.46))
    ins[-2:] = [mid, mid]
    _solid(mat, False, verts, faces, ins, uvs)
    if fringe:
        _tufts([r[hem_i] for r in rows], rng, mat, out=lambda p: -up_dir)
        if n_back:
            _tufts([r[back_i] for r in rows], rng, mat, out=lambda p: up_dir)
        for i, sgn in ((0, -1), (nu, 1)):          # the ends' lower edges, sparser
            line = [rows[i][j] for j in range(hem_i, back_i + 1)]
            _tufts(line, rng, mat, drop=(0.02, 0.06), spacing=(0.09, 0.18), out=lambda p, s_=sgn: t * s_)
    for n_, v_post in ((n_front, 0.3), (n_back, depth - 0.3)):
        for i in range(n_):
            u = 0.25 + (L - 0.5) * i / (n_ - 1) if n_ > 1 else L / 2
            base = a + t * u + up_dir * v_post
            lean = V((rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), 0))
            top = base + lean + UP * (z_top(v_post) - thick * 0.92 - 0.02)
            sb.cyl("timber", True, base - UP * 0.05, top, 0.06, 0.052, segs=6, caps=False)
            _bar("timber", top - t * 0.18 - UP * 0.04, top + t * 0.18 - UP * 0.04, 0.08, 0.07, 0.01)   # its cap block
    return _tris() - t0


# ---------------------------------------------------------------- decks on posts

def _ccw(P):
    s = sum(P[i].x * P[(i + 1) % len(P)].y - P[(i + 1) % len(P)].x * P[i].y for i in range(len(P)))
    return P if s > 0 else list(reversed(P))


def _span(loc, x):
    """The y range of a convex local polygon at x, or None."""
    ys = []
    n = len(loc)
    for i in range(n):
        a, b = loc[i], loc[(i + 1) % n]
        if abs(b.x - a.x) > 1e-9 and (a.x - x) * (b.x - x) <= 0:
            ys.append(a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x))
        elif abs(b.x - a.x) <= 1e-9 and abs(a.x - x) < 1e-9:
            ys += [a.y, b.y]
    return (min(ys), max(ys)) if len(ys) >= 2 else None


def _rail(p, q, z, h, rng, kind="balusters", mat="timber", collide=True):
    """A railing along plan p -> q standing on z, h high: posts at the ends and every <= 1.4 m with capped tops, a
    top rail and, as `kind`: "balusters" (a mid rail and short balusters between it and a foot rail) or "slats" (close
    vertical slats, single faces, between a foot rail and the top rail). Collides by one hidden wall 1.05 m high."""
    p, q = _p2(p), _p2(q)
    tt = (q - p).normalized()
    L = (q - p).length
    out = V((tt.y, -tt.x, 0))
    n = max(1, math.ceil(L / 1.4))
    for i in range(n + 1):
        c = p.lerp(q, i / n) + UP * z
        jit = V((rng.uniform(-0.01, 0.01), rng.uniform(-0.01, 0.01), 0))
        _bar(mat, c - UP * 0.04, c + jit + UP * (h + 0.05), 0.08, 0.08, 0.012)
        _bar(mat, c + jit + UP * (h + 0.05), c + jit + UP * (h + 0.11), 0.12, 0.12, 0.018)     # the post's cap
    _bar(mat, p - tt * 0.04 + UP * (z + h - 0.03), q + tt * 0.04 + UP * (z + h - 0.03), 0.07, 0.06, 0.012)
    _bar(mat, p + UP * (z + 0.08), q + UP * (z + 0.08), 0.06, 0.05, 0.0)
    if kind == "slats":
        s, i = 0.05, 0
        while s < L - 0.05:
            e = min(L - 0.05, s + 0.06 * rng.uniform(0.85, 1.15))
            o = out * (0.012 if i % 2 else 0.0)
            za, zb = z + h - 0.06 - rng.uniform(0.0, 0.03), z + h - 0.06 - rng.uniform(0.0, 0.03)
            k.add(mat, False, [p + tt * s + o + UP * (z + 0.1), p + tt * e + o + UP * (z + 0.1), p + tt * e + o + UP * zb,
                               p + tt * s + o + UP * za], [(0, 1, 2, 3)])
            s = e + 0.04 * rng.uniform(0.7, 1.3)
            i += 1
    else:
        zm = z + h * 0.5
        _bar(mat, p + UP * zm, q + UP * zm, 0.06, 0.05, 0.0)
        m = max(2, round(L / 0.22))
        for i in range(1, m):
            c = p.lerp(q, i / m)
            _bar(mat, c + UP * (z + 0.1), c + UP * (zm - 0.025), 0.035, 0.035, 0.0)
    if collide:
        k.add("hidden", True, [p + UP * z, q + UP * z, q + UP * (z + 1.05), p + UP * (z + 1.05)], [(0, 1, 2, 3)])


def stilt_deck(outline, deck_z, rng, z_of, post_every=1.8, rail=None, fascia=None, collide=True):
    """A plank deck on round posts over a sloping bank (the far-bank hall's raised floor, the riverside terrace, the
    jetty): `outline` a convex plan polygon [(x, y), ...] (either winding), its top at deck_z; z_of(x, y) -> the ground
    under it (a callable, or a number). The planks run across edge 0 (outline[0] -> outline[1]: the deck's front), each
    its own board with gaps, a few millimetres up or down, ragged at the ends; under them bearers along edge 0, and a
    heavy rim beam under every edge (the painted deck's front beam); round posts round the outline every <= post_every
    (and under the middle bearer of a deep deck) down to the ground wherever the ground lies over 0.15 m below the deck,
    cross-braced where they stand over 1 m tall. rail / fascia = (edge indices, "balusters" | "slats"): a railing 0.9 m
    high on those edges, or a band of short slats or balusters hanging under the deck's edge. collide: the deck's top as
    one hidden walkable face, the posts, and each rail as a hidden wall 1.05 m high. Returns the triangles added.
    choice: planks 0.22-0.32 m x 5 cm; bearers 0.12 x 0.14; rim beams 0.1 x 0.16; posts 0.07 m; rail 0.9 m; fascia 0.4 m
    deep (S3 far_bank_hall_18520 [18355, 100, 18740, 305]; S2 river_terrace_23250, jetty_27260)."""
    t0 = _tris()
    zof = z_of if callable(z_of) else (lambda x, y, _z=float(z_of): _z)
    P0 = [_p2(p) for p in outline]
    P = _ccw(P0)
    # keep edge 0 as the caller's edge 0 (the front), whatever the winding
    e0 = (_p2(outline[0]), _p2(outline[1]))
    a, b, t, n_r, left, Lf = _seg(e0[0], e0[1])
    if left.dot(sum(P, V((0, 0, 0))) / len(P) - a) < 0:
        left = -left
    loc = [V(((p - a).dot(t), (p - a).dot(left), 0)) for p in P]
    xs_ = [p.x for p in loc]
    x_lo, x_hi = min(xs_), max(xs_)
    thick = 0.05

    def W(lx, ly, z):
        return a + t * lx + left * ly + UP * z
    # planks across edge 0
    x = x_lo + 0.005
    while x < x_hi - 0.03:
        w = min(rng.uniform(0.22, 0.32), x_hi - x)
        if x_hi - (x + w) < 0.1:
            w = x_hi - x
        sp0, sp1 = _span(loc, x + 0.01), _span(loc, x + w - 0.01)
        if sp0 and sp1:
            g = rng.uniform(0.006, 0.012)
            zt = deck_z + rng.uniform(-0.008, 0.006)
            ya0, ya1 = sp0[0] + rng.uniform(-0.03, 0.02), sp1[0] + rng.uniform(-0.03, 0.02)
            yb0, yb1 = sp0[1] + rng.uniform(-0.02, 0.03), sp1[1] + rng.uniform(-0.02, 0.03)
            bot = [W(x + g, ya0, zt - thick), W(x + w - g, ya1, zt - thick), W(x + w - g, yb1, zt - thick),
                   W(x + g, yb0, zt - thick)]
            _hexa_uv("deck", bot, [p + UP * thick for p in bot], rng, left, bottom_face=False)
        x += w
    zb = deck_z - thick
    # rim beams under every edge, bearers along edge 0 inside
    cen = sum(P, V((0, 0, 0))) / len(P)
    for i in range(len(P)):
        p, q = P[i], P[(i + 1) % len(P)]
        pi_, qi = p + (cen - p).normalized() * 0.05, q + (cen - q).normalized() * 0.05
        _bar("timber", pi_ + UP * (zb - 0.08), qi + UP * (zb - 0.08), 0.1, 0.16, 0.015)
    y_lo, y_hi = min(p.y for p in loc), max(p.y for p in loc)
    nb = max(1, round((y_hi - y_lo) / 1.4) - 1)
    for j in range(1, nb + 1):
        yy = y_lo + (y_hi - y_lo) * j / (nb + 1)
        xs = [p for p in _xspan(loc, yy)] if _xspan(loc, yy) else None
        if xs:
            _bar("timber", W(xs[0] + 0.08, yy, zb - 0.07), W(xs[1] - 0.08, yy, zb - 0.07), 0.12, 0.14, 0.012)
    # posts round the outline (and under the middle bearers), braces between tall ones
    pts = []
    for i in range(len(P)):
        p, q = P[i], P[(i + 1) % len(P)]
        m = max(1, math.ceil((q - p).length / post_every))
        for s_ in range(m):
            pts.append(p.lerp(q, s_ / m))
    for j in range(1, nb + 1):
        yy = y_lo + (y_hi - y_lo) * j / (nb + 1)
        xs = _xspan(loc, yy)
        if xs and (y_hi - y_lo) > 2.4:
            m = max(1, math.ceil((xs[1] - xs[0]) / post_every))
            for s_ in range(1, m):
                pts.append(W(xs[0] + (xs[1] - xs[0]) * s_ / m, yy, 0.0))
    feet = []
    for p in pts:
        c = p + (cen - p).normalized() * 0.08
        zg = zof(c.x, c.y)
        if zg < deck_z - 0.15:
            lean = V((rng.uniform(-0.025, 0.025), rng.uniform(-0.025, 0.025), 0))
            sb.cyl("timber", collide, V((c.x, c.y, zg - 0.12)), V((c.x + lean.x, c.y + lean.y, zb - 0.16)), 0.07, 0.062,
                   segs=7, caps=False)
            feet.append((c, zg))
        else:
            feet.append(None)
    for i in range(len(feet)):
        fa, fb = feet[i], feet[(i + 1) % len(feet)]
        if not fa or not fb or (fa[0] - fb[0]).length > post_every + 0.3:
            continue
        ha, hb = zb - 0.16 - fa[1], zb - 0.16 - fb[1]
        if min(ha, hb) > 1.0:
            lo_, hi_ = (fa, fb) if i % 2 else (fb, fa)
            _bar("timber", lo_[0] + UP * (lo_[1] + 0.25), hi_[0] + UP * (zb - 0.3), 0.06, 0.06, 0.0)
    if collide:
        k.add("hidden", True, [V((p.x, p.y, deck_z)) for p in P], [tuple(range(len(P)))])
    for spec, is_rail in ((rail, True), (fascia, False)):
        if not spec:
            continue
        edges, kind = spec
        for j in edges:
            p, q = _p2(outline[j % len(outline)]), _p2(outline[(j + 1) % len(outline)])
            # rails stand on the deck a little in from its edge; the face of a fascia looks out over the edge
            p_in, q_in = p + (cen - p).normalized() * 0.04, q + (cen - q).normalized() * 0.04
            if (q_in - p_in).cross(cen - p_in).z < 0:      # wound so its right (the rail's out) faces away from the deck
                p_in, q_in = q_in, p_in
            if is_rail:
                _rail(p_in, q_in, deck_z, 0.9, rng, kind=kind, collide=collide)
            else:
                _fascia(p_in, q_in, deck_z - thick - 0.02, 0.4, rng, kind)
    return _tris() - t0


def _xspan(loc, y):
    """The x range of a convex local polygon at y, or None."""
    xs = []
    n = len(loc)
    for i in range(n):
        a, b = loc[i], loc[(i + 1) % n]
        if abs(b.y - a.y) > 1e-9 and (a.y - y) * (b.y - y) <= 0:
            xs.append(a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y))
    return (min(xs), max(xs)) if len(xs) >= 2 else None


def _fascia(p, q, z_top, h, rng, kind="slats", mat="timber"):
    """A band hanging under a deck's edge along p -> q (its face to the right): close short vertical slats ("slats",
    single faces a little in and out) or short balusters ("balusters") between a top and a foot rail."""
    p, q = _p2(p), _p2(q)
    tt = (q - p).normalized()
    L = (q - p).length
    out = V((tt.y, -tt.x, 0))
    z0 = z_top - h
    if kind == "slats":
        s, i = 0.03, 0
        while s < L - 0.03:
            e = min(L - 0.03, s + 0.07 * rng.uniform(0.85, 1.15))
            o = out * (0.04 + (0.012 if i % 2 else 0.0))
            zb_ = z0 + rng.uniform(-0.04, 0.02)
            k.add(mat, False, [p + tt * s + o + UP * zb_, p + tt * e + o + UP * zb_, p + tt * e + o + UP * z_top,
                               p + tt * s + o + UP * z_top], [(0, 1, 2, 3)])
            s = e + 0.04 * rng.uniform(0.7, 1.3)
            i += 1
        _bar(mat, p + out * 0.07 + UP * (z0 + h * 0.3), q + out * 0.07 + UP * (z0 + h * 0.3), 0.04, 0.05, 0.0)
    else:
        _bar(mat, p + out * 0.05 + UP * (z0 + 0.03), q + out * 0.05 + UP * (z0 + 0.03), 0.05, 0.05, 0.0)
        m = max(2, round(L / 0.2))
        for i in range(m + 1):
            c = p.lerp(q, i / m) + out * 0.05
            _bar(mat, c + UP * (z0 + 0.05), c + UP * z_top, 0.04, 0.04, 0.0)


# ---------------------------------------------------------------- cloth

def swag_curtain(top_a, top_b, z_top, z_hem, rng, gather="b", tie_z=None, stripes=0, mat="cloth_indigo"):
    """A cloth hung from a rod along top_a -> top_b at z_top, its face toward the right of top_a -> top_b, drawn aside
    and tied into a swag at the `gather` end ("a" | "b"), as painted at 十千脚店's gate and S2's open shop: the cloth
    hangs from the rod in folds that deepen toward the gathered end and converge on the tie (at tie_z, just in front
    of the gather end); its lower edge sweeps from close under the rod at the free end down in a sagging curve below
    the tie and rises into it; below the tie the gathered tail falls in lobed folds, flaring a little, to the hem at
    z_hem. stripes = n: n vertical stripes of cloth_white alternating with the cloth (2n + 1 bands). A thin bamboo rod
    at the top, a rope band at the tie. Returns the triangles added.
    choice: tie_z default z_hem + 0.5 (z_top - z_hem); the sag 0.18 of the drop; folds 3-8 cm deep (S3 tavern_gate_16870
    [16800, 1185, 17330, 1795], S2 open_shop_25340)."""
    t0 = _tris()
    A, Bp = _p2(top_a), _p2(top_b)
    tt0 = (Bp - A).normalized()
    out = V((tt0.y, -tt0.x, 0))                 # the face: right of top_a -> top_b
    if gather == "a":
        A, Bp = Bp, A
    tt = (Bp - A).normalized()
    L = (Bp - A).length
    drop = z_top - z_hem
    tz = tie_z if tie_z is not None else z_hem + 0.5 * drop
    T = Bp - tt * 0.1 + out * 0.08 + UP * tz             # the tie
    z_free = z_top - 0.12 * (z_top - tz)
    sag = 0.26 * (z_top - tz)
    bands = 2 * stripes + 1 if stripes else 1
    m = max(bands, round(L / 0.11))
    if stripes:
        m = bands * max(1, round(m / bands))
    rows = 7
    grid = []
    for i in range(m + 1):
        f = i / m
        depth_ = 0.025 + 0.05 * f ** 1.5 + rng.uniform(0.0, 0.01)
        fold = out * (depth_ if i % 2 else -depth_ * 0.6)
        R = A + tt * (L * f) + UP * z_top + fold * 0.25
        # the lower edge: from under the rod at the free end, sagging below the tie, rising into it
        zl = z_free + (tz - z_free) * f - sag * math.sin(math.pi * min(1.0, f / 0.9)) ** 1.2
        Lp = A.lerp(T, f ** 1.1)
        Lp = V((Lp.x, Lp.y, zl)) + fold * (1 - f) + out * 0.02 * f
        if i == m:
            Lp = T
        col = []
        for j in range(rows + 1):
            s_ = j / rows
            p = R.lerp(Lp, s_ ** 0.85) + fold * math.sin(math.pi * s_) * 0.8
            col.append(p)
        grid.append(col)
    for i in range(m):
        mm = "cloth_white" if (stripes and (i * bands // m) % 2 == 1) else mat
        verts, faces = [], []
        for j in range(rows):
            vs = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
            q = vs if (vs[1] - vs[0]).cross(vs[3] - vs[0]).dot(out) > 0 else vs[::-1]
            b0 = len(verts)
            verts += q
            faces.append((b0, b0 + 1, b0 + 2, b0 + 3))
        k.add(mm, False, verts, faces)
    # the gathered tail below the tie: lobed folds of cloth, narrowing under the tie and flaring a little to the hem
    ring_n, lobes = 12, 5
    ph = rng.uniform(0, 6.283)
    secs = [(0.0, 0.1), (0.12, 0.13), (0.4, 0.13), (0.7, 0.15), (0.92, 0.18), (1.0, 0.17)]
    ctr = lambda s_: T + UP * ((z_hem - tz) * s_) + tt * (0.05 * s_) + out * (0.03 * s_)   # noqa: E731
    verts = []
    for si, (s_, r) in enumerate(secs):
        c = ctr(s_)
        for q in range(ring_n):
            ang = 2 * math.pi * q / ring_n
            rr = r * (1 + 0.3 * math.cos(lobes * ang + ph + s_ * 1.5))
            hem = rng.uniform(-0.05, 0.03) if si == len(secs) - 1 else 0.0
            verts.append(c + (tt * math.cos(ang) * 0.8 + out * math.sin(ang) * 0.55) * rr + UP * hem)
    faces, ins = [], []
    for si in range(len(secs) - 1):
        for q in range(ring_n):
            q2 = (q + 1) % ring_n
            faces.append((si * ring_n + q, si * ring_n + q2, (si + 1) * ring_n + q2, (si + 1) * ring_n + q))
            ins.append(ctr((secs[si][0] + secs[si + 1][0]) / 2))
    faces.append(tuple(range((len(secs) - 1) * ring_n, len(secs) * ring_n)))
    ins.append(ctr(0.8))
    _solid(mat, False, verts, faces, ins)
    # the tie band, the rod
    _lathe("rope", T - UP * 0.035, UP, [(0.115, 0.0), (0.115, 0.07)], segs=8, cap0=False, cap1=False)
    sb.cyl("bamboo", False, A - tt * 0.06 + UP * (z_top + 0.03) + out * 0.01,
           Bp + tt * 0.06 + UP * (z_top + 0.03) + out * 0.01, 0.018, segs=5)
    return _tris() - t0


# ---------------------------------------------------------------- walls

def board_wall(p0, p1, z0, z1, rng, battens=2, ragged=True, doors=(), mat="timber", collide=True):
    """A wall of vertical boards along plan p0 -> p1 from z0 to z1, its face toward the right of p0 -> p1: each board
    its own piece (0.16-0.28 m wide, 3 cm thick, a few millimetres in or out, leaning a hair), with its own patch of the
    swatch (grain up the board); `battens` horizontal ledges across the face; ragged feet (each board ends at its own
    height, a few short or split, ragged=True); a top plate under whatever roof it stands beneath. doors: ((s0, s1), ...)
    metres along p0 -> p1: door-like panels, each a frame of jambs and a lintel with boards set back in it, two ledges
    across, a dark gap at the top. collide: one hidden wall (the doors stay shut). Returns the triangles added.
    choice: door height min(z1 - 0.15, z0 + 1.85); battens at 0.25 and 0.75 of the height (S1 farmhouse_wing_30190;
    S3 mat_shed_19530, far_bank_hall_18520's east end)."""
    t0 = _tris()
    a, b, tt, out, left, L = _seg(p0, p1)
    H = z1 - z0
    dz_top = min(z1 - 0.15, z0 + 1.85)
    door_spans = sorted((max(0.0, s0), min(L, s1)) for s0, s1 in doors if s1 - s0 > 0.2)

    def in_door(s):
        return any(d0 - 0.02 <= s <= d1 + 0.02 for d0, d1 in door_spans)
    s = 0.0
    i = 0
    while s < L - 0.02:
        w = min(rng.uniform(0.16, 0.28), L - s)
        if L - (s + w) < 0.08:
            w = L - s
        sm = s + w / 2
        door = in_door(sm)
        g = rng.uniform(0.004, 0.01)
        off = out * (rng.uniform(-0.006, 0.006) - (0.035 if door else 0.0))
        zb0 = z0 - 0.03 + (rng.uniform(-0.02, 0.07) if ragged else 0.0)
        zb1 = zb0 + (rng.uniform(-0.03, 0.03) if ragged else 0.0)
        if ragged and rng.random() < 0.12:        # a short, broken board
            zb1 += rng.uniform(0.05, 0.14)
        ztop = (dz_top - 0.02) if door else (z1 - rng.uniform(0.0, 0.025))
        lean = tt * rng.uniform(-0.008, 0.008)
        th = 0.03
        bot = [a + tt * (s + g) + off + UP * zb0, a + tt * (s + w - g) + off + UP * zb1,
               a + tt * (s + w - g) + off - out * th + UP * zb1, a + tt * (s + g) + off - out * th + UP * zb0]
        top = [bot[0] + lean + UP * (ztop - zb0), bot[1] + lean + UP * (ztop - zb1), bot[2] + lean + UP * (ztop - zb1),
               bot[3] + lean + UP * (ztop - zb0)]
        _hexa_uv(mat, bot, top, rng, UP)
        s += w
        i += 1
    # battens across the face (broken at the doors), and the top plate
    for f in ([0.25, 0.75] if battens == 2 else [(j + 1) / (battens + 1) for j in range(battens)]):
        zb_ = z0 + H * f + rng.uniform(-0.03, 0.03)
        cuts = [0.0] + [x for d in door_spans for x in d] + [L]
        for sa, sb_ in zip(cuts[0::2], cuts[1::2]):
            if sb_ - sa > 0.15 and (zb_ < dz_top or not door_spans):
                _bar(mat, a + tt * (sa + 0.03) + out * 0.02 + UP * zb_, a + tt * (sb_ - 0.03) + out * 0.02 + UP * (zb_ + rng.uniform(-0.02, 0.02)),
                     0.03, 0.09, 0.008)
            elif sb_ - sa > 0.15:
                _bar(mat, a + tt * (sa + 0.03) + out * 0.02 + UP * zb_, a + tt * (sb_ - 0.03) + out * 0.02 + UP * zb_, 0.03, 0.09, 0.008)
    _bar(mat, a - tt * 0.03 - out * 0.015 + UP * (z1 - 0.04), b + tt * 0.03 - out * 0.015 + UP * (z1 - 0.04), 0.09, 0.08, 0.012)
    # door-like panels: jambs, lintel, two ledges on the leaf, a dark gap over it
    for d0, d1 in door_spans:
        for sd in (d0, d1):
            _bar(mat, a + tt * sd + out * 0.02 + UP * (z0 - 0.02), a + tt * sd + out * 0.02 + UP * (dz_top + 0.1), 0.09, 0.07, 0.012)
        _bar(mat, a + tt * (d0 - 0.06) + out * 0.025 + UP * (dz_top + 0.05), a + tt * (d1 + 0.06) + out * 0.025 + UP * (dz_top + 0.05),
             0.1, 0.1, 0.015)
        for zz in (z0 + 0.35, dz_top - 0.35):
            _bar(mat, a + tt * (d0 + 0.08) - out * 0.005 + UP * zz, a + tt * (d1 - 0.08) - out * 0.005 + UP * zz, 0.025, 0.08, 0.006)
        if z1 - dz_top > 0.25:
            q = [a + tt * (d0 + 0.05) - out * 0.04 + UP * (dz_top + 0.12), a + tt * (d1 - 0.05) - out * 0.04 + UP * (dz_top + 0.12),
                 a + tt * (d1 - 0.05) - out * 0.04 + UP * (z1 - 0.1), a + tt * (d0 + 0.05) - out * 0.04 + UP * (z1 - 0.1)]
            _solid("timber", False, q, [(0, 1, 2, 3)], q[0] - out * 1.0)
    if collide:
        k.add("hidden", True, [a + UP * z0, b + UP * z0, b + UP * z1, a + UP * z1], [(0, 1, 2, 3)])
    return _tris() - t0


# ---------------------------------------------------------------- mooring stakes and posts

def mooring_stake(x, y, z_foot, z_top, rng, r=0.06, top="taper", rope=None, lamp=False):
    """A thin tapered mooring stake or pole (from z_foot, which may be under the water or the bank, to z_top), a little
    out of true with a slight bend, dark bark: its top "taper" (sharpened) or "knob" (a rounded head under a collar);
    rope None, "turns" (a few turns near the top), "knot" (the turns, a knot and a short loose tail), or "coil" (a rope
    coiled round its top in several turns and hanging in loops down its sides); lamp: a small framed box lamp on top
    (paper panels, a little cap). The post collides. Returns the rope point (x, y, z): where a boat's line ties, on the
    stake 0.18 m under its top (on the turns, when there is rope).
    choice: lean up to 4 cm, a bend at mid-height; turns 4.5 cm apart; lamp 0.16 x 0.16 x 0.24 m (S2 mooring_stake_27902,
    mooring_post_23126, mooring_post_rope_28272; S1 mooring_pole_36444; S3 mooring_post_17702)."""
    lean = V((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), 0))
    F = V((x, y, z_foot))
    T = V((x, y, z_top)) + lean
    Mid = F.lerp(T, 0.5) + V((rng.uniform(-0.015, 0.015), rng.uniform(-0.015, 0.015), 0))
    sb.tube("bark", True, [F, Mid, T], [r, r * 0.86, r * 0.74], segs=7)
    ax = (T - Mid).normalized()
    if top == "knob":
        _lathe("bark", T, ax, [(r * 0.74, 0.0), (r * 1.1, 0.02), (r * 0.8, 0.05), (r * 1.15, 0.09), (r * 0.9, 0.13),
                               (0.0, 0.16)], segs=7, cap0=False)
    else:
        _lathe("bark", T, ax, [(r * 0.74, 0.0), (r * 0.5, r * 1.2), (0.0, r * 2.4)], segs=7, cap0=False)
    zr = z_top - 0.18
    P = Mid.lerp(T, max(0.0, min(1.0, (zr - Mid.z) / max(1e-6, T.z - Mid.z)))) if zr > Mid.z else \
        F.lerp(Mid, max(0.0, min(1.0, (zr - F.z) / max(1e-6, Mid.z - F.z))))
    rr = r * 0.74 + 0.017
    if rope in ("turns", "knot", "coil"):
        nt = 3 if rope != "coil" else 6
        for i in range(nt):
            c = P + ax * (0.045 * (i - (nt - 1) / 2))
            ring = [c + V((math.cos(2 * math.pi * j / 6 + i * 0.4), math.sin(2 * math.pi * j / 6 + i * 0.4), 0)) * rr
                    + UP * (0.012 * math.sin(2 * math.pi * j / 6 + i)) for j in range(7)]
            sb.tube("rope", False, ring, [0.017] * 7, segs=4)
        if rope == "knot":
            ang = rng.uniform(0, 6.283)
            d = V((math.cos(ang), math.sin(ang), 0))
            kn = P + d * (rr + 0.02)
            _lathe("rope", kn - UP * 0.035, UP, [(0.02, 0.0), (0.045, 0.02), (0.04, 0.05), (0.0, 0.07)], segs=6,
                   cap0=True)
            sb.tube("rope", False, [kn, kn + d * 0.04 - UP * 0.1, kn + d * 0.05 + V((0.02, 0.0, 0)) - UP * 0.24],
                    [0.016, 0.014, 0.011], segs=4)
        if rope == "coil":
            for sgn in (-1, 1):
                for depth_, w_ in ((0.32, 0.12), (0.5, 0.08)):
                    side = V((sgn, 0, 0)) * (rr + 0.01)
                    fwd = V((0, 1, 0)) * w_
                    pts = [P + side + fwd * 0.6, P + side * 1.35 - UP * depth_ * 0.7, P + side * 1.15 - UP * depth_,
                           P + side - fwd * 0.6]
                    sb.tube("rope", False, pts, [0.016] * len(pts), segs=4)
    if lamp:
        zl = T.z + 0.02
        c = V((T.x, T.y, zl))
        hb, hh = 0.08, 0.24
        for sx in (-1, 1):
            for sy in (-1, 1):
                p = c + V((sx * hb, sy * hb, 0))
                _bar("timber", p, p + UP * hh, 0.022, 0.022, 0.0)
        for zz in (0.0, hh):
            ring = [c + V((sx * hb, sy * hb, zz)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            for p, q in zip(ring, ring[1:] + ring[:1]):
                _bar("timber", p, q, 0.025, 0.025, 0.0)
        for sx, sy, ex, ey in ((-1, -1, 1, -1), (1, -1, 1, 1), (1, 1, -1, 1), (-1, 1, -1, -1)):
            p, q = c + V((sx * (hb - 0.004), sy * (hb - 0.004), 0.02)), c + V((ex * (hb - 0.004), ey * (hb - 0.004), 0.02))
            quad = [p, q, q + UP * (hh - 0.04), p + UP * (hh - 0.04)]
            _solid("cloth_white", False, quad, [(0, 1, 2, 3)], c + UP * (hh / 2))
        _lathe("timber", c + UP * hh, UP, [(hb * 1.6, 0.0), (hb * 1.2, 0.04), (0.02, 0.1), (0.0, 0.12)], segs=6)
        _bar("timber", c, c + UP * 0.02, hb * 2.2, hb * 2.2, 0.01)
    return (round(P.x, 4), round(P.y, 4), round(P.z, 4))
