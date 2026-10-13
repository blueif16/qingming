"""Outer-road part 2 kit (S4b, sections/outer_road_2: the outer road east to the moorings, scan u 12600-15500): the
parts the area needs that song_kit.py, kit_inner_city.py, kit_outer_road.py and kit_vehicles.py lack: the palm-covered
family cart (大棕盖车), Song chairs, the wheelwright's yard (pole frame with its basket, timber pile, striped load,
tools), stall furniture and vessels, the fan-shaped thatch shade, straw heaps, the mooring post, the tea house's
fringed canopy and open king-post gable, the roof hatch, the south-row hall type, open mat sheds, a generic hall
(part 1's, with a front that faces either way) and a cloth valance.

Generic builder functions in the song_kit manner: each adds faces to street_b1's bucket set `sb.B` through the
song_kit / street_b1 primitives and never opens an entity; the area builder (blender/outer_road_2_scene.py) wraps
every call in `with sb.entity(<map id>):`. Positions always come from the caller (layout.json); sizes the strokes
can't give are keyword defaults marked `choice:` here. Frame: x = map X (east), y = map D (north), z up, metres.
yaw_deg 0 = +x (east), 90 = +y (north). Built at real size (map/BUILDING.md rule 5).

Materials: the shared swatches only (no new texture). Palm fibre (棕) is `bark` with darker `interior` strands; straw,
reed and matting `reed` (its strands laid along the UVs' u); pale earthenware `plaster`; iron `ridge`; dark cloth
`cloth_indigo` / `interior`. Thin things (strands, fringes, cloth, mats) are single faces: the exported materials are
double-sided. Colliders (`collide=True`) only on what must stop a walker: posts, walls, cart bodies (one hidden box),
big jars, heaps and piles (hidden boxes); never on small things or seats.

Review (headless): scratchpad S4b_run2_kit/review.py (the kit agent's; see the run report).
"""
import math
import random

from mathutils import Matrix, Vector

import song_kit as k
import street_b1 as sb
import kit_inner_city as ki
import kit_outer_road as ko
import kit_vehicles as kv

V = Vector
UP = V((0, 0, 1))
PALM, PALM_DARK, STRAW, IRON = "bark", "interior", "reed", "ridge"


def _tri():
    return sum(len(f) - 2 for b in sb.B.data.values() for f in b["f"])


def _box_hidden(lo, hi):
    """An invisible collider box (local coordinates when inside k.placed)."""
    k.bx("hidden", True, lo, hi)


def _rot(yaw_deg):
    a = math.radians(yaw_deg)
    return V((math.cos(a), math.sin(a), 0)), V((-math.sin(a), math.cos(a), 0))


def _tongue(mat, a, b, tip):
    """One hanging strand (a thin triangle), wound to face out from the line a-b toward `tip`'s side."""
    k.add(mat, False, [V(a), V(b), V(tip)], [(0, 1, 2)])


# ---------------------------------------------------------------- 1. the palm-covered family cart (大棕盖车)

def _palm_roof(x_r, x_f, hw, z_b, z_sh, z_top, rng, hood=0.8, z_hood_b=None, step=0.12, amp=0.045, mat=PALM):
    """The huge shaggy palm-fibre roof in a local frame (x along the cart from the rear end x_r to the hood's tip x_f,
    y to the left, z up): a fluted shell lofted through cross-sections every `step` m, each pushed alternately out and
    in by about `amp` along its own normal (each its own depth), so the fibres read as close vertical strands down the
    sides and over the crown; the sides bulge and flare out toward a ragged hem (drooping eaves); a rounded-down rear
    end; a hood over the last `hood` m whose top rises and whose skirt sweeps up toward the front, open underneath.
    Hanging strands of their own lengths along the hem (dark and pale) and two shaggy courses higher up (the layered
    fibre). Ends closed by domed fans. Returns (params(x) -> (half width, hem z, shoulder z, crown z), station xs)."""
    x_h0 = x_f - hood
    z_hood_b = z_sh + 0.02 if z_hood_b is None else z_hood_b
    n = max(8, round((x_f - x_r) / step))
    xs = [x_r + (x_f - x_r) * i / n for i in range(n + 1)]

    def params(x):
        fr = min(1.0, max(0.0, (x - x_r) / 0.5))
        fh = min(1.0, max(0.0, (x - x_h0) / max(hood, 1e-3)))
        sm = fh * fh * (3 - 2 * fh)
        w = hw * (0.8 + 0.2 * math.sqrt(fr)) + 0.05 * sm
        top = z_top - 0.22 * (1 - fr) ** 2 + 0.16 * fh ** 1.6
        zb = z_b + 0.08 * (1 - fr) + (z_hood_b - z_b) * sm
        sh = z_sh + (top - z_top) * 0.5 + 0.08 * sm
        return w, zb, sh, top

    def half(w, zb, sh, top):
        return [(w + 0.11, zb), (w + 0.09, zb + 0.35 * (sh - zb)), (w + 0.06, zb + 0.72 * (sh - zb)), (w + 0.02, sh),
                (w - 0.09, sh + 0.5 * (top - sh)), (w - 0.3, sh + 0.86 * (top - sh)), (w * 0.4, top - 0.02),
                (0.0, top)]

    rings, hems, outs = [], [], []
    for i, x in enumerate(xs):
        w, zb, sh, top = params(x)
        hl = half(w, zb + rng.uniform(-0.05, 0.04), sh, top)
        hr = half(w, zb + rng.uniform(-0.05, 0.04), sh, top)
        prof = hl + [(-y, z) for y, z in reversed(hr[:-1])]
        m = len(prof)
        # mostly alternating flutes, each its own depth, now and then two alike: strands, not boards
        sgn = (1 if i % 2 == 0 else -1) * (rng.uniform(0.5, 1.35) if rng.random() > 0.15 else -0.4)
        ring, nrm = [], []
        for j, (y, z) in enumerate(prof):
            ya, za = prof[max(j - 1, 0)]
            yb, zb_ = prof[min(j + 1, m - 1)]
            ty, tz = yb - ya, zb_ - za
            nn = V((0, tz, -ty)).normalized() if (ty or tz) else V((0, 0, 1))
            if nn.dot(V((0, y, z - (zb + sh) / 2))) < 0:
                nn = -nn
            a = amp * sgn * (1.0 if z < sh else 0.6) * rng.uniform(0.7, 1.3) + rng.uniform(-0.01, 0.01)
            ring.append(V((x + rng.uniform(-0.03, 0.03), y, z)) + nn * a)     # each crease wanders a little
            nrm.append(nn)
        rings.append(ring)
        outs.append(nrm)
        hems.append((w, zb, sh, top))
    m = len(rings[0])
    verts = [p for r in rings for p in r]
    faces, ins = [], []
    for i in range(len(rings) - 1):
        xc = (xs[i] + xs[i + 1]) / 2
        _, zb, sh, top = hems[i]
        for j in range(m - 1):
            faces.append((i * m + j, (i + 1) * m + j, (i + 1) * m + j + 1, i * m + j + 1))
            ins.append(V((xc, 0, (zb + sh) / 2 - 0.1)))
    for idx, dx in ((0, -1), (len(rings) - 1, 1)):       # the ends: domed fans from a centre pushed out
        _, zb, sh, top = hems[idx]
        c = V((xs[idx] + dx * (0.2 if dx < 0 else 0.24), 0, zb + 0.55 * (top - zb)))
        ci = len(verts)
        verts.append(c)
        ring = list(range(idx * m, idx * m + m))
        for j in range(m):
            faces.append((ring[j], ring[(j + 1) % m], ci))
            ins.append(V((xs[idx] - dx * 0.5, 0, zb + 0.4 * (top - zb))))
    k.add(mat, False, verts, kv._orient(verts, faces, ins))
    # hanging strands: along the hem (three a station, long), and two shaggy courses up the side
    for j0, per, lo, hi in ((0, 3, 0.12, 0.32), (2, 2, 0.1, 0.22), (4, 1, 0.08, 0.16)):
        for side in (0, 1):
            jj = j0 if side == 0 else m - 1 - j0
            for i in range(len(rings) - 1):
                a, b = rings[i][jj], rings[i + 1][jj]
                out = (outs[i][jj] + outs[i + 1][jj]).normalized()
                for q in range(per):
                    p, r_ = a.lerp(b, q / per), a.lerp(b, (q + 1) / per)
                    L = rng.uniform(lo, hi)
                    tip = p.lerp(r_, rng.uniform(0.3, 0.7)) - UP * L + out * (0.03 if j0 == 0 else 0.07)
                    mm = PALM_DARK if rng.random() < (0.35 if j0 == 0 else 0.2) else mat
                    _tongue(mm, p + out * 0.012, r_ + out * 0.012, tip)
    for idx, dx in ((0, -1), (len(rings) - 1, 1)):        # along the two ends' bottom chords
        a, b = rings[idx][0], rings[idx][m - 1]
        nq = max(3, round((a - b).length / 0.08))
        for q in range(nq):
            p, r_ = a.lerp(b, q / nq), a.lerp(b, (q + 1) / nq)
            tip = p.lerp(r_, 0.5) - UP * rng.uniform(0.1, 0.26) + V((dx * 0.04, 0, 0))
            _tongue(PALM_DARK if rng.random() < 0.35 else mat, p, r_, tip)
    return lambda x: params(x), xs


def _cord_on_roof(params, xs_ridge, x_loops, rng, drop=0.5, r=0.022, mat=PALM_DARK):
    """The black cord along the ridge (local frame), and at each x of x_loops a loop hanging down both sides of the
    roof `drop` m below the shoulder and back up (where the cord is tied down), lying just proud of the fibre."""
    x0, x1 = xs_ridge
    n = max(4, round((x1 - x0) / 0.3))
    pts = [V((x0 + (x1 - x0) * i / n, 0, params(x0 + (x1 - x0) * i / n)[3] + 0.05)) for i in range(n + 1)]
    sb.tube(mat, False, pts, [r] * len(pts), segs=4)
    for xl in x_loops:
        w, zb, sh, top = params(xl)
        down = [(0.0, top + 0.05), (w * 0.4, top + 0.035), (w - 0.25, sh + 0.86 * (top - sh) + 0.05),
                (w - 0.04, sh + 0.5 * (top - sh) + 0.06), (w + 0.09, sh + 0.02), (w + 0.12, sh - drop * 0.6),
                (w + 0.14, sh - drop)]
        for s_ in (1, -1):
            loop = [V((xl - 0.11 * (1 - i / (len(down) - 1)) - 0.02, s_ * y, z)) for i, (y, z) in enumerate(down)]
            loop += [V((xl + 0.11 * (1 - i / (len(down) - 1)) + 0.02, s_ * y, z)) for i, (y, z) in reversed(list(enumerate(down)))]
            sb.tube(mat, False, loop, [r] * len(loop), segs=3)


def _rail_band(x0, x1, y, z0, z1, out, rng, bar=0.15):
    """One side of the lattice-railed under-frame (local frame, a plane at y facing `out`): bottom and top rails, close
    upright bars (each a flat strip with one side face), a dark backing behind them."""
    k.beam("timber", False, (x0 - 0.04, y, z0 + 0.04), (x1 + 0.04, y, z0 + 0.04), 0.08, 0.08, 0.015)
    k.beam("timber", False, (x0 - 0.04, y, z1 - 0.035), (x1 + 0.04, y, z1 - 0.035), 0.08, 0.07, 0.015)
    k.beam("timber", False, (x0, y, (z0 + z1) / 2), (x1, y, (z0 + z1) / 2), 0.05, 0.035, 0)
    n = max(3, round((x1 - x0) / bar))
    yy = y + out * 0.03
    for i in range(1, n):
        x = x0 + (x1 - x0) * i / n + rng.uniform(-0.006, 0.006)
        a, b = V((x - 0.014, yy, z0 + 0.08)), V((x + 0.014, yy, z0 + 0.08))
        c, d = V((x + 0.014, yy, z1 - 0.07)), V((x - 0.014, yy, z1 - 0.07))
        q = [a, b, c, d] if out < 0 else [b, a, d, c]
        sb.quad("lattice", False, *q)
        e = V((0, -out * 0.025, 0))
        sb.quad("lattice", False, *([q[1], q[1] + e, q[2] + e, q[2]]))
    q = [V((x0, y - out * 0.01, z0 + 0.08)), V((x1, y - out * 0.01, z0 + 0.08)), V((x1, y - out * 0.01, z1 - 0.07)),
         V((x0, y - out * 0.01, z1 - 0.07))]
    sb.quad("interior", False, *(q if out < 0 else q[::-1]))


def _carved_end(p, d, s=1.0, mat="timber"):
    """The carved end of a jutting beam (the shafts' roots): an upturned scroll, a short block curling up and back,
    with a round boss on its side. p: the beam's end (local), d: the beam's direction."""
    d = V(d).normalized()
    p = V(p)
    k.beam(mat, False, p - d * 0.02, p + d * 0.1 * s + UP * 0.07 * s, 0.1 * s, 0.1 * s, 0.02)
    k.beam(mat, False, p + d * 0.09 * s + UP * 0.06 * s, p + d * 0.1 * s + UP * 0.17 * s, 0.09 * s, 0.08 * s, 0.02)
    k.beam(mat, False, p + d * 0.1 * s + UP * 0.16 * s, p + d * 0.03 * s + UP * 0.2 * s, 0.08 * s, 0.07 * s, 0.015)


def palm_cart(front, rear, wheels=None, team=None, z_of=None, rng=None, hitched=True, load=False, R=0.85, spokes=18,
              body_len=3.9, body_w=1.3, seat=True, wheel_at=0.56, body_h=1.15, crown=0.6, hood=0.8, knob=True):
    """The palm-covered family cart (大棕盖车; S4b.veh.palm_cart_13070 parked, S4b.veh.palm_cart_13455 under way):
    kit_vehicles.covered_ox_cart's bed (two sills over the axle, bearers, floor), its two big spoked wheels outside the
    body and its axle placement, under a HUGE SHAGGY PALM-FIBRE ROOF in place of the reed barrel: a fluted shell of
    close strands hanging nearly to the bed (drooping eaves, a ragged hem, layered courses), a rounded rear end, a
    black cord along the ridge that loops down both sides near the rear and again where the hood begins, a hood over
    the front that rises and opens underneath (a knob on its ridge); below the roof a lattice-railed under-frame.
    hitched=True: two shafts from under the bed to the shaft ox's neck yoke, a lead ox on rope traces from its own yoke
    (team as covered_ox_cart's: [(x, y, facing_deg, kind)], the shaft ox the nearest rank); no team: the shafts run to
    `front` with a yoke bar across their tips. hitched=False: no shafts or yoke, the sills jut out past the body ending
    in carved beam ends (the shafts' roots), a crossbar between them standing on a prop, so the cart stands level.
    load=True: a dark sack and a dark box slung on ropes under the bed's rear half.
    Returns kit_vehicles.Built: the triangles, `.seat` (x, y, z, facing_deg) the top of the plank where the person
    under the front of the thatch sits, `.feet` the footboard (hitched) or the jutting frame (parked) under his feet.
    Positions as covered_ox_cart: front/rear set the axis; wheels[0] (its position along the axis) places the axle.
    choice: R 0.85, spokes 18 (as covered_ox_cart); body 3.9 x 1.3 m (the painted roof, 400 px = 5.2 m, / 1.3 for the
    painted figures' scale = 4.0 m, plus the hood); bed to shoulder 1.1, crown 0.7 above it (ridge 2.9 m: painted
    290 px / 77 / 1.3); hood 0.8 m (cart 13070: the part east of the second cord drop, 106 px); the hem 0.4 m over the
    bed (the painted lattice band, about 40 px, shows below it); fibre strands every 0.24 m."""
    z_of = kv._zf(z_of)
    rng = rng or random.Random(13070)
    t0 = _tri()
    origin, fwd, left, L = kv._axis(rear, front)
    s_w = kv._along(wheels[0], origin, fwd) if wheels else L * 0.45
    zg = z_of(*(origin + fwd * s_w).xy)
    bx0 = s_w - wheel_at * body_len
    bx1 = bx0 + body_len
    hw = body_w / 2
    z_sill = R + 0.05
    z_bed = z_sill + 0.14
    z_lr = z_bed + 0.4            # the lattice band's top, just under the hem
    z_sh = z_bed + body_h
    z_top = z_sh + crown
    track = hw + 0.33
    M = kv._frame_m(origin, fwd, zg)
    x_rear, x_tip = bx0 - 0.25, bx1 + hood - 0.2
    with k.placed(M):
        # bed: two sills over the axle, cross bearers, floor boards, iron-shod rear sill ends
        x_sill_f = bx1 + (0.98 if not hitched else 0.6)
        for y in (hw - 0.05, -hw + 0.05):
            k.beam("timber", False, (bx0 - 0.22, y, z_sill + 0.07), (x_sill_f, y, z_sill + 0.07), 0.13, 0.14, 0.02)
            k.beam("lattice", False, (bx0 - 0.24, y, z_sill + 0.07), (bx0 - 0.12, y, z_sill + 0.07), 0.15, 0.16, 0.02)
        for x in [bx0 + 0.1 + i * (body_len - 0.2) / 4 for i in range(5)]:
            k.beam("timber", False, (x, hw + 0.04, z_sill - 0.02), (x, -hw - 0.04, z_sill - 0.02), 0.1, 0.08, 0.015)
        k.board("timber", False, (bx0, 0), (bx1, 0), body_w - 0.12, z_bed - 0.05, z_bed)
        k.beam("timber", False, (s_w, track + 0.05, R), (s_w, -track - 0.05, R), 0.12, 0.12, 0.02)
        for y in (hw - 0.05, -hw + 0.05):
            k.bx("timber", False, (s_w - 0.14, y - 0.08, R + 0.04), (s_w + 0.14, y + 0.08, z_sill))
        # the lattice-railed under-frame: corner posts, a railed band along both sides and across the rear
        for y, out in ((hw, 1), (-hw, -1)):
            _rail_band(bx0, bx1, y, z_bed, z_lr, out, rng)
        for x in (bx0, bx1):
            for y in (hw, -hw):
                k.post("timber", False, x, y, z_sill, z_lr + 0.05, 0.085, 0.015)
        k.beam("timber", False, (bx0, hw, z_lr - 0.035), (bx0, -hw, z_lr - 0.035), 0.08, 0.07, 0.015)
        k.beam("timber", False, (bx0, hw, z_bed + 0.04), (bx0, -hw, z_bed + 0.04), 0.08, 0.08, 0.015)
        nb = 9
        for i in range(1, nb):
            y = -hw + body_w * i / nb
            k.beam("lattice", False, (bx0 - 0.03, y, z_bed + 0.08), (bx0 - 0.03, y, z_lr - 0.07), 0.025, 0.028, 0)
        # the body under the roof: dark inner walls (seen under the hood and through the bars), the front opening
        for y, out in ((hw - 0.02, 1), (-hw + 0.02, -1)):
            q = [V((bx0, y, z_bed)), V((bx1, y, z_bed)), V((bx1, y, z_sh)), V((bx0, y, z_sh))]
            sb.quad("interior", False, *(q if out < 0 else q[::-1]))
        q = [V((bx1 - 0.35, -hw, z_bed)), V((bx1 - 0.35, hw, z_bed)), V((bx1 - 0.35, hw, z_sh + 0.3)),
             V((bx1 - 0.35, -hw, z_sh + 0.3))]
        sb.quad("interior", False, *q)
        sb.quad("interior", False, *q[::-1])
        for y in (hw, -hw):         # the body's front posts and a low front rail under the hood
            k.post("timber", False, bx1, y, z_lr, z_sh, 0.08, 0.015)
        k.beam("timber", False, (bx1, hw, z_bed + 0.3), (bx1, -hw, z_bed + 0.3), 0.06, 0.06, 0.01)
        # the roof
        params, xs = _palm_roof(x_rear, x_tip, hw + 0.08, z_lr + 0.03, z_sh, z_top, rng, hood=hood)
        x_h0 = x_tip - hood
        _cord_on_roof(params, (x_rear + 0.1, x_tip - 0.12), [x_rear + 0.45, x_h0], rng)
        # the rear drop: the cord runs down the rear end to the under-frame and is tied there
        w, zb, sh, top = params(x_rear + 0.05)
        sb.tube(PALM_DARK, False, [V((x_rear + 0.1, 0, top + 0.03)), V((x_rear - 0.06, 0, top - 0.15)),
                                   V((x_rear - 0.14, 0, zb + 0.55 * (top - zb))), V((x_rear - 0.08, 0, zb - 0.02)),
                                   V((bx0 - 0.03, 0, z_lr - 0.06))], [0.016] * 5, segs=4)
        if knob:
            w, zb, sh, top = params(x_tip - 0.25)
            ko._lathe3("timber", False, (x_tip - 0.25, 0, top - 0.02), V((1, 0, 0)), V((0, 1, 0)), UP,
                       [(0.05, 0.05, 0), (0.07, 0.07, 0.05), (0.06, 0.06, 0.1), (0.0, 0.0, 0.16)], segs=6, cap0=False)
        if load:
            # a dark sack and a dark box slung on ropes under the bed's rear half (behind the axle)
            xs_ = bx0 + 0.25 + (s_w - 0.5 - bx0 - 0.25) * 0.3
            c = V((xs_, 0.12, z_sill - 0.55))
            kv.soft_sack(c, 0.7, 0.42, 0.34, 0.0, rng, mat=PALM, tie=True)
            xb = xs_ + 0.62
            k.soft_box(PALM_DARK, False, (xb - 0.22, -0.3, z_sill - 0.5), (xb + 0.22, 0.12, z_sill - 0.16), rng,
                       r=0.03, wob=0.006, ease=0.012)
            for (px, py, pz), (qx, qy) in (((xs_ - 0.22, 0.2, z_sill - 0.27), (xs_ - 0.22, hw - 0.05)),
                                           ((xs_ + 0.2, 0.2, z_sill - 0.27), (xs_ + 0.2, hw - 0.05)),
                                           ((xb - 0.15, -0.28, z_sill - 0.16), (xb - 0.15, -hw + 0.05)),
                                           ((xb + 0.15, -0.28, z_sill - 0.16), (xb + 0.15, -hw + 0.05))):
                kv._rope((px, py, pz), (qx, qy, z_sill), sag=0.0, r=0.012, n=1)
            k.beam("rope", False, (xs_ - 0.22, 0.0, z_sill - 0.2), (xs_ + 0.2, 0.0, z_sill - 0.2), 0.02, 0.02, 0)
        # the walker's collider: the body and wheels (it stops at the body's front, so the seat is clear)
        _box_hidden((bx0 - 0.3, -track - 0.12, 0), (bx1 + 0.04, track + 0.12, z_top))
    seat_t = feet = None
    if not hitched:
        # the jutting frame: the sills end in carved beam ends, a crossbar between them on a forked prop
        with k.placed(M):
            for y in (hw - 0.05, -hw + 0.05):
                _carved_end((x_sill_f, y, z_sill + 0.07), (1, 0, 0))
            xc = x_sill_f - 0.18
            k.beam("timber", False, (xc, hw + 0.02, z_sill + 0.02), (xc, -hw - 0.02, z_sill + 0.02), 0.09, 0.09, 0.015)
            k.beam("timber", False, (xc + 0.03, 0.05, 0.0), (xc, 0.0, z_sill - 0.05), 0.07, 0.07, 0.012)
            for s in (1, -1):
                k.beam("timber", False, (xc, 0.0, z_sill - 0.2), (xc - 0.02, s * 0.08, z_sill - 0.04), 0.045, 0.045, 0)
            if seat:
                kv.plank_flat("timber", (bx1 + 0.32, hw - 0.04), (bx1 + 0.32, -hw + 0.04), 0.3, z_sill + 0.14,
                              z_sill + 0.18, rng)
        if seat:
            heading = math.degrees(math.atan2(fwd.y, fwd.x))
            s_ = M @ V((bx1 + 0.32, 0, z_sill + 0.18))
            f_ = M @ V((xc, 0, z_sill + 0.07))
            seat_t = (round(s_.x, 3), round(s_.y, 3), round(s_.z, 3), round(heading, 1))
            feet = (round(f_.x, 3), round(f_.y, 3), round(f_.z, 3))
    else:
        if seat:
            seat_t, feet = kv._driver_seat(M, fwd, bx1 + 0.32, z_sill + 0.17, hw - 0.02, bx1 + 0.72, R * 0.62, rng,
                                           [(x_sill_f - 0.02, y, z_sill + 0.03) for y in (hw - 0.05, -hw + 0.05)])
        # the shafts: from under the bed, past the body's front, up to the shaft ox's yoke
        if team:
            animals = kv._team(team, z_of, "ox")
            first = kv._ranks(animals, origin, fwd)[0]
            lv = first[0]["left"]
            cs = sorted((o["C"] for o in first), key=lambda p: p.dot(lv))
            yz = max(p.z for p in cs) + 0.07
            tips = [V((cs[-1].x, cs[-1].y, yz)) + lv * 0.4 - UP * 0.04, V((cs[0].x, cs[0].y, yz)) - lv * 0.4 - UP * 0.04]
            if tips[0].dot(left) < tips[1].dot(left):
                tips.reverse()
        else:
            H = kv.HARNESS["ox"]
            f = V((front[0], front[1], 0))
            zt = z_of(f.x, f.y) + H["collar_h"] + 0.04
            tips = [V((f.x, f.y, zt)) + left * 0.42, V((f.x, f.y, zt)) - left * 0.42]
        for sgn, tip in zip((1, -1), tips):
            p0 = M @ V((s_w - 0.55, sgn * (hw - 0.12), z_sill - 0.11))
            p1 = M @ V((bx1 + 0.25, sgn * (hw - 0.12), z_sill - 0.09))
            p2 = p1.lerp(tip, 0.55) + UP * 0.06
            kv._polybeam("timber", [p0, p1, p2, tip + fwd * 0.06], 0.08, 0.1, 0.015)
            k.beam("lattice", False, tip - fwd * 0.04, tip + fwd * 0.08, 0.1, 0.12, 0.015)
        k.beam("timber", False, M @ V((bx1 + 0.22, hw - 0.08, z_sill + 0.01)), M @ V((bx1 + 0.22, -hw + 0.08, z_sill + 0.01)),
               0.07, 0.07, 0.012)
        if team:
            kv._harness(origin, fwd, left, (tips[0] + tips[1]) / 2, team, z_of, "ox", "shafts")
        else:
            a, b = tips[0] + UP * 0.06 + left * 0.15, tips[1] + UP * 0.06 - left * 0.15
            kv._polybeam("timber", [a + UP * 0.07, a.lerp(b, 0.18) + UP * 0.015, (a + b) / 2, a.lerp(b, 0.82) + UP * 0.015,
                                    b + UP * 0.07], 0.11, 0.1, 0.02)
    # wheels, outside the body (world)
    for sgn in (1, -1):
        kv.spoked_wheel(M @ V((s_w, sgn * track, R)), left * sgn, R, spokes=spokes, phase=rng.uniform(0, 1))
    return kv.Built(_tri() - t0, seat_t, feet)


# ---------------------------------------------------------------- 2. the Song chair

def chair(x, y, z, yaw_deg, rng, back="slats", h=0.45, s=0.44):
    """A Song wooden chair (seat top at h, square s): four square legs with aprons under the seat and low stretchers,
    a framed seat; the back legs run up as the back posts. back: 'slats' (a yoke-shaped top rail with upturned ends
    over three slats), 'round' (a round-backed chair 圈椅: one bent rail sweeping from the arms round the back, a
    splat), 'lattice' (a grid of thin bars in the back frame), 'plain' (a top rail over one wide splat). yaw 0: the
    sitter faces +x (the back at -x). Seats don't collide (a seated figure is grounded by the page).
    choice: back 0.5 m above the seat; legs 4 cm."""
    hs = s / 2
    lw = 0.042
    with k.placed(k.frame(x, y, z, yaw_deg)):
        zb = h + (0.24 if back == "round" else 0.5)
        for sx in (-1, 1):
            for sy in (-1, 1):
                px, py = sx * (hs - 0.03), sy * (hs - 0.03)
                top = zb if sx < 0 else (h + 0.24 if back == "round" else h - 0.035)
                k.beam("timber", False, (px, py, 0), (px, py, top), lw, lw, 0)
        k.soft_box("timber", False, (-hs, -hs, h - 0.035), (hs, hs, h), rng, r=0.02, wob=0.003, ease=0.008, along=(0, 1))
        for a, b in (((-hs + 0.03, -hs + 0.03), (hs - 0.03, -hs + 0.03)), ((-hs + 0.03, hs - 0.03), (hs - 0.03, hs - 0.03)),
                     ((hs - 0.03, -hs + 0.03), (hs - 0.03, hs - 0.03))):
            k.beam("timber", False, (a[0], a[1], h - 0.07), (b[0], b[1], h - 0.07), 0.025, 0.06, 0)      # aprons
        k.beam("timber", False, (hs - 0.03, -hs + 0.03, 0.09), (hs - 0.03, hs - 0.03, 0.09), 0.03, 0.03, 0)   # footrest
        for sy in (-1, 1):
            k.beam("timber", False, (-hs + 0.03, sy * (hs - 0.03), 0.16), (hs - 0.03, sy * (hs - 0.03), 0.16), 0.025, 0.025, 0)
        xb = -hs + 0.03
        if back == "round":
            # one bent rail: from the left arm's front post round the back (rising) to the right arm's front post
            kv._polybeam("timber", [V((hs - 0.03, hs - 0.03, h + 0.25)), V((0.0, hs - 0.02, h + 0.27)),
                                     V((-hs + 0.02, hs * 0.75, h + 0.38)), V((-hs - 0.01, 0.0, h + 0.44)),
                                     V((-hs + 0.02, -hs * 0.75, h + 0.38)), V((0.0, -hs + 0.02, h + 0.27)),
                                     V((hs - 0.03, -hs + 0.03, h + 0.25))], 0.035, 0.03, 0.006)
            for sy in (-1, 1):   # the back posts rise to the rail
                k.beam("timber", False, (xb, sy * (hs - 0.03), h + 0.2), (-hs + 0.01, sy * hs * 0.8, h + 0.37), lw, lw, 0)
            kv.plank("timber", (xb - 0.01, -0.07), (xb - 0.01, 0.07), 0.018, h, h + 0.42, rng)
        else:
            k.beam("timber", False, (xb, -hs - 0.04, zb + 0.015), (xb, hs + 0.04, zb + 0.015), 0.04, 0.035, 0.006) \
                if back != "slats" else kv._polybeam("timber", [V((xb, -hs - 0.05, zb + 0.04)), V((xb, -hs + 0.05, zb + 0.015)),
                                                                V((xb, hs - 0.05, zb + 0.015)), V((xb, hs + 0.05, zb + 0.04))],
                                                     0.04, 0.035, 0.006)
            k.beam("timber", False, (xb, -hs + 0.03, h + 0.1), (xb, hs - 0.03, h + 0.1), 0.03, 0.03, 0)
            if back == "slats":
                for sy in (-0.1, 0.0, 0.1):
                    k.beam("timber", False, (xb, sy, h + 0.11), (xb, sy, zb), 0.02, 0.035, 0)
            elif back == "lattice":
                for sy in (-0.12, -0.04, 0.04, 0.12):
                    k.beam("lattice", False, (xb, sy, h + 0.11), (xb, sy, zb), 0.015, 0.018, 0)
                for zz in (h + 0.2, h + 0.3, h + 0.4):
                    k.beam("lattice", False, (xb, -hs + 0.03, zz), (xb, hs - 0.03, zz), 0.015, 0.018, 0)
            else:
                kv.plank("timber", (xb, -0.09), (xb, 0.09), 0.018, h + 0.1, zb, rng)


# ---------------------------------------------------------------- 3-5. the wheelwright's yard

def pole_frame_basket(x, y, z, yaw_deg, rng, h=2.6, w=1.5, basket_r=0.33, basket_h=0.3):
    """A free-standing frame of bent poles (S4b.prop.pole_frame_basket_13690): three bamboo poles bowed outward from
    their feet (one at the -x end, two at +x, w apart along x) to a top knot bound with rope, like a hooped arch; a
    big round woven basket hung inside from the knot on three cords, its rim at 0.7 of the height (as painted). Poles
    collide. choice: knot h 2.6 m, span 1.5 m; basket 0.66 m across, 0.3 m deep (painted rim 84 px)."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        T = V((0, 0, h))
        feet = [V((-w / 2, 0.08, 0)), V((w / 2, 0.45, 0)), V((w / 2 - 0.08, -0.45, 0))]
        for f in feet:
            # a bent pole: rising nearly straight from its foot, then curving over into the knot (a hoop)
            ctrl = V((f.x * 0.92, f.y * 0.92, h * 0.92))
            pts = []
            for q in range(7):
                tq = q / 6
                pts.append(f * (1 - tq) ** 2 + ctrl * 2 * tq * (1 - tq) + (T - UP * 0.03) * tq * tq)
            pts[0] = pts[0] - UP * 0.05
            r = 0.036 * rng.uniform(0.9, 1.1)
            sb.tube("bamboo", True, pts, [r * (1 - 0.25 * q / 6) for q in range(7)], segs=5)
        ki.lashing(T - UP * 0.06, UP, 0.05, h=0.14)
        sb.lathe("rope", False, (0, 0, h - 0.01), [(0.06, 0), (0.04, 0.05), (0.01, 0.08)], segs=6)
        zr = h * 0.7
        z0 = zr - basket_h
        for i in range(3):
            a = 2 * math.pi * i / 3 + 0.4
            p = V((math.cos(a) * basket_r * 0.95, math.sin(a) * basket_r * 0.95, zr + 0.01))
            sb.cyl("rope", False, p, T - UP * 0.1, 0.007, segs=3, caps=False)
        ki.round_basket(0, 0, z0, basket_r, basket_h, rng, mouth=1.06)


def timber_pile(corners, z, rng):
    """A low pile of squared timbers and poles lying crosswise (S4b.prop.timber_pile_13745, the wheelwright's stock):
    bearers on the ground along the pile, then crosswise layers at small random angles: squared timbers (some with a
    tenoned or notched end), round poles (a tapered shaft, an axle with a squared middle), a curved felloe blank. About
    0.5 m high. A hidden box stops the walker. corners: [sw, se, ne, nw] (x, y) of the pile's plan."""
    P = [V((c[0], c[1], 0)) for c in corners]
    u = ((P[1] - P[0]) + (P[2] - P[3])) / 2
    v = ((P[3] - P[0]) + (P[2] - P[1])) / 2
    Lu, Lv = u.length, v.length
    u.normalize()
    v.normalize()
    o = (P[0] + P[1] + P[2] + P[3]) / 4

    def at(a, b, zz):     # a, b in -1..1 across the plan
        return o + u * (a * Lu / 2) + v * (b * Lv / 2) + UP * (z + zz)
    zz = 0.0
    for b in (-0.7, 0.0, 0.7):           # bearers along u
        k.beam("timber", False, at(-0.9, b, 0.06), at(0.9, b + rng.uniform(-0.05, 0.05), 0.06), 0.11, 0.11, 0.015)
    zz = 0.12
    n1 = max(3, round(Lu / 0.32))
    for i in range(n1):                 # layer 1: squared timbers across (along v)
        a = -0.85 + 1.7 * (i + 0.5) / n1 + rng.uniform(-0.05, 0.05)
        sz = rng.uniform(0.11, 0.16)
        p, q = at(a + rng.uniform(-0.08, 0.08), -0.95, zz + sz / 2), at(a + rng.uniform(-0.08, 0.08), 0.95, zz + sz / 2)
        k.beam("timber", False, p, q, sz, sz, 0.012)
        if i % 2 == 0:                  # a tenon on one end: a smaller section running on
            d = (q - p).normalized()
            k.beam("timber", False, q, q + d * 0.12, sz * 0.55, sz * 0.6, 0)
    zz += 0.15
    kinds = ["shaft", "square", "axle", "square", "felloe", "pole"]
    n2 = max(3, round(Lv / 0.28))
    for i in range(n2):                 # layer 2: crosswise again (along u), each askew
        b = -0.75 + 1.5 * (i + 0.5) / n2
        kind = kinds[i % len(kinds)]
        tw = math.radians(rng.uniform(-12, 12))
        d = u * math.cos(tw) + v * math.sin(tw)
        c = at(rng.uniform(-0.1, 0.1), b, zz)
        half = Lu * rng.uniform(0.36, 0.47)
        if kind == "shaft":      # a tapered round shaft with a rounded end
            sb.cyl("timber", False, c - d * half + UP * 0.07, c + d * half + UP * 0.05, 0.07, 0.045, segs=7)
            ko._dome("timber", c + d * half + UP * 0.05, d, 0.045, 0.05, segs=7)
        elif kind == "axle":     # round ends, a squared middle
            sb.cyl("timber", False, c - d * half + UP * 0.065, c - d * half * 0.35 + UP * 0.065, 0.055, 0.065, segs=7)
            k.beam("timber", False, c - d * half * 0.35 + UP * 0.065, c + d * half * 0.35 + UP * 0.065, 0.13, 0.13, 0.01)
            sb.cyl("timber", False, c + d * half * 0.35 + UP * 0.065, c + d * half + UP * 0.065, 0.065, 0.055, segs=7)
        elif kind == "felloe":   # a curved felloe blank
            side = UP.cross(d)
            pts = [c - d * 0.45 + UP * 0.05, c - d * 0.15 + side * 0.08 + UP * 0.05, c + d * 0.15 + side * 0.08 + UP * 0.05,
                   c + d * 0.45 + UP * 0.05]
            kv._polybeam("timber", pts, 0.08, 0.1, 0.01)
        elif kind == "pole":
            sb.cyl("bamboo", False, c - d * half * 1.05 + UP * 0.05, c + d * half * 1.05 + UP * 0.05, 0.045, 0.04, segs=6)
        else:
            sz = rng.uniform(0.1, 0.14)
            p, q = c - d * half + UP * (sz / 2), c + d * half + UP * (sz / 2)
            k.beam("timber", False, p, q, sz, sz, 0.012)
            m = p.lerp(q, rng.uniform(0.2, 0.35))      # a notch cut into its top: two short steps
            k.beam("lattice", False, m - d * 0.05 + UP * (sz / 2 - 0.01), m + d * 0.05 + UP * (sz / 2 - 0.01), sz * 1.02, 0.012, 0)
    lo = V((min(p.x for p in P), min(p.y for p in P), z))
    hi = V((max(p.x for p in P), max(p.y for p in P), z + 0.5))
    _box_hidden(lo, hi)


def striped_load(x, y, z, yaw_deg, rng, L=0.8, h=0.6, mat=STRAW, trestle=0.22):
    """A rounded mass with close horizontal stripes on a low trestle (S4b.prop.striped_load_13684: a bundle of spokes
    or a mat-wrapped load): a loaf lofted along its length whose sides are fluted lengthwise (each flute a stripe),
    tied with two cords, on a sawhorse of two splayed leg pairs and a top rail. choice: 0.8 x 0.5 x 0.6 m."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        for sx in (-L * 0.32, L * 0.32):
            for sy in (-1, 1):
                k.beam("timber", False, (sx, sy * 0.2, 0), (sx, sy * 0.06, trestle), 0.04, 0.04, 0)
            k.beam("timber", False, (sx, -0.22, trestle - 0.02), (sx, 0.22, trestle - 0.02), 0.05, 0.04, 0)
        W, H = 0.25, h - trestle
        nr, ns = 14, 6
        rings = []
        for i in range(ns + 1):
            s = -1 + 2 * i / ns
            pr = (1 - abs(s) ** 3) ** 0.5
            ring = []
            for j in range(nr):
                a = 2 * math.pi * j / nr - math.pi / 2
                r = (1.0 if j % 2 == 0 else 0.93) * pr
                yy, zz = math.cos(a) * W * r, math.sin(a) * H / 2 * r * (0.75 if math.sin(a) < 0 else 1.0)
                ring.append(V((s * L / 2 * (1 - 0.06 * abs(zz) / H), yy, trestle + H / 2 + zz - 0.03)))
            rings.append(ring)
        verts = [p for r in rings for p in r]
        faces, ins = [], []
        for i in range(ns):
            for j in range(nr):
                j2 = (j + 1) % nr
                faces.append((i * nr + j, (i + 1) * nr + j, (i + 1) * nr + j2, i * nr + j2))
                ins.append(V((0, 0, trestle + H / 2)))
        for idx in (0, ns):
            faces.append(tuple(range(idx * nr, idx * nr + nr)))
            ins.append(V((0, 0, trestle + H / 2)))
        uvs = None
        k.add(mat, False, verts, kv._orient(verts, faces, ins), uvs)
        for sx in (-L * 0.22, L * 0.22):    # two cords round the loaf, following its section
            pr = (1 - abs(2 * sx / L) ** 3) ** 0.5
            ring = []
            for j in range(13):
                a = 2 * math.pi * j / 12 - math.pi / 2
                zz = math.sin(a) * H / 2 * pr * (0.75 if math.sin(a) < 0 else 1.0)
                ring.append(V((sx, math.cos(a) * W * pr * 1.03, trestle + H / 2 + zz * 1.04 - 0.03)))
            sb.tube("rope", False, ring, [0.012] * 13, segs=3)


def tool_on_ground(x, y, z, yaw_deg, rng, kind="adze"):
    """A small tool lying on the ground (S4b.prop.tool_on_ground_13632), its working end toward yaw. kind 'adze': a
    0.45 m handle with an iron blade across its end; 'chisel': a short wooden handle and a long flat iron blade.
    choice: real tool sizes."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        if kind == "chisel":
            sb.cyl("timber", False, (-0.14, 0, 0.018), (0.0, 0, 0.018), 0.017, 0.014, segs=6)
            k.beam(IRON, False, (0.0, 0, 0.012), (0.17, 0, 0.008), 0.022, 0.012, 0)
            k.beam(IRON, False, (0.17, 0, 0.008), (0.2, 0, 0.004), 0.024, 0.005, 0)
        else:
            sb.cyl("redwood", False, (-0.42, 0.0, 0.016), (0.0, 0.0, 0.02), 0.014, 0.018, segs=6)
            k.beam(IRON, False, (0.0, -0.035, 0.018), (0.0, 0.06, 0.016), 0.05, 0.035, 0.006)
            k.beam(IRON, False, (-0.015, -0.07, 0.012), (0.035, -0.11, 0.008), 0.06, 0.012, 0)


# ---------------------------------------------------------------- 5-11. stall furniture and vessels

def sieve_basket(x, y, z, r, rng, stand=0.35):
    """A big round shallow basket, a sieve or winnowing tray (S4b.prop.round_basket_13840): a woven tray with ribbed
    stakes, flaring low wall and a thick rolled rim of split bamboo, its dark inside showing, on a low stand of four
    splayed legs with two crossed bars under the tray. choice: wall 0.11 m; stand 0.35 m."""
    zt = z + stand
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        f = V((x + math.cos(a) * r * 0.75, y + math.sin(a) * r * 0.75, z))
        t = V((x + math.cos(a) * r * 0.5, y + math.sin(a) * r * 0.5, zt - 0.02))
        k.beam("timber", False, f, t, 0.035, 0.035, 0)
    for a in (math.pi / 4, 3 * math.pi / 4):
        d = V((math.cos(a), math.sin(a), 0)) * r * 0.55
        k.beam("timber", False, V((x, y, zt - 0.02)) - d, V((x, y, zt - 0.02)) + d, 0.035, 0.03, 0)
        k.beam("timber", False, V((x, y, z + stand * 0.35)) - d * 1.1, V((x, y, z + stand * 0.35)) + d * 1.1, 0.025, 0.025, 0)
    hh = 0.11
    segs = 16
    ki._ribbed_lathe(STRAW, False, (x, y, zt), [(r * 0.62, 0), (r * 0.82, hh * 0.25), (r * 0.95, hh * 0.65), (r, hh - 0.015)],
                     segs, ribs=0.03, ribbed=(1, 2), rot=rng.uniform(0, 1))
    tr = 0.022
    ki._ribbed_lathe("bamboo", False, (x, y, zt), [(r + 0.004, hh - 0.03), (r + tr, hh), (r - tr, hh + 0.012)], segs, cap=False)
    ki._ribbed_lathe("interior", False, (x, y, zt), [(r * 0.6, 0.012), (r - tr, hh - 0.01)], segs, cap=True)


def _shallow_tray(c, R, rim, rng, mat="interior", seg=14):
    """A flat round tray (local or world point c = the middle of its underside): floor, raised rim with thickness."""
    rows = [(0.92, 0.012), (0.97, rim * 0.85), (1.0, rim), (1.03, rim * 0.6), (0.97, -0.005)]
    verts = [V(c) + UP * 0.012]
    for r, zz in rows:
        for i in range(seg):
            a = 2 * math.pi * i / seg
            verts.append(V(c) + V((math.cos(a) * R * r, math.sin(a) * R * r, zz)))
    verts.append(V(c) - UP * 0.005)
    faces = [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)]
    for j in range(len(rows) - 1):
        for i in range(seg):
            i2 = (i + 1) % seg
            faces.append((1 + j * seg + i, 1 + (j + 1) * seg + i, 1 + (j + 1) * seg + i2, 1 + j * seg + i2))
    last, cb = 1 + (len(rows) - 1) * seg, len(verts) - 1
    faces += [(cb, last + (i + 1) % seg, last + i) for i in range(seg)]
    k.add(mat, False, verts, faces)


def two_tier_stall(x, y, z, yaw_deg, rng, L=1.2, W=0.6, h=0.95, wares="jar_red", goods="cloth_white"):
    """An open wooden two-tier stall stand (S4b.prop.stall_13480): four legs, an upper tier (a board with a raised lip)
    carrying a row of six round wares, and a lower open frame at mid-height carrying a big flat round tray heaped with
    goods; rails and a low stretcher. yaw: the stand's length. choice: 1.2 x 0.6 m, upper tier 0.95 m (painted 95 px
    long, 110 px high: 0.95 x 1.1 m at the figures' scale)."""
    hl, hw_ = L / 2, W / 2
    zl = h * 0.5
    with k.placed(k.frame(x, y, z, yaw_deg)):
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.beam("timber", False, (sx * (hl - 0.04), sy * (hw_ - 0.04), 0), (sx * (hl - 0.04), sy * (hw_ - 0.04), h),
                       0.045, 0.045, 0)
        k.soft_box("timber", False, (-hl, -hw_ * 0.6, h - 0.035), (hl, hw_, h), rng, r=0.02, wob=0.004, ease=0.008,
                   along=(1, 0))
        for sy in (-hw_ * 0.6, hw_):
            k.beam("timber", False, (-hl, sy, h + 0.02), (hl, sy, h + 0.02), 0.025, 0.04, 0)
        for sy in (-1, 1):
            k.beam("timber", False, (-hl + 0.02, sy * (hw_ - 0.04), zl), (hl - 0.02, sy * (hw_ - 0.04), zl), 0.04, 0.05, 0)
            k.beam("timber", False, (-hl + 0.02, sy * (hw_ - 0.04), 0.12), (hl - 0.02, sy * (hw_ - 0.04), 0.12), 0.03, 0.03, 0)
        for sx in (-hl * 0.5, 0.0, hl * 0.5):
            k.beam("timber", False, (sx, -hw_ + 0.04, zl + 0.03), (sx, hw_ - 0.04, zl + 0.03), 0.05, 0.02, 0)
        n = 6
        for i in range(n):
            wx = -hl + 0.1 + (L - 0.2) * i / (n - 1)
            k.rock(wares, wx + rng.uniform(-0.01, 0.01), hw_ * 0.2 + rng.uniform(-0.03, 0.03), h + 0.065, 0.07, rng, flat=0.85)
        R = min(L, W * 1.4) * 0.42
        _shallow_tray(V((-0.05, -0.02, zl + 0.045)), R, 0.05, rng)
        ki.goods_heap(-0.05, -0.02, zl + 0.05, R * 1.3, R * 1.3, rng, n=9, mat=goods, s=0.06)


def goods_on_mat(x, y, z, yaw_deg, rng, L=1.3, W=0.9):
    """A seated pedlar's goods (S4b.prop.goods_on_mat_13282): a woven mat on the ground (its hem a rolled edge), on it
    a low dark slatted box with a criss-cross face, stacked bowls, lids and small round baskets. yaw: the mat's length.
    choice: mat 1.3 x 0.9 m; the box 0.55 x 0.35 x 0.18 m."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        k.soft_box(STRAW, False, (-L / 2, -W / 2, 0), (L / 2, W / 2, 0.015), rng, r=0.06, wob=0.02, seg=0.4, ease=0.006,
                   along=(1, 0))
        sb.tube("reed", False, [V((-L / 2 + 0.05, -W / 2 + 0.01, 0.018)), V((L / 2 - 0.05, -W / 2 + 0.01, 0.018))],
                [0.015, 0.015], segs=4)
        # the low dark box with a criss-cross face (toward -y, the mat's front)
        bx0, bx1, by0, by1, bh = -0.3, 0.25, 0.0, 0.32, 0.18
        k.soft_box("interior", False, (bx0, by0, 0.015), (bx1, by1, bh), rng, r=0.015, wob=0.003, ease=0.006)
        nx = 4
        for i in range(nx):        # the criss-cross face: flat strips just proud of the box
            xa = bx0 + 0.02 + (bx1 - bx0 - 0.04) * i / nx
            xb = xa + (bx1 - bx0 - 0.04) / nx
            for za, zb_ in ((0.03, bh - 0.015), (bh - 0.015, 0.03)):
                p, q = V((xa, by0 - 0.006, za)), V((xb, by0 - 0.006, zb_))
                e = (q - p).normalized().cross(V((0, 1, 0))) * 0.008
                sb.quad("lattice", False, p - e, p + e, q + e, q - e)
        # stacked bowls, lids and small baskets on and beside the box (a stack is one turned profile)
        X, Y = V((1, 0, 0)), V((0, 1, 0))
        for i, (bxp, byp, bz) in enumerate(((-0.18, 0.16, bh), (0.1, 0.18, bh), (-0.45, -0.18, 0.015), (0.42, -0.15, 0.015))):
            nst = 2 if i < 2 else 3
            prof = [(0.04, 0.04, 0.0)]
            for q in range(nst):
                prof += [(0.095, 0.095, q * 0.035 + 0.03), (0.1, 0.1, q * 0.035 + 0.045), (0.085, 0.085, q * 0.035 + 0.05)]
            ko._lathe3("interior" if i % 2 == 0 else "jar_green", False, (bxp, byp, bz), X, Y, UP, prof, segs=7,
                       cap0=False, cap1=True)
        for bxp, byp in ((0.45, 0.22), (-0.48, 0.2)):
            ko._lathe3(STRAW, False, (bxp, byp, 0.015), X, Y, UP,
                       [(0.09, 0.09, 0), (0.12, 0.12, 0.07), (0.1, 0.1, 0.15), (0.0, 0.0, 0.18)], segs=7, cap0=False)
        ko._lathe3("lattice", False, (0.0, -0.25, 0.015), X, Y, UP, [(0.11, 0.11, 0), (0.08, 0.08, 0.03), (0.0, 0.0, 0.04)],
                   segs=8, cap0=False)


def tray(x, y, z, yaw_deg, L=0.45, W=0.22, mat="interior", end_h=0.075, side_h=0.035):
    """A shallow oblong tray with raised ends (S4b.prop.tray_12823): an outer and an inner U-shaped shell lofted along
    its length, the sides low and rising into upswept ends, rims with thickness along both sides, the ends closed;
    boat-like in profile. yaw: its length. choice: 0.45 x 0.22 m, ends 7.5 cm, sides 3.5 cm."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        ns = 6
        outer, inner = [], []
        for i in range(ns + 1):
            s = -1 + 2 * i / ns
            xx = s * L / 2
            hh = side_h + (end_h - side_h) * abs(s) ** 3
            w = W / 2 * (1 - 0.18 * abs(s) ** 4)
            outer.append([V((xx, -w, hh)), V((xx, -w * 0.85, 0)), V((xx, w * 0.85, 0)), V((xx, w, hh))])
            inner.append([V((xx * 0.96, -w + 0.012, hh)), V((xx * 0.94, -w * 0.85 + 0.012, 0.01)),
                          V((xx * 0.94, w * 0.85 - 0.012, 0.01)), V((xx * 0.96, w - 0.012, hh))])
        verts = [p for r in outer for p in r] + [p for r in inner for p in r]
        no = (ns + 1) * 4
        faces, ins = [], []
        for i in range(ns):
            c = V(((outer[i][0].x + outer[i + 1][0].x) / 2, 0, side_h * 3))
            for j in range(3):
                faces.append((i * 4 + j, (i + 1) * 4 + j, (i + 1) * 4 + j + 1, i * 4 + j + 1))
                ins.append(c)
                faces.append((no + i * 4 + j, no + (i + 1) * 4 + j, no + (i + 1) * 4 + j + 1, no + i * 4 + j + 1))
                ins.append(V((c.x, 0, -1.0)))
            for j in (0, 3):
                faces.append((i * 4 + j, (i + 1) * 4 + j, no + (i + 1) * 4 + j, no + i * 4 + j))
                ins.append(V((c.x, 0, -1.0)))
        for i, sg in ((0, -1), (ns, 1)):
            faces.append(tuple(i * 4 + j for j in range(4)))
            ins.append(V((outer[i][0].x - sg * 0.1, 0, side_h)))
        k.add(mat, False, verts, kv._orient(verts, faces, ins))


def counter_frame(x, y, z, yaw_deg, rng, L=1.2, h=1.1, d=0.45):
    """A rectangular wooden frame or counter (S4b.prop.counter_frame_12655): four posts, top rails round it (the front
    one heavier), a lower rail 0.4 m below the top (as painted), a shelf board on the lower rails, and a small cup-like
    lamp hanging on a cord under the front top bar. yaw: its length (the front faces -y local, i.e. to the right).
    choice: 1.2 x 0.45 x 1.1 m."""
    hl, hd = L / 2, d / 2
    with k.placed(k.frame(x, y, z, yaw_deg)):
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.beam("timber", False, (sx * hl, sy * hd, 0), (sx * hl, sy * hd, h + 0.03), 0.05, 0.05, 0.008)
        k.beam("timber", False, (-hl - 0.06, -hd, h - 0.03), (hl + 0.06, -hd, h - 0.03), 0.06, 0.07, 0.01)
        k.beam("timber", False, (-hl - 0.03, hd, h - 0.03), (hl + 0.03, hd, h - 0.03), 0.05, 0.05, 0.008)
        for sx in (-1, 1):
            k.beam("timber", False, (sx * hl, -hd, h - 0.03), (sx * hl, hd, h - 0.03), 0.045, 0.045, 0)
            k.beam("timber", False, (sx * hl, -hd, h - 0.42), (sx * hl, hd, h - 0.42), 0.04, 0.04, 0)
        for sy in (-1, 1):
            k.beam("timber", False, (-hl, sy * hd, h - 0.42), (hl, sy * hd, h - 0.42), 0.045, 0.05, 0)
            k.beam("timber", False, (-hl, sy * hd, 0.1), (hl, sy * hd, 0.1), 0.035, 0.035, 0)
        kv.plank_flat("timber", (-hl + 0.03, 0), (hl - 0.03, 0), d - 0.04, h - 0.405, h - 0.38, rng)
        cx = -hl * 0.15
        sb.cyl("rope", False, (cx, -hd, h - 0.065), (cx, -hd, h - 0.2), 0.006, segs=3, caps=False)
        ko._lathe3("jar_green", False, (cx, -hd, h - 0.29), V((1, 0, 0)), V((0, 1, 0)), UP,
                   [(0.0, 0.0, 0), (0.035, 0.035, 0.015), (0.055, 0.055, 0.06), (0.05, 0.05, 0.09)], segs=8, cap1=False)
        sb.tube("rope", False, [V((cx - 0.04, -hd, h - 0.2)), V((cx, -hd, h - 0.2)), V((cx + 0.04, -hd, h - 0.2))],
                [0.004] * 3, segs=3)
        for s in (-1, 1):
            sb.cyl("rope", False, (cx + s * 0.04, -hd, h - 0.2), (cx + s * 0.05, -hd, h - 0.205), 0.004, segs=3, caps=False)


def big_jar(x, y, z, rng, r=0.42, h=0.8, mat="rope", rim_mat="rope", segs=12):
    """A big earthenware jar (缸, S4b.prop.big_jar_12707): a pale round belly widest a little above the middle, a small
    foot with a dark band (the painted dark outline round its bottom), a straight thick rolled rim, its dark inside
    (water) showing. Collides. choice: 0.84 m across, 0.8 m high (painted 55 px wide); pale buff
    unglazed clay (the flat `rope` colour: plaster's swatch reads as a cracked wall, cloth_white as porcelain)."""
    X, Y = V((1, 0, 0)), V((0, 1, 0))
    prof = [(r * 0.58, r * 0.58, 0.0), (r * 0.74, r * 0.74, h * 0.1), (r * 0.93, r * 0.93, h * 0.32),
            (r, r, h * 0.55), (r * 0.97, r * 0.97, h * 0.75), (r * 0.9, r * 0.9, h * 0.92)]
    ko._lathe3(mat, True, (x, y, z), X, Y, UP, prof, segs=segs, cap0=True)
    ko._lathe3(rim_mat, False, (x, y, z), X, Y, UP, [(r * 0.89, r * 0.89, h * 0.9), (r * 0.94, r * 0.94, h * 0.93),
                                                     (r * 0.93, r * 0.93, h), (r * 0.82, r * 0.82, h + 0.005),
                                                     (r * 0.8, r * 0.8, h - 0.04)], segs=segs, cap0=False)
    ko._lathe3("interior", False, (x, y, z), X, Y, UP, [(r * 0.8, r * 0.8, h - 0.04), (r * 0.78, r * 0.78, h - 0.1)],
               segs=segs, cap0=False, cap1=True)
    ko._lathe3("lattice", False, (x, y, z), X, Y, UP, [(r * 0.6, r * 0.6, 0.0), (r * 0.66, r * 0.66, h * 0.045),
                                                       (r * 0.6, r * 0.6, h * 0.05)], segs=segs, cap0=False)


def funnel_vessel(x, y, z, rng, r=0.3, h=0.45, stand=0.45, mat="jar_green"):
    """A deep vessel wide at the rim and narrowing to a small bottom (S4b.prop.funnel_vessel_12884: a wash basin, a
    hopper or a deep sieve) set in a low stand: three splayed legs and a ring that takes the vessel's waist; a rolled
    rim, the dark inside. choice: 0.6 m across, 0.45 m deep, the stand 0.45 m."""
    X, Y = V((1, 0, 0)), V((0, 1, 0))
    zr = z + stand
    for i in range(3):
        a = 2 * math.pi * i / 3 + 0.5
        f = V((x + math.cos(a) * r * 0.75, y + math.sin(a) * r * 0.75, z))
        t = V((x + math.cos(a) * r * 0.52, y + math.sin(a) * r * 0.52, zr + 0.03))
        k.beam("timber", False, f, t, 0.035, 0.035, 0)
    ko._ring("timber", V((x, y, zr)), UP, r * 0.53, 0.022, segs=10, sides=4)
    ko._ring("timber", V((x, y, z + stand * 0.3)), UP, r * 0.66, 0.015, segs=8, sides=3)
    z0 = zr - h * 0.3
    ko._lathe3(mat, False, (x, y, z0), X, Y, UP, [(r * 0.16, r * 0.16, 0), (r * 0.3, r * 0.3, h * 0.2),
                                                  (r * 0.62, r * 0.62, h * 0.55), (r * 0.9, r * 0.9, h * 0.88),
                                                  (r, r, h)], segs=12, cap0=True)
    ko._lathe3(mat, False, (x, y, z0), X, Y, UP, [(r * 0.99, r * 0.99, h - 0.01), (r * 1.03, r * 1.03, h + 0.01),
                                                  (r * 0.95, r * 0.95, h + 0.02)], segs=12, cap0=False)
    ko._lathe3("interior", False, (x, y, z0), X, Y, UP, [(r * 0.95, r * 0.95, h + 0.015), (r * 0.6, r * 0.6, h * 0.62),
                                                         (r * 0.25, r * 0.25, h * 0.3)], segs=12, cap0=False, cap1=True)


# ---------------------------------------------------------------- 12-17. shades, frames, heaps, posts

def fan_shade(x, y, z, yaw_deg, rng, length=3.2, w_end=2.2, h=2.5, post_at=0.55, ribs=11, mat=STRAW, rise=0.22):
    """A long fan-shaped shade of palm thatch or ribbed matting (S4b.prop.thatch_shade_13049): ribs radiate from a
    narrow pointed end to a rounded far end; each panel between two ribs sags a little (every rib draws as a crease),
    the surface domes up over the middle and falls to the rounded end, which is bound and fringed with ragged strands;
    bamboo rib slats underneath; carried on one post with a bracket (a short arm along the shade under it and two
    knee braces). (x, y): the post; yaw: from the narrow end to the rounded end; post_at: where the post stands, as a
    fraction of the length from the narrow end (the painted post stands at about 0.55: canopy u 12969-13109, post at
    u 13050). Post collides. choice: 3.2 x 2.2 m, eave 2.5 m at the post."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        x_tip = -length * post_at
        th = math.atan2(w_end / 2, length * 0.9)
        n = max(5, ribs)
        T = (0.0, 0.3, 0.6, 0.85, 1.0)

        def at(phi, t, sag=0.0):
            f = phi / th                                  # -1 .. 1 across
            rr = length * (1 - 0.13 * f * f)             # the rounded far end
            p = V((x_tip + math.cos(phi) * rr * t, math.sin(phi) * rr * t * 1.18, 0))
            dome = rise * math.sin(math.pi * min(1.0, t * 1.15)) * (1 - 0.3 * f * f)
            p.z = h + 0.08 + dome - 0.32 * t ** 2.2 - sag
            return p
        ang = [-th + 2 * th * i / (n - 1) for i in range(n)]
        rim = []
        for i in range(n - 1):
            a, b = ang[i], ang[i + 1]
            m = (a + b) / 2
            half = length * math.sin((b - a) / 2)
            rows = [(at(a, t), at(m, t, 0.12 * half * t), at(b, t)) for t in T]
            verts = []
            for L_, M_, R_ in rows:
                verts += [L_, M_, R_]
            faces = []
            for j in range(len(T) - 1):
                o, o2 = 3 * j, 3 * j + 3
                if j == 0:
                    faces.append((o, o2 + 1, o + 1))
                    faces.append((o + 1, o2 + 1, o2 + 2))
                else:
                    faces += [(o, o2, o2 + 1, o + 1), (o + 1, o2 + 1, o2 + 2, o + 2)]
            faces = [f[::-1] for f in faces]
            uvs = [[(verts[q].x / 1.0, verts[q].y / 1.0) for q in f] for f in faces]
            k.add(mat, False, verts, faces, uvs)
            rim += [rows[-1][0], rows[-1][1]]
            # the rib under the panel's edge: a flat bamboo slat on edge
            pts = [at(a, t) - UP * 0.012 for t in T[1:]]
            vv = []
            for p in pts:
                vv += [p, p - UP * 0.025]
            k.add("bamboo", False, vv, [(2 * j, 2 * j + 1, 2 * j + 3, 2 * j + 2) for j in range(len(pts) - 1)])
        rim.append(at(ang[-1], 1.0))
        # the bound rim and the ragged fringe round the far end and down both long edges
        for p, q in zip(rim, rim[1:]):
            k.add(mat, False, [p, q, q - UP * 0.05, p - UP * 0.05], [(0, 3, 2, 1)])
            for s in range(2):
                a_, b_ = p.lerp(q, s / 2), p.lerp(q, (s + 1) / 2)
                out = V((a_.x - x_tip, a_.y, 0)).normalized() * 0.03
                _tongue(PALM_DARK if rng.random() < 0.25 else mat, a_ - UP * 0.04, b_ - UP * 0.04,
                        a_.lerp(b_, rng.uniform(0.3, 0.7)) - UP * rng.uniform(0.1, 0.22) + out)
        for phi in (ang[0], ang[-1]):
            for j in range(len(T) - 1):
                a_, b_ = at(phi, T[j]), at(phi, T[j + 1])
                out = V((0, math.copysign(0.03, phi), 0))
                for s in range(2):
                    p, q = a_.lerp(b_, s / 2), a_.lerp(b_, (s + 1) / 2)
                    _tongue(mat, p, q, p.lerp(q, 0.5) - UP * rng.uniform(0.06, 0.14) + out)
        # the post, its bracket arm and knee braces
        zt = at(0.0, post_at)[2] - 0.05
        sb.cyl("timber", True, (0, 0, -0.05), (0, 0, zt - 0.06), 0.065, 0.058, segs=8)
        k.post("timber", False, 0, 0, zt - 0.12, zt - 0.02, 0.15, 0.02)
        arm0, arm1 = V((x_tip * 0.55, 0, zt - 0.04)), V((length * (1 - post_at) * 0.6, 0, zt - 0.06))
        k.beam("timber", False, arm0, arm1, 0.08, 0.1, 0.015)
        for e in (arm0, arm1):
            d = V((e.x, 0, 0)).normalized()
            k.beam("timber", False, V((0, 0, zt - 0.75)), V((d.x * 0.55, 0, zt - 0.08)), 0.055, 0.055, 0.008)
        for s in (-1, 1):
            k.beam("bamboo", False, V((0, 0, zt - 0.02)), at(s * th * 0.6, post_at + 0.2) - UP * 0.04, 0.035, 0.03, 0)


def slatted_frame(x, y, z, rng, h=1.7, w=0.6, yaw_deg=0.0, slats=6):
    """A small triangular frame of thin slats on an upright post (S4b.prop.slatted_frame_13320): a post, a top bar
    from its head out along yaw, a diagonal from lower on the post to the bar's end, and thin upright slats leaning a
    little toward yaw filling the triangle. choice: post 1.7 m, triangle 0.6 x 0.45 m."""
    with k.placed(k.frame(x, y, z, yaw_deg)):
        k.beam("timber", False, (0, 0, -0.05), (0, 0, h + 0.04), 0.06, 0.06, 0.01)
        zt = h - 0.03
        zl = h - 0.75 * w
        k.beam("timber", False, (-0.02, 0, zt), (w, 0, zt), 0.04, 0.04, 0.006)
        k.beam("timber", False, (0, 0, zl), (w, 0, zt - 0.02), 0.035, 0.035, 0.006)
        for i in range(1, slats + 1):
            f = i / (slats + 1)
            xx = w * f
            zb = zl + (zt - zl) * f
            k.beam("timber", False, (xx - 0.02, 0, zb), (xx + 0.01, 0, zt), 0.022, 0.012, 0)


def straw_heap(p0, p1, z, rng, w=0.9, h=0.45, mat=STRAW, bands=2, collide=True):
    """A long, low, lens-shaped heap of straw, reeds or firewood (S4b.prop.bundle_heap_14680, _14970) from p0 to p1:
    a loaf lofted along the line, tapering to both ends, its surface fluted lengthwise (the long parallel strands, the
    swatch's strands laid along it), ragged strand ends at both tips and along the foot, `bands` rope ties. A hidden box
    stops the walker (collide). choice: 0.9 m wide, 0.45 m high (painted about 3 m x 0.5 m)."""
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    d = b - a
    Lh = d.length
    t = d.normalized()
    s = V((-t.y, t.x, 0))
    nr, ns = 12, max(6, round(Lh / 0.35))
    rings = []
    for i in range(ns + 1):
        f = i / ns
        e = math.sin(math.pi * f) ** 0.55
        ring = []
        for j in range(nr + 1):
            ang = math.pi * j / nr
            r = (1.0 if j % 2 == 0 else 0.92) + rng.uniform(-0.03, 0.03)
            yy = math.cos(ang) * w / 2 * e * r
            zz = math.sin(ang) * h * e * r
            ring.append(a + t * (Lh * f + rng.uniform(-0.03, 0.03) * (0 < i < ns)) + s * yy + UP * (z + zz))
        rings.append(ring)
    m = nr + 1
    verts = [p for r in rings for p in r]
    faces, uvs, ins = [], [], []
    tile = sb.MATERIALS[mat][1]
    ou, ov = rng.random(), rng.random()
    for i in range(ns):
        for j in range(nr):
            f = (i * m + j, i * m + j + 1, (i + 1) * m + j + 1, (i + 1) * m + j)
            faces.append(f)
            ins.append(a + t * (Lh * (i + 0.5) / ns) + UP * (z + 0.05))
    oriented = kv._orient(verts, faces, ins)
    for f in oriented:
        uvs.append([((verts[q] - a).dot(t) / tile + ou, (q % m) * 0.08 / tile + ov) for q in f])
    k.add(mat, False, verts, oriented, uvs)
    for i in range(1, ns):          # ragged strands along the foot, both sides
        for j in (0, nr):
            p, q = rings[i][j], rings[min(i + 1, ns)][j]
            out = s * (0.04 if j == 0 else -0.04)
            _tongue(mat, p + UP * 0.05, q + UP * 0.05, p.lerp(q, 0.5) + out - UP * 0.01)
    for end, dirn in ((a, -t), (b, t)):    # strand ends sticking out at the tips
        for q in range(7):
            c = end + UP * (z + rng.uniform(0.02, h * 0.25)) + s * rng.uniform(-0.08, 0.08)
            tip = c + dirn * rng.uniform(0.12, 0.3) + s * rng.uniform(-0.1, 0.1) + UP * rng.uniform(-0.04, 0.04)
            side = s * rng.uniform(0.012, 0.025)
            _tongue(mat, c - side - dirn * 0.15, c + side - dirn * 0.15, tip)
    for q in range(bands):
        f = (q + 1) / (bands + 1)
        e = math.sin(math.pi * f) ** 0.55
        c = a + t * (Lh * f)
        ring = [c + s * (math.cos(math.pi * j / 8) * (w / 2 * e + 0.012)) + UP * (z + math.sin(math.pi * j / 8) * (h * e + 0.012))
                for j in range(9)]
        sb.tube("rope", False, ring, [0.015] * 9, segs=4)
    if collide:
        c = a + t * (Lh / 2)
        hx = Lh * 0.42
        corners = [c - t * hx - s * w * 0.4, c + t * hx - s * w * 0.4, c + t * hx + s * w * 0.4, c - t * hx + s * w * 0.4]
        ko._hexa("hidden", True, [p + UP * z for p in corners], [p + UP * (z + h * 0.9) for p in corners])


def mooring_post(x, y, z_foot, z_top, rng, r=0.11):
    """A short stout mooring post at the water's edge (S4b.prop.mooring_post_14737): a weathered round post, a rounded
    knob on top over a cut neck, three rope turns wound under the knob (where the boats' ropes are tied). Collides.
    Returns the head point (x, y, z): the middle of the rope turns, where the boat kit's mooring lines end.
    choice: 0.22 m thick."""
    zk = z_top - 0.16
    sb.cyl("timber", True, (x, y, z_foot - 0.15), (x, y, zk - 0.1), r * 1.05, r, segs=8)
    ko._lathe3("timber", False, (x, y, zk - 0.1), V((1, 0, 0)), V((0, 1, 0)), UP,
               [(r, r, 0), (r * 0.78, r * 0.78, 0.05), (r * 0.78, r * 0.78, 0.09), (r * 1.15, r * 1.15, 0.14),
                (r * 1.18, r * 1.18, 0.2), (r * 0.95, r * 0.95, 0.24), (r * 0.5, r * 0.5, 0.26), (0.0, 0.0, 0.265)],
               segs=8, cap0=False)
    zr = zk - 0.03
    for q in range(3):
        zz = zr - 0.045 + q * 0.03 + rng.uniform(-0.004, 0.004)
        sb.cyl("rope", False, (x, y, zz - 0.012), (x, y, zz + 0.012), r * 0.78 + 0.018, segs=8, caps=False)
    for q in range(4):              # a few rings of wear and splits down the post
        a = rng.uniform(0, 6.28)
        p = V((x + math.cos(a) * r * 1.03, y + math.sin(a) * r * 1.03, 0))
        zz = rng.uniform(z_foot + 0.05, zk - 0.2)
        k.beam("lattice", False, p + UP * zz, p + UP * (zz + rng.uniform(0.08, 0.18)), 0.008, 0.008, 0)
    return (x, y, round(zr, 3))


# ---------------------------------------------------------------- 18-20. the tea house's canopy and gable, roof hatch

def fringed_canopy(p0, p1, depth, z_front, z_back, rng, posts=2, fringe=0.25, z0=0.0, mat=STRAW, post_r=0.07):
    """A broad lean-to canopy of mat or thatch with a FRINGED eave (S4b.bld.tea_house_14531's front canopy): its front
    edge along p0 -> p1 at z_front, its back edge `depth` m behind (to the left of p0 -> p1) at z_back, where it meets
    a hall's front; a mat with thickness laid over bamboo rafters and two battens, a front plate on `posts` posts
    (standing on z0), a rolled hem along the front and the fringe: two staggered rows of hanging strands of their own
    lengths (up to `fringe` m), dark and pale; strands down the two open ends too. Posts collide.
    choice: posts 14 cm, mat 6 cm thick, overhang 0.25 m past the posts."""
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = (b - a)
    L = t.length
    t.normalize()
    lv = V((-t.y, t.x, 0))
    ov = 0.25
    A, B = a - t * 0.05, b + t * 0.05
    F0, F1 = A + UP * z_front, B + UP * z_front
    K0, K1 = A + lv * depth + UP * z_back, B + lv * depth + UP * z_back
    th = 0.06
    slope = (K0 - F0).normalized()
    nrm = t.cross(slope)
    if nrm.z < 0:
        nrm = -nrm
    nu = max(2, round(L / 1.2))
    nv = 3
    grid = [[F0.lerp(F1, i / nu).lerp(K0.lerp(K1, i / nu), j / nv) + nrm * (0.03 * math.sin(math.pi * j / nv) *
             (1 if 0 < i < nu else 0) * -1) for j in range(nv + 1)] for i in range(nu + 1)]
    verts_t = [p + nrm * th for r in grid for p in r]
    faces, uvs = [], []
    tile = sb.MATERIALS[mat][1]
    for i in range(nu):
        for j in range(nv):
            f = (i * (nv + 1) + j, (i + 1) * (nv + 1) + j, (i + 1) * (nv + 1) + j + 1, i * (nv + 1) + j + 1)
            faces.append(f)
    oriented = kv._orient(verts_t, faces, [verts_t[f[0]] - nrm for f in faces])
    for f in oriented:
        uvs.append([((verts_t[q] - F0).dot(slope) / tile, (verts_t[q] - F0).dot(t) / tile) for q in f])
    k.add(mat, False, verts_t, oriented, uvs)
    verts_u = [p for r in grid for p in r]
    k.add(mat, False, verts_u, [f[::-1] for f in oriented])
    for i, (p, q) in enumerate(((grid[0][0], grid[0][nv]), (grid[nu][0], grid[nu][nv]))):
        k.add(mat, False, [p, q, q + nrm * th, p + nrm * th], [(0, 1, 2, 3) if i else (3, 2, 1, 0)])
    # the frame: rafters under the mat, a front plate on posts, a back ledger, two battens over the mat
    nr = max(2, round(L / 0.6))
    for i in range(nr + 1):
        f = i / nr
        p, q = F0.lerp(F1, f), K0.lerp(K1, f)
        k.beam("bamboo", False, p - slope * 0.1 - nrm * 0.035, q - nrm * 0.035, 0.05, 0.05, 0)
    k.beam("timber", False, F0 - t * 0.1 + slope * (ov * 0.5) - nrm * 0.1, F1 + t * 0.1 + slope * (ov * 0.5) - nrm * 0.1,
           0.12, 0.14, 0.02)
    k.beam("timber", False, K0 - nrm * 0.06, K1 - nrm * 0.06, 0.1, 0.12, 0.015)
    for f in (0.35, 0.75):
        k.beam("bamboo", False, F0.lerp(K0, f) + nrm * (th + 0.02) - t * 0.03, F1.lerp(K1, f) + nrm * (th + 0.02) + t * 0.03,
               0.04, 0.04, 0)
    zp = z_front - 0.14
    for i in range(posts):
        f = i / max(1, posts - 1)
        p = (a + t * 0.15).lerp(b - t * 0.15, f) + slope * ov * 0.5
        sb.cyl("timber", True, (p.x, p.y, z0 - 0.05), (p.x, p.y, zp), post_r, post_r * 0.9, segs=8)
        k.post("timber", False, p.x, p.y, zp - 0.06, zp + 0.02, post_r * 2.2, 0.02)
    # the hem and the fringe
    sb.tube(mat, False, [F0 - t * 0.02 + nrm * th * 0.5, F1 + t * 0.02 + nrm * th * 0.5], [0.05, 0.05], segs=6)
    for row, (dz, lmax, out) in enumerate(((0.0, fringe, 0.05), (-0.05, fringe * 0.75, 0.03))):
        sp = rng.uniform(0, 0.05)
        while sp < L + 0.08:
            wdt = rng.uniform(0.04, 0.08)
            p = F0 + t * sp + UP * dz - slope * out
            q = p + t * wdt
            ln = lmax * rng.uniform(0.55, 1.0)
            tip = p.lerp(q, rng.uniform(0.3, 0.7)) - UP * ln - slope * 0.03
            _tongue(PALM_DARK if (row == 0 and rng.random() < 0.3) else mat, p, q, tip)
            sp += wdt * rng.uniform(0.6, 1.0)
    for P0_, P1_ in ((F0, K0), (F1, K1)):
        for j in range(4):
            p, q = P0_.lerp(P1_, j / 4), P0_.lerp(P1_, (j + 1) / 4)
            _tongue(mat, p, q, p.lerp(q, 0.5) - UP * fringe * rng.uniform(0.3, 0.55))


def kingpost_gable(p_left, p_right, z_tie, z_peak, rng, fish=False, purlin=0.35):
    """An OPEN king-post gable truss standing in a gable end between p_left and p_right (S4b.bld.tea_house_14531's
    south gable): a heavy tie beam, a king post from it to the ridge, two principal rafters under the barge, two
    struts from the king post's foot up to the rafters' middles, two short posts on the tie beam at its quarter points,
    and the ends of the purlins (ridge, the short posts' tops) running out of the gable plane `purlin` m each side.
    The caller puts a gable roof over it (its underside at z_peak at the ridge). fish: a hanging-fish board under the
    apex, facing out to the right of p_left -> p_right."""
    a, b = V((p_left[0], p_left[1], 0)), V((p_right[0], p_right[1], 0))
    t = (b - a).normalized()
    n = V((t.y, -t.x, 0))
    m = (a + b) / 2
    A, Bp = a + UP * z_tie, b + UP * z_tie
    P = m + UP * (z_peak - 0.1)
    k.beam("timber", True, A - t * 0.15, Bp + t * 0.15, 0.2, 0.26, 0.03)
    k.beam("timber", False, m + UP * (z_tie + 0.1), P, 0.16, 0.16, 0.02)
    k.post("timber", False, P.x, P.y, P.z - 0.04, P.z + 0.06, 0.2, 0.02)
    for E in (A, Bp):
        k.beam("timber", False, E + UP * 0.1, P + (E - P).normalized() * 0.08, 0.15, 0.18, 0.02)
    for E in (A, Bp):
        mid = E.lerp(P, 0.55)
        k.beam("timber", False, m + UP * (z_tie + 0.25) + (E - m).normalized() * 0.07, mid - UP * 0.06, 0.1, 0.1, 0.015)
    for f in (0.25, 0.75):
        q = a.lerp(b, f)
        zt = z_tie + (z_peak - z_tie) * (1 - abs(2 * f - 1)) * 0.92 - 0.12
        k.beam("timber", False, q + UP * (z_tie + 0.12), q + UP * zt, 0.12, 0.12, 0.015)
        k.beam("timber", False, q + UP * (zt + 0.06) - n * purlin, q + UP * (zt + 0.06) + n * purlin, 0.13, 0.14, 0.02)
        k.post("timber", False, q.x, q.y, zt - 0.02, zt + 0.0, 0.17, 0.01)
    k.beam("timber", False, P + UP * 0.12 - n * purlin, P + UP * 0.12 + n * purlin, 0.14, 0.15, 0.02)
    if fish:
        ko.hanging_fish(P + n * 0.2 + UP * 0.05, (n.x, n.y), s=0.8)


def roof_hatch(x, y, z, yaw_deg, rng, w=0.9, l=0.9, slope_deg=28.0, box_h=0.38, rise=0.32):
    """A small roof hatch on a slope (S4b.bld.south_hall_long_14680's south slope): a raised white box (a skylight)
    standing out of the tiles, its downslope face tall and white with a lattice light in it, its uphill face low; over
    it a little gable roof of its own whose ridge runs downslope, with barge boards and curled ridge-end ornaments.
    (x, y, z): the middle of its base on the roof surface; yaw: the downslope direction; slope_deg: the roof's pitch
    there. choice: 0.9 x 0.9 m, the box 0.38 m above the surface at its uphill side."""
    s = math.tan(math.radians(slope_deg))
    with k.placed(k.frame(x, y, z, yaw_deg)):
        hl, hw = l / 2, w / 2
        zt = box_h + s * hl                    # the box's level top, box_h above the surface at its uphill (-x) side

        def zs(xx):
            return -s * xx - 0.08              # the surface under the box (tucked 8 cm into the tiles)
        corners = [(-hl, -hw), (hl, -hw), (hl, hw), (-hl, hw)]
        bottom = [V((cx, cy, zs(cx))) for cx, cy in corners]
        top = [V((cx, cy, zt)) for cx, cy in corners]
        k.prism("plaster", False, bottom, top, cap_top=True)
        for cx, cy in corners:
            k.beam("timber", False, (cx, cy, zs(cx) + 0.06), (cx, cy, zt), 0.05, 0.05, 0)
        kv._lattice((hl + 0.005, hw - 0.14), (hl + 0.005, -hw + 0.14), max(zs(hl) + 0.2, zt - 0.32), zt - 0.07, 0.015,
                    nx=4, nz=1, frame="timber")
        # the little gable roof, ridge along x (downslope), eaves along +-y
        zr = zt + 0.06
        xa, xb = -hl - 0.12, hl + 0.2
        ya, yb = -hw - 0.14, hw + 0.14

        def height(sv, tv):
            return zr + rise * tv ** 1.2 + 0.05 * (abs(2 * sv - 1) ** 4) * (1 - tv)
        edges = k._roof_surface([((xa, ya), (xb, ya), (xa, 0), (xb, 0), 4), ((xb, yb), (xa, yb), (xb, 0), (xa, 0), 4)],
                                height, 0.08, 2, rafters=False)
        for rows in edges:
            for col in (0, -1):
                line = [r[col] for r in rows]
                k.beam("redwood", False, line[0] - UP * 0.03, line[-1] - UP * 0.03, 0.04, 0.14, 0)
        k.beam("ridge", False, (xa - 0.03, 0, zr + rise + 0.05), (xb + 0.03, 0, zr + rise + 0.05), 0.12, 0.12, 0.02)
        for xx, sg in ((xa, -1), (xb, 1)):     # curled ridge ends: a block rising and curling back over the ridge
            P = V((xx, 0, zr + rise + 0.08))
            o = V((sg, 0, 0))
            k.beam("ridge", False, P, P + UP * 0.12, 0.09, 0.07, 0)
            k.beam("ridge", False, P + UP * 0.1, P + UP * 0.17 - o * 0.09, 0.07, 0.05, 0)
        for xx in (-hl, hl):          # the gable triangles under the little roof
            tri = [V((xx, -hw, zt)), V((xx, hw, zt)), V((xx, 0, zr + rise * 0.85))]
            k.add("plaster", False, tri if xx > 0 else tri[::-1], [(0, 1, 2)])


# ---------------------------------------------------------------- 21-24. halls, sheds, valance

def _rising_gable_roof(x0, x1, y0, y1, z_eave, z_ridge_s, z_ridge_n, over=0.5, lift=0.18, curve=1.35, thick=0.16,
                       ns=8, nt=4, ornament_s=(0.45, 0.8)):
    """An overhanging gable roof (悬山) with its ridge along y from the south gable (y0) to the north gable (y1), the
    ridge rising from z_ridge_s to z_ridge_n while the eaves stay level: the south gable small, the north one tall.
    x0..x1: the eave lines (west, east); `over`: the overhang past both gables. Barge boards, a raised ridge, curled
    ridge-end ornaments (south, north) with the north one bigger (the finial near the road). Returns the edges."""
    xc = (x0 + x1) / 2
    ya, yb = y0 - over, y1 + over

    def zr(f):
        return z_ridge_s + (z_ridge_n - z_ridge_s) * f

    def h_w(s, t):      # west slope: s runs south -> north
        return z_eave + (zr(s) - z_eave) * (t ** curve) + lift * (abs(2 * s - 1) ** 4) * (1 - t)

    def h_e(s, t):      # east slope: s runs north -> south
        return z_eave + (zr(1 - s) - z_eave) * (t ** curve) + lift * (abs(2 * s - 1) ** 4) * (1 - t)
    e1 = k._roof_surface([((x0, ya), (x0, yb), (xc, ya), (xc, yb), ns)], h_w, thick, nt)
    e2 = k._roof_surface([((x1, yb), (x1, ya), (xc, yb), (xc, ya), ns)], h_e, thick, nt)
    edges = e1 + e2
    for rows in edges:
        for col in (0, -1):
            line = [r[col] for r in rows]
            for a, b in zip(line, line[1:]):
                k.beam("redwood", False, a - UP * 0.06, b - UP * 0.06, 0.07, 0.3, 0.015)
    k.beam("ridge", False, (xc, ya - 0.05, z_ridge_s + 0.1), (xc, yb + 0.05, z_ridge_n + 0.1), 0.24, 0.26, 0.04)
    k.ridge_ornament((xc, ya, z_ridge_s + 0.2), (0, -1), s=ornament_s[0])
    k.ridge_ornament((xc, yb, z_ridge_n + 0.2), (0, 1), s=ornament_s[1])
    return edges


def south_row_hall(x0, x1, y0, y1, rng, z0=0.0, eave=3.2, rise=2.2, north_lift=0.9, cols=None, fish=True,
                   balcony=False, plinth=0.2):
    """The south-row hall type (S4b.bld.south_hall_gable_14340, south_hall_13920, south_hall_diagonal_15242; part 1's
    S4.bld.south_hall_12350): x0..x1 west-east, y0 its south front, y1 its north back. A low plinth; an open south
    front on columns (`cols`: their x, both ends included) under a tie beam; plain plastered walls on the west, east
    and north; a gable roof whose ridge runs north-south and RISES to the north (the north gable peak `north_lift` m
    higher than the south's; the eaves level), with barge boards, a curled ornament at the small south gable and a
    bigger ridge finial at the north gable near the road; in the south gable, short posts on the tie beam and a
    plastered infill, the hanging fish (ko.hanging_fish) under the apex (fish); balcony: a railed balcony across the
    south gable at the tie beam's height, its floor on two posts in front. Returns the top of the columns.
    choice: plinth 0.2, eave 3.2, rise 2.2 at the south gable (part 1's 12350: 3.3 / 2.7)."""
    zt = z0 + plinth
    top = zt + eave
    if plinth > 0.02:
        k.soft_plinth(x0 - 0.25, x1 + 0.25, y0 - 0.3, y1 + 0.25, zt, rng)
    cols = sorted(cols) if cols else [x0, (x0 + x1) / 2, x1]
    if abs(cols[0] - x0) > 0.05:
        cols = [x0] + cols
    if abs(cols[-1] - x1) > 0.05:
        cols = cols + [x1]
    for x in cols:
        k.column(x, y0, zt, top, r=0.12, mat="timber")
    for x in (x0, x1):
        k.column(x, y1, zt, top, r=0.12, mat="timber")
    k.board("plaster", True, (x0, y1 - 0.1), (x0, y0 + 0.12), 0.14, zt, top)
    k.board("plaster", True, (x1, y0 + 0.12), (x1, y1 - 0.1), 0.14, zt, top)
    k.board("plaster", True, (x1 - 0.1, y1), (x0 + 0.1, y1), 0.14, zt, top)
    # floor boards collide (fix-s4b, 2026-10-13, as hall() above): the walkable top was the plinth's, 4.5 cm under them
    k.bx("timber", True, (x0 + 0.08, y0 + 0.08, zt), (x1 - 0.08, y1 - 0.08, zt + 0.03))
    # the open front's head boards between the columns, the tie beam across the gable, the plates along the sides
    W = x1 - x0
    fr = [(c - x0) / W for c in cols]
    ki.wall_bays((x0, y0), (x1, y0), zt, top - 0.12, fr, ["open"] * (len(cols) - 1), rng, posts=False)
    k.beam("timber", True, (x0 - 0.2, y0, top - 0.1), (x1 + 0.2, y0, top - 0.1), 0.18, 0.26, 0.03)
    k.beam("timber", False, (x0 - 0.15, y1, top - 0.1), (x1 + 0.15, y1, top - 0.1), 0.14, 0.2, 0.03)
    for x in (x0, x1):
        k.beam("timber", False, (x, y0 - 0.15, top - 0.08), (x, y1 + 0.15, top - 0.08), 0.14, 0.18, 0.02)
    zr = top + 0.12
    zs, zn = zr + rise, zr + rise + north_lift
    xc = (x0 + x1) / 2
    _rising_gable_roof(x0 - 0.8, x1 + 0.8, y0 - 0.1, y1 + 0.1, zr, zs, zn, over=0.5)
    # the gables: plastered infill (north: tall; south: over the tie beam, set back behind its truss)
    for y, zp, back in ((y1, zn, True), (y0 + 0.08, zs, False)):
        tri = [V((x0 - 0.05, y, top)), V((x1 + 0.05, y, top)), V((xc, y, zp - 0.12))]
        k.add("plaster", False, tri if back else tri[::-1], [(0, 1, 2)])
        k.add("plaster", False, tri[::-1] if back else tri, [(0, 1, 2)])
    for f in (0.3, 0.7):            # the south gable's short posts on the tie beam, a collar beam over them
        x = x0 + W * f
        zp = top + (zs - 0.12 - top) * (1 - abs(2 * f - 1)) - 0.05
        k.beam("timber", False, (x, y0 - 0.02, top + 0.02), (x, y0 - 0.02, zp), 0.11, 0.11, 0.015)
    zc = top + (zs - top) * 0.45
    k.beam("timber", False, (x0 + W * 0.22, y0 - 0.03, zc), (x1 - W * 0.22, y0 - 0.03, zc), 0.1, 0.13, 0.015)
    k.beam("timber", False, (xc, y0 - 0.03, top + 0.02), (xc, y0 - 0.03, zs - 0.15), 0.11, 0.11, 0.015)
    if fish:
        ko.hanging_fish((xc, y0 - 0.62, zs - 0.02), (0, -1), s=0.9)
    if balcony:
        yb_ = y0 - 0.75
        zf = top - 0.85
        for x in (x0 + 0.5, x1 - 0.5):
            sb.cyl("timber", True, (x, yb_ + 0.12, z0 - 0.05), (x, yb_ + 0.12, zf - 0.1), 0.08, 0.07, segs=8)
            k.post("timber", False, x, yb_ + 0.12, zf - 0.16, zf - 0.08, 0.16, 0.02)
        k.soft_box("deck", False, (x0 + 0.2, yb_, zf - 0.05), (x1 - 0.2, y0 - 0.05, zf), rng, r=0.02, wob=0.004, ease=0.01,
                   along=(1, 0))
        k.beam("timber", False, (x0 + 0.15, yb_ + 0.03, zf - 0.1), (x1 - 0.15, yb_ + 0.03, zf - 0.1), 0.1, 0.12, 0.015)
        # the railing: capped end posts, top and bottom rails, close balusters (flat, plain)
        zr_ = zf + 0.72
        for x in (x0 + 0.2, x1 - 0.2):
            k.post("timber", False, x, yb_ + 0.03, zf, zr_ + 0.08, 0.08, 0.012)
        for zz, hh in ((zr_, 0.06), (zf + 0.08, 0.05)):
            k.beam("timber", False, (x0 + 0.2, yb_ + 0.03, zz), (x1 - 0.2, yb_ + 0.03, zz), 0.06, hh, 0)
        nbal = max(4, round((x1 - x0 - 0.4) / 0.2))
        for i in range(1, nbal):
            xx = x0 + 0.2 + (x1 - x0 - 0.4) * i / nbal
            p, q = V((xx - 0.018, yb_ + 0.01, zf + 0.1)), V((xx + 0.018, yb_ + 0.01, zr_ - 0.03))
            sb.quad("timber", False, p, V((q.x, p.y, p.z)), q, V((p.x, p.y, q.z)))
        for x in (x0 + 0.2, x1 - 0.2):
            k.beam("timber", False, (x, yb_ + 0.03, zr_), (x, y0 - 0.05, zr_), 0.05, 0.05, 0)
        kv._lattice((x0 + 0.25, y0 - 0.06), (x1 - 0.25, y0 - 0.06), zr_ + 0.12, top - 0.25, 0.0,
                    nx=max(4, round(W / 0.4)), nz=2, frame="timber")
    return top


def open_mat_shed(corners, z, eave_front, eave_back, rng, braces=False, posts=None, over=0.25, post_r=0.06):
    """An open shed of posts under a flat-ish woven-mat roof (S4b.str.bank_shed_14445, S4b.bld.mat_shed_15038):
    corners [sw, se, ne, nw] (x, y) of its posts' plan, standing on z; the mat roof (kit_inner_city.mat_roof) over
    them `over` m past the posts, its front (south) eave at z + eave_front and back at z + eave_back; plates along the
    eaves on the posts (posts: a list of (x, y) instead of the four corners); braces: post-and-brace frames under the
    east end (a tie beam at mid-height, knee braces from both posts up to the plate). Posts collide."""
    P = [V((c[0], c[1], 0)) for c in corners]
    ctr = sum(P, V((0, 0, 0))) / 4

    def h_at(p):          # roof height over a plan point: front (sw-se) to back (nw-ne)
        f0, b0 = (P[0] + P[1]) / 2, (P[3] + P[2]) / 2
        d = b0 - f0
        tv = max(-0.3, min(1.3, (p - f0).dot(d) / max(d.length_squared, 1e-6)))
        return z + eave_front + (eave_back - eave_front) * tv
    R = [p + (p - ctr).normalized() * over for p in P]
    R = [V((p.x, p.y, h_at(p) + 0.02)) for p in R]
    ki.mat_roof(R, 0.0, rng, sag=0.05)
    pts = [V(q) for q in posts] if posts else P
    for p in pts:
        zt = h_at(p) - 0.06
        sb.cyl("timber", True, (p.x, p.y, z - 0.05), (p.x, p.y, zt), post_r, post_r * 0.88, segs=7)
    for i in range(4):
        a, b = P[i], P[(i + 1) % 4]
        k.beam("timber", False, V((a.x, a.y, h_at(a) - 0.06)) - (b - a).normalized() * 0.12,
               V((b.x, b.y, h_at(b) - 0.06)) + (b - a).normalized() * 0.12, 0.08, 0.1, 0.015)
    if braces:
        a, b = P[1], P[2]          # the east end (se -> ne)
        za, zb = h_at(a) - 0.06, h_at(b) - 0.06
        zm = z + min(eave_front, eave_back) * 0.5
        k.beam("timber", False, V((a.x, a.y, zm)), V((b.x, b.y, zm)), 0.07, 0.09, 0.012)
        d = (b - a)
        L = d.length
        d.normalize()
        for p, zz, sg in ((a, za, 1), (b, zb, -1)):
            k.beam("timber", False, V((p.x, p.y, zz - 0.7)), V((p.x, p.y, zz - 0.08)) + d * sg * min(0.6, L * 0.3), 0.06, 0.06, 0.01)
            k.beam("timber", False, V((p.x, p.y, zm + 0.05)), V((p.x, p.y, zm)) + d * sg * min(0.9, L * 0.45) + UP * (zz - zm - 0.1),
                   0.05, 0.05, 0.008)


def hall(x0, x1, yf, yb, rng, z0=0.0, plinth=0.3, eave=2.9, rise=1.5, cols=None, kinds=None, roof="gable",
         side=("wall", "wall"), back="wall", brackets=False, over=0.5, steps=True, col_r=0.12, lintel=True,
         ornament_s=0.45, front_dir=-1):
    """A one-storey hall in world coordinates (part 1's outer_road_scene.hall, made generic): its front along y = yf
    on columns at `cols` (x, both ends included) with each front bay a `kinds` entry ('wall', 'window', 'door',
    'open': ki.wall_bays), side walls (west, east) 'wall' or 'open', a back wall at yb; a stone plinth `plinth` high
    with steps up to the front; roof 'gable' (ridge along x), 'hip', 'xieshan', 'gable_y' / 'xieshan_y' (ridge
    north-south). front_dir -1: the front faces south (yb > yf, as in part 1); +1: the front faces north (yb < yf),
    so a hall south of the road can turn its front to the road (built as the south-facing hall turned half round
    about its middle: cols, kinds and side are given in world terms, west to east). Returns the top of the columns."""
    if front_dir > 0:
        cx, cy = (x0 + x1) / 2, (yf + yb) / 2
        M = Matrix.Translation((cx, cy, 0)) @ Matrix.Rotation(math.pi, 4, "Z") @ Matrix.Translation((-cx, -cy, 0))
        cols2 = sorted(2 * cx - c for c in cols) if cols else None
        kinds2 = list(reversed(kinds)) if kinds else None
        with k.placed(M):
            top = hall(2 * cx - x1, 2 * cx - x0, 2 * cy - yf, 2 * cy - yb, rng, z0, plinth, eave, rise, cols2, kinds2,
                       roof, (side[1], side[0]), back, brackets, over, steps, col_r, lintel, ornament_s, -1)
        return top
    zt = z0 + plinth
    top = zt + eave
    if plinth > 0.02:
        k.soft_plinth(x0 - 0.3, x1 + 0.3, yf - 0.35, yb + 0.3, zt, rng)
        if steps:
            xm = (x0 + x1) / 2
            n = max(1, round(plinth / 0.16))
            k.stairs(xm - 0.6, xm + 0.6, yf - 0.35 - 0.3 * n, yf - 0.35, z0, zt, n, rng=rng)
    cols = sorted(cols) if cols else [x0, x1]
    if abs(cols[0] - x0) > 0.05:
        cols = [x0] + cols
    if abs(cols[-1] - x1) > 0.05:
        cols = cols + [x1]
    for x in cols:
        k.column(x, yf, zt, top, r=col_r, mat="timber")
    for x in (x0, x1):
        k.column(x, yb, zt, top, r=col_r, mat="timber")
    W = x1 - x0
    kinds = kinds or ["open"] * (len(cols) - 1)
    fr = [(c - x0) / W for c in cols]
    ki.wall_bays((x0, yf), (x1, yf), zt, top - 0.12, fr, kinds, rng)
    if side[0] == "wall":
        k.board("plaster", True, (x0, yb - 0.1), (x0, yf + 0.12), 0.14, zt, top)
    if side[1] == "wall":
        k.board("plaster", True, (x1, yf + 0.12), (x1, yb - 0.1), 0.14, zt, top)
    if back == "wall":
        k.board("plaster", True, (x1 - 0.1, yb), (x0 + 0.1, yb), 0.14, zt, top)
    # floor boards: they collide (fix-s4b, details pass 2026-10-13, as S4's halls and song_kit.house/open_hall): over
    # the collide plinth alone the walkable top was the plinth's at zt - 0.015, so people and the player stood 4.5 cm
    # inside the visible boards (S4b's man_in_shed_13220: a sole 0.045 m under them)
    k.bx("timber", True, (x0 + 0.08, yf + 0.08, zt), (x1 - 0.08, yb - 0.08, zt + 0.03))
    if lintel:
        k.beam("timber", True, (x0 - 0.15, yf, top - 0.1), (x1 + 0.15, yf, top - 0.1), 0.16, 0.22, 0.03)
        k.beam("timber", False, (x0 - 0.15, yb, top - 0.1), (x1 + 0.15, yb, top - 0.1), 0.14, 0.2, 0.03)
    if brackets:
        for x in cols:
            k.bracket(x, yf, top, (0, -1), s=0.5, mat="timber")
    zr = top + (0.3 if brackets else 0.12)
    D = yb - yf
    if roof == "gable":
        k.gable_roof(x0 - 0.1, x1 + 0.1, yf - 0.8, yb + 0.6, zr, zr + rise, over=over, ornament_s=ornament_s)
        for x in (x0, x1):   # the gable triangles over the side walls
            k.add("plaster", False, [(x, yf - 0.1, top), (x, yb + 0.1, top), (x, (yf + yb) / 2, zr + rise * 0.9)], [(0, 1, 2)])
            k.add("plaster", False, [(x, yb + 0.1, top), (x, yf - 0.1, top), (x, (yf + yb) / 2, zr + rise * 0.9)], [(0, 1, 2)])
    elif roof == "hip":
        k.hip_roof(x0 - 0.65, x1 + 0.65, yf - 0.75, yb + 0.6, zr, zr + rise, lift=0.35, ns=8, nt=4, ornament_s=ornament_s)
    elif roof == "xieshan":
        ki.xieshan_roof(x0 - 0.65, x1 + 0.65, yf - 0.75, yb + 0.6, zr, zr + rise, along="x", ornament_s=ornament_s)
    elif roof in ("gable_y", "xieshan_y"):
        if roof == "xieshan_y":
            ki.xieshan_roof(x0 - 0.6, x1 + 0.6, yf - 0.7, yb + 0.7, zr, zr + rise, along="y", ornament_s=ornament_s)
        else:
            cx, cy = (x0 + x1) / 2, (yf + yb) / 2
            with k.placed(k.frame(cx, cy, 0, 90)):
                k.gable_roof(-D / 2 - 0.1, D / 2 + 0.1, -W / 2 - 0.8, W / 2 + 0.8, zr, zr + rise, over=over,
                             ornament_s=ornament_s)
            for y in (yf, yb):   # the gable triangles facing south and north
                k.add("plaster", False, [(x0 - 0.1, y, top), (x1 + 0.1, y, top), ((x0 + x1) / 2, y, zr + rise * 0.9)], [(0, 1, 2)])
                k.add("plaster", False, [(x1 + 0.1, y, top), (x0 - 0.1, y, top), ((x0 + x1) / 2, y, zr + rise * 0.9)], [(0, 1, 2)])
    return top


def valance(p0, p1, z, rng, depth=0.35, mat="cloth_indigo", fold=0.16):
    """A dark cloth valance band hung under an eave along p0 -> p1 (S4b.bld.shop_hall_13170): the cloth from z down
    `depth` m, gathered in shallow vertical folds every `fold` m, its hem gently waved, a darker hem band, on a thin
    rod at the top. choice: 0.35 m deep."""
    a, b = V((p0[0], p0[1], 0)), V((p1[0], p1[1], 0))
    t = b - a
    L = t.length
    t.normalize()
    n = V((t.y, -t.x, 0))
    m = max(2, round(L / (fold / 2)))
    top, mid, low, hem = [], [], [], []
    for i in range(m + 1):
        f = i / m
        o = n * (0.022 * (1 if i % 2 == 0 else -1))
        p = a + t * (L * f)
        wave = rng.uniform(-0.02, 0.02)
        top.append(p + o * 0.4 + UP * z)
        mid.append(p + o + UP * (z - depth * 0.5))
        low.append(p + o * 1.1 + UP * (z - depth * 0.85 + wave * 0.5))
        hem.append(p + o * 1.15 + UP * (z - depth + wave))
    for rows, mm in (((top, mid), mat), ((mid, low), mat), ((low, hem), "interior")):
        A, Bv = rows
        verts = A + Bv
        faces = [(i, i + 1, m + 1 + i + 1, m + 1 + i) for i in range(m)]
        k.add(mm, False, verts, faces)
    sb.cyl("bamboo", False, a - t * 0.05 + UP * (z + 0.01) + n * 0.01, b + t * 0.05 + UP * (z + 0.01) + n * 0.01, 0.018, segs=5)


def stump(x, y, z, rng, h=1.3, r=0.3, hook_deg=0.0, hook=0.45, collide=False):
    """An old gnarled stump (S4b.tree.stump_14805: a short thick trunk rising and hooking over toward `hook_deg` with a
    dark knob at its top, bare; a solid prop, not a card): a bent tube of bark tapering from r at its root flare to
    0.45 r, the hook `hook` m sideways over its top fifth, a knob at the end, and three short root spurs.
    choice: h 1.3 m real (painted 1.6 m at the figures' 1.3x), r 0.3; collide False (it stands on the bank path at the
    boats' bows, where a walker steps round it)."""
    a = math.radians(hook_deg)
    dx, dy = math.cos(a), math.sin(a)
    wob = lambda: rng.uniform(-0.04, 0.04)  # noqa: E731
    pts, radii = [], []
    n = 7
    for i in range(n + 1):
        t = i / n
        lean = hook * max(0.0, (t - 0.55) / 0.45) ** 1.6
        pts.append((x + dx * lean + wob() * t, y + dy * lean + wob() * t, z - 0.05 + h * (t - 0.12 * max(0.0, t - 0.8) / 0.2)))
        radii.append(r * (1.25 - 0.8 * t ** 0.8) if i else r * 1.35)
    sb.tube("bark", collide, pts, radii, segs=9)
    tip = pts[-1]
    sb.lathe("bark", False, (tip[0] + dx * 0.05, tip[1] + dy * 0.05, tip[2] - 0.12),
             [(0.0, 0.0), (r * 0.55, 0.06), (r * 0.62, 0.16), (r * 0.4, 0.26), (0.0, 0.3)], segs=8)
    for k_ in range(3):
        b = math.radians(hook_deg + 120 * k_ + rng.uniform(-25, 25))
        p0 = (x + math.cos(b) * r * 0.6, y + math.sin(b) * r * 0.6, z + 0.12)
        p1 = (x + math.cos(b) * r * 1.6, y + math.sin(b) * r * 1.6, z - 0.06)
        sb.tube("bark", False, [p0, p1], [r * 0.35, r * 0.12], segs=5)
