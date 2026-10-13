"""The Rainbow Bridge (虹桥, S3.str.rainbow_bridge) as a parametric set piece: the woven timber arch (贯木拱) over the
汴河, its deck and steps, railings, ramps, abutments and the tall end posts (表木), built to the map once S3 lands.

Study (what the scroll paints, with crops): gen/set_pieces/rainbow_bridge/study.md. Proof renders, sheet, test GLB and
the walk test: gen/set_pieces/rainbow_bridge/.

Two halves:
- **The fit** (plain Python, no bpy: also runs in python3) turns the mapped entity (`sections/rainbow_bridge/layout.json`
  `entities["S3.str.rainbow_bridge"]`) and the S3 frame (`map/frames/S3.json`: frames + supports) into one plan: the
  deck's centre line (W/2 beside the painted near edge, foot to foot; straight over the arch), one real width, the
  arch's springings, and one smooth deck height Z(s) along the bridge, fitted to the frame's `bridge deck` H_profile
  (or the entity's `lines_H`) inside a family that the woven arch fits under and a walker can climb (ramps extended
  past the painted feet where the painted deck is too steep; every such choice is in `Bridge.summary()["notes"]`).
- **The build** (Blender, song_kit idiom) lays every piece along that plan, inside `sb.entity(<map id>)`.

The deck height is exposed so the map and the build can be checked against each other: `Bridge.deck_H(X, D)`,
`Bridge.table(step)` (s, X, D, H and the scan u of both deck edges), `Bridge.h_profile()` ([u, H] pairs along the
painted near edge, ready to be the frame's `bridge deck` H_profile), `Bridge.check_profile(pairs)` (the map's pairs
against the built deck) and `Bridge.on_deck(u, v)` (a figure's foot on the scan -> X, D, H on the deck, solving
H and depth together). CLI (python3, no Blender):

    python3 qingming/blender/kit_rainbow_bridge.py table <layout.json|entity.json> [<frame.json>]

Entry point: `build(layout_entity, frame, ...)` -> Bridge. Units metres; X east, D north (Blender y), H up (z).

Real size (map/BUILDING.md rule 5): positions (feet, springings, deck edges) come from the map; sizes the strokes
can't give are `choice:` defaults in DEFAULTS, with their evidence in study.md.
"""
import json
import math
import random
import sys

try:                                    # the geometry half needs Blender; the fit and the table don't
    from mathutils import Vector as V
    import song_kit as k
    import street_b1 as sb
except ImportError:                     # python3 CLI
    V = k = sb = None

ENTITY_ID = "S3.str.rainbow_bridge"

# choice: every default below is a size the strokes can't give (map/BUILDING.md rule 6); evidence in study.md
DEFAULTS = dict(
    deck_w=8.0,            # choice: railing centre to railing centre (hint 8 m; painted: stalls on both sides of the south ramp with the sedan party between them, the crowd 3-4 deep at the crown)
    min_w=6.5, max_w=10.0,  # the mapped width is clamped to this (real size)
    crown_h=4.7,           # deck top at the crown above the banks, when the map gives no profile (painted: ~4.5-5.0 m over the near springings' ground trace)
    span=15.0,             # springing to springing, when the map gives no springings (painted: ~15 m between the near-face springings in the S5/S4b frame)
    ramp=7.0,              # foot to springing, when the map gives no feet
    water_H=-1.5,          # the frame's `water` support (S4b seed) when no frame is given
    spring_above_water=0.3,  # choice: the arch's feet rest on a sill on a stone ledge just above the water
    ribs=11,               # choice: rib lines across the width, alternating system A (3 beams) and B (4 beams): 6 A + 5 B
    rib_d=0.40,            # choice: rib log, painted outer band ~20 px at u 19100 (0.26 m at 77 px/m, x1.5 for the diminution)
    cross_d=0.34,          # choice: cross beams (横木) at the nodes; they run 0.45 m past the outer ribs, as the painted node caps
    cross_over=0.45,
    board_t=0.08, board_w=(0.30, 0.38),
    deck_depth=0.30,       # the board layer with the treads' risers; the underside slab, then the floor beams, sit below it
    fascia_w=0.18, fascia_h=0.34,   # the deck's edge beam (the painted narrow band between the arch band and the railing)
    beam_h=0.24,           # floor beams across, under the boards
    rail_h=1.05,           # choice: painted ~75 px at the crown (1.0 m at 77 px/m)
    rail_bay=1.6,          # choice: painted posts ~63 px apart at the crown (~0.9 m along the axis there, x1.7 diminution)
    end_post_h=1.5,        # the railing's end posts (望柱) with pointed caps (painted at the north landing, u ~20020)
    post_h=8.0, post_d=0.28, post_arm=1.7,  # choice: the tall end poles (表木) with a crossed pair of boards at the top; painted south pole >= 7 m
    step_from_deg=17.0,    # where the deck is steeper than this the boards are level treads (steps); the collider stays smooth
    max_slope_deg=34.0,    # the walk limit: the gate's 34 deg flight is walked; a steeper mapped ramp is extended along its end
    min_ramp=2.0,          # a foot at least this far beyond its springing (the abutment)
    spring_inset=0.5,      # with no rib line mapped, the springings this far inside the mapped feet
    max_turn_deg=40.0,     # a ramp may come in at an angle to the arch (the painted approach street), up to this
    abut_depth=2.2,        # choice: stone abutment behind each springing (hidden in the painting: crowd at the south, rigging at the north)
    min_clear=3.5,         # m of soffit above the water over the middle 40% of the span (the big boat, mast lowered: its cabin roof must stay under Bridge.clearance())
    seed=18920,
)

# ---------------------------------------------------------------- plain 2D/3D math (no mathutils: python3 runs the fit)


def _sub(a, b): return tuple(x - y for x, y in zip(a, b))
def _add(a, b): return tuple(x + y for x, y in zip(a, b))
def _mul(a, s): return tuple(x * s for x in a)
def _dot(a, b): return sum(x * y for x, y in zip(a, b))
def _len(a): return math.sqrt(_dot(a, a))
def _unit(a):
    n = _len(a)
    return _mul(a, 1 / n) if n > 1e-12 else a
def _lerp(a, b, t): return tuple(x + (y - x) * t for x, y in zip(a, b))
def _left(t): return (-t[1], t[0])


def _resample(poly, ds):
    """A plan polyline resampled every ~ds by arc length: [(s, (x, y))]."""
    acc, out = [0.0], []
    for a, b in zip(poly, poly[1:]):
        acc.append(acc[-1] + _len(_sub(b, a)))
    L = acc[-1]
    n = max(2, round(L / ds))
    j = 0
    for i in range(n + 1):
        s = L * i / n
        while j < len(poly) - 2 and acc[j + 1] < s:
            j += 1
        seg = acc[j + 1] - acc[j]
        t = 0 if seg < 1e-9 else (s - acc[j]) / seg
        out.append((s, _lerp(poly[j], poly[j + 1], t)))
    return out


class Frame:
    """The map frame (map/README.md, Frames): scan <-> ground. Accepts map/frames/S3.json (frames + supports) or a
    layout.json's `frames` list."""

    def __init__(self, F):
        F = F or {}
        if isinstance(F, list):
            F = {"frames": F}
        self.frames = F.get("frames") or [{"id": "F1", "covers": [0, 99999], "origin": [8248, 1565], "x": [77, 0],
                                            "d": [31.6, -51.25], "h": 77, "dx_knots": [[12600, 31.6]]}]
        self.supports = F.get("supports") or {}

    def _f(self, u):
        return next((f for f in self.frames if f["covers"][0] <= u < f["covers"][1]), self.frames[0])

    @staticmethod
    def _dx(f, u):
        kn = f.get("dx_knots")
        if not kn:
            return f["d"][0]
        if u <= kn[0][0]:
            return kn[0][1]
        for (u0, d0), (u1, d1) in zip(kn, kn[1:]):
            if u <= u1:
                return d0 + (d1 - d0) * (u - u0) / (u1 - u0)
        return kn[-1][1]

    def to_scan(self, X, D, H):
        f = self.frames[0]
        u = f["origin"][0] + f["x"][0] * X
        for _ in range(8):
            f = self._f(u)
            u = f["origin"][0] + f["x"][0] * X + self._dx(f, u) * D
        return u, f["origin"][1] + f["d"][1] * D - f["h"] * H

    def to_world(self, u, v, H):
        f = self._f(u)
        D = (v - f["origin"][1] + f["h"] * H) / f["d"][1]
        return (u - f["origin"][0] - self._dx(f, u) * D) / f["x"][0], D

    def support_H(self, name, default=None):
        s = self.supports.get(name)
        return default if s is None else s.get("H", default)

    def h_profile(self, name="bridge deck"):
        s = self.supports.get(name) or {}
        return s.get("H_profile")


# ---------------------------------------------------------------- the fit: mapped entity -> one plan


class Plan:
    """Everything the build lays out, in world metres: the centre line C(s) (s = 0 at the south foot), the half
    widths to the left (far, north-west) and right (near, south-east) of travel south -> north, the deck top Z(s),
    the arch's springing stations and heights, the posts. `notes` lists every choice the fit made."""

    def __init__(self):
        self.notes = []

    # centre line ------------------------------------------------------------
    def _i(self, s):
        s = min(max(s, 0.0), self.L)
        f = s / self.ds
        i = min(int(f), len(self.C) - 2)
        return i, f - i

    def C2(self, s):
        """Centre point at station s; beyond the ends it runs on along the end tangent."""
        if s < 0:
            return _add(self.C[0], _mul(self.T(0), s))
        if s > self.L:
            return _add(self.C[-1], _mul(self.T(self.L), s - self.L))
        i, t = self._i(s)
        return _lerp(self.C[i], self.C[i + 1], t)

    def T(self, s):
        i, _ = self._i(s)
        return _unit(_sub(self.C[i + 1], self.C[i]))

    def N(self, s):
        return _left(self.T(s))

    def wl(self, s):
        i, t = self._i(s)
        return self.WL[i] + (self.WL[i + 1] - self.WL[i]) * t

    def wr(self, s):
        i, t = self._i(s)
        return self.WR[i] + (self.WR[i + 1] - self.WR[i]) * t

    def pt(self, s, off=0.0):
        """Plan point at station s, `off` metres to the left (far side) of the centre line."""
        return _add(self.C2(s), _mul(self.N(s), off))

    # deck height -------------------------------------------------------------
    def Z(self, s):
        """Deck top (the boards' walking surface) at station s. Past the feet it dips 0.12 m into the ground over
        0.6 m, so the hidden walk surface meets the ground without a lip."""
        if s < 0:
            return self.z_foot[0] - 0.12 * min(1.0, -s / 0.6)
        if s > self.L:
            return self.z_foot[1] - 0.12 * min(1.0, (s - self.L) / 0.6)
        return self._z(s)

    def slope(self, s, h=0.05):
        return (self.Z(s + h) - self.Z(s - h)) / (2 * h)


def _corners(ent):
    """The four feet (where the ramps meet the ground) as two ends, south first: ([a, b], [c, d]) each (x, y, H)."""
    fp = ent.get("footprint")
    pts = ent.get("pts", {})
    if not fp or len(fp) < 4:
        return None
    P = []
    for name, q in zip(("sw", "se", "ne", "nw"), fp):
        H = pts.get(name, [0, 0, 0])[2] if len(pts.get(name, [])) > 2 else 0.0
        P.append((q[0], q[1], H))
    # pair the corners into two ends: the pairing whose end midpoints lie farthest apart
    best = None
    for (a, b), (c, d) in (((0, 1), (2, 3)), ((1, 2), (3, 0))):
        m0, m1 = _mul(_add(P[a], P[b]), 0.5), _mul(_add(P[c], P[d]), 0.5)
        L = _len(_sub(m1[:2], m0[:2]))
        if best is None or L > best[0]:
            best = (L, [P[a], P[b]], [P[c], P[d]], m0, m1)
    _, e0, e1, m0, m1 = best
    return (e0, e1) if m0[1] <= m1[1] else (e1, e0)          # south end = the lower D


def _deck_lines(ent, m0=None, m1=None):
    """The deck's edge lines as (near, far), each (points, H list or None): any line whose role starts with 'deck' or
    'rail' (deck_* wins), classified by its side of the foot-to-foot axis m0 -> m1: right of travel south -> north is
    the near (painted, south-east or east) edge, left the far one; a line between them (deck_c) is the centre, not an
    edge. Without the feet, the line with the lower mean D is the near one."""
    lines = ent.get("lines") or {}
    hs = ent.get("lines_H") or {}
    cand = [(r, p) for r, p in lines.items() if r.startswith("deck")] or [(r, p) for r, p in lines.items() if r.startswith("rail")]
    if len(cand) < 2:
        return None
    if m0 is not None and m1 is not None:
        ax = _unit(_sub(m1, m0))

        def side(pts):
            return sum(ax[0] * (q[1] - m0[1]) - ax[1] * (q[0] - m0[0]) for q in pts) / len(pts)
        cand.sort(key=lambda rp: side(rp[1]))
    else:
        cand.sort(key=lambda rp: sum(q[1] for q in rp[1]) / len(rp[1]))
    (rn, pn), (rf, pf) = cand[0], cand[-1]
    return (pn, hs.get(rn)), (pf, hs.get(rf))


def _proj(C, p):
    """Station and signed offset (+ left) of plan point p on the resampled centre line C [(s, pt)]."""
    best = None
    for (s0, a), (s1, b) in zip(C, C[1:]):
        d = _sub(b, a)
        L2 = _dot(d, d) or 1e-12
        t = max(0.0, min(1.0, _dot(_sub(p, a), d) / L2))
        q = _add(a, _mul(d, t))
        dist = _len(_sub(p, q))
        if best is None or dist < best[0]:
            side = d[0] * (p[1] - a[1]) - d[1] * (p[0] - a[0])
            best = (dist, s0 + (s1 - s0) * t, math.copysign(dist, side))
    # beyond the ends: along the end tangents
    for (s0, a), (s1, b), sgn in ((C[0], C[1], -1), (C[-2], C[-1], 1)):
        d = _unit(_sub(b, a))
        t = _dot(_sub(p, a if sgn < 0 else b), d)
        if (sgn < 0 and t < 0) or (sgn > 0 and t > 0):
            off = d[0] * (p[1] - a[1]) - d[1] * (p[0] - a[0])
            if abs(off) <= best[0] + 1e-9:
                best = (abs(off), (s0 if sgn < 0 else s1) + t, off)
    return best[1], best[2]


def _profile_family(s, s_c, L, z0, z1, Hc, q0, q1):
    """The deck's shape: from the south foot (z0) up to the crown (Hc at s_c) and down to the north foot (z1), each
    side (1 - cos(pi t^q)) / 2: level at the crown and level at the feet (the landing), steepest in between; q > 1 a
    fuller crown and steeper ends, q < 1 a sharper crown."""
    if s <= s_c:
        t = min(1.0, max(0.0, (s_c - s) / max(s_c, 1e-6)))
        return z0 + (Hc - z0) * (1 + math.cos(math.pi * t ** q0)) / 2
    t = min(1.0, max(0.0, (s - s_c) / max(L - s_c, 1e-6)))
    return z1 + (Hc - z1) * (1 + math.cos(math.pi * t ** q1)) / 2


def fit(ent, frame=None, params=None):
    """The mapped entity + frame -> Plan. Reads, in order of preference:
    - feet: `footprint` (four corners where the ramps meet the ground; H from `pts.<corner>[2]`);
    - centre line and width: the deck edge `lines` (deck_* or rail_*; the near one is the lower-D line), else straight
      between the end midpoints with DEFAULTS deck_w;
    - springings: a rib line (`lines` role rib*/arch*: its first and last points, on the near face unless the role
      ends _n/_w), else `pts.spring_s` / `spring_n`, else just inside the mapped feet, else DEFAULTS span about the crown;
    - deck heights: `lines_H` of the deck lines, else the frame's `bridge deck` H_profile read along the near edge;
      fitted (least squares) by the profile family, the crown kept within 5% of the arch's mid-span;
    - posts: `pts.post_*` ([X, D, H] feet) or params['posts'] [{"id", "X", "D", "H"}], else none.
    """
    P = dict(DEFAULTS)
    P.update(params or {})
    fr = Frame(frame)
    pl = Plan()
    pl.P = P
    pl.frame = fr
    pl.ds = 0.25
    water = fr.support_H("water", P["water_H"])
    pl.water_H = water
    ends = _corners(ent)
    dl = _deck_lines(ent, *((_mul(_add(ends[0][0][:2], ends[0][1][:2]), 0.5), _mul(_add(ends[1][0][:2], ends[1][1][:2]), 0.5))
                            if ends else (None, None)))
    if ends is None and dl is None:
        raise ValueError("the bridge entity needs a footprint (four feet) or two deck edge lines")
    pts = ent.get("pts", {})
    lines = ent.get("lines") or {}
    # -- the width: one real width for the whole deck (the mapped edges are noisy; a real bridge is one width)
    if dl:
        rn = _resample([tuple(q[:2]) for q in dl[0][0]], 0.5)
        far2 = [tuple(q[:2]) for q in dl[1][0]]
        far_r = _resample(far2, 0.25) if len(far2) > 1 else []
        ws = []
        for _, p in rn:
            d = min(_len(_sub(p, q)) for _, q in far_r) if far_r else None
            if d:
                ws.append(d)
        w_map = sorted(ws)[len(ws) // 2]
        W = min(P["max_w"], max(P["min_w"], w_map))
        pl.notes.append(f"deck width from the mapped edge lines: median {w_map:.2f} m, built {W:.2f} m (real {P['min_w']}-{P['max_w']} m)")
    elif ends:
        w0 = _len(_sub(ends[0][0][:2], ends[0][1][:2]))
        w1 = _len(_sub(ends[1][0][:2], ends[1][1][:2]))
        W = min(P["max_w"], max(P["min_w"], (w0 + w1) / 2))
        pl.notes.append(f"deck width from the feet: {W:.2f} m (mapped {w0:.2f} / {w1:.2f})")
    else:
        W = P["deck_w"]
        pl.notes.append(f"choice: deck width {W} m (DEFAULTS)")
    # -- the arch's axis and springings (its centre line is straight in plan): a mapped rib line on the near face
    # (rib*/arch*; rib_n on the far face), else pts spring_s/spring_n (near face), else along the bridge about the crown
    m0 = _mul(_add(ends[0][0][:2], ends[0][1][:2]), 0.5) if ends else None
    m1 = _mul(_add(ends[1][0][:2], ends[1][1][:2]), 0.5) if ends else None
    if dl:
        # the near (painted) edge is the measured one, the far edge mostly estimated: the built near edge lies on it,
        # foot to foot, and the centre line runs W/2 to its left
        n0, n1 = tuple(dl[0][0][0][:2]), tuple(dl[0][0][-1][:2])
        if m0 is not None and _dot(_sub(n1, n0), _sub(m1, m0)) < 0:
            n0, n1 = n1, n0
        elif m0 is None and n0[1] > n1[1]:
            n0, n1 = n1, n0
        lt = _left(_unit(_sub(n1, n0)))
        m0, m1 = _add(n0, _mul(lt, W / 2)), _add(n1, _mul(lt, W / 2))
        pl.notes.append(f"centre line {W / 2:.2f} m to the left of the mapped near edge, foot to foot")
    ribs = {r: p for r, p in lines.items() if r.startswith(("rib", "arch"))}
    spr = None
    if ribs:
        cs = []
        for r, p in ribs.items():
            a_, b_ = tuple(p[0][:2]), tuple(p[-1][:2])
            if a_[1] > b_[1]:
                a_, b_ = b_, a_
            off = -W / 2 if r.endswith(("_n", "_w")) else W / 2   # a near-face rib (_s, _e): the centre is W/2 to its left
            lt = _left(_unit(_sub(b_, a_)))
            cs.append((_add(a_, _mul(lt, off)), _add(b_, _mul(lt, off))))
        spr = (_mul(_add(*[c[0] for c in cs]), 1 / len(cs)) if len(cs) > 1 else cs[0][0],
               _mul(_add(*[c[1] for c in cs]), 1 / len(cs)) if len(cs) > 1 else cs[0][1])
        pl.notes.append(f"springings from the mapped rib line(s) {sorted(ribs)} (near face moved {W / 2:.2f} m to the centre)")
    elif "spring_s" in pts and "spring_n" in pts:
        a_, b_ = sorted((tuple(pts["spring_s"][:2]), tuple(pts["spring_n"][:2])), key=lambda p: p[1])
        lt = _left(_unit(_sub(b_, a_)))
        spr = (_add(a_, _mul(lt, W / 2)), _add(b_, _mul(lt, W / 2)))
        pl.notes.append("springings from pts spring_s / spring_n (near face)")
    if spr is None and ends:
        # the painted deck rides the arch down to the banks (S3: the deck edge and the arch meet the ground together),
        # so with no rib line the springings sit just inside the mapped feet; the ramps then run on past them
        ax0 = _unit(_sub(m1, m0))
        Lm = _len(_sub(m1, m0))
        span_ = min(22.0, max(12.0, Lm - 2 * P["spring_inset"]))
        spr = (_add(m0, _mul(ax0, (Lm - span_) / 2)), _add(m0, _mul(ax0, (Lm + span_) / 2)))
        pl.notes.append(f"choice: springings {P['spring_inset']} m inside the mapped feet (no rib line mapped): span {span_:.2f} m")
    if spr is None:
        ax0 = _unit(_sub(m1, m0))
        Lm = _len(_sub(m1, m0))
        mid_s = Lm / 2
        hp = fr.h_profile()
        if hp:                                   # the mapped crown: the highest pair, on the straight near edge
            u_top = max(hp, key=lambda uh: uh[1])[0]
            best = min((abs(fr.to_scan(*_add(_add(m0, _mul(ax0, t * 0.25)), _mul(_left(ax0), -W / 2)), max(h for _, h in hp))[0] - u_top), t * 0.25)
                       for t in range(int(Lm / 0.25) + 1))
            mid_s = best[1]
        a_, b_ = (_add(m0, _mul(ax0, max(1.5, mid_s - P["span"] / 2))), _add(m0, _mul(ax0, min(Lm - 1.5, mid_s + P["span"] / 2))))
        spr = (a_, b_)
        pl.notes.append(f"choice: springings {P['span']} m apart about the crown (no rib line mapped)")
    ax = _unit(_sub(spr[1], spr[0]))
    if m0 is None:
        m0 = _sub(spr[0], _mul(ax, P["ramp"]))
        m1 = _add(spr[1], _mul(ax, P["ramp"]))
        pl.notes.append(f"choice: ramps {P['ramp']} m (no feet mapped)")
    # -- the feet must lie beyond their springings, the ramp within max_turn_deg of the arch's axis: a mapped foot that
    # reads behind or beside its springing (the painter's depth over the bridge, see study.md) is put on the axis at
    # its mapped distance (at least min_ramp)
    def sane_foot(foot, spring, out_dir, name):
        d = _sub(foot, spring)
        L_ = max(P["min_ramp"], _len(d))
        if _len(d) < 1e-6:
            d = out_dir
        ang = math.degrees(math.atan2(out_dir[0] * d[1] - out_dir[1] * d[0], _dot(out_dir, d)))
        lim = P["max_turn_deg"]
        if abs(ang) <= lim and _len(d) >= P["min_ramp"]:
            return foot
        new = _add(spring, _mul(out_dir, L_))        # a turn that far is a reading artefact, not a painted turn: on the axis
        pl.notes.append(f"choice: the {name} foot moved from the mapped ({foot[0]:.2f}, {foot[1]:.2f}) to ({new[0]:.2f}, "
                        f"{new[1]:.2f}): mapped {ang:+.0f} deg off the arch's axis, {_len(_sub(foot, spring)):.2f} m from its "
                        f"springing (allowed {lim} deg, at least {P['min_ramp']} m)")
        return new
    m0 = sane_foot(m0, spr[0], _mul(ax, -1), "south")
    m1 = sane_foot(m1, spr[1], ax, "north")
    # -- the centre line: south foot -> south springing -> (straight over the arch) -> north springing -> north foot;
    # a ramp may come in at an angle (the painted approach street): the turn is rounded on the ramp side, over the
    # abutment, so the arch stays straight
    def ramp(foot, spring, toward):
        """Points from the foot to the springing: straight, or, where the foot is off the axis, a straight run and
        then an arc of radius >= W/2 + 1.5 m (so the inner edge never folds) that meets the arch's axis at the
        springing."""
        o = _mul(toward, -1)                        # outward from the springing
        d = _sub(foot, spring)
        th = math.atan2(o[0] * d[1] - o[1] * d[0], _dot(o, d))
        if abs(math.degrees(th)) < 2 or _len(d) < 0.5:
            return [foot]
        sg = 1 if th > 0 else -1
        R = W / 2 + 1.5
        best = None
        for i in range(1, 181):
            phi = math.radians(i * 0.5)
            # the arc's end and direction, turning by sg*phi from o
            nrm = _mul(_left(o), sg)
            E = _add(spring, _add(_mul(o, R * math.sin(phi)), _mul(nrm, R * (1 - math.cos(phi)))))
            dirE = (o[0] * math.cos(sg * phi) - o[1] * math.sin(sg * phi), o[0] * math.sin(sg * phi) + o[1] * math.cos(sg * phi))
            q = _sub(foot, E)
            cr = dirE[0] * q[1] - dirE[1] * q[0]
            if _dot(dirE, q) > 0 and (best is None or abs(cr) < best[0]):
                best = (abs(cr), phi, E, nrm)
        if best is None or best[0] > 0.3:
            on_axis = _add(spring, _mul(o, max(P["min_ramp"], _len(d))))
            pl.notes.append(f"choice: the ramp to ({foot[0]:.2f}, {foot[1]:.2f}) is too short to turn onto the arch's axis "
                            f"(radius {R:.1f} m): its foot is put on the axis at ({on_axis[0]:.2f}, {on_axis[1]:.2f})")
            return [on_axis]
        _, phi, E, nrm = best
        arc = []
        for j in range(12, -1, -1):              # from the arc's end back to the springing
            f_ = phi * j / 12
            arc.append(_add(spring, _add(_mul(o, R * math.sin(f_)), _mul(nrm, R * (1 - math.cos(f_))))))
        return [foot] + arc[:-1]
    poly = ramp(m0, spr[0], ax) + [spr[0], spr[1]] + [p for p in reversed(ramp(m1, spr[1], _mul(ax, -1)))]
    clean = [poly[0]]
    for p in poly[1:]:
        if _len(_sub(p, clean[-1])) > 0.05:
            clean.append(p)
    C = _resample(clean, 0.25)
    pl.C = [p for _, p in C]
    pl.L = C[-1][0]
    pl.ds = pl.L / (len(C) - 1)
    pl.WL = [W / 2] * len(C)
    pl.WR = [W / 2] * len(C)
    Cs = [(i * pl.ds, p) for i, p in enumerate(pl.C)]
    pl.s_a = sorted(_proj(Cs, q)[0] for q in spr)
    pl.z_foot = [ends[0][0][2] * 0.5 + ends[0][1][2] * 0.5, ends[1][0][2] * 0.5 + ends[1][1][2] * 0.5] if ends else [0.0, 0.0]
    if ends:                                     # a mapped deck that is not square (the frame's receding direction)
        for name, (a_, b_) in (("south", ends[0]), ("north", ends[1])):
            w_ = _unit(_sub(b_[:2], a_[:2]))
            sk = abs(math.degrees(math.asin(max(-1.0, min(1.0, _dot(w_, ax))))))
            if sk > 10:
                pl.notes.append(f"WARNING: the mapped {name} end is skewed {sk:.0f} deg from square to the arch's axis (its "
                                f"corners {_len(_sub(b_[:2], a_[:2])):.1f} m apart): the kit builds the bridge square, {W:.2f} m wide; "
                                f"things mapped at the far corners stand up to {abs(_dot(_sub(b_[:2], a_[:2]), ax)) / 2:.1f} m off "
                                f"the built deck's end (the frame's receding direction over the bridge: study.md)")
    # -- profile samples (s, H) along the bridge
    samples = []
    if dl and dl[0][1]:
        for line_, hs in (dl[0], dl[1]):
            for q, H in zip(line_, hs or []):
                samples.append((_proj(Cs, tuple(q[:2]))[0], H))
        pl.notes.append(f"deck heights: {len(samples)} points of the deck lines' lines_H")
    elif fr.h_profile():
        samples = _samples_from_profile(pl, fr.h_profile())
        pl.notes.append(f"deck heights: the frame's bridge deck H_profile, {len(samples)} pairs read along the near edge")
    pl.samples = samples
    pl.z_spring = water + P["spring_above_water"]
    # -- the deck profile: fit the family to the samples
    _shape(pl)
    # -- posts (表木): mapped feet, or the caller's
    tops = {k_: v for k_, v in pts.items() if k_.startswith("post_") and k_.endswith("_top")}
    pl.posts = []
    for k_, v in sorted(pts.items()):
        if k_.startswith("post_") and not k_.endswith("_top"):
            h = (tops[k_ + "_top"][2] - v[2]) if k_ + "_top" in tops else None
            pl.posts.append(dict(id=k_, X=v[0], D=v[1], H=v[2] if len(v) > 2 else 0.0, h_map=h))
            if h is not None:
                pl.notes.append(f"choice: pole {k_} built {P['post_h']} m tall (mapped {h:.2f} m: painted smaller up the silk)")
    for q in P.get("posts") or []:
        pl.posts.append(dict(id=q.get("id", "post"), X=q["X"], D=q["D"], H=q.get("H", 0.0), h_map=q.get("h")))
    if not pl.posts:
        pl.notes.append("no end posts mapped: none built")
    return pl


def _samples_from_profile(pl, prof):
    """The frame's H_profile is [u, H] read along the painted near deck edge: find, for each pair, the station
    whose near-edge point at that H has that scan u."""
    out = []
    S = [i * 0.25 for i in range(int(pl.L / 0.25) + 1)]
    s_min = 0.0
    for u, H in sorted(prof):
        best = None
        for s in S:
            if s < s_min:                # along the bridge in increasing u: never back onto an earlier stretch
                continue
            p = pl.pt(s, -pl.wr(s))
            uu, _ = pl.frame.to_scan(p[0], p[1], H)
            if best is None or abs(uu - u) < best[0]:
                best = (abs(uu - u), s)
        if best and best[0] < 40:        # px: pairs off the bridge's u range are left out
            out.append((best[1], H))
            s_min = best[1]
    return out


def _fit_profile(pl):
    """The profile family fitted (least squares) to the mapped heights; the crown kept within 5% of the arch's
    mid-span (a real arch carries its crown in the middle; the painter foreshortens the far half)."""
    P = pl.P
    z0, z1 = pl.z_foot
    L = pl.L
    samples = pl.samples
    mid = (pl.s_a[0] + pl.s_a[1]) / 2
    span = pl.s_a[1] - pl.s_a[0]
    rms = None
    if not samples:
        pl.prof = dict(s_c=mid, Hc=P["crown_h"], q0=1.0, q1=1.0)
    else:
        best = None
        for s_c in [mid + span * f for f in (-0.05, -0.025, 0, 0.025, 0.05)]:   # the crown over the arch's middle
            for q0 in (1.0, 1.15, 1.3, 1.5, 1.75):             # q >= 1: a rounded crown, as an arch carries it
                for q1 in (1.0, 1.15, 1.3, 1.5, 1.75):
                    # Hc by least squares for this shape (the family is linear in Hc)
                    num = den = 0.0
                    for s, H in samples:
                        g = _profile_family(s, s_c, L, 0, 0, 1, q0, q1)
                        base = _profile_family(s, s_c, L, z0, z1, 0, q0, q1)
                        num += (H - base) * g
                        den += g * g
                    Hc = min(7.5, max(3.0, num / den if den else P["crown_h"]))
                    err = sum((_profile_family(s, s_c, L, z0, z1, Hc, q0, q1) - H) ** 2 for s, H in samples)
                    if best is None or err < best[0]:
                        best = (err, dict(s_c=s_c, Hc=Hc, q0=q0, q1=q1))
        pl.prof = best[1]
        rms = math.sqrt(best[0] / len(samples))
    pr = pl.prof
    pl._fam = lambda s: _profile_family(s, pr["s_c"], pl.L, z0, z1, pr["Hc"], pr["q0"], pr["q1"])
    pl._z = pl._fam
    return rms


def _extend(pl, side, d):
    """Lengthen the deck by d metres at one end, along that end's tangent; stations shift when the south end grows."""
    n = max(1, round(d / pl.ds))
    if side == 0:
        t = pl.T(0)
        new = [_sub(pl.C[0], _mul(t, pl.ds * k_)) for k_ in range(n, 0, -1)]
        pl.C = new + pl.C
        pl.WL = [pl.WL[0]] * n + pl.WL
        pl.WR = [pl.WR[0]] * n + pl.WR
        sh = n * pl.ds
        pl.s_a = [s + sh for s in pl.s_a]
        pl.samples = [(s + sh, H) for s, H in pl.samples]
        if getattr(pl, "prof", None):
            pl.prof["s_c"] += sh
    else:
        t = pl.T(pl.L)
        pl.C = pl.C + [_add(pl.C[-1], _mul(t, pl.ds * k_)) for k_ in range(1, n + 1)]
        pl.WL = pl.WL + [pl.WL[-1]] * n
        pl.WR = pl.WR + [pl.WR[-1]] * n
    pl.L = (len(pl.C) - 1) * pl.ds


# ---------------------------------------------------------------- the woven arch (贯木拱) in its own plane

def _arch_nodes(span, z_s, f, rib_d, cross_d):
    """Node positions along the chord (x from the south springing) and heights for both systems.
    System A (三节苗): 3 beams, nodes on a circular arc of rise f through the springings at +-phi0/3 (a level middle
    beam). System B (四节苗): 4 beams, nodes at the arc's +-phi0/2 and 0 (the crown), each one beam-and-cross-beam
    depth below A's beams there. That is the weave: at B's nodes B's cross beams carry A's beams; at A's nodes A's
    cross beams lie on B's beams and press them down (B's nodes are lowered until they do)."""
    R = (span * span / 4 + f * f) / (2 * f)
    zc = z_s + f - R
    phi0 = math.asin(min(1.0, span / (2 * R)))

    def on_arc(phi):
        return (span / 2 + R * math.sin(phi), zc + R * math.cos(phi))

    def z_on(nodes, x):
        for (x0, z0), (x1, z1) in zip(nodes, nodes[1:]):
            if x0 <= x <= x1:
                return z0 + (z1 - z0) * (x - x0) / (x1 - x0)
        return nodes[-1][1]
    lift = (rib_d + cross_d) / 2
    A = [(0.0, z_s)] + [on_arc(p) for p in (-phi0 / 3, phi0 / 3)] + [(span, z_s)]
    B = [(0.0, z_s)] + [(x, z_on(A, x) - lift) for x, _ in (on_arc(p) for p in (-phi0 / 2, 0.0, phi0 / 2))] + [(span, z_s)]
    for _ in range(6):
        for xa, za in A[1:-1]:
            gap = za - z_on(B, xa)
            if gap < lift - 1e-4:
                j = next(i for i in range(len(B) - 1) if B[i][0] <= xa <= B[i + 1][0])
                for i in (j, j + 1):
                    if 0 < i < len(B) - 1:
                        B[i] = (B[i][0], B[i][1] - (lift - gap))
    return A, B, z_on


def _arch(pl):
    """The arch's rise: its top (beams and cross beams) just under the deck's floor beams over the crown (35-65% of
    the span), so the arch stays round (the weave needs the curvature) and as high as the deck's crown allows; the
    deck's shape is then chosen to clear its shoulders (_constrained)."""
    P = pl.P
    s0, s1 = pl.s_a
    a0, a1 = pl.C2(s0), pl.C2(s1)
    span = _len(_sub(a1, a0))
    pl.span = span
    pl.arch_dir = _unit(_sub(a1, a0))
    build = P["deck_depth"] + P["beam_h"]              # deck top to the floor beams' underside
    top_off = max(P["rib_d"], P["cross_d"]) / 2

    def ok(f):
        A, B, z_on = _arch_nodes(span, pl.z_spring, f, P["rib_d"], P["cross_d"])
        for i in range(16, 25):                   # the crown region (40-60% of the span); the deck's shape clears the rest
            x = span * i / 40
            if max(z_on(A, x), z_on(B, x)) + top_off > pl._fam(s0 + (s1 - s0) * i / 40) - build - 0.02:
                return False
        return True
    lo, hi = 0.8, max(1.0, pl.prof["Hc"] - pl.z_spring)
    for _ in range(30):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if ok(m) else (lo, m)
    pl.rise = lo
    pl.A, pl.B, pl._z_on = _arch_nodes(span, pl.z_spring, lo, P["rib_d"], P["cross_d"])
    pl.arch_top = lambda x: max(pl._z_on(pl.A, x), pl._z_on(pl.B, x)) + top_off


QS = (1.0, 1.25, 1.5, 1.75, 2.0, 2.5)


def _constrained(pl, lim):
    """The family shape closest to the mapped heights (least squares) among those that clear the arch everywhere
    (the deck's build-up over its top) and stay within the walk limit: for each shape the crown is the least-squares
    height, raised if the arch's shoulders need it. None if no shape is walkable at this length."""
    P = pl.P
    z0, z1 = pl.z_foot
    L = pl.L
    s0, s1 = pl.s_a
    build = P["deck_depth"] + P["beam_h"] + 0.02
    mid = (s0 + s1) / 2
    span = s1 - s0
    S = [i * 0.1 for i in range(int(L / 0.1) + 1)]
    need = [(s, pl.arch_top((s - s0) * pl.span / (s1 - s0)) + build) for s in S if s0 < s < s1]
    H_top = max((H for _, H in pl.samples), default=P["crown_h"])
    best = None
    for s_c in [mid + span * f for f in (-0.05, -0.025, 0, 0.025, 0.05)]:   # the crown over the arch's middle
        for q0 in QS:
            for q1 in QS:
                def g(s):
                    return _profile_family(s, s_c, L, 0, 0, 1, q0, q1)

                def base(s):
                    return _profile_family(s, s_c, L, z0, z1, 0, q0, q1)
                if pl.samples:
                    num = sum((H - base(s)) * g(s) for s, H in pl.samples)
                    den = sum(g(s) ** 2 for s, H in pl.samples)
                    Hc = num / den if den else P["crown_h"]
                else:
                    Hc = P["crown_h"]
                if pl.samples:                   # keep the painted crown: ramps are extended rather than the crown lowered
                    Hc = max(Hc, H_top - 0.15)
                Hc = max(Hc, max(((zn - base(s)) / g(s) for s, zn in need if g(s) > 1e-3), default=Hc))
                if Hc > 8.0 or (pl.samples and Hc > H_top + 0.8):
                    continue
                zs = [_profile_family(s, s_c, L, z0, z1, Hc, q0, q1) for s in S]
                slope = max(abs(b_ - a_) / 0.1 for a_, b_ in zip(zs, zs[1:]))
                if slope > lim:
                    continue
                err = sum((_profile_family(s, s_c, L, z0, z1, Hc, q0, q1) - H) ** 2 for s, H in pl.samples)
                if not pl.samples:
                    err = abs(s_c - mid) + 0.01 * (abs(q0 - 1.25) + abs(q1 - 1.25))
                if best is None or err < best[0]:
                    best = (err, dict(s_c=s_c, Hc=Hc, q0=q0, q1=q1))
    return best


def _shape(pl):
    """Fit the deck's family to the mapped heights, size the arch under that crown, then choose the deck shape that
    is closest to the mapped heights while clearing the arch everywhere and staying walkable; when no shape is
    walkable, extend the steeper ramp along its end (a recorded choice) and try again."""
    P = pl.P
    lim = math.tan(math.radians(P["max_slope_deg"]))
    ext = [0.0, 0.0]
    rms0 = _fit_profile(pl)                 # unconstrained: the mapped crown sizes the arch
    Hc0 = pl.prof["Hc"]
    _arch(pl)
    for _ in range(60):
        best = _constrained(pl, lim)
        if best:
            break
        # no walkable shape at this length: lengthen the shorter ramp (measured from its springing), both if equal
        r0, r1 = pl.s_a[0], pl.L - pl.s_a[1]
        for side in ((0,) if r0 < r1 - 0.25 else (1,) if r1 < r0 - 0.25 else (0, 1)):
            _extend(pl, side, 0.5)
            ext[side] += 0.5
    if not best:
        raise RuntimeError("no walkable deck over this arch: lower max_slope_deg or check the mapped feet")
    pl.prof = best[1]
    pr, z0, z1 = pl.prof, pl.z_foot[0], pl.z_foot[1]
    pl._z = lambda s: _profile_family(s, pr["s_c"], pl.L, z0, z1, pr["Hc"], pr["q0"], pr["q1"])
    if pl.samples:
        rms = math.sqrt(best[0] / len(pl.samples))
        pl.notes.append(f"deck profile: crown {pr['Hc']:.2f} m at s {pr['s_c']:.2f}, shape q {pr['q0']}/{pr['q1']}, rms {rms:.2f} m "
                        f"against the mapped heights (unconstrained fit: crown {Hc0:.2f} m, rms {rms0:.2f} m)")
    else:
        pl.notes.append(f"choice: deck crown {pr['Hc']:.2f} m at mid-span (no mapped heights; DEFAULTS {P['crown_h']} m)")
    for i in (0, 1):
        if ext[i]:
            pl.notes.append(f"choice: the {'south' if i == 0 else 'north'} ramp extended {ext[i]:.1f} m past the mapped foot "
                            f"along its end, so the deck stays within {P['max_slope_deg']} deg")
    pl.max_slope_deg = math.degrees(math.atan(max(abs(pl.slope(i * 0.1)) for i in range(int(pl.L / 0.1) + 1))))
    # clearance: the beams' undersides above the water, at the crown and over the middle 40% (the boat's cabin)
    span = pl.span

    def soffit(x):
        return min(pl._z_on(pl.A, x), pl._z_on(pl.B, x)) - P["rib_d"] / 2 - pl.water_H
    pl.clear = min(soffit(span * (0.3 + 0.4 * i / 20)) for i in range(21))
    pl.clear_crown = soffit(span / 2)
    pl.notes.append(f"arch: span {span:.2f} m, rise {pl.rise:.2f} m (beam centre line), soffit {pl.clear_crown:.2f} m above "
                    f"the water at the crown, {pl.clear:.2f} m over the middle 40%")
    if pl.clear < P["min_clear"]:
        pl.notes.append(f"WARNING: soffit {pl.clear:.2f} m above the water over the middle 40%, less than {P['min_clear']} m "
                        f"for the big boat")


# ---------------------------------------------------------------- the deck height, exposed


class Bridge:
    """What build() returns: the plan, its triangles, and the deck height as a function and a table."""

    def __init__(self, plan, tris=0):
        self.plan = plan
        self.tris = tris
        self.parts = {}

    def station(self, X, D):
        return _proj([(i * self.plan.ds, p) for i, p in enumerate(self.plan.C)], (X, D))

    def deck_H(self, X, D):
        """The deck top at a world point, or None if the point is off the deck (outside its width or its feet)."""
        s, off = self.station(X, D)
        pl = self.plan
        if s < -0.3 or s > pl.L + 0.3 or not (-pl.wr(s) - 0.1 <= off <= pl.wl(s) + 0.1):
            return None
        return round(pl.Z(s), 3)

    def table(self, step=0.5):
        """[{s, X, D, H, slope_deg, u_near, u_far, near: [X, D], far: [X, D]}] from foot to foot."""
        pl = self.plan
        out = []
        n = int(pl.L / step)
        for i in range(n + 1):
            s = min(pl.L, i * step)
            c = pl.C2(s)
            H = pl.Z(s)
            pn, pf = pl.pt(s, -pl.wr(s)), pl.pt(s, pl.wl(s))
            un = pl.frame.to_scan(pn[0], pn[1], H)
            uf = pl.frame.to_scan(pf[0], pf[1], H)
            out.append(dict(s=round(s, 2), X=round(c[0], 3), D=round(c[1], 3), H=round(H, 3),
                            slope_deg=round(math.degrees(math.atan(pl.slope(s))), 1),
                            near=[round(pn[0], 3), round(pn[1], 3)], far=[round(pf[0], 3), round(pf[1], 3)],
                            u_near=round(un[0], 1), v_near=round(un[1], 1), u_far=round(uf[0], 1), v_far=round(uf[1], 1)))
        return out

    def h_profile(self, every_px=100):
        """[u, H] along the near (painted) deck edge, increasing u, about every `every_px` of u: the built deck as
        the frame's `bridge deck` H_profile, so the map and the build agree."""
        rows = self.table(0.1)
        out, last = [], None
        for r in rows:
            if last is None or r["u_near"] - last >= every_px or r is rows[-1]:
                if out and r["u_near"] <= out[-1][0]:
                    continue
                out.append([round(r["u_near"]), round(r["H"], 2)])
                last = r["u_near"]
        return out

    def check_profile(self, pairs=None):
        """The map's [u, H] pairs (default: the frame's bridge deck H_profile) against the built deck at the same
        place on the near edge: rows {u, H_map, H_built, diff}, plus the worst difference."""
        pl = self.plan
        pairs = pairs if pairs is not None else (pl.frame.h_profile() or [])
        rows = []
        for u, H_map in sorted(pairs):
            m = _samples_from_profile(pl, [[u, H_map]])
            if not m:
                rows.append(dict(u=u, H_map=H_map, H_built=None, diff=None, why="off the bridge's u range"))
                continue
            s = m[0][0]
            rows.append(dict(u=u, s=round(s, 2), H_map=H_map, H_built=round(pl.Z(s), 2), diff=round(pl.Z(s) - H_map, 2)))
        worst = max((abs(r["diff"]) for r in rows if r["diff"] is not None), default=0.0)
        return dict(rows=rows, worst=worst)

    def on_deck(self, u, v, iters=40):
        """A point painted on the deck (a figure's foot at scan u, v) -> (X, D, H) on the built deck: H and the depth
        it implies are solved together (1 m of H moves a point 1.5 m in depth, and the deck's height changes along
        the bridge), so figures at the far railing get the far railing's height, not the near edge's."""
        pl = self.plan
        H = pl.prof["Hc"]
        for _ in range(iters):
            X, D = pl.frame.to_world(u, v, H)
            s, _ = self.station(X, D)
            H = 0.5 * H + 0.5 * pl.Z(s)
        X, D = pl.frame.to_world(u, v, H)
        return round(X, 3), round(D, 3), round(H, 3)

    def clearance(self, n=21):
        """Soffit (the beams' undersides) above the water along the span: [(s, X, D, metres)]."""
        pl = self.plan
        out = []
        for i in range(n):
            x = pl.span * i / (n - 1)
            s = pl.s_a[0] + (pl.s_a[1] - pl.s_a[0]) * i / (n - 1)
            z = min(pl._z_on(pl.A, x), pl._z_on(pl.B, x)) - pl.P["rib_d"] / 2
            c = pl.C2(s)
            out.append((round(s, 2), round(c[0], 2), round(c[1], 2), round(z - pl.water_H, 2)))
        return out

    def summary(self):
        pl = self.plan
        return dict(length_m=round(pl.L, 2), span_m=round(pl.span, 2), rise_m=round(pl.rise, 2),
                    crown_H=round(pl.prof["Hc"], 2), crown_s=round(pl.prof["s_c"], 2), springings_s=[round(s, 2) for s in pl.s_a],
                    width_m=[round(pl.wl(pl.L / 2) + pl.wr(pl.L / 2), 2)], max_slope_deg=round(pl.max_slope_deg, 1),
                    soffit_above_water_m=dict(crown=round(pl.clear_crown, 2), middle_40pct=round(pl.clear, 2)), triangles=self.tris,
                    parts=self.parts, notes=pl.notes)


# ---------------------------------------------------------------- the build (Blender)



def _v3(p2, z):
    return V((p2[0], p2[1], z))


def _hexa(mat, collide, bot, top, rng=None, along=None):
    """A six-faced piece from 4 bottom and 4 top corners (counter-clockwise from above)."""
    verts = [V(p) for p in bot] + [V(p) for p in top]
    faces = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    if rng is not None:
        k.add(mat, collide, verts, faces, k._piece_uvs(verts, faces, mat, rng, along))
    else:
        k.add(mat, collide, verts, faces)


def _sweep(mat, collide, frames, ring, caps=True, tile=None):
    """Extrude a section `ring` [(side, up)] (counter-clockwise looking along the path) through frames
    [(point, side_vec, up_vec)], with explicit UVs: u along the path, v around the section (grain along the member)."""
    n, m = len(ring), len(frames)
    verts = []
    for p, sd, up in frames:
        verts += [p + sd * a + up * b for a, b in ring]
    faces, uvs = [], []
    tile = tile or sb.MATERIALS[mat][1]
    acc = [0.0]
    for (p0, _, _), (p1, _, _) in zip(frames, frames[1:]):
        acc.append(acc[-1] + (p1 - p0).length)
    per = [0.0]
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        per.append(per[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    for j in range(m - 1):
        for i in range(n):
            i2 = (i + 1) % n
            faces.append((j * n + i, j * n + i2, (j + 1) * n + i2, (j + 1) * n + i))
            uvs.append([(acc[j] / tile, per[i] / tile), (acc[j] / tile, per[i + 1] / tile),
                        (acc[j + 1] / tile, per[i + 1] / tile), (acc[j + 1] / tile, per[i] / tile)])
    if caps:
        faces.append(tuple(reversed(range(n))))
        faces.append(tuple(range((m - 1) * n, m * n)))
        uvs.append([(ring[i][0] / tile, ring[i][1] / tile) for i in reversed(range(n))])
        uvs.append([(ring[i][0] / tile, ring[i][1] / tile) for i in range(n)])
    k.add(mat, collide, verts, faces, uvs)


def _ring_box(w, h, c=0.0, top_only=False):
    """A w x h section centred on the path, chamfer c on all four long edges (or the two top ones)."""
    hw, hh = w / 2, h / 2
    if c <= 0:
        return [(hw, -hh), (hw, hh), (-hw, hh), (-hw, -hh)]
    if top_only:
        return [(hw, -hh), (hw, hh - c), (hw - c, hh), (-hw + c, hh), (-hw, hh - c), (-hw, -hh)]
    return [(hw, -hh + c), (hw, hh - c), (hw - c, hh), (-hw + c, hh), (-hw, hh - c), (-hw, -hh + c), (-hw + c, -hh), (hw - c, -hh)]


class _Builder:
    def __init__(self, pl, rng):
        self.pl, self.P, self.rng = pl, pl.P, rng

    # frames along the deck ---------------------------------------------------
    def deck_frames(self, off, dz, s0=None, s1=None, step=0.5, plumb=False):
        """[(point, side, up)] along the deck at `off` (+ left) and `dz` above the deck top. plumb: up = Z (posts,
        walls); otherwise up is normal to the deck's slope (rails, fascia)."""
        pl = self.pl
        s0 = 0.0 if s0 is None else s0
        s1 = pl.L if s1 is None else s1
        n = max(1, math.ceil((s1 - s0) / step))
        out = []
        for i in range(n + 1):
            s = s0 + (s1 - s0) * i / n
            p2 = pl.pt(s, off)
            t2, n2 = pl.T(s), pl.N(s)
            g = pl.slope(s)
            T3 = V((t2[0], t2[1], g)).normalized()
            side = V((n2[0], n2[1], 0))
            up = V((0, 0, 1)) if plumb else T3.cross(side).normalized()
            out.append((_v3(p2, pl.Z(s) + dz), side, up))
        return out

    # ---------------------------------------------------------------- the deck
    def boards(self):
        """Boards laid across the deck, two per row with a staggered butt joint, ragged ends. Where the deck is
        steeper than step_from_deg they are level treads (steps), each closing down to the tread below."""
        pl, P, rng = self.pl, self.P, self.rng
        lim = math.tan(math.radians(P["step_from_deg"]))
        s = 0.0
        row = 0
        while s < pl.L - 0.05:
            bw = min(rng.uniform(*P["board_w"]), pl.L - s)
            a, b = s + 0.006, s + bw - 0.006
            sm = (a + b) / 2
            stepped = abs(pl.slope(sm)) > lim
            wl, wr = pl.wl(sm) + 0.06, pl.wr(sm) + 0.06
            joint = (0.6 if row % 2 else -0.6) * rng.uniform(0.6, 1.4) + rng.uniform(-0.3, 0.3)
            for o0, o1 in ((-wr + rng.uniform(-0.04, 0.02), joint - 0.006), (joint + 0.006, wl + rng.uniform(-0.02, 0.04))):
                corners = []
                for ss, oo in ((a, o0), (b, o0), (b, o1), (a, o1)):
                    corners.append(pl.pt(ss, oo))
                if stepped:
                    zt = pl.Z(sm) + rng.uniform(-0.006, 0.006)
                    zb = max(min(pl.Z(a), pl.Z(b)) - P["board_t"] - 0.02, pl.Z(sm) - P["deck_depth"] + 0.01)
                    top = [_v3(c, zt) for c in corners]
                    bot = [_v3(c, zb) for c in corners]
                else:
                    dz = rng.uniform(-0.008, 0.006)
                    top = [_v3(c, pl.Z(ss) + dz) for c, ss in zip(corners, (a, b, b, a))]
                    bot = [q - V((0, 0, P["board_t"])) for q in top]
                if (top[1] - top[0]).cross(top[3] - top[0]).z < 0:
                    top, bot = top[::-1], bot[::-1]
                t2 = pl.N(sm)
                _hexa("deck", False, bot, top, rng, along=(t2[0], t2[1]))
            s += bw
            row += 1

    def deck_body(self):
        """Under the boards: a plain underside slab (seen from below only), the centre stringer and the two fascia
        beams along the edges (the painted narrow band between the arch band and the railing)."""
        pl, P = self.pl, self.P
        bt = P["board_t"]
        # underside slab, one strip (large faces stay flat)
        fr_l = self.deck_frames(0.0, -P["deck_depth"], step=0.5)   # below the deepest tread (the steps' risers)
        verts, faces = [], []
        for i, (p, sd, up) in enumerate(fr_l):
            s = pl.L * i / (len(fr_l) - 1)
            verts += [p + sd * (pl.wl(s) - 0.05), p - sd * (pl.wr(s) - 0.05)]
        for i in range(len(fr_l) - 1):
            faces.append((2 * i + 1, 2 * i + 3, 2 * i + 2, 2 * i))
        k.add("timber", False, verts, faces)
        # the centre stringer
        _sweep("timber", False, self.deck_frames(0.0, -P["deck_depth"] - 0.11, step=0.6), _ring_box(0.22, 0.22, 0.0))
        # fascia beams, chamfered on the outside
        for sgn, wf in ((1, pl.wl), (-1, pl.wr)):
            frames = []
            for p, sd, up in self.deck_frames(0.0, -P["fascia_h"] / 2 + 0.02, step=0.7):
                frames.append((p, sd, up))
            fr2 = []
            for i, (p, sd, up) in enumerate(frames):
                s = pl.L * i / (len(frames) - 1)
                fr2.append((p + sd * sgn * (wf(s) + 0.02), sd * sgn, up))
            _sweep("timber", False, fr2, _ring_box(P["fascia_w"], P["fascia_h"], 0.035, top_only=True))

    # ---------------------------------------------------------------- railings
    def railings(self):
        """Both railings, as painted: posts with caps, a top rail, a mid rail with a slat above it, a bottom rail, and
        an X brace in each bay below the mid rail; at each end a taller end post (望柱) with a pointed cap."""
        pl, P = self.pl, self.P
        h = P["rail_h"]
        n = max(2, round(pl.L / P["rail_bay"]))
        for sgn, wf in ((1, pl.wl), (-1, pl.wr)):
            def at(s, dz):
                return _v3(pl.pt(s, sgn * wf(s)), pl.Z(s) + dz)
            stations = [pl.L * i / n for i in range(n + 1)]
            for i, s in enumerate(stations):
                base = at(s, -0.12)
                if i in (0, n):
                    self.end_post(base, P["end_post_h"] + 0.12)
                    continue
                k.post("timber", False, base.x, base.y, base.z, base.z + h + 0.17, 0.13, 0.02)
                k.bx("timber", False, (base.x - 0.09, base.y - 0.09, base.z + h + 0.17), (base.x + 0.09, base.y + 0.09, base.z + h + 0.24))
            for dz, ring in ((h, _ring_box(0.11, 0.10, 0.02)), (h * 0.55, _ring_box(0.07, 0.06)),
                             (h * 0.78, _ring_box(0.05, 0.045)), (h * 0.12, _ring_box(0.08, 0.06))):
                fr = self.deck_frames(0.0, dz, step=0.8)
                fr2 = []
                m = len(fr) - 1
                for i, (p, sd, up) in enumerate(fr):
                    s = pl.L * i / m
                    fr2.append((p + sd * sgn * wf(s), sd, up))
                _sweep("timber", False, fr2, ring)
            for s0, s1 in zip(stations, stations[1:]):
                a0, a1 = s0 + 0.08, s1 - 0.08
                for (sa, za), (sb_, zb) in (((a0, 0.14 * h), (a1, 0.53 * h)), ((a0, 0.53 * h), (a1, 0.14 * h))):
                    k.beam("timber", False, at(sa, za), at(sb_, zb), 0.06, 0.05, 0)

    def end_post(self, base, h):
        """A railing end post (望柱): a square post, a collar, and a pointed (lotus-bud) cap."""
        k.post("timber", False, base.x, base.y, base.z, base.z + h, 0.2, 0.03)
        k.bx("timber", False, (base.x - 0.13, base.y - 0.13, base.z + h), (base.x + 0.13, base.y + 0.13, base.z + h + 0.07))
        sb.lathe("timber", False, (base.x, base.y, base.z + h + 0.07), [(0.11, 0), (0.12, 0.08), (0.08, 0.2), (0.0, 0.32)], segs=8)

    # ---------------------------------------------------------------- the arch
    def arch(self):
        """The woven arch between the springings: rib lines across the width alternating system A (三节苗: 3 beams,
        a level middle one) and system B (四节苗: 4 beams, peaked at the crown); a cross beam (横木) at every node
        of each system, lying over the other system's beams and lashed to them (the weave), running past the outer
        ribs to carved end caps; iron bands where a system's own beams meet at its node; a sill at each springing."""
        pl, P, rng = self.pl, self.P, self.rng
        s0, s1 = pl.s_a
        a0 = pl.C2(s0)
        ax = pl.arch_dir
        nx = _left(ax)
        W = (pl.wl((s0 + s1) / 2) + pl.wr((s0 + s1) / 2)) + 0.1
        r, rc = P["rib_d"] / 2, P["cross_d"] / 2
        nrib = P["ribs"]
        ys = [-W / 2 + r + i * (W - 2 * r) / (nrib - 1) for i in range(nrib)]

        def Wp(x, y, z):
            p = _add(_add(a0, _mul(ax, x)), _mul(nx, y))
            return V((p[0], p[1], z))
        systems = {"A": pl.A, "B": pl.B}
        for i, y in enumerate(ys):
            nodes = systems["A" if i % 2 == 0 else "B"]
            for j, ((x0, z0), (x1, z1)) in enumerate(zip(nodes, nodes[1:])):
                d = V((x1 - x0, 0, z1 - z0)).normalized()
                e0 = 0.1 if j == 0 else 0.22
                e1 = 0.1 if j == len(nodes) - 2 else 0.22
                jy = rng.uniform(-0.02, 0.02)
                p0 = Wp(x0 - d.x * e0, y + jy, z0 - d.z * e0)
                p1 = Wp(x1 + d.x * e1, y + jy, z1 + d.z * e1)
                k.beam("timber", False, p0, p1, P["rib_d"], P["rib_d"] * 0.96, P["rib_d"] * 0.2)
        # the outer faces as painted: one smooth band each side (the scroll draws the arch's face as an even curved band
        # with the node blocks on it), a facing timber on the outer ribs from springing to springing, its top just
        # under the level middle beam of system A at the crown
        zA = pl.A[1][1]
        fb = zA + 0.05 - pl.z_spring
        Rb = (pl.span ** 2 / 4 + fb ** 2) / (2 * fb)
        zcb = pl.z_spring + fb - Rb
        for sgn in (-1, 1):
            frames = []
            nseg = 40
            for i in range(nseg + 1):
                x = 0.25 + (pl.span - 0.5) * i / nseg
                z = zcb + math.sqrt(max(0.0, Rb ** 2 - (x - pl.span / 2) ** 2))
                dzdx = -(x - pl.span / 2) / max(1e-6, z - zcb)
                tng = V((ax[0], ax[1], dzdx)).normalized()
                side = V((nx[0], nx[1], 0)) * sgn
                up = tng.cross(side).normalized() * sgn
                frames.append((Wp(x, sgn * (W / 2 + 0.07), z - 0.05), side, up))
            _sweep("timber", False, frames, _ring_box(0.12, 0.46, 0.03, top_only=True))
        # cross beams at the nodes (both springings share a sill)
        L_cb = W + 2 * P["cross_over"]
        cross = [(0.0, pl.z_spring, None)] + [(x, z, "A") for x, z in pl.A[1:-1]] + [(x, z, "B") for x, z in pl.B[1:-1]] + [(pl.span, pl.z_spring, None)]
        for x, z, sysn in cross:
            zc = z if sysn else z - r - rc + 0.06       # the sills lie under the beams' feet
            p0, p1 = Wp(x, -L_cb / 2, zc), Wp(x, L_cb / 2, zc)
            k.beam("timber", False, p0, p1, P["cross_d"], P["cross_d"], P["cross_d"] * 0.18)
            for q, sgn in ((p0, -1), (p1, 1)):
                self.node_cap(q, V((nx[0], nx[1], 0)) * sgn)
            if not sysn:
                continue
            other = "B" if sysn == "A" else "A"
            for i, y in enumerate(ys):
                own = (i % 2 == 0) == (sysn == "A")
                if own:
                    # an iron band round the two beam ends meeting here
                    c = Wp(x, y, z)
                    sb.cyl("lattice", False, c - V((ax[0], ax[1], 0)) * 0.2, c - V((ax[0], ax[1], 0)) * 0.12, r + 0.025, segs=8, caps=False)
                    sb.cyl("lattice", False, c + V((ax[0], ax[1], 0)) * 0.12, c + V((ax[0], ax[1], 0)) * 0.2, r + 0.025, segs=8, caps=False)
                else:
                    # a rope lashing binds the other system's beam under the cross beam
                    # a dark lashing band binds the other system's beam where the cross beam crosses it
                    zo = pl._z_on(systems[other], x)
                    c = Wp(x, y, zo)
                    sb.cyl("lattice", False, c - V((ax[0], ax[1], 0)) * 0.11, c + V((ax[0], ax[1], 0)) * 0.11, r + 0.025, segs=8, caps=False)

    def node_cap(self, p, out):
        """The carved cap on a cross beam's end (the painted node blocks at u 19010, 19105, 19600, 19865)."""
        P = self.P
        d = P["cross_d"]
        k.beam("timber", False, p, p + out * 0.16, d * 1.3, d * 1.3, d * 0.3)
        sb.cyl("timber", False, p + out * 0.16, p + out * 0.24, d * 0.42, d * 0.22, segs=8)

    def deck_supports(self):
        """Floor beams across under the boards, every ~1.4 m over the span; where the deck stands above the arch
        (toward the springings), posts (立柱) from the arch's outer and middle beams up to them, as painted near the
        south foot."""
        pl, P = self.pl, self.P
        s0, s1 = pl.s_a
        a0 = pl.C2(s0)
        ax = pl.arch_dir
        n = max(2, round((s1 - s0) / 1.4))
        bt, bh = P["board_t"], P["beam_h"]
        r = P["rib_d"] / 2
        W = pl.wl((s0 + s1) / 2) + pl.wr((s0 + s1) / 2) + 0.1
        for i in range(n + 1):
            s = s0 + (s1 - s0) * i / n
            zt = pl.Z(s) - P["deck_depth"]           # the floor beams' top, under the board layer
            wl, wr = pl.wl(s), pl.wr(s)
            c = pl.C2(s)
            nn = pl.N(s)
            p0 = _v3(_add(c, _mul(nn, -wr - 0.1)), zt - bh / 2)
            p1 = _v3(_add(c, _mul(nn, wl + 0.1)), zt - bh / 2)
            k.beam("timber", False, p0, p1, 0.2, bh, 0.03)
            x = _dot(_sub(c, a0), ax)
            if 0.15 < x < pl.span - 0.15:
                za = max(pl._z_on(pl.A, x), pl._z_on(pl.B, x)) + r
                gap = (zt - bh) - za
                if gap > 0.12:
                    for o in (-wr + 0.35, 0.0, wl - 0.35):
                        q = _add(c, _mul(nn, o))
                        k.post("timber", False, q[0], q[1], za - 0.05, zt - bh + 0.01, 0.2, 0.03)

    # ---------------------------------------------------------------- abutments and ramps
    def abutments(self):
        """A stone abutment behind each springing (hidden in the painting: choice), a ledge carrying the sill, and
        the ramps from there to the feet: a timber skirt under each deck edge (vertical boards, posts and X braces,
        like the railing above it) down to the ground."""
        pl, P, rng = self.pl, self.P, self.rng
        wa = max(pl.wl(pl.L / 2), pl.wr(pl.L / 2)) + 0.45
        for end, s_face, sgn in ((0, pl.s_a[0], -1), (1, pl.s_a[1], 1)):
            sback = s_face + sgn * P["abut_depth"]
            z_top = min(pl.Z(s_face), pl.Z(sback)) - P["board_t"] - 0.2
            zb = pl.water_H - 0.12                   # below that the water hides it
            c_face = pl.C2(s_face - sgn * 0.0)
            t = pl.T(s_face)
            nn = _left(t)
            # the river face across the width, then the two returns along the deck
            fa = _add(_add(c_face, _mul(nn, -wa)), _mul(t, sgn * 0.25))
            fb = _add(_add(c_face, _mul(nn, wa)), _mul(t, sgn * 0.25))
            self.masonry(fa, fb, zb, z_top)
            for side in (-1, 1):
                ra = _add(_add(c_face, _mul(nn, side * (wa - 0.25))), _mul(t, sgn * 0.5))
                rb = _add(_add(c_face, _mul(nn, side * (wa - 0.25))), _mul(t, sgn * (P["abut_depth"] - 0.1)))
                self.masonry(ra, rb, zb, min(z_top, max(pl.Z(sback) - 0.5, 0.25)))
            # the stone ledge under the sill
            la = _add(_add(c_face, _mul(nn, -wa + 0.15)), _mul(t, sgn * -0.05))
            lb = _add(_add(c_face, _mul(nn, wa - 0.15)), _mul(t, sgn * -0.05))
            k.stone_run("stone", False, la, lb, pl.z_spring - 0.55, pl.z_spring - 0.36, 0.6, rng, lmin=0.9, lmax=1.6, seg=1.2)
            # the transverse face above the masonry, up to the deck: vertical boards across the width
            zf0 = z_top
            for i in range(int(2 * wa / 0.3)):
                o0 = -wa + 0.3 * i + 0.006
                o1 = o0 + 0.3 - 0.012
                q0 = _add(_add(c_face, _mul(nn, o0)), _mul(t, sgn * 0.2))
                q1 = _add(_add(c_face, _mul(nn, o1)), _mul(t, sgn * 0.2))
                ztop = pl.Z(s_face + sgn * 0.2) - P["board_t"] - 0.05
                if ztop > zf0 + 0.05:
                    sb.quad("timber", False, _v3(q0, zf0), _v3(q1, zf0), _v3(q1, ztop), _v3(q0, ztop))
        # the skirts along the ramps, from each foot to the abutment's face
        for s_a, s_b in ((0.0, pl.s_a[0]), (pl.s_a[1], pl.L)):
            for sgn, wf in ((1, pl.wl), (-1, pl.wr)):
                self.skirt(s_a, s_b, sgn, wf)

    def masonry(self, p0, p1, z0, z1):
        """Coursed stone (song_kit.stone_run courses of big blocks, each its own length): only the top course has
        eased edges, the others' tops are hidden under the next course, so they skip the inset ring (half the
        triangles)."""
        rng = self.rng
        z = z0
        while z < z1 - 0.05:
            h = rng.uniform(0.5, 0.72)
            if z1 - (z + h) < 0.3:
                h = z1 - z
            top = z + h >= z1 - 1e-6
            k.stone_run("stone", False, p0, p1, z, z + h, 0.5, rng, lmin=1.0, lmax=1.9, r=0.06, seg=2.5,
                        ease=None if top else 0, jz=0.0 if top else 0.006)
            z += h

    def skirt(self, s_a, s_b, sgn, wf):
        pl, P, rng = self.pl, self.P, self.rng

        def zt(s):
            return pl.Z(s) - P["board_t"] - P["fascia_h"] + 0.04

        def q(s, o=0.0):
            return pl.pt(s, sgn * (wf(s) + o))
        # vertical boards (each its own quad: the joints draw the ink)
        s = s_a
        while s < s_b - 0.05:
            w = min(rng.uniform(0.26, 0.34), s_b - s)
            a, b = s + 0.006, s + w - 0.006
            za, zb_ = zt(a), zt(b)
            g = min(pl.z_foot) - 0.15
            if max(za, zb_) > g + 0.08:
                pa, pb = q(a, 0.0), q(b, 0.0)
                sb.quad("timber", False, _v3(pa, g), _v3(pb, g), _v3(pb, max(zb_, g)), _v3(pa, max(za, g)))
            s += w
        # posts every bay and an X brace in each, standing proud of the boards
        n = max(1, round((s_b - s_a) / P["rail_bay"]))
        st = [s_a + (s_b - s_a) * i / n for i in range(n + 1)]
        g = min(pl.z_foot) - 0.1
        for s in st:
            if zt(s) - g < 0.25:
                continue
            p = q(s, 0.06)
            k.post("timber", False, p[0], p[1], g, zt(s), 0.15, 0.025)
        for a, b in zip(st, st[1:]):
            za, zb_ = zt(a + 0.1), zt(b - 0.1)
            if min(za, zb_) - g < 0.6:
                continue
            pa, pb = q(a + 0.1, 0.07), q(b - 0.1, 0.07)
            k.beam("timber", False, _v3(pa, g + 0.12), _v3(pb, zb_ - 0.08), 0.07, 0.06, 0)
            k.beam("timber", False, _v3(pa, za - 0.08), _v3(pb, g + 0.12), 0.07, 0.06, 0)
        # a sill along the ground
        sa_, sb2 = q(s_a, 0.06), q(s_b, 0.06)
        k.beam("timber", False, _v3(sa_, g + 0.06), _v3(sb2, g + 0.06), 0.16, 0.14, 0.02)

    # ---------------------------------------------------------------- the tall end posts (表木)
    def tall_posts(self, posts=None):
        """Each mapped end pole: a stone footing, a round pole tapering to the top, and two boards crossed in an X
        near its top in the vertical plane facing south (the painted silhouette at u 19010 and 20040)."""
        P, rng = self.P, self.rng
        for q in (self.pl.posts if posts is None else posts):
            x, y, z = q["X"], q["D"], q["H"]
            h = P["post_h"]                     # real size; the mapped height is painted smaller (notes)
            k.soft_box("stone", False, (x - 0.38, y - 0.38, z - 0.08), (x + 0.38, y + 0.38, z + 0.3), rng, r=0.06, wob=0.01, seg=1.0)
            sb.cyl("timber", True, (x, y, z + 0.3), (x + rng.uniform(-0.04, 0.04), y + rng.uniform(-0.04, 0.04), z + h),
                   P["post_d"] / 2, P["post_d"] * 0.4, segs=10)
            zc = z + h - 0.75
            arm = P["post_arm"] / 2
            for sgn in (1, -1):
                a = V((x - arm, y - 0.09, zc - sgn * arm * 0.45))
                b = V((x + arm, y - 0.09, zc + sgn * arm * 0.45))
                k.beam("timber", False, a, b, 0.07, 0.2, 0.02)
            k.bx("timber", False, (x - 0.12, y - 0.12, z + h - 0.02), (x + 0.12, y + 0.12, z + h + 0.1))

    # ---------------------------------------------------------------- what the walker collides with
    def colliders(self):
        """Hidden, smooth: the walking surface follows Z(s) across the deck (no stair-step snags on the treads) and
        runs 0.6 m past each foot into the ground; walls along both railings (Z - 0.3 .. Z + 1.25); under each ramp
        the skirt line as a wall from the ground up, and each abutment's river face, so nobody walks under a ramp."""
        pl = self.pl
        ss = [-0.6] + [pl.L * i / max(2, round(pl.L / 0.4)) for i in range(max(2, round(pl.L / 0.4)) + 1)] + [pl.L + 0.6]
        verts, faces = [], []
        for s in ss:
            verts += [_v3(pl.pt(s, -pl.wr(s)), pl.Z(s)), _v3(pl.pt(s, pl.wl(s)), pl.Z(s))]
        for i in range(len(ss) - 1):
            faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
        k.add("hidden", True, verts, faces)
        for sgn, wf in ((1, pl.wl), (-1, pl.wr)):
            verts, faces = [], []
            s_in = [s for s in ss if 0.0 <= s <= pl.L]
            for s in s_in:
                p = pl.pt(s, sgn * wf(s))
                verts += [_v3(p, pl.Z(s) - 0.3), _v3(p, pl.Z(s) + 1.25)]
            for i in range(len(s_in) - 1):
                faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
            k.add("hidden", True, verts, faces)
            # the skirt walls under the ramps (only where the deck is above head-clearance of the ground)
            for s_a, s_b in ((0.0, pl.s_a[0]), (pl.s_a[1], pl.L)):
                verts, faces = [], []
                s_r = [s for s in s_in if s_a <= s <= s_b]
                g = min(pl.z_foot) - 0.3
                for s in s_r:
                    p = pl.pt(s, sgn * wf(s))
                    verts += [_v3(p, g), _v3(p, pl.Z(s) - 0.3)]
                for i in range(len(s_r) - 1):
                    faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
                if faces:
                    k.add("hidden", True, verts, faces)
        for s_face, sgn in ((pl.s_a[0], -1), (pl.s_a[1], 1)):
            c, nn = pl.C2(s_face), pl.N(s_face)
            wl, wr = pl.wl(s_face) + 0.5, pl.wr(s_face) + 0.5
            a, b = _add(c, _mul(nn, -wr)), _add(c, _mul(nn, wl))
            z0, z1 = pl.water_H - 0.5, pl.Z(s_face) - 0.3
            k.add("hidden", True, [_v3(a, z0), _v3(b, z0), _v3(b, z1), _v3(a, z1)], [(0, 1, 2, 3)])


def build(layout_entity, frame=None, entity_id=ENTITY_ID, params=None):
    """Fit the bridge to its mapped entity (a sections/<folder>/layout.json entity) and the S3 frame
    (map/frames/S3.json: frames + supports), and build it into the current bucket set (street_b1.B), every piece
    inside sb.entity(entity_id). Returns a Bridge (deck height function, tables, triangle count, parts).
    The tall poles come from the entity's pts post_* (part of the bridge), or from params['posts'] =
    [{"id", "X", "D", "H"}]: a pole whose id is a map ID ("S3.prop.bridge_end_post_19026") is built inside its own entity."""
    pl = fit(layout_entity, frame, params)
    rng = random.Random(pl.P["seed"])
    b = _Builder(pl, rng)
    before = sum(sb.B.tris.values())
    parts = {}

    def part(name, fn):
        t0 = sum(sb.B.tris.values())
        fn()
        parts[name] = parts.get(name, 0) + sum(sb.B.tris.values()) - t0
    with sb.entity(entity_id):
        for name, fn in (("boards", b.boards), ("deck body", b.deck_body), ("railings", b.railings), ("arch", b.arch),
                         ("deck supports", b.deck_supports), ("abutments and skirts", b.abutments),
                         ("colliders (hidden)", b.colliders)):
            part(name, fn)
        own = [q for q in pl.posts if "." not in q["id"]]
        part("tall posts", lambda: b.tall_posts(own))
    for q in pl.posts:
        if "." in q["id"]:                     # a pole mapped as its own entity
            with sb.entity(q["id"]):
                part("tall posts", lambda: b.tall_posts([q]))
    br = Bridge(pl, sum(sb.B.tris.values()) - before)
    br.parts = parts
    return br


def plan_only(layout_entity, frame=None, params=None):
    """The fit alone (no Blender): a Bridge whose deck height, table and checks work in python3."""
    return Bridge(fit(layout_entity, frame, params))


if __name__ == "__main__":       # python3 kit_rainbow_bridge.py table <layout.json|entity.json> [<frame.json>]
    if len(sys.argv) < 3 or sys.argv[1] != "table":
        raise SystemExit(__doc__)
    doc = json.load(open(sys.argv[2], encoding="utf-8"))
    ent = doc.get("entities", {}).get(ENTITY_ID, doc) if isinstance(doc, dict) else doc
    fr = json.load(open(sys.argv[3], encoding="utf-8")) if len(sys.argv) > 3 else (doc.get("frames") if isinstance(doc, dict) else None)
    br = plan_only(ent, fr)
    print(json.dumps(dict(summary=br.summary(), h_profile=br.h_profile(), check=br.check_profile(),
                          clearance=br.clearance(), table=br.table(1.0)), indent=1, ensure_ascii=False))
