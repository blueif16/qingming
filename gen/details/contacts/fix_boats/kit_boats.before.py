"""Boat kit: the boats the scroll paints on the 汴河, built from song_kit primitives, the way kit_vehicles serves the
carts. The boat factory's module (round 2). The types and the painted parts they come from: gen/boats/types.md; the
water: gen/boats/water.md.

The user's rules (map/BUILDING.md, "Boats and water", 2026-10-12): every boat at real size for its type, centred on its
painted waterline; boats painted under way move a short way along their heading and back with their crew at work, moored
boats ride the water gently; decks are walkable and carry the player. So a boat is exported as ONE MOVABLE ROOT (see
"Nodes" below) that the page places from layout.json and moves; the same builders can also bake a boat into a static
scene's buckets (`boat()`, sink 'world').

Frames. The scene frame: x = map X (east), y = map D (north), z up, metres. A boat is placed from its map points
(map/README.md, Boats): `front` and `rear` are the waterline under the stem and the sternpost, so it faces rear ->
front; the support `water` gives the river's H. The boat's own frame, in which every part is built: x along the hull
from the sternpost's waterline point (x = 0) to the stem's (x = lw), y to port (left of the heading), z up from the
water surface. Real size, painted place (BUILDING.md rule 5): the hull has its type's real waterline length (TYPES,
`choice:`), centred on the midpoint of the painted ends; the mapped length is only compared (`.note`). A hull that
would overlap its painted neighbour or the bank is shortened by the caller with `lw=` (a recorded choice), never
shrunk in height.

Construction (reference/messenger_study/world_notes.md, the web-scene skill):
- the hull is lofted from stations; each strake is its own band whose lower edge laps 2.5 cm proud of the strake below
  with a 45-degree chamfer, so every plank seam the painter inks is a normal edge for the ink pass; wales, gunwale cap,
  transom boards and the stern gallery give the edges thickness;
- big faces stay flat (deck boards, cabin panels and roof panels are single quads); the triangles go into the framed
  windows, posts and rails, roof-panel joints, rudder, sweep, mast, ropes;
- song_kit's materials only (timber, deck, lattice, interior, reed, rope, bamboo, cloth_*, jar_red, hidden), so the
  page's palette.js gives them their true colours with no change.

Nodes (sink 'nodes', `boat_nodes()` -> `bake_boat()` / `export_boats()`), one root per boat:
    boat:<map id>        root empty at the waterline centre, turned to the heading (its rest pose in the scene);
                         extras: kind, pose, motion ('under_way' | 'moored'), lw, loa, beam, deck_z, roof_z (root frame,
                         z 0 = the water), tris
      body               every static visible part (one mesh, one primitive per material)
      deck__col          hidden walkable deck: deck, stern gallery, a laden boat's cargo mound (low triangle count)
      roof__col          hidden cabin / awning / stern-house blocks, their tops cambered like the roofs (walls stop you)
      rim__col           hidden 1.0 m walls round the deck edge, in 2 m pieces: the page drops the pieces where the boat
                         touches a bank, a stair, a jetty or another walkable boat
      board__edge        hidden ribbon along the gunwale top all round: the boarding edge, for the contact test
      wet__ring          a flat ribbon on the water round the waterline, 0.6 m wide (uv.x 0 at the hull -> 1 outside,
                         uv.y metres round it), material `water_ring`: the page fades it (gen/boats/water.md); the
                         hull's own dark wet band (`wet_hull`) is part of the body
      bow_wave           (boats under way) the water heaped at the bow, the same kind of ribbon over the ring, 1.4 m at
                         the stem; extras anim 'bow_wave': the page shows it only while the boat goes ahead
      sweep | oar_p<i> | oar_s<i> | mast
                         moving parts, each its own node with its pivot at its origin; extras `anim` and its range:
                         sweep yaws about its node's up axis (sculling, amp_deg), oars swing about up and roll about the
                         boat's long axis, the mast turns about the boat's y axis (glTF -Z): rotation 0 = upright, the
                         rest pose = the painted angle. Where they work is where the painted crews stand, on open deck
                         (nothing over them): the sweep's pin on the stern frame (the gallery) at the quarter, its bar
                         over the after deck aft of any house (the tiller unshipped: the sweep steers); the oars at the
                         foredeck of a big boat (rowers abreast), amidships between the thwarts of a small one, never
                         under a cabin, awning or hood
      line_<name>        a rope or plank between two points that may move apart (mast stays, the tow line, mooring
                         lines, the gangplank): unit length along its local +Z (glTF); extras `a`, `b` = the names of
                         its two end points; each frame: position = a, lookAt(b), scale.z = |b - a|. `line_gangplank`
                         is walkable (extras collide)
    points               named points live in their node's extras `points` {name: [x, y, z]} in that node's glTF frame
                         (empty nodes don't survive the web pipeline's prune): on the body pt_deck, pt_roof, pt_bow,
                         pt_stern, pt_tiller, pt_bitt_p/s, pt_haul and the lines' fixed ends; on moving parts
                         pt_masthead (mast), pt_sweep_bar (sweep), pt_oar_* (oars); on the root the world-fixed ends,
                         listed in the root's `world_points` (the page keeps their scene position when the boat moves:
                         the tow line's tracker, a mooring post, the gangplank's foot on the bank)

Crew (people.json `boats`) are placed by the page in the root's frame and move with it; the work points above are where
the painted work happens: the page stands the sweep crew 0.55 m inboard of pt_sweep_bar, spread 0.6 m either way across
the loom, and a rower 0.5 m inboard of his grip; the kit keeps those spots on open deck, inside the hull at both ends
of the sweep's stroke (and says so in `.note` when the open deck is too short for all the rowers asked for).

Detail levels: `lod=0` full; `lod=1` for far boats (fewer stations and strakes, laps only on the top strakes, windows as
dark panels with one bar, every other post, no rungs, battens or dado bars, single-span ropes): about a third of the
triangles (big boats 6.4-6.8k -> 1.7-2.4k).

Entry points:
    boat_nodes(name, front, rear, water_h, kind, **opts)  -> BoatNodes (geometry per node, points, lines, .info)
    boat_from_layout(ent, map_id, sink='nodes'|'world', **opts) -> the same from a layout.json vehicle entity
    bake_boat(bpy, coll, bn) / export_boats(bpy, scene, [bn...], path)
    boat(front, rear, water_h, kind, **opts) -> Boat  (static: into sb.B in scene coordinates, inside sb.entity(id))
    kind_of(map_id, name, what) -> the TYPES key
    water_strip(water_entity, frame, map_id, layout=..., seams=(...)) -> WaterStrip: one reach's flat water between
        its mapped shores at the frame's `water` H (section "the water" below), its shore walls (`edge:shore`) added
        to the active buckets; water_mesh(bpy, [strips], coll=...) -> its one mesh (material `water`, both UV sets);
        water_quad(layout, H) -> the painted area at the water's height. The builder adds strip.tris to placed.json
        owners[<water id>].
    blender/build_boats.py <src_dir> <raw.glb>: a section's boats GLB from its layout (both detail levels), run by
        tools/export_web_scene.mjs (web/public/assets/<name>_boats.glb, <name>/boats.json)

Review (headless, never the live GUI):
    scripts/blender_wsl.sh -b --factory-startup --python qingming/blender/kit_boats.py -- review <out_dir> [names] [lods]
    ... -- export <out_dir> [names] [lods]    one GLB per preset and detail level, plus export_stats.json
"""
import contextlib
import math
import os
import random
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mathutils import Matrix, Vector  # noqa: E402

import song_kit as k  # noqa: E402
import street_b1 as sb  # noqa: E402
import kit_vehicles as kv  # noqa: E402  (shared helpers: _orient, _lathe_axis, _rope, _polybeam, _sweep_rect, plank,
#                                          _quad2, barrel_cover, soft_sack)

V = Vector
UP = V((0, 0, 1))
# the two materials the boat kit adds (flat colours): the hull's wet band at the waterline (dark, wet timber), and the
# pale ring of disturbed water round a hull (the page gives it its own material: gen/boats/water.md)
sb.MATERIALS.setdefault("wet_hull", (None, 1, "#3d342a"))
sb.MATERIALS.setdefault("water_ring", (None, 1, "#c4d0cc"))

# ---------------------------------------------------------------- the types (real size; gen/boats/types.md)
# lw: waterline length, rear to front (the map's points); beam: at the gunwale; free: freeboard amidships (gunwale
# above the water); rise_b / rise_s: the sheer's rise at the bow / stern top above `free`; oh_b / oh_s: how far the
# raked bow / stern transom's top reaches past the waterline end; tw_b / tw_s: the transoms' top half-width as a
# fraction of the half-beam; bb: the bottom's half-width as a fraction of the gunwale's; strakes: plank bands a side;
# drop: the deck below the gunwale; draft: the keel below the water (only the top `vis` is built: the water is opaque).
#
# choice: sizes. The painted hulls against the figures painted on them (figures are drawn about 1.3x life,
# BUILDING.md): S2's passenger boat (u 22420-23720) is 9.0 figure heights long (145 px figures) -> 19 m; the
# high-riding cargo boats of S2's north bank (u 24900-26000) 9-10 -> 20 m; the S4b top boat about 6 and S2's small
# awning boat (u 22280-22720, cut by the silk's edge) 3+ -> 7-12 m; the cabin walls stand 1.2 figure heights (2.0 m);
# the sweep crews push the loom chest-high. Chosen inside the lead's range (big 20-30 m, small 8-12 m): passenger
# 19 m at the waterline (24.6 m over the bow platform, stem post and stern gallery), grain/cargo 20 m (24.5 m), small
# 8 m (9.3 m). Beams in Song inland proportion, about 4.2:1 for the big hulls, 3.5:1 for the small (a hint, not a source).
TYPES = {
    "passenger": dict(lw=19.0, beam=4.5, free=1.1, rise_b=0.95, rise_s=1.6, oh_b=1.5, oh_s=1.8, tw_b=0.36,
                      tw_s=0.62, bb=0.6, strakes=7, drop=0.2, draft=1.0, vis=0.45),
    "grain": dict(lw=20.0, beam=4.9, free=1.25, rise_b=1.0, rise_s=1.35, oh_b=1.5, oh_s=1.7, tw_b=0.52, tw_s=0.64,
                  bb=0.66, strakes=8, drop=0.3, draft=1.2, vis=0.45),
    "small": dict(lw=8.0, beam=2.3, free=0.5, rise_b=0.32, rise_s=0.45, oh_b=0.65, oh_s=0.65, tw_b=0.32, tw_s=0.5,
                  bb=0.55, strakes=4, drop=0.38, draft=0.45, vis=0.3),
}
LADEN_FREE = 0.55   # choice: a deep-laden grain boat's freeboard (万石船, S2 u 27250-28900: the water near the wale)

# poses (map/README.md, Boats) -> motion on the page (BUILDING.md: under way moves, moored rides)
UNDER_WAY = ("rowed", "poled", "towed", "sailing", "drifting", "lowering mast")

# words in a boat's slug -> its type (the last fallback of kind_of); the river agents name boats `boat_<what>_<u>`
KIND_WORDS = [("passenger", ("passenger", "cabin", "客", "luxury", "window")),
              ("grain", ("grain", "cargo", "laden", "漕", "万石", "freight", "hold", "towed", "sweep", "unload")),
              ("small", ("small", "skiff", "sampan", "awning", "mat_boat", "punt", "舢", "小"))]

# Reading a boat's `what` (the mapper's account of the strokes; tools/map_layout.mjs copies it for vehicles), e.g.
# "A smaller boat moored along the river's far bank ...: ... a higher mat-roofed cabin at its east end ...".
# 1. The head, the words before the first boat noun ("A big, broad, deep-laden grain boat", "The big cargo boat",
#    "Only the bow of a small boat"), names the type when the mapper wrote one. Size first: a small boat with a cabin
#    is still small.
# 2. Otherwise the parts painted on it, counted: a cabin, deckhouse, windows or board walls (passenger, the long house
#    of the 客船) against a mat roof, awning or hood, cargo, a hold or hatches, a sweep or a tow (grain, gen/boats/
#    types.md); thwarts or a sculling oar (small). Other boats named in it ("moored between the mat-cargo boat and the
#    big cabin boat", "S4b.veh.boat_long_cabin_14850", "豪华客船's stern") are left out first.
# 3. A tie (or no `what`): the same reading of its name, then the slug's words (KIND_WORDS), then passenger.
_BOAT_NOUN = r"\b(?:boat|skiff|sampan|punt|dinghy|hull|vessel|ship)s?\b"
_HEAD_WORDS = [("small", r"\b(?:small|smaller|little|tiny|skiff|sampan|punt|dinghy)\b|小|舢"),
               ("passenger", r"\bpassenger\b|客"),
               ("grain", r"\b(?:grain|cargo|freight|laden|unloading)\b|漕|万石")]
_PART_WORDS = {
    "passenger": r"\bcabins?\b|\bdeck ?houses?\b|\bhouses?\b|\bwindows?\b|\blattice\b|\bpassengers?\b"
                 r"|\b(?:plank|board)(?:ed)?[- ]walls?\b|\bplank-walled\b",
    "grain": r"\bmat[- ](?:roof|roofed|roofs|cover|covered|covers|awning|awnings|hood|hoods|canopy|shelter)\b"
             r"|\b(?:arched|barrel[- ]shaped|woven)[- ]mat\b(?![- ]cabin)|\bawnings?\b|\bhoops?\b|\bcargo\b|\bbales?\b"
             r"|\bladen\b|\bsacks?\b|\bgrain\b|\bhold\b|\bhatch(?:es)?\b|\bsweeps?\b|\btow(?:ed|line|ing)?\b",
    "small": r"\bthwarts?\b|\bscull(?:ing|ed)?\b|\bfloor ?boards\b",
}
_OTHERS = [r"\b[A-Z]\w*\.[a-z]+\.\w+",                                              # map IDs of other things
           r"\b(?:the|another)\s+(?:[\w'-]+\s+){0,4}?(?:boat|hull|ship)(?:'s(?:\s+[\w-]+){0,2})?",  # "the big cabin boat's bow"
           r"[一-鿿]+"]                                                      # painted boats' names (逆水行舟, 豪华客船)


def _read_kind(text):
    """A boat type from a mapper's text (its `what` or name), or None when it doesn't say (module notes above)."""
    t = (text or "").strip()
    if not t:
        return None
    m = re.search(_BOAT_NOUN, t[:200], re.I)
    head = t[:m.end()] if m else ""
    for kind, pat in _HEAD_WORDS:
        if re.search(pat, head, re.I):
            return kind
    body = t
    for pat in _OTHERS:
        body = re.sub(pat, " ", body)
    score = {k: len(re.findall(p, body, re.I)) for k, p in _PART_WORDS.items()}
    best = max(score.values())
    winners = [k for k, v in score.items() if v == best]
    return winners[0] if best and len(winners) == 1 else None


def kind_of(map_id, name="", what=""):
    """The boat type of a map entity (a TYPES key): read from its `what` (the head's type word, else the painted
    parts), then its name the same way, then the slug's words (S4b.veh.boat_grain_15420 -> grain); passenger when
    nothing says otherwise. build_choices.json `boats.<id>.kit.kind` overrides it."""
    for text in (what, name):
        kind = _read_kind(text)
        if kind:
            return kind
    slug = map_id.split(".")[-1].lower() if map_id else ""
    for kind, words in KIND_WORDS:
        if any(w in slug for w in words):
            return kind
    return "passenger"


class Boat(int):
    """The triangles a boat added (an int), plus: deck_z (deck surface amidships, scene z), roof_z (top of the cabin
    or awning crown, or None), deck_poly / roof_poly (scene XY outlines), heading_deg, lw, loa, beam, lod, kind, parts
    (triangles per part), note (the mapped length against the built one), mast_head (scene point or None)."""

    def __new__(cls, tris, **kw):
        o = super().__new__(cls, tris)
        o.__dict__.update(kw)
        return o


# ---------------------------------------------------------------- where geometry goes

class _Sink:
    """'world': everything into sb.B (the caller's bucket set; the boat's placement applied by the caller's
    k.placed). 'nodes': one bucket set per node, each in its node's frame (origin at the node's pivot, unrotated)."""

    def __init__(self, mode):
        self.mode = mode
        self.nodes = {}
        self.points = []
        self.lines = []

    @contextlib.contextmanager
    def node(self, name, origin=(0, 0, 0), rot_y=0.0, extras=None):
        o = V(origin)
        if self.mode == "world":
            if rot_y:
                with k.placed(Matrix.Translation(o) @ Matrix.Rotation(rot_y, 4, "Y") @ Matrix.Translation(-o)):
                    yield
            else:
                yield
            return
        nd = self.nodes.get(name)
        if nd is None:
            nd = self.nodes[name] = {"B": sb.Buckets(), "origin": o, "rot_y": rot_y, "extras": dict(extras or {})}
        prev = sb.B
        sb.B = nd["B"]
        try:
            with k.placed(Matrix.Translation(-nd["origin"])):
                yield
        finally:
            sb.B = prev

    def point(self, name, node, local, boat_pt=None, extras=None):
        """A named point: `local` in its node's frame; boat_pt: the same point in the boat frame (for 'world')."""
        self.points.append(dict(name=name, node=node, local=V(local), boat=V(boat_pt if boat_pt is not None else local),
                                extras=extras or {}))

    def line(self, name, a, b, r=0.014, sag=0.03, n=4, kind="rope", lod=0, rungs=0):
        """A rope (or plank) between two points that may move apart. a, b: (node or None for world-fixed, local in
        that node, boat-frame point). 'world': built as a sagging rope now; 'nodes': a unit line node plus its two
        end points."""
        if self.mode == "world":
            if kind == "plank":
                _plank_line(a[2], b[2], lod)
            elif kind == "ladder":
                _ladder_line(a[2], b[2], lod)
            else:
                kv._rope(a[2], b[2], sag=sag, r=r, n=n)
            return
        pa, pb = f"pt_{name}_a", f"pt_{name}_b"
        self.point(pa, a[0] or "root", a[1], a[2], {"world": True} if a[0] is None else None)
        self.point(pb, b[0] or "root", b[1], b[2], {"world": True} if b[0] is None else None)
        self.lines.append(dict(name=f"line_{name}", a=pa, b=pb, A=V(a[2]), B=V(b[2]), r=r, kind=kind, rungs=rungs))


S = _Sink("world")     # the active sink (boat() / boat_nodes() set it)


# ---------------------------------------------------------------- helpers

def _tri_count(B=None):
    B = B or sb.B
    return sum(len(f) - 2 for b in B.data.values() for f in b["f"])


def _add(mat, verts, faces, inside, uvs=None, collide=False):
    """Add faces wound outward (inside: one point, or one per face, inside the solid), keeping explicit UVs in step."""
    verts = [V(p) for p in verts]
    ins = inside if isinstance(inside, list) else [V(inside)] * len(faces)
    ori = kv._orient(verts, faces, ins)
    if uvs:
        uvs = [uv if tuple(fo) == tuple(fi) else uv[::-1] for uv, fo, fi in zip(uvs, ori, faces)]
    k.add(mat, collide, verts, ori, uvs)


def _bar(mat, a, b, w, h, collide=False):
    """A plain member (12 triangles), for the many small members where a chamfer would not read."""
    k.beam(mat, collide, a, b, w, h, 0)


def _flat_bar(mat, a, b, w, d, out):
    """A bar seen from one side only (window bars, battens on a wall): front and two sides, no back or ends."""
    a, b = V(a), V(b)
    t = (b - a).normalized()
    o = V(out).normalized()
    s = t.cross(o).normalized() * (w / 2)
    od = o * d
    verts = [a - s, b - s, b + s, a + s, a - s + od, b - s + od, b + s + od, a + s + od]
    _add(mat, verts, [(4, 5, 6, 7), (0, 1, 5, 4), (3, 7, 6, 2)], (a + b) / 2 - o * 0.05)


def _vslab(mat, outline_xz, y0, y1, collide=False):
    """A vertical slab from an outline in the x-z plane, from y0 to y1 (the rudder blade)."""
    n = len(outline_xz)
    verts = [V((x, y0, z)) for x, z in outline_xz] + [V((x, y1, z)) for x, z in outline_xz]
    faces = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    cx = sum(x for x, _ in outline_xz) / n
    cz = sum(z for _, z in outline_xz) / n
    _add(mat, verts, faces, V((cx, (y0 + y1) / 2, cz)), collide=collide)


def _coil(c, r, h=0.12, mat="rope", segs=10):
    """A coiled rope lying on a deck: two stacked rings (its turns), open in the middle (one ring when segs < 8)."""
    c = V(c)
    for ro, ri, z0 in ((r, r * 0.45, 0.0), (r * 0.82, r * 0.4, h * 0.55))[:2 if segs >= 8 else 1]:
        kv._lathe_axis(mat, c + UP * z0, UP, V((1, 0, 0)), V((0, 1, 0)),
                       [(ri, 0.0), (ro, 0.0), (ro, h * 0.6), (ri, h * 0.6)], segs=segs, caps=False)


def _basket(c, r, h, mat="reed", segs=10):
    kv._lathe_axis(mat, V(c), UP, V((1, 0, 0)), V((0, 1, 0)),
                   [(r * 0.72, 0.0), (r * 0.95, h * 0.35), (r, h * 0.85), (r * 1.04, h)], segs=segs)
    kv._lathe_axis("rope", V(c), UP, V((1, 0, 0)), V((0, 1, 0)), [(r * 1.06, h * 0.9), (r * 1.06, h * 1.02)],
                   segs=segs, caps=False)


def _mat_roll(a, b, r, mat="reed"):
    """A rolled mat (or bedding roll) lying from a to b, with two rope bands."""
    a, b = V(a), V(b)
    sb.cyl(mat, False, a, b, r, segs=8)
    d = b - a
    for f in (0.22, 0.78):
        p = a + d * f
        sb.cyl("rope", False, p - d.normalized() * 0.025, p + d.normalized() * 0.025, r * 1.06, segs=8, caps=False)


def _plank_line(a, b, lod, w=0.42):
    """A gangplank built in place (sink 'world'): a plank with cross battens (the painted ladder look)."""
    a, b = V(a), V(b)
    d = b - a
    t = d.normalized()
    s = t.cross(UP).normalized() * (w / 2)
    k.beam("deck", False, a, b, w, 0.06, 0)
    up = s.cross(t).normalized()
    up = up if up.z > 0 else -up
    nb = int(d.length / 0.4) if lod == 0 else 0
    for i in range(1, nb):
        p = a + d * (i / nb) + up * 0.04
        _bar("timber", p - s * 0.95, p + s * 0.95, 0.05, 0.035)


def _ladder_line(a, b, lod, w=0.42):
    """B8: a ladder gangway built in place (sink 'world'): two rails and rungs about every 0.3 m."""
    a, b = V(a), V(b)
    d = b - a
    t = d.normalized()
    s = t.cross(UP).normalized() * (w / 2)
    for sd in (1, -1):
        _bar("bamboo", a + s * sd, b + s * sd, 0.05, 0.05)
    nr = max(2, round(d.length / 0.3)) if lod == 0 else max(2, round(d.length / 0.6))
    for i in range(1, nr):
        p = a + d * (i / nr)
        _bar("bamboo", p - s, p + s, 0.035, 0.035)


# ---------------------------------------------------------------- the hull

class Hull:
    """The hull's shape in the boat frame. zs(x): the gunwale's height above the water; w(x): its half-breadth;
    y(x, z): the side's half-breadth at height z; zb(x): where the side ends below (the water cut or the transom's
    rake); xs: the stations."""

    def __init__(self, lw, beam, free, rise_b, rise_s, oh_b, oh_s, tw_b, tw_s, bb, draft, vis, n_st=24, strakes=6,
                 drop=0.25, **_):
        self.lw, self.B, self.free, self.drop, self.strakes = lw, beam, free, drop, strakes
        self.rise_b, self.rise_s = rise_b, rise_s
        self.x0, self.x1 = -oh_s, lw + oh_b
        self.tw_b, self.tw_s, self.bb = tw_b, tw_s, bb
        self.keel = -draft
        self.floor = -min(vis, draft)
        self.xm = lw * 0.52        # the sheer's low point
        self.xw = lw * 0.55        # the widest station
        self.ks = self.zs(self.x0) / (-self.x0)       # the stern transom's rake: z = -ks * x
        self.kb = self.zs(self.x1) / (self.x1 - lw)   # the bow transom's: z = kb * (x - lw)
        xs = [self.x0 + (self.x1 - self.x0) * (1 - math.cos(math.pi * i / (n_st - 1))) / 2 for i in range(n_st)]
        for xc in (self.floor / -self.ks, lw + self.floor / self.kb):   # where each rake meets the water cut
            if self.x0 < xc < self.x1 and all(abs(xc - x) > 0.08 for x in xs):
                xs.append(xc)
        self.xs = sorted(xs)

    def zs(self, x):
        if x <= self.xm:
            u = min(1.0, (self.xm - x) / (self.xm - self.x0))
            return self.free + self.rise_s * u ** 2.1
        u = min(1.0, (x - self.xm) / (self.x1 - self.xm))
        return self.free + self.rise_b * u ** 2.3

    def w(self, x):
        hb = self.B / 2
        if x <= self.xw:
            u = min(1.0, (self.xw - x) / (self.xw - self.x0))
            return hb * (self.tw_s + (1 - self.tw_s) * (1 - u ** 2.2))
        u = min(1.0, (x - self.xw) / (self.x1 - self.xw))
        return hb * (self.tw_b + (1 - self.tw_b) * (1 - u ** 2.0))

    def zb(self, x):
        return max(self.floor, -self.ks * x, self.kb * (x - self.lw))

    def y(self, x, z):
        """Half-breadth of the side at height z: a flat bottom easing round the bilge into a full side."""
        top = self.zs(x)
        t = max(0.0, min(1.0, (z - self.keel) / max(1e-6, top - self.keel)))
        return self.w(x) * (self.bb + (1 - self.bb) * math.sin(math.pi / 2 * t) ** 0.55)

    def normal(self, x, z, dz=0.03):
        """The side's outward normal in the y-z plane at height z (port side)."""
        return V((0, 2 * dz, -(self.y(x, z + dz) - self.y(x, z - dz)))).normalized()

    def deck_z(self, x, drop=None):
        return self.zs(x) - (self.drop if drop is None else drop)

    def inner(self, x, z, t=0.07):
        return self.y(x, z) - t


def _hull(H, rng, lod, lap=0.025):
    """The planking: strake bands, each with its lower edge lapped proud and chamfered (the painted seam lines).
    Returns the strake seams (fractions of the side from the water cut to the gunwale)."""
    ns = H.strakes
    ts = [i / ns for i in range(ns + 1)]
    xs = H.xs
    tile = sb.MATERIALS["timber"][1]
    for side in (1, -1):
        for kk in range(ns):
            t0, t1 = ts[kk], ts[kk + 1]
            lapped = kk > 0 and (lod == 0 or kk >= ns - 2)
            verts, faces, uvs, ins = [], [], [], []
            ou, ov = rng.random(), rng.random()
            for x in xs:
                z0, z1 = H.zb(x), H.zs(x)
                za, zt = z0 + (z1 - z0) * t0, z0 + (z1 - z0) * t1
                if lapped:
                    e = min(lap, (zt - za) * 0.3)
                    lo_out = V((x, H.y(x, za), za)) + H.normal(x, za) * lap
                    lo_in = V((x, H.y(x, za - e), za - e))
                else:
                    lo_out = lo_in = V((x, H.y(x, za), za))
                for p in (lo_in, lo_out, V((x, H.y(x, zt), zt))):
                    verts.append(V((p.x, p.y * side, p.z)))
            arc = [0.0]
            for i in range(1, len(xs)):
                arc.append(arc[-1] + (verts[i * 3 + 2] - verts[(i - 1) * 3 + 2]).length)
            for i in range(len(xs) - 1):
                a, b = i * 3, (i + 1) * 3
                hz = (verts[a + 2] - verts[a + 1]).length
                v0, v1 = arc[i] / tile + ov, arc[i + 1] / tile + ov
                xc = (xs[i] + xs[i + 1]) / 2
                inside = V((xc, 0, (H.zb(xc) + H.zs(xc)) / 2))
                faces.append((a + 1, b + 1, b + 2, a + 2))
                uvs.append([(ou, v0), (ou, v1), (ou + hz / tile, v1), (ou + hz / tile, v0)])
                ins.append(inside)
                if lapped:
                    faces.append((a, b, b + 1, a + 1))
                    uvs.append([(ou - 0.03, v0), (ou - 0.03, v1), (ou, v1), (ou, v0)])
                    ins.append(inside)
            keep = [j for j, f in enumerate(faces)
                    if (verts[f[2]] - verts[f[0]]).cross(verts[f[3]] - verts[f[1]]).length > 1e-7]
            _add("timber", verts, [faces[j] for j in keep], [ins[j] for j in keep], [uvs[j] for j in keep])
    return ts


def _wet_band(H, lod, lo=-0.05, hi=0.11, off=0.03):
    """The wet line where the hull meets the water: a dark band from just under the water to `hi` above it, standing
    `off` proud of the planking (over the laps), along both sides and across both transoms (gen/boats/water.md)."""
    xs = [0.0] + [x for x in H.xs if 0.0 < x < H.lw] + [H.lw]
    if lod > 0:
        xs = xs[::2] + ([H.lw] if xs[-1] != H.lw and len(xs) % 2 == 0 else [])
    for side in (1, -1):
        verts = []
        for x in xs:
            for z in (max(lo, H.zb(x)), hi):
                n = H.normal(x, z)
                verts.append(V((x, (H.y(x, z) + n.y * off) * side, z)))
        faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(len(xs) - 1)]
        _add("wet_hull", verts, faces, [V(((xs[i] + xs[i + 1]) / 2, 0, 0)) for i in range(len(xs) - 1)])
    for sgn, x_of in ((-1, lambda z: -z / H.ks), (1, lambda z: H.lw + z / H.kb)):
        za, zb_ = 0.0, hi
        xa, xb_ = x_of(za) + sgn * off, x_of(zb_) + sgn * off
        q = [V((xa, H.y(xa, za), za)), V((xa, -H.y(xa, za), za)), V((xb_, -H.y(xb_, zb_), zb_)), V((xb_, H.y(xb_, zb_), zb_))]
        _add("wet_hull", q, [(0, 1, 2, 3)], V((H.lw / 2, 0, 0)))


def _wet_ring(H, lod, z=0.015):
    """Node `wet__ring`: a flat ribbon on the water round the hull's waterline, its u running 0 at the hull to 1 at its
    outer edge (the page fades it out along u: a soft pale line of disturbed water, gen/boats/water.md), v the
    length round it in metres. 0.6 m wide all round, moored or under way (the bow wave is its own node, _bow_wave).
    It moves with the boat."""
    xs = [0.0] + [x for x in H.xs if 0.0 < x < H.lw] + [H.lw]
    if lod > 0:
        xs = xs[::2] + ([H.lw] if xs[-1] != H.lw and len(xs) % 2 == 0 else [])
    port = [V((x, H.y(x, 0.0), z)) for x in xs]
    _ribbon("water_ring", port + [V((p.x, -p.y, z)) for p in reversed(port)], lambda p: 0.6, closed=True,
            centre=V((H.lw / 2, 0, 0)))


def _bow_wave(H, lod, z=0.02):
    """Node `bow_wave` (boats under way): the pale water heaped at the bow while the boat moves, a ribbon like the wet
    ring's (same material and u / v), 0 wide at 0.55 of the waterline and 1.4 m at the stem, round the bow from one
    side to the other. Its own node so the page shows it only while the boat goes ahead (hidden while it waits, and
    going astern); it lies 5 mm over the ring."""
    x_from = H.lw * 0.55
    xs = [x for x in H.xs if x_from < x < H.lw] + [H.lw]
    if lod > 0:
        xs = xs[::2] + ([H.lw] if xs[-1] != H.lw and len(xs) % 2 == 0 else [])
    xs = [x_from] + xs
    port = [V((x, H.y(x, 0.0), z)) for x in xs]
    width = lambda p: 0.05 + 1.35 * max(0.0, (p.x - x_from) / (H.lw - x_from)) ** 1.5   # noqa: E731
    _ribbon("water_ring", port + [V((p.x, -p.y, z)) for p in reversed(port)], width, closed=False,
            centre=V((H.lw / 2, 0, 0)))


def _ribbon(mat, loop, width, closed, centre):
    """A flat ribbon on the water outward from a line round the hull: u 0 at the hull to 1 at the outer edge, v metres
    along it (the wet ring and the bow wave)."""
    m = len(loop)
    verts, uvs_v = [], [0.0]
    for i, p in enumerate(loop):
        a, b = loop[i - 1] if (closed or i) else p, loop[(i + 1) % m] if (closed or i < m - 1) else p
        t = (b - a)
        t.z = 0
        n = V((t.y, -t.x, 0)).normalized()
        if n.dot(V((p.x - centre.x, p.y, 0))) < 0:
            n = -n
        verts += [p + n * 0.02, p + n * width(p)]
        if i:
            uvs_v.append(uvs_v[-1] + (p - loop[i - 1]).length)
    faces, uvs = [], []
    for i in range(m if closed else m - 1):
        j = (i + 1) % m
        faces.append((2 * i, 2 * j, 2 * j + 1, 2 * i + 1))
        vj = uvs_v[j] if j else uvs_v[-1] + (loop[0] - loop[-1]).length
        uvs.append([(0.0, uvs_v[i]), (0.0, vj), (1.0, vj), (1.0, uvs_v[i])])
    _add(mat, verts, faces, V((centre.x, 0, -5.0)), uvs)


def _transoms(H, lod):
    """The raked bow and stern transoms: boards across between the sides' lower edges (alternate boards a little
    proud, so the painted board lines draw), a heavy capping beam across the top whose ends project past the sides
    (the cargo bow's horns), and the flat bottom at the water cut."""
    for sgn in (-1, 1):           # -1 stern, +1 bow: the transom's outward direction along x
        if sgn < 0:
            xs = [x for x in H.xs if x <= H.floor / -H.ks + 1e-6]
        else:
            xs = [x for x in H.xs if x >= H.lw + H.floor / H.kb - 1e-6]
        rows = sorted(((x, H.zb(x), H.y(x, H.zb(x))) for x in xs), key=lambda r: r[1])
        n_b = max(2, round((rows[-1][1] - rows[0][1]) / (0.32 if lod == 0 else 0.7)))
        cut = [rows[0][1] + (rows[-1][1] - rows[0][1]) * i / n_b for i in range(n_b + 1)]

        def at(z):
            for (xa, za, ya), (xb_, zb_, yb) in zip(rows, rows[1:]):
                if za - 1e-9 <= z <= zb_ + 1e-9:
                    f = (z - za) / max(1e-9, zb_ - za)
                    return xa + (xb_ - xa) * f, ya + (yb - ya) * f
            return rows[-1][0], rows[-1][2]
        for bi in range(n_b):
            za, zb_ = cut[bi], cut[bi + 1]
            xa, ya = at(za)
            xb_, yb = at(zb_)
            off = 0.018 * (bi % 2) * sgn
            q = [V((xa + off, ya, za)), V((xa + off, -ya, za)), V((xb_ + off, -yb, zb_)), V((xb_ + off, yb, zb_))]
            back = [p + V((-sgn * 0.06, 0, 0)) for p in q]
            _add("timber", q + back, [(0, 1, 2, 3), (0, 4, 5, 1), (3, 2, 6, 7)],
                 V(((xa + xb_) / 2 - sgn * 1.0, 0, (za + zb_) / 2)))
        xt, zt, yt = rows[-1]
        proj = 0.3 if sgn > 0 else 0.12
        k.beam("lattice", False, (xt + sgn * 0.04, yt + proj, zt + 0.03), (xt + sgn * 0.04, -yt - proj, zt + 0.03),
               0.16, 0.16, 0.025 if lod == 0 else 0)
    pts = [(x, H.y(x, H.floor)) for x in H.xs if H.zb(x) <= H.floor + 1e-6]
    if len(pts) > 2:
        ring = [V((x, y, H.floor)) for x, y in pts] + [V((x, -y, H.floor)) for x, y in reversed(pts)]
        _add("timber", ring, [tuple(range(len(ring)))], V((H.lw / 2, 0, 0.5)))


def _wales(H, ts, lod):
    """The heavy wale two strakes below the gunwale (dark, with thickness: its top and bottom draw two ink lines), a
    lighter rubbing strake lower down (full detail), and the gunwale cap along the sheer."""
    xs = H.xs[::2] + ([H.xs[-1]] if len(H.xs) % 2 == 0 else [])
    specs = [(ts[-3] if len(ts) > 4 else ts[-2], 0.1, 0.17, "lattice")]
    if lod == 0 and len(ts) > 6:
        specs.append((ts[len(ts) // 2 - 1], 0.05, 0.08, "lattice"))
    for t, d, h, mat in specs:
        for side in (1, -1):
            pts, nrms, acr = [], [], []
            for x in xs:
                z0, z1 = H.zb(x), H.zs(x)
                z = z0 + (z1 - z0) * t
                if z - h / 2 < z0 + 0.005:
                    continue
                n = H.normal(x, z)
                pts.append(V((x, H.y(x, z) * side, z)))
                nrms.append(V((0, n.y * side, n.z)))
                acr.append(V((0, -n.z * side, n.y)))
            if len(pts) > 1:
                kv._sweep_rect(mat, pts, nrms, acr, -0.01, d, -h / 2, h / 2, sides=(0, 1, 2), caps=True)
    for side in (1, -1):
        pts = [V((x, (H.y(x, H.zs(x)) - 0.03) * side, H.zs(x))) for x in xs]
        kv._sweep_rect("timber", pts, [UP] * len(pts), [V((0, side, 0))] * len(pts), -0.02, 0.07, -0.06, 0.09,
                       sides=(0, 1, 2), caps=True)


def _bulwark(H, drop, x_from, x_to, lod):
    """The inside face of the planking from the deck up to the gunwale (seen from the bank and from the deck), and
    stanchions behind it (full detail)."""
    xs = [x for x in H.xs if x_from - 1e-6 <= x <= x_to + 1e-6]
    if len(xs) < 2:
        return
    for side in (1, -1):
        verts = []
        for x in xs:
            zt = H.zs(x)
            zd = zt - drop
            verts += [V((x, H.inner(x, zd) * side, zd - 0.02)), V((x, H.inner(x, zt) * side, zt - 0.01))]
        faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(len(xs) - 1)]
        _add("timber", verts, faces, [V(((xs[i] + xs[i + 1]) / 2, side * 50.0, 0)) for i in range(len(xs) - 1)])
        if lod == 0 and drop > 0.15:
            n = max(2, int((x_to - x_from) / 1.3))
            for j in range(1, n):
                x = x_from + (x_to - x_from) * j / n
                zt = H.zs(x)
                yi = (H.inner(x, zt) - 0.04) * side
                _bar("timber", (x, yi, zt - drop), (x, yi, zt - 0.02), 0.07, 0.07)


def _deck(H, drop, x_from, x_to, rng, lod, holes=(), mat="deck"):
    """Deck boards running fore and aft from x_from to x_to, following the sheer, each its own strip standing a
    little proud of a dark underlay so the joints draw; boards inside a hole (x0, x1, half-width: under a cabin or a
    hold cover) stop at its ends."""
    seg = 2.4 if lod == 0 else 3.5
    cuts = {x_from, x_to}
    n = max(2, int((x_to - x_from) / seg) + 1)
    cuts |= {x_from + (x_to - x_from) * i / (n - 1) for i in range(n)}
    for h0, h1, _ in holes:
        cuts |= {h0, h1}
    xs = sorted(c for c in cuts if x_from - 1e-9 <= c <= x_to + 1e-9)
    hw = {x: H.inner(x, H.deck_z(x, drop)) - 0.01 for x in xs}
    nb = max(4, round(2 * max(hw.values()) / (0.42 if lod == 0 else 0.9)))
    tile = sb.MATERIALS[mat][1]
    for b in range(nb):
        f0, f1 = -1 + 2 * b / nb, -1 + 2 * (b + 1) / nb
        g = 0.008 if lod == 0 else 0.0
        ou = rng.random()
        zj = rng.uniform(-0.006, 0.006)
        verts, faces, uvs, ins = [], [], [], []
        idx = {}

        def vid(x, j):
            key = (x, j)
            if key not in idx:
                z = H.deck_z(x, drop) + zj
                y = hw[x] * (f0 if j % 2 == 0 else f1) + (g if j % 2 == 0 else -g)
                idx[key] = len(verts)
                verts.append(V((x, y, z - (0.04 if j >= 2 else 0))))
            return idx[key]
        for xa, xb in zip(xs, xs[1:]):
            xm = (xa + xb) / 2
            ymid = (hw[xa] + hw[xb]) / 2 * (f0 + f1) / 2
            if any(h0 - 1e-9 <= xa and xb <= h1 + 1e-9 and abs(ymid) + (f1 - f0) * hw[xa] / 2 < hw_h + 0.05
                   for h0, h1, hw_h in holes):
                continue
            a0, a1, b0, b1 = vid(xa, 0), vid(xa, 1), vid(xb, 0), vid(xb, 1)
            faces.append((a0, b0, b1, a1))
            w_ = (verts[a1] - verts[a0]).length
            uvs.append([(ou, xa / tile), (ou, xb / tile), (ou + w_ / tile, xb / tile), (ou + w_ / tile, xa / tile)])
            inside = V((xm, ymid, H.deck_z(xm, drop) - 0.02))
            ins.append(inside)
            if lod == 0:
                c0, c1, d0, d1 = vid(xa, 2), vid(xa, 3), vid(xb, 2), vid(xb, 3)
                faces += [(a0, c0, d0, b0), (a1, b1, d1, c1)]
                uvs += [[(0, 0)] * 4, [(0, 0)] * 4]
                ins += [inside, inside]
        if faces:
            _add(mat, verts, faces, ins, uvs)
    if lod == 0:
        verts = []
        for x in xs:
            z = H.deck_z(x, drop) - 0.035
            verts += [V((x, hw[x], z)), V((x, -hw[x], z))]
        faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(len(xs) - 1)]
        _add("interior", verts, faces, V((0, 0, -10)))


# ---------------------------------------------------------------- colliders, rim, boarding edge

def _deck_collider(H, drop, x_from, x_to, step=2.0):
    """Hidden walkable deck: a slab whose top is the deck surface from x_from to x_to (sheered)."""
    n = max(2, int((x_to - x_from) / step) + 1)
    xs = [x_from + (x_to - x_from) * i / (n - 1) for i in range(n)]
    verts = []
    for x in xs:
        z, y = H.deck_z(x, drop), H.inner(x, H.deck_z(x, drop))
        verts += [V((x, y, z)), V((x, -y, z)), V((x, y, z - 0.25)), V((x, -y, z - 0.25))]
    faces, ins = [], []
    for i in range(n - 1):
        a, c = 4 * i, 4 * (i + 1)
        xm = (xs[i] + xs[i + 1]) / 2
        p = V((xm, 0, H.deck_z(xm, drop) - 0.12))
        faces += [(a, c, c + 1, a + 1), (a + 2, a + 3, c + 3, c + 2), (a, a + 2, c + 2, c), (a + 1, c + 1, c + 3, a + 3)]
        ins += [p] * 4
    faces += [(0, 1, 3, 2), (4 * (n - 1), 4 * (n - 1) + 2, 4 * (n - 1) + 3, 4 * (n - 1) + 1)]
    ins += [V((xs[0] + 0.05, 0, H.deck_z(xs[0], drop) - 0.12)), V((xs[-1] - 0.05, 0, H.deck_z(xs[-1], drop) - 0.12))]
    _add("hidden", verts, faces, ins, collide=True)
    return [(x, H.inner(x, H.deck_z(x, drop))) for x in xs]


def _flat_collider(xa, xb, hw, z):
    """A level hidden deck (the stern gallery, a small boat's floor boards)."""
    verts = [V((xa, -hw, z)), V((xb, -hw, z)), V((xb, hw, z)), V((xa, hw, z))]
    verts += [p - V((0, 0, 0.2)) for p in verts]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    _add("hidden", verts, faces, V(((xa + xb) / 2, 0, z - 0.1)), collide=True)


def _rim_walls(H, drop, x_from, x_to, step=2.0):
    """Hidden 1.0 m walls standing on the deck edge along both gunwales and across the stern and bow ends, each piece
    about `step` long and separate, so the page can drop the pieces where the boat touches something walkable."""
    n = max(2, round((x_to - x_from) / step) + 1)
    xs = [x_from + (x_to - x_from) * i / (n - 1) for i in range(n)]
    for side in (1, -1):
        for xa, xb in zip(xs, xs[1:]):
            za, zb_ = H.deck_z(xa, drop), H.deck_z(xb, drop)
            ya, yb = H.inner(xa, za) * side, H.inner(xb, zb_) * side
            q = [V((xa, ya, za - 0.1)), V((xb, yb, zb_ - 0.1)), V((xb, yb, zb_ + 1.0)), V((xa, ya, za + 1.0))]
            _add("hidden", q, [(0, 1, 2, 3)], V(((xa + xb) / 2, 0, za + 0.5)), collide=True)
    for x in (x_from, x_to):
        z = H.deck_z(x, drop)
        y = H.inner(x, z)
        q = [V((x, -y, z - 0.1)), V((x, y, z - 0.1)), V((x, y, z + 1.0)), V((x, -y, z + 1.0))]
        _add("hidden", q, [(0, 1, 2, 3)], V(((x_from + x_to) / 2, 0, z + 0.5)), collide=True)


def _board_edge(H, x_from, x_to, step=1.0):
    """The boarding edge: a hidden ribbon 0.3 m wide along the gunwale top all round (the hull's outline), for the
    page's contact test with banks, stairs, jetties and other decks."""
    n = max(3, round((x_to - x_from) / step) + 1)
    xs = [x_from + (x_to - x_from) * i / (n - 1) for i in range(n)]
    ring = [(x, H.y(x, H.zs(x)), H.zs(x)) for x in xs]
    loop = [V(p) for p in ring] + [V((x, -y, z)) for x, y, z in reversed(ring)]
    m = len(loop)
    verts = []
    for p in loop:
        inw = V((0, -1 if p.y > 0 else 1, 0)) * 0.3
        verts += [p, p + inw]
    faces = [(2 * i, 2 * ((i + 1) % m), 2 * ((i + 1) % m) + 1, 2 * i + 1) for i in range(m)]
    _add("hidden", verts, faces, V(((x_from + x_to) / 2, 0, -5.0)))


# ---------------------------------------------------------------- the cabin and deckhouses

def _bay_pattern(kind, n, rng):
    """The window bays as painted: S2's 客船 (u 22550-23700) alternates lattice and open windows, some with curtains,
    a door at the front end; `boards` (S4b's big boat: board walls between posts), `house` (a crew house: a door and
    boards, one lattice window)."""
    if kind == "boards":
        return ["P"] * n
    if kind == "house":
        return (["P"] * (n - 1) + ["L"]) if n > 1 else ["L"]
    return ["L"] + [rng.choice(("L", "O", "L", "C", "O")) for _ in range(n - 2)] + ["L"] if n > 1 else ["L"]


def _wall_quad(mat, xa, xb, za, zb, y, side, tile=1.2):
    q = [V((xa, y, za)), V((xb, y, za)), V((xb, y, zb)), V((xa, y, zb))]
    _add(mat, q, [(0, 1, 2, 3)], V(((xa + xb) / 2, y - side * 1.0, (za + zb) / 2)),
         uvs=[[(xa / tile, za / tile), (xb / tile, za / tile), (xb / tile, zb / tile), (xa / tile, zb / tile)]])


def _end_quad(mat, x, ya, yb, za, zb, sgn):
    q = [V((x, ya, za)), V((x, yb, za)), V((x, yb, zb)), V((x, ya, zb))]
    _add(mat, q, [(0, 1, 2, 3)], V((x - sgn * 1.0, (ya + yb) / 2, (za + zb) / 2)))


def _bay_fill(kind, xa, xb, za, zb, y, side, out, rng, lod, zf):
    """A bay's window band: L lattice (直棂), O open with a rolled blind, C open with a curtain drawn to one side,
    P a board panel, D a door (dark opening from the deck)."""
    back = y - side * 0.045
    if kind == "P":
        _wall_quad("deck", xa, xb, za - 0.035, zb + 0.035, y - side * 0.012, side)
        if lod == 0:
            _flat_bar("lattice", ((xa + xb) / 2, y, za), ((xa + xb) / 2, y, zb), 0.03, 0.01, out)
        return
    if kind == "D":
        _wall_quad("interior", xa, xb, zf, zb, back, side)
        return
    _wall_quad("interior", xa, xb, za, zb, back, side)
    if lod > 0:
        if kind == "L":
            _flat_bar("lattice", ((xa + xb) / 2, y, za), ((xa + xb) / 2, y, zb), 0.04, 0.012, out)
        return
    if kind == "L":
        nb = max(3, int((xb - xa) / 0.13))
        for i in range(1, nb):
            x = xa + (xb - xa) * i / nb
            _flat_bar("lattice", (x, y - side * 0.02, za), (x, y - side * 0.02, zb), 0.03, 0.02, out)
        _flat_bar("lattice", (xa, y - side * 0.01, (za + zb) / 2), (xb, y - side * 0.01, (za + zb) / 2), 0.03, 0.02, out)
    elif kind == "O":
        sb.cyl("reed", False, (xa + 0.02, y + side * 0.03, zb - 0.06), (xb - 0.02, y + side * 0.03, zb - 0.06), 0.045, segs=6)
    elif kind == "C":
        cloth = rng.choice(("cloth_white", "cloth_indigo", "cloth_white"))
        xm = xa + (xb - xa) * rng.uniform(0.45, 0.7)
        q = [V((xa, y - side * 0.02, zb)), V((xm, y - side * 0.02, zb)), V((xm - 0.08, y + side * 0.03, za + 0.08)),
             V((xa, y + side * 0.01, za + 0.04))]
        kv._quad2(cloth, *q)
        _bar("timber", (xa, y + side * 0.02, zb - 0.02), (xb, y + side * 0.02, zb - 0.02), 0.025, 0.025)


def _board_roof(x0, x1, hw, ze, rise, rng, lod, thick=0.06, panel=1.1):
    """A cambered board roof from x0 to x1, eaves at ze, hw either side, crowned `rise` higher: panels across the
    roof with small gaps between them (the painted roof's board lines), each a slab of its own; a dark fascia under
    each eave."""
    na = 6 if lod == 0 else 3
    prof = [(-hw + 2 * hw * i / na, ze + rise * math.sin(math.pi * i / na) ** 0.8) for i in range(na + 1)]

    def prof_z(y):
        for (ya, za), (yb, zb) in zip(prof, prof[1:]):
            if ya - 1e-9 <= y <= yb + 1e-9:
                return za + (zb - za) * (y - ya) / max(1e-9, yb - ya)
        return ze
    n = max(1, round((x1 - x0) / (panel if lod == 0 else 3.0)))
    tile = sb.MATERIALS["deck"][1]
    m = na + 1
    for p in range(n):
        xa = x0 + (x1 - x0) * p / n + (0.008 if p else 0)
        xb = x0 + (x1 - x0) * (p + 1) / n - (0.008 if p < n - 1 else 0)
        dz = rng.uniform(-0.008, 0.008)
        verts = ([V((xa, y, z + thick + dz)) for y, z in prof] + [V((xb, y, z + thick + dz)) for y, z in prof]
                 + [V((xa, y, z + dz)) for y, z in prof] + [V((xb, y, z + dz)) for y, z in prof])
        faces, uvs = [], []
        for i in range(na):
            faces.append((i, m + i, m + i + 1, i + 1))
            uvs.append([(prof[i][0] / tile, xa / tile), (prof[i][0] / tile, xb / tile),
                        (prof[i + 1][0] / tile, xb / tile), (prof[i + 1][0] / tile, xa / tile)])
            faces.append((2 * m + i, 2 * m + i + 1, 3 * m + i + 1, 3 * m + i))
            uvs.append([(0, 0)] * 4)
            faces.append((i, i + 1, 2 * m + i + 1, 2 * m + i))
            uvs.append([(0, 0)] * 4)
            faces.append((m + i, 3 * m + i, 3 * m + i + 1, m + i + 1))
            uvs.append([(0, 0)] * 4)
        faces += [(0, 2 * m, 3 * m, m), (na, m + na, 3 * m + na, 2 * m + na)]
        uvs += [[(0, 0)] * 4, [(0, 0)] * 4]
        ins = []
        for f in faces:
            c = sum((verts[q] for q in f), V((0, 0, 0))) / len(f)
            yy = c.y * 0.98
            ins.append(V((min(max(c.x, xa + 0.002), xb - 0.002), yy, prof_z(yy) + dz + thick / 2)))
        _add("deck", verts, faces, ins, uvs)
    for side in (1, -1):
        _bar("lattice", (x0, side * (hw - 0.02), ze - 0.03), (x1, side * (hw - 0.02), ze - 0.03), 0.05, 0.08)


def _roof_collider(xa, xb, hw, zd, ze, zc):
    """Hidden: a deckhouse's block (its walls stop a walker) with a cambered top at the roof's surface."""
    na = 4
    prof = [(-hw + 2 * hw * i / na, ze + (zc - ze) * math.sin(math.pi * i / na) ** 0.8) for i in range(na + 1)]
    ring_a = [V((xa, -hw, zd))] + [V((xa, y, z)) for y, z in prof] + [V((xa, hw, zd))]
    ring_b = [V((xb, p.y, p.z)) for p in ring_a]
    m = len(ring_a)
    faces = [(i, i + 1, m + i + 1, m + i) for i in range(m - 1)] + [(m - 1, 0, m, 2 * m - 1)]
    faces += [tuple(range(m)), tuple(range(2 * m - 1, m - 1, -1))]
    _add("hidden", ring_a + ring_b, faces, V(((xa + xb) / 2, 0, (zd + ze) / 2)), collide=True)


def _cabin(H, drop, x0, x1, hw, wall_h, rng, lod, pattern="passenger", roof="board", segs=2, roof_rise=0.28,
           over=0.32, ladder=None, doors=(True, True)):
    """A deckhouse from x0 to x1, hw either side of the centreline, walls wall_h above the deck: framed bays (posts
    about every 1.05 m; sill, head and top rails along each roof segment), a board dado and a frieze board, and in the
    window band whatever `pattern` gives per bay (_bay_fill); boarded ends, each with a door when `doors` says. The
    roof: cambered boards (`board`) or an arched woven mat (`mat`), in `segs` level pieces stepping with the sheer.
    Returns (segments [(xa, xb, floor z)], roof crowns)."""
    L = x1 - x0
    nbays = max(2, round(L / 1.05))
    bx = [x0 + L * i / nbays for i in range(nbays + 1)]
    segs = max(1, min(segs, nbays))
    edges = [round(nbays * s / segs) for s in range(segs + 1)]
    is_open = pattern == "open"           # B4: posts and a waist rail, no walls (passengers at its rail)
    if is_open:
        doors = (False, False)
        pat = ["L"] * nbays
    else:
        pat = _bay_pattern(pattern, nbays, rng) if isinstance(pattern, str) else list(pattern)[:nbays] + ["L"] * max(0, nbays - len(pattern))
    tops = []
    sill_h, head_h = 0.62, wall_h - 0.3
    for si in range(segs):
        b0, b1 = edges[si], edges[si + 1]
        xa, xb = bx[b0], bx[b1]
        zd = max(H.deck_z(x, drop) for x in (xa, xb, (xa + xb) / 2))
        tops.append((xa, xb, zd))
        for side in (1, -1):
            y = hw * side
            out = V((0, side, 0))
            for j in range(b0, b1 + 1):
                if lod > 0 and j % 2 and j not in (b0, b1):
                    continue
                w_ = 0.12 if j in (0, nbays) else 0.085
                _bar("timber", (bx[j], y, H.deck_z(bx[j], drop) - 0.05), (bx[j], y, zd + wall_h), w_, w_)
            rails = ((zd + sill_h, 0.07), (zd + head_h, 0.07), (zd + wall_h - 0.04, 0.09))
            if is_open:
                rails = ((zd + 0.85, 0.07), (zd + wall_h - 0.04, 0.09))
            for z, hh in (rails if (lod == 0 or is_open) else rails[::2]):
                _bar("timber", (xa - 0.04, y + side * 0.015, z), (xb + 0.04, y + side * 0.015, z), 0.1, hh)
            if is_open:
                if lod == 0:      # short balusters under the waist rail
                    nbal = max(2, round((xb - xa) / 0.28))
                    for q in range(1, nbal):
                        xq = xa + (xb - xa) * q / nbal
                        _bar("timber", (xq, y + side * 0.015, H.deck_z(xq, drop)), (xq, y + side * 0.015, zd + 0.82), 0.035, 0.035)
                continue
            for j in range(b0, b1):
                xa_, xb_ = bx[j] + 0.045, bx[j + 1] - 0.045
                zf = H.deck_z((xa_ + xb_) / 2, drop) - 0.03
                _wall_quad("timber", xa_, xb_, zf, zd + sill_h - 0.035, y - side * 0.012, side)
                if lod == 0:
                    xm = (xa_ + xb_) / 2
                    _flat_bar("lattice", (xm, y, zf + 0.04), (xm, y, zd + sill_h - 0.04), 0.035, 0.012, out)
                _wall_quad("deck", xa_, xb_, zd + head_h + 0.035, zd + wall_h - 0.085, y - side * 0.012, side)
                _bay_fill(pat[j], xa_, xb_, zd + sill_h + 0.035, zd + head_h - 0.035, y, side, out, rng, lod, zf)
    for (x, sgn, zd, door) in ((x0, -1, tops[0][2], doors[0]), (x1, 1, tops[-1][2], doors[1])):
        if is_open:
            break
        dw = min(0.45, hw * 0.45)
        for ya, yb in ((-hw, -dw), (dw, hw)):
            _end_quad("deck", x, ya, yb, zd - 0.03, zd + wall_h - 0.05, sgn)
        if door:
            _end_quad("interior", x - sgn * 0.06, -dw, dw, zd - 0.03, zd + head_h, sgn)
            _bar("timber", (x + sgn * 0.02, -dw, zd + head_h), (x + sgn * 0.02, dw, zd + head_h), 0.08, 0.08)
            for yy in (-dw, dw):
                _bar("timber", (x + sgn * 0.02, yy, zd - 0.03), (x + sgn * 0.02, yy, zd + wall_h - 0.05), 0.08, 0.08)
            _end_quad("deck", x, -dw, dw, zd + head_h + 0.04, zd + wall_h - 0.05, sgn)
        else:
            _end_quad("deck", x, -dw, dw, zd - 0.03, zd + wall_h - 0.05, sgn)
    crowns = []
    for si, (xa, xb, zd) in enumerate(tops):
        ze = zd + wall_h
        lift = 0.05 * si if segs > 1 else 0.0
        ext0 = over * 0.8 if si == 0 else 0.03
        ext1 = over * 0.8 if si == segs - 1 else 0.03
        if roof == "mat":
            zt = ze + roof_rise * 1.6 + lift
            kv.barrel_cover(xa - ext0, xb + ext1, hw + over * 0.55, ze - 0.05 + lift, ze + roof_rise * 0.25 + lift, zt,
                            hoops=max(3, round((xb - xa) / 1.1) + 1) if lod == 0 else 2, thick=0.035)
        else:
            zt = ze + lift + roof_rise + 0.06
            _board_roof(xa - ext0, xb + ext1, hw + over, ze + lift, roof_rise, rng, lod)
        crowns.append(zt)
        with S.node("roof__col"):
            if is_open:       # walkers and passengers go in under it: only the roof's top collides
                _posts_roof_collider(xa - ext0, xb + ext1, hw + over * 0.5, zt - 0.02, th=max(0.15, zt - ze - lift))
            else:
                _roof_collider(xa - ext0, xb + ext1, hw, zd, ze + lift, zt - 0.02)
    if ladder is not None:
        xl, side = ladder
        zd = H.deck_z(xl, drop)
        zt = max(crowns) - 0.05
        y = (hw + 0.22) * side
        nr = 6 if lod == 0 else 3
        for dx in (-0.22, 0.22):
            _bar("bamboo", (xl + dx, y + side * 0.25, zd), (xl + dx, y - side * 0.05, zt), 0.05, 0.05)
        for r in range(1, nr):
            f = r / nr
            yy = y + side * 0.25 * (1 - f) - side * 0.05 * f
            _bar("bamboo", (xl - 0.22, yy, zd + (zt - zd) * f), (xl + 0.22, yy, zd + (zt - zd) * f), 0.035, 0.035)
    return tops, crowns


# ---------------------------------------------------------------- ends: bow, stern gallery, rudder

def _bow(H, drop, style, rng, lod, canopy=False):
    """The bow: bitts on the foredeck and, as painted, a platform reaching past the transom on two beams (`platform`,
    the 客船's, an upturned stem post curling at its head and a small canopy over the foredeck), or the cargo boat's
    capping beam projecting as horns (`horns`, built by _transoms), or a mooring post (`post`, small boats). Returns
    the bitts' tops."""
    x1 = H.x1
    zt = H.zs(x1)
    xb = x1 - (0.9 if H.B > 3 else 0.5)
    zd = H.deck_z(xb, drop) if H.B > 3 else H.zs(xb) - 0.05
    bits = []
    for yy in ((0.55, -0.55) if H.B > 3 else (0.0,)):
        yy = yy * min(1.0, H.w(xb) / 1.2)
        _bar("lattice", (xb, yy, zd - 0.05), (xb, yy, zd + 0.42), 0.13, 0.13)
        _bar("lattice", (xb, yy - 0.12, zd + 0.3), (xb, yy + 0.12, zd + 0.3), 0.05, 0.05)
        bits.append(V((xb, yy, zd + 0.3)))
    if style == "platform":
        ext = 1.0
        for yy in (0.42, -0.42):
            k.beam("timber", False, (x1 - 1.2, yy, zt - 0.05), (x1 + ext, yy, zt + 0.08), 0.13, 0.13,
                   0.02 if lod == 0 else 0)
        nb = 5 if lod == 0 else 2
        for i in range(nb):
            xa = x1 - 0.2 + (ext + 0.15) * i / nb
            kv.plank("deck", (xa + 0.1, 0.55), (xa + 0.1, -0.55), (ext + 0.15) / nb - 0.02, zt + 0.1, zt + 0.15, rng)
        base = V((x1 + 0.05, 0, zt - 0.1))
        pts = [base, base + V((0.25, 0, 0.55)), base + V((0.5, 0, 1.05)), base + V((0.75, 0, 1.35)),
               base + V((0.95, 0, 1.4)), base + V((1.05, 0, 1.28))]
        kv._polybeam("timber", pts, 0.13, 0.13, 0.02 if lod == 0 else 0)
        if canopy:
            cx0, cx1 = x1 - 2.6, x1 - 0.8
            zc = max(H.deck_z(cx0, drop), H.deck_z(cx1, drop)) + 1.75
            for xx in (cx0, cx1):
                for yy in (0.75, -0.75):
                    _bar("timber", (xx, yy, H.deck_z(xx, drop) - 0.03), (xx, yy, zc), 0.08, 0.08)
            _board_roof(cx0 - 0.3, cx1 + 0.35, 1.05, zc, 0.16, rng, lod, panel=0.7)
    return bits


def _stern(H, drop, rng, lod, gallery=True, house=False, house_h=1.8, tiller=True, rudder=True, frame=False):
    """The stern: a gallery reaching past the transom on the continued gunwale beams, planked, with a rail; the rudder
    hung on its stock behind the transom, the blade reaching into the water, the tiller over the gallery; optionally a
    raised house over the gallery (S3's big boat under the arch, u 20200-20450). tiller=False: unshipped (a boat
    worked by its sweep steers with it, and the sweep's crew stand where the tiller would lie). Returns (gallery x0,
    x1, deck z, the tiller's end (the stock's head when unshipped), the stock's x)."""
    x0 = H.x0
    zt = H.zs(x0)
    big = H.B > 3
    gal = 1.3 if big else 0.0
    yb = H.w(x0) + 0.05
    if gallery and gal:
        for yy in (yb, -yb):
            k.beam("timber", False, (x0 + 1.6, yy, zt + 0.02), (x0 - gal, yy * 0.96, zt + 0.12), 0.14, 0.16,
                   0.02 if lod == 0 else 0)
        n = max(3, round((gal + 0.4) / 0.3)) if lod == 0 else 2
        for i in range(n):
            xa = x0 + 0.3 - (gal + 0.3) * i / n
            kv.plank("deck", (xa - 0.12, yb), (xa - 0.12, -yb), (gal + 0.3) / n - 0.02, zt + 0.18, zt + 0.23, rng)
        xr = x0 - gal + 0.08
        for yy in (yb * 0.95, 0.0, -yb * 0.95):
            _bar("timber", (xr, yy, zt + 0.2), (xr, yy, zt + 0.95), 0.07, 0.07)
        _bar("timber", (xr, yb * 0.95, zt + 0.9), (xr, -yb * 0.95, zt + 0.9), 0.07, 0.07)
        for yy in (yb * 0.95, -yb * 0.95):
            _bar("timber", (xr, yy, zt + 0.9), (x0 + 0.4, yy, zt + 0.9), 0.06, 0.06)
    xstock = x0 * 0.55 + (0.18 if big else 0.05)
    if frame and not big:      # B6: the lashed stern frame; the rudder hangs at its after crossbeam
        fx, fz = _stern_frame(H, lod)
        xstock = fx + 0.12
    zr = -0.9 if big else -0.4
    if rudder:
        k.beam("lattice", False, (xstock, 0, zr), (xstock, 0, zt + (0.75 if big else 0.2)), 0.16 if big else 0.09,
               0.16 if big else 0.09, 0.03 if lod == 0 else 0)
        bw = 1.25 if big else 0.55
        hi = 0.35 if big else 0.15
        blade = [(xstock, zr), (xstock, hi), (xstock - bw * 0.85, hi * 0.6), (xstock - bw, -0.1), (xstock - bw, zr + 0.25),
                 (xstock - bw * 0.8, zr)]
        _vslab("timber", blade, -0.045, 0.045)
        if lod == 0:
            for z in (zr + 0.35, -0.05):
                _bar("lattice", (xstock + 0.02, 0, z), (xstock - bw * 0.95, 0, z), 0.1, 0.06)
    else:
        tiller = False
    zt_ = zt + (0.6 if big else 0.12)
    if tiller:
        tiller_end = V((xstock + (2.0 if big else 1.0), 0, zt_ + 0.05))
        k.beam("timber", False, (xstock - 0.15, 0, zt_), tiller_end, 0.09, 0.09, 0.015 if lod == 0 else 0)
    else:
        tiller_end = V((xstock, 0, zt + (0.75 if big else 0.2)))
    if house and big:
        hx0, hx1 = x0 - gal + 0.15, x0 + 2.4
        zh = zt + 0.2
        for xx in (hx0, hx1):
            for yy in (yb * 0.9, -yb * 0.9):
                _bar("timber", (xx, yy, zh), (xx, yy, zh + house_h), 0.11, 0.11)
        for yy, side in ((yb * 0.9, 1), (-yb * 0.9, -1)):
            _wall_quad("deck", hx0, hx1, zh, zh + 0.75, yy, side)
            _bar("timber", (hx0, yy, zh + 0.75), (hx1, yy, zh + 0.75), 0.08, 0.08)
            _bar("timber", (hx0, yy, zh + house_h - 0.05), (hx1, yy, zh + house_h - 0.05), 0.09, 0.09)
        _board_roof(hx0 - 0.35, hx1 + 0.35, yb * 0.9 + 0.35, zh + house_h, 0.22, rng, lod, panel=0.9)
        with S.node("roof__col"):
            _roof_collider(hx0, hx1, yb * 0.9, zh, zh + house_h, zh + house_h + 0.24)
    return x0 - gal + 0.1, x0 + 0.4, zt + 0.23, tiller_end, xstock


# ---------------------------------------------------------------- rig: the A-frame mast, the sweep, oars

def _mast(H, drop, x_m, height, angle_deg, lod, tow_to=None, crutch=True):
    """The A-frame mast (人字桅): two legs stepped in tabernacles at the deck's sides, meeting at a masthead block,
    rungs between them (the painted ladder look, S3 u 16050-16120); stays to the bow and the stern quarters, a
    tow line from the masthead to `tow_to` (boat frame, world-fixed). angle_deg: 0 upright, positive leaning aft about
    the axis through the feet (50 being lowered under the arch, S3 u 19900-20300; 82 lying down). The legs, rungs and
    head are node `mast` (pivot at the feet's axis, built upright, turned by the node); the tabernacles are the body's.
    Returns the masthead (boat frame, at the built angle)."""
    zd = H.deck_z(x_m, drop)
    spread = min(H.inner(x_m, zd) - 0.3, 1.3)
    piv = V((x_m, 0, zd + 0.35))
    a = math.radians(angle_deg)
    for side in (1, -1):
        for dx in (-0.16, 0.16):
            _bar("lattice", (x_m + dx, side * spread, zd - 0.05), (x_m + dx, side * spread, zd + 0.75), 0.1, 0.18)
        _bar("lattice", (x_m - 0.22, side * spread, zd + 0.35), (x_m + 0.22, side * spread, zd + 0.35), 0.06, 0.06)
    head_up = piv + UP * height
    with S.node("mast", origin=piv, rot_y=-a, extras={"anim": "mast", "axis_gltf": [0, 0, 1], "angle_deg": angle_deg,
                                                       "range_deg": [max(0, angle_deg - 10), min(88, angle_deg + 10)]}):
        for side in (1, -1):
            foot = piv + V((0, side * spread, 0))
            top = piv + V((0, side * 0.12, height))
            sb.cyl("timber", False, foot, top, 0.11, 0.075, segs=6 if lod == 0 else 4)
        nr = 7 if lod == 0 else 2
        for r in range(1, nr + 1):
            s = r / (nr + 1.4)
            _bar("timber", piv + V((0, spread + (0.12 - spread) * s, height * s)),
                 piv + V((0, -spread - (0.12 - spread) * s, height * s)), 0.06, 0.06)
        k.beam("lattice", False, head_up - UP * 0.15, head_up + UP * 0.35, 0.26, 0.26, 0.04 if lod == 0 else 0)
    S.point("pt_masthead", "mast", head_up - piv, None)
    rot = Matrix.Translation(piv) @ Matrix.Rotation(-a, 4, "Y") @ Matrix.Translation(-piv)
    head = rot @ head_up
    n = 4 if lod == 0 else 1
    hl = head_up - piv
    fore = V((H.x1 - 0.7, 0, H.zs(H.x1 - 0.7) + 0.1))
    S.line("forestay", ("mast", hl, head), ("body", fore, fore), sag=0.0 if angle_deg > 10 else 0.005, n=n)
    S.point("pt_haul", "body", fore, fore)
    for side, nm in ((1, "p"), (-1, "s")):
        aft = V((H.x0 + 1.2, side * (H.w(H.x0 + 1.2) - 0.1), H.zs(H.x0 + 1.2) + 0.05))
        S.line(f"backstay_{nm}", ("mast", hl, head), ("body", aft, aft), sag=0.05 if angle_deg > 10 else 0.01, n=n)
        if lod == 0:
            bp = V((x_m - 0.6, side * (H.w(x_m) - 0.05), H.zs(x_m) + 0.05))
            hl2 = hl - UP * 0.3
            S.line(f"shroud_{nm}", ("mast", hl2, rot @ (piv + hl2)), ("body", bp, bp), sag=0.06 if angle_deg > 10 else 0.005, n=3)
    if tow_to is not None:
        S.line("tow", ("mast", hl, head), (None, V(tow_to), V(tow_to)), sag=0.012, r=0.016, n=8 if lod == 0 else 3)
    if angle_deg > 70 and crutch:      # the crutch the lowered mast rests on, at the stern
        xc = H.x0 + 1.0
        zc = H.deck_z(xc, drop)
        for side in (1, -1):
            _bar("timber", (xc, side * 0.35, zc), (xc, -side * 0.1, zc + 1.6), 0.08, 0.08)
    return head


SWEEP_AMP = 10.0     # choice: the sweep's sculling swing, degrees each way (the crew at its bar walk with it)


def _sweep(H, drop, side, lod, pin, bar_x, bar_y, chest=1.15, pose="work"):
    """The great sweep (大橹) as painted (S3 u 15550-16140, #6; S2 u 21850-22950, #16): its pin on the stern frame (the
    gallery) at the quarter, the loom running forward and inboard over the open after deck, nearly level, to a short
    crossbar at chest height where four to six men push it, standing on the after deck aft of any house; past the pin
    the shaft bends down astern into the water and ends in a long flat blade curling up at its tip; a lanyard from the
    loom to the deck. pin: the pivot (boat frame); bar_x, bar_y: where the crossbar's centre is. Node `sweep` (pivot at
    the pin: the page yaws it about its up axis to scull). Returns the bar's centre (boat frame)."""
    big = H.B > 3
    reach, out, z_tip, blade_len = (6.0, 1.8, -0.25, 2.4) if big else (3.0, 0.9, -0.15, 1.2)
    floor = (lambda x: H.deck_z(x, drop)) if big else (lambda x: H.zs(H.xm) - drop)   # noqa: E731 (a small boat's floor)
    P = V(pin)
    Hh = V((bar_x, bar_y, floor(bar_x) + chest))
    E = V((P.x - reach, P.y + side * out, z_tip))
    if pose == "rest":        # B5: at rest, its loom lying on the gunwale, the blade trailing flat on the water astern
        Hh = V((bar_x, bar_y, H.zs(bar_x) + 0.12))
        E = V((P.x - reach * 1.1, P.y + side * out * 0.45, 0.02))
    d1 = (Hh - P).normalized()          # the loom, inboard
    d2 = (P - E).normalized()           # the shaft, from the blade up to the pin
    Bp = E + d2 * blade_len
    zp = P.z - (0.45 if big else 0.3)
    _bar("lattice", (P.x, P.y, zp), (P.x, P.y, P.z - 0.03), 0.13 if big else 0.08, 0.13 if big else 0.08)
    with S.node("sweep", origin=P, extras={"anim": "sweep", "axis_gltf": [0, 1, 0],
                                           "amp_deg": SWEEP_AMP if pose == "work" else 0.0, "period_s": 2.8,
                                           **({"pose": pose} if pose != "work" else {})}):
        sb.cyl("bamboo", False, Hh + d1 * 0.12, P - d1 * 0.06, 0.075 if big else 0.05, segs=6 if lod == 0 else 4)
        sb.cyl("bamboo", False, P + d2 * 0.06, Bp, 0.072 if big else 0.048, 0.065 if big else 0.045,
               segs=6 if lod == 0 else 4)
        tipdir = (-d2 + UP * 0.35).normalized()
        pts = [Bp + d2 * 0.15, E + d2 * (0.8 if big else 0.4), E + tipdir * (0.35 if big else 0.2)]
        for a_, b_ in zip(pts, pts[1:]):
            k.beam("timber", False, a_, b_, 0.32 if big else 0.2, 0.06 if big else 0.04, 0)
        cb = d1.cross(UP).normalized() * (0.55 if big else 0.3)
        _bar("timber", Hh - cb, Hh + cb, 0.07, 0.07)
        q = V((Hh.x - 0.6, Hh.y - side * 0.2, 0))
        q.z = floor(q.x)
        kv._rope(Hh - d1 * 0.55, q, sag=0.0, r=0.012, n=2)
    S.point("pt_sweep_bar", "sweep", Hh - P, Hh)
    return Hh


def _open_spans(lo, hi, covers, margin=0.25):
    """The stretches of deck from lo to hi (boat x) that nothing covers: covers are (x0, x1) stretches under a roof,
    awning, hood or cargo mound, or taken by the bitts, a mast's feet or the tiller; each is kept `margin` clear."""
    spans, x = [], lo
    for a, b in sorted((a - margin, b + margin) for a, b in covers):
        if b <= x:
            continue
        if a > x:
            spans.append((x, min(a, hi)))
        x = max(x, b)
        if x >= hi:
            break
    if x < hi:
        spans.append((x, hi))
    return [(a, b) for a, b in spans if b - a > 0.05]


def _oar_pose(H, x, side, length, min_y):
    """One oar in its rowing pose: thole pin T on the gunwale at x, the blade's tip in the water outboard and a little
    aft, the grip inboard (at most so far that its rower, 0.5 m further in, stays `min_y` off the centre line on his
    own side). Returns (T, tip, d: tip -> thole, grip, the rower's spot)."""
    T = V((x, side * (H.w(x) - 0.03), H.zs(x) + 0.06))
    tip = V((x - 0.9, side * (H.w(x) + length * 0.62), -0.1))
    d = (T - tip).normalized()
    dh = V((d.x, d.y, 0)).normalized()
    g = length * 0.32
    if abs(d.y) > 1e-6:
        g = max(0.3, min(g, (abs(T.y) - min_y - 0.5 * abs(dh.y)) / abs(d.y)))
    grip = T + d * g
    return T, tip, d, grip, grip + dh * 0.5


def _oar_stations(H, n, spans, length, min_y, gap, fore_first, abreast):
    """n oars a side: their thole stations, each rower's spot on open deck. abreast (a big boat, its rowers at least
    0.6 m apart across the deck): n pairs, port and starboard at one x, `gap` apart; else 2n stations, port and
    starboard in turn, `gap` apart. The spans in order (fore_first: the foredeck first, where the painted crews work;
    else amidships first, then the longest), as many stations in each as fit, centred in it. Returns
    ([(thole x, side)], crowded)."""
    if fore_first:
        order = sorted(spans, key=lambda s_: -s_[0])
    else:
        mid = H.lw / 2
        order = sorted(spans, key=lambda s_: (not (s_[0] <= mid <= s_[1]), -(s_[1] - s_[0])))
    want, rx = (n if abreast else 2 * n), []          # the rowers' x (the stations' spots)
    for a, b in order:
        if len(rx) >= want:
            break
        room = (b - a) - 0.3            # the spans are already kept 0.25 m clear of what covers the deck
        if room < 0:
            continue
        kk = min(want - len(rx), int(room / gap) + 1)
        c = (a + b) / 2
        rx += [c - (kk - 1) * gap / 2 + gap * i for i in range(kk)]
    crowded = len(rx) < want
    if crowded:      # no room left on open deck: the rest share the longest stretch of it (noted, not silent)
        a, b = max(spans, key=lambda s_: s_[1] - s_[0]) if spans else (H.lw * 0.4, H.lw * 0.6)
        rest = want - len(rx)
        rx += [a + 0.15 + (b - a - 0.3) * (i + 0.5) / rest for i in range(rest)]
    out = []
    for i, x in enumerate(sorted(rx)):
        for side in ((1, -1) if abreast else ((1,) if i % 2 == 0 else (-1,))):
            dx = _oar_pose(H, x, side, length, min_y)[4].x - x       # the rower stands this far forward of his thole
            out.append((x - dx, side))
    return out, crowded


def _oars(H, drop, stations, lod, length=None, min_y=None):
    """Oars in the rowing pose, one per station (its thole's x, side): each over a thole pin on the gunwale down into
    the water, its grip inboard over the open deck where its rower stands (the caller picks the stations there: a roof,
    awning or cabin over a rower hides him). Each oar is its own node (oar_p<i> / oar_s<i>, pivot at the thole; its grip
    is pt_oar_p<i> / pt_oar_s<i>). Returns the rowers' spots (boat frame)."""
    big = H.B > 3
    length = length or (4.2 if big else 2.6)
    min_y = min_y if min_y is not None else (0.3 if big else 0.15)
    count, spots = {1: 0, -1: 0}, []
    for x, side in stations:
        nm = "p" if side > 0 else "s"
        i = count[side]
        count[side] += 1
        T, tip, d, grip, spot = _oar_pose(H, x, side, length, min_y)
        _bar("lattice", (x, T.y, T.z - 0.11), T + UP * 0.12, 0.05, 0.05)
        with S.node(f"oar_{nm}{i}", origin=T, extras={"anim": "oar", "axis_gltf": [0, 1, 0], "roll_axis_gltf": [1, 0, 0],
                                                       "amp_deg": 22, "period_s": 2.2}):
            sb.cyl("bamboo", False, grip, tip + d * 0.9, 0.04, 0.035, segs=5 if lod == 0 else 4)
            k.beam("timber", False, tip + d * 0.95, tip, 0.18, 0.04, 0)
        S.point(f"pt_oar_{nm}{i}", f"oar_{nm}{i}", grip - T, grip)
        spots.append(spot)
    return spots


# ---------------------------------------------------------------- holds and awnings

def _awnings(H, drop, x0, x1, n, lod, z_eave=None, rise=1.35, hw=None):
    """Arched woven-mat awnings (篷) over a hold or a small boat's middle, in n sections stepping up toward the middle
    like the painted telescoping roofs, each on bent hoops (kit_vehicles.barrel_cover); their colliders' tops are the
    awnings' crowns. Returns the highest crown."""
    L = x1 - x0
    crowns = []
    for i in range(n):
        xa = x0 + L * i / n - (0.04 if i else 0)
        xb = x0 + L * (i + 1) / n + 0.04
        zd = max(H.deck_z(xa, drop), H.deck_z(xb, drop))
        bump = 0.12 * (1 - abs((i + 0.5) / n - 0.5) * 2)
        h_w = hw or min(H.inner(xa, zd), H.inner(xb, zd)) + 0.06
        ze = z_eave if z_eave is not None else zd + 0.15
        zs_, zt = ze + rise * 0.3 + bump, ze + rise + bump
        kv.barrel_cover(xa, xb, h_w, ze, zs_, zt, hoops=max(2, round((xb - xa) / 0.8) + 1) if lod == 0 else 2,
                        thick=0.035)
        crowns.append(zt)
        with S.node("roof__col"):
            _roof_collider(xa, xb, h_w, min(zd, ze), zs_, zt - 0.02)
    return max(crowns)


def _laden_hold(H, drop, x0, x1, rng, lod, heap=0.75):
    """The deep-laden grain boat's hold (万石船, S2 u 27250-28900): a coaming round the hatch, the grain heaped under a
    woven mat cover bulging above it, lashed with ropes across and one along the crown. The mound's top is walkable
    (deck__col): porters and the owner stand and sit on the cargo. Returns the crown z."""
    nu, nv = (10, 8) if lod == 0 else (5, 4)
    xs = [x0 + (x1 - x0) * i / nu for i in range(nu + 1)]
    hw = [H.inner(x, H.deck_z(x, drop)) - 0.25 for x in xs]
    zc = [H.deck_z(x, drop) + 0.18 for x in xs]
    for side in (1, -1):
        kv._polybeam("lattice", [V((x, side * (w + 0.05), z)) for x, w, z in zip(xs, hw, zc)], 0.12, 0.2,
                     0.02 if lod == 0 else 0)
    for x, w, z in ((xs[0], hw[0], zc[0]), (xs[-1], hw[-1], zc[-1])):
        _bar("lattice", (x, w + 0.05, z), (x, -w - 0.05, z), 0.12, 0.2)

    def mound(nu_, nv_, jitter):
        verts = []
        for i in range(nu_ + 1):
            f = i / nu_
            x = x0 + (x1 - x0) * f
            w = H.inner(x, H.deck_z(x, drop)) - 0.25
            z0 = H.deck_z(x, drop) + 0.18
            hx = heap * (1 - abs(2 * f - 1) ** 3)
            for j in range(nv_ + 1):
                v = -1 + 2 * j / nv_
                z = z0 + 0.08 + hx * (1 - abs(v) ** 2.2) ** 0.8 + (rng.uniform(-0.02, 0.02) if jitter and 0 < j < nv_ else 0)
                verts.append(V((x, v * w * (1.02 - 0.06 * abs(v)), z)))
        m = nv_ + 1
        faces = [(i * m + j, (i + 1) * m + j, (i + 1) * m + j + 1, i * m + j + 1) for i in range(nu_) for j in range(nv_)]
        return verts, faces, m
    verts, faces, m = mound(nu, nv, True)
    uvs = [[(verts[f[0]].x, (f[0] % m) * 0.6), (verts[f[1]].x, (f[1] % m) * 0.6), (verts[f[2]].x, (f[2] % m) * 0.6),
            (verts[f[3]].x, (f[3] % m) * 0.6)] for f in faces]
    _add("reed", verts, faces, V(((x0 + x1) / 2, 0, zc[0] - 1.0)), uvs)
    cv, cf, _ = mound(4, 3, False)
    with S.node("deck__col"):
        _add("hidden", [p - V((0, 0, 0.03)) for p in cv], cf, V(((x0 + x1) / 2, 0, zc[0] - 1.0)), collide=True)
    for i in range(0, nu + 1, 2 if lod == 0 else 3):
        line = [verts[i * m + j] + V((0, 0, 0.03)) for j in range(0, nv + 1, 1 if lod == 0 else 2)]
        sb.tube("rope", False, line, [0.018] * len(line), segs=4)
    crown = [verts[i * m + nv // 2] + V((0, 0, 0.03)) for i in range(nu + 1)]
    sb.tube("rope", False, crown, [0.02] * len(crown), segs=4)
    return max(p.z for p in verts)


def _hatches(H, drop, x0, x1, rng, lod):
    """Flat hatch boards across a hold, between two coaming rails (the grain boat's bow end, S2 u 27300-27450)."""
    n = max(2, round((x1 - x0) / 0.55)) if lod == 0 else 2
    for i in range(n):
        xa = x0 + (x1 - x0) * i / n
        xb = x0 + (x1 - x0) * (i + 1) / n - 0.03
        x = (xa + xb) / 2
        zd = H.deck_z(x, drop) + 0.2
        w = H.inner(x, zd) - 0.3
        kv.plank("deck", (x, w), (x, -w), xb - xa, zd, zd + 0.05, rng)
    for side in (1, -1):
        _bar("lattice", (x0, side * (H.inner(x0, H.deck_z(x0, drop)) - 0.25), H.deck_z(x0, drop) + 0.1),
             (x1, side * (H.inner(x1, H.deck_z(x1, drop)) - 0.25), H.deck_z(x1, drop) + 0.1), 0.1, 0.2)


def _thwarts(H, drop, rng, lod, n=3):
    """An open small boat's insides: floor boards low in the hull, thwarts across at the gunwale, frames up the sides
    (S2 u 21950-22300). Returns the floor's z."""
    x0, x1 = H.lw * 0.1, H.lw * 0.9
    zf = H.zs(H.xm) - drop
    nb = max(2, round((x1 - x0) / (1.0 if lod == 0 else 2.5)))
    for i in range(nb):
        x = x0 + (x1 - x0) * (i + 0.5) / nb
        w = H.inner(x, zf) - 0.02
        kv.plank("deck", (x, w), (x, -w), (x1 - x0) / nb - 0.03, zf - 0.04, zf, rng)
    for i in range(n):
        x = H.lw * (0.25 + 0.5 * i / max(1, n - 1))
        zt = H.zs(x) - 0.08
        w = H.inner(x, zt) - 0.01
        kv.plank("deck", (x, w), (x, -w), 0.24, zt - 0.05, zt, rng)
    if lod == 0:
        for i in range(7):
            x = H.lw * (0.15 + 0.7 * i / 6)
            for side in (1, -1):
                _bar("timber", (x, side * (H.inner(x, zf) - 0.03), zf),
                     (x, side * (H.inner(x, H.zs(x)) - 0.04), H.zs(x) - 0.05), 0.06, 0.06)
    return zf


def _cloths(H, rng, lod, z_eave, rise):
    """Laundry hung along the small boat's awning (S2 u 22300-22720): cloths over a pole at the awning's side,
    hanging down."""
    x0, x1 = H.lw * 0.32, H.lw * 0.7
    n = 4 if lod == 0 else 2
    zp = z_eave + rise * 0.45
    for i in range(n):
        xa = x0 + (x1 - x0) * i / n + 0.06
        xb = x0 + (x1 - x0) * (i + 1) / n - 0.06
        y = H.inner((xa + xb) / 2, z_eave) + 0.2
        hang = rng.uniform(0.6, 0.9)
        q = [V((xa, y, zp)), V((xb, y, zp)), V((xb - 0.05, y + 0.06, zp - hang)),
             V((xa + 0.04, y + 0.05, zp - hang * rng.uniform(0.8, 1.0)))]
        kv._quad2(rng.choice(("cloth_white", "cloth_indigo", "cloth_white")), *q)
    sb.cyl("bamboo", False, (x0 - 0.1, H.inner(x0, z_eave) + 0.2, zp + 0.02), (x1 + 0.1, H.inner(x1, z_eave) + 0.2, zp + 0.02),
           0.025, segs=4)


# ---------------------------------------------------------------- deck cargo

DEFAULT_CARGO = {
    # what the scroll paints on the model boats of each kind (gen/boats/types.md); a section passes the map's own
    "passenger": [("coil", 0.92, 0.45, "deck"), ("coil", 0.9, -0.5, "deck"), ("roll", 0.3, 0.3, "roof"),
                  ("basket", 0.36, -0.55, "roof"), ("basket", 0.42, -0.1, "roof")],
    "grain": [("coil", 0.86, 0.6, "deck"), ("basket", 0.83, -0.6, "deck")],
    "small": [("basket", 0.2, 0.0, "deck")],
}


def _cargo(items, H, drop, z_at, rng, lod=0):
    """Deck and roof cargo as painted: (kind, x_frac, y, level), kind coil | basket | roll | sack | crate | jar;
    x_frac along the waterline length, y metres to port, level 'deck' or 'roof'."""
    for kind, xf, y, level in items:
        x = H.lw * xf
        z = z_at(x, y, level)
        c = V((x, y, z))
        if kind == "coil":
            _coil(c, 0.32, segs=10 if lod == 0 else 6)
        elif kind == "basket":
            _basket(c, 0.28, 0.42, segs=10 if lod == 0 else 6)
        elif kind == "roll":
            _mat_roll(c + V((-0.7, 0, 0.17)), c + V((0.7, 0, 0.17)), 0.17)
        elif kind == "sack":
            kv.soft_sack(c, 0.85, 0.48, 0.36, rng.uniform(-0.3, 0.3), rng)
        elif kind == "crate":
            k.soft_box("timber", False, (c.x - 0.35, c.y - 0.28, c.z), (c.x + 0.35, c.y + 0.28, c.z + 0.45), rng,
                       r=0.03, wob=0.005, tilt=0.01)
        elif kind == "jar":
            kv._lathe_axis("jar_red", c, UP, V((1, 0, 0)), V((0, 1, 0)),
                           [(0.12, 0.0), (0.24, 0.15), (0.26, 0.35), (0.16, 0.55), (0.11, 0.6)], segs=8)


# ---------------------------------------------------------------- round 2 options (catalogue §4 B1-B11, S4b's asks)
# Every option below is off by default, so the existing presets build as before.

PLANK_HALF = 0.42     # the page's walkable corridor half-width round a gangplank (web/src/boats.js: 0.84 m)
PLANK_INSET = 0.25    # choice: how far the plank's deck end reaches past the deck's edge (the rim line) onto the deck
RIM_HALF = PLANK_HALF + 0.1   # the rim's opening round the corridor: 0.1 m wider each side than the page's rails, so the
#                               page's own rails stand inside it and its end-wall test finds no wall across the corridor


def _rim_loop(H, drop, x_from, x_to, step=2.0):
    """The deck's edge as _rim_walls builds it: a closed loop of (x, y, z) points in the boat frame, the port side from
    x_from to x_to, across the bow end, the starboard side back, across the stern end. Returns (points, the index of each
    side's first and last point: (port0, port1, stbd0, stbd1))."""
    n = max(2, round((x_to - x_from) / step) + 1)
    xs = [x_from + (x_to - x_from) * i / (n - 1) for i in range(n)]
    port = [V((x, H.inner(x, H.deck_z(x, drop)), H.deck_z(x, drop))) for x in xs]
    stbd = [V((p.x, -p.y, p.z)) for p in reversed(port)]
    return port + stbd, (0, n - 1, n, 2 * n - 1)


def _seg_x(p, d, a, b):
    """Where the plan ray p + d s meets the segment a-b: (s, t along a-b) or None."""
    ex, ey = b.x - a.x, b.y - a.y
    den = d.x * ey - d.y * ex
    if abs(den) < 1e-12:
        return None
    wx, wy = a.x - p.x, a.y - p.y
    s = (wx * ey - wy * ex) / den
    t = (wx * d.y - wy * d.x) / den
    return (s, t) if -1e-9 <= t <= 1 + 1e-9 else None


def _first_hit(p, d, loop):
    """The first crossing (smallest s > 0) of the plan ray p + d s with the closed loop: (s, edge index, t)."""
    best = None
    for i in range(len(loop)):
        a, b = loop[i], loop[(i + 1) % len(loop)]
        r = _seg_x(p, d, a, b)
        if r and r[0] > 1e-6 and (best is None or r[0] < best[0]):
            best = (r[0], i, r[1])
    return best


def _inside2(p, loop):
    c = False
    n = len(loop)
    for i in range(n):
        a, b = loop[i], loop[(i + 1) % n]
        if (a.y > p.y) != (b.y > p.y) and p.x < a.x + (b.x - a.x) * (p.y - a.y) / (b.y - a.y):
            c = not c
    return c


def _plank_landing(H, drop, kind, g, x_from, x_to, land=None):
    """Where the gangplank from the bank point g (boat frame, at the bank's height) meets the deck, at any angle (the
    S4b fault: a plank meeting a tapering bow at 15 degrees left a 0.22 m slot in the rail and the end walls across its
    way). The corridor the page walks (PLANK_HALF either side of the plank) is cut out of the rim exactly where its two
    rails cross the deck's edge; the rim then runs in along each rail to a short piece square across the corridor
    PLANK_INSET past the later crossing (the plank's deck end lies on its middle), so the rail opening and the end walls
    follow the plank's real line. land: None or 'square' (default: the plank comes square to the nearest stretch of the
    deck's edge, a side or a grain boat's bow end, the corridor clear of its corners), 'abreast' (the old landing: on the
    gunwale abreast of the foot), or (x_frac, y) a deck point the plank is aimed at. Returns a dict (A: the deck end,
    d: the plank's direction inboard, cut: the rim reroute, cross: the corridor's crossings of the gunwale outline,
    note), or None when the corridor misses the deck (then the old landing is used)."""
    loop, (p0, p1, s0, s1) = _rim_loop(H, drop, x_from, x_to)
    G = V((g.x, g.y, 0.0))
    flat = [V((p.x, p.y, 0.0)) for p in loop]
    if _inside2(G, flat):
        return None
    if land in (None, "square"):
        cands = []
        groups = [list(range(p0, p1 + 1)), list(range(s0, s1 + 1))]
        if kind == "grain":
            groups.append([p1, s0])           # the bow end (its horns, no stem post across it)
        margin = PLANK_HALF + 0.25
        for grp in groups:
            pts = [flat[i] for i in grp]
            acc = [0.0]
            for a, b in zip(pts, pts[1:]):
                acc.append(acc[-1] + (b - a).length)
            Lg = acc[-1]
            if Lg < 2 * margin:
                continue
            for a, b, la, lb in zip(pts, pts[1:], acc, acc[1:]):
                e = b - a
                L2 = e.length_squared
                t = max(0.0, min(1.0, (G - a).dot(e) / L2)) if L2 > 1e-12 else 0.0
                s = la + (lb - la) * t
                s = max(margin, min(Lg - margin, s))
                # the point at arc length s on the group
                for a2, b2, la2, lb2 in zip(pts, pts[1:], acc, acc[1:]):
                    if la2 - 1e-9 <= s <= lb2 + 1e-9:
                        q = a2.lerp(b2, (s - la2) / max(1e-9, lb2 - la2))
                        cands.append(((q - G).length, q))
                        break
        if not cands:
            return None
        target = min(cands, key=lambda c: c[0])[1]
    elif land == "abreast":
        xg = max(H.x0 + 1.0, min(H.x1 - 1.0, g.x))
        side = 1 if g.y > 0 else -1
        target = V((xg, side * (H.w(xg) - 0.1), 0.0))
    else:
        target = V((H.lw * land[0], land[1], 0.0))
    d = target - G
    if d.length < 0.3:
        return None
    d.normalize()
    w = V((-d.y, d.x, 0.0))
    hits = []
    for sgn in (-1, 1):
        h = _first_hit(G + w * (sgn * RIM_HALF), d, flat)
        if h is None:
            return None
        hits.append((sgn, h))
    hc = _first_hit(G, d, flat)
    if hc is None:
        return None
    s_in = max(h[1][0] for h in hits) + PLANK_INSET
    A2 = G + d * s_in
    P = {sgn: G + w * (sgn * RIM_HALF) + d * s_in for sgn in (-1, 1)}
    if not all(_inside2(P[sgn], flat) for sgn in (-1, 1)):
        return None
    # the loop between the two crossings that lies inside the corridor is replaced by the reroute
    n = len(flat)
    pos = {}
    for sgn, (s, i, t) in hits:
        pos[sgn] = (i + t, G + w * (sgn * RIM_HALF) + d * s)
    ta, tb = pos[-1][0], pos[1][0]
    fwd = (tb - ta) % n                    # going forward from rail -1's crossing to rail +1's
    mid_t = (ta + fwd / 2) % n
    mi = int(mid_t) % n
    mp = flat[mi].lerp(flat[(mi + 1) % n], mid_t - int(mid_t))
    inside_fwd = abs((mp - G).dot(w)) < RIM_HALF
    if inside_fwd:      # the replaced stretch runs forward from -1 to +1: keep the rest, from +1 round to -1
        first, last = 1, -1
    else:
        first, last = -1, 1
    zdk = lambda p: H.deck_z(p.x, drop)    # noqa: E731
    # the kept loop: from `first`'s crossing forward round to `last`'s crossing
    t_start, t_end = pos[first][0], pos[last][0]
    kept = [pos[first][1]]
    i = int(math.floor(t_start)) + 1
    span = (t_end - t_start) % n
    steps = int(math.floor(t_start + span)) - int(math.floor(t_start))
    for kk in range(steps):
        kept.append(flat[(i + kk) % n])
    kept.append(pos[last][1])
    kept3 = [V((p.x, p.y, zdk(p))) for p in kept]
    rer = [pos[last][1], P[last], P[first], pos[first][1]]
    rer3 = [V((p.x, p.y, zdk(p))) for p in rer]
    note = None
    ang = math.degrees(math.acos(max(-1.0, min(1.0, abs(d.dot((flat[hc[1]] - flat[(hc[1] + 1) % n]).normalized()))))))
    if ang < 60:
        note = f"gangplank meets the deck's edge at {ang:.0f} deg: the rim follows its rails {s_in - min(h[1][0] for h in hits):.1f} m in"
    # the gunwale outline crossings (for the boarding edge)
    gun = [V((x, H.y(x, H.zs(x)), 0.0)) for x in H.xs if x_from - 0.3 <= x <= x_to + 0.3]
    gun = gun + [V((p.x, -p.y, 0.0)) for p in reversed(gun)]
    cross = []
    for sgn in (-1, 0, 1):
        h = _first_hit(G + w * (sgn * PLANK_HALF), d, gun)
        if h:
            cross.append(G + w * (sgn * PLANK_HALF) + d * h[0])
    return dict(A=V((A2.x, A2.y, 0.0)), d=d, w=w, s_in=s_in, cut=(kept3, rer3), cross=cross, note=note,
                hc=G + d * hc[0], open=(V((P[-1].x, P[-1].y, zdk(P[-1]))), V((P[1].x, P[1].y, zdk(P[1])))))


def _rim_walls_cut(kept, rer, step=2.0):
    """Hidden 1.0 m rim walls along the kept stretch of the deck's edge (in pieces of about `step`) and along the
    plank's reroute (in along one rail, square across the corridor, out along the other), each piece its own quad (the
    page opens the piece nearest the plank's deck end: the square one)."""
    def piece(a, b):
        mid = (a + b) / 2
        q = [a - UP * 0.1, b - UP * 0.1, b + UP * 1.0, a + UP * 1.0]
        n = (b - a).cross(UP)
        _add("hidden", q, [(0, 1, 2, 3)], mid + UP * 0.5 + (n.normalized() if n.length > 1e-9 else V((1, 0, 0))) * 1.0,
             collide=True)
    # the kept stretch: its own vertices, long runs split into about `step`
    run, acc = [kept[0]], 0.0
    for a, b in zip(kept, kept[1:]):
        L = (b - a).length
        if L < 1e-6:
            continue
        m = max(1, round(L / step))
        for j in range(1, m + 1):
            run.append(a.lerp(b, j / m))
    merged = [run[0]]
    for p in run[1:]:     # join collinear short bits up to `step`
        merged.append(p)
    for a, b in zip(merged, merged[1:]):
        if (b - a).length > 1e-4:
            piece(a, b)
    for a, b in zip(rer, rer[1:]):
        L = (b - a).length
        if L < 1e-4:
            continue
        m = max(1, round(L / step))
        for j in range(m):
            piece(a.lerp(b, j / m), a.lerp(b, (j + 1) / m))


def _board_edge_cut(H, x_from, x_to, cross, step=1.0):
    """The boarding edge (as _board_edge) with extra vertices exactly where the plank's corridor crosses the gunwale,
    so the gunwale's true height is there for a contact test at the plank (crossings on a side add stations; on an end
    they split the closing span)."""
    n = max(3, round((x_to - x_from) / step) + 1)
    xs = [x_from + (x_to - x_from) * i / (n - 1) for i in range(n)]
    side_x = {1: [], -1: []}
    end_pts = {1: [], -1: []}
    for c in cross:
        if x_from + 0.02 < c.x < x_to - 0.02 and abs(abs(c.y) - H.y(c.x, H.zs(c.x))) < 0.25:
            side_x[1 if c.y > 0 else -1].append(c.x)
        else:
            end_pts[1 if c.x > (x_from + x_to) / 2 else -1].append(c.y)
    ring_p = sorted(set(xs + side_x[1]))
    ring_s = sorted(set(xs + side_x[-1]))
    loop = [V((x, H.y(x, H.zs(x)), H.zs(x))) for x in ring_p]
    xb = ring_p[-1]
    loop += [V((xb, y, H.zs(xb))) for y in sorted(end_pts[1], reverse=True)]
    loop += [V((x, -H.y(x, H.zs(x)), H.zs(x))) for x in reversed(ring_s)]
    xa = ring_s[0]
    loop += [V((xa, y, H.zs(xa))) for y in sorted(end_pts[-1])]
    m = len(loop)
    verts = []
    for p in loop:
        on_end = abs(abs(p.y) - H.y(p.x, H.zs(p.x))) > 0.05
        inw = (V((-1 if p.x > (x_from + x_to) / 2 else 1, 0, 0)) if on_end else V((0, -1 if p.y > 0 else 1, 0))) * 0.3
        verts += [p, p + inw]
    faces = [(2 * i, 2 * ((i + 1) % m), 2 * ((i + 1) % m) + 1, 2 * i + 1) for i in range(m)]
    _add("hidden", verts, faces, V(((x_from + x_to) / 2, 0, -5.0)))


# ---- B1: awnings anywhere

def _shell(xs, hw, ze, zs_, zt, mat="reed", thick=0.035, hoop_mat="timber", hoops=True, rng=None):
    """An arched woven-mat shell lofted through stations xs (along the boat), each with its own half-width, eave,
    shoulder and crown (kit_vehicles._arch_profile rings): top and underside, rims along both eaves and at both ends,
    bent hoops at the stations. A tapered run makes a hood that overhangs and comes down to a point."""
    rings, inner = [], []
    for x, h, e, s_, t in zip(xs, hw, ze, zs_, zt):
        prof = kv._arch_profile(h, e, s_, t)
        rings.append([V((x, y, z)) for (y, z, _, _) in prof])
        inner.append([V((x, y - ny * thick, z - nz * thick)) for (y, z, ny, nz) in prof])
    n = len(rings[0])
    tile = sb.MATERIALS[mat][1]
    arc = [0.0]
    for p, q in zip(rings[0], rings[0][1:]):
        arc.append(arc[-1] + (q - p).length)
    for shell, inward in ((rings, False), (inner, True)):
        verts = [p for r in shell for p in r]
        faces, uvs, ins = [], [], []
        for i in range(len(xs) - 1):
            for j in range(n - 1):
                faces.append((i * n + j, (i + 1) * n + j, (i + 1) * n + j + 1, i * n + j + 1))
                uvs.append([(xs[i] / tile, arc[j] / tile), (xs[i + 1] / tile, arc[j] / tile),
                            (xs[i + 1] / tile, arc[j + 1] / tile), (xs[i] / tile, arc[j + 1] / tile)])
                fc = sum((verts[q] for q in faces[-1]), V((0, 0, 0))) / 4
                ax = V((fc.x, 0, min(ze) - 0.3))
                ins.append(fc + (fc - ax) if inward else ax)
        _add(mat, verts, faces, ins, uvs)
    for i in (0, len(xs) - 1):
        for j in range(n - 1):
            q = [rings[i][j], rings[i][j + 1], inner[i][j + 1], inner[i][j]]
            sgn = -1 if i == 0 else 1
            _add(mat, q, [(0, 1, 2, 3)], (q[0] + q[2]) / 2 - V((sgn * 0.5, 0, 0)))
    for j in (0, n - 1):
        for i in range(len(xs) - 1):
            q = [rings[i][j], rings[i + 1][j], inner[i + 1][j], inner[i][j]]
            _add(mat, q, [(0, 1, 2, 3)], V(((q[0].x + q[1].x) / 2, 0, (q[0].z + q[1].z) / 2 + 0.3)))
    if hoops:
        for i, x in enumerate(xs):
            pts = rings[i]
            prof = kv._arch_profile(hw[i], ze[i], zs_[i], zt[i])
            nrms = [V((0, ny, nz)) for (_, _, ny, nz) in prof]
            bw = 0.1 if i in (0, len(xs) - 1) else 0.05
            kv._sweep_rect(hoop_mat, pts, nrms, V((1, 0, 0)), -0.004, 0.028, -bw / 2, bw / 2, sides=(0, 1, 2), caps=True)


def _posts_roof_collider(xa, xb, hw, z, th=0.12):
    """Hidden: the top of a roof on posts (walkers pass under it; crew can stand on it)."""
    v = [V((xa, -hw, z - th)), V((xb, -hw, z - th)), V((xb, hw, z - th)), V((xa, hw, z - th))]
    v += [p + UP * th for p in v]
    _add("hidden", v, [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)],
         V(((xa + xb) / 2, 0, z - th / 2)), collide=True)


def _awning(H, drop, kind, x0, x1, style, lod, rng, opts=None):
    """One awning (catalogue B1) over the deck from x0 to x1 (boat frame metres), independent of the hold:
    'arch'   arched woven mat on hoops (as the grain boat's), its eaves at the deck;
    'hood'   an arched mat hood whose `end` ('fore' | 'aft') overhangs the deck by `over` and comes down and in to a
             point (the painted bow and stern hoods);
    'flat'   a flat mat roof on posts, a little cambered, with a slatted eave valance along both sides;
    'gable'  a two-slope mat roof on posts, ridge along the boat, open gable ends with a ridge pole;
    'canopy' a mat canopy on four or more posts, sagging a little between its edge poles.
    opts: h (eave above the deck), w (half-width), rise, mat ('reed'; 'bark' for the painted dark mats), end, over,
    z (an absolute eave height in the boat frame). Returns (crown z, (xa, xb) it covers)."""
    o = dict(opts or {})
    mat = o.get("mat", "reed")
    small = kind == "small"
    xm = (x0 + x1) / 2
    zd = max(H.deck_z(x, drop) for x in (x0, x1, xm)) if not small else max(H.zs(x) for x in (x0, x1, xm)) - 0.05
    floor = o.get("floor")          # an awning standing on a roof: its floor (posts and eaves start there)
    if floor is not None:
        zd = floor
    hw_in = min(H.inner(x, H.deck_z(x, drop)) for x in (x0, x1, xm))
    if style in ("arch", "hood"):
        ze = o.get("z", zd + (0.15 if not small else 0.1) + o.get("h", 0.0))
        rise = o.get("rise", 1.35 if not small else 1.0)
        hw = o.get("w", hw_in + 0.06)
        if style == "arch":
            kv.barrel_cover(x0, x1, hw, ze, ze + rise * 0.3, ze + rise,
                            hoops=max(2, round((x1 - x0) / 0.8) + 1) if lod == 0 else 2, thick=0.035, mat=mat)
            with S.node("roof__col"):
                _roof_collider(x0, x1, hw, min(zd, ze), ze + rise * 0.3, ze + rise - 0.02)
            return ze + rise, (x0 - 0.04, x1 + 0.04)
        end = o.get("end", "fore")
        over = o.get("over", 0.9 if not small else 0.5)
        n = 5 if lod == 0 else 3
        fs = [i / n for i in range(n + 1)]
        xa, xb = (x0, x1 + over) if end == "fore" else (x0 - over, x1)
        xs, hws, zes, zss, zts = [], [], [], [], []
        for f in fs:
            tip = f if end == "fore" else 1 - f            # 1 at the overhanging end
            k_ = max(0.0, (tip - 0.55) / 0.45)
            x = xa + (xb - xa) * f
            xs.append(x)
            hws.append(hw * (1 - 0.55 * k_ ** 1.4))
            zes.append(ze + 0.25 * k_)
            zt_ = ze + rise * (1 - 0.35 * k_ ** 1.2)
            zts.append(zt_)
            zss.append(zes[-1] + (zt_ - zes[-1]) * 0.3)
        _shell(xs, hws, zes, zss, zts, mat=mat, hoops=lod == 0)
        with S.node("roof__col"):
            _roof_collider(min(xs), max(xs) - (over * 0.6 if end == "fore" else 0), hw, min(zd, ze), ze + rise * 0.3,
                           ze + rise * 0.95)
        return ze + rise, (min(xs), max(xs))
    # roofs on posts
    h = o.get("h", 1.85 if not small else 1.25)
    ze = o.get("z", zd + h)
    hw = o.get("w", hw_in - 0.12)
    rise = o.get("rise", {"flat": 0.12, "gable": 0.7, "canopy": 0.1}.get(style, 0.12))
    nb = max(1, round((x1 - x0) / 1.6))
    px = [x0 + 0.08 + (x1 - x0 - 0.16) * i / nb for i in range(nb + 1)]
    for i, x in enumerate(px):
        if lod > 0 and 0 < i < nb and i % 2:
            continue
        for sd in (1, -1):
            _bar("bamboo" if style == "canopy" else "timber",
                 (x, sd * (hw - 0.05), floor if floor is not None else (H.deck_z(x, drop) - 0.03 if not small else zd - 0.3)),
                 (x + rng.uniform(-0.02, 0.02), sd * (hw - 0.05), ze), 0.07, 0.07)
    ov = 0.18
    if style == "gable":
        zr = ze + rise
        for sd in (1, -1):        # the two slopes: thin mat slabs with thickness, battens across
            q = [V((x0 - ov, sd * (hw + ov), ze - 0.05)), V((x1 + ov, sd * (hw + ov), ze - 0.05)),
                 V((x1 + ov, 0.0, zr)), V((x0 - ov, 0.0, zr))]
            qb = [p - UP * 0.04 for p in q]
            _add(mat, q + qb, [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (3, 7, 4, 0)],
                 (q[0] + q[2]) / 2 - UP * 0.3)
            for x in (x0 - ov + 0.04, x1 + ov - 0.04):     # barge poles
                _bar("bamboo", (x, sd * (hw + ov), ze - 0.06), (x, 0.0, zr - 0.02), 0.05, 0.05)
            _bar("bamboo", (x0 - ov, sd * (hw + ov - 0.02), ze - 0.07), (x1 + ov, sd * (hw + ov - 0.02), ze - 0.07), 0.05, 0.05)
        _bar("bamboo", (x0 - ov - 0.1, 0.0, zr + 0.02), (x1 + ov + 0.1, 0.0, zr + 0.02), 0.07, 0.07)
        for x in px[:: (1 if lod == 0 else 2)]:
            _bar("timber", (x, hw, ze - 0.02), (x, -hw, ze - 0.02), 0.06, 0.06)
        top = zr
    else:
        camber = rise
        ny = 4
        verts, faces = [], []
        nx = max(2, round((x1 - x0 + 2 * ov) / 1.2))
        for i in range(nx + 1):
            x = x0 - ov + (x1 - x0 + 2 * ov) * i / nx
            sag_x = (0.06 * math.sin(math.pi * i / nx)) if style == "canopy" else 0.0
            for j in range(ny + 1):
                f = j / ny
                y = -(hw + ov) + 2 * (hw + ov) * f
                zz = ze + camber * math.sin(math.pi * f) - sag_x * math.sin(math.pi * f)
                verts.append(V((x, y, zz)))
        for i in range(nx):
            for j in range(ny):
                a = i * (ny + 1) + j
                faces.append((a, a + ny + 1, a + ny + 2, a + 1))
        top_v = verts
        bot_v = [p - UP * 0.035 for p in verts]
        m = len(verts)
        allv = top_v + bot_v
        allf = faces + [tuple(q + m for q in reversed(f)) for f in faces]
        ins = [V(((x0 + x1) / 2, 0, ze - 0.5))] * len(faces) + [V(((x0 + x1) / 2, 0, ze + 2.0))] * len(faces)
        _add(mat, allv, allf, ins)
        # edge poles all round
        for sd in (1, -1):
            _bar("bamboo", (x0 - ov, sd * (hw + ov), ze - 0.02), (x1 + ov, sd * (hw + ov), ze - 0.02), 0.045, 0.045)
        for x in (x0 - ov, x1 + ov):
            _bar("bamboo", (x, hw + ov, ze - 0.02), (x, -(hw + ov), ze - 0.02), 0.045, 0.045)
        if style == "flat" and lod == 0:       # the slatted eave valance along both sides
            for sd in (1, -1):
                y = sd * (hw + ov + 0.01)
                nsl = max(4, round((x1 - x0 + 2 * ov) / 0.12))
                verts, faces = [], []
                for i in range(nsl):
                    xa_ = x0 - ov + (x1 - x0 + 2 * ov) * (i + 0.15) / nsl
                    xb_ = x0 - ov + (x1 - x0 + 2 * ov) * (i + 0.85) / nsl
                    d_ = rng.uniform(0.2, 0.26)
                    b = len(verts)
                    verts += [V((xa_, y, ze - d_)), V((xb_, y, ze - d_)), V((xb_, y, ze - 0.02)), V((xa_, y, ze - 0.02))]
                    faces.append((b, b + 1, b + 2, b + 3))
                _add("timber", verts, faces, V(((x0 + x1) / 2, 0, ze - 0.1)))
        top = ze + camber
    with S.node("roof__col"):
        _posts_roof_collider(x0 - ov, x1 + ov, hw + ov, top - 0.02)
    return top, (x0 - ov, x1 + ov)


# ---- B3: windlass

def _windlass(H, drop, x, where, lod, rng, z_base=None):
    """A windlass (轱辘): a drum across the boat on two cheek posts, its ends pierced by handspikes, a few turns of
    rope on it. where: 'bow' (at the bow end), 'deck' (on the deck at x), 'roof' (on a roof at z_base), 'post' (on a
    tall frame of two posts, the drum 1.3 m over the deck). Returns the crew's work point beside it (boat frame)."""
    zd = H.deck_z(x, drop)
    zb = z_base if (where == "roof" and z_base is not None) else zd
    lift = {"post": 1.3, "roof": 0.35}.get(where, 0.55)
    zc = zb + lift
    half = min(0.65, H.inner(x, zd) - 0.35) if where != "roof" else 0.55
    for sd in (1, -1):
        _bar("lattice", (x, sd * (half + 0.08), zb - 0.04), (x, sd * (half + 0.08), zc + 0.18), 0.13, 0.13)
        if where == "post":
            _bar("timber", (x - 0.45, sd * (half + 0.08), zb), (x, sd * (half + 0.08), zc - 0.2), 0.07, 0.07)
    c = V((x, 0, zc))
    a = V((0, 1, 0))
    kv._lathe_axis("timber", c, a, V((1, 0, 0)), V((0, 0, 1)),
                   [(0.13, -half), (0.15, -half + 0.06), (0.15, half - 0.06), (0.13, half)], segs=8 if lod == 0 else 6)
    for t in (-half + 0.18, -half + 0.26, -half + 0.34) if lod == 0 else (-half + 0.26,):
        kv._lathe_axis("rope", c + a * t, a, V((1, 0, 0)), V((0, 0, 1)), [(0.17, -0.035), (0.17, 0.035)], segs=8,
                       caps=False)
    for sd in (1, -1):
        e = c + a * (sd * (half - 0.03))
        for kk in range(4 if lod == 0 else 2):
            ang = math.pi * kk / (4 if lod == 0 else 2) + rng.uniform(-0.1, 0.1)
            dv = V((math.cos(ang), 0, math.sin(ang)))
            _bar("timber", e - dv * 0.55, e + dv * 0.55, 0.04, 0.04)
    return V((x - 0.75, 0.0, zb))


# ---- B5: sweep poses, B6: small stern, B7: masts, B9-B11

def _sweep_shipped(H, drop, side, lod, x_lo, x_hi, big):
    """The great sweep unshipped and laid along the deck on one side (B5 'shipped'): its blade raised and resting on
    the stern gallery's rail (a small boat's stern), the shaft running forward from it down along the side deck by the
    gunwale to the loom's end on the deck. x_lo / x_hi: the stretch it may use. Returns the stretch it covers."""
    blade = 2.4 if big else 1.2
    x_tip = H.x0 - (1.15 if big else 0.25)
    x_root = x_tip + blade * 0.97
    z_rest = H.zs(H.x0) + (0.95 if big else 0.25)
    y_of = lambda x: side * (H.inner(x, H.deck_z(x, drop)) - 0.28)   # noqa: E731
    root = V((x_root, y_of(max(x_root, H.x0 + 0.3)) * 0.9, z_rest - 0.05))
    end = V((min(x_hi, x_root + (8.0 if big else 3.6)), 0, 0))
    end = V((end.x, y_of(end.x), H.deck_z(end.x, drop) + 0.08))
    sb.cyl("bamboo", False, end, root, 0.072 if big else 0.05, 0.065 if big else 0.045, segs=6 if lod == 0 else 4)
    tip = V((x_tip, root.y * 0.95, z_rest + 0.12))
    k.beam("timber", False, root + (root - end).normalized() * 0.1, tip, 0.32 if big else 0.2, 0.06 if big else 0.04, 0)
    return (x_tip, end.x)


def _stern_frame(H, lod, out=0.6):
    """B6: lashed crossbeams overhanging a small boat's stern: two beams across the transom top running out `out`
    past it on two short fore-and-aft poles, rope lashings at the crossings. Returns the frame's aft x and top z."""
    x0 = H.x0
    zt = H.zs(x0)
    yb = H.w(x0) + 0.12
    xs_ = (x0 + 0.15, x0 - out)
    for x in xs_:
        _bar("timber", (x, yb, zt + 0.04), (x, -yb, zt + 0.04), 0.09, 0.08)
    for yy in (yb * 0.7, -yb * 0.7):
        _bar("bamboo", (x0 + 0.5, yy, zt + 0.1), (x0 - out - 0.1, yy, zt + 0.1), 0.06, 0.06)
        if lod == 0:
            for x in xs_:
                sb.cyl("rope", False, (x - 0.06, yy, zt + 0.07), (x + 0.06, yy, zt + 0.07), 0.07, segs=6, caps=False)
    return x0 - out, zt + 0.14


def _pole_mast(H, drop, x_m, z_step, height, angle_deg, lod, tow_to=None, n_stays=15):
    """B7: a single pole mast stepped in a braced tabernacle (two cheeks and braces) at (x_m, z_step) (the deck, or a
    cabin roof), node `mast` (pivot at the step, as the A-frame's); stays fanning from the masthead to both gunwales,
    the bow and the stern (about n_stays), a tow line to `tow_to`. Returns the masthead (boat frame, at the built
    angle)."""
    piv = V((x_m, 0, z_step + 0.3))
    a = math.radians(angle_deg)
    for sd in (1, -1):
        _bar("lattice", (x_m, sd * 0.11, z_step - 0.03), (x_m, sd * 0.11, z_step + 0.75), 0.18, 0.06)
        _bar("timber", (x_m - 0.5, sd * 0.11, z_step), (x_m, sd * 0.11, z_step + 0.6), 0.06, 0.06)
        _bar("timber", (x_m + 0.5, sd * 0.11, z_step), (x_m, sd * 0.11, z_step + 0.6), 0.06, 0.06)
    head_up = piv + UP * height
    with S.node("mast", origin=piv, rot_y=-a, extras={"anim": "mast", "axis_gltf": [0, 0, 1], "angle_deg": angle_deg,
                                                       "range_deg": [max(0, angle_deg - 10), min(88, angle_deg + 10)]}):
        sb.cyl("timber", False, piv - UP * 0.25, head_up, 0.12, 0.07, segs=7 if lod == 0 else 5)
        k.beam("lattice", False, head_up - UP * 0.2, head_up + UP * 0.2, 0.18, 0.18, 0.03 if lod == 0 else 0)
        if lod == 0:
            for t in (0.35, 0.65):
                _bar("timber", piv + UP * (height * t) + V((0, 0.14, 0)), piv + UP * (height * t) - V((0, 0.14, 0)),
                     0.05, 0.05)
    S.point("pt_masthead", "mast", head_up - piv, None)
    rot = Matrix.Translation(piv) @ Matrix.Rotation(-a, 4, "Y") @ Matrix.Translation(-piv)
    head = rot @ head_up
    hl = head_up - piv
    n_side = max(1, (n_stays - 3) // 2) if lod == 0 else 2
    fore = V((H.x1 - 0.7, 0, H.zs(H.x1 - 0.7) + 0.1))
    S.line("forestay", ("mast", hl, head), ("body", fore, fore), sag=0.005, n=4 if lod == 0 else 1)
    S.point("pt_haul", "body", fore, fore)
    aft = V((H.x0 + 0.8, 0, H.zs(H.x0 + 0.8) + 0.1))
    S.line("backstay", ("mast", hl, head), ("body", aft, aft), sag=0.01, n=4 if lod == 0 else 1)
    for sd, nm in ((1, "p"), (-1, "s")):
        for i in range(n_side):
            x = H.x0 + 1.0 + (H.x1 - H.x0 - 2.0) * (i + 0.5) / n_side
            bp = V((x, sd * (H.w(x) - 0.05), H.zs(x) + 0.05))
            S.line(f"stay_{nm}{i}", ("mast", hl, head), ("body", bp, bp), sag=0.004, n=3 if lod == 0 else 1)
    if tow_to is not None:
        S.line("tow", ("mast", hl, head), (None, V(tow_to), V(tow_to)), sag=0.012, r=0.016, n=8 if lod == 0 else 3)
    return head


def _crutch(x, z_foot, z_top, lod):
    """B7: the crutch a lowered mast rests on: two poles crossed like scissors, lashed below their tops; the mast lies
    in the fork at z_top."""
    for sd in (1, -1):
        _bar("timber", (x - 0.05, sd * 0.42, z_foot), (x + 0.05, -sd * 0.12, z_top + 0.18), 0.07, 0.07)
    if lod == 0:
        sb.cyl("rope", False, (x, -0.05, z_top - 0.05), (x, 0.05, z_top - 0.05), 0.09, segs=6, caps=False)


def _bow_deck(H, drop, z_top, rng, lod, aframe=True):
    """B9: a raised deck over a grain boat's foredeck at z_top (boat frame), on blocking: plank boards across, a board
    face at its after edge, walkable (deck__col) and railed by hidden walls; an A-frame of two poles lashed at their
    heads standing on it, leaning forward. Returns its (x0, x1)."""
    xa, xb = H.x1 - 3.4, H.x1 - 0.35
    nb = max(3, round((xb - xa) / (0.35 if lod == 0 else 0.9)))
    for i in range(nb):
        x0_, x1_ = xa + (xb - xa) * i / nb, xa + (xb - xa) * (i + 1) / nb - 0.012
        x_ = (x0_ + x1_) / 2
        w = H.inner(x_, z_top) - 0.05
        kv.plank("deck", (x_, w), (x_, -w), x1_ - x0_, z_top - 0.06, z_top, rng)
    w0 = H.inner(xa, z_top) - 0.05
    kv.plank("timber", (xa, w0), (xa, -w0), 0.06, H.deck_z(xa, drop) - 0.02, z_top - 0.06, rng)
    for x_ in (xa + 0.3, (xa + xb) / 2, xb - 0.3):
        w = H.inner(x_, z_top) - 0.15
        for sd in (1, -1):
            _bar("timber", (x_, sd * w, H.deck_z(x_, drop) - 0.02), (x_, sd * w, z_top - 0.06), 0.1, 0.1)
    with S.node("deck__col"):
        _flat_collider(xa, xb, H.inner((xa + xb) / 2, z_top) - 0.1, z_top)
    with S.node("rim__col"):
        for sd in (1, -1):
            n = max(1, round((xb - xa) / 2.0))
            for i in range(n):
                a_, b_ = xa + (xb - xa) * i / n, xa + (xb - xa) * (i + 1) / n
                q = [V((a_, sd * H.inner(a_, z_top), z_top - 0.1)), V((b_, sd * H.inner(b_, z_top), z_top - 0.1)),
                     V((b_, sd * H.inner(b_, z_top), z_top + 1.0)), V((a_, sd * H.inner(a_, z_top), z_top + 1.0))]
                _add("hidden", q, [(0, 1, 2, 3)], V(((a_ + b_) / 2, 0, z_top + 0.5)), collide=True)
    if aframe:
        head = V((xb + 0.6, 0, z_top + 3.0))
        for sd in (1, -1):
            foot = V((xa + 1.2, sd * (H.inner(xa + 1.2, z_top) - 0.25), z_top))
            sb.cyl("bamboo", False, foot, head + V((0, sd * 0.05, 0)), 0.06, 0.045, segs=6 if lod == 0 else 4)
        sb.cyl("rope", False, head - UP * 0.15 - V((0, 0.12, 0)), head - UP * 0.15 + V((0, 0.12, 0)), 0.07, segs=6, caps=False)
    return xa, xb


def _grapnel(H, lod):
    """B10: a four-pronged grapnel hanging under the bow on its rope, iron (ridge), its flukes just clear of the water."""
    x = H.x1 + 0.05
    top = V((x, 0.35 * H.w(H.x1), H.zs(H.x1) + 0.05))
    c = V((x + 0.15, 0.4 * H.w(H.x1), 0.35))
    kv._rope(top, c + UP * 0.55, sag=0.0, r=0.014, n=2)
    _bar("ridge", c + UP * 0.55, c, 0.05, 0.05)
    _bar("ridge", c + UP * 0.6 - V((0.05, 0, 0)), c + UP * 0.6 + V((0.05, 0, 0)), 0.03, 0.08)
    for kk in range(4):
        ang = math.pi / 2 * kk + 0.4
        dv = V((math.cos(ang), math.sin(ang), 0))
        p1 = c + dv * 0.18 + UP * 0.05
        _bar("ridge", c, p1, 0.035, 0.035)
        _bar("ridge", p1, p1 + dv * 0.04 + UP * 0.16, 0.03, 0.03)


def _fenders(H, drop, kinds, lod, rng):
    """B11: a coil of rope hung over the side amidships, a rope-wrapped fender at the bow, log fenders hung along the
    side at the waterline."""
    if "coil" in kinds:
        x = H.lw * 0.45
        y = H.w(x) + 0.05
        z = H.zs(x) - 0.25
        kv._lathe_axis("rope", V((x, y, z)), V((0, 1, 0)), V((1, 0, 0)), V((0, 0, 1)),
                       [(0.2, -0.04), (0.28, -0.03), (0.28, 0.03), (0.2, 0.04)], segs=10 if lod == 0 else 6, caps=False)
        kv._rope(V((x, y - 0.05, H.zs(x) + 0.03)), V((x, y, z + 0.2)), sag=0.0, r=0.015, n=2)
    if "bow" in kinds:
        x = H.x1 + 0.02
        z0, z1 = max(0.1, H.zs(H.x1) - 0.7), H.zs(H.x1) - 0.1
        for t in range(4 if lod == 0 else 2):
            zz = z0 + (z1 - z0) * (t + 0.5) / (4 if lod == 0 else 2)
            sb.cyl("rope", False, (x - 0.02, -0.25, zz), (x - 0.02, 0.25, zz), 0.09, segs=6, caps=False)
    if "logs" in kinds:
        for i, f in enumerate((0.3, 0.55, 0.75)):
            x = H.lw * f
            y = H.y(x, 0.15) + 0.12
            sb.cyl("bark", False, (x - 0.55, y, 0.18), (x + 0.55, y, 0.2), 0.11, 0.1, segs=6)
            kv._rope(V((x, H.w(x) - 0.02, H.zs(x) + 0.02)), V((x, y, 0.29)), sag=0.0, r=0.012, n=2)


# ---------------------------------------------------------------- the boat

def _frame(front, rear, lw, centre=None):
    heading = math.atan2(front[1] - rear[1], front[0] - rear[0])
    cx = centre[0] if centre else (front[0] + rear[0]) / 2
    cy = centre[1] if centre else (front[1] + rear[1]) / 2
    hd = V((math.cos(heading), math.sin(heading), 0))
    r = V((cx, cy, 0)) - hd * (lw / 2)
    return heading, r


def _build(front, rear, water_h, kind, lw=None, beam=None, free=None, lod=0, rng=None, laden=None, cabin=None,
           hold=None, awning=None, mast=None, mast_angle=None, mast_h=None, mast_at=None, tow_to=None, sweep=None,
           oars=0, gangplank=None, moor=(), cargo=None, cloths=False, stern_house=None, bow_canopy=None, centre=None,
           mapped_length=None, pose=None, awnings=None, bow=None, windlass=None, sweep_pose=None, rudder=None,
           stern_frame=False, mast_form=None, mast_step=None, crutch=None, gangway=None, bow_deck=None, grapnel=False,
           fenders=None, anchor=None, gangplank_at=None):
    """Build one boat into the active sink S, in the boat frame. Returns (info dict, frame matrix M: boat -> scene)."""
    spec = dict(TYPES[kind])
    rng = rng or random.Random(int(abs(front[0] * 131 + front[1] * 71 + rear[0] * 17)) % 100000)
    for key, val in (("lw", lw), ("beam", beam)):
        if val:
            spec[key] = val
    if kind == "grain" and laden is None:
        laden = hold in (None, "laden")
    if free:
        spec["free"] = free
    elif kind == "grain" and laden:
        spec["free"], spec["rise_b"], spec["rise_s"] = LADEN_FREE, 0.85, 1.15
    pointed = bow == "pointed" and kind == "small"
    if pointed:     # B2: the bow narrows to an upswept stem (choice: 0.06 of the half-beam at its top, 0.3 m more sheer)
        spec["tw_b"], spec["rise_b"], spec["oh_b"] = 0.06, spec["rise_b"] + 0.3, spec["oh_b"] + 0.2
    heading, r = _frame(front, rear, spec["lw"], centre)
    M = Matrix.Translation((r.x, r.y, water_h)) @ Matrix.Rotation(heading, 4, "Z")
    Mi = M.inverted()

    def local(p):
        return Mi @ V((p[0], p[1], p[2] if len(p) > 2 else water_h))
    spec["n_st"] = (22 if lod == 0 else 12) if kind != "small" else (16 if lod == 0 else 9)
    spec["strakes"] = spec["strakes"] if lod == 0 else max(3, spec["strakes"] // 2)
    H = Hull(**spec)
    drop = spec["drop"]
    parts = {}
    roof_z = None
    cab = {}
    rig_notes = []
    # the gangplank's landing (its rim cut is built with the rim below): square to the deck's edge, at any angle
    landing = None
    if gangplank is not None and gangway != "ladder":
        rx0, rx1 = (H.x0 + 0.25, H.x1 - 0.2) if kind != "small" else (H.lw * 0.1, H.lw * 0.9)
        landing = _plank_landing(H, drop, kind, local(gangplank), rx0, rx1, gangplank_at)
        if landing is None:
            rig_notes.append("gangplank: its corridor misses the deck; landed abreast of its foot (old rule)")
        elif landing["note"]:
            rig_notes.append(landing["note"])

    def tris_now():
        return _tri_count() if S.mode == "world" else sum(_tri_count(nd["B"]) for nd in S.nodes.values())

    def mark(name, t_before):
        parts[name] = parts.get(name, 0) + tris_now() - t_before

    with S.node("body"):
        t = tris_now()
        ts = _hull(H, rng, lod)
        _transoms(H, lod)
        _wales(H, ts, lod)
        _wet_band(H, lod)
        mark("hull", t)

        t = tris_now()
        xa_d, xb_d = H.x0 + 0.25, H.x1 - 0.2
        holes = []
        extra_cabs = []
        if kind == "passenger" and cabin is not False:
            # cabin: a dict, or a list of dicts (several houses along the deck, e.g. a long cabin, an open bay, an
            # after cabin: S2's 豪华客船); the first is the main one (its roof carries the roof cargo)
            cl = list(cabin) if isinstance(cabin, (list, tuple)) else [cabin]
            for ci, cd in enumerate(cl):
                c = {"x0": 0.2, "x1": 0.8, "pattern": "passenger", "roof": "board", "segs": 3, "wall_h": 1.95,
                     "roof_rise": 0.42, "over": 0.4}
                c.update(cd if isinstance(cd, dict) else {})
                x0c, x1c = H.lw * c["x0"], H.lw * c["x1"]
                c["hw"] = min(H.inner(x, H.deck_z(x, drop)) for x in (x0c, x1c, (x0c + x1c) / 2)) - 0.48
                holes.append((x0c, x1c, c["hw"]))
                if ci == 0:
                    cab = c
                else:
                    extra_cabs.append(c)
        if kind == "grain":
            hold = hold or ("laden" if laden else "awning")
            holes.append((H.lw * 0.3, H.lw * 0.78, 10.0))
        if kind == "small":
            _bulwark(H, 0.12, H.x0 + 0.1, H.x1 - 0.1, lod)
            zf = _thwarts(H, drop, rng, lod)
            with S.node("deck__col"):
                _flat_collider(H.lw * 0.12, H.lw * 0.88, H.inner(H.xm, zf) - 0.1, zf)
            deck_mid = zf
            dpoly = [(H.lw * 0.12, H.inner(H.xm, zf) - 0.1), (H.lw * 0.88, H.inner(H.xm, zf) - 0.1),
                     (H.lw * 0.88, -H.inner(H.xm, zf) + 0.1), (H.lw * 0.12, -H.inner(H.xm, zf) + 0.1)]
            with S.node("rim__col"):
                if landing:
                    _rim_walls_cut(*landing["cut"])
                else:
                    _rim_walls(H, drop, H.lw * 0.1, H.lw * 0.9)
        else:
            _bulwark(H, drop, xa_d, xb_d, lod)
            _deck(H, drop, xa_d, xb_d, rng, lod, holes=holes)
            with S.node("deck__col"):
                ring = _deck_collider(H, drop, xa_d, xb_d)
            deck_mid = H.deck_z(H.xm, drop)
            dpoly = ring + [(x, -y) for x, y in reversed(ring)]
            with S.node("rim__col"):
                if landing:
                    _rim_walls_cut(*landing["cut"])
                else:
                    _rim_walls(H, drop, xa_d, xb_d)
        if S.mode == "nodes":
            with S.node("board__edge"):
                if landing:
                    _board_edge_cut(H, H.x0 + 0.05, H.x1 - 0.05, landing["cross"])
                else:
                    _board_edge(H, H.x0 + 0.05, H.x1 - 0.05)
        mark("deck", t)

        # what covers the deck, as (x0, x1) stretches: roofs, awnings, hoods and the laden mound (a figure under them is
        # hidden), the bitts, a mast's feet, deck cargo and the tiller. The sweep crew and the rowers work on the open
        # deck between, where the painted crews stand (gen/boats/types.md: the sweep from the after deck, aft of the
        # house, its pin on the stern frame; the working crews at the bow).
        big = H.B > 3
        covers = [(H.x1 - 1.4, H.x1 + 1.0)] if big else [(H.x1 - 0.9, H.x1 + 0.5)]
        sweep_side = (1 if sweep in ("port", "left") else -1) if sweep else 0
        t = tris_now()
        canopy = bow_canopy if bow_canopy is not None else kind == "passenger"
        bits = _bow(H, drop, {"passenger": "platform", "grain": "horns"}.get(kind, "post"), rng, lod, canopy=canopy)
        if pointed:     # B2: the upswept stem, a knob on its head
            zt1 = H.zs(H.x1)
            pts = [V((H.x1 - 0.25, 0, max(0.0, zt1 - 0.6))), V((H.x1 + 0.02, 0, zt1 - 0.1)), V((H.x1 + 0.12, 0, zt1 + 0.25)),
                   V((H.x1 + 0.1, 0, zt1 + 0.45))]
            kv._polybeam("timber", pts, 0.1, 0.1, 0.015 if lod == 0 else 0)
            kv._lathe_axis("timber", pts[-1], UP, V((1, 0, 0)), V((0, 1, 0)),
                           [(0.05, 0.0), (0.085, 0.05), (0.07, 0.11), (0.03, 0.15)], segs=8 if lod == 0 else 6)
        if canopy and kind == "passenger":
            covers.append((H.x1 - 2.9, H.x1 - 0.45))
        # choice: a big boat worked by its sweep has its tiller unshipped (the sweep steers; S3 #6 paints none among its
        # sweep crew, and on the after deck it would lie across them at chest height)
        g0, g1, gz, tiller, xstock = _stern(H, drop, rng, lod, gallery=kind != "small", house=bool(stern_house),
                                            tiller=not (sweep and big), rudder=rudder is not False,
                                            frame=bool(stern_frame))
        tiller_cover = (H.x0 - 1.5, max(tiller.x, xstock) + 0.35)
        if stern_house and big:
            covers.append((g0 - 0.3, H.x0 + 2.75))
        if kind != "small":
            with S.node("deck__col"):
                _flat_collider(g0, g1, H.w(H.x0) + 0.05, gz)
            dpoly = [(g0, H.w(H.x0)), (g0, -H.w(H.x0))] + dpoly
        mark("ends", t)

        t = tris_now()
        if kind == "passenger" and cab:
            x0c, x1c = H.lw * cab["x0"], H.lw * cab["x1"]
            tops, crowns = _cabin(H, drop, x0c, x1c, cab["hw"], cab["wall_h"], rng, lod, pattern=cab["pattern"],
                                  roof=cab["roof"], segs=cab["segs"], ladder=cab.get("ladder", (H.lw * 0.5, 1)),
                                  roof_rise=cab["roof_rise"], over=cab["over"])
            roof_z = max(crowns)
            cab.update(tops=tops, crowns=crowns, x0c=x0c, x1c=x1c)
            if cab["pattern"] != "open":
                covers.append((x0c - cab["over"] * 0.8, x1c + cab["over"] * 0.8))
            for c in extra_cabs:
                ex0, ex1 = H.lw * c["x0"], H.lw * c["x1"]
                et, ec = _cabin(H, drop, ex0, ex1, c["hw"], c["wall_h"], rng, lod, pattern=c["pattern"], roof=c["roof"],
                                segs=c["segs"], ladder=c.get("ladder"), roof_rise=c["roof_rise"], over=c["over"],
                                doors=tuple(c.get("doors", (True, True))))
                c.update(tops=et, crowns=ec)
                roof_z = max(roof_z, max(ec))
                if c["pattern"] != "open":
                    covers.append((ex0 - c["over"] * 0.8, ex1 + c["over"] * 0.8))
        elif kind == "grain":
            hx0, hx1 = H.lw * 0.3, H.lw * 0.78
            if hold == "laden":
                roof_z = _laden_hold(H, drop, hx0, hx1, rng, lod)
                covers.append((hx0, hx1))
            elif hold == "awning":
                roof_z = _awnings(H, drop, hx0, hx1, 3, lod)
                covers.append((hx0 - 0.04, hx1 + 0.04))
            if hold in ("laden", "awning"):
                _hatches(H, drop, hx1 + 0.3, H.lw * 0.9, rng, lod)
            else:
                _hatches(H, drop, hx0, H.lw * 0.9, rng, lod)
            if cabin is not False:
                c = {"x0": 0.07, "x1": 0.27, "pattern": "house", "roof": "mat", "segs": 1, "wall_h": 1.7}
                c.update(cabin if isinstance(cabin, dict) else {})
                x0c, x1c = H.lw * c["x0"], H.lw * c["x1"]
                hw = min(H.inner(x, H.deck_z(x, drop)) for x in (x0c, x1c)) - 0.35
                _, crowns = _cabin(H, drop, x0c, x1c, hw, c["wall_h"], rng, lod, pattern=c["pattern"], roof=c["roof"],
                                   segs=c["segs"], doors=(False, True))
                roof_z = max(roof_z or 0, max(crowns))
                covers.append((x0c - 0.32 * 0.8, x1c + 0.32 * 0.8))
        elif kind == "small" and awning is not False:
            ze = H.zs(H.xm) + 0.05
            roof_z = _awnings(H, drop, H.lw * 0.3, H.lw * 0.74, 2, lod, z_eave=ze, rise=1.05)
            covers.append((H.lw * 0.3 - 0.04, H.lw * 0.74 + 0.04))
            if cloths:
                _cloths(H, rng, lod, ze, 1.05)
        awn_tops = []
        stern_roof = ((H.x0 - 1.5, H.x0 + 2.75, H.zs(H.x0) + 0.2 + 1.8 + 0.22) if (stern_house and big) else None)

        def roof_at(x):
            """The top of whatever roof stands over x on the centre line (the cabins' segments, the stern house, the
            awnings built so far), or None."""
            best = None
            for c in [cab] + extra_cabs:
                for (xa, xb, zd), zc in zip(c.get("tops", []), c.get("crowns", [])):
                    if xa - 0.3 <= x <= xb + 0.3:
                        best = max(best or 0.0, zc)
            for xa, xb, zc in awn_tops + ([stern_roof] if stern_roof else []):
                if xa <= x <= xb:
                    best = max(best or 0.0, zc)
            return best
        for aw in awnings or ():
            ax0, ax1, style = aw[0], aw[1], aw[2]
            ao = dict(aw[3]) if len(aw) > 3 and aw[3] else {}
            if ao.pop("on", None) == "roof":       # on a roof: its eaves on the roof's crown there
                rz = roof_at(H.lw * (ax0 + ax1) / 2)
                if rz is not None:
                    ao.setdefault("floor", rz - 0.08)
                    ao.setdefault("w", min(1.0, 0.3 * H.B))
            crown, span = _awning(H, drop, kind, H.lw * ax0, H.lw * ax1, style, lod, rng, ao)
            covers.append(span)
            awn_tops.append((span[0], span[1], crown))
            roof_z = max(roof_z or 0.0, crown)
        if bow_deck is not None and kind != "small":
            _bow_deck(H, drop, max(float(bow_deck), H.deck_z(H.x1 - 2.0, drop) + 0.3), rng, lod)
        mark("house", t)

        if cargo is None:
            cargo = DEFAULT_CARGO.get(kind, [])
            if kind == "grain" and hold == "laden":
                cargo = [("coil", 0.88, 0.5, "deck")]
        for kind_, xf, _, level in cargo:
            if level == "deck":
                rr = {"coil": 0.32, "basket": 0.28, "roll": 0.87, "sack": 0.45, "crate": 0.35, "jar": 0.26}.get(kind_, 0.4)
                covers.append((H.lw * xf - rr - 0.1, H.lw * xf + rr + 0.1))

        t = tris_now()
        head = None
        if mast:
            ang = mast_angle if mast_angle is not None else {"up": 4, "lowering": 50, "down": 82}[mast]
            xm = H.lw * (mast_at if mast_at is not None else (0.62 if kind == "grain" else 0.83))
            mh = mast_h or (9.0 if big else 5.0)
            z_step = H.deck_z(xm, drop)
            if mast_form == "pole" and mast_step == "roof" and roof_at(xm) is not None:
                z_step = roof_at(xm) - 0.05
            piv_z = z_step + (0.3 if mast_form == "pole" else 0.35)
            crutch_at = None
            if crutch and (mast == "down" or ang > 60):
                # B7: the lowered mast rests in a crutch, on the roof (or the deck) near its after end; its angle is
                # solved so it lies in the crutch's fork, 0.25 m clear of every roof under it
                xc = max(H.x0 + 1.0, xm - 0.72 * mh)
                rz = roof_at(xc)
                zc = (rz + 0.45) if rz is not None else H.deck_z(xc, drop) + 1.55
                # (near its feet the legs straddle the house; the check is the half toward the crutch)
                for xx in [xc + (xm - xc) * f for f in (0.1, 0.25, 0.4)]:
                    r_ = roof_at(xx)
                    if r_ is not None:
                        zc = max(zc, piv_z + (r_ + 0.25 - piv_z) * (xm - xc) / max(0.1, xm - xx))
                ang = max(45.0, min(88.0, math.degrees(math.atan2(xm - xc, max(0.05, zc - piv_z)))))
                crutch_at = (xc, rz if rz is not None else H.deck_z(xc, drop), zc)
            if mast_form == "pole":
                head = _pole_mast(H, drop, xm, z_step, mh, ang, lod,
                                  tow_to=local(tow_to) if tow_to is not None else None)
            else:
                head = _mast(H, drop, xm, mh, ang, lod, tow_to=local(tow_to) if tow_to is not None else None,
                             crutch=crutch_at is None)
            if crutch_at:
                _crutch(crutch_at[0], crutch_at[1] - 0.02, crutch_at[2], lod)
            covers.append((xm - 0.8, xm + 0.8))
        deck_lo, deck_hi = (H.x0 + 0.55, H.x1 - 0.5) if kind != "small" else (H.lw * 0.12 + 0.2, H.lw * 0.88 - 0.2)
        if kind == "small":
            covers += [(H.lw * f - 0.22, H.lw * f + 0.22) for f in (0.25, 0.5, 0.75)]     # the thwarts (_thwarts)
        if sweep:
            # the pin on the stern frame (the gallery) at the quarter, or on the gunwale's quarter forward of a stern
            # house (or on a small boat); the crossbar over the after deck's open stretch, its crew aft of any house
            if kind != "small" and not stern_house:      # on the gallery's side beam (the frame the loom crosses)
                pin = V((H.x0 - 0.5, sweep_side * (H.w(H.x0) + 0.05), gz + 0.3))
            else:
                xp = (H.x0 + 2.75 + 0.3) if (stern_house and big) else H.x0 + 0.3
                pin = V((xp, sweep_side * (H.w(xp) + 0.06), H.zs(xp) + 0.18))
            aft = _open_spans(deck_lo, deck_hi, covers)
            end = aft[0][1] if aft else pin.x + 3.0
            loom = 2.6 if big else 1.4
            if sweep_pose == "shipped":      # B5: unshipped, laid along the side deck, its blade raised over the stern
                _sweep_shipped(H, drop, sweep_side, lod, H.x0 - 0.2, min(H.lw * 0.62, H.x0 + (8.5 if big else 4.2)), big)
            elif sweep_pose == "rest":       # B5: on its pin, the loom on the gunwale, the blade trailing on the water
                bx_ = pin.x + loom
                _sweep(H, drop, sweep_side, lod, pin, bx_, sweep_side * (H.w(bx_) - 0.12), pose="rest")
            else:
                bar_x = max(pin.x + (1.2 if big else 0.8), min(pin.x + loom, end - 0.55 - 0.35))
                if bar_x > end - 0.55 - 0.35 + 1e-6:
                    rig_notes.append(f"sweep: its crew stand {bar_x + 0.9 - end:.1f} m under the house's eave")
                # the crew's middle (the page: 0.55 m inboard of the bar, spread 0.6 m either way across the loom,
                # swinging with it) stays inside the hull at both ends of the stroke
                cx = bar_x + 0.5
                swing = (math.hypot(bar_x - pin.x, pin.y) + 0.55) * math.sin(math.radians(SWEEP_AMP))
                c_y = max(0.0, min(0.55, H.inner(cx, H.deck_z(cx, drop)) - 0.2 - 0.6 - swing)) if big else 0.0
                d0 = V((bar_x - pin.x, sweep_side * c_y - pin.y, 0)).normalized()
                bar = _sweep(H, drop, sweep_side, lod, pin, bar_x, sweep_side * c_y - 0.55 * d0.y)
                covers.append((pin.x - 0.3, bar.x + 1.2))
        if oars:
            covers.append(tiller_cover)
            length = 4.2 if big else 2.6
            min_y = 0.3 if big else 0.15
            stations, crowded = _oar_stations(H, oars, _open_spans(deck_lo, deck_hi, covers), length, min_y,
                                              0.8 if big else 0.6, fore_first=big, abreast=big)
            _oars(H, drop, stations, lod, length, min_y)
            if crowded:
                rig_notes.append(f"oars: {2 * oars} rowers don't fit the open deck; some share a stretch")
        for i, wl in enumerate(windlass or ()):
            xf, where = (wl[0], wl[1]) if isinstance(wl, (list, tuple)) else (None, wl)
            x = H.x1 - (1.3 if big else 0.7) if (where == "bow" and xf is None) else H.lw * (xf if xf is not None else 0.5)
            spot = _windlass(H, drop, x, where, lod, rng, z_base=roof_at(x) if where == "roof" else None)
            S.point(f"pt_windlass_{i}", "body", spot)
            if where != "roof":
                covers.append((x - 0.4, x + 0.4))
        if grapnel:
            _grapnel(H, lod)
        if fenders:
            _fenders(H, drop, ("coil", "bow", "logs") if fenders is True else tuple(fenders), lod, rng)
        mark("rig", t)

        t = tris_now()

        def z_at(x, y, level):
            if level == "roof" and cab.get("tops"):
                for (xa, xb, zd), zc in zip(cab["tops"], cab["crowns"]):
                    if xa <= x <= xb:
                        ze = zd + cab["wall_h"]
                        f = 1 - min(1.0, abs(y) / (cab["hw"] + cab["over"])) ** 2
                        return ze + (zc - ze) * f ** 0.6
            return H.deck_z(x, drop) if kind != "small" else deck_mid
        _cargo(cargo, H, drop, z_at, rng, lod)
        mark("cargo", t)

    # lines to the bank (moored boats): mooring lines from the nearer bitts, the gangplank
    for i, p in enumerate(moor or ()):
        g = local(p)
        near = min(bits, key=lambda b: (b - g).length)
        S.line(f"moor{i}", ("body", near, near), (None, g, g), sag=0.04, r=0.016, n=6 if lod == 0 else 2)
    for i, p in enumerate(anchor or ()):       # stern anchor lines to a point in the water (world-fixed)
        g = local(p)
        sd = 1 if g.y > 0 else -1
        st = V((H.x0 + 0.35, sd * 0.35 * H.w(H.x0 + 0.35), H.zs(H.x0 + 0.35) + 0.06))
        S.line(f"anchor{i}", ("body", st, st), (None, g, g), sag=0.08, r=0.016, n=6 if lod == 0 else 2)
    if gangplank is not None:
        g = local(gangplank)
        if landing:
            # the plank rests in the gunwale where it crosses it (as the old landing: 2 cm under the gunwale's top) and
            # runs straight on to its deck end, which stays within a step (0.32 m) of the deck
            A = landing["A"]
            cx_ = landing["cross"][1] if len(landing["cross"]) > 2 else landing["hc"]
            sc = (V((cx_.x, cx_.y, 0)) - V((g.x, g.y, 0))).length
            zc_ = H.zs(cx_.x) - 0.02
            zA = g.z + (zc_ - g.z) * landing["s_in"] / max(0.3, sc)
            zdk = H.deck_z(A.x, drop) if kind != "small" else min(H.deck_z(A.x, drop), H.zs(H.xm) - drop)
            zA = max(zdk + 0.04, min(zdk + 0.28, zA))
            st = V((A.x, A.y, zA))
            S.line("gangplank", ("body", st, st), (None, g, g), kind="plank", lod=lod)
            for j, q in enumerate(landing["open"]):
                S.point(f"pt_gangplank_open_{j}", "body", q)
        else:
            xg = max(H.x0 + 1.0, min(H.x1 - 1.0, g.x))
            side = 1 if g.y > 0 else -1
            st = V((xg, side * (H.w(xg) - 0.1), H.zs(xg) - 0.02))
            if gangway == "ladder":    # B8: a ladder gangway to the bank or another boat (not walkable)
                S.line("gangplank", ("body", st, st), (None, g, g), kind="ladder", lod=lod,
                       rungs=max(2, round((g - st).length / (0.3 if lod == 0 else 0.6))))
            else:
                S.line("gangplank", ("body", st, st), (None, g, g), kind="plank", lod=lod)

    # points the page and the crew need (boat frame)
    S.point("pt_deck", "body", V((H.xm, 0, deck_mid)))
    if roof_z:
        S.point("pt_roof", "body", V(((cab.get("x0c", H.lw * 0.5) + cab.get("x1c", H.lw * 0.5)) / 2 if cab else H.lw * 0.55, 0, roof_z)))
    S.point("pt_bow", "body", V((H.x1 - 0.6, 0, H.deck_z(H.x1 - 0.6, drop))))
    S.point("pt_stern", "body", V(((g0 + g1) / 2 if kind != "small" else 0.4, 0, gz if kind != "small" else deck_mid)))
    S.point("pt_tiller", "body", tiller)
    for b_, nm in zip(bits, ("p", "s")):
        S.point(f"pt_bitt_{nm}", "body", b_)
    under_way = (pose in UNDER_WAY) if pose else bool(sweep or oars or (mast and mast != "down" and tow_to is not None)
                                                       or mast == "lowering")
    with S.node("wet__ring", extras={"anim": "ripple"}):
        _wet_ring(H, lod)
    if under_way:
        with S.node("bow_wave", extras={"anim": "bow_wave"}):
            _bow_wave(H, lod)
    info = dict(kind=kind, lw=H.lw, loa=round(H.x1 - H.x0 + (1.3 if kind != "small" else 0.0) +
                                              (1.0 if kind == "passenger" else 0.0), 2),
                beam=H.B, lod=lod, deck_z=round(deck_mid, 3), roof_z=round(roof_z, 3) if roof_z else None,
                heading_deg=round(math.degrees(heading), 1), parts=parts, deck_poly=dpoly,
                pose=pose or ("lowering mast" if mast == "lowering" else ("rowed" if oars else ("towed" if tow_to is not None
                                                                                                 else "moored"))),
                motion="under_way" if under_way else "moored", centre_x=H.lw / 2, head=head, hull=H)
    painted = math.hypot(front[0] - rear[0], front[1] - rear[1])
    ml = mapped_length if mapped_length is not None else painted
    notes = rig_notes[:]
    if ml and abs(ml - H.lw) > 0.3 * H.lw:
        notes.insert(0, f"mapped waterline {ml:.1f} m, built {H.lw:.1f} m (real size, BUILDING.md rule 5)")
    if notes:
        info["note"] = "; ".join(notes)
    return info, M


def boat(front, rear, water_h, kind="passenger", **opts):
    """A static boat baked into the caller's bucket set (sb.B) in scene coordinates: the whole hierarchy flattened at
    its rest pose (moving parts at their painted pose, ropes sagging, colliders as hidden__col). For scenes that build
    boats into their own GLB; the page's movable boats use boat_nodes(). Wrap the call in sb.entity(<boat id>).
    Options: see boat_nodes. Returns a Boat."""
    global S
    prev, S = S, _Sink("world")
    t0 = _tri_count()
    try:
        heading, r = _frame(front, rear, (opts.get("lw") or TYPES[kind]["lw"]), opts.get("centre"))
        M = Matrix.Translation((r.x, r.y, water_h)) @ Matrix.Rotation(heading, 4, "Z")
        with k.placed(M):
            info, M2 = _build(front, rear, water_h, kind, **opts)
    finally:
        S = prev
    w = lambda p: tuple(round(c, 3) for c in (M @ V((p[0], p[1], 0)))[:2])  # noqa: E731
    return Boat(_tri_count() - t0, deck_z=round(info["deck_z"] + water_h, 3),
                roof_z=round(info["roof_z"] + water_h, 3) if info["roof_z"] else None,
                deck_poly=[w(p) for p in info["deck_poly"]], heading_deg=info["heading_deg"], lw=info["lw"],
                loa=info["loa"], beam=info["beam"], lod=info["lod"], kind=kind, parts=info["parts"],
                note=info.get("note"), mast_head=tuple(M @ info["head"]) if info["head"] is not None else None)


class BoatNodes:
    """A boat built for the page: per-node bucket sets in the boat frame, its points and lines, the frame matrix
    (boat -> scene) and the info (kind, sizes, deck_z / roof_z in the boat frame, motion)."""

    def __init__(self, name, sink, M, info):
        self.name, self.sink, self.M, self.info = name, sink, M, info

    @property
    def tris(self):
        return {n: _tri_count(nd["B"]) for n, nd in self.sink.nodes.items()}


def boat_nodes(name, front, rear, water_h, kind="passenger", **opts):
    """A movable boat for the page (see the module doc, Nodes). name: the root's name (the map ID). front, rear: the
    painted waterline ends (scene X, D); water_h: the water's z. Options (None = the kind's painted default):
    lw / beam / free (real-size choices), lod (0 | 1), laden, cabin (dict | False), hold ('laden' | 'awning' |
    'hatch'), awning (False: open boat), cloths, mast (None | 'up' | 'lowering' | 'down') with mast_angle, mast_h,
    mast_at, tow_to (scene (X, D, z)), sweep ('port' | 'starboard': the side its blade trails on), oars (per side, on
    the open deck), gangplank (scene point on the bank), moor ([scene points]), cargo ([(kind, x_frac, y, level)]),
    stern_house, bow_canopy, centre, pose (the map's pose: decides `motion`), mapped_length."""
    global S
    prev, S = S, _Sink("nodes")
    try:
        info, M = _build(front, rear, water_h, kind, **opts)
        bn = BoatNodes(name, S, M, info)
    finally:
        S = prev
    return bn


def boat_from_layout(ent, map_id="", kind=None, water_h=None, sink="nodes", **opts):
    """A boat from its layout.json vehicle entity (sections/<x>/layout.json `entities[<map id>]`): `pts.front`,
    `pts.rear` (X, D, H at the water), optional points in metres if the map's world step converts them (`beam_n` /
    `beam_s`: the beam; `bow_top` / `stern_top`: the freeboard; `mast` / `mast_top`: the mast's lean), its `pose`
    (moored, rowed, towed, lowering mast, ...: decides `motion`) and `what` (the type, read by kind_of), both copied by
    tools/map_layout.mjs. pose= and kind= override the entity's (build_choices.json `boats.<id>.kit`). sink 'nodes' ->
    BoatNodes, 'world' -> Boat (static, into sb.B)."""
    p = ent["pts"]
    front, rear = p["front"], p["rear"]
    if water_h is None:
        water_h = front[2] if len(front) > 2 else ent.get("H", 0.0)
    kind = kind or kind_of(map_id, ent.get("name", ""), ent.get("what", ""))
    hd = V((front[0] - rear[0], front[1] - rear[1], 0)).normalized()
    if "beam_n" in p and "beam_s" in p and "beam" not in opts:
        b = abs((V((p["beam_n"][0], p["beam_n"][1], 0)) - V((p["beam_s"][0], p["beam_s"][1], 0))).dot(V((-hd.y, hd.x, 0))))
        opts["beam"] = max(TYPES[kind]["beam"] * 0.75, min(TYPES[kind]["beam"] * 1.25, b))
    tops = [p[n][2] - water_h for n in ("bow_top", "stern_top") if n in p and len(p[n]) > 2]
    if tops and "free" not in opts:
        opts["free"] = max(0.35, min(2.0, min(tops)))
    pose = opts.pop("pose", None) or ent.get("pose")
    if pose == "lowering mast" and "mast" not in opts:
        opts["mast"] = "lowering"
    if "mast" in p and "mast_top" in p and opts.get("mast") and "mast_angle" not in opts:
        foot, top = V(p["mast"]), V(p["mast_top"])
        opts["mast_angle"] = max(0.0, min(85.0, math.degrees(math.atan2(-(top - foot).dot(hd), max(0.1, top.z - foot.z)))))
    opts.setdefault("mapped_length", ent.get("length_m"))
    if sink == "world":
        return boat(front, rear, water_h, kind, pose=pose, **opts)
    return boat_nodes(map_id or ent.get("name", "boat"), front, rear, water_h, kind, pose=pose, **opts)


# ---------------------------------------------------------------- baking a BoatNodes into Blender objects

def _mesh_from_buckets(bpy, B, name, palette=False):
    """One mesh object from a bucket set, one material slot per bucket (smooth, sharp above 35 degrees)."""
    me = bpy.data.meshes.new(name)
    verts, faces, mats, uvs = [], [], [], []
    keys = [kk for kk in sorted(B.data) if B.data[kk]["f"]]
    for mi, key in enumerate(keys):
        b = B.data[key]
        base = len(verts)
        verts += [tuple(v) for v in b["v"]]
        for f, uv in zip(b["f"], b["uv"]):
            faces.append([base + q for q in f])
            mats.append(mi)
            uvs.append((uv, key[0]))
    me.from_pydata(verts, [], faces)
    for key in keys:
        mat = sb.make_material(key[0])
        if palette:
            _true_colour(bpy, mat, key[0])
        me.materials.append(mat)
    for poly, mi in zip(me.polygons, mats):
        poly.material_index = mi
    uvl = me.uv_layers.new(name="UVMap")
    for poly, (explicit, mname) in zip(me.polygons, uvs):
        tile = sb.MATERIALS[mname][1]
        for kk, li in enumerate(poly.loop_indices):
            uvl.data[li].uv = explicit[kk] if explicit else sb.box_uv(me.vertices[me.loops[li].vertex_index].co,
                                                                     poly.normal, tile)
    me.validate()
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(35))
    ob = bpy.data.objects.new(name, me)
    return ob


def _unit_line(bpy, name, r, kind, palette=False, rungs=0):
    """A unit-length line along the node's local -Y in Blender (+Z in glTF): a 4-sided rope, a plank, or a ladder (two
    rails and `rungs` rungs, spaced for the line's built length: the page scales the node along its length)."""
    me = bpy.data.meshes.new(name)
    if kind == "ladder":
        verts, faces = [], []

        def box(cx, cz, y0, y1, hx, hz):
            b = len(verts)
            verts.extend([(cx - hx, y0, cz - hz), (cx + hx, y0, cz - hz), (cx + hx, y0, cz + hz), (cx - hx, y0, cz + hz),
                          (cx - hx, y1, cz - hz), (cx + hx, y1, cz - hz), (cx + hx, y1, cz + hz), (cx - hx, y1, cz + hz)])
            faces.extend([(b, b + 1, b + 5, b + 4), (b + 1, b + 2, b + 6, b + 5), (b + 2, b + 3, b + 7, b + 6),
                          (b + 3, b, b + 4, b + 7), (b, b + 3, b + 2, b + 1), (b + 4, b + 5, b + 6, b + 7)])
        for cx in (-0.21, 0.21):
            box(cx, 0.0, 0.0, -1.0, 0.025, 0.025)
        n = max(2, rungs)
        for i in range(1, n):
            y = -i / n
            b = len(verts)
            verts.extend([(-0.21, y - 0.015, -0.018), (0.21, y - 0.015, -0.018), (0.21, y + 0.015, 0.018),
                          (-0.21, y + 0.015, 0.018)])
            faces.append((b, b + 1, b + 2, b + 3))
        me.from_pydata(verts, [], faces)
        m = sb.make_material("bamboo")
        if palette:
            _true_colour(bpy, m, "bamboo")
        me.materials.append(m)
        me.validate()
        return bpy.data.objects.new(name, me)
    if kind == "plank":
        w, t = 0.21, 0.03
        verts = [(-w, 0, -t), (w, 0, -t), (w, 0, t), (-w, 0, t), (-w, -1, -t), (w, -1, -t), (w, -1, t), (-w, -1, t)]
        faces = [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (0, 3, 2, 1), (4, 5, 6, 7)]
        mat = "deck"
    else:
        verts = [(r * math.cos(a), 0, r * math.sin(a)) for a in (0.785, 2.356, 3.927, 5.498)]
        verts += [(x, -1, z) for x, _, z in verts]
        faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
        mat = "rope"
    me.from_pydata(verts, [], faces)
    m = sb.make_material(mat)
    if palette:
        _true_colour(bpy, m, mat)
    me.materials.append(m)
    # outward winding
    me.validate()
    for p in me.polygons:
        c = p.center
        if p.normal.dot(V((c.x, 0, c.z))) < 0 and abs(p.normal.y) < 0.5:
            p.flip()
    return bpy.data.objects.new(name, me)


def bake_boat(bpy, coll, bn, palette=False, root_name=None):
    """The boat's node hierarchy in `coll`: the root empty at its rest pose, the nodes, points and lines (module doc,
    Nodes). Returns the root object."""
    C = V((bn.info["centre_x"], 0, 0))
    # node names are <node>:<boat name>[@lod1], unique in a file (Blender needs unique names; both detail levels of a
    # boat can share one GLB)
    sfx = ":" + bn.name + (f"@lod{bn.info['lod']}" if bn.info.get("lod") else "")
    root = bpy.data.objects.new(root_name or f"boat{sfx}", None)
    root.empty_display_type = "ARROWS"
    root.matrix_world = bn.M @ Matrix.Translation(C)
    coll.objects.link(root)
    for key in ("kind", "pose", "motion", "lw", "loa", "beam", "deck_z", "roof_z", "lod"):
        if bn.info.get(key) is not None:
            root[key] = bn.info[key]
    root["tris"] = sum(bn.tris.values())
    objs = {"root": root}

    def holder(name, parent, mesh_ob):
        """A node is an empty carrying the transform and extras, its mesh a child with an identity transform: the web
        pipeline's quantization rewrites the transform of a leaf node holding a mesh, never of a node with children."""
        e = bpy.data.objects.new(name, None)
        e.empty_display_size = 0.2
        coll.objects.link(e)
        e.parent = parent
        coll.objects.link(mesh_ob)
        mesh_ob.parent = e
        return e
    for name, nd in bn.sink.nodes.items():
        if not any(b["f"] for b in nd["B"].data.values()):
            continue
        mo = _mesh_from_buckets(bpy, nd["B"], name + sfx + "/mesh", palette)
        ob = holder(name + sfx, root, mo)
        ob.location = nd["origin"] - C
        ob.rotation_euler = (0, nd["rot_y"], 0)
        for kk, vv in nd["extras"].items():
            ob[kk] = vv
        if name.endswith("__col") or name.endswith("__edge"):
            mo.hide_render = True
            mo.display_type = "WIRE"
        objs[name] = ob
    # points as extras on their node, in the node's glTF frame (y up: Blender (x, y, z) -> (x, z, -y)): empty nodes
    # would not survive gltf-transform's prune in the web pipeline
    pts, world_pts = {}, []
    for p in bn.sink.points:
        parent = objs.get(p["node"], root)
        q = p["local"] - C if parent is root else p["local"]
        pts.setdefault(parent.name, {})[p["name"]] = [round(q.x, 4), round(q.z, 4), round(-q.y, 4)]
        if p["extras"].get("world"):
            world_pts.append(p["name"])
    for oname, d in pts.items():
        bpy.data.objects[oname]["points"] = d
    if world_pts:
        root["world_points"] = world_pts
    for ln in bn.sink.lines:
        ob = holder(ln["name"] + sfx, root, _unit_line(bpy, ln["name"] + sfx + "/mesh", ln["r"], ln["kind"], palette,
                                                       ln.get("rungs", 0)))
        A, Bp = ln["A"], ln["B"]
        d = Bp - A
        ob.location = A - C
        ob.rotation_mode = "QUATERNION"
        ob.rotation_quaternion = d.normalized().to_track_quat("-Y", "Z")
        ob.scale = (1, d.length, 1)
        ob["a"], ob["b"] = ln["a"], ln["b"]
        if ln["kind"] == "plank":
            ob["collide"] = True
    return root


def export_boats(bpy, scene, bns, path, palette=False):
    """One GLB holding the given boats (BoatNodes), each a root node named boat:<name> at its rest pose, with extras
    (custom properties) on. Materials are song_kit's by name, so tools/export_web_scene.mjs's texture step (or the
    same gltf-transform optimize) shares their swatches with the sections."""
    coll = bpy.data.collections.new("boats_export")
    scene.collection.children.link(coll)
    for bn in bns:
        bake_boat(bpy, coll, bn, palette)
    for o in scene.objects:
        o.select_set(o.name in coll.objects)
    kw = dict(filepath=path, export_format="GLB", use_active_scene=True, use_selection=True, export_apply=True,
              export_cameras=False, export_yup=True, export_animations=False, export_extras=True)
    win = bpy.context.window
    if win is None:
        with bpy.context.temp_override(scene=scene):
            bpy.ops.export_scene.gltf(**kw)
    else:
        prev = win.scene
        win.scene = scene
        try:
            bpy.ops.export_scene.gltf(**kw)
        finally:
            win.scene = prev
    return coll


# ---------------------------------------------------------------- the water: one flat strip per reach
# map/BUILDING.md "Boats and water", gen/boats/water.md. A reach is a layout.json `water` entity with `lines.shore_n`
# and `lines.shore_s` ([X, D] at the water's H). The surface is the region between them, closed at each end straight
# across, or (when both ends lie within `near` m of the painted area's edge) along that edge: run on `run_on` m past
# the silk's top and bottom edges (under the mist, BUILDING.md rule 4) and stopped exactly on a seam, where the
# neighbour section's strip goes on (both are cut on the seam at the water's H, so they meet without overlapping).
# It is cut into trapezoids between columns across the flow (at every boundary point, at most `max_gap` m apart), each
# with four rows: the two shores and `inner` m in from each, so the shore band and the fading lines have their own
# vertices. UV0 = (s, n): metres along the flow and across it (left of the flow +), in world terms, so the page's
# drifting line tile runs on across seams; TEXCOORD_1 = (metres to the nearest mapped shore, clamped to `inner`; 1.0):
# the second value tells the page's water shader that this mesh carries shore data (web/src/water.js). The shores get
# invisible walls (`edge:shore`, from 0.6 m under the water to `wall_top`), so nobody walks into the river, in 0.5 m
# pieces: the page opens the pieces in front of a boat that touches the bank (web/src/boats.js), and what is left
# beyond a contact's end is under 0.5 m, too narrow for a walker to pass.

def _seg_closest(p, a, b):
    ax, ay = a
    dx, dy = b[0] - ax, b[1] - ay
    L2 = dx * dx + dy * dy
    t = 0.0 if L2 < 1e-12 else max(0.0, min(1.0, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L2))
    return (ax + dx * t, ay + dy * t), t


def _dist_to_lines(p, lines):
    best = 1e18
    for ln in lines:
        for a, b in zip(ln, ln[1:]):
            q, _ = _seg_closest(p, a, b)
            best = min(best, math.hypot(p[0] - q[0], p[1] - q[1]))
    return best


def _frame_u_to_world(frames, u, v, H):
    """A scan point at height H -> (X, D) by the section's frame (map/README.md, Frames: v = ov + dy D - h H,
    u = ou + ax X + dx(u) D)."""
    f = next((fr for fr in frames if fr["covers"][0] <= u <= fr["covers"][1]), frames[0])
    k = f.get("dx_knots") or []
    if not k:
        dxu = f["d"][0]
    elif u <= k[0][0]:
        dxu = k[0][1]
    elif u >= k[-1][0]:
        dxu = k[-1][1]
    else:
        dxu = k[-1][1]
        for (u0, d0), (u1, d1) in zip(k, k[1:]):
            if u <= u1:
                dxu = d0 + (u - u0) / (u1 - u0) * (d1 - d0)
                break
    D = (v - f["origin"][1] + f["h"] * H) / f["d"][1]
    return ((u - f["origin"][0] - dxu * D) / f["x"][0], D)


def water_quad(layout, H, area_u=None, silk=(0.0, 1790.0)):
    """The painted area (sw, se, ne, nw) at the water's height H, from layout.json's frames: the seams and the silk's
    edges where the water's own points lie (a point at H -1.5 maps about 2.25 m further south than one at H 0, so the
    ground-level painted_area would leave a sliver between two sections' water). area_u: the section's scan u range
    (default: read from painted_area's `about`)."""
    import re
    if area_u is None:
        m = re.search(r"scan u (\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)", layout.get("painted_area", {}).get("about", ""))
        if not m:
            return [tuple(c) for c in layout["painted_area"]["corners"]]
        area_u = (float(m.group(1)), float(m.group(2)))
    u0, u1 = area_u
    vt, vb = silk
    fr = layout["frames"]
    return [_frame_u_to_world(fr, u0, vb, H), _frame_u_to_world(fr, u1, vb, H), _frame_u_to_world(fr, u1, vt, H),
            _frame_u_to_world(fr, u0, vt, H)]


def _grow_quad(quad, grow):
    """Move each side (south, east, north, west: sw->se, se->ne, ne->nw, nw->sw) outward by grow[i] m and intersect."""
    lines = []
    for i in range(4):
        a, b = quad[i], quad[(i + 1) % 4]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        nx, ny = dy / L, -dx / L                    # right of a counter-clockwise ring: outward
        g = grow[i]
        lines.append(((a[0] + nx * g, a[1] + ny * g), (dx, dy)))
    out = []
    for i in range(4):
        (p, r), (q, s) = lines[i - 1], lines[i]
        den = r[0] * s[1] - r[1] * s[0]
        t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / den
        out.append((p[0] + r[0] * t, p[1] + r[1] * t))
    return out


def _perimeter_point(quad, p):
    """The nearest point on the quad's perimeter and its perimeter parameter (side index + fraction)."""
    best = None
    for i in range(4):
        q, t = _seg_closest(p, quad[i], quad[(i + 1) % 4])
        d = math.hypot(p[0] - q[0], p[1] - q[1])
        if best is None or d < best[0]:
            best = (d, q, i + t)
    return best


def _boundary_path(quad, a, b):
    """From a to b along the quad's perimeter, the shorter way round: [a', corners..., b'] (a', b' on the perimeter)."""
    _, qa, ta = _perimeter_point(quad, a)
    _, qb, tb = _perimeter_point(quad, b)
    lens = [math.hypot(quad[(i + 1) % 4][0] - quad[i][0], quad[(i + 1) % 4][1] - quad[i][1]) for i in range(4)]

    def walk(t0, t1, step):
        pts, t = [], t0
        while True:
            nxt = (math.floor(t) + 1) if step > 0 else (math.ceil(t) - 1)
            if (step > 0 and nxt >= t1) or (step < 0 and nxt <= t1):
                return pts
            pts.append(quad[int(nxt) % 4])
            t = nxt

    def plen(t0, t1, step):
        # perimeter length from t0 to t1 going one way (t in [0, 4))
        L, t = 0.0, t0
        for _ in range(9):
            nxt = (math.floor(t) + 1) if step > 0 else (math.ceil(t) - 1)
            end = t1 if (step > 0 and nxt >= t1) or (step < 0 and nxt <= t1) else nxt
            L += abs(end - t) * lens[int(min(t, end)) % 4]
            if end == t1:
                return L
            t = end
        return L
    fwd_t1 = tb if tb >= ta else tb + 4
    bwd_t1 = tb if tb <= ta else tb - 4
    if plen(ta, fwd_t1, 1) <= plen(ta, bwd_t1, -1):
        return [qa] + walk(ta, fwd_t1, 1) + [qb]
    return [qa] + walk(ta, bwd_t1, -1) + [qb]


class WaterStrip:
    """One reach's flat water: verts [(X, D)], faces [(i, j, k)], uv0 [(s, n)], uv1 [(shore_m, 1.0)], at height H,
    plus the shore walls it added to the active buckets (`edge:shore`). tris: the surface's triangles (the section's
    placed.json owners[<water id>]; the walls count under edge:shore by themselves)."""

    def __init__(self, map_id, H):
        self.map_id, self.H = map_id, H
        self.verts, self.faces, self.uv0, self.uv1 = [], [], [], []
        self.polygon, self.wall_pieces, self.notes = [], 0, []

    @property
    def tris(self):
        return len(self.faces)


def water_strip(water, frame=None, map_id="", layout=None, quad=None, seams=("west", "east"), flow=(1.0, 0.0),
                inner=2.5, max_gap=8.0, run_on=16.0, near=3.0, walls=True, wall_top=None, wall_piece=0.5,
                area_u=None):
    """The flat water of one reach (module section "the water"). water: the layout.json `water` entity (lines.shore_n,
    lines.shore_s; or lines.centre with `width_m` for a stream drawn as one line); frame: map/frames/<S>.json (its
    supports.water.H), a number, or None (the entity's H); layout: the section's layout.json (frames and painted area:
    where the strip stops on the seams and runs on past the silk's edges), or quad = [sw, se, ne, nw] at the water's
    H; seams: the sides that are seams to a neighbour (the strip stops there; any other side of the painted area it
    reaches is run on `run_on` m); flow: the downstream direction (+X: the 汴河 flows east, gen/boats/water.md).
    Adds the shore walls to the active buckets inside sb.entity("edge:shore") when walls=True; wall_top defaults to
    1.3 m above the higher of the water and H 0. Returns a WaterStrip; make its mesh with water_mesh()."""
    if isinstance(frame, dict):
        H = frame.get("supports", {}).get("water", {}).get("H", water.get("H", 0.0))
    elif frame is not None:
        H = float(frame)
    else:
        H = water.get("H", 0.0)
    ws = WaterStrip(map_id or water.get("id", ""), H)
    lines = water.get("lines") or {}
    sn, ss = lines.get("shore_n"), lines.get("shore_s")
    if (not sn or not ss) and lines.get("centre"):
        # a stream mapped as its centre line: shores at half its width either side (choice: width_m, default 3 m)
        c, hw = lines["centre"], water.get("width_m", 3.0) / 2
        sn, ss = [], []
        for i, p in enumerate(c):
            a, b = c[max(0, i - 1)], c[min(len(c) - 1, i + 1)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy) or 1.0
            sn.append((p[0] - dy / L * hw, p[1] + dx / L * hw))
            ss.append((p[0] + dy / L * hw, p[1] - dx / L * hw))
        ws.notes.append(f"choice: stream {2 * hw:.1f} m wide about its mapped centre line")
    if not sn or not ss:
        raise ValueError(f"water {ws.map_id}: needs lines.shore_n and lines.shore_s (or lines.centre)")
    sn, ss = [tuple(p[:2]) for p in sn], [tuple(p[:2]) for p in ss]
    d = lambda p, q: math.hypot(p[0] - q[0], p[1] - q[1])  # noqa: E731
    if d(ss[0], sn[0]) + d(ss[-1], sn[-1]) > d(ss[0], sn[-1]) + d(ss[-1], sn[0]):
        sn = sn[::-1]
    if quad is None and layout is not None:
        quad = water_quad(layout, H, area_u)
    grown = None
    if quad is not None:
        names = ("south", "east", "north", "west")
        grown = _grow_quad(quad, [0.0 if names[i] in seams else run_on for i in range(4)])

    def edge_dist(p):
        return _perimeter_point(quad, p)[0] if quad is not None else 1e9

    def to_grown(p):
        # the nearest side of the painted area, then that side moved out by its run-on
        _, q, t = _perimeter_point(quad, p)
        i = int(t) % 4
        a, b = quad[i], quad[(i + 1) % 4]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        g = [0.0 if ("south", "east", "north", "west")[j] in seams else run_on for j in range(4)][i]
        return (q[0] + (b[1] - a[1]) / L * g, q[1] - (b[0] - a[0]) / L * g)

    def closing(a, b):
        if d(a, b) < 2.0 or grown is None or edge_dist(a) > near or edge_dist(b) > near:
            return []
        return _boundary_path(grown, to_grown(a), to_grown(b))
    ring = list(ss) + closing(ss[-1], sn[-1]) + list(reversed(sn)) + closing(sn[0], ss[0])
    clean = []
    for p in ring:
        if not clean or d(p, clean[-1]) > 1e-4:
            clean.append(p)
    if len(clean) > 2 and d(clean[0], clean[-1]) < 1e-4:
        clean.pop()
    ring = clean
    ws.polygon = ring
    fx, fy = flow
    fl = math.hypot(fx, fy)
    fx, fy = fx / fl, fy / fl
    S_ = lambda p: p[0] * fx + p[1] * fy          # noqa: E731  along the flow
    T_ = lambda p: -p[0] * fy + p[1] * fx         # noqa: E731  across it, left (north for an eastward flow) +
    back = lambda s, t: (s * fx - t * fy, s * fy + t * fx)  # noqa: E731
    shores = [ss, sn]
    edges = [(ring[i], ring[(i + 1) % len(ring)]) for i in range(len(ring))]
    cols = sorted({round(S_(p), 4) for p in ring})
    full = []
    for a, b in zip(cols, cols[1:]):
        full.append(a)
        n = int((b - a) / max_gap)
        full += [a + (b - a) * (i + 1) / (n + 1) for i in range(n)]
    full.append(cols[-1])
    cols = [c for i, c in enumerate(full) if i == 0 or c - full[i - 1] > 1e-6]
    vid = {}

    def vert(s, t):
        key = (round(s, 3), round(t, 3))
        if key not in vid:
            vid[key] = len(ws.verts)
            X, D = back(s, t)
            ws.verts.append((X, D))
            ws.uv0.append((s, t))
            ws.uv1.append((min(inner, _dist_to_lines((X, D), shores)), 1.0))
        return vid[key]

    def t_at(e, s):
        (s0, t0), (s1, t1) = (S_(e[0]), T_(e[0])), (S_(e[1]), T_(e[1]))
        return t0 + (t1 - t0) * (s - s0) / (s1 - s0)
    for s0, s1 in zip(cols, cols[1:]):
        sm = (s0 + s1) / 2
        cross = [e for e in edges if min(S_(e[0]), S_(e[1])) <= s0 + 1e-3 and max(S_(e[0]), S_(e[1])) >= s1 - 1e-3
                 and abs(S_(e[0]) - S_(e[1])) > 1e-9]
        cross.sort(key=lambda e: t_at(e, sm))
        for lo, hi in zip(cross[0::2], cross[1::2]):
            rows = []
            for s in (s0, s1):
                a, b = t_at(lo, s), t_at(hi, s)
                w = max(0.0, b - a)
                k_ = min(inner, w / 2)
                rows.append([vert(s, a), vert(s, a + k_), vert(s, b - k_), vert(s, b)])
            for r in range(3):
                a0, a1, b0, b1 = rows[0][r], rows[0][r + 1], rows[1][r], rows[1][r + 1]
                for f in ((a0, b0, b1), (a0, b1, a1)):
                    if len(set(f)) == 3:
                        P = [ws.verts[i] for i in f]
                        area = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])
                        if abs(area) > 1e-6:
                            ws.faces.append(f if area > 0 else (f[0], f[2], f[1]))
    if walls:
        top = wall_top if wall_top is not None else max(H, 0.0) + 1.3
        inside = (lambda p: True) if quad is None else (lambda p: all(
            (p[0] - quad[i][0]) * (quad[(i + 1) % 4][1] - quad[i][1]) - (p[1] - quad[i][1]) * (quad[(i + 1) % 4][0] - quad[i][0]) <= 1.0
            * math.hypot(quad[(i + 1) % 4][0] - quad[i][0], quad[(i + 1) % 4][1] - quad[i][1]) for i in range(4)))
        with sb.entity("edge:shore"):
            for ln in shores:
                for a, b in zip(ln, ln[1:]):
                    L = d(a, b)
                    n = max(1, math.ceil(L / wall_piece))
                    for i in range(n):
                        p = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
                        q = (a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n)
                        if not (inside(p) or inside(q)):
                            continue
                        k.add("hidden", True, [V((p[0], p[1], H - 0.6)), V((q[0], q[1], H - 0.6)), V((q[0], q[1], top)),
                                               V((p[0], p[1], top))], [(0, 1, 2, 3)])
                        ws.wall_pieces += 1
    return ws


def water_mesh(bpy, strips, name="g_water_strip__nocol", coll=None):
    """One mesh object for one or more WaterStrips (one draw call per section): material `water`, TEXCOORD_0 = (s, n),
    TEXCOORD_1 = (shore distance, 1) (Blender layers "UVMap" and "Blend", written with v flipped because the glTF
    exporter flips it back; export_web_scene.mjs keeps TEXCOORD_1). Links it to coll when given. Returns the object."""
    verts, faces, uv0, uv1 = [], [], [], []
    for ws in strips:
        base = len(verts)
        verts += [(x, y, ws.H) for x, y in ws.verts]
        faces += [tuple(base + i for i in f) for f in ws.faces]
        uv0 += ws.uv0
        uv1 += ws.uv1
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    l0, l1 = me.uv_layers.new(name="UVMap"), me.uv_layers.new(name="Blend")
    # Blender's glTF export writes v as 1 - v: flip here, so the GLB holds (s, n) and (shore metres, 1) as they are
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            l0.data[li].uv = (uv0[vi][0], 1.0 - uv0[vi][1])
            l1.data[li].uv = (uv1[vi][0], 1.0 - uv1[vi][1])
    me.materials.append(sb.make_material("water"))
    ob = bpy.data.objects.new(name, me)
    if coll is not None:
        coll.objects.link(ob)
    return ob


# ---------------------------------------------------------------- presets (the review set; gen/boats/types.md)

PRESETS = {
    # the big passenger boat with the long windowed cabin (S2 u 22420-23720; S3 u 16330-17370; S4b u 14880-15550)
    "passenger": dict(kind="passenger", moor=[(6.5, -7.0, 0.0)]),
    # the big boat lowering its A-frame mast under the Rainbow Bridge (S3 u 19350-20450, 大船抢险)
    "passenger_mast_lowering": dict(kind="passenger", mast="lowering", stern_house=True, bow_canopy=False,
                                    cabin={"x0": 0.24, "x1": 0.74, "segs": 2}, pose="lowering mast"),
    # the deep-laden grain boat at the bank (S2 u 27250-28900, 万石船), its gangplank to the bank
    "grain_laden": dict(kind="grain", hold="laden", gangplank=(3.0, -7.6, 0.0)),
    # a cargo boat riding high under arched mat awnings, worked by its sweep (S3 u 15550-15950, 摇橹向前)
    "grain_awning_sweep": dict(kind="grain", hold="awning", laden=False, sweep="starboard", pose="rowed"),
    # a cargo boat with its A-frame mast up, towed by trackers on the bank (S3 u 15950-16230; S2 u 23500-25100)
    "grain_mast_towed": dict(kind="grain", hold="awning", laden=False, mast="up", tow_to=(34.0, -9.0, 1.2),
                             pose="towed"),
    # the small boat with a mat awning and laundry (S2 u 22280-22720; S4b u 15180-15480; S2 u 24250-24500)
    "small_awning": dict(kind="small", cloths=True),
    # the small open boat with thwarts (S2 u 21950-22300)
    "small_open": dict(kind="small", awning=False, cargo=[("basket", 0.3, 0.0, "deck")]),
    # ---- round 2 options (catalogue §4; the boats that need them in brackets)
    # B2 + B6: a pointed bow, a lashed stern frame with the rudder on it (S1 36440; S2 21080, 22158, 28395; S3 19255)
    "r2_small_pointed": dict(kind="small", awning=False, bow="pointed", stern_frame=True,
                             cargo=[("basket", 0.3, 0.0, "deck")]),
    # B1 + B2 + B6: a low canopy amidships and a higher hooded cabin aft, a tiller (S4b 15182)
    "r2_small_canopy": dict(kind="small", awning=False, bow="pointed", stern_frame=True,
                            awnings=[(0.36, 0.66, "canopy", {"h": 0.95}), (0.08, 0.34, "hood", {"end": "aft", "rise": 1.3})]),
    # B1 + B5 + anchor + the gangplank fix: S4b's mat-cargo boat (dark barrel roof over its bow, the sweep shipped,
    # a stern anchor line), its plank square to the deck's edge
    "r2_grain_mat_cargo": dict(kind="grain", hold="laden", lw=12.0, beam=3.1, free=0.55, sweep="port",
                               sweep_pose="shipped", awnings=[(0.82, 1.06, "hood", {"end": "fore", "mat": "bark"})],
                               anchor=[(-17.0, 3.5, -1.5)], gangplank=(6.5, -7.3, 0.0)),
    # B1 + B10 + B11: S3's unloading boat (flat lattice awning aft, an arched hood forward, a grapnel under the bow)
    "r2_grain_unloading": dict(kind="grain", hold="hatch", laden=False, cabin=False, grapnel=True, fenders=("coil", "bow"),
                               awnings=[(0.06, 0.3, "flat"), (0.56, 0.82, "arch")]),
    # B9 + B1: S3's boat under way, a raised bow deck with its A-frame, a big arched roof, the sweep working
    "r2_grain_bow_deck": dict(kind="grain", hold="hatch", laden=False, cabin=False, bow_deck=2.75, sweep="starboard",
                              pose="rowed", awnings=[(0.22, 0.8, "arch", {"rise": 1.5})]),
    # B4: the open cabin (S3 19225, two passengers at its rail; S2 22545's open bay)
    "r2_passenger_open": dict(kind="passenger", cabin={"pattern": "open", "x0": 0.3, "x1": 0.72, "segs": 1},
                              bow_canopy=False, windlass=[(0.4, "roof")], fenders=True),
    # B7 pole mast on the roof + B1 bow hood: 逆水行舟 (S2 23632), towed
    "r2_passenger_pole_mast": dict(kind="passenger", mast="up", mast_form="pole", mast_step="roof", mast_at=0.5,
                                   tow_to=(34.0, -9.0, 1.2), pose="towed", bow_canopy=False,
                                   awnings=[(0.9, 1.04, "hood", {"end": "fore"})]),
    # B7 crutch + B5 rest: S4b's big boat (board walls, the mast laid down in a crutch, the sweep at rest)
    "r2_passenger_crutch": dict(kind="passenger", lw=11.4, beam=3.2, free=0.9, bow_canopy=False, sweep="port",
                                sweep_pose="rest", mast="down", crutch=True,
                                cabin={"x0": 0.14, "x1": 0.92, "pattern": "boards", "roof": "board", "segs": 3}),
    # B3 + B8 + B1: S2's hooded-bow cargo boat (a bow windlass and one on a post, a ladder to the bank, a gabled
    # deckhouse aft, fenders)
    "r2_grain_windlass_ladder": dict(kind="grain", hold="awning", laden=False, cabin=False, gangway="ladder",
                                     gangplank=(3.0, -7.4, 0.0), windlass=["bow", (0.2, "post")], fenders=("logs",),
                                     awnings=[(0.86, 1.02, "hood", {"end": "fore"}), (0.02, 0.24, "gable")]),
}


# ---------------------------------------------------------------- review and export (headless)

# web/src/palette.js (the true colours the page gives each material), for the review renders only
PALETTE = {"timber": "#6d5c4b", "deck": "#9c907f", "reed": "#a59472", "bamboo": "#ad9064", "cloth_white": "#e3e1d9",
           "water": "#6f8e8f", "redwood": "#7f3d2f", "stone": "#a9a7a1", "ground": "#9c917b"}


def _review_water_ring(bpy, mat):
    """Review only: the ring as the page would draw it, fading out along uv.x."""
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    uv = nt.nodes.new("ShaderNodeUVMap")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = 0.0, 1.0
    mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 0.55, 0.0
    nt.links.new(uv.outputs["UV"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], bsdf.inputs["Alpha"])
    try:
        mat.surface_render_method = "BLENDED"
    except Exception:
        pass


def _true_colour(bpy, mat, name):
    """Review only: what palette.js does on the page -- a textured material keeps its painting, its mean colour moved
    to the true colour (multiply by target / mean, per channel, linear)."""
    if name == "water_ring" and not mat.get("true_colour"):
        mat["true_colour"] = 1
        _review_water_ring(bpy, mat)
        return
    hexc = PALETTE.get(name)
    if not hexc or mat.get("true_colour"):
        return
    nt = mat.node_tree
    img = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None)
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    c = hexc.lstrip("#")
    lin = [(int(c[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)]
    mat["true_colour"] = 1
    if img is None:
        bsdf.inputs["Base Color"].default_value = (*lin, 1)
        return
    px = img.image.pixels[:]
    n = len(px) // 4
    idx = range(0, n, max(1, n // 4096))
    mean = [sum(px[i * 4 + ch] for i in idx) / len(idx) for ch in range(3)]
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    nt.links.new(img.outputs["Color"], mix.inputs["A"])
    mix.inputs["B"].default_value = (*[min(4.0, t / max(1e-3, m_)) for t, m_ in zip(lin, mean)], 1)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])


SCALE_FIGURE = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\characters\carter\carter_raw.glb"


def _figure(bpy, coll, x, y, z, facing=0.0):
    """Review only: a scale figure (the carter character in its rest pose, else a 1.65 m mannequin)."""
    if os.path.exists(SCALE_FIGURE):
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=SCALE_FIGURE)
        new = [o for o in bpy.data.objects if o not in before]
        for o in new:
            for c in list(o.users_collection):
                c.objects.unlink(o)
            coll.objects.link(o)
            if o.type == "ARMATURE":
                if o.animation_data:
                    o.animation_data.action = None
                for pb in o.pose.bones:
                    pb.matrix_basis.identity()
            if o.type == "EMPTY" or o.name.startswith(("tack_", "prop_", "Icosphere")):
                o.hide_render = True
            o.name = "standin_" + o.name
        for o in new:
            if o.parent is None:
                o.location = (x, y, z)
                o.rotation_mode = "XYZ"
                o.rotation_euler = (o.rotation_euler[0], o.rotation_euler[1], math.radians(facing + 90))
        return
    import bmesh
    me = bpy.data.meshes.new("figure")
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.2, radius2=0.18, depth=1.4,
                          matrix=Matrix.Translation((0, 0, 0.7)))
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.12, matrix=Matrix.Translation((0, 0, 1.53)))
    bm.to_mesh(me)
    ob = bpy.data.objects.new("standin_figure", me)
    ob.location = (x, y, z)
    coll.objects.link(ob)


REVIEW_FRONT, REVIEW_REAR = (10.0, 0.0), (-10.0, 0.0)
WATER_H = -1.5      # the S4b frame's seed (S5's moat); the river agent's measured value replaces it in the sections
BANK_Y = -7.0       # the review bank's edge, 7 m south of the boats' centreline


WATER_LINES = r"\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\boats\water\water_lines.png"


def _review_water(bpy, mat, tile=8.0, ink=0.3):
    """Review only: the water as proposed in gen/boats/water.md -- the palette's water colour, the painted current
    lines (one 512 px tile per 8 m, u along the flow) darkening it by up to `ink`, the lines fading out over the 2.5 m
    next to the shore, and a pale soft band along the shore."""
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    base = tuple(bsdf.inputs["Base Color"].default_value)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs["Vector"])
    sc = nt.nodes.new("ShaderNodeVectorMath")
    sc.operation = "SCALE"
    sc.inputs["Scale"].default_value = 1.0 / tile
    nt.links.new(geo.outputs["Position"], sc.inputs[0])
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(WATER_LINES, check_existing=True)
    tex.image.colorspace_settings.name = "Non-Color"
    nt.links.new(sc.outputs["Vector"], tex.inputs["Vector"])
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    nt.links.new(tex.outputs["Color"], inv.inputs[1])
    fade = nt.nodes.new("ShaderNodeMapRange")
    fade.inputs["From Min"].default_value, fade.inputs["From Max"].default_value = BANK_Y + 0.3, BANK_Y + 2.8
    nt.links.new(sep.outputs["Y"], fade.inputs["Value"])
    m1 = nt.nodes.new("ShaderNodeMath")
    m1.operation = "MULTIPLY"
    nt.links.new(inv.outputs["Value"], m1.inputs[0])
    nt.links.new(fade.outputs["Result"], m1.inputs[1])
    m2 = nt.nodes.new("ShaderNodeMath")
    m2.operation = "MULTIPLY"
    m2.inputs[1].default_value = ink
    nt.links.new(m1.outputs["Value"], m2.inputs[0])
    dark = nt.nodes.new("ShaderNodeMix")
    dark.data_type = "RGBA"
    dark.inputs["A"].default_value = base
    dark.inputs["B"].default_value = tuple(c * 0.35 for c in base[:3]) + (1,)
    nt.links.new(m2.outputs["Value"], dark.inputs["Factor"])
    shore = nt.nodes.new("ShaderNodeMapRange")
    shore.inputs["From Min"].default_value, shore.inputs["From Max"].default_value = BANK_Y, BANK_Y + 0.9
    shore.inputs["To Min"].default_value, shore.inputs["To Max"].default_value = 0.45, 0.0
    nt.links.new(sep.outputs["Y"], shore.inputs["Value"])
    pale = nt.nodes.new("ShaderNodeMix")
    pale.data_type = "RGBA"
    nt.links.new(dark.outputs["Result"], pale.inputs["A"])
    pale.inputs["B"].default_value = (0.62, 0.66, 0.62, 1)
    nt.links.new(shore.outputs["Result"], pale.inputs["Factor"])
    nt.links.new(pale.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0


def _review_scene(bpy):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.62, 0.72, 0.84, 1)
    bg.inputs["Strength"].default_value = 0.85
    for o in list(scene.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.4
    sun.data.angle = math.radians(3)
    sun.rotation_euler = (math.radians(45), math.radians(10), math.radians(-30))
    scene.collection.objects.link(sun)

    def flat(name, verts, faces, hexc):
        import bmesh
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts, [], faces)
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=24, use_grid_fill=True)
        bm.to_mesh(me)
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        c = hexc.lstrip("#")
        lin = [(int(c[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)]
        next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (*lin, 1)
        me.materials.append(m)
        scene.collection.objects.link(bpy.data.objects.new(name, me))
    flat("water", [(-80, BANK_Y, WATER_H), (80, BANK_Y, WATER_H), (80, 80, WATER_H), (-80, 80, WATER_H)],
         [(0, 1, 2, 3)], PALETTE["water"])
    _review_water(bpy, bpy.data.materials["water"])
    flat("bank", [(-80, -80, 0), (80, -80, 0), (80, BANK_Y, 0), (-80, BANK_Y, 0), (80, BANK_Y, WATER_H - 0.6),
                  (-80, BANK_Y, WATER_H - 0.6)], [(0, 1, 2, 3), (3, 2, 4, 5)], PALETTE["ground"])
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = 1.1
    ls = scene.view_layers[0].freestyle_settings.linesets[0] if scene.view_layers[0].freestyle_settings.linesets else \
        scene.view_layers[0].freestyle_settings.linesets.new("ink")
    ls.select_by_visibility = True
    ls.select_crease = True
    ls.select_silhouette = True
    ls.select_border = True
    scene.view_layers[0].freestyle_settings.crease_angle = math.radians(140)
    ls.linestyle.color = (0.16, 0.12, 0.09)
    ls.linestyle.alpha = 0.85
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 28
    cam.data.clip_end = 400
    scene.collection.objects.link(cam)
    scene.camera = cam
    return scene, cam


def _preset_nodes(name, lod):
    opts = dict(PRESETS[name])
    kind = opts.pop("kind")
    return boat_nodes(name, REVIEW_FRONT, REVIEW_REAR, WATER_H, kind, lod=lod,
                      rng=random.Random(sum(map(ord, name))), **opts)


VIEWS = {
    # the walker on the bank, eye 1.6 m above the ground, looking across at the hull's middle
    "eye": (V((-2.0, -25.0, 1.6)), V((0.0, 0.0, 0.2))),
    "bow34": (V((25.0, -19.0, 8.0)), V((3.0, 0.0, 0.3))),
    "stern34": (V((-25.0, -17.0, 6.5)), V((-4.0, 0.0, 0.5))),
    # the scroll's own view: from the south, high, looking down about 30 degrees
    "scroll": (V((0.0, -34.0, 19.0)), V((0.0, 0.0, -0.5))),
}


def review(out_dir, only=None, lods=(0, 1)):
    import bpy
    scene, cam = _review_scene(bpy)
    names = [n for n in PRESETS if not only or n in only]
    colls, scales = {}, {}
    for name in names:
        for lod in lods:
            bn = _preset_nodes(name, lod)
            scales[f"{name}_lod{lod}"] = max(0.5, min(1.0, bn.info["loa"] / 24.0))
            key = f"{name}_lod{lod}"
            coll = bpy.data.collections.new(key)
            scene.collection.children.link(coll)
            bake_boat(bpy, coll, bn, palette=True)
            if lod == 0:
                H = bn.info["hull"]
                xb = H.lw * (0.87 if bn.info["kind"] != "small" else 0.86)
                zb = (H.deck_z(xb) if bn.info["kind"] != "small" else bn.info["deck_z"]) + WATER_H
                _figure(bpy, coll, REVIEW_REAR[0] + (REVIEW_FRONT[0] - REVIEW_REAR[0] - H.lw) / 2 + xb, 0.0, zb, -90)
                _figure(bpy, coll, -14.0, BANK_Y - 1.0, 0.0, 90)
            colls[key] = coll
            vis = sum(v for n, v in bn.tris.items() if not n.endswith(("__col", "__edge")))
            print(f"BOAT {key}: visible {vis} tris; nodes {bn.tris}; deck_z {bn.info['deck_z']} roof_z "
                  f"{bn.info['roof_z']} loa {bn.info['loa']} motion {bn.info['motion']} parts {bn.info['parts']}",
                  flush=True)
    for key, coll in colls.items():
        for kk, c in colls.items():
            c.hide_render = kk != key
        vlist = VIEWS if key.endswith("lod0") else {"eye": VIEWS["eye"], "far": (V((-8.0, -45.0, 1.6)), V((0, 0, 0.5)))}
        sc = scales[key]
        for vname, (loc, target) in vlist.items():
            if vname != "far":       # the views close in on a smaller boat; the eye stays 1.6 m above the bank
                loc = target + (loc - target) * sc
                loc.z = max(loc.z, 1.6) if vname == "eye" else loc.z
                if vname == "eye":
                    loc.y = min(loc.y, BANK_Y - 1.0)
                    loc.z = 1.6
            cam.location = loc
            cam.rotation_euler = (target - loc).normalized().to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = os.path.join(out_dir, f"{key}_{vname}.png")
            bpy.ops.render.render(write_still=True)
    print("REVIEW_DONE", flush=True)


def export(out_dir, only=None, lods=(0, 1)):
    """One GLB per preset and detail level (gen/boats/glb/<preset>_lod<n>_raw.glb) and export_stats.json."""
    import bpy
    import json
    scene = bpy.context.scene
    for o in list(scene.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    stats = {}
    for name in [n for n in PRESETS if not only or n in only]:
        for lod in lods:
            bn = _preset_nodes(name, lod)
            key = f"{name}_lod{lod}"
            coll = export_boats(bpy, scene, [bn], os.path.join(out_dir, f"{key}_raw.glb"))
            t = bn.tris
            stats[key] = {"visible_tris": sum(v for n, v in t.items() if not n.endswith(("__col", "__edge"))),
                          "collider_tris": {n: v for n, v in t.items() if n.endswith(("__col", "__edge"))},
                          "nodes": t, "lines": len(bn.sink.lines), "points": len(bn.sink.points),
                          **{kk: bn.info[kk] for kk in ("kind", "lw", "loa", "beam", "deck_z", "roof_z", "motion",
                                                        "parts")}}
            for o in list(coll.objects):
                bpy.data.objects.remove(o, do_unlink=True)
            bpy.data.collections.remove(coll)
            for me in list(bpy.data.meshes):
                if me.users == 0:
                    bpy.data.meshes.remove(me)
            print(f"EXPORT {key} {json.dumps(stats[key])}", flush=True)
    with open(os.path.join(out_dir, "export_stats.json"), "w") as f:
        json.dump(stats, f, indent=1)
    print("EXPORT_DONE", flush=True)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if argv and argv[0] in ("review", "export"):
        only = argv[2].split(",") if len(argv) > 2 and argv[2] not in ("", "all") else None
        lods = tuple(int(x) for x in argv[3].split(",")) if len(argv) > 3 else (0, 1)
        (review if argv[0] == "review" else export)(argv[1], only, lods)
