#!/usr/bin/env python3
"""Writes sections/city_end/people.json (and gen/sections/city_end/cast.json): every painted figure and every painted
animal of S7, the scroll's end (u 815-2000, map/text/S7.md), at its mapped spot (sections/city_end/layout.json), doing
what it is painted doing, and nobody else (map/BUILDING.md). The casting is gen/expand/city_end_needs.md with the
lead's calls of 2026-10-12 (round 2 Run 2): every figure is cast from the 22 existing characters; the one new
character (official_rider) plays its stand_in.

Kept as a script so the cast is redone as the workshop delivers. It holds what is wanted (the needs list's character,
action and props for each figure) and what plays now: each action step names the clips the painting wants first and
the nearest existing clips after them (ALIAS), and the script plays the first one the character (or its stand-in, or
the existing character a pose falls back to) has in web/public/assets/chars/characters.json; what is still to make
goes to clips_why. A figure whose wanted character can't hold its pose yet (a seat, a ride) is cast, until it can, on
the nearest character that can (POSE, cast_why). Carried props are switched on only when the playing character's GLB
has the prop_<name> part and the figure plays the clip that holds it (characters/props.json); the rest are listed
under props_why as wanted. Nudges and walks are computed here, each with its reason, against what the area builder
reports as built (gen/sections/city_end/solids.json, written by blender/city_end_scene.py after each build; until it
exists, the layout's footprints and props), the animals' real bodies and each other; the checks are printed.
    python3 gen/sections/city_end/make_people.py
"""
import json
import math
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))
J = lambda p: json.load(open(os.path.join(QM, p), encoding='utf-8'))
L = J('sections/city_end/layout.json')
S6 = J('sections/inner_city/layout.json')
REG = J('web/public/assets/chars/characters.json')
ANI = J('web/public/assets/animals/animals.json')
PROPS = J('characters/props.json')
for _m, _c in REG.items():   # the registry's own props {name: clip} (the workshop's last batch) win over props.json
    for _n, _clip in (_c.get('props') or {}).items():
        PROPS.setdefault(_m, {})[_n] = {**PROPS.get(_m, {}).get(_n, {}), 'clip': _clip}
FIG = {f['id']: f for f in L['figures']}
E = L['entities']
ANIMALS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'animal'}
SOLIDS_PATH = os.path.join(HERE, 'solids.json')
SOLIDS = json.load(open(SOLIDS_PATH, encoding='utf-8')) if os.path.exists(SOLIDS_PATH) else None


def plan(c):
    """characters/<name>.json: the workshop's record of a character (made or being made)."""
    p = os.path.join(QM, f'characters/{c}.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}


def height(c):
    return REG[c]['height_m'] if c in REG else plan(c)['height_m']


def glb_parts(c):
    """Names of the optional prop_<name> parts in a character's web GLB (empty when it isn't built)."""
    if c not in REG:
        return set()
    b = open(os.path.join(QM, 'web/public', REG[c]['file']), 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    return {x.get('name', '') for x in j.get('nodes', []) + j.get('meshes', []) if x.get('name', '').startswith('prop_')}


def clips(c):
    return REG.get(c, {}).get('clips', [])


# ---------------------------------------------------------------- casting (wanted: the needs list, "Casting")
CAST = {
    # the official's gatehouse (门房指路)
    'gatekeeper_seated_1082': 'robed_man', 'man_at_post_1118': 'idler', 'face_at_gate_door_1251': 'child',
    'pointing_man_1370': 'scholar', 'visitor_food_box_1308': 'camel_driver',
    # the street: the porter, the official riding out with his retinue, the walkers at the seam
    'porter_baskets_1255': 'dark_hat', 'folded_object_bearer_1490': 'townsman', 'official_rider_1610': 'official_rider',
    'groom_1698': 'groom', 'attendant_pale_1750': 'groom', 'walker_bag_1885': 'townsman',
    'bundle_man_1976': 'dark_hat',
    # 赵太丞家, the doctor's shop
    'doctor_dark_robe_1615': 'fortune_teller', 'standing_woman_1567': 'woman_pale', 'seated_woman_child_1535': 'woman_pale',
    'child_on_lap_1546': 'child',
    # the well's west end
    'bucket_man_1872': 'idler',
}
# the area's new character plays an existing one until the workshop delivers (the lead, 2026-10-12); the catalogue
# (gen/expand/round2/catalogue.md, 1b and 7) adds three more S7 casts: dark_hat (the porter, the bundle man), groom (the
# groom, the attendant in pale) and woman_pale (the two women), each playing its figure's first cast meanwhile
# (FIG_STAND_IN); the official rider plays the black-hatted recolour of the hat traveller if the workshop makes it (2e)
STAND_IN = {'official_rider': 'hat_traveller_dark' if 'hat_traveller_dark' in REG else 'hat_traveller',
            'dark_hat': 'porter', 'groom': 'inspector', 'woman_pale': 'woman'}
FIG_STAND_IN = {'porter_baskets_1255': 'porter', 'bundle_man_1976': 'inspector', 'groom_1698': 'inspector',
                'attendant_pale_1750': 'idler', 'standing_woman_1567': 'woman', 'seated_woman_child_1535': 'woman'}
STAND_IN_WHY = {
    'dark_hat': 'catalogue item 14 (model S7.fig.porter_baskets_1255: a wide dark hat with an upturned brim, a dark short '
                'belted jacket, light trousers): the porter plays the porter with his baskets (carry_pole, pole_baskets), '
                'the inspector the man with the small bundle, until it lands',
    'groom': 'catalogue item 17 (model S7.fig.groom_1698: a dark short jacket, pale trousers, a dark round cap): the '
             'inspector plays the groom and the idler the attendant in pale, until it lands',
    'woman_pale': 'catalogue item 45 or the free recolour woman_pale (2e; model S7.fig.standing_woman_1567: a high dark '
                  'bun, a pale long robe under a short over-jacket): the woman plays both women, until it lands',
    'official_rider': 'hat_traveller: the bearded official in the very broad flat-brimmed black hat and pale round-collared '
                      'robe (needs list, "The one character worth making", model official_rider_1610, crop [1550, 975, '
                      '1680, 1215]); the hat traveller already rides (ride) and has the broadest hat of the cast (a '
                      'woven straw cone, a buff cross-collared robe)',
}
# a pose the wanted character can't hold yet (it lacks every clip that holds it): cast, until it can, the nearest
# existing character that can (by dress); a seated figure never stands, a rider always rides
POSE = {
    'gatekeeper_seated_1082': (['sit_talk', 'sit'], 'elder',
                               'wanted robed_man with sit_talk (free: from:official/sit_talk; the robed man\'s own sit '
                               'was trimmed and comes back free from gen/); the robed man has no seated clip now, and the '
                               'gatekeeper is painted seated on his box seat, so until it lands he is the elder (white '
                               'beard, pale robe: the nearest seated character to a bearded man in a plain light robe; '
                               'his tall black hat is not painted) playing sit. Not the idler (sit), who plays the '
                               'look-alike man at the post beside him, nor the scholar, who plays the pointing man 4 m '
                               'east (needs list: spread look-alike neighbours)'),
    'official_rider_1610': (['ride'], 'hat_traveller',
                            'wanted official_rider (new) riding the official\'s horse; until it exists, and if it ever '
                            'arrives without ride, the hat traveller rides'),
}
CAST_WHY = {
    'man_at_post_1118': 'idler (light clothes, small top-knot; a servant or second doorman), not the gatekeeper\'s '
                        'character: the two look alike on the scroll and are painted side by side (needs list)',
    'face_at_gate_door_1251': 'child (conf low: the map\'s other reading is a small lamp hung in the gate); the area agent '
                              'builds it as this figure, once (the lead, 2026-10-12)',
    'doctor_dark_robe_1615': 'fortune_teller (long dark robe over pale trousers, dark cap; the townsman\'s slate robe '
                             'is the fallback): examine_child is new, hand_over (free: from:carter/hand_over) stands in '
                             'when it lands; until then idle',
    'child_on_lap_1546': 'child, carried_by the seated woman: the page doesn\'t draw it, the carrier\'s prop does '
                         '(people.json carried_by; S4\'s child_in_arms_10430)',
}

# What each figure is painted doing: steps (wanted clips in order, seconds). The first wanted clip the playing
# character has is played; failing all, the first of ALIAS[last wanted] it has (then idle). Wanted clips the wanted
# character lacks go to clips_why.
DO = {
    'gatekeeper_seated_1082': [(['sit_talk'], 12)],
    'man_at_post_1118': [(['lean_post_talk'], 12)],
    'face_at_gate_door_1251': [(['look'], 8), (['idle'], 6)],
    'pointing_man_1370': [(['point_way', 'point'], 8), (['look'], 4)],
    'visitor_food_box_1308': [(['look'], 8), (['idle'], 5)],
    'folded_object_bearer_1490': [(['idle'], 8), (['look'], 4)],
    'official_rider_1610': [(['ride'], 10)],
    'groom_1698': [(['bridle'], 9), (['look'], 4)],
    'attendant_pale_1750': [(['idle'], 8), (['look'], 4)],
    'doctor_dark_robe_1615': [(['examine_child', 'hand_over'], 12)],
    'standing_woman_1567': [(['look'], 8), (['idle'], 5)],
    'seated_woman_child_1535': [(['sit_hold_child'], 12)],
    'child_on_lap_1546': [(['idle'], 10)],
    'bucket_man_1872': [(['bucket_lift'], 12)],
}
ALIAS = {   # what plays meanwhile, nearest first (the brief: talk, look, idle for gestures; a seat for a seat)
    'sit_talk': ['sit'], 'sit_hold_child': ['sit'], 'sit': ['sit_talk'],
    'examine_child': ['idle'], 'hand_over': ['idle'], 'point_way': ['talk', 'look', 'idle'], 'point': ['talk', 'idle'],
    'lean_post_talk': ['lean_wall', 'idle'], 'bridle': ['idle'], 'look': ['idle'], 'ride': ['ride_side'],
    'bucket_lift': ['idle'],
}
# what each wanted clip is, and where a free one comes from (needs list, "Actions the existing clips can't show")
WANT = {
    'sit_talk': 'seated, head up, hands raised before the chest, talking up to someone standing beside him '
                '(free: from:official/sit_talk)',
    'sit_hold_child': 'NEW: seated on a low bench, holding a small child upright on her lap with both hands round its '
                      'waist, lifting it a little toward someone standing in front of her, her head turned to him. Bind '
                      'child_on_lap to it',
    'examine_child': 'NEW: standing, leaning a little forward, both hands out together at chest height to a small child '
                     'held in front of him, feeling its wrist, then drawing back and nodding',
    'hand_over': 'both hands at the chest, a small step forward (free: from:carter/hand_over), the stand-in for '
                 'examine_child',
    'point_way': 'NEW: standing half-turned to a listener, the right arm raised level pointing far along the street, '
                 'held while turning the head back and nodding, then lowered',
    'point': 'points ahead and shakes an open palm (free: from:sightseer/point), the stand-in for point_way',
    'lean_post_talk': 'NEW (optional): leaning back against a post, head turned down to a seated man at his side, one arm '
                      'reaching down toward him, talking (lean_wall stands in)',
    'bridle': 'standing at an animal\'s head holding the lead (free: from:carter/bridle)',
    'look': 'standing, looking about (free: from:townsman/look)',
    'walk_hold_chest': 'NEW (optional): walking with both hands holding a small bundle against the chest, elbows bent, '
                       'forearms still (walk stands in). Bind bundle_small to it',
    'carry_pole': 'walking with a pole on the right shoulder (free: from:porter/carry_pole)',
    'sit': 'the library chair sit (the robed man\'s was trimmed: back free from gen/)',
    'ride': 'riding astride (the official_rider is made with ride; the hat traveller rides meanwhile)',
}
FROM = {('robed_man', 'sit_talk'): 'from:official/sit_talk', ('robed_man', 'sit'): 'trimmed sit, back free from gen/',
        ('inspector', 'bridle'): 'from:carter/bridle', ('townsman', 'carry_pole'): 'from:porter/carry_pole',
        ('idler', 'carry_pole'): 'from:porter/carry_pole', ('fortune_teller', 'hand_over'): 'from:carter/hand_over',
        ('scholar', 'point'): 'from:sightseer/point', ('woman', 'look'): 'from:townsman/look'}
NEW_TAKE = {'sit_hold_child', 'examine_child', 'point_way', 'lean_post_talk', 'walk_hold_chest'}

# carried props as painted (needs list "Props carried by figures"): wanted per figure; each is on only when the
# playing GLB has prop_<name> and the figure plays the clip that holds it
PROP_WANT = {
    'porter_baskets_1255': ['pole_baskets'],
    'visitor_food_box_1308': ['back_bundle', 'food_box'],
    'folded_object_bearer_1490': ['folded_parasol'],
    'official_rider_1610': ['stick'],
    'attendant_pale_1750': ['staff'],
    'seated_woman_child_1535': ['child_on_lap'],
    'bucket_man_1872': ['pole_hooks'],
    'walker_bag_1885': ['hip_bag'],
    'bundle_man_1976': ['bundle_small'],
}
PROP_WANT_WHY = {
    'visitor_food_box_1308': 'back_bundle (big: the existing back_bundle at about 1.6x, hanging down his back and left '
                             'side, on the camel driver\'s look/idle) and food_box (new: the 食盒, a small lidded box '
                             'with a tall bail handle hanging from the right hand, clip-independent)',
    'folded_object_bearer_1490': 'folded_parasol (new: the long folded parasol or 掌扇, about 2.2 m, on the right shoulder '
                                 'in carry_pole, which the townsman gets free from:porter/carry_pole); shown when the '
                                 'retinue walks (procession, clips_why)',
    'official_rider_1610': 'stick (optional riding_stick: the existing stick held upright behind his west shoulder in '
                           'ride), on the official_rider when he is made (the hat traveller\'s GLB has no prop_stick)',
    'attendant_pale_1750': 'staff on the shoulder (new placement of the existing 1.98 m staff, over the right shoulder in '
                           'carry_pole, which the idler gets free from:porter/carry_pole); shown when the retinue walks',
    'seated_woman_child_1535': 'child_on_lap (new placement of the existing child_in_arms child: upright on her thighs, '
                               'facing forward, her hands at its waist, on sit_hold_child); meanwhile her child_in_arms '
                               'is on in her sit (props_why, the decision)',
    'bucket_man_1872': 'pole_hooks (new: the bare bamboo shoulder pole, about 1.7 m, a rope and hook at each end, slanting '
                       'from his right shoulder down to the buckets at his feet, in bucket_lift; the buckets are map '
                       'props on the ground)',
    'walker_bag_1885': 'hip_bag (new: a dark cloth bag on a cord at the west hip, about 0.2 x 0.45 m; S6 wants the same for '
                       'five figures)',
    'bundle_man_1976': 'bundle_small (new, or back_bundle at about 0.4 in a two-hand placement: a small tied bundle held '
                       'at the chest in walk_hold_chest)',
}
# clips that hold a prop: played only when the playing character's GLB has it (never a carry clip without its load)
NEEDS_PROP = {'carry_pole': ('pole_baskets', 'folded_parasol', 'staff'), 'walk_hold_chest': ('bundle_small',),
              'sit_hold_child': ('child_on_lap',)}
# The seated woman and the child on her lap: her sit (Meshy 32) with her child_in_arms prop (bound for hold_child)
# was rendered (blender/char_props.py review and S7_run2_cast/review_angles.py, 2026-10-12): for the sit's calm
# opening (t 0-4.3 s; and 10.2-11.3) the child sits upright on her lap at her left knee, its head at her chest, as
# painted; from 4.4 to 10 s she leans forward, chin in hand, and the child is pressed into her chest and shoulder. So
# she keeps it on and plays her sit in 1 s steps: people.js restarts a clip at a random point of its first 3 s at
# each step (play offset), so she holds the calm opening (t <= 4.2 s), where the poses differ by about 1 cm. One switch:
SIT_CHILD_CALM = True
PROP_ON_CLIP = {'seated_woman_child_1535': ('child_in_arms', 'sit')} if SIT_CHILD_CALM else {}

# children: the painted head against the gate's adults, turned into a scale of the child model
CHILD = {'face_at_gate_door_1251': (0.8, 'only the head is painted (12 x 17 px), about half the size of the gate\'s '
                                         'adults\' heads: a small child peeking round the open leaf, 0.8 of the child '
                                         'model (the brief; by its estimated foot, 122 px against the gate\'s adults\' '
                                         '165, it would be about 1.1)')}
# painted mid-stride or carrying a load, and not held to the ridden horse
WALKERS = ['porter_baskets_1255', 'walker_bag_1885', 'bundle_man_1976']
WALK = {   # walker: (wanted walk clips in order, speed)
    'porter_baskets_1255': (['carry_pole'], 0.85),
    'walker_bag_1885': (['walk'], 1.0),
    'bundle_man_1976': (['walk_hold_chest', 'walk'], 1.0),
}
HELD = {
    'retinue': 'official_rider_1610 rides the official\'s horse, which stands (idle) as in S4 and S6; groom_1698, '
               'attendant_pale_1750 and folded_object_bearer_1490 are painted walking with it and stay with it, playing '
               'their walk in place as the stand clip that reads best (idle, look): nobody walks away from the ridden '
               'horse. The group walk waits for a procession routine on the page (clips_why procession)',
    'bucket_man_1872': 'painted bent over the bucket at his feet (S7.prop.bucket_at_carrier_1890), not walking: he stays '
                       'and lifts (bucket_lift)',
}
# the retinue's walk, for when the page can walk the group with the horse: (clip, props)
PROCESSION = {
    'official_rider_1610': ('ride', [], 'rides the horse as it walks (horse walk)'),
    'groom_1698': ('bridle', [], 'walks at the horse\'s head with the lead (a bridle walk; inspector bridle is free '
                                 'from:carter/bridle)'),
    'attendant_pale_1750': ('carry_pole', ['staff'], 'walks ahead with the staff on his right shoulder (idler '
                                                       'carry_pole is free from:porter/carry_pole)'),
    'folded_object_bearer_1490': ('carry_pole', ['folded_parasol'], 'walks behind the horse with the folded parasol '
                                                                     'on his shoulder (townsman carry_pole is free '
                                                                     'from:porter/carry_pole)'),
}

# ---------------------------------------------------------------- animals
# species, tack and doing as painted (map/text/S7.md, needs list "Animals")
ANIMAL_SPEC = {
    'horse_official_1625': dict(model='horse_white', load='saddle', do=[['idle', 10]]),
    'bird_roof_1735': dict(model='bird', do=[['idle', 10]]),
}
# the pale shape behind the water carrier (conf low: an animal or a mat) is not cast until the lead decides; the area
# agent lists it under unbuilt in build_choices.json. One line turns it on, e.g.
#   PALE_SHAPE = {'model': 'pig', 'do': [['graze', 8], ['idle', 4]]}
PALE_SHAPE = None
if PALE_SHAPE:
    ANIMAL_SPEC['pale_shape_1905'] = dict(PALE_SHAPE)


# ---------------------------------------------------------------- geometry
AREA = L['painted_area']['corners']


def inside(p, poly):
    c, j = False, len(poly) - 1
    for i in range(len(poly)):
        (xi, yi), (xj, yj) = poly[i][:2], poly[j][:2]
        if (yi > p[1]) != (yj > p[1]) and p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = 0 if dx == dy == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def poly_dist(p, poly):
    """Distance from p to a polygon's boundary, negative inside (a 2-point polygon is a line)."""
    n = len(poly)
    if n == 2:
        return seg_dist(p, poly[0], poly[1])
    d = min(seg_dist(p, poly[i], poly[(i + 1) % n]) for i in range(n))
    return -d if inside(p, poly) else d


def rect(c, ang_deg, half_len, half_w):
    a = math.radians(ang_deg)
    f, n = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
    return [(c[0] + sf * half_len * f[0] + sn * half_w * n[0], c[1] + sf * half_len * f[1] + sn * half_w * n[1])
            for sf, sn in ((-1, -1), (1, -1), (1, 1), (-1, 1))]


def polys_overlap(A, B):
    for P in (A, B):
        for i in range(len(P)):
            ex, ey = P[(i + 1) % len(P)][0] - P[i][0], P[(i + 1) % len(P)][1] - P[i][1]
            pa = [-ey * q[0] + ex * q[1] for q in A]
            pb = [-ey * q[0] + ex * q[1] for q in B]
            if max(pa) < min(pb) or max(pb) < min(pa):
                return False
    return True


def fwd_left(facing):
    a = math.radians(facing)
    return (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))


def disc(c, r, n=10):
    return [(c[0] + r * math.cos(2 * math.pi * i / n), c[1] + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


# ---------------------------------------------------------------- what is built (solids.json, else the layout)
# solids.json (blender/city_end_scene.py build): owners -> the 0.1 m plan cells where each owner's colliders stand at
# body height (0.15-1.6 m); seats (non-colliding) as a segment from -> to, w wide, top high; the gate passage (x, y
# ranges, door_leaf [hinge, swing deg]); walk (the walkable area's corners). Built things that don't collide (the
# buckets, the reed panel, the lattice stand, the shop's furniture) are not in it: they are tested as soft discs at
# their mapped spots with the builder's sizes (a body should not stand in them, though nothing stops it).
SOFT_R = {   # the builder's sizes (radius or half-size, m) for the built, non-colliding props
    'S7.prop.bucket_small_1930': 0.22, 'S7.prop.bucket_lidded_1988': 0.21, 'S7.prop.bucket_bail_1950': 0.2,
    'S7.prop.bucket_at_carrier_1890': 0.2, 'S7.prop.leaning_panel_1812': 0.2, 'S7.prop.lattice_stand_1452': 0.3,
    'S7.prop.bench_shop_east_1752': 0.25, 'S7.prop.armchair_1657': 0.32, 'S7.prop.footrest_1662': 0.2,
    'S7.prop.stones_fence_foot_945': 0.3, 'S7.prop.bench_jie_eave_1885': 0.3,
}
R_PROP = {   # layout-only fallback radii for the colliding point props, until solids.json gives their cells
    'tub_': 0.36, 'leaning_poles': 0.08, 'board_': 0.15, 'counter_back': 0.4, 'tied_sack': 0.22,
}


def seat_rect(s):
    (x0, d0), (x1, d1) = s['from'], s['to']
    ang = math.degrees(math.atan2(d1 - d0, x1 - x0))
    return rect(((x0 + x1) / 2, (d0 + d1) / 2), ang, math.hypot(x1 - x0, d1 - d0) / 2, s['w'] / 2)


class Obstacles:
    """What a body must not stand in: collider cells (solids.json) or polygons (the layout), soft things, the edge."""

    def __init__(self):
        self.cells, self.cell, self.polys = {}, 0.1, []   # polys: (name, poly, collides)

    def near(self, p, r=1.5, soft=True, skip=()):
        """(distance, name) to the nearest obstacle within r: 0 inside a collider cell, negative inside a polygon."""
        best = (r, None)
        c = self.cell
        if self.cells:
            for i in range(math.floor((p[0] - r) / c), math.floor((p[0] + r) / c) + 1):
                for j in range(math.floor((p[1] - r) / c), math.floor((p[1] + r) / c) + 1):
                    o = self.cells.get((i, j))
                    if o is None or o in skip:
                        continue
                    dx = max(i * c - p[0], 0, p[0] - (i + 1) * c)
                    dy = max(j * c - p[1], 0, p[1] - (j + 1) * c)
                    d = math.hypot(dx, dy)
                    if d < best[0]:
                        best = (d, o)
        for name, poly, collides in self.polys:
            if (not collides and not soft) or name in skip:
                continue
            d = poly_dist(p, poly)
            if d < best[0]:
                best = (d, name if collides else f'{name} (built, not a collider)')
        return best

    def under(self, p):
        """The colliders whose plan contains p."""
        out = set()
        if self.cells:
            o = self.cells.get((math.floor(p[0] / self.cell), math.floor(p[1] / self.cell)))
            if o:
                out.add(o)
        out |= {n for n, poly, col in self.polys if col and len(poly) > 2 and inside(p, poly)}
        return out


OB = Obstacles()
SEATS = {}      # name -> (poly, top)
PASSAGE = None  # the solids.json passage entry
if SOLIDS:
    SOURCE = 'gen/sections/city_end/solids.json'
    OB.cell = SOLIDS.get('cell', 0.1)
    for owner, cs in SOLIDS['owners'].items():
        for i, j in cs:
            OB.cells[(i, j)] = owner
    for k, s in SOLIDS.get('seats', {}).items():
        SEATS[f'S7.prop.{k}' if not k.startswith('S7.') else k] = (seat_rect(s), s.get('top'))
    PASSAGE = SOLIDS.get('passage') or None
    AREA = [tuple(q) for q in SOLIDS.get('walk') or AREA]
    for k, r in SOFT_R.items():
        if k in E:
            OB.polys.append((k, disc(E[k]['pos'], r), False))
else:
    SOURCE = 'layout.json footprints and props (solids.json not written yet)'
    for k, e in E.items():
        if e['kind'] in ('building', 'structure') and e.get('footprint'):
            OB.polys.append((k, [tuple(q) for q in e['footprint']], True))
        elif e['kind'] == 'structure' and e.get('lines'):
            for ln in e['lines'].values():
                OB.polys.append((k, [tuple(q) for q in ln], True))
        elif e['kind'] == 'prop' and k.split('.')[-1].startswith(('bench_shop_west', 'seat_box')):
            SEATS[k] = (disc(e['pos'], 0.25), None)
        elif e['kind'] == 'prop':
            s = k.split('.')[-1]
            r = next((rr for key, rr in R_PROP.items() if s.startswith(key) or key in s), None)
            OB.polys.append((k, disc(e['pos'], r or SOFT_R.get(k, 0.25)), r is not None))
    for t in L['trees']:   # the builders give each tree a trunk collider, r 0.3 x scale
        OB.polys.append((t['map_id'], disc((t['X'], t['D']), 0.3 * t.get('scale', 1), 8), True))
# the neighbour's square well (S6's builder) at the well's west end, where S7's buckets stand
OB.polys.append(('S6.str.square_well_2000', [tuple(q) for q in S6['entities']['S6.str.square_well_2000']['footprint']],
                 True))
for k, (poly, top) in SEATS.items():
    OB.polys.append((k, poly, False))

# the clips' hips against the feet (the root, the figure's spot): measured in Blender on the web GLBs, mean over the
# clip (S7_run2_cast/measure_sit.py, 2026-10-12): (forward, left) metres in the figure's own frame
HIPS = {('woman', 'sit'): (-0.58, 0.18), ('elder', 'sit'): (-0.32, 0.17), ('official', 'sit_talk'): (-0.27, -0.14),
        ('robed_man', 'sit_talk'): (-0.27, -0.14), ('robed_man', 'sit'): (-0.32, 0.17),   # retargets: remeasure
        ('scholar', 'sit'): (-0.32, 0.17), ('idler', 'sit'): (-0.32, 0.17), ('inspector', 'sit'): (-0.32, 0.17)}
SEAT_H = {('woman', 'sit'): 0.56, ('elder', 'sit'): 0.51, ('official', 'sit_talk'): 0.62}   # hips joint height - 0.1


# ---------------------------------------------------------------- animals' real bodies
def animal_body(slug, spec):
    e = ANIMALS[slug]
    model = {'horse_white': 'horse'}.get(spec['model'], spec['model'])
    info = ANI.get(model, {'length_m': 0.3, 'width_m': 0.12})
    k = spec.get('scale', 1)
    fo, hi = e['pts']['fore'], e['pts']['hind']
    ang = spec.get('facing_deg', math.degrees(math.atan2(fo[1] - hi[1], fo[0] - hi[0])))
    nx, nd = spec.get('nudge', [0, 0])
    c = (e['pos'][0] + nx, e['pos'][1] + nd)
    return dict(c=c, ang=ang, hl=info['length_m'] * k / 2, hw=info['width_m'] * k / 2, H=e.get('H', 0),
                poly=rect(c, ang, info['length_m'] * k / 2, info['width_m'] * k / 2))


BODY = {s: animal_body(s, sp) for s, sp in ANIMAL_SPEC.items()}
GROUND_BODIES = {s: b for s, b in BODY.items() if b['H'] < 1}


# ---------------------------------------------------------------- choosing who plays, and what
def playing(slug):
    """(the character written to people.json, the model that plays now, stand_in or None, why it is not the wanted
    one). A new character not made yet is written with its stand_in (world.js plays the stand_in); a character that
    can't hold the figure's pose (POSE) is replaced by the pose's fallback until it can."""
    want = CAST[slug]
    need, fallback, why = POSE.get(slug, (None, None, None))
    can = lambda c: need is None or any(x in clips(c) for x in need)
    if want in REG:
        return (want, want, None, None) if can(want) else (fallback, fallback, None, why)
    si = FIG_STAND_IN.get(slug) or STAND_IN[want]
    return (want, si, si, None) if can(si) else (want, fallback, fallback, why)


wanted = {}       # clip -> {wanted character: [(figure, what plays now)]}
props_note = {}


def chain_of(cands):
    out = list(cands)
    for x in ALIAS.get(cands[-1], []) + ['idle']:
        if x not in out:
            out.append(x)
    return out


def prop_ok(model, clip):
    need = NEEDS_PROP.get(clip)
    return not need or any(f'prop_{p}' in glb_parts(model) and PROPS.get(model, {}).get(p, {}).get('clip') == clip
                           for p in need)


def steps_for(slug, want, model):
    out = []
    for cands, secs in DO[slug]:
        ch = chain_of(cands)
        clip = next((x for x in ch if x in clips(model) and prop_ok(model, x)), 'idle')
        for x in cands:
            if x == clip and model == want:
                break
            if x not in clips(want) or model != want:
                wanted.setdefault(x, {}).setdefault(want, []).append((slug, clip))
            if x == clip:
                break
        if out and out[-1][0] == clip:          # two steps that play the same clip are one
            out[-1][1] += secs
        else:
            out.append([clip, secs])
    if slug in POSE and model != want:          # recast for its pose: any of the pose's clips brings it back
        for x in POSE[slug][0]:
            if x not in clips(want) and slug not in [r[0] for r in wanted.get(x, {}).get(want, [])]:
                wanted.setdefault(x, {}).setdefault(want, []).append((slug, out[0][0]))
    return out


def props_for(slug, model, played):
    """The figure's painted props that the playing character's GLB has and one of its clips holds."""
    on = []
    notes = []
    for p in PROP_WANT.get(slug, []):
        spec = PROPS.get(model, {}).get(p)
        if f'prop_{p}' not in glb_parts(model) or not spec:
            notes.append(f'{p}: off ({model} has no prop_{p} yet)')
        elif spec.get('clip') not in played:
            notes.append(f'{p}: off ({model} holds it in {spec.get("clip")}, which this figure does not play)')
        else:
            notes.append(f'{p}: on ({model}, held in {spec["clip"]})')
            on.append(p)
    if slug in PROP_ON_CLIP and not on:
        p, clip = PROP_ON_CLIP[slug]
        if f'prop_{p}' in glb_parts(model) and clip in played:
            on.append(p)
            notes.append(f'{p}: on ({model}\'s child_in_arms, bound for hold_child, held in her sit: the decision below)')
    if notes:
        props_note[slug] = '; '.join(notes)
    return on


# ---------------------------------------------------------------- nudges (each with its reason)
NUDGE = {}


def nudge(slug, v, why):
    NUDGE[slug] = ([round(v[0], 2) + 0.0, round(v[1], 2) + 0.0], why)


def they(slug):
    return 'she' if WHO[slug][1] == 'woman' else 'he'


def spot(slug):
    f = FIG[slug]
    n = NUDGE.get(slug, ([0, 0],))[0]
    return (f['X'] + n[0], f['D'] + n[1])


def hips_of(slug, model, clip, at=None):
    f = FIG[slug]
    o = HIPS.get((model, clip), (-0.33, 0.17))
    fw, lf = fwd_left(f['facing_deg'])
    x, d = at or spot(slug)
    return (x + o[0] * fw[0] + o[1] * lf[0], d + o[0] * fw[1] + o[1] * lf[1])


def seat_for(slug):
    """The seat the figure is painted on: the solids.json seat nearest its mapped spot (within 1.2 m)."""
    f = FIG[slug]
    best = None
    for name, (poly, top) in SEATS.items():
        d = poly_dist((f['X'], f['D']), poly)
        if d < 1.2 and (best is None or d < best[0]):
            best = (d, name, poly, top)
    return best


def onto_seat(slug, model, clip, why_lead):
    """Nudge a seated figure so its clip's hips sit on its seat (0.12 m in from the seat's edge), the least move."""
    s = seat_for(slug)
    if not s:
        return None
    _, name, poly, top = s
    h = hips_of(slug, model, clip, (FIG[slug]['X'], FIG[slug]['D']))
    xs, ds = [q[0] for q in poly], [q[1] for q in poly]
    if inside(h, poly) and poly_dist(h, poly) <= -0.12:
        return dict(seat=name, top=top, hips=h, moved=0.0)
    best = None
    x = min(xs)
    while x <= max(xs):
        d = min(ds)
        while d <= max(ds):
            if inside((x, d), poly) and poly_dist((x, d), poly) <= -0.12:
                m = math.hypot(x - h[0], d - h[1])
                if best is None or m < best[0]:
                    best = (m, (x, d))
            d += 0.02
        x += 0.02
    if best is None:   # a seat narrower than 0.24 m: its centre
        best = (0, (sum(xs) / len(xs), sum(ds) / len(ds)))
        best = (math.hypot(best[1][0] - h[0], best[1][1] - h[1]), best[1])
    v = (best[1][0] - h[0], best[1][1] - h[1])
    nudge(slug, v, f'{why_lead}: {model}\'s {clip} puts the hips {abs(HIPS.get((model, clip), (-0.33, 0))[0]):.2f} m '
                   f'behind the feet and {abs(HIPS.get((model, clip), (0, 0.17))[1]):.2f} m to the '
                   f'{"left" if HIPS.get((model, clip), (0, 0.17))[1] >= 0 else "right"} (measured on the GLB), so at '
                   f'the mapped foot they sat {poly_dist(h, poly):+.2f} m from the edge of {name}; {they(slug)} moves '
                   f'{math.hypot(*v):.2f} m so the hips sit on it, 0.12 m in from its edge')
    return dict(seat=name, top=top, hips=best[1], moved=best[0])


def clear_of(slug, body, gap, why_lead):
    """Nudge a figure out of an animal's real body (expanded by gap) by the least move, along or across it."""
    f = FIG[slug]
    fw, lf = fwd_left(body['ang'])
    rx, rd = f['X'] - body['c'][0], f['D'] - body['c'][1]
    a, s = rx * fw[0] + rd * fw[1], rx * lf[0] + rd * lf[1]
    ea, es = body['hl'] + gap, body['hw'] + gap
    if abs(a) >= ea or abs(s) >= es:
        return
    da, ds = ea - abs(a), es - abs(s)
    if da < ds:
        m = math.copysign(da, a if a else -1)
        v = (fw[0] * m, fw[1] * m)
        where = 'behind its rump' if a < 0 else 'ahead of its head'
    else:
        m = math.copysign(ds, s if s else 1)
        v = (lf[0] * m, lf[1] * m)
        where = 'beside its flank'
    nudge(slug, v, f'{why_lead}: at real size ({ANIMAL_SPEC_MODEL(body)}, {2 * body["hl"]:.2f} m long, '
                   f'{2 * body["hw"]:.2f} m wide, centred on its painted spot) his spot was inside its body; he steps '
                   f'{math.hypot(*v):.2f} m to stand {gap:.2f} m {where}, as painted')


def ANIMAL_SPEC_MODEL(body):
    return next(ANIMAL_SPEC[s]['model'] for s, b in BODY.items() if b is body)


# who plays what (needed by the seat nudges)
WHO = {s: playing(s) for s in FIG}
for s in FIG:
    assert s in CAST, f'figure {s} has no cast'
    if s not in WALKERS:
        assert s in DO, f'figure {s} has no action'

HORSE = BODY['horse_official_1625']
clear_of('folded_object_bearer_1490', HORSE, 0.3,
         'painted walking just behind the official\'s horse with the folded parasol (the map: rump behind him)')
clear_of('groom_1698', HORSE, 0.3, 'painted at the horse\'s head')
clear_of('attendant_pale_1750', HORSE, 0.3, 'painted ahead of the horse')


def step_out(slug, vec, need, why_lead, soft=True):
    """Nudge a figure along vec (a unit [dX, dD]) until it stands need metres clear of every built thing (soft: the
    non-colliding props too), the least step on a 2 cm grid; the reason names what it stood in."""
    f = FIG[slug]
    d0, name = OB.near((f['X'], f['D']), 1.0, soft=soft)
    if d0 >= need:
        return
    for i in range(1, 60):
        p = (f['X'] + vec[0] * 0.02 * i, f['D'] + vec[1] * 0.02 * i)
        if OB.near(p, 1.0, soft=soft)[0] >= need:
            break
    v = (p[0] - f['X'], p[1] - f['D'])
    nudge(slug, v, f'{why_lead}. As built, his spot was {"inside" if d0 <= 0 else f"{d0:.2f} m from"} {name}: he steps '
                   f'{math.hypot(*v):.2f} m to stand {need:.2f} m clear of it')


step_out('pointing_man_1370', (0, 1), 0.2,
         'painted standing just behind (north of) the tied sack set down at the gate, his legs hidden by it (the map: '
         'foot est behind the sack\'s foot)')
_fw = fwd_left(FIG['bucket_man_1872']['facing_deg'])[0]
step_out('bucket_man_1872', (-_fw[0], -_fw[1]), 0.2,
         'painted bent over the bucket at his feet, a hand on its handle; his bucket_lift (measured on the GLB) bends '
         'his head over a point about 0.3 m ahead of his spot, with his feet astride it, so he steps straight back along '
         'his facing and the bucket (0.2 m round, 0.68 m tall) stands before his feet, under his reach')
SEATED = {}
for s, lead in (('gatekeeper_seated_1082', 'painted seated on his low box seat S7.prop.seat_box_gatekeeper_1070'),
                ('seated_woman_child_1535', 'painted seated on the bench S7.prop.bench_shop_west_1507 holding the child')):
    m = WHO[s][1]
    clip0 = next(x for x in chain_of(DO[s][0][0]) if x in clips(m))
    SEATED[s] = (m, clip0, onto_seat(s, m, clip0, lead))

# where the child on her lap is drawn (her child_in_arms prop's centre in her sit, measured on the GLB: 0.48 m behind
# her feet, 0.27 m to her left)
_fw, _lf = fwd_left(FIG['seated_woman_child_1535']['facing_deg'])
_q = spot('seated_woman_child_1535')
CHILD_AT = (_q[0] - 0.48 * _fw[0] + 0.27 * _lf[0], _q[1] - 0.48 * _fw[1] + 0.27 * _lf[1])

# the woman standing behind the seated one: her feet are estimated (hidden behind the seated woman and the child) at
# the seated woman's depth, which at real size puts her on the line from the doctor to the child he reaches for; she
# stands back (north) until 0.35 m clear of it, behind the seated woman as painted
f = FIG['standing_woman_1567']
_doc = spot('doctor_dark_robe_1615')
if seg_dist((f['X'], f['D']), _doc, CHILD_AT) < 0.35:
    for i in range(1, 40):
        p = (f['X'], f['D'] + 0.02 * i)
        if seg_dist(p, _doc, CHILD_AT) >= 0.35 and OB.near(p, 0.6)[0] >= 0.2:
            break
    nudge('standing_woman_1567', (0, p[1] - f['D']),
          f'painted standing just behind the seated woman, looking at the doctor; her feet are estimated (hidden behind '
          f'the seated woman and the child) at the seated woman\'s depth, which at real size puts her '
          f'{seg_dist((f["X"], f["D"]), _doc, CHILD_AT):.2f} m from the line between the doctor and the child on the '
          f'seated woman\'s lap that he reaches for; she stands {p[1] - f["D"]:.2f} m further back (north), behind the '
          f'seated woman as painted, 0.35 m clear of it')

# where a seated clip puts the feet (the toe bases, measured on the GLB like HIPS): (forward, left) per foot
TOES = {('woman', 'sit'): [(-0.35, 0.32), (-0.32, 0.28)], ('elder', 'sit'): [(0.11, 0.33), (0.2, -0.02)]}


def toes_of(s):
    m, clip, _ = SEATED[s]
    fw, lf = fwd_left(FIG[s]['facing_deg'])
    q = spot(s)
    return [(q[0] + a * fw[0] + l * lf[0], q[1] + a * fw[1] + l * lf[1]) for a, l in TOES.get((m, clip), [])]


# the man at the gate's west post: the seated gatekeeper's left foot (the elder's sit spreads it 0.33 m to his left,
# north) reaches his spot; he stands back toward the post he leans on until 0.24 m clear of it (and 0.18 m clear of
# the post's block)
f = FIG['man_at_post_1118']
_toes = toes_of('gatekeeper_seated_1082')
foot = _toes[0] if _toes else None
if foot and math.dist(foot, (f['X'], f['D'])) < 0.24:
    for i in range(1, 30):
        p = (f['X'], f['D'] + 0.02 * i)
        if math.dist(foot, p) >= 0.24 and OB.near(p, 0.6)[0] >= 0.18:
            break
    nudge('man_at_post_1118', (0, p[1] - f['D']),
          f'painted leaning back on the gate\'s west post just behind the seated gatekeeper: at real size the '
          f'gatekeeper\'s left foot ({SEATED["gatekeeper_seated_1082"][0]}\'s {SEATED["gatekeeper_seated_1082"][1]} '
          f'spreads it {TOES[SEATED["gatekeeper_seated_1082"][:2]][0][1]:.2f} m to his left) came '
          f'{math.dist(foot, (f["X"], f["D"])):.2f} m from his spot; he stands {p[1] - f["D"]:.2f} m further back toward '
          f'the post and its block (S7.str.gate_block_1160), {OB.near(p, 0.6)[0]:.2f} m clear of it')

# the head at the gate's open door leaf: into the passage, just behind the open west leaf
f = FIG['face_at_gate_door_1251']
if PASSAGE:
    (px0, px1), (py0, py1) = PASSAGE['x'], PASSAGE['y']
    (hx, hd), swing = PASSAGE['door_leaf']
    lw = (px1 - px0 - 0.16) / 2     # the kit's leaf: half the door frame's clear width (city_end_scene.py plain_leaf)
    tip = (hx + lw * math.cos(math.radians(swing)), hd + lw * math.sin(math.radians(swing)))
    gd = min(max(f['D'], min(hd, tip[1]) + 0.15), max(hd, tip[1]) - 0.15)   # beside the open leaf, along it
    gx = px0
    while gx < px1 and OB.near((gx, gd), 0.6, soft=False)[0] < 0.2:
        gx += 0.02
    nudge('face_at_gate_door_1251', (gx - f['X'], gd - f['D']),
          f'only its head is painted, at the edge of the open door leaf; its estimated foot (on the hall\'s floor line '
          f'where the leaf ends, X {f["X"]:.2f}) lands {px0 - f["X"]:.2f} m inside the gate hall\'s west pier (the '
          f'frame\'s weak west knot). It stands in the passage (X {px0:.2f} to {px1:.2f}, solids.json) against the east '
          f'face of the leaf, which stands open {swing} deg against the passage\'s west side from its hinge at '
          f'({hx:.2f}, {hd:.2f}) to about ({tip[0]:.2f}, {tip[1]:.2f}): 0.2 m clear of it, at its mapped depth')
else:
    x0 = -101.62   # the passage's west jamb (u 1204 at the front, v 897, dx 59.9): until solids.json gives the range
    nudge('face_at_gate_door_1251', (x0 + 0.35 - f['X'], 0),
          f'only its head is painted, at the edge of the open door leaf; its estimated foot (X {f["X"]:.2f}) lands '
          f'{x0 - f["X"]:.2f} m inside the gate hall\'s west pier; it stands in the passage, 0.35 m east of its west jamb '
          f'(X {x0:.2f}, from the jamb\'s foot u 1204 on the scan, until solids.json gives the passage), just behind the '
          f'open leaf hinged there')

# ---------------------------------------------------------------- bodies for checks and walks
def body_point(s):
    """Where a standing figure's body is: its spot, or, seated, its clip's hips."""
    if s in SEATED:
        m, clip, _ = SEATED[s]
        return hips_of(s, m, clip)
    return spot(s)


def standing():
    return {s: spot(s) for s in FIG if s not in WALKERS and s != 'official_rider_1610' and s != 'child_on_lap_1546'}


def clearance(p, people=True, skip=()):
    """Room from p to the nearest collider, animal body, standing figure or the painted area's edge."""
    d, who = -poly_dist(p, AREA), 'the painted area\'s edge'
    dd, name = OB.near(p, 1.0)
    if name and dd < d:
        d, who = dd, name
    for s, b in GROUND_BODIES.items():
        dd = poly_dist(p, b['poly'])
        if dd < d:
            d, who = dd, f'animal {s}'
    if people:
        for s, q in standing().items():
            if s in skip:
                continue
            dd = math.hypot(p[0] - q[0], p[1] - q[1]) - 0.26
            if dd < d:
                d, who = dd, f'figure {s}'
    return d, who


BODY_R = 0.3
WALK_LEN = 7.0


def walk_path(slug):
    f = FIG[slug]
    a = math.radians(f['facing_deg'])
    d = (math.cos(a), math.sin(a))
    o = spot(slug)

    def run(sign, limit):
        best, stop = 0.0, ''
        for i in range(1, 400):
            s = i * 0.05
            if s > limit + 1e-9:
                break
            c, who = clearance((o[0] + sign * d[0] * s, o[1] + sign * d[1] * s), skip=(slug,))
            if c < BODY_R:
                stop = who
                break
            best = s
        return best, stop

    fwd, stop = run(1, WALK_LEN)
    back, bstop = run(-1, WALK_LEN - fwd)
    path = [[round(o[0] - d[0] * back, 2), round(o[1] - d[1] * back, 2)],
            [round(o[0] + d[0] * fwd, 2), round(o[1] + d[1] * fwd, 2)]]
    why = (f'{fwd:.1f} m along its painted facing ({f["facing_deg"]} deg)' + (f' to {stop}' if stop else '')
           + (f', and {back:.1f} m back behind its spot' + (f' to {bstop}' if bstop else '') if back > 0.05 else ''))
    return path, fwd + back, why


# ---------------------------------------------------------------- people.json
people = {
    'about': 'Who the scroll\'s end\'s people and animals are and what they do: every painted figure and animal of S7 '
             '(map/text/S7.md, u 815-2000) at its mapped spot (layout.json), and nobody else (map/BUILDING.md). Written '
             'by gen/sections/city_end/make_people.py (the casting of gen/expand/city_end_needs.md with the lead\'s calls '
             'of 2026-10-12: everyone from the 22 existing characters, the new official_rider playing his stand_in); '
             'rerun it when the workshop delivers characters, clips and props, or when the builder rewrites '
             'gen/sections/city_end/solids.json. figures: character (a new one plays its stand_in until it exists), '
             'do = [clip, seconds] cycles with clips the playing character has (clips_why: what is still to make), '
             'nudge = [dX, dD] (nudge_why), scale for children (scale_why), ride = the animal a rider sits on, '
             'carried_by = the figure whose prop draws a carried child, props = carried prop_<name> parts (props_why). '
             'walkers: figures painted mid-stride or carrying, walking along their painted direction from their spot '
             'and back (walkers_why). animals: each painted animal at its map position facing hind to fore, model and '
             'load from web/public/assets/animals/animals.json. No traffic.',
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'walkers_why': {}, 'animals': {}, 'animals_why': {},
    'clips_why': {}, 'scale_why': {}, 'facing_why': {}, 'cast_why': {}, 'props_why': {},
}
assert not [s for s in FIG if s not in CAST], 'figures without a cast'
assert not [s for s in CAST if s not in FIG], 'cast for figures not in the layout'
assert set(WALKERS) <= set(FIG) and not set(WALKERS) & set(DO), 'walkers are figures with no standing cycle'

scale_of = {}
for s, (k, why) in CHILD.items():
    scale_of[s] = k
    people['scale_why'][s] = f'{why}: {k} x the child model\'s {height("child"):.2f} m = {k * height("child"):.2f} m tall'
people['scale_why']['about'] = ('people.js scale multiplies the playing character\'s own height (the child model is '
                                f'{height("child"):.2f} m)')

cast_table = {}
for slug in sorted(FIG, key=lambda s: FIG[s]['X']):
    character, model, si, pose_why = WHO[slug]
    if slug in WALKERS:
        path, length, why = walk_path(slug)
        cands, speed = WALK[slug]
        clip = next((x for x in cands if x in clips(model) and prop_ok(model, x)), 'walk')
        for x in cands:
            if x == clip:
                break
            wanted.setdefault(x, {}).setdefault(CAST[slug], []).append((slug, clip))
        w = {'id': slug, 'figure': slug, 'character': character}
        if si:
            w['stand_in'] = si
        pr = props_for(slug, model, [clip])
        if pr:
            w['props'] = pr
        if clip == 'carry_pole' and not pr:
            clip = 'walk'
        w.update({'clip': clip, 'speed': speed if clip == cands[0] else 1.0, 'pause': ['idle', 3], 'path': path})
        if slug in scale_of:
            w['scale'] = scale_of[slug]
        if length < 1.0:   # a painted walker with no room stands
            spec = {'character': character, 'do': [['idle', 10]]}
            if si:
                spec['stand_in'] = si
            people['figures'][slug] = spec
            people['walkers_why'][slug] = f'no room to walk ({why}): he stands'
        else:
            people['walkers'].append(w)
            people['walkers_why'][slug] = why
        cast_table[slug] = {'wanted': {'character': CAST[slug], 'clip': cands[0], 'props': PROP_WANT.get(slug, [])},
                            'now': {'character': character, **({'stand_in': si} if si else {}), 'clip': clip,
                                    'props': pr}}
        continue
    spec = {'character': character}
    if slug == 'child_on_lap_1546':
        spec['carried_by'] = 'seated_woman_child_1535'
        people['nudge_why'][slug] = ('held upright on the seated woman\'s lap, as painted: drawn by her child_in_arms prop '
                                     'while she sits (people.json carried_by), so it has no body of its own')
    if si:
        spec['stand_in'] = si
    spec['do'] = steps_for(slug, CAST[slug], model)
    if slug == 'seated_woman_child_1535' and SIT_CHILD_CALM and spec['do'] == [['sit', 12]]:
        spec['do'] = [['sit', 1]]
    pr = props_for(slug, model, [x[0] for x in spec['do']])
    if pr:
        spec['props'] = pr
    if slug in scale_of:
        spec['scale'] = scale_of[slug]
    if slug in NUDGE:
        spec['nudge'] = NUDGE[slug][0]
        people['nudge_why'][slug] = NUDGE[slug][1]
    if slug == 'official_rider_1610':
        spec['ride'] = 'horse_official_1625'
    people['figures'][slug] = spec
    cast_table[slug] = {'wanted': {'character': CAST[slug], 'clips': [c_[0][0] for c_ in DO[slug]],
                                   'props': PROP_WANT.get(slug, [])},
                        'now': {'character': character, **({'stand_in': si} if si else {}), 'do': spec['do'],
                                'props': pr}}
    if pose_why:
        people['cast_why'][slug] = pose_why
        cast_table[slug]['why'] = pose_why

people['walkers_why']['held'] = HELD
people['cast_why'].update({f'stand_in {c}': w for c, w in STAND_IN_WHY.items()})
people['cast_why'].update(CAST_WHY)
people['cast_why']['about'] = ('cast by dress from the 22 existing characters (needs list, "Casting"); a figure whose '
                               'wanted character lacks the clip its pose needs (a seat) plays the nearest character '
                               'that has it, until it lands; gestures a character lacks play the nearest clip it has '
                               '(clips_why)')
people['props_why'] = dict(props_note)
people['props_why']['wanted'] = {s: PROP_WANT_WHY.get(s, ', '.join(PROP_WANT[s]))
                                 for s in PROP_WANT if 'off' in props_note.get(s, 'off') or s == 'seated_woman_child_1535'}
people['props_why']['child_on_lap decision'] = (
    'the seated woman (seated_woman_child_1535) keeps her child_in_arms prop on in her sit (Meshy 32) until sit_hold_child '
    'and child_on_lap land: rendered on the GLB (char_props.py review, 2026-10-12), the child sits upright on her lap at '
    'her left knee in the sit\'s calm opening (t 0-4.3 s), as painted, while from 4.4 to 10 s she leans forward chin in '
    'hand and presses it into her chest. So her cycle is [sit, 1]: people.js restarts the clip at a random point of its '
    'first 3 s at each step, which holds her in that opening (switch SIT_CHILD_CALM in the script); the plain sit '
    'without the prop would leave the child invisible')
people['props_why']['about'] = ('carried props as painted (needs list "Props carried by figures"), switched on only when '
                                'the playing character\'s GLB has prop_<name> and the figure plays the clip that holds '
                                'it (characters/props.json); wanted: what the workshop is asked for')

for s, sp in ANIMAL_SPEC.items():
    people['animals'][s] = dict(sp)
people['animals_why'] = {
    'models': 'species as painted (map/text/S7.md, needs list "Animals"): the official\'s horse, painted pale and '
              'uncoloured (horse_white), and the black bird on the roof slope (bird, the kit-built crow)',
    'horse_official_1625': 'faces east as mapped (hind to fore), standing under its rider (idle) with the groom at its '
                           'head; its load is the existing saddle (tack_saddle, which the rider sits on). Wanted '
                           '(workshop, kit tack, 0 credits): saddle_fringe, the saddle plus a crupper strap over the rump '
                           'to the tail, a long fringed saddle-cloth hanging almost to the hooves, and a bridle with '
                           'reins to the rider\'s hands; when it lands, set load to saddle_fringe',
    'bird_roof_1735': 'perched on the east slope of S7.bld.hall_ns_1620 at its mapped H 3.2 (layout support roof; '
                      'animals.json perch: the page sits a perched animal at its H, and the area builder makes the roof '
                      'meet it' + (f': the roof\'s top under it is at {SOLIDS["bird"]["roof_top_at_bird"]} m, solids.json'
                                   if SOLIDS and SOLIDS.get('bird') else '') + '), facing 150 deg (hind to fore), head up '
                      'to the north-west',
    'pale_shape_1905': ('not cast: conf low, an animal or a mat; the area agent lists it under unbuilt in '
                        'build_choices.json until the lead decides (switch PALE_SHAPE in the script)'
                        if not PALE_SHAPE else 'cast by the lead\'s switch PALE_SHAPE'),
}

# clips_why: what is still to make (or retarget), per clip and wanted character
plans = {c: set(plan(c).get('clips', {})) for c in set(CAST.values())}
cw = {}
for clip, by in sorted(wanted.items()):
    for c, rows in sorted(by.items()):
        slugs = [r[0] for r in rows]
        now = sorted({f'{WHO[s][1] if WHO[s][1] != c else c} plays {r}' for s, r in rows})
        if c not in REG:
            state = f'new character {c}: being made with it' if plan(c) else f'new character {c}: to make with it'
        elif clip in clips(c) and NEEDS_PROP.get(clip):
            state = f'has it; needs prop {" or ".join(NEEDS_PROP[clip])} held in it'
        elif clip in clips(c):
            state = 'has it'
        elif clip in plans.get(c, set()):
            state = f'being made (characters/{c}.json)'
        elif (c, clip) in FROM:
            state = f'to make, free: {FROM[(c, clip)]}'
        else:
            state = 'to make (NEW take)' if clip in NEW_TAKE else 'to make'
        cw.setdefault(clip, []).append(f'{c} [{state}]: {", ".join(slugs)} ({"; ".join(now)} now)')
people['clips_why'] = {
    'about': 'Actions the painting needs that the wanted character lacks. "to make, free": a local retarget (from:) or a '
             'trimmed clip back from gen/; "NEW take": a Text to Motion take (10 credits once); "being made": in the '
             'character\'s characters/<name>.json. Rerun make_people.py when they land; until then each figure plays the '
             'nearest clip its character (or stand-in, or pose fallback) has.',
    **{clip: f'{WANT.get(clip, "")} -- ' + '; '.join(v) for clip, v in cw.items()},
    'notes': {
        'examine_child': 'when it lands, the doctor must stand within reach of the child: at real size the woman\'s sit '
                         'sets her lap about 0.5 m behind her feet, so the child (her prop) is about '
                         f'{math.dist(spot("doctor_dark_robe_1615"), CHILD_AT):.1f} m from the doctor\'s spot; nudge him '
                         'west then (the standing woman, who stands between them on the map\'s line, stays clear of '
                         'him behind the seated one)',
        'seats': 'seated figures are grounded at their feet (people.js: a ray from H + 1.2 m, and seats don\'t '
                 'collide); each sit clip puts the hips behind the feet (HIPS, measured on the GLBs), so each seated '
                 'figure is nudged until its hips sit on its built seat (solids.json seats), and the seat\'s top should '
                 'be at the clip\'s seat height (SEAT_H) or the figure hovers or sinks (checks)',
    },
    'procession': {'about': 'the retinue painted walking east with the official\'s horse: they stand with it now (no '
                            'figure walks away from a ridden horse; their walk played in place reads as idle/look). '
                            'Wanted on the page: a procession routine that walks the horse (horse walk) a short way east '
                            'and back with its rider and the three walking beside it at their painted offsets, playing:',
                   **{s: f'{c}{" + " + ", ".join(p) if p else ""}: {w}' for s, (c, p, w) in PROCESSION.items()}},
}

# the details pass's contact fixes (sections/city_end/contact_fixes.json: solved nudges and turns, recasts, IK clip
# variants; gen/details/contacts/fix_standard.md) are applied last, and the checks below see them
sys.path.insert(0, os.path.join(QM, 'tools'))
from contact_fixes import apply as apply_contact_fixes
apply_contact_fixes(people, 'city_end')

# ---------------------------------------------------------------- checks
issues, expected, info = [], [], []
body = {s: body_point(s) for s in standing()}
for s in [w['id'] for w in people['walkers']]:
    body[s] = spot(s)
EXPECTED_INSIDE = {   # painted so: (figure, what it stands against) -> why
    ('seated_woman_child_1535', 'S7.bld.zhao_taicheng'): 'seated at the west side of the shop\'s open front, her back '
                                                         'to its west column, as painted (the bench stands against it)',
}
scl = lambda s: people['figures'].get(s, {}).get('scale', 1)
ids = sorted(body)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        d = math.dist(body[a], body[b])
        if d < 0.23 * (scl(a) + scl(b)):
            issues.append(f'figures {a} and {b}: bodies {d:.2f} m apart')
        r = math.dist(spot(a), spot(b))
        if r < 0.26 * (scl(a) + scl(b)) and (a not in SEATED and b not in SEATED):
            info.append(f'figures {a} and {b}: spots {r:.2f} m apart (people.js body circles touch)')
own_seat = {s: st['seat'] for s, (_, _, st) in SEATED.items() if st}
for s in ids:
    p = body[s]
    for a, b in GROUND_BODIES.items():
        dd = poly_dist(p, b['poly'])
        if dd < 0.15:
            issues.append(f'figure {s} {dd:+.2f} m from animal {a}\'s real body')
    dd, name = OB.near(p, 0.5, skip=(own_seat.get(s),))
    if name and dd < 0.15:
        why = EXPECTED_INSIDE.get((s, name))
        (expected if why else issues).append(
            f'figure {s} {"(hips) " if s in SEATED else ""}{dd:+.2f} m from {name}' + (f' ({why})' if why else ''))
    # people.js stands a figure on whatever collider its three ground rays (spot, +-0.12 m in X) hit below 1.2 m
    q = spot(s)
    for name in set().union(*(OB.under((q[0] + dx, q[1])) for dx in (-0.12, 0, 0.12))):
        issues.append(f'figure {s}: a ground ray lands in {name} (it stands on top of it where that collider is below 1.2 m)')
    if poly_dist(q, AREA) > -0.26:
        issues.append(f'figure {s} {-poly_dist(q, AREA):.2f} m inside the painted area\'s edge')
for s, (m, clip, st) in SEATED.items():
    if not st:
        issues.append(f'seated figure {s}: no seat found within 1.2 m of its mapped spot')
        continue
    h = hips_of(s, m, clip)
    top = st.get('top')
    sh = SEAT_H.get((m, clip))
    line = (f'seated {s} ({m} {clip}): hips at ({h[0]:.2f}, {h[1]:.2f}), {poly_dist(h, SEATS[st["seat"]][0]):+.2f} m from '
            f'the edge of {st["seat"]}')
    if top is not None and sh:
        line += f'; seat top {float(top):.2f} m, the clip sits at about {sh:.2f} m ({sh - float(top):+.2f})'
        if abs(sh - float(top)) > 0.08:
            issues.append(f'seated {s}: {m}\'s {clip} sits at about {sh:.2f} m and {st["seat"]} is {float(top):.2f} m '
                          f'high: the figure {"hovers" if sh > float(top) else "sinks"} {abs(sh - float(top)):.2f} m '
                          f'(the builder\'s seat height is a choice)')
    info.append(line)
for s, (m, clip, st) in SEATED.items():
    for k, t in enumerate(toes_of(s)):
        for o, r in standing().items():
            if o != s and o not in SEATED and math.dist(t, r) < 0.2:
                info.append(f'seated {s}: its {("left", "right")[k]} foot ({m} {clip}) is {math.dist(t, r):.2f} m from '
                            f'{o}\'s spot (their feet meet; painted as close)')
for a, b in GROUND_BODIES.items():
    xs, ds = [q[0] for q in b['poly']], [q[1] for q in b['poly']]
    hit = set()
    x = min(xs)
    while x <= max(xs):
        d = min(ds)
        while d <= max(ds):
            if inside((x, d), b['poly']):
                hit |= OB.under((x, d))
                hit |= {n for n, poly, col in OB.polys if not col and inside((x, d), poly)}
            d += 0.05
        x += 0.05
    for name in sorted(hit):
        issues.append(f'animal {a} overlaps {name} (real size)')
for w in people['walkers']:
    n = max(2, int(math.dist(*w['path']) / 0.1))
    worst = min((clearance((w['path'][0][0] + (w['path'][1][0] - w['path'][0][0]) * i / n,
                            w['path'][0][1] + (w['path'][1][1] - w['path'][0][1]) * i / n), skip=(w['id'],)) for i in
                 range(n + 1)), key=lambda c: c[0])
    if worst[0] < BODY_R - 0.06:
        issues.append(f'walker {w["id"]}: path comes {worst[0]:.2f} m from {worst[1]}')

out = os.path.join(QM, 'sections/city_end/people.json')
json.dump(people, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
cast_out = os.path.join(HERE, 'cast.json')
json.dump({'about': 'S7\'s cast: for each painted figure, what the needs list wants (character, clips, props) and '
                    'what plays now (written by make_people.py; rerun it after a workshop delivery)',
           'figures': cast_table}, open(cast_out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

nf, nw = len(people['figures']), len(people['walkers'])
print(f'geometry from {SOURCE}' + (f'; passage X {PASSAGE["x"][0]:.2f} to {PASSAGE["x"][1]:.2f}' if PASSAGE else '')
      + f'; {len(set(OB.cells.values()))} collider owners in {len(OB.cells)} cells, '
        f'{sum(1 for p in OB.polys if p[2])} collider polygons, {sum(1 for p in OB.polys if not p[2])} soft, '
        f'{len(SEATS)} seats')
print(f'{nf} figures at their spots, {nw} walkers ({nf + nw} of {len(FIG)}), '
      f'{sum(1 for f in people["figures"].values() if f.get("ride"))} rider, {len(people["animals"])} animals '
      f'(of {len(ANIMALS)})')
for s, f in sorted(people['figures'].items(), key=lambda kv: FIG[kv[0]]['X']):
    print(f'  {s:28s} {f["character"]:15s}{(" (" + f["stand_in"] + ")") if f.get("stand_in") else "":16s} '
          f'{f["do"]} {f.get("props", "")} {f.get("nudge", "")}')
for w in people['walkers']:
    print(f'  walk {w["id"]}: {w["character"]} {w["clip"]} {math.dist(*w["path"]):.1f} m {w["path"]} '
          f'{w.get("props", "")}  {people["walkers_why"][w["id"]]}')
for s, (v, why) in NUDGE.items():
    print(f'  nudge {s} {v}: {why[:160]}')
print('expected (painted so):')
for x in expected:
    print('   ', x)
print('info:')
for x in info:
    print('   ', x)
print('checks:', 'none' if not issues else '')
for x in issues:
    print('   ', x)
print('to make:', ', '.join(k for k in people['clips_why'] if k not in ('about', 'procession', 'notes')))
print('props:', json.dumps(props_note, ensure_ascii=False))
print('wrote', os.path.relpath(out, QM), 'and', os.path.relpath(cast_out, QM))
