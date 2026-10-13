#!/usr/bin/env python3
"""Writes sections/countryside/people.json (and gen/sections/countryside/cast.json): every painted figure and every
painted animal of S1, the countryside at the scroll's start (u 29050-37610, map/text/S1.md), at its mapped spot
(sections/countryside/layout.json, read on every run), doing what it is painted doing, and nobody else
(map/BUILDING.md). The casting is gen/expand/countryside_needs.md ("Casting", "Actions", "Animals", "Props carried by
figures") with the lead's calls of 2026-10-12 (gen/expand/round2/build_rules.md: the charcoal train walks east, as
painted) and the S1 area agent's (build_choices.json calls: the runaway horse is built whole). Each figure names its
target, the catalogue's cast (gen/expand/round2/catalogue.md §7: the new farmer, straw_hat and groom, and the 22), and
its interim from the 22 (the needs list's cast by dress), which plays as people.json stand_in until the target lands.

Kept as a script, as gen/sections/city_end/make_people.py is, so the cast is redone whenever the workshop delivers or
the builder rebuilds:
- each figure names its target and interim (CASTING). A figure painted in a pose (seated, riding, crouching) that
  neither can hold yet is played, until one can, by the nearest character that can (POSE, cast_why); the script casts
  it back by itself when the clip lands.
- each figure has PLANS, the painted action first (its clips and carried props), then the stand-ins in order: a
  stand-in prop (the existing staff for the new hoe), the nearest clip, idle. The first plan the playing character
  can do today is written; what the wanted plan still lacks goes to clips_why and props_why. A plan with props plays
  only the clip that holds them (never a carry clip without its load, nor a prop on a clip that doesn't hold it).
- the walkers move in CONVOYS along a guide line (the road, the travellers' path), each member in its own lane at its
  own station, all at the pack animals' walking pace, so the group walks a short way along its painted direction and
  back together. The charcoal train is set out at real size (recorded moves, build_choices.json). The runaway horse
  walks west on the nearest clip the registry has, and its three grooms run west behind it on short paths that never
  reach it.
- nudges, walks and animal bodies are computed against what is built: the builder's solids.json when it writes one
  (as S7's does), else the layout's footprints, lines, props and trunks at the kit's real sizes; the walkable area
  from placed.json; the built ground under everyone from the builder's ground_at.json (H lifts). The checks print.
    python3 gen/sections/countryside/make_people.py
"""
import json
import math
import os
import re
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))
SEC = 'countryside'


def J(p, default=None):
    full = os.path.join(QM, p)
    if default is not None and not os.path.exists(full):
        return default
    return json.load(open(full, encoding='utf-8'))


L = J(f'sections/{SEC}/layout.json')
CHOICES = J(f'sections/{SEC}/build_choices.json', {})
PLACED = J(f'sections/{SEC}/placed.json', {})
SOLIDS = J(f'gen/sections/{SEC}/solids.json', {}) or None
GROUND_AT = (J(f'gen/sections/{SEC}/ground_at.json', {}) or {}).get('z', {})
REG = J('web/public/assets/chars/characters.json')
ANI = J('web/public/assets/animals/animals.json')
PROPS = J('characters/props.json')
for _m, _c in REG.items():   # the registry's own props {name: clip} (what each GLB holds) win over props.json
    if isinstance(_c, dict):
        for _n, _clip in (_c.get('props') or {}).items():
            PROPS.setdefault(_m, {})[_n] = {**PROPS.get(_m, {}).get(_n, {}), 'clip': _clip}
FIG = {f['id']: f for f in L['figures']}
E = L['entities']
S = L['section']
ANIMALS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'animal'}
MOVED = L.get('moved') or {}


def painted_xy(map_id, xy):
    """The painted (map) position: the layout's minus any recorded move (build_choices.json moves)."""
    m = MOVED.get(map_id) or {}
    return (xy[0] - m.get('dX', 0), xy[1] - m.get('dD', 0))


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


def height(c):
    return REG[c]['height_m']


def plan_of(c):
    p = os.path.join(QM, f'characters/{c}.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}


# ---------------------------------------------------------------- casting
# Each figure: (target, interim). The target is the catalogue's cast (gen/expand/round2/catalogue.md §7, S1 "after the
# new characters": farmer 9, straw_hat 3, groom 3 and the rest from the 22); the interim is the needs list's cast from
# the existing 22 (gen/expand/countryside_needs.md, "Casting", by dress), which plays until the target is built.
CASTING = {
    # the village stall (u 29150-29840)
    'man_with_stick_29205': ('farmer', 'scholar'), 'stall_man_29328': ('townsman', 'townsman'),
    'stall_customer_29280': ('farmer', 'hat_traveller'),
    # the runaway horse (惊马闯市)
    'man_at_post_29812': ('robed_man', 'robed_man'), 'child_29674': ('child_robed', 'child_robed'),
    'groom_chasing_30353': ('groom', 'idler'), 'groom_chasing_30518': ('groom', 'bearer'),
    'groom_chasing_30697': ('groom', 'inspector'),
    # the travellers on donkeys (迎寒策蹇)
    'traveller_standing_29996': ('scholar', 'scholar'), 'traveller_rider_30165': ('townsman', 'townsman'),
    'traveller_staff_30357': ('porter', 'porter'), 'traveller_rider_30495': ('camel_driver', 'camel_driver'),
    'groom_leading_donkey_30648': ('robed_man', 'robed_man'),
    # the far figures on the field banks (all low)
    'far_figure_29230': ('farmer', 'carter'), 'far_figure_29257': ('farmer', 'idler'),
    'far_figure_29337': ('farmer', 'townsman'), 'far_figure_29466': ('farmer', 'idler'),
    'far_figure_29482': ('straw_hat', 'hat_traveller'),
    # the tomb-sweeping party (杨柳杂花装簇轿顶)
    'sedan_bearer_front_30828': ('bearer', 'bearer'), 'sedan_bearer_rear_30990': ('bearer', 'bearer'),
    'porter_pole_31083': ('porter', 'porter'), 'porter_walking_31070': ('idler', 'idler'),
    'party_porter_staff_31131': ('porter', 'porter'), 'rider_party_30988': ('hat_traveller', 'hat_traveller'),
    'porter_boxes_30908': ('porter', 'porter'),
    # the farmsteads and the threshing floor
    'bending_farmer_34252': ('farmer', 'idler'), 'farmer_by_hedge_34472': ('farmer', 'soldier'),
    'figure_in_shed_35108': ('farmer', 'camel_driver'),
    # the charcoal train (赶驴入城, walking east as painted)
    'charcoal_driver_36250': ('straw_hat', 'carter'), 'charcoal_driver_36797': ('straw_hat', 'hat_traveller'),
}
CAST = {s: t for s, (t, _) in CASTING.items()}
INTERIM = {s: i for s, (_, i) in CASTING.items()}
NEW_CHAR = {
    'farmer': 'the catalogue\'s farmer (§1b item 16; model man_with_stick_29205: a pale belted robe or long jacket, a '
              'small cap, a hoe over the shoulder; free clips look, bend_goods, crouch, point; the take stand_sleeves; '
              'prop hoe). For S1 it also needs sit (free: from:scholar/sit) for the stall customer, who stays on his '
              'pose fallback until the farmer can sit',
    'straw_hat': 'the catalogue\'s straw-hat labourer (§1b item 10; a broad straw hat, a short belted jacket, knee '
                 'trousers; free clips look, crouch, …; the take drive_donkeys; prop stick as the switch)',
    'groom': 'the catalogue\'s groom (§1b item 17; a dark short jacket, pale trousers, a dark round cap, a short apron; '
             'free clip run; the take chase_run; prop hat_on_back for groom_chasing_30353)',
}
CAST_WHY = {
    'soldier': 'farmer_by_hedge_34472 (interim): the soldier (a belted knee-length jacket and a cap) plays the farmer by '
               'the hedge until the farmer lands (needs list: a new pairing)',
    'camel_driver': 'traveller_rider_30495 and figure_in_shed_35108: the camel driver\'s indigo mantle is the hooded '
                    'rider\'s cloak and the indigo-tinted cloak under the shed (needs list: a new pairing)',
}
# a pose the playing character can't hold yet (none of the pose's clips): played, until it can, by the nearest existing
# character that can (by dress). A seated figure never stands, a rider always rides, a crouching one never stands
# tall. world.js plays `character` whenever it exists, so a pose case is written with the character that plays now
# and no stand_in: a target that arrives without the pose's clip can't make it stand; this script casts it back.
POSE = {
    'stall_customer_29280': (['drink', 'sit'], 'carter',
                             'target farmer (not built; needs sit, free from:scholar/sit) seated, drinking (drink: free, '
                             'from:scholar/drink, on the interim hat traveller, who has no seated clip yet): until one of '
                             'them can sit the customer is the carter (sit): his brown head-wrap reads as the painted hood '
                             'or broad cap; nobody else at the stall is the carter'),
    'traveller_rider_30495': (['ride'], 'inspector',
                              'target camel_driver riding (ride: trimmed, back free from gen/); until it is back the '
                              'hooded rider in the indigo cloak is the inspector (indigo knee robe), who rides; the '
                              'other traveller is the townsman'),
    'figure_in_shed_35108': (['crouch'], 'townsman',
                             'target farmer (not built; crouch among its free clips), interim camel_driver (crouch: free, '
                             'from:idler/crouch): until one of them can crouch the dark cloaked figure crouching behind the '
                             'plank is the townsman (slate robe; crouch): a figure painted crouching at half a farmer\'s '
                             'height never stands up'),
}

# ---------------------------------------------------------------- what each figure does: plans, wanted first
# A plan is (steps [(clip, seconds)], props, note). The first plan the playing character can do is written.
P = lambda *steps, props=(), note='': ([tuple(s) for s in steps], list(props), note)
PLANS = {
    'man_with_stick_29205': [P(('point', 10), props=['hoe']),
                             P(('idle', 10), props=['hoe'], note='the hoe on his shoulder (bound to idle on the scholar); '
                               'his painted pointing arm waits for point to hold it'),
                             P(('idle', 10), props=['staff'], note='stand-in prop: the existing knobbed staff (upright, '
                               'held in idle) for the new hoe over his shoulder'),
                             P(('point', 10)), P(('talk', 10)), P(('look', 10))],
    'stall_man_29328': [P(('talk', 10), props=['back_bundle']), P(('talk', 10))],
    'stall_customer_29280': [P(('drink', 12)), P(('sit', 12))],
    'man_at_post_29812': [P(('beckon_lean', 10)), P(('hail', 10)), P(('talk', 10))],
    'child_29674': [P(('reach', 8), ('look', 4)), P(('look', 8), ('idle', 4))],
    'traveller_standing_29996': [P(('look', 10), props=['stick_bag']),
                                 P(('idle', 10), props=['stick_bag'], note='the stick and bag held before his chest '
                                   '(bound to idle on the scholar); his look waits for look to hold it'),
                                 P(('look', 10))],
    'traveller_rider_30165': [P(('ride', 10), props=['wind_hood', 'wind_cape']), P(('ride', 10), props=['wind_hood']),
                              P(('ride', 10))],
    'traveller_rider_30495': [P(('ride', 10), props=['wind_hood', 'wind_cape']), P(('ride', 10), props=['wind_hood']),
                              P(('ride', 10))],
    'far_figure_29230': [P(('crouch', 10))],
    'far_figure_29257': [P(('crouch', 10))],
    'far_figure_29337': [P(('idle', 10))],
    'far_figure_29466': [P(('idle', 10))],
    'far_figure_29482': [P(('idle', 10))],
    # (the far figures: idle as the needs list says; two pairs crouch)
    'sedan_bearer_front_30828': [P(('sedan_carry', 10))],
    'sedan_bearer_rear_30990': [P(('sedan_carry', 10))],
    # held with the sedan, which doesn't move (S4's precedent): they stand with it; their walk waits for a procession
    'porter_pole_31083': [P(('idle', 8), ('look', 4)), P(('idle', 10))],
    'porter_walking_31070': [P(('idle', 8), ('look', 4)), P(('idle', 10))],
    'party_porter_staff_31131': [P(('stand_pole', 10), props=['staff'],
                                   note='held with the sedan: he stands holding his knobbed staff upright (the porter\'s '
                                        'staff is bound to stand_pole); painted walking with it on his shoulder')],
    'rider_party_30988': [P(('ride', 10))],
    'porter_boxes_30908': [P(('idle', 8), ('look', 4)), P(('idle', 10))],
    'bending_farmer_34252': [P(('bend_goods', 10)), P(('crouch', 10))],
    'farmer_by_hedge_34472': [P(('stand_sleeves', 10)), P(('idle', 10))],
    'figure_in_shed_35108': [P(('crouch', 10))],
}
RIDE = {'traveller_rider_30165': 'donkey_traveller_30216', 'traveller_rider_30495': 'donkey_traveller_30546',
        'rider_party_30988': 'horse_party_31023'}
# walkers: (clip, props) plans, wanted first
W = lambda clip, *props, note='': (clip, list(props), note)
WALK_PLANS = {
    'charcoal_driver_36797': [W('drive_donkeys', 'stick'), W('walk', 'stick'), W('walk')],
    'charcoal_driver_36250': [W('drive_donkeys', 'stick'), W('walk', 'stick'), W('walk')],
    'traveller_staff_30357': [W('carry_pole', 'staff_shoulder', 'back_bundle'), W('carry_pole', 'staff_shoulder'),
                              W('walk', 'stick', 'back_bundle', note='stand-in prop: the porter\'s 1.5 m stick held in '
                                                                     'walk for the knobbed staff on his shoulder'),
                              W('walk', 'stick', note='stand-in prop: the porter\'s 1.5 m stick held in walk for the '
                                                      'knobbed staff on his shoulder'),
                              W('walk')],
    'groom_leading_donkey_30648': [W('lead', 'lead_rope'), W('lead'), W('walk')],
    'groom_chasing_30353': [W('chase_run', 'hat_on_back'), W('chase_run'), W('run', 'hat_on_back'), W('run')],
    'groom_chasing_30518': [W('chase_run'), W('run')],
    'groom_chasing_30697': [W('chase_run'), W('run')],
}
# what each wanted clip is, and where a free one comes from (needs list, "Actions the existing clips can't show")
WANT = {
    'chase_run': 'NEW take (worth having): running flat out with long strides, one arm thrust straight forward at '
                 'shoulder height with the hand open, the other swinging back, the head forward, shouting; run stands in',
    'drive_donkeys': 'NEW take (worth having): walking slowly beside and a little behind a laden pack animal, the near '
                     'arm forward with the hand resting on its load, the other hand holding a long switch out low behind; '
                     'walk stands in (walk_whip is wrong: it swings the whip overhead)',
    'beckon_lean': 'NEW take (optional): leaning sideways on a waist-high bar, one forearm along it, the other arm '
                   'stretched far out level, beckoning a child; hail (free) stands in',
    'stand_sleeves': 'NEW take (optional): standing with both hands in the opposite sleeves at the chest against the '
                     'cold, shoulders a little hunched, the head turning; idle stands in',
    'drink': 'seated, drinking (free: from:scholar/drink, Meshy 343)',
    'hail': 'calling out with a raised arm (free: from:idler/hail)',
    'lead': 'walking leading an animal by the rope (the robed man\'s was trimmed: back free from gen/)',
    'ride': 'riding astride (the camel driver\'s was trimmed: back free from gen/)',
    'crouch': 'crouching (free: from:idler/crouch)',
    'bend_goods': 'bending over to the ground (free: from:inspector/bend_goods)',
    'reach': 'a small child reaching out a hand (free: from:child/reach)',
    'point': 'pointing ahead (free: from:sightseer/point)',
    'look': 'standing, looking about (free: from:townsman/look)',
}
FROM = {('hat_traveller', 'drink'): 'from:scholar/drink', ('robed_man', 'hail'): 'from:idler/hail',
        ('robed_man', 'lead'): 'trimmed, back free from gen/', ('camel_driver', 'ride'): 'trimmed, back free from gen/',
        ('camel_driver', 'crouch'): 'from:idler/crouch', ('idler', 'bend_goods'): 'from:inspector/bend_goods',
        ('child_robed', 'reach'): 'from:child/reach', ('scholar', 'point'): 'from:sightseer/point',
        ('porter', 'look'): 'from:townsman/look'}
NEW_TAKE = {'chase_run', 'drive_donkeys', 'beckon_lean', 'stand_sleeves'}
# takes the workshop marks not to use (gen/expand/round2/workshop_progress.md, read in order: "NOT TO USE `x`" bars a
# clip, a later "PASS `x`" (a retake that passed) lifts it); a barred clip is never cast, its plan's stand-in plays
# (the S1 finisher, Run 3: chase_run's arms stay out sideways, stand-in run)
NOT_TO_USE = set()
for _l in (open(os.path.join(QM, 'gen/expand/round2/workshop_progress.md'), encoding='utf-8').read().splitlines()
           if os.path.exists(os.path.join(QM, 'gen/expand/round2/workshop_progress.md')) else []):
    for _c in re.findall(r'NOT TO USE `(\w+)`', _l):
        NOT_TO_USE.add(_c)
    for _c in re.findall(r'\*\*PASS `(\w+)`', _l):
        NOT_TO_USE.discard(_c)
# the new carried props (needs list "Props carried by figures"): what each is, and its stand-in today
NEW_PROP = {
    'wind_hood': 'NEW 风帽: a padded hood wrapping the head and neck and falling over the shoulders like a short cape, '
                 'face open, dark or indigo; Head bone with the cape on Spine (follow < 1 on ride). No stand-in',
    'pole_basket_branches': 'NEW: a pole with a round basket at the front end and a long bundle of branches (or rolled '
                            'paper offerings) at the back, on carry_pole. Stand-in when he walks: pole_baskets',
    'stick_bag': 'NEW: a short stick (0.6 m) upright before the chest in both hands, a long dark bag hanging from its top. '
                 'No stand-in (the staff is 1.98 m)',
    'hoe': 'NEW 锄: a 1.6 m long-handled hoe with a small hooked or forked head over the right shoulder, on point. '
           'Stand-in: the scholar\'s staff, upright in idle',
    'hat_on_back': 'NEW (optional): a broad straw hat hanging at the back of the shoulders on its strings, flying a '
                   'little, on run (or chase_run). No stand-in (the idler\'s GLB has no back_bundle)',
    'pole_hampers': 'NEW (optional): two tall dark lidded food boxes (食盒) on a shoulder pole, on carry_pole. Stand-in '
                    'when he walks: pole_boxes',
    'back_bundle': 'existing (child, back_load): needs a binding on the townsman\'s talk (stall_man_29328) and the '
                   'porter\'s carry_pole (traveller_staff_30357)',
    'staff': 'existing: the S7 attendant\'s placement on the shoulder in carry_pole, for the porter '
             '(traveller_staff_30357; party_porter_staff_31131 when the party walks)',
    'stick': 'existing (porter, walk): a binding on the hat traveller\'s and the carter\'s walk (and drive_donkeys), as '
             'the charcoal drivers\' switches, held low',
    'lead_rope': 'existing (robed_man, hold_rope): a binding on lead when the robed man\'s lead is back',
}

# children: the painted height against the adult beside them, as a scale of the playing child model
CHILD = {'child_29674': (64 / 146, 'painted 64 px against the man at the post\'s 146 px (needs list)')}

# ---------------------------------------------------------------- animals (needs list "Animals"; registry models)
ANIMAL_SPEC = {
    'water_buffalo_lying_29462': dict(model='ox', do=[['lie', 10]]),
    'ox_standing_29540': dict(model='ox', do=[['graze', 9], ['idle', 3]]),
    'far_ox_29515': dict(model='ox', do=[['idle', 10]]),
    'runaway_horse_30075': dict(model='horse'),                       # walks its path (below)
    'horse_party_31023': dict(model='horse', load='saddle', do=[['idle', 10]]),
    'donkey_traveller_30216': dict(model='donkey', load='saddle_cloth'),
    'donkey_traveller_30546': dict(model='donkey', load='saddle_cloth'),
    'donkey_charcoal_36323': dict(model='donkey', load='pannier_charcoal'),
    'donkey_charcoal_36410': dict(model='donkey', load='pannier_charcoal'),
    'donkey_charcoal_36508': dict(model='donkey', load='pannier_charcoal'),
    'donkey_charcoal_36666': dict(model='donkey', load='pannier_charcoal'),
    'donkey_charcoal_36745': dict(model='donkey', load='pannier_charcoal'),
}
# the buffalo variant (ox body, dark slate tone, the kit-built horns_swept tack): used as soon as the registry has it
if 'buffalo' in ANI:
    ANIMAL_SPEC['water_buffalo_lying_29462']['model'] = 'buffalo'
    if 'horns_swept' in (ANI['buffalo'].get('tack') or []):
        ANIMAL_SPEC['water_buffalo_lying_29462']['load'] = 'horns_swept'
# the walk each walking animal wants (people.js plays `walk` on every animal path today)
ANIMAL_WALK_WANT = {'donkey_charcoal_36745': 'walk_low', 'donkey_charcoal_36508': 'walk_low',
                    'donkey_charcoal_36410': 'walk_low', 'donkey_charcoal_36323': 'walk_low',
                    'donkey_traveller_30216': 'walk_low', 'runaway_horse_30075': 'gallop'}
UNBUILT_ANIMALS = {'pale_bird_34250': 'waits on a pale bird variant and the lead\'s reading (a crow would be wrong)'}
LOAD_W = {'pannier_charcoal': 0.8, 'pack_saddle': 0.8, 'saddle_cloth': 0.5, 'saddle': 0.7}   # loads wider than bodies

# ---------------------------------------------------------------- geometry
AREA = [tuple(q) for q in (PLACED.get('walk') or L['painted_area']['corners'])]
AREA_SRC = 'placed.json walk' if PLACED.get('walk') else 'the painted area (placed.json not written yet)'


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
    """Distance from p to a polygon's boundary, negative inside (a 2-point polygon is a segment)."""
    n = len(poly)
    if n == 2:
        return seg_dist(p, poly[0], poly[1])
    d = min(seg_dist(p, poly[i], poly[(i + 1) % n]) for i in range(n))
    return -d if inside(p, poly) else d


def line_dist(p, pts):
    return min(seg_dist(p, pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def rect(c, ang_deg, half_len, half_w):
    a = math.radians(ang_deg)
    f, n = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
    return [(c[0] + sf * half_len * f[0] + sn * half_w * n[0], c[1] + sf * half_len * f[1] + sn * half_w * n[1])
            for sf, sn in ((-1, -1), (1, -1), (1, 1), (-1, 1))]


def fwd_left(facing):
    a = math.radians(facing)
    return (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))


def disc(c, r, n=10):
    return [(c[0] + r * math.cos(2 * math.pi * i / n), c[1] + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


class Line:
    """A polyline with stations (arc length), a smoothed tangent and lane offsets."""

    def __init__(self, pts):
        self.p = [tuple(q[:2]) for q in pts]
        self.cum = [0.0]
        for a, b in zip(self.p, self.p[1:]):
            self.cum.append(self.cum[-1] + math.dist(a, b))
        self.length = self.cum[-1]

    def at(self, s):
        if s <= 0:
            (a, b), t = self.p[:2], s / max(1e-9, self.cum[1])
        elif s >= self.length:
            a, b = self.p[-2], self.p[-1]
            t = 1 + (s - self.length) / max(1e-9, self.cum[-1] - self.cum[-2])
        else:
            i = next(k for k in range(1, len(self.cum)) if self.cum[k] >= s)
            a, b = self.p[i - 1], self.p[i]
            t = (s - self.cum[i - 1]) / max(1e-9, self.cum[i] - self.cum[i - 1])
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    def tangent(self, s, h=0.5):
        a, b = self.at(s - h), self.at(s + h)
        d = math.dist(a, b) or 1
        return ((b[0] - a[0]) / d, (b[1] - a[1]) / d)

    def lane(self, s, l):
        """The point at station s, l metres to the left (+) of the direction of increasing stations."""
        q, t = self.at(s), self.tangent(s)
        return (q[0] - t[1] * l, q[1] + t[0] * l)

    def station(self, p):
        best = (1e9, 0.0)
        for i in range(len(self.p) - 1):
            a, b = self.p[i], self.p[i + 1]
            dx, dy = b[0] - a[0], b[1] - a[1]
            ll = dx * dx + dy * dy
            t = 0 if ll == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / ll))
            d = math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
            if d < best[0]:
                best = (d, self.cum[i] + t * math.sqrt(ll))
        s = best[1]
        q, tg = self.at(s), self.tangent(s)
        side = -(p[0] - q[0]) * tg[1] + (p[1] - q[1]) * tg[0]
        return s, side

    def lane_path(self, s0, s1, l, step=0.5):
        n = max(1, int(math.ceil(abs(s1 - s0) / step)))
        return [self.lane(s0 + (s1 - s0) * i / n, l) for i in range(n + 1)]


# ---------------------------------------------------------------- what is built: obstacles
# Kinds: 'poly' (a footprint), 'seg' (a wall line with a half thickness), 'disc'. Each has `walk` (blocks walkers and
# animals) and `stand` (a figure must not stand in it). Open-fronted sheds block walks and animals but the figures
# painted under them stand inside (EXPECTED_INSIDE).
OPEN_SHEDS = {'S1.bld.stall_shed_29600', 'S1.bld.stall_annex_29350', 'S1.bld.barn_open_34860', 'S1.bld.shed_posts_31370'}
# choice: the props' ground radii (m) until the builder's solids.json gives their colliders; perched and hung things
# (nests, the bundle hung on the willow) are not on the ground
PROP_R = {'post_crossbar': 0.15, 'round_basket': 0.35, 'stall_table_small': 0.3, 'pale_board': 0.12,
          'trestle_hut_gate': 0.5, 'jar_tied': 0.35, 'basin': 0.4, 'reed_or_stake': 0.04, 'haystack': 1.1,
          'roller_frame': 0.55, 'yard_object': 0.3, 'stack': 0.45, 'crossed_poles': 0.5, 'slatted_box': 0.35,
          'jar_shed': 0.28, 'long_plank_shed': 0.35, 'bench_35133': 0.45, 'straw_strip': 0.25, 'mooring_pole': 0.05,
          'leaning_pole': 0.1}
SOFT_PROPS = ('straw_strip',)             # lying flat: a figure shouldn't stand in it, a walker may cross it
OB = []   # dicts: name, kind, shape, walk, stand


def ob(name, kind, shape, walk=True, stand=True, **kw):
    OB.append(dict(name=name, kind=kind, shape=shape, walk=walk, stand=stand, **kw))


def ob_dist(o, p):
    if o['kind'] == 'poly':
        return poly_dist(p, o['shape'])
    if o['kind'] == 'seg':
        return line_dist(p, o['shape']) - o.get('w', 0)
    if o['kind'] == 'disc':
        return math.dist(p, o['shape'][0]) - o['shape'][1]
    if o['kind'] == 'cells':
        return o['near'](p)[0] if 'near' in o else o['dist'](p)


RAW_GLB = os.path.join(HERE, 'web_build', f'{SEC}_raw.glb')


class Built:
    """What the builder built, read from its raw scene GLB: every collider mesh (`*__col`, the ones world.js collides
    with) rasterized into 0.1 m plan cells where it stands at body height (0.15-1.6 m above the walkable surface: the
    ground, the bank and shore faces, the bridge deck), with a distance field (each cell's nearest collider cell, by
    two raster passes), so a spot, a walk or an animal's body is tested against what is really there, at its built
    size. The cells don't know their owners: a cell is named after the nearest mapped thing in the layout."""
    TERRAIN = ('g_ground__col', 'g_earth__col', 'g_deck__col')
    C, G = 0.1, 0.2

    def __init__(self, path):
        from array import array
        b = open(path, 'rb').read()
        n = struct.unpack('<I', b[12:16])[0]
        j = json.loads(b[20:20 + n])
        o = 20 + n
        bl = struct.unpack('<I', b[o:o + 4])[0]
        binc = b[o + 8:o + 8 + bl]

        def acc(i):
            a = j['accessors'][i]
            bv = j['bufferViews'][a['bufferView']]
            st = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
            arr = array({5126: 'f', 5123: 'H', 5125: 'I', 5121: 'B'}[a['componentType']])
            k = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
            arr.frombytes(binc[st:st + a['count'] * k * arr.itemsize])
            return arr
        tris = {}
        for nd in j['nodes']:   # the builder's raw GLB: one node per material bucket, identity transforms
            if 'mesh' not in nd or not nd['name'].endswith('__col'):
                continue
            t = tris.setdefault(nd['name'], [])
            for pr in j['meshes'][nd['mesh']]['primitives']:
                P, I = acc(pr['attributes']['POSITION']), acc(pr['indices'])
                for k in range(0, len(I), 3):
                    t.append(tuple((P[3 * v], -P[3 * v + 2], P[3 * v + 1]) for v in (I[k], I[k + 1], I[k + 2])))
        self.mtime = os.path.getmtime(path)
        G = self.G
        terr = {}
        for name in self.TERRAIN:
            for A, B, Cc in tris.get(name, []):
                det = (B[1] - Cc[1]) * (A[0] - Cc[0]) + (Cc[0] - B[0]) * (A[1] - Cc[1])
                if abs(det) < 1e-12:
                    continue
                for gi in range(math.floor(min(A[0], B[0], Cc[0]) / G), math.floor(max(A[0], B[0], Cc[0]) / G) + 1):
                    for gj in range(math.floor(min(A[1], B[1], Cc[1]) / G), math.floor(max(A[1], B[1], Cc[1]) / G) + 1):
                        px, py = (gi + 0.5) * G, (gj + 0.5) * G
                        l1 = ((B[1] - Cc[1]) * (px - Cc[0]) + (Cc[0] - B[0]) * (py - Cc[1])) / det
                        l2 = ((Cc[1] - A[1]) * (px - Cc[0]) + (A[0] - Cc[0]) * (py - Cc[1])) / det
                        l3 = 1 - l1 - l2
                        if l1 >= -1e-6 and l2 >= -1e-6 and l3 >= -1e-6:
                            z = l1 * A[2] + l2 * B[2] + l3 * Cc[2]
                            if z > terr.get((gi, gj), -99):
                                terr[(gi, gj)] = z
        self.terr = terr
        C = self.C
        cells = {}
        for name, ts in tris.items():
            if name in self.TERRAIN:
                continue
            for A, B, Cc in ts:
                na = max(1, min(400, int(math.dist(A, B) / 0.05)))
                nb = max(1, min(400, int(math.dist(A, Cc) / 0.05)))
                for u in range(na + 1):
                    for v in range(nb + 1 - u * nb // na if na else nb + 1):
                        sx, tx = u / na, v / nb
                        if sx + tx > 1:
                            continue
                        x = A[0] + sx * (B[0] - A[0]) + tx * (Cc[0] - A[0])
                        y = A[1] + sx * (B[1] - A[1]) + tx * (Cc[1] - A[1])
                        z = A[2] + sx * (B[2] - A[2]) + tx * (Cc[2] - A[2])
                        g = terr.get((math.floor(x / G), math.floor(y / G)), 0.0)
                        if g + 0.15 < z < g + 1.6:
                            cells.setdefault((math.floor(x / C), math.floor(y / C)), name)
        self.cells = cells
        xs = [q[0] for q in AREA]
        ys = [q[1] for q in AREA]
        self.i0, self.j0 = math.floor((min(xs) - 2) / C), math.floor((min(ys) - 2) / C)
        self.ni, self.nj = math.floor((max(xs) + 2) / C) - self.i0 + 1, math.floor((max(ys) + 2) / C) - self.j0 + 1
        ni, nj, i0, j0 = self.ni, self.nj, self.i0, self.j0
        src = [-1] * (ni * nj)          # each cell's nearest collider cell (flat index), by two raster passes
        for (ci, cj) in cells:
            a, bb = ci - i0, cj - j0
            if 0 <= a < ni and 0 <= bb < nj:
                src[a * nj + bb] = a * nj + bb

        def d2(k, s_):
            return (k // nj - s_ // nj) ** 2 + (k % nj - s_ % nj) ** 2
        for passes in (((-1, -1), (-1, 0), (-1, 1), (0, -1)), ((1, 1), (1, 0), (1, -1), (0, 1))):
            rng_i = range(ni) if passes[0][0] < 0 else range(ni - 1, -1, -1)
            rng_j = range(nj) if passes[0][0] < 0 else range(nj - 1, -1, -1)
            for a in rng_i:
                for bb in rng_j:
                    k = a * nj + bb
                    best = src[k]
                    bd = d2(k, best) if best >= 0 else 1 << 30
                    for da, db in passes:
                        a2, b2 = a + da, bb + db
                        if 0 <= a2 < ni and 0 <= b2 < nj:
                            s_ = src[a2 * nj + b2]
                            if s_ >= 0:
                                dd = d2(k, s_)
                                if dd < bd:
                                    best, bd = s_, dd
                    src[k] = best
        self.src = src
        self.names = {}

    def terrain(self, p):
        return self.terr.get((math.floor(p[0] / self.G), math.floor(p[1] / self.G)))

    def near(self, p):
        """(distance from p to the nearest collider cell, that cell's key)."""
        a, bb = math.floor(p[0] / self.C) - self.i0, math.floor(p[1] / self.C) - self.j0
        if not (0 <= a < self.ni and 0 <= bb < self.nj):
            return 9.0, None
        s_ = self.src[a * self.nj + bb]
        if s_ < 0:
            return 9.0, None
        ci, cj = s_ // self.nj + self.i0, s_ % self.nj + self.j0
        dx = max(ci * self.C - p[0], 0, p[0] - (ci + 1) * self.C)
        dy = max(cj * self.C - p[1], 0, p[1] - (cj + 1) * self.C)
        return math.hypot(dx, dy), (ci, cj)

    def name(self, key):
        """The cell's owner as best known: an edge wall by its mesh, else the nearest mapped thing within 1.2 m."""
        if key in self.names:
            return self.names[key]
        mesh = self.cells.get(key, '')
        c = ((key[0] + 0.5) * self.C, (key[1] + 0.5) * self.C)
        m = re.match(r'g_edge_(\w+?)_hidden__col', mesh)
        if m:
            nm = f'edge:{m.group(1)}'
        else:
            best = (1.2, None)
            for o in LAYOUT_OB:
                d = ob_dist(o, c)
                if d < best[0]:
                    best = (d, o['name'])
            nm = best[1] or f'a built collider ({mesh})'
        self.names[key] = nm
        return nm


class BuiltName(str):
    pass


def layout_obstacles(add):
    """The layout's footprints, lines, props, shores, vehicles and trunks at the kit's real sizes and the choice radii."""
    for k, e in E.items():
        kind, slug = e['kind'], k.split('.')[-1]
        if kind == 'building' and e.get('footprint'):
            add(k, 'poly', [tuple(q) for q in e['footprint']], stand=k not in OPEN_SHEDS)
        elif kind == 'structure' and e.get('lines'):
            if slug.startswith('posts_'):
                for ln in e['lines'].values():
                    for q in (ln[0], ln[-1]):
                        add(k, 'disc', (tuple(q[:2]), 0.1))
            elif slug.startswith('small_bridge'):
                for ln in e['lines'].values():          # the plank deck's edges: nobody walks the bridge
                    add(k, 'seg', [tuple(q[:2]) for q in ln], w=0.05)
            else:
                w = 0.3 if 'hedge' in slug else 0.1     # choice: a hedge 0.6 m thick, a fence or rail 0.2 m
                for ln in e['lines'].values():
                    add(k, 'seg', [tuple(q[:2]) for q in ln], w=w)
        elif kind == 'prop' and not str(e.get('support', '')).startswith('perched') and 'hanging_bundle' not in slug:
            if e.get('footprint'):
                add(k, 'poly', [tuple(q) for q in e['footprint']])
            else:
                r = next((rr for key, rr in PROP_R.items() if slug.startswith(key) or key in slug), 0.25)
                add(k, 'disc', (tuple(e['pos'][:2]), r), walk=not slug.startswith(SOFT_PROPS))
        elif kind == 'water':
            for nm, ln in e['lines'].items():        # the builder's edge:shore walls along every shore
                add(f'{k} ({nm})', 'seg', [tuple(q[:2]) for q in ln], w=0.0)
    # vehicles at the kit's real sizes. The carried sedan: kit_vehicles.sedan_chair(front, rear, carried=True) defaults
    # (cabin d 0.92 along, w 0.78 across, cabin_at 0.5, its hidden collider 0.05 / 0.12 proud); the poles at 1.3 m
    # pass over nobody's spot but the bearers'. The tipped barrow: choice 1.7 m long, 0.6 m wide, lying.
    sp_ = E[f'{S}.veh.sedan_willow_30805']['pts']
    sc_ = ((sp_['front'][0] + sp_['rear'][0]) / 2, (sp_['front'][1] + sp_['rear'][1]) / 2)
    sa_ = math.degrees(math.atan2(sp_['front'][1] - sp_['rear'][1], sp_['front'][0] - sp_['rear'][0]))
    add(f'{S}.veh.sedan_willow_30805', 'poly', rect(sc_, sa_, 0.46 + 0.05, 0.39 + 0.12))
    bp_ = E[f'{S}.veh.barrow_tipped_29795']['pts']
    bc_ = E[f'{S}.veh.barrow_tipped_29795']['pos']
    ba_ = math.degrees(math.atan2(bp_['front'][1] - bp_['rear'][1], bp_['front'][0] - bp_['rear'][0]))
    add(f'{S}.veh.barrow_tipped_29795', 'poly', rect(bc_, ba_, 0.85, 0.3))
    # trunks: the builders' collider r 0.3 x scale; only trees of 3 m or more block a walk (the brief); smaller
    # saplings (the 菜地's young trees) still keep a standing figure off their stems
    for t in L['trees']:
        big = (t.get('height_m') or 0) >= 3.0
        add(t['map_id'], 'disc', ((t['X'], t['D']), 0.3 * t.get('scale', 1) if big else 0.08), walk=big)


LAYOUT_OB = []
layout_obstacles(lambda name, kind, shape, walk=True, stand=True, **kw: LAYOUT_OB.append(
    dict(name=name, kind=kind, shape=shape, walk=walk, stand=stand, **kw)))
BUILT = None
SOURCE = 'layout.json footprints, lines, props and trunks at the choice radii (no build yet)'
if SOLIDS:
    SOURCE = f'gen/sections/{SEC}/solids.json'
    _cell = SOLIDS.get('cell', 0.1)
    _cells = {}
    for owner, cs in SOLIDS['owners'].items():
        for i, j in cs:
            _cells[(i, j)] = owner

    def _cells_near(p, owner_set=None, r=1.5):
        best = 9.0
        for i in range(math.floor((p[0] - r) / _cell), math.floor((p[0] + r) / _cell) + 1):
            for j in range(math.floor((p[1] - r) / _cell), math.floor((p[1] + r) / _cell) + 1):
                o = _cells.get((i, j))
                if o is None or (owner_set and o not in owner_set):
                    continue
                dx = max(i * _cell - p[0], 0, p[0] - (i + 1) * _cell)
                dy = max(j * _cell - p[1], 0, p[1] - (j + 1) * _cell)
                best = min(best, math.hypot(dx, dy))
        return best
    for owner in sorted(set(_cells.values())):
        ob(owner, 'cells', None, dist=(lambda p, o=owner: _cells_near(p, {o})),
           stand=owner not in OPEN_SHEDS)
    for k, s in (SOLIDS.get('seats') or {}).items():
        ob(k, 'seg', [tuple(s['from']), tuple(s['to'])], walk=False, stand=False, w=s.get('w', 0.3) / 2, top=s.get('top'))
    if SOLIDS.get('walk'):
        AREA, AREA_SRC = [tuple(q) for q in SOLIDS['walk']], 'solids.json walk'
elif os.path.exists(RAW_GLB):
    BUILT = Built(RAW_GLB)
    SOURCE = (f'the build: {os.path.relpath(RAW_GLB, QM)} ({len(BUILT.cells)} collider cells at body height), and the '
              f'layout\'s props at the choice radii for standing (non-colliding props)')
    ob('built', 'cells', None, near=BUILT.near)
    for o in LAYOUT_OB:          # a figure doesn't stand in a built prop, colliding or not, nor on a sapling's stem
        if o['kind'] == 'disc':
            ob(o['name'], 'disc', o['shape'], walk=False, stand=True)
else:
    for o in LAYOUT_OB:
        OB.append(o)


def nearest_ob(p, r=2.0, what='walk', skip=()):
    best = (r, None)
    for o in OB:
        if not o[what] or o['name'] in skip:
            continue
        if 'near' in o:
            d, key = o['near'](p)
            if d < best[0]:
                best = (d, key)
            continue
        d = ob_dist(o, p)
        if d < best[0]:
            best = (d, o['name'])
    if isinstance(best[1], tuple):
        best = (best[0], BUILT.name(best[1]))
    return best


def area_room(p):
    return -poly_dist(p, AREA)


# ---------------------------------------------------------------- who plays, and what
def playing(slug):
    """(character written to people.json, its stand_in or None, the model that plays now, why a pose fallback plays).
    The target plays once it is built (and can hold the figure's pose); until then a plain figure is written as the
    target with the interim as its stand_in (world.js swaps by itself when the target lands), and a posed one as the
    interim or the pose fallback, whichever can hold the pose."""
    target, interim = CAST[slug], INTERIM[slug]
    need, fallback, why = POSE.get(slug, (None, None, None))
    can = lambda c: c in REG and (need is None or any(x in clips(c) for x in need))
    if can(target):
        return target, None, target, None
    if need is None:
        return target, interim, interim, None
    m = interim if can(interim) else fallback
    return m, None, m, (None if m == interim else why)


def prop_binding(model, p):
    return PROPS.get(model, {}).get(p, {}).get('clip') if f'prop_{p}' in glb_parts(model) else None


# props the workshop placed to ride any clip (on the Spine, at the back or the hip): on with whatever the figure plays
# (gen/expand/round2/workshop_progress.md, the props batch: back_bundle, straw_cape, hip_bag, back_chair_frame, ...)
ANY_CLIP_PROPS = {'back_bundle', 'back_bundle_pale', 'straw_cape', 'hip_bag', 'back_chair_frame'}


def plan_ok(model, steps, props):
    cl = [c for c, _ in steps]
    if any(c not in clips(model) or c in NOT_TO_USE for c in cl):
        return False
    held = [p for p in props if p not in ANY_CLIP_PROPS]
    for p in props:
        if f'prop_{p}' not in glb_parts(model):
            return False
    for p in held:
        b = prop_binding(model, p)
        if not b or b not in cl:
            return False
    return not held or all(c == prop_binding(model, held[0]) for c in cl)


wanted_clips = {}     # clip -> {wanted character: [(figure, what plays now)]}
wanted_props = {}     # prop -> [(figure, playing model, state)]


def note_wanted(slug, model, steps, props, now):
    """What the wanted plan lacks: on the target (built or not) and, while another character plays, on that one too
    (the free retargets onto the interim casts, catalogue §2a)."""
    target = CAST[slug]
    for ch in dict.fromkeys([target, INTERIM[slug]]):
        for c, _ in steps:
            if c not in clips(ch) and not (ch not in REG and c in ('idle', 'walk', 'run')):
                wanted_clips.setdefault(c, {}).setdefault(ch, []).append((slug, now))
        for p in props:
            b = prop_binding(ch, p)
            if (p in ANY_CLIP_PROPS and f'prop_{p}' in glb_parts(ch)) or (b and b in [c for c, _ in steps]):
                continue
            if True:
                state = ('new prop' if p in NEW_PROP and not NEW_PROP[p].startswith('existing') else
                         f'{ch} has prop_{p} held in {b}' if b else f'{ch} has no prop_{p} yet')
                wanted_props.setdefault(p, []).append((slug, ch, state))


CHOSEN = {}


def choose(slug):
    if slug in CHOSEN:
        return CHOSEN[slug]
    char, stand_in, model, why = playing(slug)
    plans = PLANS[slug]
    for k, (steps, props, note) in enumerate(plans):
        if plan_ok(model, steps, props):
            break
    else:
        steps, props, note, k = [('idle', 10)], [], 'nothing else fits: idle', len(plans)
    w_steps, w_props, _ = plans[0]
    if k > 0 or model != CAST[slug]:
        note_wanted(slug, model, w_steps, w_props, f'{model} plays {"/".join(c for c, _ in steps)}')
    CHOSEN[slug] = dict(character=char, stand_in=stand_in, model=model, pose_why=why, do=[[c, s] for c, s in steps],
                        props=props, note=note, plan=k, wanted=dict(character=CAST[slug], do=[c for c, _ in w_steps],
                                                                    props=w_props))
    return CHOSEN[slug]


def choose_walk(slug):
    char, stand_in, model, why = playing(slug)
    plans = WALK_PLANS[slug]
    for k, (clip, props, note) in enumerate(plans):
        if plan_ok(model, [(clip, 1)], props):
            break
    w_clip, w_props, _ = plans[0]
    if k > 0 or model != CAST[slug]:
        note_wanted(slug, model, [(w_clip, 1)], w_props, f'{model} plays {clip}')
    return dict(character=char, stand_in=stand_in, model=model, pose_why=why, clip=clip, props=props, note=note,
                plan=k, wanted=dict(character=CAST[slug], clip=w_clip, props=w_props))


# ---------------------------------------------------------------- animal bodies at real size
def hoof_facing(slug):
    a = ANIMALS[slug]['pts']
    return math.degrees(math.atan2(a['fore'][1] - a['hind'][1], a['fore'][0] - a['hind'][0]))


def body_of(slug, centre=None, ang=None):
    spec = ANIMAL_SPEC[slug]
    info = ANI.get(spec['model'], ANI['ox'])
    w = max(info['width_m'], LOAD_W.get(spec.get('load'), 0))
    c = centre or tuple(ANIMALS[slug]['pos'][:2])
    if centre is None and spec.get('nudge'):
        c = (c[0] + spec['nudge'][0], c[1] + spec['nudge'][1])
    a = ang if ang is not None else spec.get('facing_deg', hoof_facing(slug))
    hl, hw = info['length_m'] / 2, w / 2
    return dict(c=c, ang=a, hl=hl, hw=hw, poly=rect(c, a, hl, hw), model=spec['model'])


def body_circles(b):
    """people.js's body: circles of the body's half width along its length (here with the load's width)."""
    r = b['hw']
    n = max(1, round(2 * b['hl'] / (2 * r)))
    f, _ = fwd_left(b['ang'])
    offs = [0.0] if n == 1 else [-b['hl'] + r + i * (2 * b['hl'] - 2 * r) / (n - 1) for i in range(n)]
    return [((b['c'][0] + f[0] * o, b['c'][1] + f[1] * o), r) for o in offs]


def body_clear(b, what='walk', skip=()):
    """(room, obstacle) between an animal's body and the nearest built thing, and the walkable area's edge."""
    worst = (9.0, None)
    for c, r in body_circles(b):
        d, n = nearest_ob(c, 2.5, what, skip)
        if d - r < worst[0]:
            worst = (d - r, n)
        a = area_room(c) - r
        if a < worst[0]:
            worst = (a, 'the walkable area\'s edge')
    return worst


# ---------------------------------------------------------------- the convoys (walking groups along a guide line)
ROAD = Line(L['route']['centre'])
DONKEY_V = ANI['donkey']['walk']['speed_mps']
HORSE_V = ANI['horse']['walk']['speed_mps']
STRIDE = {   # each character's natural walk / run speed (m/s), measured on the web GLBs as people.js measures the
    # stride (the planted toe's slide): scratchpad S1_run2_casting/stride.mjs, 2026-10-12
    ('bearer', 'walk'): 1.465, ('bearer', 'run'): 4.082, ('inspector', 'walk'): 1.437, ('inspector', 'run'): 3.926,
    ('idler', 'walk'): 1.405, ('idler', 'run'): 3.874, ('hat_traveller', 'walk'): 1.472, ('carter', 'walk'): 1.441,
    ('porter', 'walk'): 1.371, ('robed_man', 'walk'): 1.51, ('townsman', 'walk'): 1.446}
# The charcoal train: 5 donkeys painted overlapping in a file 4.7 m long (D1 to D5), each 1.49 m long and 0.8 m wide
# across its panniers at real size, set out in their painted order along the road's centre line (S1.road.main, the
# train's path), D5 leading east, 1.9 m apart (the body and 0.4 m), in alternate lanes (D5 on the south side, as
# painted) 0.7 m apart: people.js's walkers treat a walking animal as an obstacle and steer round anything within
# 2.6 m ahead and 0.62 m aside of their line, so a donkey never has the one in front in its way (the next in its own
# lane is 3.8 m on). The east driver walks 1.4 m ahead of D5 in its lane, as painted at the train's east end (D5
# follows a walker ahead at full pace from 1.35 m); the west driver behind D1, beside its lane. The file is searched
# (its shift along the road, the west driver's side) for the longest walk clear of the trunks, the stream and the
# edges, then the least move; the positions are recorded moves (build_choices.json), as S6's teams set out at real size.
TRAIN_SPACINGS = (1.9, 1.8)                                 # the body (1.49 m) and 0.4 or 0.3 m
LANES = ((-0.36, 0.34), (-0.38, 0.31), (-0.41, 0.28))       # D5's (south) lane and the other: 0.69-0.70 m apart
TRAIN = ['donkey_charcoal_36745', 'donkey_charcoal_36666', 'donkey_charcoal_36508', 'donkey_charcoal_36410',
         'donkey_charcoal_36323']                     # D5 (front, east) to D1 (rear)
TRAIN_DRIVERS = ['charcoal_driver_36797', 'charcoal_driver_36250']
TRAVELLERS_GUIDE = Line(E[f'{S}.road.path_30300']['lines']['centre'] + [[294.32, 1.17], [296.0, 0.78], [297.89, 0.68],
                                                                          [300.16, 1.17], [301.81, 1.7]])
# The travellers ride east along their path (S1.road.path_30300), then on along the road it joins (S1.road.main's
# points from (294.32, 1.17)): the first donkey and its hooded rider, the walker with the staff, the second donkey and
# its rider, and the groom at its head, each at his painted station. Real size fits as painted (the needs list), so
# only the walker steps 0.7 m to the path's north side: between the two donkeys on its centre line he would walk 1.15 m
# behind the second donkey's rump, and people.js's walkers steer round an animal in their way and slow behind it.
TRAVELLERS = {'donkey_traveller_30216': 0.0, 'traveller_staff_30357': 0.7, 'donkey_traveller_30546': 0.0,
              'groom_leading_donkey_30648': 0.0}
WALKING_ANIMALS = set(TRAIN) | {a for a in TRAVELLERS if a in ANIMALS} | {'runaway_horse_30075'}
WALK_F, WALK_B, WALK_MAX = 6.0, 3.0, 7.0   # a short way along the painted direction (up to 6 m) and back past the
# spot (up to 3 m), 7 m in all (the skill: about 6-8 m)
PAUSE = ['idle', 4]            # people.js gives an animal's path ['idle', 4]: the people walking with them match it

# ---------------------------------------------------------------- static animals: clear of what is built
ANIMAL_WHY = {}
for a in ('ox_standing_29540', 'water_buffalo_lying_29462', 'far_ox_29515', 'horse_party_31023'):
    b0 = body_of(a)
    d0, hit = body_clear(b0, 'walk')
    if d0 >= 0.05:
        continue
    fa, _ = fwd_left(b0['ang'])
    best = None
    for k_ in range(1, 41):
        for sg in (1, -1):
            v = (sg * fa[0] * 0.05 * k_, sg * fa[1] * 0.05 * k_)
            if body_clear(body_of(a, (b0['c'][0] + v[0], b0['c'][1] + v[1])), 'walk')[0] >= 0.05:
                best = (v, sg, 0.05 * k_)
                break
        if best:
            break
    if best:
        v, sg, m = best
        ANIMAL_SPEC[a]['nudge'] = [round(v[0], 2), round(v[1], 2)]
        ANIMAL_WHY[a] = (f'at real size ({b0["model"]}, {2 * b0["hl"]:.2f} m long, {2 * b0["hw"]:.2f} m wide, against its '
                         f'painted hoof span {ANIMALS[a].get("length_m", 0):.2f} m) its body came {d0:+.2f} m from {hit}: '
                         f'it steps {m:.2f} m {"forward" if sg > 0 else "back"} along its own painted heading, the least '
                         f'that frees it')

# ---------------------------------------------------------------- nudges of the figures who stand (each with its reason)
NUDGE = {}


def nudge(slug, v, why):
    NUDGE[slug] = ([round(v[0], 2) + 0.0, round(v[1], 2) + 0.0], why)


def spot(slug):
    f = FIG[slug]
    n = NUDGE.get(slug, ([0, 0],))[0]
    return (f['X'] + n[0], f['D'] + n[1])


# the sedan's bearers: the kit's carried poles run 0.465 m either side of the chair's axis from its painted rear to
# its painted front (where the bearers are painted); sedan_carry holds the pole on the right shoulder, 0.18 m right of
# the body's centre line (S4's measure). Each bearer takes the pole on his right, 0.15 m inside its end.
sp = E[f'{S}.veh.sedan_willow_30805']['pts']
_axf = (sp['front'][0] - sp['rear'][0], sp['front'][1] - sp['rear'][1])
_axl = math.hypot(*_axf)
_axf = (_axf[0] / _axl, _axf[1] / _axl)
_axr = (_axf[1], -_axf[0])                           # the right of the chair's heading
for b, end, sg in (('sedan_bearer_front_30828', sp['front'], -1), ('sedan_bearer_rear_30990', sp['rear'], 1)):
    f = FIG[b]
    tgt = (end[0] + sg * 0.15 * _axf[0] + (0.465 - 0.18) * _axr[0], end[1] + sg * 0.15 * _axf[1] + (0.465 - 0.18) * _axr[1])
    nudge(b, (tgt[0] - f['X'], tgt[1] - f['D']),
          f'painted under the {"front" if sg < 0 else "rear"} end of the willow sedan\'s poles, carrying them (the sedan '
          f'is built carried and stands, S4\'s precedent): the kit\'s poles run 0.465 m either side of its axis, so he '
          f'stands with his right shoulder under the right-hand pole (sedan_carry holds it 0.18 m right of his centre '
          f'line), 0.15 m inside its end')


def clear_of_body(slug, body, gap, lead, prefer=None):
    """Nudge a standing figure out of an animal's real body (expanded by gap), the least move along or across it."""
    f = FIG[slug]
    p = spot(slug)
    fw, lf = fwd_left(body['ang'])
    rx, rd = p[0] - body['c'][0], p[1] - body['c'][1]
    a, s = rx * fw[0] + rd * fw[1], rx * lf[0] + rd * lf[1]
    ea, es = body['hl'] + gap, body['hw'] + gap
    if abs(a) >= ea or abs(s) >= es:
        return
    opts = {'rump': (fw[0] * (-ea - a), fw[1] * (-ea - a)), 'head': (fw[0] * (ea - a), fw[1] * (ea - a)),
            'left flank': (lf[0] * (es - s), lf[1] * (es - s)), 'right flank': (lf[0] * (-es - s), lf[1] * (-es - s))}
    where = prefer or min(opts, key=lambda k: math.hypot(*opts[k]))
    v = opts[where]
    cur = NUDGE.get(slug, ([0, 0],))[0]
    nudge(slug, (cur[0] + v[0], cur[1] + v[1]),
          f'{lead}: at real size ({body["model"]}, {2 * body["hl"]:.2f} m long, {2 * body["hw"]:.2f} m wide, at its '
          f'painted place) his spot fell inside its body; he steps {math.hypot(*v):.2f} m to stand {gap:.2f} m clear '
          f'of its {where}')


FAR_OX = body_of('far_ox_29515')
clear_of_body('far_figure_29466', FAR_OX, 0.3, 'one of the two small figures painted beside the far ox on the field bank',
              prefer='right flank')
clear_of_body('far_figure_29482', FAR_OX, 0.3, 'one of the two small figures painted beside the far ox on the field bank',
              prefer='left flank')
PARTY_HORSE = body_of('horse_party_31023')
clear_of_body('porter_boxes_30908', PARTY_HORSE, 0.3,
              'painted walking east beside the party\'s rider, at his horse\'s rump')


def apart(a, b, need, lead):
    """Two figures painted closer than two bodies: each steps back half the shortfall along the line between them."""
    pa, pb = spot(a), spot(b)
    d = math.dist(pa, pb)
    if d >= need:
        return
    u = ((pb[0] - pa[0]) / d, (pb[1] - pa[1]) / d) if d > 1e-6 else (1.0, 0.0)
    k = (need - d) / 2
    for s_, sg in ((a, -1), (b, 1)):
        cur = NUDGE.get(s_, ([0, 0],))[0]
        why = (f'{lead}: painted {d:.2f} m from {b if s_ == a else a}, closer than two bodies (0.52 m): each steps '
               f'{k:.2f} m back from the other')
        if s_ in NUDGE:
            why = NUDGE[s_][1] + '; then ' + why
        nudge(s_, (cur[0] + sg * u[0] * k, cur[1] + sg * u[1] * k), why)


apart('far_figure_29230', 'far_figure_29257', 0.6, 'the two small shapes crouching together in the far field')


# the seated stall customer. The map's point is his feet (est: "where a seated figure's feet would rest behind the
# table"); the small table stands 0.15 m south of them, beside him as he faces east to the standing man. His seated
# body is measured per clip: the carter's sit (the library chair sit on its original rig) keeps the root at the feet
# with the hips 0.30 m behind and 0.17 m left, seat 0.49; a local retarget (the hat traveller's and the farmer's drink
# and sit, from the scholar's) keeps the root under the hips with the toes about 0.38 m ahead, seat 0.45-0.48 (S4b's
# probes, tools/char_props.mjs --probe). His legs (hips to toes, 0.12 m thick) must clear the table's choice radius
# by 0.03 m: the least move on a 2 cm grid does it, and his hips sit on the hidden stool the builder adds inside his
# figure entity (cast.json seats: map/BUILDING.md rule 3, the seat of a figure painted seated).
HIPS = {('carter', 'sit'): (0.17, -0.30, 0.49, 0.06), ('scholar', 'drink'): (0.0, 0.02, 0.45, 0.33),
        ('hat_traveller', 'drink'): (0.0, 0.02, 0.45, 0.38), ('hat_traveller', 'sit'): (0.0, 0.02, 0.48, 0.38)}
# (left, forward, seat height, toes forward) from the root; a clip not probed: a local retarget (hips over the root)
SEATS = {}
_c = choose('stall_customer_29280')
_m, _clip = _c['model'], _c['do'][0][0]
_hl, _hf, _sh, _toe = HIPS.get((_m, _clip), (0.0, 0.02, 0.48, 0.38))
f = FIG['stall_customer_29280']
tab = E[f'{S}.prop.stall_table_small_29285']['pos']
fw, lf = fwd_left(f['facing_deg'])
tab_r = PROP_R['stall_table_small']


def _legs_room(root):
    h = (root[0] + _hf * fw[0] + _hl * lf[0], root[1] + _hf * fw[1] + _hl * lf[1])
    t = (root[0] + _toe * fw[0] + _hl * lf[0], root[1] + _toe * fw[1] + _hl * lf[1])
    return seg_dist(tab, h, t) - 0.12 - tab_r, h


_root0 = (f['X'], f['D'])
_best = None
if _legs_room(_root0)[0] < 0.03:
    for r_ in range(1, 60):
        for k_ in range(36):
            ang = 2 * math.pi * k_ / 36
            cand = (_root0[0] + 0.02 * r_ * math.cos(ang), _root0[1] + 0.02 * r_ * math.sin(ang))
            room, h = _legs_room(cand)
            if room >= 0.03 and nearest_ob(h, 1.0, 'stand', skip=('S1.bld.stall_annex_29350',
                                                                 'S1.prop.stall_table_small_29285'))[0] >= 0.2 \
                    and math.dist(h, (FIG['stall_man_29328']['X'], FIG['stall_man_29328']['D'])) >= 0.52:
                _best = cand
                break
        if _best:
            break
if _best:
    v = (_best[0] - _root0[0], _best[1] - _root0[1])
    nudge('stall_customer_29280', v,
          f'painted seated at the small table (S1.prop.stall_table_small_29285, choice radius {tab_r} m) just south of '
          f'his feet, facing east to the standing man; at real size his legs ({_m} {_clip}: hips {_hf:+.2f} m, toes '
          f'{_toe:.2f} m ahead of his spot) ran into it: he sits {math.hypot(*v):.2f} m off, the least move that clears '
          f'it, the table beside his knees')
q = spot('stall_customer_29280')
hips = (q[0] + _hf * fw[0] + _hl * lf[0], q[1] + _hf * fw[1] + _hl * lf[1])
SEATS['S1.fig.stall_customer_29280'] = dict(
    at=[round(hips[0], 2), round(hips[1], 2)], top=_sh, facing_deg=f['facing_deg'],
    clip=f'{_m} {_clip}',
    what='a low stool (choice: about 0.35 m across) under his hips, hidden behind the small table as painted, built '
         'inside his figure entity S1.fig.stall_customer_29280 (map/BUILDING.md rule 3); its top at the clip\'s seat '
         'height, or he hovers or sinks')

# ---------------------------------------------------------------- figures out of what is built
EXPECTED_INSIDE = {   # painted inside an open-fronted shed: the builder's open front lets them stand there
    ('stall_man_29328', 'S1.bld.stall_annex_29350'): 'painted standing under the stall\'s west eave (its open front)',
    ('stall_customer_29280', 'S1.bld.stall_annex_29350'): 'painted seated under the stall\'s lower west roof',
}
STANDING = [s for s in FIG if s not in WALK_PLANS and s not in RIDE]


def step_out(slug, need=0.25):
    """Nudge a standing figure the least distance (2 cm grid, any direction) until it is need metres clear of every
    built thing it may not stand in, of the animals' bodies and of the walkable area's edge."""
    q0 = spot(slug)

    def room(p):
        d, n = nearest_ob(p, 1.5, 'stand', skip=[o for (s_, o) in EXPECTED_INSIDE if s_ == slug])
        for a, b in STATIC_BODIES.items():
            dd = poly_dist(p, b['poly'])
            if dd < d:
                d, n = dd, f'animal {a}'
        if area_room(p) < d:
            d, n = area_room(p), 'the walkable area\'s edge'
        return d, n
    d0, n0 = room(q0)
    if d0 >= need:
        return None
    best = None
    for r_ in range(1, 60):
        for k_ in range(24):
            ang = 2 * math.pi * k_ / 24
            p = (q0[0] + 0.02 * r_ * math.cos(ang), q0[1] + 0.02 * r_ * math.sin(ang))
            if room(p)[0] >= need:
                best = p
                break
        if best:
            break
    if not best:
        return f'no room within 1.2 m ({d0:.2f} m from {n0})'
    cur = NUDGE.get(slug, ([0, 0],))[0]
    why = (f'as built, his spot was {"inside" if d0 <= 0 else f"{d0:.2f} m from"} {n0}: he steps '
           f'{math.dist(best, q0):.2f} m to stand {need:.2f} m clear of it')
    if slug in NUDGE:
        why = NUDGE[slug][1] + '; then ' + why
    nudge(slug, (cur[0] + best[0] - q0[0], cur[1] + best[1] - q0[1]), why)
    return None


STATIC_BODIES = {a: body_of(a) for a in ANIMAL_SPEC if a not in WALKING_ANIMALS}
SKIP_STEP = {'sedan_bearer_front_30828', 'sedan_bearer_rear_30990',   # under the poles by design (the cabin is clear)
             'stall_customer_29280'}                                    # seated: his legs and stool placed above
no_room = {}
for s in STANDING:
    if s in SKIP_STEP:
        continue
    r = step_out(s)
    if r:
        no_room[s] = r

# ---------------------------------------------------------------- the walkers: convoys and the chase
ANIMAL_PATHS, WALKS, WALK_WHY = {}, {}, {}
STAND_PTS = {s: spot(s) for s in STANDING}


def local_obs(pts, r=8.0):
    """The walk-blocking obstacles whose bounding box comes within r of the points' box."""
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs) - r, max(xs) + r, min(ys) - r, max(ys) + r
    out = []
    for o in OB:
        if not o['walk']:
            continue
        if o['kind'] == 'disc':
            qs = [o['shape'][0]]
        elif o['kind'] in ('poly', 'seg'):
            qs = o['shape']
        else:
            out.append(o)
            continue
        bx0, bx1 = min(q[0] for q in qs), max(q[0] for q in qs)
        by0, by1 = min(q[1] for q in qs), max(q[1] for q in qs)
        if bx1 >= x0 and bx0 <= x1 and by1 >= y0 and by0 <= y1:
            out.append(o)
    return out


def room_at(p, obs, skip=(), people_gap=0.17):
    """(room, what) from p to the nearest built thing, the walkable area's edge, a standing figure's body or a
    standing animal's real body."""
    d, n = 9.0, None
    for o in obs:
        if 'near' in o:
            dd, key = o['near'](p)
            if dd < d:
                d, n = dd, key
            continue
        dd = ob_dist(o, p)
        if dd < d:
            d, n = dd, o['name']
    if isinstance(n, tuple):
        n = BUILT.name(n)
    a = area_room(p)
    if a < d:
        d, n = a, 'the walkable area\'s edge'
    for s, q in STAND_PTS.items():
        if s in skip:
            continue
        dd = math.dist(p, q) - 0.26 - people_gap
        if dd < d:
            d, n = dd, f'figure {s} (+{people_gap} m)'
    for s, b in STATIC_BODIES.items():
        dd = poly_dist(p, b['poly'])
        if dd < d:
            d, n = dd, f'animal {s}'
    return d, n


def convoy_extent(members, guide, obs, fmax=WALK_F, bmax=WALK_B, step=0.1):
    """members: {id: (station, lane)} -> the largest f (forward) and b (back) every member can walk together, and what
    stops each, all clear of what is built, the walkable area's edge and who stands; None if the start isn't clear."""
    def ok(ds):
        for mid, (s, l) in members.items():
            p = guide.lane(s + ds, l)
            if mid in ANIMALS:
                t = guide.tangent(s + ds)
                for c, r in body_circles(body_of(mid, p, math.degrees(math.atan2(t[1], t[0])))):
                    d, n = room_at(c, obs)
                    if d - r < 0.08:
                        return f'{mid} at {ds:+.1f} m: its body {d - r:.2f} m from {n}'
            else:
                d, n = room_at(p, obs)
                if d < 0.3:
                    return f'{mid} at {ds:+.1f} m: {d:.2f} m from {n}'
        return None
    start = ok(0.0)
    if start:
        return None, start
    f, fstop = 0.0, ''
    while f + step <= fmax + 1e-9:
        why = ok(f + step)
        if why:
            fstop = why
            break
        f += step
    b, bstop = 0.0, ''
    while b + step <= min(bmax, WALK_MAX - f) + 1e-9:
        why = ok(-(b + step))
        if why:
            bstop = why
            break
        b += step
    return (round(f, 2), round(b, 2), fstop, bstop), None


# ---------------------------------------------------------------- the train at real size: search, then recorded moves
painted = {s: painted_xy(f'{S}.ani.{s}', ANIMALS[s]['pos']) for s in TRAIN}
painted.update({s: painted_xy(f'{S}.fig.{s}', (FIG[s]['X'], FIG[s]['D'])) for s in TRAIN_DRIVERS})
st_painted = {s: ROAD.station(painted[s]) for s in painted}
mean_st = sum(st_painted[s][0] for s in TRAIN) / len(TRAIN)
REAR = {'north': (-1.3, 'b'), 'south': (-1.0, 'a-0.7')}
REAR_WHY = {'north': 'in the other lane (north of D1\'s), 1.3 m behind D1 (D2, in his lane, is 3.1-3.2 m on)',
            'south': '0.7 m south of D1\'s lane, 1.0 m behind it'}


def train_at(shift, rear, sp, lanes):
    la, lb = lanes
    at = {s: (mean_st + shift + 2 * sp - i * sp, la if i % 2 == 0 else lb) for i, s in enumerate(TRAIN)}
    at['charcoal_driver_36797'] = (at[TRAIN[0]][0] + 1.4, la)
    al, side = REAR[rear]
    at['charcoal_driver_36250'] = (at[TRAIN[-1]][0] + al, lb if side == 'b' else la - 0.7)
    return at


def moves_of(at):
    out = {}
    for s, (st, lane) in at.items():
        q = ROAD.lane(st, lane)
        out[f'{S}.ani.{s}' if s in ANIMALS else f'{S}.fig.{s}'] = (round(q[0] - painted[s][0], 2), round(q[1] - painted[s][1], 2))
    return out


_tobs = local_obs([ROAD.at(mean_st + k) for k in (-8, 0, 8)], 6.0)
best, tried = None, []
for rear, sp, lanes in [(r_, s_, l_) for r_ in REAR for s_ in TRAIN_SPACINGS for l_ in LANES]:
    for k in range(-10, 13):
        shift = 0.25 * k
        at = train_at(shift, rear, sp, lanes)
        ext, bad = convoy_extent(at, ROAD, _tobs)
        mv = moves_of(at)
        mean_mv = sum(math.hypot(*v) for v in mv.values()) / len(mv)
        if ext is None:
            tried.append((shift, rear, None, bad))
            continue
        f, b, fs, bs = ext
        score = min(f, WALK_F) + 0.5 * min(b, WALK_B) - 0.5 * mean_mv
        tried.append((shift, rear, sp, lanes, (f, b), round(score, 2)))
        if best is None or score > best[0] + 1e-9:
            best = (score, shift, rear, at, ext, mv, sp, lanes)
assert best, 'the charcoal train finds no clear place on its road: ' + '; '.join(str(t) for t in tried)
# keep the layout the moves were recorded from while it stays clear and within 0.3 of the best (moves don't churn
# with every rebuild); cast.json `train` holds it
_prev = (J(f'gen/sections/{SEC}/cast.json', {}) or {}).get('train')
TRAIN_KEPT = ''
if _prev:
    _at = train_at(_prev['shift'], _prev['rear'], _prev['spacing'], tuple(_prev['lanes']))
    _ext, _bad = convoy_extent(_at, ROAD, _tobs)
    if _ext:
        _mv = moves_of(_at)
        _sc = min(_ext[0], WALK_F) + 0.5 * min(_ext[1], WALK_B) - 0.5 * sum(math.hypot(*v) for v in _mv.values()) / len(_mv)
        if _sc >= best[0] - 0.3:
            best = (_sc, _prev['shift'], _prev['rear'], _at, _ext, _mv, _prev['spacing'], tuple(_prev['lanes']))
            TRAIN_KEPT = f'kept the recorded layout (score {_sc:.2f}, best {max(t[-1] for t in tried if isinstance(t[-1], float)):.2f})'
    if not TRAIN_KEPT:
        TRAIN_KEPT = f'the recorded layout no longer serves ({_bad or "a better one scores 0.3 more"}): new moves'
_, T_SHIFT, T_REAR, TRAIN_AT, (TF, TB, TFS, TBS), MOVES_WANTED, TRAIN_S, (LANE_A, LANE_B) = best
for s, (st, lane) in TRAIN_AT.items():
    path = [[round(x, 2), round(y, 2)] for x, y in ROAD.lane_path(st - TB, st + TF, lane)]
    (ANIMAL_PATHS if s in ANIMALS else WALKS)[s] = path
TRAIN_WHY = (f'the charcoal train set out at real size (5 donkeys 1.49 m long, 0.8 m across the panniers, painted '
             f'overlapping in a 4.7 m file): in its painted order along S1.road.main, D5 leading east, {TRAIN_S} m apart, '
             f'the file {T_SHIFT:+.2f} m along the road from the painted donkeys\' mean, in alternate lanes ({LANE_A:+.2f} '
             f'and {LANE_B:+.2f} m off the road\'s centre line, D5 south); the east driver 1.4 m ahead of D5 in its lane, '
             f'the west driver {REAR_WHY[T_REAR]} (the longest walk clear of the trunks, the stream and the edges, then '
             f'the least move; gen/sections/countryside/make_people.py)')
moves_recorded = CHOICES.get('moves') or {}
moves_diff = {k: v for k, v in MOVES_WANTED.items()
              if abs((moves_recorded.get(k) or {}).get('dX', 0) - v[0]) > 0.011
              or abs((moves_recorded.get(k) or {}).get('dD', 0) - v[1]) > 0.011}
moves_applied = {k: v for k, v in MOVES_WANTED.items()
                 if abs((MOVED.get(k) or {}).get('dX', 0) - v[0]) <= 0.011 and abs((MOVED.get(k) or {}).get('dD', 0) - v[1]) <= 0.011}


def now_xy(slug):
    st, lane = TRAIN_AT[slug]
    return ROAD.lane(st, lane)


TRAIN_WALK_WHY = (f'the charcoal train walks east-south-east as painted (the lead, build_rules.md: every readable head '
                  f'is at the east end, against the title 赶驴入城) along S1.road.main past the small bridge\'s landing: '
                  f'{TF:.1f} m from each one\'s spot' + (f' (then {TFS})' if TFS else '') + f' and {TB:.1f} m back behind it'
                  + (f' (then {TBS})' if TBS else '') + f', in its painted order (D5 leading east, a driver at each '
                  f'end), all at the donkey\'s walking pace {DONKEY_V:.3f} m/s')
# the travellers
tv = {}
for s, lane in TRAVELLERS.items():
    xy = tuple(ANIMALS[s]['pos'][:2]) if s in ANIMALS else (FIG[s]['X'], FIG[s]['D'])
    tv[s] = (TRAVELLERS_GUIDE.station(xy)[0], lane)
_vobs = local_obs(TRAVELLERS_GUIDE.p, 4.0)
_ext, _bad = convoy_extent(tv, TRAVELLERS_GUIDE, _vobs)
assert _ext, f'the travellers\' start is not clear: {_bad}'
VF, VB, VFS, VBS = _ext
for s, (st, lane) in tv.items():
    path = [[round(x, 2), round(y, 2)] for x, y in TRAVELLERS_GUIDE.lane_path(st - VB, st + VF, lane)]
    (ANIMAL_PATHS if s in ANIMALS else WALKS)[s] = path
TRAV_WALK_WHY = (f'the travellers ride east as painted (both donkeys and the walker face east, away from the city) along '
                 f'S1.road.path_30300 and on along the road it joins: {VF:.1f} m from each one\'s spot'
                 + (f' (then {VFS})' if VFS else '') + f' and {VB:.1f} m back' + (f' (then {VBS})' if VBS else '')
                 + f', together at the donkey\'s pace {DONKEY_V:.3f} m/s; the standing traveller at the path\'s west end '
                 f'(traveller_standing_29996) stays, looking after them')

# the runaway horse: west as painted, straight along its painted heading, from its spot; never back east of it
HB = body_of('runaway_horse_30075')
hx = math.cos(math.radians(HB['ang'])), math.sin(math.radians(HB['ang']))
_hobs = local_obs([HB['c'], (HB['c'][0] + hx[0] * 7, HB['c'][1] + hx[1] * 7)], 4.0)
h_len, h_stop = 0.0, ''
for i in range(1, 71):
    c0 = (HB['c'][0] + hx[0] * 0.1 * i, HB['c'][1] + hx[1] * 0.1 * i)
    worst = min((room_at(c, _hobs)[0] - r, room_at(c, _hobs)[1]) for c, r in body_circles(dict(HB, c=c0)))
    if worst[0] < 0.1:
        h_stop = worst[1]
        break
    h_len = 0.1 * i
ANIMAL_PATHS['runaway_horse_30075'] = [[round(HB['c'][0], 2), round(HB['c'][1], 2)],
                                       [round(HB['c'][0] + hx[0] * h_len, 2), round(HB['c'][1] + hx[1] * h_len, 2)]]
# the line no groom crosses: the horse's rump at its east-most (its spot), plus a body and a gap
RUMP_X = HB['c'][0] - hx[0] * HB['hl']
GROOM_WEST = RUMP_X + 0.26 + 0.25
GROOM_V = 3.5
GROOMS = ('groom_chasing_30353', 'groom_chasing_30518', 'groom_chasing_30697')
# grooms painted in one lane (within 0.68 m: people.js's lane width) keep their painted spacing: the one behind turns
# where the one ahead turned plus that spacing, so they never stop on one spot
WEST_LINE = {}
for g in sorted(GROOMS, key=lambda x: FIG[x]['X']):
    mate = next((h for h in WEST_LINE if abs(FIG[h]['D'] - FIG[g]['D']) < 0.68), None)
    WEST_LINE[g] = (GROOM_WEST if not mate else WEST_LINE[mate][0] + FIG[g]['X'] - FIG[mate]['X'], mate)
for g in GROOMS:
    f = FIG[g]
    d = fwd_left(f['facing_deg'])[0]          # 180: west
    o = (f['X'], f['D'])
    gobs = local_obs([o], 7.0)
    west, mate = WEST_LINE[g]
    fwd, fstop = 0.0, (f'the line X {west:.2f} (the horse\'s rump at its spot + 0.51 m: no groom reaches it)' if not mate
                       else f'X {west:.2f}, where {mate}, painted {f["X"] - FIG[mate]["X"]:.1f} m ahead of him in his '
                            f'lane, turns, plus that spacing')
    for i in range(1, 41):
        q = (o[0] + d[0] * 0.1 * i, o[1] + d[1] * 0.1 * i)
        if q[0] < west - 1e-6:
            break
        dd, n = room_at(q, gobs)
        if dd < 0.3:
            fstop = n
            break
        fwd = 0.1 * i
        if fwd >= 4.0:
            fstop = ''
            break
    back, bstop = 0.0, ''
    for i in range(1, 61):
        q = (o[0] - d[0] * 0.1 * i, o[1] - d[1] * 0.1 * i)
        dd, n = room_at(q, gobs)
        if dd < 0.3:
            bstop = n
            break
        back = 0.1 * i
        if fwd + back >= 5.0:
            break
    # dir 1 walks toward the path's end: west first, as painted
    WALKS[g] = [[round(o[0] - d[0] * back, 2), round(o[1] - d[1] * back, 2)],
                [round(o[0] + d[0] * fwd, 2), round(o[1] + d[1] * fwd, 2)]]
    WALK_WHY[g] = (f'runs west after the runaway horse, as painted: {fwd:.1f} m west of his spot' +
                   (f' (to {fstop})' if fstop else '') + f', and {back:.1f} m back east behind it' +
                   (f' (to {bstop})' if bstop else '') + f', at {GROOM_V} m/s; the horse walks west from its spot and '
                   f'never comes back east of it, so no groom ever reaches it')
HORSE_WHY = (f'built whole (the S1 area agent; the user\'s question stays open): the registry horse at real size, no '
             f'tack, its lost front half supplied; it goes west as painted, {h_len:.1f} m from its spot along its '
             f'painted heading' + (f' (then {h_stop})' if h_stop else '') + f' and back, on walk (people.js plays `walk` '
             f'on every animal path, at the horse\'s {HORSE_V:.3f} m/s; the registry horse has walk, walk_low, '
             f'head_low, graze, lie and idle, no gallop): wanted, a procedural gallop on our rig (free) and a clip '
             f'option on people.js animal paths')

# ---------------------------------------------------------------- the built ground under everyone (a check)
# people.js drops a figure (and an animal) from the layout's H + 1.2 m, and a walker from 1.5 m above its last ground:
# the builder's ground_at.json says where the built ground stands above that (the ground agent keeps it within 1.0 m)
H_HIGH = {}


def lift(map_id, H_map, walker=False):
    z = GROUND_AT.get(map_id)
    if z is not None and z - H_map > (0.3 if walker else 1.0):
        H_HIGH[map_id] = (round(z, 2), H_map)
    return None


# ---------------------------------------------------------------- people.json
people = {
    'about': 'Who the countryside\'s people and animals are and what they do: every painted figure and animal of S1 '
             '(map/text/S1.md, u 29050-37610) at its mapped spot (layout.json), and nobody else (map/BUILDING.md). '
             'Written by gen/sections/countryside/make_people.py (the casting of gen/expand/countryside_needs.md and the '
             'lead\'s calls of 2026-10-12: everyone from the 22 existing characters); rerun it when the workshop '
             'delivers characters, clips and props, or when the builder rebuilds (its raw GLB\'s colliders, '
             'ground_at.json, placed.json). figures: character (the catalogue\'s target; a pose fallback where '
             'neither the target nor the interim can hold the pose yet: cast_why), stand_in (the interim cast until the '
             'target is built), do = [clip, seconds] cycles with clips the playing character has (clips_why: what is '
             'still to make), nudge = [dX, dD] (nudge_why), scale for children (scale_why), ride = the animal a rider '
             'sits on, props = carried prop_<name> parts (props_why). walkers: the charcoal train\'s drivers, '
             'the travellers on foot and the runaway horse\'s grooms, walking along their painted direction and back '
             '(walkers_why). animals: each painted animal at its map position facing hind to fore, model and load from '
             'web/public/assets/animals/animals.json; path = it walks (the charcoal train, the travellers\' donkeys, '
             'the runaway horse). No traffic.',
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'walkers_why': {}, 'animals': {}, 'animals_why': {},
    'clips_why': {}, 'scale_why': {}, 'cast_why': {}, 'props_why': {},
}
assert set(CAST) == set(FIG), f'cast and layout differ: {set(CAST) ^ set(FIG)}'
assert set(PLANS) | set(WALK_PLANS) == set(FIG) and not set(PLANS) & set(WALK_PLANS)
assert set(WALKS) == set(WALK_PLANS), f'walkers without a path: {set(WALK_PLANS) - set(WALKS)}'

cast_table = {}
props_note = {}
for slug in sorted(FIG, key=lambda s: FIG[s]['X']):
    f = FIG[slug]
    if slug in WALK_PLANS:
        c = choose_walk(slug)
        model = c['model']
        clip = c['clip']
        nat = STRIDE.get((model, 'run' if clip in ('run', 'chase_run') else 'walk'))
        speed = GROOM_V if slug.startswith('groom_chasing') else DONKEY_V
        w = {'id': slug, 'figure': slug, 'character': c['character']}
        if c['stand_in']:
            w['stand_in'] = c['stand_in']
        w.update({'clip': clip, 'speed': speed, 'pause': ['idle', 2] if slug.startswith('groom_chasing') else PAUSE,
                  'path': WALKS[slug]})
        if c['props']:
            w['props'] = c['props']
        lift(f['map_id'], f['H'], walker=True)
        people['walkers'].append(w)
        why = (TRAIN_WALK_WHY if slug in TRAIN_DRIVERS else TRAV_WALK_WHY if slug in TRAVELLERS else WALK_WHY[slug])
        if slug == 'traveller_staff_30357':
            why += '; he walks 0.7 m north of the path\'s centre line, beside the donkeys, not 1.15 m behind the second one\'s rump'
        if nat:
            why += f' ({clip} played at {speed / nat:.2f} of its natural {nat:.2f} m/s)'
        people['walkers_why'][slug] = why
        if c['note']:
            props_note[slug] = c['note']
        if c['pose_why']:
            people['cast_why'][slug] = c['pose_why']
        cast_table[slug] = {'wanted': c['wanted'], 'now': {'plays': model, 'clip': clip, 'props': c['props']},
                            'walks': round(sum(math.dist(a, b) for a, b in zip(WALKS[slug], WALKS[slug][1:])), 1)}
        continue
    c = choose(slug)
    spec = {'character': c['character']}
    if c['stand_in']:
        spec['stand_in'] = c['stand_in']
    spec['do'] = c['do']
    if c['props']:
        spec['props'] = c['props']
    if slug in RIDE:
        spec['ride'] = RIDE[slug]
    if slug in CHILD:
        frac, why = CHILD[slug]
        k = round(frac * 1.70 / height(c['model']), 2)
        spec['scale'] = k
        people['scale_why'][slug] = (f'{why}: {frac:.2f} of a 1.70 m man, on the {c["model"]} model ({height(c["model"]):.2f} '
                                     f'm) {k} = {k * height(c["model"]):.2f} m tall')
    if slug in NUDGE:
        spec['nudge'] = NUDGE[slug][0]
        people['nudge_why'][slug] = NUDGE[slug][1]
    lift(f['map_id'], f['H'])
    people['figures'][slug] = spec
    if c['note']:
        props_note[slug] = c['note']
    if c['pose_why']:
        people['cast_why'][slug] = c['pose_why']
    cast_table[slug] = {'wanted': c['wanted'], 'now': {'plays': c['model'], 'do': c['do'], 'props': c['props']}}
    if c['pose_why']:
        cast_table[slug]['why'] = c['pose_why']

HELD = {
    'the tomb-sweeping party': 'the willow sedan is built carried and does not move (S4\'s precedent, the lead '
                               '2026-10-12): its bearers play sedan_carry in place under its poles, and the porters '
                               'painted walking with it (porter_pole_31083, porter_walking_31070, '
                               'party_porter_staff_31131) hold with it; the rider (on the standing horse) and the porter '
                               'with the boxes face east as painted. Their walk waits for a procession routine on the '
                               'page (clips_why procession)',
    'the riders': 'traveller_rider_30165 and traveller_rider_30495 ride their walking donkeys (people.js seats a rider on '
                  'its animal every frame), rider_party_30988 his standing horse',
}
people['walkers_why']['held'] = HELD
people['cast_why'].update(CAST_WHY)
people['cast_why'].update({f'target {c}': w for c, w in NEW_CHAR.items() if c not in REG})
people['cast_why']['about'] = ('character = the catalogue\'s cast (gen/expand/round2/catalogue.md §7: farmer 9, straw_hat 3, '
                               'groom 3, the rest from the 22); stand_in = the needs list\'s cast by dress from the 22, '
                               'which world.js plays until the target is built. A figure in a pose (seated, riding, '
                               'crouching) whose target and interim both lack its clips plays the nearest character that '
                               'has one, written as its character (POSE in the script), until one of them can')

# animals
for a, sp_ in ANIMAL_SPEC.items():
    spec = {k: v for k, v in sp_.items() if k in ('model', 'load', 'do', 'nudge', 'scale', 'facing_deg')}
    if a in ANIMAL_PATHS:
        spec.pop('do', None)
        spec['path'] = ANIMAL_PATHS[a]
        if a in TRAIN and a not in [x.split('.')[-1] for x in moves_applied]:
            q = now_xy(a)
            spec['nudge'] = [round(q[0] - ANIMALS[a]['pos'][0], 2), round(q[1] - ANIMALS[a]['pos'][1], 2)]
    lift(f'{S}.ani.{a}', ANIMALS[a].get('H', 0), walker=a in ANIMAL_PATHS)
    people['animals'][a] = spec
people['animals_why'] = {
    'models': 'species, tack and load as painted (map/text/S1.md, needs list "Animals"), all at real size: the registry '
              'donkey with its pannier_charcoal (the charcoal train) and saddle_cloth (the travellers), the horse with '
              'its saddle (the party\'s rider) and bare (the runaway horse), the ox (yellow-dun) for the ox at the stall '
              'and the far ox',
    'water_buffalo_lying_29462': ('the registry has no buffalo: the ox lying (lie, head up on the chest) stands in for '
                                  'the big dark water buffalo lying in front of the stall, its head at the east end; '
                                  'wanted (workshop, free): a buffalo variant (body_from ox, dark slate tone about '
                                  'saturation 0.3 value 0.4, a kit-built horns_swept tack piece on the head bone: two '
                                  'long flat crescent horns sweeping back and up); this script uses it as soon as the '
                                  'registry has it' if ANIMAL_SPEC['water_buffalo_lying_29462']['model'] == 'ox'
                                  else 'the buffalo variant (ox body, slate tone, horns_swept)'),
    'ox_standing_29540': 'the pale brown ox standing before the stall\'s east end, facing us and a little west, its head '
                         'lowered between its forelegs: graze, with an idle',
    'far_ox_29515': 'low confidence (an ox at the plough, or a cart or brushwood pile): built as its recorded reading, '
                    'the registry ox standing (idle), with its two small figures beside its flanks',
    'runaway_horse_30075': HORSE_WHY,
    'horse_party_31023': 'the party\'s horse, painted walking east under its rider against the sedan\'s westward walk: '
                         'held with the party, standing (idle) with its saddle (tack_saddle, which the rider sits on)',
    'charcoal train': TRAIN_WALK_WHY + '. ' + TRAIN_WHY + ('' if not moves_diff else
                      '; the moves are not recorded yet: the donkeys stand at them by nudges meanwhile'),
    'travellers': TRAV_WALK_WHY,
    'walk clips': 'people.js plays `walk` on every animal path (at the registry\'s speed, pausing [idle, 4] at each end); '
                  'wanted: the donkey\'s walk_low (the head and neck hanging low, as the horse\'s, procedural and free) '
                  'for the four charcoal donkeys painted with their heads hanging (D5, D3, D2, D1) and the first '
                  'traveller\'s donkey, the horse\'s gallop for the runaway horse, and a clip option on animal paths',
    'pale_bird_34250': 'not built: ' + UNBUILT_ANIMALS['pale_bird_34250'] + ' (build_choices.json unbuilt)',
}
people['animals_why'].update(ANIMAL_WHY)

# clips_why
plans_ = {c: set(plan_of(c).get('clips', {})) for c in set(CAST.values())}
cw = {}
for clip, by in sorted(wanted_clips.items()):
    for ch, rows in sorted(by.items()):
        if ch not in REG:
            state = f'new character (catalogue), {"being made with it" if clip in plans_.get(ch, set()) else "to make with it"}'
        elif clip in clips(ch):
            state = 'has it'
        elif clip in plans_.get(ch, set()):
            state = f'being made (characters/{ch}.json)'
        elif (ch, clip) in FROM:
            state = f'to make, free: {FROM[(ch, clip)]}'
        else:
            state = 'to make (NEW take)' if clip in NEW_TAKE else 'to make'
        cw.setdefault(clip, []).append(f'{ch} [{state}]: ' + ', '.join(f'{s} ({now})' for s, now in rows))
people['clips_why'] = {
    'about': 'Actions the painting asks for that the wanted character lacks. "to make, free": a local retarget (from:) or '
             'a trimmed clip back from gen/; "NEW take": a Text to Motion take (10 credits once). Rerun make_people.py '
             'when they land; meanwhile each figure plays the nearest plan its character (or pose fallback) can.',
    **{clip: f'{WANT.get(clip, "")} -- ' + '; '.join(v) for clip, v in cw.items()},
    'procession': {
        'about': 'the tomb-sweeping party painted walking (the sedan west-south-west, its porters with it, the rider and '
                 'the porter with the boxes east): they hold now (no figure walks away from the carried sedan). Wanted on '
                 'the page: a group routine that walks the carried sedan a short way and back with its bearers at its '
                 'poles and the porters at their painted offsets, playing:',
        'sedan_bearer_front_30828': 'sedan_walk (bearer: trimmed, back free from gen/)',
        'sedan_bearer_rear_30990': 'sedan_walk (bearer: trimmed, back free from gen/)',
        'porter_pole_31083': 'carry_pole + pole_basket_branches (stand-in pole_baskets), west',
        'porter_walking_31070': 'walk, west',
        'party_porter_staff_31131': 'carry_pole + staff on the shoulder (a new binding), west',
        'porter_boxes_30908': 'carry_pole + pole_hampers (stand-in pole_boxes), east',
        'rider_party_30988': 'ride, on the horse walking east',
    },
}
# props_why
people['props_why'] = dict(props_note)
people['props_why']['wanted'] = {
    p: f'{NEW_PROP.get(p, "")} -- ' + '; '.join(f'{s} ({ch}: {st})' for s, ch, st in rows)
    for p, rows in sorted(wanted_props.items())}
people['props_why']['about'] = ('carried props as painted (needs list "Props carried by figures"), on only when the '
                                'playing character\'s GLB has prop_<name> and the figure plays only the clip that holds '
                                'it (characters/props.json); a stand-in prop is named in the figure\'s note')
# ---------------------------------------------------------------- checks
issues, info, expected = [], [], []
# standing figures against each other, animals, what is built
body = {s: spot(s) for s in STANDING}
scl = lambda s: people['figures'].get(s, {}).get('scale', 1)
ids = sorted(body)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        d = math.dist(body[a], body[b])
        if d < 0.26 * (scl(a) + scl(b)):
            issues.append(f'figures {a} and {b}: bodies {d:.2f} m apart')
for s in ids:
    p = body[s]
    for a, b in STATIC_BODIES.items():
        dd = poly_dist(p, b['poly'])
        if dd < 0.15:
            issues.append(f'figure {s} {dd:+.2f} m from animal {a}\'s real body')
    d, n = nearest_ob(p, 1.0, 'stand', skip=[o for (s_, o) in EXPECTED_INSIDE if s_ == s] + (
        [f'{S}.veh.sedan_willow_30805'] if s in SKIP_STEP else []) + (
        [f'{S}.prop.stall_table_small_29285'] if s == 'stall_customer_29280' else []))
    if s == 'stall_customer_29280':
        _r, _h = _legs_room(spot(s))
        (info if _r >= 0.0 else issues).append(f'seated {s} ({_m} {_clip}): his legs {_r:+.2f} m from the small table\'s '
                                               f'choice radius; hips at ({_h[0]:.2f}, {_h[1]:.2f}) on the stool, top {_sh} m')
    if n and d < 0.15:
        issues.append(f'figure {s} {d:+.2f} m from {n}')
    for (s_, o), why in EXPECTED_INSIDE.items():
        if s_ == s and any(x['name'] == o and ob_dist(x, p) < 0 for x in OB):
            expected.append(f'figure {s} stands inside {o} ({why})')
    if area_room(p) < 0.26:
        issues.append(f'figure {s} {area_room(p):.2f} m inside the walkable area\'s edge')
for s in no_room:
    issues.append(f'figure {s}: {no_room[s]}')
for a, b in STATIC_BODIES.items():
    d, n = body_clear(b)
    if d < 0.0:
        issues.append(f'animal {a} overlaps {n} by {-d:.2f} m (real size)')
    for c, r in body_circles(b):
        for o in STATIC_BODIES:
            if o != a and min(math.dist(c, c2) - r - r2 for c2, r2 in body_circles(STATIC_BODIES[o])) < 0:
                issues.append(f'animals {a} and {o} overlap (real size)')
# walkers' and animals' paths, against what is built and the people who stand
WALKING = set(WALKS) | set(ANIMAL_PATHS)


def path_pts(path, step=0.1):
    out = []
    for a, b in zip(path, path[1:]):
        n = max(1, int(math.dist(a, b) / step))
        out += [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n)]
    return out + [tuple(path[-1])]


for w in people['walkers']:
    worst = (9.0, None)
    for q in path_pts(w['path']):
        d, n = nearest_ob(q, 1.5)
        if area_room(q) < d:
            d, n = area_room(q), 'the walkable area\'s edge'
        for s in STANDING:
            dd = math.dist(q, spot(s)) - 0.26
            if dd < d:
                d, n = dd, f'figure {s}'
        for a, b in STATIC_BODIES.items():
            dd = poly_dist(q, b['poly'])
            if dd < d:
                d, n = dd, f'animal {a}'
        if d < worst[0]:
            worst = (d, n)
    (issues if worst[0] < 0.26 else info).append(f'walker {w["id"]}: path comes {worst[0]:.2f} m from {worst[1]}'
                                                 if worst[1] else f'walker {w["id"]}: nothing within 1.5 m of its path')
for a, path in ANIMAL_PATHS.items():
    b0 = body_of(a)
    worst = (9.0, None)
    for i, q in enumerate(path_pts(path)):
        pts = path_pts(path)
        j = min(i + 1, len(pts) - 1)
        k = max(i - 1, 0)
        ang = math.degrees(math.atan2(pts[j][1] - pts[k][1], pts[j][0] - pts[k][0]))
        bb = dict(b0, c=q, ang=ang)
        d, n = body_clear(bb)
        for s in STANDING:
            for c, r in body_circles(bb):
                dd = math.dist(c, spot(s)) - r - 0.26
                if dd < d:
                    d, n = dd, f'figure {s}'
        if d < worst[0]:
            worst = (d, n)
    (issues if worst[0] < 0.0 else info).append(f'animal {a}: path comes {worst[0]:.2f} m from {worst[1]}')
# the planner (people.js plan(): it looks LOOK 2.6 m ahead; it follows a person walking its way at its pace, slowing
# under 1.35 m, within 0.68 m of its line; it steers round an animal's body circles (registry width, not the load's)
# within 0.42 m + their radius): what each convoy member meets at its start, both ways
PL = []


def planner(group, guide, members, dirn):
    for a, (sa, la) in members.items():
        for b, (sb, lb) in members.items():
            if a == b:
                continue
            ds, side = (sb - sa) * dirn, (lb - la) * dirn
            if b in ANIMALS:
                info = ANI[ANIMAL_SPEC[b]['model']]
                r = info['width_m'] / 2
                n = max(1, round(info['length_m'] / (2 * r)))
                offs = [0.0] if n == 1 else [-info['length_m'] / 2 + r + i * (info['length_m'] - 2 * r) / (n - 1)
                                             for i in range(n)]
                hit = [ds + o for o in offs if -0.6 < ds + o < 2.6]
                if hit and abs(side) < r + 0.26 + 0.16:
                    PL.append(f'{group} {"out" if dirn > 0 else "back"}: {a} steers round {b} ({min(hit):.2f} m ahead, '
                              f'{side:+.2f} m aside)')
            elif 0.2 < ds < 1.35 and abs(side) < 0.68:
                PL.append(f'{group} {"out" if dirn > 0 else "back"}: {a} slows behind {b} ({ds:.2f} m ahead)')


for dirn in (1, -1):
    planner('train', ROAD, TRAIN_AT, dirn)
    planner('travellers', TRAVELLERS_GUIDE, tv, dirn)

# the details pass's contact fixes (sections/countryside/contact_fixes.json: solved nudges and turns, recasts, IK clip
# variants, root_h; gen/details/contacts/fix_standard.md) are applied last
import sys
sys.path.insert(0, os.path.join(QM, 'tools'))
from contact_fixes import apply as apply_contact_fixes
apply_contact_fixes(people, SEC)
# a walker who walks beside a painted walking animal, his hand on its load (contact_fixes.json "walkers": {id: {beside:
# {animal, gap, along}, why}}; read by world.js once 3d-director-04 lands the `beside` diff, ignored before;
# gen/details/contacts/fix_river/notes.md)
from contact_fixes import load as _load_contact_fixes
for _w in people.get('walkers', []):
    _wf = (_load_contact_fixes(SEC).get('walkers') or {}).get(_w.get('id'))
    if _wf and 'beside' in _wf:
        _w['beside'] = _wf['beside']
        people.setdefault('walkers_why', {})[_w['id']] = _wf.get('why', '') + (
            ' || casting: ' + people['walkers_why'][_w['id']] if people.get('walkers_why', {}).get(_w['id']) else '')
out = os.path.join(QM, f'sections/{SEC}/people.json')
json.dump(people, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
cast_out = os.path.join(HERE, 'cast.json')
json.dump({'about': 'S1\'s cast (written by make_people.py; rerun it after a workshop delivery or a build): for each '
                    'painted figure what the needs list wants (character, clips, props) and what plays now; the seats '
                    'the builder adds inside figure entities (map/BUILDING.md rule 3); the moves the train wants',
           'figures': cast_table,
           'seats': SEATS,
           'moves_wanted': {k: {'dX': v[0], 'dD': v[1]} for k, v in MOVES_WANTED.items()},
           'train': {'shift': T_SHIFT, 'rear': T_REAR, 'spacing': TRAIN_S, 'lanes': [LANE_A, LANE_B],
                     'walk': [TF, TB], 'about': 'the charcoal train\'s layout the moves come from (kept while it serves)'},
           'builder_assumptions': {
               'sedan': 'S1.veh.sedan_willow_30805 from kit_vehicles.sedan_chair(front, rear, carried=True) at its '
                        'defaults (cabin 0.92 x 0.78 m at cabin_at 0.5, poles 0.465 m either side at 1.3 m): the bearers '
                        'stand under the right-hand pole, 0.15 m inside its ends',
               'lead rope': 'the second travellers\' donkey walks with the groom 1.6 m ahead at its head: a rope from his '
                            'hands to its halter can\'t be a static builder line while they walk (needs list: "a '
                            'builder\'s line"); the robed man\'s lead_rope prop comes on when his lead clip is back',
               'stall stool': 'cast.json seats: the stall customer\'s hidden stool',
               'solids': 'the script tests against gen/sections/countryside/solids.json when the builder writes one '
                         '(S7\'s format: collider cells per owner at body height, seats, walk); until then the layout\'s '
                         'footprints, lines and props at the choice radii in PROP_R',
           }}, open(cast_out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print(f'geometry from {SOURCE}; walkable area from {AREA_SRC}; ground_at.json: '
      f'{"%d entries" % len(GROUND_AT) if GROUND_AT else "not written yet"}')
nf, nw = len(people['figures']), len(people['walkers'])
print(f'{nf} figures at their spots, {nw} walkers ({nf + nw} of {len(FIG)}), '
      f'{sum(1 for f in people["figures"].values() if f.get("ride"))} riders, {len(people["animals"])} animals '
      f'(of {len(ANIMALS)}; {len(ANIMAL_PATHS)} walking)')
for s, f in sorted(people['figures'].items(), key=lambda kv: FIG[kv[0]]['X']):
    print(f'  {s:28s} {f["character"]:14s} {f["do"]} {f.get("props", "")} {f.get("ride", "")} {f.get("nudge", "")} '
          f'{f.get("scale", "")}')
for w in people['walkers']:
    print(f'  walk {w["id"]:28s} {w["character"]:14s} {w["clip"]} {w["speed"]} m/s '
          f'{sum(math.dist(a, b) for a, b in zip(w["path"], w["path"][1:])):.1f} m {w.get("props", "")} '
          f'{w["path"][0]} -> {w["path"][-1]}')
for a, p in ANIMAL_PATHS.items():
    print(f'  animal path {a:28s} {sum(math.dist(x, y) for x, y in zip(p, p[1:])):.1f} m {p[0]} -> {p[-1]}')
print(f'train layout: shift {T_SHIFT:+.2f}, rear {T_REAR}, spacing {TRAIN_S}, lanes {LANE_A}/{LANE_B}; {TRAIN_KEPT}')
print(f'train: f {TF} b {TB} ({TFS or "-"} | {TBS or "-"}); travellers: f {VF} b {VB} ({VFS or "-"} | {VBS or "-"}); '
      f'horse {h_len:.1f} m ({h_stop or "-"})')
for s, (v, why) in NUDGE.items():
    print(f'  nudge {s} {v}: {why[:170]}')
for a, w in ANIMAL_WHY.items():
    print(f'  animal nudge {a} {ANIMAL_SPEC[a].get("nudge")}: {w[:150]}')
print('moves wanted (build_choices.json moves):')
for k, v in MOVES_WANTED.items():
    print(f'   {k}: dX {v[0]} dD {v[1]}' + ('' if k not in moves_diff else '   <- NOT RECORDED/DIFFERENT')
          + ('' if k in moves_applied else '   (not applied in layout.json yet)'))
print('built ground above where people.js drops them (ground_at.json):', H_HIGH or 'none')
print('planner (people.js) at the start:', 'nothing in anyone\'s way' if not PL else '')
for x in PL:
    print('   ', x)
print('expected (painted so):')
for x in expected:
    print('   ', x)
print('info:')
for x in info:
    print('   ', x)
print('checks:', 'none' if not issues else '')
for x in issues:
    print('   ', x)
print('to make:', ', '.join(k for k in people['clips_why'] if k not in ('about', 'procession')))
print('props wanted:', ', '.join(people['props_why']['wanted']))
print('wrote', os.path.relpath(out, QM), 'and', os.path.relpath(cast_out, QM))
